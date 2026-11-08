# Wrestling System

Central system managing nation-owned wrestling promotions, weekly shows, monthly PPVs, quarterly Mass PPVs, championship titles, wrestler rosters, draft integration, match grading, injuries, and AI nation management. It is the orchestrator that connects `WrestlerSystem`, the Sports `DraftSystem`, and the Wonders System.

## Overview

- **Class:** `WrestlingSystem`
- **Globally available as:** `window.WrestlingSystem`
- **Constructor:** `new WrestlingSystem(world, saved = null)`
- **File:** `systems/Sports/wrestling-system.js` (1,887 lines)
- **Sub-system file:** `systems/Sports/wrestler-system.js` (733 lines)
- **Export:** `module.exports` (Node.js) / `window.WrestlingSystem` (browser)

## Architecture

```
WrestlingSystem
├── WrestlerSystem (systems/Sports/wrestler-system.js) — wrestler ops delegated here
├── assets/data/wrestling/names.js — wrestler names (250 first parts + 250 last parts)
├── assets/data/wrestling/signatures.js — 250 unique signature moves
├── assets/data/wrestling/finishers.js — 250 unique finishing moves
├── systems/Sports/sports-system.js — DraftSystem, player base
├── systems/Sports/team-player-system.js — draft board integration
├── systems/Building/wonders-system.js — Wrestling Arena Wonder unlock
└── entities/Nation.js — wrestlingPromotion serialization
```

## Instance Properties

### Data Stores

| Property | Type | Description |
|----------|------|-------------|
| `promotions` | `Map<nationId, promotion>` | All wrestling promotions by nation |
| `wrestlers` | `Map<wrestlerId, wrestler>` | Global wrestler registry |

### System-level State

| Property | Type | Description |
|----------|------|-------------|
| `massPpvCycleDay` | number | Next global Mass PPV game day (globally synced) |
| `massPpvRegistrations` | `Map<nationId, {wrestlerId, titleOnTheLineKey}>` | Current Mass PPV registrations |

### Sub-systems

| Property | Type | Description |
|----------|------|-------------|
| `wrestlerSystem` | WrestlerSystem | Wrestler generation, skills, training, injuries, tag teams |

### Configuration

| Property | Type | Description |
|----------|------|-------------|
| `championshipKeys` | string[] | 7 championship keys: insanity, womensMidCard, mensMidCard, womensTagTeam, mensTagTeam, womensWorld, mensWorld |
| `championshipUnlockTiers` | object[] | Fan % thresholds: 10%, 25%, 33%, 50% |
| `championshipPrestigeStart` | object | Starting prestige per title (insanity:6, world:8, midcard:5, tagteam:4) |
| `championshipFanMultiplier` | object | Fan draw multiplier per title (world:1.5, insanity:1.1, etc.) |
| `titleDefinitionConfig` | object | Title metadata: name, gender, division, requiredMatchType, requiredStipulation |
| `matchTypes` | string[] | singles, tagteam, trickytrio, fatalfour |
| `stipulations` | string[] | 14 stipulation types (1fall, 2of3falls, insanity, ladder, table, cage, deathmatch, firstblood, lastmanstanding, ironman, submissiononly, knockout, nocountout, nodq) |
| `stipulationMultipliers` | object | Fan multiplier per stipulation (deathmatch:1.5, ladder:1.3, etc.) |
| `gradeScale` | null | Star ratings used instead of letter grades (0.0-5.0) |
| `upgradeBaseCosts` | object | Base cost per arena upgrade type |
| `arenaUpgradeKeys` | string[] | 7 upgrade keys: seating, gym, medicalCenter, youthAcademy, fanExperience, concessions, technologyCenter |
| `upgradeTypeToKey` | object | Maps display names to upgrade keys |

---

## Wonder Integration

The Wrestling Arena Wonder (`wrestlingArena`) is built through the Wonders System (`systems/Building/wonders-system.js`) following the unified sports wonder pattern:

