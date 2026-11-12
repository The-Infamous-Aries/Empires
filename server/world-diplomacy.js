"use strict";
const { randomUUID } = require("node:crypto");

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
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

class DiplomacyManager {
  constructor(world) {
    this.world = world;
  }

  diplomacyAction(r, action, d) {
    const world = this.world;
    const n = r.nation;
    if (action === "aidRespond") {
      const aid = world.state.aid[d.id];
      world.check(
        aid &&
          aid.to === n.id &&
          aid.status === "pending" &&
          aid.endsAt > world.clock(),
        "No pending aid proposal",
      );
      if (d.accept === true) {
        if (aid.type === "money") n.money += aid.amount;
        else n.tech += aid.amount;
        aid.status = "accepted";
        aid.endsAt = world.clock() + 3 * DAY;
      } else {
        aid.status = "returning";
        aid.endsAt = world.clock() + DAY;
      }
      return;
    }
    world.check(
      n.improvements.foreignAffairsOffice,
      "Foreign Affairs Office required",
    );
    if (action === "treatyRespond" || action === "treatyCancel") {
      const t = world.state.treaties[d.id];
      world.check(t && [t.from, t.to].includes(n.id), "Treaty not found");
      if (action === "treatyRespond") {
        world.check(
          t.to === n.id && t.status === "pending" && t.expiresAt > world.clock(),
          "Only the recipient can respond to a pending treaty",
        );
        if (d.accept === true) {
          const def = world.base.treaties[t.type];
          const reasons = diplomacy.treatyReasons(
            world,
            world.nation(t.from).nation,
            n,
            t.type,
            t.id,
          );
          world.check(!reasons.length, reasons.join("; "));
          world.check(
            (n.improvements.embassy || 0) >= (def.requiresEmbassies || 0),
            `${def.requiresEmbassies} embassies required`,
          );
          t.acceptedAt = world.clock();
          t.endsAt =
            t.type === "peace" ? t.acceptedAt + (t.duration || 30) * DAY : null;
          r.player._onTreatySigned();
          world.nation(t.from).player._onTreatySigned();
        }
        t.status = d.accept === true ? "active" : "rejected";
        // Award XP for accepting/rejecting a treaty
        try {
          if (d.accept === true) {
            const now = Date.now();
            const fromNation = t.from;
            const toNation = t.to;
            const treatyType = t.type;
            // Check 28-day cooldown between this nation pair for ANY treaty type
            if (world.xpGoalsSystem.canAwardTreatyXP(fromNation, toNation, now)) {
              // Proposer gets higher XP (they initiated and got it accepted)
              world.xpGoalsSystem.awardTreatyAcceptedProposer(treatyType, { treatyType, target: t.from, acceptedBy: t.to });
              // Acceptor gets lower XP
              world.xpGoalsSystem.awardTreatyAcceptedAcceptor(treatyType, { treatyType, target: t.to, acceptedFrom: t.from });
              // Record cooldown for this nation pair
              world.xpGoalsSystem.recordTreatyXP(fromNation, toNation, now);
              // Alliance-wide XP: if either nation is in an alliance, award to all alliance members
              const fromNat = world.nation(fromNation);
              const toNat = world.nation(toNation);
              const fromAlliance = fromNat?.allianceId;
              const toAlliance = toNat?.allianceId;
              const allianceMembers = new Set();
              if (fromAlliance) {
                const members = world.xpGoalsSystem.getAllianceMembers(fromAlliance) || [];
                members.forEach(m => allianceMembers.add(m));
              }
              if (toAlliance) {
                const members = world.xpGoalsSystem.getAllianceMembers(toAlliance) || [];
                members.forEach(m => allianceMembers.add(m));
              }
              allianceMembers.forEach(memberId => {
                if (memberId !== fromNation && memberId !== toNation) {
                  // Alliance members get acceptor-level XP (they didn't propose)
                  world.xpGoalsSystem.awardTreatyAcceptedAcceptor(treatyType, { treatyType, target: memberId, acceptedFrom: t.from, allianceBonus: true });
                }
              });
            }
          } else {
            world.xpGoalsSystem.awardRejectTreaty(1, { treatyType: t.type, target: t.from });
          }
        } catch(e) {
          console.error('Diplomacy: Treaty XP award failed:', e.message);
        }
      } else {
        world.check(
          t.status === "active" || t.status === "pending",
          "Treaty is not active",
        );
        world.check(
          t.status !== "active" || !world.base.treaties[t.type].cannotBreakEarly,
          "Peace pacts cannot be cancelled before expiry",
        );
        t.status = "cancelled";
      }
      return;
    }
    const other = world.nation(d.target).nation;
    world.check(other.id !== n.id, "Choose another nation");
    if (action === "relationship") {
      const quote = diplomacy.relationshipQuote(
        world,
        n,
        other.id,
        d.relationship,
      );
      world.check(quote.canSet, quote.reasons.join("; "));
      const isRemoval = d.relationship === "neutral";
      if (isRemoval) {
        // 7-day cooldown: cannot remove a relationship within 7 days of adding it
        n.relationshipAddedDay = n.relationshipAddedDay || {};
        const lastAdded = n.relationshipAddedDay[other.id];
        if (lastAdded !== undefined && world.state.day - lastAdded < 7) {
          const daysLeft = 7 - (world.state.day - lastAdded);
          world.check(false, `Cannot remove relationship with ${other.name} for ${daysLeft} more day(s).`);
        }
        delete n.relationships[other.id];
        delete n.relationshipAddedDay[other.id];
      } else {
        // Adding/changing a relationship — always allowed, record the day
        n.relationshipAddedDay = n.relationshipAddedDay || {};
        n.relationshipAddedDay[other.id] = world.state.day;
        n.relationships[other.id] = d.relationship;
      }
      // Award XP for relationship changes
      try {
        const relXPMap = {
          friend: "addFriend",
          bestFriend: "addBestFriend",
          foe: "addFoe",
          nemesis: "addNemesis",
        };
        const xpSource = relXPMap[d.relationship];
        if (xpSource) {
          world.xpGoalsSystem[xpSource](1, { target: other.id });
        }
      } catch(e) {
        console.error('Diplomacy: Relationship XP award failed:', e.message);
      }
    } else if (action === "aid") {
      world.check(
        n.projects.financialAssistanceOffice,
        "Financial Assistance Office required",
      );
      world.check(
        Object.values(world.state.aid).filter(
          (a) =>
            a.from === n.id &&
            ["pending", "accepted", "returning"].includes(a.status),
        ).length < 3,
        "All 3 aid slots are occupied",
      );
      const type = d.type || "money";
      world.check(["money", "tech"].includes(type), "Unknown aid type");
      const amount =
        type === "money"
          ? quantity(d.amount, 1_000_000_000)
          : Math.floor(n.tech * 0.2);
      world.check(amount > 0, "No technology to share");
      if (type === "money") {
        world.check(n.money >= amount, "Insufficient money");
        n.money -= amount;
      }
      const aidId = randomUUID();
      world.state.aid[aidId] = {
        id: aidId,
        from: n.id,
        to: other.id,
        type,
        amount,
        status: "pending",
        endsAt: world.clock() + 7 * DAY,
      };
    } else {
      world.check(own(world.base.treaties, d.type), "Unknown treaty");
      const def = world.base.treaties[d.type];
      world.check(
        (n.improvements.embassy || 0) >= (def.requiresEmbassies || 0),
        `${def.requiresEmbassies} embassies required`,
      );
      const reasons = diplomacy.treatyReasons(world, n, other, d.type);
      world.check(!reasons.length, reasons.join("; "));
      const compensation = d.compensation === undefined ? 0 : d.compensation;
      world.check(
        Number.isSafeInteger(compensation) &&
          compensation >= 0 &&
          compensation <= 1e9,
        "Invalid compensation",
      );
      const duration =
        d.type === "peace" ? quantity(d.duration ?? 30, 30) : null;
      const id = randomUUID();
      world.state.treaties[id] = {
        duration,
        id,
        from: n.id,
        to: other.id,
        type: d.type,
        status: "pending",
        compensation,
        createdAt: world.clock(),
        expiresAt: world.clock() + 7 * DAY,
      };
      // Award XP for proposing a treaty
      try { world.xpGoalsSystem.awardProposeTreaty(1, { treatyType: d.type, target: other.id }); } catch(e) { console.error('Diplomacy: Propose treaty XP failed:', e.message); }
    }
  }

