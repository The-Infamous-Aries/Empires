"use strict";
const { demolitionReasons } = require("./world-diplomacy");
const { sideOf } = require("./world-war");

const HOUR = 3_600_000;
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

class BuildingManager {
  constructor(world) {
    this.world = world;
  }

  buildingQuote(r, category, key) {
    const world = this.world;
    world.check(world.own(world.categories, category), "Unknown building category");
    const [system, property] = world.categories[category];
    world.check(
      world.own(r[system][property], key),
      "Unknown building",
    );
    const n = r.nation,
      def = r[system][property][key],
      owned = n[category] ? n[category][key] || 0 : 0;
    const blocks = Math.floor(n.land / 100),
      capacity =
        category === "improvements"
          ? blocks
          : Math.floor(blocks / (category === "projects" ? 10 : 20));
    const used = Object.entries(n[category])
      .filter(([id]) => category !== "projects" || id !== "broadcasting")
      .reduce((s, [, v]) => s + v, 0);
    const cooldown =
      category === "improvements"
        ? 0
        : Math.max(
            0,
            (n.buildTimers?.[category] ?? n.foundedDay) +
              (category === "projects" ? 14 : 28) -
              world.state.day,
          );
    const cost = Object.fromEntries(
      Object.entries(def.cost).map(([k, v]) => [
        k,
        Math.ceil(v * (n.motionModifiers?.buildCost || 1)),
      ]),
    );
    const reasons = world.affordability(n, cost);
    if (owned >= def.maxCount) reasons.push("Maximum owned");
    if (used >= capacity && key !== "broadcasting")
      reasons.push("No available slots");
    if (cooldown) reasons.push(`Construction cooldown: ${cooldown} turns`);
    if ((n.effectiveTech ?? n.tech) < (def.techRequired || 0))
      reasons.push(`Technology ${def.techRequired} required`);
    if (def.requires && !(n.projects[def.requires] || n.wonders[def.requires]))
      reasons.push(`Requires ${def.requires}`);
    if (def.bonusRequirement && !n.bonusEffects[def.bonusRequirement])
      reasons.push(`Requires ${def.bonusRequirement} resource bonus`);
    const dependents = ["projects", "wonders"].flatMap((c) =>
      Object.entries(r[c][world.categories[c][1]])
        .filter(([id, d]) => n[c][id] > 0 && d.requires === key)
        .map(([, d]) => d.name),
    );
    const destroyReasons = owned
      ? def.permanent
        ? ["Permanent building"]
        : dependents.length && owned === 1
          ? [`Required by ${dependents.join(", ")}`]
          : []
      : ["None owned"];
    if (
      owned &&
      category === "wonders" &&
      key.endsWith("Stadium") &&
      world.sports.engine.getTeam(n.id, key.replace("Stadium", ""))
    )
      destroyReasons.push("This stadium is the home of your sports team");
    if (owned)
      destroyReasons.push(
        ...diplomacy.demolitionReasons(world, n, category, key, owned - 1),
      );
    if (
      owned &&
      category === "wonders" &&
      key === "great_library" &&
      n.activeResearch.length > 1
    )
      destroyReasons.push("Finish or cancel the second research project first");
    if (
      owned &&
      [
        "militaryAcademy",
        "spyOperations",
        "missileSilo",
        "nuclearWarheadFacility",
        "enhancedSilos",
        "enhancedSpyOps",
        "enhancedNuclearWarheads",
      ].includes(key)
    ) {
      const hypothetical = {
        ...n,
        [category]: { ...n[category], [key]: owned - 1 },
        projectEffects: { ...n.projectEffects },
      };
      if (key === "militaryAcademy" && owned === 1)
        for (const stat of [
          "maxSoldierPercent",
          "maxTankPercent",
          "maxAircraftPercent",
          "maxShipPercent",
        ])
          delete hypothetical.projectEffects[stat];
      const before = this.limits(r),
        after = this.limits({ ...r, nation: hypothetical });
      for (const type of Object.keys(after))
        if (after[type] < before[type] && n.militaryUnits[type] > after[type])
          destroyReasons.push(
            `Sell ${type} to ${after[type]} or fewer before removing this capacity`,
          );
    }
    if (owned && key === "commandCenter")
      for (const side of ["attacker", "defender"]) {
        const count = Object.values(world.state.wars).filter(
          (w) => w.status !== "ended" && sideOf(w, n.id) === side,
        ).length;
        if (count > 2 + owned - 1)
          destroyReasons.push(
            "Finish dependent wars before removing this command center",
          );
      }
    return {
      key,
      category,
      owned,
      capacity,
      used,
      available: Math.max(0, capacity - used),
      cooldown,
      cost,
      reasons,
      canBuild: reasons.length === 0,
      canDestroy: destroyReasons.length === 0,
      destroyReasons,
    };
  }

