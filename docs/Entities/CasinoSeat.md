# CasinoSeat Entity — Documentation

**File:** `entities/CasinoSeat.js`  
**Integration:** `entities/CasinoTable.js` (seats array), `systems/Casino/cards/blackjack-system.js` (bet, hit, stand, double, split, surrender, insurance), `server/world.js` (socket actions)

---

## 1. Overview

CasinoSeat represents a single seat at a live blackjack table (1–6 seats per table). Each seat holds the player's hand, bet, insurance, split state, and turn status. Seats persist across multiple hands at a table; only per-hand state is reset between rounds.

---

## 2. Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `seatIndex` | number | — | Seat position (0–5), set at construction |
| `nationId` | string \| null | `null` | Occupying nation ID |
| `userId` | string \| null | `null` | Web user/session ID |
| `status` | string | `'empty'` | Seat lifecycle: `empty`, `waiting`, `betting`, `playing`, `stood`, `busted`, `blackjack`, `surrendered` |
| `hand` | Card[] | `[]` | Main hand cards: `{suit, rank, value, code}` |
| `bet` | number | `0` | Current wager placed this hand |
| `insuranceBet` | number | `0` | Insurance wager (0 if none) |
| `hasDoubled` | boolean | `false` | Whether player doubled down |
| `hasSplit` | boolean | `false` | Whether player has split |
| `isSplitHand` | boolean | `false` | Whether this seat is playing a split hand |
| `activeHand` | string | `'main'` | `'main'` \| `'split'` — which sub-hand is currently active |
| `splitHand` | object \| null | `null` | Second hand if split: `{hand, bet, status, hasDoubled}` |
| `insuranceDecided` | boolean | `false` | Whether player has decided on insurance this round |
| `turnTimerStartedAt` | number \| null | `null` | Turn timer start timestamp |
| `turnTimerDurationMs` | number | `30000` | Turn timer duration (30 seconds) |
| `lastActionAt` | number \| null | `null` | Timestamp of last action |

---

## 3. Lifecycle Methods

### `occupy(nationId, userId)`

Marks the seat as occupied by a nation and user. Resets per-hand state.

| Parameter | Type | Description |
|-----------|------|-------------|
| `nationId` | string | Occupying nation ID |
| `userId` | string | Web user/session ID |

Sets: `nationId`, `userId`, `status = 'waiting'`, `hand = []`, `bet = 0`, `insuranceBet = 0`, `hasDoubled = false`, `hasSplit = false`, `isSplitHand = false`, `activeHand = 'main'`, `splitHand = null`, `insuranceDecided = false`, `turnTimerStartedAt = null`, `lastActionAt = null`.

### `vacate()`

Vacates the seat. Clears all fields and resets to `empty` status.

Sets: `nationId = null`, `userId = null`, `status = 'empty'`, `hand = []`, `bet = 0`, `insuranceBet = 0`, `hasDoubled = false`, `hasSplit = false`, `isSplitHand = false`, `activeHand = 'main'`, `splitHand = null`, `insuranceDecided = false`, `turnTimerStartedAt = null`, `lastActionAt = null`.

### `isEmpty()`

**Returns:** `boolean` — `true` if `status === 'empty'`, `false` otherwise.

### `isPlaying()`

**Returns:** `boolean` — `true` if `status === 'playing'` or `status === 'betting'`, `false` otherwise.

### `isActed()`

**Returns:** `boolean` — `true` if the seat has completed its turn (`stood`, `busted`, `blackjack`, or `surrendered`), `false` otherwise.

### `isInsuranceDecided()`

**Returns:** `boolean` — `true` if the player has decided on insurance this round, `false` otherwise.

---

## 4. Active Hand Methods

### `getActiveHand()`

**Returns:** `Card[]` — The cards of the currently active hand. Returns `splitHand.hand` if `activeHand === 'split'` and `splitHand` exists; otherwise returns `this.hand`.

### `getActiveHandValue()`

**Returns:** `number` — The blackjack value of the active hand (with Ace handling).

### `getActiveHandBet()`

**Returns:** `number` — The bet amount for the active hand. Returns `splitHand.bet` if playing split hand; otherwise `this.bet`.

### `getActiveHandHasDoubled()`

**Returns:** `boolean` — Whether the active hand has been doubled. Returns `splitHand.hasDoubled` if playing split hand; otherwise `this.hasDoubled`.

---

## 5. Action Eligibility

### `canSplit()`

**Returns:** `boolean` — Whether the player can split their current hand.

Requires:
- Hand has exactly 2 cards
- Has not already split this round
- Not currently playing a split hand
- Both cards have the same rank

### `canDouble()`

