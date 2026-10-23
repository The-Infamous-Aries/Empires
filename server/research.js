"use strict";
// Explicit catalog-key registry. Unknown effects fail validation instead of silently doing nothing.
const groups = require("./research-effects.json");
const definitions = {
  income: ["Taxable income", "%", 200],
  taxEfficiency: ["Tax collection", "%", 100],
  taxIncome: ["Tax revenue", "%", 100],
  flatIncome: ["Research income per turn", "$", 0],
  production: ["Basic resource output", "%", 200],
  food: ["Food output", "%", 200],
  manufacturing: ["Manufacturing output", "%", 200],
  attack: ["Conventional attack", "%", 200],
  defense: ["Conventional defense", "%", 200],
  criticalDamage: ["Critical damage", "points", 0],
  diseaseResistance: ["Disease reduction", "%", 90],
  health: ["Population health", "points", 0],
  recovery: ["Casualty reduction", "%", 60],
  growth: ["Population growth", "%", 100],
  happiness: ["Happiness", "points", 20],
  crimeReduction: ["Crime reduction", "%", 80],
  researchSpeed: ["Research speed", "%", 200],
  tradeEfficiency: ["Trade efficiency", "%", 200],
  morale: ["Military morale", "%", 50],
  upkeepReduction: ["Upkeep reduction", "%", 75],
};
const registry = {};
for (const [group, keys] of Object.entries(groups)) {
  const [stat, mode, scale] = group.split(":");
  for (const key of keys) {
    if (registry[key] || !definitions[stat])
      throw Error(`Invalid research mapping: ${key}`);
    registry[key] = { stat, mode, scale: Number(scale) };
  }
}
function validate(catalog) {
  const visiting = new Set(),
    done = new Set();
  function visit(key) {
    if (done.has(key)) return;
    if (visiting.has(key) || !catalog[key])
      throw Error(`Invalid research prerequisite: ${key}`);
    visiting.add(key);
    const def = catalog[key];
    if (!(def.time > 0) || !(def.cost >= 0))
      throw Error(`Invalid research cost/time: ${key}`);
    for (const [effect, value] of Object.entries(def.effects))
      if (!registry[effect] || !Number.isFinite(value))
        throw Error(`Unmapped research effect: ${effect}`);
    for (const parent of def.requirements?.prerequisites || []) visit(parent);
    visiting.delete(key);
    done.add(key);
  }
  Object.keys(catalog).forEach(visit);
}
function totals(effects) {
  const direct = {},
    bounded = {};
  for (const [key, value] of Object.entries(effects)) {
    const rule = registry[key];
    if (!rule) continue;
    const target = rule.mode === "direct" ? direct : bounded;
    target[rule.stat] = (target[rule.stat] || 0) + value * rule.scale;
  }
  return Object.fromEntries(
    Object.entries(definitions).map(([stat, [, , cap]]) => {
      const raw = Math.max(0, bounded[stat] || 0);
      return [
        stat,
        (direct[stat] || 0) + (raw ? (cap * raw) / (cap + raw) : 0),
      ];
    }),
  );
}
function rebuild(r) {
  const effects = {};
  for (const id of new Set(r.nation.completedResearch))
    for (const [key, value] of Object.entries(r.research[id]?.effects || {}))
      effects[key] = (effects[key] || 0) + value;
  r.nation.researchEffects = effects;
  r.nation.researchModifiers = totals(effects);
}
function describe(def) {
  return Object.entries(def.effects).map(([key, value]) => {
    const rule = registry[key],
      [label, unit, cap] = definitions[rule.stat];
    return {
      key,
      value,
      stat: rule.stat,
      label,
      unit,
      contribution: value * rule.scale,
      bounded: rule.mode === "bounded",
      cap,
    };
  });
}
// Progress is work, not elapsed fraction of an obsolete deadline. Preserve old-save deadlines.
function reschedule(world, r, at) {
  for (const task of r.nation.activeResearch) {
    const workAt = Math.max(at, task.updatedAt || task.startedAt);
    const total = r.research[task.key].time * 3600000;
    if (task.remainingWork === undefined) {
      task.rate = total / (task.endsAt - task.startedAt);
      task.remainingWork = Math.max(0, (task.endsAt - workAt) * task.rate);
      task.updatedAt = workAt;
    } else if (workAt > task.updatedAt) {
      task.remainingWork = Math.max(
        0,
        task.remainingWork - (workAt - task.updatedAt) * task.rate,
      );
      task.updatedAt = workAt;
    }
    task.totalWork = total;
    const rate = total / world.researchQuote(r, task.key).duration;
    if (rate !== task.rate) {
      task.rate = rate;
      task.endsAt = workAt + Math.ceil(task.remainingWork / rate);
    }
  }
}
module.exports = {
  validate,
  rebuild,
  describe,
  totals,
  definitions,
  reschedule,
  registry,
};
