/**
 * Map Data - Infinite Grid-Based Territory System
 * Dominion Wars - Nation Building Strategy Game
 *
 * The map is a sparse, infinite grid. Each square = 100 square miles.
 * Territories are stored only when they exist (claimed or generated).
 * The grid grows forever — whenever a claim is made at or beyond the
 * current edge, the world bounds expand automatically so there is always
 * room for new players and new purchases.
 *
 * Terrain and resources are generated deterministically from (x, y)
 * coordinates so they are consistent every time a tile is touched.
 */

class GridMapData {
    constructor() {
        // Each square = 100 square miles (1 map block)
        this.GRID_SIZE = 100;
        this.DEFAULT_VIEW_SIZE = 50;

        // Sparse storage: only tiles that have been generated/claimed exist.
        // Key: "x,y"  Value: territory data object
        this.territories = new Map();

        // Nation -> list of territory keys
        this.nations = new Map();

        // World bounds — start small, expand forever as needed.
        // These track the min/max of all tiles ever generated.
        this.worldBounds = {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0
        };

        // Faction colours — built from core/colors.js GAME_COLORS (single source of truth).
        // Keys match PNG filenames in assets/images/Colors/.
        this.FACTION_COLORS = this._buildFactionColors();

        // Seed the origin tile (0,0) so the map is never completely empty.
        this._ensureTile(0, 0);

        console.log('Grid Map Data initialized (infinite sparse grid)');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FACTION COLOURS
    // ══════════════════════════════════════════════════════════════════════════

    _buildFactionColors() {
        const src = (typeof GAME_COLORS !== 'undefined') ? GAME_COLORS : {};
        const out = {};
        for (const [key, def] of Object.entries(src)) {
            out[key] = {
                key: key,
                name: def.name || key,
                color: def.hex || '#94a3b8',
                image: def.image || null,
                seats: 0,
                members: 0
            };
        }
        return out;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TILE GENERATION (deterministic, sparse)
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Ensure a tile exists at (x, y), generating terrain/resources if new.
     * Expands world bounds if necessary. Returns the territory object.
     * Never overwrites an existing claimed tile.
     */
    _ensureTile(x, y) {
        const key = `${x},${y}`;
        let tile = this.territories.get(key);

        if (!tile) {
            // Expand bounds
            if (x < this.worldBounds.minX) this.worldBounds.minX = x;
            if (x > this.worldBounds.maxX) this.worldBounds.maxX = x;
            if (y < this.worldBounds.minY) this.worldBounds.minY = y;
            if (y > this.worldBounds.maxY) this.worldBounds.maxY = y;

            tile = {
                x,
                y,
                ownerId: null,
                ownerFaction: null,
                claimedDate: null,
                improvements: [],
                resources: this.generateTileResources(x, y),
                terrain: this.generateTerrain(x, y),
                population: 0,
                infrastructure: 0
            };
            this.territories.set(key, tile);
        }

        return tile;
    }

    /**
     * Get a tile at (x, y). Generates it on the fly if missing.
     * Claimed tiles are never overwritten.
     */
    getTerritory(x, y) {
        return this._ensureTile(x, y);
    }

    /**
     * Generate terrain type for a grid tile using deterministic noise.
     */
    generateTerrain(x, y) {
        const noise = this.simpleNoise(x * 0.1, y * 0.1);

        if (noise > 0.6) return 'mountain';
        if (noise > 0.3) return 'hills';
        if (noise > 0.0) return 'plains';
        if (noise > -0.3) return 'forest';
        if (noise > -0.6) return 'swamp';
        return 'water';
    }

    /**
     * Generate base resources for a grid tile based on terrain.
     */
    generateTileResources(x, y) {
        const terrain = this.generateTerrain(x, y);
        const base = { food: 0, materials: 0, energy: 0, money: 0 };

        switch (terrain) {
            case 'plains':
                base.food = 50 + Math.floor(this.seededRandom(x, y) * 30);
                base.money = 30 + Math.floor(this.seededRandom(x, y + 1000) * 20);
                break;
            case 'forest':
                base.materials = 40 + Math.floor(this.seededRandom(x, y) * 25);
                base.food = 25 + Math.floor(this.seededRandom(x, y + 1000) * 15);
                break;
            case 'hills':
                base.materials = 60 + Math.floor(this.seededRandom(x, y) * 30);
                base.energy = 20 + Math.floor(this.seededRandom(x, y + 1000) * 15);
                break;
            case 'mountain':
                base.materials = 80 + Math.floor(this.seededRandom(x, y) * 40);
                base.energy = 30 + Math.floor(this.seededRandom(x, y + 1000) * 20);
                break;
            case 'water':
                base.food = 70 + Math.floor(this.seededRandom(x, y) * 35);
                break;
            case 'swamp':
                base.energy = 25 + Math.floor(this.seededRandom(x, y) * 15);
                break;
        }
        return base;
    }

    /**
     * Deterministic pseudo-random value in [0,1) based on (x, y).
     * Same coordinates always produce the same value.
     */
    seededRandom(x, y) {
        const n = Math.sin(x * 12.9898 + y * 4.1414) * 43758.5453;
        return (n - Math.floor(n));
    }

    /**
     * Simple noise for terrain generation (returns -1 to 1).
     */
    simpleNoise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 4.1414) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CLAIMING
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Claim a tile at (x, y) for a nation.
     * Generates the tile if it doesn't exist yet.
     * Throws if already claimed by another nation.
     */
    claimTerritory(x, y, nationId, factionColor) {
        const territory = this._ensureTile(x, y);

        if (territory.ownerId && territory.ownerId !== nationId) {
            throw new Error('Territory already claimed by another nation');
        }

        territory.ownerId = nationId;
        territory.ownerFaction = factionColor || null;
        territory.claimedDate = Date.now();

        // Track nation -> territories
        if (!this.nations.has(nationId)) {
            this.nations.set(nationId, []);
        }
        const nationTiles = this.nations.get(nationId);
        if (!nationTiles.includes(`${x},${y}`)) {
            nationTiles.push(`${x},${y}`);
        }

        this._updateFactionData();

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('territory_claimed', {
                x, y, nationId, faction: factionColor
            });
        }

        return true;
    }

