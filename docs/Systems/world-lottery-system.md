# World Lottery System

Powerball-style weekly drawing funded by the World Bank (interest + territory tax revenue) and nation ticket sales. Nations purchase tickets with pet icons, a random drawing occurs once per real-life week, and winners claim prizes manually within a 14-day window.

## Overview

| Item | Value |
|------|-------|
| **System class:** | `WorldLotterySystem` |
| **Global instance:** | `window.WorldLottery` |
| **Ticket cost:** | $100,000 per ticket |
| **Max tickets per nation per drawing:** | 25 |
| **Max ticket spend per nation per drawing:** | $2,500,000 |
| **Pet icons available:** | 103 unique pets |
| **Pets per ticket:** | 6 (5 numbers + 1 multiplier) |
| **Drawing frequency:** | 1 per real-life week (Sunday–Saturday UTC) |
| **Prize claim window:** | 14 days from draw time |
| **Primary config:** | `systems/World/world-lottery-system.js` |
| **Loaded in:** | `index.html` (after `core/event-system.js`) |

The World Lottery System is funded entirely by World Bank revenue (loan interest, bill interest, tax interest, territory tax) plus nation ticket sales. It runs on UTC so all players experience the same drawing schedule regardless of timezone.

> **Important:** `window.WorldLottery` is `undefined` until `systems/World/world-lottery-system.js` is loaded in the browser.

---

## Funding

The lottery pool grows from four sources:

| Source | World Bank Method | When Called |
|--------|------------------|-------------|
| **Loan interest** | `contributeFromBank(amount, 'loan_interest')` | `processLoanRepayments()` each day |
| **Bill interest** | `contributeFromBank(amount, 'bill_interest')` | `Nation.payBills()` each day |
| **Tax interest** | `contributeFromBank(amount, 'tax_interest')` | `Nation.collectTaxes()` each day |
| **Territory tax** | `contributeFromBank(amount, 'territory_tax')` | `recordTerritoryPurchase()` on land purchase |
| **Ticket sales** | Added directly to `lotteryPool` | `purchaseTickets()` |

Ticket purchases are deducted from the nation's primary currency balance and added directly to the pool. World Bank contributions flow from interest and tax collections into the pool before any drawing occurs.

---

## Pet Icons (103 Unique Pets)

Each ticket uses pet icons from `assets/images/Pets/`. There are exactly 103 unique pet icons (deduplicated). Available pets:

```
Axolotl, Anteater, Ant, Alligator, Badger, Bat, Beaver, Bee, Beetle, Bison,
BlueTang, Camel, Cardinal, Cat, Centipede, Cheetah, Chicken, Clownfish, Cow, Crab,
Crow, Deer, Dog, Dolphin, Duck, Eagle, Elephant, Emu, Firefly, Fox,
Frog, Giraffe, Goat, Goose, Gorilla, Grizzly, Hamster, Hedgehog, Hippo, Horse,
Hummingbird, Iguana, Jellyfish, Jaguar, Kangaroo, Kiwi, Koala, Lemur, Ladybug, Mantis,
Monkey, Mouse, Octopus, Orangutan, Orca, Ostrich, Otter, Owl, Panda, Parrot,
Peacock, Pelican, Penguin, Pig, Pigeon, Platypus, PolarBear, Pufferfish, Rabbit, Raccoon,
Ram, Rat, RedPanda, Reindeer, Rhino, Salmon, Scorpion, Seahorse, Seal, Shark,
Sheep, Shrimp, Skunk, Sloth, Snail, Snake, Spider, Squirrel, Starfish, Stingray,
SugarGlider, Tiger, Toucan, Turkey, Turtle, Walrus, Whale, Wolf, Yak, Zebra
```

Use `getPetIcons()` to retrieve the full list for UI display.

### National Pet (Cosmetic)

Each nation can select one pet as its "national pet" via `setNationPet(nationId, petIcon)`. This is **cosmetic only** — no gameplay effect, no boosts, no rate changes. It is stored on both `window.WorldLottery.nationPets` and `window.Nation.nationalPet`. Retrieved via `getNationPet(nationId)`.

