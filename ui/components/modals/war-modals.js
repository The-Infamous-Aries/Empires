"use strict";
/**
 * War Modals - Sovereignty Epochs
 * War detail view that takes over the Wars tab (not a popup dialog).
 * Contains the tug-of-war bar, damage rankings, attack/defend actions,
 * missile/nuke/spy launch buttons, and battle log for a single war.
 *
 * Exports (via window.WarModals):
 *   renderWarDetail(state, warId) -> HTML string
 *   computeStatRankings(war, state, stat) -> { attacker: [], defender: [] }
 *   renderSideRankings(war, state, side, rankings) -> HTML string
 *   renderWarAction(war, state, userSide, enemySide) -> HTML string
 *   renderWarLog(war, state) -> HTML string
 *   getSideDamageIncludingSpy(war, state, side) -> number
 */

/* ═══════════════════════════════════════════════════════════════════════════
   CLIENT-SIDE SPY DAMAGE TRACKING
   Spy operations do not report damage to the server in war.damage, so we
   track them client-side. Spy damage is added to side totals (tug-of-war)
   but is NEVER attributed to a specific nation in rankings (hidden).
   ════════════════════════════════════════════════════════════════════════════ */

if (typeof window !== "undefined" && !window.warSpyDamage) {
  window.warSpyDamage = new Map(); // warId -> Map<nationId, damage>
}

function getSpyDamage(warId, nationId) {
  if (typeof window === "undefined" || !window.warSpyDamage) return 0;
  const byWar = window.warSpyDamage.get(warId);
  if (!byWar) return 0;
  return byWar.get(nationId) || 0;
}

function addSpyDamage(warId, nationId, damage) {
  if (typeof window === "undefined" || !window.warSpyDamage) return;
  if (!window.warSpyDamage.has(warId)) window.warSpyDamage.set(warId, new Map());
  const byWar = window.warSpyDamage.get(warId);
  const current = byWar.get(nationId) || 0;
  byWar.set(nationId, current + damage);
}

function getSideSpyDamage(warId, side, war) {
  const sides = war.sides || { attacker: [war.attacker], defender: [war.defender] };
  let total = 0;
  for (const nationId of sides[side]) {
    total += getSpyDamage(warId, nationId);
  }
  return total;
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOCAL UI HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
const human = (value) =>
  String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
const number = (value) =>
  Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const date = (value) => new Date(value).toLocaleString();

const nationName = (id, state) =>
  state?.nations?.find((n) => n.id === id)?.name || "Unknown nation";

const allianceName = (id, state) => {
  if (!state || !state.alliances) return "Unknown alliance";
  const a = state.alliances.find((x) => x.id === id);
  return a ? a.name : "Unknown alliance";
};

const badge = (value, style = "") =>
  `<span class="badge ${style}">${esc(value)}</span>`;

const button = (label, action, data, enabled = true, style = "primary") =>
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(JSON.stringify(data))}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;

/* ═══════════════════════════════════════════════════════════════════════════
   WAR SIDE HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function getUserSide(war, nationId) {
  const sides = war.sides || { attacker: [war.attacker], defender: [war.defender] };
  if (sides.attacker.includes(nationId)) return "attacker";
  if (sides.defender.includes(nationId)) return "defender";
  return null;
}

function isAllianceGovernment(nationId, state) {
  if (!state || !state.nation || !state.nation.allianceId) return false;
  const alliance = state.alliances?.find((a) => a.id === state.nation.allianceId);
  if (!alliance) return false;
  if (alliance.founder === nationId) return true;
  const member = alliance.members?.get?.(nationId) || alliance.members?.[nationId];
  if (member) {
    const roleId = member.role || member;
    const roles = alliance.government?.roles;
    if (roles && roles.get) {
      const role = roles.get(roleId);
      if (role && role.permissions && role.permissions.includes("all")) return true;
    }
    if (member.permissions && member.permissions.includes("all")) return true;
  }
  return false;
}

/**
 * Check if user's nation can launch a missile in this war.
 */
