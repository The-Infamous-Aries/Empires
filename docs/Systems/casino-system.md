# Casino System — Documentation

**File:** `systems/Casino/casino-system.js`  
**Integration:** `entities/Casino.js` (CasinoClass), `entities/CasinoTable.js`, `entities/CasinoDiceTable.js`, `systems/Casino/cards/blackjack-system.js`, `systems/Casino/dice/gambler-dice-system.js`, `server/world.js`

---

## 1. Overview

CasinoSystem is the **central casino management system** for Sovereignty Epochs. It manages all casino games, World Bank lottery pool integration, and per-nation casino state.

All casino currency flows through the **World Bank lottery pool**:
- **Wagers** → deducted from nation money → added to pool via `addToPool()`
- **Payouts** → deducted from pool → added to nation money via `payFromPool()`
- **Pool cannot go below 0** — payouts are capped at remaining balance

The system acts as a factory and coordinator for per-nation `CasinoClass` instances and delegates game-specific logic to subsystem managers (blackjack, gambler dice, wheel, keno, scratch-off).

---

## 2. Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `isInitialized` | boolean | `false` | Whether `init()` has been called |
| `wheelSystem` | object \| null | `null` | Sovereign Wheel subsystem |
| `kenoSystem` | object \| null | `null` | Keno subsystem |
| `scratchOffSystem` | object \| null | `null` | Scratch-off subsystem |
| `blackjackSystem` | object \| null | `null` | Blackjack subsystem |
| `gamblerDiceSystem` | object \| null | `null` | Gambler Dice subsystem |
| `lotteryPool` | number | `0` | World Bank lottery pool balance |
| `nationCasinos` | Map | `new Map()` | Per-nation casino state: nationId → CasinoClass |

---

## 3. Initialization

### `init(wheelSystem, kenoSystem, scratchOffSystem, blackjackSystem, gamblerDiceSystem)`

Initializes all casino subsystems. Can only be called once (`isInitialized` guard).

| Parameter | Type | Description |
|-----------|------|-------------|
| `wheelSystem` | object | Sovereign Wheel system instance |
| `kenoSystem` | object | Keno system instance |
| `scratchOffSystem` | object | Scratch-off system instance |
| `blackjackSystem` | object | Blackjack system instance |
| `gamblerDiceSystem` | object | Gambler Dice system instance |

**Behavior:**
1. Stores all subsystem references
2. Calls `initialize()` on blackjackSystem and gamblerDiceSystem (if present)
3. Sets `isInitialized = true`
4. Logs initialization message

**Note:** This is a single `init()` method accepting all 5 parameters. Do not call with fewer arguments — subsystems not passed will remain `null`.

---

## 3. Subsystem Accessors

### `getBlackjackSystem()`

**Returns:** `object \| null` — The BlackjackSystem instance, or `null` if not initialized.

### `getGamblerDiceSystem()`

**Returns:** `object \| null` — The GamblerDiceSystem instance, or `null` if not initialized.

---

## 4. Per-Nation Casino Management

### `getCasino(nation)`

Gets or creates a `CasinoClass` instance for a nation.

| Parameter | Type | Description |
|-----------|------|-------------|
| `nation` | object | Nation object with `id` property |

**Returns:** `CasinoClass` — The nation's casino data instance.

**Throws:** Error if `nation` or `nation.id` is missing.

**Behavior:** Lazily creates a new `CasinoClass` on first call for a nation, stores it in `this.nationCasinos`, and returns it on subsequent calls.

### `ensureCasino(nation)`

Ensures a nation has casino data initialized. Simply calls `getCasino(nation)`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `nation` | object | Nation object |

---

## 5. World Bank Lottery Pool

### `addToPool(amount, source)`

Adds a wager amount to the World Bank lottery pool.

| Parameter | Type | Description |
|-----------|------|-------------|
| `amount` | number | Wager amount to add (must be > 0) |
| `source` | string | Source description for logging |

**Returns:** `number` — New pool balance after addition, or `0` if amount is invalid.

**Validation:** Rejects amounts <= 0 (including negative values that would drain the pool).

### `payFromPool(amount, source)`

Deducts a payout from the World Bank lottery pool. Capped at remaining balance — pool cannot go below 0.

| Parameter | Type | Description |
|-----------|------|-------------|
| `amount` | number | Payout amount requested |
| `source` | string | Source description for logging |

**Returns:** `number` — Actual amount paid (may be less than requested if pool is insufficient).

### `getPool()`

**Returns:** `number` — Current lottery pool balance (0 if uninitialized).

---

## 5. Serialization

### `getState()`

Serializes the complete casino system state for persistence.

**Returns:** Object with:
- `lotteryPool` — Current pool balance
- `nationCasinos` — Map of nationId → serialized CasinoClass data
- `sovereignWheelSystem` — Wheel system state (if present)
- `kenoSystem` — Keno system state (if present)
- `scratchOffSystem` — Scratch-off system state (if present)
- `blackjackSystem` — Blackjack system state (if present)
- `gamblerDiceSystem` — Gambler Dice system state (if present)

Each subsystem's `getState()` is called if it exists.

### `setState(state)`

Restores casino system state from a serialized object.

| Parameter | Type | Description |
|-----------|------|-------------|
| `state` | object | Serialized state object |

**Restores:**
- `lotteryPool` — Pool balance
- `nationCasinos` — Each nation's CasinoClass via `new CasinoClass()` + `deserialize()`
- All subsystem states via their `setState()` methods

---

## 5. Money Flow

All casino games route money through the World Bank lottery pool:

