# Population System

Handles population lifecycle, demographics, aging, births, deaths, military enlistment, taxation, migration, territory density effects, and population situations for nations.

## Overview

| Item | Value |
|------|-------|
| **System class:** | `PopulationSystem` |
| **Global instance:** | `window.PopulationSystem` |
| **Update frequency:** | Every game day (via `day_passed` EventBus event) |
| **Primary config:** | `systems/population-system.js` |
| **Depends on:** | `CitizenJobSystem` (jobs, income, taxation), `CitizenTiesSystem` (relationships on death), `TimeSystem` (current day) |

The population system tracks individual citizens in real time. Each citizen has a `birthTime` timestamp and ages by wall-clock days (not game turns). Citizens progress through age groups: Newborn → Infant → Toddler → Child → Teen → Young Adult → Adult → Middle Aged → Older → Senior → Elderly → Death. There is **no hard age cap** — citizens of any age can die based on probability, with elderly citizens gaining extra death chance as they grow older.

---

## Dual Population Model

The system maintains two population models that are kept in sync:

1. **Citizens Map** (`this.citizens`) — Individual citizen objects with `birthTime`, `ageGroup`, `literacyScore`, `job`, `isMilitary`, `unitType`, `isVeteran`, etc. This is the authoritative source for `getTotalPopulation()`.
2. **Territorial Distribution** (`this.territorialDistribution`) — Per-territory population counts, capacity, density, and happiness. Used for map-level analysis and density effects.

`syncTerritorialDistributionWithCitizens()` redistributes citizens evenly across territories whenever citizens are born, die, age, enlist, or are killed in combat to keep both models consistent.

---

## Real-Time Age Groups

Age group boundaries mirror `this.ageGroupConfig` exactly. `elderly.maxDays = Infinity` — there is no hard age cap.

| Age Group | minDays | maxDays | Taxable | Military Eligible | Employment |
|-----------|---------|---------|---------|-------------------|------------|
| Newborn | 0 | 5 | No | No | `not_applicable` |
| Infant | 5 | 12 | No | No | `not_applicable` |
| Toddler | 12 | 20 | No | No | `not_applicable` |
| Child | 20 | 35 | No | No | `not_applicable` |
| Teen | 35 | 105 | Yes | Yes | `employed`/`unemployed`/`student` |
| Young Adult | 105 | 175 | Yes | Yes | `employed`/`unemployed` |
| Adult | 175 | 245 | Yes | Yes | `employed`/`unemployed` |
| Middle Aged | 245 | 315 | Yes | Yes | `employed`/`unemployed` |
| Older | 315 | 335 | Yes | Yes | `employed`/`unemployed` |
| Senior | 335 | 355 | No | No | `retired` |
| Elderly | 355 | ∞ | No | No | `retired` |

### Aging Rules

- Citizens age by real-time wall-clock days (`Date.now() - birthTime`) via `processDailyAging()`.
- When a citizen's ageDays crosses a group boundary, they are reassigned to the correct age group.
- **No max age death:** Citizens never die simply for reaching an age threshold. Death is purely probability-based (see Natural Deaths below).
- **Elderly frailty bonus:** Once an elderly citizen is older than 375 days, they gain an extra 0.1% death chance per 3 days above 375, capped at 5% extra. When any elderly citizen dies of natural causes, there is a chance one additional elderly citizen dies from age-related frailty (based on that bonus chance).
- **Replacement births:** When a citizen dies of old age during `processDailyAging`, a replacement newborn is scheduled after a **2-turn buffer** via `pendingBirths`.

---

## Territory / Map Effects on Population

Population density only applies to territories that have been added to the nation (selected map pieces). Until a map piece is selected and added, that land does **not** contribute to population density calculations.

### Density Effects on Nation Stats

Population density (people per square mile across all territories) affects nation stats:

| Weighted Density | Crime Increase | Disease Increase | Happiness Decrease |
|-----------------|---------------|------------------|-------------------|
| < 10 people/sq mi | +0 | +0 | +0 |
| 10–50 | +1 | +1 | -1 |
| 50–100 | +3 | +2 | -2 |
| 100–200 | +6 | +4 | -6 |
| 200–500 | +10 | +6 | -10 |
| > 500 | +15 | +10 | -10 |

