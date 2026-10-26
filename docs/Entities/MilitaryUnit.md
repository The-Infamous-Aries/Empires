# MilitaryUnit Entity

Represents individual military units and formations. Integrates with Nation's `WarSystem`, `PopulationSystem`, `Player` combat skills, and military calculations. Handles unit lifecycle, combat operations, strength calculations, maintenance, population integration, and serialization.

## Overview

- **Class:** `MilitaryUnit`
- **Globally available as:** `window.MilitaryUnit`
- **Constructor:** `new MilitaryUnit(type, quantity, nationId, options)`
- **Types:** `'soldiers'`, `'tanks'`, `'aircraft'`, `'ships'`, `'spies'`, `'missiles'`, `'nukes'`

## Constructor Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Unit type: `'soldiers'`, `'tanks'`, `'aircraft'`, `'ships'`, `'spies'`, `'missiles'`, `'nukes'` |
| `quantity` | number | Number of units in this formation |
| `nationId` | string\|null | ID of the nation this unit belongs to |
| `options` | object | Optional: `{ skipInit: true }` — skip automatic population enlistment (used by `deserialize`) |

## Instance Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Auto-generated unique ID (`unit_<timestamp>_<random>`) |
| `type` | string | Unit type |
| `quantity` | number | Number of units currently in this formation |
| `nationId` | string\|null | Owning nation ID |
| `created` | number | Timestamp when unit was created |
| `isActive` | boolean | Whether the unit is active (false if destroyed or decommissioned) |
| `condition` | number | 0-100 condition/readiness (starts at 100) |
| `experience` | number | Combat experience (starts at 0) |
| `morale` | number | 0-100 unit morale (starts at 100; affected by `Nation.nationStats.militaryMorale`) |
| `baseStrength` | number | Base combat strength (`unitData.strength * quantity`) |
| `effectiveStrength` | number | Effective strength after all modifiers |
| `maintenance` | number | Daily maintenance cost for all units in this formation |
| `populationCost` | number | Population cost per single unit (e.g. 0.1 for soldiers, 2 for tanks) |
| `populationSource` | object\|null | Tracks which demographics were depleted: `{ total, breakdown, citizens }` |
| `location` | string\|null | City ID or coordinates where deployed |
| `deployment` | string | `'garrison'`, `'patrol'`, `'combat'`, `'training'` (default: `'garrison'`) |
| `assignment` | string\|null | Specific mission or target |
| `battlesParticipated` | number | Total battles this unit has fought |
| `victories` | number | Total victories |
| `losses` | number | Total defeats |
| `kills` | number | Total enemy casualties inflicted |
| `upgrades` | array | Applied upgrades |
| `specializations` | array | Applied specializations |
| `eventHistory` | array | Last 50 unit events |
| `contributesToNationStrength` | boolean | Whether this unit contributes to `Nation.militaryStrength` (default: true) |

---

## Initialization

### `initializeUnitData()`

Loads unit type data from `getNationUnitTypeData()` and applies base strength, maintenance cost, and population cost. Then enlists population from demographics via `PopulationSystem.enlistMilitaryPopulation()` if the unit has a population cost.

### `getNationUnitTypeData()`

Retrieves unit type definition. Prefers `getWarSystemUnitData()` if `window.GameEngine.systems.military` or `window.GameEngine.systems.war` exists, otherwise falls back to `getUnitTypeData()`.

### `getWarSystemUnitData()`

Built-in unit definitions matching Nation's war system:

| Unit | Strength | Maintenance/Day | Pop Cost Per Unit |
|------|----------|-----------------|-------------------|
| Soldiers | 1 | $0.05 | 0.1 (10 per 100, rounded up) |
| Tanks | 25 | $20 | 2 |
| Aircraft | 100 | $75 | 3 |
| Ships | 200 | $200 | 5 |
| Spies | 5 | $15,000 | 10 |
| Missiles | 500 | $20,000 | 0 |
| Nukes | 2000 | $50,000 | 0 |

### `getUnitTypeData()`

Fallback unit definitions (same stats as above, minus `effectivenessBonus`).

### `static createWithoutInit(type, quantity, nationId)`

Creates a `MilitaryUnit` without calling `initializeUnitData()` — used by `deserialize()` to avoid re-enlisting population that was already saved.

### `static deserialize(data)`

