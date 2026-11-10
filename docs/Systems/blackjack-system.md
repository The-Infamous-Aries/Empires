# Blackjack System — Documentation

**File:** `systems/Casino/cards/blackjack-system.js`  
**Entities:** `entities/CasinoTable.js`, `entities/CasinoSeat.js`, `entities/CasinoCardSet.js`  
**Integration:** `systems/Casino/casino-system.js` (as `blackjackSystem` subsystem), `server/world.js` (socket actions)

---

## 1. Overview

Blackjack is a **live, multiplayer card table game**. Multiple players (1–6 seats) join a table, place bets against a shared dealer hand, and the house resolves all bets against the World Bank lottery pool. The system supports:

- **Multi-6 deck shoe** with penetration-based reshuffle (~66%)
- **Dealer hits soft 17** (H17 rule)
- **Insurance phase** when dealer up card is Ace
- **Split** (pairs only), **double down** (any two cards), **surrender** (any two cards)
- **Natural blackjack pays 3:2**
- **World Bank pool integration** — all wagers add to the pool; all payouts paid from the pool (capped at balance)
- **Per-player card set themes** — each player sees cards rendered with their own `settings.ui.cardSet`

---

## 2. Architecture

### 2.1. Table Entity (`CasinoTable`)

A stateful 6-seat blackjack table that persists across multiple hands.

| Field | Type | Description |
|-------|------|-------------|
| `tableId` | string | Unique ID (`bj_<uuid>`) |
| `status` | string | `waiting`, `betting`, `dealing`, `insurance`, `playerTurn`, `dealerTurn`, `settling`, `closed` |
| `shoe` | Card[] | Current 3-deck shoe (156 cards) |
| `shoeCardsUsed` | number | Cards dealt from shoe this session |
| `penetrationTarget` | number | Reshuffle threshold (default 104 / ~66%) |
| `dealerHand` | Card[] | Dealer's current hand |
| `dealerHoleCardRevealed` | boolean | Whether hole card is face up |
| `seats` | CasinoSeat[] | 6 seats |
| `currentSeatIndex` | number | Whose turn it is (-1 if dealer turn) |
| `burnCard` | Card \| null | First card burned at start of shoe |
| `minBet`, `maxBet` | number | Bet limits |
| `hostPlayerId` | string \| null | Table creator |
| `createdAt`, `lastActivityAt` | number | Timestamps |

### 2.2. Seat Entity (`CasinoSeat`)

| Field | Type | Description |
|-------|------|-------------|
| `seatIndex` | number | 0–5 |
| `nationId` | string \| null | Occupying nation |
| `userId` | string \| null | Web user/session |
| `status` | string | `empty`, `waiting`, `betting`, `playing`, `stood`, `busted`, `blackjack`, `surrendered` |
| `hand` | Card[] | Main hand cards |
| `bet` | number | Current wager |
| `insuranceBet` | number | Insurance wager (0 if none) |
| `hasDoubled` | boolean | Whether player doubled down |
| `hasSplit` | boolean | Whether player has split |
| `isSplitHand` | boolean | Whether this seat is playing a split hand |
| `activeHand` | string | `'main'` \| `'split'` — which sub-hand is currently active |
| `splitHand` | object \| null | Second hand if split: `{hand, bet, status, hasDoubled}` |
| `insuranceDecided` | boolean | Whether player decided on insurance this round |
| `turnTimerStartedAt` | number | Turn timer start timestamp |
| `turnTimerDurationMs` | number | Turn timer duration (default 30000) |
| `lastActionAt` | number | Last action timestamp |

### 2.3. Card Set Entity (`CasinoCardSet`)

Static registry mapping card set IDs to asset paths. Six sets available: Artistic, Classic, Dark, Light, Off-White, White & Red tinted.

- Server deals logical cards (suit + rank only); never sends image paths
- Each player's browser renders cards using their own `settings.ui.cardSet`
- `resolveCardPath(cardSet, suit, rank, variant)` resolves image URLs
- `getCardSetPreviews(cardSet)` returns 4 alternating card pairs for settings UI dropdown

---

## 3. Game Flow

### Phase 1: Joining

