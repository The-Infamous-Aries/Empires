# DEV Plan: Literacy Rate Audit & Rebalance

## Problem
Total literacy-rate bonuses from improvements + projects + wonders sum to ~167–180% raw, but were hard-capped at 100 via `Math.min(100, ...)`, making every bonus beyond 100 wasted and 100% literacy trivial to reach. The policy `educationBonus` path is dead code (never set).

## Changes implemented

### 1. Base tech literacy now caps at 95% at 5000 levels (was 75% at 2000)
`systems/nation-system.js:329-345` — replaced the linear `(tech/2000) * 75` formula (capped at 75) with a tiered curve:
- Tech 0–49: ~0% literacy
- Tech 50: 0.05% (starting point)
- Tech 1000: 5%
- Tech 2000: 15% (+10 in this tier)
- Tech 3000: 30% (+15 in this tier)
- Tech 4000: 50% (+20 in this tier)
- Tech 5000: 95% (+45 in this tier)

Each 1000-level tier gives progressively more literacy, so early tech gives almost nothing and late game gives large jumps. Input is clamped at 5000 tech; output maxes at 95%.

`systems/nation-system.js:355` — cap 100 → 200 (unchanged from before).

`systems/Population/population-system.js:1969` — event-based literacy changes also clamped to 200 instead of 100.

### 2. Literacy affects education progression speed (not instant)
`systems/Population/population-system.js` — `queueEducationProgressions()` rewritten:
- `literacyGrowthRate` (0.001/day, previously unused) now factors into progression speed via `growthFactor = 1 + literacyGrowthRate * 500`.
- Literacy speed bonus: `1 + min(literacy/200, 1.0)` → 1x at 0% literacy, max 2x at 200% literacy. Diminishing returns, never instant.
- Base days per level scale up: primary 7, secondary 14, higher 28, multiplied by level slowdown (1.0 / 1.5 / 2.5).
- Result at 200% literacy: primary ~4 days, secondary ~7 days, higher ~14 days. At 0% literacy: primary ~7, secondary ~21, higher ~47 days.

### 3. Higher education requires >100% literacy
`literacyRequirements.higher` raised from 75 to **120**. Citizens now need national literacy above 100% to reach higher education, making literacy past 100% meaningful.

### 4. Citizen literacy cap tracks national literacy
`grantLiteracyOnAgeTransition()` already caps non-gifted citizens at `nationLiteracy` and gifted at `nationLiteracy + 20`, so raising the national cap to 200 automatically lets citizens reach higher literacy scores over their lifespan.

## National literacy sources (additive, cap 200)

### Current list of literacy-rate sources by category

#### Base (from tech level, not a building)
| Source | File:Line | Formula | Cap | Max contribution |
|---|---|---|---|---|
| Base literacy from tech | nation-system.js:329-345 | Tiered: 0.05% @50 → 5% @1000 → 15% @2000 → 30% @3000 → 50% @4000 → 95% @5000 | tech 5000 | **95%** |

#### Improvements
| Building | File:Line | Per-unit | Max units | Max contribution | Notes |
|---|---|---|---|---|---|
| School | improvements-system.js:393, Building.js:228 | `count * 0.075` | 5 (maxLevel) | **37.5%** | `improvementEffects.literacyBonus * 100` |

#### Projects
| Project | File:Line | Per-unit | Max units | Max contribution | Notes |
|---|---|---|---|---|---|
| University | Building.js:253, nation-system.js:339-341 | `count * 0.10` | 3 (maxLevel) | **30%** | `projectEffects.universityLiteracyBonus * 100` |

#### Wonders
| Wonder | File:Line | Per-unit | Max units | Max contribution | Notes |
|---|---|---|---|---|---|
| Universal Education System | wonders-system.js:493, nation-system.js:345-346 | flat 0.25 | 1 (maxCount) | **25%** | `universalEducationLiteracyBonus = 0.25` |
| Great Library | wonders-system.js:499, 508 | `+count * 0.025` per school | 5 schools | **+12.5%** | Boosts school literacy from 37.5% → 50% total |

#### Research
| Tech | File | Effect |
|---|---|---|
| None | `assets/data/research/` | **No research tech grants literacy.** Verified: grep of `assets/data/research/` returned zero literacy/literacyBonus/educationBonus matches. Literacy base comes from `nation.tech` level itself (tiered formula, capped at 95 at 5000 tech), not from research unlocks. |

