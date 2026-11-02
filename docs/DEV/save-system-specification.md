# Save System Specification

**Status:** Planning / Design  
**Author:** Kilo (System Architect)  
**Date:** 2026-11-01  
**Project:** Empire.2 (Dominion Wars)  
**Scope:** Unified persistence layer for browser-based MMO, persisting through restarts, queryable by Discord bots

---

## 1. Executive Summary

Empire.2 currently has **four separate, overlapping save/load systems** that do not share a single source of truth. This document:

1. Audits what exists today and where data is saved.
2. Defines the problems caused by the fragmented approach.
3. Specifies a unified, domain-per-file persistence architecture.
4. Lists every domain (Nations, Alliances, Treaties, Wars, Global, Sports, etc.) with its exact fields.
5. Explains how the system works regardless of play style (browser MMO, always-running, persisting through restarts).
6. Lays the foundation for a query system (see `docs/DEV/query-system-specification.md`) so Discord bots and other external clients can read game data.

---

## 2. Current State Audit

### 2.1 Existing Save Mechanisms

| System | File | Storage Location | Format | Purpose |
|--------|------|------------------|--------|---------|
| DataManager | `core/data-manager.js` | Browser `localStorage` (`dominion_wars_save_*`) | JSON (+base64 "compression") | Client-side quicksave/slots |
| DatabaseManager | `core/database-manager.js` | Browser `localStorage` (`empire_db_*`, `empire_api_keys*`) | JSON | In-memory DB stubs + API keys |
| BackupSystem | `core/backup-system.js` | Browser `localStorage` (`empire_backup_*`) + IndexedDB | JSON | Timed backups + quicksaves |
| SyncManager | `core/sync-manager.js` | Browser `localStorage` (monkey-patched `setItem`) | JSON | Change tracking + conflict resolution |
| World (Server) | `server/world.js` | Disk: `saves/world.json` | JSON | Authoritative server world state |
| PersistStore | `core/persist-store.js` | Disk: `saves/db/<domain>.json` | JSON | Per-domain write-through stores |

### 2.2 Key Problems

1. **Split brain:** Client (`localStorage`) and server (`saves/world.json`) maintain separate copies of the same data. They can drift out of sync.
2. **No single source of truth:** A nation's money might be updated in `DataManager` but not in `DatabaseManager`, or vice versa.
3. **Browser-only persistence:** `localStorage` is tied to a specific browser/profile. Clearing cache deletes saves.
4. **No query API:** There is no standardized way for a Discord bot to ask "what is Nation X's GDP?" or "list all active wars."
5. **Inconsistent serialization:** Each entity (`Nation.js`, `Player.js`, `GlobalWorld.js`) has its own `serialize()`/`deserialize()` with overlapping but different field sets.
6. **No schema versioning per domain:** Save files lack per-domain schema versions, making migrations difficult.

---

## 3. Target Architecture: Unified Persistence Layer

### 3.1 Design Principles

| Principle | Requirement |
|-----------|-------------|
| **Single source of truth** | One canonical copy of each domain, persisted to disk. |
| **Domain-per-file** | Each domain (Nations, Alliances, Wars, etc.) gets its own JSON file under `saves/db/`. |
| **Write-through** | Every mutation writes immediately to disk (atomic `.tmp` → rename). |
| **Play-style agnostic** | Works whether the game runs in a browser tab, as an always-running MMO server, or headless for Discord bots. |
| **Restart-safe** | On startup, all domains are loaded from disk; in-memory state is rebuilt from files. |
| **Queryable** | Every persisted record has a stable `id` and queryable fields. |
| **Schema versioned** | Each domain file carries a `schema_version` for future migrations. |

### 3.2 Directory Layout

```
saves/
├── world.json          # Server world metadata (accounts, sessions, global config)
├── db/
│   ├── nations.json    # All nation records
│   ├── alliances.json  # All alliance records
│   ├── treaties.json   # All treaty records
│   ├── wars.json       # All war records
│   ├── global.json     # GlobalWorld state
│   ├── sports.json     # Sports teams, leagues, players
│   ├── players.json    # Player accounts/skills/progression
│   ├── messages.json   # World/alliance/private messages
│   ├── forum.json      # Forum articles, comments, motions
│   ├── worldbank.json  # World Bank loans, inventory, prices
│   └── analytics.json  # Analytics / event logs
├── backups/            # Timestamped full backups
│   └── YYYYMMDD-HHMMSS-full.json
└── queries/            # Pre-computed query caches (optional)
    └── index.json
```

