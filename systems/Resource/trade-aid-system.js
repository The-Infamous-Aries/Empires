/**
 * Trade & Aid System - Unified nation-to-nation resource/currency exchange
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Handles aid and trade proposals between nations with shared slot management.
 * Each nation gets 5 slots (shared between aid and trade). Slots free after
 * a 3-day falloff period following acceptance or rejection.
 *
 * Aid limits:
 *   - Max 1000 units per resource stage
 *   - Max 5000 total resource units across all stages/types
 *   - Max $25M currency
 *
 * Trade limits:
 *   - Max 5000 units per resource type (across all stages)
 *   - Max 25000 total resource units across all types/stages
 *   - Max $25M currency
 *
 * Currency conversion via World Bank rates when sender/receiver use different currencies.
 */

const _global = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {});

const SLOT_COUNT = 5;
const FALLOFF_DAYS = 3;
const FALLOFF_MS = FALLOFF_DAYS * 24 * 60 * 60 * 1000;

// Aid limits
const AID_MAX_PER_STAGE = 1000;
const AID_MAX_TOTAL_RESOURCES = 5000;
const AID_MAX_CURRENCY = 25_000_000;

// Trade limits - none on resources or currency per user request
const TRADE_MAX_CURRENCY = null;

const MINERALS = ['steel', 'bronze', 'lead', 'aluminum', 'copper', 'uranium', 'gasoline'];
const STAGES = ['raw', 'stage1', 'stage2', 'stage3', 'manufactured'];
const FLAT_RESOURCES = ['food', 'water'];

