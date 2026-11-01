# AwardSystem Entity

The **Award System** (`AwardSystem`) is the achievement and award tracking engine for Dominion Wars. It tracks national and player accomplishments across all game mechanics — military, population, research, government, sports, forum activity, and diplomacy — and issues cosmetic awards (no gameplay bonuses) for bragging rights.

| Item | Value |
|------|-------|
| **Class:** | `AwardSystem` |
| **Global instance:** | `window.AwardSystem` |
| **Source file:** | `entities/AwardSystem.js` |
| **Loaded in:** | `index.html` (after all `assets/data/awards/*.js` data files, before `ui/live/game.js`) |
| **Depends on:** | `window.EventBus`, `window.AwardData_*` globals (populated by award data files) |
| **Save/Load:** | Yes — `serialize()` / `deserialize()` supported |
| **Does NOT handle:** | Leaderboards (handled by `server/rankings.js` and `ui/live/game.js` `leaderboardPage()`) |

---

## Architecture

The AwardSystem follows a **truth-source / data-driven** architecture:

1. **Award data files** (`assets/data/awards/*.js`) define every award as a config object with `id`, `name`, `description`, `category`, `icon`, `trackKey`, `threshold`, and `type`. Each file sets a `window.AwardData_<Category>` global array.
2. **`AwardSystem._defineAwards()`** iterates over all data sources and registers each award via `_define()` into an internal `Map`.
3. **Track keys** point to live data paths on `Nation` or `Player` objects (e.g. `statistics.warsWon`, `population`, `money`, `skills.attack.level`).
4. **`checkNationAwards()` / `checkPlayerAwards()`** evaluate every registered award against current nation/player state and grant any newly-qualified awards.
5. **Tier replacement:** When a higher tier in an increment set is unlocked, all lower tiers from the same `trackKey` are automatically removed so only the highest tier is held.

---

## Award Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  assets/data/awards/*.js  (AwardData_<Category> arrays)     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼ (window globals)
┌─────────────────────────────────────────────────────────────┐
│  AwardSystem._defineAwards() → this.awards (Map)            │
│      _buildTrackKeyTiers() → this._trackKeyTiers (Map)      │
└─────────────────────────────────────────────────────────────┘
                          │
   ┌──────────────────────┼──────────────────────┐
   ▼                      ▼                      ▼
checkNationAwards()  checkPlayerAwards()   _removeLowerTiers()
   │                      │                      │
   ▼                      ▼                      ▼
this.awardNation()   this.awardPlayer()   removes lower tiers
   │                      │                      │
   ▼                      ▼                      ▼
