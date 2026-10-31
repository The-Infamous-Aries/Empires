# World Bank System

Handles nation loans, currency investment, currency rate synchronization, tax/bill interest rates, and territory purchase cost calculation with the Economy System.

## Overview

| Item | Value |
|------|-------|
| **System class:** | `WorldBankSystem` |
| **Global instance:** | `window.WorldBankSystem` |
| **Loan rate:** | 15% of tax revenue per day |
| **Max loan multiplier:** | 5× income (increases with nation age) |
| **Currency rate authority:** | EconomySystem (single source of truth) |
| **Primary config:** | `systems/world-bank-system.js` |
| **Loaded in:** | `index.html` (after `core/event-system.js`, before `ui/live/game.js`) |

The World Bank System provides loans to nations, lets players invest in the 6 currencies, calculates interest on stacked taxes and unpaid bills, and computes territory purchase costs. It reads live currency exchange rates from the EconomySystem (which is the single source of truth for rates) and records spending back to it for rate dynamics.

Resources have been removed — there is **no resource buying, selling, or trading** in this system. Methods that previously handled resources (`calculateResourcePrice`, `buyResource`) have been removed.

> **Important:** `window.WorldBankSystem` is `undefined` until `systems/world-bank-system.js` is loaded in the browser. The script tag must appear after `core/event-system.js` (provides `EventBus`) in `index.html`.

---

## 6 Currency Configuration

World Bank defines the canonical `CURRENCIES` constant, mirrored in EconomySystem:

| Currency | Key | Abbrev | Symbol | Base Rate |
|----------|-----|--------|--------|-----------|
| Aurel | `aurel` | **AUR** | `assets/images/Currency/aurel.png` | 100 |
| Velt | `velt` | **VLT** | `assets/images/Currency/velt.png` | 100 |
| Krona | `krona` | **KRN** | `assets/images/Currency/krona.png` | 100 |
| Drachma | `drachma` | **DRM** | `assets/images/Currency/drachma.png` | 100 |
| Sovereign | `sovereign` | **SOV** | `assets/images/Currency/sovereign.png` | 100 |
| Talon | `talon` | **TLN** | `assets/images/Currency/talon.png` | 100 |

All currencies start at base rate 100. Rates then diverge based on EconomySystem's daily dynamics.

---

## Loans

### `getLoanLimit(nation)`

Calculates how much a nation can borrow:

```
limit = floor(taxRevenue × multiplier)
multiplier = min(5, 1 + playDays × 0.1)
```

Where `playDays` is days since the nation was founded (`nation.foundedDay`). The multiplier starts at 1× and grows toward 5× as the nation ages.

`foundedDay` is a game-day integer (set from `TimeSystem.currentDay` at nation creation). If `TimeSystem` is unavailable, `playDays` defaults to 1.

### `takeLoan(nation, amount)`

- Validates the amount doesn't exceed the loan limit
- Adds funds to `nation.currencyBalances.aurel` (or legacy `nation.money`)
- Creates a loan record: `{ amount, rate: 0.15, takenAt, remaining: amount }`
- Returns `{ ok: true }` or `{ ok: false, reason }`

Loans are always denominated in Aurel (AUR), regardless of the nation's primary currency.

### `processLoanRepayments()` (runs daily on `day_passed`)

- Calculates daily repayment: `floor(taxRevenue × 0.15)` per nation
- **Processes every nation** — player nation (`window.Nation`) plus all nations in `GameEngine.nations` (AI nations included)
- **Splits** the repayment across all active loans (not applied in full to each)
- Deducts total repayment from `currencyBalances.aurel` (or legacy `money`)
- Removes paid-off loans from the list

If a nation has 3 loans and owes 300 total repayment, each loan gets 100 applied (not 300 each).

---

## Interest Rates — Stacked Taxes & Bills

Interest applies to uncollected stacked taxes and unpaid stacked bills, calculated daily via `Nation.collectTaxes()` and `Nation.payBills()`.

| | Threshold | Compounds every | Max rate |
|---|---|---|---|
| **Tax interest** | 12 stacked turns | 6 turns | 15% |
| **Bill interest** | 24 stacked turns | 12 turns | 30% |

