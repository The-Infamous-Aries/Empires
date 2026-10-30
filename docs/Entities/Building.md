# Building Entity

Represents individual buildings and construction projects. Integrates with Nation's `BuildingsSystem`, `ImprovementsSystem`, `ProjectsSystem`, and `WondersSystem`. Holds per-instance building state (condition, workers, effects, production, consumption) and pulls building definitions from `BuildingsSystem` — which delegates to `ImprovementsSystem`, `ProjectsSystem`, and `WondersSystem`.

## Architecture

`BuildingsSystem` is the truth source for building/demolishing buildings and their definitions. The `Building` entity is a pure data container — it does **not** modify nation state directly. All build/demolish/effect operations go through `BuildingsSystem`.

- **Class:** `Building`
- **Globally available as:** `window.Building`
- **Constructor:** `new Building(buildingName, buildingType, cityId, nationId)`
- **Types:** `'improvement'`, `'project'`, `'wonder'`

## Constructor Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `buildingName` | string | Building identifier (e.g. 'port', 'barracks', 'university') |
| `buildingType` | string | One of `'improvement'`, `'project'`, `'wonder'` (default: `'improvement'`) |
| `cityId` | string\|null | ID of the city this building belongs to |
| `nationId` | string\|null | ID of the nation this building belongs to |

## Instance Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Auto-generated unique ID (`building_<timestamp>_<random>`) |
| `name` | string | Building name/identifier |
| `type` | string | `'improvement'`, `'project'`, or `'wonder'` |
| `cityId` | string\|null | Owning city ID |
| `nationId` | string\|null | Owning nation ID |
| `built` | number | Timestamp when building was constructed |
| `isActive` | boolean | Whether the building is active |
| `condition` | number | 0-100 condition/durability (starts at 100) |
| `efficiency` | number | Efficiency multiplier (starts at 1.0) |
| `quantity` | number | How many of this building (starts at 1) |
| `level` | number | Current level (starts at 1) |
| `maxLevel` | number | Maximum level (from building data) |
| `maintenanceCost` | number | Daily maintenance cost |
| `powerConsumption` | number | Power consumption per day |
| `workerCapacity` | number | Maximum workers |
| `currentWorkers` | number | Currently assigned workers |
| `effects` | object | Building effect modifiers (from definition) |
| `bonuses` | object | Building bonuses (from definition) |
| `production` | object | Resource production per day |
| `consumption` | object | Resource consumption per day |
| `contributesToNationEffects` | boolean | Whether effects apply to Nation (default: true) |
| `nationEffectKeys` | string[] | Nation property paths affected by this building |
| `eventHistory` | object[] | Last 50 building events |
| `lastMaintenance` | number | Timestamp of last maintenance |

---

## Initialization

### `initializeBuildingStats()`
Loads building data from `getNationBuildingData()` and applies max level, maintenance cost, power consumption, worker capacity, effects, production, and consumption. Also calls `determineNationEffects()`.

### `getNationBuildingData()`
Retrieves building definition data from `window.GameEngine.systems.buildings` by traversing through the subsystem instances:

1. **Improvements:** `buildingsSystem.improvementsSystem.improvementTypes[this.name]`
2. **Projects:** `buildingsSystem.projectsSystem.projectTypes[this.name]`
3. **Wonders:** `buildingsSystem.wondersSystem.wonderTypes[this.name]`

Returns `null` if the building name is not found in any subsystem. **There is no fallback** — `BuildingsSystem` (via `ImprovementsSystem`/`ProjectsSystem`/`WondersSystem`) is the sole truth source for building definitions.

### `determineNationEffects()`
Reads `nationEffects` from the building definition and stores them in `this.nationEffectKeys`.

---

## Data Accessors

| Method | Description |
|--------|-------------|
| `getMaxLevel()` | Returns max level from building data (default: 1) |
| `getMaintenanceCost()` | Returns maintenance cost (default: 0) |
| `getPowerConsumption()` | Returns power consumption (default: 0) |
| `getWorkerCapacity()` | Returns worker capacity (default: 0) |
| `getBuildingEffects()` | Returns effects object (default: `{}`) |
| `getBuildingBonuses()` | Returns bonuses object (default: `{}`) |
| `getBuildingProduction()` | Returns production object (default: `{}`) |
| `getBuildingConsumption()` | Returns consumption object (default: `{}`) |

