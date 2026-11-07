# Resource System — Developer Reference

This document explains fully the Resource System: staged mineral resources (7 minerals × 5 stages), food/water production and consumption, World Bank staged pricing with complex currency-based tax rates, global resource monitoring, and food/water timed bonus effects.

---

## 1. Overview

| Item | Value |
|------|-------|
| **System class:** | `ResourceSystem` |
| **Primary file:** | `systems/Resource/resource-system.js` |
| **Update frequency:** | Every game turn via `processTurn()` and `processFoodWater()`; bonuses applied via `applyActiveBonuses()` |
| **Resource types:** | 7 minerals (staged) + food/water (flat) |
| **Stages per mineral:** | 5 (raw, stage1, stage2, stage3, manufactured) |
| **Total market items:** | 37 (35 mineral stages + food + water) |

The Resource System is the truth source for all resource production, staging, transitions, pricing, taxation, and food/water consumption bonuses. It does not spawn citizens or handle combat — it manages the resource economy layer only.

---

## 2. Resource Reference

### 7 Minerals (Staged — 5 stages each)

| Mineral | Raw Name | Stage 1 | Stage 2 | Stage 3 | Manufactured | Base Raw Price |
|---------|----------|---------|---------|---------|--------------|----------------|
| Steel | Iron Ore | Pig Iron | Steel Billet | Rolled Steel | Steel | 1.0 |
| Bronze | Copper Ore | Tin Ore | Bronze Alloy | Bronze Ingot | Bronze | 1.0 |
| Lead | Galena Ore | Lead Concentrate | Refined Lead | Lead Ingot | Lead | 1.0 |
| Aluminum | Bauxite Ore | Alumina | Aluminum Ingot | Aluminum Sheet | Aluminum | 1.0 |
| Copper | Copper Ore | Copper Concentrate | Blister Copper | Copper Ingot | Copper | 1.0 |
| Uranium | Uranium Ore | Yellowcake | Enriched Uranium | Uranium Fuel Rod | Uranium | 1.0 |
| Gasoline | Crude Oil | Naphtha | Refinery Blend | Finished Gasoline | Gasoline | 1.0 |

**Stage keys:** `raw`, `stage1`, `stage2`, `stage3`, `manufactured`

### Food & Water (Flat — No Stages)

| Resource | Source | Production Rate | Base Price |
|----------|--------|-----------------|------------|
| Food | Food Production project | 0.25 per turn per project | Configurable (default 50) |
| Water | Water Production project | 0.25 per turn per project | Configurable (default 50) |

---

## 3. Per-Stage Tracking

Each nation tracks every stage independently:

```javascript
nation.resources[mineral] = {
  raw: 0, stage1: 0, stage2: 0, stage3: 0, manufactured: 0
}
nation.resourceStageTurn[mineral] = {
  raw: 0, stage1: 0, stage2: 0, stage3: 0
}
```

- **Amounts** (`nation.resources[mineral]`): How many units exist at each stage
- **Timers** (`nation.resourceStageTurn[mineral]`): How many turns each stage's batch has waited before becoming eligible to transition
- **Terminal stage:** `manufactured` has no timer (cannot transition further)

---

## 4. Transition Mechanics

### Conversion Ratio

| Transition | Input | Output | Ratio |
|------------|-------|--------|-------|
| raw → stage1 | 2 raw | 1 stage1 | 2:1 |
| stage1 → stage2 | 2 stage1 | 1 stage2 | 2:1 |
| stage2 → stage3 | 2 stage2 | 1 stage3 | 2:1 |
| stage3 → manufactured | 2 stage3 | 1 manufactured | 2:1 |

**Total: 16 raw → 1 manufactured** (2⁴ = 16)

### Transition Improvements

All 7 transition improvements are mapped in `_transitionImprovementKey()` and used in `processTurn()` and `calculateTransitionCapacity()`:

