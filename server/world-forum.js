"use strict";
const { randomUUID } = require("node:crypto");

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const own = (object, key) =>
  typeof key === "string" && Object.hasOwn(object, key);
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

class ForumManager {
  constructor(world) {
    this.world = world;
  }

  forumAction(r, action, d, preview = false) {
    const world = this.world;
    const n = r.nation,
      now = world.clock();
    if (action === "proposeMotion") {
      world.check(
        world.own(world.base.motionTypes, d.type) && /^(COLOR_|WORLD_)/.test(d.type),
        "Unknown motion",
      );
      const def = world.base.motionTypes[d.type];
      world.check(
        world.forumAccess(n, def.scope),
        def.scope === "world"
          ? "Broadcasting Network and Global Internet Network required"
          : "Broadcasting Network required",
      );
      if (def.scope === "world")
        world.check(
          world.congress()[n.factionKey].representatives.includes(n.id),
          "Only elected representatives can propose world motions",
        );
      world.check(
        Object.values(world.state.motions).filter(
          (m) => m.author === n.id && m.status.includes("voting"),
        ).length < 3,
        "Maximum three active proposals",
      );
      const params = world.forumMgr.motionParameters(d.type, d.parameters || {}),
        title = world.text(d.title, "Motion title", 120, 3),
        body = world.text(d.body, "Motion description", 5000, 10);
      if (preview) return;
      const id = randomUUID();
      world.state.motions[id] = {
        id,
        type: d.type,
        title,
        body,
        author: n.id,
        faction: n.factionKey,
        scope: def.scope,
        parameters: params,
        votes: {},
        status: "faction_voting",
        createdAt: now,
        endsAt: now + DAY,
        threshold: def.minSupport,
        effectEndsAt: null,
      };
      try {
        if (def.scope === "world") {
          world.xpGoalsSystem.awardProposeWorldMotion(1, {
            motionId: id,
            motionType: d.type,
          });
        } else if (def.scope === "color") {
          world.xpGoalsSystem.awardProposeColorMotion(1, {
            motionId: id,
            motionType: d.type,
          });
        }
      } catch(e) {
        console.error(`Forum: XP award failed for proposeMotion ${id}:`, e.message);
      }
    } else {
      const m = world.state.motions[d.id];
      world.check(
        m && m.status === "faction_voting" && now < m.endsAt,
        "Voting has ended",
      );
      world.check(
        world.forumAccess(n, m.scope),
        "Required forum project or wonder is missing",
      );
      world.check(
        now - n.factionJoinedAt >= DAY,
        "Faction membership must be at least 24 real hours",
      );
      world.check(
        m.scope === "world" || n.factionKey === m.faction,
        "This motion belongs to a different color forum",
      );
      world.check(["for", "against", "abstain"].includes(d.vote), "Invalid vote");
      world.check(!own(m.votes, n.id), "You already voted");
      m.votes[n.id] = { vote: d.vote, faction: n.factionKey, at: now };
      try {
        if (m.scope === "world") {
          world.xpGoalsSystem.awardVoteWorldMotion(1, {
            motionId: m.id,
            motionType: m.type,
            vote: d.vote,
          });
        } else if (m.scope === "color") {
          world.xpGoalsSystem.awardVoteColorMotion(1, {
            motionId: m.id,
            motionType: m.type,
            vote: d.vote,
          });
        }
      } catch(e) {
        console.error(`Forum: XP award failed for vote on motion ${m.id}:`, e.message);
      }
    }
  }

