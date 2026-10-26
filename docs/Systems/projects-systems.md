# Projects System

Handles advanced nation projects — more expensive than improvements, require technology levels, and unlock powerful nation-wide capabilities. Projects are built on project slots (1 per 10 territory squares) and are subject to a 14-day cooldown between builds (managed by `BuildingsSystem`).

## Overview

- **System class:** `ProjectsSystem`
- **Cost currency:** Money only (resource costs were removed)
- **Slot limit:** 1 project per 10 territory squares (managed by `BuildingsSystem`)
- **Cooldown:** 14 days between project builds
- **Broadcasting exception:** Does NOT occupy a project slot but still activates the cooldown
- **Effects:** Applied via `applyProjectEffects()` on build, recalculated daily in `World.refresh()`

---

## Project Reference

| Project | Category | Max Count | Cost | Tech Required | Prerequisite |
|---------|----------|-----------|------|---------------|--------------|
| Missile Silo | Military | 3 | $8,000,000 | 500 | — |
| Iron Curtain Defense System | Military | 3 | $12,000,000 | 500 | — |
| Military Command Center | Military | 3 | $9,000,000 | 750 | — |
| Advanced Military Academy | Military | 1 | $28,000,000 | 1,500 | — |
| National University | Education | 3 | $10,000,000 | 500 | — |
| Advanced University | Education | 1 | $20,000,000 | 600 | University (1) |
| Emergency Medical Hub | Healthcare | 3 | $6,000,000 | 500 | — |
| Government Monument | Administration | 1 | $32,000,000 | 1,000 | — |
| Religious Monument | Administration | 1 | $32,000,000 | 1,000 | — |
| Intelligence Operations Center | Military | 5 | $11,000,000 | 750 | — |
| SWAT Operations Center | Security | 3 | $8,000,000 | 750 | — |
| Advanced Research Institute | Science | 5 | $15,000,000 | 1,000 | — |
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
| Trade Hub | Economic | 3 | $5,000,000 | 500 | — |
| Salvage Yard | Infrastructure | 1 | $8,000,000 | 600 | — |
| Military Salvage Operations | Military | 3 | $6,000,000 | 700 | — |

---

## Projects by Category

### Military

#### Missile Silo
- **Max count:** 3
- **Cost:** $8,000,000
- **Tech required:** 500
- **Effect:** Produces 1 missile per day, stores up to 5 missiles per silo
- **System effect:** `missileCapacity = count * 5`; initializes `nation.military.missiles = 0`
- **Daily production:** 1 missile per silo per day (up to capacity), via `produceMissiles()`
- **Wonder interaction:** `enhancedSilos` wonder doubles production rate (2 per silo)

#### Iron Curtain Defense System
- **Max count:** 3
- **Cost:** $12,000,000
- **Tech required:** 500
- **Effect:** 15% chance to intercept incoming missiles per system (max 45%)
- **System effect:** `missileInterception = Math.min(0.45, count * 0.15)`
- **Usage:** Checked by `interceptMissile()` when a missile is launched at the nation

#### Military Command Center
- **Max count:** 3
- **Cost:** $9,000,000
- **Tech required:** 750
- **Effect:** +1 offensive & defensive war slot per center (base 2 slots)
- **System effect:** `offensiveWarSlots = 2 + count`; `defensiveWarSlots = 2 + count`
- **Server usage:** `server/world.js:2243` uses `2 + (n.projects.commandCenter || 0)` for war slot calculation

#### Advanced Military Academy
- **Max count:** 1
- **Cost:** $28,000,000
- **Tech required:** 1,500
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
- **Effect:** Produces 3 spies per day, holds up to 10 spies per center
- **System effect:** `spyCapacity = count * 10`; initializes `nation.military.spies = 0`
- **Daily production:** 3 spies per center per day (up to capacity), via `produceSpies()`
- **Wonder interaction:** `enhancedSpyOps` wonder increases production (5 per center instead of 3)

---

### Education

#### National University
- **Max count:** 3
- **Cost:** $10,000,000
- **Tech required:** 500
- **Effect:** +10% literacy rate, +3 happiness, -5% tech costs per university
- **System effects:**
  - `universityLiteracyBonus = count * 0.10`
  - `universityHappinessBonus = count * 3`
  - `techCostReduction = count * 0.05`
- **Stacking:** Benefits stack up to 3 universities

