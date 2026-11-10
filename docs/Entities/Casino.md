# Casino Entity — Documentation

**File:** `entities/Casino.js`  
**Integration:** `systems/Casino/casino-system.js` (CasinoSystem), `server/world.js` (per-nation casino data), `entities/CasinoTable.js` (blackjack tables), `entities/CasinoDiceTable.js` (gambler dice tables)

---

## 1. Overview

CasinoClass is the **per-nation casino state container**. Each nation has one CasinoClass instance attached as `nation.casino`. It tracks all casino-related data: active wheel effects, free unit credits, game statistics, active blackjack tables, active gambler dice tables, keno tickets, scratch-off cards, and Sovereign Wheel state.

---

## 2. Fields

### 2.1. Active Wheel Effects (`activeEffects`)

Effects won on the Sovereign Wheel that persist across spins.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `freeProject` | boolean | `false` | Next project is fully free |
| `freeProjectDate` | string \| null | `null` | Date the free project was granted |
| `wonderCooldownReset` | boolean | `false` | Wonder build cooldown has been reset |
| `wonderCooldownResetDate` | string \| null | `null` | Date the wonder cooldown was reset |
| `freeBillsDays` | number | `0` | Days of free bills remaining (0–3) |
| `freeBillsStartDate` | string \| null | `null` | Date free bills were granted |

### 2.2. Free Unit Credits (`freeUnits`)

Stackable redeemable credits won on the Sovereign Wheel. Credits do NOT instantly create units — they waive money and resource costs at purchase time, but tech requirements, capacity limits, prerequisites, population enlistment, and all other limits still apply.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `soldiers` | number | `0` | Redeemable free soldiers |
| `tanks` | number | `0` | Redeemable free tanks |
| `aircraft` | number | `0` | Redeemable free aircraft |
| `ships` | number | `0` | Redeemable free ships |
| `spies` | number | `0` | Redeemable free spies |
| `missiles` | number | `0` | Redeemable free missiles |
| `nukes` | number | `0` | Redeemable free nukes |
| `land` | number | `0` | Redeemable free land credit |
| `infra` | number | `0` | Redeemable free infra credit |

### 2.3. Blackjack Tables (`blackjackTables`)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `blackjackTables` | object | `{}` | Map of `tableId` → serialized CasinoTable |

### 2.4. Gambler Dice Tables (`gamblerDiceTables`)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `gamblerDiceTables` | object | `{}` | Map of `tableId` → serialized CasinoDiceTable |

### 2.5. Games Statistics (`games`)

Per-game tracking for XP, achievements, and display.

| Game | Fields |
|------|--------|
| `wheel` | `spins`, `wins`, `losses`, `totalWon`, `totalSpent` |
| `keno` | `played`, `won`, `spent`, `wonAmount` |
| `blackjack` | `played`, `won`, `lost`, `pushed`, `blackjacks`, `spent`, `wonAmount` |
| `gamblerDice` | `played`, `won`, `lost`, `pushed`, `jackpotsWon`, `spent`, `wonAmount` |
| `scratchOff` | `played`, `won`, `spent`, `wonAmount` |
| `scratch_off_resources` | `played`, `won`, `spent`, `wonAmount` |
| `scratch_off_pets` | `played`, `won`, `spent`, `wonAmount` |
| `scratch_off_bricks` | `played`, `won`, `spent`, `wonAmount` |
| `scratch_off_factions` | `played`, `won`, `spent`, `wonAmount` |
| `scratch_off_beliefs` | `played`, `won`, `spent`, `wonAmount` |
| `scratch_off_needs` | `played`, `won`, `spent`, `wonAmount` |

### 2.6. Keno Tickets (`kenoTickets`)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kenoTickets` | array | `[]` | Purchased but not yet drawn keno tickets |

### 2.7. Scratch-off Cards (`scratchOffCards`)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `scratchOffCards` | array | `[]` | Purchased but not yet revealed scratch-off cards |

### 2.8. Sovereign Wheel State (`wheel`)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `lastSpinDate` | string \| null | `null` | Date of last wheel spin (YYYY-MM-DD) |
| `spinsToday` | number | `0` | Number of spins today (max 1 free per day) |
| `paidSpinsToday` | number | `0` | Number of paid spins today |