  limits(r) {
    const n = r.nation;
    n.wonders = n.wonders || {};
    const limits = r.projects.getMilitaryUnitLimits(n);
    limits.spies = Math.min(
      limits.spies,
      (n.projects.spyOperations || 0) * (n.wonders.enhancedSpyOps ? 15 : 10),
    );
    limits.missiles = Math.min(
      limits.missiles,
      (n.projects.missileSilo || 0) * (n.wonders.enhancedSilos ? 10 : 5),
    );
    limits.nukes = Math.min(
      limits.nukes,
      n.wonders.enhancedNuclearWarheads
        ? 5
        : n.wonders.nuclearWarheadFacility
          ? 3
          : 0,
    );
    if (n.motionModifiers?.militaryLimit)
      for (const key of Object.keys(limits))
        limits[key] = Math.floor(limits[key] * n.motionModifiers.militaryLimit);

    // Discipline skill: +2.5% per level to unit max caps (max 25% at level 10)
    const disciplineVal = r.player.getSkillValue("discipline");
    if (disciplineVal > 0) {
      for (const key of Object.keys(limits))
        limits[key] = Math.floor(limits[key] * (1 + disciplineVal));
    }

    return limits;
  }

  unitQuote(r, type, amount = 1) {
    quantity(amount);
    this.world.check(own(this.world.unitUpkeep, type), "Unknown unit");
    const n = r.nation,
      c = n.calculateMilitaryCost(type, amount);
    const discount = Math.min(0.2, r.player.getSkillValue("attack") / 3750);
    // Discipline also reduces purchase costs (stacks with Attack discount, capped at 0.2 total)
    const disciplineDiscount = Math.min(0.2, r.player.getSkillValue("discipline"));
    const totalDiscount = Math.min(0.2, discount + disciplineDiscount);
    const cost = {
      money: Math.max(
        amount,
        Math.floor(
          c.money * (1 - totalDiscount) * (n.bonusEffects.armsPile ? 0.8 : 1),
        ),
      ),
      ...c.resources,
    };
    const capacity = this.limits(r)[type],
      reasons = this.world.affordability(n, cost);
    if (n.militaryUnits[type] + amount > capacity)
      reasons.push(`Capacity ${capacity.toLocaleString()}`);
    if ((n.effectiveTech ?? n.tech) < c.techRequired)
      reasons.push(`Technology ${c.techRequired} required`);
    if (
      c.prerequisite &&
      !(n.projects[c.prerequisite] || n.wonders[c.prerequisite])
    )
      reasons.push(`Requires ${c.prerequisite}`);
    if (type === "nukes" && n.motionModifiers?.nuclearBan)
      reasons.push("World nuclear ban");
    const basis = n.recruitmentBasis?.[type] || 0;
    const refund = Math.floor(
      ((basis * Math.min(amount, n.militaryUnits[type])) /
        Math.max(1, n.militaryUnits[type])) *
        0.5,
    );
    return {
      moneyMultiplier: (1 - discount) * (n.bonusEffects.armsPile ? 0.8 : 1),
      type,
      owned: n.militaryUnits[type],
      capacity,
      cost,
      reasons,
      canBuy: !reasons.length,
      canSell: n.militaryUnits[type] >= amount,
      refund,
      ...c,
      cost,
    };
  }

