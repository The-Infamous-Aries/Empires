# Economy System

Handles currency management, market trading, economic indicators, industry production, trade flows, and economic events for nations.

## Overview

| Item | Value |
|------|-------|
| **System class:** | `EconomySystem` |
| **Global instance:** | `window.EconomySystem` |
| **Update frequency:** | Every game day (via `day_passed` EventBus event) |
| **Primary config:** | `systems/economy-system.js` |

The economy system manages a **6-currency economy** (resources removed). Each currency has its own dynamically changing value based on usage, circulation, recent spending, and random fluctuation. Markets exist for goods and services only — there is **no resource buying, selling, or trading** in this system.

**Unemployment** is sourced from `CitizenJobSystem` as the truth source — it reads actual citizen employment counts from `PopulationSystem`. Industry-based employment is used as a fallback.

---

## 6 Currency System

World Bank System defines the canonical `CURRENCIES` constant; EconomySystem mirrors these base rates and uses the same lowercase keys.

| Currency | Key | Abbrev | Symbol Asset | Base Rate |
|----------|-----|--------|--------------|-----------|
| Aurel | `aurel` | **AUR** | `assets/images/Currency/aurel.png` | 100 |
| Velt | `velt` | **VLT** | `assets/images/Currency/velt.png` | 100 |
| Krona | `krona` | **KRN** | `assets/images/Currency/krona.png` | 100 |
| Drachma | `drachma` | **DRM** | `assets/images/Currency/drachma.png` | 100 |
| Sovereign | `sovereign` | **SOV** | `assets/images/Currency/sovereign.png` | 100 |
| Talon | `talon` | **TLN** | `assets/images/Currency/talon.png` | 100 |

All currencies start at base rate 100. Rates then diverge daily based on EconomySystem dynamics.

### Currency Balances

Each nation stores balances in `window.Nation.currencyBalances` — a map of currency key to amount. The legacy `window.Nation.money` maps to `aurel` for backward compatibility.

### Currency Configuration API

| Method | Returns |
|--------|---------|
| `getCurrencyConfig()` | Configuration for all 6 currencies |
| `getCurrencyBalance(key)` | Balance of one currency for the current nation |
| `getAllCurrencyBalances()` | All currency balances for the current nation |

`getAllCurrencyBalances()` returns all `currencyBalances` entries, with `aurel` falling back to `nation.money` if `currencyBalances.aurel` is not set.

---

## Currency Exchange Rates

Exchange rates are updated daily in `updateCurrencyRates()`, which runs as part of `handleDayPassed`. Rate calculation now iterates over **all nations** (`window.Nation` plus all `GameEngine.nations`), not just the current nation, so usage and circulation reflect world-wide activity.

### Rate Factors

| Factor | Description | Range |
|--------|-------------|-------|
| **Usage** | More nations using the currency as primary = more valuable/stable | 0.5× – 1.5× |
| **Circulation** | Higher total circulation across all nations = more velocity | 0.5× – 1.5× |
| **Spending** | Recently spent currency loses value slightly (inflation) | 0.5× – 1.5× |
| **Random** | Small random fluctuation (±5%) | 0.95× – 1.05× |

The combined rate is: `baseRate × usageFactor × circulationFactor × spendingFactor × randomFactor`, clamped to a minimum of 1.

`spentRecently` decays by 10% each day (`× 0.9`), so only recent spending affects the rate. `spentRecently` is incremented by `recordCurrencySpending()` when currency is spent on market offers, transfers, and other economic actions.

Transfer rate and interest rate also fluctuate daily:
- **Transfer rate** (0.1% – 5.0%): fee when converting currency; influenced by volatility and inflation pressure.
- **Interest rate** (0.1% – 3.0%): daily interest on holdings; tied to GDP growth.

---

## Currency Conversion & Transfers

### `convertCurrency(amount, fromCurrency, toCurrency)`

Converts an amount between two currencies using current exchange rates:

```
receivedAmount = floor(amount × (toCurrency.rate / fromCurrency.rate))
```

Same-currency transfers return the amount unchanged. Transfer fee from source currency is applied based on `transferRate`.

### `transferCurrency(fromNation, toNation, amount, fromCurrency, toCurrency)`

Transfers funds between two nations with automatic currency conversion:

1. Validates both nations and currencies exist
2. Checks sender has sufficient balance
3. Deducts `amount` from sender in `fromCurrency`
4. Tracks spending via `recordCurrencySpending()` for rate dynamics
5. Converts to `toCurrency` if different (using `convertCurrency`)
6. Adds `receivedAmount` to receiver in `toCurrency`
7. Emits `currency_transferred` EventBus event

