/**
 * Demand Handler - Government & Religion Change — Success Toasts & Indicators
 * Dominion Wars - Nation Building Strategy Game
 *
 * The actual selection modal lives in DemandModal.js.
 * This file is responsible only for:
 *   - Showing a small toast when a demand first fires (hint preview)
 *   - Showing a success toast after a change is confirmed
 *   - Updating any persistent indicator badges in the main UI
 */

class DemandHandlerSystem {
    constructor() {
        this.isInitialized = false;
        this.initialize();
    }

    initialize() {
        console.log('Initializing Demand Handler System...');

        EventBus.on(GameEvents.GOVERNMENT_DEMAND,  this.onGovernmentDemand,  this);
        EventBus.on(GameEvents.RELIGION_DEMAND,    this.onReligionDemand,    this);
        EventBus.on(GameEvents.GOVERNMENT_CHANGED, this.onGovernmentChanged, this);
        EventBus.on(GameEvents.RELIGION_CHANGED,   this.onReligionChanged,   this);

        this.isInitialized = true;
        console.log('Demand Handler System initialized');
    }

    // ─── Demand fired ─────────────────────────────────────────────────────────

    onGovernmentDemand(data) {
        // DemandModal already handles the full popup — show a brief corner toast too
        this._showToast({
            type: 'government',
            icon: '🏛️',
            title: 'The people demand a new government!',
            body: `"${data.hint}"`,
            onOpen: () => window.DemandModal?.openForGovernment(data)
        });
        this._setIndicator('government', true);
    }

    onReligionDemand(data) {
        this._showToast({
            type: 'religion',
            icon: '✝️',
            title: 'The people demand a new religion!',
            body: `"${data.hint}"`,
            onOpen: () => window.DemandModal?.openForReligion(data)
        });
        this._setIndicator('religion', true);
    }

    // ─── Change confirmed ─────────────────────────────────────────────────────

    onGovernmentChanged(data) {
        const gov = window.GovernmentSystem?.getGovernment(data.newGovernment);
        if (gov) {
            this._showSuccessToast(
                '🏛️ Government Changed!',
                `Your nation now operates as a ${gov.name}. The people are satisfied… for now.`
            );
        }
        this._setIndicator('government', false);
    }

    onReligionChanged(data) {
        const rel = window.ReligionSystem?.getReligion(data.newReligion);
        if (rel) {
            this._showSuccessToast(
                '✝️ Religion Changed!',
                `Your nation has embraced ${rel.name}. Faith reshapes the people.`
            );
        }
        this._setIndicator('religion', false);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    _showToast({ type, icon, title, body, onOpen }) {
        const el = document.createElement('div');
        el.className = `demand-notification ${type}-demand`;
        el.innerHTML = `
            <div class="demand-notification-header">
                <span class="demand-icon">${icon}</span>
                <span class="demand-title">${title}</span>
                <button class="demand-close" aria-label="Close">&times;</button>
            </div>
            <div class="demand-notification-body">
                <p class="demand-hint">${body}</p>
            </div>
            <div class="demand-notification-footer">
                <button class="demand-action-btn">Respond Now</button>
            </div>`;

        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));

        el.querySelector('.demand-close').addEventListener('click', () => this._closeToast(el));
        el.querySelector('.demand-action-btn').addEventListener('click', () => {
            if (onOpen) onOpen();
            this._closeToast(el);
        });

        // Auto-dismiss after 20 s
        setTimeout(() => { if (el.parentNode) this._closeToast(el); }, 20000);
    }

    _closeToast(el) {
        el.classList.remove('show');
        el.classList.add('hide');
        setTimeout(() => el.parentNode?.removeChild(el), 350);
    }

    _showSuccessToast(title, message) {
        const el = document.createElement('div');
        el.className = 'success-notification';
        el.innerHTML = `
            <div class="success-notification-header">
                <span class="success-icon">${title.split(' ')[0]}</span>
                <span class="success-title">${title.slice(title.indexOf(' ') + 1)}</span>
            </div>
            <div class="success-notification-body"><p>${message}</p></div>`;

        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => el.parentNode?.removeChild(el), 350);
        }, 5000);
    }

    _setIndicator(type, active) {
        const el = document.getElementById(`${type}-demand-indicator`);
        if (el) el.classList.toggle('active', active);
    }
}

// Expose globally
document.addEventListener('DOMContentLoaded', () => {
    window.DemandHandler = new DemandHandlerSystem();
});
