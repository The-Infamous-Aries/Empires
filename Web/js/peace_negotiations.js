/**
 * Peace Negotiations UI - Empires Game
 *
 * Handles peace proposals, surrender, and war termination terms.
 */

const peaceUI = {
    war: null,
    warId: null,
    myNationId: null,

    /**
     * Initialize peace negotiations UI
     */
    async init() {
        this.warId = window.location.pathname.split('/').pop();
        await this.loadWarData();
        this.renderWarSummary();
        this.loadPendingOffers();
    },

    /**
     * Load war data
     */
    async loadWarData() {
        try {
            const warData = await api.get(`/api/web/wars/${this.warId}`);
            this.war = warData;

            const nationData = await api.get('/api/web/user/nation');
            if (nationData && nationData.nation) {
                this.myNationId = nationData.nation.nation_id;
            }
        } catch (err) {
            console.error('Failed to load war data:', err);
        }
    },

    /**
     * Render war summary
     */
    renderWarSummary() {
        const container = document.getElementById('war-summary');
        if (!container || !this.war) return;

        const isAttacker = this.myNationId === this.war.attacker_id;
        const myScore = isAttacker ? this.war.war_score_attacker : this.war.war_score_defender;
        const enemyScore = isAttacker ? this.war.war_score_defender : this.war.war_score_attacker;
        const enemyName = isAttacker ? this.war.defender_name : this.war.attacker_name;
        const enemyId = isAttacker ? this.war.defender_id : this.war.attacker_id;

        // Calculate who is winning
        const scoreDiff = myScore - enemyScore;
        const winning = scoreDiff > 0 ? 'You' : enemyName;
        const losing = scoreDiff > 0 ? enemyName : 'You';

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                <div>
                    <h4 class="fw-bold">⚔️ War with ${esc(enemyName)}</h4>
                    <div class="text-secondary small">
                        Started: ${this.war.started_at ? new Date(this.war.started_at).toLocaleDateString() : 'Unknown'}
                    </div>
                </div>
                <div class="text-end">
                    <span class="badge ${this.war.status === 'active' ? 'bg-danger' : 'bg-secondary'} fs-6">
                        ${this.war.status || 'Unknown'}
                    </span>
                </div>
            </div>

            <!-- War Score Comparison -->
            <div class="row mb-4">
                <div class="col-md-5">
                    <div class="text-center p-3 rounded" style="background: var(--bg-input);">
                        <div class="text-secondary small mb-1">Your Score</div>
                        <div class="fs-2 fw-bold ${scoreDiff >= 0 ? 'text-success' : 'text-danger'}">${fmtNum(myScore)}</div>
                        <div class="progress mt-2" style="height: 8px;">
                            <div class="progress-bar ${scoreDiff >= 0 ? 'bg-success' : 'bg-danger'}" style="width: ${myScore}%"></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-2 d-flex align-items-center justify-content-center">
                    <div class="text-center">
                        <div class="fs-3">⚔️</div>
                        <div class="small text-muted">VS</div>
                    </div>
                </div>
                <div class="col-md-5">
                    <div class="text-center p-3 rounded" style="background: var(--bg-input);">
                        <div class="text-secondary small mb-1">${esc(enemyName)}</div>
                        <div class="fs-2 fw-bold ${scoreDiff <= 0 ? 'text-success' : 'text-danger'}">${fmtNum(enemyScore)}</div>
                        <div class="progress mt-2" style="height: 8px;">
                            <div class="progress-bar ${scoreDiff <= 0 ? 'bg-success' : 'bg-danger'}" style="width: ${enemyScore}%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- War Status -->
            <div class="row g-3 text-center">
                <div class="col-4">
                    <div class="p-2 rounded" style="background: var(--bg-input);">
                        <div class="text-muted small">Attacker Turns</div>
                        <div class="fw-bold">${this.war.attacker_war_turns || 3}</div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="p-2 rounded" style="background: var(--bg-input);">
                        <div class="text-muted small">Defender Turns</div>
                        <div class="fw-bold">${this.war.defender_war_turns || 3}</div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="p-2 rounded" style="background: var(--bg-input);">
                        <div class="text-muted small">Attacks</div>
                        <div class="fw-bold">${(this.war.attacks || []).length}</div>
                    </div>
                </div>
            </div>

            ${this.war.reason ? `<div class="mt-3 text-secondary"><em>Reason: ${esc(this.war.reason)}</em></div>` : ''}
        `;
    },

    /**
     * Update peace form fields based on type
     */
    updatePeaceFields() {
        const type = document.getElementById('peace-type').value;

        // Hide all conditional fields
        document.getElementById('cash-reparations-group').classList.add('d-none');
        document.getElementById('resource-reparations-group').classList.add('d-none');
        document.getElementById('land-cession-group').classList.add('d-none');
        document.getElementById('infra-damage-group').classList.add('d-none');
        document.getElementById('tech-penalty-group').classList.add('d-none');
        document.getElementById('war-guilt-group').classList.add('d-none');

        // Show relevant fields
        if (type === 'reparations' || type === 'comprehensive') {
            document.getElementById('cash-reparations-group').classList.remove('d-none');
            document.getElementById('resource-reparations-group').classList.remove('d-none');
        }

        if (type === 'cession' || type === 'comprehensive') {
            document.getElementById('land-cession-group').classList.remove('d-none');
            document.getElementById('infra-damage-group').classList.remove('d-none');
        }

        if (type === 'comprehensive') {
            document.getElementById('tech-penalty-group').classList.remove('d-none');
            document.getElementById('war-guilt-group').classList.remove('d-none');
        }
    },

    /**
     * Update infrastructure display
     */
    updateInfraDisplay() {
        const value = document.getElementById('infra-damage').value;
        document.getElementById('infra-damage-display').textContent = fmtNum(value);
    },

    /**
     * Submit peace proposal
     */
    async submitProposal(isSurrender = false) {
        const isAttacker = this.myNationId === this.war?.attacker_id;
        const enemyScore = isAttacker ? this.war.war_score_defender : this.war.war_score_attacker;
        const myScore = isAttacker ? this.war.war_score_attacker : this.war.war_score_defender;

        // Calculate payer and recipient
        const payerWins = myScore > enemyScore;

        const peaceTerms = {
            type: isSurrender ? 'surrender' : document.getElementById('peace-type').value,
            duration_days: parseInt(document.getElementById('peace-duration').value),
            is_surrender: isSurrender,
            proposer_id: this.myNationId,
            proposer_name: this.myNationId, // Would get actual name from nation data
            payer: payerWins ? this.war?.defender_id : this.myNationId,
            recipient: payerWins ? this.myNationId : this.war?.defender_id,
            terms: {
                cash_reparations: payerWins ? parseInt(document.getElementById('reparations-cash').value) || 0 : 0,
                resource_type: document.getElementById('reparations-resource-type').value,
                resource_amount: payerWins ? parseInt(document.getElementById('reparations-resource-amount').value) || 0 : 0,
                land_cession: payerWins ? parseInt(document.getElementById('cession-land').value) || 0 : 0,
                max_infra_damage: parseInt(document.getElementById('infra-damage').value) || 0,
                tech_transfer: document.getElementById('tech-transfer').value,
                war_guilt_clause: document.getElementById('war-guilt').checked,
                additional_terms: document.getElementById('additional-terms').value
            },
            created_at: new Date().toISOString(),
            status: 'pending'
        };

        try {
            const resp = await api.post(`/api/web/wars/${this.warId}/peace`, peaceTerms);

            if (resp?.success) {
                showToast(isSurrender ? 'Surrender submitted!' : 'Peace proposal sent!', 'success');
                this.loadPendingOffers();
            } else {
                showToast(resp?.message || 'Failed to submit proposal', 'error');
            }
        } catch (err) {
            showToast(err.message || 'Failed to submit proposal', 'error');
        }
    },

    /**
     * Load pending peace offers
     */
    async loadPendingOffers() {
        const container = document.getElementById('pending-offers');

        try {
            const offers = await api.get(`/api/web/wars/${this.warId}/peace-offers`);

            if (!offers || offers.length === 0) {
                container.innerHTML = '<div class="text-center text-secondary py-4">No pending peace offers</div>';
                return;
            }

            container.innerHTML = offers.map(offer => this.renderPeaceOffer(offer)).join('');
        } catch (err) {
            console.error('Failed to load peace offers:', err);
            container.innerHTML = '<div class="text-center text-secondary py-4">No pending peace offers</div>';
        }
    },

    /**
     * Render a single peace offer
     */
    renderPeaceOffer(offer) {
        const isMyOffer = offer.proposer_id === this.myNationId;
        const isFromEnemy = offer.payer === this.myNationId || offer.recipient === this.myNationId;

        let termsSummary = '';
        if (offer.terms) {
            const terms = offer.terms;
            const parts = [];
            if (terms.cash_reparations > 0) parts.push(`$${fmtNum(terms.cash_reparations)}`);
            if (terms.land_cession > 0) parts.push(`${fmtNum(terms.land_cession)} land`);
            if (terms.resource_amount > 0) parts.push(`${fmtNum(terms.resource_amount)} ${terms.resource_type}`);
            termsSummary = parts.length > 0 ? parts.join(', ') : 'No terms';
        } else {
            termsSummary = 'White peace (no terms)';
        }

        return `
            <div class="peace-offer-card mb-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <span class="badge ${isMyOffer ? 'bg-info' : 'bg-warning'}">
                                ${isMyOffer ? 'Your Offer' : 'Their Offer'}
                            </span>
                            <span class="badge ${offer.type === 'surrender' ? 'bg-danger' : 'bg-success'}">
                                ${offer.type === 'surrender' ? 'Surrender' : offer.type}
                            </span>
                        </div>
                        <div class="text-secondary small">
                            ${offer.type === 'surrender'
                                ? 'You are offering to surrender'
                                : `Peace for ${offer.duration_days || 30} days`
                            }
                        </div>
                        <div class="mt-2">
                            <strong>Terms:</strong> ${esc(termsSummary)}
                        </div>
                        <div class="text-muted small mt-1">
                            Proposed: ${new Date(offer.created_at).toLocaleString()}
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        ${!isMyOffer ? `
                            <button class="btn btn-sm btn-success" onclick="peaceUI.acceptOffer('${offer.offer_id}')">
                                ✓ Accept
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="peaceUI.rejectOffer('${offer.offer_id}')">
                                ✕ Reject
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-outline-secondary" onclick="peaceUI.cancelOffer('${offer.offer_id}')">
                                Cancel
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Accept a peace offer
     */
    async acceptOffer(offerId) {
        if (!confirm('Accept this peace treaty? This will end the war according to the agreed terms.')) return;

        try {
            const resp = await api.post(`/api/web/wars/${this.warId}/peace/${offerId}/accept`);
            if (resp?.success) {
                showToast('Peace treaty accepted! War has ended.', 'success');
                setTimeout(() => window.location.href = '/wars', 2000);
            } else {
                showToast(resp?.message || 'Failed to accept offer', 'error');
            }
        } catch (err) {
            showToast(err.message || 'Failed to accept offer', 'error');
        }
    },

    /**
     * Reject a peace offer
     */
    async rejectOffer(offerId) {
        if (!confirm('Reject this peace offer? The war will continue.')) return;

        try {
            const resp = await api.post(`/api/web/wars/${this.warId}/peace/${offerId}/reject`);
            if (resp?.success) {
                showToast('Peace offer rejected', 'info');
                this.loadPendingOffers();
            }
        } catch (err) {
            showToast(err.message || 'Failed to reject offer', 'error');
        }
    },

    /**
     * Cancel own peace offer
     */
    async cancelOffer(offerId) {
        try {
            const resp = await api.del(`/api/web/wars/${this.warId}/peace/${offerId}`);
            if (resp?.success) {
                showToast('Offer cancelled', 'info');
                this.loadPendingOffers();
            }
        } catch (err) {
            showToast(err.message || 'Failed to cancel offer', 'error');
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
    .peace-offer-card {
        background: var(--bg-input);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        padding: 16px;
        transition: all 0.15s;
    }
    .peace-offer-card:hover {
        border-color: var(--accent-primary);
    }
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