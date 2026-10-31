# Edict System — Developer Reference

This document explains fully the Edict System: how edicts are defined, assigned, unlocked, taxed, and how their effects flow into Nation, Population, Economy, and Citizen systems.

---

## 1. Overview

| Item | Value |
|------|-------|
| **System class:** | `EdictSystem` |
| **Global instance:** | `window.EdictSystem` |
| **Truth source for:** | Edict definitions, edict assignment, edict effects, edict costs, edict locking/unlocking |
| **Dependent on:** | `Nation` (edicts, edictUnlocked, edictEffects fields), `PopulationSystem` (citizens for happiness penalty), `EconomySystem` (cost deduction via `processEdictCosts`) |

Edicts are nation-wide policies that affect population, economy, crime, disease, literacy, military, research, taxation, land/infra costs, and more. Each edict category has **3 stances** with specific effects. Edicts can only be changed once every **30 game days** to prevent abuse. Changing sexual orientation or marriage limits triggers a **30-day, 50% happiness penalty** for affected citizens. Players get **1 free pass** when first unlocking edicts.

---

## 2. Architecture

### Two-State Model

| Store | Location | Purpose |
|-------|----------|---------|
| `nation.edicts` | `Nation.edicts` | The player's chosen stance for each category (e.g., `taxation: 'normal'`) |
| `nation.edictUnlocked` | `Nation.edictUnlocked` | Whether each category is unlocked (effects only apply when unlocked) |
| `nation.edictEffects` | `Nation.edictEffects` | Computed numeric modifiers resulting from unlocked edicts |
| `nation.edictChangeDates` | `Nation.edictChangeDates` | Day each edict was last changed (for 30-day cooldown) |
| `nation.edictFreePassUsed` | `Nation.edictFreePassUsed` | Whether the free change pass was used |

### Edict Lifecycle

1. **Locked** — All edicts start locked. No effects apply, no costs are charged.
2. **Unlocked** — Player unlocks a category via `unlockEdict()`. Effects immediately apply via `applyEdictEffects()`.
3. **Changed** — Player changes stance via `changeEdict()`. Subject to 30-day cooldown (except first change with free pass). Changing sexual orientation or marriage limits triggers happiness penalty.
4. **Applied** — `applyEdictEffects()` recomputes `nation.edictEffects` from all unlocked edicts' stances.

---

## 3. All 15 Edict Categories (45 Stances Total)

### Tier 1 — Social Policies

#### 1. Population Sexual Orientation
| Stance | Name | Description | Effects |
|--------|------|-------------|---------|
| `straight` | Straight Only | Only heterosexual relationships allowed. Higher population growth. | `birthRateModifier: +0.10`, `happinessModifier: 0`, `crimeModifier: 0`, `relationshipRestriction: 'straightOnly'` |
| `gay` | Gay Only | Only homosexual relationships allowed. +15 Happiness, -15 Crime, very low population growth. | `birthRateModifier: -0.75`, `happinessModifier: +15`, `crimeModifier: -15`, `relationshipRestriction: 'gayOnly'` |
| `noPreference` | No Preference | Both straight and gay relationships allowed. Balanced population growth. | `birthRateModifier: 0`, `happinessModifier: 0`, `crimeModifier: 0`, `relationshipRestriction: 'none'` |

#### 2. Marriage Limits
| Stance | Name | Description | Effects |
|--------|------|-------------|---------|
| `two` | Monogamy (2) | Only 2 spouses allowed per marriage. | `maxSpouses: 2`, `happinessModifier: 0` |
| `three` | Limited Polygamy (3) | 2 or 3 spouses allowed per marriage. | `maxSpouses: 3`, `happinessModifier: 0` |
| `four` | Full Polygamy (4) | 2, 3, or 4 spouses allowed per marriage. | `maxSpouses: 4`, `happinessModifier: 0` |

### Tier 2 — Law & Order

#### 3. Police Stance
| Stance | Name | Description | Effects |
|--------|------|-------------|---------|
| `pacifist` | Pacifist | Police hardly ever on patrol. +10 Happiness, +20 Crime, criminals rarely killed. | `happinessModifier: +10`, `crimeModifier: +20`, `criminalKillChance: 0`, `criminalBecomeExChance: 0.1`, `exCriminalReoffendChance: 0.4` |
| `enforced` | Enforced | Police patrol regularly. No happiness or crime change, low criminal kill chance. | `happinessModifier: 0`, `crimeModifier: 0`, `criminalKillChance: 0.05`, `criminalBecomeExChance: 0.15`, `exCriminalReoffendChance: 0.3` |
| `lethal` | Lethal | Police patrol heavily. -10 Happiness, -30 Crime, high criminal kill chance. | `happinessModifier: -10`, `crimeModifier: -30`, `criminalKillChance: 0.25`, `criminalBecomeExChance: 0.2`, `exCriminalReoffendChance: 0.2` |

