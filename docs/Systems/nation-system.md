# Nation System

The **Nation System** (`NationSystem`) is the core nation-level logic orchestrator for Sovereignty Epochs. It handles all system behavior that operates on a `Nation` entity — daily turns, population, economy, statistics, government/religion, research, military, trade, monthly/annual processing, and more. State stays on `entities/Nation.js`; logic lives here.

| Item | Value |
|------|-------|
| **System class:** | `NationSystem` |
| **Global instance:** | `window.NationSystemInstance` |
| **Class reference:** | `window.NationSystem` |
| **Source file:** | `systems/nation-system.js` |
| **Loaded in:** | `index.html` (Core systems section, after `systems/Nation/events-system.js`, before `systems/Chat/messaging-system.js`) |
| **Depends on:** | `Nation` entity (`window.Nation`), `NationSystemInstance`, `GlobalSystem`, `EdictSystem`, `PopulationSystem`, `CitizenJobSystem`, `CitizenTiesSystem`, `WorldBankSystem`, `WorldLotterySystem`, `ReligionSystem`, `GovernmentSystem`, `Player`, `EventBus`, `GameEvents` |
| **Save/Load:** | No — `NationSystem` has no persistent state; state lives on the `Nation` entity (`serialize()`/`deserialize()`) |

---

## Overview

`NationSystem` is the **core orchestrator** for a nation. It operates on a `Nation` entity instance passed via `setNation()` or set automatically by `GameEngine.initializeSystems()`. All state (population, money, tech, infra, military units, nationStats, etc.) is stored on the `Nation` entity object itself — `NationSystem` only contains behavior/methods.

```
window.Nation                ← Nation entity (state: land, infra, tech, population, money, militaryUnits, nationStats, etc.)
window.NationSystemInstance  ← behavior (calculateNationStats, calculateEconomy, handleDayPassed, trainMilitary, etc.)
window.NationSystem          ← class reference
```

The `Nation` entity's `handleDayPassed()`, `handleMonthPassed()`, and `handleYearPassed()` delegate entirely to `NationSystemInstance` when it is available. There are **no fallbacks** — if `NationSystemInstance` is not loaded, the handlers do nothing.

## NATION.initialize() delegation

When `Nation.initialize()` is called, it delegates to `window.NationSystemInstance` for government bonuses, religion bonuses, demand timers, initial population/tax calculation, and edict initialization:

```js
window.NationSystemInstance.setNation(this);     // link nation to system
window.NationSystemInstance.applyGovernmentBonuses();
window.NationSystemInstance.applyReligionBonuses();
window.NationSystemInstance.startDemandTimers();
window.NationSystemInstance.initializeNationEdicts(this);   // via EdictSystem
window.NationSystemInstance.applyEdictEffects(this);        // via EdictSystem
window.NationSystemInstance.calculatePopulation();
window.NationSystemInstance.calculateEconomy();
```

---

## Class Declaration & Constructor

```js
class NationSystem {
    constructor(nation = null)
```

| Property | Type | Description |
|----------|------|-------------|
| `nation` | `Nation` \| `null` | The nation instance this system operates on |
| `isInitialized` | `boolean` | Whether the system has been initialized |

### Methods

| Method | Description |
|--------|-------------|
| `setNation(nation)` | Set the nation instance this system operates on |
| `getNation()` | Return the nation instance this system operates on |
| `initialize(nation)` | Initialize the system with an existing nation entity |

---

## Turn Handlers (Daily / Monthly / Yearly)

### `handleDayPassed(data)`

The primary daily turn orchestrator. Runs every game day via `day_passed` EventBus event (also callable directly).

**Execution order:**