| Mineral | Improvement Key | Max Count | Cost | Input Units / Cycle |
|---------|----------------|-----------|------|-------------------|
| Steel | `steelFoundry` | 5 | $1,000,000 | count × 2 |
| Bronze | `bronzeCasting` | 5 | $1,000,000 | count × 2 |
| Lead | `leadCasting` | 5 | $1,000,000 | count × 2 |
| Aluminum | `aluminumExtrusion` | 5 | $1,000,000 | count × 2 |
| Copper | `copperDrawing` | 5 | $1,000,000 | count × 2 |
| Uranium | `uraniumFuelFabrication` | 5 | $1,500,000 | count × 2 |
| Gasoline | `gasolineBlending` | 5 | $1,000,000 | count × 2 |

### Stacking Bonuses

| Count | Bonus Transitions | Total Transitions (count + bonus) |
|-------|-------------------|----------------------------------|
| 1–2 | +0 | 1–2 |
| 3–4 | +1 | 4–5 |
| 5 | +2 | 7 |

With `supremeAssembly` wonder active:
- Count 3–4: +2 bonus
- Count 5: +5 bonus
- Timer gate reduced from 4 to 3 turns

### Timer Gate

| Stage | Base Timer Gate | With Supreme Assembly |
|-------|----------------|----------------------|
| Any stage | 4 turns | 3 turns |

A stage must wait `timerGate` turns before its units are eligible to transition. Timers reset to 0 when new units enter a stage (production or transition-in).

---

## 5. Production Improvements

| Mineral | Improvement Key | Name | Max Count | Cost | Produces |
|---------|----------------|------|-----------|------|----------|
| Steel | `steelMill` | Steel Mill | 5 | $750,000 | steel.raw |
| Bronze | `bronzeSmelter` | Bronze Smelter | 5 | $750,000 | bronze.raw |
| Lead | `leadRefinery` | Lead Refinery | 5 | $750,000 | lead.raw |
| Aluminum | `aluminumSmelter` | Aluminum Smelter | 5 | $750,000 | aluminum.raw |
| Copper | `copperRefinery` | Copper Refinery | 5 | $750,000 | copper.raw |
| Uranium | `uraniumEnrichmentPlant` | Uranium Enrichment Plant | 5 | $750,000 | uranium.raw |
| Gasoline | `gasolineRefinery` | Gasoline Refinery | 5 | $750,000 | gasoline.raw |

**Raw production per improvement per game turn:** `baseProductionRate (0.1) × count × stackBonus`

Stack bonuses by count:
- 1 stack: 0%
- 2 stacks: 7.5%
- 3 stacks: 25%
- 4 stacks: 37.5%
- 5 stacks: 50%

With `supremeMining` wonder active and count ≥ 3, stack bonus doubles:
- Count 3: 25% → 50%
- Count 4: 37.5% → 75%
- Count 5: 50% → 100%

---

## 6. Process Turn Flow (`processTurn`)

Called each game turn:

1. **Raw production** added to `raw` stage (timer reset to 0)
2. **Timers increment** for every stage with amount > 0 (exclude `manufactured`)
3. **Transitions** process in order: raw→stage1→stage2→stage3→manufactured
   - For each stage: while transitions remain AND timer ≥ gate AND amount ≥ 2:
     - Consume 2 units from current stage
     - Produce 1 unit at next stage
     - Reset timers for both stages
4. Each stage can transition at most once per turn (timer resets to 0 after transitioning)

---

## 7. Food & Water Production (`processFoodWater`)

Called each game turn:

```javascript
food += 0.25 × foodProductionCount
water += 0.25 × waterProductionCount
```

Food/water are flat numbers (no stages). Produced by `foodProduction` and `waterProduction` projects (max 3 each).

---

## 8. World Bank Pricing (`getWorldBankPrice`)

All 37 market items are buyable/sellable via World Bank:

