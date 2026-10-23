class EconomyPanel {
    constructor() {
        this.isInitialized = false;
        this.currentTab = 'overview';
        this.selectedResource = null;
        this.selectedOfferType = 'buy';
    }

    /**
     * Initialize the economy panel
     */
    initialize() {
        if (this.isInitialized) return;
        
        this.bindEvents();
        this.isInitialized = true;
        console.log('EconomyPanel initialized');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Listen for economy updates
        EventBus.on('market_buy_offer_created', this.handleOfferCreated, this);
        EventBus.on('market_sell_offer_created', this.handleOfferCreated, this);
        EventBus.on('market_buy_offer_accepted', this.handleOfferAccepted, this);
        EventBus.on('market_sell_offer_accepted', this.handleOfferAccepted, this);
        EventBus.on('market_offer_cancelled', this.handleOfferCancelled, this);
        EventBus.on('market_offer_cancelled_returned', this.handleOfferReturned, this);
        EventBus.on(GameEvents.RESOURCES_CHANGED, this.refresh, this);
        EventBus.on(GameEvents.DAY_PASSED, this.refresh, this);
    }

    /**
     * Render the economy panel
     */
    render() {
        if (!window.EconomySystem) {
            return '<div class="error">Economy System not available</div>';
        }

        return `
            <div class="economy-panel">
                <div class="economy-header">
                    <h2>Economic Management</h2>
                    <div class="economy-tabs">
                        <button class="tab-btn ${this.currentTab === 'overview' ? 'active' : ''}" 
                                onclick="EconomyPanel.switchTab('overview')">Overview</button>
                        <button class="tab-btn ${this.currentTab === 'market' ? 'active' : ''}" 
                                onclick="EconomyPanel.switchTab('market')">Market</button>
                        <button class="tab-btn ${this.currentTab === 'indicators' ? 'active' : ''}" 
                                onclick="EconomyPanel.switchTab('indicators')">Indicators</button>
                        <button class="tab-btn ${this.currentTab === 'history' ? 'active' : ''}" 
                                onclick="EconomyPanel.switchTab('history')">History</button>
                    </div>
                </div>
                <div class="economy-content">
                    ${this.renderTabContent()}
                </div>
            </div>
        `;
    }

    /**
     * Render content for current tab
     */
    renderTabContent() {
        switch (this.currentTab) {
            case 'overview':
                return this.renderOverview();
            case 'market':
                return this.renderMarket();
            case 'indicators':
                return this.renderIndicators();
            case 'history':
                return this.renderHistory();
            default:
                return '<div>Tab not found</div>';
        }
    }
    /**
     * Render overview tab
     */
    renderOverview() {
        const economicData = window.EconomySystem.getEconomicOverview();
        
        return `
            <div class="overview-tab">
                <div class="economic-summary">
                    <h3>Economic Summary</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <label>GDP Growth</label>
                            <span class="${economicData.indicators.gdpGrowth >= 0 ? 'positive' : 'negative'}">
                                ${(economicData.indicators.gdpGrowth * 100).toFixed(2)}%
                            </span>
                        </div>
                        <div class="summary-item">
                            <label>Inflation Rate</label>
                            <span class="${economicData.indicators.inflation <= 5 ? 'positive' : 'negative'}">
                                ${(economicData.indicators.inflation * 100).toFixed(2)}%
                            </span>
                        </div>
                        <div class="summary-item">
                            <label>Unemployment</label>
                            <span class="${economicData.indicators.unemployment <= 5 ? 'positive' : 'negative'}">
                                ${(economicData.indicators.unemployment * 100).toFixed(2)}%
                            </span>
                        </div>
                        <div class="summary-item">
                            <label>Economic Index</label>
                            <span class="${economicData.indicators.economicIndex >= 100 ? 'positive' : 'negative'}">
                                ${economicData.indicators.economicIndex.toFixed(1)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="resource-overview">
                    <h3>Resource Overview</h3>
                    ${this.renderResourceOverview()}
                </div>
                
                <div class="trade-overview">
                    <h3>Trade Overview</h3>
                    <div class="trade-summary">
                        <div class="trade-item">
                            <label>Trade Balance:</label>
                            <span class="${economicData.trade.tradeBalance >= 0 ? 'positive' : 'negative'}">
                                $${this.formatNumber(economicData.trade.tradeBalance)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render resource overview
     */
    renderResourceOverview() {
        if (!window.Nation || !window.ResourceSystem) return '<div>Resource data unavailable</div>';
        
        const allResources = window.ResourceSystem.getAllResources();
        let html = '<div class="resource-grid">';
        
        // Basic resources
        html += '<div class="resource-category"><h4>Basic Resources</h4>';
        allResources.basic.forEach(resource => {
            const amount = window.Nation.resources[resource] || 0;
            const productionInfo = window.ResourceSystem.getResourceInfo(resource);
            
            html += `
                <div class="resource-item">
                    <span class="resource-name">${this.capitalize(resource)}</span>
                    <span class="resource-amount">${this.formatNumber(amount)}</span>
                </div>
            `;
        });
        html += '</div>';
        
        // Manufactured resources
        html += '<div class="resource-category"><h4>Manufactured Resources</h4>';
        allResources.manufactured.forEach(resource => {
            const amount = window.Nation.resources[resource] || 0;
            
            html += `
                <div class="resource-item">
                    <span class="resource-name">${this.capitalize(resource)}</span>
                    <span class="resource-amount">${this.formatNumber(amount)}</span>
                </div>
            `;
        });
        html += '</div>';
        
        html += '</div>';
        return html;
    }
    /**
     * Render market tab - Main trading interface
     */
    renderMarket() {
        if (!window.EconomySystem) return '<div>Economy System not available</div>';
        
        return `
            <div class="market-tab">
                <div class="market-header">
                    <h3>Resource Market</h3>
                    <div class="market-nav">
                        <button class="market-nav-btn ${this.selectedOfferType === 'buy' ? 'active' : ''}" 
                                onclick="EconomyPanel.switchMarketTab('buy')">Buy Offers</button>
                        <button class="market-nav-btn ${this.selectedOfferType === 'sell' ? 'active' : ''}" 
                                onclick="EconomyPanel.switchMarketTab('sell')">Sell Offers</button>
                        <button class="market-nav-btn ${this.selectedOfferType === 'create' ? 'active' : ''}" 
                                onclick="EconomyPanel.switchMarketTab('create')">Create Offer</button>
                        <button class="market-nav-btn ${this.selectedOfferType === 'my-offers' ? 'active' : ''}" 
                                onclick="EconomyPanel.switchMarketTab('my-offers')">My Offers</button>
                    </div>
                </div>
                
                <div class="market-content">
                    ${this.renderMarketContent()}
                </div>
            </div>
        `;
    }

    /**
     * Render market content based on selected tab
     */
    renderMarketContent() {
        switch (this.selectedOfferType) {
            case 'buy':
                return this.renderBuyOffers();
            case 'sell':
                return this.renderSellOffers();
            case 'create':
                return this.renderCreateOffer();
            case 'my-offers':
                return this.renderMyOffers();
            default:
                return this.renderBuyOffers();
        }
    }

    /**
     * Render buy offers (where players want to buy resources)
     */
    renderBuyOffers() {
        const offers = window.EconomySystem.getMarketOffers();
        const buyOffers = offers.buyOffers.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
        
        if (buyOffers.length === 0) {
            return '<div class="no-offers">No buy offers available</div>';
        }
        
        let html = `
            <div class="offers-section">
                <h4>Available Buy Offers (Players want to buy these resources)</h4>
                <div class="offers-table">
                    <div class="offer-header">
                        <span>Resource</span>
                        <span>Amount</span>
                        <span>Price/Unit</span>
                        <span>Total Value</span>
                        <span>Action</span>
                    </div>
        `;
        
        buyOffers.forEach(offer => {
            const canSell = this.canPlayerSellToOffer(offer);
            const playerHas = window.Nation.resources[offer.resource] || 0;
            
            html += `
                <div class="offer-row ${canSell ? 'can-trade' : 'cannot-trade'}">
                    <span class="resource-name">${this.capitalize(offer.resource)}</span>
                    <span class="amount">${this.formatNumber(offer.amount)}</span>
                    <span class="price">$${offer.pricePerUnit.toFixed(2)}</span>
                    <span class="total-value">$${this.formatNumber(offer.totalValue)}</span>
                    <span class="action">
                        <button class="sell-btn ${canSell ? '' : 'disabled'}" 
                                ${canSell ? `onclick="EconomyPanel.acceptBuyOffer(${offer.id})"` : 'disabled'}>
                            Sell to Them
                        </button>
                        <div class="player-has">You have: ${this.formatNumber(playerHas)}</div>
                    </span>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    /**
     * Render sell offers (where players want to sell resources)
     */
    renderSellOffers() {
        const offers = window.EconomySystem.getMarketOffers();
        const sellOffers = offers.sellOffers.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
        
        if (sellOffers.length === 0) {
            return '<div class="no-offers">No sell offers available</div>';
        }
        
        let html = `
            <div class="offers-section">
                <h4>Available Sell Offers (Players want to sell these resources)</h4>
                <div class="offers-table">
                    <div class="offer-header">
                        <span>Resource</span>
                        <span>Amount</span>
                        <span>Price/Unit</span>
                        <span>Total Cost</span>
                        <span>Action</span>
                    </div>
        `;
        
        sellOffers.forEach(offer => {
            const canBuy = this.canPlayerBuyOffer(offer);
            
            html += `
                <div class="offer-row ${canBuy ? 'can-trade' : 'cannot-trade'}">
                    <span class="resource-name">${this.capitalize(offer.resource)}</span>
                    <span class="amount">${this.formatNumber(offer.amount)}</span>
                    <span class="price">$${offer.pricePerUnit.toFixed(2)}</span>
                    <span class="total-cost">$${this.formatNumber(offer.totalValue)}</span>
                    <span class="action">
                        <button class="buy-btn ${canBuy ? '' : 'disabled'}" 
                                ${canBuy ? `onclick="EconomyPanel.acceptSellOffer(${offer.id})"` : 'disabled'}>
                            Buy from Them
                        </button>
                        <div class="player-money">You have: $${this.formatNumber(window.Nation.money)}</div>
                    </span>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }

    /**
     * Render create offer interface
     */
    renderCreateOffer() {
        if (!window.ResourceSystem) return '<div>Resource system not available</div>';
        
        const allResources = window.ResourceSystem.getAllResources();
        const tradableResources = [...allResources.basic, ...allResources.manufactured];
        
        return `
            <div class="create-offer-section">
                <h4>Create New Market Offer</h4>
                
                <div class="offer-type-selector">
                    <label>
                        <input type="radio" name="offer-type" value="buy" checked 
                               onchange="EconomyPanel.updateCreateOfferType()">
                        Create Buy Offer (I want to buy)
                    </label>
                    <label>
                        <input type="radio" name="offer-type" value="sell" 
                               onchange="EconomyPanel.updateCreateOfferType()">
                        Create Sell Offer (I want to sell)
                    </label>
                </div>
                
                <div class="offer-form">
                    <div class="form-row">
                        <label for="offer-resource">Resource:</label>
                        <select id="offer-resource" onchange="EconomyPanel.updateResourceSelection()">
                            <option value="">Select Resource</option>
                            ${tradableResources.map(resource => 
                                `<option value="${resource}">${this.capitalize(resource)}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <label for="offer-amount">Amount:</label>
                        <input type="number" id="offer-amount" min="1" placeholder="Amount to trade">
                        <span id="resource-available"></span>
                    </div>
                    
                    <div class="form-row">
                        <label for="offer-price">Price per Unit:</label>
                        <input type="number" id="offer-price" min="0.01" step="0.01" placeholder="Price per unit">
                    </div>
                    
                    <div class="form-row total-row">
                        <label>Total Value:</label>
                        <span id="total-value">$0.00</span>
                    </div>
                    
                    <div class="form-actions">
                        <button id="create-offer-btn" onclick="EconomyPanel.createOffer()" disabled>
                            Create Offer
                        </button>
                    </div>
                </div>
                
                <div class="offer-help">
                    <h5>How it works:</h5>
                    <ul>
                        <li><strong>Buy Offers:</strong> Your money will be held in escrow until someone sells to you</li>
                        <li><strong>Sell Offers:</strong> Your resources will be held in escrow until someone buys from you</li>
                        <li><strong>Cancellation:</strong> Cancelled offers return resources/money after 12 turns</li>
                        <li><strong>Only tradeable resources:</strong> Basic and manufactured resources can be traded</li>
                    </ul>
                </div>
            </div>
        `;
    }
    /**
     * Render my offers tab
     */
    renderMyOffers() {
        if (!window.Player) return '<div>Player data not available</div>';
        
        const myOffers = window.EconomySystem.getPlayerOffers(window.Player.playerId);
        const escrow = window.EconomySystem.getPlayerEscrow(window.Player.playerId);
        
        let html = `
            <div class="my-offers-section">
                <h4>My Active Offers</h4>
        `;
        
        // Buy offers
        if (myOffers.buyOffers.length > 0) {
            html += `
                <div class="my-buy-offers">
                    <h5>My Buy Offers</h5>
                    <div class="offers-table">
                        <div class="offer-header">
                            <span>Resource</span>
                            <span>Amount</span>
                            <span>Price/Unit</span>
                            <span>Total Value</span>
                            <span>Action</span>
                        </div>
            `;
            
            myOffers.buyOffers.forEach(offer => {
                html += `
                    <div class="offer-row my-offer">
                        <span class="resource-name">${this.capitalize(offer.resource)}</span>
                        <span class="amount">${this.formatNumber(offer.amount)}</span>
                        <span class="price">$${offer.pricePerUnit.toFixed(2)}</span>
                        <span class="total-value">$${this.formatNumber(offer.totalValue)}</span>
                        <span class="action">
                            <button class="cancel-btn" onclick="EconomyPanel.cancelOffer(${offer.id})">
                                Cancel
                            </button>
                        </span>
                    </div>
                `;
            });
            
            html += '</div></div>';
        }
        
        // Sell offers
        if (myOffers.sellOffers.length > 0) {
            html += `
                <div class="my-sell-offers">
                    <h5>My Sell Offers</h5>
                    <div class="offers-table">
                        <div class="offer-header">
                            <span>Resource</span>
                            <span>Amount</span>
                            <span>Price/Unit</span>
                            <span>Total Value</span>
                            <span>Action</span>
                        </div>
            `;
            
            myOffers.sellOffers.forEach(offer => {
                html += `
                    <div class="offer-row my-offer">
                        <span class="resource-name">${this.capitalize(offer.resource)}</span>
                        <span class="amount">${this.formatNumber(offer.amount)}</span>
                        <span class="price">$${offer.pricePerUnit.toFixed(2)}</span>
                        <span class="total-value">$${this.formatNumber(offer.totalValue)}</span>
                        <span class="action">
                            <button class="cancel-btn" onclick="EconomyPanel.cancelOffer(${offer.id})">
                                Cancel
                            </button>
                        </span>
                    </div>
                `;
            });
            
            html += '</div></div>';
        }
        
        // Show escrow status if any resources are in escrow
        if (Object.keys(escrow).length > 0) {
            html += `
                <div class="escrow-status">
                    <h5>Resources in Escrow</h5>
                    <div class="escrow-items">
            `;
            
            Object.entries(escrow).forEach(([resource, amount]) => {
                const displayName = resource === 'money' ? 'Money' : this.capitalize(resource);
                const displayValue = resource === 'money' ? `$${this.formatNumber(amount)}` : this.formatNumber(amount);
                
                html += `
                    <div class="escrow-item">
                        <span>${displayName}:</span>
                        <span>${displayValue}</span>
                    </div>
                `;
            });
            
            html += `
                    </div>
                    <div class="escrow-note">
                        <small>Resources in escrow are locked until offers are completed or cancelled</small>
                    </div>
                </div>
            `;
        }
        
        if (myOffers.buyOffers.length === 0 && myOffers.sellOffers.length === 0) {
            html += '<div class="no-offers">You have no active offers</div>';
        }
        
        html += '</div>';
        return html;
    }
    /**
     * Render indicators tab
     */
    renderIndicators() {
        const economicData = window.EconomySystem.getEconomicOverview();
        
        return `
            <div class="indicators-tab">
                <h3>Economic Indicators</h3>
                
                <div class="indicators-grid">
                    <div class="indicator-card">
                        <h4>GDP Growth Rate</h4>
                        <div class="indicator-value ${economicData.indicators.gdpGrowth >= 0 ? 'positive' : 'negative'}">
                            ${(economicData.indicators.gdpGrowth * 100).toFixed(2)}%
                        </div>
                        <div class="indicator-desc">Annual GDP growth rate</div>
                    </div>
                    
                    <div class="indicator-card">
                        <h4>Inflation Rate</h4>
                        <div class="indicator-value ${economicData.indicators.inflation <= 0.05 ? 'positive' : 'negative'}">
                            ${(economicData.indicators.inflation * 100).toFixed(2)}%
                        </div>
                        <div class="indicator-desc">Annual inflation rate</div>
                    </div>
                    
                    <div class="indicator-card">
                        <h4>Unemployment Rate</h4>
                        <div class="indicator-value ${economicData.indicators.unemployment <= 0.05 ? 'positive' : 'negative'}">
                            ${(economicData.indicators.unemployment * 100).toFixed(2)}%
                        </div>
                        <div class="indicator-desc">Percentage of workforce unemployed</div>
                    </div>
                    
                    <div class="indicator-card">
                        <h4>Economic Index</h4>
                        <div class="indicator-value ${economicData.indicators.economicIndex >= 100 ? 'positive' : 'negative'}">
                            ${economicData.indicators.economicIndex.toFixed(1)}
                        </div>
                        <div class="indicator-desc">Overall economic health (100 = baseline)</div>
                    </div>
                    
                    <div class="indicator-card">
                        <h4>Interest Rate</h4>
                        <div class="indicator-value neutral">
                            ${(economicData.indicators.interestRate * 100).toFixed(2)}%
                        </div>
                        <div class="indicator-desc">Base interest rate</div>
                    </div>
                    
                    <div class="indicator-card">
                        <h4>Trade Balance</h4>
                        <div class="indicator-value ${economicData.trade.tradeBalance >= 0 ? 'positive' : 'negative'}">
                            $${this.formatNumber(economicData.trade.tradeBalance)}
                        </div>
                        <div class="indicator-desc">Net trade balance</div>
                    </div>
                </div>
                
                <div class="market-prices">
                    <h4>Current Market Prices</h4>
                    ${this.renderMarketPrices()}
                </div>
            </div>
        `;
    }

    /**
     * Render market prices
     */
    renderMarketPrices() {
        const marketData = window.EconomySystem.getEconomicOverview().markets;
        
        let html = '<div class="prices-grid">';
        
        Object.entries(marketData.resources).forEach(([resource, data]) => {
            const changeClass = data.change.includes('+') ? 'positive' : 
                               data.change.includes('-') ? 'negative' : 'neutral';
            
            html += `
                <div class="price-item">
                    <span class="resource-name">${this.capitalize(resource)}</span>
                    <span class="price">$${data.price.toFixed(2)}</span>
                    <span class="change ${changeClass}">${data.change}</span>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    /**
     * Render history tab
     */
    renderHistory() {
        return `
            <div class="history-tab">
                <h3>Economic History</h3>
                <div class="history-charts">
                    <div class="chart-placeholder">
                        <h4>GDP Growth Over Time</h4>
                        <div class="chart-area">Chart visualization would go here</div>
                    </div>
                    
                    <div class="chart-placeholder">
                        <h4>Inflation Rate Over Time</h4>
                        <div class="chart-area">Chart visualization would go here</div>
                    </div>
                    
                    <div class="chart-placeholder">
                        <h4>Trade Balance Over Time</h4>
                        <div class="chart-area">Chart visualization would go here</div>
                    </div>
                </div>
                
                <div class="history-note">
                    <small>Detailed historical charts require chart library integration</small>
                </div>
            </div>
        `;
    }
    // ===============================
    // INTERACTION METHODS
    // ===============================

    /**
     * Switch tabs
     */
    static switchTab(tabName) {
        if (window.economyPanel) {
            window.economyPanel.currentTab = tabName;
            window.economyPanel.refresh();
        }
    }

    /**
     * Switch market tabs
     */
    static switchMarketTab(tabName) {
        if (window.economyPanel) {
            window.economyPanel.selectedOfferType = tabName;
            window.economyPanel.refresh();
        }
    }

    /**
     * Update create offer type
     */
    static updateCreateOfferType() {
        const offerType = document.querySelector('input[name="offer-type"]:checked')?.value;
        if (window.economyPanel) {
            window.economyPanel.selectedOfferType = 'create';
            window.economyPanel.refresh();
        }
    }

    /**
     * Update resource selection in create offer
     */
    static updateResourceSelection() {
        const resourceSelect = document.getElementById('offer-resource');
        const resource = resourceSelect?.value;
        
        if (resource && window.Nation) {
            const available = window.Nation.resources[resource] || 0;
            const availableElement = document.getElementById('resource-available');
            if (availableElement) {
                availableElement.textContent = `Available: ${window.economyPanel.formatNumber(available)}`;
            }
        }
        
        window.economyPanel.updateOfferCalculation();
    }

    /**
     * Update offer calculation
     */
    updateOfferCalculation() {
        const amountInput = document.getElementById('offer-amount');
        const priceInput = document.getElementById('offer-price');
        const totalElement = document.getElementById('total-value');
        const createBtn = document.getElementById('create-offer-btn');
        
        if (!amountInput || !priceInput || !totalElement || !createBtn) return;
        
        const amount = parseFloat(amountInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = amount * price;
        
        totalElement.textContent = `$${this.formatNumber(total)}`;
        
        // Enable/disable create button based on validation
        const resource = document.getElementById('offer-resource')?.value;
        const offerType = document.querySelector('input[name="offer-type"]:checked')?.value;
        
        const isValid = this.validateOfferInputs(resource, amount, price, offerType);
        createBtn.disabled = !isValid;
        
        if (isValid) {
            createBtn.classList.remove('disabled');
        } else {
            createBtn.classList.add('disabled');
        }
    }

    /**
     * Validate offer inputs
     */
    validateOfferInputs(resource, amount, price, offerType) {
        if (!resource || !amount || !price || amount <= 0 || price <= 0) return false;
        if (!window.Nation || !window.Player) return false;
        
        if (offerType === 'buy') {
            const totalCost = amount * price;
            return window.Nation.money >= totalCost;
        } else if (offerType === 'sell') {
            const available = window.Nation.resources[resource] || 0;
            return available >= amount;
        }
        
        return false;
    }

    /**
     * Create new offer
     */
    static createOffer() {
        const resource = document.getElementById('offer-resource')?.value;
        const amount = parseFloat(document.getElementById('offer-amount')?.value) || 0;
        const price = parseFloat(document.getElementById('offer-price')?.value) || 0;
        const offerType = document.querySelector('input[name="offer-type"]:checked')?.value;
        
        if (!window.Player || !window.EconomySystem) {
            alert('System not available');
            return;
        }
        
        try {
            if (offerType === 'buy') {
                window.EconomySystem.createBuyOffer(window.Player.playerId, resource, amount, price);
                alert(`Buy offer created for ${amount} ${resource} at $${price.toFixed(2)} per unit`);
            } else if (offerType === 'sell') {
                window.EconomySystem.createSellOffer(window.Player.playerId, resource, amount, price);
                alert(`Sell offer created for ${amount} ${resource} at $${price.toFixed(2)} per unit`);
            }
            
            // Clear form and refresh
            document.getElementById('offer-resource').value = '';
            document.getElementById('offer-amount').value = '';
            document.getElementById('offer-price').value = '';
            document.getElementById('resource-available').textContent = '';
            
            window.economyPanel.selectedOfferType = 'my-offers';
            window.economyPanel.refresh();
            
        } catch (error) {
            alert(`Error creating offer: ${error.message}`);
        }
    }
    /**
     * Accept a buy offer (sell to buyer)
     */
    static acceptBuyOffer(offerId) {
        if (!window.Player || !window.EconomySystem) {
            alert('System not available');
            return;
        }
        
        try {
            window.EconomySystem.acceptBuyOffer(offerId, window.Player.playerId);
            alert('Successfully sold resources!');
            window.economyPanel.refresh();
        } catch (error) {
            alert(`Error accepting offer: ${error.message}`);
        }
    }

    /**
     * Accept a sell offer (buy from seller)
     */
    static acceptSellOffer(offerId) {
        if (!window.Player || !window.EconomySystem) {
            alert('System not available');
            return;
        }
        
        try {
            window.EconomySystem.acceptSellOffer(offerId, window.Player.playerId);
            alert('Successfully bought resources!');
            window.economyPanel.refresh();
        } catch (error) {
            alert(`Error accepting offer: ${error.message}`);
        }
    }

    /**
     * Cancel an offer
     */
    static cancelOffer(offerId) {
        if (!window.Player || !window.EconomySystem) {
            alert('System not available');
            return;
        }
        
        if (!confirm('Are you sure you want to cancel this offer? Resources will be returned after 12 turns.')) {
            return;
        }
        
        try {
            const result = window.EconomySystem.cancelOffer(offerId, window.Player.playerId);
            alert(`Offer cancelled. Resources will be returned on turn ${result.returnDate}.`);
            window.economyPanel.refresh();
        } catch (error) {
            alert(`Error cancelling offer: ${error.message}`);
        }
    }

    // ===============================
    // HELPER METHODS
    // ===============================

    /**
     * Check if player can sell to a buy offer
     */
    canPlayerSellToOffer(offer) {
        if (!window.Nation) return false;
        const playerHas = window.Nation.resources[offer.resource] || 0;
        return playerHas >= offer.amount;
    }

    /**
     * Check if player can buy from a sell offer
     */
    canPlayerBuyOffer(offer) {
        if (!window.Nation) return false;
        return window.Nation.money >= offer.totalValue;
    }

    /**
     * Format numbers with commas
     */
    formatNumber(num) {
        if (typeof num !== 'number') return '0';
        return Math.floor(num).toLocaleString();
    }

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Refresh the panel
     */
    refresh() {
        // Update the panel content if it's currently displayed
        EventBus.emit('economy_panel_refresh_needed');
    }

    // ===============================
    // EVENT HANDLERS
    // ===============================

    handleOfferCreated(data) {
        this.refresh();
    }

    handleOfferAccepted(data) {
        this.refresh();
    }

    handleOfferCancelled(data) {
        this.refresh();
    }

    handleOfferReturned(data) {
        alert(`Cancelled offer returned: ${data.amount} ${data.resource}`);
        this.refresh();
    }

    /**
     * Cleanup when panel is destroyed
     */
    destroy() {
        EventBus.off('market_buy_offer_created', this.handleOfferCreated, this);
        EventBus.off('market_sell_offer_created', this.handleOfferCreated, this);
        EventBus.off('market_buy_offer_accepted', this.handleOfferAccepted, this);
        EventBus.off('market_sell_offer_accepted', this.handleOfferAccepted, this);
        EventBus.off('market_offer_cancelled', this.handleOfferCancelled, this);
        EventBus.off('market_offer_cancelled_returned', this.handleOfferReturned, this);
        EventBus.off(GameEvents.RESOURCES_CHANGED, this.refresh, this);
        EventBus.off(GameEvents.DAY_PASSED, this.refresh, this);
        
        this.isInitialized = false;
    }
}

// Create global instance
window.EconomyPanel = EconomyPanel;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EconomyPanel };
}