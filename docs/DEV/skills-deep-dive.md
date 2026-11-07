# Skills Deep Dive — Current Behavior & Rework Plan (10-Level System)

**Location:** `docs/DEV/skills-deep-dive.md`
**Project:** Sovereignty Epochs (Empire.2)
**Status:** Reference / plan only — no code changed. Baseline for the intended skills rework to a 10-level-per-skill system with 16 skills.

---

## 0. Source of Truth (Current Code)

| File | Role |
|------|------|
| `entities/Player.js:44` | `SKILL_DEFS` — 12 skill definitions (per-level value, max, category, icon) |
| `entities/Player.js:170` | `SKILL_COST_TABLE` — 20-level normal point cost (sums to 50 per skill) |
| `entities/Player.js:15-18` | Leveling: 4 skill pts/level + 12 bonus at 25/50/75/100 → 448 total (~75% of 600 to max all 12) |
| `entities/Player.js:567` | `getSkillValue(skillKey)` — total = (level + legendaryBonusPts) × perLevel; `%` skills return decimal |
| `entities/Player.js:596` | `getSkillBonus(skillKey)` — legacy alias mapper (economics/trade→taxation, research/leadership→intuition, construction→energy, warfare→attack, intelligence→aim) |
| `entities/Player.js:624` | `applyToNation(nation)` — fan-out of skill values onto nation stats each recalc |
| `entities/Player.js:723` | `calcCombatResult(baseDamage)` — client-side attack/hit/crit |
| `entities/Player.js:772` | `calcDefenseResult(incomingDamage)` — client-side defense/block/parry |
| `server/world.js:339` | `skillDefs` exposed to clients (world config payload) |
| `server/world.js:866` | Attack skill → military unit purchase discount (`Math.min(0.2, attack/5000)`) |
| `server/world.js:3469-3470` | Aim + Luck → conventional war damage multiplier |
| `server/world.js:3485` | Energy consumed on every attack |
| `server/world.js:4018` | Skill values/costs serialized into nation payload |
| `systems/War/war-system.js` | Server combat: base damage, crit, missile/nuke, defense, parry, block |
| `systems/nation-system.js` | Economy (taxation), research (intuition), military strength (attack/defense) |
| `entities/Nation.js:623` | Diplomacy skill → relation improvement amplification |
| `entities/MilitaryUnit.js:210` | Attack/Defense skill → unit stat bonuses |
| `ui/live/game.js:1171` | Skill modal UI (renders `catalog.skills`) |

---

## 1. New Progression Model (10 Levels per Skill)

### 1.1 Design Goals
- Reduce each skill from 20 levels → **10 levels**.
- 16 skills total (12 existing − Parry folded into Block + Evade, Intelligence, Production, Stewardship, Discipline added).
- Rework point gains and per-tier costs so the player faces meaningful allocation choices (cannot max all 16).
- **Point pool target: exactly enough to max 10 of 16 skills.** Total to max all = 16 × 30 = 480 → target pool = **300 points** (exactly enough to fully max 10 skills, leaving 6 skills at level 0 with nothing invested).
- Keep Legendary system: +1 permanent legendary point per legendary cycle, survives resets, adds same boost as one normal level (1 × perLevel value of that skill).
- Energy and Intuition have base values independent of skill levels (100 base Energy, **100 base Intuition**); skill levels add on top. NOTE: Code currently uses base 100 for intuition (`Player.js:691`) — plan updated to match code, not the earlier "base 50" note.

### 1.2 Skill Point Cost Table (per skill, 10 levels)

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Total |
|-------|---|---|---|---|---|---|---|---|---|----|-------|
| Cost  | 1 | 1 | 2 | 2 | 3 | 3 | 4 | 4 | 5 | 5 | **30** |

- Total to max one skill: **30 normal points**.
- Total to max all 16 skills: **480 normal points**.

### 1.3 Points Gained on Level-Up

| Source | Amount |
|--------|--------|
| Per level (1→100) | 3 normal points → **300 total** |
| Milestone bonus | None |
| **Grand total normal points (level 100)** | **300** |

