# Citizen Job System — Developer Reference

This document explains fully the Citizen Job System: how jobs are defined, assigned, how incomes are calculated, how taxation works, and how it integrates with Population, Nation, Economy, and Citizen systems.

---

## 1. Overview

| Item | Value |
|------|-------|
| **System class:** | `CitizenJobSystem` |
| **Global instance:** | `window.CitizenJobSystem` |
| **Update frequency:** | Every game day via `PopulationSystem.handleDayPassed()` |
| **Primary config:** | `systems/Population/citizen-job-system.js` |
| **Total job definitions:** | 224 jobs across 112 building types |

The Citizen Job System is the **truth source** for all citizen job definitions, job assignment, income calculation, and taxable income aggregation. It does **not** spawn citizens — that is `PopulationSystem`'s job. It does **not** collect taxes directly — `Nation.js` calls `getTotalTaxableIncome()` to determine tax revenue.

---

## 2. Job Tiers & Base Income Ranges

| Tier | Source | Base Income Range | Level Bonus |
|------|--------|-------------------|-------------|
| **Tier 1** | Improvements | $25,000 – $50,000 | +$5,000 per level |
| **Tier 2** | Projects | $75,000 – $100,000 | +$10,000 per level |
| **Tier 3** | Wonders | $125,000 – $200,000 | +$15,000 per level |

Each building type defines 2 jobs: an **entry level (L1)** and a **management level (L2)**. Citizens progress: T1L1 → T1L2 → T2L1 → T2L2 → T3L1 → T3L2.

---

## 3. All Job Definitions

### Tier 1 — Improvements ($25,000 – $50,000) — 40 building types, 80 jobs

| Building | Job (L1) | Literacy Req | Job (L2) | Literacy Req |
|----------|----------|-------------|----------|-------------|
| Farm | Farmer | 0 | Farm Manager | 25 |
| Hospital | Nurse | 0 | Head Nurse | 30 |
| Police Station | Police Officer | 0 | Police Sergeant | 25 |
| School | Teacher | 0 | School Principal | 35 |
| Casino | Casino Dealer | 0 | Pit Boss | 25 |
| Factory | Factory Line Worker | 0 | Shift Supervisor | 20 |
| Barracks | Soldier | 0 | Barracks Commander | 25 |
| Airforce Base | Aircraft Technician | 10 | Base Commander | 30 |
| Harbor | Dock Hand | 0 | Harbor Master | 25 |
| Embassy | Embassy Attaché | 15 | Embassy Director | 35 |
| Foreign Affairs Office | Foreign Affairs Officer | 30 | Foreign Affairs Director | 55 |
| Internal Affairs Office | Internal Affairs Agent | 30 | Internal Affairs Director | 55 |
| Recycling Center | Recycling Worker | 0 | Recycling Supervisor | 25 |
| Park | Park Ranger | 0 | Park Manager | 25 |
| Tree Plantation | Tree Planter | 0 | Forestry Manager | 25 |
| Research Lab | Lab Technician | 15 | Research Director | 40 |
| Well | Well Digger | 0 | Well Manager | 20 |
| Steel Mill | Steel Worker | 0 | Mill Supervisor | 20 |
| Bronze Smelter | Bronze Worker | 0 | Smelter Supervisor | 20 |
| Lead Refinery | Lead Worker | 0 | Refinery Supervisor | 20 |
| Aluminum Smelter | Aluminum Worker | 0 | Smelter Supervisor | 20 |
| Copper Refinery | Copper Worker | 0 | Refinery Supervisor | 20 |
| Uranium Enrichment Plant | Uranium Technician | 15 | Enrichment Director | 35 |
| Gasoline Refinery | Refinery Worker | 0 | Refinery Manager | 20 |
| Steel Foundry | Foundry Worker | 0 | Foundry Manager | 20 |
| Bronze Casting | Caster | 0 | Casting Manager | 20 |
| Lead Casting | Lead Caster | 0 | Casting Manager | 20 |
| Aluminum Extrusion | Extrusion Technician | 5 | Extrusion Manager | 25 |
| Copper Drawing | Drawing Technician | 5 | Drawing Manager | 25 |
| Uranium Fuel Fabrication | Fuel Fabricator | 10 | Fabrication Director | 30 |
| Gasoline Blending | Blending Technician | 5 | Blending Manager | 25 |
| Community Garden | Gardener | 0 | Garden Coordinator | 20 |
| Urban Arboretum | Arborist | 5 | Arboretum Manager | 25 |
| Wetlands Preserve | Wetlands Keeper | 5 | Preserve Manager | 25 |
| Waste Treatment Plant | Treatment Operator | 5 | Plant Manager | 25 |
| Emissions Scrubber Tower | Scrubber Operator | 10 | Tower Manager | 25 |
| Bioremediation Center | Bioremediation Technician | 10 | Remediation Director | 30 |

