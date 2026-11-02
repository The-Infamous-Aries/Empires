# Aid System — `core/aid-system.js` & `core/databases/aid-database.js`

**Purpose:** Lets nations send aid (money) to each other. This replaces the removed trade system — nations can no longer trade resources, but they CAN send aid as humanitarian, military, or economic assistance.

---

## Files

| File | What It Does |
|------|-------------|
| `core/aid-system.js` | Central aid logic: validation, cooldowns, limits, history tracking, event emission |
| `core/databases/aid-database.js` | Domain database for aid records — persists each aid transfer to `saves/db/aid.json` |

---

## How Aid Works

### Sending Aid

1. **Nation A calls `sendAid(fromNationId, toNationId, amount, type)`**
2. **Validation checks run:**
   - Both nation IDs must be provided
   - A nation cannot send aid to itself
   - Amount must be > 0
   - Aid cooldown must have passed (default: 1 hour between sends)
   - Amount must be within min/max limits (default: $1,000 min / $1,000,000 max)
   - Sender must have sufficient money
3. **Aid record is created** with ID, from/to nation IDs, amount, type, timestamp, and status
4. **Events are emitted:** `aid_sent` and `aid_received`
5. **Auto-save triggers:** `saveAid()` writes the record to the aid database immediately

### Config Settings (`config.js` → `GameConfig.AID`)

| Setting | Default | What It Controls |
|---------|---------|-----------------|
| `COOLDOWN_MS` | 3,600,000 (1 hour) | How often a nation can send aid |
| `MAX_AMOUNT` | 1,000,000 | Max money per single aid transfer |
| `MIN_AMOUNT` | 1,000 | Min money per single aid transfer |

### Game Events

| Event | When Fired | Data |
|-------|-----------|------|
| `AID_SENT` / `aid_sent` | Aid transfer completed | `{ aid: aidRecord }` |
| `AID_RECEIVED` / `aid_received` | Aid received by target nation | `{ aid: aidRecord }` |

---

## Key Methods (aid-system.js)

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `sendAid(fromNationId, toNationId, amount, type)` | strings, number, string | `{ success, aid, error }` | Validate and record an aid transfer |
| `getAidHistory(nationId, options)` | string, {limit, offset, type} | Array | All aid sent/received by a nation |
| `canSendAid(nationId)` | string | `{ canSend, reason, cooldownRemainingMs }` | Check if a nation can send aid right now |
| `getAidStats()` | none | Object | Global aid totals: transfers, amount, by type, average |
| `getTotalAidSent(nationId)` | string | number | Total money sent by a nation |
| `getTotalAidReceived(nationId)` | string | number | Total money received by a nation |
| `getAid(aidId)` | string | Object\|null | Get a specific aid record by ID |

### `sendAid` Type Values

| Type | Description |
|------|-------------|
| `humanitarian` | General aid (default) |
| `military` | Military assistance |
| `economic` | Economic support |

---

## Aid Database Schema (`aid-database.js`)

| Field | Type | Required | Indexed | Description |
|-------|------|----------|---------|-------------|
| `id` | string | yes | yes | Unique aid record ID |
| `fromNationId` | string | yes | yes | Sending nation ID |
| `toNationId` | string | yes | yes | Receiving nation ID |
| `amount` | number | yes | no | Money amount sent |
| `type` | string | yes | no | Aid type: humanitarian/military/economic |
| `createdAt` | number | yes | yes | Timestamp of transfer |
| `status` | string | yes | yes | Transfer status (default: "completed") |
| `version` | number | no | no | Record version (default: 1) |

### Query Helpers

| Method | Description |
|--------|-------------|
| `findByFromNation(fromNationId)` | All aid sent by a nation |
| `findByToNation(toNationId)` | All aid received by a nation |
| `findByNation(nationId)` | All aid involving a nation (sent + received) |
| `findRecentAid(limit)` | Most recent aid transfers globally |

---

## AI Nations & Aid

AI nations use aid instead of trade:

- **`getAidOpportunities(nation)`** — finds AI nations with low treasury, at war, or allied that could receive aid
- **`aiSendAid(nation, targetId, amount)`** — calls `window.aidSystem.sendAid()` to send aid
- **`sendAid` action type** — added to AI decision loop so AI nations can choose to send aid each turn

AI prioritizes aid for: allies (priority +0.2), nations at war (+0.3), low-treasury nations (+0.4), scaled by cooperation personality trait.

---

## Query API Access

Aid is fully queryable via the read-only Query API (`core/query-system.js`):

```graphql
{ aid { id fromNationId toNationId amount type createdAt status } }
```

All aid fields are `public` permission — any external client can query aid history.

---

## Persistence Flow

```
aid_sent event fired
    ↓
data-persistence.js wireAutoSave() listener catches it
    ↓
saveAid(aidRecord) called
    ↓
db.saveEntity('aid', aidRecord, 'id') writes to saves/db/aid.json
    ↓
Data is durable immediately — nothing lost on crash
```
