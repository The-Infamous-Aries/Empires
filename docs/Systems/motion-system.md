# Motion System

Single source of truth for all motion effects in Dominion Wars. The World Forum delegates motion implementation here. Supports premade motions (fixed boost+penalty), custom motions (Congress picks one boost + one penalty), neutral motions (no boost/penalty), and sanctions (World Forum only; block attack/aid/diplomacy/color interaction).

## Overview

- **Class:** `MotionSystem`
- **Globally available as:** `window.motionSystem`
- **Constructor:** `new MotionSystem()`
- **File:** `systems/motion-system.js` (~1,970 lines)
- **Export:** `module.exports` (Node.js) / `window.motionSystem` (browser)
- **Related system:** `systems/world-forum-system.js` (proposes/votes on motions, delegates implementation here)

## Architecture

```
MotionSystem
├── motionProcessors (Map)          — registered motion processor classes
├── activeEffects (Map)             — motionId -> active effect (duration-tracked)
├── activeSanctions (Map)           — sanctionId -> sanction data
└── sanctionedTargets (Map)         — targetKey -> Set of sanctionIds
```

### Processors

| Processor | Motion Type | Registered As |
|-----------|-------------|---------------|
| `MilitaryAllianceProcessor` | `MILITARY_ALLIANCE` | Line 867 |
| `TerritoryDisputeProcessor` | `TERRITORY_DISPUTE` | Line 868 |
| `FactionSanctionProcessor` | `FACTION_SANCTION` | Line 869 |
| `ResearchSharingProcessor` | `RESEARCH_SHARING` | Line 870 |
| `WorldTaxProcessor` | `WORLD_TAX` | Line 871 |

## Initialization

```js
const motionSystem = new MotionSystem();
```

The constructor calls `initialize()` which:
1. Calls `registerDefaultProcessors()` — registers all 5 default processors
2. Calls `bindEvents()` — binds `handleDailyEffects` to `GameEvents.DAY_PASSED` (guarded against undefined `EventBus`/`GameEvents`)

### destroy()

Cleans up listeners and all maps:
- Unbinds `handleDailyEffects` from `GameEvents.DAY_PASSED`
- Clears `activeEffects`, `activeSanctions`, `sanctionedTargets`, `motionProcessors`
- Sets `isInitialized = false`

Never crashes if `EventBus` or `GameEvents` are undefined.

---

## Boost / Penalty Catalogs (Custom Motions)

Congress can propose custom motions by picking exactly **one boost** and **one penalty**. Every non-sanction motion must have both to prevent overpowered boosts.

### Boost Catalog

| Boost ID | Label | Category | Min | Max | Default | Event |
|----------|-------|----------|-----|-----|---------|-------|
| `money_generation` | Currency Generation | economy | 5 | 50 | 15 | `motion_boost_money_generation` |
| `xp_gain` | Experience Gain | progression | 5 | 40 | 20 | `motion_boost_xp_gain` |
| `energy_regeneration` | Energy Regeneration | progression | 5 | 40 | 15 | `motion_boost_energy_regeneration` |
| `military_effectiveness` | Military Effectiveness | military | 5 | 35 | 12 | `motion_boost_military_effectiveness` |
| `defense` | Defense | military | 5 | 35 | 12 | `motion_boost_defense` |
| `research_points` | Research Points | technology | 5 | 35 | 18 | `motion_boost_research_points` |
| `building_cost_reduction` | Building Cost Reduction | infrastructure | 5 | 30 | 15 | `motion_boost_building_cost_reduction` |
| `happiness` | Happiness | social | 5 | 25 | 10 | `motion_boost_happiness` |
| `population_growth` | Population Growth | social | 5 | 25 | 10 | `motion_boost_population_growth` |
| `diplomacy_standing` | Diplomacy Standing | diplomacy | 5 | 25 | 10 | `motion_boost_diplomacy_standing` |
| `sports_betting` | Sports Betting Revenue | economy | 5 | 50 | 33 | `motion_boost_sports_betting` |
| `athlete_development` | Athlete Development | progression | 5 | 40 | 20 | `motion_boost_athlete_development` |
| `fan_engagement` | Fan Engagement | social | 5 | 30 | 15 | `motion_boost_fan_engagement` |
| `stadium_revenue` | Stadium Revenue | economy | 5 | 35 | 15 | `motion_boost_stadium_revenue` |