  allianceAction(r, action, d) {
    const world = this.world;
    const n = r.nation,
      id = n.id;
    if (action === "allianceCreate") {
      world.check(
        world.canFound(n),
        "Alliance Headquarters or the diplomatic founding conditions required",
      );
      world.check(
        ["democratic", "trio", "autocratic"].includes(d.government),
        "Choose an alliance government",
      );
      const name = text(d.name, "Alliance name", 60, 3);
      world.check(
        !Object.values(world.state.alliances).some(
          (a) => a.name.toLowerCase() === name.toLowerCase(),
        ),
        "Alliance name already exists",
      );
      const acronym = text(d.acronym || "", "Acronym", 10, 0);
      const color = d.color && /^#[0-9A-Fa-f]{6}$/.test(d.color)
        ? d.color
        : "#ffffff";
      const aid = randomUUID(),
        template = world.base.allianceTemplates[d.government];
      world.state.alliances[aid] = {
        id: aid,
        name,
        acronym,
        color,
        description: text(d.description || "", "Description", 2000, 0),
        government: d.government,
        founder: id,
        members: { [id]: template.roles[0].id },
        applications: [],
        treasury: 0,
        open: true,
        createdAt: world.clock(),
        colorChangedAt: world.clock(),
        governmentChangedAt: 0,
        skills: {},
        skillPoints: 0,
        statistics: {
          warsWon: 0,
          warsLost: 0,
          treatiesSigned: 0,
          territoryGained: 0,
          totalDamageDealt: 0,
          membersRecruited: 0,
          projectsCompleted: 0
        },
        treaties: [],
        log: [],
      };
      n.allianceId = aid;
      r.player._onAllianceFormed();
      return;
    }
    if (action === "allianceApply") {
      world.check(!n.allianceId, "Already in an alliance");
      const a = world.state.alliances[d.id];
      world.check(a?.open, "Alliance is not recruiting");
      world.check(!a.applications.includes(id), "Application already pending");
      a.applications.push(id);
      return;
    }
    const a = world.state.alliances[n.allianceId];
    world.check(a && own(a.members, id), "Join an alliance first");
    const permitted = (permission) =>
      world.check(
        world.hasPermission(a, id, permission),
        "Your alliance role cannot perform this action",
      );
    const roles = world.base.allianceTemplates[a.government].roles;
    switch (action) {
      case "allianceReview": {
        permitted("members");
        world.check(a.applications.includes(d.target), "No pending application");
        if (d.accept === true) {
          const other = world.nation(d.target).nation;
          world.check(!other.allianceId, "Applicant already joined an alliance");
          world.check(
            Object.keys(a.members).length < 6,
            "Alliance is full (6 members)",
          );
          a.members[other.id] = roles.at(-1).id;
          other.allianceId = a.id;
        }
        a.applications = a.applications.filter((x) => x !== d.target);
        break;
      }
      case "allianceSettings":
        permitted("domestic");
        a.description = text(d.description, "Description", 2000, 0);
        world.check(typeof d.open === "boolean", "Invalid recruitment setting");
        a.open = d.open;
        break;
      case "allianceEditSettings": {
        world.check(id === a.founder || world.hasPermission(a, id, "domestic"), "Your alliance role cannot perform this action");
        const now = world.clock();
        const COLOR_COOLDOWN = 30 * 24 * 60 * 60 * 1000;
        const GOVERNMENT_COOLDOWN = 90 * 24 * 60 * 60 * 1000;
        if (d.open !== undefined) {
          a.open = d.open === "on" || d.open === true;
        }
        if (d.description !== undefined) {
          a.description = text(d.description, "Description", 2000, 0);
        }
        if (d.acronym !== undefined) {
          a.acronym = text(d.acronym, "Acronym", 10, 0);
        }
        if (d.name && d.name !== a.name) {
          const name = text(d.name, "Alliance name", 60, 3);
          world.check(
            !Object.values(world.state.alliances).some(
              (x) => x.id !== a.id && x.name.toLowerCase() === name.toLowerCase(),
            ),
            "Alliance name already exists",
          );
          a.name = name;
        }
        if (d.color && /^#[0-9A-Fa-f]{6}$/.test(d.color) && d.color !== a.color) {
          const last = a.colorChangedAt || 0;
          world.check(now - last >= COLOR_COOLDOWN, `Alliance color change on cooldown (30 days).`);
          a.color = d.color;
          a.colorChangedAt = now;
        }
        if (d.government && d.government !== a.government) {
          const template = world.base.allianceTemplates[d.government];
          world.check(template, "Unknown government type");
          const last = a.governmentChangedAt || 0;
          world.check(now - last >= GOVERNMENT_COOLDOWN, `Alliance government change on cooldown (90 days).`);
          a.government = d.government;
          a.governmentChangedAt = now;
          // Preserve existing members: founder gets first role, others keep role if it exists in new gov or get default
          const founderRoleId = template.roles[0]?.id;
          const defaultRoleId = template.roles.find((r) => !r.unique)?.id || founderRoleId;
          const oldMembers = { ...a.members };
          a.members = { [id]: founderRoleId };
          Object.keys(oldMembers).forEach((nid) => {
            if (nid !== id) {
              a.members[nid] = template.roles.some((r) => r.id === oldMembers[nid])
                ? oldMembers[nid]
                : defaultRoleId;
            }
          });
        }
        break;
      }
      case "allianceUpgradeSkill": {
        world.check(id === a.founder || world.hasPermission(a, id, "all"), "Your alliance role cannot perform this action");
        const skillKey = d.skill;
        const def = world.base.allianceSkills?.[skillKey];
        world.check(def, "Unknown alliance skill");
        const cur = (a.skills && a.skills[skillKey]) || { level: 0 };
        world.check(cur.level < (def.maxLevel || 10), "Skill already at maximum level");
        const cost = Math.floor(def.baseCost * Math.pow(def.costMultiplier, cur.level));
        world.check((a.skillPoints || 0) >= cost, "Insufficient alliance skill points");
        a.skills = a.skills || {};
        a.skills[skillKey] = { level: cur.level + 1, pointsSpent: (cur.pointsSpent || 0) + cost, effects: def.effects ? def.effects(cur.level + 1) : {} };
        a.skillPoints = (a.skillPoints || 0) - cost;
        a.statistics = a.statistics || {};
        break;
      }
      case "allianceRemoveTreaty": {
        permitted("diplomacy");
        const index = Number(d.treaty);
        world.check(Number.isFinite(index) && index >= 0 && index < (a.treaties || []).length, "Invalid treaty");
        a.treaties.splice(index, 1);
        break;
      }
      case "allianceRole": {
        permitted("all");
        world.check(own(a.members, d.target), "Member not found");
        world.check(
          d.target !== a.founder,
          "Transfer leadership to change the founder role",
        );
        const role = roles.find((role) => role.id === d.role);
        world.check(role, "Unknown role");
        const count = Object.values(a.members).filter(
          (value) => value === role.id,
        ).length;
        world.check(count < (role.unique ? 1 : role.maxCount || 999), "Role is full");
        a.members[d.target] = role.id;
        break;
      }
      case "allianceTransfer": {
        world.check(a.founder === id, "Only the founder can transfer leadership");
        world.check(
          d.target !== id && own(a.members, d.target),
          "Choose another member",
        );
        a.members[d.target] = roles[0].id;
        a.members[id] = roles.at(-1).id;
        a.founder = d.target;
        break;
      }
      case "allianceKick":
        world.check(id === a.founder || world.hasPermission(a, id, "members"), "Your alliance role cannot perform this action");
        world.check(
          own(a.members, d.target) &&
            d.target !== a.founder &&
            !world.hasPermission(a, d.target, "all"),
          "Cannot remove this member",
        );
        delete a.members[d.target];
        world.nation(d.target).nation.allianceId = null;
        break;
      case "allianceLeave":
        world.check(
          a.founder !== id || Object.keys(a.members).length === 1,
          "Transfer leadership before leaving",
        );
        if (Object.keys(a.members).length === 1) {
          n.money += a.treasury;
          delete world.state.alliances[a.id];
        } else delete a.members[id];
        n.allianceId = null;
        break;
      case "allianceDeposit": {
        const amount = quantity(d.amount, 1_000_000_000);
        world.check(n.money >= amount, "Insufficient money");
        n.money -= amount;
        a.treasury += amount;
        break;
      }
      case "allianceWithdraw": {
        permitted("resources");
        const amount = quantity(d.amount, 1_000_000_000);
        world.check(a.treasury >= amount, "Insufficient alliance funds");
        a.treasury -= amount;
        n.money += amount;
        break;
      }
    }
    a.log.push({ actor: id, action, at: world.clock() });
    a.log = a.log.slice(-100);
  }

