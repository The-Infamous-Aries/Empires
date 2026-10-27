# Technology Entity

## Overview

The `Technology` entity wraps research data and integrates with the unified `ResearchSystem`. It provides a clean interface for technology lookups, effect application, research state tracking, and serialization. All research data (costs, effects, prerequisites, unlocks, tier, etc.) is loaded from the research data files in `assets/data/research/` and accessed through the `ResearchSystem`.

## File Location

`entities/Technology.js`

## Architecture

The Technology entity is **not** a standalone research engine. It is a data wrapper that delegates all research logic to `ResearchSystem`. The flow is:

```
Research Data Files (assets/data/research/*.js)
        ↓
ResearchSystem (systems/research-system.js)
        ↓
Technology Entity (entities/Technology.js)
        ↓
Nation (entities/Nation.js)
```

## Class Definition

```javascript
class Technology {
    constructor(id, name = '', description = '')
}
```

### Constructor Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `id` | string | — | Unique research ID (matches key in research data files) |
| `name` | string | `id` | Display name of the technology |
| `description` | string | `''` | Human-readable description |

## Properties

### Technology Properties (from research database)

| Property | Type | Default | Source | Description |
|----------|------|---------|--------|-------------|
| `category` | string | `''` | Data file | Research branch: `economy`, `healthcare`, or `war` |
| `tier` | number | `1` | Data file | Tech level requirement (1–12) |
| `cost` | number | `0` | Data file | Research cost in research points (goal amount) |
| `prerequisites` | string[] | `[]` | Data file | Array of research IDs that must be completed first |

### Research Status

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `isResearched` | boolean | `false` | Whether this technology has been fully researched |
| `isBeingResearched` | boolean | `false` | Whether this technology is currently being funded |
| `researchStarted` | number\|null | `null` | Timestamp when research was started |
| `researchProgress` | number | `0` | Current research points invested (0 to `cost`) |
| `researchedBy` | string[] | `[]` | List of nation IDs that have researched this |

### Technology Effects

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `effects` | object | `{}` | Effect keys mapped to values (applied to `nation.researchEffects`) |
| `unlocks` | string[] | `[]` | Array of research IDs unlocked by this technology |
| `bonuses` | object | `{}` | Bonus keys mapped to values (deprecated, use `effects`) |

### Advanced Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `rarity` | string | `'common'` | Rarity tier: `common`, `uncommon`, `rare`, `very_rare`, `legendary` |
| `difficulty` | string | `'medium'` | Difficulty: `easy`, `medium`, `hard`, `very_hard`, `extreme` |
| `applications` | string[] | `[]` | List of application areas |
| `obsoletes` | string[] | `[]` | List of research IDs made obsolete by this technology |

### Research Integration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `baseResearchRate` | number | `1.0` | Base research rate multiplier |
| `researchMultipliers` | object | `{}` | Nation-specific research multipliers |
| `collaborativeBonus` | number | `0` | Bonus from collaborators (0 to 0.75) |
| `collaborators` | string[] | `[]` | List of collaborating nation IDs |

### Historical Data

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `firstDiscoveredBy` | string\|null | `null` | Nation ID of first discoverer |
| `firstDiscoveredAt` | number\|null | `null` | Timestamp of first discovery |
| `totalResearchInvestment` | number | `0` | Total research points invested |
| `researchAttempts` | number | `0` | Number of research attempts |

## Data Loading

Technology data is loaded from research data files via `getTechnologyData()`:

