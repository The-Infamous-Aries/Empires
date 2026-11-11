"use strict";
/**
 * User Tab - Sovereignty Epochs
 * Renders the User tab content with 5 sub-tabs:
 *   Goals, Skills, Inventory, Stats, Settings
 *
 * All mutating actions are dispatched to game.js via data-action / data-payload
 * buttons (handled by the command() flow).
 *
 * Exports: renderUserTab(state, catalog, activeSubTab) -> HTML string
 * Sets:    window.UserTab
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

const heading = (title, subtitle, kicker = "User Profile") =>
  `<header class="page-heading"><div><div class="eyebrow">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div></header>`;

/* ═════════════════════════════════════════════════════════════════════════════
   DATA NORMALIZATION
   ═════════════════════════════════════════════════════════════════════════════ */

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

const SKILL_CATEGORIES = {
  Combat: ["attack", "defense", "block", "parry", "evade", "aim", "criticalChance", "criticalDamage", "discipline"],
  Resource: ["energy", "intuition"],
  Economy: ["taxation", "production"],
  Nation: ["intelligence", "diplomacy", "stewardship"],
};

const SKILL_NAMES = {
  attack: "Attack", defense: "Defense", block: "Block", parry: "Parry", evade: "Evade",
  aim: "Aim", criticalChance: "Critical Chance", criticalDamage: "Critical Damage", discipline: "Discipline",
  energy: "Energy", intuition: "Intuition",
  taxation: "Taxation", production: "Production",
  intelligence: "Intelligence", diplomacy: "Diplomacy", stewardship: "Stewardship",
};

const SKILL_ICONS = {
  attack: "combat-attack", defense: "combat-defense", block: "combat-block", parry: "combat-parry", evade: "combat-evade",
  aim: "combat-aim", criticalChance: "combat-crit-chance", criticalDamage: "combat-crit-dmg", discipline: "combat-discipline",
  energy: "resource-energy", intuition: "resource-intuition",
  taxation: "economy-taxation", production: "economy-production",
  intelligence: "nation-intelligence", diplomacy: "nation-diplomacy", stewardship: "nation-stewardship",
};

const SUBTABS = [
  { key: "goals", label: "Goals", iconKey: "goal" },
  { key: "skills", label: "Skills", iconKey: "skill" },
  { key: "inventory", label: "Inventory", iconKey: "inventory" },
  { key: "stats", label: "Stats", iconKey: "stats" },
  { key: "settings", label: "Settings", iconKey: "settings" },
];

const ITEM_CATEGORY_ORDER = ["Head", "Body", "Hands", "Legs", "Feet", "Guns", "Melee", "Tools", "Other"];
const TIER_ORDER = ["Sovereign", "Epochal", "Reinforced", "Polished", "Seasoned", "Weathered", "Derelict"];

const KEY_TYPES = ["key1", "key2", "key3"];
const KEY_NAMES = { key1: "Common Key", key2: "Uncommon Key", key3: "Rare Key" };
const CHEST_TYPES = ["chest1", "chest2", "chest3", "chest4"];
const CHEST_NAMES = { chest1: "Common Chest", chest2: "Uncommon Chest", chest3: "Rare Chest", chest4: "Sovereign Chest" };

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
   SUB-TAB 1: GOALS
   ═════════════════════════════════════════════════════════════════════════════ */