function canLaunchMissile(nation, player) {
  if (!nation || !player) return false;
  const hasMissiles = (nation.militaryUnits?.missiles || 0) > 0;
  const hasIntuition = player.currentIntuition >= 25;
  return hasMissiles && hasIntuition;
}

/**
 * Check if user's nation can launch a nuke in this war.
 */
function canLaunchNuke(nation, player) {
  if (!nation || !player) return false;
  const hasNukes = (nation.militaryUnits?.nukes || 0) > 0;
  const hasIntuition = player.currentIntuition >= 50;
  const notBanned = !nation.motionModifiers?.nuclearBan;
  return hasNukes && hasIntuition && notBanned;
}

/**
 * Check if user's nation can launch a spy operation in this war.
 */
function canLaunchSpy(nation, player) {
  if (!nation || !player) return false;
  const hasSpies = (nation.militaryUnits?.spies || 0) > 0;
  const hasIntuition = player.currentIntuition >= 10;
  return hasSpies && hasIntuition;
}

/**
 * Get total damage for a side including conventional + missile + nuke + spy damage.
 * Spy damage is included in the total but NOT attributed per-nation in rankings.
 */
function getSideDamageIncludingSpy(war, state, side) {
  const sides = war.sides || { attacker: [war.attacker], defender: [war.defender] };
  let total = 0;
  for (const nationId of sides[side]) {
    total += war.damage?.[nationId] || 0;
    total += getSpyDamage(war.id, nationId);
  }
  return total;
}