These are applied automatically by `applyDensityEffectsToNation()` during each `updateHappinessFactors()` call.

### Territory Data Stored

When `handleTerritoryAdded()` is called, each territory stores:
- `population` — Current population in that territory
- `capacity` — Maximum population capacity (based on infra × land)
- `landMiles` — Land area in square miles (defaults to 1000 if not provided)
- `happiness` — Territory-specific happiness (0–100)
- `density` — `population / capacity` ratio
- `growth` — Daily growth amount

---

## Population Statistics

The system tracks cumulative population statistics across all gameplay:

| Stat | Description |
|------|-------------|
| `born` | Total citizens born (natural births, replacement births, immigrants) |
| `died` | Total citizens died (old age, natural causes, combat) |
| `enlisted` | Total citizens enlisted into military |
| `diedInCombat` | Total citizens who died in combat |
| `reachedSenior` | Total citizens who reached senior age |
| `emigrated` | Total citizens who emigrated |

These are exposed via `getPopulationOverview().populationStats` and recorded daily in `populationHistory`.

---

## Taxable Population

Only citizens aged **Teen through Older** pay taxes and contribute to turn revenue.

**Non-taxable groups:** Newborn, Infant, Toddler, Child, Senior, Elderly.

`getTaxablePopulation()` returns the count of all taxable citizens. This is used in:
- Turn revenue calculations (via `Nation.calculateEconomy()`)
- Population growth income factor (`calculatePopulationGrowthRate`)

As a nation grows and more citizens reach taxable age, the income factor increases (0.5 to 1.5 multiplier based on taxable share of total population).

---

## Military Population & Enlistment

Only citizens aged **Teen through Older** are military-eligible.

### Citizens Keep Their Jobs When Enlisted

When military units are purchased via `Nation.trainMilitary()`, citizens are **NOT removed** from the population. Instead:

1. `enlistMilitaryPopulation(amount, unitType)` marks actual citizens as `isMilitary = true`, sets their `unitType` (`'soldier'`, `'tank'`, `'aircraft'`, or `'ship'`), and sets `isVeteran = false`.
2. Each unit = 1 citizen tied to that unit.
3. Citizens keep their jobs, relationships, and everything else — they are just flagged as military.
4. Citizens are selected from military-eligible age groups in this order: Young Adult → Adult → Middle Aged → Older → Teen.

### Unit Deaths Kill Citizens

When units are destroyed in combat:

1. `killMilitaryCitizensForUnitLoss(unitType, count)` first kills citizens marked as military with matching `unitType`.
2. If there aren't enough military citizens of that type, it finds non-military citizens from appropriate demographics (tank/aircraft/ship → Adult/MiddleAged/Older/YoungAdult/Teen).
3. Each death calls `CitizenTiesSystem.handleCitizenDeath()` for relationship aftermath (preserving family roles — only spouse/partner links are cleared).
4. Citizens are removed from the population Map — this is the only path (besides old age) that permanently removes citizens.

### Senior Citizens Become Veterans

When a military citizen reaches Senior age during `processDailyAging`:
- Their military unit count is decremented on `Nation.militaryUnits[unitType]`.
- They become `isVeteran = true`, `isMilitary = false`, `unitType = null`, `relationshipStatus = 'veteran'`.
- They remain in the population — only the unit is decommissioned.

### Military Population Penalty (Economy Separate)

A separate economy-level check (`checkMilitaryPenalty`) compares drafted military count against military-eligible population. If draft exceeds **50%** of eligible population, population growth rate is multiplied by **0.5**. This is separate from the happiness-based military usage penalty in `Nation.applyMilitaryHappinessPenalty()`.

---

## Natural Population Growth & Deaths

Daily population growth is calculated by `calculatePopulationGrowthRate()`.

### Births

```
dailyBirthRate = baseBirthRate/365 × happinessFactor × diseaseFactor × environmentFactor × pollutionFactor × edictModifier
```

