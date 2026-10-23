"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { randomBytes } = require("node:crypto");
const script = new vm.Script(
  fs.readFileSync(path.join(__dirname, "../systems/sports-system.js"), "utf8") +
    "\nnew SportsSystem()",
);
const DAY = 86_400_000;
const HOUR = 3_600_000;
function check(ok, message) {
  if (!ok) throw new Error(message);
}
function encode(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) =>
      Object.prototype.toString.call(v) === "[object Map]"
        ? { $map: [...v] }
        : v,
    ),
  );
}
function decode(value) {
  return JSON.parse(JSON.stringify(value), (_, v) =>
    v && Array.isArray(v.$map) ? new Map(v.$map) : v,
  );
}
class Sports {
  constructor(world, saved) {
    this.world = world;
    this.at = world.clock();
    this.randomState = saved?.randomState ?? randomBytes(4).readUInt32LE();
    const math = Object.create(Math);
    math.random = () => {
      this.randomState = (this.randomState + 0x6d2b79f5) >>> 0;
      let t = this.randomState;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const current = () => this.at;
    class SimulationDate extends Date {
      constructor(...args) {
        super(...(args.length ? args : [current()]));
      }
      static now() {
        return current();
      }
    }
    const sandbox = {
      Date: SimulationDate,
      Math: math,
      setInterval: () => 0,
      console: { log() {}, warn() {}, error() {} },
    };
    sandbox.window = sandbox;
    this.engine = script.runInContext(vm.createContext(sandbox));
    this.engine.getNation = (id) => world.nation(id).nation;
    this.engine.hasWonder = (id, key) => !!world.nation(id).nation.wonders[key];
    this.engine.hasStadiumWonder = (id, sport) =>
      this.engine.hasWonder(id, `${sport}Stadium`);
    if (saved) this.engine.setState(decode(saved.data));
  }
  snapshot() {
    return {
      randomState: this.randomState,
      data: encode(this.engine.getState()),
    };
  }
  catalog() {
    return {
      types: this.engine.sportTypes,
      positions: this.engine.playerPositions,
      upgrades: this.engine.stadiumUpgrades,
      creationCost: 10_000_000,
      tournamentPrize: 10_000_000,
    };
  }
  ownTeam(id, sport) {
    check(this.engine.sportTypes.includes(sport), "Unknown sport");
    const team = this.engine.getTeam(id, sport);
    check(team, "Create a team first");
    return team;
  }
  action(id, action, d) {
    this.at = this.world.clock();
    const e = this.engine,
      n = this.world.nation(id).nation;
    if (action === "teamCreate") {
      check(e.sportTypes.includes(d.sport), "Unknown sport");
      check(!e.getTeam(id, d.sport), "You already own this team");
      check(
        e.hasStadiumWonder(id, d.sport),
        "Matching stadium wonder required",
      );
      check(
        typeof d.name === "string" &&
          d.name.trim().length >= 3 &&
          d.name.trim().length <= 60,
        "Team name must contain 3–60 characters",
      );
      check(n.money >= 10_000_000, "Team creation costs $10,000,000");
      n.money -= 10_000_000;
      e.createTeam({ nationId: id, sport: d.sport, teamName: d.name.trim() });
      return;
    }
    if (action === "teamBet") {
      check(n.projects.sportsBetting, "Sports Betting project required");
      const match = e.matches.get(d.matchId);
      check(
        match?.status === "scheduled" && match.date > this.at,
        "Betting is closed",
      );
      check(
        [match.team1, match.team2, "draw"].includes(d.prediction),
        "Choose a match result",
      );
      check(
        Number.isSafeInteger(d.amount) && d.amount > 0 && d.amount <= 1_000_000,
        "Bet must be 1–1,000,000",
      );
      check(
        ![...e.bets.values()].some(
          (b) => b.bettorId === id && b.matchId === match.id,
        ),
        "You already bet on this match",
      );
      // Participants cannot bet on a match they can influence through roster changes.
      check(
        ![match.team1, match.team2].some(
          (key) => e.getTeamById(key).nationId === id,
        ),
        "Team owners cannot bet on their own matches",
      );
      e.placeBet({
        bettorId: id,
        matchId: match.id,
        betType: "winner",
        amount: d.amount,
        prediction: d.prediction,
      });
      return;
    }
    const team = this.ownTeam(id, d.sport);
    check(e.hasStadiumWonder(id, d.sport), "Matching stadium wonder required");
    if (action === "teamUpgrade") {
      check(e.stadiumUpgrades.includes(d.upgradeType), "Unknown facility");
      e.upgradeStadium({
        nationId: id,
        sport: d.sport,
        upgradeType: d.upgradeType,
      });
    } else if (action === "teamStarter") {
      check(team.players.includes(d.playerId), "Player is not on your team");
      const p = e.players.get(d.playerId);
      check(!p.isInjured && !p.isRetired, "Player is unavailable");
      check(
        Number.isSafeInteger(d.slot) &&
          d.slot >= 0 &&
          d.slot < e.playerPositions[d.sport].length,
        "Unknown lineup slot",
      );
      check(
        p.position === e.playerPositions[d.sport][d.slot],
        "Player does not play this position",
      );
      for (const [slot, key] of team.roster)
        if (key === p.id) team.roster.delete(slot);
      team.roster.set(String(d.slot), p.id);
    } else if (action === "teamRelease") {
      check(
        team.players.length > e.playerPositions[d.sport].length,
        "Keep enough players to field a team",
      );
      e.releasePlayer({ nationId: id, sport: d.sport, playerId: d.playerId });
    } else if (action === "teamSign") {
      const p = e.players.get(d.playerId);
      check(
        p && !p.isRetired && !e.getPlayerTeam(p.id),
        "Player is not a free agent",
      );
      check(team.players.length < 40, "Maximum roster is 40 players");
      e.signPlayer({ nationId: id, sport: d.sport, playerId: p.id });
    } else if (action === "teamTournament") {
      check(
        ["league", "cup", "championship"].includes(d.type),
        "Unknown competition type",
      );
      check(
        ![...e.tournaments.values()].some(
          (t) =>
            t.sport === d.sport &&
            ["registration", "active"].includes(t.status),
        ),
        "This sport already has an open competition",
      );
      check(
        n.money >= 10_000_000,
        "The organizer must fund the $10,000,000 prize",
      );
      n.money -= 10_000_000;
      const t = e.createTournament(d.sport, d.type);
      t.organizer = id;
      t.prizeEscrow = 10_000_000;
      e.registerForTournament(t.id, id, d.sport);
    } else if (action === "teamRegister") {
      const t = e.tournaments.get(d.tournamentId);
      check(
        t?.sport === d.sport && t.registrationDeadline > this.at,
        "Competition registration is closed",
      );
      e.registerForTournament(t.id, id, d.sport);
    } else throw new Error("Unknown team action");
  }
  nextDeadline() {
    let next = Infinity;
    for (const t of this.engine.tournaments.values()) {
      if (t.status === "registration") next = Math.min(next, t.startDate);
      else if (t.status === "active")
        for (const m of t.matches)
          if (!m.completed) next = Math.min(next, m.scheduledTime);
    }
    return next;
  }
  schedule(t, home, away, at, round) {
    const id = this.engine.generateId();
    t.matches.push({
      id,
      homeTeam: home,
      awayTeam: away,
      scheduledTime: at,
      round,
      completed: false,
    });
    this.engine.matches.set(id, {
      id,
      team1: home,
      team2: away,
      sport: t.sport,
      date: at,
      status: "scheduled",
    });
  }
  knockout(t, ids, at) {
    t.byes = [];
    for (let i = 0; i < ids.length; i += 2) {
      if (!ids[i + 1]) t.byes.push(ids[i]);
      else this.schedule(t, ids[i], ids[i + 1], at + HOUR, t.currentRound);
    }
  }
  finish(t, winner) {
    const team = this.engine.getTeamById(winner);
    team.budget += t.prizeEscrow;
    team.stats.championships++;
    t.prizeEscrow = 0;
    t.winner = winner;
    t.status = "completed";
    t.finishedAt = this.at;
  }
  process(at) {
    this.at = at;
    const e = this.engine;
    for (const t of e.tournaments.values()) {
      if (t.status === "registration" && t.startDate <= at) {
        if (t.participants.length < 2) {
          this.world.nation(t.organizer).nation.money += t.prizeEscrow;
          t.prizeEscrow = 0;
          t.status = "cancelled";
          continue;
        }
        t.status = "active";
        if (t.type === "league") {
          let round = 0;
          for (let i = 0; i < t.participants.length; i++)
            for (let j = i + 1; j < t.participants.length; j++) {
              const a = t.participants[i].teamId,
                b = t.participants[j].teamId;
              this.schedule(t, a, b, at + ++round * HOUR, round);
              this.schedule(t, b, a, at + ++round * HOUR, round);
            }
        } else
          this.knockout(
            t,
            t.participants.map((p) => p.teamId),
            at,
          );
      }
      if (t.status !== "active") continue;
      for (const m of t.matches) {
        if (m.completed || m.scheduledTime > at) continue;
        const a = e.getTeamById(m.homeTeam),
          b = e.getTeamById(m.awayTeam);
        const result = e.simulateMatch(a, b);
        e.matches.delete(result.id);
        result.id = m.id;
        result.status = "completed";
        result.date = m.scheduledTime;
        e.matches.set(m.id, result);
        m.completed = true;
        m.result = result;
        e.updateTournamentStandings(t, result);
        e.processMatchBets(result);
        m.winner =
          result.score1 === result.score2
            ? this.engine.calculateTeamStrength(a) >=
              this.engine.calculateTeamStrength(b)
              ? a.id
              : b.id
            : result.score1 > result.score2
              ? a.id
              : b.id;
      }
      if (t.matches.length && t.matches.every((m) => m.completed)) {
        if (t.type === "league") {
          const ranked = [...t.standings].sort(
            ([a, x], [b, y]) =>
              y.points - x.points ||
              y.goalsFor - y.goalsAgainst - (x.goalsFor - x.goalsAgainst) ||
              a.localeCompare(b),
          );
          this.finish(t, ranked[0][0]);
        } else {
          const winners = [
            ...t.matches
              .filter((m) => m.round === t.currentRound)
              .map((m) => m.winner),
            ...t.byes,
          ];
          if (winners.length === 1) this.finish(t, winners[0]);
          else {
            t.currentRound++;
            this.knockout(t, winners, at);
          }
        }
      }
    }
  }
  turn(at, day) {
    this.at = at;
    const e = this.engine;
    for (const p of e.players.values()) {
      if (day % 360 === 0) p.age++;
      if (!p.isRetired) {
        e.processPlayerDevelopment(p);
        e.checkRetirement(p);
      }
    }
    e.processInjuries();
    e.processTeamRevenue();
    e.processYouthAcademies();
  }
  view(id) {
    const e = this.engine;
    return {
      teams: [...e.teams.values()]
        .flatMap((sports) => Object.values(sports))
        .map((t) => ({
          id: t.id,
          nationId: t.nationId,
          sport: t.sport,
          name: t.name,
          stats: t.stats,
        })),
      own: Object.fromEntries(
        Object.entries(e.teams.get(id) || {}).map(([sport, t]) => [
          sport,
          {
            ...encode(t),
            roster: [...t.roster],
            injuries: [...t.injuries],
            players: t.players.map((key) => ({
              ...e.players.get(key),
              rating: e.calculatePlayerRating(e.players.get(key)),
            })),
            upgradeCosts: Object.fromEntries(
              e.stadiumUpgrades.map((key) => [
                key,
                e.getUpgradeCost(key, t.stadium.upgrades[key] + 1),
              ]),
            ),
          },
        ]),
      ),
      freeAgents: [...e.players.values()].filter(
        (p) => !p.isRetired && !e.getPlayerTeam(p.id),
      ),
      tournaments: [...e.tournaments.values()].map((t) => ({
        ...t,
        standings: [...t.standings],
      })),
      matches: [...e.matches.values()].slice(-200),
      bets: [...e.bets.values()].filter((b) => b.bettorId === id),
    };
  }
}
module.exports = { Sports };
