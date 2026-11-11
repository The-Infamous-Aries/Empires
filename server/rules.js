"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Module = require("node:module");
const { randomBytes } = require("node:crypto");
const root = path.resolve(__dirname, "..");

function sandboxRequire(id) {
    const resolved = path.resolve(root, id);
    return require(resolved);
}
const files = [
  "core/colors.js",
  "core/event-system.js",
  "entities/Player.js",
  "entities/Nation.js",
  "entities/MilitaryUnit.js",
  "systems/Nation/edict-system.js",
  "systems/Nation/government-system.js",
  "systems/Nation/religion-system.js",
  "systems/Building/improvements-system.js",
  "systems/Building/projects-system.js",
  "systems/Building/wonders-system.js",
  "systems/World/world-bank-system.js",
  "systems/War/war-system.js",
  "systems/War/alliance-system.js",
  "systems/War/diplomacy-system.js",
  "systems/World/world-forum-system.js",
  ...["economy", "healthcare", "war"].map(
    (name) => `assets/data/research/${name}-research.js`,
  ),
];
const scripts = files.map(
  (file) =>
    new vm.Script(fs.readFileSync(path.join(root, file), "utf8"), {
      filename: file,
    }),
);
const clone = (value) => JSON.parse(JSON.stringify(value));

// Execute the repository's rule classes without a browser or autonomous timers.
// The World owns scheduling and persistence; each nation has isolated rule state.
function createRules(day = 0, saved) {
  let randomState = saved?.randomState ?? randomBytes(4).readUInt32LE();
  const simulationMath = Object.create(Math);
  simulationMath.random = () => {
    randomState = (randomState + 0x6d2b79f5) >>> 0;
    let t = randomState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const sandbox = {
    console: { log() {}, warn() {}, error: console.error },
    localStorage: { getItem: () => null, setItem() {} },
    setTimeout: () => 0,
    clearTimeout() {},
    setInterval: () => 0,
    clearInterval() {},
    performance,
    require: sandboxRequire,
    GameEngine: { systems: {} },
    GameTime: {
      getTime: () => ({ totalDays: sandbox.day }),
      nationAgeDays: (founded) => Math.max(0, sandbox.day - founded),
    },
    day,
    Date,
    Math: simulationMath,
  };
  // Pre-load WarTermsSystem for VM scripts that depend on it
  const WarTermsSystem = require("../systems/War/war-terms-system.js");
  sandbox.window = sandbox;
  sandbox.window.WarTermsSystem = WarTermsSystem;
  // Inject core/config.js exports into the VM sandbox so rule classes can
  // reference GameConfig, GameEvents, etc. as globals without each file
  // redeclaring them (which caused "Identifier 'X' has already been declared"
  // conflicts in the shared VM context).
  Object.assign(sandbox, require(path.join(root, "core/config.js")));
  const context = vm.createContext(sandbox);
  for (const script of scripts) script.runInContext(context);
  vm.runInContext(
    `DiplomacySystem.prototype.initialize = function () { this.isInitialized = true; };`,
    context,
  );
  const rules = vm.runInContext(
    `({ nation: Nation, player: Player, improvements: new ImprovementsSystem(), projects: new ProjectsSystem(), wonders: new WondersSystem(), governments: window.GovernmentSystem.governments, religions: window.ReligionSystem.religions, research: {...EconomyResearch, ...HealthcareResearch, ...WarResearch}, skillDefs: SKILL_DEFS, colors: GAME_COLORS, allianceSkills: window.AllianceSystem.allianceSkills, allianceTemplates: window.AllianceSystem.governmentTemplates, treaties: new DiplomacySystem().treatyTypes, motionTypes: WorldForum.motionTypes, combat: new WarSystem() })`,
    context,
  );
  // The live World recalculates once after all sources are rebuilt.
  rules.projects.updateNationWithProjectEffects = () => {};
  rules.wonders.updateNationWithWonderEffects = () => {};
  sandbox.Player = rules.player;
  sandbox.GameEngine.systems = rules;
  rules.nation.wonders ||= {};
  // One treasury and one unit inventory, including automatic project production.
  Object.defineProperty(rules.nation.resources, "money", {
    configurable: true,
    enumerable: true,
    get: () => rules.nation.money,
    set: (value) => {
      rules.nation.money = value;
    },
  });
  Object.defineProperty(rules.nation, "military", {
    configurable: true,
    enumerable: false,
    get: () => rules.nation.militaryUnits,
    set: (value) => {
      rules.nation.militaryUnits = value;
    },
  });
  if (saved) {
    const { resources, relations, technologies, military, ...fields } =
      saved.nation;
    Object.assign(rules.nation, fields);
    Object.assign(rules.nation.resources, resources);
    rules.nation.relations = new Map(relations || []);
    rules.nation.technologies = new Set(technologies || []);
    Object.assign(rules.player, saved.player);
    rules.player.achievements = new Set(saved.player.achievements || []);
    rules.player.titles = new Set(saved.player.titles || []);
    rules.player.activeEffects = new Map(saved.player.activeEffects || []);
  }
  rules.setDay = (value) => {
    sandbox.day = value;
  };
  rules.snapshot = () => ({
    randomState,
    nation: clone({
      ...rules.nation,
      relations: [...rules.nation.relations],
      technologies: [...rules.nation.technologies],
    }),
    player: clone({
      ...rules.player,
      achievements: [...rules.player.achievements],
      titles: [...rules.player.titles],
      activeEffects: [...rules.player.activeEffects],
    }),
  });
  return rules;
}
module.exports = { createRules, clone };