1. **Process temporary effects** — decrement and remove expired temporary population/happiness reductions (from military recruitment, nuclear weapons, etc.) via `processTemporaryEffects()`
2. **Pay military maintenance** — via `payMilitaryMaintenance()` (deducts money; sets `militaryMaintenanceDeficit` if insufficient funds)
3. **Recalculate population** — via `calculatePopulation()`
4. **Apply edict effects** — `EdictSystem.initializeNationEdicts()` + `EdictSystem.applyEdictEffects()`
5. **Calculate all nation statistics** — via `calculateNationStats()` (literacy, pollution, disease, crime, happiness, environment, derived multipliers)
6. **Apply global modifiers** — via `GlobalSystem.applyGlobalModifiers(nation)`
7. **Calculate economy** — via `calculateEconomy()`; stack tax revenue into `stackedTaxes` / `stackedTaxesTurns` if revenue > 0
8. **Pay bills** — via `payBills()`
9. **Apply player skill bonuses** — via `Player.applyToNation(nation)`
10. **Update military strength** — via `updateMilitaryStrength()`
11. **Process research** — via `processResearch()`
12. **Check government/religion demands** — via `checkDemands()`
13. **Update happiness** — via `updateHappiness()`
14. **Process projects daily** — via `GameEngine.systems.projects.processDaily(nation)`
15. **Process wonders daily** — via `GameEngine.systems.wonders.processDaily(nation)`
16. **Increment total turns** — `statistics.totalTurns++`
17. **Track duration-based award stats** — `allianceDays`, `warDays`, `peacefulDays`, `zeroPollutionDays`, `zeroCrimeDays`, `zeroDiseaseDays`, `perfectHappinessDays`, `friendsCount`, `hasBestFriend`, `fiveFriendsDays`, `bestFriendDays`, `fiveFriendsBestFriendDays`, `exactly300SoldiersDays`
18. **Check nation awards** — via `AwardSystem.checkNationAwards(nation)`
19. **Emit event** — `GameEvents.NATION_UPDATED`

### `handleMonthPassed(data)`

Runs every game month via `month_passed` EventBus event.

1. **Process monthly economics** — `processMonthlyEconomics()` (recalculates resource generation, adjusts stability based on budget balance)
2. **Update diplomatic relations** — `updateDiplomaticRelations()` (relations drift toward neutral 50; counts `positiveRelationsCount`)
3. **Process monthly events** — `processMonthlyEvents()` (10% chance per month to trigger a random event)

### `handleYearPassed(data)`

Runs every game year via `year_passed` EventBus event.

1. **Process annual statistics** — `processAnnualStatistics()`
2. **Check achievements** — `checkAchievements()`

---

## Core Statistics

### `calculatePopulation()`

Computes the nation's total population:

```
population = land × infra × tech × ageFactor × growthMultiplier
```

- `ageFactor = max(1, nationAgeDays / 30)` — older nations have larger base populations
- `growthMultiplier` starts at `1.0`, increased by `bonusEffects.automobiles` (+10%) and `bonusEffects.basicNeeds` (+15%), multiplied by `nationStats.populationEfficiency` and `nation.populationGrowthModifier`
- If `tech <= 0`, population is `0`
- Temporary population reductions (from military recruitment) are subtracted

### `calculateNationStats()`

Calculates all complex nation statistics in order:

1. `calculateLiteracy()`
2. `calculatePollution()`
3. `calculateDisease()`
4. `calculateCrime()`
5. `calculateHappiness()`
6. `calculateEnvironment()`
7. `calculateDerivedEffects()`

### `calculateLiteracy()`

Base literacy from tech level (max 75%), plus school/university/wonder/policy bonuses. Capped at 100.

### `calculatePollution()`

Base pollution from infra and population, plus mine/assembly/factory pollution, reduced by recycling centers, enhanced recycling, supreme recycling wonder, parks, tree plantations, and environmental policies. Multiplied by `edictEffects.pollutionModifier`.

### `calculateDisease()`

Base 10% disease, increased by pollution, decreased by hospitals, ambulance hubs, universal healthcare wonder, environment quality, and healthcare policies. Multiplied by `edictEffects.diseaseModifier`. Capped at 0–50.

### `calculateCrime()`

Base 15% crime, reduced by police stations, SWAT, literacy, happiness, surveillance policies; increased by casinos, sports betting. Multiplied by `edictEffects.crimeModifier`. Capped at 0–80.

### `calculateHappiness()`

Base `INITIAL_HAPPINESS` (50), modified by edicts, pollution (-0.1 per point), disease (-0.20 per point), crime (-0.10 per point), literacy (+0.10 per point), improvement/project/wonder/policy bonuses, multiplied by `governmentHappinessBonus` and `religionHappinessBonus`. Capped at 0–100.

### `calculateEnvironment()`

`100 - pollution`, plus edict modifier, environmental policies, wonder effects, tree plantation bonuses. Capped at 0–100.

### `calculateDerivedEffects()`

Calculates `populationEfficiency`, `militaryMorale`, `taxEfficiency`, and `happinessModifier` based on primary stats.

---

## Economy

### `calculateEconomy(collectTaxes = false)`

