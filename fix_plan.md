# Fix Plan: Full System Logic, API, Frontend, and Integration Audit

## Scan Summary

This plan is based on a full repo scan of `Logic/`, `Components/`, `Database/`, `API/`, `Web/`, `tick_processor.py`, and the current `fix_plan.md`.

The project now has many more web endpoints than the previous plan recognized. The biggest remaining problem is not only "missing routes"; it is that several routes and components are thin database shims, placeholders, or simplified implementations that do not use the richer systems already coded under `Logic/`.

## Current Architecture Reality

- `API/empire_api.py` starts the FastAPI app, registers all components, mounts `Web/web_server.py`, and starts the GPP manager.
- `Web/web_server.py` is the real web surface and contains most `/api/web/...` routes.
- `API/*.py` REST routers exist, but the web frontend mostly talks to `/api/web/...`, not the typed REST routers.
- `Components/*` wrap parts of `Logic/*`, but many components persist simple records instead of calling full mechanics.
- `Database/schema.py` and `Database/empire_db.py` both define schema, but they are not identical. `empire_db.py` also performs ad hoc runtime migrations with `ALTER TABLE`.
- `Web/css/style.css` already has theme tokens for Dark, Light, Cyber Nations, Politics & War, NationStates, and additional custom themes.

## Target Architecture Update: Split Databases + GraphQL

The next architecture target is no longer one `Saves/empire.db` for every game table. Data should be split into domain database files so each system has clear ownership, simpler backups, cleaner migrations, and safer bot/API access.

### Domain Database Files

| Database file | Owned data |
|---|---|
| `Saves/users.db` | Web users, auth identities, sessions, API keys, bot tokens, permissions, bans, user-to-nation bindings. |
| `Saves/empires.db` | Nations/empires, cities, resources, improvements, wonders, projects, policies, government/religion, progression, scores. |
| `Saves/alliances.db` | Alliances, members, applications, roles, permissions, banks, bank resources, transactions, taxes, monuments, alliance votes. |
| `Saves/diplomacy.db` | Diplomatic relations, treaties, treaty votes, embassies, sanctions, aid, resolutions, global effects, world wars. |
| `Saves/wars.db` | Wars, war details, battle logs, peace offers, blockades, attack history, beige/anarchy consequences. |
| `Saves/trades.db` | Market listings/orders, trade history, trade circles, circle members, tech deals, resource transfers. |
| `Saves/events.db` | Random events, NationStates-style issues, choices, public activity feed, notifications. |
| `Saves/plugins.db` | Plugin data, integration settings, optional extension-owned state. |
| `Saves/metrics.db` | Tick state, audit logs, health snapshots, performance counters, API usage metrics. |

### Split DB Rules

- [ ] Add a `Database/database_router.py` or equivalent `EmpireDatabaseHub` that owns all domain DB managers.
- [ ] Replace direct `gpp_manager.db` assumptions with explicit managers such as `users_db`, `empires_db`, `alliances_db`, `diplomacy_db`, `wars_db`, `trades_db`, and `events_db`.
- [ ] Keep cross-domain writes in service/component transactions where possible; if SQLite cross-file atomicity is too fragile, write deterministic compensation/audit records.
- [ ] Give every domain DB its own schema version and migration file.
- [ ] Keep read models for GraphQL denormalized where needed, but make game truth live in the correct domain DB.
- [ ] Do not let page routes write directly to DB files; routes call components/services, services call domain repositories, repositories call domain DBs.
- [ ] Build backup/restore per DB file and a full-game snapshot command that captures all DB files at one tick boundary.

### Migration From Current Unified DB

- [ ] Freeze the current `Saves/empire.db` schema as legacy input.
- [ ] Create a one-time migration script that reads `empire.db` and writes to the new domain DBs.
- [ ] Add a verification report: source row counts, destination row counts, orphan checks, foreign key consistency by domain, and unresolved records.
- [ ] Keep `empire.db` read-only during migration and archive it after successful split.
- [ ] Update tests so new installs create split DBs directly and legacy installs migrate cleanly.

### GraphQL Query Layer for Bots and Users

