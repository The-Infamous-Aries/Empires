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

Military units are created as `MilitaryUnit` entities. When you recruit units:

1. **Population is consumed** from your military-eligible population (Teen through Older citizens)
2. **A MilitaryUnit entity** is created as the truth source for that unit type
3. **Your Nation's mirror count** is updated (e.g., `nation.militaryUnits.soldiers`)
4. **Nation military strength and budget** are adjusted

### Population Cost Per Unit

| Unit Type | Population Per Unit | Max from 1,000 eligible pop |
|-----------|---------------------|------------------------------|
| Soldiers | 0.1 | 10,000 |
| Tanks | 2 | 500 |
| Aircraft | 3 | 333 |
| Ships | 5 | 200 |
| Spies | 10 | 100 |
| Missiles | 0 | Unlimited |
| Nukes | 0 | Unlimited |

Missiles and nukes cost **no population** — you can build as many as your economy allows.

### Maintenance

Every unit has a daily maintenance cost:

| Unit | Cost Per Unit/Day |
|------|-------------------|
| Soldiers | $0.05 |
| Tanks | $20 |
| Aircraft | $75 |
| Ships | $200 |
| Spies | $15,000 |
| Missiles | $20,000 |
| Nukes | $50,000 |

Spies, missiles, and nukes are expensive to maintain. Don't build more than you can afford.

### Unit Strength

Each unit type has a base strength:

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
- Cheap, low strength, low population cost
- Your cannon fodder and backbone of any army
- Fast to train, easy to replace

### Tanks
- Moderate cost, good strength
- Higher population cost (2 per tank)
- Effective against most ground targets

### Aircraft
- Expensive, high strength
- Population cost: 3 per aircraft
- Key for air superiority and high damage

### Ships
- Most expensive conventional unit, very high strength
- Population cost: 5 per ship
- Essential for naval dominance

### Spies
- No combat strength, used exclusively for spy operations
- Population cost: 10 per spy (very high)
- Expensive maintenance ($15,000/day)
- **Critical:** You need spies for intel, sabotage, and virus deployment

### Missiles
- No population cost, high maintenance ($20,000/day)
- Launch for infra damage + unit kills (soldiers, tanks, aircraft, ships)
- Can be intercepted by defenses
- **No loot**

### Nukes
- No population cost, extreme maintenance ($50,000/day)
- Massive infra damage (20-65%), tech damage (2-8%), environmental damage
- Harder to intercept than missiles
- **No loot**
- Use sparingly — the happiness and environmental penalties are severe

---

## Declaring War

### Prerequisites

Before you can declare war, you need:

1. **A valid target nation** (not yourself, not already at war with them)
2. **Available offensive war slots** (base: 2, increased by Command Centers)
3. **Target must have available defensive war slots**
4. **A valid casus belli** (war reason)
5. **Compatible war type** (solo nation wars cannot involve alliance members)

### War Types

| Type | Key | Max Nations/Side | Alliance Members | Damage | Loot |
|------|-----|------------------|------------------|--------|------|
| Solo Nation | `solo_nation` | 1 | No | 1.0× | 1.0× |
| Nation | `nation` | 24 | No | 1.0× | 1.0× |
| Solo Alliance | `solo_alliance` | 1 alliance | Yes | 1.1× | 1.2× |
| Alliance | `alliance` | 5 alliances | Yes | 1.2× | 1.4× |

**Solo** wars mean no other nations can join once declared. **Non-solo** wars allow other nations to join either side up to the participant limit.

### Casus Belli (War Reasons)

| Casus Belli | Damage | Loot | Infra | Land | Tech | Pop | Best For |
|-------------|--------|------|-------|------|------|-----|----------|
| General Dispute | 1.0× | 1.0× | 1.0× | 1.0× | 1.0× | 1.0× | Balanced war |
| Land Grab | 0.9× | 0.8× | 1.1× | 2.5× | 0.6× | 1.2× | Taking land |
| Destruction | 1.5× | 0.7× | 1.6× | 0.3× | 0.5× | 1.5× | Maximum damage |
| Cash Raid | 0.8× | 2.0× | 0.9× | 0.2× | 0.4× | 0.9× | Stealing money |
| Tech Raid | 0.7× | 0.6× | 0.8× | 0.2× | 2.5× | 0.8× | Stealing tech |
| Show of Force | 2.25× | 0.0× | 1.0× | 0.0× | 0.0× | 1.0× | Pure damage, no loot |
| Free Looting | 0.5× | 1.75× | 0.5× | 1.75× | 1.75× | 0.8× | Maximum looting |
| Humiliation | 0.9× | 0.8× | 1.0× | 0.9× | 0.9× | 1.1× | Peace terms, long peace |

### Declaring

```js
// Conceptual example
warSystem.declareWar({
  attackerNationId: 'my_nation',
  defenderNationId: 'enemy_nation',
  warType: 'nation',
  casusBelliId: 'cash_raid',
  reason: 'We want their money'
});
```

