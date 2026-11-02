# API & Query Systems — `core/api-system.js` & `core/query-system.js`

**Purpose:** Read-only API for external clients (Discord bots, websites). **No write/mutation access is allowed.** External clients can only query data if permissions allow.

---

## File Overview

| File | Responsibility |
|------|---------------|
| `api-system.js` | Main API request handler: rate limiting, caching, query routing, schema introspection |
| `query-system.js` | GraphQL-like query parser, executor, permission filtering, audit logging |

---

## 1. API System — `core/api-system.js`

**Purpose:** The entry point for all external API requests. Read-only only.

### What It Does

| Feature | Description |
|---------|-------------|
| **Read-only queries** | Routes `query` operations to the Query System |
| **Rate limiting** | Limits requests per API key to prevent abuse |
| **Response caching** | Caches successful query results for 30 seconds |
| **Schema introspection** | Returns database schemas for API discovery |
| **Audit logging** | Logs every API request for admin review |
| **Error handling** | Returns structured error responses |

### What It Does NOT Do

- ❌ **No mutations** — `sendAid`, `updateNation`, `createAlliance` mutations removed
- ❌ **No subscriptions** — WebSocket-based real-time updates removed
- ❌ **No write access** — External clients cannot modify game data
- ❌ **No bot automation** — No outside automated interaction allowed

### API Request Flow

```
External client sends request
    ↓
API System extracts API key from headers
    ↓
Rate limit check (per API key)
    ↓
If query → Query System executes with permission filtering
    ↓
Cache check (30-second TTL)
    ↓
Return structured response (success/error)
    ↓
Audit log entry written
```

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ...query results... },
  "meta": {
    "timestamp": 1730550000000,
    "cached": false
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Rate limit exceeded",
    "status": 429,
    "timestamp": 1730550000000
  }
}
```

---

## 2. Query System — `core/query-system.js`

**Purpose:** Parse GraphQL-like query strings, execute against domain databases, apply permission filtering, and log all queries.

### Query Syntax

```graphql
{ nation { id name ruler score militaryUnits { soldiers tanks } } where: { id: { $eq: "nation_123" } } limit: 25 offset: 0 }
```

### Supported Operations

| Operation | Syntax | Description |
|-----------|--------|-------------|
| Domain selection | `{ nation { fields } }` | Select a domain and its fields |
| Nested fields | `{ nation { militaryUnits { soldiers } } }` | Select nested object fields |
| Filters | `where: { field: { $gt: 10 } }` | Filter records by conditions |
| Pagination | `limit: 50 offset: 0` | Limit and offset results |

### Permission System

Every field in every domain has a required permission level:

| Permission Level | Who Can Access |
|-----------------|----------------|
| `public` | Anyone (including unauthenticated) |
| `game_data` | Players in an alliance |
| `military_data` | Players in an alliance |
| `econ` | Players in an alliance |
| `player_data` | Owner only, or API key with player_data permission |
| `none` | Never exposed |

### Field Permission Examples (`FIELD_PERMISSIONS`)

| Domain | Field | Permission |
|--------|-------|------------|
| `nations` | `id`, `name`, `ruler`, `score` | `public` |
| `nations` | `population`, `happiness`, `crime` | `game_data` (alliance-restricted) |
| `nations` | `playerId`, `lastLogin` | `player_data` (owner only) |
| `players` | `email`, `passwordHash` | `none` (never exposed) |
| `aid` | `id`, `fromNationId`, `toNationId`, `amount`, `type`, `createdAt`, `status` | `public` |
| `worldbank` | All fields | `public` |
| `accounts`, `sessions` | All fields | Blocked entirely (`BLOCKED_DOMAINS`) |

### Alliance-Restricted Fields

Some fields (population, happiness, crime, disease, pollution, literacyRate, currentHoldings) can only be viewed if:
- You are viewing your own nation, OR
- You are in the same alliance as the target, OR
- Your alliance protects the target's alliance, OR
- Your alliance is the parent (extension) of the target's alliance

### Key Methods

| Method | Description |
|--------|-------------|
| `QueryParser.parseFull(queryString)` | Parse a query string into domains, fields, filters, limit, offset |
| `executeQuery(queryString, context)` | Parse and execute a query with permission context |
| `getSchema()` | Get full schema with permissions for introspection |
| `getAuditLog(limit, offset, filters)` | Get query audit log (admin only) |

### Query Executor Flow

```
Parse query string → AST
    ↓
For each domain:
    ↓
Check domain not blocked (accounts, sessions blocked)
    ↓
Query database with fields, filters, permissions
    ↓
Filter each record's fields by permission level
    ↓
Apply alliance restrictions for sensitive fields
    ↓
Apply limit/offset pagination
    ↓
Log audit entry
    ↓
Return filtered results
```

---

## Example Queries

**Get nation info (public fields only):**
```graphql
{ nation { id name ruler score militaryUnits { soldiers tanks aircraft } } limit: 10 }
```

**Get aid history for a nation:**
```graphql
{ aid { id fromNationId toNationId amount type createdAt status } where: { fromNationId: { $eq: "nation_123" } } limit: 50 }
```

**Get world bank info:**
```graphql
{ worldbank { id currencyType currencyValues interestRates loanRates lotteryBalance } }
```

---

## Why Read-Only?

Per project requirements: **No bot needs to write to the game.** Outside automated interaction is not allowed. External tools (Discord bots, websites) can only read data for display purposes — they cannot send aid, declare war, or modify any game state.