this.emit('award_unlocked')  →  EventBus → UI / notifications
```

---

## Award Categories (7)

| Category | Data File | Track Key Themes |
|----------|-----------|-----------------|
| **military-war** | `assets/data/awards/military-war.js` | Wars won/fought, missile/nuke launches, blocked missiles/nukes, military units (soldiers/tanks/aircraft/ships/spies/missiles/nukes stockpiled), exactly 300 soldiers, war/peace duration, espionage |
| **population-citizen** | `assets/data/awards/population-citizen.js` | Population count, immigration accepted, pollution days, crime days, disease days, happiness days |
| **research-tech** | `assets/data/awards/research-tech.js` | Research completion %, literacy rate, technologies purchased count |
| **nation-player** | `assets/data/awards/nation-player.js` | Government/religion changes, skill maxes (level 20), legendary prestige count, economy/money |
| **sports-tournament** | `assets/data/awards/sports-tournament.js` | World championships, season tournaments, games won, fans, players drafted, injuries |
| **forum-message** | `assets/data/awards/forum-message.js` | Forum posts, forum threads, world forum motions proposed/passed/voted, calendar reform |
| **diplomacy-ties** | `assets/data/awards/diplomacy-ties.js` | Treaties signed, alliances formed/duration, easter egg alliance, friend count/best friend duration |

---

## Award Config Fields

Each award definition contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique award identifier (e.g. `wars_won_100`) |
| `name` | string | Display name |
| `description` | string | Short description of what must be achieved |
| `category` | string | One of the 7 category keys |
| `icon` | string | Emoji used as the award icon theme |
| `trackKey` | string | Dot-separated path into Nation/Player state (e.g. `statistics.warsWon`, `militaryUnits.soldiers`, `money`, `skills.attack.level`) |
| `threshold` | number | Value that must be reached or exceeded |
| `type` | `'counter'` \| `'peak'` | `counter` = cumulative total ever reached; `peak` = current live value |

**Counter vs Peak:**
- `counter` awards track lifetime totals that only go up (e.g. `warsWon`, `missileLaunches`). Once unlocked, they stay unlocked.
- `peak` awards track current live values that can go up and down (e.g. `population`, `money`, `militaryUnits.soldiers`). If the value drops below the threshold, the award remains unlocked (awards are never removed for falling below peak), but the tier replacement system still applies when a higher tier is later unlocked.

---

## Increment Sets & Tier Replacement

Awards that share the same `trackKey` form an **increment set** — a ladder of tiers (e.g. `wars_won_1` → `wars_won_10` → `wars_won_25` → ... → `wars_won_1000` all track `statistics.warsWon`).

When a tier is unlocked:

1. The new award ID is added to the entity's award `Set`.
2. **`_removeLowerTiers()`** scans the same `trackKey` tier ladder and deletes all award IDs below the newly unlocked tier.
3. Only the **highest unlocked tier** per `trackKey` is ever held at once.

This means:
- A nation at `warsWon = 250` holds only `wars_won_250`, not `wars_won_1`, `wars_won_10`, `wars_won_25`, `wars_won_50`, `wars_won_75`, and `wars_won_100`.
- A nation at `money = $500M` holds only `multi_millionaire`, not `millionaire` or `cool_millionaire`.

Standalone awards (single award per `trackKey`, such as skill maxes at exactly level 20, or `easter_egg_alliance`) have no tiers and are never removed.

---

## Constructor & Initialization

```javascript
constructor()
```

1. Initializes empty Maps: `this.awards`, `this.nationAwards`, `this.playerAwards`, `this.categories`, `this._trackKeyTiers`.
2. Calls `_defineAwards()` — loads all award configs from `window.AwardData_*` globals.
3. Calls `_buildTrackKeyTiers()` — builds the `_trackKeyTiers` map grouping awards by `trackKey`, sorted by threshold ascending.
4. Calls `_defineCategories()` — initializes the 7 category entries and counts awards per category.
5. Sets `this.isInitialized = true` and logs initialization.

---

## Methods

### `checkNationAwards(nation)`

Evaluates every registered award against a nation's current state. Returns an array of newly awarded award configs.

**Logic:**
- Skips awards already held by the nation.
- Resolves `award.trackKey` on the nation object via `_getAwardValue()`.
- If `value >= award.threshold`, calls `_awardNation(nation.id, id)`.
- Automatically removes lower tiers from the same increment set.

**When to call:** At the end of every daily turn (`Nation.handleDayPassed()` calls `window.AwardSystem.checkNationAwards(this)`), and whenever a relevant statistic changes (e.g. war ends, missile launches, alliance formed, etc.).

### `checkPlayerAwards(player)`

Same as `checkNationAwards()` but for player-level awards (skill maxes, legendary prestige). Called from `Player.js` when a skill is upgraded or the player goes legendary.

**Returns:** Array of newly awarded award configs.

### `_awardNation(nationId, awardId)`

Adds `awardId` to the nation's award `Set`, removes lower tiers from the same trackKey, then emits `award_unlocked` via `EventBus`.

### `_awardPlayer(playerId, awardId)`

Same as `_awardNation` but for player award sets.

### `_removeLowerTiers(entityId, awardId, type)`

Internal. Given an entity ID and newly awarded award ID, looks up the `_trackKeyTiers` ladder for that award's `trackKey`, finds the awarded tier's index, and deletes all tier IDs below it from the entity's award `Set`.

### `_getAwardValue(nation, trackKey)`

Navigates a dot-separated path (e.g. `statistics.warsWon`, `militaryUnits.soldiers`) on a nation object. Returns `0` if any path segment is missing (with a console warning). Returns `Number(value) || 0`.

### `_getPlayerAwardValue(player, trackKey)`

Same as `_getAwardValue` but for player objects.

### `getAward(awardId)`

Returns the award config for a given ID, or `undefined`.

### `getAllAwards()`

Returns an array of all registered award configs.

### `getAwardsByCategory(category)`

Returns all award configs in a given category.

### `getNationAwards(nationId)`

Returns an array of award configs currently held by a nation.

### `getPlayerAwards(playerId)`

Returns an array of award configs currently held by a player.

### `hasAward(entityId, awardId, type)`

Returns `true` if the entity holds the award. `type` defaults to `'nation'`.

### `getAwardCount(entityId, type)`

Returns the number of awards currently held by an entity.

### `getCategories()`

Returns an array of category objects `{ name, icon, count }`.

### `emit(eventName, data)`

Sends an event to `window.EventBus`. If EventBus is unavailable, warns to console instead of silently dropping. Emits `'award_unlocked'` with `{ type, id, award, timestamp }`.

### `serialize()`

Serializes `nationAwards` and `playerAwards` Maps into plain objects for saving. Format:

```javascript
{
  nationAwards: { nationId: ["awardId1", "awardId2"], ... },
  playerAwards: { playerId: ["awardId1"], ... }
}
```

### `deserialize(data)`

Clears existing award maps, then restores them from serialized data. Used on game load.

---

## Statistics Wiring (where awards are tracked)

The AwardSystem reads from live statistics maintained by other systems. Here is where each statistic is incremented:

### Nation Statistics (`Nation.js`)

| Statistic | Where Incremented | Awards |
|-----------|------------------|--------|
| `statistics.warsWon` | `systems/War/war-system.js` — war completion | `wars_won_*` (9 tiers) |
| `statistics.warsFought` | `systems/War/war-system.js` — `declareWar()`, `joinWar()` | `wars_fought_*` (9 tiers) |
| `statistics.missileLaunches` | `systems/War/war-system.js` missile launch, `systems/Nation/projects-system.js` | `missile_launch_*` (9 tiers) |
| `statistics.nukeLaunches` | `systems/War/war-system.js` nuke launch, `systems/Nation/wonders-system.js` | `nuke_launch_*` (9 tiers) |
| `statistics.missilesBlocked` | `systems/War/war-system.js` — interception | `block_*` (8 tiers) |
| `statistics.exactly300SoldiersDays` | `Nation.js` — daily turn (exactly 300 soldiers) | `spartan_300` (standalone) |
| `militaryUnits.soldiers/tanks/aircraft/ships/spies/missiles/nukes` | Live military unit counts | Unit count awards (peak) |
| `statistics.warDays` / `statistics.peacefulDays` | `Nation.js` — daily turn | `war_*` / `peace_*` (5 tiers each) |
| `statistics.population` | Live population count | `baby_boom` → `ultimate_population` (9 tiers) |
| `statistics.immigrantsAccepted` | `systems/Population/population-system.js` — immigration events | `immigrant_*` (9 tiers) |
| `statistics.zeroPollutionDays` / `zeroCrimeDays` / `zeroDiseaseDays` / `perfectHappinessDays` | `Nation.js` — daily turn | Environmental awards (3-6 tiers each) |
| `statistics.literacyScore` | `Nation.js` — synced from `nationStats.literacy` | `scholar_*` / `literate_*` / `enlightened_*` / `wise_*` (4 tiers) |
| `statistics.researchCompleted` | Research system | `atomic_age` → `tech_singularity` (4 tiers) |
| `statistics.techPurchased` | Research system (tech purchases) | `tech_purchased_*` (11 tiers) |
| `statistics.governmentChanges` | `Nation.changeGovernment()` | `policy_*` (3 tiers) |
| `statistics.religionChanges` | `Nation.changeReligion()` | `faithful` → `religious_fanatic` (3 tiers) |
| `statistics.uniformPopulationDays` | `Nation.js` — daily turn | `divine_population` (standalone) |
| `money` | Live money balance | `millionaire` → `multi_trillionaire` (11 tiers) |
| `statistics.treatiesSigned` | `systems/War/diplomacy-system.js` — `acceptTreaty()` | `diplomat_*` (3 tiers) |
| `statistics.alliancesFormed` | `systems/War/alliance-system.js` — `createAlliance()` | `alliance_builder` (standalone) |
| `statistics.allianceDays` | `Nation.js` — daily turn | `alliance_*` (4 tiers) |
| `statistics.positiveRelationsCount` | `Nation.updateDiplomaticRelations()` | `world_citizen_*` (4 tiers) |
| `statistics.friendsCount` / `hasBestFriend` / `fiveFriendsDays` / `bestFriendDays` / `fiveFriendsBestFriendDays` | `Nation.js` — daily turn | Friendship awards |
| `statistics.easterEggAlliances` | `systems/War/alliance-system.js` — `createAlliance()` easter egg | `easter_egg_alliance` (standalone) |

### Player Statistics (`Player.js`)

| Statistic | Where Incremented | Awards |
|-----------|------------------|--------|
| `skills.<name>.level` | `Player.allocateSkillPoint()` | `skill_max_*` (12 standalone, level 20) |
| `totalLegendaryLevels` | `Player.goLegendary()` | `legendary_*` (6 tiers) |

---

## Events

| Event | Data | Description |
|-------|------|-------------|
| `award_unlocked` | `{ type: 'nation' \| 'player', id: <entityId>, award: <awardConfig>, timestamp: <number> }` | Fired whenever a new award is granted. Listen via `EventBus.on('award_unlocked', handler)`. |

---

## Example Usage

```javascript
// Check all nation awards after a daily turn
const newlyAwarded = window.AwardSystem.checkNationAwards(myNation);
newlyAwarded.forEach(award => {
    console.log(`${myNation.name} unlocked: ${award.name} — ${award.description}`);
});

