# Nation Entity

Represents the core nation-state object — the central entity for every player nation in Sovereignty Epochs. **Nation.js is a pure state container.** All system logic (daily turns, population, economy, statistics, government/religion, research, military, trade, monthly/annual processing) has been extracted to `systems/nation-system.js` (`NationSystem`). Nation.js holds only state fields and basic accessors.

| Item | Value |
|------|-------|
| **Class:** | `NationClass` |
| **Singleton instance:** | `window.Nation` |
| **Class reference:** | `window.NationClass` (for AI nations) |
| **Source file:** | `entities/Nation.js` |
| **Loaded in:** | `index.html` (after entities/Citizen.js, entities/Player.js) |
| **Save/Load:** | Yes — `serialize()` / `deserialize()` supported |
| **System logic:** | Delegated to `window.NationSystem` (`systems/nation-system.js`) |
| **Depends on:** | `GameConfig`, `EventBus`, `GameTime`, `Window.Player`, `Window.PopulationSystem`, `Window.WorldBankSystem`, `Window.EdictSystem`, `Window.GovernmentSystem`, `Window.ReligionSystem`, `Window.GameEngine` |

---

## Architecture: Entity vs System

Nation follows a strict entity/system split:

| Layer | Responsibility | File |
|-------|---------------|------|
| **Entity (state)** | Holds all nation state fields: land, infra, tech, population, money, military units, nationStats, relations, statistics, etc. | `entities/Nation.js` |
| **System (behavior)** | All logic: `calculatePopulation()`, `calculateNationStats()`, `calculateEconomy()`, `handleDayPassed()`, `trainMilitary()`, etc. | `systems/nation-system.js` |

The `Nation` entity's `handleDayPassed()`, `handleMonthPassed()`, and `handleYearPassed()` methods delegate entirely to `NationSystem`:

```js
handleDayPassed(data) {
    if (window.NationSystem) {
        return window.NationSystem.handleDayPassed(data);
    }
    // No fallback — does nothing if NationSystem unavailable
}
```

All system methods that previously existed on Nation (`calculatePopulation`, `calculateNationStats`, `calculateEconomy`, `trainMilitary`, `calculateMilitaryCost`, `updateMilitaryStrength`, `applyGovernmentBonuses`, etc.) have been **removed from Nation.js** and now live exclusively in `NationSystem`.

---

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
| `governmentHappinessBonus` | number | `1.0` | Multiplier applied by `NationSystem.calculateHappiness()` |
| `religionHappinessBonus` | number | `1.0` | Multiplier applied by `NationSystem.calculateHappiness()` |

### Core Stats

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `land` | number | `GameConfig.INITIAL_LAND` | Land in miles |
| `infra` | number | `GameConfig.INITIAL_INFRA` | Infrastructure level |
| `tech` | number | `GameConfig.INITIAL_TECH` | Technology level (starts at 0) |
| `sharedTechnology` | number | `0` | Technology shared from allies/research treaties |
| `population` | number | `0` | Computed each turn by `NationSystem.calculatePopulation()` |
| `happiness` | number | `GameConfig.INITIAL_HAPPINESS` | Current happiness (0-100) |
| `stability` | number | `100` | Nation stability (0-100) |
| `reputation` | number | `50` | International reputation (0-100) |
| `gdp` | number | `0` | Gross Domestic Product, computed each turn |

### Money / Economy

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `money` | number | `GameConfig.INITIAL_RESOURCES.money` | Cash on hand ($10,000,000) |
| `taxRate` | number | `GameConfig.BASE_TAX_RATE` | Current tax rate percentage (2.5% base) |
| `taxableIncome` | number | `0` | Computed each turn by `NationSystem.calculateEconomy()` |
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

---

## Constructor

```js
new NationClass()
```

Creates an empty nation with default values. The singleton `window.Nation` is created automatically on module load but is **uninitialized** until `NationClass.create(nationData)` or `nation.initialize(nationData)` is called.

---

## Methods

### Initialization

| Method | Description |
|--------|-------------|
| `initialize(nationData)` | Sets all fields from nationData, delegates government/religion bonuses to `NationSystem`, initializes diplomacy via `GameEngine.systems.diplomacy`, starts demand timers via `NationSystem`, initializes edicts via `EdictSystem`, runs first population/tax calculation via `NationSystem`, loads flag, emits `NATION_CREATED` |
| `static create(nationData)` | Factory: creates `new NationClass()`, calls `initialize()`, replaces `window.Nation`. Returns false if nation already initialized |
| `bindEvents()` | Binds `DAY_PASSED`, `MONTH_PASSED`, `YEAR_PASSED` event listeners (delegated to `NationSystem`) |
| `destroy()` | Unbinds all event listeners, marks uninitialized |

### Delegated Turn Handlers

| Method | Description |
|--------|-------------|
| `handleDayPassed(data)` | Delegates to `NationSystem.handleDayPassed(data)` — full daily pipeline |
| `handleMonthPassed(data)` | Delegates to `NationSystem.handleMonthPassed(data)` — diplomacy drift, monthly events, stability |
| `handleYearPassed(data)` | Delegates to `NationSystem.handleYearPassed(data)` — annual statistics, achievements, report |

### Entity State Accessors

