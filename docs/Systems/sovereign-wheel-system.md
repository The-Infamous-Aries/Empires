# Sovereign Wheel System

Daily spin wheel with 152 slices. All slices equal size (1/152 probability each). 8 bad slices fixed at cardinal positions (+ pattern): Top (0), Left (38), Bottom (76), Right (114). Remaining 144 slices randomly shuffled daily at UTC midnight. Players get 1 free spin per day.

## Overview

| Item | Value |
|------|-------|
| **System class:** | `SovereignWheelSystem` |
| **Global instance:** | `window.SovereignWheelSystem` |
| **Primary config:** | `systems/Casino/sovereign-wheel-system.js` |
| **Loaded in:** | `index.html` (after `core/event-system.js`) |
| **Total slices:** | 152 (144 normal + 8 bad) |
| **Normal slices:** | 144 (shuffled daily) |
| **Bad slices:** | 8 (fixed at + pattern positions) |
| **Wheel sections:** | 8 sections of 18 normal slices between bad slices |
| **Slice probability:** | 1/152 each (all equal size) |
| **Spin frequency:** | 1 free spin per day per nation |
| **Wheel rebuild:** | Daily at UTC midnight |

> **Important:** `window.SovereignWheelSystem` is `undefined` until `systems/Casino/sovereign-wheel-system.js` is loaded in the browser.

## Wheel Layout

The wheel uses 152 equal-size slices arranged in a circle. 8 bad slices are fixed at "+ pattern" positions to create a cross pattern (cardinal points + diagonal points):

| Position | Degrees | Slice Type | Icon | Color |
|----------|---------|------------|------|-------|
| 0 | 0° (Top) | 25% Holdings Lost | `Wheel/25-loss.png` | Black |
| 19 | ~45° | 50% Holdings Lost | `Wheel/50-loss.png` | Black |
| 38 | 90° (Right) | 75% Holdings Lost | `Wheel/75-loss.png` | Black |
| 57 | ~135° | BANKRUPTCY | `Wheel/bankruptcy.png` | Black |
| 76 | 180° (Bottom) | Religious Schism | `Wheel/religion-change.png` | Black |
| 95 | ~225° | Government Overthrow | `Wheel/government-change.png` | Black |
| 114 | 270° (Left) | Military Purge | `Wheel/unit-destruction.png` | Black |
| 133 | ~315° | Population Plague | `Wheel/population-kill.png` | Black |

The remaining 144 slices are randomly shuffled into the non-bad positions each day at UTC midnight. All slices have equal arc size and equal probability (1/152 per spin).

## Slice Categories

### Currency Prizes (4 slices)

| Slice | Icon | Tier | Color | Effect |
|-------|------|------|-------|--------|
| $5,000,000 | `Wheel/5M.png` | Tier 2 | Amber | $5M cash |
| $10,000,000 | `Wheel/10M.png` | Tier 5 | Gold | $10M cash |
| $25,000,000 | `Wheel/25M.png` | Tier 6 | Red | $25M cash |
| $100,000,000 | `Wheel/100M.png` | Tier 7 | Crimson | $100M cash |

### Free Bills (3 slices)

| Slice | Icon | Tier | Color | Effect |
|-------|------|------|-------|--------|
| Free Bills 1 Day | `Wheel/1-day.png` | Tier 3 | Green | 1 day of free bills |
| Free Bills 2 Days | `Wheel/2-days.png` | Tier 4 | Blue | 2 days of free bills |
| Free Bills 3 Days | `Wheel/3-days.png` | Tier 5 | Purple | 3 days of free bills |

### Keys (9 slices)

| Slice | Icon | Tier | Color | Effect |
|-------|------|------|-------|--------|
| Key 1 × 1 | `Equipment/Key1.png` | Tier 1 | Gray | 1 Common Key |
| Key 1 × 3 | `Equipment/Key1.png` | Tier 2 | Silver | 3 Common Keys |
| Key 1 × 5 | `Equipment/Key1.png` | Tier 3 | Gold | 5 Common Keys |
| Key 2 × 1 | `Equipment/Key2.png` | Tier 4 | Silver | 1 Uncommon Key |
| Key 2 × 3 | `Equipment/Key2.png` | Tier 5 | Gold | 3 Uncommon Keys |
| Key 2 × 5 | `Equipment/Key2.png` | Tier 6 | Crimson | 5 Uncommon Keys |
| Key 3 × 1 | `Equipment/Key3.png` | Tier 5 | Gold | 1 Rare Key |
| Key 3 × 3 | `Equipment/Key3.png` | Tier 6 | Crimson | 3 Rare Keys |
| Key 3 × 5 | `Equipment/Key3.png` | Tier 7 | Epochal | 5 Rare Keys |

