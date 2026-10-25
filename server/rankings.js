"use strict";
// Persistent, bounded calendar aggregates. Values come only from authoritative rules.
const metrics = {
  strength: {
    name: "Highest Strength Overall",
    set: 1,
    kind: "peak",
    unit: "strength",
  },
  wins: { name: "Most Wins", set: 1, kind: "counter", unit: "wars won" },
  population: {
    name: "Largest Population",
    set: 2,
    kind: "peak",
    unit: "people",
  },
  treasury: { name: "Largest Treasury", set: 2, kind: "peak", unit: "money" },
  technology: {
    name: "Most Owned Technology",
    set: 3,
    kind: "peak",
    unit: "technology",
  },
  research: {
    name: "Most Research Completed",
    set: 3,
    kind: "counter",
    unit: "discoveries",
  },
  construction: {
    name: "Most Buildings Constructed",
    set: 4,
    kind: "counter",
    unit: "buildings",
  },
  trade: {
    name: "Most Trades Completed",
    set: 4,
    kind: "counter",
    unit: "trades",
  },
  territories: {
    name: "Most Territories Claimed",
    set: 5,
    kind: "counter",
    unit: "territories",
  },
  treaties: {
    name: "Most Treaties Signed",
    set: 5,
    kind: "counter",
    unit: "treaties",
  },
  missileHits: {
    name: "Most Missile Hits",
    set: 1,
    kind: "counter",
    unit: "hits",
  },
  missileMisses: {
    name: "Most Missile Misses",
    set: 1,
    kind: "counter",
    unit: "misses",
  },
  nukeHits: {
    name: "Most Nuclear Hits",
    set: 1,
    kind: "counter",
    unit: "hits",
  },
  nukeMisses: {
    name: "Most Nuclear Misses",
    set: 1,
    kind: "counter",
    unit: "misses",
  },
};
const periods = { week: "Weekly", month: "Monthly", year: "Yearly" };
const DAY = 86400000;
function calendar(period, at) {
  const date = new Date(at);
  const y = date.getUTCFullYear(),
    m = date.getUTCMonth();
  let start, end;
  if (period === "week") {
    const midnight = Date.UTC(y, m, date.getUTCDate());
    start = midnight - ((date.getUTCDay() + 6) % 7) * DAY;
    end = start + 7 * DAY;
  } else if (period === "month") {
    start = Date.UTC(y, m, 1);
    end = Date.UTC(y, m + 1, 1);
  } else if (period === "year") {
    start = Date.UTC(y, 0, 1);
    end = Date.UTC(y + 1, 0, 1);
  } else throw new Error("Unknown ranking period");
  return { start, end };
}
const values = (r) => ({
  strength: r.nation.militaryStrength,
  wins: r.nation.statistics.warsWon || 0,
  population: r.nation.population,
  treasury: r.nation.money,
  technology: r.nation.tech,
  research: r.player.statistics.researchCompleted,
  construction: r.player.statistics.buildingsConstructed,
  trade: r.player.statistics.tradesCompleted,
  // The live claim action awards the player's counter.
  territories: r.player.statistics.territoriesClaimed,
  treaties: r.player.statistics.treatiesSigned,
  missileHits: r.nation.statistics.missileHits || 0,
  missileMisses: r.nation.statistics.missileMisses || 0,
  nukeHits: r.nation.statistics.nukeHits || 0,
  nukeMisses: r.nation.statistics.nukeMisses || 0,
});
const finite = (value) => (Number.isFinite(value) ? Math.max(0, value) : 0);
const map = (fn) =>
  Object.fromEntries(
    Object.entries(metrics).map(([key, def]) => [key, fn(key, def)]),
  );
function initial(r, at) {
  const last = map((key) => finite(values(r)[key]));
  return {
    since: at,
    last,
    total: { ...last },
    periods: Object.fromEntries(
      Object.keys(periods).map((period) => [
        period,
        {
          ...calendar(period, at),
          count: 0,
          sum: map(() => 0),
          best: map(() => 0),
          current: map((key, def) => (def.kind === "peak" ? last[key] : 0)),
        },
      ]),
    ),
  };
}
function ensure(world) {
  world.state.rankings ||= { version: 1, nations: {} };
  for (const [id, r] of world.rules)
    world.state.rankings.nations[id] ||= initial(r, world.state.lastProcessed);
}
function roll(entry, period, at) {
  const p = entry.periods[period];
  while (p.end <= at) {
    for (const key of Object.keys(metrics)) {
      p.sum[key] += p.current[key];
      p.best[key] = Math.max(p.best[key], p.current[key]);
    }
    p.count++;
    const next = calendar(period, p.end);
    Object.assign(p, next);
    p.current = map((key, def) => (def.kind === "peak" ? entry.last[key] : 0));
  }
}
function record(world, at) {
  // New nations begin at the action's timestamp, rather than a previous turn.
  world.state.rankings ||= { version: 1, nations: {} };
  for (const [id, r] of world.rules) {
    let entry = world.state.rankings.nations[id];
    if (!entry) {
      world.state.rankings.nations[id] = initial(r, at);
      continue;
    }
    const next = values(r);
    for (const period of Object.keys(periods)) roll(entry, period, at);
    for (const [key, def] of Object.entries(metrics)) {
      const value = finite(next[key]);
      const delta = Math.max(0, value - entry.last[key]);
      entry.total[key] = Math.max(entry.total[key], value);
      for (const p of Object.values(entry.periods))
        p.current[key] =
          def.kind === "peak"
            ? Math.max(p.current[key], value)
            : p.current[key] + delta;
      entry.last[key] = value;
    }
  }
}
function deadline(world) {
  return Math.min(
    Infinity,
    ...Object.values(world.state.rankings?.nations || {}).flatMap((e) =>
      Object.values(e.periods).map((p) => p.end),
    ),
  );
}
function view(world, requester) {
  const at = world.clock();
  const records = [];
  for (const [id, r] of world.rules) {
    // Honor the existing public-statistics preference, including aggregate history.
    if (!r.player.settings.privacy.showStatistics) continue;
    const entry = JSON.parse(JSON.stringify(world.state.rankings.nations[id]));
    if (!entry) continue;
    for (const period of Object.keys(periods)) roll(entry, period, at);
    records.push({
      id,
      name: r.nation.name,
      factionKey: r.nation.factionKey,
      since: entry.since,
      total: entry.total,
      periods: Object.fromEntries(
        Object.entries(entry.periods).map(([period, p]) => [
          period,
          {
            start: p.start,
            end: p.end,
            samples: p.count,
            current: p.current,
            average: p.count ? map((key) => p.sum[key] / p.count) : null,
            best: p.count ? p.best : null,
          },
        ]),
      ),
    });
  }
  return {
    asOf: at,
    nations: records,
    ownStatisticsPublic:
      world.nation(requester).player.settings.privacy.showStatistics,
  };
}
module.exports = { metrics, periods, calendar, ensure, record, deadline, view };
