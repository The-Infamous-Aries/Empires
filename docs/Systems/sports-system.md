# Sports System

Central system managing leagues, seasons, tournaments, championships, draft boards, stadium upgrades, player management delegation, betting, and the global season cycle. It is the orchestrator that connects `Team` entities, `TeamPlayerSystem`, and `DraftSystem`.

## Overview

- **Class:** `SportsSystem`
- **Globally available as:** `window.SportsSystem`
- **Constructor:** `new SportsSystem()`
- **File:** `systems/sports-system.js` (2,331 lines)
- **Export:** `module.exports` (Node.js) / `window.SportsSystem` (browser)

## Architecture

```
SportsSystem
├── TeamPlayerSystem (systems/team-player-system.js) — all player operations delegated here
├── DraftSystem (systems/draft-system.js) — draft boards, player regeneration
├── Team (entities/Team.js) — team state, roster, stats, stadium
├── assets/data/Sports/names.js — player names
├── assets/data/Sports/traits.js — trait bonuses
└── assets/data/Sports/injuries.js — injury types by severity
```

## Instance Properties

### Data Stores

| Property | Type | Description |
|----------|------|-------------|
| `teams` | `Map<nationId, {sport -> Team}>` | All teams by nation and sport |
| `players` | `Map<playerId, player>` | Global player registry |
| `leagues` | `Map<leagueId, league>` | All leagues |
| `tournaments` | `Map<tournamentId, tournament>` | All tournaments |
| `matches` | `Map<matchId, match>` | All completed matches |
| `bets` | `Map<betId, bet>` | All pending/resolved bets |
| `nationSportStats` | `Map<nationId, stats>` | Per-nation coach rating stats per sport |

### Sub-systems

| Property | Type | Description |
|----------|------|-------------|
| `teamPlayerSystem` | TeamPlayerSystem | Player management (generation, contracts, injuries, training, trades) |
| `draftSystem` | DraftSystem | Draft boards and player regeneration |

### Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `sportTypes` | string[] | `['basketball', 'hockey', 'soccer', 'football']` | Supported sports |
| `playerPositions` | object | — | Position lists per sport (football split offense/defense) |
| `stadiumUpgrades` | string[] | 7 types | Seating, Gym, Medical Center, Youth Academy, Fan Experience, Concessions, Technology Center |
| `minLeagueTeams` | number | `2` | Minimum teams to start a league season |
| `maxLeagueTeams` | number | `40` | Maximum teams per league |
| `gamesPerSeason` | number | `30` | Fixed games per regular season |
| `offseasonDays` | number | `14` | Days between seasons |
| `upgradeKeyMap` | object | — | Maps upgrade names to stadium property keys |

### Phase Lengths (game days)

| Phase | Days |
|-------|------|
| registration | 7 |
| draft | 7 |
| active | 30 |
| leagueChampionship | 21 (max) |
| worldChampionship | 21 |
| offseason | 14 |

## Global Season Cycle

All leagues share a single global phase. The cycle is:

```
registration (7 days) → draft (7 days) → active (30 days) → leagueChampionship (21 days) → worldChampionship (21 days) → offseason (14 days)
```

| Phase | What happens |
|-------|-------------|
| **registration** | Nations create/join leagues |
| **draft** | Teams draft players from global boards; auto-starts leagues with full rosters at end |
| **active** | Daily games (1 per team per day), XP awards, injuries, betting |
| **leagueChampionship** | Single-elimination tournament (best-of-5 rounds, best-of-7 finals) |
| **worldChampionship** | League champions compete across all sports |
| **offseason** | Demographic advancement, contract expiry, player regeneration, new season |

### `turn(at, day)` — Daily Processing

Called by the server each game day:

1. Process player development, retirement checks, injury healing for all players
2. Regenerate retired players on draft boards
3. Advance global season cycle (`advanceSeasonCycle()`)
4. Phase-specific processing:
   - `active`: `processDailyGames()`
   - `leagueChampionship` / `worldChampionship`: `processChampionshipGames()`
   - `offseason`: `processOffseason()`

## Leagues

### `createLeague(data)` → `league`

Creates a new league. Requires a stadium wonder for the sport.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `nationId` | string | Creator nation ID |
| `sport` | string | `'basketball'`, `'hockey'`, `'soccer'`, `'football'` |
| `name` | string | League name |
| `sides` | object[] | Optional custom sides (2-8, each with `name` and `abbreviation`) |

**Sides:** 2-8 sides supported. Default is East/West. Teams are distributed across sides. Championship qualifiers are drawn side-aware (8 per side for 2-side leagues, etc.).

### `joinLeague(data)` → `{league, team}`

Joins a league. Requires stadium wonder. Creates a team for the nation automatically. Assigns to least-full side.

### `leaveLeague(leagueId, nationId)` → `boolean`

Removes a nation from a league and deletes their team.

### `startDraft(leagueId)` → `league`

Sets league status to `draft` and loads the draft pool from `DraftSystem.getDraftBoard(sport)`.

### `startSeason(leagueId)` → `league`

Requires all teams to have full rosters (`isTeamFull()`). Generates a 30-game round-robin schedule.

## Teams

### `createTeam(data)` → `team`

Creates an empty team (no auto-roster). Requires a stadium wonder. Adds 100 players to the sport's global draft board.

