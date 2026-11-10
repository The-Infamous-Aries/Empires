# Scratch-Off System

Instant-win scratch-off cards. Players purchase cards and reveal hidden icons by clicking tiles. Each card is pre-determined as winner or loser server-side — the scratching is purely visual, the outcome determined before the player sees anything.

## Overview

| Item | Value |
|------|-------|
| **System class:** | `ScratchOffSystem` |
| **Global instance:** | `window.ScratchOffSystem` |
| **Primary config:** | `systems/Casino/scratch-off-system.js` |
| **Loaded in:** | `index.html` (after `core/event-system.js`) |
| **Card types:** | 6 (Resources, Pets, Bricks, Factions, Beliefs, Needs) |
| **Grid sizes:** | 3×3 or 1×3 depending on card type |
| **Win determination:** | Server-side at generation; client cannot influence |
| **Currency flow:** | Ticket cost → World Bank lottery pool; Prizes ← World Bank lottery pool |

> **Important:** `window.ScratchOffSystem` is `undefined` until `systems/Casino/scratch-off-system.js` is loaded in the browser.

---

## Card Types & Configurations

| Card Type | Icon Set | Grid Size | Win Condition | Win Chance | Cost Range |
|-----------|----------|-----------|---------------|------------|------------|
| **Resources** | 7 minerals × 5 stages (35 icons) | 3×3 | Match 3 identical in any line (rows/cols/diagonals) | ~8.6% | $100–$2,500 |
| **Pets** | 103 pet types | 1×3 | Match 2 identical | ~19.4% | $50 |
| **Bricks** | 22 miss icons | 1×3 | Match 3 identical | ~4.1% | $200 |
| **Factions** | 10 color icons | 1×3 | Match 3 identical | ~9.0% | $300 |
| **National Beliefs** | 12 religion + 12 government (24 icons) | 3×3 | ≥2 religions AND ≥2 governments among revealed | ~12.5% | $500 |
| **National Needs** | 11 food + 11 water (22 icons) | 3×3 | ≥2 foods AND ≥2 waters among revealed | ~13.6% | $500 |

### Line-Based Wins (3×3 Grid Cards Only)

For 3×3 grid cards (Resources, Beliefs, Needs), all **8 lines** are checked independently:

| Line Type | Count |
|-----------|-------|
| Rows | 3 |
| Columns | 3 |
| Diagonals | 2 |

Multiple winning lines **stack** payouts.

### Per-Card-Type Details

#### Resources
- 7 raw minerals: steel, bronze, lead, aluminum, copper, uranium, gasoline
- 5 stages per mineral: stages 1–3 = Raw, stages 4–5 = Manufactured
- 35 total icons (7 × 5)
- Win condition: 3 identical mineral+stage symbols on any line
- Tier 1–5 with increasing multipliers (1× to 50×)
- After the first set of 3, additional sets of 2 on other lines pay 25% of base prize

#### Pets
- 103 unique pet icons (see pet list below)
- 1×3 grid, single line
- Win condition: 2 identical pets revealed

#### Bricks (Misses)
- 22 miss icon colors
- 1×3 grid, single line
- Win condition: 3 identical colors revealed

#### Factions
- 10 faction color icons
- 1×3 grid, single line
- Win condition: 3 identical colors revealed

#### National Beliefs
- 12 religion icons: atheism, buddhism, christianity, hinduism, islam, judaism, monotheism, pastafarianism, polytheism, scientology, shamanism, shintoism
- 12 government icons: absolute-monarchy, anarcho-communism, communist-state, constitutional-monarchy, corporatist-state, direct-democracy, federal-republic, liberal-democracy, military-junta, single-party-state, technocracy, theocratic-republic
- 3×3 grid, all 8 lines checked
- Win condition: ≥2 religions AND ≥2 governments among ALL revealed symbols
- Bonus (2×) if ≥3 religions OR ≥3 governments among revealed

#### National Needs
- 11 food types: burger, cake, cookie, donut, hotdog, pizza, ramen, salad, steak, sushi, taco
- 11 water types: beer, coffee, energy-drink, juice, liquor, milk, milkshake, smoothie, soda, water, wine
- 3×3 grid, all 8 lines checked
- Win condition: ≥2 foods AND ≥2 waters among ALL revealed symbols
- Bonus (2×) if ≥3 foods OR ≥3 waters among revealed

---

## Card Object Structure

```json
{
  "id": "scratch_1733000000000_48291",
  "type": "resources",
  "tier": 3,
  "stage": 2,
  "mineral": "steel",
  "cost": 500,
  "isWinner": true,
  "prize": 2500,
  "prizeMultiplier": 5,
  "gridSize": 9,
  "symbols": ["steel-2", "bronze-1", "steel-2", ...],
  "revealed": [false, false, false, ...],
  "purchasedAt": 1733000000000,
  "revealedCount": 0,
  "won": false,
  "claimed": false,
  "prizeType": null
}
```

