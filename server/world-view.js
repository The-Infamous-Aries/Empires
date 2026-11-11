"use strict";
const {
  intelligence,
  relationshipTypes,
  relationshipQuote,
  treatyReasons,
  intelligencePartners,
  combatBonus,
} = require("./world-diplomacy");
const { view: warView } = require("./world-war");
const HOUR = 3_600_000;
function check(condition, message) {
  if (!condition) throw new Error(message);
}
function text(value, name, max = 100, min = 1) {
  check(
    typeof value === "string" &&
      value.trim().length >= min &&
      value.trim().length <= max,
    `${name} must contain ${min}–${max} characters`,
  );
  return value.trim();
}
function quantity(value, max = 1_000_000) {
  check(
    Number.isSafeInteger(value) && value > 0 && value <= max,
    `Quantity must be a whole number from 1 to ${max}`,
  );
  return value;
}

class ViewManager {
  constructor(world) {
    this.world = world;
  }

  view(id) {
    const world = this.world;
    const r = world.nation(id),
      n = r.nation;
    const buildings = Object.fromEntries(
      Object.entries(world.categories).map(([category, [system, property]]) => [
        category,
        Object.fromEntries(
          Object.keys(r[system][property]).map((key) => [
            key,
            world.buildingMgr.buildingQuote(r, category, key),
          ]),
        ),
      ]),
    );
    const nations = [...world.rules.values()].map((other) => ({
      id: other.nation.id,
      name: other.nation.name,
      leader: other.nation.leader,
      factionKey: other.nation.factionKey,
      allianceId: other.nation.allianceId,
      acceptsMessages: other.player.settings.privacy.allowMessages,
      lastActive: other.player.settings.privacy.showOnline
        ? other.nation.lastActive || other.nation.founded
        : null,
      land: other.nation.land,
      population: other.player.settings.privacy.showStatistics
        ? other.nation.population
        : null,
      taxRevenue: other.player.settings.privacy.showStatistics
        ? other.nation.taxRevenue
        : null,
      money: other.player.settings.privacy.showStatistics
        ? other.nation.money
        : null,
      infra: other.player.settings.privacy.showStatistics
        ? other.nation.infra
        : null,
      tech: other.player.settings.privacy.showStatistics
        ? other.nation.tech
        : null,
      militaryStrength: other.player.settings.privacy.showStatistics
        ? other.nation.militaryStrength
        : null,
    }));
    const alliances = Object.values(world.state.alliances).map((a) => ({
      ...a,
      permissions: world.permissions(a, id),
      applications: world.hasPermission(a, id, "members")
        ? a.applications
        : a.applications.filter((member) => member === id),
      treasury: own(a.members, id) ? a.treasury : null,
      log: own(a.members, id) ? a.log : [],
    }));
    const messages = world.state.messages
      .filter(
        (m) =>
          m.channel === "world" ||
          (m.channel === "alliance" &&
            n.allianceId &&
            m.target === n.allianceId) ||
          (m.channel === "private" && (m.target === id || m.author === id)),
      )
      .slice(-200);
    const snapshot = r.snapshot();
    snapshot.nation.intelligence = intelligence(world, n);
    return {
      revision: world.state.revision,
      serverTime: world.clock(),
      day: world.state.day,
      nextTurnAt: world.state.startedAt + (world.state.day + 1) * HOUR,
      worldName: world.state.worldName,
      sports: world.sports.view(id),
      wrestling: world.wrestling.view(id),
      rankings: rankings.view(world, id),
      nation: snapshot.nation,
      player: snapshot.player,
      citizens: world.state.citizens?.[id] || [],
      nations,
      diplomacy: {
        relationships: Object.fromEntries(
          nations
            .filter((other) => other.id !== id)
            .map((other) => [
              other.id,
              Object.fromEntries(
                relationshipTypes.map((type) => [
                  type,
                  relationshipQuote(world, n, other.id, type),
                ]),
              ),
            ]),
        ),
        treaties: Object.fromEntries(
          nations
            .filter((other) => other.id !== id)
            .map((other) => [
              other.id,
              Object.fromEntries(
                Object.keys(world.base.treaties).map((type) => [
                  type,
                  treatyReasons(
                    world,
                    n,
                    world.nation(other.id).nation,
                    type,
                  ),
                ]),
              ),
            ]),
        ),
        partners: intelligencePartners(world, id),
        calls: warView(world, id),
        treatyAcceptance: Object.fromEntries(
          Object.values(world.state.treaties)
            .filter((t) => t.to === id && t.status === "pending")
            .map((t) => [
              t.id,
              treatyReasons(
                world,
                world.nation(t.from).nation,
                n,
                t.type,
                t.id,
              ),
            ]),
        ),
        combatBonuses: Object.fromEntries(
          Object.values(world.state.wars)
            .filter((w) => w.participants.includes(id))
            .map((w) => [w.id, combatBonus(world, n, w.participants)]),
        ),
      },
      buildings,
      territories: world.state.territories,
      electionVote: world.state.electionVotes[id],
      election: world.state.election,
      units: Object.fromEntries(
        Object.keys(world.unitUpkeep).map((type) => [type, world.buildingMgr.unitQuote(r, type)]),
      ),
      skills: Object.fromEntries(
        Object.keys(r.skillDefs).map((key) => [
          key,
          {
            value: r.player.getSkillDisplayValue(key),
            cost: r.player.skillUpgradeCost(key),
          },
        ]),
      ),
      research: Object.fromEntries(
        Object.keys(r.research).map((key) => [key, world.buildingMgr.researchQuote(r, key)]),
      ),
      development: {
        land: n.landCost(),
        infra: n.infraCost(),
        tech: n.techCost(),
      },
      upkeep: {
        money:
          n.calculateDailyMaintenanceCosts().money * n.motionModifiers.upkeep,
        resources: Object.fromEntries(
          Object.entries(n.calculateDailyMaintenanceCosts().resources || {}).map(
            ([k, v]) => [k, v * n.motionModifiers.upkeep],
          ),
        ),
      },
      alliances,
      canFoundAlliance: world.canFound(n),
      offers: Object.values(world.state.offers)
        .filter((o) => o.status === "open" || o.owner === id)
        .map((o) => ({
          ...o,
          acceptance:
            o.owner !== id && o.status === "open"
              ? world.actionQuote(id, "acceptOffer", { id: o.id })
              : null,
        })),
      aid: Object.values(world.state.aid).filter((a) =>
        [a.from, a.to].includes(id),
      ),
      treaties: Object.values(world.state.treaties).filter((t) =>
        [t.from, t.to].includes(id),
      ),
      wars: Object.values(world.state.wars).filter((w) =>
        w.participants.includes(id),
      ),
      motions: Object.values(world.state.motions).filter((m) =>
        m.scope === "world"
          ? world.forumAccess(n, "world")
          : world.forumAccess(n, "color") && m.faction === n.factionKey,
      ),
      congress: world.congress(),
      articles: Object.values(world.state.articles).sort(
        (a, b) => b.createdAt - a.createdAt,
      ),
      messages,
      worldBank: {
        inventory: Object.fromEntries(
          Object.entries(world.state.worldBank.inventory || {}).map(
            ([resource, amount]) => [resource, amount],
          ),
        ),
        prices: Object.fromEntries(
          world.catalog().resources.map((resource) => [
            resource,
            world.worldBankPrice(resource, null, n),
          ]),
        ),
        currencyRates: world.state.worldBank.currencyRates || {},
      },
      globalResources: world.state.globalResources || {},
      lottery: {
        pool: (world.state.lottery && world.state.lottery.pool) || 0,
        ticketsSold:
          world.state.lottery &&
          world.state.lottery.currentDrawing &&
          world.state.lottery.currentDrawing.status === "open"
            ? world.state.lottery.currentDrawing.ticketsSold || 0
            : 0,
        ticketCost: TICKET_COST,
        maxTicketsPerNation: MAX_TICKETS_PER_NATION,
        currentDrawing:
          world.state.lottery && world.state.lottery.currentDrawing
            ? world.state.lottery.currentDrawing
            : null,
        previousDrawings:
          world.state.lottery && world.state.lottery.drawings
            ? world.state.lottery.drawings.slice(-8).reverse()
            : [],
        unclaimedWinnings:
          world.state.lottery && world.state.lottery.unclaimed
            ? Object.values(world.state.lottery.unclaimed).filter(
                (u) => !u.claimed && Date.now() <= u.expiresAt,
              )
            : [],
      },
      globalWorld:         world.diseaseMgr.computeGlobalWorld(),
      notifications: this.getNotifications(id),
    };
  }