### 2.9. Internal State

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `isInitialized` | boolean | `false` | Whether `initialize()` has been called |

---

## 3. Initialization

### `initialize(casinoData = {})`

Merges saved casino data into the instance. Uses **deep merge** for nested game stats objects so partial saved data doesn't wipe fields like `lost`, `pushed`, `blackjacks`, etc.

| Parameter | Type | Description |
|-----------|------|-------------|
| `casinoData` | object | Serialized casino data from persistence layer |

**Merge behavior:**
- `activeEffects`, `freeUnits`, `wheel` — shallow merge (top-level keys only)
- `games` — deep merge per game object: `{ ...this.games[gameName], ...savedGameData }`
- `blackjackTables`, `gamblerDiceTables` — shallow copy of table maps
- `kenoTickets`, `scratchOffCards` — spread copy of arrays (new references)
- Sets `this.isInitialized = true`

---

## 4. Free Unit Credit Operations

### `addFreeUnitCredits(unitType, amount)`

Adds free unit credits when a player wins a FREE X slice on the Sovereign Wheel. Credits stack additively.

| Parameter | Type | Description |
|-----------|------|-------------|
| `unitType` | string | `'soldiers' \| 'tanks' \| 'aircraft' \| 'ships' \| 'spies' \| 'missiles' \| 'nukes' \| 'land' \| 'infra'` |
| `amount` | number | Credits to add |

**Throws:** Error if `unitType` is not a valid free unit type.

### `redeemFreeUnitCredits(unitType, amount)`

Redeems free unit credits at purchase time. Returns the number actually consumed (may be less than requested if insufficient credits).

| Parameter | Type | Description |
|-----------|------|-------------|
| `unitType` | string | Free unit type |
| `amount` | number | Credits requested |

**Returns:** `number` — Credits actually consumed (0 if none available).

### `getFreeUnitCredits(unitType)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `unitType` | string | Free unit type |

**Returns:** `number` — Available credits for the unit type (0 if none).

---

## 5. Serialization

### `serialize()`

**Returns:** Plain object with all fields for persistence:
- `activeEffects` (shallow copy)
- `freeUnits` (shallow copy)
- `games` (shallow copy of top-level game objects)
- `blackjackTables` (shallow copy)
- `gamblerDiceTables` (shallow copy)
- `kenoTickets` (spread copy)
- `scratchOffCards` (spread copy)
- `wheel` (shallow copy)

### `deserialize(data)`

Restores all fields from a serialized object by calling `initialize(data)`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | object | Serialized casino data |

---

## 6. Wiring

### In `systems/Casino/casino-system.js`

| Location | Usage |
|----------|-------|
| Line 12 | Import: `const CasinoClass = require("../../entities/Casino.js")` |
| Line 112–122 | `getCasino(nation)` — Creates `new CasinoClass()` if nation has none, returns existing otherwise |
| Line 127–129 | `ensureCasino(nation)` — Calls `getCasino()` to ensure data exists |
| Line 205–207 | `setState()` — `new CasinoClass()` + `casino.deserialize(data)` for each nation |
| Line 174 | `getState()` — `casino.serialize()` for each nation |

### In `server/world.js`

| Location | Usage |
|----------|-------|
| Line 224, 334 | `r.casino = casinoSystem.getCasino(r.nation)` — Attaches casino data to nation for request processing |
| Line 36 | `const casinoSystem = new CasinoSystem()` — Instantiated once |
| Line 43 | `casinoSystem.setState(state.casino)` — Restores from saved state |
| Line 3775–3787 | Blackjack stats updates on `nation.casino.games.blackjack` |
| Line 3845–3846 | Blackjack stats updates on `nation.casino.games.blackjack` |
| Line 4002–4003 | Gambler Dice stats updates on `nation.casino.games.gamblerDice` |

### In `entities/CasinoTable.js`

| Location | Usage |
|----------|-------|
| Constructor | Creates `new CasinoTable()` per blackjack table |

### In `entities/CasinoDiceTable.js`

| Location | Usage |
|----------|-------|
| Constructor | Creates `new CasinoDiceTable()` per gambler dice table |

---

## 6. Money Flow Integration

All casino games use the **World Bank lottery pool** via `CasinoSystem`:

| Action | Pool Operation | Source |
|--------|---------------|--------|
| Bet placed | `addToPool(amount, 'gameName')` | Wager added to pool |
| Win | `payFromPool(amount, 'gameName')` | Payout paid from pool (capped at balance) |
| Push | `payFromPool(amount, 'gameName')` | Bet returned |
| Insurance | `addToPool(amount, 'blackjack_insurance')` | Insurance wager added to pool |
| Double down | `addToPool(amount, 'blackjack_double')` | Additional wager added to pool |
| Split | `addToPool(amount, 'blackjack_split')` | Additional wager added to pool |
| Surrender | `payFromPool(amount, 'blackjack_surrender')` | Half bet refunded from pool |
| Jackpot contribution | `addToPool(amount, 'gamblerDice_jackpot')` | 10% of hard-way/jackpot bets |
| Jackpot win | Paid from `table.jackpotPool` | Progressive jackpot pool (separate from main lottery pool) |
| P2P rake | `addToPool(amount, 'gamblerDice_rake')` | 5% house rake on P2P backing winnings |

The pool cannot go below 0 — `payFromPool` caps payouts at remaining balance.

---

## 6. Stats Tracking

Per-game stats are tracked on `nation.casino.games.<gameName>`:

| Stat | Description |
|------|-------------|
| `played` | Games/hands played |
| `won` | Games won (net profit > 0) |
| `lost` | Games lost (net profit < 0) |
| `pushed` | Games pushed (net profit = 0) |
| `blackjacks` | Natural blackjacks (blackjack only) |
| `jackpotsWon` | Jackpot wins (gamblerDice only) |
| `spent` | Total currency wagered (tracked at bet time) |
| `wonAmount` | Total net profit (wins − losses) |
| `totalWon` | Total currency won (wheel only) |
| `totalSpent` | Total currency spent (wheel only) |

---

## 6. Serialization Round-Trip

All fields round-trip correctly through `serialize()` → `deserialize()`:
- Shallow copies for flat objects (`activeEffects`, `freeUnits`, `wheel`)
- Deep merge for nested `games` objects
- Shallow copies for table maps (`blackjackTables`, `gamblerDiceTables`)
- Spread copies for arrays (`kenoTickets`, `scratchOffCards`)

---

## 6. Example

**Creating a new nation's casino data:**

```js
const casino = new CasinoClass();
// casino.activeEffects = { freeProject: false, wonderCooldownReset: false, freeBillsDays: 0, ... }
// casino.freeUnits = { soldiers: 0, tanks: 0, aircraft: 0, ... }
// casino.games.blackjack = { played: 0, won: 0, lost: 0, pushed: 0, blackjacks: 0, spent: 0, wonAmount: 0 }
// casino.games.gamblerDice = { played: 0, won: 0, lost: 0, pushed: 0, jackpotsWon: 0, spent: 0, wonAmount: 0 }
// casino.blackjackTables = {}
// casino.gamblerDiceTables = {}
// casino.kenoTickets = []
// casino.scratchOffCards = []
// casino.wheel = { lastSpinDate: null, spinsToday: 0, paidSpinsToday: 0 }
```

**Adding free unit credits:**

```js
casino.addFreeUnitCredits('soldiers', 1000);
// casino.freeUnits.soldiers = 1000
```

**Redeeming credits:**

```js
const consumed = casino.redeemFreeUnitCredits('soldiers', 500);
// consumed = 500, casino.freeUnits.soldiers = 500
```

**Serializing for persistence:**

```js
const data = casino.serialize();
// data.games.blackjack = { played: 5, won: 2, lost: 2, pushed: 1, blackjacks: 0, spent: 1000, wonAmount: -100 }
// data.blackjackTables = { bj_abc123: { tableId: 'bj_abc123', status: 'waiting', ... } }
// etc.
```

**Deserializing from saved data:**

```js
const casino2 = new CasinoClass();
casino2.deserialize(savedData);
// All fields restored with deep merge for games stats
```

---

## 6. Future Expansions

- Additional free unit types (artillery, cavalry, etc.)
- Per-game achievement tracking
- Casino loyalty/ranking system
- Table tournament tracking
- Cross-nation casino statistics leaderboard
