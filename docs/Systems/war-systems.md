# War System

The **War System** (`WarSystem`) is the core combat and battle mechanics engine for Dominion Wars. It manages war declarations, joining wars, attacks, missiles, nukes, spy operations, peace negotiations, rounds, war outcomes, and cumulative war statistics.

| Item | Value |
|------|-------|
| **Class:** | `WarSystem` |
| **Global instance:** | `window.WarSystem` |
| **Source file:** | `systems/war-system.js` |
| **Loaded in:** | `index.html` (after `systems/alliance-system.js`, before `ui/live/game.js`) |
| **Depends on:** | `WarTermsSystem` (loot/peace/casus belli formulas), `MilitaryUnit` (unit truth source), `PopulationSystem` (population truth source), `EventBus`, `EconomySystem`, `DiplomacySystem`, `ImprovementsSystem`, `AllianceSystem`, `MotionSystem` |
| **Save/Load:** | Partial — `archiveWar()` persists completed wars to `historicalWars`; active wars are not serialized |

---

## Overview

A war is a structured conflict between two **sides** (Attacker vs Defender). Each side can contain one or more nations, and wars progress in **rounds** (best of 3, 4 hours per round). Wars can be:

- **Solo Nation** — 1v1 nation war, no one else can join, alliance members excluded
- **Nation** — NvN, up to 24 nations per side can join, alliance members allowed
- **Solo Alliance** — 1v1 alliance war, all members of each alliance participate
- **Alliance** — AvA, up to 5 alliances per side can join

Every war has a **casus belli** (reason for war) which determines damage, loot, infra, and population multipliers, plus which peace terms are available.

---

## Architecture

### Core Data Structures

```
activeWars          Map<warId, war>       — currently active wars
historicalWars      Map<warId, war>       — completed wars (permanent archive)
nationWarStats      Map<nationId, stats>  — cumulative per-nation stats across all wars
relationshipCombatStats Map<nationId, {...}> — friend/foe combat tracking
roundTimeouts       Map<warId, timeoutId> — scheduled round timers
energyIntervalId    number                — energy regeneration interval
warTermsSystem      WarTermsSystem        — truth source for war terms formulas
```

### War Object Structure

```js
{
  id: 'war_1',
  warType: 'nation',              // solo_nation | nation | solo_alliance | alliance
  casusBelliId: 'general_dispute',
  casusBelli: {...},              // casus belli config copy
  warTypeMod: {...},              // war type config copy
  solo: false,                    // true if no one else can join
  reason: 'Territorial Dispute',
  startTime: <timestamp>,         // when prep phase ends and round 1 begins
  status: 'preparing',            // preparing | active | ended
  currentRound: 0,
  rounds: [],                     // array of round objects
  originalAttacker: 'nation_A',
  originalDefender: 'nation_B',
  sides: {
    attacker: {
      nations: ['nation_A'],      // nation IDs on this side
      alliances: new Set(),       // alliance IDs on this side
      totalDamage: 0,
      totalDamageReceived: 0,
      totalLootGained: 0,
      totalLootLost: 0,
      roundsWon: 0,
      units: {...},               // military unit summary per nation
      militaryUnitEntities: Map<type, MilitaryUnit>,  // truth source per unit type
      damageRankings: Map<nationId, damage>,
      damageReceivedRankings: Map<nationId, damage>,
      allianceRankings: Map<allianceId, damage>,
      missilesFired: 0,
      nukesFired: 0,
      spyOperations: Map<nationId, [...]>
    },
    defender: { ... same structure ... }
  },
  treatyObligations: Map<allianceId, {...}>,  // alliance treaty obligations
  totalAttacks: 0,
  participantStats: Map<nationId, {...}>       // per-nation combat stats
}
```

### Round Object Structure

```js
{
  number: 1,
  startTime: <timestamp>,
  endTime: <timestamp>,           // +4 hours from start
  damage: { attacker: 0, defender: 0 },
  winner: null,                   // 'attacker' | 'defender' | 'draw'
  attacks: []
}
```

### Participant Stats Structure

```js
{
  attacks: 0,
  damage: 0,
  damageReceived: 0,
  criticalHits: 0,
  blocks: 0,
  parries: 0,
  unitsLost: { soldiers: 0, tanks: 0, ... },
  unitsKilled: { soldiers: 0, tanks: 0, ... },
  infraDestroyed: 0,
  infraReceived: 0,
  lootGained: 0,
  lootLost: 0
}
```

---

## War Lifecycle

### 1. Declaration (`declareWar`)

