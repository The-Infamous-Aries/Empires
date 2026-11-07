# Projects System

Handles advanced nation projects — more expensive than improvements, require technology levels, and unlock powerful nation-wide capabilities. Projects are built on project slots (1 starting slot + 1 per 2 territory squares) and are subject to a 14-day cooldown between builds (managed by `BuildingsSystem`).

## Overview

- **System class:** `ProjectsSystem`
- **Cost currency:** Money + staged resources (e.g. `steel-manufactured`)
- **Slot limit:** 1 starting project slot + 1 additional slot per 2 territories (managed by `BuildingsSystem.canBuildProject()`)
  - 0 territories = 1 slot; 2 territories = 2 slots; 124 territories = 63 slots (enough for all projects)
  - Reads territory count live from `TerritoryManager`
- **Cooldown:** 14 days between project builds
- **Broadcasting exception:** Does NOT occupy a project slot (`doesNotOccupySlot: true`) but still activates the cooldown
- **Effects:** Applied via `applyProjectEffects()` on build/demolish, fully rebuilt via `rebuildAllProjectEffects()` so pollution accumulators never compound
- **Boolean flags:** All boolean effect flags (`governmentLocked`, `resourceRecovery`, `enhancedRecycling`, etc.) are conditional on `count > 0` — demolishing a project removes its effects

---

## Project Reference

| Project | Category | Max Count | Cost | Tech Required | Prerequisite |
|---------|----------|-----------|------|---------------|--------------|
| Missile Silo | Military | 3 | $8,000,000 | 500 | — |
| Iron Curtain Defense System | Military | 3 | $12,000,000 | 500 | — |
| Nuclear Shield Defense System | Military | 3 | $20,000,000 | 1,000 | — |
| Military Command Center | Military | 3 | $9,000,000 | 750 | — |
| Advanced Military Academy | Military | 1 | $28,000,000 | 1,500 | — |
| National University | Education | 3 | $10,000,000 | 500 | — |
| Advanced University | Education | 1 | $20,000,000 | 600 | University (1) |
| Emergency Medical Hub | Healthcare | 3 | $6,000,000 | 500 | — |
| Government Monument | Administration | 1 | $32,000,000 | 1,000 | — |
| Religious Monument | Administration | 1 | $32,000,000 | 1,000 | — |
| Intelligence Operations Center | Military | 5 | $11,000,000 | 750 | — |
| SWAT Operations Center | Security | 3 | $8,000,000 | 750 | — |
| Advanced Research Institute | Science | 1 | $15,000,000 | 1,000 | — |
| Advanced Police Stations | Infrastructure | 3 | $8,000,000 | 800 | — |
| Sports Betting Complex | Economic | 1 | $15,000,000 | 600 | — |
| Elite Military Training Program | Military | 1 | $20,000,000 | 750 | — |
| Advanced Tank Manufacturing | Military | 1 | $26,000,000 | 1,000 | — |
| Advanced Aircraft Systems | Military | 1 | $32,000,000 | 1,250 | — |
| Advanced Naval Operations | Military | 1 | $28,000,000 | 1,100 | — |
| National Broadcasting Network | Infrastructure | 1 | $10,000,000 | 300 | — |
| Financial Assistance Office | Diplomacy | 1 | $15,000,000 | 800 | — |
| Office of Relationships | Diplomacy | 1 | $13,000,000 | 500 | — |
| Advanced Recycling Operations | Infrastructure | 1 | $20,000,000 | 800 | — |
| Advanced Agriculture | Infrastructure | 1 | $10,000,000 | 800 | Farms (5) |
| Farm Synergy | Infrastructure | 1 | $15,000,000 | 1,000 | Farms (5) |
| Advanced Well Drilling | Infrastructure | 1 | $10,000,000 | 800 | Wells (5) |
| Well Synergy | Infrastructure | 1 | $15,000,000 | 1,000 | Wells (5) |
| Salvage Yard | Infrastructure | 1 | $8,000,000 | 600 | — |
| Military Salvage Operations | Military | 3 | $6,000,000 | 700 | — |
| Green Space Initiative | Infrastructure | 1 | $10,000,000 | 800 | — |
| Urban Forestry Program | Infrastructure | 1 | $8,000,000 | 600 | — |
| Carbon Capture Program | Infrastructure | 1 | $12,000,000 | 900 | — |
| Zero Waste Initiative | Infrastructure | 1 | $10,000,000 | 800 | — |
| Clean Air Regulations | Administration | 1 | $15,000,000 | 1,000 | — |
| Public Transit Expansion | Infrastructure | 1 | $8,000,000 | 500 | — |
| EPA Agency | Administration | 1 | $20,000,000 | 1,200 | — |
| Food Production Facility | Economy | 3 | $5,000,000 | 100 | — |
| Water Production Facility | Economy | 3 | $5,000,000 | 100 | — |

