# Buildings System

Unified system for managing Improvements, Projects, and Wonders. Acts as the orchestration layer between the three subsystem managers (`ImprovementsSystem`, `ProjectsSystem`, `WondersSystem`). Slot limits are now based on infrastructure levels for improvements and territory count for projects; wonders are time-gated only.

## Overview

- **System class:** `BuildingsSystem`
- **Purpose:** Unified build/demolish coordinator with live slot limits and cooldown timers
- **Subsystems:** `ImprovementsSystem`, `ProjectsSystem`, `WondersSystem`
- **Improvement slots:** 1 slot per 25 infra levels (live — reads `nation.infra`, lost/destroyed infra immediately reduces available slots)
- **Project slots:** 1 starting slot + 1 additional slot per 2 territories
- **Project cooldown:** 14 days between project builds
- **Wonder cooldown:** 28 days between wonder builds; day 1 is free (no cooldown on first wonder)
- **Broadcasting exception:** Does NOT occupy a project slot but still activates project cooldown
- **Permanent improvements:** Foreign Affairs Office and Internal Affairs Office cannot be demolished once built (`permanent: true`)

---

## Build Limits

| Building Type | Slot Requirement | Max Count Formula | Cooldown | Slot Occupancy |
|--------------|-----------------|-------------------|----------|----------------|
| Improvement | Infra levels | `floor(infraLevel / 25)` | None | Yes |
| Project | Territories | `1 + floor(territoryCount / 2)` | 14 days | Yes (except Broadcasting) |
| Wonder | None (time-gated) | 1 per wonder type (maxCount: 1) | 28 days (day 1 free) | N/A |

**Examples:**
- Starting nation (100 infra, 10 territories): 4 improvement slots, 1 project slot, day-1 wonder free
- 4150 infra: 166 improvement slots (enough to build every improvement at max count)
- 124 territories: 63 project slots (enough to build every project at max count)
- 34 wonders total, each maxCount 1, time-gated at 1 per 28 days (~924 days for all)

---

## Methods

### Initialization & Lifecycle

#### `initialize()`
Initializes the system by instantiating `ImprovementsSystem`, `ProjectsSystem`, and `WondersSystem` if they exist on `window`, then binds event listeners. Idempotent — returns early if already initialized.

#### `bindEvents()`
Registers event listeners on `EventBus` (BuildingsSystem is the sole binder for build/demolish events — subsystems do not bind directly to these events, preventing double-build/double-demolish):
- `show_buildings_panel` → `showBuildingsPanel()`
- `build_improvement` → `buildImprovement()`
- `build_project` → `buildProject()`
- `build_wonder` → `buildWonder()`
- `demolish_improvement` → `demolishImprovement()`
- `demolish_project` → `demolishProject()`
- `demolish_wonder` → `demolishWonder()`
- `get_building_requirements` → `getBuildingRequirements()`

#### `destroy()`
Unbinds all event listeners, destroys all three subsystems, and marks `isInitialized = false`.

#### `getState() / setState(state)`
Serializes and restores `buildTimers` (`lastProjectBuild`, `lastWonderBuild`) and `isInitialized`.

---

### Territory & Slot Management

#### `getNationTerritoryCount(nation)`
Returns the number of territory squares owned by a nation. Used for project slot calculation (`1 + floor(territoryCount / 2)`). Uses `TerritoryManager.getNationTerritoryStats(nation.id).count` if available, otherwise falls back to `Math.floor(nation.land / 100) || 10`.

#### `getCurrentGameDay()`
Returns `GameTime.getTime().totalDays` if `window.GameTime` exists, otherwise returns `0`.

#### `getImprovementSlots(nation)`
Returns an object with `total`, `used`, `available`, `infraLevel`, and `slotsPerInfra`. Total equals `floor(nation.infra / 25)`; used equals sum of all improvement counts. Reads `nation.infra` live — if infra is lost/destroyed/sold, available slots drop immediately.

#### `getUsedImprovementSlots(nation)`
Returns the sum of all values in `nation.improvements`.

---

### Project & Wonder Restrictions

#### `canBuildProject(nation)`
Checks whether a nation can build another project. Returns `{ canBuild: boolean, reason?: string }`:
1. Slot check: `1 + floor(territoryCount / 2)` max project slots; fails if `currentProjects >= maxSlots`
2. Cooldown check: 14 days since `lastProjectBuild`; fails if `daysSinceLastBuild < 14`

#### `canBuildWonder(nation)`
Checks whether a nation can build another wonder. Returns `{ canBuild: boolean, reason?: string }`:
1. Day 1 free: if `lastWonderBuild === 0`, no cooldown — can build immediately
2. Cooldown check: 28 days since `lastWonderBuild`; fails if `daysSinceLastBuild < 28`
3. No territory requirement — wonders are limited only by their individual `maxCount: 1`

