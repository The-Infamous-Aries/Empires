# Nation Entity

Represents the core nation-state object — the central entity for every player nation in Dominion Wars. Nation.js manages identity, demographics, economy, military, research, territory, diplomacy, edicts, random events, and the full daily turn cycle (`handleDayPassed`).

## Overview

| Item | Value |
|------|-------|
| **Class:** | `NationClass` |
| **Singleton instance:** | `window.Nation` |
| **Class reference:** | `window.NationClass` (for AI nations) |
| **Source file:** | `entities/Nation.js` |
| **Loaded in:** | `index.html` (after entities/Citizen.js, entities/Player.js) |
| **Save/Load:** | Yes — `serialize()` / `deserialize()` supported |
| **Depends on:** | `GameConfig`, `EventBus`, `GameTime`, `Window.Player`, `Window.PopulationSystem`, `Window.WorldBankSystem`, `Window.EdictSystem`, `Window.GovernmentSystem`, `Window.ReligionSystem`, `Window.GameEngine` |

## Core Formulas (from source)

| Formula | Definition |
|---------|------------|
| **Population** | `land × infra × tech × ageFactor` |
| **Age Factor** | `max(1, nationAgeDays / 30)` |
| **Taxable Income** | `(infra / 50) × population × tech × literacyModifier` |
| **Tax Revenue** | `taxableIncome × (taxRate / 100) × taxEfficiency` [per turn] |
| **Land Cost** | `(land + 1) × (population / 1000) × 10 × tierMult` where `tierMult = (floor(land / 1000) + 1)^2` |
| **Infra Cost** | `(infra + 1) × (population / 1000) × 1 × tierMult` where `tierMult = (floor(infra / 1000) + 1)^2` |
| **Tech Cost** | `nextTechLevel × (land / 100) × (infra / 100) × (population / 1000) × tierMult` where `tierMult = (floor(tech / 1000) + 1)^2` |

## Constructor Fields

### Identity

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | string | `''` | Nation name |
| `leader` | string | `''` | Leader name |
| `government` | string | `'liberalDemocracy'` | Government type ID |
| `religion` | string | `'monotheism'` | Religion ID |
| `founded` | number \| null | `null` | Real-world timestamp of creation |
| `foundedDay` | number | `0` | Game day of creation (for age calc) |
| `flag` | object \| null | `null` | Flag data object |
| `motto` | string | `''` | Nation motto |
| `capitalCity` | string | `''` | Capital city name |
| `factionKey` | string \| null | `null` | Faction ID |
| `factionColor` | string \| null | `null` | Faction color |

### Happiness Bonuses

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `governmentHappinessBonus` | number | `1.0` | Multiplier applied in `calculateHappiness()` |
| `religionHappinessBonus` | number | `1.0` | Multiplier applied in `calculateHappiness()` |

### Core Stats

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `land` | number | `GameConfig.INITIAL_LAND` | Land in miles |
| `infra` | number | `GameConfig.INITIAL_INFRA` | Infrastructure level |
| `tech` | number | `GameConfig.INITIAL_TECH` | Technology level (starts at 0) |
| `sharedTechnology` | number | `0` | Technology shared from allies/research treaties |
| `population` | number | `0` | Computed each turn via `calculatePopulation()` |
| `happiness` | number | `GameConfig.INITIAL_HAPPINESS` | Current happiness (0-100) |
| `stability` | number | `100` | Nation stability (0-100) |
| `reputation` | number | `50` | International reputation (0-100) |
| `gdp` | number | `0` | Gross Domestic Product, computed each turn |

### Money / Economy

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `money` | number | `GameConfig.INITIAL_RESOURCES.money` | Cash on hand ($10,000,000) |
| `taxRate` | number | `GameConfig.BASE_TAX_RATE` | Current tax rate percentage (2.5% base) |
| `taxableIncome` | number | `0` | Computed each turn |
| `taxRevenue` | number | `0` | Money earned last turn |
| `totalTaxEarned` | number | `0` | Lifetime tax revenue |
| `budget` | object | `{ income: 0, expenses: 0, balance: 0 }` | Budget summary |
| `debt` | number | `0` | Nation debt |

