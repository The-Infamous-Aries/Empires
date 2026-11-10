/**
 * Sovereign Wheel System
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Daily spin wheel with 152 slices. All slices equal size (1/152 probability each).
 * 8 bad slices fixed at cardinal positions (+ pattern): Top (0), Left (19), Bottom (38), Right (76), etc.
 * Remaining 144 slices randomly shuffled daily at UTC midnight. Players get 1 free spin per day.
 *
 * Winning a slice grants credits (NOT instant units for military slices).
 * Credits stack with remaining credits and are redeemed at purchase time:
 * money/resource costs waived for redeemed amount only; all other requirements
 * (tech, capacity, prerequisites, population, nuclear ban) still apply.
 *
 * All randomness uses crypto.randomInt() — no Math.random().
 * The spin animation simulates a real physical wheel: high initial velocity,
 * gradual deceleration (friction), and stopper bounce (clicking against pegs)
 * as it slows down. This makes it effectively impossible for users to time
 * their click to land on a specific slice — the result is determined server-side
 * before the animation begins.
 */

const crypto = require('crypto');

// ════════════════════════════════════════════════════════════════════════════
// CRYPTOGRAPHICALLY SECURE RANDOM HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function secureRandomInt(max) {
    return crypto.randomInt(max);
}

function secureShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ═════════════════════════════════════════════════════════════════════════════
// WHEEL SPIN PHYSICS (Realistic wheel of fortune simulation)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Simulate a physical wheel spin with stopper bounce.
 *
 * The server determines the winning slice, then generates animation data
 * that makes the wheel visually decelerate and stop on that slice. The
 * physics include:
 *   - High initial velocity (many full rotations)
 *   - Gradual friction-based deceleration
 *   - Stopper "clicks" against pegs between slices as velocity drops
 *   - Final bounce as the wheel settles into the winning slice
 *
 * This makes it effectively impossible for users to time their click to
 * land on a specific slice — the result is determined server-side before
 * the animation begins.
 *
 * @param {Array} wheel - The built daily wheel (152 slices)
 * @param {number} winningIndex - The index of the slice that should win
 * @returns {Object} { winningIndex, totalDegrees, stopDegrees, stops: Array<{deg, sliceIndex}> }
 */
function spinPhysics(wheel, winningIndex) {
    const totalSlices = wheel.length;
    const degPerSlice = 360 / totalSlices;

    // ---- Step 1: Determine the target stop angle ----
    // Slice 0 is at the top (0 deg = 12 o'clock). Wheel spins clockwise.
    // To make slice `winningIndex` land at top, we need the wheel to stop
    // with that slice at angle 0.
    // The winning slice's center should end up at the pointer (0 deg).
    const winningSliceCenterDeg = (winningIndex * degPerSlice) + (degPerSlice / 2);
    // Target stop angle: rotate so winning slice center is at 0 deg
    const targetStopDeg = (360 - winningSliceCenterDeg) % 360;

    // ---- Step 2: Generate spin animation ----
    // Initial velocity: 5-12 full rotations (1800-4320 degrees)
    const fullRotations = 5 + crypto.randomInt(8); // 5-12 rotations
    const initialVelocityDeg = fullRotations * 360 + crypto.randomInt(360);

    // Friction: wheel loses velocity each frame. We simulate in discrete steps.
    // At each step, velocity decreases by friction factor, plus random "click" bumps
    // from stopper pegs as velocity gets low.
    const friction = 0.965; // velocity multiplier per frame
    const minVelocity = 2; // degrees per frame below which stopper clicks dominate

    let currentDeg = 0;
    let velocity = initialVelocityDeg;
    const stops = []; // Record stopper click positions

    while (velocity > minVelocity) {
        currentDeg = (currentDeg + velocity) % 360;
        velocity *= friction;

        // Stopper click: as wheel slows, it clicks against pegs between slices
        // Each click slightly perturbs the position (bounce effect)
        const sliceIndex = Math.floor((currentDeg / 360) * totalSlices) % totalSlices;
        const sliceStartDeg = (sliceIndex / totalSlices) * 360;
        const sliceEndDeg = ((sliceIndex + 1) / totalSlices) * 360;
        const degInSlice = currentDeg - sliceStartDeg;
        const degToNextSlice = sliceEndDeg - degInSlice;

        // If we're close to a slice boundary (within a few degrees), record a "click"
        if (degToNextSlice < 3 || degInSlice < 3) {
            stops.push({
                deg: currentDeg,
                sliceIndex,
                bounce: crypto.randomInt(5) - 2, // -2 to +2 degree bounce
            });
        }
    }

    // ---- Step 3: Final settle into winning slice ----
    // After velocity drops below minVelocity, the wheel does final micro-bounces
    // before settling exactly on the winning slice center.
    const finalBounces = crypto.randomInt(3) + 2; // 2-4 final bounces
    let settleDeg = currentDeg;
    for (let b = 0; b < finalBounces; b++) {
        settleDeg = (settleDeg + (crypto.randomInt(10) - 5)) % 360; // small bounce
    }
    // Force final position to target stop
    settleDeg = targetStopDeg;

    const totalDegrees = initialVelocityDeg; // For animation duration calculation

    return {
        winningIndex,
        totalDegrees,
        stopDegrees: settleDeg,
        stops,
        degPerSlice,
        totalSlices,
    };
}
// ════════════════════════════════════════════════════════════════════════════

