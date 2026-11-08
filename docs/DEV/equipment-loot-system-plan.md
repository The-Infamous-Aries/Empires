# Equipment & Loot System — Design Plan
# Sovereignty Epochs - Nation Ruler Roleplay Game
# Location: docs/DEV/equipment-loot-system-plan.md
# Implementation target: systems/Equipment/equipment-loot-system.js (+ supporting data files + UI in ui/live/game.js)
# Status: READY TO IMPLEMENT (all integration points verified against codebase)

## 1. Overview

Add a full equipment and loot system to Sovereignty Epochs. Players obtain gear from chests (4 chest types, 3 key types), equip items in category-specific slots, gain stat bonuses scaled by a custom 6-tier rarity system, activate set bonuses (max 2 simultaneous), and watch equipped items lose durability each game turn until they break.

All items (armor, clothing, protective, guns, tools) spawn in the 6 custom rarity tiers. Every tier has a random value window per stat so no two items in the same tier are identical. Chests/keys and equipped items are displayed in the **User tab → Inventory** sub-tab (replacing the current "Equipment and tools slots coming soon." placeholder).

## 2. Source-of-Truth Data Files

Create `assets/data/equipment/` with these JS files (loaded via `<script defer>` in index.html before the system):

- `assets/data/equipment/rarity-tiers.js` — 6 custom rarity tiers, colors, durability windows, stat windows
- `assets/data/equipment/sets.js` — armor / clothing / protective set definitions, slot→stat mapping, set bonuses
- `assets/data/equipment/items.js` — base item templates (armor, clothing, protective, guns, tools) with icon paths and slot
- `assets/data/equipment/chests.js` — 4 chest definitions, rarity pull weights, key costs
- `assets/data/equipment/loot-tables.js` — per-chest item pools

Follow the existing `SKILL_DEFS` pattern in `entities/Player.js` (plain exported object, guarded for browser global).

## 3. Custom Rarity Tier System (replaces Common→Mythic)

Six tiers, weakest → strongest. Names are custom (not overused Common/Uncommon/Rare/Epic/Legendary/Mythic). Each tier has a background color (item card bg) and a frame color (item border/icon frame).

| # | Tier Key | Display Name | Frame Color | BG Color | Durability (turns) | Theme |
|---|----------|--------------|-------------|----------|--------------------|-------|
| 1 | `scavenged` | Scavenged | `#94A3B8` (slate-gray) | `#1E293B` | 24–36 | weakest, short-lived |
| 2 | `standard` | Standard | `#F1F5F9` (off-white) | `#0F172A` | 36–48 | issued gear |
| 3 | `fine` | Fine | `#22C55E` (emerald) | `#14532D` | 48–64 | reliable |
| 4 | `superior` | Superior | `#3B82F6` (blue) | `#1E3A8A` | 64–80 | well-made |
| 5 | `exquisite` | Exquisite | `#A855F7` (purple) | `#581C87` | 80–104 | rare |
| 6 | `sovereign` | Sovereign | `#FBBF24` (amber/gold) | `#713F12` | 104–140 | best, longest-lived |

**Durability rule:** rarer tiers last longer per turn; Scavenged is shortest (24–36 turns). When durability reaches 0 the item is destroyed (removed from inventory/unequipped).

**Stat windows per tier:** each stat boosted by an item is rolled randomly within the tier's min–max window. This ensures items of the same tier have varied values. Example windows (to be tuned; values are per-item flat or % matching the Player.js skill conventions):