#### 4. Criminal Reform
| Stance | Name | Description | Effects |
|--------|------|-------------|---------|
| `none` | None | No cost. No reform, no reoffend chance changes. | `costPerCriminal: 0`, `criminalBecomeExChance: 0`, `exCriminalReoffendChance: 0` |
| `relaxed` | Relaxed | Cost: 0.000005% of revenue per criminal. Medium reform, medium reoffend. | `costPerCriminal: 0.000005`, `criminalBecomeExChance: 0.3`, `exCriminalReoffendChance: 0.4` |
| `strong` | Strong | Cost: 0.0000132% of revenue per criminal. Very high reform, very low reoffend. | `costPerCriminal: 0.0000132`, `criminalBecomeExChance: 0.7`, `exCriminalReoffendChance: 0.1` |

### Tier 3 — Population & Demographics

#### 5. Immigration Policy
| Stance | Name | Description | Effects |
|--------|------|-------------|---------|
| `closed` | Closed Borders | No immigration gained. | `immigrationModifier: 0` |
| `selective` | Selective | Small immigration gain boost. | `immigrationModifier: 0.05` |
| `open` | Open Borders | High immigration gain boost. | `immigrationModifier: 0.15` |

#### 6. Education Policy
| Stance | Name | Description | Effects |
|--------|------|-------------|---------|
| `private` | Private | No cost. -10 Happiness, no literacy gain boost. | `costPerToddler: 0`, `costPerChild: 0`, `happinessModifier: -10`, `literacyBoostToddler: 0`, `literacyBoostChild: 0` |
| `selective` | Selective | Cost: 0.000000388% of revenue per Toddler/Child. +20% literacy boost. | `costPerToddler: 0.000000388`, `costPerChild: 0.000000388`, `happinessModifier: 0`, `literacyBoostToddler: 0.20`, `literacyBoostChild: 0.20` |
| `public` | Public | Cost: 0.00000388% of revenue per Toddler/Child. +10 Happiness, +50% literacy boost. | `costPerToddler: 0.00000388`, `costPerChild: 0.00000388`, `happinessModifier: +10`, `literacyBoostToddler: 0.50`, `literacyBoostChild: 0.50` |

#### 7. Healthcare Policy
| Stance | Name | Description | Effects |
|--------|------|-------------|---------|
| `private` | Private | No cost. No disease change or nation disease spawn change. | `costPerNewborn: 0`, `diseaseModifier: 0`, `diseaseSpawnReduction: 0` |
| `selective` | Selective | Cost: 0.00000066% of revenue per population. -10 disease, 10% less disease spawn chance. | `costPerPopulation: 0.00000066`, `diseaseModifier: -10`, `diseaseSpawnReduction: 0.10` |
| `national` | National Healthcare | Cost: 0.000000659% of revenue per Newborn/demographic. -20 disease, 33% less disease spawn chance. | `costPerNewborn: 0.000000659`, `costPerDemographic: 0.000000659`, `diseaseModifier: -20`, `diseaseSpawnReduction: 0.33` |

### Tier 4 — Infrastructure & Environment

#### 8. Environment Policy
| Stance | Name | Description | Effects |
|--------|------|-------------|---------|
| `open` | Open Pollution | No cost. +20% Pollution, -10 Environment. | `pollutionModifier: +0.20`, `environmentModifier: -10`, `upkeepModifier: 0` |
| `reduced` | Reduced Pollution | 5% increase to Infra and Improvement upkeeps. No pollution or environment penalties. | `pollutionModifier: 0`, `environmentModifier: 0`, `upkeepModifier: +0.05` |
| `clean` | Actively Clean | 10% increase to Infra and Improvement upkeeps. -20% Pollution, +10 Environment. | `pollutionModifier: -0.20`, `environmentModifier: +10`, `upkeepModifier: +0.10` |

