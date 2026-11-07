# Citizen Dialog System — Developer Reference

This document explains the Citizen Dialog System: how 2-part conversations are generated, how ruler questions and citizen answers work, how job titles are mapped, and how government/religion coloring is applied.

---

## 1. Overview

| Item | Value |
|------|-------|
| **System class:** | `CitizenDialogSystem` |
| **Global instance:** | `window.CitizenDialogSystem` |
| **Primary file:** | `systems/Population/citizen-dialog-system.js` |
| **Conversation format:** | 2-part (ruler asks → citizen answers) |
| **Job integration:** | Reads `citizen.job.key` and `citizen.employmentStatus` from `CitizenJobSystem` |

The Citizen Dialog System generates immersive roleplay conversations between the nation's ruler and individual citizens. Each conversation has two parts:

1. **Ruler asks** — Government-weighted opening + job-specific question based on the citizen's employment status and job title.
2. **Citizen answers** — Response based on the citizen's lowest core stat (happiness, health, wealth, education), with a reason and suggested fix, all colored by government and religion.

---

## 2. Main Entry Points

| Method | Description | Returns |
|--------|-------------|---------|
| `generateConversation(citizen, nation)` | Full 2-part conversation: ruler question + citizen answer | `{ rulerQuestion, citizenAnswer, fullDialog }` |
| `generateCitizenDialog(citizen, nation)` | Backward-compatible single-line citizen answer | String |
| `generateRulerQuestion(citizen, nation)` | Ruler's opening question only | String |
| `generateCitizenAnswer(citizen, nation, nationStats)` | Citizen's full answer (stat + reason + address) | String |
| `generateAllCitizenDialogs(citizens, nation)` | Batch generate dialogs for all citizens of a nation | `{ [id]: { rulerQuestion, citizenAnswer, fullDialog } }` |

---

## 3. Part 1: Ruler Asks Citizen

### `generateRulerQuestion(citizen, nation)`

The ruler addresses the citizen based on government type and employment status:

1. **Determine status** from `citizen.employmentStatus` (set by `CitizenJobSystem`):
   - `'employed'` → asks about their job
   - `'unemployed'` → asks why they're not working
   - `'retired'` → asks about retirement
   - `'student'` → asks about studies
   - Default → unemployed question

2. **Get job title** from `citizen.job.key` via `jobTitleLabel()` — maps internal job keys to human-readable titles (e.g. `soldier` → "soldier", `nuclear_technician` → "nuclear technician").

3. **Government-weighted opener** — Each government type has its own set of openings:
   - `liberalDemocracy`: "Citizen,", "My friend,", "Fellow citizen,", "Greetings,"
   - `conservativeRepublic`: "Patriot,", "Good citizen,", "Greetings,"
   - `socialism`: "Comrade,", "Worker,", "Friend,", "Greetings,"
   - `authoritarianRegime`: "Subject,", "Citizen,", "Speak,"
   - `dictatorship`: "Subject,", "Citizen,", "Speak,"
   - `absoluteMonarchy`: "Subject,", "Loyal servant,", "Speak,"
   - `theocracy`: "Brother,", "Sister,", "Faithful one,", "Greetings,"
   - `militaryJunta`: "Soldier,", "Citizen,", "Report,"
   - `communism`: "Comrade,", "Worker,", "Greetings,"

4. **Low loyalty** (< 30) halves the opener list, making the ruler colder.

5. **Authoritarian tone** — For `authoritarianRegime`, `dictatorship`, `absoluteMonarchy`: if happiness < 40, the question ends with " — answer truthfully.", otherwise with a period.

---

## 4. Part 2: Citizen Answers Citizen

### `generateCitizenAnswer(citizen, nation, nationStats)`

The citizen's response is built from three components:

1. **Address to ruler** — `generateAddressToRuler()`:
   - Religion-based opening (e.g. "By the One's grace,", "Child of the gods,")
   - Government-based opening (e.g. "I speak freely as a citizen,", "As a patriot,")
   - Age modifier (" I am young," / " I am an elder,")
   - Low loyalty (< 30) makes the citizen colder ("I say,")

