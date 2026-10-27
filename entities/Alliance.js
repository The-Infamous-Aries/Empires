/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ALLIANCE ENTITY
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Individual alliance with members, government structure, skills, and progression
 */

class Alliance {
    constructor(allianceId, founderId, allianceData = {}) {
        // ── Identity ───────────────────────────────────────────────────────
        this.id = allianceId;
        this.name = allianceData.name || 'New Alliance';
        this.acronym = allianceData.acronym || '';
        this.description = allianceData.description || '';
        this.founded = Date.now();
        this.foundedDay = window.TimeSystem ? TimeSystem.getCurrentDay() : 0;
        
        // ── Government Structure ──────────────────────────────────────────
        this.governmentType = allianceData.governmentType || 'democratic';
        this.government = {
            structure: null, // Set by setupGovernment()
            roles: new Map(), // roleId -> { members: [], permissions: [], requirements: {} }
            customRoles: [], // User-defined roles for custom government
            founder: founderId,
            currentLeaders: new Map() // roleId -> nationId
        };
        
        // ── Members ───────────────────────────────────────────────────────
        this.members = new Map(); // nationId -> memberData
        this.memberHistory = []; // Track joins/leaves
        this.memberLimit = 6; // Base limit, upgradeable
        this.invitations = new Map(); // pendingInvitations
        
        // ── Skills & Progression ──────────────────────────────────────────
        this.level = 1;
        this.experience = 0;
        this.totalExperience = 0;
        this.experienceToNext = this.calculateXpToNext(1);
        this.skillPoints = 0;
        this.skills = {};
        
        // ── Customization ─────────────────────────────────────────────────
        this.customization = {
            banner: { url: null, enabled: false },
            flag: { design: null, colors: [], enabled: false },
            nameStyle: {
                font: 'default',
                color: '#ffffff',
                outlineColor: '#000000',
                enabled: false
            },
            memberLevelsStyle: {
                font: 'default', 
                color: '#cccccc',
                enabled: false
            },
            emblem: { design: null, enabled: false },
            theme: { palette: 'default', enabled: false }
        };
        
        // ── Diplomacy & Relations ─────────────────────────────────────────
        this.treaties = []; // Alliance-wide treaties
        this.relations = new Map(); // allianceId -> relationship data
        this.diplomaticStance = 'neutral'; // neutral, aggressive, defensive, isolationist
        
        // ── War & Military ────────────────────────────────────────────────
        this.warParticipation = new Map(); // warId -> participation data
        this.militaryCoordination = {
            activeOperations: [],
            coordinatedAttacks: 0,
            defensePacts: new Map()
        };
        
        // ── Statistics ────────────────────────────────────────────────────
        this.statistics = {
            warsWon: 0,
            warsLost: 0,
            treatiesSigned: 0,
            territoryGained: 0,
            totalDamageDealt: 0,
            membersRecruited: 0,
            projectsCompleted: 0
        };

        // ── Per-member stat snapshots for alliance leaderboards ─────────────
        this.memberStats = new Map(); // nationId -> { money, taxRevenue, militaryStrength, religion, ... }
        
        this.initializeSkills();
        this.bindEvents();
    }
    
    /**
     * Initialize alliance skills to level 0
     */
    initializeSkills() {
        if (!window.AllianceSystem) return;
        
        Object.keys(AllianceSystem.allianceSkills).forEach(skillKey => {
            this.skills[skillKey] = {
                level: 0,
                pointsSpent: 0,
                effects: {}
            };
        });
    }
    
    /**
     * Set up government structure based on template
     */
    setupGovernment(templateName) {
        if (!window.AllianceSystem) return;

        const template = AllianceSystem.governmentTemplates[templateName];
        if (!template) return;

        this.governmentType = templateName;

        // Deep clone template structure to avoid mutating shared templates
        this.government.structure = JSON.parse(JSON.stringify(template));

        // Initialize roles from template
        (template.roles || []).forEach(role => {
            this.government.roles.set(role.id, {
                members: [],
                permissions: role.permissions,
                requirements: role.requirements || {},
                maxCount: role.maxCount || (role.unique ? 1 : 999)
            });
        });

        // Custom alliances always get at least a base 'member' role
        if (templateName === 'custom' && !this.government.roles.has('member')) {
            this.government.roles.set('member', {
                members: [],
                permissions: ['basic'],
                requirements: {},
                maxCount: 999
            });
        }
    }
    
