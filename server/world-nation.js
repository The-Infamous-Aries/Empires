"use strict";
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

class NationManager {
  constructor(world) {
    this.world = world;
  }

  choiceCheck(r, action, data) {
    const n = r.nation;
    const key = text(data.value, "Selection"),
      catalog = action === "government" ? r.governments : r.religions;
    check(own(catalog, key), "Unknown selection");
    const statue =
      action === "government" ? "governmentStatue" : "religiousStatue",
      monument =
        action === "government" ? "governmentMonument" : "religiousMonument";
    check(
      !n.projects[statue] || n.wonders[monument],
      "This selection is permanently locked by its statue",
    );
    const last = n[`${action}ChangedDay`];
    check(
      !n.wonders[monument] || last === undefined || this.world.state.day - last >= 14,
      "Changes require a 14-turn cooldown",
    );
    check(
      n[action] !== key ||
        n.demandTimer?.[
          `isDemanding${action[0].toUpperCase() + action.slice(1)}`
        ],
      "Already selected",
    );
    return key;
  }

  setIdentity(r, data) {
    const n = r.nation;
    n.capitalCity = text(data.capital, "Capital", 60);
    n.motto = text(data.motto, "Motto", 160, 0);
    if (data.name && typeof data.name === "string") {
      n.name = text(data.name, "Nation name", 60, 3);
    }
    if (data.leader && typeof data.leader === "string") {
      n.leader = text(data.leader, "Ruler name", 60, 3);
    }
  }

  changeFaction(r, data) {
    const world = this.world;
    const n = r.nation;
    const fk = text(data.factionKey, "Faction");
    check(own(r.colors, fk), "Unknown faction color");
    check(fk !== n.factionKey, "Already in that faction");
    const lastChange = n.factionChangedDay;
    check(
      lastChange === undefined || world.state.day - lastChange >= 28,
      "Faction can only be changed once every 28 game turns",
    );
    n.factionKey = fk;
    n.factionChangedDay = world.state.day;
    n.factionJoinedAt = world.clock();
    r.player.factionKey = fk;
  }

  setGovernmentReligion(r, action, data) {
    const world = this.world;
    const n = r.nation;
    const key = this.choiceCheck(r, action, data);
    n[action] = key;
    n[`${action}ChangedDay`] = world.state.day;
    if (n.demandTimer) {
      n.demandTimer[`${action}DaysRemaining`] = 30;
      n.demandTimer[
        `isDemanding${action[0].toUpperCase() + action.slice(1)}`
      ] = false;
    }
    // Award XP for government/religion changes
    try {
      if (action === "government") {
        world.xpGoalsSystem.awardChangeGovernment(1, { newGovernment: key });
      } else {
        world.xpGoalsSystem.awardChangeReligion(1, { newReligion: key });
      }
    } catch(e) {}
  }

  setNationalFood(r, data) {
    const world = this.world;
    const n = r.nation;
    const valid = ["burger","cake","cookie","donut","hotdog","pizza","ramen","salad","steak","sushi","taco"];
    const key = text(data.value, "National Food", 40, 0);
    check(!key || valid.includes(key), "Invalid national food choice");
    // No cooldown until food production is unlocked, then 14-day cooldown
    const hasFoodProduction = n.projects && n.projects.foodProduction > 0;
    if (hasFoodProduction) {
      const lastFoodChange = n.nationalFoodChangedDay;
      check(
        lastFoodChange === undefined || world.state.day - lastFoodChange >= 14,
        "National food can only be changed once every 14 game turns after unlocking food production",
      );
    }
    n.nationalFood = key || null;
    if (hasFoodProduction) {
      n.nationalFoodChangedDay = world.state.day;
    }
    // Award XP for national food change
    try {
      world.xpGoalsSystem.awardChangeNationalFood(1, { newFood: n.nationalFood });
    } catch(e) {}
  }

