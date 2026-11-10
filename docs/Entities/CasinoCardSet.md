# CasinoCardSet Entity — Documentation

**File:** `entities/CasinoCardSet.js`  
**Integration:** `entities/Player.js` (`settings.ui.cardSet`), `server/world.js` (`casinoSetCardSet` action), `systems/Casino/cards/blackjack-system.js` (`getTableState`), `systems/Casino/dice/gambler-dice-system.js` (`getTableState`)

---

## 1. Overview

CasinoCardSet is a **static client-side registry** that maps each card set ID to its asset paths and card naming functions. It is used by the browser to resolve image URLs for rendering cards in blackjack and dice games.

**Key design principles:**
- Card art is resolved **client-side only**; the server deals logical cards (suit + rank) and never sends image paths
- Each player's browser renders cards using their own selected card set (`settings.ui.cardSet`)
- The server only stores and transmits the card set ID string; no image URLs are exchanged

---

## 2. Card Set Registry

Six card sets are available. Each maps suit + rank to a specific image file path on disk.

| Card Set | Folder | Back Image | Notes |
|----------|--------|------------|-------|
| `artistic` | `assets/images/Cards/Artistic/` | None (CSS fallback) | Suit: club/diamond/heart/spade; Rank: 0001–0013 |
| `classic` | `assets/images/Cards/Classic/` | `Red-Cardback.png` | Folder: Clover/Diamond/Hearts/Spades; File: Ace–King-Of-Clover/Diamonds/Hearts/Spades |
| `dark` | `assets/images/Cards/Dark/` | `BACK.png` | Suit: C/D/H/P; Rank: A–K; File: `{rank}-{suit}.png` |
| `light` | `assets/images/Cards/Light/` | `BACK.png` | Suit: C/D/H/S; Rank: A–K; File: `{rank}-{suit}.png` |
| `off-white` | `assets/images/Cards/Off-White/` | `back-black.png` | Suit: C/D/H/S; Rank: A–K; File: `{rank}-{suit}.png` |
| `white-red` | `assets/images/Cards/White & Red tinted/` | `back_red_basic.png` | Suit: clubs/diamonds/hearts/spades; Rank: ace/2–10/jack/queen/king; Variant: `_white` suffix |

### 2.1. Per-Set Path Details

**Artistic:**
- Folder: `assets/images/Cards/Artistic/`
- Suit mapping: clubs→club, diamonds→diamond, hearts→heart, spades→spade
- Rank mapping: A→0001, 2→0002, ..., 10→0010, J→0011, Q→0012, K→0013
- Path pattern: `{folder}{suitMap[suit]}_{rankMap[rank]}.png`

**Classic:**
- Folder: `assets/images/Cards/Classic/`
- Suit folder: clubs→Clover, diamonds→Diamond, hearts→Hearts, spades→Spades
- Suit file: clubs→Clovers, diamonds→Diamonds, hearts→Hearts, spades→Spades
- Rank mapping: A→Ace, 2→Two, ..., 10→Ten, J→Jack, Q→Queen, K→King
- Path pattern: `{folder}{suitFolder[suit]}/{rankMap[rank]}-Of-{suitFile[suit]}.png`
- Note: 8 of Diamonds file is named `EIght-Of-Diamonds.png` (capital EI)

**Dark:**
- Folder: `assets/images/Cards/Dark/`
- Suit mapping: clubs→C, diamonds→D, hearts→H, spades→P
- Path pattern: `{folder}{rank}-{suitMap[suit]}.png` (e.g. `10-P.png` for 10 of Spades)

**Light:**
- Folder: `assets/images/Cards/Light/`
- Suit mapping: clubs→C, diamonds→D, hearts→H, spades→S
- Path pattern: `{folder}{rank}-{suitMap[suit]}.png` (e.g. `10-S.png` for 10 of Spades)

**Off-White:**
- Folder: `assets/images/Cards/Off-White/`
- Suit mapping: clubs→C, diamonds→D, hearts→H, spades→S
- Path pattern: `{folder}{rank}-{suitMap[suit]}.png` (e.g. `10-S.png` for 10 of Spades)

**White & Red tinted:**
- Folder: `assets/images/Cards/White & Red tinted/`
- Suit mapping: clubs→clubs, diamonds→diamonds, hearts→hearts, spades→spades
- Rank mapping: A→ace, 2→2, ..., 10→10, J→jack, Q→queen, K→king
- Path pattern: `{folder}{rankMap[rank]}_{suitMap[suit]}{suffix}.png` where suffix is `_white` for variant='white'
- Supports `_white` variant images

---

## 3. Default Card Set

```js
const DEFAULT_CARD_SET = 'white-red';
```

