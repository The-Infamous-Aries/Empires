# Events System

Central system managing ALL game-wide events and situations across Dominion Wars. It is the unified truth source for seven event/situation types, handles turn-based spawning via a complex weighted formula, manages the shared 5-slot system per nation, and applies all effects.

## Overview

| Property | Value |
|----------|-------|
| **Class:** | `EventsSystem` |
| **Globally available as:** | `window.EventsSystem` / `window.EventsSystemInstance` |
| **Constructor:** | `new EventsSystem()` |
| **File:** | `systems/events-system.js` (~2,063 lines) |
| **Export:** | `module.exports` (Node.js) / `window.EventsSystem` (browser) |

## Architecture

```
EventsSystem
├── economic-events.js         — world events (currencies, World Bank, indicators)
├── sports-events.js           — world events (stat boosts, traits, injuries)
├── disaster-events.js         — world events (infra/tech/population/military loss)
├── miracle-events.js          — world events (money, population, units, stats gain)
├── population-situations.js   — player-choice situations (3 choices each)
├── nation-situations.js       — player-choice situations (3 choices each)
└── military-situations.js     — player-choice situations (3 choices each)
```

## Instance Properties

### Data Stores

| Property | Type | Description |
|----------|------|-------------|
| `economicDefinitions` | `object` | Event definitions keyed by category |
| `economicDefinitionCount` | `number` | Total economic event definitions loaded |
| `sportsDefinitions` | `object` | Sports event definitions keyed by category |
| `sportsDefinitionCount` | `number` | Total sports event definitions loaded |
| `disasterDefinitions` | `object` | Disaster event definitions keyed by category |
| `disasterDefinitionCount` | `number` | Total disaster event definitions loaded |
| `miracleDefinitions` | `object` | Miracle event definitions keyed by category |
| `miracleDefinitionCount` | `number` | Total miracle event definitions loaded |
| `populationSituations` | `object` | Population situation definitions keyed by category |
| `populationSituationCount` | `number` | Total population situation definitions loaded |
| `nationSituations` | `object` | Nation situation definitions keyed by category |
| `nationSituationCount` | `number` | Total nation situation definitions loaded |
| `militarySituations` | `object` | Military situation definitions keyed by category |
| `militarySituationCount` | `number` | Total military situation definitions loaded |

### Active Instances (per type)

| Property | Type | Description |
|----------|------|-------------|
| `activeEconomicEvents` | `array` | Currently active economic event instances |
| `activeSportsEvents` | `array` | Currently active sports event instances |
| `activeDisasterEvents` | `array` | Currently active disaster event instances |
| `activeMiracleEvents` | `array` | Currently active miracle event instances |
| `activePopulationSituations` | `array` | Currently active population situation instances |
| `activeNationSituations` | `array` | Currently active nation situation instances |
| `activeMilitarySituations` | `array` | Currently active military situation instances |

### Slot & Turn Tracking

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `slotLimit` | `number` | `5` | Total slots across all non-economic types per nation |
| `nationCreationTurn` | `number` | `null` | Turn when the nation was created |
| `lastSpawnCheckTurn` | `number` | `null` | Last turn a spawn check was performed |
| `_instanceCounter` | `number` | `0` | Seed counter for unique instance IDs |

### Spawn Tuning

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `spawnChancePerDay` | `number` | `0.15` | Base chance (10–20%) to replace economic event each turn |
| `maxConcurrentEconomicEvents` | `number` | `1` | Exactly 1 economic event active at a time |
| `sportsSpawnChancePerDay` | `number` | `0.15` | Sports spawn chance modifier |
| `sportsMaxConcurrentEvents` | `number` | `3` | Max 3 sports events active |
| `disasterSpawnChancePerDay` | `number` | `0.10` | Disaster spawn chance modifier |
| `disasterMaxConcurrentEvents` | `number` | `2` | Max 2 disasters active |
| `miracleSpawnChancePerDay` | `number` | `0.10` | Miracle spawn chance modifier |
| `miracleMaxConcurrentEvents` | `number` | `2` | Max 2 miracles active |