- 300 / 480 → **62.5%**. Player can fully max **10 of 16 skills** (10 × 30 = 300) with zero points remaining. Six skills must stay at level 0 (nothing invested).
- Legendary: `goLegendary()` resets normal skill levels to 0 and unallocated points to 0, awards **+1 permanent legendary skill point** (kept across resets, same boost as one normal level — i.e. adds 1 × perLevel value to that skill's effective total).

### 1.4 Per-Skill Target Values (10 Levels)

| Skill | perLevel | Unit | Base (no levels) | Max at L10 | Total with L10 | Category |
|-------|----------|------|------------------|------------|----------------|----------|
| Attack | 75 | flat | 0 | 750 | 750 | combat |
| Defense | 75 | flat | 0 | 750 | 750 | combat |
| Block | 50 | flat | 0 | 500 | 500 | combat |
| Evade | 5 | % | 0% | 50% | 50% | combat |
| Aim | 5 | % | 0% | 50% | 50% | combat |
| Crit Chance | 5 | % | 0% | 50% | 50% | combat |
| Crit Damage | 40 | % | 0% | 400% | 400% | combat |
| Luck | 3 | flat | 0 | 30 | 30 | passive |
| Energy | 10 | flat | 100 | 100 | 200 | resource |
| Intuition | 5 | flat | 100 | 50 | 150 | resource |
| Taxation | 3.5 | % | 0% | 35% | 35% | economy |
| Intelligence | 3.5 | % | 0% | 35% | 35% | nation |
| Diplomacy | 10 | % | 0% | 100% | 100% | nation |
| Production | 5 | % | 0% | 50% | 50% | economy |
| Stewardship | 2.5 | % | 0% | 25% | 25% | nation |
| Discipline | 2.5 | % | 0% | 25% | 25% | combat |

**Luck semantics (probabilistic):** At level N, luck value = N × 3 (max 30 at L10). When luck is checked against a stat, there is a `(luck / 100)` chance to apply a `(luck / 100)` boost to that stat's value. Example: luck = 21 → 21% chance of a 21% boost. If the chance roll fails, no boost is applied. Formula:
```
if (Math.random() < luck / 100) {
    statValue = statValue × (1 + luck / 100)
}
```
At level 10 (luck = 30): 30% chance of a 30% boost to any affected stat. Legendary points add +1 to luck value (e.g. level 10 + 1 legendary = luck 31 → 31% chance of 31% boost).

**Crit Damage semantics (roll-based):** Level 10 = 400% max crit damage bonus. On a critical hit, damage is multiplied by a roll between `1.0` and `(1 + critDamage / 100)`. Level 10 crits roll for damage between 1x and 5x total (400% bonus = 5x max). Before any legendary points. Legendary points add +40 to the max possible crit damage bonus (e.g. level 10 + 1 legendary = max 440% bonus, roll range 1x to 5.4x).

**Diplomacy semantics:** Level 10 = 100% → doubles the length of treaties allowed. Treaty max length = `baseMaxLength × (1 + diplomacy / 100)` = `baseMaxLength × 2` at level 10.

**Production semantics:** Only affects raw resource production amount. Adds to mine stacking bonus. If maxed stacked mines give 50% and Production is level 10 (50%), total production bonus = 100%.

---

## 2. Per-Skill Deep Dive

Each skill below lists: current code behavior, the user's intended behavior, code tie-outs (file:line), and what must change for the rework.

---

### 2.1 Attack

**User intent:** User's/nation's base attack before any modifiers. Used when attacking in offensive wars. 75 flat per level, max 750 at L10.

**Current code behavior:**
- `SKILL_DEFS.attack` (`Player.js:45`): `perLevel: 50` flat, max 1000 at L20, category `combat`.
- `calcCombatResult` (`Player.js:724`): flat attack added to damage (`damage = baseDamage + attack`).
- `calculateBaseDamage` (`war-system.js:1720`): seeds base damage = player attack value; unit damage added on top.
- `applyToNation` (`Player.js:628`): added to `nation.militaryStrength`.
- `nation-system.js:1716`: added to `totalStrength` for military strength rating.
- `unitQuote` (`world.js:866`): military unit purchase discount = `Math.min(0.2, attack/5000)` (max 20% at attack ≥ 1000).

**Tie-outs:** offensive war damage, military strength rating, unit purchase cost.

**Changes for 10-level rework:**
- Max level 20 → 10; perLevel 50 → 75; max value 1000 → 750.
- `SKILL_COST_TABLE` shrink from 20 → 10 entries.
- Re-scale unit-purchase discount divisor (attack max now 750; `attack/5000` never reaches 0.2 — consider `Math.min(0.2, attack/3750)` so level 10 reaches max discount).
- Power level: Attack is one of the strongest skills per level (75 flat vs others at 5% or 2.5%). Consider whether cost should be higher than 30 total — flagged as open decision.

---

### 2.2 Defense

**User intent:** User's/nation's base defense before any modifiers. Used for defending in defensive wars. 75 flat per level, max 750 at L10.

**Current code behavior:**
- `SKILL_DEFS.defense` (`Player.js:55`): `perLevel: 50` flat, max 1000, category `combat`.
- `calcDefenseResult` (`Player.js:773`): flat `defense` subtracted from incoming damage (always applied).
- `processDefense` (`war-system.js:1952,1975,1987`): `defenseValue` reduces final damage; also feeds parry counter-damage.
- `applyToNation` (`Player.js:629`): added to `nation.militaryStrength`.
- `nation-system.js:1717`: added to `totalStrength`.

**Tie-outs:** defensive war damage reduction, military strength rating, parry counter-damage.

**Changes for 10-level rework:**
- Max 20 → 10; perLevel 50 → 75; max value 1000 → 750.
- Cost table resized to 10 entries.
- Power level: same concern as Attack (75 flat per level). Flagged as open decision.

---

### 2.3 Block

**User intent:** Auto defense in wars. When other players attack, their roll (after all modifiers and units) is weighed against defender's defense (after all modifiers and units) and can fully or partially block damage from being added to war. 50 flat per level, max 500 at L10.

**Current code behavior:**
- `SKILL_DEFS.block` (`Player.js:105`): `perLevel: 25` flat, max 500. Description: "Flat damage negated when a block triggers."
- `calcDefenseResult` (`Player.js:774`): `blockVal` added to reduction **only when block roll succeeds**. Block chance = `0.30 + luck × 0.1`. Reduction = `defense + (blocked ? blockVal : 0)`.
- `processDefense` (`war-system.js:1974`): block chance `0.30 + luck × 0.1`; on success `blockValue + defenseValue` subtracted from `finalDamage`. `stats.blocks++` tracked.

**Gap vs. intent:** Code does **partial flat reduction**, not full-or-partial negation weighed against defender's defense value. Chance is based on **luck**, not a defender-defense vs attacker-roll comparison. Parry (`Player.js:115`) is the closest existing full-negation mechanic but is not in the user's list.

**Changes for 10-level rework:**
- Max 20 → 10; perLevel 25 → 50; max value 500 → 500.
- Rework block logic: defender's total defense (skill + modifiers + units) weighed against attacker's total attack roll; outcome = full block, partial block, or no block. Block skill value scales the reduction % or flat amount.
- Merge Parry into Block (Parry's full-negation role absorbed by Block's "fully block" tier). Remove Parry as standalone skill.

---

### 2.4 Evade (NEW SKILL)

**User intent:** Chance (weighed with user's luck and random) to not use Energy on attack/defend in wars, or Intuition when launching missiles/nukes/spy ops. 5% per level, max 50% at L10.

**Current code behavior:** **Does not exist.** No skill reduces or waives Energy cost. Energy is always consumed on attack (`world.js:3485`). Intuition pool exists (`Player.js:701`) but is not deducted for missile/nuke/spy launches.

**Tie-outs (to be wired):** Energy consumption on attack/defend; Intuition consumption on missile/nuke/spy-op launch.

**Changes for 10-level rework:**
- Add `SKILL_DEFS.evade` (`Player.js`): `perLevel: 5%`, max 50% at L10, category `combat`.
- Add evade roll to attack/defend paths: if evade roll succeeds (chance = evade% + luck modifier), skip Energy cost for that action.
- Add evade roll to missile/nuke/spy-op launch: if succeeds, skip Intuition cost.
- Wire Intuition consumption into missile/nuke/spy-op launch paths (currently not consumed).
- Add UI slot in skill modal (`ui/live/game.js:1171`).

---

### 2.5 Aim

**User intent:** Chance of hitting/missing on Attack/Defend. Misses cannot be critical. 5% per level, max 50% at L10.

**Current code behavior:**
- `SKILL_DEFS.aim` (`Player.js:65`): `perLevel: 3%`, max 60%, category `combat`.
- `calcCombatResult` (`Player.js:727`): `hitThreshold = Math.max(0.05, 0.25 - aimBonus - luck × 0.5)`. Roll < threshold → miss (`damage: 0, isMiss: true`); `isCrit: false`.
- `world.js:3469`: conventional damage multiplier `× (1 + aim × 0.1 + luck × 0.05)`.
- `calculateMissileDamage` / `calculateNukeDamage` (`war-system.js:1097, 1117`): `damage ×= (1 + aim × 0.5 + luck × 0.3)`.

**Gap vs. intent:** Aim currently only affects **offensive** hit threshold, not defensive rolls. It also inflates damage (multiplier), which user did not request. Misses correctly cannot crit.

**Changes for 10-level rework:**
- Max 20 → 10; perLevel 3% → 5% (max 50%).
- Apply aim to both Attack and Defend hit/miss resolution (server `war-system.js` and client `Player.js` should match).
- Remove or re-purpose the damage-multiplier side-effect (user wants aim = accuracy only).
- Unify client vs. server aim logic so both are authoritative identically.

---

### 2.6 Crit Chance

**User intent:** Chance of crit damage percent being applied to Attack/Defend/Block. 5% per level, max 50% at L10.

**Current code behavior:**
- `SKILL_DEFS.criticalChance` (`Player.js:95`): `perLevel: 2.5%`, max 50%, category `combat`.
- `calcCombatResult` (`Player.js:725`): `isCrit` if `roll < critChance`; `damage += critDamage`.
- `rollCriticalHit` (`war-system.js:1767`): `totalChance = Math.min(0.95, critChance + luck × 0.1)`.
- `processDefense` (`war-system.js:1956`): critical parry — `critChance` rolls to add `criticalDamage` to parry counter-damage.

**Gap vs. intent:** Crit applied to attack (offensive) and parry counter-damage, but **not** to regular block reduction or defend damage.

**Changes for 10-level rework:**
- Max 20 → 10; perLevel 2.5% → 5% (max 50%).
- Apply crit chance to Attack, Defend, and Block damage outcomes (user wants all three).
- Luck bonus to crit chance (`luck × 0.1`) retained or folded into Luck's broader role.

---

### 2.7 Crit Damage

**User intent:** Percent multiplier for critical Attack/Defend/Block. 40% per level, max 400% at L10 (level 10 crits roll for up to 5x damage roll before any legendary points). On each crit, roll for how much of the max multiplier applies.

**Current code behavior:**
- `SKILL_DEFS.criticalDamage` (`Player.js:85`): `perLevel: 25` flat, max 500. Description: "Additional flat damage dealt on a critical hit."
- `calcCombatResult` (`Player.js:726`): `damage += critDamage` (flat addition, not percent).
- `processDefense` (`war-system.js:1958`): `counterDamage += Math.floor(critDamagePercent)` on critical parry.

**Gap vs. intent:** Code uses **flat value added**, not a **percent multiplier**. Not applied to regular block.

**Changes for 10-level rework:**
- Max 20 → 10; redefine as percent multiplier: `perLevel: 40%`, max 400% at L10.
- On crit, roll damage multiplier between `1.0` and `(1 + critDamage / 100)`. Level 10 = roll range 1x to 5.0x total (400% max bonus).
- Apply to Attack, Defend, and Block critical hits.
- Legendary points add +40 to the max possible crit damage bonus.

---

### 2.8 Luck

**User intent:** Luck used on all war interactions (attack/defend/block/evade and launching missile/nuke/spy op). 3 flat per level, max 30 at L10. Luck is **probabilistic**: at level N, there is an `(N × 3 / 100)` chance to apply an `(N × 3 / 100)` boost to any affected stat. At level 10 (luck 30): 30% chance of a 30% boost.

**Current code behavior:**
- `SKILL_DEFS.luck` (`Player.js:75`): `perLevel: 2.5%`, max 50%, category `passive`.
- `calcCombatResult` (`Player.js:728`): reduces miss threshold (`luck × 0.5`).
- `calcDefenseResult` (`Player.js:776`): boosts parry (`luck × 0.2`) and block (`luck × 0.1`) chance.
- `rollCriticalHit` (`war-system.js:1769`): `luck × 0.1` to crit chance.
- `processDefense` (`war-system.js:1944`): `luck × 0.2` parry, `luck × 0.1` block.
- Missile/Nuke damage (`war-system.js:1098,1118`): `luck × 0.3` multiplier.
- Conventional damage (`world.js:3470`): `luck × 0.05` multiplier.
- `applyToNation` (`Player.js:642`): `nation.luckBonus` — checked in event system.

**Gap vs. intent:** Luck is NOT used on spy ops, and not explicitly tied to Evade. It is used on attack/defend/block/missile/nuke already. Current code applies luck as guaranteed modifiers, not as a chance-to-trigger roll.

**Changes for 10-level rework:**
- Max 20 → 10; perLevel 2.5% → 3 flat (max 30).
- Rework luck semantics: **chance-to-trigger roll**. `if (Math.random() < luck / 100) statValue × (1 + luck / 100)`. Not a guaranteed boost.
- Explicitly wire Luck into Evade rolls (evade chance modified by luck).
- Wire Luck into spy-op success/missile/nuke launch outcomes.
- Keep existing combat luck modifiers but consolidate into one documented formula based on the chance-to-trigger model.

---

### 2.9 Energy

**User intent:** Used in Attack/Defend. 100 base even without any levels here. 10 per level, maxing at 100 (making users 200 total).

**Current code behavior:**
- `SKILL_DEFS.energy` (`Player.js:125`): `perLevel: 10` flat, max 200, category `resource`.
- `getMaxEnergy` (`Player.js:657`): `100 + energy skill`.
- `consumeEnergy` / `regenerateEnergy` (`Player.js:664, 675`): pool cap, `10% per hour` regen.
- `applyToNation` (`Player.js:639`): `nation.actionEnergy = 100 + energy`.
- `world.js:3485`: `currentEnergy -= cost` on every attack.

**Changes for 10-level rework:**
- Max 20 → 10; perLevel 10 → 10 (max 100 flat); base stays 100 → total max 200.
- Energy is the cost pool consumed by attack/defend; Evade can waive this cost.

---

### 2.10 Intuition

**User intent:** Used in launch Missile/Nuke/Spy Op. 100 base even without any levels here. 5 per level, maxing at 50 (making users 150 total).

**Current code behavior:**
- `SKILL_DEFS.intuition` (`Player.js:135`): `perLevel: 5` flat, max 100, category `passive`.
- `getMaxIntuition` / `consumeIntuition` / `regenerateIntuition` (`Player.js:694, 701, 712`): pool cap, `10% per hour` regen. **Code uses base 100** (`Player.js:691`).
- `applyToNation` (`Player.js:636`): `nation.researchBonus += intuition`.
- `processResearch` (`nation-system.js:1315`): `researchGeneration × (1 + intuitionBonus × 0.01)`.

**Gap vs. intent:** Intuition pool exists but is **not** consumed for missile/nuke/spy-op launches. It currently only boosts research. Plan updated: base = 100 (matching code), skill max = 50, total max = 150.

**Changes for 10-level rework:**
- Max 20 → 10; perLevel 5 → 5 (max 50 flat); base stays 100 → total max 150.
- Wire Intuition consumption into missile/nuke/spy-op launch paths (new cost).
- Evade can waive this cost.
- Keep research bonus OR move research to Intelligence (decide during rework; user lists Intelligence for XP/tech, Intuition for launch cost).

---

### 2.11 Taxation

**User intent:** Amount nation is taxed. 3.5% per level, maxing at 35%.

**Current code behavior:**
- `SKILL_DEFS.taxation` (`Player.js:145`): `perLevel: 1.75%`, max 35%, category `economy`.
- `calculateEconomy` (`nation-system.js:658`): `effectiveTaxRate += Player.getSkillValue('taxation') × 100`. Edict modifier applied after.
- **Not** applied in `applyToNation` (`Player.js:620-622`) — comment says Nation.calculateEconomy already adds it to avoid double-application.

**Gap vs. intent:** User says "amount nation is taxed." Code makes taxation a **bonus to tax revenue/effective rate**, not the base tax rate itself (base comes from `GameConfig.BASE_TAX_RATE`).

**Changes for 10-level rework:**
- Max 20 → 10; perLevel 1.75% → 3.5% (max 35%).
- Clarify whether taxation modifies tax rate or tax efficiency. Keep as effective-tax-rate bonus but document clearly.

---

### 2.12 Intelligence

**User intent:** XP gained, Efficiency of Technology levels. 3.5% per level, maxing at 35%.

**Current code behavior:** **Does not exist as a distinct skill.** `getSkillBonus` aliases `intelligence` → `aim` (`Player.js:606`). Diplomatic score + XP are covered by **Diplomacy** (`Nation.js:626`, `Player.js:357` gives +0.5% XP per diplomacy level). Tech efficiency is not skill-modified anywhere.

**Tie-outs (to be created):** XP gain multiplier; technology level efficiency/research cost reduction.

**Changes for 10-level rework:**
- Add `SKILL_DEFS.intelligence` (`Player.js`): `perLevel: 3.5%`, max 35% at L10, category `nation`.
- XP gain multiplier (`Player.js:_awardExperience`, line 357): scale by intelligence.
- Technology efficiency: reduce research/tech costs or increase tech effectiveness (`nation-system.js`, `entities/Technology.js`).
- Remove or re-point the `intelligence → aim` alias in `getSkillBonus`.

---

### 2.13 Diplomacy

**User intent:** Increased length of treaties allowed. 10% per level, maxing at 100% (so level 10 diplomacy doubles the length of treaties allowed).

**Current code behavior:**
- `SKILL_DEFS.diplomacy` (`Player.js:155`): `perLevel: 2.5%`, max 50%, category `nation`. Description: "Improves diplomatic relations, treaty success, and alliance yields."
- `applyToNation` (`Player.js:633`): `nation.reputationBonus += Math.round(diplomacy × 100)`.
- `setRelation` (`Nation.js:626`): improving relations amplified by `(1 + diplomacyVal)`.
- `_awardExperience` (`Player.js:357`): `+0.5% XP per diplomacy level`.

**Gap vs. intent:** User wants diplomacy to control **treaty length**, not reputation/XP/relations. Current behavior covers reputation, relations, and XP.

**Changes for 10-level rework:**
- Max 20 → 10; perLevel 2.5% → 10% (max 100%).
- Re-scope: diplomacy skill → maximum allowed treaty duration (treaty system `server/treaty-database.js`, `server/diplomacy.js`).
- Move XP bonus to Intelligence; move reputation/relations to a separate relation system or keep as secondary effect.
- Treaty max length = `baseMaxLength × (1 + diplomacy / 100)` = `baseMaxLength × 2` at level 10.

---

### 2.14 Production (NEW SKILL)

**User intent:** Increased raw resource production and resource manufacturing transition speeds. Resources produced via mines; each resource has 5 stages {raw → stage1 → stage2 → stage3 → manufactured good}. 5% per level, maxing at 50%. Only effects production amount of raw resources but adding this to mine stacking bonus, so if maxed stacked mines gives 50% and this is level 10 then 100% bonus to production.

**Current code behavior:** **Does not exist.** No resource/mining/manufacturing system in code yet.

**Tie-outs (to be created):** Raw resource production rate (mines); manufacturing transition speed across the 5 stages.

**Changes for 10-level rework:**
- Add `SKILL_DEFS.production` (`Player.js`): `perLevel: 5%`, max 50% at L10, category `economy`.
- When resource/mining system is built, apply production% to raw output per mine and to stage-transition speed.
- Production stacks with mine stacking bonus: total bonus = mineStackBonus + productionBonus.
- Add UI slot in skill modal.

---

### 2.15 Stewardship (NEW SKILL)

**User intent:** Reduced improvement/project/wonder cost and upkeep. 2.5% per level, maxing at 25%.

**Current code behavior:** **Does not exist.** No skill modifies building/project/wonder cost or upkeep.

**Tie-outs (to be created):** `systems/Nation/buildings-system.js`, `projects-system.js`, `wonders-system.js` cost/upkeep calculations.

**Changes for 10-level rework:**
- Add `SKILL_DEFS.stewardship` (`Player.js`): `perLevel: 2.5%`, max 25% at L10, category `nation`.
- Apply stewardship% as cost reduction to improvements, projects, wonders construction and upkeep.
- Add UI slot in skill modal.

---

### 2.16 Discipline (NEW SKILL)

**User intent:** Increased military unit max caps and reduced purchase costs. 2.5% per level, maxing at 25%.

**Current code behavior:** **Does not exist.** No skill modifies military unit capacity caps or purchase costs beyond Attack's existing unit-purchase discount (`world.js:866`).

**Tie-outs (to be created):** Military unit capacity/limit calculations (`server/world.js:limits()` or similar); unit purchase cost calculation (`unitQuote`).

**Changes for 10-level rework:**
- Add `SKILL_DEFS.discipline` (`Player.js`): `perLevel: 2.5%`, max 25% at L10, category `combat`.
- Apply discipline% as increase to military unit max caps (soldiers, tanks, aircraft, ships, missiles, nukes).
- Apply discipline% as reduction to military unit purchase costs (stacks with or replaces Attack's discount — decide during rework).
- Add UI slot in skill modal.
- Consider whether Attack's purchase discount should move to Discipline or remain on Attack.

---

## 3. Skills Removed / Merged

| Skill | Disposition |
|-------|-------------|
| Parry (`Player.js:115`) | Fold into Block. User's Block intent (full-or-partial negation weighed vs defender defense) covers Parry's full-negation role. Remove Parry as standalone; its chance/logic merges into Block rework. |

Result: 12 current − 1 (Parry) + 5 (Evade, Intelligence, Production, Stewardship, Discipline) = **16 total**. ✓ Matches table.

---

## 4. File:Line Index by Skill (After Rework Target)

| Skill | Canonical def (target) | Main consumers / files to change |
|-------|------------------------|----------------------------------|
| Attack | `Player.js:44` | `Player.js:724,628`; `war-system.js:1720`; `world.js:866`; `nation-system.js:1716`; `MilitaryUnit.js:210` |
| Defense | `Player.js:44` | `Player.js:773,629`; `war-system.js:1952,1975,1987`; `nation-system.js:1717`; `MilitaryUnit.js:211` |
| Block | `Player.js:44` | `Player.js:774`; `war-system.js:1974` — **rework block/negation logic; merge Parry** |
| Evade | **NEW** `Player.js:44` | `world.js:3485` (energy cost), missile/nuke/spy launch (intuition cost) — **wire new** |
| Aim | `Player.js:44` | `Player.js:727`; `world.js:3469`; `war-system.js:1097,1117,1207,1319,1415,1613,1810` — **unify client/server** |
| Crit Chance | `Player.js:44` | `Player.js:725`; `war-system.js:1767,1956` |
| Crit Damage | `Player.js:44` | `Player.js:726`; `war-system.js:1958` — **flat→percent multiplier** |
| Luck | `Player.js:44` | `Player.js:728,776,642`; `war-system.js:1769,1944,1098,1118`; `world.js:3470` — **add spy op + evade; rework semantics** |
| Energy | `Player.js:44` | `Player.js:657,664,675,639`; `world.js:3485` |
| Intuition | `Player.js:44` | `Player.js:694,701,712,636`; `nation-system.js:1315` — **wire launch cost** |
| Taxation | `Player.js:44` | `nation-system.js:658` |
| Intelligence | **NEW** `Player.js:44` | `Player.js:357` (XP), `nation-system.js`/`Technology.js` (tech efficiency) — **wire new** |
| Diplomacy | `Player.js:44` | `Player.js:633`; `Nation.js:626` — **re-scope to treaty length** |
| Production | **NEW** `Player.js:44` | resource/mining/manufacturing system (to be built) — **wire new** |
| Stewardship | **NEW** `Player.js:44` | `buildings-system.js`, `projects-system.js`, `wonders-system.js` — **wire new** |
| Discipline | **NEW** `Player.js:44` | `server/world.js` unit limits/costs, `unitQuote` — **wire new** |

---

## 5. Code Changes Checklist (for the rework)

- [ ] `entities/Player.js`: Shrink `SKILL_COST_TABLE` to 10 entries (sum 30). Redefine `SKILL_DEFS` to 16 skills with 10 max levels each with new per-level values. Add Evade, Intelligence, Production, Stewardship, Discipline. Remove Parry. Re-point `intelligence` alias away from `aim`. Update `getSkillValue`/`getSkillDisplayValue` for new percent skills.
- [ ] `entities/Player.js`: Update `_awardExperience` level-up points (3/level, no milestone bonus) to total 300; update legendary reset logic (1 legendary point = 1 × perLevel value).
- [ ] `entities/Player.js`: `applyToNation` — add new skills where relevant (production, stewardship, intelligence, discipline), remove taxation double-apply note (already excluded).
- [ ] `entities/Player.js`: `calcCombatResult` / `calcDefenseResult` — rework aim/luck/crit/block/evade to match unified intent; make misses non-crit; rework Crit Damage to percent multiplier; rework Luck to `stat × (1 + luck/100)`.
- [ ] `server/world.js`: `unitQuote` attack discount re-scaled (max attack now 750). Energy consumed on attack; add evade check to waive. Add discipline to unit caps and purchase costs.
- [ ] `server/world.js`: conventional damage — remove aim/luck damage multipliers if aiming for accuracy-only; keep if desired.
- [ ] `systems/War/war-system.js`: `calculateBaseDamage`, `rollCriticalHit`, `calculateMissileDamage`, `calculateNukeDamage`, `processDefense` — unify with client; add crit to block/defend; add evade to energy/intuition cost waiver; wire intuition cost to missile/nuke/spy launch; add luck to spy op; rework Crit Damage multiplier.
- [ ] `systems/nation-system.js`: `calculateEconomy` taxation; `processResearch` (move research bonus to Intelligence or keep); add production/stewardship hooks.
- [ ] `entities/Nation.js`: `setRelation` / diplomacy re-scope to treaty length; diplomacy XP bonus moved to Intelligence.
- [ ] `entities/MilitaryUnit.js`: attack/defense bonuses (re-scale for 10-level max).
- [ ] `ui/live/game.js:1171`: skill modal — render 16 skills, 10 slots each, new skill categories.
- [ ] Resource/mining/manufacturing system (future): wire Production and Stewardship.
- [ ] `server/treaty-database.js` / `server/diplomacy.js`: wire Diplomacy to max treaty length.
- [ ] Military unit capacity system: wire Discipline to max caps and purchase cost reduction.

---

## 6. Open Decisions for Rework

1. **Block vs Parry:** Merge Parry into Block (full negation as top tier of block) or keep Parry as a separate combat micro-skill? User list omits Parry → recommend merge.
2. **Intuition vs Intelligence vs Research:** Currently Intuition boosts research; user wants Intelligence for XP/tech and Intuition for launch cost. Decide whether research bonus moves to Intelligence.
3. **Aim damage multiplier:** Code currently multiplies conventional/missile/nuke damage by aim. User wants aim = accuracy only. Remove multiplier or keep as secondary?
4. **Crit Damage flat vs percent:** Code flat-adds; user wants percent multiplier. Change to `(1 + critDamage/100)` multiplier on crit. Level 10 = 400% bonus = 5x total damage.
5. **Taxation semantics:** Bonus to effective tax rate vs. the tax rate itself. Document chosen semantics.
6. **Discipline vs Attack purchase discount:** Attack currently gives unit purchase discount (`world.js:866`). Discipline also reduces purchase costs. Decide whether Attack's discount moves to Discipline, stacks, or stays separate.
7. **Discipline caps:** Which unit types get cap increases (soldiers/tanks/aircraft/ships/missiles/nukes)? Flat or percent increase?
8. **Cost imbalance by power level:** Attack/Defense at 75 flat per level are much stronger per point than Stewardship/Discipline at 2.5% per level, yet both cost 30 total to max. Consider differentiated cost tables by skill power tier, or accept that players will prioritize Attack/Defense.

---

## 6.5 Critical Interaction Specifications (Must Be Defined Before Implementation)

### 6.5.1 Crit Chance Hard Cap
- Base max at level 10: 50% crit chance.
- **Hard cap decision needed:** Does legendary push crit chance above 50%? `getSkillValue` returns `(level + legendaryBonusPts) × perLevel` with no cap enforcement. Level 10 + 1 legendary = 55%. Recommend: hard-cap crit chance at 50% (legendary points beyond level 10 provide no additional crit chance), OR allow uncapped up to 95% (matching `rollCriticalHit` existing `Math.min(0.95, ...)` clamp).

### 6.5.2 Legendary Points + Luck (Chance-Based)
- Luck is probabilistic: `if (Math.random() < luck / 100) statValue × (1 + luck / 100)`.
- Legendary point adds +1 to luck value. Level 10 + 1 legendary = luck 31 → 31% chance of 31% boost.
- **Specification:** Legendary points increase BOTH the trigger chance AND the boost magnitude equally (they add to the luck flat value, which is used for both).

### 6.5.3 Legendary Points + Crit Damage (Roll-Based)
- Crit damage rolls between `1.0` and `(1 + critDamage / 100)` on each crit.
- Legendary point adds +40 to max crit damage bonus. Level 10 + 1 legendary = max 440% bonus → roll range 1x to 5.4x.
- **Specification:** Legendary points increase the MAX of the roll range (upper bound only). Minimum roll stays at 1.0x.

### 6.5.4 Evade-Luck Interaction
- **Unspecified:** How does luck modify evade chance? Options:
  - `evadeChance + (luck × 0.1)` — additive percentage points
  - `evadeChance × (1 + luck / 100)` — multiplicative
- **Recommendation:** Additive (`evade% + luck × 0.1`). At level 10 evade (50%) + luck 30 × 0.1 = 3% → 53% total evade chance.

### 6.5.5 Missile/Nuke/Spy Op Intuition Cost
- **Unspecified:** How much intuition does each action cost? Need values for:
  - Missile launch
  - Nuke launch
  - Spy op launch
- **Recommendation:** Missile = 25, Nuke = 50, Spy Op = 15 (placeholders pending design).

### 6.5.6 Parry Removal Steps
- Remove `parry` from `SKILL_DEFS` (`Player.js:115-124`).
- Remove Parry references from `calcDefenseResult` (`Player.js:773-779`).
- Remove Parry references from `war-system.js` `processDefense`.
- Remove Parry from `getSkillBonus` alias map if present.
- Parry's full-negation role absorbed by Block rework.

### 6.5.7 New Skill Icons
- 5 new skills need icon assets: Evade, Intelligence, Production, Stewardship, Discipline.
- Icon path pattern: `assets/images/Skills/<Name>.png` (matching existing convention).

### 6.5.8 Diplomacy XP Bonus Relocation
- Move XP bonus from Diplomacy (`Player.js:355-357`) to Intelligence.
- Change `_awardExperience` to read Intelligence skill instead of Diplomacy for XP multiplier.

### 6.5.9 Intelligence → Aim Alias Removal
- Remove `intelligence: 'aim'` from `getSkillBonus` aliasMap (`Player.js:604`).
- Intelligence becomes a standalone skill with its own effects.

### 6.5.10 Energy Base Consistency
- Code `getMaxEnergy()` (`Player.js:654`) uses base 100. Plan matches: base 100 + skill max 100 = 200 total.
- `applyToNation` (`Player.js:637`) sets `nation.actionEnergy = 100 + energy skill`. Consistent.

### 6.5.11 Intuition Base Consistency (FIXED)
- Code `getMaxIntuition()` (`Player.js:691`) uses base **100**, not 50. Plan updated to match: base 100 + skill max 50 = 150 total.
- Constructor sets `currentIntuition = 100` (`Player.js:232`). Consistent with base 100.

---

## 7. Scan Results: What Would & Wouldn't Work

### What would work with the current plan values:
- **Point pool math:** 300 points / 30 per skill = exactly 10 skills maxed, 6 at zero. Clean, meaningful choices.
- **Legendary points:** 1 legendary point = 1 × perLevel value works cleanly for all skills (flat or %). For Luck/Crit Damage, legendary increases both chance/magnitude (Luck) or max roll bound (Crit Damage).
- **Energy base 100 + skill 100 = 200 total:** Consistent with existing `getMaxEnergy` pattern (`Player.js:654`).
- **Intuition base 100 + skill 50 = 150 total:** Consistent with existing `getMaxIntuition` pattern (`Player.js:691`, base 100). Plan corrected from earlier "base 50" error.
- **Luck semantics (probabilistic):** 30% chance of 30% boost at level 10. Works as chance-to-trigger roll.
- **Crit Damage 40% per level → 400% max:** Works as roll-based multiplier (1x to 5x at level 10).
- **Diplomacy 10% per level → 100% max:** Works as treaty length multiplier `(1 + 1.0) = 2x` base length.
- **Production 5% per level → 50% max:** Stacks with mine stacking bonus (50% + 50% = 100%).

### What needs to change in code (beyond the md plan):
1. `entities/Player.js` — all skill definitions, cost table, level-up points, `getSkillValue`, `applyToNation`, combat result methods. Remove Parry, add 5 new skills, fix intelligence→aim alias, move diplomacy XP to Intelligence.
2. `server/world.js` — `unitQuote` discount divisor, energy consumption with evade waiver, discipline unit caps, aim/luck damage multipliers.
3. `systems/War/war-system.js` — crit chance/damage, block logic, evade, intuition cost on missile/nuke/spy, luck on spy op, rework Crit Damage multiplier to roll-based.
4. `systems/nation-system.js` — taxation, research/intelligence, production/stewardship hooks.
5. `entities/Nation.js` — diplomacy re-scope to treaty length.
6. `ui/live/game.js` — skill modal for 16 skills × 10 levels.

### Potential bugs/issues with the plan itself:
- **Attack/Defense power disparity:** 75 flat/level vs 2.5%/level for Stewardship/Discipline at the same 30-point cost creates strong incentive to max Attack/Defense first. No cost differentiation in plan. User has accepted this imbalance as intentional.
- **Crit Damage 400% = 5x max multiplier:** Very high damage spike at level 10. May one-shot targets before defensive skills can mitigate. Mitigated by roll-based mechanic (not every crit hits 5x).
- **Luck max 30 = 30% chance of 30% boost:** 70% of the time luck does nothing. Could feel unrewarding at low levels. Compounded with crit chance + luck on crit damage for exponential effects.
- **Crit Chance uncapped with legendary:** Level 10 + legendary points can exceed 50% (e.g. 55% with 1 legendary). No hard cap enforced in `getSkillValue`. Decision needed: cap at 50% or allow uncapped.
- **Energy base 100 + skill max 100:** If Evade fails, players at level 10 Energy have 200 energy pool but still pay full cost per attack. Evade becomes essential at high levels.
- **Intuition base 100 + skill max 50 = 150 total:** Same as Energy — 150 pool, but missile/nuke/spy costs not yet defined in code. Wire-in required before this skill functions. Intuition cost amounts for missile/nuke/spy not specified.
- **New skill icons:** 5 new skills need icon files (`assets/images/Skills/<Name>.png`) not yet created.
