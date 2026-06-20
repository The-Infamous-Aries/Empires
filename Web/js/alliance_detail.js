/**
 * Alliance Detail UI - Empires Game
 *
 * Full alliance management page with members, bank, diplomacy, wars, and settings.
 */

const allianceDetail = {
    alliance: null,
    allianceId: null,
    myNationId: null,
    myRole: null,

    /**
     * Initialize alliance detail UI
     */
    async init() {
        this.allianceId = window.location.pathname.split('/').pop();
        await this.loadData();
        this.render();
    },

    /**
     * Load alliance data
     */
    async loadData() {
        try {
            const [allianceData, nationData] = await Promise.all([
                api.get(`/api/web/alliances/${this.allianceId}`),
                api.get('/api/web/user/nation')
            ]);

            this.alliance = allianceData;

            if (nationData && nationData.nation) {
                this.myNationId = nationData.nation.nation_id;
                this.myRole = nationData.nation.alliance_role;
            }
        } catch (err) {
            console.error('Failed to load alliance data:', err);
        }
    },

    /**
     * Render alliance detail page
     */
    render() {
        const container = document.getElementById('alliance-content');
        if (!container || !this.alliance) return;

        const isLeader = this.myRole === 'LEADER';
        const isOfficer = this.myRole === 'LEADER' || this.myRole === 'OFFICER';

        container.innerHTML = `
            <div class="card mb-4">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
                        <div>
                            <div class="d-flex align-items-center gap-2 mb-2">
                                <h2 class="fw-bold mb-0">🏛️ ${esc(this.alliance.alliance_name)}</h2>
                                ${this.alliance.settings?.public === false ? '<span class="badge bg-secondary">Private</span>' : ''}
                            </div>
                            <p class="text-secondary mb-0">${esc(this.alliance.description || 'No description')}</p>
                            <div class="text-muted small mt-2">
                                Founded: ${new Date(this.alliance.created_at).toLocaleDateString()} ·
                                Leader: <a href="/nation/${this.alliance.leader_nation_id}">${esc(this.alliance.leader_nation_name || 'Unknown')}</a>
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="text-gold fw-bold fs-2">$${fmtNum(this.alliance.treasury || 0)}</div>
                            <div class="text-muted small">Treasury</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderMembers();
        this.renderBank();
        this.renderDiplomacy();
        this.renderWars();
        this.renderSettings();
    },

    /**
     * Render members list
     */
    renderMembers() {
        const container = document.getElementById('members-list');
        const countEl = document.getElementById('member-count');
        if (!container || !this.alliance?.members) return;

        const members = this.alliance.members;
        const isOfficer = this.myRole === 'LEADER' || this.myRole === 'OFFICER';

        countEl.textContent = `${members.length} members`;

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-hover">
                    <thead>
                        <tr>
                            <th>Nation</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.map(m => `
                            <tr>
                                <td>
                                    <a href="/nation/${m.nation_id}" class="text-light">
                                        ${esc(m.nation_name)}
                                    </a>
                                </td>
                                <td><span class="badge ${this.getRoleBadge(m.role)}">${m.role}</span></td>
                                <td class="text-secondary small">${new Date(m.joined_at).toLocaleDateString()}</td>
                                <td>
                                    ${isOfficer && m.nation_id !== this.myNationId && m.role !== 'LEADER' ? `
                                        <div class="dropdown">
                                            <button class="btn btn-sm btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
                                                Manage
                                            </button>
                                            <ul class="dropdown-menu dropdown-menu-dark">
                                                <li><a class="dropdown-item" href="#" onclick="allianceDetail.promoteMember('${m.nation_id}')">Promote</a></li>
                                                <li><a class="dropdown-item" href="#" onclick="allianceDetail.demoteMember('${m.nation_id}')">Demote</a></li>
                                                <li><hr class="dropdown-divider"></li>
                                                <li><a class="dropdown-item text-danger" href="#" onclick="allianceDetail.kickMember('${m.nation_id}')">Kick</a></li>
                                            </ul>
                                        </div>
                                    ` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Render alliance bank
     */
    renderBank() {
        const container = document.getElementById('alliance-bank-summary');
        if (!container || !this.alliance) return;

        const isMember = this.alliance.members?.some(m => m.nation_id === this.myNationId);

        container.innerHTML = `
            <div class="row g-4">
                <div class="col-md-4">
                    <div class="text-center p-4 rounded" style="background: var(--bg-input);">
                        <div class="text-gold fw-bold fs-2">$${fmtNum(this.alliance.treasury || 0)}</div>
                        <div class="text-muted">Total Treasury</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="text-center p-4 rounded" style="background: var(--bg-input);">
                        <div class="text-success fw-bold fs-2">$${fmtNum(Math.floor((this.alliance.treasury || 0) * 0.2))}</div>
                        <div class="text-muted">Avg Contribution</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="text-center p-4 rounded" style="background: var(--bg-input);">
                        <div class="text-info fw-bold fs-2">${this.alliance.members?.length || 0}</div>
                        <div class="text-muted">Contributors</div>
                    </div>
                </div>
            </div>
            ${isMember ? `
                <hr class="border-secondary my-4">
                <div class="bank-operation-row">
                    <div class="bank-input-group">
                        <label>Deposit Amount</label>
                        <input type="number" class="form-control" id="alliance-deposit-amount" placeholder="Amount...">
                    </div>
                    <button class="bank-operation-btn green" onclick="allianceDetail.depositToBank()">Deposit</button>
                </div>
                ${this.myRole === 'LEADER' || this.myRole === 'OFFICER' ? `
                <div class="bank-operation-row">
                    <div class="bank-input-group">
                        <label>Withdraw Amount</label>
                        <input type="number" class="form-control" id="alliance-withdraw-amount" placeholder="Amount...">
                    </div>
                    <div class="bank-input-group">
                        <label>Reason</label>
                        <select class="form-select" id="alliance-withdraw-reason">
                            <option value="military">Military Aid</option>
                            <option value="infrastructure">Infrastructure</option>
                            <option value="research">Research</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <button class="bank-operation-btn gold" onclick="allianceDetail.withdrawFromBank()">Withdraw</button>
                </div>
                ` : ''}
            ` : '<div class="text-center text-secondary mt-4">Join this alliance to access the bank</div>'}
        `;
    },

    /**
     * Render diplomacy
     */
    renderDiplomacy() {
        const container = document.getElementById('alliance-diplomacy');
        if (!container || !this.alliance?.diplomacy) return;

        const relations = this.alliance.diplomacy;
        const isOfficer = this.myRole === 'LEADER' || this.myRole === 'OFFICER';

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-hover">
                    <thead>
                        <tr>
                            <th>Alliance/Nation</th>
                            <th>Relation</th>
                            <th>Treaty</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${relations.map(r => `
                            <tr>
                                <td class="fw-bold">${esc(r.target_name)}</td>
                                <td><span class="badge ${this.getRelationBadge(r.relation)}">${r.relation}</span></td>
                                <td>${r.treaty ? `<span class="badge bg-info">${r.treaty.toUpperCase()}</span>` : '-'}</td>
                                <td>
                                    ${isOfficer ? `
                                        <button class="btn btn-sm btn-outline-light" onclick="allianceDetail.proposeTreaty('${esc(r.target_name)}')">
                                            Propose Treaty
                                        </button>
                                    ` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Render wars
     */
    renderWars() {
        const container = document.getElementById('alliance-wars');
        if (!container || !this.alliance?.wars) return;

        const wars = this.alliance.wars;

        if (wars.length === 0) {
            container.innerHTML = '<div class="text-center text-secondary py-4">No alliance wars</div>';
            return;
        }

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-hover">
                    <thead>
                        <tr>
                            <th>Enemy</th>
                            <th>Status</th>
                            <th>War Score</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${wars.map(w => `
                            <tr>
                                <td class="fw-bold"><a href="/nation/${w.enemy_id || '#'}" class="text-danger">${esc(w.enemy)}</a></td>
                                <td><span class="badge ${w.status === 'active' ? 'bg-danger' : 'bg-secondary'}">${w.status}</span></td>
                                <td>
                                    <div class="progress" style="height: 8px; width: 100px;">
                                        <div class="progress-bar ${w.score > 50 ? 'bg-success' : 'bg-danger'}" style="width: ${w.score}%"></div>
                                    </div>
                                    <small class="text-muted">${fmtNum(w.score)}</small>
                                </td>
                                <td>
                                    <a href="/war/${w.war_id}" class="btn btn-sm btn-outline-light">View</a>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Render settings
     */
    renderSettings() {
        const container = document.getElementById('alliance-settings');
        if (!container || !this.alliance) return;

        const isLeader = this.myRole === 'LEADER';
        const settings = this.alliance.settings || {};

        if (!isLeader) {
            container.innerHTML = '<div class="text-center text-secondary py-4">Only the leader can change settings</div>';
            return;
        }

        container.innerHTML = `
            <div class="row g-4">
                <div class="col-md-6">
                    <label class="form-label">Alliance Name</label>
                    <input type="text" class="form-control" value="${esc(this.alliance.alliance_name)}" id="setting-name">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" rows="2" id="setting-description">${esc(this.alliance.description || '')}</textarea>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Visibility</label>
                    <select class="form-select" id="setting-public">
                        <option value="false" ${!settings.public ? 'selected' : ''}>Private (Invite Only)</option>
                        <option value="true" ${settings.public ? 'selected' : ''}>Public (Anyone Can Join)</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Recruitment</label>
                    <select class="form-select" id="setting-recruitment">
                        <option value="true" ${settings.recruitment_open ? 'selected' : ''}>Open</option>
                        <option value="false" ${!settings.recruitment_open ? 'selected' : ''}>Closed</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Min Nation Score</label>
                    <input type="number" class="form-control" value="${settings.min_nation_score || 0}" id="setting-min-score">
                </div>
                <div class="col-12">
                    <button class="btn btn-gold" onclick="allianceDetail.saveSettings()">Save Settings</button>
                </div>
            </div>
        `;
    },

    /**
     * Get role badge class
     */
    getRoleBadge(role) {
        const badges = {
            LEADER: 'bg-warning text-dark',
            OFFICER: 'bg-info',
            MEMBER: 'bg-success',
            RECRUIT: 'bg-secondary'
        };
        return badges[role] || 'bg-secondary';
    },

    /**
     * Get relation badge class
     */
    getRelationBadge(relation) {
        const badges = {
            allied: 'bg-success',
            friendly: 'bg-info',
            neutral: 'bg-secondary',
            hostile: 'bg-warning text-dark',
            war: 'bg-danger'
        };
        return badges[relation] || 'bg-secondary';
    },

    /**
     * Deposit to alliance bank
     */
    async depositToBank() {
        const amount = parseFloat(document.getElementById('alliance-deposit-amount').value);
        if (!amount || amount <= 0) {
            showToast('Enter a valid amount', 'error');
            return;
        }

        try {
            const resp = await api.post('/api/web/alliance/bank/deposit', { amount });
            if (resp?.success) {
                showToast(resp.message || `Deposited $${fmtNum(amount)}`, 'success');
                this.loadData();
            } else {
                showToast(resp?.message || 'Deposit failed', 'error');
            }
        } catch (err) {
            showToast(err.message || 'Deposit failed', 'error');
        }
    },

    /**
     * Withdraw from alliance bank
     */
    async withdrawFromBank() {
        const amount = parseFloat(document.getElementById('alliance-withdraw-amount').value);
        if (!amount || amount <= 0) {
            showToast('Enter a valid amount', 'error');
            return;
        }
        if (amount > (this.alliance.treasury || 0)) {
            showToast('Insufficient funds', 'error');
            return;
        }

        try {
            const resp = await api.post('/api/web/alliance/bank/withdraw', {
                amount,
                reason: document.getElementById('alliance-withdraw-reason').value
            });
            if (resp?.success) {
                showToast(resp.message || `Withdrawn $${fmtNum(amount)}`, 'success');
                this.loadData();
            } else {
                showToast(resp?.message || 'Withdrawal failed', 'error');
            }
        } catch (err) {
            showToast(err.message || 'Withdrawal failed', 'error');
        }
    },

    /**
     * Save alliance settings
     */
    async saveSettings() {
        const settings = {
            name: document.getElementById('setting-name').value,
            description: document.getElementById('setting-description').value,
            public: document.getElementById('setting-public').value === 'true',
            recruitment_open: document.getElementById('setting-recruitment').value === 'true',
            min_nation_score: parseInt(document.getElementById('setting-min-score').value) || 0
        };

        try {
            const resp = await api.post(`/api/web/alliances/${this.allianceId}/settings`, settings);
            if (resp?.success) {
                showToast('Settings saved!', 'success');
                this.loadData();
            } else {
                showToast(resp?.message || 'Failed to save settings', 'error');
            }
        } catch (err) {
            showToast(err.message || 'Failed to save settings', 'error');
        }
    },

    /**
     * Promote member
     */
    async promoteMember(nationId) {
        try {
            const resp = await api.post(`/api/web/alliances/${this.allianceId}/members/${nationId}/promote`);
            if (resp?.success) {
                showToast('Member promoted!', 'success');
                this.loadData();
            } else {
                showToast(resp?.message || 'Failed to promote', 'error');
            }
        } catch (err) {
            showToast(err.message || 'Failed to promote', 'error');
        }
    },

    async demoteMember(nationId) {
        try {
            const resp = await api.post(`/api/web/alliances/${this.allianceId}/members/${nationId}/demote`);
            if (resp?.success) {
                showToast('Member demoted!', 'info');
                this.loadData();
            } else {
                showToast(resp?.message || 'Failed to demote', 'error');
            }
        } catch (err) {
            showToast(err.message || 'Failed to demote', 'error');
        }
    },

    async kickMember(nationId) {
        if (!confirm('Are you sure you want to kick this member?')) return;

        try {
            const resp = await api.del(`/api/web/alliances/${this.allianceId}/members/${nationId}`);
            if (resp?.success) {
                showToast('Member kicked!', 'info');
                this.loadData();
            } else {
                showToast(resp?.message || 'Failed to kick', 'error');
            }
        } catch (err) {
            showToast(err.message || 'Failed to kick', 'error');
        }
    },

    /**
     * New diplomacy
     */
    newDiplomacy() {
        showToast('Diplomacy form coming soon!', 'info');
    },

    /**
     * Propose treaty
     */
    proposeTreaty(targetName) {
        window.location.href = `/diplomy?alliance=${encodeURIComponent(targetName)}`;
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