    /**
     * Add member to alliance
     */
    addMember(nationId, memberType = 'member') {
        const memberData = {
            nationId: nationId,
            joinDate: Date.now(),
            memberType: memberType, // founder, coFounder, foundingMember, member
            role: this.getDefaultRole(memberType),
            contributions: {
                xp: 0,
                resources: 0,
                wars: 0,
                diplomacy: 0
            },
            permissions: this.getRolePermissions(this.getDefaultRole(memberType))
        };
        
        this.members.set(nationId, memberData);
        this.assignRole(nationId, memberData.role);

        // Theocracy: force new member's religion to match the current High Priest
        if (this.governmentType === 'theocracy' && window.ReligionSystem) {
            const highPriestRole = this.government.roles.get('highPriest');
            const priestId = highPriestRole && highPriestRole.members[0];
            if (priestId) {
                const priestNation = this.getNation(priestId);
                if (priestNation && priestNation.religion) {
                    const nation = this.getNation(nationId);
                    if (nation && nation.religion !== priestNation.religion) {
                        nation.religion = priestNation.religion;
                        window.ReligionSystem.applyReligionBonuses(nation, priestNation.religion);
                    }
                }
            }
        }

        // Update member history
        this.memberHistory.push({
            action: 'joined',
            nationId: nationId,
            date: Date.now(),
            memberType: memberType
        });
        
        EventBus.emit('alliance_member_added', {
            allianceId: this.id,
            nationId: nationId,
            memberType: memberType
        });
    }

    /**
     * Remove a member from the alliance (kick/leave/exile).
     * Removes from roles, clears allianceId on the nation, and logs the action.
     */
    removeMember(nationId, reason = 'left') {
        const member = this.members.get(nationId);
        if (!member) return false;

        // Prevent leaving the alliance leaderless: if removing the only 'all' permission holder,
        // require another member to already hold 'all' (or be assigned) first.
        // Exception: if this is the only member, allow removal (alliance will disband).
        const isLastMember = this.members.size === 1;
        if (!isLastMember && member.permissions.includes('all')) {
            const otherAllHolders = [];
            this.members.forEach((m, nid) => {
                if (nid !== nationId && m.permissions.includes('all')) {
                    otherAllHolders.push(nid);
                }
            });
            if (otherAllHolders.length === 0) {
                throw new Error('Cannot remove the only leadership role with full permissions; alliance would be left leaderless');
            }
        }

        // Remove from all roles
        this.government.roles.forEach(role => {
            const index = role.members.indexOf(nationId);
            if (index !== -1) {
                role.members.splice(index, 1);
            }
        });

        // Clear currentLeaders if this nation was a leader (only track unique roles)
        this.government.currentLeaders.forEach((leaderId, roleId) => {
            if (leaderId === nationId) {
                this.government.currentLeaders.delete(roleId);
            }
        });

        // Remove from members map
        this.members.delete(nationId);

        // Clear nation's allianceId
        const nation = this.getNation(nationId);
        if (nation) {
            nation.allianceId = null;
        }

        // Record in history
        this.memberHistory.push({
            action: reason === 'kicked' ? 'kicked' : reason === 'exiled' ? 'exiled' : 'left',
            nationId: nationId,
            date: Date.now(),
            reason: reason
        });

        EventBus.emit('alliance_member_removed', {
            allianceId: this.id,
            nationId: nationId,
            reason: reason
        });

        return true;
    }

    /**
     * Kick a member from the alliance.
     */
    kickMember(nationId) {
        return this.removeMember(nationId, 'kicked');
    }

    /**
     * Leave the alliance (member-initiated).
     */
    leaveAlliance(nationId) {
        return this.removeMember(nationId, 'left');
    }

    /**
     * Exile a member from the alliance (admin/leadership action).
     */
    exileMember(nationId) {
        return this.removeMember(nationId, 'exiled');
    }