2. **Stat dialog** — `generateStatDialog()`:
   - Finds the citizen's **lowest core stat** among: happiness, health, wealth, education
   - Wealth score combines `citizen.wealth` and `citizen.income`
   - Education score combines `citizen.education` and `citizen.literacyScore`
   - Generates good (≥ 60), bad (≤ 40), or neutral dialog with job title

3. **Stat reason + fix** — `generateStatReason()`:
   - Only triggers when lowest stat ≤ 40
   - Lists reasons based on nation stats (crime, disease, pollution, environment, literacy, unemployment)
   - Provides a suggested fix (build hospitals, reduce pollution, create jobs, etc.)
   - Prefix: "The reason is" (bad, ≤ 30) or "It's because" (30 < value ≤ 40)

4. **Government/religion coloring** — `withGovRelColoring()`:
   - Authoritarian/dictatorship/monarchy: "I dare not complain —", "They watch us closely.", "I keep quiet about it."
   - Theocracy: "By divine grace,", "The gods test us."
   - Military junta: "For the nation's strength,"
   - Socialism/communism: "Together we endure.", "The collective suffers."
   - Liberal democracy/conservative republic: plain speech

---

## 5. Stat Dialogs

| Stat | Good (≥60) | Bad (≤40) | Neutral |
|------|-----------|-----------|---------|
| **Happiness** | "I'm happy working as a ${jobTitle}." | "I'm miserable as a ${jobTitle}." | "I get by as a ${jobTitle}." |
| **Health** | "My health is solid." | "My health is poor." | "My health is alright." |
| **Wealth** | "I'm doing alright as a ${jobTitle} ($X)." | "I'm broke as a ${jobTitle} — I only make $X." | "I scrape by on $X as a ${jobTitle}." |
| **Education** | "I'm well educated and it shows." | "I never had much schooling." | "I had some schooling." |

---

## 6. Stat Reasons & Fixes

### Happiness Reason
Triggers when happiness ≤ 40. Reasons include:
- Crime > 40%: "crime is rampant at X%"
- Disease > 30%: "disease is spreading at X%"
- Pollution > 50: "pollution is choking the nation"
- Environment < 30: "the environment is ruined"
- Unemployed (age 18-65): "there's no work for me"
- Health < 40: "my health is failing"

**Fixes:** Build police/SWAT for crime; hospitals for disease; reduce pollution/plant trees for pollution; create jobs for unemployment; improve national conditions generally.

### Health Reason
Triggers when health ≤ 40. Reasons include:
- Disease > 30%, Pollution > 50, Environment < 30, Age ≥ 65
- Default: "I haven't been able to get proper care"

**Fixes:** Cure disease/build hospitals; cut pollution/build recycling centers; improve healthcare access.

### Wealth Reason
Triggers when wealth ≤ 40. Reasons include:
- Unemployed (age 18-65): "I'm unemployed"
- No education: "I have no education"
- Crime > 40%, Literacy < 40%
- Default: "wages are just too low here"

**Fixes:** Create jobs through industry/commerce; build schools/universities; improve national economy.

### Education Reason
Triggers when education ≤ 40. Reasons include:
- Age < 18: "I'm too young for higher education yet"
- Literacy < 40: "the nation's literacy rate is only X%"
- Default: "there are no schools near me"

**Fixes:** Wait until older/build schools; build schools/fund education; build more educational institutions.

---

## 7. Job Title Label Mapping

The `jobTitleLabel(occupation)` method maps internal job keys from `CitizenJobSystem` to human-readable display names. All 112 building types across improvements, projects, and wonders are covered:

**Tier 1 — Improvements:** farmer, farm_manager, nurse, head_nurse, officer, sergeant, teacher, principal, dealer, pit_boss, line_worker, shift_supervisor, soldier, barracks_commander, aircraft_technician, base_commander, dock_hand, harbor_master, attaché, embassy_director, foreign_affairs_officer, foreign_affairs_director, internal_affairs_agent, internal_affairs_director, recycling_worker, recycling_supervisor, park_ranger, park_manager, tree_planter, forestry_manager, lab_technician, research_director, well_digger, well_manager, steel_worker, mill_supervisor, bronze_worker, bronze_smelter_supervisor, lead_worker, lead_refinery_supervisor, aluminum_worker, aluminum_smelter_supervisor, copper_worker, copper_refinery_supervisor, uranium_technician, enrichment_director, refinery_worker, refinery_manager, foundry_worker, foundry_manager, caster, casting_manager, lead_caster, extrusion_technician, extrusion_manager, drawing_technician, drawing_manager, fuel_fabricator, fabrication_director, blending_technician, blending_manager, gardener, garden_coordinator, arborist, arboretum_manager, wetlands_keeper, preserve_manager, treatment_operator, waste_treatment_manager, scrubber_operator, tower_manager, bioremediation_technician, remediation_director

