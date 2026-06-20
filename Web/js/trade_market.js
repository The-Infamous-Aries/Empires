/**
 * Trade Market UI - Empires Game
 *
 * Full buy/sell interface for resources with price history.
 */

const tradeMarket = {
    prices: {},
    priceHistory: [],
    userResources: {},
    orders: [],

    /**
     * Initialize trade market UI
     */
    async init() {
        const section = document.getElementById('trade-market-section');
        if (!section) return;

        await this.loadData();
        this.render();
    },

    /**
     * Load market data from API
     */
    async loadData() {
        try {
            const pricesData = await api.get('/api/web/market/prices');
            this.prices = pricesData?.prices || {};

            const historyData = await api.get('/api/web/market/history');
            this.priceHistory = historyData?.history || [];

            const resourcesData = await api.get('/api/web/user/resources');
            this.userResources = resourcesData?.resources || {};

            const ordersData = await api.get('/api/web/market/orders');
            this.orders = ordersData?.orders || [];

        } catch (err) {
            console.error('Failed to load market data:', err);
            this.prices = {};
        }
    },

    /**
     * Render trade market UI
     */
    render() {
        const section = document.getElementById('trade-market-section');
        if (!section) return;

        section.innerHTML = `
            <div class="trade-market-card">
                <div class="trade-tabs">
                    <div class="trade-tab active" data-tab="buy" onclick="tradeMarket.switchTab('buy')">Buy Resources</div>
                    <div class="trade-tab" data-tab="sell" onclick="tradeMarket.switchTab('sell')">Sell Resources</div>
                    <div class="trade-tab" data-tab="history" onclick="tradeMarket.switchTab('history')">Price History</div>
                    <div class="trade-tab" data-tab="orders" onclick="tradeMarket.switchTab('orders')">My Orders</div>
                </div>

                <div id="trade-panel-buy" class="trade-panel">${this.renderBuyPanel()}</div>
                <div id="trade-panel-sell" class="trade-panel d-none">${this.renderSellPanel()}</div>
                <div id="trade-panel-history" class="trade-panel d-none">${this.renderHistoryPanel()}</div>
                <div id="trade-panel-orders" class="trade-panel d-none">${this.renderOrdersPanel()}</div>
            </div>
        `;
    },

    /**
     * Render buy resources panel
     */
    renderBuyPanel() {
        const resources = Object.keys(this.prices).map(type => ({
            type,
            price: this.prices[type],
            owned: this.userResources[type]?.amount || 0
        }));

        return `
            <div class="row">
                <div class="col-lg-8">
                    <h6 class="text-muted mb-3">Available Resources</h6>
                    <div class="row g-3">
                        ${resources.map(r => `
                            <div class="col-md-6 col-lg-4">
                                <div class="trade-resource-card" onclick="tradeMarket.selectResource('${r.type}', 'buy')">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div>
                                            <div class="fw-bold">${tradeMarket.getResourceIcon(r.type)} ${r.type}</div>
                                            <div class="text-muted small">Owned: ${fmtNum(r.owned)}</div>
                                        </div>
                                        <div class="text-end">
                                            <div class="text-gold fw-bold">$${fmtNum(r.price)}</div>
                                            <div class="text-muted small">per unit</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="trade-form-card" id="buy-form-card">
                        <div class="text-center text-muted py-5">
                            <span style="font-size: 2rem;">👆</span>
                            <p class="mb-0">Select a resource to buy</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render sell resources panel
     */
    renderSellPanel() {
        const resources = Object.keys(this.userResources)
            .filter(type => (this.userResources[type]?.amount || 0) > 0)
            .map(type => ({
                type,
                price: this.prices[type] || 0,
                owned: this.userResources[type]?.amount || 0
            }));

        if (resources.length === 0) {
            return `
                <div class="text-center py-5">
                    <span style="font-size: 3rem;">📦</span>
                    <h5 class="mt-3">No Resources to Sell</h5>
                    <p class="text-muted">You don't have any resources in your warehouses.</p>
                    <a href="/cities" class="btn btn-outline-light">Go to Cities</a>
                </div>
            `;
        }

        return `
            <div class="row">
                <div class="col-lg-8">
                    <h6 class="text-muted mb-3">Your Resources</h6>
                    <div class="row g-3">
                        ${resources.map(r => `
                            <div class="col-md-6 col-lg-4">
                                <div class="trade-resource-card" onclick="tradeMarket.selectResource('${r.type}', 'sell')">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div>
                                            <div class="fw-bold">${tradeMarket.getResourceIcon(r.type)} ${r.type}</div>
                                            <div class="text-muted small">Owned: ${fmtNum(r.owned)}</div>
                                        </div>
                                        <div class="text-end">
                                            <div class="text-gold fw-bold">$${fmtNum(r.price)}</div>
                                            <div class="text-muted small">sell price</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="trade-form-card" id="sell-form-card">
                        <div class="text-center text-muted py-5">
                            <span style="font-size: 2rem;">👆</span>
                            <p class="mb-0">Select a resource to sell</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render price history panel
     */
    renderHistoryPanel() {
        const resources = Object.keys(this.prices);

        return `
            <div class="text-center py-5">
                <span style="font-size: 3rem;">📊</span>
                <h5 class="mt-3">Price History</h5>
                <p class="text-muted">Real price history will appear here once the market engine records trades.</p>
            </div>
        `;
    },

    /**
     * Render orders panel
     */
    renderOrdersPanel() {
        if (this.orders.length === 0) {
            return `
                <div class="text-center py-5">
                    <span style="font-size: 3rem;">📋</span>
                    <h5 class="mt-3">No Active Orders</h5>
                    <p class="text-muted">You don't have any active buy or sell orders.</p>
                </div>
            `;
        }

        return `
            <div class="table-responsive">
                <table class="table table-dark table-sm">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Resource</th>
                            <th>Amount</th>
                            <th>Price</th>
                            <th>Total</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.orders.map(o => `
                            <tr>
                                <td><span class="badge ${o.type === 'buy' ? 'bg-success' : 'bg-danger'}">${o.type.toUpperCase()}</span></td>
                                <td>${tradeMarket.getResourceIcon(o.resource)} ${o.resource}</td>
                                <td>${fmtNum(o.amount)}</td>
                                <td class="text-gold">$${fmtNum(o.price)}</td>
                                <td class="fw-bold">$${fmtNum(o.amount * o.price)}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-danger" onclick="tradeMarket.cancelOrder('${o.order_id}')">Cancel</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Generate sample price history
     */
    /**
     * Switch between tabs
     */
    switchTab(tab) {
        document.querySelectorAll('.trade-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.trade-tab[data-tab="${tab}"]`).classList.add('active');

        document.querySelectorAll('.trade-panel').forEach(p => p.classList.add('d-none'));
        document.getElementById(`trade-panel-${tab}`).classList.remove('d-none');

        if (tab === 'history') {
            // History chart uses real server data — disabled for now
        }
    },

    /**
     * Select resource for trading
     */
    selectResource(type, side) {
        const price = this.prices[type] || 0;
        const owned = this.userResources[type]?.amount || 0;

        const formCard = document.getElementById(`${side}-form-card`);
        formCard.innerHTML = `
            <h6 class="mb-3">${side === 'buy' ? 'Buy' : 'Sell'} ${type}</h6>
            <div class="trade-price-info mb-3">
                <div class="trade-price">
                    <div class="trade-price-label">Current Price</div>
                    <div class="trade-price-value">$${fmtNum(price)}</div>
                </div>
                ${side === 'sell' ? `
                <div class="trade-price">
                    <div class="trade-price-label">Available</div>
                    <div class="trade-price-value">${fmtNum(owned)}</div>
                </div>
                ` : ''}
            </div>
            <div class="trade-input-group">
                <label>Amount</label>
                <input type="number" id="trade-amount" class="form-control" min="1" max="${side === 'sell' ? owned : 1000000}" value="100">
            </div>
            <div class="mb-3 text-muted small">
                Total: <span class="text-gold fw-bold" id="trade-total">$${fmtNum(price * 100)}</span>
            </div>
            <div class="trade-actions">
                <button class="trade-btn ${side}" onclick="tradeMarket.submitTrade('${type}', '${side}')">
                    ${side === 'buy' ? 'Buy' : 'Sell'} ${type}
                </button>
            </div>
            <div class="mt-3">
                <input type="number" id="trade-price" class="form-control" placeholder="Custom price (optional)" value="${price}">
                <small class="text-muted">Leave empty for market price</small>
            </div>
        `;

        // Add amount change listener
        document.getElementById('trade-amount').addEventListener('input', (e) => {
            const amount = parseInt(e.target.value) || 0;
            const tradePrice = parseFloat(document.getElementById('trade-price').value) || price;
            document.getElementById('trade-total').textContent = '$' + fmtNum(tradePrice * amount);
        });

        document.getElementById('trade-price').addEventListener('input', (e) => {
            const amount = parseInt(document.getElementById('trade-amount').value) || 0;
            const tradePrice = parseFloat(e.target.value) || price;
            document.getElementById('trade-total').textContent = '$' + fmtNum(tradePrice * amount);
        });
    },

    /**
     * Submit trade order
     */
    async submitTrade(type, side) {
        const amount = parseInt(document.getElementById('trade-amount').value);
        const customPrice = document.getElementById('trade-price').value;
        const price = customPrice ? parseFloat(customPrice) : this.prices[type] || 0;

        if (!amount || amount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        if (side === 'sell') {
            const owned = this.userResources[type]?.amount || 0;
            if (amount > owned) {
                showToast('Not enough resources', 'error');
                return;
            }
        }

        try {
            const resp = await api.post('/api/web/market/order', {
                type,
                side,
                amount,
                price
            });

            if (resp?.success) {
                showToast(`Order placed: ${side} ${amount} ${type}`, 'success');
                this.loadData();
                this.render();
            } else {
                showToast(resp?.message || 'Order failed', 'error');
            }
        } catch (err) {
            showToast(err.message || 'Trade failed', 'error');
        }
    },

    /**
     * Cancel an order
     */
    async cancelOrder(orderId) {
        try {
            const resp = await api.del(`/api/web/market/orders/${orderId}`);
            if (resp?.success) {
                showToast('Order cancelled', 'success');
                this.orders = this.orders.filter(o => o.order_id !== orderId);
                this.render();
            }
        } catch (err) {
            showToast(err.message || 'Failed to cancel order', 'error');
        }
    },

    /**
     * Update history chart
     */
    /**
     * Get resource icon
     */
    getResourceIcon(type) {
        const icons = {
            GRAIN: '🌾', TIMBER: '🪵', FISH: '🐟', LIVESTOCK: '🐄',
            COAL: '⚫', IRON: '🔩', COPPER: '🥉', LIMESTONE: '🪨',
            OIL: '🛢️', LEAD: '◼', SPICES: '🌶️', GOLD: '🪙',
            GEMSTONES: '💎', TITANIUM: '🔷', URANIUM: '☢️', CASH: '💰'
        };
        return icons[type] || '📦';
    }
};

// Toast notification helper
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
            <span class="toast-message">${esc(message)}</span>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('trade-market-section')) {
        const check = setInterval(() => {
            if (auth?.initialized) {
                clearInterval(check);
                tradeMarket.init();
            }
        }, 100);
    }
});

// Add CSS for trade resource cards
const style = document.createElement('style');
style.textContent = `
    .trade-resource-card {
        background: var(--bg-input);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        padding: 14px;
        cursor: pointer;
        transition: all 0.15s;
    }
    .trade-resource-card:hover {
        border-color: var(--accent-primary);
        transform: translateY(-2px);
        box-shadow: var(--shadow);
    }
    .trade-form-card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        padding: 20px;
        position: sticky;
        top: 80px;
    }
    .toast-container {
        position: fixed;
        top: 70px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
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
    .toast-info { border-left: 3px solid var(--accent-info); }
    .toast-content { display: flex; align-items: center; gap: 10px; }
    .toast-icon { font-weight: 700; }
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);