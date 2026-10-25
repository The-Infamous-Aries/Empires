"use strict";
const { randomUUID } = require("node:crypto");
const HOUR = 3600000;
function ensure(w) {
  w.sides ||= { attacker: [w.attacker], defender: [w.defender] };
  w.obligations ||= [];
  return w;
}
function sideOf(w, id) {
  ensure(w);
  return w.sides.attacker.includes(id)
    ? "attacker"
    : w.sides.defender.includes(id)
      ? "defender"
      : null;
}
function opposing(w, id) {
  return w.sides[sideOf(w, id) === "attacker" ? "defender" : "attacker"];
}
function sidesDamage(w) {
  ensure(w);
  return Object.fromEntries(
    Object.entries(w.sides).map(([side, ids]) => [
      side,
      ids.reduce((sum, id) => sum + (w.damage[id] || 0), 0),
    ]),
  );
}
function joinReasons(world, w, id, side) {
  ensure(w);
  const n = world.nation(id).nation,
    reasons = [];
  if (!["attacker", "defender"].includes(side)) return ["Choose a war side"];
  if (w.status !== "preparing")
    reasons.push("The preparation window has ended");
  if (w.participants.includes(id))
    reasons.push("Already participating in this war");
  if (n.motionModifiers.peace)
    reasons.push("World peace enforcement is active");
  const enemies = w.sides[side === "attacker" ? "defender" : "attacker"];
  for (const enemy of enemies) {
    const other = world.nation(enemy).nation;
    if (other.motionModifiers.peace)
      reasons.push("World peace enforcement protects an opponent");
    if (n.allianceId && n.allianceId === other.allianceId)
      reasons.push("Cannot fight an alliance member");
    if (
      Object.values(world.state.treaties).some(
        (t) =>
          t.status === "active" &&
          t.type === "peace" &&
          [t.from, t.to].includes(id) &&
          [t.from, t.to].includes(enemy),
      )
    )
      reasons.push("A peace treaty prevents joining this side");
    if (
      Object.values(world.state.wars).some(
        (otherWar) =>
          otherWar.id !== w.id &&
          otherWar.status !== "ended" &&
          otherWar.participants.includes(id) &&
          otherWar.participants.includes(enemy),
      )
    )
      reasons.push("Already sharing another war with an opponent");
  }
  if (
    Object.values(world.state.wars).filter(
      (other) => other.status !== "ended" && sideOf(other, id) === side,
    ).length >=
    2 + (n.projects.commandCenter || 0)
  )
    reasons.push(
      `No ${side === "attacker" ? "offensive" : "defensive"} war slots`,
    );
  return reasons;
}
function invite(world, w) {
  ensure(w);
  // Obligations arise from the principal nations' wars, not an unbounded chain of invitations.
  for (const [side, principal] of [
    ["attacker", w.attacker],
    ["defender", w.defender],
  ])
    for (const t of Object.values(world.state.treaties)) {
      if (t.status !== "active" || ![t.from, t.to].includes(principal))
        continue;
      const partner = t.from === principal ? t.to : t.from;
      const applies =
        t.type === "extension" ||
        (t.type === "protectorate" && t.to === principal) ||
        (side === "attacker" &&
          ["mutualAggression", "optionalAggression"].includes(t.type)) ||
        (side === "defender" &&
          ["mutualDefense", "optionalDefense"].includes(t.type));
      if (!applies || w.sides[side].includes(partner)) continue;
      w.obligations.push({
        id: randomUUID(),
        treatyId: t.id,
        type: t.type,
        nation: partner,
        beneficiary: principal,
        side,
        mandatory: !t.type.startsWith("optional"),
        status: "pending",
        endsAt: w.endsAt,
        compensation: t.compensation || 0,
      });
    }
}
function settleDebt(world, obligation) {
  const payer = world.nation(obligation.nation).nation,
    recipient = world.nation(obligation.beneficiary).nation;
  const amount = Math.min(Math.max(0, payer.money), obligation.debt || 0);
  payer.money -= amount;
  recipient.money += amount;
  obligation.debt -= amount;
  obligation.paid = (obligation.paid || 0) + amount;
}
function fail(world, obligation, at, status = "declined") {
  if (obligation.status !== "pending") return;
  obligation.status = status;
  if (!obligation.mandatory) return;
  const def = world.base.treaties[obligation.type];
  const n = world.nation(obligation.nation).nation;
  n.diplomaticPenalties ||= [];
  n.diplomaticPenalties.push({
    obligation: obligation.id,
    happiness: Math.abs(def.failurePenalty?.happiness || 0),
    endsAt: at + (def.failurePenalty?.duration || 7) * HOUR,
  });
  if (def.failurePenalty?.compensation) {
    obligation.debt = obligation.compensation;
    settleDebt(world, obligation);
  }
}
function respond(world, id, data) {
  const w = world.state.wars[data.id];
  if (!w) throw Error("War not found");
  ensure(w);
  const obligation = w.obligations.find(
    (o) => o.id === data.obligation && o.nation === id,
  );
  if (
    w.status !== "preparing" ||
    !obligation ||
    obligation.status !== "pending" ||
    obligation.endsAt <= world.clock()
  )
    throw Error("No pending treaty call");
  if (data.accept !== true) {
    fail(world, obligation, world.clock());
    return;
  }
  const reasons = joinReasons(world, w, id, obligation.side);
  if (reasons.length) throw Error(reasons.join("; "));
  w.sides[obligation.side].push(id);
  w.participants.push(id);
  w.damage[id] = 0;
  for (const call of w.obligations.filter(
    (o) => o.nation === id && o.status === "pending",
  )) {
    if (call.side === obligation.side) call.status = "joined";
    else fail(world, call, world.clock(), "conflict");
  }
}
function process(world, at) {
  for (const w of Object.values(world.state.wars)) {
    ensure(w);
    for (const o of w.obligations) {
      if (o.status === "pending" && w.status === "ended")
        o.status = "cancelled";
      else if (o.status === "pending" && o.endsAt <= at)
        fail(world, o, at, "expired");
    }
  }
  for (const { nation: n } of world.rules.values())
    n.diplomaticPenalties = (n.diplomaticPenalties || []).filter(
      (p) => p.endsAt > at,
    );
}
function collectDebts(world) {
  for (const w of Object.values(world.state.wars))
    for (const o of w.obligations || []) if (o.debt > 0) settleDebt(world, o);
}
function view(world, id) {
  return Object.values(world.state.wars).flatMap((w) =>
    (w.obligations || [])
      .filter((o) => o.nation === id || o.beneficiary === id)
      .map((o) => ({
        ...o,
        warId: w.id,
        canJoin:
          o.nation === id &&
          o.status === "pending" &&
          !joinReasons(world, w, id, o.side).length,
        reasons: o.nation === id ? joinReasons(world, w, id, o.side) : [],
      })),
  );
}
module.exports = {
  ensure,
  sideOf,
  opposing,
  sidesDamage,
  invite,
  respond,
  process,
  collectDebts,
  view,
};