### Modifier Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `baseChanceNation` | `number` | `0.29` | Base weight for nation situations |
| `baseChanceMilitary` | `number` | `0.29` | Base weight for military situations |
| `baseChancePopulation` | `number` | `0.29` | Base weight for population situations |
| `baseChanceMiracle` | `number` | `0.065` | Base weight for miracles |
| `baseChanceDisaster` | `number` | `0.065` | Base weight for disasters |
| `postTeamChanceNation` | `number` | `0.2275` | Nation weight after teams unlocked |
| `postTeamChanceMilitary` | `number` | `0.2275` | Military weight after teams unlocked |
| `postTeamChancePopulation` | `number` | `0.2275` | Population weight after teams unlocked |
| `postTeamChanceMiracle` | `number` | `0.045` | Miracle weight after teams unlocked |
| `postTeamChanceDisaster` | `number` | `0.045` | Disaster weight after teams unlocked |
| `warModifierMilitary` | `number` | `1.25` | Military weight multiplier when at war |
| `warModifierPopulation` | `number` | `0.85` | Population weight multiplier when at war |
| `peaceModifierPopulation` | `number` | `1.25` | Population weight multiplier at peace |
| `peaceModifierMilitary` | `number` | `0.85` | Military weight multiplier at peace |
| `badStabilityDisasterModifier` | `number` | `1.20` | Disaster weight multiplier when nation is unstable |
| `goodStabilityMiracleModifier` | `number` | `1.20` | Miracle weight multiplier when nation is stable |
| `sportsOffSeasonModifier` | `number` | `1.50` | Sports weight multiplier in off-season |
| `tournamentModifier` | `number` | `3.00` | Sports weight multiplier during tournament |
| `worldTournamentModifier` | `number` | `5.00` | Sports weight multiplier during world tournament |

## Initialization

```js
EventsSystemInstance.initialize();
```

Calls all seven definition loaders (`loadEconomicDefinitions`, `loadSportsDefinitions`, `loadDisasterDefinitions`, `loadMiracleDefinitions`, `loadPopulationSituations`, `loadNationSituations`, `loadMilitarySituations`), binds event listeners to `GameEvents.DAY_PASSED`, detects the nation creation turn, and guarantees at least one economic event is active on world start.

## Slot System (5 Shared Slots)

All non-economic events/situations consume one of 5 shared slots per nation. Economic events do **not** consume slots.

### Type-Specific Slot Limits

| Type | Max Active | Note |
|------|-----------|------|
| Disaster | 2 | Permanent record, no reversal |
| Miracle | 2 | Permanent record, no reversal |
| Nation | 3 | Player-choice situation |
| Population | 3 | Player-choice situation |
| Military | 3 | Player-choice situation |
| Sports | 3 | Permanent record, no reversal |

### Pending Situation Penalty

When a situation (population/nation/military) spawns, it is `status: 'pending'` and immediately applies a **-10 happiness penalty** to the nation. The penalty is removed instantly when the player makes a choice (situation resolved).

## Spawning

### Turn Timing

- **1 turn = 1 real hour**
- Spawn check happens on: **nation creation turn** AND **every 6 turns after**
- If no slots available at all, nothing spawns

### Spawn Formula

The system uses a complex weighted formula where each type's base chance is modified by modifiers:

```
selected type = weighted random from all eligible types
```

### Base Weights

| Condition | Nation | Military | Population | Miracle | Disaster | Sports |
|-----------|--------|----------|------------|---------|----------|--------|
| Teams NOT unlocked | 29% | 29% | 29% | 6.5% | 6.5% | 0% |
| Teams unlocked | 22.75% | 22.75% | 22.75% | 4.5% | 4.5% | 22.75% |

### Modifiers Applied

| Modifier | Condition | Effect |
|----------|-----------|--------|
| War | `nation.wars.length > 0` | Military × 1.25, Population × 0.85 |
| Peace | `nation.wars.length === 0` | Population × 1.25, Military × 0.85 |
| Bad Stability | High disease/crime/pollution, low happiness/environment | Disaster × 1.20+ |
| Good Stability | High happiness/environment, low disease/crime/pollution | Miracle × 1.20+ |
| Off-Season | Sports not in season | Sports × 1.50 |
| Tournament | `inTournament` true | Sports × 3.00 |
| World Tournament | `inWorldTournament` true | Sports × 5.00 |

