const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

/**
 * Tarot System
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Provides user-facing tarot card readings with two deck modes:
 *   - traditional: full 78-card deck (Major + Minor Arcana)
 *   - cat: 22 Major Arcana only (cat-themed imagery, same JSON meanings)
 *
 * Supports three reading types: 1-card ("The Moment"), 3-card ("The Journey"),
 * and 5-card ("The Crossroads").
 *
 * All randomness uses crypto.randomInt (cryptographically secure) — no Math.random.
 * Draws are without replacement within a single reading.
 * Reversals are determined per-card at ~50% probability.
 */

const TAROT_JSON_PATH = path.join(__dirname, "../../assets/images/Tarot/tarot-images.json");
const TRADITIONAL_IMG_DIR = path.join(__dirname, "../../assets/images/Tarot/cards");
const CAT_IMG_DIR = path.join(__dirname, "../../assets/images/Tarot/cats");

const CARD_COUNT_BY_TYPE = {
    single: 1,
    three: 3,
    five: 5,
};

const VALID_TYPES = Object.keys(CARD_COUNT_BY_TYPE);
const VALID_MODES = ["traditional", "cat"];

const SPREADS = {
    single: {
        name: "The Moment",
        theme: "Immediate focus, single message, daily draw",
        positions: [
            { id: "moment", label: "The Moment", meaning: "The single energy or focus present right now." },
        ],
    },
    three: {
        name: "The Journey",
        theme: "Narrative arc, cause → effect → potential",
        positions: [
            { id: "past", label: "Past", meaning: "What led here — the foundation." },
            { id: "present", label: "Present", meaning: "What is happening now — the core energy." },
            { id: "future", label: "Future", meaning: "Where things are heading — the likely outcome." },
        ],
    },
    five: {
        name: "The Crossroads",
        theme: "Deep dive, decision point, full picture",
        positions: [
            { id: "present", label: "Present", meaning: "Center of the matter." },
            { id: "challenge", label: "Challenge", meaning: "What blocks or opposes." },
            { id: "past", label: "Past", meaning: "Root cause — what brought this about." },
            { id: "future", label: "Future", meaning: "What is approaching." },
            { id: "outcome", label: "Outcome", meaning: "Likely result or recommended action." },
        ],
    },
};

/**
 * Fisher-Yates shuffle using secure random. Mutates array in place.
 */
function secureShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Pick a random element from an array using secure random.
 * Throws if array is empty or not an array.
 */
function securePick(array) {
    if (!Array.isArray(array) || array.length === 0) {
        throw new Error("securePick: array must be non-empty");
    }
    return array[crypto.randomInt(array.length)];
}

/**
 * Generate a unique reading ID: timestamp + secure random suffix.
 */
function generateReadingId() {
    const suffix = crypto.randomInt(1000000).toString().padStart(6, "0");
    return `${Date.now()}-${suffix}`;
}

/**
 * Return true/false with ~50% probability using secure random.
 */
function determineReversal() {
    return crypto.randomInt(2) === 0;
}

/**
 * Deep-normalize a card object: fix trailing-space keys, default missing fields,
 * return a cleaned deep copy. Does not mutate the input.
 */
function normalizeCard(card) {
    const normalized = {};

    // Copy all enumerable own keys, stripping trailing spaces
    for (const key of Object.keys(card)) {
        const cleanKey = key.replace(/\s+$/, "");
        normalized[cleanKey] = card[key];
    }

    // Ensure required fields exist with sane defaults
    if (typeof normalized.name !== "string") normalized.name = "Unknown Card";
    if (typeof normalized.number !== "string") normalized.number = "0";
    if (typeof normalized.arcana !== "string") normalized.arcana = "Major Arcana";
    if (typeof normalized.suit !== "string") normalized.suit = "Trump";
    if (typeof normalized.img !== "string") normalized.img = "";

    // meanings: { light: string[], shadow: string[] }
    if (!normalized.meanings || typeof normalized.meanings !== "object") {
        normalized.meanings = { light: [], shadow: [] };
    }
    if (!Array.isArray(normalized.meanings.light)) normalized.meanings.light = [];
    if (!Array.isArray(normalized.meanings.shadow)) normalized.meanings.shadow = [];

    // fortune_telling: array of strings
    if (!Array.isArray(normalized.fortune_telling)) normalized.fortune_telling = [];

    // keywords: array of strings
    if (!Array.isArray(normalized.keywords)) normalized.keywords = [];

    // Questions to Ask: array of strings (handle trailing-space key variants)
    if (!Array.isArray(normalized["Questions to Ask"])) {
        normalized["Questions to Ask"] = [];
    }

    // Optional string fields — default to empty string if missing
    for (const opt of [
        "Archetype",
        "Hebrew Alphabet",
        "Numerology",
        "Elemental",
        "Mythical/Spiritual",
        "Astrology",
        "Affirmation",
    ]) {
        if (typeof normalized[opt] !== "string") normalized[opt] = "";
    }

    return normalized;
}

