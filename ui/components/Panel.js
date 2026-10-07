/**
 * Panel Component - Collapsible Information Panels
 * Dominion Wars - Nation Building Strategy Game
 */

class Panel {
    constructor(options = {}) {
        this.id = options.id || `panel-${Date.now()}`;
        this.title = options.title || 'Panel';
        this.content = options.content || '';
        this.collapsible = options.collapsible !== false;
        this.collapsed = options.collapsed || false;
        this.className = options.className || '';
        this.position = options.position || 'relative'; // 'relative', 'fixed', 'absolute'
        this.width = options.width || 'auto';
        this.height = options.height || 'auto';
        
        this.element = null;
        this.headerElement = null;
        this.bodyElement = null;
        this.isCollapsed = this.collapsed;
        
        this.onCollapse = options.onCollapse || null;
        this.onExpand = options.onExpand || null;
        this.onClose = options.onClose || null;
        
        this.create();
    }

    /**
     * Create panel DOM structure
     */
    create() {
        this.element = document.createElement('div');
        this.element.id = this.id;
        this.element.className = `panel ${this.className} ${this.isCollapsed ? 'panel-collapsed' : ''}`;
        this.element.style.position = this.position;
        this.element.style.width = this.width;
        if (this.height !== 'auto') {
            this.element.style.height = this.height;
        }
        
        this.element.innerHTML = `
            <div class="panel-header">
                <h5 class="panel-title">${this.title}</h5>
                <div class="panel-controls">
                    ${this.collapsible ? '<button type="button" class="panel-toggle" aria-label="Toggle Panel">−</button>' : ''}
                    <button type="button" class="panel-close" aria-label="Close Panel">×</button>
                </div>
            </div>
            <div class="panel-body" ${this.isCollapsed ? 'style="display: none;"' : ''}>
                ${this.content}
            </div>
        `;
        
        this.headerElement = this.element.querySelector('.panel-header');
        this.bodyElement = this.element.querySelector('.panel-body');
        
        this.bindEvents();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        if (!this.element) return;
        
        // Toggle collapse
        const toggleBtn = this.element.querySelector('.panel-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }
        
        // Close panel
        const closeBtn = this.element.querySelector('.panel-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }
        
        // Double-click header to toggle (if collapsible)
        if (this.collapsible && this.headerElement) {
            this.headerElement.addEventListener('dblclick', () => {
                this.toggle();
            });
        }
        
        // Make panel draggable if position is fixed or absolute
        if (this.position === 'fixed' || this.position === 'absolute') {
            this.makeDraggable();
        }
    }

    /**
     * Make panel draggable
     */
    makeDraggable() {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        this.headerElement.style.cursor = 'move';
        this.headerElement.classList.add('panel-draggable');
        
        this.headerElement.addEventListener('mousedown', (e) => {
            // Don't drag when clicking buttons
            if (e.target.matches('button')) return;
            
            isDragging = true;
            const rect = this.element.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            e.preventDefault();
            this.element.classList.add('panel-dragging');
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            
            // Keep panel within viewport
            const maxX = window.innerWidth - this.element.offsetWidth;
            const maxY = window.innerHeight - this.element.offsetHeight;
            
            this.element.style.left = Math.max(0, Math.min(maxX, newX)) + 'px';
            this.element.style.top = Math.max(0, Math.min(maxY, newY)) + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.element.classList.remove('panel-dragging');
            }
        });
    }

    /**
     * Toggle panel collapsed state
     */
    toggle() {
        if (this.isCollapsed) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    /**
     * Collapse the panel
     */
    collapse() {
        if (!this.collapsible || this.isCollapsed) return;
        
        this.isCollapsed = true;
        this.element.classList.add('panel-collapsed');
        this.bodyElement.style.display = 'none';
        
        // Update toggle button
        const toggleBtn = this.element.querySelector('.panel-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = '+';
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
        
        // Call callback
        if (this.onCollapse) {
            this.onCollapse(this);
        }
    }

    /**
     * Expand the panel
     */
    expand() {
        if (!this.collapsible || !this.isCollapsed) return;
        
        this.isCollapsed = false;
        this.element.classList.remove('panel-collapsed');
        this.bodyElement.style.display = 'block';
        
        // Update toggle button
        const toggleBtn = this.element.querySelector('.panel-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = '−';
            toggleBtn.setAttribute('aria-expanded', 'true');
        }
        
        // Call callback
        if (this.onExpand) {
            this.onExpand(this);
        }
    }

    /**
     * Show the panel
     */
    show() {
        this.element.style.display = 'block';
    }

    /**
     * Hide the panel
     */
    hide() {
        this.element.style.display = 'none';
    }

    /**
     * Close and remove the panel
     */
    close() {
        // Call callback
        if (this.onClose) {
            this.onClose(this);
        }
        
        this.destroy();
    }

    /**
     * Set panel title
     */
    setTitle(title) {
        this.title = title;
        const titleElement = this.element.querySelector('.panel-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    /**
     * Set panel content
     */
    setContent(content) {
        this.content = content;
        if (this.bodyElement) {
            this.bodyElement.innerHTML = content;
        }
    }

    /**
     * Append content to panel
     */
    appendContent(content) {
        if (this.bodyElement) {
            this.bodyElement.insertAdjacentHTML('beforeend', content);
        }
    }

    /**
     * Prepend content to panel
     */
    prependContent(content) {
        if (this.bodyElement) {
            this.bodyElement.insertAdjacentHTML('afterbegin', content);
        }
    }

    /**
     * Clear panel content
     */
    clearContent() {
        if (this.bodyElement) {
            this.bodyElement.innerHTML = '';
        }
    }

    /**
     * Get panel body element
     */
    getBody() {
        return this.bodyElement;
    }

    /**
     * Get panel header element
     */
    getHeader() {
        return this.headerElement;
    }

    /**
     * Set panel position
     */
    setPosition(x, y) {
        if (this.position === 'fixed' || this.position === 'absolute') {
            this.element.style.left = x + 'px';
            this.element.style.top = y + 'px';
        }
    }

    /**
     * Set panel size
     */
    setSize(width, height = null) {
        this.element.style.width = width;
        if (height) {
            this.element.style.height = height;
        }
    }

    /**
     * Add CSS class to panel
     */
    addClass(className) {
        this.element.classList.add(className);
    }

    /**
     * Remove CSS class from panel
     */
    removeClass(className) {
        this.element.classList.remove(className);
    }

    /**
     * Check if panel has CSS class
     */
    hasClass(className) {
        return this.element.classList.contains(className);
    }

    /**
     * Focus the panel
     */
    focus() {
        const focusable = this.element.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) {
            focusable.focus();
        } else {
            this.element.focus();
        }
    }

    /**
     * Bring panel to front
     */
    bringToFront() {
        const panels = document.querySelectorAll('.panel');
        let maxZIndex = 1000;
        
        panels.forEach(panel => {
            const zIndex = parseInt(window.getComputedStyle(panel).zIndex) || 0;
            maxZIndex = Math.max(maxZIndex, zIndex);
        });
        
        this.element.style.zIndex = maxZIndex + 1;
    }

    /**
     * Destroy the panel
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.headerElement = null;
        this.bodyElement = null;
    }

    /**
     * Static method to create territory info panel
     */
    static createTerritoryInfo(territory) {
        const resourceList = Object.keys(territory.resources).length > 0 
            ? Object.keys(territory.resources).join(', ')
            : 'None';
        
        const content = `
            <div class="territory-info">
                <div class="info-section">
                    <h6>Basic Information</h6>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Population:</label>
                            <span>${territory.population.toLocaleString()}</span>
                        </div>
                        <div class="info-item">
                            <label>Area:</label>
                            <span>${territory.area.toLocaleString()} km²</span>
                        </div>
                        <div class="info-item">
                            <label>Owner:</label>
                            <span>${territory.owner || 'Unclaimed'}</span>
                        </div>
                        <div class="info-item">
                            <label>Development:</label>
                            <span>Level ${territory.developmentLevel}</span>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h6>Geography</h6>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Climate:</label>
                            <span class="capitalize">${territory.climate}</span>
                        </div>
                        <div class="info-item">
                            <label>Fertility:</label>
                            <span>${Math.round(territory.fertility * 100)}%</span>
                        </div>
                        <div class="info-item">
                            <label>Elevation:</label>
                            <span>${Math.round(territory.elevation)}m</span>
                        </div>
                        <div class="info-item">
                            <label>Coastal:</label>
                            <span>${territory.coastal ? 'Yes' : 'No'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h6>Resources</h6>
                    <p>${resourceList}</p>
                </div>
                
                <div class="info-section">
                    <h6>Infrastructure</h6>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${territory.infrastructure}%"></div>
                        <span class="progress-text">${territory.infrastructure}/100</span>
                    </div>
                </div>
            </div>
        `;
        
        return new Panel({
            id: `territory-info-${territory.id}`,
            title: territory.name,
            content: content,
            position: 'fixed',
            width: '300px',
            className: 'territory-info-panel'
        });
    }

    /**
     * Static method to create nation stats panel
     */
    static createNationStats(nation) {
        const content = `
            <div class="nation-stats">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <div class="stat-value">${nation.population?.toLocaleString() || '0'}</div>
                        <div class="stat-label">Population</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <div class="stat-value">$${nation.gdp?.toLocaleString() || '0'}</div>
                        <div class="stat-label">GDP</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">⚔️</div>
                    <div class="stat-content">
                        <div class="stat-value">${nation.militaryStrength?.toLocaleString() || '0'}</div>
                        <div class="stat-label">Military</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">😊</div>
                    <div class="stat-content">
                        <div class="stat-value">${Math.round(nation.happiness || 50)}%</div>
                        <div class="stat-label">Happiness</div>
                    </div>
                </div>
            </div>
        `;
        
        return new Panel({
            id: 'nation-stats-panel',
            title: 'Nation Statistics',
            content: content,
            collapsible: true,
            width: '250px',
            className: 'stats-panel'
        });
    }
}

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Panel };
}