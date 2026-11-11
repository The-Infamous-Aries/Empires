"use strict";
const { randomUUID } = require("node:crypto");
const { saveWorldBank, saveNation } = require("../core/data-persistence");
const { EQUIPMENT_WORLD_BANK_PRICES } = require("../assets/data/equipment/chests.js");

const own = (object, key) =>
  typeof key === "string" && Object.hasOwn(object, key);
function check(condition, message) {
  if (!condition) throw new Error(message);
}
function quantity(value, max = 1_000_000) {
  check(
    Number.isSafeInteger(value) && value > 0 && value <= max,
    `Quantity must be a whole number from 1 to ${max}`,
  );
  return value;
}

class TradeManager {
  constructor(world) {
    this.world = world;
  }

  trade(r, action, d, preview = false) {
    const world = this.world;
    const n = r.nation;
    if (action === "offer") {
      world.check(["buy", "sell"].includes(d.side), "Choose buy or sell");
      world.check(
        world.catalog().resources.includes(d.resource),
        "Unknown resource",
      );
      const amount = quantity(d.amount),
        price = quantity(d.price, 1_000_000_000);
      world.check(Number.isSafeInteger(amount * price), "Offer value is too large");
      world.check(
        !n.motionModifiers.embargo.includes(d.resource),
        "Resource is under a world embargo",
      );
      world.check(
        Object.values(world.state.offers).filter((o) => o.owner === n.id)
          .length < 100,
        "Maximum 100 offers without a Trade Hub",
      );
      const cost =
        d.side === "buy" ? { money: amount * price } : { [d.resource]: amount };
      world.check(
        !world.affordability(n, cost).length,
        "Insufficient funds or resources for escrow",
      );
      world.pay(n, cost);
      const id = randomUUID();
      world.state.offers[id] = {
        id,
        owner: n.id,
        side: d.side,
        resource: d.resource,
        amount,
        price,
        status: "open",
        createdAt: world.clock(),
      };
    } else {
      const offer = world.state.offers[d.id];
      world.check(offer && offer.status === "open", "Offer is no longer open");
      if (action === "cancelOffer") {
        world.check(offer.owner === n.id, "Only the owner can cancel");
        offer.status = "returning";
        offer.returnDay = world.state.day + 12;
        return;
      }
      world.check(offer.owner !== n.id, "Cannot accept your own offer");
      const maker = world.nation(offer.owner).nation;
      world.check(
        !n.motionModifiers.embargo.includes(offer.resource) &&
          !maker.motionModifiers.embargo.includes(offer.resource),
        "Resource is under a world embargo",
      );
      const cost =
        offer.side === "sell"
          ? { money: offer.amount * offer.price }
          : { [offer.resource]: offer.amount };
      const tariff = Math.ceil(
        offer.amount * offer.price * (n.motionModifiers.tariff || 0),
      );
      cost.money = (cost.money || 0) + tariff;
      world.check(
        !world.affordability(n, cost).length,
        "Insufficient funds or resources",
      );
      if (preview) return cost;
      world.pay(n, cost);
      if (offer.side === "sell") {
        n.resources[offer.resource] = (n.resources[offer.resource] || 0) + offer.amount;
        maker.money += offer.amount * offer.price;
      } else {
        n.money += offer.amount * offer.price;
        maker.resources[offer.resource] = (maker.resources[offer.resource] || 0) + offer.amount;
      }
      delete world.state.offers[offer.id];
    }
  }

  currencyBuy(r, data) {
    const world = this.world;
    const n = r.nation;
    const currencyKey = data.currencyKey;
    const points = Number(data.points);
    const rate = world.getCurrencyRate(currencyKey);
    world.check(Number.isFinite(points) && points > 0, "Invalid points");
    const cost = Math.ceil(points * rate);
    const reasons = world.affordability(n, { money: cost });
    if (reasons.length) throw new Error("Insufficient funds");
    world.pay(n, { money: cost });
    n.currencyInvestments ||= {};
    n.currencyInvestments[currencyKey] = n.currencyInvestments[currencyKey] || { points: 0, totalSpent: 0 };
    n.currencyInvestments[currencyKey].points += points;
    n.currencyInvestments[currencyKey].totalSpent += cost;
    world.refresh(r);
  }

