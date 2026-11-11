"use strict";
const { randomUUID } = require("node:crypto");
const { saveWar } = require("../core/data-persistence");
const { clone } = require("./rules");
const HOUR = 3600000;
const DAY = 86_400_000;
function check(condition, message) {
  if (!condition) throw new Error(message);
}
function text(value, name, max = 100, min = 1) {
  check(
    typeof value === "string" &&
      value.trim().length >= min &&
      value.trim().length <= max,
    `${name} must contain ${min}–${max} characters`,
  );
  return value.trim();
}
function quantity(value, max = 1_000_000) {
  check(
    Number.isSafeInteger(value) && value > 0 && value <= max,
    `Quantity must be a whole number from 1 to ${max}`,
  );
  return value;
}
function sum(obj) {
  return Object.values(obj).reduce((a, b) => a + b, 0);
}
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
function joinWar(world, id, data) {
  const w = world.state.wars[data.id];
  if (!w) throw Error("War not found");
  ensure(w);
  const { side } = data;
  if (!["attacker", "defender"].includes(side))
    throw Error("Choose a war side");
  if (w.status !== "preparing") throw Error("The preparation window has ended");

  const n = world.nation(id).nation;
  if (!n.allianceId) throw Error("You are not in an alliance");

  const alliance = world.state.alliances[n.allianceId];
  if (!alliance) throw Error("Alliance not found");
  if (alliance.founder !== id) {
    const memberRoleId = alliance.members[id];
    const roles = world.base.allianceTemplates[alliance.government]?.roles || [];
    const role = roles.find((r) => r.id === memberRoleId);
    if (!role || !role.permissions?.includes("all"))
      throw Error("Only alliance government can join alliance wars");
  }

  const allianceMemberIds = Object.keys(alliance.members || {});

  for (const mid of allianceMemberIds) {
    if (w.participants.includes(mid))
      throw Error("Alliance already participating in this war");
  }

  for (const mid of allianceMemberIds) {
    const reasons = joinReasons(world, w, mid, side);
    if (reasons.length) throw Error(`Member ${mid}: ${reasons.join("; ")}`);
  }

  for (const mid of allianceMemberIds) {
    w.sides[side].push(mid);
    w.participants.push(mid);
    w.damage[mid] = 0;
  }

  return w;
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

class WarManager {
  constructor(world) {
    this.world = world;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // WAR ACTIONS (declareWar, attack, peace)
  // ══════════════════════════════════════════════════════════════════════════════

  warAction(r, action, d, preview = false) {
    const world = this.world;
    const n = r.nation,
      now = world.clock();
    if (action === "declareWar") {
      const target = world.nation(d.target).nation;
      world.check(target.id !== n.id, "Choose another nation");
      world.check(
        !n.motionModifiers.peace && !target.motionModifiers.peace,
        "World peace enforcement is active",
      );
      world.check(
        !n.allianceId || target.allianceId !== n.allianceId,
        "Cannot attack an ally",
      );
      world.check(
        !Object.values(world.state.treaties).some(
          (t) =>
            t.status === "active" &&
            t.type === "peace" &&
            [t.from, t.to].includes(n.id) &&
            [t.from, t.to].includes(target.id),
        ),
        "A peace treaty prevents this war",
      );
      const active = Object.values(world.state.wars).filter(
        (w) => w.status !== "ended",
      );
      world.check(
        !active.some(
          (w) =>
            w.participants.includes(n.id) && w.participants.includes(target.id),
        ),
        "Already at war",
      );
      world.check(
        active.filter((w) => sideOf(w, n.id) === "attacker").length <
          2 + (n.projects.commandCenter || 0),
        "No offensive war slots",
      );
      world.check(
        active.filter((w) => sideOf(w, target.id) === "defender").length <
          2 + (target.projects.commandCenter || 0),
        "Target has no defensive slots",
      );
      const reason = text(d.reason || "Territorial dispute", "Reason", 300);
      if (preview) return;
      const id = randomUUID();
      world.state.wars[id] = {
        id,
        attacker: n.id,
        defender: target.id,
        participants: [n.id, target.id],
        reason,
        status: "preparing",
        round: 0,
        wins: { [n.id]: 0, [target.id]: 0 },
        damage: { [n.id]: 0, [target.id]: 0 },
        endsAt: now + 15 * 60_000,
        log: [],
        peace: [],
        peaceTerms: null,
        result: null,
        endedAt: null,
        declared: now,
        version: 1,
      };
      try {
        world.xpGoalsSystem.awardWarAttack(1, { warId: id, target: target.id });
        world.xpGoalsSystem.awardWarDefend(1, { warId: id, target: target.id });
      } catch (e) {
        console.error("War: XP award failed:", e.message);
      }
      invite(world, world.state.wars[id]);
      saveWar({
        id,
        attackerId: n.id,
        defenderId: target.id,
        participants: [n.id, target.id],
        type: "conventional",
        reason,
        status: "preparing",
      }).catch((err) =>
        console.error("Failed to persist new war:", err.message),
      );
      return;
    }
    const w = preview
      ? clone(world.state.wars[d.id] || null)
      : world.state.wars[d.id];
    world.check(
      w && w.participants.includes(n.id) && w.status !== "ended",
      "War not found",
    );
    ensure(w);
    if (action === "peace") {
      world.check(
        [w.attacker, w.defender].includes(n.id),
        "Only the principal nations can negotiate white peace",
      );
      if (!w.peace.includes(n.id)) w.peace.push(n.id);
      if (w.peace.length === 2) {
        w.status = "ended";
        w.result = "White peace";
        process(world, now);
      }
      saveWar(w).catch((err) =>
        console.error("Failed to persist war peace vote:", err.message),
      );
      return;
    }
    world.check(w.status === "active", "War is still preparing");
    const opponents = opposing(w, n.id);
    const targetId = d.target || opponents[0];
    world.check(opponents.includes(targetId), "Choose a nation on the opposing side");
    const target = world.nation(targetId),
      t = target.nation;
    world.check(
      !n.motionModifiers.peace && !t.motionModifiers.peace,
      "World peace enforcement is active",
    );
    const type = d.type || "conventional";
    world.check(
      ["conventional", "missiles", "nukes", "spies"].includes(type),
      "Invalid attack",
    );
    const cost = Math.ceil(10 * n.motionModifiers.energyCost);
    world.check(r.player.currentEnergy >= cost, "Insufficient energy");
    world.check(n.militaryStrength > 0, "Recruit military units first");
    if (type === "missiles" || type === "nukes") {
      world.check(n.militaryUnits[type] > 0, "No weapons available");
      world.check(
        type !== "nukes" || !n.motionModifiers.nuclearBan,
        "World nuclear ban",
      );
      const intuition = type === "nukes" ? 50 : 25;
      world.check(r.player.currentIntuition >= intuition, "Insufficient intuition");
    } else if (type === "spies") {
      world.check(
        n.militaryUnits.spies > 0 && r.player.currentIntuition >= 10,
        "Spies and 10 intuition required",
      );
    }
    if (preview) return;
    let damage;
    if (type === "missiles" || type === "nukes") {
      const intuition = type === "nukes" ? 50 : 25;
      world.core.removeUnits(n, type, 1);
      r.player.currentIntuition -= intuition;
      damage =
        type === "nukes"
          ? r.combat.calculateNukeDamage(n, r.player)
          : r.combat.calculateMissileDamage(n, r.player);
      const interceptionChance = Math.min(
        0.45,
        (t.projects.ironCurtain || 0) * 0.15,
      );
      const intercepted =
        type === "nukes"
          ? Math.random() < interceptionChance * 0.7
          : Math.random() < interceptionChance;
      if (intercepted) damage = 0;
      const statKey =
        type === "missiles"
          ? intercepted
            ? "missileMisses"
            : "missileHits"
          : intercepted
            ? "nukeMisses"
            : "nukeHits";
      n.statistics[statKey] = (n.statistics[statKey] || 0) + 1;
    } else if (type === "spies") {
      world.check(
        n.militaryUnits.spies > 0 && r.player.currentIntuition >= 10,
        "Spies and 10 intuition required",
      );
      r.player.currentIntuition -= 10;
      damage = 0;
      n.intelligence ||= {};
      n.intelligence[t.id] = {
        units: clone(t.militaryUnits),
        money: t.money,
        at: now,
      };
    } else {
      damage = r.combat.calculateBaseDamage(n, r.player);
      if (r.combat.rollCriticalHit(r.player))
        damage +=
          r.combat.calculateCriticalDamage(damage, r.player) +
          n.researchModifiers.criticalDamage;
      damage *=
        n.motionModifiers.military *
        (n.militaryMaintenanceDeficit ? 0.5 : 1) *
        n.combatMultiplier;
      r.combat.getNationById = (id) => world.nation(id).nation;
      r.combat.getPlayerByNationId = (id) => world.nation(id).player;
      const defense = r.combat.processDefense(
        t.id,
        Math.floor(
          (damage * (t.motionModifiers.damageTaken || 1)) /
            (t.motionModifiers.defense *
              (1 + t.researchModifiers.defense / 100)),
        ),
        { participantStats: new Map() },
      );
      damage = defense.damage;
      w.damage[t.id] += defense.counterDamage;
    }
    if (type === "conventional") {
      world.equipmentSystem.applyWarActionDurabilityLoss(n, false);
      if (damage > 0) {
        const tr = world.nation(t.id);
        if (tr) world.equipmentSystem.applyWarActionDurabilityLoss(tr.nation, true);
      }
    }
    if (type === "conventional") {
      this._rollWarLoot(n, r.player);
      const tr = world.nation(t.id);
      if (tr && damage > 0) {
        this._rollWarLoot(tr.nation, tr.player);
      }
    }
    const evadeChance = r.player.getSkillValue("evade");
    let evaded = false;
    if (evadeChance > 0 && Math.random() < evadeChance) {
      evaded = true;
    } else {
      r.player.currentEnergy -= cost;
    }
    const inflicted =
      type === "conventional" ? damage : Math.min(t.infra, damage);
    if (type === "missiles" || type === "nukes") {
      t.infra -= inflicted;
      t.applyTemporaryHappinessReduction(type === "nukes" ? 15 : 5);
    }
    w.damage[n.id] += inflicted;
    w.log.push({ actor: n.id, target: t.id, type, damage: inflicted, at: now });
    w.log = w.log.slice(-100);
    saveWar(w).catch((err) =>
      console.error("Failed to persist war damage:", err.message),
    );
  }

  _rollWarLoot(nation, player) {
    if (!nation.equipment) return;
    const luck = player.getSkillValue("luck") || 0;
    const drops = {
      key1: { base: 10, mult: 1.0 },
      key2: { base: 7.5, mult: 0.75 },
      key3: { base: 5, mult: 0.5 },
      chest1: { base: 1, mult: 0.1 },
      chest2: { base: 0.5, mult: 0.05 },
      chest3: { base: 0.1, mult: 0.01 },
      chest4: { base: 0.01, mult: 0.005 },
    };
    nation.equipment.keys = nation.equipment.keys || { key1: 0, key2: 0, key3: 0 };
    nation.equipment.chests = nation.equipment.chests || {
      chest1: 0,
      chest2: 0,
      chest3: 0,
      chest4: 0,
    };
    for (const [drop, def] of Object.entries(drops)) {
      const chance = Math.min(Math.max(def.base + def.mult * luck, 0), 100);
      if (Math.random() * 100 < chance) {
        if (drop.startsWith("key")) {
          nation.equipment.keys[drop] =
            (nation.equipment.keys[drop] || 0) + 1;
        } else {
          nation.equipment.chests[drop] =
            (nation.equipment.chests[drop] || 0) + 1;
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // WAR RESPONSE / JOIN (treaty calls & alliance joins)
  // ══════════════════════════════════════════════════════════════════════════════

  warRespond(r, id, data) {
    return respond(this.world, id, data);
  }

  joinWar(r, id, data) {
    return joinWar(this.world, id, data);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // TICK / DEBT PROCESSING
  // ══════════════════════════════════════════════════════════════════════════════

  process(at) {
    process(this.world, at);
  }

  collectDebts() {
    collectDebts(this.world);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW
  // ══════════════════════════════════════════════════════════════════════════════

  view(id) {
    return view(this.world, id);
  }
}

module.exports = {
  WarManager,
  ensure,
  sideOf,
  opposing,
  sidesDamage,
  invite,
  respond,
  joinWar,
  process,
  collectDebts,
  view,
};
