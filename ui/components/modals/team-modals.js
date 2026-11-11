"use strict";
/**
 * Team Modals - Popup modals for the Team tab
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * All modals are pure HTML generators. They receive state and return HTML
 * strings rendered inside <dialog id="nation-dialog"> by game.js.
 *
 * Exports (window.TeamModals):
 *   teamDraftModalContent(state, sport)
 *   teamPlayerModalContent(state, sport, playerId)
 *   teamStadiumModalContent(state, sport)
 */

/* ═════════════════════════════════════════════════════════════════════════
   HELPERS
   ═════════════════════════════════════════════════════════════════════════ */

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const number = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const money = (v) => "$" + number(v);
const human = (s) =>
  String(s)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

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

const icon = (group, key) => {
  const src =
    (window.Assets && window.Assets.icon && window.Assets.icon(group, key)) ||
    "";
  if (src) return `<img class="game-icon" src="${esc(src)}" alt="${esc(key)}" width="24" height="24" loading="lazy" decoding="async">`;
  return "";
};

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

function playerRating(p) {
  if (p.rating != null) return Number(p.rating || 0);
  const vals = Object.values(p.attributes || {});
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
}

function trainingCost(player, attribute, team) {
  const current = Number(player.attributes?.[attribute] || 0);
  const base = 50000;
  const scaling = Math.pow(1.2, Math.floor(current / 10));
  let cost = Math.floor(base * scaling);
  const gym = team?.stadium?.gym || 0;
  cost = Math.floor(cost * (1 - gym * 0.05));
  return Math.max(cost, 0);
}

function contractCost(player) {
  const avgAttr =
    Object.values(player.attributes || {}).reduce((a, b) => a + b, 0) /
    Object.values(player.attributes || {}).length;
  const skillBase = Math.floor(avgAttr * 100000);
  const potentialBonus = Math.floor((player.potential - 50) * 50000);
  let happinessModifier = 1;
  const morale = player.morale || 70;
  if (morale >= 80) happinessModifier = 0.8;
  else if (morale >= 60) happinessModifier = 0.9;
  else if (morale <= 40) happinessModifier = 1.5;
  else happinessModifier = 1.2;
  return Math.max(Math.floor((skillBase + potentialBonus) * happinessModifier), 100000);
}

/* ═════════════════════════════════════════════════════════════════════════
   DRAFT MODAL — free agents for a sport
   ═════════════════════════════════════════════════════════════════════════ */

function teamDraftModalContent(state, sport, catalog) {
  const n = state.nation;
  const s = state.sports || {};
  const freeAgents = normalizeMap(s.freeAgents).filter((p) => p.sport === sport);
  const team = (s.own || {})[sport];
  const rosterSize = team ? (team.players && team.players.length ? team.players.length : 0) : 0;

  const playersHtml = freeAgents
    .map(
      (p) => {
        const rating = playerRating(p);
        const attrs = Object.entries(p.attributes || {})
          .map(([a, v]) => `<span class="attr">${human(a)} ${v}</span>`)
          .join("");
        const canDraft = rosterSize < 40 && n.money >= (p.salary || 0);
        return `<article class="draft-player-card"><div class="draft-player-head"><div><h3>${icon("Sports", sport)}${esc(p.name)}</h3><p class="muted">${esc(p.position)} � ${human(p.demographic)} � Age ${p.age}</p></div><span class="badge">Rating ${rating}</span></div><div class="draft-player-body">${attrs}<p class="muted">Contract: ${(p.contractSeasons || 1)} season(s) � Salary: ${money(p.salary || 0)} per season</p>${p.traits && p.traits.length ? `<p class="muted">Traits: ${p.traits.map((t) => esc(t)).join(", ")}</p>` : ""}</div><div class="draft-player-foot">${button(`Draft � ${money(p.salary || 0)}`, "teamDraft", { sport, playerId: p.id }, canDraft)}</div></article>`;
    })
    .join("") ||
    '<p class="muted">No free agents available for this sport right now.</p>';

  return `<form method="dialog"><div class="modal-eyebrow">Player Draft</div><h2 id="nation-dialog-title">${human(sport)} Draft</h2><p class="muted">Sign free agents to your team. The player's salary is deducted from your national treasury. Max roster: 40 players.</p>${team ? `<p class="muted">Current roster: ${rosterSize} / 40 players</p>` : ""}<div class="modal-body draft-grid">${playersHtml}</div><div class="row dialog-actions"><button value="close" autofocus>Close</button></div></form>`;
}