### Chests (7 slices)

| Slice | Icon | Tier | Color | Effect |
|-------|------|------|-------|--------|
| Chest 1 × 1 | `Equipment/chest1.png` | Tier 3 | Gray | 1 Common Chest |
| Chest 1 × 3 | `Equipment/chest1.png` | Tier 5 | Silver | 3 Common Chests |
| Chest 2 × 1 | `Equipment/chest2.png` | Tier 5 | Silver | 1 Uncommon Chest |
| Chest 2 × 2 | `Equipment/chest2.png` | Tier 6 | Gold | 2 Uncommon Chests |
| Chest 3 × 1 | `Equipment/chest3.png` | Tier 6 | Gold | 1 Rare Chest |
| Chest 3 × 2 | `Equipment/chest3.png` | Tier 7 | Crimson | 2 Rare Chests |
| Chest 4 × 1 | `Equipment/chest4.png` | Tier 8 | Epochal | 1 Sovereign Chest |

### Project & Wonder (2 slices)

| Slice | Icon | Tier | Color | Effect |
|-------|------|------|-------|--------|
| 1 Free Project | `Wheel/free-project.png` | Tier 6 | Purple | Next project fully free |
| Reset Wonder Cooldown | `Wheel/wonder-reset.png` | Tier 6 | Crimson | Reset wonder build cooldown |

### Raw Resources (7 slices)

| Slice | Icon | Tier | Color | Effect |
|-------|------|------|-------|--------|
| Raw Steel × 1040 | `Resources/steel-1.png` | Tier 4 | Gray | 1040 Raw Steel |
| Raw Bronze × 1040 | `Resources/bronze-1.png` | Tier 4 | Brown | 1040 Raw Bronze |
| Raw Lead × 1040 | `Resources/lead-1.png` | Tier 4 | Gray | 1040 Raw Lead |
| Raw Aluminum × 1040 | `Resources/aluminum-1.png` | Tier 4 | Silver | 1040 Raw Aluminum |
| Raw Copper × 1040 | `Resources/copper-1.png` | Tier 4 | Orange | 1040 Raw Copper |
| Raw Uranium × 1040 | `Resources/uranium-1.png` | Tier 4 | Green | 1040 Raw Uranium |
| Raw Gasoline × 1040 | `Resources/gasoline-1.png` | Tier 4 | Yellow | 1040 Raw Gasoline |

### Manufactured Resources (7 slices)

| Slice | Icon | Tier | Color | Effect |
|-------|------|------|-------|--------|
| Mfg Steel × 65 | `Resources/steel-4.png` | Tier 5 | Silver | 65 Manufactured Steel |
| Mfg Bronze × 65 | `Resources/bronze-4.png` | Tier 5 | Brown | 65 Manufactured Bronze |
| Mfg Lead × 65 | `Resources/lead-4.png` | Tier 5 | Gray | 65 Manufactured Lead |
| Mfg Aluminum × 65 | `Resources/aluminum-4.png` | Tier 5 | Silver | 65 Manufactured Aluminum |
| Mfg Copper × 65 | `Resources/copper-4.png` | Tier 5 | Orange | 65 Manufactured Copper |
| Mfg Uranium × 65 | `Resources/uranium-4.png` | Tier 5 | Green | 65 Manufactured Uranium |
| Mfg Gasoline × 65 | `Resources/gasoline-4.png` | Tier 5 | Yellow | 65 Manufactured Gasoline |

### Food (33 slices — 11 types × 3 amounts)

