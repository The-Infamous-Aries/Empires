# Government System

Handles nation government types — political structures that provide real mechanical bonuses and penalties affecting tax collection, military strength, population efficiency, pollution, disease, building upkeep, and more.

## Overview

- **System class:** `GovernmentSystem`
- **Global instance:** `window.GovernmentSystem`
- **Government count:** 12 types
- **Balance rule:** Every government has exactly **3 boosts** and **2 penalties**
- **Bonus application:** Additive percentage (0.10 = +10%) applied via multiplication `(1 + value)`
- **Penalty application:** Multiplicative (0.90 = -10%) applied via direct multiplication
- **Bad metrics** (pollution, disease, crime, building upkeep): Higher is worse. Bonuses reduce them, penalties increase them.
- **Good metrics** (happiness, taxableIncome, militaryStrength, etc.): Higher is better. Bonuses increase them, penalties reduce them.
- **Nation integration:** Called via `Nation.applyGovernmentBonuses()` which delegates to `GovernmentSystem.applyGovernmentBonuses()`

## Government Reference

| Government | Icon | Tax Rate | Military Budget | Boost 1 | Boost 2 | Boost 3 | Penalty 1 | Penalty 2 |
|------------|------|----------|-----------------|---------|---------|---------|-----------|-----------|
| Liberal Democracy | 🗳️ | 18% | 15 | taxableIncome +10% | environment +10% | happiness +10% | militaryStrength -10% | militaryMorale -10% |
| Constitutional Monarchy | 👑 | 20% | 20 | stability +10% | environment +5% | militaryStrength +5% | pollution +10% | taxEfficiency -8% |
| Communist State | ⚒️ | 25% | 30 | infra +10% | militaryStrength +10% | improvementUpkeep -10% | happiness -15% | pollution +15% |
| Theocratic Republic | 🕌 | 22% | 25 | happiness +10% | disease -10% | stability +10% | taxEfficiency -10% | militaryMorale -10% |
| Military Junta | 🎖️ | 28% | 40 | militaryStrength +12% | stability +10% | militaryMorale +10% | happiness -15% | taxEfficiency -15% |
| Corporatist State | 🏭 | 23% | 20 | taxEfficiency +12% | infra +10% | militaryBudget +10% | populationEfficiency -10% | pollution +10% |
| Direct Democracy | 📜 | 20% | 15 | happiness +12% | stability +10% | populationEfficiency +10% | taxEfficiency -15% | militaryMorale -10% |
| Technocracy | 🔬 | 22% | 18 | taxEfficiency +10% | projectUpkeep -10% | infra +10% | happiness -10% | pollution +5% |
| Federal Republic | ⚖️ | 21% | 20 | stability +10% | populationEfficiency +10% | happiness +10% | militaryMorale -10% | militaryStrength -10% |
| Single-Party State | 🏴 | 24% | 28 | populationEfficiency +10% | stability +10% | militaryStrength +10% | happiness -10% | tech -10% |
| Anarcho-Communism | 🌐 | 10% | 8 | happiness +10% | populationEfficiency +10% | improvementUpkeep -10% | militaryStrength -10% | stability -10% |
| Absolute Monarchy | ♛ | 30% | 35 | militaryStrength +10% | stability +10% | militaryMorale +10% | happiness -10% | taxEfficiency -10% |

---

## Governments by Type

### 1. Liberal Democracy 🗳️
**Full name:** Liberal Democratic Republic  
**Tax rate:** 18% | **Military budget:** 15  

**Theme:** Free markets, civil liberties, constitutional limits on government power.

**Bonuses:**
- **taxableIncome +10%** — Free markets generate more taxable income
- **environment +10%** — Environmental protections improve environment quality
- **happiness +10%** — Civil liberties increase citizen happiness

**Penalties:**
- **militaryStrength -10%** — Pacifist leaning reduces military power
- **militaryMorale -10%** — Less military focus lowers troop morale

**Policies:** Capitalist economy, Defensive military, Progressive social, Moderate environmental, Diplomatic foreign

