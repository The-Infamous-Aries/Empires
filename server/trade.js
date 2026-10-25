"use strict";
const { randomUUID } = require("node:crypto");
const DAY = 86_400_000;
function check(ok, message) {
  if (!ok) throw new Error(message);
}
const live = (agreement) => ["pending", "active"].includes(agreement.status);
function partners(world, id, except) {
  return new Set(
    Object.values(world.state.tradeAgreements)
      .filter((a) => a.id !== except && live(a) && [a.from, a.to].includes(id))
      .map((a) => (a.from === id ? a.to : a.from)),
  );
}
function capacity(world, nation, other, except) {
  const current = partners(world, nation.id, except);
  return current.has(other) || current.size < (nation.improvements.port || 0);
}
function eligible(world, a) {
  const from = world.nation(a.from).nation,
    to = world.nation(a.to).nation;
  if (!from.improvements.port || !to.improvements.port)
    return "Both nations need a Port";
  if (!a.duration && !from.projects.tradeHub)
    return "The proposing nation needs a Trade Hub for permanent agreements";
  if (
    [from, to].some(
      (n) =>
        n.motionModifiers.embargo.includes(a.give) ||
        n.motionModifiers.embargo.includes(a.receive),
    )
  )
    return "A world embargo blocks this agreement";
  return null;
}
function action(world, r, action, d, preview = false) {
  const n = r.nation;
  if (action === "tradePropose") {
    const other = world.nation(d.target).nation;
    check(other.id !== n.id, "Choose another nation");
    check(
      world.catalog().resources.includes(d.give) &&
        world.catalog().resources.includes(d.receive),
      "Choose valid resources",
    );
    check(d.give !== d.receive, "Choose different resources");
    for (const amount of [d.giveAmount, d.receiveAmount])
      check(
        Number.isSafeInteger(amount) && amount > 0 && amount <= 1_000_000,
        "Trade amounts must be whole numbers from 1 to 1,000,000",
      );
    check(
      Number.isSafeInteger(d.duration) && d.duration >= 0 && d.duration <= 30,
      "Choose 1–30 real days, or 0 for a permanent agreement",
    );
    const agreement = {
      id: randomUUID(),
      from: n.id,
      to: other.id,
      give: d.give,
      giveAmount: d.giveAmount,
      receive: d.receive,
      receiveAmount: d.receiveAmount,
      duration: d.duration,
      status: "pending",
      createdAt: world.clock(),
      expiresAt: world.clock() + 7 * DAY,
      deliveries: 0,
    };
    check(!eligible(world, agreement), eligible(world, agreement));
    check(
      capacity(world, n, other.id) && capacity(world, other, n.id),
      "No available port partner slots",
    );
    check(
      !Object.values(world.state.tradeAgreements).some(
        (a) =>
          live(a) &&
          [a.from, a.to].includes(n.id) &&
          [a.from, a.to].includes(other.id),
      ),
      "An agreement with this partner already exists",
    );
    if (preview) return;
    world.state.tradeAgreements[agreement.id] = agreement;
    return;
  }
  const a = world.state.tradeAgreements[d.id];
  check(a && [a.from, a.to].includes(n.id), "Trade agreement not found");
  if (action === "tradeRespond") {
    check(
      a.status === "pending" && a.to === n.id,
      "Only the recipient can respond to a pending agreement",
    );
    if (d.accept === true) {
      check(!eligible(world, a), eligible(world, a));
      check(
        capacity(world, n, a.from, a.id) &&
          capacity(world, world.nation(a.from).nation, n.id, a.id),
        "No available port partner slots",
      );
      if (preview) return;
      a.status = "active";
      a.acceptedAt = world.clock();
      a.endsAt = a.duration ? a.acceptedAt + a.duration * DAY : null;
    } else if (!preview) a.status = "declined";
  } else {
    check(live(a), "Agreement has already ended");
    a.status = "cancelled";
  }
}
function process(world, at) {
  // Resolve all exchanges after all nations produce, so registration order cannot affect supply.
  for (const a of Object.values(world.state.tradeAgreements)) {
    if (a.status !== "active") continue;
    const from = world.nation(a.from).nation,
      to = world.nation(a.to).nation;
    a.blocked = eligible(world, a);
    if (
      !a.blocked &&
      ((from.resources[a.give] || 0) < a.giveAmount ||
        (to.resources[a.receive] || 0) < a.receiveAmount)
    )
      a.blocked = "Waiting for both nations to supply the agreed resources";
    if (a.blocked) continue;
    from.resources[a.give] -= a.giveAmount;
    to.resources[a.give] += a.giveAmount;
    to.resources[a.receive] -= a.receiveAmount;
    from.resources[a.receive] += a.receiveAmount;
    a.deliveries++;
    a.lastDeliveryAt = at;
    world.nation(a.from).player._onTradeCompleted();
    world.nation(a.to).player._onTradeCompleted();
  }
}
module.exports = { action, process, partners };
