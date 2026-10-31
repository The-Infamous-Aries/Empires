# MilitaryUnit Entity

Represents an individual military unit formation — a group of soldiers, tanks, aircraft, ships, spies, missiles, or nukes belonging to a nation. Integrates with `Nation`'s military strength/budget tracking, `PopulationSystem` (citizen enlistment), `Player` combat skills, and `WarSystem` combat operations. Handles unit lifecycle, strength calculations, condition/morale decay, combat casualties, and save/load serialization.

## Overview

| Item | Value |
|------|-------|
| **Class:** | `MilitaryUnit` |
| **Global instance:** | `window.MilitaryUnit` |
| **Constructor:** | `new MilitaryUnit(type, quantity, nationId, options)` |
| **Types:** | `'soldiers'`, `'tanks'`, `'aircraft'`, `'ships'`, `'spies'`, `'missiles'`, `'nukes'` |
| **Loaded in:** | `index.html` (after `entities/Nation.js`, before `core/game-engine.js`) |

## Constructor Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Unit type: `'soldiers'`, `'tanks'`, `'aircraft'`, `'ships'`, `'spies'`, `'missiles'`, `'nukes'` |
| `quantity` | number | Number of units in this formation |
| `nationId` | string\|null | ID of the nation this unit belongs to |
| `options` | object | Optional options: `{ skipNationUpdate: true }` — skip adding this unit's contribution to `Nation.militaryUnits`, `militaryStrength`, and `militaryBudget` (used by `deserialize()` and `WarSystem.getMilitaryUnitEntities()` because `Nation.militaryUnits` already has these counted) |

## Instance Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Auto-generated unique ID (`unit_<timestamp>_<random>`) |
| `type` | string | Unit type |
| `quantity` | number | Number of units currently in this formation |
| `nationId` | string\|null | Owning nation ID |
| `created` | number | Timestamp when unit was created |
| `isActive` | boolean | Whether the unit is active (false if destroyed/decommissioned) |
| `condition` | number | 0-100 condition/readiness (starts at 100; degrades in combat/patrol) |
| `experience` | number | Combat experience (starts at 0; max +50% strength bonus) |
| `morale` | number | 0-100 unit morale (starts at 100; affected by `Nation.nationStats.militaryMorale`) |
| `baseStrength` | number | Base combat strength (`unitData.strength * quantity`) |
| `effectiveStrength` | number | Effective strength after all modifiers |
| `maintenance` | number | Daily maintenance cost for all units in this formation |
| `strengthContribution` | number | Strength value added to `Nation.militaryStrength` at creation time (used for accurate removal) |
| `location` | string\|null | City ID or coordinates where deployed |
| `deployment` | string | `'garrison'`, `'patrol'`, `'combat'`, `'training'` (default: `'garrison'`) |
| `assignment` | string\|null | Specific mission or target |
| `battlesParticipated` | number | Total battles this unit has fought |
| `victories` | number | Total victories |
| `losses` | number | Total defeats |
| `kills` | number | Total enemy casualties inflicted |
| `upgrades` | array | Applied upgrade objects |
| `specializations` | array | Applied specialization strings |
| `equipment` | object | Unit equipment loadout |
| `eventHistory` | array | Last 50 unit events |
| `contributesToNationStrength` | boolean | Whether this unit contributes to `Nation.militaryStrength` (default: true) |
| `affectedByPlayerSkills` | boolean | Whether player attack/defense skills modify strength (default: true) |
| `affectedByMilitaryMorale` | boolean | Whether nation military morale modifies strength (default: true) |

## Initialization

### `initializeUnitData()`

Loads unit type data from `getNationUnitTypeData()` and applies base strength (`unitData.strength * quantity`), maintenance cost, upkeep cost, equipment, training time, and population cost. Then calls `updateNationMilitaryStrength()` to sync with `Nation.militaryUnits[type]`, `militaryStrength`, and `militaryBudget` (unless `skipNationUpdate` is true).

### `getNationUnitTypeData()`

Retrieves unit type definition. Prefers `getWarSystemUnitData()` if `window.GameEngine.systems.military` or `window.GameEngine.systems.war` exists, otherwise falls back to `getUnitTypeData()` (which now delegates to the same data).

### `getWarSystemUnitData()`

Built-in unit definitions matching Nation's war system:

| Unit | Strength | Maintenance/Day | Upkeep/Day | Population Cost | Training Time (days) |
|------|----------|-----------------|------------|-----------------|---------------------|
| Soldiers | 1 | $100 | $50 | 1 | 7 |
| Tanks | 25 | $500 | $250 | 5 | 30 |
| Aircraft | 100 | $2,000 | $1,000 | 10 | 60 |
| Ships | 200 | $4,000 | $2,000 | 20 | 90 |
| Spies | 5 | $1,000 | $500 | 2 | 120 |
| Missiles | 500 | $200 | $100 | 0 | 1 |
| Nukes | 2000 | $2,000 | $1,000 | 0 | 1 |

### `getUnitTypeData()`

Now delegates to `getWarSystemUnitData()` — both return identical data (no separate fallback table).

