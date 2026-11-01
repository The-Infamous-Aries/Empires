# World Bank System

Handles nation loans, currency investment, currency rate synchronization, tax/bill interest rates with **global-level modifiers**, territory purchase cost calculation, and **World Lottery funding**. Rates for loans, bills, territory tax, and currency exchange are all influenced by global conditions (war, peace, disease, crime, population demographics) and World Lottery payouts.

## Overview

| Item | Value |
|------|-------|
| **System class:** | `WorldBankSystem` |
| **Global instance:** | `window.WorldBankSystem` |
| **Base loan rate:** | 15% of tax revenue per day |
| **Max loan multiplier:** | 5× income (increases with nation age) |
| **Currency rate authority:** | EconomySystem (single source of truth) |
| **Primary config:** | `systems/World/world-bank-system.js` |
| **Loaded in:** | `index.html` (after `core/event-system.js`, before `ui/live/game.js`) |

The World Bank System provides loans to nations, lets players invest in the 6 currencies, calculates interest on stacked taxes and unpaid bills, computes territory purchase costs, and funds the World Lottery System with interest and territory tax revenue. It reads live currency exchange rates from the EconomySystem (single source of truth for rates) and records spending back to it for rate dynamics.

Resources have been removed — there is **no resource buying, selling, or trading** in this system.

> **Important:** `window.WorldBankSystem` is `undefined` until `systems/World/world-bank-system.js` is loaded in the browser. The script tag must appear after `core/event-system.js` (provides `EventBus`) in `index.html`.

---

## Global Influence on Interest Rates & Taxes

Global conditions (war, peace, disease, crime, population demographics) shift interest rates up or down. These are combined into a single multiplier applied to **loans, bills, and territory tax** (all move in the same direction), while **tax rates move in the opposite direction** (when global rates rise, taxes fall).

### `getGlobalRiseMultiplier()`

Returns a factor (0.5–2.0, default 1.0 neutral) that scales rates UP. Contributions:

| Global Factor | Thresholds | Rise Added |
|--------------|-----------|------------|
| **War** | ≥95% / ≥75% / ≥66% / ≥50% / ≥33% | +0.25 / +0.15 / +0.10 / +0.07 / +0.03 |
| **Peace** | ≥100% / ≥92% / ≥84% / ≥76% / ≥68% | +0.20 / +0.15 / +0.10 / +0.07 / +0.03 |
| **Disease** | ≥100% / ≥75% / ≥50% | +0.20 / +0.12 / +0.05 |
| **Major Disease active** | any % with major disease | +0.05 |
| **Minor Disease active** | any % with minor disease | +0.02 |
| **Crime** | ≥81% / ≥61% / ≥41% / 21–80% / ≤20% | +0.20 / +0.12 / +0.05 / 0 / −0.05 |
| **Taxable population <30%** | majority not taxable soon | +0.20 |
| **Taxable population <50%** | majority not taxable soon | +0.10 |
| **Taxable population >70%** | majority taxable soon | −0.10 |
| **Taxable population >50%** | majority taxable soon | −0.05 |

### `getGlobalTaxMultiplier()`

Returns the **inverse** of `getGlobalRiseMultiplier()` — tax rates fall when global factors push other rates up (and vice versa). Capped 0.5–2.0.

### `getGlobalCurrencyUsageFactor(currencyKey)`

Returns a factor (0.85–1.15) based on what % of world nations use that currency. More users = more stable/valuable = higher rate.

---

## World Lottery System Integration

The World Bank funds the World Lottery (`window.WorldLottery`) with money collected from interest and territory taxes. World Lottery payouts in turn raise World Bank interest rates (bank loses money on payouts → rates rise).

### Funding Sources (added to lottery pool)

| Source | Method Called | When |
|--------|--------------|------|
| **Loan interest** | `contributeFromBank(amount, 'loan_interest')` | During `processLoanRepayments()` |
| **Bill interest** | `contributeFromBank(amount, 'bill_interest')` | In `Nation.payBills()` |
| **Tax interest** | `contributeFromBank(amount, 'tax_interest')` | In `Nation.collectTaxes()` |
| **Territory tax** | `contributeFromBank(amount, 'territory_tax')` | During `recordTerritoryPurchase()` |

