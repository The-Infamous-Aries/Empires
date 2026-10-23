"use strict";
// Presentation rules shared by the browser and focused UI contract checks.
(function (root) {
  const ui = {
    matches(text, query) {
      return String(text)
        .toLocaleLowerCase()
        .includes(String(query).trim().toLocaleLowerCase());
    },
    claimReason(state, x, y) {
      if (
        !Number.isInteger(x) ||
        !Number.isInteger(y) ||
        Math.abs(x) > 25 ||
        Math.abs(y) > 25
      )
        return "Select a square within the world boundary.";
      if (state.territories[`${x},${y}`])
        return "This territory already belongs to a nation.";
      if (state.nation.territories.length >= state.nation.mapBlocks)
        return "Purchase another land block in Nation → Development.";
      if (
        state.nation.territories.length &&
        ![
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ].some(([a, b]) => state.territories[`${a},${b}`] === state.nation.id)
      )
        return "Choose a square sharing an edge with your nation.";
      return "Ready to claim. Uses one of your unplaced land blocks.";
    },
    canClaim(state, x, y) {
      return ui.claimReason(state, x, y).startsWith("Ready to claim.");
    },
    unitTotals(nation, quote, amount) {
      const valid =
        Number.isSafeInteger(amount) && amount > 0 && amount <= 1000000;
      const money = valid
        ? Math.max(
            amount,
            Math.floor(quote.money * amount * quote.moneyMultiplier),
          )
        : 0;
      const resources = Object.fromEntries(
        Object.entries(quote.resources).map(([key, value]) => [
          key,
          valid ? value * amount : 0,
        ]),
      );
      const reasons = quote.reasons.filter(
        (reason) =>
          !reason.startsWith("Need ") && !reason.startsWith("Capacity "),
      );
      if (!valid) reasons.push("Enter a positive whole quantity");
      if (valid && quote.owned + amount > quote.capacity)
        reasons.push("Exceeds available capacity");
      if (
        valid &&
        (nation.money < money ||
          Object.entries(resources).some(
            ([key, value]) => (nation.resources[key] || 0) < value,
          ))
      )
        reasons.push("Insufficient money or resources");
      const refund = valid
        ? Math.floor(
            (((nation.recruitmentBasis?.[quote.type] || 0) *
              Math.min(amount, quote.owned)) /
              Math.max(1, quote.owned)) *
              0.5,
          )
        : 0;
      return {
        money,
        resources,
        refund,
        reasons,
        canBuy: !reasons.length,
        canSell: valid && amount <= quote.owned,
      };
    },
  };
  if (typeof module !== "undefined" && module.exports) module.exports = ui;
  else root.EmpiresUI = ui;
})(globalThis);
