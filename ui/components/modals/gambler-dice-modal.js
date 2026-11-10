"use strict";
/**
 * Gambler Dice Modal - Sovereignty Epochs
 * Multiplayer craps-style dice table (D4/D6/D8/D12/D20), spectator betting,
 * pass-dice-to-next, per-user dice color from settings.
 * Exports: window.GamblerDiceModal.render(state, catalog) -> HTML string
 * Sets: window.GamblerDiceModal
 */

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const money = (value) => "$" + (Number(value || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 });

const button = (label, action, data, enabled = true, style = "primary") =>
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(JSON.stringify(data || {}))}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;

const DIE_SIZES = [
  { key: "d4", label: "D4", faces: 4, maxCount: 5 },
  { key: "d6", label: "D6", faces: 6, maxCount: 5 },
  { key: "d8", label: "D8", faces: 8, maxCount: 5 },
  { key: "d12", label: "D12", faces: 12, maxCount: 5 },
  { key: "d20", label: "D20", faces: 20, maxCount: 5 },
];

const BET_TYPE_LABELS = {
  pass: "Pass", dont_pass: "Don't Pass", exact: "Exact Number",
  high: "High", low: "Low", odd: "Odd", even: "Even", range: "Range",
  field: "Field", any_craps: "Any Craps", hardway: "Hardway",
  match_any: "Match Any", sum_exact: "Sum Exact", sum_range: "Sum Range", jackpot: "Jackpot",
};

const BET_TYPE_DESC = {
  pass: "Win on 7/11 come-out; lose on 2/3/12; else point",
  dont_pass: "Win on 2/3; push on 12; lose on 7/11; else vs point",
  exact: "All dice show the target face",
  high: "Sum is above half of max",
  low: "Sum is below half of max",
  odd: "Sum is odd",
  even: "Sum is even",
  range: "Sum is within [lo, hi]",
  field: "Win on 2/3/4/9/10/11/12",
  any_craps: "Roll 2, 3, or 12",
  hardway: "All dice show the same even number",
  match_any: "At least two dice match",
  sum_exact: "Sum equals target",
  sum_range: "Sum within [lo, hi]",
  jackpot: "All dice match → jackpot pool",
};

const TARGET_PLACEHOLDER = {
  exact: "Face (1–N)", range: "lo,hi (e.g. 3,8)", hardway: "Even face",
  sum_exact: "Target sum", sum_range: "lo,hi sum",
};

const DICE_COLORS = { black: "#000000", blue: "#2563eb", green: "#15803d", purple: "#7c3aed", red: "#dc2626", white: "#ffffff", yellow: "#ca8a04" };

// Client-side state.
const gdModalState = {
  tableId: null,
  seatIndex: null,
  diceType: "white",
  diceStyle: "dots",
  tableState: null,
  betMenu: null,
  betType: null,
  target: "",
  amount: 100,
  animating: false,
  lastRollFaces: null,
};

/* ═══════════════════════════════════════════════════════════════════════════════
   DICE IMAGE
   ══════════════════════════════════════════════════════════════════════════════ */

