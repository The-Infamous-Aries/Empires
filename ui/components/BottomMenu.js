/**
 * Bottom Menu System - Mobile-style UI Management
 * Dominion Wars - Nation Building Strategy Game
 */

class BottomMenuSystem {
    constructor() {
        this.isInitialized = false;
        this.activePopup = null;
        this.menuTabs = new Map();
        this.popups = new Map();
        
        // Animation settings
        this.animationDuration = 400;
        this.isAnimating = false;
        
        this.initialize();
    }
    
    /**
     * Initialize the bottom menu system
     */
    initialize() {
        console.log('Initializing Bottom Menu System...');
        
        this.bindElements();
        this.bindEvents();
        this.setupInitialState();
        
        this.isInitialized = true;
        console.log('Bottom Menu System initialized');
    }
    
    /**
     * Bind DOM elements
     */
    bindElements() {
        // Get all menu tabs
        const tabElements = document.querySelectorAll('.menu-tab');
        tabElements.forEach(tab => {
            const tabId = tab.id;
            const popupId = tab.dataset.popup;
            
            this.menuTabs.set(tabId, {
                element: tab,
                popupId: popupId,
                isActive: tab.classList.contains('active')
            });
        });
        
        // Get all popups
        const popupElements = document.querySelectorAll('.connected-popup');
        popupElements.forEach(popup => {
            const popupId = popup.id;
            
            this.popups.set(popupId, {
                element: popup,
                isActive: popup.classList.contains('active')
            });
        });
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Menu tab clicks
        this.menuTabs.forEach((tab, tabId) => {
            tab.element.addEventListener('click', (e) => {
                this.handleTabClick(tabId, tab.popupId);
            });
        });
        
        // Popup close buttons
        const closeButtons = document.querySelectorAll('.popup-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetPopup = button.dataset.target;
                this.closePopup(targetPopup);
            });
        });
        
        // Map click to close popups
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            mapContainer.addEventListener('click', () => {
                if (this.activePopup) {
                    this.closeAllPopups();
                }
            });
        }
        
        // Escape key to close popups
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activePopup) {
                this.closeAllPopups();
            }
        });
        
        // Settings tab click handler
        const settingsTab = document.getElementById('settings-tab');
        if (settingsTab) {
            settingsTab.addEventListener('click', () => {
                if (window.SettingsPanel) {
                    window.SettingsPanel.show();
                }
            });
        }
        
        // Initialize admin tab if user has admin privileges
        this.initializeAdminPanel();

        // Auto-refresh the nation popup whenever game state updates
        if (typeof EventBus !== 'undefined') {
            EventBus.on('nation_updated',        () => this._conditionalRefresh('nation-popup'));
            EventBus.on('resources_changed',     () => this._conditionalRefresh('nation-popup'));
            EventBus.on('day_passed',            () => this._conditionalRefresh('nation-popup'));
            EventBus.on('player_level_up',       () => this._conditionalRefresh('nation-popup'));
            EventBus.on('skill_upgraded',        () => this._conditionalRefresh('nation-popup'));
            EventBus.on('player_went_legendary', () => this._conditionalRefresh('nation-popup'));
        }
    }

    /**
     * Refresh a popup only when it is currently visible — avoids wasted work
     */
    _conditionalRefresh(popupId) {
        if (this.isPopupOpen(popupId)) {
            this.refreshPopup(popupId);
        }
    }

    /**
     * Initialize admin panel for admin users
     */
    initializeAdminPanel() {
        // Check if user is admin
        if (window.AdminSystem && window.AdminSystem.isAdmin()) {
            this.addAdminTab();
        }
        
        // Listen for admin status changes
        EventBus.on('admin_added', (data) => {
            if (data.playerId === window.Player?.playerId) {
                this.addAdminTab();
            }
        });
        
        EventBus.on('admin_removed', (data) => {
            if (data.playerId === window.Player?.playerId) {
                this.removeAdminTab();
            }
        });
        
        // Listen for economy panel refresh events
        EventBus.on('economy_panel_refresh_needed', () => {
            if (this.getActivePopup() === 'nation-popup') {
                const activeTab = document.querySelector('.nation-tab.active')?.dataset.tab;
                if (activeTab === 'economy') {
                    this.refreshEconomyTab();
                }
            }
        });
    }
    
    /**
     * Add admin tab to the menu
     */
    addAdminTab() {
        // Check if admin tab already exists
        if (document.getElementById('admin-tab')) {
            return;
        }
        
        const menuTabs = document.querySelector('.menu-tabs');
        if (!menuTabs) return;
        
        // Create admin tab
        const adminTab = document.createElement('button');
        adminTab.id = 'admin-tab';
        adminTab.className = 'menu-tab admin-tab';
        adminTab.innerHTML = `
            <div class="tab-icon">ðŸ‘‘</div>
            <div class="tab-label">Admin</div>
        `;
        
        // Add before settings tab
        const settingsTab = document.getElementById('settings-tab');
        if (settingsTab) {
            menuTabs.insertBefore(adminTab, settingsTab);
        } else {
            menuTabs.appendChild(adminTab);
        }
        
        // Add click handler
        adminTab.addEventListener('click', () => {
            this.openAdminPanel();
        });
        
        console.log('Admin tab added to menu');
    }
    
    /**
     * Remove admin tab from the menu
     */
    removeAdminTab() {
        const adminTab = document.getElementById('admin-tab');
        if (adminTab) {
            adminTab.remove();
            console.log('Admin tab removed from menu');
        }
    }
    
    /**
     * Open admin panel
     */
    openAdminPanel() {
        // Close any open popups first
        this.closeAllPopups();
        
        // Create or show admin panel
        if (!window.AdminPanel) {
            // Show basic admin interface
            this.showAdminInterface();
        } else {
            // Initialize and show admin panel
            let adminPanel = Panel.getPanel('admin-panel');
            if (!adminPanel) {
                adminPanel = new AdminPanel();
                if (adminPanel.initialize()) {
                    adminPanel.show();
                }
            } else {
                adminPanel.show();
            }
        }
    }
    
    /**
     * Show basic admin interface if AdminPanel not loaded
     */
    showAdminInterface() {
        // Create a basic modal for now
        if (!window.Modal) {
            alert('Admin panel is loading... Please try again in a moment.');
            return;
        }
        
        const adminModal = new Modal('admin-basic', 'Admin Panel');
        adminModal.content = `
            <div class="admin-basic-panel">
                <h3>Admin Functions</h3>
                <div class="admin-actions">
                    <button class="btn" onclick="window.reportError('TEST_ERROR', {test: true})">
                        Test Error System
                    </button>
                    <button class="btn" onclick="BugReportModal.open()">
                        Test Bug Report
                    </button>
                    <button class="btn" onclick="this.viewActionLogs()">
                        View Action Logs
                    </button>
                    <button class="btn" onclick="this.viewErrorLogs()">
                        View Error Logs
                    </button>
                </div>
                <div class="admin-info">
                    <p>Admin Status: ${window.AdminSystem.getAdminPermission()}</p>
                    <p>Action Logs: ${window.AdminSystem.actionLog.length}</p>
                    <p>Error Logs: ${window.AdminSystem.errorLog.length}</p>
                    <p>Bug Reports: ${window.AdminSystem.bugReports.length}</p>
                </div>
            </div>
        `;
        adminModal.show();
    }
    
    /**
     * Setup initial state
     */
    setupInitialState() {
        // Find initially active popup
        this.popups.forEach((popup, popupId) => {
            if (popup.isActive) {
                this.activePopup = popupId;
            }
        });
    }
    
    /**
     * Handle menu tab click
     */
    handleTabClick(tabId, popupId) {
        if (this.isAnimating) return;
        
        const currentTab = this.menuTabs.get(tabId);
        if (!currentTab) return;
        
        // If clicking active tab, close popup
        if (currentTab.isActive && this.activePopup === popupId) {
            this.closeAllPopups();
            return;
        }
        
        // Switch to new popup — only update active tab if the popup exists
        if (this.popups.has(popupId)) {
            this.showPopup(popupId);
            this.setActiveTab(tabId);
        }
    }
    
    /**
     * Show specific popup
     */
    showPopup(popupId) {
        if (this.isAnimating || !this.popups.has(popupId)) return;
        
        this.isAnimating = true;
        
        // Hide current popup if different
        if (this.activePopup && this.activePopup !== popupId) {
            this.hidePopup(this.activePopup, false);
        }
        
        // Show new popup
        const popup = this.popups.get(popupId);
        popup.element.classList.add('active');
        popup.isActive = true;
        this.activePopup = popupId;
        
        // End animation after duration
        setTimeout(() => {
            this.isAnimating = false;
        }, this.animationDuration);
        
        // Emit event
        EventBus.emit('popup_opened', {
            popupId: popupId
        });
    }
    
    /**
     * Hide specific popup
     */
    hidePopup(popupId, animate = true) {
        if (!this.popups.has(popupId)) return;
        
        const popup = this.popups.get(popupId);
        popup.element.classList.remove('active');
        popup.isActive = false;
        
        if (this.activePopup === popupId) {
            this.activePopup = null;
        }
        
        // Emit event
        EventBus.emit('popup_closed', {
            popupId: popupId
        });
    }
    
    /**
     * Close popup by ID
     */
    closePopup(popupId) {
        this.hidePopup(popupId);
        
        // Deactivate associated tab
        this.menuTabs.forEach((tab, tabId) => {
            if (tab.popupId === popupId) {
                this.setActiveTab(tabId, false);
            }
        });
    }
    
    /**
     * Close all popups
     */
    closeAllPopups() {
        if (this.activePopup) {
            this.closePopup(this.activePopup);
        }
    }
    
    /**
     * Set active tab
     */
    setActiveTab(tabId, active = true) {
        // Deactivate all tabs first
        this.menuTabs.forEach((tab, id) => {
            tab.element.classList.remove('active');
            tab.isActive = false;
        });
        
        // Activate specified tab
        if (active && this.menuTabs.has(tabId)) {
            const tab = this.menuTabs.get(tabId);
            tab.element.classList.add('active');
            tab.isActive = true;
        }
    }
    
    /**
     * Update popup content
     */
    updatePopupContent(popupId, contentUpdater) {
        if (!this.popups.has(popupId)) return;
        
        const popup = this.popups.get(popupId);
        const content = popup.element.querySelector('.popup-content');
        
        if (content && typeof contentUpdater === 'function') {
            contentUpdater(content);
        }
    }
    
    /**
     * Show notification badge on tab
     */
    showTabNotification(tabId, count = 1) {
        if (!this.menuTabs.has(tabId)) return;
        
        const tab = this.menuTabs.get(tabId);
        let badge = tab.element.querySelector('.notification-badge');
        
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'notification-badge';
            tab.element.appendChild(badge);
        }
        
        badge.textContent = count > 9 ? '9+' : count.toString();
        badge.style.display = 'block';
    }
    
    /**
     * Hide notification badge on tab
     */
    hideTabNotification(tabId) {
        if (!this.menuTabs.has(tabId)) return;
        
        const tab = this.menuTabs.get(tabId);
        const badge = tab.element.querySelector('.notification-badge');
        
        if (badge) {
            badge.style.display = 'none';
        }
    }
    
    /**
     * Get active popup ID
     */
    getActivePopup() {
        return this.activePopup;
    }
    
    /**
     * Check if specific popup is open
     */
    isPopupOpen(popupId) {
        return this.activePopup === popupId;
    }
    
    /**
     * Toggle popup visibility
     */
    togglePopup(popupId) {
        if (this.isPopupOpen(popupId)) {
            this.closePopup(popupId);
        } else {
            // Find associated tab
            this.menuTabs.forEach((tab, tabId) => {
                if (tab.popupId === popupId) {
                    this.handleTabClick(tabId, popupId);
                }
            });
        }
    }
    
    /**
     * Refresh popup data
     */
    refreshPopup(popupId) {
        if (!this.isPopupOpen(popupId)) return;
        
        switch (popupId) {
            case 'nation-popup':
                this.refreshNationPopup();
                break;
            case 'build-popup':
                this.refreshBuildPopup();
                break;
            case 'military-popup':
                this.refreshMilitaryPopup();
                break;
            case 'research-popup':
                this.refreshResearchPopup();
                break;
            case 'diplomacy-popup':
                this.refreshDiplomacyPopup();
                break;
            case 'world-popup':
                this.refreshWorldPopup();
                break;
            case 'news-popup':
                this.refreshNewsPopup();
                break;
            case 'chat-popup':
                this.refreshChatPopup();
                break;
            case 'team-popup':
                this.refreshTeamPopup();
                break;
        }
    }
    
    /**
     * Refresh nation popup with current data
     */
    refreshNationPopup() {
        if (!window.Nation || !window.Player) return;
        
        // Update nation stats
        const populationElement = document.getElementById('popup-population');
        const gdpElement = document.getElementById('popup-gdp');
        const militaryElement = document.getElementById('popup-military');
        const happinessElement = document.getElementById('popup-happiness');
        
        if (populationElement) populationElement.textContent = this.formatNumber(Nation.population);
        if (gdpElement) gdpElement.textContent = '$' + this.formatNumber(Nation.gdp);
        if (militaryElement) militaryElement.textContent = this.formatNumber(Nation.militaryStrength);
        if (happinessElement) happinessElement.textContent = Math.round(Nation.happiness) + '%';

        // Update government stat card — icon + name from GovernmentSystem
        const govIconEl  = document.getElementById('popup-government-icon');
        const govNameEl  = document.getElementById('popup-government');
        if (govNameEl) {
            const gov = window.GovernmentSystem?.getGovernment(Nation.government);
            if (gov) {
                if (govIconEl) {
                    if (gov.image) {
                        govIconEl.innerHTML = `<img src="${gov.image}" alt="${gov.name}" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;">`;
                    } else {
                        govIconEl.textContent = gov.icon || '🏛️';
                    }
                }
                govNameEl.textContent = gov.name;
                govNameEl.title = gov.fullName;
            } else {
                if (govIconEl) govIconEl.textContent = '🏛️';
                govNameEl.textContent = Nation.government || '—';
            }
        }

        // Update religion stat card — icon + name from ReligionSystem
        const relIconEl  = document.getElementById('popup-religion-icon');
        const relNameEl  = document.getElementById('popup-religion');
        if (relNameEl) {
            const rel = window.ReligionSystem?.getReligion(Nation.religion);
            if (rel) {
                if (relIconEl) {
                    if (rel.image) {
                        relIconEl.innerHTML = `<img src="${rel.image}" alt="${rel.name}" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;">`;
                    } else {
                        relIconEl.textContent = rel.icon || '🛐';
                    }
                }
                relNameEl.textContent = rel.name;
                relNameEl.title = rel.fullName;
            } else {
                if (relIconEl) relIconEl.textContent = '🛐';
                relNameEl.textContent = Nation.religion || '—';
            }
        }
        
        // Update player stats
        const levelElement = document.getElementById('popup-level');
        const experienceElement = document.getElementById('popup-experience');
        const skillPointsElement = document.getElementById('popup-skill-points');
        const experienceBar = document.getElementById('popup-experience-bar');
        
        if (levelElement) levelElement.textContent = `Level ${Player.level}`;
        if (experienceElement) experienceElement.textContent = `${this.formatNumber(Player.experience)}/${this.formatNumber(Player.experienceToNext)} XP`;
        if (skillPointsElement) skillPointsElement.textContent = `${Player.unallocatedSkillPoints} SP`;
        
        if (experienceBar) {
            const progress = (Player.experience / Player.experienceToNext) * 100;
            experienceBar.style.width = Math.min(100, progress) + '%';
        }

        // Initialize nation tabs if not already done
        this.initializeNationTabs();

        // Update population tab if it's active
        const activeTab = document.querySelector('.nation-tab.active')?.dataset.tab;
        if (activeTab === 'population') {
            this.refreshPopulationTab();
        } else if (activeTab === 'nationstats') {
            this.refreshNationStatsTab();
        } else if (activeTab === 'economy') {
            this.refreshEconomyTab();
        }
    }

    /**
     * Initialize nation tab switching
     */
    initializeNationTabs() {
        const tabButtons = document.querySelectorAll('.nation-tab');
        const tabContents = document.querySelectorAll('.nation-tab-content');

        tabButtons.forEach(button => {
            if (button.getAttribute('data-handler-bound') !== 'true') {
                button.addEventListener('click', (e) => {
                    const targetTab = e.target.dataset.tab;

                    // Update active button
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');

                    // Update active content
                    tabContents.forEach(content => content.classList.remove('active'));
                    const targetContent = document.getElementById(`nation-${targetTab}-tab`);
                    if (targetContent) {
                        targetContent.classList.add('active');
                    }

                    // Refresh content based on tab
                    if (targetTab === 'population') {
                        this.refreshPopulationTab();
                    } else if (targetTab === 'nationstats') {
                        this.refreshNationStatsTab();
                    } else if (targetTab === 'economy') {
                        this.refreshEconomyTab();
                    }
                    // 'overview' tab content is static HTML — no refresh needed
                });
                button.setAttribute('data-handler-bound', 'true');
            }
        });
    }

    /**
     * Refresh population tab content
     */
    refreshPopulationTab() {
        // Initialize population panel if not already done
        if (!window.populationPanel) {
            window.populationPanel = new PopulationPanel();
            window.populationPanel.initialize();
        }

        // Render population panel content
        const container = document.getElementById('nation-population-tab');
        if (container) {
            container.innerHTML = window.populationPanel.render();

            // Listen for population panel refresh events
            EventBus.on('population_panel_refresh_needed', () => {
                const activeTab = document.querySelector('.nation-tab.active')?.dataset.tab;
                if (activeTab === 'population') {
                    this.refreshPopulationTab();
                }
            });
        }
    }

    /**
     * Render a stat bar with label, value, and colour-coded fill
     * @param {string} label  - Display name
     * @param {number} value  - 0–100 numeric value
     * @param {string} icon   - Emoji icon
     * @param {string} suffix - Unit suffix (e.g. '%', '')
     * @param {boolean} invertColour - If true, high = red (bad). Default false = high is green.
     * @returns {string} HTML string
     */
    _renderStatBar(label, value, icon, suffix = '%', invertColour = false) {
        const capped = Math.max(0, Math.min(100, value));
        let colourClass;
        if (invertColour) {
            colourClass = capped <= 20 ? 'bar-good' : capped <= 50 ? 'bar-warn' : 'bar-bad';
        } else {
            colourClass = capped >= 70 ? 'bar-good' : capped >= 40 ? 'bar-warn' : 'bar-bad';
        }
        return `
            <div class="ns-stat-row">
                <div class="ns-stat-header">
                    <span class="ns-stat-icon">${icon}</span>
                    <span class="ns-stat-label">${label}</span>
                    <span class="ns-stat-value">${Math.round(value)}${suffix}</span>
                </div>
                <div class="ns-stat-bar-track">
                    <div class="ns-stat-bar-fill ${colourClass}" style="width:${capped}%"></div>
                </div>
            </div>`;
    }

    /**
     * Refresh the Nation Stats tab — complete breakdown of all metrics
     */
    refreshNationStatsTab() {
        const container = document.getElementById('nation-nationstats-tab');
        if (!container || !window.Nation) return;

        const n   = window.Nation;
        const ns  = n.nationStats || {};
        const fmt = (v) => this.formatNumber(v);

        // ── Identity / Core ──────────────────────────────────────────────
        const ageStr = (() => {
            if (!n.founded) return '—';
            const days = Math.floor((Date.now() - n.founded) / 86400000);
            return days < 365 ? `${days}d` : `${Math.floor(days / 365)}y ${days % 365}d`;
        })();

        // ── Nation health bars ───────────────────────────────────────────
        const happinessBar  = this._renderStatBar('Happiness',  ns.happiness  ?? n.happiness  ?? 50, '😊', '%', false);
        const literacyBar   = this._renderStatBar('Literacy',   ns.literacy   ?? 0,                  '📚', '%', false);
        const environmentBar= this._renderStatBar('Environment',ns.environment ?? 50,                '🌿', '', false);
        const crimeBar      = this._renderStatBar('Crime Rate', ns.crime      ?? 15,                 '🚔', '%', true);
        const diseaseBar    = this._renderStatBar('Disease Rate',ns.disease   ?? 10,                 '🦠', '%', true);
        const pollutionBar  = this._renderStatBar('Pollution',  Math.min(100, ns.pollution ?? 0),    '🏭', '', true);

        // ── Derived multipliers ──────────────────────────────────────────
        const popEff  = Math.round((ns.populationEfficiency  ?? 1.0) * 100);
        const milMor  = Math.round((ns.militaryMorale        ?? 1.0) * 100);
        const taxEff  = Math.round((ns.taxEfficiency         ?? 1.0) * 100);

        // ── Economy ──────────────────────────────────────────────────────
        const budget    = n.budget || {};
        const stability = n.stability  ?? 100;
        const reputation= n.reputation ?? 50;

        // ── Infrastructure ───────────────────────────────────────────────
        const landBlocks = n.mapBlocks ?? Math.floor((n.land ?? 0) / 100);

        // ── Military units ───────────────────────────────────────────────
        const mu = n.militaryUnits || {};

        // ── Disease panel section (national only) ────────────────────────
        let diseaseSectionHtml = '';
        if (window.DiseaseSystem && n.id) {
            const activeDiseases = DiseaseSystem.getActiveDiseases(n.id);
            if (activeDiseases.length > 0) {
                diseaseSectionHtml = `
                    <div class="ns-section">
                        <h4 class="ns-section-title">🦠 Active Diseases (${activeDiseases.length})</h4>
                        <div class="ns-disease-list">
                            ${activeDiseases.map(d => `
                                <div class="ns-disease-card">
                                    <span class="ns-disease-name">${d.name || d.id}</span>
                                    <span class="ns-disease-severity ns-sev-${(d.severity || 'low').toLowerCase()}">${d.severity || 'Low'}</span>
                                    ${d.affectedPopulation ? `<span class="ns-disease-affected">Affected: ${fmt(d.affectedPopulation)}</span>` : ''}
                                </div>`).join('')}
                        </div>
                    </div>`;
            }
        }

        // ── Policies ────────────────────────────────────────────────────
        const pol = n.policies || {};
        const polHtml = Object.entries(pol).map(([k, v]) =>
            `<div class="ns-policy-item"><span class="ns-policy-key">${k.charAt(0).toUpperCase() + k.slice(1)}</span><span class="ns-policy-val">${v}</span></div>`
        ).join('');

        // ── Build improvements summary ───────────────────────────────────
        const impr = n.improvements || {};
        const imprEntries = Object.entries(impr).filter(([,v]) => v > 0);
        const imprHtml = imprEntries.length
            ? imprEntries.map(([k, v]) => `<div class="ns-impr-item"><span>${k}</span><span class="ns-impr-count">×${v}</span></div>`).join('')
            : '<div class="ns-empty">No improvements built</div>';

        // ── Projects summary ─────────────────────────────────────────────
        const proj = n.projects || {};
        const projEntries = Object.entries(proj).filter(([,v]) => v > 0);
        const projHtml = projEntries.length
            ? projEntries.map(([k, v]) => `<div class="ns-impr-item"><span>${k}</span><span class="ns-impr-count">×${v}</span></div>`).join('')
            : '<div class="ns-empty">No projects built</div>';

        container.innerHTML = `
            <div class="nation-stats-tab">

                <!-- IDENTITY SECTION -->
                <div class="ns-section">
                    <h4 class="ns-section-title">🏛️ Nation Identity</h4>
                    <div class="ns-identity-grid">
                        <div class="ns-id-item"><span class="ns-id-label">Name</span><span class="ns-id-value">${n.name || '—'}</span></div>
                        <div class="ns-id-item"><span class="ns-id-label">Leader</span><span class="ns-id-value">${n.leader || '—'}</span></div>
                        <div class="ns-id-item"><span class="ns-id-label">Capital</span><span class="ns-id-value">${n.capitalCity || '—'}</span></div>
                        <div class="ns-id-item"><span class="ns-id-label">Motto</span><span class="ns-id-value">${n.motto || '—'}</span></div>
                        <div class="ns-id-item"><span class="ns-id-label">Age</span><span class="ns-id-value">${ageStr}</span></div>
                        <div class="ns-id-item"><span class="ns-id-label">Faction</span><span class="ns-id-value">${n.factionKey || 'None'}</span></div>
                    </div>
                </div>

                <!-- CORE STATS SECTION -->
                <div class="ns-section">
                    <h4 class="ns-section-title">📊 Core Stats</h4>
                    <div class="ns-core-grid">
                        <div class="ns-core-item">
                            <span class="ns-core-icon">👥</span>
                            <span class="ns-core-val">${fmt(n.population)}</span>
                            <span class="ns-core-lbl">Population</span>
                        </div>
                        <div class="ns-core-item">
                            <span class="ns-core-icon">💰</span>
                            <span class="ns-core-val">$${fmt(n.money)}</span>
                            <span class="ns-core-lbl">Treasury</span>
                        </div>
                        <div class="ns-core-item">
                            <span class="ns-core-icon">📈</span>
                            <span class="ns-core-val">$${fmt(n.gdp)}</span>
                            <span class="ns-core-lbl">GDP</span>
                        </div>
                        <div class="ns-core-item">
                            <span class="ns-core-icon">🏗️</span>
                            <span class="ns-core-val">${fmt(n.infra)}</span>
                            <span class="ns-core-lbl">Infrastructure</span>
                        </div>
                        <div class="ns-core-item">
                            <span class="ns-core-icon">🔬</span>
                            <span class="ns-core-val">${fmt(n.tech)}</span>
                            <span class="ns-core-lbl">Technology</span>
                        </div>
                        <div class="ns-core-item">
                            <span class="ns-core-icon">🗺️</span>
                            <span class="ns-core-val">${fmt(n.land)} mi²</span>
                            <span class="ns-core-lbl">Land (${landBlocks} blocks)</span>
                        </div>
                        <div class="ns-core-item">
                            <span class="ns-core-icon">🛡️</span>
                            <span class="ns-core-val">${stability}%</span>
                            <span class="ns-core-lbl">Stability</span>
                        </div>
                        <div class="ns-core-item">
                            <span class="ns-core-icon">⭐</span>
                            <span class="ns-core-val">${reputation}</span>
                            <span class="ns-core-lbl">Reputation</span>
                        </div>
                    </div>
                </div>

                <!-- WELFARE METRICS SECTION -->
                <div class="ns-section">
                    <h4 class="ns-section-title">❤️ Nation Welfare</h4>
                    <div class="ns-bars-list">
                        ${happinessBar}
                        ${literacyBar}
                        ${environmentBar}
                        ${crimeBar}
                        ${diseaseBar}
                        ${pollutionBar}
                    </div>
                    <div class="ns-multipliers">
                        <div class="ns-mult-item" title="Population growth modifier based on happiness">
                            <span class="ns-mult-label">Pop Efficiency</span>
                            <span class="ns-mult-val ${popEff >= 100 ? 'positive' : 'negative'}">${popEff}%</span>
                        </div>
                        <div class="ns-mult-item" title="Military combat effectiveness">
                            <span class="ns-mult-label">Mil. Morale</span>
                            <span class="ns-mult-val ${milMor >= 100 ? 'positive' : 'negative'}">${milMor}%</span>
                        </div>
                        <div class="ns-mult-item" title="Tax collection efficiency">
                            <span class="ns-mult-label">Tax Efficiency</span>
                            <span class="ns-mult-val ${taxEff >= 100 ? 'positive' : 'negative'}">${taxEff}%</span>
                        </div>
                    </div>
                </div>

                <!-- ECONOMY SECTION -->
                <div class="ns-section">
                    <h4 class="ns-section-title">💹 Economy</h4>
                    <div class="ns-econ-grid">
                        <div class="ns-econ-item">
                            <span class="ns-econ-label">Tax Rate</span>
                            <span class="ns-econ-val">${(n.taxRate ?? 2.5).toFixed(2)}%</span>
                        </div>
                        <div class="ns-econ-item">
                            <span class="ns-econ-label">Taxable Income</span>
                            <span class="ns-econ-val">$${fmt(n.taxableIncome)}</span>
                        </div>
                        <div class="ns-econ-item">
                            <span class="ns-econ-label">Tax Revenue/Turn</span>
                            <span class="ns-econ-val positive">+$${fmt(n.taxRevenue)}</span>
                        </div>
                        <div class="ns-econ-item">
                            <span class="ns-econ-label">Budget Income</span>
                            <span class="ns-econ-val positive">+$${fmt(budget.income)}</span>
                        </div>
                        <div class="ns-econ-item">
                            <span class="ns-econ-label">Budget Expenses</span>
                            <span class="ns-econ-val negative">-$${fmt(budget.expenses)}</span>
                        </div>
                        <div class="ns-econ-item">
                            <span class="ns-econ-label">Budget Balance</span>
                            <span class="ns-econ-val ${(budget.balance ?? 0) >= 0 ? 'positive' : 'negative'}">${(budget.balance ?? 0) >= 0 ? '+' : ''}$${fmt(budget.balance)}</span>
                        </div>
                        <div class="ns-econ-item">
                            <span class="ns-econ-label">Debt</span>
                            <span class="ns-econ-val ${n.debt > 0 ? 'negative' : ''}">$${fmt(n.debt)}</span>
                        </div>
                        <div class="ns-econ-item">
                            <span class="ns-econ-label">Total Taxes Earned</span>
                            <span class="ns-econ-val">$${fmt(n.totalTaxEarned)}</span>
                        </div>
                    </div>
                </div>

                <!-- MILITARY SECTION -->
                <div class="ns-section">
                    <h4 class="ns-section-title">⚔️ Military</h4>
                    <div class="ns-mil-grid">
                        <div class="ns-mil-item">
                            <span class="ns-mil-icon">💪</span>
                            <span class="ns-mil-val">${fmt(n.militaryStrength)}</span>
                            <span class="ns-mil-lbl">Strength</span>
                        </div>
                        <div class="ns-mil-item">
                            <span class="ns-mil-icon">🗡️</span>
                            <span class="ns-mil-val">${n.baseAttack ?? 50}</span>
                            <span class="ns-mil-lbl">Attack</span>
                        </div>
                        <div class="ns-mil-item">
                            <span class="ns-mil-icon">🛡️</span>
                            <span class="ns-mil-val">${n.baseDefense ?? 50}</span>
                            <span class="ns-mil-lbl">Defense</span>
                        </div>
                        <div class="ns-mil-item">
                            <span class="ns-mil-icon">👤</span>
                            <span class="ns-mil-val">${fmt(mu.soldiers ?? 0)}</span>
                            <span class="ns-mil-lbl">Soldiers</span>
                        </div>
                        <div class="ns-mil-item">
                            <span class="ns-mil-icon">🛡️</span>
                            <span class="ns-mil-val">${fmt(mu.tanks ?? 0)}</span>
                            <span class="ns-mil-lbl">Tanks</span>
                        </div>
                        <div class="ns-mil-item">
                            <span class="ns-mil-icon">✈️</span>
                            <span class="ns-mil-val">${fmt(mu.aircraft ?? 0)}</span>
                            <span class="ns-mil-lbl">Aircraft</span>
                        </div>
                        <div class="ns-mil-item">
                            <span class="ns-mil-icon">🚢</span>
                            <span class="ns-mil-val">${fmt(mu.ships ?? 0)}</span>
                            <span class="ns-mil-lbl">Ships</span>
                        </div>
                        <div class="ns-mil-item">
                            <span class="ns-mil-icon">🕵️</span>
                            <span class="ns-mil-val">${fmt(mu.spies ?? 0)}</span>
                            <span class="ns-mil-lbl">Spies</span>
                        </div>
                        <div class="ns-mil-item">
                            <span class="ns-mil-icon">🚀</span>
                            <span class="ns-mil-val">${fmt(mu.missiles ?? 0)}</span>
                            <span class="ns-mil-lbl">Missiles</span>
                        </div>
                        <div class="ns-mil-item">
                            <span class="ns-mil-icon">☢️</span>
                            <span class="ns-mil-val">${fmt(mu.nukes ?? 0)}</span>
                            <span class="ns-mil-lbl">Nukes</span>
                        </div>
                        <div class="ns-mil-item">
                            <span class="ns-mil-icon">💸</span>
                            <span class="ns-mil-val">$${fmt(n.militaryBudget)}</span>
                            <span class="ns-mil-lbl">Mil. Budget</span>
                        </div>
                        <div class="ns-mil-item">
                            <span class="ns-mil-icon">⚔️</span>
                            <span class="ns-mil-val">${(n.wars || []).length}</span>
                            <span class="ns-mil-lbl">Active Wars</span>
                        </div>
                    </div>
                </div>

                <!-- RESEARCH SECTION -->
                <div class="ns-section">
                    <h4 class="ns-section-title">🔬 Research</h4>
                    <div class="ns-research-grid">
                        <div class="ns-econ-item">
                            <span class="ns-econ-label">Research Points</span>
                            <span class="ns-econ-val">${fmt(n.researchPoints)}</span>
                        </div>
                        <div class="ns-econ-item">
                            <span class="ns-econ-label">Technologies</span>
                            <span class="ns-econ-val">${n.technologies?.size ?? 0}</span>
                        </div>
                        ${n.currentResearch ? `
                        <div class="ns-econ-item">
                            <span class="ns-econ-label">Researching</span>
                            <span class="ns-econ-val">${n.currentResearch}</span>
                        </div>
                        <div class="ns-econ-item">
                            <span class="ns-econ-label">Progress</span>
                            <span class="ns-econ-val">${Math.round(n.researchProgress ?? 0)}%</span>
                        </div>` : ''}
                    </div>
                </div>

                <!-- DISEASE SECTION (if any active) -->
                ${diseaseSectionHtml}

                <!-- DOMESTIC POLICIES -->
                <div class="ns-section">
                    <h4 class="ns-section-title">📜 Policies</h4>
                    <div class="ns-policy-grid">${polHtml || '<div class="ns-empty">No policies set</div>'}</div>
                </div>

                <!-- IMPROVEMENTS -->
                <div class="ns-section">
                    <h4 class="ns-section-title">🏗️ Improvements</h4>
                    <div class="ns-impr-grid">${imprHtml}</div>
                </div>

                <!-- PROJECTS -->
                <div class="ns-section">
                    <h4 class="ns-section-title">🏛️ Projects</h4>
                    <div class="ns-impr-grid">${projHtml}</div>
                </div>

                <!-- STATISTICS RECORDS -->
                <div class="ns-section">
                    <h4 class="ns-section-title">📋 Nation Records</h4>
                    <div class="ns-econ-grid">
                        ${Object.entries(n.statistics || {}).map(([k, v]) => `
                        <div class="ns-econ-item">
                            <span class="ns-econ-label">${k.replace(/([A-Z])/g,' $1').trim()}</span>
                            <span class="ns-econ-val">${fmt(v)}</span>
                        </div>`).join('')}
                    </div>
                </div>

            </div>
        `;
    }

    /**
     * Refresh the Economy tab — renders the full EconomyPanel
     */
    refreshEconomyTab() {
        const container = document.getElementById('nation-economy-tab');
        if (!container) return;

        // Initialize economy panel if not already done
        if (!window.economyPanel) {
            window.economyPanel = new EconomyPanel();
            window.economyPanel.initialize();
        }

        container.innerHTML = window.economyPanel.render();

        // Re-attach input listeners for create-offer form
        const amountInput = container.querySelector('#offer-amount');
        const priceInput  = container.querySelector('#offer-price');
        if (amountInput) {
            amountInput.addEventListener('input', () => window.economyPanel.updateOfferCalculation());
        }
        if (priceInput) {
            priceInput.addEventListener('input', () => window.economyPanel.updateOfferCalculation());
        }
    }
    
    /**
     * Format number for display
     */
    formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        } else if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return Math.floor(num).toString();
    }
    
    // Placeholder refresh methods for other popups
    refreshBuildPopup() {
        // Will be implemented with build system
    }
    
    refreshMilitaryPopup() {
        if (!window.Nation) return;
        
        // Update military strength
        const militaryStrengthEl = document.getElementById('military-strength-display');
        if (militaryStrengthEl) {
            militaryStrengthEl.textContent = this.formatNumber(window.Nation.militaryStrength || 0);
        }
        
        // Update military morale
        const militaryMoraleEl = document.getElementById('military-morale-display');
        if (militaryMoraleEl) {
            const morale = Math.round((window.Nation.nationStats?.militaryMorale || 1.0) * 100);
            militaryMoraleEl.textContent = `${morale}%`;
        }
        
        // Update current energy
        const currentEnergyEl = document.getElementById('current-energy-display');
        if (currentEnergyEl && window.Player) {
            currentEnergyEl.textContent = window.Player.getCurrentEnergy();
        }
        
        // Update active wars count
        const activeWarsEl = document.getElementById('active-wars-display');
        if (activeWarsEl && window.WarSystem) {
            const activeWars = window.WarSystem.getActiveWars();
            const playerWars = activeWars.filter(war => 
                war.sides.attacker.nations.includes(window.Nation.id) ||
                war.sides.defender.nations.includes(window.Nation.id)
            );
            activeWarsEl.textContent = playerWars.length;
        }
        
        // Update recent military activity
        this.updateRecentMilitaryActivity();
        
        // Bind military popup events
        this.bindMilitaryPopupEvents();
    }

    /**
     * Bind event handlers for the military popup buttons
     */
    bindMilitaryPopupEvents() {
        // Open War Panel button
        const openWarPanelBtn = document.getElementById('open-war-panel');
        if (openWarPanelBtn && !openWarPanelBtn.hasAttribute('data-bound')) {
            openWarPanelBtn.setAttribute('data-bound', 'true');
            openWarPanelBtn.addEventListener('click', () => {
                if (window.WarPanel) {
                    window.WarPanel.show();
                } else if (window.warPanel) {
                    window.warPanel.show();
                } else {
                    EventBus.emit('show_war_panel');
                }
            });
        }

        // Train / Manage Units button — shows per-unit counts and buy buttons
        const viewUnitsBtn = document.getElementById('view-military-units');
        if (viewUnitsBtn && !viewUnitsBtn.hasAttribute('data-bound')) {
            viewUnitsBtn.setAttribute('data-bound', 'true');
            viewUnitsBtn.addEventListener('click', () => {
                this.showTrainUnitsModal();
            });
        }
    }

    /**
     * Show a modal with all 7 unit types, counts, and simple train buttons
     */
    showTrainUnitsModal() {
        // Remove any existing modal
        const existing = document.getElementById('train-units-modal');
        if (existing) existing.remove();

        const nation = window.Nation;
        const units = nation?.militaryUnits || {};

        const UNIT_DEFS = [
            { key: 'soldiers', icon: '🪖', label: 'Soldiers',  strength: 1,    tech: 0,   cost: '$1 ea' },
            { key: 'tanks',    icon: '🛡️', label: 'Tanks',     strength: 25,   tech: 150, cost: '$50 ea' },
            { key: 'aircraft', icon: '✈️', label: 'Aircraft',  strength: 100,  tech: 300, cost: '$150 ea' },
            { key: 'ships',    icon: '🚢', label: 'Ships',     strength: 200,  tech: 450, cost: '$500 ea' },
            { key: 'spies',    icon: '🕵️', label: 'Spies',     strength: 10,   tech: 0,   cost: '$100K ea' },
            { key: 'missiles', icon: '💣', label: 'Missiles',  strength: 500,  tech: 500, cost: '$500K ea' },
            { key: 'nukes',    icon: '☢️', label: 'Nukes',     strength: 2000, tech: 750, cost: '$1.5M ea' }
        ];

        const rows = UNIT_DEFS.map(u => {
            const count = units[u.key] || 0;
            const techOk = !u.tech || (nation?.tech || 0) >= u.tech;
            const techNote = u.tech ? `Tech ${u.tech}+ required` : 'No tech required';
            return `
                <tr class="unit-row ${!techOk ? 'unit-locked' : ''}">
                    <td class="unit-icon-cell">${u.icon}</td>
                    <td class="unit-name-cell"><strong>${u.label}</strong><br><small>${techNote}</small></td>
                    <td class="unit-count-cell">${count.toLocaleString()}</td>
                    <td class="unit-strength-cell">+${u.strength}/unit</td>
                    <td class="unit-cost-cell">${u.cost}</td>
                    <td class="unit-action-cell">
                        ${techOk
                            ? `<button class="unit-train-btn" data-unit="${u.key}">Train</button>`
                            : `<span class="unit-locked-label">🔒 Locked</span>`
                        }
                    </td>
                </tr>
            `;
        }).join('');

        const modalHTML = `
            <div id="train-units-modal" class="modal-overlay">
                <div class="modal-content train-units-modal">
                    <div class="modal-header">
                        <h3>⚔️ Military Units</h3>
                        <button class="close-modal" onclick="document.getElementById('train-units-modal').remove()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="unit-totals">
                            <span>💪 Total Strength: <strong id="modal-mil-strength">${(nation?.militaryStrength || 0).toLocaleString()}</strong></span>
                            <span>🎖️ Morale: <strong>${Math.round((nation?.nationStats?.militaryMorale || 1.0) * 100)}%</strong></span>
                        </div>
                        <table class="units-table">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Unit</th>
                                    <th>Count</th>
                                    <th>Strength</th>
                                    <th>Cost</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                        <p class="unit-note">🩸 Casualties occur during combat and from spy operations. Units at 50% strength if maintenance can't be paid.</p>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.insertAdjacentHTML('beforeend', modalHTML);
        }

        // Bind train buttons (emit events — actual purchase handled by game engine)
        document.querySelectorAll('.unit-train-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const unitType = btn.dataset.unit;
                EventBus.emit('open_train_unit', { unitType });
            });
        });
    }

    /**
     * Update the recent military activity list in the military popup
     */
    updateRecentMilitaryActivity() {
        const container = document.getElementById('military-activity-list');
        if (!container) return;

        // Pull from Nation event history if available
        const eventHistory = window.Nation?.eventHistory || [];
        const militaryEvents = eventHistory
            .filter(e => e.type && (
                e.type.includes('war') || e.type.includes('attack') ||
                e.type.includes('missile') || e.type.includes('nuke') ||
                e.type.includes('spy') || e.type.includes('military')
            ))
            .slice(-5)
            .reverse();

        // Also pull from WarSystem active wars for live context
        const activeWars = window.WarSystem ? window.WarSystem.getActiveWars().filter(w =>
            w.sides.attacker.nations.includes(window.Nation?.id) ||
            w.sides.defender.nations.includes(window.Nation?.id)
        ) : [];

        // Build the activity lines
        const lines = [];

        activeWars.forEach(war => {
            const isAttacker = war.sides.attacker.nations.includes(window.Nation?.id);
            lines.push(`
                <div class="activity-item activity-war">
                    <span class="activity-icon">⚔️</span>
                    <span class="activity-text">${isAttacker ? 'Attacking' : 'Defending'} — <em>${war.reason}</em> (${war.status})</span>
                </div>
            `);
        });

        militaryEvents.forEach(evt => {
            const iconMap = {
                war_declared:    '⚔️',
                war_ended:       '🕊️',
                attack_executed: '💥',
                missile_hit:     '💣',
                nuke_hit:        '☢️',
                spy_operation:   '🕵️',
                casualties:      '🩸',
            };
            const icon = iconMap[evt.type] || '🎖️';
            lines.push(`
                <div class="activity-item">
                    <span class="activity-icon">${icon}</span>
                    <span class="activity-text">${evt.message || evt.type}</span>
                </div>
            `);
        });

        // Update unit count display IDs in the military popup
        if (window.Nation?.militaryUnits) {
            const u = window.Nation.militaryUnits;
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.textContent = (val || 0).toLocaleString();
            };
            setVal('unit-soldiers-display', u.soldiers);
            setVal('unit-tanks-display',    u.tanks);
            setVal('unit-aircraft-display', u.aircraft);
            setVal('unit-ships-display',    u.ships);
            setVal('unit-spies-display',    u.spies);
            setVal('unit-missiles-display', u.missiles);
            setVal('unit-nukes-display',    u.nukes);
        }

        if (lines.length === 0) {
            container.innerHTML = `
                <div class="no-activity-message">
                    <p>No recent military activity.</p>
                    <p>💡 Train units, declare wars, or conduct military operations to see activity here.</p>
                </div>
            `;
        } else {
            container.innerHTML = lines.join('');
        }
    }
    
    refreshResearchPopup() {
        // Will be implemented with research system
    }
    
    refreshDiplomacyPopup() {
        // Initialize DiplomacyPanel if not already done
        if (!this.diplomacyPanel) {
            this.diplomacyPanel = new DiplomacyPanel();
        }
        
        // Get current diplomacy status
        const nation = GameEngine?.currentNation || DataManager?.currentNation;
        const diplomacyStatus = GameEngine?.systems?.diplomacy?.getNationDiplomacyStatus?.(nation?.id);
        
        if (diplomacyStatus) {
            // Update summary display
            this.updateDiplomacySummary(diplomacyStatus);
        }
        
        // Set up event handler for opening full diplomacy panel
        const openDiplomacyBtn = document.getElementById('open-full-diplomacy');
        if (openDiplomacyBtn && !openDiplomacyBtn.hasAttribute('data-handler-bound')) {
            openDiplomacyBtn.addEventListener('click', () => {
                this.diplomacyPanel.show();
            });
            openDiplomacyBtn.setAttribute('data-handler-bound', 'true');
        }
    }
    
    updateDiplomacySummary(diplomacyStatus) {
        // Update embassy count
        const embassyCount = document.getElementById('embassy-count');
        if (embassyCount) {
            embassyCount.textContent = diplomacyStatus.treatySlots?.embassies || 0;
        }
        
        // Update treaty count
        const treatyCount = document.getElementById('treaty-count');
        if (treatyCount) {
            treatyCount.textContent = diplomacyStatus.activeTreaties?.length || 0;
        }
        
        // Update friend count
        const friendCount = document.getElementById('friend-count');
        if (friendCount) {
            friendCount.textContent = diplomacyStatus.relationships?.friends?.length || 0;
        }
        
        // Update foe count
        const foeCount = document.getElementById('foe-count');
        if (foeCount) {
            foeCount.textContent = diplomacyStatus.relationships?.foes?.length || 0;
        }
        
        // Update pending proposals
        this.updatePendingProposalsSummary(diplomacyStatus.pendingProposals || []);
    }
    
    updatePendingProposalsSummary(proposals) {
        const summaryContainer = document.getElementById('pending-proposals-summary');
        if (!summaryContainer) return;
        
        if (proposals.length === 0) {
            summaryContainer.innerHTML = '';
            return;
        }
        
        summaryContainer.innerHTML = `
            <div class="pending-proposals-alert">
                <h4>⚠️ Pending Proposals (${proposals.length})</h4>
                <div class="proposals-list">
                    ${proposals.slice(0, 3).map(proposal => `
                        <div class="proposal-summary-item">
                            <span>${proposal.treatyType || 'Aid'} from ${this.getNationName(proposal.proposerId)}</span>
                            <button class="mini-btn" onclick="window.diplomacyPanel?.show()">Review</button>
                        </div>
                    `).join('')}
                    ${proposals.length > 3 ? `<div class="more-proposals">+${proposals.length - 3} more...</div>` : ''}
                </div>
            </div>
        `;
    }
    
    getNationName(nationId) {
        // This would get the actual nation name from game data
        return `Nation ${nationId}`;
    }
    
    refreshTradePopup() {
        // Legacy stub — Economy is now a tab inside the Nation popup.
        // Delegates to refreshEconomyTab() if the Nation popup is open.
        const activeTab = document.querySelector('.nation-tab.active')?.dataset.tab;
        if (activeTab === 'economy') {
            this.refreshEconomyTab();
        }
    }
    
    refreshWorldPopup() {
        if (!window.WorldForum || !window.Player) return;
        
        // Update Congress composition
        this.updateCongressDisplay();
        
        // Update active motions
        this.updateActiveMotions();
        
        // Update player faction status
        this.updatePlayerFactionStatus();
        
        // Update motion creation eligibility
        this.updateMotionCreation();
    }
    
    /**
     * Update Congress display
     */
    updateCongressDisplay() {
        const congressSeats = document.getElementById('congress-seats');
        const totalSeatsDisplay = document.getElementById('total-seats');
        const activeMotionsDisplay = document.getElementById('active-motions');
        
        if (!congressSeats || !window.GridMap) return;
        
        // Clear existing seats
        congressSeats.innerHTML = '';
        
        // Get faction info
        const factionInfo = GridMap.getFactionInfo();
        
        Object.keys(factionInfo).forEach(factionKey => {
            const faction = factionInfo[factionKey];
            
            const seatElement = document.createElement('div');
            seatElement.className = 'seat-faction';
            seatElement.innerHTML = `
                <div class="seat-color" style="background-color: ${faction.color}"></div>
                <div class="seat-name">${faction.name}</div>
                <div class="seat-count">${faction.seats} seat${faction.seats !== 1 ? 's' : ''}</div>
            `;
            
            congressSeats.appendChild(seatElement);
        });
        
        // Update totals
        if (totalSeatsDisplay) {
            const totalSeats = Object.values(factionInfo).reduce((sum, faction) => sum + faction.seats, 0);
            totalSeatsDisplay.textContent = totalSeats;
        }
        
        if (activeMotionsDisplay && window.WorldForum) {
            const activeMotions = WorldForum.getActiveMotions();
            activeMotionsDisplay.textContent = activeMotions.length;
        }
    }
    
    /**
     * Update active motions display
     */
    updateActiveMotions() {
        const motionsList = document.getElementById('motions-list');
        if (!motionsList || !window.WorldForum) return;
        
        const activeMotions = WorldForum.getActiveMotions();
        
        if (activeMotions.length === 0) {
            motionsList.innerHTML = `
                <div class="no-motions">
                    <p>No active motions at this time.</p>
                    <p>Faction representatives can propose new motions for consideration.</p>
                </div>
            `;
            return;
        }
        
        motionsList.innerHTML = '';
        
        activeMotions.forEach(motion => {
            const motionElement = document.createElement('div');
            motionElement.className = 'motion-card';
            
            const deadline = this.formatTimeRemaining(motion.factionVotingEnd || motion.worldVotingEnd);
            
            motionElement.innerHTML = `
                <div class="motion-header">
                    <div>
                        <div class="motion-title">${motion.title}</div>
                        <div class="motion-type">${motion.type.replace('_', ' ')}</div>
                    </div>
                    <div class="motion-status ${motion.status.replace('_', '-')}">${motion.status.replace('_', ' ')}</div>
                </div>
                <div class="motion-description">${motion.description}</div>
                <div class="motion-footer">
                    <div class="motion-proposer">
                        <div class="proposer-faction" style="background-color: ${this.getFactionColor(motion.proposerFaction)}"></div>
                        <span>Proposed by ${motion.proposerFaction} faction</span>
                    </div>
                    <div class="motion-deadline">${deadline}</div>
                </div>
                ${this.canPlayerVoteOnMotion(motion) ? this.createVotingButtons(motion.id) : ''}
            `;
            
            motionsList.appendChild(motionElement);
        });
    }
    
    /**
     * Update player faction status
     */
    updatePlayerFactionStatus() {
        const factionColorElement = document.getElementById('player-faction-color');
        const factionNameElement = document.getElementById('player-faction-name');
        const factionSeatsElement = document.getElementById('player-faction-seats');
        const votingStatusElement = document.getElementById('player-voting-status');
        
        if (!factionColorElement || !window.Player || !window.GridMap) return;
        
        if (Player.factionKey) {
            const factionInfo = GridMap.getFactionInfo();
            const playerFaction = factionInfo[Player.factionKey];
            
            if (playerFaction) {
                factionColorElement.style.backgroundColor = playerFaction.color;
                factionNameElement.textContent = playerFaction.name;
                factionSeatsElement.textContent = `${playerFaction.seats} seat${playerFaction.seats !== 1 ? 's' : ''}`;
                
                if (Player.canVoteInFaction()) {
                    votingStatusElement.textContent = 'Can vote';
                    votingStatusElement.className = 'voting-status can-vote';
                } else {
                    votingStatusElement.textContent = 'Cannot vote (need 24h membership)';
                    votingStatusElement.className = 'voting-status cannot-vote';
                }
            }
        } else {
            factionColorElement.style.backgroundColor = '#374151';
            factionNameElement.textContent = 'No Faction';
            factionSeatsElement.textContent = '0 seats';
            votingStatusElement.textContent = 'Not in faction';
            votingStatusElement.className = 'voting-status cannot-vote';
        }
    }
    
    /**
     * Update motion creation form
     */
    updateMotionCreation() {
        const motionCreation = document.getElementById('motion-creation');
        if (!motionCreation || !window.Player || !window.WorldForum) return;
        
        // Show motion creation if player can propose motions
        if (Player.factionKey) {
            motionCreation.style.display = 'block';
            this.bindMotionCreationEvents();
        } else {
            motionCreation.style.display = 'none';
        }
    }
    
    /**
     * Bind motion creation events
     */
    bindMotionCreationEvents() {
        const proposeBtn = document.getElementById('propose-motion-btn');
        const motionType = document.getElementById('motion-type');
        const motionTitle = document.getElementById('motion-title');
        const motionDescription = document.getElementById('motion-description');
        
        // Remove existing listeners
        const newProposeBtn = proposeBtn?.cloneNode(true);
        if (proposeBtn && newProposeBtn) {
            proposeBtn.parentNode.replaceChild(newProposeBtn, proposeBtn);
        }
        
        // Validate form
        const validateForm = () => {
            const isValid = motionType?.value && motionTitle?.value.trim() && motionDescription?.value.trim();
            if (newProposeBtn) {
                newProposeBtn.disabled = !isValid;
            }
        };
        
        motionType?.addEventListener('change', validateForm);
        motionTitle?.addEventListener('input', validateForm);
        motionDescription?.addEventListener('input', validateForm);
        
        // Handle motion proposal
        newProposeBtn?.addEventListener('click', () => {
            this.proposeNewMotion();
        });
    }
    
    /**
     * Propose new motion
     */
    proposeNewMotion() {
        if (!window.WorldForum || !window.Player) return;
        
        const motionType = document.getElementById('motion-type')?.value;
        const motionTitle = document.getElementById('motion-title')?.value.trim();
        const motionDescription = document.getElementById('motion-description')?.value.trim();
        
        if (!motionType || !motionTitle || !motionDescription) return;
        
        try {
            const motionId = WorldForum.proposeMotion(Player.playerId, motionType, {
                title: motionTitle,
                description: motionDescription
            });
            
            // Clear form
            document.getElementById('motion-type').value = '';
            document.getElementById('motion-title').value = '';
            document.getElementById('motion-description').value = '';
            document.getElementById('propose-motion-btn').disabled = true;
            
            // Refresh display
            this.refreshWorldPopup();
            
            // Show success message
            this.showNotification('Motion proposed successfully!', 'success');
            
        } catch (error) {
            console.error('Error proposing motion:', error);
            this.showNotification(error.message, 'error');
        }
    }
    
    /**
     * Check if player can vote on motion
     */
    canPlayerVoteOnMotion(motion) {
        if (!window.Player) return false;
        return Player.canVoteInFaction() && motion.status === 'faction_voting';
    }
    
    /**
     * Create voting buttons for motion
     */
    createVotingButtons(motionId) {
        return `
            <div class="motion-voting">
                <button class="vote-btn vote-for" onclick="BottomMenu.voteOnMotion(${motionId}, 'for')">For</button>
                <button class="vote-btn vote-against" onclick="BottomMenu.voteOnMotion(${motionId}, 'against')">Against</button>
                <button class="vote-btn vote-abstain" onclick="BottomMenu.voteOnMotion(${motionId}, 'abstain')">Abstain</button>
            </div>
        `;
    }
    
    /**
     * Vote on motion
     */
    voteOnMotion(motionId, vote) {
        if (!window.WorldForum || !window.Player) return;
        
        try {
            WorldForum.voteOnMotion(motionId, Player.playerId, vote);
            this.refreshWorldPopup();
            this.showNotification(`Vote cast: ${vote}`, 'success');
        } catch (error) {
            console.error('Error voting on motion:', error);
            this.showNotification(error.message, 'error');
        }
    }
    
    /**
     * Get faction color by key
     */
    getFactionColor(factionKey) {
        if (!window.GridMap) return '#374151';
        const factionInfo = GridMap.getFactionInfo();
        return factionInfo[factionKey]?.color || '#374151';
    }
    
    /**
     * Format time remaining
     */
    formatTimeRemaining(timestamp) {
        if (!timestamp) return 'No deadline';
        
        const now = Date.now();
        const remaining = timestamp - now;
        
        if (remaining <= 0) return 'Expired';
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} day${days !== 1 ? 's' : ''} remaining`;
        } else {
            return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
        }
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Simple notification - could be enhanced with a proper notification system
        console.log(`[${type.toUpperCase()}] ${message}`);
        // You could implement a toast notification system here
    }
    
    /**
     * Refresh news popup with forum data
     */
    refreshNewsPopup() {
        if (!window.ForumSystem) return;
        
        // Update forum stats
        const totalPostsElement = document.getElementById('total-posts-count');
        const totalCommentsElement = document.getElementById('total-comments-count');
        const totalReactionsElement = document.getElementById('total-reactions-count');
        
        const stats = window.ForumSystem.getForumStats();
        if (totalPostsElement) totalPostsElement.textContent = stats.totalPosts;
        if (totalCommentsElement) totalCommentsElement.textContent = stats.totalComments;
        if (totalReactionsElement) totalReactionsElement.textContent = stats.totalReactions;
        
        // Update recent posts preview
        this.updateRecentPostsPreview();
        
        // Bind forum action buttons
        this.bindNewsPopupEvents();
    }
    
    /**
     * Update recent posts preview in news popup
     */
    updateRecentPostsPreview() {
        const previewContainer = document.querySelector('.posts-preview-list');
        if (!previewContainer || !window.ForumSystem) return;
        
        const recentPosts = window.ForumSystem.getRecentPosts(3); // Get 3 most recent posts
        
        if (recentPosts.length === 0) {
            previewContainer.innerHTML = `
                <div class="no-posts-message">
                    <p>No posts yet. Be the first to share news with the world!</p>
                    <p>ðŸ’¡ You can share updates about your nation, form alliances, or discuss strategy.</p>
                </div>
            `;
            return;
        }
        
        previewContainer.innerHTML = recentPosts.map(post => `
            <div class="post-preview-item" data-post-id="${post.id}">
                <div class="post-preview-header">
                    <span class="post-author">${post.authorName}</span>
                    <span class="post-time">${this.formatTimeAgo(post.timestamp)}</span>
                </div>
                <div class="post-preview-title">${post.title}</div>
                <div class="post-preview-stats">
                    <span>ðŸ’¬ ${post.commentsCount}</span>
                    <span>ðŸ‘ ${post.reactionsCount}</span>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Bind events for news popup
     */
    bindNewsPopupEvents() {
        const openFullForumBtn = document.getElementById('open-full-forum');
        const createQuickPostBtn = document.getElementById('create-quick-post');
        
        if (openFullForumBtn && !openFullForumBtn.hasAttribute('data-bound')) {
            openFullForumBtn.setAttribute('data-bound', 'true');
            openFullForumBtn.addEventListener('click', () => {
                this.closePopup('news-popup');
                if (window.ForumPanel) {
                    window.ForumPanel.show();
                } else {
                    EventBus.emit('show_forum_panel');
                }
            });
        }
        
        if (createQuickPostBtn && !createQuickPostBtn.hasAttribute('data-bound')) {
            createQuickPostBtn.setAttribute('data-bound', 'true');
            createQuickPostBtn.addEventListener('click', () => {
                this.closePopup('news-popup');
                if (window.ForumPanel) {
                    window.ForumPanel.show();
                    window.ForumPanel.showCreatePost();
                } else {
                    EventBus.emit('show_forum_panel', { action: 'create_post' });
                }
            });
        }
    }
    
    /**
     * Refresh chat popup with messaging data
     */
    refreshChatPopup() {
        if (!window.MessagingSystem) return;
        
        // Update chat stats
        const worldChatElement = document.getElementById('world-chat-count');
        const allianceChatElement = document.getElementById('alliance-chat-count');
        const privateMessagesElement = document.getElementById('private-messages-count');
        
        const stats = window.MessagingSystem.getMessageStats();
        if (worldChatElement) worldChatElement.textContent = stats.worldMessages;
        if (allianceChatElement) allianceChatElement.textContent = stats.allianceMessages;
        if (privateMessagesElement) privateMessagesElement.textContent = stats.privateMessages;
        
        // Update chat preview
        this.updateChatPreview();
        
        // Bind chat action buttons
        this.bindChatPopupEvents();
    }
    
    /**
     * Update chat preview in chat popup
     */
    updateChatPreview() {
        const previewContainer = document.getElementById('chat-preview-messages');
        if (!previewContainer || !window.MessagingSystem) return;
        
        // Get current active channel from tabs
        const activeTab = document.querySelector('.chat-tabs-mini .tab-btn.active');
        const currentChannel = activeTab ? activeTab.dataset.channel : 'world';
        
        const recentMessages = window.MessagingSystem.getRecentMessages(currentChannel, 5);
        
        if (recentMessages.length === 0) {
            previewContainer.innerHTML = `
                <div class="no-messages">
                    <p>No recent messages. Join the conversation!</p>
                    <p>ðŸ—£ï¸ Share strategies, coordinate with allies, or make new friends.</p>
                </div>
            `;
            return;
        }
        
        previewContainer.innerHTML = recentMessages.map(message => `
            <div class="message-preview-item">
                <div class="message-author">${message.senderName}</div>
                <div class="message-content">${this.truncateMessage(message.content, 50)}</div>
                <div class="message-time">${this.formatTimeAgo(message.timestamp)}</div>
            </div>
        `).join('');
    }
    
    /**
     * Bind events for chat popup
     */
    bindChatPopupEvents() {
        // Bind tab switching
        const chatTabs = document.querySelectorAll('.chat-tabs-mini .tab-btn');
        chatTabs.forEach(tab => {
            if (!tab.hasAttribute('data-bound')) {
                tab.setAttribute('data-bound', 'true');
                tab.addEventListener('click', () => {
                    // Update active tab
                    chatTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    
                    // Update preview
                    this.updateChatPreview();
                });
            }
        });
        
        const openFullMessengerBtn = document.getElementById('open-full-messenger');
        const sendQuickMessageBtn = document.getElementById('send-quick-message');
        
        if (openFullMessengerBtn && !openFullMessengerBtn.hasAttribute('data-bound')) {
            openFullMessengerBtn.setAttribute('data-bound', 'true');
            openFullMessengerBtn.addEventListener('click', () => {
                this.closePopup('chat-popup');
                if (window.MessagingPanel) {
                    window.MessagingPanel.show();
                } else {
                    EventBus.emit('show_messaging_panel');
                }
            });
        }
        
        if (sendQuickMessageBtn && !sendQuickMessageBtn.hasAttribute('data-bound')) {
            sendQuickMessageBtn.setAttribute('data-bound', 'true');
            sendQuickMessageBtn.addEventListener('click', () => {
                this.closePopup('chat-popup');
                if (window.MessagingPanel) {
                    window.MessagingPanel.show();
                    window.MessagingPanel.focusInput();
                } else {
                    EventBus.emit('show_messaging_panel', { action: 'focus_input' });
                }
            });
        }
    }
    
    /**
     * Format time ago helper
     */
    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ago`;
        } else if (hours > 0) {
            return `${hours}h ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return 'Just now';
        }
    }
    
    /**
     * Truncate message for preview
     */
    truncateMessage(message, maxLength) {
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    }
    
    /**
     * Refresh team popup with sports team data
     */
    refreshTeamPopup() {
        // Initialize team panel if not already done
        if (!window.teamPanel) {
            window.teamPanel = new TeamPanel();
        }
        
        // Check if any sports are available
        const sportsSystem = window.gameEngine?.systems?.sports;
        const nation = window.gameEngine?.currentPlayer?.nation;
        
        if (!sportsSystem || !nation) {
            // Hide team tab if no sports system or nation
            const teamTab = document.getElementById('team-tab');
            if (teamTab) teamTab.style.display = 'none';
            return;
        }
        
        const availableSports = sportsSystem.getAvailableSports(nation.id);
        const teamTab = document.getElementById('team-tab');
        
        if (availableSports.length > 0) {
            // Show team tab if sports are available
            if (teamTab) teamTab.style.display = 'inline-block';
            
            // Render team panel content
            const container = document.getElementById('team-panel-container');
            if (container) {
                container.innerHTML = '';
                container.appendChild(window.teamPanel.element);
                window.teamPanel.show();
            }
        } else {
            // Hide team tab if no sports available
            if (teamTab) teamTab.style.display = 'none';
        }
    }
    
    /**
     * Update team tab visibility based on available sports
     */
    updateTeamTabVisibility() {
        const sportsSystem = window.gameEngine?.systems?.sports;
        const nation = window.gameEngine?.currentPlayer?.nation;
        const teamTab = document.getElementById('team-tab');
        
        if (!teamTab) return;
        
        if (sportsSystem && nation) {
            const availableSports = sportsSystem.getAvailableSports(nation.id);
            teamTab.style.display = availableSports.length > 0 ? 'inline-block' : 'none';
        } else {
            teamTab.style.display = 'none';
        }
    }

    /**
     * Refresh research popup content
     */
    refreshResearchPopup() {
        // Initialize research panel if not already done
        if (!window.researchPanel) {
            window.researchPanel = new ResearchPanel();
            window.researchPanel.initialize();
        }
        
        // Render research panel content
        const container = document.getElementById('research-panel-container');
        if (container) {
            container.innerHTML = window.researchPanel.render();
        }
    }
    
    /**
     * Refresh health/diseases popup content
     * Legacy stub — disease data is now shown inside the Nation Stats tab.
     */
    refreshHealthPopup() {
        const activeTab = document.querySelector('.nation-tab.active')?.dataset.tab;
        if (activeTab === 'nationstats') {
            this.refreshNationStatsTab();
        }
    }
}

// Create global bottom menu instance
window.BottomMenu = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.BottomMenu = new BottomMenuSystem();
});

// Add improvements panel functionality
document.addEventListener('DOMContentLoaded', () => {
    const showImprovementsBtn = document.getElementById('show-improvements-btn');
    if (showImprovementsBtn) {
        showImprovementsBtn.addEventListener('click', () => {
            EventBus.emit('show_improvements_panel');
        });
    }
    
    const showInfrastructureBtn = document.getElementById('show-infrastructure-btn');
    if (showInfrastructureBtn) {
        showInfrastructureBtn.addEventListener('click', () => {
            // TODO: Implement infrastructure panel
            alert('Infrastructure development panel coming soon!');
        });
    }
    
    const showProjectsBtn = document.getElementById('show-projects-btn');
    if (showProjectsBtn) {
        showProjectsBtn.addEventListener('click', () => {
            EventBus.emit('show_projects_panel');
        });
    }
    
    const showWondersBtn = document.getElementById('show-wonders-btn');
    if (showWondersBtn) {
        showWondersBtn.addEventListener('click', () => {
            if (window.WondersPanel) {
                window.WondersPanel.show();
            }
        });
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BottomMenuSystem, BottomMenu };
}
