/**
 * Aid System - Manages aid transfers between nations
 * Nations can send money to each other as aid.
 * Handles validation, cooldowns, limits, and history tracking.
 */

class AidSystem {
    constructor() {
        this.aidHistory = new Map(); // id -> aid record
        this.nationAidIndex = new Map(); // nationId -> [aidIds]
        this.lastAidByNation = new Map(); // nationId -> timestamp of last aid sent
        this.isInitialized = false;
    }

    /**
     * Initialize the aid system
     */
    initialize() {
        if (this.isInitialized) return;
        console.log('Initializing Aid System...');
        this.isInitialized = true;
        console.log('Aid System initialized');
        EventBus.emit('aid_system_initialized');
    }

    /**
     * Send aid from one nation to another
     * @param {string} fromNationId - ID of the sending nation
     * @param {string} toNationId - ID of the receiving nation
     * @param {number} amount - Amount of money to send
     * @param {string} type - Type of aid (e.g. 'humanitarian', 'military', 'economic')
     * @returns {Object} { success, aid, error }
     */
    async sendAid(fromNationId, toNationId, amount, type = 'humanitarian') {
        // Validate inputs
        if (!fromNationId || !toNationId) {
            return { success: false, error: 'Both sender and receiver nation IDs are required' };
        }

        if (fromNationId === toNationId) {
            return { success: false, error: 'A nation cannot send aid to itself' };
        }

        if (!amount || amount <= 0) {
            return { success: false, error: 'Aid amount must be greater than zero' };
        }

        // Check cooldown
        const now = Date.now();
        const lastAid = this.lastAidByNation.get(fromNationId) || 0;
        const cooldown = GameConfig.AID.COOLDOWN_MS;
        if (now - lastAid < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastAid)) / 1000 / 60);
            return { success: false, error: `Aid on cooldown. Try again in ${remaining} minute(s).` };
        }

        // Check amount limits
        if (amount < GameConfig.AID.MIN_AMOUNT) {
            return { success: false, error: `Minimum aid amount is $${GameConfig.AID.MIN_AMOUNT}` };
        }
        if (amount > GameConfig.AID.MAX_AMOUNT) {
            return { success: false, error: `Maximum aid amount is $${GameConfig.AID.MAX_AMOUNT}` };
        }

        // Check sender has enough money
        const fromNation = window.Nation && window.Nation.id === fromNationId
            ? window.Nation
            : null;
        if (fromNation && fromNation.money < amount) {
            return { success: false, error: 'Insufficient funds to send this aid' };
        }

        // Create aid record
        const aidId = `aid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const aidRecord = {
            id: aidId,
            fromNationId,
            toNationId,
            amount,
            type,
            createdAt: now,
            status: 'completed'
        };

        // Store in memory
        this.aidHistory.set(aidId, aidRecord);

        // Index by nation
        if (!this.nationAidIndex.has(fromNationId)) {
            this.nationAidIndex.set(fromNationId, []);
        }
        if (!this.nationAidIndex.has(toNationId)) {
            this.nationAidIndex.set(toNationId, []);
        }
        this.nationAidIndex.get(fromNationId).push(aidId);
        this.nationAidIndex.get(toNationId).push(aidId);

        // Update last aid timestamp for sender
        this.lastAidByNation.set(fromNationId, now);

        // Emit events
        EventBus.emit('aid_sent', { aid: aidRecord });
        EventBus.emit('aid_received', { aid: aidRecord });

        console.log(`Aid sent: ${fromNationId} -> ${toNationId} $${amount} (${type})`);

        return { success: true, aid: aidRecord };
    }

    /**
     * Get aid history for a nation (sent and received)
     * @param {string} nationId - Nation ID
     * @param {Object} options - { limit, offset, type: 'sent' | 'received' | 'all' }
     * @returns {Array} Array of aid records
     */
    getAidHistory(nationId, options = {}) {
        const { limit = 50, offset = 0, type = 'all' } = options;
        const aidIds = this.nationAidIndex.get(nationId) || [];

        const aids = aidIds
            .map(id => this.aidHistory.get(id))
            .filter(Boolean)
            .filter(aid => {
                if (type === 'sent') return aid.fromNationId === nationId;
                if (type === 'received') return aid.toNationId === nationId;
                return true;
            })
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(offset, offset + limit);

        return aids;
    }

    /**
     * Check if a nation can send aid right now
     * @param {string} nationId - Nation ID
     * @returns {Object} { canSend, reason, cooldownRemainingMs }
     */
    canSendAid(nationId) {
        const now = Date.now();
        const lastAid = this.lastAidByNation.get(nationId) || 0;
        const cooldown = GameConfig.AID.COOLDOWN_MS;
        const remaining = cooldown - (now - lastAid);

        if (remaining > 0) {
            return {
                canSend: false,
                reason: 'Aid cooldown active',
                cooldownRemainingMs: remaining
            };
        }

        return { canSend: true, reason: null, cooldownRemainingMs: 0 };
    }

    /**
     * Get global aid statistics
     * @returns {Object} Aid statistics
     */
    getAidStats() {
        const allAids = Array.from(this.aidHistory.values());
        const totalSent = allAids.reduce((sum, a) => sum + a.amount, 0);
        const byType = {};
        for (const aid of allAids) {
            byType[aid.type] = (byType[aid.type] || 0) + aid.amount;
        }
        return {
            totalTransfers: allAids.length,
            totalAmount: totalSent,
            byType,
            averageAmount: allAids.length > 0 ? Math.round(totalSent / allAids.length) : 0
        };
    }

    /**
     * Get a specific aid record by ID
     * @param {string} aidId
     * @returns {Object|null}
     */
    getAid(aidId) {
        return this.aidHistory.get(aidId) || null;
    }

    /**
     * Get total aid sent by a nation
     * @param {string} nationId
     * @returns {number}
     */
    getTotalAidSent(nationId) {
        const aidIds = this.nationAidIndex.get(nationId) || [];
        return aidIds
            .map(id => this.aidHistory.get(id))
            .filter(Boolean)
            .filter(aid => aid.fromNationId === nationId)
            .reduce((sum, a) => sum + a.amount, 0);
    }

    /**
     * Get total aid received by a nation
     * @param {string} nationId
     * @returns {number}
     */
    getTotalAidReceived(nationId) {
        const aidIds = this.nationAidIndex.get(nationId) || [];
        return aidIds
            .map(id => this.aidHistory.get(id))
            .filter(Boolean)
            .filter(aid => aid.toNationId === nationId)
            .reduce((sum, a) => sum + a.amount, 0);
    }
}

// Create global aid system instance
const AidSystem_Instance = new AidSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AidSystem, AidSystem_Instance };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.AidSystem = AidSystem_Instance;
    window.aidSystem = AidSystem_Instance;
}
