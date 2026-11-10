"use strict";
/**
 * Scratch-Off Modal - Sovereignty Epochs
 * Borderless pop-up that feels like a real scratch-off card.
 * Silver-coated tiles; click to scratch/reveal; win detection server-side.
 * Exports: window.ScratchOffModal.render(state, catalog) -> HTML string
 * Sets: window.ScratchOffModal
 */

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const money = (value) => "$" + (Number(value || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 });

const CARD_TYPE_LABELS = {
  resources: "Resources",
  pets: "Pets",
  bricks: "Bricks",
  factions: "Factions",
  beliefs: "National Beliefs",
  needs: "National Needs",
};

const CARD_TYPE_DESC = {
  resources: "Minerals · Match 3 on any line",
  pets: "103 pets · Match 2 identical",
  bricks: "Miss colors · Match 3 identical",
  factions: "Color icons · Match 3 identical",
  beliefs: "Religions + Governments · 2 of each",
  needs: "Foods + Waters · 2 of each",
};

const CARD_TYPE_ICON = {
  resources: "💎",
  pets: "🐾",
  bricks: "🧱",
  factions: "🏳",
  beliefs: "☪",
  needs: "🍽",
};

const CARD_BASE_COST = {
  resources: 100,
  pets: 50,
  bricks: 200,
  factions: 300,
  beliefs: 500,
  needs: 500,
};

const GRID_SIZE_BY_TYPE = {
  resources: 9,
  pets: 3,
  bricks: 3,
  factions: 3,
  beliefs: 9,
  needs: 9,
};

const button = (label, action, data, enabled = true, style = "primary") =>
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(JSON.stringify(data || {}))}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;

function iconPathForSymbol(type, symbol) {
  switch (type) {
    case "resources":
      return `assets/images/Resources/${symbol}.png`;
    case "pets":
      return `assets/images/Pets/${symbol}.png`;
    case "bricks":
      return `assets/images/Misses/${symbol}.png`;
    case "factions":
      return `assets/images/Colors/${symbol}.png`;
    case "beliefs":
      return `assets/images/Religion/${symbol}.png`;
    case "needs":
      return `assets/images/Food/${symbol}.png`;
    default:
      return "";
  }
}

function tileSymbolDisplay(type, symbol) {
  const path = iconPathForSymbol(type, symbol);
  if (path) return `<img src="${esc(path)}" class="fortune-scratch-symbol" alt="${esc(symbol)}">`;
  return `<span class="fortune-scratch-text">${esc(symbol)}</span>`;
}

function activeCard(nation) {
  const cards = nation?.casino?.scratchOffCards || [];
  return cards[cards.length - 1] || null;
}

/* ══════════════════════════════════════════════════════════════════════════════════════════════
   RENDER SCRATCH-OFF MODAL
   ═════════════════════════════════════════════════════════════════════════════════════════════ */

