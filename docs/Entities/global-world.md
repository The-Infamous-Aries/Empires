# GlobalWorld Entity

The **GlobalWorld entity** is the singleton state holder for all world-level game factors in Dominion Wars. It owns the persistent global state — global averages for Happiness, Pollution, Disease, Crime, Environment, Population Density, Education, and Literacy Rate — plus recent nuke/missile strike history, government/religion tallies, world war/peace stats, military unit averages, currency type stats, disease stats, sports stats, education building stats, and special offer state.

The GlobalSystem owns the calculation logic; GlobalWorld owns the state.

| Item | Value |
|------|-------|
| **Class:** | `GlobalWorldClass` |
| **Singleton instance:** | `window.GlobalWorld` |
| **Class reference:** | `window.GlobalWorldClass` |
| **Source file:** | `entities/GlobalWorld.js` |
| **Loaded in:** | `index.html` (line 38, before `systems/World/global-system.js`) |
| **Save/Load:** | Yes — `serialize()` / `deserialize()` supported via `GlobalSystem.getState()` / `setState()` |
| **Depends on:** | None (pure state holder, no runtime dependencies) |
| **Consumed by:** | `systems/World/global-system.js` (all calculation logic) |

---

## Architecture

```
entities/GlobalWorld.js (entity — state holder)
    ↑
systems/World/global-system.js (system — calculation logic)
    ↑
core/game-engine.js (registers in this.systems.global, calls initialize())
```

`GlobalWorld` is a pure data holder with no methods other than serialization. All logic lives in `GlobalSystem`. The singleton is instantiated at module load (`new GlobalWorldClass()` at line 389) and exposed on `window`.

---

## Constructor Fields

### Global Averages

These match `Nation.nationStats` field names exactly for feed-back. All are on a 0–100 scale unless noted.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `happiness` | number | `50` | Global average happiness (INITIAL_HAPPINESS: 50) |
| `pollution` | number | `0` | Global average pollution |
| `disease` | number | `10` | Global average disease level |
| `crime` | number | `15` | Global average crime level |
| `environment` | number | `50` | Global average environment health |
| `populationDensity` | number | `0` | People per square mile across all nations |
| `education` | number | `50` | Global education level (tech + schools + universities) |
| `literacyRate` | number | `50` | Global literacy rate |

### Previous Averages

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `previousAverages` | object | Copy of `globalAverages` | Snapshot from the previous tick, used for delta/trend tracking |

### Strike History

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `recentStrikes` | array | `[]` | Successful (non-intercepted) missile/nuke strikes. Each entry: `{ nationId, attackerId, type:'missile'\|'nuke', day, damage, warId }`. Capped by `config.strikeWindowDays`. |
| `cumulativeNukePollution` | number | `0` | Pollution points from nukes (25 per nuke), decays at `nukePollutionDecayRate`/day |
| `cumulativeMissilePollution` | number | `0` | Pollution points from missiles (5 per missile), decays at `missilePollutionDecayRate`/day |

### Government / Religion Tallies

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `governmentTally` | object | `{}` | `govId → count` across all nations (e.g. `{ 'liberalDemocracy': 12 }`) |
| `religionTally` | object | `{}` | `religionId → count` across all nations (e.g. `{ 'monotheism': 8 }`) |
| `totalNations` | number | `0` | Total number of nations |
| `majorityGovernment` | string\|null | `null` | govId with the most nations |
| `majorityReligion` | string\|null | `null` | religionId with the most nations |
| `suggestedGovernment` | string\|null | `null` | Random gov EXCEPT majorityGovernment (used for demand hints) |
| `suggestedReligion` | string\|null | `null` | Random religion EXCEPT majorityReligion (used for demand hints) |

### World War / Peace Stats

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `totalNations` | number | `0` | Total number of nations |
| `nationsAtWar` | number | `0` | Nations currently in an active war |
| `nationsAtPeace` | number | `0` | Nations not in any active war |
| `warPercentage` | number | `0` | % of nations at war (0–100) |
| `peacePercentage` | number | `0` | % of nations at peace (0–100) |
| `activeWarCount` | number | `0` | Number of active wars |
| `lastCalculatedDay` | number | `0` | Game day when stats were last computed |

### Military Unit Global Averages

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `soldiers` | object | `{ avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 }` | Average soldier count per nation |
| `tanks` | object | `{ avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 }` | Average tank count per nation |
| `aircraft` | object | `{ avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 }` | Average aircraft count per nation |
| `ships` | object | `{ avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 }` | Average ship count per nation |
| `spies` | object | `{ avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 }` | Average spy count per nation |
| `missiles` | object | `{ avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 }` | Average missile count per nation |
| `nukes` | object | `{ avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 }` | Average nuke count per nation |