- **Happiness factor:** 0.5 (at 0) to 1.5 (at 100)
- **Disease factor:** 1.0 down to 0.1 as disease increases
- **Environment factor:** 0.5 (at 0) to 1.5 (at 100)
- **Pollution factor:** 1.0 down to 0.1 as pollution increases
- **Edict modifier:** `dailyRate × edictBirthMod` (multiply, not add — e.g., 1.2 = 20% increase)

Births only apply when conditions support positive growth.

### Deaths (Natural)

```
dailyDeathRate = baseDeathRate/365 × combinedDeathModifier (capped at 1.25)
```

Each condition factor adds up to 25% extra death chance:

| Factor | Low → High Effect | Max |
|--------|-------------------|-----|
| **Happiness** | Lower happiness = more deaths | +25% |
| **Disease** | Higher disease = more deaths | +25% |
| **Pollution** | Higher pollution = more deaths | +25% |
| **Crime** | Higher crime = more deaths | +25% |

Combined modifier capped at **1.25** (25% extra max).

Deaths are selected from age groups with normalized probabilities (newborn 2%, infant 1%, toddler 0.5%, child 0.2%, teen 0.5%, young adult 1%, adult 1.5%, middle aged 3%, older 8%, senior 23%, elderly 60.3%). Elderly citizens also get the frailty bonus described above.

Old-age deaths are handled separately by `processDailyAging()` (scheduled replacement birth after 2-turn buffer).

---

## Migration

`processMigration()` handles daily immigration and emigration based on nation attractiveness:

| Attractiveness Factor | Effect |
|----------------------|--------|
| Happiness | Higher = more attractive |
| Literacy | Higher = more attractive |
| Technology | Higher = more attractive |
| Pollution | Higher = less attractive |
| Disease | Higher = less attractive |
| Crime | Higher = less attractive |

Migration policy modifiers:

| Policy | Multiplier |
|--------|------------|
| Open | 2.0× |
| Balanced | 1.0× |
| Restricted | 0.5× |

Immigrants are typically working-age (Teen through Older). Emigrants are typically Young Adults or Adults. Emigration is tracked as a population stat (not counted as death).

---

## Literacy Progression

Citizens gain literacy when they **transition between demographic groups** (not daily). Each transition grants a random percentage of the nation's literacy rate:

| Transition | Gain (% of national literacy) |
|------------|------------------------------|
| Newborn → Infant | 1% – 3% |
| Infant → Toddler | 4% – 8% |
| Toddler → Child | 9% – 16% |
| Child → Teen | 24% – 41% |
| Teen → YoungAdult | 29% – 51% |
| YoungAdult → Adult | 31% – 56% |
| Adult → MiddleAged | 32% – 59% |
| MiddleAged → Older | 32.5% – 61% |
| Older → Senior | 32.5% – 61% |
| Senior → Elderly | 32.5% – 61% |

**Gifted citizens** (~5% at birth): Learn 50% faster and can exceed the nation literacy cap by up to +20 points.

**Non-gifted citizens**: Capped at the nation's literacy rate.

---

## Population Situations

Every 3 days, the system may trigger a population situation (e.g., Housing Shortage, Epidemic Outbreak, Teacher Shortage, Automation Displaces Workers). Every 5 days a nation situation may trigger. Every 4 days a military situation may trigger.

Each situation presents choices with effects on happiness, money, literacy, crime, disease, pollution, environment, employment, economy, culture, unity, infrastructure, traffic, energy, dependence, efficiency, and more.

Situation effects are applied immediately and tracked with an expiry day. When expired, they are removed from active effects (the effects themselves are permanent changes to nation stats).

There is a one-time history reset guard — if most situations have been used, history resets once to allow re-triggering, then stops to prevent infinite recursion.

---

## Key Methods

### Population Queries

| Method | Returns |
|--------|---------|
| `getTotalPopulation()` | Total citizen count (from `citizens` Map) |
| `getTaxablePopulation()` | Count of Teen through Older citizens |
| `getMilitaryEligiblePopulation()` | Count of Teen through Older citizens |
| `getDraftedMilitaryPopulation()` | Current drafted military count (sum of all military unit types) |
| `checkMilitaryPenalty()` | Growth multiplier (1.0 or 0.5 if >50% of eligible drafted) |
| `getPopulationOverview()` | Full overview object for UI |
| `calculatePopulationGrowthRate()` | Daily growth rate as a decimal |
| `getAverageLiteracy()` | Average literacy score across all citizens |

