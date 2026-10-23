/**
 * Map Integration System
 * Connects the Enhanced Map Renderer with existing game systems
 */

class MapIntegration {
    constructor() {
        this.enhancedRenderer = null;
        this.isInitialized = false;
        this.gameSystemsReady = false;
        
        // System references
        this.gridMap = null;
        this.gameEngine = null;
        this.nationSystem = null;
        this.allianceSystem = null;
        this.diplomacySystem = null;
        this.warSystem = null;
    }
    
    /**
     * Initialize the map integration system
     */
    async initialize() {
        console.log('Initializing Map Integration...');
        
        // Wait for game systems to be ready
        await this.waitForGameSystems();
        
        // Find or create canvas
        const canvas = this.getOrCreateCanvas();
        if (!canvas) {
            console.error('Failed to create map canvas');
            return false;
        }
        
        // Load CSS styles
        this.loadMapStyles();
        
        // Initialize enhanced renderer
        this.enhancedRenderer = new EnhancedMapRenderer(canvas);
        
        // Connect to game systems
        this.connectGameSystems();
        
        // Setup integration events
        this.setupIntegrationEvents();
        
        this.isInitialized = true;
        console.log('Map Integration initialized successfully');
        
        return true;
    }
    
    /**
     * Wait for required game systems to be available
     */
    async waitForGameSystems() {
        return new Promise((resolve) => {
            const checkSystems = () => {
                const systemsReady = 
                    window.GridMap && 
                    window.GameEngine && 
                    window.EventBus;
                
                if (systemsReady) {
                    this.gridMap = window.GridMap;
                    this.gameEngine = window.GameEngine;
                    this.nationSystem = window.Nation;
                    this.allianceSystem = window.AllianceSystem;
                    this.diplomacySystem = window.DiplomacySystem;
                    this.warSystem = window.WarSystem;
                    
                    this.gameSystemsReady = true;
                    resolve();
                } else {
                    setTimeout(checkSystems, 100);
                }
            };
            
            checkSystems();
        });
    }
    
    /**
     * Get existing canvas or create new one.
     * Always prefer #game-map so the enhanced renderer takes over the
     * primary full-screen canvas that is already positioned as the background.
     */
    getOrCreateCanvas() {
        // Always use the primary game-map canvas first
        let canvas = document.getElementById('game-map') ||
                    document.getElementById('map-canvas') || 
                    document.getElementById('grid-canvas') ||
                    document.querySelector('#map-container canvas');
        
        if (!canvas) {
            // Create new canvas inside the map container
            canvas = document.createElement('canvas');
            canvas.id = 'game-map';
            canvas.className = 'game-map';
            
            // Find appropriate container
            const container = document.getElementById('map-container') ||
                            document.getElementById('game-container') ||
                            document.body;
            
            container.insertBefore(canvas, container.firstChild);
        }
        
        return canvas;
    }
    