#### 9. Land Acquisition Policy
| Stance | Name | Description | Effects |
|--------|------|-------------|---------|
| `cheapLand` | Cheap Land / Expensive Infra | Reduces Land Cost by 30%, increases Infrastructure Cost by 30%. | `landCostModifier: -0.30`, `infraCostModifier: +0.30` |
| `balanced` | Balanced | Standard costs for land and infrastructure. | `landCostModifier: 0`, `infraCostModifier: 0` |
| `cheapInfra` | Expensive Land / Cheap Infra | Increases Land Cost by 30%, reduces Infrastructure Cost by 30%. | `landCostModifier: +0.30`, `infraCostModifier: -0.30` |

### Tier 5 — Military & Defense

#### 10. Military Posture
| Stance | Name | Description | Effects |
|--------|------|-------------|---------|
| `leave` | On Leave | -10% All Military Unit Effectiveness, -10% Unit Upkeep. | `unitEffectivenessModifier: -0.10`, `unitUpkeepModifier: -0.10` |
| `ready` | At Ready | No change to military unit effectiveness or upkeep. | `unitEffectivenessModifier: 0`, `unitUpkeepModifier: 0` |
| `alert` | High Alert | +10% All Military Unit Effectiveness, +10% Unit Upkeep. | `unitEffectivenessModifier: +0.10`, `unitUpkeepModifier: +0.10` |

#### 11. Military Procurement Policy
| Stance | Name | Description | Effects |
|--------|------|-------------|---------|
| `cheapUnits` | Cheap Units / High Upkeep | -30% Unit Purchase Cost, +30% Unit Upkeep Cost. | `militaryCostModifier: -0.30`, `militaryUpkeepModifier: +0.30` |
| `standard` | Standard Procurement | No change to unit purchase or upkeep costs. | `militaryCostModifier: 0`, `militaryUpkeepModifier: 0` |
| `expensiveUnits` | Expensive Units / Low Upkeep | -15% Unit Purchase Cost, +15% Unit Upkeep Cost. | `militaryCostModifier: -0.15`, `militaryUpkeepModifier: +0.15` |

### Tier 6 — Economy & Taxation

#### 12. Taxation Policy
| Stance | Name | Description | Effects |
|--------|------|-------------|---------|
| `heavy` | Heavy Tariffs | -15 Happiness, +15% taxation rate (25% → 28.75%). | `happinessModifier: -15`, `taxRateModifier: +0.15` |
| `normal` | Normal Tariffs | No change to Happiness or taxation rate. | `happinessModifier: 0`, `taxRateModifier: 0` |
| `light` | Light Tariffs | +15 Happiness, -15% taxation rate (25% → 21.25%). | `happinessModifier: +15`, `taxRateModifier: -0.15` |

#### 13. Gambling Policy
| Stance | Name | Description | Effects |
|--------|------|-------------|---------|
| `prohibited` | Prohibited | Ban all gambling. No casino revenue, less crime. | `happinessModifier: -5`, `crimeModifier: -10` |
| `regulated` | Regulated | Licensed casinos. Balanced revenue and social impact. | `happinessModifier: 0`, `crimeModifier: 0` |
| `open` | Open Gambling | Gambling encouraged. High revenue, more crime. | `happinessModifier: +10`, `crimeModifier: +15` |

#### 14. Censorship Policy
| Stance | Name | Description | Effects |
|--------|------|-------------|---------|
| `freeSpeech` | Free Speech | +5 Happiness, +30 Crime, +10% Immigration (if allowed). | `happinessModifier: +5`, `crimeModifier: +30`, `immigrationModifier: +0.10` |
| `slightlyCensored` | Slightly Censored | No change to Happiness, Crime, or Immigration. | `happinessModifier: 0`, `crimeModifier: 0`, `immigrationModifier: 0` |
| `highlyCensored` | Highly Censored | -5 Happiness, +30 Crime, -10% Immigration (if allowed). | `happinessModifier: -5`, `crimeModifier: +30`, `immigrationModifier: -0.10` |

#### 15. Labor Laws
| Stance | Name | Description | Effects |
|--------|------|-------------|---------|
| `extendedShifts` | Extended Shifts | +15% citizen job income but -15 Happiness. | `citizenIncomeModifier: +0.15`, `happinessModifier: -15` |
| `nineToFive` | 9-5 Standard | No change to citizen job income or Happiness. | `citizenIncomeModifier: 0`, `happinessModifier: 0` |
| `halfWeeks` | Half Weeks | -15% citizen job income but +15 Happiness. | `citizenIncomeModifier: -0.15`, `happinessModifier: +15` |

---

## 4. Default Edicts (New Nations)

