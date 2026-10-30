# Population System — Developer Reference

This document explains exactly what is tracked, shown, and used for population across citizens, nations, territories, jobs, and income.

---

## 1. Individual Citizen Level

Every citizen is an object with the following fields. Some are shown to users, some are internal.

| Field | What it is | Shown to Users? | Used Internally? |
|-------|-----------|-----------------|------------------|
| `id` | Unique citizen ID | No | Yes (tracking, save/load) |
| `name` | First + last name | Yes | Yes |
| `age` | Current age (years) | Yes | Yes (life stage) |
| `gender` | male/female | Yes | Yes |
| `occupation` | Job title or "unemployed" | Yes | Yes (employment stats) |
| `education` | none/primary/secondary/higher | Yes | Yes (literacy, job eligibility) |
| `health` | 0–100 | Yes | Yes (mortality, happiness) |
| `happiness` | 0–100 | Yes | Yes (nation happiness avg) |
| `income` | Annual earnings ($) | Yes | Yes (tax revenue) |
| `wealth` | Total accumulated wealth ($) | Yes | Yes (social class) |
| `job` | `{key, title, buildingType, tier, level}` | Yes | Yes (tier/level progression) |
| `socialClass` | lower/middle/upper | Yes | Yes (demographics) |
| `loyalty` | 0–100 loyalty to nation | Yes | Yes (stability) |
| `ethnicity` | e.g. "Human-A", "Mixed-AB" | Yes | Yes (population diversity) |
| `religion` | e.g. "monotheism", "atheism" | Yes | Yes (cultural stats) |
| `language` | e.g. "common" | Yes | Yes |
| `isAlive` | true/false | No | Yes (excludes dead from counts) |
| `isEmployed` | true/false | Yes | Yes (employment rate) |
| `isRetired` | true/false | Yes | Yes (senior stats) |
| `isMilitary` | true/false | Yes | Yes (military stats) |
| `isCriminal` | true/false | Yes | Yes (crime stats) |
| `literacyScore` | 0–100 | Yes | Yes (job tier eligibility) |
| `isGifted` | true/false (~5% of citizens) | No | Yes (learns faster, exceeds literacy cap) |
| `taxMultiplier` | 0.5 (seniors w/ research), 1.0, 0 | No | Yes (taxable income calc) |
| `lifeEvents` | Array of {description, type, age} | Yes (biography) | Yes (life history) |
| `relationships` | Map of citizenId → {type, strength} | Yes (social graph) | Yes (death notification) |
| `lifeExpectancy` | Expected age of death | Yes | Yes (mortality calc) |
| `workingYears` | `{start, end}` | No | Yes (retirement timing) |
| `reproductiveYears` | `{start, end}` | No | Yes (birth calculations) |
| `contributesToNationStats` | boolean | No | Yes (aggregation flag) |
| `affectedByNationPolicies` | boolean | No | Yes (policy impact flag) |
| `affectedByNationHappiness` | boolean | No | Yes (happiness impact flag) |

---

## 2. Population / Demographics Level (Nation-Wide)

`PopulationSystem` aggregates all citizens into age groups. This is what appears on the population/demographics screen.

| Metric | What it Shows | Formula |
|--------|-------------|---------|
| `totalPopulation` | Total alive citizens | `citizens.size` |
| `ageGroups` | Count per age bracket | newborn, infant, toddler, child, teen, youngAdult, adult, middleAged, older, senior, elderly |
| `taxablePopulation` | Citizens aged Teen–Older who pay taxes | Sum of working-age groups |
| `militaryEligiblePopulation` | Citizens aged Teen–Older | Same pool as taxable |
| `dependencyRatio` | Dependents ÷ workers | (children + seniors) ÷ working adults |
| `agingIndex` | Seniors ÷ youth | (senior + elderly) ÷ (child + teen) |
| `averageLiteracy` | Mean literacyScore across all citizens | Sum of literacyScores ÷ count |
| `births` / `deaths` | Daily natural population change | Tracked in `populationStats` |
| `emigrated` | Citizens who left | Tracked in `populationStats` |

### Age Groups (Real-Time Days)

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

*With `seniors_work_tax_half` research active, Seniors can work and are taxed at half rate.

### Life Timeline

- **Newborn → Teen:** 14 days real time
- **Teen → Senior:** ~120 days real time (~4 months)
- **Senior → Elderly:** ~30 days real time (~1 month)
- **Elderly → Death:** ~14 days real time
- **Total lifespan:** ~178 days real time

When a citizen reaches death (~178 days), they die of old age and a replacement newborn is scheduled after a 2-turn buffer.

---

## 3. Jobs & Income Level

`CitizenJobSystem` connects citizens to buildings.