Returns `{ ok, amountSent, amountReceived, fromCurrency, toCurrency, converted }`.

---

## Markets

Markets exist for **goods** and **services** only:

### Goods Markets

| Item | Base Price |
|------|-----------|
| consumer_goods | 5.0 |
| industrial_equipment | 25.0 |
| military_equipment | 50.0 |
| luxury_goods | 15.0 |
| pharmaceuticals | 30.0 |
| food | 3.0 |
| technology | 40.0 |

### Services Markets

| Item | Base Price |
|------|-----------|
| transportation | 8.0 |
| communications | 12.0 |
| education | 20.0 |
| healthcare | 35.0 |
| entertainment | 10.0 |

### Market Price Dynamics

Each market entry tracks:
- `currentPrice` — fluctuates daily
- `basePrice` — static reference price
- `demand` / `supply` — affect price direction
- `volatility` — randomness factor
- `trend` — momentum (decays 5% daily)
- `volume` — daily trading volume (resets daily)

Price change formula:
```
supplyDemandRatio = supply / max(demand, 1)
baseChange = (1 - supplyDemandRatio) × 0.02
volatilityChange = (random - 0.5) × volatility
trendChange = trend × 0.01
totalChange = baseChange + volatilityChange + trendChange
newPrice = currentPrice × (1 + totalChange)
```

Prices are clamped between 0.1× and 5.0× base price.

---

## Market Trading (Buy/Sell Offers)

Players can create buy and sell offers for currencies. **Each offer uses two currencies:**
- **Traded currency (`currencyKey`)** — the currency being bought/sold as the asset
- **Payment currency (`aurel`)** — always Aurel, used to pay for the asset

### `createBuyOffer(playerId, currencyKey, amount, pricePerUnit)`

- Validates player ownership
- Validates `currencyKey` is one of the 6 valid currencies
- Calculates `totalCost = amount × pricePerUnit` — paid in **aurel**
- Checks sufficient balance in `aurel` (primary payment currency)
- Escrows `totalCost` aurel from the buyer's balance
- Tracks spending via `recordCurrencySpending()` after escrow deduction confirmed
- Sets `offer.paymentCurrency = 'aurel'`
- Returns the offer object

### `createSellOffer(playerId, currencyKey, amount, pricePerUnit)`

- Validates player ownership and currency
- Checks sufficient balance in `currencyKey` (the traded asset)
- Escrows `amount` of `currencyKey` from the seller's balance
- Sets `offer.paymentCurrency = 'aurel'`
- Returns the offer object

### `acceptBuyOffer(offerId, sellerId)`

- Seller fulfills a buy offer
- Seller deducts `offer.amount` of `offer.currencyKey` (the traded asset)
- Seller receives `offer.totalValue` in **aurel** (payment currency)
- Buyer's escrowed aurel transfers to seller (cleared from escrow)
- Emits `market_buy_offer_accepted` event

### `acceptSellOffer(offerId, buyerId)`

- Buyer fulfills a sell offer
- Buyer pays `offer.totalValue` in **aurel** (payment currency)
- Buyer receives `offer.amount` of `offer.currencyKey` from seller's escrow
- Seller's escrow is cleared (currency transferred to buyer)
- Emits `market_sell_offer_accepted` event

### `cancelOffer(offerId, playerId)`

- Removes the offer
- Schedules return of escrowed currency after **12 turns**
- Emits `market_offer_cancelled` event

### `releaseEscrow(playerId, currencyKey, amount)`

- Releases escrowed currency back to the player after offer fulfillment
- Decrements the escrow balance for that player and currency
- Cleans up zero-balance entries

### Offer Management API

| Method | Description |
|--------|-------------|
| `getMarketOffers()` | All buy and sell offers |
| `getPlayerOffers(playerId)` | Offers owned by a specific player |
| `getPlayerEscrow(playerId)` | Currency held in escrow for a player |

---

## Edict Costs

### `processEdictCosts(currentDay)`

Processes per-turn edict costs for the active nation:

- Calculates edict costs via `EdictSystem.calculateEdictCosts()`
- Deducts cost from the nation's **primary currency** (`currencyBalances[currency]` or `money` for aurel)
- Records `edictCosts` breakdown and `edictTotalCost` on the nation for UI

Requires `window.EdictSystem` to be loaded.

---

## Economic Indicators

Updated daily in `updateEconomicIndicators()`:

| Indicator | Description | Source |
|-----------|-------------|--------|
| `gdpGrowthRate` | Daily GDP growth as a decimal | `updateGDPGrowth()` |
| `inflationRate` | Average price change across goods and services markets | `updateInflation()` |
| `unemploymentRate` | Unemployed / workforce | **CitizenJobSystem** (truth source) or industry fallback |
| `interestRate` | Base interest rate (3%) | Currency-driven |
| `exchangeRate` | Aurel rate / base rate | Currency-driven |
| `economicIndex` | Overall economic health (0–200) | `updateEconomicIndex()` |

