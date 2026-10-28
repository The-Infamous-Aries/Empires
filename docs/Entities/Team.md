# Team Entity

Represents a sports team owned by a nation. Teams start empty (no auto roster), use nation funds directly, and start with 0 fans. Users manage starters/subs, draft players, train them, level up stadium facilities, and compete in leagues and tournaments.

## Overview

- **Class:** `Team`
- **Globally available as:** `window.Team`
- **Constructor:** `new Team(data)` — `data` is a plain object with `id`, `nationId`, `sport`, `name`, and optional `founded`
- **Sports:** `'basketball'`, `'hockey'`, `'soccer'`, `'football'`
- **Ownership:** One team per nation per sport (`teams` Map in SportsSystem is `nationId -> { sport -> Team }`)
- **Budget model:** No separate team budget — `nation.money` is used directly for salaries, upgrades, and contracts. `revenue` and `expenses` are tracked for display/calculation only.

## File Location

`entities/Team.js`

## Architecture

```
Team Entity (entities/Team.js)
        ↑
SportsSystem (systems/sports-system.js) — creates teams, owns the teams Map, manages leagues/drafts
        ↑
TeamPlayerSystem (systems/team-player-system.js) — manages players, contracts, training, injuries, trades
        ↑
DraftSystem (systems/draft-system.js) — draft board, player generation, regen of retired players
```

## Constructor Parameters

The `data` object is passed directly to `new Team(data)`:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | string | Yes | — | Unique team ID |
| `nationId` | string | Yes | — | ID of the owning nation |
| `sport` | string | Yes | — | `'basketball'`, `'hockey'`, `'soccer'`, or `'football'` |
| `name` | string | Yes | — | Display name of the team |
| `founded` | number | No | `Date.now()` | Timestamp when the team was created |

## Instance Properties

### Identity & Ownership

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique team ID |
| `nationId` | string | Owning nation ID |
| `sport` | string | Sport type: `'basketball'`, `'hockey'`, `'soccer'`, `'football'` |
| `name` | string | Team display name |
| `founded` | number | Creation timestamp |
| `leagueId` | string\|null | League ID the team belongs to (null if not in a league) |

### Stadium Upgrades (levels 0-10)

| Property | Type | Default | Effect |
|----------|------|---------|--------|
| `stadium.seating` | number | `0` | Adds seating capacity (×5000 per level) |
| `stadium.gym` | number | `0` | +player skill gain from games and wins |
| `stadium.medicalCenter` | number | `0` | -injury chance and length |
| `stadium.youthAcademy` | number | `0` | +skills of new draftable players |
| `stadium.fanExperience` | number | `0` | +fans from each game played and wins |
| `stadium.concessions` | number | `0` | +revenue from tickets + % of fans per game |
| `stadium.technologyCenter` | number | `0` | +fans, +XP/games, +draft skills, -injury |

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `stadiumCapacity` | number | `0` | Computed from seating level (`seating × 5000`) |

### Bonus Properties (computed from stadium upgrades)

| Property | Type | Default | Effect |
|----------|------|---------|--------|
| `gymBonus` | number | `0` | `stadium.gym × 0.1` |
| `medicalBonus` | number | `0` | `stadium.medicalCenter × 0.1` |
| `youthAcademyBonus` | number | `0` | `stadium.youthAcademy × 1` |
| `fanExperienceBonus` | number | `0` | `stadium.fanExperience × 0.1` |
| `concessionsBonus` | number | `0` | `stadium.concessions × 0.1` |
| `technologyBonus` | number | `0` | `stadium.technologyCenter × 0.05` |

### Roster Management

| Property | Type | Description |
|----------|------|-------------|
| `players` | `Map<playerId, player>` | All players on the team |
| `roster` | `Map<position, playerId>` | Starting lineup (one player per position) |
| `subs` | `Map<position, [playerId, ...]>` | Substitute players per position |

### Finances

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `revenue` | number | `0` | Tracked for display/revenue calculations |
| `expenses` | number | `0` | Tracked for display/revenue calculations |

### Performance Stats

**Universal (all sports):**