**Tier 2 — Projects:** professor, dean, missile_technician, silo_commander, interceptor_operator, defense_director, nuclear_shield_operator, nuclear_shield_director, operations_officer, command_director, drill_instructor, academy_commandant, paramedic, medical_director, protocol_officer, government_liaison, acolyte, high_priest, field_agent, station_chief, swat_officer, swat_commander, research_assistant, lead_researcher, detective, police_chief, bookmaker, casino_director, tactical_trainer, training_director, production_lead, plant_manager, flight_crew, wing_commander, deck_hand, fleet_admiral, news_anchor, station_manager, aid_officer, foreign_aid_director, diplomat, ambassador, recycling_technician, environmental_director, agronomist, agriculture_director, crop_specialist, farm_coordinator, hydrologist, water_director, water_engineer, resource_manager, salvage_worker, recovery_director, salvage_technician, salvage_commander, advanced_professor, advanced_dean, green_space_worker, green_space_manager, urban_forester, forestry_program_director, carbon_technician, capture_director, waste_reduction_worker, zero_waste_director, air_quality_inspector, air_regulations_director, transit_worker, transit_manager, epa_inspector, epa_director, food_processor, food_production_manager, water_processor, water_production_manager

**Tier 3 — Wonders:** state_architect, national_governor, temple_keeper, spiritual_leader, librarian, chief_archivist, senior_researcher, academy_director, eco_scientist, environmental_director_wonder, education_coordinator, minister_of_education, healthcare_administrator, minister_of_health, missile_commander, strategic_missile_director, intelligence_officer, spymaster, salvage_specialist, recovery_command, recovery_engineer, resource_recovery_director, nuclear_technician, nuclear_program_director, warhead_engineer, arsenal_director, basketball_coach, basketball_gm, hockey_coach, hockey_gm, soccer_coach, soccer_gm, alliance_liaison, alliance_director, mine_engineer, mining_director, env_engineer, sustainability_director, assembly_lead, manufacturing_director, green_manufacturing_lead, clean_production_director, recycling_specialist, env_director_wonder, strategic_officer, supreme_commander, network_engineer, it_director, temple_farmer, high_provisioner, water_keeper, high_aqueduct_master, parks_ranger, parks_director, forest_keeper, preserve_director, sequestration_technician, carbon_director, filtration_operator, dome_manager, green_tech_researcher, institute_director, climate_analyst, accord_director, zone_inspector, zone_manager

If a job key is not found in the map, the raw key string is returned as a fallback.

---

## 8. Score Helpers

### `wealthToScore(wealth, income)` — 0 to 100
- Wealth ≥ $10,000: +40; ≥ $3,000: +25; ≥ $1,000: +10; > $0: +5
- Income ≥ $50,000: +40; ≥ $25,000: +25; ≥ $10,000: +10; > $0: +5

### `educationToScore(education, literacyScore)` — 0 to 100
- Education: higher (+60), secondary (+40), primary (+20), none (+0)
- Literacy: +0.4 per point (max +40)

---

## 8. Integration with CitizenJobSystem

The dialog system reads citizen data written by `CitizenJobSystem`:

| Dialog System Reads | CitizenJobSystem Writes |
|--------------------|------------------------|
| `citizen.job.key` | `citizen.job = { key, title, buildingType, tier, level }` |
| `citizen.job.title` | Same object |
| `citizen.employmentStatus` | `'employed'`, `'unemployed'`, `'retired'`, `'not_applicable'`, `'eligible_for_work'` |
| `citizen.income` | Set by `applyIncomes()` |
| `citizen.literacyScore` | Set by `progressCitizenLiteracy()` |
| `citizen.wealth` | Citizen's wealth attribute |
| `citizen.happiness`, `citizen.health` | Citizen's core stats |
| `citizen.age`, `citizen.ageGroup` | Citizen's age data |
| `citizen.loyalty` | Citizen's loyalty attribute |

