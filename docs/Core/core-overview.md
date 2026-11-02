# Core Folder — Empire Wars Game Systems

**Location:** `core/` (top-level files + `auth/` + `databases/` subfolders)
**Game Rules:** No resources / no trades. Nations CAN send aid to each other.
**Write-Through Autosave:** Every action is auto-persisted immediately via the event-driven persistence system. No manual player save needed.

---

## Folder Structure

```
core/
├── aid-system.js                    # Central aid system (nations send money to each other)
├── admin-init.js                    # Boot admin system, auto-grant super_admin, shortcuts
├── admin-system.js                  # Admin monitoring: bans, warnings, error logs, action logs
├── ai-nations.js                    # AI-controlled nations that play like user nations
├── api-system.js                    # Read-only API for external tools (Discord bots, websites)
├── backup-system.js                 # Automatic full + incremental backups
├── colors.js                        # 10 faction colors for map and UI
├── config.js                        # Master game settings: costs, XP, aid limits, events
├── data-integration.js              # Connects database, API, backup, sync systems
├── data-manager.js                  # Save slots, quicksaves, autosaves, import/export
├── data-persistence.js              # Glue that saves every entity to its DB on change
├── database-manager.js              # Manages all 15 domain databases
├── error-system.js                  # Crash catching, user-friendly errors, admin alerts
├── event-system.js                  # Game "nerve center": cross-system event bus
├── game-engine.js                   # Main game loop: startup, login, map/UI rendering, turns
├── persistence-init.js              # Loads DBs on boot, flushes on shutdown/crash
├── persist-store.js                 # Low-level file cabinet: one JSON per domain
├── query-system.js                  # Read-only GraphQL-like query API with permission filtering
├── sync-manager.js                  # Data sync queue, conflict resolution, change tracking
│
├── auth/                            # Authentication (login, OAuth, JWT)
│   ├── auth-middleware.js           # JWT verification, Socket.IO auth, rate limiting
│   ├── auth-routes.js               # Express routes: login, register, Google/Discord OAuth
│   └── passport-config.js           # Passport.js strategies: local, Google OAuth, Discord OAuth
│
└── databases/                       # Domain database classes (16 files)
    ├── base-database.js             # Base class: CRUD, indexes, file persistence
    ├── account-database.js          # Account data (email, password hash, etc.)
    ├── aid-database.js              # Aid transfers between nations
    ├── alliance-database.js         # Alliance data: name, acronym, members, treasury
    ├── analytics-database.js        # Analytics events, audit logs
    ├── award-database.js            # Player awards and achievements
    ├── forum-database.js            # Forum posts, topics, replies
    ├── global-database.js           # World state: game day, global happiness, crime
    ├── message-database.js          # In-game messages between players
    ├── nation-database.js           # Nation data: money, land, infra, tech, military
    ├── player-database.js           # Player accounts, skills, levels, experience
    ├── session-database.js          # User session data
    ├── sports-database.js           # Sports teams, leagues, players, stadiums
    ├── treaty-database.js           # Non-aggression, mutual defense treaties
    ├── war-database.js              # War declarations, battles, damages, peace terms
    └── worldbank-database.js        # World bank: currency, interest rates, lottery
```

---

## Documentation Files

| Doc File | Covers |
|----------|--------|
| `core-overview.md` | All core files including `databases/` and `auth/` subfolders |
| `core-aid-system.md` | Aid system + aid database |
| `core-api-query.md` | API system + query system |
| `core-admin.md` | Admin system + admin init |
| `core-ai-nations.md` | AI nations system |
| `core-backup-sync.md` | Backup system + sync manager |
| `core-config-engine.md` | Config + game engine |
| `core-data-databases.md` | All data/database managers (top-level coordination files) |
| `core-database-schemas.md` | Individual database classes in `core/databases/` |
| `core-auth.md` | Authentication system in `core/auth/` |
| `core-events-errors-colors.md` | Event system + error system + colors |

---

## 1. Core Databases — `core/databases/`

**Purpose:** Each domain database class extends `BaseDatabase` and manages one type of game entity. All data persists to `saves/db/<domain>.json` via write-through (every insert/update/delete writes to disk immediately).

### Base Class — `base-database.js`

**Purpose:** The foundation for all 15 domain databases. Provides CRUD operations, indexed queries, permission filtering, change subscriptions, and atomic file persistence.

#### What It Does

| Feature | Description |
|---------|-------------|
| **CRUD operations** | `insert()`, `update()`, `delete()`, `findById()`, `findByIndex()`, `query()` |
| **Indexed fields** | Schema-declared indexed fields support fast lookups by value |
| **Permission filtering** | `applyPermissions()` filters records based on caller permissions (`admin`, `public`, domain-specific) |
| **Change subscriptions** | `subscribe()` lets other systems react to insert/update/delete events |
| **Validation** | Schema-driven validation: required fields, type checking, custom validators |
| **Query operators** | `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$regex` |
| **Atomic file persistence** | Writes to `.tmp` file then atomically replaces (Windows-safe) |
| **Stats** | `getStats()` returns record count, last modified, version, indexes |

