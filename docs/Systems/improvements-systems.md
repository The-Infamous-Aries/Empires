# Improvements System

Handles nation improvements such as military bases, infrastructure, food/water production, mineral production/transition, pollution reduction, and administration. Each improvement type has a maximum count per nation. Slot availability is now based on infrastructure levels rather than territory count.

## Overview

- **System class:** `ImprovementsSystem`
- **Cost currency:** Money only (resource costs were removed)
- **Max count:** Per-improvement-type cap (most cap at 5, some at 1 or 4)
- **Slot limit:** 1 improvement slot per 25 infra levels (managed by `BuildingsSystem.getImprovementSlots()`)
  - Starting at 100 infra = 4 slots; 4150 infra = 166 slots (enough for all improvements)
  - Reads `nation.infra` live — lost/destroyed/sold infra immediately reduces available slots
- **Upkeep:** $25,000 per improvement per day
- **Effects:** Applied via `applyImprovementEffects()` on build/demolish, fully rebuilt via `rebuildAllImprovementEffects()` so pollution accumulators never compound

## Improvement Reference

| Improvement | Category | Max Count | Cost | Effect |
|-------------|----------|-----------|------|--------|
| Barracks | Military | 5 | $1,500,000 | +45% soldier effectiveness per barrack (stacks to 225% at 5); projects add +15% per barrack |
| Factory | Military | 5 | $2,000,000 | +45% tank effectiveness per factory (stacks to 225% at 5); projects add +15% per factory |
| Airforce Base | Military | 5 | $2,800,000 | +45% aircraft effectiveness per base (stacks to 225% at 5); projects add +15% per base |
| Harbor | Military | 5 | $2,500,000 | +45% ship effectiveness per harbor (stacks to 225% at 5); projects add +15% per harbor |
| Embassy | Diplomacy | 5 | $1,200,000 | 1 friend/foe slot per embassy; special bonuses at 5 |
| Foreign Affairs Office | Diplomacy | 1 | $3,500,000 | Required for all diplomatic actions. PERMANENT — cannot be demolished once built. |
| Internal Affairs Office | Administration | 1 | $3,000,000 | Allows selection of 16 domestic policies (edicts). PERMANENT — cannot be demolished once built. |
| Hospital | Infrastructure | 5 | $900,000 | -5% disease rate per hospital (max -25%) |
| Police Station | Infrastructure | 5 | $750,000 | -5% crime rate per station (max -25%) |
| Recycling Center | Infrastructure | 5 | $1,100,000 | -300 pollution per center |
| School | Infrastructure | 5 | $1,000,000 | +7.5% literacy rate per school (max +37.5%) |
| Casino | Economic | 5 | $1,800,000 | +5% taxable income per casino; +3% crime, -2 happiness, +100 pollution |
| Park | Infrastructure | 5 | $650,000 | +7.5% environment and +2 happiness per park; -75 pollution per park |
| Research Lab | Science | 4 | $2,200,000 | 2.5% of net income to research per lab (max 4 labs = 10%); +5 pollution, +5 disease per lab |
| Tree Plantation | Infrastructure | 5 | $450,000 | Increases environment and happiness; -150 pollution per plantation |
| Farm | Infrastructure | 5 | $500,000 | Feeds 1M population per farm; stacks to 5; 50% bonus at max stack (5M → 7.5M) |
| Well | Infrastructure | 5 | $500,000 | Provides water for 1M population per well; stacks to 5; 50% bonus at max stack (5M → 7.5M) |

### Mineral Production Improvements (raw resources)

| Improvement | Category | Max Count | Cost | Resource Produced | Rate | Pollution |
|-------------|----------|-----------|------|-------------------|------|-----------|
| Steel Mill (Iron Mine) | Production | 5 | $750,000 | Steel (raw) | 0.1/turn | +75 |
| Bronze Smelter (Tin Mine) | Production | 5 | $750,000 | Bronze (raw) | 0.1/turn | +75 |
| Lead Refinery (Lead Mine) | Production | 5 | $750,000 | Lead (raw) | 0.1/turn | +75 |
| Aluminum Smelter (Bauxite Mine) | Production | 5 | $750,000 | Aluminum (raw) | 0.1/turn | +75 |
| Copper Refinery (Copper Mine) | Production | 5 | $750,000 | Copper (raw) | 0.1/turn | +75 |
| Uranium Enrichment Plant (Uranium Mine) | Production | 5 | $750,000 | Uranium (raw) | 0.1/turn | +75 |
| Gasoline Refinery (Oil Rig) | Production | 5 | $750,000 | Gasoline (raw) | 0.1/turn | +75 |