### Penalty Catalog

| Penalty ID | Label | Category | Min | Max | Default | Event |
|------------|-------|----------|-----|-----|---------|-------|
| `money_generation` | Reduced Currency Generation (Inflation) | economy | 5 | 50 | 15 | `motion_penalty_money_generation` |
| `xp_gain` | Reduced Experience Gain | progression | 5 | 40 | 20 | `motion_penalty_xp_gain` |
| `energy_cost` | Increased Energy Cost | progression | 5 | 40 | 15 | `motion_penalty_energy_cost` |
| `military_upkeep` | Increased Military Upkeep | military | 5 | 35 | 12 | `motion_penalty_military_upkeep` |
| `defense_weakness` | Reduced Defense | military | 5 | 35 | 12 | `motion_penalty_defense_weakness` |
| `research_points` | Reduced Research Points | technology | 5 | 35 | 18 | `motion_penalty_research_points` |
| `building_cost_increase` | Increased Building Cost | infrastructure | 5 | 30 | 15 | `motion_penalty_building_cost_increase` |
| `happiness_penalty` | Reduced Happiness | social | 5 | 25 | 10 | `motion_penalty_happiness_penalty` |
| `population_penalty` | Reduced Population Growth | social | 5 | 25 | 10 | `motion_penalty_population_penalty` |
| `diplomacy_penalty` | Reduced Diplomacy Standing | diplomacy | 5 | 25 | 10 | `motion_penalty_diplomacy_penalty` |
| `sports_crime` | Increased Sports Crime | social | 5 | 25 | 10 | `motion_penalty_sports_crime` |
| `training_cost` | Increased Training Cost | progression | 5 | 30 | 15 | `motion_penalty_training_cost` |
| `roster_instability` | Roster Instability | social | 5 | 25 | 10 | `motion_penalty_roster_instability` |
| `active_season_reduction` | Shorter Active Season | progression | 5 | 30 | 14 | `motion_penalty_active_season_reduction` |

### Validation Rules

`validateBoostPenalty(boostId, boostValue, penaltyId, penaltyValue)` enforces:

1. **Boost value must equal penalty value** (perfect balance). Example: boost 20 → penalty must be 20.
2. **Boost and penalty cannot be the same category (ID)**. Example: cannot boost `money_generation` and penalize `money_generation`.
3. Each value must be within its catalog's `min`/`max` range.

Returns: `{ valid, boost, penalty, errors }`.

### Name & Description Generation

- `generateMotionName(boostId, penaltyId, scope)` → e.g. `"Currency Generation with Inflation Act"`
- `generateMotionDescription(boostId, penaltyId, boostValue, penaltyValue, duration, scope)` → full flavor text

---

## Premade Motion Templates (51 total)

Congress can propose premade motions directly without selecting boost/penalty. Each has `fixedEffects` already defined.

### Color Bloc Motions (scope: `color`, requires Broadcasting Network project)

