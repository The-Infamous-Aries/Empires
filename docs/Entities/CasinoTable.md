# CasinoTable Entity — Documentation

**File:** `entities/CasinoTable.js`  
**Integration:** `entities/CasinoSeat.js` (6 seats), `systems/Casino/cards/blackjack-system.js` (all game actions), `server/world.js` (socket actions), `entities/Casino.js` (`blackjackTables` map)

---

## 1. Overview

CasinoTable is a **stateful, multiplayer blackjack table** where 1–6 real users play their own hands against a shared dealer hand. The table persists in memory across multiple player actions (bet → deal → hit/stand/double/split/surrender → settle).

Each table uses a **3-deck shoe (156 cards)** with penetration-based reshuffling (~66%). The dealer hits on soft 17 (H17 rule). All randomness uses `crypto.randomInt()` — no `Math.random()`.

---

## 2. Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `tableId` | string | `bj_<uuid>` | Unique table identifier |
| `status` | string | `'waiting'` | Table lifecycle: `waiting`, `betting`, `dealing`, `insurance`, `playerTurn`, `dealerTurn`, `settling`, `closed` |
| `shoe` | Card[] | `[]` | Current shuffled shoe (3 decks = 156 cards) |
| `shoeCardsUsed` | number | `0` | Cards dealt from shoe this session |
| `penetrationTarget` | number | `104` | Reshuffle threshold (~66% of 156) |
| `dealerHand` | Card[] | `[]` | Dealer's current hand |
| `dealerHoleCardRevealed` | boolean | `false` | Whether dealer hole card is face up |
| `seats` | CasinoSeat[] | `[]` | 6 seat instances |
| `currentSeatIndex` | number | `-1` | Whose turn it is (−1 if dealer turn) |
| `burnCard` | Card \| null | `null` | First card burned at start of shoe |
| `createdAt` | number | `Date.now()` | Table creation timestamp |
| `lastActivityAt` | number | `Date.now()` | Last activity timestamp |
| `minBet` | number | `100` | Minimum wager per hand |
| `maxBet` | number | `100000` | Maximum wager per hand |
| `hostPlayerId` | string \| null | `null` | Table creator's nation ID |

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

**Returns:** `CasinoSeat \| null` — The seat at the given index, or `null` if out of range.

### `getOccupiedSeats()`

**Returns:** `CasinoSeat[]` — All seats where `isEmpty()` is false.

### `getActiveSeats()`

**Returns:** `CasinoSeat[]` — All seats currently playing a hand (status: `betting`, `playing`, `stood`, `busted`, `blackjack`, `surrendered`).

### `allSeatsActed()`

**Returns:** `boolean` — `true` if all active seats have completed their turn (`isActed()` returns true), `false` otherwise.

---

## 4. Shoe Management

### `createShoe()`

Creates a fresh 3-deck shoe (156 cards) and shuffles it using `crypto.randomInt()`. Burns the top card. Resets `shoeCardsUsed` to 0.

**Returns:** `Card[]` — The shuffled shoe array.

Card structure: `{ suit, rank, value, code }` where `code` is like `"AS"` (Ace of Spades) or `"10H"` (10 of Hearts).

### `drawCard()`

Draws a card from the shoe. If `shoeCardsUsed >= penetrationTarget` and cards remain, reshuffles into a new shoe first. If shoe is empty, creates a new shoe.

**Returns:** `Card \| null` — The drawn card, or `null` if shoe is empty.

Updates `shoeCardsUsed` and `lastActivityAt`.

---

## 5. Dealer Logic

### `dealerValue()`

**Returns:** `number` — The blackjack value of the dealer hand (with Ace handling).

### `dealerShouldHit()`

**Returns:** `boolean` — Whether the dealer should hit based on H17 rules:
- Hits on hard total < 17
- Hits on soft 17 (Ace counted as 11)
- Stands on hard 17 or higher

---

## 6. Seat Operations

### `joinSeat(seatIndex, nationId, userId)`

Occupies an empty seat at the table.

| Parameter | Type | Description |
|-----------|------|-------------|
| `seatIndex` | number | Seat position (0–5) |
| `nationId` | string | Occupying nation ID |
| `userId` | string | Web user/session ID |

**Returns:** `boolean` — `true` if joined successfully, `false` if seat is out of range or not empty.

### `leaveSeat(seatIndex)`

Vacates a seat. Cannot leave mid-hand if playing or betting.

| Parameter | Type | Description |
|-----------|------|-------------|
| `seatIndex` | number | Seat position (0–5) |

**Returns:** `{ ok: boolean, refundedBet: number, reason?: string }`

**Behavior:**
1. Validates seat exists and is not empty
2. Blocks if `status === 'betting'` or `status === 'playing'` or `status === 'insurance'` (handled by blackjack-system `leaveTable`)
3. If betting and seat has a bet: captures `seat.bet` as `refundedBet` (caller responsible for returning money to nation)
4. Calls `seat.vacate()`
5. Updates `lastActivityAt`

