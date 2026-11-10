/**
 * Casino System - Base system for Sovereign Wheel, Keno, and Scratch-offs
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Manages all casino games, World Bank pool integration, and per-nation casino state.
 * All casino currency flows through the World Bank lottery pool:
 *   - Wagers → deducted from nation → added to pool
 *   - Payouts → deducted from pool → added to nation
 *   - Pool cannot go below 0 (payouts capped at remaining balance)
 */

const CasinoClass = require("../../entities/Casino.js");
const BlackjackSystem = require('./cards/blackjack-system.js');
const GamblerDiceSystem = require('./dice/gambler-dice-system.js');

class CasinoSystem {
    constructor() {
        this.isInitialized = false;

        // Subsystems (set by init)
        this.wheelSystem = null;
        this.kenoSystem = null;
        this.scratchOffSystem = null;
        this.blackjackSystem = null;
        this.gamblerDiceSystem = null;

        // World Bank lottery pool reference
        // All casino payouts come from this pool; all wagers add to it
        this.lotteryPool = 0;

        // Per-nation casino state: nationId -> CasinoClass instance
        this.nationCasinos = new Map();
    }

    // ════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ════════════════════════════════════════════════════════════════════════════

    init(wheelSystem, kenoSystem, scratchOffSystem, blackjackSystem, gamblerDiceSystem) {
        if (this.isInitialized) return;
        this.wheelSystem = wheelSystem;
        this.kenoSystem = kenoSystem;
        this.scratchOffSystem = scratchOffSystem;
        this.blackjackSystem = blackjackSystem;
        this.gamblerDiceSystem = gamblerDiceSystem;
        if (this.blackjackSystem) {
            this.blackjackSystem.initialize();
        }
        if (this.gamblerDiceSystem) {
            this.gamblerDiceSystem.initialize();
        }
        this.isInitialized = true;
        console.log('Casino System initialized');
    }

    /**
     * Get the BlackjackSystem subsystem.
     */
    getBlackjackSystem() {
        return this.blackjackSystem;
    }

    /**
     * Get the GamblerDiceSystem subsystem.
     */
    getGamblerDiceSystem() {
        return this.gamblerDiceSystem;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // WORLD BANK POOL INTEGRATION
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Add wager amount to the World Bank lottery pool.
     * Called when a nation buys a keno ticket, scratch-off card, etc.
     */
    addToPool(amount, source) {
        if (!amount || amount <= 0) return 0;
        this.lotteryPool = (this.lotteryPool || 0) + amount;
        console.log(`Casino: ${amount} added to World Bank pool from ${source}. Pool: ${this.lotteryPool}`);
        return this.lotteryPool;
    }

    /**
     * Deduct payout from the World Bank lottery pool.
     * Capped at remaining balance - pool cannot go below 0.
     * @returns {number} The actual amount paid (may be less than requested)
     */
    payFromPool(amount, source) {
        if (!amount || amount <= 0) return 0;
        const available = this.lotteryPool || 0;
        const pay = Math.min(available, amount);
        this.lotteryPool = available - pay;
        console.log(`Casino: ${pay} paid from World Bank pool for ${source}. Pool remaining: ${this.lotteryPool}`);
        return pay;
    }

    /**
     * Get current pool balance.
     */
    getPool() {
        return this.lotteryPool || 0;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ══════════════════════════════════════════════════════════════════════════

    getState() {
        const nationCasinos = {};
        for (const [nationId, casino] of this.nationCasinos) {
            nationCasinos[nationId] = casino.serialize ? casino.serialize() : casino;
        }
        const state = {
            lotteryPool: this.lotteryPool,
            nationCasinos,
        };
        if (this.wheelSystem) {
            state.sovereignWheelSystem = this.wheelSystem.getState ? this.wheelSystem.getState() : null;
        }
        if (this.kenoSystem) {
            state.kenoSystem = this.kenoSystem.getState ? this.kenoSystem.getState() : null;
        }
        if (this.scratchOffSystem) {
            state.scratchOffSystem = this.scratchOffSystem.getState ? this.scratchOffSystem.getState() : null;
        }
        if (this.blackjackSystem) {
            state.blackjackSystem = this.blackjackSystem.getState ? this.blackjackSystem.getState() : null;
        }
        if (this.gamblerDiceSystem) {
            state.gamblerDiceSystem = this.gamblerDiceSystem.getState ? this.gamblerDiceSystem.getState() : null;
        }
        return state;
    }

    setState(state) {
        if (state.lotteryPool !== undefined) {
            this.lotteryPool = state.lotteryPool;
        }
        if (state.nationCasinos) {
            for (const [nationId, data] of Object.entries(state.nationCasinos)) {
                let casino;
                if (CasinoClass) {
                    casino = new CasinoClass();
                    casino.deserialize(data);
                } else {
                    casino = data;
                }
                this.nationCasinos.set(nationId, casino);
            }
        }
        if (state.kenoSystem) {
            if (this.kenoSystem) {
                this.kenoSystem.setState(state.kenoSystem);
            }
        }
        if (state.scratchOffSystem) {
            if (this.scratchOffSystem) {
                this.scratchOffSystem.setState(state.scratchOffSystem);
            }
        }
        if (state.blackjackSystem) {
            if (this.blackjackSystem) {
                this.blackjackSystem.setState(state.blackjackSystem);
            }
        }
        if (state.gamblerDiceSystem) {
            if (this.gamblerDiceSystem) {
                this.gamblerDiceSystem.setState(state.gamblerDiceSystem);
            }
        }
        if (state.sovereignWheelSystem) {
            if (this.wheelSystem) {
                this.wheelSystem.setState(state.sovereignWheelSystem);
            }
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CasinoSystem;
}
if (typeof window !== 'undefined') {
    window.CasinoSystem = CasinoSystem;
}
