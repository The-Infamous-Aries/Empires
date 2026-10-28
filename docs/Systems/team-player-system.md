# Team-Player System

Manages all player-related operations: generation (names, attributes, traits), demographics/progression, natural leveling from games, training, contracts, roster management (starters/subs), trades, injuries, and retirements. Integrates with `names.js`, `traits.js`, and `injuries.js` data files.

## Overview

- **Class:** `TeamPlayerSystem`
- **Globally available as:** `window.TeamPlayerSystem`
- **Constructor:** `new TeamPlayerSystem(sportsSystem)`
- **Export:** `module.exports` (Node.js) / `window.TeamPlayerSystem` (browser)

## File Location

`systems/team-player-system.js`

## Architecture

```
SportsSystem (systems/sports-system.js)
        ↓ delegates all player operations to:
TeamPlayerSystem (systems/team-player-system.js)
        ↓ imports data from:
├── assets/data/Sports/names.js     — player names (male/female/middle/last)
├── assets/data/Sports/traits.js    — trait bonuses (attribute/morale/potential/opponentInjury)
└── assets/data/Sports/injuries.js  — injury types by severity (1-5)
```

## Constructor Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sportsSystem` | SportsSystem | Reference to SportsSystem (provides `generateId()`, `players` map, `getNation()`, `getPlayerTeam()`) |

## Instance Properties

### Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `sports` | SportsSystem | — | Reference to SportsSystem |
| `sportTypes` | string[] | `['basketball', 'hockey', 'soccer', 'football']` | Supported sports |
| `playerPositions` | object | — | Position lists per sport (football split offense/defense) |
| `demographics` | string[] | `['teen', 'youngAdult', 'adult', 'middleAged', 'older']` | Age groups |
| `seasonsPerDemographic` | number | `4` | Seasons before demographic progression |
| `maxSeasonsFromTeen` | number | `20` | Max seasons starting from teen |

### Sport Attributes

| Sport | Attributes |
|-------|------------|
| **Basketball** | speed, stamina, passing, awareness, endurance, shooting, defense, rebounding, stealing (9) |
| **Hockey** | speed, stamina, spirit, awareness, endurance, passing, shooting, defense, goaltending (9) |
| **Soccer** | stamina, awareness, endurance, passing, shooting, defense, goaltending (7) |
| **Football** | stamina, awareness, endurance, passing, catching, defense, strength, speed (8) |

### Data Imports

| Property | Source | Description |
|----------|--------|-------------|
| `injuryParts` | `injuries.js` | Array of body parts |
| `injuryBySeverity` | `injuries.js` | Injury options keyed by severity 1-5 |
| `severityMeta` | `injuries.js` | Metadata per severity level |
| `traits` | `traits.js` | All trait objects keyed by trait key |
| `traitKeys` | `traits.js` | Array of all trait keys (good + bad) |
| `goodTraitKeys` | `traits.js` | Array of good trait keys |
| `badTraitKeys` | `traits.js` | Array of bad trait keys |
| `maleFirstNames` | `names.js` | Male first names list |
| `femaleFirstNames` | `names.js` | Female first names list |
| `middleNames` | `names.js` | Middle names list |
| `lastNames` | `names.js` | Last names list |
| `_pickRandom` | `names.js` | Random array picker function |

## Name Generation

### `generateName()` → `string`

Generates a random full name:

1. Picks gender (50/50 male/female)
2. Selects first name from the corresponding list
3. 30% chance of adding a middle name
4. Selects last name from last names list
5. Returns `"First [Middle] Last"`

**Data source:** `assets/data/Sports/names.js` — `maleFirstNames`, `femaleFirstNames`, `middleNames`, `lastNames`

### Names in Player Generation

When `generatePlayer()` is called without a `name` parameter, `generateName()` is automatically used:

```javascript
name: name || this.generateName()
```

## Player Generation

### `generatePlayer(data)` → `player object`

