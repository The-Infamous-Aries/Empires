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
| `options` | object | Optional options: `{ skipNationUpdate: true }` — skip adding this unit's contribution to `Nation.militaryUnits`, `militaryStrength`, and `militaryBudget` (used by `deserialize()` because `Nation.militaryUnits` already has these counted) |

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
| `strengthContribution` | number | Strength value added to `Nation.militaryStrength` (used for accurate removal) |
| `location` | string\|null | City ID or coordinates where deployed |
| `deployment` | string | `'garrison'`, `'patrol'`, `'combat'`, `'training'` (default: `'garrison'`) |
| `assignment` | string\|null | Specific mission or target |
| `battlesParticipated` | number | Total battles this unit has fought |
| `victories` | number | Total victories |
| `losses` | number | Total defeats |
| `kills` | number | Total enemy casualties inflicted |
| `upgrades` | array | Applied upgrade objects |
| `specializations` | array | Applied specialization strings |
| `resources` | object | Resource costs for this unit type (compound keys like `'steel-manufactured'`) |
| `populationCost` | number | Citizens committed per unit (1 for combat units, 0 for missiles/nukes) |
| `populationTied` | number | Total citizens tied to this formation (`populationCost * quantity`) |
| `eventHistory` | array | Last 50 unit events |
| `contributesToNationStrength` | boolean | Whether this unit contributes to `Nation.militaryStrength` (default: true) |
| `affectedByPlayerSkills` | boolean | Whether player attack/defense skills modify strength (default: true) |
| `affectedByMilitaryMorale` | boolean | Whether nation military morale modifies strength (default: true) |

## Unit Type Data

All unit data is defined in `getWarSystemUnitData()` (also returned by `getUnitTypeData()` — both are identical).

| Unit | Strength | Maintenance/Day | Population Cost | Resource Costs (compound keys) |
|------|----------|-----------------|-----------------|--------------------------------|
| Soldiers | 0.01 | $2.50 | 1 | None |
| Tanks | 0.1 | $50.00 | 1 | `steel-manufactured`: 5, `gasoline-manufactured`: 1, `lead-manufactured`: 1 |
| Aircraft | 0.3 | $100.00 | 1 | `aluminum-manufactured`: 5, `gasoline-manufactured`: 2, `lead-manufactured`: 2 |
| Ships | 0.5 | $250.00 | 1 | `steel-manufactured`: 10, `gasoline-manufactured`: 3, `lead-manufactured`: 3 |
| Spies | 1.0 | $500.00 | 1 | `copper-manufactured`: 10, `lead-manufactured`: 10, `uranium-manufactured`: 10 |
| Missiles | 5.0 | $2,500.00 | 0 | `aluminum-manufactured`: 25, `gasoline-manufactured`: 25, `lead-manufactured`: 25 |
| Nukes | 15.0 | $7,500.00 | 0 | `aluminum-manufactured`: 100, `gasoline-manufactured`: 100, `uranium-manufactured`: 100 |

**Note:** The `upkeep`, `trainingTime`, and `equipment` properties have been removed from MilitaryUnit. Currency purchase costs are defined in `NationSystem.calculateMilitaryCost()` (`systems/nation-system.js`) and `world.js` `unitUpkeep` table — not on the unit itself.

## Initialization

### `initializeUnitData()`

Loads unit type data from `getNationUnitTypeData()` and applies base strength, maintenance cost, resources, population cost, and population tied. Recalculates `maintenance` and `effectiveStrength` from current quantity. Then calls `updateNationMilitaryStrength()` to sync with `Nation.militaryUnits[type]`, `militaryStrength`, and `militaryBudget` (unless `skipNationUpdate` is true).

### `getNationUnitTypeData()`

Retrieves unit type definition. Prefers `getWarSystemUnitData()` if `window.GameEngine.systems.military` or `window.GameEngine.systems.war` exists, otherwise falls back to `getUnitTypeData()` (which delegates to the same data).

### `getWarSystemUnitData()`

Built-in unit definitions matching Nation's war system calculations.

### `getUnitTypeData()`

Delegates to `getWarSystemUnitData()` — both return identical data (no separate fallback table).

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

## Nation Integration Methods

### `updateNationMilitaryStrength()`

Syncs this unit's contribution to `window.Nation.militaryUnits[type]` (adds `this.quantity`), `militaryStrength` (adds `calculateEffectiveStrength()` stored as `this.strengthContribution`), and `militaryBudget` (adds `calculateMaintenanceCost()`).

### `removeFromNationMilitaryStrength()`

Removes this unit's full contribution from Nation totals using **current** values — subtracts `this.quantity` from `Nation.militaryUnits[type]`, `calculateEffectiveStrength()` from `Nation.militaryStrength`, and `calculateMaintenanceCost()` from `Nation.militaryBudget`. This is complementary with `takeCasualties()` and does NOT double-count.

