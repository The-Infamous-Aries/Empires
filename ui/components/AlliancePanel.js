/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ALLIANCE PANEL
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Comprehensive alliance management interface
 */

class AlliancePanel {
    constructor() {
        this.isInitialized = false;
        this.currentTab = 'overview';
        this.selectedAlliance = null;
        this.playerNation = null;
        
        // UI state
        this.isCreatingAlliance = false;
        this.isEditingCustomization = false;
        this.skillUpgradeQueue = [];
        
        this.initialize();
    }
    
    initialize() {
        console.log('Initializing Alliance Panel...');
        this.bindEvents();
        this.isInitialized = true;
    }
    
    bindEvents() {
        EventBus.on('alliance_created', this.handleAllianceCreated.bind(this));
        EventBus.on('alliance_member_added', this.handleMemberAdded.bind(this));
        EventBus.on('alliance_level_up', this.handleAllianceLevelUp.bind(this));
        EventBus.on('alliance_skill_upgraded', this.handleSkillUpgraded.bind(this));
        EventBus.on('popup_opened', (data) => {
            if (data.popupId === 'alliance-popup') {
                this.refresh();
            }
        });
    }
    
    /**
     * Refresh alliance panel content
     */
    refresh() {
        if (!window.AllianceSystem) return;
        
        this.updatePlayerNation();
        this.renderAllianceContent();
        this.updateNotifications();
    }
    
    /**
     * Update current player nation data
     */
    updatePlayerNation() {
        if (window.DataManager && window.DataManager.currentPlayer && window.DataManager.currentPlayer.currentNation) {
            this.playerNation = window.DataManager.currentPlayer.currentNation;
            
            if (this.playerNation.allianceId) {
                this.selectedAlliance = AllianceSystem.getAlliance(this.playerNation.allianceId);
            } else {
                this.selectedAlliance = null;
            }
        }
    }
    
    /**
     * Render main alliance content
     */
    renderAllianceContent() {
        const container = document.getElementById('alliance-content');
        if (!container) return;
        
        if (!this.playerNation) {
            container.innerHTML = this.renderNoNationMessage();
            return;
        }
        
        if (!this.selectedAlliance) {
            container.innerHTML = this.renderAllianceCreation();
        } else {
            container.innerHTML = this.renderAllianceManagement();
        }
        
        this.bindContentEvents();
    }
    
    /**
     * Render no nation message
     */
    renderNoNationMessage() {
        return `
            <div class="alliance-message">
                <h3>No Nation Selected</h3>
                <p>You need to create or select a nation to manage alliances.</p>
            </div>
        `;
    }
    