    /**
     * Remove ownership from a tile (abandon).
     */
    releaseTerritory(x, y) {
        const key = `${x},${y}`;
        const territory = this.territories.get(key);
        if (!territory || !territory.ownerId) return false;

        const oldOwner = territory.ownerId;
        territory.ownerId = null;
        territory.ownerFaction = null;
        territory.claimedDate = null;

        // Remove from nation tracking
        if (this.nations.has(oldOwner)) {
            const tiles = this.nations.get(oldOwner);
            const idx = tiles.indexOf(key);
            if (idx !== -1) tiles.splice(idx, 1);
        }

        this._updateFactionData();

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('territory_released', { x, y, previousOwner: oldOwner });
        }
        return true;
    }

    /**
     * Transfer ownership from one nation to another.
     */
    transferTerritory(x, y, fromNationId, toNationId) {
        const territory = this._ensureTile(x, y);
        if (!territory.ownerId || territory.ownerId !== fromNationId) return false;

        territory.ownerId = toNationId;
        territory.ownerFaction = (this._getFactionByNation(toNationId)) || null;
        territory.claimedDate = Date.now();

        // Update nation tracking
        if (this.nations.has(fromNationId)) {
            const tiles = this.nations.get(fromNationId);
            const idx = tiles.indexOf(`${x},${y}`);
            if (idx !== -1) tiles.splice(idx, 1);
        }
        if (!this.nations.has(toNationId)) this.nations.set(toNationId, []);
        this.nations.get(toNationId).push(`${x},${y}`);

        this._updateFactionData();

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('territory_transferred', { x, y, from: fromNationId, to: toNationId });
        }
        return true;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FACTION DATA
    // ══════════════════════════════════════════════════════════════════════════

    _updateFactionData() {
        // Reset counts
        Object.keys(this.FACTION_COLORS).forEach(f => {
            this.FACTION_COLORS[f].members = 0;
        });

        // Count tiles per faction
        for (const tiles of this.nations.values()) {
            for (const key of tiles) {
                const t = this.territories.get(key);
                if (t && t.ownerFaction) {
                    const fKey = this._getFactionKeyByColor(t.ownerFaction);
                    if (fKey && this.FACTION_COLORS[fKey]) {
                        this.FACTION_COLORS[fKey].members++;
                    }
                }
            }
        }

        // Calculate World Congress seats (min 1 + proportional)
        const totalMembers = Object.values(this.FACTION_COLORS)
            .reduce((sum, f) => sum + f.members, 0);

        Object.keys(this.FACTION_COLORS).forEach(f => {
            const members = this.FACTION_COLORS[f].members;
            const pctSeats = totalMembers > 0
                ? Math.floor((members / totalMembers) * 5)
                : 0;
            this.FACTION_COLORS[f].seats = Math.max(1, 1 + pctSeats);
        });
    }

    _getFactionKeyByColor(colorCode) {
        return Object.keys(this.FACTION_COLORS).find(k =>
            this.FACTION_COLORS[k].color === colorCode
        );
    }

    _getFactionByNation(nationId) {
        // Resolve a nation's faction color from game systems
        if (window.Nation && window.Nation.id === nationId && window.Nation.factionColor) {
            return window.Nation.factionColor;
        }
        if (window.GameEngine && window.GameEngine.nations) {
            const n = window.GameEngine.nations[nationId];
            if (n && n.factionColor) return n.factionColor;
        }
        return null;
    }

    getFactionInfo() {
        return { ...this.FACTION_COLORS };
    }

    getAvailableFactionColors() {
        return Object.keys(this.FACTION_COLORS).map(k => ({
            key: k,
            name: this.FACTION_COLORS[k].name,
            color: this.FACTION_COLORS[k].color,
            members: this.FACTION_COLORS[k].members,
            seats: this.FACTION_COLORS[k].seats
        }));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // QUERY API
    // ══════════════════════════════════════════════════════════════════════════

    getTerritoryById(idOrKey) {
        if (!idOrKey) return null;
        if (typeof idOrKey === 'string' && idOrKey.includes(',')) {
            return this.territories.get(idOrKey) || null;
        }
        if (typeof idOrKey === 'object' && idOrKey.x !== undefined) {
            return this.territories.get(`${idOrKey.x},${idOrKey.y}`) || null;
        }
        return null;
    }

    getNationTerritories(nationId) {
        const keys = this.nations.get(nationId) || [];
        return keys.map(k => this.territories.get(k)).filter(Boolean);
    }

    getAllTerritories() {
        return Array.from(this.territories.values());
    }

    getTerritoriesInBounds(minX, maxX, minY, maxY) {
        const out = [];
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const t = this.territories.get(`${x},${y}`);
                if (t) out.push(t);
            }
        }
        return out;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ══════════════════════════════════════════════════════════════════════════

    serialize() {
        return {
            territories: Array.from(this.territories.entries()),
            nations: Array.from(this.nations.entries()),
            worldBounds: { ...this.worldBounds },
            factionColors: { ...this.FACTION_COLORS }
        };
    }

    deserialize(data) {
        if (!data) return;
        this.territories = new Map(data.territories || []);
        this.nations = new Map(data.nations || []);
        this.worldBounds = data.worldBounds || { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        this.FACTION_COLORS = data.factionColors || this.FACTION_COLORS;
        console.log('Grid map data loaded from save');
    }
}

// Singleton instance
const GridMap = new GridMapData();
window.GridMap = GridMap;