### Unemployment Rate

`updateUnemployment()` uses `CitizenJobSystem.getEmployedCount()` as the truth source:

- Reads actual employed citizen counts from `PopulationSystem.citizens`
- Counts working-age citizens (teen, youngAdult, adult, middleAged, older, senior, child)
- Falls back to industry-based calculation (`population × 0.6`) if CitizenJobSystem unavailable
- Social spending > 20% reduces unemployment by 10%

### Economic Index Calculation

```
index = 100
index += gdpGrowthRate × 1000
index -= |inflationRate - 0.02| × 500   (optimal inflation is 2%)
index -= unemploymentRate × 200
index += tradeBalance × 0.01
clamped to [0, 200]
```

---

## Industries

Industries produce goods based on employment and efficiency:

| Industry | Produces | Capacity |
|----------|----------|----------|
| Agriculture | food | 100 |
| Manufacturing | consumer_goods, industrial_equipment | 100 |
| Technology | technology | 50 |
| Services | transportation, communications | 200 |

Each industry tracks: `employment`, `efficiency`, `capacity`. Production rate = `employment × efficiency`. Industries feed into the goods markets (food, technology now included). Production adds to market supply only — no resource stockpiles are tracked on nations.

---

## Economic Events

Random events that affect economic indicators:

- **Market Boom** — +5% GDP growth (30 days)
- **Supply Chain Disruption** — +2% inflation (15 days)
- **Technology Innovation** — +3% GDP growth, -1% unemployment (60 days)
- **Trade War** — -2% GDP growth (45 days)
- **Currency Crisis** — -10% economic index (20 days)
- **Economic Sanctions** — -1% GDP growth, +1% unemployment (25 days)

Events have a 15% monthly chance to trigger. Effects are applied daily and **fully reversed** when the event expires.

### Event Reversal (Delta-Based)

Event effects now use **delta tracking** instead of absolute snapshots:

- `applyEventEffects()` stores the change factor (delta) per indicator
- `removeEventEffects()` reverses by dividing by `(1 + change)` per indicator
- Multiple events modifying the same indicator no longer interfere with each other's reversal

Events with weight can be defined in `assets/data/events/economic-events.js`.

---

## Economic Policies

| Policy | Default | Description |
|--------|---------|-------------|
| taxRate | 20% | National tax rate |
| corporateTaxRate | 25% | Corporate tax rate |
| salesTaxRate | 8% | Sales tax rate |
| minimumWage | 15 | Minimum wage |
| socialSpending | 15% | Social spending (% of GDP) |
| infrastructureSpending | 10% | Infrastructure spending (% of GDP) |
| militarySpending | 5% | Military spending (% of GDP) |
| researchSpending | 3% | Research spending (% of GDP) |

Policies affect GDP growth (infrastructure increases, taxes decrease) and unemployment (social spending reduces unemployment when >20%).

`handlePolicyChanged()` applies policy changes from EventBus events.

---

## Annual & Long-Term Economic Methods

### `performAnnualEconomicReview()`

Generates an annual report with GDP, tax revenue, total tax earned, indicators, trade balance, active events, and currency config. Emits `annual_economic_review` EventBus event.

### `updateLongTermTrends()`

Calculates CAGR (compound annual growth rate) from GDP history and smooths inflation rate over recent periods.

### `processEconomicCycles()`

Detects boom/bust cycles from recent GDP changes (4-period window). Adjusts `economicIndex` by ±5 based on average change exceeding ±3%.

### `processCorporateActivities()`

Drifts industry efficiency slightly each month based on random economic conditions (±0.5% to ±1.5%).

### `updateEmployment()`

Delegates to `updateUnemployment()` which reads from CitizenJobSystem.

### `updateTradeAgreements()`

Placeholder for future diplomatic integration.

### `generateAnnualReport()`

Yearly economic report with indicators, performance metrics, trade balance, major events, and currency config.

---

## Trade Flows

Tracks imports and exports by currency:

| Method | Description |
|--------|-------------|
| `handleTradeExecuted(data)` | Records import/export volume by currency |
| `updateTradeFlows()` | Calculates trade balance from export/import values |

Trade balance = `exportValue - importValue`, where value = `amount × currency.rate`.

---

## Daily Update Flow (`handleDayPassed`)