| Metric | What it Shows | Source |
|--------|-------------|--------|
| `employmentRate` | % of working-age citizens with a job | CitizenJobSystem / Citizen count |
| `unemploymentRate` | % of working-age citizens without a job | Happiness/crime-based |
| `jobDistribution` | How many citizens per job title | Count of citizens with each `job.key` |
| `jobTiers` | Tier 1, 2, 3 based on building source | Building type the job is tied to |
| `totalGrossIncome` | Sum of all citizen incomes before tax | Sum of `citizen.income` |
| `totalTaxableIncome` | Sum of `income × taxMultiplier` | Senior half-tax (0.5×), child full-tax (1.0×), others (1.0×) |

### Job Tiers

| Tier | Source | Base Income Range | Level Bonus |
|------|--------|-------------------|-------------|
| Tier 1 | Improvements | $25,000 – $50,000 | +$5,000 per level |
| Tier 2 | Projects | $75,000 – $100,000 | +$10,000 per level |
| Tier 3 | Wonders | $125,000 – $200,000 | +$15,000 per level |

### Job Progression

```
T1L1 → T1L2 → T2L1 → T2L2 → T3L1 → T3L2
```

Each citizen must individually meet a job's `literacyReq` to be assigned to it.

**Key rule:** Buildings work **regardless** of whether they have workers. A wonder functions even if no citizen is literate enough to be assigned to its job. Jobs are a demographic/cosmetic layer on top of building operation.

---

## 4. Territory & Population Density Level

When a user selects and adds a map piece (territory) to their nation:

| Field | What it Tracks |
|-------|----------------|
| `landMiles` | Square miles of that territory (defaults to 1000) |
| `population` | Citizens assigned to that territory |
| `capacity` | Max population the territory can hold |
| `density` | `population ÷ capacity` (0–1+) |
| `happiness` | Territory-specific happiness (0–100) |

### Density Effects on Nation Stats

Applied automatically based on weighted density (people per square mile across all territories):

| Weighted Density | Crime Increase | Disease Increase | Happiness Decrease |
|-----------------|---------------|------------------|-------------------|
| < 10 | +0 | +0 | +0 |
| 10–50 | +1 | +1 | −1 |
| 50–100 | +3 | +2 | −2 |
| 100–200 | +6 | +4 | −6 |
| 200–500 | +10 | +6 | −10 |
| > 500 | +15 | +10 | −10 |

**Important:** Until a map piece is selected and added to the nation, that land does **not** count toward density. Only added territories contribute.

---

## 5. Nation-Level Aggregated Stats

Computed from all citizens and shown on the nation dashboard:

| Metric | Formula | Used For |
|--------|---------|----------|
| `population` | `PopulationSystem.getTotalPopulation()` | Display, growth calcs |
| `taxRevenue` | `totalTaxableIncome × taxRate` | Nation income per turn |
| `literacy` | Average citizen literacyScore | Job eligibility, migration attractiveness |
| `happiness` | Weighted average of citizen happiness + territory happiness | Growth, migration, turnover |
| `crime` | Base + density effect | Unemployment, migration |
| `disease` | Base + density effect | Death rate, migration |
| `pollution` | From buildings/industry | Health, growth |
| `gdp` | From EconomySystem | Tax base, economic index |

---

## 6. Data Flow (Daily Cycle)

Each game day:

1. **PopulationSystem** ages citizens, grants literacy on demographic transitions, handles births/deaths
2. **CitizenJobSystem** assigns jobs (preserves existing jobs, allows level upgrades, applies turnover from low happiness)
3. **CitizenJobSystem** calculates incomes with weighed formula (literacy/tech/happiness/crime/disease modifiers)
4. **EconomySystem** reads unemployment from CitizenJobSystem, updates GDP/inflation/economic index
5. **Nation** calculates tax revenue from `getTotalTaxableIncome()` × tax rate
6. **PopulationSystem** syncs citizen counts to territorial distribution, applies density effects to crime/disease/happiness

---

## 7. What a User Actually Sees

### Population / Demographics Screen
- Total population number
- Age breakdown (children, adults, seniors)
- Employment rate and unemployment rate
- Job breakdown (how many Farmers, Nurses, Teachers, etc.)
- Literacy rate
- Average happiness, health, loyalty
- Ethnicity/religion distribution
- Territory density and land area
- Birth/death counts for the day

### Citizen Detail View
- Name, age, gender, job title, income, health, happiness, loyalty, wealth, education, ethnicity, religion
- Life events timeline
- Relationship map

### Nation Economy Screen
- Tax revenue per turn
- Tax rate
- GDP, inflation, economic index
- Currency balances (6 currencies)

---

## 8. Bottom Line

**Tracked per citizen:** identity, demographics, job/income, health/happiness/loyalty, literacy, relationships, life events.

**Aggregated per nation:** population counts by age, employment/unemployment, tax revenue, literacy, happiness, crime, disease, population density by territory.

**Shown to users:** Most citizen fields (via dashboards/detail views), all aggregated stats, job distributions, age breakdowns, territory density.

**Used internally:** Everything feeds into tax revenue, growth rates, mortality, job eligibility, migration attractiveness, and nation stability.