### Base Spawn Chance

15% base, modified by:
- Unstable nation: + up to 5%
- World Tournament: + 10%
- Tournament: + 5%
- **Clamped between 10% and 30%**

If the spawn roll exceeds the chance, nothing spawns this turn.

## Event/Situation Type Reference

### Economic Events (world events, always active)

- **Always exactly 1 active at a time**
- No player choice
- Affects currencies (`aurel`, `velt`, `krona`, `drachma`, `sovereign`, `talon`), World Bank loan rate, and economy indicators (`gdpGrowthRate`, `inflationRate`, `unemploymentRate`, `interestRate`, `exchangeRate`, `economicIndex`)
- Currency type and value are **randomized at each spawn** (random currency type, value within ±50% of definition)
- Effects apply **each turn tick** while active
- 15% chance per turn to replace with a new random event

### Sports Events (world events, permanent)

- **Max 3 active at a time**
- No player choice
- Applied to a random team of the matching sport on the player's nation
- Effects: stat boosts, XP, traits, morale, injuries, fan gains/losses, upgrade cost changes, fan volunteer player
- Permanent — no reversal, effects persist on team/player objects

### Disaster Events (world events, permanent record)

- **Max 2 active at a time**
- No player choice
- Effects: infrastructure destroyed, tech destroyed, population killed (chance → demographic → kill roll), military destroyed (only at war), disease/pollution/crime added, environment reduced
- Happiness penalty **only if deaths occurred**
- War-only disasters require `nation.wars.length > 0`

### Miracle Events (world events, permanent record)

- **Max 2 active at a time**
- No player choice
- **Only positive outcomes**
- Special types:
  - **World Bank Error**: 2–30× of turn revenue after upkeep/taxes/loan repayment
  - **Immigration Boom**: 1/10–3/4 of whole population from 3 random demographics
  - **Wealthy Benefactor**: tanks/aircraft/ships = 1/10–3/4 of what they **lack** (max capacity − current); missiles/nukes = random 1–20
- Standard types grant happiness, crime reduction, pollution reduction, environment bonus, disease reduction, taxable income bonus, land, infra, population, tech, military morale, direct money, debt forgiveness

### Population Situations (player-choice, 3 options)

- **Max 3 active at a time**
- Player must select one of 3 choices
- Effects: population, demographics (youngAdult/working/senior), happiness, disease, crime, pollution, environment, literacy, money (% of holdings scaled by amount magnitude), temporary cost multipliers
- Categories: health, crime, demographics, economic, infrastructure

### Nation Situations (player-choice, 3 options)

- **Max 3 active at a time**
- Player must select one of 3 choices
- Effects: literacy, pollution, environment, infra_cost, land_cost, tech_cost, infra_upkeep, money
- Categories: environment & pollution, literacy & education, infrastructure costs, land costs, technology costs, energy & utilities, transportation & logistics, housing & real estate, industry & manufacturing, foreign trade & diplomacy

### Military Situations (player-choice, 3 options)

- **Max 3 active at a time**
- Player must select one of 3 choices
- Filtered by `war_peace`: peace situations spawn when NOT at war; war situations spawn when at war
- Peace effects: unit upkeep/cost multipliers, military morale
- War effects: unit combat efficiency (`soldier_eff`, `tank_eff`, `aircraft_eff`, `ship_eff`), strategic damage (`missile_infra_damage`, `nuke_infra_damage`), spy ops success chance
- Categories: recruitment & training, armor & mechanized, air force, navy & maritime, intelligence & espionage, strategic weapons, ground combat, air operations, naval operations, intelligence operations, strategic strikes, logistics & supply

## Methods

### Spawning & Application