#### Persistence Flow

```
insert/update/delete
    ↓
validateRecord() (schema check)
    ↓
update indexes
    ↓
notifyChange() → subscribers (e.g. sync manager)
    ↓
saveData() → atomic write to saves/db/<domain>.json
    ↓
loadData() on constructor → loads from disk on startup
```

---

### Domain Databases (15 files)

| Database File | Domain | What It Stores | Key Indexed Fields |
|--------------|--------|---------------|-------------------|
| `account-database.js` | `accounts` | Account data: email, password hash, auth provider, linked OAuth IDs | email, username |
| `aid-database.js` | `aid` | Aid transfers between nations (fromNationId, toNationId, amount, type, createdAt) | fromNationId, toNationId, createdAt, status |
| `alliance-database.js` | `alliances` | Alliance data: name, acronym, members, treasury, founded date | name, acronym, founderId |
| `analytics-database.js` | `analytics` | Analytics events, audit logs, performance metrics | eventType, timestamp, entityId |
| `award-database.js` | `awards` | Player awards and achievements: award type, earned date, criteria | playerId, awardType, earnedAt |
| `forum-database.js` | `forum` | Forum posts, topics, replies, categories | topicId, authorId, category |
| `global-database.js` | `global` | World state: game day, global happiness, crime, pollution, events | key |
| `message-database.js` | `messages` | In-game messages between players: sender, recipient, content, timestamp | senderId, recipientId, timestamp |
| `nation-database.js` | `nations` | Nation data: money, land, infra, tech, military units, wars, alliances, GDP, taxes | id, playerId, name, factionKey, population, gdp, founded, allianceId, lastActive, isActive |
| `player-database.js` | `players` | Player accounts: username, skills, levels, experience, nation links | username, email, nationId |
| `session-database.js` | `sessions` | User session data: token, expiry, user ID, IP, user agent | sessionId, userId, expiresAt |
| `sports-database.js` | `sports` | Sports teams, leagues, players, stadiums, match results | teamId, leagueId, stadiumId |
| `treaty-database.js` | `treaties` | Non-aggression, mutual defense treaties: participants, type, start/end dates | treatyType, participant1, participant2 |
| `war-database.js` | `wars` | War declarations, battles, damages, peace terms: attacker, defender, status | attackerId, defenderId, status, declaredAt |
| `worldbank-database.js` | `worldbank` | World bank: currency type, values, interest rates, loan rates, lottery balance | key |

#### Example: Nation Database Schema Highlights

The `nation-database.js` schema includes:
- **Identity:** id, playerId, name, leader, government, religion, factionKey, factionColor
- **Stats:** land, infra, tech, population, happiness, stability, reputation, gdp
- **Economy:** money, taxRate, taxableIncome, taxRevenue, debt, budget
- **Military:** militaryStrength, militaryUnits (soldiers, tanks, aircraft, ships, spies, missiles, nukes), wars, alliances
- **Research:** researchPoints, technologies, currentResearch, researchProgress
- **Map:** territories, cities
- **Diplomacy:** relations, treaties, tradeAgreements, allianceId, allianceRole
- **Government:** policies (economic, military, social, environmental, foreign), edicts
- **Stats:** nationStats (happiness, pollution, disease, crime, literacy, etc.)

Key query helpers: `findByAlliance()`, `findByPlayer()`, `getTopNations()`, `searchNations()`.

#### Example: Aid Database Schema

The `aid-database.js` schema includes:
- **Identity:** id, fromNationId, toNationId
- **Transfer:** amount, type (humanitarian/military/economic), createdAt, status (default: completed), version

Key query helpers: `findByFromNation()`, `findByToNation()`, `findByNation()`, `findRecentAid()`.

All aid fields are `public` permission — any external client can query aid history.

---

## 2. Authentication System — `core/auth/`

**Purpose:** Handles user authentication: local login/register, Google OAuth, Discord OAuth, JWT token management, Socket.IO authentication, and route protection.

### Files