function dieImg(dieSize, color, face, diceStyle) {
  const sizeUpper = dieSize.toUpperCase();
  // D6 has both dots (d6_) and digits (D6N_) variants; all others are dots only.
  const prefix = (sizeUpper === "D6" && diceStyle === "digits") ? "D6N" : `d${sizeUpper.toLowerCase()}`;
  return `assets/images/Dice/${sizeUpper}/${prefix}_${esc(color)}_${esc(face)}.png`;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   RENDER GAMBLER DICE MODAL
   ══════════════════════════════════════════════════════════════════════════════ */

window.GamblerDiceModal = {
  async render(state, catalog) {
    const n = state?.nation;
    const moneyVal = n?.money || 0;
    const ui = state?.player?.settings?.ui || {};
    const diceType = ui.diceType || "white";
    const diceStyle = ui.diceStyle || "dots";
    gdModalState.diceType = diceType;
    gdModalState.diceStyle = diceStyle;

    const ts = gdModalState.tableState;
    const inTable = !!ts;
    const status = ts ? ts.status : "waiting";
    const dieSize = ts ? ts.dieSize : "d6";
    const diceCount = ts ? ts.diceCount : 2;
    const minBet = ts ? ts.minBet : 100;
    const maxBet = ts ? ts.maxBet : 100000;
    const jackpotPool = ts ? ts.jackpotPool : 0;
    const shooterIdx = ts ? ts.shooterSeatIndex : -1;
    const point = ts ? ts.point : null;
    const pointEstablished = ts ? ts.pointEstablished : false;
    const seats = ts ? ts.seats : [];
    const lastRoll = ts ? ts.lastRoll : null;
    const validBets = ts ? ts.validBets : [];
    const mySeatIndex = gdModalState.seatIndex;
    const mySeat = mySeatIndex !== null ? seats[mySeatIndex] : null;
    const isShooter = mySeatIndex !== null && mySeatIndex === shooterIdx;

    // Fetch bet menu if not loaded and we're in a table
    if (inTable && (!gdModalState.betMenu || gdModalState.betMenu.dieSize !== dieSize || gdModalState.betMenu.diceCount !== diceCount)) {
      try {
        const menuRes = await gdApi("getBetMenu", { dieSize, diceCount });
        if (menuRes.ok) gdModalState.betMenu = menuRes;
      } catch {
        // ignore
      }
    }

    // Bet type options (filtered to valid for this die size)
    const betOptions = validBets.map((bt) => {
      const selected = bt === gdModalState.betType ? "selected" : "";
      return `<option value="${esc(bt)}" ${selected}>${esc(BET_TYPE_LABELS[bt] || bt)}</option>`;
    }).join("");

    const requiresTarget = ["exact", "range", "hardway", "sum_exact", "sum_range"].includes(gdModalState.betType || "");
    const targetDisabled = !requiresTarget;

    // Seat rows
    let seatsHtml = "";
    for (const s of seats) {
      const empty = !s || typeof s.isEmpty === "function" ? s.isEmpty() : !s || Object.keys(s).length === 0;
      const isMe = s.seatIndex === mySeatIndex;
      const isShooterSeat = s.seatIndex === shooterIdx;
      const betsHtml = s.bets.map((b) => `
        <div class="gd-bet-chip ${b.won === true ? "won" : b.won === false ? "lost" : ""}">
          ${esc(BET_TYPE_LABELS[b.betType] || b.betType)} ${b.target !== null ? `<span class="gd-bet-target">→${esc(b.target)}</span>` : ""}
          <span class="gd-bet-amt">${money(b.amount)}</span>
          ${b.won === true ? `<span class="gd-bet-payout">+${money(b.payout)}</span>` : ""}
          ${b.won === false ? `<span class="gd-bet-payout lost">−${money(b.amount)}</span>` : ""}
        </div>
      `).join("");
      seatsHtml += `
        <div class="gd-seat ${isMe ? "gd-seat-me" : ""} ${empty ? "gd-seat-empty" : ""} ${isShooterSeat ? "gd-seat-shooter" : ""}">
          <div class="gd-seat-label">
            ${empty ? "Empty" : esc(s.nationId || s.userId || "Player")}${isMe ? " (You)" : ""}
            ${isShooterSeat ? " <span class='gd-shooter-badge'>SHOOTER</span>" : ""}
          </div>
          <div class="gd-seat-bets">${betsHtml || `<div class="gd-bet-empty">No bets</div>`}</div>
          <div class="gd-seat-total">Wagered: ${money(s.totalWagered || 0)} · Won: ${money(s.totalWon || 0)}</div>
        </div>
      `;
    }

    // Bet panel
    const betPanel = `
      <div class="gd-bet-panel">
        <div class="gd-bet-row">
          <label class="gd-label">Die:</label>
          <select id="gd-die-size" onchange="window.GamblerDiceModalHandlers.setDieSize(this.value)">${DIE_SIZES.map(ds => `<option value="${esc(ds.key)}" ${ds.key === dieSize ? "selected" : ""}>${esc(ds.label)} (${ds.faces})</option>`).join("")}</select>
          <label class="gd-label">Count:</label>
          <select id="gd-dice-count" onchange="window.GamblerDiceModalHandlers.setDiceCount(this.value)">${[1,2,3,4,5].map(c => `<option value="${c}" ${c === diceCount ? "selected" : ""}>${c}</option>`).join("")}</select>
          ${dieSize === "d6" ? `
          <label class="gd-label">Style:</label>
          <select id="gd-dice-style" onchange="window.GamblerDiceModalHandlers.setDiceStyle(this.value)">
            <option value="dots" ${diceStyle === "dots" ? "selected" : ""}>Dots</option>
            <option value="digits" ${diceStyle === "digits" ? "selected" : ""}>Digits</option>
          </select>
          ` : ""}
        </div>
        <div class="gd-bet-row">
          <label class="gd-label">Bet Type:</label>
          <select id="gd-bet-type" onchange="window.GamblerDiceModalHandlers.updateBetType(this.value)">${betOptions}</select>
          <label class="gd-label">Target:</label>
          <input type="text" id="gd-bet-target" onchange="window.GamblerDiceModalHandlers.updateTarget(this.value)" value="${esc(gdModalState.target)}" placeholder="${esc(TARGET_PLACEHOLDER[gdModalState.betType] || "")}" ${targetDisabled ? "disabled" : ""} />
        </div>
        <div class="gd-bet-row">
          <label class="gd-label">Amount:</label>
          <input type="number" id="gd-bet-amount" value="${gdModalState.amount}" min="${minBet}" max="${maxBet}" step="100" />
          <span class="gd-balance">Balance: ${money(moneyVal)}</span>
          ${button("Place Bet", "fortune:gamblerDice:placeBet", {}, true, "primary", "gd-place-bet")}
        </div>
        <div class="gd-bet-payouts">
          ${gdModalState.betMenu && gdModalState.betMenu.bets ? `
            <div class="gd-payout-list">
              ${gdModalState.betMenu.bets.map((b) => `
                <span class="gd-payout-item">${esc(BET_TYPE_LABELS[b.betType] || b.betType)}: ${b.payoutMultiplier}× (win ${(b.winProbability*100).toFixed(1)}%)</span>
              `).join("")}
            </div>
          ` : ""}
        </div>
      </div>
    `;

    // Table controls
    const controls = `
      <div class="gd-controls">
        ${isShooter && status !== "rolling" && status !== "settling"
          ? button("Roll Dice", "fortune:gamblerDice:rollDice", {}, true, "primary", "gd-roll-btn")
          : !isShooter && status === "rolling"
            ? `<div class="gd-waiting">Waiting for shooter to roll…</div>`
            : button("Roll Dice", "fortune:gamblerDice:rollDice", {}, false, "primary", "gd-roll-btn")}
        ${button("Pass Dice to Next", "fortune:gamblerDice:passDice", {}, isShooter && occupiedCount(seats) > 1, "secondary", "gd-pass-btn")}
        ${button("Leave Table", "fortune:gamblerDice:leaveTable", {}, status !== "rolling" && status !== "settling", "secondary", "gd-leave-btn")}
      </div>
    `;

    // Last roll display
    let rollDisplay = "";
    if (lastRoll) {
      const facesHtml = lastRoll.faces.map((f) => `<img src="${esc(dieImg(dieSize, diceType, f, diceStyle))}" class="gd-die-face gd-die-animate" alt="${f}">`).join("");
      rollDisplay = `
        <div class="gd-last-roll">
          <div class="gd-last-roll-title">Last Roll</div>
          <div class="gd-dice">${facesHtml}</div>
          <div class="gd-roll-sum">Sum: ${esc(lastRoll.sum)}</div>
        </div>
      `;
    }

    // Join UI
    const joinUI = !inTable ? `
      <div class="gd-join">
        <div class="gd-join-title">Gamblers Dice Tables</div>
        <div class="gd-table-row">
          <span>Public Table</span>
          <span class="gd-table-open">Open seats</span>
          ${button("Join Table", "fortune:gamblerDice:joinTable", {}, true, "primary", "gd-join-btn")}
        </div>
      </div>
    ` : "";

    return `
      <div class="fortune-modal-header">
        <h2>🎲 Gamblers Dice</h2>
        <button class="fortune-modal-close" data-action="closeFortuneModal">✕</button>
      </div>
      <div class="fortune-modal-body">
        <div class="gd-container">
          ${joinUI}
          ${inTable ? `
            <div class="gd-table-info">
              <span class="gd-die-size-badge">${esc(dieSize.toUpperCase())} × ${diceCount}</span>
              <span class="gd-jackpot">Jackpot: ${money(jackpotPool)}</span>
              ${pointEstablished ? `<span class="gd-point">Point: ${esc(point)}</span>` : ""}
              <span class="gd-status">Status: ${esc(status)}</span>
            </div>
            <div class="gd-seats">${seatsHtml}</div>
            ${rollDisplay}
            <div class="gd-bet-panel-full">${betPanel}</div>
            ${controls}
          ` : ""}
        </div>
      </div>
    `;
  },
};

window.GamblerDiceModal.displayName = "GamblerDiceModal";

function occupiedCount(seats) {
  return seats.filter((s) => !s || typeof s.isEmpty !== "function" || !s.isEmpty()).length;
}

/* ══════════════════════════════════════════════════════════════════════════════
   ACTION HANDLERS (exposed for game.js)
   ══════════════════════════════════════════════════════════════════════════════ */

async function gdApi(action, data) {
  const res = await fetch("/api/fortune", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game: "gamblerDice", action, data: data || {} }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Dice action failed");
  }
  return res.json();
}