> **Legacy:** `Port` (Dock Hand / Port Manager) remains in JOB_DEFINITIONS but is no longer a valid improvement type in `improvements-system.js`. It is harmless orphan data.

---

### Tier 2 — Projects ($75,000 – $100,000) — 39 building types, 78 jobs

| Building | Job (L1) | Literacy Req | Job (L2) | Literacy Req |
|----------|----------|-------------|----------|-------------|
| University | University Professor | 50 | University Dean | 75 |
| Missile Silo | Missile Technician | 40 | Silo Commander | 60 |
| Iron Curtain | Interceptor Operator | 40 | Defense Director | 60 |
| Nuclear Shield | Nuclear Shield Operator | 40 | Nuclear Shield Director | 60 |
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
| Salvage Yard | Salvage Worker | 0 | Recovery Director | 35 |
| Military Salvage | Salvage Technician | 20 | Salvage Commander | 45 |
| Green Space Initiative | Green Space Worker | 0 | Green Space Manager | 25 |
| Urban Forestry Program | Urban Forester | 5 | Forestry Program Director | 40 |
| Carbon Capture Program | Carbon Technician | 15 | Capture Director | 40 |
| Zero Waste Initiative | Waste Reduction Worker | 0 | Zero Waste Director | 35 |
| Clean Air Regulations | Air Quality Inspector | 25 | Air Regulations Director | 50 |
| Public Transit Expansion | Transit Worker | 0 | Transit Manager | 25 |
| EPA Agency | EPA Inspector | 30 | EPA Director | 55 |
| Food Production | Food Processor | 0 | Production Manager | 25 |
| Water Production | Water Processor | 0 | Production Manager | 25 |

> **Legacy:** `Trade Hub` (Trade Clerk / Trade Commissioner) remains in JOB_DEFINITIONS but is no longer a valid project type in `projects-system.js`. It is harmless orphan data.

---

### Tier 3 — Wonders ($125,000 – $200,000) — 33 building types, 66 jobs

| Building | Job (L1) | Literacy Req | Job (L2) | Literacy Req |
|----------|----------|-------------|----------|-------------|
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
| National Parks System | Parks Ranger | 40 | Parks Director | 70 |
| Ancient Forest Preserve | Forest Keeper | 40 | Preserve Director | 75 |
| Carbon Sequestration Facility | Sequestration Technician | 45 | Carbon Director | 80 |
| Atmospheric Filtration Dome | Filtration Operator | 45 | Dome Manager | 80 |
| Green Technology Institute | Green Tech Researcher | 50 | Institute Director | 85 |
| Global Climate Accord | Climate Analyst | 50 | Accord Director | 85 |
| Zero Emission Zone | Zone Inspector | 45 | Zone Manager | 80 |

---

## 4. Income Calculation Formula

Each citizen's final income is:

```
finalIncome = baseIncome * (1 + clampedModifier)
```

Where `clampedModifier` is clamped between -0.9 and +2.0 to prevent extreme values. Minimum income is $1,000.

### Modifier Breakdown (weighed separately, then combined)

| Factor | Formula | Range |
|--------|---------|-------|
| Literacy | `literacy * 0.01` | 0% to +100% |
| Technology | `techLevel * 0.001` | +0.1% per tech level |
| Happiness | `(happiness - 50) * 0.005` | -0.5% per point below 50, +0.5% per point above 50 |
| Crime | `max(0, crime - 30) * -0.01` | -1% per point above 30 |
| Disease | `max(0, disease - 10) * -0.01` | -1% per point above 10 |

