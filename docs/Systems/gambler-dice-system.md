# Gambler Dice System — Documentation

**File:** `systems/Casino/dice/gambler-dice-system.js`  
**Entities:** `entities/CasinoDiceTable.js`, `entities/CasinoDiceSeat.js`, `entities/CasinoDiceBet.js`  
**Integration:** `systems/Casino/casino-system.js` (as `gamblerDiceSystem` subsystem), `server/world.js` (socket actions)

---

## 1. Overview

Gambler Dice is a **live, multiplayer craps-style polyhedral dice table**. Multiple players (1–6 seats) join a table, place bets on a shared dice roll, and the house resolves all bets against the World Bank lottery pool. The system supports:

- **Player-vs-player backing** — players can back each other's bets with a 5% house rake on winnings
- **Multi-roll craps** — pass/don't-pass establish a point on the come-out roll and resolve on point hit or 7-out
- **Progressive jackpot** — 10% of hard-way and jackpot wagers feed a jackpot pool; 50% paid out on 5-of-a-kind jackpot hits
- **Per-player dice themes** — each player sees dice rendered with their own color/style settings
- **World Bank pool integration** — all wagers add to the pool; all payouts are paid from the pool (capped at balance)

---

## 2. Architecture

### 2.1. Table Entity (`CasinoDiceTable`)

A stateful 6-seat table that persists across multiple rolls.

| Field | Type | Description |
|-------|------|-------------|
| `tableId` | string | Unique ID (`gd_<uuid>`) |
| `status` | string | `waiting`, `betting`, `rolling`, `settling`, `closed` |
| `dieSize` | string | `d4`, `d6`, `d8`, `d12`, `d20` (set at creation, fixed for table life) |
| `diceCount` | number | 1–5 dice per roll |
| `shooterSeatIndex` | number | Index of current shooter (-1 if none) |
| `point` | number \| null | Established point for pass/dont_pass |
| `pointEstablished` | boolean | Whether a point is active |
| `seats` | CasinoDiceSeat[] | 6 seats |
| `jackpotPool` | number | Progressive jackpot accumulation |
| `jackpotContributionPct` | number | % swept to jackpot (default 0.10) |
| `minBet`, `maxBet`, `maxPayout` | number | Bet limits and payout cap |
| `rakePct` | number | House rake on P2P winnings (default 0.05) |
| `hostPlayerId` | string | Table creator |
| `autoRoll` | boolean | House auto-rolls after betting (not yet implemented) |

### 2.2. Seat Entity (`CasinoDiceSeat`)

| Field | Type | Description |
|-------|------|-------------|
| `seatIndex` | number | 0–5 |
| `nationId` | string \| null | Occupying nation |
| `userId` | string \| null | Web user/session |
| `status` | string | `empty`, `waiting`, `betting`, `rolled`, `sitting_out` |
| `bets` | CasinoDiceBet[] | Bets placed this round |
| `isShooter` | boolean | Whether this seat is the shooter |
| `totalWagered`, `totalWon` | number | Per-round totals |

### 2.3. Bet Entity (`CasinoDiceBet`)

| Field | Type | Description |
|-------|------|-------------|
| `betId` | string | Unique ID |
| `seatIndex` | number | Placing seat |
| `nationId` | string | Owning nation |
| `betType` | string | See bet catalog below |
| `target` | number \| array | Face, range `[lo,hi]`, sum target, or point |
| `amount` | number | Wager |
| `backedBy` | number \| null | Seat index backing this bet (P2P) |
| `backerNationId` | string \| null | Backer's nation |
| `payoutMultiplier` | number | House payout multiplier |
| `trueOdds`, `houseEdge` | number | Precomputed odds |
| `won` | boolean \| null \| `'push'` | Pending / win / loss / push |
| `payout` | number | Amount paid on win |
| `isJackpotBet` | boolean | Contributes to jackpot pool |

---

## 3. Die Sizes & Bet Catalog

### 3.1. Die Size Registry

| Die Size | Faces | Default Count | Max Count | Valid Bets |
|----------|-------|---------------|-----------|------------|
| D4 | 4 | 1 | 5 | exact, high, low, odd, even, range, jackpot |
| D6 | 6 | 1 | 5 | All bets below |
| D8 | 8 | 1 | 5 | All bets below |
| D12 | 12 | 1 | 5 | All bets below |
| D20 | 20 | 1 | 5 | All bets below |

### 3.2. Bet Types