/* ═══════════════════════════════════════════════════════════════════════════
   WAR DETAIL VIEW — TAKES OVER THE TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function renderWarDetail(state, warId) {
  const war = (state.wars || []).find((w) => w.id === warId);
  if (!war) {
    return `
      <div class="empty">War not found.</div>
      <button data-action="warBack" class="primary section">Back to wars</button>
    `;
  }

  const n = state.nation;
  const sides = war.sides || { attacker: [war.attacker], defender: [war.defender] };
  const userSide = getUserSide(war, n.id);
  const isParticipating = userSide !== null;
  const enemySide = userSide ? (userSide === "attacker" ? "defender" : "attacker") : null;

  // Include spy damage in tug-of-war totals (hidden from per-nation rankings)
  const attackerDamage = getSideDamageIncludingSpy(war, state, "attacker");
  const defenderDamage = getSideDamageIncludingSpy(war, state, "defender");
  const totalDamage = attackerDamage + defenderDamage;
  const attackerPct = totalDamage > 0 ? Math.round((attackerDamage / totalDamage) * 100) : 50;
  const defenderPct = totalDamage > 0 ? Math.round((defenderDamage / totalDamage) * 100) : 50;

  const stat = window.warsStatRank || "damage";
  const statRankings = computeStatRankings(war, state, stat);

  return `
    <header class="page-heading">
      <div>
        <div class="eyebrow">War Detail</div>
        <h1>${esc(nationName(war.attacker, state))} vs ${esc(nationName(war.defender, state))}</h1>
        <p>${esc(war.reason)}</p>
      </div>
      <button data-action="warBack" class="section">Back to wars</button>
    </header>

    <div class="war-detail">
      <!-- War header info -->
      <section class="card section">
        <div class="form-grid">
          <div><strong>War ID:</strong> ${esc(war.id)}</div>
          <div><strong>Status:</strong> ${badge(war.status, war.status === "active" ? "good" : "")}</div>
          <div><strong>Round:</strong> ${war.round}</div>
          <div><strong>Type:</strong> ${human(war.type || "conventional")}</div>
          <div><strong>Declared:</strong> ${date(war.startTime || war.declared || Date.now())}</div>
          <div><strong>Ends:</strong> <span data-deadline="${war.endsAt || 0}"></span></div>
        </div>
        <p class="muted"><strong>Attackers:</strong> ${sides.attacker.map((id) => esc(nationName(id, state))).join(", ")}</p>
        <p class="muted"><strong>Defenders:</strong> ${sides.defender.map((id) => esc(nationName(id, state))).join(", ")}</p>
      </section>

      <!-- Tug of war bar (includes spy damage in totals, hidden per-nation) -->
      <section class="card section">
        <div class="section-title"><h2>Tug of War</h2></div>
        <div class="tug-of-war-large">
          <div class="tug-side tug-attacker" style="flex-basis: ${attackerPct}%">
            <div class="tug-label">${esc(nationName(war.attacker, state))}</div>
            <div class="tug-bar-fill" style="width: 100%; background: var(--danger);"></div>
            <div class="tug-value">${number(attackerDamage)} total damage</div>
          </div>
          <div class="tug-center">
            <div class="tug-pct">${attackerPct}%</div>
            <div class="tug-vs">vs</div>
            <div class="tug-pct">${defenderPct}%</div>
          </div>
          <div class="tug-side tug-defender" style="flex-basis: ${defenderPct}%">
            <div class="tug-label">${esc(nationName(war.defender, state))}</div>
            <div class="tug-bar-fill" style="width: 100%; background: var(--accent);"></div>
            <div class="tug-value">${number(defenderDamage)} total damage</div>
          </div>
        </div>
        <p class="muted">The side dealing more damage has the larger bar. Includes conventional, missile, nuke, and spy damage. War winner is determined by rounds won (best of 3).</p>
      </section>

      <!-- Stat ranking filter (spy damage is NOT shown per-nation) -->
      <section class="card section">
        <div class="section-title"><h2>Damage Rankings</h2></div>
        <div class="war-stat-filter">
          <button data-action="warStat" data-war-stat="damage" class="${stat === "damage" ? "active" : ""}">Damage Dealt</button>
          <button data-action="warStat" data-war-stat="unitsLost" class="${stat === "unitsLost" ? "active" : ""}">Units Lost</button>
          <button data-action="warStat" data-war-stat="unitsKilled" class="${stat === "unitsKilled" ? "active" : ""}">Units Killed</button>
          <button data-action="warStat" data-war-stat="missiles" class="${stat === "missiles" ? "active" : ""}">Missiles Launched/Missed</button>
          <button data-action="warStat" data-war-stat="nukes" class="${stat === "nukes" ? "active" : ""}">Nukes Launched/Missed</button>
          <span class="muted" style="margin-left:auto;font-size:11px;">Spy damage hidden per-nation</span>
        </div>
      </section>

      <!-- Side-by-side rankings -->
      <div class="war-rankings">
        ${renderSideRankings(war, state, "attacker", statRankings.attacker)}
        ${renderSideRankings(war, state, "defender", statRankings.defender)}
      </div>

      <!-- Action: Attack / Launch -->
      ${renderWarAction(war, state, userSide, enemySide)}

      <!-- Battle log -->
      ${renderWarLog(war, state)}
    </div>
  `;
}

/**
 * Compute rankings for each side based on the selected stat.
 * Spy damage is intentionally NOT included in per-nation rankings (hidden).
 */
function computeStatRankings(war, state, stat) {
  const sides = war.sides || { attacker: [war.attacker], defender: [war.defender] };
  const result = { attacker: [], defender: [] };

  for (const side of ["attacker", "defender"]) {
    for (const nationId of sides[side]) {
      const nation = state.nations?.find((n) => n.id === nationId);
      const damage = war.damage?.[nationId] || 0;
      let statValue = 0;
      let extraInfo = "";

      switch (stat) {
        case "damage":
          statValue = damage;
          extraInfo = `Damage dealt in this war`;
          break;
        case "unitsLost": {
          const lost = war.casualties?.[nationId] || {};
          statValue = Object.values(lost).reduce((a, b) => a + b, 0);
          extraInfo = `Total units lost in this war`;
          break;
        }
        case "unitsKilled":
          statValue = nation?.statistics?.totalUnitsKilled || 0;
          extraInfo = `Total units killed (all wars)`;
          break;
        case "missiles":
          statValue = nation?.statistics?.missileLaunches || 0;
          extraInfo = `Missiles launched`;
          break;
        case "nukes":
          statValue = nation?.statistics?.nukeLaunches || 0;
          extraInfo = `Nukes launched`;
          break;
      }

      result[side].push({
        nationId,
        name: nationName(nationId, state),
        damage,
        statValue,
        extraInfo,
        allianceId: nation?.allianceId || null,
        allianceName: nation?.allianceId ? allianceName(nation.allianceId, state) : null,
        isMe: nationId === state.nation.id,
      });
    }

    result[side].sort((a, b) => b.statValue - a.statValue);
  }

  return result;
}

