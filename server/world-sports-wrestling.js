"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { randomBytes } = require("node:crypto");
const WrestlingSystem = require("../systems/Sports/wrestling-system");
const WrestlerSystem = require("../systems/Sports/wrestler-system");

// ═══════════════════════════════════════════════════════════════════════════════
// SPORTS ENGINE (moved from server/sports.js)
// Loads team-player-system, draft-system, ai-team-system, sports-system into a
// VM sandbox and exposes a Sports class that delegates to SportsSystem.
// ═══════════════════════════════════════════════════════════════════════════════

const script = new vm.Script(
  fs.readFileSync(path.join(__dirname, "../systems/Sports/team-player-system.js"), "utf8") +
    "\n" +
  fs.readFileSync(path.join(__dirname, "../systems/Sports/draft-system.js"), "utf8") +
    "\n" +
  fs.readFileSync(path.join(__dirname, "../systems/Sports/ai-team-system.js"), "utf8") +
    "\n" +
  fs.readFileSync(path.join(__dirname, "../systems/Sports/sports-system.js"), "utf8") +
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
      check(team.players.size < 40, "Maximum roster is 40 players");
      e.signPlayer({ nationId: id, sport: d.sport, playerId: p.id });
    } else if (action === "teamTrain") {
      check(
        e.teamPlayerSystem.sportAttributes[d.sport] &&
          e.teamPlayerSystem.sportAttributes[d.sport].includes(d.attribute),
        "Invalid attribute for this sport",
      );
      e.teamPlayerSystem.trainPlayer(team, d.playerId, d.attribute, n);
    } else if (action === "teamExtendContract") {
      const seasons = Number(d.seasons);
      check(
        Number.isSafeInteger(seasons) && seasons >= 1 && seasons <= 5,
        "Contract must be 1-5 seasons",
      );
      const player = team.players.get(d.playerId);
      check(player, "Player not on your team");
      e.teamPlayerSystem.extendContract(player, seasons, n);
    } else if (action === "teamDraft") {
      const p = e.players.get(d.playerId);
      check(
        p && !p.isRetired && !e.getPlayerTeam(p.id),
        "Player is not a free agent",
      );
      check(p.sport === d.sport, "Player plays a different sport");
      check(team.players.size < 40, "Maximum roster is 40 players");
      e.teamPlayerSystem.signPlayer(team, d.playerId, n);
      p.isDrafted = true;
      p.draftRateMultiplier = 1.0;
      const board = e.draftSystem.draftBoards.get(d.sport);
      if (board) board.delete(d.playerId);
    } else if (action === "teamSetSub") {
      check(
        Number.isSafeInteger(d.add) === false || typeof d.add === "boolean",
        "Invalid add flag",
      );
      e.teamPlayerSystem.setSub(team, d.position, d.playerId, d.add !== false);
    } else if (action === "leagueCreate") {
      check(
        e.sportTypes.includes(d.sport),
        "Unknown sport",
      );
      check(
        e.hasStadiumWonder(id, d.sport),
        "Matching stadium wonder required",
      );
      check(
        typeof d.name === "string" &&
          d.name.trim().length >= 3 &&
          d.name.trim().length <= 60,
        "League name must contain 3–60 characters",
      );
      const aiCount = Number(d.fillWithAI) || 0;
      check(
        Number.isSafeInteger(aiCount) && aiCount >= 0 && aiCount <= 30,
        "AI team count must be 0–30",
      );
      const league = e.createLeague({
        nationId: id,
        sport: d.sport,
        name: d.name.trim(),
      });
      // Auto-join the creator (createLeague already does this)
      // Optionally fill with AI teams
      if (aiCount > 0) {
        for (let i = 0; i < aiCount; i++) {
          const aiTeam = e.aiTeamSystem.createAITeam({
            sport: d.sport,
            teamName: `AI ${d.sport.charAt(0).toUpperCase() + d.sport.slice(1)} Team ${i + 1}`,
            leagueId: league.id,
          });
          league.teams.push({
            nationId: aiTeam.nationId,
            teamId: aiTeam.id,
            teamName: aiTeam.name,
            sideId: league.sides[0].id,
          });
          // Autodraft AI team roster
          e.aiTeamSystem.autodraftAITeam(aiTeam.id);
        }
      }
      return { league };
    } else if (action === "leagueJoin") {
      check(d.leagueId, "League ID required");
      const league = e.leagues.get(d.leagueId);
      check(league, "League not found");
      check(
        e.sportTypes.includes(league.sport),
        "Unknown sport",
      );
      check(
        e.hasStadiumWonder(id, league.sport),
        "Matching stadium wonder required",
      );
      check(
        !league.teams.some(t => t.nationId === id),
        "You already have a team in this league",
      );
      check(
        league.teams.length < e.maxLeagueTeams,
        "League is full",
      );
      check(
        league.status === 'waiting' || league.status === 'registration',
        "League is not open for joining",
      );
      const result = e.joinLeague({
        leagueId: d.leagueId,
        nationId: id,
        teamName: d.teamName || `${league.sport.charAt(0).toUpperCase() + league.sport.slice(1)} Team`,
        sport: league.sport,
        sideId: d.sideId,
      });
      return result;
    } else if (action === "leagueStartDraft") {
      check(d.leagueId, "League ID required");
      const league = e.leagues.get(d.leagueId);
      check(league, "League not found");
      check(
        league.teams.some(t => t.nationId === id),
        "You are not in this league",
      );
      e.startDraft(d.leagueId);
      return { league };
    } else if (action === "leagueStartSeason") {
      check(d.leagueId, "League ID required");
      const league = e.leagues.get(d.leagueId);
      check(league, "League not found");
      check(
        league.teams.some(t => t.nationId === id),
        "You are not in this league",
      );
      e.startSeason(d.leagueId);
      return { league };
    } else if (action === "leagueDraftPick") {
      check(d.leagueId, "League ID required");
      check(d.playerId, "Player ID required");
      const league = e.leagues.get(d.leagueId);
      check(league, "League not found");
      check(
        league.status === 'draft',
        "League is not in draft phase",
      );
      const team = e.getTeam(id, league.sport);
      check(team, "You do not have a team in this league");
      e.draftPlayer({
        leagueId: d.leagueId,
        nationId: id,
        playerId: d.playerId,
      });
      return { league };
    } else if (action === "leagueFillWithAI") {
      check(d.leagueId, "League ID required");
      check(
        Number.isSafeInteger(d.count) && d.count > 0 && d.count <= 30,
        "AI team count must be 1–30",
      );
      const league = e.leagues.get(d.leagueId);
      check(league, "League not found");
      check(
        league.teams.some(t => t.nationId === id),
        "You are not in this league",
      );
      check(
        league.status === 'waiting' || league.status === 'registration',
        "League is not open for joining",
      );
      for (let i = 0; i < d.count; i++) {
        const aiTeam = e.aiTeamSystem.createAITeam({
          sport: league.sport,
          teamName: `AI ${league.sport.charAt(0).toUpperCase() + league.sport.slice(1)} ${i + 1}`,
          leagueId: league.id,
        });
        let sideId = league.sides[0].id;
        if (league.sides.length > 1) {
          // Assign to side with fewest teams
          const sideCounts = {};
          for (const s of league.sides) sideCounts[s.id] = 0;
          for (const t of league.teams) {
            if (t.sideId && sideCounts[t.sideId] !== undefined) sideCounts[t.sideId]++;
          }
          sideId = Object.keys(sideCounts).reduce((a, b) => sideCounts[a] < sideCounts[b] ? a : b);
        }
        league.teams.push({
          nationId: aiTeam.nationId,
          teamId: aiTeam.id,
          teamName: aiTeam.name,
          sideId,
        });
        e.aiTeamSystem.autodraftAITeam(aiTeam.id);
      }
      return { league };
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

    // Auto-manage AI team rosters each season
    for (const [teamId, team] of e.teams) {
      for (const [sport, t] of Object.entries(team)) {
        if (t.isAI) {
          e.aiTeamSystem.processAITeamSeason(t.id);
        }
      }
    }
  }
  turn(at, day) {
    this.at = at;
    const e = this.engine;

    // Drive the global season cycle (registration -> draft -> active -> championship -> offseason)
    e.advanceSeasonCycle();

    // Phase-specific processing
    switch (e.seasonCycle.phase) {
      case 'active':
        e.processDailyGames();
        break;
      case 'leagueChampionship':
      case 'worldChampionship':
        e.processChampionshipGames();
        break;
      case 'offseason':
        e.processOffseason();
        break;
    }

    // Per-player development, retirement, injuries
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
              subs: [...t.subs.entries()],
              injuries: [...t.injuries],
              players: [...t.players.entries()].map(([key, player]) => ({
                ...player,
                rating: e.calculatePlayerRating(player),
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

// ═══════════════════════════════════════════════════════════════════════════════
// SPORTS-WRESTLING MANAGER — single entry point for all sports + wrestling
// ═══════════════════════════════════════════════════════════════════════════════

class SportsWrestlingManager {
  constructor(world, saved = null) {
    this.world = world;
    const sportsSaved = saved && saved.sports ? saved.sports : null;
    const wrestlingSaved = saved && saved.wrestling ? saved.wrestling : null;

    // ── Sports sub-system (team leagues, seasons, drafts, betting) ──
    this.sports = new Sports(world, sportsSaved);

    // ── Wrestling sub-system (promotions, weekly shows, PPVs) ──
    this.wrestling = new WrestlingSystem(world, wrestlingSaved);
    // Wire WrestlerSystem into WrestlingSystem
    this.wrestling.wrestlerSystem = new WrestlerSystem(this.wrestling);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ACTION DELEGATION (routed from world-actions.js runAction)
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Handle team* actions (teamCreate, teamUpgrade, teamStarter, teamRelease,
   * teamSign, teamBet, teamDraft, teamSetSub, teamTrain, teamExtendContract,
   * leagueCreate, leagueJoin, leagueStartDraft, leagueStartSeason,
   * leagueDraftPick, leagueFillWithAI).
   * Delegates to this.sports.action(id, action, data).
   */
  teamAction(r, action, data) {
    return this.sports.action(r.nation.id, action, data);
  }

  /**
   * Handle wrestling* actions (wrestlingCreatePromotion,
   * wrestlingChangeAiringDay, wrestlingBookMatch, wrestlingRemoveMatch,
   * wrestlingSetWeeklyCard, wrestlingUpgradeArena, wrestlingSetTicketPrice,
   * wrestlingDraftWrestler, wrestlingReleaseWrestler, wrestlingExtendContract,
   * wrestlingTrainWrestler, wrestlingChangeFeaturedMatch,
   * wrestlingSetSignatureMove, wrestlingSetFinisherMove, wrestlingSetMoveSet,
   * wrestlingCreateTagTeam, wrestlingDissolveTagTeam, wrestlingVacateTitle,
   * wrestlingMassPpvRegisterWrestler).
   * Delegates to this.wrestling.action(id, action, data).
   */
  wrestlingAction(r, action, data) {
    return this.wrestling.action(r.nation.id, action, data);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // TICK / DEADLINE / TURN PROCESSING
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Process championship/tournament matches for both sports and wrestling.
   * Called by World.advance() each tick.
   */
  process(at) {
    this.sports.process(at);
  }

  /**
   * Daily turn processing for both sports and wrestling.
   * Called by World.advance() once per game day.
   */
  turn(at, day) {
    this.sports.turn(at, day);
    this.wrestling.turn(at, day);
  }

  /**
   * Compute the next scheduled deadline across both sub-systems.
   * Includes sports nextDeadline and wrestling Mass PPV cycle.
   */
  nextDeadline() {
    let next = this.sports.nextDeadline ? this.sports.nextDeadline() : Infinity;
    const w = this.wrestling.nextDeadline ? this.wrestling.nextDeadline() : null;
    if (w && w < next) next = w;
    return next;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW (client-facing state snapshot)
  // ══════════════════════════════════════════════════════════════════════════════

  view(id) {
    return {
      sports: this.sports.view ? this.sports.view(id) : null,
      wrestling: this.wrestling.view ? this.wrestling.view(id) : null,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ══════════════════════════════════════════════════════════════════════════════

  snapshot() {
    return {
      sports: this.sports.snapshot ? this.sports.snapshot() : null,
      wrestling: this.wrestling.getState ? this.wrestling.getState() : null,
    };
  }

  restore(saved) {
    if (!saved) return;
    if (saved.sports) {
      this.sports = new Sports(this.world, saved.sports);
    }
    if (saved.wrestling) {
      this.wrestling = new WrestlingSystem(this.world, saved.wrestling);
      this.wrestling.wrestlerSystem = new WrestlerSystem(this.wrestling);
    }
  }
}

module.exports = { SportsWrestlingManager, Sports };