**Important:** The dialog system does **not** read `citizen.occupation`, `citizen.isEmployed`, `citizen.isRetired`, `citizen.isStudent`, or `citizen.isMilitary` — those legacy fields are not set by `CitizenJobSystem`. All employment status is determined via `citizen.employmentStatus`.

---

## 9. Key Methods

### Conversation Generation

| Method | Parameters | Returns |
|--------|-----------|---------|
| `generateConversation(citizen, nation)` | citizen object, nation object | `{ rulerQuestion, citizenAnswer, fullDialog }` |
| `generateCitizenDialog(citizen, nation)` | citizen object, nation object | String (citizen answer only) |
| `generateRulerQuestion(citizen, nation)` | citizen object, nation object | String |
| `generateCitizenAnswer(citizen, nation, nationStats)` | citizen, nation, nationStats | String |
| `generateAllCitizenDialogs(citizens, nation)` | citizens Map/Array, nation | `{ [id]: conversationObject }` |

### Job Title & Stat Helpers

| Method | Parameters | Returns |
|--------|-----------|---------|
| `jobTitleLabel(occupation)` | job key string | Human-readable job title |
| `wealthToScore(wealth, income)` | wealth number, income number | 0-100 score |
| `educationToScore(education, literacyScore)` | education string, literacy number | 0-100 score |

### Stat Dialog & Reason

| Method | Parameters | Returns |
|--------|-----------|---------|
| `generateStatDialog(key, value, citizen, nation, occupation)` | stat key, value, citizen, nation, occupation | String |
| `generateStatReason(key, value, citizen, nation, nationStats, occupation)` | stat key, value, citizen, nation, nationStats, occupation | String (empty if value > 40) |
| `happinessDialog/healthDialog/wealthDialog/educationDialog` | value, citizen, nation, occupation, isGood, isBad | String |
| `happinessReason/healthReason/wealthReason/educationReason` | value, citizen, nation, nationStats, isBad, jobTitle | String |
| `happinessFix/healthFix/wealthFix/educationFix` | nationStats, citizen[, jobTitle] | String (suggested fix) |

### Coloring & Batch

| Method | Parameters | Returns |
|--------|-----------|---------|
| `withGovRelColoring(gov, rel, loyalty, text)` | government, religion, loyalty, text | Colored text string |
| `generateAddressToRuler(citizen, nation, loyalty)` | citizen, nation, loyalty | Address string |

---

## 10. Example Usage

```js
// Single conversation
const dialog = CitizenDialogSystem.generateConversation(citizen, window.Nation);
console.log(dialog.rulerQuestion);   // "Citizen, Why are you working as a soldier?"
console.log(dialog.citizenAnswer);   // "As a fellow citizen, A citizen here, I'm happy working as a soldier."
console.log(dialog.fullDialog);      // Combined

// Backward-compatible single line
const answer = CitizenDialogSystem.generateCitizenDialog(citizen, window.Nation);

// Batch for all citizens
const allDialogs = CitizenDialogSystem.generateAllCitizenDialogs(
    Array.from(populationSystem.citizens.values()),
    window.Nation
);
```

---

## 11. Save/Load

`CitizenDialogSystem` has no persistent state — all dialogs are generated on-the-fly from citizen, nation, and nationStats objects. No serialization is needed.

---

## 12. Design Principles

- **Job-driven dialogs:** Citizen job titles come from `CitizenJobSystem.job.key`, ensuring consistency with the job assignment system.
- **Status via employmentStatus:** Employment status is read from `citizen.employmentStatus` (set by `CitizenJobSystem.assignJobsToCitizens()`), not legacy boolean flags.
- **Lowest stat focus:** Citizens always comment on their worst stat, making dialogs personally relevant.
- **Government/religion flavor:** Dialog tone changes significantly based on government type (authoritarian vs. liberal) and religion.
- **Low loyalty coldness:** Both ruler and citizen become colder toward each other when loyalty drops below 30.
- **Actionable feedback:** Stat reasons include specific suggested fixes (build hospitals, reduce pollution, create jobs, etc.) that map to actual game mechanics.