#### Advanced University
- **Max count:** 1
- **Cost:** $20,000,000
- **Tech required:** 600
- **Prerequisite:** 1 National University (`requires: 'university'`, `requireCount: 1`)
- **Effect:** +10% research speed; prerequisite for the Great Library wonder
- **System effect:** `researchSpeedBonus = 0.10`
- **Server usage:** `server/world.js:813` adds `0.1` to research speed when `advancedUniversity` is built

---

### Healthcare

#### Emergency Medical Hub
- **Max count:** 3
- **Cost:** $6,000,000
- **Tech required:** 500
- **Effect:** -10% disease rate, +5 happiness per hub
- **System effects:**
  - `ambulanceDiseaseReduction = count * 0.10`
  - `ambulanceHappinessBonus = count * 5`

---

### Administration

#### Government Monument
- **Max count:** 1
- **Cost:** $32,000,000
- **Tech required:** 1,000
- **Effect:** Locks government choice forever, population always approves
- **System effects:** `governmentLocked = true`; `governmentApprovalLocked = true`
- **Special:** PERMANENT — Cannot be demolished once built!
- **Server usage:** `server/world.js:843` checks government/religion locking

#### Religious Monument
- **Max count:** 1
- **Cost:** $32,000,000
- **Tech required:** 1,000
- **Effect:** Locks religion choice forever, population always approves
- **System effects:** `religionLocked = true`; `religionApprovalLocked = true`
- **Special:** PERMANENT — Cannot be demolished once built!

---

### Security

#### SWAT Operations Center
- **Max count:** 3
- **Cost:** $8,000,000
- **Tech required:** 750
- **Effect:** -15% crime rate, +2 happiness per center
- **System effects:**
  - `swatCrimeReduction = count * 0.15`
  - `swatHappinessBonus = count * 2`
- **Note:** Description says 10% but code applies 15% per center

---

### Science

#### Advanced Research Institute
- **Max count:** 5
- **Cost:** $15,000,000
- **Tech required:** 1,000
- **Effect:** When 5 are built, doubles Research Lab bonus (from 3% per lab to 6% per lab)
- **Category:** science
- **Server usage:** `server/world.js:819` checks `advancedResearch === 5` for 6% research time reduction
- **Note:** This project enables the effect but the actual calculation is in `World.js`, not in `applyProjectEffects`

---

### Infrastructure

#### Advanced Police Stations
- **Max count:** 3
- **Cost:** $8,000,000
- **Tech required:** 800
- **Effect:** -10% crime rate, +2 happiness per center
- **System effects:**
  - `enhancedPoliceCrimeReduction = count * 0.10`
  - `enhancedPoliceHappinessBonus = count * 2`

#### National Broadcasting Network
- **Max count:** 1
- **Cost:** $10,000,000
- **Tech required:** 300
- **Effect:** Allows voting on color motions in World Forum and eligibility for Congress seats
- **System effects:** `worldForumAccess = true`; `colorVotingEnabled = true`; `congressEligible = true`
- **Special:** Does NOT occupy a project slot but activates project cooldown
- **Server usage:** `server/world.js:1080, 1722, 1725, 1728, 1747, 1748, 2505` checks `broadcasting` for World Forum voting and Congress eligibility

#### Advanced Recycling Operations
- **Max count:** 1
- **Cost:** $20,000,000
- **Tech required:** 800
- **Effect:** Doubles recycling center effectiveness but reduces happiness
- **System effect:** `enhancedRecycling = true`
- **Improvement interaction:** `improvements-system.js` checks `nation.projectEffects.enhancedRecycling` to apply -1 happiness per recycling center

#### Salvage Yard
- **Max count:** 1
- **Cost:** $8,000,000
- **Tech required:** 600
- **Effect:** Recovers a portion of building costs when demolishing improvements and projects
- **System effect:** `resourceRecovery = true`
- **Demolition interaction:** `demolishProject()` and `improvements-system.js` check `nation.projectEffects.resourceRecovery` to refund a percentage of building costs on demolition

#### Advanced Agriculture
- **Max count:** 1
- **Cost:** $10,000,000
- **Tech required:** 800
- **Prerequisite:** 5 Farms (`requires: 'farm'`, `requireCount: 5`)
- **Effect:** Each farm now covers 2,000,000 population instead of 1,000,000
- **System effect:** `farmDoubling = true`
- **Improvement interaction:** `improvements-system.js` checks `nation.projectEffects.farmDoubling` to double farm coverage