  motionParameters(type, input) {
    const world = this.world;
    world.check(
      input && typeof input === "object" && !Array.isArray(input),
      "Invalid motion parameters",
    );
    const def = world.base.motionTypes[type],
      result = {};
    const defaults = {
      duration: 7,
      resourceType: "all",
      boostPercentage: 10,
      damageReduction: 15,
      xpBoostPercentage: 20,
      energyCostIncrease: 25,
      energyBoostPercentage: 15,
      happinessPenalty: 10,
      militaryBoostPercentage: 12,
      resourceCostIncrease: 20,
      tradeBoostPercentage: 15,
      techBoostPercentage: 18,
      securityPenalty: 30,
      buildingCostReduction: 20,
      populationGrowthPenalty: 15,
      defensiveBonus: 25,
      moneyBoostPercentage: 25,
      inflationRate: 5,
      happinessBoost: 15,
      productivityPenalty: 8,
      tariffRates: 5,
      militaryLimit: 50,
      researchBonus: 15,
      productionPenalty: 10,
      pollutionReduction: 20,
      costPerNation: 1000,
      benefits: 1,
      timeMultiplier: 1,
      dayLength: 1,
      monthLength: 30,
      yearLength: 360,
      resetCalendar: false,
      penaltyType: "immediate_disarmament",
      tradeRestrictions: "none",
      projectType: "infrastructure",
      newWorldName: "Epochus",
      resourceTypes: "uranium",
      exemptFactions: "",
      exceptions: "",
      sharingPercentage: 10,
      restrictions: "none",
      unitTypeLimits: 50,
      exemptions: "",
      techThreshold: 1000,
      sharingRate: 15,
      pollutionLimits: 20,
      productionPenalties: 10,
    };
    for (const key of def.parameters || []) {
      const value = input[key] ?? defaults[key] ?? 10;
      if (["resourceType", "resourceTypes"].includes(key)) {
        const resources = String(value)
          .split(",")
          .map((s) => s.trim());
        world.check(
          resources.every(
            (v) => world.catalog().resources.includes(v) || v === "all",
          ),
          "Unknown resource",
        );
        result[key] = resources.join(",");
      } else if (["exemptFactions", "exceptions", "exemptions"].includes(key)) {
        const factions = String(value).split(",").filter(Boolean);
        world.check(
          factions.every((v) => own(world.base.colors, v)),
          "Unknown faction",
        );
        result[key] = factions.join(",");
      } else if (typeof defaults[key] === "string")
        result[key] = world.text(String(value), key, 80, 0);
      else if (typeof defaults[key] === "boolean") {
        world.check(typeof value === "boolean", `Invalid ${key}`);
        result[key] = value;
      } else {
        world.check(
          Number.isFinite(value) &&
            value >= 0 &&
            value <=
              (key === "costPerNation"
                ? 1_000_000
                : key === "techThreshold"
                  ? 10000
                  : key === "yearLength"
                    ? 360
                    : 100),
          `Invalid ${key}`,
        );
        result[key] = value;
      }
    }
    if (type === "WORLD_NAME_CHANGE")
      result.newWorldName = world.text(result.newWorldName, "World name", 80, 3);
    if (type === "WORLD_NUCLEAR_BAN")
      world.check(
        result.penaltyType === "immediate_disarmament",
        "Only immediate disarmament is supported",
      );
    if (type === "WORLD_TRADE_REGULATION")
      world.check(
        result.tradeRestrictions === "none",
        "Use a resource embargo motion for resource restrictions",
      );
    if (type === "WORLD_INFRASTRUCTURE_PROJECT")
      world.check(
        result.projectType === "infrastructure" && result.benefits >= 1,
        "Infrastructure projects must grant at least 1 infrastructure",
      );
    if ("duration" in result)
      world.check(
        result.duration >= 1 && result.duration <= 30,
        "Duration must be 1–30 real days",
      );
    if (type === "WORLD_CALENDAR_CHANGE")
      world.check(
        result.timeMultiplier === 1 &&
          result.dayLength === 1 &&
          result.monthLength === 30 &&
          result.yearLength === 360 &&
          result.resetCalendar === false,
        "The live clock is fixed: 1 hour per day, 30 days per month, 360 days per year",
      );
    return result;
  }