**Returns:** `boolean` — Whether the player can double down on their active hand.

Requires:
- Active hand has exactly 2 cards
- Active hand has not been doubled

### `canSurrender()`

**Returns:** `boolean` — Whether the player can surrender their active hand.

Requires:
- Active hand has exactly 2 cards
- Active hand has not been doubled

---

## 6. Hand Helpers

### `addCard(card)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `card` | object | Card object `{suit, rank, value, code}` |

Adds a card to the main hand (`this.hand`).

### `addCardToActiveHand(card)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `card` | object | Card object `{suit, rank, value, code}` |

Adds a card to the active hand (main or split). Updates `lastActionAt`.

### `clearHand()`

Clears all cards from the main hand and the split hand (if any).

### `handValue()`

**Returns:** `number` — The blackjack value of the main hand (with Ace handling).

### `isBlackjack()`

**Returns:** `boolean` — `true` if the main hand has exactly 2 cards totaling 21, `false` otherwise.

### `isBusted()`

**Returns:** `boolean` — `true` if the main hand value exceeds 21, `false` otherwise.

---

## 7. Serialization

### `serialize()`

**Returns:** Plain object with all fields:
- `seatIndex`, `nationId`, `userId`, `status`
- `hand`: shallow copy of main hand array
- `bet`, `insuranceBet`
- `hasDoubled`, `hasSplit`, `isSplitHand`, `activeHand`
- `splitHand`: shallow copy with `hand` array copied (`null` if none)
- `insuranceDecided`, `turnTimerStartedAt`, `turnTimerDurationMs`, `lastActionAt`

Used by `CasinoTable.serialize()` → `BlackjackSystem.getState()` → `CasinoSystem.getState()` → world state persistence.

### `deserialize(data)`

Restores all fields from a serialized object.

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | object | Serialized seat data |

Uses nullish coalescing (`??`) for `seatIndex` and `turnTimerDurationMs` to preserve `0` defaults, `||` for nullable fields (`nationId`, `userId`, `status`, `lastActionAt`), and `!!` for booleans. Hand array is shallow-copied. `splitHand` is restored as-is (null if absent).

---

## 8. Wiring

### In `CasinoTable.js`

| Location | Usage |
|----------|-------|
| Line 11 | Import: `const { CasinoSeat, calculateHandValue } = require('./CasinoSeat.js')` |
| Line 33 | Constructor: Creates 6 seats via `new CasinoSeat(i)` |
| Line 263 | `deserialize()`: `new CasinoSeat(seat.seatIndex)` + `s.deserialize(...)` |

### In `blackjack-system.js`

| Location | Usage |
|----------|-------|
| Line 24 | Import: `const { CasinoSeat, calculateHandValue } = require('../../entities/CasinoSeat.js')` |
| `placeBet()` | Reads `seat.bet`, `seat.status`, `seat.userId` |
| `hit()` | Calls `seat.addCardToActiveHand(card)`, `seat.getActiveHandValue()` |
| `stand()` | Reads `seat.activeHand`, `seat.splitHand.status` |
| `doubleDown()` | Calls `seat.canDouble()`, `seat.getActiveHandBet()`, modifies `seat.splitHand.bet` / `seat.bet` |
| `split()` | Calls `seat.canSplit()`, `seat.hand.pop()`, creates `seat.splitHand` |
| `surrender()` | Calls `seat.canSurrender()`, `seat.getActiveHandBet()` |
| `settle()` | Reads `seat.handValue()`, `seat.bet`, `seat.insuranceBet`, `seat.isBlackjack()`, `seat.splitHand` |
| `getTableState()` | Reads `seat.activeHand`, `seat.hand`, `seat.splitHand`, `seat.canDouble()`, `seat.canSplit()`, `seat.canSurrender()` |

### In `server/world.js`

| Socket Action | Seat Method Called |
|--------------|-------------------|
| `casinoJoinTable` | `seat.occupy(nationId, userId)` |
| `casinoLeaveTable` | `seat.vacate()` |
| `casinoPlaceBet` | `seat.bet` set via `table.placeBet()` |
| `casinoBlackjackHit` | `seat.addCardToActiveHand(card)` |
| `casinoBlackjackStand` | `seat.status = 'stood'` / `seat.splitHand.status = 'stood'` |
| `casinoBlackjackDouble` | `seat.bet *= 2`, `seat.hasDoubled = true` / `seat.splitHand.bet *= 2` |
| `casinoBlackjackSplit` | `seat.hand.pop()`, `seat.splitHand = {...}` |
| `casinoBlackjackSurrender` | `seat.status = 'surrendered'` / `seat.splitHand.status = 'surrendered'` |
| `casinoBlackjackInsurance` | `seat.insuranceBet`, `seat.insuranceDecided` |
| `casinoSettleBlackjack` | `seat.handValue()`, `seat.bet`, `seat.payout` |

