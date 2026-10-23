/**
 * Enhanced Grid Map Renderer - Complete Map System with Nation Interactions
 * Empire 2 - Nation Building Strategy Game
 */

class EnhancedMapRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.isInitialized = false;
        
        // Camera properties for zoom and pan
        this.cameraX = 0;
        this.cameraY = 0;
        this.zoom = 1.0;
        this.minZoom = 0.1;
        this.maxZoom = 8.0;
        this.smoothZoom = true;
        
        // Grid rendering properties
        this.tileSize = 32;
        this.showGrid = true;
        this.showTerrain = true;
        this.showResources = false;
        this.showPopulation = true;
        
        // View mode: 'nation' or 'alliance'
        this.viewMode = 'nation';
        this.showLabels = true;
        this.labelFontSize = 12;
        
        // Nation interaction system
        this.selectedNation = null;
        this.hoveredNation = null;
        this.interactionPanelOpen = false;
        this.nationPanelData = null;
        
        // UI state
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.hoveredTile = null;
        this.selectedTile = null;
        this.currentMenuPanel = null;
        
        // Performance optimization
        this.renderCache = new Map();
        this.lastRenderTime = 0;
        this.renderFPS = 60;
        
        this.initialize();
    }
    /**
     * Initialize the enhanced map renderer
     */
    initialize() {
        console.log('Initializing Enhanced Map Renderer...');
        
        this.createUIElements();
        this.setupEventListeners();
        this.resizeCanvas();
        this.centerView();
        
        // Bind to game events
        this.bindGameEvents();
        
        this.isInitialized = true;
        console.log('Enhanced Map Renderer initialized');
        
        // Start render loop
        this.startRenderLoop();
    }
    
    /**
     * Create UI elements for map interactions
     */
    createUIElements() {
        // Create view mode toggle
        this.createViewModeToggle();
        
        // Create nation interaction panel
        this.createNationInteractionPanel();
        
        // Create map controls
        this.createMapControls();
        
        // Create alliance color legend
        this.createAllianceLegend();
    }
    
    /**
     * Create view mode toggle button
     */
    createViewModeToggle() {
        let toggleContainer = document.getElementById('map-view-toggle');
        if (!toggleContainer) {
            toggleContainer = document.createElement('div');
            toggleContainer.id = 'map-view-toggle';
            toggleContainer.className = 'map-view-toggle';
            document.body.appendChild(toggleContainer);
        }
        
        toggleContainer.innerHTML = `
            <div class="toggle-container">
                <button id="nation-view-btn" class="view-toggle-btn active" data-mode="nation">
                    <i class="fas fa-flag"></i>
                    Nations
                </button>
                <button id="alliance-view-btn" class="view-toggle-btn" data-mode="alliance">
                    <i class="fas fa-users"></i>
                    Alliances
                </button>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('nation-view-btn').onclick = () => this.setViewMode('nation');
        document.getElementById('alliance-view-btn').onclick = () => this.setViewMode('alliance');
    }
    /**
     * Create nation interaction panel
     */
    createNationInteractionPanel() {
        let panel = document.getElementById('nation-interaction-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'nation-interaction-panel';
            panel.className = 'nation-interaction-panel hidden';
            document.body.appendChild(panel);
        }
        
        panel.innerHTML = `
            <div class="panel-header">
                <h3 id="nation-name">Nation Name</h3>
                <button id="close-nation-panel" class="close-btn">&times;</button>
            </div>
            
            <div class="panel-content">
                <div class="nation-info">
                    <div class="info-section">
                        <h4>Basic Information</h4>
                        <div class="info-grid">
                            <span>Leader:</span> <span id="nation-leader">-</span>
                            <span>Population:</span> <span id="nation-population">-</span>
                            <span>Land:</span> <span id="nation-land">-</span>
                            <span>Infrastructure:</span> <span id="nation-infrastructure">-</span>
                            <span>Government:</span> <span id="nation-government">-</span>
                            <span>Alliance:</span> <span id="nation-alliance">-</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h4>Military</h4>
                        <div class="info-grid">
                            <span>🪖 Soldiers:</span> <span id="nation-soldiers">-</span>
                            <span>🛡️ Tanks:</span>    <span id="nation-tanks">-</span>
                            <span>✈️ Aircraft:</span>  <span id="nation-aircraft">-</span>
                            <span>🚢 Ships:</span>     <span id="nation-ships">-</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h4>Relationship</h4>
                        <div class="relationship-status">
                            <span id="current-relationship">Neutral</span>
                            <div class="relationship-actions">
                                <button id="set-friend" class="relation-btn friend" title="Mark as Friend">
                                    <i class="fas fa-handshake"></i>
                                </button>
                                <button id="set-foe" class="relation-btn foe" title="Mark as Foe">
                                    <i class="fas fa-times"></i>
                                </button>
                                <button id="set-best-friend" class="relation-btn best-friend" title="Mark as Best Friend">
                                    <i class="fas fa-heart"></i>
                                </button>
                                <button id="set-nemesis" class="relation-btn nemesis" title="Mark as Nemesis">
                                    <i class="fas fa-skull"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button id="propose-treaty" class="action-btn">
                        <i class="fas fa-scroll"></i>
                        Propose Treaty
                    </button>
                    <button id="declare-war" class="action-btn war">
                        <i class="fas fa-sword"></i>
                        Declare War
                    </button>
                    <button id="launch-missile" class="action-btn missile">
                        <i class="fas fa-bomb"></i>
                        Launch Missile
                    </button>
                    <button id="launch-nuke" class="action-btn nuke">
                        <i class="fas fa-radiation"></i>
                        Launch Nuke
                    </button>
                    <button id="spy-operation" class="action-btn spy">
                        <i class="fas fa-user-secret"></i>
                        Spy Operation
                    </button>
                    <button id="send-aid" class="action-btn aid">
                        <i class="fas fa-gift"></i>
                        Send Aid
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners for panel
        this.bindNationPanelEvents();
    }
    /**
     * Create map controls — only creates the enhanced renderer's own control panel
     * if no #map-controls element already exists in the HTML.
     * index.html already ships a .map-controls-overlay div; we wire up its
     * buttons instead of replacing it.
     */
    createMapControls() {
        let controls = document.getElementById('map-controls');
        if (controls) {
            // Wire up the existing HTML buttons rather than overwriting the element
            const zoomInBtn  = document.getElementById('zoom-in');
            const zoomOutBtn = document.getElementById('zoom-out');
            const centerBtn  = document.getElementById('center-map');
            const gridBtn    = document.getElementById('toggle-grid');
            const resourceBtn = document.getElementById('toggle-resources');

            if (zoomInBtn)   zoomInBtn.onclick   = () => this.zoomIn();
            if (zoomOutBtn)  zoomOutBtn.onclick   = () => this.zoomOut();
            if (centerBtn)   centerBtn.onclick    = () => this.centerView();
            if (gridBtn)     gridBtn.onclick      = () => this.toggleGrid();
            if (resourceBtn) resourceBtn.onclick  = () => this.toggleResources();
            return;
        }

        // No existing controls element — create one (fallback for standalone use)
        controls = document.createElement('div');
        controls.id = 'map-controls';
        controls.className = 'map-controls';
        document.body.appendChild(controls);
        
        controls.innerHTML = `
            <div class="zoom-controls">
                <button id="zoom-in" class="control-btn">
                    <i class="fas fa-plus"></i>
                </button>
                <button id="zoom-out" class="control-btn">
                    <i class="fas fa-minus"></i>
                </button>
                <button id="center-view" class="control-btn">
                    <i class="fas fa-crosshairs"></i>
                </button>
            </div>
            
            <div class="display-controls">
                <button id="toggle-grid" class="control-btn active" title="Toggle Grid">
                    <i class="fas fa-th"></i>
                </button>
                <button id="toggle-labels" class="control-btn active" title="Toggle Labels">
                    <i class="fas fa-tag"></i>
                </button>
                <button id="toggle-resources" class="control-btn" title="Toggle Resources">
                    <i class="fas fa-gem"></i>
                </button>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('zoom-in').onclick      = () => this.zoomIn();
        document.getElementById('zoom-out').onclick     = () => this.zoomOut();
        document.getElementById('center-view').onclick  = () => this.centerView();
        document.getElementById('toggle-grid').onclick  = () => this.toggleGrid();
        document.getElementById('toggle-labels').onclick = () => this.toggleLabels();
        document.getElementById('toggle-resources').onclick = () => this.toggleResources();
    }
    
    /**
     * Create alliance color legend
     */
    createAllianceLegend() {
        let legend = document.getElementById('alliance-legend');
        if (!legend) {
            legend = document.createElement('div');
            legend.id = 'alliance-legend';
            legend.className = 'alliance-legend hidden';
            document.body.appendChild(legend);
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Window events
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Custom UI events
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nation-interaction-panel') && 
                !e.target.closest('.map-view-toggle') && 
                !e.target.closest('.map-controls')) {
                // Close panels when clicking outside
                if (this.currentMenuPanel && !e.target.closest('.menu-panel')) {
                    this.closeAllPanels();
                }
            }
        });
    }
    /**
     * Bind nation panel events
     */
    bindNationPanelEvents() {
        // Close button
        document.getElementById('close-nation-panel').onclick = () => this.closeNationPanel();
        
        // Relationship buttons
        document.getElementById('set-friend').onclick = () => this.setRelationship('friend');
        document.getElementById('set-foe').onclick = () => this.setRelationship('foe');
        document.getElementById('set-best-friend').onclick = () => this.setRelationship('best_friend');
        document.getElementById('set-nemesis').onclick = () => this.setRelationship('nemesis');
        
        // Action buttons
        document.getElementById('propose-treaty').onclick = () => this.openTreatyDialog();
        document.getElementById('declare-war').onclick = () => this.declareWar();
        document.getElementById('launch-missile').onclick = () => this.launchMissile();
        document.getElementById('launch-nuke').onclick = () => this.launchNuke();
        document.getElementById('spy-operation').onclick = () => this.openSpyDialog();
        document.getElementById('send-aid').onclick = () => this.openAidDialog();
    }
    
    /**
     * Bind game events
     */
    bindGameEvents() {
        if (window.EventBus) {
            EventBus.on('territory_claimed', () => this.scheduleRender());
            EventBus.on('nation_updated', () => this.scheduleRender());
            EventBus.on('alliance_updated', () => this.updateAllianceLegend());
            EventBus.on('war_declared', () => this.scheduleRender());
            EventBus.on('treaty_signed', () => this.scheduleRender());
        }
    }
    
    /**
     * Resize canvas to container.
     * Skips the resize if the parent is not yet visible (width/height = 0)
     * so we don't lock the canvas to 0×0 while game-container is hidden.
     * The game engine calls resizeCanvas() again after revealing the container.
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Guard: don't size to 0×0 (parent is hidden or not yet in layout)
        if (rect.width === 0 || rect.height === 0) {
            // Try again on next frame once layout is complete
            requestAnimationFrame(() => this.resizeCanvas());
            return;
        }

        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Clear render cache on resize
        this.renderCache.clear();
        
        if (this.isInitialized) {
            this.scheduleRender();
        }
    }
    
    /**
     * Start render loop with FPS limiting
     */
    startRenderLoop() {
        const targetFrameTime = 1000 / this.renderFPS;
        
        const renderFrame = (currentTime) => {
            if (currentTime - this.lastRenderTime >= targetFrameTime) {
                this.render();
                this.lastRenderTime = currentTime;
            }
            
            if (this.isInitialized) {
                requestAnimationFrame(renderFrame);
            }
        };
        
        requestAnimationFrame(renderFrame);
    }
    
    /**
     * Schedule a render (debounced for performance)
     */
    scheduleRender() {
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
        
        this.renderTimeout = setTimeout(() => {
            this.render();
        }, 16); // ~60 FPS
    }
    /**
     * Main render function
     */
    render() {
        if (!this.isInitialized) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set background
        this.ctx.fillStyle = '#1e3a8a'; // Deep blue ocean background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calculate visible bounds
        const bounds = this.getVisibleBounds();
        
        // Render grid if enabled
        if (this.showGrid && this.zoom > 0.5) {
            this.renderGrid(bounds);
        }
        
        // Render territories based on view mode
        if (this.viewMode === 'nation') {
            this.renderNationView(bounds);
        } else {
            this.renderAllianceView(bounds);
        }
        
        // Render interaction highlights
        this.renderInteractionHighlights();
        
        // Render UI overlays
        this.renderUIOverlays();
    }
    
    /**
     * Calculate visible bounds for efficient rendering
     */
    getVisibleBounds() {
        const tilesX = Math.ceil(this.canvas.width / (this.tileSize * this.zoom)) + 4;
        const tilesY = Math.ceil(this.canvas.height / (this.tileSize * this.zoom)) + 4;
        
        return {
            minX: Math.floor(this.cameraX - tilesX / 2),
            maxX: Math.floor(this.cameraX + tilesX / 2),
            minY: Math.floor(this.cameraY - tilesY / 2),
            maxY: Math.floor(this.cameraY + tilesY / 2)
        };
    }
    
    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = screenX - rect.left;
        const canvasY = screenY - rect.top;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const worldX = this.cameraX + (canvasX - centerX) / (this.tileSize * this.zoom);
        const worldY = this.cameraY - (canvasY - centerY) / (this.tileSize * this.zoom);
        
        return {
            x: Math.floor(worldX),
            y: Math.floor(worldY)
        };
    }
    
    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const screenX = centerX + (worldX - this.cameraX) * this.tileSize * this.zoom;
        const screenY = centerY - (worldY - this.cameraY) * this.tileSize * this.zoom;
        
        return { x: screenX, y: screenY };
    }
    /**
     * Render grid lines
     */
    renderGrid(bounds) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = bounds.minX; x <= bounds.maxX; x++) {
            const screenPos = this.worldToScreen(x, 0);
            if (screenPos.x >= -1 && screenPos.x <= this.canvas.width + 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(screenPos.x, 0);
                this.ctx.lineTo(screenPos.x, this.canvas.height);
                this.ctx.stroke();
            }
        }
        
        // Horizontal lines
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            const screenPos = this.worldToScreen(0, y);
            if (screenPos.y >= -1 && screenPos.y <= this.canvas.height + 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, screenPos.y);
                this.ctx.lineTo(this.canvas.width, screenPos.y);
                this.ctx.stroke();
            }
        }
    }
    
    /**
     * Render nation view
     */
    renderNationView(bounds) {
        if (!window.GridMap) return;
        
        const territories = GridMap.getTerritoriesInBounds(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY);
        
        // Group territories by nation
        const nationTerritories = new Map();
        
        for (const territory of territories) {
            if (territory && territory.ownerId) {
                if (!nationTerritories.has(territory.ownerId)) {
                    nationTerritories.set(territory.ownerId, []);
                }
                nationTerritories.get(territory.ownerId).push(territory);
            } else {
                // Render unclaimed territory
                this.renderTerritory(territory, '#2d3748');
            }
        }
        
        // Render each nation's territories
        for (const [nationId, territories] of nationTerritories) {
            const nation = this.getNationData(nationId);
            const color = nation ? nation.color : this.generateColorForNation(nationId);
            
            for (const territory of territories) {
                this.renderTerritory(territory, color);
            }
            
            // Render nation label if enabled and zoom is appropriate
            if (this.showLabels && this.zoom > 1 && nation && territories.length > 0) {
                this.renderNationLabel(nation, territories);
            }
        }
    }
    
    /**
     * Render alliance view
     */
    renderAllianceView(bounds) {
        if (!window.GridMap) return;
        
        const territories = GridMap.getTerritoriesInBounds(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY);
        
        // Group territories by alliance
        const allianceTerritories = new Map();
        
        for (const territory of territories) {
            if (territory && territory.ownerId) {
                const nation = this.getNationData(territory.ownerId);
                const allianceId = nation ? nation.allianceId : null;
                
                if (allianceId) {
                    if (!allianceTerritories.has(allianceId)) {
                        allianceTerritories.set(allianceId, []);
                    }
                    allianceTerritories.get(allianceId).push({ territory, nation });
                } else {
                    // Unallied nation - use nation color
                    const color = nation ? nation.color : this.generateColorForNation(territory.ownerId);
                    this.renderTerritory(territory, color);
                }
            } else {
                // Render unclaimed territory
                this.renderTerritory(territory, '#2d3748');
            }
        }
        
        // Render each alliance's territories
        for (const [allianceId, territoryData] of allianceTerritories) {
            const alliance = this.getAllianceData(allianceId);
            const color = alliance ? alliance.color : this.generateColorForAlliance(allianceId);
            
            for (const { territory } of territoryData) {
                this.renderTerritory(territory, color);
            }
            
            // Render alliance label if enabled
            if (this.showLabels && this.zoom > 0.8 && alliance && territoryData.length > 0) {
                this.renderAllianceLabel(alliance, territoryData);
            }
        }
    }
    /**
     * Render individual territory
     */
    renderTerritory(territory, color) {
        if (!territory) return;
        
        const screenPos = this.worldToScreen(territory.x, territory.y);
        const size = this.tileSize * this.zoom;
        
        // Skip if outside visible area
        if (screenPos.x + size < 0 || screenPos.x > this.canvas.width ||
            screenPos.y + size < 0 || screenPos.y > this.canvas.height) {
            return;
        }
        
        // Fill territory
        this.ctx.fillStyle = color;
        this.ctx.fillRect(screenPos.x, screenPos.y, size, size);
        
        // Border
        if (this.zoom > 0.5) {
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(screenPos.x, screenPos.y, size, size);
        }
        
        // Resource indicators
        if (this.showResources && this.zoom > 2 && territory.resources) {
            this.renderResourceIndicators(territory, screenPos, size);
        }
        
        // Population indicator
        if (this.showPopulation && this.zoom > 1.5 && territory.population > 0) {
            this.renderPopulationIndicator(territory, screenPos, size);
        }
    }
    
    /**
     * Render resource indicators
     */
    renderResourceIndicators(territory, screenPos, size) {
        const resources = territory.resources;
        const resourceTypes = ['food', 'materials', 'energy', 'fuel', 'steel', 'aluminum'];
        const resourceColors = {
            food: '#84cc16',
            materials: '#a3a3a3',
            energy: '#fbbf24',
            fuel: '#dc2626',
            steel: '#6b7280',
            aluminum: '#e5e7eb'
        };
        
        let resourceIndex = 0;
        const dotSize = Math.max(2, size * 0.08);
        const margin = 2;
        
        for (const [type, amount] of Object.entries(resources)) {
            if (amount > 0 && resourceTypes.includes(type) && resourceIndex < 6) {
                const x = screenPos.x + margin + (resourceIndex % 3) * (dotSize + 1);
                const y = screenPos.y + margin + Math.floor(resourceIndex / 3) * (dotSize + 1);
                
                this.ctx.fillStyle = resourceColors[type] || '#666';
                this.ctx.fillRect(x, y, dotSize, dotSize);
                
                resourceIndex++;
            }
        }
    }
    
    /**
     * Render population indicator
     */
    renderPopulationIndicator(territory, screenPos, size) {
        const population = territory.population || 0;
        const populationLevel = Math.min(5, Math.floor(population / 10000));
        
        if (populationLevel > 0) {
            const centerX = screenPos.x + size / 2;
            const centerY = screenPos.y + size / 2;
            const radius = Math.min(size * 0.15, 8);
            
            this.ctx.fillStyle = '#1f2937';
            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
            
            // Population dots
            if (this.zoom > 3) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = `${Math.min(10, size * 0.3)}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(populationLevel.toString(), centerX, centerY + 3);
            }
        }
    }
    /**
     * Render nation label
     */
    renderNationLabel(nation, territories) {
        if (!nation || !territories.length) return;
        
        // Calculate center position of nation's territories
        let avgX = 0, avgY = 0;
        for (const territory of territories) {
            avgX += territory.x;
            avgY += territory.y;
        }
        avgX /= territories.length;
        avgY /= territories.length;
        
        const screenPos = this.worldToScreen(avgX, avgY);
        
        // Only render if on screen
        if (screenPos.x < 0 || screenPos.x > this.canvas.width ||
            screenPos.y < 0 || screenPos.y > this.canvas.height) {
            return;
        }
        
        // Label background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.font = `${this.labelFontSize}px Arial`;
        const textWidth = this.ctx.measureText(nation.name).width;
        
        this.ctx.fillRect(
            screenPos.x - textWidth / 2 - 4,
            screenPos.y - this.labelFontSize / 2 - 2,
            textWidth + 8,
            this.labelFontSize + 4
        );
        
        // Label text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(nation.name, screenPos.x, screenPos.y + 3);
    }
    
    /**
     * Render alliance label
     */
    renderAllianceLabel(alliance, territoryData) {
        if (!alliance || !territoryData.length) return;
        
        // Calculate center position of alliance territories
        let avgX = 0, avgY = 0;
        for (const { territory } of territoryData) {
            avgX += territory.x;
            avgY += territory.y;
        }
        avgX /= territoryData.length;
        avgY /= territoryData.length;
        
        const screenPos = this.worldToScreen(avgX, avgY);
        
        // Only render if on screen
        if (screenPos.x < 0 || screenPos.x > this.canvas.width ||
            screenPos.y < 0 || screenPos.y > this.canvas.height) {
            return;
        }
        
        // Label background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.font = `bold ${this.labelFontSize + 2}px Arial`;
        const textWidth = this.ctx.measureText(alliance.name).width;
        
        this.ctx.fillRect(
            screenPos.x - textWidth / 2 - 6,
            screenPos.y - (this.labelFontSize + 2) / 2 - 3,
            textWidth + 12,
            this.labelFontSize + 8
        );
        
        // Label text
        this.ctx.fillStyle = alliance.color || '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(alliance.name, screenPos.x, screenPos.y + 4);
        
        // Member count
        if (this.zoom > 1.5) {
            this.ctx.font = `${this.labelFontSize - 2}px Arial`;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillText(
                `${alliance.memberCount || 0} members`,
                screenPos.x,
                screenPos.y + this.labelFontSize + 8
            );
        }
    }
    /**
     * Render interaction highlights
     */
    renderInteractionHighlights() {
        // Hover highlight
        if (this.hoveredTile) {
            const screenPos = this.worldToScreen(this.hoveredTile.x, this.hoveredTile.y);
            const size = this.tileSize * this.zoom;
            
            this.ctx.strokeStyle = '#fbbf24';
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.8;
            this.ctx.strokeRect(screenPos.x, screenPos.y, size, size);
            this.ctx.globalAlpha = 1.0;
        }
        
        // Selected nation highlight
        if (this.selectedNation) {
            this.renderNationHighlight(this.selectedNation, '#f59e0b', 4);
        }
        
        // Hovered nation highlight
        if (this.hoveredNation && this.hoveredNation !== this.selectedNation) {
            this.renderNationHighlight(this.hoveredNation, '#fbbf24', 2);
        }
    }
    
    /**
     * Render nation territory highlight
     */
    renderNationHighlight(nationId, color, lineWidth) {
        if (!window.GridMap || !nationId) return;
        
        const territories = GridMap.getNationTerritories(nationId);
        
        for (const territory of territories) {
            const screenPos = this.worldToScreen(territory.x, territory.y);
            const size = this.tileSize * this.zoom;
            
            // Only render if on screen
            if (screenPos.x + size >= 0 && screenPos.x <= this.canvas.width &&
                screenPos.y + size >= 0 && screenPos.y <= this.canvas.height) {
                
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = lineWidth;
                this.ctx.globalAlpha = 0.9;
                this.ctx.strokeRect(screenPos.x, screenPos.y, size, size);
                this.ctx.globalAlpha = 1.0;
            }
        }
    }
    
    /**
     * Render UI overlays
     */
    renderUIOverlays() {
        // Coordinates and zoom display
        this.renderInfoOverlay();
        
        // Mini-map (if zoom is very low)
        if (this.zoom < 0.5) {
            this.renderMiniMap();
        }
    }
    
    /**
     * Render info overlay
     */
    renderInfoOverlay() {
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 220, 80);
        
        // Info text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        
        this.ctx.fillText(`Camera: (${this.cameraX.toFixed(1)}, ${this.cameraY.toFixed(1)})`, 15, 25);
        this.ctx.fillText(`Zoom: ${(this.zoom * 100).toFixed(0)}%`, 15, 40);
        this.ctx.fillText(`Mode: ${this.viewMode.charAt(0).toUpperCase() + this.viewMode.slice(1)}`, 15, 55);
        
        if (this.hoveredTile) {
            this.ctx.fillText(`Hover: (${this.hoveredTile.x}, ${this.hoveredTile.y})`, 15, 70);
        }
        
        if (this.selectedNation) {
            this.ctx.fillText(`Selected Nation: ${this.selectedNation}`, 15, 85);
        }
    }
    
    /**
     * Render mini-map for navigation at low zoom
     */
    renderMiniMap() {
        const miniSize = 150;
        const miniX = this.canvas.width - miniSize - 20;
        const miniY = 20;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(miniX, miniY, miniSize, miniSize);
        
        // Border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(miniX, miniY, miniSize, miniSize);
        
        // Camera position indicator
        const cameraDotSize = 4;
        const cameraDotX = miniX + miniSize / 2;
        const cameraDotY = miniY + miniSize / 2;
        
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.beginPath();
        this.ctx.arc(cameraDotX, cameraDotY, cameraDotSize, 0, Math.PI * 2);
        this.ctx.fill();
    }
    /**
     * Camera and view controls
     */
    centerView() {
        this.cameraX = 0;
        this.cameraY = 0;
        this.scheduleRender();
    }
    
    pan(deltaX, deltaY) {
        this.cameraX += deltaX;
        this.cameraY += deltaY;
        this.scheduleRender();
    }
    
    zoomIn() {
        const newZoom = Math.min(this.maxZoom, this.zoom * 1.5);
        this.setZoom(newZoom);
    }
    
    zoomOut() {
        const newZoom = Math.max(this.minZoom, this.zoom / 1.5);
        this.setZoom(newZoom);
    }
    
    setZoom(newZoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
        this.scheduleRender();
    }
    
    /**
     * View mode controls
     */
    setViewMode(mode) {
        if (mode !== this.viewMode) {
            this.viewMode = mode;
            
            // Update UI
            document.querySelectorAll('.view-toggle-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            if (mode === 'nation') {
                document.getElementById('nation-view-btn').classList.add('active');
                document.getElementById('alliance-legend').classList.add('hidden');
            } else {
                document.getElementById('alliance-view-btn').classList.add('active');
                document.getElementById('alliance-legend').classList.remove('hidden');
                this.updateAllianceLegend();
            }
            
            this.scheduleRender();
        }
    }
    
    /**
     * Toggle controls
     */
    toggleGrid() {
        this.showGrid = !this.showGrid;
        const btn = document.getElementById('toggle-grid');
        btn.classList.toggle('active', this.showGrid);
        this.scheduleRender();
    }
    
    toggleLabels() {
        this.showLabels = !this.showLabels;
        const btn = document.getElementById('toggle-labels');
        btn.classList.toggle('active', this.showLabels);
        this.scheduleRender();
    }
    
    toggleResources() {
        this.showResources = !this.showResources;
        const btn = document.getElementById('toggle-resources');
        btn.classList.toggle('active', this.showResources);
        this.scheduleRender();
    }
    /**
     * Event handlers
     */
    handleMouseDown(e) {
        this.isDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.canvas.style.cursor = 'grabbing';
        e.preventDefault();
    }
    
    handleMouseMove(e) {
        const worldPos = this.screenToWorld(e.clientX, e.clientY);
        
        // Update hovered tile
        if (window.GridMap) {
            const territory = GridMap.getTerritory(worldPos.x, worldPos.y);
            if (territory !== this.hoveredTile) {
                this.hoveredTile = territory;
                
                // Update hovered nation
                if (territory && territory.ownerId && territory.ownerId !== this.hoveredNation) {
                    this.hoveredNation = territory.ownerId;
                    this.scheduleRender();
                } else if (!territory || !territory.ownerId) {
                    if (this.hoveredNation) {
                        this.hoveredNation = null;
                        this.scheduleRender();
                    }
                }
            }
        }
        
        // Handle dragging
        if (this.isDragging) {
            const deltaX = (e.clientX - this.lastMousePos.x) / (this.tileSize * this.zoom);
            const deltaY = (e.clientY - this.lastMousePos.y) / (this.tileSize * this.zoom);
            
            this.pan(-deltaX, deltaY);
            this.lastMousePos = { x: e.clientX, y: e.clientY };
        }
    }
    
    handleMouseUp(e) {
        this.isDragging = false;
        this.canvas.style.cursor = 'default';
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const zoomFactor = e.deltaY > 0 ? 0.85 : 1.18;
        const newZoom = this.zoom * zoomFactor;
        this.setZoom(newZoom);
    }
    
    handleClick(e) {
        if (this.isDragging) return;
        
        const worldPos = this.screenToWorld(e.clientX, e.clientY);
        
        if (window.GridMap) {
            const territory = GridMap.getTerritory(worldPos.x, worldPos.y);
            
            if (territory && territory.ownerId) {
                // Click on nation territory
                this.selectNation(territory.ownerId);
            } else {
                // Click on empty space - close panels
                this.closeAllPanels();
            }
        }
    }
    
    handleRightClick(e) {
        e.preventDefault();
        
        const worldPos = this.screenToWorld(e.clientX, e.clientY);
        
        if (window.GridMap) {
            const territory = GridMap.getTerritory(worldPos.x, worldPos.y);
            
            if (territory && territory.ownerId) {
                // Right click on nation - open interaction panel
                this.openNationPanel(territory.ownerId, e.clientX, e.clientY);
            }
        }
    }
    
    handleKeyDown(e) {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.pan(0, -0.5);
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.pan(0, 0.5);
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.pan(-0.5, 0);
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.pan(0.5, 0);
                break;
            case 'Equal':
            case 'NumpadAdd':
                this.zoomIn();
                break;
            case 'Minus':
            case 'NumpadSubtract':
                this.zoomOut();
                break;
            case 'KeyC':
                this.centerView();
                break;
            case 'KeyG':
                this.toggleGrid();
                break;
            case 'KeyL':
                this.toggleLabels();
                break;
            case 'KeyR':
                this.toggleResources();
                break;
            case 'KeyV':
                this.setViewMode(this.viewMode === 'nation' ? 'alliance' : 'nation');
                break;
            case 'Escape':
                this.closeAllPanels();
                break;
        }
    }
    /**
     * Touch event handlers
     */
    handleTouchStart(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        } else if (e.touches.length === 2) {
            // Start pinch zoom
            this.lastPinchDistance = this.getPinchDistance(e.touches);
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        } else if (e.touches.length === 2) {
            // Handle pinch zoom
            const currentDistance = this.getPinchDistance(e.touches);
            const zoomFactor = currentDistance / this.lastPinchDistance;
            this.setZoom(this.zoom * zoomFactor);
            this.lastPinchDistance = currentDistance;
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        
        if (e.touches.length === 0) {
            this.handleMouseUp(e);
        }
    }
    
    getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Nation interaction methods
     */
    selectNation(nationId) {
        if (this.selectedNation !== nationId) {
            this.selectedNation = nationId;
            this.scheduleRender();
            
            // Update UI to show selected nation info
            this.updateNationInfo(nationId);
        }
    }
    
    openNationPanel(nationId, x, y) {
        this.selectedNation = nationId;
        this.populateNationPanel(nationId);
        
        const panel = document.getElementById('nation-interaction-panel');
        panel.classList.remove('hidden');
        
        // Position panel near click but keep it on screen
        const rect = panel.getBoundingClientRect();
        let panelX = x + 10;
        let panelY = y - rect.height / 2;
        
        if (panelX + rect.width > window.innerWidth) {
            panelX = x - rect.width - 10;
        }
        if (panelY < 0) {
            panelY = 10;
        }
        if (panelY + rect.height > window.innerHeight) {
            panelY = window.innerHeight - rect.height - 10;
        }
        
        panel.style.left = `${panelX}px`;
        panel.style.top = `${panelY}px`;
        
        this.interactionPanelOpen = true;
        this.scheduleRender();
    }
    
    closeNationPanel() {
        const panel = document.getElementById('nation-interaction-panel');
        panel.classList.add('hidden');
        this.interactionPanelOpen = false;
        this.selectedNation = null;
        this.scheduleRender();
    }
    
    closeAllPanels() {
        this.closeNationPanel();
        this.currentMenuPanel = null;
    }
    /**
     * Populate nation panel with data
     */
    populateNationPanel(nationId) {
        const nation = this.getNationData(nationId);
        
        if (!nation) {
            console.warn('Nation data not found for ID:', nationId);
            return;
        }
        
        // Basic info
        document.getElementById('nation-name').textContent = nation.name || `Nation ${nationId}`;
        document.getElementById('nation-leader').textContent = nation.leader || 'Unknown';
        document.getElementById('nation-population').textContent = 
            (nation.population || 0).toLocaleString();
        document.getElementById('nation-land').textContent = 
            (nation.land || 0).toLocaleString();
        document.getElementById('nation-infrastructure').textContent = 
            (nation.infrastructure || 0).toLocaleString();

        // Government — show icon + name
        const govEl = document.getElementById('nation-government');
        if (govEl) {
            const gov = window.GovernmentSystem?.getGovernment(nation.government);
            if (gov) {
                const govIconHtml = gov.image
                    ? `<img src="${gov.image}" alt="${gov.name}" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;margin-right:4px;">`
                    : `${gov.icon || '🏛️'} `;
                govEl.innerHTML = `${govIconHtml}${gov.name}`;
            } else {
                govEl.textContent = nation.government || '—';
            }
        }

        document.getElementById('nation-alliance').textContent = 
            nation.allianceName || 'None';
        
        // Military
        document.getElementById('nation-soldiers').textContent = 
            (nation.soldiers || 0).toLocaleString();
        document.getElementById('nation-tanks').textContent = 
            (nation.tanks || 0).toLocaleString();
        document.getElementById('nation-aircraft').textContent = 
            (nation.aircraft || 0).toLocaleString();
        document.getElementById('nation-ships').textContent = 
            (nation.ships || 0).toLocaleString();
        
        // Relationship status
        this.updateRelationshipStatus(nationId);
        
        // Enable/disable action buttons based on game state
        this.updateActionButtons(nationId);
    }
    
    /**
     * Update relationship status display
     */
    updateRelationshipStatus(nationId) {
        const relationship = this.getRelationshipStatus(nationId);
        const statusElement = document.getElementById('current-relationship');
        
        statusElement.textContent = relationship.name;
        statusElement.className = `relationship-status ${relationship.class}`;
        
        // Update relationship buttons
        document.querySelectorAll('.relation-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (relationship.id !== 'neutral') {
            const activeBtn = document.getElementById(`set-${relationship.id.replace('_', '-')}`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
        }
    }
    
    /**
     * Update action button states
     */
    updateActionButtons(nationId) {
        const nation = this.getNationData(nationId);
        const playerNation = this.getPlayerNation();
        
        if (!nation || !playerNation) return;
        
        // War-related buttons
        const atWar = this.areNationsAtWar(playerNation.id, nationId);
        document.getElementById('declare-war').disabled = atWar;
        document.getElementById('launch-missile').disabled = !atWar;
        document.getElementById('launch-nuke').disabled = !atWar || !playerNation.hasNukes;
        
        // Treaty button
        const hasTreaty = this.hasTreatyWith(playerNation.id, nationId);
        document.getElementById('propose-treaty').disabled = hasTreaty;
        
        // Spy operations (requires spy improvements)
        document.getElementById('spy-operation').disabled = !playerNation.hasSpyNetwork;
    }
    
    /**
     * Nation interaction actions
     */
    setRelationship(relationshipType) {
        if (!this.selectedNation) return;
        
        const playerNation = this.getPlayerNation();
        if (!playerNation) return;
        
        // Check if player has the required improvements/slots
        if (!this.canSetRelationship(relationshipType)) {
            this.showNotification('You need the required improvements to set this relationship type.');
            return;
        }
        
        // Set relationship through game systems
        if (window.Nation && window.Nation.setRelation) {
            Nation.setRelation(this.selectedNation, this.getRelationshipValue(relationshipType));
            this.updateRelationshipStatus(this.selectedNation);
            this.showNotification(`Relationship with ${this.getNationName(this.selectedNation)} set to ${relationshipType.replace('_', ' ')}`);
        }
    }
    
    openTreatyDialog() {
        if (!this.selectedNation) return;
        
        // Open diplomacy system treaty dialog
        if (window.EventBus) {
            EventBus.emit('open_diplomacy_panel', {
                targetNation: this.selectedNation,
                action: 'propose_treaty'
            });
        }
        
        this.closeNationPanel();
    }
    
    declareWar() {
        if (!this.selectedNation) return;
        
        // Confirm war declaration
        if (confirm(`Are you sure you want to declare war on ${this.getNationName(this.selectedNation)}?`)) {
            if (window.EventBus) {
                EventBus.emit('declare_war', {
                    targetNation: this.selectedNation
                });
            }
            
            this.closeNationPanel();
            this.showNotification(`War declared on ${this.getNationName(this.selectedNation)}!`);
        }
    }
    
    launchMissile() {
        if (!this.selectedNation) return;
        
        // Open war system missile launch interface
        if (window.EventBus) {
            EventBus.emit('open_war_panel', {
                targetNation: this.selectedNation,
                action: 'launch_missile'
            });
        }
        
        this.closeNationPanel();
    }
    
    launchNuke() {
        if (!this.selectedNation) return;
        
        // Confirm nuke launch
        if (confirm(`Are you sure you want to launch a nuclear weapon at ${this.getNationName(this.selectedNation)}? This is a very serious action!`)) {
            if (window.EventBus) {
                EventBus.emit('open_war_panel', {
                    targetNation: this.selectedNation,
                    action: 'launch_nuke'
                });
            }
            
            this.closeNationPanel();
        }
    }
    
    openSpyDialog() {
        if (!this.selectedNation) return;
        
        // Open spy operations interface
        if (window.EventBus) {
            EventBus.emit('open_war_panel', {
                targetNation: this.selectedNation,
                action: 'spy_operation'
            });
        }
        
        this.closeNationPanel();
    }
    
    openAidDialog() {
        if (!this.selectedNation) return;
        
        // Open aid dialog through diplomacy system
        if (window.EventBus) {
            EventBus.emit('open_diplomacy_panel', {
                targetNation: this.selectedNation,
                action: 'send_aid'
            });
        }
        
        this.closeNationPanel();
    }
    /**
     * Update alliance legend
     */
    updateAllianceLegend() {
        const legend = document.getElementById('alliance-legend');
        if (!legend) return;
        
        const alliances = this.getAllAlliances();
        
        if (alliances.length === 0) {
            legend.innerHTML = '<div class="legend-header">No Alliances</div>';
            return;
        }
        
        let html = '<div class="legend-header">Alliance Legend</div>';
        
        for (const alliance of alliances) {
            html += `
                <div class="legend-item">
                    <div class="alliance-color" style="background-color: ${alliance.color}"></div>
                    <span class="alliance-name">${alliance.name}</span>
                    <span class="alliance-members">(${alliance.memberCount} members)</span>
                </div>
            `;
        }
        
        legend.innerHTML = html;
    }
    
    /**
     * Utility methods
     */
    getNationData(nationId) {
        // Try to get from Nation system first
        if (window.Nations && Nations[nationId]) {
            return Nations[nationId];
        }
        
        // Try AI nations system
        if (window.aiNations && window.aiNations.aiNations) {
            const aiNation = window.aiNations.aiNations.get(nationId);
            if (aiNation) {
                return {
                    id: aiNation.id,
                    name: aiNation.name || `AI Nation ${nationId}`,
                    leader: aiNation.leader || 'AI',
                    color: aiNation.factionColor || this.generateColorForNation(nationId),
                    population: aiNation.population || 0,
                    land: aiNation.land || 0,
                    infrastructure: aiNation.infra || 0,
                    isAI: true
                };
            }
        }
        
        // Try to get from database manager
        if (window.DatabaseManager && DatabaseManager.nationDatabase) {
            return DatabaseManager.nationDatabase.getNation(nationId);
        }
        
        // Fallback to basic data
        return {
            id: nationId,
            name: `Nation ${nationId}`,
            color: this.generateColorForNation(nationId),
            population: 0,
            land: 0,
            infrastructure: 0
        };
    }
    
    getAllianceData(allianceId) {
        if (window.AllianceSystem && AllianceSystem.getAlliance) {
            return AllianceSystem.getAlliance(allianceId);
        }
        
        return {
            id: allianceId,
            name: `Alliance ${allianceId}`,
            color: this.generateColorForAlliance(allianceId),
            memberCount: 0
        };
    }
    
    getPlayerNation() {
        if (window.Nation) {
            return Nation;
        }
        
        if (window.Player && Player.playerId) {
            return this.getNationData(Player.playerId);
        }
        
        return null;
    }
    
    getNationName(nationId) {
        const nation = this.getNationData(nationId);
        return nation ? nation.name : `Nation ${nationId}`;
    }
    
    getAllAlliances() {
        if (window.AllianceSystem && AllianceSystem.alliances) {
            return Object.values(AllianceSystem.alliances);
        }
        
        return [];
    }
    
    getRelationshipStatus(nationId) {
        if (window.Nation && Nation.getRelation) {
            const value = Nation.getRelation(nationId);
            
            if (value >= 100) return { id: 'best_friend', name: 'Best Friend', class: 'best-friend' };
            if (value >= 50) return { id: 'friend', name: 'Friend', class: 'friend' };
            if (value <= -100) return { id: 'nemesis', name: 'Nemesis', class: 'nemesis' };
            if (value <= -50) return { id: 'foe', name: 'Foe', class: 'foe' };
        }
        
        return { id: 'neutral', name: 'Neutral', class: 'neutral' };
    }
    
    getRelationshipValue(relationshipType) {
        const values = {
            'friend': 75,
            'foe': -75,
            'best_friend': 150,
            'nemesis': -150
        };
        
        return values[relationshipType] || 0;
    }
    
    canSetRelationship(relationshipType) {
        const playerNation = this.getPlayerNation();
        if (!playerNation) return false;
        
        // Check for required improvements
        if (relationshipType === 'best_friend' || relationshipType === 'nemesis') {
            return playerNation.hasAdvancedDiplomacy || false;
        }
        
        return true;
    }
    
    areNationsAtWar(nationId1, nationId2) {
        if (window.WarSystem && WarSystem.areNationsAtWar) {
            return WarSystem.areNationsAtWar(nationId1, nationId2);
        }
        return false;
    }
    
    hasTreatyWith(nationId1, nationId2) {
        if (window.DiplomacySystem && DiplomacySystem.hasMutualPact) {
            return DiplomacySystem.hasMutualPact(nationId1, nationId2);
        }
        return false;
    }
    
    generateColorForNation(nationId) {
        // Generate consistent color based on nation ID
        const colors = [
            '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
            '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
            '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
        ];
        
        const hash = this.hashCode(nationId.toString());
        return colors[Math.abs(hash) % colors.length];
    }
    
    generateColorForAlliance(allianceId) {
        // Generate distinct colors for alliances
        const colors = [
            '#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a',
            '#059669', '#0891b2', '#2563eb', '#4f46e5', '#7c3aed',
            '#9333ea', '#c026d3', '#db2777', '#e11d48'
        ];
        
        const hash = this.hashCode(allianceId.toString());
        return colors[Math.abs(hash) % colors.length];
    }
    
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }
    
    showNotification(message) {
        // Create or update notification
        let notification = document.getElementById('map-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'map-notification';
            notification.className = 'map-notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    /**
     * Cleanup
     */
    destroy() {
        this.isInitialized = false;
        
        // Remove event listeners
        window.removeEventListener('resize', this.resizeCanvas);
        
        // Clear render cache
        this.renderCache.clear();
        
        // Remove UI elements
        const elements = [
            'map-view-toggle',
            'nation-interaction-panel',
            'map-controls',
            'alliance-legend'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        });
    }
}

// Export for use
window.EnhancedMapRenderer = EnhancedMapRenderer;