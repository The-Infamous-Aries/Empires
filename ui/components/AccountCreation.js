/**
 * Account Creation System - User & Nation Setup
 * Dominion Wars - Nation Building Strategy Game
 */

class AccountCreationSystem {
    constructor() {
        this.isInitialized = false;
        this.currentStep = 1;
        this.totalSteps = 5;
        this.userData = {
            username: '',
            rulerName: '',
            nationName: '',
            factionColor: null,
            selectedColorKey: null,
            selectedGovernment: 'liberalDemocracy',
            selectedReligion: 'monotheism'
        };
        
        this.factionColors = null;
        this.initialize();
    }
    
    /**
     * Initialize account creation system
     */
    initialize() {
        console.log('Initializing Account Creation System...');
        
        // Get faction colors from map data
        if (window.GridMap) {
            this.factionColors = GridMap.getAvailableFactionColors();
        }
        
        this.createAccountModal();
        this.bindEvents();
        
        // Wait for GovernmentSystem and ReligionSystem to be available
        this.waitForSystems();
        
        this.isInitialized = true;
        console.log('Account Creation System initialized');
    }

    /**
     * Wait for required systems to load
     */
    waitForSystems() {
        const checkSystems = () => {
            if (window.GovernmentSystem) {
                this.populateGovernments();
            }
            if (window.ReligionSystem) {
                this.populateReligions();
            }
        };
        
        // Try immediately, then poll
        checkSystems();
        if (!window.GovernmentSystem || !window.ReligionSystem) {
            setTimeout(checkSystems, 100);
        }
    }
    