**Taxable income:**
```
taxableIncome = (infra / 50) × population × tech × literacyModifier
```
- `literacyModifier = 1.0 + (literacy / 100) × 0.5` (up to +50% at 100% literacy)
- Effective tax rate = `BASE_TAX_RATE` (2.5%) + `Player.getSkillValue('taxation') × 100`, then multiplied by `(1 + edictEffects.taxRateModifier)`

**Tax revenue:**
```
taxRevenue = floor(taxableIncome × (taxRate / 100) × taxEfficiency)
```

If `collectTaxes` is true, per-citizen taxes are collected via `PopulationSystem.citizens` (taxable age groups: teen, youngAdult, adult, middleAged, older), and the total is added to `nation.money` and `totalTaxEarned`.

**Budget:**
- `budget.income = taxRevenue`
- `budget.expenses = militaryBudget`
- `budget.balance = income - expenses`

**Emits:** `GameEvents.RESOURCES_CHANGED`

### `collectTaxes()`

Stacks tax revenue into `stackedTaxes` / `stackedTaxesTurns` with World Bank interest after 12 turns. Can contribute interest to World Lottery.

### `payBills()`

Stacks bills into `stackedBills` / `stackedBillsTurns` with World Bank interest after 24 turns. Can contribute interest to World Lottery.

### `calculateTotalBillsThisTurn()`

Returns total bills due this turn: stacked bills + building upkeep (improvements/projects/wonders) + military budget.

### `getStackedFinancesInfo()`

Returns `{ stackedTaxes, stackedTaxesTurns, lastTaxInterestRate, stackedBills, stackedBillsTurns, lastBillInterestRate }`.

### `calculateResourceGeneration()`

Sets `nation.resourceGeneration.money = taxRevenue` and `food = territories.length × 100`, then applies government `economyBonus` multiplier.

### `updateEconomy()`

Alias for `calculateEconomy()`.

### `updateHappiness()`

Calls `calculateHappiness()`, emits `GameEvents.HAPPINESS_CHANGED` with old/new/change, and sets `nation.happiness = nationStats.happiness`.

---

## Land / Infra / Tech Purchases

### `landCost()`

Cost to buy the next mile of land:

```
baseCost = ceil(500 × tierMultiplier(land))
scaledBase = ceil(baseCost × worldAverageMultiplier(land, 'land'))
taxAmount = floor(scaledBase × taxRate)
totalCost = scaledBase + taxAmount
```

- `tierMultiplier(level) = pow(1.05, floor(level/100)) × pow(1.25, floor(level/500)) × pow(3.0, floor(level/1000))`
- `worldAverageMultiplier(level, type)` — if level ≥ world average: `pow(2.5, ratio - 1)`; if below: `max(0.5, 0.5 + ratio × 0.5)`
- `taxRate` from `WorldBankSystem.getCurrencyTaxRateForNation(nation)` (default 0.05)

### `buyLand()`

Buys one block of land (100 miles). First `FREE_STARTING_BLOCKS × MILES_PER_BLOCK` miles are free. Otherwise deducts cost from money, increments `land` and `mapBlocks`, recalculates population and economy, records territory purchase with World Bank, emits `land_purchased`.

### `infraCost()`

Cost to buy the next point of infrastructure:

```
baseCost = ceil(500 × tierMultiplier(infra))
scaledBase = ceil(baseCost × worldAverageMultiplier(infra, 'infra'))
taxAmount = floor(scaledBase × taxRate)
totalCost = scaledBase + taxAmount
```

Same tier multiplier and world average multiplier as land cost.

### `buyInfra(amount = 1)`

Buys `amount` units of infrastructure, deducting cost per unit. Recalculates population and economy once after all units purchased. Emits `infra_purchased`.

### `techCost()`

Cost to buy the next tech level:

```
cost = nextLevel × (land / 100) × (infra / 100) × (population / 1000) × tierMultiplier
```
- `tierMultiplier = pow(floor(tech / 1000) + 1, 2)`
- Modified by `projectEffects.techCostReduction` and `wonderEffects.universalEducationTechCostReduction`

### `buyTech()`

Buys one tech level, deducts cost from money, increments `tech`, recalculates population and economy. Emits `tech_purchased`.

---

## Nation Age

### `_nationAgeDays()`

Returns nation age in game days using `GameTime.nationAgeDays(foundedDay)` if available, otherwise falls back to wall-clock calculation.

### `getNationAge()`

Returns formatted age string (e.g., `"2y 3m 15d"`).