### Lottery Rate Impact (payouts raise rates)

World Bank reads `lottery.getRateImpactMultiplier()` and applies it:

- **Loan rates:** multiplied by the factor (jackpot payout = +2.0 multiplier, skyrocketing rates)
- **Bill rates:** multiplied by the factor
- **Tax rates:** divided by the factor (inverse — bank payouts lower tax rates)

The multiplier decays by 0.1 each day back toward 1.0.

---

## Loans

### `getLoanLimit(nation)`

```
limit = floor(taxRevenue × multiplier)
multiplier = min(5, 1 + playDays × 0.1)
```

Where `playDays` is days since the nation was founded (`nation.foundedDay`). Multiplier starts at 1× and grows toward 5× as the nation ages. `foundedDay` is a game-day integer from `TimeSystem.currentDay` at creation; defaults to 1 if unavailable.

### `takeLoan(nation, amount)`

- Validates the amount doesn't exceed the loan limit
- Adds funds to `nation.currencyBalances.aurel` (or legacy `nation.money`)
- Creates a loan record: `{ amount, rate: effectiveLoanRate, takenAt, remaining: amount }` — rate includes global + lottery multipliers
- Returns `{ ok: true }` or `{ ok: false, reason }`

Loans are always denominated in Aurel (AUR).

### `processLoanRepayments()` (runs daily on `day_passed`)

- Calculates daily repayment: `floor(taxRevenue × effectiveLoanRate)` per nation
- **Processes every nation** — player nation plus all nations in `GameEngine.nations` (AI included)
- **Splits** the repayment across all active loans
- Tracks the interest portion of each payment for lottery funding
- Deducts total repayment from `currencyBalances.aurel` (or legacy `money`)
- Removes paid-off loans from the list

---

## Interest Rates — Stacked Taxes & Bills

Interest applies to uncollected stacked taxes and unpaid stacked bills, calculated daily via `Nation.collectTaxes()` and `Nation.payBills()`.

| | Threshold | Compounds every | Max rate | Direction |
|---|---|---|---|---|
| **Tax interest** | 12 stacked turns | 6 turns | 15% | Falls when global rates rise |
| **Bill interest** | 24 stacked turns | 12 turns | 30% | Rises when global rates rise |

Bill interest is always ≥ 1.5× tax rate + 1% (minimum gap).

### `calculateTaxInterestRate(nation)`

Based on currency usage, stacked taxes, currency volatility, **global tax multiplier**, and **lottery rate impact (divided)**. Capped 0–15%.

### `calculateBillInterestRate(nation)`

`taxRate × 1.5 + 0.01`, then multiplied by **global rise multiplier** and **lottery rate impact**. Capped 0–30%.

### `calculateTaxInterest(stackedAmount, stackedTurns, rate)` / `calculateBillInterest(stackedAmount, stackedTurns, rate)`

- Interest only applies once `stackedTurns` reaches the threshold
- Each compound period **after** the threshold adds `amount × rate`
- Returns interest amount to add to the stacked total

### `getInterestRateInfo(nation)`

UI display package: `currencyKey`, `taxRate`, `billRate`, percent strings, thresholds, intervals, `nationsOnCurrency`, `totalNations`.

---

## Currency Investment

### `currencyBuy(nation, currencyKey, points, worldState)`

Buys currency points as an investment:

1. Validates currency key and positive points
2. Reads live rate from EconomySystem (or `worldState` fallback)
3. Calculates cost: `ceil(points × rate)`
4. **Deducts cost from the nation's PRIMARY currency balance** — not from the currency being bought
5. Records investment: `{ points, entryPrice (average), totalSpent }`
6. Calls `EconomySystem.recordCurrencySpending(currencyKey, cost)` to affect rate dynamics
7. Returns `{ points, cost, entryPrice, currentRate }`

### `currencySell(nation, currencyKey, points, worldState)`

