"use strict";
/**
 * Tarot Modal - Sovereignty Epochs
 * Immersive tarot reading with shuffle + deal animations, 1/3/5 card types,
 * Traditional / Cat Arcana decks. Uses existing /api/tarot/read endpoint.
 * Exports: window.TarotModal.render(state, catalog) -> HTML string
 * Sets: window.TarotModal
 */

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const button = (label, action, data, enabled = true, style = "primary") =>
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(JSON.stringify(data || {}))}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;

const READING_TYPES = {
  single: { label: "1 Card · The Moment", count: 1 },
  three: { label: "3 Cards · The Journey", count: 3 },
  five: { label: "5 Cards · The Crossroads", count: 5 },
};

const DECKS = {
  traditional: { label: "Traditional (78)", dir: "cards" },
  cat: { label: "Cat Arcana (22)", dir: "cat cards" },
};

const SPREAD_POSITIONS = {
  single: [{ id: "moment", label: "The Moment" }],
  three: [
    { id: "past", label: "Past" },
    { id: "present", label: "Present" },
    { id: "future", label: "Future" },
  ],
  five: [
    { id: "present", label: "Present" },
    { id: "challenge", label: "Challenge" },
    { id: "past", label: "Past" },
    { id: "future", label: "Future" },
    { id: "outcome", label: "Outcome" },
  ],
};

// Client-side tarot state (per session).
const tarotModalState = {
  type: "three",
  mode: "traditional",
  phase: "idle", // idle | shuffling | dealing | revealed
  reading: null,
  dealIndex: 0,
  raf: null,
};

/* ══════════════════════════════════════════════════════════════════════════════
   TAROT API
   ═════════════════════════════════════════════════════════════════════════════ */

async function tarotApi(type, mode) {
  const res = await fetch("/api/tarot/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, mode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Tarot reading failed");
  }
  return res.json();
}

/* ══════════════════════════════════════════════════════════════════════════════
   RENDER TAROT MODAL
   ═════════════════════════════════════════════════════════════════════════════ */

window.TarotModal = {
  render(state, catalog) {
    const n = state?.nation;
    const reading = tarotModalState.reading;
    const phase = tarotModalState.phase;
    const count = READING_TYPES[tarotModalState.type].count;
    const positions = SPREAD_POSITIONS[tarotModalState.type];

    const canShuffle = phase !== "shuffling" && phase !== "dealing";
    const canDeal = phase === "shuffling";

    // Shuffle animation: show animated card backs
    let shuffleHtml = "";
    if (phase === "shuffling" || phase === "dealing") {
      shuffleHtml = `<div class="fortune-tarot-shuffle">
        ${Array.from({ length: count }, (_, i) => `
          <div class="fortune-tarot-shuffle-card shuffle-card-${i}" style="--delay:${i * 80}ms"></div>
        `).join("")}
      </div>`;
    }

    // Card spread
    let spreadHtml = "";
    if (reading) {
      spreadHtml = reading.cards.map((c, i) => {
        const revealed = phase === "revealed" || i < tarotModalState.dealIndex;
        const pos = positions.find((p) => p.id === c.position) || { label: c.position };
        const orientation = c.isReversed ? "reversed" : "upright";
        return `
          <div class="fortune-tarot-position">
            <div class="fortune-tarot-card ${revealed ? "flipped" : ""} ${orientation}" data-index="${i}">
              <div class="fortune-tarot-card-back"></div>
              <div class="fortune-tarot-card-front">
                ${revealed ? `
                  <img src="${esc(c.imagePath)}" class="fortune-tarot-card-img" alt="${esc(c.cardName)}" onerror="this.style.display='none';" />
                  <div class="fortune-tarot-card-name">${esc(c.cardName)}</div>
                  <div class="fortune-tarot-card-orientation">${esc(c.orientation)}</div>
                ` : `<div class="fortune-tarot-card-back-inner">✦</div>`}
              </div>
            </div>
            <div class="fortune-tarot-position-label">${esc(pos.label)}</div>
          </div>
        `;
      }).join("");
    } else {
      spreadHtml = positions.map((p) => `
        <div class="fortune-tarot-position">
          <div class="fortune-tarot-card fortune-tarot-card-empty"></div>
          <div class="fortune-tarot-position-label">${esc(p.label)}</div>
        </div>
      `).join("");
    }

    // Result panel
    let resultHtml = "";
    if (reading && phase === "revealed") {
      resultHtml = `
        <div class="fortune-tarot-result">
          <div class="fortune-tarot-synthesis"><strong>Synthesis:</strong> ${esc(reading.synthesis)}</div>
          <div class="fortune-tarot-advice"><strong>Advice:</strong> ${esc(reading.advice)}</div>
        </div>
      `;
    }

    return `
      <div class="fortune-modal-header">
        <h2>🔮 Tarot Reading</h2>
        <button class="fortune-modal-close" data-action="closeFortuneModal">✕</button>
      </div>
      <div class="fortune-modal-body">
        <div class="fortune-tarot-modal">
          <div class="fortune-tarot-controls">
            <label class="fortune-control-label">Reading:</label>
            <select id="tarot-type" onchange="window.TarotModalHandlers.setType(this.value)">${Object.entries(READING_TYPES).map(([k, v]) =>
              `<option value="${esc(k)}" ${k === tarotModalState.type ? "selected" : ""}>${esc(v.label)}</option>`).join("")}</select>
            <label class="fortune-control-label">Deck:</label>
            <select id="tarot-deck" onchange="window.TarotModalHandlers.setMode(this.value)">${Object.entries(DECKS).map(([k, v]) =>
              `<option value="${esc(k)}" ${k === tarotModalState.mode ? "selected" : ""}>${esc(v.label)}</option>`).join("")}</select>
            ${button("Shuffle Deck", "fortune:tarot:shuffle", {}, canShuffle, "secondary", "tarot-shuffle-btn")}
            ${button("Deal Cards", "fortune:tarot:deal", {}, canDeal, "primary", "tarot-deal-btn")}
          </div>

          ${shuffleHtml}

          <div class="fortune-tarot-spread">
            ${spreadHtml}
          </div>

          ${resultHtml}

          <div class="fortune-tarot-actions">
            ${button("New Reading", "fortune:tarot:new", {}, true, "secondary", "tarot-new-btn")}
          </div>
        </div>
      </div>
    `;
  },
};