  applyMotionModifiers(r) {
    const world = this.world;
    const n = r.nation;
    const m = (n.motionModifiers = {
      production: 1,
      happiness: 0,
      population: 1,
      tax: 1,
      researchSpeed: 1,
      military: 1,
      defense: 1,
      buildCost: 1,
      energyCost: 1,
      energyRegen: 1,
      upkeep: 1,
      xp: 1,
      tariff: 0,
      embargo: [],
      nuclearBan: false,
      peace: false,
      pollutionLimit: Infinity,
    });
    for (const motion of Object.values(world.state.motions)) {
      if (motion.status !== "passed") continue;
      // effectEndsAt null means permanent; otherwise check expiry
      if (motion.effectEndsAt && motion.effectEndsAt <= world.state.lastProcessed)
        continue;
      if (motion.scope === "color" && motion.faction !== n.factionKey)
        continue;
      const p = motion.parameters,
        pct = (key) => (p[key] || 0) / 100;
      switch (motion.type) {
        // ══ COLOR BLOC MOTIONS ══
        case "COLOR_EXPERIENCE_SURGE":
          m.xp *= 1 + pct("xpBoostPercentage");
          m.energyCost *= 1 + pct("energyCostIncrease");
          break;
        case "COLOR_ENERGY_REGENERATION":
          m.energyRegen *= 1 + pct("energyBoostPercentage");
          m.happiness -= p.happinessPenalty || 0;
          break;
        case "COLOR_MILITARY_TRAINING":
          m.military *= 1 + pct("militaryBoostPercentage");
          m.upkeep *= 1 + pct("resourceCostIncrease");
          break;
        case "COLOR_TECH_SHARING":
          m.researchSpeed *= 1 + pct("techBoostPercentage");
          m.defense *= 1 - pct("securityPenalty");
          break;
        case "COLOR_INFRASTRUCTURE_PUSH":
          m.buildCost *= 1 - pct("buildingCostReduction");
          m.population *= 1 - pct("populationGrowthPenalty");
          break;
        case "COLOR_DEFENSIVE_PACT":
          m.defense *= 1 + pct("defensiveBonus");
          break;
        case "COLOR_ECONOMIC_STIMULUS":
          m.tax *= 1 + pct("moneyBoostPercentage");
          m.buildCost *= 1 + pct("inflationRate");
          break;
        case "COLOR_HAPPINESS_CAMPAIGN":
          m.happiness += p.happinessBoost || 0;
          m.production *= 1 - pct("productivityPenalty");
          break;
        case "COLOR_ADVANCED_HEALTHCARE":
          m.happiness += p.happinessBoost || 0;
          break;
        case "COLOR_GREEN_GOALS":
          m.pollutionLimit = Math.min(
            m.pollutionLimit,
            p.pollutionReduction || 100,
          );
          break;
        case "COLOR_CHILD_LABOR":
          m.happiness -= p.happinessPenalty || 0;
          break;
        case "COLOR_NEW_BUILD_OBJECTIVE":
          m.buildCost *= 1 - pct("buildingCostReduction") || 1;
          break;
        case "COLOR_RESTORATION_ACT":
          m.buildCost *= 1 + pct("buildingCostReduction") || 1;
          break;
        // ══ WORLD MOTIONS ══
        case "ANTI_NUCLEAR_MANDATE":
          m.nuclearBan = true;
          break;
        case "WORLD_TRADE_REGULATION":
          m.tariff += pct("tariffRates");
          break;
        case "WORLD_RESOURCE_EMBARGO":
          if (!(p.exemptFactions || "").split(",").includes(n.factionKey))
            m.embargo.push(
              ...(p.resourceTypes === "all"
                ? world.catalog().resources
                : p.resourceTypes.split(",")),
            );
          break;
        case "WORLD_MILITARY_LIMITATION":
          if (!(p.exemptions || "").split(",").includes(n.factionKey))
            m.militaryLimit = 1 - p.unitTypeLimits / 100;
          break;
        case "WORLD_TECHNOLOGY_SHARING":
          m.techSharing = { threshold: p.techThreshold, rate: p.sharingRate };
          break;
        case "WORLD_ENVIRONMENTAL_PROTECTION":
          m.pollutionLimit = Math.min(
            m.pollutionLimit,
            p.pollutionReduction || Infinity,
          );
          m.production *= 1 - p.productionPenalty / 100;
          break;
        case "WORLD_PEACE_TREATY":
          if (!(p.exceptions || "").split(",").includes(n.factionKey))
            m.peace = true;
          break;
      }
    }
    m.tariff = Math.max(0, m.tariff);
    m.buildCost = Math.max(0.1, m.buildCost);
    m.production = Math.max(0, m.production);
    m.defense = Math.max(0.1, m.defense);
    if (m.pollutionLimit === Infinity) delete m.pollutionLimit;
  }

