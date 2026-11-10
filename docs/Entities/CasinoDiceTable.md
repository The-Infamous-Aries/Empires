# CasinoDiceTable Entity — Documentation

**File:** `entities/CasinoDiceTable.js`  
**Integration:** `entities/CasinoDiceSeat.js` (6 seats), `systems/Casino/dice/gambler-dice-system.js` (all game actions), `server/world.js` (socket actions), `entities/Casino.js` (`gamblerDiceTables` map)

---

## 1. Overview

CasinoDiceTable is a **stateful, multiplayer craps-style dice table** where 1–6 real users join seats and place bets on a shared dice roll. Like the blackjack table, the table persists in memory across multiple rounds (bet → roll → settle).

Each table is tied to a single die size (D4–D20) set at creation. All players at the table roll the same dice and resolve bets against the same outcome. The house acts as banker; all wagers add to the World Bank lottery pool and all payouts are paid from it.

---

## 2. Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `tableId` | string | `gd_<uuid>` | Unique table identifier |
| `status` | string | `'waiting'` | Table lifecycle: `waiting`, `betting`, `rolling`, `settling`, `closed` |
| `dieSize` | string | `'d6'` | Polyhedral die size: `d4`, `d6`, `d8`, `d12`, `d20` |
| `diceCount` | number | `2` | Number of dice rolled per roll (1–5) |
| `shooterSeatIndex` | number | `-1` | Index of current shooter seat (−1 if none) |
| `point` | number \| null | `null` | Established point for pass/don't_pass craps |
| `pointEstablished` | boolean | `false` | Whether a point is currently active |
| `seats` | CasinoDiceSeat[] | `[]` | 6 seat instances |
| `currentSeatIndex` | number | `-1` | Whose turn to act (−1 if not player-turn phase) |
| `jackpotPool` | number | `0` | Progressive jackpot accumulation |
| `jackpotContributionPct` | number | `0.10` | % of hard-way/jackpot wagers swept to jackpot (10%) |
| `minBet` | number | `100` | Minimum wager per bet |
| `maxBet` | number | `100000` | Maximum wager per bet |
| `maxPayout` | number | `10000` | Cap on single-roll payout per player |
| `rakePct` | number | `0.05` | House rake on P2P backing winnings (5%) |
| `createdAt` | number | `Date.now()` | Table creation timestamp |
| `lastActivityAt` | number | `Date.now()` | Last activity timestamp |
| `hostPlayerId` | string \| null | `null` | Table creator's nation ID |
| `autoRoll` | boolean | `false` | House auto-rolls after betting (not yet implemented) |
| `lastRoll` | object \| null | `null` | Last roll result (faces, sum, metadata) |

---

## 3. Table State Methods

### `isFull()`

**Returns:** `boolean` — `true` if all 6 seats are occupied (`!s.isEmpty()` for every seat), `false` otherwise.

### `openSeatCount()`

**Returns:** `number` — Count of seats where `isEmpty()` is true.

### `occupiedSeatCount()`

**Returns:** `number` — Count of seats where `isEmpty()` is false.

### `getSeat(seatIndex)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `seatIndex` | number | Seat position (0–5) |

**Returns:** `CasinoDiceSeat \| null` — The seat at the given index, or `null` if out of range.

### `getOccupiedSeats()`

**Returns:** `CasinoDiceSeat[]` — All seats where `isEmpty()` is false.

### `getBettingSeats()`

**Returns:** `CasinoDiceSeat[]` — All seats where `status === 'betting'`.

### `allSeatsBet()`

**Returns:** `boolean` — `true` if there is at least one occupied seat AND every occupied seat has placed at least one bet (`hasBets()`). Used to auto-transition from betting → rolling.

---

## 4. Shooter / Point Management

### `setShooter(seatIndex)`

Designates a seat as the shooter. Clears `isShooter` on all other seats first.

| Parameter | Type | Description |
|-----------|------|-------------|
| `seatIndex` | number | Seat position (0–5) |

Sets: `seat.isShooter = true`, `this.shooterSeatIndex = seatIndex`, `this.lastActivityAt = Date.now()`.

If `seatIndex` is out of range or seat doesn't exist, no change is made (but `lastActivityAt` still updates).

