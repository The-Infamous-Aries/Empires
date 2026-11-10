# Tarot System

User-facing tarot card reading feature with two deck modes (Traditional 78-card and Cat Arcana 22-card Major Arcana) supporting three reading types (1-card, 3-card, 5-card). All randomness is cryptographically secure; draws are without replacement within a single reading; reversals are determined per-card at ~50% probability.

## Overview

| Item | Value |
|------|-------|
| **System class:** | `TarotSystem` |
| **Source file:** | `systems/Other/tarot-system.js` |
| **Initialized in:** | `server.js` (at server startup) |
| **API endpoint:** | `POST /api/tarot/read` |
| **Card data:** | `assets/images/Tarot/tarot-images.json` (78 cards) |
| **Traditional images:** | `assets/images/Tarot/cards/*.jpg` (78 files) |
| **Cat images:** | `assets/images/Tarot/cats/*.jpg` (22 files — to be added) |
| **Deck modes:** | `traditional` (78 cards), `cat` (22 Major Arcana only) |
| **Reading types:** | `single` (1 card), `three` (3 cards), `five` (5 cards) |
| **Randomness:** | `crypto.randomInt()` — cryptographically secure, no `Math.random()` |
| **Draws:** | Without replacement within a single reading |
| **Reversals:** | ~50% per card, determined independently |
| **History:** | In-memory `Map` keyed by userId (resets on server restart) |

---

## Deck Modes

Two deck modes share the same JSON card data (`tarot-images.json`) for all meanings, definitions, and interpretations. Only the card pool and image source differ.

| Aspect | Traditional Mode | Cat Mode |
|--------|-----------------|----------|
| Card pool | All 78 cards (Major + Minor Arcana) | 22 Major Arcana only |
| Image folder | `assets/images/Tarot/cards/` | `assets/images/Tarot/cats/` |
| Image filename | `{card.img}` (e.g. `m00.jpg`, `c01.jpg`, `p14.jpg`) | `cat-{card.img}` (e.g. `cat-m00.jpg`) |
| Missing image fallback | N/A | Falls back to traditional `cards/` image |
| Meanings source | `tarot-images.json` (same file) | `tarot-images.json` (same file) |
| Min cards per reading | 1, 3, or 5 (all ≤ 78) | 1, 3, or 5 (all ≤ 22) |

> **Note:** Cat mode is limited to 22 Major Arcana cards. All three reading types (1, 3, 5) are valid since 5 ≤ 22. The cat deck uses the same card names and JSON meanings as the traditional deck — only the image file differs.

---

## Reading Types & Spreads

### Single Card — "The Moment" (1 card)

| Position | Meaning |
|----------|---------|
| The Moment | The single energy or focus present right now. |

**Theme:** Immediate focus, single message, daily draw.

**Layout:** One card centered; no additional positions.

### Three-Card — "The Journey" (3 cards)

| Position | Meaning |
|----------|---------|
| Past | What led here — the foundation. |
| Present | What is happening now — the core energy. |
| Future | Where things are heading — the likely outcome. |

**Theme:** Narrative arc, cause → effect → potential.

**Layout:** Read left to right as a story; the middle (Present) card is the pivot between Past and Future.

### Five-Card — "The Crossroads" (5 cards)

| Position | Meaning |
|----------|---------|
| Present | Center of the matter. |
| Challenge | What blocks or opposes. |
| Past | Root cause — what brought this about. |
| Future | What is approaching. |
| Outcome | Likely result or recommended action. |

**Theme:** Deep dive, decision point, full picture.

**Layout:** Present and Challenge interact directly; Past and Future provide context; Outcome gives direction.

---

## Card Data Source

**File:** `assets/images/Tarot/tarot-images.json`

Top-level structure:
- `description` — string
- `cards` — array of 78 card objects

Per-card fields (all present in JSON):

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Card name (e.g. "The Fool", "Ace of Cups") |
| `number` | string | `"0"`–`"21"` Majors, `"1"`–`"14"` Minors |
| `arcana` | string | `"Major Arcana"` or `"Minor Arcana"` |
| `suit` | string | Majors: `"Trump"`; Minors: `"Cups"`, `"Swords"`, `"Wands"`, `"Pentacles"` |
| `img` | string | filename (e.g. `"m00.jpg"`, `"c01.jpg"`) |
| `fortune_telling` | string[] | short divinatory phrases |
| `keywords` | string[] | theme keywords |
| `meanings` | object | `{ light: string[], shadow: string[] }` |
| `Archetype` | string | Majors only |
| `Hebrew Alphabet` | string | Majors only |
| `Numerology` | string | All cards |
| `Elemental` | string | May be missing on some cards |
| `Mythical/Spiritual` | string | Majors only |
| `Questions to Ask` | string[] | Reflective prompts |
| `Astrology` | string | Minors only |
| `Affirmation` | string | Minors only |

