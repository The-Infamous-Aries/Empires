"use strict";
/**
 * Promotion Tab - Wrestling Promotion Management
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Renders the Promotion tab with 9 sub-tabs:
 *   Overview, Roster, Weekly Booking, Monthly PPV, Mass PPV,
 *   Arena & Upgrades, Championships, Rivalries & Storylines, Stats & History
 *
 * All mutating actions are dispatched to game.js via data-action / data-payload
 * buttons (handled by the command() flow). Two forms use formData() integration:
 *   promotion-create-form  -> wrestlingCreatePromotion
 *   ticket-price-form      -> wrestlingSetTicketPrice
 *
 * Exports: renderPromotionTab(state, catalog, activeSubTab) -> HTML string
 * Sets:    window.PromotionTab
 */

"use strict";

/* ═════════════════════════════════════════════════════════════════════════════
   LOCAL UI HELPERS
   ═════════════════════════════════════════════════════════════════════════════ */

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

const heading = (title, subtitle, kicker = "Wrestling Promotion") =>
  `<header class="page-heading"><div><div class="eyebrow">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div></header>`;

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

function normalizeEntries(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw && raw.$map && Array.isArray(raw.$map)) return raw.$map;
  if (typeof raw === "object") return Object.entries(raw);
  return [];
}

/* ═════════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═════════════════════════════════════════════════════════════════════════════ */

const MATCH_TYPES = ["singles", "tagteam", "trickytrio", "fatalfour"];
const STIPULATIONS = [
  "1fall",
  "2of3falls",
  "insanity",
  "ladder",
  "table",
  "cage",
  "deathmatch",
  "firstblood",
  "lastmanstanding",
  "ironman",
  "submissiononly",
  "knockout",
  "nocountout",
  "nodq",
];

const UPGRADE_TYPES = [
  "Seating",
  "Gym",
  "Medical Center",
  "Youth Academy",
  "Fan Experience",
  "Concessions",
  "Technology Center",
];

const TITLE_KEYS = [
  "insanity",
  "womensMidCard",
  "mensMidCard",
  "womensTagTeam",
  "mensTagTeam",
  "womensWorld",
  "mensWorld",
];

const TITLE_NAMES = {
  insanity: "Insanity Championship",
  womensMidCard: "Women's Mid-Card Championship",
  mensMidCard: "Men's Mid-Card Championship",
  womensTagTeam: "Women's Tag-Team Championship",
  mensTagTeam: "Men's Tag-Team Championship",
  womensWorld: "Women's World Championship",
  mensWorld: "Men's World Championship",
};

const TITLE_ICON_KEYS = {
  insanity: "wrestling-title-insanity",
  womensWorld: "wrestling-title-womens-world",
  mensWorld: "wrestling-title-mens-world",
  womensMidCard: "wrestling-title-womens-midcard",
  mensMidCard: "wrestling-title-mens-midcard",
  womensTagTeam: "wrestling-title-womens-tag",
  mensTagTeam: "wrestling-title-mens-tag",
};

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

const WRESTLER_TYPE_ICONS = {
  brawler: "wrestler-brawler",
  highflyer: "wrestler-highflyer",
  tank: "wrestler-tank",
  showboat: "wrestler-showboat",
  icon: "wrestler-icon",
};

const SUBTABS = [
  { key: "overview", label: "Overview", iconKey: "wrestling-promotion" },
  { key: "roster", label: "Roster", iconKey: "wrestler-icon" },
  { key: "booking", label: "Weekly Booking", iconKey: "wrestling-weekly-show" },
  { key: "ppv", label: "Monthly PPV", iconKey: "wrestling-monthly-ppv" },
  { key: "massppv", label: "Mass PPV", iconKey: "wrestling-mass-ppv" },
  { key: "arena", label: "Arena & Upgrades", iconKey: "wrestling-arena" },
  { key: "championships", label: "Championships", iconKey: "wrestling-title-mens-world" },
  { key: "rivalries", label: "Rivalries", iconKey: "wrestler-showboat" },
  { key: "stats", label: "Stats & History", iconKey: "wrestling-arena" },
];

/* ═════════════════════════════════════════════════════════════════════════════
   UI HELPERS — STAR RATING
   ═════════════════════════════════════════════════════════════════════════════ */

function starRating(rating) {
  const stars = parseFloat(rating || "0.0") || 0.0;
  const full = Math.floor(stars);
  const hasHalf = stars % 1 >= 0.5;
  let html = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= full) {
      html += `<span class="promotion-star promotion-star-full" title="${i} stars"></span>`;
    } else if (i === full + 1 && hasHalf) {
      html += `<span class="promotion-star promotion-star-half" title="${stars.toFixed(1)} stars"></span>`;
    } else {
      html += `<span class="promotion-star promotion-star-empty" title="${i} stars"></span>`;
    }
  }
  html += `<span class="muted" style="font-size:11px;margin-left:4px;">${stars.toFixed(1)}</span>`;
  return `<span class="promotion-star-rating" title="${stars.toFixed(1)} stars">${html}</span>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   UI HELPERS — INTENSITY BAR
   ═════════════════════════════════════════════════════════════════════════════ */

function intensityBar(intensity) {
  const val = Math.max(0, Math.min(100, Number(intensity || 0)));
  let cls = "promotion-intensity-low";
  if (val >= 60) cls = "promotion-intensity-high";
  else if (val >= 30) cls = "promotion-intensity-medium";
  return `<div class="promotion-intensity-bar"><div class="promotion-intensity-fill ${cls}" style="width:${val}%"></div></div><span class="muted" style="font-size:11px;">${val}</span>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   RENDER
   ═════════════════════════════════════════════════════════════════════════════ */