---

## Projects by Category

### Military

#### Missile Silo
- **Max count:** 3
- **Cost:** $8,000,000
- **Tech required:** 500
- **Resources:** 100 steel-manufactured, 300 bronze-manufactured
- **Effect:** Produces 1 missile per day, stores up to 5 missiles per silo. +50 pollution per silo.
- **System effect:** `missileCapacity = count * 5`; `pollutionProduction += count * 50`
- **Daily production:** 1 missile per silo per day (up to capacity), via `produceMissiles()`
- **Server usage:** `systems/War/war-system.js` checks `nation.projects.militarySalvage` for post-battle salvage

#### Iron Curtain Defense System
- **Max count:** 3
- **Cost:** $12,000,000
- **Tech required:** 500
- **Resources:** 100 gasoline-manufactured, 150 lead-manufactured
- **Effect:** 11% chance to intercept incoming missiles per system (max 33%). +50 pollution per system.
- **System effect:** `missileInterception = Math.min(0.33, count * 0.11)`; `pollutionProduction += count * 50`
- **Usage:** Checked by `interceptMissile()` when a missile is launched at the nation

#### Nuclear Shield Defense System
- **Max count:** 3
- **Cost:** $20,000,000
- **Tech required:** 1,000
- **Resources:** 200 uranium-manufactured, 150 aluminum-manufactured
- **Effect:** 11% chance to intercept incoming nuclear missiles per system (max 33%). +50 pollution per system.
- **System effect:** `nukeInterception = Math.min(0.33, count * 0.11)`; `pollutionProduction += count * 50`
- **Usage:** Nuclear missile interception

#### Military Command Center
- **Max count:** 3
- **Cost:** $9,000,000
- **Tech required:** 750
- **Resources:** 75 steel-manufactured, 250 bronze-manufactured
- **Effect:** +1 offensive & defensive war slot per center (base 2 slots)
- **System effect:** `offensiveWarSlots = 2 + count`; `defensiveWarSlots = 2 + count`
- **Server usage:** `server/world.js` uses `2 + (n.projects.commandCenter || 0)` for war slot calculation

#### Advanced Military Academy
- **Max count:** 1
- **Cost:** $28,000,000
- **Tech required:** 1,500
- **Resources:** 100 steel-manufactured, 100 gasoline-manufactured
- **Effect:** Increases maximum military unit percentages significantly
- **System effects:**
  - `maxSoldierPercent = 30` (was 20%)
  - `maxTankPercent = 20` (was 10%)
  - `maxAircraftPercent = 10` (was 7.5%)
  - `maxShipPercent = 7.5` (was 5%)
- **Server usage:** `server/world.js:getMilitaryUnitLimits()` applies these caps