**Hint themes:** Freedom, free markets, minority rights, reputation, innovation

---

### 2. Constitutional Monarchy 👑
**Full name:** Constitutional Monarchy  
**Tax rate:** 20% | **Military budget:** 20  

**Theme:** Balanced system where a hereditary monarch serves as head of state within a constitutional framework, sharing power with an elected parliament.

**Bonuses:**
- **stability +10%** — National unity under the crown
- **environment +5%** — Conservationist policies protect the environment
- **militaryStrength +5%** — Royal guard provides military strength

**Penalties:**
- **pollution +10%** — Traditional industry produces more pollution
- **taxEfficiency -8%** — Traditionalist bureaucracy slows tax collection

**Policies:** Mixed economy, Balanced military, Traditional social, Conservationist environmental, Traditional foreign

**Hint themes:** Tradition, unity, balance, heritage, stability

---

### 3. Communist State ⚒️
**Full name:** Communist Peoples Republic  
**Tax rate:** 25% | **Military budget:** 30  

**Theme:** State controls economic production and distribution through central planning. Government owns major industries and directs resource allocation toward collective goals.

**Bonuses:**
- **infra +10%** — State-funded infrastructure projects
- **militaryStrength +10%** — State armies
- **buildingUpkeep.improvements -10%** — State efficiency reduces improvement upkeep

**Penalties:**
- **happiness -15%** — Oppression reduces citizen happiness
- **pollution +15%** — Heavy industry increases pollution

**Policies:** Planned economy, Militaristic military, Collectivist social, Industrial environmental, Isolationist foreign

**Hint themes:** Collective, industrial, equality, central planning, militaristic

---

### 4. Theocratic Republic 🕌
**Full name:** Islamic Republic  
**Tax rate:** 22% | **Military budget:** 25  

**Theme:** Religious principles and clerical authority influence governance alongside democratic institutions. Divine law serves as the foundation for civil law.

**Bonuses:**
- **happiness +10%** — Spiritual fulfillment
- **disease -10%** — Faith-based community care reduces disease
- **stability +10%** — Shared faith provides stability

**Penalties:**
- **taxEfficiency -10%** — Religious bureaucracy slows tax collection
- **militaryMorale -10%** — Pacifist sects lower military morale

**Policies:** Mixed economy, Devotional military, Conservative social, Traditional environmental, Guarded foreign

**Hint themes:** Faith, divine, tradition, morale, unity

---

### 5. Military Junta 🎖️
**Full name:** Armed Forces Provisional Government  
**Tax rate:** 28% | **Military budget:** 40  

**Theme:** Ruled by a council of military officers who seized power, prioritizing national defense and order over civilian governance.

**Bonuses:**
- **militaryStrength +12%** — Military rule strengthens armed forces
- **stability +10%** — Order through force
- **militaryMorale +10%** — Discipline boosts morale

**Penalties:**
- **happiness -15%** — Oppression reduces citizen happiness
- **taxEfficiency -15%** — Military focus slows tax collection

**Policies:** State-Controlled economy, Militaristic military, Authoritarian social, Utilitarian environmental, Confrontational foreign

**Hint themes:** Military, discipline, order, defense, authoritarian

---

### 6. Corporatist State 🏭
**Full name:** National Corporatist Republic  
**Tax rate:** 23% | **Military budget:** 20  

**Theme:** Society organized into professional corporations representing different economic sectors. State mediates between corporate interests.

**Bonuses:**
- **taxEfficiency +12%** — Corporate efficiency improves tax collection
- **infra +10%** — Industrial coordination builds infrastructure
- **militaryBudget +10%** — Corporate spending funds the military

**Penalties:**
- **populationEfficiency -10%** — Rigid corporate structure
- **pollution +10%** — Industrial focus increases pollution

**Policies:** Corporatist economy, Pragmatic military, Cooperative social, Industrial environmental, Nationalist foreign

**Hint themes:** Cooperation, corporations, guilds, coordination, efficiency

---

### 7. Direct Democracy 📜
**Full name:** Participatory Democracy  
**Tax rate:** 20% | **Military budget:** 15  