| Motion | Description | Min Support | Fixed Effects | Duration |
|--------|-------------|-------------|---------------|----------|
| `COLOR_EXPERIENCE_SURGE` | Boost XP gain with energy cost increase | 0.45 | `xpBoost: 20`, `energyCostIncrease: 25` | configurable |
| `COLOR_ENERGY_REGENERATION` | Increase energy regeneration with happiness penalty | 0.4 | `energyBoost: 15`, `happinessPenalty: 10` | configurable |
| `COLOR_MILITARY_TRAINING` | Enhanced military effectiveness with upkeep increase | 0.55 | `militaryBoost: 12`, `militaryUpkeepIncrease: 20` | configurable |
| `COLOR_TECH_SHARING` | Accelerated research points | 0.6 | `researchPointsBoost: 18` | configurable |
| `COLOR_INFRASTRUCTURE_PUSH` | Building cost reduction with population growth penalty | 0.5 | `buildingCostReduction: 20`, `populationGrowthPenalty: 15` | configurable |
| `COLOR_DEFENSIVE_PACT` | Enhanced defensive bonuses | 0.65 | `defensiveBonus: 25` | configurable |
| `COLOR_ECONOMIC_STIMULUS` | Currency generation boost with inflation effects | 0.55 | `moneyBoost: 25`, `inflationRate: 5` | configurable |
| `COLOR_HAPPINESS_CAMPAIGN` | Happiness increase with productivity penalty | 0.4 | `happinessBoost: 15`, `productivityPenalty: 8` | configurable |

### World Motions (scope: `world`, requires Internet wonder)

| Motion | Description | Min Support | Fixed Effects | Duration |
|--------|-------------|-------------|---------------|----------|
| `WORLD_CALENDAR_CHANGE` | Alter world calendar/time progression | 0.65 | `calendarChange: true` | permanent (`null`) |
| `WORLD_NAME_CHANGE` | Change official world name | 0.6 | `worldRename: true` | permanent (`null`) |
| `WORLD_MILITARY_LIMITATION` | Limit max military unit counts globally | 0.75 | `unitLimits: {tanks:100, aircraft:50, ships:25}` | configurable |
| `WORLD_TECHNOLOGY_SHARING` | Force sharing of research points above thresholds | 0.8 | `techThreshold: 1000`, `sharingRate: 0.1` | configurable |
| `WORLD_ENVIRONMENTAL_PROTECTION` | Limit pollution with production penalties | 0.65 | `pollutionLimits: 'moderate'`, `productionPenalty: 10` | configurable |
| `WORLD_PEACE_TREATY` | Temporary ban on all military conflicts | 0.85 | `peaceEnforcement: true` | configurable |

### Sanctions (World Forum only; block attack/aid/diplomacy/color)

| Motion | Description | Min Support | Fixed Effects | Duration |
|--------|-------------|-------------|---------------|----------|
| `FACTION_SANCTION` | Impose sanctions on a faction for violations | 0.65 | `sanctionType: 'economic'`, `severity: 'moderate'` | configurable (default 30 days) |

Sanctions block: `attack`, `aid`, `diplomacy`, `color_interaction`.

### Legacy Processor Motions

| Motion | Description | Min Support | Fixed Effects | Duration |
|--------|-------------|-------------|---------------|----------|
| `MILITARY_ALLIANCE` | Form defensive pact between factions | 0.7 | `allianceFactions: []` | permanent (`null`) |
| `TERRITORY_DISPUTE` | Resolve a territory dispute | 0.6 | `territoryResolution: true` | configurable |
| `RESEARCH_SHARING` | Share research points between factions | 0.6 | `researchSharing: true`, `bonus: 0.2` | configurable |
| `WORLD_TAX` | Implement global tax rate for world projects | 0.7 | `worldTaxRate: 0.05`, `purpose: 'infrastructure'` | configurable |

### Heavy Missile Objective

| Motion | Description | Min Support | Fixed Effects | Duration |
|--------|-------------|-------------|---------------|----------|
| `HEAVY_MISSILE_OBJECTIVE` | Increase infra destroyed by missiles by 15% | 0.6 | `missileInfraDamageBoost: 15` | configurable |

Mutually exclusive with: `ANTI_NUCLEAR_LAUNCH_BAN`, `ANTI_MISSILE_LAUNCH_BAN`.

### Government & Religion Amnesties (mutually exclusive)