    /**
     * Render alliance creation interface
     */
    renderAllianceCreation() {
        const canCreate = AllianceSystem.canCreateAlliance(this.playerNation.id);
        const hasWonder = AllianceSystem.hasAllianceFoundingWonder(this.playerNation.id);
        const hasEasterEgg = AllianceSystem.hasEasterEggCondition(this.playerNation.id);
        
        if (!canCreate.canCreate && !hasWonder && !hasEasterEgg) {
            return `
                <div class="alliance-locked">
                    <div class="locked-content">
                        <h3>Alliance Creation Locked</h3>
                        <p class="lock-reason">${canCreate.reason}</p>
                        <div class="unlock-methods">
                            <div class="unlock-method">
                                <h4>Method 1: Build Alliance Headquarters Wonder</h4>
                                <p>Construct the Alliance Headquarters wonder to enable alliance creation.</p>
                            </div>
                            <div class="unlock-method easter-egg">
                                <h4>Method 2: Special Diplomatic Conditions</h4>
                                <p class="hint">${canCreate.hint}</p>
                                <div class="easter-egg-requirements">
                                    <ul>
                                        <li>Have a Best Friend relationship</li>
                                        <li>Have 5 Friends with Mutual Defense/Aggression Pacts</li>
                                        <li>Best Friend must have pacts with all 5 friends</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="alliance-creation">
                <div class="creation-header">
                    <h3>Create New Alliance</h3>
                    <p class="creation-method">${canCreate.method === 'easterEgg' ? 'Special Diplomatic Creation Available!' : 'Alliance Headquarters Wonder Detected'}</p>
                </div>
                
                <form class="alliance-creation-form" id="alliance-creation-form">
                    <div class="form-group">
                        <label for="alliance-name">Alliance Name:</label>
                        <input type="text" id="alliance-name" maxlength="50" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="alliance-acronym">Acronym (Optional):</label>
                        <input type="text" id="alliance-acronym" maxlength="8">
                    </div>
                    
                    <div class="form-group">
                        <label for="alliance-description">Description:</label>
                        <textarea id="alliance-description" rows="3" maxlength="500"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="government-type">Government Structure:</label>
                        <select id="government-type">
                            <option value="democratic">Democratic Alliance</option>
                            <option value="trio">Triumvirate</option>
                            <option value="autocratic">Autocratic Alliance</option>
                            <option value="custom">Custom Structure</option>
                        </select>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Create Alliance</button>
                        <button type="button" class="btn-secondary" onclick="AlliancePanel.showGovernmentPreview()">Preview Structures</button>
                    </div>
                </form>
            </div>
        `;
    }
    
    /**
     * Render alliance management interface
     */
    renderAllianceManagement() {
        const alliance = this.selectedAlliance;
        if (!alliance) return '';
        
        return `
            <div class="alliance-management">
                <div class="alliance-header">
                    <div class="alliance-info">
                        <h2>${alliance.name}</h2>
                        ${alliance.acronym ? `<span class="alliance-acronym">[${alliance.acronym}]</span>` : ''}
                        <div class="alliance-stats">
                            <span class="level">Level ${alliance.level}</span>
                            <span class="members">${alliance.members.size}/${alliance.memberLimit} Members</span>
                            <span class="xp">${alliance.experience}/${alliance.experienceToNext} XP</span>
                        </div>
                    </div>
                    <div class="alliance-actions">
                        <button class="btn-primary" onclick="AlliancePanel.inviteMember()">Invite Member</button>
                        <button class="btn-secondary" onclick="AlliancePanel.showSettings()">Settings</button>
                    </div>
                </div>
                
                <div class="alliance-tabs">
                    <button class="tab-btn ${this.currentTab === 'overview' ? 'active' : ''}" onclick="AlliancePanel.switchTab('overview')">Overview</button>
                    <button class="tab-btn ${this.currentTab === 'members' ? 'active' : ''}" onclick="AlliancePanel.switchTab('members')">Members</button>
                    <button class="tab-btn ${this.currentTab === 'skills' ? 'active' : ''}" onclick="AlliancePanel.switchTab('skills')">Skills</button>
                    <button class="tab-btn ${this.currentTab === 'diplomacy' ? 'active' : ''}" onclick="AlliancePanel.switchTab('diplomacy')">Diplomacy</button>
                    <button class="tab-btn ${this.currentTab === 'military' ? 'active' : ''}" onclick="AlliancePanel.switchTab('military')">Military</button>
                    <button class="tab-btn ${this.currentTab === 'customization' ? 'active' : ''}" onclick="AlliancePanel.switchTab('customization')">Customization</button>
                </div>
                
                <div class="alliance-tab-content">
                    ${this.renderTabContent()}
                </div>
            </div>
        `;
    }
    
    /**
     * Render content for current tab
     */
    renderTabContent() {
        switch (this.currentTab) {
            case 'overview':
                return this.renderOverviewTab();
            case 'members':
                return this.renderMembersTab();
            case 'skills':
                return this.renderSkillsTab();
            case 'diplomacy':
                return this.renderDiplomacyTab();
            case 'military':
                return this.renderMilitaryTab();
            case 'customization':
                return this.renderCustomizationTab();
            default:
                return this.renderOverviewTab();
        }
    }
    
    /**
     * Render overview tab
     */
    renderOverviewTab() {
        const alliance = this.selectedAlliance;
        if (!alliance) return '';
        
        return `
            <div class="overview-tab">
                <div class="overview-grid">
                    <div class="overview-section">
                        <h4>Alliance Information</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Founded:</label>
                                <span>${new Date(alliance.founded).toLocaleDateString()}</span>
                            </div>
                            <div class="info-item">
                                <label>Government:</label>
                                <span>${alliance.government.structure?.name || 'Unknown'}</span>
                            </div>
                            <div class="info-item">
                                <label>Diplomatic Stance:</label>
                                <span class="stance-${alliance.diplomaticStance}">${alliance.diplomaticStance}</span>
                            </div>
                        </div>
                        <div class="description">
                            <p>${alliance.description || 'No description provided.'}</p>
                        </div>
                    </div>
                    
                    <div class="overview-section">
                        <h4>Recent Activity</h4>
                        <div class="activity-feed">
                            ${this.renderRecentActivity()}
                        </div>
                    </div>
                    
                    <div class="overview-section">
                        <h4>Statistics</h4>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-value">${alliance.statistics.warsWon}</span>
                                <span class="stat-label">Wars Won</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${alliance.statistics.treatiesSigned}</span>
                                <span class="stat-label">Treaties</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${alliance.statistics.territoryGained}</span>
                                <span class="stat-label">Territory</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${Math.floor(alliance.statistics.totalDamageDealt / 1000)}K</span>
                                <span class="stat-label">Damage Dealt</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="overview-section">
                        <h4>Quick Actions</h4>
                        <div class="quick-actions">
                            <button class="action-btn" onclick="AlliancePanel.declareWar()">
                                <i class="icon-war"></i>Declare War
                            </button>
                            <button class="action-btn" onclick="AlliancePanel.proposeTreaty()">
                                <i class="icon-treaty"></i>Propose Treaty
                            </button>
                            <button class="action-btn" onclick="AlliancePanel.shareResources()">
                                <i class="icon-resources"></i>Share Resources
                            </button>
                            <button class="action-btn" onclick="AlliancePanel.coordinateAttack()">
                                <i class="icon-coordinate"></i>Coordinate Attack
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render members tab
     */
    renderMembersTab() {
        const alliance = this.selectedAlliance;
        if (!alliance) return '';
        
        let membersHtml = '';
        alliance.members.forEach((memberData, nationId) => {
            const nation = this.getNation(nationId);
            if (!nation) return;
            
            const roleData = alliance.government.roles.get(memberData.role);
            const roleName = roleData ? this.getRoleName(memberData.role, alliance.governmentType) : 'Unknown';
            
            membersHtml += `
                <div class="member-item" data-nation-id="${nationId}">
                    <div class="member-info">
                        <div class="member-name">${nation.name}</div>
                        <div class="member-role">${roleName}</div>
                        <div class="member-stats">
                            <span class="joined">Joined: ${new Date(memberData.joinDate).toLocaleDateString()}</span>
                            <span class="active ${memberData.lastActiveWithinWeek ? 'online' : 'offline'}">
                                ${memberData.lastActiveWithinWeek ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                    <div class="member-contributions">
                        <div class="contribution">
                            <label>XP:</label>
                            <span>${memberData.contributions.xp}</span>
                        </div>
                        <div class="contribution">
                            <label>Wars:</label>
                            <span>${memberData.contributions.wars}</span>
                        </div>
                        <div class="contribution">
                            <label>Resources:</label>
                            <span>${Math.floor(memberData.contributions.resources / 1000)}K</span>
                        </div>
                    </div>
                    <div class="member-actions">
                        <button class="btn-small" onclick="AlliancePanel.viewMember('${nationId}')">View</button>
                        ${this.canManageMember(memberData.role) ? `
                            <button class="btn-small" onclick="AlliancePanel.manageMember('${nationId}')">Manage</button>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        return `
            <div class="members-tab">
                <div class="members-header">
                    <h4>Alliance Members (${alliance.members.size}/${alliance.memberLimit})</h4>
                    <div class="member-actions-header">
                        <button class="btn-primary" onclick="AlliancePanel.inviteMember()">Invite Member</button>
                        <button class="btn-secondary" onclick="AlliancePanel.manageRoles()">Manage Roles</button>
                    </div>
                </div>
                
                <div class="members-list">
                    ${membersHtml}
                </div>
                
                <div class="government-structure">
                    <h4>Government Structure</h4>
                    ${this.renderGovernmentStructure()}
                </div>
            </div>
        `;
    }
    
    /**
     * Render skills tab
     */
    renderSkillsTab() {
        const alliance = this.selectedAlliance;
        if (!alliance) return '';
        
        let skillsHtml = '';
        Object.entries(AllianceSystem.allianceSkills).forEach(([skillKey, skillDef]) => {
            const currentSkill = alliance.skills[skillKey] || { level: 0, pointsSpent: 0, effects: {} };
            const nextLevelCost = this.calculateSkillCost(skillDef, currentSkill.level);
            const canUpgrade = alliance.skillPoints >= nextLevelCost && currentSkill.level < skillDef.maxLevel;
            
            skillsHtml += `
                <div class="skill-item ${canUpgrade ? 'can-upgrade' : ''}">
                    <div class="skill-header">
                        <h5>${skillDef.name}</h5>
                        <div class="skill-level">
                            Level ${currentSkill.level}/${skillDef.maxLevel}
                        </div>
                    </div>
                    <div class="skill-description">
                        <p>${skillDef.description}</p>
                    </div>
                    <div class="skill-effects">
                        ${this.renderSkillEffects(skillKey, currentSkill.level, skillDef)}
                    </div>
                    <div class="skill-upgrade">
                        ${currentSkill.level < skillDef.maxLevel ? `
                            <div class="upgrade-cost">
                                Next Level Cost: ${nextLevelCost} SP
                            </div>
                            <button class="btn-upgrade ${canUpgrade ? '' : 'disabled'}" 
                                    onclick="AlliancePanel.upgradeSkill('${skillKey}')"
                                    ${!canUpgrade ? 'disabled' : ''}>
                                Upgrade
                            </button>
                        ` : `
                            <div class="skill-maxed">Maximum Level Reached</div>
                        `}
                    </div>
                    <div class="skill-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(currentSkill.level / skillDef.maxLevel) * 100}%"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        return `
            <div class="skills-tab">
                <div class="skills-header">
                    <h4>Alliance Skills</h4>
                    <div class="skill-points">
                        Available Skill Points: <span class="sp-count">${alliance.skillPoints}</span>
                    </div>
                </div>
                
                <div class="skills-grid">
                    ${skillsHtml}
                </div>
                
                <div class="skill-suggestions">
                    <h4>Suggested Upgrades</h4>
                    ${this.renderSkillSuggestions()}
                </div>
            </div>
        `;
    }
    
    /**
     * Render customization tab
     */
    renderCustomizationTab() {
        const alliance = this.selectedAlliance;
        if (!alliance) return '';
        
        const customizationSkill = alliance.skills.customization || { level: 0 };
        const unlockedOptions = AllianceSystem.allianceSkills.customization.effects(customizationSkill.level).customOptions || [];
        
        return `
            <div class="customization-tab">
                <div class="customization-header">
                    <h4>Alliance Customization</h4>
                    <div class="customization-level">
                        Customization Level: ${customizationSkill.level}/10
                    </div>
                </div>
                
                <div class="customization-options">
                    ${this.renderCustomizationOption('banner', 'Custom Banner', unlockedOptions, alliance.customization.banner)}
                    ${this.renderCustomizationOption('flag', 'Custom Flag', unlockedOptions, alliance.customization.flag)}
                    ${this.renderCustomizationOption('allianceNameFont', 'Alliance Name Font', unlockedOptions, alliance.customization.nameStyle)}
                    ${this.renderCustomizationOption('allianceNameColor', 'Alliance Name Color', unlockedOptions, alliance.customization.nameStyle)}
                    ${this.renderCustomizationOption('allianceNameOutline', 'Alliance Name Outline', unlockedOptions, alliance.customization.nameStyle)}
                    ${this.renderCustomizationOption('memberLevelsFont', 'Member Levels Font', unlockedOptions, alliance.customization.memberLevelsStyle)}
                    ${this.renderCustomizationOption('memberLevelsColor', 'Member Levels Color', unlockedOptions, alliance.customization.memberLevelsStyle)}
                    ${this.renderCustomizationOption('customEmblem', 'Custom Emblem', unlockedOptions, alliance.customization.emblem)}
                    ${this.renderCustomizationOption('themePalette', 'Theme Palette', unlockedOptions, alliance.customization.theme)}
                </div>
                
                <div class="customization-preview">
                    <h4>Preview</h4>
                    <div class="alliance-preview">
                        ${this.renderAlliancePreview()}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render individual customization option
     */
    renderCustomizationOption(optionKey, optionName, unlockedOptions, currentValue) {
        const isUnlocked = unlockedOptions.includes(optionKey);
        const requiredLevel = this.getCustomizationRequiredLevel(optionKey);
        
        if (!isUnlocked) {
            return `
                <div class="customization-option locked">
                    <div class="option-header">
                        <h5>${optionName}</h5>
                        <span class="locked-badge">Requires Level ${requiredLevel}</span>
                    </div>
                    <div class="option-preview locked-preview">
                        <p>Unlock customization skills to access this option.</p>
                    </div>
                </div>
            `;
        }
        
        let contentHtml = '';
        switch (optionKey) {
            case 'banner':
                contentHtml = `
                    <div class="banner-upload">
                        <input type="file" id="banner-upload" accept="image/*" onchange="AlliancePanel.uploadBanner(event)">
                        <label for="banner-upload" class="upload-label">Upload Banner Image</label>
                        ${currentValue.url ? `<img src="${currentValue.url}" class="current-banner" alt="Current Banner">` : ''}
                    </div>
                `;
                break;
                
            case 'allianceNameColor':
                contentHtml = `
                    <div class="color-picker">
                        <input type="color" id="name-color" value="${currentValue.color || '#ffffff'}" 
                               onchange="AlliancePanel.updateNameColor(this.value)">
                        <label for="name-color">Text Color</label>
                    </div>
                `;
                break;
                
            case 'allianceNameFont':
                contentHtml = `
                    <select id="name-font" onchange="AlliancePanel.updateNameFont(this.value)">
                        <option value="default">Default</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                        <option value="fantasy">Fantasy</option>
                    </select>
                `;
                break;
                
            default:
                contentHtml = `<p>Customization options for ${optionName}</p>`;
        }
        
        return `
            <div class="customization-option unlocked">
                <div class="option-header">
                    <h5>${optionName}</h5>
                    <label class="toggle-switch">
                        <input type="checkbox" ${currentValue.enabled ? 'checked' : ''} 
                               onchange="AlliancePanel.toggleCustomization('${optionKey}', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="option-content">
                    ${contentHtml}
                </div>
            </div>
        `;
    }
    
    /**
     * Get required level for customization option
     */
    getCustomizationRequiredLevel(optionKey) {
        const levelMap = {
            'customBanner': 1,
            'customFlag': 2,
            'allianceNameFont': 3,
            'allianceNameColor': 4,
            'allianceNameOutline': 5,
            'memberLevelsFont': 6,
            'memberLevelsColor': 7,
            'customEmblem': 8,
            'themePalette': 9,
            'fullyCustomizable': 10
        };
        return levelMap[optionKey] || 1;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Handle alliance creation form submission
     */
    static async handleAllianceCreation() {
        const form = document.getElementById('alliance-creation-form');
        if (!form) return;
        
        const formData = new FormData(form);
        const allianceData = {
            name: formData.get('alliance-name'),
            acronym: formData.get('alliance-acronym'),
            description: formData.get('alliance-description'),
            governmentType: formData.get('government-type')
        };
        
        try {
            const alliance = await AllianceSystem.createAlliance(
                window.AlliancePanel.playerNation.id,
                allianceData
            );
            
            console.log('Alliance created successfully:', alliance.name);
            window.AlliancePanel.selectedAlliance = alliance;
            window.AlliancePanel.refresh();
            
        } catch (error) {
            console.error('Failed to create alliance:', error);
            alert('Failed to create alliance: ' + error.message);
        }
    }

    /**
     * Switch between alliance tabs
     */
    static switchTab(tabName) {
        if (window.AlliancePanel) {
            window.AlliancePanel.currentTab = tabName;
            window.AlliancePanel.renderAllianceContent();
        }
    }
    
    /**
     * Upgrade alliance skill
     */
    static upgradeSkill(skillKey) {
        if (!window.AlliancePanel.selectedAlliance) return;
        
        const success = window.AlliancePanel.selectedAlliance.upgradeSkill(skillKey);
        if (success) {
            window.AlliancePanel.refresh();
        } else {
            alert('Cannot upgrade skill: insufficient skill points or max level reached');
        }
    }
    
    /**
     * Invite new member to alliance
     */
    static inviteMember() {
        // Implementation for member invitation
        console.log('Inviting new member...');
    }
    
    /**
     * Toggle customization option
     */
    static toggleCustomization(optionKey, enabled) {
        if (!window.AlliancePanel.selectedAlliance) return;
        
        const customization = window.AlliancePanel.selectedAlliance.customization;
        
        switch (optionKey) {
            case 'banner':
                customization.banner.enabled = enabled;
                break;
            case 'allianceNameColor':
                customization.nameStyle.enabled = enabled;
                break;
            case 'allianceNameFont':
                customization.nameStyle.enabled = enabled;
                break;
            default:
                console.log(`Toggle customization: ${optionKey} = ${enabled}`);
        }
        
        window.AlliancePanel.refresh();
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Bind events for dynamic content
     */
    bindContentEvents() {
        // Bind alliance creation form
        const creationForm = document.getElementById('alliance-creation-form');
        if (creationForm) {
            creationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                AlliancePanel.handleAllianceCreation();
            });
        }
    }
    
    /**
     * Calculate skill upgrade cost
     */
    calculateSkillCost(skillDef, currentLevel) {
        return Math.floor(skillDef.baseCost * Math.pow(skillDef.costMultiplier, currentLevel));
    }
    
    /**
     * Render skill effects description
     */
    renderSkillEffects(skillKey, level, skillDef) {
        if (level === 0) {
            return '<div class="no-effects">No effects at level 0</div>';
        }
        
        const effects = skillDef.effects(level);
        let effectsHtml = '<div class="skill-effects-list">';
        
        Object.entries(effects).forEach(([effectKey, value]) => {
            let displayValue = value;
            if (typeof value === 'number') {
                if (effectKey.includes('Bonus') || effectKey.includes('Efficiency')) {
                    displayValue = `+${(value * 100).toFixed(1)}%`;
                } else if (effectKey.includes('Limit') || effectKey.includes('Count')) {
                    displayValue = value.toLocaleString();
                }
            }
            
            effectsHtml += `
                <div class="effect-item">
                    <span class="effect-name">${this.formatEffectName(effectKey)}:</span>
                    <span class="effect-value">${displayValue}</span>
                </div>
            `;
        });
        
        effectsHtml += '</div>';
        return effectsHtml;
    }
    
    /**
     * Format effect names for display
     */
    formatEffectName(effectKey) {
        return effectKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
    
    /**
     * Get nation by ID
     */
    getNation(nationId) {
        if (window.DataManager && window.DataManager.currentPlayer) {
            return window.DataManager.currentPlayer.nations.find(n => n.id === nationId);
        }
        return null;
    }
    
    /**
     * Check if current player can manage member
     */
    canManageMember(memberRole) {
        if (!this.playerNation || !this.selectedAlliance) return false;
        
        const playerMember = this.selectedAlliance.members.get(this.playerNation.id);
        if (!playerMember) return false;
        
        return this.selectedAlliance.hasPermission(this.playerNation.id, 'members') ||
               this.selectedAlliance.hasPermission(this.playerNation.id, 'all');
    }
    
    /**
     * Get role display name
     */
    getRoleName(roleId, governmentType) {
        const roleMap = {
            democratic: {
                president: 'President',
                vicePresident: 'Vice President',
                secDefense: 'Secretary of Defense',
                secForeign: 'Secretary of Foreign Affairs',
                secInternal: 'Secretary of Internal Affairs',
                secEconomy: 'Secretary of Economy',
                secJustice: 'Secretary of Justice',
                secTechnology: 'Secretary of Technology',
                member: 'Member'
            },
            trio: {
                triumvir1: 'First Triumvir',
                triumvir2: 'Second Triumvir', 
                triumvir3: 'Third Triumvir',
                lieutenant: 'Lieutenant',
                member: 'Member'
            },
            autocratic: {
                supremeLeader: 'Supreme Leader',
                warMinister: 'War Minister',
                diplomaticMinister: 'Diplomatic Minister',
                economicMinister: 'Economic Minister',
                internalMinister: 'Internal Minister',
                officer: 'Officer',
                subject: 'Subject'
            }
        };
        
        return roleMap[governmentType]?.[roleId] || 'Unknown Role';
    }
    
    /**
     * Handle alliance-related events
     */
    handleAllianceCreated(data) {
        console.log('Alliance created:', data.alliance.name);
        this.refresh();
    }
    
    handleMemberAdded(data) {
        console.log('Member added to alliance:', data.nationId);
        this.refresh();
    }
    
    handleAllianceLevelUp(data) {
        console.log('Alliance leveled up:', data.newLevel);
        this.refresh();
    }
    
    handleSkillUpgraded(data) {
        console.log('Skill upgraded:', data.skill, 'to level', data.newLevel);
        this.refresh();
    }
    
    /**
     * Update notification badges
     */
    updateNotifications() {
        // Implementation for notification system
    }
    
    /**
     * Render recent activity
     */
    renderRecentActivity() {
        const alliance = this.selectedAlliance;
        if (!alliance || !alliance.memberHistory) {
            return '<div class="activity-item">No recent activity</div>';
        }
        
        const recentEvents = alliance.memberHistory
            .slice(-5)
            .reverse()
            .map(event => {
                const nation = this.getNation(event.nationId);
                const nationName = nation ? nation.name : 'Unknown Nation';
                const timeAgo = this.formatTimeAgo(event.date);
                
                return `
                    <div class="activity-item">
                        <div class="activity-icon">${event.action === 'joined' ? '➕' : '➖'}</div>
                        <div class="activity-text">
                            <strong>${nationName}</strong> ${event.action} the alliance
                            <span class="activity-time">${timeAgo}</span>
                        </div>
                    </div>
                `;
            })
            .join('');
            
        return recentEvents || '<div class="activity-item">No recent activity</div>';
    }
    
    /**
     * Render government structure
     */
    renderGovernmentStructure() {
        const alliance = this.selectedAlliance;
        if (!alliance) return '';
        
        let structureHtml = '<div class="government-structure-grid">';
        
        alliance.government.roles.forEach((roleData, roleId) => {
            const roleName = this.getRoleName(roleId, alliance.governmentType);
            const members = roleData.members.map(nationId => {
                const nation = this.getNation(nationId);
                return nation ? nation.name : 'Unknown';
            }).join(', ') || 'Vacant';
            
            const maxCount = roleData.maxCount === 999 ? '∞' : roleData.maxCount;
            
            structureHtml += `
                <div class="role-item">
                    <div class="role-header">
                        <h5>${roleName}</h5>
                        <span class="role-count">${roleData.members.length}/${maxCount}</span>
                    </div>
                    <div class="role-members">
                        ${members}
                    </div>
                    <div class="role-permissions">
                        ${roleData.permissions.join(', ')}
                    </div>
                </div>
            `;
        });
        
        structureHtml += '</div>';
        return structureHtml;
    }
    
    /**
     * Render skill suggestions
     */
    renderSkillSuggestions() {
        const alliance = this.selectedAlliance;
        if (!alliance || alliance.skillPoints < 1) {
            return '<div class="no-suggestions">Insufficient skill points for upgrades</div>';
        }
        
        const suggestions = [];
        
        // Suggest roster upgrade if near limit
        if (alliance.members.size >= alliance.memberLimit - 1) {
            suggestions.push({
                skill: 'roster',
                reason: 'Alliance is near member capacity',
                priority: 'high'
            });
        }
        
        // Suggest war skills if active in wars
        if (alliance.warParticipation.size > 0) {
            suggestions.push({
                skill: 'warEfficiency',
                reason: 'Alliance is actively participating in wars',
                priority: 'medium'
            });
        }
        
        // Suggest economy if members are sharing resources
        if (alliance.sharedResources.contributions.size > 0) {
            suggestions.push({
                skill: 'economy',
                reason: 'Members are actively sharing resources',
                priority: 'medium'
            });
        }
        
        // Suggest unity for overall bonuses
        if (alliance.level >= 5 && alliance.skills.unity.level < 3) {
            suggestions.push({
                skill: 'unity',
                reason: 'Unity provides benefits to all alliance activities',
                priority: 'low'
            });
        }
        
        if (suggestions.length === 0) {
            return '<div class="no-suggestions">No specific recommendations at this time</div>';
        }
        
        return suggestions.map(suggestion => {
            const skillDef = AllianceSystem.allianceSkills[suggestion.skill];
            const currentLevel = alliance.skills[suggestion.skill].level;
            const cost = this.calculateSkillCost(skillDef, currentLevel);
            
            return `
                <div class="suggestion-item priority-${suggestion.priority}">
                    <div class="suggestion-skill">
                        <strong>${skillDef.name}</strong> (Level ${currentLevel} → ${currentLevel + 1})
                    </div>
                    <div class="suggestion-reason">${suggestion.reason}</div>
                    <div class="suggestion-cost">Cost: ${cost} SP</div>
                    <button class="btn-small" onclick="AlliancePanel.upgradeSkill('${suggestion.skill}')"
                            ${alliance.skillPoints < cost ? 'disabled' : ''}>
                        Upgrade
                    </button>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Render alliance preview
     */
    renderAlliancePreview() {
        const alliance = this.selectedAlliance;
        if (!alliance) return '';
        
        const customization = alliance.customization;
        
        return `
            <div class="alliance-preview-container" style="${this.getPreviewStyles(customization)}">
                <div class="preview-header">
                    <h3 class="alliance-name-preview" style="${this.getNameStyles(customization.nameStyle)}">
                        ${alliance.name}
                        ${alliance.acronym ? `<span class="acronym-preview">[${alliance.acronym}]</span>` : ''}
                    </h3>
                </div>
                
                ${customization.banner.enabled && customization.banner.url ? `
                    <div class="banner-preview">
                        <img src="${customization.banner.url}" alt="Alliance Banner" />
                    </div>
                ` : ''}
                
                ${customization.flag.enabled ? `
                    <div class="flag-preview">
                        <div class="flag-design">Custom Flag Design</div>
                    </div>
                ` : ''}
                
                <div class="members-preview">
                    <h4 style="${this.getMemberLevelsStyles(customization.memberLevelsStyle)}">
                        Members (${alliance.members.size})
                    </h4>
                    <div class="member-list-preview">
                        ${Array.from(alliance.members.values()).slice(0, 3).map(member => {
                            const nation = this.getNation(member.nationId);
                            return `<div class="member-preview">${nation ? nation.name : 'Unknown'}</div>`;
                        }).join('')}
                        ${alliance.members.size > 3 ? '<div class="member-preview">...</div>' : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get preview styles for customization
     */
    getPreviewStyles(customization) {
        let styles = 'background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%); padding: 1rem; border-radius: 8px;';
        
        if (customization.theme.enabled && customization.theme.palette !== 'default') {
            // Add theme-specific styles
            styles += this.getThemeStyles(customization.theme.palette);
        }
        
        return styles;
    }
    
    /**
     * Get name styles
     */
    getNameStyles(nameStyle) {
        if (!nameStyle.enabled) return '';
        
        let styles = '';
        if (nameStyle.font && nameStyle.font !== 'default') {
            styles += `font-family: ${nameStyle.font};`;
        }
        if (nameStyle.color && nameStyle.color !== '#ffffff') {
            styles += `color: ${nameStyle.color};`;
        }
        if (nameStyle.outlineColor && nameStyle.outlineColor !== '#000000') {
            styles += `text-shadow: 1px 1px 0 ${nameStyle.outlineColor}, -1px -1px 0 ${nameStyle.outlineColor}, 1px -1px 0 ${nameStyle.outlineColor}, -1px 1px 0 ${nameStyle.outlineColor};`;
        }
        
        return styles;
    }
    
    /**
     * Get member levels styles
     */
    getMemberLevelsStyles(levelStyle) {
        if (!levelStyle.enabled) return '';
        
        let styles = '';
        if (levelStyle.font && levelStyle.font !== 'default') {
            styles += `font-family: ${levelStyle.font};`;
        }
        if (levelStyle.color && levelStyle.color !== '#cccccc') {
            styles += `color: ${levelStyle.color};`;
        }
        
        return styles;
    }
    
    /**
     * Get theme-specific styles
     */
    getThemeStyles(palette) {
        const themes = {
            royal: 'background: linear-gradient(135deg, #1a237e 0%, #3f51b5 100%);',
            military: 'background: linear-gradient(135deg, #1b5e20 0%, #4caf50 100%);',
            corporate: 'background: linear-gradient(135deg, #263238 0%, #546e7a 100%);',
            mystical: 'background: linear-gradient(135deg, #4a148c 0%, #9c27b0 100%);'
        };
        
        return themes[palette] || '';
    }
    
    renderDiplomacyTab() {
        const alliance = this.selectedAlliance;
        if (!alliance) return '';
        
        return `
            <div class="diplomacy-tab">
                <div class="diplomacy-header">
                    <h4>Alliance Diplomacy</h4>
                    <div class="diplomatic-stance">
                        Current Stance: <span class="stance-${alliance.diplomaticStance}">${alliance.diplomaticStance}</span>
                        <button class="btn-small" onclick="AlliancePanel.changeDiplomaticStance()">Change</button>
                    </div>
                </div>
                
                <div class="alliance-treaties">
                    <h5>Alliance Treaties</h5>
                    <div class="treaties-list">
                        ${alliance.treaties.length > 0 ? 
                            alliance.treaties.map(treaty => `
                                <div class="treaty-item">
                                    <div class="treaty-type">${treaty.type}</div>
                                    <div class="treaty-partner">${treaty.partnerName}</div>
                                    <div class="treaty-status">${treaty.status}</div>
                                </div>
                            `).join('') : 
                            '<div class="no-treaties">No alliance treaties currently active</div>'
                        }
                    </div>
                    <button class="btn-primary" onclick="AlliancePanel.proposeTreaty()">Propose Alliance Treaty</button>
                </div>
                
                <div class="alliance-relations">
                    <h5>Relations with Other Alliances</h5>
                    <div class="relations-grid">
                        ${this.renderAllianceRelations()}
                    </div>
                </div>
                
                <div class="diplomatic-actions">
                    <h5>Diplomatic Actions</h5>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="AlliancePanel.declareAllianceWar()">
                            <i class="icon-war"></i>Declare War
                        </button>
                        <button class="action-btn" onclick="AlliancePanel.proposeAlliancePeace()">
                            <i class="icon-peace"></i>Propose Peace
                        </button>
                        <button class="action-btn" onclick="AlliancePanel.sendAllianceDiplomacy()">
                            <i class="icon-message"></i>Send Message
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderMilitaryTab() {
        const alliance = this.selectedAlliance;
        if (!alliance) return '';
        
        // Calculate total alliance military strength
        let totalStrength = 0;
        let totalUnits = { soldiers: 0, tanks: 0, aircraft: 0, ships: 0, spies: 0, missiles: 0, nukes: 0 };
        
        alliance.members.forEach((memberData, nationId) => {
            const nation = this.getNation(nationId);
            if (nation) {
                totalStrength += nation.militaryStrength || 0;
                Object.keys(totalUnits).forEach(unitType => {
                    totalUnits[unitType] += (nation.militaryUnits && nation.militaryUnits[unitType]) || 0;
                });
            }
        });
        
        return `
            <div class="military-tab">
                <div class="military-header">
                    <h4>Alliance Military Forces</h4>
                    <div class="total-strength">
                        Total Military Strength: <span class="strength-value">${totalStrength.toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="military-overview">
                    <div class="unit-counts">
                        <h5>Combined Forces</h5>
                        <div class="units-grid">
                            ${Object.entries(totalUnits).map(([unitType, count]) => `
                                <div class="unit-item">
                                    <div class="unit-icon">${this.getUnitIcon(unitType)}</div>
                                    <div class="unit-name">${this.formatUnitName(unitType)}</div>
                                    <div class="unit-count">${count.toLocaleString()}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="active-wars">
                    <h5>Active Military Operations</h5>
                    <div class="wars-list">
                        ${alliance.warParticipation.size > 0 ? 
                            Array.from(alliance.warParticipation.entries()).map(([warId, participation]) => `
                                <div class="war-item">
                                    <div class="war-info">
                                        <div class="war-id">War #${warId}</div>
                                        <div class="war-side">Side: ${participation.side}</div>
                                        <div class="participation">Participation: ${participation.participationPercent.toFixed(1)}%</div>
                                    </div>
                                    <div class="war-status ${participation.eligible ? 'eligible' : 'ineligible'}">
                                        ${participation.eligible ? 'XP Eligible' : 'Insufficient Participation'}
                                    </div>
                                </div>
                            `).join('') :
                            '<div class="no-wars">No active military operations</div>'
                        }
                    </div>
                </div>
                
                <div class="military-coordination">
                    <h5>Military Coordination</h5>
                    <div class="coordination-actions">
                        <button class="action-btn" onclick="AlliancePanel.coordinateAttack()">
                            <i class="icon-attack"></i>Coordinate Attack
                        </button>
                        <button class="action-btn" onclick="AlliancePanel.organizeDefense()">
                            <i class="icon-defense"></i>Organize Defense
                        </button>
                        <button class="action-btn" onclick="AlliancePanel.shareIntelligence()">
                            <i class="icon-intel"></i>Share Intelligence
                        </button>
                        <button class="action-btn" onclick="AlliancePanel.planJointOperation()">
                            <i class="icon-operation"></i>Plan Joint Operation
                        </button>
                    </div>
                </div>
                
                <div class="military-bonuses">
                    <h5>Active Military Bonuses</h5>
                    <div class="bonuses-list">
                        ${this.renderMilitaryBonuses()}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Helper methods for military tab
     */
    getUnitIcon(unitType) {
        const icons = {
            soldiers: '🪖',
            tanks:    '🛡️',
            aircraft: '✈️',
            ships:    '🚢',
            spies:    '🕵️',
            missiles: '💣',
            nukes:    '☢️'
        };
        return icons[unitType] || '❓';
    }
    
    formatUnitName(unitType) {
        return unitType.charAt(0).toUpperCase() + unitType.slice(1);
    }
    
    renderMilitaryBonuses() {
        const alliance = this.selectedAlliance;
        if (!alliance) return '<div class="no-bonuses">No active bonuses</div>';
        
        const bonuses = [];
        
        // War efficiency bonuses
        const warSkill = alliance.skills.warEfficiency;
        if (warSkill && warSkill.level > 0) {
            bonuses.push(`War Damage: +${(warSkill.effects.warDamageBonus * 100).toFixed(1)}%`);
            bonuses.push(`Coordination: +${(warSkill.effects.coordinationBonus * 100).toFixed(1)}%`);
        }
        
        // Defense bonuses
        const defenseSkill = alliance.skills.defense;
        if (defenseSkill && defenseSkill.level > 0) {
            bonuses.push(`Defense: +${(defenseSkill.effects.defenseBonus * 100).toFixed(1)}%`);
            bonuses.push(`Counter-Attack: +${(defenseSkill.effects.counterAttackBonus * 100).toFixed(1)}%`);
        }
        
        // Logistics bonuses
        const logisticsSkill = alliance.skills.logistics;
        if (logisticsSkill && logisticsSkill.level > 0) {
            bonuses.push(`Supply Efficiency: +${(logisticsSkill.effects.supplyEfficiency * 100).toFixed(1)}%`);
            bonuses.push(`Deployment Speed: +${(logisticsSkill.effects.deploymentSpeed * 100).toFixed(1)}%`);
        }
        
        if (bonuses.length === 0) {
            return '<div class="no-bonuses">No military bonuses active</div>';
        }
        
        return bonuses.map(bonus => `
            <div class="bonus-item">
                <span class="bonus-icon">⚡</span>
                <span class="bonus-text">${bonus}</span>
            </div>
        `).join('');
    }
    
    /**
     * Format time ago helper
     */
    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diffMs = now - timestamp;
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 30) return `${diffDays}d ago`;
        return new Date(timestamp).toLocaleDateString();
    }
    
    /**
     * Static methods for UI interaction
     */
    static showGovernmentPreview() {
        // Implementation for showing government structure previews
        console.log('Showing government structure preview');
    }
    
    static declareWar() {
        console.log('Declaring alliance war');
    }
    
    static proposeTreaty() {
        console.log('Proposing alliance treaty');
    }
    
    static shareResources() {
        console.log('Opening resource sharing');
    }
    
    static coordinateAttack() {
        console.log('Coordinating alliance attack');
    }
    
    static showSettings() {
        console.log('Showing alliance settings');
    }
    
    static viewMember(nationId) {
        console.log('Viewing member:', nationId);
    }
    
    static manageMember(nationId) {
        console.log('Managing member:', nationId);
    }
    
    static manageRoles() {
        console.log('Managing alliance roles');
    }
    
    static uploadBanner(event) {
        const file = event.target.files[0];
        if (file && window.AlliancePanel.selectedAlliance) {
            // Implementation for banner upload
            console.log('Uploading banner:', file.name);
        }
    }
    
    static updateNameColor(color) {
        if (window.AlliancePanel.selectedAlliance) {
            window.AlliancePanel.selectedAlliance.customization.nameStyle.color = color;
            window.AlliancePanel.refresh();
        }
    }
    
    static updateNameFont(font) {
        if (window.AlliancePanel.selectedAlliance) {
            window.AlliancePanel.selectedAlliance.customization.nameStyle.font = font;
            window.AlliancePanel.refresh();
        }
    }
}

// Initialize global alliance panel
window.AlliancePanel = new AlliancePanel();