### Stacked Taxes & Bills (World Bank Interest)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `stackedTaxes` | number | `0` | Uncollected tax balance accruing interest |
| `stackedTaxesTurns` | number | `0` | Turns taxes have been stacked |
| `lastTaxInterestRate` | number | `0` | Last applied tax interest rate |
| `stackedBills` | number | `0` | Unpaid bill balance accruing interest |
| `stackedBillsTurns` | number | `0` | Turns bills have been stacked |
| `lastBillInterestRate` | number | `0` | Last applied bill interest rate |

### Edicts

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `edictUnlocked` | object | `{}` | Unlocked edict IDs |
| `edicts` | null \| object | `null` | Active edicts |
| `edictChangeDates` | null \| object | `null` | Dates edicts changed |
| `edictFreePassUsed` | boolean | `false` | Whether free edict change used |
| `edictEffects` | null \| object | `null` | Active edict effect multipliers |
| `edictSynergies` | array | `[]` | Active edict synergy IDs |
| `discoveredSynergies` | array | `[]` | Discovered synergy IDs |
| `synergyDays` | object | `{}` | Days remaining on synergies |

### Resources

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `resources` | object | `{ money: GameConfig.INITIAL_RESOURCES.money }` | Resource pool (money + any discovered resources) |
| `primaryResource` | string \| null | `null` | Primary resource this nation produces |
| `bonusEffects` | object | `{}` | Active bonus resource effects |
| `currentBonuses` | object | `{}` | Current bonus multipliers |
| `criticalResourcePenalty` | number | `0` | Happiness penalty for missing water/food |
| `populationGrowthModifier` | number | `1.0` | Population growth multiplier |
| `technologyBonus` | number | `1.0` | Technology multiplier |
| `resourceGeneration` | object | `{ money: 0, materials: 0, food: 0, energy: 0, technology: 0 }` | Legacy display field |

### Improvements / Buildings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `improvements` | object | `{}` | Built improvements (e.g. `{ mine: 5, farm: 3 }`) |
| `improvementEffects` | object | `{}` | Aggregated effects from improvements |
| `domesticPolicies` | object | `{}` | Internal policies |
| `policyEffects` | object | `{}` | Effects from domestic policies |
| `buildingUpkeep` | object | `{ improvements: 0, projects: 0, wonders: 0 }` | Building upkeep costs |

### Projects

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `projects` | object | `{}` | Built projects (e.g. `{ missileSilo: 1, university: 2 }`) |
| `projectEffects` | object | `{}` | Effects from projects |
| `military` | object | `{}` | Legacy military field (unused; `militaryUnits` is authoritative) |

### Research

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `researchPoints` | number | `0` | Accumulated research points |
| `technologies` | Set | `new Set()` | Researched technology IDs |
| `currentResearch` | null \| object | `null` | Current research project |
| `researchProgress` | number | `0` | Progress toward current research |

### Map / Territory

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `territories` | array | `[]` | Map tile IDs claimed |
| `cities` | array | `[]` | City ID strings |
| `mapBlocks` | number | `GameConfig.INITIAL_LAND / GameConfig.MILES_PER_BLOCK` | Map blocks (land / 100) |
| `totalArea` | number | `this.land` | Total land area claimed |
| `territoryAreas` | object | `{}` | `territoryId → area` mapping for accurate removal |

### Diplomatic

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `relations` | Map | `new Map()` | `nationId → relation value (0-100)` |
| `treaties` | array | `[]` | Active treaty IDs |
| `tradeAgreements` | array | `[]` | Active trade agreements |
| `allianceId` | string \| null | `null` | Alliance this nation belongs to |
| `allianceRole` | string \| null | `null` | Role within alliance |

