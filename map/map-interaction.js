/**
 * Map Interaction Handler - Mouse, Touch, and Keyboard Input for the Map
 * Dominion Wars - Nation Building Strategy Game
 *
 * Works with either GridMapRenderer or EnhancedMapRenderer. It detects the
 * renderer's API surface and adapts calls accordingly so both renderers are
 * fully supported.
 *
 * Inputs handled:
 *   - Left drag: pan the camera
 *   - Wheel: zoom toward/away from cursor
 *   - Double-click: center + zoom in (on tile) or zoom out (on empty space)
 *   - Right-click: context menu (Claim / Build / Deploy / Details / Center)
 *   - Hover: territory tooltip
 *   - Keyboard: WASD pan, +/- zoom, C center, G grid, L labels, R resources,
 *              V view mode, Esc clear selection/close menus
 *   - Touch: single finger pan, two-finger pinch zoom
 */

class MapInteraction {
    constructor(mapRenderer) {
        this.mapRenderer = mapRenderer;
        this.canvas = null;
        this.isEnabled = true;

        // Interaction state
        this.state = {
            isDragging: false,
            isRightDragging: false,
            dragStart: { x: 0, y: 0 },
            lastMousePos: { x: 0, y: 0 },
            dragThreshold: 5,
            hasDragged: false
        };

        // Touch state
        this.touch = {
            isActive: false,
            startDistance: 0,
            lastTouchPos: { x: 0, y: 0 },
            initialZoom: 1.0
        };

        // Context menu
        this.contextMenu = {
            isVisible: false,
            territory: null,
            position: { x: 0, y: 0 }
        };

        // Double-click detection
        this.lastClickTime = 0;
        this.doubleClickDelay = 300;

        // Detect renderer capabilities
        this._caps = this._detectRendererCapabilities();

        this.bindEvents();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RENDERER CAPABILITY DETECTION
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Detect which methods the active renderer supports so we can call
     * them safely regardless of which renderer class is in use.
     */
    _detectRendererCapabilities() {
        const r = this.mapRenderer;
        if (!r) return {};

        return {
            hasScreenToWorld: typeof r.screenToWorld === 'function',
            hasScreenToGrid: typeof r.screenToGrid === 'function',
            hasGetTerritoryAtScreen: typeof r.getTerritoryAtScreen === 'function',
            hasSetSelectedTerritory: typeof r.setSelectedTerritory === 'function',
            hasSetHoveredTerritory: typeof r.setHoveredTerritory === 'function',
            hasCenterOnTerritory: typeof r.centerOnTerritory === 'function',
            hasCenterView: typeof r.centerView === 'function' || typeof r.centerMap === 'function',
            hasSetZoom: typeof r.setZoom === 'function',
            hasZoomIn: typeof r.zoomIn === 'function',
            hasZoomOut: typeof r.zoomOut === 'function',
            hasToggleGrid: typeof r.toggleGrid === 'function',
            hasToggleLabels: typeof r.toggleLabels === 'function',
            hasToggleResources: typeof r.toggleResources === 'function',
            hasSetViewMode: typeof r.setViewMode === 'function',
            camera: r.camera || r, // EnhancedMapRenderer uses .camera, GridMapRenderer is flat
            get viewX() { return r.viewX !== undefined ? r.viewX : (r.camera ? r.camera.x : 0); },
            get viewY() { return r.viewY !== undefined ? r.viewY : (r.camera ? r.camera.y : 0); },
            get zoom() { return r.zoom !== undefined ? r.zoom : (r.camera ? r.camera.zoom : 1); },
            set zoom(v) { if (r.zoom !== undefined) r.zoom = v; else if (r.camera) r.camera.zoom = v; },
            get targetZoom() { return r.camera && r.camera.targetZoom !== undefined ? r.camera.targetZoom : r.zoom; },
            set targetZoom(v) { if (r.camera && r.camera.targetZoom !== undefined) r.camera.targetZoom = v; }
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════

    initialize(canvas) {
        this.canvas = canvas;
        console.log('Map interaction initialized');
    }

    bindEvents() {
        // Wait for canvas to be available
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._setupCanvas());
        } else {
            this._setupCanvas();
        }
    }

    _setupCanvas() {
        this.canvas = document.getElementById('game-map');
        if (!this.canvas) {
            // Try again shortly — the map integration may create it later
            setTimeout(() => this._setupCanvas(), 100);
            return;
        }

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        this.canvas.addEventListener('mouseenter', (e) => this.handleMouseEnter(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Prevent native drag
        this.canvas.addEventListener('dragstart', (e) => e.preventDefault());

        console.log('Map interaction event listeners attached');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // COORDINATE HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    _getCanvasRect() {
        return this.canvas ? this.canvas.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
    }

    _screenToWorld(screenX, screenY) {
        const r = this.mapRenderer;
        if (!r) return { x: 0, y: 0 };

        // Preferred: renderer has screenToWorld
        if (this._caps.hasScreenToWorld) {
            return r.screenToWorld(screenX, screenY);
        }

        // Fallback: renderer has screenToGrid
        if (this._caps.hasScreenToGrid) {
            return r.screenToGrid(screenX, screenY);
        }

        // Manual fallback using camera/view properties
        const rect = this._getCanvasRect();
        const cx = screenX - rect.left;
        const cy = screenY - rect.top;
        const centerX = (rect.width || this.canvas.width) / 2;
        const centerY = (rect.height || this.canvas.height) / 2;
        const zoom = this._caps.zoom;
        const tileSize = r.tileSize || r.gridSize || 32;
        const vx = this._caps.viewX;
        const vy = this._caps.viewY;

        const wx = vx + (cx - centerX) / (tileSize * zoom);
        const wy = vy - (cy - centerY) / (tileSize * zoom);
        return { x: Math.floor(wx), y: Math.floor(wy) };
    }

    _getTerritoryAtScreen(screenX, screenY) {
        const world = this._screenToWorld(screenX, screenY);
        if (this._caps.hasGetTerritoryAtScreen) {
            return this.mapRenderer.getTerritoryAtScreen(screenX, screenY);
        }
        // Fallback: use GridMap directly
        if (window.GridMap) {
            return window.GridMap.getTerritory(world.x, world.y);
        }
        return null;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MOUSE EVENTS
    // ══════════════════════════════════════════════════════════════════════════

    handleMouseDown(event) {
        if (!this.isEnabled || !this.mapRenderer) return;
        event.preventDefault();

        const rect = this._getCanvasRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.state.lastMousePos = { x, y };
        this.state.dragStart = { x, y };
        this.state.hasDragged = false;

        if (event.button === 0) {
            this.state.isDragging = true;
            this.canvas.style.cursor = 'grabbing';
        } else if (event.button === 2) {
            this.state.isRightDragging = true;
        }

        // Check for territory click on left button
        if (event.button === 0) {
            const territory = this._getTerritoryAtScreen(event.clientX, event.clientY);
            if (territory) {
                this.handleTerritoryClick(territory, event);
            }
        }
    }

    handleMouseMove(event) {
        if (!this.isEnabled || !this.mapRenderer) return;

        const rect = this._getCanvasRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const deltaX = x - this.state.lastMousePos.x;
        const deltaY = y - this.state.lastMousePos.y;

        if (this.state.isDragging || this.state.isRightDragging) {
            const dist = Math.sqrt(
                Math.pow(x - this.state.dragStart.x, 2) +
                Math.pow(y - this.state.dragStart.y, 2)
            );
            if (dist > this.state.dragThreshold) {
                this.state.hasDragged = true;
                this._pan(-deltaX, -deltaY);
                this.state.lastMousePos = { x, y };
            }
        } else {
            const territory = this._getTerritoryAtScreen(event.clientX, event.clientY);
            this._handleTerritoryHover(territory);

            this.canvas.style.cursor = territory ? 'pointer' : 'grab';
        }

        this.state.lastMousePos = { x, y };
    }

    handleMouseUp(event) {
        if (!this.isEnabled) return;

        if (event.button === 0) {
            this.state.isDragging = false;
            this.canvas.style.cursor = 'grab';
        } else if (event.button === 2) {
            this.state.isRightDragging = false;
        }

        if (!this.state.isDragging && !this.state.isRightDragging) {
            this.state.hasDragged = false;
        }
    }

    handleWheel(event) {
        if (!this.isEnabled || !this.mapRenderer) return;
        event.preventDefault();

        const rect = this._getCanvasRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // World position before zoom
        const before = this._screenToWorld(mouseX, mouseY);

        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        this._applyZoom(this._caps.targetZoom * zoomFactor, before, { x: mouseX, y: mouseY });

        event.stopPropagation();
    }

    handleDoubleClick(event) {
        if (!this.isEnabled || !this.mapRenderer) return;
        event.preventDefault();

        const rect = this._getCanvasRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const territory = this._getTerritoryAtScreen(event.clientX, event.clientY);

        if (territory) {
            this._centerOnTerritory(territory);
            this._zoomIn();
        } else {
            this._zoomOut();
        }
    }

    handleContextMenu(event) {
        event.preventDefault();
        if (this.state.hasDragged) return;

        const territory = this._getTerritoryAtScreen(event.clientX, event.clientY);
        if (territory) {
            this.showContextMenu(territory, event.clientX, event.clientY);
        }
    }

    handleMouseEnter(event) {
        this.canvas.style.cursor = 'grab';
    }

    handleMouseLeave(event) {
        this.canvas.style.cursor = 'default';
        if (this.mapRenderer && this._caps.hasSetHoveredTerritory) {
            this.mapRenderer.setHoveredTerritory(null);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TOUCH EVENTS
    // ══════════════════════════════════════════════════════════════════════════

    handleTouchStart(event) {
        if (!this.isEnabled || !this.mapRenderer) return;
        event.preventDefault();

        const touches = event.touches;
        if (touches.length === 1) {
            const touch = touches[0];
            const rect = this._getCanvasRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.touch.isActive = true;
            this.touch.lastTouchPos = { x, y };
            this.state.dragStart = { x, y };

            const territory = this._getTerritoryAtScreen(touch.clientX, touch.clientY);
            if (territory) {
                this.handleTerritoryClick(territory, event);
            }
        } else if (touches.length === 2) {
            this.touch.startDistance = this._getPinchDistance(touches);
            this.touch.initialZoom = this._caps.targetZoom;
        }
    }

    handleTouchMove(event) {
        if (!this.isEnabled || !this.mapRenderer || !this.touch.isActive) return;
        event.preventDefault();

        const touches = event.touches;

        if (touches.length === 1) {
            const touch = touches[0];
            const rect = this._getCanvasRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            const deltaX = x - this.touch.lastTouchPos.x;
            const deltaY = y - this.touch.lastTouchPos.y;
            this._pan(-deltaX, -deltaY);
            this.touch.lastTouchPos = { x, y };
        } else if (touches.length === 2) {
            const distance = this._getPinchDistance(touches);
            const scale = distance / this.touch.startDistance;
            this._applyZoom(this.touch.initialZoom * scale);
            this.touch.startDistance = distance;
        }
    }

    handleTouchEnd(event) {
        if (!this.isEnabled) return;
        event.preventDefault();
        if (event.touches.length === 0) {
            this.touch.isActive = false;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // KEYBOARD EVENTS
    // ══════════════════════════════════════════════════════════════════════════

    handleKeyDown(event) {
        if (!this.isEnabled || !this.mapRenderer) return;

        const panStep = 50 / this._caps.zoom;

        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                event.preventDefault(); this._pan(0, -panStep); break;
            case 'ArrowDown':
            case 'KeyS':
                event.preventDefault(); this._pan(0, panStep); break;
            case 'ArrowLeft':
            case 'KeyA':
                event.preventDefault(); this._pan(-panStep, 0); break;
            case 'ArrowRight':
            case 'KeyD':
                event.preventDefault(); this._pan(panStep, 0); break;
            case 'Equal':
            case 'NumpadAdd':
                event.preventDefault(); this._zoomIn(); break;
            case 'Minus':
            case 'NumpadSubtract':
                event.preventDefault(); this._zoomOut(); break;
            case 'KeyC':
                event.preventDefault(); this._centerView(); break;
            case 'KeyG':
                event.preventDefault(); if (this._caps.hasToggleGrid) this.mapRenderer.toggleGrid(); break;
            case 'KeyL':
                event.preventDefault(); if (this._caps.hasToggleLabels) this.mapRenderer.toggleLabels(); break;
            case 'KeyR':
                event.preventDefault(); if (this._caps.hasToggleResources) this.mapRenderer.toggleResources(); break;
            case 'KeyV':
                event.preventDefault();
                if (this._caps.hasSetViewMode) {
                    const current = this.mapRenderer.viewMode || 'nation';
                    this.mapRenderer.setViewMode(current === 'nation' ? 'alliance' : 'nation');
                }
                break;
            case 'Escape':
                this.hideContextMenu();
                if (this.mapRenderer && this._caps.hasSetSelectedTerritory) {
                    this.mapRenderer.setSelectedTerritory(null);
                }
                break;
        }
    }

    handleKeyUp(event) {
        // Reserved
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ACTION HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    _pan(deltaX, deltaY) {
        const r = this.mapRenderer;
        if (!r) return;
        if (typeof r.pan === 'function') {
            r.pan(deltaX, deltaY);
        } else if (r.camera) {
            r.camera.x += deltaX;
            r.camera.y += deltaY;
            if (typeof r.scheduleRender === 'function') r.scheduleRender();
            else if (typeof r.render === 'function') r.render();
        } else {
            r.viewX += deltaX;
            r.viewY += deltaY;
            if (typeof r.render === 'function') r.render();
        }
    }

    _applyZoom(newZoom, worldBefore, screenPos) {
        const r = this.mapRenderer;
        if (!r) return;

        const clamped = Math.max(
            r.minZoom || 0.1,
            Math.min(r.maxZoom || 8.0, newZoom)
        );

        if (typeof r.setZoom === 'function') {
            r.setZoom(clamped);
        } else if (r.camera) {
            r.camera.zoom = clamped;
            r.camera.targetZoom = clamped;
            // Adjust camera to zoom toward cursor
            if (worldBefore && screenPos) {
                const after = this._screenToWorld(screenPos.x, screenPos.y);
                r.camera.x += worldBefore.x - after.x;
                r.camera.y += worldBefore.y - after.y;
            }
            if (typeof r.scheduleRender === 'function') r.scheduleRender();
            else if (typeof r.render === 'function') r.render();
        } else {
            r.zoom = clamped;
            if (typeof r.render === 'function') r.render();
        }
    }

    _zoomIn() {
        const r = this.mapRenderer;
        if (!r) return;
        if (typeof r.zoomIn === 'function') {
            r.zoomIn();
        } else {
            const current = this._caps.targetZoom;
            const max = r.maxZoom || 8.0;
            this._applyZoom(Math.min(max, current * 1.5));
        }
    }

    _zoomOut() {
        const r = this.mapRenderer;
        if (!r) return;
        if (typeof r.zoomOut === 'function') {
            r.zoomOut();
        } else {
            const current = this._caps.targetZoom;
            const min = r.minZoom || 0.1;
            this._applyZoom(Math.max(min, current / 1.5));
        }
    }

    _centerView() {
        const r = this.mapRenderer;
        if (!r) return;
        if (typeof r.centerView === 'function') r.centerView();
        else if (typeof r.centerMap === 'function') r.centerMap();
        else if (r.camera) {
            r.camera.x = 0;
            r.camera.y = 0;
            if (typeof r.scheduleRender === 'function') r.scheduleRender();
        } else {
            r.viewX = 0;
            r.viewY = 0;
            if (typeof r.render === 'function') r.render();
        }
    }

    _centerOnTerritory(territory) {
        const r = this.mapRenderer;
        if (!r) return;
        if (typeof r.centerOnTerritory === 'function') {
            r.centerOnTerritory(territory.id || `${territory.x},${territory.y}`);
        } else {
            // Center camera on territory coords
            if (r.camera) {
                r.camera.x = territory.x;
                r.camera.y = territory.y;
                if (typeof r.scheduleRender === 'function') r.scheduleRender();
            } else {
                r.viewX = territory.x;
                r.viewY = territory.y;
                if (typeof r.render === 'function') r.render();
            }
        }
    }

    _handleTerritoryHover(territory) {
        if (this.mapRenderer && this._caps.hasSetHoveredTerritory) {
            this.mapRenderer.setHoveredTerritory(territory);
        }
        if (territory) {
            this.showTerritoryTooltip(territory);
        } else {
            this.hideTooltip();
        }
    }

    handleTerritoryClick(territory, event) {
        if (this.state.hasDragged) return;

        const now = Date.now();
        const isDoubleClick = (now - this.lastClickTime) < this.doubleClickDelay;
        this.lastClickTime = now;

        if (isDoubleClick) {
            this._centerOnTerritory(territory);
            this._zoomIn();
        } else {
            if (this.mapRenderer && this._caps.hasSetSelectedTerritory) {
                this.mapRenderer.setSelectedTerritory(territory);
            }
            if (typeof window.EventBus !== 'undefined') {
                window.EventBus.emit('territory_selected', { territory, mouseEvent: event });
            }
        }
        this.showTerritoryInfo(territory);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CONTEXT MENU
    // ══════════════════════════════════════════════════════════════════════════

    showContextMenu(territory, x, y) {
        this.hideContextMenu();

        this.contextMenu.isVisible = true;
        this.contextMenu.territory = territory;
        this.contextMenu.position = { x, y };

        const menu = document.createElement('div');
        menu.id = 'territory-context-menu';
        menu.className = 'context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background: var(--bg-glass, #1a2235);
            border: 1px solid var(--border-color, #444);
            border-radius: 6px;
            padding: 4px 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            z-index: 2000;
            min-width: 160px;
            color: #fff;
            font-family: sans-serif;
        `;

        const items = this.getContextMenuItems(territory);
        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'context-menu-item';
            el.textContent = item.text;
            el.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                font-size: 13px;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            `;
            el.addEventListener('mouseenter', () => { el.style.backgroundColor = 'rgba(255,255,255,0.05)'; });
            el.addEventListener('mouseleave', () => { el.style.backgroundColor = 'transparent'; });
            el.addEventListener('click', () => { item.action(territory); this.hideContextMenu(); });
            menu.appendChild(el);
        });

        document.body.appendChild(menu);

        const hide = (ev) => {
            if (!menu.contains(ev.target)) {
                this.hideContextMenu();
                document.removeEventListener('click', hide);
            }
        };
        setTimeout(() => document.addEventListener('click', hide), 0);
    }

    getContextMenuItems(territory) {
        const items = [];
        const nation = window.Nation;
        const isOwned = !!territory.ownerId;
        const isMine = isOwned && territory.ownerId === (nation?.id || nation?.playerId || 'player');

        if (!isOwned) {
            items.push({ text: 'Claim Territory', action: (t) => this._claimTerritory(t) });
        } else if (isMine) {
            items.push({ text: 'Build Infrastructure', action: (t) => this._showBuildMenu(t) });
            items.push({ text: 'Deploy Forces', action: (t) => this._deployForces(t) });
            items.push({ text: 'Abandon Territory', action: (t) => this._abandonTerritory(t) });
        } else {
            items.push({ text: 'View Details', action: (t) => this._showTerritoryDetails(t) });
            items.push({ text: 'Declare War', action: (t) => this._declareWar(t) });
        }

        items.push({ text: 'Center on Territory', action: (t) => this._centerOnTerritory(t) });
        return items;
    }

    hideContextMenu() {
        const menu = document.getElementById('territory-context-menu');
        if (menu) menu.remove();
        this.contextMenu.isVisible = false;
        this.contextMenu.territory = null;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TOOLTIPS
    // ══════════════════════════════════════════════════════════════════════════

    showTerritoryTooltip(territory) {
        this.hideTooltip();

        const tooltip = document.createElement('div');
        tooltip.id = 'territory-tooltip';
        tooltip.className = 'territory-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 10px;
            border-radius: 6px;
            pointer-events: none;
            z-index: 2000;
            max-width: 200px;
            font-size: 12px;
            font-family: sans-serif;
        `;

        const ownerName = territory.ownerId
            ? (territory.ownerName || `Nation ${territory.ownerId}`)
            : 'Unclaimed';
        const terrain = territory.terrain || 'unknown';

        tooltip.innerHTML = `
            <strong style="display:block;margin-bottom:4px;">${territory.name || `(${territory.x}, ${territory.y})`}</strong>
            <div style="margin-bottom:2px;"><span style="color:#88c;">Terrain:</span> ${terrain}</div>
            <div style="margin-bottom:2px;"><span style="color:#88c;">Owner:</span> ${ownerName}</div>
            ${territory.resources && Object.keys(territory.resources).length > 0
                ? `<div style="margin-bottom:2px;"><span style="color:#88c;">Resources:</span> ${Object.entries(territory.resources).filter(([_,v])=>v>0).map(([k])=>k).join(', ')}</div>`
                : '<div style="margin-bottom:2px;"><span style="color:#88c;">Resources:</span> None</div>'
            }
        `;

        document.body.appendChild(tooltip);

        const move = (ev) => {
            tooltip.style.left = (ev.clientX + 12) + 'px';
            tooltip.style.top = (ev.clientY - 8) + 'px';
        };
        this.canvas.addEventListener('mousemove', move);
        tooltip._move = move;
    }

    hideTooltip() {
        const tooltip = document.getElementById('territory-tooltip');
        if (tooltip) {
            if (tooltip._move) this.canvas.removeEventListener('mousemove', tooltip._move);
            tooltip.remove();
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ACTIONS (emit events to game systems)
    // ══════════════════════════════════════════════════════════════════════════

    _claimTerritory(territory) {
        if (typeof window.EventBus !== 'undefined') {
            window.EventBus.emit('claim_territory', territory);
        }
    }

    _showBuildMenu(territory) {
        if (typeof window.EventBus !== 'undefined') {
            window.EventBus.emit('show_build_menu', territory);
        }
    }

    _deployForces(territory) {
        if (typeof window.EventBus !== 'undefined') {
            window.EventBus.emit('deploy_forces', territory);
        }
    }

    _abandonTerritory(territory) {
        if (typeof window.EventBus !== 'undefined') {
            window.EventBus.emit('abandon_territory', territory);
        }
    }

    _showTerritoryDetails(territory) {
        if (typeof window.EventBus !== 'undefined') {
            window.EventBus.emit('show_territory_details', territory);
        }
    }

    _declareWar(territory) {
        if (typeof window.EventBus !== 'undefined') {
            window.EventBus.emit('declare_war', { targetNation: territory.ownerId });
        }
    }

    showTerritoryInfo(territory) {
        if (typeof window.EventBus !== 'undefined') {
            window.EventBus.emit('show_territory_info', territory);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ══════════════════════════════════════════════════════════════════════════

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
        this.hideContextMenu();
        this.hideTooltip();
    }

    getState() {
        return {
            isEnabled: this.isEnabled
        };
    }

    setState(state) {
        this.isEnabled = state.isEnabled !== undefined ? state.isEnabled : true;
    }

    destroy() {
        this.isEnabled = false;
        this.hideContextMenu();
        this.hideTooltip();
        console.log('Map interaction destroyed');
    }

    _getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

window.MapInteraction = MapInteraction;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MapInteraction };
}