The game should expose a Politics & War-style GraphQL API with a playground, but with cleaner query names, stable types, and explicit scopes. P&W's public API v3 is GraphQL-based and provides a playground for exploring schema/models and shaping queries: `https://api.politicsandwar.com/graphql-playground`.

Planned endpoints:

- `GET /graphql-playground` - interactive schema explorer for admins/developers.
- `POST /graphql` - public/authenticated GraphQL endpoint for users and bots.
- `GET /graphql/schema.graphql` - downloadable schema for bot developers.
- `GET /api/docs/graphql` - human documentation, examples, rate limits, and auth scopes.

GraphQL design rules:

- [ ] Queries are read-first and safe by default; mutations require user/bot scopes.
- [ ] External bots use API keys tied to a user, alliance, or bot app with scopes such as `nation:read`, `alliance:read`, `war:read`, `market:read`, `private:read`, `bank:write`.
- [ ] Public fields and private fields are separated clearly. Example: public nation score is available to all; private cash/resources require owner/alliance scope.
- [ ] Resolvers call the same components/services used by the web frontend, never separate SQL shortcuts that bypass game rules.
- [ ] Expensive nested queries get depth limits, complexity limits, pagination, and rate limits.
- [ ] Use stable object names: `Nation`, `City`, `Alliance`, `War`, `Battle`, `Treaty`, `SpyOperation`, `MarketListing`, `TradeCircle`, `Issue`, `Notification`.
- [ ] Support query filters similar to P&W but cleaner: `nations(filter: { allianceId, minScore, maxScore, color, tier }, page: ...)`.
- [ ] Expose event/subscription-ready design later for live war/activity notifications, even if initial implementation is query-only.

Example target GraphQL query:

```graphql
query NationIntel($id: ID!) {
  nation(id: $id) {
    id
    name
    ruler
    score
    tier
    alliance { id name acronym }
    cities { id name infrastructure land population }
    wars(status: ACTIVE) {
      id
      opponent { id name }
      warScore
      startedAt
    }
  }
}
```

## Source-of-Truth Rule for Logic

Every gameplay action must flow through the same stack:

1. Web page or external bot calls REST/GraphQL.
2. API resolver/route validates auth and request shape.
3. Component/service performs the game action.
4. Component/service calls `Logic/*.py` for rules, formulas, and mechanics.
5. Repository persists results to the correct domain DB.
6. Notifications/activity/read models update from the same result object.

No web route should reimplement costs, caps, war outcomes, spy chances, treaty effects, or tick behavior. When a Python logic file changes, REST, GraphQL, web pages, ticks, and bot queries should reflect that change automatically because they all call the same component/service layer.

## Preflight Bugs, Bottlenecks, and Guardrails Found in Scan

These must be handled before or during the split-DB/GraphQL implementation, otherwise the new architecture can introduce bugs or bottlenecks instead of fixing them.

### Current Bug Fixed

- [x] `Web/web_server.py` used top-level `from Logic...` imports, causing `import Empires.API.empire_api` to fail outside a lucky working directory. This was changed to package-relative `from ..Logic...` imports.

### Startup and Import Guardrails

- [ ] Keep a CI/preflight command that runs `python -m compileall -q .`.
- [ ] Keep an import smoke test from the parent folder: `python -c "import Empires.API.empire_api as e; print(e.app.title)"`.
- [ ] Add an app lifespan smoke test that initializes GPP, creates all split DBs, registers components, mounts web routes, then shuts down cleanly.
- [ ] Add a route registration snapshot so moving routes into services/routers does not silently drop pages or APIs.

### Database Bottlenecks to Fix

- [ ] `Core/database_pool.py` currently pools only `config.database_path`; split DBs require either one pool per DB file or a keyed pool map by domain DB path.
- [ ] `BaseDatabase.get_connection()` accepts a pool but does not verify the pool points at that instance's `database_path`; this will corrupt split-DB routing if reused unchanged.
- [ ] `BaseDatabase.fetchdict()` and `fetchalldict()` set `conn.row_factory` on pooled connections; reset row factory or use per-cursor row conversion so tuple callers are not affected by previous dict fetches.
- [ ] Direct connection-per-call mode is simple but can become slow under GraphQL nested queries; add batching/DataLoader-style resolver loading and repository methods that fetch collections in one query.
- [ ] Set SQLite pragmas per DB connection: `foreign_keys=ON`, `journal_mode=WAL`, `busy_timeout`, and sensible synchronous mode.
- [ ] Add domain-level write queues or direct transactional writes; do not keep one global write queue hardwired to one database file.
- [ ] Add indexes for all GraphQL filter/sort fields: nation score/tier/alliance/color, alliance score, active wars by participant/status, market listing status/resource, treaty parties/status, notifications by nation/read state.

