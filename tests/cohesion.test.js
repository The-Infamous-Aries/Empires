"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { World, HOUR } = require("../server/world");
const research = require("../server/research");
const diplomacy = require("../server/diplomacy");
function fixture() {
  let time = 1700000000000;
  const world = new World({ file: null, now: () => time });
  const n = (id) => world.nation(id).nation;
  const add = (name) => {
    const id = world.register(name, "test-only-hash", {
      name: name + " Republic",
      government: "liberalDemocracy",
      religion: "monotheism",
      primaryResource: "food",
      factionKey: "blue",
    });
    Object.assign(n(id), {
      money: 1e12,
      tech: 2000,
      infra: 100,
      land: 10000,
      mapBlocks: 100,
    });
    n(id).improvements.foreignAffairsOffice = 1;
    n(id).improvements.embassy = 5;
    for (const key of world.catalog().resources) n(id).resources[key] = 10000;
    world.refresh(world.nation(id));
    return id;
  };
  const act = (id, action, data) =>
    world.command(id, action, data, randomUUID());
  const advance = (ms) => {
    time += ms;
    world.advance(time);
  };
  const pact = (from, to, type, compensation = 0) => {
    act(from, "treatyPropose", { target: to, type, compensation });
    const t = Object.values(world.state.treaties).at(-1);
    act(to, "treatyRespond", { id: t.id, accept: true });
    return t.id;
  };
  const war = (a, b) => {
    act(a, "declareWar", { target: b });
    return Object.values(world.state.wars).at(-1).id;
  };
  return {
    world,
    n,
    add,
    act,
    advance,
    pact,
    war,
    now: () => time,
    setTime: (t) => (time = t),
  };
}
test("every research entry has explicit finite consumed effects and an acyclic prerequisite graph", () => {
  const f = fixture(),
    id = f.add("Alpha"),
    r = f.world.nation(id);
  research.validate(r.research);
  assert.equal(Object.keys(r.research).length, 150);
  const used = new Set();
  for (const [key, def] of Object.entries(r.research)) {
    r.nation.completedResearch = [key];
    f.world.refresh(r);
    assert.ok(
      Object.values(r.nation.researchModifiers).some((v) => v > 0),
      key,
    );
    for (const effect of research.describe(def)) {
      used.add(effect.key);
      assert.ok(Number.isFinite(effect.contribution));
    }
    for (const value of [
      ...Object.values(r.nation.researchModifiers),
      r.nation.taxRevenue,
      r.nation.population,
    ])
      assert.ok(Number.isFinite(value));
  }
  assert.equal(used.size, 433);
  assert.throws(
    () =>
      research.validate({ bad: { time: 1, cost: 0, effects: { unknown: 2 } } }),
    /Unmapped/,
  );
  const catalog = structuredClone(r.research);
  catalog.basic_barter.requirements.prerequisites = ["basic_barter"];
  assert.throws(() => research.validate(catalog), /prerequisite/);
  r.nation.completedResearch = Object.keys(r.research);
  f.world.refresh(r);
  const once = structuredClone(r.nation.researchModifiers);
  f.world.refresh(r);
  assert.deepEqual(r.nation.researchModifiers, once);
  r.nation.completedResearch = [];
  f.world.refresh(r);
  assert.ok(Object.values(r.nation.researchModifiers).every((v) => v === 0));
});
test("health, taxable income, environment and motion bonuses reach downstream stats deterministically", () => {
  const f = fixture(),
    id = f.add("Alpha"),
    r = f.world.nation(id),
    n = r.nation;
  n.tech = 5;
  n.infra = 3000;
  n.land = 100;
  n.resources.food = 0;
  n.resources.water = 0;
  f.world.refresh(r);
  const before = { disease: n.nationStats.disease, tax: n.taxRevenue };
  n.completedResearch = ["herbal_remedies"];
  n.improvements.treePlantation = 1;
  n.projects.enhancedPolice = 1;
  f.world.refresh(r);
  assert.ok(n.nationStats.disease < before.disease);
  n.improvements.casino = 1;
  f.world.refresh(r);
  const baseIncome = Math.floor(
    (n.infra / 50) *
      n.population *
      n.tech *
      (1 + (n.nationStats.literacy / 100) * 0.5),
  );
  assert.equal(n.taxableIncome, Math.floor(baseIncome * 1.05));
  f.world.state.motions.boost = {
    status: "passed",
    scope: "color",
    faction: "blue",
    effectEndsAt: f.now() + HOUR,
    type: "COLOR_HAPPINESS_CAMPAIGN",
    parameters: { happinessBoost: 20, productivityPenalty: 10 },
  };
  f.world.refresh(r);
  const stats = JSON.stringify([
    n.nationStats,
    n.population,
    n.taxableIncome,
    n.taxRevenue,
    n.budget,
  ]);
  for (let i = 0; i < 5; i++) f.world.refresh(r);
  assert.equal(
    JSON.stringify([
      n.nationStats,
      n.population,
      n.taxableIncome,
      n.taxRevenue,
      n.budget,
    ]),
    stats,
  );
  assert.equal(n.budget.income, n.taxRevenue + n.researchIncome);
});
test("resource combinations clear on depletion and independence wonders provide access without stock", () => {
  const f = fixture(),
    id = f.add("Alpha"),
    r = f.world.nation(id),
    n = r.nation;
  assert.ok(n.bonusEffects.basicNeeds);
  n.resources.food = 0;
  f.world.refresh(r);
  assert.equal(n.bonusEffects.basicNeeds, false);
  assert.equal(n.currentBonuses.basicNeeds, undefined);
  const food = Object.entries(r.wonders.wonderTypes).find(([, d]) =>
    /Hydroponic/i.test(d.name),
  )[0];
  n.wonders[food] = 1;
  f.world.refresh(r);
  assert.equal(n.resources.food, 0);
  assert.ok(n.bonusEffects.basicNeeds);
  n.wonders[food] = 0;
  f.world.refresh(r);
  assert.equal(n.bonusEffects.basicNeeds, false);
});
test("bulk development costs equal consecutive individual purchases", () => {
  const a = fixture(),
    b = fixture(),
    x = a.add("Alpha"),
    y = b.add("Alpha");
  a.n(x).tech = b.n(y).tech = 30;
  a.world.refresh(a.world.nation(x));
  b.world.refresh(b.world.nation(y));
  a.act(x, "develop", { kind: "tech", amount: 10 });
  for (let i = 0; i < 10; i++) b.act(y, "develop", { kind: "tech", amount: 1 });
  assert.equal(a.n(x).money, b.n(y).money);
  assert.equal(a.n(x).tech, b.n(y).tech);
});
test("research preserves work across live speed changes and restart, including old queue saves", () => {
  const f = fixture(),
    id = f.add("Alpha");
  f.act(id, "startResearch", { key: "basic_barter" });
  const original = f.n(id).activeResearch[0].endsAt;
  f.advance(100000);
  f.n(id).improvements.researchLab = 5;
  f.world.refresh(f.world.nation(id));
  const task = f.n(id).activeResearch[0];
  assert.ok(task.endsAt < original);
  const end = task.endsAt;
  assert.ok(task.remainingWork < task.totalWork);
  for (let i = 0; i < 10; i++) f.world.view(id);
  assert.equal(task.endsAt, end);
  const saved = f.world.snapshot(),
    other = new World({ file: null, now: f.now });
  other.restore(saved);
  assert.equal(other.nation(id).nation.activeResearch[0].endsAt, end);
  f.setTime(end);
  f.world.advance(end);
  other.advance(end);
  assert.deepEqual(
    other.nation(id).nation.completedResearch,
    f.n(id).completedResearch,
  );
  assert.deepEqual(
    other.nation(id).nation.researchModifiers,
    f.n(id).researchModifiers,
  );
  const old = structuredClone(saved);
  for (const key of ["remainingWork", "rate", "totalWork", "updatedAt"])
    delete old.nations[id].nation.activeResearch[0][key];
  const legacy = new World({ file: null, now: () => saved.lastProcessed });
  legacy.restore(old);
  assert.equal(legacy.nation(id).nation.activeResearch[0].endsAt, end);
});
test("relationship slots, neutral removal and bilateral hostility use authoritative identities", () => {
  const f = fixture(),
    a = f.add("Alpha"),
    b = f.add("Beta"),
    c = f.add("Gamma");
  f.n(a).improvements.embassy = 1;
  f.act(a, "relationship", { target: b, relationship: "friend" });
  assert.throws(
    () => f.act(a, "relationship", { target: b, relationship: "friend" }),
    /Already selected/,
  );
  assert.throws(
    () => f.act(a, "relationship", { target: c, relationship: "friend" }),
    /slots/,
  );
  assert.throws(
    () => f.act(a, "relationship", { target: b, relationship: "neutral" }),
    /Office/,
  );
  f.n(a).projects.officeOfRelationships = 1;
  f.act(a, "relationship", { target: b, relationship: "neutral" });
  assert.equal(f.n(a).relationships[b], undefined);
  f.act(a, "relationship", { target: b, relationship: "foe" });
  assert.equal(diplomacy.combatBonus(f.world, f.n(a), [a, b]), 0.05);
  assert.equal(diplomacy.combatBonus(f.world, f.n(b), [a, b]), 0.05);
  f.n(b).relationships[a] = "nemesis";
  assert.equal(diplomacy.combatBonus(f.world, f.n(a), [a, b]), 0.15);
  assert.ok(
    f.world.buildingQuote(f.world.nation(a), "improvements", "embassy")
      .destroyReasons.length,
  );
});
test("treaties validate both parties and recheck changed eligibility at acceptance", () => {
  const f = fixture(),
    a = f.add("Alpha"),
    b = f.add("Beta");
  f.n(b).improvements.embassy = 4;
  assert.throws(
    () => f.act(a, "treatyPropose", { target: b, type: "mutualDefense" }),
    /5 embassies/,
  );
  f.n(b).improvements.embassy = 5;
  f.act(a, "treatyPropose", { target: b, type: "mutualDefense" });
  const t = Object.values(f.world.state.treaties)[0];
  f.n(a).improvements.embassy = 4;
  assert.throws(
    () => f.act(b, "treatyRespond", { id: t.id, accept: true }),
    /5 embassies/,
  );
  f.n(a).improvements.embassy = 5;
  f.act(b, "treatyRespond", { id: t.id, accept: true });
  assert.equal(f.world.state.treaties[t.id].status, "active");
});
test("intelligence shares latest direct reports and revocable non-recursive technology", () => {
  const f = fixture(),
    a = f.add("Alpha"),
    b = f.add("Beta"),
    c = f.add("Gamma");
  f.n(a).tech = 100;
  f.n(b).tech = 1000;
  f.n(a).projects.financialAssistanceOffice = 1;
  f.n(b).projects.financialAssistanceOffice = 1;
  f.n(b).intelligence = {
    [c]: { at: f.now(), money: 123, units: { soldiers: 40 } },
  };
  const tid = f.pact(a, b, "intelligence");
  assert.equal(f.n(a).sharedTechnology, 200);
  assert.equal(f.n(b).sharedTechnology, 20);
  assert.equal(f.world.view(a).nation.intelligence[c].sharedBy, b);
  assert.equal(f.n(a).intelligence?.[c], undefined);
  for (let i = 0; i < 5; i++)
    for (const r of f.world.rules.values()) f.world.refresh(r);
  assert.equal(f.n(a).tech, 100);
  assert.equal(f.n(a).sharedTechnology, 200);
  f.act(a, "treatyCancel", { id: tid });
  assert.equal(f.n(a).sharedTechnology, 0);
  assert.equal(f.world.view(a).nation.intelligence[c], undefined);
});
test("mandatory and optional calls have distinct penalties, conserve compensation and expire offline", () => {
  const f = fixture(),
    a = f.add("Alpha"),
    b = f.add("Beta"),
    c = f.add("Gamma"),
    d = f.add("Delta");
  f.pact(b, c, "mutualDefense", 100);
  f.pact(b, d, "optionalDefense", 999);
  f.n(c).money = 40;
  const id = f.war(a, b),
    w = f.world.state.wars[id];
  const mandatory = w.obligations.find((o) => o.nation === c),
    optional = w.obligations.find((o) => o.nation === d),
    balance = f.n(b).money;
  f.act(d, "warRespond", { id, obligation: optional.id, accept: false });
  assert.equal(f.n(d).diplomaticPenalties?.length || 0, 0);
  const base = f.n(c).happiness;
  f.act(c, "warRespond", { id, obligation: mandatory.id, accept: false });
  assert.equal(mandatory.debt, 60);
  assert.equal(f.n(b).money, balance + 40);
  assert.ok(f.n(c).happiness < base);
  f.advance(HOUR);
  assert.equal(mandatory.debt, 0);
  assert.equal(mandatory.paid, 100);
  const saved = f.world.snapshot(),
    restored = new World({ file: null, now: f.now });
  restored.restore(saved);
  f.advance(7 * HOUR);
  restored.advance(f.now());
  assert.equal(f.n(c).diplomaticPenalties.length, 0);
  assert.equal(restored.nation(c).nation.diplomaticPenalties.length, 0);
  assert.equal(
    restored.state.wars[id].obligations.find((o) => o.id === mandatory.id).paid,
    100,
  );
});
test("allied war sides validate targets and aggregate damage, casualties and victory once", () => {
  const f = fixture(),
    a = f.add("Alpha"),
    b = f.add("Beta"),
    c = f.add("Gamma");
  f.pact(a, c, "mutualAggression");
  const id = f.war(a, b);
  let w = f.world.state.wars[id],
    call = w.obligations[0];
  assert.equal(f.world.view(a).diplomacy.calls[0].canJoin, false);
  assert.equal(f.world.view(c).diplomacy.calls[0].canJoin, true);
  f.act(c, "warRespond", { id, obligation: call.id, accept: true });
  assert.deepEqual(w.sides.attacker, [a, c]);
  for (const x of [a, b, c]) {
    f.n(x).militaryUnits.soldiers = 1000;
    f.world.refresh(f.world.nation(x));
  }
  f.advance(15 * 60000);
  assert.throws(
    () => f.act(c, "attack", { id, target: a, type: "conventional" }),
    /opposing/,
  );
  w = f.world.state.wars[id];
  f.act(c, "attack", { id, target: b, type: "conventional" });
  assert.equal(w.log.at(-1).target, b);
  assert.ok(w.damage[c] > 0);
  w.damage = { [a]: 0, [b]: 10, [c]: 100 };
  f.advance(4 * HOUR);
  assert.equal(w.wins[a], 1);
  assert.ok(w.casualties[c].soldiers > 0);
  w.damage = { [a]: 0, [b]: 0, [c]: 100 };
  f.advance(4 * HOUR);
  assert.equal(w.result, a);
  assert.equal(f.n(c).statistics.warsWon, 1);
  assert.equal(f.n(b).statistics.warsLost, 1);
  f.advance(HOUR);
  assert.equal(f.n(c).statistics.warsWon, 1);
});
test("unanswered calls fail at the preparation deadline and cancellation cannot erase an existing obligation", () => {
  const f = fixture(),
    a = f.add("Alpha"),
    b = f.add("Beta"),
    c = f.add("Gamma");
  const t = f.pact(b, c, "protectorate", 100);
  // The proposer is protector: declaring against the recipient calls the proposer.
  const id = f.war(a, c),
    call = f.world.state.wars[id].obligations[0];
  assert.equal(call.nation, b);
  f.act(b, "treatyCancel", { id: t });
  f.advance(15 * 60000);
  assert.equal(call.status, "expired");
  assert.equal(call.paid, 100);
  assert.equal(f.n(b).diplomaticPenalties.length, 1);
});