---

## Government / Religion

### `applyGovernmentBonuses()`

Applies government type bonuses/penalties via `GovernmentSystem.getGovernment(nation.government)`. Sets `governmentType`, `governmentHappinessBonus`, GDP multiplier (only if gdp > 0), military strength multiplier, stability, population growth modifier, technology bonus, policies, tax rate, and penalties. Falls back to `GameConfig.GOVERNMENT_TYPES` if `GovernmentSystem` unavailable.

### `applyReligionBonuses()`

Applies religion bonuses via `ReligionSystem.getReligion(nation.religion)`. Sets `religionHappinessBonus`, population growth modifier, stability, military morale, technology bonus, and penalties.

### `startDemandTimers()`

Initializes `demandTimer` with random government/religion demand days (7–30 days each).

### `getGovernmentHint()` / `getReligionHint()`

Returns a random hint for the current government/religion, or `GlobalWorld.suggestedGovernment`/`suggestedReligion` if set.

### `changeGovernment(newGovernmentId)` / `changeReligion(newReligionId)`

Changes the government/religion, increments statistics counter, reapplies bonuses, resets demand timer, emits `GameEvents.GOVERNMENT_CHANGED` / `GameEvents.RELIGION_CHANGED`.

### `checkDemands()`

Decrements government/religion demand timers daily. When a timer reaches 0, emits `GameEvents.GOVERNMENT_DEMAND` / `GameEvents.RELIGION_DEMAND` with hint and 7-day response window.

---

## Research

### `processResearch()`

Generates research points daily: `population × 0.001 + tech × 0.1`, modified by player `intuition` skill. Applies to `currentResearch`. When progress ≥ cost, calls `completeResearch()` and awards player experience.

### `completeResearch()`

Adds technology to `nation.technologies`, applies benefits via `applyResearchBenefits()`, resets `currentResearch`/`researchProgress`, increments `statistics.researchCompleted`, emits `GameEvents.RESEARCH_COMPLETED`.

### `applyResearchBenefits(benefits)`

Applies `populationGrowth`, `economicBonus`, and `militaryBonus` benefits from completed research.

### `startResearch(researchId)`

Starts a new research project with default cost 1000–3000 points. Emits `GameEvents.RESEARCH_STARTED`.

---

## Military

### `calculateWeightedMilitaryPopulation()`

Weights: soldiers=1, tanks=2, aircraft=3, ships=5, spies=0, missiles=0, nukes=0. Returns weighted total across `nation.militaryUnits`.

### `getMilitaryUsageRatio()`

Returns `weightedMilitaryPopulation / totalPopulation`.

### `applyMilitaryHappinessPenalty()`

If ratio < 0.05 (too weak): penalty = (0.05 - ratio) × 20 happiness.
If ratio > 0.25 (excessive): penalty = (ratio - 0.25) × 40 happiness.
Emits `GameEvents.HAPPINESS_CHANGED` with reason.

### `calculateMilitaryCost(type, amount)`

Population-based costs matching `MilitaryUnit.js`:

| Unit | Money (per unit) | Population Cost | Tech Required | Prerequisite |
|------|-----------------|-----------------|---------------|--------------|
| soldiers | $500 | 1 | 0 | — |
| tanks | $25,000 | 5 | 150 | — |
| aircraft | $100,000 | 10 | 300 | — |
| ships | $250,000 | 20 | 450 | — |
| spies | $50,000 | 2 | 0 | `spyOperations` |
| missiles | $2,500,000 | 0 | 0 | `missileSilo` |
| nukes | $10,000,000 | 0 | 0 | `nuclearWarheadFacility` |

Modified by `edictEffects.militaryCostModifier`. Nukes include `happinessImpact: amount`. Temp military cost reductions from `nation.resources.tempMilitaryCost`.

### `hasPrerequisite(prerequisite)`

Checks `nation.projects[prerequisite] > 0` or `nation.wonderEffects[prerequisite] > 0`.

### `applyTemporaryPopulationReduction(amount)` / `applyTemporaryHappinessReduction(amount)`

Pushes a temporary effect with `turnsRemaining: 1` to `nation.temporaryEffects`.

### `processTemporaryEffects()`

Decrements `turnsRemaining` on all temporary effects and removes expired ones (called daily in `handleDayPassed`).

### `calculateDailyMaintenanceCosts()`

Per-unit daily maintenance matching `MilitaryUnit.js`:

