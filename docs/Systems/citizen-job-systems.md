# Citizen Job System

Truth source for citizen jobs, income, taxation, and job-to-building assignment. Pulls building counts from `ImprovementsSystem`, `ProjectsSystem`, and `WondersSystem` (via `BuildingsSystem`) to determine job demand percentages, then assigns working-age citizens to jobs based on individual literacy scores.

## Overview

- **System class:** `CitizenJobSystem`
- **Globally available as:** `window.CitizenJobSystem`
- **Purpose:** Assign citizens to themed jobs based on nation buildings, calculate income via a complex weighed formula, and compute taxable income for nation revenue
- **Truth source for:** Citizen job definitions, job assignment, income calculation, taxation multipliers
- **Dependent on:** `PopulationSystem` (citizen objects with `ageGroup`, `literacyScore`, `isGifted`), `BuildingsSystem` (building counts), `Nation` (stats, researchModifiers, childLaborEnabled)

---

## Architecture

```
CitizenJobSystem
├── JOB_DEFINITIONS        — 73 job definitions across 3 tiers
├── TIER_RANGES            — Income base ranges per tier
├── JOB ASSIGNMENT         — Percentage-based, literacy-gated, no lockout
├── INCOME CALCULATION     — Literacy/Tech/Happiness/Crime/Disease weighed formula
└── TAXATION               — Senior half-tax, child full-tax multipliers
```

## Job Tiers

| Tier | Source | Base Income Range | Level Bonus |
|------|--------|-------------------|-------------|
| **Tier 1** | Improvements | $25,000 – $50,000 | +$5,000 per level |
| **Tier 2** | Projects | $75,000 – $100,000 | +$10,000 per level |
| **Tier 3** | Wonders | $125,000 – $200,000 | +$15,000 per level |

### Job Progression

Citizens progress through jobs by literacy tier and level:

```
T1L1 → T1L2 → T2L1 → T2L2 → T3L1 → T3L2
```

- **T1L1**: Entry level (literacyReq: 0–35)
- **T1L2**: Management (literacyReq: 20–35)
- **T2L1**: Entry level (literacyReq: 20–50)
- **T2L2**: Management (literacyReq: 45–75)
- **T3L1**: Entry level (literacyReq: 30–70)
- **T3L2**: Management (literacyReq: 55–98)

Each citizen must individually meet a job's `literacyReq` to be assigned to it.

---

## Job Definitions (73 Jobs)

### Tier 1 — Improvements

| Building | Job (L1) | Lit Req | Job (L2) | Lit Req |
|----------|----------|---------|----------|---------|
| Farm | Farmer | 0 | Farm Manager | 25 |
| Hospital | Nurse | 0 | Head Nurse | 30 |
| Police Station | Police Officer | 0 | Police Sergeant | 25 |
| School | Teacher | 0 | School Principal | 35 |
| Port | Dock Hand | 0 | Port Manager | 25 |
| Casino | Casino Dealer | 0 | Pit Boss | 25 |
| Factory | Factory Line Worker | 0 | Shift Supervisor | 20 |

### Tier 2 — Projects