**Theme:** Citizens vote directly on legislation and policy rather than through representatives.

**Bonuses:**
- **happiness +12%** — Voice in governance increases happiness
- **stability +10%** — Legitimacy from popular participation
- **populationEfficiency +10%** — Citizen participation

**Penalties:**
- **taxEfficiency -15%** — Slow democratic process
- **militaryMorale -10%** — Democratic debate lowers military morale

**Policies:** Mixed economy, Democratic military, Progressive social, Adaptive environmental, Peacelist foreign

**Hint themes:** Participation, assembly, transparency, voice, innovation

---

### 8. Technocracy 🔬
**Full name:** Technocratic Republic  
**Tax rate:** 22% | **Military budget:** 18  

**Theme:** Scientists, engineers, and experts govern based on technical knowledge and evidence. Decisions made through data analysis rather than political consideration.

**Bonuses:**
- **taxEfficiency +10%** — Technical management improves tax collection
- **buildingUpkeep.projects -10%** — Engineered efficiency reduces project upkeep
- **infra +10%** — Engineered infrastructure projects

**Penalties:**
- **happiness -10%** — Impersonal rule reduces happiness
- **pollution +5%** — Industrial focus increases pollution

**Policies:** Planned economy, Technical military, Meritocratic social, Scientific environmental, Pragmatic foreign

**Hint themes:** Expertise, science, efficiency, precision, data

---

### 9. Federal Republic ⚖️
**Full name:** Federal Democratic Republic  
**Tax rate:** 21% | **Military budget:** 20  

**Theme:** Power divided between national government and constituent states/provinces. Multiple levels share authority.

**Bonuses:**
- **stability +10%** — Subsidiarity
- **populationEfficiency +10%** — Local knowledge
- **happiness +10%** — Citizen representation

**Penalties:**
- **militaryMorale -10%** — Divided command
- **militaryStrength -10%** — Distributed forces

**Policies:** Federal economy, Distributed military, Pluralistic social, Regional environmental, Cooperative foreign

**Hint themes:** Federalism, subsidiarity, diversity, local, resilience

---

### 10. Single-Party State 🏴
**Full name:** Socialist Peoples Republic  
**Tax rate:** 24% | **Military budget:** 28  

**Theme:** Single political party holds absolute authority, other parties banned or ceremonial. Party directs all aspects of governance.

**Bonuses:**
- **populationEfficiency +10%** — Party mobilization
- **stability +10%** — Party control
- **militaryStrength +10%** — Mass mobilization

**Penalties:**
- **happiness -10%** — Party control reduces happiness
- **tech -10%** — Ideological conformity slows research

**Policies:** Planned economy, Mass military, Collectivist social, Utilitarian environmental, Ideological foreign

**Hint themes:** Party, planning, mobilization, unity, ideology

---

### 11. Anarcho-Communism 🌐
**Full name:** Libertarian Socialist Confederation  
**Tax rate:** 10% | **Military budget:** 8  

**Theme:** No centralized state authority. Communities organize through voluntary association and collective ownership.

**Bonuses:**
- **happiness +10%** — Freedom
- **populationEfficiency +10%** — Voluntary cooperation
- **buildingUpkeep.improvements -10%** — No bureaucracy reduces upkeep

**Penalties:**
- **militaryStrength -10%** — No standing army
- **stability -10%** — Lack of central authority

**Policies:** Collectivist economy, Militia military, Libertarian social, Ecosocialist environmental, Non-Interventionist foreign

**Hint themes:** Voluntary, community, freedom, cooperation, self-governance

---

### 12. Absolute Monarchy ♛
**Full name:** Divine Right Monarchy  
**Tax rate:** 30% | **Military budget:** 35  

**Theme:** Single sovereign holds unlimited power, ruling by divine right or hereditary claim. The monarch's word is law.

**Bonuses:**
- **militaryStrength +10%** — Royal command
- **stability +10%** — Hierarchical order
- **militaryMorale +10%** — Royal authority

**Penalties:**
- **happiness -10%** — Oppression
- **taxEfficiency -10%** — Royal bureaucracy