```
┌─────────────────┐     wager      ┌──────────────────┐
│   Nation        │ ─────────────> │   World Bank     │
│   (nation.casino│   - amount     │   Lottery Pool   │
│    .money -= X) │                │   (lotteryPool)  │
└─────────────────┘                └──────────────────┘
                                    │
                                    │ payout (capped)
                                    ▼
┌─────────────────┐     payout     ┌──────────────────┐
│   Nation        │ <───────────── │   World Bank     │
│   (nation.casino│   + amount     │   Lottery Pool   │
│    .money += X) │                │                  │
└─────────────────┘                └──────────────────┘
```

**Game-specific pool operations:**

| Action | Pool Operation | Source Label |
|--------|---------------|--------------|
| Blackjack bet | `addToPool(bet, 'blackjack')` | blackjack |
| Blackjack double | `addToPool(bet, 'blackjack_double')` | blackjack_double |
| Blackjack split | `addToPool(bet, 'blackjack_split')` | blackjack_split |
| Blackjack insurance | `addToPool(bet, 'blackjack_insurance')` | blackjack_insurance |
| Blackjack win | `payFromPool(payout, 'blackjack_win')` | blackjack_win |
| Blackjack surrender | `payFromPool(bet/2, 'blackjack_surrender')` | blackjack_surrender |
| Gambler Dice bet | `addToPool(bet, 'gamblerDice')` | gamblerDice |
| Gambler Dice P2P back | `addToPool(bet, 'gamblerDice_p2p')` | gamblerDice_p2p |
| Gambler Dice hard-way/jackpot contribution | `addToPool(contrib, 'gamblerDice_jackpot')` | gamblerDice_jackpot |
| Gambler Dice P2P rake | `addToPool(rake, 'gamblerDice_rake')` | gamblerDice_rake |
| Gambler Dice win | `payFromPool(payout, 'gamblerDice_win')` | gamblerDice_win |
| Keno ticket purchase | `addToPool(amount, 'keno')` | keno |
| Keno win | `payFromPool(payout, 'keno_win')` | keno_win |
| Scratch-off purchase | `addToPool(amount, 'scratchOff')` | scratchOff |
| Scratch-off win | `payFromPool(payout, 'scratchOff_win')` | scratchOff_win |

---

## 5. Stats Tracking

Per-game stats are stored on `nation.casino.games.<gameName>`:

| Game | Stats Tracked |
|------|--------------|
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

---

## 5. Wiring

### In `server/world.js`

| Location | Usage |
|----------|-------|
| Line 36 | `const casinoSystem = new CasinoSystem()` — Single instance |
| Line 43 | `casinoSystem.setState(state.casino)` — Restore from saved state |
| Line 224, 334 | `r.casino = casinoSystem.getCasino(r.nation)` — Attach per-request |
| Line 3775–3787 | Blackjack stats updates on `nation.casino.games.blackjack` |
| Line 3845–3846 | Blackjack stats updates on `nation.casino.games.blackjack` |
| Line 4002–4003 | Gambler Dice stats updates on `nation.casino.games.gamblerDice` |

### In `entities/Casino.js`

| Location | Usage |
|----------|-------|
| `CasinoClass` | Per-nation casino data container |
| `serialize()` / `deserialize()` | Persistence of per-nation state |

### In `entities/CasinoTable.js` / `entities/CasinoDiceTable.js`

| Location | Usage |
|----------|-------|
| Table instances | Created per-game, stored in `nation.casino.blackjackTables` / `gamblerDiceTables` |

---

## 5. Serialization Round-Trip

```
CasinoSystem.getState() → {
  lotteryPool: number,
  nationCasinos: { [nationId]: CasinoClass.serialize() },
  sovereignWheelSystem: ...,
  kenoSystem: ...,
  scratchOffSystem: ...,
  blackjackSystem: ...,
  gamblerDiceSystem: ...
}

CasinoSystem.setState(state) → restores all above
```

Each nation's `CasinoClass.serialize()` → `deserialize()` deep-merges game stats so partial data doesn't wipe fields.

---

## 5. Example

**Initializing the casino system:**

```js
const casinoSystem = new CasinoSystem();
casinoSystem.init(
  sovereignWheelSystem,
  kenoSystem,
  scratchOffSystem,
  blackjackSystem,
  gamblerDiceSystem
);
```

**Getting a nation's casino data:**

```js
const casino = casinoSystem.getCasino(nation);
// casino.freeUnits.soldiers = 0
// casino.games.blackjack.played = 0
```

**Placing a bet (pool flow):**

```js
// Deduct from nation, add to pool
nation.money -= bet;
casinoSystem.addToPool(bet, 'blackjack');

// Pay out win from pool
const payout = casinoSystem.payFromPool(winAmount, 'blackjack_win');
nation.money += payout;
```

**Getting pool balance:**

```js
const poolBalance = casinoSystem.getPool();
// poolBalance = current World Bank lottery pool amount
```

**Serializing for save:**

```js
const state = casinoSystem.getState();
// state.lotteryPool = current pool
// state.nationCasinos = { [nationId]: { ...casino data } }
// state.blackjackSystem = { ... }
// state.gamblerDiceSystem = { ... }
```

**Restoring from save:**

```js
casinoSystem.setState(savedState);
```

---

## 5. Future Expansions

- Additional casino subsystems (poker, sports betting, etc.)
- Pool interest/inflation mechanics
- Per-nation pool limits
- Casino audit/logging for all pool transactions
- Automated pool rebalancing between nations
