"use strict";
/**
 * Keno Modal - Sovereignty Epochs
 * Pet-based keno: pick 1-10 pets from 103 icons; 10th pick = Multiplier Pet.
 * Dynamic payout grid, auto-select, picks persist across plays.
 * Exports: window.KenoModal.render(state, catalog) -> HTML string
 * Sets: window.KenoModal
 */

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const money = (value) => "$" + (Number(value || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 });

const button = (label, action, data, enabled = true, style = "primary") =>
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(JSON.stringify(data || {}))}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;

const MAX_PICKS = 10;
const DEFAULT_BET = 100000;

// Client-side persistent pick state (survives across plays within a session).
const kenoModalState = {
  selectedPets: [],
  bet: DEFAULT_BET,
  lastDraw: null,
  payoutGrid: null,
  payoutGridPickCount: null,
  pets: [],
  petsLoaded: false,
  payoutGridLoaded: false,
};

/* ═════════════════════════════════════════════════════════════════════════════════════════════
   HELPERS
   ═════════════════════════════════════════════════════════════════════════════════════════════ */

function isSelected(pet) {
  return kenoModalState.selectedPets.includes(pet);
}

function togglePet(pet) {
  const idx = kenoModalState.selectedPets.indexOf(pet);
  if (idx >= 0) {
    kenoModalState.selectedPets.splice(idx, 1);
  } else if (kenoModalState.selectedPets.length < MAX_PICKS) {
    kenoModalState.selectedPets.push(pet);
  } else {
    notice("Maximum 10 pets selected.", true);
  }
}

function petTile(pet) {
  const selected = isSelected(pet);
  const isMultiplier = selected && kenoModalState.selectedPets.length === MAX_PICKS && kenoModalState.selectedPets[MAX_PICKS - 1] === pet;
  const cls = `fortune-keno-pet ${selected ? "selected" : ""} ${isMultiplier ? "multiplier" : ""}`;
  return `<button class="${cls}" data-action="fortune:keno:togglePet" data-payload='{"pet":"${esc(pet)}"}' title="${esc(pet)}">${esc(pet)}</button>`;
}

function payoutCell(value) {
  if (value === null) return "—";
  if (typeof value === "string") return value; // pool25 / pool50
  return value + "×";
}

/* ═════════════════════════════════════════════════════════════════════════════════════════════
   RENDER KENO MODAL
   ═════════════════════════════════════════════════════════════════════════════════════════════ */