```
updateMarketPrices()       → Update goods and services prices
updateCurrencyRates()      → Update all 6 currency exchange rates (all nations)
processIndustryProduction() → Produce goods based on industry employment
updateEconomicIndicators() → GDP, inflation, unemployment, economic index
processEconomicEvents()    → Apply/expire active events (delta-based reversal)
updateTradeFlows()         → Calculate trade balance
recordEconomicHistory()    → Log GDP, inflation, unemployment
processPendingCancellations() → Return escrowed currency after 12 turns
```

---

## State Save/Load

`getState()` / `setState()` persist:

- indicators, policies, trade data
- markets (goods, services), currencies, industries
- active events, economic history
- market offers (buy/sell/escrow/pending cancellations)
- nextOfferId

---

## Key Methods Summary

### Currency Queries

| Method | Returns |
|--------|---------|
| `getCurrencyConfig()` | All 6 currencies with rate, abbrev, symbol, circulation, usageCount |
| `getCurrencyBalance(key)` | Balance of one currency for current nation |
| `getAllCurrencyBalances()` | All balances for current nation |
| `getCurrencyTransferRate(key)` | Transfer fee percentage for a currency |
| `getCurrencyInterestRate(key)` | Daily interest percentage for a currency |
| `getAllCurrencyRates()` | Exchange, transfer, and interest rates for all currencies |

### Currency Operations

| Method | Description |
|--------|-------------|
| `convertCurrency(amount, from, to)` | Convert between currencies |
| `transferCurrency(from, to, amount, fromCur, toCur)` | Transfer with automatic conversion + spending tracking |
| `recordCurrencySpending(key, amount)` | Track spending for rate dynamics |

### Market Operations

| Method | Description |
|--------|-------------|
| `createBuyOffer(playerId, currencyKey, amount, price)` | Create buy offer (escrows currency + tracks spending) |
| `createSellOffer(playerId, currencyKey, amount, price)` | Create sell offer (escrows currency) |
| `acceptBuyOffer(offerId, sellerId)` | Fulfill buy offer — seller receives payment currency, escrow released |
| `acceptSellOffer(offerId, buyerId)` | Fulfill sell offer — buyer pays, receives currency from seller's escrow |
| `cancelOffer(offerId, playerId)` | Cancel offer (12-turn return delay) |
| `releaseEscrow(playerId, currencyKey, amount)` | Release escrowed currency back to player |
| `getMarketOffers()` / `getPlayerOffers(id)` / `getPlayerEscrow(id)` | Query offers/escrow |

### Economic Overview

| Method | Description |
|--------|-------------|
| `getEconomicOverview()` | Full snapshot: indicators, policies, trade, markets, currencies, active events |
| `resetMarketPrices()` | Reset all market prices to base |
| `generateAnnualReport()` | Yearly economic report |
| `performAnnualEconomicReview()` | Annual review with GDP, tax revenue, indicators |
| `updateLongTermTrends()` | CAGR and inflation smoothing |
| `processEconomicCycles()` | Boom/bust cycle detection |

---

## Currency Symbols & Abbreviations

Custom icons are stored at `assets/images/Currency/<key>.png`:

| Abbrev | Key | Asset Path |
|--------|-----|------------|
| AUR | aurel | `assets/images/Currency/aurel.png` |
| VLT | velt | `assets/images/Currency/velt.png` |
| KRN | krona | `assets/images/Currency/krona.png` |
| DRM | drachma | `assets/images/Currency/drachma.png` |
| SOV | sovereign | `assets/images/Currency/sovereign.png` |
| TLN | talon | `assets/images/Currency/talon.png` |

---

## Integration with World Bank System

The World Bank System (`systems/world-bank-system.js`) defines the canonical `CURRENCIES` constant with the same 6 currencies and base rates. The Economy System mirrors these base rates and uses the same lowercase keys for compatibility.

| Responsibility | EconomySystem | WorldBankSystem |
|----------------|---------------|-----------------|
| Currency exchange rates | ✅ Owns and updates daily | ✅ Reads only |
| Currency balance storage | ✅ `currencyBalances` on Nation | ✅ Reads/writes per-currency balance |
| Currency investment tracking | ❌ Not tracked | ✅ `currencyInvestments` on Nation |
| Loan management | ❌ Not handled | ✅ Full loan lifecycle |
| Rate spending dynamics | ✅ `recordCurrencySpending()` | ✅ Calls it on currency purchases |
| Tax/bill interest rates | ❌ Not handled | ✅ Full interest rate + compounding |
| Territory purchase costs | ❌ Not handled | ✅ Full territory cost system |
| Edict cost deduction | ✅ Deducts from primary currency | ❌ Not handled |
| Market trading (buy/sell offers) | ✅ Full market lifecycle | ❌ Not handled |
| Event cycle | `day_passed` | `day_passed` |
