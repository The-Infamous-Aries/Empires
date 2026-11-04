"use strict";
// Presentation rules shared by the browser and focused UI contract checks.
(function (root) {
  const ui = {
    choiceEffects(def, kind) {
      const labels = {
        happiness: "Happiness",
        populationGrowth: "Population",
        stability: "Stability",
        technology: "Research speed",
        gdp: "Tax revenue",
        reputation: "Reputation",
        militaryStrength: "Military strength",
        militaryMorale: "Military morale",
      };
      const active =
        kind === "government"
          ? {
              bonuses: [
                "happiness",
                "populationGrowth",
                "stability",
                "technology",
                "gdp",
                "reputation",
                "militaryStrength",
              ],
              penalties: [
                "happiness",
                "stability",
                "technology",
                "gdp",
                "reputation",
                "militaryStrength",
                "militaryMorale",
              ],
            }
          : {
              bonuses: [
                "happiness",
                "populationGrowth",
                "stability",
                "technology",
                "militaryMorale",
              ],
              penalties: ["happiness"],
            };
      return Object.fromEntries(
        Object.entries(active).flatMap(([group, keys]) =>
          keys
            .filter((k) => def[group]?.[k] !== undefined)
            .map((k) => {
              const percent =
                (group === "bonuses" ? def[group][k] : def[group][k] - 1) * 100;
              return [
                `${labels[k]}${group === "penalties" ? " penalty" : " bonus"}`,
                `${percent >= 0 ? "+" : ""}${Number(percent.toFixed(2))}%`,
              ];
            }),
        ),
      );
    },
    motionTally(motion) {
      if (motion.factionResults)
        return Object.fromEntries(
          ["for", "against", "abstain"].map((position) => [
            position,
            Object.values(motion.factionResults)
              .filter((r) => r.position === position)
              .reduce((sum, r) => sum + r.seats, 0),
          ]),
        );
      return Object.fromEntries(
        ["for", "against", "abstain"].map((position) => [
          position,
          Object.values(motion.votes).filter((v) => v.vote === position).length,
        ]),
      );
    },
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
        populationImpact: valid
          ? quote.type === "soldiers"
            ? Math.floor(amount / 10)
            : quote.populationImpact * amount
          : 0,
        happinessImpact: valid ? (quote.happinessImpact || 0) * amount : 0,
        reasons,
        canBuy: !reasons.length,
        canSell: valid && amount <= quote.owned,
      };
    },
  };
  if (typeof module !== "undefined" && module.exports) module.exports = ui;
  else root.EmpiresUI = ui;
})(globalThis);