| Item Type | Key Format | Examples |
|-----------|-----------|----------|
| Mineral stages | `{mineral}-{stage}` | `steel-raw`, `steel-stage1`, `steel-manufactured` |
| Food/Water | flat | `food`, `water` |

### Price Formula

```
basePrice = rawBasePrice(1.0) × stageMultiplier[stage]    // minerals only
food/water basePrice = FOOD_WATER_BASE_PRICE (default 50)

supplyFactor = clamp(1 - (globalTotalAmount / targetStock), 0.5, 2.0)
producerFactor = clamp(1 + (producerCount / totalNations), 1.0, 1.5)

fwPurchase72hFactor = 1 + sum(amount × decayWeight)    // food/water only, max +100%
decayWeight = max(0, 1 - ageInHours / 72)

preTaxPrice = basePrice × supplyFactor × producerFactor × fwPurchaseFactor
taxRate = calculateResourceTaxRate(nation, worldBankState)  // 0% to 15%

buyPrice = preTaxPrice × (1 + taxRate)
sellPrice = preTaxPrice × (1 - taxRate)
```

### `calculateResourceTaxRate` (Complex, Currency-Based)

Not a flat rate — mirrors `WorldBankSystem.calculateTaxInterestRate()`:

| Factor | Description |
|--------|-------------|
| Currency usage | More nations on currency = more stable = lower rate |
| Stacked taxes | More nations stacking taxes = higher rate |
| Volatility | Other currencies rising/falling = uncertainty = higher rate |
| Global tax multiplier | Inverse of global rise multiplier |
| World Lottery impact | Inverse: bank payouts lower tax rates |

Clamped 0% to 15%.

### Food/Water 72-Hour Purchase Tracking

Purchases in the last 72 hours raise food/water prices. Effect decays linearly — oldest purchase has least effect. `recordFoodWaterPurchase()` records each buy with timestamp; `getFoodWaterPurchase72hFactor()` computes the decay-weighted factor.

---

## 9. Food & Water Consumption (`consumeFoodWater`)

Consume 1 unit of a specific food/water type, applying timed bonuses/penalties for 2 turns:

| Aspect | Value |
|--------|-------|
| Resource consumed | 1 unit of `food` or `water` |
| Intuition cost | 10 per consumption (unless `skipIntuition`) |
| Duration | 2 turns |
| Stacking | Multiple consumptions stack together |

### Food Types (Military Benefit + Econ Penalty)

| Food | Benefit | Penalty | Duration | Intuition |
|------|---------|---------|----------|-----------|
| burger | +50% Soldier Effectiveness | -7.5% Tax Rate | 2 turns | 10 |
| cake | +50% Tank Effectiveness | -10% Building Cost | 2 turns | 10 |
| cookie | +50% Aircraft Effectiveness | -10% Building Upkeep | 2 turns | 10 |
| donut | +50% Ship Effectiveness | -10% Taxable Income | 2 turns | 10 |
| hotdog | +25% Military Strength | -50% Energy Regen | 2 turns | 10 |
| pizza | +25% Military Morale | -15% Intuition Regen | 2 turns | 10 |
| ramen | -15% Soldier Purchase & Upkeep Cost | -20% Literacy Bonus | 2 turns | 10 |
| salad | -15% Tank Purchase & Upkeep Cost | -15% Happiness | 2 turns | 10 |
| steak | -15% Aircraft Purchase & Upkeep Cost | -15% Environment | 2 turns | 10 |
| sushi | -15% Ship Purchase & Upkeep Cost | +15% Pollution | 2 turns | 10 |
| taco | +33% Nuke & Missile Infra Damage | +15% Crime | 2 turns | 10 |

### Water Types (Econ Benefit + Military Penalty)