**Data quality handling at init:**
- Trailing-space duplicate keys (e.g. `"Archetype "` vs `"Archetype"`) are normalized to a single canonical key.
- Missing optional fields (`Astrology`, `Affirmation`, `Elemental` on some Majors) default to `""`.
- `meanings.light` / `meanings.shadow` default to `[]` if missing.
- `fortune_telling`, `keywords`, `Questions to Ask` default to `[]` if missing.

---

## Randomness & Reversals

### Secure Randomness
All randomness uses `crypto.randomInt()` (Node.js built-in). No `Math.random()` is used anywhere in the system.

### Shuffle
A cryptographically secure Fisher-Yates shuffle is applied to a fresh copy of the deck for every reading. The master deck is never mutated.

### Draws Without Replacement
Each card is popped from the shuffled deck copy. No duplicate cards can appear within a single reading.

### Reversals
- `determineReversal()` returns `true`/`false` with ~50% probability (`crypto.randomInt(2) === 0`).
- Applied independently per card in a reading.
- **Upright:** meaning selected from `meanings.light`.
- **Reversed:** meaning selected from `meanings.shadow`, framed as blocked/internalized/delayed energy.

### Meaning Selection Fallbacks
1. If `meanings.light`/`meanings.shadow` is non-empty → pick one element securely.
2. Else if `fortune_telling` is non-empty → pick one element securely.
3. Else → `"No meaning recorded for this card."`

Fortune-telling phrase follows the same fallback logic, defaulting to `"The card speaks without words."`

---

## API Endpoint

**`POST /api/tarot/read`**

Requires an authenticated session cookie.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | `'single'`, `'three'`, or `'five'` |
| `mode` | string | Yes | `'traditional'` or `'cat'` |
| `userId` | string | No | Overrides the authenticated user's ID for history tracking |

### Response (200)

Returns the flattened UI-formatted reading object (see `formatReadingForUI` output below).

### Response (400)

```json
{ "error": "Error message string" }
```

Returned for invalid type, invalid mode, uninitialized system, or insufficient cards.

---

## Class: TarotSystem

### Constructor

```js
const tarotSystem = new TarotSystem();
tarotSystem.init();
```

Properties:
- `isInitialized` (boolean) — set to `true` after successful `init()`.
- `deck` (array) — master deck of 78 normalized card objects (read-only, never mutated).
- `readingHistory` (Map) — `userId → ReadingResult[]`, in-memory, resets on restart.

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `init(jsonPath?)` | `string` (optional, defaults to `assets/images/Tarot/tarot-images.json`) | `void` (throws on failure) | Loads JSON, normalizes keys, validates 78 cards, checks image existence, builds master deck. |
| `getDeck()` | — | `array` | Shallow copy of the full 78-card master deck. |
| `getMajorArcana()` | — | `array` | New array of 22 cards where `arcana === "Major Arcana"`. |
| `getCardByName(name)` | `string` | `object \| undefined` | Look up a card by exact name. |
| `buildDeckCopy(mode)` | `'traditional' \| 'cat'` | `array` | Fresh shuffled deep copy of the deck for the given mode. Master deck untouched. |
| `drawCard(deckCopy)` | `array` | `object \| undefined` | Pops one card from a shuffled deck copy (no replacement). |
| `getImagePath(card, mode)` | `object, 'traditional' \| 'cat'` | `string` | Relative image path from project root. Cat mode falls back to traditional if cat image missing. |
| `interpretCard(card, position, positionMeaning, isReversed)` | `object, string, string, boolean` | `object` | Builds per-card reading result (meaning, keywords, fortune-telling, orientation). |
| `getReading(type, mode, userId?)` | `string, string, string?` | `ReadingResult` | Main entry — validates, draws, interprets, synthesizes, stores in history. |
| `synthesizeReading(reading)` | `object` | `string` | Cohesive narrative paragraph referencing positions, card names, orientations. |
| `generateAdvice(cardResults, spread)` | `array, object` | `string` | Closing guidance paragraph. |
| `formatReadingForUI(reading)` | `object` | `object` | Flattened reading for UI rendering. |
| `getReadingHistory(userId)` | `string` | `array` | Past readings for a user (empty array if none). |