| File | Responsibility |
|------|---------------|
| `passport-config.js` | Passport.js strategies: Local (username/password), Google OAuth, Discord OAuth; JWT generation/verification; password hashing |
| `auth-routes.js` | Express routes: POST /login, POST /register, GET/GET /google, GET/GET /discord, POST /verify, POST /logout, POST /link/*, GET /profile |
| `auth-middleware.js` | JWT verification middleware, Socket.IO auth, rate limiting, CORS config, session config, permission checks, audit logging |

### Authentication Flow

#### Local Login/Register

```
Client → POST /auth/login  (username + password)
    ↓
Passport LocalStrategy verifies credentials via bcrypt
    ↓
If valid → generate JWT (7-day expiry) → return { user, token }
    ↓
Client stores token, sends it in Authorization header for subsequent requests
```

#### OAuth (Google / Discord)

```
Client → GET /auth/google  or  GET /auth/discord
    ↓
Passport OAuthStrategy redirects to provider
    ↓
Provider redirects back to /auth/google/callback or /auth/discord/callback
    ↓
On success → generate JWT → redirect to CLIENT_URL/?token=<jwt>
    ↓
Client reads ?token= from URL, stores it, logs user in
```

#### Token Verification

```
Client → POST /auth/verify  (token in body)
    ↓
verifyJWT() decodes and validates signature
    ↓
Return fresh user data or 401
```

### Supported Auth Providers

| Provider | Strategy | Env Vars Required |
|----------|----------|-------------------|
| Local | `passport-local` + bcrypt | None (always available) |
| Google | `passport-google-oauth20` | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET |
| Discord | `passport-discord` | DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET |

OAuth strategies are **only registered if credentials are configured** — otherwise they're skipped with a console message.

### JWT Token

| Field | Description |
|-------|-------------|
| `id` | User ID |
| `username` | Username |
| `email` | Email address |
| `authProvider` | 'local', 'google', or 'discord' |
| `expiresIn` | 7 days |

### Middleware

| Middleware | Purpose |
|------------|---------|
| `verifyToken(req, res, next)` | Express middleware — extracts JWT from Authorization header, query param, or cookie; sets `req.user` |
| `optionalAuth(req, res, next)` | Same as verifyToken but doesn't fail if no token |
| `authenticateSocket(socket, next)` | Socket.IO middleware — verifies token from handshake, sets `socket.userId` |
| `requirePermission(permission)` | Route middleware — checks user has required permission (admin, etc.) |
| `auditLog(action)` | Route middleware — logs action, userId, IP, userAgent, path, method, timestamp |
| `createRateLimiter()` | Express rate limiter (default: 100 req / 15 min) |
| `configureCORS()` | CORS config with credentials and allowed headers |
| `getSessionConfig()` | Express session config (24-hour cookie, httpOnly, secure in production) |

### Rate Limits

| Endpoint | Window | Max Requests |
|----------|--------|-------------|
| Login | 15 min | 5 attempts |
| Register | 1 hour | 3 attempts |
| General API | 15 min | 100 requests |

---

## 3. Core Top-Level Files (Summary)

| File | Purpose |
|------|---------|
| `event-system.js` | Game "nerve center" — cross-system event bus for decoupled communication |
| `error-system.js` | Crash catching, user-friendly errors, retry logic, admin alerts, emergency save |
| `colors.js` | 10 faction colors (aqua, black, blue, green, lime, orange, pink, purple, red, yellow) for map/UI |
| `config.js` | Master settings: building/military costs (money only), XP sources, aid config, game events |
| `game-engine.js` | Main loop: startup, login, map/UI rendering, turn processing, aid button |
| `database-manager.js` | Manages all 15 domain databases, saveEntity/loadEntity/query/syncData |
| `data-persistence.js` | Write-through persistence: event listeners auto-save entities to disk |
| `data-manager.js` | Save slots, quicksaves, autosaves, import/export |
| `data-integration.js` | Connects database, API, backup, sync systems; processApiRequest; export/import |
| `persist-store.js` | Low-level file cabinet: one JSON per domain, debounced writes |
| `persistence-init.js` | Boot persistence on boot, flush on shutdown |
| `backup-system.js` | Full + incremental backups, localStorage + IndexedDB |
| `sync-manager.js` | Sync queue, conflict detection/resolution (timestamp/version/merge/manual) |
| `api-system.js` | Read-only API: rate limiting, caching, query routing, schema introspection |
| `query-system.js` | GraphQL-like query parser/executor with permission and alliance filtering |
| `admin-system.js` | Admin monitoring: bans, warnings, error logs, action logs, bug reports, analytics |
| `admin-init.js` | Boot admin system, super_admin auto-grant by email, keyboard shortcuts |
| `ai-nations.js` | AI nations: build, recruit, war, treaty, research, **send aid**, personality traits |
| `aid-system.js` | Central aid system: validation, cooldowns, limits, history, events |
| `aid-database.js` | (in databases/) Aid transfer records |

---

## 4. Key Architecture Principles

1. **Write-Through Persistence:** Every entity mutation emits an event → `wireAutoSave()` listeners save to `saves/db/<domain>.json` immediately. Nothing is lost on crash or refresh.
2. **No Manual Save:** Players no longer save themselves. Every action (aid, build, war, treaty) is auto-persisted.
3. **No Trades:** All trade/resource logic removed. Aid replaces trade for nation-to-nation transfers.
4. **Read-Only API:** External clients (Discord bots, websites) can only query data — no write/mutation access allowed.
5. **Browser-Safe:** All files use `typeof window`/`typeof localStorage` guards so they work in both browser and Node.js/server contexts.
6. **15 Domain Databases:** Each game entity type has its own JSON file under `saves/db/`, managed by a class extending `BaseDatabase`.
