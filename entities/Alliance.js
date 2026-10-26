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
        this.government.structure = template;
        
        // Initialize roles
        template.roles.forEach(role => {
            this.government.roles.set(role.id, {
                members: [],
                permissions: role.permissions,
                requirements: role.requirements || {},
                maxCount: role.maxCount || (role.unique ? 1 : 999)
            });
        });
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
     * Get default role for member type
     */
    getDefaultRole(memberType) {
        switch (memberType) {
            case 'founder':
                return this.governmentType === 'democratic' ? 'president' :
                       this.governmentType === 'trio' ? 'triumvir1' :
                       this.governmentType === 'autocratic' ? 'supremeLeader' : 'leader';
            case 'coFounder':
                return this.governmentType === 'democratic' ? 'vicePresident' :
                       this.governmentType === 'trio' ? 'triumvir2' :
                       this.governmentType === 'autocratic' ? 'warMinister' : 'coLeader';
            case 'foundingMember':
                return this.governmentType === 'democratic' ? 'secDefense' :
                       this.governmentType === 'trio' ? 'lieutenant' :
                       this.governmentType === 'autocratic' ? 'officer' : 'officer';
            default:
                return 'member';
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
        this.government.currentLeaders.set(roleId, nationId);
        
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
     * Apply skill effects to alliance
     */
    applySkillEffects(skillKey) {
        const skillData = this.skills[skillKey];
        if (!skillData || !skillData.effects) return;
        
        switch (skillKey) {
            case 'roster':
                this.memberLimit = skillData.effects.memberLimit || 6;
                break;
                
            case 'customization':
                this.updateCustomizationOptions(skillData.effects.customOptions);
                break;
                
            case 'warEfficiency':
                // Applied during war calculations
                break;
                
            case 'diplomacy':
                // Applied during treaty negotiations
                break;
                
            case 'economy':
                // Economy skill affects trade and resource efficiency
                break;
                
            case 'intelligence':
                this.updateIntelligenceSharing(skillData.effects);
                break;
                
            case 'defense':
                // Applied during defensive wars
                break;
                
            case 'research':
                // Applied during research collaboration
                break;
                
            case 'logistics':
                // Applied during military operations
                break;
                
            case 'expansion':
                // Applied during territorial expansion
                break;
                
            case 'unity':
                // Applied to overall alliance bonuses
                break;
        }
    }
    
    /**
     * Update customization options based on skill level
     */
    updateCustomizationOptions(customOptions) {
        if (!customOptions) return;
        
        customOptions.forEach(option => {
            if (this.customization[option.replace('custom', '').toLowerCase()]) {
                this.customization[option.replace('custom', '').toLowerCase()].enabled = true;
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
        // Apply unity bonuses to all members
        const unitySkill = this.skills.unity;
        if (unitySkill && unitySkill.level > 0) {
            this.applyUnityBonuses();
        }
        
        // Update member activity tracking
        this.updateMemberActivity();
    }
    
    /**
     * Apply unity bonuses to all members
     */
    applyUnityBonuses() {
        const unityEffects = this.skills.unity.effects;
        if (!unityEffects) return;
        
        this.members.forEach((memberData, nationId) => {
            const nation = this.getNation(nationId);
            if (!nation) return;
            
            // Apply stability bonus
            if (unityEffects.stabilityBonus) {
                nation.stability = Math.min(100, nation.stability + (nation.stability * unityEffects.stabilityBonus));
            }
            
            // Apply overall efficiency bonus
            if (unityEffects.overallEfficiency) {
                // This would be applied to various nation calculations
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
            
            // Suggest war efficiency if alliance is active in wars
            if (this.warParticipation.size > 0) {
                suggestions.push('warEfficiency');
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
            
            statistics: this.statistics
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
        
        // Restore data
        alliance.founded = data.founded;
        alliance.foundedDay = data.foundedDay;
        
        // Restore government
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
        
        return alliance;
    }
}