| Building | Job (L1) | Lit Req | Job (L2) | Lit Req |
|----------|----------|---------|----------|---------|
| University | University Professor | 50 | University Dean | 75 |
| Missile Silo | Missile Technician | 40 | Silo Commander | 60 |
| Iron Curtain | Interceptor Operator | 40 | Defense Director | 60 |
| Command Center | Operations Officer | 40 | Command Director | 60 |
| Military Academy | Drill Instructor | 35 | Academy Commandant | 60 |
| Ambulance Hub | Paramedic | 30 | Medical Director | 55 |
| Government Statue | Protocol Officer | 45 | Government Liaison | 70 |
| Religious Statue | Acolyte | 20 | High Priest | 50 |
| Spy Operations | Field Agent | 40 | Station Chief | 65 |
| SWAT Police | SWAT Officer | 30 | SWAT Commander | 55 |
| Advanced Research | Research Assistant | 50 | Lead Researcher | 75 |
| Enhanced Police | Detective | 35 | Police Chief | 60 |
| Sports Betting | Bookmaker | 20 | Casino Director | 45 |
| Enhanced Barracks | Tactical Trainer | 30 | Training Director | 55 |
| Enhanced Factories | Production Lead | 30 | Plant Manager | 55 |
| Enhanced Airforces | Flight Crew | 35 | Wing Commander | 60 |
| Enhanced Navy | Naval Deck Hand | 20 | Fleet Admiral | 60 |
| Broadcasting | News Anchor | 40 | Station Manager | 60 |
| Financial Assistance Office | Foreign Aid Officer | 40 | Foreign Aid Director | 65 |
| Office of Relationships | Diplomat | 45 | Ambassador | 70 |
| Enhanced Recycling | Recycling Technician | 25 | Environmental Director | 50 |
| Advanced Agriculture | Agronomist | 35 | Agriculture Director | 60 |
| Farm Synergy | Crop Specialist | 30 | Farm Coordinator | 55 |
| Advanced Well Drilling | Hydrologist | 35 | Water Director | 60 |
| Well Synergy | Water Engineer | 30 | Resource Manager | 55 |
| Trade Hub | Trade Clerk | 25 | Trade Commissioner | 50 |
| Salvage Yard | Salvage Worker | 0 | Recovery Director | 35 |
| Military Salvage | Salvage Technician | 20 | Salvage Commander | 45 |

### Tier 3 — Wonders

| Building | Job (L1) | Lit Req | Job (L2) | Lit Req |
|----------|----------|---------|----------|---------|
| Government Monument | State Architect | 60 | National Governor | 85 |
| Religious Monument | Temple Keeper | 50 | Spiritual Leader | 80 |
| Great Library | Senior Librarian | 60 | Chief Archivist | 90 |
| Grand Research Academy | Senior Researcher | 70 | Academy Director | 95 |
| Environmental Research Complex | Eco Scientist | 65 | Environmental Director | 90 |
| Universal Education | Education Coordinator | 60 | Minister of Education | 90 |
| Universal Healthcare | Healthcare Administrator | 60 | Minister of Health | 90 |
| Enhanced Silos | Missile Commander | 60 | Strategic Missile Director | 90 |
| Enhanced Spy Ops | Intelligence Officer | 65 | Spymaster | 95 |
| Military Recovery | Salvage Specialist | 55 | Recovery Command | 85 |
| Enhanced Salvage | Recovery Engineer | 55 | Resource Recovery Director | 85 |
| Nuclear Warhead Facility | Nuclear Technician | 70 | Nuclear Program Director | 95 |
| Enhanced Nuclear Warheads | Warhead Engineer | 75 | Arsenal Director | 98 |
| Basketball Stadium | Head Coach | 30 | General Manager | 60 |
| Hockey Stadium | Head Coach | 30 | General Manager | 60 |
| Soccer Stadium | Head Coach | 30 | General Manager | 60 |
| Alliance Headquarters | Alliance Liaison | 55 | Alliance Director | 85 |
| Supreme Mining | Mine Engineer | 50 | Mining Director | 80 |
| Clean Mining | Environmental Engineer | 55 | Sustainability Director | 85 |
| Supreme Assembly | Assembly Lead | 45 | Manufacturing Director | 80 |
| Clean Assembly | Green Manufacturing Lead | 50 | Clean Production Director | 85 |
| Supreme Recycling | Recycling Specialist | 45 | Environmental Director | 80 |
| Supreme Military | Strategic Officer | 60 | Supreme Commander | 95 |
| Internet | Network Engineer | 55 | IT Director | 85 |
| Abundance Temple | Temple Farmer | 40 | High Provisioner | 75 |
| Aqueduct of Life | Water Keeper | 40 | High Aqueduct Master | 80 |

---

## Income Calculation

### Formula

Each citizen's final income is calculated as:

```
finalIncome = baseIncome * (1 + clampedModifier)
```

Where `clampedModifier` is clamped between -0.9 and +2.0.

### Modifier Breakdown (weighed separately, then combined)