---

## ReadingResult Structure

Full internal result object returned by `getReading()`:

```js
{
  readingId: string,        // "timestamp-6digitRandom" (e.g. "1794286078187-087022")
  userId: string \| undefined,
  type: 'single' \| 'three' \| 'five',
  mode: 'traditional' \| 'cat',
  spreadName: string,       // "The Moment" / "The Journey" / "The Crossroads"
  theme: string,            // one-line theme for this reading
  timestamp: number,        // epoch ms
  deckSize: number,         // 78 for traditional, 22 for cat
  cardCount: number,        // 1, 3, or 5
  cards: [                  // array of drawn cards in position order
    {
      position: string,     // e.g. "The Moment", "Past", "Present", "Challenge", "Future", "Outcome"
      positionMeaning: string,
      card: { ...full normalized card object from JSON... },
      isReversed: boolean,
      orientation: 'upright' \| 'reversed',
      meaning: string,      // selected from meanings.light or meanings.shadow
      keywords: string[],
      fortuneTelling: string, // selected from fortune_telling array
      imagePath: string,    // assets/images/Tarot/cards/ or assets/images/Tarot/cats/
      questionsToAsk: string[]
    }
  ],
  synthesis: string,        // overall narrative interpretation (one paragraph)
  advice: string            // closing guidance (one paragraph)
}
```

### `formatReadingForUI()` Output

Flattened version for UI rendering (same fields but card objects are trimmed to display-relevant fields):

```js
{
  readingId: string,
  userId: string \| undefined,
  type: string,
  mode: string,
  spreadName: string,
  theme: string,
  timestamp: number,
  deckSize: number,
  cardCount: number,
  synthesis: string,
  advice: string,
  cards: [
    {
      position: string,
      positionMeaning: string,
      cardName: string,
      cardNumber: string,
      arcana: string,
      suit: string,
      isReversed: boolean,
      orientation: string,
      meaning: string,
      keywords: string[],
      fortuneTelling: string,
      imagePath: string,
      questionsToAsk: string[]
    }
  ]
}
```

---

## Server Integration

**File:** `server.js`

The `TarotSystem` is required, instantiated, and initialized at server startup:

```js
const TarotSystem = require("./systems/Other/tarot-system.js");
const tarotSystem = new TarotSystem();
tarotSystem.init();
```

The API endpoint is wired into the existing `/api/` request handler:

```js
if (url.pathname === "/api/tarot/read") {
  const { type, mode, userId } = data || {};
  try {
    const reading = tarotSystem.getReading(type, mode, userId || auth.id);
    return json(res, 200, tarotSystem.formatReadingForUI(reading));
  } catch (err) {
    return json(res, 400, { error: err.message });
  }
}
```

The endpoint requires an authenticated session (`auth.id` from the session cookie). If `userId` is not provided in the request body, the authenticated user's ID is used for history tracking.

---

## Image Paths

All image paths returned by `getImagePath()` use forward slashes and are relative to the project root:

| Mode | Path Pattern | Example |
|------|-------------|---------|
| Traditional | `assets/images/Tarot/cards/{card.img}` | `assets/images/Tarot/cards/m00.jpg` |
| Cat (image exists) | `assets/images/Tarot/cats/cat-{card.img}` | `assets/images/Tarot/cats/cat-m00.jpg` |
| Cat (image missing) | `assets/images/Tarot/cards/{card.img}` (fallback) | `assets/images/Tarot/cards/m00.jpg` |

Cat images use the naming convention `cat-m##.jpg` matching the Major Arcana card's `img` number (The Fool = `m00.jpg` → `cat-m00.jpg`, The World = `m21.jpg` → `cat-m21.jpg`).

---

## Key Design Guarantees

1. **Master deck immutability:** The master deck (`this.deck`) is never mutated. Every reading builds a fresh deep-copied, shuffled deck copy via `buildDeckCopy()`.
2. **No duplicate cards:** Draws are without replacement within a single reading.
3. **Secure randomness:** All randomness uses `crypto.randomInt()`. No `Math.random()`.
4. **Graceful degradation:** Missing cat images fall back to traditional images. Missing JSON fields default to empty strings/arrays. Missing traditional images log a warning but don't crash init.
5. **Key normalization:** Trailing-space duplicate keys in the JSON (e.g. `"Archetype "` vs `"Archetype"`) are normalized at init.
6. **Input validation:** `getReading()` validates `type` and `mode`, throwing descriptive errors for invalid values.
