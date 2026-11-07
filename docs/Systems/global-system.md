# Global System

The **Global System** (`GlobalSystem`) is the core engine that computes cross-nation averages and interdependencies across ALL players/nations in Sovereignty Epochs. It turns individual nation stats into living world-level factors that feed back to every nation, creating a connected, real-world-style simulation.

| Item | Value |
|------|-------|
| **Class:** | `GlobalSystemClass` |
| **Entity Class:** | `GlobalWorldClass` |
| **Global instances:** | `window.GlobalSystem`, `window.GlobalWorld` |
| **Source files:** | `systems/World/global-system.js`, `entities/GlobalWorld.js` |
| **Loaded in:** | `index.html` |
| **Depends on:** | `EventBus`, `GameEngine`, `WarSystem`, `DiseaseSystem`, `EconomySystem`, `SportsSystem`, `TimeSystem`, `DataManager`, `GovernmentSystem`, `ReligionSystem` |
| **Save/Load:** | Yes — full state serialized via `DataManager` (`gameState.global`) |

---

## Overview

The Global System runs once per game day on `GameEvents.DAY_PASSED`. Its pipeline gathers every nation, computes global averages for 8 factors, applies cross-modifiers (so happiness affects crime, pollution affects disease, etc.), calculates Environment last (since it depends on everything), applies decay to strike pollution, feeds small modifiers back to each nation, computes sports/war/military/currency/disease stats, and processes special offers.

**Key design principle:** Everything affects everything. A nation's happiness influences global crime; global disease affects global happiness; nukes destroy global environment which decays over weeks. Nations that neglect their stats drag down the world average, which in turn slightly hurts every other nation — creating emergent world-level consequences.

---

## Architecture

### Two-Part Design

| Component | File | Responsibility |
|-----------|------|----------------|
| **GlobalWorld entity** | `entities/GlobalWorld.js` | Singleton state holder — stores all averages, strike history, tallies, config, serialization |
| **GlobalSystem system** | `systems/World/global-system.js` | Calculation engine — computes averages, applies cross-modifiers, handles pipelines, emits events |

`GlobalWorld` owns persistent state. `GlobalSystem` owns pure logic and formulas. This matches the existing `Nation` + `*System` pattern used throughout the codebase.

### GlobalWorld State Structure

```js
{
  // Global averages (0-100 scale unless noted)
  globalAverages: {
    happiness: 50,
    pollution: 0,
    disease: 10,
    crime: 15,
    environment: 50,
    populationDensity: 0,  // people per sq mile
    education: 50,
    literacyRate: 50
  },

  // Previous tick averages (for trend/delta tracking)
  previousAverages: {...},

  // Recent successful strike history (non-intercepted only)
  recentStrikes: [
    { nationId, attackerId, type:'missile'|'nuke', day, damage, warId }
  ],

  // Cumulative strike pollution (decays over time)
  cumulativeNukePollution: 0,
  cumulativeMissilePollution: 0,

  // Government / religion tallies
  governmentTally: { 'liberalDemocracy': 12, ... },
  religionTally: { 'monotheism': 8, ... },
  totalNations: 0,

  // Majority / opposite suggestions
  majorityGovernment: null,
  majorityReligion: null,
  suggestedGovernment: null,
  suggestedReligion: null,

  // Sports stats (per sport)
  sportsGlobalStats: {
    basketball: { totalTeams, teamsWithYouthAcademy, teamsWithTechnologyCenter, totalPlayers, avgPlayerSkill, avgTeamSkill },
    ...
  },
  globalPlayerSkillStandard: 50,

  // World war / peace stats
  warStats: { totalNations, nationsAtWar, nationsAtPeace, warPercentage, peacePercentage, activeWarCount },

  // Military unit averages
  militaryUnitStats: {
    soldiers: { avgPerNation, totalWorld, nationsWithUnits },
    tanks, aircraft, ships, spies, missiles, nukes
  },

  // Currency type stats
  currencyStats: {
    aurel: { nationCount, totalBalance, avgBalance, pctOfNations },
    velt, krona, drachma, sovereign, talon
  },

  // Disease stats
  diseaseStats: {
    totalNations, nationsWithMinorDisease, nationsWithMajorDisease,
    pctWithMinorDisease, pctWithMajorDisease,
    totalMinorOutbreaks, totalMajorOutbreaks
  },

  // Special offer state
  specialOfferCooldown: { teamId: lastOfferDay },
  specialOffersPending: { teamId: { player, sport, expires, createdDay } },

  // Config / tuning constants
  config: {
    globalInfluenceWeight: 0.05,        // 5% strong-factor nudge
    globalMinorInfluenceWeight: 0.01,   // 1% minor-factor nudge
    strikeWindowDays: 30,
    nukeEnvPenalty: 25,
    missileEnvPenalty: 5,
    diseaseGlobalBaseChance: 0.01,
    nukePollutionDecayRate: 0.005,
    missilePollutionDecayRate: 0.02,
    basePollutionDecayRate: 0.005,
    specialOfferBaseChance: 0.02,
    ...
  }
}
```