/* ═════════════════════════════════════════════════════════════════════════
   PLAYER MODAL — profile / train / contract
   ═════════════════════════════════════════════════════════════════════════ */

function teamPlayerModalContent(state, sport, playerId, catalog) {
  const n = state.nation;
  const s = state.sports || {};
  const team = (s.own || {})[sport];
  const players = normalizeMap(team ? team.players : null);
  const p = players.find((x) => x.id === playerId);
  if (!p) return `<form method="dialog"><div class="modal-eyebrow">Player</div><h2 id="nation-dialog-title">Player not found</h2><p class="muted">This player is no longer on your team.</p><div class="row dialog-actions"><button value="close" autofocus>Close</button></div></form>`;

  const tab = window.teamPlayerTab || "profile";
  const rating = playerRating(p);
  const isInjured = p.isInjured;
  const isRetired = p.isRetired;

  const attrsHtml = Object.entries(p.attributes || {})
    .map(
      ([a, v]) => {
        const atPotential = Number(v) >= Number(p.potential || 99);
        const cost = trainingCost(p, a, team);
        const affordable = n.money >= cost && !atPotential;
        return `<span class="attr-row"><span>${human(a)}</span><strong>${v}</strong>${atPotential ? `<span class="badge">at potential</span>` : ""}${button("Train", "teamTrain", { sport, playerId: p.id, attribute: a }, affordable && !isInjured && !isRetired)}</span>`;
      },
    )
    .join("");

  const career = p.careerStats || {};
  const careerHtml = Object.entries(career)
    .map(([k, v]) => `<span class="stat-chip">${human(k)} ${number(v)}</span>`)
    .join("") || '<span class="muted">None yet</span>';

  const traitsHtml = (p.traits || [])
    .map((t) => `<span class="trait-chip">${esc(t)}</span>`)
    .join("") || '<span class="muted">None</span>';

  const contractSeasonsRemaining = p.contractSeasonsRemaining || 0;
  const perSeason = contractCost(p);

  const tabButtons = ["profile", "train", "contract"]
    .map(
      (t) =>
        `<button class="modal-tab ${t === tab ? "active" : ""}" data-action="openTeamPlayer" data-payload="${esc(JSON.stringify({ sport, playerId: p.id, tab: t }))}">${human(t)}</button>`,
    )
    .join("");

  let body = "";
  if (tab === "profile") {
    body = `<div class="player-profile"><div class="player-attr-grid">${attrsHtml}</div><div class="player-meta"><p><strong>Traits:</strong> ${traitsHtml}</p><p><strong>Career:</strong> ${careerHtml}</p><p><strong>Morale:</strong> ${p.morale || 70} � <strong>Level:</strong> ${p.level || 1} � <strong>XP:</strong> ${p.xp || 0}</p><p><strong>Games Played:</strong> ${p.gamesPlayed || 0} � <strong>Demographic:</strong> ${human(p.demographic)} � <strong>Potential:</strong> ${p.potential}</p>${isInjured ? `<p class="muted"><strong>Injured:</strong> ${p.injuryType || "Injury"} (${p.injuryDaysLeft || 0} days left)</p>` : ""}${isRetired ? '<p class="muted"><strong>Retired</strong></p>' : ""}</div></div>`;
  } else if (tab === "train") {
    body = `<div class="player-train"><p class="muted">Train an attribute using nation funds. Cost rises with attribute level; Gym upgrades reduce cost.</p>${attrsHtml || '<p class="muted">No trainable attributes.</p>'}</div>`;
  } else if (tab === "contract") {
    const maxSeasons = 5;
    const seasonButtons = [];
    for (let i = 1; i <= maxSeasons; i++) {
      const total = perSeason * i;
      seasonButtons.push(button(`Extend ${i} season(s) � ${money(total)}`, "teamExtendContract", { sport, playerId: p.id, seasons: i }, n.money >= total && !isRetired && contractSeasonsRemaining + i <= maxSeasons));
    }
    body = `<div class="player-contract"><p><strong>Seasons remaining:</strong> ${contractSeasonsRemaining}</p><p><strong>Cost per season:</strong> ${money(perSeason)}</p><div class="team-modal-actions">${seasonButtons.join("")}</div><p class="muted">Extending adds seasons to the player's contract. Cost is deducted from your national treasury.</p></div>`;
  }

  const statusBadges = [];
  if (isRetired) statusBadges.push('<span class="badge">Retired</span>');
  if (isInjured) statusBadges.push('<span class="badge">Injured</span>');

  return `<form method="dialog"><div class="modal-eyebrow">Player Management</div><h2 id="nation-dialog-title">${esc(p.name)}</h2><p class="muted">${icon("Sports", sport)}${human(p.position)} � ${human(sport)} ${statusBadges.join(" ")}</p><div class="modal-tabs">${tabButtons}</div><div class="modal-body">${body}</div><div class="team-modal-actions"><button value="close">Close</button>${!isRetired ? button("Release", "teamRelease", { sport, playerId: p.id }, true, "danger") : ""}</div></form>`;
}

