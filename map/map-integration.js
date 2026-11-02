/**
 * Map Integration System
 * Connects the Enhanced Map Renderer with existing game systems.
 *
 * Responsibilities:
 *  1. Dynamically load map filter modules (map/Filters/*.js)
 *  2. Wait for game systems (GridMap, GameEngine, EventBus)
 *  3. Find or create the <canvas id="game-map">
 *  4. Load map-ui-styles.css
 *  5. Instantiate EnhancedMapRenderer
 *  6. Connect renderer to Nation, Alliance, Diplomacy, War, WorldBank systems
 *  7. Forward game events to the renderer
 *  8. Auto-initialize when DOM is ready
 */

class MapIntegration {
    constructor() {
        this.enhancedRenderer = null;
        this.mapInteraction = null;
        this.isInitialized = false;
        this.gameSystemsReady = false;

        // System references
        this.gridMap = null;
        this.gameEngine = null;
        this.nationSystem = null;
        this.allianceSystem = null;
        this.diplomacySystem = null;
        this.warSystem = null;
        this.worldBank = null;
        this.economySystem = null;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════

    async initialize() {
        console.log('Initializing Map Integration...');

        // 1. Wait for core game systems
        await this.waitForGameSystems();

        // 2. Load filter modules
        await this.loadFilterModules();

        // 3. Find or create canvas
        const canvas = this.getOrCreateCanvas();
        if (!canvas) {
            console.error('Failed to create map canvas');
            return false;
        }

        // 4. Load CSS styles
        this.loadMapStyles();

        // 5. Instantiate enhanced renderer
        this.enhancedRenderer = new EnhancedMapRenderer(canvas);

        // 6. Connect game systems to renderer + filters
        this.connectGameSystems();

        // 7. Setup integration events
        this.setupIntegrationEvents();

        // 8. Instantiate map interaction (wires input)
        this.mapInteraction = new MapInteraction(this.enhancedRenderer);
        this.mapInteraction.initialize(canvas);

        this.isInitialized = true;
        console.log('Map Integration initialized successfully');
        return true;
    }

    /**
     * Wait for required game systems to be available on window.
     */
    waitForGameSystems() {
        return new Promise((resolve) => {
            const check = () => {
                const ready =
                    window.GridMap &&
                    window.EventBus;

                if (ready) {
                    this.gridMap = window.GridMap;
                    this.gameEngine = window.GameEngine || null;
                    this.nationSystem = window.NationSystem || window.Nation || null;
                    this.allianceSystem = window.AllianceSystem || null;
                    this.diplomacySystem = window.DiplomacySystem || null;
                    this.warSystem = window.WarSystem || null;
                    this.worldBank = window.WorldBankSystem || null;
                    this.economySystem = window.EconomySystem || null;
                    this.gameSystemsReady = true;
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    /**
     * Dynamically load filter module scripts so filter classes exist
     * before EnhancedMapRenderer tries to instantiate them.
     */
    loadFilterModules() {
        return new Promise((resolve) => {
            const filters = [
                'map/Filters/base-filter.js',
                'map/Filters/nation-filter.js',
                'map/Filters/alliance-filter.js',
                'map/Filters/treaty-filter.js',
                'map/Filters/war-filter.js',
                'map/Filters/currency-filter.js'
            ];

            let loaded = 0;
            const onLoad = () => {
                loaded++;
                if (loaded >= filters.length) resolve();
            };

            for (const src of filters) {
                const s = document.createElement('script');
                s.src = src;
                s.onload = onLoad;
                s.onerror = () => {
                    console.warn('Failed to load filter module:', src);
                    onLoad();
                };
                document.head.appendChild(s);
            }
        });
    }

    /**
     * Find existing canvas or create one.
     * Prefers #game-map, falls back to creating one in #map-container /
     * #game-container / document.body.
     */
    getOrCreateCanvas() {
        let canvas = document.getElementById('game-map') ||
            document.getElementById('map-canvas') ||
            document.getElementById('grid-canvas') ||
            document.querySelector('#map-container canvas');

        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'game-map';
            canvas.className = 'game-map';

            const container = document.getElementById('map-container') ||
                document.getElementById('game-container') ||
                document.body;

            // Make canvas fill the container
            canvas.style.display = 'block';
            canvas.style.width = '100%';
            canvas.style.height = '100%';

            container.insertBefore(canvas, container.firstChild);
        }

        return canvas;
    }

    /**
     * Load map UI stylesheet and FontAwesome.
     */
    loadMapStyles() {
        if (!document.getElementById('map-ui-styles')) {
            const link = document.createElement('link');
            link.id = 'map-ui-styles';
            link.rel = 'stylesheet';
            link.href = './map/map-ui-styles.css';
            document.head.appendChild(link);
        }

        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fa = document.createElement('link');
            fa.rel = 'stylesheet';
            fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
            document.head.appendChild(fa);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CONNECT SYSTEMS
    // ══════════════════════════════════════════════════════════════════════════

    connectGameSystems() {
        if (!this.enhancedRenderer) return;

        // Pass system references to renderer and all filters
        const systems = {
            gridMap: this.gridMap,
            gameEngine: this.gameEngine,
            nationSystem: this.nationSystem,
            allianceSystem: this.allianceSystem,
            diplomacySystem: this.diplomacySystem,
            warSystem: this.warSystem,
            worldBank: this.worldBank,
            economySystem: this.economySystem,
            enhancedRenderer: this.enhancedRenderer
        };

        this.enhancedRenderer.setSystems(systems);

        // Override renderer data-access methods to read from live systems
        this.enhancedRenderer.getNationData = (nationId) => this.getNationData(nationId);
        this.enhancedRenderer.getAllianceData = (allianceId) => this.getAllianceData(allianceId);
        this.enhancedRenderer.getPlayerNation = () => this.getPlayerNation();
        this.enhancedRenderer.areNationsAtWar = (a, b) => this.areNationsAtWar(a, b);
        this.enhancedRenderer.hasTreatyWith = (a, b) => this.hasTreatyWith(a, b);
        this.enhancedRenderer.getAllAlliances = () => this.getAllAlliances();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // EVENT WIRING
    // ══════════════════════════════════════════════════════════════════════════

    setupIntegrationEvents() {
        if (!window.EventBus || !this.enhancedRenderer) return;

        // Re-render on game events
        const eventsToForward = [
            'nation_updated', 'territory_claimed', 'territory_released',
            'territory_transferred', 'alliance_created', 'alliance_updated',
            'war_declared', 'treaty_signed', 'land_purchased', 'infra_purchased'
        ];

        for (const ev of eventsToForward) {
            window.EventBus.on(ev, () => {
                this.enhancedRenderer.scheduleRender();
                if (ev === 'alliance_created' || ev === 'alliance_updated' ||
                    ev === 'treaty_signed') {
                    this.enhancedRenderer.updateLegend();
                }
            });
        }

        // Diplomacy panel requests from the map
        window.EventBus.on('open_diplomacy_panel', (data) => this.openDiplomacyPanel(data));
        window.EventBus.on('open_war_panel', (data) => this.openWarPanel(data));

        // Claim requests from the map interaction controller
        window.EventBus.on('claim_territory', (data) => {
            if (window.TerritoryManager && typeof window.TerritoryManager.handleTerritoryClaimRequest === 'function') {
                window.TerritoryManager.handleTerritoryClaimRequest(data);
            }
        });

        window.EventBus.on('abandon_territory', (data) => {
            if (window.TerritoryManager && typeof window.TerritoryManager.handleTerritoryAbandonRequest === 'function') {
                window.TerritoryManager.handleTerritoryAbandonRequest(data);
            }
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DATA ACCESS (used by renderer filters)
    // ══════════════════════════════════════════════════════════════════════════

    getNationData(nationId) {
        // Try player's nation first
        if (window.Nation && (window.Nation.id === nationId || window.Nation.playerId === nationId)) {
            return {
                id: nationId,
                name: window.Nation.name || `Nation ${nationId}`,
                leader: (window.Player ? window.Player.username : null) || window.Nation.leader || 'Unknown',
                population: window.Nation.population || 0,
                land: window.Nation.land || 0,
                infrastructure: window.Nation.infra || window.Nation.infrastructure || 0,
                soldiers: (window.Nation.militaryUnits && window.Nation.militaryUnits.soldiers) || 0,
                tanks: (window.Nation.militaryUnits && window.Nation.militaryUnits.tanks) || 0,
                aircraft: (window.Nation.militaryUnits && window.Nation.militaryUnits.aircraft) || 0,
                ships: (window.Nation.militaryUnits && window.Nation.militaryUnits.ships) || 0,
                allianceId: window.Nation.allianceId,
                allianceName: window.Nation.allianceName,
                currency: window.Nation.currency || 'aurel',
                color: window.Nation.factionColor,
                hasNukes: ((window.Nation.militaryUnits && window.Nation.militaryUnits.nukes) || 0) > 0,
                hasSpyNetwork: window.Nation.improvements && window.Nation.improvements.spy_network,
                government: window.Nation.government
            };
        }

        // Try GameEngine nations
        if (window.GameEngine && window.GameEngine.nations) {
            const n = window.GameEngine.nations[nationId];
            if (n) {
                return {
                    id: n.id || nationId,
                    name: n.name || `Nation ${nationId}`,
                    leader: n.leader || 'Unknown',
                    population: n.population || 0,
                    land: n.land || 0,
                    infrastructure: n.infra || 0,
                    soldiers: (n.militaryUnits && n.militaryUnits.soldiers) || 0,
                    tanks: (n.militaryUnits && n.militaryUnits.tanks) || 0,
                    aircraft: (n.militaryUnits && n.militaryUnits.aircraft) || 0,
                    ships: (n.militaryUnits && n.militaryUnits.ships) || 0,
                    allianceId: n.allianceId,
                    allianceName: n.allianceName,
                    currency: n.currency || 'aurel',
                    color: n.factionColor
                };
            }
        }

        // Fallback
        return {
            id: nationId,
            name: `Nation ${nationId}`,
            leader: 'Unknown',
            population: 0, land: 0, infrastructure: 0,
            color: '#94a3b8'
        };
    }

    getAllianceData(allianceId) {
        if (this.allianceSystem && this.allianceSystem.getAlliance) {
            return this.allianceSystem.getAlliance(allianceId);
        }
        return {
            id: allianceId,
            name: `Alliance ${allianceId}`,
            color: '#94a3b8',
            memberCount: 0
        };
    }

    getPlayerNation() {
        if (window.Nation) return window.Nation;
        if (window.Player && Player.playerId) {
            return this.getNationData(Player.playerId);
        }
        return null;
    }

    areNationsAtWar(id1, id2) {
        if (this.warSystem && this.warSystem.areNationsAtWar) {
            return this.warSystem.areNationsAtWar(id1, id2);
        }
        return false;
    }

    hasTreatyWith(id1, id2) {
        if (this.diplomacySystem && this.diplomacySystem.hasMutualPact) {
            return this.diplomacySystem.hasMutualPact(id1, id2);
        }
        return false;
    }

    getAllAlliances() {
        if (this.allianceSystem && this.allianceSystem.alliances) {
            return Object.values(this.allianceSystem.alliances).map(a => ({
                id: a.id,
                name: a.name,
                color: a.color || '#94a3b8',
                memberCount: a.members ? a.members.length : 0
            }));
        }
        return [];
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PANEL HANDLERS
    // ══════════════════════════════════════════════════════════════════════════

    openDiplomacyPanel(data) {
        console.log('Opening diplomacy panel:', data);
        if (window.UI && window.UI.showPanel) {
            window.UI.showPanel('diplomacy', data);
        } else if (window.DiplomacyPanel) {
            window.DiplomacyPanel.open(data);
        }
    }

    openWarPanel(data) {
        console.log('Opening war panel:', data);
        if (window.UI && window.UI.showPanel) {
            window.UI.showPanel('war', data);
        } else if (window.WarPanel) {
            window.WarPanel.open(data);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PUBLIC API / CLEANUP
    // ══════════════════════════════════════════════════════════════════════════

    getRenderer() {
        return this.enhancedRenderer;
    }

    getInteraction() {
        return this.mapInteraction;
    }

    destroy() {
        if (this.enhancedRenderer) {
            this.enhancedRenderer.destroy();
            this.enhancedRenderer = null;
        }
        if (this.mapInteraction) {
            this.mapInteraction.destroy();
            this.mapInteraction = null;
        }
        this.isInitialized = false;
        this.gameSystemsReady = false;
    }
}

// Singleton
const mapIntegrationInstance = new MapIntegration();
window.MapIntegration = mapIntegrationInstance;

// Auto-initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.MapIntegration.initialize();
    });
} else {
    setTimeout(() => {
        window.MapIntegration.initialize();
    }, 100);
}

// Manual init hook
window.initializeEnhancedMap = () => {
    return window.MapIntegration.initialize();
};