---

## Daily Pipeline (Order is Critical)

The GlobalSystem runs once per game day. Order is preserved because Environment depends on all other averages + strikes.

| Step | Operation | Description |
|------|-----------|-------------|
| 1 | Gather nations | Aggregates from `window.Nation`, AI nations, DataManager nations, GameEngine nations |
| 2 | Tally gov/religion | Counts `nation.government` / `nation.religion` across all nations |
| 3 | Compute global averages | Mean across nations, then cross-modifiers applied (see below) |
| 4 | Prune strikes | Removes strikes older than 30 days |
| 4.5 | Environmental decay | Decays cumulative nuke/missile pollution + base pollution |
| 5 | Count strikes in window | Used for disease spawn chance |
| 6 | Compute Environment | LAST among averages — depends on all above + decayed strike pollution |
| 7 | Compute Global Disease Spawn Chance | From national averages + strike counts |
| 8 | Compute Sports Global Stats | Teams, youth academies, tech centers, skill standard per sport |
| 9 | Compute Education Building Stats | Schools, universities, Great Library, Universal Education fill % |
| 10 | Compute World War/Peace Stats | Nations at war vs peace via `WarSystem.getWarByNationId()` |
| 11 | Compute Military Unit Stats | Average soldiers/tanks/aircraft/ships/spies/missiles/nukes per nation |
| 12 | Compute Currency Stats | % of nations using each currency + total/avg balances |
| 13 | Compute Disease Stats | Nations with active Minor vs Major diseases |
| 14 | Process Special Offers | Random special player offers during active season |
| 15 | Emit events | `GLOBAL_*_UPDATED`, `GLOBAL_*_SPAWN_CHECK`, etc. |
| 16 | Persist state | Saves to `DataManager` (`gameState.global`) |

---

## Global Factors — Cross-Modifier Interdependencies

Global stats are NOT simple means. Raw averages are computed first, then **cross-modifiers** adjust each based on the others (like real-world causality), plus a **±5 random factor** so outcomes aren't purely player-driven.

### Modifier Rules

| Target | Increases When | Decreases When |
|--------|---------------|----------------|
| **Happiness** | Literacy > 60 | Crime > 30, Disease > 20, Pollution > 50, Environment < 40 |
| **Crime** | Happiness < 40, Disease > 20, Pollution > 50, Environment < 40, Education < 40, Literacy < 50, Pop Density > 10 | — |
| **Disease** | Pollution > 60, Environment < 40, Happiness < 40, Crime > 30 | Education > 60 |
| **Pollution** | Pop Density > 50 | Environment > 70 |
| **Education** | Happiness > 60 | — |
| **Literacy** | Education > 60 | — |

### Environment Calculation (LAST)

Environment is computed AFTER all other averages because it depends on them:

```
baseEnvironment = 100 - pollutionAvg - (diseaseAvg * 0.2) - (crimeAvg * 0.1) + (happinessAvg - 50) * 0.1

strikePollutionPenalty = cumulativeNukePollution + cumulativeMissilePollution  (already decayed)

environment = clamp(baseEnvironment - strikePollutionPenalty, 0, 100)
```

**Everything affects Environment:** pollution, disease, crime, happiness averages, plus decayed cumulative nuke/missile strike pollution.

---

## Environmental Decay System

Pollution from nukes and missiles doesn't vanish instantly — it decays over time, modeling real-world environmental healing:

| Source | Decay Rate/Day | Approx Half-Life | Behavior |
|--------|---------------|------------------|----------|
| Nukes | 0.5% (0.005) | ~138 days | Very slow — nuclear fallout lingers |
| Missiles | 2% (0.02) | ~34 days | Moderate — conventional pollution clears faster |
| Base pollution | 0.5% (0.005) | ~138 days | Background pollution heals slowest |