| Stat | Type | Default | Description |
|------|------|---------|-------------|
| `stats.wins` | number | `0` | Total wins |
| `stats.losses` | number | `0` | Total losses |
| `stats.draws` | number | `0` | Total draws |
| `stats.totalInjuries` | number | `0` | Total injuries suffered across all matches |
| `stats.championships` | number | `0` | League championships won |
| `stats.playoffAppearances` | number | `0` | Times qualified for championship tournament |
| `stats.tournamentsEntered` | number | `0` | Championship tournaments entered |
| `stats.tournamentsWon` | number | `0` | Championship tournaments won |
| `stats.worldTournamentsEntered` | number | `0` | World Championship tournaments entered |
| `stats.worldTournamentsWon` | number | `0` | World Championship tournaments won |

**Football:**

| Stat | Type | Default | Description |
|------|------|---------|-------------|
| `stats.interceptions` | number | `0` | Total interceptions |
| `stats.passes` | number | `0` | Total pass completions |
| `stats.touchdowns` | number | `0` | Total touchdowns |
| `stats.conversions2pt` | number | `0` | Total 2-point conversions |
| `stats.extraPoints` | number | `0` | Total extra point kicks |
| `stats.fieldGoals` | number | `0` | Total field goals |

**Hockey:**

| Stat | Type | Default | Description |
|------|------|---------|-------------|
| `stats.fights` | number | `0` | Total fights |
| `stats.hockeyPoints` | number | `0` | Total goals scored |
| `stats.hockeyShots` | number | `0` | Total shots |
| `stats.hockeyBlocks` | number | `0` | Total blocks |

**Soccer:**

| Stat | Type | Default | Description |
|------|------|---------|-------------|
| `stats.soccerPoints` | number | `0` | Total goals scored |
| `stats.soccerSteals` | number | `0` | Total steals |

**Basketball:**

| Stat | Type | Default | Description |
|------|------|---------|-------------|
| `stats.basketballSteals` | number | `0` | Total steals |
| `stats.rebounds` | number | `0` | Total rebounds |
| `stats.basketballPoints` | number | `0` | Total points scored |
| `stats.basketballShots` | number | `0` | Total shot attempts |
| `stats.basketballBlocks` | number | `0` | Total blocks |

### Fans

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `fans` | number | `0` | Current fan count |
| `fanLoyalty` | number | `50` | Fan loyalty (0–100) |

### Season Tracking

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `currentSeason` | number | `1` | Current season number |
| `currentWeek` | number | `1` | Current week within season |
| `leagueId` | string\|null | `null` | League the team belongs to |
| `injuries` | `Map<playerId, {type, daysLeft}>` | empty | Active player injuries |

### Contract Tracking

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `contractExpiryWarnings` | array | `[]` | Players whose contracts expire at end of current season |

## Methods

### `getPlayer(playerId)` → `player\|null`

Returns the player object for the given `playerId` if on this team, otherwise `null`.

### `hasStarter(position)` → `boolean`

Returns `true` if the starting slot for `position` is filled.

### `getStarter(position)` → `playerId\|null`

Returns the `playerId` assigned as starter for `position`, or `null`.

### `getSubs(position)` → `playerId[]`

Returns the array of substitute `playerId`s for `position` (empty array if none).

## Getters

### `rosterSize` → `number`

Returns total roster size (starters + all substitutes).

### `injuredCount` → `number`

Returns the number of players currently injured (size of `this.injuries` Map).

### `winRate` → `number`

Returns win percentage (0–100). Returns `0` if no games played.

### `coachRating` → `number`

Returns a coach rating (0–100) calculated as:

- **Win component:** `(wins / (wins + losses)) × 60` (max 60)
- **Tournament component:** `min((tournamentsWon + worldTournamentsWon) × 10, 40)` (max 40)

Returns `0` if no games played.

## Nation-Level Sport Stats (Coach Rating)

`SportsSystem` maintains `this.nationSportStats` — a `Map<nationId, stats>` where each entry contains per-sport and overall win/loss/tournament records:

| Level | Stats Tracked |
|-------|--------------|
| Per sport (`basketball`, `hockey`, `soccer`, `football`) | `wins`, `losses`, `tournamentsWon`, `worldTournamentsWon` |
| `overall` | Aggregated across all sports |