### `getTeam(nationId, sport)` → `Team\|null`

### `getTeamById(teamId)` → `Team\|null`

### `canCreateTeam(nationId, sport)` → `boolean`

Checks if nation has the required stadium wonder.

### `isTeamFull(team)` → `boolean`

True when every starting position is filled (22 for football: 11 offense + 11 defense).

## Stadium Upgrades

7 upgrade types, levels 0-10. Each upgrade costs nation money and requires specific levels.

| Upgrade | Base Cost | Cost Scaling | Effect |
|---------|-----------|--------------|--------|
| Seating | $1,000,000 | ×1.5 per level | +5,000 capacity per level |
| Gym | $2,000,000 | ×1.5 per level | +10% player skill gain per level |
| Medical Center | $3,000,000 | ×1.5 per level | -10% injury chance/length per level |
| Youth Academy | $2,500,000 | ×1.5 per level | Better draft player skills |
| Fan Experience | $1,500,000 | ×1.5 per level | +10% fans per game per level |
| Concessions | $2,000,000 | ×1.5 per level | +10% revenue per level |
| Technology Center | $5,000,000 | ×1.5 per level | +5% fans/XP per level, requires nation tech (level × 100) |

**Technology Center requirement:** Level N requires `nation.tech >= N × 100`.

### `upgradeStadium(data)` → `boolean`

Upgrades a stadium facility. Deducts cost from `nation.money`. Applies bonus effects to team properties (`gymBonus`, `medicalBonus`, etc.).

### `hasStadiumWonder(nationId, sport)` → `boolean`

Checks if nation has built the stadium wonder for the sport via the Wonders system.

## Match Simulation

### `simulateMatch(team1, team2)` → `match`

Simulates a single match. Calculates team strength, dispatches to sport-specific simulator, records events and score.

### `calculateTeamStrength(team)` → `number`

Averages player ratings of starters (×1.2 weight) and subs, plus coach bonus (0.05), gym bonus, and technology bonus.

### Sport Simulators

| Sport | Periods | Scoring Events |
|-------|---------|----------------|
| Basketball | 4 quarters × 12 min | 2pt/3pt field goals, steals, rebounds, shots, blocks |
| Hockey | 3 periods × 20 min | Goals, shots, blocks, fights, overtime goal |
| Soccer | 90+ min | Goals, steals |
| Football | 4 quarters × 15 min | Touchdowns (6pt), extra points (1pt), 2-point conversions, field goals (3pt), safeties (2pt), interceptions, passes, turnovers |

Win probability is proportional to team strength ratio. Events drive team sport-specific stats (touchdowns, goals, steals, etc.).

## Championship Tournaments

### `startChampionship(leagueId)`

Top 16 teams qualify (side-aware for multi-side leagues). Best-of-5 series, best-of-7 finals.

### `finishChampionship(tournament)`

Awards championship to winner. Increments `stats.championships`, `stats.tournamentsWon`, `stats.worldTournamentsWon` (if world). Tracks nation-level tournament wins.

### World Championship

League champions from all sports compete. Bracket size is next power of two, with byes for excess teams. Best-of-5 semifinals, best-of-7 finals.

### `getNationCoachRating(nationId, sport)` → `number` (0-100)

```
winComponent = (wins / totalGames) × 60
tournamentComponent = min((tournamentsWon + worldTournamentsWon) × 10, 40)
rating = round(winComponent + tournamentComponent)
```

## Betting

### `placeBet(data)` → `bet`

| Parameter | Type | Description |
|-----------|------|-------------|
| `bettorId` | string | Nation ID placing bet |
| `matchId` | string | Match to bet on |
| `betType` | string | `'winner'`, `'over_under'`, `'score'` |
| `amount` | number | Wager amount |
| `prediction` | varies | Team ID, `{type, line}`, or `{score1, score2}` |

Odds based on team strength. Winnings = `amount × odds`. Pending bets resolved after match completion.

## Save / Load

### `getState()` → `object`

Serializes: teams, players, leagues, tournaments, matches, bets, seasonCycle, nationSportStats, draftBoards.

### `setState(state)`

Restores all state including team stats, stadium bonuses, player Maps, and draft boards.

## EventBus Events

| Event | Data |
|-------|------|
| `sports:leagueCreated` | `{league}` |
| `sports:leagueJoined` | `{leagueId, nationId, teamId, sport, sideId}` |
| `sports:draftStarted` | `{league}` |
| `sports:playerDrafted` | `{leagueId, nationId, playerId, player, teamId}` |
| `sports:seasonStarted` | `{league}` |
| `sports:teamCreated` | `{nationId, sport, team, leagueId}` |
| `sports:stadiumUpgraded` | `{nationId, sport, upgradeType, level}` |
| `sports:championshipStarted` | `{league, tournament}` |
| `sports:finalsReached` | `{tournament, finalists}` |
| `sports:championshipCompleted` | `{tournament, champion}` |
| `sports:worldChampionshipStarted` | `{tournament, champions}` |
| `sports:matchCompleted` | `{match, team1, team2}` |
| `sports:betPlaced` | `{bet}` |
| `sports:betResolved` | `{bet, won}` |
| `sports:newGlobalSeason` | `{season}` |
| `sports:playersTraded` | `{teamA, teamB, playerA, playerB, nationIdA, nationIdB}` |
