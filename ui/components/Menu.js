/**
 * Menu Component - Navigation and Context Menus
 * Dominion Wars - Nation Building Strategy Game
 */

class Menu {
    constructor(options = {}) {
        this.id = options.id || `menu-${Date.now()}`;
        this.items = options.items || [];
        this.type = options.type || 'dropdown'; // 'dropdown', 'context', 'sidebar', 'tab'
        this.trigger = options.trigger || null; // Element that triggers the menu
        this.position = options.position || 'bottom-left';
        this.className = options.className || '';
        this.autoClose = options.autoClose !== false;
        
        this.element = null;
        this.isVisible = false;
        this.activeItem = null;
        
        this.onShow = options.onShow || null;
        this.onHide = options.onHide || null;
        this.onItemClick = options.onItemClick || null;
        
        this.create();
        this.bindEvents();
    }

    /**
     * Create menu DOM structure
     */
    create() {
        this.element = document.createElement('div');
        this.element.id = this.id;
        this.element.className = `menu menu-${this.type} ${this.className}`;
        this.element.style.display = 'none';
        
        if (this.type === 'context') {
            this.element.style.position = 'fixed';
            this.element.style.zIndex = '2000';
        }
        
        this.renderItems();
        
        // Add to document
        const container = this.type === 'context' ? document.body : 
                         (document.getElementById('menu-container') || document.body);
        container.appendChild(this.element);
    }

    /**
     * Render menu items
     */
    renderItems() {
        if (this.type === 'tab') {
            this.renderTabMenu();
        } else {
            this.renderListMenu();
        }
    }

    /**
     * Render list-style menu
     */
    renderListMenu() {
        const ul = document.createElement('ul');
        ul.className = 'menu-list';
        
        this.items.forEach((item, index) => {
            const li = this.createMenuItem(item, index);
            ul.appendChild(li);
        });
        
        this.element.appendChild(ul);
    }

    /**
     * Render tab-style menu
     */
    renderTabMenu() {
        const tabNav = document.createElement('div');
        tabNav.className = 'tab-nav';
        
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        
        this.items.forEach((item, index) => {
            // Tab button
            const tabBtn = document.createElement('button');
            tabBtn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
            tabBtn.textContent = item.text;
            tabBtn.setAttribute('data-index', index);
            
            if (item.icon) {
                tabBtn.innerHTML = `<span class="tab-icon">${item.icon}</span> ${item.text}`;
            }
            
            tabNav.appendChild(tabBtn);
            
            // Tab pane
            const tabPane = document.createElement('div');
            tabPane.className = `tab-pane ${index === 0 ? 'active' : ''}`;
            tabPane.innerHTML = item.content || '';
            tabPane.setAttribute('data-index', index);
            
            tabContent.appendChild(tabPane);
        });
        
        this.element.appendChild(tabNav);
        this.element.appendChild(tabContent);
    }

