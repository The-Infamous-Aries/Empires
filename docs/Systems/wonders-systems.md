# Wonders System

Handles advanced wonder constructions — the highest tier buildings in the game with unique, nation-wide effects. Wonders are more expensive than projects and often require prerequisite buildings, projects, or other wonders to unlock.

## Overview

- **System class:** `WondersSystem`
- **Cost currency:** Money only (resource costs were removed)
- **Slot limit:** None beyond per-wonder `maxCount` (most are 1)
- **Effects:** Applied via `applyWonderEffects()` on build, recalculated daily in `World.refresh()`
- **Prerequisites:** Can require projects, wonders, or improvements (5 stacks for improvement prerequisites)
- **Daily processing:** `processDaily()` handles nuke production, enhanced missile/spy production, government/religion cooldowns, supreme military recalculation, and food/water wonder reactivation

---

## Wonder Reference

| Wonder | Category | Max Count | Cost | Tech Required | Prerequisite |
|--------|----------|-----------|------|---------------|--------------|
| Government Monument | Administration | 1 | $50,000,000 | 500 | Government Statue (project) |
| Religious Monument | Administration | 1 | $50,000,000 | 500 | Religious Statue (project) |
| Great Library | Science | 1 | $75,000,000 | 600 | Advanced University (project) |
| Universal Education System | Education | 1 | $75,000,000 | 2,000 | — |
| Universal Healthcare System | Healthcare | 1 | $80,000,000 | 2,000 | — |
| Enhanced Missile Silo Network | Military | 1 | $60,000,000 | 1,500 | Missile Silo (project) |
| Enhanced Intelligence Network | Military | 1 | $90,000,000 | 3,000 | Spy Operations (project) |
| Military Recovery Wonder | Military | 1 | $55,000,000 | 1,200 | Military Salvage Operations (project) |
| Advanced Resource Recovery Complex | Infrastructure | 1 | $70,000,000 | 1,500 | Salvage Yard (project) |
| Nuclear Warhead Production Facility | Military | 1 | $100,000,000 | 750 | — |
| Enhanced Nuclear Arsenal | Military | 1 | $150,000,000 | 2,000 | Nuclear Warhead Production Facility (wonder) |
| Basketball Stadium Complex | Sports | 1 | $85,000,000 | 1,200 | — |
| Hockey Arena Complex | Sports | 1 | $90,000,000 | 1,300 | — |
| Soccer Stadium Complex | Sports | 1 | $80,000,000 | 1,100 | — |
| Alliance Headquarters Complex | Diplomacy | 1 | $75,000,000 | 1,000 | — |
| Supreme Mining Complex | Production | 1 | $80,000,000 | 1,500 | — |
| Clean Mining Operations Wonder | Production | 1 | $75,000,000 | 1,800 | — |
| Supreme Manufacturing Complex | Production | 1 | $85,000,000 | 1,800 | — |
| Clean Manufacturing Operations Wonder | Production | 1 | $80,000,000 | 2,000 | — |
| Supreme Environmental Protection Complex | Infrastructure | 1 | $90,000,000 | 2,200 | — |
| Supreme Military Command Complex | Military | 1 | $150,000,000 | 3,000 | — |
| Global Internet Network | Infrastructure | 1 | $60,000,000 | 1,500 | Broadcasting Network (project) |
| Temple of Abundance | Infrastructure | 1 | $250,000,000 | 2,500 | Farms (5) |
| Aqueduct of Life | Infrastructure | 1 | $250,000,000 | 2,500 | Wells (5) |

---

## Wonders by Category

### Administration

#### Government Monument
- **Max count:** 1
- **Cost:** $50,000,000
- **Tech required:** 500
- **Prerequisite:** Government Statue project
- **Effect:** Unlocks government changes from Government Statue (once per 14 days)
- **System effects:**
  - `governmentChangeable = true`
  - `governmentCooldown = 0`
  - `lastGovernmentChange = 0`
- **Usage:** Enabled via `changeGovernment()` when `governmentChangeable` is true and cooldown is 0
- **Server usage:** `server/world.js:841` checks `governmentMonument` for government change permission; `ui/live/game.js:770` maps government to this wonder key