    /**
     * Create account creation modal
     */
    createAccountModal() {
        const modalHTML = `
            <div id="account-creation-modal" class="account-modal hidden">
                <div class="account-modal-overlay"></div>
                <div class="account-modal-content">
                    <div class="account-header">
                        <h2>Welcome to Dominion Wars</h2>
                        <p>Create your ruler and nation to begin your empire</p>
                        <div class="step-indicator">
                            <div class="step active" data-step="1">
                                <div class="step-number">1</div>
                                <div class="step-label">Account</div>
                            </div>
                            <div class="step" data-step="2">
                                <div class="step-number">2</div>
                                <div class="step-label">Nation</div>
                            </div>
                            <div class="step" data-step="3">
                                <div class="step-number">3</div>
                                <div class="step-label">Government</div>
                            </div>
                            <div class="step" data-step="4">
                                <div class="step-number">4</div>
                                <div class="step-label">Religion</div>
                            </div>
                            <div class="step" data-step="5">
                                <div class="step-number">5</div>
                                <div class="step-label">Faction</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="account-body">
                        <!-- Step 1: Account Info -->
                        <div id="step-1" class="creation-step active">
                            <h3>Player Account</h3>
                            <div class="form-group">
                                <label for="username">Username</label>
                                <input type="text" id="username" placeholder="Enter your username" maxlength="20">
                                <small>This is your unique identifier in the game</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="ruler-name">Ruler Name</label>
                                <input type="text" id="ruler-name" placeholder="Enter your ruler name" maxlength="30">
                                <small>The name of your leader character</small>
                            </div>
                            
                            <div class="validation-info">
                                <div class="validation-item" id="username-validation">
                                    <span class="validation-icon">⏳</span>
                                    <span class="validation-text">Username availability checking...</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Step 2: Nation Setup -->
                        <div id="step-2" class="creation-step">
                            <h3>Nation Details</h3>
                            <div class="form-group">
                                <label for="nation-name">Nation Name</label>
                                <input type="text" id="nation-name" placeholder="Enter your nation name" maxlength="40">
                                <small>The official name of your nation</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="nation-motto">National Motto (Optional)</label>
                                <input type="text" id="nation-motto" placeholder="Enter a motto for your nation" maxlength="60">
                                <small>A slogan or principle that represents your nation</small>
                            </div>
                        </div>
                        
                        <!-- Step 3: Government Selection -->
                        <div id="step-3" class="creation-step">
                            <h3>Government Type</h3>
                            <p class="step-description">Choose your nation's governing system. This affects bonuses, penalties, and policies.</p>
                            <div class="reference-link">
                                <button type="button" id="view-gov-reference" class="reference-btn">
                                    📖 View Government Encyclopedia
                                </button>
                            </div>
                            <div class="form-group">
                                <label for="government-select">Select Government</label>
                                <select id="government-select">
                                    <!-- Populated by JavaScript -->
                                </select>
                            </div>
                            <div id="government-preview" class="selection-preview">
                                <!-- Government preview populated by JavaScript -->
                            </div>
                        </div>
                        
                        <!-- Step 4: Religion Selection -->
                        <div id="step-4" class="creation-step">
                            <h3>Religion & Philosophy</h3>
                            <p class="step-description">Choose your nation's religious or philosophical foundation.</p>
                            <div class="reference-link">
                                <button type="button" id="view-religion-reference" class="reference-btn">
                                    📖 View Religion Encyclopedia
                                </button>
                            </div>
                            <div class="form-group">
                                <label for="religion-select">Select Religion</label>
                                <select id="religion-select">
                                    <!-- Populated by JavaScript -->
                                </select>
                            </div>
                            <div id="religion-preview" class="selection-preview">
                                <!-- Religion preview populated by JavaScript -->
                            </div>
                        </div>
                        
                        <!-- Step 5: Faction Selection -->
                        <div id="step-5" class="creation-step">
                            <h3>World Congress Faction</h3>
                            <p class="faction-description">
                                Choose your faction color for World Congress representation. 
                                Each faction gets seats based on membership (minimum 1 seat per faction).
                            </p>
                            
                            <div class="faction-grid" id="faction-grid">
                                <!-- Faction colors will be populated here -->
                            </div>
                            
                            <div class="selected-faction-info" id="selected-faction-info" style="display: none;">
                                <div class="faction-preview">
                                    <div class="faction-color-preview" id="preview-color"></div>
                                    <div class="faction-details">
                                        <h4 id="preview-name">Faction Name</h4>
                                        <p id="preview-members">0 members</p>
                                        <p id="preview-seats">1 seat in Congress</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="account-footer">
                        <button id="prev-step-btn" class="step-btn secondary" disabled>Previous</button>
                        <button id="next-step-btn" class="step-btn primary">Next</button>
                        <button id="create-account-btn" class="step-btn primary" style="display: none;">Create Nation</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Populate faction colors
        this.populateFactionColors();
    }
    
    /**
     * Populate faction color selection
     */
    populateFactionColors() {
        if (!this.factionColors) return;
        
        const factionGrid = document.getElementById('faction-grid');
        if (!factionGrid) return;
        
        factionGrid.innerHTML = '';
        
        this.factionColors.forEach(faction => {
            const factionCard = document.createElement('div');
            factionCard.className = 'faction-card';
            factionCard.dataset.factionKey = faction.key;
            
            factionCard.innerHTML = `
                <div class="faction-color" style="background-color: ${faction.color}"></div>
                <div class="faction-info">
                    <div class="faction-name">${faction.name}</div>
                    <div class="faction-stats">
                        <span>${faction.members} members</span>
                        <span>${faction.seats} seat${faction.seats !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            `;
            
            factionCard.addEventListener('click', () => {
                this.selectFaction(faction.key, faction);
            });
            
            factionGrid.appendChild(factionCard);
        });
    }

    /**
     * Populate government selection
     */
    populateGovernments() {
        const select = document.getElementById('government-select');
        if (!select || !window.GovernmentSystem) return;

        const governments = GovernmentSystem.getAllGovernments();
        select.innerHTML = '';

        governments.forEach(gov => {
            const option = document.createElement('option');
            option.value = gov.id;
            option.textContent = gov.name;
            select.appendChild(option);
        });

        // Set default selection
        select.value = this.userData.selectedGovernment;
        
        // Show preview
        this.updateGovernmentPreview(this.userData.selectedGovernment);
    }

    /**
     * Update government preview
     */
    updateGovernmentPreview(governmentId) {
        const preview = document.getElementById('government-preview');
        if (!preview || !window.GovernmentSystem) return;

        const gov = GovernmentSystem.getGovernment(governmentId);
        if (!gov) return;

        // Build bonuses HTML
        const bonusesHTML = Object.entries(gov.bonuses || {}).map(([key, value]) => {
            const percentage = Math.round((value - 1) * 100);
            if (percentage === 0) return '';
            const sign = percentage > 0 ? '+' : '';
            const className = percentage > 0 ? 'bonus-positive' : 'bonus-negative';
            const label = key.replace(/([A-Z])/g, ' $1').trim();
            return `<span class="${className}">${sign}${percentage}% ${label}</span>`;
        }).join('');

        const penaltiesHTML = Object.entries(gov.penalties || {}).map(([key, value]) => {
            const percentage = Math.round((value - 1) * 100);
            if (percentage === 0) return '';
            const className = 'bonus-negative';
            const label = key.replace(/([A-Z])/g, ' $1').trim();
            return `<span class="${className}">${percentage}% ${label}</span>`;
        }).join('');

        preview.innerHTML = `
            <div class="preview-header">
                <strong>${gov.name}</strong>
                <span class="preview-fullname">${gov.fullName}</span>
            </div>
            <p class="preview-description">${gov.description}</p>
            ${bonusesHTML ? `<div class="preview-bonuses"><strong>Bonuses:</strong> ${bonusesHTML}</div>` : ''}
            ${penaltiesHTML ? `<div class="preview-penalties"><strong>Penalties:</strong> ${penaltiesHTML}</div>` : ''}
        `;
    }

    /**
     * Populate religion selection
     */
    populateReligions() {
        const select = document.getElementById('religion-select');
        if (!select || !window.ReligionSystem) return;

        const religions = ReligionSystem.getAllReligions();
        select.innerHTML = '';

        religions.forEach(religion => {
            const option = document.createElement('option');
            option.value = religion.id;
            option.textContent = religion.name;
            select.appendChild(option);
        });

        // Set default selection
        select.value = this.userData.selectedReligion;
        
        // Show preview
        this.updateReligionPreview(this.userData.selectedReligion);
    }

    /**
     * Update religion preview
     */
    updateReligionPreview(religionId) {
        const preview = document.getElementById('religion-preview');
        if (!preview || !window.ReligionSystem) return;

        const religion = ReligionSystem.getReligion(religionId);
        if (!religion) return;

        // Build bonuses HTML
        const bonusesHTML = Object.entries(religion.bonuses || {}).map(([key, value]) => {
            const percentage = Math.round((value - 1) * 100);
            if (percentage === 0) return '';
            const sign = percentage > 0 ? '+' : '';
            const className = percentage > 0 ? 'bonus-positive' : 'bonus-negative';
            const label = key.replace(/([A-Z])/g, ' $1').trim();
            return `<span class="${className}">${sign}${percentage}% ${label}</span>`;
        }).join('');

        const penaltiesHTML = Object.entries(religion.penalties || {}).map(([key, value]) => {
            const percentage = Math.round((value - 1) * 100);
            if (percentage === 0) return '';
            const className = 'bonus-negative';
            const label = key.replace(/([A-Z])/g, ' $1').trim();
            return `<span class="${className}">${percentage}% ${label}</span>`;
        }).join('');

        preview.innerHTML = `
            <div class="preview-header">
                <strong>${religion.name}</strong>
                <span class="preview-fullname">${religion.fullName}</span>
            </div>
            <p class="preview-description">${religion.description}</p>
            ${bonusesHTML ? `<div class="preview-bonuses"><strong>Bonuses:</strong> ${bonusesHTML}</div>` : ''}
            ${penaltiesHTML ? `<div class="preview-penalties"><strong>Penalties:</strong> ${penaltiesHTML}</div>` : ''}
        `;
    }
    
    /**
     * Select a faction
     */
    selectFaction(factionKey, factionData) {
        // Remove previous selection
        const previousSelected = document.querySelector('.faction-card.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }
        
        // Select new faction
        const factionCard = document.querySelector(`[data-faction-key="${factionKey}"]`);
        if (factionCard) {
            factionCard.classList.add('selected');
        }
        
        // Update user data
        this.userData.selectedColorKey = factionKey;
        this.userData.factionColor = factionData.color;
        
        // Show faction preview
        this.showFactionPreview(factionData);
        
        // Enable create button if on last step
        this.validateCurrentStep();
    }
    
    /**
     * Show faction preview
     */
    showFactionPreview(factionData) {
        const previewContainer = document.getElementById('selected-faction-info');
        const previewColor = document.getElementById('preview-color');
        const previewName = document.getElementById('preview-name');
        const previewMembers = document.getElementById('preview-members');
        const previewSeats = document.getElementById('preview-seats');
        
        if (previewContainer && previewColor && previewName && previewMembers && previewSeats) {
            previewContainer.style.display = 'block';
            previewColor.style.backgroundColor = factionData.color;
            previewName.textContent = factionData.name;
            previewMembers.textContent = `${factionData.members} members`;
            previewSeats.textContent = `${factionData.seats} seat${factionData.seats !== 1 ? 's' : ''} in Congress`;
        }
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Form inputs
        document.getElementById('username')?.addEventListener('input', (e) => {
            this.userData.username = e.target.value.trim();
            this.validateUsername();
            this.validateCurrentStep();
        });
        
        document.getElementById('ruler-name')?.addEventListener('input', (e) => {
            this.userData.rulerName = e.target.value.trim();
            this.validateCurrentStep();
        });
        
        document.getElementById('nation-name')?.addEventListener('input', (e) => {
            this.userData.nationName = e.target.value.trim();
            this.validateCurrentStep();
        });
        
        // Government selection
        document.getElementById('government-select')?.addEventListener('change', (e) => {
            this.userData.selectedGovernment = e.target.value;
            this.updateGovernmentPreview(e.target.value);
            this.validateCurrentStep();
        });
        
        // Religion selection
        document.getElementById('religion-select')?.addEventListener('change', (e) => {
            this.userData.selectedReligion = e.target.value;
            this.updateReligionPreview(e.target.value);
            this.validateCurrentStep();
        });
        
        // Reference page buttons
        document.getElementById('view-gov-reference')?.addEventListener('click', () => {
            if (window.ReferencePage) {
                ReferencePage.showModal();
                ReferencePage.switchTab('governments');
            }
        });
        
        document.getElementById('view-religion-reference')?.addEventListener('click', () => {
            if (window.ReferencePage) {
                ReferencePage.showModal();
                ReferencePage.switchTab('religions');
            }
        });
        
        // Navigation buttons
        document.getElementById('prev-step-btn')?.addEventListener('click', () => {
            this.previousStep();
        });
        
        document.getElementById('next-step-btn')?.addEventListener('click', () => {
            this.nextStep();
        });
        
        document.getElementById('create-account-btn')?.addEventListener('click', () => {
            this.createAccount();
        });
        
        // Modal overlay click to close
        document.querySelector('.account-modal-overlay')?.addEventListener('click', () => {
            // Only allow closing if account is created
            if (this.isAccountCreated) {
                this.hideModal();
            }
        });
    }
    
    /**
     * Validate username
     */
    validateUsername() {
        const username = this.userData.username;
        const validationItem = document.getElementById('username-validation');
        if (!validationItem) return;
        
        const icon = validationItem.querySelector('.validation-icon');
        const text = validationItem.querySelector('.validation-text');
        
        if (username.length < 3) {
            icon.textContent = '❌';
            text.textContent = 'Username must be at least 3 characters';
            validationItem.className = 'validation-item invalid';
            return false;
        }
        
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            icon.textContent = '❌';
            text.textContent = 'Username can only contain letters, numbers, _ and -';
            validationItem.className = 'validation-item invalid';
            return false;
        }
        
        // Simulate availability check
        icon.textContent = '✅';
        text.textContent = 'Username is available';
        validationItem.className = 'validation-item valid';
        return true;
    }
    
    /**
     * Validate current step
     */
    validateCurrentStep() {
        let isValid = false;
        
        switch (this.currentStep) {
            case 1:
                isValid = this.userData.username.length >= 3 && 
                         this.userData.rulerName.length >= 2 &&
                         this.validateUsername();
                break;
            case 2:
                isValid = this.userData.nationName.length >= 3;
                break;
            case 3:
                isValid = !!this.userData.selectedGovernment;
                break;
            case 4:
                isValid = !!this.userData.selectedReligion;
                break;
            case 5:
                isValid = this.userData.selectedColorKey !== null;
                break;
        }
        
        // Update button states
        const nextBtn = document.getElementById('next-step-btn');
        const createBtn = document.getElementById('create-account-btn');
        
        if (this.currentStep < this.totalSteps) {
            nextBtn.disabled = !isValid;
            createBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'none';
            createBtn.style.display = 'block';
            createBtn.disabled = !isValid;
        }
    }
    
    /**
     * Go to next step
     */
    nextStep() {
        if (this.currentStep >= this.totalSteps) return;
        
        this.currentStep++;
        this.updateStepDisplay();
        this.validateCurrentStep();
    }
    
    /**
     * Go to previous step
     */
    previousStep() {
        if (this.currentStep <= 1) return;
        
        this.currentStep--;
        this.updateStepDisplay();
        this.validateCurrentStep();
    }
    
    /**
     * Update step display
     */
    updateStepDisplay() {
        // Update step indicators
        document.querySelectorAll('.step').forEach((step, index) => {
            const stepNumber = index + 1;
            if (stepNumber <= this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        // Update step content
        document.querySelectorAll('.creation-step').forEach((step, index) => {
            const stepNumber = index + 1;
            if (stepNumber === this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        // Update button states
        const prevBtn = document.getElementById('prev-step-btn');
        prevBtn.disabled = this.currentStep <= 1;
        
        this.validateCurrentStep();
    }
    
    /**
     * Create account and nation
     */
    async createAccount() {
        try {
            // Validate all data
            if (!this.validateAllData()) {
                throw new Error('Invalid account data');
            }
            
            // Show loading state
            const createBtn = document.getElementById('create-account-btn');
            createBtn.textContent = 'Creating Nation...';
            createBtn.disabled = true;
            
            // Create Player account
            if (window.Player) {
                Player.username = this.userData.username;
                Player.initialize({ username: this.userData.username });
            }
            
            // Create Nation
            const nationData = {
                name: this.userData.nationName,
                leader: this.userData.rulerName,
                government: this.userData.selectedGovernment,
                religion: this.userData.selectedReligion,
                motto: document.getElementById('nation-motto')?.value || '',
                factionColor: this.userData.factionColor,
                factionKey: this.userData.selectedColorKey
            };
            
            if (window.NationClass) {
                const success = NationClass.create(nationData);
                if (!success) {
                    throw new Error('Failed to create nation');
                }
            }
            
            // Update player faction in Player entity
            if (window.Player) {
                Player.factionColor = this.userData.factionColor;
                Player.factionKey = this.userData.selectedColorKey;
            }
            
            // Update faction membership in map data
            if (window.GridMap) {
                GridMap.updateFactionData();
            }
            
            this.isAccountCreated = true;
            
            // Show success and close modal
            this.showSuccessMessage();
            
            // Emit creation event
            EventBus.emit('account_created', {
                userData: this.userData,
                nationData: nationData
            });
            
        } catch (error) {
            console.error('Account creation failed:', error);
            this.showErrorMessage(error.message);
            
            // Reset button
            const createBtn = document.getElementById('create-account-btn');
            createBtn.textContent = 'Create Nation';
            createBtn.disabled = false;
        }
    }
    
    /**
     * Validate all account data
     */
    validateAllData() {
        return this.userData.username.length >= 3 &&
               this.userData.rulerName.length >= 2 &&
               this.userData.nationName.length >= 3 &&
               this.userData.selectedColorKey !== null &&
               !!this.userData.selectedGovernment &&
               !!this.userData.selectedReligion &&
               this.validateUsername();
    }
    
    /**
     * Show success message
     */
    showSuccessMessage() {
        const createBtn = document.getElementById('create-account-btn');
        createBtn.textContent = '✅ Nation Created!';
        createBtn.classList.add('success');
        
        setTimeout(() => {
            this.hideModal();
        }, 2000);
    }
    
    /**
     * Show error message
     */
    showErrorMessage(message) {
        // You could add a more sophisticated error display
        alert(`Account Creation Error: ${message}`);
    }
    
    /**
     * Show account creation modal
     */
    showModal() {
        const modal = document.getElementById('account-creation-modal');
        if (modal) {
            modal.classList.remove('hidden');
            
            // Focus first input
            setTimeout(() => {
                document.getElementById('username')?.focus();
            }, 100);
        }
    }
    
    /**
     * Hide account creation modal
     */
    hideModal() {
        const modal = document.getElementById('account-creation-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    /**
     * Check if account needs to be created
     */
    needsAccountCreation() {
        return !window.Nation || !window.Nation.isInitialized || 
               !window.Player || !window.Player.username;
    }
}

// Create global instance
let AccountCreation = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AccountCreation = new AccountCreationSystem();
    
    // Show modal if account needs creation
    if (AccountCreation.needsAccountCreation()) {
        AccountCreation.showModal();
    }
});