| Motion | Description | Min Support | Fixed Effects | Duration |
|--------|-------------|-------------|---------------|----------|
| `GOVERNMENT_CHANGE_AMNESTY` | Gov cooldown 14→7 days; religion cooldown 14→28 days | 0.6 | `governmentCooldownDays: 7`, `religionCooldownDays: 28` | configurable |
| `RELIGION_CHANGE_AMNESTY` | Religion cooldown 14→7 days; gov cooldown 14→28 days | 0.6 | `governmentCooldownDays: 28`, `religionCooldownDays: 7` | configurable |

Mutually exclusive with each other. **Minimum 30 days active before cancellation.**

### Military Supremacy Acts (max 2 active at a time)

| Motion | Description | Min Support | Fixed Effects | Duration |
|--------|-------------|-------------|---------------|----------|
| `SOLDIER_SUPREMACY` | Soldiers +30%, tanks/aircraft/ships -10% each | 0.6 | `soldierEffectivenessBoost: 30`, `tank/aircraft/shipEffectivenessPenalty: 10` | configurable |
| `TANK_SUPREMACY` | Tanks +30%, soldiers/aircraft/ships -10% each | 0.6 | `tankEffectivenessBoost: 30`, `soldier/aircraft/shipEffectivenessPenalty: 10` | configurable |
| `AIRCRAFT_SUPREMACY` | Aircraft +30%, soldiers/tanks/ships -10% each | 0.6 | `aircraftEffectivenessBoost: 30`, `soldier/tank/shipEffectivenessPenalty: 10` | configurable |
| `SHIP_SUPREMACY` | Ships +30%, soldiers/tanks/aircraft -10% each | 0.6 | `shipEffectivenessBoost: 30`, `soldier/tank/aircraftEffectivenessPenalty: 10` | configurable |

Mutually exclusive with each other. Maximum 2 active at once.

### Health & Environment Motions (Color and World)

| Motion | Scope | Description | Min Support | Fixed Effects | Duration |
|--------|-------|-------------|-------------|---------------|----------|
| `ADVANCED_GLOBAL_HEALTHCARE` | world | Happiness +15, disease rate & spawn -10, taxable income -10% | 0.65 | `happinessBoost: 15`, `diseaseRateReduction: 10`, `diseaseSpawnReduction: 10`, `taxableIncomePenalty: 10` | configurable |
| `COLOR_ADVANCED_HEALTHCARE` | color | Same as above for faction members | 0.55 | same | configurable |
| `GREEN_GOALS` | world | Environment +10, pollution -30%, taxable income -10% | 0.65 | `environmentBoost: 10`, `pollutionReduction: 30`, `taxableIncomePenalty: 10` | configurable |
| `COLOR_GREEN_GOALS` | color | Same as above for faction members | 0.55 | same | configurable |

### Population & Building Motions (Color and World)

| Motion | Scope | Description | Min Support | Fixed Effects | Duration |
|--------|-------|-------------|-------------|---------------|----------|
| `CHILD_LABOR` | world | Children work & taxed at full rate; happiness -50 | 0.55 | `childLaborEnabled: true`, `happinessPenalty: 50` | permanent (`null`) |
| `COLOR_CHILD_LABOR` | color | Same for faction members | 0.5 | same | permanent (`null`) |
| `NEW_BUILD_OBJECTIVE` | world | Land/infra purchase -15%, upkeep +10% | 0.6 | `landPurchaseDiscount: 15`, `infraPurchaseDiscount: 15`, `landUpkeepIncrease: 10`, `infraUpkeepIncrease: 10` | configurable |
| `COLOR_NEW_BUILD_OBJECTIVE` | color | Same for faction members | 0.55 | same | configurable |
| `RESTORATION_ACT` | world | Land/infra upkeep -15%, purchase +10% | 0.6 | `landUpkeepDiscount: 15`, `infraUpkeepDiscount: 15`, `landPurchaseIncrease: 10`, `infraPurchaseIncrease: 10` | configurable |
| `COLOR_RESTORATION_ACT` | color | Same for faction members | 0.55 | same | configurable |