#### Intelligence Operations Center
- **Max count:** 5
- **Cost:** $11,000,000
- **Tech required:** 750
- **Resources:** 150 copper-manufactured, 150 lead-manufactured, 150 uranium-manufactured
- **Effect:** Produces 3 spies per day, holds up to 10 spies per center. +50 pollution per center.
- **System effect:** `spyCapacity = count * 10`; `pollutionProduction += count * 50`
- **Daily production:** 3 spies per center per day (up to capacity), via `produceSpies()`

#### SWAT Operations Center
- **Max count:** 3
- **Cost:** $8,000,000
- **Tech required:** 750
- **Resources:** 75 steel-manufactured, 200 bronze-manufactured
- **Effect:** -15% crime rate, +2 happiness per center
- **System effects:**
  - `swatCrimeReduction = count * 0.15`
  - `swatHappinessBonus = count * 2`

#### Military Salvage Operations
- **Max count:** 3
- **Cost:** $6,000,000
- **Tech required:** 700
- **Resources:** 100 steel-manufactured, 150 gasoline-manufactured
- **Effect:** 9% salvage rate per project (max 27% with 3 projects). -50 pollution per project.
- **System effects:**
  - `militarySalvageRate = count * 0.09`
  - `pollutionReduction += count * 50`
- **Server usage:** `systems/War/war-system.js` checks `nation.projectEffects.militarySalvageRate` for post-battle salvage

### Education

#### National University
- **Max count:** 3
- **Cost:** $10,000,000
- **Tech required:** 500
- **Resources:** 100 steel-manufactured, 100 lead-manufactured
- **Effect:** +10% literacy rate, +3 happiness, -5% tech costs per university
- **System effects:**
  - `universityLiteracyBonus = count * 0.10`
  - `universityHappinessBonus = count * 3`
  - `baseTechCostReduction = count * 0.05`
- **Great Library wonder:** Adds `count * 0.025` tech reduction per university
- **Advanced University project:** Adds `count * 0.0333` tech reduction per university
- **Total tech reduction** is recombined as sum of base + greatLibrary + advancedUniversity bonuses
- **Stacking:** Benefits stack up to 3 universities

#### Advanced University
- **Max count:** 1
- **Cost:** $20,000,000
- **Tech required:** 600
- **Prerequisite:** 1 National University (`requires: 'university'`, `requireCount: 1`)
- **Resources:** 100 aluminum-manufactured, 100 gasoline-manufactured
- **Effect:** Reduces tech costs by 3.33% per National University (up to 10% with 3 universities). Prerequisite for the Great Library wonder.
- **System effect:** `advancedUniversityActive = count > 0`; `advancedUniversityTechReduction = universityCount * 0.0333`; recombines `techCostReduction`

### Healthcare

#### Emergency Medical Hub
- **Max count:** 3
- **Cost:** $6,000,000
- **Tech required:** 500
- **Resources:** 100 copper-manufactured, 100 aluminum-manufactured
- **Effect:** -10% disease rate, +5 happiness per hub
- **System effects:**
  - `ambulanceDiseaseReduction = count * 0.10`
  - `ambulanceHappinessBonus = count * 5`

### Administration

#### Government Monument
- **Max count:** 1
- **Cost:** $32,000,000
- **Tech required:** 1,000
- **Resources:** 125 steel-manufactured, 125 gasoline-manufactured
- **Effect:** Locks government choice forever, population always approves
- **System effects:** `governmentLocked = count > 0`; `governmentApprovalLocked = count > 0`
- **Special:** PERMANENT — `permanent: true` — cannot be demolished once built
- **Server usage:** `server/world.js` checks government/religion locking

#### Religious Monument
- **Max count:** 1
- **Cost:** $32,000,000
- **Tech required:** 1,000
- **Resources:** 125 steel-manufactured, 125 gasoline-manufactured
- **Effect:** Locks religion choice forever, population always approves
- **System effects:** `religionLocked = count > 0`; `religionApprovalLocked = count > 0`
- **Special:** PERMANENT — `permanent: true` — cannot be demolished once built

