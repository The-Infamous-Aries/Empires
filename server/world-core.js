"use strict";
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRules, clone } = require("./rules");
const { syncRelations, sharedTechnology } = require("./world-diplomacy");
const research = require("./research");
const rankings = require("./rankings");
const { saveAccount } = require("../core/data-persistence");

class WorldCore {
  constructor(world) {
    this.world = world;
  }

  nation(id) {
    const r = this.world.rules.get(id);
    this.world.check(r, "Nation not found");
    return r;
  }

  register(username, passwordHash, nationData, existingId = null) {
    const world = this.world;
    username = world.text(username, "Username", 32, 3);
    world.check(
      /^[a-zA-Z0-9_-]+$/.test(username),
      "Username may contain letters, numbers, _ and -",
    );
    if (!existingId) {
      world.check(
        !Object.values(world.state.accounts).some(
          (a) => a.username.toLowerCase() === username.toLowerCase(),
        ),
        "Username is already registered",
      );
    }
    const name = world.text(nationData.name, "Nation name", 60, 3);
    world.check(
      ![...world.rules.values()].some(
        (r) => r.nation.name.toLowerCase() === name.toLowerCase(),
      ),
      "Nation name is already registered",
    );
    world.check(world.own(world.base.colors, nationData.factionKey), "Choose a faction");
    world.check(
      world.own(world.base.governments, nationData.government),
      "Choose a government",
    );
    world.check(world.own(world.base.religions, nationData.religion), "Choose a religion");
    const pet = nationData.nationalPet || "none";
    const food = nationData.nationalFood || null;
    const water = nationData.nationalWater || null;
    const currency = nationData.currency || "usd";
    return world.transact(() => {
      const id = existingId || randomUUID();
      const r = createRules(world.state.day);
      r.resourceSystem = world.resourceSystem;
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
      r.nation.founded = world.clock();
      r.nation.foundedDay = world.state.day;
      r.nation.primaryResource = nationData.primaryResource;
      r.nation.currency = currency;
      r.nation.nationalPet = pet;
      r.nation.nationalFood = food;
      r.nation.nationalWater = water;
      r.nation.factionJoinedAt = world.clock();
      r.nation.recruitmentBasis = {};
      r.nation.activeResearch = [];
      r.nation.completedResearch = [];
      r.nation.researchEffects = {};
      r.nation.researchPoints = 0;
      r.nation.relationships = {};
      r.nation.manufacturing = {};
      r.player.factionKey = nationData.factionKey;
      r.player.factionJoinDate = world.clock();
      r.nation.loans = [];
      world.casinoSystem.ensureCasino(r.nation);
      r.casino = world.casinoSystem.getCasino(r.nation);
      if (existingId) {
        world.state.accounts[id] = world.state.accounts[id] || {};
        world.state.accounts[id].id = id;
        world.state.accounts[id].username = username;
        world.state.accounts[id].nationId = id;
      } else {
        world.state.accounts[id] = { id, username, passwordHash };
      }
      world.rules.set(id, r);
      world.refresh(r);
      saveAccount(world.state.accounts[id]).catch(err =>
        console.error("Failed to persist account on register:", err.message)
      );
      return id;
    });
  }