### `placeBet(seatIndex, amount)`

Places a bet on a seat during the betting phase.

| Parameter | Type | Description |
|-----------|------|-------------|
| `seatIndex` | number | Seat position (0–5) |
| `amount` | number | Wager amount |

**Returns:** `{ ok: boolean, reason?: string }`

**Behavior:**
1. Validates seat exists and is not empty
2. Validates `table.status === 'betting'`
3. Validates no existing bet (`seat.bet > 0` rejects duplicate)
4. Validates `amount` between `minBet` and `maxBet`
5. Sets `seat.bet = amount`, `seat.status = 'betting'`
6. Updates `seat.lastActionAt` and `table.lastActivityAt`

---

## 7. Round Reset

### `resetForNewHand()`

Resets the table for a new hand while keeping seats occupied. Clears all hands, bets, dealer cards, and resets statuses.

**Behavior:**
1. `this.dealerHand = []`
2. `this.dealerHoleCardRevealed = false`
3. `this.currentSeatIndex = -1`
4. `this.status = 'waiting'`
5. `this.lastActivityAt = Date.now()`
6. Reshuffles shoe if `shoe.length < 20`
7. For each non-empty seat:
   - `seat.hand = []`
   - `seat.bet = 0`
   - `seat.insuranceBet = 0`
   - `seat.insuranceDecided = false`
   - `seat.hasDoubled = false`
   - `seat.hasSplit = false`
   - `seat.isSplitHand = false`
   - `seat.activeHand = 'main'`
   - `seat.splitHand = null`
   - `seat.turnTimerStartedAt = null`
   - `seat.lastActionAt = null`
   - `seat.status = 'waiting'`

---

## 8. Serialization

### `serialize()`

**Returns:** Plain object with all fields:
- `tableId`, `status`, `shoe` (shallow copy), `shoeCardsUsed`, `penetrationTarget`
- `dealerHand` (shallow copy), `dealerHoleCardRevealed`
- `seats`: array of `CasinoSeat.serialize()` results
- `currentSeatIndex`, `burnCard`
- `createdAt`, `lastActivityAt`
- `minBet`, `maxBet`, `hostPlayerId`

Used by `BlackjackSystem.getState()` → `CasinoSystem.getState()` → world state persistence.

### `deserialize(data)`

Restores all fields from a serialized object.

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | object | Serialized table data |

Uses nullish coalescing (`??`) for numeric fields to preserve `0`, `||` for nullable fields, `!!` for booleans. Seats are reconstructed via `new CasinoSeat(seat.seatIndex)` + `seat.deserialize()`.

---

## 9. State Machine

```
waiting ──(all seats bet)──▶ betting ──deal()──▶ playerTurn
                                                    │
                                                    ▼
                                              hit/stand/double/split/surrender
                                                    │                                    │
                                                    ▼                                    ▼
                                              stood/busted/blackjack/surrender   allSeatsActed()
                                                    │                                    │
                                                    ▼                                    ▼
                                              dealerTurn ──▶ settling ──▶ closed
                                                    │
                                                    └──▶ resetForNewHand() ──▶ waiting
```

- **waiting:** Table is idle, accepting new seat joins and bets
- **betting:** Players are placing bets; transitions to dealing when all seats have bet
- **dealing:** Initial cards are dealt to all seats and dealer
- **insurance:** Dealer shows Ace; players decide on insurance bets
- **playerTurn:** Players act in seat order (hit/stand/double/split/surrender)
- **dealerTurn:** Dealer hits/stands per H17 rules
- **settling:** All hands resolved, payouts calculated
- **closed:** Round complete; table awaits reset for next hand

---

## 10. Wiring

### In `blackjack-system.js`

| Location | Usage |
|----------|-------|
| Line 11 | Import: `const { CasinoTable } = require('../../entities/CasinoTable.js')` |
| `createTable()` | Creates `new CasinoTable()` per table, stores in `this.tables` Map |
| `getPublicTable()` | Creates default table if none exists |
| `joinTable()` | Calls `table.joinSeat(seatIndex, nationId, userId)` |
| `leaveTable()` | Calls `table.leaveSeat(seatIndex)` — blocks mid-hand exits |
| `placeBet()` | Calls `table.placeBet(seatIndex, amount)` |
| `dealInitial()` | Calls `table.drawCard()` for each seat and dealer |
| `hit()`/`stand()`/`doubleDown()`/`split()`/`surrender()` | Modify seat state directly |
| `dealerTurn()` | Calls `table.dealerShouldHit()`, `table.drawCard()` |
| `settle()` | Reads seat hands, dealer hand, computes payouts |
| `getTableState()` | Reads all table and seat fields for client rendering |

