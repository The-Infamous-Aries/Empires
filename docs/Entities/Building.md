# Building Entity

Represents individual buildings and construction projects. Integrates with Nation's `BuildingsSystem`, `ImprovementsSystem`, `ProjectsSystem`, and `WondersSystem`. Handles building lifecycle, stats, workers, effects, condition, and serialization.

## Overview

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
| `effects` | object | Building effect modifiers |
| `bonuses` | object | Building bonuses |
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

Falls back to `getFallbackBuildingData()` if no subsystem data found. Returns `null` if nothing matches.

### `getFallbackBuildingData()`
Built-in fallback building definitions for when the GameEngine subsystem is unavailable. Includes:

**Improvements:**
| Building | Max Level | Base Cost | Maintenance | Key Effects |
|----------|-----------|-----------|-------------|-------------|
| Port | 10 | $1,500,000 | $5,000 | Ship effectiveness +5%, trade bonus +10%, happiness +2% |
| Barracks | 10 | $2,500,000 | $10,000 | Soldier effectiveness +10%, military morale +5% |
| Factory | 7 | $4,000,000 | $15,000 | Tank effectiveness +10%, pollution +5% |
| Airforce Base | 5 | $8,000,000 | $25,000 | Aircraft effectiveness +10% |
| Harbor | 5 | $6,000,000 | $20,000 | Ship effectiveness +10% |
| Hospital | 5 | $3,500,000 | $15,000 | Disease reduction -5%, happiness +3% |
| Police Station | 5 | $2,200,000 | $8,000 | Crime reduction -5%, happiness +2% |
| Recycling Center | 3 | $1,800,000 | $6,000 | Pollution reduction -5%, happiness +2% |
| School | 5 | $2,800,000 | $12,000 | Literacy +7.5%, happiness +2.5% |
| Park | 5 | $1,200,000 | $3,000 | Happiness +5%, pollution -5% |

**Projects:**
| Project | Max Level | Base Cost | Tech Required | Maintenance | Key Effects |
|---------|-----------|-----------|---------------|-------------|-------------|
| University | 3 | $15,000,000 | 500 | $25,000 | Literacy +10%, happiness +5%, tech cost -5% |
| Missile Silo | 10 | $25,000,000 | 750 | $50,000 | Missile production 1/day, storage 5 |

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

## Effects & Nation Integration

### `applyEffectsToNation()`
Applies this building's effects to `window.Nation` by navigating `nationEffectKeys` (dot-notation paths like `'improvementEffects.soldierEffectiveness'`) and adding the per-effect effective value to each target property.

### `removeEffectsFromNation()`
Removes this building's contribution from `window.Nation` by subtracting the per-effect effective value from each nation effect property (floored at 0).

### `getEffectiveValue(effectKey)`
Returns the effective contribution value for a specific effect key, modified by condition, efficiency, and quantity:
```
effectiveValue = baseEffect * (condition / 100) * efficiency * quantity
```
If no `effectKey` is provided, returns the sum of all numeric effect values modified by condition/efficiency/quantity.

### `updateEffects()`
Recalculates effects, production, and consumption based on current efficiency and level:
- Effects: `baseValue * efficiency * level`
- Production: `Math.floor(baseAmount * efficiency * level)`
- Consumption: `Math.floor(baseAmount * level)`

### `updateNationCount(change)`
Updates `window.Nation.improvements` or `window.Nation.projects` count by `change`, then triggers `calculateImprovementEffects()` or `calculateProjectEffects()` on the BuildingsSystem.

---

## Upgrade & Maintenance

### `upgrade()`
Increases level by 1 if below max level. Sets efficiency to `Math.min(2.0, 1.0 + (level - 1) * 0.1)`. Calls `updateEffects()` and records an upgrade event. Returns `{ success, message, newLevel, newEfficiency }`.

### `getUpgradeCost()`
Returns `Math.floor(maintenanceCost * 10 * Math.pow(1.5, level))`.

### `repair(amount)`
Repairs condition by `amount` (default: 25), capped at 100. Calls `updateEfficiency()` if condition changed. Returns the actual condition change.

### `performMaintenance()`
Degrades condition based on time since last maintenance: `Math.min(10, daysSince * 0.5)`. Calls `updateEfficiency()`. Returns degradation amount.

### `updateEfficiency()`
Recalculates `efficiency = (condition / 100) * (1.0 + (level - 1) * 0.1)` and calls `updateEffects()`.

### `update()`
If active, calls `performMaintenance()` and `updateEffects()`. Called each game tick.

---

## Worker Management

### `assignWorkers(count)`
Assigns workers up to `workerCapacity`. Returns the number actually assigned.

### `removeWorkers(count)`
Removes workers down to 0. Returns the number actually removed.

### `getWorkerEfficiency()`
Returns `Math.min(1.0, currentWorkers / workerCapacity)`, or `1.0` if `workerCapacity === 0`.

---

## Production & Consumption

### `getActualProduction()`
Returns production adjusted by worker efficiency: `Math.floor(amount * workerEfficiency)` for each resource.

### `getActualConsumption()`
Returns consumption adjusted by worker efficiency: `Math.floor(amount * workerEfficiency)` for each resource.

### `getActualEffects()`
Returns effects adjusted by worker efficiency: `value * workerEfficiency` for each effect.

---

## Building Status

| Method | Description |
|--------|-------------|
| `activate()` | Sets `isActive = true`, logs event |
| `deactivate()` | Sets `isActive = false`, logs event |
| `destroy()` | Sets `isActive = false`, condition to 0, workers to 0 |
| `getStatusSummary()` | Returns array of status strings (e.g. `['Operational']`, `['Inactive', 'Poor Condition', 'Understaffed', 'Upgradeable']`) |

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
- Costs: maintenanceCost, upgradeCost
- Age: milliseconds since built

---

## Serialization

### `serialize()`
Returns a plain object with all building state for saving to storage.

### `static deserialize(data)`
Static factory method that creates a `Building` instance from serialized data. **Note:** Constructor arguments are `(data.name, data.type, ...)` — name comes first, then type. Restores all properties including id, timestamps, condition, efficiency, level, workers, effects, production, consumption, and event history.

---

## Export

```js
if (typeof window !== 'undefined') {
    window.Building = Building;
}
```