1. Player calls `casinoJoinTable` with `tableId` and `seatIndex`
2. Seat is occupied; player status set to `waiting`
3. First player to join at a new table can be designated shooter (not applicable to blackjack — all players play simultaneously against dealer)

### Phase 2: Betting

1. Table status transitions to `betting`
2. Players place bets via `casinoPlaceBet` with `amount` between `minBet` and `maxBet`
3. Wagers deducted from `nation.money` immediately and added to World Bank pool via `addToPool`
4. Duplicate bets rejected (`seat.bet > 0`)
5. When all occupied seats have bet, table moves to `dealing`

### Phase 3: Dealing

1. `casinoDealInitial` triggers the deal
2. Round 1: one face-up card to each seat, one face-up to dealer
3. Round 2: one face-up card to each seat, one face-down (hole) to dealer
4. Natural blackjacks (21 on first two cards) detected immediately
5. If dealer up card is Ace → insurance phase; otherwise → player turns

### Phase 4: Insurance (when dealer shows Ace)

1. Each seated player is offered insurance (up to 50% of original bet) via `casinoBlackjackInsurance`
2. Players can accept (max insurance) or decline (0)
3. After all decisions, dealer hole card is revealed
4. **Dealer has blackjack:** All non-BJ player hands lose immediately; insurance pays 2:1; table goes to settling
5. **Dealer no blackjack:** Insurance bets lost (swept to pool); player turns begin

### Phase 5: Player Turns

Players act in seat order. For split hands, main hand completes first, then split hand.

Available actions (when applicable):
- **Hit** (`casinoBlackjackHit`) — draw one card; auto-bust if >21
- **Stand** (`casinoBlackjackStand`) — end turn on active hand
- **Double Down** (`casinoBlackjackDouble`) — double bet, draw one card, auto-stand
- **Split** (`casinoBlackjackSplit`) — split pair into two hands; additional bet required
- **Surrender** (`casinoBlackjackSurrender`) — forfeit half bet; refund paid from pool

### Phase 6: Dealer Turn

1. Dealer hole card revealed
2. Dealer hits on soft 17 or lower, stands on hard 17+
3. Dealer draws until stand or bust

### Phase 7: Settling

1. `casinoSettleBlackjack` resolves all hands
2. **Player wins:** pays `bet × 2` (return bet + 1:1 winnings)
3. **Player blackjack:** pays `bet × 2.5` (return bet + 3:2 winnings)
4. **Push:** pays `bet` (return bet only, net 0)
5. **Player loss:** house keeps wager
6. **Surrender:** half bet already refunded during surrender phase
7. **Insurance:** pays `insuranceBet × 2` if dealer has blackjack
8. Payouts applied from World Bank pool via `payFromPool` (capped at balance)
9. Table status set to `closed`

### Phase 8: Reset

1. `casinoDiceResetTable` equivalent for blackjack (host can reset)
2. Seats stay occupied; hands cleared; bets cleared; status returns to `waiting`

---

## 4. Money Flow

```
Bet placed:      nation.money -= bet     → addToPool(bet, 'blackjack')
Double down:     nation.money -= bet     → addToPool(bet, 'blackjack_double')
Split:           nation.money -= bet     → addToPool(bet, 'blackjack_split')
Insurance:       nation.money -= bet     → addToPool(bet, 'blackjack_insurance')
Surrender:       payFromPool(bet/2)      → nation.money += bet/2 (net -bet/2)
Push:            payFromPool(bet)        → nation.money += bet (net 0)
Win (1:1):       payFromPool(bet × 2)    → nation.money += bet × 2 (net +bet)
Win (BJ 3:2):    payFromPool(bet × 2.5)  → nation.money += bet × 2.5 (net +1.5bet)
Loss:            house keeps bet         → pool += bet
Pool cap:        All payouts capped at remaining lotteryPool balance
```

All nation money updates are applied in `server/world.js` `casinoSettleBlackjack` and `casinoResolveInsurance`, not inside `settle()`.

---

## 5. Stats Tracking

Per nation: `nation.casino.games.blackjack`

| Stat | Description |
|------|-------------|
| `played` | Hands played |
| `won` | Hands won (net profit > 0) |
| `lost` | Hands lost (net profit < 0) |
| `pushed` | Hands pushed (net profit = 0) |
| `blackjacks` | Natural blackjacks |
| `spent` | Total wagered (tracked at bet/double/split time) |
| `wonAmount` | Total net profit (wins − losses) |

