/**
 * World Lottery System - Powerball-style drawing funded by World Bank
 * Dominion Wars - Nation Building Strategy Game
 *
 * Funding sources:
 *   - World Bank loan interest, bill interest, tax interest
 *   - World Bank territory tax revenue
 *   - Nation ticket sales ($100K per ticket, max 25 per nation per drawing)
 *
 * Drawing schedule:
 *   - 1 drawing per real-life week (Sunday-Saturday UTC)
 *   - Random day and random turn (hour) within that week
 *   - Cannot occur within 2 turns before day-end on Saturday or 2 turns after day-change on Sunday
 *
 * Gameplay:
 *   - Powerball-style using pet icons (103 unique pets)
 *   - Each ticket has 6 unique pet icons; the 6th is the multiplier
 *   - Prize tiers: 3, 3+M, 4, 4+M, 5, 5+M, Jackpot (6 matches)
 *   - Jackpot winner takes the full pool balance
 *   - Bank payouts raise World Bank interest rates (jackpot = skyrocket)
 */

// ── Pet icons (103 assets from assets/images/Pets/) ──
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
  'SugarGlider','Tiger','Toucan','Turkey','Turtle','Walrus','Walrus','Whale','Wolf','Yak','Zebra'
];

// Ensure exactly 103 unique entries (dedupe just in case)
const PET_ICONS_UNIQUE = [...new Set(PET_ICONS)];

const TICKET_COST = 100000;      // $100K per ticket
const MAX_TICKETS_PER_NATION = 25;
const TICKET_PICK_COUNT = 6;     // 6 pet icons per ticket

// Prize tier payout percentages of the pool
// Hierarchy: 3 < 4 < 3+M < 5 < 4+M < Jackpot
// Multiplier makes lower matches pay better than the next tier up without it.
// With a $500B pool and max $2.5M spend (25 tickets) per draw:
//   3 matches ~1 in 2,000   -> $25M   (barely covers a few tickets)
//   4 matches ~1 in 199K    -> $50M   (just above 3)
//   3 + M   ~1 in 199K      -> $75M   (barely above 4)
//   5 matches ~1 in 97.6M   -> $10B   (decent)
//   4 + M   ~1 in 19.3M     -> $20B   (decent, higher than 5)
//   Jackpot ~1 in 9.46B     -> full pool
const PRIZE_TIERS = {
  JACKPOT:      { matches: 5,  multiplier: true,  pct: 1.00 }, // full balance
  FOUR_PLUS_M:  { matches: 4,  multiplier: true,  pct: 0.04 }, // 4% = $20B
  FIVE:         { matches: 5,  multiplier: false, pct: 0.02 }, // 2% = $10B
  THREE_PLUS_M: { matches: 3,  multiplier: true,  pct: 0.00015 }, // 0.015% = $75M
  FOUR:         { matches: 4,  multiplier: false, pct: 0.0001 }, // 0.01% = $50M
  THREE:        { matches: 3,  multiplier: false, pct: 0.00005 } // 0.005% = $25M
};

// Restart pool with 0.01% of what was won on jackpot
const JACKPOT_RESTART_PCT = 0.0001;

// Rate impact caps
const RATE_IMPACT_MIN = 0.5;
const RATE_IMPACT_MAX = 3.0;

class WorldLotterySystem {
    constructor() {
        this.isInitialized = false;

        // ── Jackpot pool ──
        this.lotteryPool = 0;           // current jackpot balance
        this.totalTicketSales = 0;      // lifetime ticket sales
        this.totalBankContributions = 0; // lifetime bank contributions

        // ── Ticket tracking ──
        this.tickets = new Map();       // ticketId -> ticket object
        this.nationTickets = new Map(); // nationId -> array of ticketIds for current drawing
        this.nextTicketId = 1;

        // ── Drawing state ──
        this.currentDrawing = null;     // { weekStart, drawDay, drawHour, status: 'open'|'drawing'|'closed' }
        this.lastDrawingResult = null;  // { winningNumbers, multiplier, winners: [] }
        this.drawingsHistory = [];      // past drawing results

        // ── Resolved tickets (kept so users can check results after drawing) ──
        // ticketId -> { ticket, matches, hasMultiplierMatch, tier, prize, winningNumbers, drawTime }
        this.resolvedTickets = new Map();

        // ── Unclaimed winnings tracking ──
        // ticketId -> { nationId, prize, drawTime, claimed: boolean, expiresAt: number }
        this.unclaimedWinnings = new Map();

        // Prize claim window: 14 days from draw time
        this.CLAIM_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

        // ── National pet selections ──
        // nationId -> { petIcon: string } (cosmetic only)
        this.nationPets = new Map();

        // ── Rate impact tracking ──
        this.rateImpactMultiplier = 1.0; // applied to world bank rates after payouts
        this.lastPayoutAmount = 0;

        // Bind to day_passed for drawing checks
        this._onDayPassedBound = this._onDayPassed.bind(this);
    }

