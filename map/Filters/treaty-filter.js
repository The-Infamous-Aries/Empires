/**
 * TreatyFilter - Color by nation, draw lines between nations with treaties.
 * Lines run between the perimeter points of each nation's territory so
 * a line crossing a tile means "this nation has a treaty here" without
 * claiming the tile.
 */

class TreatyFilter extends BaseMapFilter {
    constructor(options = {}) {
        super(options);
        this.mode = 'treaties';
        this._nationColorCache = new Map();
        this._treatyPairs = []; // [{a, b}]
        this._nationCenterCache = new Map(); // nationId -> {x, y}
    }

    setSystems(systems) {
        super.setSystems(systems);
        this._nationColorCache.clear();
        this._treatyPairs = [];
        this._nationCenterCache.clear();
        this._loadTreaties();
    }

    _loadTreaties() {
        const sys = this.systems;
        this._treatyPairs = [];

        if (sys.diplomacySystem && typeof sys.diplomacySystem.getTreaties === 'function') {
            const treaties = sys.diplomacySystem.getTreaties();
            for (const t of treaties) {
                if (t.status === 'active') {
                    this._treatyPairs.push({ a: t.from, b: t.to });
                }
            }
        } else if (sys.enhancedRenderer && typeof sys.enhancedRenderer.hasTreatyWith === 'function') {
            // Fallback: derive from visible nations
        }
    }

    _getNationColor(nationId) {
        if (this._nationColorCache.has(nationId)) return this._nationColorCache.get(nationId);
        let color = null;
        const sys = this.systems;
        if (sys.enhancedRenderer && typeof sys.enhancedRenderer.getNationData === 'function') {
            const n = sys.enhancedRenderer.getNationData(nationId);
            if (n && n.color) color = n.color;
        }
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
        this._nationColorCache.set(nationId, color);
        return color;
    }

    getTileColor(territory) {
        if (!territory.ownerId) return null;
        return this._getNationColor(territory.ownerId);
    }

    getLinks(territories) {
        // Build nation -> list of territories for center calculation
        const nationTiles = new Map();
        for (const t of territories) {
            if (!t.ownerId) continue;
            if (!nationTiles.has(t.ownerId)) nationTiles.set(t.ownerId, []);
            nationTiles.get(t.ownerId).push(t);
        }

        // Compute centers
        const centers = new Map();
        for (const [nationId, tiles] of nationTiles) {
            if (this._nationCenterCache.has(nationId)) {
                centers.set(nationId, this._nationCenterCache.get(nationId));
                continue;
            }
            let sumX = 0, sumY = 0;
            for (const t of tiles) { sumX += t.x; sumY += t.y; }
            const center = { x: sumX / tiles.length, y: sumY / tiles.length };
            this._nationCenterCache.set(nationId, center);
            centers.set(nationId, center);
        }

        const links = [];
        for (const pair of this._treatyPairs) {
            const cA = centers.get(pair.a);
            const cB = centers.get(pair.b);
            if (!cA || !cB) continue;
            links.push({
                from: cA,
                to: cB,
                color: '#22c55e', // green for treaties
                width: 3
            });
        }
        return links;
    }

    getLegend() {
        return [
            { label: 'Treaty (active)', color: '#22c55e' },
            { label: 'Nation territory', color: '#94a3b8' }
        ];
    }
}

window.TreatyFilter = TreatyFilter;