#### Religious Monument
- **Max count:** 1
- **Cost:** $50,000,000
- **Tech required:** 500
- **Prerequisite:** Religious Statue project
- **Effect:** Unlocks religion changes from Religious Statue (once per 14 days)
- **System effects:**
  - `religionChangeable = true`
  - `religionCooldown = 0`
  - `lastReligionChange = 0`
- **Usage:** Enabled via `changeReligion()` when `religionChangeable` is true and cooldown is 0
- **Server usage:** `server/world.js:841` checks `religiousMonument` for religion change permission; `ui/live/game.js:770` maps religion to this wonder key

---

### Research & Science

#### Great Library
- **Max count:** 1
- **Cost:** $75,000,000
- **Tech required:** 600
- **Prerequisite:** Advanced University project
- **Effect:** Enables 2 simultaneous research projects, +25% research speed, +200 research points/day
- **System effects:** Applied via `server/world.js`:
  - `activeResearch.length >= 2` instead of 1 (`server/world.js:790`)
  - `+0.25` research speed bonus (`server/world.js:812`)
  - `+200` research points per day (`server/world.js:2772`)
- **Note:** Effects are applied in `World.js`, not in `applyWonderEffects()` — no wonderEffects properties are set

---

### Education & Healthcare

#### Universal Education System
- **Max count:** 1
- **Cost:** $75,000,000
- **Tech required:** 2,000
- **Effect:** +25% literacy rate, -15% tech costs
- **System effects:**
  - `universalEducationLiteracyBonus = 0.25`
  - `universalEducationTechCostReduction = 0.15`
- **Server usage:** `entities/Nation.js:472` applies literacy bonus (multiplied by 100); `entities/Nation.js:1060` applies tech cost reduction

#### Universal Healthcare System
- **Max count:** 1
- **Cost:** $80,000,000
- **Tech required:** 2,000
- **Effect:** -35% disease rate, +15 happiness
- **System effects:**
  - `universalHealthcareDiseaseReduction = 0.35`
  - `universalHealthcareHappinessBonus = 15`
- **Server usage:** `entities/Nation.js:571` applies disease reduction (multiplied by 100)

---

### Enhanced Military

#### Enhanced Missile Silo Network
- **Max count:** 1
- **Cost:** $60,000,000
- **Tech required:** 1,500
- **Prerequisite:** Missile Silo project
- **Effect:** Each silo produces 2 missiles/day and stores 10 (was 1/day, 5 storage)
- **System effects:**
  - `enhancedMissileProduction = true`
  - `missileProductionRate = 2`
  - `missileStorageCapacity = 10`
- **Daily production:** Via `produceEnhancedMissiles()` — 2 missiles per silo per day, up to `siloCount * 10` storage
- **Server usage:** `server/world.js:719` checks `enhancedSilos` for production rate (2 vs 1 per silo)

#### Enhanced Intelligence Network
- **Max count:** 1
- **Cost:** $90,000,000
- **Tech required:** 3,000
- **Prerequisite:** Spy Operations project
- **Effect:** Each Spy Operations produces 5 spies/day and stores 15 (was 3/day, 10 storage)
- **System effects:**
  - `enhancedSpyProduction = true`
  - `spyProductionRate = 5`
  - `spyStorageCapacity = 15`
- **Daily production:** Via `produceEnhancedSpies()` — 5 spies per center per day, up to `spyCenterCount * 15` storage
- **Server usage:** `server/world.js:715` checks `enhancedSpyOps` for production rate (5 vs 3 per center)

#### Military Recovery Wonder
- **Max count:** 1
- **Cost:** $55,000,000
- **Tech required:** 1,200
- **Prerequisite:** Military Salvage Operations project
- **Effect:** Doubles Military Salvage project recovery rate to 18% and reduces soldier losses by 2.5%
- **System effects:**
  - `militaryRecoveryEnabled = true`
  - `enhancedSalvageRate = (nation.projectEffects?.militarySalvageRate || 0) * 2` (9% becomes 18% per project)
  - `soldierLossReduction = 0.025`
- **Server usage:** `server/world.js:2434` applies `soldierLossReduction` to battle casualties; `server/world.js:2441` checks `enhancedSalvageRate` for post-battle salvage

---

### Enhanced Infrastructure

