/**
 * NationFilter - Color each territory by its owning nation.
 * Each nation gets a unique color. Unclaimed tiles show terrain color.
 */

class NationFilter extends BaseMapFilter {
    constructor(options = {}) {
        super(options);
        this.mode = 'nations';
        this._colorCache = new Map(); // nationId -> color
    }

    setSystems(systems) {
        super.setSystems(systems);
        this._colorCache.clear();
    }

    _getNationColor(nationId) {
        if (this._colorCache.has(nationId)) return this._colorCache.get(nationId);

        let color = null;

        // Try enhanced renderer's nation data
        const sys = this.systems;
        if (sys.gridMap) {
            // Try to get nation data from the renderer's getNationData
            if (sys.enhancedRenderer && typeof sys.enhancedRenderer.getNationData === 'function') {
                const nation = sys.enhancedRenderer.getNationData(nationId);
                if (nation && nation.color) color = nation.color;
            }
        }

        // Fallback: deterministic hash color
        if (!color) {
            const colors = [
                '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
                '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
                '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
            ];
            let hash = 0;
            const str = String(nationId);
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash = hash & hash;
            }
            color = colors[Math.abs(hash) % colors.length];
        }

        this._colorCache.set(nationId, color);
        return color;
    }

    getTileColor(territory) {
        if (!territory.ownerId) return null; // let renderer draw terrain
        return this._getNationColor(territory.ownerId);
    }

    getLegend() {
        const entries = [];
        const sys = this.systems;
        if (sys.enhancedRenderer && typeof sys.enhancedRenderer.getAllAlliances === 'function') {
            // Not applicable for nations view; we list nations instead
        }
        // Build from visible nations tracked in color cache
        for (const [nationId, color] of this._colorCache) {
            let name = `Nation ${nationId}`;
            if (sys.enhancedRenderer && typeof sys.enhancedRenderer.getNationData === 'function') {
                const n = sys.enhancedRenderer.getNationData(nationId);
                if (n && n.name) name = n.name;
            }
            entries.push({ label: name, color });
        }
        return entries;
    }
}

window.NationFilter = NationFilter;