### Split-DB Consistency Guardrails

- [ ] Do not migrate to split DBs by changing table paths in place. First add a database hub, then repositories, then services, then migrate route/component callers.
- [ ] Use service-level result objects for cross-domain actions. Example: `WarService.accept_peace()` returns war updates, treaty updates, transfer updates, notifications, and activity entries.
- [ ] Write idempotency keys for high-value actions: market purchase, bank withdrawal, peace acceptance, spy operation, war attack, aid transfer.
- [ ] Add audit records for every cross-domain action so partial failure can be detected and repaired.
- [ ] Add orphan checkers for references that cross DB files, because SQLite foreign keys will not protect cross-file relationships.
- [ ] Add startup validation that every configured DB file exists, is migrated, and has required tables/indexes.

### API/Auth Guardrails

- [ ] Replace `API/auth.py` placeholder bearer-token behavior before external bot APIs are considered usable.
- [ ] Store GraphQL/bot API keys in `users.db` with hashed secrets, scopes, owner user/alliance/bot app, last used time, and revocation state.
- [ ] Make REST and GraphQL auth share the same auth service.
- [ ] Separate human session cookies from bot API keys and admin tokens.
- [ ] Add scope checks to every GraphQL private field, not only top-level queries.

### Frontend Cohesion Guardrails

- [ ] Eliminate direct SQL from `Web/web_server.py`; every route should call a component/service method.
- [ ] Keep `/api/web/...` as the page-optimized API while GraphQL is the bot/external query API, but both must share read models or serializers where practical.
- [ ] Add an automated frontend route scanner and fail preflight when a page calls a missing endpoint.
- [ ] Do not leave duplicate market/trade UIs with different backend models. Pick one canonical market model, then retire or rewrite the other view.
- [ ] Add seeded end-to-end playthrough data and Playwright tests for a complete game loop.

## Confirmed Frontend API Mismatches

These frontend calls do not have matching backend routes in the current `/api/web` route inventory:

| Frontend call | Caller | Required fix |
|---|---|---|
| `POST /api/web/wars/{war_id}/peace` | `Web/js/peace_negotiations.js` | Add peace offer creation endpoint backed by `peace_offers` or treaty/war outcome data. |
| `GET /api/web/wars/{war_id}/peace-offers` | `Web/js/peace_negotiations.js` | Add per-war peace offer list endpoint. |
| `POST /api/web/wars/{war_id}/peace/{offer_id}/accept` | `Web/js/peace_negotiations.js` | Add accept endpoint that closes war, records outcome, applies terms. |
| `POST /api/web/wars/{war_id}/peace/{offer_id}/reject` | `Web/js/peace_negotiations.js` | Add reject endpoint. |
| `DELETE /api/web/wars/{war_id}/peace/{offer_id}` | `Web/js/peace_negotiations.js` | Add cancel/retract endpoint. |
| `POST /api/web/alliances/{alliance_id}/settings` | `Web/js/alliance_detail.js` | Add settings update endpoint with role/permission checks. |
| `POST /api/web/market/listings/{listing_id}/cancel` | `Web/Pages/trade.html` | Add listing cancel endpoint. |
| `DELETE /api/web/market/orders/{order_id}` | `Web/js/trade_market.js` | Either implement order cancellation or remove unused market order UI. |

Notes:

- `GET /api/web/treaties`, treaty propose/accept/reject/terminate, `GET /api/web/diplomatic-relations`, `GET /api/web/spy/history`, `POST /api/web/spy/operation`, notifications, alliance bank, and trade circles now exist. They should be treated as "needs real mechanic integration", not "missing".
- Some dynamic string concatenation calls were detected as route mismatches by static scanning, but corresponding routes do exist, such as `/api/web/nations/{nation_id}` and `/api/web/wars/{war_id}`.

