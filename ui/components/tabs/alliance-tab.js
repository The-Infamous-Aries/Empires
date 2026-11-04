"use strict";
/**
 * Alliance Tab - Sovereignty Epochs
 * Renders the Alliance tab content.
 *
 * Exports: renderAllianceTab(state) -> HTML string
 */

/* ═════════════════════════════════════════════════════════════════════════════
   LOCAL UI HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const human = (value) =>
  String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
const number = (value) =>
  Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const money = (value) => "$" + number(value);
const button = (label, action, data, enabled = true, style = "primary") =>
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(JSON.stringify(data))}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;
const input = (name, value, type = "text", extra = "") =>
  `<input name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" ${extra}>`;
const textarea = (name, value, extra = "") =>
  `<textarea name="${esc(name)}" ${extra}>${esc(value)}</textarea>`;
const select = (name, items, selected, disabled = false) =>
  `<select name="${esc(name)}" ${disabled ? "disabled" : ""}>${
    Object.entries(items).map(([k, v]) =>
      `<option value="${esc(k)}" ${k === selected ? "selected" : ""}>${esc(typeof v === "object" ? v.name : v)}</option>`
    ).join("")
  }</select>`;
const badge = (text, kind = "") =>
  `<span class="badge ${kind}">${esc(text)}</span>`;
const empty = (text) => `<p class="muted">${esc(text)}</p>`;
const heading = (title, desc, icon) =>
  `<div class="page-heading"><div class="eyebrow section">${esc(icon)}</div><h1>${esc(title)}</h1>${desc ? `<p class="help">${esc(desc)}</p>` : ""}</div>`;
const colorSwatch = (color) => `<span class="color-swatch" style="background:${esc(color)};border:1px solid rgba(0,0,0,0.25);display:inline-block;width:16px;height:16px;border-radius:50%;vertical-align:middle;margin-right:6px"></span>`;

function nationName(id, state) {
  const x = state.nations?.find((n) => n.id === id);
  return x ? x.name : "Unknown";
}

/* ═════════════════════════════════════════════════════════════════════════════
   RENDER
   ════════════════════════════════════════════════════════════════════════════ */

