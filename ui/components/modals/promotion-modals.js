"use strict";
/**
 * Promotion Modals - Popup modals for the Promotion tab
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * All modals are pure HTML generators. They receive state and return HTML
 * strings rendered inside <dialog id="nation-dialog"> by game.js.
 *
 * Exports (window.PromotionModals):
 *   promotionTicketPriceModalContent(state, catalog)
 *   promotionDraftModalContent(state, catalog)
 *   promotionBookMatchModalContent(state, catalog, roster, bookedIds)
 *   promotionWrestlerModalContent(state, wrestlerId, tab)
 *   promotionMassPpvModalContent(state, catalog)
 */

"use strict";

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

function icon(group, key) {
  const src =
    (window.Assets && window.Assets.icon && window.Assets.icon(group, key)) ||
    null;
  if (src) return `<img class="game-icon" src="${esc(src)}" alt="${esc(key)}" width="24" height="24" loading="lazy" decoding="async">`;
  return "";
}

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

const MATCH_TYPES = ["singles", "tagteam", "trickytrio", "fatalfour"];
const STIPULATIONS = [
  "1fall", "2of3falls", "insanity", "ladder", "table", "cage",
  "deathmatch", "firstblood", "lastmanstanding", "ironman",
  "submissiononly", "knockout", "nocountout", "nodq",
];
const MATCH_TYPE_ICONS = {
  singles: "wrestling-singles",
  tagteam: "wrestling-tagteam",
  trickytrio: "wrestling-trickytrio",
  fatalfour: "wrestling-fatalfour",
};
const STIPULATION_ICONS = {
  "1fall": "wrestling-1fall",
  "2of3falls": "wrestling-2of3falls",
  insanity: "wrestling-insanity",
  ladder: "wrestling-ladder",
  table: "wrestling-table",
  cage: "wrestling-cage",
  deathmatch: "wrestling-deathmatch",
  firstblood: "wrestling-firstblood",
  lastmanstanding: "wrestling-lastmanstanding",
  ironman: "wrestling-ironman",
  submissiononly: "wrestling-submissiononly",
  knockout: "wrestling-knockout",
  nocountout: "wrestling-nocountout",
  nodq: "wrestling-nodq",
};

function form(id, action, fields, label = "Save", enabled = true, extra = "") {
  return `<form id="${esc(id)}" data-command="${esc(action)}" data-allowed="${!!enabled}" ${extra}><div class="form-stack">${fields}</div><div class="form-footer"><button class="primary" ${enabled ? "" : "disabled"}>${esc(label)}</button></div></form>`;
}

function input(label, name, value = "", type = "text", extra = "") {
  return `<label>${esc(label)}<input name="${esc(name)}" type="${type}" value="${esc(value)}" ${extra}></label>`;
}

const TITLE_NAMES = {
  insanity: "Insanity Championship",
  womensMidCard: "Women's Mid-Card Championship",
  mensMidCard: "Men's Mid-Card Championship",
  womensTagTeam: "Women's Tag-Team Championship",
  mensTagTeam: "Men's Tag-Team Championship",
  womensWorld: "Women's World Championship",
  mensWorld: "Men's World Championship",
};

/* ═════════════════════════════════════════════════════════════════════════════
   TICKET PRICE MODAL
   ═════════════════════════════════════════════════════════════════════════════ */