  defaultMotionTypes() {
    const types = {};
    const add = (key, def) => {
      types[key] = def;
    };
    const world = (key, def) =>
      add(key, {
        ...def,
        scope: "world",
        requiresWonder: "internet",
        canPropose: ["congress_only"],
      });
    const color = (key, def) =>
      add(key, {
        ...def,
        scope: "color",
        requiresProject: "broadcasting",
        canPropose: ["faction_members"],
      });
    // ══ COLOR BLOC ══
    color("COLOR_EXPERIENCE_SURGE", {
      name: "Experience Surge Initiative",
      description: "Boost XP gain for faction members with energy cost increase",
      minSupport: 0.45,
    });
    color("COLOR_ENERGY_REGENERATION", {
      name: "Enhanced Energy Recovery",
      description: "Increase energy regeneration for faction members with happiness penalty",
      minSupport: 0.4,
    });
    color("COLOR_MILITARY_TRAINING", {
      name: "Military Training Program",
      description: "Enhanced military effectiveness with military upkeep increase",
      minSupport: 0.55,
    });
    color("COLOR_TECH_SHARING", {
      name: "Technology Sharing Initiative",
      description: "Accelerated research points for faction members",
      minSupport: 0.6,
    });
    color("COLOR_INFRASTRUCTURE_PUSH", {
      name: "Infrastructure Development Push",
      description: "Building cost reduction with population growth penalty",
      minSupport: 0.5,
    });
    color("COLOR_DEFENSIVE_PACT", {
      name: "Faction Defense Alliance",
      description: "Enhanced defensive bonuses when attacked by external factions",
      minSupport: 0.65,
    });
    color("COLOR_ECONOMIC_STIMULUS", {
      name: "Economic Stimulus Package",
      description: "Currency generation boost with inflation effects",
      minSupport: 0.55,
    });
    color("COLOR_HAPPINESS_CAMPAIGN", {
      name: "Morale Boosting Campaign",
      description: "Happiness increase with productivity slight decrease",
      minSupport: 0.4,
    });
    color("COLOR_ADVANCED_HEALTHCARE", {
      name: "Advanced Faction Healthcare",
      description: "Raise happiness, lower disease, lower taxable income for faction members",
      minSupport: 0.55,
    });
    color("COLOR_GREEN_GOALS", {
      name: "Faction Green Goals",
      description: "Raise environment, lower pollution, lower taxable income",
      minSupport: 0.55,
    });
    color("COLOR_CHILD_LABOR", {
      name: "Faction Child Labor Act",
      description: "Allow children to work/taxed at full rate, lower happiness",
      minSupport: 0.5,
    });
    color("COLOR_NEW_BUILD_OBJECTIVE", {
      name: "Faction New Build Objective",
      description: "Lower land/infra purchase cost, raise upkeep",
      minSupport: 0.55,
    });
    color("COLOR_RESTORATION_ACT", {
      name: "Faction Restoration Act",
      description: "Lower land/infra upkeep, raise purchase cost",
      minSupport: 0.55,
    });
    // ══ WORLD ══
    world("WORLD_CALENDAR_CHANGE", {
      name: "World Calendar Modification",
      description: "Alter the world calendar system",
      minSupport: 0.65,
      neutral: true,
    });
    world("WORLD_NAME_CHANGE", {
      name: "World Rename Proposal",
      description: "Change the official name of the game world",
      minSupport: 0.6,
      neutral: true,
    });
    world("WORLD_MILITARY_LIMITATION", {
      name: "Military Size Restrictions",
      description: "Limit maximum military unit counts globally",
      minSupport: 0.75,
    });
    world("WORLD_TECHNOLOGY_SHARING", {
      name: "Mandatory Technology Sharing",
      description: "Force sharing of research points above thresholds",
      minSupport: 0.8,
    });
    world("WORLD_ENVIRONMENTAL_PROTECTION", {
      name: "Environmental Protection Act",
      description: "Limit pollution-causing activities with production penalties",
      minSupport: 0.65,
    });
    world("WORLD_PEACE_TREATY", {
      name: "Global Peace Enforcement",
      description: "Temporary ban on all military conflicts",
      minSupport: 0.85,
    });
    world("ANTI_NUCLEAR_MANDATE", {
      name: "Anti-Nuclear Mandate",
      description: "Ban nuclear weapon production for 30 days",
      minSupport: 0.7,
      isNuclearBan: true,
      banType: "production",
    });
    world("ANTI_NUCLEAR_LAUNCH_BAN", {
      name: "Anti-Nuclear Launch Ban",
      description: "Ban nuclear weapon launching for 30 days",
      minSupport: 0.7,
      isNuclearBan: true,
      banType: "launch",
    });
    world("ANTI_MISSILE_MANDATE", {
      name: "Anti-Missile Mandate",
      description: "Ban missile production for 30 days",
      minSupport: 0.65,
      isMissileBan: true,
      banType: "production",
    });
    world("ANTI_MISSILE_LAUNCH_BAN", {
      name: "Anti-Missile Launch Ban",
      description: "Ban missile launching for 30 days",
      minSupport: 0.65,
      isMissileBan: true,
      banType: "launch",
    });
    world("FACTION_SANCTION", {
      name: "Faction Sanctions",
      description: "Impose sanctions on a faction",
      minSupport: 0.65,
      isSanction: true,
      sanctionBlocks: ["attack", "aid", "diplomacy", "color_interaction"],
      duration: "30 days",
    });
    world("WORLD_TAX", {
      name: "World Tax",
      description: "Implement a global tax rate for world projects",
      minSupport: 0.7,
      fixedEffects: { worldTaxRate: 0.05, purpose: "infrastructure" },
      duration: "90 days",
    });
    world("HEAVY_MISSILE_OBJECTIVE", {
      name: "Heavy Missile Objective",
      description: "Increase infrastructure destroyed by missiles by 15% for 30 days",
      minSupport: 0.6,
      isMissileObjective: true,
      fixedEffects: { missileInfraDamageBoost: 15 },
    });
    world("ADVANCED_GLOBAL_HEALTHCARE", {
      name: "Advanced Global Healthcare",
      description: "Raise happiness, lower disease, lower taxable income",
      minSupport: 0.65,
      fixedEffects: { happinessBoost: 15, diseaseRateReduction: 10, taxableIncomePenalty: 10 },
    });
    world("GREEN_GOALS", {
      name: "Green Goals",
      description: "Raise environment, lower pollution, lower taxable income",
      minSupport: 0.65,
      fixedEffects: { environmentBoost: 10, pollutionReduction: 30, taxableIncomePenalty: 10 },
    });
    world("CHILD_LABOR", {
      name: "Child Labor Act",
      description: "Allow children to work at full rate, lower happiness by 50",
      minSupport: 0.55,
      fixedEffects: { childLaborEnabled: true, happinessPenalty: 50 },
    });
    world("NEW_BUILD_OBJECTIVE", {
      name: "New Build Objective",
      description: "Lower land/infra purchase cost, raise upkeep for 30 days",
      minSupport: 0.6,
      fixedEffects: { landPurchaseDiscount: 15, infraPurchaseDiscount: 15, landUpkeepIncrease: 10, infraUpkeepIncrease: 10 },
    });
    world("RESTORATION_ACT", {
      name: "Restoration Act",
      description: "Lower land/infra upkeep, raise purchase cost for 30 days",
      minSupport: 0.6,
      fixedEffects: { landUpkeepDiscount: 15, infraUpkeepDiscount: 15, landPurchaseIncrease: 10, infraPurchaseIncrease: 10 },
    });
    // ══ WORLD BANK ══
    world("WORLD_INTEREST_RATE_ADJUST", {
      name: "World Bank Interest Rate Adjustment",
      description: "Adjust the World Bank loan interest rate globally.",
      minSupport: 0.6,
      parameters: ["newRate"],
    });
    world("WORLD_LOAN_LIMIT_ADJUST", {
      name: "World Bank Loan Limit Adjustment",
      description: "Adjust the maximum loan multiplier relative to annual tax revenue.",
      minSupport: 0.6,
      parameters: ["newLimitMultiplier"],
    });
    world("WORLD_LOTTERY_FUNDING_BOOST", {
      name: "Lottery Funding Boost",
      description: "Increase World Bank contributions to the National Pet Lottery pool.",
      minSupport: 0.55,
      parameters: ["boostPct"],
    });
    // ══ WORLD FORUM ══
    world("FREE_SPEECH_PROTECTION", {
      name: "Free Speech Protection",
      description: "Disable forum moderation for 30 days",
      minSupport: 0.6,
      isWorldForumMotion: true,
      fixedEffects: { forumModerationDisabled: true },
    });
    world("CONGRESSIONAL_TERM_LIMITS", {
      name: "Congressional Term Limits",
      description: "Limit motions per faction per day",
      minSupport: 0.55,
      isWorldForumMotion: true,
      fixedEffects: { maxMotionsPerFactionPerDay: 3 },
    });
    world("SUPERMAJORITY_REQUIREMENT", {
      name: "Supermajority Requirement",
      description: "Change vote threshold to 66% for sanctions",
      minSupport: 0.6,
      isWorldForumMotion: true,
      fixedEffects: { sanctionVoteThreshold: 0.66 },
    });
    return types;
  }
}

module.exports = { ForumManager };
