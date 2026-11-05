"use strict";
/**
 * Nation Modals - Popup modals for the Nation tab
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * All modals are pure HTML generators. They receive state/catalog and return
 * HTML strings that are rendered inside <dialog> elements by game.js.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const number = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const money = (v) => "$" + number(v);
const human = (s) => String(s).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/^./, c => c.toUpperCase());

const button = (label, action, data, enabled = true, style = "primary") =>
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(JSON.stringify(data))}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;

const select = (name, items, selected, disabled = false) =>
  `<select name="${esc(name)}" ${disabled ? "disabled" : ""}>${
    Object.entries(items).map(([k, v]) =>
      `<option value="${esc(k)}" ${k === selected ? "selected" : ""}>${esc(typeof v === "object" ? v.name : v)}</option>`
    ).join("")
  }</select>`;

const input = (name, value, type = "text", extra = "") =>
  `<input name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" ${extra}>`;

/* ═══════════════════════════════════════════════════════════════════════════
   FLAG MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

function flagModalContent(state) {
  const n = state.nation;
  const currentFlag = n.flag;
  const flagImg = currentFlag && currentFlag.type === 'uploaded'
    ? currentFlag.data
    : (currentFlag && currentFlag.image) || '';
  const designed = currentFlag && currentFlag.type === 'designed';
  const flagPreview = flagImg
    ? `<img src="${esc(flagImg)}" class="flag-preview" alt="Current flag">`
    : designed
      ? designedFlagPreviewHTML(currentFlag)
      : `<div class="flag-preview empty">No flag</div>`;

  return `<form method="dialog" id="flag-modal-form">
    <div class="modal-eyebrow">Nation Flag</div>
    <h2 id="nation-dialog-title">Change Flag</h2>
    <p class="muted">Upload a custom flag image or design one with the flag builder.</p>

    <div class="modal-section">
      <h3>Current Flag</h3>
      <div class="flag-current">${flagPreview}</div>
      ${currentFlag ? button("Remove Flag", "flagRemove", {}, true, "danger") : ""}
    </div>

    <div class="modal-section">
      <h3>Upload Flag Image</h3>
      <label class="file-upload">
        ${input("flagFile", "", "file", 'accept="image/png,image/jpeg,image/svg+xml"')}
        <span class="file-label">Choose image</span>
      </label>
      <p class="help">PNG, JPG, or SVG. Max 2MB.</p>
    </div>

    <div class="modal-section">
      <h3>Flag Builder</h3>
      <p class="muted">Design a flag using colored stripes.</p>
      <div class="flag-builder">
        <div class="flag-canvas" id="flag-builder-canvas">
          ${designedFlagPreviewHTML(currentFlag) || '<span class="muted">Design a flag below to preview.</span>'}
        </div>
        <div class="flag-controls">
          <label>Stripe count
            <select name="stripeCount" id="builder-stripe-count">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3" selected>3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
            </select>
          </label>
          <label>Orientation
            <select name="stripeOrientation" id="builder-stripe-orientation">
              <option value="horizontal" selected>Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </label>
          <div class="color-picker-grid" id="stripe-color-pickers">
            ${colorPickersHTML(3, currentFlag)}
          </div>
        </div>
      </div>
      <button type="button" class="section" data-action="flagDesignPreview">Preview Design</button>
    </div>

    <div class="row dialog-actions">
      <button value="cancel">Cancel</button>
      <button value="save" class="primary" data-action="save-flag">Save Flag</button>
    </div>
  </form>`;
}

function flagDesignerModalContent(state) {
  const n = state.nation;
  const currentFlag = n.flag;

  return `<form method="dialog" id="flag-designer-modal-form">
    <div class="modal-eyebrow">Flag Designer</div>
    <h2 id="nation-dialog-title">Design Your Flag</h2>
    <p class="muted">Create a custom flag using patterns, symbols, and colors. You can also upload your own image.</p>

    <div class="modal-section flag-designer-container">
      <h3>Flag Designer</h3>
      <div id="flag-designer-root">${currentFlag ? '' : ''}</div>
    </div>

    <div class="row dialog-actions">
      <button value="cancel">Cancel</button>
      <button type="button" class="primary" data-action="flagDesignerSave">Save Flag</button>
    </div>
  </form>`;
}

function designedFlagPreviewHTML(flag) {
  if (!flag || flag.type !== 'designed') return '';
  const count = Math.max(1, Math.min(8, Number(flag.stripeCount) || 3));
  const orientation = flag.orientation || 'horizontal';
  const colors = (flag.colors || []).slice(0, count);
  const defaultColors = ['#ef4444', '#fbbf24', '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981'];
  const dir = orientation === 'horizontal' ? 'row' : 'column';
  const items = colors.map((c, i) => {
    const color = c || defaultColors[i % defaultColors.length];
    return `<span class="flag-stripe" style="flex:${orientation === 'horizontal' ? '1' : 'auto'};background:${esc(color)}"></span>`;
  }).join('');
  return `<div class="designed-flag" style="display:flex;flex-direction:${dir};width:100%;height:100%;border:1px solid var(--border);border-radius:4px;overflow:hidden">${items}</div>`;
}

function colorPickersHTML(count, currentFlag) {
  const colors = (currentFlag && currentFlag.type === 'designed' && currentFlag.colors) || [];
  const defaultColors = ['#ef4444', '#fbbf24', '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981'];
  return Array.from({ length: Math.max(1, Math.min(8, count)) }, (_, i) => {
    const color = colors[i] || defaultColors[i % defaultColors.length];
    return `<label class="color-picker">
      <input type="color" name="flagColor${i}" value="${esc(color)}">
      <span class="color-swatch" style="background:${esc(color)}"></span>
    </label>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════════════════
   GOVERNMENT / RELIGION MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

function govReligionModalContent(state, type) {
  const n = state.nation;
  const catalog = state.catalog;
  const isGov = type === 'government';
  const current = isGov ? n.government : n.religion;
  const defs = isGov ? catalog.governments : catalog.religions;
  const def = defs[current];

  const changeable = isGov
    ? (n.wonderEffects?.governmentChangeable && !n.projects?.governmentStatue) || (!n.projects?.governmentStatue)
    : (n.wonderEffects?.religionChangeable && !n.projects?.religiousStatue) || (!n.projects?.religiousStatue);
  const cooldown = isGov ? (n.wonderEffects?.governmentCooldown || 0) : (n.wonderEffects?.religionCooldown || 0);
  const daysRemaining = isGov ? (n.demandTimer?.governmentDaysRemaining || 0) : (n.demandTimer?.religionDaysRemaining || 0);
  const isDemanding = isGov ? n.demandTimer?.isDemandingGovernment : n.demandTimer?.isDemandingReligion;
  const hint = isGov ? n.demandTimer?.currentGovernmentHint : n.demandTimer?.currentReligionHint;

  const lockedByStatue = isGov ? !!n.projects?.governmentStatue : !!n.projects?.religiousStatue;
  const monumentUnlocked = isGov ? !!n.wonders?.governmentMonument : !!n.wonders?.religiousMonument;

  let canChange = changeable && cooldown <= 0;
  if (lockedByStatue && !monumentUnlocked) canChange = false;

  let optionsHtml = '';
  for (const [key, d] of Object.entries(defs)) {
    optionsHtml += `
      <div class="govrel-option ${key === current ? 'current' : ''}" data-key="${esc(key)}">
        <img src="${esc(d.image || '')}" class="govrel-icon" alt="${esc(d.name)}" onerror="this.style.display='none'">
        <span class="govrel-icon-fallback">${esc(d.icon || '🏛️')}</span>
        <div class="govrel-info">
          <div class="govrel-name">${esc(d.name)}</div>
          <div class="govrel-desc">${esc(d.description)}</div>
          ${d.hint ? `<div class="govrel-hint">Hint: ${esc(d.hint)}</div>` : ''}
        </div>
        ${key === current ? '<span class="govrel-badge">Current</span>' : ''}
      </div>`;
  }

  let statusHtml = '';
  if (isDemanding) {
    statusHtml = `<div class="govrel-demand"><strong>Public Demand:</strong> The people want a change!<br><em>${esc(hint || 'Change your ' + type)}</em><br><small>${Math.ceil(daysRemaining)} days to respond</small></div>`;
  } else if (cooldown > 0) {
    statusHtml = `<div class="govrel-cooldown"><strong>Cooldown:</strong> ${cooldown} days remaining before next ${type} change.</div>`;
  } else if (lockedByStatue && !monumentUnlocked) {
    const statueName = isGov ? 'Government Statue' : 'Religious Statue';
    const monumentName = isGov ? 'Government Monument' : 'Religious Monument';
    statusHtml = `<div class="govrel-locked"><strong>Locked:</strong> ${esc(statueName)} is built. Build the ${esc(monumentName)} wonder to unlock changes.</div>`;
  } else if (!canChange) {
    statusHtml = `<div class="govrel-locked"><strong>Locked:</strong> ${type} changes are not available yet.</div>`;
  }

  return `<form method="dialog" id="${type}-modal-form">
    <div class="modal-eyebrow">${isGov ? 'Government' : 'Religion'}</div>
    <h2 id="nation-dialog-title">Change ${isGov ? 'Government' : 'Religion'}</h2>
    ${statusHtml}
    <p class="muted">${esc(def?.description || '')}</p>

    <div class="govrel-grid">${optionsHtml}</div>

    <div class="row dialog-actions">
      <button value="cancel">Cancel</button>
      <button value="save" class="primary" data-action="save-${type}" ${!canChange ? 'disabled' : ''}>Change ${isGov ? 'Government' : 'Religion'}</button>
    </div>
  </form>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CULTURE MODAL (Food / Water / Pet)
   ═══════════════════════════════════════════════════════════════════════════ */

