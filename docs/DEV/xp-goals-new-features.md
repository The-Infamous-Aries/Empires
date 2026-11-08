# XP-Goals System — Remaining Implementation Work

This document lists XP goals that are **NOT YET IMPLEMENTED** in `systems/XP/xp-goals-system.js`. Everything already wired up in the code has been removed from this list.

## Implementation Quick Reference

**Already implemented** (in xp-goals-system.js — do NOT add again):
- Military: trainSoldiers, trainTanks, trainAircraft, trainShips, buyMissiles, buyNukes
- Improvements: buildImprovement, demolishImprovement, buildProject, buildWonder
- Government/Religion: changeGovernment, changeReligion
- War damage: warDamage
- Foreign Affairs: proposeTreaty, acceptTreaty, rejectTreaty (all 8 treaty types)
- Relationships: addFriend, addBestFriend, addFoe, addNemesis
- Alliance: joinAlliance, makeAlliance
- Sports: sportsWin, sportsSeasonWin, sportsWorldWin, sportsTournamentRound
- Forum: voteColorMotion, voteWorldMotion, proposeColorMotion, proposeWorldMotion
- Congress: electedCongress
- Economy: buyLand, buyInfra, buyTech, buyCurrency, buyResource, sellCurrency, sellResource, buyLotteryTicket
- Resource production: produceRaw_* (7 minerals), produceManufactured_* (7 minerals)
- Sports drafting: draftHockeyPlayers, draftBasketballPlayers, draftSoccerPlayers, draftFootballPlayers (requires team)
- Sports betting: placeSportsBet, betAmount (requires team)

**Not yet implemented** (need to add to xp-goals-system.js):

---

# Trade & Commerce (NOT IMPLEMENTED)

All trade actions exist in `server/world.js` but have **no goals** in xp-goals-system.js:

| Goal | Type | Target | Type Req | XP Reward | Description |
|------|------|--------|----------|-----------|-------------|
| Propose Trade — Daily | `proposeTrade` | 1–3 trades | 0 | 100 | Propose a trade to another nation |
| Propose Trade — Weekly | `proposeTrade` | 5–10 trades | 0 | 750 | Propose multiple trades |
| Propose Trade — Monthly | `proposeTrade` | 20–30 trades | 0 | 3,000 | Propose many trades |
| Respond to Trade — Daily | `respondTrade` | 1–3 trades | 0 | 75 | Respond to a trade offer |
| Respond to Trade — Weekly | `respondTrade` | 5–10 trades | 0 | 500 | Respond to trades across the week |
| Respond to Trade — Monthly | `respondTrade` | 20–30 trades | 0 | 2,500 | Respond to trades across the month |
| Accept Trade Offer — Daily | `acceptOffer` | 1–3 offers | 0 | 100 | Accept a trade offer from another nation |
| Accept Offer — Weekly | `acceptOffer` | 5–10 offers | 0 | 750 | Accept multiple trade offers |
| Accept Offer — Monthly | `acceptOffer` | 20–30 offers | 0 | 3,000 | Accept many trade offers |
| Cancel Trade Offer — Daily | `cancelOffer` | 1–3 offers | 0 | 25 | Cancel your own trade offer |
| Cancel Offer — Weekly | `cancelOffer` | 5–10 offers | 0 | 150 | Cancel multiple trade offers |
| Cancel Offer — Monthly | `cancelOffer` | 20–30 offers | 0 | 750 | Cancel many trade offers |

**Implementation:** Call `xpGoalsSystem.awardProposeTrade(amount, { resourceKey, amount })`, `awardRespondTrade(...)`, `awardAcceptOffer(...)`, `awardCancelOffer(...)` inside `server/world.js` trade cases.

---

# Research & Skills (NOT IMPLEMENTED)

All actions exist in `server/world.js` but have **no goals** in xp-goals-system.js:

| Goal | Type | Target | Type Req | XP Reward | Description |
|------|------|--------|----------|-----------|-------------|
| Start Research — Daily | `startResearch` | 1 research | 0 | 200 | Start a research project |
| Start Research — Weekly | `startResearch` | 3–5 research | 0 | 1,000 | Start multiple research projects |
| Start Research — Monthly | `startResearch` | 10–20 research | 0 | 4,000 | Start many research projects |
| Skill Point — Daily | `skillPoint` | 1 skill point | 0 | 50 | Spend a skill point |
| Skill Point — Weekly | `skillPoint` | 3–5 skill points | 0 | 250 | Spend multiple skill points |
| Skill Point — Monthly | `skillPoint` | 10–20 skill points | 0 | 1,000 | Spend many skill points |
| Legendary Skill — Daily | `legendarySkill` | 1 point | 0 | 500 | Spend a legendary skill point |
| Legendary Skill — Weekly | `legendarySkill` | 2–3 points | 0 | 2,500 | Spend legendary skill points |
| Legendary Skill — Monthly | `legendarySkill` | 5–10 points | 0 | 10,000 | Spend many legendary skill points |
| Go Legendary — Monthly | `goLegendary` | 1 time | 100 | 50,000 | Reach level 100 and go legendary |