**Policies:** Mercantilist economy, Royal military, Hierarchical social, Utilitarian environmental, Imperialist foreign

**Hint themes:** Monarch, authority, tradition, decree, hierarchy

---

## Mechanics

### How Bonuses and Penalties Are Applied

`GovernmentSystem.applyGovernmentBonuses(nation, governmentId)` processes all bonuses and penalties:

1. **Dot-notation support:** Keys like `'nationStats.taxEfficiency'` or `'buildingUpkeep.improvements'` navigate nested objects
2. **Bad metrics** (pollution, disease, crime, buildingUpkeep.*): Higher value is worse
   - Bonus: `value × (1 − bonus%)` — reduces the bad metric
   - Penalty: `value × (1 + penalty%)` — increases the bad metric
3. **Good metrics** (happiness, taxableIncome, militaryStrength, infra, stability, etc.): Higher value is better
   - Bonus: `value × (1 + bonus%)` — increases the good metric
   - Penalty: `value × penalty%` — reduces the good metric (e.g. 0.90 = −10%)

### Nation Integration

`Nation.applyGovernmentBonuses()` (entities/Nation.js:1119) delegates to `GovernmentSystem.applyGovernmentBonuses()`:

- Called during nation initialization (line 204)
- Called during daily processing (line 1273)
- Applies government policies to `nation.policies`
- Sets `nation.taxRate` from government tax rate

### Tax Revenue Calculation

Government affects tax revenue in `entities/Nation.js` (line 855-894):

- **taxRate** may be overridden by government taxRate
- **taxEfficiency** from government bonuses multiplies into revenue calculation
- `taxRevenue = taxableIncome × (taxRate / 100) × taxEfficiency × governmentModifier`

---

## Methods

| Method | Description |
|--------|-------------|
| `getGovernment(governmentId)` | Returns government config object by ID |
| `getGovernmentType(governmentId)` | Alias for `getGovernment()` |
| `getAllGovernments()` | Returns array of all 12 government configs |
| `getGovernmentHints(governmentId, count)` | Returns shuffled hints for puzzle mechanics |
| `getHintThemes(governmentId)` | Returns hint theme keywords |
| `getGovernmentIcon(governmentId)` | Returns emoji icon for a government |
| `getGovernmentLabel(governmentId)` | Returns "icon name" display string |
| `applyGovernmentBonuses(nation, governmentId)` | Applies all bonuses/penalties to a nation |
| `getRandomGovernment(currentId)` | Returns a random government excluding current |
| `startDemandTimer(nationKey, callback)` | Starts government change demand timer (7-30 days) |
| `stopDemandTimer(nationKey)` | Stops the demand timer |

---

## Architecture

```
GovernmentSystem (orchestrator)
├── 12 government type definitions
│   ├── liberalDemocracy (🗳️)
│   ├── constitutionalMonarchy (👑)
│   ├── communistState (⚒️)
│   ├── theocraticRepublic (🕌)
│   ├── militaryJunta (🎖️)
│   ├── corporatistState (🏭)
│   ├── directDemocracy (📜)
│   ├── technocracy (🔬)
│   ├── federalRepublic (⚖️)
│   ├── singlePartyState (🏴)
│   ├── anarchoCommunism (🌐)
│   └── absoluteMonarchy (♛)
├── applyGovernmentBonuses() — real mechanical effects
├── getGovernmentType() — Nation.js compatibility alias
└── startDemandTimer() / stopDemandTimer() — government change demands
```

---

## Cross-System Dependencies

| System | Dependency |
|--------|------------|
| `entities/Nation.js` | Calls `applyGovernmentBonuses()` on init and daily; reads `taxRate`, `policies`, `militaryBudget` |
| `systems/wonders-system.js` | References `applyGovernmentBonuses` (line 990-991) |
| `ui/components/ReferencePage.js` | Displays `government.taxRate` (line 168) |
| `entities/City.js` | May reference government effects for city-level bonuses |

---

## Export

```js
window.GovernmentSystem = new GovernmentSystem();
```
