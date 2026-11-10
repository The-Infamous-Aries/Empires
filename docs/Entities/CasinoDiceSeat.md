# CasinoDiceSeat Entity — Documentation

**File:** `entities/CasinoDiceSeat.js`  
**Integration:** `entities/CasinoDiceTable.js` (seats array), `systems/Casino/dice/gambler-dice-system.js` (placeBet, backBet, roll, settle, resolveInsurance), `server/world.js` (casinoDiceJoinTable, casinoDiceLeaveTable, casinoDicePlaceBet, casinoDiceBackBet, casinoDiceRoll)

---

## 1. Overview

CasinoDiceSeat represents a single seat at a live craps-style dice table (1–6 seats per table). Each seat holds the player's bets, shooter status, per-round wagering totals, and lifecycle state. Seats persist across multiple rounds at a table; only their per-round state (bets, totals, status) is reset between rolls.

---

## 2. Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `seatIndex` | number | — | Seat position (0–5), set at construction |
| `nationId` | string \| null | `null` | Occupying nation ID |
| `userId` | string \| null | `null` | Web user/session ID |
| `status` | string | `'empty'` | Seat lifecycle: `empty`, `waiting`, `betting`, `rolled`, `sitting_out` |
| `bets` | CasinoDiceBet[] | `[]` | Array of bets placed this round |
| `isShooter` | boolean | `false` | Whether this seat is the current shooter |
| `lastActionAt` | number \| null | `null` | Timestamp of last action (bet, roll action, etc.) |
| `totalWagered` | number | `0` | Total amount wagered this round (all bets) |
| `totalWon` | number | `0` | Total amount won this round (all payouts) |

---

## 3. Lifecycle Methods

### `occupy(nationId, userId)`

Marks the seat as occupied by a nation and user. Resets per-round state.

| Parameter | Type | Description |
|-----------|------|-------------|
| `nationId` | string | Occupying nation ID |
| `userId` | string | Web user/session ID |

Sets: `nationId`, `userId`, `status = 'waiting'`, `bets = []`, `isShooter = false`, `lastActionAt = Date.now()`, `totalWagered = 0`, `totalWon = 0`.

### `vacate()`

Vacates the seat. Clears all fields and resets to `empty` status.

Sets: `nationId = null`, `userId = null`, `status = 'empty'`, `bets = []`, `isShooter = false`, `lastActionAt = null`, `totalWagered = 0`, `totalWon = 0`.

### `isEmpty()`

**Returns:** `boolean` — `true` if `status === 'empty'`, `false` otherwise.

### `isBetting()`

**Returns:** `boolean` — `true` if `status === 'betting'`, `false` otherwise.

### `hasBets()`

**Returns:** `boolean` — `true` if `bets.length > 0`, `false` otherwise.

### `totalBetAmount()`

**Returns:** `number` — Sum of `bet.amount` across all bets in `this.bets`. Equivalent to `totalWagered`.

---

## 4. Bet Management

### `addBet(bet)`

Adds a bet to the seat's bet array and updates per-round totals.

| Parameter | Type | Description |
|-----------|------|-------------|
| `bet` | CasinoDiceBet | Bet object to add |

**Throws:** Error if `bet` is missing or `bet.amount` is not a valid number.

Sets: pushes bet to `this.bets`, increments `this.totalWagered` by `bet.amount`, sets `this.lastActionAt = Date.now()`.

### `clearBets()`

Clears all bets and resets per-round wagering totals.

Sets: `this.bets = []`, `this.totalWagered = 0`, `this.totalWon = 0`.

### `getBet(betId)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `betId` | string | Bet ID to find |

**Returns:** `CasinoDiceBet \| null` — The matching bet, or `null` if not found.

---

## 5. Serialization

### `serialize()`

**Returns:** Plain object with all fields:
- `seatIndex`, `nationId`, `userId`, `status`
- `bets`: array of `CasinoDiceBet.serialize()` results
- `isShooter`, `lastActionAt`, `totalWagered`, `totalWon`

Used by `CasinoDiceTable.serialize()` → `GamblerDiceSystem.getState()`.

### `deserialize(data)`

Restores all fields from a serialized object.

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | object | Serialized seat data |

Uses nullish coalescing (`??`) for numeric fields (`seatIndex`, `totalWagered`, `totalWon`) to preserve `0`, and `||` for nullable fields (`nationId`, `userId`, `status`, `lastActionAt`). Bets are reconstructed via `new CasinoDiceBet()` + `bet.deserialize(b)`.

---

## 6. Wiring

### In `CasinoDiceTable.js`

| Location | Usage |
|----------|-------|
| Line 11 | Import: `const { CasinoDiceSeat } = require('./CasinoDiceSeat.js')` |
| Line 37 | Constructor: Creates 6 seats via `new CasinoDiceSeat(i)` |
| Line 109 | `joinSeat()`: Calls `seat.occupy(nationId, userId)` |
| Line 132 | `leaveSeat()`: Calls `seat.vacate()` |
| Line 144 | `placeBet()`: Calls `seat.addBet(bet)` |
| Line 209 | `serialize()`: `seats.map(s => s.serialize())` |
| Line 234-235 | `deserialize()`: `new CasinoDiceSeat(seat.seatIndex)` + `s.deserialize(...)` |