/* ═════════════════════════════════════════════════════════════════════════
   STADIUM MODAL — facility upgrades
   ═════════════════════════════════════════════════════════════════════════ */

function teamStadiumModalContent(state, sport, catalog) {
  const n = state.nation;
  const s = state.sports || {};
  const team = (s.own || {})[sport];
  const stadium = team ? team.stadium : {};
  const upgradeCosts = team ? team.upgradeCosts : {};
  const capacity = team ? team.stadiumCapacity : 0;

  const upgradeTypes = (catalog && catalog.sports && catalog.sports.upgrades) || [
    "Seating",
    "Gym",
    "Medical Center",
    "Youth Academy",
    "Fan Experience",
    "Concessions",
    "Technology Center",
  ];

  const rows = upgradeTypes
    .map(
      (key) => {
        const level = stadium[key] || 0;
        const cost = upgradeCosts[key] || 0;
        const can = level < 10 && n.money >= cost;
        const techReq = key === "Technology Center" ? ` (requires ${(level + 1) * 100} nation tech)` : "";
        return `<article class="stadium-card"><div class="stadium-head"><h3>${esc(key)}</h3><span class="badge">Lv ${level}/10</span></div><p class="muted">${level === 10 ? "Maximum level reached" : `Upgrade cost: ${money(cost)}${techReq}`}</p>${button(`Upgrade � ${money(cost)}`, "teamUpgrade", { sport, upgradeType: key }, can && level < 10)}</article>`;
      },
    )
    .join("");

  return `<form method="dialog"><div class="modal-eyebrow">Stadium Upgrades</div><h2 id="nation-dialog-title">${human(sport)} Stadium</h2><p class="muted">Capacity: ${number(capacity)}. Upgrade facilities using nation funds.</p><div class="modal-body"><div class="grid section">${rows}</div></div><div class="row dialog-actions"><button value="close" autofocus>Close</button></div></form>`;
}

window.TeamModals = {
  teamDraftModalContent,
  teamPlayerModalContent,
  teamStadiumModalContent,
};