| Category | Default Stance | Effect |
|----------|---------------|--------|
| sexualOrientation | `noPreference` | Balanced population growth |
| marriageLimits | `two` | Monogamy (2 spouses max) |
| policeStance | `pacifist` | +10 Happiness, +20 Crime |
| criminalReform | `none` | No cost, no reform |
| immigration | `closed` | No immigration |
| education | `private` | -10 Happiness, no literacy boost |
| healthcare | `private` | No cost, no disease change |
| environment | `open` | +20% Pollution, -10 Environment |
| military | `ready` | No change to effectiveness/upkeep |
| taxation | `normal` | No change to tax rate |
| landAcquisition | `balanced` | Standard land/infra costs |
| militaryProcurement | `standard` | Standard unit costs |
| gambling | `regulated` | Balanced casino revenue |
| censorship | `slightlyCensored` | No change |
| laborLaws | `nineToFive` | No change to income/happiness |

**All edicts start locked.** Effects only apply after unlocking.

---

## 5. Edict Unlock System

### `initializeNationEdicts(nation)`
Called when a new nation is created. Sets default stances for all 15 categories, initializes change dates, sets `edictFreePassUsed = false`, and sets all `edictUnlocked[category] = false`.

### `unlockEdict(nation, category)`
Unlocks an edict category so its effects can apply.

```js
const result = window.EdictSystem.unlockEdict(nation, 'policeStance');
// { success: true, message: "Edict 'policeStance' unlocked. Effects are now active.", alreadyUnlocked: false }
```

Once unlocked, the edict's current stance effects are immediately applied via `applyEdictEffects()`.

### `isEdictUnlocked(nation, category)`
Returns `true` if the edict category is unlocked, `false` otherwise.

### `getUnlockedEdicts(nation)` / `getLockedEdicts(nation)`
Returns arrays of unlocked/locked category names.

---

## 6. Edict Change System

### `changeEdict(nation, category, newStance, currentDay)`

Changes an edict's stance. Subject to the following rules:

| Rule | Behavior |
|------|----------|
| Category must exist | Returns error if unknown category |
| Stance must exist | Returns error if unknown stance for that category |
| Edict must be unlocked | Returns error if locked |
| Cannot change to same stance | Returns error if already set |
| 30-day cooldown | Cannot change within 30 days of last change |
| Free pass | First dangerous change (sexualOrientation or marriageLimits) uses free pass, no cooldown wait, no happiness penalty |
| Dangerous changes | Sexual orientation and marriage limits changes cause 30-day, 50% happiness penalty for all citizens |

### Dangerous Changes
Changing `sexualOrientation` or `marriageLimits` is considered "dangerous" because it affects citizens' relationships and family structure. These changes:
- Consume the free pass on first use (no cooldown wait, no happiness penalty)
- Apply a 30-day, 50% happiness penalty to all citizens on subsequent changes

---

## 7. Edict Effect Application

### `applyEdictEffects(nation)`

Called when:
- A new edict is unlocked
- An edict's stance is changed
- Each day in `Nation.handleDayPassed()` (step 4)

The method:
1. Resets `nation.edictEffects` to all zeros/defaults
2. Iterates over all categories in `nation.edicts`
3. **Skips locked edicts** — their effects do not apply
4. Accumulates modifier values from unlocked edicts' stances

### Effect Fields Applied

