/**
 * Casino Seat — Live Blackjack Table Seat Entity
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Represents a single seat at a blackjack table. Holds the player's hand,
 * bet, insurance, split state, and turn status.
 */

class CasinoSeat {
    constructor(seatIndex) {
        this.seatIndex = seatIndex;      // 0-5
        this.nationId = null;            // Occupying nation, or null if empty
        this.userId = null;              // Web user/session ID occupying seat
        this.status = 'empty';           // empty, waiting, betting, playing, stood, busted, blackjack, surrendered
        this.hand = [];                  // Array of Card {suit, rank, value, code}
        this.bet = 0;                    // Current wager placed this hand
        this.insuranceBet = 0;           // Insurance wager (0 if none)
        this.hasDoubled = false;         // Whether player doubled down
        this.hasSplit = false;           // Whether player has split (MVP: enabled)
        this.isSplitHand = false;        // Whether this seat is playing a split hand
        this.activeHand = 'main';        // 'main' | 'split' — which sub-hand is currently being played
        this.splitHand = null;           // Second hand if split: {hand, bet, status, hasDoubled}
        this.insuranceDecided = false;   // Whether player has decided on insurance this round
        this.turnTimerStartedAt = null;  // Timestamp when turn timer began
        this.turnTimerDurationMs = 30000; // Default 30 seconds
        this.lastActionAt = null;        // Timestamp of last action
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEAT LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════════

    occupy(nationId, userId) {
        this.nationId = nationId;
        this.userId = userId;
        this.status = 'waiting';
        this.hand = [];
        this.bet = 0;
        this.insuranceBet = 0;
        this.hasDoubled = false;
        this.hasSplit = false;
        this.isSplitHand = false;
        this.activeHand = 'main';
        this.splitHand = null;
        this.insuranceDecided = false;
        this.turnTimerStartedAt = null;
        this.lastActionAt = null;
    }

    vacate() {
        this.nationId = null;
        this.userId = null;
        this.status = 'empty';
        this.hand = [];
        this.bet = 0;
        this.insuranceBet = 0;
        this.hasDoubled = false;
        this.hasSplit = false;
        this.isSplitHand = false;
        this.activeHand = 'main';
        this.splitHand = null;
        this.insuranceDecided = false;
        this.turnTimerStartedAt = null;
        this.lastActionAt = null;
    }

    isEmpty() {
        return this.status === 'empty';
    }

    isPlaying() {
        return this.status === 'playing' || this.status === 'betting';
    }

    isActed() {
        return this.status === 'stood' || this.status === 'busted' || this.status === 'blackjack' || this.status === 'surrendered';
    }

    isInsuranceDecided() {
        return this.insuranceDecided;
    }

    getActiveHand() {
        return this.activeHand === 'split' && this.splitHand ? this.splitHand.hand : this.hand;
    }

    getActiveHandValue() {
        return calculateHandValue(this.getActiveHand());
    }

    getActiveHandBet() {
        return this.activeHand === 'split' && this.splitHand
            ? this.splitHand.bet
            : this.bet;
    }

    getActiveHandHasDoubled() {
        return this.activeHand === 'split' && this.splitHand
            ? this.splitHand.hasDoubled
            : this.hasDoubled;
    }

    canSplit() {
        if (this.hand.length !== 2) return false;
        if (this.hasSplit || this.isSplitHand) return false;
        return this.hand[0].rank === this.hand[1].rank;
    }

    canDouble() {
        const hand = this.getActiveHand();
        return hand.length === 2 && !this.getActiveHandHasDoubled();
    }

    canSurrender() {
        const hand = this.getActiveHand();
        return hand.length === 2 && !this.getActiveHandHasDoubled();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HAND HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    addCard(card) {
        this.hand.push(card);
    }

    addCardToActiveHand(card) {
        if (this.activeHand === 'split' && this.splitHand) {
            this.splitHand.hand.push(card);
        } else {
            this.hand.push(card);
        }
        this.lastActionAt = Date.now();
    }

    clearHand() {
        this.hand = [];
        if (this.splitHand) {
            this.splitHand.hand = [];
        }
    }

    handValue() {
        return calculateHandValue(this.hand);
    }

    isBlackjack() {
        return this.hand.length === 2 && this.handValue() === 21;
    }

    isBusted() {
        return this.handValue() > 21;
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
            hand: [...this.hand],
            bet: this.bet,
            insuranceBet: this.insuranceBet,
            hasDoubled: this.hasDoubled,
            hasSplit: this.hasSplit,
            isSplitHand: this.isSplitHand,
            activeHand: this.activeHand,
            splitHand: this.splitHand ? { ...this.splitHand, hand: [...(this.splitHand.hand || [])] } : null,
            insuranceDecided: this.insuranceDecided,
            turnTimerStartedAt: this.turnTimerStartedAt,
            turnTimerDurationMs: this.turnTimerDurationMs,
            lastActionAt: this.lastActionAt,
        };
    }

    deserialize(data) {
        this.seatIndex = data.seatIndex ?? this.seatIndex;
        this.nationId = data.nationId;
        this.userId = data.userId;
        this.status = data.status || 'empty';
        this.hand = Array.isArray(data.hand) ? [...data.hand] : [];
        this.bet = data.bet || 0;
        this.insuranceBet = data.insuranceBet || 0;
        this.hasDoubled = !!data.hasDoubled;
        this.hasSplit = !!data.hasSplit;
        this.isSplitHand = !!data.isSplitHand;
        this.activeHand = data.activeHand || 'main';
        this.splitHand = data.splitHand || null;
        this.insuranceDecided = !!data.insuranceDecided;
        this.turnTimerStartedAt = data.turnTimerStartedAt;
        this.turnTimerDurationMs = data.turnTimerDurationMs ?? 30000;
        this.lastActionAt = data.lastActionAt;
    }
}

/**
 * Calculate blackjack hand value with Ace handling (11 or 1).
 * @param {Array} hand - Array of card objects {suit, rank, value, code}
 * @returns {number} Best hand value (<= 21 if possible)
 */
function calculateHandValue(hand) {
    let total = 0;
    let aces = 0;
    for (const card of hand) {
        total += card.value;
        if (card.rank === 'A') aces++;
    }
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
}

/**
 * Get card value for blackjack.
 * @param {Object} card - {suit, rank, value, code}
 * @returns {number}
 */
function getCardValue(card) {
    return card.value;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CasinoSeat, calculateHandValue, getCardValue };
}
if (typeof window !== 'undefined') {
  window.CasinoSeat = CasinoSeat;
  window.calculateHandValue = calculateHandValue;
  window.getCardValue = getCardValue;
}
