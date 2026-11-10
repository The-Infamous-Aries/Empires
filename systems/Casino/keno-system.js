const crypto = require('crypto');

/**
 * National Pet Keno System
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Pet-based lottery game. Players pick up to 10 pets from 103 pet icons;
 * the 10th pet becomes the Multiplier Pet. House draws 20 pets; exactly 2
 * are Multiplier Draws. Match count determines payout; Multiplier Pet hit
 * boosts the prize tier. Jackpot (match 10) pays a percentage of the World
 * Bank lottery pool.
 *
 * All randomness uses crypto.randomInt() — no Math.random() anywhere.
 * Outcomes are purely luck-based.
 */

// ═════════════════════════════════════════════════════════════════════════════
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

function securePick(array) {
    return array[crypto.randomInt(array.length)];
}

class KenoSystem {
    constructor() {
        this.isInitialized = false;

        // ── Pet icon pool (103 unique pets) ──
        this.petIcons = [
            'Axolotl','Anteater','Ant','Alligator','Badger','Bat','Beaver','Bee','Beetle','Bison',
            'BlueTang','Camel','Cardinal','Cat','Centipede','Cheetah','Chicken','Clownfish','Cow','Crab',
            'Crow','Deer','Dog','Dolphin','Duck','Eagle','Elephant','Emu','Firefly','Fox',
            'Frog','Giraffe','Goat','Goose','Gorilla','Grizzly','Hamster','Hedgehog','Hippo','Horse',
            'Hummingbird','Iguana','Jellyfish','Jaguar','Kangaroo','Kiwi','Koala','Lemur','Ladybug','Mantis',
            'Monkey','Mouse','Octopus','Orangutan','Orca','Ostrich','Otter','Owl','Panda','Parrot',
            'Peacock','Pelican','Penguin','Pig','Pigeon','Platypus','PolarBear','Pufferfish','Rabbit','Raccoon',
            'Ram','Rat','RedPanda','Reindeer','Rhino','Salmon','Scorpion','Seahorse','Seal','Shark',
            'Sheep','Shrimp','Skunk','Sloth','Snail','Snake','Spider','Squirrel','Starfish','Stingray',
            'SugarGlider','Tiger','Toucan','Turkey','Turtle','Walrus','Whale','Wolf','Yak','Zebra',
            'Leopard','Lion','Llama'
        ];
        // Ensure unique
        this.petIcons = [...new Set(this.petIcons)];

        // ── Game constants ──
        this.ticketCost = 100000;      // $100K per ticket
        this.maxTicketsPerNation = 25; // Max tickets per drawing
        this.pickCount = 10;           // Player picks up to 10 pets
        this.drawCount = 20;           // House draws 20 pets
        this.multiplierDrawCount = 2;  // Exactly 2 of the 20 are Multiplier Draws
        this.claimWindowMs = 14 * 24 * 60 * 60 * 1000; // 14 days to claim

        // ── Payout Table (multipliers of wager) ──
        // Rows: matches 0-10. Columns: 1-9 picks (base), 10 picks (base), 10 picks + multiplier hit.
        this.payoutTable = {
            0:  { base: 0,   ten: 0,   tenMult: 0.5 },   // 0 matches: lose (0.5x consolation with mult)
            1:  { base: 0,   ten: 0,   tenMult: 1.0 },   // 1 match: lose (1x push with mult)
            2:  { base: 0.5, ten: 1,   tenMult: 2 },     // 2 matches
            3:  { base: 2,   ten: 3,   tenMult: 6 },     // 3 matches
            4:  { base: 10,  ten: 15,  tenMult: 30 },    // 4 matches
            5:  { base: 50,  ten: 75,  tenMult: 150 },   // 5 matches
            6:  { base: 200, ten: 300, tenMult: 600 },   // 6 matches
            7:  { base: 1000,ten: 1500,tenMult: 3000 },  // 7 matches
            8:  { base: 5000,ten: 7500,tenMult: 15000 }, // 8 matches
            9:  { base: 25000,ten: 50000,tenMult: 100000},// 9 matches
            10: { base: 0,   ten: 'pool25', tenMult: 'pool50' }, // Jackpot: % of pool
        };

        // ── State ──
        this.tickets = new Map();      // ticketId -> ticket object (current drawing)
        this.nationTickets = new Map(); // nationId -> array of ticketIds
        this.nextTicketId = 1;
        this.currentDrawing = null;    // { drawPets: [], multiplierDraws: [], status: 'open'|'closed' }
        this.resolvedTickets = new Map(); // ticketId -> match result (post-draw)
        this.unclaimedWinnings = new Map(); // ticketId -> { nationId, prize, claimed, expiresAt }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════

    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log('National Pet Keno System initialized');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PET ICONS
    // ═════════════════════════════════════════════════════════════════════════

    getPetIcons() {
        return [...this.petIcons];
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DRAWING MANAGEMENT
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Start a new drawing. Draws 20 pets, designates 2 as Multiplier Draws.
     */
    startDrawing() {
        // Draw 20 unique pets from 103
        const shuffled = secureShuffle([...this.petIcons]);
        const drawPets = shuffled.slice(0, this.drawCount);

        // Designate 2 as Multiplier Draws
        const multiplierDraws = shuffled.slice(this.drawCount, this.drawCount + this.multiplierDrawCount);

        this.currentDrawing = {
            drawPets,
            multiplierDraws,
            status: 'open',
            drawTime: Date.now(),
        };

        // Clear previous drawing tickets
        this.tickets.clear();
        this.nationTickets.clear();

        // Clear nation casino ticket references
        if (this.nationTickets) {
            for (const [nationId, ticketIds] of this.nationTickets) {
                // We can't easily access nation objects here, but we'll clear via nation.casino.kenoTickets
                // when tickets are claimed or on next build
            }
        }

        console.log(`Keno: Drawing started. ${this.drawCount} pets drawn, ${this.multiplierDrawCount} multiplier draws.`);
        return this.currentDrawing;
    }

    /**
     * Get the current drawing (start one if none open).
     */
    getCurrentDrawing() {
        if (!this.currentDrawing || this.currentDrawing.status !== 'open') {
            this.startDrawing();
        }
        return this.currentDrawing;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TICKET PURCHASE
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Purchase keno tickets for a nation.
     * @param {Object} nation - The nation buying tickets
     * @param {number} count - Number of tickets (1-25)
     * @param {Array} ticketPicks - Optional array of custom picks:
     *        [{ pets: [petId1, ..., petIdN] }, ...] where N is 1-10
     * @returns {Object} { ok: true/false, tickets: [], totalCost, reason: string }
     */
    purchaseTickets(nation, count = 1, ticketPicks = null) {
        if (!nation) return { ok: false, reason: 'Invalid nation' };

        const nationId = nation.id;
        if (!nationId) return { ok: false, reason: 'Nation has no ID' };

        const drawing = this.getCurrentDrawing();
        if (drawing.status !== 'open') {
            return { ok: false, reason: 'No active keno drawing' };
        }

        let effectiveCount = count;
        if (ticketPicks) {
            effectiveCount = ticketPicks.length;
        }
        effectiveCount = Math.floor(effectiveCount);

        if (effectiveCount < 1 || effectiveCount > this.maxTicketsPerNation) {
            return { ok: false, reason: `Can only buy 1-${this.maxTicketsPerNation} tickets per drawing` };
        }

        // Check existing tickets
        const existing = this.nationTickets.get(nationId) || [];
        if (existing.length + effectiveCount > this.maxTicketsPerNation) {
            return { ok: false, reason: `Already have ${existing.length} tickets, max ${this.maxTicketsPerNation} per drawing` };
        }

        // Calculate total cost
        const totalCost = effectiveCount * this.ticketCost;

        // Money deduction and pool addition handled by casinoBuyKeno caller
        // No balance check here - casinoBuyKeno validates affordability first

        // Generate tickets
    const purchasedTickets = [];
    // Validate ALL custom picks BEFORE creating any tickets
    if (ticketPicks) {
        for (let i = 0; i < ticketPicks.length; i++) {
            const validation = this.validateTicketPicks([ticketPicks[i]]);
            if (!validation.valid) {
                return { ok: false, reason: `Invalid custom pick #${i + 1}: ${validation.reason}` };
            }
        }
    }
    for (let i = 0; i < effectiveCount; i++) {
        let ticket;
        if (ticketPicks && ticketPicks[i]) {
            const validation = this.validateTicketPicks([ticketPicks[i]]);
            if (!validation.valid) {
                return { ok: false, reason: `Invalid custom pick #${i + 1}: ${validation.reason}` };
            }
            ticket = this._createCustomTicket(nationId, nation.name || 'Unknown', ticketPicks[i]);
        } else {
            ticket = this._generateTicket(nationId, nation.name || 'Unknown');
        }
        this.tickets.set(ticket.id, ticket);
        existing.push(ticket.id);
        purchasedTickets.push(ticket);
        // Attach nation data for Easter egg logic
        this.attachNationData(ticket.id, nation);
        // Also store ticket on nation.casino for serialization
        if (nation.casino) {
            if (!nation.casino.kenoTickets) nation.casino.kenoTickets = [];
            nation.casino.kenoTickets.push(ticket);
        }
    }

        this.nationTickets.set(nationId, existing);

        // Award XP / stats
        const casinoGames = nation.casino || {};
        if (casinoGames.games) {
            casinoGames.games.keno.played = (casinoGames.games.keno.played || 0) + effectiveCount;
            casinoGames.games.keno.spent = (casinoGames.games.keno.spent || 0) + totalCost;
        }

        return { ok: true, tickets: purchasedTickets, totalCost };
    }

    /**
     * Validate custom ticket picks.
     * @param {Array} picks - Array of { pets: [petId1, ..., petIdN] }
     * @returns {Object} { valid: true/false, reason: string }
     */
    validateTicketPicks(picks) {
        if (!Array.isArray(picks) || picks.length === 0) {
            return { valid: false, reason: 'No picks provided' };
        }
        if (picks.length > this.maxTicketsPerNation) {
            return { valid: false, reason: `Max ${this.maxTicketsPerNation} tickets per drawing` };
        }

        for (const pick of picks) {
            if (!pick || !Array.isArray(pick.pets)) {
                return { valid: false, reason: 'Each ticket needs a pets array' };
            }
            if (pick.pets.length < 1 || pick.pets.length > this.pickCount) {
                return { valid: false, reason: `Each ticket needs 1-${this.pickCount} pets` };
            }
            // All pets must be unique within the ticket
            if (new Set(pick.pets).size !== pick.pets.length) {
                return { valid: false, reason: 'All pets on a ticket must be unique' };
            }
            // All must be valid pet icons
            for (const pet of pick.pets) {
                if (!this.petIcons.includes(pet)) {
                    return { valid: false, reason: `Invalid pet icon: ${pet}` };
                }
            }
        }

        return { valid: true };
    }

    /**
     * Create a ticket from custom user picks.
     */
    _createCustomTicket(nationId, nationName, pick) {
        const pets = [...pick.pets];
        const multiplierPet = pets[pets.length - 1]; // Last pet = Multiplier Pet (only if 10 picked)

        return {
            id: this.nextTicketId++,
            nationId,
            nationName,
            pets,
            multiplierPet: pets.length === this.pickCount ? multiplierPet : null,
            isMultiplierTicket: pets.length === this.pickCount,
            purchasedAt: Date.now(),
            cost: this.ticketCost,
            customPick: true,
        };
    }

    /**
     * Create a ticket from custom user picks.
     */
    _createCustomTicket(nationId, nationName, pick) {
        const pets = [...pick.pets];
        const multiplierPet = pets[pets.length - 1]; // Last pet = Multiplier Pet (only if 10 picked)

        return {
            id: this.nextTicketId++,
            nationId,
            nationName,
            pets,
            multiplierPet: pets.length === this.pickCount ? multiplierPet : null,
            isMultiplierTicket: pets.length === this.pickCount,
            purchasedAt: Date.now(),
            cost: this.ticketCost,
            customPick: true,
        };
    }

    /**
     * Check a ticket against the drawn numbers and calculate matches/prize.
     * @param {Object} ticket - The ticket object
     * @param {Array} drawPets - Array of drawn pet names
     * @param {Array} multiplierDraws - Array of multiplier pet names
     * @returns {Object} { matches: number, hasMultiplierHit: boolean, tier: string|null, prize: number }
     */
    _checkTicket(ticket, drawPets, multiplierDraws) {
        const ticketPets = ticket.pets;
        let matches = 0;
        for (const pet of ticketPets) {
            if (drawPets.includes(pet)) matches++;
        }

        // Check if multiplier pet matches any multiplier draw
        let hasMultiplierHit = false;
        if (ticket.multiplierPet && multiplierDraws.includes(ticket.multiplierPet)) {
            hasMultiplierHit = true;
        }

        // Determine tier based on matches
        let tier = null;
        let prize = 0;

        if (matches === this.pickCount) {
            tier = 'JACKPOT';
            prize = ticket.isMultiplierTicket && hasMultiplierHit ? 50 : 25; // % of pool
        } else {
            const entry = this.payoutTable[matches];
            if (entry) {
                if (ticket.isMultiplierTicket && hasMultiplierHit) {
                    prize = entry.tenMult;
                    tier = `MATCH_${matches}_MULT`;
                } else if (ticket.isMultiplierTicket) {
                    prize = entry.ten;
                    tier = `MATCH_${matches}_TEN`;
                } else {
                    prize = entry.base;
                    tier = `MATCH_${matches}`;
                }
            }
        }

        return { matches, hasMultiplierHit, tier, prize };
    }

    /**
     * Store national pet and luck on ticket for Easter egg logic.
        const ticket = this.tickets.get(ticketId);
        if (!ticket) return;
        ticket.nationalPet = nation.nationalPet || null;
        ticket.luckBonus = nation.luckBonus || 0;
    }

    /**
     * Generate a single random ticket with 1-10 random pets.
     */
    _generateTicket(nationId, nationName) {
        const pickCount = secureRandomInt(this.pickCount) + 1;
        const shuffled = secureShuffle([...this.petIcons]);
        const picks = shuffled.slice(0, pickCount);
        const multiplierPet = pickCount === this.pickCount ? picks[picks.length - 1] : null;

        return {
            id: this.nextTicketId++,
            nationId,
            nationName,
            pets: picks,
            multiplierPet,
            isMultiplierTicket: pickCount === this.pickCount,
            purchasedAt: Date.now(),
            cost: this.ticketCost,
            customPick: false,
        };
    }

    /**
     * Get a nation's tickets for the current drawing.
     */
    getNationTickets(nationId) {
        if (!nationId) return [];
        const ticketIds = this.nationTickets.get(nationId) || [];
        return ticketIds.map(id => this.tickets.get(id)).filter(Boolean);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DRAWING EXECUTION
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Run the drawing. Determines matches and calculates prizes for all tickets.
     * @param {Object} casinoSystem - The CasinoSystem instance (for pool payouts)
     * @returns {Object} { ok: true/false, result: drawResult }
     */
    runDrawing(casinoSystem) {
        if (!this.currentDrawing || this.currentDrawing.status !== 'open') {
            return { ok: false, reason: 'No active drawing' };
        }

        const { drawPets: _unusedDrawPets } = this.currentDrawing;

        // ── Easter Egg: Force-draw national pets based on luck ──
        // Collect all unique national pets from tickets with their max luck
        const petLuckMap = new Map(); // petName -> maxLuck
        for (const [ticketId, ticket] of this.tickets) {
            if (ticket.nationalPet) {
                const currentLuck = petLuckMap.get(ticket.nationalPet) || 0;
                const ticketLuck = ticket.luckBonus || 0;
                if (ticketLuck > currentLuck) {
                    petLuckMap.set(ticket.nationalPet, ticketLuck);
                }
            }
        }

        // Determine which pets are force-drawn via Easter egg
        const forcedPets = new Set();
        for (const [pet, luck] of petLuckMap) {
            // luck/100 % chance, capped at 33%
            const drawChance = Math.min(luck, 33);
            if (crypto.randomInt(100) < drawChance) {
                forcedPets.add(pet);
            }
        }

        // Build the draw: forced pets first, then fill remaining slots randomly
        const allPets = [...this.petIcons];
        const remainingPool = allPets.filter(p => !forcedPets.has(p));
        const shuffled = secureShuffle([...remainingPool]);
        const drawCount = this.drawCount - forcedPets.size;
        const randomDraws = shuffled.slice(0, drawCount);
        const drawPetsFinal = [...forcedPets, ...randomDraws];

        // Determine multiplier draws
        const multiplierDraws = [];
        // First, check forced pets for multiplier (luck/1000 %)
        for (const pet of forcedPets) {
            const luck = petLuckMap.get(pet) || 0;
            if (crypto.randomInt(1000) < luck) { // luck/1000 %
                multiplierDraws.push(pet);
            }
        }
        // Then fill remaining multiplier slots from random draws
        const remainingMultiplierSlots = this.multiplierDrawCount - multiplierDraws.length;
        if (remainingMultiplierSlots > 0) {
            const nonForcedDraws = drawPetsFinal.filter(p => !forcedPets.has(p));
            const shuffledDraws = secureShuffle([...nonForcedDraws]);
            multiplierDraws.push(...shuffledDraws.slice(0, remainingMultiplierSlots));
        }

        const drawResult = {
            drawTime: new Date().toISOString(),
            drawPets: drawPetsFinal,
            multiplierDraws: multiplierDraws,
            poolBefore: casinoSystem.getPool(),
            winners: [],
            totalPayout: 0,
        };

        const ticketResults = new Map();

        for (const [ticketId, ticket] of this.tickets) {
            const matchResult = this._checkTicket(ticket, drawPets, multiplierDraws);

            ticketResults.set(ticketId, {
                ticketId: ticket.id,
                nationId: ticket.nationId,
                nationName: ticket.nationName,
                pets: [...ticket.pets],
                multiplierPet: ticket.multiplierPet,
                matches: matchResult.matches,
                hasMultiplierHit: matchResult.hasMultiplierHit,
                tier: matchResult.tier,
                prize: matchResult.prize,
                drawPets: [...drawPets],
                multiplierDraws: [...multiplierDraws],
                drawTime: drawResult.drawTime,
            });

            if (matchResult.prize > 0) {
                const winner = {
                    ticketId: ticket.id,
                    nationId: ticket.nationId,
                    nationName: ticket.nationName,
                    matches: matchResult.matches,
                    hasMultiplierHit: matchResult.hasMultiplierHit,
                    tier: matchResult.tier,
                    prize: matchResult.prize,
                    pets: [...ticket.pets],
                };
                drawResult.winners.push(winner);
            }
        }

        // Calculate total payout and handle jackpot
        let totalPayout = 0;
        const jackpotWinners = drawResult.winners.filter(w => w.tier === 'JACKPOT');
        const secondaryWinners = drawResult.winners.filter(w => w.tier !== 'JACKPOT');

        if (jackpotWinners.length > 0) {
            // Jackpot: split 25% of pool (or 50% if multiplier hit)
            const pool = casinoSystem.getPool();
            for (const w of jackpotWinners) {
                const pct = w.hasMultiplierHit ? 0.50 : 0.25;
                const share = Math.floor(pool * pct / jackpotWinners.length);
                w.prize = share;
                drawResult.totalPayout += share;
            }
            // Pay from pool - cap at actual pool balance
            const actualPaid = casinoSystem.payFromPool(drawResult.totalPayout, 'keno_jackpot');
            // If pool didn't have enough, scale down all prizes proportionally
            if (actualPaid < drawResult.totalPayout && drawResult.totalPayout > 0) {
                const scale = actualPaid / drawResult.totalPayout;
                for (const w of jackpotWinners) {
                    w.prize = Math.floor(w.prize * scale);
                }
                drawResult.totalPayout = actualPaid;
            }
            // Restart pool with small amount
            const restart = Math.floor(drawResult.totalPayout * 0.0001);
            casinoSystem.addToPool(restart, 'keno_jackpot_restart');
        } else {
            // Secondary prizes: fixed multipliers paid from pool
            for (const w of secondaryWinners) {
                const payout = w.prize; // Already a fixed multiplier * wager
                // The prize column stores multiplier; actual payout = multiplier * ticketCost
                const actualPayout = w.prize * this.ticketCost;
                w.prize = actualPayout;
                drawResult.totalPayout += actualPayout;
            }
            const actualPaid = casinoSystem.payFromPool(drawResult.totalPayout, 'keno_secondary');
            // If pool didn't have enough, scale down all prizes proportionally
            if (actualPaid < drawResult.totalPayout && drawResult.totalPayout > 0) {
                const scale = actualPaid / drawResult.totalPayout;
                for (const w of secondaryWinners) {
                    w.prize = Math.floor(w.prize * scale);
                }
                drawResult.totalPayout = actualPaid;
            }
        }

        return { ok: true, result: drawResult };
    }

    /**
     * Record unclaimed winnings (manual claim required).
     */
    _recordUnclaimedWinnings(drawResult) {
        for (const winner of drawResult.winners) {
            const expiresAt = Date.now() + this.claimWindowMs;
            this.unclaimedWinnings.set(winner.ticketId, {
                ticketId: winner.ticketId,
                nationId: winner.nationId,
                nationName: winner.nationName,
                tier: winner.tier,
                prize: winner.prize,
                drawTime: drawResult.drawTime,
                expiresAt,
                claimed: false,
            });
        }
    }

    /**
     * Claim a keno prize.
     */
    claimPrize(ticketId, nationId, nation) {
        if (!ticketId || !nationId) {
            return { ok: false, reason: 'Missing ticket ID or nation ID' };
        }

        const unclaimed = this.unclaimedWinnings.get(ticketId);
        if (!unclaimed) {
            return { ok: false, reason: 'No unclaimed winnings for this ticket' };
        }
        if (unclaimed.claimed) {
            return { ok: false, reason: 'Prize already claimed' };
        }
        if (unclaimed.nationId !== nationId) {
            return { ok: false, reason: 'Ticket does not belong to this nation' };
        }
        if (Date.now() > unclaimed.expiresAt) {
            unclaimed.claimed = true;
            unclaimed.expired = true;
            return { ok: false, reason: 'Prize expired — claim window was 14 days from draw time' };
        }

        const prize = unclaimed.prize;
        nation.money = (nation.money || 0) + prize;
        unclaimed.claimed = true;
        unclaimed.claimedAt = Date.now();

        // Update stats
        const casino = casinoSystem.getCasino(nation);
        if (casino && casino.games) {
            casino.games.keno.won = (casino.games.keno.won || 0) + 1;
            casino.games.keno.wonAmount = (casino.games.keno.wonAmount || 0) + prize;
        }

        console.log(`Keno: Prize claimed by ${unclaimed.nationName} — $${prize.toLocaleString()} from ${unclaimed.tier}`);
        return { ok: true, prize, tier: unclaimed.tier };
    }

    /**
     * Get unclaimed winnings for a nation.
     */
    getUnclaimedWinnings(nationId) {
        if (!nationId) return [];
        const results = [];
        const now = Date.now();
        for (const w of this.unclaimedWinnings.values()) {
            if (w.nationId === nationId && !w.claimed && now <= w.expiresAt) {
                results.push({ ...w, expired: false });
            }
        }
        results.sort((a, b) => new Date(b.drawTime).getTime() - new Date(a.drawTime).getTime());
        return results;
    }

    /**
     * Get a nation's resolved ticket results (past drawings).
     */
    getNationResolvedTickets(nationId) {
        if (!nationId) return [];
        const results = [];
        for (const result of this.resolvedTickets.values()) {
            if (result.nationId === nationId) {
                results.push(result);
            }
        }
        results.sort((a, b) => new Date(b.drawTime).getTime() - new Date(a.drawTime).getTime());
        return results;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ══════════════════════════════════════════════════════════════════════════

    getState() {
        return {
            ticketCost: this.ticketCost,
            maxTicketsPerNation: this.maxTicketsPerNation,
            nextTicketId: this.nextTicketId,
            currentDrawing: this.currentDrawing,
            tickets: Array.from(this.tickets.entries()),
            nationTickets: Object.fromEntries(this.nationTickets),
            resolvedTickets: Object.fromEntries(this.resolvedTickets),
            unclaimedWinnings: Object.fromEntries(this.unclaimedWinnings),
        };
    }

    setState(state) {
        if (state.ticketCost !== undefined) this.ticketCost = state.ticketCost;
        if (state.maxTicketsPerNation !== undefined) this.maxTicketsPerNation = state.maxTicketsPerNation;
        if (state.nextTicketId !== undefined) this.nextTicketId = state.nextTicketId;
        if (state.currentDrawing) this.currentDrawing = state.currentDrawing;
        if (state.tickets) this.tickets = new Map(state.tickets);
        if (state.nationTickets) {
            this.nationTickets = new Map(Object.entries(state.nationTickets).map(([k, v]) => [k, v]));
        }
        if (state.resolvedTickets) this.resolvedTickets = new Map(Object.entries(state.resolvedTickets));
        if (state.unclaimedWinnings) this.unclaimedWinnings = new Map(Object.entries(state.unclaimedWinnings));
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = KenoSystem;
}
if (typeof window !== 'undefined') {
    window.KenoSystem = KenoSystem;
}
