# Query System Specification (Access Control + Audit)

**Status:** Planning / Design  
**Author:** Kilo (System Architect)  
**Date:** 2026-11-02  
**Project:** Empire.2 (Dominion Wars)  
**Scope:** Read-only query API for Discord bots and external clients with strict permission gating, nested field structure, and full audit logging

---

## 1. Executive Summary

Empire.2 needs a standardized, read-only query layer so external clients (Discord bots, dashboards, analytics tools) can ask questions about game data **without ever seeing data they aren't permitted to see**.

Key security guarantees:
- **Permission-gated fields**: Every field in every domain has a required permission level. Queries are filtered per-user per-field.
- **No account/login data**: Account credentials, session tokens, passwords, and private account metadata are **never queryable** by anyone — not even the account owner.
- **Cross-user privacy**: If a user cannot see a field for Nation A, they cannot see that same field for Nation B, C, or any other nation.
- **API keys for all nations**: Every nation receives an API key. Every query is attributed to that API key.
- **Audit trail**: Every query is logged: user, query type, target domain, target ID, timestamp, success/failure, and failure reason. **No data values are logged.**
- **Nested field structure**: Related entities are nested (e.g., `nations.militaryUnits`, `alliances.nations`, `treaties.nations`).

---

## 2. Design Principles

| Principle | Requirement |
|-----------|-------------|
| **Read-only** | Queries never mutate game state. Writes go through `World.transact()` / `PersistStore.set()`. |
| **Permission-gated** | Every field in every domain has a required permission level. Unauthorized fields are stripped server-side. |
| **Least privilege** | Users only see fields they are explicitly permitted to see. |
| **No account exposure** | Account/session data is never exposed via query API. |
| **API-key attribution** | Every query requires a valid API key. Every nation gets one by default. |
| **Audit trail** | Every query is logged: user, query type, target domain, target ID, timestamp, success/failure, failure reason. No data values logged. |
| **GraphQL-like syntax** | Clients request exactly the fields they need; server filters out unauthorized fields. |

---

## 3. Permission Model

### 3.1 Permission Levels

| Permission | Description | Grant Source |
|------------|-------------|--------------|
| `public` | Basic public info visible to everyone | All API keys |
| `game_data` | General nation/game data visible to alliance members | Alliance membership |
| `military_data` | Military unit details | `public` now (everyone can see MilitaryUnits) |
| `econ` | Economic data | `public` now (everyone can see Currency) |
| `player_data` | Player skills, legendary skills, level, experience | Player owner OR alliance government |
| `private_messages` | Message content, private channels | Alliance/player with message access |
| `analytics` | Analytics events, logging data | Admin or analytics role |
| `admin` | All data, all domains, audit log access | Server admin only |

### 3.2 Field-Level Permission Matrix

#### Nations Domain