### 3.3 PersistStore Per Domain

Each domain is managed by a `PersistStore` instance (see `core/persist-store.js`):

- **`set(record)`** — Upsert a record by `id`. Writes to disk immediately (coalesced async write).
- **`update(id, partial)`** — Merge partial fields into existing record.
- **`delete(id)`** — Remove record, write to disk.
- **`get(id)` / `entries()` / `values()` / `filter()` / `find()`** — In-memory reads (no disk hit).
- **`flushSync()`** — Force synchronous write (used at shutdown).

File format for every domain file:

```json
{
  "version": 1,
  "domain": "nations",
  "schema_version": 1,
  "updated": 1733123456789,
  "record_count": 42,
  "records": {
    "uuid-1": { ... nation fields ... },
    "uuid-2": { ... nation fields ... }
  }
}
```

---

## 4. Domain Schemas (What Gets Saved and Where)

Each domain below lists its **canonical fields** that must be persisted. These fields are designed to be complete enough for a Discord bot to reconstruct the game state without needing the client.

### 4.1 Nations (`saves/db/nations.json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | UUID, primary key |
| `playerId` | string | Yes | Owner player UUID |
| `name` | string | Yes | Nation name |
| `leader` | string | Yes | Leader name |
| `government` | string | Yes | Government type ID |
| `religion` | string | Yes | Religion type ID |
| `factionKey` | string | No | Faction affiliation |
| `factionColor` | string | No | Faction color hex |
| `capitalCity` | string | No | Capital name |
| `motto` | string | No | Nation motto |
| `flag` | object | No | Flag design data |
| `founded` | number | Yes | Timestamp of creation |
| `foundedDay` | number | Yes | Game day of creation |
| `land` | number | Yes | Land in miles |
| `infra` | number | Yes | Infrastructure level |
| `tech` | number | Yes | Technology level |
| `sharedTechnology` | number | Yes | Tech shared from allies |
| `mapBlocks` | number | Yes | Number of map blocks owned |
| `population` | number | Yes | Current population |
| `happiness` | number | Yes | 0-100 |
| `stability` | number | Yes | 0-100 |
| `reputation` | number | Yes | 0-100 |
| `money` | number | Yes | Cash on hand |
| `taxRate` | number | Yes | Tax percentage |
| `taxableIncome` | number | Yes | Computed per turn |
| `taxRevenue` | number | Yes | Last turn revenue |
| `totalTaxEarned` | number | Yes | Lifetime revenue |
| `budget` | object | Yes | `{income, expenses, balance}` |
| `debt` | number | Yes | Outstanding debt |
| `gdp` | number | Yes | Gross domestic product |
| `baseAttack` | number | Yes | Base attack stat |
| `baseDefense` | number | Yes | Base defense stat |
| `militaryStrength` | number | Yes | Computed strength |
| `militaryUnits` | object | Yes | `{soldiers, tanks, aircraft, ships, spies, missiles, nukes}` |
| `militaryBudget` | number | Yes | Daily upkeep budget |
| `wars` | array | Yes | List of war IDs involved in |
| `alliances` | array | Yes | List of alliance IDs |
| `allianceId` | string | No | Primary alliance ID |
| `allianceRole` | string | No | Role in alliance |
| `researchPoints` | number | Yes | Available research points |
| `technologies` | array | Yes | Completed tech IDs |
| `currentResearch` | string | No | Active research ID |
| `researchProgress` | number | Yes | Progress 0-100 |
| `territories` | array | Yes | List of claimed tile IDs (`"x,y"`) |
| `cities` | array | Yes | List of city names/IDs |
| `totalArea` | number | Yes | Total land miles claimed |
| `relations` | object | Yes | `{nationId: relationScore}` |
| `treaties` | array | Yes | Treaty IDs |
| `governmentType` | object | Yes | Current government demand state |
| `policies` | object | Yes | Domestic policy stances |
| `demandTimer` | object | Yes | Government/religion demand timers |
| `statistics` | object | Yes | Cumulative stat counters |
| `eventHistory` | array | Yes | Recent events |
| `achievements` | array | Yes | Unlocked achievement IDs |
| `sportsTeams` | object | Yes | Owned sports teams |
| `wonderEffects` | object | Yes | Active wonder bonuses |
| `edicts` | object | No | Active edicts |
| `edictChangeDates` | object | No | Edict change timestamps |
| `edictFreePassUsed` | boolean | No | Whether free edict change used |
| `edictUnlocked` | object | No | Unlocked edicts |
| `edictEffects` | object | No | Edict effect values |
| `edictSynergies` | array | No | Discovered synergies |
| `discoveredSynergies` | array | No | Synergy IDs |
| `synergyDays` | object | No | Synergy day counters |
| `improvements` | object | Yes | `{type: count}` |
| `improvementEffects` | object | Yes | Computed improvement bonuses |
| `projects` | object | Yes | `{type: count}` |
| `projectEffects` | object | Yes | Computed project bonuses |
| `domesticPolicies` | object | Yes | Policy stances |
| `policyEffects` | object | Yes | Computed policy bonuses |
| `buildingUpkeep` | object | Yes | `{improvements, projects, wonders}` costs |
| `militaryMaintenanceDeficit` | boolean | Yes | Can't afford upkeep |
| `combatMultiplier` | number | Yes | Combat modifier |
| `nationStats` | object | Yes | `{happiness, pollution, disease, crime, literacy, environment, ...}` |
| `lastActive` | number | Yes | Last activity timestamp |
| `version` | number | Yes | Record schema version |

