"use strict";
/**
 * Alliance Modals - Popup modals for the Alliance tab
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * All modals are pure HTML generators. They receive state (and the current
 * alliance when applicable) and return HTML strings rendered inside the
 * <dialog id="nation-dialog"> element by game.js.
 */

/* ═════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const number = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const money = (v) => "$" + number(v);
const human = (s) => String(s).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/^./, c => c.toUpperCase());

const input = (name, value, type = "text", extra = "") =>
  `<input name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" ${extra}>`;

const textarea = (name, value, extra = "") =>
  `<textarea name="${esc(name)}" ${extra}>${esc(value)}</textarea>`;

const select = (name, items, selected) => `<select name="${esc(name)}">${
  Object.entries(items).map(([k, v]) =>
    `<option value="${esc(k)}" ${k === selected ? "selected" : ""}>${esc(typeof v === "object" ? v.name : v)}</option>`
  ).join("")
}</select>`;

const colorSwatch = (color) => `<span class="color-swatch" style="background:${esc(color)};border:1px solid rgba(0,0,0,0.35);display:inline-block;width:20px;height:20px;border-radius:4px"></span>`;

/* ═════════════════════════════════════════════════════════════════════════════
   FOUND ALLIANCE MODAL
   ════════════════════════════════════════════════════════════════════════════ */