### In `server/world.js`

| Socket Action | Table Method Called |
|--------------|-------------------|
| `casinoJoinTable` | `bjSys.joinTable(table, seatIndex, nationId, userId)` → `table.joinSeat()` |
| `casinoLeaveTable` | `bjSys.leaveTable(table, seatIndex)` → `table.leaveSeat(seatIndex)` |
| `casinoListTables` / `casinoGetTableList` | `bjSys.listTables()` (reads table status, seats, bets) |
| `casinoPlaceBet` | `bjSys.placeBet(table, seatIndex, amount, nation, casinoSystem)` → `table.placeBet()` |
| `casinoDealInitial` | `bjSys.dealInitial(table)` → `table.drawCard()` |
| `casinoBlackjackHit` | `bjSys.hit(table, seatIndex)` → `seat.addCard(card)` |
| `casinoBlackjackStand` | `bjSys.stand(table, seatIndex)` → `seat.status = 'stood'` |
| `casinoBlackjackDouble` | `bjSys.doubleDown(table, seatIndex, nation, casinoSystem)` → `seat.bet *= 2` |
| `casinoBlackjackSplit` | `bjSys.split(table, seatIndex, nation, casinoSystem)` → `seat.hand.pop()`, `seat.splitHand` |
| `casinoBlackjackSurrender` | `bjSys.surrender(table, seatIndex, nation, casinoSystem)` → `seat.status = 'surrendered'` |
| `casinoBlackjackInsurance` | `bjSys.placeInsurance(table, seatIndex, amount, nation, casinoSystem)` → `seat.insuranceBet` |
| `casinoResolveInsurance` | `bjSys.resolveInsurance(table, casinoSystem)` → `table.dealerHoleCardRevealed` |
| `casinoGetTableState` | `bjSys.getTableState(table, cardSet)` → reads all table/seat fields |
| `casinoSettleBlackjack` | `bjSys.settle(table, casinoSystem)` → reads seats, dealer hand |

### In `entities/Casino.js`

- `this.blackjackTables = {}` — Map of tableId → serialized CasinoTable
- Serialized in `Casino.serialize()` as `blackjackTables`
- Deserialized in `Casino.deserialize()` from `casinoData.blackjackTables`

---

## 11. Security

- **Server-authoritative RNG:** `crypto.randomInt()` for shuffling and card draw — no `Math.random()`
- **Dealer hole card never sent to clients:** Only up card visible until `dealerHoleCardRevealed = true`
- **Remaining shoe never sent to clients:** Only `shoeCardsRemaining` count exposed via `getTableState()`
- **Bet validation:** min/max limits checked server-side; duplicate bets rejected (`seat.bet > 0`)
- **No mid-hand seat changes:** Cannot leave while betting, playing, or in insurance phase
- **Shoe penetration reshuffle:** Prevents card counting by reshuffling at ~66% penetration
- **Burn card:** Top card burned at start of each shoe for additional unpredictability

---

## 12. Example

**Creating a new table:**

```js
const table = new CasinoTable({
    tableId: 'bj_high_stakes',
    minBet: 500,
    maxBet: 50000,
    hostPlayerId: 'nat_456',
    penetrationTarget: 104
});

// table.status = 'waiting'
// table.seats = [6 empty CasinoSeat instances]
// table.shoe = [] (created on first deal)
// table.minBet = 500, table.maxBet = 50000
```

**Player joins and places a bet:**

```js
table.joinSeat(0, 'nat_456', 'user_789');
// seat 0 occupied, status = 'waiting'

table.placeBet(0, 1000);
// seat 0: bet = 1000, status = 'betting'
// table.status = 'betting'
```

**Dealing initial cards:**

```js
// After dealInitial():
// seat 0: hand = [{A,♠},{10,♥}], status = 'playing' (blackjack!)
// dealer: hand = [{7,♦},{?,?}] (hole card face down)
// table.status = 'insurance' or 'playerTurn'
```

**Round settles:**

```js
// After settle():
// seat 0: status = 'blackjack', payout = 1000 * 2.5 = 2500
// table.status = 'closed'
```

**Reset for next hand:**

```js
table.resetForNewHand();
// table.status = 'waiting'
// seat 0: hand = [], bet = 0, status = 'waiting'
// dealer hand cleared, shoe reshuffled if < 20 cards remain
```

---

## 13. Future Expansions

- Side bets (Perfect Pairs, 21+3, Lucky Ladies, Royal Match)
- Surrender restrictions (early vs late surrender)
- Double after split restrictions
- Dealer stands on soft 17 option (S17 vs H17)
- Multi-table tournament mode
- Card counting detection / bet spread monitoring
- Insurance-only tables
- Six-deck vs eight-deck shoe options
- Table minimum/maximum dynamic adjustment based on demand
