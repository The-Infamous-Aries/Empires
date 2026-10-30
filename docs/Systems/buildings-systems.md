# Buildings System

Unified system for managing Improvements, Projects, and Wonders. Implements land-based restrictions and build timers, acting as the orchestration layer between the three subsystem managers (`ImprovementsSystem`, `ProjectsSystem`, `WondersSystem`).

## Overview

- **System class:** `BuildingsSystem`
- **Purpose:** Unified build/demolish coordinator with territory-based slot limits and cooldown timers
- **Subsystems:** `ImprovementsSystem`, `ProjectsSystem`, `WondersSystem`
- **Slots:** 1 improvement slot per territory square owned
- **Project cooldown:** 14 days between project builds
- **Wonder cooldown:** 28 days between wonder builds
- **Broadcasting exception:** Does NOT occupy a project slot but still activates project cooldown

## Build Limits

| Building Type | Territory Requirement | Max Count Formula | Cooldown | Slot Occupancy |
|--------------|----------------------|-------------------|----------|----------------|
| Improvement | None (uses territory slots) | 1 per territory square | None | Yes |
| Project | 10 territories per project | `floor(territoryCount / 10)` | 14 days | Yes (except Broadcasting) |
| Wonder | 20 territories per wonder | `floor(territoryCount / 20)` | 28 days | N/A |

## Methods

### Initialization & Lifecycle

#### `initialize()`
Initializes the system by instantiating `ImprovementsSystem`, `ProjectsSystem`, and `WondersSystem` if they exist on `window`, then binds event listeners. Idempotent — returns early if already initialized.

#### `bindEvents()`
Registers event listeners on `EventBus`:
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

### Territory & Slot Management

#### `getNationTerritoryCount(nation)`
Returns the number of territory squares owned by a nation. Uses `TerritoryManager.getNationTerritoryStats(nation.id).count` if available, otherwise falls back to `Math.floor(nation.land / 100) || 10`.

#### `getCurrentGameDay()`
Returns `GameTime.getTime().totalDays` if `window.GameTime` exists, otherwise returns `0`.

#### `getImprovementSlots(nation)`
Returns an object with `total`, `used`, and `available` improvement slots. Total equals territory count; used equals sum of all improvement counts.

#### `getUsedImprovementSlots(nation)`
Returns the sum of all values in `nation.improvements`.

### Project & Wonder Restrictions

#### `canBuildProject(nation)`
Checks whether a nation can build another project. Returns `{ canBuild: boolean, reason?: string }`:
1. Territory check: `floor(territoryCount / 10)` max projects; fails if `currentProjects >= maxProjects`
2. Cooldown check: 14 days since `lastProjectBuild`; fails if `daysSinceLastBuild < 14`

#### `canBuildWonder(nation)`
Checks whether a nation can build another wonder. Returns `{ canBuild: boolean, reason?: string }`:
1. Territory check: `floor(territoryCount / 20)` max wonders; fails if `currentWonders >= maxWonders`
2. Cooldown check: 28 days since `lastWonderBuild`; fails if `daysSinceLastBuild < 28`

#### `getTotalProjectCount(nation)`
Returns total project count excluding `broadcasting` (which does not occupy project slots).

#### `getTotalWonderCount(nation)`
Returns total count of all wonders owned by a nation.

### Build Operations

#### `buildImprovement(data)`
Checks improvement slot availability first, then delegates to `ImprovementsSystem.buildImprovement(data)`. Emits `building_error` if no slots available.

#### `buildProject(data)`
Special-cases `broadcasting`:
- **Broadcasting:** Skips territory slot check, only enforces 14-day cooldown
- **Other projects:** Full `canBuildProject()` check (slots + cooldown)

On success, updates `buildTimers.lastProjectBuild` to current game day.

#### `buildWonder(data)`
Runs `canBuildWonder(nation)` check, then delegates to `WondersSystem.buildWonder(data)`. On success, updates `buildTimers.lastWonderBuild` to current game day.

### Demolish Operations

#### `demolishImprovement(data)`
Delegates to `ImprovementsSystem.demolishImprovement(data)`. No timer reset.

#### `demolishProject(data)`
Delegates to `ProjectsSystem.demolishProject(data)`. **Resets** `buildTimers.lastProjectBuild` to current game day on success.

#### `demolishWonder(data)`
Delegates to `WondersSystem.demolishWonder(data)`. No timer reset.

### UI & Requirements

#### `getBuildingRequirements(data)`
Returns a requirements object for UI display containing:
- `improvements`: slot info (`total`, `used`, `available`)
- `projects`: `maxAllowed`, `current`, `nextCooldownEnd`, `daysUntilNextBuild`, `canBuild`
- `wonders`: `maxAllowed`, `current`, `nextCooldownEnd`, `daysUntilNextBuild`, `canBuild`
- `territoryCount`

Emits `building_requirements_updated` with the result.

#### `showBuildingsPanel()`
Gathers improvements, projects, and wonders data from their respective systems, merges with building requirements, and emits `show_buildings_interface`.

#### `processDaily(nation)`
Delegates daily processing to all three subsystems' `processDaily()` methods if they exist.

---

## Cross-System Dependencies

| Consumer | Usage |
|----------|-------|
| `entities/Building.js` | Pulls building definitions from `BuildingsSystem` (via `getNationBuildingData()`). Does NOT call effect recalculation directly — all effect updates go through `BuildingsSystem`. |
| `entities/City.js` | Calls `calculateImprovementEffects()` on city-level building changes |
| `systems/improvements-system.js` | Subsystem — handles improvement build/demolish/effects |
| `systems/projects-system.js` | Subsystem — handles project build/demolish/effects |
| `systems/wonders-system.js` | Subsystem — handles wonder build/demolish/effects |
| `systems/citizen-job-system.js` | Reads `nation.improvements`, `nation.projects`, `nation.wonders` counts to calculate job demand percentages |

---

## Architecture

```
BuildingsSystem (orchestrator)
├── improvementsSystem (ImprovementsSystem)
│   ├── buildImprovement()
│   ├── demolishImprovement()
│   ├── applyImprovementEffects()
│   └── processDaily()
├── projectsSystem (ProjectsSystem)
│   ├── buildProject()
│   ├── demolishProject()
│   ├── applyProjectEffects()
│   └── processDaily()
└── wondersSystem (WondersSystem)
    ├── buildWonder()
    ├── demolishWonder()
    ├── applyWonderEffects()
    └── processDaily()
```

---

## Effect Recalculation

### `calculateImprovementEffects(nation)`
Reapplies all improvement effects for a nation based on current improvement counts. Iterates all `improvementTypes` and calls `applyImprovementEffects()` for each type with count > 0. Delegates `nation` parameter to `window.Nation` if not provided.

### `calculateProjectEffects(nation)`
Reapplies all project effects for a nation based on current project counts. Iterates all `projectTypes` and calls `applyProjectEffects()` for each type with count > 0. Delegates `nation` parameter to `window.Nation` if not provided.

---

## Export

```js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuildingsSystem;
} else {
    window.BuildingsSystem = BuildingsSystem;
}
```