### Security

### Science

#### Advanced Research Institute
- **Max count:** 1
- **Cost:** $15,000,000
- **Tech required:** 1,000
- **Resources:** 100 aluminum-manufactured, 100 uranium-manufactured
- **Effect:** Labs give 3.5% income to research each (14% total with 4 labs). +1 pollution and +1 disease per lab.
- **System effect:** Delegated to `ResearchSystem.applyLabEffects(nation)`; pollution added via `pollutionProduction += count * 0` (no direct pollution from this project; pollution handled by ResearchSystem)

### Infrastructure

#### Advanced Police Stations
- **Max count:** 3
- **Cost:** $8,000,000
- **Tech required:** 800
- **Resources:** 75 steel-manufactured, 200 bronze-manufactured
- **Effect:** -10% crime rate, +2 happiness per center
- **System effects:**
  - `enhancedPoliceCrimeReduction = count * 0.10`
  - `enhancedPoliceHappinessBonus = count * 2`

#### National Broadcasting Network
- **Max count:** 1
- **Cost:** $10,000,000
- **Tech required:** 300
- **Resources:** 100 bronze-manufactured, 50 copper-manufactured, 50 aluminum-manufactured, 50 lead-manufactured, 50 steel-manufactured, 50 uranium-manufactured, 50 gasoline-manufactured
- **Effect:** Allows voting on color motions in World Forum and eligibility for Congress seats
- **System effects:** `worldForumAccess = count > 0`; `colorVotingEnabled = count > 0`; `congressEligible = count > 0`
- **Special:** Does NOT occupy a project slot but activates project cooldown
- **Server usage:** `server/world.js` checks `broadcasting` for World Forum voting and Congress eligibility

#### Advanced Recycling Operations
- **Max count:** 1
- **Cost:** $20,000,000
- **Tech required:** 800
- **Resources:** 100 lead-manufactured, 100 aluminum-manufactured, 100 steel-manufactured
- **Effect:** Doubles recycling center pollution reduction (-300 → -600 each), but each recycling center reduces happiness by 1
- **System effect:** `enhancedRecycling = count > 0`
- **Improvement interaction:** `systems/Nation/improvements-system.js` checks `nation.projectEffects.enhancedRecycling` to apply -1 happiness per recycling center

#### Salvage Yard
- **Max count:** 1
- **Cost:** $8,000,000
- **Tech required:** 600
- **Resources:** 300 bronze-manufactured, 100 copper-manufactured
- **Effect:** Enables resource recovery when demolishing buildings
- **System effect:** `resourceRecovery = count > 0`
- **Demolition interaction:** `demolishProject()` and `systems/Nation/improvements-system.js` check `nation.projectEffects.resourceRecovery` to refund a percentage of building costs on demolition

#### Advanced Agriculture
- **Max count:** 1
- **Cost:** $10,000,000
- **Tech required:** 800
- **Prerequisite:** 5 Farms (`requires: 'farm'`, `requireCount: 5`)
- **Resources:** 250 steel-manufactured, 250 gasoline-manufactured
- **Effect:** Each farm now covers 2,000,000 population instead of 1,000,000
- **System effect:** `farmDoubling = count > 0`
- **Improvement interaction:** `systems/Nation/improvements-system.js` checks `nation.projectEffects.farmDoubling` to double farm coverage

#### Farm Synergy
- **Max count:** 1
- **Cost:** $15,000,000
- **Tech required:** 1,000
- **Prerequisite:** 5 Farms (`requires: 'farm'`, `requireCount: 5`)
- **Resources:** 600 bronze-manufactured, 250 aluminum-manufactured
- **Effect:** When 5 farms are built, stack bonus increases from 50% to 100%
- **System effect:** `farmMaxStackBonus100 = count > 0`
- **Improvement interaction:** `systems/Nation/improvements-system.js` checks `nation.projectEffects.farmMaxStackBonus100`

