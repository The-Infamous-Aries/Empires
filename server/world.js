"use strict";
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRules, clone } = require("./rules");
const agreements = require("./trade");
const diplomacy = require("./diplomacy");
const research = require("./research");
const rankings = require("./rankings");
const warDiplomacy = require("./war-diplomacy");
const { Sports } = require("./sports");
const { WrestlingSystem } = require("./systems/Sports/wrestling-system");
const { WrestlerSystem } = require("./systems/Sports/wrestler-system");
const { saveMessage, saveWar, saveWorldBank, saveAccount } = require("../core/data-persistence");
const { ResourceSystem } = require("../systems/Resource/resource-system.js");
const { TradeAidSystem } = require("../systems/Resource/trade-aid-system.js");
const { EdictSystem } = require("../systems/Nation/edict-system.js");
const XPGoalsSystem = require("../systems/XP/xp-goals-system.js");
const xpGoalsSystem = new XPGoalsSystem();
const edictSystem = new EdictSystem();
const tradeAidSystem = new TradeAidSystem();
tradeAidSystem.initialize();
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
  soldiers: { group: 100, money: 1 },
  tanks: { group: 10, money: 15 },
  aircraft: { group: 1, money: 50 },
  ships: { group: 1, money: 150 },
  spies: { group: 1, money: 500 },
  missiles: { group: 1, money: 1000 },
  nukes: { group: 1, money: 5000 },
};

// ═════════════════════════════════════════════════════════════════════════════
// CURRENCY & LOTTERY CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════
const CURRENCIES = {
  aurel: { key: 'aurel', name: 'Aurel', abbrev: 'AUR', symbol: '₳', baseRate: 100 },
  velt: { key: 'velt', name: 'Velt', abbrev: 'VLT', symbol: '✦', baseRate: 100 },
  krona: { key: 'krona', name: 'Krona', abbrev: 'KRN', symbol: '₭', baseRate: 100 },
  drachma: { key: 'drachma', name: 'Drachma', abbrev: 'DRM', symbol: 'ð', baseRate: 100 },
  sovereign: { key: 'sovereign', name: 'Sovereign', abbrev: 'SOV', symbol: 'ꜱ', baseRate: 100 },
  talon: { key: 'talon', name: 'Talon', abbrev: 'TLN', symbol: '₮', baseRate: 100 },
};

const PET_ICONS = [
  'Axolotl','Anteater','Ant','Alligator','Badger','Bat','Beaver','Bee','Beetle','Bison',
  'BlueTang','Camel','Cardinal','Cat','Centipede','Cheetah','Chicken','Clownfish','Cow','Crab',
  'Crow','Deer','Dog','Dolphin','Duck','Eagle','Elephant','Emu','Firefly','Fox',
  'Frog','Giraffe','Goat','Goose','Gorilla','Grizzly','Hamster','Hedgehog','Hippo','Horse',
  'Hummingbird','Iguana','Jellyfish','Jaguar','Kangaroo','Kiwi','Koala','Lemur','Ladybug','Mantis',
  'Monkey','Mouse','Octopus','Orangutan','Orca','Ostrich','Otter','Owl','Panda','Parrot',
  'Peacock','Pelican','Penguin','Pig','Pigeon','Platypus','PolarBear','Pufferfish','Rabbit','Raccoon',
  'Ram','Rat','RedPanda','Reindeer','Rhino','Salmon','Scorpion','Seahorse','Seal','Shark',
  'Sheep','Shrimp','Skunk','Sloth','Snail','Snake','Spider','Squirrel','Starfish','Stingray',
  'SugarGlider','Tiger','Toucan','Turkey','Turtle','Walrus','Whale','Wolf','Yak','Zebra'
];
const PET_ICONS_UNIQUE = [...new Set(PET_ICONS)];
const TICKET_COST = 100000;
const MAX_TICKETS_PER_NATION = 25;
const TICKET_PICK_COUNT = 6;
const CLAIM_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