| Factor | Formula | Range |
|--------|---------|-------|
| Literacy | `literacy * 0.01` | 0% to +100% |
| Technology | `techLevel * 0.001` | +0.1% per tech level |
| Happiness | `(happiness - 50) * 0.005` | -0.5% per point below 50, +0.5% per point above 50 |
| Crime | `max(0, crime - 30) * -0.01` | -1% per point above 30 |
| Disease | `max(0, disease - 10) * -0.01` | -1% per point above 10 |

### Base Income

Random value within the tier range, plus level bonus:

- **Level 1**: Random in tier range
- **Level 2**: Random in tier range + level bonus ($5,000 / $10,000 / $15,000 by tier)

Minimum income: $1,000.

---

## Job Assignment

### Working Age Groups

Default working-age groups: `teen`, `youngAdult`, `adult`, `middleAged`, `older`.

Additional groups enabled by nation effects:

| Effect | Condition | Age Group Added |
|--------|-----------|-----------------|
| `seniors_work_tax_half` research | `nation.researchModifiers.seniorsWorkTaxHalf > 0` | `senior` |
| Child Labor Act motion | `nation.childLaborEnabled === true` | `child` |

### Job Demand Calculation

1. Sum total buildings across `nation.improvements`, `nation.projects`, `nation.wonders`
2. For each building, multiply its jobs' `basePercentage` by building count
3. Cap per-job-type at `Math.max(20, 75 - (totalBuildings - 1) * 4)`
   - 1 building → 75% cap per job type
   - Each additional building reduces cap by 4 points (minimum 20%)
4. Normalize if total demand exceeds 100%

This prevents one building type from crowding out all other jobs while ensuring all job types can have workers.

### Unemployment

Base unemployment rate is 5%, modified by:

- **Low happiness** (< 40): +0.2% per point below 40
- **High crime** (> 30): +0.1% per point above 30

Capped at 90% maximum.

### Assignment Process

1. Filter citizens to working-age groups (plus Seniors if `seniors_work_tax_half` research active, plus Children if Child Labor Act motion active)
2. Mark non-working citizens as `retired`, `not_applicable`, or `eligible_for_work`
3. **Preserve existing jobs** — citizens keep their current job day-to-day (no constant churn)
4. **Remove jobs** — citizens lose their job if their building type count drops to 0 (building destroyed)
5. **Allow upgrades** — level 1 workers can upgrade to level 2 of the same job if their literacy now meets the requirement
6. **Apply turnover** — low happiness causes random job loss: `(40 - happiness) * 0.3%` chance per employed citizen (up to ~12% at 0 happiness)
7. Mark unemployed based on the unemployment rate (from happiness/crime)
8. Sort remaining employable citizens by `literacyScore` descending (highest literacy gets first pick)
9. Assign new workers to jobs based on demand percentages from building counts
10. Citizens who don't qualify for a high-tier job remain in the pool for lower-tier jobs — **never permanently locked out**
11. Any remaining citizens without a job become unemployed

### Stability Rules

| Scenario | Behavior |
|----------|----------|
| Same buildings, stable happiness | Citizens keep their jobs day-to-day |
| Citizen literacy increases | Can upgrade T1L1 → T1L2 (same job, higher level) |
| Building destroyed | All workers in that job type lose their jobs |
| Low happiness | Random job loss (turnover), replaced by new workers |
| New citizen enters workforce | Competes for openings based on literacy score |
| Building count increases | New job openings created proportionally |

### Buildings Work Without Workers

**All buildings function regardless of whether they have workers assigned.** A nation with 0% literacy can still have wonders, factories, hospitals, etc. operating at full effect — they simply have no citizens assigned to the themed job titles. Job assignment is a cosmetic/demographic layer on top of building functionality; it does not gate building operation.

---

## Taxation Multipliers

Applied during `applyIncomes()`:

| Demographic | Condition | Tax Multiplier |
|-------------|-----------|----------------|
| Senior | `seniors_work_tax_half` research active | `0.5` (half rate) |
| Child | `childLaborEnabled` motion active | `1.0` (full rate) |
| All others | — | `1.0` (full rate) |
| Non-employed | — | `0` |

