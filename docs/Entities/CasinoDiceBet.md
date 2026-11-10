# CasinoDiceBet Entity — Documentation

**File:** `entities/CasinoDiceBet.js`  
**Integration:** `entities/CasinoDiceSeat.js` (bets array), `systems/Casino/dice/gambler-dice-system.js` (placeBet, backBet, settle, evaluateBet), `server/world.js` (casinoDiceRoll stats)

---

## 1. Overview

CasinoDiceBet represents a single wager placed at a live craps-style dice table. Each bet captures the bet type, target value, amount, payout odds, and win/loss state. Supports both house-banked bets (against World Bank pool) and player-vs-player backing bets (P2P).

---

## 2. Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `betId` | string | `db_<timestamp>_<random>` | Unique bet identifier |
| `seatIndex` | number | `-1` | Seat placing the bet (0–5) |
| `nationId` | string \| null | `null` | Owning nation |
| `userId` | string \| null | `null` | Web user/session ID |
| `betType` | string | `'exact'` | See bet catalog below |
| `target` | number \| array \| null | `null` | Face number, range `[lo, hi]`, sum target, or point |
| `amount` | number | `0` | Wager amount |
| `backedBy` | number \| null | `null` | Seat index of backer (P2P); `null` = house bet |
| `backerNationId` | string \| null | `null` | Backer's nation (if P2P) |
| `payoutMultiplier` | number | `1` | House payout multiplier (profit per unit wagered; `0` valid for jackpot) |
| `trueOdds` | number | `0` | Computed true probability denominator |
| `houseEdge` | number | `0` | Precomputed house edge % |
| `won` | boolean \| null \| `'push'` | `null` | `null` = pending, `true` = win, `false` = loss, `'push'` = refund |
| `payout` | number | `0` | Amount paid on win (includes bet return) |
| `isJackpotBet` | boolean | `false` | Whether this contributes to/pays from jackpot pool |
| `createdAt` | number | `Date.now()` | Timestamp when bet was placed |

---

## 3. Methods

### `isHouseBet()`

**Returns:** `boolean` — `true` if `backedBy === null` (house-banked bet), `false` if P2P back.

### `isP2PBack()`

