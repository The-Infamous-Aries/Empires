/**
 * Map Data - Grid-Based Territory System
 * Dominion Wars - Nation Building Strategy Game
 * 
 * Each grid square represents 100 square miles of territory
 * Nations can claim and build the shape they want
 */

class GridMapData {
    constructor() {
        this.GRID_SIZE = 100; // Each square = 100 miles
        this.DEFAULT_VIEW_SIZE = 50; // Default visible grid size
        this.territories = new Map(); // key: "x,y", value: territory data
        this.nations = new Map(); // key: nationId, value: nation territories
        this.worldBounds = {
            minX: -25,
            maxX: 25,
            minY: -25,
            maxY: 25
        };
        
        // 12 Faction Colors for World Congress
        this.FACTION_COLORS = {
            CRIMSON: { name: 'Crimson Republic', color: '#dc2626', seats: 0, members: 0 },
            AZURE: { name: 'Azure Federation', color: '#2563eb', seats: 0, members: 0 },
            EMERALD: { name: 'Emerald Alliance', color: '#059669', seats: 0, members: 0 },
            GOLDEN: { name: 'Golden Empire', color: '#d97706', seats: 0, members: 0 },
            VIOLET: { name: 'Violet Dominion', color: '#7c3aed', seats: 0, members: 0 },
            CORAL: { name: 'Coral Coalition', color: '#ea580c', seats: 0, members: 0 },
            TEAL: { name: 'Teal Territories', color: '#0d9488', seats: 0, members: 0 },
            ROSE: { name: 'Rose Realm', color: '#e11d48', seats: 0, members: 0 },
            INDIGO: { name: 'Indigo Union', color: '#4338ca', seats: 0, members: 0 },
            AMBER: { name: 'Amber States', color: '#f59e0b', seats: 0, members: 0 },
            FOREST: { name: 'Forest League', color: '#16a34a', seats: 0, members: 0 },
            SLATE: { name: 'Slate Confederation', color: '#475569', seats: 0, members: 0 }
        };
        
        this.initialize();
    }
    
    /**
     * Initialize the grid map system
     */
    initialize() {
        console.log('Initializing Grid Map System...');
        
        // Create initial empty grid within world bounds
        this.generateInitialGrid();
        
        // Initialize faction data
        this.initializeFactions();
        
        console.log('Grid Map System initialized');
    }
    
    /**
     * Generate initial empty grid
     */
    generateInitialGrid() {
        for (let x = this.worldBounds.minX; x <= this.worldBounds.maxX; x++) {
            for (let y = this.worldBounds.minY; y <= this.worldBounds.maxY; y++) {
                const key = `${x},${y}`;
                this.territories.set(key, {
                    x: x,
                    y: y,
                    ownerId: null,
                    ownerFaction: null,
                    claimedDate: null,
                    improvements: [],
                    resources: this.generateTileResources(x, y),
                    terrain: this.generateTerrain(x, y),
                    population: 0,
                    infrastructure: 0
                });
            }
        }
    }
    
    /**
     * Initialize faction tracking
     */
    initializeFactions() {
        Object.keys(this.FACTION_COLORS).forEach(faction => {
            this.FACTION_COLORS[faction].members = 0;
            this.FACTION_COLORS[faction].seats = 1; // Minimum 1 seat per faction
        });
    }
    
    /**
     * Generate terrain type for a grid tile
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
     * Generate base resources for a grid tile
     */
    generateTileResources(x, y) {
        const terrain = this.generateTerrain(x, y);
        const baseResources = {
            food: 0,
            materials: 0,
            energy: 0,
            money: 0
        };
        
        // Resource generation based on terrain
        switch (terrain) {
            case 'plains':
                baseResources.food = 50 + Math.floor(Math.random() * 30);
                baseResources.money = 30 + Math.floor(Math.random() * 20);
                break;
            case 'forest':
                baseResources.materials = 40 + Math.floor(Math.random() * 25);
                baseResources.food = 25 + Math.floor(Math.random() * 15);
                break;
            case 'hills':
                baseResources.materials = 60 + Math.floor(Math.random() * 30);
                baseResources.energy = 20 + Math.floor(Math.random() * 15);
                break;
            case 'mountain':
                baseResources.materials = 80 + Math.floor(Math.random() * 40);
                baseResources.energy = 30 + Math.floor(Math.random() * 20);
                break;
            case 'water':
                baseResources.food = 70 + Math.floor(Math.random() * 35);
                break;
            case 'swamp':
                baseResources.energy = 25 + Math.floor(Math.random() * 15);
                break;
        }
        
        return baseResources;
    }
    