  getNotifications(nationId) {
    const world = this.world;
    const n = world.nation(nationId).nation;
    const notifications = [];

    // Active situations from nation rule state
    const nationSituations = n.nationSituations || [];
    const populationSituations = n.populationSituations || [];
    const militarySituations = n.militarySituations || [];
    const allSituations = [...nationSituations, ...populationSituations, ...militarySituations];
    for (const s of allSituations) {
      if (s.status === "pending") {
        notifications.push({
          id: s.id,
          type: "situation",
          situationType: s.type,
          definitionId: s.definitionId,
          title: s.definition?.title || "Situation",
          description: s.definition?.description || "",
          startedAt: s.startedAt,
        });
      }
    }

    // Pending peace offers (treaties where this nation is the target)
    const pendingPeace = Object.values(world.state.treaties || {}).filter(
      (t) => t.to === nationId && t.status === "pending" && t.type === "peace",
    );
    for (const t of pendingPeace) {
      notifications.push({
        id: `treaty_${t.id}`,
        type: "peace_offer",
        title: "Peace Terms Offered",
        description: `A peace treaty has been offered to end the conflict.`,
        startedAt: t.offeredAt || t.createdAt || Date.now(),
        treatyId: t.id,
      });
    }

    // Active wars
    const activeWars = Object.values(world.state.wars || {}).filter(
      (w) => w.participants.includes(nationId) && w.status === "active",
    );
    for (const w of activeWars) {
      notifications.push({
        id: `war_${w.id}`,
        type: "war_alert",
        title: "Active War",
        description: `Your nation is at war.`,
        startedAt: w.startedAt || Date.now(),
        warId: w.id,
      });
    }

    // Pending aid
    const pendingAid = Object.values(world.state.aid || []).filter(
      (a) => a.to === nationId && a.status === "pending",
    );
    for (const a of pendingAid) {
      notifications.push({
        id: `aid_${a.id}`,
        type: "aid_offer",
        title: "Foreign Aid Offered",
        description: `You have been offered foreign aid.`,
        startedAt: a.createdAt || Date.now(),
        aidId: a.id,
      });
    }

    return notifications.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
  }
}

module.exports = { ViewManager };