### Government / Religion

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `governmentType` | object | `{}` | Resolved government type object |
| `policies` | object | `{ economic: 'Mixed', military: 'Defensive', social: 'Moderate', environmental: 'Balanced', foreign: 'Neutral' }` | Domestic policies |
| `demandTimer` | object | `{ governmentDaysRemaining: 0, religionDaysRemaining: 0, isDemandingGovernment: false, isDemandingReligion: false, currentGovernmentHint: null, currentReligionHint: null }` | Demand countdown timers |

### Military

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `baseAttack` | number | `GameConfig.BASE_ATTACK` (50) | Base attack value |
| `baseDefense` | number | `GameConfig.BASE_DEFENSE` (50) | Base defense value |
| `militaryStrength` | number | `GameConfig.INITIAL_MILITARY` | Total military strength |
| `militaryUnits` | object | `{ soldiers: 0, tanks: 0, aircraft: 0, ships: 0, spies: 0, missiles: 0, nukes: 0 }` | Unit counts |
| `militaryBudget` | number | `0` | Daily military budget |
| `militaryMaintenanceDeficit` | boolean | `false` | Whether maintenance can't be paid |
| `wars` | array | `[]` | Active war IDs |
| `alliances` | array | `[]` | Alliance memberships |

### Statistics

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `statistics.totalTurns` | number | `0` | Total turns survived |
| `statistics.territoriesClaimed` | number | `0` | Territories claimed |
| `statistics.warsWon` | number | `0` | Wars won |
| `statistics.warsLost` | number | `0` | Wars lost |
| `statistics.researchCompleted` | number | `0` | Research projects completed |
| `statistics.landPurchased` | number | `0` | Land purchases |
| `statistics.infraPurchased` | number | `0` | Infrastructure purchases |
| `statistics.techPurchased` | number | `0` | Tech purchases |
| `statistics.missileHits` | number | `0` | Missile hits |
| `statistics.missileMisses` | number | `0` | Missile misses |
| `statistics.nukeHits` | number | `0` | Nuke hits |
| `statistics.nukeMisses` | number | `0` | Nuke misses |

### Other

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `eventHistory` | array | `[]` | Recent life events |
| `achievements` | Set | `new Set()` | Unlocked achievement IDs |
| `sportsTeams` | object | `{}` | Sports teams owned |
| `wonderEffects` | object | `{}` | Effects from built wonders |

## Constructor

```js
new NationClass()
```

Creates an empty nation with default values. The singleton `window.Nation` is created automatically on module load but is **uninitialized** until `NationClass.create(nationData)` or `nation.initialize(nationData)` is called.

## Methods

### Initialization

| Method | Description |
|--------|-------------|
| `initialize(nationData)` | Sets all fields from nationData, applies government/religion bonuses, initializes diplomacy, edicts, demand timers, runs first population/tax calculation, loads flag, emits `NATION_CREATED` |
| `static create(nationData)` | Factory: creates `new NationClass()`, calls `initialize()`, replaces `window.Nation`. Returns false if nation already initialized |
| `bindEvents()` | Binds `DAY_PASSED`, `MONTH_PASSED`, `YEAR_PASSED` event listeners |
| `destroy()` | Unbinds all event listeners, marks uninitialized |

### Daily Cycle

| Method | Description |
|--------|-------------|
| `handleDayPassed(data)` | Full daily pipeline: temp effects → military maintenance → population → edicts → nation stats → taxes → economy → player skills → military strength → research → demands → happiness → projects → wonders → increment totalTurns → emit `NATION_UPDATED` |
| `handleMonthPassed(data)` | Diplomatic relations drift, monthly events, stability drift |
| `handleYearPassed(data)` | Annual statistics, achievements, annual report |

### Population

