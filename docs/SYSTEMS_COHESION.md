# Live research, construction and diplomacy rules

This document describes the persistent server's integration. Catalogs remain in `data/research/` and the building systems. The server validates actions; the browser consumes the same eligibility quotes. One real hour remains one game day. Opening a page does not collect income or advance research.

## Research and technology

All 150 research entries and 433 distinct effect keys have explicit mappings in `server/research-effects.json`. Startup checks for missing mappings, invalid times/costs, missing prerequisites and cycles. Completed IDs are the source of bonuses; cached effect totals are rebuilt instead of incremented repeatedly.

The former catalogs specified many thematic effects without units or consumers. Their new balance rules are deliberate additions, not claims that those formulas existed before:

- Existing direct tax, resource production, food, manufacturing and attack bonuses retain their percentage values. Population health adds points to the legacy base of 75 (maximum 100); disease resistance reduces disease proportionally. Critical damage adds flat damage on a critical hit.
- Other effects contribute one tenth of the catalog value to the explicitly named stat. Negative cost/mortality values become positive reduction contributions. Contributions for each stat are added, then use `limit × contribution / (limit + contribution)`; every further contribution matters, with diminishing returns.
- Limits are +200% for income, production, food, manufacturing, attack, defense, research speed and trade efficiency; +100% for growth and tax collection; 90% disease reduction; 80% crime reduction; 60% casualty reduction; 75% upkeep reduction; +50% morale; +20 happiness points. Direct bonuses add separately. Final health, happiness, disease and morale retain their physical bounds.
- Guild, interest and corporate income provide $5,000, $8,000 and $12,000 per game day. They appear separately from taxes and are collected exactly once per turn.
- Income bonuses affect taxable income and GDP. Trade efficiency divides applicable tariffs by `1 + efficiency / 100`; Automobiles contributes another 20%. No trade principal is duplicated or invented. Food bonuses multiply food output; production bonuses affect basic resources; manufacturing bonuses affect recipe output while still consuming ingredients. Healthcare reduces disease, improving population and income. Recovery reduces round casualties, while salvage only returns materials for units actually lost.
- The Research page lists each effect's mapped stat, units, contribution and limit, plus current aggregate bonuses. These mappings implement thematic effects through existing game systems; they do not create literal immortality, time travel, independent financial markets or an outbreak simulator.

Queues store remaining work and their current rate. Speed changes from labs, research, government, policy, resource combinations, wonders and motions affect remaining work immediately. Completion deadlines are replayed chronologically with hourly turns and expiring effects. Old queues are migrated from their saved deadlines without losing completed work. Viewing progress cannot accelerate completion. The Great Library cannot be demolished while its second research slot is occupied.

Owned technology is separate from shared technology. An Intelligence Pact supplies reports from direct partners. With Financial Assistance, a nation borrows 20% of its strongest direct partner's **owned** technology; partners' borrowed technology is excluded. This is an explicit rule for previously unfinished passive sharing. Borrowed technology affects technology gates, literacy, population and taxable income. Purchasing technology always increases owned levels. Cancelling the pact or removing the office immediately removes borrowing; reports disappear when access ends, unless the nation acquired its own report. Completed research and existing buildings are retained when a technology prerequisite later disappears; new purchases still check current eligibility.

## Construction and national statistics

Effects rebuild in catalog order from actual ownership. Demolition cannot leave stale capabilities. Projects and wonders no longer trigger partial recalculations halfway through that rebuild.

Pollution and environment are finalized before disease; crime and happiness are resolved from a fixed starting state before productive population, taxes and morale. World-motion happiness, environment and population modifiers enter that same calculation. The documented productive-population formula is restored:

```
efficiency = clamp(1 - disease / 100 × 0.5 - crime / 100 × 0.3
                   + max(0, (happiness - 70) × 0.01), 0.5, 1.5)
```