| Method | Description |
|--------|-------------|
| `getRelation(nationId)` | Returns diplomatic relation value (0-100) or 50 default |
| `setRelation(nationId, value)` | Sets relation (0-100), applies player diplomacy skill bonus, emits `DIPLOMATIC_RELATION_CHANGED` |
| `addTerritory(territory)` | Adds territory ID, tracks area, awards experience, emits `TERRITORY_ADDED` |
| `removeTerritory(territoryId)` | Removes territory ID, decrements `totalArea`, emits `TERRITORY_REMOVED` |

### Flag Management

| Method | Description |
|--------|-------------|
| `setFlag(flagData)` | Sets flag, emits DOM event `nationFlagUpdated`, saves to localStorage |
| `getFlag()` | Returns current flag object |
| `saveFlagToSettings(flagData)` | Persists flag to `localStorage` |
| `loadFlagFromSettings()` | Loads flag from `localStorage` |
| `getFlagAsImage()` | Returns flag image data URL (uploaded or rendered via `FlagDisplay`) |

### National Pet (cosmetic only)

| Method | Description |
|--------|-------------|
| `getNationalPet()` | Returns the nation's selected pet icon |
| `setNationalPet(petIcon)` | Sets pet icon (validated against `WorldLotterySystem.getPetIcons()`), emits no events |

---

## Save / Load

| Method | Description |
|--------|-------------|
| `serialize()` | Returns plain object with all nation state (Sets → arrays, Maps → objects). Includes all state fields: identity, stats, economy, military, research, map, diplomacy, gov/religion, statistics, edicts, sports, wonders |
| `deserialize(data)` | Restores nation from serialized data (arrays → Sets/Maps, objects → plain objects). Ensures edict state exists, applies edict effects, emits `NATION_LOADED` |

---

## Overview / Info

| Method | Description |
|--------|-------------|
| `getOverview()` | Returns summary object: basic info (name, leader, government, founded, age), statistics (population, gdp, happiness, stability, reputation, militaryStrength), resources, economy, territories count, technologies count |

---

## Integration with Other Systems

| System | Direction | Integration |
|--------|-----------|-------------|
| `Window.Player` | Reads | `getSkillValue('taxation')`, `getSkillValue('intuition')`, `getSkillValue('attack')`, `getSkillValue('defense')`, `getSkillValue('luck')`, `getSkillValue('diplomacy')`, `_awardExperience()` |
| `Window.PopulationSystem` | Reads/writes | Per-citizen tax collection (`payTaxesToNation`), military enlistment (`enlistMilitaryPopulation`) — delegated to `NationSystem` |
| `Window.WorldBankSystem` | Reads/writes | Interest rates, territory purchase recording — delegated to `NationSystem` |
| `Window.EdictSystem` | Reads/writes | Edict initialization, effect application — delegated to `NationSystem` |
| `Window.GameTime` | Reads | Nation age calculation (`nationAgeDays(this.foundedDay)`) |
| `Window.GameEngine` | Reads | Projects system (`processDaily`), wonders system (`processDaily`) — delegated to `NationSystem` |
| `Window.GovernmentSystem` | Reads | Government type data, hints — delegated to `NationSystem` |
| `Window.ReligionSystem` | Reads | Religion type data, hints — delegated to `NationSystem` |
| `Window.NationSystem` | Delegates | All system behavior: turn handlers, statistics, economy, military, research, government, religion, monthly/annual |
| `EventBus` | Emits | `NATION_CREATED`, `NATION_UPDATED`, `NATION_LOADED`, `RESOURCES_CHANGED`, `HAPPINESS_CHANGED`, `TERRITORY_ADDED`, `TERRITORY_REMOVED`, `MILITARY_TRAINED`, `RESEARCH_COMPLETED`, `GOVERNMENT_CHANGED`, `RELIGION_CHANGED`, `GOVERNMENT_DEMAND`, `RELIGION_DEMAND`, `ACHIEVEMENT_UNLOCKED`, `RANDOM_EVENT`, `ANNUAL_REPORT`, `INFRASTRUCTURE_BUILT`, `TRADE_COMPLETED` |

---

## Limits & Caps

| Limit | Value | Enforced By |
|-------|-------|-------------|
| Military cap | 50% of population (weighted: soldiers=1, tanks=2, aircraft=3, ships=5) | `NationSystem.trainMilitary()` |
| Population efficiency | 0.5 to 1.5 | `NationSystem.calculateDerivedEffects()` |
| Military morale | 0.5 to 1.5 | `NationSystem.calculateDerivedEffects()` |
| Tax efficiency | 0.5 to 1.5 | `NationSystem.calculateDerivedEffects()` |
| Happiness modifier | 0.5 to 2.0 | `NationSystem.calculateDerivedEffects()` |

---

## Notes

- `this.money` is the authoritative money field. `this.resources.money` exists for backward compatibility but all money operations use `this.money` directly.
- `this.military` (declared in constructor) is unused; `this.militaryUnits` is the authoritative military unit store.
- `this.resourceGeneration` is a legacy display-only field; actual income is computed by `NationSystem.calculateEconomy()`.
- Citizens are tracked by `PopulationSystem`, not by Nation. `Nation.cities` is an array of city ID strings (City.js was removed as dead code).
- All monetary values use `this.money`. Resource trades use `this.resources[resource]` with `|| 0` guards to prevent NaN.
- Nation.js contains **no system calculation logic**. If you need to calculate population, economy, military strength, statistics, etc., call the corresponding method on `window.NationSystem`.