  catalog() {
    const world = this.world;
    const r = world.base;
    return clone({
      buildings: {
        improvements: r.improvements.improvementTypes,
        projects: r.projects.projectTypes,
        wonders: r.wonders.wonderTypes,
      },
      governments: r.governments,
      religions: r.religions,
      colors: r.colors,
      resources: world.resourceSystem.buildCatalogResources(),
      recipes: r.resources?.manufacturingRecipes
        ? Object.fromEntries(
            Object.entries(r.resources.manufacturingRecipes).map(([key, def]) => [
              key,
              {
                ...def,
                description:
                  {
                    paper:
                      "Manufactured resource available for trade and required resource combinations.",
                    cookedFood:
                      "Manufactured food available for trade and required resource combinations.",
                  }[key] || def.description,
              },
            ]),
          )
        : {},
      bonuses: r.resources?.bonusRequirements
        ? Object.fromEntries(
            Object.entries(r.resources.bonusRequirements).map(([key, def]) => [
              key,
              {
                ...def,
                description:
                  {
                    construction: "Reduces infrastructure purchase costs by 15%.",
                    books: "Increases research speed by 25%.",
                    automobiles:
                      "Increases population growth by 10% and trade efficiency by 20%, reducing applicable tariffs.",
                  }[key] || def.description,
              },
            ]),
          )
        : {},
      research: Object.fromEntries(
        Object.entries(r.research).map(([id, def]) => [
          id,
          { ...def, appliedEffects: research.describe(def) },
        ]),
      ),
      researchStats: research.definitions,
      rankings: { metrics: rankings.metrics, periods: rankings.periods },
      sports: world.sports.catalog(),
      skills: r.skillDefs,
      allianceTemplates: r.allianceTemplates,
      treatyTypes: r.treaties,
      currencies: Object.fromEntries(
        Object.entries(world.CURRENCIES).map(([key, cfg]) => [key, { ...cfg }]),
      ),
      pets: world.PET_ICONS_UNIQUE,
      treatyTypes: r.treaties,
      motionTypes: (() => {
        const src = r.motionTypes || {};
        const out = {};
        for (const [key, def] of Object.entries(src)) {
          if (key.startsWith("COLOR_") || key.startsWith("WORLD_")) out[key] = def;
        }
        out.WORLD_INTEREST_RATE_ADJUST = {
          name: "World Bank Interest Rate Adjustment",
          description: "Adjust the World Bank loan interest rate globally.",
          scope: "world",
          minSupport: 0.6,
          parameters: ["newRate"],
          requiresWonder: "internet",
          canPropose: ["congress_only"],
        };
        out.WORLD_LOAN_LIMIT_ADJUST = {
          name: "World Bank Loan Limit Adjustment",
          description: "Adjust the maximum loan multiplier relative to annual tax revenue.",
          scope: "world",
          minSupport: 0.6,
          parameters: ["newLimitMultiplier"],
          requiresWonder: "internet",
          canPropose: ["congress_only"],
        };
        out.WORLD_LOTTERY_FUNDING_BOOST = {
          name: "Lottery Funding Boost",
          description: "Increase World Bank contributions to the National Pet Lottery pool.",
          scope: "world",
          minSupport: 0.55,
          parameters: ["boostPct"],
          requiresWonder: "internet",
          canPropose: ["congress_only"],
        };
        return out;
      })(),
      unitUpkeep: world.unitUpkeep,
      situationDefinitions: (() => {
        const root = path.resolve(__dirname, "..", "assets", "data", "events");
        const loadSituations = (filename) => {
          try {
            const code = fs.readFileSync(path.join(root, filename), "utf8");
            const sandbox = { console: { log() {}, warn() {}, error: console.error } };
            sandbox.window = sandbox;
            const context = vm.createContext(sandbox);
            new vm.Script(code, { filename }).runInContext(context);
            const result = {};
            for (const key of Object.keys(sandbox)) {
              if (key.endsWith("Situations") && sandbox[key] && typeof sandbox[key] === "object") {
                result[key.replace("Situations", "").toLowerCase()] = Object.fromEntries(
                  Object.entries(sandbox[key]).map(([cat, events]) => [
                    cat,
                    events.map((ev) => ({
                      id: ev.id,
                      title: ev.title,
                      description: ev.description,
                      choices: ev.choices,
                    })),
                  ]),
                );
              }
            }
            return result;
          } catch (e) {
            console.warn(`Could not load situation definitions from ${filename}:`, e.message);
            return {};
          }
        };
        return {
          ...loadSituations("population-situations.js"),
          ...loadSituations("nation-situations.js"),
          ...loadSituations("military-situations.js"),
        };
      })(),
    });
  }

