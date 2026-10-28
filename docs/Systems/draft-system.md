# Draft System

Manages global per-sport draft boards visible to all users. When a user unlocks a team (stadium wonder built), 100 randomly generated players are added to that sport's draft board. Players regenerate as they retire, keeping the draft ever-changing. Demographics are distributed equally across age groups, with older players starting with higher base skills on average. Skills are position-appropriate for each sport.

## Overview

- **Class:** `DraftSystem`
- **Globally available as:** `window.DraftSystem`
- **Constructor:** `new DraftSystem(sportsSystem)`
- **Boards:** One `Map` per sport (`sport -> Map<playerId, player>`), stored in `this.draftBoards`
- **Players per team unlock:** 100 (distributed equally across 5 demographics = 20 per demographic)
- **Export:** `module.exports` (Node.js) / `window.DraftSystem` (browser)

## File Location

`systems/draft-system.js`

## Architecture

```
Team unlock (stadium wonder built)
        ↓
DraftSystem.addPlayersForTeamUnlock(sport) — generates 100 players, adds to draft board
        ↓
User browses draft board via DraftSystem.getDraftBoard(sport)
        ↓
SportsSystem.draftPlayer() → DraftSystem.draftPlayer() → TeamPlayerSystem.signPlayer()
        ↓
Player removed from board, added to team roster
        ↓
Player retires → DraftSystem.regenerateRetiredPlayers(sport) — removes retired, adds new
```

## Constructor Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sportsSystem` | SportsSystem | Reference to the SportsSystem instance (provides `teamPlayerSystem`, `players`, `sportTypes`, `getNation()`) |

## Instance Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `sports` | SportsSystem | — | Reference to SportsSystem |
| `tps` | TeamPlayerSystem | — | Reference to `sportsSystem.teamPlayerSystem` |
| `demographics` | string[] | `['teen', 'youngAdult', 'adult', 'middleAged', 'older']` | Age demographic groups |
| `demographicSkillBonus` | object | `{teen: 0, youngAdult: 5, adult: 10, middleAged: 15, older: 20}` | Base skill bonus added to all attributes per demographic |
| `playersPerTeamUnlock` | number | `100` | Number of players generated per team unlock |
| `draftBoards` | `Map<sport, Map<playerId, player>>` | empty | Global draft boards, one per sport |

## Initialization

### Draft board creation

Draft boards are created in the constructor for each sport in `sportsSystem.sportTypes` (default: `['basketball', 'hockey', 'soccer', 'football']`).

### `addPlayersForTeamUnlock(sport)`

Adds 100 players to a sport's draft board when a team is unlocked:

1. Creates the board if it doesn't exist (via `initializeDraftBoard()`)
2. Distributes players equally: `floor(100 / 5 demographics) = 20` per demographic
3. For each demographic:
   - Picks a random position from that sport's position list
   - Generates a player via `tps.generatePlayer({sport, position, demographic, isDrafted: false})`
   - Applies demographic skill bonus (older = better attributes)
   - Sets `contractDisplay` (seasons, cost per season, total cost)
   - Calculates `draftRate` via `calculateDraftRate()`
   - Adds player to both the draft board and `sports.players` global map

**Demographic skill bonus:** Each attribute is increased by the bonus value (capped at 99):
- Teen: +0
- Young Adult: +5
- Adult: +10
- Middle Aged: +15
- Older: +20

## Player Generation Flow

Each draft board player is created through `TeamPlayerSystem.generatePlayer()` which handles:

| Component | Source |
|-----------|--------|
| Name | `names.js` — male/female/middle/last name lists |
| Attributes | Position-appropriate base stats + demographic bonus |
| Traits | `traits.js` — trait bonuses applied to attributes/morale/potential |
| Potential | `team-player-system.js` — based on demographic |
| Contract seasons | Random 1-5 seasons |
| Injury status | `isInjured: false` (fresh players) |

## Draft Board Retrieval

### `getDraftBoard(sport)` → `player[]`

Returns only **free agents** — players not on a team and not retired:

```javascript
board.values().filter(p => !p.isRetired && !this.tps.getPlayerTeam(p.id))
```

### `getDraftBoardAll(sport)` → `player[]`

Returns all non-retired players in the draft board for a sport (including those already drafted to teams).

## Draft Rate Calculation

### `calculateDraftRate(player)` → `number`

Calculates a draft rate score (used for sorting/display):

```
skillRate = average(attributes) / 100
potentialFactor = potential / 100
demoFactor = demographic multiplier (see below)
onTeamFactor = 1.0 if drafted, 0.9 if free agent

draftRate = skillRate * potentialFactor * demoFactor * onTeamFactor
```

**Demographic factors:**