| Field | Type | Required Permission | Nested Under | Public? |
|-------|------|--------------------|--------------|---------|
| `id` | string | `public` | top-level | Yes |
| `name` | string | `public` | top-level | Yes |
| `ruler` | string | `public` | top-level | Yes |
| `improvements` | object | `public` | top-level | Yes |
| `projects` | object | `public` | top-level | Yes |
| `wonders` | object | `public` | top-level | Yes |
| `population` | number | `game_data` (alliance) | top-level | No* |
| `happiness` | number | `game_data` (alliance) | top-level | No* |
| `crime` | number | `game_data` (alliance) | top-level | No* |
| `disease` | number | `game_data` (alliance) | top-level | No* |
| `pollution` | number | `game_data` (alliance) | top-level | No* |
| `literacyRate` | number | `game_data` (alliance) | top-level | No* |
| `infra` | number | `public` | top-level | Yes |
| `land` | number | `public` | top-level | Yes |
| `tech` | number | `public` | top-level | Yes |
| `territories` | array | `public` | top-level | Yes |
| `teams` | object | `public` | top-level | Yes |
| `treaties` | array | `public` | top-level | Yes |
| `friends` | array | `public` | top-level | Yes |
| `bestFriend` | string | `game_data` (alliance gov only) | top-level | No** |
| `foes` | array | `public` | top-level | Yes |
| `nemesis` | string | `game_data` (alliance gov only) | top-level | No** |
| `currency` | object | `public` | top-level | Yes |
| `currentHoldings` | object | `game_data` (alliance) | top-level | No* |
| `score` | number | `public` | top-level | Yes |
| `lastActive` | number | `public` | top-level | Yes |
| `militaryUnits` | object | `public` | nested | Yes |
| `militaryUnits.soldiers` | number | `public` | `militaryUnits` | Yes |
| `militaryUnits.tanks` | number | `public` | `militaryUnits` | Yes |
| `militaryUnits.aircraft` | number | `public` | `militaryUnits` | Yes |
| `militaryUnits.ships` | number | `public` | `militaryUnits` | Yes |
| `militaryUnits.spies` | number | `public` | `militaryUnits` | Yes |
| `militaryUnits.missiles` | number | `public` | `militaryUnits` | Yes |
| `militaryUnits.nukes` | number | `public` | `militaryUnits` | Yes |
| `playerId` | string | `player_data` | top-level | **No — never public** |
| `lastLogin` | number | `player_data` | top-level | **No — never public** |