  setNationalWater(r, data) {
    const world = this.world;
    const n = r.nation;
    const valid = ["beer","coffee","energy-drink","juice","liquor","milk","milkshake","smoothie","soda","water","wine"];
    const key = text(data.value, "National Water", 40, 0);
    check(!key || valid.includes(key), "Invalid national water choice");
    // No cooldown until water production is unlocked, then 14-day cooldown
    const hasWaterProduction = n.projects && n.projects.waterProduction > 0;
    if (hasWaterProduction) {
      const lastWaterChange = n.nationalWaterChangedDay;
      check(
        lastWaterChange === undefined || world.state.day - lastWaterChange >= 14,
        "National water can only be changed once every 14 game turns after unlocking water production",
      );
    }
    n.nationalWater = key || null;
    if (hasWaterProduction) {
      n.nationalWaterChangedDay = world.state.day;
    }
    // Award XP for national water change
    try {
      world.xpGoalsSystem.awardChangeNationalWater(1, { newWater: n.nationalWater });
    } catch(e) {}
  }

  saveCitizens(r, data) {
    const world = this.world;
    const { citizens } = data;
    check(Array.isArray(citizens), "citizens must be an array");
    world.state.citizens ||= {};
    world.state.citizens[r.nation.id] = citizens.map((c) =>
      c && typeof c.serialize === "function" ? c.serialize() : c
    );
  }

  setFlagAction(r, data) {
    const world = this.world;
    const n = r.nation;
    const { type, data: flagData, name, stripeCount, stripeOrientation } = data;
    check(type === "uploaded" || type === "designed", "Unknown flag type");
    if (type === "uploaded") {
      check(flagData && typeof flagData === "string", "Flag data required");
      check(name && typeof name === "string", "Flag name required");
      n.flag = { type: "uploaded", data: flagData, name };
    } else {
      check(stripeCount && stripeOrientation, "Flag design requires stripe settings");
      n.flag = {
        type: "designed",
        stripeCount: Number(stripeCount),
        stripeOrientation,
        colors: [], // populated by client
      };
    }
    world.refresh(r);
  }

  resolveSituationAction(r, data) {
    const world = this.world;
    const { situationId, choiceIndex } = data;
    check(typeof situationId === "string", "Situation ID required");
    check(Number.isInteger(choiceIndex) && choiceIndex >= 0, "Choice index required");
    const n = r.nation;
    let situation = null;
    for (const type of ["nation", "population", "military"]) {
      const list = r.events?.active?.[type] || [];
      const found = list.find((s) => s.id === situationId && s.status === "pending");
      if (found) {
        situation = found;
        break;
      }
    }
    check(situation, "Situation not found or already resolved");
    check(situation.status === "pending", "Situation is not pending");
    const def = situation.definition;
    check(def && def.choices && def.choices[choiceIndex], "Invalid choice index");
    const events = globalThis.EventsSystem;
    if (events && typeof events.resolveSituation === "function") {
      events.resolveSituation(situation, choiceIndex);
    } else {
      situation.status = "resolved";
      situation.resolvedAt = Date.now();
      situation.resolvedChoice = choiceIndex;
      const choice = def.choices[choiceIndex];
      if (choice && choice.effects && situation.happinessPenaltyApplied) {
        const stats = n.nationStats || {};
        stats.happiness = Math.min(100, Math.max(0, (stats.happiness || 50) + 10));
        n.happiness = stats.happiness;
        situation.happinessPenaltyApplied = false;
      }
      if (choice && choice.effects) {
        const effects = choice.effects;
        if (effects.happiness !== undefined) {
          const stats = n.nationStats || {};
          stats.happiness = Math.min(100, Math.max(0, (stats.happiness || 50) + effects.happiness));
          n.happiness = stats.happiness;
        }
        if (effects.money !== undefined) {
          n.money = Math.max(0, (n.money || 0) + effects.money);
        }
        if (effects.disease !== undefined) {
          const stats = n.nationStats || {};
          stats.disease = Math.min(50, Math.max(0, (stats.disease || 10) + effects.disease));
        }
        if (effects.crime !== undefined) {
          const stats = n.nationStats || {};
          stats.crime = Math.min(80, Math.max(0, (stats.crime || 15) + effects.crime));
        }
        if (effects.pollution !== undefined) {
          const stats = n.nationStats || {};
          stats.pollution = Math.min(100, Math.max(0, (stats.pollution || 0) + effects.pollution));
        }
        if (effects.environment !== undefined) {
          const stats = n.nationStats || {};
          stats.environment = Math.min(100, Math.max(0, (stats.environment || 50) + effects.environment));
        }
        if (effects.literacy !== undefined) {
          const stats = n.nationStats || {};
          stats.literacy = Math.min(100, Math.max(0, (stats.literacy || 50) + effects.literacy));
        }
      }
    }
    world.refresh(r);
    broadcast();
  }