## Strength Calculations

### `calculateUnitStrength()`

Returns `unitData.strength * this.quantity`.

### `calculateEffectiveStrength()`

Applies modifiers in order:

1. **Condition:** `* (condition / 100)`
2. **Experience:** `* (1 + min(0.5, experience / 1000))` (max +50%)
3. **Morale:** if `affectedByMilitaryMorale` and `Nation.nationStats.militaryMorale` exists, multiplies by that value; otherwise multiplies by `this.morale / 100`
4. **Nation improvements:** `* (1 + bonus)` based on `unitData.effectivenessBonus` (e.g. `soldierEffectiveness`)
5. **Player skills:** `+ (attackBonus + defenseBonus) * quantity` (flat addition from `window.Player.getSkillValue()`)
6. **Government:** `* governmentType.militaryBonus`

Returns the floored result and stores it in `this.effectiveStrength`.

### `calculateMaintenanceCost()`

Returns `unitData.maintenance * quantity`, reduced by Player logistics skill efficiency (`window.Player.getSkillValue('logistics')`).

### `calculateUpkeep()`

Returns `unitData.upkeep * quantity`.

## Nation Integration Methods

### `updateNationMilitaryStrength()`

Syncs this unit's contribution to `window.Nation.militaryUnits[type]` (adds `this.quantity`), `militaryStrength` (adds `calculateEffectiveStrength()` stored as `this.strengthContribution`), and `militaryBudget` (adds `this.maintenance`). Captures `strengthContribution` at creation time so removal can accurately reverse the addition even if condition/morale later changed.

### `removeFromNationMilitaryStrength()`

Removes this unit's full contribution from Nation totals using `this.strengthContribution` (captured at creation time), not a recalculated `calculateEffectiveStrength()` — preventing drift if condition/morale changed since creation. Subtracts `this.quantity` from `Nation.militaryUnits[type]`, `strengthContribution` from `Nation.militaryStrength`, and `this.maintenance` from `Nation.militaryBudget`.

### `takeCasualties(casualties)`

Reduces `this.quantity` by `min(casualties, this.quantity)`. If quantity reaches 0, sets `isActive = false`. Proportionally reduces `Nation.militaryStrength`, `Nation.militaryUnits[this.type]`, and `Nation.militaryBudget` based on casualties lost. Returns the number of units actually lost. **Note:** This is called by `WarSystem.applyCasualties()` and `WarSystem.applyUnitCasualty()` — `WarSystem` no longer separately updates `Nation.militaryUnits` to avoid double-reduction.

### `takeCasualties()` order of operations

1. Calculate `lost = min(casualties, quantity)`
2. Reduce `quantity` by `lost`
3. Fire `'casualties'` event if `lost > 0`
4. If `quantity <= 0`: set `isActive = false`, fire `'destroyed'` event
5. Reduce `Nation.militaryStrength`, `Nation.militaryUnits[type]`, `Nation.militaryBudget` proportionally
6. Return `lost`

## Unit Operations

### `deploy(location, deployment = 'patrol')`

Sets `location` and `deployment`. Combat deployment reduces morale by 10 (capped at 50); training deployment increases morale by 5 (capped at 100). Fires a `'deployment'` event.

### `recall()`

Sets `location = null`, `deployment = 'garrison'`, `assignment = null`. Increases morale by 5. Fires a `'deployment'` event.

### `repair(amount = 25)`

Increases `condition` by `amount` (capped at 100). Returns actual condition change. Fires a `'maintenance'` event.

### `resupply()`

Increases `condition` by 15 and `morale` by 10 (both capped at 100). Fires a `'maintenance'` event.

### `train(type = 'general')`

Trains the unit:

| Type | Experience | Morale | Condition |
|------|-----------|--------|-----------|
| `general` | +10 | +5 | -5 |
| `combat` | +20 | -5 | -10 |
| `technical` | +15 | 0 | 0 |
| `leadership` | +5 | +10 | 0 |

Fires a `'training'` event.

## Combat Operations

### `engageCombat(enemy, terrain = 'normal')`

Calculates combat outcome between this unit and an enemy unit. Rolls random strength (0.8–1.2× effective strength) for both sides, applies terrain modifiers, determines result, and applies combat results.

Terrain modifiers:

| Terrain | Defender Bonus | Attacker Bonus |
|---------|---------------|----------------|
| Urban | Defenders ×1.2 | Attackers ×0.9 |
| Forest | Infantry ×1.1 | Vehicles ×0.8 |
| Desert | Vehicles ×1.1 | Infantry ×0.9 |
| Naval | Ships ×1.3 | Land ×0.3 |
| Air | Aircraft ×1.2 | Ground ×0.7 |

Returns `{ result, damage, casualties, myRoll, enemyRoll }`.

### `applyCombatResults(outcome)`

Applies casualties via `takeCasualties()`, updates victories/losses and experience/morale based on result (victory: +25 exp, +10 morale; defeat: +10 exp, -15 morale capped at 25; draw: +15 exp, -5 morale capped at 50), degrades condition by 20 (capped at 10 minimum), and adds `outcome.casualties` to `this.kills`. Fires a `'combat'` event.

