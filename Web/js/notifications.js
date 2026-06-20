/**
 * Notifications System - Empires Game
 *
 * Displays a bell icon with dropdown for war declarations, alliance invites, etc.
 */

const notifications = {
    unreadCount: 0,
    notifications: [],
    dropdownVisible: false,
    container: null,

    /**
     * Initialize the notifications system
     */
    async init() {
        this.container = document.getElementById('notification-container');
        if (!this.container) return;

        // Create bell icon and dropdown HTML
        this.renderBellIcon();
        this.renderDropdown();

        // Load initial notifications
        await this.loadNotifications();

        // Set up event listeners
        this.setupEventListeners();
    },

    /**
     * Render the bell icon
     */
    renderBellIcon() {
        const bell = document.createElement('button');
        bell.className = 'top-nav-btn notification-bell';
        bell.id = 'notification-bell';
        bell.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 16.42 4.87 20.17 8.84 21.04V16H9.96V12C9.96 10.9 10.86 10 11.96 10H12.04C13.14 10 14.04 10.9 14.04 12V16H15.16V21.04C19.13 20.17 22 16.42 22 12C22 6.48 17.52 2 12 2ZM10 17H14V18H10V17Z"/>
            </svg>
            <span class="notif-dot" id="notif-dot"></span>
        `;
        this.container.appendChild(bell);
    },

    /**
     * Render the dropdown menu
     */
    renderDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'notifications-dropdown';
        dropdown.id = 'notifications-dropdown';
        dropdown.innerHTML = `
            <div class="notifications-header">
                <h6>Notifications</h6>
                <span class="notifications-clear" id="notifications-clear">Clear</span>
            </div>
            <div class="notifications-list" id="notifications-list">
                <div class="notification-item" style="text-align:center; padding: 20px;">
                    <span class="text-muted">No notifications yet</span>
                </div>
            </div>
            <div class="notifications-footer">
                <button class="btn btn-sm btn-primary" id="notifications-mark-all">Mark All Read</button>
            </div>
        `;
        this.container.appendChild(dropdown);
    },

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        const bell = document.getElementById('notification-bell');
        const dropdown = document.getElementById('notifications-dropdown');
        const clearBtn = document.getElementById('notifications-clear');
        const markAllBtn = document.getElementById('notifications-mark-all');

        // Toggle dropdown on bell click
        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== bell) {
                this.closeDropdown();
            }
        });

        // Clear notifications
        clearBtn.addEventListener('click', () => {
            this.clearNotifications();
        });

        // Mark all as read
        markAllBtn.addEventListener('click', () => {
            this.markAllAsRead();
        });
    },

    /**
     * Toggle dropdown visibility
     */
    toggleDropdown() {
        this.dropdownVisible = !this.dropdownVisible;
        const dropdown = document.getElementById('notifications-dropdown');
        const bell = document.getElementById('notification-bell');

        if (this.dropdownVisible) {
            dropdown.classList.add('show');
            bell.classList.add('unread');
            this.markAllAsRead();
        } else {
            dropdown.classList.remove('show');
        }
    },

    /**
     * Close dropdown
     */
    closeDropdown() {
        this.dropdownVisible = false;
        const dropdown = document.getElementById('notifications-dropdown');
        dropdown.classList.remove('show');
    },

    /**
     * Load notifications from server - graceful fallback if endpoint missing
     */
    async loadNotifications() {
        try {
            const data = await api.get('/api/web/notifications');
            if (data && data.notifications) {
                this.notifications = data.notifications;
                this.unreadCount = data.unread_count || 0;
                this.renderNotifications();
                this.updateBadge();
            }
        } catch (err) {
            // Endpoint may not exist yet — silently ignore
            console.debug('Notifications not available:', err?.message);
        }
    },

    /**
     * Render notifications list
     */
    renderNotifications() {
        const list = document.getElementById('notifications-list');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = `
                <div class="notification-item" style="text-align:center; padding: 20px;">
                    <span class="text-muted">No notifications yet</span>
                </div>
            `;
            return;
        }

        list.innerHTML = this.notifications.map((notif, index) => `
            <div class="notification-item ${notif.read ? 'read' : ''}" data-id="${notif.id}">
                <div class="notification-item-icon ${this.getIconClass(notif.type)}">
                    ${this.getIcon(notif.type)}
                </div>
                <div class="notification-item-content">
                    <div class="notification-item-title">${esc(notif.title)}</div>
                    <div class="notification-item-message">${esc(notif.message)}</div>
                    <div class="notification-item-time">${this.getTimeAgo(notif.created_at)}</div>
                </div>
                ${!notif.read ? '<div class="notification-item-unread"></div>' : ''}
            </div>
        `).join('');

        // Add click handlers for each notification
        list.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                this.markAsRead(item.dataset.id);
            });
        });
    },

    /**
     * Get icon class based on notification type
     */
    getIconClass(type) {
        const classes = {
            war: 'danger',
            alliance: 'purple',
            trade: 'info',
            diplomacy: 'purple',
            spy: 'info',
            system: 'success'
        };
        return classes[type] || 'info';
    },

    /**
     * Get icon HTML based on notification type
     */
    getIcon(type) {
        const icons = {
            war: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>',
            alliance: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
            trade: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 7h-2V6c0-2.76-2.24-5-5-5H5c-2.76 0-5 2.24-5 5v12c0 2.76 2.24 5 5 5h12c2.76 0 5-2.24 5-5v-1h2c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM5 6h12v10H5V6zm14 13H5V9h12v10z"/></svg>',
            diplomacy: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
            spy: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4C8.13 4 5 7.13 5 11c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-1.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm0 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>',
            system: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
        };
        return icons[type] || icons.system;
    },

    /**
     * Get time ago string
     */
    getTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    },

    /**
     * Mark notification as read
     */
    async markAsRead(id) {
        try {
            await api.post('/api/web/notifications/mark-read', { id });
            this.notifications = this.notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
            );
            this.renderNotifications();
            this.updateBadge();
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            await api.post('/api/web/notifications/mark-all-read');
            this.notifications = this.notifications.map(n => ({ ...n, read: true }));
            this.unreadCount = 0;
            this.renderNotifications();
            this.updateBadge();
            this.closeDropdown();
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    },

    /**
     * Clear all notifications
     */
    async clearNotifications() {
        try {
            await api.post('/api/web/notifications/clear');
            this.notifications = [];
            this.unreadCount = 0;
            this.renderNotifications();
            this.updateBadge();
        } catch (err) {
            console.error('Failed to clear notifications:', err);
        }
    },

    /**
     * Add a new notification
     */
    addNotification(title, message, type = 'system') {
        const notif = {
            id: Date.now().toString(),
            title,
            message,
            type,
            read: false,
            created_at: new Date().toISOString()
        };
        this.notifications.unshift(notif);
        this.unreadCount++;
        this.renderNotifications();
        this.updateBadge();
    },

    /**
     * Update notification badge
     */
    updateBadge() {
        const badge = document.getElementById('notif-dot');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    notifications.init();
});