There is a **15-minute preparation phase** before Round 1 begins. Use this time to let allies join.

---

## Fighting: Attacks, Rounds, & Damage

### War Rounds

Wars are **best of 3 rounds**. Each round lasts **4 real hours**. During a round:

- Nations on each side execute attacks
- Damage accumulates per side
- At round end, the side with more total damage wins the round
- First side to win 2 rounds wins the war
- If it's 1-1 after round 3, the war is a draw

### Executing an Attack

When you click "Attack":

1. **Energy check** — you need 10 energy
2. **Base damage** — calculated from your attack skill + military units + morale
3. **Critical hit** — chance based on your critical chance + luck
4. **Bonuses** — diplomatic, treaty, aim, luck, relationship (friend/foe) bonuses applied
5. **Defense** — each defending nation can parry (negate all damage), block (reduce damage), or take full damage
6. **Damage applied** to the current round
7. **Loot, unit destruction, infra damage, population casualties** calculated via War Terms System

### Defense Mechanics

When you're being attacked, your defending nation can:

| Defense | Chance | Effect |
|---------|--------|--------|
| **Parry** | `parrySkill + luck × 0.2` | Negates ALL damage, deals counter-damage |
| **Block** | `0.30 + luck × 0.1` base | Reduces damage by block + defense skill |
| **Plain defense** | Always | Reduces damage by defense skill |

High parry and block skills make you much harder to damage. Invest in defense if you plan to be a defender.

### Damage Calculation

```
baseDamage = (player.attackSkill + totalUnitDamage) × militaryMorale
totalUnitDamage = soldiers×1 + tanks×25 + aircraft×100 + ships×200 + missiles×500 + nukes×2000
```

Critical damage adds `floor(baseDamage × criticalDamageSkill)` on top.

### Relationship Bonuses

Your diplomatic relationships affect combat damage:

| Relationship | Fighting Alongside | Fighting Against |
|--------------|-------------------|------------------|
| Friend | +5% damage | — |
| Best Friend | +10% damage | — |
| Foe | — | +5% damage |
| Nemesis | — | +10% damage |

Coordinate with friends and target your nemeses for maximum effect.

---

## Missiles & Nukes

### Missiles

- **Cost:** 1 missile + 25 Intuition
- **Damage:** 500 base infra damage (modified by aim, luck, morale)
- **Unit kills:** Soldiers, tanks, aircraft, ships (0.2-0.5% each, modified by skills)
- **Interception:** Can be blocked by Iron Curtain wonder, missile defense projects, anti-missile batteries
- **If intercepted:** You get a happiness penalty; defenders get a happiness boost
- **Loot:** None

### Nukes

- **Cost:** 1 nuke + 50 Intuition
- **Damage:** 2000 base infra damage (modified by aim, luck, morale)
- **Tech damage:** 2-8% of enemy tech
- **Environmental:** -10 environment, +15 pollution per nuke hit
- **Interception:** Harder to intercept (30% penalty to interception chance)
- **If intercepted:** Larger happiness penalty/bonus than missiles
- **Loot:** None

### When to Use

| Weapon | Best Against | When |
|--------|-------------|------|
| Missiles | Infrastructure + conventional units | Softening up before ground attacks |
| Nukes | High-value targets, tech destruction | Late-game, when you can afford the penalties |

**Warning:** Nukes cause massive happiness penalties and environmental damage. Using them too often can crash your own nation's stability.

---

## Spy Operations

You need spies to run spy operations. Each operation costs 1 spy + Intuition.

| Operation | Intel Cost | What It Does |
|-----------|-----------|--------------|
| Gather Intel | 10 | See enemy population, military, happiness, infra, tech |
| Disrupt Happiness | 15 | Reduce enemy happiness by 5-25% |
| Target Infrastructure | 20 | Destroy 5-15% of enemy infra |
| Target Technology | 25 | Destroy 5-20% of enemy tech |
| Target Soldiers | 15 | Kill 10-20% of enemy soldiers |
| Target Tanks | 18 | Kill 8-25% of enemy tanks |
| Target Aircraft | 20 | Kill 10-35% of enemy aircraft |
| Target Ships | 22 | Kill 12-40% of enemy ships |
| Target Missiles | 30 | Destroy 15-45% of enemy missiles |
| Target Nukes | 35 | Destroy 20-45% of enemy nukes |
| Assassinate Spies | 40 | Kill 25-45% of enemy spies |
| Deploy Virus | 60 | Infect enemy with Minor Disease (3-7 days) |

### Success Chance

Success is based on:
- **Spy advantage** — more attacking spies than defending spies = higher success
- **Aim skill** — increases success chance
- **Luck skill** — increases success chance
- **Defending spies** — more enemy spies = lower success (defense penalty)
- **Random factor** — ±10%

**Failed operations** have a 30% chance of losing one of your spies.

### Deploy Virus