Static factory that restores a `MilitaryUnit` from serialized data. Uses `createWithoutInit()` so previously-enlisted population is restored directly without double-enlisting.

---

## Strength Calculations

### `calculateUnitStrength()`

Returns `unitData.strength * this.quantity`.

### `calculateEffectiveStrength()`

Applies modifiers in order:

1. **Condition:** `* (condition / 100)`
2. **Experience:** `* (1 + min(0.5, experience / 1000))` (max +50%)
3. **Morale:** `* moraleMultiplier` (uses `Nation.nationStats.militaryMorale`, converting percentage to multiplier if needed)
4. **Nation improvements:** `* (1 + bonus)` based on `unitData.effectivenessBonus`
5. **Player skills:** `+ (attackBonus + defenseBonus) * quantity` (flat addition)
6. **Government:** `* governmentType.militaryBonus`

Returns the floored result and stores it in `this.effectiveStrength`.

### `calculateMaintenanceCost()`

Returns `unitData.maintenance * quantity`, reduced by Player logistics skill efficiency.

### `static getMaxUnitsFromPopulation(type, availablePopulation)`

Returns how many units of a type can be enlisted from available population:

| Unit | Pop Cost Per Unit | Max Units Formula |
|------|-------------------|-------------------|
| Soldiers | 0.1 | `floor(availablePopulation / 0.1)` = 10× population |
| Tanks | 2 | `floor(availablePopulation / 2)` |
| Aircraft | 3 | `floor(availablePopulation / 3)` |
| Ships | 5 | `floor(availablePopulation / 5)` |
| Spies | 10 | `floor(availablePopulation / 10)` |
| Missiles | 0 | `Infinity` (no population cost) |
| Nukes | 0 | `Infinity` (no population cost) |

---

## Population System Integration

Military units draw from the **Population System** (universal truth for demographics). Only **Teen through Older** citizens are military-eligible. Newborn–Child, Senior, and Elderly cannot be recruited.

### Enlistment Order

When population is depleted, age groups are taken in this order:

1. **Young Adult**
2. **Adult**
3. **Middle Aged**
4. **Older**
5. **Teen**

### `decommission()`

Returns all enlisted citizens to their **original age groups** (age is frozen at enlistment time). A Teen recruited today and decommissioned two years later returns as a Teen. Removes this unit's contribution from `Nation.militaryUnits`, `militaryStrength`, and `militaryBudget`.

### `recordCombatDeaths(count)`

Records combat deaths via `PopulationSystem.recordMilitaryCombatDeaths()`. Combat-dead population is **not returned** to demographics. Replacement births are scheduled after a **2-turn buffer**.

### `takeCasualties(casualties)`

Reduces unit quantity, updates Nation's military totals proportionally, and marks unit inactive if quantity reaches 0. Combat deaths are recorded as Killed in Combat.

---

## Nation Integration Methods

### `updateNationMilitaryStrength()`

Syncs this unit's contribution to `window.Nation.militaryUnits[type]`, `militaryStrength`, and `militaryBudget`. Uses **delta tracking** (`_lastNationQuantity`) so repeated calls don't double-count.

### `removeFromNationMilitaryStrength()`

Removes this unit's full contribution from Nation totals. Resets `_lastNationQuantity` to 0.

---

## Unit Operations

### `deploy(location, deployment)`

Sets `location` and `deployment`. Combat deployment reduces morale by 10; training deployment increases morale by 5.

### `recall()`

Sets `location = null`, `deployment = 'garrison'`, `assignment = null`. Increases morale by 5.

### `repair(amount)`

Repairs condition by `amount` (default: 25), capped at 100. Returns the actual condition change.

### `resupply()`

Increases condition by 15 and morale by 10.

### `train(type)`

Trains the unit, granting experience and affecting morale/condition:

| Type | Experience | Morale | Condition |
|------|-----------|--------|-----------|
| `general` | +10 | +5 | -5 |
| `combat` | +20 | -5 | -10 |
| `technical` | +15 | 0 | 0 |
| `leadership` | +5 | +10 | 0 |

---

## Combat Operations

### `engageCombat(enemy, terrain)`

Calculates combat outcome between this unit and an enemy unit. Rolls random strength (0.8–1.2× effective strength) for both sides and applies terrain modifiers:

