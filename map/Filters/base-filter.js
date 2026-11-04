/**
 * BaseMapFilter - Foundation for map view filters
 * Sovereignty Epochs
 *
 * Each filter controls how territories are colored and how overlay
 * lines/links are drawn for a specific view mode:
 *   - Nations: color by owning nation
 *   - Alliances: color by alliance (all members = 1 color)
 *   - Treaties: nation color + lines between treaty partners
 *   - Wars: nation color + lines between warring nations
 *   - Currencies: color by shared currency
 *
 * Filters receive the visible territories and return draw instructions:
 *   { tiles: [{x,y,color}], links: [{from:{x,y}, to:{x,y}, color, width}] }
 */

class BaseMapFilter {
    constructor(options = {}) {
        this.mode = options.mode || 'nations';
        this.enabled = true;
        this.lineWidth = 3;
        this.linkFade = 0.5;
    }

    /**
     * Set the game systems this filter can read from.
     * systems: { nation, allianceSystem, diplomacySystem, warSystem, economySystem, gridMap }
     */
    setSystems(systems) {
        this.systems = systems || {};
    }

    /**
     * Get the color for a territory under this filter.
     * Returns a CSS color string.
     */
    getTileColor(territory) {
        return '#4a5568'; // default unclaimed gray
    }

    /**
     * Get overlay links (lines) to draw between territories.
     * Returns array of { from, to, color, width }.
     */
    getLinks(territories) {
        return [];
    }

    /**
     * Get legend entries for this filter.
     * Returns array of { label, color }.
     */
    getLegend() {
        return [];
    }

    /**
     * Check if a territory should be visible under this filter.
     */
    isVisible(territory) {
        return true;
    }

    /**
     * Build draw instructions for all visible territories.
     */
    build(territories) {
        const tiles = [];
        for (const t of territories) {
            if (!this.isVisible(t)) continue;
            tiles.push({ x: t.x, y: t.y, color: this.getTileColor(t) });
        }
        const links = this.getLinks(territories);
        return { tiles, links };
    }
}

window.BaseMapFilter = BaseMapFilter;