### In `gambler-dice-system.js`

- **`placeBet()`**: Creates bet via `new CasinoDiceBet(...)`, calls `table.placeBet(seatIndex, bet)` which calls `seat.addBet(bet)`
- **`backBet()`**: Creates backing bet via `new CasinoDiceBet(...)`, calls `seat.addBet(backerBet)`
- **`settle()`**: Iterates `table.seats`, reads `seat.bets`, evaluates each bet, accumulates `seat.totalWon`
- **`roll()`**: Sets `table.status = 'settling'`, calls `settle()`

### In `server/world.js`

- **`casinoDiceJoinTable`**: Calls `gdSys.joinTable(table, seatIndex, n.id, r.player.playerId)` → `table.joinSeat()` → `seat.occupy()`
- **`casinoDiceLeaveTable`**: Finds seat by nation ID, calls `gdSys.leaveTable(table, seatIndex)` → `table.leaveSeat()` → `seat.vacate()`
- **`casinoDicePlaceBet`**: Calls `gdSys.placeBet(...)` → `table.placeBet()` → `seat.addBet()`
- **`casinoDiceBackBet`**: Calls `gdSys.backBet(...)` → `seat.addBet(backerBet)`
- **`casinoDiceRoll`**: Calls `gdSys.roll(table, casinoSystem)` → `settle()` → reads `seat.totalWon`, `seatResult.bets`
- **`casinoSettleBlackjack`**: Updates `nation.casino.games.gamblerDice` stats per seat result

---

## 7. State Machine

```
empty ──occupy()──▶ waiting ──placeBet()──▶ betting
                                                    │
                                                    ▼
                                              rolled (via table.roll)
                                                    │
                                                    ▼
                                              settle() / resetForNewRound()
                                                    │
                                                    └──▶ waiting (new round)
                                                    └──▶ empty (via vacate())
```

- `vacate()` can be called from any state but typically only when `status` is `waiting` or `sitting_out` (table.leaveSeat() blocks if `betting` or `rolled`)
- Shooter status persists across rounds until seat vacates or shooter is changed via `table.setShooter()`

---

## 8. Critical Implementation Details

### 8.1. `totalWagered` vs `totalBetAmount()`

`totalBetAmount()` computes `bets.reduce((sum, bet) => sum + bet.amount, 0)` on demand, while `totalWagered` is maintained incrementally in `addBet()` and reset in `clearBets()`/`resetForNewRound()`. Both should always match; `totalWagered` is the source of truth used by `serialize()`.

### 8.2. `totalWon` Reset

`totalWon` is reset by `clearBets()` and `resetForNewRound()` but NOT by `vacate()` in isolation — wait, actually `vacate()` does reset `totalWon = 0`. All lifecycle methods reset it consistently.

### 8.3. Serialization Round-Trip

All fields serialize/deserialize correctly:
- Numeric fields (`seatIndex`, `totalWagered`, `totalWon`) use `??` to preserve `0`
- Nullable fields (`nationId`, `userId`, `lastActionAt`) use `|| null`
- Boolean fields (`isShooter`) use `!!`
- Bets array is deep-serialized/deserialized via `CasinoDiceBet`

---

## 9. Example

**Player joins seat 2:**

```js
const seat = table.getSeat(2);
seat.occupy('nat_456', 'user_789');
// seat: { seatIndex: 2, nationId: 'nat_456', userId: 'user_789', status: 'waiting', bets: [], isShooter: false, ... }
```

**Player places two bets:**

```js
seat.addBet(new CasinoDiceBet({ amount: 500, betType: 'exact', target: 14, payoutMultiplier: 17 }));
seat.addBet(new CasinoDiceBet({ amount: 200, betType: 'high' }));
// seat.totalWagered = 700
// seat.bets.length = 2
// seat.status should be 'betting' (set by table.placeBet)
```

**Round settles, player wins:**

```js
// After settle(): seat.totalWon reflects total payouts
// seat.status remains whatever it was set to during settlement
// Next round: table.resetForNewRound() clears bets, totals, sets status = 'waiting'
```

---

## 10. Security

- `addBet()` validates that `bet.amount` is a valid number — prevents NaN corruption of `totalWagered`
- Seat index is immutable after construction (`seatIndex` set only in constructor)
- `vacate()` clears all mutable state — no data leakage between players reusing a seat
- `totalWagered` is incremented server-side only; client cannot inflate it

---

## 11. Future Expansions

- Per-seat turn timer expiration (auto-fold/stand if timer expires)
- Seat ratings / player history tracking
- Seat preferences (auto-bet patterns, favorite bet types)
- Spectator mode for empty seats
