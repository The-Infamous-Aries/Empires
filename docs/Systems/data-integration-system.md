# Data Integration System (Technical Reference)

**File:** `systems/data-integration-system.js`
**Class:** `DataIntegrationSystem`
**Global:** `window.DataIntegrationSystem` (class) / `window.dataIntegration` (instance)

---

## Overview

The Data Integration System **grabs/loads data (READ)** — it does **not** save or persist game state. Its job is to load research, disease, and event data from the data files under `assets/data/` into memory, then feed that data into the live game systems (Research System, Disease System) that consume it.

Saving/persistence is handled by a **separate** system: `DataManager` / `DataIntegration` (`core/data-manager.js`, `core/data-integration.js`). Do not confuse the two:

| System | File | Responsibility | Global |
|--------|------|----------------|--------|
| Data Integration System | `systems/data-integration-system.js` | Loads research/disease/event data from files; integrates into live systems | `window.dataIntegration` |
| Data Manager | `core/data-manager.js` | Auto-save / save-game / load-game | `window.DataManager` |
| Data Integration | `core/data-integration.js` | Database / backup / sync / API | `window.DataIntegration` |

---

## Data Flow Architecture

```
assets/data/research/*.js
  → window.EconomyResearch / window.HealthcareResearch / window.WarResearch
  → window.ResearchDatabase (combined, validated)

assets/data/diseases/*.js
  → window.NATIONAL_DISEASES / window.GLOBAL_DISEASES

assets/data/events/*.js
  → window.EconomicEvents / window.PopulationSituations /
    window.NationSituations / window.MilitarySituations /
    window.MiracleEvents / window.DisasterEvents / window.SportsEvents

        ↓ (all script tags load before game-engine.js in index.html)

systems/data-integration-system.js
  → DataIntegrationSystem.initialize()
    → loadResearchData()   → this.researchData
    → loadDiseaseData()    → this.diseaseData
    → loadEventData()      → this.eventData

        ↓ (called by game-engine.js after system init)

integrateWithResearchSystem() → researchInstance.setResearchDatabase(researchData)
integrateWithDiseaseSystem()  → diseaseInstance.setDiseaseDatabase(diseaseData)

        ↓

ResearchSystem.researchDatabase  (Map)
DiseaseSystem.diseaseDatabase    (Map)
```

---

## Loading Order in index.html

The data files and system must load **before** `core/game-engine.js` so the globals exist when `initialize()` runs:

```html
<script defer src="assets/data/research/economy-research.js"></script>
<script defer src="assets/data/research/healthcare-research.js"></script>
<script defer src="assets/data/research/war-research.js"></script>
<script defer src="assets/data/research/research-index.js"></script>
<script defer src="assets/data/diseases/national-diseases.js"></script>
<script defer src="assets/data/diseases/global-diseases.js"></script>
<script defer src="assets/data/events/economic-events.js"></script>
<script defer src="assets/data/events/population-situations.js"></script>
<script defer src="assets/data/events/nation-situations.js"></script>
<script defer src="assets/data/events/military-situations.js"></script>
<script defer src="assets/data/events/miracle-events.js"></script>
<script defer src="assets/data/events/disaster-events.js"></script>
<script defer src="assets/data/events/sports-events.js"></script>
<script defer src="systems/data-integration-system.js"></script>
<!-- ... -->
<script defer src="core/game-engine.js"></script>
```

---

## Constructor

```javascript
new DataIntegrationSystem()
```

Initializes:

| Property | Type | Description |
|----------|------|-------------|
| `isInitialized` | boolean | `false` until `initialize()` completes |
| `researchData` | object | Combined research data keyed by research ID |
| `diseaseData` | object | `{ national: {...}, global: {...} }` |
| `eventData` | object | Combined event data keyed by event category |

---

## Methods

### Lifecycle

#### `initialize()` → `Promise<void>`

Loads all three data categories in parallel (`Promise.all`), then:

1. Calls `ResearchDatabase.initialize()` if `ResearchDatabase` exists but has no `.research` yet.
2. Sets `isInitialized = true`.
3. Emits `dataIntegration:loaded` on `EventBus` with `{ research, diseases, events }`.

Safe to call multiple times — returns early if already initialized.

---

### Data Loading

#### `loadResearchData()` → `Promise<object>`

Loads research into `this.researchData`:

1. Preferred source: `window.ResearchDatabase.research` (the combined, validated database from `assets/data/research/research-index.js`).
2. Fallback: merges `window.EconomyResearch`, `window.HealthcareResearch`, `window.WarResearch` individually.

Returns `this.researchData` (or `{}` on error).

#### `loadDiseaseData()` → `Promise<object>`

Loads into `this.diseaseData`:

- `this.diseaseData.national` ← `window.NATIONAL_DISEASES`
- `this.diseaseData.global` ← `window.GLOBAL_DISEASES`

Each scope object is expected to have `minor` and `major` arrays (no `severe` tier exists in the data files).

Returns `this.diseaseData` (or `{ national: {}, global: {} }` on error).

#### `loadEventData()` → `Promise<object>`

Loads into `this.eventData` by merging:

