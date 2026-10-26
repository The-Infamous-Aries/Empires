# Economy System

Handles currency management, market trading, economic indicators, industry production, trade flows, and economic events for nations.

## Overview

| Item | Value |
|------|-------|
| **System class:** | `EconomySystem` |
| **Global instance:** | `window.EconomySystem` |
| **Update frequency:** | Every game day (via `day_passed` EventBus event) |
| **Primary config:** | `systems/economy-system.js` |

The economy system manages a **6-currency economy** (resources removed). Each currency has its own dynamically changing value based on usage, circulation, recent spending, and random fluctuation. Markets exist for goods and services only.

---

## 6 Currency System

| Currency | Key | Abbrev | Symbol Asset | Base Rate |
|----------|-----|--------|--------------|-----------|
| Aurel | `aurel` | **AUR** | `assets/images/Currency/aurel.png` | 100 |
| Velt | `velt` | **VLT** | `assets/images/Currency/velt.png` | 90 |
| Krona | `krona` | **KRN** | `assets/images/Currency/krona.png` | 110 |
| Drachma | `drachma` | **DRM** | `assets/images/Currency/drachma.png` | 95 |
| Sovereign | `sovereign` | **SOV** | `assets/images/Currency/soverneign.png` | 105 |
| Talon | `talon` | **TLN** | `assets/images/Currency/talon.png` | 85 |

### Currency Balances

Each nation stores balances in `window.Nation.currencyBalances` — a map of currency key to amount. The legacy `window.Nation.money` maps to `aurel` for backward compatibility.

Each currency has:
- **rate** — Current exchange value (fluctuates daily)
- **baseRate** — The static base value (100 for aurel, etc.)
- **circulation** — Total amount of this currency across all nations
- **usageCount** — How many nations use this currency as their primary
- **spentRecently** — Amount spent recently (inflationary pressure, decays daily)
- **symbol** — Path to the currency icon asset
- **abbrev** — 3-letter abbreviation (AUR, VLT, KRN, DRM, SOV, TLN)
- **history** — Last 100 rate snapshots with timestamps

### Currency Configuration API

| Method | Description |
|--------|-------------|
| `getCurrencyConfig()` | Returns configuration for all 6 currencies |
| `getCurrencyBalance(key)` | Returns balance of a specific currency for the current nation |
| `getAllCurrencyBalances()` | Returns all currency balances for the current nation |

---

## Currency Exchange Rates

Exchange rates are updated daily in `updateCurrencyRates()`. The rate for each currency is calculated dynamically:

### Rate Factors

| Factor | Description | Range |
|--------|-------------|-------|
| **Usage** | More nations using the currency as primary = more valuable/stable | 0.5× – 1.5× |
| **Circulation** | Higher total circulation = more velocity | 0.5× – 1.5× |
| **Spending** | Recently spent currency loses value slightly (inflation) | 0.5× – 1.5× |
| **Random** | Small random fluctuation (±5%) | 0.95× – 1.05× |

The combined rate is: `baseRate × usageFactor × circulationFactor × spendingFactor × randomFactor`, clamped to a minimum of 1.

`spentRecently` decays by 10% each day (`× 0.9`), so only recent spending affects the rate.

---

## Currency Conversion & Transfers

### `convertCurrency(amount, fromCurrency, toCurrency)`

Converts an amount between two currencies using current exchange rates:

```
receivedAmount = floor(amount × (toCurrency.rate / fromCurrency.rate))
```

Same-currency transfers return the amount unchanged.

### `transferCurrency(fromNation, toNation, amount, fromCurrency, toCurrency)`

Transfers funds between two nations with automatic currency conversion:

1. Validates both nations and currencies exist
2. Checks sender has sufficient balance
3. Deducts `amount` from sender in `fromCurrency`
4. Converts to `toCurrency` if different (using `convertCurrency`)
5. Adds `receivedAmount` to receiver in `toCurrency`
6. Tracks `spentRecently` on the sender's currency for rate dynamics
7. Emits `currency_transferred` EventBus event

Returns `{ ok, amountSent, amountReceived, fromCurrency, toCurrency, converted }`.

---

## Markets

Markets exist for **goods** and **services** only (resources removed):

### Goods Markets

| Item | Base Price |
|------|-----------|
| consumer_goods | 5.0 |
| industrial_equipment | 25.0 |
| military_equipment | 50.0 |
| luxury_goods | 15.0 |
| pharmaceuticals | 30.0 |

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

Players can create buy and sell offers for currencies:

### `createBuyOffer(playerId, currencyKey, amount, pricePerUnit)`
- Validates player ownership
- Validates currency is one of the 6 valid currencies
- Calculates `totalCost = amount × pricePerUnit`
- Checks sufficient balance
- Deducts `totalCost` from player balance into escrow
- Returns the offer object

### `createSellOffer(playerId, currencyKey, amount, pricePerUnit)`
- Validates player ownership and currency
- Checks sufficient currency balance
- Deducts `amount` into escrow
- Returns the offer object