test("health and crime affect population through the documented productive-population formula", () => {
  const f = fixture(),
    id = f.add("Alpha"),
    r = f.world.nation(id),
    n = r.nation;
  n.tech = 5;
  n.infra = 3000;
  n.land = 100;
  f.world.refresh(r);
  const base = n.population;
  n.improvements.hospital = 5;
  n.improvements.policeStation = 5;
  f.world.refresh(r);
  assert.ok(n.population > base);
  const stats = n.nationStats;
  assert.equal(
    stats.populationEfficiency,
    Math.max(
      0.5,
      Math.min(
        1.5,
        1 -
          (stats.disease / 100) * 0.5 -
          (stats.crime / 100) * 0.3 +
          Math.max(0, (stats.happiness - 70) * 0.01),
      ),
    ),
  );
});
test("building effects do not depend on construction order and Supreme Recycling is triple, not quadruple", () => {
  const f = fixture(),
    id = f.add("Alpha"),
    r = f.world.nation(id),
    n = r.nation;
  n.infra = 5000;
  n.tech = 10;
  n.land = 100;
  n.improvements = { recyclingCenter: 5 };
  n.projects = {};
  n.wonders = {};
  f.world.refresh(r);
  const unmodified = Math.floor(
    n.infra / 50 + (n.land * n.infra * n.tech * 1.25) / 200000,
  );
  n.projects.enhancedRecycling = 1;
  n.wonders.supremeRecycling = 1;
  f.world.refresh(r);
  assert.equal(n.nationStats.pollution, Math.floor(unmodified * 0.25));
  assert.equal(n.improvementEffects.recyclingHappinessPenalty, 0);
  for (const [field, defs] of Object.entries({
    projects: r.projects.projectTypes,
    wonders: r.wonders.wonderTypes,
    improvements: r.improvements.improvementTypes,
  }))
    n[field] = Object.fromEntries(
      Object.entries(defs).map(([key, d]) => [key, d.maxCount]),
    );
  f.world.refresh(r);
  const snapshot = JSON.stringify([
    n.projectEffects,
    n.wonderEffects,
    n.improvementEffects,
    n.nationStats,
  ]);
  for (const field of ["projects", "wonders", "improvements"])
    n[field] = Object.fromEntries(Object.entries(n[field]).reverse());
  f.world.refresh(r);
  assert.equal(
    JSON.stringify([
      n.projectEffects,
      n.wonderEffects,
      n.improvementEffects,
      n.nationStats,
    ]),
    snapshot,
  );
});
test("occupied unit storage and simultaneous research prevent removal of required capacity", () => {
  const f = fixture(),
    id = f.add("Alpha"),
    r = f.world.nation(id),
    n = r.nation;
  n.projects.spyOperations = 1;
  n.militaryUnits.spies = 5;
  f.world.refresh(r);
  assert.ok(
    f.world
      .buildingQuote(r, "projects", "spyOperations")
      .destroyReasons.some((reason) => reason.includes("Sell spies")),
  );
  assert.throws(
    () => f.act(id, "demolish", { category: "projects", key: "spyOperations" }),
    /Sell spies/,
  );
  const current = f.n(id);
  current.militaryUnits.spies = 0;
  f.act(id, "demolish", { category: "projects", key: "spyOperations" });
  current.wonders.great_library = 1;
  f.world.refresh(f.world.nation(id));
  f.act(id, "startResearch", { key: "basic_barter" });
  f.act(id, "startResearch", { key: "herbal_remedies" });
  assert.throws(
    () => f.act(id, "demolish", { category: "wonders", key: "great_library" }),
    /second research/,
  );
});
test("research output, upkeep, tariffs and flat income affect real hourly transactions", () => {
  const a = fixture(),
    b = fixture(),
    x = a.add("Alpha"),
    y = b.add("Alpha");
  for (const [f, id] of [
    [a, x],
    [b, y],
  ]) {
    const n = f.n(id);
    n.improvements.mine = 5;
    n.improvements.assemblyPlant = 5;
    n.militaryUnits.soldiers = 1000;
    for (const product of Object.keys(
      f.world.nation(id).resources.manufacturingRecipes,
    ))
      n.manufacturing[product] = false;
    f.world.refresh(f.world.nation(id));
  }
  b.n(y).completedResearch = Object.keys(b.world.base.research);
  b.world.refresh(b.world.nation(y));
  assert.ok(b.world.view(y).upkeep.money < a.world.view(x).upkeep.money);
  const before = b.n(y).money,
    upkeep = b.world.view(y).upkeep.money;
  a.advance(HOUR);
  b.advance(HOUR);
  assert.ok(b.n(y).resources.food > a.n(x).resources.food);
  assert.equal(b.n(y).money, before - upkeep + b.n(y).taxRevenue + 25000);
  const motion = {
    status: "passed",
    scope: "world",
    effectEndsAt: a.now() + HOUR,
    type: "WORLD_TRADE_REGULATION",
    parameters: { tariffRates: 10 },
  };
  a.world.state.motions.tariff = structuredClone(motion);
  b.world.state.motions.tariff = structuredClone(motion);
  a.world.refresh(a.world.nation(x));
  b.world.refresh(b.world.nation(y));
  assert.ok(b.n(y).motionModifiers.tariff < a.n(x).motionModifiers.tariff);
});

test("white peace cancels outstanding calls immediately without creating penalties or compensation", () => {
  const f = fixture(),
    a = f.add("Alpha"),
    b = f.add("Beta"),
    c = f.add("Gamma");
  f.pact(b, c, "mutualDefense", 100);
  const id = f.war(a, b),
    call = f.world.state.wars[id].obligations[0];
  assert.throws(
    () => f.act(a, "warRespond", { id, obligation: call.id, accept: true }),
    /pending/,
  );
  f.act(a, "peace", { id });
  f.act(b, "peace", { id });
  assert.equal(f.world.state.wars[id].obligations[0].status, "cancelled");
  assert.throws(
    () => f.act(c, "warRespond", { id, obligation: call.id, accept: false }),
    /pending/,
  );
  f.advance(HOUR);
  assert.equal(f.n(c).diplomaticPenalties.length, 0);
  assert.equal(f.world.state.wars[id].obligations[0].paid, undefined);
});
