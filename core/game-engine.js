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
            alliance: null,
            territory: null,
            time: null,
            improvements: null,
            projects: null,
            wonders: null,
            buildings: null,
            sports: null
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
     * Initialize the game engine and all systems.
     *
     * Sequence:
     *  1. Boot all game systems (economy, military, etc.)
     *  2. Show the login modal (or auto-login from localStorage token)
     *     LoginSystem.start() resolves ONLY after auth is complete
     *     because it returns a Promise that settles when the user is
     *     authenticated — not just when the modal is shown.
     *  3. onAuthComplete() → hide loading screen, start game loop.
     *
     * Player creation is intentionally deferred until auth so that the
     * Player object is always initialised with real user data, never a
     * placeholder.
     */
    async initialize() {
        try {
            console.log('Initializing Dominion Wars...');

            // Cache DOM references
            this.initializeUI();

            // Keep the loading screen visible during boot
            this.showLoadingScreen();

            // Boot all game systems (no Player yet — that happens post-auth)
            await this.initializeSystems();

            // Wire up UI event handlers now so panels are ready
            this.setupUIHandlers();

            // Hand off to LoginSystem.
            // start() returns a Promise that resolves only once the user
            // is fully authenticated (token verified or fresh login done).
            // Until then the loading screen stays up and blocks interaction.
            if (window.LoginSystem && LoginSystem.instance) {
                await LoginSystem.instance.start();
            } else {
                // Auth system unavailable — fall back so the game still loads
                console.warn('LoginSystem unavailable — starting without auth');
                this.onAuthComplete({ username: 'Guest' });
            }

        } catch (error) {
            console.error('Error initializing game:', error);
            this.showError('Failed to initialize game. Please refresh the page.');
        }
    }

    /**
     * Called by LoginSystem after authentication is complete.
     * Receives the authenticated user object so Player can be initialised
     * with real data instead of a placeholder.
     *
     * @param {object} user  - { username, email, id, ... } from the server
     */
    onAuthComplete(user) {
        // Create and initialise the Player entity with real user data
        if (!window.Player) window.Player = new PlayerClass();
        Player.initialize({
            username:                       user.username                       || 'Player',
            email:                          user.email                          || '',
            playerId:                       user.id                             || null,
            level:                          user.level                          || undefined,
            experience:                     user.experience                     || undefined,
            totalExperience:                user.totalExperience                || undefined,
            legendaryLevel:                 user.legendaryLevel                 || undefined,
            totalLegendaryLevels:           user.totalLegendaryLevels           || undefined,
            unallocatedSkillPoints:         user.unallocatedSkillPoints         !== undefined ? user.unallocatedSkillPoints : undefined,
            unallocatedLegendarySkillPoints: user.unallocatedLegendarySkillPoints !== undefined ? user.unallocatedLegendarySkillPoints : undefined,
            // Restore persisted skills so players don't lose progress on login
            skills: (user.skills && Object.keys(user.skills).length > 0) ? user.skills : undefined
        });
        this.gameState.playerCreated = true;

        // Hide the loading screen and reveal the game
        this.hideLoadingScreen();

        // Start the game loop
        this.start();

        this.isInitialized = true;
        this.gameState.initialized = true;

        EventBus.emit(GameEvents.GAME_STARTED);
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
        
        // Initialize admin and error systems
        if (window.ErrorSystem) {
            window.ErrorSystem.initialize(GameConfig.DEBUG.ENABLED);
            console.log('Error System initialized');
        }
        
        if (window.AdminSystem) {
            window.AdminSystem.initialize();
            console.log('Admin System initialized');
        }
        
        // Initialize Data Integration System first
        if (window.DataIntegrationSystem && !window.dataIntegration) {
            window.dataIntegration = new DataIntegrationSystem();
            await window.dataIntegration.initialize();
            console.log('Data Integration System initialized');
        }
        
        // Initialize systems in dependency order
        if (window.TimeSystem) {
            this.systems.time = new TimeSystem();
            await this.systems.time.initialize();
            // Expose as global GameTime so Nation.js can call GameTime.nationAgeDays()
            window.GameTime = this.systems.time;
            window.TimeSystem = this.systems.time;
        }
        
        if (window.EconomySystem) {
            this.systems.economy = new EconomySystem();
            await this.systems.economy.initialize();
            window.EconomySystem = this.systems.economy;
        }
        
        // Initialize Resource System
         if (window.ResourceSystem) {
            this.systems.resources = new ResourceSystem();
            await this.systems.resources.initialize();
            console.log('Resource System initialized');
        }

        // Initialize World Bank System
        if (window.WorldBankSystem) {
            this.systems.worldBank = new WorldBankSystem();
            await this.systems.worldBank.initialize();
            console.log('World Bank System initialized');
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
        
        // Initialize Wonders System
        if (window.WondersSystem) {
            this.systems.wonders = new WondersSystem();
            console.log('Wonders System initialized');
        }
        
        // Initialize unified Buildings System
        if (window.BuildingsSystem) {
            this.systems.buildings = new BuildingsSystem();
            console.log('Buildings System initialized');
        }
        
        if (window.PopulationSystem) {
            this.systems.population = new PopulationSystem();
            await this.systems.population.initialize();
            window.PopulationSystem = this.systems.population;
        }
        
        if (window.InfrastructureSystem) {
            this.systems.infrastructure = new InfrastructureSystem();
            await this.systems.infrastructure.initialize();
            window.InfrastructureSystem = this.systems.infrastructure;
        }
        
        if (window.MilitarySystem) {
            this.systems.military = new MilitarySystem();
            await this.systems.military.initialize();
            window.MilitarySystem = this.systems.military;
        }
        
        if (window.ResearchSystem) {
            this.systems.research = new ResearchSystem();
            await this.systems.research.initialize();
            window.ResearchSystem = this.systems.research;
            console.log('Research System initialized');
            
            // Integrate with data after initialization
            if (window.dataIntegration) {
                window.dataIntegration.integrateWithResearchSystem();
            }
        }
        
        // Initialize Disease System
        if (window.DiseaseSystem) {
            this.systems.diseases = new DiseaseSystem();
            await this.systems.diseases.initialize();
            console.log('Disease System initialized');
            
            // Integrate with data after initialization
            if (window.dataIntegration) {
                window.dataIntegration.integrateWithDiseaseSystem();
            }
        }
        
        if (window.DiplomacySystem) {
            this.systems.diplomacy = new DiplomacySystem();
            await this.systems.diplomacy.initialize();
            window.DiplomacySystem = this.systems.diplomacy;
        }
        
        if (window.AllianceSystem) {
            this.systems.alliance = new AllianceSystem();
            await this.systems.alliance.initialize();
            window.AllianceSystem = this.systems.alliance;
            
            // Integrate with existing systems
            this.systems.alliance.integrateWithWarSystem();
            this.systems.alliance.integrateWithDiplomacySystem();
            console.log('Alliance System initialized and integrated');
        }
        
        // Initialize Sports System
        if (window.SportsSystem) {
            this.systems.sports = new SportsSystem();
            console.log('Sports System initialized');
        }
        
        if (window.ForumSystem) {
            this.systems.forum = new ForumSystem();
            await this.systems.forum.initialize();
        }
        
        if (window.MessagingSystem) {
            this.systems.messaging = new MessagingSystem();
            await this.systems.messaging.initialize();
        }
        
        if (window.WarSystem) {
            this.systems.war = new WarSystem();
            await this.systems.war.initialize();
        }
        
        if (window.TerritorySystem) {
            this.systems.territory = new TerritorySystem();
            await this.systems.territory.initialize();
            window.TerritorySystem  = this.systems.territory;
            window.TerritoryManager = this.systems.territory; // keep both names in sync
        }

        // Map rendering is handled by MapIntegration / EnhancedMapRenderer
        // which auto-initializes via DOMContentLoaded in map-integration.js.
        // We keep window.MapRenderer null here; render() uses window.MapRenderer
        // or window.MapIntegration?.enhancedRenderer once it's ready.

        // Initialize AI Nations — must run after all other systems so territory
        // claims and faction colors can be assigned correctly.
        if (window.AINationsSystem && !window.aiNations) {
            window.aiNations = new AINationsSystem();
        }

        console.log('All systems initialized (map renderer deferred to MapIntegration)');
    }

    /**
     * Setup UI event handlers
     */
    setupUIHandlers() {
        // Remove speed control - MMO has fixed speed
        // const speedBtn = document.getElementById('speed-controls');
        // Speed controls are disabled in MMO mode


        // Player progression button
        const playerBtn = document.getElementById('player-btn');
        if (playerBtn) {
            playerBtn.addEventListener('click', () => this.showPlayerMenu());
        }

        // "View Skills" button inside the nation popup overview tab
        const viewSkillsBtn = document.getElementById('view-skills-btn');
        if (viewSkillsBtn) {
            viewSkillsBtn.addEventListener('click', () => this.showPlayerMenu());
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

        // Map controls — use whichever renderer is active
        const getRenderer = () => window.MapIntegration?.enhancedRenderer ?? window.MapRenderer;

        const zoomInBtn = document.getElementById('zoom-in');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => getRenderer()?.zoomIn());
        }

        const zoomOutBtn = document.getElementById('zoom-out');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => getRenderer()?.zoomOut());
        }

        const centerMapBtn = document.getElementById('center-map');
        if (centerMapBtn) {
            centerMapBtn.addEventListener('click', () => getRenderer()?.centerView());
        }
        
        const toggleGridBtn = document.getElementById('toggle-grid');
        if (toggleGridBtn) {
            toggleGridBtn.addEventListener('click', () => getRenderer()?.toggleGrid());
        }
        
        const toggleResourcesBtn = document.getElementById('toggle-resources');
        if (toggleResourcesBtn) {
            toggleResourcesBtn.addEventListener('click', () => getRenderer()?.toggleResources());
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
        
        // Set up hourly timer for energy regeneration
        this.hourlyTimer = setInterval(() => {
            this.processHourlyUpdates();
        }, 3600000); // 1 hour
        
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
        
        // Clear hourly timer
        if (this.hourlyTimer) {
            clearInterval(this.hourlyTimer);
            this.hourlyTimer = null;
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

        // Render map — use EnhancedMapRenderer if available, fall back to GridMapRenderer
        const activeRenderer = (window.MapIntegration && window.MapIntegration.enhancedRenderer)
            ? window.MapIntegration.enhancedRenderer
            : window.MapRenderer;
        if (activeRenderer && typeof activeRenderer.render === 'function') {
            // EnhancedMapRenderer runs its own RAF loop; only call render() on GridMapRenderer
            if (!(window.MapIntegration && window.MapIntegration.enhancedRenderer)) {
                activeRenderer.render();
            }
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
        // Keep nation name in the top nav current
        if (window.Nation && window.Nation.name) {
            const nationNameEl = document.getElementById('nation-name');
            if (nationNameEl && nationNameEl.textContent !== window.Nation.name) {
                nationNameEl.textContent = window.Nation.name;
            }
        }

        this.updateResourceDisplay();
        this.updateNationStats();
        this.updatePlayerStats();
        this.updateStatusBar();
    }

    /**
     * Update resource display in top bar
     */
    updateResourceDisplay() {
        if (!window.Nation) return;

        const nation = window.Nation;
        
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
        if (primaryResourceDisplay && nation.currency) {
            primaryResourceDisplay.textContent = `Currency: ${nation.currency}`;
        }
        
        // Display critical resource status
        const criticalStatusDisplay = document.getElementById('critical-status-display');
        if (criticalStatusDisplay) {
            const waterStatus = (nation.resources.water || 0) > 0 ? '✔' : '✗';
            const foodStatus = (nation.resources.food || 0) > 0 ? '✔' : '✗';
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
        if (!window.Nation) return;

        const nation = window.Nation;

        // ── Popup header ─────────────────────────────────────────────────────
        const popupName = document.getElementById('popup-nation-name');
        if (popupName) popupName.textContent = nation.name || 'Nation Overview';

        const popupLeader = document.getElementById('popup-nation-leader');
        if (popupLeader && nation.leader) {
            popupLeader.textContent = `Ruler: ${nation.leader}`;
        }

        // ── Nation popup stat cards ──────────────────────────────────────────
        const popupPop = document.getElementById('popup-population');
        if (popupPop) popupPop.textContent = this.formatNumber(nation.population || 0);

        const popupGdp = document.getElementById('popup-gdp');
        if (popupGdp) popupGdp.textContent = '$' + this.formatNumber(nation.gdp || 0);

        const popupMil = document.getElementById('popup-military');
        if (popupMil) popupMil.textContent = this.formatNumber(nation.militaryStrength || 0);

        const popupHap = document.getElementById('popup-happiness');
        if (popupHap) popupHap.textContent = Math.round(nation.happiness || 50) + '%';

        // Government
        const popupGov = document.getElementById('popup-government');
        if (popupGov) {
            if (window.GovernmentSystem && nation.government) {
                const gov = window.GovernmentSystem.getGovernment(nation.government);
                popupGov.textContent = gov ? gov.name : (nation.government || '—');
                const govIcon = document.getElementById('popup-government-icon');
                if (govIcon && gov) {
                    govIcon.innerHTML = gov.image
                        ? `<img src="${gov.image}" alt="${gov.name}" style="width:24px;height:24px;object-fit:contain;">`
                        : (gov.icon || '🏛️');
                }
            } else {
                popupGov.textContent = nation.government || '—';
            }
        }

        // Religion
        const popupRel = document.getElementById('popup-religion');
        if (popupRel) {
            if (window.ReligionSystem && nation.religion) {
                const rel = window.ReligionSystem.getReligion(nation.religion);
                popupRel.textContent = rel ? rel.name : (nation.religion || '—');
                const relIcon = document.getElementById('popup-religion-icon');
                if (relIcon && rel) {
                    relIcon.innerHTML = rel.image
                        ? `<img src="${rel.image}" alt="${rel.name}" style="width:24px;height:24px;object-fit:contain;">`
                        : (rel.icon || '🛐');
                }
            } else {
                popupRel.textContent = nation.religion || '—';
            }
        }

        // ── Legacy stat IDs (kept for compatibility with older panel components) ─
        const populationStat = document.getElementById('population-stat');
        if (populationStat) populationStat.textContent = this.formatNumber(nation.population || 0);

        const gdpStat = document.getElementById('gdp-stat');
        if (gdpStat) gdpStat.textContent = '$' + this.formatNumber(nation.gdp || 0);

        const militaryStat = document.getElementById('military-stat');
        if (militaryStat) militaryStat.textContent = this.formatNumber(nation.militaryStrength || 0);

        const happinessStat = document.getElementById('happiness-stat');
        if (happinessStat) happinessStat.textContent = Math.round(nation.happiness || 50) + '%';
    }

    /**
     * Update player statistics panel
     */
    updatePlayerStats() {
        if (!window.Player) return;

        const player = window.Player;

        // ── Popup player-progress section ────────────────────────────────────
        const popupLevel = document.getElementById('popup-level');
        if (popupLevel) popupLevel.textContent = `Level ${player.level}`;

        const popupXp = document.getElementById('popup-experience');
        if (popupXp) popupXp.textContent = `${this.formatNumber(player.experience)}/${this.formatNumber(player.experienceToNext)} XP`;

        const popupXpBar = document.getElementById('popup-experience-bar');
        if (popupXpBar && player.experienceToNext > 0) {
            popupXpBar.style.width = Math.min(100, (player.experience / player.experienceToNext) * 100) + '%';
        }

        const popupSp = document.getElementById('popup-skill-points');
        if (popupSp) popupSp.textContent = `${player.unallocatedSkillPoints} SP`;

        // ── Legacy element IDs ───────────────────────────────────────────────
        const levelStat = document.getElementById('player-level-stat');
        if (levelStat) levelStat.textContent = player.level;

        const experienceStat = document.getElementById('player-experience-stat');
        if (experienceStat) experienceStat.textContent = `${this.formatNumber(player.experience)}/${this.formatNumber(player.experienceToNext)}`;

        const skillPointsStat = document.getElementById('skill-points-stat');
        if (skillPointsStat) skillPointsStat.textContent = player.unallocatedSkillPoints;

        const experienceBar = document.getElementById('experience-progress-bar');
        if (experienceBar && player.experienceToNext > 0) {
            experienceBar.style.width = Math.min(100, (player.experience / player.experienceToNext) * 100) + '%';
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
            gameSpeedDisplay.textContent = 'ðŸŒ MMO Live';
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
            case 'KeyL':
                if (event.ctrlKey) {
                    this.quickLoad();
                }
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
        // The map canvas was sized while game-container was display:none (0×0).
        // Give the browser one frame to reflow, then force the renderer to
        // re-measure regardless of whether MapIntegration is already ready.
        setTimeout(() => {
            if (window.MapIntegration?.enhancedRenderer) {
                window.MapIntegration.enhancedRenderer.resizeCanvas();
            } else if (window.MapRenderer?.resizeCanvas) {
                window.MapRenderer.resizeCanvas();
            }
        }, 0);
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

        // ── Nation / auth events ────────────────────────────────────────────

        // New nation was just created via AccountCreation wizard
        EventBus.on('account_created', (data) => {
            // window.Nation is already initialized by AccountCreation._submit()
            // Just refresh the UI so the nav and stats panels show the new nation
            this._onNationReady();
        });

        // Returning player: server confirmed they already have a nation
        // Fetch the full nation data from the server and hydrate window.Nation
        EventBus.on('player_has_nation', async (data) => {
            await this._loadPlayerNation(data.nationId, data.playerId);
        });

        // ── Socket event listeners ──────────────────────────────────────────
        // Wire up socket listeners once the socket is available.
        // The socket is created synchronously in index.html before scripts run,
        // so it's always available here — but guard anyway.
        const wireSocket = () => {
            if (!window.socket) return;

            // Server sent the player's full nation after auth
            window.socket.on('gameState', (data) => {
                if (data.playerNation) {
                    this._hydrateNation(data.playerNation);
                }
            });

            // Server updates a nation (after a game action)
            window.socket.on('nationUpdate', (data) => {
                // Only update window.Nation if this is our nation
                if (window.Nation && window.Player &&
                    (data.id === window.Nation.playerId || data.playerId === window.Player.playerId)) {
                    this._hydrateNation(data);
                }
            });

            // Auth confirmed by socket — request full game state
            window.socket.on('authSuccess', (data) => {
                window.socket.emit('requestGameState');
            });

            // Server pushed the player's own nation right after socket auth
            window.socket.on('playerNationData', (nationData) => {
                if (nationData) this._hydrateNation(nationData);
            });
        };

        if (window.socket) {
            wireSocket();
        } else {
            // Socket may not yet exist — wait for it
            const socketInterval = setInterval(() => {
                if (window.socket) {
                    wireSocket();
                    clearInterval(socketInterval);
                }
            }, 100);
        }
    }

    /**
     * Load the player's existing nation from the server by ID and hydrate
     * the client-side Nation singleton.
     */
    async _loadPlayerNation(nationId, playerId) {
        if (!nationId) return;
        try {
            const token = localStorage.getItem('empire_token');
            const res   = await fetch(`/api/nations/${nationId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const nationData = await res.json();
            // Attach playerId so _hydrateNation can set window.Nation.playerId
            if (playerId) nationData.playerId = playerId;
            this._hydrateNation(nationData);
        } catch (err) {
            console.warn('Could not load player nation from server:', err);
            // Fallback: request via socket
            if (window.socket && window.socket.connected) {
                window.socket.emit('requestGameState');
            }
        }
    }

    /**
     * Hydrate (or re-initialize) window.Nation from a plain-object nation record.
     * Called both on first load and on server-pushed updates.
     */
    _hydrateNation(nationData) {
        if (!nationData || !nationData.name) return;

        // Attach the authenticated player's id so MapIntegration can identify us
        if (!nationData.playerId && window.Player && window.Player.playerId) {
            nationData.playerId = window.Player.playerId;
        }

        const NationCtor = window.NationClass || (typeof NationClass !== 'undefined' ? NationClass : null);

        if (window.Nation && window.Nation.isInitialized) {
            // Nation already exists — patch fields in-place to avoid
            // destroying existing game-state references
            const fieldsToSync = [
                'name','leader','government','religion','motto','factionKey','factionColor',
                'land','infra','tech','population','money','taxRate','happiness','stability',
                'reputation','gdp','taxableIncome','taxRevenue','resources','militaryUnits',
                'militaryStrength','allianceId','improvements','projects','statistics','score',
                'primaryResource','isActive','playerId','id','founded'
            ];
            for (const field of fieldsToSync) {
                if (nationData[field] !== undefined) {
                    window.Nation[field] = nationData[field];
                }
            }
            // Recompute derived stats
            if (typeof window.Nation.calculatePopulation === 'function') {
                window.Nation.calculatePopulation();
            }
            if (typeof window.Nation.calculateEconomy === 'function') {
                window.Nation.calculateEconomy();
            }
        } else if (NationCtor) {
            NationCtor.create(nationData);
        } else {
            console.warn('NationClass not available to hydrate nation');
            return;
        }

        // Sync faction info into Player
        if (window.Player && window.Nation.factionColor) {
            window.Player.factionColor = window.Nation.factionColor;
            window.Player.factionKey   = window.Nation.factionKey;
        }

        // Re-seed the PopulationSystem now that nation data is available
        if (window.PopulationSystem && window.PopulationSystem.isInitialized) {
            const pop = window.Nation.population || 0;
            if (pop > 0 && window.PopulationSystem.getTotalPopulation() === 0) {
                window.PopulationSystem.initializeAgeDistribution(pop);
                window.PopulationSystem.initializeTerritorialDistribution();
                window.PopulationSystem.updateDemographics();
                console.log(`PopulationSystem re-seeded with ${pop} population`);
            }
        }

        // Claim starting map tiles if none exist yet
        if (window.GridMap && window.Nation) {
            const existing = GridMap.getNationTerritories(window.Nation.playerId || 'player');
            if (existing.length === 0) {
                try {
                    GridMap.claimTerritory(0, 0, window.Nation.playerId || 'player', window.Nation.factionColor);
                } catch (_) {}
            }
            GridMap.updateFactionData();
        }

        this._onNationReady();
    }

    /**
     * Called whenever window.Nation is ready (newly created or freshly loaded).
     * Updates all UI elements that display nation/player identity.
     */
    _onNationReady() {
        if (!window.Nation) return;

        // ── Top nav nation name ──────────────────────────────────────────────
        const nationNameEl = document.getElementById('nation-name');
        if (nationNameEl) nationNameEl.textContent = window.Nation.name || 'Your Nation';

        // ── Nation overview popup stats ──────────────────────────────────────
        const overviewName = document.getElementById('overview-nation-name');
        if (overviewName) overviewName.textContent = window.Nation.name || '—';

        const overviewLeader = document.getElementById('overview-leader-name');
        if (overviewLeader) overviewLeader.textContent = window.Nation.leader || '—';

        const overviewGov = document.getElementById('overview-government');
        if (overviewGov) overviewGov.textContent = window.Nation.government || '—';

        // ── Force a full UI update pass ──────────────────────────────────────
        this.updateUI();

        // ── Re-render map so faction colors appear ───────────────────────────
        if (window.MapIntegration && window.MapIntegration.enhancedRenderer) {
            window.MapIntegration.enhancedRenderer.scheduleRender();
        }

        // ── Notify other systems that Nation is ready ────────────────────────
        if (window.EventBus) {
            EventBus.emit('nation_ready', { nation: window.Nation });
        }

        console.log(`Nation ready: "${window.Nation.name}" led by "${window.Nation.leader}"`);
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
    
