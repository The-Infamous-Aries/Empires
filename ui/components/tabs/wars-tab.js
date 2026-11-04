"use strict";
/**
 * Wars Tab - Sovereignty Epochs
 * Renders the full Wars tab content with 4-category war listing and war detail view.
 *
 * Exports: renderWarsTab(state) -> HTML string
 * Sets: window.warsCurrentWarId (null = list view, warId = detail view)
 */

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
const money = (value) => "$" + number(value);
const date = (value) => new Date(value).toLocaleString();

const button = (label, action, data, enabled = true, style = "primary") =>
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(JSON.stringify(data))}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;

const sectionButton = (label, action) =>
  `<button class="section" data-action="${esc(action)}">${esc(label)}</button>`;

const nationName = (id, state) =>
  state?.nations?.find((n) => n.id === id)?.name || "Unknown nation";

const allianceName = (id, state) => {
  if (!state || !state.alliances) return "Unknown alliance";
  const a = state.alliances.find((x) => x.id === id);
  return a ? a.name : "Unknown alliance";
};

const empty = (message) => `<div class="empty">${esc(message)}</div>`;
const badge = (value, style = "") =>
  `<span class="badge ${style}">${esc(value)}</span>`;

/* ═══════════════════════════════════════════════════════════════════════════
   WAR CATEGORIZATION
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Get the user's nation's relationship with another nation.
 * Returns: 'friend' | 'bestFriend' | 'foe' | 'nemesis' | null
 */
function getRelationship(nationId, targetId, state) {
  if (!state || !state.nation) return null;
  const rels = state.nation.relationships || {};
  return rels[targetId] || null;
}

/**
 * Check if user's nation is participating in a war.
 */
function isParticipating(warId, nationId, state) {
  const war = (state.wars || []).find((w) => w.id === warId);
  if (!war) return false;
  const participants = war.participants || [war.attacker, war.defender];
  return participants.includes(nationId);
}

/**
 * Get which side the user's nation is on in a war.
 * Returns: 'attacker' | 'defender' | null
 */
function getUserSide(war, nationId) {
  const sides = war.sides || { attacker: [war.attacker], defender: [war.defender] };
  if (sides.attacker.includes(nationId)) return "attacker";
  if (sides.defender.includes(nationId)) return "defender";
  return null;
}

/**
 * Check if user's nation is alliance government (founder or has "all" permission).
 */