| Slice | Icon | Tier | Color | Effect |
|-------|------|------|-------|--------|
| Burger × 1 / × 3 / × 5 | `Food/burger.png` | Tier 4/5/6 | Brown | 1/3/5 Burger |
| Cake × 1 / × 3 / × 5 | `Food/cake.png` | Tier 4/5/6 | Brown | 1/3/5 Cake |
| Cookie × 1 / × 3 / × 5 | `Food/cookie.png` | Tier 4/5/6 | Brown | 1/3/5 Cookie |
| Donut × 1 / × 3 / × 5 | `Food/donut.png` | Tier 4/5/6 | Brown | 1/3/5 Donut |
| Hotdog × 1 / × 3 / × 5 | `Food/hotdog.png` | Tier 4/5/6 | Brown | 1/3/5 Hotdog |
| Pizza × 1 / × 3 / × 5 | `Food/pizza.png` | Tier 4/5/6 | Brown | 1/3/5 Pizza |
| Ramen × 1 / × 3 / × 5 | `Food/ramen.png` | Tier 4/5/6 | Brown | 1/3/5 Ramen |
| Salad × 1 / × 3 / × 5 | `Food/salad.png` | Tier 4/5/6 | Brown | 1/3/5 Salad |
| Steak × 1 / × 3 / × 5 | `Food/steak.png` | Tier 4/5/6 | Brown | 1/3/5 Steak |
| Sushi × 1 / × 3 / × 5 | `Food/sushi.png` | Tier 4/5/6 | Brown | 1/3/5 Sushi |
| Taco × 1 / × 3 / × 5 | `Food/taco.png` | Tier 4/5/6 | Brown | 1/3/5 Taco |

### Water (33 slices — 11 types × 3 amounts)

| Slice | Icon | Tier | Color | Effect |
|-------|------|------|-------|--------|
| Beer × 1 / × 3 / × 5 | `Water/beer.png` | Tier 4/5/6 | Blue | 1/3/5 Beer |
| Coffee × 1 / × 3 / × 5 | `Water/coffee.png` | Tier 4/5/6 | Blue | 1/3/5 Coffee |
| Energy Drink × 1 / × 3 / × 5 | `Water/energy-drink.png` | Tier 4/5/6 | Blue | 1/3/5 Energy Drink |
| Juice × 1 / × 3 / × 5 | `Water/juice.png` | Tier 4/5/6 | Blue | 1/3/5 Juice |
| Liquor × 1 / × 3 / × 5 | `Water/liquor.png` | Tier 4/5/6 | Blue | 1/3/5 Liquor |
| Milk × 1 / × 3 / × 5 | `Water/milk.png` | Tier 4/5/6 | Blue | 1/3/5 Milk |
| Milkshake × 1 / × 3 / × 5 | `Water/milkshake.png` | Tier 4/5/6 | Blue | 1/3/5 Milkshake |
| Smoothie × 1 / × 3 / × 5 | `Water/smoothie.png` | Tier 4/5/6 | Blue | 1/3/5 Smoothie |
| Soda × 1 / × 3 / × 5 | `Water/soda.png` | Tier 4/5/6 | Blue | 1/3/5 Soda |
| Water × 1 / × 3 / × 5 | `Water/water.png` | Tier 4/5/6 | Blue | 1/3/5 Water |
| Wine × 1 / × 3 / × 5 | `Water/wine.png` | Tier 4/5/6 | Blue | 1/3/5 Wine |

### Free Land & Infra (2 slices)

| Slice | Icon | Tier | Color | Effect |
|-------|------|------|-------|--------|
| Free Land × 5% | `Wheel/free-land.png` | Tier 5 | Brown | 5% of current land levels as redeemable credits |
| Free Infra × 5% | `Wheel/free-infra.png` | Tier 5 | Brown | 5% of current infra levels as redeemable credits |

### Free Military Unit Credits (21 slices — 7 types × 3 tiers)

| Slice | Icon | Tier | Color | Effect |
|-------|------|------|-------|--------|
| FREE Soldiers × 1,000 | `Military/soldiers.png` | Tier 5 | Gray | 1,000 redeemable Soldier credits |
| FREE Soldiers × 5,000 | `Military/soldiers.png` | Tier 6 | Silver | 5,000 redeemable Soldier credits |
| FREE Soldiers × 10,000 | `Military/soldiers.png` | Tier 7 | Gold | 10,000 redeemable Soldier credits |
| FREE Tanks × 50 | `Military/tank.png` | Tier 5 | Silver | 50 redeemable Tank credits |
| FREE Tanks × 150 | `Military/tank.png` | Tier 6 | Gold | 150 redeemable Tank credits |
| FREE Tanks × 450 | `Military/tank.png` | Tier 7 | Crimson | 450 redeemable Tank credits |
| FREE Aircraft × 25 | `Military/aircraft.png` | Tier 5 | Silver | 25 redeemable Aircraft credits |
| FREE Aircraft × 75 | `Military/aircraft.png` | Tier 6 | Gold | 75 redeemable Aircraft credits |
| FREE Aircraft × 225 | `Military/aircraft.png` | Tier 7 | Crimson | 225 redeemable Aircraft credits |
| FREE Ships × 15 | `Military/ship.png` | Tier 5 | Silver | 15 redeemable Ship credits |
| FREE Ships × 45 | `Military/ship.png` | Tier 6 | Gold | 45 redeemable Ship credits |
| FREE Ships × 135 | `Military/ship.png` | Tier 7 | Crimson | 135 redeemable Ship credits |
| FREE Spies × 5 | `Military/spy.png` | Tier 5 | Silver | 5 redeemable Spy credits |
| FREE Spies × 15 | `Military/spy.png` | Tier 6 | Gold | 15 redeemable Spy credits |
| FREE Spies × 45 | `Military/spy.png` | Tier 7 | Crimson | 45 redeemable Spy credits |
| FREE Missiles × 2 | `Military/missile.png` | Tier 5 | Silver | 2 redeemable Missile credits |
| FREE Missiles × 6 | `Military/missile.png` | Tier 6 | Gold | 6 redeemable Missile credits |
| FREE Missiles × 18 | `Military/missile.png` | Tier 7 | Crimson | 18 redeemable Missile credits |
| FREE Nukes × 1 | `Military/nuke.png` | Tier 5 | Silver | 1 redeemable Nuke credit |
| FREE Nukes × 2 | `Military/nuke.png` | Tier 6 | Gold | 2 redeemable Nuke credits |
| FREE Nukes × 3 | `Military/nuke.png` | Tier 7 | Crimson | 3 redeemable Nuke credits |