- **Cost:** money: $90,000,000, techRequired: 1200, resources: bronze-manufactured:600, steel-manufactured:300, copper-manufactured:300
- **Category:** `sports`, maxCount: 1
- **Effect:** Sets `nation.wonderEffects.wrestlingPromotionUnlocked = true`

### `onWonderBuilt(data)`
Fired when a `wrestlingArena` wonder is built. Emits `wrestling:promotionUnlocked`. The promotion is NOT auto-created — the user must call `wrestlingCreatePromotion`.

### `onWonderDemolished(data)`
Sets `promotion.isActive = false` (promotion and wrestlers are preserved, not deleted). Emits `wrestling:promotionLocked`.

### `hasArenaWonder(nationId)`
Returns `true` if `nation.wonders.wrestlingArena > 0`.

---

## Promotion Creation

### `createPromotion(nationId, data)`

Creates a wrestling promotion for a nation. Validation:

1. Nation must own the Wrestling Arena Wonder
2. Nation must not already have a promotion
3. Name: 3–60 characters
4. Airing day: `monday`–`sunday`

### Promotion Object Structure

```js
{
  id: string,                          // Unique promotion ID
  name: string,                        // Promotion name
  airingDay: string,                   // monday-sunday
  foundedDay: number,                  // Game day created
  isActive: boolean,                   // False if wonder demolished
  lastShowDay: number,                 // Last weekly show day
  lastMonthlyPpvDay: number,           // Last monthly PPV day
  fans: number,                        // Current fan count (capped at nation population)
  maxFansEver: number,                 // Peak fan count (used for monotonic championship thresholds)
  ticketPrice: {                       // User-set ticket prices
    weekly: number,                    // $1–$500, default 25
    monthlyPPV: number,                // $1–$500, default 50
  },
  arena: {                             // Arena upgrade levels (0-10 each)
    seating: 0, gym: 0, medicalCenter: 0,
    youthAcademy: 0, fanExperience: 0,
    concessions: 0, technologyCenter: 0,
  },
  roster: { [wrestlerId]: true },      // Signed wrestler IDs (full objects in WrestlingSystem.wrestlers)
  tagTeams: [],                        // [{ id, name, wrestlerIdA, wrestlerIdB, chemistry }]
  championships: {
    unlocked: [],                      // Keys of unlocked championship tiers
    titles: { [key]: titleDef },       // All 7 title definitions
    vacantTitles: [],                  // Keys of vacant titles
    blockedTitles: [],                 // Keys blocked after Mass PPV title loss
  },
  weeklyShow: { matches: [], weekStartDay },  // Up to 4 booked matches
  showHistory: [],                     // Past weekly show results
  monthlyPpvHistory: [],               // Past monthly PPV results
  massPpvHistory: [],                  // Past Mass PPV results
  titleHistory: [],                    // Title change history
  rivalries: [],                       // Promotion-level rivalries
  storylines: [],                      // Active storylines
  injuries: { [wrestlerId]: {} },      // Active wrestler injuries
  statistics: { ... },                 // Show counts, match counts, revenue, injuries, etc.
  airingDayChangedDay: number | null,  // Last airing day change (14-day cooldown)
}
```

### Championship Tiers (Population-Based Unlock)

Fans are tied to the **nation's own population** (not world population). Fan % = `maxFansEver / nation.population`. Championship unlocks are monotonic (never re-lock).

| Threshold | Championship(s) Unlocked |
|-----------|-------------------------|
| 10% | Insanity Championship (Intergender Hardcore Rules) |
| 25% | Women's Mid-Card + Men's Mid-Card |
| 33% | Women's Tag-Team + Men's Tag-Team |
| 50% | Women's World + Men's World |

### `getPromotion(nationId)`
Returns the promotion object or `null`.

---

## Airing Day