---

## 6. Socket Actions

| Action | Parameters | Description |
|--------|-----------|-------------|
| `casinoJoinTable` | `{tableId, seatIndex}` | Join a seat |
| `casinoLeaveTable` | `{tableId}` | Leave current seat |
| `casinoListTables` / `casinoGetTableList` | `{}` | List active tables |
| `casinoPlaceBet` | `{tableId, seatIndex, amount}` | Place bet during betting phase |
| `casinoDealInitial` | `{tableId}` | Deal initial cards |
| `casinoBlackjackHit` | `{tableId}` | Draw one card |
| `casinoBlackjackStand` | `{tableId}` | Stand on active hand |
| `casinoBlackjackDouble` | `{tableId}` | Double down |
| `casinoBlackjackSplit` | `{tableId}` | Split pair |
| `casinoBlackjackSurrender` | `{tableId}` | Surrender half bet |
| `casinoBlackjackInsurance` | `{tableId, accept}` | Accept/decline insurance |
| `casinoResolveInsurance` | `{tableId}` | Resolve insurance phase |
| `casinoGetTableState` | `{tableId}` | Get table state (with caller's card set) |
| `casinoSetCardSet` | `{cardSet}` | Update player's card theme |

`casinoGetTableState` reads caller's `settings.ui.cardSet` and resolves card image URLs per-viewer. Server sends only logical card data.

---

## 7. Odds & House Edge

| Bet | True Odds | Payout | Edge |
|-----|-----------|--------|------|
| Standard win | ~1.08:1 | 1:1 | ~0.5% (with basic strategy) |
| Blackjack | ~1.08:1 | 3:2 | ~0.5% (with basic strategy) |
| Insurance | ~2.25:1 | 2:1 | ~7.7% |

House edge assumes basic strategy play. Actual edge varies by player decisions.

---

## 8. Serialization & Persistence

- `BlackjackSystem.getState()` / `setState()` — full table state serialized via `CasinoTable.serialize()` / `deserialize()`
- Tables stored in `this.tables` Map (tableId → CasinoTable)
- `publicTableId` tracks default table
- Integrated into `CasinoSystem.getState()` / `setState()` as `blackjackSystem`
- `CasinoClass` stores `blackjackTables` map and `games.blackjack` stats per nation

---

## 9. Security

- **Server-authoritative RNG:** `crypto.randomInt()` for shuffling and card draw — no `Math.random()`
- **Dealer hole card never sent to clients:** Only up card visible until reveal
- **Remaining shoe never sent to clients:** Only `shoeCardsRemaining` count exposed
- **Bet validation:** limits checked server-side; duplicate bets rejected
- **No mid-hand seat changes:** Cannot leave while betting or playing
- **Pool caps:** Payouts capped at remaining `lotteryPool` balance

---

## 10. Card Asset Rendering (Client-Side)

Card sets are defined in `entities/CasinoCardSet.js`. Each set maps suit+rank to image paths.

| Card Set | Folder | Back Image |
|----------|--------|------------|
| Artistic | `assets/images/Cards/Artistic/` | None (CSS fallback) |
| Classic | `assets/images/Cards/Classic/` | `Red-Cardback.png` |
| Dark | `assets/images/Cards/Dark/` | `BACK.png` |
| Light | `assets/images/Cards/Light/` | `BACK.png` |
| Off-White | `assets/images/Cards/Off-White/` | `back-black.png` |
| White & Red tinted | `assets/images/Cards/White & Red tinted/` | `back_red_basic.png` |

Client resolves card URLs via `resolveCardPath(cardSet, suit, rank, variant)`. Settings UI shows 4 alternating card pair previews via `getCardSetPreviews(cardSet)`.

---

## 11. Future Expansions

- Side bets (Perfect Pairs, 21+3, Lucky Ladies)
- Surrender restrictions (early vs late)
- Double after split restrictions
- Dealer stands on soft 17 option
- Multi-table tournament mode
- Card counting detection / shuffle tracking protection
- Side pot / insurance-only tables