class TarotSystem {
    constructor() {
        this.isInitialized = false;
        this.deck = [];
        this.readingHistory = new Map(); // userId -> ReadingResult[]
    }

    /**
     * Load JSON file, normalize keys, validate 78 cards, build master deck.
     * Throws on validation or parse failure.
     * @param {string} jsonPath - Path to tarot-images.json
     */
    init(jsonPath = TAROT_JSON_PATH) {
        let raw;
        try {
            raw = fs.readFileSync(jsonPath, "utf8");
        } catch (err) {
            throw new Error(`TarotSystem.init: cannot read JSON file at ${jsonPath}: ${err.message}`);
        }

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (err) {
            throw new Error(`TarotSystem.init: malformed JSON at ${jsonPath}: ${err.message}`);
        }

        if (!parsed || !Array.isArray(parsed.cards)) {
            throw new Error("TarotSystem.init: JSON must contain a 'cards' array");
        }

        const normalizedCards = parsed.cards.map((c) => normalizeCard(c));

        if (normalizedCards.length !== 78) {
            throw new Error(
                `TarotSystem.init: expected 78 cards, found ${normalizedCards.length}`,
            );
        }

        // Check for duplicate names
        const names = normalizedCards.map((c) => c.name);
        const dupNames = names.filter((name, idx) => names.indexOf(name) !== idx);
        if (dupNames.length > 0) {
            throw new Error(`TarotSystem.init: duplicate card names: ${[...new Set(dupNames)].join(", ")}`);
        }

        // Verify all traditional images exist at init; log warnings, don't crash
        const missingTraditional = [];
        for (const card of normalizedCards) {
            const imgPath = path.join(TRADITIONAL_IMG_DIR, card.img);
            if (!fs.existsSync(imgPath)) {
                missingTraditional.push(card.img);
            }
        }
        if (missingTraditional.length > 0) {
            console.warn(
                `TarotSystem.init: ${missingTraditional.length} traditional card image(s) missing: ${missingTraditional.join(", ")}`,
            );
        }

        this.deck = normalizedCards;
        this.isInitialized = true;
        console.log(`Tarot System initialized with ${this.deck.length} cards`);
    }

    /**
     * Return a shallow copy of the full card list (read-only).
     */
    getDeck() {
        return [...this.deck];
    }

    /**
     * Return a new array of cards where arcana === "Major Arcana" (22 cards).
     */
    getMajorArcana() {
        return this.deck.filter((card) => card.arcana === "Major Arcana");
    }

    /**
     * Look up a single card object by exact name.
     * Returns the normalized card object or undefined.
     */
    getCardByName(name) {
        return this.deck.find((card) => card.name === name);
    }

    /**
     * Build a fresh shuffled deck copy based on mode.
     * Master deck is never mutated.
     * @param {'traditional' | 'cat'} mode
     * @returns {Array} shuffled copy of cards
     */
    buildDeckCopy(mode) {
        if (!VALID_MODES.includes(mode)) {
            throw new Error(
                `TarotSystem.buildDeckCopy: invalid mode '${mode}'. Must be 'traditional' or 'cat'.`,
            );
        }

        let source;
        if (mode === "cat") {
            source = this.getMajorArcana();
        } else {
            source = this.getDeck();
        }

        // Deep copy each card so the master deck is never touched
        const copy = source.map((card) => JSON.parse(JSON.stringify(card)));
        return secureShuffle(copy);
    }

    /**
     * Pop one card from a shuffled deck copy (no replacement).
     * Returns undefined if deck is empty.
     */
    drawCard(deckCopy) {
        if (!Array.isArray(deckCopy) || deckCopy.length === 0) return undefined;
        return deckCopy.pop();
    }

    /**
     * Return image path for a card based on mode.
     * Traditional: assets/images/Tarot/cards/{card.img}
     * Cat: assets/images/Tarot/cats/cat-{card.img}, falls back to traditional if missing.
     * @param {object} card - normalized card object
     * @param {'traditional' | 'cat'} mode
     * @returns {string} relative image path from project root
     */
    getImagePath(card, mode) {
        if (mode === "cat") {
            const catImg = `cat-${card.img}`;
            const catPath = path.join(CAT_IMG_DIR, catImg);
            if (fs.existsSync(catPath)) {
                return `assets/images/Tarot/cats/${catImg}`;
            }
            // Fall back to traditional image if cat image missing
            return `assets/images/Tarot/cards/${card.img}`;
        }
        return `assets/images/Tarot/cards/${card.img}`;
    }