### `acceptBuyOffer(offerId, sellerId)`
- Seller fulfills a buy offer
- Transfers `offer.amount` of currency from seller to buyer
- Seller receives `offer.totalValue` in aurel

### `acceptSellOffer(offerId, buyerId)`
- Buyer fulfills a sell offer
- Transfers `offer.totalValue` of currency from buyer to seller
- Buyer receives `offer.amount` of the sold currency

### `cancelOffer(offerId, playerId)`
- Removes the offer
- Schedules return of escrowed currency after **12 turns**
- Emits `market_offer_cancelled` event

### Offer Management API

| Method | Description |
|--------|-------------|
| `getMarketOffers()` | All buy and sell offers |
| `getPlayerOffers(playerId)` | Offers owned by a specific player |
| `getPlayerEscrow(playerId)` | Currency held in escrow for a player |

---

## Economic Indicators

Updated daily in `updateEconomicIndicators()`:

| Indicator | Description |
|-----------|-------------|
| `gdpGrowthRate` | Daily GDP growth as a decimal |
| `inflationRate` | Average price change across goods and services markets |
| `unemploymentRate` | Unemployed / workforce (workforce = population × 0.6) |
| `interestRate` | Base interest rate (3%) |
| `exchangeRate` | Aurel rate / base rate |
| `economicIndex` | Overall economic health (0–200) |

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

Each industry track: `employment`, `efficiency`, `capacity`. Production rate = `employment × efficiency`.

---

## Trade Flows

Tracks imports and exports by currency:

| Method | Description |
|--------|-------------|
| `handleTradeExecuted(data)` | Records import/export volume by currency |
| `updateTradeFlows()` | Calculates trade balance from export/import values |

Trade balance = `exportValue - importValue`, where value = `amount × currency.rate`.

---

## Economic Events

Random events that affect economic indicators:

- **Market Boom** — +5% GDP growth (30 days)
- **Supply Chain Disruption** — +2% inflation (15 days)
- **Technology Innovation** — +3% GDP growth, -1% unemployment (60 days)
- **Trade War** — -2% GDP growth (45 days)
- **Currency Crisis** — -10% economic index (20 days)
- **Economic Sanctions** — -1% GDP growth, +1% unemployment (25 days)

Events have a 15% monthly chance to trigger. Effects are applied daily and **fully reversed** when the event expires (tracked via `_appliedEventEffects`).

Events with weight can be defined in `data/events/economic-events.js`.

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

---

## Daily Update Flow (`handleDayPassed`)

```
updateMarketPrices()       → Update goods and services prices
updateCurrencyRates()      → Update all 6 currency exchange rates
processIndustryProduction() → Produce goods based on employment
updateEconomicIndicators() → GDP, inflation, unemployment, economic index
processEconomicEvents()    → Apply/expire active events
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

### Currency Operations
| Method | Description |
|--------|-------------|
| `convertCurrency(amount, from, to)` | Convert between currencies |
| `transferCurrency(from, to, amount, fromCur, toCur)` | Transfer with automatic conversion |
| `recordCurrencySpending(key, amount)` | Track spending for rate dynamics |

### Market Operations
| Method | Description |
|--------|-------------|
| `createBuyOffer(playerId, currencyKey, amount, price)` | Create buy offer (escrows currency) |
| `createSellOffer(playerId, currencyKey, amount, price)` | Create sell offer (escrows currency) |
| `acceptBuyOffer(offerId, sellerId)` | Fulfill a buy offer |
| `acceptSellOffer(offerId, buyerId)` | Fulfill a sell offer |
| `cancelOffer(offerId, playerId)` | Cancel offer (12-turn return delay) |
| `getMarketOffers()` / `getPlayerOffers(id)` / `getPlayerEscrow(id)` | Query offers/escrow |

### Economic Overview
| Method | Description |
|--------|-------------|
| `getEconomicOverview()` | Full snapshot: indicators, policies, trade, markets, currencies, active events |
| `resetMarketPrices()` | Reset all market prices to base |
| `generateAnnualReport()` | Yearly economic report |

---

## Currency Symbols & Abbreviations

Custom icons are stored at `assets/images/Currency/<key>.png`:

| Abbrev | Key | Asset Path |
|--------|-----|------------|
| AUR | aurel | `assets/images/Currency/aurel.png` |
| VLT | velt | `assets/images/Currency/velt.png` |
| KRN | krona | `assets/images/Currency/krona.png` |
| DRM | drachma | `assets/images/Currency/drachma.png` |
| SOV | sovereign | `assets/images/Currency/soverneign.png` |
| TLN | talon | `assets/images/Currency/talon.png` |

Note: The on-disk file for sovereign is named `soverneign.png` (misspelled). The code references this exact filename.

---

## Integration with World Bank System

The World Bank System (`systems/world-bank-system.js`) defines the canonical `CURRENCIES` constant with the same 6 currencies and base rates. The Economy System mirrors these base rates and uses the same lowercase keys for compatibility. World Bank handles currency investment (buy/sell currency points), while the Economy System handles daily rate dynamics, transfers, and market trading.