class TradeAidSystem {
    constructor() {
        this.slots = {}; // { [nationId]: { [slotId]: slotData } }
        this.isInitialized = false;
    }

    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log('TradeAidSystem initialized');
        _global.EventBus?.emit('trade_aid_system_initialized');
    }

    // Restore slots from saved state
    restore(savedSlots) {
        if (savedSlots && typeof savedSlots === 'object') {
            this.slots = savedSlots;
        } else {
            this.slots = {};
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // SLOT MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════

    _ensureNationSlots(nationId) {
        if (!this.slots[nationId]) {
            this.slots[nationId] = {};
        }
        return this.slots[nationId];
    }

    _generateSlotId() {
        return `ta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _countActiveSlots(nationId) {
        const nationSlots = this.slots[nationId];
        if (!nationSlots) return 0;
        let count = 0;
        for (const slot of Object.values(nationSlots)) {
            if (slot.status === 'pending' || slot.status === 'countered' || slot.status === 'accepted' || slot.status === 'returning') {
                count++;
            }
        }
        return count;
    }

    _getFreeSlot(nationId) {
        const nationSlots = this.slots[nationId];
        if (!nationSlots) return null;
        const now = Date.now();
        for (const [slotId, slot] of Object.entries(nationSlots)) {
            if (slot.status === 'completed' || slot.status === 'falling_off' || slot.status === 'rejected' || slot.status === 'returning') {
                if (slot.falloffAt && now >= slot.falloffAt) {
                    delete nationSlots[slotId];
                    return slotId;
                }
            }
        }
        return null;
    }

    _allocateSlot(nationId) {
        const nationSlots = this._ensureNationSlots(nationId);
        const freeSlot = this._getFreeSlot(nationId);
        if (freeSlot) return freeSlot;
        const activeCount = this._countActiveSlots(nationId);
        if (activeCount >= SLOT_COUNT) return null;
        const slotId = this._generateSlotId();
        nationSlots[slotId] = { id: slotId };
        return slotId;
    }

    // ═══════════════════════════════════════════════════════════════════
    // RESOURCE VALIDATION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Validate resource amounts for aid.
     * resources: { [resourceKey]: { [stage]: number } } or { [flatKey]: number }
     * Returns { valid, reasons }
     */
    _validateAidResources(resources) {
        const reasons = [];
        let totalUnits = 0;

        for (const [key, value] of Object.entries(resources)) {
            if (key === 'money') continue;

            const isMineral = MINERALS.includes(key);
            if (isMineral) {
                // Staged resource: { raw: N, stage1: N, ... }
                for (const [stage, amount] of Object.entries(value)) {
                    if (!STAGES.includes(stage)) {
                        reasons.push(`Invalid stage '${stage}' for ${key}`);
                        continue;
                    }
                    if (!Number.isInteger(amount) || amount < 0) {
                        reasons.push(`Invalid amount for ${key}-${stage}`);
                        continue;
                    }
                    if (amount > AID_MAX_PER_STAGE) {
                        reasons.push(`${key}-${stage}: max ${AID_MAX_PER_STAGE} units per stage`);
                    }
                    totalUnits += amount;
                }
            } else if (FLAT_RESOURCES.includes(key)) {
                // Flat resource: food, water
                const amount = typeof value === 'number' ? value : (value.amount || 0);
                if (!Number.isInteger(amount) || amount < 0) {
                    reasons.push(`Invalid amount for ${key}`);
                    continue;
                }
                if (amount > AID_MAX_PER_STAGE) {
                    reasons.push(`${key}: max ${AID_MAX_PER_STAGE} units`);
                }
                totalUnits += amount;
            } else {
                reasons.push(`Unknown resource '${key}'`);
            }
        }

        if (totalUnits > AID_MAX_TOTAL_RESOURCES) {
            reasons.push(`Total resources: max ${AID_MAX_TOTAL_RESOURCES} units (requested ${totalUnits})`);
        }

        return { valid: reasons.length === 0, reasons, totalUnits };
    }

    /**
     * Validate resource amounts for trade.
     * resources: { [resourceKey]: { [stage]: number } } or { [flatKey]: number }
     * Returns { valid, reasons }
     */
    _validateTradeResources(resources) {
        const reasons = [];
        const typeTotals = {}; // resource type -> total across stages
        let grandTotal = 0;

        for (const [key, value] of Object.entries(resources)) {
            if (key === 'money') continue;

            const isMineral = MINERALS.includes(key);
            if (isMineral) {
                let typeTotal = 0;
                for (const [stage, amount] of Object.entries(value)) {
                    if (!STAGES.includes(stage)) {
                        reasons.push(`Invalid stage '${stage}' for ${key}`);
                        continue;
                    }
                    if (!Number.isInteger(amount) || amount < 0) {
                        reasons.push(`Invalid amount for ${key}-${stage}`);
                        continue;
                    }
                    typeTotal += amount;
                    grandTotal += amount;
                }
                typeTotals[key] = typeTotal;
            } else if (FLAT_RESOURCES.includes(key)) {
                const amount = typeof value === 'number' ? value : (value.amount || 0);
                if (!Number.isInteger(amount) || amount < 0) {
                    reasons.push(`Invalid amount for ${key}`);
                    continue;
                }
                typeTotals[key] = amount;
                grandTotal += amount;
            } else {
                reasons.push(`Unknown resource '${key}'`);
            }
        }

        return { valid: reasons.length === 0, reasons, grandTotal };
    }

    // ═══════════════════════════════════════════════════════════════════
    // CURRENCY CONVERSION
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Convert currency amount from one currency to another using World Bank rates.
     * @param {number} amount - Amount in sender's currency
     * @param {string} fromCurrency - Sender's currency key
     * @param {string} toCurrency - Receiver's currency key
     * @param {object} world - World instance (for currency rates)
     * @returns {number} Converted amount
     */
    _convertCurrency(amount, fromCurrency, toCurrency, world) {
        if (fromCurrency === toCurrency) return amount;
        const fromRate = world?.getCurrencyRate?.(fromCurrency) ?? 100;
        const toRate = world?.getCurrencyRate?.(toCurrency) ?? 100;
        const moneyValue = amount * fromRate;
        return Math.floor(moneyValue / toRate);
    }

    // ═══════════════════════════════════════════════════════════════════
    // AID
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Propose aid from one nation to another.
     * @param {object} world - World instance
     * @param {string} fromNationId - Sender nation ID
     * @param {string} toNationId - Receiver nation ID
     * @param {object} sending - { money: number, resources: { ... } }
     * @returns {object} { success, slotId, error }
     */
    proposeAid(world, fromNationId, toNationId, sending) {
        const fromNation = world.nation(fromNationId)?.nation;
        const toNation = world.nation(toNationId)?.nation;
        if (!fromNation || !toNation) {
            return { success: false, error: 'Nation not found' };
        }
        if (fromNationId === toNationId) {
            return { success: false, error: 'Cannot send aid to yourself' };
        }

        // Check slot availability
        const slotId = this._allocateSlot(fromNationId);
        if (!slotId) {
            return { success: false, error: `All ${SLOT_COUNT} aid/trade slots are occupied` };
        }

        // Validate currency
        const money = Number(sending.money) || 0;
        if (money < 0) {
            return { success: false, error: 'Invalid currency amount' };
        }
        if (money > AID_MAX_CURRENCY) {
            return { success: false, error: `Max $${AID_MAX_CURRENCY.toLocaleString()} currency per aid` };
        }

        // Validate resources
        const resources = sending.resources || {};
        const resValidation = this._validateAidResources(resources);
        if (!resValidation.valid) {
            return { success: false, error: resValidation.reasons.join('; ') };
        }

        // Check sender affordability
        const fromCurrency = fromNation.currency || 'usd';
        const toCurrency = toNation.currency || 'usd';

        let convertedMoney = money;
        if (fromCurrency !== toCurrency) {
            convertedMoney = this._convertCurrency(money, fromCurrency, toCurrency, world);
        }

        // Check sender has enough money in their currency
        if (money > 0 && fromNation.money < money) {
            return { success: false, error: 'Insufficient funds' };
        }

        // Check sender has enough resources
        for (const [key, value] of Object.entries(resources)) {
            if (key === 'money') continue;
            const isMineral = MINERALS.includes(key);
            if (isMineral) {
                for (const [stage, amount] of Object.entries(value)) {
                    if (amount > 0) {
                        const compoundKey = `${key}-${stage}`;
                        const has = world.resourceSystem?.getResourceAmount?.(fromNation, compoundKey) ?? 0;
                        if (has < amount) {
                            return { success: false, error: `Not enough ${compoundKey}` };
                        }
                    }
                }
            } else if (FLAT_RESOURCES.includes(key)) {
                const amount = typeof value === 'number' ? value : (value.amount || 0);
                if (amount > 0) {
                    const has = world.resourceSystem?.getResourceAmount?.(fromNation, key) ?? 0;
                    if (has < amount) {
                        return { success: false, error: `Not enough ${key}` };
                    }
                }
            }
        }

        // Deduct from sender immediately (held in escrow until accepted)
        if (money > 0) {
            fromNation.money -= money;
        }
        for (const [key, value] of Object.entries(resources)) {
            if (key === 'money') continue;
            const isMineral = MINERALS.includes(key);
            if (isMineral) {
                for (const [stage, amount] of Object.entries(value)) {
                    if (amount > 0) {
                        const compoundKey = `${key}-${stage}`;
                        world.resourceSystem.deductResource(fromNation, compoundKey, amount);
                    }
                }
            } else if (FLAT_RESOURCES.includes(key)) {
                const amount = typeof value === 'number' ? value : (value.amount || 0);
                if (amount > 0) {
                    world.resourceSystem.deductResource(fromNation, key, amount);
                }
            }
        }

        const now = Date.now();
        const slotData = {
            id: slotId,
            type: 'aid',
            fromNationId,
            toNationId,
            fromCurrency,
            toCurrency,
            sending: {
                money,
                resources: { ...resources },
                convertedMoney,
            },
            receiving: null,
            status: 'pending',
            createdAt: now,
            respondedAt: null,
            acceptedAt: null,
            counterOffer: null,
            canCounter: false,
            falloffAt: null,
        };

        this._ensureNationSlots(fromNationId)[slotId] = slotData;

        return { success: true, slotId };
    }

    /**
     * Respond to an aid proposal (accept/reject).
     * @param {object} world - World instance
     * @param {string} slotId - Slot ID
     * @param {string} respondingNationId - Nation responding (must be receiver)
     * @param {boolean} accept - True to accept, false to reject
     * @returns {object} { success, error }
     */
    respondToAid(world, slotId, respondingNationId, accept) {
        const slot = this._findSlot(slotId);
        if (!slot) {
            return { success: false, error: 'Trade/aid slot not found' };
        }
        if (slot.type !== 'aid') {
            return { success: false, error: 'Slot is not an aid proposal' };
        }
        if (slot.toNationId !== respondingNationId) {
            return { success: false, error: 'Only the receiver can respond to aid' };
        }
        if (slot.status !== 'pending') {
            return { success: false, error: `Aid is already ${slot.status}` };
        }

        const now = Date.now();
        const toNation = world.nation(respondingNationId)?.nation;
        const fromNation = world.nation(slot.fromNationId)?.nation;
        if (!toNation || !fromNation) {
            return { success: false, error: 'Nation not found' };
        }

        slot.respondedAt = now;

        if (accept) {
            const { money, resources: sendingResources, convertedMoney } = slot.sending;

            if (convertedMoney > 0) {
                toNation.money += convertedMoney;
            }

            for (const [key, value] of Object.entries(sendingResources)) {
                if (key === 'money') continue;
                const isMineral = MINERALS.includes(key);
                if (isMineral) {
                    for (const [stage, amount] of Object.entries(value)) {
                        if (amount > 0) {
                            const compoundKey = `${key}-${stage}`;
                            world.resourceSystem.addResource(toNation, compoundKey, amount);
                        }
                    }
                } else if (FLAT_RESOURCES.includes(key)) {
                    const amount = typeof value === 'number' ? value : (value.amount || 0);
                    if (amount > 0) {
                        world.resourceSystem.addResource(toNation, key, amount);
                    }
                }
            }

            slot.status = 'accepted';
            slot.acceptedAt = now;
            slot.falloffAt = now + FALLOFF_MS;
        } else {
            const { money, resources } = slot.sending;

            if (money > 0) {
                fromNation.money += money;
            }
            for (const [key, value] of Object.entries(resources)) {
                if (key === 'money') continue;
                const isMineral = MINERALS.includes(key);
                if (isMineral) {
                    for (const [stage, amount] of Object.entries(value)) {
                        if (amount > 0) {
                            const compoundKey = `${key}-${stage}`;
                            world.resourceSystem.addResource(fromNation, compoundKey, amount);
                        }
                    }
                } else if (FLAT_RESOURCES.includes(key)) {
                    const amount = typeof value === 'number' ? value : (value.amount || 0);
                    if (amount > 0) {
                        world.resourceSystem.addResource(fromNation, key, amount);
                    }
                }
            }

            slot.status = 'rejected';
            slot.falloffAt = now + FALLOFF_MS;
        }

        return { success: true };
    }

    // ═══════════════════════════════════════════════════════════════════
    // TRADE
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Propose a trade between two nations.
     * @param {object} world - World instance
     * @param {string} fromNationId - Sender nation ID
     * @param {string} toNationId - Receiver nation ID
     * @param {object} sending - { money: number, resources: { ... } } what sender gives
     * @param {object} receiving - { money: number, resources: { ... } } what sender wants
     * @returns {object} { success, slotId, error }
     */
    proposeTrade(world, fromNationId, toNationId, sending, receiving) {
        const fromNation = world.nation(fromNationId)?.nation;
        const toNation = world.nation(toNationId)?.nation;
        if (!fromNation || !toNation) {
            return { success: false, error: 'Nation not found' };
        }
        if (fromNationId === toNationId) {
            return { success: false, error: 'Cannot trade with yourself' };
        }

        // Check slot availability
        const slotId = this._allocateSlot(fromNationId);
        if (!slotId) {
            return { success: false, error: `All ${SLOT_COUNT} aid/trade slots are occupied` };
        }

        // Validate sending resources
        const sendRes = sending.resources || {};
        const sendValidation = this._validateTradeResources(sendRes);
        if (!sendValidation.valid) {
            return { success: false, error: `Sending: ${sendValidation.reasons.join('; ')}` };
        }

        // Validate receiving resources
        const recvRes = receiving.resources || {};
        const recvValidation = this._validateTradeResources(recvRes);
        if (!recvValidation.valid) {
            return { success: false, error: `Receiving: ${recvValidation.reasons.join('; ')}` };
        }

        // Validate currency
        const sendMoney = Number(sending.money) || 0;
        const recvMoney = Number(receiving.money) || 0;

        const fromCurrency = fromNation.currency || 'usd';
        const toCurrency = toNation.currency || 'usd';

        // Check sender affordability for what they're sending
        if (sendMoney > 0 && fromNation.money < sendMoney) {
            return { success: false, error: 'Insufficient funds for sending currency' };
        }

        for (const [key, value] of Object.entries(sendRes)) {
            if (key === 'money') continue;
            const isMineral = MINERALS.includes(key);
            if (isMineral) {
                for (const [stage, amount] of Object.entries(value)) {
                    if (amount > 0) {
                        const compoundKey = `${key}-${stage}`;
                        const has = world.resourceSystem?.getResourceAmount?.(fromNation, compoundKey) ?? 0;
                        if (has < amount) {
                            return { success: false, error: `Not enough ${compoundKey} to send` };
                        }
                    }
                }
            } else if (FLAT_RESOURCES.includes(key)) {
                const amount = typeof value === 'number' ? value : (value.amount || 0);
                if (amount > 0) {
                    const has = world.resourceSystem?.getResourceAmount?.(fromNation, key) ?? 0;
                    if (has < amount) {
                        return { success: false, error: `Not enough ${key} to send` };
                    }
                }
            }
        }

        // Deduct sender's sending side (held in escrow)
        if (sendMoney > 0) {
            fromNation.money -= sendMoney;
        }
        for (const [key, value] of Object.entries(sendRes)) {
            if (key === 'money') continue;
            const isMineral = MINERALS.includes(key);
            if (isMineral) {
                for (const [stage, amount] of Object.entries(value)) {
                    if (amount > 0) {
                        const compoundKey = `${key}-${stage}`;
                        world.resourceSystem.deductResource(fromNation, compoundKey, amount);
                    }
                }
            } else if (FLAT_RESOURCES.includes(key)) {
                const amount = typeof value === 'number' ? value : (value.amount || 0);
                if (amount > 0) {
                    world.resourceSystem.deductResource(fromNation, key, amount);
                }
            }
        }

        const now = Date.now();
        const slotData = {
            id: slotId,
            type: 'trade',
            fromNationId,
            toNationId,
            fromCurrency,
            toCurrency,
            sending: {
                money: sendMoney,
                resources: { ...sendRes },
            },
            receiving: {
                money: recvMoney,
                resources: { ...recvRes },
            },
            status: 'pending',
            createdAt: now,
            respondedAt: null,
            acceptedAt: null,
            counterOffer: null,
            canCounter: true,
            falloffAt: null,
        };

        this._ensureNationSlots(fromNationId)[slotId] = slotData;

        return { success: true, slotId };
    }

    /**
     * Respond to a trade proposal (accept/reject/counter).
     * @param {object} world - World instance
     * @param {string} slotId - Slot ID
     * @param {string} respondingNationId - Nation responding (must be receiver)
     * @param {boolean} accept - True to accept, false to reject
     * @param {object|null} counterOffer - { sending, receiving } if countering
     * @returns {object} { success, error }
     */
    respondToTrade(world, slotId, respondingNationId, accept, counterOffer = null) {
        const slot = this._findSlot(slotId);
        if (!slot) {
            return { success: false, error: 'Trade/aid slot not found' };
        }
        if (slot.type !== 'trade') {
            return { success: false, error: 'Slot is not a trade proposal' };
        }
        if (slot.toNationId !== respondingNationId) {
            return { success: false, error: 'Only the receiver can respond to trade' };
        }
        if (slot.status !== 'pending' && slot.status !== 'countered') {
            return { success: false, error: `Trade is already ${slot.status}` };
        }

        const now = Date.now();
        const toNation = world.nation(respondingNationId)?.nation;
        const fromNation = world.nation(slot.fromNationId)?.nation;
        if (!toNation || !fromNation) {
            return { success: false, error: 'Nation not found' };
        }

        slot.respondedAt = now;

        if (accept) {
            const terms = slot.counterOffer || {
                sending: slot.sending,
                receiving: slot.receiving,
            };

            const toSendMoney = terms.receiving.money || 0;
            const toSendRes = terms.receiving.resources || {};
            const fromSendMoney = terms.sending.money || 0;
            const fromSendRes = terms.sending.resources || {};

            if (fromSendMoney > 0) {
                const converted = this._convertCurrency(fromSendMoney, slot.fromCurrency, slot.toCurrency, world);
                toNation.money += converted;
            }
            for (const [key, value] of Object.entries(fromSendRes)) {
                if (key === 'money') continue;
                const isMineral = MINERALS.includes(key);
                if (isMineral) {
                    for (const [stage, amount] of Object.entries(value)) {
                        if (amount > 0) {
                            const compoundKey = `${key}-${stage}`;
                            world.resourceSystem.addResource(toNation, compoundKey, amount);
                        }
                    }
                } else if (FLAT_RESOURCES.includes(key)) {
                    const amount = typeof value === 'number' ? value : (value.amount || 0);
                    if (amount > 0) {
                        world.resourceSystem.addResource(toNation, key, amount);
                    }
                }
            }

            if (toSendMoney > 0) {
                // Validate receiver (toNation) can afford their sending side before deducting
                if (toNation.money < toSendMoney) {
                    return { success: false, error: 'Insufficient funds for receiving currency' };
                }
                for (const [key, value] of Object.entries(toSendRes)) {
                    if (key === 'money') continue;
                    const isMineral = MINERALS.includes(key);
                    if (isMineral) {
                        for (const [stage, amount] of Object.entries(value)) {
                            if (amount > 0) {
                                const compoundKey = `${key}-${stage}`;
                                const has = world.resourceSystem?.getResourceAmount?.(toNation, compoundKey) ?? 0;
                                if (has < amount) {
                                    return { success: false, error: `Not enough ${compoundKey} to complete trade` };
                                }
                            }
                        }
                    } else if (FLAT_RESOURCES.includes(key)) {
                        const amount = typeof value === 'number' ? value : (value.amount || 0);
                        if (amount > 0) {
                            const has = world.resourceSystem?.getResourceAmount?.(toNation, key) ?? 0;
                            if (has < amount) {
                                return { success: false, error: `Not enough ${key} to complete trade` };
                            }
                        }
                    }
                }

                // Deduct receiver's sending side (escrowed at propose, now collected)
                toNation.money -= toSendMoney;
                for (const [key, value] of Object.entries(toSendRes)) {
                    if (key === 'money') continue;
                    const isMineral = MINERALS.includes(key);
                    if (isMineral) {
                        for (const [stage, amount] of Object.entries(value)) {
                            if (amount > 0) {
                                const compoundKey = `${key}-${stage}`;
                                world.resourceSystem.deductResource(toNation, compoundKey, amount);
                            }
                        }
                    } else if (FLAT_RESOURCES.includes(key)) {
                        const amount = typeof value === 'number' ? value : (value.amount || 0);
                        if (amount > 0) {
                            world.resourceSystem.deductResource(toNation, key, amount);
                        }
                    }
                }

                const converted = this._convertCurrency(toSendMoney, slot.toCurrency, slot.fromCurrency, world);
                fromNation.money += converted;
            }
            for (const [key, value] of Object.entries(toSendRes)) {
                if (key === 'money') continue;
                const isMineral = MINERALS.includes(key);
                if (isMineral) {
                    for (const [stage, amount] of Object.entries(value)) {
                        if (amount > 0) {
                            const compoundKey = `${key}-${stage}`;
                            world.resourceSystem.addResource(fromNation, compoundKey, amount);
                        }
                    }
                } else if (FLAT_RESOURCES.includes(key)) {
                    const amount = typeof value === 'number' ? value : (value.amount || 0);
                    if (amount > 0) {
                        world.resourceSystem.addResource(fromNation, key, amount);
                    }
                }
            }

            slot.status = 'accepted';
            slot.acceptedAt = now;
            slot.falloffAt = now + FALLOFF_MS;
            slot.counterOffer = null;
        } else if (counterOffer && slot.canCounter) {
            const counterSend = counterOffer.sending || {};
            const counterRecv = counterOffer.receiving || {};

            const counterSendRes = counterSend.resources || {};
            const counterRecvRes = counterRecv.resources || {};
            const sendVal = this._validateTradeResources(counterSendRes);
            const recvVal = this._validateTradeResources(counterRecvRes);
            if (!sendVal.valid) {
                return { success: false, error: `Counter sending: ${sendVal.reasons.join('; ')}` };
            }
            if (!recvVal.valid) {
                return { success: false, error: `Counter receiving: ${recvVal.reasons.join('; ')}` };
            }

            const counterSendMoney = Number(counterSend.money) || 0;
            const counterRecvMoney = Number(counterRecv.money) || 0;

            if (counterSendMoney > 0 && toNation.money < counterSendMoney) {
                return { success: false, error: 'Insufficient funds for counter offer' };
            }
            for (const [key, value] of Object.entries(counterSendRes)) {
                if (key === 'money') continue;
                const isMineral = MINERALS.includes(key);
                if (isMineral) {
                    for (const [stage, amount] of Object.entries(value)) {
                        if (amount > 0) {
                            const compoundKey = `${key}-${stage}`;
                            const has = world.resourceSystem?.getResourceAmount?.(toNation, compoundKey) ?? 0;
                            if (has < amount) {
                                return { success: false, error: `Not enough ${compoundKey} for counter offer` };
                            }
                        }
                    }
                } else if (FLAT_RESOURCES.includes(key)) {
                    const amount = typeof value === 'number' ? value : (value.amount || 0);
                    if (amount > 0) {
                        const has = world.resourceSystem?.getResourceAmount?.(toNation, key) ?? 0;
                        if (has < amount) {
                            return { success: false, error: `Not enough ${key} for counter offer` };
                        }
                    }
                }
            }

            if (counterSendMoney > 0) {
                toNation.money -= counterSendMoney;
            }
            for (const [key, value] of Object.entries(counterSendRes)) {
                if (key === 'money') continue;
                const isMineral = MINERALS.includes(key);
                if (isMineral) {
                    for (const [stage, amount] of Object.entries(value)) {
                        if (amount > 0) {
                            const compoundKey = `${key}-${stage}`;
                            world.resourceSystem.deductResource(toNation, compoundKey, amount);
                        }
                    }
                } else if (FLAT_RESOURCES.includes(key)) {
                    const amount = typeof value === 'number' ? value : (value.amount || 0);
                    if (amount > 0) {
                        world.resourceSystem.deductResource(toNation, key, amount);
                    }
                }
            }

            slot.status = 'countered';
            slot.counterOffer = {
                sending: { money: counterSendMoney, resources: { ...counterSendRes } },
                receiving: { money: counterRecvMoney, resources: { ...counterRecvRes } },
                fromNationId: respondingNationId,
                toNationId: slot.fromNationId,
                counterAt: now,
            };
            slot.canCounter = false;
        } else {
            const { money: sendMoney, resources: sendRes } = slot.sending;

            if (sendMoney > 0) {
                fromNation.money += sendMoney;
            }
            for (const [key, value] of Object.entries(sendRes)) {
                if (key === 'money') continue;
                const isMineral = MINERALS.includes(key);
                if (isMineral) {
                    for (const [stage, amount] of Object.entries(value)) {
                        if (amount > 0) {
                            const compoundKey = `${key}-${stage}`;
                            world.resourceSystem.addResource(fromNation, compoundKey, amount);
                        }
                    }
                } else if (FLAT_RESOURCES.includes(key)) {
                    const amount = typeof value === 'number' ? value : (value.amount || 0);
                    if (amount > 0) {
                        world.resourceSystem.addResource(fromNation, key, amount);
                    }
                }
            }

            slot.status = 'rejected';
            slot.falloffAt = now + FALLOFF_MS;
        }

        return { success: true };
    }

    /**
     * Original sender responds to a counter offer (accept/reject).
     * @param {object} world - World instance
     * @param {string} slotId - Slot ID
     * @param {string} respondingNationId - Original sender
     * @param {boolean} accept - True to accept counter, false to reject
     * @returns {object} { success, error }
     */
    respondToCounter(world, slotId, respondingNationId, accept) {
        const slot = this._findSlot(slotId);
        if (!slot) {
            return { success: false, error: 'Trade/aid slot not found' };
        }
        if (slot.type !== 'trade') {
            return { success: false, error: 'Slot is not a trade proposal' };
        }
        if (!slot.counterOffer) {
            return { success: false, error: 'No counter offer to respond to' };
        }
        if (slot.counterOffer.toNationId !== respondingNationId) {
            return { success: false, error: 'Only the original sender can respond to a counter offer' };
        }
        if (slot.status !== 'countered') {
            return { success: false, error: `Trade is already ${slot.status}` };
        }

        const now = Date.now();
        const counter = slot.counterOffer;
        const fromNation = world.nation(slot.fromNationId)?.nation;
        const toNation = world.nation(slot.toNationId)?.nation;
        if (!fromNation || !toNation) {
            return { success: false, error: 'Nation not found' };
        }

        slot.respondedAt = now;

        if (accept) {
            const counterSendMoney = counter.sending.money || 0;
            const counterSendRes = counter.sending.resources || {};
            const counterRecvMoney = counter.receiving.money || 0;
            const counterRecvRes = counter.receiving.resources || {};

            if (counterSendMoney > 0) {
                const converted = this._convertCurrency(counterSendMoney, slot.toCurrency, slot.fromCurrency, world);
                fromNation.money += converted;
            }
            for (const [key, value] of Object.entries(counterSendRes)) {
                if (key === 'money') continue;
                const isMineral = MINERALS.includes(key);
                if (isMineral) {
                    for (const [stage, amount] of Object.entries(value)) {
                        if (amount > 0) {
                            const compoundKey = `${key}-${stage}`;
                            world.resourceSystem.addResource(fromNation, compoundKey, amount);
                        }
                    }
                } else if (FLAT_RESOURCES.includes(key)) {
                    const amount = typeof value === 'number' ? value : (value.amount || 0);
                    if (amount > 0) {
                        world.resourceSystem.addResource(fromNation, key, amount);
                    }
                }
            }

            // Refund original sender escrow (slot.sending) — counter terms replace original
            const origSendMoney = slot.sending.money || 0;
            const origSendRes = slot.sending.resources || {};
            if (origSendMoney > 0) {
                fromNation.money += origSendMoney;
            }
            for (const [key, value] of Object.entries(origSendRes)) {
                if (key === 'money') continue;
                const isMineral = MINERALS.includes(key);
                if (isMineral) {
                    for (const [stage, amount] of Object.entries(value)) {
                        if (amount > 0) {
                            const compoundKey = `${key}-${stage}`;
                            world.resourceSystem.addResource(fromNation, compoundKey, amount);
                        }
                    }
                } else if (FLAT_RESOURCES.includes(key)) {
                    const amount = typeof value === 'number' ? value : (value.amount || 0);
                    if (amount > 0) {
                        world.resourceSystem.addResource(fromNation, key, amount);
                    }
                }
            }

            // Validate and deduct counter receiving side from fromNation (original sender)
            if (counterRecvMoney > 0 && fromNation.money < counterRecvMoney) {
                return { success: false, error: 'Insufficient funds for counter offer receiving' };
            }
            for (const [key, value] of Object.entries(counterRecvRes)) {
                if (key === 'money') continue;
                const isMineral = MINERALS.includes(key);
                if (isMineral) {
                    for (const [stage, amount] of Object.entries(value)) {
                        if (amount > 0) {
                            const compoundKey = `${key}-${stage}`;
                            const has = world.resourceSystem?.getResourceAmount?.(fromNation, compoundKey) ?? 0;
                            if (has < amount) {
                                return { success: false, error: `Not enough ${compoundKey} for counter offer receiving` };
                            }
                        }
                    }
                } else if (FLAT_RESOURCES.includes(key)) {
                    const amount = typeof value === 'number' ? value : (value.amount || 0);
                    if (amount > 0) {
                        const has = world.resourceSystem?.getResourceAmount?.(fromNation, key) ?? 0;
                        if (has < amount) {
                            return { success: false, error: `Not enough ${key} for counter offer receiving` };
                        }
                    }
                }
            }

            // Deduct counter receiving side from fromNation
            if (counterRecvMoney > 0) {
                fromNation.money -= counterRecvMoney;
            }
            for (const [key, value] of Object.entries(counterRecvRes)) {
                if (key === 'money') continue;
                const isMineral = MINERALS.includes(key);
                if (isMineral) {
                    for (const [stage, amount] of Object.entries(value)) {
                        if (amount > 0) {
                            const compoundKey = `${key}-${stage}`;
                            world.resourceSystem.deductResource(fromNation, compoundKey, amount);
                        }
                    }
                } else if (FLAT_RESOURCES.includes(key)) {
                    const amount = typeof value === 'number' ? value : (value.amount || 0);
                    if (amount > 0) {
                        world.resourceSystem.deductResource(fromNation, key, amount);
                    }
                }
            }

            if (counterRecvMoney > 0) {
                const converted = this._convertCurrency(counterRecvMoney, slot.fromCurrency, slot.toCurrency, world);
                toNation.money += converted;
            }
            for (const [key, value] of Object.entries(counterRecvRes)) {
                if (key === 'money') continue;
                const isMineral = MINERALS.includes(key);
                if (isMineral) {
                    for (const [stage, amount] of Object.entries(value)) {
                        if (amount > 0) {
                            const compoundKey = `${key}-${stage}`;
                            world.resourceSystem.addResource(toNation, compoundKey, amount);
                        }
                    }
                } else if (FLAT_RESOURCES.includes(key)) {
                    const amount = typeof value === 'number' ? value : (value.amount || 0);
                    if (amount > 0) {
                        world.resourceSystem.addResource(toNation, key, amount);
                    }
                }
            }

            slot.status = 'accepted';
            slot.acceptedAt = now;
            slot.falloffAt = now + FALLOFF_MS;
            slot.counterOffer = null;
        } else {
            const origSendMoney = slot.sending.money || 0;
            const origSendRes = slot.sending.resources || {};
            if (origSendMoney > 0) {
                fromNation.money += origSendMoney;
            }
            for (const [key, value] of Object.entries(origSendRes)) {
                if (key === 'money') continue;
                const isMineral = MINERALS.includes(key);
                if (isMineral) {
                    for (const [stage, amount] of Object.entries(value)) {
                        if (amount > 0) {
                            const compoundKey = `${key}-${stage}`;
                            world.resourceSystem.addResource(fromNation, compoundKey, amount);
                        }
                    }
                } else if (FLAT_RESOURCES.includes(key)) {
                    const amount = typeof value === 'number' ? value : (value.amount || 0);
                    if (amount > 0) {
                        world.resourceSystem.addResource(fromNation, key, amount);
                    }
                }
            }

            const counterSendMoney = counter.sending.money || 0;
            const counterSendRes = counter.sending.resources || {};
            if (counterSendMoney > 0) {
                toNation.money += counterSendMoney;
            }
            for (const [key, value] of Object.entries(counterSendRes)) {
                if (key === 'money') continue;
                const isMineral = MINERALS.includes(key);
                if (isMineral) {
                    for (const [stage, amount] of Object.entries(value)) {
                        if (amount > 0) {
                            const compoundKey = `${key}-${stage}`;
                            world.resourceSystem.addResource(toNation, compoundKey, amount);
                        }
                    }
                } else if (FLAT_RESOURCES.includes(key)) {
                    const amount = typeof value === 'number' ? value : (value.amount || 0);
                    if (amount > 0) {
                        world.resourceSystem.addResource(toNation, key, amount);
                    }
                }
            }

            slot.status = 'rejected';
            slot.falloffAt = now + FALLOFF_MS;
            slot.counterOffer = null;
        }

        return { success: true };
    }

    // ═══════════════════════════════════════════════════════════════════
    // QUERY / UTILITY
    // ═══════════════════════════════════════════════════════════════════

    _findSlot(slotId) {
        for (const nationId of Object.keys(this.slots)) {
            const slot = this.slots[nationId][slotId];
            if (slot) return slot;
        }
        return null;
    }

    getSlotsForNation(nationId) {
        const nationSlots = this.slots[nationId];
        if (!nationSlots) return [];
        return Object.values(nationSlots).filter(s =>
            s.fromNationId === nationId || s.toNationId === nationId
        );
    }

    getAvailableSlotCount(nationId) {
        const active = this._countActiveSlots(nationId);
        return Math.max(0, SLOT_COUNT - active);
    }

    processFalloffs(world) {
        const now = Date.now();
        const freed = [];

        for (const nationId of Object.keys(this.slots)) {
            const nationSlots = this.slots[nationId];
            for (const slotId of Object.keys(nationSlots)) {
                const slot = nationSlots[slotId];
                if (slot.falloffAt && now >= slot.falloffAt) {
                    if (slot.status === 'accepted') {
                        slot.status = 'completed';
                    } else if (slot.status === 'rejected') {
                        slot.status = 'returning';
                    }
                    freed.push({ slotId, nationId, status: slot.status });
                }
            }
        }

        return freed;
    }

    getPendingForNation(nationId) {
        const nationSlots = this.slots[nationId];
        if (!nationSlots) return [];
        return Object.values(nationSlots).filter(s =>
            (s.fromNationId === nationId || s.toNationId === nationId) &&
            (s.status === 'pending' || s.status === 'countered')
        );
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TradeAidSystem, SLOT_COUNT, FALLOFF_DAYS };
}

if (typeof window !== 'undefined') {
    window.TradeAidSystem = TradeAidSystem;
    window.tradeAidSystem = new TradeAidSystem();
}
