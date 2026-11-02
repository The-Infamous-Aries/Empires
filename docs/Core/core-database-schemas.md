# Database Schemas — `core/databases/`

**Purpose:** Individual database classes for each of the 15 domain databases. Every class extends `BaseDatabase` and persists to `saves/db/<domain>.json`.

---

## Base Class — `base-database.js`

**Purpose:** Foundation for all domain databases. Provides CRUD, indexed queries, permission filtering, change subscriptions, validation, and atomic file persistence.

### Schema Format

Each database defines a schema where keys are field names and values are config objects:

```javascript
{
    fieldName: {
        type: 'string',           // 'string', 'number', 'boolean', 'object', 'array'
        required: true,           // must be present on insert/update
        indexed: true,            // create an index for fast lookups
        default: 'value',         // default value if not provided
        validate: (val) => {...}  // custom validation function
    }
}
```

### Core Methods

| Method | Description |
|--------|-------------|
| `insert(id, record)` | Validate, timestamp, index, save to disk, notify listeners |
| `update(id, updates)` | Merge updates, validate, re-index, save, notify |
| `delete(id)` | Remove from data and indexes, save, notify |
| `findById(id, permissions)` | Get single record with permission filtering |
| `findByIndex(field, value, permissions)` | Fast lookup using a schema-declared index |
| `query(fields, filters, permissions)` | Filter + permission + field selection + pagination |
| `subscribe(callback)` | Listen for insert/update/delete events |
| `saveData()` | Atomic write to `saves/db/<domain>.json` |
| `loadData()` | Load from disk on constructor |
| `getStats()` | Record count, last modified, version, indexes |
| `flushSync()` | Force synchronous write (shutdown) |

### Query Operators

| Operator | Meaning |
|----------|---------|
| `$eq` | Equal |
| `$ne` | Not equal |
| `$gt` | Greater than |
| `$gte` | Greater than or equal |
| `$lt` | Less than |
| `$lte` | Less than or equal |
| `$in` | Value in array |
| `$nin` | Value not in array |
| `$regex` | Regular expression test |

---

## 15 Domain Databases

### 1. `account-database.js` — Domain: `accounts`

**Stores:** User account data: email, password hash, auth provider, linked OAuth IDs (googleId, discordId), email verification status.

**Key indexed fields:** `email`, `username`

**Permissions:** Sensitive fields (passwordHash, email) are `none` — never exposed through the Query API.

---

### 2. `aid-database.js` — Domain: `aid`

**Stores:** Aid transfers between nations: fromNationId, toNationId, amount, type, createdAt, status, version.

**Key indexed fields:** `fromNationId`, `toNationId`, `createdAt`, `status`

**Permissions:** All fields are `public` — any client can query aid history.

**Query helpers:**
- `findByFromNation(fromNationId)` — aid sent by a nation
- `findByToNation(toNationId)` — aid received by a nation
- `findByNation(nationId)` — all aid involving a nation (sent + received)
- `findRecentAid(limit)` — most recent aid globally

---

### 3. `alliance-database.js` — Domain: `alliances`

**Stores:** Alliance data: name, acronym, founderId, members, treasury, founded date, description.

**Key indexed fields:** `name`, `acronym`, `founderId`

---

### 4. `analytics-database.js` — Domain: `analytics`

**Stores:** Analytics events, audit logs, performance metrics: eventType, timestamp, entityId, data.

**Key indexed fields:** `eventType`, `timestamp`, `entityId`

---

### 5. `award-database.js` — Domain: `awards`

**Stores:** Player awards and achievements: award type, earned date, criteria met, playerId.

**Key indexed fields:** `playerId`, `awardType`, `earnedAt`

---

### 6. `forum-database.js` — Domain: `forum`

**Stores:** Forum posts, topics, replies, categories: title, content, authorId, topicId, category, timestamp.

**Key indexed fields:** `topicId`, `authorId`, `category`

---

### 7. `global-database.js` — Domain: `global`

**Stores:** World state: game day, global happiness, crime, pollution, active events, world settings.

**Key indexed fields:** `key`

---

### 8. `message-database.js` — Domain: `messages`

**Stores:** In-game messages between players: senderId, recipientId, content, timestamp, read status.

**Key indexed fields:** `senderId`, `recipientId`, `timestamp`