#### Advanced Resource Recovery Complex
- **Max count:** 1
- **Cost:** $70,000,000
- **Tech required:** 1,500
- **Prerequisite:** Salvage Yard project
- **Effect:** Increases refund rates: 30% improvements, 20% projects, 10% wonders (was 15%/10%/5%)
- **System effects:**
  - `enhancedSalvage = true`
  - `improvementRecoveryRate = 0.30`
  - `projectRecoveryRate = 0.20`
  - `wonderRecoveryRate = 0.10`
- **Server usage:** `server/world.js:1030` checks `enhancedSalvage` for demolition refund multiplier (2x vs 1x)

---

### Nuclear Wonders

#### Nuclear Warhead Production Facility
- **Max count:** 1
- **Cost:** $100,000,000
- **Tech required:** 750
- **Effect:** Produces 1 nuclear warhead per day, stores up to 3 warheads
- **System effects:**
  - `nuclearCapability = true`
  - `nuclearProductionRate = 1`
  - `nuclearStorageCapacity = 3`
  - Initializes `nation.military.nukes = 0`
- **Daily production:** Via `produceNukes()` — 1 nuke per day up to storage capacity
- **Server usage:** `server/world.js:723` checks `nuclearWarheadFacility` for nuke production; `server/world.js:2761` checks for nuclear capability in voting; `entities/Nation.js` tracks `military.nukes`

#### Enhanced Nuclear Arsenal
- **Max count:** 1
- **Cost:** $150,000,000
- **Tech required:** 2,000
- **Prerequisite:** Nuclear Warhead Production Facility (wonder)
- **Effect:** Increases nuclear production to 2/day and storage to 5 warheads
- **System effects:**
  - `enhancedNuclearProduction = true`
  - `nuclearProductionRate = 2`
  - `nuclearStorageCapacity = 5`
- **Server usage:** `server/world.js:725` uses `enhancedNuclearWarheads` or falls back to base facility; `server/world.js:2762` checks for enhanced warheads in voting
- **Demolition:** When demolished, reverts `nuclearProductionRate` to 1 and `nuclearStorageCapacity` to 3 (does not delete them)

---

### Sports Stadium Wonders

#### Basketball Stadium Complex
- **Max count:** 1
- **Cost:** $85,000,000
- **Tech required:** 1,200
- **Effect:** Unlocks basketball team creation, management, and tournament participation
- **System effect:** `basketballTeamUnlocked = true`
- **Server usage:** `ui/live/game.js:184, 218, 656` checks `n.wonders['basketballStadium']` for team ownership UI

#### Hockey Arena Complex
- **Max count:** 1
- **Cost:** $90,000,000
- **Tech required:** 1,300
- **Effect:** Unlocks hockey team creation, management, and tournament participation
- **System effect:** `hockeyTeamUnlocked = true`
- **Server usage:** `ui/live/game.js` checks `n.wonders['hockeyStadium']` for team ownership UI

#### Soccer Stadium Complex
- **Max count:** 1
- **Cost:** $80,000,000
- **Tech required:** 1,100
- **Effect:** Unlocks soccer team creation, management, and tournament participation
- **System effect:** `soccerTeamUnlocked = true`
- **Server usage:** `ui/live/game.js` checks `n.wonders['soccerStadium']` for team ownership UI

---

### Alliance Management

#### Alliance Headquarters Complex
- **Max count:** 1
- **Cost:** $75,000,000
- **Tech required:** 1,000
- **Effect:** Enables alliance creation and advanced diplomatic features
- **System effects:**
  - `canCreateAlliance = true`
  - `allianceLeadershipBonus = 0.15`
  - `maxTreaties = 10`
- **Server usage:** `server/world.js:1545` checks `allianceHeadquarters` for alliance creation permission

---

### Enhanced Production Wonders

#### Supreme Mining Complex
- **Max count:** 1
- **Cost:** $80,000,000
- **Tech required:** 1,500
- **Effect:** Increases mine efficiency by additional 50% (stacks with Enhanced Mining project)
- **System effect:** `supremeMineEfficiency = true`
- **Note:** References "mines" which are improvement types removed from the economy — effect flag exists but no active consumer in the current codebase

#### Clean Mining Operations Wonder
- **Max count:** 1
- **Cost:** $75,000,000
- **Tech required:** 1,800
- **Effect:** Removes all pollution generated by mines (they produce 0 pollution)
- **System effect:** `cleanMineOperations = true`
- **Server usage:** `entities/Nation.js:500` checks `cleanMineOperations` for pollution calculation

