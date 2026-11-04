/**
 * Grid Map Renderer - Basic Canvas 2D Renderer
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Simplified renderer used as a fallback or lightweight option.
 * Draws grid tiles colored by ownership/terrain with pan/zoom/click.
 */

class GridMapRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.isInitialized = false;

        this.gridSize = 30;
        this.viewX = 0;
        this.viewY = 0;
        this.zoom = 1.0;
        this.minZoom = 0.2;
        this.maxZoom = 3.0;

        this.showGrid = true;
        this.showResources = false;
        this.showTerrain = true;
        this.showOwnership = true;

        this.hoveredTile = null;
        this.selectedTile = null;
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };

        this.initialize();
    }

    initialize() {
        console.log('Initializing Grid Map Renderer...');
        this.resizeCanvas();
        this.bindEvents();
        this.centerView();
        this.bindGridMapEvents();
        this.isInitialized = true;
        console.log('Grid Map Renderer initialized');
    }

    bindGridMapEvents() {
        if (typeof window.EventBus !== 'undefined') {
            window.EventBus.on('territory_claimed', () => this.render());
            window.EventBus.on('territory_released', () => this.render());
        }
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        if (this.isInitialized) this.render();
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    screenToGrid(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const cx = screenX - rect.left;
        const cy = screenY - rect.top;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const offsetX = (cx - centerX) / (this.gridSize * this.zoom);
        const offsetY = (cy - centerY) / (this.gridSize * this.zoom);
        return {
            x: Math.floor(this.viewX + offsetX),
            y: Math.floor(this.viewY - offsetY)
        };
    }

    gridToScreen(gridX, gridY) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const offsetX = (gridX - this.viewX) * this.gridSize * this.zoom;
        const offsetY = -(gridY - this.viewY) * this.gridSize * this.zoom;
        return { x: centerX + offsetX, y: centerY + offsetY };
    }

    render() {
        if (!this.isInitialized) return;
        this.ctx.fillStyle = '#1a2235';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const bounds = this.getVisibleBounds();

        if (this.showGrid) this.renderGrid(bounds);
        this.renderTerritories(bounds);
        this.renderInteractions();
        this.renderUI();
    }

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

    renderGrid(bounds) {
        this.ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;
        for (let x = bounds.minX; x <= bounds.maxX; x++) {
            const sp = this.gridToScreen(x, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(sp.x, 0);
            this.ctx.lineTo(sp.x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            const sp = this.gridToScreen(0, y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, sp.y);
            this.ctx.lineTo(this.canvas.width, sp.y);
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1.0;
    }

    renderTerritories(bounds) {
        if (!window.GridMap) return;
        const territories = window.GridMap.getTerritoriesInBounds(
            bounds.minX, bounds.maxX, bounds.minY, bounds.maxY
        );
        for (const t of territories) {
            this.renderTerritory(t);
        }
    }

    renderTerritory(territory) {
        const sp = this.gridToScreen(territory.x, territory.y);
        const size = this.gridSize * this.zoom;
        if (sp.x + size < 0 || sp.x > this.canvas.width ||
            sp.y + size < 0 || sp.y > this.canvas.height) return;

        let fillColor = '#2d3e52';
        if (territory.ownerId && this.showOwnership) {
            fillColor = territory.ownerFaction || '#94a3b8';
        } else if (this.showTerrain) {
            fillColor = this.terrainColor(territory.terrain);
        }

        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(sp.x, sp.y, size, size);

        this.ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.5;
        this.ctx.strokeRect(sp.x, sp.y, size, size);
        this.ctx.globalAlpha = 1.0;
    }

    terrainColor(t) {
        const c = { water: '#1e3a8a', plains: '#4a7c59', forest: '#2d5a3d',
            hills: '#6b7280', mountain: '#374151', swamp: '#4a6741' };
        return c[t] || '#2d3e52';
    }

    renderInteractions() {
        if (this.hoveredTile) {
            const sp = this.gridToScreen(this.hoveredTile.x, this.hoveredTile.y);
            const size = this.gridSize * this.zoom;
            this.ctx.strokeStyle = 'rgba(251,191,36,0.55)';
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.8;
            this.ctx.strokeRect(sp.x, sp.y, size, size);
            this.ctx.globalAlpha = 1.0;
        }
        if (this.selectedTile) {
            const sp = this.gridToScreen(this.selectedTile.x, this.selectedTile.y);
            const size = this.gridSize * this.zoom;
            this.ctx.strokeStyle = 'rgba(245,158,11,0.65)';
            this.ctx.lineWidth = 4;
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeRect(sp.x, sp.y, size, size);
            this.ctx.setLineDash([]);
        }
    }

    renderUI() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(10, 10, 200, 60);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`View: (${Math.floor(this.viewX)}, ${Math.floor(this.viewY)})`, 15, 25);
        this.ctx.fillText(`Zoom: ${(this.zoom * 100).toFixed(0)}%`, 15, 40);
        if (this.hoveredTile) {
            this.ctx.fillText(`Hover: (${this.hoveredTile.x}, ${this.hoveredTile.y})`, 15, 55);
        }
    }

    centerView() {
        this.viewX = 0;
        this.viewY = 0;
        this.render();
    }

    pan(deltaX, deltaY) {
        this.viewX += deltaX;
        this.viewY += deltaY;
        this.render();
    }

    zoomIn() {
        this.zoom = Math.min(this.maxZoom, this.zoom * 1.5);
        this.render();
    }

    zoomOut() {
        this.zoom = Math.max(this.minZoom, this.zoom / 1.5);
        this.render();
    }

    setZoom(z) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, z));
        this.render();
    }

    toggleGrid() { this.showGrid = !this.showGrid; this.render(); }
    toggleTerrain() { this.showTerrain = !this.showTerrain; this.render(); }
    toggleGrid() { this.showGrid = !this.showGrid; this.render(); }

    handleTerritoryChanged() { this.render(); }
    handleCongressUpdate() { this.render(); }
    handleAccountCreated() { this.render(); }

    claimTerritory(x, y) {
        if (!window.Player || !window.GridMap || !Player.factionColor) {
            console.log('Cannot claim: Player not initialized');
            return false;
        }
        try {
            const success = window.GridMap.claimTerritory(x, y, Player.playerId, Player.factionColor);
            if (success) {
                if (window.Player.gainExperience) Player.gainExperience('construction', 50);
                if (window.Nation) {
                    if (!Nation.territories) Nation.territories = [];
                    Nation.territories.push(`${x},${y}`);
                }
                this.render();
            }
            return success;
        } catch (err) {
            console.error('Error claiming territory:', err);
            return false;
        }
    }

    handleMouseDown(e) {
        this.isDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.canvas.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
        const gridPos = this.screenToGrid(e.clientX, e.clientY);
        const t = window.GridMap ? window.GridMap.getTerritory(gridPos.x, gridPos.y) : null;
        if (t !== this.hoveredTile) {
            this.hoveredTile = t;
            this.render();
        }
        if (this.isDragging) {
            const dx = (e.clientX - this.lastMousePos.x) / (this.gridSize * this.zoom);
            const dy = (e.clientY - this.lastMousePos.y) / (this.gridSize * this.zoom);
            this.pan(-dx, -dy);
            this.lastMousePos = { x: e.clientX, y: e.clientY };
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
        this.canvas.style.cursor = 'default';
    }

    handleWheel(e) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));
        this.render();
    }

    handleClick(e) {
        if (this.isDragging) return;
        const gridPos = this.screenToGrid(e.clientX, e.clientY);
        const t = window.GridMap ? window.GridMap.getTerritory(gridPos.x, gridPos.y) : null;
        this.selectedTile = t;
        this.render();
    }
}

let MapRenderer = null;
window.GridMapRenderer = GridMapRenderer;