function cultureModalContent(state) {
  const n = state.nation;
  const catalog = state.catalog;

  const foodOptions = { pizza: 'Pizza', steak: 'Steak', cake: 'Cake', cookie: 'Cookie', burger: 'Burger', donut: 'Donut', hotdog: 'Hotdog', ramen: 'Ramen', salad: 'Salad', sushi: 'Sushi', taco: 'Taco' };
  const waterOptions = { water: 'Water', beer: 'Beer', coffee: 'Coffee', juice: 'Juice', milk: 'Milk', milkshake: 'Milkshake', smoothie: 'Smoothie', soda: 'Soda', wine: 'Wine', liquor: 'Liquor', 'energy-drink': 'Energy Drink' };

  return `<form method="dialog" id="culture-modal-form">
    <div class="modal-eyebrow">National Culture</div>
    <h2 id="nation-dialog-title">Food, Water & Pet</h2>
    <p class="muted">Cosmetic selections shown on your nation profile.</p>

    <div class="modal-section">
      <h3>National Food</h3>
      <div class="culture-grid">
        ${Object.entries(foodOptions).map(([key, label]) => `
          <label class="culture-item ${n.nationalFood === key ? 'selected' : ''}">
            <input type="radio" name="nationalFood" value="${esc(key)}" ${n.nationalFood === key ? 'checked' : ''}>
            <img src="${esc(catalog?.icon('Food', key) || '')}" class="culture-icon" alt="${esc(label)}" onerror="this.style.display='none'">
            <span class="culture-label">${esc(label)}</span>
          </label>`).join('')}
      </div>
    </div>

    <div class="modal-section">
      <h3>National Water</h3>
      <div class="culture-grid">
        ${Object.entries(waterOptions).map(([key, label]) => `
          <label class="culture-item ${n.nationalWater === key ? 'selected' : ''}">
            <input type="radio" name="nationalWater" value="${esc(key)}" ${n.nationalWater === key ? 'checked' : ''}>
            <img src="${esc(catalog?.icon('Water', key) || '')}" class="culture-icon" alt="${esc(label)}" onerror="this.style.display='none'">
            <span class="culture-label">${esc(label)}</span>
          </label>`).join('')}
      </div>
    </div>

    <div class="modal-section">
      <h3>National Pet</h3>
      <div class="culture-grid">
        <label class="culture-item ${n.nationalPet === 'none' || !n.nationalPet ? 'selected' : ''}">
          <input type="radio" name="nationalPet" value="none" ${n.nationalPet === 'none' || !n.nationalPet ? 'checked' : ''}>
          <span class="culture-icon">🚫</span><span class="culture-label">No Pet</span>
        </label>
        <label class="culture-item ${n.nationalPet === 'cat' ? 'selected' : ''}">
          <input type="radio" name="nationalPet" value="cat" ${n.nationalPet === 'cat' ? 'checked' : ''}>
          <span class="culture-icon">🐱</span><span class="culture-label">Cat</span>
        </label>
        <label class="culture-item ${n.nationalPet === 'dog' ? 'selected' : ''}">
          <input type="radio" name="nationalPet" value="dog" ${n.nationalPet === 'dog' ? 'checked' : ''}>
          <span class="culture-icon">🐶</span><span class="culture-label">Dog</span>
        </label>
        <label class="culture-item ${n.nationalPet === 'eagle' ? 'selected' : ''}">
          <input type="radio" name="nationalPet" value="eagle" ${n.nationalPet === 'eagle' ? 'checked' : ''}>
          <span class="culture-icon">🦅</span><span class="culture-label">Eagle</span>
        </label>
        <label class="culture-item ${n.nationalPet === 'lion' ? 'selected' : ''}">
          <input type="radio" name="nationalPet" value="lion" ${n.nationalPet === 'lion' ? 'checked' : ''}>
          <span class="culture-icon">🦁</span><span class="culture-label">Lion</span>
        </label>
        <label class="culture-item ${n.nationalPet === 'wolf' ? 'selected' : ''}">
          <input type="radio" name="nationalPet" value="wolf" ${n.nationalPet === 'wolf' ? 'checked' : ''}>
          <span class="culture-icon">🐺</span><span class="culture-label">Wolf</span>
        </label>
        <label class="culture-item ${n.nationalPet === 'dragon' ? 'selected' : ''}">
          <input type="radio" name="nationalPet" value="dragon" ${n.nationalPet === 'dragon' ? 'checked' : ''}>
          <span class="culture-icon">🐉</span><span class="culture-label">Dragon</span>
        </label>
      </div>
    </div>

    <div class="row dialog-actions">
      <button value="cancel">Cancel</button>
      <button value="save" class="primary" data-action="save-culture">Save Culture</button>
    </div>
  </form>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEVELOP MODAL (Land / Infra / Tech)
   ═══════════════════════════════════════════════════════════════════════════ */

function developModalContent(state) {
  const n = state.nation;
  const dev = state.development || {};

  return `<form method="dialog" id="develop-modal-form">
    <div class="modal-eyebrow">Development</div>
    <h2 id="nation-dialog-title">Purchase Levels</h2>
    <p class="muted">Buy land blocks, infrastructure, or technology levels.</p>

    <div class="dev-row">
      <div class="dev-col">
        <h3>🏞️ Land</h3>
        <div class="dev-value">${number(n.land)} miles</div>
        <div class="dev-cost">Cost: ${money(dev.land || 0)} per mile</div>
        <div class="dev-input">${input("devLandAmount", 1, "number", 'min="1" max="1000"')}<button type="button" class="section" data-action="developLand">Buy Land</button></div>
      </div>
      <div class="dev-col">
        <h3>🏗️ Infrastructure</h3>
        <div class="dev-value">${number(n.infra)}</div>
        <div class="dev-cost">Cost: ${money(dev.infra || 0)} per unit</div>
        <div class="dev-input">${input("devInfraAmount", 1, "number", 'min="1" max="1000"')}<button type="button" class="section" data-action="developInfra">Buy Infra</button></div>
      </div>
      <div class="dev-col">
        <h3>🔬 Technology</h3>
        <div class="dev-value">${number(n.tech)}</div>
        <div class="dev-cost">Cost: ${money(dev.tech || 0)} per level</div>
        <div class="dev-input">${input("devTechAmount", 1, "number", 'min="1" max="1000"')}<button type="button" class="section" data-action="developTech">Buy Tech</button></div>
      </div>
    </div>

    <div class="row dialog-actions"><button value="cancel">Close</button></div>
  </form>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   BUILD MODAL (Improvements / Projects / Wonders)
   ═══════════════════════════════════════════════════════════════════════════ */

function buildModalContent(state, category) {
  const n = state.nation;
  const catalog = state.catalog;
  const definitions = catalog.buildings?.[category] || {};
  const quotes = state.buildings?.[category] || {};

  const items = Object.entries(definitions).map(([key, def]) => {
    const q = quotes[key];
    const owned = q?.owned || 0;
    const canBuild = q?.canBuild || false;
    const canDestroy = q?.canDestroy || false;
    const cost = q?.cost || {};
    const reasons = q?.reasons || [];
    const destroyReasons = q?.destroyReasons || [];

    return `<article class="build-card ${canBuild ? 'available' : 'locked'} ${owned > 0 ? 'owned' : ''}" data-key="${esc(key)}">
      <div class="build-header">
        <div class="build-info">
          <div class="build-name">${esc(def.name)}</div>
          <div class="build-desc">${esc(def.description)}</div>
          <div class="build-effect">${esc(def.effect)}</div>
        </div>
        <div class="build-meta">
          <div class="build-count">${owned} / ${def.maxCount} owned</div>
          <div class="build-cost">${Object.entries(cost).filter(([, v]) => v > 0).map(([k, v]) => `${number(v)} ${human(k)}`).join(' • ') || 'Free'}</div>
        </div>
      </div>
      <div class="build-requirements">${[def.techRequired ? `Tech ${def.techRequired}` : '', def.requires ? `Requires ${human(def.requires)}` : '', def.bonusRequirement ? `${human(def.bonusRequirement)} bonus` : ''].filter(Boolean).join(' • ') || 'No prerequisites'}</div>
      <div class="build-actions">
        ${button("Build", "build", { category, key }, canBuild && owned < def.maxCount)}
        ${button("Demolish", "demolish", { category, key }, canDestroy && owned > 0, "")}
        ${!canDestroy && owned > 0 ? `<div class="build-reasons">${destroyReasons.join(' • ')}</div>` : `<div class="build-reasons">${reasons.join(' • ') || 'Ready to build'}</div>`}
      </div>
    </article>`;
  }).join('');

  return `<form method="dialog" id="build-modal-form">
    <div class="modal-eyebrow">${human(category)}</div>
    <h2 id="nation-dialog-title">Build ${human(category)}</h2>
    <p class="muted">Construct and manage your nation's ${human(category)}.</p>

    <div class="build-tabs">
      <button class="build-tab ${category === 'improvements' ? 'active' : ''}" data-build-cat="improvements">Improvements</button>
      <button class="build-tab ${category === 'projects' ? 'active' : ''}" data-build-cat="projects">Projects</button>
      <button class="build-tab ${category === 'wonders' ? 'active' : ''}" data-build-cat="wonders">Wonders</button>
    </div>

    <div class="build-grid">${items || '<p class="empty">No entries available.</p>'}</div>

    <div class="row dialog-actions"><button value="cancel">Close</button></div>
  </form>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   UNITS MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

function unitsModalContent(state) {
  const n = state.nation;
  const units = state.units || {};
  const catalog = state.catalog;

  const unitTypes = ["soldiers", "tanks", "aircraft", "ships", "spies", "missiles", "nukes"];
  const unitLabels = { soldiers: "Soldiers", tanks: "Tanks", aircraft: "Aircraft", ships: "Ships", spies: "Spies", missiles: "Missiles", nukes: "Nukes" };

  const recruitList = unitTypes.map(type => {
    const q = units[type] || {};
    const owned = q?.owned || 0;
    const capacity = q?.capacity || 0;
    const canBuy = q?.canBuy || false;
    const canSell = q?.canSell || false;
    const cost = q?.cost || {};
    const reasons = q?.reasons || [];
    const refund = q?.refund || 0;
    const techRequired = q?.techRequired || 0;
    const prerequisite = q?.prerequisite || null;

    return `<article class="unit-card">
      <div class="unit-header">
        <div class="unit-info">
          <div class="unit-name">${esc(q?.description || unitLabels[type])}</div>
          <div class="unit-count">${number(owned)} / ${number(capacity)}</div>
          <div class="unit-meta">${techRequired ? `Tech ${techRequired} required` : ''}${prerequisite ? ` · Requires ${human(prerequisite)}` : ''}</div>
        </div>
        <div class="unit-cost">${Object.entries(cost).filter(([, v]) => v > 0).map(([k, v]) => `${number(v)} ${human(k)}`).join(' • ') || 'Free'}</div>
      </div>
      <div class="unit-input">${input("unitAmount", 1, "number", 'min="1" max="1000000"')}${button("Buy", "buyUnit", { type, amount: 1 }, canBuy)}${button("Sell", "sellUnit", { type, amount: 1 }, canSell && owned > 0, "danger")}</div>
      <div class="unit-reasons">${reasons.join(' • ') || 'Ready to recruit'}</div>
      ${refund > 0 ? `<div class="unit-refund">Sale return: ${money(refund)} per unit</div>` : ''}
    </article>`;
  }).join('');

  // Efficiency breakdown
  const morale = n.nationStats?.militaryMorale || 1;
  const happiness = n.nationStats?.happiness || 50;
  const govBonus = n.governmentHappinessBonus || 1;
  const effRows = unitTypes.map(type => {
    const q = units[type] || {};
    const owned = q?.owned || 0;
    const baseEff = 100;
    let eff = baseEff * morale;
    eff = Math.round(eff * 100) / 100;
    return `<div class="eff-row">
      <span>${esc(unitLabels[type])}</span>
      <span>${number(owned)} owned</span>
      <span>${eff.toFixed(0)}% efficiency</span>
      <span class="eff-detail">morale ×${morale.toFixed(2)}</span>
    </div>`;
  }).join('');

  return `<form method="dialog" id="units-modal-form">
    <div class="modal-eyebrow">Military Units</div>
    <h2 id="nation-dialog-title">Train Units</h2>
    <p class="muted">Recruit and manage your military forces.</p>

    <div class="unit-tabs">
      <button class="unit-tab active" data-unit-tab="recruit">Recruit / Sell</button>
      <button class="unit-tab" data-unit-tab="efficiency">Efficiency</button>
    </div>

    <div class="unit-tab-panel active" id="unit-tab-recruit">
      <div class="unit-grid">${recruitList}</div>
    </div>

    <div class="unit-tab-panel hidden" id="unit-tab-efficiency">
      <p class="muted">Unit effectiveness is modified by military morale (happiness, government, wonders).</p>
      <div class="eff-grid">${effRows}</div>
      <div class="eff-note"><strong>Morale:</strong> ${(morale * 100).toFixed(0)}% &nbsp;|&nbsp; <strong>Happiness:</strong> ${Math.round(happiness)} &nbsp;|&nbsp; <strong>Government bonus:</strong> ×${govBonus.toFixed(2)}</div>
    </div>

    <div class="row dialog-actions"><button value="cancel">Close</button></div>
  </form>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   EDICTS MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

function edictsModalContent(state) {
  const n = state.nation;
  const EDICT_CATEGORIES = window.EDICT_CATEGORIES || {};
  const edicts = n.edicts || {};
  const unlocked = n.edictUnlocked || {};

  const categoryList = Object.entries(EDICT_CATEGORIES).map(([catKey, cat]) => {
    const currentStance = edicts[catKey] || Object.keys(cat.stances)[0];
    const isUnlocked = unlocked[catKey] !== false;
    const stanceDef = cat.stances[currentStance];

    return `<div class="edict-category ${!isUnlocked ? 'locked' : ''}">
      <div class="edict-cat-header">
        <span class="edict-cat-name">${esc(cat.name)}</span>
        <span class="edict-cat-desc">${esc(cat.description)}</span>
        ${!isUnlocked ? '<span class="edict-locked">LOCKED</span>' : ''}
      </div>
      <div class="edict-stances">
        ${Object.entries(cat.stances).map(([stanceKey, stance]) => {
          const isSelected = stanceKey === currentStance;
          const effectsHtml = Object.entries(stance.effects).map(([effKey, effVal]) => {
            const sign = effVal > 0 ? '+' : '';
            const isGood = !['pollution', 'disease', 'crime', 'upkeep', 'cost'].some(bad => effKey.includes(bad));
            const color = isGood ? '#10b981' : '#ef4444';
            return `<span class="edict-effect" style="color:${esc(color)}">${sign}${effVal} ${human(effKey)}</span>`;
          }).join('');
          return `<label class="edict-stance ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}">
            <input type="radio" name="edict-${esc(catKey)}" value="${esc(stanceKey)}" ${isSelected ? 'checked' : ''} ${!isUnlocked ? 'disabled' : ''}>
            <span class="edict-stance-name">${esc(stance.name)}</span>
            <span class="edict-stance-desc">${esc(stance.description)}</span>
            ${isSelected ? '<span class="edict-badge">Active</span>' : ''}
            ${effectsHtml}
          </label>`;
        }).join('')}
      </div>
      ${!isUnlocked ? `<p class="edict-lock-msg">Unlock requirements not met for this edict category.</p>` : ''}
    </div>`;
  }).join('');

  const anyLocked = Object.values(unlocked).some(v => v === false);

  return `<form method="dialog" id="edicts-modal-form">
    <div class="modal-eyebrow">Nation Edicts</div>
    <h2 id="nation-dialog-title">Edict Selection</h2>
    <p class="muted">Edicts are nation-wide policies. Changes have a 30-day cooldown. ${anyLocked ? 'Some categories are locked until requirements are met.' : ''}</p>

    <div class="edict-grid">${categoryList}</div>

    <div class="row dialog-actions">
      <button value="cancel">Cancel</button>
      <button value="save" class="primary" data-action="save-edicts">Save Edicts</button>
    </div>
  </form>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DIPLOMACY MODAL (Relationships + Treaties)
   ═══════════════════════════════════════════════════════════════════════════ */

function diplomacyModalContent(state) {
  const n = state.nation;
  const nations = state.nations?.filter(o => o.id !== n.id) || [];
  const catalog = state.catalog;
  const relationships = n.relationships || {};
  const diplomaticRelations = n.diplomaticRelations || {};
  const treaties = state.treaties || [];
  const treatyTypes = catalog?.treatyTypes || {};

  const relationTypes = ['friend', 'bestFriend', 'foe', 'nemesis'];
  const relationLabels = { friend: 'Friend', bestFriend: 'Best Friend', foe: 'Foe', nemesis: 'Nemesis' };
  const relationIcons = { friend: '🤝', bestFriend: '❤️', foe: '👊', nemesis: '💀' };

  const currentFriends = Object.entries(relationships).filter(([id, v]) => v === 'friend').map(([id]) => id);
  const currentFoes = Object.entries(relationships).filter(([id, v]) => v === 'foe').map(([id]) => id);
  const currentBestFriend = Object.entries(relationships).find(([id, v]) => v === 'bestFriend')?.[0] || null;
  const currentNemesis = Object.entries(relationships).find(([id, v]) => v === 'nemesis')?.[0] || null;

  const maxFriends = diplomaticRelations.maxFriends || 0;
  const maxFoes = diplomaticRelations.maxFoes || 0;
  const canBestFriend = diplomaticRelations.canSelectBestFriend || false;
  const canNemesis = diplomaticRelations.canSelectNemesis || false;

  // Treaty counts per type for this nation
  const treatyCounts = {};
  for (const t of treaties) treatyCounts[t.type] = (treatyCounts[t.type] || 0) + 1;

  const nationOptions = nations.map(nation => {
    const rel = relationships[nation.id] || 'neutral';
    const isCurrentBestFriend = nation.id === currentBestFriend;
    const isCurrentNemesis = nation.id === currentNemesis;
    const isFriend = currentFriends.includes(nation.id);
    const isFoe = currentFoes.includes(nation.id);

    const flagIcon = nation.factionKey && catalog?.icon ? catalog.icon('Colors', nation.factionKey) || '' : '';
    const flagFallback = nation.factionKey && catalog?.colors?.[nation.factionKey] ? catalog.colors[nation.factionKey].name?.[0] || '?' : '?';

    return `<div class="diplo-nation ${rel !== 'neutral' ? 'active' : ''}">
      <div class="diplo-nation-info">
        <img src="${esc(flagIcon)}" class="diplo-flag" alt="${esc(nation.name)}">
        <span class="diplo-flag-fallback">${esc(flagFallback)}</span>
        <span class="diplo-name">${esc(nation.name)}</span>
        <span class="diplo-rel rel-${esc(rel)}">${esc(relationLabels[rel] || 'Neutral')}</span>
      </div>
      <div class="diplo-actions">
        ${relationTypes.map(rt => {
          let disabled = false;
          let reason = '';
          if (rt === 'bestFriend' && !canBestFriend) { disabled = true; reason = 'Five embassies required'; }
          if (rt === 'nemesis' && !canNemesis) { disabled = true; reason = 'Five embassies required'; }
          if ((rt === 'friend' && isFriend) || (rt === 'foe' && isFoe) ||
              (rt === 'bestFriend' && isCurrentBestFriend) || (rt === 'nemesis' && isCurrentNemesis)) {
            disabled = true; reason = 'Already set';
          }
          if (rel === rt) { disabled = true; reason = 'Current'; }
          return `<button class="diplo-btn ${rt === 'bestFriend' ? 'bf' : rt === 'nemesis' ? 'nem' : rt === 'friend' ? 'fr' : 'fo'}"
            data-action="setRelation" data-payload="${esc(JSON.stringify({ target: nation.id, relationship: rt }))}"
            ${disabled ? 'disabled' : ''} title="${esc(reason)}">${esc(relationIcons[rt])}</button>`;
        }).join('')}
        ${rel !== 'neutral' ? `<button class="diplo-btn clear" data-action="setRelation" data-payload="${esc(JSON.stringify({ target: nation.id, relationship: 'neutral' }))}" title="Clear relationship">✕</button>` : ''}
      </div>
    </div>`;
  }).join('');

  const treatyList = Object.entries(treatyTypes).map(([key, def]) => {
    const count = treatyCounts[key] || 0;
    return `<div class="treaty-row"><span class="treaty-name">${esc(def.name)}</span><span class="treaty-count">${count} active</span><span class="treaty-desc">${esc(def.description)}</span></div>`;
  }).join('');

  return `<form method="dialog" id="diplomacy-modal-form">
    <div class="modal-eyebrow">Diplomatic Relations</div>
    <h2 id="nation-dialog-title">Friends, Foes &amp; Treaties</h2>
    <p class="muted">Manage your nation's relationships with other nations.</p>

    <div class="diplo-summary">
      <div class="diplo-stat"><span class="diplo-stat-label">Friends</span><span class="diplo-stat-value">${currentFriends.length} / ${maxFriends}</span></div>
      <div class="diplo-stat"><span class="diplo-stat-label">Foes</span><span class="diplo-stat-value">${currentFoes.length} / ${maxFoes}</span></div>
      <div class="diplo-stat"><span class="diplo-stat-label">Best Friend</span><span class="diplo-stat-value">${currentBestFriend ? nations.find(x => x.id === currentBestFriend)?.name || 'Unknown' : 'None'}</span></div>
      <div class="diplo-stat"><span class="diplo-stat-label">Nemesis</span><span class="diplo-stat-value">${currentNemesis ? nations.find(x => x.id === currentNemesis)?.name || 'Unknown' : 'None'}</span></div>
    </div>

    <div class="diplo-section">
      <h3>Treaty Types</h3>
      <div class="treaty-grid">${treatyList || '<p class="empty">No treaty types defined.</p>'}</div>
    </div>

    <div class="diplo-section">
      <h3>Nations</h3>
      <div class="diplo-grid">${nationOptions || '<p class="empty">No other nations found.</p>'}</div>
    </div>

    <div class="row dialog-actions"><button value="cancel">Close</button></div>
  </form>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   STATS DETAILED MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

function statsModalContent(state) {
  const n = state.nation;
  const nationStats = n.nationStats || {};
  const improvementEffects = n.improvementEffects || {};
  const projectEffects = n.projectEffects || {};
  const wonderEffects = n.wonderEffects || {};
  const edictEffects = n.edictEffects || {};

  const happiness = nationStats.happiness || 50;
  const crime = nationStats.crime || 0;
  const disease = nationStats.disease || 0;
  const pollution = nationStats.pollution || 0;
  const environment = nationStats.environment || 50;
  const literacy = nationStats.literacy || 0;

  const statBlocks = [
    { key: 'happiness', name: 'Happiness', value: Math.round(happiness), icon: '😊', breakdown: [
      `Base: 50`,
      `Edict effect: ${(edictEffects.happinessModifier || 0).toFixed(1)}`,
      `Pollution penalty: -${(pollution * 0.15).toFixed(1)}`,
      `Disease penalty: -${(disease * 0.20).toFixed(1)}`,
      `Crime penalty: -${(crime * 0.10).toFixed(1)}`,
      `Literacy bonus: +${(literacy * 0.10).toFixed(1)}`,
      `Government bonus: ×${(n.governmentHappinessBonus || 1).toFixed(2)}`,
      `Religion bonus: ×${(n.religionHappinessBonus || 1).toFixed(2)}`,
    ]},
    { key: 'crime', name: 'Crime', value: Math.round(crime), icon: '🚔', breakdown: [
      `Base: 15%`,
      `Police reduction: -${(improvementEffects.crimeReduction || 0) * 100 || 0}%`,
      `SWAT reduction: -${(projectEffects.swatCrimeReduction || 0) * 100 || 0}%`,
      `Casino increase: +${(improvementEffects.crimeIncrease || 0) * 100 || 0}%`,
      `Literacy effect: -${(literacy * 0.2).toFixed(1)}%`,
      `Happiness effect: -${((happiness - 50) * 0.1).toFixed(1)}%`,
    ]},
    { key: 'disease', name: 'Disease Rate', value: Math.round(disease), icon: '🦠', breakdown: [
      `Base: 10%`,
      `Pollution effect: +${(pollution * 0.5).toFixed(1)}%`,
      `Hospital reduction: -${(improvementEffects.diseaseReduction || 0) * 100 || 0}%`,
      `Universal Healthcare: -${(wonderEffects.universalHealthcareDiseaseReduction || 0) * 100 || 0}%`,
      `Environment effect: +${((50 - environment) * 0.2).toFixed(1)}%`,
    ]},
    { key: 'pollution', name: 'Pollution', value: Math.round(pollution), icon: '🏭', breakdown: [
      `Base: ${Math.floor((n.infra / 50) + (n.population / 200000))}`,
      `Mine pollution: +${((n.improvements?.mine || 0) * 2)}`,
      `Factory pollution: +${((n.improvements?.factory || 0) * 3)}`,
      `Recycling reduction: ${(improvementEffects.pollutionReduction || 0) * 100 || 0}%`,
    ]},
    { key: 'environment', name: 'Environment', value: Math.round(environment), icon: '🌳', breakdown: [
      `Base: ${100 - pollution}`,
      `Edict modifier: ${(edictEffects.environmentModifier || 0).toFixed(1)}`,
      `Tree plantation bonus: +${(improvementEffects.treeEnvironmentBonus || 0) * 5 || 0}`,
    ]},
    { key: 'literacy', name: 'Literacy Rate', value: Math.round(literacy), icon: '📚', breakdown: [
      `Tech base: ${Math.min(5000, n.tech + (n.sharedTechnology || 0))} levels`,
      `School bonus: +${(improvementEffects.literacyBonus || 0) * 100 || 0}%`,
      `University bonus: +${(projectEffects.universityLiteracyBonus || 0) * 100 || 0}%`,
    ]},
  ];

  const rows = statBlocks.map(s => `
    <div class="stat-detail">
      <div class="stat-detail-header">${s.icon} ${s.name} <span class="stat-detail-value">${s.value}${s.key === 'happiness' ? '' : '%'}</span></div>
      <ul class="stat-detail-list">${s.breakdown.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
    </div>
  `).join('');

  return `<form method="dialog" id="stats-modal-form">
    <div class="modal-eyebrow">Nation Statistics</div>
    <h2 id="nation-dialog-title">Detailed Stat Breakdown</h2>
    <p class="muted">Every factor currently affecting your nation's core statistics.</p>

    <div class="stat-detail-grid">${rows}</div>

    <div class="row dialog-actions"><button value="cancel">Close</button></div>
  </form>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   POPULATION DETAILED MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

function citizenSayText(citizen, nation) {
  if (window.CitizenDialogSystem) {
    return CitizenDialogSystem.generateCitizenDialog(citizen, nation);
  }
  // Fallback if system not loaded
  const h = citizen.happiness || 50;
  if (h >= 80) return "Life here is good.";
  if (h >= 60) return "Things are decent enough.";
  if (h >= 40) return "It gets by, but I worry.";
  return "I can't stand living here.";
}

function populationDetailedModalContent(state) {
  const n = state.nation;
  const nationStats = n.nationStats || {};
  const improvementEffects = n.improvementEffects || {};
  const projectEffects = n.projectEffects || {};
  const wonderEffects = n.wonderEffects || {};

  // ── Real data from PopulationSystem ──
  const popSys = window.PopulationSystem;
  const overview = popSys && typeof popSys.getPopulationOverview === 'function'
    ? popSys.getPopulationOverview()
    : null;

  const total = Math.max(1, n.population || (overview ? overview.totalPopulation : 0));
  const workforce = Math.floor(total * 0.6);
  const dependents = total - workforce;

  const foodCoverage = improvementEffects.foodCoverage || 0;
  const foodStackBonus = improvementEffects.foodStackBonus || 0;
  const foodTotal = foodCoverage + foodStackBonus;
  const foodPct = total > 0 ? Math.min(100, Math.round((foodTotal / total) * 100)) : 0;

  const waterCoverage = improvementEffects.waterCoverage || 0;
  const waterStackBonus = improvementEffects.waterStackBonus || 0;
  const waterTotal = waterCoverage + waterStackBonus;
  const waterPct = total > 0 ? Math.min(100, Math.round((waterTotal / total) * 100)) : 0;

  // ── Demographics from real PopulationSystem age groups ──
  let ageHtml = '';
  if (overview && overview.ageDistribution) {
    ageHtml = overview.ageDistribution.map((d) => {
      const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
      const taxable = d.taxable ? ' taxable' : '';
      const mil = d.militaryEligible ? ' military-eligible' : '';
      return `<div class="age-row${taxable}${mil}">
        <span>${human(d.ageGroup)}</span>
        <span class="age-count">${number(d.count)}</span>
        <span class="age-pct">${pct}%</span>
        <div class="age-bar"><div class="age-bar-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');
  } else {
    const ageGroups = (popSys && popSys.ageGroups) || {};
    ageHtml = Object.entries(ageGroups).map(([key, data]) => {
      const count = data.count || 0;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return `<div class="age-row"><span>${human(key)}</span><span class="age-count">${number(count)}</span><span class="age-pct">${pct}%</span><div class="age-bar"><div class="age-bar-fill" style="width:${pct}%"></div></div></div>`;
    }).join('');
  }

  // ── Real employment / education / vital stats ──
  const empStat = overview ? overview.employment : { workforce: 0, employed: 0, unemployed: 0, unemploymentRate: '0', laborParticipation: '0' };
  const eduStat = overview ? overview.education : { noEducation: '0', primary: '0', secondary: '0', higher: '0', progressingCount: 0 };
  const vitalStat = overview ? overview.vitalStatistics : { birthRate: '0', deathRate: '0', migrationPolicy: 'balanced', dailyGrowthRate: '0', naturalGrowthRate: '0' };

  // ── Citizens from real PopulationSystem ──
  const allCitizens = popSys && popSys.citizens
    ? Array.from(popSys.citizens.values()).filter(c => c.nationId === n.id || c.nationId === n.name)
    : [];
  const citizensHtml = allCitizens.map(c => {
    const job = c.job ? ` · ${esc(c.job.title || c.occupation)} (L${c.job.level || '?'})` : '';
    const employed = c.isEmployed ? 'Employed' : 'Unemployed';
    const retired = c.isRetired ? ' · Retired' : '';
    const military = c.isMilitary ? ` · Military (${esc(c.unitType || 'unit')})` : '';
    const healthCls = c.health >= 70 ? 'good' : c.health >= 40 ? 'warn' : 'bad';
    const happyCls = c.happiness >= 70 ? 'good' : c.happiness >= 40 ? 'warn' : 'bad';
    const loyCls = c.loyalty >= 70 ? 'good' : c.loyalty >= 40 ? 'warn' : 'bad';
    return `<div class="citizen-card">
      <div class="citizen-info">
        <div class="citizen-name">${esc(c.name)}</div>
        <div class="citizen-meta">Age ${c.age} · ${esc(c.ageGroup || 'adult')} · ${esc(c.gender || '?')} · ${esc(employed)}${retired}${military}${job}</div>
        <div class="citizen-meta">Income ${money(c.income || 0)} · Wealth ${money(c.wealth || 0)} · Class ${esc(c.socialClass || 'lower')}</div>
        <div class="citizen-meta">Education ${esc(c.education || 'none')} · Literacy ${Math.round(c.literacyScore || 0)} · Health <span class="citizen-status ${healthCls}">${Math.round(c.health || 100)}</span> · Happiness <span class="citizen-status ${happyCls}">${Math.round(c.happiness || 50)}</span> · Loyalty <span class="citizen-status ${loyCls}">${Math.round(c.loyalty || 0)}</span></div>
      </div>
      <div class="citizen-say">“${citizenSayText(c, n)}”</div>
      <div class="citizen-religion">Faith: ${esc(c.religion || n.religion || 'none')} · Ethnicity: ${esc(c.ethnicity || 'mixed')}</div>
    </div>`;
  }).slice(0, 200).join('') || '<p class="empty">No citizens found. Citizens are generated as your population grows.</p>';

  // ── Jobs from real CitizenJobSystem ──
  let jobsHtml = '';
  if (window.CitizenJobSystem && typeof window.CitizenJobSystem.getJobDistribution === 'function') {
    const dist = window.CitizenJobSystem.getJobDistribution(allCitizens);
    const jobKeys = Object.keys(dist);
    if (jobKeys.length > 0) {
      jobsHtml = jobKeys.map(key => {
        const j = dist[key];
        return `<div class="job-row">
          <span>${esc(j.title)} (${esc(j.buildingType)})</span>
          <span>Tier ${j.tier} · Level ${j.level}</span>
          <span>${number(j.count)} workers</span>
          <span>${money(Math.round(j.totalIncome / Math.max(1, j.count)))} avg income</span>
        </div>`;
      }).join('');
    } else {
      jobsHtml = '<p class="muted">No citizens currently employed.</p>';
    }
  } else {
    jobsHtml = '<p class="muted">Citizen Job System not available.</p>';
  }

  return `<form method="dialog" id="population-detailed-modal-form">
    <div class="modal-eyebrow">Population Details</div>
    <h2 id="nation-dialog-title">Population Breakdown</h2>

    <div class="pop-tabs">
      <button class="pop-tab active" data-pop-tab="demographics">Demographics</button>
      <button class="pop-tab" data-pop-tab="jobs">Jobs</button>
      <button class="pop-tab" data-pop-tab="citizens">Citizens</button>
    </div>

    <div class="pop-tab-panel active" id="pop-tab-demographics">
      <div class="pop-summary">
        <div class="pop-stat"><span class="pop-stat-label">Total Population</span><span class="pop-stat-value">${number(total)}</span></div>
        <div class="pop-stat"><span class="pop-stat-label">Taxable Population</span><span class="pop-stat-value">${number(overview ? overview.taxablePopulation : 0)}</span></div>
        <div class="pop-stat"><span class="pop-stat-label">Workforce</span><span class="pop-stat-value">${number(empStat.workforce)}</span><span class="pop-stat-sub">${empStat.unemploymentRate}% unemployed</span></div>
        <div class="pop-stat"><span class="pop-stat-label">Dependents</span><span class="pop-stat-value">${number(dependents)}</span></div>
        <div class="pop-stat"><span class="pop-stat-label">Literacy</span><span class="pop-stat-value">${number(nationStats.literacy)}%</span></div>
      </div>
      <div class="pop-stat-grid">
        <div class="pop-stat"><span class="pop-stat-label">Birth Rate</span><span class="pop-stat-value">${vitalStat.birthRate}%</span></div>
        <div class="pop-stat"><span class="pop-stat-label">Death Rate</span><span class="pop-stat-value">${vitalStat.deathRate}%</span></div>
        <div class="pop-stat"><span class="pop-stat-label">Daily Growth</span><span class="pop-stat-value">${vitalStat.dailyGrowthRate}%</span></div>
        <div class="pop-stat"><span class="pop-stat-label">Migration Policy</span><span class="pop-stat-value">${human(vitalStat.migrationPolicy)}</span></div>
      </div>
      <div class="pop-section"><h3>Age Distribution</h3><div class="age-grid">${ageHtml}</div></div>
      <div class="pop-section"><h3>Education</h3>
        <div class="pop-row"><span>No education:</span><span>${eduStat.noEducation}%</span></div>
        <div class="pop-row"><span>Primary:</span><span>${eduStat.primary}%</span></div>
        <div class="pop-row"><span>Secondary:</span><span>${eduStat.secondary}%</span></div>
        <div class="pop-row"><span>Higher:</span><span>${eduStat.higher}%</span></div>
        ${eduStat.progressingCount > 0 ? `<div class="pop-row"><span>In education:</span><span>${eduStat.progressingCount} progressing</span></div>` : ''}
      </div>
      <div class="pop-section"><h3>Food & Water Coverage</h3>
        <div class="coverage-row">
          <div class="coverage-item"><span class="coverage-label">Food</span><span class="coverage-value">${foodPct}%</span><div class="coverage-bar"><div class="coverage-bar-fill ${foodPct >= 100 ? 'full' : ''}" style="width:${foodPct}%"></div></div><span class="coverage-detail">${number(foodTotal)} / ${number(total)} covered</span></div>
          <div class="coverage-item"><span class="coverage-label">Water</span><span class="coverage-value">${waterPct}%</span><div class="coverage-bar"><div class="coverage-bar-fill ${waterPct >= 100 ? 'full' : ''}" style="width:${waterPct}%"></div></div><span class="coverage-detail">${number(waterTotal)} / ${number(total)} covered</span></div>
        </div>
      </div>
    </div>

    <div class="pop-tab-panel hidden" id="pop-tab-jobs">
      <p class="muted">Citizen jobs are assigned based on your buildings, projects, and wonders. Each job's income is modified by nation literacy, tech, happiness, crime, and disease.</p>
      <div class="jobs-list" id="pop-jobs-list">${jobsHtml}</div>
    </div>

    <div class="pop-tab-panel hidden" id="pop-tab-citizens">
      <p class="muted">View individual citizens of your nation. Each citizen speaks based on their stats and your government/religion. Showing up to 200 citizens.</p>
      <div class="citizens-list" id="pop-citizens-list">${citizensHtml}</div>
    </div>

    <div class="row dialog-actions"><button value="cancel">Close</button></div>
  </form>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DISEASE MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

function diseaseModalContent(state) {
  const n = state.nation;
  const diseaseSys = window.DiseaseSystem;
  const outbreaks = diseaseSys ? diseaseSys.getNationOutbreaks(n.id) : [];
  const nationStats = n.nationStats || {};

  const diseaseRate = nationStats.disease || 0;
  const pollution = nationStats.pollution || 0;
  const diseaseSpawnChance = Math.min(50, Math.max(0, diseaseRate * 0.5 + pollution * 0.3));

  const outbreakList = outbreaks.map(o => {
    const d = o.disease;
    return `<article class="disease-outbreak">
      <div class="disease-header"><span class="disease-name">${esc(d.name)}</span><span class="disease-severity ${d.severity}">${esc(d.severity)}</span></div>
      <div class="disease-desc">${esc(d.description || '')}</div>
      <div class="disease-effects">${Object.entries(d.effects || {}).map(([k, v]) => `<span class="disease-effect">${v > 0 ? '+' : ''}${v} ${human(k)}</span>`).join('')}</div>
      <button class="section danger" data-action="cureDisease" data-payload="${esc(JSON.stringify({ outbreakId: o.id }))}">Cure Disease ($500,000)</button>
    </article>`;
  }).join('');

  return `<form method="dialog" id="disease-modal-form">
    <div class="modal-eyebrow">National Disease</div>
    <h2 id="nation-dialog-title">Disease Control</h2>
    <p class="muted">Monitor and treat diseases affecting your nation.</p>

    <div class="disease-stats">
      <div class="disease-stat"><span class="disease-stat-label">Disease Rate</span><span class="disease-stat-value">${number(diseaseRate)}%</span></div>
      <div class="disease-stat"><span class="disease-stat-label">Spawn Chance</span><span class="disease-stat-value">${diseaseSpawnChance.toFixed(1)}% per check</span></div>
      <div class="disease-stat"><span class="disease-stat-label">Active Outbreaks</span><span class="disease-stat-value">${outbreaks.length}</span></div>
    </div>

    <div class="disease-section"><h3>Active Outbreaks</h3>${outbreakList || '<p class="empty">No active disease outbreaks.</p>'}</div>

    <div class="disease-section">
      <h3>Disease Prevention</h3>
      <p class="muted">Hospitals, Universal Healthcare wonder, and high environment reduce disease.</p>
      <div class="disease-tips">
        <span class="disease-tip">🏥 Each hospital reduces disease by 5%</span>
        <span class="disease-tip">🏥 Universal Healthcare reduces disease by 35%</span>
        <span class="disease-tip">🌳 Tree plantations and recycling centers reduce pollution</span>
        <span class="disease-tip">🏭 Factories and industry increase pollution</span>
      </div>
    </div>

    <div class="row dialog-actions"><button value="cancel">Close</button></div>
  </form>`;
}

window.NationModals = {
  flagModalContent,
  govReligionModalContent,
  cultureModalContent,
  developModalContent,
  buildModalContent,
  unitsModalContent,
  edictsModalContent,
  diplomacyModalContent,
  populationDetailedModalContent,
  diseaseModalContent,
  statsModalContent
};
