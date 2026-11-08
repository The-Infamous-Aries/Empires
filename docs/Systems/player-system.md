# Player System Documentation

**File:** `entities/Player.js`  
**Class:** `PlayerClass`  
**Singleton:** `window.Player`  
**Game:** Sovereignty Epochs - Nation Ruler Roleplay Game  

---

## Overview

The Player System manages player progression, skills (17 skills across combat, resource, economy, and nation categories), legendary prestige, XP/leveling, energy/intuition pools, combat calculation helpers, and nation stat integration. Skill values are used by nation mechanics, war calculations, research systems, and UI.

**Globally available as:** `window.Player`  
**Constructor:** `new PlayerClass()`  
**Export:** `module.exports = { PlayerClass, Player, SKILL_DEFS, SKILL_COST_TABLE }` (Node.js)

---

## Architecture

```
PlayerClass
├── SKILL_DEFS (const) — 17 skill definitions with icons, per-level values, categories
├── SKILL_COST_TABLE (const) — [1,1,2,2,3,3,4,4,5,5] per-skill upgrade costs
├── XP_GROWTH_FACTOR (const) — 1.025 XP curve multiplier
│
├── Leveling: level 1-100, 3 skill points per level (297 total normal points)
├── Legendary: goLegendary at level 100, resets level/skills, +1 permanent legendary point
│
├── Skills (each): level (0-10), pointsSpent, legendaryBonusPts (permanent)
│
├── Energy: base 100 + energy skill value, regenerates 10%/hour
├── Intuition: base 100 + intuition skill value, regenerates 10%/hour
│
├── Combat: calcCombatResult(), calcDefenseResult()
└── Nation: applyToNation() — applies skill bonuses to nation stats
```

### Data Files Referenced

| File | Purpose |
|------|---------|
| `assets/images/Skills/*.png` | 17 skill icons (all lowercase filenames) |

---

## Skill Definitions (SKILL_DEFS)

All 17 skills have `maxLevels: 10`. Each skill costs 30 points total to max (1+1+2+2+3+3+4+4+5+5).

| Key | Name | Icon | Per Level | Unit | Max Value | Category |
|-----|------|------|-----------|------|-----------|----------|
| `attack` | Attack | `assets/images/Skills/attack.png` | 75 | flat | 750 | combat |
| `defense` | Defense | `assets/images/Skills/defense.png` | 75 | flat | 500 | combat |
| `block` | Block | `assets/images/Skills/block.png` | 50 | flat | 500 | combat |
| `parry` | Parry | `assets/images/Skills/parry.png` | 50 | flat | 500 | combat |
| `aim` | Aim | `assets/images/Skills/aim.png` | 5 | % | 50% | combat |
| `evade` | Evade | `assets/images/Skills/evade.png` | 5 | % | 50% | combat |
| `criticalChance` | Critical Chance | `assets/images/Skills/critical-chance.png` | 5 | % | 50% | combat |
| `criticalDamage` | Critical Damage | `assets/images/Skills/critical-damage.png` | 40 | % | 400% | combat |
| `luck` | Luck | `assets/images/Skills/luck.png` | 3 | flat | 30 | passive |
| `energy` | Energy | `assets/images/Skills/energy.png` | 10 | flat | 100 | resource |
| `intuition` | Intuition | `assets/images/Skills/intuition.png` | 5 | flat | 50 | resource |
| `taxation` | Taxation | `assets/images/Skills/taxation.png` | 3.5 | % | 35% | economy |
| `production` | Production | `assets/images/Skills/production.png` | 5 | % | 50% | economy |
| `stewardship` | Stewardship | `assets/images/Skills/stewardship.png` | 2.5 | % | 25% | nation |
| `diplomacy` | Diplomacy | `assets/images/Skills/diplomacy.png` | 10 | % | 100% | nation |
| `intelligence` | Intelligence | `assets/images/Skills/intelligence.png` | 3.5 | % | 35% | nation |
| `discipline` | Discipline | `assets/images/Skills/discipline.png` | 2.5 | % | 25% | combat |

---

## Instance Properties

### Identity

| Property | Type | Description |
|----------|------|-------------|
| `playerId` | string | Unique player ID |
| `username` | string | Player display name |
| `email` | string | Player email |
| `joinDate` | number | Timestamp of account creation |
| `lastActive` | number | Last activity timestamp |

### Faction

| Property | Type | Description |
|----------|------|-------------|
| `factionKey` | string\|null | Current faction key |
| `factionColor` | string\|null | Faction color |
| `factionJoinDate` | number\|null | When joined faction |
| `factionRank` | string | Rank within faction (default: 'Member') |

### Leveling

| Property | Type | Description |
|----------|------|-------------|
| `level` | number | Current level (1-100) |
| `experience` | number | Current XP in level |
| `totalExperience` | number | Lifetime XP earned |
| `experienceToNext` | number | XP needed for next level |
| `legendaryLevel` | number | Current legendary cycle (starts at 1) |
| `totalLegendaryLevels` | number | Times gone legendary (legendaryLevel - 1) |
| `canGoLegendary` | boolean | True when level >= 100 |