#### `getTotalProjectCount(nation)`
Returns total project count excluding `broadcasting` (which does not occupy project slots but still activates cooldown).

#### `getTotalWonderCount(nation)`
Returns total count of all wonders owned by a nation.

---

### Build Operations

#### `buildImprovement(data)`
Checks improvement slot availability (infra/25) first, then delegates to `ImprovementsSystem.buildImprovement(data)`. Emits `building_error` if no slots available. The improvements system:
1. Validates improvement type exists and count < maxCount
2. Checks affordability (money + staged resources)
3. Deducts cost via `payImprovementCost()`
4. Increments count on `nation.improvements[type]`
5. Recalculates supreme military wonder bonuses first (for military improvements)
6. Applies effects via `rebuildAllImprovementEffects()` (full reset, pollution accumulators never compound)
7. Reapplies farm/wonder effects for farms/wells
8. Emits `improvement_built`

#### `buildProject(data)`
Special-cases `broadcasting`:
- **Broadcasting:** Skips territory slot check, only enforces 14-day cooldown (does NOT occupy a slot)
- **Other projects:** Full `canBuildProject()` check (slots + cooldown)

On success, updates `buildTimers.lastProjectBuild` to current game day. The projects system:
1. Validates project type exists, count < maxCount, tech requirement met
2. Validates prerequisite (project/improvement count >= requireCount)
3. Validates bonus resource requirement if set
4. Checks affordability, deducts cost via `payProjectCost()`
5. Increments count on `nation.projects[type]`
6. Applies effects via `rebuildAllProjectEffects()` (full reset, pollution accumulators never compound)
7. Reapplies wonder effects for farm/well projects
8. Emits `project_built`

#### `buildWonder(data)`
Runs `canBuildWonder(nation)` check (day 1 free or 28-day cooldown), then delegates to `WondersSystem.buildWonder(data)`. On success, updates `buildTimers.lastWonderBuild` to current game day. The wonders system:
1. Validates wonder type exists, count < maxCount, tech requirement met
2. Validates prerequisite (project/wonder/improvement count)
3. Checks affordability, deducts cost via `payWonderCost()`
4. Increments count on `nation.wonders[type]`
5. Applies effects via `applyWonderEffects()`
6. For `supremeMilitary`: recalculates supreme military bonuses based on maxed military improvements
7. Emits `wonder_built`

---

### Demolish Operations

#### `demolishImprovement(data)`
Delegates to `ImprovementsSystem.demolishImprovement(data)`. No timer reset. The improvements system:
1. Validates nation owns at least 1 of the improvement type
2. **Permanent guard:** if `improvement.permanent === true` (Foreign Affairs Office, Internal Affairs Office), demolition is blocked
3. Salvage recovery: if `projectEffects.resourceRecovery` active (Salvage Yard project), refunds a percentage of money cost (default 15%, enhanced by wonder/project recovery rates)
4. Decrements count
5. Embassy demolition triggers `handleEmbassyDemolition()` (removes excess friends/foes, clears best friend/nemesis if below 5 embassies)
6. Recalculates supreme military wonder bonuses first (for military improvements)
7. Applies effects via `rebuildAllImprovementEffects()` (full reset)
8. Reapplies farm/wonder effects for farms/wells
9. Emits `improvement_demolished`

#### `demolishProject(data)`
Delegates to `ProjectsSystem.demolishProject(data)`. **Resets** `buildTimers.lastProjectBuild` to current game day on success. The projects system:
1. Validates nation owns at least 1 of the project type
2. Permanent guard: if `project.permanent === true` (Government Monument, Religious Monument), demolition blocked
3. Salvage recovery: if `projectEffects.resourceRecovery` active, refunds percentage of money cost
4. Decrements count
5. Applies effects via `rebuildAllProjectEffects()` (full reset — boolean flags become `false` when count reaches 0)
6. Reapplies wonder effects for farm/well projects
7. Emits `project_demolished`

#### `demolishWonder(data)`
Delegates to `WondersSystem.demolishWonder(data)`. No timer reset. The wonders system:
1. Validates nation owns at least 1 of the wonder type
2. Saves original count for pollution subtraction
3. Decrements count
4. Salvage recovery: if `projectEffects.resourceRecovery` active, refunds percentage of money cost
5. When count reaches 0, calls `removeWonderEffects(nation, wonderType, wonderCountBefore)`:
   - Deletes boolean flags for that wonder type
   - Subtracts `pollutionProduction` for nuclear wonders (`nuclearWarheadFacility` -50, `enhancedNuclearWarheads` -100)
   - Subtracts `pollutionReduction` for pollution reduction wonders (`carbonSequestrationFacility` -600, `atmosphericFiltrationDome` -700, `zeroEmissionZone` -300)
   - Deletes supreme military flags if demolishing `supremeMilitary`