  refresh(r, at = this.world.processingAt ?? this.world.clock()) {
    const n = r.nation;
    research.rebuild(r);
    diplomacy.syncRelations(n);
    n.sharedTechnology = diplomacy.sharedTechnology(this.world, n);
    n.effectiveTech = n.tech + n.sharedTechnology;
    n.improvementEffects = {};
    n.projectEffects = {};
    n.wonderEffects = {};
    for (const key of Object.keys(r.projects.projectTypes))
      if (n.projects[key] > 0) r.projects.applyProjectEffects(n, key);
    for (const key of Object.keys(r.wonders.wonderTypes))
      if (n.wonders[key] > 0) r.wonders.applyWonderEffects(n, key);
    for (const key of Object.keys(r.improvements.improvementTypes))
      if (n.improvements[key] > 0)
        r.improvements.applyImprovementEffects(n, key);
    this.world.state.globalResources = this.world.resourceSystem.computeGlobalResources(
      Array.from(this.world.rules.values()).map((rr) => rr.nation),
    );
    if (n.allianceId) {
      const alliance = this.world.state.alliances[n.allianceId];
      n.allianceNations = alliance ? Object.keys(alliance.members || {}) : [];
    } else {
      n.allianceNations = [];
    }
    for (const key of Object.keys(r.wonders.wonderTypes))
      if (n.wonders[key] > 0)
        this.world.resourceSystem.applyWonderEffects(n, key, true);
    this.world.forumMgr.applyMotionModifiers(r);
    n.nationStats.happiness = 50;
    n.nationStats.environment = 50;
    n.calculatePopulation();
    const re = n.researchModifiers;
    const p = n.projectEffects,
      w = n.wonderEffects,
      i = n.improvementEffects;
    n.calculateLiteracy();
    n.calculatePollution();
    n.nationStats.pollution = Math.max(
      -500,
      Math.min(500, n.nationStats.pollution - (i.treePollutionReduction || 0)),
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
    const gov = r.governments[n.government],
      rel = r.religions[n.religion];
    for (let pass = 0; pass < 12; pass++) {
      n.calculateCrime();
      n.nationStats.crime = Math.max(
        -100,
        n.nationStats.crime - (p.enhancedPoliceCrimeReduction || 0) * 100,
      );
      if (n.nationStats.crime > 0)
        n.nationStats.crime *= 1 - re.crimeReduction / 100;
      n.calculateHappiness();
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
      if (!(n.resources.food > 0 || w.foodIndependence)) h -= 0;
      if (!(n.resources.water > 0 || w.waterIndependence)) h -= 0;
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
        (rel.bonuses.populationGrowth || 0)
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
        (1 + (gov.bonuses.stability || 0) + (rel.bonuses.stability || 0)) *
        (gov.penalties?.stability || 1),
    );
    n.reputation = Math.min(
      100,
      Math.max(
        0,
        50 *
          (1 + (gov.bonuses.reputation || 0)) *
          (gov.penalties?.reputation || 1),
      ),
    );
    n.taxRevenue = Math.floor(
      n.taxRevenue *
        (1 + re.taxEfficiency / 100) *
        (1 + re.taxIncome / 100) *
        (1 + (gov.bonuses.gdp || 0)) *
        (gov.penalties?.gdp || 1) *
        n.motionModifiers.tax,
    );
    if (n.allianceId) {
      const alliance = this.world.state.alliances?.[n.allianceId];
      if (alliance && alliance.color) {
        const nationColor = this.world.base.colors?.[n.factionKey]?.hex;
        if (nationColor && nationColor.toLowerCase() === String(alliance.color).toLowerCase()) {
          n.taxRevenue = Math.floor(n.taxRevenue * 1.05);
        }
      }
    }
    n.researchIncome = re.flatIncome;
    n.buildingUpkeep = {
      improvements: (n.improvements ? Object.values(n.improvements).reduce((a, b) => a + b, 0) : 0) * 25000,
      projects: (n.projects ? Object.values(n.projects).reduce((a, b) => a + b, 0) : 0) * 125000,
      wonders: (n.wonders ? Object.values(n.wonders).reduce((a, b) => a + b, 0) : 0) * 625000,
    };
    n.updateMilitaryStrength();
    n.combatMultiplier =
      (1 + (gov.bonuses.militaryStrength || 0)) *
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
    n.motionModifiers.upkeep *= 1 - re.upkeepReduction / 100;
    n.militaryBudget =
      n.calculateDailyMaintenanceCosts().money * n.motionModifiers.upkeep;
    n.buildingUpkeep = {
      improvements: (n.improvements ? Object.values(n.improvements).reduce((a, b) => a + b, 0) : 0) * 25000,
      projects: (n.projects ? Object.values(n.projects).reduce((a, b) => a + b, 0) : 0) * 125000,
      wonders: (n.wonders ? Object.values(n.wonders).reduce((a, b) => a + b, 0) : 0) * 625000,
    };
    n.budget.expenses = n.militaryBudget + (n.buildingUpkeep.improvements || 0) + (n.buildingUpkeep.projects || 0) + (n.buildingUpkeep.wonders || 0);
    n.budget.balance = n.budget.income - n.budget.expenses;
  }

  affordability(n, cost) {
    return Object.entries(cost)
      .filter(
        ([key, value]) => {
          if (key === "money") return n.money + 1e-9 < value;
          const { resource, stage } = this.world.resourceSystem.parseCompoundKey(key);
          const has = stage
            ? n.resources?.[resource]?.[stage] || 0
            : n.resources?.[resource] || 0;
          return has + 1e-9 < value;
        },
      )
      .map(([key, value]) => `Need ${value.toLocaleString()} ${key}`);
  }

  pay(n, cost, factor = 1) {
    for (const [key, amount] of Object.entries(cost)) {
      if (key === "money") { n.money -= amount * factor; continue; }
      const { resource, stage } = this.world.resourceSystem.parseCompoundKey(key);
      if (stage) {
        n.resources[resource][stage] = (n.resources[resource]?.[stage] || 0) - amount * factor;
      } else {
        n.resources[resource] = (n.resources[resource] || 0) - amount * factor;
      }
    }
  }

  removeUnits(n, type, amount) {
    if (!amount) return;
    this.world.check(amount <= n.militaryUnits[type], "Not enough units");
    n.recruitmentBasis ||= {};
    n.recruitmentBasis[type] =
      (n.recruitmentBasis[type] || 0) * (1 - amount / n.militaryUnits[type]);
    n.militaryUnits[type] -= amount;
  }
}

module.exports = { WorldCore };
