"use strict";
/**
 * BugReportModal — Bug / Issue / Balance / Suggestion reporting modal
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Renders a clean bug report form inside <dialog id="nation-dialog">.
 * Captures:
 *   • Report type (Bug / Issue / Balance / Suggestion)
 *   • Current page URL (game-relative link to where the user is)
 *   • Title, description, steps to reproduce
 *   • Optional screenshot upload (image file, max 5MB)
 *   • Auto-captured game state (player level, nation, tab, etc.)
 *
 * Exports: window.BugReportModal — { render(state) -> HTML string }
 *
 * Wiring:
 *   game.js renders this via renderModal() when modalMode === "bugReport".
 *   Submit → POST /api/bug-report (session-authenticated).
 *   Click "openBugReport" from account menu → openModal("bugReport").
 */

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const human = (value) =>
  String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

const REPORT_TYPES = [
  { key: "bug", label: "Bug / Glitch", icon: "🐛" },
  { key: "issue", label: "Issue / Problem", icon: "⚠️" },
  { key: "balance", label: "Balance / Gameplay", icon: "⚖️" },
  { key: "suggestion", label: "Suggestion / Feature", icon: "💡" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

class BugReportModalSystem {
    constructor() {
        this.state = null;
        this.screenshotFile = null;
        this.screenshotPreview = null;
    }

    /* ═══════════════════════════════════════════════════════════════════
       RENDER
       ══════════════════════════════════════════════════════════════════ */

    render(state) {
        this.state = state;
        const p = state.player || {};
        const n = state.nation || {};
        const currentTab = window.currentTab || "nation";
        const gameUrl = window.location.pathname + window.location.search + window.location.hash;
        const typeOptions = REPORT_TYPES.map(
          (t) => `<option value="${esc(t.key)}">${esc(t.icon)} ${esc(t.label)}</option>`,
        ).join("");

        const gameStateInfo = `
          <div class="bug-field-row"><span class="bug-label">Tab:</span><span class="bug-value">${esc(currentTab)}</span></div>
          <div class="bug-field-row"><span class="bug-label">Player:</span><span class="bug-value">${esc(p.username || "—")}</span></div>
          <div class="bug-field-row"><span class="bug-label">Level:</span><span class="bug-value">${esc(p.level || 1)}</span></div>
          <div class="bug-field-row"><span class="bug-label">Nation:</span><span class="bug-value">${esc(n.name || "—")}</span></div>
          <div class="bug-field-row"><span class="bug-label">URL:</span><span class="bug-value bug-url" title="${esc(gameUrl)}">${esc(gameUrl.length > 60 ? gameUrl.slice(0, 57) + "…" : gameUrl)}</span></div>
          <div class="bug-field-row"><span class="bug-label">Game Day:</span><span class="bug-value">${esc(state.day || 1)}</span></div>
        `;

        const screenshotHtml = this.screenshotPreview
          ? `<div class="bug-screenshot-preview">
               <img src="${esc(this.screenshotPreview)}" alt="Screenshot preview" class="bug-preview-img">
               <button type="button" class="bug-remove-screenshot" data-action="bugRemoveScreenshot">Remove</button>
             </div>`
          : "";

        return `
          <form method="dialog" id="bug-report-form">
            <div class="modal-eyebrow">Report a Problem</div>
            <h2 id="nation-dialog-title">Report Bug / Issue / Suggestion</h2>

            <div class="bug-form-group">
              <label>Report Type <span class="bug-req">*</span></label>
              <select name="reportType" required>${typeOptions}</select>
            </div>

            <div class="bug-form-group">
              <label>Title <span class="bug-req">*</span></label>
              <input name="title" type="text" required maxlength="120"
                     placeholder="Brief summary of the issue">
            </div>

            <div class="bug-form-group">
              <label>Description <span class="bug-req">*</span></label>
              <textarea name="description" required rows="5" maxlength="2000"
                        placeholder="Describe what happened, what you expected, and any error messages."></textarea>
              <div class="bug-char-count"><span id="bug-desc-count">0</span>/2000</div>
            </div>

            <div class="bug-form-group">
              <label>Steps to Reproduce</label>
              <textarea name="steps" rows="3" maxlength="1000"
                        placeholder="1. Open the ${esc(currentTab)} tab&#10;2. Click X&#10;3. The error appears"></textarea>
              <div class="bug-char-count"><span id="bug-steps-count">0</span>/1000</div>
            </div>

            <div class="bug-form-group">
              <label>Screenshot (Optional)</label>
              <div class="bug-upload-area">
                <input type="file" name="screenshot" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                       onchange="window.BugReportModal.handleScreenshot(this.files)">
                <div class="bug-drop-zone" onclick="document.querySelector('#bug-report-form input[name=screenshot]').click()">
                  <div class="bug-drop-icon">📷</div>
                  <div class="bug-drop-text">Click to select an image or drag it here</div>
                  <div class="bug-drop-hint">PNG, JPG, GIF, WebP — max 5MB</div>
                </div>
                ${screenshotHtml}
              </div>
            </div>

            <div class="bug-game-state">
              <h3>Game State (Auto-captured)</h3>
              ${gameStateInfo}
            </div>

            <div class="bug-notice">
              <p><strong>Current page link:</strong> <span class="bug-url">${esc(gameUrl)}</span><br>
              <em>This link is automatically included with your report so administrators can see exactly where the issue occurred.</em></p>
            </div>

            <div class="row dialog-actions">
              <button type="button" value="close">Cancel</button>
              <button type="button" class="primary" data-action="bugSubmit">Submit Report</button>
            </div>
          </form>
        `;
    }

    /* ════════════════════════════════════════════════════════════════════
       EVENT HANDLERS (called via data-action delegation in game.js)
       ═══════════════════════════════════════════════════════════════════ */

    async handleScreenshot(files) {
        if (!files || files.length === 0) return;
        const file = files[0];
        const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
        if (!allowed.includes(file.type)) {
            alert("Unsupported file type. Use PNG, JPG, GIF, or WebP.");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            alert(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 5MB.`);
            return;
        }
        this.screenshotFile = file;
        this.screenshotPreview = URL.createObjectURL(file);
    }

    handleRemoveScreenshot() {
        this.screenshotFile = null;
        if (this.screenshotPreview) {
            URL.revokeObjectURL(this.screenshotPreview);
            this.screenshotPreview = null;
        }
    }

    async submitReport() {
        const form = document.getElementById("bug-report-form");
        if (!form) return;
        const fd = new FormData(form);

        const title = fd.get("title")?.trim() || "";
        const description = fd.get("description")?.trim() || "";
        const steps = fd.get("steps")?.trim() || "";
        const reportType = fd.get("reportType") || "bug";

        if (!title || !description) {
            alert("Please fill in Title and Description.");
            return;
        }

        const p = this.state?.player || {};
        const n = this.state?.nation || {};
        const currentTab = window.currentTab || "nation";
        const gameUrl = window.location.pathname + window.location.search + window.location.hash;

        const payload = {
            reportType,
            title,
            description,
            steps,
            screenshot: this.screenshotFile ? {
                name: this.screenshotFile.name,
                size: this.screenshotFile.size,
                type: this.screenshotFile.type,
            } : null,
            pageUrl: gameUrl,
            currentTab,
            player: {
                id: p.playerId || p.id,
                username: p.username,
                level: p.level,
                legendaryLevel: p.legendaryLevel,
            },
            nation: {
                id: n.id,
                name: n.name,
                factionKey: n.factionKey,
            },
            gameDay: this.state?.day || 1,
            timestamp: Date.now(),
        };

        try {
            const res = await fetch("/api/bug-report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (json.success) {
                alert(`Report submitted successfully (ID: ${json.reportId || "—"}).`);
                // Close modal
                const dialog = document.getElementById("nation-dialog");
                if (dialog) dialog.close();
            } else {
                alert(json.error || "Failed to submit report.");
            }
        } catch (err) {
            alert("Failed to submit report — check your connection.");
            console.error("Bug report error:", err);
        }
    }
}

window.BugReportModal = new BugReportModalSystem();
