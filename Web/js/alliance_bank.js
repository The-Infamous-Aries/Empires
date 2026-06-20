/**
 * Alliance Bank UI - Empires Game
 *
 * Treasury management for alliances with deposits, withdrawals, and tracking.
 */

const allianceBank = {
    alliance: null,
    treasury: 0,
    transactions: [],
    contributions: [],
    userRole: 'member',

    /**
     * Initialize alliance bank UI
     */
    async init() {
        await this.loadData();
        this.render();
    },

    /**
     * Load alliance bank data
     */
    async loadData() {
        try {
            // Check if user has an alliance
            const nationData = await api.get('/api/web/user/nation');

            if (nationData?.nation?.alliance_id) {
                // Get alliance bank data
                const [bankData, transactionsData, contributionsData] = await Promise.all([
                    api.get('/api/web/alliance/bank'),
                    api.get('/api/web/alliance/transactions'),
                    api.get('/api/web/alliance/contributions')
                ]);

                this.alliance = bankData?.alliance || { alliance_name: 'My Alliance' };
                this.treasury = bankData?.treasury || 0;
                this.transactions = transactionsData || [];
                this.contributions = contributionsData || [];
                this.userRole = bankData?.user_role || 'member';
            }
        } catch (err) {
            console.error('Failed to load alliance bank data:', err);
        }
    },

    /**
     * Render alliance bank UI
     */
    render() {
        const noAllianceMsg = document.getElementById('no-alliance-message');
        const bankUI = document.getElementById('alliance-bank-ui');
        const createAllianceCTA = document.getElementById('create-alliance-cta');

        // Update alliance name
        document.getElementById('alliance-name').textContent =
            this.alliance?.alliance_name || 'No Alliance';

        if (!this.alliance) {
            noAllianceMsg.classList.remove('d-none');
            bankUI.classList.add('d-none');
            createAllianceCTA.classList.remove('d-none');
        } else {
            noAllianceMsg.classList.add('d-none');
            bankUI.classList.remove('d-none');
            createAllianceCTA.classList.add('d-none');

            // Update stats
            this.renderStats();
            this.renderTransactions();
            this.renderContributions();
        }
    },

    /**
     * Render treasury stats
     */
    renderStats() {
        const deposits = this.transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
        const withdrawals = this.transactions.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + t.amount, 0);

        document.getElementById('treasury-total').textContent = '$' + fmtNum(this.treasury);
        document.getElementById('treasury-contributions').textContent = '$' + fmtNum(deposits);
        document.getElementById('treasury-withdrawals').textContent = '$' + fmtNum(withdrawals);
        document.getElementById('member-count').textContent = this.contributions.length;

        // Calculate average contribution
        const avg = this.contributions.length > 0
            ? this.contributions.reduce((sum, c) => sum + c.total_contributed, 0) / this.contributions.length
            : 0;
        document.getElementById('avg-contribution').textContent = '$' + fmtNum(Math.round(avg));

        // Top contributor
        const top = this.contributions.sort((a, b) => b.total_contributed - a.total_contributed)[0];
        document.getElementById('top-contributor').textContent = top ? top.nation_name.slice(0, 15) : '-';
        document.getElementById('days-since-funded').textContent = this.alliance?.created_at
            ? Math.floor((Date.now() - new Date(this.alliance.created_at)) / 86400000)
            : '—';
    },

    /**
     * Render transaction list
     */
    renderTransactions() {
        const container = document.getElementById('transaction-list');
        if (!container) return;

        if (this.transactions.length === 0) {
            container.innerHTML = '<div class="text-center text-secondary py-3">No transactions yet</div>';
            return;
        }

        container.innerHTML = this.transactions.slice(0, 10).map(t => `
            <div class="bank-transaction">
                <div class="bank-transaction-type">
                    <span class="badge ${t.type === 'deposit' ? 'bg-success' : 'bg-danger'}">${t.type.toUpperCase()}</span>
                    ${esc(t.description)}
                    <span class="text-muted small ms-2">${t.nation_name}</span>
                </div>
                <div class="bank-transaction-amount ${t.type}">
                    ${t.type === 'deposit' ? '+' : '-'}$${fmtNum(t.amount)}
                </div>
            </div>
        `).join('');
    },

    /**
     * Render contributions list
     */
    renderContributions() {
        const container = document.getElementById('contributions-list');
        if (!container) return;

        const sorted = [...this.contributions].sort((a, b) => b.total_contributed - a.total_contributed);

        container.innerHTML = sorted.map((c, i) => `
            <div class="contribution-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-2">
                        <span class="contribution-rank ${i < 3 ? 'rank-' + ['gold', 'silver', 'bronze'][i] : ''}">#${i + 1}</span>
                        <span>${esc(c.nation_name)}</span>
                    </div>
                    <span class="text-gold">$${fmtNum(c.total_contributed)}</span>
                </div>
            </div>
        `).join('') || '<div class="text-center text-secondary py-3">No contributions yet</div>';
    },

    /**
     * Deposit to alliance bank
     */
    async deposit() {
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        const note = document.getElementById('deposit-note').value;

        if (!amount || amount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        try {
            const resp = await api.post('/api/web/alliance/bank/deposit', { amount, note });
            if (resp?.success) {
                showToast(resp.message || `Deposited $${fmtNum(amount)} to treasury!`, 'success');
                document.getElementById('deposit-amount').value = '';
                document.getElementById('deposit-note').value = '';
                // Reload real data from server
                await this.loadData();
                this.render();
            } else {
                showToast(resp?.detail || resp?.message || 'Deposit failed', 'error');
            }
        } catch (err) {
            console.error('Deposit failed:', err);
            showToast('Failed to deposit funds', 'error');
        }
    },

    /**
     * Withdraw from alliance bank
     */
    async withdraw() {
        const amount = parseFloat(document.getElementById('withdraw-amount').value);
        const reason = document.getElementById('withdraw-reason').value;

        if (!amount || amount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        if (amount > this.treasury) {
            showToast('Insufficient funds in treasury', 'error');
            return;
        }

        // Check permissions
        if (this.userRole === 'member' && amount > 100000) {
            showToast('Members can only withdraw up to $100,000. Contact leadership.', 'error');
            return;
        }

        try {
            const resp = await api.post('/api/web/alliance/bank/withdraw', { amount, reason });
            if (resp?.success) {
                showToast(resp.message || `Withdrawn $${fmtNum(amount)} from treasury!`, 'success');
                document.getElementById('withdraw-amount').value = '';
                // Reload real data from server
                await this.loadData();
                this.render();
            } else {
                showToast(resp?.detail || resp?.message || 'Withdrawal failed', 'error');
            }
        } catch (err) {
            console.error('Withdrawal failed:', err);
            showToast('Failed to withdraw funds', 'error');
        }
    },

    /**
     * Create new alliance (redirects to alliances page modal)
     */
    async createAlliance() {
        window.location.href = '/alliances';
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
    .contribution-item {
        padding: 10px 0;
        border-bottom: 1px solid var(--border-color);
    }
    .contribution-item:last-child {
        border-bottom: none;
    }
    .contribution-rank {
        display: inline-block;
        width: 24px;
        height: 24px;
        line-height: 24px;
        text-align: center;
        border-radius: 50%;
        background: var(--bg-input);
        font-size: 0.7rem;
        font-weight: 700;
        margin-right: 8px;
    }
    .contribution-rank.rank-gold { background: rgba(251,191,36,0.2); color: #fbbf24; }
    .contribution-rank.rank-silver { background: rgba(148,163,184,0.2); color: #94a3b8; }
    .contribution-rank.rank-bronze { background: rgba(217,119,6,0.2); color: #d97706; }
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
    .bank-transaction:last-child { border-bottom: none; }
`;
document.head.appendChild(style);