    /**
     * Create individual menu item
     */
    createMenuItem(item, index) {
        const li = document.createElement('li');
        li.className = 'menu-item';
        li.setAttribute('data-index', index);
        
        if (item.disabled) {
            li.classList.add('disabled');
        }
        
        if (item.separator) {
            li.classList.add('separator');
            return li;
        }
        
        const link = document.createElement('a');
        link.className = 'menu-link';
        link.href = item.href || '#';
        
        let linkContent = '';
        
        if (item.icon) {
            linkContent += `<span class="menu-icon">${item.icon}</span>`;
        }
        
        linkContent += `<span class="menu-text">${item.text}</span>`;
        
        if (item.shortcut) {
            linkContent += `<span class="menu-shortcut">${item.shortcut}</span>`;
        }
        
        if (item.badge) {
            linkContent += `<span class="menu-badge">${item.badge}</span>`;
        }
        
        if (item.submenu) {
            linkContent += '<span class="menu-arrow">›</span>';
            li.classList.add('has-submenu');
        }
        
        link.innerHTML = linkContent;
        li.appendChild(link);
        
        // Create submenu if exists
        if (item.submenu) {
            const submenu = new Menu({
                items: item.submenu,
                type: 'dropdown',
                className: 'submenu',
                autoClose: this.autoClose
            });
            
            submenu.element.classList.add('submenu-hidden');
            li.appendChild(submenu.element);
        }
        
        return li;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        if (this.trigger) {
            if (typeof this.trigger === 'string') {
                this.trigger = document.querySelector(this.trigger);
            }
            
            if (this.trigger) {
                this.trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggle();
                });
            }
        }
        
        // Menu item clicks
        this.element.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            const tabBtn = e.target.closest('.tab-btn');
            
            if (tabBtn) {
                this.handleTabClick(tabBtn);
            } else if (menuItem) {
                this.handleItemClick(menuItem, e);
            }
        });
        
        // Submenu hover
        if (this.type === 'dropdown') {
            this.element.addEventListener('mouseenter', (e) => {
                const menuItem = e.target.closest('.menu-item.has-submenu');
                if (menuItem) {
                    this.showSubmenu(menuItem);
                }
            });
            
            this.element.addEventListener('mouseleave', (e) => {
                const menuItem = e.target.closest('.menu-item.has-submenu');
                if (menuItem) {
                    this.hideSubmenu(menuItem);
                }
            });
        }
        
        // Auto-close on outside click
        if (this.autoClose) {
            document.addEventListener('click', (e) => {
                if (!this.element.contains(e.target) && 
                    (!this.trigger || !this.trigger.contains(e.target))) {
                    this.hide();
                }
            });
        }
        
        // Keyboard navigation
        this.element.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
    }

    /**
     * Handle tab button click
     */
    handleTabClick(tabBtn) {
        const index = parseInt(tabBtn.getAttribute('data-index'));
        this.activateTab(index);
    }

    /**
     * Activate tab by index
     */
    activateTab(index) {
        // Update tab buttons
        const tabBtns = this.element.querySelectorAll('.tab-btn');
        tabBtns.forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
        });
        
        // Update tab panes
        const tabPanes = this.element.querySelectorAll('.tab-pane');
        tabPanes.forEach((pane, i) => {
            pane.classList.toggle('active', i === index);
        });
        
        // Call item click handler
        if (this.onItemClick) {
            this.onItemClick(this.items[index], index, this);
        }
    }

    /**
     * Handle menu item click
     */
    handleItemClick(menuItem, event) {
        if (menuItem.classList.contains('disabled') || 
            menuItem.classList.contains('separator')) {
            return;
        }
        
        const index = parseInt(menuItem.getAttribute('data-index'));
        const item = this.items[index];
        
        if (!item) return;
        
        // Prevent default if no href
        const link = menuItem.querySelector('.menu-link');
        if (!link.href || link.href === '#') {
            event.preventDefault();
        }
        
        // Execute action
        if (item.action) {
            item.action(item, index, this);
        }
        
        // Call click handler
        if (this.onItemClick) {
            this.onItemClick(item, index, this);
        }
        
        // Auto-close if enabled and not a submenu
        if (this.autoClose && !item.submenu) {
            this.hide();
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyDown(event) {
        const items = this.element.querySelectorAll('.menu-item:not(.disabled):not(.separator)');
        const currentIndex = Array.from(items).indexOf(this.activeItem);
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.focusItem(items[(currentIndex + 1) % items.length]);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.focusItem(items[(currentIndex - 1 + items.length) % items.length]);
                break;
            case 'Enter':
            case ' ':
                if (this.activeItem) {
                    event.preventDefault();
                    this.handleItemClick(this.activeItem, event);
                }
                break;
            case 'Escape':
                this.hide();
                break;
        }
    }

    /**
     * Focus menu item
     */
    focusItem(item) {
        if (this.activeItem) {
            this.activeItem.classList.remove('focused');
        }
        
        this.activeItem = item;
        
        if (item) {
            item.classList.add('focused');
            item.scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * Show submenu
     */
    showSubmenu(menuItem) {
        const submenu = menuItem.querySelector('.submenu');
        if (submenu) {
            submenu.classList.remove('submenu-hidden');
            submenu.classList.add('submenu-visible');
        }
    }

    /**
     * Hide submenu
     */
    hideSubmenu(menuItem) {
        const submenu = menuItem.querySelector('.submenu');
        if (submenu) {
            submenu.classList.add('submenu-hidden');
            submenu.classList.remove('submenu-visible');
        }
    }

    /**
     * Show menu
     */
    show() {
        if (this.isVisible) return;
        
        this.element.style.display = 'block';
        this.isVisible = true;
        
        // Position context menu
        if (this.type === 'context') {
            this.positionContextMenu();
        }
        
        // Focus first item
        const firstItem = this.element.querySelector('.menu-item:not(.disabled):not(.separator)');
        if (firstItem) {
            this.focusItem(firstItem);
        }
        
        // Call show callback
        if (this.onShow) {
            this.onShow(this);
        }
    }

    /**
     * Hide menu
     */
    hide() {
        if (!this.isVisible) return;
        
        this.element.style.display = 'none';
        this.isVisible = false;
        this.activeItem = null;
        
        // Call hide callback
        if (this.onHide) {
            this.onHide(this);
        }
    }

    /**
     * Toggle menu visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Position context menu at coordinates
     */
    showAt(x, y) {
        this.element.style.left = x + 'px';
        this.element.style.top = y + 'px';
        this.show();
    }

    /**
     * Position context menu
     */
    positionContextMenu() {
        const rect = this.element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Adjust if menu goes off-screen
        let left = parseInt(this.element.style.left);
        let top = parseInt(this.element.style.top);
        
        if (left + rect.width > viewportWidth) {
            left = viewportWidth - rect.width - 10;
        }
        
        if (top + rect.height > viewportHeight) {
            top = viewportHeight - rect.height - 10;
        }
        
        this.element.style.left = Math.max(10, left) + 'px';
        this.element.style.top = Math.max(10, top) + 'px';
    }

    /**
     * Add menu item
     */
    addItem(item, index = -1) {
        if (index === -1) {
            this.items.push(item);
        } else {
            this.items.splice(index, 0, item);
        }
        
        this.element.innerHTML = '';
        this.renderItems();
    }

    /**
     * Remove menu item
     */
    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
            this.element.innerHTML = '';
            this.renderItems();
        }
    }

    /**
     * Update menu item
     */
    updateItem(index, newItem) {
        if (index >= 0 && index < this.items.length) {
            this.items[index] = { ...this.items[index], ...newItem };
            this.element.innerHTML = '';
            this.renderItems();
        }
    }

    /**
     * Enable menu item
     */
    enableItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items[index].disabled = false;
            const item = this.element.querySelector(`[data-index="${index}"]`);
            if (item) {
                item.classList.remove('disabled');
            }
        }
    }

    /**
     * Disable menu item
     */
    disableItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items[index].disabled = true;
            const item = this.element.querySelector(`[data-index="${index}"]`);
            if (item) {
                item.classList.add('disabled');
            }
        }
    }

    /**
     * Destroy menu
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.isVisible = false;
        this.activeItem = null;
    }

    /**
     * Static method to create main navigation menu
     */
    static createMainMenu(container) {
        const menuItems = [
            {
                text: 'Nation',
                icon: '🏛️',
                submenu: [
                    { text: 'Overview', action: () => EventBus.emit('show_nation_overview') },
                    { text: 'Policies', action: () => EventBus.emit('show_nation_policies') },
                    { text: 'Government', action: () => EventBus.emit('show_government_panel') },
                    { separator: true },
                    { text: 'Statistics', action: () => EventBus.emit('show_nation_stats') }
                ]
            },
            {
                text: 'Military',
                icon: '⚔️',
                submenu: [
                    { text: 'Forces', action: () => EventBus.emit('show_military_forces') },
                    { text: 'Recruitment', action: () => EventBus.emit('show_recruitment_panel') },
                    { text: 'Deployment', action: () => EventBus.emit('show_deployment_panel') },
                    { separator: true },
                    { text: 'War Plans', action: () => EventBus.emit('show_war_plans') }
                ]
            },
            {
                text: 'Economy',
                icon: '💰',
                submenu: [
                    { text: 'Budget', action: () => EventBus.emit('show_budget_panel') },
                    { text: 'Trade', action: () => EventBus.emit('show_trade_panel') },
                    { text: 'Resources', action: () => EventBus.emit('show_resource_panel') },
                    { separator: true },
                    { text: 'Markets', action: () => EventBus.emit('show_market_panel') }
                ]
            },
            {
                text: 'Diplomacy',
                icon: '🤝',
                submenu: [
                    { text: 'Relations', action: () => EventBus.emit('show_diplomacy_relations') },
                    { text: 'Alliances', action: () => EventBus.emit('show_alliance_panel') },
                    { text: 'Treaties', action: () => EventBus.emit('show_treaty_panel') },
                    { separator: true },
                    { text: 'Espionage', action: () => EventBus.emit('show_espionage_panel') }
                ]
            },
            {
                text: 'Research',
                icon: '🧬',
                submenu: [
                    { text: 'Technology Tree', action: () => EventBus.emit('show_tech_tree') },
                    { text: 'Projects', action: () => EventBus.emit('show_research_projects') },
                    { text: 'Scientists', action: () => EventBus.emit('show_research_staff') }
                ]
            }
        ];
        
        return new Menu({
            id: 'main-menu',
            items: menuItems,
            type: 'dropdown',
            className: 'main-navigation'
        });
    }

    /**
     * Static method to create context menu
     */
    static createContextMenu(items) {
        return new Menu({
            items: items,
            type: 'context',
            autoClose: true
        });
    }
}

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Menu };
}