| Water | Benefit | Penalty | Duration | Intuition |
|-------|---------|---------|----------|-----------|
| beer | +7.5% Tax Rate | -50% Tank Effectiveness | 2 turns | 10 |
| coffee | +10% Building Cost | -50% Aircraft Effectiveness | 2 turns | 10 |
| energy-drink | +10% Building Upkeep | -50% Ship Effectiveness | 2 turns | 10 |
| juice | +10% Taxable Income | -25% Military Strength | 2 turns | 10 |
| liquor | +50% Energy Regen | -25% Military Morale | 2 turns | 10 |
| milk | +15% Intuition Regen | +15% Soldier Purchase & Upkeep | 2 turns | 10 |
| milkshake | +20% Literacy Bonus | +15% Tank Purchase & Upkeep | 2 turns | 10 |
| smoothie | +15% Happiness | +15% Aircraft Purchase & Upkeep | 2 turns | 10 |
| soda | +15% Environment | +15% Ship Purchase & Upkeep | 2 turns | 10 |
| water | -15% Pollution | -33% Nuke & Missile Infra Damage | 2 turns | 10 |
| wine | -15% Crime | -50% Soldier Effectiveness | 2 turns | 10 |

---

## 10. Bonus Application (`applyActiveBonuses`)

Called each game turn from `world.js` `refresh()`:

1. Decrement `turnsRemaining` on each active bonus
2. Remove expired bonuses (turnsRemaining ≤ 0)
3. Apply benefit via `effectKeyMap` mapping (isBenefit = true)
4. Apply penalty via `effectKeyMap` mapping (isBenefit = false)
5. Replace active list with surviving bonuses

### Effect Key Map

| Effect Key | Target | Mode | Description |
|------------|--------|------|-------------|
| soldierEffectiveness | improvementEffects.soldierEffectiveness | mult1plus | ×(1 + val) |
| tankEffectiveness | improvementEffects.tankEffectiveness | mult1plus | ×(1 + val) |
| aircraftEffectiveness | improvementEffects.aircraftEffectiveness | mult1plus | ×(1 + val) |
| shipEffectiveness | improvementEffects.shipEffectiveness | mult1plus | ×(1 + val) |
| militaryStrength | policyEffects.militaryStrength | mult1plus | ×(1 + val) |
| militaryMorale | nationStats.militaryMorale | mult1plus | ×(1 + val) |
| purchaseCost | tempMilitaryCost | costUpDown | benefit ×(1-val), penalty ×(1+val) |
| upkeepCost | tempMilitaryUpkeep | costUpDown | benefit ×(1-val), penalty ×(1+val) |
| nukeMissileInfraDamage | policyEffects.nukeMissileInfraDamage | mult1plus | ×(1 + val) |
| taxRate | policyEffects.taxEfficiency | mult1plus | ×(1 + val) |
| buildingCostReduction | policyEffects.buildingCostReduction | mult1minus | ×(1 - val) |
| buildingUpkeepReduction | policyEffects.buildingUpkeepReduction | mult1minus | ×(1 - val) |
| taxableIncome | improvementEffects.taxableIncomeBonus | mult1plus | ×(1 + val) |
| energyRegen | improvementEffects.energyRegenModifier | mult1plus | ×(1 + val) |
| intuitionRegen | improvementEffects.intuitionRegenModifier | mult1plus | ×(1 + val) |
| literacyBonus | improvementEffects.literacyBonus | mult1plus | ×(1 + val) |
| happiness | edictEffects.happinessModifier | add | += val |
| environment | improvementEffects.treeEnvironmentBonus | addX5 | += val × 5 |
| pollution | improvementEffects.pollutionModifier | mult1plus | ×(1 + val) |
| crime | improvementEffects.crimeModifier | mult1plus | ×(1 + val) |
| militaryRecruitmentRate | policyEffects.militaryRecruitmentRate | mult1plus | ×(1 + val) |
| militaryTrainingSpeed | policyEffects.militaryTrainingSpeed | mult1plus | ×(1 + val) |

---

## 11. Compound Key Helpers

