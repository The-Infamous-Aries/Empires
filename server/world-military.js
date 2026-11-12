"use strict";
const { randomUUID } = require("node:crypto");
const { saveWar } = require("../core/data-persistence");
const { clone } = require("./rules");
const { sideOf, ensure, invite, process: warProcess, opposing } = require("./world-war");
const { combatBonus } = require("./world-diplomacy");

const own = (object, key) =>
  typeof key === "string" && Object.hasOwn(object, key);
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
const sum = (object) => Object.values(object).reduce((a, b) => a + b, 0);

class MilitaryManager {
  constructor(world) {
    this.world = world;
  }

  buyUnit(r, type, amount) {
    const world = this.world;
    const n = r.nation;
    amount = quantity(amount);
    world.check(world.own(world.unitUpkeep, type), "Unknown unit");
    const q = world.buildingMgr.unitQuote(r, type, amount);
    n.recruitmentBasis ||= {};
    n.militaryPopulationCommitted ||= {};
    world.check(q.canBuy, q.reasons.join("; "));
    world.core.pay(n, q.cost);
    n.militaryUnits[type] += amount;
    n.lastUnitTypePurchased = type; // Track for Trophy of Pride relic
    n.recruitmentBasis[type] = (n.recruitmentBasis[type] || 0) + q.cost.money;
    // Enlist population for purchased combat units (mark citizens as military, deduct population only on destruction in war)
    if (type !== 'missiles' && type !== 'nukes') {
      const popUnitType = type === 'spies' ? 'spy' : type.slice(0, -1);
      if (['soldier', 'tank', 'aircraft', 'ship', 'spy'].includes(popUnitType)) {
        n.militaryPopulationCommitted[popUnitType] = (n.militaryPopulationCommitted[popUnitType] || 0) + amount;
      }
    }
    if (q.populationImpact)
      n.applyTemporaryPopulationReduction(q.populationImpact);
    if (q.happinessImpact)
      n.applyTemporaryHappinessReduction(q.happinessImpact);
    // Award XP via XP Goals System
    const unitXpMap = {
      soldiers: 'awardTrainSoldiers',
      tanks: 'awardTrainTanks',
      aircraft: 'awardTrainAircraft',
      ships: 'awardTrainShips',
      missiles: 'awardBuyMissiles',
      nukes: 'awardBuyNukes',
    };
    const unitMethod = unitXpMap[type];
    if (unitMethod && typeof world.xpGoalsSystem[unitMethod] === 'function') {
      world.xpGoalsSystem[unitMethod](amount, { type, action: 'buyUnit' });
    } else {
      r.player._awardExperience(amount * 8, 'Military training');
    }
  }

