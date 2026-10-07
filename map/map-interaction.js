/**
 * Map Interaction Handler - Mouse and Touch Input for Map
 * Dominion Wars - Nation Building Strategy Game
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
        
        this.bindEvents();
    }

    /**
     * Initialize interaction handlers
     */
    initialize(canvas) {
        this.canvas = canvas;
        console.log('Map interaction initialized');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Wait for canvas to be available
        document.addEventListener('DOMContentLoaded', () => {
            this.canvas = document.getElementById('game-map');
            if (this.canvas) {
                this.setupEventListeners();
            }
        });
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));

        // Mouse enter/leave for hover states
        this.canvas.addEventListener('mouseenter', (e) => this.handleMouseEnter(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));

        // Touch events for mobile support
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Prevent default drag behavior
        this.canvas.addEventListener('dragstart', (e) => e.preventDefault());
        
        console.log('Map interaction event listeners setup complete');
    }

    /**
     * Handle mouse down events
     */
    handleMouseDown(event) {
        if (!this.isEnabled || !this.mapRenderer) return;

        event.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.state.lastMousePos = { x, y };
        this.state.dragStart = { x, y };
        this.state.hasDragged = false;

        if (event.button === 0) { // Left mouse button
            this.state.isDragging = true;
            this.canvas.style.cursor = 'grabbing';
        } else if (event.button === 2) { // Right mouse button
            this.state.isRightDragging = true;
        }

        // Check for territory selection
        const territory = this.mapRenderer.getTerritoryAtScreen(x, y);
        if (territory && event.button === 0) {
            this.handleTerritoryClick(territory, event);
        }
    }

    /**
     * Handle mouse move events
     */
    handleMouseMove(event) {
        if (!this.isEnabled || !this.mapRenderer) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const deltaX = x - this.state.lastMousePos.x;
        const deltaY = y - this.state.lastMousePos.y;

        // Update interaction state in renderer
        this.mapRenderer.interaction.lastMousePos = { x, y };

        // Handle dragging
        if (this.state.isDragging || this.state.isRightDragging) {
            const totalDistance = Math.sqrt(
                Math.pow(x - this.state.dragStart.x, 2) + 
                Math.pow(y - this.state.dragStart.y, 2)
            );

            if (totalDistance > this.state.dragThreshold) {
                this.state.hasDragged = true;
                
                // Pan the camera
                this.mapRenderer.camera.x -= deltaX / this.mapRenderer.camera.zoom;
                this.mapRenderer.camera.y -= deltaY / this.mapRenderer.camera.zoom;
            }
        } else {
            // Handle hover
            const territory = this.mapRenderer.getTerritoryAtScreen(x, y);
            this.handleTerritoryHover(territory);
            
            // Update cursor
            if (territory) {
                this.canvas.style.cursor = 'pointer';
            } else {
                this.canvas.style.cursor = 'grab';
            }
        }

        this.state.lastMousePos = { x, y };
    }

    /**
     * Handle mouse up events
     */
    handleMouseUp(event) {
        if (!this.isEnabled) return;

        if (event.button === 0) {
            this.state.isDragging = false;
            this.canvas.style.cursor = 'grab';
        } else if (event.button === 2) {
            this.state.isRightDragging = false;
        }

        // Reset drag state
        if (!this.state.isDragging && !this.state.isRightDragging) {
            this.state.hasDragged = false;
        }
    }

    /**
     * Handle mouse wheel events (zoom)
     */
    handleWheel(event) {
        if (!this.isEnabled || !this.mapRenderer) return;

        event.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Get world position of mouse before zoom
        const worldPosBeforeZoom = this.mapRenderer.screenToWorld(mouseX, mouseY);

        // Apply zoom
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        this.mapRenderer.camera.targetZoom *= zoomFactor;
        this.mapRenderer.camera.targetZoom = Math.max(
            GameConfig.MAP.MIN_ZOOM, 
            Math.min(GameConfig.MAP.MAX_ZOOM, this.mapRenderer.camera.targetZoom)
        );

        // Adjust camera position to zoom towards mouse
        const worldPosAfterZoom = this.mapRenderer.screenToWorld(mouseX, mouseY);
        this.mapRenderer.camera.x += worldPosBeforeZoom.x - worldPosAfterZoom.x;
        this.mapRenderer.camera.y += worldPosBeforeZoom.y - worldPosAfterZoom.y;
    }

    /**
     * Handle context menu (right-click)
     */
    handleContextMenu(event) {
        event.preventDefault();

        if (this.state.hasDragged) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const territory = this.mapRenderer.getTerritoryAtScreen(x, y);
        if (territory) {
            this.showContextMenu(territory, event.clientX, event.clientY);
        }
    }

    /**
     * Handle double-click events
     */
    handleDoubleClick(event) {
        if (!this.isEnabled || !this.mapRenderer) return;

        event.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const territory = this.mapRenderer.getTerritoryAtScreen(x, y);
        if (territory) {
            // Center on territory and zoom in
            this.mapRenderer.centerOnTerritory(territory.id);
            this.mapRenderer.camera.targetZoom = Math.min(
                this.mapRenderer.camera.targetZoom * 1.5,
                GameConfig.MAP.MAX_ZOOM
            );
        } else {
            // Zoom out if double-clicking on empty space
            this.mapRenderer.camera.targetZoom = Math.max(
                this.mapRenderer.camera.targetZoom * 0.7,
                GameConfig.MAP.MIN_ZOOM
            );
        }
    }

    /**
     * Handle mouse enter
     */
    handleMouseEnter(event) {
        this.canvas.style.cursor = 'grab';
    }

    /**
     * Handle mouse leave
     */
    handleMouseLeave(event) {
        this.canvas.style.cursor = 'default';
        
        // Clear hover state
        if (this.mapRenderer) {
            this.mapRenderer.setHoveredTerritory(null);
        }
    }

    /**
     * Handle touch start
     */
    handleTouchStart(event) {
        if (!this.isEnabled || !this.mapRenderer) return;

        event.preventDefault();

        const touches = event.touches;
        
        if (touches.length === 1) {
            // Single touch - treat as mouse down
            const touch = touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.touch.isActive = true;
            this.touch.lastTouchPos = { x, y };
            this.state.dragStart = { x, y };

            // Check for territory
            const territory = this.mapRenderer.getTerritoryAtScreen(x, y);
            if (territory) {
                this.handleTerritoryClick(territory, event);
            }
        } else if (touches.length === 2) {
            // Two finger touch - prepare for pinch zoom
            const touch1 = touches[0];
            const touch2 = touches[1];
            
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) + 
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );

            this.touch.startDistance = distance;
            this.touch.initialZoom = this.mapRenderer.camera.zoom;
        }
    }

    /**
     * Handle touch move
     */
    handleTouchMove(event) {
        if (!this.isEnabled || !this.mapRenderer || !this.touch.isActive) return;

        event.preventDefault();

        const touches = event.touches;

        if (touches.length === 1) {
            // Single touch - pan
            const touch = touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            const deltaX = x - this.touch.lastTouchPos.x;
            const deltaY = y - this.touch.lastTouchPos.y;

            this.mapRenderer.camera.x -= deltaX / this.mapRenderer.camera.zoom;
            this.mapRenderer.camera.y -= deltaY / this.mapRenderer.camera.zoom;

            this.touch.lastTouchPos = { x, y };
        } else if (touches.length === 2) {
            // Two finger touch - pinch zoom
            const touch1 = touches[0];
            const touch2 = touches[1];
            
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) + 
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );

            const scale = distance / this.touch.startDistance;
            this.mapRenderer.camera.targetZoom = this.touch.initialZoom * scale;
            this.mapRenderer.camera.targetZoom = Math.max(
                GameConfig.MAP.MIN_ZOOM, 
                Math.min(GameConfig.MAP.MAX_ZOOM, this.mapRenderer.camera.targetZoom)
            );
        }
    }

    /**
     * Handle touch end
     */
    handleTouchEnd(event) {
        if (!this.isEnabled) return;

        event.preventDefault();

        if (event.touches.length === 0) {
            this.touch.isActive = false;
        }
    }

    /**
     * Handle keyboard input
     */
    handleKeyDown(event) {
        if (!this.isEnabled || !this.mapRenderer) return;

        const panSpeed = 50 / this.mapRenderer.camera.zoom;
        
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                event.preventDefault();
                this.mapRenderer.camera.y -= panSpeed;
                break;
            case 'ArrowDown':
            case 'KeyS':
                event.preventDefault();
                this.mapRenderer.camera.y += panSpeed;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                event.preventDefault();
                this.mapRenderer.camera.x -= panSpeed;
                break;
            case 'ArrowRight':
            case 'KeyD':
                event.preventDefault();
                this.mapRenderer.camera.x += panSpeed;
                break;
            case 'Equal':
            case 'NumpadAdd':
                event.preventDefault();
                this.mapRenderer.zoomIn();
                break;
            case 'Minus':
            case 'NumpadSubtract':
                event.preventDefault();
                this.mapRenderer.zoomOut();
                break;
            case 'KeyC':
                event.preventDefault();
                this.mapRenderer.centerMap();
                break;
            case 'Escape':
                this.hideContextMenu();
                this.mapRenderer.setSelectedTerritory(null);
                break;
        }
    }

    /**
     * Handle keyboard up
     */
    handleKeyUp(event) {
        // Handle key releases if needed
    }

    /**
     * Handle territory click
     */
    handleTerritoryClick(territory, event) {
        if (this.state.hasDragged) return;

        // Check for double-click
        const currentTime = Date.now();
        const isDoubleClick = (currentTime - this.lastClickTime) < this.doubleClickDelay;
        this.lastClickTime = currentTime;

        if (isDoubleClick) {
            // Double-click: center and zoom
            this.mapRenderer.centerOnTerritory(territory.id);
            this.mapRenderer.camera.targetZoom = Math.min(
                this.mapRenderer.camera.targetZoom * 1.5,
                GameConfig.MAP.MAX_ZOOM
            );
        } else {
            // Single click: select territory
            this.mapRenderer.setSelectedTerritory(territory);
            
            // Emit territory selection event
            EventBus.emit(GameEvents.TERRITORY_SELECTED, {
                territory: territory,
                mouseEvent: event
            });
        }

        // Show territory info
        this.showTerritoryInfo(territory);
    }

    /**
     * Handle territory hover
     */
    handleTerritoryHover(territory) {
        this.mapRenderer.setHoveredTerritory(territory);
        
        if (territory) {
            // Show tooltip
            this.showTerritoryTooltip(territory);
        } else {
            this.hideTooltip();
        }
    }

    /**
     * Show context menu for territory
     */
    showContextMenu(territory, x, y) {
        this.hideContextMenu();
        
        this.contextMenu.isVisible = true;
        this.contextMenu.territory = territory;
        this.contextMenu.position = { x, y };

        // Create context menu element
        const menu = document.createElement('div');
        menu.id = 'territory-context-menu';
        menu.className = 'context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 5px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            z-index: 1000;
            min-width: 150px;
        `;

        // Add menu items
        const menuItems = this.getContextMenuItems(territory);
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.textContent = item.text;
            menuItem.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
            `;
            menuItem.addEventListener('click', () => {
                item.action(territory);
                this.hideContextMenu();
            });
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.backgroundColor = '#f0f0f0';
            });
            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.backgroundColor = 'white';
            });
            menu.appendChild(menuItem);
        });

        document.body.appendChild(menu);

        // Hide menu when clicking elsewhere
        const hideMenu = (event) => {
            if (!menu.contains(event.target)) {
                this.hideContextMenu();
                document.removeEventListener('click', hideMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', hideMenu), 0);
    }

    /**
     * Get context menu items for territory
     */
    getContextMenuItems(territory) {
        const items = [];

        if (!territory.owner) {
            items.push({
                text: 'Claim Territory',
                action: (territory) => this.claimTerritory(territory)
            });
        } else if (territory.owner === 'player') { // Placeholder for player check
            items.push({
                text: 'Build Infrastructure',
                action: (territory) => this.showBuildMenu(territory)
            });
            items.push({
                text: 'Deploy Forces',
                action: (territory) => this.deployForces(territory)
            });
        }

        items.push({
            text: 'View Details',
            action: (territory) => this.showTerritoryDetails(territory)
        });

        items.push({
            text: 'Center on Territory',
            action: (territory) => this.mapRenderer.centerOnTerritory(territory.id)
        });

        return items;
    }

    /**
     * Hide context menu
     */
    hideContextMenu() {
        const menu = document.getElementById('territory-context-menu');
        if (menu) {
            menu.remove();
        }
        this.contextMenu.isVisible = false;
        this.contextMenu.territory = null;
    }

    /**
     * Show territory tooltip
     */
    showTerritoryTooltip(territory) {
        // Remove existing tooltip
        this.hideTooltip();

        const tooltip = document.createElement('div');
        tooltip.id = 'territory-tooltip';
        tooltip.className = 'territory-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px;
            border-radius: 5px;
            pointer-events: none;
            z-index: 1000;
            max-width: 200px;
            font-size: 12px;
        `;

        tooltip.innerHTML = `
            <strong>${territory.name}</strong><br>
            Population: ${territory.population.toLocaleString()}<br>
            Owner: ${territory.owner || 'Unclaimed'}<br>
            ${territory.resources && Object.keys(territory.resources).length > 0 ? 
                'Resources: ' + Object.keys(territory.resources).join(', ') : 
                'No special resources'}
        `;

        document.body.appendChild(tooltip);

        // Position tooltip near mouse
        const updateTooltipPosition = (event) => {
            tooltip.style.left = (event.clientX + 10) + 'px';
            tooltip.style.top = (event.clientY - 10) + 'px';
        };

        this.canvas.addEventListener('mousemove', updateTooltipPosition);
        tooltip.updatePosition = updateTooltipPosition;
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        const tooltip = document.getElementById('territory-tooltip');
        if (tooltip) {
            if (tooltip.updatePosition) {
                this.canvas.removeEventListener('mousemove', tooltip.updatePosition);
            }
            tooltip.remove();
        }
    }

    /**
     * Show territory information panel
     */
    showTerritoryInfo(territory) {
        EventBus.emit('show_territory_info', territory);
    }

    /**
     * Show territory details modal
     */
    showTerritoryDetails(territory) {
        EventBus.emit('show_territory_details', territory);
    }

    /**
     * Claim territory action
     */
    claimTerritory(territory) {
        EventBus.emit('claim_territory', territory);
    }

    /**
     * Show build menu for territory
     */
    showBuildMenu(territory) {
        EventBus.emit('show_build_menu', territory);
    }

    /**
     * Deploy forces to territory
     */
    deployForces(territory) {
        EventBus.emit('deploy_forces', territory);
    }

    /**
     * Enable interactions
     */
    enable() {
        this.isEnabled = true;
    }

    /**
     * Disable interactions
     */
    disable() {
        this.isEnabled = false;
        this.hideContextMenu();
        this.hideTooltip();
    }

    /**
     * Get interaction state for saving
     */
    getState() {
        return {
            isEnabled: this.isEnabled,
            selectedTerritoryId: this.mapRenderer?.interaction.selectedTerritory?.id || null
        };
    }

    /**
     * Set interaction state from save
     */
    setState(state) {
        this.isEnabled = state.isEnabled !== undefined ? state.isEnabled : true;
        
        if (state.selectedTerritoryId && this.mapRenderer) {
            const territory = WorldMap.getTerritory(state.selectedTerritoryId);
            this.mapRenderer.setSelectedTerritory(territory);
        }
    }

    /**
     * Destroy interaction handler and clean up
     */
    destroy() {
        this.isEnabled = false;
        this.hideContextMenu();
        this.hideTooltip();
        
        // Remove event listeners would go here if we stored references
        // For now they'll be cleaned up when the canvas is removed
        
        console.log('Map interaction destroyed');
    }
}

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MapInteraction };
}