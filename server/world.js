"use strict";
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { createRules, clone } = require("./rules");
const agreements = require("./trade");
const diplomacy = require("./diplomacy");
const research = require("./research");
const warDiplomacy = require("./war-diplomacy");
const { Sports } = require("./sports");
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
function quantity(value, max = 1_000_000) {
  check(
    Number.isSafeInteger(value) && value > 0 && value <= max,
    `Quantity must be a whole number from 1 to ${max}`,
  );
  return value;
}
const sum = (object) => Object.values(object).reduce((a, b) => a + b, 0);
const categories = {
  improvements: ["improvements", "improvementTypes"],
  projects: ["projects", "projectTypes"],
  wonders: ["wonders", "wonderTypes"],
};
const unitUpkeep = {
  soldiers: { group: 100, money: 1, food: 1 },
  tanks: { group: 10, money: 15, steel: 1 },
  aircraft: { group: 1, money: 50, aluminum: 3 },
  ships: { group: 1, money: 150, steel: 5 },
  spies: { group: 1, money: 500, ammo: 5, food: 5 },
  missiles: { group: 1, money: 1000, ammo: 5, gas: 5 },
  nukes: { group: 1, money: 5000, ammo: 50, uranium: 50 },
};

class World {
  constructor({
    file = path.join(__dirname, "../saves/world.json"),
    now = Date.now,
  } = {}) {
    this.file = file;
    this.clock = now;
    this.rules = new Map();
    this.base = createRules();
    research.validate(this.base.research);
    const saved =
      file && fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file, "utf8"))
        : null;
    this.restore(
      saved || {
        version: 1,
        startedAt: now(),
        lastProcessed: now(),
        day: 0,
        revision: 0,
        accounts: {},
        nations: {},
        alliances: {},
        offers: {},
        treaties: {},
        motions: {},
        articles: {},
        messages: [],
        wars: {},
        worldName: "Dominion Wars",
        receipts: {},
      },
    );
    this.advance(now());
  }
  restore(state) {
    check(state.version === 1, "Unsupported world save version");
    this.state = state;
    this.state.territories ||= {};
    this.state.electionVotes ||= {};
    this.state.aid ||= {};
    this.state.tradeAgreements ||= {};
    for (const treaty of Object.values(state.treaties)) {
      if (
        treaty.status === "active" &&
        treaty.type === "peace" &&
        !treaty.endsAt
      )
        treaty.endsAt = (treaty.acceptedAt || treaty.createdAt) + 30 * DAY;
    }
    this.state.election ||= {
      opensAt: state.startedAt + 30 * HOUR,
      endsAt: state.startedAt + 30 * HOUR + DAY,
      status: "scheduled",
      representatives: {},
    };
    this.rules.clear();
    for (const [id, saved] of Object.entries(state.nations))
      this.rules.set(id, createRules(state.day, saved));
    for (const w of Object.values(state.wars)) warDiplomacy.ensure(w);
    for (const r of this.rules.values()) this.refresh(r, state.lastProcessed);
    this.sports = new Sports(this, state.sports);
  }
  snapshot() {
    return clone({
      ...this.state,
      sports: this.sports.snapshot(),
      nations: Object.fromEntries(
        [...this.rules].map(([id, r]) => [id, r.snapshot()]),
      ),
    });
  }
  save() {
    if (!this.file) return;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    const fd = fs.openSync(tmp, "w", 0o600);
    try {
      fs.writeFileSync(fd, JSON.stringify(this.snapshot()));
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(tmp, this.file);
  }
  transact(fn) {
    const previous = this.snapshot();
    try {
      const result = fn();
      this.state.revision++;
      this.save();
      return result;
    } catch (error) {
      this.restore(previous);
      throw error;
    }
  }
  nation(id) {
    const r = this.rules.get(id);
    check(r, "Nation not found");
    return r;
  }
  register(username, passwordHash, nationData) {
    username = text(username, "Username", 32, 3);
    check(
      /^[a-zA-Z0-9_-]+$/.test(username),
      "Username may contain letters, numbers, _ and -",
    );
    check(
      !Object.values(this.state.accounts).some(
        (a) => a.username.toLowerCase() === username.toLowerCase(),
      ),
      "Username is already registered",
    );
    const name = text(nationData.name, "Nation name", 60, 3);
    check(
      ![...this.rules.values()].some(
        (r) => r.nation.name.toLowerCase() === name.toLowerCase(),
      ),
      "Nation name is already registered",
    );
    check(own(this.base.colors, nationData.factionKey), "Choose a faction");
    check(
      this.base.resources.basicResources.has(nationData.primaryResource),
      "Choose a primary resource",
    );
    check(
      own(this.base.governments, nationData.government),
      "Choose a government",
    );
    check(own(this.base.religions, nationData.religion), "Choose a religion");
    return this.transact(() => {
      const id = randomUUID();
      const r = createRules(this.state.day);
      r.player.initialize({ username, playerId: id });
      r.nation.initialize({
        id,
        playerId: id,
        name,
        leader: username,
        government: nationData.government,
        religion: nationData.religion,
        factionKey: nationData.factionKey,
      });
      r.nation.founded = this.clock();
      r.nation.foundedDay = this.state.day;
      r.nation.primaryResource = nationData.primaryResource;
      r.nation.buildTimers = {
        projects: this.state.day,
        wonders: this.state.day,
      };
      r.nation.factionJoinedAt = this.clock();
      r.nation.recruitmentBasis = {};
      r.nation.activeResearch = [];
      r.nation.completedResearch = [];
      r.nation.researchEffects = {};
      r.nation.relationships = {};
      r.nation.manufacturing = {};
      r.player.factionKey = nationData.factionKey;
      r.player.factionJoinDate = this.clock();
      this.rules.set(id, r);
      this.state.accounts[id] = { id, username, passwordHash };
      this.refresh(r);
      return id;
    });
  }
  catalog() {
    const r = this.base;
    return clone({
      buildings: {
        improvements: r.improvements.improvementTypes,
        projects: r.projects.projectTypes,
        wonders: r.wonders.wonderTypes,
      },
      governments: r.governments,
      religions: r.religions,
      colors: r.colors,
      resources: [
        ...r.resources.basicResources,
        ...r.resources.manufacturedResources,
      ],
      recipes: r.resources.manufacturingRecipes,
      bonuses: r.resources.bonusRequirements,
      research: Object.fromEntries(
        Object.entries(r.research).map(([id, def]) => [
          id,
          { ...def, appliedEffects: research.describe(def) },
        ]),
      ),
      researchStats: research.definitions,
      sports: this.sports.catalog(),
      skills: r.skillDefs,
      allianceTemplates: r.allianceTemplates,
      treatyTypes: r.treaties,
      motionTypes: Object.fromEntries(
        Object.entries(r.motionTypes).filter(
          ([key]) => key.startsWith("COLOR_") || key.startsWith("WORLD_"),
        ),
      ),
      unitUpkeep,
      policies: Object.fromEntries(
        [
          "immigration",
          "nuclearResearch",
          "education",
          "healthcare",
          "environment",
          "taxation",
          "military",
          "trade",
          "surveillance",
          "research",
        ].map((p) => [p, r.improvements.getPolicyStances(p)]),
      ),
    });
  }
  refresh(r, at = this.processingAt ?? this.clock()) {
    const n = r.nation;
    research.rebuild(r);
    diplomacy.syncRelations(n);
    n.sharedTechnology = diplomacy.sharedTechnology(this, n);
    n.effectiveTech = n.tech + n.sharedTechnology;
    n.improvementEffects = {};
    n.projectEffects = {};
    n.wonderEffects = {};
    n.policyEffects = {};
    // Rebuild from ownership so demolished capabilities cannot survive in stale flags.
    for (const key of Object.keys(r.projects.projectTypes))
      if (n.projects[key] > 0) r.projects.applyProjectEffects(n, key);
    for (const key of Object.keys(r.wonders.wonderTypes))
      if (n.wonders[key] > 0) r.wonders.applyWonderEffects(n, key);
    for (const key of Object.keys(r.improvements.improvementTypes))
      if (n.improvements[key] > 0)
        r.improvements.applyImprovementEffects(n, key);
    if (n.improvements.internalAffairsOffice)
      r.improvements.applyPolicyEffects(n);
    r.resources.calculateBonusEffects();
    this.applyMotionModifiers(r);
    n.nationStats.happiness = 50;
    n.nationStats.environment = 50;
    n.nationStats.populationEfficiency = 1;
    n.calculatePopulation();
    const re = n.researchModifiers;
    const p = n.projectEffects,
      w = n.wonderEffects,
      i = n.improvementEffects;
    n.calculateLiteracy();
    n.calculatePollution();
    n.nationStats.pollution = Math.max(
      0,
      n.nationStats.pollution - (i.treePollutionReduction || 0),
    );
    if (n.motionModifiers.pollutionLimit !== undefined)
      n.nationStats.pollution = Math.min(
        n.nationStats.pollution,
        n.motionModifiers.pollutionLimit,
      );
    n.calculateEnvironment();
    n.nationStats.environment = Math.max(
      0,
      Math.min(
        100,
        n.nationStats.environment +
          (i.environmentBonus || 0) * 100 +
          (i.treeEnvironmentBonus || 0) +
          (i.recyclingEnvironmentBonus || 0),
      ),
    );
    n.calculateDisease();
    n.nationStats.disease *= Math.max(0, 1 - re.diseaseResistance / 100);
    n.nationStats.health = Math.min(100, 75 + re.health);
    n.nationStats.disease *= 75 / n.nationStats.health;
    // Seed happiness at 50 on every refresh, then resolve its feedback with crime deterministically.
    const gov = r.governments[n.government],
      rel = r.religions[n.religion];
    for (let pass = 0; pass < 12; pass++) {
      n.calculateCrime();
      n.nationStats.crime =
        Math.max(
          0,
          n.nationStats.crime - (p.enhancedPoliceCrimeReduction || 0) * 100,
        ) *
        (1 - re.crimeReduction / 100);
      n.calculateHappiness();
      // Apply named happiness effects used by the building catalogs.
      let h =
        n.nationStats.happiness +
        re.happiness +
        (n.bonusEffects.basicNeeds ? 2 : 0) -
        (n.diplomaticPenalties || [])
          .filter((e) => e.endsAt > at)
          .reduce((sum, e) => sum + e.happiness, 0) +
        (p.universityHappinessBonus || 0) +
        (p.ambulanceHappinessBonus || 0) +
        (p.swatHappinessBonus || 0) +
        (p.enhancedPoliceHappinessBonus || 0) +
        (i.happinessFromParks || 0) +
        (i.treeHappinessBonus || 0) -
        (i.happinessDecrease || 0) +
        (w.universalHealthcareHappinessBonus || 0) -
        (i.recyclingHappinessPenalty || 0) -
        (w.supremeMilitaryHappinessPenalty || 0);
      if (!(n.resources.food > 0 || w.foodIndependence)) h -= 5;
      if (!(n.resources.water > 0 || w.waterIndependence)) h -= 5;
      h -= (n.temporaryEffects || [])
        .filter((e) => e.type === "happinessReduction")
        .reduce((v, e) => v + e.amount, 0);
      h += (n.temporaryEffects || [])
        .filter((e) => e.type === "happinessBonus")
        .reduce((v, e) => v + e.amount, 0);
      h *=
        (1 + (gov.bonuses.happiness || 0) + (rel.bonuses.happiness || 0)) *
        (gov.penalties?.happiness || 1) *
        (rel.penalties?.happiness || 1);
      n.nationStats.happiness = Math.min(
        100,
        Math.max(0, h + n.motionModifiers.happiness),
      );
    }
    n.happiness = n.nationStats.happiness;
    n.calculateDerivedEffects();
    // DEVELOPMENT_CHECKLIST: disease and crime reduce productive population.
    n.nationStats.populationEfficiency = Math.max(
      0.5,
      Math.min(
        1.5,
        1 -
          (n.nationStats.disease / 100) * 0.5 -
          (n.nationStats.crime / 100) * 0.3 +
          Math.max(0, (n.happiness - 70) * 0.01),
      ),
    );
    const growth = Math.max(
      0,
      1 +
        (gov.bonuses.populationGrowth || 0) +
        (rel.bonuses.populationGrowth || 0) +
        (n.policyEffects.populationGrowth || 0),
    );
    n.calculatePopulation();
    n.population = Math.floor(
      n.population *
        growth *
        (1 + re.growth / 100) *
        n.motionModifiers.population,
    );
    n.calculateEconomy();
    n.taxableIncome = Math.floor(
      n.taxableIncome *
        (1 + (i.taxableIncomeBonus || 0) + (p.sportsBettingTaxBonus || 0)) *
        (1 + re.income / 100),
    );
    n.gdp = n.taxableIncome;
    n.taxRevenue = Math.floor(
      ((n.taxableIncome * n.taxRate) / 100) * n.nationStats.taxEfficiency,
    );
    n.stability = Math.min(
      100,
      100 *
        (1 +
          (gov.bonuses.stability || 0) +
          (rel.bonuses.stability || 0) +
          (n.policyEffects.culturalStability || 0)) *
        (gov.penalties?.stability || 1),
    );
    n.reputation = Math.min(
      100,
      Math.max(
        0,
        50 *
          (1 +
            (gov.bonuses.reputation || 0) +
            (n.policyEffects.internationalReputation || 0) +
            (n.policyEffects.diplomaticReputation || 0)) *
          (gov.penalties?.reputation || 1),
      ),
    );
    n.taxRevenue = Math.floor(
      n.taxRevenue *
        (1 + re.taxEfficiency / 100) *
        (1 + re.taxIncome / 100) *
        (1 + (gov.bonuses.gdp || 0)) *
        (gov.penalties?.gdp || 1) *
        (1 + (n.policyEffects.taxEfficiency || 0)) *
        n.motionModifiers.tax,
    );
    n.researchIncome = re.flatIncome;
    n.budget.income = n.taxRevenue + n.researchIncome;
    n.militaryBudget = n.calculateDailyMaintenanceCosts().money;
    n.budget.expenses = n.militaryBudget;
    n.budget.balance = n.budget.income - n.militaryBudget;
    n.updateMilitaryStrength();
    n.combatMultiplier =
      (1 +
        (gov.bonuses.militaryStrength || 0) +
        (n.policyEffects.militaryStrength || 0)) *
      (gov.penalties?.militaryStrength || 1) *
      (n.bonusEffects.armsPile ? 1.3 : 1) *
      (1 + re.attack / 100);
    n.militaryStrength = Math.floor(n.militaryStrength * n.combatMultiplier);
    n.nationStats.militaryMorale = Math.min(
      2,
      Math.max(
        0.5,
        (1 +
          (n.happiness - 50) * 0.01 +
          n.nationStats.literacy * 0.005 -
          n.nationStats.crime * 0.002 -
          n.nationStats.disease * 0.003) *
          (1 + (rel.bonuses.militaryMorale || 0)) *
          (1 + re.morale / 100) *
          (gov.penalties?.militaryMorale || 1),
      ),
    );
    n.conventionalAttack = Math.floor(
      r.combat.calculateBaseDamage(n, r.player) *
        n.combatMultiplier *
        n.motionModifiers.military *
        (n.militaryMaintenanceDeficit ? 0.5 : 1),
    );
    n.tradeEfficiency =
      re.tradeEfficiency + (n.bonusEffects.automobiles ? 20 : 0);
    n.motionModifiers.tariff /= 1 + n.tradeEfficiency / 100;
    n.motionModifiers.upkeep *= 1 - re.upkeepReduction / 100;
    n.militaryBudget =
      n.calculateDailyMaintenanceCosts().money * n.motionModifiers.upkeep;
    n.budget.expenses = n.militaryBudget;
    n.budget.balance = n.budget.income - n.militaryBudget;
    research.reschedule(this, r, at);
  }
  affordability(n, cost) {
    return Object.entries(cost)
      .filter(
        ([key, value]) =>
          (key === "money" ? n.money : n.resources[key] || 0) + 1e-9 < value,
      )
      .map(([key, value]) => `Need ${value.toLocaleString()} ${key}`);
  }
  pay(n, cost, factor = 1) {
    for (const [key, amount] of Object.entries(cost)) {
      if (key === "money") n.money -= amount * factor;
      else n.resources[key] = (n.resources[key] || 0) - amount * factor;
    }
  }
  removeUnits(n, type, amount) {
    if (!amount) return;
    check(amount <= n.militaryUnits[type], "Not enough units");
    n.recruitmentBasis ||= {};
    n.recruitmentBasis[type] =
      (n.recruitmentBasis[type] || 0) * (1 - amount / n.militaryUnits[type]);
    n.militaryUnits[type] -= amount;
  }
  buildingQuote(r, category, key) {
    check(own(categories, category), "Unknown building category");
    const [system, property] = categories[category];
    check(own(r[system][property], key), "Unknown building");
    const n = r.nation,
      def = r[system][property][key],
      owned = n[category][key] || 0;
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
              this.state.day,
          );
    const cost = Object.fromEntries(
      Object.entries(def.cost).map(([k, v]) => [
        k,
        Math.ceil(v * (n.motionModifiers?.buildCost || 1)),
      ]),
    );
    const reasons = this.affordability(n, cost);
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
      Object.entries(r[c][categories[c][1]])
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
      category === "improvements" &&
      key === "port" &&
      agreements.partners(this, n.id).size > owned - 1
    )
      destroyReasons.push("Cancel a trade agreement to free this port");
    if (
      owned &&
      category === "projects" &&
      key === "tradeHub" &&
      Object.values(this.state.tradeAgreements).some(
        (a) =>
          a.from === n.id &&
          !a.duration &&
          ["pending", "active"].includes(a.status),
      )
    )
      destroyReasons.push("Cancel permanent trade agreements first");
    if (
      owned &&
      category === "wonders" &&
      key.endsWith("Stadium") &&
      this.sports.engine.getTeam(n.id, key.replace("Stadium", ""))
    )
      destroyReasons.push("This stadium is the home of your sports team");
    if (owned)
      destroyReasons.push(
        ...diplomacy.demolitionReasons(this, n, category, key, owned - 1),
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
        const count = Object.values(this.state.wars).filter(
          (w) => w.status !== "ended" && warDiplomacy.sideOf(w, n.id) === side,
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
    const n = r.nation,
      limits = r.projects.getMilitaryUnitLimits(n);
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
    return limits;
  }
  unitQuote(r, type, amount = 1) {
    quantity(amount);
    check(own(unitUpkeep, type), "Unknown unit");
    const n = r.nation,
      c = n.calculateMilitaryCost(type, amount);
    const discount = Math.min(0.2, r.player.getSkillValue("attack") / 5000);
    const cost = {
      money: Math.max(
        amount,
        Math.floor(
          c.money * (1 - discount) * (n.bonusEffects.armsPile ? 0.8 : 1),
        ),
      ),
      ...c.resources,
    };
    const capacity = this.limits(r)[type],
      reasons = this.affordability(n, cost);
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
    check(own(r.research, key), "Unknown research");
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
    const policyResearch =
      (n.policyEffects.researchBonus || 0) +
      (def.category === "war"
        ? n.policyEffects.militaryResearch || 0
        : n.policyEffects.civilianResearch || 0);
    const government = r.governments[n.government],
      religion = r.religions[n.religion];
    const speed =
      (1 +
        (government.bonuses.technology || 0) +
        (religion.bonuses.technology || 0) +
        policyResearch) *
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
  command(id, action, data = {}, requestId) {
    this.advance(this.clock());
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
    if (own(this.state.receipts, receiptKey)) return;
    return this.transact(() => {
      const r = this.nation(id),
        n = r.nation;
      const previousXP = r.player.totalExperience;
      const xpMultiplier = n.motionModifiers?.xp || 1;
      this.runAction(r, action, data);
      const earnedXP = r.player.totalExperience - previousXP;
      if (earnedXP > 0 && xpMultiplier > 1)
        r.player._awardExperience(
          Math.floor(earnedXP * (xpMultiplier - 1)),
          "Forum XP bonus",
        );
      for (const rule of this.rules.values()) this.refresh(rule);
      this.state.receipts[receiptKey] = this.clock();
      const receipts = Object.entries(this.state.receipts).sort(
        (a, b) => a[1] - b[1],
      );
      for (const [key] of receipts.slice(
        0,
        Math.max(0, receipts.length - 5000),
      ))
        delete this.state.receipts[key];
      n.lastActive = this.clock();
    });
  }
  runAction(r, action, data) {
    const n = r.nation,
      id = n.id,
      now = this.clock();
    switch (action) {
      case "build":
      case "demolish": {
        const { category, key } = data,
          q = this.buildingQuote(r, category, key),
          def = r[category][categories[category][1]][key];
        check(
          action === "build" ? q.canBuild : q.canDestroy,
          (action === "build" ? q.reasons : q.destroyReasons).join("; "),
        );
        if (action === "build") {
          this.pay(n, q.cost);
          n[category][key] = q.owned + 1;
          n.buildingBasis ||= {};
          n.buildingBasis[category] ||= {};
          n.buildingBasis[category][key] ||= [];
          n.buildingBasis[category][key].push(clone(q.cost));
          if (category !== "improvements")
            n.buildTimers[category] = this.state.day;
          r.player._onBuildingConstructed();
        } else {
          const rate = n.projects.salvageYard
            ? { improvements: 0.15, projects: 0.1, wonders: 0.05 }[category] *
              (n.wonders.enhancedSalvage ? 2 : 1)
            : 0;
          const paid = n.buildingBasis?.[category]?.[key]?.pop() || def.cost;
          this.pay(
            n,
            Object.fromEntries(
              Object.entries(paid).map(([k, v]) => [k, Math.floor(v * rate)]),
            ),
            -1,
          );
          n[category][key]--;
          if (category === "projects") n.buildTimers.projects = this.state.day;
        }
        break;
      }
      case "buyUnit":
      case "sellUnit": {
        const amount = quantity(data.amount),
          q = this.unitQuote(r, data.type, amount),
          type = data.type;
        n.recruitmentBasis ||= {};
        if (action === "buyUnit") {
          check(q.canBuy, q.reasons.join("; "));
          this.pay(n, q.cost);
          n.militaryUnits[type] += amount;
          n.recruitmentBasis[type] =
            (n.recruitmentBasis[type] || 0) + q.cost.money;
          if (q.populationImpact)
            n.applyTemporaryPopulationReduction(q.populationImpact);
          if (q.happinessImpact)
            n.applyTemporaryHappinessReduction(q.happinessImpact);
          r.player._awardExperience(amount * 8, "Military training");
        } else {
          check(q.canSell, "Not enough units");
          this.removeUnits(n, type, amount);
          n.money += q.refund;
        }
        break;
      }
      case "develop": {
        const methods = {
          land: ["landCost", "buyLand"],
          infra: ["infraCost", "buyInfra"],
          tech: ["techCost", "buyTech"],
        };
        check(own(methods, data.kind), "Unknown development");
        const [cost, buy] = methods[data.kind];
        for (let i = 0; i < quantity(data.amount, 100); i++) {
          check(n.money >= n[cost](), "Insufficient money");
          check(n[buy](), "Purchase failed");
          this.refresh(r);
        }
        break;
      }
      case "elect": {
        check(
          this.state.election.status === "voting" &&
            this.clock() < this.state.election.endsAt,
          "Congress elections are not open",
        );
        check(
          n.projects.broadcasting && this.clock() - n.factionJoinedAt >= DAY,
          "Broadcasting and 24-hour membership required",
        );
        const targets = data.targets || [data.target],
          faction = this.congress()[n.factionKey];
        check(
          Array.isArray(targets) &&
            targets.length > 0 &&
            targets.length <= faction.seats &&
            new Set(targets).size === targets.length,
          "Select distinct candidates up to your faction seat count",
        );
        check(
          targets.every((id) => faction.eligible.includes(id)),
          "Candidate is not eligible for your faction",
        );
        this.state.electionVotes[n.id] = targets;
        break;
      }
      case "claim": {
        const { x, y } = data;
        check(
          Number.isInteger(x) &&
            Number.isInteger(y) &&
            Math.abs(x) <= 25 &&
            Math.abs(y) <= 25,
          "Invalid coordinates",
        );
        const key = `${x},${y}`;
        check(
          !own(this.state.territories, key),
          "Territory is already claimed",
        );
        check(
          n.territories.length < n.mapBlocks,
          "Buy another land block first",
        );
        check(
          !n.territories.length ||
            [
              [x - 1, y],
              [x + 1, y],
              [x, y - 1],
              [x, y + 1],
            ].some(([a, b]) => this.state.territories[`${a},${b}`] === id),
          "New territory must touch your nation",
        );
        this.state.territories[key] = id;
        n.territories.push(key);
        r.player._onTerritoryClaimed();
        break;
      }
      case "identity":
        n.capitalCity = text(data.capital, "Capital", 60);
        n.motto = text(data.motto, "Motto", 160, 0);
        break;
      case "government":
      case "religion": {
        const key = text(data.value, "Selection"),
          catalog = action === "government" ? r.governments : r.religions;
        check(own(catalog, key), "Unknown selection");
        const statue =
            action === "government" ? "governmentStatue" : "religiousStatue",
          monument =
            action === "government"
              ? "governmentMonument"
              : "religiousMonument";
        check(
          !n.projects[statue] || n.wonders[monument],
          "This selection is permanently locked by its statue",
        );
        const last = n[`${action}ChangedDay`];
        check(
          !n.wonders[monument] ||
            last === undefined ||
            this.state.day - last >= 14,
          "Changes require a 14-turn cooldown",
        );
        check(
          n[action] !== key ||
            n.demandTimer?.[
              `isDemanding${action[0].toUpperCase() + action.slice(1)}`
            ],
          "Already selected",
        );
        n[action] = key;
        n[`${action}ChangedDay`] = this.state.day;
        if (n.demandTimer) {
          n.demandTimer[`${action}DaysRemaining`] = 30;
          n.demandTimer[
            `isDemanding${action[0].toUpperCase() + action.slice(1)}`
          ] = false;
        }
        break;
      }
      case "policy": {
        check(
          n.improvements.internalAffairsOffice,
          "Internal Affairs Office required",
        );
        check(
          r.improvements.getPolicyStances(data.policy).includes(data.value),
          "Invalid policy stance",
        );
        n.domesticPolicies[data.policy] = data.value;
        break;
      }
      case "manufacturing":
        check(
          own(r.resources.manufacturingRecipes, data.product) &&
            typeof data.enabled === "boolean",
          "Invalid production setting",
        );
        n.manufacturing[data.product] = data.enabled;
        break;
      case "manufacture": {
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
        check(!this.affordability(n, cost).length, "Insufficient ingredients");
        this.pay(n, cost);
        n.resources[data.product] += recipe.output * amount;
        break;
      }
      case "startResearch": {
        const q = this.researchQuote(r, data.key);
        check(q.canStart, q.reasons.join("; "));
        n.money -= r.research[data.key].cost;
        n.activeResearch.push({
          key: data.key,
          startedAt: now,
          endsAt: now + q.duration,
          paid: r.research[data.key].cost,
          totalWork: r.research[data.key].time * HOUR,
          remainingWork: r.research[data.key].time * HOUR,
          updatedAt: now,
          rate: (r.research[data.key].time * HOUR) / q.duration,
        });
        break;
      }
      case "cancelResearch": {
        const index = n.activeResearch.findIndex((a) => a.key === data.key);
        check(index >= 0, "Research is not active");
        n.money += Math.floor(n.activeResearch[index].paid * 0.5);
        n.activeResearch.splice(index, 1);
        break;
      }
      case "skill":
        check(own(r.skillDefs, data.key), "Unknown skill");
        check(
          r.player.allocateSkillPoint(data.key),
          "Not enough skill points or skill already at maximum",
        );
        break;
      case "legendary":
        check(r.player.goLegendary(), "Level 100 required");
        break;
      case "legendarySkill":
        check(own(r.skillDefs, data.key), "Unknown skill");
        check(r.player.allocateLegendaryPoint(data.key), "No legendary points");
        break;
      case "teamCreate":
      case "teamUpgrade":
      case "teamStarter":
      case "teamRelease":
      case "teamSign":
      case "teamTournament":
      case "teamRegister":
      case "teamBet":
        this.sports.action(id, action, data);
        break;
      case "tradePropose":
      case "tradeRespond":
      case "tradeCancel":
        agreements.action(this, r, action, data);
        break;
      case "offer":
      case "acceptOffer":
      case "cancelOffer":
        this.trade(r, action, data);
        break;
      case "allianceCreate":
      case "allianceApply":
      case "allianceReview":
      case "allianceSettings":
      case "allianceRole":
      case "allianceLeave":
      case "allianceKick":
      case "allianceTransfer":
      case "allianceDeposit":
      case "allianceWithdraw":
        this.allianceAction(r, action, data);
        break;
      case "proposeMotion":
      case "vote":
        this.forumAction(r, action, data);
        break;
      case "article": {
        check(
          Object.values(this.state.articles).filter(
            (a) => a.author === id && a.createdAt > now - HOUR,
          ).length < 10,
          "Limit: 10 articles per hour",
        );
        const articleId = randomUUID();
        this.state.articles[articleId] = {
          id: articleId,
          author: id,
          title: text(data.title, "Headline", 120, 3),
          body: text(data.body, "Article", 20000, 10),
          category: text(data.category, "Category", 30),
          createdAt: now,
          comments: [],
          reactions: {},
        };
        break;
      }
      case "editArticle":
      case "deleteArticle":
      case "comment":
      case "react": {
        const a = this.state.articles[data.id];
        check(a, "Article not found");
        if (action === "editArticle" || action === "deleteArticle")
          check(
            a.author === id,
            "Only the author can edit or delete this article",
          );
        if (action === "deleteArticle") delete this.state.articles[data.id];
        if (action === "editArticle") {
          a.title = text(data.title, "Headline", 120, 3);
          a.body = text(data.body, "Article", 20000, 10);
          a.editedAt = now;
        }
        if (action === "comment") {
          check(a.comments.length < 500, "Comment limit reached");
          a.comments.push({
            id: randomUUID(),
            author: id,
            body: text(data.body, "Comment", 2000),
            createdAt: now,
          });
        }
        if (action === "react") {
          if (a.reactions[id]) delete a.reactions[id];
          else a.reactions[id] = "like";
        }
        break;
      }
      case "message": {
        check(
          ["world", "alliance", "private"].includes(data.channel),
          "Invalid channel",
        );
        if (data.channel === "alliance")
          check(n.allianceId, "Join an alliance first");
        if (data.channel === "private") {
          const target = this.nation(data.target);
          check(
            target.player.settings.privacy.allowMessages,
            "Recipient does not accept private messages",
          );
        }
        this.state.messages.push({
          id: randomUUID(),
          author: id,
          body: text(data.body, "Message", 2000),
          channel: data.channel,
          target:
            data.channel === "alliance"
              ? n.allianceId
              : data.channel === "private"
                ? data.target
                : null,
          createdAt: now,
        });
        this.state.messages = this.state.messages.slice(-2000);
        break;
      }
      case "settings": {
        const { group, key, value } = data;
        check(
          ["notifications", "privacy"].includes(group) &&
            own(r.player.settings[group], key) &&
            typeof value === "boolean",
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
        this.diplomacyAction(r, action, data);
        break;
      case "warRespond":
        warDiplomacy.respond(this, id, data);
        break;
      case "declareWar":
      case "attack":
      case "peace":
        this.warAction(r, action, data);
        break;
      default:
        throw new Error("Unknown action");
    }
  }
  trade(r, action, d) {
    const n = r.nation;
    if (action === "offer") {
      check(["buy", "sell"].includes(d.side), "Choose buy or sell");
      check(this.catalog().resources.includes(d.resource), "Unknown resource");
      const amount = quantity(d.amount),
        price = quantity(d.price, 1_000_000_000);
      check(Number.isSafeInteger(amount * price), "Offer value is too large");
      check(
        !n.motionModifiers.embargo.includes(d.resource),
        "Resource is under a world embargo",
      );
      check(
        n.projects.tradeHub ||
          Object.values(this.state.offers).filter((o) => o.owner === n.id)
            .length < 100,
        "Maximum 100 offers without a Trade Hub",
      );
      const cost =
        d.side === "buy" ? { money: amount * price } : { [d.resource]: amount };
      check(
        !this.affordability(n, cost).length,
        "Insufficient funds or resources for escrow",
      );
      this.pay(n, cost);
      const id = randomUUID();
      this.state.offers[id] = {
        id,
        owner: n.id,
        side: d.side,
        resource: d.resource,
        amount,
        price,
        status: "open",
        createdAt: this.clock(),
      };
    } else {
      const offer = this.state.offers[d.id];
      check(offer && offer.status === "open", "Offer is no longer open");
      if (action === "cancelOffer") {
        check(offer.owner === n.id, "Only the owner can cancel");
        offer.status = "returning";
        offer.returnDay = this.state.day + 12;
        return;
      }
      check(offer.owner !== n.id, "Cannot accept your own offer");
      const maker = this.nation(offer.owner).nation;
      check(
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
      check(
        !this.affordability(n, cost).length,
        "Insufficient funds or resources",
      );
      this.pay(n, cost);
      if (offer.side === "sell") {
        n.resources[offer.resource] += offer.amount;
        maker.money += offer.amount * offer.price;
      } else {
        n.money += offer.amount * offer.price;
        maker.resources[offer.resource] += offer.amount;
      }
      delete this.state.offers[offer.id];
      r.player._onTradeCompleted();
      this.nation(maker.id).player._onTradeCompleted();
    }
  }
  permissions(alliance, id) {
    const role = alliance?.members[id];
    return (
      this.base.allianceTemplates[alliance?.government]?.roles.find(
        (r) => r.id === role,
      )?.permissions || []
    );
  }
  hasPermission(alliance, id, permission) {
    const p = this.permissions(alliance, id);
    return p.includes("all") || p.includes(permission);
  }
  canFound(n) {
    if (n.allianceId) return false;
    if (n.wonders.allianceHeadquarters) return true;
    const best = Object.keys(n.relationships).find(
      (id) => n.relationships[id] === "bestFriend",
    );
    const pact = (a, b, types) =>
      Object.values(this.state.treaties).some(
        (t) =>
          t.status === "active" &&
          types.includes(t.type) &&
          [t.from, t.to].includes(a) &&
          [t.from, t.to].includes(b),
      );
    const friends = Object.keys(n.relationships).filter(
      (id) =>
        n.relationships[id] === "friend" &&
        pact(n.id, id, ["mutualDefense", "mutualAggression"]),
    );
    return (
      !!best &&
      friends.length >= 5 &&
      friends.every((id) =>
        pact(best, id, ["mutualDefense", "mutualAggression", "protectorate"]),
      )
    );
  }
  allianceAction(r, action, d) {
    const n = r.nation,
      id = n.id;
    if (action === "allianceCreate") {
      check(
        this.canFound(n),
        "Alliance Headquarters or the diplomatic founding conditions required",
      );
      check(
        ["democratic", "trio", "autocratic"].includes(d.government),
        "Choose an alliance government",
      );
      const name = text(d.name, "Alliance name", 60, 3);
      check(
        !Object.values(this.state.alliances).some(
          (a) => a.name.toLowerCase() === name.toLowerCase(),
        ),
        "Alliance name already exists",
      );
      const aid = randomUUID(),
        template = this.base.allianceTemplates[d.government];
      this.state.alliances[aid] = {
        id: aid,
        name,
        description: text(d.description || "", "Description", 2000, 0),
        government: d.government,
        founder: id,
        members: { [id]: template.roles[0].id },
        applications: [],
        treasury: 0,
        open: true,
        createdAt: this.clock(),
        log: [],
      };
      n.allianceId = aid;
      r.player._onAllianceFormed();
      return;
    }
    if (action === "allianceApply") {
      check(!n.allianceId, "Already in an alliance");
      const a = this.state.alliances[d.id];
      check(a?.open, "Alliance is not recruiting");
      check(!a.applications.includes(id), "Application already pending");
      a.applications.push(id);
      return;
    }
    const a = this.state.alliances[n.allianceId];
    check(a && own(a.members, id), "Join an alliance first");
    const permitted = (permission) =>
      check(
        this.hasPermission(a, id, permission),
        "Your alliance role cannot perform this action",
      );
    const roles = this.base.allianceTemplates[a.government].roles;
    switch (action) {
      case "allianceReview": {
        permitted("members");
        check(a.applications.includes(d.target), "No pending application");
        if (d.accept === true) {
          const other = this.nation(d.target).nation;
          check(!other.allianceId, "Applicant already joined an alliance");
          check(
            Object.keys(a.members).length < 6,
            "Alliance is full (6 members)",
          );
          a.members[other.id] = roles.at(-1).id;
          other.allianceId = a.id;
        }
        a.applications = a.applications.filter((x) => x !== d.target);
        break;
      }
      case "allianceSettings":
        permitted("domestic");
        a.description = text(d.description, "Description", 2000, 0);
        check(typeof d.open === "boolean", "Invalid recruitment setting");
        a.open = d.open;
        break;
      case "allianceRole": {
        permitted("all");
        check(own(a.members, d.target), "Member not found");
        check(
          d.target !== a.founder,
          "Transfer leadership to change the founder role",
        );
        const role = roles.find((role) => role.id === d.role);
        check(role, "Unknown role");
        const count = Object.values(a.members).filter(
          (value) => value === role.id,
        ).length;
        check(count < (role.unique ? 1 : role.maxCount || 999), "Role is full");
        a.members[d.target] = role.id;
        break;
      }
      case "allianceTransfer": {
        check(a.founder === id, "Only the founder can transfer leadership");
        check(
          d.target !== id && own(a.members, d.target),
          "Choose another member",
        );
        a.members[d.target] = roles[0].id;
        a.members[id] = roles.at(-1).id;
        a.founder = d.target;
        break;
      }
      case "allianceKick":
        permitted("members");
        check(
          own(a.members, d.target) &&
            d.target !== a.founder &&
            !this.hasPermission(a, d.target, "all"),
          "Cannot remove this member",
        );
        delete a.members[d.target];
        this.nation(d.target).nation.allianceId = null;
        break;
      case "allianceLeave":
        check(
          a.founder !== id || Object.keys(a.members).length === 1,
          "Transfer leadership before leaving",
        );
        if (Object.keys(a.members).length === 1) {
          n.money += a.treasury;
          delete this.state.alliances[a.id];
        } else delete a.members[id];
        n.allianceId = null;
        break;
      case "allianceDeposit": {
        const amount = quantity(d.amount, 1_000_000_000);
        check(n.money >= amount, "Insufficient money");
        n.money -= amount;
        a.treasury += amount;
        break;
      }
      case "allianceWithdraw": {
        permitted("resources");
        const amount = quantity(d.amount, 1_000_000_000);
        check(a.treasury >= amount, "Insufficient alliance funds");
        a.treasury -= amount;
        n.money += amount;
        break;
      }
    }
    a.log.push({ actor: id, action, at: this.clock() });
    a.log = a.log.slice(-100);
  }
  congress(at = this.clock()) {
    const factions = {};
    for (const key of Object.keys(this.base.colors)) {
      const nations = [...this.rules.values()]
        .map((r) => r.nation)
        .filter((n) => n.factionKey === key);
      const eligible = nations.filter(
        (n) => n.projects.broadcasting && at - n.factionJoinedAt >= DAY,
      );
      const totalEligible = [...this.rules.values()].filter(
        (r) => r.nation.projects.broadcasting,
      ).length;
      const broadcasting = nations.filter(
        (n) => n.projects.broadcasting,
      ).length;
      const seats = broadcasting
        ? 1 + Math.floor((broadcasting / Math.max(1, totalEligible)) * 20)
        : 0;
      const representatives = (this.state.election.representatives[key] || [])
        .filter((id) => eligible.some((n) => n.id === id))
        .slice(0, seats);
      factions[key] = {
        seats,
        representatives,
        eligible: eligible.map((n) => n.id),
        members: nations.length,
      };
    }
    return factions;
  }
  forumAccess(n, scope) {
    return scope === "world"
      ? !!(n.projects.broadcasting && n.wonders.internet)
      : !!n.projects.broadcasting;
  }
  forumAction(r, action, d) {
    const n = r.nation,
      now = this.clock();
    if (action === "proposeMotion") {
      check(
        own(this.base.motionTypes, d.type) && /^(COLOR_|WORLD_)/.test(d.type),
        "Unknown motion",
      );
      const def = this.base.motionTypes[d.type];
      check(
        this.forumAccess(n, def.scope),
        def.scope === "world"
          ? "Broadcasting Network and Global Internet Network required"
          : "Broadcasting Network required",
      );
      if (def.scope === "world")
        check(
          this.congress()[n.factionKey].representatives.includes(n.id),
          "Only elected representatives can propose world motions",
        );
      check(
        Object.values(this.state.motions).filter(
          (m) => m.author === n.id && m.status.includes("voting"),
        ).length < 3,
        "Maximum three active proposals",
      );
      const params = this.motionParameters(d.type, d.parameters || {}),
        id = randomUUID();
      this.state.motions[id] = {
        id,
        type: d.type,
        title: text(d.title, "Motion title", 120, 3),
        body: text(d.body, "Motion description", 5000, 10),
        author: n.id,
        faction: n.factionKey,
        scope: def.scope,
        parameters: params,
        votes: {},
        status: "faction_voting",
        createdAt: now,
        endsAt: now + DAY,
        threshold: def.minSupport,
      };
    } else {
      const m = this.state.motions[d.id];
      check(
        m && m.status === "faction_voting" && now < m.endsAt,
        "Voting has ended",
      );
      check(
        this.forumAccess(n, m.scope),
        "Required forum project or wonder is missing",
      );
      check(
        now - n.factionJoinedAt >= DAY,
        "Faction membership must be at least 24 real hours",
      );
      check(
        m.scope === "world" || n.factionKey === m.faction,
        "This motion belongs to a different color forum",
      );
      check(["for", "against", "abstain"].includes(d.vote), "Invalid vote");
      check(!own(m.votes, n.id), "You already voted");
      m.votes[n.id] = { vote: d.vote, faction: n.factionKey, at: now };
    }
  }
  motionParameters(type, input) {
    check(
      input && typeof input === "object" && !Array.isArray(input),
      "Invalid motion parameters",
    );
    const def = this.base.motionTypes[type],
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
      newWorldName: "Dominion Wars",
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
        check(
          resources.every(
            (v) => this.catalog().resources.includes(v) || v === "all",
          ),
          "Unknown resource",
        );
        result[key] = resources.join(",");
      } else if (["exemptFactions", "exceptions", "exemptions"].includes(key)) {
        const factions = String(value).split(",").filter(Boolean);
        check(
          factions.every((v) => own(this.base.colors, v)),
          "Unknown faction",
        );
        result[key] = factions.join(",");
      } else if (typeof defaults[key] === "string")
        result[key] = text(String(value), key, 80, 0);
      else if (typeof defaults[key] === "boolean") {
        check(typeof value === "boolean", `Invalid ${key}`);
        result[key] = value;
      } else {
        check(
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
      result.newWorldName = text(result.newWorldName, "World name", 80, 3);
    if (type === "WORLD_NUCLEAR_BAN")
      check(
        result.penaltyType === "immediate_disarmament",
        "Only immediate disarmament is supported",
      );
    if (type === "WORLD_TRADE_REGULATION")
      check(
        result.tradeRestrictions === "none",
        "Use a resource embargo motion for resource restrictions",
      );
    if (type === "WORLD_INFRASTRUCTURE_PROJECT")
      check(
        result.projectType === "infrastructure" && result.benefits >= 1,
        "Infrastructure projects must grant at least 1 infrastructure",
      );
    if ("duration" in result)
      check(
        result.duration >= 1 && result.duration <= 30,
        "Duration must be 1–30 real days",
      );
    if (type === "WORLD_CALENDAR_CHANGE")
      check(
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
    });
    for (const motion of Object.values(this.state.motions)) {
      if (
        motion.status !== "passed" ||
        motion.effectEndsAt <= this.state.lastProcessed ||
        (motion.scope === "color" && motion.faction !== n.factionKey)
      )
        continue;
      const p = motion.parameters,
        pct = (key) => (p[key] || 0) / 100;
      switch (motion.type) {
        case "COLOR_RESOURCE_BOOST":
          m.resourceBoosts ||= {};
          m.resourceBoosts[p.resourceType] =
            (m.resourceBoosts[p.resourceType] || 1) *
            (1 + pct("boostPercentage"));
          m.damageTaken = (m.damageTaken || 1) * (1 - pct("damageReduction"));
          break;
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
        case "COLOR_TRADE_NETWORK":
          m.tariff -= pct("tradeBoostPercentage");
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
        case "WORLD_NUCLEAR_BAN":
          m.nuclearBan = true;
          break;
        case "WORLD_TRADE_REGULATION":
          m.tariff += pct("tariffRates");
          break;
        case "WORLD_RESOURCE_EMBARGO":
          if (!(p.exemptFactions || "").split(",").includes(n.factionKey))
            m.embargo.push(
              ...(p.resourceTypes === "all"
                ? this.catalog().resources
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
            m.pollutionLimit ?? Infinity,
            p.pollutionLimits,
          );
          m.production *= 1 - p.productionPenalties / 100;
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
  }
  diplomacyAction(r, action, d) {
    const n = r.nation;
    if (action === "aidRespond") {
      const aid = this.state.aid[d.id];
      check(
        aid &&
          aid.to === n.id &&
          aid.status === "pending" &&
          aid.endsAt > this.clock(),
        "No pending aid proposal",
      );
      if (d.accept === true) {
        if (aid.type === "money") n.money += aid.amount;
        else n.tech += aid.amount;
        aid.status = "accepted";
        aid.endsAt = this.clock() + 3 * DAY;
      } else {
        aid.status = "returning";
        aid.endsAt = this.clock() + DAY;
      }
      return;
    }
    check(
      n.improvements.foreignAffairsOffice,
      "Foreign Affairs Office required",
    );
    if (action === "treatyRespond" || action === "treatyCancel") {
      const t = this.state.treaties[d.id];
      check(t && [t.from, t.to].includes(n.id), "Treaty not found");
      if (action === "treatyRespond") {
        check(
          t.to === n.id && t.status === "pending" && t.expiresAt > this.clock(),
          "Only the recipient can respond to a pending treaty",
        );
        if (d.accept === true) {
          const def = this.base.treaties[t.type];
          const reasons = diplomacy.treatyReasons(
            this,
            this.nation(t.from).nation,
            n,
            t.type,
            t.id,
          );
          check(!reasons.length, reasons.join("; "));
          check(
            (n.improvements.embassy || 0) >= (def.requiresEmbassies || 0),
            `${def.requiresEmbassies} embassies required`,
          );
          t.acceptedAt = this.clock();
          t.endsAt =
            t.type === "peace" ? t.acceptedAt + (t.duration || 30) * DAY : null;
          r.player._onTreatySigned();
          this.nation(t.from).player._onTreatySigned();
        }
        t.status = d.accept === true ? "active" : "rejected";
      } else {
        check(
          t.status === "active" || t.status === "pending",
          "Treaty is not active",
        );
        check(
          t.status !== "active" || !this.base.treaties[t.type].cannotBreakEarly,
          "Peace pacts cannot be cancelled before expiry",
        );
        t.status = "cancelled";
      }
      return;
    }
    const other = this.nation(d.target).nation;
    check(other.id !== n.id, "Choose another nation");
    if (action === "relationship") {
      const quote = diplomacy.relationshipQuote(
        this,
        n,
        other.id,
        d.relationship,
      );
      check(quote.canSet, quote.reasons.join("; "));
      if (d.relationship === "neutral") delete n.relationships[other.id];
      else n.relationships[other.id] = d.relationship;
    } else if (action === "aid") {
      check(
        n.projects.financialAssistanceOffice,
        "Financial Assistance Office required",
      );
      check(
        Object.values(this.state.aid).filter(
          (a) =>
            a.from === n.id &&
            ["pending", "accepted", "returning"].includes(a.status),
        ).length < 3,
        "All 3 aid slots are occupied",
      );
      const type = d.type || "money";
      check(["money", "tech"].includes(type), "Unknown aid type");
      const amount =
        type === "money"
          ? quantity(d.amount, 1_000_000_000)
          : Math.floor(n.tech * 0.2);
      check(amount > 0, "No technology to share");
      if (type === "money") {
        check(n.money >= amount, "Insufficient money");
        n.money -= amount;
      }
      const aidId = randomUUID();
      this.state.aid[aidId] = {
        id: aidId,
        from: n.id,
        to: other.id,
        type,
        amount,
        status: "pending",
        endsAt: this.clock() + 7 * DAY,
      };
    } else {
      check(own(this.base.treaties, d.type), "Unknown treaty");
      const def = this.base.treaties[d.type];
      check(
        (n.improvements.embassy || 0) >= (def.requiresEmbassies || 0),
        `${def.requiresEmbassies} embassies required`,
      );
      const reasons = diplomacy.treatyReasons(this, n, other, d.type);
      check(!reasons.length, reasons.join("; "));
      const compensation = d.compensation === undefined ? 0 : d.compensation;
      check(
        Number.isSafeInteger(compensation) &&
          compensation >= 0 &&
          compensation <= 1e9,
        "Invalid compensation",
      );
      const duration =
        d.type === "peace" ? quantity(d.duration ?? 30, 30) : null;
      const id = randomUUID();
      this.state.treaties[id] = {
        duration,
        id,
        from: n.id,
        to: other.id,
        type: d.type,
        status: "pending",
        compensation,
        createdAt: this.clock(),
        expiresAt: this.clock() + 7 * DAY,
      };
    }
  }
  warAction(r, action, d) {
    const n = r.nation,
      now = this.clock();
    if (action === "declareWar") {
      const target = this.nation(d.target).nation;
      check(target.id !== n.id, "Choose another nation");
      check(
        !n.motionModifiers.peace && !target.motionModifiers.peace,
        "World peace enforcement is active",
      );
      check(
        !n.allianceId || target.allianceId !== n.allianceId,
        "Cannot attack an ally",
      );
      check(
        !Object.values(this.state.treaties).some(
          (t) =>
            t.status === "active" &&
            t.type === "peace" &&
            [t.from, t.to].includes(n.id) &&
            [t.from, t.to].includes(target.id),
        ),
        "A peace treaty prevents this war",
      );
      const active = Object.values(this.state.wars).filter(
        (w) => w.status !== "ended",
      );
      check(
        !active.some(
          (w) =>
            w.participants.includes(n.id) && w.participants.includes(target.id),
        ),
        "Already at war",
      );
      check(
        active.filter((w) => warDiplomacy.sideOf(w, n.id) === "attacker")
          .length <
          2 + (n.projects.commandCenter || 0),
        "No offensive war slots",
      );
      check(
        active.filter((w) => warDiplomacy.sideOf(w, target.id) === "defender")
          .length <
          2 + (target.projects.commandCenter || 0),
        "Target has no defensive slots",
      );
      const id = randomUUID();
      this.state.wars[id] = {
        id,
        attacker: n.id,
        defender: target.id,
        participants: [n.id, target.id],
        reason: text(d.reason || "Territorial dispute", "Reason", 300),
        status: "preparing",
        round: 0,
        wins: { [n.id]: 0, [target.id]: 0 },
        damage: { [n.id]: 0, [target.id]: 0 },
        endsAt: now + 15 * 60_000,
        log: [],
        peace: [],
      };
      warDiplomacy.invite(this, this.state.wars[id]);
      return;
    }
    const w = this.state.wars[d.id];
    check(
      w && w.participants.includes(n.id) && w.status !== "ended",
      "War not found",
    );
    warDiplomacy.ensure(w);
    if (action === "peace") {
      check(
        [w.attacker, w.defender].includes(n.id),
        "Only the principal nations can negotiate white peace",
      );
      if (!w.peace.includes(n.id)) w.peace.push(n.id);
      if (w.peace.length === 2) {
        w.status = "ended";
        w.result = "White peace";
        warDiplomacy.process(this, now);
      }
      return;
    }
    check(w.status === "active", "War is still preparing");
    const opponents = warDiplomacy.opposing(w, n.id);
    const targetId = d.target || opponents[0];
    check(opponents.includes(targetId), "Choose a nation on the opposing side");
    const target = this.nation(targetId),
      t = target.nation;
    check(
      !n.motionModifiers.peace && !t.motionModifiers.peace,
      "World peace enforcement is active",
    );
    const type = d.type || "conventional";
    check(
      ["conventional", "missiles", "nukes", "spies"].includes(type),
      "Invalid attack",
    );
    const cost = Math.ceil(10 * n.motionModifiers.energyCost);
    check(r.player.currentEnergy >= cost, "Insufficient energy");
    check(n.militaryStrength > 0, "Recruit military units first");
    let damage;
    if (type === "missiles" || type === "nukes") {
      check(n.militaryUnits[type] > 0, "No weapons available");
      check(
        type !== "nukes" || !n.motionModifiers.nuclearBan,
        "World nuclear ban",
      );
      const intuition = type === "nukes" ? 50 : 25;
      check(r.player.currentIntuition >= intuition, "Insufficient intuition");
      this.removeUnits(n, type, 1);
      r.player.currentIntuition -= intuition;
      damage =
        type === "nukes"
          ? r.combat.calculateNukeDamage(n, r.player)
          : r.combat.calculateMissileDamage(n, r.player);
      if (
        type === "missiles" &&
        Math.random() < Math.min(0.45, (t.projects.ironCurtain || 0) * 0.15)
      )
        damage = 0;
    } else if (type === "spies") {
      check(
        n.militaryUnits.spies > 0 && r.player.currentIntuition >= 10,
        "Spies and 10 intuition required",
      );
      r.player.currentIntuition -= 10;
      damage = 0;
      n.intelligence ||= {};
      n.intelligence[t.id] = {
        units: clone(t.militaryUnits),
        money: t.money,
        at: now,
      };
    } else {
      damage = r.combat.calculateBaseDamage(n, r.player);
      if (r.combat.rollCriticalHit(r.player))
        damage +=
          r.combat.calculateCriticalDamage(damage, r.player) +
          n.researchModifiers.criticalDamage;
      damage *=
        n.motionModifiers.military *
        (n.militaryMaintenanceDeficit ? 0.5 : 1) *
        n.combatMultiplier;
      damage *= 1 + diplomacy.combatBonus(this, n, w.participants);
      damage *=
        1 +
        r.player.getSkillValue("aim") * 0.1 +
        r.player.getSkillValue("luck") * 0.05;
      r.combat.getNationById = (id) => this.nation(id).nation;
      r.combat.getPlayerByNationId = (id) => this.nation(id).player;
      const defense = r.combat.processDefense(
        t.id,
        Math.floor(
          (damage * (t.motionModifiers.damageTaken || 1)) /
            (t.motionModifiers.defense *
              (1 + t.researchModifiers.defense / 100)),
        ),
        { participantStats: new Map() },
      );
      damage = defense.damage;
      w.damage[t.id] += defense.counterDamage;
    }
    r.player.currentEnergy -= cost;
    const inflicted =
      type === "conventional" ? damage : Math.min(t.infra, damage);
    if (type === "missiles" || type === "nukes") {
      t.infra -= inflicted;
      t.applyTemporaryHappinessReduction(type === "nukes" ? 15 : 5);
    }
    w.damage[n.id] += inflicted;
    w.log.push({ actor: n.id, target: t.id, type, damage: inflicted, at: now });
    w.log = w.log.slice(-100);
  }
  processRoundCasualties(w) {
    const total = sum(w.damage);
    if (!total) return;
    w.casualties ||= {};
    for (const id of w.participants) {
      const r = this.nation(id),
        n = r.nation;
      warDiplomacy.ensure(w);
      const enemyDamage = warDiplomacy
        .opposing(w, id)
        .reduce((sum, other) => sum + (w.damage[other] || 0), 0);
      const rate = Math.min(0.25, (enemyDamage / total) * 0.5);
      w.casualties[id] ||= {};
      for (const type of [
        "soldiers",
        "tanks",
        "aircraft",
        "ships",
        "missiles",
        "nukes",
      ]) {
        let lost = Math.floor(
          n.militaryUnits[type] *
            rate *
            (1 - n.researchModifiers.recovery / 100),
        );
        if (type === "soldiers")
          lost = Math.floor(
            lost * (1 - (n.wonderEffects.soldierLossReduction || 0)),
          );
        if (!lost) continue;
        this.removeUnits(n, type, lost);
        w.casualties[id][type] = (w.casualties[id][type] || 0) + lost;
        if (["tanks", "aircraft", "ships"].includes(type)) {
          const recovery =
            n.wonderEffects.enhancedSalvageRate ||
            n.projectEffects.militarySalvageRate ||
            0;
          const resources = n.calculateMilitaryCost(type, lost).resources;
          for (const [key, value] of Object.entries(resources))
            n.resources[key] += Math.floor(value * recovery);
        }
      }
    }
  }
  nextDeadline() {
    let next = Math.min(
      this.state.startedAt + (this.state.day + 1) * HOUR,
      this.state.election.status === "scheduled"
        ? this.state.election.opensAt
        : this.state.election.endsAt,
    );
    next = Math.min(next, this.sports.nextDeadline());
    for (const a of Object.values(this.state.tradeAgreements)) {
      if (a.status === "pending") next = Math.min(next, a.expiresAt);
      else if (a.status === "active" && a.endsAt)
        next = Math.min(next, a.endsAt);
    }
    for (const a of Object.values(this.state.aid))
      if (["pending", "accepted", "returning"].includes(a.status))
        next = Math.min(next, a.endsAt);
    for (const t of Object.values(this.state.treaties)) {
      if (t.status === "pending") next = Math.min(next, t.expiresAt);
      else if (t.status === "active" && t.endsAt)
        next = Math.min(next, t.endsAt);
    }
    for (const r of this.rules.values()) {
      for (const penalty of r.nation.diplomaticPenalties || [])
        next = Math.min(next, penalty.endsAt);
    }
    for (const r of this.rules.values())
      for (const task of r.nation.activeResearch)
        next = Math.min(next, task.endsAt);
    for (const m of Object.values(this.state.motions)) {
      if (m.status.includes("voting")) next = Math.min(next, m.endsAt);
      else if (m.status === "passed" && m.effectEndsAt)
        next = Math.min(next, m.effectEndsAt);
    }
    for (const w of Object.values(this.state.wars))
      if (w.status !== "ended") next = Math.min(next, w.endsAt);
    return next;
  }
  advance(now) {
    if (this.nextDeadline() > now) return false;
    try {
      this.transact(() => {
        while (this.nextDeadline() <= now) {
          const at = this.nextDeadline();
          this.state.lastProcessed = at;
          this.processingAt = at;
          this.sports.process(at);
          const election = this.state.election;
          if (election.status === "scheduled" && election.opensAt <= at)
            election.status = "voting";
          if (election.status === "voting" && election.endsAt <= at) {
            for (const [faction, c] of Object.entries(this.congress(at))) {
              const ballots = Object.entries(this.state.electionVotes)
                .filter(([id]) => {
                  const voter = this.nation(id).nation;
                  return (
                    voter.factionKey === faction && voter.projects.broadcasting
                  );
                })
                .flatMap(([, targets]) => targets);
              election.representatives[faction] = c.eligible
                .filter((id) => ballots.includes(id))
                .sort(
                  (a, b) =>
                    ballots.filter((v) => v === b).length -
                      ballots.filter((v) => v === a).length ||
                    a.localeCompare(b),
                )
                .slice(0, c.seats);
            }
            this.state.electionVotes = {};
            election.opensAt += 30 * HOUR;
            election.endsAt = election.opensAt + DAY;
            election.status = "scheduled";
          }
          for (const a of Object.values(this.state.tradeAgreements)) {
            if (
              (a.status === "pending" && a.expiresAt <= at) ||
              (a.status === "active" && a.endsAt && a.endsAt <= at)
            )
              a.status = "expired";
          }
          for (const aid of Object.values(this.state.aid))
            if (
              ["pending", "accepted", "returning"].includes(aid.status) &&
              aid.endsAt <= at
            ) {
              if (aid.type === "money" && aid.status !== "accepted")
                this.nation(aid.from).nation.money += aid.amount;
              aid.status = aid.status === "accepted" ? "completed" : "returned";
            }
          for (const treaty of Object.values(this.state.treaties)) {
            if (
              (treaty.status === "pending" && treaty.expiresAt <= at) ||
              (treaty.status === "active" &&
                treaty.endsAt &&
                treaty.endsAt <= at)
            )
              treaty.status = "expired";
          }
          for (const r of this.rules.values()) {
            const n = r.nation;
            for (const task of n.activeResearch.filter(
              (task) => task.endsAt <= at,
            )) {
              n.completedResearch.push(task.key);
              for (const [key, value] of Object.entries(
                r.research[task.key].effects,
              ))
                n.researchEffects[key] = (n.researchEffects[key] || 0) + value;
              r.player._onResearchCompleted();
            }
            n.activeResearch = n.activeResearch.filter(
              (task) => task.endsAt > at,
            );
          }
          for (const m of Object.values(this.state.motions)) {
            if (m.status === "passed" && m.effectEndsAt <= at) {
              m.status = "expired";
              continue;
            }
            if (!m.status.includes("voting") || m.endsAt > at) continue;
            const tally = (votes) => ({
              for: votes.filter((v) => v.vote === "for").length,
              against: votes.filter((v) => v.vote === "against").length,
              abstain: votes.filter((v) => v.vote === "abstain").length,
            });
            if (m.scope === "world" && m.status === "faction_voting") {
              m.factionResults = {};
              for (const [faction, c] of Object.entries(this.congress(at))) {
                const t = tally(
                  Object.values(m.votes).filter((v) => v.faction === faction),
                );
                m.factionResults[faction] = {
                  ...t,
                  seats: c.seats,
                  position:
                    t.for > t.against
                      ? "for"
                      : t.against > t.for
                        ? "against"
                        : "abstain",
                };
              }
              m.status = "world_voting";
              m.endsAt = at + 2 * DAY;
              continue;
            }
            let support;
            if (m.scope === "color") {
              const t = tally(Object.values(m.votes));
              support = t.for / Math.max(1, t.for + t.against + t.abstain);
            } else {
              const results = Object.values(m.factionResults);
              support =
                results
                  .filter((v) => v.position === "for")
                  .reduce((s, v) => s + v.seats, 0) /
                Math.max(
                  1,
                  results.reduce((s, v) => s + v.seats, 0),
                );
            }
            m.support = support;
            m.status = support >= m.threshold ? "passed" : "failed";
            m.effectEndsAt = at + (m.parameters.duration || 7) * DAY;
            if (m.status === "passed") {
              if (m.type === "WORLD_NAME_CHANGE")
                this.state.worldName = m.parameters.newWorldName;
              if (m.type === "WORLD_NUCLEAR_BAN")
                for (const r of this.rules.values())
                  this.removeUnits(
                    r.nation,
                    "nukes",
                    r.nation.militaryUnits.nukes,
                  );
              if (m.type === "WORLD_INFRASTRUCTURE_PROJECT")
                for (const r of this.rules.values()) {
                  const cost = m.parameters.costPerNation || 0;
                  if (r.nation.money >= cost) {
                    r.nation.money -= cost;
                    r.nation.infra += Number(m.parameters.benefits) || 1;
                  }
                }
            }
          }
          warDiplomacy.process(this, at);
          for (const w of Object.values(this.state.wars)) {
            if (w.status === "ended" || w.endsAt > at) continue;
            if (w.status === "preparing") {
              w.status = "active";
              w.round = 1;
            } else {
              const a = w.attacker,
                b = w.defender,
                totals = warDiplomacy.sidesDamage(w);
              this.processRoundCasualties(w);
              if (totals.attacker !== totals.defender)
                w.wins[totals.attacker > totals.defender ? a : b]++;
              if (Math.max(...Object.values(w.wins)) >= 2 || w.round === 3) {
                w.status = "ended";
                w.result =
                  w.wins[a] === w.wins[b]
                    ? "Draw"
                    : w.wins[a] > w.wins[b]
                      ? a
                      : b;
                for (const id of w.participants) {
                  const r = this.nation(id),
                    n = r.nation;
                  if (w.result === "Draw") continue;
                  const won =
                    warDiplomacy.sideOf(w, w.result) ===
                    warDiplomacy.sideOf(w, id);
                  if (won) r.player._onBattleWon();
                  else r.player._onBattleLost();
                  n.statistics[won ? "warsWon" : "warsLost"] =
                    (n.statistics[won ? "warsWon" : "warsLost"] || 0) + 1;
                  n.temporaryEffects ||= [];
                  n.temporaryEffects.push({
                    type: won ? "happinessBonus" : "happinessReduction",
                    amount: won ? 5 : 3,
                    turnsRemaining: won ? 72 : 48,
                  });
                }
              } else {
                w.round++;
                w.damage = Object.fromEntries(
                  w.participants.map((id) => [id, 0]),
                );
              }
            }
            w.endsAt = at + 4 * HOUR;
          }
          if (this.state.startedAt + (this.state.day + 1) * HOUR <= at) {
            this.state.day++;
            this.turnTechMaximum = Math.max(
              0,
              ...[...this.rules.values()].map((r) => r.nation.tech),
            );
            for (const r of this.rules.values()) {
              r.setDay(this.state.day);
              this.processTurn(r);
            }
            warDiplomacy.collectDebts(this);
            agreements.process(this, at);
            this.sports.turn(at, this.state.day);
            for (const offer of Object.values(this.state.offers))
              if (
                offer.status === "returning" &&
                offer.returnDay <= this.state.day
              ) {
                const n = this.nation(offer.owner).nation;
                if (offer.side === "buy") n.money += offer.amount * offer.price;
                else n.resources[offer.resource] += offer.amount;
                delete this.state.offers[offer.id];
              }
          }
          for (const r of this.rules.values()) this.refresh(r);
        }
      });
    } finally {
      delete this.processingAt;
    }
    return true;
  }
  processTurn(r) {
    const n = r.nation;
    n.processTemporaryEffects();
    this.refresh(r);
    if (n.motionModifiers.techSharing) {
      const sharing = n.motionModifiers.techSharing;
      n.tech += Math.max(
        0,
        Math.floor(
          ((Math.min(this.turnTechMaximum, sharing.threshold) - n.tech) *
            sharing.rate) /
            100,
        ),
      );
      this.refresh(r);
    }
    const before = clone(n.resources);
    r.resources.generateTerritoryResources();
    for (const key of r.resources.basicResources) {
      let multiplier =
        n.motionModifiers.production *
        (1 + n.researchModifiers.production / 100);
      multiplier *=
        (n.motionModifiers.resourceBoosts?.all || 1) *
        (n.motionModifiers.resourceBoosts?.[key] || 1);
      if (key === "food") multiplier *= 1 + n.researchModifiers.food / 100;
      n.resources[key] =
        before[key] + (n.resources[key] - before[key]) * multiplier;
    }
    const plants = n.improvements.assemblyPlant || 0;
    const output =
      0.05 *
      plants *
      (1 + plants * 0.05) *
      (n.projects.enhancedAssembly ? 2 : 1) *
      (n.wonders.supremeAssembly ? 1.5 : 1) *
      n.motionModifiers.production *
      (1 + n.researchModifiers.manufacturing / 100) *
      Math.max(
        0,
        1 +
          (n.policyEffects.industrialOutput || 0) +
          (n.policyEffects.domesticIndustry || 0),
      );
    for (const [key, recipe] of Object.entries(
      r.resources.manufacturingRecipes,
    )) {
      if (n.manufacturing[key] === false) continue;
      const productOutput =
        output *
        (n.motionModifiers.resourceBoosts?.all || 1) *
        (n.motionModifiers.resourceBoosts?.[key] || 1);
      const batches = Math.max(
        0,
        Math.min(
          productOutput / recipe.output,
          ...Object.entries(recipe.inputs).map(([k, v]) => n.resources[k] / v),
        ),
      );
      for (const [k, v] of Object.entries(recipe.inputs))
        n.resources[k] -= batches * v;
      n.resources[key] += batches * recipe.output;
    }
    this.refresh(r);
    const upkeep = n.calculateDailyMaintenanceCosts(),
      costs = { money: upkeep.money, ...upkeep.resources };
    for (const key of Object.keys(costs))
      costs[key] *= n.motionModifiers.upkeep;
    n.militaryMaintenanceDeficit = this.affordability(n, costs).length > 0;
    if (!n.militaryMaintenanceDeficit) this.pay(n, costs);
    n.money += n.taxRevenue + n.researchIncome;
    n.totalTaxEarned += n.taxRevenue;
    const limits = this.limits(r);
    const production = {
      missiles:
        (n.projects.missileSilo || 0) * (n.wonders.enhancedSilos ? 2 : 1),
      spies:
        (n.projects.spyOperations || 0) * (n.wonders.enhancedSpyOps ? 5 : 3),
      nukes:
        n.wonders.nuclearWarheadFacility && !n.motionModifiers.nuclearBan
          ? n.wonders.enhancedNuclearWarheads
            ? 2
            : 1
          : 0,
    };
    for (const [type, count] of Object.entries(production))
      n.militaryUnits[type] += Math.min(
        count,
        Math.max(0, limits[type] - n.militaryUnits[type]),
      );
    if (n.wonders.great_library) n.researchPoints += 200;
    const maxEnergy = r.player.getMaxEnergy();
    r.player.currentEnergy = Math.min(
      maxEnergy,
      r.player.currentEnergy + maxEnergy * 0.1 * n.motionModifiers.energyRegen,
    );
    r.player.regenerateIntuition();
    r.player._onDayPassed();
    n.statistics.totalTurns++;
    if (n.projects.governmentStatue) {
      n.demandTimer.governmentDaysRemaining = 30;
      n.demandTimer.isDemandingGovernment = false;
    }
    if (n.projects.religiousStatue) {
      n.demandTimer.religionDaysRemaining = 30;
      n.demandTimer.isDemandingReligion = false;
    }
    n.checkDemands();
  }
  view(id) {
    const r = this.nation(id),
      n = r.nation;
    const buildings = Object.fromEntries(
      Object.entries(categories).map(([category, [system, property]]) => [
        category,
        Object.fromEntries(
          Object.keys(r[system][property]).map((key) => [
            key,
            this.buildingQuote(r, category, key),
          ]),
        ),
      ]),
    );
    const nations = [...this.rules.values()].map((other) => ({
      id: other.nation.id,
      name: other.nation.name,
      leader: other.nation.leader,
      factionKey: other.nation.factionKey,
      allianceId: other.nation.allianceId,
      lastActive: other.player.settings.privacy.showOnline
        ? other.nation.lastActive || other.nation.founded
        : null,
      land: other.nation.land,
      population: other.player.settings.privacy.showStatistics
        ? other.nation.population
        : null,
      militaryStrength: other.player.settings.privacy.showStatistics
        ? other.nation.militaryStrength
        : null,
    }));
    const alliances = Object.values(this.state.alliances).map((a) => ({
      ...a,
      permissions: this.permissions(a, id),
      applications: this.hasPermission(a, id, "members")
        ? a.applications
        : a.applications.filter((member) => member === id),
      treasury: own(a.members, id) ? a.treasury : null,
      log: own(a.members, id) ? a.log : [],
    }));
    const messages = this.state.messages
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
    snapshot.nation.intelligence = diplomacy.intelligence(this, n);
    return {
      revision: this.state.revision,
      serverTime: this.clock(),
      day: this.state.day,
      nextTurnAt: this.state.startedAt + (this.state.day + 1) * HOUR,
      worldName: this.state.worldName,
      sports: this.sports.view(id),
      nation: snapshot.nation,
      player: snapshot.player,
      nations,
      diplomacy: {
        relationships: Object.fromEntries(
          nations
            .filter((other) => other.id !== id)
            .map((other) => [
              other.id,
              Object.fromEntries(
                diplomacy.relationshipTypes.map((type) => [
                  type,
                  diplomacy.relationshipQuote(this, n, other.id, type),
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
                Object.keys(this.base.treaties).map((type) => [
                  type,
                  diplomacy.treatyReasons(
                    this,
                    n,
                    this.nation(other.id).nation,
                    type,
                  ),
                ]),
              ),
            ]),
        ),
        partners: diplomacy.intelligencePartners(this, id),
        calls: warDiplomacy.view(this, id),
        treatyAcceptance: Object.fromEntries(
          Object.values(this.state.treaties)
            .filter((t) => t.to === id && t.status === "pending")
            .map((t) => [
              t.id,
              diplomacy.treatyReasons(
                this,
                this.nation(t.from).nation,
                n,
                t.type,
                t.id,
              ),
            ]),
        ),
        combatBonuses: Object.fromEntries(
          Object.values(this.state.wars)
            .filter((w) => w.participants.includes(id))
            .map((w) => [w.id, diplomacy.combatBonus(this, n, w.participants)]),
        ),
      },
      buildings,
      territories: this.state.territories,
      electionVote: this.state.electionVotes[id],
      election: this.state.election,
      units: Object.fromEntries(
        Object.keys(unitUpkeep).map((type) => [type, this.unitQuote(r, type)]),
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
        Object.keys(r.research).map((key) => [key, this.researchQuote(r, key)]),
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
          Object.entries(n.calculateDailyMaintenanceCosts().resources).map(
            ([k, v]) => [k, v * n.motionModifiers.upkeep],
          ),
        ),
      },
      alliances,
      canFoundAlliance: this.canFound(n),
      offers: Object.values(this.state.offers).filter(
        (o) => o.status === "open" || o.owner === id,
      ),
      tradeAgreements: Object.values(this.state.tradeAgreements).filter((a) =>
        [a.from, a.to].includes(id),
      ),
      tradePartners: [...agreements.partners(this, id)],
      aid: Object.values(this.state.aid).filter((a) =>
        [a.from, a.to].includes(id),
      ),
      treaties: Object.values(this.state.treaties).filter((t) =>
        [t.from, t.to].includes(id),
      ),
      wars: Object.values(this.state.wars).filter((w) =>
        w.participants.includes(id),
      ),
      motions: Object.values(this.state.motions).filter((m) =>
        m.scope === "world"
          ? this.forumAccess(n, "world")
          : this.forumAccess(n, "color") && m.faction === n.factionKey,
      ),
      congress: this.congress(),
      articles: Object.values(this.state.articles).sort(
        (a, b) => b.createdAt - a.createdAt,
      ),
      messages,
    };
  }
}
module.exports = { World, HOUR, DAY, check, text, quantity };