Bill interest is always ≥ 1.5× tax rate + 1% (minimum gap).

### `calculateTaxInterestRate(nation)`

Based on:
- Currency usage — more nations on the currency = more stable = lower rate
- Stacked taxes — more nations stacking taxes = higher rate
- Other currency volatility — rising/falling currencies = uncertainty = higher rate

Returns a decimal rate (e.g. `0.025` = 2.5%), capped at 0–15%.

### `calculateBillInterestRate(nation)`

`taxRate × 1.5 + 0.01`, capped at 0–30%.

### `calculateTaxInterest(stackedAmount, stackedTurns, rate)` / `calculateBillInterest(stackedAmount, stackedTurns, rate)`

- Interest only applies once `stackedTurns` reaches the threshold
- Each compound period **after** the threshold adds `amount × rate` (interest begins after the first full compounding interval, not at the threshold turn itself)
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
4. **Deducts cost from the nation's PRIMARY currency balance** (`currencyBalances[nation.currency]` or `money` for aurel) — **not** from the currency being bought
5. Records investment: `{ points, entryPrice (average), totalSpent }`
6. Calls `EconomySystem.recordCurrencySpending(currencyKey, cost)` to affect rate dynamics
7. Returns `{ points, cost, entryPrice, currentRate }`

### `currencySell(nation, currencyKey, points, worldState)`

Sells currency points back:

1. Validates currency key and sufficient points owned
2. Reads live rate from EconomySystem
3. Calculates proceeds: `floor(points × rate)`
4. **Adds proceeds to the nation's PRIMARY currency balance** — **not** to the currency being sold
5. Reduces investment points; resets entry price/totalSpent when points hit 0
6. Returns `{ points, proceeds, currentRate }`

### `getInvestmentStatus(nation, currencyKey, worldState)`

Returns current investment status:

- `points` — Amount of currency points owned
- `entryPrice` — Average price paid per point
- `currentRate` — Live exchange rate from EconomySystem
- `pnl` — Profit/loss: `(points × currentRate) − totalSpent`

---

## Currency Rate Synchronization

EconomySystem owns currency rates (single source of truth). World Bank:

- **Reads** live rates from `EconomySystem.getCurrencyConfig()` when available
- **Calls** `EconomySystem.recordCurrencySpending(currencyKey, cost)` on purchases to influence rate dynamics
- **Syncs** its internal `this.currencies` object to EconomySystem's live rates on each `day_passed` event
- Falls back to `worldState.currencies` if EconomySystem is not loaded

World Bank does **not** independently calculate or mutate currency rates — that is entirely EconomySystem's responsibility.

### `_onDayPassed()` (fires on every `day_passed` event)

Runs this sequence each game day:

1. `syncCurrencyRates()` — pull live rates from EconomySystem into World Bank's cache
2. `updateCurrencyRates()` — delegate to `EconomySystem.updateCurrencyRates()` which runs the complex daily rate formula (usage, circulation, spending, random fluctuation) so currencies rise/fall
3. `syncCurrencyRates()` — re-sync after EconomySystem mutated rates so World Bank's cache stays current
4. `processLoanRepayments()` — process loan repayments for every nation (player + AI)

---

## Territory Purchase Cost System

Used when nations purchase map territories/slots. Cost compounds with each additional territory, scaled by purchase frequency, slots-owned vs world average, and currency value.

| Method | Description |
|--------|-------------|
| `recordTerritoryPurchase(nation, currentDay)` | Increments nation + global purchase count; applies decay based on days since last purchase (20% reduction per 7 days) |
| `calculateTerritoryPurchaseCost(nation, baseCost, growthRate)` | Cost for next territory (default base 1000, growth 1.5×) |
| `calculateTerritoryTaxMultiplier(nation, baseCost)` | Multiplier from purchase counts, slot ratio vs world average, currency value |
| `getTotalSlotsOwned()` | Sum of `territorySlotsOwned` across all nations (player nation not double-counted) |
| `getTerritoryCostInfo(nation, currentDay)` | UI package: baseCost, taxAmount, totalCost, breakdown, tax rate info |

