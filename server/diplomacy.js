"use strict";
const friendly = new Set(["friend", "bestFriend"]);
const hostile = new Set(["foe", "nemesis"]);
const relationshipTypes = ["neutral", "friend", "bestFriend", "foe", "nemesis"];
const live = (t) => ["active", "pending"].includes(t.status);
function relationshipQuote(world, n, target, relationship) {
  const current = n.relationships[target] || "neutral",
    reasons = [];
  const embassies = n.improvements.embassy || 0;
  if (!world.rules.has(target) || target === n.id)
    reasons.push("Choose another nation");
  if (!relationshipTypes.includes(relationship))
    reasons.push("Unknown relationship");
  if (!n.improvements.foreignAffairsOffice)
    reasons.push("Foreign Affairs Office required");
  if (current === relationship) reasons.push("Already selected");
  if (current !== "neutral" && !n.projects.officeOfRelationships)
    reasons.push(
      "Office of Diplomatic Relations required to change relationships",
    );
  const others = Object.entries(n.relationships)
    .filter(([id]) => id !== target)
    .map(([, type]) => type);
  if (["bestFriend", "nemesis"].includes(relationship)) {
    if (embassies < 5) reasons.push("Five embassies required");
    if (others.includes(relationship))
      reasons.push("Relationship slot occupied");
  }
  if (
    ["friend", "foe"].includes(relationship) &&
    others.filter((type) => type === relationship).length >= embassies
  )
    reasons.push("No embassy relationship slots");
  return { current, relationship, reasons, canSet: !reasons.length };
}
function treatyLimit(def, n, target) {
  return def.maxNation === 6 && !friendly.has(n.relationships[target])
    ? 3
    : def.maxNation;
}
function treatyReasons(world, from, to, type, excluding = null) {
  const def = world.base.treaties[type],
    reasons = [];
  if (!def) return ["Unknown treaty"];
  if (from.id === to.id) return ["Choose another nation"];
  const current = Object.values(world.state.treaties).filter(
    (t) => live(t) && t.id !== excluding,
  );
  if (
    current.some(
      (t) =>
        t.type === type &&
        [t.from, t.to].includes(from.id) &&
        [t.from, t.to].includes(to.id),
    )
  )
    reasons.push("Treaty already exists");
  for (const [n, other] of [
    [from, to],
    [to, from],
  ]) {
    if (!n.improvements.foreignAffairsOffice)
      reasons.push(`${n.name}: Foreign Affairs Office required`);
    if ((n.improvements.embassy || 0) < (def.requiresEmbassies || 0))
      reasons.push(`${n.name}: ${def.requiresEmbassies} embassies required`);
    const limit = treatyLimit(def, n, other.id);
    if (
      current.filter((t) => t.type === type && [t.from, t.to].includes(n.id))
        .length >= limit
    )
      reasons.push(
        `${n.name}: treaty capacity reached (${limit}${def.maxNation === 6 && limit === 3 ? "; friend/best friend permits 6" : ""})`,
      );
  }
  if (
    Object.values(world.state.wars).some(
      (w) =>
        (w.status !== "ended" &&
          (w.sides?.attacker || [w.attacker]).includes(from.id) &&
          (w.sides?.defender || [w.defender]).includes(to.id)) ||
        (w.status !== "ended" &&
          (w.sides?.attacker || [w.attacker]).includes(to.id) &&
          (w.sides?.defender || [w.defender]).includes(from.id)),
    )
  )
    reasons.push("End the current war before signing a treaty");
  return reasons;
}
function syncRelations(n) {
  const entries = Object.entries(n.relationships || {});
  n.diplomaticRelations = {
    maxFriends: n.improvements.embassy || 0,
    maxFoes: n.improvements.embassy || 0,
    friends: entries.filter(([, v]) => v === "friend").map(([id]) => id),
    foes: entries.filter(([, v]) => v === "foe").map(([id]) => id),
    bestFriend: entries.find(([, v]) => v === "bestFriend")?.[0] || null,
    nemesis: entries.find(([, v]) => v === "nemesis")?.[0] || null,
  };
}
function combatBonus(world, n, participants) {
  let bonus = 0;
  for (const id of new Set(participants)) {
    if (id === n.id) continue;
    const own = n.relationships[id],
      incoming = world.nation(id).nation.relationships[n.id];
    if (own === "friend") bonus += 0.05;
    if (own === "bestFriend") bonus += 0.15;
    // A hostile designation benefits both parties, once per pair at the stronger level.
    if (own === "nemesis" || incoming === "nemesis") bonus += 0.15;
    else if (hostile.has(own) || hostile.has(incoming)) bonus += 0.05;
  }
  return Math.min(1.25, bonus);
}
function intelligencePartners(world, id) {
  return Object.values(world.state.treaties)
    .filter(
      (t) =>
        t.status === "active" &&
        t.type === "intelligence" &&
        [t.from, t.to].includes(id),
    )
    .map((t) => (t.from === id ? t.to : t.from));
}
function sharedTechnology(world, n) {
  if (!n.projects.financialAssistanceOffice) return 0;
  return Math.max(
    0,
    ...intelligencePartners(world, n.id).map((id) =>
      Math.floor(
        world.nation(id).nation.tech *
          world.base.treaties.intelligence.techShareRatio,
      ),
    ),
  );
}
function intelligence(world, n) {
  const reports = JSON.parse(JSON.stringify(n.intelligence || {}));
  for (const id of intelligencePartners(world, n.id)) {
    const partner = world.nation(id).nation;
    for (const [target, report] of Object.entries(partner.intelligence || {}))
      if (
        target !== n.id &&
        (!reports[target] || reports[target].at < report.at)
      )
        reports[target] = { ...report, sharedBy: id };
  }
  return reports;
}
function demolitionReasons(world, n, category, key, remaining) {
  const reasons = [];
  if (category === "improvements" && key === "embassy") {
    const values = Object.values(n.relationships);
    if (
      ["friend", "foe"].some(
        (type) => values.filter((v) => v === type).length > remaining,
      ) ||
      (remaining < 5 &&
        values.some((v) => ["bestFriend", "nemesis"].includes(v)))
    )
      reasons.push("Reassign relationships before removing this embassy");
    if (
      Object.values(world.state.treaties).some(
        (t) =>
          live(t) &&
          [t.from, t.to].includes(n.id) &&
          (world.base.treaties[t.type].requiresEmbassies || 0) > remaining,
      )
    )
      reasons.push("Cancel dependent treaties before removing this embassy");
  }
  if (
    category === "improvements" &&
    key === "foreignAffairsOffice" &&
    !remaining &&
    Object.values(world.state.treaties).some(
      (t) => live(t) && [t.from, t.to].includes(n.id),
    )
  )
    reasons.push(
      "Resolve active treaties and proposals before removing Foreign Affairs",
    );
  return reasons;
}
module.exports = {
  relationshipTypes,
  relationshipQuote,
  treatyReasons,
  treatyLimit,
  syncRelations,
  combatBonus,
  intelligencePartners,
  sharedTechnology,
  intelligence,
  demolitionReasons,
};