**Important:** Free unit credits are **NOT** instant units. They are redeemable credits stored in `nation.casino.freeUnits.[unitType]`. Credits are redeemed at unit purchase time — money and resource costs are waived for the redeemed amount only, but all other requirements (technology, capacity, prerequisites, population enlistment, nuclear ban) still apply. Credits stack with any remaining credits for that unit type and can be redeemed across multiple purchases.

### Technology (3 slices)

| Slice | Icon | Tier | Color | Effect |
|-------|------|------|-------|--------|
| Tech × 5 | `Wheel/5-tech.png` | Tier 4 | Purple | 5 Levels FREE Technology |
| Tech × 10 | `Wheel/10-tech.png` | Tier 5 | Purple | 10 Levels FREE Technology |
| Tech × 25 | `Wheel/25-tech.png` | Tier 6 | Purple | 25 Levels FREE Technology |

### Happiness (9 slices — 3 amounts × 3 durations)

| Slice | Icon | Tier | Color | Effect |
|-------|------|------|-------|--------|
| Happiness 5 × 1 Day | `Wheel/5-happy-1day.png` | Tier 4 | Pink | +5 Happiness for 1 Day |
| Happiness 5 × 2 Days | `Wheel/5-happy-2day.png` | Tier 4 | Pink | +5 Happiness for 2 Days |
| Happiness 5 × 3 Days | `Wheel/5-happy-3day.png` | Tier 5 | Pink | +5 Happiness for 3 Days |
| Happiness 10 × 1 Day | `Wheel/10-happy-1day.png` | Tier 5 | Pink | +10 Happiness for 1 Day |
| Happiness 10 × 2 Days | `Wheel/10-happy-2day.png` | Tier 5 | Pink | +10 Happiness for 2 Days |
| Happiness 10 × 3 Days | `Wheel/10-happy-3day.png` | Tier 6 | Pink | +10 Happiness for 3 Days |
| Happiness 20 × 1 Day | `Wheel/20-happy-1day.png` | Tier 6 | Pink | +20 Happiness for 1 Day |
| Happiness 20 × 2 Days | `Wheel/20-happy-2day.png` | Tier 6 | Pink | +20 Happiness for 2 Days |
| Happiness 20 × 3 Days | `Wheel/20-happy-3day.png` | Tier 7 | Pink | +20 Happiness for 3 Days |

### Insanely Good Slices (4 slices)

| Slice | Icon | Tier | Color | Effect |
|-------|------|------|-------|--------|
| 50% Instant Raw Resources | `Wheel/instant-resources.png` | Tier 8 | Gold | Instantly grants 50% of current raw resource holdings |
| 25% Instant Manufactured Resources | `Wheel/instant-manu-resources.png` | Tier 8 | Gold | Instantly grants 25% of current manufactured resource holdings (rounded down) |
| Instant Research Finish | `Wheel/instant-research.png` | Tier 9 | Purple | Instantly finishes current research for free |
| 5% Population Increase | `Wheel/population-increase.png` | Tier 9 | Green | Instantly adds 5% of current population as Teen citizens |

### Bad Slices (8 slices — all Black)

