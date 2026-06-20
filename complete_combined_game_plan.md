# Complete Combined Game Plan: Cyber Nations + Politics & War + NationStates

## Goal

Build Empires into a complete browser nation simulator that combines:

- Cyber Nations: nation math, infrastructure/land/tech/resources, treaties, war ranges, aid, alliance politics.
- Politics & War: modern dashboards, resource economy, cities, projects, alliance banks, markets, war actions.
- NationStates: political identity, issues, laws, public world flavor, resolutions, roleplay, national traits.

The final game should feel like a serious geopolitical management tool: dense, readable, political, numeric, and alive.

## Data and API Architecture

Empires should use a Politics & War-style GraphQL query system for users and external bots, while keeping the game rules cleaner and more maintainable than a route-by-route SQL API. P&W's public API v3 is GraphQL-based and has a playground for exploring schema/models and shaping requests. Our version should provide the same kind of bot-friendly power, but with clearer names, stricter scopes, and resolvers that always call our Python component logic.

### Domain Database Files

- `Saves/users.db`: users, sessions, auth providers, user permissions, bans, API keys, bot apps, user-to-nation bindings.
- `Saves/empires.db`: nations, cities, resources, improvements, wonders, projects, government, religion, policies, progression, score.
- `Saves/alliances.db`: alliances, members, roles, permissions, applications, banks, bank resources, taxes, monuments, votes.
- `Saves/diplomacy.db`: relations, treaties, embassies, sanctions, aid, resolutions, global effects, world wars.
- `Saves/wars.db`: wars, war details, battle logs, peace offers, attack history, blockades, beige/anarchy state.
- `Saves/trades.db`: market listings/orders, market history, trade circles, tech deals, transfers.
- `Saves/events.db`: random events, issues, choices, public activity, notifications.
- `Saves/plugins.db`: plugin and integration state.
- `Saves/metrics.db`: ticks, audits, health snapshots, API usage, performance counters.

### Database Ownership Rules

- Each component owns one or more domain repositories and does not reach into unrelated DBs directly.
- Cross-domain actions happen in services/components: for example, accepting peace updates `wars.db`, may create treaty rows in `diplomacy.db`, may transfer resources in `trades.db`, and always writes notifications/activity in `events.db`.
- Read models can combine domains for pages and GraphQL, but the source of truth stays in its domain DB.
- Every domain DB gets its own schema version, migration file, backup path, and validation checks.
- Split DBs must not be wired directly into existing route SQL. First extract services/repositories while still on the current DB, then move repositories to domain DB files.
- The database pool must route by DB path/domain. A single shared SQLite pool cannot safely serve multiple DB files.
- Cross-domain relationships need validation/audit checks because SQLite foreign keys cannot protect references across separate DB files.

### GraphQL API Plan

- `POST /graphql`: main query endpoint for users and bots.
- `GET /graphql-playground`: interactive playground for admins/developers.
- `GET /graphql/schema.graphql`: downloadable schema for bot developers.
- `GET /api/docs/graphql`: examples, auth scopes, rate limits, and usage rules.

Core query groups:

- `nation`, `nations`, `city`, `cities`, `resources`, `projects`, `wonders`.
- `alliance`, `alliances`, `allianceMembers`, `allianceBank`, `allianceVotes`.
- `war`, `wars`, `battleLogs`, `peaceOffers`.
- `treaty`, `treaties`, `relations`, `embassies`, `sanctions`, `resolutions`.
- `marketListings`, `marketOrders`, `marketHistory`, `tradeCircles`, `techDeals`.
- `events`, `issues`, `notifications`, `activityFeed`.

Bot/API rules:

- API keys belong to a user, alliance, or approved bot app.
- Scopes control data access: `nation:read`, `nation:private`, `alliance:read`, `alliance:bank`, `war:read`, `market:read`, `diplomacy:read`, `notifications:read`, `admin:read`, and write scopes only where intentionally supported.
- Public data remains queryable; private cash, stockpiles, spy data, bank data, notifications, and admin data require scopes.
- Add depth limits, query complexity limits, pagination, caching for public leaderboards, and rate limits.
- Resolvers call the same components/services as the webpages. They do not duplicate formulas or read random tables directly.
- Resolvers must batch nested data loading to avoid N+1 query bottlenecks when bots request large nation/alliance/war datasets.
- REST auth, web sessions, and GraphQL API keys must share one auth service while keeping cookie sessions and bot keys separate.

Example target query:

```graphql
query AllianceDashboard($id: ID!) {
  alliance(id: $id) {
    id
    name
    score
    members(page: { limit: 25 }) {
      id
      name
      score
      tier
      wars(status: ACTIVE) { id opponent { id name } }
    }
    treaties(status: ACTIVE) { id type partnerName expiresAt }
  }
}
```

## Layout and Theme Plan

### Visual Direction