Each unit stat object has: `avgPerNation` (world average), `totalWorld` (sum across all nations), `nationsWithUnits` (count of nations with >0 units).

### Currency Type Global Stats

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `aurel` | object | `{ nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 }` | Nations using aurel as primary currency |
| `velt` | object | `{ nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 }` | Nations using velt as primary currency |
| `krona` | object | `{ nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 }` | Nations using krona as primary currency |
| `drachma` | object | `{ nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 }` | Nations using drachma as primary currency |
| `sovereign` | object | `{ nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 }` | Nations using sovereign as primary currency |
| `talon` | object | `{ nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 }` | Nations using talon as primary currency |
| `totalNations` | number | `0` | Total number of nations |

Each currency stat object has: `nationCount` (count using as primary), `totalBalance` (sum of all balances), `avgBalance` (average per nation), `pctOfNations` (% of all nations using it).

### Education Building Global Stats

Tracks education buildings across ALL nations (only nations that have them count; all their buildings included):

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `school` | object | See below | Schools (`improvements.school`, max 5 per nation) |
| `nationalUniversity` | object | See below | National Universities (`projects.university`, max 3 per nation) |
| `advancedUniversity` | object | See below | Advanced Universities (`projects.advancedUniversity`, max 1 per nation) |
| `greatLibrary` | object | See below | Great Library (`wonders.great_library`, max 1 per nation) |
| `universalEducationSystem` | object | See below | Universal Education System (`wonders.universalEducation`, max 1 per nation) |
| `totalBuilt` | number | `0` | Sum of ALL education buildings across all nations |
| `totalMaxSlots` | number | `0` | Sum of ALL max slots across all nations |
| `avgBuiltPerNation` | number | `0` | `totalBuilt / nationCount` |
| `fillPercentage` | number | `0` | `totalBuilt / totalMaxSlots × 100` |
| `nationCount` | number | `0` | Total number of nations |

Each building-type object has: `maxPerNation`, `totalBuilt`, `totalMaxSlots`, `avgBuiltPerNation`, `nationsWithAtLeastOne`, `fillPercentage`.

### Sports Global Stats

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `sportsGlobalStats` | object | `{ basketball, hockey, soccer, football }` | Per-sport stats object |
| `globalPlayerSkillStandard` | number | `50` | Overall player skill average across all sports (0–100) |

Each sport object has: `totalTeams`, `teamsWithYouthAcademy`, `teamsWithTechnologyCenter`, `totalPlayers`, `avgPlayerSkill`, `avgTeamSkill`.

### Special Offer Tracking

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `specialOfferCooldown` | object | `{}` | `teamId → lastOfferDay` (minimum 7 days between offers) |
| `specialOffersPending` | object | `{}` | `teamId → { player, sport, teamId, nationId, expires, createdDay }` pending special player offers |

### Disease Stats

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `totalNations` | number | `0` | Total number of nations |
| `nationsWithMinorDisease` | number | `0` | Nations with at least one active Minor disease |
| `nationsWithMajorDisease` | number | `0` | Nations with at least one active Major disease |
| `pctWithMinorDisease` | number | `0` | % of nations with Minor disease (0–100) |
| `pctWithMajorDisease` | number | `0` | % of nations with Major disease (0–100) |
| `totalMinorOutbreaks` | number | `0` | Total active Minor outbreak count |
| `totalMajorOutbreaks` | number | `0` | Total active Major outbreak count |
| `lastCalculatedDay` | number | `0` | Game day when stats were last computed |

### Config / Tuning Constants

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `globalInfluenceWeight` | number | `0.05` | 5% — how strongly strong factors (pollution/disease/environment) nudge nations |
| `globalMinorInfluenceWeight` | number | `0.01` | 1% — how strongly minor factors (education/literacy/happiness/crime) nudge nations |
| `strikeWindowDays` | number | `30` | Days to keep strike history |
| `nukeEnvPenalty` | number | `25` | Environment points deducted per successful nuke |
| `missileEnvPenalty` | number | `5` | Environment points deducted per successful missile |
| `diseaseGlobalBaseChance` | number | `0.01` | 1% base global disease spawn chance per check |
| `govReligionRecalcIntervalDays` | number | `1` | Days between government/religion majority recalcs |
| `nukePollutionDecayRate` | number | `0.005` | 0.5%/day — nuclear fallout lingers (~138 days to clear ~63%) |
| `missilePollutionDecayRate` | number | `0.02` | 2%/day — conventional pollution clears faster (~34 days to clear ~63%) |
| `basePollutionDecayRate` | number | `0.005` | 0.5%/day — background pollution healing |
| `sportsUpdateIntervalDays` | number | `1` | Days between sports stats recalcs |
| `specialOfferBaseChance` | number | `0.02` | 2% base chance per team per day during active phase |
| `specialOfferYouthAcademyBonus` | number | `0.03` | +3% per youth academy level |
| `specialOfferTechCenterBonus` | number | `0.04` | +4% per technology center level |
| `specialOfferHighSkillBonus` | number | `0.05` | +5% if team avg skill > global standard |
| `specialOfferMaxChance` | number | `0.40` | Cap at 40% |
| `specialOfferSkillBoost` | number | `15` | Special offer players get +15 base attributes |
| `specialOfferPotentialBoost` | number | `20` | Special offer players get +20 potential |