window.TarotModal.displayName = "TarotModal";

/* ══════════════════════════════════════════════════════════════════════════════
   TAROT ACTION HANDLERS (exposed for game.js)
   ═════════════════════════════════════════════════════════════════════════════ */

window.TarotModalHandlers = {
  async shuffle() {
    tarotModalState.phase = "shuffling";
    tarotModalState.dealIndex = 0;
    tarotModalState.reading = null;
    const dealBtn = document.getElementById("tarot-deal-btn");
    const shuffleBtn = document.getElementById("tarot-shuffle-btn");
    if (dealBtn) dealBtn.disabled = false;
    if (shuffleBtn) shuffleBtn.disabled = true;
    if (window.TarotModalRender) window.TarotModalRender();

    // Auto-deal after shuffle animation completes
    setTimeout(() => {
      if (tarotModalState.phase === "shuffling") {
        window.TarotModalHandlers.deal();
      }
    }, 1200);
    return { ok: true };
  },
  async deal() {
    if (tarotModalState.phase === "dealing" || tarotModalState.phase === "revealed") {
      return { ok: true };
    }
    tarotModalState.phase = "dealing";
    tarotModalState.dealIndex = 0;
    const dealBtn = document.getElementById("tarot-deal-btn");
    const shuffleBtn = document.getElementById("tarot-shuffle-btn");
    if (dealBtn) dealBtn.disabled = true;
    if (shuffleBtn) shuffleBtn.disabled = true;

    let reading = null;
    try {
      reading = await tarotApi(tarotModalState.type, tarotModalState.mode);
    } catch {
      reading = null;
    }
    tarotModalState.reading = reading;
    const count = READING_TYPES[tarotModalState.type].count;

    // Initial render: all cards face-down
    if (window.TarotModalRender) window.TarotModalRender();

    // Deal cards one by one by flipping DOM cards directly
    let dealt = 0;
    const dealInterval = setInterval(() => {
      dealt++;
      tarotModalState.dealIndex = Math.min(dealt, count);
      const cardEl = document.querySelector(`.fortune-tarot-card[data-index="${dealt - 1}"]`);
      if (cardEl) cardEl.classList.add("flipped");
      if (window.TarotModalRender) window.TarotModalRender();
      if (dealt >= count) {
        clearInterval(dealInterval);
        tarotModalState.phase = "revealed";
        if (window.TarotModalRender) window.TarotModalRender();
        if (dealBtn) dealBtn.disabled = false;
        if (shuffleBtn) shuffleBtn.disabled = false;
      }
    }, 700);
    return { ok: true };
  },
  async newReading() {
    tarotModalState.phase = "idle";
    tarotModalState.dealIndex = 0;
    tarotModalState.reading = null;
    return { ok: true };
  },
  async setType(type) {
    tarotModalState.type = type;
    tarotModalState.phase = "idle";
    tarotModalState.dealIndex = 0;
    tarotModalState.reading = null;
    return { ok: true };
  },
  async setMode(mode) {
    tarotModalState.mode = mode;
    tarotModalState.phase = "idle";
    tarotModalState.dealIndex = 0;
    tarotModalState.reading = null;
    return { ok: true };
  },
};

// Expose a render trigger for game.js after async state changes.
window.TarotModalRequestRender = () => {
  // game.js will call renderModal() after these handlers
};