    /**
     * Simple noise function for terrain generation
     */
    simpleNoise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 4.1414) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    }
    
    /**
     * Claim territory for a nation
     */
    claimTerritory(x, y, nationId, factionColor) {
        const key = `${x},${y}`;
        const territory = this.territories.get(key);
        
        if (!territory) {
            // Expand world bounds if needed
            this.expandWorldBounds(x, y);
            
            // Create new territory
            this.territories.set(key, {
                x: x,
                y: y,
                ownerId: nationId,
                ownerFaction: factionColor,
                claimedDate: Date.now(),
                improvements: [],
                resources: this.generateTileResources(x, y),
                terrain: this.generateTerrain(x, y),
                population: 0,
                infrastructure: 0
            });
        } else if (!territory.ownerId) {
            // Claim unclaimed territory
            territory.ownerId = nationId;
            territory.ownerFaction = factionColor;
            territory.claimedDate = Date.now();
        } else {
            throw new Error('Territory already claimed');
        }
        
        // Update nation territories tracking
        if (!this.nations.has(nationId)) {
            this.nations.set(nationId, []);
        }
        this.nations.get(nationId).push(key);
        
        // Update faction member count
        this.updateFactionData();
        
        EventBus.emit('territory_claimed', {
            x: x,
            y: y,
            nationId: nationId,
            faction: factionColor
        });
        
        return true;
    }
    
    /**
     * Expand world bounds when needed
     */
    expandWorldBounds(x, y) {
        let expanded = false;
        
        if (x < this.worldBounds.minX) {
            this.worldBounds.minX = x - 10;
            expanded = true;
        }
        if (x > this.worldBounds.maxX) {
            this.worldBounds.maxX = x + 10;
            expanded = true;
        }
        if (y < this.worldBounds.minY) {
            this.worldBounds.minY = y - 10;
            expanded = true;
        }
        if (y > this.worldBounds.maxY) {
            this.worldBounds.maxY = y + 10;
            expanded = true;
        }
        
        if (expanded) {
            // Fill in new empty territories
            this.fillExpandedArea();
            console.log('World bounds expanded to:', this.worldBounds);
        }
    }
    
    /**
     * Fill expanded area with empty territories
     */
    fillExpandedArea() {
        for (let x = this.worldBounds.minX; x <= this.worldBounds.maxX; x++) {
            for (let y = this.worldBounds.minY; y <= this.worldBounds.maxY; y++) {
                const key = `${x},${y}`;
                if (!this.territories.has(key)) {
                    this.territories.set(key, {
                        x: x,
                        y: y,
                        ownerId: null,
                        ownerFaction: null,
                        claimedDate: null,
                        improvements: [],
                        resources: this.generateTileResources(x, y),
                        terrain: this.generateTerrain(x, y),
                        population: 0,
                        infrastructure: 0
                    });
                }
            }
        }
    }
    
    /**
     * Update faction data for World Congress
     */
    updateFactionData() {
        // Reset faction counts
        Object.keys(this.FACTION_COLORS).forEach(faction => {
            this.FACTION_COLORS[faction].members = 0;
        });
        
        // Count members by faction
        for (const territories of this.nations.values()) {
            for (const territoryKey of territories) {
                const territory = this.territories.get(territoryKey);
                if (territory && territory.ownerFaction) {
                    const factionKey = this.getFactionKey(territory.ownerFaction);
                    if (factionKey && this.FACTION_COLORS[factionKey]) {
                        this.FACTION_COLORS[factionKey].members++;
                    }
                }
            }
        }
        
        // Calculate seats (minimum 1, plus 5% representation)
        const totalMembers = Object.values(this.FACTION_COLORS).reduce((sum, faction) => sum + faction.members, 0);
        
        Object.keys(this.FACTION_COLORS).forEach(faction => {
            const members = this.FACTION_COLORS[faction].members;
            const percentageSeats = Math.floor((members / totalMembers) * 0.05 * 100); // 5% representation
            this.FACTION_COLORS[faction].seats = Math.max(1, 1 + percentageSeats);
        });
    }
    
    /**
     * Get faction key from color code
     */
    getFactionKey(colorCode) {
        return Object.keys(this.FACTION_COLORS).find(key => 
            this.FACTION_COLORS[key].color === colorCode
        );
    }
    
    /**
     * Get territory at coordinates
     */
    getTerritory(x, y) {
        return this.territories.get(`${x},${y}`);
    }
    
    /**
     * Get all territories for a nation
     */
    getNationTerritories(nationId) {
        const territoryKeys = this.nations.get(nationId) || [];
        return territoryKeys.map(key => this.territories.get(key)).filter(Boolean);
    }
    
    /**
     * Get territories in view bounds
     */
    getTerritoriesInBounds(minX, maxX, minY, maxY) {
        const territories = [];
        
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const territory = this.getTerritory(x, y);
                if (territory) {
                    territories.push(territory);
                }
            }
        }
        
        return territories;
    }
    
    /**
     * Get faction information
     */
    getFactionInfo() {
        return { ...this.FACTION_COLORS };
    }
    
    /**
     * Get available faction colors
     */
    getAvailableFactionColors() {
        return Object.keys(this.FACTION_COLORS).map(key => ({
            key: key,
            name: this.FACTION_COLORS[key].name,
            color: this.FACTION_COLORS[key].color,
            members: this.FACTION_COLORS[key].members,
            seats: this.FACTION_COLORS[key].seats
        }));
    }
    
    /**
     * Serialize map data for saving
     */
    serialize() {
        return {
            territories: Array.from(this.territories.entries()),
            nations: Array.from(this.nations.entries()),
            worldBounds: { ...this.worldBounds },
            factionColors: { ...this.FACTION_COLORS }
        };
    }
    
    /**
     * Deserialize map data from save
     */
    deserialize(data) {
        this.territories = new Map(data.territories);
        this.nations = new Map(data.nations);
        this.worldBounds = data.worldBounds;
        this.FACTION_COLORS = data.factionColors || this.FACTION_COLORS;
        
        console.log('Grid map data loaded');
    }
}

// Create global instance and expose on window
const GridMap = new GridMapData();
window.GridMap = GridMap;