"use strict";
/**
 * SituationsModal - Popup modal for resolving player-choice situations
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Shows a situation with its title, description, and 3 choices.
 * When the user selects a choice, it calls command("resolveSituation", ...)
 * to submit the choice to the server. The outcome is shown after the game
 * registers it (in the next state render).
 *
 * Exports: window.SituationsModal — { render(situation, catalog) -> HTML string }
 *
 * Wiring:
 *   game.js renders this via renderModal() when modalMode === "situation".
 *   Click handlers for data-action="resolveSituation" already exist.
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

/* Look up a situation definition by type and definitionId from client globals */
function getSituationDefinition(type, definitionId) {
  const globals = {
    population: window.PopulationSituations,
    nation: window.NationSituations,
    military: window.MilitarySituations,
  };
  const catMap = globals[type];
  if (!catMap) return null;
  for (const [cat, events] of Object.entries(catMap || {})) {
    const found = events.find((e) => e.id === definitionId);
    if (found) return found;
  }
  // Also check catalog.situationDefinitions if available
  const catDefs = window.state?.catalog?.situationDefinitions?.[type];
  if (catDefs) {
    for (const [cat, events] of Object.entries(catDefs || {})) {
      const found = events.find((e) => e.id === definitionId);
      if (found) return found;
    }
  }
  return null;
}

function formatEffectPreview(effects) {
  if (!effects) return "";
  const parts = [];
  for (const [k, v] of Object.entries(effects)) {
    const sign = v > 0 ? "+" : "";
    const label = human(k);
    parts.push(`${sign}${v} ${label}`);
  }
  return parts.join(" • ");
}

class SituationsModalSystem {
    constructor() {
        this.situation = null;
        this.catalog = null;
    }

    render(situation, catalog) {
        this.situation = situation;
        this.catalog = catalog;
        if (!situation) return '<div class="empty">No situation data.</div>';

        const def = getSituationDefinition(situation.situationType, situation.definitionId);
        const title = def ? def.title : situation.title || "Situation";
        const description = def ? def.description : situation.description || "";
        const choices = def ? def.choices : [];

        const typeLabel = human(situation.situationType || "situation");
        const typeColor = situation.situationType === "nation"
          ? "#8cc7f7"
          : situation.situationType === "population"
            ? "#fbbf24"
            : "#ef4444";

        const choicesHtml = choices.map((choice, idx) => {
          const effectsHtml = formatEffectPreview(choice.effects);
          return `<label class="situation-choice">
            <input type="radio" name="situationChoice" value="${idx}" ${idx === 0 ? "checked" : ""}>
            <div class="situation-choice-content">
              <div class="situation-choice-text">${esc(choice.text)}</div>
              ${effectsHtml ? `<div class="situation-choice-effects">${esc(effectsHtml)}</div>` : ""}
            </div>
          </label>`;
        }).join("") || '<div class="situation-no-choices">No choices available.</div>';

        return `<form method="dialog" id="situation-modal-form">
          <div class="modal-eyebrow">Situation — ${esc(typeLabel)}</div>
          <h2 id="nation-dialog-title">${esc(title)}</h2>
          <p class="muted">${esc(description)}</p>

          <div class="situation-choices">
            ${choicesHtml}
          </div>

          <div class="row dialog-actions">
            <button value="cancel" class="">Defer</button>
            <button type="button" class="primary" data-action="resolveSituation"
                    data-payload="${esc(JSON.stringify({ situationId: situation.id, choiceIndex: 0 }))}">
              Choose Selected
            </button>
          </div>
        </form>`;
    }

    updateChoiceIndex(index) {
      const form = document.getElementById("situation-modal-form");
      if (!form) return;
      const payloadBtn = form.querySelector('[data-action="resolveSituation"]');
      if (payloadBtn) {
        payloadBtn.dataset.payload = JSON.stringify({
          situationId: this.situation ? this.situation.id : "",
          choiceIndex: index,
        });
      }
    }
}

window.SituationsModal = new SituationsModalSystem();