Creates a complete player object with name, attributes, traits, contract, morale, and injury state.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sport` | string | — | `'basketball'`, `'hockey'`, `'soccer'`, `'football'` |
| `position` | string\|object | — | Position name or football offense/defense object |
| `demographic` | string | `'youngAdult'` | Age group: `teen`, `youngAdult`, `adult`, `middleAged`, `older` |
| `name` | string\|null | `null` | Custom name; if null, `generateName()` is used |
| `isDrafted` | boolean | `false` | Whether the player is being drafted (affects contract length) |

**Generation Pipeline:**

1. **Age** — Random age within demographic range
2. **Attributes** — Position-appropriate base values within demographic range, with position attribute bonuses
3. **Potential** — Based on demographic (teens highest, older lowest)
4. **Traits** — 0-3 random traits from the trait pool
5. **Trait Bonuses Applied** — Each trait's `attributeBonus` modifies attributes (capped 1-99), `morale`, and `potential`
6. **Contract Seasons** — Drafted: 2-5 seasons; Non-drafted: 1 season
7. **Salary** — Base by demographic + potential bonus + random variance
8. **Morale** — 70-100 random range + trait morale bonuses

### Player Object Structure

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated unique ID |
| `name` | string | Full name (from `generateName()`) |
| `age` | number | Current age |
| `position` | string | Display position |
| `sport` | string | Sport type |
| `demographic` | string | Age group |
| `seasonsOnTeam` | number | Seasons with current team (starts 0) |
| `seasonsUntilProgression` | number | Seasons until demographic advance (starts 4) |
| `attributes` | object | Sport-specific attribute values (1-99) |
| `potential` | number | Maximum attribute ceiling (1-99) |
| `xp` | number | Experience points (starts 0) |
| `level` | number | Player level (starts 1) |
| `gamesPlayed` | number | Career games played |
| `gamesStarted` | number | Games started |
| `careerStats` | object | Sport-specific career stat counters |
| `salary` | number | Per-season salary |
| `contractSeasons` | number | Total contract seasons |
| `contractSeasonsRemaining` | number | Seasons left on contract |
| `morale` | number | 0-100 morale |
| `traits` | string[] | Array of trait keys |
| `isInjured` | boolean | Current injury status |
| `injuryDaysLeft` | number | Days remaining on injury |
| `injuryType` | string\|null | Current injury type |
| `isRetired` | boolean | Retirement status |
| `isDrafted` | boolean | Whether drafted |
| `consecutiveGamesPlayed` | number | Games in a row played |
| `hasPreviousInjury` | boolean | Whether player has injury history |
| `injuryHistory` | array | Past injury records |
| `joinedDate` | number | Timestamp when joined current team |
| `footballPosition` | object\|null | `{offense, defense}` for football players |
| `draftRateMultiplier` | number | Draft visibility multiplier |

### `getAgeForDemographic(demographic)` → `number`

Returns a random age within the demographic range:

| Demographic | Age Range |
|-------------|-----------|
| Teen | 15-19 |
| Young Adult | 20-25 |
| Adult | 26-32 |
| Middle Aged | 33-39 |
| Older | 40-45 |

### `generateAttributes(sport, position, demographic)` → `object`

Generates base attribute values:

- **Base range by demographic:**
  - Teen: 30-55
  - Young Adult: 45-70
  - Adult: 55-80
  - Middle Aged: 50-75
  - Older: 40-65
- **Position bonus:** If the attribute is a position-relevant attribute (from `positionAttributes`), adds 0-14 bonus points
- All values clamped to 1-99

### `generatePotential(demographic, isDrafted)` → `number`

| Demographic | Potential Range |
|-------------|-----------------|
| Teen | 75-95 |
| Young Adult | 65-85 |
| Adult | 55-75 |
| Middle Aged | 45-65 |
| Older | 35-55 |

### `generateTraits(demographic)` → `string[]`

Selects 0-3 random traits from the full trait pool (shuffled).

### `generateSalary(demographic, potential, seasons)` → `number`

Base salary by demographic + potential bonus + random variance:

| Demographic | Base Salary |
|-------------|-------------|
| Teen | 300,000 |
| Young Adult | 600,000 |
| Adult | 900,000 |
| Middle Aged | 700,000 |
| Older | 400,000 |

Formula: `base + floor((potential - 50) × 20,000) + random(0-200,000)`

## Position Attribute Bonuses

Position-specific attributes receive a 0-14 bonus during generation:

**Basketball:**

| Position | Boosted Attributes |
|----------|-------------------|
| Point Guard | passing, speed, awareness, stealing |
| Shooting Guard | shooting, speed, awareness |
| Small Forward | shooting, defense, stamina |
| Power Forward | defense, rebounding, endurance |
| Center | defense, rebounding, endurance |

**Hockey:**

| Position | Boosted Attributes |
|----------|-------------------|
| Goalkeeper | goaltending, awareness, endurance |
| Left/Right Defense | defense, spirit, endurance |
| Left/Right Wing | shooting, speed, passing |
| Center | passing, speed, awareness |

**Soccer:**

| Position | Boosted Attributes |
|----------|-------------------|
| Goalkeeper | goaltending, awareness, endurance |
| Left/Right Back | defense, stamina, awareness |
| Center Back | defense, endurance, awareness |
| Defensive Mid | defense, passing, endurance |
| Central Mid | passing, stamina, awareness |
| Left/Right Wing | shooting, stamina, awareness |
| Striker | shooting, passing, awareness |

**Football Offense:**

| Position | Boosted Attributes |
|----------|-------------------|
| Quarterback | passing, awareness, strength |
| Running Back | speed, strength, endurance |
| Wide/Slot Receiver | speed, catching, awareness |
| Tight End | catching, strength, defense |
| Linemen (all) | strength, defense, endurance |
| Kicker | awareness, endurance, strength |

**Football Defense:**

| Position | Boosted Attributes |
|----------|-------------------|
| Defensive End | defense, strength, speed |
| Defensive/Nose Tackle | defense, strength, endurance |
| Linebackers | defense, speed, awareness |
| Cornerbacks | speed, catching, defense |
| Safeties | speed, awareness, defense |

## Trait Management

### Traits Data Source

`assets/data/Sports/traits.js` — Contains ~250 good traits and ~100 bad traits. Each trait has:
- `name` — Display name
- `type` — `'good'` or `'bad'`
- `attributeBonus` — Object mapping attribute/morale/potential to bonus values
- `opponentInjuryBonus` (some traits) — Bonus to opponent injury chance (e.g., Enforcer, Wrecking Ball)
- `description` — Flavor text

### Trait Assignment

Players get 0-3 random traits at generation. Traits are stored as key strings in `player.traits`.

### `applyTraitToPlayer(player, traitKey)`

Applies a single trait's bonuses to a player:
- Attribute bonuses are added to matching attributes (capped 1-99)
- `morale` bonuses adjust player morale (capped 0-100)
- `potential` bonuses adjust player potential (capped 1-99)

### `rerollTrait(player, nation)` → `{cost, addedTrait, traitKey}`

Adds a new random trait to a player:

1. Max 3 traits per player
2. Cost: `floor(250,000 × (1 + currentTraits × 0.5))`
3. Nation pays cost from `nation.money`
4. Trait is applied via `applyTraitToPlayer()`

### `removeTrait(player, traitKey, nation)` → `{cost, removedTrait}`

Removes a trait and reverses its bonuses:

1. Cost: `floor(500,000 × (1 + attributeCount × 0.5))`
2. Nation pays cost from `nation.money`
3. All attribute/morale/potential bonuses from the trait are subtracted (capped 1-99 / 0-100)

## Contracts

### `getContractExtensionCost(player, team, nation)` → `number`

Calculates cost per season to extend a contract:

```
avgAttr = average of all attribute values
skillBase = floor(avgAttr × 100,000)
potentialBonus = floor((potential - 50) × 50,000)
happinessModifier based on morale:
  ≥80: 0.8 (discount)
  60-79: 0.9
  ≤40: 1.5 (premium)
  41-59: 1.2