*\* Alliance members only (must be in same alliance as target nation)*  
*\*\* Alliance government only (must be government in target nation's alliance)*

**Cross-user privacy rule:** If a user cannot see `population` for Nation A, they cannot see `population` for Nation B either. Alliance membership is required to view alliance-restricted fields for any nation.

#### Alliances Domain

| Field | Type | Required Permission | Nested Under | Public? |
|-------|------|--------------------|--------------|---------|
| `id` | string | `public` | top-level | Yes |
| `name` | string | `public` | top-level | Yes |
| `acronym` | string | `public` | top-level | Yes |
| `description` | string | `public` | top-level | Yes |
| `memberCount` | number | `public` | top-level | Yes |
| `governmentType` | string | `public` | top-level | Yes |
| `diplomaticStance` | string | `public` | top-level | Yes |
| `nations` | array | `public` | nested | Yes |
| `nations[].id` | string | `public` | `nations` | Yes |
| `nations[].name` | string | `public` | `nations` | Yes |
| `nations[].ruler` | string | `public` | `nations` | Yes |
| `nations[].improvements` | object | `public` | `nations` | Yes |
| `nations[].projects` | object | `public` | `nations` | Yes |
| `nations[].wonders` | object | `public` | `nations` | Yes |
| `nations[].population` | number | `game_data` (alliance) | `nations` | No* |
| `nations[].happiness` | number | `game_data` (alliance) | `nations` | No* |
| `nations[].crime` | number | `game_data` (alliance) | `nations` | No* |
| `nations[].disease` | number | `game_data` (alliance) | `nations` | No* |
| `nations[].pollution` | number | `game_data` (alliance) | `nations` | No* |
| `nations[].literacyRate` | number | `game_data` (alliance) | `nations` | No* |
| `nations[].infra` | number | `public` | `nations` | Yes |
| `nations[].land` | number | `public` | `nations` | Yes |
| `nations[].tech` | number | `public` | `nations` | Yes |
| `nations[].territories` | array | `public` | `nations` | Yes |
| `nations[].teams` | object | `public` | `nations` | Yes |
| `nations[].treaties` | array | `public` | `nations` | Yes |
| `nations[].friends` | array | `public` | `nations` | Yes |
| `nations[].bestFriend` | string | `game_data` (alliance gov only) | `nations` | No** |
| `nations[].foes` | array | `public` | `nations` | Yes |
| `nations[].nemesis` | string | `game_data` (alliance gov only) | `nations` | No** |
| `nations[].currency` | object | `public` | `nations` | Yes |
| `nations[].currentHoldings` | object | `game_data` (alliance) | `nations` | No* |
| `nations[].score` | number | `public` | `nations` | Yes |
| `nations[].lastActive` | number | `public` | `nations` | Yes |
| `nations[].militaryUnits` | object | `public` | `nations` | Yes |
| `treasury` | number | **Never public** | top-level | **No** |

*\* Alliance members only*  
*\*\* Alliance government only*  
**Treasury and all money/population fields are never publicly visible.**

#### Treaties Domain

| Field | Type | Required Permission | Nested Under | Public? |
|-------|------|--------------------|--------------|---------|
| `id` | string | `public` | top-level | Yes |
| `type` | string | `public` | top-level | Yes |
| `partyA` | string | `public` | top-level | Yes |
| `partyB` | string | `public` | top-level | Yes |
| `status` | string | `public` | top-level | Yes |
| `createdAt` | number | `public` | top-level | Yes |
| `acceptedAt` | number | `public` | top-level | Yes |
| `endsAt` | number | `public` | top-level | Yes |
| `terms` | object | `public` | top-level | Yes |
| `createdBy` | string | `public` | top-level | Yes |
| `parties` | object | `public` | nested | Yes |
| `parties.partyA` | object | `public` | `parties` | Yes |
| `parties.partyA.nationId` | string | `public` | `parties.partyA` | Yes |
| `parties.partyA.nationName` | string | `public` | `parties.partyA` | Yes |
| `parties.partyB` | object | `public` | `parties` | Yes |
| `parties.partyB.nationId` | string | `public` | `parties.partyB` | Yes |
| `parties.partyB.nationName` | string | `public` | `parties.partyB` | Yes |

**All treaty fields are publicly visible.**

#### Wars Domain

| Field | Type | Required Permission | Nested Under | Public? |
|-------|------|--------------------|--------------|---------|
| `id` | string | `public` | top-level | Yes |
| `type` | string | `public` | top-level | Yes |
| `status` | string | `public` | top-level | Yes |
| `reason` | string | `public` | top-level | Yes |
| `declared` | number | `public` | top-level | Yes |
| `turns` | number | `public` | top-level | Yes |
| `sideA` | object | `public` | nested | Yes |
| `sideA.nations` | array | `public` | `sideA` | Yes |
| `sideA.nations[].id` | string | `public` | `sideA.nations` | Yes |
| `sideA.nations[].name` | string | `public` | `sideA.nations` | Yes |
| `sideA.damages` | object | `public` | `sideA` | Yes |
| `sideA.losses` | object | `public` | `sideA` | Yes |
| `sideB` | object | `public` | nested | Yes |
| `sideB.nations` | array | `public` | `sideB` | Yes |
| `sideB.nations[].id` | string | `public` | `sideB.nations` | Yes |
| `sideB.nations[].name` | string | `public` | `sideB.nations` | Yes |
| `sideB.damages` | object | `public` | `sideB` | Yes |
| `sideB.losses` | object | `public` | `sideB` | Yes |
| `peaceTerms` | object | `public` | top-level | Yes |
| `endedAt` | number | `public` | top-level | Yes |

**All war fields are publicly visible.**

#### Sports Domain

| Field | Type | Required Permission | Nested Under | Public? |
|-------|------|--------------------|--------------|---------|
| `id` | string | `public` | top-level | Yes |
| `teamName` | string | `public` | top-level | Yes |
| `sport` | string | `public` | top-level | Yes |
| `nationId` | string | `public` | top-level | Yes |
| `leagueId` | string | `public` | top-level | Yes |
| `stadium` | object | `public` | top-level | Yes |
| `stadium.seating` | number | `public` | `stadium` | Yes |
| `stadium.gym` | number | `public` | `stadium` | Yes |
| `stadium.medicalCenter` | number | `public` | `stadium` | Yes |
| `stadium.youthAcademy` | number | `public` | `stadium` | Yes |
| `stadium.fanExperience` | number | `public` | `stadium` | Yes |
| `stadium.concessions` | number | `public` | `stadium` | Yes |
| `stadium.technologyCenter` | number | `public` | `stadium` | Yes |
| `players` | object | `public` | top-level | Yes |
| `roster` | object | `public` | top-level | Yes |
| `subs` | object | `public` | top-level | Yes |
| `revenue` | number | `public` | top-level | Yes |
| `expenses` | number | `public` | `top-level` | Yes |
| `fans` | number | `public` | top-level | Yes |
| `fanLoyalty` | number | `public` | top-level | Yes |
| `stats` | object | `public` | top-level | Yes |
| `injuries` | object | `public` | top-level | Yes |
| `nation` | object | `public` | nested | Yes |
| `nation.id` | string | `public` | `nation` | Yes |
| `nation.name` | string | `public` | `nation` | Yes |

**All sports fields are publicly visible.**

#### Players Domain

| Field | Type | Required Permission | Nested Under | Public? |
|-------|------|--------------------|--------------|---------|
| `id` | string | `player_data` | top-level | **No — owner or alliance gov only** |
| `username` | string | `player_data` | top-level | **No — owner or alliance gov only** |
| `level` | number | `player_data` | top-level | Owner: Yes / Alliance Gov: Yes |
| `experience` | number | `player_data` | top-level | Owner: Yes / Alliance Gov: Yes |
| `legendaryLevel` | number | `player_data` | top-level | Owner: Yes / Alliance Gov: Yes |
| `totalLegendaryLevels` | number | `player_data` | top-level | Owner: Yes / Alliance Gov: Yes |
| `skills` | object | `player_data` | top-level | Owner: Yes / Alliance Gov: Yes |
| `skills.*` | number | `player_data` | `skills` | Owner: Yes / Alliance Gov: Yes |
| `legendarySkills` | object | `player_data` | top-level | Owner: Yes / Alliance Gov: Yes |
| `factionKey` | string | `player_data` | top-level | Owner: Yes / Alliance Gov: Yes |
| `factionColor` | string | `player_data` | top-level | Owner only |
| `factionRank` | string | `player_data` | top-level | Owner only |
| `unallocatedSkillPoints` | number | `player_data` | top-level | Owner only |
| `unallocatedLegendarySkillPoints` | number | `player_data` | top-level | Owner only |
| `achievements` | array | `player_data` | top-level | Owner only |
| `titles` | array | `player_data` | top-level | Owner only |
| `currentTitle` | string | `player_data` | top-level | Owner only |
| `settings` | object | `player_data` | top-level | Owner only |
| `activeEffects` | object | `player_data` | top-level | Owner only |
| `email` | string | **Never public** | top-level | **No** |
| `passwordHash` | string | **Never public** | top-level | **No** |

**Rule:** Player data is queryable by:
1. The player themselves (via their own API key) — all player fields except email/passwordHash
2. Alliance government members — only: `level`, `experience`, `legendaryLevel`, `totalLegendaryLevels`, `skills`, `skills.*`, `legendarySkills`, `factionKey`
3. Everyone else — nothing

#### World Domain

| Field | Type | Required Permission | Nested Under | Public? |
|-------|------|--------------------|--------------|---------|
| `id` | string | `public` | top-level | Yes |
| `gameDay` | number | `public` | top-level | Yes |
| `globalHappiness` | number | `public` | top-level | Yes |
| `globalCrime` | number | `public` | top-level | Yes |
| `globalDisease` | number | `public` | top-level | Yes |
| `globalPollution` | number | `public` | top-level | Yes |
| `globalLiteracyRate` | number | `public` | top-level | Yes |
| `globalDiseaseSpawns` | number | `public` | top-level | Yes |
| `globalDiseaseTypes` | array | `public` | top-level | Yes |
| `totalNations` | number | `public` | top-level | Yes |
| `nationsAtWar` | number | `public` | top-level | Yes |
| `nationsAtPeace` | number | `public` | top-level | Yes |

**All world fields are publicly visible.**

#### World Bank Domain

| Field | Type | Required Permission | Nested Under | Public? |
|-------|------|--------------------|--------------|---------|
| `id` | string | `public` | top-level | Yes |
| `currencyType` | string | `public` | top-level | Yes |
| `currencyValues` | object | `public` | top-level | Yes |
| `usersOnCurrency` | number | `public` | top-level | Yes |
| `interestRates` | object | `public` | top-level | Yes |
| `loanRates` | object | `public` | top-level | Yes |
| `lotteryBalance` | number | `public` | top-level | Yes |
| `lotteryWinners` | object | `public` | top-level | Yes |
| `lotteryWinners.tier1` | number | `public` | `lotteryWinners` | Yes |
| `lotteryWinners.tier2` | number | `public` | `lotteryWinners` | Yes |
| `lotteryWinners.tier3` | number | `public` | `lotteryWinners` | Yes |
| `lastLotteryDraw` | number | `public` | top-level | Yes |

**All world bank fields are publicly visible.**

#### Accounts Domain — NEVER Queryable

| Field | Required Permission | Queryable? |
|-------|--------------------|------------|
| All fields | `admin` | **No** — accounts domain is excluded from query API entirely |

#### Sessions Domain — NEVER Queryable

| Field | Required Permission | Queryable? |
|-------|--------------------|------------|
| All fields | `admin` | **No** — sessions domain is excluded from query API entirely |

---

## 4. Nested Field Structure

The query system supports nested field selection. When a user requests a parent field, they can also request sub-fields:

```
# Query nations with nested military units (everyone can see)
{ nations { name score infra land tech militaryUnits { soldiers tanks aircraft ships spies missiles nukes } } }

# Query alliances with nested nations (nations show only permitted fields)
{ alliances { name acronym memberCount nations { name score infra land militaryUnits { soldiers } } } }

# Query wars with nested side A and B nations (everyone can see)
{ wars { id status sideA { nations { name } damages } sideB { nations { name } damages } } }

# Query sports teams with nested nation (everyone can see)
{ sports { teamName sport fans nation { name score } } }

# Query world bank (everyone can see)
{ worldBank { currencyType currencyValues lotteryBalance lotteryWinners { tier1 tier2 tier3 } } }

# Query player data (owner or alliance gov only)
{ players { id username level experience legendaryLevel skills factionKey } where: { id: "player_uuid" } }
```

**Permission filtering applies at every nesting level.** If a user requests `nations { population currentHoldings }` but is not in the same alliance as the target nation, those fields are stripped from every nation record while `score`, `infra`, `land`, `tech`, etc. remain.

**Cross-user privacy applies at every nesting level.** A user querying alliances cannot see `nations[].population` for any nation in that alliance unless they are a member of that alliance.

**Alliance relationships expand query permissions:**
- **Protection**: If Alliance B protects Alliance A, then Alliance B's members (and government) have the same query alliance permissions as Alliance A's members — they can see Alliance A's fields and all nested nation fields within Alliance A, including alliance-restricted fields like population, happiness, crime, disease, pollution, literacyRate, currentHoldings, bestFriend, and nemesis.
- **Extension**: If Alliance A is an extension of Alliance B, then Alliance B's government members get alliance government query permissions over Alliance A — they can see all of Alliance A's fields including bestFriend and nemesis on nested nations, and player_data fields (level, experience, legendaryLevel, totalLegendaryLevels, skills, skills.*, legendarySkills, factionKey) for players in Alliance A's nations.

---

## 5. Query Syntax

### 5.1 Basic Format

```
{ <domain> <fields> where: { <filter> } limit: <N> offset: <N> }
```

### 5.2 Filter Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `eq` / value | Equals | `{ status: "active" }` or `{ status: { $eq: "active" } }` |
| `$ne` | Not equals | `{ status: { $ne: "ended" } }` |
| `$gt` | Greater than | `{ population: { $gt: 1000 } }` |
| `$gte` | Greater than or equal | `{ level: { $gte: 50 } }` |
| `$lt` | Less than | `{ happiness: { $lt: 30 } }` |
| `$lte` | Less than or equal | `{ memberCount: { $lte: 5 } }` |
| `$in` | In list | `{ id: { $in: ["uuid-1", "uuid-2"] } }` |
| `$nin` | Not in list | `{ id: { $nin: ["uuid-1"] } }` |
| `$regex` | Partial string match (case-insensitive) | `{ name: { $regex: "empire" } }` |

### 5.3 Examples

```graphql
# Get a nation's public fields (everyone can see score, currency, infra, land, tech, etc.)
{ nations { id name ruler score currency infra land tech territories teams improvements projects wonders militaryUnits { soldiers tanks aircraft ships spies missiles nukes } lastActive friends foes } where: { id: "nation_uuid" } }

# Get alliance info with nested nations (nations show permitted fields only)
{ alliances { id name acronym description memberCount governmentType diplomaticStance nations { id name ruler score infra land tech } } where: { id: "alliance_uuid" } }

# Get treaties (all fields public)
{ treaties { id type partyA partyB status createdAt acceptedAt endsAt terms createdBy } }

# Get wars (all fields public)
{ wars { id type status reason declared turns sideA { nations { name } damages losses } sideB { nations { name } damages losses } peaceTerms endedAt } }

# Get sports teams (all fields public)
{ sports { id teamName sport nationId stadium players roster subs revenue expenses fans fanLoyalty stats injuries nation { id name score } } }

# Get world stats (all public)
{ world { gameDay globalHappiness globalCrime globalDisease globalPollution globalLiteracyRate totalNations nationsAtWar nationsAtPeace } }

# Get world bank (all public)
{ worldBank { id currencyType currencyValues usersOnCurrency interestRates loanRates lotteryBalance lotteryWinners { tier1 tier2 tier3 } lastLotteryDraw } }
```

---

## 6. API Endpoints

### 6.1 `POST /api/query` — Execute a Query

**Request Body:**
```json
{
  "query": "{ nations { name score infra land tech militaryUnits { soldiers tanks } } where: { score: { $gt: 1000 } } limit: 25 }",
  "apiKey": "ew_abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nations": [
      {
        "name": "Empire of Dawn",
        "score": 5000000,
        "infra": 450,
        "land": 1200,
        "tech": 12,
        "militaryUnits": {
          "soldiers": 2500,
          "tanks": 12
        }
      }
    ]
  },
  "metadata": {
    "returned": 1,
    "totalMatching": 42,
    "limit": 25,
    "offset": 0,
    "executionTimeMs": 12,
    "timestamp": 1733123456789
  }
}
```

**Permission filtering:** If the API key's nation is not in the same alliance as the target nation, `population`, `happiness`, `crime`, `disease`, `pollution`, `literacyRate`, `currentHoldings` are stripped. `bestFriend` and `nemesis` are stripped unless the API key's nation is alliance government.

### 6.2 `GET /api/query/schema` — Get Available Domains and Fields

Returns the full schema with all domains, their fields, types, required permissions, and nesting structure. Fields the caller's API key doesn't have permission for are marked `"restricted": true`.

### 6.3 `GET /api/query/audit` — Query Audit Log (Admin Only)

**Requires:** `admin` permission

**Query Parameters:**
- `limit` — max entries (default 50)
- `offset` — pagination offset
- `apiKey` — filter by specific API key
- `domain` — filter by domain
- `success` — filter by `true`/`false`
- `startDate` / `endDate` — date range

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "audit_123",
      "timestamp": 1733123456789,
      "apiKeyPrefix": "ew_abc1...",
      "nationId": "nation_uuid",
      "domain": "nations",
      "queryType": "read",
      "targetId": "nation_target_uuid",
      "success": true,
      "failureReason": null
    },
    {
      "id": "audit_124",
      "timestamp": 1733123457000,
      "apiKeyPrefix": "ew_def4...",
      "nationId": "nation_uuid_2",
      "domain": "nations",
      "queryType": "read",
      "targetId": null,
      "success": false,
      "failureReason": "insufficient_permission: alliance_required_for_population"
    }
  ],
  "metadata": {
    "returned": 2,
    "total": 150,
    "limit": 10,
    "offset": 0
  }
}
```

**What is NOT logged:** query string, field names, filter values, data values returned.

---

## 7. API Key Model

### 7.1 Every Nation Gets an API Key

On nation creation, the system automatically generates an API key:

```
apiKey format: ew_<32 random chars>
```

- Tied to exactly one nation ID
- Granted `public` by default (alliance membership is checked at query time, not stored on the key)
- Can be upgraded by server admins
- Displayed to the nation owner in-game (once, at creation)
- Revocable by server admins

### 7.2 API Key Storage

Stored in the accounts system (not publicly queryable). Only the key prefix (`ew_abc1...`) is ever shown in audit logs.

---

## 8. Query Execution Flow

```
1. Receive HTTP request with query string + apiKey
2. Validate apiKey exists and is active → resolve nation ID + alliance membership + alliance role
3. Parse query string into AST (domain, fields, filters, limit, offset, nesting)
4. For each domain in query:
   a. Check domain is queryable (accounts/sessions = BLOCKED)
   b. Load domain records from PersistStore
   c. Apply where filters
   d. FOR EACH RECORD:
      - Check cross-user privacy: can this API key's nation see this target's data?
      - If alliance-based field: check alliance membership + role permissions
      - Strip unauthorized fields from every nesting level
   e. Apply limit/offset