class World {
  constructor({
    file = path.join(__dirname, "../saves/world.json"),
    now = Date.now,
  } = {}) {
    this.file = file;
    this.clock = now;
    this.rules = new Map();
    this.base = createRules();
    if (!this.base.motionTypes) {
      this.base.motionTypes = this.defaultMotionTypes();
    }
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
        worldBank: {},
        worldName: "Epochus",
        receipts: {},
        bugReports: [],
        debugErrors: [],
        moderationHistory: [],
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
    this.state.worldBank ||= {};
    this.state.worldBank.prices ||= {};
    this.state.worldBank.targets ||= {};
    this.state.worldBank.inventory ||= {};
    this.state.worldBank.currencyRates ||= {};
    this.state.bugReports ||= [];
    this.state.debugErrors ||= [];
    this.state.moderationHistory ||= [];
    for (const [key, cfg] of Object.entries(CURRENCIES)) {
      this.state.worldBank.currencyRates[key] ??= cfg.baseRate;
    }
    this.state.globalResources ||= {};
    this.state.tradeAidSlots ||= {};
    this.resourceSystem = new ResourceSystem();
    this.resourceSystem.initialize();
    tradeAidSystem.restore(this.state.tradeAidSlots);
    if (!this.state.worldBank.seeded) {
      this.state.worldBank.seeded = true;
    }
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
    for (const [id, saved] of Object.entries(state.nations)) {
      const r = createRules(state.day, saved);
      r.resourceSystem = this.resourceSystem;
      this.rules.set(id, r);
    }
    for (const w of Object.values(state.wars)) warDiplomacy.ensure(w);
    for (const r of this.rules.values()) this.refresh(r, state.lastProcessed);
    this.sports = new Sports(this, state.sports);
    this.wrestling = new WrestlingSystem(this, state.wrestling);
    // Wire WrestlerSystem into WrestlingSystem
    this.wrestling.wrestlerSystem = new WrestlerSystem(this.wrestling);
    rankings.ensure(this);
  }
  snapshot() {
    return clone({
      ...this.state,
      sports: this.sports.snapshot(),
      wrestling: this.wrestling.getState(),
      tradeAidSlots: tradeAidSystem.slots,
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
      rankings.record(this, this.processingAt ?? this.clock());
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
  register(username, passwordHash, nationData, existingId = null) {
    username = text(username, "Username", 32, 3);
    check(
      /^[a-zA-Z0-9_-]+$/.test(username),
      "Username may contain letters, numbers, _ and -",
    );
    // Username uniqueness only applies when creating a brand-new account.
    if (!existingId) {
      check(
        !Object.values(this.state.accounts).some(
          (a) => a.username.toLowerCase() === username.toLowerCase(),
        ),
        "Username is already registered",
      );
    }
    const name = text(nationData.name, "Nation name", 60, 3);
    check(
      ![...this.rules.values()].some(
        (r) => r.nation.name.toLowerCase() === name.toLowerCase(),
      ),
      "Nation name is already registered",
    );
    check(own(this.base.colors, nationData.factionKey), "Choose a faction");
    check(
      own(this.base.governments, nationData.government),
      "Choose a government",
    );
    check(own(this.base.religions, nationData.religion), "Choose a religion");
    const pet = nationData.nationalPet || "none";
    const food = nationData.nationalFood || null;
    const water = nationData.nationalWater || null;
    const currency = nationData.currency || "usd";
    return this.transact(() => {
      const id = existingId || randomUUID();
      const r = createRules(this.state.day);
      r.resourceSystem = this.resourceSystem;
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
      r.nation.currency = currency;
      r.nation.nationalPet = pet;
      r.nation.nationalFood = food;
      r.nation.nationalWater = water;
      r.nation.factionJoinedAt = this.clock();
      r.nation.recruitmentBasis = {};
      r.nation.activeResearch = [];
      r.nation.completedResearch = [];
      r.nation.researchEffects = {};
      r.nation.relationships = {};
      r.nation.manufacturing = {};
      r.player.factionKey = nationData.factionKey;
      r.player.factionJoinDate = this.clock();
      r.nation.loans = [];
      if (existingId) {
        // Account already exists (OAuth / returning session user): link it.
        this.state.accounts[id] = this.state.accounts[id] || {};
        this.state.accounts[id].id = id;
        this.state.accounts[id].username = username;
        this.state.accounts[id].nationId = id;
      } else {
        this.state.accounts[id] = { id, username, passwordHash };
      }
      this.rules.set(id, r);
      this.refresh(r);
      saveAccount(this.state.accounts[id]).catch(err =>
        console.error('Failed to persist account on register:', err.message)
      );
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
      resources: this.resourceSystem.buildCatalogResources(),
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
      sports: this.sports.catalog(),
      skills: r.skillDefs,
      allianceTemplates: r.allianceTemplates,
      treatyTypes: r.treaties,
      currencies: Object.fromEntries(
        Object.entries(CURRENCIES).map(([key, cfg]) => [key, { ...cfg }])
      ),
      pets: PET_ICONS_UNIQUE,
      treatyTypes: r.treaties,
      motionTypes: (() => {
        const src = r.motionTypes || {};
        const out = {};
        for (const [key, def] of Object.entries(src)) {
          if (key.startsWith("COLOR_") || key.startsWith("WORLD_")) out[key] = def;
        }
        // World Bank motions (proposable by Congress, voted in Color / World forums)
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
      unitUpkeep,
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
  refresh(r, at = this.processingAt ?? this.clock()) {
    const n = r.nation;
    research.rebuild(r);
    diplomacy.syncRelations(n);
    n.sharedTechnology = diplomacy.sharedTechnology(this, n);
    n.effectiveTech = n.tech + n.sharedTechnology;
    n.improvementEffects = {};
    n.projectEffects = {};
    n.wonderEffects = {};
    // Rebuild from ownership so demolished capabilities cannot survive in stale flags.
    for (const key of Object.keys(r.projects.projectTypes))
      if (n.projects[key] > 0) r.projects.applyProjectEffects(n, key);
    for (const key of Object.keys(r.wonders.wonderTypes))
      if (n.wonders[key] > 0) r.wonders.applyWonderEffects(n, key);
    for (const key of Object.keys(r.improvements.improvementTypes))
      if (n.improvements[key] > 0)
        r.improvements.applyImprovementEffects(n, key);
    // Rebuild global resource monitoring (staged resource system)
    this.state.globalResources = this.resourceSystem.computeGlobalResources(
      Array.from(this.rules.values()).map((rr) => rr.nation),
    );
    // Set allianceNations for resource tax rate calculation
    if (n.allianceId) {
      const alliance = this.state.alliances[n.allianceId];
      n.allianceNations = alliance ? Object.keys(alliance.members || {}) : [];
    } else {
      n.allianceNations = [];
    }
    // Maintain resource-system wonder effects (supremeMining / supremeAssembly)
    for (const key of Object.keys(r.wonders.wonderTypes))
      if (n.wonders[key] > 0)
        this.resourceSystem.applyWonderEffects(n, key, true);
    this.applyMotionModifiers(r);
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
    // Seed happiness at 50 on every refresh, then resolve its feedback with crime deterministically.
    const gov = r.governments[n.government],
      rel = r.religions[n.religion];
    for (let pass = 0; pass < 12; pass++) {
      n.calculateCrime();
      n.nationStats.crime =
        Math.max(
          -100,
          n.nationStats.crime - (p.enhancedPoliceCrimeReduction || 0) * 100,
        );
      if (n.nationStats.crime > 0)
        n.nationStats.crime *= (1 - re.crimeReduction / 100);
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
        (1 +
          (gov.bonuses.stability || 0) +
          (rel.bonuses.stability || 0)) *
        (gov.penalties?.stability || 1),
    );
    n.reputation = Math.min(
      100,
      Math.max(
        0,
        50 *
          (1 +
            (gov.bonuses.reputation || 0)) *
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
    // Alliance color bonus: +5% tax revenue when the nation's faction color
    // matches its alliance color.
    if (n.allianceId) {
      const alliance = this.state.alliances?.[n.allianceId];
      if (alliance && alliance.color) {
        const nationColor = this.base.colors?.[n.factionKey]?.hex;
        if (nationColor && nationColor.toLowerCase() === String(alliance.color).toLowerCase()) {
          n.taxRevenue = Math.floor(n.taxRevenue * 1.05);
        }
      }
    }
    n.researchIncome = re.flatIncome;
    n.buildingUpkeep = {
      improvements: (n.improvements ? Object.values(n.improvements).reduce((a,b)=>a+b,0) : 0) * 25000,
      projects: (n.projects ? Object.values(n.projects).reduce((a,b)=>a+b,0) : 0) * 125000,
      wonders: (n.wonders ? Object.values(n.wonders).reduce((a,b)=>a+b,0) : 0) * 625000
    };
    n.updateMilitaryStrength();
    n.combatMultiplier =
      (1 +
        (gov.bonuses.militaryStrength || 0)) *
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
      improvements: (n.improvements ? Object.values(n.improvements).reduce((a,b)=>a+b,0) : 0) * 25000,
      projects: (n.projects ? Object.values(n.projects).reduce((a,b)=>a+b,0) : 0) * 125000,
      wonders: (n.wonders ? Object.values(n.wonders).reduce((a,b)=>a+b,0) : 0) * 625000
    };
    n.budget.expenses = n.militaryBudget + (n.buildingUpkeep.improvements || 0) + (n.buildingUpkeep.projects || 0) + (n.buildingUpkeep.wonders || 0);
    n.budget.balance = n.budget.income - n.budget.expenses;
    research.reschedule(this, r, at);
  }
  affordability(n, cost) {
    return Object.entries(cost)
      .filter(
        ([key, value]) => {
          if (key === "money") return n.money + 1e-9 < value;
          const { resource, stage } = this.resourceSystem.parseCompoundKey(key);
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
      const { resource, stage } = this.resourceSystem.parseCompoundKey(key);
      if (stage) {
        n.resources[resource][stage] = (n.resources[resource]?.[stage] || 0) - amount * factor;
      } else {
        n.resources[resource] = (n.resources[resource] || 0) - amount * factor;
      }
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

    // Discipline skill: +2.5% per level to unit max caps (max 25% at level 10)
    const disciplineVal = r.player.getSkillValue('discipline');
    if (disciplineVal > 0) {
      for (const key of Object.keys(limits))
        limits[key] = Math.floor(limits[key] * (1 + disciplineVal));
    }

    return limits;
  }
  unitQuote(r, type, amount = 1) {
    quantity(amount);
    check(own(unitUpkeep, type), "Unknown unit");
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
  choiceCheck(r, action, data) {
    const n = r.nation;
    const key = text(data.value, "Selection"),
      catalog = action === "government" ? r.governments : r.religions;
    check(own(catalog, key), "Unknown selection");
    const statue =
        action === "government" ? "governmentStatue" : "religiousStatue",
      monument =
        action === "government" ? "governmentMonument" : "religiousMonument";
    check(
      !n.projects[statue] || n.wonders[monument],
      "This selection is permanently locked by its statue",
    );
    const last = n[`${action}ChangedDay`];
    check(
      !n.wonders[monument] || last === undefined || this.state.day - last >= 14,
      "Changes require a 14-turn cooldown",
    );
    check(
      n[action] !== key ||
        n.demandTimer?.[
          `isDemanding${action[0].toUpperCase() + action.slice(1)}`
        ],
      "Already selected",
    );
    return key;
  }
  develop(r, data, preview = false) {
    const n = r.nation;
    const methods = {
      land: ["landCost", "buyLand"],
      infra: ["infraCost", "buyInfra"],
      tech: ["techCost", "buyTech"],
    };
    check(own(methods, data.kind), "Unknown development");
    const [cost, buy] = methods[data.kind];
    let total = 0;
    for (let i = 0; i < quantity(data.amount, 100); i++) {
      const price = n[cost]();
      if (preview) n.money = Math.max(n.money, price);
      const before = n.money;
      check(n.money >= n[cost](), "Insufficient money");
      check(n[buy](), "Purchase failed");
      total += before - n.money;
      this.refresh(r);
    }
    return total;
  }
  actionQuote(id, action, data = {}) {
    const r = this.nation(id);
    const result = {
      revision: this.state.revision,
      canAct: false,
      reasons: [],
    };
    try {
      if (action === "develop") {
        // Simulate the same sequential purchases on an isolated rules instance.
        // Refresh reads world relationships but writes only this clone.
        quantity(data.amount, 100);
        const simulated = createRules(this.state.day, r.snapshot());
        result.cost = { money: this.develop(simulated, data, true) };
        check(
          r.nation.money >= result.cost.money,
          "Insufficient money for the full purchase",
        );
      } else if (["government", "religion"].includes(action)) {
        this.choiceCheck(r, action, data);
      } else if (["declareWar", "attack"].includes(action)) {
        this.warAction(r, action, data, true);
      } else if (["tradePropose", "tradeRespond"].includes(action)) {
        agreements.action(this, r, action, data, true);
      } else if (action === "acceptOffer") {
        result.cost = this.trade(r, action, data, true);
      } else if (action === "proposeMotion") {
        this.forumAction(r, action, data, true);
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
          this.catalog().resources.includes(data.resource),
          "Unknown resource",
        );
        const amount = quantity(data.amount, 1_000_000);
        check(
          Number.isSafeInteger(amount) && amount > 0,
          "Invalid quantity",
        );
        const { buyPrice } = this.resourceSystem.getWorldBankPrice(
          data.resource,
          null,
          this.state.globalResources,
          r.nation,
          this.state.worldBank,
        );
        const inventory = this.state.worldBank.inventory[data.resource] || 0;
        check(inventory >= amount, "World Bank does not have enough stock");
        result.cost = { money: Math.floor(buyPrice * amount) };
        check(
          !this.affordability(r.nation, result.cost).length,
          "Insufficient funds",
        );
      } else if (action === "worldBankSell") {
        check(
          this.catalog().resources.includes(data.resource),
          "Unknown resource",
        );
        const amount = quantity(data.amount, 1_000_000);
        check(
          Number.isSafeInteger(amount) && amount > 0,
          "Invalid quantity",
        );
        check(
          this.resourceSystem.getResourceAmount(r.nation, data.resource) >= amount,
          "Not enough resources to sell",
        );
        const { sellPrice } = this.resourceSystem.getWorldBankPrice(
          data.resource,
          null,
          this.state.globalResources,
          r.nation,
          this.state.worldBank,
        );
        result.revenue = { money: Math.floor(sellPrice * amount) };
      } else throw new Error("This action has no preview");
      result.canAct = true;
    } catch (error) {
      result.reasons.push(error.message);
    }
    return result;
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
        n.militaryPopulationCommitted ||= {};
        if (action === "buyUnit") {
          check(q.canBuy, q.reasons.join("; "));
          this.pay(n, q.cost);
          n.militaryUnits[type] += amount;
          n.recruitmentBasis[type] =
            (n.recruitmentBasis[type] || 0) + q.cost.money;
          // Enlist population for purchased combat units (mark citizens as military, deduct population only on destruction in war)
          if (window.PopulationSystem && type !== 'missiles' && type !== 'nukes') {
            const popUnitType = type === 'spies' ? 'spy' : type.slice(0, -1); // soldiers->soldier, tanks->tank, etc.
            if (['soldier', 'tank', 'aircraft', 'ship', 'spy'].includes(popUnitType)) {
              const enlisted = window.PopulationSystem.enlistMilitaryPopulation(amount, popUnitType);
              n.militaryPopulationCommitted[popUnitType] = (n.militaryPopulationCommitted[popUnitType] || 0) + enlisted.total;
            }
          }
          if (q.populationImpact)
            n.applyTemporaryPopulationReduction(q.populationImpact);
          if (q.happinessImpact)
            n.applyTemporaryHappinessReduction(q.happinessImpact);
          // Award XP via XP Goals System
          const unitXpMap = {
            soldiers: 'awardTrainSoldiers',
            tanks: 'awardTrainTanks',
            aircraft: 'awardTrainAircraft',
            ships: 'awardTrainShips',
            missiles: 'awardBuyMissiles',
            nukes: 'awardBuyNukes',
          };
          const unitMethod = unitXpMap[type];
          if (unitMethod && typeof xpGoalsSystem[unitMethod] === 'function') {
            xpGoalsSystem[unitMethod](amount, { type, action: 'buyUnit' });
          } else {
            r.player._awardExperience(amount * 8, 'Military training');
          }
        } else {
          check(q.canSell, "Not enough units");
          this.removeUnits(n, type, amount);
          // Discharge committed population for sold units
          if (window.PopulationSystem && type !== 'missiles' && type !== 'nukes') {
            const popUnitType = type === 'spies' ? 'spy' : type.slice(0, -1);
            if (['soldier', 'tank', 'aircraft', 'ship', 'spy'].includes(popUnitType)) {
              const committed = n.militaryPopulationCommitted[popUnitType] || 0;
              const toDischarge = Math.min(amount, committed);
              if (toDischarge > 0) {
                // Un-mark citizens as military (discharge without killing)
                let remaining = toDischarge;
                for (const citizen of window.PopulationSystem.citizens?.values() || []) {
                  if (remaining <= 0) break;
                  if (citizen.isAlive && citizen.isMilitary && citizen.unitType === popUnitType) {
                    citizen.isMilitary = false;
                    citizen.unitType = null;
                    remaining--;
                  }
                }
                n.militaryPopulationCommitted[popUnitType] = Math.max(0, committed - toDischarge);
                window.PopulationSystem.populationStats.enlisted = Math.max(0, window.PopulationSystem.populationStats.enlisted - toDischarge);
              }
            }
          }
          n.money += q.refund;
        }
        break;
      }
      case "develop": {
        this.develop(r, data);
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
        if (data.name && typeof data.name === "string") {
          n.name = text(data.name, "Nation name", 60, 3);
        }
        if (data.leader && typeof data.leader === "string") {
          n.leader = text(data.leader, "Ruler name", 60, 3);
        }
        break;
      case "changeFaction": {
        const fk = text(data.factionKey, "Faction");
        check(own(r.colors, fk), "Unknown faction color");
        check(fk !== n.factionKey, "Already in that faction");
        const lastChange = n.factionChangedDay;
        check(
          lastChange === undefined || this.state.day - lastChange >= 28,
          "Faction can only be changed once every 28 game turns",
        );
        n.factionKey = fk;
        n.factionChangedDay = this.state.day;
        n.factionJoinedAt = this.clock();
        r.player.factionKey = fk;
        break;
      }
      case "government":
      case "religion": {
        const key = this.choiceCheck(r, action, data);
        n[action] = key;
        n[`${action}ChangedDay`] = this.state.day;
        if (n.demandTimer) {
          n.demandTimer[`${action}DaysRemaining`] = 30;
          n.demandTimer[
            `isDemanding${action[0].toUpperCase() + action.slice(1)}`
          ] = false;
        }
        // Award XP for government/religion changes
        try {
          if (action === "government") {
            xpGoalsSystem.awardChangeGovernment(1, { newGovernment: key });
          } else {
            xpGoalsSystem.awardChangeReligion(1, { newReligion: key });
          }
        } catch(e) {}
        break;
      }
      case "nationalFood": {
        const valid = ["burger","cake","cookie","donut","hotdog","pizza","ramen","salad","steak","sushi","taco"];
        const key = text(data.value, "National Food", 40, 0);
        check(!key || valid.includes(key), "Invalid national food choice");
        // No cooldown until food production is unlocked, then 14-day cooldown
        const hasFoodProduction = n.projects && n.projects.foodProduction > 0;
        if (hasFoodProduction) {
          const lastFoodChange = n.nationalFoodChangedDay;
          check(
            lastFoodChange === undefined || this.state.day - lastFoodChange >= 14,
            "National food can only be changed once every 14 game turns after unlocking food production",
          );
        }
        n.nationalFood = key || null;
        if (hasFoodProduction) {
          n.nationalFoodChangedDay = this.state.day;
        }
        // Award XP for national food change
        try {
          xpGoalsSystem.awardChangeNationalFood(1, { newFood: n.nationalFood });
        } catch(e) {}
        break;
      }
      case "nationalWater": {
        const valid = ["beer","coffee","energy-drink","juice","liquor","milk","milkshake","smoothie","soda","water","wine"];
        const key = text(data.value, "National Water", 40, 0);
        check(!key || valid.includes(key), "Invalid national water choice");
        // No cooldown until water production is unlocked, then 14-day cooldown
        const hasWaterProduction = n.projects && n.projects.waterProduction > 0;
        if (hasWaterProduction) {
          const lastWaterChange = n.nationalWaterChangedDay;
          check(
            lastWaterChange === undefined || this.state.day - lastWaterChange >= 14,
            "National water can only be changed once every 14 game turns after unlocking water production",
          );
        }
        n.nationalWater = key || null;
        if (hasWaterProduction) {
          n.nationalWaterChangedDay = this.state.day;
        }
        // Award XP for national water change
        try {
          xpGoalsSystem.awardChangeNationalWater(1, { newWater: n.nationalWater });
        } catch(e) {}
        break;
      }
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
        this.wrestling.action(id, action, data);
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
      case "worldBankLoan":
      case "worldBankRepay":
      case "worldBankBuy":
      case "worldBankSell":
        this.worldBankAction(r, action, data);
        break;
      case "fundDiseaseCure":
        this.fundGlobalDiseaseCure(r, data.amount);
        break;
      case "currencyBuy":
      case "currencySell": {
        const currencyKey = data.currencyKey;
        const points = Number(data.points);
        const rate = this.getCurrencyRate(currencyKey);
        if (action === "currencyBuy") {
          check(Number.isFinite(points) && points > 0, "Invalid points");
          const cost = Math.ceil(points * rate);
          const reasons = this.affordability(n, { money: cost });
          if (reasons.length) throw new Error("Insufficient funds");
          this.pay(n, { money: cost });
          n.currencyInvestments ||= {};
          n.currencyInvestments[currencyKey] = n.currencyInvestments[currencyKey] || { points: 0, totalSpent: 0 };
          n.currencyInvestments[currencyKey].points += points;
          n.currencyInvestments[currencyKey].totalSpent += cost;
          this.refresh(r);
        } else {
          check(Number.isFinite(points) && points > 0, "Invalid points");
          const inv = (n.currencyInvestments || {})[currencyKey];
          check(inv && inv.points >= points, "Not enough currency points");
          const proceeds = Math.floor(points * rate);
          this.pay(n, { money: -proceeds });
          inv.points -= points;
          if (inv.points <= 0) {
            inv.points = 0;
            inv.totalSpent = 0;
          }
          this.refresh(r);
        }
        break;
      }
      case "lotteryPurchase": {
        const count = Number(data.count);
        const picks = data.ticketPicks;
        this.lotteryPurchase(r, count, picks);
        break;
      }
      case "lotteryClaim": {
        const ticketId = data.ticketId;
        this.lotteryClaim(r, ticketId);
        break;
      }
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
      case "react":
      case "newsCommentEdit":
      case "newsCommentDelete": {
        if (action === "newsCommentEdit") {
          let comment = null;
          for (const article of Object.values(this.state.articles)) {
            const c = article.comments.find((x) => x.id === data.commentId);
            if (c) {
              comment = c;
              break;
            }
          }
          check(comment, "Comment not found");
          check(comment.author === id, "Only the author can edit this comment");
          comment.body = text(data.body, "Comment", 2000);
          comment.editedAt = now;
          break;
        }
        if (action === "newsCommentDelete") {
          let targetArticle = null;
          let commentIdx = -1;
          let comment = null;
          for (const article of Object.values(this.state.articles)) {
            const i = article.comments.findIndex((x) => x.id === data.commentId);
            if (i >= 0) {
              targetArticle = article;
              commentIdx = i;
              comment = article.comments[i];
              break;
            }
          }
          check(comment, "Comment not found");
          check(comment.author === id, "Only the author can delete this comment");
          targetArticle.comments.splice(commentIdx, 1);
          break;
        }
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
          const reaction = data.reaction;
          const hasContent =
            reaction &&
            (reaction.sentiment ||
              reaction.reaction ||
              (reaction.emojis &&
                Object.keys(reaction.emojis).length > 0));
          if (data.targetType === "comment") {
            let targetArticle = null;
            let comment = null;
            for (const article of Object.values(this.state.articles)) {
              const c = article.comments.find((x) => x.id === data.id);
              if (c) {
                targetArticle = article;
                comment = c;
                break;
              }
            }
            check(comment, "Comment not found");
            comment.reactions = comment.reactions || {};
            if (hasContent) comment.reactions[id] = reaction;
            else if (comment.reactions[id]) delete comment.reactions[id];
          } else {
            check(a, "Article not found");
            if (hasContent) a.reactions[id] = reaction;
            else if (a.reactions[id]) delete a.reactions[id];
          }
        }
        break;
      }
      case "newsCommentEdit": {
        const a = this.state.articles[data.articleId];
        check(a, "Article not found");
        const c = a.comments.find((c) => c.id === data.commentId);
        check(c, "Comment not found");
        check(c.author === id, "Only the author can edit this comment");
        c.body = text(data.body, "Comment", 2000);
        c.editedAt = now;
        break;
      }
      case "newsCommentDelete": {
        const a = this.state.articles[data.articleId];
        check(a, "Article not found");
        const idx = a.comments.findIndex((c) => c.id === data.commentId);
        check(idx >= 0, "Comment not found");
        const c = a.comments[idx];
        check(c.author === id, "Only the author can delete this comment");
        a.comments.splice(idx, 1);
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

        // Persist message to database
        const newMsg = this.state.messages[this.state.messages.length - 1];
        saveMessage({
            id: newMsg.id,
            authorId: newMsg.author,
            channel: newMsg.channel,
            target: newMsg.target,
            body: newMsg.body,
            createdAt: newMsg.createdAt,
        }).catch(err => console.error('Failed to persist message:', err.message));
        break;
      }
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
        this.diplomacyAction(r, action, data);
        break;
      case "proposeAid":
        this.proposeAidAction(r, data);
        break;
      case "respondToAid":
        this.respondToAidAction(r, data);
        break;
      case "proposeTrade":
        this.proposeTradeAction(r, data);
        break;
      case "respondToTrade":
        this.respondToTradeAction(r, data);
        break;
      case "respondToCounter":
        this.respondToCounterAction(r, data);
        break;
      case "warRespond":
        warDiplomacy.respond(this, id, data);
        break;
      case "joinWar":
        warDiplomacy.joinWar(this, id, data);
        break;
      case "declareWar":
      case "attack":
      case "peace":
        this.warAction(r, action, data);
        break;
      case "setFlag":
        this.setFlagAction(r, data);
        break;
      case "resolveSituation":
        this.resolveSituationAction(r, data);
        break;
      case "setNationalPet":
        this.setNationalPetAction(r, data);
        break;
      case "setEdicts":
        this.setEdictsAction(r, data);
        break;
      case "cureDisease":
        this.cureDiseaseAction(r, data);
        break;
      default:
        throw new Error("Unknown action");
    }
  }
  setFlagAction(r, data) {
    const n = r.nation;
    const { type, data: flagData, name, stripeCount, stripeOrientation } = data;
    check(type === "uploaded" || type === "designed", "Unknown flag type");
    if (type === "uploaded") {
      check(flagData && typeof flagData === "string", "Flag data required");
      check(name && typeof name === "string", "Flag name required");
      n.flag = { type: "uploaded", data: flagData, name };
    } else {
      check(stripeCount && stripeOrientation, "Flag design requires stripe settings");
      n.flag = {
        type: "designed",
        stripeCount: Number(stripeCount),
        stripeOrientation,
        colors: [], // populated by client
      };
    }
    this.refresh(r);
  }
  resolveSituationAction(r, data) {
    const { situationId, choiceIndex } = data;
    check(typeof situationId === "string", "Situation ID required");
    check(Number.isInteger(choiceIndex) && choiceIndex >= 0, "Choice index required");
    const n = r.nation;
    let situation = null;
    for (const type of ["nation", "population", "military"]) {
      const list = r.events?.active?.[type] || [];
      const found = list.find((s) => s.id === situationId && s.status === "pending");
      if (found) {
        situation = found;
        break;
      }
    }
    check(situation, "Situation not found or already resolved");
    check(situation.status === "pending", "Situation is not pending");
    const def = situation.definition;
    check(def && def.choices && def.choices[choiceIndex], "Invalid choice index");
    const events = window.EventsSystem || global.EventsSystem;
    if (events && typeof events.resolveSituation === "function") {
      events.resolveSituation(situation, choiceIndex);
    } else {
      situation.status = "resolved";
      situation.resolvedAt = Date.now();
      situation.resolvedChoice = choiceIndex;
      const choice = def.choices[choiceIndex];
      if (choice && choice.effects && situation.happinessPenaltyApplied) {
        const stats = n.nationStats || {};
        stats.happiness = Math.min(100, Math.max(0, (stats.happiness || 50) + 10));
        n.happiness = stats.happiness;
        situation.happinessPenaltyApplied = false;
      }
      if (choice && choice.effects) {
        const effects = choice.effects;
        if (effects.happiness !== undefined) {
          const stats = n.nationStats || {};
          stats.happiness = Math.min(100, Math.max(0, (stats.happiness || 50) + effects.happiness));
          n.happiness = stats.happiness;
        }
        if (effects.money !== undefined) {
          n.money = Math.max(0, (n.money || 0) + effects.money);
        }
        if (effects.disease !== undefined) {
          const stats = n.nationStats || {};
          stats.disease = Math.min(50, Math.max(0, (stats.disease || 10) + effects.disease));
        }
        if (effects.crime !== undefined) {
          const stats = n.nationStats || {};
          stats.crime = Math.min(80, Math.max(0, (stats.crime || 15) + effects.crime));
        }
        if (effects.pollution !== undefined) {
          const stats = n.nationStats || {};
          stats.pollution = Math.min(100, Math.max(0, (stats.pollution || 0) + effects.pollution));
        }
        if (effects.environment !== undefined) {
          const stats = n.nationStats || {};
          stats.environment = Math.min(100, Math.max(0, (stats.environment || 50) + effects.environment));
        }
        if (effects.literacy !== undefined) {
          const stats = n.nationStats || {};
          stats.literacy = Math.min(100, Math.max(0, (stats.literacy || 50) + effects.literacy));
        }
      }
    }
    this.refresh(r);
    broadcast();
  }
  setNationalPetAction(r, data) {
    const n = r.nation;
    const { petIcon } = data;
    check(petIcon === null || typeof petIcon === "string", "Invalid pet icon");
    const validPets = ["none", "cat", "dog", "eagle", "lion", "wolf", "dragon"];
    if (petIcon && !validPets.includes(petIcon)) {
      check(false, "Invalid pet icon");
    }
    // 7-day cooldown on national pet changes
    const lastPetChange = n.nationalPetChangedDay;
    check(
      lastPetChange === undefined || this.state.day - lastPetChange >= 7,
      "National pet can only be changed once every 7 game turns",
    );
    n.nationalPet = petIcon && petIcon !== "none" ? petIcon : null;
    n.nationalPetChangedDay = this.state.day;
    this.refresh(r);
    // Award XP for national pet change
    try {
      xpGoalsSystem.awardChangeNationalPet(1, { newPet: n.nationalPet });
    } catch(e) {}
  }
  setEdictsAction(r, data) {
    const n = r.nation;
    const { edicts } = data;
    check(edicts && typeof edicts === "object" && !Array.isArray(edicts), "Edicts object required");
    check(
      n.improvementEffects?.canSetPolicies,
      "Internal Affairs Office required to set edicts",
    );
    n.edicts = n.edicts || {};
    if (!n.edictChangeDates) n.edictChangeDates = {};
    if (n.edictFreePassUsed === undefined) n.edictFreePassUsed = false;

    const currentDay = this.state.day;
    const changes = {};
    // Check 30-day cooldown per category — only blocks categories being changed
    for (const [cat, stance] of Object.entries(edicts)) {
      const currentStance = n.edicts[cat];
      if (currentStance === stance) continue; // No change, skip
      if (!edictSystem.canChangeEdict(n, cat, currentDay)) {
        const daysLeft = edictSystem.getDaysUntilEdictChange(n, cat, currentDay);
        check(false, `Edict '${cat}' is on cooldown. ${daysLeft} day(s) remaining until change allowed.`);
      }
      changes[cat] = stance;
    }
    // Apply all changes that passed cooldown
    for (const [cat, stance] of Object.entries(changes)) {
      n.edicts[cat] = stance;
      n.edictChangeDates[cat] = currentDay;
    }
    // Consume free pass if any dangerous category was changed
    if (!n.edictFreePassUsed) {
      const hasDangerousChange = Object.keys(changes).some(cat =>
        ['sexualOrientation', 'marriageLimits'].includes(cat)
      );
      if (hasDangerousChange) {
        n.edictFreePassUsed = true;
      }
    }
    this.refresh(r);
    // Apply edict effects
    if (typeof edictSystem.applyEdictEffects === 'function') {
      edictSystem.applyEdictEffects(n);
    }
  }
  proposeAidAction(r, data) {
    const n = r.nation;
    const { toNationId, sending } = data;
    const result = tradeAidSystem.proposeAid(this, n.id, toNationId, sending || {});
    if (!result.success) throw new Error(result.error);
    // Award XP for sending aid
    try {
      xpGoalsSystem.awardSendAid(1, { target: toNationId, type: 'aid' });
    } catch (e) {}
    this.refresh(r);
  }
  respondToAidAction(r, data) {
    const n = r.nation;
    const { slotId, accept } = data;
    const result = tradeAidSystem.respondToAid(this, slotId, n.id, accept === true);
    if (!result.success) throw new Error(result.error);
    const slot = tradeAidSystem._findSlot(slotId);
    if (slot && accept === true) {
      try {
        xpGoalsSystem.awardReceiveAid(1, { target: slot.fromNationId, type: 'aid' });
      } catch (e) {}
    }
    this.refresh(r);
  }
  proposeTradeAction(r, data) {
    const n = r.nation;
    const { toNationId, sending, receiving } = data;
    const result = tradeAidSystem.proposeTrade(this, n.id, toNationId, sending || {}, receiving || {});
    if (!result.success) throw new Error(result.error);
    // Award XP for proposing trade
    try {
      xpGoalsSystem.awardProposeTrade(1, { target: toNationId });
    } catch (e) {}
    this.refresh(r);
  }
  respondToTradeAction(r, data) {
    const n = r.nation;
    const { slotId, accept, counterOffer } = data;
    if (counterOffer) {
      const result = tradeAidSystem.respondToTrade(this, slotId, n.id, false, counterOffer);
      if (!result.success) throw new Error(result.error);
      // Award XP for countering
      try {
        xpGoalsSystem.awardProposeTrade(1, { target: slotId, isCounter: true });
      } catch (e) {}
    } else {
      const result = tradeAidSystem.respondToTrade(this, slotId, n.id, accept === true);
      if (!result.success) throw new Error(result.error);
      if (accept === true) {
        try {
          xpGoalsSystem.awardAcceptTrade(1, { target: slotId });
        } catch (e) {}
      } else {
        try {
          xpGoalsSystem.awardRejectTrade(1, { target: slotId });
        } catch (e) {}
      }
    }
    this.refresh(r);
  }
  respondToCounterAction(r, data) {
    const n = r.nation;
    const { slotId, accept } = data;
    const result = tradeAidSystem.respondToCounter(this, slotId, n.id, accept === true);
    if (!result.success) throw new Error(result.error);
    if (accept === true) {
      try {
        xpGoalsSystem.awardAcceptTrade(1, { target: slotId, isCounter: true });
      } catch (e) {}
    } else {
      try {
        xpGoalsSystem.awardRejectTrade(1, { target: slotId, isCounter: true });
      } catch (e) {}
    }
    this.refresh(r);
  }
  cureDiseaseAction(r, data) {
    const n = r.nation;
    const { outbreakId } = data;
    check(outbreakId && typeof outbreakId === "string", "Outbreak ID required");
    // Cure cost: $500,000 per outbreak
    const cureCost = 500000;
    check(n.money >= cureCost, `Insufficient funds: need $${cureCost.toLocaleString()}`);
    n.money -= cureCost;
    this.refresh(r);
  }
  trade(r, action, d, preview = false) {
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
      if (preview) return cost;
      this.pay(n, cost);
      if (offer.side === "sell") {
        n.resources[offer.resource] += offer.amount;
        maker.money += offer.amount * offer.price;
      } else {
        n.money += offer.amount * offer.price;
        maker.resources[offer.resource] += offer.amount;
      }
      delete this.state.offers[offer.id];
    }
  }
  worldBankPrice(resourceKey, stage = null, nation = null) {
    const price = this.resourceSystem.getWorldBankPrice(
      resourceKey,
      stage,
      this.state.globalResources,
      nation || null,
      this.state.worldBank,
    );
    return price.buyPrice;
  }
  worldBankAction(r, action, data) {
    const n = r.nation;
    const wb = this.state.worldBank;
    if (action === "worldBankLoan") {
      const amount = quantity(data.amount, 1_000_000_000);
      check(Number.isSafeInteger(amount) && amount > 0, "Invalid loan amount");
      const activeLoans = (n.loans || []).filter(
        (l) => l.status === "active",
      );
      check(
        activeLoans.length < 3,
        "Maximum 3 active loans from the World Bank",
      );
      const limit = Math.floor((n.taxRevenue || 0) * 52);
      check(amount <= limit, "Loan exceeds 1 year of tax revenue");
      const owed = Math.floor(amount * 1.2);
      n.loans ||= [];
      n.loans.push({
        id: randomUUID(),
        principal: amount,
        owed,
        rate: 0.2,
        takenAt: this.state.day,
        status: "active",
      });
      n.money += amount;
      this.refresh(r);

      // Persist world bank state to database
      saveWorldBank({
        id: 'world_bank',
        prices: this.state.worldBank.prices || {},
        targets: this.state.worldBank.targets || {},
        inventory: this.state.worldBank.inventory || {},
        seeded: this.state.worldBank.seeded !== false,
        loanRate: this.state.worldBank.loanRate || 0.02,
        loans: this.state.worldBank.loans || [],
      }).catch(err => console.error('Failed to persist world bank loan:', err.message));

      return;
    }
    if (action === "worldBankRepay") {
      const loanId = data.loanId;
      const amount = quantity(data.amount, 1_000_000_000);
      check(Number.isSafeInteger(amount) && amount > 0, "Invalid repayment");
      const loan = (n.loans || []).find((l) => l.id === loanId);
      check(loan && loan.status === "active", "Loan not found or not active");
      check(amount <= loan.owed, "Repayment exceeds amount owed");
      check(!this.affordability(n, { money: amount }).length, "Insufficient funds");
      this.pay(n, { money: amount });
      loan.owed -= amount;
      if (loan.owed <= 0) {
      loan.owed = 0;
      loan.status = "repaid";
      }
      this.refresh(r);

      // Persist world bank state to database
      saveWorldBank({
        id: 'world_bank',
        prices: this.state.worldBank.prices || {},
        targets: this.state.worldBank.targets || {},
        inventory: this.state.worldBank.inventory || {},
        seeded: this.state.worldBank.seeded !== false,
        loanRate: this.state.worldBank.loanRate || 0.02,
        loans: this.state.worldBank.loans || [],
      }).catch(err => console.error('Failed to persist world bank repay:', err.message));

      return;
    }
    if (action === "worldBankBuy") {
      check(
        this.catalog().resources.includes(data.resource),
        "Unknown resource",
      );
      const resourceKey = data.resource;
      const amount = quantity(data.amount, 1_000_000);
      check(Number.isSafeInteger(amount) && amount > 0, "Invalid quantity");
      const { buyPrice, preTaxPrice, taxRate } = this.resourceSystem.getWorldBankPrice(
        resourceKey,
        null,
        this.state.globalResources,
        n,
        this.state.worldBank,
      );
      const inventory = wb.inventory[resourceKey] || 0;
      check(inventory >= amount, "World Bank does not have enough stock");
      const cost = Math.floor(buyPrice * amount);
      check(
        !this.affordability(n, { money: cost }).length,
        "Insufficient funds",
      );
      this.pay(n, { money: cost });
      this.resourceSystem.addResource(n, resourceKey, amount);
      wb.inventory[resourceKey] = inventory - amount;
      // Route buy tax portion to the World Lottery pot
      this.state.lottery.pool = ((this.state.lottery && this.state.lottery.pool) || 0)
        + Math.floor(preTaxPrice * taxRate * amount);
      // Track food/water purchases for 72-hour price factor
      if (resourceKey === "food" || resourceKey === "water") {
        this.resourceSystem.recordFoodWaterPurchase(resourceKey, amount, this.state.worldBank);
      }
      this.refresh(r);

      // Persist world bank state to database
      saveWorldBank({
        id: 'world_bank',
        prices: this.state.worldBank.prices || {},
        targets: this.state.worldBank.targets || {},
        inventory: this.state.worldBank.inventory || {},
        seeded: this.state.worldBank.seeded !== false,
        loanRate: this.state.worldBank.loanRate || 0.02,
        loans: this.state.worldBank.loans || [],
        foodWaterPurchaseHistory: this.state.worldBank.foodWaterPurchaseHistory || {},
      }).catch(err => console.error('Failed to persist world bank buy:', err.message));

      return;
    }
    if (action === "worldBankSell") {
      check(
        this.catalog().resources.includes(data.resource),
        "Unknown resource",
      );
      const resourceKey = data.resource;
      const amount = quantity(data.amount, 1_000_000);
      check(Number.isSafeInteger(amount) && amount > 0, "Invalid quantity");
      check(
        this.resourceSystem.getResourceAmount(n, resourceKey) >= amount,
        "Not enough resources to sell",
      );
      const { sellPrice, preTaxPrice, taxRate } = this.resourceSystem.getWorldBankPrice(
        resourceKey,
        null,
        this.state.globalResources,
        n,
        this.state.worldBank,
      );
      const revenue = Math.floor(sellPrice * amount);
      this.resourceSystem.deductResource(n, resourceKey, amount);
      wb.inventory[resourceKey] = (wb.inventory[resourceKey] || 0) + amount;
      n.money += revenue;
      // Route sell tax withheld to the World Lottery pot
      this.state.lottery.pool = ((this.state.lottery && this.state.lottery.pool) || 0)
        + Math.floor(preTaxPrice * taxRate * amount);
      this.refresh(r);

      // Persist world bank state to database
      saveWorldBank({
        id: 'world_bank',
        prices: this.state.worldBank.prices || {},
        targets: this.state.worldBank.targets || {},
        inventory: this.state.worldBank.inventory || {},
        seeded: this.state.worldBank.seeded !== false,
        loanRate: this.state.worldBank.loanRate || 0.02,
        loans: this.state.worldBank.loans || [],
        foodWaterPurchaseHistory: this.state.worldBank.foodWaterPurchaseHistory || {},
      }).catch(err => console.error('Failed to persist world bank sell:', err.message));

      return;
    }
    throw new Error("Unknown World Bank action");
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
      const acronym = text(d.acronym || "", "Acronym", 10, 0);
      const color = d.color && /^#[0-9A-Fa-f]{6}$/.test(d.color)
        ? d.color
        : "#ffffff";
      const aid = randomUUID(),
        template = this.base.allianceTemplates[d.government];
      this.state.alliances[aid] = {
        id: aid,
        name,
        acronym,
        color,
        description: text(d.description || "", "Description", 2000, 0),
        government: d.government,
        founder: id,
        members: { [id]: template.roles[0].id },
        applications: [],
        treasury: 0,
        open: true,
        createdAt: this.clock(),
        colorChangedAt: this.clock(),
        governmentChangedAt: 0,
        skills: {},
        skillPoints: 0,
        statistics: {
          warsWon: 0,
          warsLost: 0,
          treatiesSigned: 0,
          territoryGained: 0,
          totalDamageDealt: 0,
          membersRecruited: 0,
          projectsCompleted: 0
        },
        treaties: [],
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
      case "allianceEditSettings": {
        check(id === a.founder || this.hasPermission(a, id, "domestic"), "Your alliance role cannot perform this action");
        const now = this.clock();
        const COLOR_COOLDOWN = 30 * 24 * 60 * 60 * 1000;
        const GOVERNMENT_COOLDOWN = 90 * 24 * 60 * 60 * 1000;
        if (d.description !== undefined) {
          a.description = text(d.description, "Description", 2000, 0);
        }
        if (d.acronym !== undefined) {
          a.acronym = text(d.acronym, "Acronym", 10, 0);
        }
        if (d.name && d.name !== a.name) {
          const name = text(d.name, "Alliance name", 60, 3);
          check(
            !Object.values(this.state.alliances).some(
              (x) => x.id !== a.id && x.name.toLowerCase() === name.toLowerCase(),
            ),
            "Alliance name already exists",
          );
          a.name = name;
        }
        if (d.color && /^#[0-9A-Fa-f]{6}$/.test(d.color) && d.color !== a.color) {
          const last = a.colorChangedAt || 0;
          check(now - last >= COLOR_COOLDOWN, `Alliance color change on cooldown (30 days).`);
          a.color = d.color;
          a.colorChangedAt = now;
        }
        if (d.government && d.government !== a.government) {
          const template = this.base.allianceTemplates[d.government];
          check(template, "Unknown government type");
          const last = a.governmentChangedAt || 0;
          check(now - last >= GOVERNMENT_COOLDOWN, `Alliance government change on cooldown (90 days).`);
          a.government = d.government;
          a.governmentChangedAt = now;
          a.members = { [id]: template.roles[0].id };
        }
        break;
      }
      case "allianceUpgradeSkill": {
        check(id === a.founder || this.hasPermission(a, id, "all"), "Your alliance role cannot perform this action");
        const skillKey = d.skill;
        const def = this.base.allianceSkills?.[skillKey];
        check(def, "Unknown alliance skill");
        const cur = (a.skills && a.skills[skillKey]) || { level: 0 };
        check(cur.level < (def.maxLevel || 10), "Skill already at maximum level");
        const cost = Math.floor(def.baseCost * Math.pow(def.costMultiplier, cur.level));
        check((a.skillPoints || 0) >= cost, "Insufficient alliance skill points");
        a.skills = a.skills || {};
        a.skills[skillKey] = { level: cur.level + 1, pointsSpent: (cur.pointsSpent || 0) + cost, effects: def.effects ? def.effects(cur.level + 1) : {} };
        a.skillPoints = (a.skillPoints || 0) - cost;
        a.statistics = a.statistics || {};
        break;
      }
      case "allianceRemoveTreaty": {
        permitted("diplomacy");
        const index = Number(d.treaty);
        check(Number.isFinite(index) && index >= 0 && index < (a.treaties || []).length, "Invalid treaty");
        a.treaties.splice(index, 1);
        break;
      }
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
        check(id === a.founder || this.hasPermission(a, id, "members"), "Your alliance role cannot perform this action");
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
  defaultMotionTypes() {
    const types = {};
    const add = (key, def) => {
      types[key] = def;
    };
    const world = (key, def) => add(key, { ...def, scope: "world", requiresWonder: "internet", canPropose: ["congress_only"] });
    const color = (key, def) => add(key, { ...def, scope: "color", requiresProject: "broadcasting", canPropose: ["faction_members"] });
    // ══ COLOR BLOC ══
    color("COLOR_EXPERIENCE_SURGE", { name: "Experience Surge Initiative", description: "Boost XP gain for faction members with energy cost increase", minSupport: 0.45 });
    color("COLOR_ENERGY_REGENERATION", { name: "Enhanced Energy Recovery", description: "Increase energy regeneration for faction members with happiness penalty", minSupport: 0.4 });
    color("COLOR_MILITARY_TRAINING", { name: "Military Training Program", description: "Enhanced military effectiveness with military upkeep increase", minSupport: 0.55 });
    color("COLOR_TECH_SHARING", { name: "Technology Sharing Initiative", description: "Accelerated research points for faction members", minSupport: 0.6 });
    color("COLOR_INFRASTRUCTURE_PUSH", { name: "Infrastructure Development Push", description: "Building cost reduction with population growth penalty", minSupport: 0.5 });
    color("COLOR_DEFENSIVE_PACT", { name: "Faction Defense Alliance", description: "Enhanced defensive bonuses when attacked by external factions", minSupport: 0.65 });
    color("COLOR_ECONOMIC_STIMULUS", { name: "Economic Stimulus Package", description: "Currency generation boost with inflation effects", minSupport: 0.55 });
    color("COLOR_HAPPINESS_CAMPAIGN", { name: "Morale Boosting Campaign", description: "Happiness increase with productivity slight decrease", minSupport: 0.4 });
    color("COLOR_ADVANCED_HEALTHCARE", { name: "Advanced Faction Healthcare", description: "Raise happiness, lower disease, lower taxable income for faction members", minSupport: 0.55 });
    color("COLOR_GREEN_GOALS", { name: "Faction Green Goals", description: "Raise environment, lower pollution, lower taxable income for faction members", minSupport: 0.55 });
    color("COLOR_CHILD_LABOR", { name: "Faction Child Labor Act", description: "Allow children to work/taxed at full rate, lower happiness", minSupport: 0.5 });
    color("COLOR_NEW_BUILD_OBJECTIVE", { name: "Faction New Build Objective", description: "Lower land/infra purchase cost, raise upkeep", minSupport: 0.55 });
    color("COLOR_RESTORATION_ACT", { name: "Faction Restoration Act", description: "Lower land/infra upkeep, raise purchase cost", minSupport: 0.55 });
    // ══ WORLD ══
    world("WORLD_CALENDAR_CHANGE", { name: "World Calendar Modification", description: "Alter the world calendar system", minSupport: 0.65, neutral: true });
    world("WORLD_NAME_CHANGE", { name: "World Rename Proposal", description: "Change the official name of the game world", minSupport: 0.6, neutral: true });
    world("WORLD_MILITARY_LIMITATION", { name: "Military Size Restrictions", description: "Limit maximum military unit counts globally", minSupport: 0.75 });
    world("WORLD_TECHNOLOGY_SHARING", { name: "Mandatory Technology Sharing", description: "Force sharing of research points above thresholds", minSupport: 0.8 });
    world("WORLD_ENVIRONMENTAL_PROTECTION", { name: "Environmental Protection Act", description: "Limit pollution-causing activities with production penalties", minSupport: 0.65 });
    world("WORLD_PEACE_TREATY", { name: "Global Peace Enforcement", description: "Temporary ban on all military conflicts", minSupport: 0.85 });
    world("ANTI_NUCLEAR_MANDATE", { name: "Anti-Nuclear Mandate", description: "Ban nuclear weapon production for 30 days", minSupport: 0.7, isNuclearBan: true, banType: "production" });
    world("ANTI_NUCLEAR_LAUNCH_BAN", { name: "Anti-Nuclear Launch Ban", description: "Ban nuclear weapon launching for 30 days", minSupport: 0.7, isNuclearBan: true, banType: "launch" });
    world("ANTI_MISSILE_MANDATE", { name: "Anti-Missile Mandate", description: "Ban missile production for 30 days", minSupport: 0.65, isMissileBan: true, banType: "production" });
    world("ANTI_MISSILE_LAUNCH_BAN", { name: "Anti-Missile Launch Ban", description: "Ban missile launching for 30 days", minSupport: 0.65, isMissileBan: true, banType: "launch" });
    world("FACTION_SANCTION", { name: "Faction Sanctions", description: "Impose sanctions on a faction", minSupport: 0.65, isSanction: true, sanctionBlocks: ["attack", "aid", "diplomacy", "color_interaction"], duration: "30 days" });
    world("WORLD_TAX", { name: "World Tax", description: "Implement a global tax rate for world projects", minSupport: 0.7, fixedEffects: { worldTaxRate: 0.05, purpose: "infrastructure" }, duration: "90 days" });
    world("HEAVY_MISSILE_OBJECTIVE", { name: "Heavy Missile Objective", description: "Increase infrastructure destroyed by missiles by 15% for 30 days", minSupport: 0.6, isMissileObjective: true, fixedEffects: { missileInfraDamageBoost: 15 } });
    world("ADVANCED_GLOBAL_HEALTHCARE", { name: "Advanced Global Healthcare", description: "Raise happiness, lower disease, lower taxable income", minSupport: 0.65, fixedEffects: { happinessBoost: 15, diseaseRateReduction: 10, taxableIncomePenalty: 10 } });
    world("GREEN_GOALS", { name: "Green Goals", description: "Raise environment, lower pollution, lower taxable income", minSupport: 0.65, fixedEffects: { environmentBoost: 10, pollutionReduction: 30, taxableIncomePenalty: 10 } });
    world("CHILD_LABOR", { name: "Child Labor Act", description: "Allow children to work at full rate, lower happiness by 50", minSupport: 0.55, fixedEffects: { childLaborEnabled: true, happinessPenalty: 50 } });
    world("NEW_BUILD_OBJECTIVE", { name: "New Build Objective", description: "Lower land/infra purchase cost, raise upkeep for 30 days", minSupport: 0.6, fixedEffects: { landPurchaseDiscount: 15, infraPurchaseDiscount: 15, landUpkeepIncrease: 10, infraUpkeepIncrease: 10 } });
    world("RESTORATION_ACT", { name: "Restoration Act", description: "Lower land/infra upkeep, raise purchase cost for 30 days", minSupport: 0.6, fixedEffects: { landUpkeepDiscount: 15, infraUpkeepDiscount: 15, landPurchaseIncrease: 10, infraPurchaseIncrease: 10 } });
    // ══ WORLD BANK ══
    world("WORLD_INTEREST_RATE_ADJUST", { name: "World Bank Interest Rate Adjustment", description: "Adjust the World Bank loan interest rate globally.", minSupport: 0.6, parameters: ["newRate"] });
    world("WORLD_LOAN_LIMIT_ADJUST", { name: "World Bank Loan Limit Adjustment", description: "Adjust the maximum loan multiplier relative to annual tax revenue.", minSupport: 0.6, parameters: ["newLimitMultiplier"] });
    world("WORLD_LOTTERY_FUNDING_BOOST", { name: "Lottery Funding Boost", description: "Increase World Bank contributions to the National Pet Lottery pool.", minSupport: 0.55, parameters: ["boostPct"] });
    // ══ WORLD FORUM ══
    world("FREE_SPEECH_PROTECTION", { name: "Free Speech Protection", description: "Disable forum moderation for 30 days", minSupport: 0.6, isWorldForumMotion: true, fixedEffects: { forumModerationDisabled: true } });
    world("CONGRESSIONAL_TERM_LIMITS", { name: "Congressional Term Limits", description: "Limit motions per faction per day", minSupport: 0.55, isWorldForumMotion: true, fixedEffects: { maxMotionsPerFactionPerDay: 3 } });
    world("SUPERMAJORITY_REQUIREMENT", { name: "Supermajority Requirement", description: "Change vote threshold to 66% for sanctions", minSupport: 0.6, isWorldForumMotion: true, fixedEffects: { sanctionVoteThreshold: 0.66 } });
    return types;
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
  // ════════════════════════════════════════════════════════════════════════════
  // GLOBAL WORLD STATE (global averages, disease stats, active global disease)
  // ════════════════════════════════════════════════════════════════════════════
  GLOBAL_DISEASES = {
    minor: [
      { id: 'seasonal_flu', name: 'Seasonal Flu', severity: 'minor', description: 'A common respiratory illness spreading across the world.' },
      { id: 'common_cold', name: 'Common Cold', severity: 'minor', description: 'A mild viral infection affecting populations worldwide.' },
      { id: 'hay_fever', name: 'Hay Fever', severity: 'minor', description: 'Seasonal allergies causing discomfort across regions.' },
    ],
    major: [
      { id: 'cholera', name: 'Cholera', severity: 'major', description: 'A waterborne disease causing severe dehydration and intestinal distress.' },
      { id: 'malaria', name: 'Malaria', severity: 'major', description: 'A mosquito-borne infectious disease affecting large populations.' },
      { id: 'tuberculosis', name: 'Tuberculosis', severity: 'major', description: 'A serious infectious bacterial disease primarily affecting the lungs.' },
    ],
    severe: [
      { id: 'plague', name: 'Plague', severity: 'severe', description: 'A rare but deadly bacterial infection with high mortality.' },
      { id: 'ebola', name: 'Ebola', severity: 'severe', description: 'A severe, often fatal viral hemorrhagic fever.' },
      { id: 'covid_like', name: 'Global Respiratory Syndrome', severity: 'severe', description: 'A highly contagious novel respiratory illness spreading globally.' },
    ],
  };
  /**
   * Compute global averages and disease stats from every nation's nationStats.
   */
  computeGlobalWorld() {
    const nations = [...this.rules.values()].map((r) => r.nation);
    const count = nations.length;
    if (count === 0) {
      return {
        globalAverages: { happiness: 50, pollution: 0, disease: 0, crime: 0, environment: 50, literacyRate: 50 },
        diseaseStats: { totalNations: 0, nationsWithMinorDisease: 0, nationsWithMajorDisease: 0, pctWithMinorDisease: 0, pctWithMajorDisease: 0, totalMinorOutbreaks: 0, totalMajorOutbreaks: 0 },
        activeGlobalDisease: this.state.globalWorld?.activeGlobalDisease || null,
        globalDiseaseSpawnChance: 0,
      };
    }

    let sumHappiness = 0;
    let sumPollution = 0;
    let sumDisease = 0;
    let sumCrime = 0;
    let sumEnvironment = 0;
    let sumLiteracy = 0;
    let nationsWithMinorDisease = 0;
    let nationsWithMajorDisease = 0;
    let totalMinorOutbreaks = 0;
    let totalMajorOutbreaks = 0;

    for (const n of nations) {
      const ns = n.nationStats || {};
      sumHappiness += ns.happiness !== undefined ? ns.happiness : 50;
      sumPollution += ns.pollution !== undefined ? ns.pollution : 0;
      sumDisease += ns.disease !== undefined ? ns.disease : 10;
      sumCrime += ns.crime !== undefined ? ns.crime : 15;
      sumEnvironment += ns.environment !== undefined ? ns.environment : 50;
      sumLiteracy += ns.literacy !== undefined ? ns.literacy : 0;

      const disease = ns.disease || 0;
      if (disease > 0 && disease < 40) {
        nationsWithMinorDisease++;
        totalMinorOutbreaks++;
      } else if (disease >= 40) {
        nationsWithMajorDisease++;
        totalMajorOutbreaks++;
      }
    }

    const avg = (value) => count ? Math.round((value / count) * 100) / 100 : 0;

    // Disease spawn chance: higher when global pollution/disease high, happiness/environment low
    const gw = this.state.globalWorld || {};
    let chance = 0.01; // 1% base per day
    const pollutionAvg = avg(sumPollution);
    const diseaseAvg = avg(sumDisease);
    const happinessAvg = avg(sumHappiness);
    const environmentAvg = avg(sumEnvironment);
    if (pollutionAvg > 60) chance *= 1 + ((pollutionAvg - 60) / 100) * 1.5;
    if (diseaseAvg > 30) chance *= 1 + (diseaseAvg - 30) / 100;
    if (happinessAvg < 40) chance *= 1 + ((40 - happinessAvg) / 40) * 1.5;
    if (environmentAvg < 40) chance *= 1 + ((40 - environmentAvg) / 40) * 0.5;

    const activeGlobalDisease = gw.activeGlobalDisease || null;

    return {
      globalAverages: {
        happiness: avg(sumHappiness),
        pollution: avg(sumPollution),
        disease: avg(sumDisease),
        crime: avg(sumCrime),
        environment: avg(sumEnvironment),
        literacyRate: avg(sumLiteracy),
      },
      diseaseStats: {
        totalNations: count,
        nationsWithMinorDisease: nationsWithMinorDisease,
        nationsWithMajorDisease: nationsWithMajorDisease,
        pctWithMinorDisease: count ? Math.round((nationsWithMinorDisease / count) * 100) : 0,
        pctWithMajorDisease: count ? Math.round((nationsWithMajorDisease / count) * 100) : 0,
        totalMinorOutbreaks,
        totalMajorOutbreaks,
      },
      activeGlobalDisease,
      globalDiseaseSpawnChance: Math.round(chance * 10000) / 100,
    };
  }
  /**
   * Roll for a global disease spawn on day change. Uses GLOBAL_DISEASES data.
   */
  rollGlobalDiseaseSpawn() {
    const gw = this.computeGlobalWorld();
    if (gw.activeGlobalDisease) return; // one global disease at a time
    if (Math.random() >= gw.globalDiseaseSpawnChance / 100) return;

    const severityPool = [];
    const pollution = gw.globalAverages.pollution;
    const disease = gw.globalAverages.disease;
    const happiness = gw.globalAverages.happiness;
    const environment = gw.globalAverages.environment;

    let weights = { minor: 1.0, major: 0.3, severe: 0.1 };
    if (pollution > 60) { weights.major *= 1.5; weights.severe *= 2.0; }
    if (disease > 30) { weights.major *= 1.2; weights.severe *= 1.2; }
    if (happiness < 40) { weights.major *= 1.2; weights.severe *= 1.5; }
    if (environment < 40) { weights.major *= 1.2; weights.severe *= 1.2; }

    for (const [severity, weight] of Object.entries(weights)) {
      const list = this.GLOBAL_DISEASES[severity] || [];
      const count = Math.max(1, Math.floor(weight * 10));
      for (let i = 0; i < count; i++) severityPool.push(list[Math.floor(Math.random() * list.length)]);
    }

    if (severityPool.length === 0) return;
    const pickedDisease = severityPool[Math.floor(Math.random() * severityPool.length)];
    this.state.globalWorld = this.state.globalWorld || {};
    this.state.globalWorld.activeGlobalDisease = {
      ...pickedDisease,
      spawnedAt: this.state.day,
      funded: 0,
      cureTarget: pickedDisease.severity === 'severe' ? 50000000 : pickedDisease.severity === 'major' ? 20000000 : 5000000,
    };
  }
  /**
   * Fund the cure for the active global disease.
   */
  fundGlobalDiseaseCure(r, amount) {
    const n = r.nation;
    amount = Number(amount);
    if (!amount || amount <= 0) throw new Error('Invalid funding amount');
    const reasons = this.affordability(n, { money: amount });
    if (reasons.length) throw new Error('Insufficient funds');
    const gw = this.state.globalWorld || {};
    const disease = gw.activeGlobalDisease;
    if (!disease) throw new Error('No active global disease to fund');
    this.pay(n, { money: amount });
    disease.funded = (disease.funded || 0) + amount;
    if (disease.funded >= disease.cureTarget) {
      disease.cured = true;
      disease.curedAt = this.state.day;
    }
    this.refresh(r);
  }
  forumAccess(n, scope) {
    return scope === "world"
      ? !!(n.projects.broadcasting && n.wonders.internet)
      : !!n.projects.broadcasting;
  }
  // ════════════════════════════════════════════════════════════════════════════
  // CURRENCY RATES
  // ════════════════════════════════════════════════════════════════════════════
  getCurrencyRate(currencyKey) {
    const rates = (this.state.worldBank && this.state.worldBank.currencyRates) || {};
    const cfg = CURRENCIES[currencyKey];
    if (!cfg) return 100;
    return rates[currencyKey] !== undefined ? rates[currencyKey] : cfg.baseRate;
  }
  getCurrencyConfig() {
    const rates = (this.state.worldBank && this.state.worldBank.currencyRates) || {};
    const out = {};
    for (const [key, cfg] of Object.entries(CURRENCIES)) {
      out[key] = { ...cfg, rate: rates[key] !== undefined ? rates[key] : cfg.baseRate };
    }
    return out;
  }
  // ════════════════════════════════════════════════════════════════════════════
  // WORLD LOTTERY (server-side)
  // ════════════════════════════════════════════════════════════════════════════
  _getLotteryState() {
    return this.state.lottery ||= {
      pool: 0,
      tickets: {},
      nextTicketId: 1,
      drawings: [],
      currentDrawing: null,
      lastDrawing: null,
    };
  }
  _getWeekStart(date = null) {
    const d = date || new Date();
    const weekStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    weekStart.setUTCDate(weekStart.getUTCDate() - d.getUTCDay());
    weekStart.setUTCHours(0, 0, 0, 0);
    return weekStart;
  }
  _scheduleLotteryDrawing() {
    const lottery = this._getLotteryState();
    if (lottery.currentDrawing && lottery.currentDrawing.status === 'open') return;
    const weekStart = this._getWeekStart();
    const now = new Date();
    // Pick a random valid hour this week (avoid Sat 22-23 and Sun 0-1)
    const validSlots = [];
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      for (let hour = 0; hour < 24; hour++) {
        const candidate = new Date(weekStart);
        candidate.setUTCDate(candidate.getUTCDate() + dayOffset);
        candidate.setUTCHours(hour, 0, 0, 0);
        const day = candidate.getUTCDay(), h = candidate.getUTCHours();
        if (day === 6 && h >= 22) continue;
        if (day === 0 && h <= 1) continue;
        validSlots.push(candidate.getTime());
      }
    }
    let drawTime = validSlots[Math.floor(Math.random() * validSlots.length)];
    if (new Date(drawTime) <= now) drawTime += 7 * 24 * 60 * 60 * 1000;
    lottery.currentDrawing = {
      weekStart: weekStart.getTime(),
      drawTime,
      status: 'open',
      ticketsSold: 0,
    };
  }
  _isLotteryTime() {
    const lottery = this._getLotteryState();
    return lottery.currentDrawing && lottery.currentDrawing.status === 'open'
      && Date.now() >= lottery.currentDrawing.drawTime;
  }
  runLotteryDrawing() {
    const lottery = this._getLotteryState();
    if (!this._isLotteryTime()) return { ok: false, reason: 'No drawing due' };
    const shuffled = [...PET_ICONS_UNIQUE].sort(() => 0.5 - Math.random());
    const winningNumbers = shuffled.slice(0, 5);
    const winningMultiplier = shuffled[5];
    const allWinning = [...winningNumbers, winningMultiplier];

    const drawResult = {
      drawTime: new Date().toISOString(),
      winningNumbers,
      multiplier: winningMultiplier,
      allWinning,
      poolBefore: lottery.pool,
      winners: [],
      totalPayout: 0,
    };

    const jackpotWinners = [];
    const secondaryWinners = [];
    const ticketResults = {};

    for (const [ticketId, ticket] of Object.entries(lottery.tickets)) {
      const matchResult = this._checkLotteryTicket(ticket, winningNumbers, winningMultiplier);
      ticketResults[ticketId] = {
        ticketId: Number(ticketId),
        nationId: ticket.nationId,
        nationName: ticket.nationName,
        numbers: [...ticket.numbers],
        multiplier: ticket.multiplier,
        matches: matchResult.matches,
        hasMultiplierMatch: matchResult.hasMultiplierMatch,
        tier: matchResult.tier,
        prize: matchResult.prize,
        winningNumbers: [...allWinning],
        drawTime: drawResult.drawTime,
      };
      if (matchResult.prize > 0) {
        const winner = { ticketId: Number(ticketId), nationId: ticket.nationId, nationName: ticket.nationName, matches: matchResult.matches, hasMultiplierMatch: matchResult.hasMultiplierMatch, tier: matchResult.tier, prize: matchResult.prize, numbers: [...ticket.numbers], multiplier: ticket.multiplier };
        (matchResult.tier === 'JACKPOT' ? jackpotWinners : secondaryWinners).push(winner);
      }
    }

    let totalPayout = 0;
    if (jackpotWinners.length > 0) {
      const share = Math.floor(lottery.pool / jackpotWinners.length);
      for (const w of jackpotWinners) { w.prize = share; w.tier = 'JACKPOT'; drawResult.winners.push(w); totalPayout += share; }
    } else {
      const tierGroups = {};
      for (const w of secondaryWinners) { (tierGroups[w.tier] ||= []).push(w); }
      for (const [tier, winners] of Object.entries(tierGroups)) {
        const pct = ({ JACKPOT: 1, FOUR_PLUS_M: 0.04, FIVE: 0.02, THREE_PLUS_M: 0.00015, FOUR: 0.0001, THREE: 0.00005 }[tier] || 0);
        const tierPool = Math.floor(lottery.pool * pct);
        const share = Math.floor(tierPool / winners.length);
        for (const w of winners) { w.prize = share; drawResult.winners.push(w); totalPayout += share; }
      }
    }
    for (const w of drawResult.winners) {
      const existing = ticketResults[w.ticketId];
      if (existing) { existing.prize = w.prize; existing.tier = w.tier; }
    }
    for (const [ticketId, result] of Object.entries(ticketResults)) {
      lottery.drawings.push(result);
    }
    if (lottery.drawings.length > 52) lottery.drawings = lottery.drawings.slice(-52);

    lottery.pool = Math.max(0, lottery.pool - totalPayout);
    if (jackpotWinners.length > 0) {
      lottery.pool = Math.floor((drawResult.poolBefore - totalPayout + lottery.pool) * 0.0001) || 0;
    }

    this._recordLotteryUnclaimed(drawResult);
    lottery.lastDrawing = drawResult;
    lottery.currentDrawing.status = 'closed';
    lottery.tickets = {};
    return { ok: true, result: drawResult };
  }
  _checkLotteryTicket(ticket, winningNumbers, winningMultiplier) {
    let matches = 0;
    for (const num of ticket.numbers) if (winningNumbers.includes(num)) matches++;
    const hasMultiplierMatch = ticket.multiplier === winningMultiplier;
    let tier = null, prize = 0;
    const pool = this._getLotteryState().pool;
    if (matches === 5 && hasMultiplierMatch) { tier = 'JACKPOT'; prize = pool; }
    else if (matches === 5) { tier = 'FIVE'; prize = Math.floor(pool * 0.02); }
    else if (matches === 4 && hasMultiplierMatch) { tier = 'FOUR_PLUS_M'; prize = Math.floor(pool * 0.04); }
    else if (matches === 4) { tier = 'FOUR'; prize = Math.floor(pool * 0.0001); }
    else if (matches === 3 && hasMultiplierMatch) { tier = 'THREE_PLUS_M'; prize = Math.floor(pool * 0.00015); }
    else if (matches === 3) { tier = 'THREE'; prize = Math.floor(pool * 0.00005); }
    return { matches, hasMultiplierMatch, tier, prize };
  }
  _recordLotteryUnclaimed(drawResult) {
    const lottery = this._getLotteryState();
    const expiresAt = Date.now() + CLAIM_WINDOW_MS;
    for (const w of drawResult.winners) {
      lottery.tickets = lottery.tickets || {};
      const unclaimedKey = `uc_${w.ticketId}`;
      (lottery.unclaimed ||= {})[unclaimedKey] = {
        ticketId: w.ticketId,
        nationId: w.nationId,
        nationName: w.nationName,
        tier: w.tier,
        prize: w.prize,
        drawTime: drawResult.drawTime,
        expiresAt,
        claimed: false,
      };
    }
  }
  lotteryPurchase(r, count, ticketPicks) {
    const n = r.nation;
    const lottery = this._getLotteryState();
    this._scheduleLotteryDrawing();
    if (!lottery.currentDrawing || lottery.currentDrawing.status !== 'open') throw new Error('No active lottery drawing');
    let effectiveCount = ticketPicks ? ticketPicks.length : Math.floor(count);
    if (effectiveCount < 1 || effectiveCount > MAX_TICKETS_PER_NATION) throw new Error(`Can only buy 1-${MAX_TICKETS_PER_NATION} tickets per drawing`);
    const existing = Object.values(lottery.tickets).filter((t) => t.nationId === n.id).length;
    if (existing + effectiveCount > MAX_TICKETS_PER_NATION) throw new Error(`Already have ${existing} tickets, max ${MAX_TICKETS_PER_NATION} per drawing`);
    const totalCost = effectiveCount * TICKET_COST;
    const reasons = this.affordability(n, { money: totalCost });
    if (reasons.length) throw new Error('Insufficient funds');
    this.pay(n, { money: totalCost });
    const purchased = [];
    const picksToUse = ticketPicks || [];
    for (let i = 0; i < effectiveCount; i++) {
      let ticket;
      if (picksToUse[i]) {
        ticket = this._createCustomLotteryTicket(n, picksToUse[i], lottery.nextTicketId++);
      } else {
        ticket = this._generateLotteryTicket(n, lottery.nextTicketId++);
      }
      lottery.tickets[ticket.id] = ticket;
      purchased.push(ticket);
      lottery.currentDrawing.ticketsSold = (lottery.currentDrawing.ticketsSold || 0) + 1;
    }
    lottery.pool += totalCost;
    this.refresh(r);
    return { ok: true, tickets: purchased, totalCost };
  }
  _generateLotteryTicket(nation, id) {
    const shuffled = [...PET_ICONS_UNIQUE].sort(() => 0.5 - Math.random());
    const picks = shuffled.slice(0, TICKET_PICK_COUNT);
    return {
      id,
      nationId: nation.id,
      nationName: nation.name,
      numbers: picks.slice(0, 5),
      multiplier: picks[5],
      purchasedAt: Date.now(),
      cost: TICKET_COST,
      customPick: false,
    };
  }
  _createCustomLotteryTicket(nation, pick, id) {
    return {
      id,
      nationId: nation.id,
      nationName: nation.name,
      numbers: [...pick.numbers],
      multiplier: pick.multiplier,
      purchasedAt: Date.now(),
      cost: TICKET_COST,
      customPick: true,
    };
  }
  validateLotteryPicks(picks) {
    if (!Array.isArray(picks) || picks.length === 0) return { valid: false, reason: 'No picks provided' };
    if (picks.length > MAX_TICKETS_PER_NATION) return { valid: false, reason: `Max ${MAX_TICKETS_PER_NATION} tickets per drawing` };
    for (const pick of picks) {
      if (!pick || !Array.isArray(pick.numbers) || pick.numbers.length !== 5) return { valid: false, reason: 'Each ticket needs exactly 5 pet numbers' };
      if (!pick.multiplier) return { valid: false, reason: 'Each ticket needs a multiplier pet' };
      const allSix = [...pick.numbers, pick.multiplier];
      if (new Set(allSix).size !== 6) return { valid: false, reason: 'All 6 pets on a ticket must be unique' };
      for (const pet of allSix) if (!PET_ICONS_UNIQUE.includes(pet)) return { valid: false, reason: `Invalid pet icon: ${pet}` };
    }
    return { valid: true };
  }
  lotteryClaim(r, ticketId) {
    ticketId = Number(ticketId);
    const n = r.nation;
    const lottery = this._getLotteryState();
    const unclaimed = (lottery.unclaimed || {})[`uc_${ticketId}`];
    if (!unclaimed) throw new Error('No unclaimed winnings for this ticket');
    if (unclaimed.claimed) throw new Error('Prize already claimed');
    if (unclaimed.nationId !== n.id) throw new Error('Ticket does not belong to this nation');
    if (Date.now() > unclaimed.expiresAt) { unclaimed.claimed = true; unclaimed.expired = true; throw new Error('Prize expired'); }
    const prize = unclaimed.prize;
    n.money = (n.money || 0) + prize;
    unclaimed.claimed = true;
    unclaimed.claimedAt = Date.now();
    this.refresh(r);
    return { ok: true, prize, tier: unclaimed.tier };
  }
  forumAction(r, action, d, preview = false) {
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
        title = text(d.title, "Motion title", 120, 3),
        body = text(d.body, "Motion description", 5000, 10);
      if (preview) return;
      const id = randomUUID();
      this.state.motions[id] = {
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
      };
      // Award XP for proposing forum motions
      try {
        if (def.scope === 'world') {
          xpGoalsSystem.awardProposeWorldMotion(1, { motionId: id, motionType: d.type });
        } else if (def.scope === 'color') {
          xpGoalsSystem.awardProposeColorMotion(1, { motionId: id, motionType: d.type });
        }
      } catch(e) {}
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
      // Award XP for voting on forum motions
      try {
        if (m.scope === 'world') {
          xpGoalsSystem.awardVoteWorldMotion(1, { motionId: m.id, motionType: m.type, vote: d.vote });
        } else if (m.scope === 'color') {
          xpGoalsSystem.awardVoteColorMotion(1, { motionId: m.id, motionType: m.type, vote: d.vote });
        }
      } catch(e) {}
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
        // Award XP for accepting/rejecting a treaty
        try {
          if (d.accept === true) {
            const now = Date.now();
            const fromNation = t.from;
            const toNation = t.to;
            const treatyType = t.type;
            // Check 28-day cooldown between this nation pair for ANY treaty type
            if (xpGoalsSystem.canAwardTreatyXP(fromNation, toNation, now)) {
              // Proposer gets higher XP (they initiated and got it accepted)
              xpGoalsSystem.awardTreatyAcceptedProposer(treatyType, { treatyType, target: t.from, acceptedBy: t.to });
              // Acceptor gets lower XP
              xpGoalsSystem.awardTreatyAcceptedAcceptor(treatyType, { treatyType, target: t.to, acceptedFrom: t.from });
              // Record cooldown for this nation pair
              xpGoalsSystem.recordTreatyXP(fromNation, toNation, now);
              // Alliance-wide XP: if either nation is in an alliance, award to all alliance members
              const fromNat = this.nation(fromNation);
              const toNat = this.nation(toNation);
              const fromAlliance = fromNat?.allianceId;
              const toAlliance = toNat?.allianceId;
              const allianceMembers = new Set();
              if (fromAlliance) {
                const members = xpGoalsSystem.getAllianceMembers(fromAlliance) || [];
                members.forEach(m => allianceMembers.add(m));
              }
              if (toAlliance) {
                const members = xpGoalsSystem.getAllianceMembers(toAlliance) || [];
                members.forEach(m => allianceMembers.add(m));
              }
              allianceMembers.forEach(memberId => {
                if (memberId !== fromNation && memberId !== toNation) {
                  // Alliance members get acceptor-level XP (they didn't propose)
                  xpGoalsSystem.awardTreatyAcceptedAcceptor(treatyType, { treatyType, target: memberId, acceptedFrom: t.from, allianceBonus: true });
                }
              });
            }
          } else {
            xpGoalsSystem.awardRejectTreaty(1, { treatyType: t.type, target: t.from });
          }
        } catch(e) {}
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
      const isRemoval = d.relationship === "neutral";
      if (isRemoval) {
        // 7-day cooldown: cannot remove a relationship within 7 days of adding it
        n.relationshipAddedDay = n.relationshipAddedDay || {};
        const lastAdded = n.relationshipAddedDay[other.id];
        if (lastAdded !== undefined && this.state.day - lastAdded < 7) {
          const daysLeft = 7 - (this.state.day - lastAdded);
          check(false, `Cannot remove relationship with ${other.name} for ${daysLeft} more day(s).`);
        }
        delete n.relationships[other.id];
        delete n.relationshipAddedDay[other.id];
      } else {
        // Adding/changing a relationship — always allowed, record the day
        n.relationshipAddedDay = n.relationshipAddedDay || {};
        n.relationshipAddedDay[other.id] = this.state.day;
        n.relationships[other.id] = d.relationship;
      }
      // Award XP for relationship changes
      try {
        const relXPMap = {
          friend: "addFriend",
          bestFriend: "addBestFriend",
          foe: "addFoe",
          nemesis: "addNemesis",
        };
        const xpSource = relXPMap[d.relationship];
        if (xpSource) {
          xpGoalsSystem[xpSource](1, { target: other.id });
        }
      } catch(e) {}
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
      // Award XP for proposing a treaty
      try { xpGoalsSystem.awardProposeTreaty(1, { treatyType: d.type, target: other.id }); } catch(e) {}
    }
  }
  warAction(r, action, d, preview = false) {
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
      const reason = text(d.reason || "Territorial dispute", "Reason", 300);
      if (preview) return;
      const id = randomUUID();
      this.state.wars[id] = {
        id,
        attacker: n.id,
        defender: target.id,
        participants: [n.id, target.id],
        reason,
        status: "preparing",
        round: 0,
        wins: { [n.id]: 0, [target.id]: 0 },
        damage: { [n.id]: 0, [target.id]: 0 },
        endsAt: now + 15 * 60_000,
        log: [],
        peace: [],
      };
      // Award XP for declaring war (attacker) and being attacked (defender)
      try {
        xpGoalsSystem.awardWarAttack(1, { warId: id, target: target.id });
        xpGoalsSystem.awardWarDefend(1, { warId: id, target: n.id });
      } catch(e) {}
      warDiplomacy.invite(this, this.state.wars[id]);

      // Persist new war to database
      saveWar({
        id,
        attackerId: n.id,
        defenderId: target.id,
        participants: [n.id, target.id],
        type: 'conventional',
        reason,
        status: 'preparing',
        round: 0,
        wins: { [n.id]: 0, [target.id]: 0 },
        damage: { [n.id]: 0, [target.id]: 0 },
        casualties: {},
        damageDealt: {},
        peace: [],
        peaceTerms: null,
        result: null,
        endedAt: null,
        declared: now,
        version: 1,
      }).catch(err => console.error('Failed to persist new war:', err.message));

      return;
    }
    const w = preview
      ? clone(this.state.wars[d.id] || null)
      : this.state.wars[d.id];
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

      // Persist war state change to database
      saveWar(w).catch(err => console.error('Failed to persist war peace vote:', err.message));

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
    if (type === "missiles" || type === "nukes") {
      check(n.militaryUnits[type] > 0, "No weapons available");
      check(
        type !== "nukes" || !n.motionModifiers.nuclearBan,
        "World nuclear ban",
      );
      const intuition = type === "nukes" ? 50 : 25;
      check(r.player.currentIntuition >= intuition, "Insufficient intuition");
    } else if (type === "spies") {
      check(
        n.militaryUnits.spies > 0 && r.player.currentIntuition >= 10,
        "Spies and 10 intuition required",
      );
    }
    if (preview) return;
    let damage;
    if (type === "missiles" || type === "nukes") {
      const intuition = type === "nukes" ? 50 : 25;
      this.removeUnits(n, type, 1);
      r.player.currentIntuition -= intuition;
      damage =
        type === "nukes"
          ? r.combat.calculateNukeDamage(n, r.player)
          : r.combat.calculateMissileDamage(n, r.player);
      const interceptionChance = Math.min(
        0.45,
        (t.projects.ironCurtain || 0) * 0.15,
      );
      const intercepted =
        type === "nukes"
          ? Math.random() < interceptionChance * 0.7
          : Math.random() < interceptionChance;
      if (intercepted) damage = 0;
      const statKey =
        type === "missiles"
          ? intercepted
            ? "missileMisses"
            : "missileHits"
          : intercepted
            ? "nukeMisses"
            : "nukeHits";
      n.statistics[statKey] = (n.statistics[statKey] || 0) + 1;
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
    // Evade skill: chance to skip energy cost on attack
    const evadeChance = r.player.getSkillValue("evade");
    let evaded = false;
    if (evadeChance > 0 && Math.random() < evadeChance) {
      evaded = true;
    } else {
      r.player.currentEnergy -= cost;
    }
    const inflicted =
      type === "conventional" ? damage : Math.min(t.infra, damage);
    if (type === "missiles" || type === "nukes") {
      t.infra -= inflicted;
      t.applyTemporaryHappinessReduction(type === "nukes" ? 15 : 5);
    }
    w.damage[n.id] += inflicted;
    w.log.push({ actor: n.id, target: t.id, type, damage: inflicted, at: now });
    w.log = w.log.slice(-100);

    // Persist war damage to database after attack
    saveWar(w).catch(err => console.error('Failed to persist war damage:', err.message));
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
      rankings.deadline(this),
      this.state.startedAt + (this.state.day + 1) * HOUR,
      this.state.election.status === "scheduled"
        ? this.state.election.opensAt
        : this.state.election.endsAt,
    );
    next = Math.min(next, this.sports.nextDeadline());
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
              // Award XP to newly elected congress representatives
              try {
                election.representatives[faction].forEach((repId) => {
                  xpGoalsSystem.awardElectedCongress(1, { faction, electedAt: now });
                });
              } catch(e) {}
            }
            this.state.electionVotes = {};
            election.opensAt += 30 * HOUR;
            election.endsAt = election.opensAt + DAY;
            election.status = "scheduled";
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

            // Persist war state change to database
            saveWar(w).catch(err => console.error('Failed to persist war advance:', err.message));
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
            tradeAidSystem.processFalloffs(this);
            this.sports.turn(at, this.state.day);
            this.wrestling.turn(at, this.state.day);
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
            this.rollGlobalDiseaseSpawn();
            this.runLotteryDrawing();
          }
          for (const r of this.rules.values()) this.refresh(r);
          rankings.record(this, at);
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
    // Staged resource system: mineral production, stage aging, 2:1 transitions,
    // and food/water production (plan §10.5)
    r.resourceSystem.processTurn(n);
    r.resourceSystem.processFoodWater(n);
    this.refresh(r);
    // Award XP for resource production (raw and manufactured per mineral)
    try {
      const prod = n.resourceProduction || {};
      const rawProduced = prod.rawProduced || {};
      const manufacturedProduced = prod.manufacturedProduced || {};
      for (const mineral of ['steel', 'bronze', 'lead', 'aluminum', 'copper', 'uranium', 'gasoline']) {
        const rawAmt = rawProduced[mineral] || 0;
        const manuAmt = manufacturedProduced[mineral] || 0;
        if (rawAmt > 0) {
          xpGoalsSystem.awardProduceRaw(rawAmt, { resourceKey: mineral, nation: n });
        }
        if (manuAmt > 0) {
          xpGoalsSystem.awardProduceManufactured(manuAmt, { resourceKey: mineral, nation: n });
        }
      }
    } catch(e) {}
    // Apply active food/water timed bonuses exactly once per turn
    this.resourceSystem.applyActiveBonuses(n);
    const upkeep = n.calculateDailyMaintenanceCosts();
    let costs = { money: upkeep.money };
    for (const key of Object.keys(costs))
      costs[key] *= n.motionModifiers.upkeep;
    // Add building upkeep
    let buildingUpkeepTotal = 0;
    // Improvements: small upkeep
    buildingUpkeepTotal += (n.improvements ? Object.values(n.improvements).reduce((a,b)=>a+b,0) : 0) * 25000;
    // Projects: medium upkeep
    buildingUpkeepTotal += (n.projects ? Object.values(n.projects).reduce((a,b)=>a+b,0) : 0) * 125000;
    // Wonders: high upkeep
    buildingUpkeepTotal += (n.wonders ? Object.values(n.wonders).reduce((a,b)=>a+b,0) : 0) * 625000;
    costs.money += buildingUpkeepTotal * (n.motionModifiers.upkeep || 1);
    n.militaryMaintenanceDeficit = this.affordability(n, costs).length > 0;
    if (!n.militaryMaintenanceDeficit) this.pay(n, costs);
    n.money += Math.floor((n.taxRevenue + n.researchIncome) * 0.3);
    n.totalTaxEarned += Math.floor(n.taxRevenue * 0.3);
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
    // Resources removed
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
      acceptsMessages: other.player.settings.privacy.allowMessages,
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
      wrestling: this.wrestling.view(id),
      rankings: rankings.view(this, id),
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
          Object.entries(n.calculateDailyMaintenanceCosts().resources || {}).map(
            ([k, v]) => [k, v * n.motionModifiers.upkeep],
          ),
        ),
      },
      alliances,
      canFoundAlliance: this.canFound(n),
      offers: Object.values(this.state.offers)
        .filter((o) => o.status === "open" || o.owner === id)
        .map((o) => ({
          ...o,
          acceptance:
            o.owner !== id && o.status === "open"
              ? this.actionQuote(id, "acceptOffer", { id: o.id })
              : null,
        })),
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
      worldBank: {
        inventory: Object.fromEntries(
          Object.entries(this.state.worldBank.inventory || {}).map(
            ([resource, amount]) => [resource, amount],
          ),
        ),
        prices: Object.fromEntries(
          this.catalog().resources.map((resource) => [
            resource,
            this.worldBankPrice(resource, null, n),
          ]),
        ),
        currencyRates: this.state.worldBank.currencyRates || {},
      },
      globalResources: this.state.globalResources || {},
      lottery: {
        pool: (this.state.lottery && this.state.lottery.pool) || 0,
        ticketsSold: (this.state.lottery && this.state.lottery.currentDrawing && this.state.lottery.currentDrawing.status === 'open')
          ? this.state.lottery.currentDrawing.ticketsSold || 0
          : 0,
        ticketCost: TICKET_COST,
        maxTicketsPerNation: MAX_TICKETS_PER_NATION,
        currentDrawing: (this.state.lottery && this.state.lottery.currentDrawing) || null,
        previousDrawings: (this.state.lottery && this.state.lottery.drawings) ? this.state.lottery.drawings.slice(-8).reverse() : [],
        unclaimedWinnings: (this.state.lottery && this.state.lottery.unclaimed)
          ? Object.values(this.state.lottery.unclaimed).filter((u) => !u.claimed && Date.now() <= u.expiresAt)
          : [],
      },
      globalWorld: this.computeGlobalWorld(),
      notifications: this.getNotifications(id),
    };
  }

  getNotifications(nationId) {
    const n = this.nation(nationId).nation;
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
    const pendingPeace = Object.values(this.state.treaties || {}).filter(
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
    const activeWars = Object.values(this.state.wars || {}).filter(
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
    const pendingAid = Object.values(this.state.aid || []).filter(
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
module.exports = { World, HOUR, DAY, check, text, quantity };