function promotionTicketPriceModalContent(state, catalog) {
  const n = state.nation;
  const w = state.wrestling || {};
  const promotion = w.promotion || null;
  if (!promotion) {
    return `<form method="dialog"><div class="modal-eyebrow">Ticket Prices</div><h2 id="nation-dialog-title">No Promotion</h2><p class="muted">Create a promotion first.</p><div class="row dialog-actions"><button value="close" autofocus>Close</button></div></form>`;
  }
  const tp = promotion.ticketPrice || { weekly: 25, monthlyPPV: 50 };
  return `<form method="dialog" id="promotion-ticket-price-form" data-command="wrestlingSetTicketPrice"><div class="modal-eyebrow">Ticket Prices</div><h2 id="nation-dialog-title">${esc(promotion.name)} Ticket Prices</h2><p class="muted">Set ticket prices for weekly shows and monthly PPVs.</p><div class="modal-body"><div class="form-stack">${input("Weekly Show Price ($)", "weekly", tp.weekly || 25, "number", 'min="1" max="500" required')}${input("Monthly PPV Price ($)", "monthlyPPV", tp.monthlyPPV || 50, "number", 'min="1" max="500" required')}</div></div><div class="row dialog-actions"><button value="close">Close</button><button class="primary" data-save-ticket-price>Save Prices</button></div></form>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   DRAFT MODAL — wrestling free agents (matching sports draft board layout)
   ═════════════════════════════════════════════════════════════════════════════ */

function promotionDraftModalContent(state, catalog) {
  const n = state.nation;
  const s = state.sports || {};
  const draftBoardEntry = (s.draftBoards || []).find(([key]) => key === "wrestling");
  const draftBoard = draftBoardEntry ? normalizeMap(draftBoardEntry[1]) : [];
  const promotion = (state.wrestling || {}).promotion || null;
  const rosterSize = promotion ? Object.keys(promotion.roster || {}).length : 0;

  const playersHtml = (draftBoard || [])
    .map(
      (p) => {
        const rating =
          ((p.strength || 0) + (p.agility || 0) + (p.endurance || 0) + (p.charisma || 0)) / 4;
        const canDraft = n.money >= (p.salary || 0);
        return `<article class="draft-player-card"><div class="draft-player-head"><div><h3>${icon("Wrestling", "wrestler-brawler")}${esc(p.name)}</h3><p class="muted">${esc(p.gender)} • ${human(p.wrestlerType || "brawler")} • Age ${p.age}</p></div><span class="badge">Rating ${rating.toFixed(1)}</span></div><div class="draft-player-body"><span class="promotion-stat-chip">STR ${p.strength || 0}</span><span class="promotion-stat-chip">AGI ${p.agility || 0}</span><span class="promotion-stat-chip">END ${p.endurance || 0}</span><span class="promotion-stat-chip">CHA ${p.charisma || 0}</span><p class="muted">Contract: ${p.contractWeeksRemaining || 4} weeks • Salary: ${money(p.salary || 0)}/week</p>${p.featuredMatch ? `<p class="muted">Featured: ${human(p.featuredMatch.matchType)} / ${human(p.featuredMatch.stipulation)}</p>` : ""}</div><div class="draft-player-foot">${button(`Draft • ${money(p.salary || 0)}`, "wrestlingDraftWrestler", { playerId: p.id }, canDraft)}</div></article>`;
      },
    )
    .join("") ||
    '<p class="muted">No wrestlers available on the draft board right now.</p>';

  return `<form method="dialog"><div class="modal-eyebrow">Wrestler Draft</div><h2 id="nation-dialog-title">Wrestling Draft</h2><p class="muted">Sign free agent wrestlers to your promotion. Salary is deducted weekly from your national treasury. Current roster: ${rosterSize} wrestlers.</p><div class="modal-body promotion-draft-grid">${playersHtml}</div><div class="row dialog-actions"><button value="close" autofocus>Close</button></div></form>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   BOOK MATCH MODAL
   ═════════════════════════════════════════════════════════════════════════════ */

function promotionBookMatchModalContent(state, catalog, availableWrestlers) {
  const n = state.nation;
  const w = state.wrestling || {};
  const promotion = w.promotion || null;
  if (!promotion) {
    return `<form method="dialog"><div class="modal-eyebrow">Book Match</div><h2 id="nation-dialog-title">No Promotion</h2><p class="muted">Create a promotion first.</p><div class="row dialog-actions"><button value="close" autofocus>Close</button></div></form>`;
  }
  const available = availableWrestlers || [];
  const wrestlerOptions = {};
  available.forEach((w) => {
    wrestlerOptions[w.id] = `${esc(w.name)} (${human(w.wrestlerType)}, STR ${w.strength || 0} / AGI ${w.agility || 0})`;
  });
  const titleOptions = {};
  (["insanity", "womensMidCard", "mensMidCard", "womensTagTeam", "mensTagTeam", "womensWorld", "mensWorld"]).forEach((k) => {
    const t = (promotion.championships && promotion.championships.titles && promotion.championships.titles[k]) || null;
    if (t && t.unlocked) {
      titleOptions[k] = esc(TITLE_NAMES[k] || k) + (t.championId ? ` (Champion: ${t.championName})` : " (Vacant)");
    }
  });

  return `<form method="dialog" id="promotion-book-match-form" data-command="wrestlingBookMatch"><div class="modal-eyebrow">Book Match</div><h2 id="nation-dialog-title">Book Weekly Show Match</h2><p class="muted">Select match type, stipulation, title (if title match), and participants (max 2 per side for tag team).</p><div class="modal-body"><div class="form-stack">${input("Match Name (optional)", "matchName", "", "text")}${select("Match Type", "matchType", Object.fromEntries(MATCH_TYPES.map(mt => [mt, human(mt)])), "singles")}${select("Stipulation", "stipulation", Object.fromEntries(STIPULATIONS.map(st => [st, human(st)])), "1fall")}${select("Title Match (optional)", "titleKey", { "": "None", ...titleOptions }, "")}<label>Participants (select 2-4 wrestlers)</label><select name="participantIds" multiple size="6">${Object.entries(wrestlerOptions).map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`).join("") || '<option disabled>No available wrestlers</option>'}</select></div></div><div class="row dialog-actions"><button value="close">Close</button><button class="primary" data-save-book-match>Book Match</button></div></form>`;
}

function promotionWrestlerModalContent(state, wrestlerId, tab) {
  const w = state.wrestling || {};
  const n = state.nation;
  const wrestlers = normalizeMap(w.roster) || [];
  const p = wrestlers.find((x) => x.id === wrestlerId);
  if (!p) {
    return `<form method="dialog"><div class="modal-eyebrow">Wrestler</div><h2 id="nation-dialog-title">Wrestler Not Found</h2><p class="muted">This wrestler is no longer available.</p><div class="row dialog-actions"><button value="close" autofocus>Close</button></div></form>`;
  }
  const tabKey = tab || "profile";
  const rating = ((p.strength || 0) + (p.agility || 0) + (p.endurance || 0) + (p.charisma || 0)) / 4;
  const isInjured = p.isInjured;
  const isRetired = p.isRetired;

  const attrsHtml = [
    { key: "strength", label: "Strength" },
    { key: "agility", label: "Agility" },
    { key: "endurance", label: "Endurance" },
    { key: "charisma", label: "Charisma" },
  ]
    .map(
      (a) => {
        const atPotential = Number(p[a.key] || 0) >= Number(p.potential || 99);
        return `<span class="attr-row"><span>${a.label}</span><strong>${p[a.key] || 0}</strong>${atPotential ? `<span class="badge">at potential</span>` : ""}</span>`;
      },
    )
    .join("");

  const tabButtons = ["profile", "train", "contract", "featured", "moves"]
    .map(
      (t) =>
        `<button class="modal-tab ${t === tabKey ? "active" : ""}" data-action="openPromotionWrestler" data-payload="${esc(JSON.stringify({ wrestlerId: p.id, tab: t }))}">${human(t)}</button>`,
    )
    .join("");

  let body = "";
  if (tabKey === "profile") {
    body = `<div class="player-profile"><div class="player-attr-grid">${attrsHtml}</div><div class="player-meta"><p><strong>Type:</strong> ${human(p.wrestlerType)} • <strong>Gender:</strong> ${esc(p.gender)}</p><p><strong>Alignment:</strong> ${esc(p.alignment)} • <strong>Gimmick:</strong> ${esc(p.gimmick)}</p><p><strong>Morale:</strong> ${p.morale || 70} • <strong>Happiness:</strong> ${p.happiness || 70}</p><p><strong>Level:</strong> ${p.level || 1} • <strong>Potential:</strong> ${p.potential || 50}</p><p><strong>Record:</strong> ${p.wins || 0}W / ${p.losses || 0}L • <strong>Matches:</strong> ${p.matchesWrestled || 0}</p><p><strong>Personal Fans:</strong> ${number(p.personalFans || 0)}</p><p><strong>Contract:</strong> ${p.contractWeeksRemaining || 0} weeks remaining • <strong>Salary:</strong> ${money(p.salary || 0)}/week</p>${isInjured ? `<p class="muted"><strong>Injured:</strong> ${esc(p.injuryType || "Injury")} (${p.injuryWeeksLeft || 0} weeks left)</p>` : ""}${isRetired ? '<p class="muted"><strong>Retired</strong></p>' : ""}</div></div>`;
  } else if (tabKey === "train") {
    const attrs = ["strength", "agility", "endurance", "charisma"].map(
      (attr) => {
        const current = p[attr] || 0;
        const potential = p.potential || 50;
        const atPotential = current >= potential;
        const cost = Math.floor(50000 * Math.pow(1.2, Math.floor(current / 10)));
        const affordable = n.money >= cost && !atPotential && !isInjured && !isRetired;
        return `<span class="attr-row"><span>${human(attr)}</span><strong>${current}</strong>${atPotential ? `<span class="badge">at potential</span>` : ""}${button("Train", "wrestlingTrainWrestler", { wrestlerId: p.id, attribute: attr }, affordable && !atPotential && !isInjured && !isRetired)}</span>`;
      },
    ).join("");
    body = `<div class="player-train"><p class="muted">Train an attribute using nation funds. Cost rises with attribute level. Cannot exceed potential.</p>${attrs || '<p class="muted">No trainable attributes.</p>'}</div>`;
  } else if (tabKey === "contract") {
    const weeksRemaining = p.contractWeeksRemaining || 0;
    const perWeek = p.salary || 0;
    const seasonButtons = [];
    for (let i = 1; i <= 52; i += 4) {
      const total = perWeek * i;
      seasonButtons.push(button(`Extend ${i} week(s) • ${money(total)}`, "wrestlingExtendContract", { wrestlerId: p.id, weeks: i }, n.money >= total && !isRetired && weeksRemaining + i <= 52));
    }
    body = `<div class="player-contract"><p><strong>Weeks remaining:</strong> ${weeksRemaining}</p><p><strong>Salary per week:</strong> ${money(perWeek)}</p><div class="promotion-modal-actions">${seasonButtons.join("")}</div><p class="muted">Extending adds weeks to the wrestler's contract. Cost is deducted from your national treasury.</p></div>`;
  } else if (tabKey === "featured") {
    body = `<div class="player-train"><p class="muted">Set the wrestler's featured match type and stipulation. Wrestlers perform better in their featured match.</p><div class="form-stack">${select("Match Type", "matchType", Object.fromEntries(MATCH_TYPES.map(mt => [mt, human(mt)])), (p.featuredMatch && p.featuredMatch.matchType) || "singles")}${select("Stipulation", "stipulation", Object.fromEntries(STIPULATIONS.map(st => [st, human(st)])), (p.featuredMatch && p.featuredMatch.stipulation) || "1fall")}</div></div><div class="row dialog-actions"><button value="close">Close</button><button class="primary" data-save-featured-match>Set Featured Match</button></div></form>`;
    // Return early since we already have the dialog-actions
    return `<form method="dialog" id="promotion-featured-match-form" data-command="wrestlingChangeFeaturedMatch"><div class="modal-eyebrow">Featured Match</div><h2 id="nation-dialog-title">${esc(p.name)}</h2><p class="muted">Set featured match type and stipulation for ${esc(p.name)}.</p><div class="modal-body"><input type="hidden" name="wrestlerId" value="${esc(p.id)}">${select("Match Type", "matchType", Object.fromEntries(MATCH_TYPES.map(mt => [mt, human(mt)])), (p.featuredMatch && p.featuredMatch.matchType) || "singles")}${select("Stipulation", "stipulation", Object.fromEntries(STIPULATIONS.map(st => [st, human(st)])), (p.featuredMatch && p.featuredMatch.stipulation) || "1fall")}</div><div class="row dialog-actions"><button value="close">Close</button><button class="primary">Set Featured Match</button></div></form>`;
  } else if (tabKey === "moves") {
    const sigOptions = {};
    const finOptions = {};
    // Move data would come from server endpoint; for now show current moves
    if (p.signatureMove) sigOptions[p.signatureMove.id] = `${esc(p.signatureMove.name)} (current)`;
    if (p.finisherMove) finOptions[p.finisherMove.id] = `${esc(p.finisherMove.name)} (current)`;
    body = `<div class="player-train"><p class="muted">Set signature move, finisher move, and move set for ${esc(p.name)}.</p><div class="form-stack"><label>Signature Move</label><select name="signatureMoveId">${Object.entries(sigOptions).map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`).join("") || '<option>No signature move set</option>'}</select><label>Finisher Move</label><select name="finisherMoveId">${Object.entries(finOptions).map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`).join("") || '<option>No finisher move set</option>'}</select></div><p class="muted">Move data is managed server-side. Signature and finisher moves are assigned during wrestler creation.</p></div>`;
  }

  const statusBadges = [];
  if (isRetired) statusBadges.push('<span class="badge">Retired</span>');
  if (isInjured) statusBadges.push('<span class="badge">Injured</span>');

  return `<form method="dialog"><div class="modal-eyebrow">Wrestler Management</div><h2 id="nation-dialog-title">${esc(p.name)}</h2><p class="muted">${icon("Wrestling", "wrestler-brawler")}${human(p.wrestlerType)} • ${esc(p.gender)} ${statusBadges.join(" ")}</p><div class="modal-tabs">${tabButtons}</div><div class="modal-body">${body}</div><div class="promotion-modal-actions"><button value="close">Close</button>${!isRetired ? button("Release", "wrestlingReleaseWrestler", { wrestlerId: p.id }, true, "danger") : ""}</div></form>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   MASS PPV REGISTRATION MODAL
   ═════════════════════════════════════════════════════════════════════════════ */

function promotionCreateTagTeamModalContent(state, wrestlerId) {
  const w = state.wrestling || {};
  const roster = w.roster || [];
  const wrestler = roster.find((x) => x.id === wrestlerId);
  if (!wrestler) {
    return `<form method="dialog"><div class="modal-eyebrow">Create Tag Team</div><h2 id="nation-dialog-title">Wrestler Not Found</h2><p class="muted">This wrestler is no longer available.</p><div class="row dialog-actions"><button value="close" autofocus>Close</button></div></form>`;
  }
  const partners = roster.filter(
    (w) => w.id !== wrestlerId && !w.tagTeamId && w.gender === wrestler.gender && !w.isRetired && !w.isInjured,
  );
  const partnerOptions = {};
  partners.forEach((p) => {
    partnerOptions[p.id] = `${esc(p.name)} (${human(p.wrestlerType)}, Rating ${(((p.strength || 0) + (p.agility || 0) + (p.endurance || 0) + (p.charisma || 0)) / 4).toFixed(1)})`;
  });

  return `<form method="dialog" id="promotion-create-tag-team-form" data-command="wrestlingCreateTagTeam"><div class="modal-eyebrow">Create Tag Team</div><h2 id="nation-dialog-title">Create Tag Team</h2><p class="muted">Create a tag team with ${esc(wrestler.name)}. Both wrestlers must be the same gender and not already in a tag team.</p><div class="modal-body"><div class="form-stack"><input type="hidden" name="tagTeamId" value="${`tt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`}"><input type="hidden" name="wrestlerIdA" value="${esc(wrestlerId)}"><label>Tag Team Name</label>${input("Team name", "name", "", "text", 'required minlength="3" maxlength="60"')}<label>Partner</label><select name="wrestlerIdB" required>${Object.entries(partnerOptions).map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`).join("") || '<option disabled>No eligible partners</option>'}</select></div></div><div class="row dialog-actions"><button value="close">Close</button><button class="primary">Create Tag Team</button></div></form>`;
}

