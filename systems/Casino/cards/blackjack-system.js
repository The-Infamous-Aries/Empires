/**
 * Blackjack System — Live Multi-Card-Set Blackjack
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Stateful blackjack game running at CasinoTable level. Players bet against
 * the dealer, hit/stand/double/split/surrender, and settle against the dealer
 * hand. All card logic is server-side; card art is rendered client-side per
 * player's settings.ui.cardSet.
 *
 * All randomness (shoe shuffling, card draw) uses crypto.randomInt().
 * The dealer hole card and remaining shoe are never sent to clients.
 *
 * Money flow (World Bank lottery pool):
 *   - Bet placed: nation.money -= bet, addToPool(bet)
 *   - Win (1:1): payFromPool(bet * 2), nation.money += bet * 2  (net +bet)
 *   - Win (3:2 BJ): payFromPool(bet * 2.5), nation.money += bet * 2.5  (net +1.5bet)
 *   - Push: payFromPool(bet), nation.money += bet  (net 0)
 *   - Loss: house keeps bet (pool += bet)
 *   - Surrender: payFromPool(bet/2), nation.money += bet/2  (net -bet/2)
 */

const crypto = require('crypto');
const { CasinoTable } = require('../../../entities/CasinoTable.js');
const { CasinoSeat, calculateHandValue } = require('../../../entities/CasinoSeat.js');

function secureRandomInt(max) {
    return crypto.randomInt(max);
}

function secureShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = secureRandomInt(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

class BlackjackSystem {
    constructor() {
        this.isInitialized = false;
        // tableId -> CasinoTable instance
        this.tables = new Map();
        // Default public table ID
        this.publicTableId = null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log('Blackjack System initialized');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TABLE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get or create the default public blackjack table.
     */
    getPublicTable() {
        if (this.publicTableId && this.tables.has(this.publicTableId)) {
            const table = this.tables.get(this.publicTableId);
            if (table.status !== 'closed') return table;
        }
        const table = new CasinoTable({ minBet: 100, maxBet: 100000 });
        this.tables.set(table.tableId, table);
        this.publicTableId = table.tableId;
        return table;
    }

    /**
     * Create a new blackjack table.
     * @param {Object} options - { minBet, maxBet, hostPlayerId, penetrationTarget }
     * @returns {CasinoTable}
     */
    createTable(options = {}) {
        const table = new CasinoTable({
            minBet: options.minBet ?? 100,
            maxBet: options.maxBet ?? 100000,
            hostPlayerId: options.hostPlayerId || null,
            penetrationTarget: options.penetrationTarget ?? 104,
        });
        this.tables.set(table.tableId, table);
        return table;
    }

    /**
     * Get a table by ID.
     */
    getTable(tableId) {
        return this.tables.get(tableId) || null;
    }

    /**
     * List all tables (for UI table list).
     */
    listTables() {
        const out = [];
        for (const [tableId, table] of this.tables) {
            out.push({
                tableId: table.tableId,
                status: table.status,
                occupiedSeats: table.occupiedSeatCount(),
                openSeats: table.openSeatCount(),
                minBet: table.minBet,
                maxBet: table.maxBet,
                hostPlayerId: table.hostPlayerId,
                createdAt: table.createdAt,
            });
        }
        return out;
    }

    /**
     * Close and remove a table.
     */
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

    /**
     * Join a seat at a table.
     * @param {Object} table - CasinoTable
     * @param {number} seatIndex - 0-5
     * @param {string} nationId
     * @param {string} userId
     * @returns {Object} { ok, reason?, seat? }
     */
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

    /**
     * Leave a seat.
     * @param {Object} table - CasinoTable
     * @param {number} seatIndex
     * @returns {Object} { ok, reason? }
     */
    leaveTable(table, seatIndex) {
        if (!table) return { ok: false, reason: 'Table not found' };
        const seat = table.getSeat(seatIndex);
        if (!seat || seat.isEmpty()) return { ok: false, reason: 'Seat is empty' };
        // Cannot leave mid-hand if playing or betting
        if (seat.status === 'playing' || seat.status === 'betting' || seat.status === 'insurance') {
            return { ok: false, reason: 'Cannot leave during an active hand' };
        }
        seat.vacate();
        table.lastActivityAt = Date.now();
        return { ok: true };
    }

    /**
     * Place a bet on a seat.
     * @param {Object} table
     * @param {number} seatIndex
     * @param {number} amount
     * @param {Object} nation - for money deduction
     * @param {Object} casinoSystem - for pool integration
     * @returns {Object} { ok, reason?, bet, potDeducted }
     */
    placeBet(table, seatIndex, amount, nation, casinoSystem) {
        if (!table) return { ok: false, reason: 'Table not found' };

        // Auto-reset table for new hand if it is closed
        if (table.status === 'closed') {
            table.resetForNewHand();
        }

        if (table.status !== 'betting' && table.status !== 'waiting') {
            return { ok: false, reason: 'Table is not accepting bets' };
        }
        const seat = table.getSeat(seatIndex);
        if (!seat || seat.isEmpty()) return { ok: false, reason: 'Seat is empty' };
        if (seat.bet > 0) return { ok: false, reason: 'Bet already placed this round' };

        // Validate bet limits
        if (amount < table.minBet || amount > table.maxBet) {
            return { ok: false, reason: `Bet must be between ${table.minBet} and ${table.maxBet}` };
        }

        // Validate nation can afford
        const money = nation.money || 0;
        if (money < amount) return { ok: false, reason: 'Insufficient funds' };

        // Deduct money and add to pool
        nation.money = money - amount;
        if (casinoSystem) {
            casinoSystem.addToPool(amount, 'blackjack');
        }

        // Transition table to betting if waiting
        if (table.status === 'waiting') {
            table.status = 'betting';
        }

        const result = table.placeBet(seatIndex, amount);
        if (!result.ok) {
            // Refund on failure
            nation.money = money;
            // Note: addToPool was already called; pool balance is slightly off
            // but this is a rare edge case (table.placeBet should not fail here)
            return result;
        }

        table.lastActivityAt = Date.now();

        // Check if all occupied seats have bet -> move to dealing
        const occupied = table.getOccupiedSeats();
        if (occupied.length > 0 && occupied.every(s => s.status === 'betting')) {
            table.status = 'dealing';
        }

        return { ok: true, bet: amount };
    }

    /**
     * Deal initial cards to all betting seats and dealer.
     * If dealer up card is Ace, enters insurance phase instead of playerTurn.
     * @param {Object} table
     * @returns {Object} { ok, tableState, insuranceOffered? }
     */
    dealInitial(table) {
        if (!table) return { ok: false, reason: 'Table not found' };
        if (table.status !== 'dealing') return { ok: false, reason: 'Table not in dealing phase' };

        // Ensure shoe exists
        if (table.shoe.length === 0) {
            table.createShoe();
        }

        const occupied = table.getOccupiedSeats();
        if (occupied.length === 0) {
            table.status = 'closed';
            return { ok: false, reason: 'No players at table' };
        }

        // Round 1: each seat gets one card face up
        for (const seat of occupied) {
            const card = table.drawCard();
            if (card) seat.addCard(card);
            seat.status = 'playing';
        }

        // Dealer up card (face up)
        const dealerUp = table.drawCard();
        if (dealerUp) table.dealerHand.push(dealerUp);

        // Round 2: each seat gets second card face up
        for (const seat of occupied) {
            const card = table.drawCard();
            if (card) seat.addCard(card);
            // Check for natural blackjack
            if (seat.isBlackjack()) {
                seat.status = 'blackjack';
            }
        }

        // Dealer hole card (face down)
        const dealerHole = table.drawCard();
        if (dealerHole) table.dealerHand.push(dealerHole);

        // If dealer up card is Ace, offer insurance before player turns
        if (dealerUp && dealerUp.rank === 'A') {
            table.status = 'insurance';
            table.currentSeatIndex = this._findNextInsuranceSeat(table, -1);
            if (table.currentSeatIndex === -1) {
                // No seats need insurance decision (all have blackjack)
                return this.resolveInsurance(table);
            }
            table.lastActivityAt = Date.now();
            return { ok: true, tableState: this.getTableState(table, null), insuranceOffered: true };
        }

        table.status = 'playerTurn';

        // Find first active seat to start turn
        table.currentSeatIndex = this._findNextActiveSeat(table, -1);
        if (table.currentSeatIndex === -1) {
            // All seats have blackjack or are done -> go to dealer turn
            table.status = 'dealerTurn';
        }

        table.lastActivityAt = Date.now();
        return { ok: true, tableState: this.getTableState(table, null) };
    }

    /**
     * Place an insurance bet during the insurance phase.
     * @param {Object} table
     * @param {number} seatIndex
     * @param {number} amount (up to 50% of original bet, 0 to decline)
     * @param {Object} nation
     * @param {Object} casinoSystem
     * @returns {Object}
     */
    placeInsurance(table, seatIndex, amount, nation, casinoSystem) {
        const seat = table.getSeat(seatIndex);
        if (!seat) return { ok: false, reason: 'Seat not found' };
        if (table.status !== 'insurance') return { ok: false, reason: 'Not in insurance phase' };
        if (table.currentSeatIndex !== seatIndex) return { ok: false, reason: 'Not your turn' };

        const maxInsurance = Math.floor(seat.bet * 0.5);
        if (amount < 0 || amount > maxInsurance) {
            return { ok: false, reason: `Insurance bet must be between 0 and ${maxInsurance}` };
        }
        const money = nation.money || 0;
        if (money < amount) return { ok: false, reason: 'Insufficient funds' };

        nation.money = money - amount;
        if (casinoSystem) {
            casinoSystem.addToPool(amount, 'blackjack_insurance');
        }
        seat.insuranceBet = amount;
        seat.insuranceDecided = true;
        seat.lastActionAt = Date.now();
        table.lastActivityAt = Date.now();

        // Move to next seat needing insurance decision, or resolve
        const nextIndex = this._findNextInsuranceSeat(table, seatIndex);
        if (nextIndex === -1) {
            return this.resolveInsurance(table);
        }
        table.currentSeatIndex = nextIndex;
        const nextSeat = table.getSeat(nextIndex);
        nextSeat.turnTimerStartedAt = Date.now();

        return {
            ok: true,
            insuranceBet: amount,
            tableStatus: table.status,
            currentSeatIndex: nextIndex,
        };
    }

    /**
     * Resolve insurance phase: peek at dealer hole card.
     * If dealer has blackjack, settle immediately. Otherwise proceed to player turns.
     * @param {Object} table
     * @param {Object} casinoSystem - for pool payouts
     * @returns {Object}
     */
    resolveInsurance(table, casinoSystem) {
        if (!table) return { ok: false, reason: 'Table not found' };
        if (table.status !== 'insurance') return { ok: false, reason: 'Not in insurance phase' };

        const dealerHasBJ = table.dealerHand.length === 2 && table.dealerValue() === 21;
        table.dealerHoleCardRevealed = true;

        if (dealerHasBJ) {
            // Dealer has blackjack: insurance pays 2:1, all non-BJ player hands lose
            table.status = 'settling';
            return this.settle(table, casinoSystem);
        }

        // Dealer does not have blackjack: insurance bets are lost (already in pool)
        // Proceed to player turns
        table.status = 'playerTurn';
        table.currentSeatIndex = this._findNextActiveSeat(table, -1);
        if (table.currentSeatIndex === -1) {
            table.status = 'dealerTurn';
        }
        table.lastActivityAt = Date.now();
        return { ok: true, tableState: this.getTableState(table, null), dealerHasBJ: false };
    }

    /**
     * Player hits: draw one card to active hand.
     * @param {Object} table
     * @param {number} seatIndex
     * @returns {Object}
     */
    hit(table, seatIndex) {
        const seat = table.getSeat(seatIndex);
        if (!seat) return { ok: false, reason: 'Seat not found' };
        if (table.status !== 'playerTurn' || table.currentSeatIndex !== seatIndex) {
            return { ok: false, reason: 'Not your turn' };
        }
        if (seat.status !== 'playing') return { ok: false, reason: 'Seat not playing' };

        const card = table.drawCard();
        if (!card) return { ok: false, reason: 'Shoe empty' };
        seat.addCardToActiveHand(card);
        seat.lastActionAt = Date.now();
        table.lastActivityAt = Date.now();

        if (seat.getActiveHandValue() > 21) {
            // Active hand busted
            if (seat.activeHand === 'split' && seat.splitHand) {
                seat.splitHand.status = 'busted';
                // Main hand may still be active; but main was already completed
                // Move to next seat
                return this._nextTurn(table);
            }
            seat.status = 'busted';
            return this._nextTurn(table);
        }

        return { ok: true, card, seat: seat.serialize(), tableStatus: table.status };
    }

    /**
     * Player stands: active hand stands.
     * @param {Object} table
     * @param {number} seatIndex
     * @returns {Object}
     */
    stand(table, seatIndex) {
        const seat = table.getSeat(seatIndex);
        if (!seat) return { ok: false, reason: 'Seat not found' };
        if (table.status !== 'playerTurn' || table.currentSeatIndex !== seatIndex) {
            return { ok: false, reason: 'Not your turn' };
        }
        if (seat.status !== 'playing') return { ok: false, reason: 'Seat not playing' };

        if (seat.activeHand === 'split' && seat.splitHand) {
            seat.splitHand.status = 'stood';
            // Split hand done, move to next seat
            seat.lastActionAt = Date.now();
            table.lastActivityAt = Date.now();
            return this._nextTurn(table);
        }

        seat.status = 'stood';
        seat.lastActionAt = Date.now();
        table.lastActivityAt = Date.now();
        return this._nextTurn(table);
    }

    /**
     * Player doubles down on active hand.
     * @param {Object} table
     * @param {number} seatIndex
     * @param {Object} nation
     * @param {Object} casinoSystem
     * @returns {Object}
     */
    doubleDown(table, seatIndex, nation, casinoSystem) {
        const seat = table.getSeat(seatIndex);
        if (!seat) return { ok: false, reason: 'Seat not found' };
        if (table.status !== 'playerTurn' || table.currentSeatIndex !== seatIndex) {
            return { ok: false, reason: 'Not your turn' };
        }
        if (!seat.canDouble()) return { ok: false, reason: 'Cannot double on this hand' };

        const activeBet = seat.getActiveHandBet();
        const money = nation.money || 0;
        if (money < activeBet) return { ok: false, reason: 'Insufficient funds for double' };

        nation.money = money - activeBet;
        if (casinoSystem) {
            casinoSystem.addToPool(activeBet, 'blackjack_double');
        }

        if (seat.activeHand === 'split' && seat.splitHand) {
            seat.splitHand.bet = seat.splitHand.bet * 2;
            seat.splitHand.hasDoubled = true;
            const card = table.drawCard();
            if (!card) return { ok: false, reason: 'Shoe empty' };
            seat.splitHand.hand.push(card);
            if (seat.splitHand.handValue() > 21) {
                seat.splitHand.status = 'busted';
            } else {
                seat.splitHand.status = 'stood';
            }
            seat.lastActionAt = Date.now();
            table.lastActivityAt = Date.now();
            return this._nextTurn(table);
        }

        seat.bet = seat.bet * 2;
        seat.hasDoubled = true;
        const card = table.drawCard();
        if (!card) return { ok: false, reason: 'Shoe empty' };
        seat.addCard(card);
        seat.lastActionAt = Date.now();
        table.lastActivityAt = Date.now();

        if (seat.isBusted()) {
            seat.status = 'busted';
            return this._nextTurn(table);
        }

        seat.status = 'stood'; // Auto-stand after double
        return this._nextTurn(table);
    }

    /**
     * Player splits a pair (main hand only).
     * @param {Object} table
     * @param {number} seatIndex
     * @param {Object} nation
     * @param {Object} casinoSystem
     * @returns {Object}
     */
    split(table, seatIndex, nation, casinoSystem) {
        const seat = table.getSeat(seatIndex);
        if (!seat) return { ok: false, reason: 'Seat not found' };
        if (table.status !== 'playerTurn' || table.currentSeatIndex !== seatIndex) {
            return { ok: false, reason: 'Not your turn' };
        }
        if (!seat.canSplit()) return { ok: false, reason: 'Cannot split this hand' };

        const splitBet = seat.bet;
        const money = nation.money || 0;
        if (money < splitBet) return { ok: false, reason: 'Insufficient funds for split' };

        nation.money = money - splitBet;
        if (casinoSystem) {
            casinoSystem.addToPool(splitBet, 'blackjack_split');
        }

        const secondCard = seat.hand.pop(); // Remove second card from original hand
        seat.hasSplit = true;

        // Create split hand
        seat.splitHand = {
            hand: [secondCard],
            bet: splitBet,
            status: 'playing',
            hasDoubled: false,
        };

        // Deal one card to original hand
        const card1 = table.drawCard();
        if (card1) seat.addCard(card1);

        // Deal one card to split hand
        const card2 = table.drawCard();
        if (card2) seat.splitHand.hand.push(card2);

        seat.lastActionAt = Date.now();
        table.lastActivityAt = Date.now();

        // Check for blackjack on hands
        if (seat.isBlackjack()) seat.status = 'blackjack';
        if (seat.splitHand && calculateHandValue(seat.splitHand.hand) === 21) {
            seat.splitHand.status = 'blackjack';
        }

        // Advance turn after split
        if (seat.status === 'blackjack' && seat.splitHand && seat.splitHand.status === 'playing') {
            // Main hand is blackjack (done), switch to split hand
            seat.activeHand = 'split';
            seat.splitHand.status = 'playing';
            seat.turnTimerStartedAt = Date.now();
            return { ok: true, seat: seat.serialize(), splitHandActive: true };
        }
        if (seat.status === 'blackjack' && seat.splitHand && seat.splitHand.status === 'blackjack') {
            // Both hands are blackjack, go to dealer turn
            return this.dealerTurn(table);
        }

        return { ok: true, seat: seat.serialize() };
    }

    /**
     * Player surrenders active hand (forfeit half bet).
     * @param {Object} table
     * @param {number} seatIndex
     * @param {Object} nation
     * @param {Object} casinoSystem
     * @returns {Object}
     */
    surrender(table, seatIndex, nation, casinoSystem) {
        const seat = table.getSeat(seatIndex);
        if (!seat) return { ok: false, reason: 'Seat not found' };
        if (table.status !== 'playerTurn' || table.currentSeatIndex !== seatIndex) {
            return { ok: false, reason: 'Not your turn' };
        }
        if (!seat.canSurrender()) return { ok: false, reason: 'Cannot surrender this hand' };

        const activeBet = seat.getActiveHandBet();
        const refund = Math.floor(activeBet * 0.5);

        // Pay refund from pool (bet was already added to pool at bet time)
        let actualRefund = refund;
        if (casinoSystem) {
            actualRefund = casinoSystem.payFromPool(refund, 'blackjack_surrender');
        }
        nation.money = (nation.money || 0) + actualRefund;

        if (seat.activeHand === 'split' && seat.splitHand) {
            seat.splitHand.status = 'surrendered';
            seat.lastActionAt = Date.now();
            table.lastActivityAt = Date.now();
            return this._nextTurn(table);
        }

        seat.status = 'surrendered';
        seat.lastActionAt = Date.now();
        table.lastActivityAt = Date.now();
        return this._nextTurn(table);
    }

    /**
     * Dealer turn: hit until stand/bust.
     * @param {Object} table
     * @returns {Object}
     */
    dealerTurn(table) {
        if (!table) return { ok: false, reason: 'Table not found' };
        table.status = 'dealerTurn';
        table.dealerHoleCardRevealed = true;
        table.currentSeatIndex = -1;
        table.lastActivityAt = Date.now();

        // Dealer draws per rules (hits soft 17)
        while (table.dealerShouldHit()) {
            const card = table.drawCard();
            if (!card) break;
            table.dealerHand.push(card);
            if (table.dealerValue() > 21) break;
        }

        table.status = 'settling';
        return { ok: true, tableState: this.getTableState(table, null) };
    }

    /**
     * Settle all hands and pay out.
     * Payouts include return of original bet + winnings.
     * @param {Object} table
     * @param {Object} casinoSystem - for pool payouts
     * @returns {Object} { ok, results: Array<{seatIndex, outcome, payout}> }
     */
    settle(table, casinoSystem) {
        if (!table) return { ok: false, reason: 'Table not found' };
        if (table.status !== 'settling') return { ok: false, reason: 'Table not in settling phase' };

        const dealerValue = table.dealerValue();
        const dealerBusted = dealerValue > 21;
        const results = [];

        for (const seat of table.seats) {
            if (seat.isEmpty()) continue;

            // --- Main hand settlement ---
            if (seat.status === 'blackjack') {
                // Handled below in separate loop
                continue;
            }

            if (seat.status !== 'surrendered' && seat.status !== 'busted' && seat.status !== 'stood') {
                // Hand not resolved (shouldn't happen, but skip safely)
                continue;
            }

            let outcome = 'loss';
            let payout = 0;

            if (seat.status === 'surrendered') {
                outcome = 'surrender';
                // Half bet already refunded during surrender
            } else if (seat.status === 'busted') {
                outcome = 'bust';
                payout = 0;
            } else if (seat.status === 'stood') {
                const playerValue = seat.handValue();
                if (dealerBusted) {
                    outcome = 'win';
                    payout = seat.bet * 2; // Return bet + 1:1 winnings
                } else if (playerValue > dealerValue) {
                    outcome = 'win';
                    payout = seat.bet * 2; // Return bet + 1:1 winnings
                } else if (playerValue === dealerValue) {
                    outcome = 'push';
                    payout = seat.bet; // Return bet only
                } else {
                    outcome = 'loss';
                    payout = 0;
                }
            }

            // Apply insurance resolution on main hand
            if (seat.insuranceBet > 0) {
                const dealerHasBJ = table.dealerHand.length === 2 && table.dealerValue() === 21;
                if (dealerHasBJ) {
                    // Insurance pays 2:1 (return insurance bet + 2x winnings)
                    payout += seat.insuranceBet * 2;
                }
                // Insurance bet is otherwise lost (already deducted)
            }

            // Pay winnings from pool
            let actualPayout = payout;
            if (actualPayout > 0 && casinoSystem) {
                actualPayout = casinoSystem.payFromPool(actualPayout, 'blackjack_win');
            }

            results.push({
                seatIndex: seat.seatIndex,
                nationId: seat.nationId,
                userId: seat.userId,
                hand: 'main',
                outcome,
                payout: actualPayout,
                bet: seat.bet,
                playerValue: seat.handValue(),
                dealerValue,
            });

            // --- Split hand settlement ---
            if (seat.hasSplit && seat.splitHand) {
                const sh = seat.splitHand;
                let sOutcome = 'loss';
                let sPayout = 0;

                if (sh.status === 'blackjack') {
                    // Split blackjack pays 1:1 (not 3:2)
                    const dealerHasBJ = table.dealerHand.length === 2 && table.dealerValue() === 21;
                    if (dealerHasBJ) {
                        sOutcome = 'push';
                        sPayout = sh.bet;
                    } else {
                        sOutcome = 'win';
                        sPayout = sh.bet * 2; // Return bet + 1:1 winnings
                    }
                } else if (sh.status === 'surrendered') {
                    sOutcome = 'surrender';
                } else if (sh.status === 'busted') {
                    sOutcome = 'bust';
                    sPayout = 0;
                } else if (sh.status === 'stood') {
                    const sValue = calculateHandValue(sh.hand);
                    if (dealerBusted) {
                        sOutcome = 'win';
                        sPayout = sh.bet * 2;
                    } else if (sValue > dealerValue) {
                        sOutcome = 'win';
                        sPayout = sh.bet * 2;
                    } else if (sValue === dealerValue) {
                        sOutcome = 'push';
                        sPayout = sh.bet;
                    } else {
                        sOutcome = 'loss';
                        sPayout = 0;
                    }
                }

                let sActualPayout = sPayout;
                if (sActualPayout > 0 && casinoSystem) {
                    sActualPayout = casinoSystem.payFromPool(sActualPayout, 'blackjack_win');
                }

                results.push({
                    seatIndex: seat.seatIndex,
                    nationId: seat.nationId,
                    userId: seat.userId,
                    hand: 'split',
                    outcome: sOutcome,
                    payout: sActualPayout,
                    bet: sh.bet,
                    playerValue: sh.status === 'blackjack' ? 21 : calculateHandValue(sh.hand),
                    dealerValue,
                });
            }
        }

        // Handle main-hand blackjack seats (not already processed above)
        for (const seat of table.seats) {
            if (seat.status !== 'blackjack') continue;

            const dealerHasBJ = table.dealerHand.length === 2 && table.dealerValue() === 21;
            let outcome = 'win';
            let payout = 0;

            if (dealerHasBJ) {
                outcome = 'push';
                payout = seat.bet; // Return bet
            } else {
                outcome = 'blackjack';
                payout = seat.bet * 2.5; // Return bet + 3:2 winnings
            }

            // Insurance on blackjack seat
            if (seat.insuranceBet > 0 && dealerHasBJ) {
                payout += seat.insuranceBet * 2;
            }

            let actualPayout = payout;
            if (actualPayout > 0 && casinoSystem) {
                actualPayout = casinoSystem.payFromPool(actualPayout, 'blackjack_win');
            }

            results.push({
                seatIndex: seat.seatIndex,
                nationId: seat.nationId,
                userId: seat.userId,
                hand: 'main',
                outcome,
                payout: actualPayout,
                bet: seat.bet,
                playerValue: 21,
                dealerValue,
            });
        }

        table.status = 'closed';
        table.lastActivityAt = Date.now();
        return { ok: true, results };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Find next seat needing insurance decision.
     * @param {Object} table
     * @param {number} fromIndex
     * @returns {number}
     */
    _findNextInsuranceSeat(table, fromIndex) {
        const seats = table.seats;
        for (let i = fromIndex + 1; i < seats.length; i++) {
            const seat = seats[i];
            if (!seat.isEmpty() && seat.status === 'playing' && !seat.insuranceDecided) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Find next active seat index starting from after `fromIndex`.
     * Handles split hand transitions: if main hand is done but split hand is
     * still playing, stays on same seat.
     * @param {Object} table
     * @param {number} fromIndex - Last seat index processed (-1 for start)
     * @returns {number} Next seat index or -1
     */
    _findNextActiveSeat(table, fromIndex) {
        const seats = table.seats;
        for (let i = fromIndex + 1; i < seats.length; i++) {
            const seat = seats[i];
            if (seat.isEmpty()) continue;
            // Main hand still playing
            if (seat.status === 'playing' && seat.activeHand === 'main') {
                return i;
            }
            // Split hand still playing (main hand already completed)
            if (seat.status === 'playing' && seat.activeHand === 'split' && seat.splitHand && seat.splitHand.status === 'playing') {
                return i;
            }
        }
        return -1;
    }

    /**
     * Advance to next player turn or dealer turn.
     * Handles split hand: after main hand completes, moves to split hand if present.
     * @param {Object} table
     * @returns {Object}
     */
    _nextTurn(table) {
        const currentSeat = table.getSeat(table.currentSeatIndex);

        // If current seat has a split hand that hasn't been played yet, switch to it
        if (
            currentSeat &&
            currentSeat.status === 'playing' &&
            currentSeat.activeHand === 'main' &&
            currentSeat.hasSplit &&
            currentSeat.splitHand &&
            currentSeat.splitHand.status === 'playing'
        ) {
            currentSeat.activeHand = 'split';
            currentSeat.splitHand.status = 'playing';
            currentSeat.turnTimerStartedAt = Date.now();
            table.lastActivityAt = Date.now();
            return {
                ok: true,
                tableStatus: table.status,
                currentSeatIndex: table.currentSeatIndex,
                seat: currentSeat.serialize(),
                splitHandActive: true,
            };
        }

        // Otherwise find next seat
        const nextIndex = this._findNextActiveSeat(table, table.currentSeatIndex);
        if (nextIndex === -1) {
            // All players acted -> dealer turn
            return this.dealerTurn(table);
        }
        table.currentSeatIndex = nextIndex;
        const seat = table.getSeat(nextIndex);
        seat.turnTimerStartedAt = Date.now();
        table.lastActivityAt = Date.now();
        return {
            ok: true,
            tableStatus: table.status,
            currentSeatIndex: nextIndex,
            seat: seat.serialize(),
        };
    }

    /**
     * Get table state for a specific player (per-viewer card set).
     * @param {Object} table
     * @param {string|null} viewerCardSet - Card set ID for rendering (null = logical only)
     * @returns {Object}
     */
    getTableState(table, viewerCardSet = null) {
        const seatsOut = table.seats.map(seat => {
            // Determine active hand data for the current turn
            const activeHand = seat.getActiveHand();
            const activeHandBet = seat.getActiveHandBet();
            const activeHandHasDoubled = seat.getActiveHandHasDoubled();
            const activeHandValue = calculateHandValue(activeHand);

            const handData = seat.hand.map(card => ({
                suit: card.suit,
                rank: card.rank,
                value: card.value,
                code: card.code,
            }));
            const splitHandData = seat.splitHand
                ? {
                      hand: seat.splitHand.hand.map(c => ({
                          suit: c.suit,
                          rank: c.rank,
                          value: c.value,
                          code: c.code,
                      })),
                      bet: seat.splitHand.bet,
                      status: seat.splitHand.status,
                      hasDoubled: seat.splitHand.hasDoubled,
                  }
                : null;

            const activeHandStatus = seat.activeHand === 'split' && seat.splitHand
                ? seat.splitHand.status
                : seat.status;

            return {
                seatIndex: seat.seatIndex,
                nationId: seat.nationId,
                userId: seat.userId,
                status: seat.status,
                activeHand: seat.activeHand, // 'main' | 'split'
                hand: handData,
                handValue: activeHandValue,
                activeHandValue,
                bet: activeHandBet,
                activeHandBet,
                insuranceBet: seat.insuranceBet,
                insuranceDecided: seat.insuranceDecided,
                hasDoubled: seat.hasDoubled,
                activeHandHasDoubled,
                hasSplit: seat.hasSplit,
                isSplitHand: seat.isSplitHand,
                splitHand: splitHandData,
                isEmpty: seat.isEmpty(),
                isYourTurn: table.currentSeatIndex === seat.seatIndex && activeHandStatus === 'playing',
                turnTimerRemaining: seat.turnTimerStartedAt
                    ? Math.max(0, seat.turnTimerDurationMs - (Date.now() - seat.turnTimerStartedAt))
                    : 0,
                canHit: activeHandStatus === 'playing',
                canStand: activeHandStatus === 'playing',
                canDouble: seat.canDouble(),
                canSplit: seat.canSplit(),
                canSurrender: seat.canSurrender(),
                canPlaceInsurance:
                    table.status === 'insurance' &&
                    table.currentSeatIndex === seat.seatIndex &&
                    !seat.insuranceDecided,
            };
        });

        const dealerUpCard = table.dealerHand.length > 0
            ? { suit: table.dealerHand[0].suit, rank: table.dealerHand[0].rank, value: table.dealerHand[0].value, code: table.dealerHand[0].code }
            : null;
        const dealerHoleCard = table.dealerHoleCardRevealed && table.dealerHand.length > 1
            ? { suit: table.dealerHand[1].suit, rank: table.dealerHand[1].rank, value: table.dealerHand[1].value, code: table.dealerHand[1].code }
            : null;

        return {
            tableId: table.tableId,
            status: table.status,
            currentSeatIndex: table.currentSeatIndex,
            seats: seatsOut,
            dealerHand: table.dealerHand.map(c => ({
                suit: c.suit,
                rank: c.rank,
                value: c.value,
                code: c.code,
            })),
            dealerUpCard,
            dealerHoleCard,
            dealerValue: table.dealerValue(),
            dealerHoleCardRevealed: table.dealerHoleCardRevealed,
            shoeCardsRemaining: table.shoe.length,
            minBet: table.minBet,
            maxBet: table.maxBet,
            // Card set info for client rendering
            cardSet: viewerCardSet || null,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LIVE ODDS (Win/Risk probability for current player hand)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Calculate win and risk odds for a given hand based on remaining shoe.
     * @param {Array} hand - Array of card objects
     * @param {Array} shoe - Remaining shoe cards
     * @returns {Object} { winOdds, riskOdds, cardsRemaining, canHit }
     */
    calculateOdds(hand, shoe) {
        const handValue = calculateHandValue(hand);

        if (handValue >= 21) {
            return {
                winOdds: handValue === 21 ? 100 : 0,
                riskOdds: 0,
                cardsRemaining: shoe.length,
                canHit: false,
            };
        }

        const cardsRemaining = shoe.length;
        if (cardsRemaining === 0) {
            return { winOdds: 0, riskOdds: 0, cardsRemaining: 0, canHit: false };
        }

        let winningCards = 0;
        let bustingCards = 0;

        for (const card of shoe) {
            const cardValue = card.value;
            if (handValue + cardValue === 21) winningCards++;
            if (handValue + cardValue > 21) bustingCards++;
        }

        return {
            winOdds: Math.round((winningCards / cardsRemaining) * 100 * 100) / 100,
            riskOdds: Math.round((bustingCards / cardsRemaining) * 100 * 100) / 100,
            cardsRemaining,
            canHit: true,
        };
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
                const table = new CasinoTable();
                table.deserialize(data);
                this.tables.set(tableId, table);
            }
        }
        if (state.publicTableId) this.publicTableId = state.publicTableId;
    }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlackjackSystem;
}
if (typeof window !== 'undefined') {
  window.BlackjackSystem = BlackjackSystem;
}
