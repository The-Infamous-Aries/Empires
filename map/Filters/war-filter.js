/**
 * WarFilter - Color by nation, draw lines between nations at war.
 * Line width widens toward the winning side (the nation with military
 * advantage). Lines run between nation territory centers.
 */

class WarFilter extends BaseMapFilter {
    constructor(options = {}) {
        super(options);
        this.mode = 'wars';
        this._nationColorCache = new Map();
        this._warPairs = []; // [{a, b, winner}]
        this._nationCenterCache = new Map();
    }

    setSystems(systems) {
        super.setSystems(systems);
        this._nationColorCache.clear();
        this._warPairs = [];
        this._nationCenterCache.clear();
        this._loadWars();
    }

    _loadWars() {
        const sys = this.systems;
        this._warPairs = [];

        if (sys.warSystem && typeof sys.warSystem.getActiveWars === 'function') {
            const wars = sys.warSystem.getActiveWars();
            for (const w of wars) {
                this._warPairs.push({
                    a: w.attacker || w.from,
                    b: w.defender || w.to,
                    winner: w.winner || null
                });
            }
        } else if (sys.enhancedRenderer && typeof sys.enhancedRenderer.areNationsAtWar === 'function') {
            // Can't enumerate all wars without a list; skip
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
        const nationTiles = new Map();
        for (const t of territories) {
            if (!t.ownerId) continue;
            if (!nationTiles.has(t.ownerId)) nationTiles.set(t.ownerId, []);
            nationTiles.get(t.ownerId).push(t);
        }

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
        for (const pair of this._warPairs) {
            const cA = centers.get(pair.a);
            const cB = centers.get(pair.b);
            if (!cA || !cB) continue;

            // Determine winner for line width bias
            let width = 4;
            if (pair.winner === pair.a) width = 6; // wider at A side handled by gradient
            else if (pair.winner === pair.b) width = 6;

            links.push({
                from: cA,
                to: cB,
                color: '#ef4444', // red for war
                width: width,
                winner: pair.winner
            });
        }
        return links;
    }

    getLegend() {
        return [
            { label: 'Active war', color: '#ef4444' },
            { label: 'Nation territory', color: '#94a3b8' }
        ];
    }
}

window.WarFilter = WarFilter;