Sells currency points back:

1. Validates currency key and sufficient points owned
2. Reads live rate from EconomySystem
3. Calculates proceeds: `floor(points × rate)`
4. **Adds proceeds to the nation's PRIMARY currency balance** — not to the currency being sold
5. Reduces investment points; resets entry price/totalSpent when points hit 0
6. Returns `{ points, proceeds, currentRate }`

### `getInvestmentStatus(nation, currencyKey, worldState)`

Returns `{ points, entryPrice, currentRate, pnl }` where `pnl = (points × currentRate) − totalSpent`.

---

## Currency Rate Synchronization

EconomySystem owns currency rates (single source of truth). World Bank:

- **Reads** live rates from `EconomySystem.getCurrencyConfig()` when available
- **Calls** `EconomySystem.recordCurrencySpending(currencyKey, cost)` on purchases
- **Syncs** its internal `this.currencies` object to EconomySystem's live rates on each `day_passed`
- Falls back to `worldState.currencies` if EconomySystem is not loaded

World Bank does **not** independently calculate or mutate currency rates.

---

## Territory Purchase Cost System

Used when nations purchase map territories/slots. Cost compounds with each additional territory, scaled by purchase frequency, slots-owned vs world average, **live currency value**, and **global rise multiplier**.

| Method | Description |
|--------|-------------|
| `recordTerritoryPurchase(nation, currentDay, taxAmount)` | Increments nation + global purchase count, slots owned; contributes `taxAmount` to lottery pool; applies decay (20% per 7 days) |
| `calculateTerritoryPurchaseCost(nation, baseCost, growthRate)` | Cost for next territory (default base 1000, growth 1.5×) |
| `calculateTerritoryTaxMultiplier(nation, baseCost)` | Multiplier from purchase counts, slot ratio vs world average, **live currency value**, **global rise multiplier** |
| `getTotalSlotsOwned()` | Sum of `territorySlotsOwned` across all nations |
| `getTerritoryCostInfo(nation, currentDay)` | UI package: baseCost, taxAmount, totalCost, breakdown, tax rate info |

Territory tax multiplier formula:

```
totalMultiplier = purchaseFactor × slotRatioFactor × currencyValueFactor × getGlobalRiseMultiplier()
```

- `purchaseFactor`: more purchases = higher tax (capped at 2x)
- `slotRatioFactor`: above-average slot ownership = higher tax (up to +50%); below-average = lower tax (down to 0.5x)
- `currencyValueFactor`: live rate / 100, capped 0.5–2.0

Purchase count decay: if 7+ days since last purchase, count decays by 20% per 7-day step.

---

## Day Passed Cycle

### `_onDayPassed()` (fires on every `day_passed` event)

Runs this sequence each game day:

1. **Decay lottery rate impact** — reduces `rateImpactMultiplier` by 0.1 toward 1.0; cleans up expired unclaimed lottery winnings
2. `syncCurrencyRates()` — pull live rates from EconomySystem into World Bank's cache
3. `updateCurrencyRates()` — delegate to `EconomySystem.updateCurrencyRates()` (complex daily rate formula)
4. `syncCurrencyRates()` — re-sync after EconomySystem mutated rates
5. `processLoanRepayments()` — process loan repayments for all nations (player + AI), contribute interest to lottery pool
6. `lottery._onDayPassed()` — advance World Lottery drawing schedule (1 drawing per real-life week, random day/hour)

---

## State Management

### `getState()` / `setState(state)`

Persists across save/load:

| State | Description |
|-------|-------------|
| `globalTerritoryPurchaseCount` | Lifetime territory purchase count |
| `globalTerritoryPurchaseTurns` | Turn-number → purchase count map |
| `currencies` | World Bank's cached currency rate object |
| `territoryPurchaseCounts` | Per-nation purchase count tracking |

### `initialize()`

Marks the system initialized and calls `EconomySystem.initializeCurrencies()` to seed `currencyBalances` on the nation.

---

## Key Methods Summary