  currencySell(r, data) {
    const world = this.world;
    const n = r.nation;
    const currencyKey = data.currencyKey;
    const points = Number(data.points);
    const rate = world.getCurrencyRate(currencyKey);
    world.check(Number.isFinite(points) && points > 0, "Invalid points");
    const inv = (n.currencyInvestments || {})[currencyKey];
    world.check(inv && inv.points >= points, "Not enough currency points");
    const proceeds = Math.floor(points * rate);
    world.pay(n, { money: -proceeds });
    inv.points -= points;
    if (inv.points <= 0) {
      inv.points = 0;
      inv.totalSpent = 0;
    }
    world.refresh(r);
  }

  proposeAidAction(r, data) {
    const world = this.world;
    const n = r.nation;
    const { toNationId, sending } = data;
    const result = world.tradeAidSystem.proposeAid(world, n.id, toNationId, sending || {});
    if (!result.success) throw new Error(result.error);
    try {
      world.xpGoalsSystem.awardSendAid(1, { target: toNationId, type: 'aid' });
    } catch (e) {}
    world.refresh(r);
  }

  respondToAidAction(r, data) {
    const world = this.world;
    const n = r.nation;
    const { slotId, accept } = data;
    const result = world.tradeAidSystem.respondToAid(world, slotId, n.id, accept === true);
    if (!result.success) throw new Error(result.error);
    const slot = world.tradeAidSystem._findSlot(slotId);
    if (slot && accept === true) {
      try {
        world.xpGoalsSystem.awardReceiveAid(1, { target: slot.fromNationId, type: 'aid' });
      } catch (e) {}
    }
    world.refresh(r);
  }

  proposeTradeAction(r, data) {
    const world = this.world;
    const n = r.nation;
    const { toNationId, sending, receiving } = data;
    const result = world.tradeAidSystem.proposeTrade(world, n.id, toNationId, sending || {}, receiving || {});
    if (!result.success) throw new Error(result.error);
    try {
      world.xpGoalsSystem.awardProposeTrade(1, { target: toNationId });
    } catch (e) {}
    world.refresh(r);
  }

  respondToTradeAction(r, data) {
    const world = this.world;
    const n = r.nation;
    const { slotId, accept, counterOffer } = data;
    if (counterOffer) {
      const result = world.tradeAidSystem.respondToTrade(world, slotId, n.id, false, counterOffer);
      if (!result.success) throw new Error(result.error);
      try {
        world.xpGoalsSystem.awardProposeTrade(1, { target: slotId, isCounter: true });
      } catch (e) {}
    } else {
      const result = world.tradeAidSystem.respondToTrade(world, slotId, n.id, accept === true);
      if (!result.success) throw new Error(result.error);
      if (accept === true) {
        try {
          world.xpGoalsSystem.awardAcceptTrade(1, { target: slotId });
        } catch (e) {}
      } else {
        try {
          world.xpGoalsSystem.awardRejectTrade(1, { target: slotId });
        } catch (e) {}
      }
    }
    world.refresh(r);
  }

  respondToCounterAction(r, data) {
    const world = this.world;
    const n = r.nation;
    const { slotId, accept } = data;
    const result = world.tradeAidSystem.respondToCounter(world, slotId, n.id, accept === true);
    if (!result.success) throw new Error(result.error);
    if (accept === true) {
      try {
        world.xpGoalsSystem.awardAcceptTrade(1, { target: slotId, isCounter: true });
      } catch (e) {}
    } else {
      try {
        world.xpGoalsSystem.awardRejectTrade(1, { target: slotId, isCounter: true });
      } catch (e) {}
    }
    world.refresh(r);
  }