| Source | Global Variable | Data File |
|--------|-----------------|-----------|
| Economic events | `window.EconomicEvents` | `assets/data/events/economic-events.js` |
| Population situations | `window.PopulationSituations` | `assets/data/events/population-situations.js` |
| Nation situations | `window.NationSituations` | `assets/data/events/nation-situations.js` |
| Military situations | `window.MilitarySituations` | `assets/data/events/military-situations.js` |
| Miracle events | `window.MiracleEvents` | `assets/data/events/miracle-events.js` |
| Disaster events | `window.DisasterEvents` | `assets/data/events/disaster-events.js` |
| Sports events | `window.SportsEvents` | `assets/data/events/sports-events.js` |

Returns `this.eventData` (or `{}` on error).

---

### Research Queries

#### `getResearchById(researchId)` → `object|null`

Returns the research entry matching `researchId`, or `null`.

#### `getResearchByCategory(category)` → `object`

Returns all research entries whose `.category` matches, keyed by ID.

#### `getResearchByTier(tier)` → `object`

Returns all research entries whose `.tier` matches, keyed by ID.

#### `getAllResearch()` → `object`

Returns the full `this.researchData` object (or `{}` if not loaded).

#### `getResearchCategories()` → `string[]`

Unique sorted list of category values present in loaded research.

#### `getResearchTiers()` → `number[]`

Unique sorted list of tier values present in loaded research.

---

### Disease Queries

#### `getRandomNationalDisease(severity = null)` → `object|null`

Returns a random national disease. If `severity` is `'minor'` or `'major'`, picks from that severity tier only; otherwise combines all national tiers.

#### `getRandomGlobalDisease(severity = null)` → `object|null`

Same as above but for global diseases.

#### `getDiseaseById(diseaseId)` → `object|null`

Searches national then global diseases (minor/major tiers) for a matching `.id`.

---

### Event Queries

#### `getRandomEvent(category = null, weight = null)` → `object|null`

- If `category` given, picks from that category (handles flat arrays or nested subcategories).
- If `category` omitted, picks from all events.
- If `weight` given, filters to events with `(event.weight || 5) >= weight`.
- Uses weighted random selection based on `event.weight` (default 5).

#### `getEventById(eventId)` → `object|null`

Searches all categories/subcategories for a matching `.id`.

#### `getEventsByCategory(category)` → `object[]`

Returns all events in a category (flat or nested), or `[]` if category missing.

---

### Integration

#### `integrateWithResearchSystem()`

Pushes `this.researchData` into the live `window.GameEngine.systems.research` instance via `setResearchDatabase()`. Called by `game-engine.js` after `ResearchSystem` initializes.

#### `integrateWithDiseaseSystem()`

Pushes `this.diseaseData` into the live `window.GameEngine.systems.diseases` instance via `setDiseaseDatabase()`. Called by `game-engine.js` after `DiseaseSystem` initializes.

#### `integrateWithEventSystem()`

Event data is consumed directly from `window` globals by `population-system.js`, `events-system.js`, and `global-system.js`; this method logs availability and performs no assignment (there is no `EventSystem.setEventDatabase` on `window`).

---

### Utility

#### `getDataStats()` → `object`

Returns counts and category/tier breakdowns:

```javascript
{
  research: {
    totalCount: number,
    categories: string[],
    tiers: number[]
  },
  diseases: {
    national: { minor: number, major: number },
    global:   { minor: number, major: number }
  },
  events: {
    totalCount: number,
    categories: string[]
  }
}
```

#### `validateDataIntegrity()` → `{ isValid: boolean, issues: string[] }`

Validates loaded data:

- **Research:** checks each entry has `name`, `category`, `cost`; verifies prerequisite IDs exist in `researchData`.
- **Diseases:** checks each disease has `id`, `name`, `effects`.

Returns `isValid: true` when no issues found.

---

## Instantiation & Wiring

The class is exposed as `window.DataIntegrationSystem`. The live instance is created and initialized by `core/game-engine.js`:

```javascript
// core/game-engine.js, initializeSystems()
if (window.DataIntegrationSystem && !window.dataIntegration) {
    window.dataIntegration = new DataIntegrationSystem();
    await window.dataIntegration.initialize();
}
```

Then, after Research and Disease systems initialize:

```javascript
window.dataIntegration.integrateWithResearchSystem();
window.dataIntegration.integrateWithDiseaseSystem();
```

---

## Data Structures

### Research entry
```javascript
{
  id: string,
  name: string,
  category: 'economy' | 'healthcare' | 'war',
  tier: number (1-12),
  description: string,
  requirements: { tech_level: number, prerequisites?: string[] },
  cost: number,
  effects: object,
  unlocks?: string[]
}
```

### Disease entry
```javascript
{
  id: string,
  name: string,
  severity: 'minor' | 'major',
  scope: 'national' | 'global',
  description: string,
  effects: object,
  cureRequirement: { money: number, time: number, research_points: number }
}
```

### Event entry
```javascript
{
  id: string,
  name: string,          // or title
  description: string,
  weight?: number,       // default 5 for weighted random
  ...category-specific fields
}
```

---

## What This System Does NOT Do

- **Does not save.** No write to disk, no `localStorage`, no server sync. Save/load is `DataManager` (`core/data-manager.js`).
- **Does not back up.** Backups are `DataIntegration` (`core/data-integration.js`).
- **Does not create API keys.** That is `DataIntegration` (`core/data-integration.js`).
- **Does not manage active research progress.** That is `ResearchSystem` (`systems/Nation/research-system.js`).
- **Does not manage disease outbreaks.** That is `DiseaseSystem` (`systems/World/disease-system.js`).

This system is purely a **data loader and integration bridge**: it reads static data files and hands the parsed objects to the systems that own runtime state.
