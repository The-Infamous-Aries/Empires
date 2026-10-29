/**
 * GAME COLORS — Single Source of Truth
 * =====================================
 * Exactly 10 factions, one per PNG in assets/images/Colors/.
 * All other files import from here (or reference GAME_COLORS on window).
 *
 * Key   = lowercase filename without extension (matches the PNG name)
 * hex   = CSS color used for map tiles, UI indicators, and canvas fills
 * name  = display name shown in the World Congress / faction picker
 * image = path served by Express static middleware
 */

const GAME_COLORS = {
    aqua: {
        key:   'aqua',
        name:  'Aqua Federation',
        hex:   '#00BFBF',
        image: '/assets/images/Colors/aqua.png'
    },
    black: {
        key:   'black',
        name:  'Black Empire',
        hex:   '#1a1a1a',
        image: '/assets/images/Colors/black.png'
    },
    blue: {
        key:   'blue',
        name:  'Blue Republic',
        hex:   '#0066FF',
        image: '/assets/images/Colors/blue.png'
    },
    green: {
        key:   'green',
        name:  'Green Alliance',
        hex:   '#00AA00',
        image: '/assets/images/Colors/green.png'
    },
    lime: {
        key:   'lime',
        name:  'Lime Dominion',
        hex:   '#7FCC00',
        image: '/assets/images/Colors/lime.png'
    },
    orange: {
        key:   'orange',
        name:  'Orange Coalition',
        hex:   '#FF8C00',
        image: '/assets/images/Colors/orange.png'
    },
    pink: {
        key:   'pink',
        name:  'Pink Realm',
        hex:   '#FF69B4',
        image: '/assets/images/Colors/pink.png'
    },
    purple: {
        key:   'purple',
        name:  'Purple Sovereignty',
        hex:   '#8A2BE2',
        image: '/assets/images/Colors/purple.png'
    },
    red: {
        key:   'red',
        name:  'Red Confederation',
        hex:   '#E00000',
        image: '/assets/images/Colors/red.png'
    },
    yellow: {
        key:   'yellow',
        name:  'Yellow Union',
        hex:   '#FFD700',
        image: '/assets/images/Colors/yellow.png'
    }
};

/** Ordered array — consistent iteration order everywhere. */
const GAME_COLOR_KEYS = Object.keys(GAME_COLORS);  // 10 entries

/**
 * Look up a GAME_COLORS entry by key (case-insensitive, tolerant).
 * Returns undefined for unknown keys.
 */
function getColor(key) {
    return GAME_COLORS[String(key).toLowerCase()];
}

/**
 * Return the hex value for a key, or a neutral grey fallback.
 */
function colorHex(key) {
    const c = getColor(key);
    return c ? c.hex : '#94a3b8';
}

/**
 * Return the image URL for a key, or null.
 */
function colorImage(key) {
    const c = getColor(key);
    return c ? c.image : null;
}

/**
 * Assign one of the 10 colors to index i (round-robin).
 * Used by AI nation creation.
 */
function colorForIndex(i) {
    return GAME_COLORS[GAME_COLOR_KEYS[((i % 10) + 10) % 10]];
}

// ── Browser global ─────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
    window.GAME_COLORS      = GAME_COLORS;
    window.GAME_COLOR_KEYS  = GAME_COLOR_KEYS;
    window.getColor         = getColor;
    window.colorHex         = colorHex;
    window.colorImage       = colorImage;
    window.colorForIndex    = colorForIndex;
}

// ── Node.js export ─────────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GAME_COLORS, GAME_COLOR_KEYS, getColor, colorHex, colorImage, colorForIndex };
}