### 4.2 Alliances (`saves/db/alliances.json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | UUID |
| `name` | string | Yes | Alliance name |
| `founderId` | string | Yes | Founder nation/player UUID |
| `description` | string | No | Alliance description |
| `memberCount` | number | Yes | Number of members |
| `memberIds` | array | Yes | List of member nation UUIDs |
| `founded` | number | Yes | Creation timestamp |
| `isActive` | boolean | Yes | Whether alliance is active |
| `isOpen` | boolean | Yes | Whether anyone can join |
| `treasury` | number | Yes | Alliance bank balance |
| `allianceStats` | object | Yes | Wars won, territories, etc. |
| `diplomacy` | object | Yes | Relations with other alliances |
| `lastActive` | number | Yes | Last activity |

### 4.3 Treaties (`saves/db/treaties.json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | UUID |
| `type` | string | Yes | `peace`, `trade`, `defense`, `research`, etc. |
| `partyA` | string | Yes | Nation/alliance UUID |
| `partyB` | string | Yes | Nation/alliance UUID |
| `status` | string | Yes | `pending`, `active`, `ended`, `rejected` |
| `createdAt` | number | Yes | Creation timestamp |
| `acceptedAt` | number | No | Acceptance timestamp |
| `endsAt` | number | No | Expiration timestamp |
| `terms` | object | Yes | Treaty-specific terms |
| `createdBy` | string | Yes | Who proposed it |

### 4.4 Wars (`saves/db/wars.json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | UUID |
| `attackerId` | string | Yes | Attacking nation UUID |
| `defenderId` | string | Yes | Defending nation UUID |
| `type` | string | Yes | `conventional`, `nuclear`, `limited`, etc. |
| `reason` | string | Yes | Casus belli |
| `status` | string | Yes | `active`, `peace`, `ended` |
| `declared` | number | Yes | Declaration timestamp |
| `turns` | number | Yes | Number of turns elapsed |
| `casualties` | object | Yes | `{attacker, defender}` unit losses |
| `damageDealt` | object | Yes | Damage by side |
| `peaceTerms` | object | No | Terms if peace treaty signed |
| `endedAt` | number | No | When war ended |

