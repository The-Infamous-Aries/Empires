"use strict";
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRules, clone } = require("./rules");
const { WorldCore } = require("./world-core");
const { BuildingManager } = require("./world-building");
const { MilitaryManager } = require("./world-military");
const { TradeManager } = require("./world-trade");
const { DiplomacyManager } = require("./world-diplomacy");
const { ForumManager } = require("./world-forum");
const { ChatManager } = require("./world-chat");
const { LotteryManager } = require("./world-lottery");
const { DiseaseManager } = require("./world-disease");
const { EquipmentManager } = require("./world-equipment");
const { LoginManager } = require("./world-login");
const { ResearchManager } = require("./world-research");
const { CasinoManager } = require("./world-casino");
const { ElectionManager } = require("./world-elect");
const { TerritoryManager } = require("./world-claim");
const { NationManager } = require("./world-nation");
const { ViewManager } = require("./world-view");
const { ActionDispatcher } = require("./world-actions");
const research = require("./research");
const rankings = require("./rankings");
const { WarManager, ensure, sideOf, sidesDamage } = require("./world-war");
const { SportsWrestlingManager } = require("./world-sports-wrestling");
const { saveMessage, saveWar, saveWorldBank, saveAccount, saveNation } = require("../core/data-persistence");
const { ResourceSystem } = require("../systems/Resource/resource-system.js");
const { TradeAidSystem } = require("../systems/Resource/trade-aid-system.js");
const { RelicSystem } = require("../systems/Resource/relics-system.js");
const { EdictSystem } = require("../systems/Nation/edict-system.js");
const { EquipmentLootSystem } = require("../systems/Equipment/equipment-loot-system.js");
const CasinoSystem = require("../systems/Casino/casino-system.js");
const SovereignWheelSystem = require("../systems/Casino/sovereign-wheel-system.js");
const KenoSystem = require("../systems/Casino/keno-system.js");
const ScratchOffSystem = require("../systems/Casino/scratch-off-system.js");
const BlackjackSystem = require("../systems/Casino/cards/blackjack-system.js");
const GamblerDiceSystem = require("../systems/Casino/dice/gambler-dice-system.js");
const { EQUIPMENT_WORLD_BANK_PRICES } = require("../assets/data/equipment/chests.js");
const XPGoalsSystem = require("../systems/XP/xp-goals-system.js");
const xpGoalsSystem = new XPGoalsSystem();
const xpGoals = xpGoalsSystem;
const edictSystem = new EdictSystem();
const equipmentSystem = new EquipmentLootSystem();
equipmentSystem.initialize();
xpGoalsSystem.setEquipmentSystem(equipmentSystem);
const tradeAidSystem = new TradeAidSystem();
tradeAidSystem.initialize();
const relicSystem = new RelicSystem();
relicSystem.initialize();
const casinoSystem = new CasinoSystem();
const sovereignWheelSystem = new SovereignWheelSystem();
const kenoSystem = new KenoSystem();
const scratchOffSystem = new ScratchOffSystem();
const blackjackSystem = new BlackjackSystem();
const gamblerDiceSystem = new GamblerDiceSystem();
casinoSystem.init(sovereignWheelSystem, kenoSystem, scratchOffSystem, blackjackSystem, gamblerDiceSystem);
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
    `${name} must contain ${min}â€“${max} characters`,
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CURRENCY & LOTTERY CONSTANTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const CURRENCIES = {
  aurel: { key: 'aurel', name: 'Aurel', abbrev: 'AUR', symbol: 'â‚³', baseRate: 100 },
  velt: { key: 'velt', name: 'Velt', abbrev: 'VLT', symbol: 'âœ¦', baseRate: 100 },
  krona: { key: 'krona', name: 'Krona', abbrev: 'KRN', symbol: 'â‚­', baseRate: 100 },
  drachma: { key: 'drachma', name: 'Drachma', abbrev: 'DRM', symbol: 'Ã°', baseRate: 100 },
  sovereign: { key: 'sovereign', name: 'Sovereign', abbrev: 'SOV', symbol: 'êœ±', baseRate: 100 },
  talon: { key: 'talon', name: 'Talon', abbrev: 'TLN', symbol: 'â‚®', baseRate: 100 },
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
    research.validate(this.base.research);
    // SportsWrestlingManager owns both Sports and Wrestling sub-systems.
    // Must be instantiated before restore() so restore can delegate to it.
    this.sportsWrestlingMgr = new SportsWrestlingManager(this);
    const saved =
      file && fs.existsSync(file)
        ? (() => {
            try {
              return JSON.parse(fs.readFileSync(file, "utf8"));
            } catch (e) {
              console.error("Failed to parse world save, starting fresh:", e.message);
              return null;
            }
          })()
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
        lottery: { pool: 0, tickets: {}, nextTicketId: 1, drawings: [], currentDrawing: null, lastDrawing: null },
        worldName: "Epochus",
        receipts: {},
        bugReports: [],
        debugErrors: [],
        moderationHistory: [],
        citizens: {},
        xpGoalsState: null,
      },
    );
    this.advance(now());
    this.check = check;
    this.text = text;
    this.own = own;
    this.CURRENCIES = CURRENCIES;
    this.PET_ICONS_UNIQUE = PET_ICONS_UNIQUE;
    this.TICKET_COST = TICKET_COST;
    this.MAX_TICKETS_PER_NATION = MAX_TICKETS_PER_NATION;
    this.TICKET_PICK_COUNT = TICKET_PICK_COUNT;
    this.CLAIM_WINDOW_MS = CLAIM_WINDOW_MS;
    this.unitUpkeep = unitUpkeep;
    this.casinoSystem = casinoSystem;
    this.kenoSystem = kenoSystem;
    this.scratchOffSystem = scratchOffSystem;
    this.blackjackSystem = blackjackSystem;
    this.gamblerDiceSystem = gamblerDiceSystem;
    this.sovereignWheelSystem = sovereignWheelSystem;
    this.categories = categories;
    this.xpGoalsSystem = xpGoalsSystem;
    this.equipmentSystem = equipmentSystem;
    this.edictSystem = edictSystem;
    this.tradeAidSystem = tradeAidSystem;
    this.core = new WorldCore(this);
    this.buildingMgr = new BuildingManager(this);
    this.militaryMgr = new MilitaryManager(this);
    this.tradeMgr = new TradeManager(this);
    this.diplomacyMgr = new DiplomacyManager(this);
    this.warMgr = new WarManager(this);
    this.forumMgr = new ForumManager(this);
    if (!this.base.motionTypes) {
      this.base.motionTypes = this.forumMgr.defaultMotionTypes();
    }
    this.chatMgr = new ChatManager(this);
    this.lotteryMgr = new LotteryManager(this);
    this.diseaseMgr = new DiseaseManager(this);
    this.casinoMgr = new CasinoManager(this);
    this.equipmentMgr = new EquipmentManager(this);
    this.loginMgr = new LoginManager(this);
    this.researchMgr = new ResearchManager(this);
    this.electionMgr = new ElectionManager(this);
    this.claimMgr = new TerritoryManager(this);
    this.nationMgr = new NationManager(this);
    // Backward-compat aliases: SportsWrestlingManager owns both sub-systems
    this.sports = this.sportsWrestlingMgr.sports;
    this.wrestling = this.sportsWrestlingMgr.wrestling;
    this.viewMgr = new ViewManager(this);
    this.actionMgr = new ActionDispatcher(this, categories);
  }
  restore(state) {
    check(state.version === 1, "Unsupported world save version");
    this.state = state;
    this.state.territories ||= {};
    this.state.electionVotes ||= {};
    this.state.aid ||= {};
    this.state.citizens ||= {};
    this.state.lottery ||= { pool: 0, tickets: {}, nextTicketId: 1, drawings: [], currentDrawing: null, lastDrawing: null };
    this.state.worldBank ||= {};
    this.state.worldBank.currencyRates ||= {};
    for (const [key, cfg] of Object.entries(CURRENCIES)) {
      this.state.worldBank.currencyRates[key] ??= cfg.baseRate;
    }
    if (this.state.xpGoalsState) {
      try {
        Object.assign(xpGoalsSystem, XPGoalsSystem.deserialize(this.state.xpGoalsState));
      } catch (e) {
        console.error('Failed to restore XP Goals state:', e.message);
      }
    }
    this.state.globalResources ||= {};
    this.state.tradeAidSlots ||= {};
    this.state.relics ||= { activeRelics: [], lastSpawnDay: 0 };
    this.resourceSystem = new ResourceSystem();
    this.resourceSystem.initialize();
    tradeAidSystem.restore(this.state.tradeAidSlots);
    relicSystem.restore(this.state.relics);
    if (!this.state.worldBank.seeded) {
      this.state.worldBank.seeded = true;
    }
    // Seed World Bank inventory/targets for equipment keys & chests
    this.state.worldBank.inventory = this.state.worldBank.inventory || {};
    this.state.worldBank.targets = this.state.worldBank.targets || {};
    const wbKeys = { key1: 5, key2: 3, key3: 2 };
    const wbChests = { chest1: 10, chest2: 6, chest3: 4, chest4: 2 };
    for (const [k, v] of Object.entries(wbKeys)) {
      if (this.state.worldBank.inventory[k] === undefined) this.state.worldBank.inventory[k] = v;
      if (this.state.worldBank.targets[k] === undefined) this.state.worldBank.targets[k] = v;
    }
    for (const [k, v] of Object.entries(wbChests)) {
      if (this.state.worldBank.inventory[k] === undefined) this.state.worldBank.inventory[k] = v;
      if (this.state.worldBank.targets[k] === undefined) this.state.worldBank.targets[k] = v;
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
      r.nation.relics = r.nation.relics || [];
      this.rules.set(id, r);
    }
    for (const w of Object.values(state.wars)) ensure(w);
    for (const r of this.rules.values()) this.refresh(r, state.lastProcessed);
    this.sportsWrestlingMgr.restore(state);
    rankings.ensure(this);
    if (state.casino) casinoSystem.setState(state.casino);
    // Initialize casino data for all nations
    for (const r of this.rules.values()) {
      casinoSystem.ensureCasino(r.nation);
      r.casino = casinoSystem.getCasino(r.nation);
    }
  }
  snapshot() {
    return clone({
      ...this.state,
      sports: this.sportsWrestlingMgr.snapshot(),
      tradeAidSlots: tradeAidSystem.slots,
      casino: casinoSystem.getState(),
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
      this.state.xpGoalsState = xpGoalsSystem.serialize();
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
    return this.core.nation(id);
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
      r.nation.researchPoints = 0;
      r.nation.relationships = {};
      r.nation.manufacturing = {};
      r.nation.relics = [];
      r.player.factionKey = nationData.factionKey;
      r.player.factionJoinDate = this.clock();
      r.nation.loans = [];
      casinoSystem.ensureCasino(r.nation);
      r.casino = casinoSystem.getCasino(r.nation);
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
    return this.core.catalog();
  }
  refresh(r, at = this.processingAt ?? this.clock()) {
    return this.core.refresh(r, at);
  }
  affordability(n, cost) {
    return this.core.affordability(n, cost);
  }
  pay(n, cost, factor = 1) {
    return this.core.pay(n, cost, factor);
  }
  removeUnits(n, type, amount) {
    return this.core.removeUnits(n, type, amount);
  }

  actionQuote(id, action, data = {}) {
    return this.actionMgr.actionQuote(id, action, data);
  }
  command(id, action, data = {}, requestId) {
    return this.actionMgr.command(id, action, data, requestId);
  }
  runAction(r, action, data) {
    return this.actionMgr.runAction(r, action, data);
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
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // CURRENCY RATES
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
  forumAccess(n, scope) {
    return scope === "world"
      ? !!(n.projects.broadcasting && n.wonders.internet)
      : !!n.projects.broadcasting;
  }
  nextDeadline() {
    let next = Math.min(
      rankings.deadline(this),
      this.state.startedAt + (this.state.day + 1) * HOUR,
      this.state.election.status === "scheduled"
        ? this.state.election.opensAt
        : this.state.election.endsAt,
    );
    next = Math.min(next, this.sportsWrestlingMgr.nextDeadline());
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
          this.sportsWrestlingMgr.process(at);
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
              if (aid.type === "money" && aid.status !== "accepted") {
                const sender = this.nation(aid.from);
                if (sender && sender.nation) sender.nation.money += aid.amount;
              }
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
            // Laboratory income diversion: labs divert % of tax revenue to research points each turn
            const labCount = Math.min(n.improvements?.researchLab || 0, 4);
            if (labCount > 0) {
              let rate = 0.025;
              if (n.projects.advancedResearch === 5) rate = 0.035;
              if (n.wonders.grandResearchAcademy) rate += 0.015;
              const researchIncome = Math.floor(n.taxRevenue * rate * labCount);
              n.researchPoints = (n.researchPoints || 0) + researchIncome;
            }
            // Fund active research from research points
            for (const task of n.activeResearch) {
              const available = Math.min(n.researchPoints, task.goal - task.progress);
              task.progress += available;
              n.researchPoints -= available;
            }
            // Complete finished research
            for (const task of n.activeResearch.filter((t) => t.progress >= t.goal)) {
              n.completedResearch.push(task.key);
              for (const [key, value] of Object.entries(r.research[task.key].effects))
                n.researchEffects[key] = (n.researchEffects[key] || 0) + value;
              r.player._onResearchCompleted();
            }
            n.activeResearch = n.activeResearch.filter((task) => task.progress < task.goal);
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
          this.warMgr.process(this, at);
          for (const w of Object.values(this.state.wars)) {
            if (w.status === "ended" || w.endsAt > at) continue;
            if (w.status === "preparing") {
              w.status = "active";
              w.round = 1;
            } else {
              const a = w.attacker,
                b = w.defender,
                totals = sidesDamage(w);
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
                    sideOf(w, w.result) ===
                    sideOf(w, id);
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
            // Weekly relic spawn + decay (state.day % 7 === 0)
            if (this.state.day % 7 === 0) {
              relicSystem.spawnWeeklyRelic(this);
              relicSystem.decayWeeklyRelics(this);
            }
            this.turnTechMaximum = Math.max(
              0,
              ...[...this.rules.values()].map((r) => r.nation.tech),
            );
            for (const r of this.rules.values()) {
              r.setDay(this.state.day);
              this.processTurn(r);
            }
            this.warMgr.collectDebts();
            tradeAidSystem.processFalloffs(this);
            this.sportsWrestlingMgr.turn(at, this.state.day);
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
            this.lotteryMgr.runLotteryDrawing();
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
    // Apply relic stat boosts at start of turn (before resource/food/water calcs)
    relicSystem.applyBoosts(n, r.player);
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
    // and food/water production (plan Â§10.5)
    r.resourceSystem.processTurn(n);
    r.resourceSystem.processFoodWater(n);
    this.refresh(r);
    // Equipment durability decay (flat 1/turn on equipped items)
    equipmentSystem.processTurn(n);
    // Track login streak - treat processTurn as daily login activity
    this.loginMgr.updateLoginDate(n);
    this.loginMgr.grantLoginChest(n);
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
    // Goal-based chest rewards: daily (every turn), weekly (every 7 days), monthly (every 30 days)
    try {
      xpGoalsSystem.grantDailyGoalChest(n);
      if (this.state.day % 7 === 0) {
        xpGoalsSystem.grantWeeklyGoalChest(n);
      }
      if (this.state.day % 30 === 0) {
        xpGoalsSystem.grantMonthlyGoalChest(n);
        this.loginMgr.grantMonthlyLoginChest(n);
      }
      // Yearly reset for chest stacks (chest3/chest4 accumulation)
      if (this.state.day % 365 === 0) {
        if (n.equipment && n.equipment.chestStacks) {
          n.equipment.chestStacks.chest3 = 0;
          n.equipment.chestStacks.chest4 = 0;
        }
        // Also reset chest counts in nation.equipment.chests for yearly reset
        if (n.equipment && n.equipment.chests) {
          n.equipment.chests.chest3 = 0;
          n.equipment.chests.chest4 = 0;
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
    const limits = this.buildingMgr.limits(r);
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
    // Per-turn relic random effects (The Jar, Loot Bag, Wild Card, Tax Die re-roll)
    relicSystem.processTurn(n);
  }
}
module.exports = { World, HOUR, DAY, check, text, quantity, xpGoalsSystem };
