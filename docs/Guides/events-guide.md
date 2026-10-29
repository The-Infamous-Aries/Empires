# Events Guide

Everything you need to know about events and situations in Dominion Wars — from random disasters and miracles to player-choice situations that shape your nation.

## Table of Contents

1. [What Are Events & Situations?](#what-are-events--situations)
2. [The 5-Slot System](#the-5-slot-system)
3. [How Events Spawn](#how-events-spawn)
4. [Economic Events](#economic-events)
5. [Sports Events](#sports-events)
6. [Disaster Events](#disaster-events)
7. [Miracle Events](#miracle-events)
8. [Population Situations](#population-situations)
9. [Nation Situations](#nation-situations)
10. [Military Situations](#military-situations)
11. [Resolving Situations](#resolving-situations)
12. [Tips & Strategy](#tips--strategy)

---

## What Are Events & Situations?

Events and situations are game-wide occurrences that happen to your nation automatically. They are divided into two categories:

| Category | Player Choice? | Examples |
|----------|---------------|----------|
| **Events** (economic, sports, disaster, miracle) | No — auto-apply | World Bank error, wildfire, Godzilla attack |
| **Situations** (population, nation, military) | **Yes — 3 choices** | Teacher strike, smog alert, enemy offensive |

All events/situations are managed by the **Events System**, which tracks what is active, when things spawn, and applies their effects to your nation.

## The 5-Slot System

Your nation has **5 shared slots** for non-economic events and situations. Economic events (always exactly 1 active) do **not** use a slot.

| Type | Max Active | Notes |
|------|-----------|-------|
| Disasters | 2 | Permanent record — effects persist |
| Miracles | 2 | Permanent record — effects persist |
| Nation Situations | 3 | Player choice required |
| Population Situations | 3 | Player choice required |
| Military Situations | 3 | Player choice required |

**Total across all types: 5 slots maximum.**

If all 5 slots are full, no new situation can spawn until one expires or is resolved.

### Pending Situation Penalty

When a situation spawns, it waits for your choice. While pending, your nation takes a **-10 happiness penalty**. The penalty is removed instantly the moment you pick one of the 3 choices.

## How Events Spawn

Events and situations spawn on a turn-based schedule:

- **1 turn = 1 real hour**
- A spawn check happens on your **nation creation turn** and then **every 6 turns after**
- If all 5 slots are full, nothing spawns

### Spawn Formula

When a spawn check happens, the system randomly picks a type based on weighted chances:

| Condition | Nation | Military | Population | Miracle | Disaster | Sports |
|-----------|--------|----------|------------|---------|----------|--------|
| No teams yet | 29% | 29% | 29% | 6.5% | 6.5% | 0% |
| Teams unlocked | 22.75% | 22.75% | 22.75% | 4.5% | 4.5% | 22.75% |

Then modifiers are applied:

| Modifier | When | Effect |
|----------|------|--------|
| **War** | You are at war | Military +25%, Population −15% |
| **Peace** | You are at peace | Population +25%, Military −15% |
| **Unstable Nation** | High disease/crime/pollution, low happiness/environment | Disaster chance increases |
| **Stable Nation** | High happiness/environment, low disease/crime/pollution | Miracle chance increases |
| **Off-Season** | Sports not in season | Sports chance +50% |
| **Tournament** | Your team is in a tournament | Sports chance ×3 |
| **World Tournament** | Your team is in the World Tournament | Sports chance ×5 |

After modifiers, there is a **10–30% base chance** that anything spawns at all. If the roll fails, nothing happens that turn.

---

## Economic Events

**Always exactly 1 active at a time.** No player choice.

Economic events affect the world economy:

- **Currencies:** aurel, velt, krona, drachma, sovereign, talon (rates, transfer rates, interest rates)
- **World Bank:** loan rate changes
- **Economy indicators:** GDP growth, inflation, unemployment, interest rate, exchange rate, economic index

Each turn (1 hour), the active economic event's effects are applied. There is a **15% chance each turn** that the current event is replaced with a brand new random one. Currency type and value are randomized every time, so no two economic events feel the same.

---

## Sports Events

**Max 3 active at a time.** No player choice.

Sports events apply permanent bonuses to a random team of the matching sport on your nation:

- **Stat boosts:** Permanent attribute increases to random players
- **XP:** Experience points to level up players
- **Traits:** Good or bad traits assigned to players
- **Morale:** Player morale changes
- **Injuries:** Players get injured (or cured) based on severity
- **Fans:** Fan count goes up or down
- **Stadium costs:** Upgrade cost modifiers change
- **Fan Volunteer:** A random fan joins your team as a new player

Sports events are permanent — once applied, the bonuses stay on your players and team forever.

---

## Disaster Events

**Max 2 active at a time.** No player choice.

Disasters are the opposite of miracles — they only bring bad news. Effects include:

- **Infrastructure destroyed** (random % based on chance roll)
- **Technology destroyed** (random %)
- **Population killed** — follows a **3-step roll**: chance → which demographic group → how many killed
- **Military destroyed** — soldiers, tanks, aircraft, ships (only if you are at war)
- **Disease, pollution, crime** go up
- **Environment** goes down
- **Happiness penalty** — only if people actually died

Some disasters are **war-only** and will not spawn unless your nation is at war.

Religious disasters exist for all 12 religions (e.g., Sulfur Rain for monotheism, Kami's Wrath for shintoism, The Flying Spaghetti Monster for pastafarianism).

Fictional disasters include Godzilla walking through your capital, alien invasion, zombie outbreak, meteor strike, and more.

---

## Miracle Events

**Max 2 active at a time.** No player choice.

Miracles are the opposite of disasters — **only good outcomes.** Effects include:

- **Happiness, environment** go up
- **Disease, pollution, crime** go down
- **Taxable income, land, infra, population, tech** increase
- **Direct money** added to treasury
- **Debt forgiven** (set to $0)

### Special Miracle Types

| Miracle | Effect |
|---------|--------|
| **World Bank Error** | 2–30× of your turn revenue (after upkeep, taxes, loan repayment) |
| **Immigration Boom** | 1/10 to 3/4 of your whole population arrives from 3 random age groups |
| **Wealthy Benefactor** | Donates tanks/aircraft/ships = 1/10–3/4 of what you **lack** (max capacity − what you have); missiles/nukes = random 1–20 |

Religious miracles exist for all 12 religions. Fictional miracles include finding El Dorado, the Fountain of Youth, alien gifts of technology, and more.

---

## Population Situations

**Max 3 active at a time.** Player choice required — pick 1 of 3 options.

Population situations affect your citizens and demographics:

- **Population total** and specific age groups (teen, young adult, adult, middle-aged, older)
- **Happiness, disease, crime, pollution, environment, literacy**
- **Money** (positive = flat gain, negative = % of holdings scaled by amount)
- **Temporary cost multipliers** for infra, land, tech

Examples: baby boom, disease outbreak, crime wave, literacy campaign, school closures.

---

## Nation Situations

**Max 3 active at a time.** Player choice required — pick 1 of 3 options.

Nation situations affect your country's policies, infrastructure, and economy:

- **Literacy, pollution, environment**
- **Infra cost, land cost, tech cost** multipliers (temporary)
- **Infra upkeep** changes (temporary)
- **Money** (positive/negative)

Examples: smog alert, teacher strike, green energy subsidy, highway expansion, affordable housing crisis, free trade agreement.

---

## Military Situations

**Max 3 active at a time.** Player choice required — pick 1 of 3 options.

Military situations are **filtered by war/peace state**:

| Situation Type | Spawns When |
|---------------|-------------|
| `war_peace: 'peace'` | Only when you are **NOT** at war |
| `war_peace: 'war'` | Only when you **ARE** at war |

### Peace Military Effects

- Unit upkeep/cost multipliers (temporary)
- Military morale changes

Examples: volunteer recruitment drive, tank maintenance contract, aviation fuel contract, spy recruitment drive.

### War Military Effects

- **Combat efficiency** multipliers for soldiers, tanks, aircraft, ships (temporary)
- **Strategic infrastructure damage** from missile/nuclear strikes
- **Spy operation success chance** changes

Examples: enemy offensive, urban combat, air superiority battle, naval blockade, spy infiltration, ballistic missile strike, nuclear counterforce.

---

## Resolving Situations

When a situation spawns, you have **3 choices**. Each choice has different effects. To resolve:

1. View the pending situation in your nation's events panel
2. Read the description and all 3 choice options
3. Select the choice you want
4. The situation is marked **resolved** and the effects are applied immediately
5. The **-10 happiness penalty is removed** instantly
6. The slot is freed up for a new event/situation

You cannot ignore a pending situation forever — it occupies a slot until resolved.

---

## Tips & Strategy

| Situation | Recommendation |
|-----------|---------------|
| **Disaster** | Can't be avoided once it spawns. Focus on keeping happiness, environment, disease, crime, and pollution in good shape to reduce disaster odds. |
| **Miracle** | Always welcome — take whatever you get. World Bank Error can give you up to 30× your turn revenue. |
| **Population Situation** | Choose based on what your nation needs most right now (happiness? population? money?). Remember the -10 penalty while pending. |
| **Nation Situation** | Consider the temporary cost multipliers — a short-term money cost might be worth a long-term infra cost reduction. |
| **Military Situation (War)** | Combat efficiency multipliers can turn the tide of battle. Choose carefully based on your current front. |
| **Slot Management** | If you're at 5/5 slots, resolve pending situations quickly to free up slots for potentially better events. |

---

## Quick Reference

| Type | Slots | Choice? | Always Good? | War-Only? |
|------|-------|---------|--------------|-----------|
| Economic | 1 (always active) | No | Mixed | No |
| Sports | 3 | No | Mixed | No |
| Disaster | 2 | No | No (bad only) | Some |
| Miracle | 2 | No | Yes (good only) | No |
| Population | 3 | **Yes** | Mixed | No |
| Nation | 3 | **Yes** | Mixed | No |
| Military | 3 | **Yes** | Mixed | Some |
