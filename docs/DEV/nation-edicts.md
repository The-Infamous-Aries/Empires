# Nation Edicts (Domestic Policies) — Developer Reference

This document explains the full "nation edicts" system — called `domesticPolicies` / `policyEffects` in code — including every policy category, every stance, every numeric effect, every synergy, and how they tie into Population, Citizen, Economy, and Nation systems.

> **Note:** The codebase does not use the word "edict." The equivalent feature is **Domestic Policies** (`nation.domesticPolicies`) and their computed **Policy Effects** (`nation.policyEffects`). This document uses "edict" and "policy" interchangeably.

---

## 1. Architecture Overview

### Two Data Stores

| Store | Location | Purpose |
|-------|----------|---------|
| `domesticPolicies` | `Nation.domesticPolicies` | The player's chosen stance for each policy category (e.g., `immigration: 'open'`) |
| `policyEffects` | `Nation.policyEffects` | The computed numeric modifiers resulting from those stances (e.g., `populationGrowth: 0.15`) |

### Requirement: Internal Affairs Office

A nation cannot set or change domestic policies unless it has built the **Internal Affairs Office** improvement:

```js
// In improvements-system.js setDomesticPolicy():
if (!nation.improvementEffects?.canSetPolicies) {
    console.warn('Internal Affairs Office required to set policies');
    return false;
}
```

### Initialization

When a nation is created, `domesticPolicies` is empty. The first time a policy is set, `initializePolicies()` populates all 10 categories with default stances:

```js
nation.domesticPolicies = {
    immigration: 'moderate',      // restrictive, moderate, open
    nuclearResearch: 'limited',   // banned, limited, active, aggressive
    education: 'public',          // private, public, mixed, elite
    healthcare: 'universal',      // private, universal, hybrid, premium
    environment: 'balanced',      // industrial, balanced, green, strict
    taxation: 'progressive',      // flat, progressive, regressive, corporate
    military: 'defensive',        // pacifist, defensive, balanced, aggressive
    trade: 'free',               // protectionist, regulated, free, laissez-faire
    surveillance: 'limited',      // none, limited, moderate, extensive
    research: 'civilian'          // civilian, dual-use, military, classified
};
```

### Setting a Policy

`ImprovementsSystem.setDomesticPolicy(nation, policy, stance)`:
1. Checks Internal Affairs Office requirement
2. Validates the policy key exists
3. Validates the stance is in the allowed list for that policy
4. Sets `nation.domesticPolicies[policy] = stance`
5. Calls `applyPolicyEffects(nation)` to recompute all `policyEffects`
6. Emits `policy_changed` EventBus event

---

## 2. All Policy Categories and Stances

### Immigration

| Stance | populationGrowth | culturalStability | Description |
|--------|-----------------|-------------------|-------------|
| `restrictive` | -0.05 (-5%) | +0.10 (+10%) | Low growth, high stability |
| `moderate` | 0.0 | 0.0 | Baseline |
| `open` | +0.15 (+15%) | -0.05 (-5%) | High growth, lower stability |

**Population tie:** `populationGrowth` is added directly to daily birth rate calculations in `server/world.js` line 443.

---

### Nuclear Research

| Stance | nuclearCapability | internationalReputation | energyProduction | militaryThreat |
|--------|------------------|------------------------|------------------|----------------|
| `banned` | 0.0 | +0.05 | -0.10 | — |
| `limited` | 0.25 | 0.0 | +0.05 | — |
| `active` | 0.75 | -0.05 | +0.15 | — |
| `aggressive` | 1.0 | -0.15 | +0.25 | +0.20 |

---

### Education

| Stance | researchBonus | socialEquality | economicGrowth |
|--------|--------------|----------------|----------------|
| `private` | +0.10 | -0.10 | +0.05 |
| `public` | 0.0 | +0.10 | 0.0 |
| `mixed` | +0.05 | +0.05 | +0.03 |
| `elite` | +0.20 | -0.20 | +0.10 |

**Population tie:** `educationBonus` from `policyEffects` is used in `Nation.calculateLiteracy()` (line 502-504), which feeds citizen `literacyScore` and job eligibility.

---

### Healthcare

| Stance | healthcareQuality | socialEquality | governmentSpending |
|--------|------------------|----------------|-------------------|
| `private` | +0.15 | -0.15 | -0.10 |
| `universal` | +0.05 | +0.15 | +0.15 |
| `hybrid` | +0.10 | +0.05 | +0.05 |
| `premium` | +0.25 | -0.25 | +0.20 |

**Population tie:** `healthcareQuality` affects disease reduction and citizen health in `Nation.calculateDisease()` and `Nation.calculateHealthcare()`.

---

### Environment

| Stance | industrialOutput | environmentalHealth | internationalReputation |
|--------|-----------------|---------------------|------------------------|
| `industrial` | +0.20 | -0.20 | -0.10 |
| `balanced` | 0.0 | 0.0 | 0.0 |
| `green` | -0.10 | +0.15 | +0.10 |
| `strict` | -0.20 | +0.30 | +0.15 |

