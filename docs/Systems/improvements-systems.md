# Improvements System

Handles nation improvements such as ports, military bases, infrastructure, food/water production, and more. Improvements are built on territory squares and each has a maximum count per nation.

## Overview

- **System class:** `ImprovementsSystem`
- **Cost currency:** Money only (resource costs were removed)
- **Max count:** Per-improvement-type cap (most cap at 5, some at 1 or 4)
- **Slot limit:** 1 improvement slot per territory square (managed by `BuildingsSystem`)
- **Upkeep:** $25,000 per improvement per day
- **Effects:** Applied via `applyImprovementEffects()` on build, recalculated daily in `World.refresh()`

## Improvement Reference

| Improvement | Category | Max Count | Cost | Effect |
|-------------|----------|-----------|------|--------|
| Port | Trade | 4 | $800,000 | Enables 1 trade partner per port |
| Barracks | Military | 5 | $1,500,000 | +10% soldier effectiveness per barracks |
| Factory | Military | 5 | $2,000,000 | +10% tank effectiveness per factory |
| Airforce Base | Military | 5 | $2,800,000 | +10% aircraft effectiveness per base |
| Harbor | Military | 5 | $2,500,000 | +10% ship effectiveness per harbor |
| Embassy | Diplomacy | 5 | $1,200,000 | 1 friend/foe slot per embassy; special bonuses at 5 |
| Foreign Affairs Office | Diplomacy | 1 | $3,500,000 | Required for all diplomatic actions |
| Internal Affairs Office | Administration | 1 | $3,000,000 | Allows selection of 10 domestic policies |
| Hospital | Infrastructure | 5 | $900,000 | -5% disease rate per hospital (max -25%) |
| Police Station | Infrastructure | 5 | $750,000 | -5% crime rate per station (max -25%) |
| Recycling Center | Infrastructure | 5 | $1,100,000 | -5% pollution per center (max -25%) |
| School | Infrastructure | 5 | $1,000,000 | +7.5% literacy rate per school (max +37.5%) |
| Casino | Economic | 5 | $1,800,000 | +5% taxable income per casino; +3% crime, -2 happiness |
| Park | Infrastructure | 5 | $650,000 | +7.5% environment and +2 happiness per park |
| Research Lab | Science | 5 | $2,200,000 | -3% research time per lab (max -15%) |
| Tree Plantation | Infrastructure | 5 | $450,000 | Increases environment quality and happiness, reduces pollution |
| Farm | Infrastructure | 5 | $500,000 | Feeds 1M population per farm; stacks to 5; 50% bonus at max |
| Well | Infrastructure | 5 | $500,000 | Provides water for 1M population per well; stacks to 5; 50% bonus at max |

---

## Improvements by Category

### Trade

#### Port
- **Max count:** 4
- **Cost:** $800,000
- **Effect:** Enables 1 trade partner per port
- **System effect:** Sets `improvementEffects.maxTradePartners = count`
- **Notes:** Limited to 4 total. Each port unlocks one additional trade agreement slot.

### Military

#### Barracks
- **Max count:** 5
- **Cost:** $1,500,000
- **Effect:** +10% soldier effectiveness per barracks
- **System effect:** `soldierEffectiveness = count * 0.10` (base)
- **Enhancement:** If `projectEffects.enhancedBarracksEfficiency` is active, bonus increases to 20% per barracks.
- **Wonder:** Supreme Soldier Bonus applies when count >= 5.

#### Factory
- **Max count:** 5
- **Cost:** $2,000,000
- **Effect:** +10% tank effectiveness per factory
- **System effect:** `tankEffectiveness = count * 0.10` (base)
- **Enhancement:** If `projectEffects.enhancedFactoryEfficiency` is active, bonus increases to 20% per factory.
- **Wonder:** Supreme Tank Bonus applies when count >= 5.