#### Advanced Well Drilling
- **Max count:** 1
- **Cost:** $10,000,000
- **Tech required:** 800
- **Prerequisite:** 5 Wells (`requires: 'well'`, `requireCount: 5`)
- **Resources:** 250 copper-manufactured, 250 lead-manufactured
- **Effect:** Each well now covers 2,000,000 population instead of 1,000,000
- **System effect:** `wellDoubling = count > 0`
- **Improvement interaction:** `systems/Nation/improvements-system.js` checks `nation.projectEffects.wellDoubling`

#### Well Synergy
- **Max count:** 1
- **Cost:** $15,000,000
- **Tech required:** 1,000
- **Prerequisite:** 5 Wells (`requires: 'well'`, `requireCount: 5`)
- **Resources:** 600 bronze-manufactured, 250 aluminum-manufactured
- **Effect:** When 5 wells are built, stack bonus increases from 50% to 100%
- **System effect:** `wellMaxStackBonus100 = count > 0`
- **Improvement interaction:** `systems/Nation/improvements-system.js` checks `nation.projectEffects.wellMaxStackBonus100`

#### Green Space Initiative
- **Max count:** 1
- **Cost:** $10,000,000
- **Tech required:** 800
- **Resources:** 100 steel-manufactured, 150 lead-manufactured
- **Effect:** Doubles Community Garden pollution reduction (-60 → -120 each)
- **System effect:** `greenSpaceInitiative = count > 0`
- **Special:** Stacks with National Parks System wonder

#### Urban Forestry Program
- **Max count:** 1
- **Cost:** $8,000,000
- **Tech required:** 600
- **Resources:** 100 bronze-manufactured, 100 aluminum-manufactured
- **Effect:** -200 flat pollution reduction
- **System effect:** `urbanForestryProgram = count > 0`; `pollutionReduction += count * 200`

#### Carbon Capture Program
- **Max count:** 1
- **Cost:** $12,000,000
- **Tech required:** 900
- **Resources:** 200 bronze-manufactured, 100 lead-manufactured, 100 steel-manufactured
- **Effect:** -100 pollution per transition plant (Steel Mill, Bronze Foundry, etc.)
- **System effect:** `carbonCaptureProgram = count > 0`
- **Special:** Applies to all 7 transition improvements

#### Zero Waste Initiative
- **Max count:** 1
- **Cost:** $10,000,000
- **Tech required:** 800
- **Resources:** 150 aluminum-manufactured, 100 copper-manufactured
- **Effect:** Doubles Waste Treatment Plant pollution reduction (-180 → -360 each)
- **System effect:** `zeroWasteInitiative = count > 0`
- **Special:** Stacks with Waste Treatment Plant improvements

#### Clean Air Regulations
- **Max count:** 1
- **Cost:** $15,000,000
- **Tech required:** 1,000
- **Resources:** 250 bronze-manufactured, 100 steel-manufactured
- **Effect:** -15% pollution from all sources
- **System effect:** `cleanAirRegulations = count > 0`
- **Special:** Percentage-based reduction applied after flat reductions

#### Public Transit Expansion
- **Max count:** 1
- **Cost:** $8,000,000
- **Tech required:** 500
- **Resources:** 150 steel-manufactured, 100 gasoline-manufactured
- **Effect:** -50 pollution per Harbor and Airforce Base
- **System effect:** `publicTransitExpansion = count > 0`
- **Special:** Targets Harbor and Airforce Base improvements

#### EPA Agency
- **Max count:** 1
- **Cost:** $20,000,000
- **Tech required:** 1,200
- **Resources:** 300 bronze-manufactured, 200 steel-manufactured, 100 uranium-manufactured
- **Effect:** -250 flat pollution reduction + blocks bad-edict pollution increases
- **System effect:** `epaAgency = count > 0`; `pollutionReduction += count * 250`
- **Special:** Prevents bad edicts from increasing pollution