1. **`window.ResearchSystem.researchDatabase`** — Primary source (ResearchSystem's Map of all research)
2. **`ResearchDatabase.research`** — Global research database (combined from all branches)
3. **`window.EconomyResearch`, `window.HealthcareResearch`, `window.WarResearch`** — Individual branch data files

If no data is found, the Technology entity uses default values (no effects, tier 1, cost 0, etc.).

## Methods

### Data & Lookup

#### `initializeTechnologyData()`
Loads data from the research database and populates all entity properties. Called automatically from the constructor.

#### `getTechnologyData()`
Returns the raw research data object for this technology's ID. Searches sources in priority order:
1. `window.ResearchSystem.researchDatabase`
2. `ResearchDatabase.research`
3. `window.EconomyResearch` / `window.HealthcareResearch` / `window.WarResearch`
4. Returns `null` if not found

### Research System Integration

#### `canStartResearch(nation)` → `{canResearch: boolean, reason: string}`
Checks whether a nation can start researching this technology:

| Check | Condition | Failure Reason |
|-------|-----------|----------------|
| Prerequisites | All prerequisite research IDs must be in `nation.completedResearch` | `"Missing prerequisite: {id}"` |
| Already researched | Technology must not be in `completedResearch` | `"Already researched"` |
| Active research | Technology must not be the active research for this nation | `"Already being researched"` |
| Tech level | `nation.tech >= this.tier` | `"Tech level {tier} required"` |

#### `startResearch(nationId)` → `{success: boolean, message: string}`
Starts researching this technology through `ResearchSystem.startResearch()`. Sets `isBeingResearched = true`, records `researchStarted`, and increments `researchAttempts`.

#### `cancelResearch(nationId)` → `{success: boolean, message: string}`
Cancels active research through `ResearchSystem.cancelResearch()`. Sets `isBeingResearched = false` and resets `researchProgress = 0`.

#### `applyEffectsToNation(nation)` → `boolean`
Applies this technology's effects to a nation:
1. Adds each effect key/value to `nation.researchEffects`
2. Calls `ResearchSystem.rebuildModifiers(nation.id)` to recalculate war/economy modifiers
3. Tracks first discovery (`firstDiscoveredBy`, `firstDiscoveredAt`)
4. Adds nation to `researchedBy` list
5. Increments `nation.statistics.researchCompleted`

#### `completeResearch(nation)` → `{completed, technology, effects, unlocks, bonuses}`
Marks this technology as fully researched (called by ResearchSystem when the research goal is reached):
- Sets `isResearched = true`
- Sets `discovered` timestamp
- Sets `researchProgress = cost`
- Adds to `nation.technologies` Set
- Applies effects via `applyEffectsToNation()`

#### `getResearchProgress(nationId)` → `number`
Returns current research progress:
1. Queries `ResearchSystem.getResearchProgress(nation.id, this.id)` if available
2. Falls back to `this.cost` if `isResearched`, otherwise `this.researchProgress`

### Progress & Information

#### `getProgressSummary()` → `{status, message, percentage, remaining}`
Returns a human-readable progress summary:

| Field | Value |
|-------|-------|
| `status` | `'completed'`, `'in_progress'`, or `'not_started'` |
| `message` | Human-readable string (e.g., `"45.2% complete"`) |
| `percentage` | Number 0–100 |
| `remaining` | Research points remaining until completion |

#### `getResearchInfo()` → `object`
Returns a complete information object about this technology:

| Field | Description |
|-------|-------------|
| `id`, `name`, `description` | Basic identity |
| `category`, `tier`, `cost`, `rarity`, `difficulty` | Properties |
| `isResearched`, `researchProgress` | Status |
| `prerequisites` | Required research IDs |
| `effects`, `unlocks`, `bonuses`, `applications` | Benefits |
| `firstDiscoveredBy`, `firstDiscoveredAt` | Historical |
| `researchedByCount`, `totalInvestment` | Stats |
| `collaborativeBonus`, `collaboratorCount` | Collaboration |

### Collaborative Research

#### `addCollaborator(nationId)` / `removeCollaborator(nationId)`
Adds or removes a collaborating nation. Automatically updates `collaborativeBonus`.

#### `updateCollaborativeBonus()`
Calculates bonus based on collaborator count: `Math.min(0.75, (collaborators.length - 1) * 0.15)`. Maximum 75% bonus with 5+ collaborators.

### Serialization

#### `serialize()` → `object`
Returns a complete serializable object for saving/loading:

```javascript
{
    id, name, description,
    category, tier, cost, prerequisites,
    isResearched, researchProgress, researchedBy,
    effects, unlocks, bonuses,
    rarity, difficulty, applications, obsoletes,
    baseResearchRate, researchMultipliers, collaborativeBonus, collaborators,
    firstDiscoveredBy, firstDiscoveredAt, totalResearchInvestment, researchAttempts
}
```

#### `static deserialize(data)` → `Technology`
Restores a Technology instance from serialized data. Reconstructs all properties, status, effects, and historical data.

## Effect Mapping

Technology effect keys map to `ResearchSystem` modifier stats via `research-system.js`'s `effectMap`. Common mappings:

| Effect Key | Modifier Stat | Description |
|------------|---------------|-------------|
| `attack_power` | `attack` | Player attack skill boost |
| `defensive_strength` | `defense` | Player defense skill boost |
| `accuracy` / `aim` | `aim` | Player aim skill boost |
| `luck` | `luck` | Player luck skill boost |
| `critical_chance` | `critChance` | Critical hit chance |
| `critical_damage` | `critDamage` | Critical hit damage |
| `block_chance` | `block` | Block skill |
| `parry_chance` | `parry` | Parry skill |
| `soldier_cost_reduction` | `soldierCostReduction` | Soldier purchase cost % reduction |
| `tank_cost_reduction` | `tankCostReduction` | Tank purchase cost % reduction |
| `aircraft_cost_reduction` | `aircraftCostReduction` | Aircraft purchase cost % reduction |
| `ship_cost_reduction` | `shipCostReduction` | Ship purchase cost % reduction |
| `soldier_upkeep_reduction` | `soldierUpkeepReduction` | Soldier upkeep cost % reduction |
| `tank_upkeep_reduction` | `tankUpkeepReduction` | Tank upkeep cost % reduction |
| `aircraft_upkeep_reduction` | `aircraftUpkeepReduction` | Aircraft upkeep cost % reduction |
| `ship_upkeep_reduction` | `shipUpkeepReduction` | Ship upkeep cost % reduction |
| `soldier_effectiveness_boost` | `soldierEffectiveness` | Soldier combat effectiveness |
| `tank_effectiveness_boost` | `tankEffectiveness` | Tank combat effectiveness |
| `aircraft_effectiveness_boost` | `aircraftEffectiveness` | Aircraft combat effectiveness |
| `ship_effectiveness_boost` | `shipEffectiveness` | Ship combat effectiveness |
| `missile_damage_boost` | `missileDamageBoost` | Missile damage increase |
| `nuke_damage_boost` | `nukeDamageBoost` | Nuclear damage increase |
| `taxable_income_boost` | `taxableIncomeBoost` | Population taxable income % increase |
| `crime_reduction` | `crimeReduction` | Crime rate % reduction |
| `happiness_bonus` | `happinessBonus` | Happiness points increase |
| `environment_bonus` | `environmentBonus` | Environment points increase |
| `infra_upkeep_reduction` | `infraUpkeepReduction` | Infrastructure upkeep % reduction |
| `infra_cost_reduction` | `infraCostReduction` | Infrastructure purchase cost % reduction |
| `land_cost_reduction` | `landCostReduction` | Land purchase cost % reduction |
| `pollution_reduction` | `pollutionReduction` | Pollution % reduction |
| `disease_spawn_rate_reduction` | `diseaseSpawnReduction` | Disease spawn rate % reduction |
| `disease_level_reduction` | `diseaseLevelReduction` | Disease level % reduction |
| `cure_cost_reduction` | `cureCostReduction` | Disease cure cost % reduction |
| `population_growth_bonus` | `populationGrowthBonus` | Population growth rate % increase |
| `population_boost` | `populationBoost` | Flat population % increase |
| `energy_skill_bonus` | `energySkillBonus` | Player energy skill bonus |
| `intuition_skill_bonus` | `intuitionSkillBonus` | Player intuition skill bonus |
| `seniors_work_tax_half` | `seniorsWorkTaxHalf` | Seniors taxed at half rate |

## Usage Examples

### Creating and Starting Research

```javascript
const tech = new Technology('primitive_weapons');

// Check if nation can start
const canStart = tech.canStartResearch(nation);
if (canStart.canResearch) {
    tech.startResearch(nation.id);
}
```

### Getting Progress for UI

```javascript
const summary = tech.getProgressSummary();
console.log(`${tech.name}: ${summary.percentage}% complete (${summary.status})`);
```

### Serializing for Save Game

```javascript
const saveData = tech.serialize();
// saveData can be JSON.stringified and stored

// Later, restore:
const tech = Technology.deserialize(saveData);
```

### Checking Available Research

```javascript
const available = nation.getAvailableResearch(); // Via ResearchSystem
available.forEach(researchData => {
    const tech = new Technology(researchData.id, researchData.name, researchData.description);
    console.log(`${tech.name} (Tier ${tech.tier}): ${tech.cost} research points`);
});
```

## Integration Points

| System | Integration Point |
|--------|------------------|
| `ResearchSystem` (`systems/research-system.js`) | All research logic, progress tracking, effect modifier calculation |
| `Nation` (`entities/Nation.js`) | `processResearch()`, `getAvailableResearch()`, `startResearch()`, `cancelResearch()` delegate to Technology/ResearchSystem |
| `server/world.js` | Building upkeep applies `infraUpkeepReduction` modifier |
| `disease-system.js` | Applies `diseaseSpawnReduction` and `cureCostReduction` modifiers |
| `Player.js` | Energy and intuition skill bonuses applied from `energySkillBonus`/`intuitionSkillBonus` |

## Research Cost Model

Research is **goal-based, not time-based**:

- Each technology has a `cost` (research points goal)
- Laboratories divert a percentage of net turn income into `nation.researchPoints`
- Points fund active research until `progress >= cost`
- Research auto-completes when goal is reached
- No `time` field exists anywhere in the system
- No upfront money cost; funded entirely by lab income diversion

## Branch Categories

| Category | Description | Icon |
|----------|-------------|------|
| `economy` | Financial systems, trade, and economic development | 💰 |
| `healthcare` | Medical knowledge, public health, and disease management | 🏥 |
| `war` | Military technology, tactics, and warfare evolution | ⚔️ |

## Tech Levels

Tech levels (1–12) represent technological advancement tiers. Each tier unlocks progressively more powerful research. Requirements are based on `nation.tech` level.

| Tier | Description |
|------|-------------|
| 1 | Basic tools, primitive weapons, early medicine, simple trade systems |
| 2 | Metal tools, basic fortifications, organized taxation, classical medicine |
| 3 | Iron weaponry, defensive walls, banking systems, surgical techniques |
| 4 | Steel weapons, siege engines, commercial law, Renaissance medicine |
| 5 | Professional armies, castles, stock exchanges, industrial medicine |
| 6 | Gunpowder weapons, central banking, vaccines, modern surgery |
| 7 | Artillery, monetary policy, medical radiology, small arms |
| 8 | Rifles, econometrics, organ transplants, industrial logistics |
| 9 | Breech-loading, behavioral economics, MRI imaging, explosive shells |
| 10 | Machine guns, quantitative trading, stem cell therapy, chemical warfare |
| 11 | Nuclear weapons, cryptocurrency, organ regeneration, jet aircraft |
| 12 | Quantum finance, post-scarcity economics, consciousness medicine, cyber warfare |

## Notes

- Technology data comes from `assets/data/research/` (war-research.js, healthcare-research.js, economy-research.js)
- `production-research.js` was removed (resources no longer exist in the game)
- No research is time-based; all research is goal-based and funded by lab income diversion
- The `Technology` entity is a wrapper — all research logic lives in `ResearchSystem`
- Effects from completed research accumulate on `nation.researchEffects` and are converted to consumable modifiers via `ResearchSystem.rebuildModifiers()`
