"use strict";
/**
 * Admin Tab - Sovereignty Epochs
 * Admin / Moderator oversight panel.
 *
 * Only visible to users whose nation has isAdmin === true or role === 'admin' /
 * role === 'moderator'.
 *
 * Sections:
 *   • Reported Bugs / Issues — list of user-submitted bug reports with status
 *   • Debug / Console Errors — recent server-side errors
 *   • Query History Log — /api/query/audit trail (who ran what query, when)
 *   • Moderation — warn / suspend / ban users with reason and duration
 *
 * Exports: renderAdminTab(state) -> HTML string (or empty string if not admin/mod)
 */

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
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
const empty = (message) => `<div class="empty">${esc(message)}</div>`;
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

/* Check if the current player is an admin or moderator */
function isAdminOrMod(state) {
  const n = state?.nation || {};
  const p = state?.player || {};
  return (
    n.isAdmin === true ||
    n.role === "admin" ||
    n.role === "moderator" ||
    p.isAdmin === true ||
    p.role === "admin" ||
    p.role === "moderator"
  );
}

/* Render the admin tab */
function renderAdminTab(state) {
  if (!state || !isAdminOrMod(state)) {
    return "";
  }

  const n = state.nation || {};
  const p = state.player || {};

  return `
    <header class="page-heading">
      <div>
        <div class="eyebrow">Administration</div>
        <h1>Admin Panel</h1>
        <p>Moderation tools, bug reports, debug errors, and query audit log.</p>
      </div>
      <span class="badge admin-badge">${esc(n.role || "Administrator")}</span>
    </header>

    <div class="admin-grid">
      <!-- Bug Reports -->
      <section class="admin-card">
        <div class="admin-card-header">
          <h2>🐛 Reported Bugs & Issues</h2>
          <button class="admin-btn admin-btn-refresh" data-action="adminRefreshBugs">Refresh</button>
        </div>
        <div class="admin-table-wrap" id="admin-bugs-list">
          <div class="admin-loading">Loading bug reports…</div>
        </div>
      </section>

      <!-- Debug / Console Errors -->
      <section class="admin-card">
        <div class="admin-card-header">
          <h2>🔴 Debug / Console Errors</h2>
          <button class="admin-btn admin-btn-refresh" data-action="adminRefreshErrors">Refresh</button>
        </div>
        <div class="admin-table-wrap" id="admin-errors-list">
          <div class="admin-loading">Loading debug errors…</div>
        </div>
      </section>

      <!-- Query History -->
      <section class="admin-card admin-card-wide">
        <div class="admin-card-header">
          <h2>📜 Query History Log</h2>
          <button class="admin-btn admin-btn-refresh" data-action="adminRefreshQueryLog">Refresh</button>
        </div>
        <div class="admin-table-wrap" id="admin-query-log-list">
          <div class="admin-loading">Loading query history…</div>
        </div>
      </section>

      <!-- Moderation -->
      <section class="admin-card">
        <div class="admin-card-header">
          <h2>🛡️ User Moderation</h2>
        </div>
        <div class="admin-moderation-form">
          <div class="admin-form-row">
            ${input("Target Username / ID", "modTarget", "", "text", 'placeholder="Enter username or nation ID"')}
            ${select("modAction", {
              warn: "Warn",
              suspend: "Suspend",
              ban: "Ban",
              unsuspend: "Unsuspend",
              unban: "Unban",
            }, "warn")}
            ${input("Reason", "modReason", "", "text", 'placeholder="Reason for action"')}
            ${input("Duration (hours)", "modDuration", "24", "number", 'min="1"')}
            ${button("Apply Action", "adminModerate", {}, true, "danger")}
          </div>
          <div class="admin-form-row admin-moderation-history" id="admin-mod-history">
            <div class="admin-loading">Loading moderation history…</div>
          </div>
        </div>
      </section>
    </div>

    <div class="admin-actions-bar">
      ${button("Export Bug Reports", "adminExportBugs", {}, true)}
      ${button("Export Query Log", "adminExportQueryLog", {}, true)}
      ${button("Clear Resolved Reports", "adminClearResolved", {}, true, "danger")}
    </div>
  `;
}

/* Helper: input */
function input(label, name, value = "", type = "text", extra = "") {
  return `<label>${esc(label)}<input name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" ${extra}></label>`;
}

window.AdminTab = { render: renderAdminTab, isAdminOrMod };