### `clearPoint()`

Resets craps point state:
- `this.point = null`
- `this.pointEstablished = false`

Does not update `lastActivityAt`.

### `setPoint(point)`

Establishes a craps point for pass/don't_pass resolution.

| Parameter | Type | Description |
|-----------|------|-------------|
| `point` | number | The point value (sum of dice on come-out roll) |

Sets: `this.point = point`, `this.pointEstablished = true`, `this.lastActivityAt = Date.now()`.

---

## 5. Seat Operations

### `joinSeat(seatIndex, nationId, userId)`

Occupies an empty seat at the table.

| Parameter | Type | Description |
|-----------|------|-------------|
| `seatIndex` | number | Seat position (0–5) |
| `nationId` | string | Occupying nation ID |
| `userId` | string | Web user/session ID |

**Returns:** `boolean` — `true` if joined successfully, `false` if seat is out of range or not empty.

**Behavior:**
1. Validates seat exists and is empty
2. Calls `seat.occupy(nationId, userId)`
3. Auto-assigns shooter if `shooterSeatIndex === -1` (first player becomes shooter)
4. Updates `lastActivityAt`

### `leaveSeat(seatIndex)`

Vacates a seat. Cannot leave mid-round if the seat has active bets.

| Parameter | Type | Description |
|-----------|------|-------------|
| `seatIndex` | number | Seat position (0–5) |

**Returns:** `boolean` — `true` if left successfully, `false` if seat is empty, not in range, or has active bets (`status === 'betting'` or `status === 'rolled'`).

**Behavior:**
1. Validates seat exists and is not empty
2. Blocks if `status === 'betting'` or `status === 'rolled'` (active round)
3. If seat is shooter: clears `isShooter`, sets `shooterSeatIndex = -1`, reassigns shooter to first occupied seat if any
4. Calls `seat.vacate()`
5. Updates `lastActivityAt`

### `placeBet(seatIndex, bet)`

Places a bet on a seat during the betting phase.

| Parameter | Type | Description |
|-----------|------|-------------|
| `seatIndex` | number | Seat position (0–5) |
| `bet` | CasinoDiceBet | Bet object with `amount`, `betType`, `target`, etc. |

**Returns:** `{ ok: boolean, reason?: string }`

**Behavior:**
1. Validates seat exists and is not empty
2. Validates `table.status === 'betting'`
3. Validates `bet.amount` is between `minBet` and `maxBet`
4. Calls `seat.addBet(bet)` (which validates bet.amount internally)
5. Sets `seat.status = 'betting'`
6. Updates `lastActivityAt`

---

## 6. Roll State

### `setRoll(faces, sum, metadata)`

Records the result of a dice roll.

| Parameter | Type | Description |
|-----------|------|-------------|
| `faces` | number[] | Array of rolled face values |
| `sum` | number | Sum of all face values |
| `metadata` | object | Optional metadata: `allSame`, `sameFace`, `isNatural`, `isCraps`, `pointHit`, `sevenOut` |

**Returns:** `undefined`

Sets `this.lastRoll` to a roll object containing all fields plus `rolledAt`. Updates `lastActivityAt`.

### `getRoll()`

**Returns:** `object \| null` — The last roll object, or `null` if no roll has occurred.

---

## 7. Round Reset

### `resetForNewRound()`

Resets the table for a new betting round. Seats stay occupied; only per-round state is cleared.

**Behavior:**
1. `this.lastRoll = null`
2. `this.point = null`, `this.pointEstablished = false`
3. `this.currentSeatIndex = -1`
4. `this.status = 'waiting'`
5. `this.lastActivityAt = Date.now()`
6. For each non-empty seat:
   - `seat.bets = []`
   - `seat.totalWagered = 0`
   - `seat.totalWon = 0`
   - `seat.status = 'waiting'`

**Note:** Does NOT call `seat.clearBets()` (functionally equivalent but inline). Does NOT reset `isShooter` — shooter persists across rounds.

---

## 8. Serialization

### `serialize()`

**Returns:** Plain object with all 23 fields. Seat arrays are deep-serialized via `seat.serialize()`. Used by `GamblerDiceSystem.getState()` → `CasinoSystem.getState()` → world state persistence.