| Method | Description |
|--------|-------------|
| `calculatePopulation()` | `land × infra × tech × ageFactor` with growth multipliers from automobiles, basic needs, population efficiency, minus temporary population reductions |
| `calculateNationStats()` | Runs all stat calculations: literacy, pollution, disease, crime, happiness, environment, derived effects |
| `calculateLiteracy()` | Tech-based base + school/university/wonder/policy bonuses |
| `calculatePollution()` | Infra/population-based + mines/assembly/factories minus recycling/parks/policies |
| `calculateDisease()` | Base 10% + pollution - hospitals/ambulance/wonder + environment effect |
| `calculateCrime()` | Base 15% - police/SWAT + casinos/sports betting - literacy/happiness/surveillance |
| `calculateHappiness()` | Base 50 + edicts - pollution/disease/crime + literacy + improvements/projects/wonders × government bonus × religion bonus |
| `calculateEnvironment()` | `100 - pollution` + edict + policies + wonders |
| `calculateDerivedEffects()` | Computes `populationEfficiency`, `militaryMorale`, `taxEfficiency`, `happinessModifier` |

### Economy

| Method | Description |
|--------|-------------|
| `calculateEconomy(collectTaxes)` | Computes taxable income, applies per-citizen tax via `PopulationSystem` if available, adds revenue to `this.money`, updates budget/GDP, emits `RESOURCES_CHANGED` |
| `collectTaxes()` | Delegates to `WorldBankSystem.calculateTaxInterestRate` / `calculateTaxInterest` for stacked tax interest |
| `payBills()` | Delegates to `WorldBankSystem.calculateBillInterestRate` / `calculateBillInterest` for stacked bill interest |
| `calculateTotalBillsThisTurn()` | Returns stacked bills + building upkeep + military budget |
| `calculateResourceGeneration()` | Updates `this.resourceGeneration` display object for UI |
| `generateDailyResources()` | Alias for `calculateEconomy()` |

### Land / Infrastructure / Tech Purchases

| Method | Description |
|--------|-------------|
| `landCost()` | Cost to buy next mile: `(land + 1) × (pop / 1000) × 10 × tierMult` |
| `buyLand()` | Buys one mile of land. First 1000 miles free. Deducts money, recalculates population/economy, records purchase |
| `infraCost()` | Cost to next infra point: `(infra + 1) × (pop / 1000) × 1 × tierMult` with construction bonus |
| `buyInfra(amount)` | Buys infrastructure units. Deducts money, increases `this.infra`, recalculates population/economy |
| `techCost()` | Cost to next tech level: `nextLevel × (land/100) × (infra/100) × (pop/1000) × tierMult` with university/wonder reductions |
| `buyTech()` | Buys one tech level. Deducts money, increases `this.tech`, recalculates population/economy |

### Nation Age

| Method | Description |
|--------|-------------|
| `_nationAgeDays()` | Returns game days since founded via `GameTime.nationAgeDays(this.foundedDay)` or real-time fallback |
| `getNationAge()` | Formatted string (e.g. "2y 3m 15d") |

### Government / Religion

| Method | Description |
|--------|-------------|
| `applyGovernmentBonuses()` | Applies government type bonuses: happiness, GDP, military strength, stability, population growth, technology, policies, tax rate |
| `applyReligionBonuses()` | Applies religion bonuses: happiness, population growth, stability, military morale, technology |
| `changeGovernment(newGovernmentId)` | Changes government, reapplies bonuses, resets demand timer, emits `GOVERNMENT_CHANGED` |
| `changeReligion(newReligionId)` | Changes religion, reapplies bonuses, resets demand timer, emits `RELIGION_CHANGED` |
| `checkDemands()` | Decrements demand timers, emits `GOVERNMENT_DEMAND` / `RELIGION_DEMAND` when threshold reached |

### Military