    /**
     * Get default role for member type
     */
    getDefaultRole(memberType) {
        switch (memberType) {
            case 'founder':
                return this.governmentType === 'democratic' ? 'president' :
                       this.governmentType === 'trio' ? 'triumvir1' :
                       this.governmentType === 'autocratic' ? 'supremeLeader' :
                       this.governmentType === 'fellowship' ? 'foundingFellow' :
                       this.governmentType === 'oligarchy' ? 'oligarch' :
                       this.governmentType === 'militaryJunta' ? 'warlord' :
                       this.governmentType === 'theocracy' ? 'highPriest' :
                       this.governmentType === 'republic' ? 'citizen' :
                       this.governmentType === 'hiveMind' ? 'servant' :
                       this.governmentType === 'honorTribe' ? 'grandChief' :
                       this.governmentType === 'custom' ? 'member' : 'leader';
            case 'coFounder':
                return this.governmentType === 'democratic' ? 'vicePresident' :
                       this.governmentType === 'trio' ? 'triumvir2' :
                       this.governmentType === 'autocratic' ? 'warMinister' : 'coLeader';
            case 'foundingMember':
                return this.governmentType === 'democratic' ? 'secDefense' :
                       this.governmentType === 'trio' ? 'lieutenant' :
                       this.governmentType === 'autocratic' ? 'officer' : 'officer';
            case 'foundingFellow':
                return 'foundingFellow';
            default:
                return this.governmentType === 'republic' ? 'citizen' :
                       this.governmentType === 'hiveMind' ? 'servant' :
                       this.governmentType === 'honorTribe' ? 'member' : 'member';
        }
    }
    
    /**
     * Assign role to member
     */
    assignRole(nationId, roleId) {
        const roleData = this.government.roles.get(roleId);
        if (!roleData) return false;
        
        // Check if role is full
        if (roleData.members.length >= roleData.maxCount) return false;
        
        // Remove from previous role
        this.government.roles.forEach(role => {
            const index = role.members.indexOf(nationId);
            if (index !== -1) {
                role.members.splice(index, 1);
            }
        });
        
        // Add to new role
        roleData.members.push(nationId);
        // Only track unique-role leaders in currentLeaders
        if (roleData.unique) {
            this.government.currentLeaders.set(roleId, nationId);
        }
        
        // Update member data
        const member = this.members.get(nationId);
        if (member) {
            member.role = roleId;
            member.permissions = this.getRolePermissions(roleId);
        }
        
        return true;
    }
    
    /**
     * Get permissions for a role
     */
    getRolePermissions(roleId) {
        const roleData = this.government.roles.get(roleId);
        return roleData ? roleData.permissions : ['basic'];
    }
    
