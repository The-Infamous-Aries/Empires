/**
 * Casino Dice Bet — Gambler Dice Bet Entity
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Represents a single wager placed at a live craps-style dice table.
 * Supports house-banked bets (vs World Bank pool) and P2P backing bets.
 */

class CasinoDiceBet {
    constructor(options = {}) {
        this.betId = options.betId || `db_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        this.seatIndex = options.seatIndex ?? -1;      // Seat placing the bet
        this.nationId = options.nationId || null;       // Owning nation
        this.userId = options.userId || null;           // Web user/session
        this.betType = options.betType || 'exact';      // See DIE_SIZE_REGISTRY bet catalog
        this.target = options.target || null;           // Face number, range [lo,hi], sum target, or point
        this.amount = options.amount || 0;              // Wager
        this.backedBy = options.backedBy ?? null;       // Seat index of backer (P2P) or null (0 is a valid seat index)
        this.backerNationId = options.backerNationId || null; // Backer's nation (if P2P)
        this.payoutMultiplier = options.payoutMultiplier ?? 1; // House payout multiplier (0 is valid for jackpot bets)
        this.trueOdds = options.trueOdds || 0;          // Computed true probability denominator
        this.houseEdge = options.houseEdge || 0;        // Precomputed edge %
        this.won = null;                                // null pending, true/false after roll
        this.payout = 0;                                // Amount paid on win
        this.isJackpotBet = !!options.isJackpotBet;     // Whether this contributes to jackpot
        this.createdAt = options.createdAt || Date.now();
    }

    /**
     * Check if this bet is a house-banked bet (not a P2P back).
     */
    isHouseBet() {
        return this.backedBy === null;
    }

    /**
     * Check if this bet is backing another player's bet (P2P).
     */
    isP2PBack() {
        return this.backedBy !== null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    serialize() {
        return {
            betId: this.betId,
            seatIndex: this.seatIndex,
            nationId: this.nationId,
            userId: this.userId,
            betType: this.betType,
            target: this.target,
            amount: this.amount,
            backedBy: this.backedBy,
            backerNationId: this.backerNationId,
            payoutMultiplier: this.payoutMultiplier,
            trueOdds: this.trueOdds,
            houseEdge: this.houseEdge,
            won: this.won,
            payout: this.payout,
            isJackpotBet: this.isJackpotBet,
            createdAt: this.createdAt,
        };
    }

    deserialize(data) {
        this.betId = data.betId || this.betId;
        this.seatIndex = data.seatIndex ?? -1;
        this.nationId = data.nationId || null;
        this.userId = data.userId || null;
        this.betType = data.betType || 'exact';
        this.target = data.target || null;
        this.amount = data.amount || 0;
        this.backedBy = data.backedBy ?? null;
        this.backerNationId = data.backerNationId || null;
        this.payoutMultiplier = data.payoutMultiplier ?? 1;
        this.trueOdds = data.trueOdds || 0;
        this.houseEdge = data.houseEdge || 0;
        this.won = data.won !== undefined ? data.won : null;
        this.payout = data.payout || 0;
        this.isJackpotBet = !!data.isJackpotBet;
        this.createdAt = data.createdAt || Date.now();
    }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CasinoDiceBet;
}
if (typeof window !== 'undefined') {
  window.CasinoDiceBet = CasinoDiceBet;
}