---

## Drawing Schedule (UTC-Based)

### Weekly Cycle

- **1 drawing per real-life week** (Sunday 00:00 UTC to Saturday 23:59:59 UTC)
- Drawing day and hour are **randomly selected** within that week
- Players do **not** know when the drawing will occur — they must buy tickets quickly after the last drawing
- All players share the same UTC schedule regardless of local timezone

### Restricted Drawing Windows

The drawing **cannot** occur in these time slots:

| Day | UTC Hours | Reason |
|-----|-----------|--------|
| Saturday | 22:00–23:59 | 2 turns before day-end |
| Sunday | 00:00–01:59 | 2 turns after day-change |

This prevents drawings from landing exactly on the UTC day boundary where day-change processing is happening.

### Schedule Logic

Each day pass (`_onDayPassed`):
1. Check if a new drawing should be scheduled (new week + no active drawing)
2. If yes, pick a random valid day/hour within the upcoming week
3. If current time >= scheduled draw time, run `runDrawing()`

If the randomly selected time is already in the past (system started mid-week), the drawing is pushed to the next week.

---

## Ticket Purchase

### `purchaseTickets(nation, count = 1, ticketPicks = null)`

Supports two modes:

| Mode | Description |
|------|-------------|
| **Quick Pick** (default) | Pass only `count` (1–25). System generates random tickets automatically. |
| **Custom Picks** | Pass `ticketPicks` array of `{ numbers: [5 pets], multiplier: 'pet' }`. User hand-picks every pet. |

### Custom Pick Validation (`validateTicketPicks`)

Each custom pick must satisfy:
- Exactly 5 regular pet numbers (array of 5 strings)
- Exactly 1 multiplier pet (string)
- All 6 pets must be **unique** (no duplicates across numbers + multiplier)
- All pets must be from the 103 valid pet icons

If any pick is invalid, the entire purchase is refunded and rejected with a reason.

### Ticket Object

```json
{
  "id": 12345,
  "nationId": "nation-abc",
  "nationName": "My Nation",
  "numbers": ["Cat", "Dog", "Eagle", "Fox", "Wolf"],
  "multiplier": "Bear",
  "purchasedAt": 1733000000000,
  "cost": 100000,
  "customPick": true
}
```

Every ticket has a unique, incrementing `id` that users can see and reference when claiming prizes.

### Limits

- 1–25 tickets per nation per drawing
- Tickets carry over only within the current drawing week
- Cost deducted from `currencyBalances[primaryKey]` or legacy `nation.money`
- Ticket spending recorded in `EconomySystem.recordCurrencySpending()` for currency rate dynamics

---

## Prize Tiers

Each ticket has 5 regular pet numbers + 1 multiplier pet (6 total). The drawing picks the same: 5 winning numbers + 1 winning multiplier.

### Tier Hierarchy

```
3 < 4 < 3+M < 5 < 4+M < Jackpot
```

The **multiplier matters at every level**:
- **4 + Multiplier pays more than 5 without multiplier**
- **3 + Multiplier pays more than 4 without multiplier**

### Prize Table ($500B pool example)

| Tier | Matches | Multiplier | Odds (approx.) | Pct of Pool | $500B Payout |
|------|---------|-----------|---------------|-------------|--------------|
| **Jackpot** | 5 | Yes | ~1 in 9.46B | 100% | $500B (full pool) |
| **4 + M** | 4 | Yes | ~1 in 19.3M | 4% | $20B |
| **5** | 5 | No | ~1 in 97.6M | 2% | $10B |
| **3 + M** | 3 | Yes | ~1 in 199K | 0.015% | $75M |
| **4** | 4 | No | ~1 in 199K | 0.01% | $50M |
| **3** | 3 | No | ~1 in 2K | 0.005% | $25M |

### Prize Distribution Rules