#### Policy (dead code)
| Policy effect | File:Line | Per-unit | Max units | Max contribution | Notes |
|---|---|---|---|---|---|
| educationBonus | nation-system.js:351-352 | `* 100` | — | **0%** | Never set anywhere — dead code path |

#### Edicts (affect citizen literacy gain rate, not national literacy directly)
Edicts with `literacyBoostToddler`/`literacyBoostChild` speed up citizen age-transition literacy gains (`population-system.js:2462-2475`), but do not add to `nationStats.literacy`.

### Raw maximums (additive, capped at 200)
| Scenario | Total raw literacy | Capped at |
|---|---|---|
| Base tech alone (tech 5000) | 95% | — |
| + Schools ×5 (no Great Library) | 132.5% | — |
| + Schools ×5 + Great Library | 145% | — |
| + Universities ×3 | 175% | — |
| + Universal Education wonder | **200%** | **200** |
| **Absolute max (all sources)** | **200%** | **200** |

Base tech alone now reaches 95% at 5000 tech, so every other bonus pushes well past 100%. Under the old `Math.min(100, ...)` cap all of that was wasted; now it's meaningful up to 200%.

## How literacy affects nation & population
1. **Crime** — `nation-system.js:506`: `-(literacy * 0.2)` per 1%
2. **Happiness** — `nation-system.js:536`: `+literacy * 0.10` per 1%
3. **Taxable income** — `nation-system.js:651`: `1.0 + (literacy/100) * 0.5` → +100% at 200% literacy
4. **Birth rate** — `population-system.js:2677`: `1 + (literacy - 50) / 400`
5. **Migration factor** — `population-system.js:1396`: `Math.max(0.1, literacy / 50)` → up to 4.0 at 200%
6. **Citizen education level & jobs** — `population-system.js:421-426`; higher ed now needs 120% literacy
7. **Citizen literacy score** — `population-system.js:2422`, capped at national literacy
8. **Education progression speed** — `population-system.js:queueEducationProgressions()`, driven by literacy + literacyGrowthRate

## Time to literacy
- **National literacy rate:** instant on next `calculateNationStats()` tick (no build/research delay).
- **Individual citizen literacy:** gradual via age transitions (`grantLiteracyOnAgeTransition`), lifespan-gated, capped at national literacy.
- **Education level progression:** now takes days, scales by level (higher = much slower), accelerated by literacy (max 2x) and `literacyGrowthRate`.

## Rebalancing ideas: make 100% hard, 200% very difficult

### Option A — Diminishing returns (recommended)
Replace additive sum with compounding on the remaining gap to 200:
```
literacy = 200 - (200 - base) * (1 - school) * (1 - university) * (1 - wonder) * (1 - policy)
```
Each bonus applies to what's left, so stacking gets exponentially more expensive. Reaching 100% requires serious investment; 200% is asymptotically hard.

### Option B — Per-source category caps
Cap each category independently before summing:
- Base tech: max 60
- Buildings (schools): max 20
- Projects (universities): max 10
- Wonders: max 10
- Policies: max 10
Hard cap total at 200. Max realistic = 110 without extreme stacking.

### Option C — Exponential per-unit cost
Each additional school/university contributes less literacy than the last (e.g., 1st school = 7.5%, 5th school = 2%). Discourages mass-building for literacy.

### Option D — Research/tech gates
- Literacy bonuses from schools/universities require prerequisite research techs.
- Base literacy from tech level requires exponentially more tech per percentage point past 50%.
- Universal Education wonder requires a late-game research tech.

### Option E — Wonder exclusivity / anti-synergy
- Universal Education and Great Library cannot both be active (pick one).
- Great Library reduces University literacy bonus (schools vs universities trade-off).

### Option F — Maintenance scaling
- High-literacy buildings (schools, universities) have maintenance that scales with count, making mass literacy expensive to sustain.

### Recommended combination
**A (diminishing returns) + B (per-source caps) + F (maintenance scaling)**. This keeps 100% reachable but costly, and 200% requires near-max investment across all categories with diminishing returns making the last 100 points very expensive.

## Files touched
- `systems/nation-system.js` — literacy cap 100 → 200
- `systems/Population/population-system.js` — education progression (literacyGrowthRate, scaled days, higher-ed req 120), event clamp 100 → 200
- `docs/DEV/literacy-system.md` — this plan

## Validation
- Run a game tick and assert `nationStats.literacy <= 200`
- Verify education progression `daysRemaining` > 0 even at 200% literacy (never instant)
- Verify citizens cannot start higher education until national literacy >= 120%
- Confirm no research tech grants literacy (assets/data/research has no literacy entries)