Fields serialized:
- `tableId`, `status`, `dieSize`, `diceCount`
- `shooterSeatIndex`, `point`, `pointEstablished`
- `seats`: array of `CasinoDiceSeat.serialize()` results
- `currentSeatIndex`
- `jackpotPool`, `jackpotContributionPct`
- `minBet`, `maxBet`, `maxPayout`, `rakePct`
- `createdAt`, `lastActivityAt`
- `hostPlayerId`, `autoRoll`
- `lastRoll` (or `null`)

### `deserialize(data)`

Restores all fields from a serialized object. Uses nullish coalescing (`??`) for numeric fields to preserve `0`, and `||` for nullable/string fields. Seats are reconstructed via `new CasinoDiceSeat(seat.seatIndex)` + `seat.deserialize()`.

| Field | Default if missing |
|-------|-------------------|
| `tableId` | existing `this.tableId` |
| `status` | `'waiting'` |
| `dieSize` | `'d6'` |
| `diceCount` | `2` |
| `shooterSeatIndex` | `-1` |
| `point` | `null` |
| `pointEstablished` | `false` |
| `currentSeatIndex` | `-1` |
| `jackpotPool` | `0` |
| `jackpotContributionPct` | `0.10` |
| `minBet` | `100` |
| `maxBet` | `100000` |
| `maxPayout` | `10000` |
| `rakePct` | `0.05` |
| `hostPlayerId` | `null` |
| `autoRoll` | `false` |
| `lastRoll` | `null` |

---

## 8. State Machine

```
waiting ──(all seats bet)──▶ betting ──(roll triggered)──▶ rolling ──▶ settling ──▶ closed
                                                                │
                                                                └──(pending pass/dont_pass)──▶ rolling (multi-roll craps)
closed ──(resetForNewRound)──▶ waiting
```

- **waiting:** Table is idle, accepting new seat joins and bets
- **betting:** Players are placing bets; transitions to rolling when all seats have bet
- **rolling:** Dice have been rolled, settling in progress
- **settling:** Bets are being evaluated and paid out
- **closed:** Round is complete; table awaits reset for next round

---

## 9. Wiring

### In `gambler-dice-system.js`

| Method | Usage |
|--------|-------|
| Constructor | Creates `new CasinoDiceTable()` per table, stores in `this.tables` Map |
| `getTableState()` | Reads `table.status`, `dieSize`, `diceCount`, `shooterSeatIndex`, `point`, `pointEstablished`, `seats`, `jackpotPool`, `minBet`, `maxBet`, `maxPayout`, `rakePct`, `lastRoll`, `validBets` |
| `placeBet()` | Calls `table.placeBet(seatIndex, bet)` |
| `backBet()` | Calls `seat.addBet(backerBet)` directly on seat |
| `roll()` | Calls `table.setRoll()`, `table.setPoint()`, `this.settle()` |
| `settle()` | Reads `table.lastRoll`, `table.pointEstablished`, `table.point` for bet evaluation |
| `setShooter()` | Calls `table.setShooter(seatIndex)` |
| `resetForNextRound()` | Calls `table.resetForNewRound()` |
| `serialize()`/`setState()` | Serializes/deserializes all tables |

### In `server/world.js`

| Socket Action | Table Method Called |
|--------------|-------------------|
| `casinoDiceCreateTable` | `gdSys.createTable()` → `new CasinoDiceTable()` |
| `casinoDiceJoinTable` | `gdSys.joinTable()` → `table.joinSeat()` |
| `casinoDiceLeaveTable` | `gdSys.leaveTable()` → `table.leaveSeat()` |
| `casinoDiceListTables` | `gdSys.listTables()` (reads `table.status`, `dieSize`, `diceCount`, `occupiedSeats`, `openSeats`, `minBet`, `maxBet`, `jackpotPool`) |
| `casinoDicePlaceBet` | `gdSys.placeBet()` → `table.placeBet()` |
| `casinoDiceBackBet` | `gdSys.backBet()` → `seat.addBet()` |
| `casinoDiceRoll` | `gdSys.roll()` → `table.setRoll()`, `table.setPoint()`, `this.settle()` |
| `casinoDiceGetTableState` | `gdSys.getTableState()` (reads all table fields) |
| `casinoDiceGetBetMenu` | `gdSys.getBetMenu()` (reads `table.dieSize`) |
| `casinoDiceSetShooter` | `gdSys.setShooter()` → `table.setShooter()` |
| `casinoDiceResetTable` | `gdSys.resetForNextRound()` → `table.resetForNewRound()` |