A nation declares war on another nation. Validation includes:

- War type must be valid (`solo_nation`, `nation`, `solo_alliance`, `alliance`)
- Casus belli must be valid
- Attacker and defender cannot be the same nation
- Both nations must exist
- Solo wars cannot involve alliance members (unless war type is alliance-based)
- Attacker must have available offensive war slots (Command Centers increase capacity)
- Defender must have available defensive war slots
- Nations must not already be at war with each other

On success:
- A new war is created with status `preparing`
- Both nations are registered with `WarTermsSystem`
- Treaty obligations are processed for alliance members
- A preparation timer starts (15 minutes by default)
- When prep ends, `startWarRound` begins Round 1 and sets status to `active`

**Events emitted:** `war_declared`

### 2. Joining (`joinWar`)

Other nations can join an existing war if:
- The war is not `solo`
- The war status is `preparing` or `active`
- The nation is not already participating
- War type compatibility is respected — `solo_nation` cannot include alliance members; `nation` type allows alliance members
- Participant limits per side are respected (war type modifier)
- The joining nation has appropriate war slots (offensive if joining attacker, defensive if joining defender)

**Events emitted:** `war_joined`

### 3. Combat Round (`startWarRound` / `endWarRound`)

Each round lasts **4 hours**. During a round:
- Nations on each side execute attacks (`executeAttack`)
- Damage is accumulated per side
- At round end, the side with more damage wins the round
- Best of 3 — war ends when a side wins 2 rounds, or after round 3 (draw if 1-1)

**Events emitted:** `war_round_started`, `war_round_ended`

### 4. Attack Execution (`executeAttack`)

The full attack flow:

1. **Validation** — war must be active, attacker must be participating, attacker must have sufficient energy (10 per attack)
2. **Energy consumed** from the attacker's player
3. **Base damage** calculated from player attack skill + military unit contributions + morale
4. **Critical hit** roll — if crit, critical damage is added
5. **Bonuses applied** — diplomatic, treaty, aim, luck, relationship (friend/foe)
6. **Defense processed** for all defending nations — parry, block, or plain defense reduction
7. **Damage applied** to the current round
8. **Loot calculated** via `WarTermsSystem.calculateAttackLoot`
9. **Unit destruction** calculated via `WarTermsSystem.calculateUnitsDestroyed`
10. **Infrastructure destruction** calculated via `WarTermsSystem.calculateInfraDestruction`
11. **Population casualties** calculated via `WarTermsSystem.calculatePopulationCasualties`
12. **Statistics updated** — damage, loot, infra, units killed/lost
13. **Relationship combat stats** tracked for leaderboards
14. **Casualties** — each nation on a side takes casualties proportional to the damage it received in that round (not equal % across all nations). Casualties are recorded via `PopulationSystem.recordMilitaryCombatDeaths()` and reduce `Nation.militaryUnits[unitType]` as well as the `MilitaryUnit` entity truth source.

**Events emitted:** `war_attack_executed`

### 5. Missile Launch (`launchMissile`)

- Requires: active war, attacker participating, nation has missiles, sufficient Intuition (25)
- Consumes: 1 missile, 25 Intuition
- Interception checked against target side (wonders, projects, improvements)
- If intercepted: attacker gets happiness penalty, defenders get happiness boost
- If hit: infra damage + unit kills (soldiers, tanks, aircraft, ships) applied to all target nations; combat deaths recorded in Population System
- **Missiles yield no loot**

**Events emitted:** `missile_intercepted` or `missile_hit`

### 6. Nuke Launch (`launchNuke`)

- Requires: active war, attacker participating, nation has nukes, sufficient Intuition (50)
- Consumes: 1 nuke, 50 Intuition
- Interception checked (nukes are harder to intercept — 30% penalty)
- If intercepted: larger happiness penalty/bonus than missiles
- If hit: massive infra damage (20-65%), tech damage (2-8%), environmental damage, pollution increase; combat deaths recorded in Population System
- **Nukes yield no loot**

**Events emitted:** `nuke_intercepted` or `nuke_hit`

### 7. Spy Operation (`launchSpyOperation`)

- Requires: active war, attacker participating, target on opposing side, nation has spies, sufficient Intuition (operation cost)
- Consumes: 1 spy (deducted from attacker), Intuition cost (varies by operation)