## Schema and Persistence Mismatches

| Area | Current issue | Required fix |
|---|---|---|
| Unified schema | `Database/schema.py` and `Database/empire_db.py` duplicate schema definitions with different fields. | Replace the unified schema with domain schemas for users, empires, alliances, diplomacy, wars, trades, events, plugins, and metrics. |
| Config paths | `EmpireConfig` currently exposes `database_path` and optional `game_database_path`, which is not enough for domain DBs. | Add explicit paths or a domain DB map for users/empires/alliances/diplomacy/wars/trades/events/plugins/metrics. |
| Pool routing | `EmpireDatabasePoolManager` currently opens only `config.database_path`. | Replace with keyed pools or per-domain pool managers before wiring domain DB classes. |
| Component wiring | `API/empire_api.py` registers components with `db_manager=gpp_manager.db`. | Register components with repositories or a domain DB hub instead of a single `EmpireDB`. |
| Web direct SQL | `Web/web_server.py` reads/writes many game tables via `self.gpp.db`. | Move those operations behind services/components before split DBs so routes do not need to know DB ownership. |
| Nation fields | Rich `nations` fields exist in `schema.py`, while `empire_db.py` creates a smaller table then patches columns later. | Normalize create schema to the full expected table. |
| Trade circles | Web server inserts `resource_type` and `creator_id`; base schema omits them until runtime alter. | Add columns to canonical schema and migration. |
| Alliances | Web bank uses `alliances.treasury`; base schema omits it until runtime alter. | Add treasury and bank settings to canonical schema. |
| Market | `market_listings`, `notifications`, and `alliance_transactions` exist in `empire_db.py`, not `Database/schema.py` table list. | Add them to canonical schema and migration inventory. |
| War peace | Frontend expects peace offers, but there is no peace offer persistence table. | Add `peace_offers` and `peace_offer_terms`. |
| War battles | Attack endpoint returns a minimal result and does not persist battle history. | Add `war_battles` or `battle_logs`. |
| Spy | `spy_operations` stores only operation type/result/timestamps. | Add status, cost, spies committed, success chance, target result payload, completion tick, detection result. |
| Projects/wonders/improvements | Tables exist, but no complete cost/effect/progress state. | Add ownership, level/progress/cost paid/effect snapshot fields as needed. |
| Assembly/world systems | `Logic/diplomacy.py` has resolutions/world war/global effects, but no persistence. | Add tables for resolutions, votes, global effects, world wars, coalitions, theaters. |
| Auth/user binding | `AuthDatabase` and game DB are already conceptually separate, but reset/admin code still assumes some user tables may exist in game DB. | Make user/nation binding explicit across `users.db` and `empires.db`, and never delete user tables from game DB reset paths. |

## Coded Mechanics Not Correctly Used

### Government, Religion, and Policies

- `Logic/govrel.py` and `Logic/policies.py` include rich government, religion, synergy, domestic policy, and war policy mechanics.
- Nation creation stores government, religion, domestic policy, and war policy.
- `/api/web/game-data` exposes governments, war policies, religions, and resources.
- Missing: post-creation UI to change government/religion/policies, cooldown display, policy effect previews on the main empire page, and full tick application of modifiers.
- `GovRelComponent` has change methods, but no `/api/web/nation/government`, `/api/web/nation/religion`, or `/api/web/nation/policies` routes call them.

### Diplomacy and Treaties

- `Logic/diplomacy.py` includes diplomatic relations, actions, casus belli, embassies, treaties, sanctions, alliance congress, assembly resolutions, global effects, and world wars.
- Current web treaty endpoints mostly insert/update DB rows directly and do not call `DiplomacySystem.propose_treaty`, transfer terms, violations, relation changes, or treaty expiry logic.
- `DiplomacyComponent` exposes relation/treaty/sanction helpers, but `Web/web_server.py` often bypasses it.
- Missing: embassies, sanctions UI/API, treaty effects, treaty violations, relation score changes, casus belli, global assembly, alliance congress, and world war UI/API.

### War and Combat

