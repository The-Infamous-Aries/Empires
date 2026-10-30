# Population System

Handles population lifecycle, demographics, aging, births, deaths, military enlistment, taxation, migration, territory density effects, and population situations for nations.

## Overview

| Item | Value |
|------|-------|
| **System class:** | `PopulationSystem` |
| **Global instance:** | `window.PopulationSystem` |
| **Update frequency:** | Every game day (via `day_passed` EventBus event) |
| **Primary config:** | `systems/population-system.js` |

The population system tracks individual citizens in real time. Each citizen has a `birthTime` timestamp and ages by wall-clock days (not game turns). Citizens progress through age groups: Newborn → Infant → Toddler → Child → Teen → Young Adult → Adult → Middle Aged → Older → Senior → Elderly → Death.

## Dual Population Model

The system maintains two population models that are kept in sync:

1. **Citizens Map** (`this.citizens`) — Individual citizen objects with `birthTime`, `ageGroup`, `literacyScore`, `job`, etc. This is the authoritative source for `getTotalPopulation()`.
2. **Territorial Distribution** (`this.territorialDistribution`) — Per-territory population counts, capacity, density, and happiness. Used for map-level analysis and density effects.

`syncTerritorialDistributionWithCitizens()` is called at the end of every `handleDayPassed()` and whenever citizens are born, die, age, or are enlisted/discharged from military to keep both models consistent.

---

## Real-Time Age Groups

| Age Group | Days Since Birth | Taxable | Military Eligible | Employment |
|-----------|-----------------|---------|-------------------|------------|
| Newborn | 0–3 | No | No | `not_applicable` |
| Infant | 3–7 | No | No | `not_applicable` |
| Toddler | 7–10 | No | No | `not_applicable` |
| Child | 10–14 | No | No | `not_applicable` |
| Teen | 14–45 | Yes | Yes | `employed`/`unemployed`/`student` |
| Young Adult | 45–75 | Yes | Yes | `employed`/`unemployed` |
| Adult | 75–100 | Yes | Yes | `employed`/`unemployed` |
| Middle Aged | 100–120 | Yes | Yes | `employed`/`unemployed` |
| Older | 120–134 | Yes | Yes | `employed`/`unemployed` |
| Senior | 134–164 | No | No | `retired` / `eligible_for_work`* |
| Elderly | 164–178 | No | No | `retired` |

*With `seniors_work_tax_half` research active, Seniors can work and are taxed at half rate (`eligible_for_work`).

- **Newborn → Teen:** 14 days real time
- **Teen → Senior:** ~120 days real time (~4 months)
- **Senior → Elderly:** ~30 days real time (~1 month)
- **Elderly → Death:** ~14 days real time
- **Total lifespan:** ~178 days real time

When a citizen reaches the death threshold (~178 days old), they die of old age and a replacement newborn is scheduled after a **2-turn buffer** (via `pendingBirths`).

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
| `died` | Total citizens died (old age, natural causes, combat, emigration) |
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

Only citizens aged **Teen through Older** can be drafted into the military. Children and below, plus Seniors and Elderly, do not count toward military-eligible population.

### Enlistment Depletion Order

When buying military units, population is depleted from demographic groups in this exact order:

1. **Young Adult**
2. **Adult**
3. **Middle Aged**
4. **Older**
5. **Teen**

Each group is fully depleted before moving to the next. Citizens are removed from the individual `citizens` Map and the `ageGroups` counts are reduced.

### Discharge and Age Resumption

When citizens are discharged from military (units decommissioned, not combat-killed), they are returned to the citizens Map with their age group **recalculated** from their original `birthTime` vs current time. This means they resume aging where they left off — they do not remain frozen at their enlistment age.

### Military Population Penalty

When drafted military exceeds **50%** of the military-eligible population:

- Population growth rate is multiplied by **0.5** (50% reduction)
- `militaryPenaltyActive` becomes `true` in the population overview

Thresholds are configurable via `militaryPenaltyThreshold` and `militaryPenaltyGrowthMultiplier`.

---

## Natural Population Growth

Daily population growth is calculated by `calculatePopulationGrowthRate()` and combines these factors:

| Factor | Effect |
|--------|--------|
| **Base rate** | `baseBirthRate` − `baseDeathRate` (annual, divided by 365) |
| **Happiness** | 0.5 (at 0 happiness) to 1.5 (at 100 happiness) |
| **Disease** | Reduces growth as disease increases (min 0.1×) |
| **Environment** | 0.5 (at 0) to 1.5 (at 100) |
| **Pollution** | Reduces growth as pollution increases (min 0.1×) |
| **Taxable income** | 0.5 to 1.5 based on taxable share of population |
| **Military penalty** | 0.5× when military draft exceeds 50% of eligible population |

**Births** are only applied when conditions support positive growth. **Deaths** always apply and scale with disease, pollution, and low happiness. Old-age deaths are handled separately by `processDailyAging()`.