---

### 9. `nation-database.js` — Domain: `nations`

**Stores:** Full nation entity data: money, land, infra, tech, military units, wars, alliances, GDP, taxes, policies, territories, cities, research, nationStats, and more.

**Key indexed fields:** `id`, `playerId`, `name`, `factionKey`, `population`, `gdp`, `founded`, `allianceId`, `lastActive`, `isActive`

**Schema highlights:**

| Category | Fields |
|----------|--------|
| Identity | id, playerId, name, leader, government, religion, factionKey, factionColor |
| Core Stats | land, infra, tech, population, happiness, stability, reputation, gdp |
| Economy | money, taxRate, taxableIncome, taxRevenue, debt, budget |
| Military | militaryStrength, militaryUnits, wars, alliances |
| Research | researchPoints, technologies, currentResearch, researchProgress |
| Map | territories, cities |
| Diplomacy | relations, treaties, tradeAgreements, allianceId, allianceRole |
| Government | policies, edicts, governmentType |
| Stats | nationStats (happiness, pollution, disease, crime, literacy, etc.) |

**Query helpers:**
- `findByAlliance(allianceId)` — nations in an alliance
- `findByPlayer(playerId)` — nations owned by a player
- `getTopNations(metric, limit)` — top nations by GDP, population, etc.
- `searchNations(namePattern)` — search by name (case-insensitive)

**Permissions:** `public` sees active nations; `game_data` sees all fields; `player_data` for owner-only fields.

---

### 10. `player-database.js` — Domain: `players`

**Stores:** Player accounts: username, email, skills, levels, experience, nation links, auth provider.

**Key indexed fields:** `username`, `email`, `nationId`

---

### 11. `session-database.js` — Domain: `sessions`

**Stores:** User session data: sessionId, userId, expiresAt, IP address, user agent, last activity.

**Key indexed fields:** `sessionId`, `userId`, `expiresAt`

---

### 12. `sports-database.js` — Domain: `sports`

**Stores:** Sports teams, leagues, players, stadiums, match results: teamId, leagueId, stadiumId, scores.

**Key indexed fields:** `teamId`, `leagueId`, `stadiumId`

---

### 13. `treaty-database.js` — Domain: `treaties`

**Stores:** Non-aggression, mutual defense treaties: participants, type, start/end dates, status.

**Key indexed fields:** `treatyType`, `participant1`, `participant2`

---

### 14. `war-database.js` — Domain: `wars`

**Stores:** War declarations, battles, damages, peace terms: attackerId, defenderId, status, declaredAt, casualties, damages.

**Key indexed fields:** `attackerId`, `defenderId`, `status`, `declaredAt`

---

### 15. `worldbank-database.js` — Domain: `worldbank`

**Stores:** World bank: currency type, currency values, interest rates, loan rates, lottery balance, lottery winners.

**Key indexed fields:** `key`

**Permissions:** All fields are `public`.

---

## Database File Locations

All databases persist to individual JSON files:

```
saves/db/
├── accounts.json
├── aid.json
├── alliances.json
├── analytics.json
├── awards.json
├── forum.json
├── global.json
├── messages.json
├── nations.json
├── players.json
├── sessions.json
├── sports.json
├── treaties.json
├── wars.json
└── worldbank.json
```

Each file contains:
```json
{
    "version": 1,
    "lastModified": 1730550000000,
    "record_count": 42,
    "data": {
        "record_id_1": { ...record data... },
        "record_id_2": { ...record data... }
    }
}
```

---

## How Databases Connect to the Rest of the System

```
Game code calls saveEntity('nations', nationData, 'id')
    ↓
database-manager.js saveEntity()
    ↓
db.insert() / db.update() in base-database.js
    ↓
validateRecord() → updateIndexes() → notifyChange() → saveData()
    ↓
Write to saves/db/nations.json (atomic)
    ↓
notifyChange() triggers sync manager (queues change for sync)
    ↓
Sync manager → backup system (incremental backup)
```

**All databases are loaded on boot** via `DatabaseManager.initializeDatabases()` → each constructor calls `loadData()` → reads from `saves/db/<domain>.json`.

**All databases are flushed on shutdown** via `DatabaseManager.saveAll()` → each database calls `flushSync()`.