### `getNextAiringDay(currentDay, airingDay)`
Computes days until next airing day occurrence (1-7). Based on `currentDay % 7`, not `day % 7` alone.

### `changeAiringDay(nationId, newAiringDay)`
Changes the promotion's airing day. Restricted to once per 14 days (tracked via `airingDayChangedDay`).

---

## Arena Upgrades

### `upgradeArena(nationId, data)`

Upgrades one of 7 arena types. Cost formula: `baseCost * 1.5^(level-1)`. Max level 10.

| Upgrade | Key | Base Cost | Special Requirement |
|---------|-----|-----------|-------------------|
| Seating | seating | $1,000,000 | — |
| Gym | gym | $2,000,000 | — |
| Medical Center | medicalCenter | $3,000,000 | — |
| Youth Academy | youthAcademy | $2,500,000 | — |
| Fan Experience | fanExperience | $1,500,000 | — |
| Concessions | concessions | $2,000,000 | — |
| Technology Center | technologyCenter | $5,000,000 | Nation tech >= (level * 100) |

---

## Ticket Pricing

### `setTicketPrice(nationId, data)`

Sets ticket price for weekly shows or monthly PPVs. Bounds: **$1–$500**. Mass PPV is free (cross-nation event, no ticket pricing).

- `showType`: `weekly` or `monthlyPPV`

Ticket price affects attendance via price factor in the attendance formula.

---

## Booking

### `bookMatch(nationId, data)`

Books a match on the weekly show card. Validation:

1. Promotion active
2. Booking window open (not within 1 day of airing day)
3. Match count < 4 (weekly cap)
4. Valid match type and stipulation
5. All participants on roster, can wrestle, not already booked on this week's card (cross-match check)
6. Title match restrictions (if titleKey specified)
7. Ladder stipulation only for title matches

### Match Object

```js
{
  id: string,
  matchType: 'singles'|'tagteam'|'trickytrio'|'fatalfour',
  stipulation: string,
  titleKey: string|null,
  participants: [{ wrestlerId, team }],
  winnerId: null|string,
  fansGained: number,
  matchGrade: string,      // "0.0"-"5.0" star rating
  injuries: [],
  narrative: string,
}
```

### Title Match Restrictions

| Title | Required Match Type | Required Stipulation |
|-------|--------------------|---------------------|
| Insanity Championship | singles | insanity (No DQ only) |
| Women's/Men's Mid-Card | singles | any |
| Women's/Men's Tag-Team | tagteam | any (both wrestlers same gender as title) |
| Women's/Men's World | singles | any |

- Tag titles: both wrestlers must match the title's gender
- A wrestler cannot hold opposing-gender titles simultaneously (e.g., Men's World + Women's World)
- Ladder stipulation: title matches only

### `removeMatch(nationId, matchId)`
Removes a match from the weekly card (booking window must be open).

### `setWeeklyCard(nationId, matchIds)`
Reorders/finalizes the weekly card (booking window must be open).

---

## Show Simulation

### Weekly Show (`processWeeklyShow`)

Triggered on the promotion's airing day. Simulates all booked matches (max 4). Computes winners, grades, fans, injuries, title changes. Clears card after simulation.

### Monthly Nation PPV (`processMonthlyPpv`)

Replaces the weekly show on its day. Uses up to 6 matches from the weekly card. Higher fan draw, higher revenue. Sets `lastShowDay` and `lastMonthlyPpvDay`.

### Quarterly Mass PPV (`processMassPpv`)

Globally synced event every ~90 game days. Every nation with an active promotion may register 1 wrestler. Wrestlers are randomly grouped into matches (singles, tagteam, trickytrio, fatalfour). Performance-based payouts:

- **Win:** Currency + fans gained
- **Poor performance:** No currency + fans lost
- **Title on the line:** Champion retains with bonus, or challenger wins and title transfers; if champion loses, title is blocked until next Mass PPV cycle

Blocked titles are cleared after all Mass PPV matches resolve.