---

## 9. State Machine

```
empty ──occupy()──▶ waiting ──placeBet()──▶ betting ──deal()──▶ playing
                                                    │                                    │
                                                    ▼                                    ▼
                                              hit/stand/double/split/surrender   dealer turn / settle
                                                    │                                    │
                                                    ▼                                    ▼
                                              stood/busted/blackjack/surrender   closed → waiting (new hand)
                                                    │
                                                    └──▶ vacate() ──▶ empty
```

- `occupy()` can be called from `empty` → `waiting`
- `vacate()` can be called from any state but typically only when `empty`, `waiting`, or after hand resolution
- Split hands create a second sub-hand tracked in `seat.splitHand`

---

## 10. Critical Implementation Details

### 10.1. Active Hand vs Main Hand

`getActiveHand()` returns `splitHand.hand` when `activeHand === 'split'` AND `splitHand` exists. Otherwise returns `this.hand`. All action eligibility methods (`canDouble`, `canSurrender`) use `getActiveHand()` to evaluate the correct hand.

### 10.2. `getActiveHandHasDoubled()` Null Safety

```js
getActiveHandHasDoubled() {
    return this.activeHand === 'split' && this.splitHand
        ? this.splitHand.hasDoubled
        : this.hasDoubled;
}
```

Uses `&& this.splitHand` to prevent null dereference when `activeHand === 'split'` but `splitHand` is null.

### 10.3. Split Hand State

When a split occurs:
1. Second card is removed from `this.hand` via `seat.hand.pop()`
2. `seat.splitHand = { hand: [secondCard], bet: splitBet, status: 'playing', hasDoubled: false }`
3. `seat.hasSplit = true`
4. Each sub-hand receives one additional card
5. `seat.activeHand` switches to `'split'` when playing the second hand

### 10.4. Serialization Round-Trip

All fields round-trip correctly through `serialize()` → `deserialize()`. Numeric fields use `??` to preserve `0`; boolean fields use `!!`; nullable fields use `|| null`. `splitHand.hand` is shallow-copied.

---

## 11. Example

**Player joins seat 3 and places a bet:**

```js
const seat = table.getSeat(3);
seat.occupy('nat_456', 'user_789');
// seat: { seatIndex: 3, nationId: 'nat_456', userId: 'user_789', status: 'waiting', hand: [], bet: 0, ... }

seat.bet = 500;
seat.status = 'betting';
// seat.bet = 500, seat.status = 'betting'
```

**Player is dealt a pair of 8s and splits:**

```js
seat.hand = [{suit: 'hearts', rank: '8', value: 8}, {suit: 'spades', rank: '8', value: 8}];
seat.canSplit(); // true

seat.splitHand = {
    hand: [seat.hand.pop()], // second 8
    bet: seat.bet,           // same bet amount
    status: 'playing',
    hasDoubled: false
};
seat.hasSplit = true;

// Deal one card to each hand
seat.addCard({suit: 'diamonds', rank: '3', value: 3});   // main hand: 8+3=11
seat.splitHand.hand.push({suit: 'clubs', rank: 'K', value: 10}); // split hand: 8+K=18
```

**Player doubles on split hand:**

```js
seat.activeHand = 'split';
seat.canDouble(); // true (split hand has 2 cards, not doubled)
seat.splitHand.bet *= 2;
seat.splitHand.hasDoubled = true;
seat.addCardToActiveHand({suit: 'spades', rank: '3', value: 3}); // split hand: 8+K+3=21
```

**Serialization:**

```js
const data = seat.serialize();
// data.splitHand = { hand: [...], bet: 1000, status: 'playing', hasDoubled: true }
const seat2 = new CasinoSeat(3);
seat2.deserialize(data);
// seat2.splitHand.hand contains the split hand cards
```

---

## 11. Security

- `addCardToActiveHand()` validates card is pushed to the correct hand array
- `canSplit()`/`canDouble()`/`canSurrender()` validate hand state server-side before allowing actions
- `vacate()` clears all mutable state — no data leakage between players reusing a seat
- `splitHand.hand` is shallow-copied in serialization to prevent reference leaks

---

## 12. Future Expansions

- Per-seat turn timer expiration (auto-stand if timer expires)
- Seat ratings / player history tracking
- Side bet tracking per seat (Perfect Pairs, 21+3)
- Multi-hand support beyond split (multiple simultaneous hands)
- Seat preferences (auto-bet, auto-stand thresholds)
