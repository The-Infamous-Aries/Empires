const empireControl = {
    nation: null,
    cities: [],
    resources: [],
    military: null,
    unitPrices: {},
    allianceData: null,
    allianceMembers: [],
    treaties: [],
    selectedCityId: null,

    async init() {
        document.getElementById('ec-loading').classList.remove('d-none');
        try {
            await this.loadAllData();
            document.getElementById('ec-loading').classList.add('d-none');
            document.getElementById('ec-content').classList.remove('d-none');
            this.renderAll();
            this.bindTabs();
        } catch (err) {
            document.getElementById('ec-loading').classList.add('d-none');
            document.getElementById('ec-no-nation').classList.remove('d-none');
            console.error('Empire control init failed:', err);
        }
    },

    async loadAllData() {
        const [overview, unitPrices] = await Promise.all([
            api.get('/api/web/empire/overview'),
            api.get('/api/web/military/prices')
        ]);

        if (!overview || !overview.nation) {
            throw new Error('No empire data');
        }

        this.nation = overview.nation;
        this.cities = overview.cities || [];
        this.resources = overview.resources || [];
        this.military = overview.military || null;
        this.treaties = overview.treaties || [];
        this.allianceData = overview.alliance || null;
        this.allianceMembers = overview.alliance_members || [];
        this.unitPrices = unitPrices?.prices || {};
    },

    renderAll() {
        this.renderStats();
        this.renderNationCard();
        this.renderResourceSummary();
        this.renderWarsTreaties();
        this.renderProductionOverview();
        this.renderCitySelector();
        this.renderMilitaryTab();
        this.renderResourcesTab();
        this.renderAllianceTab();
        this.renderDiplomacyTab();
    },

    renderStats() {
        const n = this.nation;
        setText('ec-stat-score', fmtNum(n.score || 0));
        setText('ec-stat-cities', fmtNum(n.total_cities || this.cities.length || 0));
        setText('ec-stat-pop', fmtNum(n.total_population || 0));
        setText('ec-stat-infra', fmtNum(n.total_infrastructure || 0));
        setText('ec-stat-land', fmtNum(n.total_land || 0));
        setText('ec-stat-cash', '$' + fmtNum(Math.floor(n.cash || 0)));
    },

    renderNationCard() {
        const n = this.nation;
        setText('ec-nation-name-display', '🏰 ' + (n.nation_name || 'My Empire'));
        setText('ec-ruler', n.ruler_name || '—');
        setText('ec-capital', n.capital_city_name || '—');
        setText('ec-government', (n.government_type || '—').replace(/_/g, ' '));
        setText('ec-war-policy', (n.war_policy_type || '—').replace(/_/g, ' '));
        setText('ec-dom-policy', (n.domestic_policy_type || '—').replace(/_/g, ' '));
        setText('ec-happiness', n.happiness != null ? n.happiness : '—');

        const colorEl = document.getElementById('ec-color');
        if (colorEl) {
            const sphere = colorEl.querySelector('.color-sphere');
            if (sphere) sphere.style.background = colorHex(n.national_color);
            const txt = colorEl.querySelector('.color-text');
            if (txt) txt.textContent = n.national_color || '—';
        }

        const allyEl = document.getElementById('ec-alliance');
        if (this.allianceData) {
            allyEl.innerHTML = `<a href="/alliance/${this.allianceData.alliance_id}">${esc(this.allianceData.name || 'View')}</a>`;
        } else {
            allyEl.textContent = 'None';
        }

        const badgesEl = document.getElementById('ec-nation-badges');
        let badges = '';
        if (n.is_beige) badges += '<span class="badge bg-info ms-1">🛡️ Beige</span>';
        if (n.anarchy_ticks_remaining > 0) badges += '<span class="badge bg-danger ms-1">⚡ Anarchy</span>';
        if (badgesEl) badgesEl.innerHTML = badges;
    },

    renderResourceSummary() {
        const el = document.getElementById('ec-resource-summary');
        if (!this.resources || this.resources.length === 0) {
            el.innerHTML = '<div class="text-center text-secondary py-4">No resource data</div>';
            return;
        }
        const keyRes = ['CASH', 'GRAIN', 'OIL', 'IRON', 'COAL', 'GOLD', 'URANIUM'];
        const filtered = this.resources.filter(r => keyRes.includes(r.resource_type));
        if (filtered.length === 0) {
            el.innerHTML = this.resources.slice(0, 5).map(r => this.renderResourceRow(r)).join('');
            return;
        }
        el.innerHTML = filtered.map(r => this.renderResourceRow(r)).join('');
    },

    renderResourceRow(r) {
        const icon = getResourceIcon(r.resource_type);
        const amt = fmtNum(Math.floor(r.amount || 0));
        const prod = r.production != null ? fmtNum(r.production) : '—';
        return `<div class="d-flex justify-content-between align-items-center py-1 border-bottom border-theme">
            <span>${icon} ${r.resource_type}</span>
            <span><strong>${amt}</strong> <span class="text-muted small">(prod: ${prod})</span></span>
        </div>`;
    },

    renderWarsTreaties() {
        const el = document.getElementById('ec-wars-treaties');
        const activeTreaties = (this.treaties || []).filter(t => t.status === 'ACTIVE');
        const warCount = this.nation.active_wars || 0;

        let html = '';
        if (warCount > 0) {
            html += `<div class="d-flex justify-content-between py-2">
                <span><span class="badge bg-danger war-active-blink">⚔️ Active Wars</span></span>
                <span class="fw-bold text-danger">${warCount}</span>
            </div>`;
        } else {
            html += `<div class="d-flex justify-content-between py-2">
                <span>🕊️ At Peace</span>
                <span class="text-success">✓</span>
            </div>`;
        }
        html += `<div class="d-flex justify-content-between py-2">
            <span>📜 Active Treaties</span>
            <span class="fw-bold">${activeTreaties.length}</span>
        </div>`;
        html += `<div class="d-flex justify-content-between py-2">
            <span>🏙️ Total Cities</span>
            <span class="fw-bold">${fmtNum(this.nation.total_cities || this.cities.length || 0)}</span>
        </div>`;
        html += `<div class="d-flex justify-content-between py-2">
            <span>💵 Tax Rate</span>
            <span class="fw-bold">${this.nation.tax_rate != null ? this.nation.tax_rate + '%' : '—'}</span>
        </div>`;
        html += `<hr class="my-2"><a href="/wars" class="btn btn-sm btn-outline-light w-100">View All Wars</a>`;
        el.innerHTML = html;
    },

    renderProductionOverview() {
        const el = document.getElementById('ec-production-overview');
        if (!this.resources || this.resources.length === 0) {
            el.innerHTML = '<div class="text-center text-secondary py-3">No production data</div>';
            return;
        }
        const prodResources = this.resources.filter(r => r.resource_type !== 'CASH').slice(0, 8);
        el.innerHTML = `<div class="row g-2">${prodResources.map(r => {
            const icon = getResourceIcon(r.resource_type);
            const net = (r.production || 0) - (r.consumption || 0);
            const cls = net >= 0 ? 'text-success' : 'text-danger';
            return `<div class="col-md-3 col-6">
                <div class="d-flex justify-content-between py-1">
                    <span>${icon} ${r.resource_type}</span>
                    <span class="${cls}">${net >= 0 ? '+' : ''}${fmtNum(net)}</span>
                </div>
            </div>`;
        }).join('')}</div>`;
    },

    bindTabs() {
        const header = document.getElementById('ec-tabs-header');
        if (!header) return;
        header.querySelectorAll('.ec-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                header.querySelectorAll('.ec-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.ec-tab-content').forEach(c => c.classList.remove('active'));
                const tab = document.getElementById('ec-tab-' + btn.dataset.tab);
                if (tab) tab.classList.add('active');
            });
        });
    },

    renderCitySelector() {
        const sel = document.getElementById('ec-city-select');
        if (!sel) return;
        sel.innerHTML = '<option value="">— Select a city —</option>' +
            this.cities.map(c => `<option value="${c.city_id}">${esc(c.city_name || 'City')} (Infra: ${fmtNum(c.infrastructure || 0)}, Land: ${fmtNum(c.land || 0)})</option>`).join('');
    },

    selectCity(cityId) {
        this.selectedCityId = cityId;
        if (!cityId) {
            document.getElementById('ec-city-info').innerHTML = '<div class="text-center text-secondary py-4">Select a city to manage infrastructure and land</div>';
            document.getElementById('ec-infra-panel').innerHTML = '<div class="text-center text-secondary py-4">Select a city first</div>';
            document.getElementById('ec-land-panel').innerHTML = '<div class="text-center text-secondary py-4">Select a city first</div>';
            return;
        }
        const city = this.cities.find(c => c.city_id === cityId);
        if (!city) return;
        document.getElementById('ec-city-info').innerHTML = `
            <div class="d-flex justify-content-between py-1"><span class="text-secondary">City</span><span class="fw-bold">${esc(city.city_name)}</span></div>
            <div class="d-flex justify-content-between py-1"><span class="text-secondary">Infrastructure</span><span class="fw-bold">${fmtNum(city.infrastructure || 0)}</span></div>
            <div class="d-flex justify-content-between py-1"><span class="text-secondary">Land</span><span class="fw-bold">${fmtNum(city.land || 0)}</span></div>
            <div class="d-flex justify-content-between py-1"><span class="text-secondary">Population</span><span class="fw-bold">${fmtNum(Math.floor((city.population || 0) + (city.improv_pop || 0)))}</span></div>
        `;
        this.renderInfraPanel(city);
        this.renderLandPanel(city);
    },

    async renderInfraPanel(city) {
        const el = document.getElementById('ec-infra-panel');
        if (!city) { el.innerHTML = '<div class="text-center text-secondary py-4">Select a city first</div>'; return; }
        el.innerHTML = `
            <div class="mb-2"><span class="text-secondary">Current:</span> <strong>${fmtNum(city.infrastructure || 0)}</strong> infra</div>
            <div class="mb-2">
                <label class="form-label small">Buy Amount</label>
                <div class="input-group input-group-sm">
                    <input type="number" id="ec-infra-buy" class="form-control" value="10" min="1" max="500">
                    <button class="btn btn-success" onclick="empireControl.buyInfra()">Buy</button>
                </div>
            </div>
            <div class="mb-2">
                <label class="form-label small">Sell Amount</label>
                <div class="input-group input-group-sm">
                    <input type="number" id="ec-infra-sell" class="form-control" value="10" min="1" max="${Math.floor((city.infrastructure || 0) * 0.5)}">
                    <button class="btn btn-danger" onclick="empireControl.sellInfra()">Sell</button>
                </div>
            </div>
            <div class="text-muted small mt-2">Cost varies by level × city count</div>
        `;
    },

    async renderLandPanel(city) {
        const el = document.getElementById('ec-land-panel');
        if (!city) { el.innerHTML = '<div class="text-center text-secondary py-4">Select a city first</div>'; return; }
        el.innerHTML = `
            <div class="mb-2"><span class="text-secondary">Current:</span> <strong>${fmtNum(city.land || 0)}</strong> land</div>
            <div class="mb-2">
                <label class="form-label small">Buy Amount</label>
                <div class="input-group input-group-sm">
                    <input type="number" id="ec-land-buy" class="form-control" value="10" min="1" max="500">
                    <button class="btn btn-success" onclick="empireControl.buyLand()">Buy</button>
                </div>
            </div>
            <div class="mb-2">
                <label class="form-label small">Sell Amount</label>
                <div class="input-group input-group-sm">
                    <input type="number" id="ec-land-sell" class="form-control" value="10" min="1" max="${Math.floor((city.land || 0) * 0.5)}">
                    <button class="btn btn-danger" onclick="empireControl.sellLand()">Sell</button>
                </div>
            </div>
            <div class="text-muted small mt-2">Cost varies by level × city count</div>
        `;
    },

    async buyInfra() {
        if (!this.selectedCityId) return;
        const amount = parseInt(document.getElementById('ec-infra-buy').value);
        if (!amount || amount <= 0) return showToast('Enter a valid amount', 'error');
        try {
            const resp = await api.post('/api/web/city/infra', { city_id: this.selectedCityId, amount, action: 'buy' });
            if (resp?.success) { showToast(resp.message || 'Infrastructure purchased', 'success'); await this.reloadData(); }
            else { showToast(resp?.message || 'Purchase failed', 'error'); }
        } catch (err) { showToast(err.message || 'Purchase failed', 'error'); }
    },

    async sellInfra() {
        if (!this.selectedCityId) return;
        const amount = parseInt(document.getElementById('ec-infra-sell').value);
        if (!amount || amount <= 0) return showToast('Enter a valid amount', 'error');
        try {
            const resp = await api.post('/api/web/city/infra', { city_id: this.selectedCityId, amount, action: 'sell' });
            if (resp?.success) { showToast(resp.message || 'Infrastructure sold', 'success'); await this.reloadData(); }
            else { showToast(resp?.message || 'Sale failed', 'error'); }
        } catch (err) { showToast(err.message || 'Sale failed', 'error'); }
    },

    async buyLand() {
        if (!this.selectedCityId) return;
        const amount = parseInt(document.getElementById('ec-land-buy').value);
        if (!amount || amount <= 0) return showToast('Enter a valid amount', 'error');
        try {
            const resp = await api.post('/api/web/city/land', { city_id: this.selectedCityId, amount, action: 'buy' });
            if (resp?.success) { showToast(resp.message || 'Land purchased', 'success'); await this.reloadData(); }
            else { showToast(resp?.message || 'Purchase failed', 'error'); }
        } catch (err) { showToast(err.message || 'Purchase failed', 'error'); }
    },

    async sellLand() {
        if (!this.selectedCityId) return;
        const amount = parseInt(document.getElementById('ec-land-sell').value);
        if (!amount || amount <= 0) return showToast('Enter a valid amount', 'error');
        try {
            const resp = await api.post('/api/web/city/land', { city_id: this.selectedCityId, amount, action: 'sell' });
            if (resp?.success) { showToast(resp.message || 'Land sold', 'success'); await this.reloadData(); }
            else { showToast(resp?.message || 'Sale failed', 'error'); }
        } catch (err) { showToast(err.message || 'Sale failed', 'error'); }
    },

    async reloadData() {
        const prevCity = this.selectedCityId;
        await this.loadAllData();
        this.renderStats();
        this.renderNationCard();
        this.renderResourceSummary();
        this.renderWarsTreaties();
        this.renderProductionOverview();
        this.renderCitySelector();
        if (prevCity) {
            this.selectedCityId = prevCity;
            document.getElementById('ec-city-select').value = prevCity;
            const city = this.cities.find(c => c.city_id === prevCity);
            if (city) {
                this.renderInfraPanel(city);
                this.renderLandPanel(city);
            }
        }
        this.renderMilitaryTab();
        this.renderResourcesTab();
        this.renderAllianceTab();
        this.renderDiplomacyTab();
    },

    renderMilitaryTab() {
        const el = document.getElementById('ec-military-units');
        const scoreEl = document.getElementById('ec-military-score');
        if (!this.military) {
            el.innerHTML = '<div class="text-center text-secondary py-4">No military data</div>';
            return;
        }
        const m = this.military;

        const unitConfig = [
            { type: 'soldiers', icon: '⚔️', label: 'Soldiers' },
            { type: 'tanks', icon: '🔩', label: 'Tanks' },
            { type: 'fighters', icon: '✈️', label: 'Fighters' },
            { type: 'bombers', icon: '💣', label: 'Bombers' },
            { type: 'destroyers', icon: '🚢', label: 'Destroyers' },
            { type: 'cruisers', icon: '⛴️', label: 'Cruisers' },
            { type: 'battleships', icon: '🚢', label: 'Battleships' },
            { type: 'carriers', icon: '🛳️', label: 'Carriers' },
            { type: 'submarines', icon: '🔄', label: 'Submarines' },
            { type: 'cruise_missiles', icon: '🚀', label: 'Cruise Missiles' },
            { type: 'nuclear_weapons', icon: '☢️', label: 'Nukes' },
            { type: 'spies', icon: '🕵️', label: 'Spies' },
        ];

        el.innerHTML = unitConfig.map(cfg => {
            const count = this.military[cfg.type] || 0;
            const price = this.unitPrices[cfg.type] || 0;
            return `<div class="col-md-3 col-6">
                <div class="game-stat-card p-2 text-center">
                    <div style="font-size:1.5rem">${cfg.icon}</div>
                    <div class="fw-bold mt-1">${fmtNum(count)}</div>
                    <div class="text-muted small">${cfg.label}</div>
                    <div class="mt-1 d-flex gap-1">
                        <input type="number" id="ec-mil-buy-${cfg.type}" class="form-control form-control-sm" placeholder="Qty" min="1" style="width:55px">
                        <button class="btn btn-sm btn-success" onclick="empireControl.buyUnit('${cfg.type}')">Buy</button>
                    </div>
                    <div class="text-muted" style="font-size:.65rem">$${fmtNum(price)} each</div>
                </div>
            </div>`;
        }).join('');
    },

    async buyUnit(unitType) {
        const amount = parseInt(document.getElementById('ec-mil-buy-' + unitType)?.value);
        if (!amount || amount <= 0) return showToast('Enter a valid amount', 'error');
        try {
            const resp = await api.post('/api/web/military/buy', { unit_type: unitType, amount });
            if (resp?.success) { showToast(resp.message || 'Units purchased', 'success'); await this.reloadData(); }
            else { showToast(resp?.message || 'Purchase failed', 'error'); }
        } catch (err) { showToast(err.message || 'Purchase failed', 'error'); }
    },

    renderResourcesTab() {
        const tbody = document.getElementById('ec-resources-table-body');
        if (!this.resources || this.resources.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-4">No resource data</td></tr>';
            return;
        }
        tbody.innerHTML = this.resources.map(r => {
            const icon = getResourceIcon(r.resource_type);
            const amount = fmtNum(Math.floor(r.amount || 0));
            const prod = r.production != null ? fmtNum(r.production) : '—';
            const cons = r.consumption != null ? fmtNum(r.consumption) : '—';
            const net = (r.production || 0) - (r.consumption || 0);
            const netStr = r.production != null && r.consumption != null ? (net >= 0 ? '+' : '') + fmtNum(net) : '—';
            const netCls = net >= 0 ? 'text-success' : 'text-danger';
            return `<tr>
                <td>${icon} ${r.resource_type}</td>
                <td class="text-end">${amount}</td>
                <td class="text-end">${prod}</td>
                <td class="text-end">${cons}</td>
                <td class="text-end fw-bold ${netCls}">${netStr}</td>
            </tr>`;
        }).join('');
    },

    renderAllianceTab() {
        const infoEl = document.getElementById('ec-alliance-info');
        const bankEl = document.getElementById('ec-alliance-bank');
        const membersEl = document.getElementById('ec-alliance-members');
        const noEl = document.getElementById('ec-alliance-no');

        if (!this.allianceData) {
            if (noEl) noEl.classList.remove('d-none');
            infoEl.innerHTML = '<div class="text-center text-secondary py-4">You are not in an alliance</div>';
            bankEl.innerHTML = '<div class="text-center text-secondary py-4">Not in an alliance</div>';
            membersEl.innerHTML = '<tr><td colspan="4" class="text-center text-secondary py-4">Not in an alliance</td></tr>';
            return;
        }
        if (noEl) noEl.classList.add('d-none');

        const a = this.allianceData;
        infoEl.innerHTML = `
            <div class="d-flex justify-content-between py-1"><span class="text-secondary">Name</span><span class="fw-bold"><a href="/alliance/${a.alliance_id}">${esc(a.name || 'Unknown')}</a></span></div>
            <div class="d-flex justify-content-between py-1"><span class="text-secondary">Acronym</span><span class="fw-bold">${esc(a.acronym || '—')}</span></div>
            <div class="d-flex justify-content-between py-1"><span class="text-secondary">Members</span><span class="fw-bold">${fmtNum(a.member_count || this.allianceMembers.length || 0)}</span></div>
            <div class="d-flex justify-content-between py-1"><span class="text-secondary">Score</span><span class="fw-bold text-gold">${fmtNum(a.score || 0)}</span></div>
            <div class="d-flex justify-content-between py-1"><span class="text-secondary">Your Role</span><span class="fw-bold">${esc((a.my_role || 'member').toUpperCase())}</span></div>
            <hr class="my-2">
            <a href="/alliance/${a.alliance_id}" class="btn btn-sm btn-outline-light w-100">View Alliance</a>
        `;

        bankEl.innerHTML = `
            <div class="d-flex justify-content-between py-1"><span class="text-secondary">Treasury</span><span class="fw-bold text-gold">$${fmtNum(Math.floor(a.treasury || 0))}</span></div>
            <hr class="my-2">
            <div class="mb-2">
                <label class="form-label small">Deposit</label>
                <div class="input-group input-group-sm mb-2">
                    <input type="number" id="ec-bank-deposit" class="form-control" value="10000" min="1">
                    <button class="btn btn-success" onclick="empireControl.depositBank()">Deposit</button>
                </div>
            </div>
            <div class="mb-2">
                <label class="form-label small">Withdraw</label>
                <div class="input-group input-group-sm">
                    <input type="number" id="ec-bank-withdraw" class="form-control" value="10000" min="1">
                    <button class="btn btn-danger" onclick="empireControl.withdrawBank()">Withdraw</button>
                </div>
            </div>
            <a href="/alliance/bank" class="btn btn-sm btn-outline-light w-100 mt-2">Full Bank</a>
        `;

        if (this.allianceMembers.length > 0) {
            membersEl.innerHTML = this.allianceMembers.map(m => `
                <tr>
                    <td><a href="/nation/${m.nation_id}">${esc(m.nation_name || 'Unknown')}</a></td>
                    <td>${esc((m.role || 'member').toUpperCase())}</td>
                    <td class="text-end">${fmtNum(m.score || 0)}</td>
                    <td>${m.is_online ? '<span class="text-success">● Online</span>' : '<span class="text-muted">○ Offline</span>'}</td>
                </tr>
            `).join('');
        } else {
            membersEl.innerHTML = '<tr><td colspan="4" class="text-center text-secondary py-4">No member data</td></tr>';
        }
    },

    async depositBank() {
        const amount = parseInt(document.getElementById('ec-bank-deposit').value);
        if (!amount || amount <= 0) return showToast('Enter a valid amount', 'error');
        try {
            const resp = await api.post('/api/web/alliance/bank/deposit', { amount });
            if (resp?.success) { showToast('Deposited $' + fmtNum(amount), 'success'); await this.reloadData(); }
            else { showToast(resp?.message || 'Deposit failed', 'error'); }
        } catch (err) { showToast(err.message || 'Deposit failed', 'error'); }
    },

    async withdrawBank() {
        const amount = parseInt(document.getElementById('ec-bank-withdraw').value);
        if (!amount || amount <= 0) return showToast('Enter a valid amount', 'error');
        try {
            const resp = await api.post('/api/web/alliance/bank/withdraw', { amount });
            if (resp?.success) { showToast('Withdrew $' + fmtNum(amount), 'success'); await this.reloadData(); }
            else { showToast(resp?.message || 'Withdrawal failed', 'error'); }
        } catch (err) { showToast(err.message || 'Withdrawal failed', 'error'); }
    },

    renderDiplomacyTab() {
        const tbody = document.getElementById('ec-treaties-body');
        const relEl = document.getElementById('ec-diplo-relations');

        if (!this.treaties || this.treaties.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-4">No treaties</td></tr>';
        } else {
            tbody.innerHTML = this.treaties.map(t => {
                const isIncoming = t.target_nation_id === this.nation.nation_id;
                const withName = isIncoming ? (t.proposer_name || 'Unknown') : (t.target_name || 'Unknown');
                const withId = isIncoming ? t.proposer_nation_id : t.target_nation_id;
                const statusBadge = t.status === 'ACTIVE' ? '<span class="badge bg-success">Active</span>'
                    : t.status === 'PENDING' ? '<span class="badge bg-warning">Pending</span>'
                    : '<span class="badge bg-secondary">' + (t.status || 'Unknown') + '</span>';
                const actions = t.status === 'PENDING' && isIncoming
                    ? `<button class="btn btn-sm btn-success me-1" onclick="empireControl.acceptTreaty('${t.treaty_id}')">Accept</button><button class="btn btn-sm btn-danger" onclick="empireControl.rejectTreaty('${t.treaty_id}')">Reject</button>`
                    : t.status === 'ACTIVE'
                    ? `<button class="btn btn-sm btn-outline-danger" onclick="empireControl.terminateTreaty('${t.treaty_id}')">Terminate</button>`
                    : '—';
                return `<tr>
                    <td><a href="/nation/${withId}">${esc(withName)}</a></td>
                    <td>${esc((t.treaty_type || '—').replace(/_/g, ' '))}</td>
                    <td>${statusBadge}</td>
                    <td>${t.duration ? t.duration + ' days' : 'Indefinite'}</td>
                    <td>${actions}</td>
                </tr>`;
            }).join('');
        }

        relEl.innerHTML = '<div class="text-center text-secondary py-4">Diplomatic relations available on the full Diplomacy page</div>';
    },

    showProposeTreaty() {
        const modal = document.getElementById('ec-propose-treaty-modal');
        if (!modal) return;
        const sel = document.getElementById('ec-treaty-target');
        if (sel) {
            api.get('/api/web/nations').then(nations => {
                if (nations && nations.length > 0) {
                    sel.innerHTML = '<option value="">— Select nation —</option>' +
                        nations.filter(n => n.nation_id !== this.nation?.nation_id)
                            .map(n => `<option value="${n.nation_id}">${esc(n.nation_name || 'Unknown')} (${esc(n.ruler_name || '')})</option>`).join('');
                }
            }).catch(() => {});
        }
        const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
        bsModal.show();
    },

    async proposeTreaty() {
        const targetId = document.getElementById('ec-treaty-target')?.value;
        const treatyType = document.getElementById('ec-treaty-type')?.value;
        const duration = parseInt(document.getElementById('ec-treaty-duration')?.value) || 0;
        const terms = document.getElementById('ec-treaty-terms')?.value || '';
        const errEl = document.getElementById('ec-treaty-error');

        if (!targetId) { errEl.textContent = 'Please select a target nation'; errEl.classList.remove('d-none'); return; }
        errEl.classList.add('d-none');

        try {
            const resp = await api.post('/api/web/treaties/propose', {
                target_nation_id: targetId,
                treaty_type: treatyType,
                duration,
                terms
            });
            if (resp?.success) {
                showToast('Treaty proposed', 'success');
                bootstrap.Modal.getInstance(document.getElementById('ec-propose-treaty-modal'))?.hide();
                await this.reloadData();
            } else {
                showToast(resp?.message || 'Proposal failed', 'error');
            }
        } catch (err) {
            showToast(err.message || 'Proposal failed', 'error');
        }
    },

    async acceptTreaty(treatyId) {
        try {
            const resp = await api.post(`/api/web/treaties/${treatyId}/accept`);
            if (resp?.success) { showToast('Treaty accepted', 'success'); await this.reloadData(); }
            else { showToast(resp?.message || 'Failed', 'error'); }
        } catch (err) { showToast(err.message || 'Failed', 'error'); }
    },

    async rejectTreaty(treatyId) {
        try {
            const resp = await api.post(`/api/web/treaties/${treatyId}/reject`);
            if (resp?.success) { showToast('Treaty rejected', 'success'); await this.reloadData(); }
            else { showToast(resp?.message || 'Failed', 'error'); }
        } catch (err) { showToast(err.message || 'Failed', 'error'); }
    },

    async terminateTreaty(treatyId) {
        if (!confirm('Terminate this treaty?')) return;
        try {
            const resp = await api.post(`/api/web/treaties/${treatyId}/terminate`);
            if (resp?.success) { showToast('Treaty terminated', 'success'); await this.reloadData(); }
            else { showToast(resp?.message || 'Failed', 'error'); }
        } catch (err) { showToast(err.message || 'Failed', 'error'); }
    }
};

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = text;
}

function getResourceIcon(type) {
    const icons = {
        CASH: '💰', GRAIN: '🌾', TIMBER: '🪵', FISH: '🐟', LIVESTOCK: '🐄',
        COAL: '⚫', IRON: '🔩', COPPER: '🥉', LIMESTONE: '🪨',
        OIL: '🛢️', LEAD: '◼', SPICES: '🌶️', GOLD: '🪙',
        GEMSTONES: '💎', TITANIUM: '🔷', URANIUM: '☢️'
    };
    return icons[type] || '📦';
}

function fmtNum(n) {
    if (n == null || n === undefined) return '—';
    return Number(n).toLocaleString();
}

function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function colorHex(c) {
    const colors = {
        BLUE: '#0d6efd', RED: '#dc3545', GREEN: '#198754',
        PURPLE: '#6f42c1', ORANGE: '#fd7e14', TEAL: '#20c997',
        PINK: '#d63384', WHITE: '#adb5bd'
    };
    return colors[c] || '#6c757d';
}

function showToast(msg, type) {
    type = type || 'info';
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    t.innerHTML = '<div class="toast-content"><span class="toast-icon">' + (icons[type] || 'ℹ') + '</span><span class="toast-message">' + esc(msg) + '</span></div>';
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}
