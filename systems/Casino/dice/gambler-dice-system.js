/**
 * Gambler Dice System — Live Multiplayer Craps-Style Polyhedral Dice Table
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Stateful craps-style dice game running at CasinoDiceTable level. Multiple
 * players join seats, place bets on a shared dice roll, and the house resolves
 * all bets against the World Bank lottery pool. Supports player-vs-player
 * backing bets with house rake, and a progressive jackpot pool.
 *
 * Multi-roll craps: pass/dont_pass establish a point on come-out roll and
 * resolve on point hit or 7-out. Single-roll bets resolve every roll.
 *
 * All randomness uses crypto.randomInt() — no Math.random().
 * Dice faces are server-authoritative; clients only see logical face values.
 *
 * Money flow: settle() returns payout amounts; world.js applies them to nations
 * via payFromPool. Jackpot payouts are paid from table.jackpotPool directly.
 */

const crypto = require('crypto');
const { CasinoDiceTable } = require('../../../entities/CasinoDiceTable.js');
const { CasinoDiceSeat } = require('../../../entities/CasinoDiceSeat.js');
const { CasinoDiceBet } = require('../../../entities/CasinoDiceBet.js');

function secureRandomInt(max) {
    return crypto.randomInt(max);
}

// ═════════════════════════════════════════════════════════════════════════════
// DIE SIZE REGISTRY
// ═════════════════════════════════════════════════════════════════════════════

const DIE_SIZE_REGISTRY = {
    d4:  { faces: 4,  name: 'D4 Tetrahedron',  defaultDiceCount: 1, maxDiceCount: 5 },
    d6:  { faces: 6,  name: 'D6 Cube',         defaultDiceCount: 1, maxDiceCount: 5 },
    d8:  { faces: 8,  name: 'D8 Octahedron',   defaultDiceCount: 1, maxDiceCount: 5 },
    d12: { faces: 12, name: 'D12 Dodecahedron',defaultDiceCount: 1, maxDiceCount: 5 },
    d20: { faces: 20, name: 'D20 Icosahedron', defaultDiceCount: 1, maxDiceCount: 5 },
};

// Valid bet types per die size
const VALID_BETS_BY_DIE = {
    d4:  ['exact', 'high', 'low', 'odd', 'even', 'range', 'jackpot'],
    d6:  ['pass', 'dont_pass', 'exact', 'high', 'low', 'odd', 'even', 'range', 'field', 'any_craps', 'hardway', 'match_any', 'sum_exact', 'sum_range', 'jackpot'],
    d8:  ['pass', 'dont_pass', 'exact', 'high', 'low', 'odd', 'even', 'range', 'field', 'any_craps', 'hardway', 'match_any', 'sum_exact', 'sum_range', 'jackpot'],
    d12: ['pass', 'dont_pass', 'exact', 'high', 'low', 'odd', 'even', 'range', 'field', 'any_craps', 'hardway', 'match_any', 'sum_exact', 'sum_range', 'jackpot'],
    d20: ['pass', 'dont_pass', 'exact', 'high', 'low', 'odd', 'even', 'range', 'field', 'any_craps', 'hardway', 'match_any', 'sum_exact', 'sum_range', 'jackpot'],
};

function getDieSizeInfo(dieSize) {
    return DIE_SIZE_REGISTRY[dieSize] || DIE_SIZE_REGISTRY.d6;
}

function getValidBets(dieSize) {
    return VALID_BETS_BY_DIE[dieSize] || VALID_BETS_BY_DIE.d6;
}

// ═════════════════════════════════════════════════════════════════════════════
// PAYOUT TABLE — house payout multiplier per bet type & die size
// ═════════════════════════════════════════════════════════════════════════════

