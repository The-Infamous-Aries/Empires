/**
 * Casino Dice Table — Gambler Dice Live Table Entity
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * A stateful, multiplayer craps-style dice table where 1-6 real users join
 * seats and place bets on a shared dice roll. Like the blackjack table, the
 * table persists in memory across multiple rounds (bet → roll → settle).
 */

const { randomUUID } = require('node:crypto');
const { CasinoDiceSeat } = require('./CasinoDiceSeat.js');

class CasinoDiceTable {
    constructor(options = {}) {
        this.tableId = options.tableId || `gd_${randomUUID()}`;
        this.status = 'waiting'; // waiting, betting, rolling, settling, closed
        this.dieSize = options.dieSize || 'd6';       // d4, d6, d8, d12, d20
        this.diceCount = options.diceCount || 2;      // 1-5 dice per roll
        this.shooterSeatIndex = options.shooterSeatIndex ?? -1;
        this.point = null;                            // Established point for pass/dont_pass
        this.pointEstablished = false;
        this.seats = [];                              // 6 CasinoDiceSeat instances
        this.currentSeatIndex = -1;                   // Whose turn to act
        this.jackpotPool = options.jackpotPool || 0;  // Progressive jackpot accumulation
        this.jackpotContributionPct = options.jackpotContributionPct ?? 0.10;
        this.minBet = options.minBet ?? 100;
        this.maxBet = options.maxBet ?? 100000;
        this.maxPayout = options.maxPayout ?? 10000;  // Cap on single-roll payout per player
        this.rakePct = options.rakePct ?? 0.05;       // House rake on P2P winnings
        this.createdAt = Date.now();
        this.lastActivityAt = Date.now();
        this.hostPlayerId = options.hostPlayerId || null;
        this.autoRoll = options.autoRoll ?? false;    // House rolls automatically after betting

        // Initialize 6 empty seats
        for (let i = 0; i < 6; i++) {
            this.seats.push(new CasinoDiceSeat(i));
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

    getBettingSeats() {
        return this.seats.filter(s => s.isBetting());
    }

    allSeatsBet() {
        const occupied = this.getOccupiedSeats();
        return occupied.length > 0 && occupied.every(s => s.hasBets());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHOOTER / POINT
    // ═══════════════════════════════════════════════════════════════════════════

    setShooter(seatIndex) {
        // Clear previous shooter
        for (const seat of this.seats) {
            seat.isShooter = false;
        }
        const seat = this.getSeat(seatIndex);
        if (seat) {
            seat.isShooter = true;
            this.shooterSeatIndex = seatIndex;
        }
        this.lastActivityAt = Date.now();
    }

    clearPoint() {
        this.point = null;
        this.pointEstablished = false;
    }

    setPoint(point) {
        this.point = point;
        this.pointEstablished = true;
        this.lastActivityAt = Date.now();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEAT OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    joinSeat(seatIndex, nationId, userId) {
        const seat = this.seats[seatIndex];
        if (!seat || !seat.isEmpty()) return false;
        seat.occupy(nationId, userId);
        this.lastActivityAt = Date.now();
        // Auto-assign shooter if none set
        if (this.shooterSeatIndex === -1) {
            this.setShooter(seatIndex);
        }
        return true;
    }

    leaveSeat(seatIndex) {
        const seat = this.seats[seatIndex];
        if (!seat || seat.isEmpty()) return false;
        // Cannot leave mid-round if has active bets
        if (seat.status === 'betting' || seat.status === 'rolled') {
            return false;
        }
        if (seat.isShooter) {
            seat.isShooter = false;
            this.shooterSeatIndex = -1;
            // Assign shooter to next occupied seat
            const next = this.getOccupiedSeats()[0];
            if (next) this.setShooter(next.seatIndex);
        }
        seat.vacate();
        this.lastActivityAt = Date.now();
        return true;
    }

    placeBet(seatIndex, bet) {
        const seat = this.seats[seatIndex];
        if (!seat || seat.isEmpty()) return { ok: false, reason: 'Seat is empty' };
        if (this.status !== 'betting') return { ok: false, reason: 'Table not in betting phase' };
        if (bet.amount < this.minBet || bet.amount > this.maxBet) {
            return { ok: false, reason: `Bet must be between ${this.minBet} and ${this.maxBet}` };
        }
        seat.addBet(bet);
        seat.status = 'betting';
        this.lastActivityAt = Date.now();
        return { ok: true };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ROLL STATE
    // ═══════════════════════════════════════════════════════════════════════════

    setRoll(faces, sum, metadata = {}) {
        this.lastRoll = {
            faces: Array.isArray(faces) ? [...faces] : [],
            sum,
            dieSize: this.dieSize,
            diceCount: this.diceCount,
            allSame: metadata.allSame || false,
            sameFace: metadata.sameFace || null,
            isNatural: metadata.isNatural || false,
            isCraps: metadata.isCraps || false,
            pointHit: metadata.pointHit || false,
            sevenOut: metadata.sevenOut || false,
            rolledAt: Date.now(),
        };
        this.lastActivityAt = Date.now();
    }

    getRoll() {
        return this.lastRoll || null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RESET FOR NEW ROUND
    // ═══════════════════════════════════════════════════════════════════════════

    resetForNewRound() {
        this.lastRoll = null;
        this.point = null;
        this.pointEstablished = false;
        this.currentSeatIndex = -1;
        this.status = 'waiting';
        this.lastActivityAt = Date.now();

        for (const seat of this.seats) {
            if (seat.isEmpty()) continue;
            seat.bets = [];
            seat.totalWagered = 0;
            seat.totalWon = 0;
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
            dieSize: this.dieSize,
            diceCount: this.diceCount,
            shooterSeatIndex: this.shooterSeatIndex,
            point: this.point,
            pointEstablished: this.pointEstablished,
            seats: this.seats.map(s => s.serialize()),
            currentSeatIndex: this.currentSeatIndex,
            jackpotPool: this.jackpotPool,
            jackpotContributionPct: this.jackpotContributionPct,
            minBet: this.minBet,
            maxBet: this.maxBet,
            maxPayout: this.maxPayout,
            rakePct: this.rakePct,
            createdAt: this.createdAt,
            lastActivityAt: this.lastActivityAt,
            hostPlayerId: this.hostPlayerId,
            autoRoll: this.autoRoll,
            lastRoll: this.lastRoll || null,
        };
    }

    deserialize(data) {
        this.tableId = data.tableId || this.tableId;
        this.status = data.status || 'waiting';
        this.dieSize = data.dieSize || 'd6';
        this.diceCount = data.diceCount || 2;
        this.shooterSeatIndex = data.shooterSeatIndex ?? -1;
        this.point = data.point || null;
        this.pointEstablished = !!data.pointEstablished;
        this.seats = this.seats.map((seat, i) => {
            const s = new CasinoDiceSeat(seat.seatIndex);
            s.deserialize(data.seats?.[i] || {});
            return s;
        });
        this.currentSeatIndex = data.currentSeatIndex ?? -1;
        this.jackpotPool = data.jackpotPool || 0;
        this.jackpotContributionPct = data.jackpotContributionPct ?? 0.10;
        this.minBet = data.minBet ?? 100;
        this.maxBet = data.maxBet ?? 100000;
        this.maxPayout = data.maxPayout ?? 10000;
        this.rakePct = data.rakePct ?? 0.05;
        this.createdAt = data.createdAt || Date.now();
        this.lastActivityAt = data.lastActivityAt || Date.now();
        this.hostPlayerId = data.hostPlayerId || null;
        this.autoRoll = !!data.autoRoll;
        this.lastRoll = data.lastRoll || null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CasinoDiceTable };
}
if (typeof window !== 'undefined') {
  window.CasinoDiceTable = CasinoDiceTable;
}