### 4.5 Global (`saves/db/global.json`) — GlobalWorld State

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `saveVersion` | number | Yes | Schema version |
| `globalAverages` | object | Yes | `{happiness, pollution, disease, crime, environment, populationDensity, education, literacyRate}` |
| `previousAverages` | object | Yes | Previous tick values for delta |
| `recentStrikes` | array | Yes | Missile/nuke strike history |
| `governmentTally` | object | Yes | `{govId: count}` |
| `religionTally` | object | Yes | `{religionId: count}` |
| `totalNations` | number | Yes | Active nation count |
| `majorityGovernment` | string | No | Most common gov ID |
| `majorityReligion` | string | No | Most common religion ID |
| `suggestedGovernment` | string | No | Suggested alternative |
| `suggestedReligion` | string | No | Suggested alternative |
| `warStats` | object | Yes | `{totalNations, nationsAtWar, nationsAtPeace, warPercentage, peacePercentage, activeWarCount, lastCalculatedDay}` |
| `militaryUnitStats` | object | Yes | Per-unit-type world averages |
| `currencyStats` | object | Yes | Per-currency nation counts and balances |
| `populationDemographics` | object | Yes | Age group distribution |
| `educationBuildings` | object | Yes | School/university counts worldwide |
| `sportsGlobalStats` | object | Yes | Per-sport team/player stats |
| `globalPlayerSkillStandard` | number | Yes | Overall skill baseline |
| `specialOfferCooldown` | object | Yes | `{teamId: lastOfferDay}` |
| `specialOffersPending` | object | Yes | Pending special offers |
| `cumulativeNukePollution` | number | Yes | Nuke pollution total |
| `cumulativeMissilePollution` | number | Yes | Missile pollution total |
| `diseaseStats` | object | Yes | `{totalNations, nationsWithMinorDisease, ...}` |
| `config` | object | Yes | Global tuning constants |

### 4.6 Sports (`saves/db/sports.json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Team UUID |
| `sport` | string | Yes | `basketball`, `hockey`, `soccer`, `football` |
| `nationId` | string | Yes | Owning nation UUID |
| `teamName` | string | Yes | Team name |
| `players` | array | Yes | Player roster with skills |
| `youthAcademy` | number | Yes | Academy level |
| `technologyCenter` | number | Yes | Tech center level |
| `avgSkill` | number | Yes | Team average skill |
| `totalPlayers` | number | Yes | Roster size |
| `championshipsWon` | number | Yes | Total championships |
| `seasonTournamentsWon` | number | Yes | Season wins |
| `gamesWon` | number | Yes | Games won |
| `gamesLost` | number | Yes | Games lost |
| `lastMatchDay` | number | No | Last game played day |
| `specialOfferEligible` | boolean | Yes | Eligible for special offers |

### 4.7 Players (`saves/db/players.json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | UUID |
| `username` | string | Yes | Display name |
| `email` | string | No | Account email |
| `joinDate` | number | Yes | Account creation |
| `lastActive` | number | Yes | Last login/activity |
| `level` | number | Yes | 1-100 |
| `experience` | number | Yes | Current XP |
| `totalExperience` | number | Yes | Lifetime XP |
| `legendaryLevel` | number | Yes | Prestige level |
| `totalLegendaryLevels` | number | Yes | Times gone legendary |
| `unallocatedSkillPoints` | number | Yes | Normal points to spend |
| `unallocatedLegendarySkillPoints` | number | Yes | Legendary points to spend |
| `skills` | object | Yes | `{skillKey: {level, pointsSpent, legendaryBonusPts}}` |
| `statistics` | object | Yes | Play time, battles, trades, etc. |
| `achievements` | array | Yes | Unlocked IDs |
| `titles` | array | Yes | Unlocked title IDs |
| `currentTitle` | string | No | Equipped title |
| `settings` | object | Yes | `{notifications, ui, privacy}` |
| `factionKey` | string | No | Faction |
| `factionColor` | string | No | Faction color |
| `factionRank` | string | No | Rank in faction |
| `activeEffects` | object | Yes | Temporary buffs/debuffs |
| `nationId` | string | No | Associated nation UUID |

### 4.8 Messages (`saves/db/messages.json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | UUID |
| `authorId` | string | Yes | Sender nation UUID |
| `channel` | string | Yes | `world`, `alliance`, `private` |
| `target` | string | No | Alliance ID or recipient nation ID |
| `body` | string | Yes | Message text |
| `createdAt` | number | Yes | Send timestamp |

### 4.9 Forum (`saves/db/forum.json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | UUID (article or motion) |
| `type` | string | Yes | `article`, `comment`, `motion`, `vote` |
| `authorId` | string | Yes | Author nation UUID |
| `title` | string | No | Article/motion title |
| `body` | string | Yes | Content |
| `category` | string | No | Forum category |
| `createdAt` | number | Yes | Creation time |
| `editedAt` | number | No | Last edit time |
| `comments` | array | No | Nested comments |
| `reactions` | object | No | `{userId: reactionType}` |
| `motionType` | string | No | Motion type ID |
| `status` | string | No | `scheduled`, `voting`, `passed`, `failed` |
| `opensAt` | number | No | Voting start |
| `endsAt` | number | No | Voting end |
| `votes` | object | No | `{nationId: choice}` |