Casinos and Sports Betting boost taxable income once, including GDP and taxes, while retaining their crime/happiness costs. They can still reduce net revenue in an unhealthy nation. Basic Needs contributes its advertised +2 happiness. Green environmental policy reduces pollution. Supreme Recycling supplies triple total effectiveness (not Enhanced Recycling's double plus another triple), removes its happiness penalty, and adds environment. Supreme Military's text now correctly says four −0.5 happiness penalties total −2; its calculation is unchanged.

Food/water independence wonders provide access for resource combinations without minting inventory or paying manufacturing/upkeep costs. Combinations disappear immediately on depletion. Books and Automobiles check effective technology. Bulk development refreshes prices between levels, matching individual purchases.

Unit storage and military academy demolition cannot reduce capacity below current holdings; sell units first. Command centers cannot be removed while their war slots are occupied. Embassies cannot be removed while required relationship/treaty slots are occupied. Building prerequisite and permanent-building restrictions continue to apply. Capacity reductions caused by changing demographics or temporary world edicts retain existing units but block further recruitment/production until space exists.

Conventional damage uses the existing unit, building, morale and player-skill formulas, plus research, government/policy, Arms Pile, world motions and relationship bonuses. The Military page exposes an attack estimate before target defense, critical rolls and per-war relationship modifiers. Research defense divides incoming conventional damage; flat player defense/block/parry still apply. Weapon inventory, energy and intuition remain authoritative.

## Relationships and treaties

A Foreign Affairs Office enables diplomatic actions. Each embassy supplies one friend and one foe slot; five embassies unlock one best friend and one nemesis. Changing an existing non-neutral designation requires the Office of Diplomatic Relations. Choosing neutral removes the designation. Choosing the current designation is a no-op and is disabled.

In a war, each designated friend contributes +5%, best friend +15%. A foe designation in either direction gives both nations +5%; a nemesis designation gives both +15% instead. Hostility is counted once per pair at the stronger level. The total relationship bonus is capped at +125%. The legacy contract counts all participants, regardless of war side; friendship and incoming hostility are separate contributions.

Treaty proposals reserve capacity for both participants. Both nations' offices, embassies, relationship-dependent limits and existing proposals are checked at proposal and acceptance. Treaty limits remain those in the catalog: mutual/optional pacts permit six with a friend/best friend, otherwise three. Existing signed contracts are retained when a relationship later changes; new proposals and acceptance recheck current capacity. Opposing war participants must end that war before signing. Peace pacts remain non-cancellable until their agreed expiry.

### Military obligations

When a principal nation declares or receives war, its active treaties create calls during the 15-minute preparation period:

| Treaty | Call |
|---|---|
| Protectorate | Proposer protects recipient in offensive and defensive wars |
| Extension | Partner joins either side's wars |
| Mutual/Optional Aggression | Partner joins offensive wars |
| Mutual/Optional Defense | Partner joins defensive wars |
| Intelligence / Peace | No military call |

Calls come from the original two principals, without recursively inviting every treaty partner of each joining nation. A joining nation must have the appropriate war slot and cannot oppose an alliance member or violate a peace pact. Joining one side fulfills its calls on that side; conflicting mandatory calls incur their documented failure penalty. Cancelling a treaty does not erase an already-issued call. White peace cancels unanswered calls immediately.

Mandatory refusal or timeout applies the catalog happiness penalty for **seven game days (seven real hours)**, matching the legacy day-based penalty processor. Where required, the agreed compensation transfers immediately up to available money. Unpaid amounts remain a debt and are collected after subsequent hourly income. No money is created, and payment cannot occur twice. Optional calls have **no penalty**, following their descriptions rather than contradictory unused failure fields.

War sides retain their principal IDs for save compatibility. Participants choose an enemy target; round damage and wins aggregate by side. All participants receive appropriate casualties and final victory/defeat outcomes once. Only the original principals negotiate white peace. War calls, sides, debts, penalties and deadlines survive restart.

## Verification and boundaries

Automated integration tests cover the complete research catalog, prerequisite validation, repeated recalculation, real production/income/upkeep, progression and old-save migration, construction interactions, capacity removal, friend/foe rules, treaty validation, revocable intelligence, mandatory/optional calls, compensation, side combat and offline penalty expiry. Existing world, HTTP/SSE, sports, presentation, database and writer-lock tests remain required.

This integration does not activate the separate legacy disease-outbreak/event engines, autonomous AI, custom alliance governments, alliance-level treaties/skills, or geographic battle renderer. See `LIVE_GAME_AUDIT.md` for those separate systems. New research mappings and passive technology sharing are explicit initial balance decisions and can be tuned in their registries. Continuous production execution still requires always-on server hosting; this task configures a development preview.
