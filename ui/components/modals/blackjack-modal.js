"use strict";
/**
 * Blackjack Modal - Sovereignty Epochs
 * Multiplayer blackjack room (1-6 seats) with deal animation and per-user
 * cardSet rendering (each user sees their own cardSet for their cards + dealer).
 * Exports: window.BlackjackModal.render(state, catalog) -> HTML string
 * Sets: window.BlackjackModal
 */

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const money = (value) => "$" + (Number(value || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 });

const button = (label, action, data, enabled = true, style = "primary") =>
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(JSON.stringify(data || {}))}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;

const SUIT_FOLDER = { hearts: "Hearts", diamonds: "Diamond", clubs: "Clover", spades: "Spades" };
const RANK_NAME = { A: "Ace", 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven", 8: "Eight", 9: "Nine", 10: "Ten", J: "Jack", Q: "Queen", K: "King" };

// Per-card-set image path builders. Different sets use different naming conventions.
// Classic:   Classic/Hearts/Ace-Of-Hearts.png      (suit subfolder, full names, "-Of-")
// Dark:      Dark/A-H.png                          (flat, rank+suit letter, P=Spades)
// Light:     Light/A-H.png                         (flat, rank+suit letter, P=Spades)
// Off-White: Off-White/A-S.png                     (flat, rank+suit letter, S=Spades)
// Artistic:  Artistic/heart_0001.png               (flat, suit_lower + rank 2-digit)
// White&Red: White & Red tinted/ace_hearts.png     (flat, rank_lower_suit_lower, optional _white)
const RANK_NUM = { A: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13 };
const SUIT_LETTER = { hearts: "H", diamonds: "D", clubs: "C", spades: "P" }; // Dark/Light use P for Spades
const SUIT_LETTER_OFFWHITE = { hearts: "H", diamonds: "D", clubs: "C", spades: "S" }; // Off-White uses S
const SUIT_LOWER = { hearts: "heart", diamonds: "diamond", clubs: "club", spades: "spade" }; // Artistic
const SUIT_LOWER_WR = { hearts: "hearts", diamonds: "diamonds", clubs: "clubs", spades: "spades" }; // White & Red tinted
const RANK_LOWER_WR = { A: "ace", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", J: "jack", Q: "queen", K: "king" }; // White & Red tinted

function cardImg(cardSet, card) {
  if (!card) return "";
  const suit = card.suit;
  const rank = card.rank;
  const setLower = String(cardSet).toLowerCase();

  // Classic: suit subfolder + full names + "-Of-"
  if (setLower === "classic") {
    const suitFolder = SUIT_FOLDER[suit] || "Spades";
    const rankLabel = RANK_NAME[rank] ?? rank;
    return `assets/images/Cards/${esc(cardSet)}/${suitFolder}/${esc(rankLabel)}-Of-${suitFolder}.png`;
  }
  // Artistic: suit_lower + rank 2-digit
  if (setLower === "artistic") {
    const suitName = SUIT_LOWER[suit] || "spade";
    const rankNum = String(RANK_NUM[rank] || 1).padStart(4, "0");
    return `assets/images/Cards/${esc(cardSet)}/${suitName}_${rankNum}.png`;
  }
  // White & Red tinted: rank_lower_suit_lower[_white].png
  if (setLower.includes("white") || setLower.includes("red") || setLower.includes("tinted")) {
    const suitName = SUIT_LOWER_WR[suit] || "spades";
    const rankName = RANK_LOWER_WR[rank] ?? rank;
    return `assets/images/Cards/${esc(cardSet)}/${rankName}_${suitName}.png`;
  }
  // Off-White: flat rank+suit letter, S=Spades
  if (setLower.includes("off")) {
    const suitLetter = SUIT_LETTER_OFFWHITE[suit] || "S";
    const rankLabel = rank === 10 ? "10" : (RANK_NAME[rank] ?? rank).charAt(0).toUpperCase();
    return `assets/images/Cards/${esc(cardSet)}/${rankLabel}${suitLetter}.png`;
  }
  // Dark / Light (default): flat rank+suit letter, P=Spades
  const suitLetter = SUIT_LETTER[suit] || "P";
  const rankLabel = rank === 10 ? "10" : (RANK_NAME[rank] ?? rank).charAt(0).toUpperCase();
  return `assets/images/Cards/${esc(cardSet)}/${rankLabel}${suitLetter}.png`;
}

function rankSymbol(card) {
  if (!card) return "";
  const sym = { A: "A", J: "J", Q: "Q", K: "K" };
  return sym[card.rank] ?? card.rank;
}

// Client-side blackjack modal state (persists within a session).
const bjModalState = {
  tableId: null,
  seatIndex: null,
  cardSet: "Classic",
  tableState: null,
  animating: false,
  lastHandSizes: {}, // seatIndex -> hand size, to detect new cards for animation
  rebetAmount: 0,
};

/* ═════════════════════════════════════════════════════════════════════════════════════════════
   CARD RENDERING
   ═════════════════════════════════════════════════════════════════════════════════════════════ */

function cardEl(card, cardSet, faceDown = false, animated = false) {
  const suitClass = card ? card.suit : "";
  const isRed = suitClass === "hearts" || suitClass === "diamonds";
  const colorCls = isRed ? "bj-card-red" : "bj-card-black";
  const aniCls = animated ? "bj-deal-animate" : "";
  if (faceDown) {
    return `<div class="bj-card bj-card-face-down ${aniCls}">
      <div class="bj-card-back"></div>
    </div>`;
  }
  if (!card) return `<div class="bj-card bj-card-empty ${aniCls}"></div>`;
  return `
    <div class="bj-card ${colorCls} ${aniCls}" data-suit="${esc(card.suit)}" data-rank="${esc(card.rank)}">
      <div class="bj-card-top">
        <span class="bj-rank">${esc(rankSymbol(card))}</span>
        <span class="bj-suit">${suitSymbol(card.suit)}</span>
      </div>
      <div class="bj-card-center">
        <img src="${esc(cardImg(cardSet, card))}" class="bj-card-img" alt="${esc(card.rank)} of ${esc(card.suit)}" onerror="this.style.display='none';this.parentElement.classList.add('bj-card-noimg');" />
        <span class="bj-rank-big">${esc(rankSymbol(card))}</span>
        <span class="bj-suit-big">${suitSymbol(card.suit)}</span>
      </div>
      <div class="bj-card-bottom">
        <span class="bj-rank">${esc(rankSymbol(card))}</span>
        <span class="bj-suit">${suitSymbol(card.suit)}</span>
      </div>
    </div>
  `;
}

function suitSymbol(suit) {
  const s = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" };
  return s[suit] ?? suit;
}

/* ═════════════════════════════════════════════════════════════════════════════════════════════
   RENDER BLACKJACK MODAL
   ═════════════════════════════════════════════════════════════════════════════════════════════ */

window.BlackjackModal = {
  render(state, catalog) {
    const n = state?.nation;
    const moneyVal = n?.money || 0;
    const ui = state?.player?.settings?.ui || {};
    const cardSet = ui.cardSet || "Classic";
    bjModalState.cardSet = cardSet;

    const ts = bjModalState.tableState;
    const inTable = !!ts;
    const status = ts ? ts.status : "waiting";
    const minBet = ts ? ts.minBet : 100;
    const maxBet = ts ? ts.maxBet : 100000;
    const dealerUp = ts ? ts.dealerUpCard : null;
    const dealerHole = ts ? ts.dealerHoleCard : null;
    const dealerHoleRevealed = ts ? ts.dealerHoleCardRevealed : false;
    const seats = ts ? ts.seats : [];
    const currentSeatIndex = ts ? ts.currentSeatIndex : -1;
    const shoeRemaining = ts ? ts.shoeCardsRemaining : 0;

    // Determine if this client is at the table
    const mySeatIndex = bjModalState.seatIndex;
    const mySeat = mySeatIndex !== null ? seats[mySeatIndex] : null;
    const myTurn = mySeatIndex !== null && currentSeatIndex === mySeatIndex && mySeat && mySeat.status === "playing";

    // Bet phase UI
    let betUI = "";
    if (inTable && (status === "waiting" || status === "betting")) {
      const canBet = mySeat && mySeat.status !== "betting" && mySeat.bet === 0 && moneyVal >= minBet;
      const rebetEnabled = bjModalState.rebetAmount > 0 && moneyVal >= bjModalState.rebetAmount;
      betUI = `
        <div class="bj-bet-phase">
          <div class="bj-bet-row">
            <label class="bj-bet-label">Bet (${money(minBet)}–${money(maxBet)}):</label>
            <input type="number" id="bj-bet-input" value="${bjModalState.rebetAmount || minBet}" min="${minBet}" max="${maxBet}" step="100" class="bj-bet-input" />
            ${button("Bet", "fortune:blackjack:placeBet", {}, canBet, "primary", "bj-bet-btn")}
            ${button("Rebet", "fortune:blackjack:rebet", {}, rebetEnabled, "secondary", "bj-rebet-btn")}
          </div>
          <div class="bj-bet-hint">
            ${mySeat && mySeat.bet > 0 ? `Bet placed: ${money(mySeat.bet)}` : "Place a bet to join the next hand."}
          </div>
        </div>
      `;
    }

    // Table view
    let tableUI = "";
    if (inTable) {
      tableUI = `
        <div class="bj-table">
          <div class="bj-dealer-section">
            <div class="bj-dealer-label">Dealer</div>
            <div class="bj-hand bj-dealer-hand">
              ${dealerUp ? cardEl(dealerUp, cardSet, false, true) : ""}
              ${dealerHoleRevealed && dealerHole ? cardEl(dealerHole, cardSet, false, true) : dealerHole ? cardEl(null, cardSet, true, true) : cardEl(null, cardSet, true, true)}
            </div>
            ${dealerHoleRevealed ? `<div class="bj-dealer-value">Dealer: ${ts.dealerValue}</div>` : `<div class="bj-dealer-value">Dealer: ?</div>`}
          </div>
          <div class="bj-seats">
            ${seats.map((s, i) => seatEl(s, i, cardSet, mySeatIndex, myTurn, status)).join("")}
          </div>
        </div>
      `;
    }

    // Action buttons (your turn)
    let actionsUI = "";
    if (myTurn && mySeat) {
      const { canHit, canStand, canDouble, canSplit, canSurrender } = mySeat;
      actionsUI = `
        <div class="bj-actions">
          ${button("Hit", "fortune:blackjack:hit", {}, canHit, "primary", "bj-action-hit")}
          ${button("Stand", "fortune:blackjack:stand", {}, canStand, "primary", "bj-action-stand")}
          ${button("Double", "fortune:blackjack:doubleDown", {}, canDouble, "secondary", "bj-action-double")}
          ${button("Split", "fortune:blackjack:split", {}, canSplit, "secondary", "bj-action-split")}
          ${button("Surrender", "fortune:blackjack:surrender", {}, canSurrender, "secondary", "bj-action-surrender")}
        </div>
      `;
    }

    // Turn indicator
    let turnUI = "";
    if (inTable && status === "playerTurn") {
      const actingSeat = seats[currentSeatIndex];
      const isMe = currentSeatIndex === mySeatIndex;
      turnUI = `<div class="bj-turn">
        ${isMe ? "Your turn" : esc(actingSeat.nationId || actingSeat.userId || "Player") + "'s turn"}
        ${actingSeat.turnTimerRemaining > 0 ? ` (${Math.ceil(actingSeat.turnTimerRemaining / 1000)}s)` : ""}
      </div>`;
    }

    // Result / message
    let resultUI = "";
    if (inTable && (status === "settling" || status === "dealerTurn")) {
      resultUI = `<div class="bj-result">Dealer playing…</div>`;
    }

    const joinUI = !inTable ? `
      <div class="bj-join">
        <div class="bj-join-title">Blackjack Tables</div>
        <div class="bj-table-list">
          <div class="bj-table-row bj-table-public">
            <span>Public Table</span>
            <span class="bj-table-seats">Open seats</span>
            ${button("Join Table", "fortune:blackjack:joinTable", {}, true, "primary", "bj-join-btn")}
          </div>
        </div>
      </div>
    ` : "";

    return `
      <div class="fortune-modal-header">
        <h2>♠ Blackjack</h2>
        <button class="fortune-modal-close" data-action="closeFortuneModal">✕</button>
      </div>
      <div class="fortune-modal-body">
        <div class="bj-container">
          ${joinUI}
          ${betUI}
          ${tableUI}
          ${turnUI}
          ${actionsUI}
          ${resultUI}
          ${inTable ? button("Leave Table", "fortune:blackjack:leaveTable", {}, status !== "playing" && status !== "betting", "secondary", "bj-leave-btn") : ""}
        </div>
      </div>
    `;
  },
};

window.BlackjackModal.displayName = "BlackjackModal";

function seatEl(seat, seatIndex, cardSet, mySeatIndex, myTurn, status) {
  const empty = !s || typeof s.isEmpty === "function" ? s.isEmpty() : !s || Object.keys(s).length === 0;
  const isMe = seatIndex === mySeatIndex;
  const playing = seat.status === "playing" || seat.status === "stood" || seat.status === "blackjack" || seat.status === "busted" || seat.status === "surrendered";
  const handHtml = seat.hand.map((c, ci) => cardEl(c, cardSet, false, ci === 0)).join("");
  const splitHtml = seat.splitHand ? `<div class="bj-split-label">Split Hand</div><div class="bj-hand">${seat.splitHand.hand.map((c, ci) => cardEl(c, cardSet, false, ci === 0)).join("")}</div><div class="bj-hand-value">${calculateBJValue(seat.splitHand.hand)}</div>` : "";
  const statusLabel = {
    waiting: "Waiting",
    betting: "Betting",
    playing: "Playing",
    stood: "Stood",
    blackjack: "BLACKJACK!",
    busted: "BUSTED",
    surrendered: "Surrendered",
    insurance: "Insurance",
  }[seat.status] || seat.status;
  return `
    <div class="bj-seat ${isMe ? "bj-seat-me" : ""} ${empty ? "bj-seat-empty" : ""} ${playing ? "bj-seat-playing" : ""}">
      <div class="bj-seat-label">${empty ? "Empty" : esc(seat.nationId || seat.userId || "Player")}${isMe ? " (You)" : ""}</div>
      <div class="bj-hand">${handHtml}</div>
      <div class="bj-hand-value">${empty ? "" : calculateBJValue(seat.hand)}</div>
      ${splitHtml}
      <div class="bj-seat-bet">${empty ? "" : `Bet: ${money(seat.bet || 0)}`}</div>
      <div class="bj-seat-status">${empty ? "" : esc(statusLabel)}</div>
      ${isMe && seat.canPlaceInsurance ? `<div class="bj-insurance">Insurance offered (up to ${money(Math.floor(seat.bet * 0.5))})</div>` : ""}
    </div>
  `;
}

function calculateBJValue(hand) {
  if (!hand || hand.length === 0) return 0;
  let value = 0;
  let aces = 0;
  for (const c of hand) {
    if (c.rank === "A") { aces++; value += 11; }
    else if (c.rank === "K" || c.rank === "Q" || c.rank === "J") value += 10;
    else value += parseInt(c.rank) || 0;
  }
  while (value > 21 && aces > 0) { value -= 10; aces--; }
  return value;
}

/* ═════════════════════════════════════════════════════════════════════════════════════════════
   BLACKJACK ACTION HANDLERS (exposed for game.js)
   ═════════════════════════════════════════════════════════════════════════════════════════════ */

async function bjApi(action, data) {
  const res = await fetch("/api/fortune", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game: "blackjack", action, data: data || {} }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Blackjack action failed");
  }
  return res.json();
}

window.BlackjackModalHandlers = {
  async joinTable() {
    const result = await bjApi("joinTable", {});
    if (result.ok) {
      bjModalState.tableId = result.tableId;
      bjModalState.seatIndex = result.seat ? result.seat.seatIndex : null;
      bjModalState.cardSet = result.cardSet || "Classic";
      bjModalState.tableState = result.tableState || null;
      bjModalState.rebetAmount = result.seat ? result.seat.bet : 0;
    }
    return result;
  },
  async placeBet(amount) {
    const result = await bjApi("placeBet", { tableId: bjModalState.tableId, seatIndex: bjModalState.seatIndex, amount });
    if (result.ok) {
      bjModalState.tableState = result.tableState;
      bjModalState.rebetAmount = amount;
      // Trigger deal animation if table moved to dealing
      if (result.tableState && result.tableState.status === "dealing") {
        window.BlackjackModalAnimateDeal(result.tableState);
      }
    }
    return result;
  },
  async rebet() {
    return this.placeBet(bjModalState.rebetAmount || 0);
  },
  async dealInitial() {
    const result = await bjApi("dealInitial", { tableId: bjModalState.tableId });
    if (result.ok) {
      bjModalState.tableState = result.tableState;
      window.BlackjackModalAnimateDeal(result.tableState);
    }
    return result;
  },
  async hit() {
    const result = await bjApi("hit", { tableId: bjModalState.tableId, seatIndex: bjModalState.seatIndex });
    if (result.ok) {
      bjModalState.tableState = result.tableState;
      window.BlackjackModalAnimateDeal(result.tableState);
    }
    return result;
  },
  async stand() {
    const result = await bjApi("stand", { tableId: bjModalState.tableId, seatIndex: bjModalState.seatIndex });
    if (result.ok) bjModalState.tableState = result.tableState;
    return result;
  },
  async doubleDown() {
    const result = await bjApi("doubleDown", { tableId: bjModalState.tableId, seatIndex: bjModalState.seatIndex });
    if (result.ok) {
      bjModalState.tableState = result.tableState;
      window.BlackjackModalAnimateDeal(result.tableState);
    }
    return result;
  },
  async split() {
    const result = await bjApi("split", { tableId: bjModalState.tableId, seatIndex: bjModalState.seatIndex });
    if (result.ok) {
      bjModalState.tableState = result.tableState;
      window.BlackjackModalAnimateDeal(result.tableState);
    }
    return result;
  },
  async surrender() {
    const result = await bjApi("surrender", { tableId: bjModalState.tableId, seatIndex: bjModalState.seatIndex });
    if (result.ok) bjModalState.tableState = result.tableState;
    return result;
  },
  async leaveTable() {
    const result = await bjApi("leaveTable", { tableId: bjModalState.tableId, seatIndex: bjModalState.seatIndex });
    if (result.ok) {
      bjModalState.tableId = null;
      bjModalState.seatIndex = null;
      bjModalState.tableState = null;
      bjModalState.animating = false;
    }
    return result;
  },
  async refresh() {
    const result = await bjApi("getTableState", { tableId: bjModalState.tableId });
    if (result.ok) bjModalState.tableState = result.tableState;
    return result;
  },
};

// Expose deal animation for game.js to call after server returns tableState.
window.BlackjackModalAnimateDeal = (tableState) => {
  bjModalState.tableState = tableState;
  // Detect new cards vs last known sizes to trigger animation classes.
  const seats = tableState.seats || [];
  const dealerLen = tableState.dealerHand ? tableState.dealerHand.length : 0;
  const mySeatIdx = bjModalState.seatIndex;
  bjModalState.animating = true;
  setTimeout(() => { bjModalState.animating = false; }, 1200);
};