### 4.10 World Bank (`saves/db/worldbank.json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prices` | object | Yes | `{resource: price}` |
| `targets` | object | Yes | `{resource: target inventory}` |
| `inventory` | object | Yes | `{resource: amount}` |
| `seeded` | boolean | Yes | Whether initialized |
| `loans` | array | Yes | Active loans `{id, nationId, principal, owed, rate, takenAt, status}` |

### 4.11 Analytics (`saves/db/analytics.json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | UUID |
| `type` | string | Yes | `resource_change`, `population_change`, `level_up`, etc. |
| `timestamp` | number | Yes | Event time |
| `nationId` | string | No | Related nation |
| `playerId` | string | No | Related player |
| `data` | object | Yes | Event-specific payload |

---

## 5. How It Works Regardless of Play Style

### 5.1 Browser MMO (Always-Running Tab)

1. On page load, `DataIntegration` initializes and loads all domain files from `saves/db/` (via the server API or IndexedDB fallback).
2. The game loop runs in the browser; every player action mutates in-memory state.
3. Every mutation calls `PersistStore.set()` / `update()`, which writes to disk atomically within the same tick.
4. Auto-save runs every 5 minutes as a safety net (creates a full backup snapshot).
5. If the tab is closed, data is already on disk — nothing is lost.

### 5.2 Headless / Server (No Browser)

1. The Node.js server owns `saves/world.json` and `saves/db/*.json` directly via `fs`.
2. `World.transact()` wraps every action: snapshot → mutate → `save()` → release.
3. On restart, `World.restore()` reads `saves/world.json` and each domain file rebuilds in-memory state.
4. No `localStorage` is involved — pure file-based persistence.

### 5.3 Persistence Through Restarts

| Scenario | Behavior |
|----------|----------|
| Browser refresh | Domain files already on disk; reload reads them back. |
| Server crash mid-write | Atomic `.tmp` → rename ensures no corrupted files. |
| Server reboot | `saves/world.json` + `saves/db/*.json` are read on startup; state fully restored. |
| Cache cleared | `localStorage` caches may be lost, but canonical disk files remain authoritative. |

### 5.4 Write Flow (Unified)

```
Player Action (UI / API / Discord command)
        │
        ▼
World.transact(fn) or PersistStore.set()
        │
        ├─► Snapshot in-memory state (rollback point)
        ├─► Apply mutation to domain record
        ├─► Validate schema/fields
        ├─► Write domain JSON to disk (atomic .tmp + rename)
        ├─► Update in-memory cache
        └─► Emit event (GameEvents.NATION_UPDATED, etc.)
                │
                ▼
        SyncManager queues change for replication/backup
        BackupSystem may create incremental backup
```

---

## 6. Migration Plan from Current System

1. **Phase 1 — Add `PersistStore` for each domain** alongside existing `localStorage` systems. Write to both during transition.
2. **Phase 2 — Make disk the source of truth.** Reads check disk first; `localStorage` becomes a read-only cache.
3. **Phase 3 — Remove legacy `localStorage` save code** (`DataManager.saveGame`, `BackupSystem.createQuickSave`, etc.) once all domains are migrated.
4. **Phase 4 — Expose query API** (see query-system-specification.md) for Discord bots.

---

## 7. Open Questions / Decisions Needed

- Should `saves/world.json` remain the server's master file, or should it be replaced by per-domain files too? (Recommendation: keep `world.json` for server metadata only; all gameplay data in `saves/db/`.)
- What is the backup retention policy? (Recommendation: 50 full backups, 10 quicksaves, auto-cleanup.)
- Should domain files be compressed (gzip) to save disk space? (Recommendation: not initially; JSON is human-readable and easier to debug.)
- Should we use SQLite instead of JSON files? (Recommendation: keep JSON for simplicity and portability; can migrate to SQLite later if scale demands it.)

---

## 8. Related Documents

- `docs/DEV/query-system-specification.md` — How external clients (Discord bots) query game data.
- `core/persist-store.js` — Reference implementation of per-domain file store.
- `core/database-manager.js` — Existing DB manager to be refactored.
- `core/data-integration.js` — Orchestrator to be updated for unified persistence.