function renderPromotionTab(state, catalog, activeSubTab) {
  const n = state.nation;
  const w = state.wrestling || {};
  const promotion = w.promotion || null;
  const roster = w.roster || [];
  const weeklyShow = w.weeklyShow || { matches: [], weekStartDay: 0 };

  if (!activeSubTab || !SUBTABS.find((s) => s.key === activeSubTab)) {
    activeSubTab = "overview";
  }

  const hasArena = n.wonders && n.wonders.wrestlingArena > 0;

  // ── No promotion yet ──
  if (!promotion) {
    const createForm = form(
      "promotion-create-form",
      "wrestlingCreatePromotion",
      `<input type="hidden" name="airingDay" value="friday">${input("Promotion name", "name", "", "text", 'required minlength="3" maxlength="60"')}${select("Airing day", "airingDay", "friday", false)}`,
      "Create Promotion",
      hasArena,
    );
    return `${heading(
      "Create Your Wrestling Promotion",
      "Build a Wrestling Arena Wonder, then establish your promotion to begin managing wrestlers, booking shows, and running PPVs.",
    )}${hasArena ? createForm : '<div class="locked">Build the Wrestling Arena Wonder to unlock wrestling promotion management.</div>'}`;
  }

  const fans = promotion.fans || 0;
  const maxFansEver = promotion.maxFansEver || 0;
  const population = n.population || 0;
  const fanPercent = population > 0 ? (maxFansEver / population) * 100 : 0;
  const ticketPrice = promotion.ticketPrice || { weekly: 25, monthlyPPV: 50 };
  const arena = promotion.arena || {};
  const championships = promotion.championships || { unlocked: [], titles: {}, vacantTitles: [], blockedTitles: [] };
  const statistics = promotion.statistics || {};
  const titles = championships.titles || {};

  // ── Sub-tabs ──
  const subTabsHtml = SUBTABS.map(
    (s) =>
      `<button class="promotion-subtab-btn ${s.key === activeSubTab ? "active" : ""}" data-view="promotion" data-value="${esc(s.key)}">${icon("Wrestling", s.iconKey)}${esc(s.label)}</button>`,
  ).join("");

  // ── Overview ──
  if (activeSubTab === "overview") {
    const unlockedTitles = TITLE_KEYS.filter((k) => titles[k] && titles[k].unlocked).length;
    const totalTitles = TITLE_KEYS.length;
    const champCount = TITLE_KEYS.filter(
      (k) => titles[k] && titles[k].championId,
    ).length;

    const overviewSection = `
      <section class="card promotion-card">
        <div class="row spread">
          <h2>${icon("Wrestling", "wrestling-promotion")}${esc(promotion.name)}</h2>
          <span class="badge">${promotion.isActive ? "Active" : "Inactive"}</span>
        </div>
        <div class="promotion-metric" style="margin-bottom:8px;">
          <small>Founded</small>
          <strong>${promotion.foundedDay}</strong>
          <p class="muted">Day ${promotion.foundedDay}</p>
        </div>
        <div class="promotion-metric" style="margin-bottom:8px;">
          <small>Airing Day</small>
          <strong>${human(promotion.airingDay)}</strong>
          ${form(
            "promotion-change-airing-day-form",
            "wrestlingChangeAiringDay",
            `<input type="hidden" name="airingDay" value="${promotion.airingDay}">${select("New airing day", "airingDay", promotion.airingDay, false)}`,
            "Change Day",
            true,
          )}
        </div>
        <div class="row spread">
          <div class="promotion-metric" style="flex:1;margin-right:8px;">
            <small>Fans</small>
            <strong>${number(fans)}</strong>
            <p class="muted">Current fanbase</p>
          </div>
          <div class="promotion-metric" style="flex:1;margin-left:8px;">
            <small>Max Fans Ever</small>
            <strong>${number(maxFansEver)}</strong>
            <p class="muted">Peak: ${fanPercent.toFixed(1)}% of population</p>
          </div>
        </div>
        <div class="promotion-metric" style="margin-top:12px;">
          <small>Championships Unlocked</small>
          <strong>${unlockedTitles} / ${totalTitles}</strong>
          <p class="muted">${champCount} titles have champions</p>
        </div>
        <div class="promotion-metric">
          <small>Quick Stats</small>
          <strong>${number(statistics.showsHeld || 0)} shows</strong>
          <p class="muted">${number(statistics.totalMatches || 0)} matches • ${money(statistics.totalRevenue || 0)} revenue</p>
        </div>
        <div style="margin-top:16px;">
          <h3 style="margin:0 0 8px 0;">Ticket Prices</h3>
          <div class="row">
            <div style="flex:1;margin-right:8px;">
              <small>Weekly Show</small>
              <strong>${money(ticketPrice.weekly || 25)}</strong>
            </div>
            <div style="flex:1;margin-left:8px;">
              <small>Monthly PPV</small>
              <strong>${money(ticketPrice.monthlyPPV || 50)}</strong>
            </div>
          </div>
          ${button("Edit Ticket Prices", "openPromotionTicketPrice", {}, true)}
        </div>
      </section>

      <section class="card promotion-card">
        <h3 style="margin:0 0 12px 0;">Arena Facilities</h3>
        <div class="grid section">
          ${UPGRADE_TYPES.map(
            (key) => {
              const level = arena[key] || 0;
              const cost = Math.floor(
                {
                  Seating: 1000000,
                  Gym: 2000000,
                  "Medical Center": 3000000,
                  "Youth Academy": 2500000,
                  "Fan Experience": 1500000,
                  Concessions: 2000000,
                  "Technology Center": 5000000,
                }[key] * Math.pow(1.5, level),
              );
              const canUpgrade =
                level < 10 && n.money >= cost;
              let techNote = "";
              if (key === "Technology Center") {
                const reqTech = (level + 1) * 100;
                techNote = ` (requires ${reqTech} nation tech)`;
              }
              return `<article class="promotion-card"><div class="promotion-upgrade-row"><div class="promotion-upgrade-info"><h4>${esc(key)}</h4><p class="muted">Level ${level}/10${techNote}</p></div><span class="badge">Lv ${level}</span>${button(`Upgrade • ${money(cost)}`, "wrestlingUpgradeArena", { upgradeType: key }, canUpgrade && level < 10)}</div></article>`;
            },
          ).join("")}
        </div>
      </section>

      <section class="card promotion-card">
        <h3 style="margin:0 0 12px 0;">Championship Overview</h3>
        <div class="promotion-grid">
          ${TITLE_KEYS.map(
            (key) => {
              const t = titles[key];
              const unlocked = t && t.unlocked;
              const champion = t && t.championId ? t.championName : "Vacant";
              const reigns = t ? t.reigns : 0;
              return `<article class="promotion-card ${!unlocked ? "promotion-title-chip vacant" : "promotion-title-chip champion"}"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><h4 style="margin:0;">${icon("Wrestling", TITLE_ICON_KEYS[key])}${esc(TITLE_NAMES[key])}</h4>${unlocked ? badge("Unlocked", "good") : badge("Locked", "locked")}</div><p class="muted" style="margin:4px 0;"><strong>Champion:</strong> ${esc(champion)}</p><p class="muted" style="margin:0;"><strong>Reigns:</strong> ${reigns} • <strong>Defenses:</strong> ${t ? t.titleDefenses : 0}</p></article>`;
            },
          ).join("")}
        </div>
      </section>`;

    return `${heading(
      "Promotion Overview",
      `Manage your wrestling promotion "${esc(promotion.name)}". Track fans, championships, and revenue.`,
    )}<div class="promotion-subtabs">${subTabsHtml}</div>${overviewSection}`;
  }

  // ── Roster ──
  if (activeSubTab === "roster") {
    const draftable = roster.filter((w) => !w.isRetired && !w.isInjured);
    const injuredCount = roster.filter((w) => w.isInjured).length;
    const retiredCount = roster.filter((w) => w.isRetired).length;
    const contractExpiring = roster.filter((w) => (w.contractWeeksRemaining || 0) <= 2);

    const playerRows = roster
      .map(
        (wr) => {
          const rating =
            ((wr.strength || 0) +
              (wr.agility || 0) +
              (wr.endurance || 0) +
              (wr.charisma || 0)) /
            4;
          const status = wr.isRetired
            ? "Retired"
            : wr.isInjured
              ? `Injured (${wr.injuryWeeksLeft || 0}w)`
              : "Active";
          const statusClass = wr.isRetired ? "bad" : wr.isInjured ? "bad" : "good";
          const tagTeam = wr.tagTeamId ? `Tag: ${wr.tagTeamId}` : "—";
          const featured = wr.featuredMatch
            ? `${human(wr.featuredMatch.matchType)} / ${human(wr.featuredMatch.stipulation)}`
            : "—";
          return `<tr>
            <td class="wrestler-name">${icon("Wrestling", WRESTLER_TYPE_ICONS[wr.wrestlerType] || "wrestler-brawler")}${esc(wr.name)}<br><small>${esc(wr.gender)} • ${human(wr.wrestlerType)}</small></td>
            <td><span class="promotion-stat-chip">STR ${wr.strength || 0}</span><span class="promotion-stat-chip">AGI ${wr.agility || 0}</span><span class="promotion-stat-chip">END ${wr.endurance || 0}</span><span class="promotion-stat-chip">CHA ${wr.charisma || 0}</span></td>
            <td>${number(rating.toFixed(1))}</td>
            <td>${wr.level || 1} • Potential ${wr.potential || 50}</td>
            <td>${wr.matchesWrestled || 0} W${wr.wins || 0} / L${wr.losses || 0}</td>
            <td>${number(wr.personalFans || 0)} fans</td>
            <td>${wr.contractWeeksRemaining || 0} weeks</td>
            <td>${money(wr.salary || 0)}/wk</td>
            <td><span class="badge ${statusClass}">${esc(status)}</span><br>${wr.injuryType ? `<span class="muted">${esc(wr.injuryType)}</span>` : ""}</td>
            <td>${tagTeam}</td>
            <td>${featured}</td>
            <td class="promotion-actions-cell">
              ${button("Train", "openPromotionWrestler", { wrestlerId: wr.id, tab: "train" }, true)}
              ${button("Contract", "openPromotionWrestler", { wrestlerId: wr.id, tab: "contract" }, true)}
              ${button("Featured", "openPromotionWrestler", { wrestlerId: wr.id, tab: "featured" }, true)}
              ${button("Moves", "openPromotionWrestler", { wrestlerId: wr.id, tab: "moves" }, true)}
              ${wr.tagTeamId
                ? button("Leave Tag Team", "wrestlingDissolveTagTeam", { tagTeamId: wr.tagTeamId }, true, "danger")
                : button("Create Tag Team", "openPromotionCreateTagTeam", { wrestlerId: wr.id }, true)}
              ${button("Release", "wrestlingReleaseWrestler", { wrestlerId: wr.id }, wr.contractWeeksRemaining > 0 && !wr.isRetired, "danger")}
            </td>
          </tr>`;
        },
      )
      .join("");

    const rosterSection = `
      <section class="card promotion-card">
        <div class="row spread">
          <h2>${icon("Wrestling", "wrestler-icon")}Roster</h2>
          <span class="badge">${roster.length} wrestlers${injuredCount ? ` • ${injuredCount} injured` : ""}${retiredCount ? ` • ${retiredCount} retired` : ""}</span>
        </div>
        <div class="table-wrap section">
          <table class="promotion-roster-table">
            <thead>
              <tr>
                <th>Wrestler</th><th>Stats</th><th>Rating</th><th>Level • Potential</th><th>Record</th><th>Personal Fans</th><th>Contract</th><th>Salary</th><th>Status</th><th>Tag Team</th><th>Featured Match</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>${playerRows || '<tr><td colspan="12" class="muted">No wrestlers on roster. Use Draft to sign wrestlers.</td></tr>'}</tbody>
          </table>
        </div>
        <div style="margin-top:12px;">
          ${button("Draft Wrestler", "openPromotionDraft", {}, draftable.length > 0 || true)}
          ${contractExpiring.length > 0 ? `<span class="badge bad">${contractExpiring.length} contract(s) expiring ≤ 2 weeks</span>` : ""}
        </div>
      </section>`;

    return `${heading(
      "Wrestler Roster",
      `Manage your ${roster.length} wrestlers. Train, extend contracts, set featured matches, and release wrestlers.`,
    )}<div class="promotion-subtabs">${subTabsHtml}</div>${rosterSection}`;
  }

  // ── Weekly Booking ──
  if (activeSubTab === "booking") {
    const matches = weeklyShow.matches || [];
    const daysUntilShow = 7;
    const bookingOpen = daysUntilShow > 1;
    const availableWrestlers = roster.filter((w) => !w.isInjured && !w.isRetired);
    const availableWrestlersJson = JSON.stringify(availableWrestlers.map(w => ({id:w.id, name:w.name, type:w.wrestlerType, gender:w.gender, strength:w.strength||0, agility:w.agility||0, endurance:w.endurance||0, charisma:w.charisma||0, featuredMatch:w.featuredMatch})));
    const bookedIds = new Set();
    matches.forEach((m) => (m.participants || []).forEach((p) => bookedIds.add(p.wrestlerId)));

    const lastShowHtml = weeklyShow.matches && weeklyShow.matches.length > 0
      ? `
        <section class="card promotion-card">
          <h3 style="margin:0 0 8px 0;">Last Show Results</h3>
          <div class="promotion-result-item">
            <div class="promotion-result-header">
              <strong>Weekly Show • Day ${weeklyShow.weekStartDay || 0}</strong>
              <span class="badge">${matches.length} matches</span>
            </div>
            <div class="promotion-result-matches">
              ${weeklyShow.matches.map(
                (m) => {
                  const winner = (m.participants || []).find((p) => p.wrestlerId === m.winnerId);
                  const stars = starRating(m.matchGrade || "0.0");
                  return `<div class="promotion-match-chip"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted-color,#94a3b8);margin-bottom:4px;"><span>${human(m.matchType)}</span><span>${human(m.stipulation)}</span></div><div style="font-size:12px;">${esc((m.participants || []).map((p) => p.wrestlerName).join(" vs "))}</div><div style="display:flex;gap:4px;"><span class="${m.winnerId ? "promotion-win" : "promotion-loss"}">${winner ? esc(winner.wrestlerName) : "—"} won</span>${stars}</div></div>`;
                },
              ).join("")}
            </div>
          </div>
        </section>
      `
      : "";

    const matchRows = matches
      .map(
        (m) => {
          const participants = (m.participants || [])
            .map((p) => p.wrestlerName)
            .join(" vs ");
          return `<div class="promotion-match-row">
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:6px;">
                ${icon("Wrestling", MATCH_TYPE_ICONS[m.matchType] || "wrestling-singles")}
                ${icon("Wrestling", STIPULATION_ICONS[m.stipulation] || "wrestling-1fall")}
                ${m.titleKey ? icon("Wrestling", TITLE_ICON_KEYS[m.titleKey] || "") : ""}
                <strong>${esc(participants)}</strong>
                ${m.titleKey ? `<span class="badge">Title: ${esc(TITLE_NAMES[m.titleKey] || m.titleKey)}</span>` : ""}
              </div>
              <div class="promotion-intensity-bar" style="width:100px;margin-top:4px;"><div class="promotion-intensity-fill promotion-intensity-medium" style="width:50%"></div></div>
            </div>
            ${button("Remove", "wrestlingRemoveMatch", { matchId: m.id }, bookingOpen, "danger")}
          </div>`;
        },
      )
      .join("");

    const bookingSection = `
      ${lastShowHtml}
      <section class="card promotion-card">
        <div class="row spread">
          <h2>${icon("Wrestling", "wrestling-weekly-show")}Weekly Show Booking</h2>
          <span class="badge">${matches.length} / 4 matches booked</span>
        </div>
        <p class="muted">Book up to 4 matches for this week's show. Booking window closes 1 day before airing day (${human(promotion.airingDay)}). Shows process automatically on airing day.</p>
        <div class="promotion-booking-card">
          <h3 style="margin:0 0 8px 0;">Current Card</h3>
          ${matchRows || '<p class="muted">No matches booked yet.</p>'}
        </div>
        <div style="margin-top:12px;">
          ${button("Book Match", "openPromotionBookMatch", { availableWrestlersJson }, bookingOpen)}
          ${button("Set Weekly Card", "wrestlingSetWeeklyCard", { matchIds: matches.map((m) => m.id) }, matches.length > 0 && bookingOpen)}
        </div>
      </section>`;

    return `${heading(
      "Weekly Show Booking",
      `Book matches for your weekly show on ${human(promotion.airingDay)}. Max 4 matches per card.`,
    )}<div class="promotion-subtabs">${subTabsHtml}</div>${bookingSection}`;
  }

  // ── Monthly PPV ──
  if (activeSubTab === "ppv") {
    const lastPpv = promotion.monthlyPpvHistory && promotion.monthlyPpvHistory.length > 0 ? promotion.monthlyPpvHistory[promotion.monthlyPpvHistory.length - 1] : null;
    const ppvHistory = promotion.monthlyPpvHistory || [];

    const ppvHistoryHtml = ppvHistory
      .map(
        (ppv) => {
          const stars = starRating(ppv.showRating || "0.0");
          return `<div class="promotion-result-item">
            <div class="promotion-result-header">
              <strong>Monthly PPV • Day ${ppv.day || 0}</strong>
              <span class="badge">${ppv.matches ? ppv.matches.length : 0} matches</span>
            </div>
            <div class="promotion-result-matches">
              ${(ppv.matches || []).map(
                (m) => {
                  const winner = (m.participants || []).find((p) => p.wrestlerId === m.winnerId);
                  return `<div class="promotion-match-chip"><div style="font-size:12px;">${esc((m.participants || []).map((p) => p.wrestlerName).join(" vs "))}</div><div style="display:flex;gap:4px;margin-top:4px;"><span class="${m.winnerId ? "promotion-win" : "promotion-loss"}">${winner ? esc(winner.wrestlerName) : "—"} won</span>${starRating(m.matchGrade || "0.0")}</div></div>`;
                },
              ).join("")}
            </div>
            <div class="row spread" style="margin-top:8px;font-size:12px;">
              <span><strong>Rating:</strong> ${stars}</span>
              <span><strong>Attendance:</strong> ${number(ppv.attendance || 0)}</span>
              <span><strong>Revenue:</strong> ${money(ppv.totalRevenue || 0)}</span>
              <span><strong>PPV Buys:</strong> ${money(ppv.ppvBuyRevenue || 0)}</span>
            </div>
          </div>`;
        },
      )
      .join("");

    const ppvSection = `
      <section class="card promotion-card">
        <div class="row spread">
          <h2>${icon("Wrestling", "wrestling-monthly-ppv")}Monthly PPV</h2>
          <span class="badge">Every 30 days</span>
        </div>
        <p class="muted">Monthly PPV replaces the weekly show and can have up to 6 matches. Ticket price: ${money(ticketPrice.monthlyPPV || 50)}.</p>
        ${lastPpv ? `
        <section class="card promotion-card" style="margin-top:12px;">
          <h3 style="margin:0 0 8px 0;">Last Monthly PPV Results</h3>
          <div class="promotion-result-item">
            <div class="promotion-result-header">
              <strong>Day ${lastPpv.day || 0}</strong>
              <span class="badge">${lastPpv.matches ? lastPpv.matches.length : 0} matches</span>
            </div>
            <div class="promotion-result-matches">
              ${(lastPpv.matches || []).map(
                (m) => {
                  const winner = (m.participants || []).find((p) => p.wrestlerId === m.winnerId);
                  return `<div class="promotion-match-chip"><div style="font-size:12px;">${esc((m.participants || []).map((p) => p.wrestlerName).join(" vs "))}</div><div style="display:flex;gap:4px;margin-top:4px;"><span class="${m.winnerId ? "promotion-win" : "promotion-loss"}">${winner ? esc(winner.wrestlerName) : "—"} won</span>${starRating(m.matchGrade || "0.0")}</div></div>`;
                },
              ).join("")}
            </div>
          </div>
        </section>
        ` : '<p class="muted">No monthly PPV held yet.</p>'}
        <div style="margin-top:12px;">
          <h3 style="margin:0 0 8px 0;">PPV History</h3>
          <div class="promotion-results-list">${ppvHistoryHtml || '<p class="muted">No PPV history.</p>'}</div>
        </div>
      </section>`;

    return `${heading(
      "Monthly PPV",
      "Run your monthly premium live event with up to 6 matches and PPV buy revenue.",
    )}<div class="promotion-subtabs">${subTabsHtml}</div>${ppvSection}`;
  }

  // ── Mass PPV ──
  if (activeSubTab === "massppv") {
    const massPpvHistory = promotion.massPpvHistory || [];
    const massPpvRegistrations = w.massPpvRegistrations || [];
    const isRegistered = massPpvRegistrations.some((r) => r.nationId === n.id);

    const massPpvHistoryHtml = massPpvHistory
      .map(
        (h) => {
          const resultClass = h.result === "win" ? "promotion-win" : "promotion-loss";
          return `<div class="promotion-result-item">
            <div class="promotion-result-header">
              <strong>Mass PPV • Day ${h.day || 0}</strong>
              <span class="badge">${h.result === "win" ? "Win" : "Loss"}</span>
            </div>
            <div class="row spread" style="font-size:12px;">
              <span><strong>Wrestler:</strong> ${esc(h.wrestlerName || "Unknown")}</span>
              <span><strong>Result:</strong> <span class="${resultClass}">${esc(h.result)}</span></span>
              <span><strong>Match:</strong> ${human(h.matchType || "singles")}</span>
              ${h.titleWon ? `<span class="promotion-win">Title Won: ${esc(h.titleWon)}</span>` : ""}
              ${h.titleLost ? `<span class="promotion-loss">Title Lost: ${esc(h.titleLost)}</span>` : ""}
            </div>
          </div>`;
        },
      )
      .join("");

    const massppvSection = `
      <section class="card promotion-card">
        <div class="row spread">
          <h2>${icon("Wrestling", "wrestling-mass-ppv")}Mass PPV (Quarterly)</h2>
          <span class="badge">${isRegistered ? "Registered" : "Not Registered"}</span>
        </div>
        <p class="muted">Global cross-nation event every 90 days. Register one wrestler to represent your promotion. Titles can be put on the line.</p>
        <div style="margin-top:12px;">
          ${!isRegistered ? button("Register for Mass PPV", "openPromotionMassPpv", {}, true) : '<span class="badge good">Already registered for next cycle</span>'}
        </div>
        <div style="margin-top:16px;">
          <h3 style="margin:0 0 8px 0;">Mass PPV History</h3>
          <div class="promotion-results-list">${massPpvHistoryHtml || '<p class="muted">No Mass PPV history.</p>'}</div>
        </div>
      </section>`;

    return `${heading(
      "Mass PPV",
      "Quarterly global event where your promotion's best wrestler competes cross-nation.",
    )}<div class="promotion-subtabs">${subTabsHtml}</div>${massppvSection}`;
  }

  // ── Arena & Upgrades ──
  if (activeSubTab === "arena") {
    const upgradeRows = UPGRADE_TYPES.map(
      (key) => {
        const level = arena[key] || 0;
        const baseCost = { Seating: 1000000, Gym: 2000000, "Medical Center": 3000000, "Youth Academy": 2500000, "Fan Experience": 1500000, Concessions: 2000000, "Technology Center": 5000000 }[key] || 0;
        const cost = Math.floor(baseCost * Math.pow(1.5, level));
        const canUpgrade = level < 10 && n.money >= cost;
        let techNote = "";
        if (key === "Technology Center") {
          const reqTech = (level + 1) * 100;
          techNote = ` (requires ${reqTech} nation tech)`;
        }
        const bonusText = {
          Seating: `+${level * 5000} capacity`,
          Gym: `+${Math.round(level * 10)}% training`,
          "Medical Center": `+${Math.round(level * 10)}% injury recovery`,
          "Youth Academy": `+${level} draft quality`,
          "Fan Experience": `+${Math.round(level * 10)}% fans`,
          Concessions: `+${Math.round(level * 10)}% revenue`,
          "Technology Center": `+${Math.round(level * 5)}% fans/XP`,
        }[key] || `Level ${level}`;
        return `<div class="promotion-upgrade-row"><div class="promotion-upgrade-info"><h4>${esc(key)}</h4><p class="muted">Level ${level}/10 • ${bonusText}${techNote}</p></div><span class="badge">Lv ${level}</span><span class="muted" style="margin:0 8px;">${money(cost)}</span>${button("Upgrade", "wrestlingUpgradeArena", { upgradeType: key }, canUpgrade && level < 10)}</div>`;
      },
    ).join("");

    const arenaSection = `
      <section class="card promotion-card">
        <div class="row spread">
          <h2>${icon("Wrestling", "wrestling-arena")}Arena & Upgrades</h2>
          <span class="badge">Capacity: ${number((arena.seating || 0) * 5000)}</span>
        </div>
        <p class="muted">Upgrade arena facilities using nation funds. Technology Center requires nation technology level = (level + 1) × 100.</p>
        <div class="grid section">${upgradeRows}</div>
      </section>`;

    return `${heading(
      "Arena & Upgrades",
      "Improve your promotion's arena facilities to increase attendance, fans, and revenue.",
    )}<div class="promotion-subtabs">${subTabsHtml}</div>${arenaSection}`;
  }

  // ── Championships ──
  if (activeSubTab === "championships") {
    const champSection = `
      <section class="card promotion-card">
        <h2>${icon("Wrestling", "wrestling-title-mens-world")}Championships</h2>
        <p class="muted">Titles unlock based on fan percentage of population: 10% / 25% / 33% / 50%. Current: ${fanPercent.toFixed(1)}%.</p>
        <div class="promotion-grid">
          ${TITLE_KEYS.map(
            (key) => {
              const t = titles[key];
              const unlocked = t && t.unlocked;
              const champion = t && t.championId ? t.championName : "Vacant";
              const isVacant = t && !t.championId;
              return `<article class="promotion-card"><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><h4 style="margin:0;display:flex;align-items:center;gap:6px;">${icon("Wrestling", TITLE_ICON_KEYS[key])}${esc(TITLE_NAMES[key])}</h4>${unlocked ? badge("Unlocked", "good") : badge("Locked", "locked")}</div><p class="muted" style="margin:4px 0;"><strong>Champion:</strong> ${esc(champion)}</p><p class="muted" style="margin:0 0 8px 0;"><strong>Reigns:</strong> ${t ? t.reigns : 0} • <strong>Defenses:</strong> ${t ? t.titleDefenses : 0} • <strong>Prestige:</strong> ${t ? t.prestigeLevel : 1}</p>${unlocked && !isVacant ? button("Vacate Title", "wrestlingVacateTitle", { titleKey: key }, true, "danger") : ""}${unlocked && isVacant ? '<span class="badge">Vacant</span>' : ""}</article>`;
            },
          ).join("")}
        </div>
        <div style="margin-top:16px;">
          <h3 style="margin:0 0 8px 0;">Title History / Lineage</h3>
          <div class="table-wrap section">
            <table>
              <thead><tr><th>Title</th><th>Champion</th><th>Reigns</th><th>Defenses</th></tr></thead>
              <tbody>
              ${TITLE_KEYS.map(
                (key) => {
                  const t = titles[key];
                  if (!t) return "";
                  return `<tr><td>${esc(TITLE_NAMES[key])}</td><td>${esc(t.championName || "Vacant")}</td><td>${t.reigns}</td><td>${t.titleDefenses}</td></tr>`;
                },
              ).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </section>`;

    return `${heading(
      "Championships",
      "Manage your promotion's championships, champions, and title defenses.",
    )}<div class="promotion-subtabs">${subTabsHtml}</div>${champSection}`;
  }

  // ── Rivalries & Storylines ──
  if (activeSubTab === "rivalries") {
    const rivalryRows = roster
      .flatMap((wr) => {
        const rivalries = wr.rivalries || [];
        return rivalries.map((r) => {
          const target = roster.find((x) => x.id === r.targetId || x.id === r.wrestlerId);
          const intensity = r.intensity || 0;
          return `<tr>
            <td>${esc(wr.name)}</td>
            <td>${esc(target ? target.name : "Unknown")}</td>
            <td>${intensityBar(intensity)}</td>
            <td>${r.type || "Ongoing"}</td>
          </tr>`;
        });
      })
      .join("");

    const rivalrySection = `
      <section class="card promotion-card">
        <h2>${icon("Wrestling", "wrestler-showboat")}Rivalries & Storylines</h2>
        <p class="muted">Rivalry intensity grows when wrestlers compete against each other, especially in title matches and high-rated bouts. Intensity decays over time if wrestlers don't face each other.</p>
        <div class="table-wrap section">
          <table class="promotion-roster-table">
            <thead><tr><th>Wrestler A</th><th>Wrestler B</th><th>Intensity</th><th>Status</th></tr></thead>
            <tbody>${rivalryRows || '<tr><td colspan="4" class="muted">No active rivalries.</td></tr>'}</tbody>
          </table>
        </div>
        <div style="margin-top:16px;">
          <h3 style="margin:0 0 8px 0;">Storylines</h3>
          <div class="promotion-results-list">
            ${(promotion.storylines || []).map(
              (s) => `<div class="promotion-result-item"><p class="muted">${esc(s.description || s.name || "Untitled storyline")}</p><span class="badge">${esc(s.status || "Active")}</span></div>`,
            ).join("") || '<p class="muted">No active storylines.</p>'}
          </div>
        </div>
      </section>`;

    return `${heading(
      "Rivalries & Storylines",
      "Track wrestler rivalries with intensity ratings and ongoing storylines.",
    )}<div class="promotion-subtabs">${subTabsHtml}</div>${rivalrySection}`;
  }

  // ── Stats & History ──
  if (activeSubTab === "stats") {
    const showHistory = promotion.showHistory || [];
    const recentShows = showHistory.slice(-5).reverse();

    const statsSection = `
      <section class="card promotion-card">
        <div class="row spread">
          <h2>${icon("Wrestling", "wrestling-arena")}Promotion Statistics</h2>
        </div>
        <div class="metrics">
          <div class="metric"><small>Shows Held</small><strong>${number(statistics.showsHeld || 0)}</strong></div>
          <div class="metric"><small>Total Matches</small><strong>${number(statistics.totalMatches || 0)}</strong></div>
          <div class="metric"><small>Title Changes</small><strong>${number(statistics.titleChanges || 0)}</strong></div>
          <div class="metric"><small>Fans Gained Total</small><strong>${number(statistics.fansGainedTotal || 0)}</strong></div>
          <div class="metric"><small>Total Injuries</small><strong>${number(statistics.injuriesTotal || 0)}</strong></div>
          <div class="metric"><small>Mass PPV Wins</small><strong>${number(statistics.massPpvWins || 0)}</strong></div>
          <div class="metric"><small>Mass PPV Losses</small><strong>${number(statistics.massPpvLosses || 0)}</strong></div>
          <div class="metric"><small>Total Revenue</small><strong>${money(statistics.totalRevenue || 0)}</strong></div>
        </div>
      </section>

      <section class="card promotion-card">
        <h3 style="margin:0 0 12px 0;">Recent Show History</h3>
        <div class="table-wrap section">
          <table class="promotion-roster-table">
            <thead><tr><th>Show</th><th>Day</th><th>Matches</th><th>Rating</th><th>Fans Gained</th><th>Revenue</th></tr></thead>
            <tbody>
            ${recentShows.map(
              (s) => `<tr><td>${esc(s.type || "Weekly Show")}</td><td>${s.day || 0}</td><td>${s.matches ? s.matches.length : 0}</td><td>${starRating(s.showRating || "0.0")}</td><td>${number(s.fansGained || 0)}</td><td>${money(s.totalRevenue || 0)}</td></tr>`,
            ).join("") || '<tr><td colspan="6" class="muted">No show history.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>

      <section class="card promotion-card">
        <h3 style="margin:0 0 12px 0;">Wrestler Career Stats</h3>
        <div class="table-wrap section">
          <table class="promotion-roster-table">
            <thead><tr><th>Wrestler</th><th>Matches</th><th>Wins</th><th>Losses</th><th>Personal Fans</th><th>Title Reigns</th></tr></thead>
            <tbody>
            ${roster.map(
              (wr) => `<tr><td>${esc(wr.name)}</td><td>${wr.matchesWrestled || 0}</td><td>${wr.wins || 0}</td><td>${wr.losses || 0}</td><td>${number(wr.personalFans || 0)}</td><td>${(wr.titleReigns || []).length}</td></tr>`,
            ).join("") || '<tr><td colspan="6" class="muted">No wrestlers.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>`;

    return `${heading(
      "Stats & History",
      "Review your promotion's performance, show history, and wrestler careers.",
    )}<div class="promotion-subtabs">${subTabsHtml}</div>${statsSection}`;
  }

  return `${heading("Promotion", "Wrestling promotion management.")}<div class="promotion-subtabs">${subTabsHtml}</div>${empty("Select a sub-tab.")}`;
}

function form(id, action, fields, label = "Save", enabled = true, extra = "") {
  return `<form id="${esc(id)}" data-command="${esc(action)}" data-allowed="${!!enabled}" ${extra}><div class="form-stack">${fields}</div><div class="form-footer"><button class="primary" ${enabled ? "" : "disabled"}>${esc(label)}</button></div></form>`;
}

function input(label, name, value = "", type = "text", extra = "") {
  return `<label>${esc(label)}<input name="${esc(name)}" type="${type}" value="${esc(value)}" ${extra}></label>`;
}

window.PromotionTab = { render: renderPromotionTab };