### `takeCasualties(casualties)`

See above under Nation Integration Methods.

## Upgrades & Specializations

### `addUpgrade(upgrade)`

Adds an upgrade object `{ name, strengthBonus, maintenanceIncrease, added: timestamp }` to `this.upgrades`. Fires an `'upgrade'` event.

### `addSpecialization(specialization)`

Adds a specialization string to `this.specializations` (deduplicated). Fires a `'training'` event.

## Unit Management

### `reinforce(additionalUnits)`

Increases `this.quantity` by `additionalUnits`. Fires a `'reinforcement'` event. Does NOT call `PopulationSystem.enlistMilitaryPopulation()` — population tracking is handled by `Nation.trainMilitary()` before this unit is created.

### `split(splitQuantity)`

Creates a new `MilitaryUnit` with `splitQuantity` units taken from this formation. The new unit passes `{ skipNationUpdate: true }` so it doesn't double-count against `Nation.militaryUnits` (the parent unit's Nation contribution already covers these units). Experience, morale, condition, upgrades, and specializations are copied. Parent's `quantity` is reduced by `splitQuantity`. Fires an `'organization'` event.

### `merge(otherUnit)`

Absorbs another unit of the same type into this one. Experience, morale, and condition are weighted-averaged by quantity. Merges upgrades and specializations (deduplicated). Marks `otherUnit` as inactive with quantity 0. `otherUnit.removeFromNationMilitaryStrength()` is NOT called here — the caller is responsible for removing the other unit from Nation totals if needed.

## Events & History

### `addEvent(description, type = 'info')`

Adds an event to `eventHistory` with id, timestamp, description, and type. Keeps only the last 50 events.

### `getRecentEvents(limit = 10)`

Returns the most recent `limit` events in reverse chronological order.

## Statistics & Information

### `getStats()`

Returns a complete statistics object:

| Field | Description |
|-------|-------------|
| `id`, `type`, `quantity` | Identity |
| `baseStrength`, `effectiveStrength`, `condition`, `experience`, `morale` | Combat stats |
| `maintenance`, `upkeep` | Daily costs |
| `battlesParticipated`, `victories`, `losses`, `kills`, `winRate` | Combat history |
| `location`, `deployment`, `assignment` | Deployment |
| `upgradeCount`, `specializationCount` | Modifications |
| `isActive`, `age` | Status |
| `nationId` | Owning nation |

### `getCombatRating()`

Returns a rating string based on combined strength/experience/morale:

| Rating | Threshold |
|--------|-----------|
| Elite | combined ≥ 15 |
| Veteran | combined ≥ 10 |
| Regular | combined ≥ 6 |
| Trained | combined ≥ 3 |
| Recruit | below 3 |

Formula: `combined = (effectiveStrength / 100) + (experience / 50) + (morale / 50)`

### `getStatusSummary()`

Returns an array of status strings: `['Inactive']`, `['Poor Condition']`, `['Low Morale']`, `['No Units']`, `['In Combat']`, or `['Operational']`.

## Update Cycle

### `update()`

Called each game tick if active (note: not currently invoked by any game system — exists for future use):

- Combat deployment: condition -2
- Patrol deployment: condition -0.5
- Garrison deployment: morale +0.5, experience -0.1
- Combat deployment: morale -1

## Serialization

### `serialize()`

Returns a plain object with all unit state including `id`, `type`, `quantity`, `nationId`, `created`, `isActive`, `condition`, `experience`, `morale`, `location`, `deployment`, `assignment`, combat history, upgrades, specializations, equipment, and event history.

### `static deserialize(data)`

Restores from serialized data. Passes `{ skipNationUpdate: true }` to the constructor so the deserialized unit does NOT double-count against `Nation.militaryUnits`/`militaryStrength`/`militaryBudget` — those were already populated when the unit was originally created.

## Export

```js
if (typeof window !== 'undefined') {
    window.MilitaryUnit = MilitaryUnit;
}
```

## How MilitaryUnit Relates to PopulationSystem

- **Citizens are NOT removed from population when units are trained.** `Nation.trainMilitary()` calls `PopulationSystem.enlistMilitaryPopulation(amount, type)` which marks actual citizens as `isMilitary = true` with `unitType` set — they keep their jobs, relationships, and everything else.
- **Unit losses kill citizens.** `WarSystem.applyCasualties()` → `MilitaryUnit.takeCasualties()` → `Citizen.die()` → `CitizenTiesSystem.handleCitizenDeath()` (preserves family roles, tracks widowhood).
- **Military citizens become veterans at Senior age.** `PopulationSystem.processDailyAging()` detects when a military citizen reaches Senior age, decrements `Nation.militaryUnits[unitType]`, and sets `isVeteran = true`, `isMilitary = false` — the citizen stays in population, only the unit is decommissioned.
- **50% military cap.** `Nation.trainMilitary()` enforces `calculateWeightedMilitaryPopulation() / totalPopulation <= 0.50` where weights are soldiers=1, tanks=2, aircraft=3, ships=5 (spies/missiles/nukes = 0).