**Population tie:** `environmentalHealth` reduces pollution in `Nation.calculatePollution()` (line 565-567), which affects disease and citizen health.

---

### Taxation

| Stance | taxEfficiency | socialEquality | economicGrowth |
|--------|--------------|----------------|----------------|
| `flat` | +0.10 | -0.10 | +0.05 |
| `progressive` | 0.0 | +0.10 | 0.0 |
| `regressive` | +0.05 | -0.20 | +0.10 |
| `corporate` | +0.15 | -0.15 | +0.15 |

**Population tie:** `taxEfficiency` affects nation tax revenue calculation. `socialEquality` affects citizen happiness distribution.

---

### Military

| Stance | militaryStrength | diplomaticReputation | governmentSpending |
|--------|-----------------|---------------------|-------------------|
| `pacifist` | -0.30 | +0.15 | -0.15 |
| `defensive` | 0.0 | +0.05 | 0.0 |
| `balanced` | +0.10 | 0.0 | +0.10 |
| `aggressive` | +0.25 | -0.15 | +0.25 |

---

### Trade

| Stance | tradeIncome | domesticIndustry | internationalRelations |
|--------|------------|------------------|-----------------------|
| `protectionist` | -0.15 | +0.20 | -0.10 |
| `regulated` | -0.05 | +0.10 | 0.0 |
| `free` | +0.15 | -0.05 | +0.10 |
| `laissez-faire` | +0.30 | -0.15 | +0.15 |

---

### Surveillance

| Stance | internalSecurity | civilLiberties | espionageDefense |
|--------|-----------------|----------------|-----------------|
| `none` | -0.10 | +0.20 | -0.20 |
| `limited` | 0.0 | +0.10 | 0.0 |
| `moderate` | +0.10 | -0.05 | +0.15 |
| `extensive` | +0.25 | -0.20 | +0.30 |

**Population tie:** `internalSecurity` reduces crime in `Nation.calculateCrime()` (line 663-664): `surveillanceEffect = this.policyEffects.internalSecurity * -20`.

---

### Research

| Stance | civilianResearch | militaryResearch | internationalCooperation |
|--------|-----------------|-----------------|-------------------------|
| `civilian` | +0.15 | -0.10 | +0.15 |
| `dual-use` | +0.10 | +0.10 | +0.05 |
| `military` | -0.05 | +0.25 | -0.10 |
| `classified` | +0.05 | +0.35 | -0.25 |

---

## 3. Policy Synergies (Combination Bonuses)

When specific combinations of stances are active simultaneously, bonus effects stack on top of individual stance effects:

| Synergy Name | Required Policies | Effect |
|-------------|-------------------|--------|
| **Authoritarian** | surveillance: `extensive` + military: `aggressive` + taxation: `regressive` | `authoritarianBonus: +0.20` (military/control), `democraticPenalty: -0.25` (happiness/relations) |
| **Liberal Democracy** | immigration: `open` + healthcare: `universal` + taxation: `progressive` | `democraticBonus: +0.15` (happiness/growth), `economicEfficiency: -0.10` |
| **Technocracy** | education: `elite` + research: `dual-use` + taxation: `corporate` | `technocraticBonus: +0.30` (R&D), `socialCohesion: -0.15` (social stability) |
| **Green State** | environment: `strict` + healthcare: `universal` + research: `civilian` | `sustainabilityBonus: +0.25` (long-term growth), `industrialPenalty: -0.20` (immediate production) |

---

## 4. How Policy Effects Flow Into Nation Calculations

### Literacy (`Nation.calculateLiteracy()`)
```js
if (this.policyEffects?.educationBonus) {
    policyBonus = this.policyEffects.educationBonus * 100;
}
this.nationStats.literacy = Math.min(40, Math.max(0, baseLiteracy + ... + policyBonus));
```
→ Feeds citizen `literacyScore` → affects job tier eligibility in CitizenJobSystem.

### Happiness (`Nation.calculateHappiness()`)
```js
if (this.policyEffects?.happinessModifier) {
    happiness *= this.policyEffects.happinessModifier;
}
```
→ Affects citizen happiness, turnover in relationships, birth rates.

### Pollution (`Nation.calculatePollution()`)
```js
if (this.policyEffects?.environmentalHealth) {
    recyclingReduction *= Math.max(0, 1.0 - this.policyEffects.environmentalHealth);
}
```
→ Lower pollution → lower disease → healthier citizens → lower death rate.

### Disease (`Nation.calculateDisease()`)
→ Affected by `healthcareQuality` from healthcare policy, which reduces disease rate.

### Crime (`Nation.calculateCrime()`)
```js
surveillanceEffect = this.policyEffects.internalSecurity * -20;
```
→ Higher security → lower crime → affects citizen safety, unemployment, migration.

### Population Growth (`server/world.js` line 443)
```js
(n.policyEffects.populationGrowth || 0),
```
→ Direct daily modifier to birth rate.

