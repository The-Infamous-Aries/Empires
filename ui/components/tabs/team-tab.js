"use strict";
/**
 * Team Tab - Sovereignty Epochs
 * Renders the Team tab content with per-sport sub-tabs. Each owned sport shows
 * Stats, Roster, Stadium and Draft sections. Mutating actions are dispatched to
 * game.js via data-action / data-payload buttons (handled by the command() flow).
 *
 * Exports: renderTeamTab(state, activeSport) -> HTML string
 * Sets:    window.TeamTab
 */

/* ═════════════════════════════════════════════════════════════════════════
   LOCAL UI HELPERS
   ═════════════════════════════════════════════════════════════════════════ */

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
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
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(JSON.stringify(data || {}))}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;

const select = (name, items, selected, disabled = false) =>
  `<select name="${esc(name)}" ${disabled ? "disabled" : ""}>${
    Object.entries(items)
      .map(
        ([k, v]) =>
          `<option value="${esc(k)}" ${k === selected ? "selected" : ""}>${esc(typeof v === "object" ? v.name : v)}</option>`,
      )
      .join("")
  }</select>`;

const empty = (message) => `<div class="empty">${esc(message)}</div>`;
const badge = (value, style = "") =>
  `<span class="badge ${style}">${esc(value)}</span>`;

const heading = (title, subtitle, kicker = "Team management") =>
  `<header class="page-heading"><div><div class="eyebrow">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div></header>`;

/* ═════════════════════════════════════════════════════════════════════════
   DATA NORMALIZATION
   ═════════════════════════════════════════════════════════════════════════ */

function icon(group, key) {
  const src = (window.Assets && window.Assets.icon
    ? window.Assets.icon(group, key)
    : null) || (window.UIHelpers && window.UIHelpers.icon
    ? null
    : null);
  if (src) return `<img class="game-icon" src="${esc(src)}" alt="${esc(key)}" width="24" height="24" loading="lazy" decoding="async">`;
  return "";
}

// Server serializes Maps as {$map:[[k,v],...]} or plain arrays of entries.
function normalizeMap(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    if (raw.length && Array.isArray(raw[0])) return raw.map(([, v]) => v);
    return raw;
  }
  if (raw && raw.$map && Array.isArray(raw.$map)) return raw.$map.map(([, v]) => v);
  if (typeof raw === "object") return Object.values(raw);
  return [];
}
function normalizeEntries(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw && raw.$map && Array.isArray(raw.$map)) return raw.$map;
  if (typeof raw === "object") return Object.entries(raw);
  return [];
}

function playerRating(p) {
  if (p.rating != null) return Number(p.rating || 0);
  const vals = Object.values(p.attributes || {});
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
}
function teamAverageRating(players) {
  if (!players.length) return 0;
  return Math.round(players.reduce((s, p) => s + playerRating(p), 0) / players.length);
}

function sportPositions(sport) {
  const cfg = (catalog && catalog.sports && catalog.sports.positions) || {};
  let pos = cfg[sport];
  if (!pos) return [];
  if (sport === "football" && pos.offense && pos.defense)
    return [...pos.offense, ...pos.defense];
  return Array.isArray(pos) ? pos : [pos];
}

function stadiumUpgradeBonus(key, level) {
  const bonuses = {
    Seating: `+${level * 5000} capacity`,
    Gym: `+${Math.round(level * 10)}% skill gain`,
    "Medical Center": `+${Math.round(level * 10)}% injury recovery`,
    "Youth Academy": `+${level} draft skill`,
    "Fan Experience": `+${Math.round(level * 10)}% fans`,
    Concessions: `+${Math.round(level * 10)}% revenue`,
    "Technology Center": `+${Math.round(level * 5)}% fans/XP`,
  };
  return bonuses[key] || `Level ${level}`;
}

/* ═════════════════════════════════════════════════════════════════════════
   RENDER
   ═════════════════════════════════════════════════════════════════════════ */