#### Supreme Manufacturing Complex
- **Max count:** 1
- **Cost:** $85,000,000
- **Tech required:** 1,800
- **Effect:** Increases assembly plant efficiency by additional 50% (stacks with Enhanced Assembly project)
- **System effect:** `supremeAssemblyEfficiency = true`
- **Note:** References "assembly plants" which are improvement types removed from the economy — effect flag exists but no active consumer in the current codebase

#### Clean Manufacturing Operations Wonder
- **Max count:** 1
- **Cost:** $80,000,000
- **Tech required:** 2,000
- **Effect:** Removes all pollution generated by assembly plants (they produce 0 pollution)
- **System effect:** `cleanAssemblyOperations = true`
- **Server usage:** `entities/Nation.js:510` checks `cleanAssemblyOperations` for pollution calculation

#### Supreme Environmental Protection Complex
- **Max count:** 1
- **Cost:** $90,000,000
- **Tech required:** 2,200
- **Effect:** Triples recycling center effectiveness, removes happiness penalty, +1 environment per recycling center
- **System effect:** `supremeRecycling = true`
- **Server usage:** `entities/Nation.js:526, 531` checks `supremeRecycling` for enhanced recycling pollution/happiness logic

---

### Supreme Military Wonder

#### Supreme Military Command Complex
- **Max count:** 1
- **Cost:** $150,000,000
- **Tech required:** 3,000
- **Effect:** Gives slight boost to ALL military unit types that are at maximum stacks (5), but causes -0.5 happiness per boosted type (max -2 when all 4 at max)
- **System effects (via `applySupremeMilitaryEffects`):**
  - Checks military improvements: `barracks`, `factory`, `airforceBase`, `harbor`
  - For each improvement at count >= 5: `supremeSoldierBonus`, `supremeTankBonus`, `supremeAircraftBonus`, or `supremeShipBonus = 0.05`
  - `supremeMilitaryHappinessPenalty = maxedCount * 0.5`
- **Server usage:** `systems/improvements-system.js:243, 310-350` applies bonuses to military improvement effectiveness; `improvements-system.js:958` checks `supremeMilitaryBonus` before applying effects

---

### World Forum Wonders

#### Global Internet Network
- **Max count:** 1
- **Cost:** $60,000,000
- **Tech required:** 1,500
- **Prerequisite:** Broadcasting Network project
- **Effect:** Allows voting on world affairs in World Forum (edicts and global policies), requires Broadcasting Network
- **System effects:**
  - `globalVotingEnabled = true`
  - `worldAffairsAccess = true`
- **Server usage:** `server/world.js:1747` checks `internet` for World Forum voting eligibility

---

### Food and Water Wonders

#### Temple of Abundance
- **Max count:** 1
- **Cost:** $250,000,000
- **Tech required:** 2,500
- **Prerequisite:** 5 Farms (`requires: 'farm'`, `requireCount: 5`)
- **Effect:** Provides food for ALL nation population regardless of size, but requires 5 farms to be built to function
- **System effects (via `applyWonderEffects`):**
  - If farm count >= 5: `abundanceTempleActive = true`, `foodIndependence = true`
  - If farm count < 5: `abundanceTempleActive = false`, `foodIndependence` deleted
  - If both `farmDoubling` and `farmMaxStackBonus100` project effects active: `abundanceTempleHappinessBonus = 5`
- **Server usage:** `entities/Nation.js:686` checks `abundanceTempleActive` for food independence; `entities/Nation.js:759` applies happiness bonus
- **Daily:** Recalculated daily in `processDaily()` to re-check farm count

#### Aqueduct of Life
- **Max count:** 1
- **Cost:** $250,000,000
- **Tech required:** 2,500
- **Prerequisite:** 5 Wells (`requires: 'well'`, `requireCount: 5`)
- **Effect:** Provides water for ALL nation population regardless of size, but requires 5 wells to be built to function
- **System effects (via `applyWonderEffects`):**
  - If well count >= 5: `aqueductOfLifeActive = true`, `waterIndependence = true`
  - If well count < 5: `aqueductOfLifeActive = false`, `waterIndependence` deleted
  - If both `wellDoubling` and `wellMaxStackBonus100` project effects active: `aqueductOfLifeHappinessBonus = 5`