    /**
     * Load map UI styles
     */
    loadMapStyles() {
        if (!document.getElementById('map-ui-styles')) {
            const link = document.createElement('link');
            link.id = 'map-ui-styles';
            link.rel = 'stylesheet';
            link.href = './map/map-ui-styles.css';
            document.head.appendChild(link);
        }
        
        // Also load FontAwesome if not already loaded
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const faLink = document.createElement('link');
            faLink.rel = 'stylesheet';
            faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
            document.head.appendChild(faLink);
        }
    }
    
    /**
     * Connect enhanced renderer to game systems
     */
    connectGameSystems() {
        if (!this.enhancedRenderer) return;
        
        // Override renderer methods to use game systems
        this.enhancedRenderer.getNationData = (nationId) => this.getNationData(nationId);
        this.enhancedRenderer.getAllianceData = (allianceId) => this.getAllianceData(allianceId);
        this.enhancedRenderer.getPlayerNation = () => this.getPlayerNation();
        this.enhancedRenderer.areNationsAtWar = (id1, id2) => this.areNationsAtWar(id1, id2);
        this.enhancedRenderer.hasTreatyWith = (id1, id2) => this.hasTreatyWith(id1, id2);
        this.enhancedRenderer.getAllAlliances = () => this.getAllAlliances();
    }
    
    /**
     * Setup integration event handlers
     */
    setupIntegrationEvents() {
        // Listen for game events and forward to renderer
        if (window.EventBus) {
            EventBus.on('nation_updated', (data) => {
                if (this.enhancedRenderer) {
                    this.enhancedRenderer.scheduleRender();
                }
            });
            
            EventBus.on('territory_claimed', (data) => {
                if (this.enhancedRenderer) {
                    this.enhancedRenderer.scheduleRender();
                }
            });
            
            EventBus.on('alliance_created', (data) => {
                if (this.enhancedRenderer) {
                    this.enhancedRenderer.updateAllianceLegend();
                    this.enhancedRenderer.scheduleRender();
                }
            });
            
            EventBus.on('war_declared', (data) => {
                if (this.enhancedRenderer) {
                    this.enhancedRenderer.scheduleRender();
                }
            });
            
            // Handle diplomacy panel requests
            EventBus.on('open_diplomacy_panel', (data) => {
                this.openDiplomacyPanel(data);
            });
            
            // Handle war panel requests
            EventBus.on('open_war_panel', (data) => {
                this.openWarPanel(data);
            });
        }
    }
    
    /**
     * Get nation data from game systems
     */
    getNationData(nationId) {
        // Try Nation entity first (the logged-in player's nation)
        if (window.Nation && window.Nation.isInitialized) {
            // Match by playerId OR by nation id field
            const isPlayer = (Nation.playerId && Nation.playerId === nationId) ||
                             (Nation.id && Nation.id === nationId) ||
                             (window.Player && Player.playerId && Player.playerId === nationId);
            if (isPlayer) {
                return {
                    id: nationId,
                    name: Nation.name || `Nation ${nationId}`,
                    leader: (window.Player ? Player.username : null) || Nation.leader || 'Unknown',
                    population: Nation.population || 0,
                    land: Nation.land || 0,
                    infrastructure: Nation.infra || Nation.infrastructure || 0,
                    soldiers: (Nation.militaryUnits && Nation.militaryUnits.soldiers) || Nation.soldiers || 0,
                    tanks: (Nation.militaryUnits && Nation.militaryUnits.tanks) || Nation.tanks || 0,
                    aircraft: (Nation.militaryUnits && Nation.militaryUnits.aircraft) || Nation.aircraft || 0,
                    ships: (Nation.militaryUnits && Nation.militaryUnits.ships) || Nation.ships || 0,
                    allianceId: Nation.allianceId,
                    allianceName: Nation.allianceName,
                    color: Nation.factionColor || this.generateColorForNation(nationId),
                    hasNukes: ((Nation.militaryUnits && Nation.militaryUnits.nukes) || Nation.nukes || 0) > 0,
                    hasSpyNetwork: Nation.improvements && Nation.improvements.spy_network,
                    government: Nation.government
                };
            }
        }
        
        // Try database systems
        if (window.DatabaseManager && DatabaseManager.nationDatabase) {
            const dbNation = DatabaseManager.nationDatabase.getNation(nationId);
            if (dbNation) {
                return this.formatNationData(dbNation);
            }
        }
        
        // Try player database
        if (window.DatabaseManager && DatabaseManager.playerDatabase) {
            const player = DatabaseManager.playerDatabase.getPlayer(nationId);
            if (player && player.nation) {
                return this.formatNationData(player.nation);
            }
        }

        // Try AI nations system — AI nations live in window.aiNations.aiNations Map
        if (window.aiNations && window.aiNations.aiNations) {
            const aiNation = window.aiNations.aiNations.get(nationId);
            if (aiNation) {
                return {
                    id: aiNation.id,
                    name: aiNation.name || `AI Nation ${nationId}`,
                    leader: aiNation.leader || 'AI Leader',
                    population: aiNation.population || 0,
                    land: aiNation.land || 0,
                    infrastructure: aiNation.infra || 0,
                    soldiers: (aiNation.militaryUnits && aiNation.militaryUnits.soldiers) || 0,
                    tanks: (aiNation.militaryUnits && aiNation.militaryUnits.tanks) || 0,
                    aircraft: (aiNation.militaryUnits && aiNation.militaryUnits.aircraft) || 0,
                    ships: (aiNation.militaryUnits && aiNation.militaryUnits.ships) || 0,
                    allianceId: aiNation.allianceId || null,
                    allianceName: aiNation.allianceName || null,
                    color: aiNation.factionColor || this.generateColorForNation(nationId),
                    hasNukes: false,
                    hasSpyNetwork: false,
                    isAI: true
                };
            }
        }
        
        // Fallback
        return {
            id: nationId,
            name: `Nation ${nationId}`,
            leader: 'Unknown',
            population: 0,
            land: 0,
            infrastructure: 0,
            soldiers: 0,
            tanks: 0,
            aircraft: 0,
            ships: 0,
            color: this.generateColorForNation(nationId)
        };
    }
    
    /**
     * Format nation data consistently
     */
    formatNationData(rawData) {
        return {
            id: rawData.id || rawData.playerId,
            name: rawData.name || `Nation ${rawData.id}`,
            leader: rawData.leader || rawData.username || 'Unknown',
            population: rawData.population || 0,
            land: rawData.land || 0,
            infrastructure: rawData.infrastructure || 0,
            soldiers: rawData.soldiers || 0,
            tanks: rawData.tanks || 0,
            aircraft: rawData.aircraft || 0,
            ships: rawData.ships || 0,
            allianceId: rawData.allianceId,
            allianceName: rawData.allianceName,
            color: rawData.color || rawData.factionColor || this.generateColorForNation(rawData.id),
            hasNukes: (rawData.nukes || 0) > 0,
            hasSpyNetwork: rawData.improvements && rawData.improvements.spy_network
        };
    }
    
    /**
     * Get alliance data
     */
    getAllianceData(allianceId) {
        if (this.allianceSystem && this.allianceSystem.getAlliance) {
            return this.allianceSystem.getAlliance(allianceId);
        }
        
        return {
            id: allianceId,
            name: `Alliance ${allianceId}`,
            color: this.generateColorForAlliance(allianceId),
            memberCount: 0
        };
    }
    
    /**
     * Get player's nation
     */
    getPlayerNation() {
        if (window.Nation) {
            return this.getNationData(Nation.playerId || Player.playerId);
        }
        
        if (window.Player && Player.playerId) {
            return this.getNationData(Player.playerId);
        }
        
        return null;
    }
    
    /**
     * Check if nations are at war
     */
    areNationsAtWar(nationId1, nationId2) {
        if (this.warSystem && this.warSystem.areNationsAtWar) {
            return this.warSystem.areNationsAtWar(nationId1, nationId2);
        }
        return false;
    }
    
    /**
     * Check if nations have a treaty
     */
    hasTreatyWith(nationId1, nationId2) {
        if (this.diplomacySystem && this.diplomacySystem.hasMutualPact) {
            return this.diplomacySystem.hasMutualPact(nationId1, nationId2);
        }
        return false;
    }
    
    /**
     * Get all alliances
     */
    getAllAlliances() {
        if (this.allianceSystem && this.allianceSystem.alliances) {
            return Object.values(this.allianceSystem.alliances).map(alliance => ({
                id: alliance.id,
                name: alliance.name,
                color: alliance.color || this.generateColorForAlliance(alliance.id),
                memberCount: alliance.members ? alliance.members.length : 0
            }));
        }
        
        return [];
    }
    
    /**
     * Open diplomacy panel
     */
    openDiplomacyPanel(data) {
        // Create or show diplomacy panel UI
        console.log('Opening diplomacy panel for:', data);
        
        if (window.UI && window.UI.showPanel) {
            UI.showPanel('diplomacy', data);
        } else if (window.DiplomacyPanel) {
            DiplomacyPanel.open(data);
        } else {
            // Fallback - emit to existing diplomacy system
            if (this.diplomacySystem) {
                if (data.action === 'propose_treaty') {
                    // Handle treaty proposal
                } else if (data.action === 'send_aid') {
                    // Handle aid proposal
                }
            }
        }
    }
    
    /**
     * Open war panel
     */
    openWarPanel(data) {
        console.log('Opening war panel for:', data);
        
        if (window.UI && window.UI.showPanel) {
            UI.showPanel('war', data);
        } else if (window.WarPanel) {
            WarPanel.open(data);
        } else {
            // Fallback - emit to existing war system
            if (this.warSystem) {
                if (data.action === 'launch_missile') {
                    // Handle missile launch
                } else if (data.action === 'launch_nuke') {
                    // Handle nuke launch
                } else if (data.action === 'spy_operation') {
                    // Handle spy operation
                }
            }
        }
    }
    
    /**
     * Generate consistent colors
     */
    generateColorForNation(nationId) {
        const keys = (typeof GAME_COLOR_KEYS !== 'undefined') ? GAME_COLOR_KEYS
            : ['red','blue','green','yellow','purple','orange','pink','aqua','lime','black'];
        const src = (typeof GAME_COLORS !== 'undefined') ? GAME_COLORS : {};
        const key = keys[Math.abs(this.hashCode(String(nationId))) % keys.length];
        return src[key] ? src[key].hex : '#94a3b8';
    }

    generateColorForAlliance(allianceId) {
        const keys = (typeof GAME_COLOR_KEYS !== 'undefined') ? GAME_COLOR_KEYS
            : ['red','blue','green','yellow','purple','orange','pink','aqua','lime','black'];
        const src = (typeof GAME_COLORS !== 'undefined') ? GAME_COLORS : {};
        const key = keys[Math.abs(this.hashCode(String(allianceId))) % keys.length];
        return src[key] ? src[key].hex : '#94a3b8';
    }
    
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }
    
    /**
     * Get the enhanced renderer instance
     */
    getRenderer() {
        return this.enhancedRenderer;
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.enhancedRenderer) {
            this.enhancedRenderer.destroy();
            this.enhancedRenderer = null;
        }
        
        this.isInitialized = false;
        this.gameSystemsReady = false;
    }
}

// Create global instance
const mapIntegrationInstance = new MapIntegration();
window.MapIntegration = mapIntegrationInstance;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.MapIntegration.initialize();
    });
} else {
    // DOM already loaded
    setTimeout(() => {
        window.MapIntegration.initialize();
    }, 100);
}

// Export for manual initialization
window.initializeEnhancedMap = () => {
    return window.MapIntegration.initialize();
};