Nation uses `getTotalTaxableIncome()` which sums `income * taxMultiplier` for all employed citizens.

---

## Methods

### `initialize()`
Initializes the system. Idempotent — returns early if already initialized.

### `getJobDefinition(jobKey)`
Returns the job definition object (with `buildingType` and `tier` added) for a given job key, or `null` if not found.

### `getJobsForBuilding(buildingType)`
Returns all job definitions for a given building type, each with `buildingType` and `tier` added. Returns `[]` if building type not found.

### `calculateIncomeModifier(nationStats, nationTech)`
Returns `{ totalModifier, breakdown: { literacy, tech, happiness, crime, disease } }`.

### `calculateBaseIncome(job, levelBonusMultiplier)`
Returns base income (random within tier range + level bonus) before nation stat modifiers.

### `calculateCitizenIncome(citizen, nationStats, nationTech)`
Returns final income for a citizen's job after applying the complex weighed modifier formula. Returns `0` if citizen has no job.

### `calculateJobDemand(nation)`
Returns `{ jobKey: percentage }` object with per-job-type demand percentages, capped and normalized.

### `calculateUnemploymentRate(nationStats)`
Returns unemployment rate (0 to 0.9) based on happiness and crime.

### `assignJobsToCitizens(citizens, nation, nationStats)`
Assigns jobs to working-age citizens based on job demand, literacy eligibility, and unemployment rate. Mutates citizen objects in place. Returns the citizens array.

### `applyIncomes(citizens, nationStats, nationTech, nation)`
Calculates and sets `income` and `taxMultiplier` on each citizen. Requires `nation` parameter for research modifiers access.

### `getJobDefinitionForBuildingAndLevel(buildingType, level)`
Returns a job definition for a specific building type and level (1 or 2), with `buildingType` and `tier` added. Returns `null` if not found.

### `getTotalGrossIncome(citizens)`
Returns sum of all citizens' gross income.

### `getTotalTaxableIncome(citizens)`
Returns sum of all citizens' income multiplied by their `taxMultiplier`. This is what `Nation.calculateEconomy()` uses for tax revenue.

### `getEmployedCount(citizens)`
Returns count of citizens with `employmentStatus === 'employed'`.

### `getUnemployedCount(citizens)`
Returns count of citizens with `employmentStatus === 'unemployed'`.

### `getJobDistribution(citizens)`
Returns breakdown object keyed by job key with `title`, `tier`, `level`, `buildingType`, `count`, and `totalIncome`.

### `destroy()`
Sets `isInitialized = false`.

---

## Integration Points

### PopulationSystem
Calls `CitizenJobSystem.assignJobsToCitizens()` and `CitizenJobSystem.applyIncomes()` each day in `handleDayPassed()`, passing `window.Nation` as the `nation` parameter.

### Nation.js
`Nation.calculateEconomy()` calls `CitizenJobSystem.getTotalTaxableIncome()` to get taxable income from citizen jobs, falling back to the population-based formula if CitizenJobSystem is unavailable.

### Citizens
Each citizen object has:
- `job` — `{ key, title, buildingType, tier, level }` or `null`
- `literacyScore` — 0-100, gained through demographic transitions
- `isGifted` — ~5% of citizens, learn 50% faster, can exceed nation literacy cap by +20
- `taxMultiplier` — 0.5 (seniors with research), 1.0 (full rate), or 0 (non-employed)

---

## Example

```js
// Assign jobs and calculate incomes
CitizenJobSystem.assignJobsToCitizens(
    Array.from(populationSystem.citizens.values()),
    window.Nation,
    window.Nation.nationStats
);
CitizenJobSystem.applyIncomes(
    citizens,
    window.Nation.nationStats,
    window.Nation.tech,
    window.Nation
);

// Get taxable income for nation revenue
const taxableIncome = CitizenJobSystem.getTotalTaxableIncome(citizens);

// Get job distribution for UI
const distribution = CitizenJobSystem.getJobDistribution(citizens);
```
