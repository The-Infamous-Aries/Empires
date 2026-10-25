# Live UI accuracy and player guide

The live browser uses the persistent World as the authority. Construction,
research, units, relationships and treaties already consume server quotes.
`POST /api/quote` now previews development, government/religion choices, war
declarations/operations, recurring trade and forum proposals. Authentication,
origin checks, request limits and the normal hourly catch-up apply to this route.

Previews share validation with the action handlers. They do not spend, reserve,
change relationships, create records, advance a nation's RNG or write a save.
Development simulates up to 100 sequential purchases on an isolated rules
instance, refreshing modifiers between purchases, and reports the whole price
even when the player cannot afford it. Accepted actions still recheck current
rules; a quote is not a reservation. Preview calculations do not pause the world.

The browser debounces requests, caches them for the current world revision and
form values, and rejects stale responses. Closed action panels wait until opened
before requesting a preview. Numeric and required-field validity is checked too.
Form identity uses the HTML id attribute explicitly: a hidden input named `id`
otherwise shadows the form property and breaks draft restoration and targeting.

## Corrected presentation

- Budget includes research and tax income; it identifies other treasury
  transactions as separate from the projected balance. Owned, shared and
  effective technology appear separately.
- National scores, pollution points, percentages and military multipliers have
  explicit units. Military displays current effective upkeep, building combat
  effectiveness, quantity workforce/happiness effects and paid-basis refunds.
- Government/religion effect lists show only effects consumed by the live
  rules, with bonuses and multiplier penalties converted to readable percentages.
  This corrects presentation without adding new gameplay effects.
- Resource-combination and manufacturing descriptions no longer promise unused
  construction-speed, diplomacy-efficiency or cooked-food energy effects.
- Market acceptance includes both parties' embargoes and the acceptor's tariff.
  Recurring agreement acceptance checks both parties and their current slots.
- World Congress tallies use the saved faction positions and seat weights;
  national-vote tallies remain labelled separately. Ballots validate selection
  counts, membership and deadlines. Proposal previews enforce current limits.
- Recipient privacy, alliance application membership, article limits and input
  bounds are reflected in their controls. Spy operations show intelligence
  reports, rather than zero infrastructure damage.

## Help

The Help tab provides searchable, keyboard-accessible topics for all 13 gameplay
pages, contextual links and live tips for upkeep deficits, budget deficits,
research space, unplaced land and pending treaty calls. It explains the hourly
clock, offline catch-up, construction, research, diplomacy, trade, forums,
permissions, news, messages and sports without formulas. Numerical costs,
durations and limits remain available on the gameplay screens.

Content describes implemented behavior. It does not claim the legacy systems
listed in `LIVE_GAME_AUDIT.md` are implemented. `tests/ui-alignment.test.js`
checks preview purity and agreement with actions; presentation and HTTP tests
cover quantity effects and authenticated quote boundaries. Browser verification
uses a separate synthetic world to avoid altering the normal preview save.