| Unit | Maintenance Per Unit |
|------|---------------------|
| soldiers | $2.5 |
| tanks | $50 |
| aircraft | $100 |
| ships | $250 |
| spies | $500 |
| missiles | $2,500 |
| nukes | $7,500 |

Modified by `edictEffects.militaryUpkeepModifier`. Temp military upkeep reductions from `nation.resources.tempMilitaryUpkeep`.

### `payMilitaryMaintenance()`

Deducts maintenance cost from money. Sets `militaryMaintenanceDeficit = true` if insufficient funds (which halves military strength). Emits `military_maintenance_paid`.

### `updateMilitaryStrength()`

```
totalStrength = Σ (units[type] × unitStrength[type])
```

Unit strengths: soldiers=1, tanks=25, aircraft=100, ships=200, spies=10, missiles=500, nukes=2000.
Plus player `attack` + `defense` skill values, multiplied by `(1 + edictEffects.militaryEffectivenessModifier)`, halved if `militaryMaintenanceDeficit`.

### `trainMilitary(type, amount = 1)`

Trains military units with full validation:

1. Validates unit type and positive integer amount
2. Checks money requirement
3. Checks technology requirement
4. Checks prerequisite requirement
5. Checks **50% military population cap** — weighted military population cannot exceed 50% of total population
6. Checks population cost availability (each unit costs `populationCost` citizens)
7. Applies player attack skill discount (max 20%)
8. Deducts money, adds units
9. Enlists citizens via `PopulationSystem.enlistMilitaryPopulation(amount, type)` (citizens keep their jobs)
10. Applies military happiness penalty
11. Applies nukes happiness impact if applicable
12. Updates military strength
13. Awards player experience (`amount × 8`, 'Military Trained')
14. Emits `GameEvents.MILITARY_TRAINED`

---

## Trade

The `NationSystem` no longer contains trade logic (`conductTrade`/`calculateTradeValue` were removed as trades/resources do not exist in this game version). The `Nation` entity retains stub methods that log a warning and return `false`/`0`.

---

## Monthly / Annual Processing

### `processMonthlyEconomics()`

Calls `calculateResourceGeneration()`, adjusts stability (+1 if budget balance ≥ 0, -2 if negative).

### `updateDiplomaticRelations()`

Drifts all relations toward neutral (50) by ±0.5 per month. Counts `positiveRelationsCount` (relations > 50).

### `processMonthlyEvents()`

10% chance per month to `triggerRandomEvent()`.

### `triggerRandomEvent()`

Picks a random weighted event from `NationEvents` categories (or fallback basic events if none loaded). Applies effects via `applyEventEffects()`, records to `eventHistory`, emits `GameEvents.RANDOM_EVENT`.

### `applyEventEffects(event)`

Applies event effects to nation stats/resources. Multipliers for values between 0 and 1, addition/subtraction otherwise. Clamps happiness/stability/reputation to 0–100.

### `processAnnualStatistics()` / `checkAchievements()` / `generateAnnualReport()`

Annual processing placeholders / achievement checking / annual report generation. Emits `GameEvents.ANNUAL_REPORT`.

---

## Nation Overview / State Accessors

### `getOverview()`

Returns:

```js
{
  basic: { name, leader, government, founded, age },
  statistics: { population, gdp, happiness, stability, reputation, militaryStrength },
  resources: {...},
  economy: {...},
  territories: count,
  technologies: count
}
```

---

## Module Exports

```js
window.NationSystem = NationSystem;           // class reference
const NationSystemInstance = new NationSystem();
window.NationSystemInstance = NationSystemInstance;  // working instance

// CommonJS (if available)
module.exports = { NationSystem, NationSystemInstance };
```

`window.NationSystemInstance` is the working singleton that `GameEngine.initializeSystems()` links to a nation via `setNation()`.

---

## Load Order & Dependencies

`systems/nation-system.js` is loaded in `index.html` in the Core systems section, **after** `systems/Nation/events-system.js` and **before** `systems/Chat/messaging-system.js`. It must load after `core/event-system.js` (provides `EventBus`) and before systems that depend on it (Population, War, etc.).

Dependencies (via `window.*` globals at runtime, not imports):