**Implementation:** Call `xpGoalsSystem.awardStartResearch(...)`, `awardSkillPoint(...)`, `awardLegendarySkill(...)`, `awardGoLegendary(...)` inside `server/world.js`.

---

# World Events & Actions (NOT IMPLEMENTED)

All actions exist in `server/world.js` but have **no goals** in xp-goals-system.js:

| Goal | Type | Target | Type Req | XP Reward | Description |
|------|------|--------|----------|-----------|-------------|
| Fund Disease Cure — Daily | `fundDiseaseCure` | 1 cure | 0 | 500 | Fund a disease cure |
| Fund Disease Cure — Weekly | `fundDiseaseCure` | 2–3 cures | 0 | 2,500 | Fund multiple disease cures |
| Fund Disease Cure — Monthly | `fundDiseaseCure` | 5–10 cures | 0 | 10,000 | Fund many disease cures |
| Resolve Situation — Daily | `resolveSituation` | 1 situation | 0 | 200 | Resolve a nation situation |
| Resolve Situation — Weekly | `resolveSituation` | 3–5 situations | 0 | 1,000 | Resolve multiple situations |
| Resolve Situation — Monthly | `resolveSituation` | 10–15 situations | 0 | 4,000 | Resolve many situations |
| Set National Pet — Weekly | `changeNationalPet` | 1 time | 0 | 300 | Change your national pet |
| Change National Food — Monthly | `changeNationalFood` | 1 time | 0 | 300 | Change your national food type |
| Change National Water — Monthly | `changeNationalWater` | 1 time | 0 | 300 | Change your national water type |
| Change National Pet — Monthly | `changeNationalPet` | 2–4 times | 0 | 750 | Change your national pet multiple times |
| Set Flag — Daily | `setFlag` | 1 flag | 0 | 100 | Set or change national flag |
| Set Flag — Weekly | `setFlag` | 2–3 flags | 0 | 500 | Change flag multiple times |
| Set Flag — Monthly | `setFlag` | 5–10 flags | 0 | 2,000 | Change flag many times |
| Send Aid — Weekly | `sendAid` | 1 time | 0 | 300 | Send aid to another nation |
| Send Aid — Monthly | `sendAid` | 2–4 times | 0 | 1,000 | Send aid to multiple nations |
| Receive Aid — Monthly | `receiveAid` | 2–4 times | 0 | 750 | Receive aid from other nations |
| Propose Trade — Weekly | `proposeTrade` | 1 time | 0 | 300 | Propose a trade with another nation |
| Propose Trade — Monthly | `proposeTrade` | 2–4 times | 0 | 1,000 | Propose multiple trades |
| Accept Trade — Monthly | `acceptTrade` | 2–4 times | 0 | 1,000 | Accept trades from other nations |

**Implementation:** Call `xpGoalsSystem.awardSendAid(...)`, `awardReceiveAid(...)`, `awardProposeTrade(...)`, `awardAcceptTrade(...)`, `awardRejectTrade(...)` inside `server/world.js` trade-aid action handlers. Trade & Aid handled by `systems/Resource/trade-aid-system.js` (TradeAidSystem class).

---

# Sports (IMPLEMENTED — Gated Behind Teams)

All sports projects/wonders exist in `systems/Building/` and actions exist in `server/world.js`. Goals exist in `systems/XP/xp-goals-system.js` but are **locked until the nation owns at least 1 team**.

**Requirements:**
- **All sports goals** (draft, bet) require at least 1 team owned by the nation
- **Draft goals** only show for sports the nation currently has teams for
- Team types: `hockey`, `basketball`, `soccer`, `football`
- To unlock a sport's draft goal, build/own a team of that sport first

| Goal Type | Example Types | Unlock Requirement |
|-----------|---------------|-------------------|
| Draft Hockey Players | `draftHockeyPlayers` | Own at least 1 hockey team |
| Draft Basketball Players | `draftBasketballPlayers` | Own at least 1 basketball team |
| Draft Soccer Players | `draftSoccerPlayers` | Own at least 1 soccer team |
| Draft Football Players | `draftFootballPlayers` | Own at least 1 football team |
| Place Sports Bet | `placeSportsBet` | Own at least 1 team (any sport) |
| Bet Amount | `betAmount` | Own at least 1 team (any sport) |

**Implementation:** Award via `xpGoalsSystem.awardDraftHockeyPlayers(...)`, `awardDraftBasketballPlayers(...)`, `awardDraftSoccerPlayers(...)`, `awardDraftFootballPlayers(...)`, `awardPlaceSportsBet(...)`, `awardBetAmount(...)` inside `server/world.js` sports action handlers.

---

# Population & Citizens (NOT IMPLEMENTED)

# Lottery & Gambling (NOT IMPLEMENTED)

**NOT YET IMPLEMENTED** — All actions exist in `server/world.js` but have **no goals** in xp-goals-system.js:

**No goals needed** — Buy Lottery Ticket is already implemented in xp-goals-system.js.

