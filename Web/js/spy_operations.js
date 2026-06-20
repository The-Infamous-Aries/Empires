/**
 * Spy Operations UI - Empires Game
 *
 * Espionage operations for intelligence, sabotage, and resource theft.
 */

const spyOperations = {
    spies: 0,
    spyCap: 100,
    operations: [],
    operationHistory: [],
    nations: [],
    selectedOperation: null,
    selectedTarget: null,

    /**
     * Initialize spy UI
     */
    async init() {
        await this.loadData();
        this.render();
    },

    /**
     * Load spy data from API
     */
    async loadData() {
        try {
            // Get military/spy data
            const militaryData = await api.get('/api/web/user/military');
            this.spies = militaryData?.spies || 0;
            this.spyCap = militaryData?.spy_cap || 100;

            // Get operation history
            const historyData = await api.get('/api/web/spy/history');
            this.operationHistory = historyData || [];

            // Get potential targets
            const nationsData = await api.get('/api/web/nations');
            this.nations = nationsData || [];

        } catch (err) {
            console.error('Failed to load spy data:', err);
            this.spies = 5;
            this.spyCap = 100;
            this.operationHistory = [];
        }
    },

    /**
     * Get operation types
     */
    getOperationTypes() {
        return {
            intel: {
                name: 'Intelligence Gathering',
                icon: '🔍',
                description: 'Learn about target\'s military, economy, and resources',
                cost: 1,
                risk: 'Low',
                successChance: 0.85
            },
            sabotage: {
                name: 'Sabotage',
                icon: '💣',
                description: 'Destroy target\'s infrastructure and reduce production',
                cost: 3,
                risk: 'Medium',
                successChance: 0.60
            },
            steal_cash: {
                name: 'Heist',
                icon: '💰',
                description: 'Steal a portion of target\'s treasury',
                cost: 2,
                risk: 'High',
                successChance: 0.45
            },
            steal_tech: {
                name: 'Technology Theft',
                icon: '📡',
                description: 'Steal technology research from target',
                cost: 4,
                risk: 'High',
                successChance: 0.40
            },
            assets: {
                name: 'Asset Recruitment',
                icon: '🤝',
                description: 'Recruit agents within target nation',
                cost: 5,
                risk: 'Very High',
                successChance: 0.35
            },
            nuclear: {
                name: 'Nuclear Intelligence',
                icon: '☢️',
                description: 'Investigate target\'s nuclear capabilities',
                cost: 10,
                risk: 'Extreme',
                successChance: 0.25
            }
        };
    },

    /**
     * Render spy UI
     */
    render() {
        this.renderSpyNetwork();
        this.renderOperationsPanel();
        this.renderOperationHistory();
    },

    /**
     * Render spy network display
     */
    renderSpyNetwork() {
        const container = document.getElementById('spy-network');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center mb-4">
                <div style="font-size: 3rem;">🕵️</div>
                <div class="h3 fw-bold text-gold">${this.spies}</div>
                <div class="text-secondary">of ${this.spyCap} spies available</div>
            </div>
            <div class="progress mb-3" style="height: 8px;">
                <div class="progress-bar bg-primary" style="width: ${(this.spies / this.spyCap) * 100}%"></div>
            </div>
            <hr class="border-secondary">
            <div class="small">
                <div class="d-flex justify-content-between mb-2">
                    <span class="text-secondary">Active Missions</span>
                    <span class="text-gold">${this.operationHistory.filter(o => o.status === 'active').length}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                    <span class="text-secondary">Success Rate</span>
                    <span>${this.calculateSuccessRate()}%</span>
                </div>
                <div class="d-flex justify-content-between">
                    <span class="text-secondary">Targets Watched</span>
                    <span>${this.operationHistory.filter(o => o.status === 'success').length}</span>
                </div>
            </div>
        `;
    },

    /**
     * Calculate success rate
     */
    calculateSuccessRate() {
        const completed = this.operationHistory.filter(o => o.status === 'success' || o.status === 'failure');
        if (completed.length === 0) return 0;
        const successful = completed.filter(o => o.status === 'success').length;
        return Math.round((successful / completed.length) * 100);
    },

    /**
     * Render operations panel
     */
    renderOperationsPanel() {
        const container = document.getElementById('operations-panel');
        if (!container) return;

        const ops = this.getOperationTypes();

        container.innerHTML = `
            <div class="row g-3">
                ${Object.entries(ops).map(([key, op]) => this.renderOperationCard(key, op)).join('')}
            </div>
        `;
    },

    /**
     * Render single operation card
     */
    renderOperationCard(key, op) {
        const canAfford = this.spies >= op.cost;

        return `
            <div class="col-md-6">
                <div class="operation-card ${!canAfford ? 'disabled' : ''}" data-operation="${key}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <span class="op-icon">${op.icon}</span>
                            <span class="op-name fw-bold">${op.name}</span>
                        </div>
                        <span class="op-cost badge ${canAfford ? 'bg-primary' : 'bg-secondary'}">${op.cost} spy${op.cost > 1 ? 's' : ''}</span>
                    </div>
                    <p class="op-desc small text-secondary mb-2">${op.description}</p>
                    <div class="op-meta d-flex justify-content-between align-items-center">
                        <span class="risk-badge risk-${op.risk.toLowerCase().replace(' ', '-')}">${op.risk} Risk</span>
                        <span class="success-rate text-muted small">${Math.round(op.successChance * 100)}% success</span>
                    </div>
                    <button class="btn btn-gold w-100 mt-2"
                            ${!canAfford ? 'disabled' : ''}
                            onclick="spyOperations.selectOperation('${key}')">
                        ${canAfford ? '🚀 Launch Operation' : 'Not enough spies'}
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Render operation history
     */
    renderOperationHistory() {
        const container = document.getElementById('operation-history');
        if (!container) return;

        if (this.operationHistory.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <span style="font-size: 3rem;">📜</span>
                    <h5 class="mt-3">No Operations Yet</h5>
                    <p class="text-muted">Launch your first spy operation to see history.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-sm">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Target</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.operationHistory.slice(0, 20).map(op => `
                            <tr>
                                <td>${this.getOperationIcon(op.type)} ${op.type.replace(/_/g, ' ')}</td>
                                <td>${esc(op.target_name || 'Unknown')}</td>
                                <td class="text-secondary">${new Date(op.created_at).toLocaleDateString()}</td>
                                <td><span class="badge ${op.status === 'success' ? 'bg-success' : op.status === 'failure' ? 'bg-danger' : 'bg-warning'}">${op.status}</span></td>
                                <td class="text-${op.status === 'success' ? 'success' : 'danger'}">${esc(op.result || '-')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Get operation icon
     */
    getOperationIcon(type) {
        const icons = {
            intel: '🔍', sabotage: '💣', steal_cash: '💰',
            steal_tech: '📡', assets: '🤝', nuclear: '☢️'
        };
        return icons[type] || '🎯';
    },

    /**
     * Select operation to launch
     */
    selectOperation(opType) {
        this.selectedOperation = opType;

        // Show target selection modal
        const modal = new bootstrap.Modal(document.getElementById('targetModal'));
        this.renderTargetList();
        modal.show();

        // Set up search
        document.getElementById('target-search').addEventListener('input', (e) => {
            this.renderTargetList(e.target.value);
        });
    },

    /**
     * Render target list in modal
     */
    renderTargetList(search = '') {
        const tbody = document.getElementById('target-list');
        if (!tbody) return;

        const filtered = this.nations.filter(n =>
            n.nation_name?.toLowerCase().includes(search.toLowerCase())
        );

        tbody.innerHTML = filtered.map(n => `
            <tr>
                <td>
                    ${n.national_color ? `<span class="color-sphere-sm" style="background:${colorHex(n.national_color)}"></span>` : ''}
                    ${esc(n.nation_name)}
                </td>
                <td class="text-secondary small">${esc(n.government_type)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary"
                            onclick="spyOperations.launchOperation('${n.nation_id}', '${esc(n.nation_name)}')">
                        Target
                    </button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="3" class="text-center text-secondary">No nations found</td></tr>';
    },

    /**
     * Launch spy operation — uses real API result
     */
    async launchOperation(targetId, targetName) {
        const ops = this.getOperationTypes();
        const opType = this.selectedOperation;
        const op = ops[opType];

        if (this.spies < op.cost) {
            showToast('Not enough spies available', 'error');
            return;
        }

        try {
            const resp = await api.post('/api/web/spy/operation', {
                target_id: targetId,
                operation_type: opType
            });

            const result = resp?.result || (resp?.success ? 'success' : 'failure');
            const msg = resp?.message || (result === 'success' ? 'Operation succeeded' : 'Operation failed');

            // Record in local history (server already persisted it)
            this.operationHistory.unshift({
                operation_id: resp?.operation_id || Date.now(),
                operation_type: opType,
                target_id: targetId,
                target_name: targetName,
                result: result,
                status: result,
                created_at: new Date().toISOString()
            });

            this.spies -= op.cost;
            showToast(`${op.icon} ${msg}`, result === 'success' ? 'success' : 'error');

            bootstrap.Modal.getInstance(document.getElementById('targetModal')).hide();
            this.render();

        } catch (err) {
            console.error('Operation failed:', err);
            showToast('Operation failed to launch', 'error');
        }
    },

    /**
     * Train more spies
     */
    async trainSpy() {
        try {
            const resp = await api.post('/api/web/military/buy', {
                unit_type: 'spies',
                amount: 1
            });
            if (resp?.success) {
                this.spies++;
                showToast('Spy trained!', 'success');
                this.render();
            }
        } catch (err) {
            console.error('Failed to train spy:', err);
        }
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
    const m = { BLUE: '#0d6efd', RED: '#dc3545', GREEN: '#198754', PURPLE: '#6f42c1', ORANGE: '#fd7e14', TEAL: '#20c997' };
    return m[c] || '#6c757d';
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

// Add operation card styles
const style = document.createElement('style');
style.textContent = `
    .operation-card {
        background: var(--bg-input);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        padding: 16px;
        transition: all 0.15s;
    }
    .operation-card:hover {
        border-color: var(--accent-primary);
    }
    .operation-card.disabled {
        opacity: 0.5;
    }
    .op-icon { font-size: 1.5rem; margin-right: 8px; }
    .op-name { font-size: 1rem; }
    .op-desc { line-height: 1.4; }
    .risk-badge {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    .risk-low { background: rgba(34,197,94,0.2); color: #22c55e; }
    .risk-medium { background: rgba(251,191,36,0.2); color: #fbbf24; }
    .risk-high { background: rgba(249,115,22,0.2); color: #f97316; }
    .risk-very-high { background: rgba(239,68,68,0.2); color: #ef4444; }
    .risk-extreme { background: rgba(220,38,38,0.2); color: #dc2626; }
    .toast {
        padding: 12px 16px;
        border-radius: 8px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-lg);
        animation: slideIn 0.3s ease;
    }
    .toast-success { border-left: 3px solid var(--accent-success); }
    .toast-error { border-left: 3px solid var(--accent-danger); }
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);