### `takeCasualties(casualties)`

Reduces `this.quantity` by `min(casualties, this.quantity)`. If quantity reaches 0, sets `isActive = false`. Proportionally reduces `Nation.militaryStrength`, `Nation.militaryUnits[this.type]`, and `Nation.militaryBudget` based on casualties lost. After casualties, recalculates `baseStrength`, `maintenance`, `effectiveStrength`, and `strengthContribution` so multiple casualty events remain accurate. Returns the number of units actually lost.

**Note:** This is called by `WarSystem.applyCasualties()` and `WarSystem.applyUnitCasualty()` — `WarSystem` no longer separately updates `Nation.militaryUnits` to avoid double-reduction.

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

### `reinforce(additionalUnits)`

Removes current contribution from Nation, increases `this.quantity` by `additionalUnits`, recalculates all derived values (`baseStrength`, `maintenance`, `effectiveStrength`), re-adds updated contribution to Nation. Fires a `'reinforcement'` event. Does NOT call `PopulationSystem.enlistMilitaryPopulation()` — population tracking is handled by `Nation.trainMilitary()` before this unit is created.

### `split(splitQuantity)`

Creates a new `MilitaryUnit` with `splitQuantity` units taken from this formation. Removes the original unit's full contribution from Nation, registers the new unit separately, recalculates both units' derived values, and re-adds the reduced original contribution. The new unit is fully registered with Nation's military tracking. Experience, morale, condition, upgrades, and specializations are copied. Parent's `quantity` is reduced by `splitQuantity`. Fires an `'organization'` event.

### `merge(otherUnit)`

Absorbs another unit of the same type into this one. Removes both units' contributions from Nation, marks `otherUnit` as inactive with quantity 0, weighted-averages experience/morale/condition by quantity, merges upgrades and specializations (deduplicated), recalculates derived values, re-adds merged contribution to Nation. Fires an `'organization'` event. Returns `false` if types don't match.

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
| `maintenance` | Daily cost (no `upkeep` field) |
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

Returns a plain object with all unit state including `id`, `type`, `quantity`, `nationId`, `created`, `isActive`, `condition`, `experience`, `morale`, `location`, `deployment`, `assignment`, combat history, upgrades, specializations, and event history. Does NOT include `upkeep` or `equipment` (removed fields).

### `static deserialize(data)`

Restores from serialized data. Passes `{ skipNationUpdate: true }` to the constructor, recalculates `baseStrength`, `maintenance`, `effectiveStrength`, then calls `updateNationMilitaryStrength()` to register the deserialized unit with Nation's military tracking.

## Export

```js
if (typeof window !== 'undefined') {
    window.MilitaryUnit = MilitaryUnit;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MilitaryUnit;
}
```

## How MilitaryUnit Relates to PopulationSystem

- **Citizens are NOT removed from population when units are trained.** `Nation.trainMilitary()` calls `PopulationSystem.enlistMilitaryPopulation(amount, type)` which marks actual citizens as `isMilitary = true` with `unitType` set — they keep their jobs, relationships, and everything else.
- **Unit losses kill citizens.** `WarSystem.applyCasualties()` → `MilitaryUnit.takeCasualties()` → `PopulationSystem.killMilitaryCitizensForUnitLoss(unitType, count)` finds citizens with `isMilitary && unitType === type` and kills exactly 1 marked citizen per unit destroyed.
- **Military citizens become veterans at Senior age.** `PopulationSystem.processDailyAging()` detects when a military citizen reaches Senior age, decrements `Nation.militaryUnits[unitType]`, and sets `isVeteran = true`, `isMilitary = false` — the citizen stays in population, only the unit is decommissioned.
- **50% military cap.** `Nation.trainMilitary()` enforces `calculateWeightedMilitaryPopulation() / totalPopulation <= 0.50` where weights are soldiers=1, tanks=2, aircraft=3, ships=5 (spies/missiles/nukes = 0).

## NationSystem Currency Purchase Costs (reference)

Defined in `systems/nation-system.js` `calculateMilitaryCost()`:

| Unit | Money Cost | Population Cost | Tech Required |
|------|-----------|-----------------|---------------|
| Soldiers | $10 each | 1 | 0 |
| Tanks | $250 each | 1 | 150 |
| Aircraft | $500 each | 1 | 300 |
| Ships | $1,000 each | 1 | 450 |
| Spies | $10,000 each | 1 | 0 (+ spyOperations prerequisite) |
| Missiles | $750,000 each | 0 | 0 (+ missileSilo prerequisite) |
| Nukes | $2,500,000 each | 0 | 0 (+ nuclearWarheadFacility prerequisite) |