function isAllianceGovernment(nationId, state) {
  if (!state || !state.nation || !state.nation.allianceId) return false;
  const alliance = state.alliances?.find((a) => a.id === state.nation.allianceId);
  if (!alliance) return false;
  // Founder is always government
  if (alliance.founder === nationId) return true;
  // Check member role permissions
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
 * Get participants of a war including alliance members.
 * If an alliance member is in the war, all alliance members are considered participants.
 */
function getWarParticipants(war, state) {
  const sides = war.sides || { attacker: [war.attacker], defender: [war.defender] };
  const participants = new Set(war.participants || [war.attacker, war.defender]);

  // Expand participants to include alliance members
  for (const pid of [...participants]) {
    const nation = state.nations?.find((n) => n.id === pid);
    if (nation?.allianceId) {
      const alliance = state.alliances?.find((a) => a.id === nation.allianceId);
      if (alliance) {
        for (const mid of alliance.members?.keys() || []) {
          participants.add(mid);
        }
        // Also handle members as object
        if (alliance.members instanceof Map === false && typeof alliance.members === "object") {
          for (const mid of Object.keys(alliance.members)) {
            participants.add(mid);
          }
        }
      }
    }
  }

  return participants;
}

/**
 * Categorize wars into 4 groups based on user's nation relationships.
 * User's Active: wars the user is participating in
 * Allies: wars where friends/bestFriends/treaty partners participate (excluding User's Active)
 * Opposition: wars where foes/nemesis participate (excluding User's Active and Allies)
 * Non-Ties: all other active wars
 */
function categorizeWars(activeWars, state) {
  const n = state.nation;
  const userId = n.id;

  const userActive = [];
  const allies = [];
  const opposition = [];
  const nonTies = [];

  for (const war of activeWars) {
    const participants = getWarParticipants(war, state);

    // User's Active: user is participating
    if (participants.has(userId)) {
      userActive.push(war);
      continue;
    }

    // Check relationships with participants
    let isAlly = false;
    let isOpposition = false;

    for (const pid of participants) {
      if (pid === userId) continue;
      const rel = getRelationship(userId, pid, state);
      if (rel === "friend" || rel === "bestFriend") {
        isAlly = true;
      }
      if (rel === "foe" || rel === "nemesis") {
        isOpposition = true;
      }
    }

    // Also check alliance treaties - if user's alliance has a treaty with a participant's alliance
    if (!isAlly && n.allianceId) {
      const diplomacySystem = window.DiplomacySystem;
      if (diplomacySystem) {
        for (const pid of participants) {
          if (pid === userId) continue;
          const pNation = state.nations?.find((n) => n.id === pid);
          if (pNation?.allianceId && pNation.allianceId !== n.allianceId) {
            // Check if alliances have a treaty
            const key1 = [n.allianceId, pNation.allianceId].sort().join(":");
            const key2 = [pNation.allianceId, n.allianceId].sort().join(":");
            const treaty =
              diplomacySystem.allianceTreaties?.get(key1) ||
              diplomacySystem.allianceTreaties?.get(key2);
            if (treaty && treaty.status === "active") {
              isAlly = true;
              break;
            }
          }
        }
      }
    }

    if (isAlly) {
      allies.push(war);
    } else if (isOpposition) {
      opposition.push(war);
    } else {
      nonTies.push(war);
    }
  }

  return { userActive, allies, opposition, nonTies };
}

/**
 * Apply nation/alliance filter to a list of wars.
 * If filterType is 'nation', only include wars where the nation (or their alliance) participates.
 * If filterType is 'alliance', only include wars where the alliance (or its members) participate.
 */
function filterWarsBySelection(wars, state, filterType, filterValue) {
  if (!filterType || !filterValue) return wars;

  return wars.filter((war) => {
    const participants = getWarParticipants(war, state);

    if (filterType === "nation") {
      // Nation filter: include if the nation or their alliance members participate
      const nation = state.nations?.find((n) => n.id === filterValue);
      if (!nation) return false;
      if (participants.has(filterValue)) return true;
      // Also check if alliance members participate
      if (nation.allianceId) {
        const alliance = state.alliances?.find((a) => a.id === nation.allianceId);
        if (alliance) {
          for (const mid of alliance.members?.keys() || []) {
            if (participants.has(mid)) return true;
          }
          if (alliance.members instanceof Map === false && typeof alliance.members === "object") {
            for (const mid of Object.keys(alliance.members)) {
              if (participants.has(mid)) return true;
            }
          }
        }
      }
      return false;
    }

    if (filterType === "alliance") {
      // Alliance filter: include if any alliance member participates
      const alliance = state.alliances?.find((a) => a.id === filterValue);
      if (!alliance) return false;
      for (const mid of alliance.members?.keys() || []) {
        if (participants.has(mid)) return true;
      }
      if (alliance.members instanceof Map === false && typeof alliance.members === "object") {
        for (const mid of Object.keys(alliance.members)) {
          if (participants.has(mid)) return true;
        }
      }
      return false;
    }

    return true;
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   WAR LISTING (CATEGORIES + FILTERS)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderWarsList(state) {
  const n = state.nation;
  const activeWars = (state.wars || []).filter((w) => w.status !== "ended");
  const categories = categorizeWars(activeWars, state);

  // Apply nation/alliance filter to each category
  const filterType = window.warsFilterType || "none";
  const filterValue = window.warsFilterValue || "";

  const filteredUserActive = filterWarsBySelection(categories.userActive, state, filterType, filterValue);
  const filteredAllies = filterWarsBySelection(categories.allies, state, filterType, filterValue);
  const filteredOpposition = filterWarsBySelection(categories.opposition, state, filterType, filterValue);
  const filteredNonTies = filterWarsBySelection(categories.nonTies, state, filterType, filterValue);

  const heading = `<header class="page-heading"><div><div class="eyebrow">Global Conflict</div><h1>Active Wars</h1><p>All active wars in the world, grouped by your nation's relationships.</p></div>${currentTab !== "help" ? `<button data-help-topic="wars">Help with this page</button>` : badge("Player guide", "good")}</header>`;

  // Filter controls
  const filterBar = `
    <div class="war-filter-bar section">
      <div class="filter-group">
        <label>View</label>
        <div class="filter-chips">
          <button data-action="warFilter" data-war-filter="userActive" class="${window.warsFilter === "userActive" ? "active" : ""}">User's Active (${categories.userActive.length})</button>
          <button data-action="warFilter" data-war-filter="allies" class="${window.warsFilter === "allies" ? "active" : ""}">Allies (${categories.allies.length})</button>
          <button data-action="warFilter" data-war-filter="opposition" class="${window.warsFilter === "opposition" ? "active" : ""}">Opposition (${categories.opposition.length})</button>
          <button data-action="warFilter" data-war-filter="nonTies" class="${window.warsFilter === "nonTies" ? "active" : ""}">Non-Ties (${categories.nonTies.length})</button>
          <button data-action="warFilter" data-war-filter="all" class="${window.warsFilter === "all" ? "active" : ""}">All (${activeWars.length})</button>
        </div>
      </div>
      <div class="filter-group">
        <label>Filter by</label>
        <select data-war-filter-type id="warFilterType">
          <option value="none">None</option>
          <option value="nation">Nation</option>
          <option value="alliance">Alliance</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Select ${window.warsFilterType === "nation" ? "Nation" : window.warsFilterType === "alliance" ? "Alliance" : ""}</label>
        <select id="warFilterValue">
          <option value="">-- Select --</option>
          ${window.warsFilterType === "nation"
            ? state.nations
                .filter((x) => x.id !== n.id)
                .map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`)
                .join("")
            : state.alliances
                .filter((x) => x.id !== n.allianceId)
                .map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`)
                .join("")}
        </select>
      </div>
    </div>
  `;

  const section = (title, rows, icon, filteredRows) => {
    const displayRows = filteredRows.length ? filteredRows : rows;
    if (!displayRows.length) {
      return `<section class="card section"><div class="section-title"><h3>${icon} ${title}</h3></div><p class="muted">No wars in this category.</p></section>`;
    }
    return `
      <section class="card section">
        <div class="section-title"><h3>${icon} ${title} (${displayRows.length})</h3></div>
        <div class="war-list">
          ${displayRows.map((w) => renderWarCard(w, state)).join("")}
        </div>
      </section>
    `;
  };

  return `
    ${heading}
    ${filterBar}
    ${section("User's Active", categories.userActive, "⚔", filteredUserActive)}
    ${section("Allies", categories.allies, "🤝", filteredAllies)}
    ${section("Opposition", categories.opposition, "🆚", filteredOpposition)}
    ${section("Non-Ties", categories.nonTies, "🌍", filteredNonTies)}
  `;
}

function renderWarCard(war, state) {
  const n = state.nation;
  const sides = war.sides || { attacker: [war.attacker], defender: [war.defender] };
  const userSide = getUserSide(war, n.id);
  const isParticipating = userSide !== null;
  const participants = getWarParticipants(war, state);

  // Include spy damage in tug-of-war totals (hidden per-nation)
  const attackerDamage = window.WarModals
    ? window.WarModals.getSideDamageIncludingSpy(war, state, "attacker")
    : Object.values(war.damage || {}).reduce((sum, id) => {
        if (sides.attacker.includes(id)) return sum + (war.damage[id] || 0);
        return sum;
      }, 0);
  const defenderDamage = window.WarModals
    ? window.WarModals.getSideDamageIncludingSpy(war, state, "defender")
    : Object.values(war.damage || {}).reduce((sum, id) => {
        if (sides.defender.includes(id)) return sum + (war.damage[id] || 0);
        return sum;
      }, 0);
  const totalDamage = attackerDamage + defenderDamage;
  const attackerPct = totalDamage > 0 ? Math.round((attackerDamage / totalDamage) * 100) : 50;
  const defenderPct = totalDamage > 0 ? Math.round((defenderDamage / totalDamage) * 100) : 50;

  const attackerNames = sides.attacker.map((id) => nationName(id, state)).join(", ");
  const defenderNames = sides.defender.map((id) => nationName(id, state)).join(", ");

  const statusBadge = war.status === "preparing" ? badge("Preparing", "") : war.status === "active" ? badge("Active", "good") : badge("Ended", "");

  let actionButton = "";
  if (war.status === "active" && isParticipating) {
    const enemySide = userSide === "attacker" ? "defender" : "attacker";
    const enemies = sides[enemySide];
    actionButton = button("View War", "warWatch", { id: war.id }, true, "primary");
  } else if (war.status === "preparing" && !isParticipating && n.allianceId) {
    const canJoin = isAllianceGovernment(n.id, state);
    actionButton = button(canJoin ? "Join War" : "Gov Only", "warJoin", { id: war.id }, canJoin, canJoin ? "primary" : "");
  } else if (war.status === "preparing" && !isParticipating) {
    actionButton = button("Watch", "warWatch", { id: war.id }, true, "");
  } else if (war.status === "active" && !isParticipating) {
    actionButton = button("Watch", "warWatch", { id: war.id }, true, "");
  }

  return `
    <article class="war-card card section" data-war-id="${esc(war.id)}">
      <div class="row spread">
        <div>
          <h4>${esc(nationName(war.attacker, state))} vs ${esc(nationName(war.defender, state))}</h4>
          <p class="muted">${esc(war.reason)}</p>
        </div>
        <div class="war-status">${statusBadge}</div>
      </div>
      <div class="war-meta">
        <span><strong>Round:</strong> ${war.round}</span>
        <span><strong>Participants:</strong> ${participants.size}</span>
        <span><strong>Your side:</strong> ${isParticipating ? human(userSide) : "None"}</span>
        <span><strong>Ends:</strong> <span data-deadline="${war.endsAt}"></span></span>
      </div>
      <div class="tug-of-war">
        <div class="tug-side tug-attacker" style="flex-basis: ${attackerPct}%">
          <div class="tug-label">${esc(nationName(war.attacker, state))}</div>
          <div class="tug-bar-fill" style="width: 100%; background: var(--danger);"></div>
          <div class="tug-value">${number(attackerDamage)} dmg</div>
        </div>
        <div class="tug-center">${attackerPct}% — ${defenderPct}%</div>
        <div class="tug-side tug-defender" style="flex-basis: ${defenderPct}%">
          <div class="tug-label">${esc(nationName(war.defender, state))}</div>
          <div class="tug-bar-fill" style="width: 100%; background: var(--accent);"></div>
          <div class="tug-value">${number(defenderDamage)} dmg</div>
        </div>
      </div>
      <div class="war-sides">
        <div class="war-side">
          <div class="war-side-title">Attackers</div>
          ${sides.attacker.map((id) => {
            const isMe = id === n.id;
            return `<div class="war-side-nation${isMe ? " me" : ""}">${esc(nationName(id, state))}${isMe ? " (You)" : ""} — ${number(war.damage?.[id] || 0)} dmg</div>`;
          }).join("")}
        </div>
        <div class="war-side">
          <div class="war-side-title">Defenders</div>
          ${sides.defender.map((id) => {
            const isMe = id === n.id;
            return `<div class="war-side-nation${isMe ? " me" : ""}">${esc(nationName(id, state))}${isMe ? " (You)" : ""} — ${number(war.damage?.[id] || 0)} dmg</div>`;
          }).join("")}
        </div>
      </div>
      <div class="war-actions">${actionButton}</div>
    </article>
  `;
}

/* ═══════════════════════════════════════════════════════════════════════════
   WAR DETAIL VIEW — DELEGATED TO WarModals
   ════════════════════════════════════════════════════════════════════════════ */

/* The war detail view (tug-of-war, rankings, attack/defend, battle log)
   is rendered by window.WarModals.renderWarDetail() in war-modals.js.
   This keeps wars-tab.js focused on the 4-category listing. */

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN ENTRY POINT
   ════════════════════════════════════════════════════════════════════════════ */

function renderWarsTab(state) {
  if (window.warsCurrentWarId) {
    return window.WarModals
      ? window.WarModals.renderWarDetail(state, window.warsCurrentWarId)
      : `<div class="empty">War detail module not loaded.</div><button data-action="warBack" class="primary section">Back to wars</button>`;
  }
  return renderWarsList(state);
}

function setCurrentWarId(warId) {
  window.warsCurrentWarId = warId || null;
}

function getCurrentWarId() {
  return window.warsCurrentWarId || null;
}

function setStatRank(stat) {
  window.warsStatRank = stat;
}

function getFilterType() {
  return window.warsFilterType || "none";
}

function getFilterValue() {
  return window.warsFilterValue || "";
}

function setFilter(type, value) {
  window.warsFilterType = type;
  window.warsFilterValue = value;
}

function setFilterCategory(category) {
  window.warsFilter = category;
}

export { renderWarsTab, setCurrentWarId, getCurrentWarId, setStatRank, getFilterType, getFilterValue, setFilter, setFilterCategory, categorizeWars, renderWarCard, renderWarsList };

if (typeof window !== "undefined") {
  window.renderWarsTab = renderWarsTab;
  window.WarsTab = { renderWarsTab, setCurrentWarId, getCurrentWarId, setStatRank, getFilterType, getFilterValue, setFilter, setFilterCategory };
}
