/**
 * EquipmentLootSystem — Server-side equipment, loot, chest, durability, and set-bonus system.
 * Sovereignty Epochs — Nation Ruler Roleplay Game.
 *
 * Handles:
 *   - Item generation from templates with rolled stats/durability
   - Chest opening (key + chest consumed, loot rolled)
   - Equip/unequip (one item per canonical slot, auto-unequips incumbent)
   - Set bonus computation (max 2 active)
   - Per-turn durability decay (flat 1/turn)
   - Per-war-action durability decay (flat 0.5 per Attack/Defend)
   - Production bonus per raw resource (tools boost ALL resources)
   - Repair consumables (Drill-Bit/Grinder-Wheel/MegaDrill-Bit restore tool durability to tier max)
 */

let randomUUID;
try {
    randomUUID = require('node:crypto').randomUUID;
} catch (_) {
    randomUUID = () => Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Load data files — Node.js uses require, browser uses globals set by <script> tags
let EQUIPMENT_ITEMS, EQUIPMENT_RARITY_TIERS, EQUIPMENT_STAT_WINDOWS, EQUIPMENT_CATEGORY_STATS, EQUIPMENT_SET_BONUS_PCT, SET_DEFS, EQUIPMENT_MAX_ACTIVE_SET_BONUSES, EQUIPMENT_CHESTS, EQUIPMENT_LOOT_TABLES;
try {
    const rt = require("../../assets/data/equipment/rarity-tiers.js");
    const sd = require("../../assets/data/equipment/sets.js");
    const it = require("../../assets/data/equipment/items.js");
    const ch = require("../../assets/data/equipment/chests.js");
    const lt = require("../../assets/data/equipment/loot-tables.js");
    EQUIPMENT_RARITY_TIERS = rt.EQUIPMENT_RARITY_TIERS;
    EQUIPMENT_STAT_WINDOWS = rt.EQUIPMENT_STAT_WINDOWS;
    EQUIPMENT_CATEGORY_STATS = rt.EQUIPMENT_CATEGORY_STATS;
    SET_DEFS = sd.SET_DEFS;
    EQUIPMENT_SET_BONUS_PCT = sd.EQUIPMENT_SET_BONUS_PCT;
    EQUIPMENT_MAX_ACTIVE_SET_BONUSES = sd.EQUIPMENT_MAX_ACTIVE_SET_BONUSES;
    EQUIPMENT_ITEMS = it.EQUIPMENT_ITEMS;
    EQUIPMENT_CHESTS = ch.EQUIPMENT_CHESTS;
    EQUIPMENT_LOOT_TABLES = lt.EQUIPMENT_LOOT_TABLES;
} catch (_) {
    // Browser: globals are set by <script> tags
    EQUIPMENT_ITEMS = window.EQUIPMENT_ITEMS;
    EQUIPMENT_RARITY_TIERS = window.EQUIPMENT_RARITY_TIERS;
    EQUIPMENT_STAT_WINDOWS = window.EQUIPMENT_STAT_WINDOWS;
    EQUIPMENT_CATEGORY_STATS = window.EQUIPMENT_CATEGORY_STATS;
    SET_DEFS = window.SET_DEFS;
    EQUIPMENT_SET_BONUS_PCT = window.EQUIPMENT_SET_BONUS_PCT;
    EQUIPMENT_MAX_ACTIVE_SET_BONUSES = window.EQUIPMENT_MAX_ACTIVE_SET_BONUSES;
    EQUIPMENT_CHESTS = window.EQUIPMENT_CHESTS;
    EQUIPMENT_LOOT_TABLES = window.EQUIPMENT_LOOT_TABLES;
}

const EQUIPMENT_WAR_ACTION_DURABILITY_LOSS = 0.5;
const EQUIPMENT_TURN_DURABILITY_LOSS = 1;

class EquipmentLootSystem {
  constructor() {
    this.initialized = false;
  }

  initialize() {
    this.initialized = true;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Item Generation
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Generate an item instance from a template with rolled stats and durability.
   * @param {string} templateKey - key into EQUIPMENT_ITEMS[category][templateKey]
   * @param {string} category - 'armor'|'clothing'|'protective'|'gun'|'melee'|'tool'
   * @param {string} tier - rarity tier key (derelict|weathered|...|epochal)
   * @returns {Object} item instance
   */
  generateItem(templateKey, category, tier) {
    const templates = EQUIPMENT_ITEMS;
    const tierDefs = EQUIPMENT_RARITY_TIERS;
    const statWindow = EQUIPMENT_STAT_WINDOWS[tier];
    if (!statWindow) throw new Error(`No stat window for tier: ${tier}`);

    // Strip category prefix from templateKey (loot tables use 'gun_rustyiron_pistol',
    // but EQUIPMENT_ITEMS.gun stores as 'rustyiron_pistol')
    const prefix = `${category}_`;
    const cleanKey = templateKey.startsWith(prefix) ? templateKey.slice(prefix.length) : templateKey;

    // Look up the template
    const categoryTemplates = templates[category];
    if (!categoryTemplates) throw new Error(`Unknown equipment category: ${category}`);
    const template = categoryTemplates[cleanKey];
    if (!template) throw new Error(`Unknown template: ${category}.${cleanKey}`);

    // Roll durability within tier window
    const [durMin, durMax] = tierDef.durability;
    const maxDurability = Math.floor(Math.random() * (durMax - durMin + 1)) + durMin;

    // Roll stats — one value per stat the category boosts
    const stats = {};
    const categoryStats = EQUIPMENT_CATEGORY_STATS[category] || [];
    for (const statKey of categoryStats) {
      const window = statWindow[statKey];
      if (window) {
        const [min, max] = window;
        stats[statKey] = this._rollStat(min, max, window[2]);
      }
    }

    return {
      id: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      templateId: cleanKey,
      tier,
      category,
      set: template.set || null,
      slot: template.slot,
      assetSlot: template.assetSlot || this._assetSlotForCategory(template.slot, category),
      icon: `assets/images/Equipment/${template.asset}`,
      name: template.name,
      stats,
      maxDurability,
      durability: maxDurability,
      equipped: false,
      acquiredTurn: 0, // set by caller
      bound: false,
      // Tool-specific fields
      productionBoost: template.productionBoost || false,
      repairTarget: template.repairTarget || null,
      tiers: template.tiers || null,
    };
  }

  _rollStat(min, max, unit) {
    const val = Math.random() * (max - min) + min;
    if (unit === '%') return parseFloat(val.toFixed(2));
    return Math.floor(val);
  }

  _assetSlotForCategory(slot, category) {
    const map = {
      head: category === 'armor' ? 'Helmet' : category === 'clothing' ? 'Head' : 'Head',
      body: category === 'armor' ? 'Armor' : category === 'clothing' ? 'Shirt' : 'Shirt',
      arms: 'Gloves',
      legs: 'Pants',
      feet: category === 'armor' ? 'Boots' : category === 'clothing' ? 'Shoes' : 'Boots',
      weapon: 'Weapon',
      tool: 'Tool',
    };
    return map[slot] || slot;
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // Chest Opening
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Open a chest: consume chest + key(s), roll loot, grant to nation inventory.
   * @param {Object} nation - nation object (must have .equipment)
   * @param {string} chestKey - 'chest1'|'chest2'|'chest3'|'chest4'
   * @param {number} luck - player's Luck skill value (0-30), used to shift tier roll upward
   * @returns {Object} { success, chest, keysConsumed, items: [] }
   */
  openChest(nation, chestKey, luck = 0) {
    if (!nation.equipment) throw new Error('Nation has no equipment data');

    const chests = EQUIPMENT_CHESTS;
    const chestDef = chests[chestKey];
    if (!chestDef) throw new Error(`Unknown chest: ${chestKey}`);

    // Check chest count
    const chestCount = (nation.equipment.chests && nation.equipment.chests[chestKey]) || 0;
    if (chestCount < 1) return { success: false, reason: 'No chest' };

    // Check key counts for all required keys
    const keysConsumed = {};
    for (const keyKey of chestDef.keyRequired) {
      const keyCount = (nation.equipment.keys && nation.equipment.keys[keyKey]) || 0;
      const needed = chestDef.keyCost[keyKey] || 1;
      if (keyCount < needed) {
        return { success: false, reason: `Missing ${keyKey}` };
      }
      keysConsumed[keyKey] = needed;
    }

    // Consume chest + keys
    nation.equipment.chests[chestKey] -= 1;
    for (const [keyKey, needed] of Object.entries(keysConsumed)) {
      nation.equipment.keys[keyKey] -= needed;
    }

    // Roll rarity tier from chest weights, then apply Luck bump
    let tier = this._rollChestTier(chestDef.rarityWeights);
    tier = this._applyLuckTierBump(tier, luck);

    // Roll item from loot table for that tier
    const lootTables = EQUIPMENT_LOOT_TABLES;
    const tierPool = lootTables[chestKey] && lootTables[chestKey][tier];
    if (!tierPool || tierPool.length === 0) {
      // No items for this tier — chest opened but empty (shouldn't happen with valid data)
      return { success: true, chest: chestKey, keysConsumed, items: [], tier, empty: true };
    }

    const templateKey = tierPool[Math.floor(Math.random() * tierPool.length)];
    const category = this._templateKeyToCategory(templateKey);

    // Generate the item instance
    const item = this.generateItem(templateKey, category, tier);
    item.acquiredTurn = nation.statistics ? nation.statistics.totalTurns : 0;

    // Grant to inventory
    nation.equipment.inventory = nation.equipment.inventory || [];
    nation.equipment.inventory.push(item);

    return { success: true, chest: chestKey, keysConsumed, items: [item], tier };
  }

  _rollChestTier(weights) {
    // weights array: [Derelict, Weathered, Seasoned, Reinforced, Polished, Sovereign, Epochal]
    const tiers = ['derelict','weathered','seasoned','reinforced','polished','sovereign','epochal'];
    let total = 0;
    for (const w of weights) total += w;
    let roll = Math.random() * total;
    for (let i = 0; i < tiers.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return tiers[i];
    }
    return tiers[tiers.length - 1];
  }

  /**
   * Luck-based tier bump: after rolling from chest weights, there's a Luck-based
   * chance to bump the tier up by one (capped at Epochal). Only one bump allowed.
   *
   * Chance = luck * 0.25 (e.g. Luck 30 → 7.5% chance to bump one tier up).
   * With Chest4 base Epochal weight of 5%: base 5% + Sovereign(35%) × 7.5% = ~7.6%
   * at Luck 30 — within the 7.5-10% max design target.
   *
   * @param {string} tier - rolled tier key
   * @param {number} luck - player Luck skill value (0-30)
   * @returns {string} possibly bumped tier key
   */
  _applyLuckTierBump(tier, luck) {
    if (!luck || luck <= 0) return tier;

    const tiers = ['derelict','weathered','seasoned','reinforced','polished','sovereign','epochal'];
    const idx = tiers.indexOf(tier);
    if (idx < 0 || idx >= tiers.length - 1) return tier; // already Epochal or unknown

    const bumpChance = luck * 0.25; // 0.25% per Luck point
    if (Math.random() * 100 < bumpChance) {
      return tiers[idx + 1]; // bump up one tier
    }
    return tier;
  }

  _templateKeyToCategory(templateKey) {
    // templateKey format: "category_templateName" e.g. "armor_wood_head", "gun_steel_sniper", "tool_pickaxe"
    if (templateKey.startsWith('gun_')) return 'gun';
    if (templateKey.startsWith('melee_')) return 'melee';
    if (templateKey.startsWith('tool_')) return 'tool';
    if (templateKey.startsWith('armor_')) return 'armor';
    if (templateKey.startsWith('clothing_')) return 'clothing';
    if (templateKey.startsWith('protective_')) return 'protective';
    throw new Error(`Unknown template key category: ${templateKey}`);
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // Equip / Unequip
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Equip an item from inventory into its canonical slot.
   * Auto-unequips any incumbent in the same slot.
   * Item stays in inventory (flagged equipped); equipped map holds slot → itemId.
   * @param {Object} nation
   * @param {string} itemId
   * @returns {Object} { success, unequippedItemId }
   */
  equipItem(nation, itemId) {
    if (!nation.equipment) throw new Error('Nation has no equipment data');
    const inv = nation.equipment.inventory || [];
    const item = inv.find(i => i.id === itemId);
    if (!item) return { success: false, reason: 'Item not in inventory' };
    if (item.equipped) return { success: false, reason: 'Already equipped' };

    const slot = item.slot;
    const equipped = nation.equipment.equipped || {};
    const incumbentId = equipped[slot];

    // Auto-unequip incumbent
    let unequippedItemId = null;
    if (incumbentId) {
      unequippedItemId = incumbentId;
      const incumbent = inv.find(i => i.id === incumbentId);
      if (incumbent) {
        incumbent.equipped = false;
      }
      equipped[slot] = null;
    }

    // Equip the new item
    item.equipped = true;
    equipped[slot] = itemId;

    return { success: true, unequippedItemId };
  }

  /**
   * Unequip an item, moving it back to inventory (just unflags equipped).
   * @param {Object} nation
   * @param {string} itemId
   * @returns {Object} { success }
   */
  unequipItem(nation, itemId) {
    if (!nation.equipment) throw new Error('Nation has no equipment data');
    const equipped = nation.equipment.equipped || {};

    // Find which slot the item is in
    let foundSlot = null;
    for (const [slot, iid] of Object.entries(equipped)) {
      if (iid === itemId) { foundSlot = slot; break; }
    }
    if (!foundSlot) return { success: false, reason: 'Item not equipped' };

    const inv = nation.equipment.inventory || [];
    const item = inv.find(i => i.id === itemId);
    if (!item) return { success: false, reason: 'Item not found' };

    item.equipped = false;
    equipped[foundSlot] = null;

    return { success: true };
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // Set Bonuses
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Compute active set bonuses for a nation.
   * Counts equipped items per set, including gun/melee tie-ins.
   * @param {Object} nation
   * @returns {Object} { activeBonuses: [{ set, category, pieceCount, bonusPct, perk }], totalBonuses: { stat: value } }
   */
  computeSetBonuses(nation) {
    if (!nation.equipment) return { activeBonuses: [], totalBonuses: {} };

    const equipped = nation.equipment.equipped || {};
    const inv = nation.equipment.inventory || [];

    // Collect all equipped items with their set/category
    const equippedItems = [];
    for (const [slot, itemId] of Object.entries(equipped)) {
      if (!itemId) continue;
      const item = this._findItemById(nation, itemId);
      if (item && item.set) {
        equippedItems.push({ item, slot, category: item.category, set: item.set });
      }
    }

    // Add gun/melee tie-in counts: a gun/melee counts toward its tied sets
    const SET_DEFS_LOCAL = SET_DEFS;
    const gunSets = SET_DEFS_LOCAL.gunSets;
    const meleeSets = SET_DEFS_LOCAL.meleeSets;

    // Count pieces per (category, set)
    const pieceCounts = {}; // key: "category:set" → count
    for (const ei of equippedItems) {
      const key = `${ei.category}:${ei.set}`;
      pieceCounts[key] = (pieceCounts[key] || 0) + 1;
    }

    // Apply gun/melee tie-ins
    if (gunSets) {
      for (const ei of equippedItems) {
        if (ei.category === 'gun') {
          const gs = gunSets[ei.set];
          if (gs) {
            for (const cat of Object.keys(gs.tiedSets)) {
              for (const setId of gs.tiedSets[cat]) {
                const key = `${cat}:${setId}`;
                pieceCounts[key] = (pieceCounts[key] || 0) + 1;
              }
            }
          }
        }
      }
    }
    if (meleeSets) {
      for (const ei of equippedItems) {
        if (ei.category === 'melee') {
          const ms = meleeSets[ei.set];
          if (ms) {
            for (const cat of Object.keys(ms.tiedSets)) {
              for (const setId of ms.tiedSets[cat]) {
                const key = `${cat}:${setId}`;
                pieceCounts[key] = (pieceCounts[key] || 0) + 1;
              }
            }
          }
        }
      }
    }

    // Compute bonuses per set
    const bonusPct = EQUIPMENT_SET_BONUS_PCT;
    const setBonuses = [];

    for (const [key, count] of Object.entries(pieceCounts)) {
      const [cat, setId] = key.split(':');
      const setDef = SET_DEFS_LOCAL[cat] && SET_DEFS_LOCAL[cat][setId];
      if (!setDef) continue;

      if (count >= 2) {
        const pct = count >= 4 ? bonusPct[4] : count === 3 ? bonusPct[3] : bonusPct[2];
        const piecesNeeded = count >= 4 ? 4 : count === 3 ? 3 : 2;
        setBonuses.push({
          category: cat,
          set: setId,
          pieceCount: count,
          piecesNeeded,
          bonusPct: pct,
          perk: count >= 4 ? setDef.perk4 : null,
          slots: setDef.slots,
        });
      }
    }

    // Sort by total set stat value (strongest first), take top 2
    setBonuses.sort((a, b) => b.pieceCount - a.pieceCount || b.bonusPct - a.bonusPct);
    const activeBonuses = setBonuses.slice(0, EQUIPMENT_MAX_ACTIVE_SET_BONUSES);

    // Compute total stat bonuses from active sets
    const totalBonuses = {};
    for (const ab of activeBonuses) {
      const setDef = SET_DEFS_LOCAL[ab.category] && SET_DEFS_LOCAL[ab.category][ab.set];
      if (!setDef) continue;
      for (const [slot, statKey] of Object.entries(setDef.slots)) {
        totalBonuses[statKey] = (totalBonuses[statKey] || 0) + ab.bonusPct;
      }
    }

    return { activeBonuses, totalBonuses };
  }

  _findItemById(nation, itemId) {
    const inv = nation.equipment.inventory || [];
    return inv.find(i => i.id === itemId) || null;
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // Stat Bonuses
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Compute all stat bonuses for a nation from equipped items + active set bonuses.
   * @param {Object} nation
   * @returns {Object} flat stat bonuses keyed by stat name
   */
  getNationBonuses(nation) {
    if (!nation.equipment) return this._emptyBonuses();

    const equipped = nation.equipment.equipped || {};
    const bonuses = this._emptyBonuses();

    // Sum equipped item stats
    for (const [slot, itemId] of Object.entries(equipped)) {
      if (!itemId) continue;
      const item = this._findItemById(nation, itemId);
      if (!item) continue;
      for (const [statKey, val] of Object.entries(item.stats || {})) {
        bonuses[statKey] = (bonuses[statKey] || 0) + val;
      }
    }

    // Add set bonuses
    const { totalBonuses } = this.computeSetBonuses(nation);
    for (const [statKey, val] of Object.entries(totalBonuses)) {
      bonuses[statKey] = (bonuses[statKey] || 0) + val;
    }

    // Add clothing set stat bonuses
    const clothingBonuses = this.getClothingStatBonus(nation);
    for (const [statKey, val] of Object.entries(clothingBonuses)) {
      bonuses[statKey] = (bonuses[statKey] || 0) + val / 100;
    }

    // Add armor set stat bonuses
    const armorBonuses = this.getArmorStatBonus(nation);
    for (const [statKey, val] of Object.entries(armorBonuses)) {
      bonuses[statKey] = (bonuses[statKey] || 0) + val / 100;
    }

    return bonuses;
  }

  _emptyBonuses() {
    return {
      attack: 0, defense: 0, block: 0, evade: 0, aim: 0,
      criticalChance: 0, criticalDamage: 0, luck: 0,
      intelligence: 0, diplomacy: 0, production: 0,
      stewardship: 0, discipline: 0, taxation: 0,
      energy: 0, intuition: 0,
    };
  }

  /**
   * Get resource production bonuses from fully-equipped protective sets.
   * Each protective set with all 4 pieces equipped grants resource % bonuses
   * scaling from 5% (Derelict) to 100% (Epochal). If 2 resources, split evenly.
   * Mixed tiers average their individual tier bonuses.
   * @param {Object} nation
   * @returns {Object} { resourceKey: percentBonus }
   */
  getResourceBonus(nation) {
    if (!nation.equipment) return {};

    const equipped = nation.equipment.equipped || {};

    // Group equipped protective items by set id
    const setItems = {};
    for (const [slot, itemId] of Object.entries(equipped)) {
      if (!itemId) continue;
      const item = this._findItemById(nation, itemId);
      if (!item || item.category !== 'protective') continue;
      const setId = item.set;
      if (!setId) continue;
      if (!setItems[setId]) setItems[setId] = [];
      setItems[setId].push(item);
    }

    const resourceBonuses = {};
    const SET_DEFS_LOCAL = SET_DEFS;

    for (const [setId, items] of Object.entries(setItems)) {
      // Need all 4 pieces for set bonus
      if (items.length !== 4) continue;

      const setDef = SET_DEFS_LOCAL.protective && SET_DEFS_LOCAL.protective[setId];
      if (!setDef || !setDef.resourceBonus) continue;

      // Calculate average tier bonus percentage (5% at Derelict index 0 → 100% at Epochal index 6)
      const tierIndexes = items.map(item => {
        const tiers = ['derelict','weathered','seasoned','reinforced','polished','sovereign','epochal'];
        return tiers.indexOf(item.tier);
      }).filter(i => i >= 0);
      if (tierIndexes.length === 0) continue;

      const avgTierIndex = tierIndexes.reduce((a, b) => a + b, 0) / tierIndexes.length;
      const totalPercent = 5 + (avgTierIndex / 6) * 95;

      const { resources, split } = setDef.resourceBonus;
      if (split && resources.length === 2) {
        const eachPercent = totalPercent / 2;
        resources.forEach(r => {
          resourceBonuses[r] = (resourceBonuses[r] || 0) + eachPercent;
        });
      } else {
        resources.forEach(r => {
          resourceBonuses[r] = (resourceBonuses[r] || 0) + totalPercent;
        });
      }
    }

    return resourceBonuses;
  }

  getClothingStatBonus(nation) {
    if (!nation.equipment) return {};

    const equipped = nation.equipment.equipped || {};

    const setItems = {};
    for (const [slot, itemId] of Object.entries(equipped)) {
      if (!itemId) continue;
      const item = this._findItemById(nation, itemId);
      if (!item || item.category !== 'clothing') continue;
      const setId = item.set;
      if (!setId) continue;
      if (!setItems[setId]) setItems[setId] = [];
      setItems[setId].push(item);
    }

    const statBonuses = {};
    const SET_DEFS_LOCAL = SET_DEFS;
    const tiers = ['derelict','weathered','seasoned','reinforced','polished','sovereign','epochal'];

    for (const [setId, items] of Object.entries(setItems)) {
      if (items.length !== 4) continue;

      const setDef = SET_DEFS_LOCAL.clothing && SET_DEFS_LOCAL.clothing[setId];
      if (!setDef || !setDef.statBonus) continue;

      const tierIndexes = items.map(item => tiers.indexOf(item.tier)).filter(i => i >= 0);
      if (tierIndexes.length === 0) continue;

      const avgTierIndex = tierIndexes.reduce((a, b) => a + b, 0) / tierIndexes.length;
      let totalPercent = 5 + (avgTierIndex / 6) * 95;

      for (const [slot, itemId] of Object.entries(equipped)) {
        if (!itemId) continue;
        const item = this._findItemById(nation, itemId);
        if (!item || (item.category !== 'gun' && item.category !== 'melee')) continue;
        const gunSets = SET_DEFS_LOCAL.gunSets;
        const meleeSets = SET_DEFS_LOCAL.meleeSets;
        let tied = false;
        if (item.category === 'gun' && gunSets) {
          const gs = gunSets[item.set];
          if (gs && gs.tiedSets && gs.tiedSets.clothing && gs.tiedSets.clothing.includes(setId)) tied = true;
        }
        if (item.category === 'melee' && meleeSets) {
          const ms = meleeSets[item.set];
          if (ms && ms.tiedSets && ms.tiedSets.clothing && ms.tiedSets.clothing.includes(setId)) tied = true;
        }
        if (tied) totalPercent += 2.5;
      }

      const statKey = setDef.statBonus;
      statBonuses[statKey] = (statBonuses[statKey] || 0) + totalPercent;
    }

    return statBonuses;
  }

  /**
   * Get armor set stat bonuses from fully-equipped armor sets.
   * Each armor set with all 3 pieces (Helmet/Armor/Boots) equipped grants
   * a stat bonus scaling from 5% (Derelict) to 100% (Epochal). Mixed tiers
   * average their individual tier bonuses.
   * Guns/Melee tied to the armor set slightly boost the bonus (+2.5% each) but do
   * NOT count toward the 3-piece unlock requirement.
   * @param {Object} nation
   * @returns {Object} { statKey: percentBonus }
   */
  getArmorStatBonus(nation) {
    if (!nation.equipment) return {};

    const equipped = nation.equipment.equipped || {};

    // Group equipped armor items by set id
    const setItems = {};
    for (const [slot, itemId] of Object.entries(equipped)) {
      if (!itemId) continue;
      const item = this._findItemById(nation, itemId);
      if (!item || item.category !== 'armor') continue;
      const setId = item.set;
      if (!setId) continue;
      if (!setItems[setId]) setItems[setId] = [];
      setItems[setId].push(item);
    }

    const statBonuses = {};
    const SET_DEFS_LOCAL = SET_DEFS;

    const tiers = ['derelict','weathered','seasoned','reinforced','polished','sovereign','epochal'];

    for (const [setId, items] of Object.entries(setItems)) {
      // Need all 3 armor pieces for set bonus (guns/melee don't unlock)
      if (items.length !== 3) continue;

      const setDef = SET_DEFS_LOCAL.armor && SET_DEFS_LOCAL.armor[setId];
      if (!setDef || !setDef.statBonus) continue;

      // Calculate average tier bonus percentage (5% at Derelict → 100% at Epochal)
      const tierIndexes = items.map(item => tiers.indexOf(item.tier)).filter(i => i >= 0);
      if (tierIndexes.length === 0) continue;

      const avgTierIndex = tierIndexes.reduce((a, b) => a + b, 0) / tierIndexes.length;
      let totalPercent = 5 + (avgTierIndex / 6) * 95;

      // Guns/Melee tied to this armor set slightly boost the bonus (+2.5% each)
      // They do NOT count toward unlocking, just add a small boost
      for (const [slot, itemId] of Object.entries(equipped)) {
        if (!itemId) continue;
        const item = this._findItemById(nation, itemId);
        if (!item || (item.category !== 'gun' && item.category !== 'melee')) continue;
        const gunSets = SET_DEFS_LOCAL.gunSets;
        const meleeSets = SET_DEFS_LOCAL.meleeSets;
        let tied = false;
        if (item.category === 'gun' && gunSets) {
          const gs = gunSets[item.set];
          if (gs && gs.tiedSets && gs.tiedSets.armor && gs.tiedSets.armor.includes(setId)) tied = true;
        }
        if (item.category === 'melee' && meleeSets) {
          const ms = meleeSets[item.set];
          if (ms && ms.tiedSets && ms.tiedSets.armor && ms.tiedSets.armor.includes(setId)) tied = true;
        }
        if (tied) totalPercent += 2.5;
      }

      const statKey = setDef.statBonus;
      statBonuses[statKey] = (statBonuses[statKey] || 0) + totalPercent;
    }

    return statBonuses;
  }

  // ═════════════════════════════════════════════════════════════════════════════════
  // Direct Chest Granting (no keys required)
  // ═════════════════════════════════════════════════════════════════════════════════

  /**
   * Grant a chest to a nation's inventory without requiring keys.
   * Used for goal/streak/login rewards.
   * @param {Object} nation
   * @param {string} chestKey - 'chest1'|'chest2'|'chest3'|'chest4'
   * @returns {Object} { success: boolean, reason?: string }
   */
  grantChest(nation, chestKey) {
    if (!nation.equipment) return { success: false, reason: 'No equipment data' };
    const chests = EQUIPMENT_CHESTS;
    const chestDef = chests[chestKey];
    if (!chestDef) return { success: false, reason: `Unknown chest: ${chestKey}` };

    nation.equipment.chests = nation.equipment.chests || { chest1: 0, chest2: 0, chest3: 0, chest4: 0 };
    nation.equipment.chests[chestKey] = (nation.equipment.chests[chestKey] || 0) + 1;

    return { success: true, chestKey, count: nation.equipment.chests[chestKey] };
  }

  // ═════════════════════════════════════════════════════════════════════════════════
  // Durability Decay
  // ═════════════════════════════════════════════════════════════════════════════════

  /**
   * Per-turn durability decay: flat 1 durability on every equipped item.
   * Called from world.js processTurn().
   * @param {Object} nation
   * @returns {Object} { broken: [itemIds] }
   */
  processTurn(nation) {
    if (!nation.equipment) return { broken: [] };
    const equipped = nation.equipment.equipped || {};
    const broken = [];

    for (const [slot, itemId] of Object.entries(equipped)) {
      if (!itemId) continue;
      const item = this._findItemById(nation, itemId);
      if (!item) continue;
      item.durability -= EQUIPMENT_TURN_DURABILITY_LOSS;
      if (item.durability <= 0) {
        broken.push(itemId);
        this._breakItem(nation, slot, itemId);
      }
    }

    return { broken };
  }

  _breakItem(nation, slot, itemId) {
    const equipped = nation.equipment.equipped || {};
    equipped[slot] = null;
    // Remove from inventory if present (shouldn't be, since equipped)
    const inv = nation.equipment.inventory || [];
    const idx = inv.findIndex(i => i.id === itemId);
    if (idx !== -1) inv.splice(idx, 1);
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // Repair Consumables
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Use a repair consumable (Drill-Bit/Grinder-Wheel/MegaDrill-Bit).
   * Consumed on use; restores target equipped tool durability to its tier max.
   * @param {Object} nation
   * @param {string} itemId - repair consumable item id
   * @returns {Object} { success, repairedItemId, restoredTo }
   */
  useRepairConsumable(nation, itemId) {
    if (!nation.equipment) return { success: false, reason: 'No equipment' };

    const inv = nation.equipment.inventory || [];
    const item = inv.find(i => i.id === itemId);
    if (!item || !item.repairTarget) return { success: false, reason: 'Not a repair consumable' };

    const target = item.repairTarget; // 'drill'|'grinder'|'megadrill'
    const equipped = nation.equipment.equipped || {};

    // Find the equipped target tool
    let targetItemId = null;
    let targetSlot = null;
    for (const [slot, iid] of Object.entries(equipped)) {
      if (!iid) continue;
      const ti = this._findItemById(nation, iid);
      if (ti && ti.templateId === target) {
        targetItemId = iid;
        targetSlot = slot;
        break;
      }
    }

    if (!targetItemId) return { success: false, reason: `No equipped ${target}` };

    const targetItem = this._findItemById(nation, targetItemId);
    targetItem.durability = targetItem.maxDurability;

    // Consume the repair item
    const idx = inv.findIndex(i => i.id === itemId);
    if (idx !== -1) inv.splice(idx, 1);

    return { success: true, repairedItemId: targetItemId, restoredTo: targetItem.maxDurability };
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // Serialization
  // ════════════════════════════════════════════════════════════════════════════════

  getState(nation) {
    if (!nation.equipment) return null;
    return {
      inventory: nation.equipment.inventory,
      keys: nation.equipment.keys,
      chests: nation.equipment.chests,
      equipped: nation.equipment.equipped,
    };
  }

  setState(nation, state) {
    if (!state) return;
    nation.equipment = {
      inventory: state.inventory || [],
      keys: state.keys || { key1: 0, key2: 0, key3: 0 },
      chests: state.chests || { chest1: 0, chest2: 0, chest3: 0, chest4: 0 },
      equipped: state.equipped || { weapon: null, head: null, body: null, arms: null, legs: null, feet: null, tool: null },
    };
  }
}

const EquipmentLootSystemInstance = new EquipmentLootSystem();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EquipmentLootSystem, EquipmentLootSystemInstance };
} else {
    window.EquipmentLootSystem = EquipmentLootSystem;
    window.EquipmentLootSystemInstance = EquipmentLootSystemInstance;
}
