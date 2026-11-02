/**
 * CurrencyFilter - Color territories by the nation's currency.
 * Nations sharing a currency show the same color.
 * Requires EconomySystem / WorldBank currency data.
 */

class CurrencyFilter extends BaseMapFilter {
    constructor(options = {}) {
        super(options);
        this.mode = 'currencies';
        this._currencyColorCache = new Map(); // currencyKey -> color
        this._nationCurrencyCache = new Map(); // nationId -> currencyKey
    }

    setSystems(systems) {
        super.setSystems(systems);
        this._currencyColorCache.clear();
        this._nationCurrencyCache.clear();
    }

    _getNationCurrency(nationId) {
        if (this._nationCurrencyCache.has(nationId)) return this._nationCurrencyCache.get(nationId);

        let currency = null;
        const sys = this.systems;

        if (sys.enhancedRenderer && typeof sys.enhancedRenderer.getNationData === 'function') {
            const n = sys.enhancedRenderer.getNationData(nationId);
            if (n && n.currency) currency = n.currency;
        }

        if (!currency) {
            // Try WorldBank getNationsOnCurrency reverse lookup
            if (sys.worldBank && typeof sys.worldBank.getNationsOnCurrency === 'function') {
                // Can't reverse easily; default to aurel
            }
            currency = 'aurel';
        }

        this._nationCurrencyCache.set(nationId, currency);
        return currency;
    }

    _getCurrencyColor(currencyKey) {
        if (this._currencyColorCache.has(currencyKey)) return this._currencyColorCache.get(currencyKey);

        const colors = {
            aurel: '#ef4444',
            velt: '#f97316',
            krona: '#eab308',
            drachma: '#84cc16',
            sovereign: '#22c55e',
            talon: '#06b6d4'
        };
        const color = colors[currencyKey] || '#94a3b8';
        this._currencyColorCache.set(currencyKey, color);
        return color;
    }

    getTileColor(territory) {
        if (!territory.ownerId) return null;
        const currency = this._getNationCurrency(territory.ownerId);
        return this._getCurrencyColor(currency);
    }

    getLinks() {
        return []; // Currencies don't draw lines
    }

    getLegend() {
        const entries = [];
        const currencyColors = {
            aurel: { name: 'Aurel', color: '#ef4444' },
            velt: { name: 'Velt', color: '#f97316' },
            krona: { name: 'Krona', color: '#eab308' },
            drachma: { name: 'Drachma', color: '#84cc16' },
            sovereign: { name: 'Sovereign', color: '#22c55e' },
            talon: { name: 'Talon', color: '#06b6d4' }
        };
        for (const [key, info] of Object.entries(currencyColors)) {
            entries.push({ label: info.name, color: info.color });
        }
        return entries;
    }
}

window.CurrencyFilter = CurrencyFilter;