The virus operation is unique. It uses a complex formula and, if successful, spawns a Minor Disease on the target nation lasting 3-7 days, plus a happiness penalty.

---

## Peace Negotiations

Peace can only be negotiated between the **original attacker and original defender**. Joiners cannot offer or accept peace terms.

### Three Steps

1. **Sue for Peace** — initiates a negotiation (pending status)
2. **Offer Peace Terms** — one side makes a formal offer (must be valid per War Terms System)
3. **Accept or Reject** — the other side accepts (ends war with terms) or rejects (war continues)

### Peace Term Types

| Term | Description | Allowed Casus Belli | Max Value |
|------|-------------|---------------------|-----------|
| Land Annexation | Take % of enemy land | land_grab, humiliation, free_looting | 20% (land_grab), 15% (free_looting), 10% (humiliation) |
| Cash Reparations | Take % of enemy cash | cash_raid, humiliation, free_looting | 33% (cash_raid), 25% (free_looting), 20% (humiliation) |
| Tech Transfer | Take % of enemy tech | tech_raid, humiliation, free_looting | 15% (tech_raid), 12% (free_looting), 10% (humiliation) |
| Peace Length | Force peace for X days | Any | 365 days (humiliation), 180 (show_of_force), 90 (default) |
| Nothing (White Peace) | End war with no terms | Any | — |

### Strategy

- If you want **land**, declare with `land_grab`
- If you want **cash**, declare with `cash_raid`
- If you want **tech**, declare with `tech_raid`
- If you want to **humiliate** and force long peace, use `humiliation`
- If you just want to **deal maximum damage**, use `show_of_force` or `destruction`
- If you want to **loot everything**, use `free_looting`

---

## War Outcomes & Reparations

When a war ends:

1. **Winner determined** by rounds won (attacker, defender, or draw)
2. **Treaty obligations enforced** — penalties for unfulfilled alliance treaty obligations (cash fines, happiness reduction, relationship damage)
3. **Reparations calculated** — 1% of total damage dealt, split among winners by damage contribution
4. **Outcome processed:**
   - **Winners:** 1000 XP, wars won stat, reparations loot, +5 happiness bonus (3 days)
   - **Losers:** 250 XP, wars lost stat, pay reparations, -3 happiness (2 days)
5. **War archived** to historical record (permanent)
6. **Cumulative nation stats updated**

Reparations are paid by losers to winners based on damage dealt during the war.

---

## Treaty Obligations

If your alliance has treaties, you may be obligated to participate in wars:

| Treaty Type | Obligated When | Required Participation | Penalty if Unfulfilled |
|-------------|---------------|----------------------|------------------------|
| Protectorate | Any war | 20% of alliance | $500,000 |
| Extension | Any war | 20% of alliance | $500,000 |
| Mutual Defense | Defensive war | 20% of alliance | $250,000 |
| Mutual Aggression | Offensive war | 20% of alliance | $250,000 |
| Optional Defense | Defensive war | 10% of alliance | $100,000 |
| Optional Aggression | Offensive war | 10% of alliance | $100,000 |

If required participation isn't met by war end, each participating nation of the obligated alliance pays the cash penalty, gets a happiness reduction, and takes relationship damage with treaty partners.

---

## Relationship Bonuses

Your diplomatic relationships with other nations give combat bonuses:

| Relationship | Fighting Alongside (same side) | Fighting Against (opposing side) |
|--------------|-------------------------------|----------------------------------|
| Friend | +5% damage | — |
| Best Friend | +10% damage | — |
| Foe | — | +5% damage |
| Nemesis | — | +10% damage |

These are tracked per nation pair for leaderboards. Fight alongside your friends, attack your nemeses.

---

## Tips & Tricks

### Early Game
- **Build soldiers first** — cheap, low population cost, easy to replace
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

### Combat Tips
- **Attack when you have energy** — don't let it cap at 100; use it or lose it
- **Critical hits matter** — invest in critical chance and critical damage skills
- **Defenders have advantages** — parry can negate all damage; build defense if you plan to be attacked often
- **Round timing matters** — attacks only count during active rounds; coordinate with allies to concentrate damage in a single round
- **Spy before attacking** — use `gatherIntel` to see enemy strength, then `disruptHappiness` to weaken them

### Economic Tips
- **Missiles and nukes are expensive** — $20,000 and $50,000 per day maintenance respectively
- **Spies cost $15,000/day** — don't maintain more spies than you actively use
- **War loot offsets costs** — successful wars can fund your military through reparations and loot
- **Population matters** — losing soldiers in war reduces your population permanently (combat deaths are not returned)

### Common Mistakes
- ❌ Declaring `solo_nation` when you want allies to join
- ❌ Using nukes without considering happiness/environmental fallout
- ❌ Not checking if the target has defensive war slots before declaring
- ❌ Forgetting that peace terms are only between original attacker and defender
- ❌ Over-drafting population (over 50% military-eligible cuts population growth in half)
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