window.GamblerDiceModalHandlers = {
  async joinTable() {
    const result = await gdApi("joinTable", {});
    if (result.ok) {
      gdModalState.tableId = result.tableId;
      gdModalState.seatIndex = result.seat ? result.seat.seatIndex : null;
      gdModalState.diceType = result.diceType || "white";
      gdModalState.tableState = null;
      gdModalState.betMenu = null;
    }
    return result;
  },
  updateBetType(betType) {
    gdModalState.betType = betType;
    const targetInput = document.getElementById("gd-bet-target");
    const requiresTarget = ["exact", "range", "hardway", "sum_exact", "sum_range"].includes(betType || "");
    if (targetInput) targetInput.disabled = !requiresTarget;
    if (!requiresTarget) gdModalState.target = "";
    if (window.GamblerDiceModalRender) window.GamblerDiceModalRender();
    return { ok: true };
  },
  updateTarget(target) {
    gdModalState.target = target || "";
    if (window.GamblerDiceModalRender) window.GamblerDiceModalRender();
    return { ok: true };
  },
  async refresh() {
    const result = await gdApi("getTableState", { tableId: gdModalState.tableId });
    if (result.ok) gdModalState.tableState = result.tableState;
    return result;
  },
  async setDieSize(dieSize) {
    const result = await gdApi("setDieSize", { tableId: gdModalState.tableId, dieSize });
    if (result.ok) {
      gdModalState.betType = null;
      gdModalState.target = "";
      gdModalState.betMenu = null;
      await this.getBetMenu(dieSize, gdModalState.tableState ? gdModalState.tableState.diceCount : 2);
    }
    return result;
  },
  async setDiceCount(diceCount) {
    const result = await gdApi("setDiceCount", { tableId: gdModalState.tableId, diceCount });
    if (result.ok) {
      gdModalState.betMenu = null;
      await this.getBetMenu(gdModalState.tableState ? gdModalState.tableState.dieSize : "d6", diceCount);
    }
    return result;
  },
  async setDiceStyle(diceStyle) {
    gdModalState.diceStyle = diceStyle;
    if (window.GamblerDiceModalRender) window.GamblerDiceModalRender();
    return { ok: true };
  },
  async getBetMenu(dieSize, diceCount) {
    const result = await gdApi("getBetMenu", { dieSize, diceCount });
    if (result.ok) gdModalState.betMenu = result;
    return result;
  },
  async placeBet() {
    const betInput = document.getElementById("gd-bet-amount");
    const typeInput = document.getElementById("gd-bet-type");
    const targetInput = document.getElementById("gd-bet-target");
    const betType = typeInput ? typeInput.value : gdModalState.betType;
    const target = targetInput ? targetInput.value : gdModalState.target;
    const amount = betInput ? Number(betInput.value || 0) : gdModalState.amount;
    if (!betType) throw new Error("Select a bet type");
    const parsedTarget = target === "" ? null : target;
    gdModalState.betType = betType;
    gdModalState.target = parsedTarget;
    gdModalState.amount = amount;
    const result = await gdApi("placeBet", { tableId: gdModalState.tableId, seatIndex: gdModalState.seatIndex, betType, target: parsedTarget, amount });
    if (result.ok) {
      gdModalState.tableState = result.tableState;
      gdModalState.amount = amount;
    }
    return result;
  },
  async rollDice() {
    const result = await gdApi("rollDice", { tableId: gdModalState.tableId });
    if (result.ok) {
      gdModalState.tableState = result.tableState;
      gdModalState.lastRollFaces = result.roll ? result.roll.faces : null;
      // Trigger dice roll animation
      window.GamblerDiceModalAnimateRoll(result.roll);
    }
    return result;
  },
  async passDice() {
    const result = await gdApi("passDice", { tableId: gdModalState.tableId });
    if (result.ok) gdModalState.tableState = result.tableState;
    return result;
  },
  async leaveTable() {
    const result = await gdApi("leaveTable", { tableId: gdModalState.tableId, seatIndex: gdModalState.seatIndex });
    if (result.ok) {
      gdModalState.tableId = null;
      gdModalState.seatIndex = null;
      gdModalState.tableState = null;
      gdModalState.animating = false;
    }
    return result;
  },
};

window.GamblerDiceModalAnimateRoll = (roll) => {
  gdModalState.animating = true;
  setTimeout(() => { gdModalState.animating = false; }, 1500);
};