| Operation | Intuition Cost | Effect |
|-----------|---------------|--------|
| `gatherIntel` | 10 | Reveals target's population, military units, happiness, infra, tech |
| `disruptHappiness` | 15 | Reduces target happiness by 5-25% (min 2 points) |
| `targetInfra` | 20 | Destroys 5-15% of target infra (min 1 point) |
| `targetTech` | 25 | Destroys 5-20% of target tech (min 5 points) |
| `targetSoldiers` | 15 | Kills 10-20% of target soldiers (min 10) |
| `targetTanks` | 18 | Kills 8-25% of target tanks (min 3) |
| `targetAircraft` | 20 | Kills 10-35% of target aircraft (min 2) |
| `targetShips` | 22 | Kills 12-40% of target ships (min 1) |
| `targetMissiles` | 30 | Destroys 15-45% of target missiles (min 1) |
| `targetNukes` | 35 | Destroys 20-45% of target nukes (min 1) |
| `assassinateSpies` | 40 | Kills 25-45% of target spies (min 1) |
| `deployVirus` | 60 | Spawns Minor Disease on target (3-7 days) + happiness penalty |

- Failed operations have a 30% chance of losing a spy
- **Deploy Virus** uses a complex formula based on spy counts, aim, luck, and defense penalty

**Events emitted:** `spy_operation_executed`

### 8. Peace Negotiations

Peace can be negotiated through three steps:

1. **Sue for Peace** (`sueForPeace`) — initiates a peace negotiation, pending status
2. **Offer Peace Terms** (`offerPeaceTerms`) — formal offer from one side, status becomes `offered`. Terms are validated via `WarTermsSystem.validatePeaceTerm`
3. **Accept/Reject** (`acceptPeaceTerms` / `rejectPeaceTerms`) — the other side accepts or rejects

**Important:** Peace terms can only be offered/accepted between the **original attacker and original defender**. Joiners cannot participate in peace terms.

Allowed peace term types:
- `land_annexation` — transfer land % (requires land_grab, humiliation, or free_looting)
- `cash_reparations` — transfer cash % (requires cash_raid, humiliation, or free_looting)
- `tech_transfer` — transfer tech % (requires tech_raid, humiliation, or free_looting)
- `peace_length` — mandatory peace days (allowed with any casus belli)
- `nothing` — white peace, no terms (always allowed)

**Events emitted:** `peace_sued`, `peace_terms_offered`, `peace_terms_accepted`, `peace_terms_rejected`

### 9. War End (`endWar`)

When a war ends:
- Winner determined by rounds won (attacker, defender, or draw)
- Treaty obligations enforced — penalties for unfulfilled obligations (cash penalty, happiness reduction, relationship damage)
- War reparations calculated via `WarTermsSystem.calculateCashReparations`
- War outcome processed — winners get experience + reparations loot + happiness bonus; losers get lesser experience + pay reparations + happiness penalty
- War archived to `historicalWars` (permanent record)
- Cumulative nation war stats updated
- War removed from `activeWars` after 24 hours

**Events emitted:** `war_ended`

---

## Energy & Intuition Systems

### Energy (for regular attacks)
- Cost: 10 energy per attack
- Regeneration: 10% of max energy per hour (max 100)
- Tracked per player via `getCurrentEnergy()` / `consumeEnergy()`
- Applies to both single player (`window.Player`) and multiplayer players via `DataManager`

### Intuition (for missiles, nukes, spy ops)
- Missile cost: 25 Intuition
- Nuke cost: 50 Intuition
- Spy op costs: 10-60 Intuition depending on operation
- Tracked per player via `getCurrentIntuition()` / `consumeIntuition()`

---

## War Slots

Nations have limited war capacity:

| Slot Type | Base Capacity | Increased By |
|-----------|--------------|--------------|
| Offensive wars | 2 | `projectEffects.offensiveWarSlots` (Command Centers) |
| Defensive wars | 2 | `projectEffects.defensiveWarSlots` (Command Centers) |

A nation cannot declare war or join as attacker if it has no **active** offensive war slots (wars in `preparing` status do not count). Same for defensive slots on the defender side.

---

## Treaty Obligations

When a war is declared, alliance treaties are checked:

| Treaty Type | Obligated When | Required Participation | Cash Penalty (if unfulfilled) |
|-------------|---------------|----------------------|-------------------------------|
| protectorate | Any war | 20% | $500,000 |
| extension | Any war | 20% | $500,000 |
| mutual_defense | Defensive war | 20% | $250,000 |
| mutual_aggression | Offensive war | 20% | $250,000 |
| optional_defense | Defensive war | 10% | $100,000 |
| optional_aggression | Offensive war | 10% | $100,000 |
| intelligence_sharing | Never | — | — |
| peace_treaty | Never | — | — |