function renderAllianceTab(state) {
  const n = state.nation;
  const catalog = state.catalog;
  const a = state.alliances?.find((x) => x.id === n.allianceId) || null;
  const canFound = state.canFoundAlliance === true;
  const templates = catalog?.allianceTemplates || {};
  const subtab = sessionStorage.getItem("allianceSubtab") || "overview";

  const can = (permission) =>
    a && (a.permissions?.includes("all") || a.permissions?.includes(permission));
  const isFounder = a ? a.founder === n.id : false;
  const memberCount = a ? Object.keys(a.members).length : 0;

  /* ── No alliance ── */
  if (!a) {
    const list = state.alliances?.length
      ? state.alliances
        .map((x) => {
          const t = templates[x.government];
          return `<article class="card"><div class="row spread"><h2>${esc(x.name)}</h2>${badge(x.open ? "Recruiting" : "Closed")}</div>
          <p>${esc(x.description || "No description.")}</p>
          <p class="muted">${esc((t && t.name) || x.government)} &#8226; ${memberCountOf(x)} / 6 members</p>
          <div class="section">${button(x.applications?.includes(n.id) ? "Application pending" : "Apply to join", "allianceApply", { id: x.id }, x.open && !x.applications?.includes(n.id) && !n.allianceId)}</div>
        </article>`;
        })
        .join("")
      : empty("No alliances have formed yet.");

    return `${heading("Alliance hall", "Find your people. Coordinate diplomacy, pool resources, and build lasting partnerships.", "Stronger together")}
    <div class="two-column">
      <section class="stack">${list}</section>
      <section class="card">
        <h2>Found an alliance</h2>
        <p class="help">Requires the Alliance Headquarters wonder, or a best friend and five friends with qualifying mutual treaties.</p>
        ${button("Found alliance", "openAllianceCreateModal", {}, canFound)}
        ${!canFound
          ? `<p class="help">You cannot found an alliance yet. Build the Alliance Headquarters wonder, or meet the diplomatic founding conditions (best friend + 5 friends with mutual pacts).</p>`
          : ""}
      </section>
    </div>`;
  }

  /* ── In alliance ── */
  const t = templates[a.government];
  const roles = (t && t.roles) || [];
  const myRoleId = a.members[n.id];
  const myRole = roles.find((r) => r.id === myRoleId);
  const govDef = window.AllianceSystem?.governmentTemplates?.[a.government] || t;

  const stats = a.statistics || {};
  const warRecord = {
    won: stats.warsWon || 0,
    lost: stats.warsLost || 0,
  };
  warRecord.total = warRecord.won + warRecord.lost;
  warRecord.rate = warRecord.total ? ((warRecord.won / warRecord.total) * 100).toFixed(0) : 0;

  const treaties = a.treaties || [];

  /* Combined military units */
  const unitTypes = ["soldiers", "tanks", "aircraft", "ships", "spies", "missiles", "nukes"];
  const unitLabels = { soldiers: "Soldiers", tanks: "Tanks", aircraft: "Aircraft", ships: "Ships", spies: "Spies", missiles: "Missiles", nukes: "Nukes" };
  const totals = {};
  unitTypes.forEach((k) => { totals[k] = 0; });
  Object.keys(a.members).forEach((nationId) => {
    const x = state.nations?.find((m) => m.id === nationId);
    if (!x) return;
    const units = x.militaryUnits || {};
    unitTypes.forEach((k) => { totals[k] += Number(units[k] || 0); });
  });
  const grandTotal = unitTypes.reduce((s, k) => s + totals[k], 0);

  /* Member breakdown */
  const breakdown = Object.entries(a.members).map(([nationId, roleId]) => {
    const x = state.nations?.find((m) => m.id === nationId);
    const role = roles.find((r) => r.id === roleId);
    if (!x) return null;
    return {
      nationId, name: x.name, role: role ? role.name : roleId,
      population: x.population || 0, taxRevenue: x.taxRevenue || 0, money: x.money || 0,
      infra: x.infra || 0, tech: x.tech || 0, land: x.land || 0,
      founder: x.id === a.founder
    };
  }).filter(Boolean).sort((a1, b1) => b1.taxRevenue - a1.taxRevenue);
  const totalPop = breakdown.reduce((s, m) => s + m.population, 0);
  const totalTax = breakdown.reduce((s, m) => s + m.taxRevenue, 0);

  /* Cooldowns */
  const now = Date.now();
  const COLOR_CD = 30 * 24 * 60 * 60 * 1000;
  const GOV_CD = 90 * 24 * 60 * 60 * 1000;
  const colorChanged = a.colorChangedAt || 0;
  const govChanged = a.governmentChangedAt || 0;
  const colorReady = !colorChanged || now - colorChanged >= COLOR_CD;
  const govReady = !govChanged || now - govChanged >= GOV_CD;
  const colorLeft = colorReady ? 0 : Math.ceil((COLOR_CD - (now - colorChanged)) / (1000 * 60 * 60 * 24));
  const govLeft = govReady ? 0 : Math.ceil((GOV_CD - (now - govChanged)) / (1000 * 60 * 60 * 24));

  const subTabs = [
    { key: "overview", label: "Overview" },
    { key: "government", label: "Government" },
    { key: "members", label: "Members" },
    { key: "skills", label: "Skills" },
    { key: "diplomacy", label: "Diplomacy" },
    { key: "military", label: "Military" },
  ];

  const renderSubTab = () => {
    switch (subtab) {
      case "overview": return renderOverview();
      case "government": return renderGovernment();
      case "members": return renderMembers();
      case "skills": return renderSkills();
      case "diplomacy": return renderDiplomacy();
      case "military": return renderMilitary();
      default: return renderOverview();
    }
  };

  function renderOverview() {
    return `<div class="alliance-overview">
      <div class="overview-grid">
        <div class="overview-section">
          <h4>Alliance</h4>
          <div class="info-grid">
            <div class="info-item"><label>Name</label><span>${esc(a.name)} ${a.acronym ? `<span class="acronym">[${esc(a.acronym)}]</span>` : ""}</span></div>
            <div class="info-item"><label>Color</label><span>${colorSwatch(a.color)} ${esc(a.color || "#ffffff")}</span></div>
            <div class="info-item"><label>Government</label><span>${esc((t && t.name) || a.government)}</span></div>
            <div class="info-item"><label>Founded</label><span>${new Date(a.createdAt || a.founded || 0).toLocaleDateString()}</span></div>
            <div class="info-item"><label>Level</label><span>${a.level || 1}</span></div>
            <div class="info-item"><label>Skill points</label><span>${a.skillPoints || 0}</span></div>
          </div>
          <div class="description"><strong>Charter:</strong> ${esc(a.description || "No description provided.")}</div>
        </div>

        <div class="overview-section">
          <h4>War record</h4>
          <div class="stats-grid">
            <div class="stat-item"><span class="stat-value">${warRecord.won}</span><span class="stat-label">Wars won</span></div>
            <div class="stat-item"><span class="stat-value">${warRecord.lost}</span><span class="stat-label">Wars lost</span></div>
            <div class="stat-item"><span class="stat-value">${warRecord.rate}%</span><span class="stat-label">Win rate</span></div>
            <div class="stat-item"><span class="stat-value">${treaties.length}</span><span class="stat-label">Treaties</span></div>
          </div>
        </div>

        <div class="overview-section">
          <h4>Combined forces</h4>
          <div class="stats-grid">
            ${unitTypes.map((k) => `<div class="stat-item"><span class="stat-value">${number(totals[k] || 0)}</span><span class="stat-label">${unitLabels[k]}</span></div>`).join("")}
          </div>
        </div>

        <div class="overview-section">
          <h4>Alliance economy</h4>
          <div class="stats-grid">
            <div class="stat-item"><span class="stat-value">${number(totalPop)}</span><span class="stat-label">Combined population</span></div>
            <div class="stat-item"><span class="stat-value">${money(totalTax)}</span><span class="stat-label">Combined tax revenue</span></div>
            <div class="stat-item"><span class="stat-value">${money(a.treasury || 0)}</span><span class="stat-label">Alliance treasury</span></div>
            <div class="stat-item"><span class="stat-value">${memberCount} / 6</span><span class="stat-label">Members</span></div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderGovernment() {
    let rolesHtml = "";
    roles.forEach((role) => {
      const membersInRole = Object.entries(a.members)
        .filter(([, rid]) => rid === role.id)
        .map(([id]) => nationName(id, state));
      const max = role.unique ? 1 : (role.maxCount || 999);
      const count = membersInRole.length;
      rolesHtml += `<div class="role-item">
        <div class="role-header"><strong>${esc(role.name)}</strong> <span class="role-count">${count} / ${max === 999 ? "\u221e" : max}</span></div>
        <div class="role-members">${membersInRole.map((m) => `<span class="member-chip">${esc(m)}</span>`).join("") || "<span class=\"muted\">Vacant</span>"}</div>
        <div class="role-perms">${(role.permissions || []).map((p) => badge(human(p))).join("")}</div>
      </div>`;
    });

    const govActions = [];
    if (can("domestic") || isFounder) {
      govActions.push(button("Edit description / acronym / color / government", "openAllianceSettingsModal", {}, govReady || can("all")));
    }
    if (can("skills") || can("all") || isFounder) {
      govActions.push(button("Manage alliance skills", "openAllianceSkillsModal", {}));
    }

    return `<div class="alliance-government">
      <h4>Government structure: ${esc((t && t.name) || a.government)}</h4>
      <p class="muted">${esc((govDef && govDef.description) || "")}</p>
      <div class="roles-grid">${rolesHtml}</div>
      <div class="section"><h4>Actions</h4><div class="action-buttons">${govActions.join("")}</div></div>
      ${(!colorReady || !govReady) ? `<p class="help">Some changes are on cooldown: ${!colorReady ? `color ${colorLeft}d` : ""} ${!govReady ? `government ${govLeft}d` : ""}</p>` : ""}
    </div>`;
  }

  function renderMembers() {
    let rows = "";
    breakdown.forEach((m) => {
      rows += `<tr>
        <td>${esc(m.name)} ${m.founder ? badge("Founder", "good") : ""}</td>
        <td>${esc(m.role)}</td>
        <td>${number(m.population)}</td>
        <td>${money(m.taxRevenue)}</td>
        <td>${money(m.money)}</td>
        <td>${number(m.infra)}</td>
        <td>${number(m.tech)}</td>
        <td class="actions">
          ${(can("members") || isFounder) && m.nationId !== n.id && m.nationId !== a.founder ? button("Remove", "allianceKick", { target: m.nationId }, true, "danger") : ""}
          ${isFounder && m.nationId !== n.id ? button("Transfer leadership", "allianceTransfer", { target: m.nationId }) : ""}
        </td>
      </tr>`;
    });

    const actions = [];
    actions.push(button("Member breakdown", "openAllianceMemberModal", {}));
    if (n.allianceId) {
      actions.push(button("Leave alliance", "allianceLeave", {}, isFounder && memberCount > 1 ? false : true, "danger"));
    }

    return `<div class="alliance-members">
      <div class="members-header">
        <h4>Member roster (${memberCount} / 6)</h4>
        <div class="member-actions-header">${actions.join("")}</div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Nation</th><th>Role</th><th>Population</th><th>Tax revenue</th><th>Money</th><th>Infra</th><th>Tech</th><th>Management</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="8" class="muted">No members.</td></tr>'}</tbody>
      </table></div>
      ${can("members") ? `<div class="section"><h4>Membership applications</h4>${(a.applications?.length || 0) ? a.applications.map((id) => `<div class="row spread section"><strong>${esc(nationName(id, state))}</strong><div>${button("Accept", "allianceReview", { target: id, accept: true }, memberCount < 6 && !state.nations?.find((m) => m.id === id)?.allianceId)}${button("Decline", "allianceReview", { target: id, accept: false }, true, "")}</div></div>`).join("") : empty("No pending applications.")}</div>` : ""}
    </div>`;
  }

  function renderSkills() {
    const skills = window.AllianceSystem?.allianceSkills || {};
    const allianceSkills = a.skills || {};
    const skillPoints = a.skillPoints || 0;
    const costFor = (def, level) => Math.floor(def.baseCost * Math.pow(def.costMultiplier, level));
    const canUpgrade = can("all") || can("skills") || isFounder;

    let html = "";
    Object.entries(skills).forEach(([key, def]) => {
      const cur = allianceSkills[key] || { level: 0, pointsSpent: 0 };
      const maxed = cur.level >= def.maxLevel;
      const cost = maxed ? 0 : costFor(def, cur.level);
      const affordable = canUpgrade && skillPoints >= cost && !maxed;
      html += `<div class="skill-item">
        <div class="skill-header"><h5>${esc(def.name)}</h5><span class="skill-level">Level ${cur.level} / ${def.maxLevel}</span></div>
        <div class="skill-desc">${esc(def.description)}</div>
        <div class="skill-meta">Cost: ${cost} SP &#8226; Spent: ${cur.pointsSpent} SP</div>
        <button class="primary ${affordable ? "" : "disabled"}" data-action="allianceUpgradeSkill" data-payload='${esc(JSON.stringify({ skill: key }))}' ${!affordable ? "disabled" : ""}>${maxed ? "Maxed" : "Upgrade"}</button>
      </div>`;
    });

    return `<div class="alliance-skills">
      <div class="skills-header">
        <h4>Alliance skills</h4>
        <div class="skill-points">Available skill points: <strong>${number(skillPoints)}</strong></div>
        <p class="help">Government officers can spend alliance skill points to level up skills that benefit every member.</p>
      </div>
      <div class="skills-grid">${html || empty("No skills available.")}</div>
    </div>`;
  }

  function renderDiplomacy() {
    const tHtml = treaties.length
      ? treaties.map((t, ti) => `<div class="treaty-item"><span class="treaty-type">${esc(t.type || "treaty")}</span> <span class="treaty-partner">${esc(t.partnerName || t.partner || "Unknown alliance")}</span> <span class="treaty-status">${esc(t.status || "active")}</span> ${can("diplomacy") || isFounder ? button("Remove", "allianceRemoveTreaty", { treaty: ti }, true, "danger") : ""}</div>`).join("")
      : empty("No alliance treaties.");
    return `<div class="alliance-diplomacy">
      <h4>Alliance treaties</h4>
      <div class="treaties-list">${tHtml}</div>
      ${can("diplomacy") || isFounder ? button("Propose alliance treaty", "openDiplomacyModal", {}) : ""}
      <div class="section"><h4>Relations</h4><p class="muted">Alliance-to-alliance relations are managed through the diplomacy tab.</p></div>
    </div>`;
  }

  function renderMilitary() {
    return `<div class="alliance-military">
      <h4>Combined alliance forces</h4>
      <div class="units-grid">
        ${unitTypes.map((k) => `<div class="unit-item">
          <div class="unit-name">${unitLabels[k]}</div>
          <div class="unit-count">${number(totals[k] || 0)}</div>
        </div>`).join("")}
        <div class="unit-item total"><div class="unit-name">Total</div><div class="unit-count">${number(grandTotal)}</div></div>
      </div>
      <h4>War record</h4>
      <div class="stats-grid">
        <div class="stat-item"><span class="stat-value">${warRecord.won}</span><span class="stat-label">Wars won</span></div>
        <div class="stat-item"><span class="stat-value">${warRecord.lost}</span><span class="stat-label">Wars lost</span></div>
        <div class="stat-item"><span class="stat-value">${warRecord.rate}%</span><span class="stat-label">Win rate</span></div>
      </div>
    </div>`;
  }

  return `${heading(esc(a.name), esc(a.description || "Your alliance headquarters."), esc((t && t.name) || a.government))}
  <div class="alliance-header">
    <div class="alliance-identity">
      <h2>${esc(a.name)} ${a.acronym ? `<span class="alliance-acronym">[${esc(a.acronym)}]</span>` : ""}</h2>
      <div class="alliance-color">${colorSwatch(a.color)} ${esc(a.color || "#ffffff")}</div>
      <div class="alliance-stats">
        <span><strong>Level ${a.level || 1}</strong></span>
        <span><strong>${memberCount} / 6 members</strong></span>
        <span><strong>${money(a.treasury || 0)} treasury</strong></span>
        <span><strong>${esc(myRole ? myRole.name : myRoleId || "member")}</strong></span>
      </div>
    </div>
    <div class="alliance-actions">
      ${button("Edit alliance settings", "openAllianceSettingsModal", {}, can("domestic") || isFounder)}
      ${button("Member breakdown", "openAllianceMemberModal", {}, can("members") || isFounder)}
    </div>
  </div>

  <div class="alliance-subtabs">
    ${subTabs.map((s) => `<button class="subtab ${s.key === subtab ? "active" : ""}" data-view="allianceSubtab" data-value="${s.key}">${esc(s.label)}</button>`).join("")}
  </div>

  <div class="alliance-tab-content">${renderSubTab()}</div>

  <div class="section"><h4>Recent activity</h4>
    ${(a.log?.length ? a.log.slice().reverse().slice(0, 8).map((log) => `<p><small>${new Date(log.at || 0).toLocaleDateString()}</small> &#8226; ${esc(nationName(log.actor, state))} &#8226; ${esc(human((log.action || "").replace(/^alliance/, "")))}</p>`).join("") : empty("Your alliance story starts here."))}
  </div>`;
}

function memberCountOf(x) {
  return x.members ? Object.keys(x.members).length : 0;
}

window.renderAllianceTab = renderAllianceTab;