window.KenoModal = {
  async render(state, catalog) {
    const n = state?.nation;
    const moneyVal = n?.money || 0;

    // Load pets + payout grid once per session.
    if (!kenoModalState.petsLoaded) {
      try {
        const petsRes = await fetch("/api/fortune", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game: "keno", action: "getPets", data: {} }),
        });
        if (petsRes.ok) {
          const petsJson = await petsRes.json();
          if (petsJson.ok) kenoModalState.pets = petsJson.pets || [];
        }
      } catch {
        // Ignore load errors; fall back to placeholders.
      }
      kenoModalState.petsLoaded = true;
    }

    // Re-fetch payout grid whenever pick count changes.
    if (!kenoModalState.payoutGridLoaded || kenoModalState.payoutGridPickCount !== pickCount) {
      try {
        const gridRes = await fetch("/api/fortune", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game: "keno", action: "getPayoutGrid", data: { pickCount: pickCount || 1 } }),
        });
        if (gridRes.ok) {
          const gridJson = await gridRes.json();
          if (gridJson.ok) {
            kenoModalState.payoutGrid = gridJson.grid;
            kenoModalState.payoutGridPickCount = pickCount;
          }
        }
      } catch {
        // Ignore load errors; fall back to placeholders.
      }
      kenoModalState.payoutGridLoaded = true;
    }

    const pets = kenoModalState.pets;
    const pickCount = kenoModalState.selectedPets.length;
    const grid = kenoModalState.payoutGrid || [];
    const canPlay = pickCount >= 1 && pickCount <= MAX_PICKS && moneyVal >= kenoModalState.bet;

    // Pet grid HTML
    const petHtml = pets.map(petTile).join("");

    // Payout grid HTML
    let gridHtml = "";
    if (grid.length > 0) {
      const isTen = pickCount === MAX_PICKS;
      gridHtml = `
        <table class="fortune-keno-payout-grid">
          <thead>
            <tr>
              <th>Matches</th>
              ${grid.map((g) => `<th>${g.matches}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${isTen
              ? `
                <tr>
                  <td class="fortune-keno-payout-rowlabel">Base (10 picks)</td>
                  ${grid.map((g) => `<td>${payoutCell(g.ten)}</td>`).join("")}
                </tr>
                <tr>
                  <td class="fortune-keno-payout-rowlabel">Multiplier Hit</td>
                  ${grid.map((g) => `<td>${payoutCell(g.tenMult)}</td>`).join("")}
                </tr>
              `
              : `
                <tr>
                  <td class="fortune-keno-payout-rowlabel">Base</td>
                  ${grid.map((g) => `<td>${payoutCell(g.base)}</td>`).join("")}
                </tr>
              `}
          </tbody>
        </table>
      `;
    }

    // Selected chips
    const selectedChips = kenoModalState.selectedPets.map((p, i) => {
      const isMult = i === MAX_PICKS - 1;
      return `<span class="fortune-keno-chip ${isMult ? "multiplier" : ""}">${esc(p)}${isMult ? " ★" : ""}</span>`;
    }).join("") || `<span class="fortune-keno-chip-empty">None selected</span>`;

    const lastDrawHtml = kenoModalState.lastDraw
      ? `
        <div class="fortune-keno-lastdraw">
          <div class="fortune-keno-lastdraw-title">Last Draw</div>
          <div class="fortune-keno-lastdraw-pets">
            ${kenoModalState.lastDraw.drawPets.map((p) => {
              const matched = kenoModalState.selectedPets.includes(p);
              const isMult = kenoModalState.lastDraw.multiplierDraws && kenoModalState.lastDraw.multiplierDraws.includes(p);
              return `<span class="fortune-keno-drawpet ${matched ? "matched" : ""} ${isMult ? "mult" : ""}">${esc(p)}</span>`;
            }).join("")}
          </div>
          <div class="fortune-keno-lastdraw-msg">${kenoModalState.lastDraw.msg || ""}</div>
        </div>
      `
      : "";

    return `
      <div class="fortune-modal-header">
        <h2>🐾 Keno</h2>
        <button class="fortune-modal-close" data-action="closeFortuneModal">✕</button>
      </div>
      <div class="fortune-modal-body">
        <div class="fortune-keno-container">
          <div class="fortune-keno-pick-section">
            <div class="fortune-keno-pick-header">
              <span class="fortune-keno-pick-count">${pickCount} / ${MAX_PICKS} selected</span>
              <span class="fortune-keno-pick-mult">${pickCount === MAX_PICKS ? "10th = Multiplier Pet" : ""}</span>
            </div>
            <div class="fortune-keno-pet-grid">${petHtml}</div>
            <div class="fortune-keno-selected">
              <span class="fortune-keno-selected-label">Your picks:</span>
              ${selectedChips}
            </div>
          </div>

          <div class="fortune-keno-payout-section">
            <h3 class="fortune-keno-payout-title">Payout Grid (${pickCount} pick${pickCount !== 1 ? "s" : ""})</h3>
            ${gridHtml}
          </div>

          <div class="fortune-keno-bet-section">
            <label class="fortune-keno-bet-label">Bet:</label>
            <input type="number" id="fortune-keno-bet" onchange="window.KenoModalHandlers.updateBet(this.value)" value="${kenoModalState.bet}" min="100" step="100" class="fortune-keno-bet-input" />
            <span class="fortune-keno-bet-balance">Balance: ${money(moneyVal)} ${moneyVal < kenoModalState.bet ? "— insufficient" : ""}</span>
          </div>

          <div class="fortune-keno-actions">
            ${button("Auto-Select", "fortune:keno:autoSelect", { count: Math.min(5, MAX_PICKS) }, true, "secondary")}
            ${button("Clear", "fortune:keno:clear", {}, pickCount > 0, "secondary")}
            ${button("Play", "fortune:keno:buyTicket", { bet: kenoModalState.bet }, canPlay, "primary")}
          </div>

          ${lastDrawHtml}
        </div>
      </div>
    `;
  },
};

window.KenoModal.displayName = "KenoModal";

/* ═════════════════════════════════════════════════════════════════════════════════════════════
   KENO ACTION HANDLERS (exposed for game.js)
   ═════════════════════════════════════════════════════════════════════════════════════════════ */

async function kenoApi(action, data) {
  const res = await fetch("/api/fortune", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game: "keno", action, data: data || {} }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Keno action failed");
  }
  return res.json();
}

window.KenoModalHandlers = {
  async togglePet(pet) {
    togglePet(pet);
    kenoModalState.payoutGridLoaded = false; // reload payout grid for new pick count
    return { ok: true };
  },
  async updateBet(bet) {
    const amount = Number(bet) || DEFAULT_BET;
    kenoModalState.bet = amount;
    if (window.KenoModalRender) window.KenoModalRender();
    return { ok: true, bet: amount };
  },
  async autoSelect(count) {
    const pets = kenoModalState.pets;
    if (pets.length === 0) return { ok: false, reason: "Pets not loaded" };
    const n = Math.min(Math.max(1, Number(count) || 1), MAX_PICKS);
    const shuffled = [...pets].sort(() => 0.5 - Math.random());
    kenoModalState.selectedPets = shuffled.slice(0, n);
    kenoModalState.payoutGridLoaded = false;
    return { ok: true, selected: kenoModalState.selectedPets };
  },
  async clear() {
    kenoModalState.selectedPets = [];
    kenoModalState.payoutGridLoaded = false;
    return { ok: true };
  },
  async buyTicket(bet) {
    const pets = [...kenoModalState.selectedPets];
    if (pets.length < 1 || pets.length > MAX_PICKS) throw new Error("Select 1-10 pets");
    const amount = Number(bet) || DEFAULT_BET;
    const result = await kenoApi("buyTicket", { petIds: pets, bet: amount });
    if (result.ok) {
      kenoModalState.bet = amount;
      // Keep picks selected (persist across plays) — do NOT clear.
      // Fetch last draw for display.
      try {
        const drawRes = await kenoApi("lastDraw", {});
        if (drawRes.ok && drawRes.drawing) {
          kenoModalState.lastDraw = {
            drawPets: drawRes.drawing.drawPets || [],
            multiplierDraws: drawRes.drawing.multiplierDraws || [],
            msg: "Draw completed",
          };
        }
      } catch {
        // Ignore.
      }
    }
    return result;
  },
};