### Mineral Transition Improvements (stage conversion)

| Improvement | Category | Max Count | Cost | Resource | Capacity | Pollution |
|-------------|----------|-----------|------|----------|----------|-----------|
| Steel Foundry | Production | 5 | $1,000,000 | Steel | 2/cycle | +125 |
| Bronze Casting (Bronze Foundry) | Production | 5 | $1,000,000 | Bronze | 2/cycle | +125 |
| Lead Casting (Lead Refinery) | Production | 5 | $1,000,000 | Lead | 2/cycle | +125 |
| Aluminum Extrusion (Aluminum Smelter) | Production | 5 | $1,000,000 | Aluminum | 2/cycle | +125 |
| Copper Drawing (Copper Refinery) | Production | 5 | $1,000,000 | Copper | 2/cycle | +125 |
| Uranium Fuel Fabrication | Production | 5 | $1,000,000 | Uranium | 2/cycle | +125 |
| Gasoline Blending (Oil Refinery) | Production | 5 | $1,000,000 | Gasoline | 2/cycle | +125 |

### Pollution Reduction Improvements

| Improvement | Category | Max Count | Cost | Pollution Reduction |
|-------------|----------|-----------|------|---------------------|
| Community Garden | Infrastructure | 5 | $800,000 | -60 per garden |
| Urban Arboretum | Infrastructure | 5 | $1,200,000 | -110 per arboretum |
| Wetlands Preserve | Infrastructure | 5 | $1,400,000 | -140 per preserve |
| Waste Treatment Plant | Infrastructure | 5 | $1,600,000 | -180 per plant |
| Emissions Scrubber Tower | Infrastructure | 5 | $1,500,000 | -160 per tower |
| Bioremediation Center | Infrastructure | 5 | $1,300,000 | -130 per center |

---

## Improvements by Category

### Military

#### Barracks
- **Max count:** 5
- **Cost:** $1,500,000
- **Effect:** +45% soldier effectiveness per barrack (stacks to 225% at 5)
- **System effect:** `soldierEffectiveness = count * 0.45` (base)
- **Enhancement:** If `projectEffects.enhancedBarracksEfficiency` is active, adds +15% per barrack (additive, so 60% per barrack with project)
- **Wonder:** Supreme Soldier Bonus stacks on top of base + project when count >= 5
- **Pollution:** +25 per barrack

#### Factory
- **Max count:** 5
- **Cost:** $2,000,000
- **Effect:** +45% tank effectiveness per factory (stacks to 225% at 5)
- **System effect:** `tankEffectiveness = count * 0.45` (base)
- **Enhancement:** If `projectEffects.enhancedFactoryEfficiency` is active, adds +15% per factory
- **Wonder:** Supreme Tank Bonus stacks on top when count >= 5
- **Pollution:** +50 per factory

#### Airforce Base
- **Max count:** 5
- **Cost:** $2,800,000
- **Effect:** +45% aircraft effectiveness per base (stacks to 225% at 5)
- **System effect:** `aircraftEffectiveness = count * 0.45` (base)
- **Enhancement:** If `projectEffects.enhancedAirforceEfficiency` is active, adds +15% per base
- **Wonder:** Supreme Aircraft Bonus stacks on top when count >= 5
- **Pollution:** +75 per base

#### Harbor
- **Max count:** 5
- **Cost:** $2,500,000
- **Effect:** +45% ship effectiveness per harbor (stacks to 225% at 5)
- **System effect:** `shipEffectiveness = count * 0.45` (base)
- **Enhancement:** If `projectEffects.enhancedNavyEfficiency` is active, adds +15% per harbor
- **Wonder:** Supreme Ship Bonus stacks on top when count >= 5
- **Pollution:** +100 per harbor

### Diplomacy

#### Embassy
- **Max count:** 5
- **Cost:** $1,200,000
- **Effect:** 1 friend/foe slot per embassy; special bonuses at 5
- **System effect:** Sets `diplomaticRelations.maxFriends` and `maxFoes` to embassy count
- **At 5 embassies:** Unlocks `canSelectBestFriend` and `canSelectNemesis`
- **Demolition:** Removing embassies below 5 nullifies best friend/nemesis and the special selection flags; excess friends/foes above the new count are removed

