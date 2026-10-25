# Live game audit and implementation status

This records the current implementation and its practical limits. **The whole-game completion request is still open.** Passing the checks below does not establish that every legacy mechanic is implemented or that the game is balanced for production.

## Authoritative execution

The original entry point referenced absent scripts, used independent browser timers, and exposed competing treasury/inventory state. The live entry point now runs through `server.js`, `server/world.js`, and the existing rule catalogs loaded by `server/rules.js`. Browser requests select actions; the server owns identities, prices, eligibility, inventory, schedules, and persistence. Live updates use Server-Sent Events.

There is no pause action. Fixed hourly turns and dated events run without browsers and replay after downtime. A failed transaction restores its prior state. Transient tick/save failures retry automatically. One writer per save is enforced at the executable entry point.

## Menu coverage

| Page | Implemented and exercised | Remaining limits |
| --- | --- | --- |
| Nation | Readable nation sheet, government/religion, resource/economic statistics, development, policies and player skills | Some thematic government/religion bonuses lack active consumers; advanced disease/event flows remain below |
| Build | Improvements/Projects/Wonders; every catalog entry resolves and can build; costs, requirements, ownership/max counts, slots, cooldowns, permanent flags, dependents and demolition | Construction and integration tests cover effects, prerequisites, removal and capacity; see SYSTEMS_COHESION.md |
| Military | Canonical inventories/treasury, quantity/resource/technology/capacity checks, upkeep, deficits, automatic production, sales, reports, wars, rounds, casualties and salvage | Multi-nation sides and treaty obligations are integrated; advanced intelligence operations beyond reports remain separate |
| Research | Complete catalog, prerequisites, paid queues, cancellation, timed completion, persistence, multiple wonder slots, explicit mappings for every research effect | Advanced effect mappings introduce bounded balance rules; see SYSTEMS_COHESION.md |
| Diplomacy | Relationships, treaties, agreed compensation fields, proposal expiry, timed non-cancellable peace, aid slots and delayed returns | Nation-level compensation, war calls and revocable intelligence sharing are integrated; alliance-level treaties remain separate |
| Trade | Escrow market, full fills, cancellation returns, embargo checks, manufacturing toggles/batches, resource combinations, port-limited recurring partners, Trade Hub permanent agreements | Market prices are player-entered; there is no automated exchange or order matching |
| Alliance | Founding gates, three government templates, role permissions, applications, roster changes, treasury, leadership transfer, recruitment and activity log | Custom governments, alliance skills/roster progression, alliance treaties and collective warfare remain incomplete |
| World | Project/wonder gated color/world forums, motions, votes, membership age, congress elections and weighted world stage | Some motion effects use bounded initial implementations; see below |
| News | Newspaper presentation, publishing, own-article edit/delete, comments and likes; escaped user content | Editorial moderation workflow is not implemented |
| Messages | World/alliance/private channels and privacy filtering | No delivery outside the game |
| Map | Persistent world grid, ownership and adjacency checks | The enhanced geographic renderer, resource overlays and battle-map interactions are not integrated |
| Team | Stadium-unlocked clubs, paid creation, rosters/lineups, facility upgrades, player release/signing, hourly finances/development/injuries, funded leagues/cups/championships, fixtures/results, project-gated winner bets | Coach replacement, player-to-player transfer negotiation and full seasonal career progression remain incomplete |
| Settings | Saved theme, notification and privacy preferences, logout | Legacy admin/reset tools are not exposed |

## Repaired defects

- Recalculating economic statistics or buying development no longer credits extra taxes.
- One money balance and one unit inventory are used for purchases, upkeep and automatic production.
- Fractional manufacturing output accumulates instead of rounding every hourly batch to zero.
- Demolition rebuilds effects from actual ownership, removes capabilities, and respects dependents.
- Building salvage uses the price paid, preventing subsidized construction/refund profit loops.
- Consumed, sold, disarmed and destroyed units lose their proportional monetary basis; later units cannot reclaim it.
- Combat skill percentages use the Player definition's fractions once; critical damage uses its flat value.
- Military Recovery and Salvage now affect round casualties. Recovery uses canonical resource acquisition costs instead of legacy estimates that could exceed actual inputs.
- Peace pacts cannot be cancelled before their agreed expiry; expiry works through restart catch-up.
- Ports reserve partner capacity, and recurring trades transfer both sides atomically. Missing supply delays the exchange without taking either side's resources. Trade Hub unlocks permanent agreements and unlimited market offers.
- Sports roster entries are IDs; repeated soccer positions have distinct slots. Nested Maps survive save/restore. Injury processing iterates the correct team shape, and facility capacity does not compound on each upgrade.
- The legacy base database had a premature class-closing brace. Its index query also treated a Set as an Array and retained stale index entries after updates/replacements. These are repaired and covered.