### Population Modification

| Method | Description |
|--------|-------------|
| `enlistMilitaryPopulation(amount, unitType)` | Mark citizens as military (isMilitary=true, unitType set). Citizens keep jobs. |
| `killMilitaryCitizensForUnitLoss(unitType, count)` | Kill citizens for unit loss in combat (military first, then demographics) |
| `recordMilitaryCombatDeaths(count, unitType)` | Record combat deaths (delegates to unit-loss if unitType provided) |
| `createImmigrant()` | Creates a working-age immigrant citizen |
| `processEmigration()` | Removes a random Young Adult/Adult citizen (tracked as emigrated, not death) |
| `setMigrationPolicy(policy)` | Sets `open`, `restricted`, or `balanced` |
| `applyDensityEffectsToNation()` | Applies density-based crime/disease/happiness effects |
| `processDailyAging()` | Age citizens, literacy transitions, old-age deaths + replacement births |

### Analysis Methods

| Method | Returns |
|--------|---------|
| `identifyDemographicShifts()` | Array of demographic shift descriptions |
| `analyzeEmploymentTrends()` | Employment statistics object |
| `analyzeEducationProgress()` | Education progress object |
| `analyzeMigrationImpact()` | Migration impact object |
| `identifyPopulationChallenges()` | Array of challenge descriptions |
| `generateRecommendations()` | Array of recommendation strings |

### State Save/Load

`getState()` and `setState()` persist: age groups, citizens (via `Citizen.toJSON()`/`Citizen.deserialize()`), next citizen ID, vital rates, territorial distribution, migration factors, migration policy, population situations, employment, education, pending births, population stats, and history.

---

## Data Flow (Daily Update)

```
handleDayPassed()
  → updatePopulationGrowth()          # Calculate territorial growth
  → updateHappinessFactors()          # Update territory happiness + density effects
  → processTerritorialMigration()     # Move people between territories
  → processDailyAging()               # Age citizens, literacy, old-age deaths + replacements
  → processBirthsAndDeaths()          # Natural births and deaths
  → processMigration()                # Immigration/emigration
  → updateEmploymentAndEducation()    # Recalculate employment/education stats
  → CitizenJobSystem.assignJobsToCitizens()  # Stable job assignment with upgrades/turnover
  → CitizenJobSystem.applyIncomes()   # Calculate incomes with tax multipliers
  → CitizenTiesSystem.processRelationships() # Dating, marriage, divorce, widowhood, newborns
  → checkPopulationSituations()       # Trigger situations every 3 days
  → processActiveSituationEffects()   # Expire old situation effects
  → checkNationSituations()           # Nation situations every 5 days
  → checkMilitarySituations()         # Military situations every 4 days
  → updateDemographics()              # Sync demographics object
  → recordDailyHistory()              # Record daily stats
  → recordPopulationHistory()         # Record legacy history arrays
  → updateNationPopulation()          # Sync window.Nation.population
  → syncTerritorialDistributionWithCitizens()  # Final dual-model sync
```

---

## Configuration Defaults

| Setting | Default | Description |
|---------|---------|-------------|
| `baseBirthRate` | 0.035 | 3.5% annual base birth rate |
| `baseDeathRate` | 0.01 | 1% annual base death rate |
| `migrationRate` | 0.005 | 0.5% annual migration rate |
| `militaryPenaltyThreshold` | 0.5 | 50% of eligible population drafted triggers growth penalty |
| `militaryPenaltyGrowthMultiplier` | 0.5 | Growth multiplier when penalty active |
| `situationInterval` | 3 days | Population situations checked every 3 days |
| `maxHistoryLength` | 365 | Days of history retained |
| `elderlyFrailtyStartDays` | 375 | Days above which elderly gain extra death chance |
| `elderlyFrailtyRate` | 0.001 | 0.1% extra death per 3 days above threshold |
| `elderlyFrailtyCap` | 0.05 | 5% max extra death chance from frailty |