| Terrain | Defender Bonus | Attacker Bonus |
|---------|---------------|----------------|
| Urban | Defenders ×1.2 | Attackers ×0.9 |
| Forest | Infantry ×1.1 | Vehicles ×0.8 |
| Desert | Vehicles ×1.1 | Infantry ×0.9 |
| Naval | Ships ×1.3 | Land ×0.3 |
| Air | Aircraft ×1.2 | Ground ×0.7 |

Returns `{ result, damage, casualties, myRoll, enemyRoll }`.

### `applyCombatResults(outcome)`

Applies casualties via `takeCasualties()`, records combat deaths in Population System, updates experience/morale based on result, degrades condition by 20, and records enemy combat deaths.

### `takeCasualties(casualties)`

Removes `min(casualties, quantity)` units, updates Nation's military totals before quantity changes, and marks unit inactive if quantity reaches 0.

---

## Upgrades & Specializations

### `addUpgrade(upgrade)`

Adds an upgrade object `{ name, strengthBonus, maintenanceIncrease }` to `this.upgrades`.

### `addSpecialization(specialization)`

Adds a specialization string to `this.specializations` (deduplicated).

---

## Unit Management

### `reinforce(additionalUnits)`

Enlists additional population via `PopulationSystem.enlistMilitaryPopulation()` and increases quantity. Falls back to directly adding units if Population System is unavailable or no eligible population remains.

### `split(splitQuantity)`

Creates a new `MilitaryUnit` with `splitQuantity` units taken from this formation. Population citizens are split proportionally (LIFO). Parent's Nation totals are reduced by `splitQuantity`; the new unit registers itself with Nation via its constructor.

### `merge(otherUnit)`

Absorbs another unit of the same type into this one. Experience, morale, and condition are weighted-averaged by quantity. Nation totals are updated: `otherUnit`'s contribution is removed, this unit's contribution is recalculated for the merged quantity. Marks `otherUnit` as inactive with quantity 0.

---

## Events & History

### `addEvent(description, type)`

Adds an event to `eventHistory` with id, timestamp, description, and type. Keeps only the last 50 events.

### `getRecentEvents(limit)`

Returns the most recent `limit` events in reverse chronological order (default: 10).

---

## Statistics & Information

### `getStats()`

Returns a complete statistics object:

| Field | Description |
|-------|-------------|
| `id`, `type`, `quantity` | Identity |
| `baseStrength`, `effectiveStrength`, `condition`, `experience`, `morale` | Combat stats |
| `populationCost`, `populationEnlisted`, `populationBreakdown` | Population stats |
| `battlesParticipated`, `victories`, `losses`, `kills`, `winRate` | Combat history |
| `location`, `deployment`, `assignment` | Deployment |
| `maintenance` | Daily cost |
| `upgradeCount`, `specializationCount` | Modifications |
| `isActive`, `age` | Status |

### `getCombatRating()`

Returns a rating string based on combined strength/experience/morale:

| Rating | Threshold |
|--------|-----------|
| Elite | combined ≥ 15 |
| Veteran | combined ≥ 10 |
| Regular | combined ≥ 6 |
| Trained | combined ≥ 3 |
| Recruit | below 3 |

### `getStatusSummary()`

Returns an array of status strings: `['Inactive']`, `['Poor Condition']`, `['Low Morale']`, `['No Units']`, `['In Combat']`, or `['Operational']`.

---

## Update Cycle

### `update()`

Called each game tick if active:
- Combat deployment: condition -2
- Patrol deployment: condition -0.5
- Garrison deployment: morale +0.5, experience -0.1
- Combat deployment: morale -1

---

## Serialization

### `serialize()`

Returns a plain object with all unit state including `populationSource` and `populationCost` for save/load.

### `static deserialize(data)`

Restores from serialized data using `createWithoutInit()` to avoid double-enlisting population.

---

## Export

```js
if (typeof window !== 'undefined') {
    window.MilitaryUnit = MilitaryUnit;
}
```

---

## Population Truth

| Operation | Population Effect |
|-----------|------------------|
| Create unit | Depletes Teen→Older via `enlistMilitaryPopulation()` |
| Decommission | Returns citizens to **original age groups** (age frozen) |
| Destroyed in combat | Recorded as Killed in Combat; replacement births after 2-turn buffer |
| Reinforce | Enlists additional population |
| Split/Merge | Population citizens moved proportionally |

**100% recruitment:** `enlistMilitaryPopulation()` takes `min(needed, eligible)`, so you can recruit all military-eligible population.