const ICON_KEY1   = 'assets/images/Equipment/Key1.png';
const ICON_KEY2   = 'assets/images/Equipment/Key2.png';
const ICON_KEY3   = 'assets/images/Equipment/Key3.png';
const ICON_CHEST1 = 'assets/images/Equipment/chest1.png';
const ICON_CHEST2 = 'assets/images/Equipment/chest2.png';
const ICON_CHEST3 = 'assets/images/Equipment/chest3.png';
const ICON_CHEST4 = 'assets/images/Equipment/chest4.png';

// Raw resource icons (tier 1-3), Manufactured resource icons (tier 4-5)
function rawResourceIcon(mineral) {
    return `assets/images/Resources/${mineral}-1.png`;
}
function mfgResourceIcon(mineral) {
    return `assets/images/Resources/${mineral}-4.png`;
}

// Food types (11 types, each with tiers 1/3/5)
const FOOD_TYPES = [
    'burger', 'cake', 'cookie', 'donut', 'hotdog', 'pizza', 'ramen', 'salad', 'steak', 'sushi', 'taco'
];
function foodIcon(foodType) {
    return `assets/images/Food/${foodType}.png`;
}

// Water types (11 types, each with tiers 1/3/5)
const WATER_TYPES = [
    'beer', 'coffee', 'energy-drink', 'juice', 'liquor', 'milk', 'milkshake',
    'smoothie', 'soda', 'water', 'wine'
];
function waterIcon(waterType) {
    return `assets/images/Water/${waterType}.png`;
}

// ════════════════════════════════════════════════════════════════════════════
// SLICE DEFINITIONS (in display order, before bad-slice interleaving)
// ════════════════════════════════════════════════════════════════════════════