| Method | Description |
|--------|-------------|
| `getCurrencyConfig()` | Live currency config (from EconomySystem or static fallback) |
| `initWorldCurrencies(worldState)` | Initialize currency state in world (not auto-called) |
| `syncCurrencyRates()` | Sync internal rates from EconomySystem |
| `updateCurrencyRates(worldState, nations)` | Delegates to EconomySystem |
| `initialize()` | Init + seed currency balances via EconomySystem |
| `_onDayPassed()` | Daily: decay lottery impact → sync rates → update rates → re-sync → loan repayments → advance lottery |
| `getLoanLimit(nation)` | Calculate max borrowable amount |
| `takeLoan(nation, amount)` | Take a loan (adds to aurel balance) |
| `processLoanRepayments()` | Daily loan repayment processing for all nations (split across loans) |
| `currencyBuy(nation, key, points, worldState)` | Buy currency points (deducts from primary currency) |
| `currencySell(nation, key, points, worldState)` | Sell currency points (proceeds to primary currency) |
| `getInvestmentStatus(nation, key, worldState)` | Get investment P&L status |
| `calculateTaxInterestRate(nation)` | Tax interest rate (0–15%, global + lottery adjusted) |
| `calculateBillInterestRate(nation)` | Bill interest rate (0–30%, global + lottery adjusted) |
| `calculateTaxInterest(amount, turns, rate)` | Compound interest for stacked taxes |
| `calculateBillInterest(amount, turns, rate)` | Compound interest for stacked bills |
| `getInterestRateInfo(nation)` | UI display package for rates |
| `getGlobalRiseMultiplier()` | Combined global factor (0.5–2.0) for rates that rise |
| `getGlobalTaxMultiplier()` | Inverse factor for tax rates (moves opposite) |
| `getGlobalCurrencyUsageFactor(key)` | Currency usage factor (0.85–1.15) |
| `calculateTerritoryPurchaseCost(nation, ...)` | Cost to buy next territory |
| `calculateTerritoryTaxMultiplier(nation, ...)` | Territory tax multiplier |
| `getTotalSlotsOwned()` | Total territory slots across all nations |
| `recordTerritoryPurchase(nation, day, taxAmount)` | Record a purchase + contribute tax to lottery pool |
| `getTerritoryCostInfo(nation, day)` | UI package for territory cost |
| `getState()` / `setState()` | Save/load World Bank state |

---

## Integration with EconomySystem

| Responsibility | EconomySystem | WorldBankSystem |
|----------------|---------------|-----------------|
| Currency exchange rates | ✅ Owns and updates daily | ✅ Reads only |
| Currency balance storage | ✅ `currencyBalances` on Nation | ✅ Reads/writes per-currency balance |
| Currency investment tracking | ❌ Not tracked | ✅ `currencyInvestments` on Nation |
| Loan management | ❌ Not handled | ✅ Full loan lifecycle |
| Rate spending dynamics | ✅ `recordCurrencySpending()` | ✅ Calls it on currency purchases |
| Tax/bill interest rates | ❌ Not handled | ✅ Full interest rate + compounding + global modifiers |
| Territory purchase costs | ❌ Not handled | ✅ Full territory cost system + global modifiers |
| World Lottery funding | ❌ Not handled | ✅ Contributes interest + territory tax to lottery pool |
| Event cycle | `day_passed` | `day_passed` |

---

## Browser Wiring (`index.html`)

```html
<script defer src="core/event-system.js"></script>
<script defer src="systems/World/world-bank-system.js"></script>
<script defer src="ui/live/game.js"></script>
```

`event-system.js` must load first (provides `EventBus`). `world-bank-system.js` binds `day_passed` in its constructor via `bindEvents()`.

---

## Dynamic Lottery Reference

`window.WorldLottery` is accessed **dynamically** (not cached) via `_getLottery()` because `game-engine.js` creates a new `WorldLotterySystem()` instance after `WorldBankSystem` is constructed. Every call to lottery methods (`contributeFromBank`, `getRateImpactMultiplier`, `_onDayPassed`) reads `window.WorldLottery` at call time to always reference the live instance.