Unfulfilled obligations at war end apply cash penalties, happiness reduction, and relationship damage with treaty partners.

---

## Relationship Combat Bonuses

During attacks, relationship bonuses apply based on the `DiplomacySystem`:

| Relationship | Same Side (fighting alongside) | Opposing Side (fighting against) |
|--------------|-------------------------------|----------------------------------|
| Friend | +5% damage | — |
| Best Friend | +10% damage | — |
| Foe | — | +5% damage |
| Nemesis | — | +10% damage |

These bonuses are tracked in `relationshipCombatStats` for leaderboards.

---

## Damage & Defense Calculation

### Base Damage
```
baseDamage = (player.attackSkill + totalUnitDamage) * militaryMorale
```
Unit damage values: soldiers ×1, tanks ×25, aircraft ×100, ships ×200, missiles ×500, nukes ×2000

### Critical Hit
```
critChance = min(0.95, criticalChanceSkill + luckSkill * 0.1)
critDamage = floor(baseDamage * criticalDamageSkill)
```

### Defense (per defending nation)
1. **Parry roll** — `parrySkill + luck * 0.2`. If successful: full damage negated, counter-damage = defense skill (+ critical damage if crit)
2. **Block roll** — `0.30 + luck * 0.1` base chance. If successful: damage reduced by block + defense skill
3. **No block** — damage reduced by defense skill only

---

## Methods Reference

### War Management
| Method | Description |
|--------|-------------|
| `declareWar(data)` | Declare war between two nations |
| `joinWar(data)` | Join an existing war |
| `executeAttack(data)` | Execute an attack in war |
| `launchMissile(data)` | Launch a missile |
| `launchNuke(data)` | Launch a nuke |
| `launchSpyOperation(data)` | Launch a spy operation |
| `sueForPeace(warId, nationId, terms)` | Sue for peace |
| `offerPeaceTerms(warId, nationId, terms)` | Offer peace terms |
| `acceptPeaceTerms(warId, nationId)` | Accept peace terms |
| `rejectPeaceTerms(warId, nationId)` | Reject peace terms |
| `endWar(warId)` | End a war and determine winner |
| `processRoundEnd(data)` | Handle round timer event |

### Queries
| Method | Description |
|--------|-------------|
| `getActiveWars()` | Returns all active wars |
| `getWar(warId)` | Get a specific active war |
| `getHistoricalWars()` | Returns all archived wars |
| `getHistoricalWar(warId)` | Get a specific archived war |
| `getWarSummary(warId)` | Get comprehensive war summary |
| `getWarsForNation(nationId)` | Get active wars for a nation |
| `getNationWarHistory(nationId)` | Get active + historical war history |
| `getCumulativeNationWarStats(nationId)` | Get cumulative stats across all wars |
| `getWarStats(nationId)` | Get war stats (active + cumulative) |
| `getDamageRankings(warId)` | Get damage rankings for a war |
| `getRelationshipCombatStats(nationId)` | Get relationship combat stats |
| `getAllRelationshipCombatStats()` | Get all relationship combat stats |
| `getTreatyObligationsStatus(warId)` | Get treaty obligation status |
| `getCasusBelliTypes()` | Get all casus belli types |
| `getWarTypeModifiers()` | Get all war type modifiers |
| `getPeaceTermTypes()` | Get all peace term types |

### War Terms Delegation (pass-through to WarTermsSystem)
| Method | Description |
|--------|-------------|
| `calculateAttackLoot(...)` | Calculate loot from damage dealt |
| `calculateUnitsDestroyed(...)` | Calculate unit losses |
| `calculateInfraDestruction(...)` | Calculate infra damage |
| `calculatePopulationCasualties(...)` | Calculate population casualties |
| `calculateCashReparations(...)` | Calculate cash reparations |
| `calculateTechLoot(...)` | Calculate tech loot |
| `calculateLandAnnexation(...)` | Calculate land annexation |
| `calculateWarRoundLoot(...)` | Calculate round loot |
| `validatePeaceTerm(...)` | Validate a peace term |
| `applyPeaceTerms(...)` | Apply accepted peace terms |