function renderGoals(state, catalog) {
  const xpSys = state.xpGoalsSystem || _global.XPGoalsSystem;
  const player = state.player;
  const playerLevel = player ? player.level : 1;

  if (!xpSys) {
    return `<section class="card promotion-card"><h2>Goals</h2><p class="muted">XP system not available.</p></section>`;
  }

  const periods = ["daily", "weekly", "monthly"];
  const periodLabels = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

  const periodsHtml = periods.map((period) => {
    const goals = xpSys.getGoals ? xpSys.getGoals(period) : [];
    const completedIds = xpSys.completedGoalIds ? xpSys.completedGoalIds[period] : new Set();
    const completedCount = completedIds ? completedIds.size : 0;
    const totalGoals = goals.length;
    const bonusThreshold = 7;
    const bonusEarned = completedCount >= bonusThreshold;

    const bonusAmounts = { daily: 500, weekly: 2500, monthly: 10000 };
    const bonusXP = bonusAmounts[period] || 0;

    const streakKey = period === "daily" ? "dailyStreak" : period === "weekly" ? "weeklyStreak" : "monthlyStreak";
    const streak = xpSys[streakKey] || 0;

    const goalCards = goals.map((goal) => {
      const pct = xpSys.getGoalProgress ? xpSys.getGoalProgress(goal) * 100 : 0;
      const locked = goal.levelRequirement > playerLevel;
      const completed = goal.completed || (completedIds && completedIds.has(goal.id));

      return `<article class="goals-goal-card">
        <div class="goals-goal-header">
          <span class="goals-goal-title">${esc(goal.title)}</span>
          <span class="goals-goal-xp">+${number(goal.xpReward)} XP</span>
        </div>
        <p class="goals-goal-desc">${esc(goal.description || "")}</p>
        <div class="goals-goal-progress">
          <div class="goals-goal-bar"><div class="goals-goal-bar-fill" style="width:${Math.min(pct, 100)}%"></div></div>
        </div>
        <span class="goals-goal-count">${goal.current} / ${goal.target}</span>
        ${locked ? `<span class="badge bad">Requires Level ${goal.levelRequirement}</span>` : ""}
        ${completed ? `<span class="badge good">Completed</span>` : ""}
        <div class="goals-goal-actions">
          ${locked ? "" : completed ? '<button class="secondary" disabled>Claimed</button>' : button("Claim", "noop", {}, false, "secondary")}
        </div>
      </article>`;
    }).join("") || '<p class="muted">No goals available for this period.</p>';

    return `<section class="card promotion-card">
      <div class="goals-summary">
        <div class="goals-summary-item">
          <div class="label">${periodLabels[period]} Goals</div>
          <div class="value">${completedCount} / ${totalGoals}</div>
          <div class="sub">completed</div>
        </div>
        <div class="goals-summary-item">
          <div class="label">7/10 Bonus</div>
          <div class="value">${bonusEarned ? "Earned" : `${bonusThreshold - completedCount} more`}</div>
          <div class="sub">+${money(bonusXP)} XP</div>
        </div>
        <div class="goals-summary-item">
          <div class="label">Streak</div>
          <div class="value">${streak}</div>
          <div class="sub">${period} streak</div>
        </div>
      </div>
      <div class="goals-goal-list">${goalCards}</div>
    </section>`;
  }).join("");

  return `<section class="card promotion-card">
    <div class="goals-period-tabs">
      ${periods.map((p) => `<button class="goals-period-tab ${p === "daily" ? "active" : ""}" data-action="noop" data-payload="${esc(JSON.stringify({period: p}))}">${icon("goal", "goal")}${esc(periodLabels[p])}</button>`).join("")}
    </div>
    ${periodsHtml}
  </section>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   SUB-TAB 2: SKILLS
   ═════════════════════════════════════════════════════════════════════════════ */

function renderSkills(state, catalog) {
  const player = state.player;
  const skills = player ? player.skills : {};
  const skillPoints = player ? player.skillPoints : 0;
  const legendaryPoints = player ? player.legendaryPoints : 0;
  const level = player ? player.level : 1;
  const legendaryLevel = player ? player.legendaryLevel : 0;

  const categoryCards = Object.entries(SKILL_CATEGORIES).map(([catName, skillKeys]) => {
    const skillCards = skillKeys.map((key) => {
      const s = skills[key] || {};
      const sLevel = s.level || 0;
      const sMax = 10;
      const sPointsSpent = s.pointsSpent || 0;
      const sLegendary = s.legendaryBonusPts || 0;
      const cost = player && player.skillUpgradeCost ? player.skillUpgradeCost(key) : null;
      const canUpgrade = cost != null && skillPoints >= cost && !s.isMaxed;
      const canLegendary = legendaryPoints > 0 && sLevel < sMax;
      const displayValue = player && player.getSkillDisplayValue ? player.getSkillDisplayValue(key) : (s.value || 0);

      return `<article class="skill-card">
        <div class="skill-header">
          <h3 class="skill-name">${icon("skill", SKILL_ICONS[key] || "skill")}${esc(SKILL_NAMES[key] || key)}</h3>
          <span class="skill-category">${catName}</span>
        </div>
        <div class="skill-body">
          <div class="skill-row">
            <span>Level</span>
            <span class="skill-value">${sLevel} / ${sMax}</span>
          </div>
          <div class="skill-row">
            <span>Value</span>
            <span class="skill-value">${esc(displayValue)}</span>
          </div>
          <div class="skill-row">
            <span>Points Spent</span>
            <span class="skill-value">${sPointsSpent}</span>
          </div>
          ${sLegendary > 0 ? `<div class="skill-row"><span>Legendary</span><span class="skill-value">+${sLegendary}</span></div>` : ""}
          ${cost != null ? `<div class="skill-row"><span>Upgrade Cost</span><span class="skill-cost">${cost} pts</span></div>` : `<div class="skill-row"><span>Status</span><span class="skill-value badge good">Maxed</span></div>`}
        </div>
        <div class="skill-actions">
          ${button("Upgrade", "allocateSkillPoint", { skillKey: key }, canUpgrade && skillPoints > 0)}
          ${button("Legendary", "allocateLegendaryPoint", { skillKey: key }, canLegendary && legendaryPoints > 0, "secondary")}
        </div>
      </article>`;
    }).join("");

    return `<section class="card promotion-card">
      <h2 style="margin:0 0 12px 0;display:flex;align-items:center;gap:8px;">${icon("skill", "skill")}${esc(catName)} Skills</h2>
      <div class="skills-grid">${skillCards}</div>
    </section>`;
  }).join("");

  return `<section class="card promotion-card skills-header">
    <div class="skills-stats">
      <div class="skills-stat">
        <div class="label">Level</div>
        <div class="value">${level}</div>
        <div class="sub">Player Level</div>
      </div>
      <div class="skills-stat">
        <div class="label">Legendary Level</div>
        <div class="value">${legendaryLevel}</div>
        <div class="sub">Legendary Progress</div>
      </div>
      <div class="skills-stat">
        <div class="label">Skill Points</div>
        <div class="value">${skillPoints}</div>
        <div class="sub">Available to Spend</div>
      </div>
      <div class="skills-stat">
        <div class="label">Legendary Points</div>
        <div class="value">${legendaryPoints}</div>
        <div class="sub">Available to Spend</div>
      </div>
    </div>
  </section>
  ${categoryCards}`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   SUB-TAB 3: INVENTORY
   ═════════════════════════════════════════════════════════════════════════════ */

function renderInventory(state, catalog) {
  const n = state.nation;
  const equipment = n ? n.equipment : {};
  const keys = equipment.keys || {};
  const chests = equipment.chests || {};
  const equipped = equipment.equipped || {};
  const inventory = state.player ? state.player.inventory : [];
  const resources = state.player ? state.player.resources : [];
  const invLayout = state.player ? state.player.settings?.inventoryLayout : {};
  const reverseTier = invLayout?.reverseTierOrder === true;
  const categoryOrders = invLayout?.categoryOrder || {};

  // ── Equipment Slots (Head, Body, Hands, Legs, Feet, Weapon) ──
  const slotOrder = ["head", "body", "arms", "legs", "feet", "weapon"];
  const slotLabels = { head: "Head", body: "Body", arms: "Hands", legs: "Legs", feet: "Feet", weapon: "Weapon" };

  const slotsHtml = slotOrder.map((slot) => {
    const item = equipped[slot];
    const isEmpty = !item;
    return `<article class="equipment-slot ${isEmpty ? "empty" : ""}">
      <div class="equipment-slot-label">${slotLabels[slot]}</div>
      ${isEmpty
        ? '<div class="equipment-slot-item"><div style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:10px;">—</div><div class="equipment-slot-name">Empty</div></div>'
        : `<div class="equipment-slot-item">
          ${icon("equipment", item.icon || "item")}
          <div class="equipment-slot-name">${esc(item.name || "Item")}</div>
          <div class="equipment-durability"><div class="equipment-durability-fill" style="width:${((item.durability || 100) / (item.maxDurability || 100)) * 100}%"></div></div>
        </div>`}
      <div class="equipment-actions">
        ${!isEmpty ? button("Unequip", "unequipItem", { itemId: item.id }, true) : ""}
      </div>
    </article>`;
  }).join("");

  // ── Equipment Bonuses ──
  const bonuses = equipment.bonuses || {};
  const bonusEntries = Object.entries(bonuses).filter(([, v]) => v);
  const bonusesHtml = bonusEntries.map(([key, val]) => {
    const pct = key.endsWith("Pct") || key.includes("Rate") || key.includes("Chance") ? "%" : "";
    return `<span class="bonus-chip">+${number(val)}${pct} ${human(key)}</span>`;
  }).join("") || '<span class="muted">No equipment bonuses.</span>';

  // ── Set Bonuses ──
  const setBonuses = equipment.setBonuses || [];
  const setBonusesHtml = setBonuses.map((sb) => {
    return `<article class="set-bonus-card">
      <div class="set-bonus-header">
        <span class="set-bonus-name">${esc(sb.name || "Set Bonus")}</span>
        <span class="set-bonus-count">${sb.pieceCount || 0}pc</span>
      </div>
      <div class="set-bonus-stats">${esc(sb.description || sb.stats || "")}</div>
    </article>`;
  }).join("") || '<p class="muted">No active set bonuses.</p>';

  // ── Loot: Keys & Chests ──
  const keysHtml = KEY_TYPES.map((kt) => {
    const count = keys[kt] || 0;
    const price = (window.EQUIPMENT_WORLD_BANK_PRICES && window.EQUIPMENT_WORLD_BANK_PRICES.keys && window.EQUIPMENT_WORLD_BANK_PRICES.keys[kt]) || 0;
    return `<article class="loot-card">
      <div class="loot-item-name">${icon("loot", `key-${kt}`)}${esc(KEY_NAMES[kt] || kt)}</div>
      <div class="loot-item-count">${number(count)} owned</div>
      <div class="loot-item-required">Price: ${money(price)} each</div>
      <div class="loot-actions">
        ${button("Buy Key", "buyKey", { keyType: kt, qty: 1 }, n.money >= price)}
      </div>
    </article>`;
  }).join("");

  const chestsHtml = CHEST_TYPES.map((ct) => {
    const count = chests[ct] || 0;
    const price = (window.EQUIPMENT_WORLD_BANK_PRICES && window.EQUIPMENT_WORLD_BANK_PRICES.chests && window.EQUIPMENT_WORLD_BANK_PRICES.chests[ct]) || 0;
    const keyReq = (window.EQUIPMENT_CHESTS && window.EQUIPMENT_CHESTS[ct] && window.EQUIPMENT_CHESTS[ct].keyRequired) || [];
    const hasKey = keyReq.every((k) => (keys[k] || 0) > 0);
    return `<article class="loot-card">
      <div class="loot-item-name">${icon("loot", `chest-${ct}`)}${esc(CHEST_NAMES[ct] || ct)}</div>
      <div class="loot-item-count">${number(count)} owned</div>
      <div class="loot-item-required">Keys: ${keyReq.join(", ")} ${hasKey ? "✓" : "✗"}</div>
      <div class="loot-actions">
        ${button("Open Chest", "openChest", { chestKey: ct }, count > 0 && hasKey)}
        ${button("Buy Chest", "buyChest", { chestType: ct, qty: 1 }, n.money >= price)}
      </div>
    </article>`;
  }).join("");

  // ── Inventory Items ──
  const invEntries = normalizeEntries(inventory);
  const itemsByCategory = {};
  ITEM_CATEGORY_ORDER.forEach((cat) => { itemsByCategory[cat] = []; });
  itemsByCategory["Other"] = [];

  invEntries.forEach((item) => {
    const cat = item.category || "Other";
    if (!itemsByCategory[cat]) itemsByCategory[cat] = [];
    itemsByCategory[cat].push(item);
  });

  // Sort within each category by tier
  Object.keys(itemsByCategory).forEach((cat) => {
    itemsByCategory[cat].sort((a, b) => {
      const ta = TIER_ORDER.indexOf(a.tier || "Derelict");
      const tb = TIER_ORDER.indexOf(b.tier || "Derelict");
      const base = reverseTier ? tb - ta : ta - tb;
      if (base !== 0) return base;
      // Apply drag-drop order override
      const order = categoryOrders[cat] || [];
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return 0;
    });
  });

  const categoriesHtml = ITEM_CATEGORY_ORDER.filter((cat) => itemsByCategory[cat] && itemsByCategory[cat].length > 0).map((cat) => {
    const items = itemsByCategory[cat];
    const order = categoryOrders[cat] || [];
    const itemsHtml = items.map((item) => {
      const isInOrder = order.includes(item.id);
      return `<article class="inventory-item-card" data-item-id="${esc(item.id)}">
        <div class="inventory-item-header">
          <span class="inventory-item-name">${icon("item", item.icon || "item")}${esc(item.name || "Item")}</span>
          <span class="inventory-item-tier">${esc(item.tier || "Common")}</span>
        </div>
        <div class="inventory-item-stats">${esc(item.stats || "")} ${item.durability != null ? `• Durability: ${item.durability}/${item.maxDurability || 100}` : ""}</div>
        <div class="inventory-item-actions">
          ${item.category && item.category !== "Other" ? button("Equip", "equipItem", { itemId: item.id }, true) : button("Use", "useRepairItem", { itemId: item.id }, true)}
        </div>
      </article>`;
    }).join("");

    return `<div class="inventory-section">
      <div class="inventory-category-header">
        <span class="inventory-category-name">${esc(cat)}</span>
        <span class="inventory-category-count">${items.length} item${items.length !== 1 ? "s" : ""}</span>
      </div>
      <div class="inventory-grid">${itemsHtml}</div>
    </div>`;
  }).join("") || '<p class="muted">No inventory items.</p>';

  // ── Resources ──
  const resEntries = normalizeEntries(resources);
  const heldResources = resEntries.filter((r) => (r.count || 0) > 0);
  const resourcesHtml = heldResources.map((r) => {
    return `<div class="resource-row">
      <span class="resource-name">${icon("resource", r.icon || "resource")}${esc(r.name || r.key || "Resource")}</span>
      <span class="resource-count">${number(r.count || 0)}</span>
      <span class="resource-stage">${esc(r.stage || "raw")}</span>
    </div>`;
  }).join("") || '<p class="muted">No resources held.</p>';

  return `<section class="card promotion-card">
    <h2 style="margin:0 0 12px 0;display:flex;align-items:center;gap:8px;">${icon("inventory", "inventory")}Equipment</h2>
    <div class="equipment-grid">${slotsHtml}</div>
    <div class="equipment-bonuses">
      <h3 style="margin:0 0 8px 0;">Equipment Bonuses</h3>
      <div class="equipment-bonus-list">${bonusesHtml}</div>
    </div>
    <div class="set-bonuses">
      <h3 style="margin:0 0 8px 0;">Active Set Bonuses</h3>
      ${setBonusesHtml}
    </div>
  </section>

  <section class="card promotion-card inventory-section">
    <h2 style="margin:0 0 12px 0;display:flex;align-items:center;gap:8px;">${icon("loot", "loot")}Loot — Keys & Chests</h2>
    <div class="loot-grid">${keysHtml}${chestsHtml}</div>
  </section>

  <section class="card promotion-card inventory-section">
    <h2 style="margin:0 0 12px 0;display:flex;align-items:center;gap:8px;">${icon("item", "item")}Inventory Items</h2>
    ${categoriesHtml}
  </section>

  <section class="card promotion-card inventory-section">
    <h2 style="margin:0 0 12px 0;display:flex;align-items:center;gap:8px;">${icon("resource", "resource")}Resources</h2>
    <div class="resources-list">${resourcesHtml}</div>
  </section>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   SUB-TAB 4: STATS
   ═════════════════════════════════════════════════════════════════════════════ */

function renderStats(state, catalog) {
  const p = state.player || {};
  const n = state.nation || {};
  const pStats = p.statistics || {};
  const nStats = n.statistics || {};
  const wrestling = state.wrestling || {};
  const promotion = wrestling.promotion || {};
  const wStats = promotion.statistics || {};
  const sports = state.sports || {};
  const sportsTeams = sports.teams || {};

  // War stats (limited availability)
  const warsWon = nStats.warsWon || 0;
  const warsLost = nStats.warsLost || 0;
  const totalUnitsKilled = nStats.totalUnitsKilled || 0;
  const totalUnitsLost = nStats.totalUnitsLost || 0;

  // Sports stats per sport
  const sportsHtml = Object.entries(sportsTeams).map(([nationId, teams]) => {
    if (nationId !== n.id) return "";
    return Object.entries(teams).map(([sport, team]) => {
      const stats = team.stats || {};
      return `<tr>
        <td>${esc(human(sport))}</td>
        <td>${stats.wins || 0}</td>
        <td>${stats.losses || 0}</td>
        <td>${stats.draws || 0}</td>
        <td>${stats.championships || 0}</td>
        <td>${stats.totalInjuries || 0}</td>
      </tr>`;
    }).join("");
  }).join("") || '<tr><td colspan="6" class="muted">No sports teams.</td></tr>';

  // Wrestling stats
  const wrestlingHtml = `
    <tr><td>Weekly Shows Held</td><td>${wStats.showsHeld || 0}</td></tr>
    <tr><td>Total Matches</td><td>${wStats.totalMatches || 0}</td></tr>
    <tr><td>Monthly PPVs</td><td>${promotion.monthlyPpvHistory ? promotion.monthlyPpvHistory.length : 0}</td></tr>
    <tr><td>Mass PPV Wins</td><td>${wStats.massPpvWins || 0}</td></tr>
    <tr><td>Mass PPV Losses</td><td>${wStats.massPpvLosses || 0}</td></tr>
    <tr><td>Wrestling Injuries</td><td>${wStats.injuriesTotal || 0}</td></tr>
    <tr><td>Fans Gained</td><td>${number(wStats.fansGainedTotal || 0)}</td></tr>
    <tr><td>Total Revenue</td><td>${money(wStats.totalRevenue || 0)}</td></tr>
  `;

  return `<section class="card promotion-card">
    <h2 style="margin:0 0 12px 0;">${icon("stats", "stats")}Player Statistics</h2>
    <div class="metrics">
      <div class="metric"><small>Play Time</small><strong>${pStats.playTime || 0}</strong><p class="muted">turns played</p></div>
      <div class="metric"><small>Logins</small><strong>${number(pStats.loginsCount || 0)}</strong><p class="muted">times logged in</p></div>
      <div class="metric"><small>Nations Created</small><strong>${number(pStats.nationsCreated || 0)}</strong><p class="muted">nations founded</p></div>
      <div class="metric"><small>Battles Won</small><strong>${number(pStats.battlesWon || 0)}</strong><p class="muted">battles won</p></div>
      <div class="metric"><small>Battles Lost</small><strong>${number(pStats.battlesLost || 0)}</strong><p class="muted">battles lost</p></div>
      <div class="metric"><small>Alliances Formed</small><strong>${number(pStats.alliancesFormed || 0)}</strong><p class="muted">alliances created</p></div>
      <div class="metric"><small>Territories Claimed</small><strong>${number(pStats.territoriesClaimed || 0)}</strong><p class="muted">territories</p></div>
      <div class="metric"><small>Buildings Constructed</small><strong>${number(pStats.buildingsConstructed || 0)}</strong><p class="muted">buildings</p></div>
    </div>
  </section>

  <section class="card promotion-card">
    <h2 style="margin:0 0 12px 0;">${icon("stats", "stats")}Nation Statistics</h2>
    <div class="metrics">
      <div class="metric"><small>Total Turns</small><strong>${number(nStats.totalTurns || 0)}</strong></div>
      <div class="metric"><small>Wars Won</small><strong>${number(warsWon)}</strong></div>
      <div class="metric"><small>Wars Lost</small><strong>${number(warsLost)}</strong></div>
      <div class="metric"><small>Wars Fought</small><strong>${number(nStats.warsFought || 0)}</strong></div>
      <div class="metric"><small>Units Killed</small><strong>${number(totalUnitsKilled)}</strong></div>
      <div class="metric"><small>Units Lost</small><strong>${number(totalUnitsLost)}</strong></div>
      <div class="metric"><small>Treaties Signed</small><strong>${number(nStats.treatiesSigned || 0)}</strong></div>
      <div class="metric"><small>Research Completed</small><strong>${number(nStats.researchCompleted || 0)}</strong></div>
    </div>
    <div style="margin-top:16px;">
      <h3 style="margin:0 0 8px 0;">Additional Nation Stats</h3>
      <table class="stat-table">
        <tbody>
          <tr><td>Land Purchased</td><td>${number(nStats.landPurchased || 0)}</td></tr>
          <tr><td>Infra Purchased</td><td>${number(nStats.infraPurchased || 0)}</td></tr>
          <tr><td>Tech Purchased</td><td>${number(nStats.techPurchased || 0)}</td></tr>
          <tr><td>Missile Hits</td><td>${number(nStats.missileHits || 0)}</td></tr>
          <tr><td>Missile Misses</td><td>${number(nStats.missileMisses || 0)}</td></tr>
          <tr><td>Nuke Hits</td><td>${number(nStats.nukeHits || 0)}</td></tr>
          <tr><td>Nuke Misses</td><td>${number(nStats.nukeMisses || 0)}</td></tr>
          <tr><td>Immigrants Accepted</td><td>${number(nStats.immigrantsAccepted || 0)}</td></tr>
          <tr><td>Literacy Score</td><td>${number(nStats.literacyScore || 0)}</td></tr>
          <tr><td>Edicts Passed</td><td>${number(nStats.edictsPassed || 0)}</td></tr>
          <tr><td>Government Changes</td><td>${number(nStats.governmentChanges || 0)}</td></tr>
          <tr><td>Policies Enacted</td><td>${number(nStats.policiesEnacted || 0)}</td></tr>
          <tr><td>Religion Changes</td><td>${number(nStats.religionChanges || 0)}</td></tr>
          <tr><td>Forum Posts</td><td>${number(nStats.forumPostsTotal || 0)}</td></tr>
          <tr><td>Forum Threads</td><td>${number(nStats.forumThreadsCreated || 0)}</td></tr>
          <tr><td>Spy Missions</td><td>${number(nStats.spyMissions || 0)}</td></tr>
          <tr><td>Alliance Days</td><td>${number(nStats.allianceDays || 0)}</td></tr>
          <tr><td>War Days</td><td>${number(nStats.warDays || 0)}</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="card promotion-card">
    <h2 style="margin:0 0 12px 0;">${icon("stats", "stats")}War Statistics</h2>
    <p class="muted">Per-unit-type breakdowns require additional server-side data exposure.</p>
    <table class="stat-table per-unit-table">
      <thead><tr><th>Metric</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Wars Won</td><td>${number(warsWon)}</td></tr>
        <tr><td>Wars Lost</td><td>${number(warsLost)}</td></tr>
        <tr><td>Total Units Killed</td><td>${number(totalUnitsKilled)}</td></tr>
        <tr><td>Total Units Lost</td><td>${number(totalUnitsLost)}</td></tr>
      </tbody>
    </table>
  </section>

  <section class="card promotion-card">
    <h2 style="margin:0 0 12px 0;">${icon("stats", "stats")}Sports Statistics</h2>
    <table class="stat-table">
      <thead><tr><th>Sport</th><th>Wins</th><th>Losses</th><th>Draws</th><th>Championships</th><th>Injuries</th></tr></thead>
      <tbody>${sportsHtml}</tbody>
    </table>
  </section>

  <section class="card promotion-card">
    <h2 style="margin:0 0 12px 0;">${icon("stats", "stats")}Wrestling Statistics</h2>
    <table class="stat-table">
      <tbody>${wrestlingHtml}</tbody>
    </table>
  </section>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   SUB-TAB 5: SETTINGS
   ═════════════════════════════════════════════════════════════════════════════ */

function renderSettings(state, catalog) {
  const p = state.player || {};
  const settings = p.settings || {};
  const ui = settings.ui || {};
  const notifications = settings.notifications || {};
  const privacy = settings.privacy || {};

  return `<section class="card promotion-card settings-section">
    <h2 style="margin:0 0 12px 0;">${icon("settings", "settings")}Background Music</h2>
    <div class="settings-item">
      <div class="settings-item-label">Enable background music</div>
      <label class="settings-toggle"><input type="checkbox" name="musicEnabled" ${ui.musicEnabled ? "checked" : ""} data-action="settingsToggle" data-payload="${esc(JSON.stringify({group:"ui", key:"musicEnabled", value:true}))}"> <span>Music on/off</span></label>
    </div>
    <div class="settings-item">
      <div class="settings-item-label">Volume</div>
      <input type="range" name="musicVolume" min="0" max="100" step="1" value="${ui.musicVolume ?? 35}" data-action="settingsRange" data-payload="${esc(JSON.stringify({group:"ui", key:"musicVolume"}))}">
      <output id="music-volume-value">${Math.round((ui.musicVolume ?? 0.35) * 100)}%</output>
    </div>
  </section>

  <section class="card promotion-card settings-section">
    <h2 style="margin:0 0 12px 0;">${icon("settings", "settings")}Display & Accessibility</h2>
    <div class="settings-item">
      <div class="settings-item-label">Color theme</div>
      ${select("theme", { dark: "Dark (default)", light: "Light", sea: "Ocean", fire: "Fire", forest: "Forest", royal: "Royal", neon: "Neon", cyberpunk: "Cyberpunk", sunset: "Sunset", arctic: "Arctic" }, ui.theme || "dark")}
    </div>
    <div class="settings-item">
      <div class="settings-item-label">Text size</div>
      ${select("textSize", { normal: "Standard", large: "Larger text" }, ui.textSize || "normal")}
    </div>
    <div class="settings-item">
      <div class="settings-item-label">Reduce animations</div>
      <label class="settings-toggle"><input type="checkbox" name="reduceMotion" ${ui.reduceMotion ? "checked" : ""} data-action="settingsToggle" data-payload="${esc(JSON.stringify({group:"ui", key:"reduceMotion", value:true}))}"> <span>Reduce motion</span></label>
    </div>
  </section>

  <section class="card promotion-card settings-section">
    <h2 style="margin:0 0 12px 0;">${icon("settings", "settings")}Notifications</h2>
    ${["battles", "trade", "diplomacy", "research", "general"].map((key) => {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      return `<div class="settings-item">
        <div class="settings-item-label">${esc(label)} updates</div>
        <label class="settings-toggle"><input type="checkbox" name="notifications-${key}" ${notifications[key] ? "checked" : ""} data-action="settingsToggle" data-payload="${esc(JSON.stringify({group:"notifications", key, value:true}))}"> <span>${esc(label)}</span></label>
      </div>`;
    }).join("")}
  </section>

  <section class="card promotion-card settings-section">
    <h2 style="margin:0 0 12px 0;">${icon("settings", "settings")}Privacy</h2>
    ${["showOnline", "allowMessages", "showStatistics"].map((key) => {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      return `<div class="settings-item">
        <div class="settings-item-label">${esc(label)}</div>
        <label class="settings-toggle"><input type="checkbox" name="privacy-${key}" ${privacy[key] ? "checked" : ""} data-action="settingsToggle" data-payload="${esc(JSON.stringify({group:"privacy", key, value:true}))}"> <span>${esc(label)}</span></label>
      </div>`;
    }).join("")}
  </section>

  <section class="card promotion-card settings-section">
    <h2 style="margin:0 0 12px 0;">${icon("settings", "settings")}Custom Images</h2>
    <div class="settings-item">
      <div class="settings-item-label">Flag image</div>
      <input type="text" name="flagImage" value="${esc(ui.flagImage || "")}" placeholder="Image URL" data-action="settingsText" data-payload="${esc(JSON.stringify({group:"ui", key:"flagImage"}))}">
    </div>
    <div class="settings-item">
      <div class="settings-item-label">National food</div>
      <input type="text" name="nationalFood" value="${esc(ui.nationalFood || "")}" placeholder="Image URL" data-action="settingsText" data-payload="${esc(JSON.stringify({group:"ui", key:"nationalFood"}))}">
    </div>
    <div class="settings-item">
      <div class="settings-item-label">National water</div>
      <input type="text" name="nationalWater" value="${esc(ui.nationalWater || "")}" placeholder="Image URL" data-action="settingsText" data-payload="${esc(JSON.stringify({group:"ui", key:"nationalWater"}))}">
    </div>
    <div class="settings-item">
      <div class="settings-item-label">National pet</div>
      <input type="text" name="nationalPet" value="${esc(ui.nationalPet || "")}" placeholder="Image URL" data-action="settingsText" data-payload="${esc(JSON.stringify({group:"ui", key:"nationalPet"}))}">
    </div>
  </section>

  <section class="card promotion-card settings-section">
    <h2 style="margin:0 0 12px 0;">${icon("settings", "settings")}Inventory Layout</h2>
    <div class="settings-item">
      <div class="settings-item-label">Reverse tier ranking</div>
      <label class="settings-toggle"><input type="checkbox" name="inventoryReverseTier" ${(p.settings?.inventoryLayout?.reverseTierOrder) ? "checked" : ""} data-action="settingsToggle" data-payload="${esc(JSON.stringify({group:"inventory", key:"reverseTierOrder", value:true}))}"> <span>Show lowest tier items first</span></label>
    </div>
    <div class="settings-item">
      <div class="settings-item-label">Drag-drop reordering</div>
      <p class="muted">Drag items within each inventory category to reorder them. Order is saved automatically.</p>
    </div>
  </section>

  <section class="card promotion-card settings-section">
    <h2 style="margin:0 0 12px 0;">${icon("settings", "settings")}Your Session</h2>
    <div class="settings-item">
      <div class="settings-item-label">Player</div>
      <div class="settings-item-desc">${esc(p.username || "Unknown")}</div>
    </div>
    <div class="settings-item">
      <div class="settings-item-label">Nation</div>
      <div class="settings-item-desc">${esc(n.name || "Unknown")}</div>
    </div>
    <div class="settings-item">
      <div class="settings-item-label">Connection</div>
      <div class="settings-item-desc"><span class="badge good">Connected</span></div>
    </div>
    <div class="settings-actions">
      <button class="danger" id="logout-btn">Sign out</button>
    </div>
  </section>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   MAIN RENDER
   ═════════════════════════════════════════════════════════════════════════════ */

function renderUserTab(state, catalog, activeSubTab) {
  if (!activeSubTab || !SUBTABS.find((s) => s.key === activeSubTab)) {
    activeSubTab = "goals";
  }

  const n = state.nation || {};
  const p = state.player || {};

  const subTabsHtml = SUBTABS.map(
    (s) => `<button class="user-subtabs ${s.key === activeSubTab ? "active" : ""}" data-sub-tab="${esc(s.key)}">${icon("user", s.iconKey)}${esc(s.label)}</button>`,
  ).join("");

  let content = "";
  switch (activeSubTab) {
    case "goals":
      content = renderGoals(state, catalog);
      break;
    case "skills":
      content = renderSkills(state, catalog);
      break;
    case "inventory":
      content = renderInventory(state, catalog);
      break;
    case "stats":
      content = renderStats(state, catalog);
      break;
    case "settings":
      content = renderSettings(state, catalog);
      break;
    default:
      content = renderGoals(state, catalog);
  }

  return `${heading(
    "User Profile",
    `Manage your nation "${esc(n.name || "Unknown")}" — skills, equipment, inventory, stats, and settings.`,
  )}<div class="user-subtabs">${subTabsHtml}</div>${content}`;
}

window.UserTab = { render: renderUserTab };
