/**
 * Grid Map Renderer - Canvas-based Grid Territory Visualization
 * Dominion Wars - Nation Building Strategy Game
 */

class GridMapRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.isInitialized = false;
        
        // Grid rendering properties
        this.gridSize = 30; // Pixels per grid square
        this.viewX = 0; // Center of view (grid coordinates)
        this.viewY = 0;
        this.zoom = 1.0;
        this.minZoom = 0.2;
        this.maxZoom = 3.0;
        
        // Rendering settings
        this.showGrid = true;
        this.showResources = false;
        this.showTerrain = true;
        this.showOwnership = true;
        
        // Colors and styling
        this.colors = {
            empty: '#f3f4f6',
            grid: '#e5e7eb',
            water: '#3b82f6',
            plains: '#84cc16',
            forest: '#16a34a',
            hills: '#a3a3a3',
            mountain: '#525252',
            swamp: '#65a30d',
            hover: '#fbbf24',
            selected: '#f59e0b'
        };
        
        // Interaction state
        this.hoveredTile = null;
        this.selectedTile = null;
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        
        this.initialize();
    }
    
    /**
     * Initialize the grid map renderer
     */
    initialize() {
        console.log('Initializing Grid Map Renderer...');
        
        this.resizeCanvas();
        this.bindEvents();
        
        // Set initial view to center
        this.centerView();
        
        // Bind to grid map events
        this.bindGridMapEvents();
        
        this.isInitialized = true;
        console.log('Grid Map Renderer initialized');
    }
    
    /**
     * Bind grid map specific events
     */
    bindGridMapEvents() {
        EventBus.on('territory_claimed', this.handleTerritoryChanged, this);
        EventBus.on('congress_updated', this.handleCongressUpdate, this);
        EventBus.on('account_created', this.handleAccountCreated, this);
    }
    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Update view if initialized
        if (this.isInitialized) {
            this.render();
        }
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Resize handler
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }
    
    /**
     * Convert screen coordinates to grid coordinates
     */
    screenToGrid(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = screenX - rect.left;
        const canvasY = screenY - rect.top;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const offsetX = (canvasX - centerX) / (this.gridSize * this.zoom);
        const offsetY = (canvasY - centerY) / (this.gridSize * this.zoom);
        
        const gridX = Math.floor(this.viewX + offsetX);
        const gridY = Math.floor(this.viewY - offsetY); // Flip Y axis
        
        return { x: gridX, y: gridY };
    }
    
    /**
     * Convert grid coordinates to screen coordinates
     */
    gridToScreen(gridX, gridY) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const offsetX = (gridX - this.viewX) * this.gridSize * this.zoom;
        const offsetY = -(gridY - this.viewY) * this.gridSize * this.zoom; // Flip Y axis
        
        return {
            x: centerX + offsetX,
            y: centerY + offsetY
        };
    }
    /**
     * Main render function
     */
    render() {
        if (!this.isInitialized) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calculate visible grid bounds
        const visibleBounds = this.getVisibleBounds();
        
        // Render grid background
        if (this.showGrid) {
            this.renderGrid(visibleBounds);
        }
        
        // Render territories
        this.renderTerritories(visibleBounds);
        
        // Render hover and selection
        this.renderInteractions();
        
        // Render UI overlays
        this.renderUI();
    }
    
    /**
     * Get visible grid bounds
     */
    getVisibleBounds() {
        const tilesX = Math.ceil(this.canvas.width / (this.gridSize * this.zoom)) + 2;
        const tilesY = Math.ceil(this.canvas.height / (this.gridSize * this.zoom)) + 2;
        
        return {
            minX: Math.floor(this.viewX - tilesX / 2),
            maxX: Math.floor(this.viewX + tilesX / 2),
            minY: Math.floor(this.viewY - tilesY / 2),
            maxY: Math.floor(this.viewY + tilesY / 2)
        };
    }
    
    /**
     * Render grid lines
     */
    renderGrid(bounds) {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;
        
        // Vertical lines
        for (let x = bounds.minX; x <= bounds.maxX; x++) {
            const screenPos = this.gridToScreen(x, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(screenPos.x, 0);
            this.ctx.lineTo(screenPos.x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            const screenPos = this.gridToScreen(0, y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenPos.y);
            this.ctx.lineTo(this.canvas.width, screenPos.y);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    /**
     * Render territories
     */
    renderTerritories(bounds) {
        const territories = GridMap.getTerritoriesInBounds(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY);
        
        for (const territory of territories) {
            this.renderTerritory(territory);
        }
    }
    
    /**
     * Render individual territory tile
     */
    renderTerritory(territory) {
        const screenPos = this.gridToScreen(territory.x, territory.y);
        const size = this.gridSize * this.zoom;
        
        // Skip if outside canvas
        if (screenPos.x + size < 0 || screenPos.x > this.canvas.width ||
            screenPos.y + size < 0 || screenPos.y > this.canvas.height) {
            return;
        }
        
        // Base color based on ownership or terrain
        let fillColor = this.colors.empty;
        
        if (territory.ownerId && this.showOwnership) {
            // Use faction color if owned
            fillColor = territory.ownerFaction || '#94a3b8';
        } else if (this.showTerrain) {
            // Use terrain color
            fillColor = this.colors[territory.terrain] || this.colors.empty;
        }
        
        // Fill tile
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(screenPos.x, screenPos.y, size, size);
        
        // Border
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.5;
        this.ctx.strokeRect(screenPos.x, screenPos.y, size, size);
        this.ctx.globalAlpha = 1.0;
        
        // Resource indicators
        if (this.showResources && size > 20) {
            this.renderTileResources(territory, screenPos, size);
        }
        
        // Population/infrastructure indicators
        if (territory.population > 0 && size > 15) {
            this.renderPopulationIndicator(territory, screenPos, size);
        }
    }
    
    /**
     * Render resource indicators on tile
     */
    renderTileResources(territory, screenPos, size) {
        const resources = territory.resources;
        const resourceTypes = ['food', 'materials', 'energy'];
        const resourceColors = {
            food: '#84cc16',
            materials: '#a3a3a3',
            energy: '#fbbf24'
        };
        
        let resourceIndex = 0;
        for (const [type, amount] of Object.entries(resources)) {
            if (amount > 0 && resourceTypes.includes(type)) {
                const dotSize = Math.max(2, size * 0.1);
                const x = screenPos.x + 2 + (resourceIndex * (dotSize + 1));
                const y = screenPos.y + 2;
                
                this.ctx.fillStyle = resourceColors[type];
                this.ctx.fillRect(x, y, dotSize, dotSize);
                
                resourceIndex++;
                if (resourceIndex >= 3) break;
            }
        }
    }
    /**
     * Render population indicator
     */
    renderPopulationIndicator(territory, screenPos, size) {
        const populationLevel = Math.min(5, Math.floor(territory.population / 1000));
        
        if (populationLevel > 0) {
            const centerX = screenPos.x + size / 2;
            const centerY = screenPos.y + size / 2;
            const radius = Math.min(3, size * 0.15);
            
            this.ctx.fillStyle = '#1f2937';
            this.ctx.globalAlpha = 0.7;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }
    }
    
    /**
     * Render interaction highlights
     */
    renderInteractions() {
        // Hover highlight
        if (this.hoveredTile) {
            const screenPos = this.gridToScreen(this.hoveredTile.x, this.hoveredTile.y);
            const size = this.gridSize * this.zoom;
            
            this.ctx.strokeStyle = this.colors.hover;
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.8;
            this.ctx.strokeRect(screenPos.x, screenPos.y, size, size);
            this.ctx.globalAlpha = 1.0;
        }
        
        // Selection highlight
        if (this.selectedTile) {
            const screenPos = this.gridToScreen(this.selectedTile.x, this.selectedTile.y);
            const size = this.gridSize * this.zoom;
            
            this.ctx.strokeStyle = this.colors.selected;
            this.ctx.lineWidth = 4;
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeRect(screenPos.x, screenPos.y, size, size);
            this.ctx.setLineDash([]);
        }
    }
    
    /**
     * Render UI elements
     */
    renderUI() {
        // Coordinates display
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 60);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`View: (${Math.floor(this.viewX)}, ${Math.floor(this.viewY)})`, 15, 25);
        this.ctx.fillText(`Zoom: ${(this.zoom * 100).toFixed(0)}%`, 15, 40);
        
        if (this.hoveredTile) {
            this.ctx.fillText(`Hover: (${this.hoveredTile.x}, ${this.hoveredTile.y})`, 15, 55);
        }
    }
    /**
     * Center view on origin
     */
    centerView() {
        this.viewX = 0;
        this.viewY = 0;
        this.render();
    }
    
    /**
     * Pan view by offset
     */
    pan(deltaX, deltaY) {
        this.viewX += deltaX;
        this.viewY += deltaY;
        this.render();
    }
    
    /**
     * Zoom in
     */
    zoomIn() {
        this.zoom = Math.min(this.maxZoom, this.zoom * 1.5);
        this.render();
    }
    
    /**
     * Zoom out
     */
    zoomOut() {
        this.zoom = Math.max(this.minZoom, this.zoom / 1.5);
        this.render();
    }
    
    /**
     * Set zoom level
     */
    setZoom(zoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        this.render();
    }
    
    /**
     * Toggle resource display
     */
    toggleResources() {
        this.showResources = !this.showResources;
        this.render();
    }
    
    /**
     * Toggle terrain display
     */
    toggleTerrain() {
        this.showTerrain = !this.showTerrain;
        this.render();
    }
    
    /**
     * Toggle grid display
     */
    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.render();
    }
    /**
     * Handle territory changes
     */
    handleTerritoryChanged(data) {
        this.render();
    }
    
    /**
     * Handle congress updates
     */
    handleCongressUpdate(data) {
        this.render();
    }
    
    /**
     * Handle account creation
     */
    handleAccountCreated(data) {
        this.render();
    }
    
    /**
     * Claim territory for current player
     */
    claimTerritory(x, y) {
        if (!window.Player || !window.GridMap || !Player.factionColor) {
            console.log('Cannot claim territory: Player not initialized or no faction');
            return false;
        }
        
        try {
            const success = GridMap.claimTerritory(x, y, Player.playerId, Player.factionColor);
            if (success) {
                // Award experience for claiming territory
                Player.gainExperience('construction', 50);
                
                // Update nation territories if Nation exists
                if (window.Nation) {
                    if (!Nation.territories) Nation.territories = [];
                    Nation.territories.push(`${x},${y}`);
                }
                
                this.render();
                console.log(`Territory claimed at (${x}, ${y})`);
            }
            return success;
        } catch (error) {
            console.error('Error claiming territory:', error);
            return false;
        }
    }

    // Event Handlers
    
    handleMouseDown(e) {
        this.isDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.canvas.style.cursor = 'grabbing';
    }
    
    handleMouseMove(e) {
        const gridPos = this.screenToGrid(e.clientX, e.clientY);
        const territory = GridMap.getTerritory(gridPos.x, gridPos.y);
        
        if (territory !== this.hoveredTile) {
            this.hoveredTile = territory;
            this.render();
            
            // Emit hover event
            EventBus.emit('tile_hover', {
                territory: territory,
                gridX: gridPos.x,
                gridY: gridPos.y
            });
        }
        
        if (this.isDragging) {
            const deltaX = (e.clientX - this.lastMousePos.x) / (this.gridSize * this.zoom);
            const deltaY = (e.clientY - this.lastMousePos.y) / (this.gridSize * this.zoom);
            
            this.pan(-deltaX, deltaY); // Invert for natural dragging
            
            this.lastMousePos = { x: e.clientX, y: e.clientY };
        }
    }
    
    handleMouseUp(e) {
        this.isDragging = false;
        this.canvas.style.cursor = 'default';
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * zoomFactor));
        this.render();
    }
    
    handleClick(e) {
        if (this.isDragging) return;
        
        const gridPos = this.screenToGrid(e.clientX, e.clientY);
        const territory = GridMap.getTerritory(gridPos.x, gridPos.y);
        
        this.selectedTile = territory;
        this.render();
        
        // Show tile info popup
        this.showTileInfoPopup(territory, gridPos);
        
        // Emit click event
        EventBus.emit('tile_click', {
            territory: territory,
            gridX: gridPos.x,
            gridY: gridPos.y
        });
    }
    
    /**
     * Show tile information popup
     */
    showTileInfoPopup(territory, gridPos) {
        const popup = document.getElementById('tile-info-popup');
        const coords = document.getElementById('tile-coords');
        const terrain = document.getElementById('tile-terrain');
        const owner = document.getElementById('tile-owner');
        const resources = document.getElementById('tile-resources');
        const claimBtn = document.getElementById('claim-territory-btn');
        
        if (!popup || !coords || !terrain || !owner || !resources || !claimBtn) return;
        
        // Update popup content
        coords.textContent = `Territory (${gridPos.x}, ${gridPos.y})`;
        
        if (territory) {
            terrain.textContent = territory.terrain;
            owner.textContent = territory.ownerId ? 
                `${this.getFactionName(territory.ownerFaction)} faction` : 
                'Unclaimed';
            
            // Format resources
            const resourceList = Object.entries(territory.resources)
                .filter(([type, amount]) => amount > 0)
                .map(([type, amount]) => `${type}: ${amount}`)
                .join(', ') || 'None';
            resources.textContent = resourceList;
            
            // Update claim button
            if (!territory.ownerId && window.Player && Player.factionColor) {
                claimBtn.style.display = 'block';
                claimBtn.onclick = () => {
                    if (this.claimTerritory(gridPos.x, gridPos.y)) {
                        this.hideTileInfoPopup();
                    }
                };
            } else {
                claimBtn.style.display = 'none';
            }
        } else {
            terrain.textContent = 'Unknown';
            owner.textContent = 'Unclaimed';
            resources.textContent = 'Unknown';
            claimBtn.style.display = 'none';
        }
        
        // Show popup
        popup.classList.remove('hidden');
    }
    
    /**
     * Hide tile info popup
     */
    hideTileInfoPopup() {
        const popup = document.getElementById('tile-info-popup');
        if (popup) {
            popup.classList.add('hidden');
        }
    }
    
    /**
     * Get faction name from color
     */
    getFactionName(factionColor) {
        if (!window.GridMap || !factionColor) return 'Unknown';
        
        const factionInfo = GridMap.getFactionInfo();
        const faction = Object.values(factionInfo).find(f => f.color === factionColor);
        return faction ? faction.name : 'Unknown';
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp(e);
    }
}

// Global renderer instance (initialized by game engine)
let MapRenderer = null;