cost = floor((skillBase + potentialBonus) × happinessModifier)
minimum: 100,000
```

### `extendContract(player, seasons, nation)` → `{cost, newSeasonsRemaining}`

Extends a player's contract:

1. Player must not be retired
2. Seasons must be 1-5
3. Player must be on a team
4. Total cost deducted from `nation.money`
5. Contract seasons and remaining seasons both increase

## Roster Management

### `signPlayer(team, playerId, nation)` → `player`

Signs a free agent to a team:

1. Player must exist and not be retired
2. Player's sport must match team's sport
3. Player must not already be on this or another team
4. Nation must afford player's salary
5. Salary deducted from `nation.money`
6. Player added to `team.players`, `joinedDate` set, `seasonsOnTeam` reset
7. Previous team tracked in `player.previousTeams`

### `releasePlayer(team, playerId)` → `boolean`

Releases a player from a team:

1. Removes from `team.players`, `team.roster`, and `team.subs`
2. Clears any team injury record and resets player injury state
3. Returns `true`

### `setStarter(team, position, playerId)`

Sets a starter at a position:

- **Football:** Validates against offense/defense position lists and player's `footballPosition`
- **Other sports:** Validates against position list and player's `position` field
- Player must not be injured or retired
- Passing `null` clears the position

### `setSub(team, position, playerId, add = true)`

Adds or removes a substitute at a position. Same validation as `setStarter`.

### `getPlayerTeam(playerId)` → `team\|null`

Returns the team a player belongs to (delegates to `SportsSystem.getPlayerTeam()`).

## Demographics & Progression

### `advanceDemographics(player)`

Called each offseason. Decrements `seasonsUntilProgression`. When it reaches 0:

- Moves to next demographic (teen → youngAdult → adult → middleAged → older)
- Applies age attribute shifts
- If already at `older`, player retires

**Demographic progression:** `teen → youngAdult → adult → middleAged → older → retired`

### `applyAgeAttributeShift(player)`

Attribute changes when aging:

| New Demographic | Changes |
|-----------------|---------|
| Young Adult | speed -1, stamina -1 |
| Adult | speed -1, stamina -1, shooting +1, passing +1 |
| Middle Aged | speed -2, stamina -2, shooting +1, passing +1, defense +1 |
| Older | speed -3, stamina -3, shooting +1, passing +1, defense +2 |

All changes clamped to 1-99.

### `processPlayerDevelopment(player)`

Random attribute development during offseason:

| Demographic | Dev Chance |
|-------------|------------|
| Teen | 5% |
| Young Adult | 3% |
| Adult | 2% |
| Middle Aged | 1% |
| Older | 0% |

If triggered, one random attribute increases by 1 (capped at potential).

### `checkRetirement(player)`

Random retirement check during offseason:

| Demographic | Base Chance |
|-------------|-------------|
| Teen/Young Adult | 0% |
| Adult | 0.1% |
| Middle Aged | 0.5% |
| Older | 2% |
| Older + 10+ seasons | +1% |

## Natural Leveling from Games

### `awardGameXP(player, minutesPlayed, teamWon, sport)` → `number`

Awards XP after a game:

1. Injured/retired players get 0 XP
2. Base: `floor(minutesPlayed / 10)`
3. Win bonus: ×1.5 if team won
4. Gym bonus: ×(1 + gymLevel × 0.1)
5. Technology bonus: ×(1 + techLevel × 0.05)
6. XP added, levels calculated (`floor(xp / 100)`)
7. On level up, `improveAttributesOnLevel()` is called

### `improveAttributesOnLevel(player, levels)`

On each level gained, one random attribute increases by 1 (capped at potential).

## Training (Nation Currency)

### `trainPlayer(team, playerId, attribute, nation)` → `{cost, gain, newValue}`

Trains a specific attribute:

1. Player must be on team, not retired
2. Attribute must be valid for the sport
3. Attribute must be below potential
4. Cost calculated via `getTrainingCost()`
5. Gym level reduces cost by 5% per level
6. Nation pays cost
7. Attribute increases by `1 + floor(gymLevel × 0.5)` (capped at potential)

### `getTrainingCost(player, attribute, team)` → `number`

```
baseCost = 50,000
scaling = 1.2^floor(currentValue / 10)
cost = floor(baseCost × scaling)
```

Costs scale exponentially as attribute value increases.

## Injury System

### Injury Data Source

`assets/data/Sports/injuries.js` — Contains `injuryBySeverity` (keyed 1-5) and `severityMeta`.

### `calculateInjuryRisk(player, minutesPlayed, playOutcome, opposingTeam)` → `number` (0-1)

```
risk = 0
risk += consecutiveGames × 0.02
risk += minutesPlayed × 0.01
risk -= endurance × 0.01
risk -= stamina × 0.01
risk += ageModifier (teen:0, youngAdult:0.05, adult:0.10, middleAged:0.15, older:0.20)
risk += outcomeModifier (win:0, loss:0.10, draw:0.05)
risk += previousInjuryModifier (0.15 if hasPreviousInjury)
risk += opponentInjuryModifier (sum of opposing team's trait opponentInjuryBonus values)

clamped to 0-1
```

### `determineInjuryType(riskScore)` → `severity options array`

| Risk Score | Severity |
|------------|----------|
| < 0.20 | null (no injury) |
| 0.20-0.40 | 1 |
| 0.40-0.55 | 2 |
| 0.55-0.75 | 3 |
| 0.75-0.90 | 4 |
| ≥ 0.90 | 5 |

### `inflictInjury(team, playerId, minutesPlayed, playOutcome, opposingTeam)` → `{injured, type, severity, daysOut, description, riskScore}` or `false`

1. Validates player exists, not already injured, not retired
2. Calculates risk score
3. Determines severity from risk score
4. Generates injury name via `generateInjuryName(severity)`
5. Calculates days out based on severity, reduced by medical center and technology center levels
6. Severity 5 = career ending (player retires, 999 days)
7. Records injury in `player.injuryHistory` and `team.injuries`
8. Sets `player.isInjured = true`

**Days out by severity:** 1: 0 days, 2: 1 day, 3: 5 days, 4: season (null), 5: career (null/999)

### `generateInjuryName(severity)` → `string`

Picks a random `{injury} {part}` combination from `injuryBySeverity[severity]`.

### `healInjuries(team)`

Decrements injury days left each turn. When days reach 0, player is no longer injured and removed from team injuries.

## Contract Expiry

### `checkContractExpiries(team)` → `array`

Populates `team.contractExpiryWarnings` with players who have ≤1 season remaining.

### `processSeasonEndContracts(team)` → `playerId[]`

Decrements `contractSeasonsRemaining` for all players. Returns IDs of players whose contracts expired (≤0 and not retired).

## Statistics & Utility

### `calculatePlayerRating(player)` → `number`

```
avgAttr = average of all attributes
ageFactor = age-based modifier (younger: boost, older: penalty)
moraleFactor = morale / 100
rating = avgAttr × ageFactor × moraleFactor
```

### `getDraftRateMultiplier(player)` → `number`

Returns `player.draftRateMultiplier` (default 1.0).

## Career Stats by Sport

Initialized in `initializeCareerStats(sport)`:

| Sport | Stats |
|-------|-------|
| Basketball | points, rebounds, assists, steals, blocks |
| Hockey | goals, assists, hits, saves, goalsAgainst |
| Soccer | goals, assists, tackles, saves, goalsAgainst |
| Football | passingYards, rushingYards, receivingYards, touchdowns, tackles, sacks, interceptions |

## Integration Points

| System | Integration Point |
|--------|------------------|
| `SportsSystem` (`systems/sports-system.js`) | All player operations delegated here: signPlayer, releasePlayer, setStarter, setSub, trainPlayer, extendContract, processSeasonEndContracts, checkContractExpiries, awardGameXP, advanceDemographics, inflictInjury, healInjuries, processPlayerDevelopment, checkRetirement, calculatePlayerRating |
| `DraftSystem` (`systems/draft-system.js`) | `generatePlayer()` for draft board players, `signPlayer()` for drafting, `getPlayerTeam()` for free agent checks, `getContractExtensionCost()` for contract display, `playerPositions` for position lists |
| `names.js` | Player names via `generateName()` (male/female/middle/last name lists) |
| `traits.js` | Trait bonuses applied at generation, on reroll, and reversed on removal; `opponentInjuryBonus` used in injury risk calculation |
| `injuries.js` | Injury types by severity, `generateInjuryName()`, `calculateInjuryRisk()` with opponent team bonuses |
| `Team` entity (`entities/Team.js`) | `team.players`, `team.roster`, `team.subs`, `team.injuries`, `team.contractExpiryWarnings`, `team.stadium.gym/technologyCenter/medicalCenter` |

## Serialization

Player objects are stored in `team.players` Map and `sports.players` Map. They are serialized as part of `SportsSystem.getState()` / `setState()` — see `docs/Systems/Sports-System.md` for full state format.

## Export

```js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeamPlayerSystem;
} else if (typeof window !== 'undefined') {
    window.TeamPlayerSystem = TeamPlayerSystem;
}
```
