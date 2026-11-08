# Trade & Aid System

The **Trade & Aid System** (`TradeAidSystem`) handles nation-to-nation resource/currency exchange between two nations via shared proposal slots. Each nation gets 5 slots (shared between aid and trade). Slots free after a 3-day falloff period following acceptance or rejection.

| Item | Value |
|------|-------|
| **System class:** | `TradeAidSystem` |
| **Global instance:** | `window.tradeAidSystem` |
| **Class export:** | `window.TradeAidSystem` |
| **Source file:** | `systems/Resource/trade-aid-system.js` |
| **Server instance:** | `server/world.js` (`const tradeAidSystem = new TradeAidSystem()`) |
| **Depends on:** | `World` instance (`world.nation()`, `world.resourceSystem`), `XPGoalsSystem` (awarding via server handlers) |
| **Save/Load:** | Yes — `restore(savedSlots)` on load, `tradeAidSystem.slots` serialized in `server/world.js` state (`tradeAidSlots`) |
| **Exported constants:** | `SLOT_COUNT` (5), `FALLOFF_DAYS` (3) |

---

## Overview

`TradeAidSystem` is a stateful service that manages proposal slots between nations. Each slot represents one pending aid or trade offer. Slots live on the proposing nation (`fromNationId`) and are referenceable by both nations via `getSlotsForNation()` / `getPendingForNation()`.

```
Slot lifecycle:
  pending → [accept] → accepted → (3-day falloff) → completed
  pending → [reject] → rejected → (3-day falloff) → returning → (cleanup)
  pending → [counter] → countered → [accept counter] → accepted
  pending → [counter] → countered → [reject counter] → rejected
```

**Limits:**

| Limit Type | Value |
|------------|-------|
| Slots per nation (shared aid+trade) | 5 |
| Falloff period after accept/reject | 3 days |
| Aid — max currency | $25,000,000 |
| Aid — max per resource stage | 1,000 units |
| Aid — max total resources | 5,000 units across all stages/types |
| Trade — resource limits | None |
| Trade — currency limits | None |
| Counter offers per trade | One (then `canCounter = false`) |

---

## Class Declaration & Constructor

```js
class TradeAidSystem {
    constructor()
```

| Property | Type | Description |
|----------|------|-------------|
| `slots` | `object` | `{ [nationId]: { [slotId]: slotData } }` — all proposal slots keyed by proposing nation |
| `isInitialized` | `boolean` | Whether the system has been initialized |

### `initialize()`

Marks the system as initialized and emits `trade_aid_system_initialized` on the EventBus.

### `restore(savedSlots)`

Restores saved slot state from persistence (called by `server/world.js` on world load).

---

## Slot Management

### `_ensureNationSlots(nationId)`

Creates an empty slot map for a nation if none exists.

### `_allocateSlot(nationId)`

Allocates a free slot ID for a nation. Reuses an expired completed/falling_off/rejected/returning slot if available; otherwise creates a new slot if active count < `SLOT_COUNT`. Returns `null` if all slots occupied.

### `_countActiveSlots(nationId)`

Counts slots with status `pending`, `countered`, `accepted`, or `returning`.

### `_getFreeSlot(nationId)`

Finds and deletes an expired slot (falloff time reached) with status `completed`, `falling_off`, `rejected`, or `returning`, returning its reusable slotId.

---

## Resource Validation

### `_validateAidResources(resources)`

Validates aid resource amounts:
- Skips `money` key (handled separately)
- Mineral resources (`steel`, `bronze`, `lead`, `aluminum`, `copper`, `uranium`, `gasoline`): staged format `{ raw, stage1, stage2, stage3, manufactured }`, each stage max `AID_MAX_PER_STAGE` (1000)
- Flat resources (`food`, `water`): number format, max `AID_MAX_PER_STAGE`
- Total resource units across all types capped at `AID_MAX_TOTAL_RESOURCES` (5000)

Returns `{ valid, reasons, totalUnits }`.

### `_validateTradeResources(resources)`

Validates trade resource amounts:
- Skips `money` key
- Mineral resources: staged format, per-stage integer validation
- Flat resources: number format, integer validation
- Tracks `typeTotals` and `grandTotal` for reporting

**Note:** Trade has no per-type or total resource limits (removed per design), so this only validates format/integrality, not caps.

Returns `{ valid, reasons, grandTotal }`.

---

## Currency Conversion

