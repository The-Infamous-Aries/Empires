# Citizen Entity

Represents an individual citizen within a nation. Citizens are the fundamental population unit — they pay taxes, work jobs, form relationships, serve in the military, age, and eventually die. Every citizen contributes to nation statistics (tax revenue, workforce, literacy, happiness, loyalty, etc.).

## Overview

| Item | Value |
|------|-------|
| **Class:** | `Citizen` |
| **Global instance:** | `window.Citizen` |
| **Source file:** | `entities/Citizen.js` |
| **Loaded in:** | `index.html` (after `core/event-system.js`, before `systems/population-system.js`) |
| **Save/Load:** | Yes — `serialize()` / `static deserialize()` supported |
| **Depends on:** | `Nation` (nation stats, policies, improvements), `CitizenTiesSystem` (relationship death handling), `Window.SportsNames` (optional name generation) |

## Constructor

```js
new Citizen(nationId, cityId = null, data = null)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `nationId` | string \| Nation | ID of the owning nation, or a Nation object (uses `.id`) |
| `cityId` | string \| null | ID of the city the citizen lives in (currently unused by game logic) |
| `data` | object | Optional serialized citizen data for deserialization |

If `data` is provided, fields are restored from it. Otherwise, a new citizen is generated with randomized attributes via `initializeCitizen()`.

## Entity Fields

### Identity

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated: `citizen_<timestamp>_<random>` |
| `nationId` | string | Owning nation ID |
| `cityId` | string \| null | City ID (not currently used by game systems) |
| `born` | number | Birth timestamp (ms) |
| `birthTime` | number | Alias for `born` |

### Personal Information

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Full name (`FirstName LastName`) |
| `firstName` | string \| null | First name |
| `lastName` | string \| null | Last name (same as `familyName`) |
| `familyName` | string \| null | Family/surname |
| `age` | number | Age in years |
| `ageGroup` | string \| null | Age group label |
| `gender` | string | `'male'` or `'female'` |
| `sexualOrientation` | string | `'straight'` (85%), `'gay'` (10%), `'bisexual'` (5%) |
| `occupation` | string | Job title (e.g., `'laborer'`, `'doctor'`, `'unemployed'`, `'retired'`) |
| `education` | string | `'none'`, `'primary'`, `'secondary'`, `'higher'` |
| `literacyScore` | number | 0-100 literacy level |
| `isGifted` | boolean | ~5% chance — learns 50% faster |
| `literacyProgress` | number | Progress toward next literacy level |
| `health` | number | 0-100 health status |
| `happiness` | number | 0-100 happiness level |

### Economic Status

| Field | Type | Description |
|-------|------|-------------|
| `income` | number | Annual income (0 if unemployed/child) |
| `wealth` | number | Personal wealth (generates at birth: 0-26000) |
| `jobSkill` | number | 0-100 job skill level |
| `productivity` | number | Productivity multiplier (affects income) |
| `taxesPaid` | number | Lifetime taxes paid |
| `taxMultiplier` | number | Tax rate multiplier (default 1.0) |

### Social Status

| Field | Type | Description |
|-------|------|-------------|
| `socialClass` | string | `'lower'`, `'middle'`, `'upper'` (based on wealth) |
| `loyalty` | number | 0-100 loyalty to nation |
| `politicalLeanings` | object | `{ economic: -50..50, social: -50..50, authoritarian: 0..100 }` |
| `culturalValues` | object | `{ tradition, innovation, community, individualism, environmentalism: 0..100 }` |

### Demographics

| Field | Type | Description |
|-------|------|-------------|
| `ethnicity` | string | One of 15 ethnicity types |
| `religion` | string | One of 11 religion types (incl. `'none'`) |
| `language` | string | Defaults to `'common'` |

### Status Tracking

| Field | Type | Description |
|-------|------|-------------|
| `isAlive` | boolean | Citizen alive status |
| `isEmployed` | boolean | Currently employed |
| `isMilitary` | boolean | Currently in military |
| `unitType` | string \| null | `'soldier'`, `'tank'`, `'aircraft'`, `'ship'` (if military) |
| `isVeteran` | boolean | Former military (reached Senior age while enlisted) |
| `isRetired` | boolean | Retired (age 65+) |
| `isCriminal` | boolean | Criminal status |

### Life Statistics

| Field | Type | Description |
|-------|------|-------------|
| `lifeExpectancy` | number | Expected age at death |
| `reproductiveYears` | object | `{ start, end }` for childbearing |
| `workingYears` | object | `{ start, end }` for employment |

### Events & Relationships

| Field | Type | Description |
|-------|------|-------------|
| `lifeEvents` | array | Last 20 life events (capped) |
| `achievements` | array | Achievement records |
| `relationships` | Map | `citizenId → { type, strength, formed }` |
| `relationshipStatus` | string | `'single'`, `'dating'`, `'married'`, `'divorced'`, `'widowed'`, `'deceased'` |
| `spouseIds` | string[] | IDs of current spouses |
| `partnerIds` | string[] | IDs of current dating partners |
| `parentIds` | string[] | IDs of parents |
| `childIds` | string[] | IDs of children |
| `divorcedFrom` | string[] | IDs of former spouses (divorce history) |
| `widowedFrom` | string[] | IDs of deceased spouses (widow history) |
| `brokenUpFrom` | string[] | IDs of former dating partners (breakup history) |

## Methods

### Citizen Initialization

| Method | Description |
|--------|-------------|
| `initializeCitizen()` | Applies nation effects, age adjustments, initial occupation, adds birth life event |
| `applyNationEffects()` | Sets happiness, education, political leanings, religion based on Nation stats |
| `applyGovernmentEffects(government)` | Modifies political leanings based on nation government type |
| `adjustForAge()` | Sets occupation, education, wealth, health based on age group |
| `determineInitialOccupation()` | Picks occupation from education-based list; sets employment status |
| `calculateLifeExpectancy()` | Returns expected lifespan based on health, wealth, education, social class |
| `calculateReproductiveYears()` | Returns `{ start, end }` for childbearing age by gender |
| `calculateWorkingYears()` | Returns `{ start, end }` for employment years |

### Name Generation

| Method | Description |
|--------|-------------|
| `generateName()` | Picks random first + last name from built-in lists |
| `generateChildName(parent1, parent2)` | Generates child name inheriting parent's family name; uses `window.SportsNames` if available |

### Lifecycle

| Method | Description |
|--------|-------------|
| `ageOneYear()` | Ages citizen by 1 year; adjusts stats, checks life stage transitions, random events, mortality |
| `adjustStatsForAging()` | Health declines after 30; job skill improves to 50; productivity changes |
| `checkLifeStageTransitions()` | Adult transition at 18, retirement at 65, education milestones at 18/22 |
| `checkMortality()` | Annual death roll based on age and health |
| `die(cause = 'unknown')` | Notifies `CitizenTiesSystem`, marks `isAlive = false`, `relationshipStatus = 'deceased'`, adds life event |

### Employment & Economics

| Method | Description |
|--------|-------------|
| `calculateIncome()` | Computes income from occupation base × skill × productivity × randomness |
| `changeJob(newOccupation)` | Changes occupation; recalculates income; adds life event |
| `retire()` | Sets `isRetired = true`, adds 5 years income as retirement wealth |
| `payTaxes(taxRate)` | Deducts `income × (taxRate / 100)` from wealth; returns tax amount |
| `payTaxesToNation(taxRate)` | Same as `payTaxes` but returns amount for Nation tax revenue tracking |

### Relationships

| Method | Description |
|--------|-------------|
| `addRelationship(otherCitizenId, type)` | Adds relationship entry (friend/family/romantic/rival) — no duplicates |
| `getOpinionOnPolicy(policy)` | Returns -100..100 opinion based on political leanings, class, cultural values |

### Nation Integration

| Method | Description |
|--------|-------------|
| `updateFromNationState()` | Syncs happiness, health, loyalty, employment from Nation state |
| `updateHappinessFromNation(nation)` | Adjusts happiness based on GDP, unemployment, healthcare, crime, etc. |
| `updateHealthFromNation(nation)` | Adjusts health based on disease, pollution, hospitals |
| `updateLoyaltyFromNation(nation)` | Adjusts loyalty based on government efficiency, GDP, war status |
| `updateEmploymentFromNation(nation)` | Randomly finds/loses jobs based on nation employment rate |
| `getStatsContribution()` | Returns object for Nation statistics aggregation |

### Statistics & Information

| Method | Returns |
|--------|---------|
| `getStats()` | Full citizen statistics object |
| `getCitizenSummary()` | Compact summary for UI display |

### Serialization

| Method | Description |
|--------|-------------|
| `serialize()` | Returns plain object with all citizen state |
| `toJSON()` | Alias for `serialize()` |
| `static deserialize(data)` | Restores Citizen from serialized data; includes consistency checks (retired citizens get `occupation = 'retired'`, veterans clear `unitType`) |

## How Citizens Work in the Game

### Birth & Aging
Citizens are born with randomized attributes (name, age, gender, orientation, wealth, etc.). They age one year at a time via `ageOneYear()`, which handles health decline, skill improvement, productivity changes, life stage transitions (adulthood at 18, retirement at 65), random events, and mortality checks.

### Employment
Citizens are assigned occupations based on education level. Income is calculated from occupation base salary modified by job skill, productivity, and randomness. Unemployed citizens can find jobs; employed citizens can lose them based on nation employment rate.

### Taxes
Citizens pay taxes via `payTaxesToNation(taxRate)`, which deducts from their personal wealth and tracks `taxesPaid`. This is called by `Nation.calculateEconomy()` during tax collection.

### Relationships
Citizens can form dating, marriage, divorce, widowhood, and breakup relationships tracked in `relationships` Map and ID arrays (`spouseIds`, `partnerIds`, `parentIds`, `childIds`, `divorcedFrom`, `widowedFrom`, `brokenUpFrom`). Relationship changes notify `CitizenTiesSystem` for consistency.

### Military Service
Citizens aged Teen-Older can be marked as `isMilitary` with a `unitType`. When they reach Senior age, they become veterans (`isVeteran = true`) and their military unit is decommissioned.

### Death
Citizens die via `die(cause)`, which notifies `CitizenTiesSystem.handleCitizenDeath()` (preserving family roles, tracking widowhood), sets `isAlive = false`, and adds a death life event.

## Serialization

Citizens are fully serializable via `serialize()`/`deserialize()`. All fields including Maps (`relationships`) and arrays (`spouseIds`, `childIds`, etc.) are preserved. `deserialize()` performs consistency checks — retired citizens get their occupation corrected, veterans clear their unit type.

## Integration with PopulationSystem

Citizens are created and managed by `PopulationSystem`:
- `initializeAgeDistribution()` — creates Citizen instances for initial population
- `createNewCitizen()` — creates newborn Citizen instances
- `createImmigrant()` — creates working-age immigrant Citizen instances
- `processDailyAging()` — calls `citizen.ageOneYear()` on all citizens
- Citizens are stored in `PopulationSystem.citizens` Map

Citizens are stored with `City.js`-style city IDs but **City.js was deleted** — cities exist only as string IDs on `Nation.cities` and `Nation.capitalCity`. The `cityId` field on Citizen is reserved for future use.

## Dependencies

- **`window.Nation`** — Required for nation effects, tax calculation, happiness/health updates
- **`window.CitizenTiesSystem`** — Called on citizen death for relationship aftermath
- **`window.SportsNames`** (optional) — Used for name generation if available
- **`window.PopulationSystem`** — Creates and manages Citizen instances

## Notes

- Citizens are the only population unit that actually exists in the game — `City.js` was deleted as dead code (it was never instantiated or wired into any system)
- `cityId` on Citizen is reserved but unused — cities are tracked as string IDs on Nation
- All citizen fields are serialized for save/load via `PopulationSystem.getState()`/`setState()`
- ~5% of citizens are born "gifted" (learn literacy faster, can exceed nation literacy cap by 20 points)