#### Farm Synergy
- **Max count:** 1
- **Cost:** $15,000,000
- **Tech required:** 1,000
- **Prerequisite:** 5 Farms (`requires: 'farm'`, `requireCount: 5`)
- **Effect:** When 5 farms are built, stack bonus increases from 50% to 100%
- **System effect:** `farmMaxStackBonus100 = true`
- **Improvement interaction:** `improvements-system.js` checks `nation.projectEffects.farmMaxStackBonus100`

#### Advanced Well Drilling
- **Max count:** 1
- **Cost:** $10,000,000
- **Tech required:** 800
- **Prerequisite:** 5 Wells (`requires: 'well'`, `requireCount: 5`)
- **Effect:** Each well now covers 2,000,000 population instead of 1,000,000
- **System effect:** `wellDoubling = true`
- **Improvement interaction:** `improvements-system.js` checks `nation.projectEffects.wellDoubling`

#### Well Synergy
- **Max count:** 1
- **Cost:** $15,000,000
- **Tech required:** 1,000
- **Prerequisite:** 5 Wells (`requires: 'well'`, `requireCount: 5`)
- **Effect:** When 5 wells are built, stack bonus increases from 50% to 100%
- **System effect:** `wellMaxStackBonus100 = true`
- **Improvement interaction:** `improvements-system.js` checks `nation.projectEffects.wellMaxStackBonus100`

---

### Diplomacy

#### Financial Assistance Office
- **Max count:** 1
- **Cost:** $15,000,000
- **Tech required:** 800
- **Effect:** Allows sending monetary and technological aid to allied nations; enhances Intelligence Pacts
- **System effects:**
  - `financialAidEnabled = true`
  - `techAidEnabled = true`
  - `maxAidSlots = 3`
  - `intelligencePactBonus = true`
- **Server usage:** `server/diplomacy.js:125` checks `financialAssistanceOffice` for aid calculations

#### Office of Relationships
- **Max count:** 1
- **Cost:** $13,000,000
- **Tech required:** 500
- **Effect:** Allows changing friends, best friends, foes, and nemesis
- **System effect:** `changeableRelationships = true`
- **Server usage:** `server/diplomacy.js:17` checks `officeOfRelationships` to allow relationship changes

---

### Economic

#### Sports Betting Complex
- **Max count:** 1
- **Cost:** $15,000,000
- **Tech required:** 600
- **Effect:** +33% taxable income but +33% crime rate
- **System effects:**
  - `sportsBettingTaxBonus = 0.33`
  - `sportsBettingCrimeIncrease = 0.33`
- **Server usage:** `server/sports.js:109` checks `sportsBetting` for sports betting mechanics

#### Trade Hub
- **Max count:** 3
- **Cost:** $5,000,000
- **Tech required:** 500
- **Effect:** Unlocks permanent trade agreements and unlimited trade proposals
- **System effects:** `permanentTrades = true`; `unlimitedTradeProposals = true`
- **Server usage:** `server/trade.js:24` checks `tradeHub` for permanent trade agreements; `server/world.js:625` references it for demolition restrictions

---

### Military (Salvage)

#### Elite Military Training Program
- **Max count:** 1
- **Cost:** $20,000,000
- **Tech required:** 750
- **Effect:** Doubles barracks effectiveness bonus (from 10% to 20% per barracks)
- **System effect:** `enhancedBarracksEfficiency = true`
- **Improvement interaction:** `improvements-system.js` checks `nation.projectEffects.enhancedBarracksEfficiency`

#### Advanced Tank Manufacturing
- **Max count:** 1
- **Cost:** $26,000,000
- **Tech required:** 1,000
- **Effect:** Doubles factory effectiveness bonus (from 10% to 20% per factory)
- **System effect:** `enhancedFactoryEfficiency = true`
- **Improvement interaction:** `improvements-system.js` checks `nation.projectEffects.enhancedFactoryEfficiency`

#### Advanced Aircraft Systems
- **Max count:** 1
- **Cost:** $32,000,000
- **Tech required:** 1,250
- **Effect:** Doubles airforce base effectiveness bonus (from 10% to 20% per base)
- **System effect:** `enhancedAirforceEfficiency = true`
- **Improvement interaction:** `improvements-system.js` checks `nation.projectEffects.enhancedAirforceEfficiency`