#### Foreign Affairs Office
- **Max count:** 1
- **Cost:** $3,500,000
- **Effect:** Required for all diplomatic actions. PERMANENT — cannot be demolished once built.
- **System effect:** Sets `improvementEffects.canDiplomacy = true`
- **Permanent:** `improvement.permanent = true` — `BuildingsSystem.demolishImprovement()` blocks demolition
- **Server requirement:** `server/world.js` checks `n.improvements.foreignAffairsOffice` before allowing treaty/diplomatic actions

### Administration

#### Internal Affairs Office
- **Max count:** 1
- **Cost:** $3,000,000
- **Effect:** Allows selection of 16 domestic policies (edicts). PERMANENT — cannot be demolished once built.
- **System effect:** Sets `improvementEffects.canSetPolicies = true` and unlocks all edict categories via `window.EdictSystem.unlockEdict(nation, cat)` for every category in `window.EDICT_CATEGORIES`
- **Permanent:** `improvement.permanent = true` — `BuildingsSystem.demolishImprovement()` blocks demolition
- **Server requirement:** `server/world.js` `setEdictsAction` checks `canSetPolicies` before allowing edict changes; UI checks `canSetPolicies` before showing Save

### Infrastructure

#### Hospital
- **Max count:** 5
- **Cost:** $900,000
- **Effect:** -5% disease rate per hospital (max -25%)
- **System effect:** `diseaseReduction = count * 0.05`

#### Police Station
- **Max count:** 5
- **Cost:** $750,000
- **Effect:** -5% crime rate per station (max -25%)
- **System effect:** `crimeReduction = count * 0.05`

#### Recycling Center
- **Max count:** 5
- **Cost:** $1,100,000
- **Effect:** -300 pollution per center
- **System effect:** `pollutionReduction += count * 300`
- **Project:** If `projectEffects.enhancedRecycling` is active, adds `recyclingHappinessPenalty = count` (-1 happiness per center)
- **Wonder:** Supreme Recycling removes the happiness penalty and adds `recyclingEnvironmentBonus = count` (+1 environment per center)

#### School
- **Max count:** 5
- **Cost:** $1,000,000
- **Effect:** +7.5% literacy rate per school (max +37.5%)
- **System effect:** `literacyBonus = count * 0.075`
- **Wonder:** Great Library adds `count * greatLibrarySchoolLiteracyBonus` (default 0.025) per school when active

#### Park
- **Max count:** 5
- **Cost:** $650,000
- **Effect:** +7.5% environment and +2 happiness per park; -75 pollution per park
- **System effects:**
  - `environmentBonus = count * 0.075`
  - `happinessFromParks = count * 2`
  - `pollutionReduction += count * 75`

#### Tree Plantation
- **Max count:** 5
- **Cost:** $450,000
- **Effect:** Increases environment quality and happiness; reduces pollution
- **System effects:**
  - `treeEnvironmentBonus = count`
  - `treeHappinessBonus = count`
  - `treePollutionReduction = count * 150`
  - `pollutionReduction += count * 150`

### Economic

#### Casino
- **Max count:** 5
- **Cost:** $1,800,000
- **Effect:** +5% taxable income per casino; increases crime and reduces happiness; +100 pollution
- **System effects:**
  - `taxableIncomeBonus = count * 0.05`
  - `crimeIncrease = count * 0.03`
  - `happinessDecrease = count * 2`
  - `pollutionProduction += count * 100`

### Science

#### Research Lab
- **Max count:** 4
- **Cost:** $2,200,000
- **Effect:** 2.5% of net income to research per lab (max 4 labs = 10%); +5 pollution and +5 disease per lab
- **System effect:** Delegated to `ResearchSystem.applyLabEffects(nation)`; pollution added via `pollutionProduction += count * 25`

### Food & Water (Basic Needs)

#### Farm
- **Max count:** 5
- **Cost:** $500,000
- **Effect:** Feeds 1M population per farm. Stacks to 5. At 5 stacks, gives 50% bonus (5M becomes 7.5M)
- **System effects:**
  - `foodCoverage = count * 1,000,000` (base)
  - `foodStackBonus = coverage * 0.50` when count >= 5
  - `foodProduction = coverage + stackBonus`
- **Project:** If `projectEffects.farmDoubling` is active, coverage doubles to 2M per farm
- **Project:** If `projectEffects.farmMaxStackBonus100` is active, max-stack bonus increases to 100% instead of 50%
- **Wonder:** Abundance Temple and Aqueduct of Life effects are reapplied when farms change