| Method | Description |
|--------|-------------|
| `trainMilitary(type, amount)` | Trains military units. Validates cost/resources/prerequisites/tech/military cap (50% of population). Deducts costs, enlists citizens via `PopulationSystem.enlistMilitaryPopulation()`, applies happiness penalties, updates strength, emits `MILITARY_TRAINED` |
| `calculateMilitaryCost(type, amount)` | Returns cost object: money + resources + techRequired + prerequisite |
| `calculateWeightedMilitaryPopulation()` | `soldiers×1 + tanks×2 + aircraft×3 + ships×5` (spies/missiles/nukes = 0) |
| `getMilitaryUsageRatio()` | `weightedMilitary / totalPopulation` |
| `applyMilitaryHappinessPenalty()` | Penalty if < 5% (too weak) or > 25% (excessive force) |
| `updateMilitaryStrength()` | `Σ(units × strength)` + player attack/defense + edict modifier, halved if maintenance deficit |
| `calculateDailyMaintenanceCosts()` | Per-unit maintenance: money + resources (food/steel/aluminum/ammo/gas/uranium) |
| `payMilitaryMaintenance()` | Deducts maintenance from `this.money`, sets deficit if unaffordable, emits `MILITARY_MAINTENANCE_PAID` |

### Trade

| Method | Description |
|--------|-------------|
| `conductTrade(partnerId, offer, request)` | Validates resources, executes trade with luck/taxation bonus, emits `TRADE_COMPLETED` |
| `calculateTradeValue(offer, request, bonus)` | `max(offerValue, requestValue) × (1 + bonus)` |

### Territory

| Method | Description |
|--------|-------------|
| `addTerritory(territory)` | Adds territory ID, tracks area, awards experience, emits `TERRITORY_ADDED` |
| `removeTerritory(territoryId)` | Removes territory ID, decrements `totalArea`, emits `TERRITORY_REMOVED` |

### Diplomacy

| Method | Description |
|--------|-------------|
| `setRelation(nationId, value)` | Sets relation (0-100), applies diplomacy skill bonus to improvements, emits `DIPLOMATIC_RELATION_CHANGED` |
| `getRelation(nationId)` | Returns relation value or 50 default |

### Research

| Method | Description |
|--------|-------------|
| `processResearch()` | Generates research points from population + tech + intuition skill, applies to current research, completes when threshold met |
| `completeResearch()` | Adds technology, applies benefits, resets progress, emits `RESEARCH_COMPLETED` |
| `applyResearchBenefits(benefits)` | Applies benefit effects (economicBonus, militaryBonus, etc.) |
| `startResearch(researchId)` | Starts a new research project |

### Random Events

| Method | Description |
|--------|-------------|
| `triggerRandomEvent()` | Picks random event from `NationEvents`, applies effects, emits `RANDOM_EVENT` |
| `applyEventEffects(event)` | Applies stat multipliers (0-2) or additions, clamps happiness/stability/reputation |

### Save / Load

| Method | Description |
|--------|-------------|
| `serialize()` | Returns plain object with all nation state (Sets → arrays, Maps → objects) |
| `deserialize(data)` | Restores nation from serialized data (arrays → Sets/Maps, objects → plain objects) |

### Overview / Info

| Method | Description |
|--------|-------------|
| `getOverview()` | Returns summary object: basic info, statistics, resources, economy, territories, technologies |
| `getFlagAsImage()` | Returns flag image data URL (uploaded or rendered via `FlagDisplay`) |
| `setFlag(flagData)` | Sets flag, emits DOM event, saves to localStorage |
| `saveFlagToSettings(flagData)` | Persists flag to `localStorage` |
| `loadFlagFromSettings()` | Loads flag from `localStorage` |

### Event Handlers

| Method | Triggered By |
|--------|-------------|
| `handleDayPassed(data)` | Daily tick (`DAY_PASSED`) |
| `handleMonthPassed(data)` | Monthly tick (`MONTH_PASSED`) |
| `handleYearPassed(data)` | Yearly tick (`YEAR_PASSED`) |
| `handleResourcesChanged(data)` | Resource changes (`RESOURCES_CHANGED`) |

## Integration with Other Systems

