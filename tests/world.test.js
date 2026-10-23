"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { World, HOUR, DAY } = require("../server/world");
function fixture(file = null) {
  let time = 1_700_000_000_000;
  const world = new World({ file, now: () => time });
  const add = (name = "Alpha", factionKey = "blue") =>
    world.register(name, "test-only-hash", {
      name: `${name} Republic`,
      government: "liberalDemocracy",
      religion: "monotheism",
      primaryResource: "food",
      factionKey,
    });
  const act = (id, action, data, requestId = randomUUID()) =>
    world.command(id, action, data, requestId);
  const rich = (id) => {
    const r = world.nation(id),
      n = r.nation;
    n.money = 1e12;
    n.tech = 4000;
    n.land = 100000;
    n.mapBlocks = 1000;
    n.buildTimers = { projects: -100, wonders: -100 };
    for (const key of world.catalog().resources) n.resources[key] = 100000;
    world.refresh(r);
    return r;
  };
  return {
    world,
    add,
    act,
    rich,
    advance: (ms) => {
      time += ms;
      world.advance(time);
    },
    setTime: (value) => {
      time = value;
    },
    now: () => time,
  };
}
test("stat queries and development never collect taxes; turns collect exactly once", () => {
  const { world, add, act, advance } = fixture(),
    id = add();
  act(id, "develop", { kind: "tech", amount: 1 });
  const n = world.nation(id).nation;
  assert.equal(n.money, 14999999);
  for (let i = 0; i < 5; i++) {
    world.refresh(world.nation(id));
    world.view(id);
  }
  assert.equal(n.money, 14999999);
  const before = n.money;
  advance(HOUR);
  assert.equal(n.money, before + n.taxRevenue);
  assert.equal(n.statistics.totalTurns, 1);
  world.advance(world.clock());
  assert.equal(n.statistics.totalTurns, 1);
});
test("construction charges once, honors idempotency, slots and max count", () => {
  const { world, add, act } = fixture(),
    id = add(),
    request = randomUUID();
  act(id, "build", { category: "improvements", key: "mine" }, request);
  act(id, "build", { category: "improvements", key: "mine" }, request);
  assert.equal(world.nation(id).nation.improvements.mine, 1);
  assert.equal(world.nation(id).nation.money, 14250000);
  for (let i = 0; i < 3; i++)
    act(id, "build", { category: "improvements", key: "mine" });
  assert.throws(
    () => act(id, "build", { category: "improvements", key: "mine" }),
    /Maximum/,
  );
  world.nation(id).nation.mapBlocks = 4;
  world.nation(id).nation.land = 400;
  assert.throws(
    () => act(id, "build", { category: "improvements", key: "port" }),
    /slots/,
  );
});
test("project/wonder prerequisites, broadcasting slots, cooldowns and permanent demolition", () => {
  const { world, add, act, rich } = fixture(),
    id = add();
  rich(id);
  act(id, "build", { category: "projects", key: "governmentStatue" });
  assert.throws(
    () =>
      act(id, "demolish", { category: "projects", key: "governmentStatue" }),
    /Permanent/,
  );
  assert.throws(
    () => act(id, "government", { value: "technocracy" }),
    /permanently locked/,
  );
  assert.throws(
    () => act(id, "build", { category: "projects", key: "university" }),
    /cooldown/,
  );
  let n = world.nation(id).nation;
  n.buildTimers.projects = -100;
  n.land = 100;
  n.mapBlocks = 1;
  act(id, "build", { category: "projects", key: "broadcasting" });
  assert.equal(world.nation(id).nation.projects.broadcasting, 1);
  n = world.nation(id).nation;
  n.land = 100000;
  n.mapBlocks = 1000;
  n.buildTimers.wonders = -100;
  assert.throws(
    () =>
      act(id, "build", { category: "wonders", key: "enhancedNuclearWarheads" }),
    /Requires/,
  );
  act(id, "build", { category: "wonders", key: "governmentMonument" });
  act(id, "government", { value: "technocracy" });
  assert.throws(
    () => act(id, "government", { value: "liberalDemocracy" }),
    /cooldown/,
  );
});
test("demolition clears capabilities and refunds only documented salvage fraction", () => {
  const { world, add, act, rich } = fixture(),
    id = add();
  rich(id);
  act(id, "build", { category: "improvements", key: "foreignAffairsOffice" });
  assert.equal(world.nation(id).nation.improvementEffects.canDiplomacy, true);
  const before = world.nation(id).nation.money;
  act(id, "demolish", {
    category: "improvements",
    key: "foreignAffairsOffice",
  });
  assert.equal(
    world.nation(id).nation.improvementEffects.canDiplomacy,
    undefined,
  );
  assert.equal(world.nation(id).nation.money, before);
  world.nation(id).nation.projects.salvageYard = 1;
  act(id, "build", { category: "improvements", key: "mine" });
  const paid = world.nation(id).nation.money;
  act(id, "demolish", { category: "improvements", key: "mine" });
  assert.equal(world.nation(id).nation.money, paid + 750000 * 0.15);
});
test("military uses treasury, validates all quantities, prerequisites and capacity; sales cannot mint resources", () => {
  const { world, add, act, rich } = fixture(),
    id = add();
  rich(id);
  let n = world.nation(id).nation;
  const money = n.money,
    food = n.resources.food;
  act(id, "buyUnit", { type: "soldiers", amount: 100 });
  n = world.nation(id).nation;
  assert.equal(n.money, money - 100);
  assert.equal(n.resources.money, n.money);
  assert.equal(n.resources.food, food - 100);
  act(id, "sellUnit", { type: "soldiers", amount: 100 });
  n = world.nation(id).nation;
  assert.equal(n.money, money - 50);
  assert.equal(n.resources.food, food - 100);
  for (const amount of [0, -1, 1.5, Infinity, NaN, "1"])
    assert.throws(
      () => act(id, "buyUnit", { type: "soldiers", amount }),
      /Quantity/,
    );
  assert.throws(
    () => act(id, "buyUnit", { type: "nukes", amount: 1 }),
    /Capacity|Requires/,
  );
  assert.throws(
    () => act(id, "buyUnit", { type: "__proto__", amount: 1 }),
    /Unknown unit/,
  );
  n = world.nation(id).nation;
  n.tech = 1;
  world.refresh(world.nation(id));
  assert.throws(
    () => act(id, "buyUnit", { type: "tanks", amount: 1 }),
    /Technology/,
  );
});
test("maintenance applies deficit once per turn; production uses the same inventory and storage limits", () => {
  const { world, add, act, rich, advance } = fixture(),
    id = add();
  const r = rich(id);
  r.nation.projects.missileSilo = 1;
  r.nation.wonders.enhancedSilos = 1;
  world.refresh(r);
  act(id, "buyUnit", { type: "missiles", amount: 9 });
  advance(HOUR);
  let n = world.nation(id).nation;
  assert.equal(n.militaryUnits.missiles, 10);
  assert.equal(n.militaryMaintenanceDeficit, false);
  n.money = 0;
  n.resources.ammo = 0;
  advance(HOUR);
  n = world.nation(id).nation;
  assert.equal(n.militaryMaintenanceDeficit, true);
  assert.equal(n.militaryUnits.missiles, 10);
});
test("automatic manufacturing makes fractional progress and honors its toggle", () => {
  const { world, add, rich, advance } = fixture(),
    id = add();
  const r = rich(id);
  r.nation.improvements.assemblyPlant = 1;
  const before = r.nation.resources.steel;
  advance(HOUR);
  assert(world.nation(id).nation.resources.steel > before);
  world.nation(id).nation.manufacturing.steel = false;
  const stopped = world.nation(id).nation.resources.steel;
  advance(HOUR);
  assert.equal(world.nation(id).nation.resources.steel, stopped);
});
test("multi-step failed actions are atomic", () => {
  const { world, add, act } = fixture(),
    id = add();
  world.nation(id).nation.money = 1;
  const before = world.snapshot();
  assert.throws(
    () => act(id, "develop", { kind: "tech", amount: 2 }),
    /Insufficient/,
  );
  assert.deepEqual(world.snapshot(), before);
});
test("market escrow conserves holdings, cannot fill twice, and cancellation returns after 12 turns", () => {
  const { world, add, act, rich, advance } = fixture(),
    a = add(),
    b = add("Beta");
  rich(a);
  rich(b);
  const beforeA = world.nation(a).nation.resources.food,
    beforeB = world.nation(b).nation.resources.food;
  act(a, "offer", { side: "sell", resource: "food", amount: 100, price: 25 });
  const offer = Object.values(world.state.offers)[0];
  assert.equal(world.nation(a).nation.resources.food, beforeA - 100);
  act(b, "acceptOffer", { id: offer.id });
  assert.equal(world.nation(b).nation.resources.food, beforeB + 100);
  assert.throws(
    () => act(b, "acceptOffer", { id: offer.id }),
    /no longer open/,
  );
  act(a, "offer", { side: "sell", resource: "food", amount: 100, price: 25 });
  const next = Object.values(world.state.offers)[0];
  act(a, "cancelOffer", { id: next.id });
  const pending = world.nation(a).nation.resources.food;
  advance(11 * HOUR);
  assert.equal(world.nation(a).nation.resources.food, pending);
  advance(HOUR);
  assert.equal(world.nation(a).nation.resources.food, pending + 100);
});
test("alliance permissions reject ordinary member writes and do not leak treasury/applications", () => {
  const { world, add, act, rich } = fixture(),
    a = add(),
    b = add("Beta"),
    c = add("Gamma");
  rich(a).nation.wonders.allianceHeadquarters = 1;
  act(a, "allianceCreate", {
    name: "Test Alliance",
    description: "A test charter",
    government: "democratic",
  });
  const alliance = Object.values(world.state.alliances)[0];
  act(b, "allianceApply", { id: alliance.id });
  act(a, "allianceReview", { target: b, accept: true });
  assert.throws(
    () => act(b, "allianceSettings", { description: "Hijacked", open: false }),
    /role/,
  );
  assert.throws(() => act(b, "allianceWithdraw", { amount: 1 }), /role/);
  assert.throws(() => act(a, "allianceLeave", {}), /Transfer/);
  assert.equal(world.view(c).alliances[0].treasury, null);
  act(a, "allianceRole", { target: b, role: "secEconomy" });
  act(a, "allianceDeposit", { amount: 100 });
  act(b, "allianceWithdraw", { amount: 50 });
  assert.equal(world.state.alliances[alliance.id].treasury, 50);
});
test("forum requires correct project/wonder, faction and membership age; duplicate votes survive restart", () => {
  const { world, add, act, rich, advance } = fixture(),
    a = add(),
    b = add("Beta"),
    c = add("Gamma", "red");
  rich(a);
  rich(b);
  rich(c);
  world.nation(a).nation.projects.broadcasting = 1;
  world.nation(b).nation.projects.broadcasting = 1;
  world.nation(c).nation.projects.broadcasting = 1;
  const proposal = {
    type: "COLOR_RESOURCE_BOOST",
    title: "More food for everyone",
    body: "Invest in our food supply together.",
    parameters: { duration: 7 },
  };
  act(a, "proposeMotion", proposal);
  let motion = Object.values(world.state.motions)[0];
  assert.throws(
    () => act(a, "vote", { id: motion.id, vote: "for" }),
    /24 real hours/,
  );
  advance(DAY);
  assert.equal(world.state.motions[motion.id].status, "failed");
  act(a, "proposeMotion", proposal);
  motion = Object.values(world.state.motions).at(-1);
  act(a, "vote", { id: motion.id, vote: "for" });
  world.restore(world.snapshot());
  assert.throws(
    () => act(a, "vote", { id: motion.id, vote: "against" }),
    /already voted/,
  );
  assert.throws(
    () => act(c, "vote", { id: motion.id, vote: "for" }),
    /different color/,
  );
  act(b, "vote", { id: motion.id, vote: "for" });
  advance(DAY);
  assert.equal(world.state.motions[motion.id].status, "passed");
  advance(7 * DAY);
  assert.equal(world.state.motions[motion.id].status, "expired");
});
test("research progress and completed effects persist; multiple readers do not speed up research", () => {
  const { world, add, act, rich, advance } = fixture(),
    id = add();
  rich(id);
  act(id, "startResearch", { key: "simple_accounting" });
  const end = world.nation(id).nation.activeResearch[0].endsAt;
  for (let i = 0; i < 3; i++) world.view(id);
  assert.equal(world.nation(id).nation.activeResearch[0].endsAt, end);
  world.restore(world.snapshot());
  advance(40 * HOUR);
  const n = world.nation(id).nation;
  assert(n.completedResearch.includes("simple_accounting"));
  assert.equal(n.researchEffects.tax_efficiency, 3);
  assert.throws(
    () => act(id, "startResearch", { key: "simple_accounting" }),
    /Completed/,
  );
});
test("private and alliance messages are scoped and article ownership is enforced", () => {
  const { world, add, act } = fixture(),
    a = add(),
    b = add("Beta"),
    c = add("Gamma");
  act(a, "message", {
    channel: "private",
    target: b,
    body: "Private test message",
  });
  assert.equal(world.view(b).messages.length, 1);
  assert.equal(world.view(c).messages.length, 0);
  act(a, "article", {
    title: "A <script> story",
    body: "This is a test article with enough text.",
    category: "News",
  });
  const article = Object.values(world.state.articles)[0];
  assert.throws(() => act(b, "deleteArticle", { id: article.id }), /author/);
  assert.equal(world.view(c).articles.length, 1);
  act(b, "comment", { id: article.id, body: "A public comment" });
  assert.equal(world.state.articles[article.id].comments.length, 1);
});
test("restart catch-up matches uninterrupted processing for economy, upkeep and production", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "empires-world-"));
  try {
    const file = path.join(dir, "world.json"),
      f = fixture(file),
      id = f.add();
    f.rich(id);
    f.world.nation(id).nation.improvements.mine = 2;
    f.world.nation(id).nation.improvements.assemblyPlant = 1;
    f.world.save();
    const saved = JSON.parse(fs.readFileSync(file));
    f.advance(3 * HOUR + 15000);
    const continuous = f.world.nation(id).snapshot();
    fs.writeFileSync(file, JSON.stringify(saved));
    const restored = new World({ file, now: f.now });
    const recovered = restored.nation(id).snapshot();
    assert.deepEqual(recovered, continuous);
    assert.equal(restored.state.day, 3);
    assert.equal(restored.advance(f.now()), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
test("server-side map claims prevent duplicate and disconnected territory acquisition", () => {
  const { world, add, act } = fixture(),
    a = add(),
    b = add("Beta");
  act(a, "claim", { x: 0, y: 0 });
  assert.throws(() => act(b, "claim", { x: 0, y: 0 }), /already claimed/);
  assert.throws(() => act(a, "claim", { x: 3, y: 3 }), /touch/);
  act(a, "claim", { x: 1, y: 0 });
  assert.equal(world.view(b).territories["1,0"], a);
});
test("catalog prerequisites resolve, and every construction type can be built without a missing handler", () => {
  const { world, add, act, rich } = fixture(),
    id = add();
  rich(id);
  const catalog = world.catalog().buildings;
  for (const [category, definitions] of Object.entries(catalog))
    for (const [key, def] of Object.entries(definitions)) {
      if (def.requires)
        assert(
          catalog.projects[def.requires] || catalog.wonders[def.requires],
          `${key} has missing prerequisite ${def.requires}`,
        );
      const n = world.nation(id).nation;
      n.buildTimers.projects = -100;
      n.buildTimers.wonders = -100;
      if (def.requires) {
        const kind = catalog.projects[def.requires] ? "projects" : "wonders";
        n[kind][def.requires] = 1;
      }
      if (def.bonusRequirement) n.bonusEffects[def.bonusRequirement] = true;
      act(id, "build", { category, key });
      assert(world.nation(id).nation[category][key] > 0, key);
    }
});
test("war preparation and three rounds finish during offline catch-up", () => {
  const { world, add, act, rich, advance } = fixture(),
    a = add(),
    b = add("Beta");
  rich(a);
  rich(b);
  act(a, "declareWar", { target: b, reason: "Test conflict" });
  const w = Object.values(world.state.wars)[0];
  assert.throws(
    () => act(a, "attack", { id: w.id, type: "conventional" }),
    /preparing/,
  );
  advance(15 * 60000);
  assert.equal(world.state.wars[w.id].status, "active");
  act(a, "buyUnit", { type: "soldiers", amount: 100 });
  act(a, "attack", { id: w.id, type: "conventional" });
  assert(world.state.wars[w.id].damage[a] > 0);
  advance(12 * HOUR);
  assert.equal(world.state.wars[w.id].status, "ended");
});
test("repeated refresh is deterministic and cannot change income or population", () => {
  const { world, add, rich } = fixture(),
    id = add(),
    r = rich(id);
  r.nation.improvements.mine = 4;
  r.nation.improvements.assemblyPlant = 5;
  r.nation.improvements.hospital = 2;
  world.refresh(r);
  const baseline = r.snapshot();
  for (let i = 0; i < 5; i++) world.refresh(r);
  assert.deepEqual(r.snapshot(), baseline);
});
test("aid respects slots, acceptance, declined escrow return, and proposal expiration", () => {
  const { world, add, act, rich, advance } = fixture(),
    a = add(),
    b = add("Beta");
  rich(a);
  rich(b);
  world.nation(a).nation.improvements.foreignAffairsOffice = 1;
  world.nation(a).nation.projects.financialAssistanceOffice = 1;
  const before = world.nation(b).nation.money;
  for (let i = 0; i < 3; i++)
    act(a, "aid", { target: b, type: "money", amount: 100 });
  assert.equal(world.nation(b).nation.money, before);
  assert.throws(() => act(a, "aid", { target: b, amount: 1 }), /slots/);
  const offers = Object.values(world.state.aid);
  act(b, "aidRespond", { id: offers[0].id, accept: true });
  assert.equal(world.nation(b).nation.money, before + 100);
  assert.throws(
    () => act(b, "aidRespond", { id: offers[0].id, accept: true }),
    /pending/,
  );
  act(b, "aidRespond", { id: offers[1].id, accept: false });
  advance(DAY);
  assert.equal(world.state.aid[offers[1].id].status, "returned");
  advance(6 * DAY);
  assert.equal(world.state.aid[offers[2].id].status, "returned");
  assert.equal(world.state.aid[offers[0].id].status, "completed");
});
test("monthly congress elections gate world proposals; world votes finish in chronological order", () => {
  const { world, add, act, rich, advance } = fixture(),
    id = add();
  const r = rich(id);
  r.nation.projects.broadcasting = 1;
  r.nation.wonders.internet = 1;
  advance(30 * HOUR);
  act(id, "elect", { targets: [id] });
  assert.equal(world.congress().blue.representatives.length, 0);
  advance(DAY);
  assert.deepEqual(world.congress().blue.representatives, [id]);
  act(id, "proposeMotion", {
    type: "WORLD_NAME_CHANGE",
    title: "A name for our world",
    body: "Give this world a new public name.",
    parameters: { newWorldName: "The Test Dominion" },
  });
  const m = Object.values(world.state.motions)[0];
  act(id, "vote", { id: m.id, vote: "for" });
  advance(3 * DAY);
  assert.equal(world.state.motions[m.id].status, "passed");
  assert.equal(world.state.worldName, "The Test Dominion");
});
test("long restart replay preserves random demand choices and fractional turns", () => {
  const f = fixture(),
    id = f.add();
  f.rich(id);
  const initial = f.world.snapshot();
  for (let i = 0; i < 60; i++) f.advance(HOUR);
  const continuous = f.world.nation(id).snapshot();
  const replay = new World({ file: null, now: f.now });
  replay.restore(initial);
  replay.advance(f.now());
  assert.deepEqual(replay.nation(id).snapshot(), continuous);
});
test("percentage combat skills use decimal fractions once; critical damage remains flat", () => {
  const { world, add } = fixture(),
    r = world.nation(add());
  r.player.skills.aim.level = 20;
  r.nation.nationStats.militaryMorale = 1;
  assert.equal(r.combat.calculateMissileDamage(r.nation, r.player), 650);
  r.player.skills.criticalDamage.level = 4;
  r.player.skills.attack.level = 10;
  assert.equal(r.combat.calculateCriticalDamage(1000, r.player), 100);
});

test("peace pacts cannot be cancelled or bypassed and expire while offline", () => {
  const f = fixture(),
    a = f.add(),
    b = f.add("Beta");
  for (const id of [a, b])
    f.rich(id).nation.improvements.foreignAffairsOffice = 1;
  f.act(a, "treatyPropose", { target: b, type: "peace", duration: 1 });
  const id = Object.keys(f.world.state.treaties)[0];
  f.act(b, "treatyRespond", { id, accept: true });
  assert.throws(() => f.act(a, "treatyCancel", { id }), /cannot be cancelled/);
  assert.throws(() => f.act(a, "declareWar", { target: b }), /peace treaty/);
  const restored = new World({ file: null, now: f.now });
  restored.restore(f.world.snapshot());
  f.advance(DAY);
  restored.advance(f.now());
  assert.equal(f.world.state.treaties[id].status, "expired");
  assert.equal(restored.state.treaties[id].status, "expired");
  f.act(a, "declareWar", { target: b });
});

test("spent weapons forfeit their purchase basis; future units cannot reclaim it", () => {
  const f = fixture(),
    a = f.add(),
    b = f.add("Beta");
  const r = f.rich(a);
  f.rich(b);
  r.nation.projects.missileSilo = 1;
  f.world.refresh(r);
  f.act(a, "buyUnit", { type: "missiles", amount: 2 });
  const basis = f.world.nation(a).nation.recruitmentBasis.missiles;
  f.act(a, "declareWar", { target: b });
  f.advance(15 * 60000);
  f.act(a, "attack", {
    id: Object.keys(f.world.state.wars)[0],
    type: "missiles",
  });
  assert.equal(f.world.nation(a).nation.recruitmentBasis.missiles, basis / 2);
  assert.equal(
    f.world.unitQuote(f.world.nation(a), "missiles").refund,
    Math.floor(basis / 4),
  );
  f.act(a, "sellUnit", { type: "missiles", amount: 1 });
  assert.equal(f.world.nation(a).nation.recruitmentBasis.missiles, 0);
});

test("salvage recovers a fraction of the price paid during construction subsidies", () => {
  const f = fixture(),
    id = f.add(),
    r = f.rich(id);
  r.nation.projects.salvageYard = 1;
  r.nation.wonders.enhancedSalvage = 1;
  f.world.state.motions.discount = {
    type: "COLOR_INFRASTRUCTURE_PUSH",
    scope: "color",
    faction: "blue",
    status: "passed",
    effectEndsAt: f.now() + DAY,
    parameters: { buildingCostReduction: 90, populationGrowthPenalty: 0 },
  };
  f.world.refresh(r);
  const before = r.nation.money;
  f.act(id, "build", { category: "improvements", key: "mine" });
  const paid = before - r.nation.money;
  f.act(id, "demolish", { category: "improvements", key: "mine" });
  assert.equal(r.nation.money, before - paid + Math.floor(paid * 0.3));
  assert(r.nation.money < before);
});

test("port agreements exchange atomically, retry shortages and preserve slots across restart", () => {
  const f = fixture(),
    a = f.add(),
    b = f.add("Beta"),
    c = f.add("Gamma");
  for (const id of [a, b, c]) f.rich(id).nation.improvements.port = 1;
  f.act(a, "tradePropose", {
    target: b,
    give: "food",
    giveAmount: 20,
    receive: "water",
    receiveAmount: 10,
    duration: 1,
  });
  const id = Object.keys(f.world.state.tradeAgreements)[0];
  assert.throws(
    () =>
      f.act(a, "tradePropose", {
        target: c,
        give: "food",
        giveAmount: 1,
        receive: "water",
        receiveAmount: 1,
        duration: 1,
      }),
    /partner slots/,
  );
  assert.throws(
    () => f.act(c, "tradeRespond", { id, accept: true }),
    /not found/,
  );
  f.act(b, "tradeRespond", { id, accept: true });
  assert.throws(
    () => f.act(a, "demolish", { category: "improvements", key: "port" }),
    /free this port/,
  );
  const initial = f.world.snapshot();
  const food = f.world.nation(a).nation.resources.food,
    water = f.world.nation(a).nation.resources.water;
  f.advance(HOUR);
  assert.equal(f.world.state.tradeAgreements[id].deliveries, 1);
  assert.equal(f.world.nation(a).nation.resources.food, food - 20);
  assert.equal(f.world.nation(a).nation.resources.water, water + 10);
  const restored = new World({ file: null, now: f.now });
  restored.restore(initial);
  restored.advance(f.now());
  assert.deepEqual(restored.snapshot(), f.world.snapshot());
  f.world.nation(b).nation.resources.water = 0;
  const before = f.world.nation(a).nation.resources.food;
  f.advance(HOUR);
  assert.equal(f.world.state.tradeAgreements[id].deliveries, 1);
  assert.equal(f.world.nation(a).nation.resources.food, before);
  f.world.nation(b).nation.resources.water = 100;
  f.advance(HOUR);
  assert.equal(f.world.state.tradeAgreements[id].deliveries, 2);
  f.advance(DAY);
  assert.equal(f.world.state.tradeAgreements[id].status, "expired");
  assert.equal(f.world.view(a).tradePartners.length, 0);
});

test("permanent agreements require a Trade Hub and cancelled agreements stop all future transfers", () => {
  const f = fixture(),
    a = f.add(),
    b = f.add("Beta");
  for (const id of [a, b]) f.rich(id).nation.improvements.port = 1;
  const terms = {
    target: b,
    give: "food",
    giveAmount: 1,
    receive: "water",
    receiveAmount: 1,
    duration: 0,
  };
  assert.throws(() => f.act(a, "tradePropose", terms), /Trade Hub/);
  f.world.nation(a).nation.projects.tradeHub = 1;
  f.act(a, "tradePropose", terms);
  const id = Object.keys(f.world.state.tradeAgreements)[0];
  f.act(b, "tradeRespond", { id, accept: true });
  assert.equal(f.world.state.tradeAgreements[id].endsAt, null);
  assert.throws(
    () => f.act(a, "demolish", { category: "projects", key: "tradeHub" }),
    /permanent trade/,
  );
  f.act(b, "tradeCancel", { id });
  f.advance(HOUR);
  assert.equal(f.world.state.tradeAgreements[id].deliveries, 0);
  assert.equal(f.world.view(a).tradePartners.length, 0);
});

test("round casualties apply recovery buildings, conserve resale basis and award war outcomes once", () => {
  const f = fixture(),
    a = f.add(),
    b = f.add("Beta");
  for (const id of [a, b]) {
    const r = f.rich(id);
    r.nation.projects.militarySalvage = 1;
    r.nation.wonders.militaryRecovery = 1;
    f.world.refresh(r);
    f.act(id, "buyUnit", { type: "soldiers", amount: 1000 });
    f.act(id, "buyUnit", { type: "tanks", amount: 100 });
  }
  f.act(a, "declareWar", { target: b });
  const id = Object.keys(f.world.state.wars)[0];
  f.advance(15 * 60000);
  let w = f.world.state.wars[id];
  w.damage[a] = 100;
  w.damage[b] = 100;
  const before = f.world.nation(a).nation.resources.steel;
  // Run casualty resolution directly to isolate material recovery from hourly upkeep.
  f.world.processRoundCasualties(w);
  const n = f.world.nation(a).nation;
  assert.equal(n.militaryUnits.soldiers, 757);
  assert.equal(n.militaryUnits.tanks, 75);
  assert.equal(n.recruitmentBasis.soldiers, 757);
  const steel = n.calculateMilitaryCost("tanks", 25).resources.steel;
  assert.equal(n.resources.steel, before + Math.floor(steel * 0.18));
  w.damage[b] = 0;
  f.advance(4 * HOUR);
  w = f.world.state.wars[id];
  w.damage[a] = 100;
  f.advance(4 * HOUR);
  assert.equal(f.world.state.wars[id].result, a);
  assert.equal(f.world.nation(a).nation.statistics.warsWon, 1);
  assert.equal(f.world.nation(b).nation.statistics.warsLost, 1);
  assert(
    f.world
      .nation(a)
      .nation.temporaryEffects.some((e) => e.type === "happinessBonus"),
  );
  f.advance(HOUR);
  assert.equal(f.world.nation(a).nation.statistics.warsWon, 1);
});