#### Airforce Base
- **Max count:** 5
- **Cost:** $2,800,000
- **Effect:** +10% aircraft effectiveness per base
- **System effect:** `aircraftEffectiveness = count * 0.10` (base)
- **Enhancement:** If `projectEffects.enhancedAirforceEfficiency` is active, bonus increases to 20% per base.
- **Wonder:** Supreme Aircraft Bonus applies when count >= 5.

#### Harbor
- **Max count:** 5
- **Cost:** $2,500,000
- **Effect:** +10% ship effectiveness per harbor
- **System effect:** `shipEffectiveness = count * 0.10` (base)
- **Enhancement:** If `projectEffects.enhancedNavyEfficiency` is active, bonus increases to 20% per harbor.
- **Wonder:** Supreme Ship Bonus applies when count >= 5.

### Diplomacy

#### Embassy
- **Max count:** 5
- **Cost:** $1,200,000
- **Effect:** 1 friend/foe slot per embassy; special bonuses at 5
- **System effect:** Sets `diplomaticRelations.maxFriends` and `maxFoes` to embassy count.
- **At 5 embassies:** Unlocks `canSelectBestFriend` and `canSelectNemesis`.
- **Demolition:** Removing embassies below 5 nullifies best friend/nemesis and the special selection flags; excess friends/foes above the new count are removed.

#### Foreign Affairs Office
- **Max count:** 1
- **Cost:** $3,500,000
- **Effect:** Required for all diplomatic actions
- **System effect:** Sets `improvementEffects.canDiplomacy = true`
- **Server requirement:** World.js checks `n.improvements.foreignAffairsOffice` before allowing treaty/diplomatic actions.

### Administration

#### Internal Affairs Office
- **Max count:** 1
- **Cost:** $3,000,000
- **Effect:** Allows selection of 10 domestic policies
- **System effect:** Sets `improvementEffects.canSetPolicies = true` and calls `initializePolicies(nation)`.
- **Policies unlocked:** Immigration, Nuclear Research, Education, Healthcare, Environment, Taxation, Military, Trade, Surveillance, Research.

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
- **Effect:** -5% pollution per center (max -25%)
- **System effect:** `pollutionReduction = count * 0.05`
- **Project:** If `projectEffects.enhancedRecycling` is active, adds `recyclingHappinessPenalty = count` (-1 happiness per center).
- **Wonder:** Supreme Recycling removes the happiness penalty and adds `recyclingEnvironmentBonus = count` (+1 environment per center).

#### School
- **Max count:** 5
- **Cost:** $1,000,000
- **Effect:** +7.5% literacy rate per school (max +37.5%)
- **System effect:** `literacyBonus = count * 0.075`

#### Park
- **Max count:** 5
- **Cost:** $650,000
- **Effect:** +7.5% environment and +2 happiness per park
- **System effects:**
  - `environmentBonus = count * 0.075`
  - `happinessFromParks = count * 2`
  - `pollutionFromParks = -count * 0.05`

#### Tree Plantation
- **Max count:** 5
- **Cost:** $450,000
- **Effect:** Increases environment quality and happiness, reduces pollution
- **System effects:**
  - `treeEnvironmentBonus = count`
  - `treeHappinessBonus = count`
  - `treePollutionReduction = count`

### Economic

#### Casino
- **Max count:** 5
- **Cost:** $1,800,000
- **Effect:** +5% taxable income per casino; increases crime and reduces happiness
- **System effects:**
  - `taxableIncomeBonus = count * 0.05`
  - `crimeIncrease = count * 0.03`
  - `happinessDecrease = count * 2`

### Science

#### Research Lab
- **Max count:** 5
- **Cost:** $2,200,000
- **Effect:** -3% research time per lab (max -15%)
- **System effect:** `researchTimeReduction = count * 0.03`

### Food & Water (Basic Needs)