| System | Direction | Integration |
|--------|-----------|-------------|
| `Window.Player` | Reads | `getSkillValue('taxation')`, `getSkillValue('intuition')`, `getSkillValue('attack')`, `getSkillValue('defense')`, `getSkillValue('energy')`, `getSkillValue('luck')`, `getSkillValue('diplomacy')`, `_awardExperience()` |
| `Window.PopulationSystem` | Reads/writes | Per-citizen tax collection (`payTaxesToNation`), military enlistment (`enlistMilitaryPopulation`) |
| `Window.WorldBankSystem` | Reads/writes | Interest rates (`calculateTaxInterestRate`/`calculateBillInterestRate`), territory purchase recording (`recordTerritoryPurchase`) |
| `Window.EdictSystem` | Reads/writes | Edict initialization (`initializeNationEdicts`), effect application (`applyEdictEffects`) |
| `Window.GameTime` | Reads | Nation age calculation (`nationAgeDays(this.foundedDay)`) |
| `Window.GameEngine` | Reads | Projects system (`processDaily`), wonders system (`processDaily`) |
| `Window.GovernmentSystem` | Reads | Government type data, hints |
| `Window.ReligionSystem` | Reads | Religion type data, hints |
| `EventBus` | Emits | `NATION_CREATED`, `NATION_UPDATED`, `NATION_LOADED`, `RESOURCES_CHANGED`, `HAPPINESS_CHANGED`, `TERRITORY_ADDED`, `TERRITORY_REMOVED`, `MILITARY_TRAINED`, `RESEARCH_COMPLETED`, `GOVERNMENT_CHANGED`, `RELIGION_CHANGED`, `GOVERNMENT_DEMAND`, `RELIGION_DEMAND`, `ACHIEVEMENT_UNLOCKED`, `RANDOM_EVENT`, `ANNUAL_REPORT`, `INFRASTRUCTURE_BUILT`, `TRADE_COMPLETED` |

## Skill Integration (Player Skills)

| Skill | Effect on Nation |
|-------|-----------------|
| **Taxation** | Each level adds 1.75% to tax rate (max 35%) |
| **Intuition** | Research generation multiplier |
| **Attack** | Military training cost discount (max 20%), military strength bonus |
| **Defense** | Military strength bonus |
| **Energy** | Action energy for attacks/missiles/nukes |
| **Luck** | Trade efficiency bonus |
| **Diplomacy** | Relation improvement bonus, XP multiplier |

## Limits & Caps

| Limit | Value |
|-------|-------|
| Max taxation bonus | 35% (20 levels × 1.75%) |
| Max diplomacy bonus | 50% (20 levels × 2.5%) |
| Military cap | 50% of population (weighted: soldiers=1, tanks=2, aircraft=3, ships=5) |
| Population efficiency | 0.5 to 1.5 |
| Military morale | 0.5 to 1.5 |
| Tax efficiency | 0.5 to 1.5 |
| Happiness modifier | 0.5 to 2.0 |

## Data Flow (Daily Turn)

```
handleDayPassed()
  → processTemporaryEffects()
  → payMilitaryMaintenance()
  → calculatePopulation()
  → applyEdictEffects()
  → calculateNationStats()  [literacy, pollution, disease, crime, happiness, environment, derived effects]
  → collectTaxes()          [World Bank interest on stacked taxes]
  → calculateEconomy()      [tax revenue from citizens, money += taxRevenue]
  → Player.applyToNation()  [skill bonuses]
  → updateMilitaryStrength()
  → processResearch()
  → checkDemands()
  → updateHappiness()
  → ProjectsSystem.processDaily()
  → WondersSystem.processDaily()
  → statistics.totalTurns++
  → emit NATION_UPDATED
```

## Notes

- `this.money` is the authoritative money field. `this.resources.money` exists for backward compatibility but all money operations use `this.money` directly.
- `this.military` (line 100) is declared but unused; `this.militaryUnits` is the authoritative military unit store.
- `this.resourceGeneration` is a legacy display-only field; actual income is computed by `calculateEconomy()`.
- Citizens are tracked by `PopulationSystem`, not by Nation. `Nation.cities` is an array of city ID strings (City.js was removed as dead code).
- All monetary values use `this.money`. Resource trades use `this.resources[resource]` with `|| 0` guards to prevent NaN.