- `Logic/war.py` contains ground, air, naval, missile, nuclear, spy operation, success levels, advantage/buff, blockade, war score, and outcome mechanics.
- `Components/military_war_component.py::process_war_attack` is explicitly a placeholder. It only increments `attacks_used_this_tick` and returns unchanged score.
- `/api/web/wars/{war_id}/attack` calls the placeholder.
- Missing: attack option validation, battle calculations, unit losses, infra/land/resource damage, air/naval/blockade state, missile/nuke strikes, battle logs, victory/expiration outcomes, beige/anarchy consequences, and commander death/experience integration.

### Spy Mechanics

- `Logic/spy.py` has a richer spy system than the current web flow.
- `/api/web/spy/operation` records a random success/failure immediately using simple math and updates spy count.
- Missing: spy mission definitions from `Logic/spy.py`, operation duration, active operations, counter-intelligence, detection, spy casualties, intel result payloads, mission-specific effects, training/recruitment beyond buying `spies` as a military unit.

### Military and Commanders

- `Logic/military.py` defines granular units, commander types, leveling, experience, attack bonuses, commander death checks, score, defense, ground/naval formulas.
- `/api/web/military/buy` implements costs and caps in web-server code, not through `MilitarySystem`.
- Missing: commander recruitment UI/API, commander assignment, XP from battles, commander death, military efficiency modifiers from gov/religion/policies/projects, and consistent caps derived from cities/improvements/projects.

### Trade, Market, and Trade Circles

- `Logic/trade.py` includes trade circles and tech deals.
- `/api/web/trade/circles` exists, but it is a simple DB implementation with incomplete circle rules.
- `trade_market.js` expects market prices/history/orders and order cancellation, while `Web/Pages/market.html` uses listing create/buy directly.
- Missing: one canonical market model, buy/sell order book or listings model decision, order cancellation, market history, resource transfer validation, trade circle caps, circle bonuses, tech deals, bilateral aid, blockades/sanctions affecting trade.

### Economy, Resources, Improvements, Wonders, Projects

- `Logic/resources.py`, `Logic/improvements.py`, `Logic/projects.py`, and `Logic/wonders.py` contain significant mechanics.
- `EconomyComponent` can create records for improvements, wonders, and projects, but there are no complete web routes or pages for listing/building/destroying/upgrading them.
- `Web/web_server.py` imports formula/resource helpers but city infra/land and market flows remain mostly route-local logic.
- Missing: improvement build/destroy UI/API, wonder build UI/API, project build/progress UI/API, cost checks, slot checks, resource consumption, effect application, and upkeep.

### Events and NationStates-Style Choices

- `Logic/events.py` contains many random and choice events.
- `TickComponent.process_random_events` is a placeholder.
- `tick_processor.py` has a more concrete event roll path, but the app uses the registered `TickComponent`.
- `/api/web/events` and `/api/web/user/events` list DB records, but events are not being generated/applied in the active tick component.
- Missing: active issue/event queue, player choices, expiry, choice consequences, event notifications, and public activity feed generation.

### Progression and Score

- `Logic/progression.py` has tier logic.
- `ProgressionComponent` exists, and `TickComponent.update_all_progression` uses a simplified cash/1000 tier approximation instead of `ProgressionSystem.determine_tier_progression`.
- Dashboard has its own score-to-tier display logic that may not match `Logic/progression.py`.
- Missing: one canonical score/tier calculation, visible tier progress, tier requirements, tier bonuses, and ranking filters by tier.

### Alliances, Roles, Bank, Monuments, and Politics

- `Logic/alliances.py` contains roles, permissions, custom roles, bank, treaties, alliance wars, votes, taxes, monuments, applications, and color trade bloc bonuses.
- Web routes support alliances, members, bank deposit/withdraw, promote/demote/kick, and create/join/leave.
- Current routes do not enforce the rich `AlliancePermission` model and mostly infer role from strings.
- Missing: applications, role management, permission enforcement, tax collection, bank resources, withdrawal limits, audit logs, monuments, alliance votes, alliance wars, color bloc mechanics, alliance treaty powers.

## Frontend/Layout Mismatches

