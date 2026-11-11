"use strict";
/**
 * World Modals - Sovereignty Epochs
 * Popup modals for the World tab: disease cure funding, currency investment,
 * National Pet Lottery custom ticket picker, and motion proposal builder.
 * Pure HTML generators rendered inside <dialog> by game.js.
 */

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
const number = (value) =>
  Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const money = (value) => "$" + number(value);
const human = (value) =>
  String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
const button = (label, action, data, enabled = true, style = "primary") =>
  `<button class="${style}" data-action="${esc(action)}" data-payload="${esc(
    JSON.stringify(data),
  )}" ${!enabled ? "disabled" : ""}>${esc(label)}</button>`;
const input = (label, name, value = "", type = "text", extra = "") =>
  `<label>${esc(label)}<input name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" ${extra}></label>`;
const select = (label, name, items, selected, disabled = false) =>
  `<label>${esc(label)}<select name="${esc(name)}" ${disabled ? "disabled" : ""}>${
    Object.entries(items)
      .map(
        ([key, value]) =>
          `<option value="${esc(key)}" ${key === selected ? "selected" : ""}>${esc(
            typeof value === "object" ? value.name : value,
          )}</option>`,
      )
      .join("")
  }</select></label>`;
const PET_ICONS_UNIQUE = window.PET_ICONS_UNIQUE || [];

const CURRENCIES = {
  aurel: { name: "Aurel", abbrev: "AUR", symbol: "₳" },
  velt: { name: "Velt", abbrev: "VLT", symbol: "✦" },
  krona: { name: "Krona", abbrev: "KRN", symbol: "₭" },
  drachma: { name: "Drachma", abbrev: "DRM", symbol: "ð" },
  sovereign: { name: "Sovereign", abbrev: "SOV", symbol: "ꜱ" },
  talon: { name: "Talon", abbrev: "TLN", symbol: "₮" },
};

/* ═════════════════════════════════════════════════════════════════════════════
   FUND DISEASE CURE MODAL
   ═════════════════════════════════════════════════════════════════════════════ */