#### Farm
- **Max count:** 5
- **Cost:** $500,000
- **Effect:** Feeds 1 million population per farm. Stacks to 5. At 5 stacks, gives 50% bonus (5M becomes 7.5M).
- **System effects:**
  - `foodCoverage = count * 1,000,000` (base)
  - `foodStackBonus = coverage * 0.50` when count >= 5
  - `foodProduction = coverage + stackBonus`
- **Project:** If `projectEffects.farmDoubling` is active, coverage doubles to 2M per farm.
- **Project:** If `projectEffects.farmMaxStackBonus100` is active, max-stack bonus increases to 100% instead of 50%.
- **Wonder:** Abundance Temple and Aqueduct of Life effects are reapplied when farms change.

#### Well
- **Max count:** 5
- **Cost:** $500,000
- **Effect:** Provides water for 1 million population per well. Stacks to 5. At 5 stacks, gives 50% bonus (5M becomes 7.5M).
- **System effects:**
  - `waterCoverage = count * 1,000,000` (base)
  - `waterStackBonus = coverage * 0.50` when count >= 5
  - `waterProduction = coverage + stackBonus`
- **Project:** If `projectEffects.wellDoubling` is active, coverage doubles to 2M per well.
- **Project:** If `projectEffects.wellMaxStackBonus100` is active, max-stack bonus increases to 100% instead of 50%.
- **Wonder:** Abundance Temple and Aqueduct of Life effects are reapplied when wells change.

---

## Mechanics

### Building
Improvements are built via the `build_improvement` event (delegated from `BuildingsSystem.buildImprovement`). Checks performed:
1. Improvement type exists in `improvementTypes`
2. Current count is below `maxCount`
3. Nation can afford the money cost (`canAffordImprovement`)
4. Cost is deducted via `payImprovementCost`
5. Count incremented on `nation.improvements[type]`
6. Effects applied via `applyImprovementEffects`
7. Wonder/supreme effects recalculated for military improvements and farms/wells
8. `improvement_built` event emitted

### Demolishing
Improvements are demolished via the `demolish_improvement` event. Checks performed:
1. Nation owns at least 1 of the improvement type
2. Improvement type exists (defensive guard added)
3. Salvage recovery: if `projectEffects.resourceRecovery` is active, refunds a percentage (default 15%, enhanced by `wonderEffects.improvementRecoveryRate` or `projectEffects.improvementRecoveryRate`) of the money cost
4. Count decremented
5. Embassy demolition triggers `handleEmbassyDemolition` (removes excess friends/foes, clears best friend/nemesis if below 5 embassies)
6. Effects reapplied via `applyImprovementEffects`
7. `improvement_demolished` event emitted with `recoveredResources`

### Policy Effects
When `Internal Affairs Office` is built, `initializePolicies(nation)` sets up 10 domestic policies with default stances. Policies can be changed via `setDomesticPolicy(nation, policy, stance)`. Each stance applies various `policyEffects` (growth, stability, research, economy, military, etc.). Synergies between certain policy combinations grant additional bonuses/penalties (Authoritarian, Liberal Democracy, Technocracy, Green State).

### Diplomatic Combat Bonus
`calculateDiplomaticCombatBonus(nation, targetNation, warParticipants)` computes a war bonus based on friends, foes, best friend, and nemesis relationships:
- +5% per friend in war (max 25% for 5 friends)
- +5% per foe in war
- +15% if best friend is in the war
- +15% if nemesis is in the war
- Capped at 125% total

### Upkeep
Each improvement costs $25,000 per day in upkeep, calculated in `World.js` as `buildingUpkeep.improvements`.

### Affordability
`canAffordImprovement(nation, improvement)` checks `nation.money >= improvement.cost.money`. Since resources were removed from the economy, only money is validated.

### Query Methods
- `getImprovementCount(nation, type)` — returns current count (defaults to 0)
- `getNationImprovements(nation)` — returns all improvement types with count, affordability, and maxed status
- `getImprovementInfo(data)` — returns type definition plus affordability and count for the current nation