function promotionMassPpvModalContent(state, catalog) {
  const w = state.wrestling || {};
  const promotion = w.promotion || null;
  const roster = w.roster || [];
  const available = roster.filter((wr) => !wr.isInjured && !wr.isRetired);
  if (!promotion) {
    return `<form method="dialog"><div class="modal-eyebrow">Mass PPV</div><h2 id="nation-dialog-title">No Promotion</h2><p class="muted">Create a promotion first.</p><div class="row dialog-actions"><button value="close" autofocus>Close</button></div></form>`;
  }
  const wrestlerOptions = {};
  available.forEach((wr) => {
    wrestlerOptions[wr.id] = `${esc(wr.name)} (${human(wr.wrestlerType)}, Rating ${(((wr.strength || 0) + (wr.agility || 0) + (wr.endurance || 0) + (wr.charisma || 0)) / 4).toFixed(1)})`;
  });
  const titleOptions = {};
  (["insanity", "womensMidCard", "mensMidCard", "womensTagTeam", "mensTagTeam", "womensWorld", "mensWorld"]).forEach((k) => {
    const t = (promotion.championships && promotion.championships.titles && promotion.championships.titles[k]) || null;
    if (t && t.unlocked && t.championId) {
      titleOptions[k] = esc(TITLE_NAMES[k] || k) + ` (Champion: ${t.championName})`;
    }
  });

  return `<form method="dialog" id="promotion-mass-ppv-form" data-command="wrestlingMassPpvRegisterWrestler"><div class="modal-eyebrow">Mass PPV Registration</div><h2 id="nation-dialog-title">Register for Mass PPV</h2><p class="muted">Register one wrestler for the quarterly cross-nation Mass PPV. You may optionally put a title you hold on the line.</p><div class="modal-body"><div class="form-stack"><label>Select Wrestler</label><select name="wrestlerId" required>${Object.entries(wrestlerOptions).map(([id, name]) => `<option value="${esc(id)}">${esc(name)}</option>`).join("") || '<option disabled>No available wrestlers</option>'}</select><label>Title on the Line (optional)</label><select name="titleOnTheLineKey"><option value="">None</option>${Object.entries(titleOptions).map(([key, name]) => `<option value="${esc(key)}">${esc(name)}</option>`).join("")}</select></div></div><div class="row dialog-actions"><button value="close">Close</button><button class="primary">Register</button></div></form>`;
}

window.PromotionModals = {
  promotionTicketPriceModalContent,
  promotionDraftModalContent,
  promotionBookMatchModalContent,
  promotionWrestlerModalContent,
  promotionMassPpvModalContent,
  promotionCreateTagTeamModalContent,
};