    // ═══════════════════════════════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ════════════════════════════════════════════════════════════════════════════════════════════════════════

    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        // Seed initial pool from bank contributions if any exist
        if (window.GlobalWorld && window.GlobalWorld.lotteryPool !== undefined) {
            this.lotteryPool = window.GlobalWorld.lotteryPool || 0;
        }

        // Bind to day_passed event
        if (typeof EventBus !== 'undefined') {
            EventBus.on('day_passed', this._onDayPassedBound);
        }

        console.log('World Lottery System initialized');
    }

    // ════════════════════════════════════════════════════════════════════════════════════════════════════════
    // PET ICONS & NATIONAL PETS
    // ════════════════════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Get all available pet icons for ticket generation and national pet selection.
     */
    getPetIcons() {
        return [...PET_ICONS_UNIQUE];
    }

    /**
     * Get a nation's selected pet (cosmetic only).
     */
    getNationPet(nationId) {
        if (!nationId) return null;
        const entry = this.nationPets.get(nationId);
        return entry ? entry.petIcon : null;
    }

    /**
     * Set a nation's pet (cosmetic only, no gameplay effect).
     */
    setNationPet(nationId, petIcon) {
        if (!nationId || !petIcon) return false;
        if (!PET_ICONS_UNIQUE.includes(petIcon)) return false;

        this.nationPets.set(nationId, { petIcon, setAt: Date.now() });

        // Persist on nation object too
        if (window.Nation && window.Nation.id === nationId) {
            window.Nation.nationalPet = petIcon;
        }

        return true;
    }

    // ════════════════════════════════════════════════════════════════════════════════════════════════════════
    // DRAWING SCHEDULE (UTC-based, 1 per real-life week)
    // ════════════════════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Get the start of the current real-life week (Sunday 00:00 UTC).
     */
    _getWeekStart(date = null) {
        const d = date || new Date();
        const utcDay = d.getUTCDay(); // 0 = Sunday, 6 = Saturday
        const utcHour = d.getUTCHours();
        const weekStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        weekStart.setUTCDate(weekStart.getUTCDate() - utcDay);
        weekStart.setUTCHours(0, 0, 0, 0);
        return weekStart;
    }

    /**
     * Get the end of the current real-life week (Saturday 23:59:59 UTC).
     */
    _getWeekEnd(date = null) {
        const weekStart = this._getWeekStart(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
        weekEnd.setUTCHours(23, 59, 59, 999);
        return weekEnd;
    }

    /**
     * Check if a given UTC date/time is in the restricted drawing window:
     *   - 2 turns (hours) before day-end on Saturday (hours 22, 23)
     *   - 2 turns (hours) after day-change on Sunday (hours 0, 1)
     */
    _isRestrictedDrawingTime(utcDate) {
        const day = utcDate.getUTCDay(); // 0=Sun, 6=Sat
        const hour = utcDate.getUTCHours();

        // Saturday hours 22 and 23 (2 turns before day end)
        if (day === 6 && hour >= 22) return true;

        // Sunday hours 0 and 1 (2 turns after day change)
        if (day === 0 && hour <= 1) return true;

        return false;
    }

    /**
     * Generate a random valid drawing time within the current week.
     * Returns { dayOfWeek: 0-6, hour: 0-23 } or null if no valid slot.
     */
    _generateRandomDrawingTime() {
        const weekStart = this._getWeekStart();
        const validSlots = [];

        // Iterate through every hour of the week (Sun 00:00 to Sat 23:00)
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            for (let hour = 0; hour < 24; hour++) {
                const candidate = new Date(weekStart);
                candidate.setUTCDate(candidate.getUTCDate() + dayOffset);
                candidate.setUTCHours(hour, 0, 0, 0);

                if (!this._isRestrictedDrawingTime(candidate)) {
                    validSlots.push({ dayOfWeek: candidate.getUTCDay(), hour });
                }
            }
        }

        if (validSlots.length === 0) return null;
        return validSlots[Math.floor(Math.random() * validSlots.length)];
    }

    /**
     * Check if we should schedule a new drawing (new week, no active drawing).
     */
    _shouldScheduleNewDrawing() {
        if (!this.currentDrawing || this.currentDrawing.status === 'closed') {
            // Check if we're in a new week since the last drawing
            if (this.currentDrawing && this.currentDrawing.weekStart) {
                const now = new Date();
                if (now >= this._getWeekEnd(this.currentDrawing.weekStart)) {
                    return true; // new week started
                }
            } else if (!this.currentDrawing) {
                return true; // never scheduled
            }
        }
        return false;
    }

    /**
     * Schedule a new weekly drawing.
     */
    _scheduleDrawing() {
        const drawTime = this._generateRandomDrawingTime();
        if (!drawTime) {
            console.warn('World Lottery: No valid drawing time slots available');
            return;
        }

        const weekStart = this._getWeekStart();
        const drawDate = new Date(weekStart);
        drawDate.setUTCDate(drawDate.getUTCDate() + drawTime.dayOfWeek);
        drawDate.setUTCHours(drawTime.hour, 0, 0, 0);

        // If the draw time is in the past (e.g. we just started mid-week), schedule for next week
        const now = new Date();
        if (drawDate <= now) {
            const nextWeek = new Date(weekStart);
            nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
            drawDate.setUTCDate(nextWeek.getUTCDate() + drawTime.dayOfWeek);
        }

        this.currentDrawing = {
            weekStart: this._getWeekStart(),
            drawDay: drawTime.dayOfWeek,
            drawHour: drawTime.hour,
            drawTime: drawDate.getTime(),
            status: 'open',
            ticketsSold: 0
        };

        console.log(`World Lottery: Drawing scheduled for ${drawDate.toISOString()} (day ${drawTime.dayOfWeek}, hour ${drawTime.hour} UTC)`);
    }

    /**
     * Check if it's time to run the drawing (current time >= draw time).
     */
    _isDrawingTime() {
        if (!this.currentDrawing || this.currentDrawing.status !== 'open') return false;
        return Date.now() >= this.currentDrawing.drawTime;
    }

    // ════════════════════════════════════════════════════════════════════════════════════════════════════════
    // TICKET PURCHASE
    // ════════════════════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Purchase lottery tickets for a nation.
     * Supports both quick-pick (random) and custom picks.
     *
     * @param {Object} nation - The nation buying tickets
     * @param {number} count - Number of tickets (1-25) — used for quick-pick
     * @param {Array} ticketPicks - Optional array of custom picks:
     *        [{ numbers: ['Cat','Dog','...'], multiplier: 'Fox' }, ...]
     *        Each pick: 5 unique pet numbers + 1 multiplier pet (all unique across the 6).
     * @returns {Object} { ok: true/false, tickets: [], totalCost, reason: string }
     */
    purchaseTickets(nation, count = 1, ticketPicks = null) {
        if (!nation) return { ok: false, reason: 'Invalid nation' };

        const nationId = nation.id || (window.Nation && window.Nation.id === nation.id ? window.Nation.id : null);
        if (!nationId) return { ok: false, reason: 'Nation has no ID' };

        // Determine ticket count from picks or count param
        let effectiveCount = count;
        if (ticketPicks) {
            effectiveCount = ticketPicks.length;
        }
        effectiveCount = Math.floor(effectiveCount);

        if (effectiveCount < 1 || effectiveCount > MAX_TICKETS_PER_NATION) {
            return { ok: false, reason: `Can only buy 1-${MAX_TICKETS_PER_NATION} tickets per drawing` };
        }

        // Check if drawing is open
        if (!this.currentDrawing || this.currentDrawing.status !== 'open') {
            return { ok: false, reason: 'No active lottery drawing' };
        }

        // Check existing tickets for this nation in current drawing
        const existing = this.nationTickets.get(nationId) || [];
        if (existing.length + effectiveCount > MAX_TICKETS_PER_NATION) {
            return { ok: false, reason: `Already have ${existing.length} tickets, max ${MAX_TICKETS_PER_NATION} per drawing` };
        }

        // Calculate total cost
        const totalCost = effectiveCount * TICKET_COST;

        // Deduct from nation's primary currency
        const primaryKey = nation.currency || 'aurel';
        let currentBalance = 0;
        if (nation.currencyBalances) {
            currentBalance = nation.currencyBalances[primaryKey] || 0;
        } else {
            currentBalance = nation.money || 0;
        }

        if (currentBalance < totalCost) {
            return { ok: false, reason: `Insufficient ${primaryKey}. Need ${totalCost}, have ${currentBalance}` };
        }

        // Deduct cost
        if (nation.currencyBalances) {
            nation.currencyBalances[primaryKey] = currentBalance - totalCost;
        } else {
            nation.money = currentBalance - totalCost;
        }

        // Generate or validate tickets
        const purchasedTickets = [];
        for (let i = 0; i < effectiveCount; i++) {
            let ticket;
            if (ticketPicks && ticketPicks[i]) {
                // Validate custom pick before creating ticket
                const validation = this.validateTicketPicks([ticketPicks[i]]);
                if (!validation.valid) {
                    // Refund and reject
                    if (nation.currencyBalances) {
                        nation.currencyBalances[primaryKey] = currentBalance;
                    } else {
                        nation.money = currentBalance;
                    }
                    return { ok: false, reason: `Invalid custom pick #${i + 1}: ${validation.reason}` };
                }
                ticket = this._createCustomTicket(nationId, nation.name || 'Unknown', ticketPicks[i]);
            } else {
                ticket = this._generateTicket(nationId, nation.name || 'Unknown');
            }
            this.tickets.set(ticket.id, ticket);
            existing.push(ticket.id);
            purchasedTickets.push(ticket);
        }

        this.nationTickets.set(nationId, existing);
        this.totalTicketSales += totalCost;
        this.lotteryPool += totalCost;

        if (this.currentDrawing) {
            this.currentDrawing.ticketsSold += effectiveCount;
        }

        // Record spending for currency rate dynamics
        if (window.EconomySystem && typeof window.EconomySystem.recordCurrencySpending === 'function') {
            window.EconomySystem.recordCurrencySpending(primaryKey, totalCost);
        }

        // Emit purchase event
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('lottery_ticket_purchased', {
                nationId,
                nationName: nation.name || 'Unknown',
                ticketCount: effectiveCount,
                totalCost,
                customPicks: !!ticketPicks
            });
        }

        return { ok: true, tickets: purchasedTickets, totalCost };
    }

    /**
     * Validate custom ticket picks before purchase.
     * @param {Array} picks - Array of { numbers: [5 pets], multiplier: 'pet' }
     * @returns {Object} { valid: true/false, reason: string }
     */
    validateTicketPicks(picks) {
        if (!Array.isArray(picks) || picks.length === 0) {
            return { valid: false, reason: 'No picks provided' };
        }
        if (picks.length > MAX_TICKETS_PER_NATION) {
            return { valid: false, reason: `Max ${MAX_TICKETS_PER_NATION} tickets per drawing` };
        }

        for (const pick of picks) {
            if (!pick || !Array.isArray(pick.numbers) || pick.numbers.length !== 5) {
                return { valid: false, reason: 'Each ticket needs exactly 5 pet numbers' };
            }
            if (!pick.multiplier) {
                return { valid: false, reason: 'Each ticket needs a multiplier pet' };
            }

            const allSix = [...pick.numbers, pick.multiplier];

            // All 6 must be unique
            if (new Set(allSix).size !== 6) {
                return { valid: false, reason: 'All 6 pets on a ticket must be unique' };
            }

            // All must be valid pet icons
            for (const pet of allSix) {
                if (!PET_ICONS_UNIQUE.includes(pet)) {
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
        return {
            id: this.nextTicketId++,
            nationId,
            nationName,
            numbers: [...pick.numbers],     // 5 regular pet numbers
            multiplier: pick.multiplier,     // 1 multiplier pet
            purchasedAt: Date.now(),
            cost: TICKET_COST,
            customPick: true                 // flag that user chose these
        };
    }

    /**
     * Generate a single random ticket with 6 unique pet icons (6th is multiplier).
     */
    _generateTicket(nationId, nationName) {
        const shuffled = [...PET_ICONS_UNIQUE].sort(() => 0.5 - Math.random());
        const picks = shuffled.slice(0, TICKET_PICK_COUNT);

        return {
            id: this.nextTicketId++,
            nationId,
            nationName,
            numbers: picks.slice(0, 5),      // first 5 are regular numbers
            multiplier: picks[5],            // 6th is the multiplier
            purchasedAt: Date.now(),
            cost: TICKET_COST
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

    /**
     * Get total tickets purchased for current drawing.
     */
    getTotalTicketsSold() {
        if (this.currentDrawing) return this.currentDrawing.ticketsSold || 0;
        let total = 0;
        for (const ids of this.nationTickets.values()) total += ids.length;
        return total;
    }

    /**
     * Get the result of a specific ticket (after drawing has occurred).
     * Returns null if ticket not found or not yet resolved.
     */
    getTicketResult(ticketId) {
        return this.resolvedTickets.get(ticketId) || null;
    }

    /**
     * Get all resolved ticket results for a nation (past drawings).
     */
    getNationResolvedTickets(nationId) {
        if (!nationId) return [];
        const results = [];
        for (const result of this.resolvedTickets.values()) {
            if (result.nationId === nationId) {
                results.push(result);
            }
        }
        // Most recent first
        results.sort((a, b) => new Date(b.drawTime).getTime() - new Date(a.drawTime).getTime());
        return results;
    }

    /**
     * Check if a specific ticket won anything in the last drawing.
     */
    hasWonLastDrawing(nationId) {
        if (!this.lastDrawingResult) return false;
        return this.lastDrawingResult.winners.some(w => w.nationId === nationId);
    }

    // ════════════════════════════════════════════════════════════════════════════════════════════════════════
    // DRAWING EXECUTION
    // ════════════════════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Run the weekly drawing. Determines winning numbers and distributes prizes.
     */
    runDrawing() {
        if (!this.currentDrawing || this.currentDrawing.status !== 'open') {
            return { ok: false, reason: 'No active drawing' };
        }

        // Generate 6 unique winning pet icons (6th is multiplier)
        const shuffled = [...PET_ICONS_UNIQUE].sort(() => 0.5 - Math.random());
        const winningNumbers = shuffled.slice(0, 5);
        const winningMultiplier = shuffled[5];
        const allWinning = [...winningNumbers, winningMultiplier];

        const drawResult = {
            drawTime: new Date().toISOString(),
            winningNumbers,
            multiplier: winningMultiplier,
            allWinning,
            poolBefore: this.lotteryPool,
            winners: [],
            totalPayout: 0
        };

        // Check all tickets for matches
        const jackpotWinners = [];
        const secondaryWinners = [];
        const ticketResults = new Map(); // ticketId -> match result (for post-draw checking)

        for (const [ticketId, ticket] of this.tickets) {
            // Only check tickets for the current drawing week
            if (ticket.nationId && this._isTicketForCurrentDrawing(ticket)) {
                const matchResult = this._checkTicket(ticket, winningNumbers, winningMultiplier);

                // Store result for every ticket (winners and losers) so users can check after draw
                ticketResults.set(ticketId, {
                    ticketId: ticket.id,
                    nationId: ticket.nationId,
                    nationName: ticket.nationName,
                    numbers: [...ticket.numbers],
                    multiplier: ticket.multiplier,
                    customPick: ticket.customPick || false,
                    matches: matchResult.matches,
                    hasMultiplierMatch: matchResult.hasMultiplierMatch,
                    tier: matchResult.tier,
                    prize: matchResult.prize,
                    winningNumbers: [...allWinning],
                    drawTime: drawResult.drawTime
                });

                if (matchResult.prize > 0) {
                    const winner = {
                        ticketId: ticket.id,
                        nationId: ticket.nationId,
                        nationName: ticket.nationName,
                        numbers: [...ticket.numbers],
                        multiplier: ticket.multiplier,
                        matches: matchResult.matches,
                        hasMultiplierMatch: matchResult.hasMultiplierMatch,
                        tier: matchResult.tier,
                        prize: matchResult.prize
                    };
                    if (matchResult.tier === 'JACKPOT') {
                        jackpotWinners.push(winner);
                    } else {
                        secondaryWinners.push(winner);
                    }
                }
            }
        }

        let totalPayout = 0;

        if (jackpotWinners.length > 0) {
            // Jackpot hit: jackpot winner(s) split the FULL pool.
            // Secondary prizes are NOT paid (pool is emptied by jackpot).
            const jackpotShare = Math.floor(this.lotteryPool / jackpotWinners.length);
            for (const w of jackpotWinners) {
                w.prize = jackpotShare;
                w.tier = 'JACKPOT';
                drawResult.winners.push(w);
                totalPayout += jackpotShare;
            }
        } else {
            // No jackpot: secondary prize winners split their tier percentages of the pool.
            // Group winners by tier so multiple winners in same tier split that tier's pct.
            const tierGroups = {};
            for (const w of secondaryWinners) {
                if (!tierGroups[w.tier]) tierGroups[w.tier] = [];
                tierGroups[w.tier].push(w);
            }

            for (const [tier, winners] of Object.entries(tierGroups)) {
                const tierPct = PRIZE_TIERS[tier] ? PRIZE_TIERS[tier].pct : 0;
                const tierPool = Math.floor(this.lotteryPool * tierPct);
                const share = Math.floor(tierPool / winners.length);
                for (const w of winners) {
                    w.prize = share;
                    drawResult.winners.push(w);
                    totalPayout += share;
                }
            }
        }

        // Update ticketResults with actual prize amounts (jackpot shares may differ from _checkTicket full-pool estimate)
        for (const w of drawResult.winners) {
            const existing = ticketResults.get(w.ticketId);
            if (existing) {
                existing.prize = w.prize;
                existing.tier = w.tier;
            }
        }

        // Record unclaimed winnings (manual claim required)
        this._recordUnclaimedWinnings(drawResult);

        // Update pool
        this.lotteryPool -= totalPayout;
        if (this.lotteryPool < 0) this.lotteryPool = 0;

        // If jackpot was won, restart pool with 0.01% of what was won
        if (jackpotWinners.length > 0) {
            const restartAmount = Math.floor(totalPayout * JACKPOT_RESTART_PCT);
            this.lotteryPool = restartAmount;
            this.rateImpactMultiplier = Math.min(RATE_IMPACT_MAX, this.rateImpactMultiplier + 2.0); // skyrocket
            console.log(`World Lottery: JACKPOT won by ${jackpotWinners.map(w => w.nationName).join(', ')}! Pool restarted with ${restartAmount}`);
        } else if (totalPayout > 0) {
            // Non-jackpot payouts raise rates moderately
            const payoutRatio = totalPayout / Math.max(drawResult.poolBefore, 1);
            this.rateImpactMultiplier = Math.min(RATE_IMPACT_MAX, this.rateImpactMultiplier + (payoutRatio * 0.5));
        }

        this.lastPayoutAmount = drawResult.totalPayout;
        this.lastDrawingResult = drawResult;
        this.drawingsHistory.push(drawResult);
        if (this.drawingsHistory.length > 52) this.drawingsHistory.shift(); // keep last year

        // Store resolved tickets so users can check results after the drawing
        for (const [ticketId, result] of ticketResults) {
            this.resolvedTickets.set(ticketId, result);
        }

        // Keep resolved tickets for 2 weeks (claim window), then clean up
        const twoWeeksAgo = Date.now() - 2 * 7 * 24 * 60 * 60 * 1000;
        for (const [tid, res] of this.resolvedTickets) {
            if (new Date(res.drawTime).getTime() < twoWeeksAgo) {
                this.resolvedTickets.delete(tid);
            }
        }

        // Mark drawing closed
        this.currentDrawing.status = 'closed';

        // Clear tickets for this drawing (they've been resolved)
        this._clearDrawingTickets();

        // Emit event
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('lottery_drawing_complete', drawResult);
        }

        console.log(`World Lottery: Drawing complete. ${drawResult.winners.length} winners, ${drawResult.totalPayout} paid out.`);
        return { ok: true, result: drawResult };
    }

    /**
     * Check if a ticket belongs to the current drawing week.
     */
    _isTicketForCurrentDrawing(ticket) {
        if (!this.currentDrawing) return false;
        const ticketWeek = this._getWeekStart(new Date(ticket.purchasedAt));
        return ticketWeek.getTime() === this.currentDrawing.weekStart.getTime();
    }

    /**
     * Check a single ticket against winning numbers.
     */
    _checkTicket(ticket, winningNumbers, winningMultiplier) {
        const ticketNumbers = ticket.numbers;
        const ticketMultiplier = ticket.multiplier;

        // Count matches among the 5 regular numbers
        let matches = 0;
        for (const num of ticketNumbers) {
            if (winningNumbers.includes(num)) matches++;
        }

        // Check if multiplier matches
        const hasMultiplierMatch = (ticketMultiplier === winningMultiplier);

        // Determine tier
        let tier = null;
        let prize = 0;

        if (matches === 5 && hasMultiplierMatch) {
            tier = 'JACKPOT';
            prize = this.lotteryPool; // full balance
        } else if (matches === 5) {
            tier = 'FIVE';
            prize = Math.floor(this.lotteryPool * PRIZE_TIERS.FIVE.pct);
        } else if (matches === 4 && hasMultiplierMatch) {
            tier = 'FOUR_PLUS_M';
            prize = Math.floor(this.lotteryPool * PRIZE_TIERS.FOUR_PLUS_M.pct);
        } else if (matches === 4) {
            tier = 'FOUR';
            prize = Math.floor(this.lotteryPool * PRIZE_TIERS.FOUR.pct);
        } else if (matches === 3 && hasMultiplierMatch) {
            tier = 'THREE_PLUS_M';
            prize = Math.floor(this.lotteryPool * PRIZE_TIERS.THREE_PLUS_M.pct);
        } else if (matches === 3) {
            tier = 'THREE';
            prize = Math.floor(this.lotteryPool * PRIZE_TIERS.THREE.pct);
        }

        return { matches, hasMultiplierMatch, tier, prize };
    }

    /**
     * Record unclaimed winnings (does NOT auto-pay). Nations must call claimPrize() to collect.
     */
    _recordUnclaimedWinnings(drawResult) {
        for (const winner of drawResult.winners) {
            const expiresAt = new Date(drawResult.drawTime).getTime() + this.CLAIM_WINDOW_MS;
            this.unclaimedWinnings.set(winner.ticketId, {
                ticketId: winner.ticketId,
                nationId: winner.nationId,
                nationName: winner.nationName,
                tier: winner.tier,
                prize: winner.prize,
                drawTime: drawResult.drawTime,
                expiresAt,
                claimed: false,
                winningNumbers: drawResult.allWinning
            });
        }
    }

    /**
     * Claim a lottery prize. Must be within 14 days of the draw time.
     * @param {number} ticketId - The winning ticket ID
     * @param {number} nationId - The nation claiming (must match ticket owner)
     * @returns {Object} { ok: true/false, prize, reason }
     */
    claimPrize(ticketId, nationId) {
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

        const now = Date.now();
        if (now > unclaimed.expiresAt) {
            // Mark as expired
            unclaimed.claimed = true;
            unclaimed.expired = true;
            return { ok: false, reason: 'Prize expired — claim window was 14 days from draw time' };
        }

        // Find and pay the nation
        const nation = this._findNation(nationId);
        if (!nation) {
            return { ok: false, reason: 'Nation not found' };
        }

        const prize = unclaimed.prize;
        const primaryKey = nation.currency || 'aurel';
        if (nation.currencyBalances) {
            nation.currencyBalances[primaryKey] = (nation.currencyBalances[primaryKey] || 0) + prize;
        } else {
            nation.money = (nation.money || 0) + prize;
        }

        unclaimed.claimed = true;
        unclaimed.claimedAt = now;

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('lottery_prize_claimed', {
                ticketId,
                nationId,
                nationName: unclaimed.nationName,
                tier: unclaimed.tier,
                prize,
                drawTime: unclaimed.drawTime
            });
        }

        console.log(`World Lottery: Prize claimed by ${unclaimed.nationName} — ${prize} from ${unclaimed.tier}`);
        return { ok: true, prize, tier: unclaimed.tier };
    }

    /**
     * Get all unclaimed winnings for a nation (not yet claimed, not expired).
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
     * Get expired (unclaimed, past 14 days) winnings for a nation.
     */
    getExpiredWinnings(nationId) {
        if (!nationId) return [];
        const results = [];
        const now = Date.now();
        for (const w of this.unclaimedWinnings.values()) {
            if (w.nationId === nationId && !w.claimed && now > w.expiresAt) {
                results.push({ ...w, expired: true });
            }
        }
        results.sort((a, b) => new Date(b.drawTime).getTime() - new Date(a.drawTime).getTime());
        return results;
    }

    /**
     * Distribute prizes to nations — DISABLED. Prizes are now claimed manually via claimPrize().
     * Kept as a no-op for backward compatibility.
     */
    _distributePrizes(drawResult) {
        // No-op: prizes must be claimed manually via claimPrize()
    }

    /**
     * Clear resolved tickets from the current drawing.
     */
    _clearDrawingTickets() {
        this.tickets.clear();
        this.nationTickets.clear();
    }

    /**
     * Find a nation object by ID from any available source.
     */
    _findNation(nationId) {
        if (!nationId) return null;
        if (window.Nation && window.Nation.id === nationId) return window.Nation;
        if (window.GameEngine && window.GameEngine.nations) {
            for (const n of Object.values(window.GameEngine.nations)) {
                if (n.id === nationId) return n;
            }
        }
        if (window.aiNations && window.aiNations.aiNations) {
            for (const n of window.aiNations.aiNations.values()) {
                if (n.id === nationId) return n;
            }
        }
        return null;
    }

    // ════════════════════════════════════════════════════════════════════════════════════════════════════════
    // WORLD BANK INTEGRATION (Funding + Rate Impact)
    // ════════════════════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Add money to the lottery pool from World Bank sources (interest, territory tax).
     * Called by WorldBankSystem when interest/tax is collected.
     * @param {number} amount - Amount to add
     * @param {string} source - 'loan_interest' | 'bill_interest' | 'tax_interest' | 'territory_tax'
     */
    contributeFromBank(amount, source) {
        if (!amount || amount <= 0) return;
        this.lotteryPool += amount;
        this.totalBankContributions += amount;
        console.log(`World Lottery: Bank contributed ${amount} from ${source}. Pool: ${this.lotteryPool}`);
    }

    /**
     * Get the rate impact multiplier to apply to World Bank interest rates.
     * Higher values = higher rates (bank lost money on payouts).
     */
    getRateImpactMultiplier() {
        return Math.max(RATE_IMPACT_MIN, Math.min(RATE_IMPACT_MAX, this.rateImpactMultiplier));
    }

    /**
     * Reset rate impact toward 1.0 over time (decay).
     */
    decayRateImpact() {
        this.rateImpactMultiplier = Math.max(1.0, this.rateImpactMultiplier - 0.1);
    }

    // ════════════════════════════════════════════════════════════════════════════════════════════════════════
    // DAY PASSED HANDLER
    // ════════════════════════════════════════════════════════════════════════════════════════════════════════

    _onDayPassed(data) {
        // Decay rate impact each day
        this.decayRateImpact();

        // Clean up expired unclaimed winnings (past 14-day claim window)
        const now = Date.now();
        for (const [ticketId, w] of this.unclaimedWinnings) {
            if (w.claimed || now > w.expiresAt) {
                this.unclaimedWinnings.delete(ticketId);
            }
        }

        // Schedule new drawing if needed
        if (this._shouldScheduleNewDrawing()) {
            this._scheduleDrawing();
        }

        // Run drawing if it's time
        if (this._isDrawingTime()) {
            this.runDrawing();
        }
    }

    // ════════════════════════════════════════════════════════════════════════════════════════════════════════
    // QUERY / UI METHODS
    // ════════════════════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Get current lottery state for UI display.
     */
    getLotteryState() {
        const now = new Date();
        const weekStart = this._getWeekStart(now);
        const weekEnd = this._getWeekEnd(now);

        return {
            pool: this.lotteryPool,
            totalTicketSales: this.totalTicketSales,
            totalBankContributions: this.totalBankContributions,
            ticketsSold: this.getTotalTicketsSold(),
            maxTicketsPerNation: MAX_TICKETS_PER_NATION,
            ticketCost: TICKET_COST,
            currentDrawing: this.currentDrawing ? {
                status: this.currentDrawing.status,
                drawDay: this.currentDrawing.drawDay,
                drawHour: this.currentDrawing.drawHour,
                drawTime: this.currentDrawing.drawTime,
                weekStart: this.currentDrawing.weekStart
            } : null,
            weekStart: weekStart.getTime(),
            weekEnd: weekEnd.getTime(),
            lastResult: this.lastDrawingResult,
            previousDrawings: this.getPreviousDrawings(),
            rateImpact: this.getRateImpactMultiplier(),
            canPurchase: this.currentDrawing && this.currentDrawing.status === 'open'
        };
    }

    /**
     * Get previous drawing results (up to last 8 draws) for UI display.
     * Each entry includes winning numbers, multiplier, pool size, and winners with amounts.
     */
    getPreviousDrawings() {
        const drawings = [...this.drawingsHistory];
        // Sort most recent first
        drawings.sort((a, b) => new Date(b.drawTime).getTime() - new Date(a.drawTime).getTime());
        return drawings.slice(0, 8).map(d => ({
            drawTime: d.drawTime,
            winningNumbers: d.winningNumbers,
            multiplier: d.multiplier,
            allWinning: d.allWinning,
            poolBefore: d.poolBefore,
            totalPayout: d.totalPayout,
            winners: d.winners.map(w => ({
                ticketId: w.ticketId,
                nationId: w.nationId,
                nationName: w.nationName,
                tier: w.tier,
                prize: w.prize,
                matches: w.matches,
                hasMultiplierMatch: w.hasMultiplierMatch,
                numbers: w.numbers,
                multiplier: w.multiplier
            })),
            jackpotWon: d.winners.some(w => w.tier === 'JACKPOT')
        }));
    }

    /**
     * Get prize tier info for display.
     */
    getPrizeTiers() {
        return PRIZE_TIERS;
    }

    /**
     * Get state for saving.
     */
    getState() {
        return {
            lotteryPool: this.lotteryPool,
            totalTicketSales: this.totalTicketSales,
            totalBankContributions: this.totalBankContributions,
            nextTicketId: this.nextTicketId,
            currentDrawing: this.currentDrawing,
            lastDrawingResult: this.lastDrawingResult,
            rateImpactMultiplier: this.rateImpactMultiplier,
            nationPets: Object.fromEntries(this.nationPets),
            // Save unclaimedWinnings as array of [key, value] to preserve numeric ticketId keys
            unclaimedWinnings: Array.from(this.unclaimedWinnings.entries()),
            drawingsHistory: this.drawingsHistory
        };
    }

    /**
     * Set state from save data.
     */
    setState(state) {
        if (state.lotteryPool !== undefined) this.lotteryPool = state.lotteryPool;
        if (state.totalTicketSales !== undefined) this.totalTicketSales = state.totalTicketSales;
        if (state.totalBankContributions !== undefined) this.totalBankContributions = state.totalBankContributions;
        if (state.nextTicketId !== undefined) this.nextTicketId = state.nextTicketId;
        if (state.currentDrawing) this.currentDrawing = state.currentDrawing;
        if (state.lastDrawingResult) this.lastDrawingResult = state.lastDrawingResult;
        if (state.rateImpactMultiplier !== undefined) this.rateImpactMultiplier = state.rateImpactMultiplier;
        if (state.nationPets) {
            this.nationPets = new Map(Object.entries(state.nationPets));
        }
        if (state.unclaimedWinnings) {
            // Restore as Map with numeric keys
            if (Array.isArray(state.unclaimedWinnings)) {
                this.unclaimedWinnings = new Map(state.unclaimedWinnings);
            } else {
                this.unclaimedWinnings = new Map(Object.entries(state.unclaimedWinnings));
            }
        }
        if (state.drawingsHistory) {
            this.drawingsHistory = state.drawingsHistory;
        }
    }

    destroy() {
        if (typeof EventBus !== 'undefined') {
            EventBus.off('day_passed', this._onDayPassedBound);
        }
        this.isInitialized = false;
    }
}

const WorldLottery = new WorldLotterySystem();

if (typeof window !== 'undefined') {
    window.WorldLotterySystem = WorldLotterySystem;
    window.WorldLottery = WorldLottery;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WorldLotterySystem, WorldLottery };
}