**Note:** Max 25 tickets per drawing per nation. Weekly max is 25 (one drawing per week). Monthly max is 100 (4 weeks × 25).

---

# Population & Citizens (NOT IMPLEMENTED)

**NOT YET WIRED** — UI exists in `ui/components/tabs/nation-tab.js` (`openCitizenDialog`, line 263) but no server action handler found for talking/conversing with citizens.

**Implementation needed:**
1. Add server action `talkCitizen` in `server/world.js` that records citizen interaction
2. Wire `xpGoalsSystem.awardTalkCitizen()` call in that handler
3. Wire UI click handler `data-action="openCitizenDialog"` to send the server action

| Goal | Type | Target | Type Req | XP Reward | Description |
|------|------|--------|----------|-----------|-------------|
| Talk to Citizen — Daily | `talkCitizen` | 1–3 citizens | 0 | 50 | Talk to a citizen |
| Talk to Citizen — Weekly | `talkCitizen` | 5–10 citizens | 0 | 250 | Talk to multiple citizens |
| Talk to Citizen — Monthly | `talkCitizen` | 20–30 citizens | 0 | 1,000 | Talk to many citizens |

**Prerequisites:** Server action handler must be created first.

---

# Implementation Notes

## How to Add a New Goal

1. **Add XP source** to `xpSources` in `systems/XP/xp-goals-system.js`:
   ```js
   buyCurrency: { baseXP: 10, levelScaling: 0.02, maxPerDay: 50 },
   ```

2. **Add award method** to `XPGoalsSystem`:
   ```js
   awardBuyCurrency(multiplier = 1, context = {}) {
       return this.awardXP('buyCurrency', multiplier, context);
   }
   ```

3. **Add goal templates** to `goalTemplates` for daily/weekly/monthly with `targetMin`/`targetMax` for ranged counts.

4. **Wire into server** in `server/world.js` by calling `xpGoalsSystem.awardBuyCurrency(...)` in the appropriate action handler.

5. **Add source-to-goal-type mapping** in `sourceToGoalType` if the goal type differs from the source key.

## Goal Schema

```js
{
    id: 'unique_goal_id',           // Unique identifier
    category: 'category_name',      // Category for UI grouping
    type: 'goal_type',              // Must match source key in sourceToGoalType
    title: 'Goal Title',            // Display title
    description: 'Goal description', // Display description
    targetMin: 1,                   // Minimum target (optional, for random)
    targetMax: 10,                  // Maximum target (optional, for random)
    xpReward: 100,                  // XP awarded on completion
    levelReq: 0,                    // Minimum player level
    requiresTech: 0,                // Tech requirement (optional)
    requiresProject: 'projectId',   // Project requirement (optional)
    requiresWonder: 'wonderId',     // Wonder requirement (optional),
}
```

## Testing Checklist

- [ ] Goal appears in correct period (daily/weekly/monthly)
- [ ] Goal is hidden if nation doesn't meet prerequisites
- [ ] Goal progress updates on correct server action
- [ ] XP is awarded on goal completion
- [ ] Goal resets on correct schedule (daily/weekly/monthly)
- [ ] World average / currency rate calculations don't break

---

*Generated from full scan of `server/world.js`, `systems/XP/xp-goals-system.js`, `systems/World/world-bank-system.js`, `systems/World/world-lottery-system.js`, `entities/Player.js`, and `ui/components/tabs/nation-tab.js`.*

---

## Currently Implemented (Do NOT Add)

The following goals are **already implemented** in `systems/XP/xp-goals-system.js` and should NOT be added again:

**Military:** trainSoldiers, trainTanks, trainAircraft, trainShips, buyMissiles, buyNukes
**Buildings:** buildImprovement, demolishImprovement, buildProject, buildWonder
**Government/Religion:** changeGovernment, changeReligion
**National Identity:** changeNationalPet, changeNationalFood, changeNationalWater
**War:** warAttack, warDefend, warWin, warParticipate, destroyUnits, warDamage
**Diplomacy:** proposeTreaty, acceptTreaty, rejectTreaty, addFriend, addBestFriend, addFoe, addNemesis, joinAlliance, makeAlliance
**Trade & Aid:** sendAid, receiveAid, proposeTrade, acceptTrade, rejectTrade. Aid keeps limits (1000 units/stage, 5000 total resources, $25M currency). Trade has no resource or currency limits — 5 shared slots, 3-day falloff after acceptance/rejection, one counter-offer allowed per trade.
**Sports:** sportsWin, sportsSeasonWin, sportsWorldWin, sportsTournamentRound
**Forum:** voteColorMotion, voteWorldMotion, proposeColorMotion, proposeWorldMotion
**Congress:** electedCongress
**Economy:** buyLand, buyInfra, buyTech, buyCurrency, buyResource, buyLotteryTicket, sellCurrency, sellResource
**Resource production:** produceRaw_* (7 types), produceManufactured_* (7 types)
**Edict acceptance:** treatyAccepted_* (8 types), treatyJoined_* (8 types)