function fundDiseaseCureModalContent(state) {
  const gw = state.globalWorld || {};
  const disease = gw.activeGlobalDisease || null;
  if (!disease) {
    return `<form method="dialog"><div class="modal-eyebrow">Global disease</div><h2 id="nation-dialog-title">Fund the Cure</h2><p class="muted">No active global disease to fund right now.</p><div class="row dialog-actions"><button value="close" autofocus>Close</button></div></form>`;
  }
  const remaining = Math.max(0, (disease.cureTarget || 0) - (disease.funded || 0));
  return `<form id="fund-disease-form" data-command="fundDiseaseCure"><div class="modal-eyebrow">Global disease — ${esc(human(disease.severity))}</div><h2 id="nation-dialog-title">Fund the Cure</h2><div class="modal-body"><div class="data-list"><div><strong>Disease</strong></div><div>${esc(disease.name)}</div><div><strong>Description</strong></div><div>${esc(disease.description)}</div><div><strong>Cure target</strong></div><div>${money(disease.cureTarget)}</div><div><strong>Funded so far</strong></div><div>${money(disease.funded || 0)}</div><div><strong>Remaining</strong></div><div>${money(remaining)}</div></div><p class="help">Contribute from your treasury toward the cure. When the target is reached, the disease is eradicated worldwide.</div>${input("Amount to fund ($)", "amount", Math.min(remaining, state.nation.money || 0), "number", 'required min="1"')}<div class="form-footer"><button class="primary" data-action="fundDiseaseCure">Fund cure</button><button value="cancel">Cancel</button></div></form>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   CURRENCY INVEST MODAL (buy / sell currency points)
   ═════════════════════════════════════════════════════════════════════════════ */

function currencyInvestModalContent(state, currencyKey) {
  const n = state.nation;
  const cfg = CURRENCIES[currencyKey] || { name: currencyKey, abbrev: currencyKey, symbol: "" };
  const rate = (state.worldBank && state.worldBank.currencyRates && state.worldBank.currencyRates[currencyKey]) || 100;
  const inv = (n.currencyInvestments || {})[currencyKey];
  const points = inv ? inv.points : 0;
  const spent = inv ? inv.totalSpent : 0;
  const currentValue = points * rate;
  const pnl = currentValue - spent;
  const maxBuy = Math.floor((n.money || 0) / rate);
  return `<form id="currency-invest-form"><div class="modal-eyebrow">World Bank — ${esc(cfg.name)}</div><h2 id="nation-dialog-title">Invest in ${esc(cfg.name)}</h2><div class="modal-body"><div class="data-list"><div><strong>Currency</strong></div><div>${esc(cfg.name)} <small>(${cfg.abbrev}) ${cfg.symbol}</small></div><div><strong>Live rate</strong></div><div>${number(rate)} per point</div><div><strong>Your points</strong></div><div>${number(points)}</div><div><strong>Total spent</strong></div><div>${money(spent)}</div><div><strong>Current value</strong></div><div>${money(currentValue)}</div><div><strong>Profit / loss</strong></div><div class="${pnl >= 0 ? "good" : ""}">${money(pnl)}</div></div><div class="form-stack section">${input("Buy points", "buy", "", "number", `min="0" max="${maxBuy}"`)}<small class="help">Cost: ${number(rate)} per point. Max affordable: ${number(maxBuy)} points (${money(maxBuy * rate)}).</small>${input("Sell points", "sell", "", "number", `min="0" max="${points}"`)}<small class="help">Proceeds: ${number(rate)} per point. Max sellable: ${number(points)} points.</small></div></div><div class="form-footer"><button class="primary" data-action="currencyInvest">Buy / Sell</button><button value="cancel">Cancel</button></div></form>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   LOTTERY CUSTOM PICKER MODAL
   ═════════════════════════════════════════════════════════════════════════════ */

function lotteryPickerModalContent(state) {
  const icons = PET_ICONS_UNIQUE;
  const count = Math.min(window.MAX_TICKETS_PER_NATION || 25, 5);
  let picksHtml = "";
  for (let i = 0; i < count; i++) {
    let selectsHtml = "";
    for (let k = 1; k <= 5; k++) {
      selectsHtml += select("Pet " + k, "pick" + i + "-n" + k, Object.fromEntries(icons.map((p) => [p, p])), icons[k - 1]);
    }
    selectsHtml += select("Multiplier", "pick" + i + "-m", Object.fromEntries(icons.map((p) => [p, p])), icons[5]);
    picksHtml +=
      '<div class="lottery-pick section"><div class="row spread"><strong>Ticket ' +
      (i + 1) +
      '</strong><button type="button" data-action="lotteryQuickPick" data-payload="' +
      esc(JSON.stringify({ index: i })) +
      '">Quick pick</button></div><div class="form-grid">' +
      selectsHtml +
      '</div><small class="help">Pick 6 unique pets. The 6th is the multiplier.</small></div>';
  }
  return (
    '<form id="lottery-picker-form" data-command="lotteryPurchase"><div class="modal-eyebrow">National Pet Lottery</div><h2 id="nation-dialog-title">Pick Your Tickets</h2><div class="modal-body"><p class="muted">' +
    money(window.TICKET_COST || 100000) +
    ' per ticket. Choose 5 pets + 1 multiplier (the 6th pet) per ticket. All 6 must be unique.</p>' +
    picksHtml +
    '<input type="hidden" name="count" value="' +
    count +
    '"><input type="hidden" name="ticketPicks" id="lottery-picks-json"> </div><div class="form-footer"><button class="primary" data-action="lotteryPurchaseCustom">Buy custom tickets</button><button value="cancel">Cancel</button></div></form>'
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   MOTION PROPOSE MODAL (build motion in pop-up before submitting)
   ═════════════════════════════════════════════════════════════════════════════ */

function proposeMotionModalContent(state, catalog, scope) {
  const n = state.nation;
  const definitions = Object.fromEntries(
    Object.entries(catalog.motionTypes || {}).filter(([, d]) => d.scope === scope),
  );
  const type = Object.keys(definitions)[0] || null;
  const def = type ? definitions[type] : null;
  return `<form id="world-propose-motion-form" data-command="proposeMotion"><input type="hidden" name="type" value="${esc(type || "")}"><div class="modal-eyebrow">Propose ${scope === "world" ? "World" : "Color"} Motion</div><h2 id="nation-dialog-title">${esc(def ? def.name : "New motion")}</h2><div class="modal-body">${select("Motion type", "type", definitions, type)}<div id="motion-type-info" class="section"><p class="help">${esc(def ? def.description : "")}</p><div class="data-list"><div><strong>Scope</strong></div><div>${esc(scope === "world" ? "World" : "Color")}</div><div><strong>Required support</strong></div><div>${number((def && def.minSupport) * 100 || 0)}%</div></div>${def && def.parameters && def.parameters.length ? `<div class="form-stack section">${def.parameters.map((key) => input(human(key), `param-${key}`, 10, "number", `min="0" max="1000000"`)).join("")}</div>` : ""}<div class="form-stack section">${input("Title", "title", "", "text", 'required minlength="3" maxlength="120"')}${textarea("Proposal", "body", "", 'required minlength="10" maxlength="5000"')}</div></div></div><div class="form-footer"><button class="primary" data-action="proposeMotion">Propose motion</button><button value="cancel">Cancel</button></div></form>`;
}

/* ═════════════════════════════════════════════════════════════════════════════
   WORLD BANK LOAN MODAL (take a loan from the World Bank)
   ══════════════════════════════════════════════════════════════════════════════ */

function loanModalContent(state) {
  const n = state.nation;
  const wb = state.worldBank || {};
  const loans = state.loans || [];
  const activeLoans = loans.filter((l) => l.status === "active");
  const limit = Math.floor((n.taxRevenue || 0) * 52);
  const rate = wb.loanRate !== undefined ? wb.loanRate : 0.15;
  const canBorrow = activeLoans.length < 3 && limit > 0 && n.money > 0;
  return `<form id="loan-modal-form" data-command="worldBankLoan"><div class="modal-eyebrow">World Bank Loans</div><h2 id="nation-dialog-title">Take a Loan</h2><div class="modal-body"><div class="data-list"><div><strong>Active loans</strong></div><div>${activeLoans.length} / 3</div><div><strong>Interest rate</strong></div><div>${(rate * 100).toFixed(0)}% per turn</div><div><strong>Loan limit</strong></div><div>${money(limit)} (1 year of tax revenue)</div><div><strong>Your money</strong></div><div>${money(n.money || 0)}</div></div><p class="help">Borrow up to one year of tax revenue. Maximum 3 active loans. Repay with interest over time. Loans do not accrue interest between turns.</p>${input("Amount ($)", "amount", Math.min(limit, Math.max(1, n.money || 0)), "number", 'required min="1"')}</div><div class="form-footer"><button class="primary" ${canBorrow ? "" : "disabled"} data-action="worldBankLoan">Take loan</button><button value="cancel">Cancel</button></div></form>`;
}

window.fundDiseaseCureModalContent = fundDiseaseCureModalContent;
window.currencyInvestModalContent = currencyInvestModalContent;
window.lotteryPickerModalContent = lotteryPickerModalContent;
window.proposeMotionModalContent = proposeMotionModalContent;