### Skill Points

| Property | Type | Description |
|----------|------|-------------|
| `unallocatedSkillPoints` | number | Normal points (3/level, 297 max at level 100) |
| `unallocatedLegendarySkillPoints` | number | Permanent legendary points (+1 per cycle) |

### Skills (`this.skills`)

Map of skillKey → `{ level, pointsSpent, legendaryBonusPts }`. All skills start at level 0.

### Statistics

| Property | Type | Description |
|----------|------|-------------|
| `playTime` | number | Days played |
| `loginsCount` | number | Login count |
| `nationsCreated` | number | Nations created |
| `battlesWon` / `battlesLost` | number | Battle record |
| `alliancesFormed` | number | Alliances created |
| `territoriesClaimed` | number | Territories claimed |
| `buildingsConstructed` | number | Buildings built |
| `researchCompleted` | number | Research projects done |
| `treatiesSigned` | number | Treaties signed |
| `spyMissions` | number | Successful spy missions |

### Energy & Intuition

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `currentEnergy` | number | 100 | Current action energy |
| `currentIntuition` | number | 100 | Current action intuition |

---

## Leveling System

### XP Formula

XP to advance from level N to N+1:
```
floor( 100 × 1.025^(N-1) × legendaryLevel )
```

- Level 1→2 costs 200 XP (legendaryLevel 1)
- Costs scale exponentially with legendaryLevel multiplier
- Level 100 is the cap; players may voluntarily "Go Legendary"

### Skill Points

- Gain **3 skill points per level** (levels 1→100 = 99 level-ups × 3 = 297 total)
- No milestone bonus points
- Total spendable pool: 300 points (including legendary bonus points)
- Can max exactly 10 of 17 skills (10 × 30 = 300)

### Skill Cost Table (per-skill, 10 levels)

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|-------|---|---|---|---|---|---|---|---|---|----|
| Cost | 1 | 1 | 2 | 2 | 3 | 3 | 4 | 4 | 5 | 5 |
| Cumulative | 1 | 2 | 4 | 6 | 9 | 12 | 16 | 20 | 25 | 30 |

---

## Legendary System

### `goLegendary()`

Available when `level >= 100`. Voluntary prestige:

- `legendaryLevel` increments (2, 3, 4…)
- `level` resets to 1, `experience` resets to 0
- `unallocatedSkillPoints` resets to 0
- `+1 unallocatedLegendarySkillPoints` awarded (never reset)
- Normal skill **levels reset to 0**, but `legendaryBonusPts` are preserved
- `pointsSpent` resets to 0 so normal points can be re-spent

### `allocateLegendaryPoint(skillKey)`

Spends 1 legendary point on a skill. Each point provides the same boost as one normal skill level and survives legendary resets.

---

## Skill Point Allocation

### `allocateSkillPoint(skillKey)`

Spends normal skill points to raise a skill by one level. Cost comes from `SKILL_COST_TABLE[currentLevel]`.

### Query Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `skillUpgradeCost(skillKey)` | number\|null | Cost to level up (null if maxed) |
| `skillPointsToMax(skillKey)` | number | Total points to max from current level |

---

## Skill Value Queries

### `getSkillValue(skillKey)`

Returns total effective value:
```
totalLevels = skill.level + skill.legendaryBonusPts
raw = totalLevels * def.perLevel
return def.unit === '%' ? raw / 100 : raw
```

- Flat skills (attack, defense, etc.): returns raw number
- % skills (aim, evade, etc.): returns decimal (0.5 = 50%)

### `getSkillDisplayValue(skillKey)`

Returns formatted string for UI (e.g., `"750"` or `"50%"`).

### `getSkillBonus(skillKey)`

Backward-compatible accessor returning 0..1 multiplier. Supports legacy aliases:
- `economics` → `taxation`
- `research` → `intuition`
- `construction` → `energy`
- `warfare` → `attack`
- `trade` → `taxation`
- `leadership` → `intuition`

---

## Nation Mechanic Integration

### `applyToNation(nation)`

Applies skill bonuses to nation stats (called by Nation on stat recalculation):

| Skill | Nation Property | Notes |
|-------|----------------|-------|
| attack | `militaryStrength` | +value |
| defense | `militaryStrength` | +value |
| diplomacy | `reputationBonus` | +value × 100 |
| intuition | `researchBonus` | +value |
| energy | `actionEnergy` | +value |
| luck | `luckBonus` | +value (0-30) |
| discipline | `disciplineUnitCapBonus` | +value |
| production | `productionBonus` | +value |
| stewardship | `stewardshipCostReduction` | +value |

**Taxation is intentionally NOT applied here** — Nation.calculateEconomy() already adds the skill bonus to taxRate before this runs.

---

## Energy System

| Method | Description |
|--------|-------------|
| `getMaxEnergy()` | `100 + energy skill value` |
| `consumeEnergy(amount)` | Deducts energy; throws if insufficient |
| `regenerateEnergy()` | Recovers 10% of max per hour |