| Method | Input | Output |
|--------|-------|--------|
| `parseCompoundKey(resourceKey)` | `'steel-manufactured'` or `'food'` | `{ resource: 'steel', stage: 'manufactured' }` or `{ resource: 'food', stage: null }` |
| `getResourceAmount(nation, resourceKey)` | nation + key | Amount at stage (staged) or flat amount (food/water) |
| `deductResource(nation, resourceKey, amount)` | nation + key + amount | true if deducted, false if insufficient |
| `addResource(nation, resourceKey, amount)` | nation + key + amount | Adds amount, creates if needed |

---

## 12. Wonder Effects (`applyWonderEffects`)

| Wonder Key | Effect | Wired To |
|------------|--------|----------|
| `supremeMining` | `supremeMineEfficiency = true`, `supremeMineStackBonus = 0.50` | `nation.wonderEffects` — read by `calculateRawProduction()` |
| `supremeAssembly` | `supremeAssemblyEfficiency = true`, `supremeAssemblyTimerReduction = 1` | `nation.wonderEffects` — read by `_getTransitionStackingBonus()` and `_getTimerGate()` |

Called from `wonders-system.js` `buildWonder()` / `demolishWonder()`. Clean Mining / Clean Assembly effects are wired in `nation-system.js`.

---

## 13. Global Monitoring (`computeGlobalResources`)

Computed every `refresh()` / `processTurn()` by iterating all nations:

```javascript
{
  steel: {
    raw: { totalAmount: 0, producerCount: 0 },
    stage1: { totalAmount: 0, producerCount: 0 },
    stage2: { totalAmount: 0, producerCount: 0 },
    stage3: { totalAmount: 0, producerCount: 0 },
    manufactured: { totalAmount: 0, producerCount: 0 },
    rawProducerCount: 0,
    totalAllStages: 0
  },
  // ... same for bronze, lead, aluminum, copper, uranium, gasoline
  food: { totalAmount: 0, producerCount: 0 },
  water: { totalAmount: 0, producerCount: 0 }
}
```

---

## 14. Catalog Resources (`buildCatalogResources`)

Returns 37-item staged list:
- 7 minerals × 5 stages = 35 items (`steel-raw` through `gasoline-manufactured`)
- `food`, `water`

Used to replace `r.resources.basicResources` + `r.resources.manufacturedResources` in `catalog()`.

---

## 15. Key Methods

### Default State

| Method | Returns |
|--------|---------|
| `getDefaultNationResources()` | Full staged resource object (7 minerals + food/water flat + resourceStageTurn + tempMilitaryCost + tempMilitaryUpkeep) |
| `getDefaultResourceStageTurn()` | Stage turn object (no `manufactured` — terminal stage) |
| `getDefaultResourceWonderEffects()` | `{ supremeMining: {active: false, stackBonus: 0}, supremeAssembly: {active: false, timerReduction: 0} }` |

### Mineral Production & Transition

| Method | Returns |
|--------|---------|
| `calculateRawProduction(nation, resourceKey)` | Raw units produced this turn (0.1 × count × stack bonus, supremeMining doubles stackBonus at stack ≥3) |
| `calculateTransitionCapacity(nation, resourceKey)` | Input units per cycle (count × 2) |
| `processTurn(nation)` | Full per-turn processing (production → timers → transitions) |
| `_getTimerGate(nation)` | Effective timer gate (4 base, 3 with supremeAssembly) |
| `_getTransitionStackingBonus(count, nation)` | Bonus transitions (0, +1, +2 base; +2, +5 with supremeAssembly) |

### Food/Water Production

| Method | Returns |
|--------|---------|
| `processFoodWater(nation)` | food += 0.25 × foodCount, water += 0.25 × waterCount |

### World Bank Pricing

