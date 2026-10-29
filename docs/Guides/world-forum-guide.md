# World Forum & Motion System Guide

Welcome to the World Forum — where your nation's voice shapes the world. This guide explains how the **World Forum** (governance and voting) and the **Motion System** (game effects) work together, in plain language.

---

## Table of Contents

1. [What Is the World Forum](#what-is-the-world-forum)
2. [What Are Motions](#what-are-motions)
3. [Who Can Propose Motions](#who-can-propose-motions)
4. [How Voting Works](#how-voting-works)
5. [Motion Duration](#motion-duration)
6. [Types of Motions](#types-of-motions)
7. [Sanctions](#sanctions)
8. [Custom Motions](#custom-motions)
9. [Canceling Motions](#canceling-motions)
10. [Quick Reference](#quick-reference)

---

## What Is the World Forum

The World Forum is your nation's seat in global government. It's where Congress — elected representatives from each faction — proposes, debates, and votes on motions that can change the game for everyone.

Think of it like a real-world parliament or United Nations. Motions passed here can:

- Boost or penalize your nation's economy, military, research, or population
- Ban nuclear weapons or missiles worldwide
- Enforce temporary world peace
- Change the world calendar or rename the world
- Sanction enemy nations (blocking attack, aid, diplomacy)
- And much more

The World Forum doesn't apply game effects directly. Instead, it tells the **Motion System** (the engine under the hood) to make the changes happen.

---

## What Are Motions

A motion is a proposal that, if passed, applies a game effect. There are three kinds:

| Type | What It Does | Example |
|------|--------------|---------|
| **Premade** | Fixed effect, no choices needed | "Nuclear Non-Proliferation Treaty" bans nukes |
| **Custom** | Congress picks one boost + one penalty | "Currency Generation with Inflation Act" |
| **Neutral** | No boost/penalty, changes world aspects | "World Rename Proposal" changes the world name |

Every motion has:
- A **type** (what it does)
- A **scope** (Color = one faction, World = everyone)
- A **minimum support** % needed to pass
- A **duration** (how long it lasts)
- A **proposer** (who suggested it)

---

## Who Can Propose Motions

Not everyone can propose every motion. Requirements depend on the motion:

| Requirement | What You Need |
|-------------|---------------|
| **Broadcasting Network** project | For color (faction-only) motions |
| **Internet Wonder** | For world (global) motions |
| **Congress seat** | For `congress_only` motions (world sanctions, peace treaties, etc.) |
| **Faction member** | For `faction_members` motions |

To check what motions you can propose, open the World Forum proposal screen. It will show only the motions your nation qualifies for.

### Getting Broadcasting Network

Build the Broadcasting Network project in your nation. This unlocks:
- Color (faction-wide) motions
- Voting in congressional elections
- Running for Congress

### Getting the Internet Wonder

Build the Internet wonder in your nation. This unlocks:
- World (global) motions
- Voting on world affairs
- Proposing sanctions, peace treaties, nuclear bans, etc.

---

## How Voting Works

Every motion goes through up to two voting rounds:

### Round 1: Faction Voting (Color Motions Only)

If the motion is `scope: color` (affects one faction), only members of that faction vote.

- **Voting period:** 24 hours
- **Who votes:** Members of the proposer's faction with Broadcasting Network
- **Passes if:** More `for` votes than `against` votes, AND support % meets the motion's minimum

If it passes, the motion is implemented immediately. If it fails, the motion dies.

### Round 2: World Voting (World Motions Only)

If the motion is `scope: world` (affects everyone), it first goes through faction voting, then moves to world voting.

- **Voting period:** 48 hours
- **Who votes:** Congress representatives (weighted by their faction's seat count)
- **Passes if:** Weighted support % meets the motion's minimum

Congress seats are weighted — factions with more Broadcasting-enabled members get more votes.

### Vote Options

| Option | Meaning |
|--------|---------|
| **For** | Support the motion |
| **Against** | Oppose the motion |
| **Abstain** | Neutral (doesn't count toward support %) |

---

## Motion Duration

When proposing a motion, you choose how long it lasts:

| Duration | Effect |
|----------|--------|
| **30 days** | Motion expires after 30 days |
| **60 days** | Motion expires after 60 days |
| **90 days** | Motion expires after 90 days |
| **1 year** | Motion expires after 1 year |
| **Until Canceled / Permanent** | Motion never expires on its own |

Some motions (like Government Change Amnesty or Child Labor) are permanent by default and can only be removed by cancellation.

---

## Types of Motions

Here are the main categories of motions available:

### Color Bloc Motions (One Faction)

Requires Broadcasting Network. Affects only your faction:

| Motion | What It Does |
|--------|--------------|
| **Experience Surge** | +20% XP gain, +25% energy cost |
| **Energy Regeneration** | +15% energy, -10% happiness |
| **Military Training** | +12% military effectiveness, +20% upkeep |
| **Tech Sharing** | +18% research points |
| **Infrastructure Push** | -20% building cost, -15% population growth |
| **Defensive Pact** | +25% defense bonus |
| **Economic Stimulus** | +25% currency, +5% inflation |
| **Happiness Campaign** | +15% happiness, -8% productivity |

### World Motions (Everyone)

Requires Internet Wonder. Affects all nations:

| Motion | What It Does |
|--------|--------------|
| **Calendar Change** | Change world time progression (permanent) |
| **Rename World** | Change the game world name (permanent) |
| **Military Limitation** | Cap unit counts globally (tanks, aircraft, ships) |
| **Tech Sharing** | Force tech sharing above thresholds |
| **Environmental Protection** | Limit pollution, -10% production |
| **Peace Treaty** | Ban all military conflicts temporarily |

### Sanctions (World Forum Only)

Requires Internet Wonder + Congress. Blocks a targeted nation:

| Sanction | Blocks |
|----------|--------|
| **Faction Sanctions** | Attack, aid, diplomacy, color interaction |

Sanctions are the only motion type that can directly stop another player from taking actions. They require Internet Wonder and Congress approval.

### Military Supremacy Acts (Max 2 Active)

Pick ONE military branch to boost, but others suffer:

| Motion | Boost | Penalty |
|--------|-------|---------|
| **Soldier Supremacy** | Soldiers +30% | Tanks/Aircraft/Ships -10% |
| **Tank Supremacy** | Tanks +30% | Soldiers/Aircraft/Ships -10% |
| **Aircraft Supremacy** | Aircraft +30% | Soldiers/Tanks/Ships -10% |
| **Ship Supremacy** | Ships +30% | Soldiers/Tanks/Aircraft -10% |

Only 2 can be active at once. Choose wisely.

### Health & Environment (Color & World)

| Motion | Effect |
|--------|--------|
| **Advanced Healthcare** | +15% happiness, -10% disease, -10% taxable income |
| **Green Goals** | +10% environment, -30% pollution, -10% taxable income |

### Population & Building (Color & World)

| Motion | Effect |
|--------|--------|
| **Child Labor** | Children work & taxed fully, -50% happiness (permanent) |
| **New Build Objective** | -15% land/infra purchase, +10% upkeep |
| **Restoration Act** | -15% land/infra upkeep, +10% purchase |

### World Forum Motions

| Motion | Effect |
|--------|--------|
| **Free Speech Protection** | Disable forum moderation temporarily |
| **Congressional Term Limits** | Limit motions per faction per day |
| **Veto Power Rotation** | Rotate veto power weekly |
| **Emergency Powers** | Congress bypasses world vote temporarily |
| **Motion Cost Increase** | Make motions more expensive to propose |
| **Supermajority Requirement** | Raise sanction vote threshold to 66% |
| **Motion Rename** | Rename any passed motion |

### Sports Motions

| Motion | Effect |
|--------|--------|
| **Athlete XP Boost** | +25% player XP, -15% fans gained |
| **Fan Engagement Boost** | +25% fans, -15% player XP |
| **Stadium Upgrade Subsidy** | -20% upgrade cost, -15% game revenue |
| **Season Length Alteration** | Change sports season length (permanent) |

---

## Custom Motions

Congress can create custom motions by picking **exactly one boost** and **one penalty**. This prevents overpowered motions — every boost comes with a cost.

### Boost Options

| Boost | Effect |
|-------|--------|
| Currency Generation | +5% to 50% money |
| Experience Gain | +5% to 40% XP |
| Energy Regeneration | +5% to 40% energy |
| Military Effectiveness | +5% to 35% military |
| Defense | +5% to 35% defense |
| Research Points | +5% to 35% research |
| Building Cost Reduction | +5% to 30% cheaper buildings |
| Happiness | +5% to 25% happiness |
| Population Growth | +5% to 25% population |
| Diplomacy Standing | +5% to 25% diplomacy |
| Sports Betting Revenue | +5% to 50% betting income |
| Athlete Development | +5% to 40% athlete growth |
| Fan Engagement | +5% to 30% fan growth |
| Stadium Revenue | +5% to 35% stadium income |

### Penalty Options

| Penalty | Effect |
|---------|--------|
| Reduced Currency Generation | -5% to 50% money (inflation) |
| Reduced Experience Gain | -5% to 40% XP |
| Increased Energy Cost | -5% to 40% energy cost |
| Increased Military Upkeep | -5% to 35% military upkeep |
| Reduced Defense | -5% to 35% defense |
| Reduced Research Points | -5% to 35% research |
| Increased Building Cost | -5% to 30% building cost |
| Reduced Happiness | -5% to 25% happiness |
| Reduced Population Growth | -5% to 25% population |
| Reduced Diplomacy Standing | -5% to 25% diplomacy |
| Increased Sports Crime | -5% to 25% sports stability |
| Increased Training Cost | -5% to 30% training cost |
| Roster Instability | -5% to 25% roster stability |
| Shorter Active Season | -5% to 30 days season |

### Rules

1. **Boost value must equal penalty value.** If you boost by 20, your penalty must be 20.
2. **Boost and penalty cannot be the same category.** You can't boost "Currency Generation" and penalize "Currency Generation."
3. Values must stay within each option's min/max range.

**Example:** "Currency Generation with Inflation Act" — Boost: Currency Generation +15%, Penalty: Reduced Currency Generation -15%. Net effect: 0% currency change, but the motion exists for flavor or strategic timing.

---

## Canceling Motions

Some motions (permanent or long-duration) can be canceled later. To cancel:

1. A vote is held to cancel the motion
2. The cancel vote needs the **same support %** that the original motion needed to pass
3. **Amnesty motions** (Government/Religion Change) must be active at least **30 days** before they can be canceled

If the cancel vote passes, the motion's effects are removed and the motion is revoked.

---

## Sanctions Explained

Sanctions are special motions that block a targeted nation from taking actions. They are the only way to directly restrict another player.

| Blocked Action | What It Stops |
|---------------|---------------|
| **Attack** | Declaring war, launching missiles/nukes, spy operations |
| **Aid** | Sending financial aid to other nations |
| **Diplomacy** | Proposing or accepting treaties |
| **Color Interaction** | Interacting with your color faction |

To propose a sanction, you need:
- Internet Wonder built
- Congress seat
- Target nation/faction selected

Sanctions last for a set duration (default 30 days) and can be canceled early with a vote.

---

## Quick Reference

| Action | Requirement |
|--------|-------------|
| Propose color motion | Broadcasting Network project |
| Propose world motion | Internet Wonder |
| Propose sanction | Internet Wonder + Congress seat |
| Vote on color motion | Broadcasting Network + same faction |
| Vote on world motion | Internet Wonder + Congress representative |
| Run for Congress | Broadcasting Network |
| Vote in Congress election | Broadcasting Network |
| Propose custom motion | Internet Wonder + Congress seat |
| Cancel a motion | Same vote % as original pass |

### Motion Limits

| Limit | Value |
|-------|-------|
| Default motion duration | 30 days |
| Max duration options | 30, 60, 90 days, 1 year, Permanent |
| Max active Military Supremacy Acts | 2 |
| Min active days before canceling amnesty | 30 days |
| Boost/penalty values | Must be equal |
| Boost/penalty same category | Not allowed |

---

## Tips & Strategy

| Tip | Why |
|-----|-----|
| **Build Broadcasting Network early** | Unlocks color motions and Congress elections |
| **Build Internet Wonder** | Unlocks world motions, sanctions, and peace treaties |
| **Get elected to Congress** | Only Congress can propose world motions and sanctions |
| **Coordinate with your faction** | Color motions need faction votes to pass |
| **Pick boost/penalty carefully** | Equal values required; think about the net effect |
| **Use sanctions strategically** | Block enemy attacks, aid, or diplomacy during war |
| **Watch motion durations** | Permanent motions can only be removed by cancellation |
| **Don't stack Supremacy Acts** | Only 2 can be active at once |

---

## How the Two Systems Work Together

| System | Responsibility |
|--------|---------------|
| **World Forum** | Proposals, voting, Congress elections, motion tracking |
| **Motion System** | Motion templates, effect application, sanctions, duration parsing |

**Flow:**
1. You propose a motion in World Forum
2. World Forum checks if you're eligible (using Motion System templates)
3. Players vote in World Forum
4. If passed, World Forum tells Motion System to apply the effect
5. Motion System applies boosts/penalties/sanctions and emits events
6. Other systems (war, economy, research, etc.) listen for those events

This separation keeps governance (World Forum) separate from game mechanics (Motion System).

---

Enjoy shaping the world! If you have questions about a specific motion, check the Motion System technical docs or ask in the Forum.