---

## Match Grading (Star Rating System)

Match grades use **star ratings 0.0–5.0** with tenths precision (e.g., `"4.6"`, `"1.2"`, `"3.1"`, `"2.7"`).

### Grade Inputs

- Wrestler skills (strength, agility, endurance, charisma)
- Match type modifier (singles:0, tagteam:5, trickytrio:8, fatalfour:3)
- Stipulation modifier (deathmatch:+10, insanity:+8, ladder:+7, etc.)
- Title match prestige (prestige level × 2)
- Featured match bonus (+5 full match, +2 match type only)
- Morale and happiness adjustments
- Random variance ±10%

Grade (0-100) is converted: `stars = round((grade/100) * 5 * 10) / 10`

### `getStarDisplay(rating)`
Returns `{ filledStars, partialFill, totalStars }` for UI rendering:
- `"4.6"` → `{ filledStars: 4, partialFill: 60, totalStars: 4.6 }`
- `"1.2"` → `{ filledStars: 1, partialFill: 20, totalStars: 1.2 }`

### Show Rating

Weighted average of match grades (main event 2×, opener 0.5×) with title match and stipulation variety bonuses.

### Winner Determination

Win probability based on relative strength + agility, modified by endurance, featured match bonus, finisher rating, morale, happiness, and random variance. Tag teams determine winning team first, then fall scorer. Multi-way matches use proportional probability.

### Fans Gained Per Match

```
baseFans = 500 + seating*50 + fanExperience*100
charismaFactor = 1 + (totalCharisma/100) * 0.5
gradeMultiplier = 0.5 + (stars/5.0) * 1.5   // 0.5 at 0★, 2.0 at 5★
stipMultiplier = per stipulation (deathmatch:1.5, etc.)
titleMultiplier = per title (world:1.5, etc.)
featuredBonus = 1.2 (full match) / 1.1 (type only) / 1.0 (none)
winBonus = 1.3
```

Fans distributed by charisma share; each wrestler gains individual `personalFans`. Promotion fans capped at nation population (100%).

---

## Championship System

### Title Definition

```js
{
  id, key, name, gender, division,
  requiredMatchType: 'singles'|'tagteam'|null,
  requiredStipulation: 'insanity'|null,
  unlocked: boolean,
  championId: string|null,
  championName: string|null,
  reigns: number,
  titleDefenses: number,
  prestigeLevel: number,     // 1-10
  lineage: [{ championId, startDay, endDay, defenses, note }],
  beltDesign: { colors, plates, sidePlates, leatherColor },
  createdDay: number,
}
```

### Title Match Behavior
- Titles only change hands on title matches
- Insanity Championship requires insanity stipulation only
- Tag titles require gender-matched teams in tagteam matches
- No opposing-gender title conflicts (e.g., Men's World + Women's World)
- Vacating: `wrestlingVacateTitle` action

---

## Draft Integration

Wrestling uses the existing Sports `DraftSystem` infrastructure with `wrestling` added as a sport type:

- `sportTypes`: `['basketball', 'hockey', 'soccer', 'football', 'wrestling']`
- `sportAttributes.wrestling`: `['strength', 'agility', 'endurance', 'charisma']`
- `playerPositions.wrestling`: `['wrestler']`

### `draftWrestler(nationId, data)`

Converts a Sports draft player to a wrestling wrestler object. Wrestler skills are **independent of sports player skills** — no cross-tying. Pays wrestler salary from nation money. Removes player from draft board.

### `releaseWrestler(nationId, wrestlerId)`
Removes wrestler from roster, vacates any titles held, returns to draft board (if not retired).

---

## Day Processing (`turn(at, day)`)

Called by `server/world.js` each game day for each active promotion:

1. **AI management** (for AI nations) — autodraft, auto-book, auto-Mass PPV register
2. **Weekly show** — triggers on airing day
3. **Monthly PPV** — triggers every 30 days (replaces weekly show that week)
4. **Injury healing** — weekly decrement based on medical center level
5. **Contract decrement** — weekly, expires wrestlers return to draft board
6. **Retirement check** — demographic-based chance
7. **Championship unlock checks** — monotonic fan % thresholds

### Mass PPV Cycle
Globally synced via `massPpvCycleDay`. Advances by 90 days after each cycle.

---

## Action Handler (`action(nationId, action, data)`)

Delegated from `server/world.js` `runAction`:

| Action | Method | Description |
|--------|--------|-------------|
| `wrestlingCreatePromotion` | `createPromotion` | Create promotion after wonder unlock |
| `wrestlingChangeAiringDay` | `changeAiringDay` | Change airing day (14-day cooldown) |
| `wrestlingBookMatch` | `bookMatch` | Book match on weekly card |
| `wrestlingRemoveMatch` | `removeMatch` | Remove match from card |
| `wrestlingSetWeeklyCard` | `setWeeklyCard` | Finalize/reorder weekly card |
| `wrestlingUpgradeArena` | `upgradeArena` | Upgrade arena facility |
| `wrestlingSetTicketPrice` | `setTicketPrice` | Set weekly/monthly PPV ticket price |
| `wrestlingDraftWrestler` | `draftWrestler` | Draft wrestler from Sports draft board |
| `wrestlingReleaseWrestler` | `releaseWrestler` | Release wrestler from roster |
| `wrestlingExtendContract` | `extendContract` | Extend wrestler contract (1-52 weeks) |
| `wrestlingTrainWrestler` | `trainWrestler` | Train wrestler attribute (gym level discount) |
| `wrestlingChangeFeaturedMatch` | `changeFeaturedMatch` | Change wrestler's featured match |
| `wrestlingSetSignatureMove` | `setSignatureMove` | Set wrestler's signature move |
| `wrestlingSetFinisherMove` | `setFinisherMove` | Set wrestler's finisher move |
| `wrestlingSetMoveSet` | `setMoveSet` | Set wrestler's full move set |
| `wrestlingCreateTagTeam` | `createTagTeam` | Create same-gender tag team |
| `wrestlingDissolveTagTeam` | `dissolveTagTeam` | Dissolve tag team |
| `wrestlingVacateTitle` | `vacateTitle` | Vacate a championship |
| `wrestlingMassPpvRegisterWrestler` | `registerMassPpvWrestler` | Register wrestler for quarterly Mass PPV |

---

## AI Nation Management

AI nations (no `playerId`) automatically manage promotions via `autoManageAIPromotion()`:

- **Autodraft:** Drafts wrestlers if roster < 3
- **Auto-book:** Books weekly shows (up to 4 matches) using top-rated wrestlers, 30% chance of title matches
- **Auto-Mass PPV:** Registers top-rated available wrestler, 40% chance of putting a title on the line
- AI selections skip injured wrestlers and champions with blocked titles

---

## View/API (`view(nationId)`)

Returns promotion data for server API responses:

```js
{
  promotion: { id, name, airingDay, foundedDay, isActive, fans, maxFansEver, ticketPrice, arena, championships, statistics },
  roster: [ wrestler objects ],
  weeklyShow: { matches, weekStartDay },
}
```

---

## Save / Load

### `getState()`
Returns serializable state:
- `promotions` (object keyed by nationId)
- `wrestlers` (object keyed by wrestlerId)
- `massPpvCycleDay`
- `massPpvRegistrations` (array of entries)

### `setState(state)`
Restores state from saved object. Rebuilds `Map` instances from plain objects.

All wrestler and promotion objects are plain JavaScript objects (no Maps) for clean JSON serialization.

---

## EventBus Events

