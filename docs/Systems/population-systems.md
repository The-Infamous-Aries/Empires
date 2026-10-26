# Population System

Handles population lifecycle, demographics, aging, births, deaths, military enlistment, taxation, migration, and population situations for nations.

## Overview

| Item | Value |
|------|-------|
| **System class:** | `PopulationSystem` |
| **Global instance:** | `window.PopulationSystem` |
| **Update frequency:** | Every game day (via `day_passed` EventBus event) |
| **Primary config:** | `systems/population-system.js` |

The population system tracks individual citizens in real time. Each citizen has a `birthTime` timestamp and ages by wall-clock days (not game turns). Citizens progress through age groups: Newborn → Infant → Toddler → Child → Teen → Young Adult → Adult → Middle Aged → Older → Senior → Elderly → Death.

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
| Senior | 134–164 | No | No | `retired` |
| Elderly | 164–178 | No | No | `retired` |

- **Newborn → Teen:** 14 days real time
- **Teen → Senior:** ~120 days real time (~4 months, within the 3–5 month range)
- **Senior → Elderly:** ~30 days real time (~1 month)
- **Elderly → Death:** ~14 days real time
- **Total lifespan:** ~178 days real time

When a citizen reaches the death threshold (~178 days old), they die of old age and a replacement newborn is scheduled after a **2-turn buffer**.

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
- Turn revenue calculations
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

Each group is fully depleted before moving to the next. Citizens are removed from the individual `citizens` Map and the `ageGroups` counts are reduced, so the depletion is visible on the demographics screen.

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

## Population Situations

Every 3 days, the system may trigger a population situation (e.g., Housing Shortage, Epidemic Outbreak, Teacher Shortage, Automation Displaces Workers). Each situation presents 3 choices with effects on happiness, money, literacy, crime, disease, pollution, environment, employment, economy, culture, unity, infrastructure, traffic, energy, dependence, efficiency, and more.

Situation effects are applied immediately and tracked with an expiry day. When expired, they are removed from active effects (the effects themselves are permanent changes to nation stats).

---

## Key Methods

### Population Queries

| Method | Returns |
|--------|---------|
| `getTotalPopulation()` | Total citizen count across all age groups |
| `getTaxablePopulation()` | Count of Teen through Older citizens |
| `getMilitaryEligiblePopulation()` | Count of Teen through Older citizens |
| `getDraftedMilitaryPopulation()` | Current drafted military count (from `window.Nation.militaryUnits`) |
| `checkMilitaryPenalty()` | Growth multiplier (1.0 or 0.5 if penalty active) |
| `getPopulationOverview()` | Full overview object for UI |
| `calculatePopulationGrowthRate()` | Daily growth rate as a decimal |

### Population Modification

| Method | Description |
|--------|-------------|
| `enlistMilitaryPopulation(amount)` | Depletes population in order: Young Adult → Adult → Middle Aged → Older → Teen. Returns number enlisted. |
| `recordCombatDeath(count)` | Records combat deaths (increments both `diedInCombat` and `died`) |
| `createImmigrant()` | Creates a working-age immigrant citizen |
| `processEmigration()` | Removes a random Young Adult/Adult citizen |
| `setMigrationPolicy(policy)` | Sets `open`, `restricted`, or `balanced` |

### State Save/Load

`getState()` and `setState()` persist: age groups, citizens, next citizen ID, vital rates, territorial distribution, migration factors, migration policy, population situations, employment, education, pending births, population stats, and history.

---

## Data Flow (Daily Update)

```
handleDayPassed()
  → updatePopulationGrowth()          # Calculate territorial growth
  → updateHappinessFactors()          # Update territory happiness
  → processTerritorialMigration()     # Move people between territories
  → processDailyAging()               # Age citizens, handle old-age deaths + replacement births
  → processBirthsAndDeaths()          # Natural births and deaths
  → processMigration()                # Immigration/emigration
  → updateEmploymentAndEducation()    # Recalculate employment/education stats
  → checkPopulationSituations()       # Trigger situations every 3 days
  → processActiveSituationEffects()   # Expire old situation effects
  → processPopulationEvents()         # Process active events (baby booms, etc.)
  → updateDemographics()              # Sync demographics object
  → recordDailyHistory()              # Record daily stats
  → recordPopulationHistory()         # Record legacy history arrays
  → updateNationPopulation()          # Sync window.Nation.population
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