// Payout multiplier = profit per unit wagered (bet return is added separately)
// Format: { [betType]: { [dieSize]: multiplier } }
const PAYOUT_TABLE = {
    pass:       { d6: 1.0,  d8: 1.0,  d12: 1.0, d20: 1.0 },
    dont_pass:  { d6: 1.0,  d8: 1.0,  d12: 1.0, d20: 1.0 },
    exact:      { d4: 2.0,  d6: 4.0,  d8: 6.0,  d12: 9.0,  d20: 17.0 },
    high:       { d4: 0.95, d6: 0.95, d8: 0.95, d12: 0.95, d20: 0.95 },
    low:        { d4: 0.95, d6: 0.95, d8: 0.95, d12: 0.95, d20: 0.95 },
    odd:        { d4: 0.95, d6: 0.95, d8: 0.95, d12: 0.95, d20: 0.95 },
    even:       { d4: 0.95, d6: 0.95, d8: 0.95, d12: 0.95, d20: 0.95 },
    range:      { d4: 0.95, d6: 0.95, d8: 0.95, d12: 0.95, d20: 0.95 },
    field:      { d6: 1.0,  d8: 1.0,  d12: 1.0, d20: 1.0 }, // 2:1 on 2 and 12 handled in eval
    any_craps:  { d6: 7.0,  d8: 7.0,  d12: 7.0, d20: 7.0 },
    hardway:    { d4: 14.0, d6: 30.0, d8: 62.0, d12: 142.0, d20: 350.0 },
    match_any:  { d4: 3.0,  d6: 5.0,  d8: 7.0,  d12: 11.0, d20: 19.0 },
    sum_exact:  { d6: 8.0,  d8: 10.0, d12: 15.0, d20: 25.0 },
    sum_range:  { d6: 0.95, d8: 0.95, d12: 0.95, d20: 0.95 },
    jackpot:    { d4: 0.0,  d6: 0.0,  d8: 0.0,  d12: 0.0,  d20: 0.0 }, // Pays from jackpot pool
};

function getPayoutMultiplier(betType, dieSize) {
    const byDie = PAYOUT_TABLE[betType];
    if (!byDie) return 1;
    return byDie[dieSize] !== undefined ? byDie[dieSize] : 1;
}

// ═════════════════════════════════════════════════════════════════════════════
// BET EVALUATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Evaluate a single bet against a dice roll result.
 * Returns won: null if bet is still pending (multi-roll pass/dont_pass).
 * Returns won: 'push' if bet is refunded with no profit/loss.
 * @param {Object} bet - CasinoDiceBet
 * @param {Object} roll - { faces: [], sum, dieSize, diceCount, allSame, sameFace, isNatural, isCraps, pointHit, sevenOut }
 * @param {Object} table - CasinoDiceTable (for point state)
 * @returns {Object} { won: boolean|null|'push', payoutMultiplier: number }
 */