Purchase count decay: if 7+ days have passed since the nation's last purchase, the count is decayed by 20% per 7-day step (e.g. 14 days = ×0.8²). This prevents purchase counts from growing without bound while letting active purchasers maintain higher counts.

---

## State Management

### `initWorldCurrencies(worldState)`

**Note:** This method is defined but is not called by any system at runtime. Currency balance seeding is handled by `EconomySystem.initializeCurrencies()` instead (called from `WorldBankSystem.initialize()`). Keep as a fallback for custom worldState-based initialization.

### `bindEvents()` / `_onDayPassed()`

Binds the `day_passed` event listener. On each day pass, syncs currency rates from EconomySystem, delegates rate updates to EconomySystem, re-syncs, and processes loan repayments for all nations.

### `initialize()`

Marks the system initialized and calls `EconomySystem.initializeCurrencies()` to seed `currencyBalances` on the nation if EconomySystem is available.

---

## Key Methods Summary

| Method | Description |
|--------|-------------|
| `getCurrencyConfig()` | Live currency config (from EconomySystem or static fallback) |
| `initWorldCurrencies(worldState)` | Initialize currency state in world (not auto-called) |
| `syncCurrencyRates()` | Sync internal rates from EconomySystem |
| `updateCurrencyRates(worldState, nations)` | Delegates to EconomySystem |
| `initialize()` | Init + seed currency balances via EconomySystem |
| `_onDayPassed()` | Daily sync → rate update → re-sync → loan repayments |
| `getLoanLimit(nation)` | Calculate max borrowable amount |
| `takeLoan(nation, amount)` | Take a loan (adds to aurel balance) |
| `processLoanRepayments()` | Daily loan repayment processing for all nations (split across loans) |
| `currencyBuy(nation, key, points, worldState)` | Buy currency points (deducts from primary currency) |
| `currencySell(nation, key, points, worldState)` | Sell currency points (proceeds to primary currency) |
| `getInvestmentStatus(nation, key, worldState)` | Get investment P&L status |
| `calculateTaxInterestRate(nation)` | Tax interest rate (0–15%) |
| `calculateBillInterestRate(nation)` | Bill interest rate (0–30%) |
| `calculateTaxInterest(amount, turns, rate)` | Compound interest for stacked taxes |
| `calculateBillInterest(amount, turns, rate)` | Compound interest for stacked bills |
| `getInterestRateInfo(nation)` | UI display package for rates |
| `calculateTerritoryPurchaseCost(nation, ...)` | Cost to buy next territory |
| `calculateTerritoryTaxMultiplier(nation, ...)` | Territory tax multiplier |
| `getTotalSlotsOwned()` | Total territory slots across all nations |
| `recordTerritoryPurchase(nation, day)` | Record a purchase + time-based decay |
| `getTerritoryCostInfo(nation, day)` | UI package for territory cost |

---

## Integration with EconomySystem

| Responsibility | EconomySystem | WorldBankSystem |
|----------------|---------------|-----------------|
| Currency exchange rates | ✅ Owns and updates daily | ✅ Reads only |
| Currency balance storage | ✅ `currencyBalances` on Nation | ✅ Reads/writes per-currency balance |
| Currency investment tracking | ❌ Not tracked | ✅ `currencyInvestments` on Nation |
| Loan management | ❌ Not handled | ✅ Full loan lifecycle |
| Rate spending dynamics | ✅ `recordCurrencySpending()` | ✅ Calls it on currency purchases |
| Tax/bill interest rates | ❌ Not handled | ✅ Full interest rate + compounding |
| Territory purchase costs | ❌ Not handled | ✅ Full territory cost system |
| Event cycle | `day_passed` | `day_passed` |

## Browser Wiring (`index.html`)

```html
<script defer src="core/event-system.js"></script>
<script defer src="systems/world-bank-system.js"></script>
<script defer src="ui/live/game.js"></script>
```

`event-system.js` must load first (provides `EventBus`). `world-bank-system.js` binds `day_passed` in its constructor via `bindEvents()`.
