# Data & Database Managers — `core/database-manager.js`, `core/data-persistence.js`, `core/data-manager.js`, `core/data-integration.js`, `core/persist-store.js`, `core/persistence-init.js`

**Purpose:** The complete data layer. Every entity (nation, player, alliance, war, aid, etc.) is saved to its own JSON file under `saves/db/<domain>.json` using write-through persistence.

---

## File Overview

| File | Responsibility |
|------|---------------|
| `database-manager.js` | Manages all 15 domain databases; opens, saves, loads them |
| `data-persistence.js` | Glue that auto-saves every entity when it changes (write-through) |
| `data-manager.js` | Save slots, quicksaves, autosaves, import/export |
| `data-integration.js` | Connects database, API, backup, sync systems together |
| `persist-store.js` | Low-level file cabinet: one JSON file per domain |
| `persistence-init.js` | Loads DBs on boot, flushes on shutdown/crash |

---

## 1. Database Manager — `core/database-manager.js`

**Purpose:** Manages all 15 domain databases. Each domain is its own class extending `BaseDatabase`.

### 15 Domain Databases

| Domain | What It Stores |
|--------|---------------|
| `players` | Player accounts, skills, levels, experience |
| `nations` | Nation data: money, land, infra, tech, military units |
| `alliances` | Alliance data: name, acronym, members, treasury |
| `wars` | War declarations, battles, damages, peace terms |
| `treaties` | Non-aggression, mutual defense treaties |
| `global` | World state: game day, global happiness, crime, etc. |
| `sports` | Sports teams, leagues, players, stadiums |
| `messages` | In-game messages between players |
| `forum` | Forum posts, topics, replies |
| `worldbank` | World bank: currency, interest rates, lottery |
| `analytics` | Analytics events, audit logs |
| `awards` | Player awards and achievements |
| `accounts` | Account data (email, password hash, etc.) |
| `sessions` | User session data |
| `aid` | Aid transfers between nations |

### Key Methods

| Method | Description |
|--------|-------------|
| `saveEntity(domain, entity, idField)` | Save/update a single entity to its domain DB |
| `loadEntity(domain, id, permissions)` | Load a single entity from its domain DB |
| `deleteEntity(domain, id)` | Delete an entity |
| `query(domain, fields, filters, permissions)` | Query a domain with field filtering |
| `subscribe(domain, callback)` | Subscribe to changes on a domain |
| `saveAll()` | Force flush all databases to disk |
| `loadAll()` | Load all databases (report record counts) |
| `syncData(syncData, source)` | Sync multiple entities across domains |
| `shutdown()` | Flush all DBs to disk before exit |

### Write-Through

Every `saveEntity()` call writes immediately to `persist-store.js`, which writes to `saves/db/<domain>.json`. Nothing is batched or delayed.

---

## 2. Data Persistence — `core/data-persistence.js`

**Purpose:** The glue that auto-saves every entity when it changes. Uses the event system for write-through persistence.

### How It Works

```
Entity changes (e.g. nation money updated)
    ↓
Event emitted (e.g. 'nation_updated')
    ↓
wireAutoSave() listener catches event
    ↓
saveNation(nation) called
    ↓
db.saveEntity('nation', nation, 'id') → writes to disk immediately
```

### Auto-Save Event Wiring

| Event | Save Function |
|-------|--------------|
| `nation_updated` / `nation_created` / `nation_loaded` | `saveNation()` |
| `player_updated` / `player_initialized` / `player_loaded` | `savePlayer()` |
| `alliance_updated` | `saveAlliance()` |
| `war_updated` / `war_created` / `war_loaded` | `saveWar()` |
| `treaty_updated` / `treaty_created` | `saveTreaty()` |
| `global_updated` | `saveGlobal()` |
| `team_updated` / `team_created` / `team_loaded` | `saveTeam()` |
| `message_sent` | `saveMessage()` |
| `worldBank_updated` | `saveWorldBank()` |
| `aid_sent` / `aid_received` | `saveAid()` |

### Key Functions

| Function | Description |
|----------|-------------|
| `saveAid(aid)` / `loadAid(id, permissions)` | Save/load aid records |
| `saveWorldBank(bank)` / `loadWorldBank(id)` | Save/load world bank state |
| `wireAutoSave()` | Wire all entity events to auto-save (guarded against double-wiring) |
| `saveAll()` / `loadAll()` | Bulk save/load all domains |
| `getStatus()` / `subscribe()` | Status and subscription helpers |