  sellUnit(r, type, amount) {
    const world = this.world;
    const n = r.nation;
    amount = quantity(amount);
    world.check(world.own(world.unitUpkeep, type), "Unknown unit");
    const q = world.buildingMgr.unitQuote(r, type, amount);
    n.recruitmentBasis ||= {};
    n.militaryPopulationCommitted ||= {};
    world.check(q.canSell, "Not enough units");
    world.core.removeUnits(n, type, amount);
    // Discharge committed population for sold units
    if (type !== 'missiles' && type !== 'nukes') {
      const popUnitType = type === 'spies' ? 'spy' : type.slice(0, -1);
      if (['soldier', 'tank', 'aircraft', 'ship', 'spy'].includes(popUnitType)) {
        const committed = n.militaryPopulationCommitted[popUnitType] || 0;
        const toDischarge = Math.min(amount, committed);
        if (toDischarge > 0) {
          // Un-mark citizens as military (discharge without killing)
          let remaining = toDischarge;
          const nationCitizens = world.state.citizens[n.id] || [];
          for (const citizen of nationCitizens) {
            if (remaining <= 0) break;
            if (citizen.isAlive && citizen.isMilitary && citizen.unitType === popUnitType) {
              citizen.isMilitary = false;
              citizen.unitType = null;
              remaining--;
            }
          }
          n.militaryPopulationCommitted[popUnitType] = Math.max(0, committed - toDischarge);
        }
      }
    }
    n.money += q.refund;
  }

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
        active.filter((w) => sideOf(w, n.id) === "attacker")
          .length <
          2 + (n.projects.commandCenter || 0),
        "No offensive war slots",
      );
      world.check(
        active.filter((w) => sideOf(w, target.id) === "defender")
          .length <
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
      };
      // Award XP for declaring war (attacker) and being attacked (defender)
      try {
        world.xpGoalsSystem.awardWarAttack(1, { warId: id, target: target.id });
        world.xpGoalsSystem.awardWarDefend(1, { warId: id, target: target.id });
      } catch(e) {}
      invite(world, world.state.wars[id]);

      // Persist new war to database
      saveWar({
        id,
        attackerId: n.id,
        defenderId: target.id,
        participants: [n.id, target.id],
        type: 'conventional',
        reason,
        status: 'preparing',
        round: 0,
        wins: { [n.id]: 0, [target.id]: 0 },
        damage: { [n.id]: 0, [target.id]: 0 },
        casualties: {},
        damageDealt: {},
        peace: [],
        peaceTerms: null,
        result: null,
        endedAt: null,
        declared: now,
        version: 1,
      }).catch(err => console.error('Failed to persist new war:', err.message));

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
        warProcess(world, now);
      }

      // Persist war state change to database
      saveWar(w).catch(err => console.error('Failed to persist war peace vote:', err.message));

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

      // Relic: Anger Idol — Attack stat +25% in war damage
      if (n.relicBoosts?.angerIdolAttack) {
        damage = damage * (1 + n.relicBoosts.angerIdolAttack);
      }

      // Relic: Lucky Skull — Luck +15 (affects crit and loot)
      const luckBonus = n.relicBoosts?.luckySkull || 0;

      if (r.combat.rollCriticalHit(r.player))
        damage +=
          r.combat.calculateCriticalDamage(damage, r.player) +
          n.researchModifiers.criticalDamage;
      damage *=
        n.motionModifiers.military *
        (n.militaryMaintenanceDeficit ? 0.5 : 1) *
        n.combatMultiplier;
      damage *= 1 + combatBonus(world, n, w.participants);

      // Relic: Leader Band — Damage dealt in war +10%
      if (n.relicBoosts?.warDamageMult) {
        damage = damage * n.relicBoosts.warDamageMult;
      }

      r.combat.getNationById = (id) => world.nation(id).nation;
      r.combat.getPlayerByNationId = (id) => world.nation(id).player;

      // Relic: Bliss Idol — Defense stat +25% in war defense
      const defenseMult = t.relicBoosts?.blissIdolDefense || 1;
      const defense = r.combat.processDefense(
        t.id,
        Math.floor(
          (damage * (t.motionModifiers.damageTaken || 1)) /
            (t.motionModifiers.defense * defenseMult *
              (1 + t.researchModifiers.defense / 100)),
        ),
        { participantStats: new Map() },
      );
      damage = defense.damage;
      w.damage[t.id] += defense.counterDamage;
    }
    // ── Equipment: war-action durability loss (flat 0.5 per Attack/Defend) ──
    // Attacker always loses durability on conventional attack
    if (type === "conventional") {
      world.equipmentSystem.applyWarActionDurabilityLoss(n, false);
      // Defender loses durability only if they dealt counter-damage
      if (defense.counterDamage > 0) {
        const tr = world.nation(t.id);
        if (tr) world.equipmentSystem.applyWarActionDurabilityLoss(tr.nation, true);
      }
    }
    // ── Equipment: Luck-based war loot (independent per-item rolls) ──
    if (type === "conventional") {
      this._rollWarLoot(n, r.player); // attacker
      const tr = world.nation(t.id);
      if (tr && defense.counterDamage > 0) {
        this._rollWarLoot(tr.nation, tr.player); // defender
      }
    }
    // Evade skill: chance to skip energy cost on attack
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

    // Persist war damage to database after attack
    saveWar(w).catch(err => console.error('Failed to persist war damage:', err.message));
  }

  processRoundCasualties(w) {
    const world = this.world;
    const total = sum(w.damage);
    if (!total) return;
    w.casualties ||= {};
    for (const id of w.participants) {
      const r = world.nation(id),
        n = r.nation;
      ensure(w);
      const enemyDamage = opposing(w, id)
        .reduce((sum, other) => sum + (w.damage[other] || 0), 0);
      const rate = Math.min(0.25, (enemyDamage / total) * 0.5);
      w.casualties[id] ||= {};
      for (const type of [
        "soldiers",
        "tanks",
        "aircraft",
        "ships",
        "missiles",
        "nukes",
      ]) {
        let lost = Math.floor(
          n.militaryUnits[type] *
            rate *
            (1 - n.researchModifiers.recovery / 100),
        );
        if (type === "soldiers")
          lost = Math.floor(
            lost * (1 - (n.wonderEffects.soldierLossReduction || 0)),
          );
        if (!lost) continue;
        world.core.removeUnits(n, type, lost);
        w.casualties[id][type] = (w.casualties[id][type] || 0) + lost;
        if (["tanks", "aircraft", "ships"].includes(type)) {
          const recovery =
            n.wonderEffects.enhancedSalvageRate ||
            n.projectEffects.militarySalvageRate ||
            0;
          const resources = n.calculateMilitaryCost(type, lost).resources;
          for (const [key, value] of Object.entries(resources))
            n.resources[key] += Math.floor(value * recovery);
        }
      }
    }
  }

  _rollWarLoot(nation, player) {
    if (!nation.equipment) return;
    const luck = player.getSkillValue("luck") || 0;

    // Relic: Chest of Plenty / Key of Plenty — boost spawn rates
    const chestMult = nation.relicBoosts?.chestOfPlenty || 1;
    const keyMult = nation.relicBoosts?.keyOfPlenty || 1;

    const drops = {
      key1:   { base: 10,   mult: 1.0, type: 'key' },
      key2:   { base: 7.5,  mult: 0.75, type: 'key' },
      key3:   { base: 5,    mult: 0.5, type: 'key' },
      chest1: { base: 1,    mult: 0.1, type: 'chest' },
      chest2: { base: 0.5,  mult: 0.05, type: 'chest' },
      chest3: { base: 0.1,  mult: 0.01, type: 'chest' },
      chest4: { base: 0.01, mult: 0.005, type: 'chest' },
    };
    nation.equipment.keys   = nation.equipment.keys   || { key1: 0, key2: 0, key3: 0 };
    nation.equipment.chests = nation.equipment.chests || { chest1: 0, chest2: 0, chest3: 0, chest4: 0 };

    for (const [drop, def] of Object.entries(drops)) {
      let chance = Math.min(Math.max(def.base + def.mult * luck, 0), 100);
      // Apply relic multipliers
      if (def.type === 'key') chance *= keyMult;
      if (def.type === 'chest') chance *= chestMult;
      if (Math.random() * 100 < chance) {
        if (drop.startsWith("key")) {
          nation.equipment.keys[drop] = (nation.equipment.keys[drop] || 0) + 1;
        } else {
          nation.equipment.chests[drop] = (nation.equipment.chests[drop] || 0) + 1;
        }
      }
    }
  }
}

module.exports = { MilitaryManager };
