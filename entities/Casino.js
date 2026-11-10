/**
 * Casino Entity - Casino data structure for Sovereignty Wheel, Keno, and Scratch-offs
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Attached to each nation's rules state as `r.casino`.
 * Contains all casino game data: wheel slices, free unit credits, keno tickets,
 * scratch-off cards, and per-game statistics.
 */

class CasinoClass {
    constructor() {
        this.isInitialized = false;

        // ── Active Wheel Effects ──
        // Effects won on the Sovereign Wheel that persist across spins
        this.activeEffects = {
            freeProject: false,         // Next project is fully free (1 Free Project slice)
            freeProjectDate: null,      // Date the free project was granted
            wonderCooldownReset: false, // Wonder build cooldown has been reset
            wonderCooldownResetDate: null, // Date the wonder cooldown was reset
            freeBillsDays: 0,           // Days of free bills remaining (0-3)
            freeBillsStartDate: null,   // Date free bills were granted
        };

        // ── Free Unit Credits (Won on Sovereign Wheel) ──
        // Stackable redeemable credits. Winning a FREE X unit slice adds credits
        // that do NOT instantly create units. Credits stack with any remaining
        // credits for that unit type and are redeemed at purchase time: money and
        // resource costs are waived for the redeemed amount, but tech requirements,
        // capacity limits, prerequisites, population enlistment, and all other
        // limits still apply.
        this.freeUnits = {
            soldiers: 0,   // Redeemable free soldiers (1,000 / 5,000 / 10,000 credit slices)
            tanks: 0,      // Redeemable free tanks (50 / 150 / 450 credit slices)
            aircraft: 0,   // Redeemable free aircraft (25 / 75 / 225 credit slices)
            ships: 0,      // Redeemable free ships (15 / 45 / 135 credit slices)
            spies: 0,      // Redeemable free spies (5 / 15 / 45 credit slices)
            missiles: 0,   // Redeemable free missiles (2 / 6 / 18 credit slices)
            nukes: 0,      // Redeemable free nukes (1 / 2 / 3 credit slices)
            land: 0,       // Redeemable free land credit (Free Land × 5% slice)
            infra: 0,      // Redeemable free infra credit (Free Infra × 5% slice)
        };

        // ── Blackjack Tables ──
        // Active blackjack table sessions (tableId -> CasinoTable serialized)
        this.blackjackTables = {}; // Map<tableId, serialized CasinoTable>

        // ── Gambler Dice Tables ──
        // Active gambler dice table sessions (tableId -> CasinoDiceTable serialized)
        this.gamblerDiceTables = {}; // Map<tableId, serialized CasinoDiceTable>

        // ── Games Statistics ──
        // Per-game tracking for XP, achievements, and display
        this.games = {
            wheel: {
                spins: 0,
                wins: 0,
                losses: 0,
                totalWon: 0,      // Total currency won from wheel
                totalSpent: 0,    // Total currency spent on wheel (always 0 - free daily spin)
            },
            keno: {
                played: 0,
                won: 0,
                spent: 0,
                wonAmount: 0,
            },
            blackjack: {
                played: 0,
                won: 0,
                lost: 0,
                pushed: 0,
                blackjacks: 0,
                spent: 0,      // Total wagered
                wonAmount: 0,  // Total profit (wins - losses)
            },
            gamblerDice: {
                played: 0,
                won: 0,
                lost: 0,
                pushed: 0,
                jackpotsWon: 0,
                spent: 0,      // Total wagered
                wonAmount: 0,  // Total profit (wins - losses)
            },
            scratchOff: {
                played: 0,
                won: 0,
                spent: 0,
                wonAmount: 0,
            },
            // Per-card-type scratch-off stats
            scratch_off_resources: { played: 0, won: 0, spent: 0, wonAmount: 0 },
            scratch_off_pets: { played: 0, won: 0, spent: 0, wonAmount: 0 },
            scratch_off_bricks: { played: 0, won: 0, spent: 0, wonAmount: 0 },
            scratch_off_factions: { played: 0, won: 0, spent: 0, wonAmount: 0 },
            scratch_off_beliefs: { played: 0, won: 0, spent: 0, wonAmount: 0 },
            scratch_off_needs: { played: 0, won: 0, spent: 0, wonAmount: 0 },
        };

        // ── Keno Tickets ──
        // nationId is implied by the casino owner. Tickets stored here for the
        // current drawing.
        this.kenoTickets = []; // Array of keno ticket objects

        // ── Scratch-off Cards ──
        // Purchased but not yet revealed scratch-off cards
        this.scratchOffCards = []; // Array of scratch-off card objects

        // ── Sovereign Wheel State ──
        // Per-nation wheel state (last spin date, etc.)
        this.wheel = {
            lastSpinDate: null,   // Date of last wheel spin (YYYY-MM-DD)
            spinsToday: 0,        // Number of spins today (max 1 free per day)
            paidSpinsToday: 0,    // Number of paid spins today
        };
    }