| Method | Description |
|--------|-------------|
| `initialize()` | Load all definitions, bind events, spawn first economic event |
| `handleSituationTurnCheck(data)` | Turn-based spawn check (called on DAY_PASSED) |
| `handleEconomicDayPassed(data)` | Economic event per-turn tick + replacement roll |
| `spawnByType(type, nation)` | Spawn event/situation by type string |
| `spawnNationSituation(nation)` / `spawnPopulationSituation(nation)` / `spawnMilitarySituation(nation)` | Spawn specific situation type |
| `spawnSportsEventInternal()` / `spawnDisasterEventInternal()` / `spawnMiracleEventInternal()` | Spawn specific world event type |
| `spawnEconomicEvent(definition)` | Spawn random economic event |
| `applySituationChoiceEffects(effects, type, nation)` | Apply resolved situation choice effects to nation |
| `resolveSituation(instance, choiceIndex)` | Resolve a pending situation (player choice) |

### Slot & Query Methods

| Method | Description |
|--------|-------------|
| `getActiveSlotCount()` | Total slots consumed across all non-economic types |
| `getTypeActiveCount(type)` | Count of active events/situations of a given type |
| `getTypeSlotLimit(type)` | Max allowed active count for a given type |
| `hasSlotAvailable(type)` | Whether a slot is available for a given type |
| `getActiveEventsByType(type)` | Get all active events/situations of a type |
| `getPendingSituations()` | Get all situations awaiting player choice |
| `getSlotsUsed()` / `getSlotsRemaining()` | Slot usage queries |

### Capacity & Calculation

| Method | Description |
|--------|-------------|
| `getMaxMilitaryUnitCapacity(unitType, nation)` | Max units of a type (mirrors server limits) |
| `calculateNationStability(nation)` | 0–1 stability score from happiness/disease/crime/pollution/environment |
| `getSportsContext(nation)` | Sports season/tournament state |
| `calculateSpawnWeights(atWar, teamsUnlocked, stability, sportsContext)` | Build weighted type pool |
| `calculateBaseSpawnChance(teamsUnlocked, stability, sportsContext)` | Base spawn chance (10–30%) |

### Definition Lookups

| Method | Description |
|--------|-------------|
| `getEconomicDefinition(id)` / `getSportsDefinition(id)` / `getDisasterDefinition(id)` / `getMiracleDefinition(id)` / `getNationSituationDefinition(id)` / `getPopulationSituationDefinition(id)` / `getMilitarySituationDefinition(id)` | Look up definition by ID |

### State Management

| Method | Description |
|--------|-------------|
| `getState()` | Full serializable state of all active events/situations |
| `setState(state)` | Restore state from saved game |
| `destroy()` | Reverse economic events, clear all active lists, unbind handlers |

## Event Data Format

Events are defined in `assets/data/events/*.js` files. Each event has:

```js
{
    id: 'unique_id',
    name: 'Display Name',
    description: 'Description with {nation} placeholder',
    effectType: 'economic' | 'sports' | 'disaster' | 'miracle' | 'population' | 'nation' | 'military',
    category: 'category_name',
    religion: null | 'religion_key',  // religious events only
    warOnly: true | false,              // war-only events only
    miracleType: 'worldBankError' | 'immigrationBoom' | 'wealthyBenefactor' | null, // miracles only
    effects: { ... }                    // type-specific effect keys
}
```

### Common Placeholders

- `{nation}` — Nation name
- `{team}` — Team name (sports)
- `{player}` — Player name (sports)
- `{sport}` — Sport name (sports)
- `{injury}` — Injury name (sports)
- `{amount}` — Numeric amount
- `{unitType}` — Military unit type
- `{demographic}` — Demographic group name

## Persistence

All active events/situations are persisted via `getState()` and restored via `setState()`. Permanent effects (economic, sports, disaster, miracle) are **not** re-applied on load — only metadata is restored, since effects are already persisted on nation/team/player objects. Pending situations re-apply their -10 happiness penalty on load.

## Events Emitted

| Event | Payload | Description |
|-------|---------|-------------|
| `economic_event_started` | `{ event, definition }` | Economic event spawned |
| `economic_event_ended` | `{ event, definition }` | Economic event ended |
| `sports_event_started` | `{ event, definition }` | Sports event spawned |
| `disaster_event_started` | `{ event, definition }` | Disaster event spawned |
| `miracle_event_started` | `{ event, definition }` | Miracle event spawned |
| `situation_spawned` | `{ event, definition, type }` | Situation spawned (pending) |
| `situation_resolved` | `{ event, definition, choiceIndex, choice }` | Situation resolved by player |