| Bet | Description | Dice | Dice Count | Payout | Edge |
|-----|-------------|------|------------|--------|------|
| `pass` | Wins on natural (7/11), loses on craps (2/3/12); else point | 2+ | 2+ | 1:1 | ~1.4% |
| `dont_pass` | Opposite of pass; 12 pushes | 2+ | 2+ | 1:1 | ~1.4% |
| `exact` | One specific face | 1 | 1–5 | 2:1–17:1 | 5–25% |
| `high` | Upper half of faces | 1 | 1–5 | 0.95:1 | 2.5% |
| `low` | Lower half of faces | 1 | 1–5 | 0.95:1 | 2.5% |
| `odd` | Odd faces | 1 | 1–5 | 0.95:1 | 2.5% |
| `even` | Even faces | 1 | 1–5 | 0.95:1 | 2.5% |
| `range` | Contiguous span `[lo,hi]` | 1 | 1–5 | 0.95:1 | 3–8% |
| `field` | Wins on 2,3,4,9,10,11,12 | 2+ | 2+ | 1:1 / 2:1 | ~5.6% |
| `any_craps` | Wins on 2, 3, or 12 | 2+ | 2+ | 7:1 | ~11.1% |
| `hardway` | All dice show same specific face | 2–5 | 2–5 | 14:1–350:1 | 10–15% |
| `match_any` | All dice show same face (any number) | 2–5 | 2–5 | 3:1–19:1 | 5–12% |
| `sum_exact` | Sum equals target | 2–5 | 2–5 | 8:1–25:1 | 5–15% |
| `sum_range` | Sum within `[lo,hi]` | 2–5 | 2–5 | 0.95:1 | 3–8% |
| `jackpot` | 5 dice all same face | 5 | 5 | Jackpot pool % | ~15–20% |

> **D4 restriction:** No `pass`, `dont_pass`, `field`, `any_craps` (need 2+ dice). No `hardway`, `match_any`, `sum_exact`, `sum_range` (multi-dice excluded).

---

## 4. Game Flow

### Phase 1: Table Creation & Joining

1. Host calls `casinoDiceCreateTable` with `dieSize`, `diceCount`, `minBet`, `maxBet`, `autoRoll`
2. Host is auto-joined at seat 0 and designated shooter
3. Other players join via `casinoDiceJoinTable` at open seats

### Phase 2: Betting

1. Table status transitions to `betting`
2. Players place bets via `casinoDicePlaceBet` (house-banked) or `casinoDiceBackBet` (P2P backing)
3. Wagers are deducted from `nation.money` immediately and added to World Bank pool via `addToPool`
4. Hard-way and jackpot bets sweep 10% to `table.jackpotPool`
5. Pass/don't-pass cannot be placed once a point is established
6. Table moves to `rolling` when all occupied seats have bet, or when manually triggered

### Phase 3: Rolling

