"use strict";
const { clone } = require("./rules");
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

class ActionDispatcher {
  constructor(world, categories) {
    this.world = world;
    this.categories = categories;
  }

  command(id, action, data = {}, requestId) {
    const world = this.world;
    world.advance(world.clock());
    check(typeof action === "string", "Action required");
    check(
      data && typeof data === "object" && !Array.isArray(data),
      "Invalid action data",
    );
    check(
      typeof requestId === "string" && /^[a-zA-Z0-9-]{8,80}$/.test(requestId),
      "Request id required",
    );
    const receiptKey = `${id}:${requestId}`;
    if (own(world.state.receipts, receiptKey)) return;
    return world.transact(() => {
      const r = world.nation(id),
        n = r.nation;
      const previousXP = r.player.totalExperience;
      const xpMultiplier = n.motionModifiers?.xp || 1;
      world.runAction(r, action, data);
      const earnedXP = r.player.totalExperience - previousXP;
      if (earnedXP > 0 && xpMultiplier > 1)
        r.player._awardExperience(
          Math.floor(earnedXP * (xpMultiplier - 1)),
          "Forum XP bonus",
        );
      for (const rule of world.rules.values()) world.refresh(rule);
      world.state.receipts[receiptKey] = world.clock();
      const receipts = Object.entries(world.state.receipts).sort(
        (a, b) => a[1] - b[1],
      );
      for (const [key] of receipts.slice(
        0,
        Math.max(0, receipts.length - 5000),
      ))
        delete world.state.receipts[key];
      n.lastActive = world.clock();
    });
  }

