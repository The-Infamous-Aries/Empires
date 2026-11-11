"use strict";
function check(condition, message) {
  if (!condition) throw new Error(message);
}

class TerritoryManager {
  constructor(world) {
    this.world = world;
  }

  claim(r, data) {
    const world = this.world;
    const n = r.nation,
      id = n.id;
    const { x, y } = data;
    check(
      Number.isInteger(x) &&
        Number.isInteger(y) &&
        Math.abs(x) <= 25 &&
        Math.abs(y) <= 25,
      "Invalid coordinates",
    );
    const key = `${x},${y}`;
    check(
      !world.own(world.state.territories, key),
      "Territory is already claimed",
    );
    check(n.territories.length < n.mapBlocks, "Buy another land block first");
    check(
      !n.territories.length ||
        [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ].some(([a, b]) => world.state.territories[`${a},${b}`] === id),
      "New territory must touch your nation",
    );
    world.state.territories[key] = id;
    n.territories.push(key);
    r.player._onTerritoryClaimed();
  }
}

module.exports = { TerritoryManager };
