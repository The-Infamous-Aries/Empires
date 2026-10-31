# World Economy Guide

Everything you need to know about your nation's economy: the 6-currency system, exchange rates, loans, currency investing, markets, and economic indicators. Learn how to grow your wealth, manage debt, and profit from currency fluctuations.

---

## Table of Contents

1. [The 6 Currencies](#the-6-currencies)
2. [How Exchange Rates Work](#how-exchange-rates-work)
3. [Currency Balances](#currency-balances)
4. [Transferring Money Between Nations](#transferring-money-between-nations)
5. [Loans from the World Bank](#loans-from-the-world-bank)
6. [Currency Investing](#currency-investing)
7. [Markets: Goods & Services](#markets-goods--services)
8. [Economic Indicators](#economic-indicators)
9. [Economic Policies](#economic-policies)
10. [Tips & Strategy](#tips--strategy)

---

## The 6 Currencies

Your nation uses a 6-currency economy (resources have been removed). Each currency has its own value that changes daily based on how much it's used, how much is in circulation, how much is spent, and random market fluctuation.

| Currency | Abbrev | Key | Symbol | Starting Value |
|----------|--------|-----|--------|----------------|
| Aurel | **AUR** | `aurel` | ₳ | 100 |
| Velt | **VLT** | `velt` | ✦ | 100 |
| Krona | **KRN** | `krona` | ₭ | 100 |
| Drachma | **DRM** | `drachma` | ð | 100 |
| Sovereign | **SOV** | `sovereign` | ꜱ | 100 |
| Talon | **TLN** | `talon` | ₮ | 100 |

All currencies start equal at 100. From there, rates diverge based on player activity.

Your nation's balances are stored in `currencyBalances` — a separate amount for each currency. The legacy `money` field maps to Aurel (AUR) for backward compatibility.

---

## How Exchange Rates Work

Exchange rates update **every game day** based on four factors:

| Factor | What It Means | Effect on Rate |
|--------|---------------|----------------|
| **Usage** | How many nations use this currency as their primary | More users = more valuable (up to 1.5×) |
| **Circulation** | Total amount of this currency across all nations | More circulation = higher velocity (up to 1.5×) |
| **Spending** | How much was spent recently (buildings, military, upkeep, etc.) | More recent spending = slight value loss (inflation, down to 0.5×) |
| **Random** | Small market noise (±5%) | Random rises and falls every day |

The formula:
```
newRate = baseRate × usageFactor × circulationFactor × spendingFactor × randomFactor
```

Rates are clamped to a minimum of 1 and recalculated daily by the Economy System.

**Tip:** A currency that's widely used but not over-spent will tend to appreciate. A currency that's heavily spent on military and upkeep will tend to depreciate.

---

## Currency Balances

Check your balances with `EconomySystem.getAllCurrencyBalances()`. You'll see an amount for each of the 6 currencies.

- **Aurel (AUR)** — Your base currency. Legacy `money` maps to this.
- **Other currencies** — Start at 0 unless you acquire them through transfers, trades, or investing.

Your primary currency is stored in `nation.currency`. When you transfer money to another nation, if they use a different primary currency, the amount is automatically converted using current exchange rates.

---

## Transferring Money Between Nations

Use `EconomySystem.transferCurrency(fromNation, toNation, amount, fromCurrency, toCurrency)` to send money to another player/nation:

1. Validates both nations and currencies
2. Checks the sender has sufficient balance
3. Deducts `amount` from sender in `fromCurrency`
4. If currencies differ, converts using `to.rate / from.rate`
5. Adds the (possibly converted) amount to the receiver in `toCurrency`
6. Records the spending for rate dynamics

**Example:** You send 1,000 AUR to a nation whose primary currency is VLT. If VLT's rate is 110 and AUR's rate is 100, they receive approximately 1,100 VLT (floored).

**Tip:** Sending in the receiver's primary currency avoids conversion losses.

---

## Loans from the World Bank

The World Bank lets nations borrow money based on their tax revenue.

### Loan Limit

```
limit = floor(taxRevenue × multiplier)
multiplier = min(5, 1 + playDays × 0.1)
```

- New nations: 1× tax revenue
- Older nations: up to 5× tax revenue
- `playDays` = days since your nation was founded

### Taking a Loan

- Funds are added to your **Aurel (AUR)** balance
- A loan record is created with 15% daily interest rate
- Loans appear in `nation.loans` as `{ amount, rate, takenAt, remaining }`

### Repaying Loans

Repayments happen **automatically every day** for every nation (player + AI):

1. Daily repayment = `floor(taxRevenue × 0.15)` per nation
2. The repayment is **split across all your active loans** (not charged in full to each)
3. Deducted from your Aurel balance
4. Paid-off loans are removed from your list

**Tip:** Don't take more loans than you can comfortably repay daily. If tax revenue drops, your repayment drops too — but so does your ability to pay.

---

## Currency Investing

You can buy and sell currency points through the World Bank as an investment.

### Buying Currency Points

```
cost = ceil(points × currentRate)
```

- Deducts cost from your **primary currency** balance (the currency set in `nation.currency`, default AUR) — not from the currency you're buying
- Records your average entry price
- Records spending (which affects that currency's exchange rate)
- Returns your cost, entry price, and current rate

### Selling Currency Points

```
proceeds = floor(points × currentRate)
```

- Adds proceeds to your **primary currency** balance — not to the currency you're selling
- Reduces your held points
- If you sell all points, entry price resets to 0

### Checking Your Investment

`getInvestmentStatus()` returns:
- **points** — How many you own
- **entryPrice** — What you paid on average
- **currentRate** — Today's live rate
- **pnl** — Profit/loss: `(points × currentRate) − totalSpent`

**Tip:** Buy when a currency's rate is low (depreciated from heavy spending), sell when it recovers. PnL shows your real profit.

---

## Markets: Goods & Services

Resources have been removed. Markets exist for **goods** and **services** only:

### Goods Markets

| Item | Base Price |
|------|-----------|
| Consumer Goods | 5.0 |
| Industrial Equipment | 25.0 |
| Military Equipment | 50.0 |
| Luxury Goods | 15.0 |
| Pharmaceuticals | 30.0 |

### Services Markets

| Item | Base Price |
|------|-----------|
| Transportation | 8.0 |
| Communications | 12.0 |
| Education | 20.0 |
| Healthcare | 35.0 |
| Entertainment | 10.0 |

### Market Prices

Prices change daily based on supply and demand:

- High demand + low supply = price goes up
- Low demand + high supply = price goes down
- Prices clamp between 10% and 500% of base price
- Random volatility adds small daily fluctuations

### Buy/Sell Offers

Players can create market offers:

- **Buy offer:** Specify a currency to buy and price per unit. You pay in **aurel** (payment currency). The currency you're buying is the traded asset.
- **Sell offer:** Specify a currency to sell and price per unit. You escrow the traded currency; you receive aurel as payment.
- Other players can accept your offers
- Cancelled offers return escrowed currency after **12 turns**

**Example:** You create a buy offer for 100 VLT at price 120 AUR each. Cost = 12,000 AUR escrowed. A seller accepts: they give you 100 VLT and receive 12,000 AUR.

---

## Economic Indicators

Updated daily by the Economy System:

| Indicator | What It Tells You |
|-----------|-------------------|
| **GDP Growth Rate** | Daily change in your nation's GDP |
| **Inflation Rate** | Average price change across goods and services |
| **Unemployment Rate** | Unemployed ÷ workforce (workforce = 60% of population) |
| **Exchange Rate** | Aurel rate ÷ base rate |
| **Economic Index** | Overall economic health (0–200) |

### Economic Index Formula

```
index = 100
index += GDP Growth × 1000
index -= |Inflation − 0.02| × 500     (2% is optimal inflation)
index -= Unemployment × 200
index += Trade Balance × 0.01
```

Clamped to 0–200. Higher is better.

---

## Economic Policies

| Policy | Default | Effect |
|--------|---------|--------|
| Tax Rate | 20% | Higher taxes reduce GDP growth |
| Corporate Tax Rate | 25% | Affects corporate activity |
| Sales Tax Rate | 8% | Affects consumer spending |
| Minimum Wage | 15 | Affects employment costs |
| Social Spending | 15% | >20% reduces unemployment |
| Infrastructure Spending | 10% | Increases GDP growth |
| Military Spending | 5% | National defense budget |
| Research Spending | 3% | Technology advancement |

Use `EconomySystem.setTaxRate(rate)` to change your tax rate (0–100%).

---

## Tips & Strategy

### Early Game
- **Focus on happiness and environment** — These drive population growth, which drives tax revenue.
- **Don't over-borrow** — Your loan limit is based on tax revenue. New nations can only borrow 1× revenue.
- **Keep a currency reserve** — Maintain some AUR for emergencies and loan repayments.

### Mid Game
- **Watch your exchange rates** — If your primary currency is depreciating, consider spending less of it or using a different currency for transactions.
- **Invest in undervalued currencies** — Buy when rates are low (after heavy spending drives them down), sell when they recover.
- **Balance social spending** — Keep it above 20% to reduce unemployment, but not so high that it hurts your budget.

### Late Game
- **Diversify currency holdings** — Don't hold everything in one currency. Spread across AUR, VLT, KRN, DRM, SOV, TLN to hedge against rate swings.
- **Monitor the Economic Index** — If it drops below 50, your economy is in trouble. Check inflation, unemployment, and GDP growth.
- **Time your loan repayments** — Repayments scale with tax revenue. Grow your revenue before taking large loans.

### Warning Signs

| Sign | Meaning | Fix |
|------|---------|-----|
| Exchange rate dropping fast | Currency is being over-spent | Reduce spending in that currency, or switch primary currency |
| Unemployment rising | Not enough jobs | Increase social spending (>20%) or build more industry |
| Economic Index < 50 | Economy in distress | Check inflation, GDP, and unemployment; adjust policies |
| Loan repayments > Tax revenue | Can't afford debt | Pay off smaller loans first, avoid new borrowing |
| Inflation > 5% | Prices rising too fast | Reduce money supply, increase goods production |

### Quick Reference
- **6 currencies** — all start at 100, rates change daily
- **AUR is your base currency** — loans deposit into and repay from AUR; currency investments buy/sell using your primary currency (default AUR)
- **Loans split repayment** across all active loans daily (all nations, including AI)
- **Currency investments** deduct cost from your primary currency; sell proceeds go to your primary currency
- **Investment PnL** = (points × currentRate) − totalSpent
- **Economic Index** 0–200, higher is better
- **Cancelled offers** return after 12 turns
