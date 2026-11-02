/**
 * Enhanced Map Renderer - Complete Map System with Nation Interactions
 * Dominion Wars - Nation Building Strategy Game
 *
 * View modes (toggles):
 *   - Nations:   each nation its own color
 *   - Alliances: all members of an alliance share one color
 *   - Treaties:  nation color + green lines between treaty partners
 *   - Wars:      nation color + red lines between warring nations
 *   - Currencies: color by shared currency
 *
 * The map is an infinite sparse grid (map-data.js). Tiles are generated
 * deterministically on demand and the world grows forever.
 */

class EnhancedMapRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.isInitialized = false;

        // Camera
        this.cameraX = 0;
        this.cameraY = 0;
        this.zoom = 1.0;
        this.minZoom = 0.1;
        this.maxZoom = 8.0;
        this.tileSize = 32;

        // Display flags
        this.showGrid = true;
        this.showTerrain = true;
        this.showResources = false;
        this.showPopulation = true;
        this.showLabels = true;
        this.labelFontSize = 12;

        // View mode
        this.viewMode = 'nations'; // nations | alliances | treaties | wars | currencies

        // Interaction state
        this.selectedNation = null;
        this.hoveredNation = null;
        this.hoveredTile = null;
        this.selectedTile = null;
        this.interactionPanelOpen = false;
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.currentMenuPanel = null;

        // Performance
        this.renderCache = new Map();
        this.lastRenderTime = 0;
        this.renderFPS = 60;
        this.renderTimeout = null;

        // Filter system
        this.filters = {};
        this.activeFilter = null;

        this.initialize();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════

    initialize() {
        console.log('Initializing Enhanced Map Renderer...');

        this._loadFilters();
        this.createUIElements();
        this.setupEventListeners();
        this.resizeCanvas();
        this.centerView();
        this.bindGameEvents();

        this.isInitialized = true;
        console.log('Enhanced Map Renderer initialized');

        this.startRenderLoop();
    }

    _loadFilters() {
        // Ensure filter classes are available (loaded via script tags)
        const FilterClasses = {
            nations: window.NationFilter,
            alliances: window.AllianceFilter,
            treaties: window.TreatyFilter,
            wars: window.WarFilter,
            currencies: window.CurrencyFilter
        };

        for (const [mode, Klass] of Object.entries(FilterClasses)) {
            if (Klass) {
                const instance = new Klass({ mode });
                this.filters[mode] = instance;
            } else {
                console.warn(`EnhancedMapRenderer: filter class for "${mode}" not found`);
            }
        }

        this.setViewMode(this.viewMode);
    }

    setSystems(systems) {
        for (const filter of Object.values(this.filters)) {
            if (filter && typeof filter.setSystems === 'function') {
                filter.setSystems(systems);
            }
        }
        this._systems = systems;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // UI ELEMENTS
    // ══════════════════════════════════════════════════════════════════════════

    createUIElements() {
        this.createViewModeToggle();
        this.createNationInteractionPanel();
        this.createMapControls();
        this.createAllianceLegend();
    }

    createViewModeToggle() {
        let container = document.getElementById('map-view-toggle');
        if (!container) {
            container = document.createElement('div');
            container.id = 'map-view-toggle';
            container.className = 'map-view-toggle';
            document.body.appendChild(container);
        }

        const modes = [
            { id: 'nations', label: 'Nations', icon: 'fas fa-flag' },
            { id: 'alliances', label: 'Alliances', icon: 'fas fa-users' },
            { id: 'treaties', label: 'Treaties', icon: 'fas fa-handshake' },
            { id: 'wars', label: 'Wars', icon: 'fas fa-sword' },
            { id: 'currencies', label: 'Currencies', icon: 'fas fa-coins' }
        ];

        let html = '<div class="toggle-container">';
        for (const m of modes) {
            const active = m.id === this.viewMode ? 'active' : '';
            html += `
                <button id="map-view-${m.id}" class="view-toggle-btn ${active}" data-mode="${m.id}">
                    <i class="${m.icon}"></i>
                    ${m.label}
                </button>
            `;
        }
        html += '</div>';
        container.innerHTML = html;

        for (const m of modes) {
            const btn = document.getElementById(`map-view-${m.id}`);
            if (btn) {
                btn.onclick = () => this.setViewMode(m.id);
            }
        }
    }

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
                            <span>Currency:</span> <span id="nation-currency">-</span>
                        </div>
                    </div>
                    <div class="info-section">
                        <h4>Military</h4>
                        <div class="info-grid">
                            <span>🪖 Soldiers:</span> <span id="nation-soldiers">-</span>
                            <span>🛡️ Tanks:</span> <span id="nation-tanks">-</span>
                            <span>✈️ Aircraft:</span> <span id="nation-aircraft">-</span>
                            <span>🚢 Ships:</span> <span id="nation-ships">-</span>
                        </div>
                    </div>
                    <div class="info-section">
                        <h4>Relationship</h4>
                        <div class="relationship-status">
                            <span id="current-relationship">Neutral</span>
                            <div class="relationship-actions">
                                <button id="set-friend" class="relation-btn friend" title="Friend"><i class="fas fa-handshake"></i></button>
                                <button id="set-foe" class="relation-btn foe" title="Foe"><i class="fas fa-times"></i></button>
                                <button id="set-best-friend" class="relation-btn best-friend" title="Best Friend"><i class="fas fa-heart"></i></button>
                                <button id="set-nemesis" class="relation-btn nemesis" title="Nemesis"><i class="fas fa-skull"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="action-buttons">
                    <button id="propose-treaty" class="action-btn"><i class="fas fa-scroll"></i> Propose Treaty</button>
                    <button id="declare-war" class="action-btn war"><i class="fas fa-sword"></i> Declare War</button>
                    <button id="launch-missile" class="action-btn missile"><i class="fas fa-bomb"></i> Launch Missile</button>
                    <button id="launch-nuke" class="action-btn nuke"><i class="fas fa-radiation"></i> Launch Nuke</button>
                    <button id="spy-operation" class="action-btn spy"><i class="fas fa-user-secret"></i> Spy Operation</button>
                    <button id="send-aid" class="action-btn aid"><i class="fas fa-gift"></i> Send Aid</button>
                </div>
            </div>
        `;

        this.bindNationPanelEvents();
    }

    bindNationPanelEvents() {
        document.getElementById('close-nation-panel').onclick = () => this.closeNationPanel();
        document.getElementById('set-friend').onclick = () => this.setRelationship('friend');
        document.getElementById('set-foe').onclick = () => this.setRelationship('foe');
        document.getElementById('set-best-friend').onclick = () => this.setRelationship('best_friend');
        document.getElementById('set-nemesis').onclick = () => this.setRelationship('nemesis');
        document.getElementById('propose-treaty').onclick = () => this.openTreatyDialog();
        document.getElementById('declare-war').onclick = () => this.declareWar();
        document.getElementById('launch-missile').onclick = () => this.launchMissile();
        document.getElementById('launch-nuke').onclick = () => this.launchNuke();
        document.getElementById('spy-operation').onclick = () => this.openSpyDialog();
        document.getElementById('send-aid').onclick = () => this.openAidDialog();
    }

    createMapControls() {
        let controls = document.getElementById('map-controls');
        if (controls) {
            const zoomInBtn = document.getElementById('zoom-in');
            const zoomOutBtn = document.getElementById('zoom-out');
            const centerBtn = document.getElementById('center-map');
            const gridBtn = document.getElementById('toggle-grid');
            const resourceBtn = document.getElementById('toggle-resources');
            if (zoomInBtn) zoomInBtn.onclick = () => this.zoomIn();
            if (zoomOutBtn) zoomOutBtn.onclick = () => this.zoomOut();
            if (centerBtn) centerBtn.onclick = () => this.centerView();
            if (gridBtn) gridBtn.onclick = () => this.toggleGrid();
            if (resourceBtn) resourceBtn.onclick = () => this.toggleResources();
            return;
        }

        controls = document.createElement('div');
        controls.id = 'map-controls';
        controls.className = 'map-controls';
        document.body.appendChild(controls);

        controls.innerHTML = `
            <div class="zoom-controls">
                <button id="zoom-in" class="control-btn"><i class="fas fa-plus"></i></button>
                <button id="zoom-out" class="control-btn"><i class="fas fa-minus"></i></button>
                <button id="center-view" class="control-btn"><i class="fas fa-crosshairs"></i></button>
            </div>
            <div class="display-controls">
                <button id="toggle-grid" class="control-btn active" title="Toggle Grid"><i class="fas fa-th"></i></button>
                <button id="toggle-labels" class="control-btn active" title="Toggle Labels"><i class="fas fa-tag"></i></button>
                <button id="toggle-resources" class="control-btn" title="Toggle Resources"><i class="fas fa-gem"></i></button>
            </div>
        `;

        document.getElementById('zoom-in').onclick = () => this.zoomIn();
        document.getElementById('zoom-out').onclick = () => this.zoomOut();
        document.getElementById('center-view').onclick = () => this.centerView();
        document.getElementById('toggle-grid').onclick = () => this.toggleGrid();
        document.getElementById('toggle-labels').onclick = () => this.toggleLabels();
        document.getElementById('toggle-resources').onclick = () => this.toggleResources();
    }

    createAllianceLegend() {
        let legend = document.getElementById('alliance-legend');
        if (!legend) {
            legend = document.createElement('div');
            legend.id = 'alliance-legend';
            legend.className = 'alliance-legend hidden';
            document.body.appendChild(legend);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // VIEW MODE
    // ══════════════════════════════════════════════════════════════════════════

    setViewMode(mode) {
        const valid = ['nations', 'alliances', 'treaties', 'wars', 'currencies'];
        if (!valid.includes(mode)) return;
        if (mode === this.viewMode) return;

        this.viewMode = mode;
        this.activeFilter = this.filters[mode] || null;

        // Update UI buttons
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.getElementById(`map-view-${mode}`);
        if (activeBtn) activeBtn.classList.add('active');

        // Show/hide legend
        const legend = document.getElementById('alliance-legend');
        if (legend) {
            if (mode === 'alliances' || mode === 'currencies') {
                legend.classList.remove('hidden');
                this.updateLegend();
            } else {
                legend.classList.add('hidden');
            }
        }

        this.scheduleRender();
    }

    updateLegend() {
        const legend = document.getElementById('alliance-legend');
        if (!legend || !this.activeFilter) return;

        const entries = this.activeFilter.getLegend ? this.activeFilter.getLegend() : [];
        if (entries.length === 0) {
            legend.innerHTML = '<div class="legend-header">No Data</div>';
            return;
        }

        let html = '<div class="legend-header">' + this.viewMode.charAt(0).toUpperCase() + this.viewMode.slice(1) + '</div>';
        for (const entry of entries) {
            html += `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${entry.color}"></div>
                    <span class="alliance-name">${entry.label}</span>
                </div>
            `;
        }
        legend.innerHTML = html;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ══════════════════════════════════════════════════════════════════════════

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('resize', () => this.resizeCanvas());

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nation-interaction-panel') &&
                !e.target.closest('.map-view-toggle') &&
                !e.target.closest('.map-controls')) {
                if (this.currentMenuPanel && !e.target.closest('.menu-panel')) {
                    this.closeAllPanels();
                }
            }
        });
    }

    bindGameEvents() {
        if (!window.EventBus) return;
        window.EventBus.on('territory_claimed', () => this.scheduleRender());
        window.EventBus.on('nation_updated', () => this.scheduleRender());
        window.EventBus.on('alliance_updated', () => { this.updateLegend(); this.scheduleRender(); });
        window.EventBus.on('war_declared', () => this.scheduleRender());
        window.EventBus.on('treaty_signed', () => { this.updateLegend(); this.scheduleRender(); });
        window.EventBus.on('land_purchased', () => this.scheduleRender());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CANVAS
    // ══════════════════════════════════════════════════════════════════════════

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            requestAnimationFrame(() => this.resizeCanvas());
            return;
        }
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.renderCache.clear();
        if (this.isInitialized) this.scheduleRender();
    }

    startRenderLoop() {
        const targetFrameTime = 1000 / this.renderFPS;
        const renderFrame = (currentTime) => {
            if (currentTime - this.lastRenderTime >= targetFrameTime) {
                this.render();
                this.lastRenderTime = currentTime;
            }
            if (this.isInitialized) requestAnimationFrame(renderFrame);
        };
        requestAnimationFrame(renderFrame);
    }

    scheduleRender() {
        if (this.renderTimeout) clearTimeout(this.renderTimeout);
        this.renderTimeout = setTimeout(() => { this.render(); }, 16);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════════════════════

    render() {
        if (!this.isInitialized) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#1e3a8a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const bounds = this.getVisibleBounds();

        if (this.showGrid && this.zoom > 0.5) {
            this.renderGrid(bounds);
        }

        // Get visible territories from grid
        let territories = [];
        if (window.GridMap) {
            territories = window.GridMap.getTerritoriesInBounds(
                bounds.minX, bounds.maxX, bounds.minY, bounds.maxY
            );
        }

        // Build draw instructions from active filter
        let drawInstructions = { tiles: [], links: [] };
        if (this.activeFilter) {
            drawInstructions = this.activeFilter.build(territories);
        } else {
            // Fallback: draw all territories in default color
            for (const t of territories) {
                drawInstructions.tiles.push({ x: t.x, y: t.y, color: t.ownerId ? '#94a3b8' : null });
            }
        }

        // Draw tiles
        for (const tile of drawInstructions.tiles) {
            this.renderTerritory(tile.x, tile.y, tile.color);
        }

        // Draw overlay links (treaties/wars)
        for (const link of drawInstructions.links) {
            this.renderLink(link.from, link.to, link.color, link.width);
        }

        this.renderInteractionHighlights();
        this.renderUIOverlays();
    }

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

    screenToWorld(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const cx = screenX - rect.left;
        const cy = screenY - rect.top;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        return {
            x: Math.floor(this.cameraX + (cx - centerX) / (this.tileSize * this.zoom)),
            y: Math.floor(this.cameraY - (cy - centerY) / (this.tileSize * this.zoom))
        };
    }

    worldToScreen(worldX, worldY) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        return {
            x: centerX + (worldX - this.cameraX) * this.tileSize * this.zoom,
            y: centerY - (worldY - this.cameraY) * this.tileSize * this.zoom
        };
    }

    renderGrid(bounds) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        for (let x = bounds.minX; x <= bounds.maxX; x++) {
            const sp = this.worldToScreen(x, 0);
            if (sp.x >= -1 && sp.x <= this.canvas.width + 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(sp.x, 0);
                this.ctx.lineTo(sp.x, this.canvas.height);
                this.ctx.stroke();
            }
        }
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            const sp = this.worldToScreen(0, y);
            if (sp.y >= -1 && sp.y <= this.canvas.height + 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, sp.y);
                this.ctx.lineTo(this.canvas.width, sp.y);
                this.ctx.stroke();
            }
        }
    }

    renderTerritory(x, y, color) {
        const screenPos = this.worldToScreen(x, y);
        const size = this.tileSize * this.zoom;

        if (screenPos.x + size < 0 || screenPos.x > this.canvas.width ||
            screenPos.y + size < 0 || screenPos.y > this.canvas.height) {
            return;
        }

        // Determine fill color
        let fillColor = color;
        if (!fillColor) {
            // Unclaimed tile — show terrain color
            const t = window.GridMap ? window.GridMap.getTerritory(x, y) : null;
            fillColor = t && t.terrain ? this.terrainColor(t.terrain) : '#2d3748';
        }

        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(screenPos.x, screenPos.y, size, size);

        if (this.zoom > 0.5) {
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(screenPos.x, screenPos.y, size, size);
        }

        if (this.showResources && this.zoom > 2) {
            const t = window.GridMap ? window.GridMap.getTerritory(x, y) : null;
            if (t && t.resources) {
                this.renderResourceIndicators(t, screenPos, size);
            }
        }

        if (this.showPopulation && this.zoom > 1.5) {
            const t = window.GridMap ? window.GridMap.getTerritory(x, y) : null;
            if (t && t.population > 0) {
                this.renderPopulationIndicator(t, screenPos, size);
            }
        }
    }

    terrainColor(terrain) {
        const colors = {
            water: '#1e3a8a',
            plains: '#4a7c59',
            forest: '#2d5a3d',
            hills: '#6b7280',
            mountain: '#374151',
            swamp: '#4a6741'
        };
        return colors[terrain] || '#2d3748';
    }

    renderResourceIndicators(territory, screenPos, size) {
        const resources = territory.resources;
        const types = ['food', 'materials', 'energy'];
        const colors = { food: '#84cc16', materials: '#a3a3a3', energy: '#fbbf24' };
        let idx = 0;
        const dotSize = Math.max(2, size * 0.08);
        const margin = 2;
        for (const [type, amount] of Object.entries(resources)) {
            if (amount > 0 && types.includes(type) && idx < 6) {
                const x = screenPos.x + margin + (idx % 3) * (dotSize + 1);
                const y = screenPos.y + margin + Math.floor(idx / 3) * (dotSize + 1);
                this.ctx.fillStyle = colors[type] || '#666';
                this.ctx.fillRect(x, y, dotSize, dotSize);
                idx++;
            }
        }
    }

    renderPopulationIndicator(territory, screenPos, size) {
        const pop = territory.population || 0;
        const level = Math.min(5, Math.floor(pop / 10000));
        if (level > 0) {
            const cx = screenPos.x + size / 2;
            const cy = screenPos.y + size / 2;
            const radius = Math.min(size * 0.15, 8);
            this.ctx.fillStyle = '#1f2937';
            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }
    }

    renderLink(from, to, color, width) {
        const p1 = this.worldToScreen(from.x, from.y);
        const p2 = this.worldToScreen(to.x, to.y);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.globalAlpha = this.linkFade;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
    }

    renderInteractionHighlights() {
        if (this.hoveredTile) {
            const sp = this.worldToScreen(this.hoveredTile.x, this.hoveredTile.y);
            const size = this.tileSize * this.zoom;
            this.ctx.strokeStyle = '#fbbf24';
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.8;
            this.ctx.strokeRect(sp.x, sp.y, size, size);
            this.ctx.globalAlpha = 1.0;
        }
        if (this.selectedNation) {
            this.renderNationHighlight(this.selectedNation, '#f59e0b', 4);
        }
        if (this.hoveredNation && this.hoveredNation !== this.selectedNation) {
            this.renderNationHighlight(this.hoveredNation, '#fbbf24', 2);
        }
    }

    renderNationHighlight(nationId, color, lineWidth) {
        if (!window.GridMap || !nationId) return;
        const territories = window.GridMap.getNationTerritories(nationId);
        for (const t of territories) {
            const sp = this.worldToScreen(t.x, t.y);
            const size = this.tileSize * this.zoom;
            if (sp.x + size >= 0 && sp.x <= this.canvas.width &&
                sp.y + size >= 0 && sp.y <= this.canvas.height) {
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = lineWidth;
                this.ctx.globalAlpha = 0.9;
                this.ctx.strokeRect(sp.x, sp.y, size, size);
                this.ctx.globalAlpha = 1.0;
            }
        }
    }

    renderUIOverlays() {
        this.renderInfoOverlay();
        if (this.zoom < 0.5) this.renderMiniMap();
    }

    renderInfoOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 220, 90);
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
            this.ctx.fillText(`Selected: ${this.selectedNation}`, 15, 85);
        }
    }

    renderMiniMap() {
        const miniSize = 150;
        const miniX = this.canvas.width - miniSize - 20;
        const miniY = 20;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(miniX, miniY, miniSize, miniSize);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(miniX, miniY, miniSize, miniSize);
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.beginPath();
        this.ctx.arc(miniX + miniSize / 2, miniY + miniSize / 2, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CAMERA / VIEW CONTROLS
    // ══════════════════════════════════════════════════════════════════════════

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
        this.setZoom(Math.min(this.maxZoom, this.zoom * 1.5));
    }

    zoomOut() {
        this.setZoom(Math.max(this.minZoom, this.zoom / 1.5));
    }

    setZoom(newZoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
        this.scheduleRender();
    }

    toggleGrid() {
        this.showGrid = !this.showGrid;
        const btn = document.getElementById('toggle-grid');
        if (btn) btn.classList.toggle('active', this.showGrid);
        this.scheduleRender();
    }

    toggleLabels() {
        this.showLabels = !this.showLabels;
        const btn = document.getElementById('toggle-labels');
        if (btn) btn.classList.toggle('active', this.showLabels);
        this.scheduleRender();
    }

    toggleResources() {
        this.showResources = !this.showResources;
        const btn = document.getElementById('toggle-resources');
        if (btn) btn.classList.toggle('active', this.showResources);
        this.scheduleRender();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INPUT HANDLERS
    // ══════════════════════════════════════════════════════════════════════════

    handleMouseDown(e) {
        this.isDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.canvas.style.cursor = 'grabbing';
        e.preventDefault();
    }

    handleMouseMove(e) {
        const worldPos = this.screenToWorld(e.clientX, e.clientY);

        if (window.GridMap) {
            const territory = window.GridMap.getTerritory(worldPos.x, worldPos.y);
            if (territory !== this.hoveredTile) {
                this.hoveredTile = territory;
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
        this.setZoom(this.zoom * zoomFactor);
    }

    handleClick(e) {
        if (this.isDragging) return;
        const worldPos = this.screenToWorld(e.clientX, e.clientY);
        if (window.GridMap) {
            const territory = window.GridMap.getTerritory(worldPos.x, worldPos.y);
            if (territory && territory.ownerId) {
                this.selectNation(territory.ownerId);
            } else {
                this.closeAllPanels();
            }
        }
    }

    handleRightClick(e) {
        e.preventDefault();
        const worldPos = this.screenToWorld(e.clientX, e.clientY);
        if (window.GridMap) {
            const territory = window.GridMap.getTerritory(worldPos.x, worldPos.y);
            if (territory && territory.ownerId) {
                this.openNationPanel(territory.ownerId, e.clientX, e.clientY);
            }
        }
    }

    handleKeyDown(e) {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': this.pan(0, -0.5); break;
            case 'KeyS': case 'ArrowDown': this.pan(0, 0.5); break;
            case 'KeyA': case 'ArrowLeft': this.pan(-0.5, 0); break;
            case 'KeyD': case 'ArrowRight': this.pan(0.5, 0); break;
            case 'Equal': case 'NumpadAdd': this.zoomIn(); break;
            case 'Minus': case 'NumpadSubtract': this.zoomOut(); break;
            case 'KeyC': this.centerView(); break;
            case 'KeyG': this.toggleGrid(); break;
            case 'KeyL': this.toggleLabels(); break;
            case 'KeyR': this.toggleResources(); break;
            case 'KeyV':
                const order = ['nations', 'alliances', 'treaties', 'wars', 'currencies'];
                const idx = order.indexOf(this.viewMode);
                this.setViewMode(order[(idx + 1) % order.length]);
                break;
            case 'Escape': this.closeAllPanels(); break;
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        } else if (e.touches.length === 2) {
            this.lastPinchDistance = this._getPinchDistance(e.touches);
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        } else if (e.touches.length === 2) {
            const dist = this._getPinchDistance(e.touches);
            const factor = dist / this.lastPinchDistance;
            this.setZoom(this.zoom * factor);
            this.lastPinchDistance = dist;
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (e.touches.length === 0) this.handleMouseUp(e);
    }

    _getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // NATION INTERACTION
    // ══════════════════════════════════════════════════════════════════════════

    selectNation(nationId) {
        if (this.selectedNation !== nationId) {
            this.selectedNation = nationId;
            this.scheduleRender();
            this.updateNationInfo(nationId);
        }
    }

    openNationPanel(nationId, x, y) {
        this.selectedNation = nationId;
        this.populateNationPanel(nationId);

        const panel = document.getElementById('nation-interaction-panel');
        panel.classList.remove('hidden');

        const rect = panel.getBoundingClientRect();
        let panelX = x + 10;
        let panelY = y - rect.height / 2;
        if (panelX + rect.width > window.innerWidth) panelX = x - rect.width - 10;
        if (panelY < 0) panelY = 10;
        if (panelY + rect.height > window.innerHeight) panelY = window.innerHeight - rect.height - 10;

        panel.style.left = panelX + 'px';
        panel.style.top = panelY + 'px';

        this.interactionPanelOpen = true;
        this.scheduleRender();
    }

    closeNationPanel() {
        const panel = document.getElementById('nation-interaction-panel');
        if (panel) panel.classList.add('hidden');
        this.interactionPanelOpen = false;
        this.selectedNation = null;
        this.scheduleRender();
    }

    closeAllPanels() {
        this.closeNationPanel();
        this.currentMenuPanel = null;
    }

    populateNationPanel(nationId) {
        const nation = this.getNationData(nationId);
        if (!nation) return;

        document.getElementById('nation-name').textContent = nation.name || `Nation ${nationId}`;
        document.getElementById('nation-leader').textContent = nation.leader || 'Unknown';
        document.getElementById('nation-population').textContent = (nation.population || 0).toLocaleString();
        document.getElementById('nation-land').textContent = (nation.land || 0).toLocaleString();
        document.getElementById('nation-infrastructure').textContent = (nation.infrastructure || 0).toLocaleString();

        const govEl = document.getElementById('nation-government');
        if (govEl) {
            const gov = window.GovernmentSystem?.getGovernment(nation.government);
            if (gov) {
                const icon = gov.image
                    ? `<img src="${gov.image}" alt="${gov.name}" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;margin-right:4px;">`
                    : (gov.icon || '🏛️') + ' ';
                govEl.innerHTML = icon + gov.name;
            } else {
                govEl.textContent = nation.government || '—';
            }
        }

        document.getElementById('nation-alliance').textContent = nation.allianceName || 'None';
        document.getElementById('nation-currency').textContent = nation.currency || 'aurel';

        document.getElementById('nation-soldiers').textContent = (nation.soldiers || 0).toLocaleString();
        document.getElementById('nation-tanks').textContent = (nation.tanks || 0).toLocaleString();
        document.getElementById('nation-aircraft').textContent = (nation.aircraft || 0).toLocaleString();
        document.getElementById('nation-ships').textContent = (nation.ships || 0).toLocaleString();

        this.updateRelationshipStatus(nationId);
        this.updateActionButtons(nationId);
    }

    updateRelationshipStatus(nationId) {
        const rel = this.getRelationshipStatus(nationId);
        const el = document.getElementById('current-relationship');
        if (el) {
            el.textContent = rel.name;
            el.className = `relationship-status ${rel.class}`;
        }
        document.querySelectorAll('.relation-btn').forEach(btn => btn.classList.remove('active'));
        if (rel.id !== 'neutral') {
            const activeBtn = document.getElementById('set-' + rel.id.replace('_', '-'));
            if (activeBtn) activeBtn.classList.add('active');
        }
    }

    updateActionButtons(nationId) {
        const nation = this.getNationData(nationId);
        const playerNation = this.getPlayerNation();
        if (!nation || !playerNation) return;

        const atWar = this.areNationsAtWar(playerNation.id, nationId);
        const dwBtn = document.getElementById('declare-war');
        const lmBtn = document.getElementById('launch-missile');
        const lnBtn = document.getElementById('launch-nuke');
        const ptBtn = document.getElementById('propose-treaty');
        const soBtn = document.getElementById('spy-operation');

        if (dwBtn) dwBtn.disabled = atWar;
        if (lmBtn) lmBtn.disabled = !atWar;
        if (lnBtn) lnBtn.disabled = !atWar || !(playerNation.hasNukes);
        if (ptBtn) {
            const hasTreaty = this.hasTreatyWith(playerNation.id, nationId);
            ptBtn.disabled = hasTreaty;
        }
        if (soBtn) soBtn.disabled = !(playerNation.hasSpyNetwork);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DATA ACCESS (delegates to filter systems / game systems)
    // ══════════════════════════════════════════════════════════════════════════

    getNationData(nationId) {
        if (window.Nations && Nations[nationId]) return Nations[nationId];
        if (window.aiNations && window.aiNations.aiNations) {
            const ai = window.aiNations.aiNations.get(nationId);
            if (ai) {
                return {
                    id: ai.id, name: ai.name || `AI Nation ${nationId}`,
                    leader: ai.leader || 'AI', color: ai.factionColor,
                    population: ai.population || 0, land: ai.land || 0,
                    infrastructure: ai.infra || 0, isAI: true
                };
            }
        }
        if (window.DatabaseManager && DatabaseManager.nationDatabase) {
            return DatabaseManager.nationDatabase.getNation(nationId);
        }
        return {
            id: nationId, name: `Nation ${nationId}`,
            color: this._hashColor(nationId),
            population: 0, land: 0, infrastructure: 0
        };
    }

    getAllianceData(allianceId) {
        if (window.AllianceSystem && AllianceSystem.getAlliance) {
            return AllianceSystem.getAlliance(allianceId);
        }
        return { id: allianceId, name: `Alliance ${allianceId}`, color: this._hashColor(allianceId), memberCount: 0 };
    }

    getPlayerNation() {
        if (window.Nation) return window.Nation;
        if (window.Player && Player.playerId) return this.getNationData(Player.playerId);
        return null;
    }

    getNationName(nationId) {
        const n = this.getNationData(nationId);
        return n ? n.name : `Nation ${nationId}`;
    }

    getAllAlliances() {
        if (window.AllianceSystem && AllianceSystem.alliances) {
            return Object.values(AllianceSystem.alliances);
        }
        return [];
    }

    getRelationshipStatus(nationId) {
        if (window.Nation && Nation.getRelation) {
            const v = Nation.getRelation(nationId);
            if (v >= 100) return { id: 'best_friend', name: 'Best Friend', class: 'best-friend' };
            if (v >= 50) return { id: 'friend', name: 'Friend', class: 'friend' };
            if (v <= -100) return { id: 'nemesis', name: 'Nemesis', class: 'nemesis' };
            if (v <= -50) return { id: 'foe', name: 'Foe', class: 'foe' };
        }
        return { id: 'neutral', name: 'Neutral', class: 'neutral' };
    }

    getRelationshipValue(type) {
        const v = { friend: 75, foe: -75, best_friend: 150, nemesis: -150 };
        return v[type] || 0;
    }

    canSetRelationship(type) {
        const p = this.getPlayerNation();
        if (!p) return false;
        if (type === 'best_friend' || type === 'nemesis') return p.hasAdvancedDiplomacy || false;
        return true;
    }

    areNationsAtWar(id1, id2) {
        if (window.WarSystem && WarSystem.areNationsAtWar) return WarSystem.areNationsAtWar(id1, id2);
        return false;
    }

    hasTreatyWith(id1, id2) {
        if (window.DiplomacySystem && DiplomacySystem.hasMutualPact) return DiplomacySystem.hasMutualPact(id1, id2);
        return false;
    }

    _hashColor(str) {
        const colors = [
            '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
            '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
            '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
        ];
        let hash = 0;
        const s = String(str);
        for (let i = 0; i < s.length; i++) {
            hash = ((hash << 5) - hash) + s.charCodeAt(i);
            hash = hash & hash;
        }
        return colors[Math.abs(hash) % colors.length];
    }

    // ══════════════════════════════════════════════════════════════════════════
    // NATION ACTIONS
    // ══════════════════════════════════════════════════════════════════════════

    setRelationship(type) {
        if (!this.selectedNation) return;
        const p = this.getPlayerNation();
        if (!p) return;
        if (!this.canSetRelationship(type)) {
            this.showNotification('Required improvements missing for this relationship.');
            return;
        }
        if (window.Nation && Nation.setRelation) {
            Nation.setRelation(this.selectedNation, this.getRelationshipValue(type));
            this.updateRelationshipStatus(this.selectedNation);
            this.showNotification(`Relationship set to ${type.replace('_', ' ')}`);
        }
    }

    openTreatyDialog() {
        if (!this.selectedNation) return;
        if (window.EventBus) {
            window.EventBus.emit('open_diplomacy_panel', { targetNation: this.selectedNation, action: 'propose_treaty' });
        }
        this.closeNationPanel();
    }

    declareWar() {
        if (!this.selectedNation) return;
        if (confirm(`Declare war on ${this.getNationName(this.selectedNation)}?`)) {
            if (window.EventBus) {
                window.EventBus.emit('declare_war', { targetNation: this.selectedNation });
            }
            this.closeNationPanel();
            this.showNotification(`War declared on ${this.getNationName(this.selectedNation)}!`);
        }
    }

    launchMissile() {
        if (!this.selectedNation) return;
        if (window.EventBus) {
            window.EventBus.emit('open_war_panel', { targetNation: this.selectedNation, action: 'launch_missile' });
        }
        this.closeNationPanel();
    }

    launchNuke() {
        if (!this.selectedNation) return;
        if (confirm(`Launch nuke at ${this.getNationName(this.selectedNation)}?`)) {
            if (window.EventBus) {
                window.EventBus.emit('open_war_panel', { targetNation: this.selectedNation, action: 'launch_nuke' });
            }
            this.closeNationPanel();
        }
    }

    openSpyDialog() {
        if (!this.selectedNation) return;
        if (window.EventBus) {
            window.EventBus.emit('open_war_panel', { targetNation: this.selectedNation, action: 'spy_operation' });
        }
        this.closeNationPanel();
    }

    openAidDialog() {
        if (!this.selectedNation) return;
        if (window.EventBus) {
            window.EventBus.emit('open_diplomacy_panel', { targetNation: this.selectedNation, action: 'send_aid' });
        }
        this.closeNationPanel();
    }

    showNotification(message) {
        let notif = document.getElementById('map-notification');
        if (!notif) {
            notif = document.createElement('div');
            notif.id = 'map-notification';
            notif.className = 'map-notification';
            document.body.appendChild(notif);
        }
        notif.textContent = message;
        notif.classList.add('visible');
        setTimeout(() => { notif.classList.remove('visible'); }, 3000);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ══════════════════════════════════════════════════════════════════════════

    destroy() {
        this.isInitialized = false;
        if (this.renderTimeout) clearTimeout(this.renderTimeout);
        this.renderCache.clear();
        const ids = ['map-view-toggle', 'nation-interaction-panel', 'map-controls', 'alliance-legend', 'map-notification'];
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el) el.remove();
        }
    }
}

window.EnhancedMapRenderer = EnhancedMapRenderer;