  worldBankAction(r, action, data) {
    const world = this.world;
    const n = r.nation;
    const wb = world.state.worldBank;
    if (action === "worldBankLoan") {
      const amount = quantity(data.amount, 1_000_000_000);
      world.check(Number.isSafeInteger(amount) && amount > 0, "Invalid loan amount");
      const activeLoans = (n.loans || []).filter(
        (l) => l.status === "active",
      );
      world.check(
        activeLoans.length < 3,
        "Maximum 3 active loans from the World Bank",
      );
      const limit = Math.floor((n.taxRevenue || 0) * 52);
      world.check(amount <= limit, "Loan exceeds 1 year of tax revenue");
      const owed = Math.floor(amount * 1.2);
      n.loans ||= [];
      n.loans.push({
        id: randomUUID(),
        principal: amount,
        owed,
        rate: 0.2,
        takenAt: world.state.day,
        status: "active",
      });
      n.money += amount;
      world.refresh(r);

      // Persist world bank state to database
      saveWorldBank({
        id: 'world_bank',
        prices: world.state.worldBank.prices || {},
        targets: world.state.worldBank.targets || {},
        inventory: world.state.worldBank.inventory || {},
        seeded: world.state.worldBank.seeded !== false,
        loanRate: world.state.worldBank.loanRate || 0.02,
        loans: world.state.worldBank.loans || [],
        lottery: world.state.lottery,
      }).catch(err => console.error('Failed to persist world bank loan:', err.message));

      return;
    }
    if (action === "worldBankRepay") {
      const loanId = data.loanId;
      const amount = quantity(data.amount, 1_000_000_000);
      world.check(Number.isSafeInteger(amount) && amount > 0, "Invalid repayment");
      const loan = (n.loans || []).find((l) => l.id === loanId);
      world.check(loan && loan.status === "active", "Loan not found or not active");
      world.check(amount <= loan.owed, "Repayment exceeds amount owed");
      world.check(!world.affordability(n, { money: amount }).length, "Insufficient funds");
      world.pay(n, { money: amount });
      loan.owed -= amount;
      if (loan.owed <= 0) {
        loan.owed = 0;
        loan.status = "repaid";
      }
      world.refresh(r);

      // Persist world bank state to database
      saveWorldBank({
        id: 'world_bank',
        prices: world.state.worldBank.prices || {},
        targets: world.state.worldBank.targets || {},
        inventory: world.state.worldBank.inventory || {},
        seeded: world.state.worldBank.seeded !== false,
        loanRate: world.state.worldBank.loanRate || 0.02,
        loans: world.state.worldBank.loans || [],
        lottery: world.state.lottery,
      }).catch(err => console.error('Failed to persist world bank repay:', err.message));

      return;
    }
    if (action === "worldBankBuy") {
      // ── Equipment items (keys/chests) ────────────────────────────────
      const equipPrices = EQUIPMENT_WORLD_BANK_PRICES;
      if (Object.keys(equipPrices).includes(data.resource)) {
        const resourceKey = data.resource;
        const amount = quantity(data.amount, 1_000_000);
        world.check(Number.isSafeInteger(amount) && amount > 0, "Invalid quantity");
        const { buyPrice, preTaxPrice, taxRate } = world.resourceSystem.getWorldBankPrice(
          resourceKey,
          null,
          world.state.globalResources,
          n,
          world.state.worldBank,
        );
        const inventory = wb.inventory[resourceKey] || 0;
        world.check(inventory >= amount, "World Bank does not have enough stock");
        const cost = Math.floor(buyPrice * amount);
        world.check(
          !world.affordability(n, { money: cost }).length,
          "Insufficient funds",
        );
        world.pay(n, { money: cost });
        // Add to nation equipment keys/chests
        n.equipment = n.equipment || {
          inventory: [],
          keys: { key1: 0, key2: 0, key3: 0 },
          chests: { chest1: 0, chest2: 0, chest3: 0, chest4: 0 },
          equipped: { weapon: null, head: null, body: null, arms: null, legs: null, feet: null, tool: null },
        };
        if (resourceKey.startsWith("key")) {
          n.equipment.keys[resourceKey] = (n.equipment.keys[resourceKey] || 0) + amount;
        } else {
          n.equipment.chests[resourceKey] = (n.equipment.chests[resourceKey] || 0) + amount;
        }
        wb.inventory[resourceKey] = inventory - amount;
        // Route buy tax portion to the World Lottery pot
        world.state.lottery.pool = ((world.state.lottery && world.state.lottery.pool) || 0)
          + Math.floor(preTaxPrice * taxRate * amount);
        world.refresh(r);
        // Persist
        saveWorldBank({
          id: 'world_bank',
          prices: world.state.worldBank.prices || {},
          targets: world.state.worldBank.targets || {},
          inventory: world.state.worldBank.inventory || {},
          seeded: world.state.worldBank.seeded !== false,
          loanRate: world.state.worldBank.loanRate || 0.02,
          loans: world.state.worldBank.loans || [],
          foodWaterPurchaseHistory: world.state.worldBank.foodWaterPurchaseHistory || {},
          lottery: world.state.lottery,
        }).catch(err => console.error('Failed to persist world bank buy (equipment):', err.message));
        saveNation(n).catch(err => console.error('Failed to persist nation after equipment buy:', err.message));
        return;
      }
      world.check(
        world.catalog().resources.includes(data.resource),
        "Unknown resource",
      );
      const resourceKey = data.resource;
      const amount = quantity(data.amount, 1_000_000);
      world.check(Number.isSafeInteger(amount) && amount > 0, "Invalid quantity");
      const { buyPrice, preTaxPrice, taxRate } = world.resourceSystem.getWorldBankPrice(
        resourceKey,
        null,
        world.state.globalResources,
        n,
        world.state.worldBank,
      );
      const inventory = wb.inventory[resourceKey] || 0;
      world.check(inventory >= amount, "World Bank does not have enough stock");
      const cost = Math.floor(buyPrice * amount);
      world.check(
        !world.affordability(n, { money: cost }).length,
        "Insufficient funds",
      );
      world.pay(n, { money: cost });
      world.resourceSystem.addResource(n, resourceKey, amount);
      wb.inventory[resourceKey] = inventory - amount;
      // Route buy tax portion to the World Lottery pot
      world.state.lottery.pool = ((world.state.lottery && world.state.lottery.pool) || 0)
        + Math.floor(preTaxPrice * taxRate * amount);
      // Track food/water purchases for 72-hour price factor
      if (resourceKey === "food" || resourceKey === "water") {
        world.resourceSystem.recordFoodWaterPurchase(resourceKey, amount, world.state.worldBank);
      }
      world.refresh(r);

      // Persist world bank state to database
      saveWorldBank({
        id: 'world_bank',
        prices: world.state.worldBank.prices || {},
        targets: world.state.worldBank.targets || {},
        inventory: world.state.worldBank.inventory || {},
        seeded: world.state.worldBank.seeded !== false,
        loanRate: world.state.worldBank.loanRate || 0.02,
        loans: world.state.worldBank.loans || [],
        foodWaterPurchaseHistory: world.state.worldBank.foodWaterPurchaseHistory || {},
        lottery: world.state.lottery,
      }).catch(err => console.error('Failed to persist world bank buy:', err.message));

      return;
    }
    if (action === "worldBankSell") {
      // ── Equipment items (keys/chests) ────────────────────────────────
      const equipPrices = EQUIPMENT_WORLD_BANK_PRICES;
      if (Object.keys(equipPrices).includes(data.resource)) {
        const resourceKey = data.resource;
        const amount = quantity(data.amount, 1_000_000);
        world.check(Number.isSafeInteger(amount) && amount > 0, "Invalid quantity");
        // Check nation has enough keys/chests
        n.equipment = n.equipment || {
          inventory: [],
          keys: { key1: 0, key2: 0, key3: 0 },
          chests: { chest1: 0, chest2: 0, chest3: 0, chest4: 0 },
          equipped: { weapon: null, head: null, body: null, arms: null, legs: null, feet: null, tool: null },
        };
        const nationEquip = n.equipment;
        const hasKey = nationEquip && nationEquip.keys && nationEquip.keys[resourceKey] >= amount;
        const hasChest = nationEquip && nationEquip.chests && nationEquip.chests[resourceKey] >= amount;
        world.check(hasKey || hasChest, "Not enough keys/chests to sell");
        const { sellPrice, preTaxPrice, taxRate } = world.resourceSystem.getWorldBankPrice(
          resourceKey,
          null,
          world.state.globalResources,
          n,
          world.state.worldBank,
        );
        const revenue = Math.floor(sellPrice * amount);
        // Deduct from nation equipment
        if (resourceKey.startsWith("key")) {
          nationEquip.keys[resourceKey] -= amount;
        } else {
          nationEquip.chests[resourceKey] -= amount;
        }
        wb.inventory[resourceKey] = (wb.inventory[resourceKey] || 0) + amount;
        n.money += revenue;
        // Route sell tax withheld to the World Lottery pot
        world.state.lottery.pool = ((world.state.lottery && world.state.lottery.pool) || 0)
          + Math.floor(preTaxPrice * taxRate * amount);
        world.refresh(r);
        // Persist
        saveWorldBank({
          id: 'world_bank',
          prices: world.state.worldBank.prices || {},
          targets: world.state.worldBank.targets || {},
          inventory: world.state.worldBank.inventory || {},
          seeded: world.state.worldBank.seeded !== false,
          loanRate: world.state.worldBank.loanRate || 0.02,
          loans: world.state.worldBank.loans || [],
          foodWaterPurchaseHistory: world.state.worldBank.foodWaterPurchaseHistory || {},
          lottery: world.state.lottery,
        }).catch(err => console.error('Failed to persist world bank sell (equipment):', err.message));
        saveNation(n).catch(err => console.error('Failed to persist nation after equipment sell:', err.message));
        return;
      }
      world.check(
        world.catalog().resources.includes(data.resource),
        "Unknown resource",
      );
      const resourceKey = data.resource;
      const amount = quantity(data.amount, 1_000_000);
      world.check(Number.isSafeInteger(amount) && amount > 0, "Invalid quantity");
      world.check(
        world.resourceSystem.getResourceAmount(n, resourceKey) >= amount,
        "Not enough resources to sell",
      );
      const { sellPrice, preTaxPrice, taxRate } = world.resourceSystem.getWorldBankPrice(
        resourceKey,
        null,
        world.state.globalResources,
        n,
        world.state.worldBank,
      );
      const revenue = Math.floor(sellPrice * amount);
      world.resourceSystem.deductResource(n, resourceKey, amount);
      wb.inventory[resourceKey] = (wb.inventory[resourceKey] || 0) + amount;
      n.money += revenue;
      // Route sell tax withheld to the World Lottery pot
      world.state.lottery.pool = ((world.state.lottery && world.state.lottery.pool) || 0)
        + Math.floor(preTaxPrice * taxRate * amount);
      world.refresh(r);

      // Persist world bank state to database
      saveWorldBank({
        id: 'world_bank',
        prices: world.state.worldBank.prices || {},
        targets: world.state.worldBank.targets || {},
        inventory: world.state.worldBank.inventory || {},
        seeded: world.state.worldBank.seeded !== false,
        loanRate: world.state.worldBank.loanRate || 0.02,
        loans: world.state.worldBank.loans || [],
        foodWaterPurchaseHistory: world.state.worldBank.foodWaterPurchaseHistory || {},
        lottery: world.state.lottery,
      }).catch(err => console.error('Failed to persist world bank sell:', err.message));

      return;
    }
    throw new Error("Unknown World Bank action");
  }
}

module.exports = { TradeManager };