| Stat | Unit | Scavenged | Standard | Fine | Superior | Exquisite | Sovereign |
|------|------|-----------|----------|------|----------|-----------|-----------|
| Attack | flat | 5–15 | 12–28 | 22–42 | 38–62 | 52–82 | 70–110 |
| Defense | flat | 5–15 | 12–28 | 22–42 | 38–62 | 52–82 | 70–110 |
| Block | flat | 3–9 | 8–18 | 15–28 | 24–40 | 36–56 | 50–75 |
| Evade | % | 0.5–1.5 | 1.5–3 | 3–5 | 5–8 | 8–12 | 12–18 |
| Aim | % | 0.5–1.5 | 1.5–3 | 3–5 | 5–8 | 8–12 | 12–18 |
| Crit Chance | % | 0.5–1.5 | 1.5–3 | 3–5 | 5–8 | 8–12 | 12–18 |
| Crit Damage | % | 4–12 | 10–22 | 18–34 | 30–48 | 42–66 | 58–90 |
| Luck | flat | 0–2 | 1–4 | 3–7 | 6–10 | 9–14 | 12–18 |
| Intelligence | % | 0.5–1.5 | 1.5–3 | 3–5 | 5–8 | 8–12 | 12–18 |
| Diplomacy | % | 1–3 | 3–6 | 5–9 | 8–14 | 12–20 | 16–28 |
| Production | % | 0.5–1.5 | 1.5–3 | 3–5 | 5–8 | 8–12 | 12–18 |
| Stewardship | % | 0.5–1 | 1–2 | 2–3.5 | 3–5 | 4.5–7 | 6–9 |
| Discipline | % | 0.5–1 | 1–2 | 2–3.5 | 3–5 | 4.5–7 | 6–9 |

Each item rolls **one value per stat it boosts** inside its tier window. Tools roll within their resource-production window.

## 4. Equipment Categories & Slots

Three wearable sets plus Guns and Tools. Slot names map to the actual asset filenames:

| Category | Slots (asset prefix) | Boosted Stat per Slot | Set Bonus Stats |
|----------|----------------------|-----------------------|-----------------|
| **Armor** | Helmet (Head), Boots (Feet), Armor (Body) | Helmet→Aim, Boots→Evade, Armor→Defense | Defense + Aim + Evade |
| **Clothing** | Head, Pants (Legs), Shirt (Body), Shoes (Feet) | Head→Stewardship, Shirt→Taxation, Pants→Diplomacy, Shoes→Discipline | Stewardship + Taxation + Diplomacy + Discipline |
| **Protective** | Head, Shirt (Body), Gloves (Arms/Hands), Boots (Feet) | Head→Intelligence, Shirt→Block, Gloves→Production, Boots→Luck | Intelligence + Block + Production + Luck |