### Methods

| Method | Description |
|--------|-------------|
| `getNationSportStats(nationId, sport?)` | Returns per-sport stats, or `overall` if no sport specified |
| `getNationCoachRating(nationId, sport)` | Coach rating (0–100) for a nation in a given sport |
| `getNationOverallCoachRating(nationId)` | Overall coach rating across all sports |

Coach rating formula: `round(winComponent + tournamentComponent)` where win component is 60% of win rate and tournament component is capped at 40.

## Integration Points

| System | Integration Point |
|--------|------------------|
| `SportsSystem` (`systems/sports-system.js`) | Creates teams via `createTeam()`, owns `teams` Map, manages leagues/drafts/seasons |
| `TeamPlayerSystem` (`systems/team-player-system.js`) | All player operations: `signPlayer()`, `releasePlayer()`, `setStarter()`, `setSub()`, `trainPlayer()`, `extendContract()`, `processPlayerDevelopment()`, `checkRetirement()`, `inflictInjury()`, `healInjuries()` |
| `DraftSystem` (`systems/draft-system.js`) | Draft board management, player generation, retired player regeneration |
| `names.js` | Player names generated via `TeamPlayerSystem.generateName()` using `maleFirstNames`, `femaleFirstNames`, `middleNames`, `lastNames` |
| `traits.js` | Player trait bonuses applied via `TeamPlayerSystem.generatePlayer()` |
| `injuries.js` | Player injuries via `TeamPlayerSystem.inflictInjury()` / `healInjuries()` |

## Serialization

Team state is serialized as part of `SportsSystem.getState()` / `setState()` in `systems/sports-system.js`:

```javascript
{
    id: team.id,
    nationId: team.nationId,
    sport: team.sport,
    name: team.name,
    stadium: team.stadium,
    stadiumCapacity: team.stadiumCapacity,
    players: [...team.players.entries()],       // Map of playerId -> player object
    roster: [...team.roster.entries()],         // Map of position -> playerId
    subs: [...team.subs.entries()],             // Map of position -> [playerId, ...]
    revenue: team.revenue,
    expenses: team.expenses,
    stats: team.stats,                          // All universal + sport-specific stats
    fans: team.fans,
    fanLoyalty: team.fanLoyalty,
    currentSeason: team.currentSeason,
    currentWeek: team.currentWeek,
    leagueId: team.leagueId,
    injuries: [...team.injuries.entries()],     // Map of playerId -> {type, daysLeft}
}
```

Deserialization restores the `Team` via `new Team({...})` and reassigns Maps from the saved entries.

## Football Positions

| Offense | Defense |
|---------|---------|
| Quarterback | Defensive End |
| Running Back | Defensive Tackle |
| Wide Receiver | Nose Tackle |
| Slot Receiver | Defensive End |
| Tight End | Middle Linebacker |
| Left Tackle | Outside Linebacker |
| Left Guard | Outside Linebacker |
| Center | Cornerback |
| Right Guard | Cornerback |
| Right Tackle | Free Safety |
| Kicker | Strong Safety |

## Other Sport Positions

**Basketball:** Point Guard, Shooting Guard, Small Forward, Power Forward, Center

**Hockey:** Goalkeeper, Left Defense, Right Defense, Left Wing, Center, Right Wing

**Soccer:** Goalkeeper, Left Back, Center Back (×2), Right Back, Defensive Mid, Central Mid (×2), Left Wing, Right Wing, Striker

## Notes

- Teams are **not** auto-populated with players — rosters start empty and are built through the draft system and free agency.
- `nation.money` is the source of truth for all team spending (salaries, upgrades, contracts). `revenue`/`expenses` on the team are informational only.
- Bonus properties (`gymBonus`, `medicalBonus`, etc.) are initialized to `0` in the constructor and updated by `SportsSystem.applyUpgradeEffects()` when stadium upgrades are purchased.
- Contract expiry warnings are populated by `TeamPlayerSystem.processSeasonEndContracts()` during offseason processing.
- The `Team` entity exports as `module.exports` in Node.js and `window.Team` in browsers.