- The app mixes shared CSS, inline styles in HTML pages, and JS-injected `<style>` blocks.
- Many pages use Bootstrap defaults (`table-dark`, `btn-outline-light`, `card`-like panels) instead of the richer theme system.
- Navigation/sidebar is server-injected, but pages duplicate content structure and UI patterns.
- There are overlapping surfaces: dashboard nation creation, empire control, nation profile/detail, market/trade pages, separate JS modules and inline scripts.
- The theme tokens already reference Cyber Nations, Politics & War, and NationStates, but the actual interaction model does not consistently feel like those games.
- Several pages use emoji as primary icons instead of a consistent icon system.
- The frontend needs a canonical page shell, panel/table/form primitives, and shared JS render helpers.

## Priority Fix Phases

### Phase 0 - Stabilize Inventory and Data Contracts

- [ ] Keep current app import and compile checks passing before architecture work begins.
- [ ] Generate a checked-in route inventory for `/api/web`, REST routers, and frontend calls.
- [ ] Define canonical JSON response shapes for nation, city, military, resources, alliance, war, treaty, spy operation, market listing/order, notification, event.
- [ ] Define GraphQL schema names, query filters, pagination style, auth scopes, and public/private field boundaries.
- [ ] Remove stale assumptions from existing docs and keep this plan current as routes change.
- [ ] Decide whether `/api/web/...` remains the page API, while GraphQL becomes the clean bot/public query API.

### Phase 1 - Service and Repository Extraction Before DB Split

- [ ] Create service classes for nation/city, economy, military/war, diplomacy/spy, alliance, trade/market, events/notifications, and auth/API keys.
- [ ] Move all direct SQL in `Web/web_server.py` into these services while still using the current unified DB.
- [ ] Make existing REST routers and `/api/web` routes call the same services.
- [ ] Add tests against the unified DB to lock current behavior before moving tables.
- [ ] Add typed result objects/serializers used by REST, GraphQL, and pages.

### Phase 2 - Split Databases, Schema, and Migration Cleanup

- [ ] Create domain DB managers for `users.db`, `empires.db`, `alliances.db`, `diplomacy.db`, `wars.db`, `trades.db`, `events.db`, `plugins.db`, and `metrics.db`.
- [ ] Add domain DB paths to `EmpireConfig` and environment variables.
- [ ] Replace the single-path database pool with keyed domain pools.
- [ ] Replace direct `EmpireDB` usage with a database hub/router and domain repositories.
- [ ] Move all runtime `ALTER TABLE` startup patches into idempotent per-domain migration functions.
- [ ] Add missing canonical tables: `peace_offers`, `war_battles`, `market_orders` or remove order UI, `resolutions`, `resolution_votes`, `global_effects`, `embassies`, `alliance_votes`, `alliance_bank_resources`.
- [ ] Add columns needed by existing web code: alliance treasury/settings, trade circle resource/creator/status, spy operation status/result payload, war battle stats.
- [ ] Build a legacy `empire.db` splitter and verification report.
- [ ] Add migration tests and a startup schema validation route for development.

### Phase 3 - GraphQL API and Data Access

- [ ] Add GraphQL dependencies and mount `POST /graphql`, `GET /graphql-playground`, and `GET /graphql/schema.graphql`.
- [ ] Build resolvers over the component/service layer, not raw SQL.
- [ ] Add API key creation/management for users and bots with scopes and rate limits.
- [ ] Add query complexity/depth limits, pagination, resolver batching, and N+1 query protection.
- [ ] Document example bot queries for nations, alliances, wars, treaties, markets, trade circles, and activity.

### Phase 4 - Replace Placeholder Mechanics With Logic Integration

- [ ] Rebuild `MilitaryWarComponent.process_war_attack` around `Logic/war.py`.
- [ ] Route all spy operations through `Logic/spy.py` or one canonical spy service.
- [ ] Route treaties/sanctions/relations through `DiplomacyComponent` and `Logic/diplomacy.py`.
- [ ] Route government/religion/policy changes through `GovRelComponent`.
- [ ] Route improvements/wonders/projects through `EconomyComponent` plus `Logic/*`.
- [ ] Replace route-local city, market, and military formulas with canonical formula/service calls.

### Phase 5 - Fix Confirmed Broken Frontend Calls

- [ ] Implement war peace offer endpoints used by `peace_negotiations.js`.
- [ ] Implement alliance settings endpoint used by `alliance_detail.js`.
- [ ] Implement market listing cancel and/or market order cancel endpoints.
- [ ] Verify `trade_market.js` and `market.html` are not competing implementations; keep one canonical UX or wire both to the same backend contract.
- [ ] Add smoke tests for every frontend API call.