### World Forum Motions

| Motion | Description | Min Support | Fixed Effects | Duration |
|--------|-------------|-------------|---------------|----------|
| `FREE_SPEECH_PROTECTION` | Disable forum moderation; free speech protected | 0.6 | `forumModerationDisabled: true`, `freeSpeechProtected: true` | configurable |
| `CONGRESSIONAL_TERM_LIMITS` | Limit motions per faction per day | 0.55 | `maxMotionsPerFactionPerDay: 3` | configurable |
| `VETO_POWER_ROTATION` | Rotate veto power among color factions weekly | 0.65 | `vetoRotationEnabled: true` | configurable |
| `EMERGENCY_POWERS` | Congress bypasses world vote | 0.75 | `emergencyPowersEnabled: true`, `bypassWorldVote: true` | configurable |
| `MOTION_COST_INCREASE` | Raise money cost to propose motions | 0.5 | `motionProposalCostMultiplier: 2` | configurable |
| `SUPERMAJORITY_REQUIREMENT` | Change sanction vote threshold to 66% | 0.6 | `sanctionVoteThreshold: 0.66` | configurable |
| `MOTION_RENAME` | Allow renaming of any passed motion | 0.55 | `motionRenameAllowed: true` | configurable |

### Sports Motions

| Motion | Description | Min Support | Fixed Effects | Duration |
|--------|-------------|-------------|---------------|----------|
| `SPORTS_XP_GAIN_BOOST` | +25% player XP gain, -15% fans gained | 0.6 | `xpGainBoost: 25`, `fansGainedPenalty: 15` | configurable |
| `SPORTS_FANS_GAIN_BOOST` | +25% fans gained, -15% player XP gain | 0.6 | `fansGainedBoost: 25`, `xpGainPenalty: 15` | configurable |
| `SPORTS_UPGRADE_SUBSIDY` | -20% stadium upgrade costs, -15% game revenue | 0.6 | `upgradeCostReduction: 20`, `gameRevenuePenalty: 15` | configurable |
| `SEASON_LENGTH_ALTERATION` | Allow altering sports season lengths (neutral) | 0.65 | `seasonLengthChangeAllowed: true` | permanent (`null`) |

---

## Motion Lifecycle

### 1. Proposal (World Forum System)

World Forum (`systems/world-forum-system.js`) handles proposal, voting, and tracking. Motion data passed to Motion System includes:

```js
{
  id: string,
  type: string,           // motion template key
  proposer: string,
  proposerFaction: string,
  scope: 'color' | 'world',
  targets: string[],      // target faction/nation keys
  parameters: {           // motion-specific parameters
    duration: string,     // e.g. '30 days', '1 year', 'Until Canceled'
    sanctionType: string,
    severity: string,
    motionId: string,     // for MOTION_RENAME
    newName: string,      // for MOTION_RENAME
    ...                   // other template-specific params
  },
  boost: { id: string, value: number },   // custom motions only
  penalty: { id: string, value: number }  // custom motions only
}
```

### 2. Implementation (`applyMotion`)

Called by World Forum after a motion passes. Routes to the correct handler:

| Motion Path | Handler |
|-------------|---------|
| `isSanctionMotion(type)` | `applySanction()` + track in `activeEffects` |
| `template?.neutral` | Neutral event + track in `activeEffects` |
| `motion.boost && motion.penalty` | `applyCustomBoostPenaltyMotion()` |
| `motionProcessors.get(type)` | Processor `.process()` → `addActiveEffect()` |
| `template?.fixedEffects` | `addActiveEffect()` + `emitPremadeMotionEvents()` |

### 3. Duration

Proposers select duration via `motion.parameters.duration`. Supported values:

| Value | Days | Behavior |
|-------|------|----------|
| `30 days` | 30 | Expires after 30 days |
| `60 days` | 60 | Expires after 60 days |
| `90 days` | 90 | Expires after 90 days |
| `1 year` | 365 | Expires after 1 year |
| `Until Canceled` / `Permanent` | `null` | Never expires |

Default: `30 days` if not specified.

### 4. Expiration (`handleDailyEffects`)

Bound to `GameEvents.DAY_PASSED`. Each day:
- Calls `effect.onDaily()` if defined (wrapped in try/catch)
- Checks `effect.duration` against elapsed time; expires and removes if elapsed

### 5. Revocation (`revokeMotion`)

```js
motionSystem.revokeMotion(motionId, cancelSupport)
```

Rules:
- **Not found:** returns `{ allowed: false, reason: 'Motion not found' }`
- **Sanction:** delegates to `removeSanction()`
- **Amnesty:** must be active at least `minActiveDays` (30 days) before cancel
- **Vote threshold:** `cancelSupport` must be >= `originalMinSupport` (the template's `minSupport` at proposal time)
- **Success:** removes effect, emits `motion_revoked`

---

## Sanction System

Sanctions are World Forum motions that block specific actions on a target.

### `applySanction(sanctionId, targetKey, targetType, sanctionType, severity, durationDays, blockedActions, imposedBy)`

Creates a sanction entry indexed by target for fast lookup.

### `isTargetSanctioned(targetKey, action)`

Returns `{ isSanctioned: boolean, sanctions: [] }`. Checks expiry and action match.

### `canPerformAction(actorKey, targetKey, action)`

Returns `{ allowed: boolean, reason: string|null, sanctions: [] }`. Used by war/diplomacy/aid systems to block sanctioned actions.

**Blocked actions:** `attack`, `aid`, `diplomacy`, `color_interaction`

---

## Event Emissions

All motions emit events that other systems listen to:

| Event | Motion(s) | Data |
|-------|-----------|------|
| `motion_effect_applied` | all | `{ motionId, effect }` |
| `motion_effect_removed` | all | `{ motionId }` |
| `motion_revoked` | revoked motions | `{ motionId, type }` |
| `sanction_applied` | FACTION_SANCTION | `{ sanctionId, targetKey, targetType, sanctionType, severity, blockedActions, durationDays, imposedBy }` |
| `sanction_removed` | revoked sanctions | `{ sanctionId, targetKey, targetType }` |
| `color_experience_surge_applied` | COLOR_EXPERIENCE_SURGE | `{ factionKey, xpBoost, energyCostIncrease }` |
| `color_energy_regeneration_applied` | COLOR_ENERGY_REGENERATION | `{ factionKey, energyBoost, happinessPenalty }` |
| `color_military_training_applied` | COLOR_MILITARY_TRAINING | `{ factionKey, militaryBoost, militaryUpkeepIncrease }` |
| `color_tech_sharing_applied` | COLOR_TECH_SHARING | `{ factionKey, researchPointsBoost }` |
| `color_infrastructure_push_applied` | COLOR_INFRASTRUCTURE_PUSH | `{ factionKey, buildingCostReduction, populationGrowthPenalty }` |
| `color_defensive_pact_applied` | COLOR_DEFENSIVE_PACT | `{ factionKey, defensiveBonus }` |
| `color_economic_stimulus_applied` | COLOR_ECONOMIC_STIMULUS | `{ factionKey, moneyBoost, inflationRate }` |
| `color_happiness_campaign_applied` | COLOR_HAPPINESS_CAMPAIGN | `{ factionKey, happinessBoost, productivityPenalty }` |
| `world_calendar_changed` | WORLD_CALENDAR_CHANGE | `{ newSettings, fullCalendar }` |
| `world_name_changed` | WORLD_NAME_CHANGE | `{ newName }` |
| `world_military_limitation_applied` | WORLD_MILITARY_LIMITATION | `{ unitLimits }` |
| `world_technology_sharing_applied` | WORLD_TECHNOLOGY_SHARING | `{ techThreshold, sharingRate }` |
| `world_environmental_protection_applied` | WORLD_ENVIRONMENTAL_PROTECTION | `{ pollutionLimits, productionPenalty }` |
| `world_peace_treaty_applied` | WORLD_PEACE_TREATY | `{ peaceEnforcement: true }` |
| `anti_nuclear_mandate_applied` | ANTI_NUCLEAR_MANDATE | `{ nuclearProductionBan, nuclearLaunchBan }` |
| `anti_nuclear_launch_ban_applied` | ANTI_NUCLEAR_LAUNCH_BAN | `{ nuclearProductionBan, nuclearLaunchBan }` |
| `anti_missile_mandate_applied` | ANTI_MISSILE_MANDATE | `{ missileProductionBan, missileLaunchBan }` |
| `anti_missile_launch_ban_applied` | ANTI_MISSILE_LAUNCH_BAN | `{ missileProductionBan, missileLaunchBan }` |
| `heavy_missile_objective_applied` | HEAVY_MISSILE_OBJECTIVE | `{ missileInfraDamageBoost }` |
| `soldier_supremacy_applied` | SOLDIER_SUPREMACY | `{ soldierEffectivenessBoost, tank/aircraft/shipEffectivenessPenalty }` |
| `tank_supremacy_applied` | TANK_SUPREMACY | `{ tankEffectivenessBoost, soldier/aircraft/shipEffectivenessPenalty }` |
| `aircraft_supremacy_applied` | AIRCRAFT_SUPREMACY | `{ aircraftEffectivenessBoost, soldier/tank/shipEffectivenessPenalty }` |
| `ship_supremacy_applied` | SHIP_SUPREMACY | `{ shipEffectivenessBoost, soldier/tank/aircraftEffectivenessPenalty }` |
| `advanced_global_healthcare_applied` | ADVANCED_GLOBAL_HEALTHCARE | `{ happinessBoost, diseaseRateReduction, diseaseSpawnReduction, taxableIncomePenalty }` |
| `color_advanced_healthcare_applied` | COLOR_ADVANCED_HEALTHCARE | `{ factionKey, happinessBoost, diseaseRateReduction, diseaseSpawnReduction, taxableIncomePenalty }` |
| `green_goals_applied` | GREEN_GOALS | `{ environmentBoost, pollutionReduction, taxableIncomePenalty }` |
| `color_green_goals_applied` | COLOR_GREEN_GOALS | `{ factionKey, environmentBoost, pollutionReduction, taxableIncomePenalty }` |
| `child_labor_applied` | CHILD_LABOR | `{ childLaborEnabled, happinessPenalty }` |
| `color_child_labor_applied` | COLOR_CHILD_LABOR | `{ factionKey, childLaborEnabled, happinessPenalty }` |
| `new_build_objective_applied` | NEW_BUILD_OBJECTIVE | `{ landPurchaseDiscount, infraPurchaseDiscount, landUpkeepIncrease, infraUpkeepIncrease }` |
| `color_new_build_objective_applied` | COLOR_NEW_BUILD_OBJECTIVE | `{ factionKey, ... }` |
| `restoration_act_applied` | RESTORATION_ACT | `{ landUpkeepDiscount, infraUpkeepDiscount, landPurchaseIncrease, infraPurchaseIncrease }` |
| `color_restoration_act_applied` | COLOR_RESTORATION_ACT | `{ factionKey, ... }` |
| `free_speech_protection_applied` | FREE_SPEECH_PROTECTION | `{ forumModerationDisabled, freeSpeechProtected }` |
| `congressional_term_limits_applied` | CONGRESSIONAL_TERM_LIMITS | `{ maxMotionsPerFactionPerDay }` |
| `veto_power_rotation_applied` | VETO_POWER_ROTATION | `{ vetoRotationEnabled }` |
| `emergency_powers_applied` | EMERGENCY_POWERS | `{ emergencyPowersEnabled, bypassWorldVote }` |
| `motion_cost_increase_applied` | MOTION_COST_INCREASE | `{ motionProposalCostMultiplier }` |
| `supermajority_requirement_applied` | SUPERMAJORITY_REQUIREMENT | `{ sanctionVoteThreshold }` |
| `motion_rename_applied` | MOTION_RENAME | `{ motionRenameAllowed, targetMotionId, newName }` |
| `sports_xp_gain_boost_applied` | SPORTS_XP_GAIN_BOOST | `{ xpGainBoost, fansGainedPenalty }` |
| `sports_fans_gain_boost_applied` | SPORTS_FANS_GAIN_BOOST | `{ fansGainedBoost, xpGainPenalty }` |
| `sports_upgrade_subsidy_applied` | SPORTS_UPGRADE_SUBSIDY | `{ upgradeCostReduction, gameRevenuePenalty }` |
| `season_length_alteration_applied` | SEASON_LENGTH_ALTERATION | `{ seasonLengthChangeAllowed }` |
| `military_alliance_formed` | MILITARY_ALLIANCE | `{ factions, duration }` |
| `territory_dispute_resolved` | TERRITORY_DISPUTE | `{ resolution }` |
| `research_sharing_applied` | RESEARCH_SHARING | `{ factions, bonus }` |
| `world_tax_collected` | WORLD_TAX | `{ rate, purpose }` |
| `faction_sanction_applied` | FACTION_SANCTION | `{ sanctionType, severity, sanctionBlocks }` |
| `government_change_amnesty_applied` | GOVERNMENT_CHANGE_AMNESTY | `{ governmentCooldownDays, religionCooldownDays }` |
| `religion_change_amnesty_applied` | RELIGION_CHANGE_AMNESTY | `{ governmentCooldownDays, religionCooldownDays }` |

### Custom Motion Events

Custom motions emit two catalog events:

| Event | Motion | Data |
|-------|--------|------|
| `motion_boost_<id>` | custom | `{ scope, targets, boostId, boostValue, duration }` |
| `motion_penalty_<id>` | custom | `{ scope, targets, penaltyId, penaltyValue, duration }` |

---

## Safety & Error Handling

- **`emit()` helper:** Guards all `EventBus.emit()` calls; never crashes if `EventBus` is undefined
- **`bindEvents()` guard:** Returns early if `EventBus` or `GameEvents` is undefined
- **`destroy()` guard:** No broken `EventBus.off` references
- **Processor try/catch:** `processor.process()` wrapped in try/catch
- **`onDaily` try/catch:** Daily effect processing wrapped in try/catch so one failing effect doesn't block others
- **`onRemove` try/catch:** Effect removal wrapped in try/catch
- **No double-processing:** `handleMotionImplemented` removed; `applyMotion` is the single entry point called directly by World Forum

---

## What Was Removed (No Longer in Game)

Resources and resource trading have been removed. The following motions/templates do **not** exist:

- `COLOR_RESOURCE_BOOST`, `COLOR_TRADE_NETWORK`, `COLOR_ECONOMIC_STIMULUS`
- `WORLD_TRADE_REGULATION`, `WORLD_RESOURCE_EMBARGO`, `TRADE_EMBARGO`
- `WORLD_NUCLEAR_BAN` (covered by separate `ANTI_NUCLEAR_MANDATE` + `ANTI_NUCLEAR_LAUNCH_BAN`)
- `WORLD_INFRASTRUCTURE_PROJECT`
- Boost/penalty catalog entries: `resource_production`, `trade_efficiency`, `trade_penalty`, `research_speed`

Aid (financial transfers) is still allowed and can be blocked by sanctions.