| Event | Data | When |
|-------|------|------|
| `wrestling:promotionUnlocked` | `{ nationId }` | Wrestling Arena Wonder built |
| `wrestling:promotionLocked` | `{ nationId }` | Wrestling Arena Wonder demolished |
| `wrestling:promotionCreated` | `{ nationId, promotion }` | Promotion created |
| `wrestling:airingDayChanged` | `{ nationId, airingDay }` | Airing day changed |
| `wrestling:bookMatch` | `{ nationId, match, promotion }` | Match booked |
| `wrestling:showCompleted` | `{ nationId, promotion, result }` | Weekly show completed |
| `wrestling:monthlyPpvCompleted` | `{ nationId, promotion, result }` | Monthly PPV completed |
| `wrestling:massPpvRegistered` | `{ nationId, wrestlerId, titleOnTheLineKey }` | Mass PPV wrestler registered |
| `wrestling:massPpvCompleted` | `{ day, matches }` | Quarterly Mass PPV completed |
| `wrestling:matchCompleted` | — | Individual match completed |
| `wrestling:championshipUnlocked` | `{ nationId, titleKey, title }` | Championship tier unlocked |
| `wrestling:titleChanged` | `{ nationId, titleKey, oldChampionId, newChampionId }` | Title changes hands |
| `wrestling:titleVacated` | `{ nationId, titleKey }` | Title vacated |
| `wrestling:titleBlocked` | `{ nationId, titleKey }` | Title blocked after Mass PPV loss |
| `wrestling:draftWrestler` | `{ nationId, wrestlerId, wrestler }` | Wrestler drafted |
| `wrestling:releaseWrestler` | `{ nationId, wrestlerId }` | Wrestler released |
| `wrestling:aiPromotionAction` | `{ nationId, action, ... }` | AI booking/draft decision |

All `EventBus` calls are guarded with `if (typeof EventBus !== 'undefined')` for server safety.

---

## File Structure

```
systems/Sports/
  wrestling-system.js      # Main WrestlingSystem class
  wrestler-system.js       # Wrestler generation, skills, training, injuries, tag teams
assets/data/wrestling/
  names.js                 # 250 first parts + 250 last parts (wrestler name generator)
  signatures.js            # 250 unique signature moves
  finishers.js             # 250 unique finishing moves
docs/Systems/
  wrestling-system.md      # This document
  wrestler-system.md       # WrestlerSystem sub-system documentation
```

## Required Wiring (server/world.js)

1. **Constructor:** `this.wrestling = new WrestlingSystem(this, state.wrestling);` after `this.sports`
2. **WrestlerSystem:** `this.wrestling.wrestlerSystem = new WrestlerSystem(this.wrestling);`
3. **Snapshot:** Add `wrestling: this.wrestling.getState()` to snapshot clone
4. **Day loop:** Add `this.wrestling.turn(at, this.state.day);` after sports turn
5. **Action handler:** Add wrestling action cases delegating to `this.wrestling.action(id, action, data)`
6. **View:** Add `wrestling: this.wrestling.view(id)` to view object

## Required Wiring (entities/Nation.js)

1. **Constructor:** `this.wrestlingPromotion = null;`
2. **Serialize:** Add `wrestlingPromotion: this.wrestlingPromotion`
3. **Deserialize:** `this.wrestlingPromotion = data.wrestlingPromotion || null;`

## Required Wiring (systems/Building/wonders-system.js)

1. Add `wrestlingArena` wonder type (cost: $90M, tech: 1200, resources matching sports stadiums)
2. Add `case 'wrestlingArena':` to `applyWonderEffects` setting `wrestlingPromotionUnlocked = true`
3. Add `case 'wrestlingArena':` to `removeWonderEffects` deleting `wrestlingPromotionUnlocked`

## Required Wiring (systems/Sports/sports-system.js & team-player-system.js)

1. Add `'wrestling'` to `sportTypes`
2. Add `sportAttributes.wrestling = ['strength', 'agility', 'endurance', 'charisma']`
3. Add `playerPositions.wrestling = ['wrestler']`
