# Sovereign Keno System — National Pet Keno

Instant-win lottery game where players pick pet icons from a pool of 103 unique pets. The house draws 20 pets; exactly 2 are designated as Multiplier Draws. Match count determines payout; matching the Multiplier Pet boosts the prize tier. Jackpot (match all 10) pays a percentage of the World Bank lottery pool.

## Overview

| Item | Value |
|------|-------|
| **System class:** | `KenoSystem` |
| **Global instance:** | `window.KenoSystem` |
| **Primary config:** | `systems/Casino/keno-system.js` |
| **Loaded in:** | `index.html` (after `core/event-system.js`) |
| **Pet pool:** | 103 unique pet icons |
| **Player picks:** | Up to 10 pets per ticket |
| **House draws:** | 20 pets per drawing |
| **Multiplier Draws:** | Exactly 2 of the 20 drawn pets |
| **Ticket cost:** | $100,000 per ticket |
| **Max tickets per nation:** | 25 per drawing |
| **Claim window:** | 14 days from draw time |
| **Randomness:** | `crypto.randomInt()` — cryptographically secure, no `Math.random()` |

## How It Works

### Ticket Purchase

Players select 1-10 pet icons from the 103-pet pool. The **10th pet picked becomes the Multiplier Pet** (only active when exactly 10 are selected). Each ticket costs $100,000, which is deducted from the nation's money and added to the World Bank lottery pool.

**Socket action:** `casinoBuyKeno` with `{ petIds: [petId1, ..., petIdN] }` where petIds is an array of 1-10 pet names.

### Daily Drawing

Each day, a new drawing is generated:
1. 20 unique pets are randomly drawn from the 103-pet pool using cryptographically secure randomness
2. Exactly 2 of those 20 are designated as **Multiplier Draws**
3. All tickets from the previous drawing are cleared and replaced with new empty buckets

**Socket action:** `casinoDrawKeno` (no parameters)

### Win Determination

After the draw, each ticket is evaluated:
- **Matches:** Count how many of the player's picked pets appear in the 20 drawn pets
- **Multiplier Hit:** If the ticket has a Multiplier Pet (10 picks only) AND that pet is one of the 2 Multiplier Draws, the prize tier is boosted
- **Prize:** Determined by match count and multiplier status (see Payout Table below)

**Socket action:** `casinoClaimKenoWin` with `{ ticketId }` to claim a won prize

---

## Payout Table

| Matches | 1-9 Picks (Base) | 10 Picks (Base) | 10 Picks + Multiplier Hit |
|---------|-----------------|-----------------|---------------------------|
| 0 | Lose | Lose | **0.5×** consolation |
| 1 | Lose | Lose | **1.0×** push (break-even) |
| 2 | **0.5×** | **1×** | **2×** |
| 3 | **2×** | **3×** | **6×** |
| 4 | **10×** | **15×** | **30×** |
| 5 | **50×** | **75×** | **150×** |
| 6 | **200×** | **300×** | **600×** |
| 7 | **1,000×** | **1,500×** | **3,000×** |
| 8 | **5,000×** | **7,500×** | **15,000×** |
| 9 | **25,000×** | **50,000×** | **100,000×** |
| 10 | Lose | **Jackpot: 25% of Pool** | **Jackpot: 50% of Pool** |

**Jackpot:** Matching all 10 picked pets wins a percentage of the World Bank lottery pool:
- **25% of pool** without Multiplier Hit
- **50% of pool** with Multiplier Hit

**Example:** Winning tier 9 (25,000×) on a $100,000 ticket pays $2,500,000.

---

## Code Structure

### KenoSystem Class

Located in `systems/Casino/keno-system.js`

#### Constructor Properties

| Property | Type | Description |
|----------|------|-------------|
| `petIcons` | Array[String] | 103 unique pet names used in the wheel |
| `ticketCost` | Number | $100,000 per ticket |
| `maxTicketsPerNation` | Number | 25 tickets max per drawing per nation |
| `pickCount` | Number | 10 pets max per ticket |
| `drawCount` | Number | 20 pets drawn per drawing |
| `multiplierDrawCount` | Number | 2 of the 20 drawn pets are Multiplier Draws |
| `claimWindowMs` | Number | 14 days (14 × 24 × 60 × 60 × 1000 ms) |
| `payoutTable` | Object | Prize multipliers by match count (0-10) |
| `tickets` | Map | Active tickets for current drawing (ticketId → ticket) |
| `nationTickets` | Map | nationId → array of ticketIds |
| `nextTicketId` | Number | Auto-incrementing ticket ID counter |
| `currentDrawing` | Object | Current drawing state { drawPets, multiplierDraws, status, drawTime } |
| `resolvedTickets` | Map | ticketId → match result (post-draw, for lookup) |
| `unclaimedWinnings` | Map | ticketId → prize info (for claiming later) |

#### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `initialize()` | none | void | Initializes the system (sets `isInitialized = true`) |
| `getPetIcons()` | none | Array[String] | Returns copy of all 103 pet names |
| `startDrawing()` | none | Object | Generates 20 random pets, designates 2 as Multiplier Draws, clears previous tickets |
| `getCurrentDrawing()` | none | Object | Returns current drawing, auto-starts if none open |
| `purchaseTickets(nation, count, ticketPicks)` | nation, number, Array | Object | Purchase 1-25 tickets; deducts wager; creates ticket objects |
| `validateTicketPicks(picks)` | Array | Object | Validates ticket picks (1-10 unique pets, all valid) |
| `_createCustomTicket(nationId, nationName, pick)` | nationId, name, pick | Object | Creates ticket from user-selected pets |
| `_generateTicket(nationId, nationName)` | nationId, name | Object | Generates random ticket with 1-10 pets |
| `getNationTickets(nationId)` | nationId | Array | Returns all tickets for a nation in current drawing |
| `runDrawing(casinoSystem)` | casinoSystem | Object | Runs the drawing, determines matches, calculates prizes, pays from pool |
| `_checkTicket(ticket, drawPets, multiplierDraws)` | ticket, Array, Array | Object | Counts matches, checks multiplier hit, determines tier/prize |
| `_recordUnclaimedWinnings(drawResult)` | drawResult | void | Records unclaimed winnings with 14-day expiry |
| `claimPrize(ticketId, nationId, nation)` | ticketId, nationId, nation | Object | Claims prize money from World Bank pool |
| `getUnclaimedWinnings(nationId)` | nationId | Array | Returns unclaimed prizes for a nation |
| `getNationResolvedTickets(nationId)` | nationId | Array | Returns past draw results for a nation |
| `getState()` | none | Object | Serializes full system state |
| `setState(state)` | Object | void | Restores system state from serialized data |

---

## Ticket Object Structure

```json
{
  "id": "keno_1733000000000_48291",
  "nationId": "nation_123",
  "nationName": "Empire of Test",
  "pets": ["Axolotl", "Cat", "Dog", "Eagle", "Fox"],
  "multiplierPet": "Fox",
  "isMultiplierTicket": false,
  "purchasedAt": 1733000000000,
  "cost": 100000,
  "customPick": true
}
```

**Fields:**
- `id` — Unique ticket identifier
- `nationId` — Owning nation's ID
- `nationName` — Human-readable nation name
- `pets` — Array of pet names (1-10)
- `multiplierPet` — The 10th pet (Multiplier Pet), or null if fewer than 10 picked
- `isMultiplierTicket` — True if exactly 10 pets were picked
- `purchasedAt` — Timestamp of purchase
- `cost` — Ticket cost ($100,000)
- `customPick` — True if user-selected, false if auto-generated

---

## DrawResult Object

Returned by `runDrawing()`:

```json
{
  "drawTime": "2026-11-09T06:34:56.123Z",
  "drawPets": ["Axolotl", "Cat", ..., "Zebra"],
  "multiplierDraws": ["Fox", "Tiger"],
  "poolBefore": 5000000,
  "winners": [ ... ],
  "totalPayout": 125000
}
```

Each winner object includes: `ticketId`, `nationId`, `nationName`, `matches`, `hasMultiplierHit`, `tier`, `prize`, `pets`.

---

## Serialization

`getState()` / `setState()` persist:
- `ticketCost`
- `maxTicketsPerNation`
- `nextTicketId`
- `currentDrawing`
- `tickets` (array of [id, ticket] entries)
- `nationTickets` (object of nationId → ticketIds)
- `resolvedTickets` (object of ticketId → result)
- `unclaimedWinnings` (object of ticketId → prize info)

---

## Socket Actions

| Action | Parameters | Description |
|--------|-----------|-------------|
| `casinoBuyKeno` | `{ petIds: [...] }` | Purchase keno ticket(s) with selected pet IDs |
| `casinoDrawKeno` | `{}` | Run the keno drawing (determine winners) |
| `casinoClaimKenoWin` | `{ ticketId: "..." }` | Claim prize from a winning ticket |
| `casinoGetKenoStats` | `{}` | Get nation's keno stats, tickets, resolved results, unclaimed winnings |

---

## Example Flow

1. **Player buys ticket:**
   ```
   socket.emit('casinoBuyKeno', { petIds: ['Axolotl', 'Cat', 'Dog', 'Eagle', 'Fox'] })
   // Cost: $100,000 deducted from nation, added to World Bank pool
   ```

2. **Wheel draws:**
   ```
   socket.emit('casinoDrawKeno', {})
   // 20 pets drawn, 2 designated as Multiplier Draws
   ```

3. **Player claims win:**
   ```
   socket.emit('casinoClaimKenoWin', { ticketId: 'keno_12345' })
   // Prize money added to nation, World Bank pool reduced
   ```

4. **Check stats:**
   ```
   socket.emit('casinoGetKenoStats', {})
   // Returns played/won/spent/wonAmount stats, current tickets, resolved tickets, unclaimed winnings
   ```

---

## Key Design Decisions

- **All randomness uses `crypto.randomInt()`** — cryptographically secure, no `Math.random()` anywhere
- **Server-side determination:** Win/loss, prize amount, and drawing results are determined server-side; the client only sees results
- **Winning credits stack:** Free unit credits from Sovereign Wheel are separate from keno; keno prizes are pure currency
- **Pool protection:** Payouts are capped at the World Bank lottery pool balance; if the pool can't cover the full amount, prizes are scaled down proportionally
- **Unclaimed winnings:** Prizes must be claimed within 14 days or they expire
- **Partial redemption:** Not applicable to keno (prizes are all-or-nothing per ticket)
