/**
 * Rankings / Leaderboard UI - Empires Game
 *
 * Displays top nations by score, military, economy, etc.
 */

const rankings = {
    nations: [],
    userRank: null,
    currentCategory: 'score',

    /**
     * Initialize rankings UI
     */
    async init() {
        await this.loadData();
        this.render();
    },

    /**
     * Load rankings data from API
     */
    async loadData() {
        try {
            const [nationsData, userData] = await Promise.all([
                api.get('/api/web/nations'),
                api.get('/api/web/user/nation')
            ]);

            this.nations = nationsData || [];
            this.userNationId = userData?.nation?.nation_id;
            this.userRank = this.calculateUserRank();

        } catch (err) {
            console.error('Failed to load rankings:', err);
            this.nations = [];
        }
    },

    /**
     * Calculate user's rank
     */
    calculateUserRank() {
        if (!this.userNationId || !this.nations.length) return null;

        const sorted = this.getSortedNations();
        const index = sorted.findIndex(n => n.nation_id === this.userNationId);
        return index >= 0 ? index + 1 : null;
    },

    /**
     * Get sorted nations based on category
     */
    getSortedNations() {
        const sorted = [...this.nations];

        switch (this.currentCategory) {
            case 'military':
                return sorted.sort((a, b) => (b.soldiers || b.military_score || 0) - (a.soldiers || a.military_score || 0));
            case 'economy':
                return sorted.sort((a, b) => (b.cash || b.economy_score || 0) - (a.cash || a.economy_score || 0));
            case 'technology':
                return sorted.sort((a, b) => (b.technology || 0) - (a.technology || 0));
            case 'population':
                return sorted.sort((a, b) => (b.total_population || 0) - (a.total_population || 0));
            default:
                return sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
        }
    },

    /**
     * Get category display info
     */
    getCategoryInfo() {
        const categories = {
            score: { label: 'Score', column: 'score', valueLabel: 'Overall Score' },
            military: { label: 'Military Power', column: 'soldiers', valueLabel: 'Soldiers' },
            economy: { label: 'Economy', column: 'cash', valueLabel: 'Cash' },
            technology: { label: 'Technology', column: 'technology', valueLabel: 'Tech Level' },
            population: { label: 'Population', column: 'total_population', valueLabel: 'Citizens' }
        };
        return categories[this.currentCategory] || categories.score;
    },

    /**
     * Switch ranking category
     */
    switchCategory(category) {
        this.currentCategory = category;
        this.render();

        // Update active tab
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === category);
        });
    },

    /**
     * Render rankings UI
     */
    render() {
        this.renderUserRank();
        this.renderPodium();
        this.renderTable();
        this.updateColumnHeaders();
    },

    /**
     * Render user's rank card
     */
    renderUserRank() {
        const card = document.getElementById('user-rank-card');
        if (!card || !this.userRank) {
            if (card) {
                card.innerHTML = '<div class="text-center text-secondary py-2">Create a nation to see your rank</div>';
            }
            return;
        }

        const info = this.getCategoryInfo();
        const sorted = this.getSortedNations();
        const userNation = sorted.find(n => n.nation_id === this.userNationId);
        const value = userNation ? this.getValue(userNation) : 0;

        card.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <div class="user-rank-position ${this.getRankClass(this.userRank)}">#${this.userRank}</div>
                <div class="flex-grow-1">
                    <div class="fw-bold">Your Rank - ${info.label}</div>
                    <div class="text-secondary small">
                        ${userNation ? esc(userNation.nation_name) : 'Unknown'} ·
                        ${info.valueLabel}: ${fmtNum(value)}
                    </div>
                </div>
                <div class="text-end">
                    <a href="/nation/${this.userNationId}" class="btn btn-sm btn-outline-light">View Profile</a>
                </div>
            </div>
        `;
    },

    /**
     * Render top 3 podium
     */
    renderPodium() {
        const sorted = this.getSortedNations();
        const top3 = sorted.slice(0, 3);

        [1, 2, 3].forEach(rank => {
            const nation = top3[rank - 1];
            const pod = document.getElementById(`podium-${rank}`);
            if (!pod || !nation) return;

            const isSelf = nation.nation_id === this.userNationId;
            pod.innerHTML = `
                <div class="podium-card ${isSelf ? 'podium-self' : ''}" style="cursor: pointer;" onclick="window.location='/nation/${nation.nation_id}'">
                    <div class="podium-rank ${rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze'}">
                        #${rank}
                    </div>
                    <div class="podium-content">
                        <div class="podium-name">${esc(nation.nation_name)}</div>
                        <div class="podium-ruler">${esc(nation.ruler_name)}</div>
                        <div class="podium-gov small text-muted">${esc(nation.government_type)}</div>
                    </div>
                    <div class="podium-value text-gold">${fmtNum(this.getValue(nation))}</div>
                </div>
            `;
        });
    },

    /**
     * Render rankings table
     */
    renderTable() {
        const tbody = document.getElementById('leaderboard-body');
        if (!tbody) return;

        const sorted = this.getSortedNations();
        const info = this.getCategoryInfo();

        tbody.innerHTML = sorted.map((n, i) => {
            const rank = i + 1;
            const isSelf = n.nation_id === this.userNationId;
            const value = this.getValue(n);

            return `
                <tr class="${isSelf ? 'table-active' : ''}" onclick="window.location='/nation/${n.nation_id}'" style="cursor: pointer;">
                    <td class="leaderboard-rank ${this.getRankClass(rank)}">${rank}</td>
                    <td class="leaderboard-nation">
                        ${n.national_color ? `<span class="color-sphere-sm" style="background:${colorHex(n.national_color)}"></span>` : ''}
                        <span class="${isSelf ? 'text-gold fw-bold' : ''}">${esc(n.nation_name)}</span>
                        ${n.alliance_id ? '<span class="badge bg-success" style="font-size:0.6rem">Alliance</span>' : ''}
                    </td>
                    <td class="text-secondary small">${esc(n.government_type)}</td>
                    <td class="leaderboard-score">${fmtNum(n.score || 0)}</td>
                    <td class="leaderboard-value">${fmtNum(value)}</td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Get value for current category
     */
    getValue(nation) {
        switch (this.currentCategory) {
            case 'military': return nation.soldiers || nation.military_score || 0;
            case 'economy': return nation.cash || nation.economy_score || 0;
            case 'technology': return nation.technology || 0;
            case 'population': return nation.total_population || 0;
            default: return nation.score || 0;
        }
    },

    /**
     * Update column headers
     */
    updateColumnHeaders() {
        const info = this.getCategoryInfo();
        const scoreHeader = document.getElementById('score-column-header');
        const valueHeader = document.getElementById('value-column-header');

        if (scoreHeader) scoreHeader.textContent = 'Overall Score';
        if (valueHeader) valueHeader.textContent = info.valueLabel;
    },

    /**
     * Get rank CSS class
     */
    getRankClass(rank) {
        if (rank === 1) return 'gold';
        if (rank === 2) return 'silver';
        if (rank === 3) return 'bronze';
        return '';
    },

    /**
     * Navigate to nation profile
     */
    viewNation(nationId) {
        window.location.href = `/nation/${nationId}`;
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

function colorHex(c) {
    const m = { BLUE: '#0d6efd', RED: '#dc3545', GREEN: '#198754', PURPLE: '#6f42c1', ORANGE: '#fd7e14', TEAL: '#20c997', PINK: '#d63384', WHITE: '#adb5bd' };
    return m[c] || '#6c757d';
}

// Add podium styles
const style = document.createElement('style');
style.textContent = `
    .podium-card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        transition: all 0.15s;
        height: 100%;
    }
    .podium-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow);
        border-color: var(--accent-primary);
    }
    .podium-self {
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px rgba(251,191,36,0.2);
    }
    .podium-rank {
        font-size: 1.5rem;
        font-weight: 800;
        margin-bottom: 12px;
    }
    .podium-rank.gold { color: #fbbf24; }
    .podium-rank.silver { color: #94a3b8; }
    .podium-rank.bronze { color: #d97706; }
    .podium-name {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 4px;
    }
    .podium-ruler {
        font-size: 0.85rem;
        color: var(--text-secondary);
    }
    .podium-value {
        font-size: 1.3rem;
        font-weight: 700;
        margin-top: 12px;
    }
    .user-rank-position {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: var(--bg-input);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        font-weight: 800;
        color: var(--text-secondary);
    }
    .user-rank-position.gold { background: rgba(251,191,36,0.2); color: #fbbf24; }
    .user-rank-position.silver { background: rgba(148,163,184,0.2); color: #94a3b8; }
    .user-rank-position.bronze { background: rgba(217,119,6,0.2); color: #d97706; }
    .table-active {
        background: rgba(251,191,36,0.1) !important;
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('leaderboard-body')) {
        rankings.init();
    }
});