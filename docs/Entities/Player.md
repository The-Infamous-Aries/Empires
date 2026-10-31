# Player Entity

Represents the player's progression, skills, legendaries, and combat capabilities. The Player entity tracks leveling, XP, skill point allocation, legendary prestige, energy/intuition resources, and provides combat calculation helpers used by war and battle systems.

## Overview

| Item | Value |
|------|-------|
| **Class:** | `PlayerClass` |
| **Global instance:** | `window.Player` (singleton) |
| **Source file:** | `entities/Player.js` |
| **Loaded in:** | `index.html` (after `entities/Citizen.js`, before `systems/population-system.js`) |
| **Save/Load:** | Yes — `serialize()` / `deserialize()` supported via `Core/data-manager.js` |
| **Depends on:** | `EventBus`, `GameEvents`, `Nation` (optional, for nation stat integration) |

## Constructor

```js
new PlayerClass()
```

Creates a new, uninitialized player instance. The singleton `window.Player` is created automatically when the module loads. Players are initialized via `Player.initialize(playerData)` after authentication.

```js
Player.initialize(playerData);   // Creates/initializes the singleton
window.PlayerClass               // Class reference for creating additional instances
```

## Entity Fields

### Identity

| Field | Type | Description |
|-------|------|-------------|
| `playerId` | string | Auto-generated or server-assigned player ID |
| `username` | string | Player's display name |
| `email` | string | Player email |
| `joinDate` | number | Timestamp when player joined |
| `lastActive` | number | Timestamp of last activity |

### Faction

| Field | Type | Description |
|-------|------|-------------|
| `factionKey` | string \| null | Faction key the player belongs to |
| `factionColor` | string \| null | Faction color |
| `factionJoinDate` | number \| null | Timestamp when player joined faction |
| `factionRank` | string | Faction rank (default `'Member'`) |

### Leveling

| Field | Type | Description |
|-------|------|-------------|
| `level` | number | Current level (1-100) |
| `experience` | number | Current XP (0 to `experienceToNext`) |
| `totalExperience` | number | Lifetime XP earned |
| `experienceToNext` | number | XP needed for next level |
| `legendaryLevel` | number | Legendary prestige level (1 = non-legendary, 2+ = legendary cycles) |
| `totalLegendaryLevels` | number | Number of legendary resets performed |
| `canGoLegendary` | boolean | True only when `level >= 100` |

### Skill Points

| Field | Type | Description |
|-------|------|-------------|
| `unallocatedSkillPoints` | number | Normal skill points available to spend (earned via leveling) |
| `unallocatedLegendarySkillPoints` | number | Permanent legendary bonus points (earned via going legendary) |

### Skills

| Field | Type | Description |
|-------|------|-------------|
| `skills` | Map | `skillKey → { level, pointsSpent, legendaryBonusPts }` |

Each skill has 20 normal levels plus unlimited legendary bonus points.

### Statistics

| Field | Type | Description |
|-------|------|-------------|
| `statistics` | object | Play time, logins, nations created, battles won/lost, trades completed, alliances formed, territories claimed, buildings constructed, research completed, treaties signed, spy missions |

### Energy & Intuition

| Field | Type | Description |
|-------|------|-------------|
| `currentEnergy` | number | Current action energy (0 to max) |
| `currentIntuition` | number | Current intuition (0 to max) |

### Achievements & Titles

| Field | Type | Description |
|-------|------|-------------|
| `achievements` | Set | Unlocked achievement IDs |
| `titles` | Set | Unlocked title IDs |
| `currentTitle` | string \| null | Currently equipped title |

### Settings

| Field | Type | Description |
|-------|------|-------------|
| `settings` | object | Notification preferences, UI theme, privacy settings |

### Active Effects

| Field | Type | Description |
|-------|------|-------------|
| `activeEffects` | Map | Temporary effect IDs → effect objects |

## Skill Definitions (`SKILL_DEFS`)

| Skill | Category | Per Level | Unit | Max Levels | Max Value | Description |
|-------|----------|-----------|------|------------|-----------|-------------|
| Attack | Combat | 50 | flat | 20 | 1000 | Raw offensive power added to every combat action |
| Defense | Combat | 50 | flat | 20 | 1000 | Damage reduction applied before each hit lands |
| Aim | Combat | 3% | % | 20 | 60% | Increases hit accuracy, reducing miss chance |
| Luck | Passive | 2.5% | % | 20 | 50% | Improves random outcomes across all game systems |
| Critical Damage | Combat | 25 | flat | 20 | 500 | Additional flat damage dealt on a critical hit |
| Critical Chance | Combat | 2.5% | % | 20 | 50% | Probability of landing a critical hit each attack |
| Block | Combat | 25 | flat | 20 | 500 | Flat damage negated when a block triggers |
| Parry | Combat | 2.5% | % | 20 | 50% | Chance to fully negate an incoming attack |
| Energy | Resource | 10 | flat | 20 | 200 | Maximum action energy available each turn/day |
| Intuition | Passive | 5 | flat | 20 | 100 | Passive intelligence bonus improving research and event outcomes |
| Taxation | Economy | 1.75% | % | 20 | 35% | Increases effective tax revenue collected per cycle |
| Diplomacy | Nation | 2.5% | % | 20 | 50% | Improves diplomatic relations, treaty success, and alliance yields |