function renderTeamTab(state, activeSport, catalog) {
  const n = state.nation;
  const s = state.sports || {};
  const own = s.own || {};
  const freeAgents = normalizeMap(s.freeAgents);

  const sportTypes = (catalog && catalog.sports && catalog.sports.types) || [
    "basketball",
    "hockey",
    "soccer",
    "football",
  ];
  const unlockedSports = sportTypes.filter((sp) => !!n.wonders[`${sp}Stadium`]);
  const ownedSports = unlockedSports.filter((sp) => own[sp]);

  if (activeSport && !ownedSports.includes(activeSport)) activeSport = null;
  if (!activeSport && ownedSports.length) activeSport = ownedSports[0];

  const creationCost = catalog && catalog.sports && catalog.sports.creationCost
    ? catalog.sports.creationCost
    : 10000000;

  // No teams yet: show create prompts for unlocked sports.
  if (!ownedSports.length) {
    const createCards = unlockedSports
      .map(
        (sp) =>
          `<section class="card team-create-card"><div class="row spread"><h2>${icon(
            "Sports",
            sp,
          )}${human(sp)}</h2>${badge("Not created", "locked")}</div><p class="muted">Build the ${human(
            sp,
          )} Stadium wonder, then create your club.</p>${form(
            `team-create-${sp}`,
            "teamCreate",
            `<input type="hidden" name="sport" value="${sp}">${input("Club name", "name", "", "text", 'required minlength="3" maxlength="60"')}`,
            `Create club � ${money(creationCost)}`,
            n.money >= creationCost,
          )}</section>`,
      )
      .join("");
    return `${heading("Team Management", "Create and manage your national sports clubs.", "Team management")}<div class="team-sport-tabs">${unlockedSports
      .map(
        (sp) =>
          `<button class="team-sport-tab" data-view="sport" data-value="${esc(sp)}">${icon(
            "Sports",
            sp,
          )}${human(sp)}</button>`,
      )
      .join("")}</div>${createCards}`;
  }

  const sport = activeSport;
  const team = own[sport];
  if (!team) return `${heading("Team Management", "No team found for this sport.", "Team management")}<p class="muted">Select a sport above.</p>`;

  const players = normalizeMap(team.players);
  const rosterEntries = normalizeEntries(team.roster);
  const subsEntries = normalizeEntries(team.subs);
  const rosterMap = new Map(rosterEntries);
  const subsMap = new Map(subsEntries.map(([k, v]) => [k, Array.isArray(v) ? v : [v]]));
  const starterIds = new Set(rosterEntries.map(([, v]) => v).filter(Boolean));
  const subIds = new Set();
  subsMap.forEach((ids) => ids.forEach((id) => subIds.add(id)));

  const positions = sportPositions(sport);
  const avgRating = teamAverageRating(players);
  const stats = team.stats || {};
  const stadium = team.stadium || {};
  const upgradeCosts = team.upgradeCosts || {};

  const eligibleStarters = players.filter((p) => !p.isInjured && !p.isRetired);

  // ── Sport tabs ──────────────────────────────────────────────────────
  const sportTabs = ownedSports
    .map(
      (sp) =>
        `<button class="team-sport-tab ${sp === sport ? "active" : ""}" data-view="sport" data-value="${esc(sp)}">${icon("Sports", sp)}${human(sp)}</button>`,
    )
    .join("");

  // ── Stats section ───────────────────────────────────────────────────
  const totalGames = (stats.wins || 0) + (stats.losses || 0) + (stats.draws || 0);
  const winRate = totalGames === 0 ? 0 : Math.round(((stats.wins || 0) / totalGames) * 100);
  const statsSection = `
    <section class="card team-section">
      <div class="team-section-header"><h2>Stats</h2><span class="team-sport-badge">${human(sport)}</span></div>
      <div class="team-metrics">
        <div class="metric"><small>Overall Ranking (team avg)</small><strong>${avgRating}</strong><p class="muted">Averaged player skill across roster</p></div>
        <div class="metric"><small>Fans</small><strong>${number(team.fans || 0)}</strong><p class="muted">Team fanbase</p></div>
        <div class="metric"><small>Win Rate</small><strong>${winRate}%</strong><p class="muted">${(stats.wins || 0)} W / ${(stats.losses || 0)} L / ${(stats.draws || 0)} D</p></div>
        <div class="metric"><small>Championships</small><strong>${(stats.championships || 0)}</strong><p class="muted">League titles won</p></div>
      </div>
      <div class="team-stat-rows">
        <div class="row"><strong>Season Wins</strong><span>${(stats.wins || 0)}</span><strong>Season Losses</strong><span>${(stats.losses || 0)}</span></div>
        <div class="row"><strong>Tournament Wins</strong><span>${(stats.tournamentsWon || 0)} / ${(stats.tournamentsEntered || 0)} entered</span><strong>World Tournaments Won</strong><span>${(stats.worldTournamentsWon || 0)} / ${(stats.worldTournamentsEntered || 0)} entered</span></div>
        <div class="row"><strong>Playoff Appearances</strong><span>${(stats.playoffAppearances || 0)}</span><strong>Total Injuries</strong><span>${(stats.totalInjuries || 0)}</span></div>
        <div class="row"><strong>Season</strong><span>${(team.currentSeason || 1)}</span><strong>Week</strong><span>${(team.currentWeek || 1)}</span></div>
      </div>
    </section>`;

  // ── Roster section ──────────────────────────────────────────────────
  const lineupGrid = positions
    .map(
      (position, idx) => {
        const currentId = rosterMap.get(position);
        const currentPlayer = currentId ? players.find((p) => p.id === currentId) : null;
        const options = {};
        eligibleStarters
          .filter((p) => p.position === position || (sport === "football" && p.footballPosition && (p.footballPosition.offense === position || p.footballPosition.defense === position)))
          .forEach((p) => {
            options[p.id] = `${esc(p.name)} ${playerRating(p) ? "� " + playerRating(p) : ""}`;
          });
        return `<div class="lineup-slot"><label>${esc(position)}</label>${select(`starter-${sport}-${idx}`, options, currentId || "", false)}${button("Set Starter", "teamStarter", { sport, slot: idx, playerId: currentId || "" }, Object.keys(options).length > 0)}</div>`;
      },
    )
    .join("");

  const subsGrid = positions
    .map(
      (position) => {
        const ids = subsMap.get(position) || [];
        const chips = ids
          .map(
            (id) => {
              const p = players.find((x) => x.id === id);
              return `<span class="sub-chip">${esc(p ? p.name : id)}<button data-action="teamSetSub" data-payload="${esc(JSON.stringify({ sport, position, playerId: id, add: false }))}">�</button></span>`;
            },
          )
          .join("");
        const bench = eligibleStarters.filter((p) => !starterIds.has(p.id) && !subIds.has(p.id) && (p.position === position || (sport === "football" && p.footballPosition && (p.footballPosition.offense === position || p.footballPosition.defense === position))));
        const opts = {};
        bench.forEach((p) => (opts[p.id] = esc(p.name)));
        return `<div class="lineup-slot"><label>${esc(position)} Subs</label>${chips || '<span class="muted">None</span>'}${select(`sub-${sport}-${position.replace(/\s+/g,"_")}`, opts, "", false)}${button("Add Sub", "teamSetSub", { sport, position, playerId: "", add: true }, !!Object.keys(opts).length)}</div>`;
      },
    )
    .join("");

  const playerRows = players
    .map(
      (p) => {
        const isStarter = starterIds.has(p.id);
        const isSub = subIds.has(p.id);
        const status = p.isRetired
          ? "Retired"
          : p.isInjured
            ? `Injured (${p.injuryDaysLeft || 0}d)`
            : isStarter
              ? "Starter"
              : isSub
                ? "Sub"
                : "Bench";
        const statusClass = p.isRetired ? "bad" : p.isInjured ? "bad" : isStarter ? "good" : "";
        const rating = playerRating(p);
        return `<tr>
          <td>${icon("Sports", p.sport)}${esc(p.name)}<br><small>${esc(p.position)}</small></td>
          <td>${rating}</td>
          <td>${p.age}</td>
          <td>${money(p.salary || 0)}</td>
          <td>${(p.contractSeasonsRemaining || 0)} seasons left</td>
          <td><span class="badge ${statusClass}">${esc(status)}</span></td>
          <td class="actions">
            ${button("View", "openTeamPlayer", { sport, playerId: p.id }, true)}
            ${button("Train", "openTeamPlayer", { sport, playerId: p.id, tab: "train" }, true)}
            ${button("Extend", "openTeamPlayer", { sport, playerId: p.id, tab: "contract" }, p.contractSeasonsRemaining <= 2)}
            ${button("Release", "teamRelease", { sport, playerId: p.id }, players.length > positions.length, "danger")}
          </td>
        </tr>`;
    },
    )
    .join("");

  const rosterSection = `
    <section class="card team-section">
      <div class="team-section-header"><h2>Roster</h2><span class="team-sport-badge">${players.length} players</span></div>
      <h3>Starting Lineup</h3>
      <div class="lineup">${lineupGrid}</div>
      <h3>Substitutes</h3>
      <div class="lineup">${subsGrid}</div>
      <div class="table-wrap"><table><thead><tr><th>Player</th><th>Rating</th><th>Age</th><th>Salary</th><th>Contract</th><th>Status</th><th>Actions</th></tr></thead><tbody>${playerRows || '<tr><td colspan="7" class="muted">No players on roster. Use Draft to sign free agents.</td></tr>'}</tbody></table></div>
    </section>`;

  // ── Stadium section ─────────────────────────────────────────────────
  const upgradeTypes = (catalog && catalog.sports && catalog.sports.upgrades) || [
    "Seating",
    "Gym",
    "Medical Center",
    "Youth Academy",
    "Fan Experience",
    "Concessions",
    "Technology Center",
  ];
  const stadiumRows = upgradeTypes
    .map(
      (key) => {
        const level = stadium[key] || 0;
        const cost = upgradeCosts[key];
        const canUpgrade = level < 10 && n.money >= (cost || 0);
        return `<article class="stadium-card"><div class="stadium-head"><h3>${esc(key)}</h3><span class="badge">Lv ${level}/10</span></div><p class="muted">${stadiumUpgradeBonus(key, level)}</p><p class="muted">Capacity: ${number(team.stadiumCapacity || 0)}</p>${button(`Upgrade � ${money(cost || 0)}`, "teamUpgrade", { sport, upgradeType: key }, canUpgrade)}</article>`;
      },
    )
    .join("");

  const stadiumSection = `
    <section class="card team-section">
      <div class="team-section-header"><h2>Stadium</h2><span class="team-sport-badge">Facilities</span></div>
      <p class="muted">Upgrade stadium facilities using nation funds. Technology Center requires nation technology.</p>
      <div class="grid section">${stadiumRows}</div>
    </section>`;

  // ── Draft section ───────────────────────────────────────────────────
  const sportFreeAgents = freeAgents.filter((p) => p.sport === sport);
  const draftSection = `
    <section class="card team-section draft-section">
      <div class="team-section-header"><h2>Draft</h2><span class="team-sport-badge">${sportFreeAgents.length} free agents</span></div>
      <p class="muted">Browse free agents for ${human(sport)} and draft them to your team (player salary deducted from national treasury).</p>
      ${button("Open Draft", "openTeamDraft", { sport }, sportFreeAgents.length > 0)}
    </section>`;

  return `${heading("Team Management", "Manage your squads, facilities, and draft players across your sports clubs.", "Team management")}<div class="team-sport-tabs">${sportTabs}</div>${statsSection}${rosterSection}${stadiumSection}${draftSection}`;
}

function form(id, action, fields, label = "Save", enabled = true, extra = "") {
  return `<form id="${esc(id)}" data-command="${esc(action)}" data-allowed="${!!enabled}" ${extra}><div class="form-stack">${fields}</div><div class="form-footer"><button class="primary" ${enabled ? "" : "disabled"}>${esc(label)}</button></div></form>`;
}

function input(label, name, value = "", type = "text", extra = "") {
  return `<label>${esc(label)}<input name="${esc(name)}" type="${type}" value="${esc(value)}" ${extra}></label>`;
}

window.TeamTab = { render: renderTeamTab };