  setNationalPetAction(r, data) {
    const world = this.world;
    const n = r.nation;
    const { petIcon } = data;
    check(petIcon === null || typeof petIcon === "string", "Invalid pet icon");
    const validPets = ["none", "cat", "dog", "eagle", "lion", "wolf", "dragon"];
    if (petIcon && !validPets.includes(petIcon)) {
      check(false, "Invalid pet icon");
    }
    // 7-day cooldown on national pet changes
    const lastPetChange = n.nationalPetChangedDay;
    check(
      lastPetChange === undefined || world.state.day - lastPetChange >= 7,
      "National pet can only be changed once every 7 game turns",
    );
    n.nationalPet = petIcon && petIcon !== "none" ? petIcon : null;
    n.nationalPetChangedDay = world.state.day;
    world.refresh(r);
    // Award XP for national pet change
    try {
      world.xpGoalsSystem.awardChangeNationalPet(1, { newPet: n.nationalPet });
    } catch(e) {}
  }

  setEdictsAction(r, data) {
    const world = this.world;
    const n = r.nation;
    const { edicts } = data;
    check(edicts && typeof edicts === "object" && !Array.isArray(edicts), "Edicts object required");
    check(
      n.improvementEffects?.canSetPolicies,
      "Internal Affairs Office required to set edicts",
    );
    n.edicts = n.edicts || {};
    if (!n.edictChangeDates) n.edictChangeDates = {};
    if (n.edictFreePassUsed === undefined) n.edictFreePassUsed = false;

    const currentDay = world.state.day;
    const changes = {};
    // Check 30-day cooldown per category — only blocks categories being changed
    for (const [cat, stance] of Object.entries(edicts)) {
      const currentStance = n.edicts[cat];
      if (currentStance === stance) continue; // No change, skip
      if (!world.edictSystem.canChangeEdict(n, cat, currentDay)) {
        const daysLeft = world.edictSystem.getDaysUntilEdictChange(n, cat, currentDay);
        check(false, `Edict '${cat}' is on cooldown. ${daysLeft} day(s) remaining until change allowed.`);
      }
      changes[cat] = stance;
    }
    // Apply all changes that passed cooldown
    for (const [cat, stance] of Object.entries(changes)) {
      n.edicts[cat] = stance;
      n.edictChangeDates[cat] = currentDay;
    }
    // Consume free pass if any dangerous category was changed
    if (!n.edictFreePassUsed) {
      const hasDangerousChange = Object.keys(changes).some(cat =>
        ['sexualOrientation', 'marriageLimits'].includes(cat)
      );
      if (hasDangerousChange) {
        n.edictFreePassUsed = true;
      }
    }
    world.refresh(r);
    // Apply edict effects
    if (typeof world.edictSystem.applyEdictEffects === 'function') {
      world.edictSystem.applyEdictEffects(n);
    }
  }
}

module.exports = { NationManager };