6. Emits `wonder_demolished`

---

### UI & Requirements

#### `getBuildingRequirements(data)`
Returns a requirements object for UI display containing:
- `improvements`: slot info (`total`, `used`, `available`, `infraLevel`, `slotsPerInfra`)
- `projects`: `maxAllowed`, `current`, `territoriesForNextSlot`, `territoryCount`, `nextCooldownEnd`, `daysUntilNextBuild`, `canBuild`
- `wonders`: `maxAllowed` (34), `current`, `nextCooldownEnd`, `daysUntilNextBuild`, `canBuild`
- `territoryCount`, `infraLevel`

Emits `building_requirements_updated` with the result.

#### `showBuildingsPanel()`
Gathers improvements, projects, and wonders data from their respective systems, merges with building requirements, and emits `show_buildings_interface`.

#### `processDaily(nation)`
Delegates daily processing to all three subsystems' `processDaily()` methods if they exist:
- `ImprovementsSystem.processDaily()` — improvement daily operations
- `ProjectsSystem.processDaily()` — missile/spy production, military force penalty
- `WondersSystem.processDaily()` — nuke production, enhanced missile/spy production, government/religion cooldowns, supreme military recalculation, food/water wonder reactivation

---

### Effect Recalculation

#### `calculateImprovementEffects(nation)`
Full rebuild of all improvement effects. Resets `pollutionProduction` and `pollutionReduction` accumulators to 0, then re-applies every built improvement type via `applyImprovementEffects()`. Prevents pollution compounding on repeated calls within a turn. Delegates `nation` parameter to `window.Nation` if not provided.

#### `calculateProjectEffects(nation)`
Full rebuild of all project effects. Resets `pollutionProduction` and `pollutionReduction` accumulators to 0, then re-applies every built project type via `applyProjectEffects()`. Prevents pollution compounding on repeated calls within a turn. Delegates `nation` parameter to `window.Nation` if not provided.

---

### Cross-System Dependencies

| Consumer | Usage |
|----------|-------|
| `entities/Building.js` | Pulls building definitions. All effect updates go through `BuildingsSystem`. |
| `systems/Nation/improvements-system.js` | Subsystem — handles improvement build/demolish/effects, supreme military pollution doubling |
| `systems/Nation/projects-system.js` | Subsystem — handles project build/demolish/effects, missile/spy production |
| `systems/Nation/wonders-system.js` | Subsystem — handles wonder build/demolish/effects, nuclear production |
| `systems/Population/citizen-job-system.js` | Reads `nation.improvements`, `nation.projects`, `nation.wonders` counts for job demand |
| `server/world.js` | Reads `canSetPolicies` (edicts), `canDiplomacy` (diplomacy), `foreignAffairsOffice`, `internalAffairsOffice`, project/wonder effects |
| `server/diplomacy.js` | Reads `foreignAffairsOffice` for diplomatic actions |
| `ui/live/game.js` | Reads building requirements for UI display, edict selection gated on `canSetPolicies` |

---

### Architecture

```
BuildingsSystem (orchestrator — sole event binder)
├── improvementsSystem (ImprovementsSystem)
│   ├── buildImprovement()        — delegates from BuildingsSystem
│   ├── demolishImprovement()     — delegates from BuildingsSystem
│   ├── applyImprovementEffects()
│   ├── rebuildAllImprovementEffects()  — full reset, no pollution compounding
│   └── processDaily()
├── projectsSystem (ProjectsSystem)
│   ├── buildProject()            — delegates from BuildingsSystem
│   ├── demolishProject()         — delegates from BuildingsSystem
│   ├── applyProjectEffects()
│   ├── rebuildAllProjectEffects()  — full reset, no pollution compounding
│   └── processDaily()
└── wondersSystem (WondersSystem)
    ├── buildWonder()             — delegates from BuildingsSystem
    ├── demolishWonder()          — delegates from BuildingsSystem
    ├── applyWonderEffects()
    ├── applySupremeMilitaryEffects()  — conditional bonuses, pollution doubling
    ├── removeWonderEffects()     — cleans up effects + subtracts pollution
    └── processDaily()
```

---

### Export

```js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuildingsSystem;
} else {
    window.BuildingsSystem = BuildingsSystem;
}
```