A single nuke adds 25 pollution points; a single missile adds 5. These accumulate into `cumulativeNukePollution` / `cumulativeMissilePollution`, which decay each day and are subtracted from global environment.

---

## Feedback to Nations (Small Global Influence)

After computing global averages, each nation's stats are nudged toward the global average:

| Factor Type | Factors | Weight | Real-World Rationale |
|-------------|---------|--------|---------------------|
| **Strong** | pollution, disease, environment | 5% | Direct environmental/health impact |
| **Minor** | happiness, crime, literacy | 1% | Subtle global cultural/social influence |

```
nation.nationStats.F += (globalAvg.F - nation.nationStats.F) * weight
```

Example: If global pollution is 60 and a nation's pollution is 20, the nation's pollution increases by `(60 - 20) * 0.05 = 2` points that day — a small but persistent global pressure.

---

## Education Building Stats

Tracks education buildings across ALL nations (only nations that have them count, all their buildings included):

| Building | Source | Max/Nation |
|----------|--------|------------|
| School | `improvements.school` | 5 |
| National University | `projects.university` | 3 |
| Advanced University | `projects.advancedUniversity` | 1 |
| Great Library | `wonders.great_library` | 1 |
| Universal Education System | `wonders.universalEducation` | 1 |

Per type: `totalBuilt`, `totalMaxSlots`, `avgBuiltPerNation`, `nationsWithAtLeastOne`, `fillPercentage`. Aggregate totals also computed.

---

## World War / Peace Stats

Tracks how many nations are at war vs peace globally:

- `totalNations`, `nationsAtWar`, `nationsAtPeace`
- `warPercentage`, `peacePercentage` (0-100)
- `activeWarCount`

Uses `WarSystem.getWarByNationId(nationId)` — a nation is "at war" if it appears on either side of any active war.

---

## Military Unit Stats

Average unit counts across ALL nations:

| Unit | Tracked |
|------|---------|
| Soldiers | avgPerNation, totalWorld, nationsWithUnits |
| Tanks | avgPerNation, totalWorld, nationsWithUnits |
| Aircraft | avgPerNation, totalWorld, nationsWithUnits |
| Ships | avgPerNation, totalWorld, nationsWithUnits |
| Spies | avgPerNation, totalWorld, nationsWithUnits |
| Missiles | avgPerNation, totalWorld, nationsWithUnits |
| Nukes | avgPerNation, totalWorld, nationsWithUnits |

---

## Currency Type Stats

Tracks what % of nations use each currency as their primary currency:

| Currency | Abbrev |
|----------|--------|
| aurel | AUR |
| velt | VLT |
| krona | KRN |
| drachma | DRM |
| sovereign | SOV |
| talon | TLN |

Per type: `nationCount`, `totalBalance`, `avgBalance`, `pctOfNations`.

Reads `nation.currency` (primary type) and `nation.currencyBalances` (object of amounts per currency).

---

## Disease Stats

Tracks how many nations have active Minor vs Major diseases:

- `nationsWithMinorDisease`, `nationsWithMajorDisease`
- `pctWithMinorDisease`, `pctWithMajorDisease` (0-100)
- `totalMinorOutbreaks`, `totalMajorOutbreaks`

Reads `DiseaseSystem.activeOutbreaks`. Only counts national-scope (`disease.scope !== 'global'`) outbreaks that aren't cured.

---

## Immigrant Effects

When a new immigrant Citizen is created (in `PopulationSystem.createImmigrant()`), `GlobalSystem.applyGlobalEffectsToImmigrant(citizen)` applies:

| Factor | Effect |
|--------|--------|
| **Happiness** | = global happiness average ±10 random variation |
| **Criminal** | Base 5% chance; increased by high crime (>30) and low happiness (<40), cap 30% |
| **Health** | 100 reduced by pollution (>50) and disease (>20), ±10 variation |
| **Education Tier** | Weighted by global education level + education building fill % (up to +20 threshold boost at 100% fill) |
| **Literacy Score** | Global literacy rate ±15, +20 if gifted, +15 fill bonus at 100% |

---

## Special Offers

During active season phase, `GlobalSystem.processSpecialOffers()` randomly offers special players to teams:

- Base 2% chance per team per day
- +3% per youth academy level, +4% per technology center level
- +5% if team avg skill > global standard
- Cap at 40%, min 7 days between offers per team
- Special offer players get +15 base attributes + youth/tech bonuses, +20 potential
- Player has 14 days to sign before offer expires

---

## Events

