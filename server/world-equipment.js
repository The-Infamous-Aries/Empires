"use strict";

const { EQUIPMENT_WORLD_BANK_PRICES } = require("../assets/data/equipment/chests.js");
const { saveNation } = require("../core/data-persistence");

class EquipmentManager {
  constructor(world) {
    this.world = world;
  }

  openChestAction(r, data) {
    const world = this.world;
    const n = r.nation;
    const { chestKey } = data;
    if (!chestKey) throw new Error("Chest key required");
    const luck = r.player.getSkillValue("luck") || 0;
    const result = world.equipmentSystem.openChest(n, chestKey, luck);
    if (!result.success) throw new Error(result.reason || "Cannot open chest");
    world.refresh(r);
    // Persist nation
    const { saveNation } = require("../core/data-persistence");
    saveNation(n).catch(err =>
      console.error("Failed to persist nation after chest open:", err.message)
    );
    return {
      opened: chestKey,
      items: result.items,
      tier: result.tier,
      keysConsumed: result.keysConsumed,
    };
  }

  equipItemAction(r, data) {
    const world = this.world;
    const n = r.nation;
    const { itemId } = data;
    if (!itemId) throw new Error("Item ID required");
    const result = world.equipmentSystem.equipItem(n, itemId);
    if (!result.success) throw new Error(result.reason || "Cannot equip item");
    world.refresh(r);
    const { saveNation } = require("../core/data-persistence");
    saveNation(n).catch(err =>
      console.error("Failed to persist nation after equip:", err.message)
    );
    return { equipped: itemId, unequipped: result.unequippedItemId };
  }

  unequipItemAction(r, data) {
    const world = this.world;
    const n = r.nation;
    const { itemId } = data;
    if (!itemId) throw new Error("Item ID required");
    const result = world.equipmentSystem.unequipItem(n, itemId);
    if (!result.success) throw new Error(result.reason || "Cannot unequip item");
    world.refresh(r);
    const { saveNation } = require("../core/data-persistence");
    saveNation(n).catch(err =>
      console.error("Failed to persist nation after unequip:", err.message)
    );
    return { unequipped: itemId };
  }

  useRepairItemAction(r, data) {
    const world = this.world;
    const n = r.nation;
    const { itemId } = data;
    if (!itemId) throw new Error("Item ID required");
    const result = world.equipmentSystem.useRepairConsumable(n, itemId);
    if (!result.success) throw new Error(result.reason || "Cannot use repair item");
    world.refresh(r);
    saveNation(n).catch(err =>
      console.error("Failed to persist nation after repair:", err.message)
    );
    return { repaired: result.repairedItemId, restoredTo: result.restoredTo };
  }

  buyKeyAction(r, data) {
    const world = this.world;
    const n = r.nation;
    const { keyType, qty = 1 } = data;
    if (!keyType) throw new Error("Key type required");
    const price = (EQUIPMENT_WORLD_BANK_PRICES.keys && EQUIPMENT_WORLD_BANK_PRICES.keys[keyType]) || 0;
    const totalPrice = price * qty;
    const aff = world.affordability(n, { money: totalPrice });
    if (aff.length) throw new Error(aff.join("; "));
    world.pay(n, { money: totalPrice });
    n.equipment.keys = n.equipment.keys || {};
    n.equipment.keys[keyType] = (n.equipment.keys[keyType] || 0) + qty;
    world.refresh(r);
    saveNation(n).catch(err =>
      console.error("Failed to persist nation after buying key:", err.message)
    );
    return { keyType, qty, price: totalPrice };
  }

  buyChestAction(r, data) {
    const world = this.world;
    const n = r.nation;
    const { chestType, qty = 1 } = data;
    if (!chestType) throw new Error("Chest type required");
    const price = (EQUIPMENT_WORLD_BANK_PRICES.chests && EQUIPMENT_WORLD_BANK_PRICES.chests[chestType]) || 0;
    const totalPrice = price * qty;
    const aff = world.affordability(n, { money: totalPrice });
    if (aff.length) throw new Error(aff.join("; "));
    world.pay(n, { money: totalPrice });
    n.equipment.chests = n.equipment.chests || {};
    n.equipment.chests[chestType] = (n.equipment.chests[chestType] || 0) + qty;
    world.refresh(r);
    saveNation(n).catch(err =>
      console.error("Failed to persist nation after buying chest:", err.message)
    );
    return { chestType, qty, price: totalPrice };
  }
}

module.exports = { EquipmentManager };
