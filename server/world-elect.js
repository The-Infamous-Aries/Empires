"use strict";
const DAY = 24 * 3_600_000;
function check(condition, message) {
  if (!condition) throw new Error(message);
}

class ElectionManager {
  constructor(world) {
    this.world = world;
  }

  elect(r, data) {
    const world = this.world;
    const n = r.nation;
    check(
      world.state.election.status === "voting" &&
        world.clock() < world.state.election.endsAt,
      "Congress elections are not open",
    );
    check(
      n.projects.broadcasting && world.clock() - n.factionJoinedAt >= DAY,
      "Broadcasting and 24-hour membership required",
    );
    const targets = data.targets || [data.target],
      faction = world.congress()[n.factionKey];
    check(
      Array.isArray(targets) &&
        targets.length > 0 &&
        targets.length <= faction.seats &&
        new Set(targets).size === targets.length,
      "Select distinct candidates up to your faction seat count",
    );
    check(
      targets.every((id) => faction.eligible.includes(id)),
      "Candidate is not eligible for your faction",
    );
    world.state.electionVotes[n.id] = targets;
  }
}

module.exports = { ElectionManager };