    /**
     * Select upright/reversed meaning from arrays, pick fortune_telling phrase,
     * pick keywords, build per-card result object. Does not mutate input card.
     * @param {object} card - normalized card object
     * @param {string} position - position label (e.g. "Past", "Present")
     * @param {string} positionMeaning - what this position represents
     * @param {boolean} isReversed
     * @returns {object} per-card reading result
     */
    interpretCard(card, position, positionMeaning, isReversed) {
        const meaningsArray = isReversed
            ? (card.meanings && card.meanings.shadow) || []
            : (card.meanings && card.meanings.light) || [];

        let meaning;
        if (meaningsArray.length > 0) {
            meaning = securePick(meaningsArray);
        } else if (card.fortune_telling && card.fortune_telling.length > 0) {
            meaning = securePick(card.fortune_telling);
        } else {
            meaning = "No meaning recorded for this card.";
        }

        const fortuneTelling =
            card.fortune_telling && card.fortune_telling.length > 0
                ? securePick(card.fortune_telling)
                : "The card speaks without words.";

        const keywords = Array.isArray(card.keywords) ? [...card.keywords] : [];
        const questionsToAsk =
            Array.isArray(card["Questions to Ask"])
                ? [...card["Questions to Ask"]]
                : [];

        return {
            position,
            positionMeaning,
            card: { ...card }, // deep-ish copy
            isReversed,
            orientation: isReversed ? "reversed" : "upright",
            meaning,
            keywords,
            fortuneTelling,
            questionsToAsk,
        };
    }

    /**
     * Main entry — validate type + mode, build fresh deck copy, draw N cards,
     * interpret each, synthesize, return result object.
     * @param {'single' | 'three' | 'five'} type
     * @param {'traditional' | 'cat'} mode
     * @param {string|undefined} userId
     * @returns {object} ReadingResult
     */
    getReading(type, mode, userId) {
        if (!VALID_TYPES.includes(type)) {
            throw new Error(
                `TarotSystem.getReading: invalid reading type '${type}'. Must be 'single', 'three', or 'five'.`,
            );
        }

        if (!VALID_MODES.includes(mode)) {
            throw new Error(
                `TarotSystem.getReading: invalid deck mode '${mode}'. Must be 'traditional' or 'cat'.`,
            );
        }

        if (!this.isInitialized) {
            throw new Error("TarotSystem.getReading: system not initialized. Call init() first.");
        }

        const cardCount = CARD_COUNT_BY_TYPE[type];
        const spread = SPREADS[type];

        if (cardCount > this.deck.length) {
            throw new Error(
                `TarotSystem.getReading: requested ${cardCount} cards but deck only has ${this.deck.length}.`,
            );
        }

        // For cat mode, ensure we have enough Major Arcana
        let majorDeckSize = this.deck.length;
        if (mode === "cat") {
            const majorCards = this.getMajorArcana();
            majorDeckSize = majorCards.length;
            if (cardCount > majorDeckSize) {
                throw new Error(
                    `TarotSystem.getReading: cat mode requires ${cardCount} Major Arcana cards but only ${majorDeckSize} available.`,
                );
            }
        }

        const deckCopy = this.buildDeckCopy(mode);
        const drawnCards = [];
        for (let i = 0; i < cardCount; i++) {
            const card = this.drawCard(deckCopy);
            if (!card) {
                throw new Error(
                    `TarotSystem.getReading: ran out of cards while drawing card ${i + 1} of ${cardCount}.`,
                );
            }
            drawnCards.push(card);
        }

        const positionDefs = spread.positions.slice(0, cardCount);

        const cardResults = drawnCards.map((card, idx) => {
            const posDef = positionDefs[idx] || {
                label: `Position ${idx + 1}`,
                meaning: "",
            };
            const isReversed = determineReversal();
            return this.interpretCard(card, posDef.label, posDef.meaning, isReversed);
        });

        // Attach image paths after interpretation
        for (const result of cardResults) {
            result.imagePath = this.getImagePath(result.card, mode);
        }

        const synthesis = this.synthesizeReading({
            type,
            mode,
            spreadName: spread.name,
            theme: spread.theme,
            cards: cardResults,
        });

        const advice = this.generateAdvice(cardResults, spread);

        const reading = {
            readingId: generateReadingId(),
            userId,
            type,
            mode,
            spreadName: spread.name,
            theme: spread.theme,
            timestamp: Date.now(),
            deckSize: mode === "cat" ? majorDeckSize : this.deck.length,
            cardCount,
            cards: cardResults,
            synthesis,
            advice,
        };

        // Store in history
        if (userId) {
            let history = this.readingHistory.get(userId);
            if (!history) {
                history = [];
                this.readingHistory.set(userId, history);
            }
            history.push(reading);
        }

        return reading;
    }