| Effect Field | Applied To | In |
|-------------|-----------|-----|
| `birthRateModifier` | Birth rate multiplier | `PopulationSystem.calculatePopulationGrowthRate()` |
| `happinessModifier` | Citizen happiness | `Nation.calculateNationStats()` |
| `crimeModifier` | Crime rate | `Nation.calculateCrime()` |
| `pollutionModifier` | Pollution level | `Nation.calculateNationStats()` |
| `environmentModifier` | Environment score | `Nation.calculateNationStats()` |
| `diseaseModifier` | Disease level | `Nation.calculateDisease()` |
| `diseaseSpawnReduction` | Disease event chance | `Nation.calculateDisease()` |
| `literacyBoostToddler` | Toddler literacy gain | `PopulationSystem.grantLiteracyOnAgeTransition()` |
| `literacyBoostChild` | Child literacy gain | `PopulationSystem.grantLiteracyOnAgeTransition()` |
| `taxRateModifier` | Tax rate multiplier | `Nation.calculateEconomy()` |
| `militaryEffectivenessModifier` | Military unit effectiveness | (referenced in `edictEffects`) |
| `militaryUpkeepModifier` | Military unit upkeep | (referenced in `edictEffects`) |
| `militaryCostModifier` | Military unit purchase cost | `Nation.applyEdictMilitaryCost()` |
| `infrastructureUpkeepModifier` | Infrastructure upkeep cost | `Nation.handleDayPassed()` |
| `improvementUpkeepModifier` | Improvement upkeep cost | `Nation.handleDayPassed()` |
| `immigrationModifier` | Immigration rate multiplier | `PopulationSystem.processMigration()` |
| `maxSpouses` | Maximum spouses per marriage | `PopulationSystem.assignRelationshipRoles()` |
| `criminalKillChance` | Chance criminals are killed | `CitizenJobSystem` |
| `criminalBecomeExChance` | Chance criminals reform | `CitizenJobSystem` |
| `exCriminalReoffendChance` | Chance ex-criminals reoffend | `CitizenJobSystem` |
| `relationshipRestriction` | Who can form relationships | `PopulationSystem` relationship logic |
| `landCostModifier` | Land purchase cost multiplier | `Nation.landCost()` |
| `infraCostModifier` | Infrastructure cost multiplier | `Nation.infraCost()` |
| `citizenIncomeModifier` | Citizen income multiplier | `CitizenJobSystem.applyIncomes()` |
| `censorshipHappinessModifier` | Censorship happiness effect | `Nation.calculateNationStats()` |
| `censorshipCrimeModifier` | Censorship crime effect | `Nation.calculateCrime()` |
| `censorshipImmigrationModifier` | Censorship immigration effect | `PopulationSystem.processMigration()` |

---

## 8. Edict Cost Calculations

### `calculateEdictCosts(nation, nationStats, populationBreakdown)`

Calculates total edict cost for the current turn. Only **three** edict categories have recurring costs:

| Edict | Stance | Cost Basis | Rate |
|-------|--------|-----------|------|
| Criminal Reform | `relaxed` | Per criminal | 0.000005% of revenue per criminal |
| Criminal Reform | `strong` | Per criminal | 0.0000132% of revenue per criminal |
| Education | `selective` | Per toddler + per child | 0.000000388% each |
| Education | `public` | Per toddler + per child | 0.00000388% each |
| Healthcare | `selective` | Per population + per newborn + per demographic | 0.00000066% population, 0.000000659% newborn/demographic |
| Healthcare | `national` | Per newborn + per demographic | 0.000000659% each |

### Cost Caps

| Cap | Value | Description |
|-----|-------|-------------|
| Individual cap | 99.99% | Each edict's cost is capped at 99.99% of tax revenue |
| Combined cap | 99.99% | All three edict costs combined capped at 99.99% of revenue |

This ensures the nation **always retains at least 0.01% of revenue** after edict costs, even at 100M population with all three edicts maxed.

### Cost Application

`Nation.handleDayPassed()` calls `EconomySystem.processEdictCosts()` which calls `CitizenJobSystem.calculateEdictCosts()` and deducts the total from `nation.money`.

---

## 6. Integration Points

### Nation.js

| Method | Edict Interaction |
|--------|-------------------|
| Constructor | Initializes `edictUnlocked = {}` plus null edict fields; `initialize()` calls `EdictSystem.initializeNationEdicts(this)` when available, then `applyEdictEffects()` |
| `initialize()` | Calls `EdictSystem.initializeNationEdicts()` and `applyEdictEffects()` |
| `handleDayPassed()` | Calls `EdictSystem.initializeNationEdicts()` if missing, then `EdictSystem.applyEdictEffects(this)` before `calculateNationStats()` |
| `calculateNationStats()` | Applies `edictEffects.happinessModifier`, `edictEffects.crimeModifier`, `edictEffects.pollutionModifier`, `edictEffects.environmentModifier`, `edictEffects.diseaseModifier` |
| `calculateEconomy()` | Applies `edictEffects.taxRateModifier` to effective tax rate |
| `landCost()` | Applies `edictEffects.landCostModifier` to land purchase cost |
| `infraCost()` | Applies `edictEffects.infraCostModifier` to infrastructure cost |
| `serialize()` | Serializes `edicts`, `edictChangeDates`, `edictFreePassUsed`, `edictUnlocked`, `edictEffects`, `edictSynergies`, `discoveredSynergies`, `synergyDays` |
| `deserialize()` | Restores all edict fields, then calls `initializeNationEdicts()` if missing and `applyEdictEffects()` |

### PopulationSystem.js

