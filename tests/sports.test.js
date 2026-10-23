"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { World, HOUR, DAY } = require("../server/world");
function fixture() {
  let now = 1700000000000;
  const world = new World({ file: null, now: () => now });
  const add = (name) => {
    const id = world.register(name, "test", {
      name: name + " Nation",
      government: "liberalDemocracy",
      religion: "monotheism",
      primaryResource: "food",
      factionKey: "blue",
    });
    const n = world.nation(id).nation;
    n.money = 1e9;
    n.wonders.soccerStadium = 1;
    n.wonders.basketballStadium = 1;
    n.projects.sportsBetting = 1;
    return id;
  };
  const act = (id, action, data) =>
    world.command(id, action, data, randomUUID());
  return {
    world,
    add,
    act,
    now: () => now,
    advance: (ms) => {
      now += ms;
      world.advance(now);
    },
  };
}
test("clubs charge once, retain all soccer lineup positions, and enforce ownership", () => {
  const f = fixture(),
    a = f.add("Alpha"),
    b = f.add("Beta"),
    before = f.world.nation(a).nation.money;
  f.act(a, "teamCreate", { sport: "soccer", name: "Meridian United" });
  let team = f.world.sports.engine.getTeam(a, "soccer");
  assert.equal(f.world.nation(a).nation.money, before - 10_000_000);
  assert.equal(team.roster.size, 11);
  assert.equal(new Set(team.roster.values()).size, 11);
  assert(
    team.players.every(
      (id) => typeof id === "string" && f.world.sports.engine.players.has(id),
    ),
  );
  assert.throws(
    () => f.act(a, "teamCreate", { sport: "soccer", name: "Duplicate" }),
    /already/,
  );
  assert.throws(
    () =>
      f.act(b, "teamStarter", {
        sport: "soccer",
        slot: 0,
        playerId: team.players[0],
      }),
    /Create a team/,
  );
  f.act(b, "teamCreate", { sport: "soccer", name: "Coastal City" });
  team = f.world.sports.engine.getTeam(a, "soccer");
  assert.throws(
    () => f.act(b, "teamSign", { sport: "soccer", playerId: team.players[0] }),
    /free agent/,
  );
  const playerId = team.players.at(-1);
  f.act(a, "teamRelease", { sport: "soccer", playerId });
  f.act(b, "teamSign", { sport: "soccer", playerId });
  assert(f.world.sports.engine.getTeam(b, "soccer").players.includes(playerId));
});
test("sports maps survive JSON persistence, hourly injuries heal, facility effects do not compound", () => {
  const f = fixture(),
    a = f.add("Alpha");
  f.act(a, "teamCreate", { sport: "soccer", name: "Meridian United" });
  f.act(a, "teamUpgrade", { sport: "soccer", upgradeType: "Fan Experience" });
  f.act(a, "teamUpgrade", { sport: "soccer", upgradeType: "Fan Experience" });
  let team = f.world.sports.engine.getTeam(a, "soccer");
  assert.equal(team.stadium.capacity, 35000);
  const player = f.world.sports.engine.players.get(team.players[0]);
  player.isInjured = true;
  player.injuryDaysLeft = 1;
  team.injuries.set(player.id, { daysLeft: 1, type: "minor" });
  const saved = JSON.parse(JSON.stringify(f.world.snapshot()));
  const restored = new World({ file: null, now: f.now });
  restored.restore(saved);
  f.advance(HOUR);
  restored.advance(f.now());
  assert.deepEqual(restored.snapshot(), f.world.snapshot());
  team = restored.sports.engine.getTeam(a, "soccer");
  assert.equal(team.injuries.size, 0);
  assert.equal(restored.sports.engine.players.get(player.id).isInjured, false);
  assert(team.revenue > 0 && team.expenses > 0);
});
test("competitions start without browsers, settle stakes once, and pay only funded prizes", () => {
  const f = fixture(),
    a = f.add("Alpha"),
    b = f.add("Beta"),
    c = f.add("Gamma");
  for (const id of [a, b])
    f.act(id, "teamCreate", {
      sport: "soccer",
      name: id === a ? "Meridian United" : "Coastal City",
    });
  f.act(a, "teamTournament", { sport: "soccer", type: "league" });
  const t = [...f.world.sports.engine.tournaments.values()][0];
  f.act(b, "teamRegister", { sport: "soccer", tournamentId: t.id });
  f.advance(7 * DAY);
  let current = f.world.sports.engine.tournaments.get(t.id);
  assert.equal(current.status, "active");
  assert.equal(current.matches.length, 2);
  const m = f.world.sports.engine.matches.get(current.matches[0].id),
    money = f.world.nation(c).nation.money;
  assert.throws(
    () =>
      f.act(a, "teamBet", { matchId: m.id, prediction: m.team1, amount: 100 }),
    /owners/,
  );
  f.act(c, "teamBet", { matchId: m.id, prediction: m.team1, amount: 100 });
  assert.equal(f.world.nation(c).nation.money, money - 100);
  assert.throws(
    () =>
      f.act(c, "teamBet", { matchId: m.id, prediction: m.team1, amount: 100 }),
    /already/,
  );
  const initial = f.world.snapshot();
  f.advance(2 * HOUR);
  const restored = new World({ file: null, now: f.now });
  restored.restore(initial);
  restored.advance(f.now());
  assert.deepEqual(restored.snapshot(), f.world.snapshot());
  current = f.world.sports.engine.tournaments.get(t.id);
  assert.equal(current.status, "completed");
  assert.equal(current.prizeEscrow, 0);
  const bet = [...f.world.sports.engine.bets.values()][0];
  assert(["won", "lost"].includes(bet.status));
  const snapshot = f.world.snapshot();
  f.world.advance(f.now());
  assert.deepEqual(f.world.snapshot(), snapshot);
  assert.throws(
    () =>
      f.act(c, "teamBet", { matchId: m.id, prediction: m.team1, amount: 100 }),
    /closed/,
  );
});
test("knockout competitions preserve byes and reach one champion; empty competitions refund escrow", () => {
  const f = fixture(),
    ids = ["Alpha", "Beta", "Gamma"].map(f.add);
  for (const id of ids)
    f.act(id, "teamCreate", {
      sport: "soccer",
      name: "Club " + id.slice(0, 8),
    });
  f.act(ids[0], "teamTournament", { sport: "soccer", type: "cup" });
  const t = [...f.world.sports.engine.tournaments.values()][0];
  for (const id of ids.slice(1))
    f.act(id, "teamRegister", { sport: "soccer", tournamentId: t.id });
  f.advance(7 * DAY + 2 * HOUR);
  assert.equal(f.world.sports.engine.tournaments.get(t.id).status, "completed");
  assert.equal(f.world.sports.engine.tournaments.get(t.id).matches.length, 2);
  f.act(ids[0], "teamCreate", { sport: "basketball", name: "Meridian Hoops" });
  f.act(ids[0], "teamTournament", { sport: "basketball", type: "league" });
  const solo = [...f.world.sports.engine.tournaments.values()].find(
    (t) => t.sport === "basketball",
  );
  f.advance(7 * DAY);
  assert.equal(
    f.world.sports.engine.tournaments.get(solo.id).status,
    "cancelled",
  );
  assert.equal(f.world.sports.engine.tournaments.get(solo.id).prizeEscrow, 0);
});