## Skill Cost Table (`SKILL_COST_TABLE`)

| Skill Level | Cost to Upgrade |
|-------------|-----------------|
| 1–5 | 1 point each |
| 6–10 | 2 points each |
| 11–15 | 3 points each |
| 16–20 | 4 points each |
| **Total to max one skill** | **50 points** |

Cumulative cost to reach level N: sum of costs for levels 1 through N-1.

## Skill Point Distribution

| Level Type | Points Awarded |
|------------|---------------|
| Regular levels (1–24, 26–49, 51–74, 76–99) | 4 points |
| Milestone levels (25, 50, 75, 100) | 16 points |

**Total spendable pool:** 96×4 + 4×16 = **448 points** (~75% of 600 needed to max all 12 skills at 50 points each)

**Legendary bonus points:** +1 permanent point per legendary level (kept across resets, never spent down)

## Methods

### Player Creation & Initialization

| Method | Description |
|--------|-------------|
| `Player.create(playerData)` | Creates a new `PlayerClass` instance and assigns it to `window.Player`. Returns false if player already exists. |
| `initialize(playerData)` | Initializes player fields from data (username, email, level, experience, legendary level, skill points, skills, statistics, achievements, titles). Emits `player_initialized` event. |

### XP & Leveling

| Method | Description |
|--------|-------------|
| `_calcXpToNext(level)` | Calculates XP required to advance from level N to N+1: `floor(100 × 2 × 1.12^(N-1) × legendaryLevel)` |
| `_awardExperience(amount, source)` | Awards experience, applies diplomacy XP multiplier (+0.5% per diplomacy level), handles level-up loop (stops at 100), awards skill points (4 regular / 16 at milestones 25/50/75/100) |
| `awardExperience(amount, source)` | Public wrapper for `_awardExperience` |
| `gainExperience(activity, amount)` | Public wrapper (swaps argument order) for `_awardExperience` |

### Legendary System

| Method | Description |
|--------|-------------|
| `goLegendary()` | Voluntary prestige at level 100. Increments `legendaryLevel`, resets level to 1, resets skill levels to 0 (but preserves `legendaryBonusPts`), awards +1 permanent legendary skill point. |
| `allocateLegendaryPoint(skillKey)` | Spends 1 legendary skill point on a skill (permanent bonus, survives legendary resets). Returns false if skill unknown or no points available. |

### Skill Point Allocation

| Method | Description |
|--------|-------------|
| `allocateSkillPoint(skillKey)` | Spends normal skill points to raise a skill by one level. Cost taken from `SKILL_COST_TABLE[currentLevel]`. Emits `skill_upgraded` event. |
| `skillUpgradeCost(skillKey)` | Returns cost to upgrade skill from current level to next. Returns null if maxed. |
| `skillPointsToMax(skillKey)` | Returns total points needed to max out a skill from current level. |

### Skill Value Queries

| Method | Returns |
|--------|---------|
| `getSkillValue(skillKey)` | Total effective value: `(level + legendaryBonusPts) × perLevel`. For `%` skills returns decimal (e.g. 0.15 = 15%). For flat skills returns raw number. |
| `getSkillDisplayValue(skillKey)` | Formatted string for UI (e.g. `"15%"` or `"750"`). |
| `getSkillBonus(skillKey)` | Backward-compatible accessor. Maps old skill names (economics→taxation, research→intuition, etc.) and returns value as 0..1 multiplier. |

### Nation Mechanic Integration

| Method | Description |
|--------|-------------|
| `applyToNation(nation)` | Applies all relevant skill bonuses to nation stats: attack/defense → military strength, diplomacy → reputation bonus, intuition → research bonus, energy → action energy, luck → luck bonus. **Taxation is NOT applied here** — handled separately in `Nation.calculateEconomy()` to avoid double-application. |

### Energy & Intuition

| Method | Description |
|--------|-------------|
| `getCurrentEnergy()` | Returns current energy |
| `getMaxEnergy()` | Returns `100 + energy skill value` |
| `consumeEnergy(amount)` | Deducts energy. Throws if insufficient. |
| `regenerateEnergy()` | Restores 10% of max energy per hour |
| `getCurrentIntuition()` | Returns current intuition |
| `getMaxIntuition()` | Returns `100 + intuition skill value` |
| `consumeIntuition(amount)` | Deducts intuition. Throws if insufficient. |
| `regenerateIntuition()` | Restores 10% of max intuition per hour |
| `consumeCookedFood(amount)` | **REMOVED** — was dead code, never called |

### Combat Calculations

| Method | Returns |
|--------|---------|
| `calcCombatResult(baseDamage)` | `{ damage, isCrit, isParried, isMiss }` — calculates combat damage with aim/luck hit check, attack bonus, critical hit chance/damage, nation military morale, improvement bonuses |
| `calcDefenseResult(incomingDamage)` | `{ reduced, blocked, parried }` — calculates defense with defense value, block chance/value, parry chance, luck modifier |

