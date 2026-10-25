# Full Economy Rework Plan (Money-Only + Currency Investment Bank)

## 1. Remove All Resources
- Drop `resources` object from Nation; keep `money` only.
- Remove `primaryResource` selection from registration; instead require picking one of 6 fictional currency types.
- Existing nations must pick a currency on next load (migration prompt).
- Remove resource yields from territory, cities, territory-manager.
- Remove resource production/manufacturing in economy-system, resource-system.
- Remove critical water/food happiness penalties.
- Remove resource selectors/topbar dropdown; show only cash.

- Remove resource-based improvements/projects/wonders (mines, lumbermills, farms, drills, refineries, smelters, etc.).
- Add money-based upkeep to remaining improvements/projects/wonders.
- Add `upkeep` field to improvements (small), projects (medium), wonders (high).
- Charge upkeep hourly in turn processing.
- Military unit upkeep increased substantially (high for high-impact units).
- Buildings/upkeep themed to their effect (military units that boost score/damage cost more).

## 3. Money Balance
- Reduce per-turn income; make taxes population-based and realistic.
- Population system fully functional: growth, workforce, happiness, efficiency.
- All costs/upkeeps themed so money feels real.

## 4. Bank Tab (replaces Trade)
- Tab renamed to Bank; remove Trade tab entirely.
- Loans remain.
- Currency investments: 6 fictional currencies with true point values.
- Users invest money to buy points in a currency (like stock), track entry price and current price.
- World motion can create a new currency (fully working).
- Currency value rises/falls based on holders' revenue/taxes and adoption.

## 5. Files to Update (scan)
- entities/Nation.js
- entities/Resource.js (remove)
- systems/resource-system.js (remove)
- systems/improvements-system.js, projects-system.js, wonders-system.js
- systems/war-system.js, core/ai-nations.js
- systems/economy-system.js, population-system.js
- server/trade.js (remove), server/world.js (catalog, motions)
- ui/live/game.js, EconomyPanel.js, components/* panels
- map/territory-manager.js, entities/City.js
- core/game-engine.js
- tests/live-server.test.js
- core/sync, persistence for migration

## Status (in progress)
Done:
- Nation: removed resources object, added currency/currencyInvestments; money-only economy; money refs migrated.
- trainMilitary: resource requirements/deduction removed.
- Improvements/Projects/Wonders: money-only affordability/payment; resource recovery disabled.
- Economy: resource checks/consumption/production no-ops; tradeable resources disabled; executeTrade disabled; cancellation returns money only.
- Territory manager, City, War, Alliance, AI nations: resource paths disabled; resource recovery disabled.
- World server: affordability/pay money-only; manufacturing disabled; world bank trading disabled; trade offer preview/acceptance disabled; military recovery disabled.
- Game engine: displays currency instead of primary resource.

Remaining:
- Currency system + 6 fictional currencies + world motion to create new.
- Bank tab replacing Trade (UI + server endpoints).
- Upkeep charges for improvements/projects/wonders + military upkeep increase.
- Money income rebalance + population system tuning.
- Remove trade tab + resource UI everywhere (topbar, EconomyPanel, game.js).
- Migration for existing nations to pick currency.
- Tests.
1. Migration: Nation.currency + remove resources.
2. Population/tax rebalance.
3. Upkeep charges.
4. Currency system + Bank tab.
5. Remove trade + resources UI.
6. Tests.
