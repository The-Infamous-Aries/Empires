# XP-Goals System

The **XP-Goals System** (`XPGoalsSystem`) is the centralized XP awarding and goal/mission management system for Sovereignty Epochs. It handles ALL player XP gains from interactions (wars, treaties, relationships, research, military training, economy, sports, forum, etc.) and manages Daily/Weekly/Monthly goals. All XP now flows through this system — it replaces direct `Player._awardExperience()` calls scattered across `nation-system.js` and `war-system.js`.

| Item | Value |
|------|-------|
| **System class:** | `XPGoalsSystem` |
| **Global instance:** | `window.XPGoalsSystem` |
| **Source file:** | `systems/XP/xp-goals-system.js` |
| **Initialized by:** | `NationSystem.initialize()` calls `window.XPGoalsSystem.bindEvents()` |
| **Depends on:** | `Player` entity (`window.Player`), `Nation` entity (`window.Nation`), `EventBus`, `GameEvents` |
| **Save/Load:** | Yes — full `serialize()` / static `deserialize(data)` supports all state (XP source counts, goals, completed goals, login streak, reset timestamps) |

---

## Overview

`XPGoalsSystem` is a singleton class instantiated once on both client and server environments. Every player XP gain must route through `awardXP(source, multiplier, context)`, which:

1. Validates the XP source key against `xpSources`
2. Enforces per-day caps (`maxPerDay`)
3. Calculates XP with level scaling (`baseXP × (1 + level × levelScaling) × multiplier`)
4. Applies Diplomacy skill bonus (+5% per level)
5. Awards XP via `player._awardExperience(finalXP, source)`
6. Updates goal progress for all active daily/weekly/monthly goals
7. Emits an `xp_gained` EventBus event

```
Server (window.js):        new XPGoalsSystem() → xpGoalsSystem
Client (browser):          window.XPGoalsSystem = new XPGoalsSystem()
                                ↑
                       NationSystem.initialize() calls bindEvents()
```

---

## Class Declaration & Constructor

```js
class XPGoalsSystem {
    constructor()
```

| Property | Type | Description |
|----------|------|-------------|
| `isInitialized` | `boolean` | Whether the system has been initialized |
| `xpSources` | `object` | XP source configuration (baseXP, levelScaling, maxPerDay per source) |
| `goalTemplates` | `object` | Goal templates for daily/weekly/monthly periods |
| `playerXP` | `object` | `{ totalXP, sourceCounts, sourceMaxPerDay }` — daily XP tracking |
| `goals` | `object` | `{ daily: [], weekly: [], monthly: [] }` — active goal objects |
| `refreshCounts` | `object` | Per-period refresh count for cost calculation |
| `completedGoals` | `array` | History of completed goals |
| `completedGoalIds` | `object` | `{ daily: Set, weekly: Set, monthly: Set }` — completed goal IDs per period |
| `dailyStreak` | `number` | Consecutive days with 7/10 daily goals completed |
| `weeklyStreak` | `number` | Consecutive weeks with 7/10 weekly goals completed |
| `loginStreak` | `object` | `{ count, lastLoginDate, streakStartDate, totalLoginsThisMonth, loginMonthYear, totalLoginXPEarned }` |

---

## Initialization & Events

### `bindEvents()`

Binds EventBus listeners:
- `DAY_PASSED` → `handleDayPassed()` — resets daily goals, clears daily source caps, clears daily completed goal IDs
- `MONTH_PASSED` → `handleMonthPassed()` — resets monthly goals, clears monthly completed goal IDs, resets weekly streak

Weekly goals reset every 7 days via timestamp check inside `handleDayPassed()`.

Call `generateAllGoals()` after binding to populate initial goals.

---

## XP Awarding (Core)

### `awardXP(source, multiplier = 1, context = {})`

The single entry point for all XP gains. Returns the actual XP awarded (or `0` if source unknown or daily max reached).