| Dependency | Used For |
|------------|----------|
| `window.Nation` | The nation entity this system operates on |
| `window.NationSystemInstance` | Singleton instance for system-wide operations |
| `window.GlobalSystem` | Apply global average modifiers |
| `window.EdictSystem` | Edict initialization and effect application |
| `window.PopulationSystem` | Citizens, taxation, military enlistment |
| `window.CitizenJobSystem` | Job assignment and income application |
| `window.CitizenTiesSystem` | Relationship handling on death |
| `window.WorldBankSystem` | Stacked tax/bill interest, territory purchase, tax interest rates |
| `window.WorldLotterySystem` | Interest contribution, nation pet storage |
| `window.ReligionSystem` | Religion bonuses and hints |
| `window.GovernmentSystem` | Government bonuses and hints |
| `window.Player` | Skill bonuses, experience awards |
| `window.GameEngine` | Projects/wonders daily processing |
| `window.EventBus` / `GameEvents` | Event emission |

---

## Event Reference

| Event | Data | When |
|-------|------|------|
| `NATION_UPDATED` | `{ nation }` | After daily turn completes |
| `HAPPINESS_CHANGED` | `{ oldHappiness, newHappiness, change, reason?, nation }` | Happiness changes (daily update, military penalty) |
| `MILITARY_TRAINED` | `{ type, amount, cost, nation }` | Military units trained |
| `RESEARCH_STARTED` | `{ research }` | New research started |
| `RESEARCH_COMPLETED` | `{ research, nation }` | Research completed |
| `GOVERNMENT_CHANGED` | `{ oldGovernment, newGovernment, nation }` | Government changed |
| `RELIGION_CHANGED` | `{ oldReligion, newReligion, nation }` | Religion changed |
| `GOVERNMENT_DEMAND` | `{ hint, daysRemaining }` | Government change demand timer expires |
| `RELIGION_DEMAND` | `{ hint, daysRemaining }` | Religion change demand timer expires |
| `RESOURCES_CHANGED` | `{ money, taxRevenue, taxableIncome, taxRate }` | Economy recalculated |
| `military_maintenance_paid` | `{ costs, nation }` | Military maintenance paid |
| `land_purchased` | `{ mapBlocks, land, cost, tax }` | Land purchased |
| `infra_purchased` | `{ infra }` | Infrastructure purchased |
| `tech_purchased` | `{ tech, cost }` | Tech purchased |

---

## Data Flow (Daily Update)

```
handleDayPassed(data)
  → processTemporaryEffects()
  → payMilitaryMaintenance()
  → calculatePopulation()
  → EdictSystem.applyEdictEffects()
  → calculateNationStats()
    → calculateLiteracy()
    → calculatePollution()
    → calculateDisease()
    → calculateCrime()
    → calculateHappiness()
    → calculateEnvironment()
    → calculateDerivedEffects()
  → GlobalSystem.applyGlobalModifiers()
  → calculateEconomy() + stack taxes
  → payBills()
  → Player.applyToNation()
  → updateMilitaryStrength()
  → processResearch()
  → checkDemands()
  → updateHappiness()
  → projects.processDaily()
  → wonders.processDaily()
  → statistics.totalTurns++
  → track award stats (allianceDays, warDays, peacefulDays, etc.)
  → AwardSystem.checkNationAwards()
  → emit NATION_UPDATED
```

---

## Integration with Population System

`PopulationSystem.handleDayPassed()` calls:

- `NationSystem.updateMilitaryStrength()` when a military citizen dies (`systems/Population/population-system.js:909`)
- `NationSystem.calculateNationStats()` after processing population situations (`line 1842`) and nation situations (`line 2018`)

`NationSystem.trainMilitary()` calls `PopulationSystem.enlistMilitaryPopulation(amount, type)` to mark citizens as military (citizens keep their jobs).

---

## Design Notes

- **No persistent state** — `NationSystem` has no `getState()`/`setState()`. All state lives on the `Nation` entity.
- **No non-existent resources** — military costs and maintenance use only money and population cost. Steel, aluminum, ammo, gas, uranium, etc. do not exist in this game version.
- **No trades** — `conductTrade`/`calculateTradeValue` were removed; trades/resources do not exist.
- **50% military cap** — weighted military population cannot exceed 50% of total population.
- **Citizens keep jobs when enlisted** — `enlistMilitaryPopulation` flags citizens as `isMilitary` but they retain their civilian jobs via `PopulationSystem`.
- **Maintenance deficit halves strength** — if a nation cannot afford daily military maintenance, `militaryStrength` is multiplied by 0.5.
- **Delegation-only handlers** — `Nation.handleDayPassed/Month/Year` delegate to `NationSystemInstance` with no fallback logic.
