# Global System Guide

Everything you need to know about the world-level simulation in Sovereignty Epochs — from global happiness and pollution to wars, diseases, currencies, and how the world affects your nation.

## Table of Contents

1. [What Is the Global System?](#what-is-the-global-system)
2. [Global Averages](#global-averages)
3. [How the World Affects Your Nation](#how-the-world-affects-your-nation)
4. [Environment & Pollution Decay](#environment--pollution-decay)
5. [Government & Religion Majority](#government--religion-majority)
6. [Immigrants](#immigrants)
7. [Sports & the Draft](#sports--the-draft)
8. [Education Buildings](#education-buildings)
9. [War & Peace](#war--peace)
10. [Military Units](#military-units)
11. [Currencies](#currencies)
12. [Diseases](#diseases)
13. [Special Offers](#special-offers)
14. [Events](#events)

---

## What Is the Global System?

The Global System is the "world engine" of Sovereignty Epochs. Instead of each nation existing in isolation, every nation's stats contribute to world averages — and those world averages then feed back to affect every nation.

Think of it like real life: if most nations have high pollution, the global environment suffers, which makes everyone's environment worse. If most nations are at war, the world is in a wartime state. If most nations use a certain currency, that currency becomes dominant.

The system runs once per game day and processes everything in a specific order so that factors build on each other correctly.

---

## Global Averages

Eight factors are tracked globally across all nations:

| Factor | Scale | What It Means |
|--------|-------|---------------|
| Happiness | 0–100 | How happy the world's population is on average |
| Pollution | 0–100 | How polluted the world is on average |
| Disease | 0–100 | How diseased the world is on average |
| Crime | 0–100 | How much crime exists globally on average |
| Environment | 0–100 | How healthy the world's environment is |
| Population Density | 0–1000 | People per square mile across all nations |
| Education | 0–100 | Global education level (tech + schools + universities) |
| Literacy Rate | 0–100 | Global literacy rate |

### Everything Affects Everything

Global stats aren't just simple averages — they influence each other like real-world systems:

- **High global crime** lowers global happiness
- **High global pollution** raises global disease and lowers happiness
- **High global disease** lowers happiness and raises crime
- **Poor global environment** lowers happiness, raises crime and disease
- **High literacy** raises happiness
- **High education** lowers disease and raises literacy
- **High population density** raises crime and pollution
- **Clean global environment** lowers pollution

Each day, these cross-effects are calculated plus a small random amount (±5), so the world isn't entirely predictable.

### How Your Nation Feels It

After computing the world averages, each nation's stats are gently nudged toward the global average:

| Factor Type | Factors | How Strong |
|-------------|---------|------------|
| Strong | Pollution, Disease, Environment | 5% per day |
| Minor | Happiness, Crime, Literacy | 1% per day |

This means if the world is very polluted, your nation's pollution will slowly creep up even if you're clean yourself. If the world is very happy, your happiness gets a tiny boost. It's small — about 1–5% per day — but over time it adds up.

---

## Environment & Pollution Decay

The Environment is calculated **last** because it depends on everything else:

```
Environment = 100 − Pollution − (Disease × 0.2) − (Crime × 0.1) + (Happiness − 50) × 0.1 − Strike Pollution
```

### Strike Pollution

When nukes or missiles successfully hit in war, they add pollution to the world:

| Weapon | Pollution Added |
|--------|----------------|
| Missile | 5 points |
| Nuke | 25 points |

This pollution doesn't disappear instantly. It decays over time:

| Source | Decays Per Day | Time to Clear ~63% |
|--------|---------------|-------------------|
| Nukes | 0.5% | ~138 days |
| Missiles | 2% | ~34 days |
| Base pollution | 0.5% | ~138 days |

Nuclear fallout lingers for months. Missile pollution clears faster but still takes weeks. The world environment slowly heals as this pollution decays.

---

## Government & Religion Majority

The system counts what government and religion each nation uses, finds the **majority** (most common), and suggests the **opposite** (a random government/religion that isn't the majority).

As players change their governments and religions, the majority shifts, and the suggested opposite shifts too. This creates dynamic pressure — if 80% of the world is Democratic, the system will suggest non-Democratic options to nations considering a change.

When a nation gets a government or religion demand, the hint will point to this suggested opposite rather than a random option.

---

## Immigrants

When a new immigrant arrives in your nation, the global system determines their starting attributes:

| Attribute | How It's Determined |
|-----------|--------------------|
| Happiness | Global happiness average ±10 |
| Criminal | Base 5% chance; higher if global crime > 30 or global happiness < 40 |
| Health | 100 minus global pollution (>50) and disease (>20), ±10 |
| Education | Based on global education level + education building coverage |
| Literacy | Global literacy rate ±15, plus bonus if gifted |

If most of the world has high education and literacy, immigrants will be better educated. If the world is polluted and diseased, immigrants arrive less healthy.

---

## Sports & the Draft

The global system tracks sports across all teams:

| Stat | What It Shows |
|------|---------------|
| Teams per sport | How many teams exist for basketball, hockey, soccer, football |
| Youth Academies | How many teams have youth academy upgrades |
| Technology Centers | How many teams have tech center upgrades |
| Average Player Skill | Mean player rating across all teams in each sport |
| Global Skill Standard | Overall average across all sports |

### Draft Rework

Instead of adding a fixed 100 players per team, the draft board now spawns enough players so that **every team can fill its roster**. The target count is based on:

- Number of teams × roster slots (25 for football, 15 for others)
- Minimum 200 players per sport
- Scaled by the global skill standard (higher standard = more players)
- Capped at 1000 players per sport

Player attributes are scaled by the global skill standard — if the world average skill is high, new draft players start with better skills.

### Special Offers

During active seasons, teams can receive **special player offers** — boosted players generated just for them:

- Base 2% chance per team per day
- +3% per youth academy level, +4% per technology center level
- +5% if the team's average skill is above the global standard
- Cap at 40%, max one offer every 7 days per team
- Offer players get +15 base attributes + upgrade bonuses, +20 potential
- 14 days to sign before the offer expires

---

## Education Buildings

The system tracks education infrastructure across all nations:

| Building | Max Per Nation | Source |
|----------|---------------|--------|
| School | 5 | Improvements |
| National University | 3 | Projects |
| Advanced University | 1 | Projects |
| Great Library | 1 | Wonders |
| Universal Education System | 1 | Wonders |

For each building type, it tracks how many are built worldwide, what percentage of available slots are filled, and how many nations have at least one.

This affects immigrants — higher global education building coverage means better-educated immigrants arrive, and it slightly boosts literacy in all nations.

---

## War & Peace

The system tracks how many nations are currently at war versus at peace:

| Stat | Meaning |
|------|---------|
| Nations at War | Nations in an active war (either side) |
| Nations at Peace | Nations not in any active war |
| War Percentage | % of all nations at war |
| Peace Percentage | % of all nations at peace |
| Active War Count | Total number of ongoing wars |

A nation is "at war" if it appears on either the attacker or defender side of any active war. This gives you a quick read on how violent the world is right now.

---

## Military Units

Average military strength across all nations is tracked for each unit type:

| Unit | What You See |
|------|-------------|
| Soldiers | Average count per nation, total worldwide |
| Tanks | Average count per nation, total worldwide |
| Aircraft | Average count per nation, total worldwide |
| Ships | Average count per nation, total worldwide |
| Spies | Average count per nation, total worldwide |
| Missiles | Average count per nation, total worldwide |
| Nukes | Average count per nation, total worldwide |

This lets you see if the world is heavily militarized or mostly peaceful in terms of unit counts.

---

## Currencies

There are 6 currency types in the game: aurel, velt, krona, drachma, sovereign, and talon. Each nation has a primary currency and balances for each type.

The global system tracks:

| Stat | Meaning |
|------|---------|
| Nation Count | How many nations use this as their primary currency |
| Total Balance | Total amount of this currency held by all nations |
| Avg Balance | Average balance per nation |
| % of Nations | What percentage of all nations use this currency |

This shows you which currencies are dominant in the world economy and how much wealth exists in each.

---

## Diseases

The system tracks active disease outbreaks across all nations:

| Stat | Meaning |
|------|---------|
| Nations with Minor Disease | How many nations have at least one active minor disease |
| Nations with Major Disease | How many nations have at least one active major disease |
| % with Minor Disease | Percentage of nations affected |
| % with Major Disease | Percentage of nations affected |
| Total Minor Outbreaks | Total active minor outbreak count |
| Total Major Outbreaks | Total active major outbreak count |

Only national-scope diseases are counted (global-scope diseases are tracked separately). Cured diseases are not counted.

This gives you a quick read on world health — if 40% of nations have major diseases, the world is in a health crisis.

---

## Special Offers

During active sports seasons, teams can receive **special player offers**:

- **Base chance:** 2% per team per day
- **Youth Academy bonus:** +3% per level
- **Technology Center bonus:** +4% per level
- **High skill bonus:** +5% if team skill > global standard
- **Maximum chance:** 40%
- **Cooldown:** Minimum 7 days between offers per team

Special offer players arrive with boosted attributes (+15 base + upgrade bonuses) and boosted potential (+20). They have 14 days to sign before the offer expires.

---

## Events

The Global System broadcasts events that UI and other systems can listen to:

| Event | What It Tells You |
|-------|-------------------|
| `GLOBAL_AVERAGES_UPDATED` | World averages changed (happiness, pollution, etc.) |
| `GLOBAL_ENVIRONMENT_CALCULATED` | Environment result with strike penalty details |
| `GLOBAL_DISEASE_SPAWN_CHECK` | Global disease spawn roll result |
| `GLOBAL_DISEASE_OUTBREAK` | A global disease outbreak started |
| `GLOBAL_MAJORITY_SHIFTED` | World majority government/religion changed |
| `GLOBAL_SPORTS_STATS_UPDATED` | Sports team/skill stats changed |
| `GLOBAL_EDUCATION_BUILDING_STATS_UPDATED` | Education building coverage changed |
| `GLOBAL_WAR_STATS_UPDATED` | War/peace percentages changed |
| `GLOBAL_MILITARY_UNIT_STATS_UPDATED` | Military unit averages changed |
| `GLOBAL_CURRENCY_STATS_UPDATED` | Currency usage percentages changed |
| `GLOBAL_DISEASE_STATS_UPDATED` | Minor/major disease counts changed |
| `GLOBAL_SPECIAL_OFFER` | A team received a special player offer |

---

## Quick Reference

| Question | Answer |
|----------|--------|
| How often does the Global System run? | Once per game day |
| How strongly does the world affect my nation? | 1–5% per day toward global averages |
| How long does nuke pollution last? | ~138 days to clear 63% |
| How long does missile pollution last? | ~34 days to clear 63% |
| What affects my immigrants? | Global happiness, crime, pollution, disease, education, literacy |
| How are draft players generated? | Based on team count + global skill standard |
| What determines special offers? | Youth academy, tech center, team skill vs global standard |
| How is "at war" determined? | If your nation appears on either side of any active war |