**XP calculation:**
```
levelScale = 1 + (playerLevel × sourceDef.levelScaling)
baseXP     = Math.floor(sourceDef.baseXP × levelScale × multiplier)
diplomacyBonus = 1 + (player.getSkillValue('diplomacy') × 0.05)
finalXP    = Math.floor(baseXP × diplomacyBonus)
```

**Daily cap:** `sourceMaxPerDay[source + today]` is incremented each call; if it exceeds `maxPerDay`, XP is `0`.

### Convenience award methods

| Method | XP Source | Notes |
|--------|-----------|-------|
| `awardWarAttack(mult, ctx)` | `warAttack` | — |
| `awardWarDefend(mult, ctx)` | `warDefend` | — |
| `awardWarWin(mult, ctx)` | `warWin` | — |
| `awardWarParticipate(mult, ctx)` | `warParticipate` | — |
| `awardDestroyUnits(mult, ctx)` | `destroyUnits` | — |
| `awardProposeTreaty(mult, ctx)` | `proposeTreaty` | — |
| `awardAcceptTreaty(mult, ctx)` | `acceptTreaty` | — |
| `awardRejectTreaty(mult, ctx)` | `rejectTreaty` | — |
| `awardTreatyAcceptedProposer(treatyType, ctx)` | `treatyAccepted_*` | Higher XP than acceptor |
| `awardTreatyAcceptedAcceptor(treatyType, ctx)` | `treatyJoined_*` | Lower XP than proposer |
| `awardJoinAlliance(mult, ctx)` | `joinAlliance` | Daily only |
| `awardMakeAlliance(mult, ctx)` | `makeAlliance` | Daily only |
| `awardClaimTerritory(mult, ctx)` | `claimTerritory` | Territory expansion |
| `awardBuildImprovement(mult, ctx)` | `buildImprovement` | — |
| `awardBuildProject(mult, ctx)` | `buildProject` | — |
| `awardBuildWonder(mult, ctx)` | `buildWonder` | — |
| `awardChangeGovernment(mult, ctx)` | `changeGovernment` | — |
| `awardChangeReligion(mult, ctx)` | `changeReligion` | — |
| `awardChangeNationalPet(mult, ctx)` | `changeNationalPet` | — |
| `awardChangeNationalFood(mult, ctx)` | `changeNationalFood` | — |
| `awardChangeNationalWater(mult, ctx)` | `changeNationalWater` | — |
| `awardSendAid(mult, ctx)` | `sendAid` | — |
| `awardReceiveAid(mult, ctx)` | `receiveAid` | — |
| `awardProposeTrade(mult, ctx)` | `proposeTrade` | — |
| `awardAcceptTrade(mult, ctx)` | `acceptTrade` | — |
| `awardRejectTrade(mult, ctx)` | `rejectTrade` | — |
| `awardWarDamage(damage, ctx)` | `warDamage` | multiplier = damage amount |
| `awardSportsWin(mult, ctx)` | `sportsWin` | — |
| `awardSportsSeasonWin(mult, ctx)` | `sportsSeasonWin` | — |
| `awardSportsWorldWin(mult, ctx)` | `sportsWorldWin` | — |
| `awardSportsTournamentRound(round, totalRounds, ctx)` | `sportsTournamentRound` | Scales with round number |
| `awardVoteColorMotion(mult, ctx)` | `voteColorMotion` | — |
| `awardVoteWorldMotion(mult, ctx)` | `voteWorldMotion` | — |
| `awardProposeColorMotion(mult, ctx)` | `proposeColorMotion` | — |
| `awardProposeWorldMotion(mult, ctx)` | `proposeWorldMotion` | — |
| `awardElectedCongress(mult, ctx)` | `electedCongress` | — |
| `awardBuyLand(mult, ctx)` | `buyLand` | — |
| `awardBuyInfra(mult, ctx)` | `buyInfra` | — |
| `awardBuyTech(mult, ctx)` | `buyTech` | — |
| `awardBuyMissiles(mult, ctx)` | `buyMissiles` | — |
| `awardBuyNukes(mult, ctx)` | `buyNukes` | — |
| `awardBuyCurrency(mult, ctx)` | `buyCurrency` | — |
| `awardBuyResource(mult, ctx)` | `buyResource` | — |
| `awardBuyLotteryTicket(mult, ctx)` | `buyLotteryTicket` | — |
| `awardSellCurrency(mult, ctx)` | `sellCurrency` | — |
| `awardSellResource(mult, ctx)` | `sellResource` | — |
| `awardResearch(mult, ctx)` | `research` | — |
| `awardTrainSoldiers(mult, ctx)` | `trainSoldiers` | — |
| `awardTrainTanks(mult, ctx)` | `trainTanks` | — |
| `awardTrainAircraft(mult, ctx)` | `trainAircraft` | — |
| `awardTrainShips(mult, ctx)` | `trainShips` | — |
| `awardDraftHockeyPlayers(mult, ctx)` | `draftHockeyPlayers` | Requires team |
| `awardDraftBasketballPlayers(mult, ctx)` | `draftBasketballPlayers` | Requires team |
| `awardDraftSoccerPlayers(mult, ctx)` | `draftSoccerPlayers` | Requires team |
| `awardDraftFootballPlayers(mult, ctx)` | `draftFootballPlayers` | Requires team |
| `awardPlaceSportsBet(mult, ctx)` | `placeSportsBet` | Requires team |
| `awardBetAmount(amount, ctx)` | `betAmount` | Requires team |
| `awardTalkCitizen(mult, ctx)` | `talkCitizen` | — |
| `awardProduceRaw(mult, ctx)` | `produceRaw_${resourceKey}` | ctx.resourceKey required |
| `awardProduceManufactured(mult, ctx)` | `produceManufactured_${resourceKey}` | ctx.resourceKey required |
| `awardDailyLogin(mult, ctx)` | `dailyLogin` | Streak-based compounding XP |