// Check if a nation holds a specific award
if (window.AwardSystem.hasAward(myNation.id, 'wars_won_1000', 'nation')) {
    // Show World Conqueror badge
}

// Get all awards for display
const nationAwards = window.AwardSystem.getNationAwards(myNation.id);
// Only the highest tier per trackKey is present (tier replacement applied)
```

---

## Integration Points

| File | Integration |
|------|-------------|
| `index.html` | Loads all 7 `assets/data/awards/*.js` files before `entities/AwardSystem.js` so `window.AwardData_*` globals exist at construction time |
| `entities/Nation.js` | `handleDayPassed()` calls `checkNationAwards(this)` at end of daily turn; daily counters for war/peace/pollution/crime/disease/happiness/alliance/friendship stats |
| `entities/Player.js` | `allocateSkillPoint()` and `goLegendary()` call `checkPlayerAwards(this)` |
| `systems/War/war-system.js` | Increments `warsWon`, `warsFought`, `missileLaunches`, `nukeLaunches`, `missilesBlocked` |
| `systems/War/alliance-system.js` | Increments `alliancesFormed` and `easterEggAlliances` |
| `systems/War/diplomacy-system.js` | Increments `treatiesSigned` |
| `systems/Nation/wonders-system.js` | Increments `nukeLaunches` |
| `systems/Nation/projects-system.js` | Increments `missileLaunches` |
| `systems/Population/population-system.js` | Increments `immigrantsAccepted` |
| `systems/Sports/sports-system.js` | Increments `worldChampionshipsWon`, `seasonTournamentsWon`, `sportsGamesWon`, `totalSportsFans`, `playersDrafted`, `injuriesTotal` |
| `server/rankings.js` | Separate leaderboard system — does NOT interact with AwardSystem |
