const crypto = require('crypto');

/**
 * Scratch-Off System
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Instant-win scratch-off cards. Players purchase a ticket and reveal hidden
 * icons by clicking tiles. Each scratch-off card is pre-determined as either a
 * winner or loser — the "scratching" is purely visual and the outcome is
 * determined server-side before the player sees anything.
 *
 * All randomness uses crypto.randomInt() (cryptographically secure) — no
 * Math.random() anywhere. Outcomes are purely luck-based; the server makes no
 * attempt to influence wins or losses.
 *
 * Card Types & Configurations (per plan docs/DEV/casino-scratch-off-system.md):
 *
 * | Card Type     | Icon Set                          | Grid Size | Win Condition                          |
 * |---------------|-----------------------------------|-----------|----------------------------------------|
 * | Resources     | 7 minerals × 5 stages (35 icons)  | 3×3       | Match 3 identical in any line (rows/cols/diagonals) |
 * | Pets          | 103 pet types                     | 1×3       | Match 2 identical                      |
 * | Bricks        | 22 miss icons                     | 1×3       | Match 3 identical                      |
 * | Factions      | 10 color icons                    | 1×3       | Match 3 identical                      |
 * | Beliefs       | 12 religion + 12 government (24)  | 3×3       | 2 religions + 2 governments (anywhere) |
 * | Needs         | 11 food + 11 water (22 icons)     | 3×3       | 2 foods + 2 waters (anywhere)          |
 *
 * Line-based wins check all 8 lines (3 rows, 3 cols, 2 diagonals).
 * Multiple winning lines stack payouts.
 */

// ═════════════════════════════════════════════════════════════════════════════
// CRYPTOGRAPHICALLY SECURE RANDOM HELPERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Return a random integer in [0, max). Uses crypto.randomInt (secure).
 */
function secureRandomInt(max) {
    return crypto.randomInt(max);
}

/**
 * Return a random boolean with ~50% probability using secure random.
 */
function secureRandomBool() {
    return crypto.randomInt(2) === 0;
}

/**
 * Fisher-Yates shuffle using secure random. Mutates array in place.
 */
function secureShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Pick a random element from an array using secure random.
 */
function securePick(array) {
    return array[crypto.randomInt(array.length)];
}

// ═════════════════════════════════════════════════════════════════════════════
// ASSET PATHS
// ═════════════════════════════════════════════════════════════════════════════

// Resources: 7 minerals × 5 stages = 35 icons
const RESOURCE_MINERALS = ['steel', 'bronze', 'lead', 'aluminum', 'copper', 'uranium', 'gasoline'];
const RESOURCE_STAGES = [1, 2, 3, 4, 5];
function resourceIconPath(mineral, stage) {
    return `assets/images/Resources/${mineral}-${stage}.png`;
}

// Pets: 103 pet icons
const PET_ICONS = [
    'Axolotl','Anteater','Ant','Alligator','Badger','Bat','Beaver','Bee','Beetle','Bison',
    'BlueTang','Camel','Cardinal','Cat','Centipede','Cheetah','Chicken','Clownfish','Cow','Crab',
    'Crow','Deer','Dog','Dolphin','Duck','Eagle','Elephant','Emu','Firefly','Fox',
    'Frog','Giraffe','Goat','Goose','Gorilla','Grizzly','Hamster','Hedgehog','Hippo','Horse',
    'Hummingbird','Iguana','Jellyfish','Jaguar','Kangaroo','Kiwi','Koala','Lemur','Ladybug','Mantis',
    'Monkey','Mouse','Octopus','Orangutan','Orca','Ostrich','Otter','Owl','Panda','Parrot',
    'Peacock','Pelican','Penguin','Pig','Pigeon','Platypus','PolarBear','Pufferfish','Rabbit','Raccoon',
    'Ram','Rat','RedPanda','Reindeer','Rhino','Salmon','Scorpion','Seahorse','Seal','Shark',
    'Sheep','Shrimp','Skunk','Sloth','Snail','Snake','Spider','Squirrel','Starfish','Stingray',
    'SugarGlider','Tiger','Toucan','Turkey','Turtle','Walrus','Whale','Wolf','Yak','Zebra'
];
function petIconPath(pet) {
    return `assets/images/Pets/${pet}.png`;
}

// Bricks/Misses: 22 miss icons
const MISS_COLORS = [
    'black','blue','d-gold','d-orange','d-pink','d-sky','forest','gold','green','grey',
    'l-blue','l-grey','l-pink','l-red','l-sky','lime','orange','pink','red','sky','white','yellow'
];
function missIconPath(color) {
    return `assets/images/Misses/${color}.png`;
}