| Slice | Icon | Tier | Color | Effect |
|-------|------|------|-------|--------|
| 25% Holdings Lost | `Wheel/25-loss.png` | Bad | Black | Lose 25% of nation currency holdings |
| 50% Holdings Lost | `Wheel/50-loss.png` | Bad | Black | Lose 50% of nation currency holdings |
| 75% Holdings Lost | `Wheel/75-loss.png` | Bad | Black | Lose 75% of nation currency holdings |
| BANKRUPTCY | `Wheel/bankruptcy.png` | Bad | Black | Lose 100% of nation currency holdings |
| Religious Schism | `Wheel/religion-change.png` | Bad | Black | Nation religion randomly changed - 30 day cooldown applies |
| Government Overthrow | `Wheel/government-change.png` | Bad | Black | Nation government randomly changed - 30 day cooldown applies |
| Military Purge | `Wheel/unit-destruction.png` | Bad | Black | Lose 25% of all military units - population tied to units is lost |
| Population Plague | `Wheel/population-kill.png` | Bad | Black | Lose 25% of total population across all demographics |

## Wheel Mechanics

### Daily Wheel Rebuild

The wheel is rebuilt **once per day at UTC midnight**:

1. All 152 slices are placed on the wheel
2. 8 bad slices are fixed at "+ pattern" positions: `[0, 19, 38, 57, 76, 95, 114, 133]`
   - Position 0 = Top, 38 = Right, 76 = Bottom, 114 = Left (cardinal)
   - Position 19, 57, 95, 133 = Diagonal between cardinal points
3. The remaining 144 normal slices are randomly shuffled into the remaining positions using cryptographically secure randomness (`crypto.randomInt`)
4. All slices are equal size — every slice has exactly 1/152 probability per spin
5. The wheel stays the same ALL DAY for that player
6. User gets exactly **1 spin per day**
7. Once spun, the result is locked in
8. At next UTC midnight, the wheel is rebuilt with a new random order

### Spin Mechanics

The wheel spin uses `crypto.randomInt()` for all randomness — no `Math.random()` anywhere. Outcomes are determined server-side; the animation is purely visual.

#### Spin Physics

The `spinPhysics()` function simulates a real physical wheel of fortune:

- **High initial velocity:** 5–12 full rotations (1800–4320 degrees)
- **Gradual deceleration:** Friction factor of 0.965 per frame simulates physical friction
- **Stopper bounce:** As the wheel slows, it "clicks" against pegs between slices, creating a realistic physical feel
- **Final bounce:** 2–4 final micro-bounces before settling exactly on the winning slice
- **Server-determined result:** The winning slice is chosen server-side before the animation begins

This makes it effectively impossible for users to time their click to land on a specific slice — the result is pre-determined and the animation is purely visual.

### Socket Actions

| Action | Parameters | Description |
|--------|-----------|-------------|
| `casinoSpinWheel` | `{}` | Spin the Sovereign Wheel (1 free spin per day) |

#### Socket Response

```json
{
  "ok": true,
  "result": { ...slice object... },
  "physics": { ...spin physics data... },
  "payout": number | null,
  "messages": [string]
}
```

## Tier System

Tiers are **visual/value categories only** — they determine slice color and relative prize value, but do **not** affect spin probability. Every slice has an equal chance (1/152) to win.

| Tier | Label | Color | Description |
|------|-------|-------|-------------|
| 1 | Common | Gray | Most common value tier (e.g., 1 Key 1) |
| 2 | Common+ | Amber | Small currency |
| 3 | Uncommon | Gray/Gold/Green | Chest 1, Free Bills 1 Day |
| 4 | Uncommon+ | Blue/Brown/Silver/Purple/Pink | Raw materials, Tech 5, Food/Water × 1, Happiness 5 × 1-2 Days |
| 5 | Rare | Gold/Silver/Purple/Brown/Blue/Pink | Mfg resources, $10M, Free Bills 3 Days, Tier 1 military, Tech 10, Happiness 5 × 3 Days / 10 × 1-2 Days, Free Land/Infra × 5% |
| 6 | Rare+ | Red/Gold/Crimson/Purple/Brown/Blue/Pink | $25M, Tech 25, Free Project, Reset Wonder, Food/Water × 5, Tier 2 military, Happiness 10 × 3 Days / 20 × 1-2 Days |
| 7 | Epic | Crimson/Gold/Pink | $100M, Tier 3 military, Happiness 20 × 3 Days, Chest 4 × 1 |
| 8 | Exotic | Gold | 50% Instant Raw Resources, 25% Instant Manufactured Resources |
| 9 | Divine | Purple/Green | Instant Research Finish, 5% Population Increase |
| Bad | Negative | Black | Holdings Lost, BANKRUPTCY, Religious Schism, Government Overthrow, Military Purge, Population Plague |

