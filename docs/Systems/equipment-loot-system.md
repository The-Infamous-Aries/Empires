# Equipment & Loot System Documentation
## Sovereignty Epochs — Nation Ruler Roleplay Game

**Location:** `systems/Equipment/equipment-loot-system.js`  
**Data files:** `assets/data/equipment/rarity-tiers.js`, `sets.js`, `items.js`, `chests.js`, `loot-tables.js`  
**Integrations:** `server/world.js`, `entities/Nation.js`, `entities/Player.js`, `systems/XP/xp-goals-system.js`, `systems/Resource/resource-system.js`, `core/query-system.js`, `core/config.js`, `ui/live/game.js`

---

## Table of Contents

1. [Overview](#overview)
2. [Rarity Tiers (`rarity-tiers.js`)](#rarity-tiers)
3. [Item Definitions (`items.js`)](#item-definitions)
4. [Set Definitions (`sets.js`)](#set-definitions)
5. [Chest & Key Definitions (`chests.js`)](#chest-key-definitions)
6. [Loot Tables (`loot-tables.js`)](#loot-tables)
7. [EquipmentLootSystem Class](#equipment-loot-system-class)
8. [Durability & Decay](#durability-decay)
9. [Set Bonuses](#set-bonuses)
10. [Weapon Sets (Gun/Melee Tie-ins)](#weapon-sets)
11. [Chest Opening](#chest-opening)
12. [Repair Consumables](#repair-consumables)
13. [World Bank Integration](#world-bank-integration)
14. [Goal & Streak Chest Rewards](#goal-streak-chest-rewards)
15. [Login Streak Chest Rewards](#login-streak-chest-rewards)
16. [Query System Visibility](#query-system-visibility)
17. [Serialization / Persistence](#serialization-persistence)
18. [Stat Scaling Tables](#stat-scaling-tables)

---

## Overview <a name="overview"></a>

The Equipment & Loot System is a complete equipment, loot, chest, durability, and set-bonus system for Sovereignty Epochs. It handles:

- **Item generation** from templates with rolled stats and durability per rarity tier
- **Chest opening** (requires chest + matching key(s), both consumed)
- **Equip / unequip** (one item per canonical slot, auto-unequips incumbent)
- **Set bonus computation** (max 2 active set bonuses at a time)
- **Durability decay** (flat 1/turn + flat 0.5 per war action)
- **Production bonus** per raw resource (tools boost ALL resources)
- **Repair consumables** (Drill-Bit / Grinder-Wheel / MegaDrill-Bit restore tool durability to tier max)
- **Gun / Melee sets** tied to Clothing / Armor / Protective sets
- **War loot** (Luck-based independent key/chest drops on conventional attacks/defends)
- **Goal streak chest rewards** (daily/weekly/monthly 7/10 completions)
- **Login streak chest rewards** (daily/weekly/bi-weekly/monthly login chests)

---

## Rarity Tiers (`rarity-tiers.js`) <a name="rarity-tiers"></a>

Seven custom tiers, weakest → strongest. Names are **not** overused Common/Uncommon/Rare/Epic/Legendary/Mythic.

| # | Tier Key | Display Name | Frame Color | BG Color | Durability (turns) | Theme |
|---|----------|--------------|-------------|----------|--------------------|-------|
| 1 | `derelict` | Derelict | `#F8F9FA` (white) | `#1E293B` | 24–36 | weakest, scrap |
| 2 | `weathered` | Weathered | `#2E7D32` (forest green) | `#14532D` | 36–48 | issued gear |
| 3 | `seasoned` | Seasoned | `#42A5F5` (light blue) | `#0D47A1` | 48–64 | reliable |
| 4 | `reinforced` | Reinforced | `#CE93D8` (lavender) | `#4A148C` | 64–80 | well-made |
| 5 | `polished` | Polished | `#C62828` (blood red) | `#B71C1C` | 80–104 | rare |
| 6 | `sovereign` | Sovereign | `#F57C00` (reddish orange) | `#E65100` | 104–140 | best |
| 7 | `epochal` | Epochal | `#D4AF37` (gold) | `#4A3700` | 140–180 | epoch-defining, strongest |

### Stat Windows Per Tier

Each item rolls one value per stat it boosts within its tier's min–max window. Example windows:

| Stat | Unit | Derelict | Weathered | Seasoned | Reinforced | Polished | Sovereign | Epochal |
|------|------|----------|-----------|----------|------------|----------|-----------|---------|
| Attack | flat | 5–15 | 12–28 | 22–42 | 38–62 | 52–82 | 70–110 | 85–140 |
| Defense | flat | 5–15 | 12–28 | 22–42 | 38–62 | 52–82 | 70–110 | 85–140 |
| Block | flat | 3–9 | 8–18 | 15–28 | 24–40 | 36–56 | 50–75 | 65–95 |
| Evade | % | 0.5–1.5 | 1.5–3 | 3–5 | 5–8 | 8–12 | 12–18 | 15–25 |
| Aim | % | 0.5–1.5 | 1.5–3 | 3–5 | 5–8 | 8–12 | 12–18 | 15–25 |
| Crit Chance | % | 0.5–1.5 | 1.5–3 | 3–5 | 5–8 | 8–12 | 12–18 | 15–25 |
| Crit Damage | % | 4–12 | 10–22 | 18–34 | 30–48 | 42–66 | 58–90 | 75–120 |
| Luck | flat | 0–2 | 1–4 | 3–7 | 6–10 | 9–14 | 12–18 | 15–25 |
| Intelligence | % | 0.5–1.5 | 1.5–3 | 3–5 | 5–8 | 8–12 | 12–18 | 15–25 |
| Diplomacy | % | 1–3 | 3–6 | 5–9 | 8–14 | 12–20 | 16–28 | 22–38 |
| Production | % | 0.5–1.5 | 1.5–3 | 3–5 | 5–8 | 8–12 | 12–18 | 15–25 |
| Stewardship | % | 0.5–1 | 1–2 | 2–3.5 | 3–5 | 4.5–7 | 6–9 | 8–14 |
| Discipline | % | 0.5–1 | 1–2 | 2–3.5 | 3–5 | 4.5–7 | 6–9 | 8–14 |
| Taxation | % | 0.5–1 | 1–2 | 2–3.5 | 3–5 | 4.5–7 | 6–9 | 8–14 |
| Energy | flat | 1–3 | 2–6 | 4–10 | 6–14 | 8–20 | 10–28 | 12–40 |
| Intuition | flat | 1–3 | 2–6 | 4–10 | 6–14 | 8–20 | 10–28 | 12–40 |

### Category → Stat Keys

| Category | Boosted Stats |
|----------|--------------|
| Armor | aim, defense, evade |
| Clothing | stewardship, taxation, diplomacy, discipline |
| Protective | intelligence, block, production, luck |
| Gun / Melee | attack, criticalChance, criticalDamage |
| Tool | production |

### Slot → Category Mapping

| Canonical Slot | Accepts Categories |
|----------------|-------------------|
| weapon | gun, melee |
| head | armor, clothing, protective |
| body | armor, clothing, protective |
| arms | protective |
| legs | clothing |
| feet | armor, clothing, protective |
| tool | tool |

---

## Item Definitions (`items.js`) <a name="item-definitions"></a>

All items are **templates** (not instances). Item instances are generated by `EquipmentLootSystem.generateItem()` with rolled stats, durability, and tier.

### Armor (11 materials × 3 slots)

Materials: Wood, RustyIron, Iron, Stone, Steel, Nature, Elven, Crystal, Volcanic, SciFi, Advanced  
Slots: Helmet (head), Armor (body), Boots (feet)  
Each material = one Armor set (3 pieces)

### Clothing (10 named sets × 4 slots)

| Set # | Name | Asset Prefix |
|-------|------|-------------|
| 1 | Amethyst Feline | `set-1-*` |
| 2 | Monochrome Chill | `set-2-*` |
| 3 | Autumn Runner | `set-3-*` |
| 4 | Cobalt Ninja | `set-4-*` |
| 5 | Dragonfruit Mariachi | `set-5-*` |
| 6 | Verdant Bard | `set-6-*` |
| 7 | Crimson Fez | `set-7-*` |
| 8 | Solar Cultist | `set-8-*` |
| 9 | Midnight Shinobi | `set-9-*` |
| 10 | Tidal Shutter | `set-10-*` |

Slots: Head, Shirt (body), Pants (legs), Shoes (feet)

### Protective (4 named sets × 4 slots)

| Set # | Name | Asset Prefix |
|-------|------|-------------|
| 1 | Obsidian Responder | `protective-*-1` |
| 2 | Acidic Quarantine | `protective-*-2` |
| 3 | Caution Suit | `protective-*-3` |
| 4 | Bloodline Containment | `protective-*-4` |

Slots: Head, Shirt (body), Gloves (arms), Boots (feet)

### Guns (40 icons: 11 materials × 10 types)

Guns are named `"{SetName} {Type}"` where SetName comes from the material's tied sets. Each gun has `tiedSets` listing every Clothing/Armor/Protective set it counts toward.

| Material | Weapon Name Example | Tied Sets |
|----------|-------------------|-----------|
| Wood | Wood Rifle | none (generic) |
| Iron | Iron Shotgun | none (generic) |
| Stone | Stone SMG | none (generic) |
| RustyIron | Verdant Bard Pistol | ClothingSet6, ClothingSet8 |
| Steel | Obsidian Responder Sniper | Protective1, ClothingSet9 |
| Nature | Acidic Quarantine Revolver | Protective2, ClothingSet5 |
| Elven | Caution Suit Carbine | Protective3, ClothingSet3 |
| Crystal | Amethyst Feline Launcher | ClothingSet1 |
| Volcanic | Bloodline Containment MG | Protective4, ClothingSet7 |
| SciFi | Monochrome Chill Crossbow | ClothingSet2 |
| Advanced | Cobalt Ninja Rifle | ClothingSet4, ClothingSet10 |

### Melee (6 material tiers, icons `Melee/<n>-<Type>.png`)

| Tier | Material | Weapon Name Example | Tied Sets |
|------|----------|-------------------|-----------|
| 1 | Nature | Acidic Quarantine Kriss | Protective2, ClothingSet5, ClothingSet6 |
| 2 | SciFi | Tidal Shutter Switchblade | ClothingSet10, ClothingSet4 |
| 3 | Volcanic | Bloodline Containment Pickaxe | Protective4, ClothingSet3 |
| 4 | Crystal | Amethyst Feline Axe | ClothingSet1, ClothingSet2 |
| 5 | RustyIron | Caution Suit Cleaver | Elven Armor, Protective3, ClothingSet8 |
| 6 | Advanced | Obsidian Responder Bat | Protective1, ClothingSet7 |

### Tools (9 icons)

| Tool | Tier Availability | Production Boost | Repair Role |
|------|------------------|------------------|-------------|
| Pickaxe | All 6 tiers | ALL raw resources (smallest boost) | — |
| Shovel | All 6 tiers | ALL raw resources (smallest boost) | — |
| Flashlight | All 6 tiers | ALL raw resources (smallest boost) | — |
| Drill | Tiers 2–6 | ALL raw resources (slightly better than Pickaxe) | Repaired by Drill-Bit |
| Drill-Bit | All 6 tiers | None | Repairs Drill to tier max durability |
| Grinder | Tiers 3–6 | ALL raw resources (slightly better than Drill) | Repaired by Grinder-Wheel |
| Grinder-Wheel | All 6 tiers | None | Repairs Grinder to tier max durability |
| MegaDrill | Tiers 4–6 | ALL raw resources (slightly better than Grinder) | Repaired by MegaDrill-Bit |
| MegaDrill-Bit | All 6 tiers | None | Repairs MegaDrill to tier max durability |

---

## Set Definitions (`sets.js`) <a name="set-definitions"></a>

### Set Bonus Activation

| Pieces Equipped | Bonus % | Perk |
|----------------|---------|------|
| 1 item | Individual stats only | None |
| 2 items | +5% of combined slot stat | None |
| 3 items | +10% of combined slot stat | None |
| 4 items | +15% of combined slot stat + unique perk | Perk 4 |

**Rule:** Maximum 2 active set bonuses at a time. If 3+ sets qualify, only the 2 strongest apply.

### Armor Sets (3 pieces each: Helmet/Armor/Boots)

| Material | Stat Bonus | Example Names |
|----------|------------|---------------|
| Wood | Defense | Wooden Helmet/Armor/Boots |
| RustyIron | Block | Rusty Helmet/Armor/Boots |
| Iron | Attack | Iron Helmet/Armor/Boots |
| Stone | Defense | Stone Helmet/Armor/Boots |
| Steel | Attack | Steel Helmet/Armor/Boots |
| Nature | Critical Chance | Nature Helmet/Armor/Boots |
| Elven | Aim | Elven Helmet/Armor/Boots |
| Crystal | Critical Damage | Crystal Helmet/Armor/Boots |
| Volcanic | Critical Chance | Volcanic Helmet/Armor/Boots |
| SciFi | Aim | SciFi Helmet/Armor/Boots |
| Advanced | Critical Damage | Advanced Helmet/Armor/Boots |

### Clothing Sets (4 pieces each: Head/Shirt/Pants/Shoes)

| Set # | Name | Stat Bonus |
|-------|------|------------|
| 1 | Amethyst Feline | Luck |
| 2 | Monochrome Chill | Diplomacy |
| 3 | Autumn Runner | Energy |
| 4 | Cobalt Ninja | Evade |
| 5 | Dragonfruit Mariachi | Production |
| 6 | Verdant Bard | Stewardship |
| 7 | Crimson Fez | Taxation |
| 8 | Solar Cultist | Discipline |
| 9 | Midnight Shinobi | Intelligence |
| 10 | Tidal Shutter | Intuition |

### Protective Sets (4 pieces each: Head/Shirt/Gloves/Boots)

| Set # | Name | Resources Boosted | Split |
|-------|------|-------------------|-------|
| 1 | Obsidian Responder | Steel, Aluminum | Yes (50/50 each) |
| 2 | Acidic Quarantine | Uranium | No (100%) |
| 3 | Caution Suit | Bronze, Copper | Yes (50/50 each) |
| 4 | Bloodline Containment | Gasoline, Lead | Yes (50/50 each) |

Protective set bonus scaling: 5% (Derelict) → 100% (Epochal), linear interpolation based on average tier of equipped pieces.

### Gun Set Tie-ins

Each gun counts toward ALL its tied sets simultaneously for set-bonus piece counts. Guns do NOT unlock armor/clothing/protective set bonuses themselves—they only add piece count to sets they're tied to.

### Melee Set Tie-ins

Same as guns—each melee counts toward ALL its tied sets simultaneously.

---

## Chest & Key Definitions (`chests.js`) <a name="chest-key-definitions"></a>

### Chest Definition

| Chest | Asset | Key Required | Key Cost | Rarity Weights (D→W→S→R→P→So→E) | Tiers Available |
|-------|-------|-------------|----------|----------------------------------|-----------------|
| Chest 1 | chest1.png | Key1 | 1× Key1 | 40 / 35 / 15 / 8 / 2 / 0 / 0 | 1–5 only |
| Chest 2 | chest2.png | Key2 | 1× Key2 | 15 / 30 / 35 / 15 / 4 / 1 / 0 | 1–6 only |
| Chest 3 | chest3.png | Key3 | 1× Key3 | 5 / 10 / 20 / 30 / 25 / 9 / 1 | 1–7 |
| Chest 4 | chest4.png | Key1+Key2+Key3 | 1× each | 0 / 5 / 10 / 20 / 25 / 35 / 5 | 2–7 only |

**Rarity weight key:** D=Derelict, W=Weathered, S=Seasoned, R=Reinforced, P=Polished, So=Sovereign, E=Epochal  
**Better chests are strictly lower chance for higher tiers.**

### Key Definition

| Key | Asset | Opens |
|-----|-------|-------|
| Key1 | Key1.png | Chest 1 |
| Key2 | Key2.png | Chest 2 |
| Key3 | Key3.png | Chest 3 + Chest 4 |

### World Bank Base Prices

| Item | Price |
|------|-------|
| Key1 | 5 |
| Key2 | 15 |
| Key3 | 50 |
| Chest 1 | 100 |
| Chest 2 | 500 |
| Chest 3 | 2000 |
| Chest 4 | 10000 |

Keys cost less than chests because keys spawn more frequently in war loot.

---

## Loot Tables (`loot-tables.js`) <a name="loot-tables"></a>

Each chest has item templates per rarity tier. When a chest opens:
1. Roll rarity tier from chest's weight table
2. Pick random item from that tier's loot pool
3. Generate item instance with rolled stats/durability
4. Grant to nation inventory

Guns and Melee weapons appear in the loot pool of EVERY set they're tied to (see items.js `tiedSets`). For example, a ClothingSet6 chest can drop Verdant Bard guns, and a ClothingSet8 chest can also drop them.

---

## EquipmentLootSystem Class <a name="equipment-loot-system-class"></a>

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `generateItem(templateKey, category, tier)` | Item object | Generate item instance from template with rolled stats/durability |
| `openChest(nation, chestKey, luck)` | {success, chest, keysConsumed, items, tier} | Open chest: consume chest + key(s), roll loot |
| `grantChest(nation, chestKey)` | {success, chestKey, count} | Grant chest without keys (goal/war/war loot/source) |
| `equipItem(nation, itemId)` | {success, unequippedItemId} | Equip item, auto-unequips incumbent in same slot |
| `unequipItem(nation, itemId)` | {success} | Unequip item back to inventory |
| `computeSetBonuses(nation)` | {activeBonuses, totalBonuses} | Compute active set bonuses (max 2) |
| `getNationBonuses(nation)` | {attack, defense, block, ...} | All stat bonuses from equipped items + set bonuses |
| `getProductionBonus(nation, resourceKey)` | number (decimal %) | Sum of equipped production-boosting tools |
| `getResourceBonus(nation)` | {resourceKey: percentBonus} | Protective set resource bonuses |
| `getClothingStatBonus(nation)` | {statKey: percentBonus} | Clothing set stat bonuses |
| `getArmorStatBonus(nation)` | {statKey: percentBonus} | Armor set stat bonuses |
| `useRepairConsumable(nation, itemId)` | {success, repairedItemId, restoredTo} | Repair consumable restores tool to tier max |
| `processTurn(nation)` | {broken: [itemIds]} | Flat 1 durability decay on all equipped items |
| `applyWarActionDurabilityLoss(nation, isDefender)` | {broken: [itemIds]} | Flat 0.5 durability loss per Attack/Defend |
| `getState(nation)` | object | Serialize equipment state |
| `setState(nation, state)` | — | Restore equipment state |

---

## Durability & Decay <a name="durability-decay"></a>

### Durability Total

Set at acquisition by rolling within the tier's durability window:

| Tier | Durability Window (turns) |
|------|--------------------------|
| Derelict | 24–36 |
| Weathered | 36–48 |
| Seasoned | 48–64 |
| Reinforced | 64–80 |
| Polished | 80–104 |
| Sovereign | 104–140 |
| Epochal | 140–180 |

### Decay Sources

| Source | Amount | Frequency |
|--------|--------|-----------|
| Per-turn decay | Flat 1 | Every game turn (day_passed) |
| War-action decay | Flat 0.5 | Every Attack/Defend (attacker + defender if counter-damage > 0) |

When durability reaches 0:
- Item is auto-unequipped
- Item is destroyed (removed from inventory)
- `EventBus.emit(GameEvents.EQUIPMENT_ITEM_BROKEN, { item })`

### Repair

Repair consumables (Drill-Bit, Grinder-Wheel, MegaDrill-Bit) restore the equipped target tool's durability to its **max durability for its rarity tier** (not a percentage). Consumed on use.

---

## Set Bonuses <a name="set-bonuses"></a>

### Clothing Set Bonus (4 pieces)

Each clothing set grants a stat bonus scaling from 5% (Derelict) to 100% (Epochal), based on average tier of equipped pieces:

| Clothing Set | Stat |
|--------------|------|
| Amethyst Feline | Luck |
| Monochrome Chill | Diplomacy |
| Autumn Runner | Energy |
| Cobalt Ninja | Evade |
| Dragonfruit Mariachi | Production |
| Verdant Bard | Stewardship |
| Crimson Fez | Taxation |
| Solar Cultist | Discipline |
| Midnight Shinobi | Intelligence |
| Tidal Shutter | Intuition |

### Armor Set Bonus (3 pieces)

| Armor Material | Stat |
|----------------|------|
| Wood | Defense |
| RustyIron | Block |
| Iron | Attack |
| Stone | Defense |
| Steel | Attack |
| Nature | Critical Chance |
| Elven | Aim |
| Crystal | Critical Damage |
| Volcanic | Critical Chance |
| SciFi | Aim |
| Advanced | Critical Damage |

### Protective Set Resource Bonus (4 pieces)

Each protective set grants raw resource production bonus scaling 5% → 100%:

| Protective Set | Resources | Split |
|----------------|-----------|-------|
| Obsidian Responder | Steel, Aluminum | Yes (50/50) |
| Acidic Quarantine | Uranium | No (100%) |
| Caution Suit | Bronze, Copper | Yes (50/50) |
| Bloodline Containment | Gasoline, Lead | Yes (50/50) |

### Weapon Bonus

Guns/Melee tied to a set (via `tiedSets`) add **+2.5% each** to the set bonus percentage but do NOT count toward the piece-count unlock requirement.

---

## Weapon Sets <a name="weapon-sets"></a>

### Gun Sets

| Material | Name Example | Tied Sets |
|----------|-------------|-----------|
| Wood | Wood Rifle | None |
| Iron | Iron Shotgun | None |
| Stone | Stone SMG | None |
| RustyIron | Verdant Bard Pistol | ClothingSet6, ClothingSet8 |
| Steel | Obsidian Responder Sniper | Protective1, ClothingSet9 |
| Nature | Acidic Quarantine Revolver | Protective2, ClothingSet5 |
| Elven | Caution Suit Carbine | Protective3, ClothingSet3 |
| Crystal | Amethyst Feline Launcher | ClothingSet1 |
| Volcanic | Bloodline Containment MG | Protective4, ClothingSet7 |
| SciFi | Monochrome Chill Crossbow | ClothingSet2 |
| Advanced | Cobalt Ninja Rifle | ClothingSet4, ClothingSet10 |

### Melee Sets

| Material | Name Example | Tied Sets |
|----------|-------------|-----------|
| Nature | Acidic Quarantine Kriss | Protective2, ClothingSet5, ClothingSet6 |
| SciFi | Tidal Shutter Switchblade | ClothingSet10, ClothingSet4 |
| Volcanic | Bloodline Containment Pickaxe | Protective4, ClothingSet3 |
| Crystal | Amethyst Feline Axe | ClothingSet1, ClothingSet2 |
| RustyIron | Caution Suit Cleaver | Elven Armor, Protective3, ClothingSet8 |
| Advanced | Obsidian Responder Bat | Protective1, ClothingSet7 |

---

## Chest Opening <a name="chest-opening"></a>

### Requirements

Opening a chest requires **BOTH** the chest AND its matching key(s). Both are consumed on open.

| Chest | Asset | Key(s) Required |
|-------|-------|----------------|
| Chest 1 | chest1.png | 1× Key1 |
| Chest 2 | chest2.png | 1× Key2 |
| Chest 3 | chest3.png | 1× Key3 |
| Chest 4 | chest4.png | 1× Key1 + 1× Key2 + 1× Key3 |

### Loot Roll

1. Roll rarity tier from chest's weight table
2. Apply Luck-based tier bump: `Luck × 0.25%` chance to bump tier up by one (capped at Epochal, only one bump)
   - Example: Luck 30 → 7.5% bump chance
   - Chest4 base Epochal = 5%. With Luck 30: Sovereign (35%) × 7.5% = ~2.6% additional Epochal, total ~7.6% — within 7.5–10% design target
3. Pick random item from that chest's loot table for the final tier
4. Roll item's stats within the tier window
5. Roll durability within the tier window
6. Grant item(s) to player's inventory

---

## Repair Consumables <a name="repair-consumables"></a>

| Item | Repairs | Tiers Available | Effect |
|------|---------|----------------|--------|
| Drill-Bit | Drill | All 6 tiers | Restores Drill durability to tier max |
| Grinder-Wheel | Grinder | All 6 tiers | Restores Grinder durability to tier max |
| MegaDrill-Bit | MegaDrill | All 6 tiers | Restores MegaDrill durability to tier max |

Consumed on use. Do NOT boost production.

---

## World Bank Integration <a name="world-bank-integration"></a>

Keys and chests can be bought/sold through the World Bank (`server/world.js` `worldBankBuy`/`worldBankSell` socket actions).

| Item | Base Price |
|------|-----------|
| Key1 | 5 |
| Key2 | 15 |
| Key3 | 50 |
| Chest 1 | 100 |
| Chest 2 | 500 |
| Chest 3 | 2000 |
| Chest 4 | 10000 |

Price adjusts based on inventory vs target stock (supply factor). Tax from purchases routes to the World Lottery pot (`this.state.lottery.pool`).

---

## Goal & Streak Chest Rewards <a name="goal-streak-chest-rewards"></a>

Handled in `server/world.js` `processTurn()` and `systems/XP/xp-goals-system.js`.

### Daily Goals (7/10)
- **Reward:** Chest1 × streakCount
- **Timing:** Every game turn (day_passed)
- **Condition:** `completedGoalIds.daily.size >= 7`

### Weekly Goals (7/10)
- **Reward:** Chest2 × streakCount
- **Timing:** Every 7 days
- **Condition:** `completedGoalIds.weekly.size >= 7`

### Monthly Goals (7/10)
- **Reward:** Chest3 × 1 per month
- **Timing:** Every 30 days
- **Condition:** `completedGoalIds.monthly.size >= 7`
- **Stacking:** 4 chest3s → 1 chest4. Stack to 4 chest4s max. Reset yearly (day % 365).

---

## Login Streak Chest Rewards <a name="login-streak-chest-rewards"></a>

Handled in `server/world.js` `updateLoginDate()` / `grantLoginChest()` / `grantMonthlyLoginChest()`.

| Reward | Condition |
|--------|-----------|
| Chest1 | Every day logged in |
| Chest2 | Every 7 consecutive days logged in |
| Chest3 | Every 14 consecutive days logged in |
| Chest4 | Every day of the month logged in (resets monthly) |

### Tracking State (`nation.equipment.loginStreakChests`)

| Field | Description |
|-------|-------------|
| consecutiveDays | Current consecutive login streak |
| lastLoginDate | YYYY-MM-DD of last login |
| weeklyChestCount | Chest2s granted this month |
| monthlyChestCount | Chest3s granted this month |
| loginMonthYear | YYYY-MM of current month |
| allMonthDaysLogged | Whether every day of month logged in |

---

## Query System Visibility <a name="query-system-visibility"></a>

**File:** `core/query-system.js`

The `equipment` field on `nations` is classified as `player_data` in `FIELD_PERMISSIONS.nations`, gated by `canViewBestFriendNemesis()`:

- **Owner:** Can see own equipment
- **Alliance government** (leader/officer/admin): Can see alliance members' equipment
- **Everyone else:** Cannot see equipment

---

## Serialization / Persistence <a name="serialization-persistence"></a>

### Nation Serialization (`entities/Nation.js`)

The `equipment` object is included in `serialize()` and restored in `deserialize()`:

```js
equipment: {
    inventory: [...],
    keys: { key1: 0, key2: 0, key3: 0 },
    chests: { chest1: 0, chest2: 0, chest3: 0, chest4: 0 },
    equipped: { weapon: null, head: null, body: null, arms: null, legs: null, feet: null, tool: null },
    goalStreaks: { dailyStreak: 0, weeklyStreak: 0, monthlyStreak: 0 },
    chestStacks: { chest3: 0, chest4: 0 },
    loginStreakChests: { consecutiveDays: 0, lastLoginDate: null, ... }
}
```

### EquipmentLootSystem Serialization (`equipment-loot-system.js`)

| Method | Purpose |
|--------|---------|
| `getState(nation)` | Returns equipment state for serialization |
| `setState(nation, state)` | Restores equipment state from saved data |

---

## Stat Scaling Tables <a name="stat-scaling-tables"></a>

### Set Bonus Percentages by Tier

| Tier | Index | Bonus % |
|------|-------|---------|
| Derelict | 0 | 5% |
| Weathered | 1 | 20.8% |
| Seasoned | 2 | 36.7% |
| Reinforced | 3 | 52.5% |
| Polished | 4 | 68.3% |
| Sovereign | 5 | 84.2% |
| Epochal | 6 | 100% |

Formula: `5 + (avgTierIndex / 6) * 95`

### Set Bonus Piece Count Multipliers

| Pieces | Bonus % |
|--------|---------|
| 1 | 0% (individual stats only) |
| 2 | 5% |
| 3 | 10% |
| 4 | 15% + unique perk |

### Weapon Bonus per Tied Set

| Weapon Type | Bonus per Equipped Item |
|-------------|------------------------|
| Gun | +2.5% |
| Melee | +2.5% |

---

## File Reference Summary

| File | Purpose |
|------|---------|
| `assets/data/equipment/rarity-tiers.js` | 7 tiers, colors, durability windows, stat windows, category stats |
| `assets/data/equipment/sets.js` | SET_DEFS: armor/clothing/protective sets + gunSets/meleeSets tie-ins |
| `assets/data/equipment/items.js` | EQUIPMENT_ITEMS: all item templates with names, assets, slots, categories, sets, tiedSets |
| `assets/data/equipment/chests.js` | EQUIPMENT_CHESTS: 4 chests, 3 keys, World Bank prices |
| `assets/data/equipment/loot-tables.js` | EQUIPMENT_LOOT_TABLES: per-chest item pools per rarity tier |
| `systems/Equipment/equipment-loot-system.js` | EquipmentLootSystem class: item generation, chest opening, equip/unequip, set bonuses, durability, repair |
| `systems/XP/xp-goals-system.js` | XPGoalsSystem: goal management + `grantDailyGoalChest`, `grantWeeklyGoalChest`, `grantMonthlyGoalChest` |
| `server/world.js` | World class: `processTurn`, `warAction`, `worldBankBuy/Sell`, `openChestAction`, equip actions, login streak chests |
| `entities/Nation.js` | Nation class: `equipment` object with keys, chests, equipped slots, streak tracking |
| `entities/Player.js` | Player class: `applyToNation()` applies equipment bonuses |
| `systems/Resource/resource-system.js` | `calculateRawProduction()` applies `getResourceBonus()` |
| `core/query-system.js` | FIELD_PERMISSIONS for equipment visibility |
| `core/config.js` | GameEvents for equipment events |
| `core/game-engine.js` | Client-side EquipmentLootSystem registration |
| `ui/live/game.js` | Inventory UI: equipped slots, inventory list, set bonuses, chest opening |

---

*Plan file: `docs/DEV/equipment-loot-system-plan.md`*  
*Naming reference: `docs/DEV/equipment-set-naming.md`*