### `awardDailyLogin(multiplier, context)`

Awards daily login XP with streak bonuses:
- **Base:** 50 XP
- **Streak multiplier:** `1 + (streakDay - 1) × 0.5` (Day 1 = 50, Day 2 = 75, Day 3 = 112, etc.)
- **Level scaling:** `1 + (playerLevel × 0.01)`
- **Diplomacy bonus:** +5% per diplomacy skill level
- **Weekly bonus:** 2500 XP every 7 streak days
- **Month-end bonus:** 5000 XP per 7 streak days on last day of month
- Streak resets at start of each calendar month

### `getLoginStreakStatus()`

Returns current streak status without awarding XP.

### `checkMonthRollOver()`

Call on day pass / game refresh — resets login streak if a new calendar month started.

---

## Treaty XP Cooldown (28 days)

### `canAwardTreatyXP(entityA, entityB, now)` / `recordTreatyXP(entityA, entityB, now)`

Tracks a 28-day cooldown per entity pair (sorted alphabetically so order doesn't matter). Prevents repeated treaty XP farming between the same two nations/alliances.

### `getAllianceMembers(allianceId)`

Returns array of member nation IDs for an alliance (via `AllianceSystem`).

---

## Goal Management

### `generateAllGoals()` / `generateGoalsForPeriod(period)`

Generates goals for a period (daily/weekly/monthly), always selecting up to 10 goals.

**Filtering:**
1. Level requirement: `template.levelReq <= playerLevel`
2. Nation-based availability:
   - **Relationship goals:** only shown if empty friend/foe/best friend/nemesis slot exists
   - **Alliance goals:** only if not in an alliance; `makeAlliance` requires `officeOfRelationships` project, `allianceHeadquarters` wonder, or `allianceEasterEgg` motion modifier
   - **Treaty propose goals:** only if nation has `foreignAffairsOffice` improvement
   - **Resource production goals:** only if nation has the matching raw/manufactured improvement
   - **Sports goals:** only if nation owns ≥1 team; draft goals only for sports owned

**Auto-assigned goals:**
- **Daily:** Up to 2 relationship goals (friend/foe/best friend/nemesis) fill slots first
- **Monthly:** Always includes `buildWonder`, `changeGovernment`, `changeReligion` (up to 3)

**Target calculation:**
- `targetMin`/`targetMax` → random value in range
- `isPercentage` → `nation.money × (percent / 100)`
- Fixed `target` → used as-is

**XP reward:** `template.xpReward × (1 + playerLevel × 0.05)`

### `updateGoalProgress(source, multiplier, context)`

Updates progress on all active goals across all periods matching the XP source. Maps source keys to goal types via `sourceToGoalType`. Special handling: `proposeTreaty` matches any `propose*` goal type, optionally filtered by `context.treatyType`. When `goal.current >= goal.target`, calls `completeGoal()`.

### `completeGoal(goal, period)`

Marks goal completed, awards `goal.xpReward` XP via `player._awardExperience()`, records in `completedGoals`, adds ID to `completedGoalIds[period]`, emits `goal_completed` event, then calls `checkCompletionBonus(period)`.

### `checkCompletionBonus(period)`

Awards bonus XP when exactly 7 goals are completed in a period:
- Daily: 500 XP
- Weekly: 2500 XP
- Monthly: 10000 XP

Also awards streak bonuses:
- **Daily streak:** `500 × streak` (500, 1000, 1500, …)
- **Weekly streak:** `2500 × streak` (2500, 5000, 7500, …)

Goal ID sets are cleared on day/week/month rollover so the 7/10 bonus can recur each period.

---

## Goal Refresh (with Cost)

### `refreshGoals(period)`

Re-rolls all goals for a period. First refresh is free; subsequent costs compound: `baseCost × 2^refreshCount`.

| Period | Base Cost |
|--------|-----------|
| daily | $50,000 |
| weekly | $250,000 |
| monthly | $1,000,000 |

Deducts from `nation.money`, regenerates goals, increments refresh count, emits `goals_refreshed`.

### `getRefreshCost(period)`

Returns the cost without performing the refresh.

---

## Query Methods

| Method | Description |
|--------|-------------|
| `getCompletedGoals()` | Returns the completed goals history array |
| `getGoalProgress(goal)` | Returns completion percentage (0–1) |
| `getTotalGoalXP()` | Sum of all XP earned from completed goals |
| `isGoalLocked(templateId)` | Returns true if player level < template levelReq |

---

## Serialize / Deserialize

`serialize()` returns all persistent state: `playerXP`, `goals`, `completedGoals`, `completedGoalIds` (as arrays), `refreshCounts`, `dailyStreak`, `weeklyStreak`, `loginStreak`, `lastDailyReset`, `lastWeeklyReset`, `lastMonthlyReset`.

`static deserialize(data)` reconstructs a system instance from saved data, converting completed goal ID arrays back to Sets.

---

## Wiring (Server → Client)

| Location | How XPGoalsSystem is used |
|----------|---------------------------|
| `server/world.js` line 18 | `const xpGoalsSystem = new XPGoalsSystem()` |
| `server/world.js` | Awards XP for: government/religion changes, national pet/food/water, aid send/receive, trade propose/accept/reject, forum motions, treaty acceptance/rejection, war attack/defend, congress election, resource production, military unit purchases (via unit → method map) |
| `systems/nation-system.js` | `initialize()` calls `window.XPGoalsSystem.bindEvents()`; awards XP for land/infra/tech purchases, research completion, military training (via method map) |
| `entities/Nation.js` | Territory claim XP routes through `window.XPGoalsSystem.awardClaimTerritory()` |
| `systems/War/war-system.js` | War win/participation XP via `window.XPGoalsSystem.awardWarWin()` / `awardWarParticipate()` |

Direct `Player._awardExperience()` calls remain only as fallbacks when `XPGoalsSystem` is not available.