#### Advanced Naval Operations
- **Max count:** 1
- **Cost:** $28,000,000
- **Tech required:** 1,100
- **Effect:** Doubles harbor effectiveness bonus (from 10% to 20% per harbor)
- **System effect:** `enhancedNavyEfficiency = true`
- **Improvement interaction:** `improvements-system.js` checks `nation.projectEffects.enhancedNavyEfficiency`

#### Military Salvage Operations
- **Max count:** 3
- **Cost:** $6,000,000
- **Tech required:** 700
- **Effect:** 9% salvage rate per project (max 27% with 3 projects)
- **System effect:** `militarySalvageRate = count * 0.09`
- **Server usage:** `systems/war-system.js:1335` checks `nation.projects.militarySalvage` and `nation.projectEffects.militarySalvageRate` for post-battle salvage

---

## Mechanics

### Building
Projects are built via the `build_project` event (delegated from `BuildingsSystem.buildProject`). Checks performed:

1. Project type exists in `projectTypes`
2. Current count is below `maxCount`
3. Nation meets tech requirement (`nation.tech >= project.techRequired`)
4. Prerequisite requirement met (sum of `nation.projects[requires]` + `nation.improvements[requires]` >= `requireCount`, default 5)
5. Bonus resource requirement (if `bonusRequirement` is set)
6. Nation can afford the money cost (`canAffordProject`)
7. Cost deducted via `payProjectCost`
8. Count incremented on `nation.projects[type]`
9. Effects applied via `applyProjectEffects`
10. Wonder effects recalculated for farm/well projects
11. `project_built` event emitted

### Demolishing
Projects are demolished via the `demolish_project` event. Checks performed:
1. Nation owns at least 1 of the project type
2. Project is not permanent (`permanent` flag — Government Monument and Religious Monument cannot be demolished)
3. Salvage recovery: if `resourceRecovery` is active (from Salvage Yard project), refunds a percentage of the money cost (default 10%, enhanced by `wonderEffects.projectRecoveryRate` or `projectEffects.projectRecoveryRate`)
4. Count decremented
5. Effects reapplied via `applyProjectEffects`
6. Wonder effects recalculated for farm/well projects
7. `project_demolished` event emitted

### Daily Processing
`processDaily(nation)` is called each game day:
1. Missile production: 1 missile per silo per day (unless wonder-enhanced production overrides)
2. Spy production: 3 spies per center per day (unless wonder-enhanced production overrides)
3. Military force penalty: if more than 25% of population is in military/weapons, -10 happiness

### Missile Operations
- `launchMissile(data)` — consumes 1 missile, calculates damage based on type (standard 1x, nuclear 5x, precision 0.8x), emits `missile_launched`
- `interceptMissile(data)` — rolls against `missileInterception` chance; if successful, damage reduced to 0

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
`canAffordProject(nation, project)` checks `nation.money >= project.cost.money`. Since resources were removed from the economy, only money is validated.

### Query Methods
- `getProjectCount(nation, projectType)` — returns current count (defaults to 0)
- `getNationProjects(nation)` — returns all project types with count, affordability, maxed status, tech/prerequisite/bonus requirement status
- `getProjectInfo(data)` — returns type definition plus affordability, count, and requirement status for the current nation

---

## Cross-System Dependencies

| System | Dependency |
|--------|------------|
| `improvements-system.js` | Projects enhance improvement effects (enhancedBarracks, enhancedFactory, enhancedAirforce, enhancedNavy, enhancedRecycling, farmDoubling, wellDoubling, farmMaxStackBonus100, wellMaxStackBonus100) |
| `wonders-system.js` | Salvage Yard required for some wonders; enhancedSalvage doubles recovery; enhancedMissileProduction/enhancedSpyProduction override daily production |
| `server/world.js` | Reads `tradeHub`, `salvageYard`, `broadcasting`, `commandCenter`, `financialAssistanceOffice`, `advancedUniversity`, `advancedResearch`, government/religion statues for various mechanics |
| `server/trade.js` | Checks `tradeHub` for permanent trade agreements |
| `server/diplomacy.js` | Checks `officeOfRelationships` for relationship changes, `financialAssistanceOffice` for aid |
| `server/sports.js` | Checks `sportsBetting` for sports betting |
| `systems/war-system.js` | Checks `militarySalvage` for post-battle salvage rates |
| `systems/diplomacy-system.js` | Checks `officeOfRelationships` for changeable relationships |