**Returns:** `boolean` — `true` if `backedBy !== null` (player backing another player's bet), `false` otherwise.

---

## 4. Serialization

### `serialize()`

**Returns:** Plain object with all 14 fields. Used by `CasinoDiceSeat.serialize()` → `CasinoDiceTable.serialize()` → `GamblerDiceSystem.getState()`.

### `deserialize(data)`

Restores all fields from a serialized object. Handles `null`/missing values with defaults:
- `backedBy` uses `?? null` (preserves seat index `0`)
- `payoutMultiplier` uses `?? 1` (preserves `0` for jackpot bets)
- `won` uses `data.won !== undefined ? data.won : null` (preserves `false`)
- All other fields use `||` defaults

---

## 5. Bet Types

| Bet Type | Description | Dice Count | Valid Die Sizes | Target Format |
|----------|-------------|------------|-----------------|---------------|
| `pass` | Wins on natural (7/11), loses on craps (2/3/12); else point | 2+ | d6–d20 | None |
| `dont_pass` | Opposite of pass; 12 pushes | 2+ | d6–d20 | None |
| `exact` | One specific face | 1–5 | All | Face number |
| `high` | Upper half of faces | 1–5 | All | None |
| `low` | Lower half of faces | 1–5 | All | None |
| `odd` | Odd-numbered faces | 1–5 | All | None |
| `even` | Even-numbered faces | 1–5 | All | None |
| `range` | Contiguous span `[lo, hi]` | 1–5 | All | `[lo, hi]` array |
| `field` | Wins on 2,3,4,9,10,11,12 | 2+ | d6–d20 | None |
| `any_craps` | Wins on 2, 3, or 12 | 2+ | d6–d20 | None |
| `hardway` | All dice show same specific face | 2–5 | All | Face number |
| `match_any` | All dice show same face (any number) | 2–5 | All | None |
| `sum_exact` | Sum equals target | 2–5 | d6–d20 | Sum number |
| `sum_range` | Sum within `[lo, hi]` | 2–5 | d6–d20 | `[lo, hi]` array |
| `jackpot` | 5 dice all same face | 5 | All | None (pays from jackpot pool) |

> **D4 restriction:** No `pass`, `dont_pass`, `field`, `any_craps`, `hardway`, `match_any`, `sum_exact`, `sum_range`.

---

## 6. Critical Implementation Details

### 6.1. Nullish Coalescing (`??`) — Required for Correctness

Two fields use `??` instead of `||` because `0` and `false` are valid values:

| Field | Why `||` fails | Correct with `??` |
|-------|---------------|-------------------|
| `backedBy` | Seat index `0` is falsy → `0 \|\| null` = `null` (loses backer reference) | `0 ?? null` = `0` (preserves seat 0 backer) |
| `payoutMultiplier` | Jackpot bets use `0` → `0 \|\| 1` = `1` (corrupts jackpot payout) | `0 ?? 1` = `0` (preserves jackpot multiplier) |

### 6.2. `won` State Tri-State

| Value | Meaning |
|-------|---------|
| `null` | Bet pending (not yet resolved; multi-roll pass/dont_pass awaiting point outcome) |
| `true` | Bet won; `payout` contains amount paid |
| `false` | Bet lost; house keeps wager |
| `'push'` | Bet pushed; bet returned only, no profit |

### 6.3. Jackpot Bets

- `isJackpotBet: true` only for `betType === 'jackpot'`
- `payoutMultiplier: 0` (jackpot pays from `table.jackpotPool`, not from house multiplier)
- `settle()` skips `payFromPool()` for jackpot bets; `world.js` pays from `table.jackpotPool`
- Excluded from `seatResult.totalPayout` to prevent double-payment

### 6.4. P2P Backing

- `backedBy` = seat index of the player backing this bet
- `backerNationId` = backer's nation
- Backer places bet via `backBet()` action; original bettor's bet remains unchanged
- On win, backer paid `grossPayout − rake` (5% house rake swept to pool)
- `isP2PBack()` returns `true`; `isHouseBet()` returns `false`

---

## 7. Wiring

### In `CasinoDiceSeat.js`

Seat holds `bets: CasinoDiceBet[]`. Bets added via `seat.addBet(bet)` which also tracks `totalWagered`. Seats serialize/deserialize their bets array.

### In `gambler-dice-system.js`

- **`placeBet()`** (line 495): Creates `CasinoDiceBet` with computed odds, adds to seat, deducts money, adds to pool
- **`backBet()`** (line 568): Creates backing bet with `backedBy: targetSeatIndex`, adds to backer's seat
- **`evaluateBet()`**: Evaluates each bet against roll result, sets `bet.won` and `bet.payout`
- **`settle()`** (line 688): Iterates all seats/bets, skips already-settled (`won !== null`), resolves pending bets, pays from pool

### In `world.js`

- **`casinoDiceRoll()`** (line 4009): Applies payouts to nations, updates `nation.casino.games.gamblerDice` stats (`played`, `won`, `lost`, `pushed`, `jackpotsWon`, `spent`, `wonAmount`)
- Jackpot winners paid from `table.jackpotPool` separately from main pool payouts

---

## 8. Security

- All bet validation (limits, target requirements, duplicate prevention) happens server-side in `gambler-dice-system.js`
- `backedBy` cannot reference own seat (`targetSeatIndex === seatIndex` rejected)
- Cannot back a P2P bet (chains prevented)
- Bet amount validated against `minBet`/`maxBet` before placement
- `won === null` bets are skipped during settlement (not double-processed)

---

## 9. Example

**House bet on D20 exact number 7:**

```js
const bet = new CasinoDiceBet({
    seatIndex: 2,
    nationId: 'nat_123',
    userId: 'user_456',
    betType: 'exact',
    target: 7,
    amount: 500,
    payoutMultiplier: 17,
    trueOdds: 19,
    houseEdge: 0.10,
    isJackpotBet: false
});
// bet.won = null (pending)
// bet.payout = 0 (not yet paid)
// bet.isHouseBet() = true
```

**P2P back of seat 0's bet:**

```js
const backerBet = new CasinoDiceBet({
    seatIndex: 3,
    nationId: 'nat_789',
    userId: 'user_012',
    betType: 'hardway',
    target: 14,
    amount: 200,
    backedBy: 0,           // Backing seat 0's bet
    backerNationId: 'nat_123',
    payoutMultiplier: 350,
    isJackpotBet: false
});
// backerBet.isP2PBack() = true
// backerBet.isHouseBet() = false
```

**Jackpot bet on D20:**

```js
const jackpotBet = new CasinoDiceBet({
    seatIndex: 1,
    nationId: 'nat_111',
    userId: 'user_222',
    betType: 'jackpot',
    target: null,
    amount: 100,
    payoutMultiplier: 0,      // Pays from jackpot pool, not multiplier
    trueOdds: 159999,
    houseEdge: 0.20,
    isJackpotBet: true
});
// jackpotBet.isJackpotBet = true
// settle() pays from table.jackpotPool, skips payFromPool
```

---

## 10. Future Expansions

- Side bet types (any seven, horn bet, craps-eleven)
- Odds bets (true odds payout with no house edge, behind pass/dont_pass)
- Progressive side bets with separate meter
- Bet expiration / auto-refund on table close
- Bet history per player (last N bets with outcomes)