### Phase 6 - Complete Core Gameplay Loops

- [ ] Nation loop: collect taxes, pay bills/upkeep, produce resources, apply gov/religion/policy modifiers, apply project/wonder/improvement bonuses.
- [ ] City loop: infra, land, population, pollution, crime, disease, power, commerce, improvement slots.
- [ ] Military loop: buy/sell units, enforce caps, deploy attacks, consume munitions/fuel, update commander XP.
- [ ] War loop: declare, fight, log battles, peace/surrender/expiry, beige/anarchy, blockades, sanctions, alliance war interactions.
- [ ] Diplomacy loop: relations, treaties, embassies, sanctions, aid, votes, assembly/global effects.
- [ ] Spy loop: recruit/train/assign spies, active missions, counter-spy, intel, sabotage, assassination, theft, casualties.
- [ ] Trade loop: market listings/orders, trade circles, tech deals, aid, blockades/sanctions.
- [ ] Event loop: NationStates-style issues, random events, choices, public activity, notifications.

### Phase 7 - Frontend Completion

- [ ] Create shared page primitives: page header, action bar, stat strip, data table, management panel, modal, tab set, empty/loading/error states.
- [ ] Replace page-specific inline styles with shared classes.
- [ ] Make every page action call a component-backed API route and every read call use the same canonical response/read model as GraphQL where practical.
- [ ] Build missing pages/sections: government/religion/policies, improvements, projects, wonders, commanders, embassies, sanctions, resolutions, peace offers, event choices.
- [ ] Upgrade war detail page with attack choices, available units, battle log, war score, resistance, blockades, peace actions.
- [ ] Upgrade diplomacy page with relation graph/table, treaties, proposals, embassies, sanctions, alliance/world politics.
- [ ] Upgrade spy page with active missions, history, recruitment/training, mission risk, target intel.
- [ ] Upgrade alliance pages with role permissions, applications, votes, bank ledger, resources, monuments, wars.
- [ ] Verify cohesive playability: a new user can register, found a nation, manage cities/economy, join/create alliances, trade, spy, declare/fight/end wars, handle diplomacy, and see all results persist.

### Phase 8 - Testing and Verification

- [ ] Add backend tests for each component service.
- [ ] Add API route tests for each frontend call.
- [ ] Add GraphQL resolver tests, introspection tests, scope tests, rate-limit tests, and bot query examples.
- [ ] Add migration tests against empty split DBs and a legacy unified DB.
- [ ] Add Playwright smoke tests for dashboard, nation creation, cities, military, wars, diplomacy, spy, trade, alliances, settings/theme switching.
- [ ] Add seeded demo data for manual visual QA.
- [ ] Add performance tests for GraphQL nested nation/alliance/war/market queries and tick processing.

## Quick Wins

1. Implement the missing peace offer routes and table.
2. Replace `process_war_attack` placeholder with at least one real ground attack path from `Logic/war.py`.
3. Add alliance settings route with role checks.
4. Add market listing cancel route and either wire or remove `market_orders` UI.
5. Add government/religion/policy management endpoints using `GovRelComponent`.
6. Make `TickComponent.process_random_events` create real events and notifications.
7. Create a static route/call scan script so mismatches stay visible.
8. Scaffold the split DB hub and move auth/users into `users.db` first.
9. Scaffold read-only GraphQL queries for `nation`, `nations`, `alliance`, `alliances`, `war`, `wars`, and `marketListings`.
10. Replace `API/auth.py` placeholder token verification before exposing any bot/public GraphQL endpoint.
11. Fix database pool routing before any component is pointed at split DB files.

## Do Not Forget

- Keep user-created data safe during migrations.
- Avoid writing more route-local game rules in `Web/web_server.py`; use components/services.
- Every new mechanic needs DB persistence, API contract, frontend state, notifications/activity, and tick behavior where relevant.
- REST, GraphQL, web pages, ticks, and bots must share component/service logic so Python mechanic updates reflect everywhere.
- Treat the three inspiration games as design references, not as exact copies.
