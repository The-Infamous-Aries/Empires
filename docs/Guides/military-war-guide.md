# Military & War Guide

Everything you need to know about building your military, declaring and fighting wars, negotiating peace, and dominating the battlefield. This guide ties together three systems:

1. **Military Unit Entity** — your soldiers, tanks, aircraft, ships, spies, missiles, and nukes
2. **War System** — declaring wars, attacking, rounds, missiles, nukes, spy ops, peace
3. **War Terms System** — casus belli (war reasons), war types, loot formulas, peace terms

---

## Table of Contents

1. [The Three Systems at a Glance](#the-three-systems-at-a-glance)
2. [Building Your Military](#building-your-military)
3. [Unit Types Explained](#unit-types-explained)
4. [Declaring War](#declaring-war)
5. [War Types & Casus Belli](#war-types--casus-belli)
6. [Fighting: Attacks, Rounds, & Damage](#fighting-attacks-rounds--damage)
7. [Missiles & Nukes](#missiles--nukes)
8. [Spy Operations](#spy-operations)
9. [Peace Negotiations](#peace-negotiations)
10. [War Outcomes & Reparations](#war-outcomes--reparations)
11. [Treaty Obligations](#treaty-obligations)
12. [Relationship Bonuses](#relationship-bonuses)
13. [Tips & Tricks](#tips--tricks)
14. [Quick Reference](#quick-reference)

---

## The Three Systems at a Glance

| System | What It Handles | Truth Source For |
|--------|----------------|------------------|
| **Military Unit** | Individual unit formations, strength, condition, population enlistment | Unit counts, strength, condition, population cost |
| **War System** | War declarations, rounds, attacks, missiles, nukes, spy ops, peace, outcomes | Active wars, round damage, war stats |
| **War Terms** | Casus belli multipliers, war type modifiers, loot/destruction formulas, peace term rules | Loot amounts, infra damage, peace term validity |

Think of it like this: **MilitaryUnit** says *what units you have*, **War System** says *how the battle plays out*, and **War Terms System** says *what you gain or lose* based on the result.

---

## Building Your Military

### Unit Production

Military units are created as `MilitaryUnit` entities via `Nation.trainMilitary(type, amount)`. When you recruit units:

1. **Population is marked as military** — citizens are flagged `isMilitary=true` with `unitType` set; they keep their jobs, relationships, and everything else
2. **A MilitaryUnit entity** is created as the truth source for that unit type
3. **Your Nation's mirror count** is updated (e.g., `nation.militaryUnits.soldiers`)
4. **Nation military strength and budget** are adjusted

### Population Weight Per Unit (weighted for 50% cap)

| Unit Type | Population Weight | Max from 1,000 eligible pop |
|-----------|-------------------|------------------------------|
| Soldiers | 1 | 1,000 |
| Tanks | 2 | 500 |
| Aircraft | 3 | 333 |
| Ships | 5 | 200 |
| Spies | 0 | Unlimited |
| Missiles | 0 | Unlimited |
| Nukes | 0 | Unlimited |

Missiles, nukes, and spies cost **no population weight** toward the 50% cap — you can build as many as your economy allows. However, spies still mark citizens as military when enlisted.

### Maintenance

Every unit has a daily maintenance cost per unit:

| Unit | Cost Per Unit/Day |
|------|-------------------|
| Soldiers | $100 |
| Tanks | $500 |
| Aircraft | $2,000 |
| Ships | $4,000 |
| Spies | $1,000 |
| Missiles | $200 |
| Nukes | $2,000 |

Missiles and nukes have low maintenance but require Intuition to launch. Spies are moderately expensive but critical for intel.

### Unit Strength

Each unit type has a base strength per unit:

| Unit | Base Strength |
|------|---------------|
| Soldiers | 1 |
| Tanks | 25 |
| Aircraft | 100 |
| Ships | 200 |
| Spies | 5 |
| Missiles | 500 |
| Nukes | 2000 |

Effective strength is further modified by:
- **Condition** (0-100, degrades in combat)
- **Experience** (max +50%)
- **Morale** (affected by nation military morale)
- **Nation improvements** (soldier/tank/aircraft/ship effectiveness bonuses)
- **Player skills** (attack + defense add flat strength per unit)
- **Government type** military bonus

---

## Unit Types Explained

### Soldiers
- Cheap, low strength, population weight: 1
- Your cannon fodder and backbone of any army
- Fast to train, easy to replace

### Tanks
- Moderate cost, good strength
- Population weight: 2 per tank
- Effective against most ground targets

### Aircraft
- Expensive, high strength
- Population weight: 3 per aircraft
- Key for air superiority and high damage

### Ships
- Most expensive conventional unit, very high strength
- Population weight: 5 per ship
- Essential for naval dominance

### Spies
- No combat strength, used exclusively for spy operations
- Population weight: 2 per spy
- Maintenance: $1,000/day
- **Critical:** You need spies for intel, sabotage, and virus deployment

### Missiles
- No population weight, low maintenance ($200/day)
- Launch for infra damage + unit kills (soldiers, tanks, aircraft, ships)
- Requires 25 Intuition per launch
- Can be intercepted by defenses
- **No loot**

### Nukes
- No population weight, moderate maintenance ($2,000/day)
- Massive infra damage (20-65%), tech damage (2-8%), environmental damage
- Requires 50 Intuition per launch
- Harder to intercept than missiles
- **No loot**
- Use sparingly — the happiness and environmental penalties are severe

---

## Tips & Tricks

### Early Game
- **Build soldiers first** — cheapest unit, low population cost, easy to replace
- **Don't neglect spies** — even a small spy network lets you gather intel and disrupt enemies
- **Keep energy above 10** — you can't attack without energy; it regenerates 10%/hour
- **Choose your casus belli wisely** — `cash_raid` for money, `land_grab` for territory, `tech_raid` for technology

### Mid Game
- **Balance your military mix** — don't build only tanks; you need soldiers for numbers and aircraft/ships for high damage
- **Invest in defense skills** — parry and block can save you from devastating attacks
- **Watch your war slots** — you can only be in 2 offensive and 2 defensive wars at a time (base)
- **Use missiles to soften targets** — launch missiles before ground attacks to reduce enemy infra and units
- **Coordinate with allies** — join wars on the same side as friends for relationship damage bonuses

### Late Game
- **Nukes are situational** — the happiness and environmental penalties are severe; use only when the strategic payoff justifies it
- **Maximize loot with `free_looting`** — 1.75× loot multiplier for cash, tech, and land, but minimal damage (0.5×)
- **Force long peace with `humiliation`** — up to 365 days of peace, preventing the enemy from declaring on you
- **Show of Force for damage** — 2.25× damage multiplier but zero loot; use when you want to cripple, not profit
- **Monitor treaty obligations** — unfulfilled obligations cost hundreds of thousands in cash penalties
- **Watch aging military citizens** — they become veterans and their units are decommissioned at Senior age

### Combat Tips
- **Attack when you have energy** — don't let it cap at 100; use it or lose it
- **Critical hits matter** — invest in critical chance and critical damage skills
- **Defenders have advantages** — parry can negate all damage; build defense if you plan to be attacked often
- **Round timing matters** — attacks only count during active rounds; coordinate with allies to concentrate damage in a single round
- **Spy before attacking** — use `gatherIntel` to see enemy strength, then `disruptHappiness` to weaken them

### Economic Tips
- **Missiles and nukes are expensive** — $200 and $2,000 per day maintenance respectively
- **Spies cost $1,000/day** — don't maintain more spies than you actively use
- **War loot offsets costs** — successful wars can fund your military through reparations and loot
- **Population matters** — combat deaths remove citizens permanently; military citizens become veterans at Senior age

### Common Mistakes
- ❌ Declaring `solo_nation` when you want allies to join
- ❌ Using nukes without considering happiness/environmental fallout
- ❌ Not checking if the target has defensive war slots before declaring
- ❌ Forgetting that peace terms are only between original attacker and defender
- ❌ Over-drafting population (over 50% weighted military-eligible cuts population growth in half and triggers happiness penalties)
- ❌ Launching missiles/nukes without checking interception chances first

---

## Quick Reference

| Action | Command/Method | Cost |
|--------|---------------|------|
| Declare war | `warSystem.declareWar(data)` | War slot + casus belli |
| Join war | `warSystem.joinWar(data)` | War slot |
| Attack | `warSystem.executeAttack(data)` | 10 energy |
| Launch missile | `warSystem.launchMissile(data)` | 1 missile + 25 Intuition |
| Launch nuke | `warSystem.launchNuke(data)` | 1 nuke + 50 Intuition |
| Spy operation | `warSystem.launchSpyOperation(data)` | 1 spy + 10-60 Intuition |
| Sue for peace | `warSystem.sueForPeace(warId, nationId, terms)` | — |
| Offer peace terms | `warSystem.offerPeaceTerms(warId, nationId, terms)` | — |
| Accept peace terms | `warSystem.acceptPeaceTerms(warId, nationId)` | — |
| Reject peace terms | `warSystem.rejectPeaceTerms(warId, nationId)` | — |

### Key Limits
- **Energy per attack:** 10 (regenerates 10%/hour, max 100)
- **Missile Intuition cost:** 25
- **Nuke Intuition cost:** 50
- **Offensive war slots:** 2 base (Command Centers increase)
- **Defensive war slots:** 2 base (Command Centers increase)
- **Round duration:** 4 hours
- **Rounds per war:** Best of 3
- **Preparation time:** 15 minutes
- **Nations per side (Nation war):** 24 max
- **Alliances per side (Alliance war):** 5 max

### Casus Belli Quick Pick
| Goal | Casus Belli |
|------|-------------|
| Balanced war | `general_dispute` |
| Take land | `land_grab` |
| Maximum damage | `destruction` |
| Steal cash | `cash_raid` |
| Steal tech | `tech_raid` |
| Pure damage, no loot | `show_of_force` |
| Maximum looting | `free_looting` |
| Peace terms + long peace | `humiliation` |

Good luck, commander. May your tanks roll and your nukes find their mark.