### Serialization Metadata

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `isInitialized` | boolean | `false` | Set to `true` after `deserialize()` or `reset()` |
| `saveVersion` | number | `1` | Save format version |

---

## Methods

### `serialize()`

Returns a deep-copy plain object of all state suitable for `JSON.stringify`. All arrays and objects are shallow-copied (primitives and flat objects only — no nested class instances). Includes `saveVersion`, `globalAverages`, `previousAverages`, `recentStrikes`, `governmentTally`, `religionTally`, `totalNations`, `majorityGovernment`, `majorityReligion`, `suggestedGovernment`, `suggestedReligion`, `sportsGlobalStats`, `globalPlayerSkillStandard`, `educationBuildings`, `warStats`, `militaryUnitStats`, `currencyStats`, `diseaseStats`, `specialOfferCooldown`, `specialOffersPending`, `cumulativeNukePollution`, `cumulativeMissilePollution`, `config`.

### `deserialize(data)`

Restores state from a serialized object. If `data` is null/falsy, returns early. All fields fall back to their constructor defaults if missing from `data`. Null-safe for old saves (missing `educationBuildings`, `warStats`, `militaryUnitStats`, `currencyStats`, `diseaseStats`, or `specialOffersPending` are handled gracefully — compute functions in GlobalSystem also have null guards). Sets `isInitialized = true`.

### `reset()`

Resets all state to constructor defaults. Sets `isInitialized = true`.

---

## Global System Integration

GlobalWorld is consumed exclusively by `GlobalSystemClass` (`systems/World/global-system.js`). GlobalSystem reads GlobalWorld state, mutates it during the daily pipeline, and relies on GlobalWorld's `serialize()`/`deserialize()` for save/load.

The daily pipeline order:

1. Gather nations
2. Tally governments/religions → `governmentTally`, `religionTally`, `majorityGovernment`, `majorityReligion`, `suggestedGovernment`, `suggestedReligion`
3. Compute global averages (cross-modified) → `globalAverages`
4. Prune old strikes → `recentStrikes`
5. Apply environmental decay → `cumulativeNukePollution`, `cumulativeMissilePollution`, `globalAverages.pollution`
6. Count strikes in window (for disease chance)
7. Compute Environment (LAST — depends on all above + strike pollution) → `globalAverages.environment`
8. Compute Global Disease Spawn Chance → `globalAverages.disease` modifier
9. Compute Sports Global Stats → `sportsGlobalStats`, `globalPlayerSkillStandard`
10. Compute Education Building Stats → `educationBuildings`
11. Compute World War/Peace Stats → `warStats`
12. Compute Military Unit Stats → `militaryUnitStats`
13. Compute Currency Stats → `currencyStats`
14. Compute Disease Stats → `diseaseStats`
15. Process Special Offers → `specialOfferCooldown`, `specialOffersPending`
16. Emit events
17. Persist state

---

## Save/Load

GlobalWorld state is saved as part of `gameState.global` in `core/data-manager.js`:

- **Saving:** `DataManager.getCurrentGameState()` → `window.GlobalSystem.getState()` → `GlobalWorld.serialize()` → stored in `gameState.global`
- **Loading:** `DataManager.applyGameState()` → `window.GlobalSystem.setState()` → `GlobalWorld.deserialize(data)`

This is separate from `Nation.serialize()` (which does NOT include `nationStats`), so GlobalWorld must be saved independently as a top-level global key.

---

## Files

| File | Purpose |
|------|---------|
| `entities/GlobalWorld.js` | Entity source — this file |
| `systems/World/global-system.js` | System — all calculation logic |
| `core/game-engine.js` | Registers GlobalSystem in `this.systems.global` |
| `core/data-manager.js` | Saves/restores `gameState.global` |
| `core/config.js` | Defines `GameEvents.GLOBAL_*_UPDATED` constants |
| `index.html` | Script tags: `entities/GlobalWorld.js` (line 38), `systems/World/global-system.js` (line 72) |
| `docs/Systems/global-system.md` | System technical reference |
| `docs/Guides/global-system-guide.md` | User-facing guide |
