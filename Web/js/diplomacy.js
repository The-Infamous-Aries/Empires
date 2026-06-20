/**
 * Diplomacy / Treaty Management UI - Empires Game
 *
 * Handles diplomatic relations, treaties, NAPs, and trade agreements.
 */

const diplomacy = {
    treaties: [],
    relations: [],
    nations: [],
    currentTab: 'active',

    /**
     * Initialize diplomacy UI
     */
    async init() {
        await this.loadData();
        this.render();
        this.setupSearch();
    },

    /**
     * Load diplomacy data from API
     */
    async loadData() {
        try {
            const [treatiesData, nationsData, relationsData] = await Promise.all([
                api.get('/api/web/treaties'),
                api.get('/api/web/nations'),
                api.get('/api/web/diplomatic-relations')
            ]);

            this.treaties = treatiesData || [];
            this.nations = nationsData || [];
            this.relations = relationsData || [];

        } catch (err) {
            console.error('Failed to load diplomacy data:', err);
            this.treaties = [];
            this.relations = [];
        }

        this.updateStats();
    },

    /**
     * Render diplomacy UI
     */
    render() {
        this.renderTreatyList();
        this.renderRelations();
    },

    /**
     * Render treaty list based on filter
     */
    renderTreatyList(filter = 'active') {
        const container = document.getElementById(`treaty-panel-${filter}`);
        if (!container) return;

        let filtered = this.treaties;

        if (filter === 'active') {
            filtered = this.treaties.filter(t => t.status === 'active');
        } else if (filter === 'pending') {
            filtered = this.treaties.filter(t => t.status === 'pending');
        } else if (filter === 'proposed') {
            filtered = this.treaties.filter(t => t.status === 'proposed');
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <span style="font-size: 3rem;">📜</span>
                    <h5 class="mt-3">No ${filter} Treaties</h5>
                    <p class="text-muted">No ${filter} diplomatic agreements found.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(t => this.renderTreatyItem(t)).join('');
    },

    /**
     * Render single treaty item
     */
    renderTreatyItem(treaty) {
        const typeInfo = this.getTreatyTypeInfo(treaty.treaty_type);
        const isExpired = treaty.expires_at && new Date(treaty.expires_at) < new Date();

        return `
            <div class="treaty-item">
                <div class="treaty-header-row">
                    <div class="treaty-parties">
                        ${esc(treaty.party_a_name)} ↔ ${esc(treaty.party_b_name)}
                    </div>
                    <span class="treaty-type ${treaty.treaty_type}">
                        ${typeInfo.icon} ${typeInfo.name}
                    </span>
                </div>
                <div class="treaty-terms">${esc(treaty.terms)}</div>
                <div class="d-flex justify-content-between align-items-center mt-2">
                    <div class="treaty-status ${isExpired ? 'expired' : 'active'}">
                        ${isExpired ? '⏰ Expired' : treaty.status === 'active' ? '✓ Active' : treaty.status}
                        ${treaty.expires_at && !isExpired ? ` · ${this.getDaysRemaining(treaty.expires_at)} days left` : ''}
                    </div>
                    <div class="treaty-actions">
                        ${treaty.status === 'active' ? `
                            <button class="treaty-action-btn deny" onclick="diplomacy.terminateTreaty('${treaty.treaty_id}')">
                                Terminate
                            </button>
                        ` : ''}
                        ${treaty.status === 'pending' ? `
                            <button class="treaty-action-btn approve" onclick="diplomacy.acceptTreaty('${treaty.treaty_id}')">
                                Accept
                            </button>
                            <button class="treaty-action-btn deny" onclick="diplomacy.rejectTreaty('${treaty.treaty_id}')">
                                Reject
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render relations table
     */
    renderRelations() {
        const tbody = document.getElementById('relations-body');
        if (!tbody) return;

        tbody.innerHTML = this.relations.map(r => `
            <tr>
                <td>
                    <span class="color-sphere-sm" style="background:${this.getColorForGov(r.government_type)}"></span>
                    <a href="/nation/${r.nation_id}" class="text-light">${esc(r.nation_name)}</a>
                </td>
                <td class="text-secondary small">${esc(r.government_type)}</td>
                <td>
                    <span class="badge ${this.getRelationBadge(r.relation_type)}">${r.relation_type}</span>
                </td>
                <td>
                    ${r.has_treaty ? `<span class="badge bg-info">${r.treaty_type.toUpperCase()}</span>` : '<span class="text-muted">-</span>'}
                </td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
                            Actions
                        </button>
                        <ul class="dropdown-menu dropdown-menu-dark">
                            <li><a class="dropdown-item" href="/nation/${r.nation_id}">View Profile</a></li>
                            <li><a class="dropdown-item" href="#" onclick="diplomacy.proposeTreaty('${r.nation_id}')">Propose Treaty</a></li>
                            <li><a class="dropdown-item" href="#" onclick="diplomacy.declareWar('${r.nation_id}')">Declare War</a></li>
                            ${r.relation_type === 'hostile' || r.relation_type === 'war' ? `
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-success" href="#" onclick="diplomacy.normalizeRelations('${r.nation_id}')">Normalize Relations</a></li>
                            ` : ''}
                        </ul>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Update stats
     */
    updateStats() {
        const active = this.treaties.filter(t => t.status === 'active');
        const naps = active.filter(t => t.treaty_type === 'nap');
        const tradeDeals = active.filter(t => t.treaty_type === 'trade');
        const enemies = this.relations.filter(r => r.relation_type === 'hostile' || r.relation_type === 'war');

        document.getElementById('stat-allies').textContent = active.filter(t => t.treaty_type === 'alliance').length;
        document.getElementById('stat-nap').textContent = naps.length;
        document.getElementById('stat-trade-agreements').textContent = tradeDeals.length;
        document.getElementById('stat-enemies').textContent = enemies.length;
    },

    /**
     * Switch treaty tab
     */
    switchTab(tab) {
        this.currentTab = tab;

        document.querySelectorAll('.treaty-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        document.querySelectorAll('.treaty-list').forEach(p => {
            p.classList.add('d-none');
        });

        document.getElementById(`treaty-panel-${tab}`).classList.remove('d-none');
        this.renderTreatyList(tab);
    },

    /**
     * Show new treaty modal
     */
    showNewTreatyModal() {
        const modal = new bootstrap.Modal(document.getElementById('treatyModal'));

        // Populate target nations
        const targetSelect = document.getElementById('treaty-target');
        targetSelect.innerHTML = this.nations.map(n =>
            `<option value="${n.nation_id}">${esc(n.nation_name)}</option>`
        ).join('') || '<option value="">No nations available</option>';

        modal.show();
    },

    /**
     * Send treaty proposal
     */
    async sendTreatyProposal() {
        const type = document.getElementById('treaty-type').value;
        const targetId = document.getElementById('treaty-target').value;
        const duration = document.getElementById('treaty-duration').value;
        const terms = document.getElementById('treaty-terms').value;

        if (!targetId) {
            showToast('Please select a target nation', 'error');
            return;
        }

        try {
            const resp = await api.post('/api/web/treaties/propose', {
                target_id: targetId,
                treaty_type: type,
                duration_days: parseInt(duration),
                terms: terms
            });

            if (resp?.success) {
                showToast('Treaty proposal sent!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('treatyModal')).hide();
                this.loadData();
                this.render();
            }
        } catch (err) {
            showToast(err.message || 'Failed to send treaty', 'error');
        }
    },

    /**
     * Accept treaty
     */
    async acceptTreaty(treatyId) {
        try {
            const resp = await api.post(`/api/web/treaties/${treatyId}/accept`);
            if (resp?.success) {
                showToast('Treaty accepted!', 'success');
                this.loadData();
                this.render();
            }
        } catch (err) {
            showToast(err.message || 'Failed to accept treaty', 'error');
        }
    },

    async rejectTreaty(treatyId) {
        try {
            const resp = await api.post(`/api/web/treaties/${treatyId}/reject`);
            if (resp?.success) {
                showToast('Treaty rejected', 'info');
                this.loadData();
                this.render();
            }
        } catch (err) {
            showToast(err.message || 'Failed to reject treaty', 'error');
        }
    },

    async terminateTreaty(treatyId) {
        if (!confirm('Are you sure you want to terminate this treaty? This may damage diplomatic relations.')) return;
        try {
            const resp = await api.post(`/api/web/treaties/${treatyId}/terminate`);
            if (resp?.success) {
                showToast('Treaty terminated', 'info');
                this.loadData();
                this.render();
            }
        } catch (err) {
            showToast(err.message || 'Failed to terminate treaty', 'error');
        }
    },

    /**
     * Propose treaty to specific nation
     */
    proposeTreaty(nationId) {
        this.showNewTreatyModal();
        document.getElementById('treaty-target').value = nationId;
    },

    /**
     * Declare war
     */
    async declareWar(nationId) {
        if (!confirm('Are you sure you want to declare war? This will end all treaties and damage your economy.')) return;
        try {
            const resp = await api.post('/api/web/wars/declare', { defender_id: nationId });
            if (resp?.war) {
                showToast('War declared!', 'error');
                window.location.href = `/war/${resp.war.war_id}`;
            }
        } catch (err) {
            showToast(err.message || 'Failed to declare war', 'error');
        }
    },

    /**
     * Normalize relations
     */
    normalizeRelations(nationId) {
        const relation = this.relations.find(r => r.nation_id === nationId);
        if (relation) {
            relation.relation_type = 'neutral';
            showToast('Relations normalized', 'success');
            this.render();
        }
    },

    /**
     * Setup search functionality
     */
    setupSearch() {
        document.getElementById('relations-search')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#relations-body tr');
            rows.forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });
    },

    /**
     * Get treaty type info
     */
    getTreatyTypeInfo(type) {
        const types = {
            nap: { name: 'Non-Aggression Pact', icon: '🛡️' },
            trade: { name: 'Trade Agreement', icon: '💰' },
            alliance: { name: 'Alliance', icon: '🤝' },
            research: { name: 'Research Pact', icon: '🔬' },
            mutual_defense: { name: 'Mutual Defense', icon: '⚔️' }
        };
        return types[type] || { name: 'Unknown', icon: '📜' };
    },

    /**
     * Get relation badge class
     */
    getRelationBadge(type) {
        const badges = {
            allied: 'bg-success',
            friendly: 'bg-info',
            neutral: 'bg-secondary',
            hostile: 'bg-warning text-dark',
            war: 'bg-danger'
        };
        return badges[type] || 'bg-secondary';
    },

    /**
     * Get days remaining
     */
    getDaysRemaining(expiresAt) {
        const diff = new Date(expiresAt) - new Date();
        return Math.max(0, Math.ceil(diff / 86400000));
    },

    /**
     * Get color for government type
     */
    getColorForGov(gov) {
        const colors = {
            DEMOCRACY: '#22c55e',
            REPUBLIC: '#3b82f6',
            MONARCHY: '#a855f7',
            DICTATORSHIP: '#ef4444',
            FASCISM: '#dc2626',
            COMMUNIST: '#f97316'
        };
        return colors[gov] || '#6b7280';
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

// Toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${esc(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:70px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
    return container;
}

// Add styles
const style = document.createElement('style');
style.textContent = `
    .toast {
        padding: 12px 16px;
        border-radius: 8px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-lg);
    }
    .toast-success { border-left: 3px solid var(--accent-success); }
    .toast-error { border-left: 3px solid var(--accent-danger); }
    .toast-info { border-left: 3px solid var(--accent-info); }
`;
document.head.appendChild(style);