- Use a restrained government-console layout: sidebar, top bar, data-dense panels, sortable tables, ledgers, action drawers.
- Keep the existing themes, but make the default experience a deliberate blend:
  - Cyber Nations: white/navy/gold classic mode, treaty tables, nation stat tables.
  - Politics & War: dark strategic control room, resource bars, city/military panels.
  - NationStates: civic issue cards, dispatch/resolution pages, flags/mottos/classification.
- Reduce pure Bootstrap feel by replacing default `card`, `table-dark`, and button styling with game-specific primitives.
- Replace emoji-first UI with a consistent icon system, while keeping flags/resource images where useful.

### Shared UI Primitives

- Page header with nation/alliance context, score, tier, alert badges, and primary action.
- Stat strip for cash, score, infra, land, tech, population, happiness, environment.
- Resource rail showing stockpile, production, consumption, and market price.
- Action panel pattern for irreversible actions: declare war, launch spy op, accept treaty, build wonder.
- Dense sortable tables for nations, alliances, wars, markets, treaties, transactions.
- Detail drawer/modals for previewing costs, effects, cooldowns, risk, and requirements.
- Empty/loading/error states standardized across every page.
- Activity feed component for wars, treaties, spy results, market sales, alliance events, global resolutions.

### Page Layout Updates

- Dashboard: make it a command center with immediate resource/alert/action visibility.
- Empire: canonical nation management hub with tabs for overview, government, economy, military, diplomacy, issues.
- Cities: city ledger plus selected-city management panel; add improvements, power, commerce, pollution, disease/crime.
- Military: force readiness, caps, upkeep, commanders, purchase queues, war availability.
- War detail: war score, resistance, maps/logs, available attacks, unit readiness, peace/surrender actions.
- Diplomacy: treaties, relations, embassies, sanctions, aid, proposals, world assembly.
- Spy: active operations, spy network, target dossier, mission risk, counter-intelligence.
- Trade/Market: one canonical market page with listings/orders/history/trade circles/tech deals.
- Alliances: government, members, roles, permissions, bank, treaties, wars, monuments, applications, votes.
- Activity: public newspaper-style feed with filters for war, diplomacy, economy, politics.
- Rankings: CN-style and P&W-style tables with tier, score, alliance, color bloc, war status filters.
- World map: keep as flavor/intel layer, but make it reflect actual alliances, wars, trade circles, blockades.

### Cohesive Playability Requirements

- A user can register, create a nation, and immediately see the same nation state across Dashboard, Empire, Cities, Military, Diplomacy, Trade, Map, Rankings, and GraphQL.
- Every page action must have a working backend endpoint and a visible result: state update, notification, activity entry, row/table refresh, and persisted DB record.
- Every management page must show prerequisites, costs, effects, cooldowns, success/failure state, and a confirmation for destructive/high-risk actions.
- No page should display fake, mock, or placeholder data unless it is explicitly marked developer demo data.
- Web pages should consume component-backed APIs/read models. GraphQL should expose the same read models to bots so users, pages, and bots agree.
- When a `Logic/*.py` mechanic changes, pages, REST APIs, GraphQL queries, ticks, and notifications should all reflect the change through the shared component/service layer.
- The implementation must keep these preflight checks passing: Python compile, package import, route/call scan, schema validation, and one seeded full-playthrough browser test.

## Missing Mechanics Needed for a Complete Hybrid

### Nation Identity

- Flag upload/selection or generated flag.
- Motto, factbook, dispatches, national animal/currency/capital, national classification.
- Government, religion, domestic policy, war policy, economic policy, social policy.
- National color/team/bloc with trade and diplomacy effects.
- Population demographics and citizen approval.

### Economy

- Tax income based on population, income, happiness, government, policies, events, improvements.
- Bills/upkeep for infra, land, military, projects, wonders.
- Resource production and consumption by city, improvement, project, military, and trade.
- Power system for cities.
- Commerce/revenue system.
- Pollution, disease, crime, environment, and happiness interaction.
- Inflation/market history if using order book.

### Cities

- Buy/sell infrastructure and land through canonical formulas.
- Improvement slots based on infra/land/projects.
- Power plants, commerce, military, resource, civil, and pollution-control improvements.
- City-specific population, disease, crime, pollution, environment.
- Damage and rebuilding after war.

### Military

- Unit caps from cities/improvements/projects.
- Soldier, tank, aircraft, ship, missile, nuke, spy unit pipelines.
- Readiness, daily/tick purchase limits, upkeep, munitions/fuel consumption.
- Commanders with types, assignment, XP, level bonuses, and death risk.
- Defense status and deterrence.

### War

- War declaration rules: score range, slots, cooldowns, beige/anarchy, alliance restrictions, casus belli.
- Ground, air, naval, missile, nuclear, and spy attacks.
- Attack points/maps/resistance/war score.
- Blockades, air superiority, naval superiority, fortify, loot, infrastructure destruction.
- Battle logs with casualties, damage, loot, result levels.
- Peace offers, surrender, expiration, victory outcomes, reparations.
- Alliance wars and global wars.