function buildSlices() {
    const slices = [];
    let id = 1;

    // ── Free Bills ──
    slices.push({ id: id++, name: 'Free Bills 1 Day', icon: 'assets/images/Wheel/1-day.png', type: 'bills', tier: 3, color: 'Green',
                  effect: '1 day of free bills', amount: 1 });
    slices.push({ id: id++, name: 'Free Bills 2 Days', icon: 'assets/images/Wheel/2-days.png', type: 'bills', tier: 4, color: 'Blue',
                  effect: '2 days of free bills', amount: 2 });
    slices.push({ id: id++, name: 'Free Bills 3 Days', icon: 'assets/images/Wheel/3-days.png', type: 'bills', tier: 5, color: 'Purple',
                  effect: '3 days of free bills', amount: 3 });

    // ── Currency ──
    slices.push({ id: id++, name: '$5,000,000', icon: 'assets/images/Wheel/5M.png', type: 'currency', tier: 2, color: 'Amber',
                  effect: '$5M cash', amount: 5000000 });
    slices.push({ id: id++, name: '$10,000,000', icon: 'assets/images/Wheel/10M.png', type: 'currency', tier: 5, color: 'Gold',
                  effect: '$10M cash', amount: 10000000 });
    slices.push({ id: id++, name: '$25,000,000', icon: 'assets/images/Wheel/25M.png', type: 'currency', tier: 6, color: 'Red',
                  effect: '$25M cash', amount: 25000000 });
    slices.push({ id: id++, name: '$100,000,000', icon: 'assets/images/Wheel/100M.png', type: 'currency', tier: 7, color: 'Crimson',
                  effect: '$100M cash', amount: 100000000 });

    // ── Keys (Equipment icons) ──
    slices.push({ id: id++, name: 'Key 1 × 1', icon: ICON_KEY1, type: 'key', tier: 1, color: 'Gray',
                  effect: '1 Common Key', keyType: 1, amount: 1 });
    slices.push({ id: id++, name: 'Key 1 × 3', icon: ICON_KEY1, type: 'key', tier: 2, color: 'Silver',
                  effect: '3 Common Keys', keyType: 1, amount: 3 });
    slices.push({ id: id++, name: 'Key 1 × 5', icon: ICON_KEY1, type: 'key', tier: 3, color: 'Gold',
                  effect: '5 Common Keys', keyType: 1, amount: 5 });
    slices.push({ id: id++, name: 'Key 2 × 1', icon: ICON_KEY2, type: 'key', tier: 4, color: 'Silver',
                  effect: '1 Uncommon Key', keyType: 2, amount: 1 });
    slices.push({ id: id++, name: 'Key 2 × 3', icon: ICON_KEY2, type: 'key', tier: 5, color: 'Gold',
                  effect: '3 Uncommon Keys', keyType: 2, amount: 3 });
    slices.push({ id: id++, name: 'Key 2 × 5', icon: ICON_KEY2, type: 'key', tier: 6, color: 'Crimson',
                  effect: '5 Uncommon Keys', keyType: 2, amount: 5 });
    slices.push({ id: id++, name: 'Key 3 × 1', icon: ICON_KEY3, type: 'key', tier: 5, color: 'Gold',
                  effect: '1 Rare Key', keyType: 3, amount: 1 });
    slices.push({ id: id++, name: 'Key 3 × 3', icon: ICON_KEY3, type: 'key', tier: 6, color: 'Crimson',
                  effect: '3 Rare Keys', keyType: 3, amount: 3 });
    slices.push({ id: id++, name: 'Key 3 × 5', icon: ICON_KEY3, type: 'key', tier: 7, color: 'Epochal',
                  effect: '5 Rare Keys', keyType: 3, amount: 5 });

    // ── Chests (Equipment icons) ──
    slices.push({ id: id++, name: 'Chest 1 × 1', icon: ICON_CHEST1, type: 'chest', tier: 3, color: 'Gray',
                  effect: '1 Common Chest', chestType: 1, amount: 1 });
    slices.push({ id: id++, name: 'Chest 1 × 3', icon: ICON_CHEST1, type: 'chest', tier: 5, color: 'Silver',
                  effect: '3 Common Chests', chestType: 1, amount: 3 });
    slices.push({ id: id++, name: 'Chest 2 × 1', icon: ICON_CHEST2, type: 'chest', tier: 5, color: 'Silver',
                  effect: '1 Uncommon Chest', chestType: 2, amount: 1 });
    slices.push({ id: id++, name: 'Chest 2 × 2', icon: ICON_CHEST2, type: 'chest', tier: 6, color: 'Gold',
                  effect: '2 Uncommon Chests', chestType: 2, amount: 2 });
    slices.push({ id: id++, name: 'Chest 3 × 1', icon: ICON_CHEST3, type: 'chest', tier: 6, color: 'Gold',
                  effect: '1 Rare Chest', chestType: 3, amount: 1 });
    slices.push({ id: id++, name: 'Chest 3 × 2', icon: ICON_CHEST3, type: 'chest', tier: 7, color: 'Crimson',
                  effect: '2 Rare Chests', chestType: 3, amount: 2 });
    slices.push({ id: id++, name: 'Chest 4 × 1', icon: ICON_CHEST4, type: 'chest', tier: 8, color: 'Epochal',
                  effect: '1 Sovereign Chest', chestType: 4, amount: 1 });

    // ── Project / Wonder ──
    slices.push({ id: id++, name: '1 Free Project', icon: 'assets/images/Wheel/free-project.png', type: 'freeProject', tier: 6, color: 'Purple',
                  effect: 'Next project fully free' });
    slices.push({ id: id++, name: 'Reset Wonder Cooldown', icon: 'assets/images/Wheel/wonder-reset.png', type: 'wonderReset', tier: 6, color: 'Crimson',
                  effect: 'Reset wonder build cooldown' });

    // ── Raw Resources (tier 1-3 icons) ──
    const rawMinerals = ['steel', 'bronze', 'lead', 'aluminum', 'copper', 'uranium', 'gasoline'];
    for (const mineral of rawMinerals) {
        slices.push({ id: id++, name: `Raw ${capitalize(mineral)} × 1040`, icon: rawResourceIcon(mineral),
            type: 'rawResource', tier: 4, color: resourceColor(mineral),
            effect: `1040 Raw ${capitalize(mineral)}`, resource: mineral, amount: 1040 });
    }

    // ── Manufactured Resources (tier 4-5 icons) ──
    const mfgMinerals = ['steel', 'bronze', 'lead', 'aluminum', 'copper', 'uranium', 'gasoline'];
    for (const mineral of mfgMinerals) {
        slices.push({ id: id++, name: `Mfg ${capitalize(mineral)} × 65`, icon: mfgResourceIcon(mineral),
            type: 'mfgResource', tier: 5, color: resourceColor(mineral),
            effect: `65 Manufactured ${capitalize(mineral)}`, resource: mineral, amount: 65 });
    }

    // ── Food Types (11 types × 3 tiers = 33 slices) ──
    const foodAmounts = [1, 3, 5];
    for (const foodType of FOOD_TYPES) {
        for (const amount of foodAmounts) {
            const tier = amount === 1 ? 4 : amount === 3 ? 5 : 6;
            slices.push({ id: id++, name: `${capitalize(foodType)} × ${amount}`, icon: foodIcon(foodType),
                type: 'food', tier: tier, color: 'Brown',
                effect: `${amount} ${capitalize(foodType)}`, foodType: foodType, amount: amount });
        }
    }

    // ── Water Types (11 types × 3 tiers = 33 slices) ──
    const waterAmounts = [1, 3, 5];
    for (const waterType of WATER_TYPES) {
        for (const amount of waterAmounts) {
            const tier = amount === 1 ? 4 : amount === 3 ? 5 : 6;
            slices.push({ id: id++, name: `${capitalize(waterType)} × ${amount}`, icon: waterIcon(waterType),
                type: 'water', tier: tier, color: 'Blue',
                effect: `${amount} ${capitalize(waterType)}`, waterType: waterType, amount: amount });
        }
    }

    // ── Free Land / Infra ──
    slices.push({ id: id++, name: 'Free Land × 5%', icon: 'assets/images/Wheel/free-land.png', type: 'freeLand', tier: 5, color: 'Brown',
                  effect: '5% of current land levels' });
    slices.push({ id: id++, name: 'Free Infra × 5%', icon: 'assets/images/Wheel/free-infra.png', type: 'freeInfra', tier: 5, color: 'Brown',
                  effect: '5% of current infra levels' });

    // ── FREE Military Unit Credits (7 types × 3 tiers = 21 slices) ──
    // Tier 5: 1K soldiers = 50 tanks = 25 aircraft = 15 ships = 5 spies = 2 missiles = 1 nuke
    // Tier 6: 5K soldiers = 150 tanks = 75 aircraft = 45 ships = 15 spies = 6 missiles = 2 nukes
    // Tier 7: 10K soldiers = 450 tanks = 225 aircraft = 135 ships = 45 spies = 18 missiles = 3 nukes
    const militaryDefs = [
        { unit: 'soldiers', amounts: [1000, 5000, 10000], tiers: [5, 6, 7], colors: ['Gray', 'Silver', 'Gold'], icon: 'assets/images/Military/soldiers.png' },
        { unit: 'tanks',      amounts: [50, 150, 450],    tiers: [5, 6, 7], colors: ['Silver', 'Gold', 'Crimson'], icon: 'assets/images/Military/tank.png' },
        { unit: 'aircraft',   amounts: [25, 75, 225],     tiers: [5, 6, 7], colors: ['Silver', 'Gold', 'Crimson'], icon: 'assets/images/Military/aircraft.png' },
        { unit: 'ships',      amounts: [15, 45, 135],     tiers: [5, 6, 7], colors: ['Silver', 'Gold', 'Crimson'], icon: 'assets/images/Military/ship.png' },
        { unit: 'spies',      amounts: [5, 15, 45],       tiers: [5, 6, 7], colors: ['Silver', 'Gold', 'Crimson'], icon: 'assets/images/Military/spy.png' },
        { unit: 'missiles',   amounts: [2, 6, 18],        tiers: [5, 6, 7], colors: ['Silver', 'Gold', 'Crimson'], icon: 'assets/images/Military/missile.png' },
        { unit: 'nukes',      amounts: [1, 2, 3],         tiers: [5, 6, 7], colors: ['Silver', 'Gold', 'Crimson'], icon: 'assets/images/Military/nuke.png' },
    ];
    for (const def of militaryDefs) {
        for (let i = 0; i < def.amounts.length; i++) {
            slices.push({ id: id++, name: `FREE ${capitalize(def.unit)} × ${def.amounts[i].toLocaleString()}`,
                icon: def.icon, type: 'freeUnits', tier: def.tiers[i], color: def.colors[i],
                effect: `${def.amounts[i].toLocaleString()} redeemable free ${capitalize(def.unit)} credits`,
                unitType: def.unit, amount: def.amounts[i] });
        }
    }

    // ── Technology ──
    slices.push({ id: id++, name: 'Tech × 5', icon: 'assets/images/Wheel/5-tech.png', type: 'tech', tier: 4, color: 'Purple',
                  effect: '5 Levels FREE Technology', amount: 5 });
    slices.push({ id: id++, name: 'Tech × 10', icon: 'assets/images/Wheel/10-tech.png', type: 'tech', tier: 5, color: 'Purple',
                  effect: '10 Levels FREE Technology', amount: 10 });
    slices.push({ id: id++, name: 'Tech × 25', icon: 'assets/images/Wheel/25-tech.png', type: 'tech', tier: 6, color: 'Purple',
                  effect: '25 Levels FREE Technology', amount: 25 });

    // ── Happiness (5/10/20 × 1/2/3 Days = 9 slices) ──
    const happinessDefs = [
        { amount: 5, days: 1, tier: 4, icon: 'assets/images/Wheel/5-happy-1day.png' },
        { amount: 5, days: 2, tier: 4, icon: 'assets/images/Wheel/5-happy-2day.png' },
        { amount: 5, days: 3, tier: 5, icon: 'assets/images/Wheel/5-happy-3day.png' },
        { amount: 10, days: 1, tier: 5, icon: 'assets/images/Wheel/10-happy-1day.png' },
        { amount: 10, days: 2, tier: 5, icon: 'assets/images/Wheel/10-happy-2day.png' },
        { amount: 10, days: 3, tier: 6, icon: 'assets/images/Wheel/10-happy-3day.png' },
        { amount: 20, days: 1, tier: 6, icon: 'assets/images/Wheel/20-happy-1day.png' },
        { amount: 20, days: 2, tier: 6, icon: 'assets/images/Wheel/20-happy-2day.png' },
        { amount: 20, days: 3, tier: 7, icon: 'assets/images/Wheel/20-happy-3day.png' },
    ];
    for (const h of happinessDefs) {
        slices.push({ id: id++, name: `Happiness ${h.amount} × ${h.days} Day${h.days > 1 ? 's' : ''}`,
            icon: h.icon, type: 'happiness', tier: h.tier, color: 'Pink',
            effect: `+${h.amount} Happiness for ${h.days} Day${h.days > 1 ? 's' : ''}`,
            amount: h.amount, days: h.days });
    }

    // ── Insanely Good Slices ──
    slices.push({ id: id++, name: '50% Instant Raw Resources', icon: 'assets/images/Wheel/instant-resources.png', type: 'instantRawResources', tier: 8, color: 'Gold',
                  effect: 'Instantly grants 50% of current raw resource holdings' });
    slices.push({ id: id++, name: '25% Instant Manufactured Resources', icon: 'assets/images/Wheel/instant-manu-resources.png', type: 'instantMfgResources', tier: 8, color: 'Gold',
                  effect: 'Instantly grants 25% of current manufactured resource holdings (rounded down)' });
    slices.push({ id: id++, name: 'Instant Research Finish', icon: 'assets/images/Wheel/instant-research.png', type: 'instantResearchFinish', tier: 9, color: 'Purple',
                  effect: 'Instantly finishes current research for free' });
    slices.push({ id: id++, name: '5% Population Increase', icon: 'assets/images/Wheel/population-increase.png', type: 'populationIncrease', tier: 9, color: 'Green',
                  effect: 'Instantly adds 5% of current population as Teen citizens' });

    return slices;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function resourceColor(mineral) {
    const colors = {
        steel: 'Gray', bronze: 'Brown', lead: 'Gray', aluminum: 'Silver',
        copper: 'Orange', uranium: 'Green', gasoline: 'Yellow',
    };
    return colors[mineral] || 'Gray';
}

// ════════════════════════════════════════════════════════════════════════════
// WHEEL BUILD (Daily Rebuild)
// ════════════════════════════════════════════════════════════════════════════

// Bad slice positions for 152 slices (+ pattern: 0=Top, 38=Right, 76=Bottom, 114=Left)
// Positions 19, 57, 95, 133 are diagonal between cardinal points
const BAD_SLICE_POSITIONS = [0, 19, 38, 57, 76, 95, 114, 133];

const BAD_SLICE_DEFS = [
    { name: '25% Holdings Lost', icon: 'assets/images/Wheel/25-loss.png', type: 'bad', tier: 'Bad', color: 'Black',
      effect: 'Lose 25% of nation currency holdings', lossPct: 0.25 },
    { name: '50% Holdings Lost', icon: 'assets/images/Wheel/50-loss.png', type: 'bad', tier: 'Bad', color: 'Black',
      effect: 'Lose 50% of nation currency holdings', lossPct: 0.50 },
    { name: '75% Holdings Lost', icon: 'assets/images/Wheel/75-loss.png', type: 'bad', tier: 'Bad', color: 'Black',
      effect: 'Lose 75% of nation currency holdings', lossPct: 0.75 },
    { name: 'BANKRUPTCY', icon: 'assets/images/Wheel/bankruptcy.png', type: 'bad', tier: 'Bad', color: 'Black',
      effect: 'Lose 100% of nation currency holdings', lossPct: 1.0 },
    { name: 'Religious Schism', icon: 'assets/images/Wheel/religion-change.png', type: 'religionChange', tier: 'Bad', color: 'Black',
      effect: 'Nation religion randomly changed - 30 day cooldown applies' },
    { name: 'Government Overthrow', icon: 'assets/images/Wheel/government-change.png', type: 'governmentChange', tier: 'Bad', color: 'Black',
      effect: 'Nation government randomly changed - 30 day cooldown applies' },
    { name: 'Military Purge', icon: 'assets/images/Wheel/unit-destruction.png', type: 'unitDestruction', tier: 'Bad', color: 'Black',
      effect: 'Lose 25% of all military units - population tied to units is lost' },
    { name: 'Population Plague', icon: 'assets/images/Wheel/population-kill.png', type: 'populationKill', tier: 'Bad', color: 'Black',
      effect: 'Lose 25% of total population across all demographics' },
];

class SovereignWheelSystem {
    constructor() {
        this.isInitialized = false;
        this.slices = buildSlices();
        this.totalSlices = this.slices.length + BAD_SLICE_DEFS.length; // 152 (144 normal + 8 bad)
    }

    // ══════════════════════════════════════════════════════════════════════════
    // WHEEL BUILD
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Build the daily wheel. All slices placed on the wheel.
     * Bad slices fixed at + positions. Normal slices randomly shuffled.
     * All slices equal probability (1/152 per spin).
     * @returns {Array} The built wheel (152 slices in wheel positions 0-151)
     */
    buildDailyWheel() {
        const total = this.totalSlices;
        const wheel = new Array(total);

        // Place bad slices at fixed positions
        for (let i = 0; i < BAD_SLICE_POSITIONS.length; i++) {
            wheel[BAD_SLICE_POSITIONS[i]] = { ...BAD_SLICE_DEFS[i], id: 1000 + i };
        }

        // Collect normal slices and shuffle
        const normalSlices = [...this.slices];
        for (let i = normalSlices.length - 1; i > 0; i--) {
            const j = secureRandomInt(i + 1);
            [normalSlices[i], normalSlices[j]] = [normalSlices[j], normalSlices[i]];
        }

        // Place shuffled slices in remaining positions
        const normalPositions = [];
        for (let i = 0; i < total; i++) {
            if (!BAD_SLICE_POSITIONS.includes(i)) normalPositions.push(i);
        }
        for (let i = 0; i < normalPositions.length; i++) {
            wheel[normalPositions[i]] = normalSlices[i];
        }

        return wheel;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SPIN LOGIC
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Spin the wheel. All slices equal probability (1/152 each).
     * Uses crypto.randomInt for selection, then spinPhysics to generate
     * realistic animation data (velocity, deceleration, stopper bounces).
     * Result is determined server-side; animation is purely visual.
     * @param {Array} wheel - The built daily wheel (152 slices)
     * @returns {Object} { slice: winningSlice, physics: spinPhysicsResult }
     */
    spin(wheel) {
        const winningIndex = secureRandomInt(wheel.length);
        const slice = wheel[winningIndex];
        const physics = spinPhysics(wheel, winningIndex);
        return { slice, physics };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // APPLY WHEEL RESULT
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Apply a wheel spin result to a nation.
     * @param {Object} nation - The nation object
     * @param {Object} casino - The nation's casino data (from CasinoSystem)
     * @param {Object} sliceResult - The winning slice
     * @param {number} currentDay - Current world day (for religion/government change cooldowns)
     * @returns {Object} { result: sliceResult, payout: number|null, messages: string[] }
     */
    applySpinResult(nation, casino, sliceResult, currentDay = null) {
        const messages = [];
        let payout = null;

        // Ensure foodTypes/waterTypes exist on nation resources
        if (!nation.resources) nation.resources = {};
        if (!nation.resources.foodTypes) nation.resources.foodTypes = {};
        if (!nation.resources.waterTypes) nation.resources.waterTypes = {};
        FOOD_TYPES.forEach(t => { if (!nation.resources.foodTypes[t]) nation.resources.foodTypes[t] = 0; });
        WATER_TYPES.forEach(t => { if (!nation.resources.waterTypes[t]) nation.resources.waterTypes[t] = 0; });

        switch (sliceResult.type) {
            case 'currency':
                payout = sliceResult.amount;
                nation.money = (nation.money || 0) + payout;
                messages.push(`Won $${payout.toLocaleString()}!`);
                break;

            case 'rawResource':
                if (nation.resources && nation.resources[sliceResult.resource]) {
                    nation.resources[sliceResult.resource].raw =
                        (nation.resources[sliceResult.resource].raw || 0) + sliceResult.amount;
                }
                messages.push(`Won ${sliceResult.amount.toLocaleString()} Raw ${capitalize(sliceResult.resource)}!`);
                break;

            case 'mfgResource':
                if (nation.resources && nation.resources[sliceResult.resource]) {
                    nation.resources[sliceResult.resource].manufactured =
                        (nation.resources[sliceResult.resource].manufactured || 0) + sliceResult.amount;
                }
                messages.push(`Won ${sliceResult.amount.toLocaleString()} Mfg ${capitalize(sliceResult.resource)}!`);
                break;

            case 'food':
                nation.resources.food = (nation.resources.food || 0) + sliceResult.amount;
                nation.resources.foodTypes[sliceResult.foodType] =
                    (nation.resources.foodTypes[sliceResult.foodType] || 0) + sliceResult.amount;
                messages.push(`Won ${sliceResult.amount} ${capitalize(sliceResult.foodType)}!`);
                break;

            case 'water':
                nation.resources.water = (nation.resources.water || 0) + sliceResult.amount;
                nation.resources.waterTypes[sliceResult.waterType] =
                    (nation.resources.waterTypes[sliceResult.waterType] || 0) + sliceResult.amount;
                messages.push(`Won ${sliceResult.amount} ${capitalize(sliceResult.waterType)}!`);
                break;

            case 'tech':
                nation.tech = (nation.tech || 0) + sliceResult.amount;
                messages.push(`Won ${sliceResult.amount} FREE Technology Levels!`);
                break;

            case 'happiness':
                nation.happinessBonus = (nation.happinessBonus || 0) + sliceResult.amount;
                nation.happinessBonusDays = sliceResult.days;
                messages.push(`Won +${sliceResult.amount} Happiness for ${sliceResult.days} Day(s)!`);
                break;

            case 'freeUnits':
                casino.addFreeUnitCredits(sliceResult.unitType, sliceResult.amount);
                messages.push(`Won ${sliceResult.amount.toLocaleString()} FREE ${capitalize(sliceResult.unitType)} credits!`);
                break;

            case 'freeLand':
                const landCredit = Math.floor((nation.land || 0) * 0.05);
                casino.addFreeUnitCredits('land', landCredit);
                messages.push(`Won ${landCredit.toLocaleString()} FREE Land credits (5% of current land)!`);
                break;

            case 'freeInfra':
                const infraCredit = Math.floor((nation.infra || 0) * 0.05);
                casino.addFreeUnitCredits('infra', infraCredit);
                messages.push(`Won ${infraCredit.toLocaleString()} FREE Infra credits (5% of current infra)!`);
                break;

            case 'freeProject':
                casino.activeEffects.freeProject = true;
                casino.activeEffects.freeProjectDate = Date.now();
                messages.push('Won 1 Free Project! Next project is fully free.');
                break;

            case 'wonderReset':
                casino.activeEffects.wonderCooldownReset = true;
                casino.activeEffects.wonderCooldownResetDate = Date.now();
                messages.push('Won Wonder Cooldown Reset!');
                break;

            case 'bills':
                casino.activeEffects.freeBillsDays = sliceResult.amount;
                casino.activeEffects.freeBillsStartDate = Date.now();
                messages.push(`Won ${sliceResult.amount} Day(s) of Free Bills!`);
                break;

            case 'bad':
                payout = this._applyBadSlice(nation, sliceResult);
                messages.push(`BAD SLICE: ${sliceResult.effect}`);
                break;

            case 'instantRawResources':
                payout = this._applyInstantRawResources(nation);
                messages.push('Won 50% Instant Raw Resources!');
                break;

            case 'instantMfgResources':
                payout = this._applyInstantMfgResources(nation);
                messages.push('Won 25% Instant Manufactured Resources!');
                break;

            case 'instantResearchFinish':
                payout = this._applyInstantResearchFinish(nation);
                messages.push('Won Instant Research Finish!');
                break;

            case 'populationIncrease':
                payout = this._applyPopulationIncrease(nation);
                messages.push('Won 5% Population Increase!');
                break;
            case 'religionChange':
                payout = this._applyReligionChange(nation, currentDay);
                messages.push(`BAD SLICE: ${sliceResult.effect}`);
                break;
            case 'governmentChange':
                payout = this._applyGovernmentChange(nation, currentDay);
                messages.push(`BAD SLICE: ${sliceResult.effect}`);
                break;
            case 'unitDestruction':
                payout = this._applyUnitDestruction(nation);
                messages.push(`BAD SLICE: ${sliceResult.effect}`);
                break;
            case 'populationKill':
                payout = this._applyPopulationKill(nation);
                messages.push(`BAD SLICE: ${sliceResult.effect}`);
                break;
            default:
                messages.push(`Won ${sliceResult.name}!`);
        }

        // Update game stats
        casino.games.wheel.spins = (casino.games.wheel.spins || 0) + 1;
        if (payout && payout > 0) {
            casino.games.wheel.wins = (casino.games.wheel.wins || 0) + 1;
            casino.games.wheel.totalWon = (casino.games.wheel.totalWon || 0) + payout;
        } else {
            casino.games.wheel.losses = (casino.games.wheel.losses || 0) + 1;
        }

        return { result: sliceResult, payout, messages };
    }

    _applyBadSlice(nation, slice) {
        const money = nation.money || 0;
        let loss = 0;
        if (slice.lossPct !== undefined) {
            loss = Math.floor(money * slice.lossPct);
        }
        nation.money = Math.max(0, money - loss);
        return -loss;
    }

    _applyInstantRawResources(nation) {
        const minerals = ['steel', 'bronze', 'lead', 'aluminum', 'copper', 'uranium', 'gasoline'];
        let totalAdded = 0;
        for (const mineral of minerals) {
            if (nation.resources && nation.resources[mineral]) {
                const current = nation.resources[mineral].raw || 0;
                const add = Math.floor(current * 0.5);
                nation.resources[mineral].raw = current + add;
                totalAdded += add;
            }
        }
        return totalAdded;
    }

    _applyInstantMfgResources(nation) {
        const minerals = ['steel', 'bronze', 'lead', 'aluminum', 'copper', 'uranium', 'gasoline'];
        let totalAdded = 0;
        for (const mineral of minerals) {
            if (nation.resources && nation.resources[mineral]) {
                const current = nation.resources[mineral].manufactured || 0;
                const add = Math.floor(current * 0.25);
                nation.resources[mineral].manufactured = current + add;
                totalAdded += add;
            }
        }
        return totalAdded;
    }

    _applyInstantResearchFinish(nation) {
        if (nation.activeResearch && nation.activeResearch[0]) {
            const task = nation.activeResearch[0];
            nation.completedResearch = nation.completedResearch || [];
            nation.completedResearch.push(task.key);
            if (nation.research && nation.research[task.key] && nation.research[task.key].effects) {
                nation.researchEffects = nation.researchEffects || {};
                for (const [key, value] of Object.entries(nation.research[task.key].effects)) {
                    nation.researchEffects[key] = (nation.researchEffects[key] || 0) + value;
                }
            }
            nation.activeResearch = nation.activeResearch.filter(t => t !== task);
            if (typeof nation._onResearchCompleted === 'function') {
                nation._onResearchCompleted();
            }
            return 1;
        }
        return 0;
    }

    _applyPopulationIncrease(nation) {
        const currentPop = nation.population || 0;
        const newTeens = Math.floor(currentPop * 0.05);
        nation.population = currentPop + newTeens;
        return newTeens;
    }

    /**
     * Apply Religious Schism bad slice: randomly change nation's religion
     * and set religion change cooldown.
     */
    _applyReligionChange(nation, currentDay) {
        const oldReligion = nation.religion;
        const religions = window.ReligionSystem
            ? (window.ReligionSystem.getAllReligions
                ? window.ReligionSystem.getAllReligions()
                : ['monotheism', 'polytheism', 'atheism', 'buddhism', 'christianity', 'hinduism', 'islam', 'judaism', 'pastafarianism', 'scientology', 'shamanism', 'shintoism'])
            : ['monotheism', 'polytheism', 'atheism'];
        const availableReligions = religions.filter(r => r !== oldReligion);
        if (availableReligions.length === 0) return 0;
        const newReligion = availableReligions[crypto.randomInt(availableReligions.length)];

        nation.religion = newReligion;
        if (nation.applyReligionBonuses) nation.applyReligionBonuses();
        if (nation.demandTimer) {
            nation.demandTimer.religionDaysRemaining = 30;
            nation.demandTimer.isDemandingReligion = false;
            nation.demandTimer.currentReligionHint = null;
        }
        nation.religionChangedDay = currentDay !== null ? currentDay : (nation._nationAgeDays ? nation._nationAgeDays() : 0);

        return 0;
    }

    /**
     * Apply Government Overthrow bad slice: randomly change nation's government
     * and set government change cooldown.
     */
    _applyGovernmentChange(nation, currentDay) {
        const oldGovernment = nation.government;
        const governments = window.GovernmentSystem
            ? (window.GovernmentSystem.getAllGovernments
                ? window.GovernmentSystem.getAllGovernments()
                : ['liberalDemocracy', 'conservativeRepublic', 'socialistState', 'militaryJunta', 'theocracy', 'absoluteMonarchy', 'constitutionalMonarchy', 'federalRepublic', 'directDemocracy', 'singlePartyState', 'technocracy', 'theocraticRepublic'])
            : ['liberalDemocracy', 'conservativeRepublic', 'socialistState'];
        const availableGovernments = governments.filter(g => g !== oldGovernment);
        if (availableGovernments.length === 0) return 0;
        const newGovernment = availableGovernments[crypto.randomInt(availableGovernments.length)];

        nation.government = newGovernment;
        if (nation.applyGovernmentBonuses) nation.applyGovernmentBonuses();
        if (nation.demandTimer) {
            nation.demandTimer.governmentDaysRemaining = 30;
            nation.demandTimer.isDemandingGovernment = false;
            nation.demandTimer.currentGovernmentHint = null;
        }
        nation.governmentChangedDay = currentDay !== null ? currentDay : (nation._nationAgeDays ? nation._nationAgeDays() : 0);

        return 0;
    }

    /**
     * Apply Military Purge bad slice: destroy 25% of all military units
     * and kill population tied to destroyed units.
     */
    _applyUnitDestruction(nation) {
        const unitTypes = ['soldiers', 'tanks', 'aircraft', 'ships', 'spies', 'missiles', 'nukes'];
        let totalDestroyed = 0;
        let totalPopulationKilled = 0;

        for (const unitType of unitTypes) {
            const currentCount = nation.militaryUnits ? nation.militaryUnits[unitType] || 0 : 0;
            const destroyCount = Math.floor(currentCount * 0.25);
            if (destroyCount <= 0) continue;

            nation.militaryUnits[unitType] = Math.max(0, currentCount - destroyCount);
            totalDestroyed += destroyCount;

            // Update recruitment basis
            if (nation.recruitmentBasis) {
                nation.recruitmentBasis[unitType] =
                    (nation.recruitmentBasis[unitType] || 0) * (1 - destroyCount / currentCount);
            }

            // Kill population tied to destroyed units (1 citizen per combat unit, 0 for missiles/nukes)
            const populationCost = ['soldiers', 'tanks', 'aircraft', 'ships', 'spies'].includes(unitType) ? 1 : 0;
            const popKilled = destroyCount * populationCost;
            totalPopulationKilled += popKilled;

            // Kill citizens in PopulationSystem if available
            if (window.PopulationSystem && popKilled > 0) {
                window.PopulationSystem.killMilitaryCitizensForUnitLoss(unitType, popKilled);
            }
        }

        // Also reduce nation population by the killed amount
        if (totalPopulationKilled > 0) {
            nation.population = Math.max(0, (nation.population || 0) - totalPopulationKilled);
        }

        return totalDestroyed;
    }

    /**
     * Apply Population Plague bad slice: kill 25% of total population
     * across all demographics.
     */
    _applyPopulationKill(nation) {
        const currentPop = nation.population || 0;
        const killCount = Math.floor(currentPop * 0.25);
        nation.population = Math.max(0, currentPop - killCount);

        // Kill citizens in PopulationSystem if available
        if (window.PopulationSystem && killCount > 0) {
            // Kill proportionally from each age demographic
            const popSys = window.PopulationSystem;
            const ageGroups = ['teen', 'youngAdult', 'adult', 'middleAged', 'older', 'senior', 'elderly', 'newborn', 'infant', 'toddler', 'child'];
            let remaining = killCount;
            for (const group of ageGroups) {
                if (remaining <= 0) break;
                const groupCount = popSys.ageGroups[group] ? popSys.ageGroups[group].count || 0 : 0;
                const take = Math.min(Math.floor(groupCount * 0.25), remaining);
                for (let i = 0; i < take; i++) {
                    const citizen = Array.from(popSys.citizens.values())
                        .find(c => c.ageGroup === group && c.isAlive);
                    if (citizen) {
                        citizen.die('plague');
                        popSys.citizens.delete(citizen.id);
                        popSys.ageGroups[group].count = Math.max(0, (popSys.ageGroups[group].count || 0) - 1);
                        remaining--;
                    }
                }
            }
            popSys.syncTerritorialDistributionWithCitizens();
        }

        return killCount;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ══════════════════════════════════════════════════════════════════════════

    getState() {
        return {
            totalSlices: this.totalSlices,
            badSlicePositions: BAD_SLICE_POSITIONS,
        };
    }

    setState(state) {
        if (state.totalSlices !== undefined) this.totalSlices = state.totalSlices;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SovereignWheelSystem;
}
if (typeof window !== 'undefined') {
    window.SovereignWheelSystem = SovereignWheelSystem;
}