    // ═════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═════════════════════════════════════════════════════════════════════════

    initialize(casinoData = {}) {
        if (casinoData.activeEffects) {
            this.activeEffects = { ...this.activeEffects, ...casinoData.activeEffects };
        }
        if (casinoData.freeUnits) {
            this.freeUnits = { ...this.freeUnits, ...casinoData.freeUnits };
        }
        if (casinoData.games) {
            // Deep-merge each game's stats so partial data doesn't wipe fields
            const mergedGames = { ...this.games };
            for (const [gameName, gameData] of Object.entries(casinoData.games)) {
                if (gameData && typeof gameData === 'object') {
                    mergedGames[gameName] = { ...this.games[gameName], ...gameData };
                } else {
                    mergedGames[gameName] = { ...this.games[gameName] };
                }
            }
            this.games = mergedGames;
        }
        if (casinoData.blackjackTables) {
            this.blackjackTables = { ...casinoData.blackjackTables };
        }
        if (casinoData.gamblerDiceTables) {
            this.gamblerDiceTables = { ...casinoData.gamblerDiceTables };
        }
        if (casinoData.kenoTickets) {
            this.kenoTickets = [...casinoData.kenoTickets];
        }
        if (casinoData.scratchOffCards) {
            this.scratchOffCards = [...casinoData.scratchOffCards];
        }
        if (casinoData.wheel) {
            this.wheel = { ...this.wheel, ...casinoData.wheel };
        }
        this.isInitialized = true;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FREE UNIT CREDIT OPERATIONS
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Add free unit credits (called when winning a FREE X slice on the wheel).
     * Credits stack additively with any existing credits.
     * @param {string} unitType - 'soldiers' | 'tanks' | 'aircraft' | 'ships' | 'spies' | 'missiles' | 'nukes' | 'land' | 'infra'
     * @param {number} amount - Number of credits to add
     */
    addFreeUnitCredits(unitType, amount) {
        if (!this.freeUnits.hasOwnProperty(unitType)) {
            throw new Error(`Unknown free unit type: ${unitType}`);
        }
        this.freeUnits[unitType] = (this.freeUnits[unitType] || 0) + amount;
    }

    /**
     * Redeem free unit credits at purchase time.
     * Returns the number of credits actually consumed (may be less than requested
     * if insufficient credits available).
     * @param {string} unitType - The unit type being purchased
     * @param {number} amount - Number of credits to consume
     * @returns {number} Credits actually consumed
     */
    redeemFreeUnitCredits(unitType, amount) {
        if (!this.freeUnits.hasOwnProperty(unitType)) {
            throw new Error(`Unknown free unit type: ${unitType}`);
        }
        const available = this.freeUnits[unitType] || 0;
        const consume = Math.min(available, amount);
        this.freeUnits[unitType] = available - consume;
        return consume;
    }

    /**
     * Get the number of free unit credits available for a unit type.
     * @param {string} unitType
     * @returns {number}
     */
    getFreeUnitCredits(unitType) {
        if (!this.freeUnits.hasOwnProperty(unitType)) {
            throw new Error(`Unknown free unit type: ${unitType}`);
        }
        return this.freeUnits[unitType] || 0;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ══════════════════════════════════════════════════════════════════════════

    serialize() {
        return {
            activeEffects: { ...this.activeEffects },
            freeUnits: { ...this.freeUnits },
            games: { ...this.games },
            blackjackTables: { ...this.blackjackTables },
            gamblerDiceTables: { ...this.gamblerDiceTables },
            kenoTickets: [...this.kenoTickets],
            scratchOffCards: [...this.scratchOffCards],
            wheel: { ...this.wheel },
        };
    }

    deserialize(data) {
        this.initialize(data);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CasinoClass;
}
// Browser global for VM sandbox in server/world.js
if (typeof window !== 'undefined') {
    window.CasinoClass = CasinoClass;
}