    /**
     * Combine all cards into a cohesive narrative paragraph referencing positions,
     * card names, orientations, and how they relate.
     * @param {object} reading - partial reading object with cards array
     * @returns {string} narrative synthesis
     */
    synthesizeReading(reading) {
        const { cards, type, mode } = reading;
        const deckLabel = mode === "cat" ? "Cat Arcana (Major Arcana only)" : "Traditional Tarot";

        if (cards.length === 0) {
            return "The cards are silent. No reading was drawn.";
        }

        const parts = [];

        // Opening
        parts.push(
            `A ${type}-card reading from the ${deckLabel} deck. The cards have been shuffled and drawn without replacement; each card carries its own energy, upright or reversed.`,
        );

        // Describe each card in position order
        for (const c of cards) {
            const orient = c.isReversed ? "reversed" : "upright";
            parts.push(
                `In the ${c.position} position (${c.positionMeaning}), the ${c.card.name} appears ${orient}. ${c.meaning}`,
            );
        }

        // Synthesis sentence connecting them
        const uprightCount = cards.filter((c) => !c.isReversed).length;
        const reversedCount = cards.filter((c) => c.isReversed).length;

        let connection = "";
        if (cards.length === 1) {
            connection = "This single card speaks to the energy of the moment — heed its message.";
        } else if (reversedCount === 0) {
            connection = "All cards appear upright, suggesting clear, forward-moving energy with little internal resistance.";
        } else if (uprightCount === 0) {
            connection = "All cards appear reversed, indicating blocked, internalized, or delayed energy — look inward before acting.";
        } else {
            connection = `The mix of ${uprightCount} upright and ${reversedCount} reversed card${reversedCount !== 1 ? "s" : ""} shows a balance of outward manifestation and inner work.`;
        }

        parts.push(connection);

        return parts.join(" ");
    }

    /**
     * Generate closing guidance paragraph based on card results and spread.
     * @param {Array} cardResults
     * @param {object} spread
     * @returns {string}
     */
    generateAdvice(cardResults, spread) {
        const uprightCards = cardResults.filter((c) => !c.isReversed);
        const reversedCards = cardResults.filter((c) => c.isReversed);

        let advice = "";

        if (cardResults.length === 1) {
            const c = cardResults[0];
            advice = `Focus on the energy of the ${c.card.name} (${c.orientation}). ${c.fortuneTelling}`;
        } else {
            advice = `The ${spread.name} spread reveals a situation in motion. `;
            if (uprightCards.length > 0) {
                const names = uprightCards.map((c) => c.card.name).join(", ");
                advice += `Upright cards (${names}) show energy to embrace and move forward with. `;
            }
            if (reversedCards.length > 0) {
                const names = reversedCards.map((c) => c.card.name).join(", ");
                advice += `Reversed cards (${names}) suggest areas to pause, reflect on, or work through internally before proceeding. `;
            }
            advice += "Trust the cards, but trust your own discernment most of all.";
        }

        return advice;
    }

    /**
     * Flatten reading into UI-friendly fields (image paths, display text, orientations, deck mode).
     * @param {object} reading
     * @returns {object}
     */
    formatReadingForUI(reading) {
        return {
            readingId: reading.readingId,
            userId: reading.userId,
            type: reading.type,
            mode: reading.mode,
            spreadName: reading.spreadName,
            theme: reading.theme,
            timestamp: reading.timestamp,
            deckSize: reading.deckSize,
            cardCount: reading.cardCount,
            synthesis: reading.synthesis,
            advice: reading.advice,
            cards: reading.cards.map((c) => ({
                position: c.position,
                positionMeaning: c.positionMeaning,
                cardName: c.card.name,
                cardNumber: c.card.number,
                arcana: c.card.arcana,
                suit: c.card.suit,
                isReversed: c.isReversed,
                orientation: c.orientation,
                meaning: c.meaning,
                keywords: c.keywords,
                fortuneTelling: c.fortuneTelling,
                imagePath: c.imagePath,
                questionsToAsk: c.questionsToAsk,
            })),
        };
    }

    /**
     * Return past readings array for a user (empty array if none).
     * @param {string|undefined} userId
     * @returns {Array}
     */
    getReadingHistory(userId) {
        if (!userId) return [];
        return this.readingHistory.get(userId) || [];
    }
}

module.exports = TarotSystem;