  runAction(r, action, data) {
    const world = this.world;
    const n = r.nation,
      id = n.id,
      now = world.clock();
    switch (action) {
      case "build":
      case "demolish": {
        const { category, key } = data,
          q = world.buildingMgr.buildingQuote(r, category, key),
          def = r[category][this.categories[category][1]][key];
        check(
          action === "build" ? q.canBuild : q.canDestroy,
          (action === "build" ? q.reasons : q.destroyReasons).join("; "),
        );
        if (action === "build") {
          world.pay(n, q.cost);
          n[category][key] = q.owned + 1;
          n.buildingBasis ||= {};
          n.buildingBasis[category] ||= {};
          n.buildingBasis[category][key] ||= [];
          n.buildingBasis[category][key].push(clone(q.cost));
          if (category !== "improvements") {
            n.buildTimers ||= {};
            n.buildTimers[category] = world.state.day;
          }
          r.player._onBuildingConstructed();
        } else {
          const rate = n.projects.salvageYard
            ? { improvements: 0.15, projects: 0.1, wonders: 0.05 }[category] *
              (n.wonders.enhancedSalvage ? 2 : 1)
            : 0;
          const paid = n.buildingBasis?.[category]?.[key]?.pop() || def.cost;
          n.buildTimers ||= {};
          n.buildTimers.projects = world.state.day;
          world.pay(
            n,
            Object.fromEntries(
              Object.entries(paid).map(([k, v]) => [k, Math.floor(v * rate)]),
            ),
            -1,
          );
          n[category][key]--;
          if (category === "projects") n.buildTimers.projects = world.state.day;
        }
        break;
      }
      case "buyUnit":
        world.militaryMgr.buyUnit(r, data.type, quantity(data.amount));
        break;
      case "sellUnit":
        world.militaryMgr.sellUnit(r, data.type, quantity(data.amount));
        break;
      case "develop": {
        world.buildingMgr.develop(r, data);
        break;
      }
      case "elect":
        world.electionMgr.elect(r, data);
        break;
      case "claim":
        world.claimMgr.claim(r, data);
        break;
      case "identity":
        world.nationMgr.setIdentity(r, data);
        break;
      case "changeFaction":
        world.nationMgr.changeFaction(r, data);
        break;
      case "government":
        world.nationMgr.setGovernmentReligion(r, "government", data);
        break;
      case "religion":
        world.nationMgr.setGovernmentReligion(r, "religion", data);
        break;
      case "nationalFood":
        world.nationMgr.setNationalFood(r, data);
        break;
      case "nationalWater":
        world.nationMgr.setNationalWater(r, data);
        break;
      case "saveCitizens":
        world.nationMgr.saveCitizens(r, data);
        break;
      case "manufacturing":
        if (!r.resources?.manufacturingRecipes) {
          throw new Error("No manufacturing recipes defined");
        }
        check(
          own(r.resources.manufacturingRecipes, data.product) &&
            typeof data.enabled === "boolean",
          "Invalid production setting",
        );
        n.manufacturing[data.product] = data.enabled;
        break;
      case "manufacture": {
        if (!r.resources?.manufacturingRecipes) {
          throw new Error("No manufacturing recipes defined");
        }
        check(
          own(r.resources.manufacturingRecipes, data.product),
          "Unknown recipe",
        );
        check(n.improvements.assemblyPlant > 0, "Assembly Plant required");
        const recipe = r.resources.manufacturingRecipes[data.product],
          amount = quantity(data.amount, 10000),
          cost = Object.fromEntries(
            Object.entries(recipe.inputs).map(([k, v]) => [k, v * amount]),
          );
        check(!world.affordability(n, cost).length, "Insufficient ingredients");
        world.pay(n, cost);
        n.resources[data.product] += recipe.output * amount;
        break;
      }
      case "startResearch":
        world.researchMgr.startResearch(r, data);
        break;
      case "cancelResearch":
        world.researchMgr.cancelResearch(r, data);
        break;
      case "skill":
        world.researchMgr.allocateSkill(r, data);
        break;
      case "legendary":
        world.researchMgr.goLegendary(r, data);
        break;
      case "legendarySkill":
        world.researchMgr.allocateLegendarySkill(r, data);
        break;
      case "teamCreate":
      case "teamUpgrade":
      case "teamStarter":
      case "teamRelease":
      case "teamSign":
      case "teamBet":
      case "teamSetSub":
      case "teamDraft":
      case "teamTrain":
      case "teamExtendContract":
        world.sportsMgr.teamAction(r, action, data);
        break;
      case "wrestlingCreatePromotion":
      case "wrestlingChangeAiringDay":
      case "wrestlingBookMatch":
      case "wrestlingRemoveMatch":
      case "wrestlingSetWeeklyCard":
      case "wrestlingUpgradeArena":
      case "wrestlingSetTicketPrice":
      case "wrestlingDraftWrestler":
      case "wrestlingReleaseWrestler":
      case "wrestlingExtendContract":
      case "wrestlingTrainWrestler":
      case "wrestlingChangeFeaturedMatch":
      case "wrestlingSetSignatureMove":
      case "wrestlingSetFinisherMove":
      case "wrestlingSetMoveSet":
      case "wrestlingCreateTagTeam":
      case "wrestlingDissolveTagTeam":
      case "wrestlingVacateTitle":
      case "wrestlingMassPpvRegisterWrestler":
        world.sportsMgr.wrestlingAction(r, action, data);
        break;
      case "tradePropose":
        world.tradeMgr.proposeTradeAction(r, data);
        break;
      case "tradeRespond":
        world.tradeMgr.respondToTradeAction(r, data);
        break;
      case "tradeCancel":
        world.tradeMgr.trade(r, "cancelOffer", data);
        break;
      case "offer":
      case "acceptOffer":
      case "cancelOffer":
        world.tradeMgr.trade(r, action, data);
        break;
      case "worldBankLoan":
      case "worldBankRepay":
      case "worldBankBuy":
      case "worldBankSell":
        world.tradeMgr.worldBankAction(r, action, data);
        break;
      case "fundDiseaseCure":
        world.diseaseMgr.fundGlobalDiseaseCure(r, data.amount);
        break;
      case "currencyBuy":
        world.tradeMgr.currencyBuy(r, data);
        break;
      case "currencySell":
        world.tradeMgr.currencySell(r, data);
        break;
      case "lotteryPurchase": {
        const count = Number(data.count);
        const picks = data.ticketPicks;
        world.lotteryMgr.lotteryPurchase(r, count, picks);
        break;
      }
      case "lotteryClaim": {
        const ticketId = data.ticketId;
        world.lotteryMgr.lotteryClaim(r, ticketId);
        break;
      }
      case "casinoSetCardSet": {
        const { cardSet } = data;
        world.casinoMgr.casinoSetCardSet(r, cardSet);
        break;
      }
      case "casinoSpinWheel": {
        return world.casinoMgr.casinoSpinWheel(r);
      }
      case "casinoBuyKeno": {
        const { petIds, wager } = data;
        return world.casinoMgr.casinoBuyKeno(r, petIds, wager);
      }
      case "casinoDrawKeno": {
        return world.casinoMgr.casinoDrawKeno(r);
      }
      case "casinoClaimKenoWin": {
        const { ticketId } = data;
        return world.casinoMgr.casinoClaimKenoWin(r, ticketId);
      }
      case "casinoGetKenoStats": {
        return world.casinoMgr.casinoGetKenoStats(r);
      }
      case "casinoBuyScratchOff": {
        const { cardId } = data;
        return world.casinoMgr.casinoBuyScratchOff(r, cardId);
      }
      case "casinoRevealScratchOff": {
        const { cardId, tileIndex } = data;
        return world.casinoMgr.casinoRevealScratchOff(r, cardId, tileIndex);
      }
      case "casinoClaimScratchOffWin": {
        const { cardId: claimCardId } = data;
        return world.casinoMgr.casinoClaimScratchOffWin(r, claimCardId);
      }
      case "casinoGetScratchOffStats": {
        return world.casinoMgr.casinoGetScratchOffStats(r);
      }
      case "casinoGetStats": {
        return world.casinoMgr.casinoGetStats(r);
      }
      case "casinoJoinTable": {
        const { tableId, seatIndex } = data;
        return world.casinoMgr.casinoJoinTable(r, tableId, seatIndex);
      }
      case "casinoLeaveTable": {
        const { tableId } = data;
        return world.casinoMgr.casinoLeaveTable(r, tableId);
      }
      case "casinoListTables": {
        return world.casinoMgr.casinoListTables(r);
      }
      case "casinoPlaceBet": {
        const { tableId, seatIndex, amount } = data;
        return world.casinoMgr.casinoPlaceBet(r, tableId, seatIndex, amount);
      }
      case "casinoBlackjackHit": {
        const { tableId: bjTableId } = data;
        return world.casinoMgr.casinoBlackjackHit(r, bjTableId);
      }
      case "casinoBlackjackStand": {
        const { tableId: bjTableId2 } = data;
        return world.casinoMgr.casinoBlackjackStand(r, bjTableId2);
      }
      case "casinoBlackjackDouble": {
        const { tableId: bjTableId3 } = data;
        return world.casinoMgr.casinoBlackjackDouble(r, bjTableId3);
      }
      case "casinoBlackjackSplit": {
        const { tableId: bjTableId4 } = data;
        return world.casinoMgr.casinoBlackjackSplit(r, bjTableId4);
      }
      case "casinoBlackjackSurrender": {
        const { tableId: bjTableId5 } = data;
        return world.casinoMgr.casinoBlackjackSurrender(r, bjTableId5);
      }
      case "casinoBlackjackInsurance": {
        const { tableId: bjTableId6, accept } = data;
        return world.casinoMgr.casinoBlackjackInsurance(r, bjTableId6, accept);
      }
      case "casinoResolveInsurance": {
        const { tableId: bjTableId6b } = data;
        return world.casinoMgr.casinoResolveInsurance(r, bjTableId6b);
      }
      case "casinoGetTableState": {
        const { tableId: bjTableId7 } = data;
        return world.casinoMgr.casinoGetTableState(r, bjTableId7);
      }
      case "casinoGetTableList": {
        return world.casinoMgr.casinoGetTableList(r);
      }
      case "casinoDealInitial": {
        const { tableId: bjTableId8 } = data;
        return world.casinoMgr.casinoDealInitial(r, bjTableId8);
      }
      case "casinoSettleBlackjack": {
        const { tableId: bjTableId9 } = data;
        return world.casinoMgr.casinoSettleBlackjack(r, bjTableId9);
      }
      case "casinoDiceCreateTable": {
        const { dieSize, diceCount, minBet, maxBet, autoRoll } = data;
        return world.casinoMgr.casinoDiceCreateTable(
          r,
          dieSize,
          diceCount,
          minBet,
          maxBet,
          autoRoll,
        );
      }
      case "casinoDiceJoinTable": {
        const { tableId, seatIndex } = data;
        return world.casinoMgr.casinoDiceJoinTable(r, tableId, seatIndex);
      }
      case "casinoDiceLeaveTable": {
        const { tableId } = data;
        return world.casinoMgr.casinoDiceLeaveTable(r, tableId);
      }
      case "casinoDiceListTables": {
        return world.casinoMgr.casinoDiceListTables(r);
      }
      case "casinoDicePlaceBet": {
        const { tableId, seatIndex, betType, target, amount } = data;
        return world.casinoMgr.casinoDicePlaceBet(
          r,
          tableId,
          seatIndex,
          betType,
          target,
          amount,
        );
      }
      case "casinoDiceBackBet": {
        const { tableId, seatIndex, betId, amount } = data;
        return world.casinoMgr.casinoDiceBackBet(r, tableId, seatIndex, betId, amount);
      }
      case "casinoDiceRoll": {
        const { tableId } = data;
        return world.casinoMgr.casinoDiceRoll(r, tableId);
      }
      case "casinoDiceGetTableState": {
        const { tableId } = data;
        return world.casinoMgr.casinoDiceGetTableState(r, tableId);
      }
      case "casinoDiceGetBetMenu": {
        const { dieSize, diceCount } = data;
        return world.casinoMgr.casinoDiceGetBetMenu(r, dieSize, diceCount);
      }
      case "casinoDiceSetShooter": {
        const { tableId, seatIndex } = data;
        return world.casinoMgr.casinoDiceSetShooter(r, tableId, seatIndex);
      }
      case "casinoDiceResetTable": {
        const { tableId } = data;
        return world.casinoMgr.casinoDiceResetTable(r, tableId);
      }
      case "casinoSetDiceSettings": {
        const { diceSet, diceColor, diceStyle } = data;
        return world.casinoMgr.casinoSetDiceSettings(r, diceSet, diceColor, diceStyle);
      }
      case "allianceCreate":
      case "allianceApply":
      case "allianceReview":
      case "allianceEditSettings":
      case "allianceSettings":
      case "allianceRole":
      case "allianceLeave":
      case "allianceKick":
      case "allianceTransfer":
      case "allianceDeposit":
      case "allianceWithdraw":
        world.diplomacyMgr.allianceAction(r, action, data);
        break;
      case "proposeMotion":
      case "vote":
        world.forumMgr.forumAction(r, action, data);
        break;
      case "article":
        world.chatMgr.createArticle(r, data);
        break;
      case "editArticle":
        world.chatMgr.editArticle(r, data);
        break;
      case "deleteArticle":
        world.chatMgr.deleteArticle(r, data);
        break;
      case "comment":
        world.chatMgr.addComment(r, data);
        break;
      case "react":
        world.chatMgr.addReaction(r, data);
        break;
      case "newsCommentEdit":
        world.chatMgr.editComment(r, data);
        break;
      case "newsCommentDelete":
        world.chatMgr.deleteComment(r, data);
        break;
      case "message":
        world.chatMgr.sendMessage(r, data);
        break;
      case "settings": {
        const { group, key, value } = data;
        check(
          ["notifications", "privacy", "ui", "customImages"].includes(group) &&
            r.player.settings &&
            r.player.settings[group] !== undefined &&
            (group === "customImages"
              ? ["flagImage","militaryUnits","nationalFood","nationalWater","nationalPet"].includes(key)
              : own(r.player.settings[group], key)),
          "Invalid setting",
        );
        r.player.settings[group][key] = value;
        break;
      }
      case "treatyPropose":
      case "treatyRespond":
      case "treatyCancel":
      case "relationship":
      case "aid":
      case "aidRespond":
        world.diplomacyMgr.diplomacyAction(r, action, data);
        break;
      case "proposeAid":
        world.tradeMgr.proposeAidAction(r, data);
        break;
      case "respondToAid":
        world.tradeMgr.respondToAidAction(r, data);
        break;
      case "proposeTrade":
        world.tradeMgr.proposeTradeAction(r, data);
        break;
      case "respondToTrade":
        world.tradeMgr.respondToTradeAction(r, data);
        break;
      case "respondToCounter":
        world.tradeMgr.respondToCounterAction(r, data);
        break;
      case "warRespond":
        world.warMgr.warRespond(r, id, data);
        break;
      case "joinWar":
        world.warMgr.joinWar(r, id, data);
        break;
      case "declareWar":
      case "attack":
      case "peace":
        world.warMgr.warAction(r, action, data);
        break;
      case "setFlag":
        world.nationMgr.setFlagAction(r, data);
        break;
      case "resolveSituation":
        world.nationMgr.resolveSituationAction(r, data);
        break;
      case "setNationalPet":
        world.nationMgr.setNationalPetAction(r, data);
        break;
      case "setEdicts":
        world.nationMgr.setEdictsAction(r, data);
        break;
      case "cureDisease":
        world.diseaseMgr.cureDiseaseAction(r, data);
        break;
      case "openChest":
        world.equipmentMgr.openChestAction(r, data);
        break;
      case "equipItem":
        world.equipmentMgr.equipItemAction(r, data);
        break;
      case "unequipItem":
        world.equipmentMgr.unequipItemAction(r, data);
        break;
      case "useRepairItem":
        world.equipmentMgr.useRepairItemAction(r, data);
        break;
      case "buyKey":
        world.equipmentMgr.buyKeyAction(r, data);
        break;
      case "buyChest":
        world.equipmentMgr.buyChestAction(r, data);
        break;
      default:
        throw new Error("Unknown action");
    }
  }

