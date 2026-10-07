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
        
        // Switch to new popup
        this.showPopup(popupId);
        this.setActiveTab(tabId);
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
            case 'trade-popup':
                this.refreshTradePopup();
                break;
            case 'world-popup':
                this.refreshWorldPopup();
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
        // Will be implemented with military system
    }
    
    refreshResearchPopup() {
        // Will be implemented with research system
    }
    
    refreshDiplomacyPopup() {
        // Will be implemented with diplomacy system
    }
    
    refreshTradePopup() {
        // Will be implemented with trade system
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
}

// Create global bottom menu instance
let BottomMenu = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    BottomMenu = new BottomMenuSystem();
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
});