| Method | Edict Interaction |
|--------|-------------------|
| `handleDayPassed()` | Calls `CitizenJobSystem.assignJobsToCitizens()` and `applyIncomes()` |
| `processRelationships()` | Calls `resolveCitizenEthnicity()` which checks `nation.edictEffects` for immigration modifiers |
| `assignJobsToCitizens()` | Uses `nation.edictEffect.seniorsWorkTaxHalf` to determine if seniors can work |
| `grantLiteracyOnAgeTransition()` | Applies `edictEffects.literacyBoostToddler` and `literacyBoostChild` |

### EconomySystem.js

| Method | Edict Interaction |
|--------|-------------------|
| `handleDayPassed()` | Calls `processEdictCosts()` which calls `CitizenJobSystem.calculateEdictCosts()` |
| `processEdictCosts()` | Deducts edict costs from `nation.money`, stores `edictCosts` and `edictTotalCost` on nation |

### Citizen.js

| Field | Edict Interaction |
|-------|-------------------|
| `taxMultiplier` | Set by `CitizenJobSystem.applyIncomes()` based on `seniorsWorkTaxHalf` research |

---

## 7. Save/Load Serialization

`Nation.serialize()` includes:
- `edicts`
- `edictChangeDates`
- `edictFreePassUsed`
- `edictUnlocked`
- `edictEffects`
- `edictSynergies`
- `discoveredSynergies`
- `synergyDays`

`Nation.deserialize()` restores all edict fields from saved data, initializes missing state, and calls `EdictSystem.applyEdictEffects()`.

---

## 8. Example Usage

```js
// Check if an edict is unlocked
if (window.EdictSystem.isEdictUnlocked(nation, 'taxation')) {
    console.log('Taxation is unlocked, current stance:', nation.edicts.taxation);
}

// Unlock an edict (e.g., when player researches it)
const result = window.EdictSystem.unlockEdict(nation, 'taxation');
// { success: true, message: "Edict 'taxation' unlocked. Effects are now active.", alreadyUnlocked: false }

// Change an edict stance (subject to 30-day cooldown)
const result = window.EdictSystem.changeEdict(nation, 'taxation', 'light', currentDay);
// { success: true, message: "Edict 'taxation' changed to 'light'", happinessPenaltyDays: 0, freePassUsed: false }

// Get all unlocked edicts
const unlocked = window.EdictSystem.getUnlockedEdicts(nation);
// ['sexualOrientation', 'marriageLimits', 'taxation', ...]

// Get all locked edicts
const locked = window.EdictSystem.getLockedEdicts(nation);
// ['policeStance', 'criminalReform', ...]

// Calculate edict costs for this turn
const costResult = window.EdictSystem.calculateEdictCosts(nation, nation.nationStats, populationBreakdown);
// { totalCost: 150000, breakdown: { criminalReform: 50000, education: 50000, healthcare: 50000 } }
```

---

## 9. Design Principles

- **Unlock-gated effects:** Edicts have no effect until unlocked. This prevents new nations from being overwhelmed by policy choices.
- **Stored stance, conditional effect:** A nation can have a stance set for a locked edict, but the effect only applies once unlocked. Changing stance on a locked edict is rejected.
- **30-day cooldown:** Prevents rapid policy switching. Free pass allows one free dangerous change.
- **Dangerous changes:** Sexual orientation and marriage limits changes affect citizen relationships and trigger happiness penalties.
- **Cost caps:** Individual and combined edict costs are capped at 99.99% of revenue, ensuring the nation always retains at least 0.01%.
- **No cost for unlocked-but-default stances:** Most stances have no recurring cost. Only Criminal Reform, Education, and Healthcare have per-turn costs.

---

## 10. Files Modified

| File | Role |
|------|------|
| `systems/edict-system.js` | Defines all 16 edict categories, 48 stances, effects, unlock system, change system, cost calculations, effect application, synergies |
| `entities/Nation.js` | Holds edict state; initializes/unlocks/applies effects in `initialize()`, `handleDayPassed()`, `deserialize()`; serializes edict state |
| `systems/population-system.js` | Reads `edictEffects` for immigration, birth rate, literacy boosts |
| `systems/citizen-job-system.js` | Consumes `edictEffects.citizenIncomeModifier` (laborLaws) with `EdictSystem.isEdictUnlocked` fallback |
| `systems/economy-system.js` | Calls `EdictSystem.calculateEdictCosts()` and deducts from `nation.money`; `handleDayPassed()` fixed to invoke it |
