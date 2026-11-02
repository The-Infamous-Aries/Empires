/**
 * AllianceFilter - Color territories by alliance.
 * All member nations of an alliance share one color.
 * Unallied nations keep their own color.
 */

class AllianceFilter extends BaseMapFilter {
    constructor(options = {}) {
        super(options);
        this.mode = 'alliances';
        this._allianceColorCache = new Map(); // allianceId -> color
        this._nationAllianceCache = new Map(); // nationId -> allianceId
    }

    setSystems(systems) {
        super.setSystems(systems);
        this._allianceColorCache.clear();
        this._nationAllianceCache.clear();
    }

    _getNationAllianceId(nationId) {
        if (this._nationAllianceCache.has(nationId)) return this._nationAllianceCache.get(nationId);

        let allianceId = null;
        const sys = this.systems;

        if (sys.enhancedRenderer && typeof sys.enhancedRenderer.getNationData === 'function') {
            const n = sys.enhancedRenderer.getNationData(nationId);
            if (n && n.allianceId) allianceId = n.allianceId;
        }

        this._nationAllianceCache.set(nationId, allianceId);
        return allianceId;
    }

    _getAllianceColor(allianceId) {
        if (this._allianceColorCache.has(allianceId)) return this._allianceColorCache.get(allianceId);

        let color = null;
        const sys = this.systems;

        if (sys.allianceSystem && typeof sys.allianceSystem.getAlliance === 'function') {
            const a = sys.allianceSystem.getAlliance(allianceId);
            if (a && a.color) color = a.color;
        }

        if (!color) {
            const colors = [
                '#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a',
                '#059669', '#0891b2', '#2563eb', '#4f46e5', '#7c3aed',
                '#9333ea', '#c026d3', '#db2777', '#e11d48'
            ];
            let hash = 0;
            const str = String(allianceId);
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash = hash & hash;
            }
            color = colors[Math.abs(hash) % colors.length];
        }

        this._allianceColorCache.set(allianceId, color);
        return color;
    }

    getTileColor(territory) {
        if (!territory.ownerId) return null;
        const allianceId = this._getNationAllianceId(territory.ownerId);
        if (allianceId) return this._getAllianceColor(allianceId);
        // Unallied nation — use its own color
        return this._getAllianceColor(`nation_${territory.ownerId}`);
    }

    getLinks() {
        return []; // Alliances don't draw lines by default
    }

    getLegend() {
        const entries = [];
        const sys = this.systems;
        if (sys.allianceSystem && typeof sys.allianceSystem.getAllAlliances === 'function') {
            const alliances = sys.allianceSystem.getAllAlliances();
            for (const a of alliances) {
                entries.push({ label: a.name || `Alliance ${a.id}`, color: a.color || '#94a3b8' });
            }
        } else if (sys.enhancedRenderer && typeof sys.enhancedRenderer.getAllAlliances === 'function') {
            const alliances = sys.enhancedRenderer.getAllAlliances();
            for (const a of alliances) {
                entries.push({ label: a.name || `Alliance ${a.id}`, color: a.color || '#94a3b8' });
            }
        }
        return entries;
    }
}

window.AllianceFilter = AllianceFilter;