    /**
     * Check if member has permission
     */
    hasPermission(nationId, permission) {
        const member = this.members.get(nationId);
        if (!member) return false;
        
        return member.permissions.includes('all') || member.permissions.includes(permission);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EXPERIENCE & SKILL SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Add experience to alliance
     */
    addExperience(amount, source = '', details = {}) {
        this.experience += amount;
        this.totalExperience += amount;
        
        // Check for level up
        while (this.experience >= this.experienceToNext && this.level < 100) {
            this.levelUp();
        }
        
        EventBus.emit('alliance_experience_gained', {
            allianceId: this.id,
            amount: amount,
            source: source,
            details: details,
            newLevel: this.level
        });
    }
    
    /**
     * Level up alliance
     */
    levelUp() {
        this.experience -= this.experienceToNext;
        this.level++;
        this.skillPoints += 3; // 3 skill points per level
        this.experienceToNext = this.calculateXpToNext(this.level);
        
        EventBus.emit('alliance_level_up', {
            allianceId: this.id,
            newLevel: this.level,
            skillPointsGained: 3
        });
    }
    
    /**
     * Calculate XP needed for next level
     */
    calculateXpToNext(level) {
        return Math.floor(1000 * Math.pow(1.15, level - 1));
    }
    
    /**
     * Upgrade alliance skill
     */
    upgradeSkill(skillKey, levels = 1) {
        if (!window.AllianceSystem) return false;
        
        const skillDef = AllianceSystem.allianceSkills[skillKey];
        const currentSkill = this.skills[skillKey];
        
        if (!skillDef || !currentSkill) return false;
        
        const newLevel = currentSkill.level + levels;
        
        // Check level limits
        if (newLevel > skillDef.maxLevel) return false;
        
        // Calculate cost
        let totalCost = 0;
        for (let i = currentSkill.level; i < newLevel; i++) {
            const cost = Math.floor(skillDef.baseCost * Math.pow(skillDef.costMultiplier, i));
            totalCost += cost;
        }
        
        // Check if alliance has enough skill points
        if (this.skillPoints < totalCost) return false;
        
        // Apply upgrade
        this.skillPoints -= totalCost;
        currentSkill.level = newLevel;
        currentSkill.pointsSpent += totalCost;
        currentSkill.effects = skillDef.effects(newLevel);
        
        // Apply skill effects
        this.applySkillEffects(skillKey);
        
        EventBus.emit('alliance_skill_upgraded', {
            allianceId: this.id,
            skill: skillKey,
            newLevel: newLevel,
            cost: totalCost
        });
        
        return true;
    }
    
    /**
     * Apply skill effects to alliance and all member nations
     */
    applySkillEffects(skillKey) {
        const skillData = this.skills[skillKey];
        if (!skillData || !skillData.effects) return;

        const effects = skillData.effects;

        switch (skillKey) {
            case 'roster':
                this.memberLimit = effects.memberLimit || 6;
                break;

            case 'customization':
                this.updateCustomizationOptions(effects.customOptions);
                break;

            case 'combatOffensive':
            case 'combatDefensive':
            case 'marksmanship':
            case 'fortune':
            case 'criticalStrike':
            case 'criticalEye':
            case 'expansion':
            case 'upkeepReduction':
            case 'technology':
            case 'unity':
            case 'intelligence':
                // These skills apply bonuses to all member nations
                this.applyMemberBonuses();
                break;

            case 'diplomacy':
                // Applied during treaty negotiations via AllianceSystem.getAllianceBonus
                break;
        }
    }

    /**
     * Apply all alliance skill bonuses to every member nation.
     * This modifies each nation object by adding/updating _allianceBonuses.
     */
    applyMemberBonuses() {
        if (!window.AllianceSystem) return;

        this.members.forEach((memberData, nationId) => {
            window.AllianceSystem.applyAllianceBonusesToNation(nationId);
        });
    }

    /**
     * Get a specific alliance bonus for a member nation.
     * Delegates to AllianceSystem.getAllianceBonus.
     */
    getMemberBonus(nationId, bonusType) {
        if (!window.AllianceSystem) return 0;
        return window.AllianceSystem.getAllianceBonus(nationId, bonusType);
    }

    /**
     * Get all alliance bonuses for a member nation.
     */
    getMemberAllBonuses(nationId) {
        if (!window.AllianceSystem) return {};
        return window.AllianceSystem.getAllAllianceBonuses(nationId);
    }

    /**
     * Get a member nation's full financial / revenue breakdown (delegates to AllianceSystem).
     * Viewer must hold an economic permission in this alliance.
     */
    getMemberFinancialBreakdown(viewerNationId, targetNationId) {
        if (!window.AllianceSystem) throw new Error('AllianceSystem not initialized');
        return window.AllianceSystem.getMemberFinancialBreakdown(viewerNationId, targetNationId);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // ALLIANCE LEADERBOARD / MEMBER STAT TRACKING
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * Snapshot and store current stats for all members (called daily).
     * Captures money, taxRevenue, militaryStrength, religion, happiness, stability, etc.
     */
    updateMemberStats() {
        this.members.forEach((memberData, nationId) => {
            const nation = this.getNation(nationId);
            if (!nation) return;

            const upkeepTotal =
                (nation.buildingUpkeep &&
                    nation.buildingUpkeep.improvements !== undefined
                    ? nation.buildingUpkeep.improvements +
                        nation.buildingUpkeep.projects +
                        nation.buildingUpkeep.wonders
                    : 0) || 0;
            const netRevenue =
                (nation.taxRevenue || 0) -
                (nation.militaryBudget || 0) -
                upkeepTotal;

            this.memberStats.set(nationId, {
                nationId: nation.id,
                nationName: nation.name || nation.id,
                role: memberData.role,
                memberType: memberData.memberType,
                joinDate: memberData.joinDate,
                money: nation.money || 0,
                taxRevenue: nation.taxRevenue || 0,
                taxableIncome: nation.taxableIncome || 0,
                totalTaxEarned: nation.totalTaxEarned || 0,
                gdp: nation.gdp || 0,
                netRevenue,
                militaryBudget: nation.militaryBudget || 0,
                militaryStrength: nation.militaryStrength || 0,
                religion: nation.religion || 'monotheism',
                happiness: nation.happiness || 0,
                stability: nation.stability || 0,
                debt: nation.debt || 0,
                tech: nation.tech || 0,
                population: nation.population || 0,
                lastActive: nation.lastActive || null,
                timestamp: Date.now()
            });
        });
    }

    /**
     * Get a ranked leaderboard for a specific stat metric.
     * @param {string} metric - 'money', 'taxRevenue', 'netRevenue', 'militaryStrength', 'gdp', 'population', 'tech', 'happiness', 'stability'
     * @param {boolean} descending - highest first (default true)
     * @param {number} limit - max entries returned
     * @returns {Array} sorted array of stat snapshots
     */
    getLeaderboard(metric, descending = true, limit = null) {
        const stats = Array.from(this.memberStats.values());
        stats.sort((a, b) => {
            const av = a[metric] || 0;
            const bv = b[metric] || 0;
            return descending ? bv - av : av - bv;
        });
        if (limit) return stats.slice(0, limit);
        return stats;
    }

    /**
     * Get a nation's rank for a specific stat metric (1 = top).
     * @returns {number|null} rank position or null if not found
     */
    getMemberRank(nationId, metric, descending = true) {
        const leaderboard = this.getLeaderboard(metric, descending);
        const index = leaderboard.findIndex(entry => entry.nationId === nationId);
        return index === -1 ? null : index + 1;
    }

    /**
     * Get stats snapshot for a specific member nation.
     */
    getMemberStats(nationId) {
        return this.memberStats.get(nationId) || null;
    }
    
    /**
     * Update customization options based on skill level
     */
    updateCustomizationOptions(customOptions) {
        if (!customOptions) return;

        const keyMap = {
            customBanner: 'banner',
            customFlag: 'flag',
            allianceNameFont: 'nameStyle',
            allianceNameColor: 'nameStyle',
            allianceNameOutline: 'nameStyle',
            memberLevelsFont: 'memberLevelsStyle',
            memberLevelsColor: 'memberLevelsStyle',
            customEmblem: 'emblem',
            themePalette: 'theme',
            fullyCustomizable: 'banner' // Last unlock enables all
        };

        customOptions.forEach(option => {
            const key = keyMap[option];
            if (key && this.customization[key]) {
                this.customization[key].enabled = true;
            }
        });
    }
    
    /**
     * Get active member count
     */
    getActiveMemberCount() {
        let activeCount = 0;
        this.members.forEach((memberData, nationId) => {
            const nation = this.getNation(nationId);
            if (nation && this.isNationActive(nation)) {
                activeCount++;
            }
        });
        return activeCount;
    }
    
    /**
     * Check if nation is active (logged in within 7 days)
     */
    isNationActive(nation) {
        if (!nation.lastActive) return false;
        const daysSinceActive = (Date.now() - nation.lastActive) / (1000 * 60 * 60 * 24);
        return daysSinceActive <= 7;
    }
    
    /**
     * Process daily alliance effects
     */
    processDailyEffects() {
        // Apply all skill bonuses to member nations
        this.applyMemberBonuses();

        // Apply unity-specific bonuses (happiness, crime, disease)
        const unitySkill = this.skills.unity;
        if (unitySkill && unitySkill.level > 0) {
            this.applyUnityBonuses();
        }

        // Update member activity tracking
        this.updateMemberActivity();
    }
    
    /**
     * Apply unity bonuses to all members (happiness, crime reduction, disease reduction)
     */
    applyUnityBonuses() {
        const unitySkill = this.skills.unity;
        if (!unitySkill || unitySkill.level === 0) return;

        const effects = unitySkill.effects;
        if (!effects) return;

        this.members.forEach((memberData, nationId) => {
            const nation = this.getNation(nationId);
            if (!nation) return;

            // Apply happiness boost
            if (effects.happinessBoost) {
                nation.happiness = Math.min(100, (nation.happiness || 50) + effects.happinessBoost);
            }

            // Apply crime reduction
            if (effects.crimeReduction) {
                nation.crime = Math.max(0, (nation.crime || 0) - (nation.crime || 0) * effects.crimeReduction);
            }

            // Apply disease reduction
            if (effects.diseaseReduction) {
                // Reduce disease duration or severity
                if (nation.diseases) {
                    nation.diseases.forEach(disease => {
                        disease.duration = Math.max(0, disease.duration - effects.diseaseReduction);
                    });
                }
            }
        });
    }
    
    /**
     * Set war participation data
     */
    setWarParticipation(warId, participationData) {
        this.warParticipation.set(warId, participationData);
    }
    
    /**
     * Check for skill upgrade opportunities
     */
    checkSkillUpgrades() {
        // Auto-suggest skill upgrades based on alliance activities
        const suggestions = [];

        if (this.skillPoints >= 3) {
            // Suggest roster upgrade if near member limit
            if (this.members.size >= this.memberLimit - 1) {
                suggestions.push('roster');
            }

            // Suggest combat offensive if alliance is active in wars
            if (this.warParticipation.size > 0) {
                suggestions.push('combatOffensive');
            }

            // Suggest unity if alliance has many members
            if (this.members.size > 3) {
                suggestions.push('unity');
            }
        }

        if (suggestions.length > 0) {
            EventBus.emit('alliance_skill_suggestions', {
                allianceId: this.id,
                suggestions: suggestions,
                availablePoints: this.skillPoints
            });
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Get nation by ID (helper method)
     */
    getNation(nationId) {
        // Try window.Nation first (single-player / active nation)
        if (window.Nation && window.Nation.id === nationId) {
            return window.Nation;
        }

        // Try DataManager currentPlayer nations
        if (window.DataManager && window.DataManager.currentPlayer) {
            const nations = window.DataManager.currentPlayer.nations || [];
            const found = nations.find(n => n.id === nationId);
            if (found) return found;
        }

        return null;
    }
    
    /**
     * Bind events
     */
    bindEvents() {
        // Event bindings for alliance-specific events
    }
    
    /**
     * Update member activity tracking
     */
    updateMemberActivity() {
        this.members.forEach((memberData, nationId) => {
            const nation = this.getNation(nationId);
            if (nation && nation.lastActive) {
                const daysSinceActive = (Date.now() - nation.lastActive) / (1000 * 60 * 60 * 24);
                memberData.lastActiveWithinWeek = daysSinceActive <= 7;
            }
        });
    }
    
    /**
     * Serialize alliance for saving
     */
    serialize() {
        return {
            id: this.id,
            name: this.name,
            acronym: this.acronym,
            description: this.description,
            founded: this.founded,
            foundedDay: this.foundedDay,
            
            governmentType: this.governmentType,
            government: {
                structure: this.government.structure,
                roles: Array.from(this.government.roles.entries()),
                customRoles: this.government.customRoles,
                founder: this.government.founder,
                currentLeaders: Array.from(this.government.currentLeaders.entries())
            },
            
            members: Array.from(this.members.entries()),
            memberHistory: this.memberHistory,
            memberLimit: this.memberLimit,
            invitations: Array.from(this.invitations.entries()),
            
            level: this.level,
            experience: this.experience,
            totalExperience: this.totalExperience,
            experienceToNext: this.experienceToNext,
            skillPoints: this.skillPoints,
            skills: this.skills,
            
            customization: this.customization,
            treaties: this.treaties,
            relations: Array.from(this.relations.entries()),
            diplomaticStance: this.diplomaticStance,
            
            warParticipation: Array.from(this.warParticipation.entries()),
            militaryCoordination: this.militaryCoordination,
            
            statistics: this.statistics,
            memberStats: Array.from(this.memberStats.entries())
        };
    }
    
    /**
     * Deserialize alliance from saved data
     */
    static deserialize(data) {
        const alliance = new Alliance(data.id, data.government.founder, {
            name: data.name,
            acronym: data.acronym,
            description: data.description,
            governmentType: data.governmentType
        });

        // Set up government from template first (ensures roles exist)
        if (data.governmentType) {
            alliance.setupGovernment(data.governmentType);
        }

        // Restore data
        alliance.founded = data.founded;
        alliance.foundedDay = data.foundedDay;

        // Restore government (overrides template with saved state)
        alliance.government.structure = data.government.structure;
        alliance.government.roles = new Map(data.government.roles);
        alliance.government.customRoles = data.government.customRoles;
        alliance.government.currentLeaders = new Map(data.government.currentLeaders);

        // Restore members
        alliance.members = new Map(data.members);
        alliance.memberHistory = data.memberHistory;
        alliance.memberLimit = data.memberLimit;
        alliance.invitations = new Map(data.invitations);

        // Restore progression
        alliance.level = data.level;
        alliance.experience = data.experience;
        alliance.totalExperience = data.totalExperience;
        alliance.experienceToNext = data.experienceToNext;
        alliance.skillPoints = data.skillPoints;
        alliance.skills = data.skills;

        // Restore other data
        alliance.customization = data.customization;
        alliance.treaties = data.treaties;
        alliance.relations = new Map(data.relations);
        alliance.diplomaticStance = data.diplomaticStance;
        alliance.warParticipation = new Map(data.warParticipation);
        alliance.militaryCoordination = data.militaryCoordination;

        alliance.statistics = data.statistics;

        // Restore member stats snapshots
        if (data.memberStats) {
            alliance.memberStats = new Map(data.memberStats);
        }

        return alliance;
    }
}