function evaluateBet(bet, roll, table) {
    const { betType, target } = bet;
    const { faces, sum, dieSize, diceCount, allSame, sameFace, isNatural, isCraps, pointHit, sevenOut } = roll;
    const N = getDieSizeInfo(dieSize).faces;
    const payoutMult = getPayoutMultiplier(betType, dieSize);

    switch (betType) {
        // ═══════════════════════════════════════════════════════════════════════
        // PASS / DON'T PASS (multi-roll craps)
        // ═══════════════════════════════════════════════════════════════════════
        case 'pass':
            if (isNatural) return { won: true, payoutMultiplier: payoutMult };
            if (isCraps) return { won: false, payoutMultiplier: 0 };
            if (pointHit) return { won: true, payoutMultiplier: payoutMult };
            if (sevenOut) return { won: false, payoutMultiplier: 0 };
            return { won: null, payoutMultiplier: payoutMult }; // Point pending

        case 'dont_pass':
            if (sum === 2 || sum === 3) return { won: true, payoutMultiplier: payoutMult };
            if (sum === 12) return { won: 'push', payoutMultiplier: 0 }; // Push — bet returned
            if (isNatural) return { won: false, payoutMultiplier: 0 };
            if (sevenOut) return { won: true, payoutMultiplier: payoutMult };
            if (pointHit) return { won: false, payoutMultiplier: 0 };
            return { won: null, payoutMultiplier: payoutMult }; // Point pending

        // ══════════════════════════════════════════════════════════════════════
        // EXACT NUMBER (1 die)
        // ═══════════════════════════════════════════════════════════════════════
        case 'exact': {
            const t = Number(target);
            if (diceCount === 1) {
                return { won: faces[0] === t, payoutMultiplier: payoutMult };
            }
            return { won: faces.every(f => f === t), payoutMultiplier: payoutMult };
        }

        // ══════════════════════════════════════════════════════════════════════
        // HIGH / LOW / ODD / EVEN (1 die)
        // ═══════════════════════════════════════════════════════════════════════
        case 'high': {
            const mid = N / 2;
            return { won: diceCount === 1 ? faces[0] > mid : faces.every(f => f > mid), payoutMultiplier: payoutMult };
        }
        case 'low': {
            const mid = N / 2;
            return { won: diceCount === 1 ? faces[0] <= mid : faces.every(f => f <= mid), payoutMultiplier: payoutMult };
        }
        case 'odd':
            return { won: faces.every(f => f % 2 === 1), payoutMultiplier: payoutMult };
        case 'even':
            return { won: faces.every(f => f % 2 === 0), payoutMultiplier: payoutMult };

        // ══════════════════════════════════════════════════════════════════════
        // RANGE BET (1 die)
        // ═══════════════════════════════════════════════════════════════════════
        case 'range': {
            const [lo, hi] = Array.isArray(target) ? target : [Number(target), Number(target)];
            return { won: faces.every(f => f >= lo && f <= hi), payoutMultiplier: payoutMult };
        }

        // ══════════════════════════════════════════════════════════════════════
        // FIELD BET (2+ dice, sum-based)
        // ═══════════════════════════════════════════════════════════════════════
        case 'field': {
            const fieldNumbers = [2, 3, 4, 9, 10, 11, 12];
            if (!fieldNumbers.includes(sum)) return { won: false, payoutMultiplier: 0 };
            const mult = (sum === 2 || sum === 12) ? 2.0 : payoutMult;
            return { won: true, payoutMultiplier: mult };
        }

        // ══════════════════════════════════════════════════════════════════════
        // ANY CRAPS (2+ dice, sum 2, 3, or 12)
        // ═══════════════════════════════════════════════════════════════════════
        case 'any_craps':
            return { won: [2, 3, 12].includes(sum), payoutMultiplier: payoutMult };

        // ══════════════════════════════════════════════════════════════════════
        // HARD WAY (K dice, all show same specific face)
        // ═══════════════════════════════════════════════════════════════════════
        case 'hardway': {
            const t = Number(target);
            return { won: allSame && sameFace === t, payoutMultiplier: payoutMult };
        }

        // ══════════════════════════════════════════════════════════════════════
        // MATCH ANY (K dice, all same face, any number)
        // ═══════════════════════════════════════════════════════════════════════
        case 'match_any':
            return { won: allSame, payoutMultiplier: payoutMult };

        // ══════════════════════════════════════════════════════════════════════
        // SUM EXACT (K dice, sum equals target)
        // ═══════════════════════════════════════════════════════════════════════
        case 'sum_exact':
            return { won: sum === Number(target), payoutMultiplier: payoutMult };

        // ══════════════════════════════════════════════════════════════════════
        // SUM RANGE (K dice, sum within [lo, hi])
        // ═══════════════════════════════════════════════════════════════════════
        case 'sum_range': {
            const [lo, hi] = Array.isArray(target) ? target : [Number(target), Number(target)];
            return { won: sum >= lo && sum <= hi, payoutMultiplier: payoutMult };
        }

        // ══════════════════════════════════════════════════════════════════════
        // JACKPOT (5 dice, all same face)
        // ═══════════════════════════════════════════════════════════════════════
        case 'jackpot':
            return { won: diceCount === 5 && allSame, payoutMultiplier: 0 }; // Pays from jackpot pool

        default:
            return { won: false, payoutMultiplier: 0 };
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ODDS CALCULATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Compute true odds and house edge for a bet type on a given die size.
 * @param {string} betType
 * @param {string} dieSize
 * @param {number} diceCount
 * @param {any} target
 * @returns {Object} { trueOdds, houseEdge, payoutMultiplier, winProbability }
 */
function computeBetOdds(betType, dieSize, diceCount = 1, target = null) {
    const N = getDieSizeInfo(dieSize).faces;
    const payoutMult = getPayoutMultiplier(betType, dieSize);
    let winProbability = 0;

    switch (betType) {
        case 'exact':
            winProbability = diceCount === 1 ? 1 / N : Math.pow(1 / N, diceCount);
            break;
        case 'high':
        case 'low':
        case 'odd':
        case 'even':
            winProbability = diceCount === 1 ? 0.5 : Math.pow(0.5, diceCount);
            break;
        case 'range': {
            const [lo, hi] = Array.isArray(target) ? target : [Number(target), Number(target)];
            const m = hi - lo + 1;
            winProbability = diceCount === 1 ? m / N : Math.pow(m / N, diceCount);
            break;
        }
        case 'hardway': {
            winProbability = Math.pow(1 / N, diceCount);
            break;
        }
        case 'match_any':
            winProbability = N * Math.pow(1 / N, diceCount);
            break;
        case 'jackpot':
            winProbability = diceCount === 5 ? Math.pow(1 / N, 4) : 0;
            break;
        case 'pass':
        case 'dont_pass':
        case 'field':
        case 'any_craps':
        case 'sum_exact':
        case 'sum_range':
            winProbability = betType === 'any_craps' ? 3 / 36 :
                             betType === 'field' ? 7 / 36 :
                             betType === 'pass' ? 244 / 495 :
                             betType === 'dont_pass' ? 245 / 495 : 0.1;
            break;
        default:
            winProbability = 0.1;
    }

    const trueOdds = winProbability > 0 ? (1 - winProbability) / winProbability : 0;
    const houseEdge = trueOdds > 0 ? (trueOdds - payoutMult) / (trueOdds + 1) : 0;

    return {
        trueOdds: Math.round(trueOdds * 100) / 100,
        houseEdge: Math.round(houseEdge * 10000) / 100,
        payoutMultiplier: payoutMult,
        winProbability: Math.round(winProbability * 10000) / 100,
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// DICE ROLL GENERATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Generate a server-authoritative dice roll.
 * @param {string} dieSize
 * @param {number} diceCount
 * @param {Object} table
 * @returns {Object} { faces: [], sum, allSame, sameFace, ...metadata }
 */
function rollDice(dieSize, diceCount, table) {
    const N = getDieSizeInfo(dieSize).faces;
    const faces = [];
    for (let i = 0; i < diceCount; i++) {
        faces.push(secureRandomInt(N) + 1);
    }
    const sum = faces.reduce((a, b) => a + b, 0);
    const allSame = faces.every(f => f === faces[0]);
    const sameFace = allSame ? faces[0] : null;

    let isNatural = false;
    let isCraps = false;
    let pointHit = false;
    let sevenOut = false;

    if (diceCount >= 2) {
        if ([7, 11].includes(sum)) isNatural = true;
        if ([2, 3, 12].includes(sum)) isCraps = true;
        if (table.pointEstablished) {
            if (sum === table.point) pointHit = true;
            if (sum === 7) sevenOut = true;
        }
    }

    return {
        faces,
        sum,
        dieSize,
        diceCount,
        allSame,
        sameFace,
        isNatural,
        isCraps,
        pointHit,
        sevenOut,
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// GAMBLER DICE SYSTEM
// ═════════════════════════════════════════════════════════════════════════════

class GamblerDiceSystem {
    constructor() {
        this.isInitialized = false;
        this.tables = new Map();
        this.publicTableId = null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log('Gambler Dice System initialized');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TABLE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    getPublicTable() {
        if (this.publicTableId && this.tables.has(this.publicTableId)) {
            const table = this.tables.get(this.publicTableId);
            if (table.status !== 'closed') return table;
        }
        const table = new CasinoDiceTable({ dieSize: 'd6', diceCount: 2, minBet: 100, maxBet: 100000 });
        this.tables.set(table.tableId, table);
        this.publicTableId = table.tableId;
        return table;
    }

    createTable(options = {}) {
        const table = new CasinoDiceTable({
            dieSize: options.dieSize || 'd6',
            diceCount: options.diceCount || 2,
            minBet: options.minBet ?? 100,
            maxBet: options.maxBet ?? 100000,
            maxPayout: options.maxPayout ?? 10000,
            hostPlayerId: options.hostPlayerId || null,
            autoRoll: options.autoRoll ?? false,
        });
        this.tables.set(table.tableId, table);
        return table;
    }

    getTable(tableId) {
        return this.tables.get(tableId) || null;
    }

    listTables() {
        const out = [];
        for (const [tableId, table] of this.tables) {
            out.push({
                tableId: table.tableId,
                status: table.status,
                dieSize: table.dieSize,
                diceCount: table.diceCount,
                occupiedSeats: table.occupiedSeatCount(),
                openSeats: table.openSeatCount(),
                minBet: table.minBet,
                maxBet: table.maxBet,
                hostPlayerId: table.hostPlayerId,
                jackpotPool: table.jackpotPool,
                createdAt: table.createdAt,
            });
        }
        return out;
    }

    closeTable(tableId) {
        const table = this.tables.get(tableId);
        if (!table) return false;
        table.status = 'closed';
        this.tables.delete(tableId);
        if (this.publicTableId === tableId) this.publicTableId = null;
        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME ACTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    joinTable(table, seatIndex, nationId, userId) {
        if (!table) return { ok: false, reason: 'Table not found' };
        if (seatIndex < 0 || seatIndex > 5) return { ok: false, reason: 'Invalid seat index' };
        const seat = table.getSeat(seatIndex);
        if (!seat) return { ok: false, reason: 'Seat not found' };
        if (!seat.isEmpty()) return { ok: false, reason: 'Seat already occupied' };
        seat.occupy(nationId, userId);
        table.lastActivityAt = Date.now();
        return { ok: true, seat: seat.serialize() };
    }

    leaveTable(table, seatIndex) {
        if (!table) return { ok: false, reason: 'Table not found' };
        const seat = table.getSeat(seatIndex);
        if (!seat || seat.isEmpty()) return { ok: false, reason: 'Seat is empty' };
        const result = table.leaveSeat(seatIndex);
        return result ? { ok: true } : { ok: false, reason: 'Cannot leave during active round' };
    }

    listTablesAction() {
        return { ok: true, tables: this.listTables() };
    }

    /**
     * Place a bet on a seat.
     * P2P backing is handled via backBet(), not here.
     */
    placeBet(table, seatIndex, betType, target, amount, nation, casinoSystem) {
        if (!table) return { ok: false, reason: 'Table not found' };
        if (table.status !== 'betting' && table.status !== 'waiting' && table.status !== 'rolling') {
            return { ok: false, reason: 'Table is not accepting bets' };
        }
        const seat = table.getSeat(seatIndex);
        if (!seat || seat.isEmpty()) return { ok: false, reason: 'Seat is empty' };

        const validBets = getValidBets(table.dieSize);
        if (!validBets.includes(betType)) {
            return { ok: false, reason: `Bet type '${betType}' not valid for ${table.dieSize}` };
        }

        // Pass/Don't Pass are come-out bets only — cannot place once a point is established
        if (table.pointEstablished && (betType === 'pass' || betType === 'dont_pass')) {
            return { ok: false, reason: 'Pass/Don\'t Pass can only be placed on come-out roll' };
        }

        // Validate target for bet types that require it
        const targetRequired = ['exact', 'range', 'hardway', 'sum_exact', 'sum_range'];
        if (targetRequired.includes(betType) && target === null && target === undefined) {
            return { ok: false, reason: `Bet type '${betType}' requires a target` };
        }

        if (amount < table.minBet || amount > table.maxBet) {
            return { ok: false, reason: `Bet must be between ${table.minBet} and ${table.maxBet}` };
        }

        const odds = computeBetOdds(betType, table.dieSize, table.diceCount, target);

        // Deduct money and add to pool
        nation.money = money - amount;
        if (casinoSystem) {
            casinoSystem.addToPool(amount, 'gamblerDice');
            if (betType === 'hardway' || betType === 'jackpot') {
                const contrib = Math.floor(amount * table.jackpotContributionPct);
                if (contrib > 0) {
                    table.jackpotPool += contrib;
                    casinoSystem.addToPool(contrib, 'gamblerDice_jackpot');
                }
            }
        }

        if (table.status === 'waiting') {
            table.status = 'betting';
        }

        const bet = new CasinoDiceBet({
            seatIndex,
            nationId: nation.id,
            userId: seat.userId,
            betType,
            target,
            amount,
            payoutMultiplier: odds.payoutMultiplier,
            trueOdds: odds.trueOdds,
            houseEdge: odds.houseEdge,
            isJackpotBet: betType === 'jackpot',
        });

        const result = table.placeBet(seatIndex, bet);
        if (!result.ok) {
            // Refund: remove from pool and nation money
            nation.money = money;
            if (casinoSystem) {
                casinoSystem.payFromPool(amount, 'gamblerDice_refund');
                if (betType === 'hardway' || betType === 'jackpot') {
                    const contrib = Math.floor(amount * table.jackpotContributionPct);
                    if (contrib > 0) {
                        table.jackpotPool = Math.max(0, table.jackpotPool - contrib);
                    }
                }
            }
            return result;
        }

        table.lastActivityAt = Date.now();

        if (table.allSeatsBet()) {
            table.status = 'rolling';
        }

        return { ok: true, bet: bet.serialize() };
    }

    /**
     * Place a P2P backing bet on another player's existing bet.
     */
    backBet(table, seatIndex, betId, amount, nation, casinoSystem) {
        if (!table) return { ok: false, reason: 'Table not found' };
        if (table.status !== 'betting') return { ok: false, reason: 'Table is not in betting phase' };
        const seat = table.getSeat(seatIndex);
        if (!seat || seat.isEmpty()) return { ok: false, reason: 'Seat is empty' };

        let targetBet = null;
        let targetSeatIndex = -1;
        for (let i = 0; i < table.seats.length; i++) {
            const s = table.seats[i];
            const b = s.getBet(betId);
            if (b) {
                targetBet = b;
                targetSeatIndex = i;
                break;
            }
        }
        if (!targetBet) return { ok: false, reason: 'Bet not found' };
        if (targetBet.isP2PBack()) return { ok: false, reason: 'Cannot back a P2P bet' };
        if (targetSeatIndex === seatIndex) return { ok: false, reason: 'Cannot back your own bet' };

        if (amount < table.minBet || amount > table.maxBet) {
            return { ok: false, reason: `Back bet must be between ${table.minBet} and ${table.maxBet}` };
        }
        const money = nation.money || 0;
        if (money < amount) return { ok: false, reason: 'Insufficient funds' };

        nation.money = money - amount;
        if (casinoSystem) {
            casinoSystem.addToPool(amount, 'gamblerDice_p2p');
        }

        const backerBet = new CasinoDiceBet({
            seatIndex,
            nationId: nation.id,
            userId: seat.userId,
            betType: targetBet.betType,
            target: targetBet.target,
            amount,
            backedBy: targetSeatIndex,
            backerNationId: targetBet.nationId,
            payoutMultiplier: targetBet.payoutMultiplier,
            trueOdds: targetBet.trueOdds,
            houseEdge: targetBet.houseEdge,
        });

        seat.addBet(backerBet);
        seat.status = 'betting';
        table.lastActivityAt = Date.now();

        return { ok: true, bet: backerBet.serialize() };
    }

    /**
     * Roll the dice. Handles multi-roll craps: pass/dont_pass may stay pending
     * across rolls if a point is established. Single-roll bets always resolve.
     */
    roll(table, casinoSystem) {
        if (!table) return { ok: false, reason: 'Table not found' };
        if (table.status !== 'rolling') return { ok: false, reason: 'Table not in rolling phase' };

        const roll = rollDice(table.dieSize, table.diceCount, table);
        table.setRoll(roll.faces, roll.sum, roll);

        // Update craps phase state
        if (table.diceCount >= 2) {
            if (!table.pointEstablished) {
                // Come-out roll
                if (roll.isNatural || roll.isCraps) {
                    // Resolved immediately
                } else if (roll.sum === 12) {
                    // Don't pass push on 12; pass loses — both resolved
                } else {
                    // Establish point
                    table.setPoint(roll.sum);
                }
            } else {
                // Point roll
                if (roll.pointHit || roll.sevenOut) {
                    // Resolved
                }
                // Otherwise point still pending
            }
        }

        table.status = 'settling';
        table.lastActivityAt = Date.now();

        const result = this.settle(table, roll, casinoSystem);

        // If pass/dont_pass bets are still pending, table stays rolling
        const pendingPassBets = this._hasPendingPassBets(table);
        if (pendingPassBets) {
            table.status = 'rolling';
            result.status = 'rolling';
        } else {
            table.status = 'closed';
            result.status = 'closed';
        }

        return result;
    }

    /**
     * Check if any pass/dont_pass bet is still pending (won: null).
     */
    _hasPendingPassBets(table) {
        for (const seat of table.seats) {
            if (seat.isEmpty()) continue;
            for (const bet of seat.bets) {
                if (bet.won === null && (bet.betType === 'pass' || bet.betType === 'dont_pass')) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Settle all resolvable bets against the roll result.
     * Bets with won: null remain pending (not settled).
     * Returns results WITHOUT applying nation money — world.js handles that.
     * Jackpot payouts are returned separately and paid from table.jackpotPool.
     */
    settle(table, roll, casinoSystem) {
        if (!table) return { ok: false, reason: 'Table not found' };
        const results = [];
        const jackpotWinners = [];

        for (const seat of table.seats) {
            if (seat.isEmpty()) continue;
            if (!seat.hasBets()) continue;

            const seatResult = {
                seatIndex: seat.seatIndex,
                nationId: seat.nationId,
                userId: seat.userId,
                bets: [],
                totalPayout: 0,
                netProfit: 0,
            };

            for (const bet of seat.bets) {
                // Skip already-settled bets
                if (bet.won !== null) continue;

                const evalResult = evaluateBet(bet, roll, table);

                // Still pending — leave bet as-is
                if (evalResult.won === null) {
                    bet.won = null;
                    continue;
                }

                bet.won = evalResult.won;
                bet.payout = 0;

                let payout = 0;
                let isPush = false;

                if (evalResult.won === true) {
                    if (bet.isJackpotBet) {
                        // Jackpot pays from jackpot pool (handled by world.js after settle)
                        const jackpotShare = Math.floor(table.jackpotPool * 0.5); // 50% of pool
                        payout = jackpotShare > 0 ? jackpotShare : bet.amount * 2;
                        jackpotWinners.push({ seatIndex: seat.seatIndex, nationId: seat.nationId, amount: payout });
                        // Do NOT reduce table.jackpotPool here — world.js deducts paid amounts
                        // and sets the 10% reserve after all jackpot winners are paid.
                        bet.payout = payout; // Mark bet record with jackpot payout amount
                    } else if (bet.isP2PBack()) {
                        const grossPayout = bet.amount * (1 + evalResult.payoutMultiplier);
                        const rake = Math.floor(grossPayout * table.rakePct);
                        payout = grossPayout - rake;
                        if (casinoSystem && rake > 0) {
                            casinoSystem.addToPool(rake, 'gamblerDice_rake');
                        }
                    } else {
                        // House-banked win: return bet + winnings
                        payout = bet.amount * (1 + evalResult.payoutMultiplier);
                    }
                } else if (evalResult.won === 'push') {
                    // Push: return bet only, no profit
                    payout = bet.amount;
                    isPush = true;
                }
                // won === false: payout = 0, house keeps bet

                payout = Math.min(payout, table.maxPayout);

                let actualPayout = payout;
                if (actualPayout > 0 && !bet.isJackpotBet && casinoSystem) {
                    actualPayout = casinoSystem.payFromPool(actualPayout, 'gamblerDice_win');
                }

                bet.payout = actualPayout;
                seat.totalWon += actualPayout;

                seatResult.bets.push({
                    betId: bet.betId,
                    betType: bet.betType,
                    target: bet.target,
                    amount: bet.amount,
                    won: evalResult.won,
                    isPush,
                    payout: actualPayout,
                    isJackpotBet: bet.isJackpotBet,
                    isP2PBack: bet.isP2PBack(),
                    backedBy: bet.backedBy,
                });
                if (!bet.isJackpotBet) {
                    seatResult.totalPayout += actualPayout;
                }
                seatResult.netProfit += actualPayout - bet.amount;
            }

            results.push(seatResult);
        }

        table.status = 'closed';

        return { ok: true, results, roll, jackpotWinners, jackpotPool: table.jackpotPool };
    }

    /**
     * Reset table for next round (seats stay occupied).
     * Cannot reset if any bets are still pending (unresolved).
     */
    resetForNextRound(table) {
        if (!table) return false;
        // Guard: cannot reset while bets are pending
        for (const seat of table.seats) {
            if (seat.isEmpty()) continue;
            for (const bet of seat.bets) {
                if (bet.won === null) return false;
            }
        }
        table.resetForNewRound();
        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    getTableState(table, viewerCardSet = null) {
        const seatsOut = table.seats.map(seat => ({
            seatIndex: seat.seatIndex,
            nationId: seat.nationId,
            userId: seat.userId,
            status: seat.status,
            bets: seat.bets.map(b => b.serialize()),
            isShooter: seat.isShooter,
            totalWagered: seat.totalWagered,
            totalWon: seat.totalWon,
            isEmpty: seat.isEmpty(),
        }));

        return {
            tableId: table.tableId,
            status: table.status,
            dieSize: table.dieSize,
            diceCount: table.diceCount,
            shooterSeatIndex: table.shooterSeatIndex,
            point: table.point,
            pointEstablished: table.pointEstablished,
            seats: seatsOut,
            currentSeatIndex: table.currentSeatIndex,
            jackpotPool: table.jackpotPool,
            minBet: table.minBet,
            maxBet: table.maxBet,
            maxPayout: table.maxPayout,
            rakePct: table.rakePct,
            lastRoll: table.lastRoll || null,
            validBets: getValidBets(table.dieSize),
            cardSet: viewerCardSet || null,
        };
    }

    getBetMenu(dieSize, diceCount = 1) {
        const validBets = getValidBets(dieSize);
        const menu = [];
        for (const betType of validBets) {
            const odds = computeBetOdds(betType, dieSize, diceCount);
            menu.push({
                betType,
                payoutMultiplier: odds.payoutMultiplier,
                trueOdds: odds.trueOdds,
                houseEdge: odds.houseEdge,
                winProbability: odds.winProbability,
            });
        }
        return { ok: true, dieSize, diceCount, bets: menu };
    }

    setShooter(table, seatIndex, nationId) {
        if (!table) return { ok: false, reason: 'Table not found' };
        if (table.hostPlayerId !== nationId) return { ok: false, reason: 'Only host can set shooter' };
        const seat = table.getSeat(seatIndex);
        if (!seat || seat.isEmpty()) return { ok: false, reason: 'Seat is empty' };
        table.setShooter(seatIndex);
        return { ok: true, shooterSeatIndex: seatIndex };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    getState() {
        const tables = {};
        for (const [tableId, table] of this.tables) {
            tables[tableId] = table.serialize();
        }
        return {
            tables,
            publicTableId: this.publicTableId,
        };
    }

    setState(state) {
        if (state.tables) {
            for (const [tableId, data] of Object.entries(state.tables)) {
                const table = new CasinoDiceTable();
                table.deserialize(data);
                this.tables.set(tableId, table);
            }
        }
        if (state.publicTableId) this.publicTableId = state.publicTableId;
    }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GamblerDiceSystem;
  module.exports.DIE_SIZE_REGISTRY = DIE_SIZE_REGISTRY;
  module.exports.computeBetOdds = computeBetOdds;
  module.exports.evaluateBet = evaluateBet;
  module.exports.rollDice = rollDice;
}
if (typeof window !== 'undefined') {
  window.GamblerDiceSystem = GamblerDiceSystem;
  window.DIE_SIZE_REGISTRY = DIE_SIZE_REGISTRY;
  window.computeBetOdds = computeBetOdds;
  window.evaluateBet = evaluateBet;
  window.rollDice = rollDice;
}