| Demographic | Factor |
|-------------|--------|
| Teen | 0.9 |
| Young Adult | 1.0 |
| Adult | 1.1 |
| Middle Aged | 1.2 |
| Older | 1.3 |

Older players have higher draft rates due to better base skills.

## Drafting a Player

### `draftPlayer(nationId, sport, playerId, team)` → `player`

Drafts a player from the global board to a team:

1. **Validations:**
   - Player must exist in `sports.players`
   - Player must not be retired
   - Player's sport must match the requested sport
   - Nation must exist

2. **Signing:** Delegates to `tps.signPlayer(team, playerId, nation)` which handles salary deduction, roster placement, and `previousTeams` tracking

3. **Draft marking:** Sets `player.isDrafted = true` and `player.draftRateMultiplier = 1.0`

4. **Board removal:** Removes player from the sport's draft board

5. **Event:** Emits `sports:playerDrafted` via `EventBus` (if available)

## Draft Rate Updates After Games

### `updateDraftRateAfterGame(player, teamWon, teamStats)` → `number`

Recalculates a player's draft rate after a game:

```
skillRate = average(attributes) / 100
potentialFactor = potential / 100
recordFactor = 0.5 + teamWinRate
demoFactor = demographic multiplier (same as calculateDraftRate)

draftRate = skillRate * potentialFactor * recordFactor * demoFactor
draftRateMultiplier = 1.0
```

The team's win rate affects the draft rate — players on winning teams get a boost.

## Returning Players to Board

### `returnPlayerToBoard(player)`

Returns a released player to the draft board:

1. If player is retired, does nothing
2. Removes player from their current team (players map, roster, and subs)
3. Sets `player.isDrafted = false` and `player.draftRateMultiplier = 0.9`
4. Adds player back to their sport's draft board

### `removePlayerFromBoard(playerId)`

Removes a player from **all** sport draft boards (used during trades).

## Player Regeneration (Retirement)

### `regenerateRetiredPlayers(sport)`

Called when players retire (during `SportsSystem.turn()`):

1. Removes all retired players from the draft board and `sports.players` map
2. Generates new replacement players — half the normal count (`floor(100 / (5 × 2)) = 10` per demographic)
3. Applies the same generation pipeline (attributes, bonuses, contract display, draft rate)

This keeps the draft board populated as players retire over time.

## Integration Points

| System | Integration Point |
|--------|------------------|
| `SportsSystem` (`systems/sports-system.js`) | Calls `addPlayersForTeamUnlock()` on team creation, `draftPlayer()` via `SportsSystem.draftPlayer()`, `getDraftBoard()` for league draft pools |
| `TeamPlayerSystem` (`systems/team-player-system.js`) | `generatePlayer()` for player creation, `signPlayer()` for signing, `getPlayerTeam()` for free agent check, `getContractExtensionCost()` for contract display, `playerPositions` for position lists |
| `names.js` | Player names via `TeamPlayerSystem.generateName()` |
| `traits.js` | Player trait bonuses applied during generation |
| `injuries.js` | New draft players start `isInjured: false` |
| `EventBus` | Emits `sports:playerDrafted` on draft |

## Serialization

Draft boards are saved/restored as part of `SportsSystem.getState()` / `setState()`:

```javascript
// Saved in SportsSystem state
draftBoards: [...this.draftSystem.draftBoards.entries()]

// Restored
this.draftSystem.draftBoards = new Map(state.draftBoards || []);
```

Individual player objects on the board include all attributes, traits, contract info, draft rate, and demographic data — they are the same objects referenced by `sports.players`.

## Position Lists by Sport

| Sport | Positions |
|-------|-----------|
| Basketball | Point Guard, Shooting Guard, Small Forward, Power Forward, Center |
| Hockey | Goalkeeper, Left Defense, Right Defense, Left Wing, Center, Right Wing |
| Soccer | Goalkeeper, Left Back, Center Back (×2), Right Back, Defensive Mid, Central Mid (×2), Left Wing, Right Wing, Striker |
| Football (Offense) | Quarterback, Running Back, Wide Receiver, Slot Receiver, Tight End, Left Tackle, Left Guard, Center, Right Guard, Right Tackle, Kicker |
| Football (Defense) | Defensive End, Defensive Tackle, Nose Tackle, Defensive End, Middle Linebacker, Outside Linebacker (×2), Cornerback (×2), Free Safety, Strong Safety |

## Notes

- Draft boards are **global** — all nations see the same available players for each sport
- Players are **not** auto-assigned to teams; users must explicitly draft them
- Contract display data (`contractDisplay`) is pre-calculated for UI display but actual signing costs go through `TeamPlayerSystem.signPlayer()`
- Retired players are purged and replaced during regeneration to keep the board fresh
- The `draftRate` field is used for sorting/display and is recalculated after each game via `updateDraftRateAfterGame()`
