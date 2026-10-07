/**
 * Main Game Engine - Core Game Loop and State Management
 * Dominion Wars - Nation Building Strategy Game
 */

class GameEngineClass {
    constructor() {
        this.isInitialized = false;
        this.isRunning = false;
        this.gameSpeed = GameConfig.GAME_SPEED; // Fixed MMO speed
        this.lastUpdate = 0;
        this.deltaTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsLastUpdate = 0;
        
        // Game state
        this.gameState = {
            initialized: false,
            nationCreated: false,
            playerCreated: false,
            playTime: 0,
            totalFrames: 0
        };

        // System references
        this.systems = {
            economy: null,
            military: null,
            population: null,
            infrastructure: null,
            research: null,
            diplomacy: null,
            territory: null,
            time: null
        };

        // UI references
        this.ui = {
            loadingScreen: null,
            gameContainer: null,
            resourceBar: null,
            nationStats: null,
            playerStats: null,
            statusBar: null
        };

        // Animation frame ID
        this.animationFrame = null;

        // Event bindings
        this.bindEvents();
    }

    /**
     * Initialize the game engine and all systems
     */
    async initialize() {
        try {
            console.log('Initializing Dominion Wars...');
            
            // Initialize UI references
            this.initializeUI();
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize Player system first
            window.Player = new PlayerClass();
            Player.initialize({ username: 'Player' });
            this.gameState.playerCreated = true;
            
            // Initialize all game systems
            await this.initializeSystems();
            
            // Check if account creation is needed
            if (window.AccountCreation && AccountCreation.needsAccountCreation()) {
                console.log('Account creation needed - showing modal');
                setTimeout(() => {
                    AccountCreation.showModal();
                }, 1000);
            }
            
            // Setup UI event handlers
            this.setupUIHandlers();
            
            // Hide loading screen and show game
            this.hideLoadingScreen();
            
            // Start the game loop
            this.start();
            
            this.isInitialized = true;
            this.gameState.initialized = true;
            
            EventBus.emit(GameEvents.GAME_STARTED);
            console.log('Dominion Wars initialized successfully!');
            
            // Show nation creation if no nation exists
            if (!this.gameState.nationCreated) {
                this.showNationCreation();
            }
            
        } catch (error) {
            console.error('Error initializing game:', error);
            this.showError('Failed to initialize game. Please refresh the page.');
        }
    }

    /**
     * Initialize UI element references
     */
    initializeUI() {
        this.ui.loadingScreen = document.getElementById('loading-screen');
        this.ui.gameContainer = document.getElementById('game-container');
        this.ui.resourceBar = document.getElementById('resource-bar');
        this.ui.nationStats = document.getElementById('nation-stats');
        this.ui.playerStats = document.getElementById('player-stats');
        this.ui.statusBar = document.getElementById('status-bar');
    }

    /**
     * Initialize all game systems
     */
    async initializeSystems() {
        console.log('Initializing game systems...');
        
        // Initialize systems in dependency order
        if (window.TimeSystem) {
            this.systems.time = new TimeSystem();
            await this.systems.time.initialize();
            // Expose as global GameTime so Nation.js can call GameTime.nationAgeDays()
            window.GameTime = this.systems.time;
        }
        
        if (window.EconomySystem) {
            this.systems.economy = new EconomySystem();
            await this.systems.economy.initialize();
        }
        
        // Initialize Resource System
        if (window.ResourceSystem) {
            this.systems.resources = new ResourceSystem();
            await this.systems.resources.initialize();
            console.log('Resource System initialized');
        }
        
        // Initialize Improvements System
        if (window.ImprovementsSystem) {
            this.systems.improvements = new ImprovementsSystem();
            await this.systems.improvements.initialize();
            console.log('Improvements System initialized');
        }
        
        // Initialize Projects System
        if (window.ProjectsSystem) {
            this.systems.projects = new ProjectsSystem();
            await this.systems.projects.initialize();
            console.log('Projects System initialized');
        }
        
        if (window.PopulationSystem) {
            this.systems.population = new PopulationSystem();
            await this.systems.population.initialize();
        }
        
        if (window.InfrastructureSystem) {
            this.systems.infrastructure = new InfrastructureSystem();
            await this.systems.infrastructure.initialize();
        }
        
        if (window.MilitarySystem) {
            this.systems.military = new MilitarySystem();
            await this.systems.military.initialize();
        }
        
        if (window.ResearchSystem) {
            this.systems.research = new ResearchSystem();
            await this.systems.research.initialize();
        }
        
        if (window.DiplomacySystem) {
            this.systems.diplomacy = new DiplomacySystem();
            await this.systems.diplomacy.initialize();
        }
        
        if (window.TerritorySystem) {
            this.systems.territory = new TerritorySystem();
            await this.systems.territory.initialize();
        }

        // Initialize map renderer
        const mapCanvas = document.getElementById('game-map');
        if (mapCanvas && window.GridMapRenderer) {
            window.MapRenderer = new GridMapRenderer(mapCanvas);
            console.log('Grid Map Renderer initialized');
        }
        
        console.log('All systems initialized');
    }

