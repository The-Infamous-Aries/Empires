const GameConstants = {
    // ══════════════════════════════════════════════════════════════════════════════════════════════════════
    // DEBUG CONSTANTS (referenced by GameConfig.DEBUG in events-system.js, event-system.js, game-engine.js)
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════════

    DEBUG_ENABLED: false,       // GameConfig.DEBUG.ENABLED — master debug toggle
    DEBUG_LOG_LEVEL: 'info',    // GameConfig.DEBUG.LOG_LEVEL — debug:0, info:1, warn:2, error:3
    DEBUG_SHOW_FPS: false,      // GameConfig.DEBUG.SHOW_FPS — display FPS overlay
};

// Freeze the object to prevent modifications
Object.freeze(GameConstants);

// Make available globally
if (typeof window !== 'undefined') {
    window.GameConstants = GameConstants;
    window.GameConfig = GameConstants; // Alias for compatibility
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConstants;
}