window.ScratchOffModal = {
  render(state, catalog) {
    const n = state?.nation;
    const card = activeCard(n);
    const cardType = card ? card.type : "pets";
    const gridSize = card ? card.gridSize : GRID_SIZE_BY_TYPE[cardType] || 3;
    const is1x3 = gridSize === 3;
    const cardCols = is1x3 ? 3 : 3;
    const cardRows = is1x3 ? 1 : 3;
    const cost = card ? card.cost : (CARD_BASE_COST[cardType] || 50);
    const moneyVal = n?.money || 0;
    const canAfford = moneyVal >= cost;

    const typeOptions = Object.entries(CARD_TYPE_LABELS)
      .map(([key, label]) => {
        const selected = key === cardType ? "selected" : "";
        return `<option value="${esc(key)}" ${selected}>${esc(label)} (${money(CARD_BASE_COST[key])})</option>`;
      })
      .join("");

    // Build tile HTML
    let tilesHtml = "";
    if (card) {
      for (let i = 0; i < gridSize; i++) {
        const revealed = card.revealed && card.revealed[i];
        if (revealed) {
          tilesHtml += `
            <div class="fortune-scratch-tile tile-revealed" data-tile="${i}" data-revealed="true">
              ${tileSymbolDisplay(card.type, card.symbols[i])}
            </div>
          `;
        } else {
          tilesHtml += `
            <button class="fortune-scratch-tile" data-action="fortune:scratchOff:revealTile" data-payload='{"cardId":"${esc(card.id)}","tileIndex":${i}}' data-tile="${i}" data-revealed="false">
              <div class="fortune-scratch-coating"></div>
              <div class="fortune-scratch-mask"></div>
            </button>
          `;
        }
      }
    } else {
      // Show covered placeholder tiles before purchase
      for (let i = 0; i < gridSize; i++) {
        tilesHtml += `
          <div class="fortune-scratch-tile tile-locked" data-tile="${i}" data-revealed="false">
            <div class="fortune-scratch-coating"></div>
            <div class="fortune-scratch-mask"></div>
            <div class="fortune-scratch-lock">?</div>
          </div>
        `;
      }
    }

    const won = card ? card.won : false;
    const claimed = card ? card.claimed : false;
    const prize = card ? card.prize : 0;
    const revealedCount = card ? (card.revealed || []).filter(Boolean).length : 0;
    const allRevealed = revealedCount >= gridSize;
    const autoScratchEnabled = card && !won && !allRevealed;

    const showResult = card && (allRevealed || won);

    let body = `
      <div class="fortune-scratch-container">
        <div class="fortune-scratch-header">
          <div class="fortune-scratch-type-row">
            <label class="fortune-scratch-type-label">Card Type:</label>
            <select id="scratch-card-type" onchange="window.ScratchOffModalHandlers.setCardType(this.value)">${typeOptions}</select>
            <span class="fortune-scratch-type-desc">${esc(CARD_TYPE_DESC[cardType])}</span>
          </div>
          <div class="fortune-scratch-cost-row">
            <span class="fortune-scratch-cost-label">Cost:</span>
            <span class="fortune-scratch-cost-value">${money(cost)}</span>
            ${canAfford ? "" : `<span class="fortune-scratch-cost-short">Insufficient funds</span>`}
          </div>
          ${button("Buy Card", "fortune:scratchOff:buyCard", { cardType }, canAfford, "primary")}
        </div>

        <div class="fortune-scratch-card-frame">
          <div class="fortune-scratch-card">
            <div class="fortune-scratch-grid" style="grid-template-columns: repeat(${cardCols}, 1fr); grid-template-rows: repeat(${cardRows}, 1fr);">
              ${tilesHtml}
            </div>
          </div>
        </div>

        <div class="fortune-scratch-actions">
          ${button("Auto-Scratch All", "fortune:scratchOff:autoScratch", { cardId: card ? card.id : "" }, autoScratchEnabled, "secondary")}
          ${button("Claim Prize", "fortune:scratchOff:claimPrize", { cardId: card ? card.id : "" }, won && !claimed && allRevealed, "success")}
          ${button("Buy New Card", "fortune:scratchOff:buyCard", { cardType }, canAfford, "primary")}
        </div>

        ${showResult ? `
          <div class="fortune-scratch-result ${won ? "result-won" : "result-lost"}">
            <div class="fortune-scratch-result-icon">${won ? "🎉" : "😔"}</div>
            <div class="fortune-scratch-result-title">${won ? "WINNER!" : "Not a winner"}</div>
            <div class="fortune-scratch-result-prize">${won ? money(prize) : "$0"}</div>
            <div class="fortune-scratch-result-msg">${won ? `You won ${money(prize)}!` : "Better luck next time."}</div>
          </div>
        ` : ""}
      </div>
    `;

    return `
      <div class="fortune-modal-header">
        <h2>🎫 Scratch-off</h2>
        <button class="fortune-modal-close" data-action="closeFortuneModal">✕</button>
      </div>
      <div class="fortune-modal-body">${body}</div>
    `;
  },
};

window.ScratchOffModal.displayName = "ScratchOffModal";

/* ═════════════════════════════════════════════════════════════════════════════════════════════
   SCRATCH-OFF ACTION HANDLERS (exposed for game.js)
   ══════════════════════════════════════════════════════════════════════════════════════════════ */

async function scratchOffApi(action, data) {
  const res = await fetch("/api/fortune", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game: "scratchOff", action, data: data || {} }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Scratch-off action failed");
  }
  return res.json();
}

window.ScratchOffModalHandlers = {
  async setCardType(cardType) {
    // Just update local state; render will be triggered by game.js
    return { ok: true, cardType };
  },
  async buyCard(cardType) {
    const result = await scratchOffApi("buyCard", { cardType });
    if (result.ok) {
      // State updated via SSE broadcast; re-render handled by game.js
    }
    return result;
  },
  async revealTile(cardId, tileIndex) {
    const result = await scratchOffApi("revealTile", { cardId, tileIndex });
    return result;
  },
  async autoScratch(cardId) {
    const result = await scratchOffApi("autoScratch", { cardId });
    return result;
  },
  async claimPrize(cardId) {
    const result = await scratchOffApi("claimPrize", { cardId });
    return result;
  },
};