**Guns:** 40 icons (`Icon29_01.png`–`Icon29_40.png`). Each gun is given a set-themed name matching an armor/clothing/protective set material (e.g., "Iron Legion Rifle", "Elven Marksman", "Sovereign Sidearm"). Guns boost **Attack, Crit Chance, Crit Damage** (one value per stat rolled in the gun's tier window). Guns do NOT participate in set bonuses; they are individual weapons.

**Tools:** 10 icons (Drill, Drill-Bit, Flashlight, Grinder, Grinder-Wheel, MegaDrill, MegaDrill-Bit, Pickaxe, Shovel, Icon31_02). Each tool boosts **raw resource production** for one raw resource (map tools to the 7 minerals: steel, bronze, lead, aluminum, copper, uranium, gasoline — multiple tools can share a resource). Value rolled in tier window (%). Tools do NOT participate in set bonuses.

### Asset-to-item mapping (concrete)

**Armor set materials** (11): Wood, RustyIron, Iron, Stone, Steel, Nature, Elven, Crystal, Volcanic, SciFi, Advanced.
- `Armor_<Mat>.png` → Armor slot (Body)
- `Helmet_<Mat>.png` → Helmet slot (Head)
- `Boots_<Mat>.png` → Boots slot (Feet)

**Clothing sets** (10): `set-<n>-head.png`, `set-<n>-pants.png`, `set-<n>-shirt.png`, `set-<n>-shoes.png` (n = 1..10). Each set-<n> is one clothing set with 4 pieces.

**Protective sets** (4 variants each): `protective-head-1..4.png`, `protective-shirt-1..4.png`, `protective-gloves-1..4.png`, `protective-boots-1..4.png`. Treat variant index as the protective "set" id (1..4) with 4 pieces.

**Guns:** `Icon29_01.png`–`Icon29_40.png` → 40 gun templates, cycle through set/material names.

**Tools:** the 10 tool PNGs → 10 tool templates, assign resource types.

**Chests:** `chest1.png`–`chest4.png` (4 chests).
**Keys:** `Key1.png`–`Key3.png` (3 keys).

## 5. Item Instance Data Model

Each dropped/equipped item instance (stored on the nation):

```js
{
  id: "eq_<timestamp>_<rand>",      // unique instance id
  templateId: "armor_iron",         // base template key
  tier: "superior",                 // rarity tier key
  category: "armor",                // armor | clothing | protective | gun | tool
  set: "iron",                      // set key (null for guns/tools)
  slot: "body",                     // head | body | arms | legs | feet (canonical)
  assetSlot: "Armor",               // asset filename prefix (Armor/Helmet/Boots/Head/Pants/Shirt/Shoes/Gloves)
  icon: "assets/images/Equipment/Clothes/Armor_Iron.png",
  name: "Iron Breastplate",         // display name
  stats: {                          // rolled values, one per boosted stat
    defense: 41,
    // ...
  },
  maxDurability: 72,                // rolled in tier window
  durability: 72,                   // decrements each turn while equipped
  equipped: false,                  // whether currently worn
  acquiredTurn: 12,                 // game day acquired
  bound: false                      // soulbound (optional future)
}
```

Guns use category `gun`, slot `weapon`, stats `{ attack, critChance, critDamage }`.
Tools use category `tool`, slot `tool`, stats `{ production }` + a `resourceKey` (which mineral).

## 6. Set Bonus System

A set bonus activates when N items from the same set are equipped:

| Equipped from same set | Bonus |
|------------------------|-------|
| 1 item | individual item stats only |
| 2 items | +small set bonus (e.g., +5–10% of combined slot stat) |
| 3 items | +medium set bonus |
| 4 items (full set) | +large set bonus + unique full-set perk |

**Rule: max 2 active set bonuses at a time.** If a player equips items from 3+ different sets, only the 2 strongest set bonuses apply (by total set stat value). The system recomputes active set bonuses whenever equipment changes.

Set bonus is additive on top of individual item stats. Example: full Armor (Iron) set grants individual Defense/Aim/Evade from each piece plus a flat Defense bonus and a small Aim+Evade bonus.

## 7. Chest & Key Loot System

4 chests, 3 keys. Each chest has a rarity pull distribution (weights sum to 100) and a key cost.

| Chest | Asset | Key Required | Key Cost | Rarity Pull Weights (Scavenged→Sovereign) |
|-------|-------|--------------|----------|-------------------------------------------|
| Chest 1 | chest1.png | Key1 | 1 × Key1 | 50 / 30 / 15 / 4 / 1 / 0 |
| Chest 2 | chest2.png | Key2 | 1 × Key2 | 30 / 35 / 25 / 8 / 2 / 0 |
| Chest 3 | chest3.png | Key3 | 1 × Key3 | 15 / 25 / 30 / 20 / 9 / 1 |
| Chest 4 | chest4.png | Key3 | 2 × Key3 | 5 / 10 / 20 / 30 / 25 / 10 |

**Option A (recommended, keys exist):** opening a chest consumes the required key(s). If the player lacks the key(s), the chest cannot be opened.

**Option B (fallback):** remove key requirement; chests loot-and-open on click (keys become cosmetic/unused). The plan implements Option A with a config flag `EQUIPMENT.KEYS_REQUIRED` to toggle to Option B.

**Loot roll:** when a chest opens:
1. Roll rarity tier using the chest's weight table.
2. Pick a random item from that chest's loot table for the rolled tier.
3. Roll the item's stats within the tier window.
4. Roll durability within the tier window.
5. Grant item(s) to the player's inventory (add to `nation.equipment.inventory`).

Keys themselves are also loot items stored in `nation.equipment.keys = { key1: n, key2: n, key3: n }`.

## 8. Durability / Item Decay (per turn)

Every game turn (day_passed), every **equipped** item loses 1 durability. When durability reaches 0:
- item is auto-unequipped
- item is destroyed (removed from inventory)
- emit `equipment:item_broken`

**Durability only decays while equipped.** Items in inventory do not decay.

This hooks into `world.js` `processTurn(r)` (server-side, line ~4182) via `equipmentSystem.processTurn(nation)` — same pattern as `resourceSystem.processTurn(n)`.

On the client, durability is reflected in the User → Inventory UI (durability bar + "broken" notification).

## 9. Stat Application to Nation / Player

Equipment bonuses layer on top of Player.js skills and Nation.js stats. The equipment system exposes a getter `equipmentSystem.getNationBonuses(nation)` returning:

```js
{
  attack: 0,        // flat (from guns + armor none)
  defense: 0,       // flat
  block: 0,         // flat
  evade: 0,         // decimal %
  aim: 0,           // decimal %
  critChance: 0,    // decimal %
  critDamage: 0,    // decimal %
  luck: 0,          // flat
  intelligence: 0,  // decimal %
  diplomacy: 0,     // decimal %
  production: 0,    // decimal %
  stewardship: 0,   // decimal %
  discipline: 0,    // decimal %
  taxation: 0,      // decimal %
}
```

Integration points:
- **Player.calcCombatResult** / **calcDefenseResult**: add equipment attack/defense/block/evade/aim/critChance/critDamage/luck to the skill values (equipment acts like bonus skill levels).
- **Player.applyToNation(nation)**: merge equipment bonuses into nation stats (productionBonus, stewardshipCostReduction, disciplineUnitCapBonus, luckBonus, etc.).
- **ResourceSystem.calculateRawProduction**: apply equipment `production` bonus to raw resource production for the tool's resource.
- **Nation.calculateEconomy**: apply equipment `taxation` bonus to tax rate.

Bonuses from equipped items + active set bonuses are summed. Only equipped items contribute (inventory items do not).

## 10. UI Integration (User tab → Inventory)

Current `inventoryContent` in `ui/live/game.js:1211` shows a resources table and ends with `<div class="help">Equipment and tools slots coming soon.</div>`.

Replace/extend the Inventory sub-tab with:

1. **Key & Chest stash** (top row): counts of Key1/Key2/Key3 and Chest1–4, with an "Open Chest" button per chest type (disabled if no chest or no key).
2. **Equipped slots grid** (one per category): Armor (Head/Body/Feet), Clothing (Head/Body/Legs/Feet), Protective (Head/Body/Hands/Feet), Weapon (gun), Tool. Shows equipped item icon + tier frame + durability bar; empty slots show "Empty". Click to unequip.
3. **Inventory list**: all unequipped items as cards with icon, tier frame/background, name, stats, durability bar, "Equip" / "Salvage" buttons.
4. **Active set bonuses panel**: lists currently active set bonuses (max 2) with their effects.
5. **Loot log**: recent chest openings.

Reuse existing UI helpers in game.js: `imageIcon`, `icon`, `esc`, `number`, `money`, `heading`, card/table-wrap CSS classes already present.

## 11. System Registration & Lifecycle

Create `systems/Equipment/equipment-loot-system.js` class `EquipmentLootSystem`:

- `initialize()` — bind `turn_processed` / `day_passed` event; register with GameEngine.
- `processTurn(nation)` — decrement durability on equipped items, destroy broken ones.
- `openChest(nation, chestKey)` — consume key, roll loot, add to inventory.
- `equipItem(nation, itemId)` / `unequipItem(nation, itemId)` — move item between equipped slots and inventory, recompute set bonuses.
- `getNationBonuses(nation)` — compute summed stat bonuses.
- `getState()` / `setState()` — serialize equipment inventory/keys/equipped for save/load.

Register in `core/game-engine.js` `initializeSystems()` (after NationSystem) and expose `window.EquipmentSystem`.

Wire into `server/world.js` `processTurn(r)`: call `this.equipment.processTurn(n)` after resource processing.

Wire into `server/world.js` for chest opening: a new socket action `openChest` handled by `EquipmentLootSystem.openChest`.

## 12. Save / Load

- **entities/Nation.js**: add `equipment: { inventory: [...], keys: {...}, equipped: { slot: itemId|null } }` to `serialize()` and restore in `deserialize()`.
- **entities/Player.js**: no change needed (equipment lives on Nation); but equipment combat bonuses feed `calcCombatResult`/`calcDefenseResult` via `window.EquipmentSystem`.
- Client `state` (game.js): include `state.equipment` so the User → Inventory UI can render.

## 13. New Game Events

Add to `core/config.js` `GameEvents`:
- `EQUIPMENT_ITEM_ACQUIRED: 'equipment_item_acquired'`
- `EQUIPMENT_ITEM_EQUIPPED: 'equipment_item_equipped'`
- `EQUIPMENT_ITEM_UNEQUIPPED: 'equipment_item_unequipped'`
- `EQUIPMENT_ITEM_BROKEN: 'equipment_item_broken'`
- `EQUIPMENT_SET_BONUS_ACTIVE: 'equipment_set_bonus_active'`
- `EQUIPMENT_CHEST_OPENED: 'equipment_chest_opened'`

## 14. Implementation Phases

**Phase 1 — Data & Rarity (no gameplay):**
- Create `assets/data/equipment/*.js` (rarity tiers, sets, items, chests, loot tables).
- Add GameEvents entries.
- Verify asset paths resolve (Clothes/Guns/Tools/chests/keys).

**Phase 2 — Core system (server):**
- `systems/Equipment/equipment-loot-system.js`: item model, generation, chest opening, equip/unequip, durability decay, bonus computation.
- Register in game-engine.js + wire into world.js processTurn.
- Nation.js serialize/deserialize equipment.

**Phase 3 — Stat integration:**
- Hook equipment bonuses into Player.js combat/defense calcs and applyToNation.
- Hook production bonus into ResourceSystem.

**Phase 4 — UI (User → Inventory):**
- Rebuild inventoryContent in game.js with keys/chests, equipped slots, inventory list, set bonuses, loot log.
- Chest open button + key consumption.

**Phase 5 — Polish & balance:**
- Tune stat windows, durability, chest weights, key costs.
- Add broken-item notifications.

## 15. Design Decisions Summary (answered open questions)

- **Rarity names:** custom 6 tiers (Scavenged → Sovereign) with slate/white/emerald/blue/purple/amber frames.
- **Keys:** Option A (keys required) is primary; `EQUIPMENT.KEYS_REQUIRED` flag allows Option B (loot-and-open, no keys).
- **Set bonuses:** max 2 active; 2/3/4-piece progression; computed from equipped items only.
- **Durability:** decays 1 per turn only while equipped; Scavenged 24–36 turns, Sovereign 104–140; breaks at 0.
- **Stat variance:** every stat rolls a random value within its tier window per item.
- **Guns:** set-themed names; boost Attack/Crit Chance/Crit Damage; no set bonus.
- **Tools:** boost raw resource production; assigned to a mineral; no set bonus.
- **UI location:** User tab → Inventory sub-tab (replaces "coming soon" placeholder).

## 16. Verification Checklist

- [ ] Chests open with correct key cost and consume key(s)
- [ ] Loot rarity follows chest weight table
- [ ] Item stats roll within tier window (varied within tier)
- [ ] Equipping items applies stat bonuses to combat/nation
- [ ] Set bonuses activate at 2/3/4 pieces; max 2 active
- [ ] Durability decays 1/turn on equipped items; breaks at 0
- [ ] Broken items removed + notification
- [ ] All gear visible in User → Inventory
- [ ] Save/load persists equipment, keys, durability
- [ ] Guns match set names; tools boost resource production

---
*Generated from full scan of: entities/Player.js, entities/Nation.js, core/game-engine.js, core/config.js, core/event-system.js, core/colors.js, systems/Resource/resource-system.js, systems/time-system.js, server/world.js (processTurn), ui/live/game.js (User tab → Inventory sub-tab), docs/DEV/wrestling-system-plan.md (plan format), assets/images/Equipment/ (Clothes/Guns/Tools/Rings/chests/keys).*