### Diplomacy

- Relations: neutral, friendly, hostile, embargoed, allied, protectorate/vassal/federation.
- Treaties: NAP, MDP, MDoAP, trade agreement, research agreement, military access, protectorate, federation.
- Treaty proposals, votes, expiry, cancellation, violations, automatic effects.
- Embassies with levels and bonuses.
- Sanctions and embargoes affecting market, trade, income, approval, and spy risk.
- Foreign aid: money, resources, technology, military aid, land transfers if allowed.
- Diplomatic notes and public statements.

### Espionage

- Spy recruitment/training.
- Active missions with duration and risk.
- Intel, sabotage, assassinate commander, steal resources/cash/tech, foment unrest, sabotage missiles/nukes, counter-intel.
- Detection, attribution, casualties, retaliation/casus belli.
- Spy defense from government, religion, policies, projects, wonders, embassies, sanctions.

### Trade and Market

- Decide canonical model: instant listings or buy/sell order book.
- Resource transfer validation and escrow.
- Market history and average prices.
- Trade circles with resource combinations, membership limits, bonuses, status.
- Tech deals and aid deals.
- Blockade/sanction restrictions.
- Alliance internal market/bank transfers.

### Alliances

- Applications, invitations, member roles, custom roles, permissions.
- Alliance bank with cash and resources, withdrawal limits, audit logs, taxes.
- Alliance treaties, wars, votes, announcements, tax rates.
- Alliance monuments and shared projects.
- Color bloc/trade bloc mechanics.
- Government positions: leader, heir, officer, banker, diplomat, military command.

### Politics and NationStates-Style Systems

- Issues/events with timed choices and visible national consequences.
- Laws/policy sliders shaped by issue choices.
- Civil rights, economy, political freedom, safety, environment, education, health ratings.
- World assembly/global resolutions with votes and effects.
- Regional/world forums or dispatch-like announcements.
- National rankings by policy traits, not only score.

### Progression

- Tier system with requirements, bonuses, and matchmaking implications.
- City count unlocks, project slots, wonder slots, military unlocks.
- New-player protection/tutorial goals.
- Achievements and milestones.

### Notifications and Activity

- Notification types for battles, treaties, spy results, market transactions, alliance bank, votes, events, issues.
- Public activity feed with importance levels.
- Per-nation private inbox.
- Alliance announcements and audit logs.

## Implementation Roadmap

### Phase A - Foundation

- Fix current startup/import/preflight issues and add automated checks.
- Extract services/repositories from route-local SQL while still using the existing unified DB.
- Establish split domain DBs, domain schemas, migrations, and the database hub.
- Establish canonical API contracts.
- Establish GraphQL schema, playground, scopes, rate limits, and bot API key management.
- Create shared frontend shell and component primitives.
- Build seeded demo data for QA.

### Phase B - Core Nation Loop

- Implement full tick economy.
- Wire government/religion/policies to income, happiness, military, spy, and events.
- Build government/policy UI.
- Build city improvements, projects, and wonders.

### Phase C - War, Spy, and Diplomacy

- Replace placeholder war attacks with real logic.
- Add battle logs and peace offers.
- Wire spy operations to real mission system.
- Add embassies, sanctions, aid, treaty effects, and relation changes.

### Phase D - Trade and Alliances

- Choose one market model and finish it.
- Complete trade circles and tech deals.
- Complete alliance roles, permissions, bank resources, monuments, applications, votes, and alliance treaties.

### Phase E - NationStates Layer

- Implement issue/event choices.
- Add national identity pages.
- Add world assembly, resolutions, global effects, and public political rankings.

### Phase F - Polish and Scale

- Full visual pass across all pages and themes.
- Playwright visual smoke tests for desktop/mobile.
- GraphQL performance tests for nested bot queries and public leaderboard queries.
- Balance pass for formulas, costs, cooldowns, war damage, and resource production.
- Admin tools for seeding, moderation, user/nation repair, and forced ticks.
- Bot/developer docs with example GraphQL queries and scope setup.

## Acceptance Criteria

- Every visible button has a working backend contract.
- Every coded `Logic/*` mechanic is either exposed, scheduled for exposure, or explicitly removed.
- Every active frontend call has a matching route and tested response shape.
- Every GraphQL resolver uses component/service logic and respects scopes.
- Every domain DB can migrate, validate, backup, and restore independently.
- Every split-DB cross-domain action has auditability and can be repaired or safely retried.
- Every tick-relevant mechanic is applied by the active `TickComponent`.
- Every major action creates notification/activity records.
- The default UI feels like a geopolitical browser strategy game, not a generic Bootstrap admin panel.