## Explicit decisions and compatibility changes

- Browser-only execution has been replaced by a persistent server. Legacy browser-save migration is not included.
- The fixed one-hour game-day clock follows the existing development checklist and the requested always-running world. Calendar motions cannot speed up, slow down, reset, or pause it.
- Park and SWAT effects follow their catalog descriptions where implementation disagreed.
- Great Library required a nonexistent Advanced University. Added that project with a University prerequisite, technology 600, $15M plus listed materials, and 10% research speed.
- Unit sales currently return 50% of attributable money paid, with no resource refund. Automatically produced units add no monetary basis. This is an initial rule because the original code did not define a sale rule; a user preference question remains open.
- Recurring trade proposals reserve a port partner slot, expire after seven real days if unanswered, and can run for 1–30 real days or permanently with the proposing nation's Trade Hub. Either participant can cancel future deliveries. Active dependencies prevent demolition of the required port/hub.
- Sports clubs cost $10M and receive the documented $10M club budget. Competition organizers fund the $10M prize; insufficient registration refunds it. Registration closes after three real days and play starts after seven. Fixtures run one hour apart; knockout rounds give byes to unpaired teams and advance the stronger team on a drawn score. These complete previously unfinished scheduling/payout paths and need balance review.
- Bets are one winner bet per fixture, capped at $1M, with the Sports Betting project required. Team owners cannot bet on their own fixtures. Winnings settle once at completion using the legacy odds formula.
- Color trade-network motions reduce tariffs; world infrastructure grants skip nations unable to fund their share; world technology sharing moves technology toward the configured threshold each turn. These approximations need review against intended rules.

## Unresolved whole-game work

1. **Research balance:** all catalog effects now map to live consumers. The previously undefined thematic effects use explicit bounded rules documented in `SYSTEMS_COHESION.md`; broader multiplayer balance testing remains outstanding.
2. **Disease outbreaks and random events:** the nation's calculated disease/pollution statistics work, but the separate outbreak/cure/evolution and data-driven national/economic/population event engines are not integrated into the live scheduler. Several of their effects also lack compatible live-state formulas.
3. **AI nations:** autonomous AI is not active in this runtime. The world currently contains registered player nations.
4. **Alliance and diplomacy depth:** custom structures, skills and capacity upgrades, and alliance-level treaties remain separate. Nation-level war calls, optional/mandatory participation, compensation and shared intelligence now work through the live server.
5. **Map and remaining sports depth:** restore the geographic/battle layers and complete career/coach/transfer systems against the persistent world model.
6. **Operational rollout:** no production deployment, load/soak test, legacy-save migration, or backup restoration drill has been completed. Always-on hosting is required for continuous execution.

## Verification scope

Automated checks exercise taxes, purchases, requirements, every construction catalog entry, effects removal, military constraints, upkeep, manufacturing, rollback, escrow, privacy, permissions, forum voting, research completion, aid, elections, elapsed-time replay, war rounds/casualties, permanent and expiring partner trades, sports persistence/competitions/bets, database indexes, writer exclusion, HTTP/SSE and browser-independent ticking/recovery.

Shared-browser checks exercise menu rendering and representative actions, escaped articles/comments, mobile Build layout, and Team/partner/treaty/intelligence workflows. They use synthetic fixtures, not production player data. These checks cover implemented paths; the unresolved systems above are not certified by them.

## UI completion

All 13 live menu pages have responsive layouts and controls for their implemented server actions. Nation has section navigation; construction and research have searchable, sortable catalogs; Military has quantity totals, sale quotes, upkeep and modifiers by source. Alliance management follows the current role and available positions. World Forum has searchable motions and gated participation. News supports previews, publishing, editing, discussion and deletion. Messages separate private conversations, and the atlas separates inspection from explicit claims with keyboard navigation, coordinates and zoom.

Form drafts and focused text survive live state updates and tab changes during the session. Successful composers clear, destructive actions require confirmation, and reconnecting disables server actions while retaining drafts. Display preferences (theme, text size, reduced motion) are stored in this browser; notification and privacy preferences are stored with the player. These UI additions do not implement the unresolved simulation systems listed above.

UI verification covers all pages at desktop and phone widths in both themes, representative live actions using an isolated synthetic world, leadership/member controls, research progress, escaped user content, map navigation and claims, draft/caret preservation, and WCAG 2 A/AA scans. Automated accessibility scans reported zero violations after the light menu contrast repair; some decorative glyph and flag contrast checks require visual inspection.

## Systems cohesion follow-up

Research, construction, technology, relationships, nation treaties and multi-nation combat now share authoritative live rules. See [SYSTEMS_COHESION.md](SYSTEMS_COHESION.md) for formulas, compatibility decisions, timing, effect mappings and remaining boundaries. The older scope notes above are historical where superseded by this section.