  warRespond(r, id, data) {
    return this.world.warMgr.warRespond(r, id, data);
  }

  joinWar(r, id, data) {
    return this.world.warMgr.joinWar(r, id, data);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIPLOMACY HELPER FUNCTIONS (consolidated from diplomacy.js)
// ═══════════════════════════════════════════════════════════════════════════════

const friendly = new Set(["friend", "bestFriend"]);
const hostile = new Set(["foe", "nemesis"]);
const relationshipTypes = ["neutral", "friend", "bestFriend", "foe", "nemesis"];
const live = (t) => ["active", "pending"].includes(t.status);
function relationshipQuote(world, n, target, relationship) {
  const current = (n.relationships || {})[target] || "neutral",
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
  const others = Object.entries(n.relationships || {})
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
    if (id === n.id || !world.rules.has(id)) continue;
    const own = n.relationships[id],
      incoming = world.nation(id).nation.relationships[n.id];
    if (own === "friend") bonus += 0.05;
    if (own === "bestFriend") bonus += 0.15;
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
  const ratio = (world.base.treaties.intelligence || {}).techShareRatio ?? 0.2;
  return Math.max(
    0,
    ...intelligencePartners(world, n.id)
      .filter((id) => world.rules.has(id))
      .map((id) => Math.floor(world.nation(id).nation.tech * ratio)),
  );
}
function intelligence(world, n) {
  const reports = JSON.parse(JSON.stringify(n.intelligence || {}));
  for (const id of intelligencePartners(world, n.id)) {
    if (!world.rules.has(id)) continue;
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
    const values = Object.values(n.relationships || {});
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
          (world.base.treaties[t.type] &&
            world.base.treaties[t.type].requiresEmbassies ||
            0) > remaining,
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
  DiplomacyManager,
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