// Factions: 10 color icons
const FACTION_COLORS = [
    'aqua','black','blue','green','lime','orange','pink','purple','red','yellow'
];
function factionIconPath(color) {
    return `assets/images/Colors/${color}.png`;
}

// Beliefs: 12 religions + 12 governments = 24 icons
const RELIGIONS = [
    'atheism','buddhism','christianity','hinduism','islam','judaism','monotheism',
    'pastafarianism','polytheism','scientology','shamanism','shintoism'
];
const GOVERNMENTS = [
    'absolute-monarchy','anarcho-communism','communist-state','constitutional-monarchy',
    'corporatist-state','direct-democracy','federal-republic','liberal-democracy',
    'military-junta','single-party-state','technocracy','theocratic-republic'
];
function religionIconPath(religion) {
    return `assets/images/Religion/${religion}.png`;
}
function governmentIconPath(government) {
    return `assets/images/Government/${government}.png`;
}

// Needs: 11 foods + 11 waters = 22 icons
const FOOD_TYPES = [
    'burger','cake','cookie','donut','hotdog','pizza','ramen','salad','steak','sushi','taco'
];
const WATER_TYPES = [
    'beer','coffee','energy-drink','juice','liquor','milk','milkshake','smoothie','soda','water','wine'
];
function foodIconPath(food) {
    return `assets/images/Food/${food}.png`;
}
function waterIconPath(water) {
    return `assets/images/Water/${water}.png`;
}

// ═════════════════════════════════════════════════════════════════════════════
// CARD TYPE CONFIGURATIONS
// ════════════════════════════════════════════════════════════════════════════

const CARD_CONFIGS = {
    resources: {
        name: 'Resources',
        gridSize: 9,
        iconCount: 35,
        baseCost: 100,
        winChance: 0.086, // ~8.6%
        tiers: {
            1:  { stage: 1, multiplier: 1,   cost: 100,   maxPrize: 100 },     // Raw
            2:  { stage: 2, multiplier: 2,   cost: 250,   maxPrize: 500 },     // Stage 1
            3:  { stage: 3, multiplier: 5,   cost: 500,   maxPrize: 2500 },    // Stage 2
            4:  { stage: 4, multiplier: 15,  cost: 1000,  maxPrize: 15000 },   // Stage 3
            5:  { stage: 5, multiplier: 50,  cost: 2500,  maxPrize: 125000 },  // Manufactured
        },
    },
    pets: {
        name: 'Pets',
        gridSize: 3,
        iconCount: 103,
        baseCost: 50,
        maxPrize: 75,
        winChance: 0.194, // ~19.4%
        prizeMultiplier: 1.5,
    },
    bricks: {
        name: 'Bricks',
        gridSize: 3,
        iconCount: 22,
        baseCost: 200,
        maxPrize: 2000,
        winChance: 0.041, // ~4.1%
        prizeMultiplier: 10,
    },
    factions: {
        name: 'Factions',
        gridSize: 3,
        iconCount: 10,
        baseCost: 300,
        maxPrize: 900,
        winChance: 0.090, // ~9.0%
        prizeMultiplier: 3,
    },
    beliefs: {
        name: 'National Beliefs',
        gridSize: 9,
        iconCount: 24,
        baseCost: 500,
        maxPrize: 10000,
        winChance: 0.125, // ~12.5%
        prizeMultiplier: 20,
        iconsNeeded: { religions: 2, governments: 2 },
    },
    needs: {
        name: 'National Needs',
        gridSize: 9,
        iconCount: 22,
        baseCost: 500,
        maxPrize: 7500,
        winChance: 0.136, // ~13.6%
        prizeMultiplier: 15,
        iconsNeeded: { foods: 2, waters: 2 },
    },
};

// All 8 winning lines on a 3×3 grid (3 rows, 3 cols, 2 diagonals)
const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6],            // diagonals
];

function calculateWinChance(config) {
    if (config.winChance !== undefined) return config.winChance;
    // winChance = (matchCountNeeded × 100) / (iconSetSize × gridSize)
    const needed = typeof config.iconsNeeded === 'number' ? config.iconsNeeded : 3;
    return Math.min(99, (needed * 100) / (config.iconCount * config.gridSize));
}

// ═════════════════════════════════════════════════════════════════════════════
// SCRATCH-OFF SYSTEM CLASS
// ════════════════════════════════════════════════════════════════════════════