### `_convertCurrency(amount, fromCurrency, toCurrency, world)`

Converts an amount from one currency to another using World Bank rates:
```
moneyValue = amount × fromRate
converted = Math.floor(moneyValue / toRate)
```
Returns the original amount unchanged if currencies match. Falls back to rate 100 if `world.getCurrencyRate` is unavailable.

---

## Aid

### `proposeAid(world, fromNationId, toNationId, sending)`

Proposes aid from one nation to another.

**Parameters:**
- `world` — World instance (for nation/resource lookups)
- `fromNationId` — Sender nation ID
- `toNationId` — Receiver nation ID
- `sending` — `{ money: number, resources: { ... } }`

**Flow:**
1. Validates both nations exist and are different
2. Allocates a slot (rejects if all 5 occupied)
3. Validates currency (≤ `$25M`, ≥ 0)
4. Validates resources via `_validateAidResources`
5. Checks sender affordability (`fromNation.money >= money`)
6. Checks sender has enough resources
7. **Deducts sender's money and resources immediately** (held in escrow until accepted/rejected)
8. Creates slot with status `pending`, stores `convertedMoney` for cross-currency payout
9. Server handler awards `awardSendAid` XP via `XPGoalsSystem`

Returns `{ success: true, slotId }` or `{ success: false, error }`.

### `respondToAid(world, slotId, respondingNationId, accept)`

Receiver accepts or rejects an aid proposal.

**Parameters:**
- `world` — World instance
- `slotId` — Slot ID
- `respondingNationId` — Must be `slot.toNationId`
- `accept` — `true` to accept, `false` to reject

**On accept:**
- Receiver gets `slot.sending.convertedMoney` (the cross-currency converted amount)
- Receiver gets all resources from `slot.sending.resources`
- Slot status → `accepted`, `falloffAt = now + 3 days`
- Server handler awards `awardReceiveAid` XP

**On reject:**
- Sender gets their escrowed money and resources back
- Slot status → `rejected`, `falloffAt = now + 3 days`

Returns `{ success: true }` or `{ success: false, error }`.

---

## Trade

### `proposeTrade(world, fromNationId, toNationId, sending, receiving)`

Proposes a trade between two nations.

**Parameters:**
- `sending` — `{ money: number, resources: { ... } }` what the sender gives
- `receiving` — `{ money: number, resources: { ... } }` what the sender wants in return

**Flow:**
1. Validates both nations exist and are different
2. Allocates a slot (rejects if all 5 occupied)
3. Validates sending resources via `_validateTradeResources`
4. Validates receiving resources via `_validateTradeResources`
5. Checks sender affordability for sending side (`fromNation.money >= sendMoney` and enough resources)
6. **Deducts sender's sending money and resources immediately** (held in escrow)
7. Creates slot with status `pending`, `canCounter: true`
8. Server handler awards `awardProposeTrade` XP

Returns `{ success: true, slotId }` or `{ success: false, error }`.

### `respondToTrade(world, slotId, respondingNationId, accept, counterOffer)`

Receiver responds to a trade proposal — accept, reject, or counter.

**Parameters:**
- `slotId` — Slot ID
- `respondingNationId` — Must be `slot.toNationId`
- `accept` — `true` to accept (ignored if counterOffer provided)
- `counterOffer` — `{ sending, receiving }` if countering

**On accept (no counter):**
- Validates receiver (toNation) can afford their **receiving/sending side** (`toNation.money >= recvMoney` and enough resources) — prevents acceptance without ability to pay
- Deducts receiver's resources/currency
- Sender receives converted currency + resources from receiver's side
- Slot status → `accepted`, `falloffAt = now + 3 days`
- Server handler awards `awardAcceptTrade` XP

**On reject:**
- Sender's escrowed money/resources refunded
- Slot status → `rejected`, `falloffAt = now + 3 days`
- Server handler awards `awardRejectTrade` XP

**On counter (if `slot.canCounter`):**
- Validates counter offer resources and receiver affordability
- Deducts receiver's counter-sending side
- Slot status → `countered`, `canCounter: false`, stores `counterOffer`
- Server handler awards `awardProposeTrade` XP (isCounter: true)

Returns `{ success: true }` or `{ success: false, error }`.

### `respondToCounter(world, slotId, respondingNationId, accept)`

Original sender responds to a counter offer — accept or reject.

**Parameters:**
- `slotId` — Slot ID
- `respondingNationId` — Must be `slot.counterOffer.toNationId` (original sender)
- `accept` — `true` to accept counter, `false` to reject