### In `entities/Casino.js`

- `this.gamblerDiceTables = {}` — Map of tableId → serialized CasinoDiceTable
- Serialized in `Casino.serialize()` as `gamblerDiceTables`
- Deserialized in `Casino.deserialize()` from `casinoData.gamblerDiceTables`

---

## 10. Critical Implementation Details

### 10.1. `isFull()` Logic

```js
isFull() {
    return this.seats.every(s => !s.isEmpty());
}
```

Returns `true` only when every seat is occupied. Previously had a bug where it used `s.isEmpty()` (returning true when all seats were empty). Fixed.

### 10.2. Jackpot Pool

- 10% of hard-way and jackpot bet amounts are swept to `table.jackpotPool` at bet time
- Jackpot wins (5 dice all same face) pay 50% of `table.jackpotPool` from `world.js`
- Pool is reduced to `max(paid_out, floor(pool_before * 0.1))` — minimum 10% reserve remains

### 10.3. Pass/Don't Pass Point State

- `point` is set on come-out roll when sum is 4, 5, 6, 8, 9, or 10
- `pointEstablished = true` while a point is active
- Subsequent rolls resolve pass/don't_pass: sum == point (pass wins), sum == 7 (don't_pass wins)
- Other sums keep the point pending; table stays in `rolling` status

### 10.4. Serialization Round-Trip

All fields round-trip correctly through `serialize()` → `deserialize()`. Numeric fields use `??` to preserve `0`; boolean fields use `!!`; nullable fields use `|| null`.

---

## 11. Security

- All bet validation (min/max limits, target requirements, duplicate prevention) happens server-side in `gambler-dice-system.js` and `CasinoDiceTable.placeBet()`
- `maxPayout` caps single-roll payout per player (10,000 default)
- `maxBet` caps individual wager (100,000 default)
- Payouts capped at remaining `lotteryPool` balance via `payFromPool`
- Table state is server-authoritative; clients only receive logical data, never internal RNG state

---

## 12. Example

**Creating a D20 table with high stakes:**

```js
const table = new CasinoDiceTable({
    tableId: 'gd_high_stakes',
    dieSize: 'd20',
    diceCount: 2,
    minBet: 1000,
    maxBet: 50000,
    maxPayout: 50000,
    hostPlayerId: 'nat_456',
    autoRoll: false
});

// table.status = 'waiting'
// table.seats = [6 empty CasinoDiceSeat instances]
// table.jackpotPool = 0
// table.maxPayout = 50000
```

**Player joins and places a bet:**

```js
table.joinSeat(0, 'nat_456', 'user_789');
// seat 0 occupied, isShooter = true (first player)

table.placeBet(0, new CasinoDiceBet({
    seatIndex: 0,
    nationId: 'nat_456',
    betType: 'exact',
    target: 14,
    amount: 5000,
    payoutMultiplier: 17
}));
// seat 0: status = 'betting', totalWagered = 5000, bets = [1 bet]
// table.status = 'betting'
```

**Round settles:**

```js
table.setRoll([14, 14], 28, { allSame: true, sameFace: 14 });
table.status = 'settling';
// After settle(): bets resolved, payouts applied, table.status = 'closed'
```

**Reset for next round:**

```js
table.resetForNewRound();
// table.status = 'waiting'
// seat 0: bets = [], totalWagered = 0, totalWon = 0, status = 'waiting'
// isShooter persists (still seat 0)
```

---

## 13. Future Expansions

- Multiple die sizes per table (separate betting zones)
- Auto-roll implementation (`autoRoll` flag currently unused)
- Table chat / spectator mode
- Table-level betting limits that can be changed by host
- Tournament tables with entry fees and prize pools
- Table history / last N rolls display