### Diplomacy

#### Financial Assistance Office
- **Max count:** 1
- **Cost:** $15,000,000
- **Tech required:** 800
- **Resources:** 200 bronze-manufactured, 50 copper-manufactured, 50 steel-manufactured
- **Effect:** Allows sending monetary and technological aid to allied nations; enhances Intelligence Pacts
- **System effects:**
  - `financialAidEnabled = count > 0`
  - `techAidEnabled = count > 0`
  - `maxAidSlots = count > 0 ? 3 : 0`
  - `intelligencePactBonus = count > 0`
- **Server usage:** `server/diplomacy.js` checks `financialAssistanceOffice` for aid calculations

#### Office of Relationships
- **Max count:** 1
- **Cost:** $13,000,000
- **Tech required:** 500
- **Resources:** 500 bronze-manufactured, 250 uranium-manufactured
- **Effect:** Allows changing friends, best friends, foes, and nemesis
- **System effect:** `changeableRelationships = count > 0`
- **Server usage:** `server/diplomacy.js` checks `officeOfRelationships` to allow relationship changes

### Economic

#### Sports Betting Complex
- **Max count:** 1
- **Cost:** $15,000,000
- **Tech required:** 600
- **Resources:** 200 copper-manufactured, 400 bronze-manufactured
- **Effect:** +33% taxable income but +33% crime rate. +200 pollution.
- **System effects:**
  - `sportsBettingTaxBonus = 0.33`
  - `sportsBettingCrimeIncrease = 0.33`
  - `pollutionProduction += count * 200`
- **Server usage:** `server/sports.js` checks `sportsBetting` for sports betting mechanics

### Economy

#### Food Production Facility
- **Max count:** 3
- **Cost:** $5,000,000
- **Tech required:** 100
- **Effect:** Produces 0.25 food per turn per facility. -100 pollution per facility.
- **System effects:**
  - `foodProductionRate = count * 0.25`
  - `pollutionReduction += count * 100`

#### Water Production Facility
- **Max count:** 3
- **Cost:** $5,000,000
- **Tech required:** 100
- **Effect:** Produces 0.25 water per turn per facility. -100 pollution per facility.
- **System effects:**
  - `waterProductionRate = count * 0.25`
  - `pollutionReduction += count * 100`

---

## Mechanics

### Building
Projects are built via the `build_project` event. `BuildingsSystem.buildProject()` is the coordinator — it checks project slots (1 + territories/2) and cooldown first, then delegates to `ProjectsSystem.buildProject()`. Checks performed:

1. Project type exists in `projectTypes`
2. Current count is below `maxCount`
3. Nation meets tech requirement (`nation.tech >= project.techRequired`)
4. Prerequisite requirement met (sum of `nation.projects[requires]` + `nation.improvements[requires]` >= `requireCount`, default 5)
5. Bonus resource requirement (if `bonusRequirement` is set)
6. Nation can afford the money cost (`canAffordProject`)
7. Cost deducted via `payProjectCost`
8. Count incremented on `nation.projects[type]`
9. Effects rebuilt via `rebuildAllProjectEffects(nation)` (full rebuild, resets pollution accumulators)
10. Wonder effects recalculated for farm/well projects
11. `project_built` event emitted

### Demolishing
Projects are demolished via the `demolish_project` event. `BuildingsSystem.demolishProject()` is the coordinator — it checks the `permanent` flag first, then delegates to `ProjectsSystem.demolishProject()`. Checks performed:

1. Nation owns at least 1 of the project type
2. Project is not permanent (`permanent` flag — Government Monument and Religious Monument cannot be demolished)
3. Salvage recovery: if `resourceRecovery` is active (from Salvage Yard project), refunds a percentage of the money cost (default 10%, enhanced by `wonderEffects.projectRecoveryRate` or `projectEffects.projectRecoveryRate`)
4. Count decremented
5. Effects rebuilt via `rebuildAllProjectEffects(nation)` (full rebuild, resets pollution accumulators; boolean flags become `false` when count reaches 0)
6. Wonder effects recalculated for farm/well projects
7. `project_demolished` event emitted