  actionQuote(id, action, data = {}) {
    const world = this.world;
    const r = world.nation(id);
    const result = {
      revision: world.state.revision,
      canAct: false,
      reasons: [],
    };
    try {
      if (action === "develop") {
        quantity(data.amount, 1000);
        const simulated = createRules(world.state.day, r.snapshot());
        result.cost = { money: world.buildingMgr.develop(simulated, data, true) };
        check(
          r.nation.money >= result.cost.money,
          "Insufficient money for the full purchase",
        );
      } else if (["government", "religion"].includes(action)) {
        world.nationMgr.choiceCheck(r, action, data);
      } else if (["declareWar", "attack"].includes(action)) {
        world.warMgr.warAction(r, action, data, true);
      } else if (action === "acceptOffer") {
        result.cost = world.tradeMgr.trade(r, action, data, true);
      } else if (action === "proposeMotion") {
        world.forumMgr.forumAction(r, action, data, true);
      } else if (action === "worldBankLoan") {
        const amount = quantity(data.amount, 1_000_000_000);
        check(
          Number.isSafeInteger(amount) && amount > 0,
          "Invalid loan amount",
        );
        const activeLoans = (r.nation.loans || []).filter(
          (l) => l.status === "active",
        );
        check(activeLoans.length < 3, "Maximum 3 active loans");
        check(
          amount <= Math.floor((r.nation.taxRevenue || 0) * 52),
          "Loan exceeds 1 year of tax revenue",
        );
      } else if (action === "worldBankBuy") {
        check(
          world.catalog().resources.includes(data.resource),
          "Unknown resource",
        );
        const amount = quantity(data.amount, 1_000_000);
        check(
          Number.isSafeInteger(amount) && amount > 0,
          "Invalid quantity",
        );
        const { buyPrice } = world.resourceSystem.getWorldBankPrice(
          data.resource,
          null,
          world.state.globalResources,
          r.nation,
          world.state.worldBank,
        );
        const inventory = world.state.worldBank.inventory[data.resource] || 0;
        check(inventory >= amount, "World Bank does not have enough stock");
        result.cost = { money: Math.floor(buyPrice * amount) };
        check(
          !world.affordability(r.nation, result.cost).length,
          "Insufficient funds",
        );
      } else if (action === "worldBankSell") {
        check(
          world.catalog().resources.includes(data.resource),
          "Unknown resource",
        );
        const amount = quantity(data.amount, 1_000_000);
        check(
          Number.isSafeInteger(amount) && amount > 0,
          "Invalid quantity",
        );
        check(
          world.resourceSystem.getResourceAmount(r.nation, data.resource) >=
            amount,
          "Not enough resources to sell",
        );
        const { sellPrice } = world.resourceSystem.getWorldBankPrice(
          data.resource,
          null,
          world.state.globalResources,
          r.nation,
          world.state.worldBank,
        );
        result.revenue = { money: Math.floor(sellPrice * amount) };
      } else throw new Error("This action has no preview");
      result.canAct = true;
    } catch (error) {
      result.reasons.push(error.message);
    }
    return result;
  }
}

module.exports = { ActionDispatcher };
