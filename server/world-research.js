"use strict";
const own = (object, key) =>
  typeof key === "string" && Object.hasOwn(object, key);
const HOUR = 3_600_000;
function check(condition, message) {
  if (!condition) throw new Error(message);
}

class ResearchManager {
  constructor(world) {
    this.world = world;
  }

  startResearch(r, data) {
    const world = this.world;
    const n = r.nation,
      now = world.clock();
    const q = world.buildingMgr.researchQuote(r, data.key);
    check(q.canStart, q.reasons.join("; "));
    n.activeResearch.push({
      key: data.key,
      startedAt: now,
      progress: 0,
      goal: r.research[data.key].cost,
    });
  }

  cancelResearch(r, data) {
    const n = r.nation;
    const index = n.activeResearch.findIndex((a) => a.key === data.key);
    check(index >= 0, "Research is not active");
    n.money += Math.floor(n.activeResearch[index].paid * 0.5);
    n.activeResearch.splice(index, 1);
  }

  allocateSkill(r, data) {
    check(own(r.skillDefs, data.key), "Unknown skill");
    check(
      r.player.allocateSkillPoint(data.key),
      "Not enough skill points or skill already at maximum",
    );
  }

  goLegendary(r, data) {
    check(r.player.goLegendary(), "Level 70 required");
  }

  allocateLegendarySkill(r, data) {
    check(own(r.skillDefs, data.key), "Unknown skill");
    check(r.player.allocateLegendaryPoint(data.key), "No legendary points");
  }
}

module.exports = { ResearchManager };