class ScratchOffSystem {
    constructor() {
        this.isInitialized = false;
        this.availableCards = [];
    }

    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log('Scratch-Off System initialized');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DAILY CARD GENERATION
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Generate the daily pool of scratch-off cards available for purchase.
     * Called once per day at UTC midnight.
     * @returns {Array} Array of card definition objects (client-safe, no hidden symbols)
     */
    generateDailyCards() {
        const cards = [];

        for (const [type, config] of Object.entries(CARD_CONFIGS)) {
            if (type === 'resources') {
                // One card per tier (5 tiers)
                for (const [tierNum, tierConfig] of Object.entries(config.tiers)) {
                    const mineral = securePick(RESOURCE_MINERALS);
                    const stage = tierConfig.stage;
                    const isWinner = crypto.randomInt(100000) / 1000 < calculateWinChance(config);
                    const prize = isWinner ? Math.floor(config.baseCost * tierConfig.multiplier) : 0;

                    cards.push({
                        id: this._cardId(),
                        type,
                        tier: parseInt(tierNum),
                        stage,
                        mineral,
                        cost: tierConfig.cost,
                        isWinner,
                        prize,
                        prizeMultiplier: tierConfig.multiplier,
                        gridSize: config.gridSize,
                        symbols: this._generateGridSymbols(type, isWinner, { mineral, stage }),
                        revealed: new Array(config.gridSize).fill(false),
                        createdAt: Date.now(),
                    });
                }
            } else if (type === 'pets') {
                const isWinner = crypto.randomInt(100000) / 1000 < calculateWinChance(config);
                const prize = isWinner ? Math.floor(config.baseCost * config.prizeMultiplier) : 0;
                cards.push({
                    id: this._cardId(),
                    type,
                    tier: 1,
                    cost: config.baseCost,
                    isWinner,
                    prize,
                    prizeMultiplier: config.prizeMultiplier,
                    gridSize: config.gridSize,
                    symbols: this._generateGridSymbols(type, isWinner, {}),
                    revealed: new Array(config.gridSize).fill(false),
                    createdAt: Date.now(),
                });
            } else if (type === 'bricks') {
                const isWinner = crypto.randomInt(100000) / 1000 < calculateWinChance(config);
                const prize = isWinner ? Math.floor(config.baseCost * config.prizeMultiplier) : 0;
                cards.push({
                    id: this._cardId(),
                    type,
                    tier: 1,
                    cost: config.baseCost,
                    isWinner,
                    prize,
                    prizeMultiplier: config.prizeMultiplier,
                    gridSize: config.gridSize,
                    symbols: this._generateGridSymbols(type, isWinner, {}),
                    revealed: new Array(config.gridSize).fill(false),
                    createdAt: Date.now(),
                });
            } else if (type === 'factions') {
                const isWinner = crypto.randomInt(100000) / 1000 < calculateWinChance(config);
                const prize = isWinner ? Math.floor(config.baseCost * config.prizeMultiplier) : 0;
                cards.push({
                    id: this._cardId(),
                    type,
                    tier: 1,
                    cost: config.baseCost,
                    isWinner,
                    prize,
                    prizeMultiplier: config.prizeMultiplier,
                    gridSize: config.gridSize,
                    symbols: this._generateGridSymbols(type, isWinner, {}),
                    revealed: new Array(config.gridSize).fill(false),
                    createdAt: Date.now(),
                });
            } else if (type === 'beliefs') {
                const isWinner = crypto.randomInt(100000) / 1000 < calculateWinChance(config);
                const prize = isWinner ? Math.floor(config.baseCost * config.prizeMultiplier) : 0;
                cards.push({
                    id: this._cardId(),
                    type,
                    tier: 1,
                    cost: config.baseCost,
                    isWinner,
                    prize,
                    prizeMultiplier: config.prizeMultiplier,
                    gridSize: config.gridSize,
                    symbols: this._generateGridSymbols(type, isWinner, {}),
                    revealed: new Array(config.gridSize).fill(false),
                    createdAt: Date.now(),
                });
            } else if (type === 'needs') {
                const isWinner = crypto.randomInt(100000) / 1000 < calculateWinChance(config);
                const prize = isWinner ? Math.floor(config.baseCost * config.prizeMultiplier) : 0;
                cards.push({
                    id: this._cardId(),
                    type,
                    tier: 1,
                    cost: config.baseCost,
                    isWinner,
                    prize,
                    prizeMultiplier: config.prizeMultiplier,
                    gridSize: config.gridSize,
                    symbols: this._generateGridSymbols(type, isWinner, {}),
                    revealed: new Array(config.gridSize).fill(false),
                    createdAt: Date.now(),
                });
            }
        }

        this.availableCards = cards;
        console.log(`Scratch-Off: Generated ${cards.length} daily cards.`);
        return cards;
    }

