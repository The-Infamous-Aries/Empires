/**
 * Casino Dice Seat — Gambler Dice Seat Entity
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Represents a single seat at a live craps-style dice table. Holds the
 * player's bets, shooter status, and per-round state.
 */

class CasinoDiceSeat {
    constructor(seatIndex) {
        this.seatIndex = seatIndex;      // 0-5
        this.nationId = null;            // Occupying nation or null
        this.userId = null;              // Web user/session or null
        this.status = 'empty';           // empty, waiting, betting, rolled, sitting_out
        this.bets = [];                  // Array of CasinoDiceBet placed this round
        this.isShooter = false;          // Whether this seat is the current shooter
        this.lastActionAt = null;        // Timestamp of last action
        this.totalWagered = 0;           // Total wagered this round (all bets)
        this.totalWon = 0;               // Total won this round
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEAT LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════════

    occupy(nationId, userId) {
        this.nationId = nationId;
        this.userId = userId;
        this.status = 'waiting';
        this.bets = [];
        this.isShooter = false;
        this.lastActionAt = Date.now();
        this.totalWagered = 0;
        this.totalWon = 0;
    }

    vacate() {
        this.nationId = null;
        this.userId = null;
        this.status = 'empty';
        this.bets = [];
        this.isShooter = false;
        this.lastActionAt = null;
        this.totalWagered = 0;
        this.totalWon = 0;
    }

    isEmpty() {
        return this.status === 'empty';
    }

    isBetting() {
        return this.status === 'betting';
    }

    hasBets() {
        return this.bets.length > 0;
    }

    totalBetAmount() {
        return this.bets.reduce((sum, bet) => sum + bet.amount, 0);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BET MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    addBet(bet) {
        if (!bet || typeof bet.amount !== 'number' || isNaN(bet.amount)) {
            throw new Error('Invalid bet: missing or invalid amount');
        }
        this.bets.push(bet);
        this.totalWagered += bet.amount;
        this.lastActionAt = Date.now();
    }

    clearBets() {
        this.bets = [];
        this.totalWagered = 0;
        this.totalWon = 0;
    }

    getBet(betId) {
        return this.bets.find(b => b.betId === betId) || null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    serialize() {
        return {
            seatIndex: this.seatIndex,
            nationId: this.nationId,
            userId: this.userId,
            status: this.status,
            bets: this.bets.map(b => b.serialize()),
            isShooter: this.isShooter,
            lastActionAt: this.lastActionAt,
            totalWagered: this.totalWagered,
            totalWon: this.totalWon,
        };
    }

    deserialize(data) {
        this.seatIndex = data.seatIndex ?? this.seatIndex;
        this.nationId = data.nationId || null;
        this.userId = data.userId || null;
        this.status = data.status || 'empty';
        this.bets = Array.isArray(data.bets) ? data.bets.map(b => {
            const bet = new CasinoDiceBet();
            bet.deserialize(b);
            return bet;
        }) : [];
        this.isShooter = !!data.isShooter;
        this.lastActionAt = data.lastActionAt || null;
        this.totalWagered = data.totalWagered || 0;
        this.totalWon = data.totalWon || 0;
    }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CasinoDiceSeat;
}
if (typeof window !== 'undefined') {
  window.CasinoDiceSeat = CasinoDiceSeat;
}