### Experience Event Handlers

| Method | Triggered By | XP Award |
|--------|-------------|----------|
| `_onDayPassed()` | Daily tick | Statistics update only |
| `_onTerritoryClaimed()` | Territory claimed | 500 XP |
| `_onBuildingConstructed()` | Building built | 150 XP |
| `_onResearchCompleted()` | Research finished | 300 XP |
| `_onTradeCompleted()` | Trade completed | 100 XP |
| `_onBattleWon()` | Battle won | 1000 XP |
| `_onBattleLost()` | Battle lost | 250 XP |
| `_onAllianceFormed()` | Alliance formed | 750 XP |
| `_onTreatySigned()` | Treaty signed | 400 XP |
| `_onSpyMission()` | Spy mission success | 200 XP |

### Achievements

| Method | Description |
|--------|-------------|
| `_checkLevelAchievements()` | Checks level milestones (10, 25, 50, 75, 100) and unlocks achievements |

### Utilities

| Method | Description |
|--------|-------------|
| `getOverview()` | Returns complete player overview object (level, XP, skills, statistics, achievements, active effects) |
| `updateLastActive()` | Updates `lastActive` timestamp |
| `addActiveEffect(effectId, effect)` | Adds temporary effect with start time |
| `removeActiveEffect(effectId)` | Removes temporary effect |
| `updateActiveEffects()` | Removes expired effects |
| `joinFaction(factionKey, factionColor)` | Joins a faction (+25 XP) |
| `leaveFaction()` | Leaves current faction |
| `getFactionInfo()` | Returns faction information object |
| `canVoteInFaction()` | Returns true if in faction for 24+ hours |

### Serialization

| Method | Description |
|--------|-------------|
| `serialize()` | Returns plain object with all player state including skills, statistics, achievements, titles, settings, active effects |
| `deserialize(data)` | Restores player from serialized data (handles Sets, Maps, nested objects) |
| `destroy()` | Unbinds all EventBus listeners, marks uninitialized |

## Integration with Other Systems

### Nation.js

| Nation Method | Uses Player |
|---------------|-------------|
| `calculateEconomy()` | `Player.getSkillValue('taxation')` → adds to tax rate |
| `applyToNation()` | `getSkillValue('attack'|'defense'|'diplomacy'|'intuition'|'energy'|'luck')` → nation stats |
| `setRelation()` | `Player.getSkillValue('diplomacy')` → relation improvement bonus |
| `trainMilitary()` | `Player.getSkillValue('attack')` → training cost discount (max 20%) |
| `generateResearch()` | `Player.getSkillValue('intuition')` → research generation multiplier |

### WarSystem.js

Uses `getSkillValue()` for: aim, luck, criticalChance, criticalDamage, attack, defense, block, parry. Uses `getCurrentEnergy()`/`consumeEnergy()` for attacks. Uses `getCurrentIntuition()`/`consumeIntuition()` for missiles, nukes, and spy operations.

### MilitaryUnit.js

Uses `getSkillValue('attack'|'defense'|'logistics')` for unit strength and maintenance cost modifiers.

### EconomyPanel.js

Uses `window.Player.playerId` for market offer operations (create buy/sell offers, accept offers, cancel offers).

## Skill Value Calculation Formula

```
totalLevels = skill.level + skill.legendaryBonusPts
rawValue = totalLevels × perLevel

If unit === '%': return rawValue / 100  (decimal, e.g. 0.15 = 15%)
If unit === '':  return rawValue          (flat number)
```

## XP Formula

```
XP to go from level N to N+1 = floor(100 × 2 × 1.12^(N-1) × legendaryLevel)
```

Legendary level multiplies the XP curve, making re-leveling progressively harder after each prestige.

## Save/Load

`Player.serialize()` and `Player.deserialize()` handle full state persistence including:
- All skill levels and legendary bonus points
- Unallocated normal and legendary skill points
- Experience, level, legendary level
- Statistics, achievements, titles
- Settings and active effects
- Faction membership

`deserialize()` correctly restores `Set` types (achievements, titles) and `Map` types (activeEffects, skills nested values).

## Limits & Caps

| Limit | Value |
|-------|-------|
| Max player level | 100 |
| Max skill level (normal) | 20 per skill |
| Legendary levels | Unlimited |
| Max taxation bonus | 35% (20 levels × 1.75%) |
| Max diplomacy bonus | 50% (20 levels × 2.5%) |
| Max aim bonus | 60% (20 levels × 3%) |
| Max luck bonus | 50% (20 levels × 2.5%) |
| Max critical chance | 50% (20 levels × 2.5%) |
| Max parry chance | 50% (20 levels × 2.5%) |
| Max energy bonus | 200 flat (20 levels × 10) |
| Max intuition bonus | 100 flat (20 levels × 5) |
| Max attack/defense bonus | 1000 flat (20 levels × 50) |
| Max critical damage | 500 flat (20 levels × 25) |
| Max block value | 500 flat (20 levels × 25) |
| Total skill points pool | 448 (~75% of 600 needed to max all 12 skills) |