function allianceCreateModalContent(state) {
  const n = state.nation;
  const catalog = state.catalog;
  const defaultColor = catalog?.colors?.[n.factionKey]?.hex || "#ffffff";

  return `<form method="dialog" id="alliance-create-form" data-command="allianceCreate">
    <div class="modal-eyebrow">Found a new alliance</div>
    <h2 id="alliance-dialog-title">Create Alliance</h2>
    <p class="muted">Requires the Alliance Headquarters wonder, or a best friend and five friends with qualifying mutual treaties.</p>

    <div class="modal-body">
      <div class="form-stack">
        <div class="form-group">
          <label>Alliance name</label>
          ${input("name", "", "text", 'required minlength="3" maxlength="60" placeholder="Alliance name"')}
        </div>

        <div class="form-group">
          <label>Acronym</label>
          ${input("acronym", "", "text", 'maxlength="10" placeholder="e.g. TEST"')}
          <p class="help">Short tag shown next to the alliance name.</p>
        </div>

        <div class="form-group">
          <label>Charter &amp; description</label>
          ${textarea("description", "", 'maxlength="2000" placeholder="Describe your alliance."')}
        </div>

        <div class="form-group">
          <label>Government structure</label>
          ${select("government", {
            democratic: "Democratic Alliance",
            trio: "Triumvirate",
            autocratic: "Autocratic Alliance"
          }, "democratic")}
        </div>

        <div class="form-group">
          <label>Alliance color</label>
          ${input("color", defaultColor, "color")}
          <p class="help">Your alliance color. Nations whose faction color matches this color gain +5% tax revenue.</p>
        </div>
      </div>
    </div>

    <div class="row dialog-actions">
      <button value="cancel" autofocus>Cancel</button>
      <button class="primary">Found alliance</button>
    </div>
  </form>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   ALLIANCE SETTINGS MODAL (government / officers)
   ════════════════════════════════════════════════════════════════════════════ */

function allianceSettingsModalContent(state, a) {
  const catalog = state.catalog;
  const templates = catalog?.allianceTemplates || {};
  const colorChanged = a.colorChangedAt;
  const govChanged = a.governmentChangedAt;
  const now = Date.now();
  const COLOR_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
  const GOV_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;
  const colorReady = !colorChanged || (now - colorChanged) >= COLOR_COOLDOWN_MS;
  const govReady = !govChanged || (now - govChanged) >= GOV_COOLDOWN_MS;
  const colorLeft = colorReady ? 0 : Math.ceil(COLOR_COOLDOWN_MS - (now - colorChanged)) / (1000 * 60 * 60 * 24);
  const govLeft = govReady ? 0 : Math.ceil(GOV_COOLDOWN_MS - (now - govChanged)) / (1000 * 60 * 60 * 24);

  const govOptions = {};
  Object.entries(templates).forEach(([key, t]) => {
    if (key === "hiveMind") return;
    govOptions[key] = t.name || human(key);
  });

  return `<form method="dialog" id="alliance-settings-form" data-command="allianceEditSettings">
    <div class="modal-eyebrow">Alliance settings</div>
    <h2 id="alliance-dialog-title">Edit ${esc(a.name)}</h2>

    <div class="modal-body">
      <div class="form-stack">
        <div class="form-group">
          <label>Alliance name</label>
          ${input("name", a.name, "text", 'required minlength="3" maxlength="60"')}
        </div>

        <div class="form-group">
          <label>Acronym</label>
          ${input("acronym", a.acronym || "", "text", 'maxlength="10"')}
        </div>

        <div class="form-group">
          <label>Charter &amp; description</label>
          ${textarea("description", a.description || "", 'maxlength="2000"')}
        </div>

        <div class="form-group">
          <label>Alliance color</label>
          ${input("color", a.color || "#ffffff", "color")}
          <div class="row">${colorSwatch(a.color || "#ffffff")} <small>${esc(a.color || "#ffffff")}</small></div>
          <p class="help">${colorReady ? "Ready to change." : `Color change on cooldown — ${Math.ceil(colorLeft)} day(s) remaining.`}</p>
        </div>

        <div class="form-group">
          <label>Government structure</label>
          ${select("government", govOptions, a.government || "democratic")}
          <p class="help">${govReady ? "Ready to change." : `Government change on cooldown — ${Math.ceil(govLeft)} day(s) remaining.`}</p>
        </div>

        <div class="form-group">
          <label class="checkbox">
            ${input("open", a.open === true ? "on" : "off", "checkbox")} Accept membership applications
          </label>
        </div>
      </div>
    </div>

    <div class="row dialog-actions">
      <button value="cancel" autofocus>Cancel</button>
      <button class="primary ${(!colorReady || !govReady) ? "disabled" : ""}">Save settings</button>
    </div>
  </form>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   ALLIANCE SKILLS MODAL
   ════════════════════════════════════════════════════════════════════════════ */

function allianceSkillsModalContent(state, a) {
  const skills = window.AllianceSystem?.allianceSkills || {};
  const allianceSkills = a.skills || {};
  const skillPoints = a.skillPoints || 0;

  const costFor = (def, level) => Math.floor(def.baseCost * Math.pow(def.costMultiplier, level));

  let rows = "";
  Object.entries(skills).forEach(([key, def]) => {
    const cur = allianceSkills[key] || { level: 0, pointsSpent: 0 };
    const nextLevel = cur.level + 1;
    const maxed = cur.level >= def.maxLevel;
    const cost = maxed ? 0 : costFor(def, cur.level);
    const affordable = skillPoints >= cost && !maxed;

    rows += `<div class="skill-row">
      <div class="skill-info">
        <div class="skill-name">${esc(def.name)}</div>
        <div class="skill-desc">${esc(def.description)}</div>
        <div class="skill-meta">Level ${cur.level} / ${def.maxLevel} &#8226; ${cur.pointsSpent} SP spent</div>
      </div>
      <div class="skill-cost">${maxed ? "Maxed" : cost + " SP"}</div>
      <button class="primary ${affordable ? "" : "disabled"}" data-action="allianceUpgradeSkill" data-payload='${esc(JSON.stringify({ skill: key }))}' ${!affordable ? "disabled" : ""}>${maxed ? "Maxed" : "Upgrade"}</button>
    </div>`;
  });

  return `<div class="modal-body">
    <div class="modal-eyebrow">Alliance skills</div>
    <h2 id="alliance-dialog-title">Alliance Skills</h2>
    <div class="skill-points">Available skill points: <strong>${number(skillPoints)}</strong></div>
    <div class="form-stack">${rows || '<p class="muted">No skills available.</p>'}</div>
  </div>
  <div class="row dialog-actions"><button value="close" autofocus>Close</button></div>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   ALLIANCE MEMBER BREAKDOWN MODAL (population / economy)
   ════════════════════════════════════════════════════════════════════════════ */

function allianceMemberBreakdownModalContent(state, a) {
  const catalog = state.catalog;
  const members = Object.entries(a.members || {});
  let rows = "";
  let totalPop = 0, totalTax = 0, totalMoney = 0;
  members.forEach(([nationId, roleId]) => {
    const nation = state.nations?.find(x => x.id === nationId);
    if (!nation) return;
    const role = (catalog?.allianceTemplates?.[a.government]?.roles || []).find(r => r.id === roleId);
    totalPop += nation.population || 0;
    totalTax += nation.taxRevenue || 0;
    totalMoney += nation.money || 0;
    rows += `<tr>
      <td>${esc(nation.name)} ${nation.id === a.founder ? '<span class="badge">Founder</span>' : ""}</td>
      <td>${esc(role ? role.name : roleId)}</td>
      <td>${number(nation.population || 0)}</td>
      <td>${money(nation.taxRevenue || 0)}</td>
      <td>${money(nation.money || 0)}</td>
      <td>${number(nation.infra || 0)}</td>
      <td>${number(nation.tech || 0)}</td>
    </tr>`;
  });

  return `<div class="modal-body">
    <div class="modal-eyebrow">Member breakdown</div>
    <h2 id="alliance-dialog-title">Members</h2>
    <div class="summary">
      <div><strong>Members:</strong> ${members.length}</div>
      <div><strong>Total population:</strong> ${number(totalPop)}</div>
      <div><strong>Total tax revenue:</strong> ${money(totalTax)}</div>
      <div><strong>Total money:</strong> ${money(totalMoney)}</div>
    </div>
    <table>
      <thead><tr><th>Nation</th><th>Role</th><th>Population</th><th>Tax revenue</th><th>Money</th><th>Infra</th><th>Tech</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7" class="muted">No members.</td></tr>'}</tbody>
    </table>
  </div>
  <div class="row dialog-actions"><button value="close" autofocus>Close</button></div>`;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    allianceCreateModalContent,
    allianceSettingsModalContent,
    allianceSkillsModalContent,
    allianceMemberBreakdownModalContent
  };
}

window.AllianceModals = {
  allianceCreateModalContent,
  allianceSettingsModalContent,
  allianceSkillsModalContent,
  allianceMemberBreakdownModalContent
};
