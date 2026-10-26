# World Bank System

Handles nation loans, currency investment, and currency rate synchronization with the Economy System.

## Overview

| Item | Value |
|------|-------|
| **System class:** | `WorldBankSystem` |
| **Global instance:** | `window.WorldBankSystem` |
| **Loan rate:** | 15% of tax revenue per day |
| **Max loan multiplier:** | 5× income (increases with nation age) |
| **Currency rate authority:** | EconomySystem (single source of truth) |
| **Primary config:** | `systems/world-bank-system.js` |

The World Bank System provides loans to nations and lets players invest in the 6 currencies. It reads live currency exchange rates from the EconomySystem (which is the single source of truth for rates) and records spending back to it for rate dynamics.

---

## 6 Currency Configuration

World Bank mirrors the Economy System's canonical currency config:

| Currency | Key | Abbrev | Symbol | Base Rate |
|----------|-----|--------|--------|-----------|
| Aurel | `aurel` | **AUR** | `assets/images/Currency/aurel.png` | 100 |
| Velt | `velt` | **VLT** | `assets/images/Currency/velt.png` | 100 |
| Krona | `krona` | **KRN** | `assets/images/Currency/krona.png` | 100 |
| Drachma | `drachma` | **DRM** | `assets/images/Currency/drachma.png` | 100 |
| Sovereign | `sovereign` | **SOV** | `assets/images/Currency/soverneign.png` | 100 |
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

### `takeLoan(nation, amount)`

- Validates the amount doesn't exceed the loan limit
- Adds funds to `nation.currencyBalances.aurel` (or legacy `nation.money`)
- Creates a loan record: `{ amount, rate: 0.15, takenAt, remaining: amount }`
- Returns `{ ok: true }` or `{ ok: false, reason }`

### `processLoanRepayments()` (runs daily on `day_passed`)

- Calculates daily repayment: `floor(taxRevenue × 0.15)`
- **Splits** the repayment across all active loans (not applied in full to each)
- Deducts total repayment from `currencyBalances.aurel`
- Removes paid-off loans from the list

If a nation has 3 loans and owes 300 total repayment, each loan gets 100 applied (not 300 each).

---

## Currency Investment

### `currencyBuy(nation, currencyKey, points, worldState)`

Buys currency points as an investment:

1. Validates currency key and positive points
2. Reads live rate from EconomySystem (or worldState fallback)
3. Calculates cost: `ceil(points × rate)`
4. Deducts cost from `currencyBalances.aurel` (or legacy `nation.money`)
5. Records investment: `{ points, entryPrice (average), totalSpent }`
6. Calls `EconomySystem.recordCurrencySpending('aurel', cost)` to affect rate dynamics
7. Returns `{ points, cost, entryPrice, currentRate }`

### `currencySell(nation, currencyKey, points, worldState)`

Sells currency points back:

1. Validates currency key and sufficient points owned
2. Reads live rate from EconomySystem
3. Calculates proceeds: `floor(points × rate)`
4. Adds proceeds to `currencyBalances.aurel`
5. Reduces investment points
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
- **Calls** `EconomySystem.recordCurrencySpending('aurel', cost)` on purchases to influence rate dynamics
- **Syncs** its internal `this.currencies` object to EconomySystem's live rates on `day_passed`
- Falls back to `worldState.currencies` if EconomySystem is not loaded

World Bank does **not** independently calculate or mutate currency rates — that is entirely EconomySystem's responsibility.

---

## State Management

### `initWorldCurrencies(worldState)`

Initializes currency state in `worldState.currencies` if EconomySystem is not available. Delegates to `EconomySystem.initializeCurrencies()` when available.

### `destroy()`

Unbinds `day_passed` event listeners (`processLoanRepayments` and `syncCurrencyRates`). Sets `isInitialized = false`.

---

## Key Methods Summary

| Method | Description |
|--------|-------------|
| `getCurrencyConfig()` | Live currency config (from EconomySystem or static fallback) |
| `initWorldCurrencies(worldState)` | Initialize currency state in world |
| `syncCurrencyRates()` | Sync internal rates from EconomySystem |
| `updateCurrencyRates(worldState, nations)` | Delegates to EconomySystem |
| `getLoanLimit(nation)` | Calculate max borrowable amount |
| `takeLoan(nation, amount)` | Take a loan (adds to aurel balance) |
| `processLoanRepayments()` | Daily loan repayment processing |
| `currencyBuy(nation, key, points, worldState)` | Buy currency points as investment |
| `currencySell(nation, key, points, worldState)` | Sell currency points back |
| `getInvestmentStatus(nation, key, worldState)` | Get investment P&L status |
| `calculateResourcePrice(...)` | Returns `{ ok: false, reason: 'Resources removed' }` |
| `buyResource(...)` | Returns `{ ok: false, reason: 'Resources removed' }` |
| `destroy()` | Clean up event listeners |

---

## Integration with EconomySystem

| Responsibility | EconomySystem | WorldBankSystem |
|----------------|---------------|-----------------|
| Currency exchange rates | ✅ Owns and updates daily | ✅ Reads only |
| Currency balance storage | ✅ `currencyBalances` on Nation | ✅ Reads/writes aurel balance |
| Currency investment tracking | ❌ Not tracked | ✅ `currencyInvestments` on Nation |
| Loan management | ❌ Not handled | ✅ Full loan lifecycle |
| Rate spending dynamics | ✅ `recordCurrencySpending()` | ✅ Calls it on purchases |
| Event cycle | `day_passed` | `day_passed` |