### `getMaxIntuition()` / `consumeIntuition()` / `regenerateIntuition()`

Same pattern as energy, using intuition skill. Base 100 + intuition value.

---

## Combat Calculation

### `calcCombatResult(baseDamage)`

Returns `{ damage, isCrit, isParried, isMiss, evaded }`:

1. **Hit check**: Aim reduces miss rate (threshold: max(0.05, 0.25 - aimBonus))
2. **Damage**: baseDamage + attack skill value
3. **Morale/improvement bonuses** applied from nation stats
4. **Crit roll**: critChance determines crit; crit damage rolls 1x to (1 + critDamageMax)
5. **Luck**: chance (luck/100) to apply (luck/100)% damage boost

### `calcDefenseResult(incomingDamage)`

Returns `{ reduced, blocked, parried, evaded }`:

1. **Block chance**: `min(0.80, 0.20 + blockLevel × 0.03 + luck × 0.005)`
2. **Reduction**: defense value + (blockVal if blocked)
3. Parry is folded into Block (no separate parry mechanic)

---

## Event Handlers

Auto-award XP on game events:

| Event | XP | Stat Incremented |
|-------|----|-----------------|
| Day passed | 0 | playTime++ |
| Territory claimed | 500 | territoriesClaimed++ |
| Building constructed | 150 | buildingsConstructed++ |
| Research completed | 300 | researchCompleted++ |
| Battle won | 1000 | battlesWon++ |
| Battle lost | 250 | battlesLost++ |
| Alliance formed | 750 | alliancesFormed++ |
| Treaty signed | 400 | treatiesSigned++ |
| Spy mission success | 200 | spyMissions++ |

Daily login awards 50 XP.

---

## Achievements

Level milestones checked on each level-up:

| Level | ID | Name | Description |
|-------|-----|------|-------------|
| 10 | level_10 | Rising Star | Reach level 10 |
| 25 | level_25 | Experienced Leader | Reach level 25 |
| 50 | level_50 | Veteran Ruler | Reach level 50 |
| 75 | level_75 | Master Strategist | Reach level 75 |
| 100 | level_100 | Legendary Emperor | Reach level 100 — may go Legendary |

---

## Faction Methods

| Method | Description |
|--------|-------------|
| `joinFaction(factionKey, factionColor)` | Join a faction (awards 25 XP) |
| `leaveFaction()` | Leave current faction |
| `getFactionInfo()` | Returns faction details or null |
| `canVoteInFaction()` | True if in faction for >= 24 hours |

---

## Serialization

### `serialize()`

Returns plain object for save/load. Skills serialized as `{ level, pointsSpent, legendaryBonusPts }` per key. Sets (achievements, titles) converted to arrays. Maps (activeEffects) converted to objects.

### `deserialize(data)`

Restores from serialized object. Rebuilds Sets and Maps. Recalculates `experienceToNext` and `canGoLegendary`.

### `destroy()`

Removes all EventBus listeners. Sets `isInitialized = false`.

---

## EventBus Events

| Event | Data | When |
|-------|------|------|
| `player_initialized` | `{ player }` | Player initialized |
| `player_level_up` | `{ newLevel, skillPoints, legendaryLevel, player }` | On level up |
| `experience_gained` | `{ amount, source, newTotal, leveledUp }` | XP awarded |
| `player_went_legendary` | `{ legendaryLevel, legendarySkillPts, player }` | On legendary |
| `legendary_skill_allocated` | `{ skill, bonusPts, remaining }` | Legendary point spent |
| `skill_upgraded` | `{ skill, newLevel, cost, remaining, value }` | Normal skill point spent |
| `achievement_unlocked` | `{ achievement, player }` | Achievement earned |
| `effect_applied` / `effect_removed` | `{ effectId, effect }` | Temporary effect lifecycle |
| `player_loaded` | `{ player }` | Player deserialized |
| `faction_joined` / `faction_left` | `{ player, factionKey, ... }` | Faction membership change |

All `EventBus` calls are guarded with `if (typeof EventBus !== 'undefined')` for server safety.

---

## Global Exports

| Export | Description |
|--------|-------------|
| `window.SKILL_DEFS` | Skill definition constants (UI components) |
| `window.SKILL_COST_TABLE` | Upgrade cost table |
| `window.XP_GROWTH_FACTOR` | XP growth constant |
| `window.PlayerClass` | PlayerClass constructor |
| `window.Player` | Singleton player instance |

---

## Icon Reference

All 17 skill icons live in `assets/images/Skills/` with lowercase filenames:

```
attack.png, defense.png, block.png, parry.png,
aim.png, evade.png, critical-chance.png, critical-damage.png,
luck.png, energy.png, intuition.png, taxation.png,
production.png, stewardship.png, diplomacy.png, intelligence.png, discipline.png
```

The UI skill modal (`ui/components/player-skill-modal.js`) renders `SKILL_DEFS[key].icon` as an `` with a text fallback (`_skillFallbackIcon(key)`) if the image fails to load.