### Utility
| Method | Description |
|--------|-------------|
| `getNationById(id)` | Resolve nation by ID — checks `window.Nation`, DataManager nations, GameEngine nations |
| `getPlayerByNationId(id)` | Resolve player by nation ID — checks `window.Player`, DataManager players, GameEngine players |
| `getAllianceById(id)` | Resolve alliance by ID |
| `getAttackerSide(war, nationId)` | Get which side a nation is on |
| `getWarByNationId(nationId)` | Find war involving a nation |
| `hasAvailableOffensiveSlots(nation)` | Check offensive war capacity (only active wars count) |
| `hasAvailableDefensiveSlots(nation)` | Check defensive war capacity (only active wars count) |
| `areNationsAtWar(id1, id2)` | Check if two nations are at war |
| `canDeclareWar(id1, id2)` | Check if war can be declared (peace treaties) |
| `destroy()` | Clean up timers and event listeners |
| `safeEmit(event, data)` | Safely emit EventBus event |

---

## Event Reference

| Event | Data | When |
|-------|------|------|
| `war_declared` | `{ warId, warType, war, attacker, defender }` | War declared |
| `war_declaration_failed` | `{ error, data }` | Declaration failed |
| `war_joined` | `{ warId, nationId, side, nation }` | Nation joined war |
| `join_war_failed` | `{ error, data }` | Join failed |
| `war_attack_executed` | `{ warId, attacker, damage, isCritical, defenseDamage }` | Attack executed |
| `war_attack_failed` | `{ error, data }` | Attack failed |
| `missile_hit` | `{ warId, attacker, targetSide, damage }` | Missile hit |
| `missile_intercepted` | `{ warId, attacker, interceptedBy }` | Missile intercepted |
| `missile_launch_failed` | `{ error, data }` | Missile launch failed |
| `nuke_hit` | `{ warId, attacker, targetSide, damage }` | Nuke hit |
| `nuke_intercepted` | `{ warId, attacker, interceptedBy }` | Nuke intercepted |
| `nuke_launch_failed` | `{ error, data }` | Nuke launch failed |
| `spy_operation_executed` | `{ warId, attacker, target, operation, result }` | Spy op executed |
| `spy_operation_failed` | `{ error, data }` | Spy op failed |
| `peace_sued` | `{ warId, suingNationId, suingNation, terms }` | Sue for peace |
| `peace_terms_offered` | `{ warId, offeringNationId, offeringNation, terms }` | Terms offered |
| `peace_terms_accepted` | `{ warId, acceptingNationId, acceptingNation, terms, effects }` | Terms accepted |
| `peace_terms_rejected` | `{ warId, rejectingNationId, rejectingNation }` | Terms rejected |
| `war_round_started` | `{ warId, round, war }` | Round started |
| `war_round_ended` | `{ warId, round, war }` | Round ended |
| `war_ended` | `{ warId, war, winner, reparations }` | War ended |
| `energy_regeneration_tick` | — | Energy regen tick |
| `treaty_obligation_created` | `{ warId, obligatedAllianceId, treatyType, requiredParticipation }` | Treaty obligation created |
| `treaty_obligation_fulfilled` | `{ warId, allianceId, treatyType, participationPercent }` | Obligation fulfilled |

---

## Design Notes

- **Missiles and nukes yield zero loot** — they are launched/used, not killed in combat for loot (handled by `WarTermsSystem` with 0 loot multiplier)
- **No unit destroys infra when killed** — infra damage comes solely from damage dealt (0.2% of damage × casus belli × war type multipliers)
- **Only starting nations** (original attacker and defender) can offer/receive peace terms — joiners are excluded
- **War type** defines scale/size (Nation vs Alliance, solo vs not solo); **casus belli** defines the reason for war. They are picked separately.
- **`show_of_force`** deals 2.25× damage but yields zero loot — only peace length can be demanded
- **`free_looting`** deals minimal damage (0.5×) but yields maximum loot multipliers (1.75×) for cash, tech, and land
- **`humiliation`** is peace-seeking — lower damage/loot but allows all peace terms and the longest peace length (365 days)
- **Energy regeneration** runs hourly via `setInterval`; round timers use `setTimeout` and are tracked in `roundTimeouts` for cleanup; cleared on war end
- **Per-nation casualties** — casualties are distributed per-nation based on each nation's damage received, not equally across all nations on a side
- **Side unit summary** — `side.units[unitType]` is kept in sync with `Nation.militaryUnits[unitType]` after casualties to prevent drift
- **`destroy()`** clears all timers (including round timeouts for active wars), active wars, and unbinds all EventBus listeners
- **`getNationById()` / `getPlayerByNationId()`** support multi-nation/multi-player lookups via `DataManager` and `GameEngine` fallbacks
- **Treaty obligations** use `partnerAllianceId` (not `partnerId`) for partner notification; diplomacy null-safe with optional chaining