- **Server usage:** `entities/Nation.js:691` checks `aqueductOfLifeActive` for water independence; `entities/Nation.js:762` applies happiness bonus
- **Daily:** Recalculated daily in `processDaily()` to re-check well count

---

## Mechanics

### Building
Wonders are built via the `build_wonder` event. Checks performed:

1. Wonder type exists in `wonderTypes`
2. Current count is below `maxCount`
3. Nation meets tech requirement (`nation.tech >= wonder.techRequired`)
4. Prerequisite requirement met:
   - Project prerequisite: `nation.projects[requires] > 0`
   - Wonder prerequisite: `nation.wonders[requires] > 0`
   - Improvement prerequisite: `nation.improvements[requires] >= 5`
5. Nation can afford the money cost (`canAffordWonder`)
6. Cost deducted via `payWonderCost`
7. Count incremented on `nation.wonders[type]`
8. Effects applied via `applyWonderEffects`
9. `wonder_built` event emitted

### Demolishing
Wonders are demolished via the `demolish_wonder` event. Checks performed:
1. Nation owns at least 1 of the wonder type
2. Count decremented
3. When count reaches 0, `removeWonderEffects()` is called to clean up all wonderEffects properties for that wonder type
4. `wonder_demolished` event emitted

### Daily Processing
`processDaily(nation)` is called each game day:
1. Nuclear warhead production: 1 per day up to storage capacity (via `produceNukes()`)
2. Enhanced missile production: overrides regular missile production if `enhancedMissileProduction` active
3. Enhanced spy production: overrides regular spy production if `enhancedSpyProduction` active
4. Government/religion change cooldowns: resets cooldown after 14 days (via `processCooldowns()`)
5. Supreme military effects: recalculated if `supremeMilitaryBonus` active (via `applySupremeMilitaryEffects()`)
6. Food/water wonder effects: `abundanceTemple` and `aqueductOfLife` re-evaluated daily to check farm/well counts

### Missile Operations
- `launchNuke(data)` — consumes 1 nuclear warhead, calculates damage (standard 10,000, enhanced 15,000), nuclear missiles cannot be intercepted by Iron Curtain, emits `nuclear_missile_launched`

### Government/Religion Changes
- `changeGovernment(data)` — requires `governmentChangeable` and cooldown = 0; sets cooldown to 14 days; reapplies government bonuses
- `changeReligion(data)` — requires `religionChangeable` and cooldown = 0; sets cooldown to 14 days; reapplies religion bonuses

### Affordability
`canAffordWonder(nation, wonder)` checks `nation.money >= wonder.cost.money`. Since resources were removed from the economy, only money is validated.

### Query Methods
- `getWonderCount(nation, wonderType)` — returns current count (defaults to 0)
- `hasWonder(nationId, wonderType)` — returns boolean if nation has the wonder
- `getNation(nationId)` — helper to look up a nation by ID from `window.DataManager`
- `getWonderInfo(data)` — returns type definition plus affordability, count, tech/prerequisite status
- `getNationWonders(nation)` — returns all wonder types with count, affordability, maxed status, tech/prerequisite status

---

## Cross-System Dependencies

| System | Dependency |
|--------|------------|
| `improvements-system.js` | `supremeRecycling`, `supremeMilitaryBonus`, `supremeSoldierBonus`, `supremeTankBonus`, `supremeAircraftBonus`, `supremeShipBonus`, `improvementRecoveryRate` |
| `projects-system.js` | `projectRecoveryRate` (used in project demolition salvage) |
| `server/world.js` | Reads `great_library`, `enhancedSilos`, `enhancedSpyOps`, `nuclearWarheadFacility`, `enhancedNuclearWarheads`, `enhancedSalvage`, `allianceHeadquarters`, `internet`, `abundanceTemple`, `aqueductOfLife`, `governmentMonument`, `religiousMonument` |
| `entities/Nation.js` | Reads `universalEducationLiteracyBonus`, `universalEducationTechCostReduction`, `cleanMineOperations`, `cleanAssemblyOperations`, `supremeRecycling`, `universalHealthcareDiseaseReduction`, `abundanceTempleActive`, `abundanceTempleHappinessBonus`, `aqueductOfLifeActive`, `aqueductOfLifeHappinessBonus` |
| `ui/live/game.js` | Reads `basketballStadium`, `hockeyStadium`, `soccerStadium`, `governmentMonument`, `religiousMonument` for UI state |