  researchQuote(r, key) {
    this.world.check(own(r.research, key), "Unknown research");
    const n = r.nation,
      def = r.research[key],
      reasons = [];
    if (n.completedResearch.includes(key)) reasons.push("Completed");
    if (n.activeResearch.some((a) => a.key === key))
      reasons.push("In progress");
    if (n.activeResearch.length >= (n.wonders.great_library ? 2 : 1))
      reasons.push("No research slots");
    if ((n.effectiveTech ?? n.tech) < (def.requirements?.tech_level || 0))
      reasons.push(`Technology ${def.requirements.tech_level} required`);
    for (const required of def.requirements?.prerequisites || [])
      if (!n.completedResearch.includes(required))
        reasons.push(`Requires ${r.research[required]?.name || required}`);
    if (n.money < def.cost) reasons.push("Insufficient money");
    const government = r.governments[n.government],
      religion = r.religions[n.religion];
    const speed =
      (1 +
        (government.bonuses.technology || 0) +
        (religion.bonuses.technology || 0)) *
      (government.penalties?.technology || 1) *
      (1 +
        (n.wonders.great_library ? 0.25 : 0) +
        (n.projects.advancedUniversity ? 0.1 : 0) +
        (n.bonusEffects.books ? 0.25 : 0)) *
      (n.motionModifiers?.researchSpeed || 1) *
      (1 + n.researchModifiers.researchSpeed / 100);
    const reduction =
      (n.improvements.researchLab || 0) *
      (n.projects.advancedResearch === 5 ? 0.06 : 0.03);
    return {
      key,
      reasons,
      canStart: !reasons.length,
      duration: Math.max(
        1,
        Math.ceil(
          (def.time * HOUR * Math.max(0.1, 1 - reduction)) /
            Math.max(0.1, speed),
        ),
      ),
    };
  }

  develop(r, data, preview = false) {
    const world = this.world;
    const n = r.nation;
    const methods = {
      land: ["landCost", "buyLand"],
      infra: ["infraCost", "buyInfra"],
      tech: ["techCost", "buyTech"],
    };
    world.check(own(methods, data.kind), "Unknown development");
    const [cost, buy] = methods[data.kind];
    let total = 0;
    for (let i = 0; i < quantity(data.amount, 1000); i++) {
      const price = n[cost]();
      if (preview) n.money = Math.max(n.money, price);
      const before = n.money;
      world.check(n.money >= price, "Insufficient money");
      world.check(n[buy](), "Purchase failed");
      total += before - n.money;
      world.refresh(r);
    }
    return total;
  }

  setManufacturing(r, data) {
    const world = this.world;
    if (!r.resources?.manufacturingRecipes) {
      throw new Error("No manufacturing recipes defined");
    }
    world.check(
      world.own(r.resources.manufacturingRecipes, data.product) &&
        typeof data.enabled === "boolean",
      "Invalid production setting",
    );
    r.nation.manufacturing[data.product] = data.enabled;
  }

  manufacture(r, data) {
    const world = this.world;
    if (!r.resources?.manufacturingRecipes) {
      throw new Error("No manufacturing recipes defined");
    }
    world.check(
      world.own(r.resources.manufacturingRecipes, data.product),
      "Unknown recipe",
    );
    world.check(r.nation.improvements.assemblyPlant > 0, "Assembly Plant required");
    const recipe = r.resources.manufacturingRecipes[data.product],
      amount = quantity(data.amount, 10000),
      cost = Object.fromEntries(
        Object.entries(recipe.inputs).map(([k, v]) => [k, v * amount]),
      );
    world.check(!world.affordability(r.nation, cost).length, "Insufficient ingredients");
    world.pay(r.nation, cost);
    r.nation.resources[data.product] += recipe.output * amount;
  }
}

module.exports = { BuildingManager };