**On accept:**
- **Refunds original sender's escrow** (`slot.sending`) — counter terms replace original
- Validates and deducts counter receiving side from original sender (`fromNation`) — prevents accepting a counter they can't pay
- Original sender receives counter sending side (converted)
- Receiver receives counter receiving side (converted)
- Slot status → `accepted`, `falloffAt = now + 3 days`
- Server handler awards `awardAcceptTrade` XP (isCounter: true)

**On reject:**
- Original sender's escrow refunded
- Receiver's counter-sending escrow refunded
- Slot status → `rejected`, `falloffAt = now + 3 days`, `counterOffer = null`
- Server handler awards `awardRejectTrade` XP (isCounter: true)

Returns `{ success: true }` or `{ success: false, error }`.

---

## Query / Utility

### `_findSlot(slotId)`

Searches all nation slot maps for a slot by ID. Returns the slot object or `null`.

### `getSlotsForNation(nationId)`

Returns all slots (sent or received) for a nation.

### `getAvailableSlotCount(nationId)`

Returns `SLOT_COUNT - activeSlotCount` (0 if full).

### `processFalloffs(world)`

Called each turn (see wiring below). Iterates all slots:
- If `falloffAt` reached and status is `accepted` → `completed`
- If `falloffAt` reached and status is `rejected` → `returning`
- Returns list of freed slot transitions

Expired slots are cleaned up (deleted) on next `_getFreeSlot` call.

### `getPendingForNation(nationId)`

Returns all slots for a nation with status `pending` or `countered` (sent or received).

---

## Wiring (Server → Client)

| Location | Usage |
|----------|-------|
| `server/world.js:20` | `const tradeAidSystem = new TradeAidSystem(); tradeAidSystem.initialize();` |
| `server/world.js:155` | `tradeAidSystem.restore(this.state.tradeAidSlots)` — restore on world load |
| `server/world.js:188` | `tradeAidSlots: tradeAidSystem.slots` — serialize slots into world state |
| `server/world.js:4130` | `tradeAidSystem.processFalloffs(this)` — process slot falloffs each turn |
| `server/world.js:1761-1774` | Action routing: `proposeAid`, `respondToAid`, `proposeTrade`, `respondToTrade`, `respondToCounter` |
| `server/world.js:1958-2033` | Action handlers — each calls the TradeAidSystem method then awards XP via `xpGoalsSystem` (`awardSendAid`, `awardReceiveAid`, `awardProposeTrade`, `awardAcceptTrade`, `awardRejectTrade`) |

---

## Slot Data Schema

```js
{
    id: 'ta_<timestamp>_<random>',
    type: 'aid' | 'trade',
    fromNationId: 'nation_id',
    toNationId: 'nation_id',
    fromCurrency: 'usd',       // proposer's currency
    toCurrency: 'eur',         // receiver's currency
    sending: {
        money: 1000,           // original (unconverted) amount
        resources: { ... },    // what sender gives
        convertedMoney: 950    // cross-currency converted amount (aid only)
    },
    receiving: {
        money: 500,            // what sender wants back (trade only)
        resources: { ... }     // what sender wants back (trade only)
    },
    status: 'pending' | 'countered' | 'accepted' | 'rejected' | 'returning' | 'completed',
    createdAt: <timestamp>,
    respondedAt: <timestamp|null>,
    acceptedAt: <timestamp|null>,
    counterOffer: null | { sending, receiving, fromNationId, toNationId, counterAt },
    canCounter: boolean,       // trade only
    falloffAt: <timestamp|null>
}
```

---

## Key Behaviors & Guarantees

1. **Escrow:** Sender's sending side (money + resources) is deducted immediately at propose time and held until accept/reject.
2. **Receiver validation on accept:** For trades, the receiver's ability to pay their side is validated before any transfer — prevents accepting a trade they cannot fund.
3. **Counter replacement:** Accepting a counter refunds the original sender's escrow and applies counter terms; the counter receiving side is validated and deducted from the original sender.
4. **No duplication:** All resource/money movements are matched by corresponding deductions on the other side.
5. **Slot cleanup:** Expired accepted/rejected slots transition to completed/returning, then are physically deleted on next slot allocation for that nation.
6. **XP awarding:** All trade/aid actions award XP through `XPGoalsSystem` (wrapped in try/catch so system absence doesn't break actions).