| Event | Payload | Purpose |
|-------|---------|---------|
| `GLOBAL_AVERAGES_UPDATED` | `{ globalAverages, previousAverages }` | Global averages changed |
| `GLOBAL_ENVIRONMENT_CALCULATED` | `{ environment, baseEnvironment, strikePollutionPenalty, cumulativeNukePollution, cumulativeMissilePollution }` | Environment result |
| `GLOBAL_DISEASE_SPAWN_CHECK` | `{ chance, triggered, diseaseId }` | Global disease spawn |
| `GLOBAL_DISEASE_OUTBREAK` | `{ diseaseId, disease, affectedNations, timestamp }` | Global disease outbreak started |
| `GLOBAL_MAJORITY_SHIFTED` | `{ majorityGovernment, majorityReligion, suggestedGovernment, suggestedReligion }` | Gov/religion majority changed |
| `GLOBAL_SPORTS_STATS_UPDATED` | `{ sportsGlobalStats, globalPlayerSkillStandard }` | Sports stats changed |
| `GLOBAL_EDUCATION_BUILDING_STATS_UPDATED` | `{ educationBuildings }` | Education building stats changed |
| `GLOBAL_WAR_STATS_UPDATED` | `{ warStats }` | War/peace stats changed |
| `GLOBAL_MILITARY_UNIT_STATS_UPDATED` | `{ militaryUnitStats }` | Military unit stats changed |
| `GLOBAL_CURRENCY_STATS_UPDATED` | `{ currencyStats }` | Currency usage stats changed |
| `GLOBAL_DISEASE_STATS_UPDATED` | `{ diseaseStats }` | Minor/Major disease stats changed |
| `GLOBAL_SPECIAL_OFFER` | `{ teamId, nationId, sport, player, expires }` | Special offer generated |

---

## Accessors

| Method | Returns |
|--------|---------|
| `GlobalSystem.getGlobalAverages()` | `{ happiness, pollution, disease, crime, environment, populationDensity, education, literacyRate }` |
| `GlobalSystem.getSuggestedGovernment()` | govId string or null |
| `GlobalSystem.getSuggestedReligion()` | religionId string or null |
| `GlobalSystem.getMajorityGovernment()` | govId string or null |
| `GlobalSystem.getMajorityReligion()` | religionId string or null |
| `GlobalSystem.getGlobalSkillStandard(sport)` | number 0-100 |
| `GlobalSystem.getWorldWarStats()` | warStats object |
| `GlobalSystem.getMilitaryUnitStats(type)` | unit stats object |
| `GlobalSystem.getAllMilitaryUnitStats()` | all unit stats object |
| `GlobalSystem.getCurrencyStats(type)` | currency stats object |
| `GlobalSystem.getAllCurrencyStats()` | all currency stats object |
| `GlobalSystem.getDiseaseStats()` | disease stats object |
| `GlobalSystem.getEducationBuildingStats(type)` | building stats object |
| `GlobalSystem.getAllEducationBuildingStats()` | all building stats object |
| `GlobalSystem.getState()` / `setState(data)` | serialize/deserialize GlobalWorld |

---

## Integration Points

| Consumer | File | Integration |
|----------|------|-------------|
| GameEngine | `core/game-engine.js` | Registers `this.systems.global`, binds to `DAY_PASSED`, exposes `window.GlobalSystem`/`window.GlobalWorld` |
| Nation | `entities/Nation.js` | `handleDayPassed()` calls `applyGlobalModifiers(this)` after `calculateNationStats()`; `checkDemands()` overrides hints with suggested gov/religion |
| DiseaseSystem | `systems/World/disease-system.js` | `checkGlobalEvent()` delegates to `GlobalSystem.calculateGlobalDiseaseSpawnChance()` |
| PopulationSystem | `systems/Population/population-system.js` | `createImmigrant()` calls `applyGlobalEffectsToImmigrant(citizen)` |
| SportsSystem | `systems/Sports/sports-system.js` | `turn()` calls `addPlayersForTeamUnlock()` for each sport; `update()` calls `turn()` daily |
| DraftSystem | `systems/Sports/draft-system.js` | `initializeDraftBoard()` / `addPlayersForTeamUnlock()` / `regenerateRetiredPlayers()` use target counts from global rates |
| DataManager | `core/data-manager.js` | Saves/restores `gameState.global` |
| WarSystem | `systems/War/war-system.js` | Emits `missile_hit`/`nuke_hit` events that GlobalSystem listens to |