1. Shooter (or house) calls `casinoDiceRoll`
2. Server generates `diceCount` random faces via `crypto.randomInt()` (server-authoritative)
3. Craps phase state is updated:
   - **Come-out roll:** 7/11 = natural (pass wins), 2/3/12 = craps (pass loses, don't-pass pushes on 12), otherwise point = sum
   - **Point roll:** sum == point (pass wins), sum == 7 (don't-pass wins), otherwise continue

### Phase 4: Settling

1. All resolvable bets (`won !== null`) are evaluated
2. House-banked wins: `bet.amount × (1 + payoutMultiplier)` paid from World Bank pool
3. Pushes: bet returned only
4. Losses: house keeps wager (already in pool)
5. P2P backing wins: `back.amount × (1 + multiplier)` minus 5% rake; rake swept to pool
6. Jackpot wins: 50% of `table.jackpotPool` paid from jackpot pool; pool reduced to max(paid_out, 10% reserve)
7. Table status: `closed` (all resolved) or `rolling` (pending pass/don't-pass continue)

### Phase 5: Reset

1. Host calls `casinoDiceResetTable` (or table auto-resets)
2. Seats stay occupied; bets cleared; status returns to `waiting`
3. Cannot reset if any bets are still pending

---

## 5. Money Flow

```
Bet placed:      nation.money -= bet     → addToPool(bet, 'gamblerDice')
Hard-way/jackpot: 10% of bet            → addToPool(contrib, 'gamblerDice_jackpot'); table.jackpotPool += contrib
P2P back bet:    backer.money -= bet     → addToPool(bet, 'gamblerDice_p2p')
Win (house):     payFromPool(bet × (1+mult)) → nation.money += payout
Push:            payFromPool(bet)        → nation.money += bet (return)
P2P win:         payFromPool(gross − rake) → backer.money += payout
House rake:      5% of P2P gross         → addToPool(rake, 'gamblerDice_rake')
Jackpot win:     table.jackpotPool × 50% → winner.money += payout (from jackpotPool)
Pool cap:        All payouts capped at remaining lotteryPool balance
```

All nation money updates are applied in `server/world.js` `casinoDiceRoll`, not inside `settle()`.

---

## 6. Stats Tracking

Per nation: `nation.casino.games.gamblerDice`

| Stat | Description |
|------|-------------|
| `played` | Rounds participated |
| `won` | Rounds with net profit > 0 |
| `lost` | Rounds with net profit < 0 |
| `pushed` | Rounds with net profit = 0 (and at least one push) |
| `jackpotsWon` | Jackpot bets won |
| `spent` | Total wagered (tracked at bet time) |
| `wonAmount` | Total net profit (wins − losses) |

---

## 7. Socket Actions

| Action | Parameters | Description |
|--------|-----------|-------------|
| `casinoDiceCreateTable` | `{dieSize, diceCount, minBet, maxBet, autoRoll}` | Create table (host) |
| `casinoDiceJoinTable` | `{tableId, seatIndex}` | Join seat |
| `casinoDiceLeaveTable` | `{tableId}` | Leave seat |
| `casinoDiceListTables` | `{}` | List active tables |
| `casinoDicePlaceBet` | `{tableId, seatIndex, betType, target, amount}` | Place house bet |
| `casinoDiceBackBet` | `{tableId, seatIndex, betId, amount}` | P2P back another player's bet |
| `casinoDiceRoll` | `{tableId}` | Roll dice |
| `casinoDiceGetTableState` | `{tableId}` | Get table state (with caller's dice theme) |
| `casinoDiceGetBetMenu` | `{dieSize, diceCount}` | Get valid bets + odds |
| `casinoDiceSetShooter` | `{tableId, seatIndex}` | Designate shooter (host only) |
| `casinoDiceResetTable` | `{tableId}` | Reset for next round (host only) |
| `casinoSetDiceSettings` | `{diceSet, diceColor, diceStyle}` | Update player's dice theme |

`casinoDiceGetTableState` reads caller's `settings.ui.diceSet/Color/Style` and resolves dice image URLs per-viewer. Server sends only logical face values.

---

## 8. Odds & House Edge

House edge = `(trueOdds − payoutMultiplier) / (trueOdds + 1)` where `trueOdds = (1 − p) / p`.

| Bet | True Odds | Payout | Edge |
|-----|-----------|--------|------|
| Pass | ~1.41:1 | 1:1 | ~1.4% |
| Don't Pass | ~1.36:1 | 1:1 | ~1.4% |
| Exact (D6) | 5:1 | 4:1 | 16.7% |
| Exact (D20) | 19:1 | 17:1 | 10.0% |
| High/Low/Odd/Even | 1:1 | 0.95:1 | 2.5% |
| Hard-way (D20, K=2) | 399:1 | 350:1 | ~12.25% |
| Jackpot (D20) | 159,999:1 | Pool % | ~15–20% |

Payout table is defined in `PAYOUT_TABLE` constant; odds computed by `computeBetOdds()`.

---

## 9. Serialization & Persistence

- `GamblerDiceSystem.getState()` / `setState()` — full table state serialized via `CasinoDiceTable.serialize()` / `deserialize()`
- Tables stored in `this.tables` Map (tableId → CasinoDiceTable)
- `publicTableId` tracks default table
- Integrated into `CasinoSystem.getState()` / `setState()` as `gamblerDiceSystem`
- `CasinoClass` stores `gamblerDiceTables` map and `games.gamblerDice` stats per nation

---

## 10. Security

- **Server-authoritative RNG:** `crypto.randomInt()` — no `Math.random()`, no client-side prediction
- **Dice faces never sent before roll:** Client receives logical values only; art resolved client-side per theme
- **Bet validation:** limits checked server-side; target required for exact/range/hardway/sum bets
- **Pool caps:** `maxPayout` per bet; payouts capped at remaining `lotteryPool` balance
- **No mid-round seat changes:** Cannot leave while betting or rolled
- **No reset with pending bets:** `resetForNextRound` returns false if any `won === null`

---

## 11. Dice Asset Rendering (Client-Side)

Each die size folder: `assets/images/Dice/D4/`, `D6/`, `D8/`, `D12/`, `D20/`

Color theme mapping:
| Theme | Disk Folder |
|-------|-------------|
| `red` | `red` |
| `blue` | `blue` |
| `green` | `green` |
| `gold` | `yellow` |
| `silver` | `white` |
| `obsidian` | `black` |

D6 style: `numbers` (root files) or `dots` (`dots/` subfolder)

```js
function getDiceImageUrl(dieSize, face, {diceSet, diceColor, diceStyle}) {
  const colorMap = { red:'red', blue:'blue', green:'green', gold:'yellow', silver:'white', obsidian:'black' };
  const color = colorMap[diceColor] || 'red';
  const sub = (dieSize === 'd6' && diceStyle === 'dots') ? 'dots/' : '';
  return `assets/images/Dice/${dieSize}/${color}/${sub}${face}.png`;
}
```

---

## 12. Future Expansions

- Multiple dice size tables (D4/D6/D8/D12/D20 difficulty tiers)
- Tournament mode with buy-in and prize pool
- Additional proposition bets (any seven, horn bet, craps-eleven)
- Player-banked tables (player acts as house)
- Dice color unlockables via shop/achievements