---

## Daily Card Generation

### `generateDailyCards()`

Called once per day at UTC midnight. Generates one card per tier per type:

| Card Type | Cards Generated | Tier Range |
|-----------|-----------------|------------|
| Resources | 5 | Tiers 1–5 (one per stage) |
| Pets | 1 | Tier 1 |
| Bricks | 1 | Tier 1 |
| Factions | 1 | Tier 1 |
| Beliefs | 1 | Tier 1 |
| Needs | 1 | Tier 1 |

**Total: 13 cards per day**

Each card is independently determined as winner or loser based on its type's win chance. Winning cards have prizes pre-calculated; losing cards have prize = 0.

---

## Ticket Purchase

### `purchaseCard(nation, cardId, casinoSystem)`

1. **Validation**: Card must exist in `availableCards`; nation must have sufficient funds
2. **Payment**: Cost deducted from `nation.money` and added to World Bank lottery pool
3. **Card instance created**: Copy of card definition with `revealed` reset to all `false`
4. **Stored**: Added to `nation.casino.scratchOffCards`
5. **Stats updated**: `played` and `spent` incremented for both per-type and aggregate scratch-off stats

### Wager → Pool Flow

```
Nation.money -= cost
World Bank lottery pool += cost
```

This ensures every ticket purchase contributes to the prize pool that funds payouts.

---

## Tile Reveal

### `revealTile(nation, cardId, tileIndex)`

Players click individual tiles (0 to gridSize−1) to reveal hidden icons:

1. Tile marked as revealed
2. Symbol at that position returned to client
3. **Win check** performed after each reveal (all 8 lines for 3×3 grids)
4. If card wins and not already won: `won = true`, `prize` and `prizeType` set
5. Returns: `symbol`, `card`, `won`, `prize`, `fullyRevealed`, `winResult`

**Important**: No money is exchanged at reveal time. Statistics (`won`, `wonAmount`) are NOT updated at reveal — they are updated only when the prize is claimed (see below). This prevents double-counting.

---

## Prize Claim

### `claimPrize(casinoSystem, nation, cardId)`

1. Card must exist, be a winner, and not already claimed
2. Prize amount deducted from World Bank lottery pool (capped at pool balance — pool cannot go below 0)
3. Amount added to `nation.money`
4. Card marked as `claimed = true`
5. Stats updated: `won` and `wonAmount` incremented for both per-type and aggregate scratch-off stats

### Pool Protection

If the pool balance is insufficient for the full prize, the payout is capped at whatever remains in the pool. The pool cannot go negative.

---

## Statistics Tracking

All stats stored on `nation.casino.games`:

### Per-Card-Type Stats (`scratch_off_<type>`)

| Type | Stat Key |
|------|----------|
| Resources | `scratch_off_resources` |
| Pets | `scratch_off_pets` |
| Bricks | `scratch_off_bricks` |
| Factions | `scratch_off_factions` |
| Beliefs | `scratch_off_beliefs` |
| Needs | `scratch_off_needs` |

Each type tracks: `played`, `won`, `spent`, `wonAmount`

### Aggregate Stats (`scratchOff`)

| Field | Description |
|-------|-------------|
| `played` | Total scratch-off cards purchased |
| `won` | Total winning cards claimed |
| `spent` | Total currency spent on tickets |
| `wonAmount` | Total currency won from prizes |

### Query Method

`getNationStats(nation)` returns the full `games` object including wheel, keno, and all scratch-off stats.

---

## Socket Actions

| Action | Parameters | Description |
|--------|-----------|-------------|
| `casinoBuyScratchOff` | `{ cardId: string }` | Purchase a scratch-off card |
| `casinoRevealScratchOff` | `{ cardId: string, tileIndex: number }` | Reveal one tile on a card |
| `casinoClaimScratchOffWin` | `{ cardId: string }` | Claim prize from a winning card |
| `casinoGetScratchOffStats` | `{}` | Get nation's scratch-off stats and cards |

---

## Security

- **All outcomes determined server-side** at card generation time
- **Client never sees** hidden symbols or `isWinner` flag — `getAvailableCards()` returns only safe metadata
- **All randomness** uses `crypto.randomInt()` — no `Math.random()` anywhere
- **Win/loss, prize amount, and symbol placement** all determined before the card reaches the client

---

## Serialization

`getState()` / `setState()` persist:
- `availableCards`: Full card definitions including hidden symbols (server-side only)
- `cardConfigs`: Static configuration (unchanging)

Per-nation scratch-off cards are stored on `nation.casino.scratchOffCards` and serialized via `Casino.serialize()` / `deserialize()`.
