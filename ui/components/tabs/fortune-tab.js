"use strict";
/**
 * Fortune Tab - Sovereignty Epochs
 * Renders the Fortune tab content with two sections:
 *   1. Casino — 5 games (Scratch-off, Wheel of Sovereignty, Keno, Blackjack, Gamblers Dice)
 *   2. Tarot  — Free tarot readings (1/3/5 cards, Traditional/Cat Arcana)
 *
 * Pure HTML generator. Receives state/catalog and returns an HTML string rendered
 * into panel-fortune by game.js. Exports: renderFortuneTab(state, catalog) -> HTML string.
 * Sets: window.renderFortuneTab
 */

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const money = (value) => "$" + (Number(value || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 });
const empty = (message) => `<div class="empty">${esc(message)}</div>`;

const button = (label, action, data, enabled = true, style = "primary") =>
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(JSON.stringify(data || {}))}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;

const select = (name, items, selected, disabled = false) =>
  `<select name="${esc(name)}" ${disabled ? "disabled" : ""}>${
    Object.entries(items)
      .map(
        ([k, v]) =>
          `<option value="${esc(k)}" ${k === selected ? "selected" : ""}>${esc(
            typeof v === "object" ? v.name : v,
          )}</option>`,
      )
      .join("")
  }</select>`;

const heading = (title, subtitle, kicker = "Fortune") =>
  `<header class="page-heading"><div><div class="eyebrow">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div></header>`;

const CASINO_GAMES = [
  {
    key: "scratchOff",
    name: "Scratch-off",
    icon: "🎫",
    desc: "Instant-win cards. Scratch tiles to reveal symbols.",
    minBet: 50,
    maxBet: 2500,
  },
  {
    key: "wheel",
    name: "Wheel of Sovereignty",
    icon: "🎡",
    desc: "152-slice wheel. 1 free spin per day.",
    minBet: 0,
    maxBet: 0,
  },
  {
    key: "keno",
    name: "Keno",
    icon: "🐾",
    desc: "Pick 1-10 pets. House draws 20. Multiplier pet boosts prize.",
    minBet: 100000,
    maxBet: 2500000,
  },
  {
    key: "blackjack",
    name: "Blackjack",
    icon: "♠",
    desc: "Multiplayer table. Hit, Stand, Double, Split, Surrender.",
    minBet: 100,
    maxBet: 100000,
  },
  {
    key: "gamblerDice",
    name: "Gamblers Dice",
    icon: "🎲",
    desc: "Multiplayer dice room. Bet on rolls, pass dice to next.",
    minBet: 100,
    maxBet: 100000,
  },
];

function casinoBalance(state) {
  const casino = state?.nation?.casino || {};
  const games = casino.games || {};
  let totalSpent = 0;
  let totalWon = 0;
  for (const key of Object.keys(games)) {
    const g = games[key];
    if (g && typeof g === "object") {
      totalSpent += g.spent || 0;
      totalWon += g.wonAmount || 0;
    }
  }
  return { money: state?.nation?.money || 0, pool: casino.lotteryPool || 0, spent: totalSpent, won: totalWon };
}

function gameTile(game) {
  const { key, name, icon, desc, minBet, maxBet } = game;
  const betLine =
    minBet > 0 || maxBet > 0
      ? `<div class="fortune-bet-line">${money(minBet)} – ${money(maxBet)}</div>`
      : `<div class="fortune-bet-line fortune-free">Free daily spin</div>`;
  return `<div class="fortune-game-tile">
    <div class="fortune-game-icon">${icon}</div>
    <div class="fortune-game-name">${esc(name)}</div>
    <div class="fortune-game-desc">${esc(desc)}</div>
    ${betLine}
    <div class="fortune-game-action">${button("Play", "openFortuneModal", { game: key })}</div>
  </div>`;
}

/* ══════════════════════════════════════════════════════════════════════════════════════
   RENDER FORTUNE TAB
   ══════════════════════════════════════════════════════════════════════════════════════ */

window.renderFortuneTab = (state, catalog) => {
  if (!state) return empty("Loading fortune data…");
  const bal = casinoBalance(state);

  const casinoSection = `
    <section class="fortune-casino-section">
      <div class="fortune-section-title">
        <h2>🎰 Casino</h2>
        <div class="fortune-balance-row">
          <div class="fortune-balance-item"><span class="fortune-balance-label">Balance</span><span class="fortune-balance-value">${money(bal.money)}</span></div>
          <div class="fortune-balance-item"><span class="fortune-balance-label">World Bank Pool</span><span class="fortune-balance-value">${money(bal.pool)}</span></div>
        </div>
      </div>
      <div class="fortune-casino-grid">
        ${CASINO_GAMES.map(gameTile).join("")}
      </div>
      <div class="fortune-casino-footer">
        <p class="fortune-muted">All wagers and payouts flow through the World Bank lottery pool. Pool cannot go below $0.</p>
      </div>
    </section>
  `;

  const tarotSection = `
    <section class="fortune-tarot-section">
      <div class="fortune-section-title">
        <h2>🔮 Tarot Reading</h2>
      </div>
      <div class="fortune-tarot-controls">
        <label class="fortune-control-label">Reading:</label>
        ${select("fortune-tarot-type", { single: "1 Card · The Moment", three: "3 Cards · The Journey", five: "5 Cards · The Crossroads" }, "three")}
        <label class="fortune-control-label">Deck:</label>
        ${select("fortune-tarot-deck", { traditional: "Traditional (78)", cat: "Cat Arcana (22)" }, "traditional")}
        ${button("Shuffle Deck", "openFortuneModal", { game: "tarot" }, true, "secondary")}
        ${button("Deal", "openFortuneModal", { game: "tarot" }, true, "primary")}
      </div>
      <div class="fortune-tarot-spread" id="fortune-tarot-spread">
        <div class="fortune-tarot-empty">Select reading type, shuffle, then deal.</div>
      </div>
      <div class="fortune-tarot-result" id="fortune-tarot-result" style="display:none;">
        <div class="fortune-tarot-synthesis" id="fortune-tarot-synthesis"></div>
        <div class="fortune-tarot-advice" id="fortune-tarot-advice"></div>
        ${button("New Reading", "openFortuneModal", { game: "tarot" }, true, "secondary")}
      </div>
    </section>
  `;

  return `${heading("Fortune", "Casino games and tarot readings.", "Fortune")}${casinoSection}${tarotSection}`;
};

window.renderFortuneTab.displayName = "renderFortuneTab";