---

## 5. Mandates (World-Level Edicts)

The `motion-system.js` handles world-level mandates passed through the World Forum / motions system. These are temporary or permanent edicts that apply to all nations or specific nations:

| Mandate | Effect | Source |
|---------|--------|--------|
| `ANTI_NUCLEAR_MANDATE` | Bans nuclear production and/or launches | Motion-system |
| `ANTI_MISSILE_MANDATE` | Bans missile production and/or launches | Motion-system |
| `WORLD_ENVIRONMENTAL_PROTECTION` | Pollution limits, production penalty | Motion-system |
| `WORLD_PEACE_TREATY` | Peace enforcement | Motion-system |

These are emitted as events (`anti_nuclear_mandate_applied`, etc.) and should be checked by Nation/Population systems when calculating effects.

---

## 6. Tying Edicts to Population (Integration Points)

### Population Growth

Immigration policy's `populationGrowth` effect is added to the daily birth rate:
```js
// In server/world.js or PopulationSystem
dailyBirthRate += nation.policyEffects?.populationGrowth || 0;
```

### Citizen Health & Disease

Healthcare policy's `healthcareQuality` reduces disease:
```js
// In Nation.calculateDisease()
diseaseReduction += nation.policyEffects?.healthcareQuality || 0;
```

### Citizen Crime

Surveillance policy's `internalSecurity` reduces crime:
```js
crime -= nation.policyEffects?.internalSecurity * 20;
```

### Citizen Literacy

Education policy's `educationBonus` increases literacy cap:
```js
literacyCap += nation.policyEffects?.educationBonus * 100;
```

### Citizen Happiness

`policyEffects.happinessModifier` multiplies final happiness:
```js
happiness *= nation.policyEffects?.happinessModifier || 1.0;
```

### Marriage/Divorce Rates (PopulationSystem relationship logic)

Policy effects should influence relationship stability:
- `surveillance: extensive` → higher internal security → lower breakup/divorce
- `healthcare: universal/premium` → better health → lower breakup from health factors
- `taxation: progressive/regressive` → social equality → affects wealth-based breakup weights

### Immigration / Emigration

Immigration policy stance directly affects migration rates:
- `restrictive` → lower immigration, higher cultural stability
- `open` → higher immigration, lower cultural stability (more diverse population)

---

## 7. Key Methods & API

### `ImprovementsSystem.initializePolicies(nation)`
Sets default stances for all 10 policy categories.

### `ImprovementsSystem.setDomesticPolicy(nation, policy, stance)`
Changes a single policy stance. Requires Internal Affairs Office. Recomputes all effects.

### `ImprovementsSystem.getPolicyStances(policy)`
Returns the valid stance array for a given policy category.

### `ImprovementsSystem.applyPolicyEffects(nation)`
Full recompute of `policyEffects` from `domesticPolicies`, including synergies.

### `ImprovementsSystem.calculatePolicySynergies(nation)`
Applies combination bonuses (Authoritarian, Liberal Democracy, Technocracy, Green State).

### `Nation.getPopulationName()`
Returns `populationName` if set, otherwise `name + 'ian'`. Used for citizen ethnicity.

---

## 8. Save/Load Serialization

Both `domesticPolicies` and `policyEffects` are included in `Nation.serialize()` and restored in `Nation.setState()` (or server world load at `server/world.js` line 333: `n.policyEffects = {}`).

---

## 9. Recommended Population Ties (Not Yet Implemented)

The following connections exist in code but could be strengthened:

| Population Feature | Policy to Tie | Suggested Effect |
|-------------------|--------------|-----------------|
| Birth rate | immigration | `populationGrowth` already applied |
| Death rate | healthcare | `healthcareQuality` reduces disease → lower deaths |
| Crime rate | surveillance | `internalSecurity * -20` already applied |
| Literacy | education | `educationBonus * 100` already applied |
| Happiness | taxation, surveillance, environment | `happinessModifier` available but not populated by any stance |
| Marriage stability | healthcare, surveillance | Better health/security → lower divorce |
| Divorce rate | surveillance | Extensive surveillance → lower divorce (fear of consequences) |
| Emigration | immigration | Restrictive → higher emigration pressure |
| Ethnic diversity | immigration | Open → more immigrant citizens with foreign ethnicity |

---

## 10. Files Involved

| File | Role |
|------|------|
| `entities/Nation.js` | Holds `domesticPolicies`, `policyEffects`, `populationName`; consumes effects in calculations |
| `systems/improvements-system.js` | Defines all policies, stances, effects, synergies; `setDomesticPolicy()`, `applyPolicyEffects()` |
| `server/world.js` | API endpoint for setting policies; applies `populationGrowth` to world calc |
| `systems/motion-system.js` | World-level mandates (Anti-Nuclear, Anti-Missile, etc.) |
| `systems/population-system.js` | Should consume policy effects for birth/death/marriage/divorce rates |
| `systems/citizen-job-system.js` | Should consume literacy/happiness effects from policies |
