/**
 * Activity Feed UI - Empires Game
 *
 * Displays recent events, wars, trades, and nation activity.
 */

const activityFeed = {
    events: [],
    myEvents: [],
    currentFilter: 'all',
    currentRange: '24h',

    /**
     * Initialize activity feed UI
     */
    async init() {
        await this.loadData();
        this.render();
    },

    /**
     * Load activity data from API
     */
    async loadData() {
        try {
            const [eventsData, myEventsData] = await Promise.all([
                api.get('/api/web/events'),
                api.get('/api/web/user/events')
            ]);

            this.events = eventsData || [];
            this.myEvents = myEventsData || [];

        } catch (err) {
            console.error('Failed to load activity data:', err);
            this.events = [];
            this.myEvents = [];
        }
    },

    /**
     * Render activity feed UI
     */
    render() {
        this.renderHighlights();
        this.renderActivityList();
        this.renderMyActivity();
        this.updateCount();
    },

    /**
     * Render today's highlights
     */
    renderHighlights() {
        const container = document.getElementById('highlights-panel');
        if (!container) return;

        const highImportance = this.events.filter(e => e.importance === 'high').slice(0, 5);

        if (highImportance.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <span style="font-size: 2rem;">✨</span>
                    <p class="text-muted">No major events today. The world is peaceful.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="row g-3">
                ${highImportance.map(e => `
                    <div class="col-md-4 col-lg">
                        <div class="highlight-card">
                            <div class="highlight-icon">${e.icon}</div>
                            <div class="highlight-title">${esc(e.title)}</div>
                            <div class="highlight-desc small text-secondary">${esc(e.description)}</div>
                            <div class="highlight-time text-muted small">${this.getTimeAgo(e.created_at)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Render activity list
     */
    renderActivityList() {
        const container = document.getElementById('activity-list');
        if (!container) return;

        let filtered = this.events;

        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(e => e.category === this.currentFilter);
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <span style="font-size: 3rem;">📰</span>
                    <h5 class="mt-3">No Events</h5>
                    <p class="text-muted">No ${this.currentFilter} events in the selected time range.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.slice(0, 50).map(e => this.renderActivityItem(e)).join('');
    },

    /**
     * Render single activity item
     */
    renderActivityItem(event) {
        const date = new Date(event.created_at);
        const isHighImportance = event.importance === 'high';

        return `
            <div class="activity-item ${isHighImportance ? 'high-importance' : ''}">
                <div class="activity-item-icon ${event.category}">${event.icon}</div>
                <div class="activity-item-content">
                    <div class="activity-item-title">
                        ${isHighImportance ? '🔴 ' : ''}${esc(event.title)}
                    </div>
                    <div class="activity-item-desc">${esc(event.description)}</div>
                    <div class="activity-item-meta">
                        <a href="/nation/${event.nation_id}" class="activity-nation-link">
                            ${esc(event.nation_name)}
                        </a>
                        <span class="activity-item-time">${this.getTimeAgo(event.created_at)}</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render my nation's activity
     */
    renderMyActivity() {
        const container = document.getElementById('my-activity');
        if (!container) return;

        if (this.myEvents.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <span style="font-size: 3rem;">🏛️</span>
                    <p class="text-muted">Your nation hasn't taken any significant actions yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-sm">
                    <thead>
                        <tr>
                            <th>Event</th>
                            <th>Description</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.myEvents.slice(0, 20).map(e => `
                            <tr>
                                <td>${e.icon} ${esc(e.title)}</td>
                                <td class="text-secondary">${esc(e.description)}</td>
                                <td class="text-muted">${this.getTimeAgo(e.created_at)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Switch event filter
     */
    switchFilter(filter) {
        this.currentFilter = filter;

        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.renderActivityList();
        this.updateCount();
    },

    /**
     * Switch time range
     */
    switchRange(range) {
        this.currentRange = range;

        document.querySelectorAll('[data-range]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.range === range);
        });

        // Reload events based on range
        this.loadData();
        this.render();
    },

    /**
     * Update event count
     */
    updateCount() {
        const count = this.currentFilter === 'all'
            ? this.events.length
            : this.events.filter(e => e.category === this.currentFilter).length;

        document.getElementById('events-count').textContent = `${count} events`;
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
    }
};

// Helper functions
function fmtNum(n) {
    if (!n && n !== 0) return '-';
    return Number(n).toLocaleString();
}

function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

// Add activity feed styles
const style = document.createElement('style');
style.textContent = `
    .highlight-card {
        background: var(--bg-input);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        padding: 16px;
        text-align: center;
        transition: all 0.15s;
    }
    .highlight-card:hover {
        border-color: var(--accent-primary);
        transform: translateY(-2px);
    }
    .highlight-icon {
        font-size: 2rem;
        margin-bottom: 8px;
    }
    .highlight-title {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
    }
    .highlight-time {
        margin-top: 8px;
    }
    .activity-item.high-importance {
        background: rgba(251,191,36,0.05);
        border-left: 3px solid var(--accent-primary);
    }
    .activity-item-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 6px;
    }
    .activity-nation-link {
        font-size: 0.75rem;
        color: var(--accent-info);
    }
    .activity-nation-link:hover {
        color: var(--accent-secondary);
    }
    .activity-item-icon.war { background: rgba(239,68,68,0.15); color: var(--accent-danger); }
    .activity-item-icon.economy { background: rgba(251,191,36,0.15); color: var(--accent-primary); }
    .activity-item-icon.diplomacy { background: rgba(167,139,250,0.15); color: var(--accent-purple); }
`;
document.head.appendChild(style);