/**
 * Render the rankings for one side of the war.
 */
function renderSideRankings(war, state, side, rankings) {
  const nations = war.sides?.[side] || [side === "attacker" ? war.attacker : war.defender];
  const sideDamage = nations.reduce((sum, id) => sum + (war.damage?.[id] || 0), 0);

  const alliancesList = [];
  for (const id of nations) {
    const nation = state.nations?.find((n) => n.id === id);
    if (nation?.allianceId && !alliancesList.includes(nation.allianceId)) {
      alliancesList.push(nation.allianceId);
    }
  }

  return `
    <div class="war-side-rankings">
      <div class="war-side-header ${side}">
        <h3>${side === "attacker" ? "Attacker Side" : "Defender Side"}</h3>
        <div class="war-side-total">Total Damage: ${number(sideDamage)}</div>
        ${alliancesList.length ? `<div class="war-side-alliances">Alliances: ${alliancesList.map((id) => esc(allianceName(id, state))).join(", ")}</div>` : ""}
      </div>
      <div class="war-side-list">
        ${rankings.map((r, i) => `
          <div class="war-ranking-row${r.isMe ? " me" : ""}" data-nation-id="${esc(r.nationId)}">
            <div class="war-ranking-rank">${i + 1}</div>
            <div class="war-ranking-name">${esc(r.name)}${r.isMe ? " <span class='badge me-badge'>You</span>" : ""}${r.allianceName ? ` <small>[${esc(r.allianceName)}]</small>` : ""}</div>
            <div class="war-ranking-bar">
              <div class="war-ranking-bar-fill" style="width: ${sideDamage > 0 ? Math.round((r.statValue / sideDamage) * 100) : 0}%;"></div>
            </div>
            <div class="war-ranking-value">${number(r.statValue)}</div>
            <div class="war-ranking-info">${esc(r.extraInfo)}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

/**
 * Render the attack / launch action section.
 * Only allows attacking/launching for sides the user is on or joined.
 * Launch buttons are only shown/interactable if the user can launch at least one type.
 */
function renderWarAction(war, state, userSide, enemySide) {
  const n = state.nation;
  const sides = war.sides || { attacker: [war.attacker], defender: [war.defender] };
  const enemies = sides[enemySide] || [];
  const player = state.player || {};
  const energyCost = Math.ceil(10 * (n.motionModifiers?.energyCost || 1));
  const currentEnergy = player.currentEnergy || 0;
  const maxEnergy = player.getMaxEnergy ? player.getMaxEnergy() : 100;
  const canAttack = currentEnergy >= energyCost && n.militaryStrength > 0;

  // Launch capability checks
  const canMissile = canLaunchMissile(n, player);
  const canNuke = canLaunchNuke(n, player);
  const canSpy = canLaunchSpy(n, player);
  const canLaunchAny = canMissile || canNuke || canSpy;

  if (!userSide || war.status !== "active") {
    return `
      <section class="card section">
        <div class="section-title"><h2>Join War</h2></div>
        ${!n.allianceId
          ? '<p class="muted">You are not in an alliance. Only alliance members can join wars.</p>'
          : isAllianceGovernment(n.id, state)
            ? `
              <p class="help">As alliance government, you can join this war on the <strong>${human(enemySide || "defender")}</strong> side. Once your alliance joins, all alliance members can fight in it.</p>
              ${button("Join War", "warJoin", { id: war.id, side: enemySide || "defender" }, war.status === "preparing", "primary")}
            `
            : '<p class="locked">Only alliance government can join alliance wars. Contact your alliance founder or leader.</p>'}
      </section>
    `;
  }

  const targetSelect = enemies.length > 0
    ? `<select id="warAttackTarget">${enemies.map((id) => `<option value="${esc(id)}">${esc(nationName(id, state))}</option>`).join("")}</select>`
    : "<span class='muted'>No targets available</span>";

  const launchButtons = `
    <div class="war-launch-group">
      ${button("Missile", "warLaunch", { id: war.id, target: enemies[0] || "", type: "missiles" }, canMissile && canLaunchAny, "")}
      ${button("Nuke", "warLaunch", { id: war.id, target: enemies[0] || "", type: "nukes" }, canNuke && canLaunchAny, "")}
      ${button("Spy Op", "warLaunch", { id: war.id, target: enemies[0] || "", type: "spies" }, canSpy && canLaunchAny, "")}
    </div>
    <p class="muted launch-hint">
      Missile: 25 Intuition • Nuke: 50 Intuition • Spy Op: 10 Intuition • All cost ${energyCost} Energy
    </p>
  `;

  return `
    <section class="card section">
      <div class="section-title"><h2>Combat Operations</h2></div>
      <div class="war-action-bar">
        <div class="war-action-info">
          <div class="war-action-side">Your side: ${human(userSide)}</div>
          <div class="war-action-energy">Energy: ${number(currentEnergy)} / ${number(maxEnergy)}</div>
          <div class="war-action-cost">Conventional attack: ${energyCost} energy</div>
        </div>
        <div class="war-action-controls">
          ${targetSelect}
          ${button(canAttack ? "Attack" : "Insufficient Energy", "warAttack", { id: war.id, target: enemies[0] || "", type: "conventional" }, canAttack, "primary")}
        </div>
      </div>

      ${canLaunchAny ? `
        <div class="war-launch-section">
          <div class="section-title"><h3>Launch Operations</h3></div>
          ${launchButtons}
        </div>
      ` : `
        <p class="muted">No launch capabilities available. Recruit missiles, nukes, or spies and regain Intuition to unlock launch operations.</p>
      `}

      ${!canAttack
        ? `<p class="muted">You need ${energyCost} energy to attack. Energy regenerates 10% per hour.</p>`
        : ""}
      <p class="help">You can only attack/launch against nations on the opposing side. Damage, loot, and casualties are calculated based on your skills, military units, war modifiers, and casus belli.</p>
    </section>
  `;
}

/**
 * Render the battle log for a war.
 */
function renderWarLog(war, state) {
  const log = war.log || [];
  if (!log.length) {
    return `<section class="card section"><div class="section-title"><h2>Battle Log</h2></div><p class="muted">No engagements yet.</p></section>`;
  }

  return `
    <section class="card section">
      <div class="section-title"><h2>Battle Log</h2></div>
      <div class="war-log">
        ${log.slice().reverse().map((entry) => `
          <div class="war-log-entry${entry.type === "spies" ? " spy-entry" : ""}">
            <span class="war-log-time">${date(entry.at)}</span>
            <span class="war-log-actor">${esc(nationName(entry.actor, state))}</span>
            <span class="war-log-action">${human(entry.type)}</span>
            <span class="war-log-target">→ ${esc(nationName(entry.target, state))}</span>
            <span class="war-log-damage">${entry.damage ? number(entry.damage) + " dmg" : "—"}</span>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORTS
   ════════════════════════════════════════════════════════════════════════════ */

if (typeof window !== "undefined") {
  window.WarModals = {
    renderWarDetail,
    computeStatRankings,
    renderSideRankings,
    renderWarAction,
    renderWarLog,
    getUserSide,
    isAllianceGovernment,
    canLaunchMissile,
    canLaunchNuke,
    canLaunchSpy,
    getSideDamageIncludingSpy,
    getSpyDamage,
    addSpyDamage,
  };
}