## Economy Integration

All currency flows through the World Bank lottery pool:

```
Player spins wheel → Result determined server-side
Currency prize → Added to nation.money
Bad slice loss → Deducted from nation.money
```

The Sovereign Wheel itself does not directly add/remove from the World Bank pool — it's a free daily spin. However, currency prizes and losses affect the nation's money balance which flows through the general economy.

## Code Structure

### SovereignWheelSystem Class

Located in `systems/Casino/sovereign-wheel-system.js`

#### Constructor
- Initializes `this.slices` by calling `buildSlices()`
- Sets `this.totalSlices` to `slices.length + BAD_SLICE_DEFS.length` (152)

#### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `buildDailyWheel()` | none | `Array[152]` | Builds the daily wheel with bad slices fixed at + positions and normal slices randomly shuffled |
| `spin(wheel)` | `wheel: Array` | `{ slice, physics }` | Selects a random slice and generates physics animation data |
| `applySpinResult(nation, casino, sliceResult, currentDay)` | `nation, casino, sliceResult, currentDay` | `{ result, payout, messages }` | Applies the spin result to the nation and casino state |
| `_applyBadSlice(nation, slice)` | `nation, slice` | `number` | Applies currency loss for bad slices |
| `_applyInstantRawResources(nation)` | `nation` | `number` | Grants 50% of current raw resource holdings |
| `_applyInstantMfgResources(nation)` | `nation` | `number` | Grants 25% of current manufactured resource holdings |
| `_applyInstantResearchFinish(nation)` | `nation` | `number` | Instantly completes current research |
| `_applyPopulationIncrease(nation)` | `nation` | `number` | Adds 5% of current population as Teen citizens |
| `_applyReligionChange(nation, currentDay)` | `nation, currentDay` | `number` | Randomly changes religion + 30-day cooldown |
| `_applyGovernmentChange(nation, currentDay)` | `nation, currentDay` | `number` | Randomly changes government + 30-day cooldown |
| `_applyUnitDestruction(nation)` | `nation` | `number` | Destroys 25% of all military units + kills tied population |
| `_applyPopulationKill(nation)` | `nation` | `number` | Kills 25% of total population across all demographics |

### Helper Functions

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `secureRandomInt(max)` | `max: number` | `number` | Cryptographically secure random integer [0, max) |
| `secureShuffle(array)` | `array: Array` | `Array` | Fisher-Yates shuffle using secure random |
| `capitalize(str)` | `str: string` | `string` | Capitalizes first letter |
| `resourceColor(mineral)` | `mineral: string` | `string` | Returns color for resource tier |
| `buildSlices()` | none | `Array` | Builds all 144 normal slice definitions |
| `spinPhysics(wheel, winningIndex)` | `wheel: Array, winningIndex: number` | `Object` | Simulates physical wheel spin animation |

### Serialization

`getState()` / `setState()` persist:
- `totalSlices`: Total number of slices (152)
- `badSlicePositions`: Array of bad slice positions

### Socket Integration

The wheel is accessed via `casinoSpinWheel` socket action in `server/world.js`:

```javascript
case "casinoSpinWheel": {
    return this.casinoSpinWheel(r);
}
```

The `casinoSpinWheel` method:
1. Gets the nation's casino data
2. Builds the daily wheel
3. Spins the wheel (determines result + physics)
4. Applies the result to the nation
5. Marks the spin as used for the day
6. Returns `{ ok: true, result, physics, payout, messages }`

## Important Design Notes

- **All slices equal size:** Every slice has exactly 1/152 probability. Tiers determine visual color and prize value, NOT spin probability.
- **Bad slices fixed:** The 8 bad slices are always at positions `[0, 19, 38, 57, 76, 95, 114, 133]`, creating a visually balanced "+ over x" (asterisk) pattern.
- **Insanely good slices random:** The 4 insanely good slices are in the normal shuffle pool and can appear at any non-bad position.
- **No client-side influence:** Results are determined server-side before animation. The physics animation is purely visual.
- **Credits, not instant units:** Military unit slices grant redeemable credits, not instant units. Credits stack and are redeemed at purchase time.
- **Server-side randomness:** All randomness uses `crypto.randomInt()` — never `Math.random()`.