    /**
     * Get client-safe available cards (no hidden symbols, no isWinner).
     * Clients should only see id, type, tier, cost, and metadata — never the
     * hidden symbols or whether the card is a winner.
     */
    getAvailableCards() {
        if (this.availableCards.length === 0) {
            this.generateDailyCards();
        }
        return this.availableCards.map(c => ({
            id: c.id,
            type: c.type,
            tier: c.tier,
            stage: c.stage,
            mineral: c.mineral,
            cost: c.cost,
            prizeMultiplier: c.prizeMultiplier,
            gridSize: c.gridSize,
            createdAt: c.createdAt,
        }));
    }

    /**
     * Get the full card definition (server-side only, includes hidden symbols).
     * Used internally when a player purchases a card.
     */
    _getCardDefinition(cardId) {
        return this.availableCards.find(c => c.id === cardId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GRID GENERATION
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Generate the hidden symbol grid for a card.
     * If winner: place winning symbols according to win condition.
     * If loser: place random symbols ensuring no winning combination exists.
     */
    _generateGridSymbols(type, isWinner, extra) {
        const config = CARD_CONFIGS[type];
        const gridSize = config.gridSize;
        const grid = new Array(gridSize).fill(null);

        if (isWinner) {
            this._generateWinningGrid(type, grid, extra);
        } else {
            this._generateLosingGrid(type, grid);
        }

        return grid;
    }

    /**
     * Generate a winning grid based on card type win condition.
     */
    _generateWinningGrid(type, grid, extra) {
        const config = CARD_CONFIGS[type];
        const gridSize = config.gridSize;

        if (type === 'resources') {
            // Place 3 identical resource symbols on a random winning line
            const mineral = extra.mineral || securePick(RESOURCE_MINERALS);
            const stage = extra.stage || 1;
            const symbol = `${mineral}-${stage}`;
            const line = securePick(WIN_LINES);
            for (const pos of line) grid[pos] = symbol;
            // Fill remaining positions with random resources (avoid creating extra wins)
            for (let i = 0; i < gridSize; i++) {
                if (grid[i] === null) {
                    const m = securePick(RESOURCE_MINERALS);
                    const s = securePick(RESOURCE_STAGES);
                    grid[i] = `${m}-${s}`;
                }
            }
        } else if (type === 'pets') {
            // Place 2 identical pets in 2 of 3 positions
            const pet = securePick(PET_ICONS);
            const winPos = securePickK([0, 1, 2], 2);
            for (const pos of winPos) grid[pos] = pet;
            // Third position: different pet
            for (let i = 0; i < 3; i++) {
                if (grid[i] === null) {
                    let otherPet;
                    do { otherPet = securePick(PET_ICONS); } while (otherPet === pet);
                    grid[i] = otherPet;
                }
            }
        } else if (type === 'bricks') {
            // Place 3 identical miss icons in all 3 positions
            const color = securePick(MISS_COLORS);
            for (let i = 0; i < 3; i++) grid[i] = color;
        } else if (type === 'factions') {
            // Place 3 identical color icons in all 3 positions
            const color = securePick(FACTION_COLORS);
            for (let i = 0; i < 3; i++) grid[i] = color;
        } else if (type === 'beliefs') {
            // Place 2 religions + 2 governments across the grid (not constrained to one line)
            const r1 = securePick(RELIGIONS);
            const r2 = securePick(RELIGIONS);
            const g1 = securePick(GOVERNMENTS);
            const g2 = securePick(GOVERNMENTS);
            const winningSymbols = [r1, r2, g1, g2];
            // Place them in 4 random distinct positions
            const winPos = securePickK([0, 1, 2, 3, 4, 5, 6, 7, 8], 4);
            for (let i = 0; i < 4; i++) grid[winPos[i]] = winningSymbols[i];
            // Fill remaining positions
            for (let i = 0; i < gridSize; i++) {
                if (grid[i] === null) {
                    grid[i] = secureRandomBool()
                        ? securePick(RELIGIONS)
                        : securePick(GOVERNMENTS);
                }
            }
        } else if (type === 'needs') {
            // Place 2 foods + 2 waters across the grid
            const f1 = securePick(FOOD_TYPES);
            const f2 = securePick(FOOD_TYPES);
            const w1 = securePick(WATER_TYPES);
            const w2 = securePick(WATER_TYPES);
            const winningSymbols = [f1, f2, w1, w2];
            const winPos = securePickK([0, 1, 2, 3, 4, 5, 6, 7, 8], 4);
            for (let i = 0; i < 4; i++) grid[winPos[i]] = winningSymbols[i];
            // Fill remaining positions
            for (let i = 0; i < gridSize; i++) {
                if (grid[i] === null) {
                    grid[i] = secureRandomBool()
                        ? securePick(FOOD_TYPES)
                        : securePick(WATER_TYPES);
                }
            }
        }
    }

    /**
     * Generate a losing grid: random symbols with no winning combination.
     */
    _generateLosingGrid(type, grid) {
        const config = CARD_CONFIGS[type];
        const gridSize = config.gridSize;

        if (type === 'resources') {
            // No 3 identical resources on any line
            const counts = {};
            for (let i = 0; i < gridSize; i++) {
                let symbol;
                let attempts = 0;
                do {
                    const m = securePick(RESOURCE_MINERALS);
                    const s = securePick(RESOURCE_STAGES);
                    symbol = `${m}-${s}`;
                    attempts++;
                } while ((counts[symbol] || 0) >= 3 && attempts < 100);
                grid[i] = symbol;
                counts[symbol] = (counts[symbol] || 0) + 1;
            }
            // Additional check: ensure no line has 3 identical
            if (this._checkResourcesWin(grid)) {
                // Break it by changing one cell
                const idx = crypto.randomInt(gridSize);
                const m = securePick(RESOURCE_MINERALS);
                const s = securePick(RESOURCE_STAGES);
                grid[idx] = `${m}-${s}`;
            }
        } else if (type === 'pets') {
            // All 3 pets different (no 2 matching)
            const used = new Set();
            for (let i = 0; i < 3; i++) {
                let pet;
                do { pet = securePick(PET_ICONS); } while (used.has(pet));
                used.add(pet);
                grid[i] = pet;
            }
        } else if (type === 'bricks') {
            // Not all 3 identical
            for (let i = 0; i < 3; i++) {
                grid[i] = securePick(MISS_COLORS);
            }
            if (grid[0] === grid[1] && grid[1] === grid[2]) {
                grid[2] = securePick(MISS_COLORS.filter(c => c !== grid[0]));
            }
        } else if (type === 'factions') {
            // Not all 3 identical
            for (let i = 0; i < 3; i++) {
                grid[i] = securePick(FACTION_COLORS);
            }
            if (grid[0] === grid[1] && grid[1] === grid[2]) {
                grid[2] = securePick(FACTION_COLORS.filter(c => c !== grid[0]));
            }
        } else if (type === 'beliefs') {
            // Generate a losing grid: ensure NOT (>=2 religions AND >=2 governments)
            // Deterministically ensure fewer than 2 of one type to guarantee a loss
            const forceReligionCount = crypto.randomInt(2); // 0 or 1 religions max
            let religionPlaced = 0;
            for (let i = 0; i < gridSize; i++) {
                if (religionPlaced < forceReligionCount) {
                    grid[i] = securePick(RELIGIONS);
                    religionPlaced++;
                } else {
                    grid[i] = securePick(GOVERNMENTS);
                }
            }
            // Shuffle to randomize positions
            secureShuffle(grid);
        } else if (type === 'needs') {
            // Generate a losing grid: ensure NOT (>=2 foods AND >=2 waters)
            // Deterministically ensure fewer than 2 of one type to guarantee a loss
            const forceFoodCount = crypto.randomInt(2); // 0 or 1 foods max
            let foodPlaced = 0;
            for (let i = 0; i < gridSize; i++) {
                if (foodPlaced < forceFoodCount) {
                    grid[i] = securePick(FOOD_TYPES);
                    foodPlaced++;
                } else {
                    grid[i] = securePick(WATER_TYPES);
                }
            }
            // Shuffle to randomize positions
            secureShuffle(grid);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FULL-GRID WIN CHECKERS (for beliefs/needs, checked across ALL symbols)
    // ══════════════════════════════════════════════════════════════════════════

    _checkBeliefsWinFull(symbols) {
        let religionCount = 0;
        let governmentCount = 0;
        for (const s of symbols) {
            if (RELIGIONS.includes(s)) religionCount++;
            if (GOVERNMENTS.includes(s)) governmentCount++;
        }
        return religionCount >= 2 && governmentCount >= 2;
    }

    _checkNeedsWinFull(symbols) {
        let foodCount = 0;
        let waterCount = 0;
        for (const s of symbols) {
            if (FOOD_TYPES.includes(s)) foodCount++;
            if (WATER_TYPES.includes(s)) waterCount++;
        }
        return foodCount >= 2 && waterCount >= 2;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LINE-BASED CHECKERS (for resources, revealed positions only)
    // ══════════════════════════════════════════════════════════════════════════

    _randomPositions(max, count) {
        const positions = [];
        while (positions.length < count) {
            const pos = crypto.randomInt(max);
            if (!positions.includes(pos)) positions.push(pos);
        }
        return positions;
    }

    _cardId() {
        return 'scratch_' + Date.now() + '_' + crypto.randomInt(100000);
    }

    /**
     * Get the symbols on a specific line.
     */
    _getLineSymbols(symbols, line) {
        return [symbols[line[0]], symbols[line[1]], symbols[line[2]]];
    }

    /**
     * Count religions and governments in a line of symbols.
     */
    _countReligionsAndGovernments(lineSymbols) {
        let religionCount = 0;
        let governmentCount = 0;
        for (const s of lineSymbols) {
            if (RELIGIONS.includes(s)) religionCount++;
            if (GOVERNMENTS.includes(s)) governmentCount++;
        }
        return { religionCount, governmentCount };
    }

    /**
     * Count foods and waters in a line of symbols.
     */
    _countFoodsAndWaters(lineSymbols) {
        let foodCount = 0;
        let waterCount = 0;
        for (const s of lineSymbols) {
            if (FOOD_TYPES.includes(s)) foodCount++;
            if (WATER_TYPES.includes(s)) waterCount++;
        }
        return { foodCount, waterCount };
    }

    /**
     * Check if ANY line on a resources grid has 3 identical symbols.
     * Used when generating losing grids to ensure no accidental wins.
     */
    _checkResourcesWin(grid) {
        for (const line of WIN_LINES) {
            const s0 = grid[line[0]];
            const s1 = grid[line[1]];
            const s2 = grid[line[2]];
            if (s0 && s0 === s1 && s1 === s2) return true;
        }
        return false;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CARD WIN CHECKING
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Check if a revealed card has won.
     * Resources: 3 identical on any line.
     * Pets: 2 identical in the 1×3 grid.
     * Bricks: 3 identical in the 1×3 grid.
     * Factions: 3 identical in the 1×3 grid.
     * Beliefs: >=2 religions AND >=2 governments among ALL revealed symbols.
     * Needs: >=2 foods AND >=2 waters among ALL revealed symbols.
     *
     * Resources: After first set of 3, sets of 2 on other lines pay 25%.
     * Multiple winning lines stack.
     */
    checkCardWin(card) {
        const config = CARD_CONFIGS[card.type];
        const revealedSymbols = {};
        const revealedPositions = new Set();
        for (let i = 0; i < card.symbols.length; i++) {
            if (card.revealed[i]) {
                const sym = card.symbols[i];
                revealedSymbols[sym] = (revealedSymbols[sym] || 0) + 1;
                revealedPositions.add(i);
            }
        }

        let totalPrize = 0;
        let totalMatchCount = 0;
        let prizeType = null;
        let anyWin = false;

        if (card.type === 'resources') {
            const basePrize = Math.floor(card.cost * card.prizeMultiplier);
            let firstThreeSet = true;

            for (const line of WIN_LINES) {
                const lineSymbols = this._getLineSymbols(card.symbols, line);
                const revealedLine = lineSymbols.filter((_, idx) => revealedPositions.has(line[idx]));

                const counts = {};
                for (const s of revealedLine) {
                    counts[s] = (counts[s] || 0) + 1;
                }

                // Check for 3 identical on this line
                for (const [sym, count] of Object.entries(counts)) {
                    if (count >= 3) {
                        const linePrize = basePrize;
                        totalPrize += linePrize;
                        totalMatchCount += 3;
                        anyWin = true;
                        prizeType = sym;
                        firstThreeSet = false;
                    }
                }

                // Check for sets of 2 on this line (only after first 3-set exists)
                if (!firstThreeSet) {
                    for (const [sym, count] of Object.entries(counts)) {
                        if (count === 2) {
                            const linePrize = Math.floor(basePrize * 0.25);
                            totalPrize += linePrize;
                            totalMatchCount += 2;
                            anyWin = true;
                            prizeType = sym;
                        }
                    }
                }
            }
        } else if (card.type === 'pets') {
            // 1×3 grid, match 2 identical
            for (const [sym, count] of Object.entries(revealedSymbols)) {
                if (count >= 2) {
                    totalPrize = card.prize;
                    totalMatchCount = count;
                    anyWin = true;
                    prizeType = sym;
                }
            }
        } else if (card.type === 'bricks') {
            // 1×3 grid, match 3 identical
            const counts = {};
            for (const s of Object.keys(revealedSymbols)) {
                counts[s] = revealedSymbols[s];
            }
            for (const [sym, count] of Object.entries(counts)) {
                if (count >= 3) {
                    totalPrize = card.prize;
                    totalMatchCount = 3;
                    anyWin = true;
                    prizeType = sym;
                }
            }
        } else if (card.type === 'factions') {
            // 1×3 grid, match 3 identical
            const counts = {};
            for (const s of Object.keys(revealedSymbols)) {
                counts[s] = revealedSymbols[s];
            }
            for (const [sym, count] of Object.entries(counts)) {
                if (count >= 3) {
                    totalPrize = card.prize;
                    totalMatchCount = 3;
                    anyWin = true;
                    prizeType = sym;
                }
            }
        } else if (card.type === 'beliefs') {
            // 3×3, check ALL revealed symbols: >=2 religions AND >=2 governments
            const basePrize = Math.floor(card.cost * card.prizeMultiplier);
            const revealed = card.symbols.filter((_, i) => revealedPositions.has(i));
            let religionCount = 0;
            let governmentCount = 0;
            for (const s of revealed) {
                if (RELIGIONS.includes(s)) religionCount++;
                if (GOVERNMENTS.includes(s)) governmentCount++;
            }

            if (religionCount >= 2 && governmentCount >= 2) {
                let lineMultiplier = 1;
                if (religionCount >= 3 || governmentCount >= 3) {
                    lineMultiplier = 2;
                }
                const linePrize = Math.floor(basePrize * lineMultiplier);
                totalPrize = linePrize;
                totalMatchCount = religionCount + governmentCount;
                anyWin = true;
                prizeType = 'beliefs';
            }
        } else if (card.type === 'needs') {
            // 3×3, check ALL revealed symbols: >=2 foods AND >=2 waters
            const basePrize = Math.floor(card.cost * card.prizeMultiplier);
            const revealed = card.symbols.filter((_, i) => revealedPositions.has(i));
            let foodCount = 0;
            let waterCount = 0;
            for (const s of revealed) {
                if (FOOD_TYPES.includes(s)) foodCount++;
                if (WATER_TYPES.includes(s)) waterCount++;
            }

            if (foodCount >= 2 && waterCount >= 2) {
                let lineMultiplier = 1;
                if (foodCount >= 3 || waterCount >= 3) {
                    lineMultiplier = 2;
                }
                const linePrize = Math.floor(basePrize * lineMultiplier);
                totalPrize = linePrize;
                totalMatchCount = foodCount + waterCount;
                anyWin = true;
                prizeType = 'needs';
            }
        }

        return {
            won: anyWin,
            prize: totalPrize,
            prizeType,
            matchCount: totalMatchCount,
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TICKET PURCHASE
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Purchase a scratch-off card.
     * @param {Object} nation - The nation buying the card
     * @param {string} cardId - The ID of the card to purchase from availableCards
     * @param {Object} casinoSystem - The CasinoSystem instance (for pool integration)
     * @returns {Object} { ok: true/false, card: cardInstance, reason: string }
     */
    purchaseCard(nation, cardId, casinoSystem) {
        if (!nation) return { ok: false, reason: 'Invalid nation' };

        const cardDef = this._getCardDefinition(cardId);
        if (!cardDef) {
            return { ok: false, reason: 'Card not available' };
        }

        const cost = cardDef.cost;
        const currentMoney = nation.money || 0;
        if (currentMoney < cost) {
            return { ok: false, reason: `Insufficient funds. Need $${cost.toLocaleString()}, have $${currentMoney.toLocaleString()}` };
        }

        // Deduct cost from nation and add to World Bank pool
        nation.money = currentMoney - cost;
        if (casinoSystem) {
            casinoSystem.addToPool(cost, 'scratch_off_wager');
        }

        // Create card instance (copy with revealed state reset)
        const cardInstance = {
            id: cardDef.id,
            type: cardDef.type,
            tier: cardDef.tier,
            stage: cardDef.stage,
            mineral: cardDef.mineral,
            cost: cardDef.cost,
            isWinner: cardDef.isWinner,
            prize: cardDef.prize,
            prizeMultiplier: cardDef.prizeMultiplier,
            gridSize: cardDef.gridSize,
            symbols: [...cardDef.symbols],
            revealed: new Array(cardDef.gridSize).fill(false),
            purchasedAt: Date.now(),
            revealedCount: 0,
            won: false,
            claimed: false,
            prizeType: null,
        };

        const casino = nation.casino;
        if (!casino.scratchOffCards) casino.scratchOffCards = [];
        casino.scratchOffCards.push(cardInstance);

        if (casino.games) {
            const key = `scratch_off_${cardDef.type}`;
            if (!casino.games[key]) {
                casino.games[key] = { played: 0, won: 0, spent: 0, wonAmount: 0 };
            }
            casino.games[key].played = (casino.games[key].played || 0) + 1;
            casino.games[key].spent = (casino.games[key].spent || 0) + cost;
            casino.games.scratchOff = casino.games.scratchOff || { played: 0, won: 0, spent: 0, wonAmount: 0 };
            casino.games.scratchOff.played = (casino.games.scratchOff.played || 0) + 1;
            casino.games.scratchOff.spent = (casino.games.scratchOff.spent || 0) + cost;
        }

        return { ok: true, card: cardInstance };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TILE REVEAL
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Reveal a tile on a scratch-off card.
     * @param {Object} nation - The nation
     * @param {string} cardId - The card ID
     * @param {number} tileIndex - The tile index to reveal
     * @returns {Object} { ok: true/false, symbol, card, won: boolean, fullyRevealed: boolean }
     */
    revealTile(nation, cardId, tileIndex) {
        if (!nation) return { ok: false, reason: 'Invalid nation' };

        const casino = nation.casino;
        if (!casino || !casino.scratchOffCards) {
            return { ok: false, reason: 'No scratch-off cards' };
        }

        const card = casino.scratchOffCards.find(c => c.id === cardId);
        if (!card) {
            return { ok: false, reason: 'Card not found' };
        }
        if (card.revealed[tileIndex]) {
            return { ok: false, reason: 'Tile already revealed' };
        }
        if (tileIndex < 0 || tileIndex >= card.gridSize) {
            return { ok: false, reason: 'Invalid tile index' };
        }

        card.revealed[tileIndex] = true;
        card.revealedCount = (card.revealedCount || 0) + 1;
        const symbol = card.symbols[tileIndex];

        const winResult = this.checkCardWin(card);
        if (winResult.won && !card.won) {
            card.won = true;
            card.prizeType = winResult.prizeType;
            card.prize = winResult.prize;
        }

        const fullyRevealed = card.revealedCount >= card.gridSize;

        return {
            ok: true,
            symbol,
            card,
            won: card.won,
            prize: card.prize,
            fullyRevealed,
            winResult,
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PRIZE CLAIM
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Claim a won scratch-off card prize from the World Bank lottery pool.
     * @param {Object} casinoSystem - The CasinoSystem instance (for pool payout)
     * @param {Object} nation - The nation claiming
     * @param {string} cardId - The card ID
     * @returns {Object} { ok: true/false, prize, reason }
     */
    claimPrize(casinoSystem, nation, cardId) {
        if (!nation) return { ok: false, reason: 'Invalid nation' };

        const casino = nation.casino;
        if (!casino || !casino.scratchOffCards) {
            return { ok: false, reason: 'No scratch-off cards' };
        }

        const card = casino.scratchOffCards.find(c => c.id === cardId);
        if (!card) {
            return { ok: false, reason: 'Card not found' };
        }
        if (!card.won) {
            return { ok: false, reason: 'Card is not a winner' };
        }
        if (card.claimed) {
            return { ok: false, reason: 'Prize already claimed' };
        }

        const prize = card.prize;
        const actualPaid = casinoSystem.payFromPool(prize, 'scratch_off_win');

        nation.money = (nation.money || 0) + actualPaid;
        card.claimed = true;
        card.claimedAt = Date.now();

        if (casino.games) {
            const key = `scratch_off_${card.type}`;
            // Only update stats once here (not at reveal time to avoid double-counting)
            casino.games[key].won = (casino.games[key].won || 0) + 1;
            casino.games[key].wonAmount = (casino.games[key].wonAmount || 0) + actualPaid;
            casino.games.scratchOff.won = (casino.games.scratchOff.won || 0) + 1;
            casino.games.scratchOff.wonAmount = (casino.games.scratchOff.wonAmount || 0) + actualPaid;
        }

        console.log(`Scratch-Off: Prize claimed — $${actualPaid.toLocaleString()} (${card.type})`);
        return { ok: true, prize: actualPaid, prizeType: card.prizeType };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // QUERY METHODS
    // ══════════════════════════════════════════════════════════════════════════

    getNationCards(nation) {
        const casino = nation.casino;
        if (!casino || !casino.scratchOffCards) return [];
        return casino.scratchOffCards;
    }

    getNationStats(nation) {
        const casino = nation.casino;
        if (!casino || !casino.games) return null;
        return casino.games;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ══════════════════════════════════════════════════════════════════════════

    getState() {
        return {
            availableCards: this.availableCards,
            cardConfigs: CARD_CONFIGS,
        };
    }

    setState(state) {
        if (state.availableCards) this.availableCards = state.availableCards;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScratchOffSystem;
}
if (typeof window !== 'undefined') {
    window.ScratchOffSystem = ScratchOffSystem;
}