### Base Income Calculation

Random value within tier range, plus level bonus:

- **Level 1**: Random in tier range
- **Level 2**: Random in tier range + level bonus ($5,000 / $10,000 / $15,000 by tier)
- **Minimum income:** $1,000

---

## 5. Job Assignment Process

Assignment runs every game day in `PopulationSystem.handleDayPassed()` after `progressCitizenLiteracy()` and before `applyIncomes()`.

### Working Age Groups

Default: `teen`, `youngAdult`, `adult`, `middleAged`, `older`

Additional groups enabled by research/motion:
- **Senior** — if `seniors_work_tax_half` research active (`nation.researchModifiers.seniorsWorkTaxHalf > 0`)
- **Child** — if Child Labor Act motion active (`nation.childLaborEnabled === true`)

### Assignment Steps

1. **Filter working-age citizens** — non-working citizens (children, seniors without research, elderly) are marked `retired` or `not_applicable` with income 0
2. **Preserve existing jobs** — citizens keep their current job day-to-day (no constant churn)
3. **Remove jobs for destroyed buildings** — if a citizen's job building count drops to 0, they lose their job and become unemployed
4. **Allow upgrades** — level 1 workers can upgrade to level 2 of the same job if their literacy now meets the requirement
5. **Apply turnover** — low happiness causes random job loss: `(40 - happiness) * 0.003` chance per employed citizen (up to ~12% at 0 happiness)
6. **Calculate unemployment target** — based on happiness/crime rate (see `calculateUnemploymentRate`)
7. **Sort employable citizens by literacyScore descending** — highest literacy gets first pick
8. **Assign workers per job demand percentages** — calculated from building counts (see `calculateJobDemand`)
9. **Literacy requirement check** — each citizen must individually meet a job's `literacyReq`; those who don't remain in pool for lower-tier jobs (never permanently locked out)
10. **Remaining citizens without jobs become unemployed**

### Job Demand Calculation

Job demand percentages come from building counts:

1. Sum total buildings across `nation.improvements`, `nation.projects`, `nation.wonders`
2. For each building, multiply each job's `basePercentage` by building count
3. **Cap per job type:** `Math.max(20, 75 - (totalBuildings - 1) * 4)`
   - 1 building = 75% cap per job type
   - Each additional building reduces cap by 4 points (minimum 20%)
4. **Normalize if total exceeds 100%** — proportions scaled down

This prevents one building type from crowding out all others while ensuring all job types can have workers.

---

## 6. Taxation Multipliers

Applied during `applyIncomes()`:

| Demographic | Condition | Tax Multiplier |
|-------------|-----------|----------------|
| Senior | `seniors_work_tax_half` research active | `0.5` (half rate) |
| Child | `childLaborEnabled` motion active | `1.0` (full rate) |
| All others | — | `1.0` (full rate) |
| Non-employed | — | `0` |

Nation uses `getTotalTaxableIncome()` which sums `income * taxMultiplier` for all employed citizens. This is what `Nation.calculateEconomy()` uses for tax revenue.

---

## 7. Key Methods

### Job Lookup

| Method | Returns |
|--------|---------|
| `getJobDefinition(jobKey)` | Job definition object with `buildingType` and `tier` added, or `null` |
| `getJobsForBuilding(buildingType)` | All job definitions for a building type, each with `buildingType` and `tier` added, or `[]` |
| `getJobDefinitionForBuildingAndLevel(buildingType, level)` | Job definition for specific tier/level, or `null` |

### Income Calculation

| Method | Returns |
|--------|---------|
| `calculateIncomeModifier(nationStats, nationTech)` | `{ totalModifier, breakdown: { literacy, tech, happiness, crime, disease } }` |
| `calculateBaseIncome(job, levelBonusMultiplier)` | Base income before nation stat modifiers |
| `calculateCitizenIncome(citizen, nationStats, nationTech)` | Final income after applying weighed modifier formula |

### Job Assignment