5. Log audit entry: {apiKeyPrefix, nationId, domain, queryType, targetId, success, failureReason, timestamp}
6. Assemble response JSON (only permitted fields)
7. Return with execution metadata
```

### 8.1 Cross-User Privacy Enforcement

An API key belonging to Nation X can query alliance-restricted fields for Nation Y only if:
- Nation X == Nation Y (own data), OR
- Nation X and Nation Y are in the same alliance, OR
- Nation X's alliance protects Nation Y's alliance (protection relationship), OR
- Nation X's alliance is the extension parent of Nation Y's alliance (extension relationship).

For `bestFriend` and `nemesis`, Nation X must also be alliance government in that alliance, OR Nation X's alliance must be the extension parent of Nation Y's alliance.

If Nation X cannot see Nation Y's `population`, Nation X also cannot see Nation Z's `population` — even if requested.

**Alliance relationship expansion:**
- **Protection**: If Alliance B protects Alliance A, Alliance B's members can query all alliance-restricted fields for Alliance A and all nested nations within Alliance A (population, happiness, crime, disease, pollution, literacyRate, currentHoldings). Alliance B's government can also query `bestFriend` and `nemesis` on nested nations.
- **Extension**: If Alliance A is an extension of Alliance B, Alliance B's government members get alliance government query permissions over Alliance A — including `bestFriend` and `nemesis` on nested nations, and player_data fields (level, experience, legendaryLevel, totalLegendaryLevels, skills, skills.*, legendarySkills, factionKey) for players in Alliance A's nations.

---

## 9. Implementation Plan

### Phase 1 — Permission Schema & Field Mapping
- Define field-level permission matrix for all domains (as specified above)
- Mark `accounts` and `sessions` as non-queryable
- Build permission checker that strips unauthorized fields from records at every nesting level
- Implement alliance membership + role checks for alliance-restricted fields
- Implement alliance relationship checks: protection (protecting alliance gets member-level access) and extension (parent alliance gets government-level access)

### Phase 2 — API Key Issuance
- Auto-generate API key on nation creation
- Store API key → nation ID mapping
- Default permissions: `public` (alliance membership checked at query time)

### Phase 3 — Query Engine with Permission Filtering
- Parse GraphQL-like query syntax with nesting support
- Execute query against domain databases
- Apply cross-user privacy rules
- Strip unauthorized fields per-record at every level

### Phase 4 — Audit Logging
- Log every query to audit domain
- Build `/api/query/audit` endpoint (admin only)
- Ensure no data values are ever logged

---

## 10. Related Documents

- `docs/DEV/save-system-specification.md` — Unified persistence layer (data source for queries)
- `core/database-manager.js` — Database manager with API key storage
- `core/data-persistence.js` — Entity save/load wrappers
- `server/world.js` — Server world state (accounts, sessions — never queryable)
