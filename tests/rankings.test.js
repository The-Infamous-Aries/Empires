"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { World, HOUR } = require("../server/world");
const R = require("../server/rankings");
function fixture(at = Date.UTC(2026, 9, 25, 23, 30)) {
  let now = at;
  const world = new World({ file: null, now: () => now });
  const add = (name) =>
    world.register(name, "synthetic-hash", {
      name,
      government: "liberalDemocracy",
      religion: "monotheism",
      primaryResource: "food",
      factionKey: "blue",
    });
  const id = add("Alpha"),
    other = add("Beta");
  const act = (action, data, requestId = randomUUID()) =>
    world.command(id, action, data, requestId);
  const current = () =>
    world.view(id).rankings.nations.find((n) => n.id === id);
  const setTime = (t) => {
    now = t;
  };
  const update = (fn) => world.transact(() => fn(world.nation(id)));
  return { world, id, other, act, current, setTime, update };
}
test("ranking calendar uses UTC Monday weeks, actual month lengths and leap years", () => {
  const sunday = Date.UTC(2026, 9, 25, 23, 59, 59);
  assert.deepEqual(R.calendar("week", sunday), {
    start: Date.UTC(2026, 9, 19),
    end: Date.UTC(2026, 9, 26),
  });
  assert.deepEqual(R.calendar("week", Date.UTC(2026, 9, 26)), {
    start: Date.UTC(2026, 9, 26),
    end: Date.UTC(2026, 10, 2),
  });
  assert.deepEqual(R.calendar("month", Date.UTC(2024, 1, 20)), {
    start: Date.UTC(2024, 1, 1),
    end: Date.UTC(2024, 2, 1),
  });
  assert.deepEqual(R.calendar("year", Date.UTC(2026, 11, 31)), {
    start: Date.UTC(2026, 0, 1),
    end: Date.UTC(2027, 0, 1),
  });
});
test("period achievement totals are idempotent, atomic, persistent and independent of page views", () => {
  const f = fixture();
  const request = randomUUID();
  f.act("build", { category: "improvements", key: "mine" }, request);
  f.act("build", { category: "improvements", key: "mine" }, request);
  assert.equal(f.current().periods.week.current.construction, 1);
  const before = f.world.snapshot();
  for (let i = 0; i < 10; i++) f.world.view(f.id);
  assert.deepEqual(f.world.snapshot(), before, "reads cannot create scores");
  assert.throws(
    () =>
      f.world.transact(() => {
        f.world.nation(f.id).player.statistics.buildingsConstructed += 100;
        throw Error("rollback");
      }),
    /rollback/,
  );
  assert.deepEqual(f.world.snapshot(), before);
  const restored = new World({ file: null, now: f.world.clock });
  restored.restore(JSON.parse(JSON.stringify(before)));
  assert.deepEqual(restored.view(f.id).rankings, f.world.view(f.id).rankings);
});
test("real weekly Current, Average, Best and Total use completed period scores and preserve peaks", () => {
  const f = fixture();
  assert.equal(f.current().periods.week.average, null);
  f.update((r) => {
    r.player.statistics.buildingsConstructed += 3;
    r.nation.money = 20000000;
  });
  f.update((r) => {
    r.nation.money = 5;
  });
  assert.equal(f.current().periods.week.current.treasury, 20000000);
  assert.equal(f.current().total.treasury, 20000000);
  const monday = Date.UTC(2026, 9, 26);
  f.setTime(monday);
  R.record(f.world, monday);
  assert.equal(f.current().periods.week.current.construction, 0);
  assert.equal(f.current().periods.week.average.construction, 3);
  f.update((r) => {
    r.player.statistics.buildingsConstructed += 5;
  });
  assert.equal(
    f.current().periods.week.average.construction,
    3,
    "unfinished week excluded",
  );
  f.setTime(Date.UTC(2026, 10, 2));
  R.record(f.world, f.world.clock());
  const row = f.current();
  assert.equal(row.periods.week.samples, 2);
  assert.equal(row.periods.week.average.construction, 4);
  assert.equal(row.periods.week.best.construction, 5);
  assert.equal(row.total.construction, 8);
  assert.equal(row.periods.week.current.construction, 0);
});
test("new tracking preserves lifetime counters without inventing earlier period achievements", () => {
  const f = fixture();
  const saved = f.world.snapshot();
  delete saved.rankings;
  saved.nations[f.id].player.statistics.tradesCompleted = 90;
  saved.nations[f.id].nation.statistics.warsWon = 7;
  f.world.restore(saved);
  const row = f.current();
  assert.equal(row.total.trade, 90);
  assert.equal(row.total.wins, 7);
  assert.equal(row.periods.month.current.trade, 0);
  assert.equal(row.periods.year.current.wins, 0);
  assert.equal(row.periods.week.average, null);
});
test("actual claimed territory, completed research, trade and war counters reach their matching rankings", () => {
  const f = fixture();
  f.act("claim", { x: 0, y: 0 });
  f.act("offer", { side: "buy", resource: "food", amount: 1, price: 1 });
  const offer = Object.values(f.world.state.offers)[0];
  f.world.nation(f.other).nation.resources.food = 10;
  f.world.command(f.other, "acceptOffer", { id: offer.id }, randomUUID());
  f.update((r) => {
    r.nation.money = 1e9;
    r.nation.tech = 10;
    f.world.refresh(r);
  });
  f.act("startResearch", { key: "basic_barter" });
  const deadline = f.world.nation(f.id).nation.activeResearch[0].endsAt;
  f.setTime(deadline);
  f.world.advance(deadline);
  const row = f.current();
  assert.equal(row.total.territories, 1);
  assert.equal(row.total.trade, 1);
  assert.equal(row.total.research, 1);
  f.update((r) => {
    r.nation.statistics.warsWon += 1;
  });
  assert.equal(f.current().total.wins, 1);
});
test("ranking boundaries run without a connected client and offline replay agrees with uninterrupted progression", () => {
  const f = fixture(Date.UTC(2026, 11, 31, 23, 30));
  f.update((r) => {
    r.player.statistics.treatiesSigned = 2;
  });
  const saved = f.world.snapshot();
  const target = Date.UTC(2027, 0, 1, 1, 30);
  f.setTime(target);
  f.world.advance(target);
  assert.equal(f.current().periods.year.samples, 1);
  assert.equal(f.current().periods.year.best.treaties, 2);
  assert.equal(f.current().periods.year.current.treaties, 0);
  const restarted = new World({ file: null, now: () => saved.lastProcessed });
  restarted.restore(JSON.parse(JSON.stringify(saved)));
  restarted.clock = () => target;
  restarted.advance(target);
  assert.deepEqual(restarted.view(f.id).rankings, f.world.view(f.id).rankings);
  assert.equal(
    f.world.state.day,
    2,
    "real calendar boundary must not add an hourly turn",
  );
});
test("private national statistics exclude all ranking history and rejoin from intact stored results", () => {
  const f = fixture();
  f.act("claim", { x: 0, y: 0 });
  f.act("settings", { group: "privacy", key: "showStatistics", value: false });
  assert(!f.world.view(f.other).rankings.nations.some((n) => n.id === f.id));
  assert.equal(f.world.view(f.id).rankings.ownStatisticsPublic, false);
  f.act("settings", { group: "privacy", key: "showStatistics", value: true });
  assert.equal(f.current().total.territories, 1);
});
