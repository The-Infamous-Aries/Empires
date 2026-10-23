"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { World } = require("../server/world");
const UI = require("../ui/live/presentation");
function setup() {
  const world = new World({ file: null, now: () => 1_700_000_000_000 });
  const id = world.register("Presentation", "test-hash", {
    name: "Presentation Republic",
    government: "liberalDemocracy",
    religion: "monotheism",
    primaryResource: "food",
    factionKey: "blue",
  });
  return { world, id, r: world.nation(id) };
}
test("quantity previews match authoritative unit quotes including discount rounding and refund basis", () => {
  const { world, r } = setup();
  r.nation.money = 1e12;
  r.nation.tech = 4000;
  r.nation.mapBlocks = 1000;
  r.nation.land = 100000;
  for (const key of world.catalog().resources) r.nation.resources[key] = 1e9;
  world.refresh(r);
  for (const discounted of [false, true]) {
    r.nation.bonusEffects.armsPile = discounted;
    for (const type of Object.keys(world.view(r.nation.id).units)) {
      r.nation.militaryUnits[type] = 7;
      r.nation.recruitmentBasis[type] = 137;
      for (const amount of [1, 3, 7, 11, 1000000]) {
        const expected = world.unitQuote(r, type, amount);
        const actual = UI.unitTotals(
          r.nation,
          world.unitQuote(r, type),
          amount,
        );
        assert.deepEqual(
          { money: actual.money, ...actual.resources },
          expected.cost,
          `${type} x${amount}`,
        );
        assert.equal(
          actual.canBuy,
          expected.canBuy,
          `${type} purchase eligibility`,
        );
        assert.equal(
          actual.canSell,
          expected.canSell,
          `${type} sale eligibility`,
        );
        assert.equal(
          actual.refund,
          expected.refund,
          `${type} paid basis refund`,
        );
      }
    }
  }
});
test("previews retain prerequisites and recompute affordability, capacity, and invalid quantities", () => {
  const { world, r } = setup();
  r.nation.money = 0;
  const quote = world.unitQuote(r, "soldiers");
  for (const amount of [0, -1, 1.5, NaN, Infinity, 1000001]) {
    const actual = UI.unitTotals(r.nation, quote, amount);
    assert.equal(actual.canBuy, false);
    assert.equal(actual.canSell, false);
  }
  assert.equal(UI.unitTotals(r.nation, quote, 1).canBuy, false);
  r.nation.money = 1e12;
  world.refresh(r);
  const fresh = world.unitQuote(r, "soldiers");
  assert.equal(
    UI.unitTotals(r.nation, fresh, fresh.capacity + 1).canBuy,
    false,
  );
  assert.equal(
    UI.unitTotals(r.nation, world.unitQuote(r, "nukes"), 1).canBuy,
    false,
  );
  r.nation.militaryUnits.soldiers = 5;
  r.nation.recruitmentBasis.soldiers = 0;
  assert.equal(
    UI.unitTotals(r.nation, world.unitQuote(r, "soldiers"), 5).refund,
    0,
  );
});
test("map eligibility matches real claims at world edges, occupied squares, adjacency, and exhausted land", () => {
  for (const [placed, blocks, x, y, allowed] of [
    [[], 10, -25, 25, true],
    [[], 10, 26, 0, false],
    [[], 10, 0.5, 0, false],
    [["0,0"], 10, 1, 0, true],
    [["0,0"], 10, 1, 1, false],
    [["0,0"], 10, 0, 0, false],
    [["0,0"], 1, 1, 0, false],
  ]) {
    const { world, id, r } = setup();
    r.nation.territories = placed;
    r.nation.mapBlocks = blocks;
    world.state.territories = Object.fromEntries(
      placed.map((key) => [key, id]),
    );
    assert.equal(UI.canClaim(world.view(id), x, y), allowed);
    const act = () => world.command(id, "claim", { x, y }, randomUUID());
    if (allowed) assert.doesNotThrow(act);
    else assert.throws(act);
  }
});