**Jackpot hit:**
- Jackpot winner(s) split the **full pool** equally
- No secondary prizes are paid that drawing
- Pool restarts at 0.01% of total payout

**No jackpot:**
- Secondary winners in each tier split that tier's percentage of the pool
- Multiple winners in the same tier split equally
- Pool reduced by total payout

---

## Drawing Execution

### `runDrawing()`

1. Generates 6 unique winning pet icons (5 numbers + 1 multiplier)
2. Checks all tickets from the current drawing week
3. For each ticket, counts matching regular numbers and checks multiplier match
4. Determines prize tier and amount
5. If jackpot won: jackpot winner(s) split full pool; secondary prizes skipped
6. If no jackpot: secondary winners split tier percentages of pool
7. Records all ticket results (winners and losers) for post-draw checking
8. Records unclaimed winnings (manual claim required)
9. Updates lottery pool (subtracts total payout)
10. If jackpot won: pool restarts at 0.01% of payout; rate impact +2.0 (skyrockets)
11. If secondary payouts: rate impact increases moderately
12. Stores drawing in history (keeps last 52 / ~1 year)
13. Keeps resolved tickets for 2 weeks, then cleans up
14. Marks drawing closed, clears current tickets
15. Emits `lottery_drawing_complete` event

### `_checkTicket(ticket, winningNumbers, winningMultiplier)`

Counts matches among the 5 regular numbers and checks if the ticket's multiplier matches the winning multiplier. Returns `{ matches, hasMultiplierMatch, tier, prize }`.

---

## Prize Claiming (Manual — Not Automatic)

Prizes are **NOT auto-distributed**. After a drawing, winners must actively claim.

### `claimPrize(ticketId, nationId)`

1. Validates ticketId and nationId provided
2. Looks up unclaimed winnings by ticketId
3. Verifies the ticket belongs to the claiming nation
4. Checks the 14-day claim window has not expired
5. Pays the prize to the nation's primary currency balance
6. Marks the winnings as claimed
7. Emits `lottery_prize_claimed` event

### Claim Rules

| Rule | Detail |
|------|--------|
| **Claim window** | 14 days from draw time |
| **Ownership** | Only the ticket's nationId can claim |
| **One-time** | Once claimed, cannot be claimed again |
| **Expiry** | After 14 days, prize expires and cannot be claimed |
| **Prize amount** | Locked at draw-time pool percentage — does NOT change based on current pool at claim time |

### Query Methods

| Method | Description |
|--------|-------------|
| `getUnclaimedWinnings(nationId)` | Returns claimable prizes (not claimed, not expired) |
| `getExpiredWinnings(nationId)` | Returns expired prizes (past 14 days, unclaimed) |
| `getTicketResult(ticketId)` | Returns a specific ticket's result after drawing |
| `getNationResolvedTickets(nationId)` | Returns all past ticket results for a nation (newest first) |
| `hasWonLastDrawing(nationId)` | Quick boolean: did this nation win anything last drawing? |

Expired unclaimed winnings are cleaned up from memory each day pass.

---

## World Bank Integration

### Rate Impact on World Bank

World Lottery payouts affect World Bank interest rates:

| Payout Type | Rate Impact |
|-------------|-------------|
| **Jackpot won** | `rateImpactMultiplier + 2.0` (skyrockets rates) |
| **Secondary payouts** | `+ (payoutRatio × 0.5)` (moderate increase) |
| **Daily decay** | `- 0.1` per day toward 1.0 |

Capped between 0.5 and 3.0.

World Bank applies this multiplier:
- **Loan rates:** × rateImpactMultiplier
- **Bill rates:** × rateImpactMultiplier
- **Tax rates:** ÷ rateImpactMultiplier (inverse — bank payouts lower tax rates)

---

## Day Passed Cycle

### `_onDayPassed()` (fires on every `day_passed` event)

Runs this sequence each game day:

1. **Decay rate impact** — reduces `rateImpactMultiplier` by 0.1 toward 1.0
2. **Clean up expired unclaimed winnings** — deletes claimed or expired entries (past 14 days)
3. **Schedule new drawing** — if new week started and no active drawing, pick random day/hour
4. **Run drawing** — if current time >= scheduled draw time, execute `runDrawing()`

---

## State Management

### `getState()` / `setState(state)`

Persists across save/load:

| State | Description |
|-------|-------------|
| `lotteryPool` | Current jackpot balance |
| `totalTicketSales` | Lifetime ticket sales |
| `totalBankContributions` | Lifetime bank contributions |
| `nextTicketId` | Next auto-increment ticket ID |
| `currentDrawing` | Active drawing object |
| `lastDrawingResult` | Most recent drawing result |
| `rateImpactMultiplier` | Current World Bank rate impact |
| `nationPets` | Per-nation cosmetic pet selections |
| `unclaimedWinnings` | Array of [ticketId, winnings] entries (preserves numeric keys) |
| `drawingsHistory` | Past drawing results (max 52) |

`unclaimedWinnings` is saved as an array of entries (not `Object.fromEntries`) to preserve numeric ticketId keys as Map keys rather than strings.

---

## Events

| Event | Payload | When |
|-------|---------|------|
| `lottery_ticket_purchased` | `{ nationId, nationName, ticketCount, totalCost, customPicks }` | After successful ticket purchase |
| `lottery_drawing_complete` | `{ drawTime, winningNumbers, multiplier, allWinning, poolBefore, totalPayout, winners }` | After a drawing resolves |
| `lottery_prize_claimed` | `{ ticketId, nationId, nationName, tier, prize, drawTime }` | After a prize is claimed |

---

## Key Methods Summary

| Method | Description |
|--------|-------------|
| `initialize()` | Init system, bind to `day_passed`, seed pool from GlobalWorld |
| `getPetIcons()` | Returns all 103 pet icon names |
| `getNationPet(nationId)` | Get nation's cosmetic pet |
| `setNationPet(nationId, petIcon)` | Set nation's cosmetic pet (validated) |
| `validateTicketPicks(picks)` | Validate custom ticket picks before purchase |
| `purchaseTickets(nation, count, ticketPicks)` | Buy tickets (quick-pick or custom picks) |
| `getNationTickets(nationId)` | Get a nation's tickets for current drawing |
| `getTotalTicketsSold()` | Get ticket count for current drawing |
| `getTicketResult(ticketId)` | Get a specific ticket's post-draw result |
| `getNationResolvedTickets(nationId)` | Get all past ticket results for a nation |
| `hasWonLastDrawing(nationId)` | Check if nation won anything last drawing |
| `runDrawing()` | Execute the weekly drawing |
| `claimPrize(ticketId, nationId)` | Manually claim a prize (14-day window) |
| `getUnclaimedWinnings(nationId)` | Get claimable prizes |
| `getExpiredWinnings(nationId)` | Get expired prizes |
| `contributeFromBank(amount, source)` | Add World Bank money to lottery pool |
| `getRateImpactMultiplier()` | Get current World Bank rate impact (0.5–3.0) |
| `decayRateImpact()` | Decay rate impact toward 1.0 |
| `getLotteryState()` | Full UI state (pool, tickets sold, current drawing, previous 8 draws, rate impact) |
| `getPreviousDrawings()` | Up to last 8 drawings with winners and amounts |
| `getPrizeTiers()` | Prize tier configuration |
| `getState()` / `setState()` | Save/load lottery state |
| `destroy()` | Unbind `day_passed` event |

---

## Browser Wiring (`index.html`)

```html
<script defer src="core/event-system.js"></script>
<script defer src="systems/World/world-lottery-system.js"></script>
```

`event-system.js` must load first (provides `EventBus`). `world-lottery-system.js` binds `day_passed` in its constructor.

`window.WorldLottery` is set to the singleton instance. `game-engine.js` also creates a `WorldLotterySystem()` instance and assigns it to `window.WorldLottery` — World Bank reads it dynamically via `_getLottery()` on each call, so it always references the live instance.
