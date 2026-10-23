"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { World, HOUR } = require("../server/world");
const UI = require("../ui/live/presentation");
const Help = require("../ui/live/help");
function setup() {
  let now = 1700000000000;
  const world = new World({ file: null, now: () => now });
  const add = (name) => {
    const id = world.register(name, "synthetic-hash", {
      name: name + " Republic",
      government: "liberalDemocracy",
      religion: "monotheism",
      primaryResource: "food",
      factionKey: "blue",
    });
    const r = world.nation(id);
    Object.assign(r.nation, {
      money: 1e12,
      tech: 1000,
      infra: 100,
      land: 10000,
      mapBlocks: 100,
    });
    for (const k of world.catalog().resources) r.nation.resources[k] = 10000;
    world.refresh(r);
    return id;
  };
  const a = add("Alpha"),
    b = add("Beta");
  const act = (id, action, data) =>
    world.command(id, action, data, randomUUID());
  const quote = (id, action, data) => {
    const before = world.snapshot();
    const result = world.actionQuote(id, action, data);
    assert.deepEqual(
      world.snapshot(),
      before,
      "preview must not mutate any world, player, RNG, research or treasury state",
    );
    return result;
  };
  return {
    world,
    a,
    b,
    act,
    quote,
    advance: (ms) => {
      now += ms;
      world.advance(now);
    },
  };
}
test("development full-quantity prices match sequential actions and remain visible when unaffordable", () => {
  const { world, a, act, quote } = setup();
  Object.assign(world.nation(a).nation, {
    tech: 10,
    infra: 10,
    land: 2000,
    mapBlocks: 20,
  });
  world.refresh(world.nation(a));
  for (const kind of ["land", "infra", "tech"]) {
    for (const amount of [1, 3, 100]) {
      const q = quote(a, "develop", { kind, amount });
      assert.equal(q.canAct, true, q.reasons.join());
      const before = world.nation(a).nation.money;
      act(a, "develop", { kind, amount });
      assert.equal(before - world.nation(a).nation.money, q.cost.money);
      world.nation(a).nation.money = 1e12;
    }
    world.nation(a).nation.money = 0;
    const q = quote(a, "develop", { kind, amount: 3 });
    assert.equal(q.canAct, false);
    assert(q.cost.money > 0);
    const before = world.snapshot();
    assert.throws(
      () => act(a, "develop", { kind, amount: 3 }),
      /Insufficient money/,
    );
    assert.deepEqual(world.snapshot(), before, "failed batch must roll back");
    world.nation(a).nation.money = 1e12;
  }
  for (const amount of [0, -1, 101, 1.5])
    assert.equal(quote(a, "develop", { kind: "land", amount }).canAct, false);
});
test("choice previews enforce unchanged selection, demands, permanent locks and monument cooldown", () => {
  const { world, a, act, quote, advance } = setup();
  for (const action of ["government", "religion"]) {
    let n = world.nation(a).nation;
    n.demandTimer[`isDemanding${action[0].toUpperCase() + action.slice(1)}`] =
      false;
    const data = { value: n[action] };
    assert.equal(quote(a, action, data).canAct, false);
    assert.throws(() => act(a, action, data), /Already selected/);
    n = world.nation(a).nation;
    n.demandTimer[`isDemanding${action[0].toUpperCase() + action.slice(1)}`] =
      true;
    assert.equal(quote(a, action, data).canAct, true);
    const statue =
        action === "government" ? "governmentStatue" : "religiousStatue",
      monument =
        action === "government" ? "governmentMonument" : "religiousMonument";
    n.projects[statue] = 1;
    assert.match(quote(a, action, data).reasons.join(), /locked/);
    n.wonders[monument] = 1;
    assert.equal(quote(a, action, data).canAct, true);
    act(a, action, data);
    const next = Object.keys(
      world.catalog()[action === "government" ? "governments" : "religions"],
    ).find((k) => k !== data.value);
    assert.match(quote(a, action, { value: next }).reasons.join(), /14-turn/);
    advance(14 * HOUR);
    assert.equal(quote(a, action, { value: next }).canAct, true);
  }
});
test("war previews use the actual target, slots, peace, energy, weapons and intuition rules", () => {
  const { world, a, b, act, quote, advance } = setup();
  let r = world.nation(a);
  assert.equal(quote(a, "declareWar", { target: b }).canAct, true);
  r.nation.allianceId = "same";
  world.nation(b).nation.allianceId = "same";
  assert.match(quote(a, "declareWar", { target: b }).reasons.join(), /ally/);
  r.nation.allianceId = null;
  world.nation(b).nation.allianceId = null;
  act(a, "declareWar", { target: b });
  const w = Object.values(world.state.wars)[0];
  assert.match(
    quote(a, "declareWar", { target: b }).reasons.join(),
    /Already at war/,
  );
  assert.match(
    quote(a, "attack", {
      id: w.id,
      target: b,
      type: "conventional",
    }).reasons.join(),
    /preparing/,
  );
  advance(15 * 60000);
  r = world.nation(a);
  r.nation.militaryUnits.soldiers = 100;
  world.refresh(r);
  const data = { id: w.id, target: b, type: "conventional" };
  assert.equal(quote(a, "attack", data).canAct, true);
  assert.equal(quote(a, "attack", { ...data, target: a }).canAct, false);
  r.player.currentEnergy = 0;
  assert.match(quote(a, "attack", data).reasons.join(), /energy/);
  r.player.currentEnergy = 100;
  for (const type of ["spies", "missiles", "nukes"]) {
    assert.equal(quote(a, "attack", { ...data, type }).canAct, false);
    r.nation.militaryUnits[type] = 1;
    r.player.currentIntuition = 0;
    assert.equal(quote(a, "attack", { ...data, type }).canAct, false);
    r.player.currentIntuition = 100;
    assert.equal(quote(a, "attack", { ...data, type }).canAct, true);
  }
  r.nation.motionModifiers.nuclearBan = true;
  assert.match(
    quote(a, "attack", { ...data, type: "nukes" }).reasons.join(),
    /nuclear ban/,
  );
  world.nation(b).nation.motionModifiers.peace = true;
  assert.match(quote(a, "attack", data).reasons.join(), /peace/);
  world.nation(b).nation.motionModifiers.peace = false;
  act(a, "attack", { ...data, type: "spies" });
  assert(world.nation(a).nation.intelligence[b]);
});
test("trade previews check both nations, duplicate agreements and owner embargoes", () => {
  const { world, a, b, act, quote } = setup();
  const data = {
    target: b,
    give: "food",
    receive: "water",
    giveAmount: 10,
    receiveAmount: 10,
    duration: 7,
  };
  world.nation(a).nation.improvements.port = 1;
  assert.match(quote(a, "tradePropose", data).reasons.join(), /Both nations/);
  world.nation(b).nation.improvements.port = 1;
  assert.equal(quote(a, "tradePropose", data).canAct, true);
  assert.equal(
    quote(a, "tradePropose", { ...data, giveAmount: 1000001 }).canAct,
    false,
  );
  assert.equal(
    quote(a, "tradePropose", { ...data, duration: 0 }).canAct,
    false,
  );
  act(a, "tradePropose", data);
  assert.equal(quote(a, "tradePropose", data).canAct, false);
  const agreement = Object.values(world.state.tradeAgreements)[0];
  world.nation(a).nation.motionModifiers.embargo = ["food"];
  assert.equal(
    quote(b, "tradeRespond", { id: agreement.id, accept: true }).canAct,
    false,
  );
  assert.equal(world.view(b).tradeAgreements[0].acceptance.canAct, false);
  world.nation(a).nation.motionModifiers.embargo = [];
  assert.equal(
    quote(b, "tradeRespond", { id: agreement.id, accept: true }).canAct,
    true,
  );
  act(b, "tradeRespond", { id: agreement.id, accept: true });
  act(a, "offer", { side: "sell", resource: "food", amount: 5, price: 10 });
  const offer = Object.values(world.state.offers)[0];
  world.nation(b).nation.motionModifiers.tariff = 0.1;
  assert.deepEqual(quote(b, "acceptOffer", { id: offer.id }).cost, {
    money: 55,
  });
  world.nation(a).nation.motionModifiers.embargo = ["food"];
  assert.equal(world.view(b).offers[0].acceptance.canAct, false);
});
test("forum preview validates parameter contracts and the author's active proposal limit", () => {
  const { world, a, act, quote } = setup();
  world.nation(a).nation.projects.broadcasting = 1;
  const data = {
    type: "COLOR_RESOURCE_BOOST",
    title: "Improve production",
    body: "A proposal to increase production.",
    parameters: {
      resourceType: "all",
      boostPercentage: 10,
      damageReduction: 15,
      duration: 7,
    },
  };
  assert.equal(quote(a, "proposeMotion", data).canAct, true);
  assert.equal(
    quote(a, "proposeMotion", {
      ...data,
      parameters: { ...data.parameters, resourceType: "invalid" },
    }).canAct,
    false,
  );
  for (let i = 0; i < 3; i++) act(a, "proposeMotion", data);
  assert.match(quote(a, "proposeMotion", data).reasons.join(), /three active/);
});
test("display units, congress tallies and live help tips describe actual conditions", () => {
  const { world, a } = setup();
  const c = world.catalog();
  assert.deepEqual(
    UI.choiceEffects(c.governments.constitutionalMonarchy, "government"),
    {
      "Happiness bonus": "+8%",
      "Stability bonus": "+15%",
      "Tax revenue bonus": "+8%",
      "Reputation bonus": "+8%",
      "Military strength bonus": "+5%",
      "Research speed penalty": "-8%",
    },
  );
  assert.equal(
    UI.choiceEffects(c.religions.monotheism, "religion")[
      "Research speed penalty"
    ],
    undefined,
    "religion technology penalty has no live consumer",
  );
  assert.deepEqual(
    UI.motionTally({ votes: { a: { vote: "for" }, b: { vote: "against" } } }),
    { for: 1, against: 1, abstain: 0 },
  );
  assert.deepEqual(
    UI.motionTally({
      votes: {},
      factionResults: {
        blue: { position: "for", seats: 4 },
        red: { position: "against", seats: 1 },
        green: { position: "abstain", seats: 2 },
      },
    }),
    { for: 4, against: 1, abstain: 2 },
  );
  const state = world.view(a);
  state.nation.militaryMaintenanceDeficit = true;
  assert(Help.tips(state).some((t) => t.page === "military"));
  assert.equal(new Set(Help.topics.map((t) => t.id)).size, 13);
  assert(
    Help.tips(state).every((t) =>
      Help.topics.some((topic) => topic.id === t.page),
    ),
  );
  assert.doesNotMatch(c.bonuses.books.description, /diplomacy/);
  assert.doesNotMatch(c.bonuses.construction.description, /build speed/);
});
