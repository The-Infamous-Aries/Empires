/**
 * Casino Table — Live Blackjack Table Entity
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * A stateful, multiplayer blackjack table where 1-6 real users play their own
 * hands against a shared dealer hand. Table persists in memory across multiple
 * player actions (bet → deal → hit/stand → settle).
 */

const { randomUUID } = require('node:crypto');
const { CasinoSeat, calculateHandValue } = require('./CasinoSeat.js');

class CasinoTable {
    constructor(options = {}) {
        this.tableId = options.tableId || `bj_${randomUUID()}`;
        this.status = 'waiting'; // waiting, betting, dealing, insurance, playerTurn, dealerTurn, settling, closed
        this.shoe = [];          // Current shuffled shoe (3 decks = 156 cards)
        this.shoeCardsUsed = 0;  // Cards dealt from shoe this session
        this.penetrationTarget = options.penetrationTarget ?? 104; // ~66% of 156
        this.dealerHand = [];    // Dealer's current hand
        this.dealerHoleCardRevealed = false;
        this.seats = [];         // 6 CasinoSeat instances
        this.currentSeatIndex = -1; // Whose turn it is (-1 if dealer turn)
        this.burnCard = null;    // First card burned at start of shoe
        this.createdAt = Date.now();
        this.lastActivityAt = Date.now();
        this.minBet = options.minBet ?? 100;
        this.maxBet = options.maxBet ?? 100000;
        this.hostPlayerId = options.hostPlayerId || null;

        // Initialize 6 empty seats
        for (let i = 0; i < 6; i++) {
            this.seats.push(new CasinoSeat(i));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TABLE STATE
    // ═══════════════════════════════════════════════════════════════════════════

    isFull() {
        return this.seats.every(s => !s.isEmpty());
    }

    openSeatCount() {
        return this.seats.filter(s => s.isEmpty()).length;
    }

    occupiedSeatCount() {
        return this.seats.filter(s => !s.isEmpty()).length;
    }

    getSeat(seatIndex) {
        return this.seats[seatIndex] || null;
    }

    getOccupiedSeats() {
        return this.seats.filter(s => !s.isEmpty());
    }

    getActiveSeats() {
        // Seats currently playing a hand (betting, playing, or awaiting resolution)
        return this.seats.filter(s =>
            s.status === 'betting' ||
            s.status === 'playing' ||
            s.status === 'stood' ||
            s.status === 'busted' ||
            s.status === 'blackjack' ||
            s.status === 'surrendered'
        );
    }

    allSeatsActed() {
        return this.getActiveSeats().every(s => s.isActed());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHOE
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Create a fresh 3-deck shoe (156 cards) and shuffle.
     */
    createShoe() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const shoe = [];

        // 3 decks
        for (let d = 0; d < 3; d++) {
            for (const suit of suits) {
                for (const rank of ranks) {
                    shoe.push({
                        suit,
                        rank,
                        value: getBlackjackCardValue(rank),
                        code: `${rank}${suit[0].toUpperCase()}`,
                    });
                }
            }
        }

        this.shoe = shuffleShoe(shoe);
        this.shoeCardsUsed = 0;

        // Burn the top card
        if (this.shoe.length > 0) {
            this.burnCard = this.shoe.shift();
            this.shoeCardsUsed++;
        } else {
            this.burnCard = null;
        }

        return this.shoe;
    }

    /**
     * Draw a card from the shoe. Reshuffles if penetration target reached.
     * @returns {Object|null} Card or null if shoe empty
     */
    drawCard() {
        // Check penetration
        if (this.shoeCardsUsed >= this.penetrationTarget && this.shoe.length > 0) {
            // Reshuffle remaining cards + create new full shoe
            this.createShoe();
        }

        if (this.shoe.length === 0) {
            this.createShoe();
        }

        const card = this.shoe.shift();
        if (card) {
            this.shoeCardsUsed++;
            this.lastActivityAt = Date.now();
        }
        return card;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DEALER LOGIC
    // ═══════════════════════════════════════════════════════════════════════════

    dealerValue() {
        return calculateHandValue(this.dealerHand);
    }

    dealerShouldHit() {
        const value = this.dealerValue();
        // Dealer hits on soft 17 or lower, stands on hard 17+
        if (value < 17) return true;
        if (value === 17) {
            // Soft 17: hand contains an Ace counted as 11
            return isSoftHand(this.dealerHand);
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEAT OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    joinSeat(seatIndex, nationId, userId) {
        const seat = this.seats[seatIndex];
        if (!seat || !seat.isEmpty()) return false;
        seat.occupy(nationId, userId);
        this.lastActivityAt = Date.now();
        return true;
    }

    leaveSeat(seatIndex, refundBet = true) {
        const seat = this.seats[seatIndex];
        if (!seat || seat.isEmpty()) return false;
        // Refund any unplaced bet if in betting phase
        const refundAmount = refundBet && this.status === 'betting' ? seat.bet : 0;
        seat.vacate();
        this.lastActivityAt = Date.now();
        return { ok: true, refundedBet: refundAmount };
    }

    placeBet(seatIndex, amount) {
        const seat = this.seats[seatIndex];
        if (!seat || seat.isEmpty()) return { ok: false, reason: 'Seat is empty' };
        if (this.status !== 'betting') return { ok: false, reason: 'Not in betting phase' };
        if (seat.bet > 0) return { ok: false, reason: 'Bet already placed this hand' };
        if (amount < this.minBet || amount > this.maxBet) {
            return { ok: false, reason: `Bet must be between ${this.minBet} and ${this.maxBet}` };
        }
        seat.bet = amount;
        seat.status = 'betting';
        seat.lastActionAt = Date.now();
        this.lastActivityAt = Date.now();
        return { ok: true };
    }

    /**
     * Reset the table for a new hand while keeping seats occupied.
     * Clears all hands, bets, dealer cards, and resets statuses.
     */
    resetForNewHand() {
        this.dealerHand = [];
        this.dealerHoleCardRevealed = false;
        this.currentSeatIndex = -1;
        this.status = 'waiting';
        this.lastActivityAt = Date.now();

        // Reshuffle if shoe is running low
        if (this.shoe.length < 20) {
            this.createShoe();
        }

        for (const seat of this.seats) {
            if (seat.isEmpty()) continue;
            seat.hand = [];
            seat.bet = 0;
            seat.insuranceBet = 0;
            seat.insuranceDecided = false;
            seat.hasDoubled = false;
            seat.hasSplit = false;
            seat.isSplitHand = false;
            seat.activeHand = 'main';
            seat.splitHand = null;
            seat.turnTimerStartedAt = null;
            seat.lastActionAt = null;
            seat.status = 'waiting';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    serialize() {
        return {
            tableId: this.tableId,
            status: this.status,
            shoe: [...this.shoe],
            shoeCardsUsed: this.shoeCardsUsed,
            penetrationTarget: this.penetrationTarget,
            dealerHand: [...this.dealerHand],
            dealerHoleCardRevealed: this.dealerHoleCardRevealed,
            seats: this.seats.map(s => s.serialize()),
            currentSeatIndex: this.currentSeatIndex,
            burnCard: this.burnCard,
            createdAt: this.createdAt,
            lastActivityAt: this.lastActivityAt,
            minBet: this.minBet,
            maxBet: this.maxBet,
            hostPlayerId: this.hostPlayerId,
        };
    }

    deserialize(data) {
        this.tableId = data.tableId || this.tableId;
        this.status = data.status || 'waiting';
        this.shoe = Array.isArray(data.shoe) ? [...data.shoe] : [];
        this.shoeCardsUsed = data.shoeCardsUsed || 0;
        this.penetrationTarget = data.penetrationTarget ?? 104;
        this.dealerHand = Array.isArray(data.dealerHand) ? [...data.dealerHand] : [];
        this.dealerHoleCardRevealed = !!data.dealerHoleCardRevealed;
        this.seats = this.seats.map((seat, i) => {
            const s = new CasinoSeat(seat.seatIndex);
            s.deserialize(data.seats?.[i] || {});
            return s;
        });
        this.currentSeatIndex = data.currentSeatIndex ?? -1;
        this.burnCard = data.burnCard;
        this.createdAt = data.createdAt || Date.now();
        this.lastActivityAt = data.lastActivityAt || Date.now();
        this.minBet = data.minBet ?? 100;
        this.maxBet = data.maxBet ?? 100000;
        this.hostPlayerId = data.hostPlayerId || null;
    }
}

/**
 * Get blackjack card value for rank.
 * @param {string} rank - 'A' | '2'-'10' | 'J' | 'Q' | 'K'
 * @returns {number}
 */
function getBlackjackCardValue(rank) {
    if (rank === 'A') return 11;
    if (['K', 'Q', 'J'].includes(rank)) return 10;
    return parseInt(rank);
}

/**
 * Check if hand is soft (contains an Ace counted as 11 without busting).
 * @param {Array} hand - Array of card objects
 * @returns {boolean}
 */
function isSoftHand(hand) {
    const nonAceSum = hand.filter(c => c.rank !== 'A').reduce((sum, c) => sum + c.value, 0);
    const aceCount = hand.filter(c => c.rank === 'A').length;
    if (aceCount === 0) return false;
    // At least one ace counted as 11 without busting
    return nonAceSum + 11 + (aceCount - 1) * 1 <= 21;
}

/**
 * Fisher-Yates shuffle using crypto.randomInt.
 * @param {Array} array
 * @returns {Array} Shuffled array
 */
function shuffleShoe(array) {
    const crypto = require('crypto');
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CasinoTable, getBlackjackCardValue, isSoftHand, shuffleShoe };
}
if (typeof window !== 'undefined') {
  window.CasinoTable = CasinoTable;
}