When the nation thrives (high happiness, low disease/pollution, high environment, high taxable income), population grows faster. When stats are neglected, population shrinks.

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

Immigrants are typically working-age (Teen through Older). Emigrants are typically Young Adults or Adults. Emigration is tracked as a population stat.

---

## Literacy Progression

Citizens gain literacy when they **transition between demographic groups** (not daily). Each transition grants a random percentage of the nation's literacy rate:

| Transition | Gain (% of national literacy) |
|------------|------------------------------|
| Newborn → Infant | 1.00% – 3.00% |
| Infant → Toddler | 3.00% – 5.00% |
| Toddler → Child | 5.00% – 8.00% |
| Child → Teen | 15.00% – 25.00% |
| Teen → YoungAdult | 5.00% – 10.00% |
| YoungAdult → Adult | 2.00% – 5.00% |
| Adult → MiddleAged | 1.00% – 3.00% |
| MiddleAged → Older | 0.50% – 2.00% |
| Older → Senior | 0% (plateau) |
| Senior → Elderly | 0% (no gain) |

**Gifted citizens** (~5% at birth): Learn 50% faster and can exceed the nation literacy cap by up to +20 points.

**Non-gifted citizens**: Capped at the nation's literacy rate.

This means toddlers are never as literate as seniors — citizens gain literacy as they advance through demographics.

---

## Population Situations

Every 3 days, the system may trigger a population situation (e.g., Housing Shortage, Epidemic Outbreak, Teacher Shortage, Automation Displaces Workers). Each situation presents 3 choices with effects on happiness, money, literacy, crime, disease, pollution, environment, employment, economy, culture, unity, infrastructure, traffic, energy, dependence, efficiency, and more.

Situation effects are applied immediately and tracked with an expiry day. When expired, they are removed from active effects (the effects themselves are permanent changes to nation stats).

---

## Key Methods

### Population Queries

| Method | Returns |
|--------|---------|
| `getTotalPopulation()` | Total citizen count (from `citizens` Map) |
| `getTaxablePopulation()` | Count of Teen through Older citizens |
| `getMilitaryEligiblePopulation()` | Count of Teen through Older citizens |
| `getDraftedMilitaryPopulation()` | Current drafted military count |
| `checkMilitaryPenalty()` | Growth multiplier (1.0 or 0.5 if penalty active) |
| `getPopulationOverview()` | Full overview object for UI |
| `calculatePopulationGrowthRate()` | Daily growth rate as a decimal |
| `getAverageLiteracy()` | Average literacy score across all citizens |

### Population Modification

| Method | Description |
|--------|-------------|
| `enlistMilitaryPopulation(amount)` | Depletes population: Young Adult → Adult → Middle Aged → Older → Teen |
| `dischargeMilitaryPopulation(source)` | Returns enlisted citizens with age recalculated from birthTime |
| `recordCombatDeath(count)` | Records combat deaths |
| `createImmigrant()` | Creates a working-age immigrant citizen |
| `processEmigration()` | Removes a random Young Adult/Adult citizen |
| `setMigrationPolicy(policy)` | Sets `open`, `restricted`, or `balanced` |
| `applyDensityEffectsToNation()` | Applies density-based crime/disease/happiness effects |

### Analysis Methods (previously stubs, now implemented)

| Method | Returns |
|--------|---------|
| `identifyDemographicShifts()` | Array of demographic shift descriptions |
| `analyzeEmploymentTrends()` | Employment statistics object |
| `analyzeEducationProgress()` | Education progress object |
| `analyzeMigrationImpact()` | Migration impact object |
| `identifyPopulationChallenges()` | Array of challenge descriptions |
| `generateRecommendations()` | Array of recommendation strings |

### State Save/Load

`getState()` and `setState()` persist: age groups, citizens, next citizen ID, vital rates, territorial distribution, migration factors, migration policy, population situations, employment, education, pending births, population stats, and history.

---

## Data Flow (Daily Update)

```
handleDayPassed()
  → updatePopulationGrowth()          # Calculate territorial growth
  → updateHappinessFactors()          # Update territory happiness + density effects
  → processTerritorialMigration()     # Move people between territories
  → processDailyAging()               # Age citizens, literacy transitions, old-age deaths + replacement births
  → processBirthsAndDeaths()          # Natural births and deaths
  → processMigration()                # Immigration/emigration
  → updateEmploymentAndEducation()    # Recalculate employment/education stats
  → CitizenJobSystem.assignJobsToCitizens()  # Stable job assignment with upgrades/turnover
  → CitizenJobSystem.applyIncomes()   # Calculate incomes with tax multipliers
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
| `militaryPenaltyThreshold` | 0.5 | 50% of eligible population drafted triggers penalty |
| `militaryPenaltyGrowthMultiplier` | 0.5 | Growth multiplier when penalty active |
| `situationInterval` | 3 days | Population situations checked every 3 days |
| `maxHistoryLength` | 365 | Days of history retained |
| `REAL_TIME_MAX_AGE_DAYS` | 178 | Age at death (real-time days) |