| Method | Description |
|--------|-------------|
| `assignJobsToCitizens(citizens, nation, nationStats)` | Assigns jobs based on demand, literacy eligibility, unemployment, and turnover. Mutates citizen objects in place. |
| `applyIncomes(citizens, nationStats, nationTech, nation)` | Calculates and sets `income` and `taxMultiplier` on each citizen. Requires `nation` for research modifiers. |

### Statistics & Queries

| Method | Returns |
|--------|---------|
| `getTotalGrossIncome(citizens)` | Sum of all citizens' gross income |
| `getTotalTaxableIncome(citizens)` | Sum of all citizens' income × taxMultiplier (used by Nation for tax revenue) |
| `getEmployedCount(citizens)` | Count of citizens with `employmentStatus === 'employed'` |
| `getUnemployedCount(citizens)` | Count of citizens with `employmentStatus === 'unemployed'` |
| `getJobDistribution(citizens)` | Breakdown by job key: title, tier, level, buildingType, count, totalIncome |
| `calculateJobDemand(nation)` | `{ jobKey: percentage }` with capped/normalized demand |
| `calculateUnemploymentRate(nationStats)` | Unemployment rate (0–0.9) based on happiness/crime |

---

## 8. Integration Points

### PopulationSystem
Calls `CitizenJobSystem.assignJobsToCitizens()` and `CitizenJobSystem.applyIncomes()` each day in `handleDayPassed()`, passing `window.Nation` as the `nation` parameter. Also calls `progressCitizenLiteracy()` before job assignment so literacy-based progression is reflected.

### Nation.js
`Nation.calculateEconomy()` calls `CitizenJobSystem.getTotalTaxableIncome()` to get taxable income from citizen jobs, falling back to the population-based formula if CitizenJobSystem is unavailable.

### Citizens
Each citizen object has:
- `job` — `{ key, title, buildingType, tier, level }` or `null`
- `literacyScore` — 0-100, gained through demographic transitions
- `isGifted` — ~5% of citizens, learn 50% faster, can exceed nation literacy cap by +20
- `taxMultiplier` — 0.5 (seniors with research), 1.0 (full rate), or 0 (non-employed)
- `employmentStatus` — `employed`, `unemployed`, `retired`, `not_applicable`, `eligible_for_work`

---

## 9. Example Usage

```js
// Assign jobs and calculate incomes each day
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

---

## 10. Save/Load

`CitizenJobSystem` has no persistent state — all job data is derived from citizens, nation buildings, and nation stats each day. Citizens store their job assignment in `citizen.job`, which is serialized/deserialized via `Citizen.serialize()` / `Citizen.deserialize()`.

---

## 11. Integration with Other Systems

| System | Relationship |
|--------|-------------|
| **PopulationSystem** | Provides citizen objects; calls `assignJobsToCitizens` and `applyIncomes` daily |
| **Nation.js** | Reads `getTotalTaxableIncome()` for tax revenue calculation |
| **Citizen entity** | Stores `job`, `literacyScore`, `taxMultiplier` per citizen |
| **CitizenJobSystem** | Truth source for job definitions, assignment, income calculation |
| **BuildingsSystem / ImprovementsSystem / ProjectsSystem / WondersSystem** | Building counts drive `calculateJobDemand()` percentages |

---

## 12. Design Principles

- **Truth source:** CitizenJobSystem is the single source of truth for job definitions and income calculation. Building entities pull definitions from BuildingsSystem, which delegates to ImprovementsSystem/ProjectsSystem/WondersSystem.
- **No 1:1 job slots:** Job assignment is percentage-based on building counts, not fixed slots. A nation can have any proportion of workers in any job type (subject to caps).
- **Buildings work without workers:** All buildings function regardless of assigned staff. Jobs are a demographic layer, not a gating mechanism.
- **Literacy-gated progression:** Citizens must individually meet job literacy requirements. Higher literacy citizens get first pick of higher-tier jobs.
- **Stability:** Citizens keep jobs day-to-day. Changes only occur on building destruction, literacy upgrades, or happiness-driven turnover.
- **Duplicate key prevention:** All job keys are unique across building types to prevent `getJobDefinition()` cache corruption (each job key maps to exactly one building type).