If no card set is stored for a player, or if an invalid card set ID is requested, all resolution functions fall back to `white-red`. If `DEFAULT_CARD_SET` itself is missing from the registry, resolution throws an error (infinite recursion guard).

---

## 4. Exported Functions

### `resolveCardPath(cardSet, suit, rank, variant = 'regular')`

Resolves a card image URL for a given card set.

| Parameter | Type | Description |
|-----------|------|-------------|
| `cardSet` | string | Card set ID (one of: artistic, classic, dark, light, off-white, white-red) |
| `suit` | string | Card suit (clubs, diamonds, hearts, spades) |
| `rank` | string | Card rank (A, 2–10, J, Q, K) |
| `variant` | string | Optional variant ('regular' or 'white' for white-red set) |

**Returns:** Asset path string.

**Throws:** Error if suit or rank is invalid, or if default card set is missing from registry.

**Example:**
```js
resolveCardPath('dark', 'spades', 'A') 
// → 'assets/images/Cards/Dark/A-P.png'

resolveCardPath('white-red', 'hearts', '10', 'white')
// → 'assets/images/Cards/White & Red tinted/10_hearts_white.png'
```

### `resolveCardBack(cardSet)`

Resolves a card back image URL for a given card set.

| Parameter | Type | Description |
|-----------|------|-------------|
| `cardSet` | string | Card set ID |

**Returns:** Asset path string, or `'🂠'` emoji fallback if no back image is defined.

### `getCardSetIds()`

**Returns:** Array of all card set IDs: `['artistic', 'classic', 'dark', 'light', 'off-white', 'white-red']`

### `getCardSetName(cardSet)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `cardSet` | string | Card set ID |

**Returns:** Display name string (e.g. `'Dark'`, `'White & Red tinted'`).

### `getCardSetPreviews(cardSet)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `cardSet` | string | Card set ID |

**Returns:** Array of 4 objects, each with `card1` and `card2` image paths. Each pair alternates Diamonds/Spades suits with K/Q and 6/9 ranks for settings UI dropdown previews.

---

## 5. Wiring

### Player Settings (`entities/Player.js`)

```js
ui: {
  cardSet: 'white-red',  // default
  // ... other settings
}
```

- Stored per-player via `settings.ui.cardSet`
- Serialized/deserialized automatically via spread pattern

### Socket Action (`server/world.js`)

**`casinoSetCardSet(r, cardSet)`** — line 3397

Validates `cardSet` against `['artistic', 'classic', 'dark', 'light', 'off-white', 'white-red']`, then stores in `n.settings.ui.cardSet`. Returns `{ ok: true, cardSet }`.

### Table State Rendering

**Blackjack** (`systems/Casino/cards/blackjack-system.js`):
- `getTableState(table, viewerCardSet)` passes `cardSet` in returned state for client rendering

**Gambler Dice** (`systems/Casino/dice/gambler-dice-system.js`):
- `getTableState(table, viewerCardSet)` passes `cardSet` in returned state for client rendering

### Client-Side Usage

Each player's browser resolves card images using their own `settings.ui.cardSet`. The server sends only logical card data (suit + rank), never image paths.

---

## 6. Asset Verification

All card set folder names on disk match the registry:

| Card Set | Disk Folder | Suit Mapping | Rank Mapping |
|----------|-------------|--------------|--------------|
| Artistic | `Artistic/` | club, diamond, heart, spade | 0001–0013 |
| Classic | `Classic/` | Clover, Diamond, Hearts, Spades | Ace–King |
| Dark | `Dark/` | C, D, H, **P** | A–K |
| Light | `Light/` | C, D, H, **S** | A–K |
| Off-White | `Off-White/` | C, D, H, **S** | A–K |
| White & Red tinted | `White & Red tinted/` | clubs, diamonds, hearts, spades | ace–king |

**Dark uses `'P'` for spades** (files like `10-P.png`), while Light and Off-White use `'S'` (files like `10-S.png`). This difference is intentional and matches actual disk filenames.

---

## 7. Security

- Server never sends image paths; only logical card data (suit + rank)
- Client resolves image URLs locally using `CasinoCardSet.js`
- Invalid suit/rank inputs throw errors rather than producing broken paths
- Invalid card set IDs fall back to `white-red` default
- No secrets or keys exposed

---

## 8. Serialization

`CasinoCardSet.js` is a static registry — no instance state to serialize. The `cardSet` preference is stored per-player in `Player.settings.ui.cardSet` and serialized via the existing Player entity serialization (spread pattern).

---

## 9. Future Expansions

- Additional card set themes (neon, vintage, crypto, etc.)
- Animated card backs per theme
- Card back variants per suit (currently only white-red supports `_white` variant)
- High-resolution card assets for 4K displays
- Card set unlockables via achievements or shop purchases