### Guard Against Double-Wiring

`wireAutoSave()` uses an `autosaveWired` flag so it can be called from both `persistence-init.js` and `data-integration.js` without registering duplicate listeners.

---

## 3. Data Manager — `core/data-manager.js`

**Purpose:** Save slots, quicksaves, autosaves, and import/export save files for the player.

### What It Does

| Feature | Description |
|---------|-------------|
| **Save slots** | Named save slots for manual saves |
| **Quicksaves** | Rotating quicksaves (up to 5) |
| **Autosave** | Timer-based full game state snapshots (secondary to write-through) |
| **Import/Export** | Export/import save files as JSON |

### Important

The timer-based autosave (5-minute interval) is now **secondary**. The primary durability comes from write-through persistence in `data-persistence.js`, which saves every entity change immediately. The data manager's autosave creates full game state snapshots as a convenience.

### Browser-Safe

Uses optional chaining (`GameConfig?.SAVE?.AUTO_SAVE_INTERVAL ?? 300000`) so it doesn't crash if `config.js` hasn't loaded yet.

---

## 4. Data Integration — `core/data-integration.js`

**Purpose:** Connects all data management systems together into one cohesive layer.

### What It Connects

| Connection | Purpose |
|------------|---------|
| Database Manager ↔ Sync Manager | Database changes queued for sync |
| Sync Manager ↔ Backup System | Sync updates trigger incremental backups |
| API System ↔ Database Manager | API queries read from databases |
| Event Bus ↔ Persistence | Game events trigger auto-saves |

### Public API

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize all data systems (must be awaited) |
| `isReady()` | Check if initialization is complete |
| `processApiRequest(request)` | Process an API request (read-only) |
| `createApiKey(playerName, permissions, description)` | Create an API key for external access |
| `getSystemStatus()` | Get status of all data systems |
| `exportAllData()` | Export all domain data to JSON (browser download) |
| `importData(file)` | Import data from a JSON file |
| `destroy()` | Clean shutdown: stop sync, flush DBs to disk |

### Initialization

Must be called explicitly:

```javascript
await DataIntegration_Instance.initialize();
```

Not called automatically in the constructor to avoid race conditions.

---

## 5. Persist Store — `core/persist-store.js`

**Purpose:** Low-level file cabinet. Each domain gets its own JSON file that updates instantly on change.

### How It Works

```
saves/db/
├── players.json
├── nations.json
├── alliances.json
├── wars.json
├── treaties.json
├── global.json
├── sports.json
├── messages.json
├── forum.json
├── worldbank.json
├── analytics.json
├── awards.json
├── accounts.json
├── sessions.json
└── aid.json          ← added for aid system
```

### Key Features

- **Write-through:** Every `set()` call schedules a write to disk
- **Debounced writes:** Multiple rapid changes are batched into one write
- **Sync flush:** `flushSync()` forces immediate write (used at shutdown)
- **Browser-safe:** `require('fs')` wrapped in try/catch with `fs = null` fallback
- **No input mutation:** `set()` copies the record instead of modifying the caller's object

### `destroy()` Method

Flushes to disk, clears the in-memory Map, and resets write flags. Called during system shutdown.

---

## 6. Persistence Init — `core/persistence-init.js`

**Purpose:** Starts persistence on boot and flushes everything on shutdown/crash.

### Boot Sequence

1. `initializePersistence()` — loads all databases from `saves/db/`
2. `wireAutoSave()` — connects entity events to auto-save
3. `isInitialized = true` — persistence is active

### Shutdown Sequence

1. `shutdownPersistence()` — calls `saveAll()` to flush everything to disk
2. `isInitialized = false` — allows re-initialization later

### Guards

- **Double-initialization:** `initializing` flag prevents concurrent init calls from both passing the check
- **Reset on shutdown:** `isInitialized` is reset to `false` in a `finally` block so re-init works after shutdown

---

## Write-Through Autosave Architecture (Summary)

```
┌─────────────────────────────────────────────────────────────┐
│  Player performs action (aid sent, building built, etc.)    │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    Event emitted
              (aid_sent, nation_updated, etc.)
                           ↓
              ┌──────────────┴──────────────┐
              ↓                             ↓
     Data Persistence                    Backup System
     (wireAutoSave listener)             (incremental backup)
              ↓                             ↓
     saveEntity() → PersistStore → saves/db/<domain>.json
                           ↓
                    Data is durable
                    Nothing lost on crash/refresh
```
