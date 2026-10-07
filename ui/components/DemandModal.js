/**
 * Demand Modal - Government & Religion Change Puzzle UI
 * Dominion Wars - Nation Building Strategy Game
 *
 * When the people demand a new government or religion, a hint is shown
 * and the player must decode which one to pick.
 */

class DemandModalSystem {
    constructor() {
        this.isInitialized = false;
        this.currentDemandType = null; // 'government' | 'religion'
        this.currentHint = null;
        this.onConfirmCallback = null;
        this.initialize();
    }

    initialize() {
        console.log('Initializing Demand Modal System...');
        this.createModal();
        this.bindModalEvents();
        this.bindGameEvents();
        this.isInitialized = true;
        console.log('Demand Modal System initialized');
    }

    // ─── Build the Modal DOM ──────────────────────────────────────────────────

    createModal() {
        const html = `
        <div id="demand-modal" class="demand-modal hidden" role="dialog" aria-modal="true" aria-labelledby="demand-modal-title">
            <div class="demand-modal-overlay"></div>
            <div class="demand-modal-content">

                <!-- Header -->
                <div class="demand-modal-header">
                    <span id="demand-modal-icon" class="demand-modal-icon">🏛️</span>
                    <h2 id="demand-modal-title">The People Demand Change!</h2>
                    <p id="demand-modal-subtitle" class="demand-modal-subtitle">Decipher the hint below to choose wisely.</p>
                </div>

                <!-- Hint Box -->
                <div class="demand-hint-box">
                    <div class="demand-hint-label">The Peoples' Whisper:</div>
                    <blockquote id="demand-hint-text" class="demand-hint-quote"></blockquote>
                    <div class="demand-hint-meta">
                        <span id="demand-days-left" class="demand-days"></span>
                        <button type="button" id="demand-view-encyclopedia" class="demand-encyclopedia-btn">
                            📖 Open Encyclopedia
                        </button>
                    </div>
                </div>

                <!-- Selection Grid -->
                <div class="demand-selection-section">
                    <h3 class="demand-selection-heading">Make Your Choice:</h3>
                    <div id="demand-selection-grid" class="demand-selection-grid">
                        <!-- Populated dynamically -->
                    </div>
                </div>

                <!-- Footer -->
                <div class="demand-modal-footer">
                    <p class="demand-footer-note">
                        ⚠️ Your choice will take effect immediately and reset the demand cycle.
                    </p>
                    <div class="demand-footer-btns">
                        <button type="button" id="demand-postpone-btn" class="demand-btn secondary">
                            Postpone (−5 Happiness)
                        </button>
                        <button type="button" id="demand-confirm-btn" class="demand-btn primary" disabled>
                            Confirm Choice
                        </button>
                    </div>
                </div>

            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    // ─── Event Wiring ─────────────────────────────────────────────────────────

    bindModalEvents() {
        document.getElementById('demand-view-encyclopedia')?.addEventListener('click', () => {
            if (window.ReferencePage) {
                ReferencePage.showModal();
                ReferencePage.switchTab(
                    this.currentDemandType === 'government' ? 'governments' : 'religions'
                );
            }
        });

        document.getElementById('demand-postpone-btn')?.addEventListener('click', () => {
            this.postponeDemand();
        });

        document.getElementById('demand-confirm-btn')?.addEventListener('click', () => {
            this.confirmChoice();
        });

        // Overlay click does nothing — the player must respond
    }

    bindGameEvents() {
        if (typeof EventBus !== 'undefined') {
            EventBus.on(GameEvents.GOVERNMENT_DEMAND, (data) => {
                this.openForGovernment(data);
            }, this);

            EventBus.on(GameEvents.RELIGION_DEMAND, (data) => {
                this.openForReligion(data);
            }, this);
        }
    }

    // ─── Open helpers ─────────────────────────────────────────────────────────

    openForGovernment(data) {
        this.currentDemandType = 'government';
        this.currentHint = data.hint;
        this.onConfirmCallback = (choiceId) => {
            if (window.Nation) Nation.changeGovernment(choiceId);
        };
        this._open({
            icon: '🏛️',
            title: 'The People Demand a New Government!',
            subtitle: 'A whisper travels through the streets. Decipher it to choose the right system.',
            hint: data.hint,
            daysLeft: data.daysRemaining,
            items: window.GovernmentSystem ? GovernmentSystem.getAllGovernments() : [],
            currentId: window.Nation ? Nation.government : null
        });
    }

    openForReligion(data) {
        this.currentDemandType = 'religion';
        this.currentHint = data.hint;
        this.onConfirmCallback = (choiceId) => {
            if (window.Nation) Nation.changeReligion(choiceId);
        };
        this._open({
            icon: '✝️',
            title: 'The People Demand a New Faith!',
            subtitle: 'Spiritual unrest stirs the population. Read the omen and choose wisely.',
            hint: data.hint,
            daysLeft: data.daysRemaining,
            items: window.ReligionSystem ? ReligionSystem.getAllReligions() : [],
            currentId: window.Nation ? Nation.religion : null
        });
    }

    _open({ icon, title, subtitle, hint, daysLeft, items, currentId }) {
        this.selectedId = null;

        // Update header
        document.getElementById('demand-modal-icon').textContent = icon;
        document.getElementById('demand-modal-title').textContent = title;
        document.getElementById('demand-modal-subtitle').textContent = subtitle;

        // Update hint
        document.getElementById('demand-hint-text').textContent = hint;
        document.getElementById('demand-days-left').textContent =
            `⏳ ${daysLeft} day${daysLeft !== 1 ? 's' : ''} to respond`;

        // Build selection grid
        this._buildGrid(items, currentId);

        // Reset confirm button
        document.getElementById('demand-confirm-btn').disabled = true;

        // Show modal
        const modal = document.getElementById('demand-modal');
        modal.classList.remove('hidden');
        requestAnimationFrame(() => modal.classList.add('show'));
    }

    _buildGrid(items, currentId) {
        const grid = document.getElementById('demand-selection-grid');
        grid.innerHTML = '';

        items.forEach(item => {
            const isCurrent = item.id === currentId;

            // Summarise bonuses (top 3)
            const bonusEntries = Object.entries(item.bonuses || {}).slice(0, 3);
            const bonusTags = bonusEntries.map(([k, v]) => {
                const pct = Math.round((v - 1) * 100);
                if (pct === 0) return '';
                const label = k.replace(/([A-Z])/g, ' $1').trim();
                const cls = pct > 0 ? 'pos' : 'neg';
                return `<span class="demand-stat-tag ${cls}">${pct > 0 ? '+' : ''}${pct}% ${label}</span>`;
            }).join('');

            const card = document.createElement('div');
            card.className = `demand-option-card${isCurrent ? ' current' : ''}`;
            card.dataset.id = item.id;
            card.innerHTML = `
                <div class="demand-option-name">${item.name}</div>
                <div class="demand-option-full">${item.fullName}</div>
                <div class="demand-option-desc">${item.description.slice(0, 100)}…</div>
                <div class="demand-option-stats">${bonusTags}</div>
                ${isCurrent ? '<div class="demand-option-current-badge">Current</div>' : ''}
                <div class="demand-option-select-ring"></div>
            `;

            card.addEventListener('click', () => {
                if (isCurrent) return; // Can't pick the current one
                this._selectCard(item.id);
            });

            grid.appendChild(card);
        });
    }

    _selectCard(id) {
        this.selectedId = id;
        document.querySelectorAll('#demand-selection-grid .demand-option-card').forEach(c => {
            c.classList.toggle('selected', c.dataset.id === id);
        });
        document.getElementById('demand-confirm-btn').disabled = false;
    }

    // ─── Actions ──────────────────────────────────────────────────────────────

    confirmChoice() {
        if (!this.selectedId) return;
        if (this.onConfirmCallback) this.onConfirmCallback(this.selectedId);
        this.close();
    }

    postponeDemand() {
        // Penalise the player for ignoring the demand
        if (window.Nation) {
            Nation.happiness = Math.max(0, Nation.happiness - 5);
        }
        // Reset demand timer so it triggers again in ~30 days
        if (window.Nation && Nation.demandTimer) {
            if (this.currentDemandType === 'government') {
                Nation.demandTimer.isDemandingGovernment = false;
                Nation.demandTimer.governmentDaysRemaining = 30;
            } else {
                Nation.demandTimer.isDemandingReligion = false;
                Nation.demandTimer.religionDaysRemaining = 30;
            }
        }
        this.close();
    }

    close() {
        const modal = document.getElementById('demand-modal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
            this.currentDemandType = null;
            this.selectedId = null;
        }, 350);
    }
}

// Expose globally — instantiated after DOMContentLoaded so the modal HTML lands in the body
document.addEventListener('DOMContentLoaded', () => {
    window.DemandModal = new DemandModalSystem();
});