### Event Binding
Only `BuildingsSystem` binds to `build_project` and `demolish_project` events. `ProjectsSystem` binds to `build_project`, `demolish_project`, `get_project_info`, `launch_missile`, and `intercept_missile` to prevent double-handling.

### Daily Processing
`processDaily(nation)` is called each game day:
1. Missile production: 1 missile per silo per day (unless wonder-enhanced production overrides)
2. Spy production: 3 spies per center per day (unless wonder-enhanced production overrides)
3. Military force penalty: if more than 25% of population is in military/weapons, -10 happiness

### Missile Operations
- `launchMissile(data)` — consumes 1 missile, calculates damage based on type (standard 1x, nuclear 5x, precision 0.8x), emits `missile_launched`
- `interceptMissile(data)` — rolls against `missileInterception` chance; if successful, damage reduced to 0
- `produceMissiles(nation)` — produces 1 missile per silo per day, up to `missileCapacity`
- `produceSpies(nation)` — produces 3 spies per center per day, up to `spyCapacity`

### Unit Limits
`getMilitaryUnitLimits(nation)` calculates maximum military units based on population percentages:
- Soldiers: 20% base (30% with Military Academy)
- Tanks: 10% base (20% with Military Academy)
- Aircraft: 7.5% base (10% with Military Academy)
- Ships: 5% base (7.5% with Military Academy)
- Spies: 1% base (only if Intelligence Operations Center exists)
- Missiles: 0.5% base (only if Missile Silo exists)
- Nukes: 0.1% base (only if Nuclear Warhead Facility wonder exists)

### Affordability
`canAffordProject(nation, project)` checks `nation.money >= project.cost.money` and staged resource costs (`project.resources` with compound keys like `steel-manufactured`).

### Effect Rebuild
`rebuildAllProjectEffects(nation)` resets `pollutionProduction` and `pollutionReduction` to 0, then re-applies all built project types. This prevents pollution accumulators from compounding on repeated builds/demolishes within a turn.

### Query Methods
- `getProjectCount(nation, projectType)` — returns current count (defaults to 0)
- `getNationProjects(nation)` — returns all project types with count, affordability, maxed status, tech/prerequisite/bonus requirement status
- `getProjectInfo(data)` — returns type definition plus affordability, count, and requirement status for the current nation

---

## Cross-System Dependencies

| System | Dependency |
|--------|------------|
| `systems/Nation/improvements-system.js` | Projects enhance improvement effects (enhancedBarracksEfficiency, enhancedFactoryEfficiency, enhancedAirforceEfficiency, enhancedNavyEfficiency, enhancedRecycling, farmDoubling, wellDoubling, farmMaxStackBonus100, wellMaxStackBonus100) |
| `systems/Nation/wonders-system.js` | Salvage Yard required for some wonders; enhancedSalvage doubles recovery; enhancedMissileProduction/enhancedSpyProduction override daily production |
| `server/world.js` | Reads `tradeHub`, `salvageYard`, `broadcasting`, `commandCenter`, `financialAssistanceOffice`, `advancedUniversity`, `advancedResearch`, government/religion statues for various mechanics |
| `server/trade.js` | Checks `tradeHub` for permanent trade agreements |
| `server/diplomacy.js` | Checks `officeOfRelationships` for relationship changes, `financialAssistanceOffice` for aid |
| `server/sports.js` | Checks `sportsBetting` for sports betting |
| `systems/War/war-system.js` | Checks `militarySalvage` for post-battle salvage rates |
| `systems/War/diplomacy-system.js` | Checks `officeOfRelationships` for changeable relationships |