    /**
     * Setup UI event handlers
     */
    setupUIHandlers() {
        // Remove speed control - MMO has fixed speed
        // const speedBtn = document.getElementById('speed-controls');
        // Speed controls are disabled in MMO mode

        // Menu buttons
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => this.showMainMenu());
        }

        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.quickSave());
        }

        // Player progression button
        const playerBtn = document.getElementById('player-btn');
        if (playerBtn) {
            playerBtn.addEventListener('click', () => this.showPlayerMenu());
        }

        // Action buttons
        const buildBtn = document.getElementById('build-btn');
        if (buildBtn) {
            buildBtn.addEventListener('click', () => this.showBuildMenu());
        }

        const militaryBtn = document.getElementById('military-btn');
        if (militaryBtn) {
            militaryBtn.addEventListener('click', () => this.showMilitaryMenu());
        }

        const diplomacyBtn = document.getElementById('diplomacy-btn');
        if (diplomacyBtn) {
            diplomacyBtn.addEventListener('click', () => this.showDiplomacyMenu());
        }

        const researchBtn = document.getElementById('research-btn');
        if (researchBtn) {
            researchBtn.addEventListener('click', () => this.showResearchMenu());
        }

        const tradeBtn = document.getElementById('trade-btn');
        if (tradeBtn) {
            tradeBtn.addEventListener('click', () => this.showTradeMenu());
        }

        // Map controls
        const zoomInBtn = document.getElementById('zoom-in');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => window.MapRenderer?.zoomIn());
        }

        const zoomOutBtn = document.getElementById('zoom-out');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => window.MapRenderer?.zoomOut());
        }

        const centerMapBtn = document.getElementById('center-map');
        if (centerMapBtn) {
            centerMapBtn.addEventListener('click', () => window.MapRenderer?.centerView());
        }
        
        const toggleGridBtn = document.getElementById('toggle-grid');
        if (toggleGridBtn) {
            toggleGridBtn.addEventListener('click', () => window.MapRenderer?.toggleGrid());
        }
        
        const toggleResourcesBtn = document.getElementById('toggle-resources');
        if (toggleResourcesBtn) {
            toggleResourcesBtn.addEventListener('click', () => window.MapRenderer?.toggleResources());
        }

        const centerMapBtn = document.getElementById('center-map');
        if (centerMapBtn) {
            centerMapBtn.addEventListener('click', () => this.mapRenderer?.centerMap());
        }

        // Keyboard shortcuts (remove pause/speed controls)
        document.addEventListener('keydown', (event) => this.handleKeyPress(event));
    }

    /**
     * Start the main game loop
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastUpdate = performance.now();
        this.gameLoop();
        
        console.log('Game loop started');
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        console.log('Game loop stopped');
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastUpdate;
        this.lastUpdate = currentTime;

        // Update FPS counter
        this.updateFPS(currentTime);

        // Always update game logic (no pause in MMO)
        this.update(this.deltaTime);
        this.gameState.playTime += this.deltaTime;

        // Always render (for UI updates, etc.)
        this.render();

        // Continue the loop
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Update all game systems
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        this.frameCount++;
        this.gameState.totalFrames++;

        // Update Player system first
        if (window.Player && typeof window.Player.updateActiveEffects === 'function') {
            window.Player.updateActiveEffects();
            window.Player.updateLastActive();
        }

        // Update all systems
        for (const [name, system] of Object.entries(this.systems)) {
            if (system && typeof system.update === 'function') {
                system.update(deltaTime);
            }
        }

        // Process queued events
        EventBus.processQueue();
    }

    /**
     * Render the game
     */
    render() {
        // Update UI
        this.updateUI();

        // Render map
        if (this.mapRenderer) {
            this.mapRenderer.render();
        }

        // Show debug info if enabled
        if (GameConfig.DEBUG.SHOW_FPS) {
            this.renderDebugInfo();
        }
    }

    /**
     * Update the user interface
     */
    updateUI() {
        this.updateResourceDisplay();
        this.updateNationStats();
        this.updatePlayerStats();
        this.updateStatusBar();
    }

    /**
     * Update resource display in top bar
     */
    updateResourceDisplay() {
        if (!this.ui.resourceBar || !window.Nation) return;

        const nation = Nation;
        
        // Display money (use direct money field for compatibility)
        const moneyDisplay = document.getElementById('money-display');
        if (moneyDisplay) {
            moneyDisplay.textContent = this.formatNumber(nation.money);
        }

        // Display basic resources
        const ironDisplay = document.getElementById('iron-display');
        if (ironDisplay) {
            ironDisplay.textContent = this.formatNumber(nation.resources.iron || 0);
        }

        const foodDisplay = document.getElementById('food-display');
        if (foodDisplay) {
            foodDisplay.textContent = this.formatNumber(nation.resources.food || 0);
        }

        const waterDisplay = document.getElementById('water-display');
        if (waterDisplay) {
            waterDisplay.textContent = this.formatNumber(nation.resources.water || 0);
        }

        const lumberDisplay = document.getElementById('lumber-display');
        if (lumberDisplay) {
            lumberDisplay.textContent = this.formatNumber(nation.resources.lumber || 0);
        }

        // Display primary resource (what this nation produces)
        const primaryResourceDisplay = document.getElementById('primary-resource-display');
        if (primaryResourceDisplay && nation.primaryResource) {
            primaryResourceDisplay.textContent = `Primary: ${nation.primaryResource} (${nation.resources[nation.primaryResource] || 0})`;
        }
        
        // Display critical resource status
        const criticalStatusDisplay = document.getElementById('critical-status-display');
        if (criticalStatusDisplay) {
            const waterStatus = (nation.resources.water || 0) > 0 ? '✓' : '✗';
            const foodStatus = (nation.resources.food || 0) > 0 ? '✓' : '✗';
            criticalStatusDisplay.innerHTML = `Water: ${waterStatus} Food: ${foodStatus}`;
        }
        
        // Display active bonus effects
        const bonusDisplay = document.getElementById('bonus-effects-display');
        if (bonusDisplay && nation.bonusEffects) {
            const activeBonuses = Object.keys(nation.bonusEffects).filter(bonus => nation.bonusEffects[bonus]);
            bonusDisplay.textContent = activeBonuses.length > 0 ? `Active: ${activeBonuses.join(', ')}` : 'No active bonuses';
        }
        
        // Display nation statistics
        const statsDisplay = document.getElementById('nation-stats-display');
        if (statsDisplay && nation.nationStats) {
            statsDisplay.innerHTML = `
                Happiness: ${Math.round(nation.nationStats.happiness)}% | 
                Literacy: ${Math.round(nation.nationStats.literacy)}% | 
                Crime: ${Math.round(nation.nationStats.crime)}% | 
                Disease: ${Math.round(nation.nationStats.disease)}% | 
                Pollution: ${nation.nationStats.pollution} | 
                Environment: ${Math.round(nation.nationStats.environment)}%
            `;
        }
    }

    /**
     * Update nation statistics panel
     */
    updateNationStats() {
        if (!this.ui.nationStats || !window.Nation) return;

        const nation = Nation;

        const populationStat = document.getElementById('population-stat');
        if (populationStat) {
            populationStat.textContent = this.formatNumber(nation.population);
        }

        const gdpStat = document.getElementById('gdp-stat');
        if (gdpStat) {
            gdpStat.textContent = '$' + this.formatNumber(nation.gdp);
        }

        const militaryStat = document.getElementById('military-stat');
        if (militaryStat) {
            militaryStat.textContent = this.formatNumber(nation.militaryStrength);
        }

        const happinessStat = document.getElementById('happiness-stat');
        if (happinessStat) {
            happinessStat.textContent = Math.round(nation.happiness) + '%';
        }
    }

    /**
     * Update player statistics panel
     */
    updatePlayerStats() {
        if (!this.ui.playerStats || !window.Player) return;

        const player = Player;

        const levelStat = document.getElementById('player-level-stat');
        if (levelStat) {
            levelStat.textContent = player.level;
        }

        const experienceStat = document.getElementById('player-experience-stat');
        if (experienceStat) {
            experienceStat.textContent = `${this.formatNumber(player.experience)}/${this.formatNumber(player.experienceToNext)}`;
        }

        const skillPointsStat = document.getElementById('skill-points-stat');
        if (skillPointsStat) {
            skillPointsStat.textContent = player.unallocatedSkillPoints;
        }

        // Update experience progress bar
        const experienceBar = document.getElementById('experience-progress-bar');
        if (experienceBar) {
            const progress = (player.experience / player.experienceToNext) * 100;
            experienceBar.style.width = Math.min(100, progress) + '%';
        }
    }

    /**
     * Update status bar
     */
    updateStatusBar() {
        if (!this.ui.statusBar) return;

        // Update game time display
        const gameTimeDisplay = document.getElementById('game-time');
        if (gameTimeDisplay && this.systems.time) {
            gameTimeDisplay.textContent = this.systems.time.getFormattedTime();
        }

        // Update MMO status (no speed controls)
        const gameSpeedDisplay = document.getElementById('game-speed');
        if (gameSpeedDisplay) {
            gameSpeedDisplay.textContent = '🌍 MMO Live';
        }

        // Show server time info
        const serverTimeDisplay = document.getElementById('server-time');
        if (serverTimeDisplay) {
            const now = new Date();
            serverTimeDisplay.textContent = now.toLocaleTimeString();
        }
    }

    /**
     * Update FPS counter
     */
    updateFPS(currentTime) {
        if (currentTime - this.fpsLastUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsLastUpdate = currentTime;
        }
    }

    /**
     * Render debug information
     */
    renderDebugInfo() {
        // Create debug overlay if it doesn't exist
        let debugOverlay = document.getElementById('debug-overlay');
        if (!debugOverlay) {
            debugOverlay = document.createElement('div');
            debugOverlay.id = 'debug-overlay';
            debugOverlay.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px;
                font-family: monospace;
                font-size: 12px;
                z-index: 10000;
                border-radius: 5px;
            `;
            document.body.appendChild(debugOverlay);
        }

        // Update debug information
        debugOverlay.innerHTML = `
            FPS: ${this.fps}<br>
            Game Speed: ${this.isPaused ? 'Paused' : this.gameSpeed}ms<br>
            Play Time: ${Math.round(this.gameState.playTime / 1000)}s<br>
            Total Frames: ${this.gameState.totalFrames}
        `;
    }

    /**
     * MMO Mode - No speed toggle (fixed server speed)
     */
    toggleGameSpeed() {
        console.log('Speed controls disabled in MMO mode');
    }

    /**
     * MMO Mode - No pause (server runs continuously)  
     */
    pause() {
        console.log('Game cannot be paused in MMO mode');
    }

    /**
     * MMO Mode - No resume needed (always running)
     */
    resume() {
        console.log('Game runs continuously in MMO mode');
    }

    /**
     * MMO Mode - Fixed server speed
     * @param {number} speed - Ignored in MMO mode
     */
    setGameSpeed(speed) {
        console.log('Game speed is fixed in MMO mode');
    }

    /**
     * Quick save the game
     */
    async quickSave() {
        const success = await DataManager_Instance.saveGame('quicksave');
        if (success) {
            this.showNotification('Game saved successfully!', 'success');
        } else {
            this.showNotification('Failed to save game', 'error');
        }
    }

    /**
     * Quick load the game
     */
    async quickLoad() {
        const gameState = await DataManager_Instance.loadGame('quicksave');
        if (gameState) {
            await DataManager_Instance.applyGameState(gameState);
            this.showNotification('Game loaded successfully!', 'success');
        } else {
            this.showNotification('No save file found', 'error');
        }
    }

    /**
     * Handle keyboard input
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyPress(event) {
        // Prevent default behavior for game shortcuts
        const gameKeys = ['KeyS', 'KeyL', 'Escape', 'KeyP'];
        if (gameKeys.includes(event.code)) {
            event.preventDefault();
        }

        switch (event.code) {
            case 'KeyP':
                this.showPlayerMenu();
                break;
            case 'KeyS':
                if (event.ctrlKey) {
                    this.quickSave();
                }
                break;
            case 'KeyL':
                if (event.ctrlKey) {
                    this.quickLoad();
                }
                break;
            case 'Escape':
                this.showMainMenu();
                break;
        }
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        if (this.ui.loadingScreen) {
            this.ui.loadingScreen.classList.remove('hidden');
        }
        if (this.ui.gameContainer) {
            this.ui.gameContainer.classList.add('hidden');
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        if (this.ui.loadingScreen) {
            this.ui.loadingScreen.classList.add('hidden');
        }
        if (this.ui.gameContainer) {
            this.ui.gameContainer.classList.remove('hidden');
        }
    }

    /**
     * Show nation creation modal
     */
    showNationCreation() {
        // This would open a modal for nation creation
        // For now, create a default nation
        if (window.Nation) {
            Nation.create({
                name: "New Nation",
                leader: "Player",
                government: "Democracy"
            });
            this.gameState.nationCreated = true;
        }
    }

    /**
     * Show player progression menu
     */
    showPlayerMenu() {
        if (!window.Player) return;
        
        console.log('Opening player progression menu...');
        // This will be handled by the Modal system
        EventBus.emit('show_player_menu', {
            player: Player,
            skills: Player.skills,
            level: Player.level,
            experience: Player.experience
        });
    }

    /**
     * Show main menu
     */
    showMainMenu() {
        console.log('Showing main menu...');
        // Implementation for main menu modal
    }

    /**
     * Show build menu
     */
    showBuildMenu() {
        console.log('Showing build menu...');
        // Implementation for build menu modal
    }

    /**
     * Show military menu
     */
    showMilitaryMenu() {
        console.log('Showing military menu...');
        // Implementation for military menu modal
    }

    /**
     * Show diplomacy menu
     */
    showDiplomacyMenu() {
        console.log('Showing diplomacy menu...');
        // Implementation for diplomacy menu modal
    }

    /**
     * Show research menu
     */
    showResearchMenu() {
        console.log('Showing research menu...');
        // Implementation for research menu modal
    }

    /**
     * Show trade menu
     */
    showTradeMenu() {
        console.log('Showing trade menu...');
        // Implementation for trade menu modal
    }

    /**
     * Show notification to user
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to notification area
        const notificationArea = document.getElementById('notification-area');
        if (notificationArea) {
            notificationArea.appendChild(notification);
            
            // Auto-remove after duration
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, GameConfig.UI.NOTIFICATION_DURATION);
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showNotification(message, 'error');
        console.error(message);
    }

    /**
     * Format numbers for display
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        } else if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        } else {
            return Math.floor(num).toString();
        }
    }

    /**
     * Refresh the entire UI
     */
    refreshUI() {
        this.updateUI();
        console.log('UI refreshed');
    }

    /**
     * Bind global event listeners
     */
    bindEvents() {
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.mapRenderer) {
                this.mapRenderer.handleResize();
            }
        });

        // Handle visibility change (pause when tab is not visible)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !this.isPaused) {
                this.pause();
            }
        });

        // Handle beforeunload (save game before closing)
        window.addEventListener('beforeunload', () => {
            if (this.isInitialized && !this.isPaused) {
                DataManager_Instance.saveGame('autosave', null, true);
            }
        });
    }

    /**
     * Get current game state for saving
     * @returns {Object} Current game state
     */
    getState() {
        return {
            ...this.gameState,
            isPaused: this.isPaused,
            gameSpeed: this.gameSpeed
        };
    }

    /**
     * Set game state from loaded data
     * @param {Object} state - Game state to apply
     */
    setState(state) {
        Object.assign(this.gameState, state);
        this.isPaused = state.isPaused !== undefined ? state.isPaused : true;
        this.gameSpeed = state.gameSpeed || GameConfig.GAME_SPEEDS.NORMAL;
    }

    /**
     * Destroy the game engine and clean up resources
     */
    destroy() {
        this.stop();
        
        // Destroy all systems
        for (const [name, system] of Object.entries(this.systems)) {
            if (system && typeof system.destroy === 'function') {
                system.destroy();
            }
        }

        // Destroy map renderer
        if (this.mapRenderer && typeof this.mapRenderer.destroy === 'function') {
            this.mapRenderer.destroy();
        }

        // Clean up UI
        const debugOverlay = document.getElementById('debug-overlay');
        if (debugOverlay) {
            debugOverlay.remove();
        }

        this.isInitialized = false;
        console.log('Game engine destroyed');
    }
}

// Create global game engine instance
const GameEngine = new GameEngineClass();

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameEngineClass, GameEngine };
}