#### Well
- **Max count:** 5
- **Cost:** $500,000
- **Effect:** Provides water for 1M population per well. Stacks to 5. At 5 stacks, gives 50% bonus (5M becomes 7.5M)
- **System effects:**
  - `waterCoverage = count * 1,000,000` (base)
  - `waterStackBonus = coverage * 0.50` when count >= 5
  - `waterProduction = coverage + stackBonus`
- **Project:** If `projectEffects.wellDoubling` is active, coverage doubles to 2M per well
- **Project:** If `projectEffects.wellMaxStackBonus100` is active, max-stack bonus increases to 100% instead of 50%
- **Wonder:** Abundance Temple and Aqueduct of Life effects are reapplied when wells change

---

## Mechanics

### Building
Improvements are built via the `build_improvement` event. `BuildingsSystem.buildImprovement()` is the coordinator — it checks improvement slots (infra/25) first, then delegates to `ImprovementsSystem.buildImprovement()`. Checks performed:

1. Improvement type exists in `improvementTypes`
2. Current count is below `maxCount`
3. Nation can afford the money cost (`canAffordImprovement`)
4. Cost is deducted via `payImprovementCost`
5. Count incremented on `nation.improvements[type]`
6. Supreme military wonder bonuses recalculated first (for barracks/factory/airforceBase/harbor) so they're read during effect rebuild
7. Effects applied via `rebuildAllImprovementEffects(nation)` (full rebuild, resets pollution accumulators)
8. Farm/wonder effects reapplied for farms/wells
9. `improvement_built` event emitted

### Demolishing
Improvements are demolished via the `demolish_improvement` event. `BuildingsSystem.demolishImprovement()` is the coordinator — it checks the `permanent` flag first, then delegates to `ImprovementsSystem.demolishImprovement()`. Checks performed:

1. Nation owns at least 1 of the improvement type
2. Improvement type exists (defensive guard)
3. **Permanent guard:** if `improvement.permanent === true`, demolition is blocked (Foreign Affairs Office, Internal Affairs Office)
4. Salvage recovery: if `projectEffects.resourceRecovery` is active, refunds a percentage (default 15%, enhanced by `wonderEffects.improvementRecoveryRate` or `projectEffects.improvementRecoveryRate`) of the money cost
5. Count decremented
6. Embassy demolition triggers `handleEmbassyDemolition` (removes excess friends/foes, clears best friend/nemesis if below 5 embassies)
7. Supreme military wonder bonuses recalculated first (for military improvements)
8. Effects reapplied via `rebuildAllImprovementEffects(nation)` (full rebuild, resets pollution accumulators)
9. Farm/wonder effects reapplied for farms/wells
10. `improvement_demolished` event emitted with `recoveredResources`

### Event Binding (no double-handling)
Only `BuildingsSystem` binds to `build_improvement` and `demolish_improvement` events. `ImprovementsSystem` binds only to `get_improvement_info` to prevent double-build/double-demolish.

### Slots (live representation)
- **Improvement slots:** `Math.floor(nation.infra / 25)` total slots. Read live from `nation.infra` — if infra is lost/destroyed/sold in war, available slots drop immediately. Not affected by territory count.
- Starting at 100 infra = 4 slots; 4150 infra = 166 slots (enough to build every improvement at max count)

### Policy Effects
When `Internal Affairs Office` is built, all edict categories are unlocked via `window.EdictSystem.unlockEdict(nation, cat)` for every category in `window.EDICT_CATEGORIES` (16 domestic policies). `canSetPolicies` is set to `true`, which gates `setEdictsAction` in `server/world.js` and the edict save handler in the UI.

### Diplomatic Combat Bonus
`calculateDiplomaticCombatBonus(nation, targetNation, warParticipants)` computes a war bonus based on friends, foes, best friend, and nemesis relationships:
- +5% per friend in war (max 25% for 5 friends)
- +5% per foe in war
- +15% if best friend is in the war
- +15% if nemesis is in the war
- Capped at 125% total

### Affordability
`canAffordImprovement(nation, improvement)` checks `nation.money >= improvement.cost.money`. Resource costs are supported via `improvement.cost.resources` (compound keys like `steel-manufactured` parsed by `parseCompoundKey`) but none of the current improvement types use resource costs.

### Query Methods
- `getImprovementCount(nation, type)` — returns current count (defaults to 0)
- `getNationImprovements(nation)` — returns all improvement types with count, affordability, and maxed status
- `getImprovementInfo(data)` — returns type definition plus affordability and count for the current nation