| Method | Returns |
|--------|---------|
| `calculateResourceTaxRate(nation, worldBankState)` | Tax rate decimal (0–0.15), complex currency-based formula |
| `getFoodWaterPurchase72hFactor(resourceKey, worldBankState)` | Price factor (1.0 to 2.0) based on 72h purchase history with decay |
| `recordFoodWaterPurchase(resourceKey, amount, worldBankState, at)` | Records purchase, prunes entries older than 72h |
| `getWorldBankPrice(resourceKey, stage, globalData, nation, worldBankState)` | `{ buyPrice, sellPrice, preTaxPrice, taxRate }` |

### Food/Water Consumption

| Method | Returns |
|--------|---------|
| `consumeFoodWater(nation, type, skipIntuition)` | `{ success, benefit, penalty, turnsRemaining, type, category, intuitionConsumed }` |

### Bonus Application

| Method | Description |
|--------|-------------|
| `applyActiveBonuses(nation)` | Decrement timers, remove expired, apply effects via `_applyEffect()` |
| `_applyEffect(nation, effect, isBenefit)` | Apply single benefit/penalty via effectKeyMap |
| `_resolveTarget(nation, path)` | Resolve dotted path from nation to `{ obj, prop }` |

### Compound Key Helpers

| Method | Description |
|--------|-------------|
| `parseCompoundKey(resourceKey)` | Parse `'steel-manufactured'` → `{resource, stage}` |
| `getResourceAmount(nation, resourceKey)` | Get amount (staged or flat) |
| `deductResource(nation, resourceKey, amount)` | Deduct amount (staged or flat) |
| `addResource(nation, resourceKey, amount)` | Add amount (staged or flat) |

### Catalog

| Method | Description |
|--------|-------------|
| `buildCatalogResources()` | Build 37-item staged catalog list |

### Wonder Effects

| Method | Description |
|--------|-------------|
| `applyWonderEffects(nation, wonderKey, isBuilding)` | Apply wonder build/demolish effects to resource system |

---

## 16. Integration Points

| System | Relationship |
|--------|-------------|
| `systems/Building/wonders-system.js` | Calls `applyWonderEffects()` for `supremeMining`/`supremeAssembly` on build/demolish |
| `systems/Building/improvements-system.js` | Production/transition improvements defined here; rates computed by ResourceSystem |
| `systems/Building/projects-system.js` | Food/water projects defined here; rates consumed by ResourceSystem |
| `server/world.js` | Calls `processTurn()`, `processFoodWater()`, `applyActiveBonuses()` in refresh/processTurn; `getWorldBankPrice()` for pricing |
| `systems/World/world-bank-system.js` | Provides `worldBankState` (currency stats, targets, lottery impact, global rise multiplier) for tax rate calculation |
| `entities/Nation.js` | Stores `nation.resources`, `nation.resourceStageTurn`, `nation.activeResourceBonuses`, `nation.tempMilitaryCost`, `nation.tempMilitaryUpkeep`, `nation.wonderEffects` |

---

## 17. Design Principles

- **Staged minerals:** Each mineral tracks 5 stages independently with separate amounts and timers
- **2:1 conversion:** Every transition consumes 2 units of stage N to produce 1 unit of stage N+1; total 16 raw → 1 manufactured
- **Timer-gated transitions:** Stages must wait 4 turns (3 with supremeAssembly) before transitioning; timers reset on production or transition-in
- **Live pollution accumulators:** `rebuildAllImprovementEffects()` and `rebuildAllProjectEffects()` reset pollution accumulators to 0 before re-applying all types — prevents compounding on repeated build/demolish
- **Complex tax rates:** Currency-based, not flat — mirrors `calculateTaxInterestRate()` with usage, stacked taxes, volatility, global multiplier, and lottery impact factors
- **Food/water 72h tracking:** Purchase history with Date.now()-based decay weighting; oldest purchases have least effect on price
- **No double-handling:** Only `BuildingsSystem` binds to build/demolish events; subsystems delegate directly