---

## Effects & Production (Read-Only)

### `getEffectiveValue(effectKey)`
Returns the effective contribution value for a specific effect key, modified by condition, efficiency, and quantity:

```
effectiveValue = baseEffect * (condition / 100) * efficiency * quantity
```

If no `effectKey` is provided, returns the sum of all numeric effect values modified by condition/efficiency/quantity.

### `getActualProduction()`
Returns production adjusted by worker efficiency: `Math.floor(amount * workerEfficiency)` for each resource.

### `getActualConsumption()`
Returns consumption adjusted by worker efficiency: `Math.floor(amount * workerEfficiency)` for each resource.

### `getActualEffects()`
Returns effects adjusted by worker efficiency: `value * workerEfficiency` for each effect.

### `updateEffects()`
Recalculates effects, production, and consumption based on current efficiency and level (read-only; does not modify nation state).

---

## Worker Management (Entity-Level)

### `assignWorkers(count)`
Assigns workers up to `workerCapacity`. Returns the number actually assigned.

### `removeWorkers(count)`
Removes workers down to 0. Returns the number actually removed.

### `getWorkerEfficiency()`
Returns `Math.min(1.0, currentWorkers / workerCapacity)`, or `1.0` if `workerCapacity === 0`.

---

## Building Status (Entity-Level Only)

| Method | Description |
|--------|-------------|
| `activate()` | Sets `isActive = true`, logs event |
| `deactivate()` | Sets `isActive = false`, logs event |
| `destroy()` | Sets `isActive = false`, condition to 0, workers to 0 |
| `getStatusSummary()` | Returns array of status strings (e.g. `['Operational']`, `['Inactive', 'Poor Condition', 'Understaffed', 'Upgradeable']`) |

---

## Maintenance & Condition

### `repair(amount)`
Repairs condition by `amount` (default: 25), capped at 100. Calls `updateEfficiency()` if condition changed. Returns the actual condition change.

### `performMaintenance()`
Degrades condition based on time since last maintenance: `Math.min(10, daysSince * 0.5)`. Calls `updateEfficiency()`. Returns degradation amount.

### `updateEfficiency()`
Recalculates `efficiency = (condition / 100) * (1.0 + (level - 1) * 0.1)` and calls `updateEffects()`.

### `update()`
If active, calls `performMaintenance()` and `updateEffects()`. Called each game tick.

---

## Events & History

### `addEvent(description, type)`
Adds an event to `eventHistory` with id, timestamp, description, and type. Keeps only the last 50 events.

### `getRecentEvents(limit)`
Returns the most recent `limit` events in reverse chronological order (default: 10).

---

## Statistics & Information

### `getStats()`
Returns a complete statistics object including:
- Identity: id, name, type, level, maxLevel, condition, efficiency, isActive
- Production/Consumption/Effects (actual, worker-adjusted)
- Workers: currentWorkers, workerCapacity, workerEfficiency
- Costs: maintenanceCost
- Age: milliseconds since built

---

## Serialization

### `serialize()`
Returns a plain object with all building state for saving to storage.

### `static deserialize(data)`
Static factory method that creates a `Building` instance from serialized data. Constructor arguments are `(data.name, data.type, ...)` — name comes first, then type. Restores all properties including id, timestamps, condition, efficiency, level, workers, effects, production, consumption, and event history.

---

## Export

```js
if (typeof window !== 'undefined') {
    window.Building = Building;
}
```

**Removed methods (moved to `BuildingsSystem`):**
- `applyEffectsToNation()` — building no longer mutates nation state directly
- `removeEffectsFromNation()` — building no longer mutates nation state directly
- `updateNationCount()` — build/demolish count updates handled by `BuildingsSystem`
- `upgrade()` / `getUpgradeCost()` — level upgrades handled by `BuildingsSystem`
