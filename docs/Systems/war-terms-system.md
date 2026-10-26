# War Terms System

The War Terms System is the **truth source** for all war terms mechanics used by WarSystem. It handles casus belli types, war type modifiers/boosts, peace mechanics (offer terms: Land/Cash/Tech/Peace Length/White Peace), loot/destruction formulas based on damage dealt, unit type, tech, player skills, casus belli, and war type, plus currency conversion via EconomySystem.

## Overview

| Item | Value |
|------|-------|
| **System class:** | `WarTermsSystem` |
| **Global instance:** | `window.WarTermsSystem` |
| **Primary config:** | `systems/war-terms-system.js` |
| **Consumed by:** | `systems/war-system.js` (`WarSystem`) |

---

## Casus Belli (War Causes)

Casus belli defines *why* a nation is going to war. Each casus belli provides damage, loot, infra, and population multipliers, plus peace term eligibility.

| Casus Belli | Key | Damage | Infra Damage | Loot | Tech Loot | Land Loot | Population Penalty | Max Peace Days | Notes |
|-------------|-----|--------|--------------|------|-----------|-----------|--------------------|----------------|-------|
| General Dispute | `general_dispute` | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | — | Standard war, no special modifiers |
| Land Grab | `land_grab` | 0.9 | 1.1 | 0.8 | 0.6 | 2.5 | 1.2 | — | Bonus to land annexation |
| Destruction | `destruction` | 1.5 | 1.6 | 0.7 | 0.5 | 0.3 | 1.5 | — | Maximum damage focus |
| Cash Raid | `cash_raid` | 0.8 | 0.9 | 2.0 | 0.4 | 0.2 | 0.9 | — | Bonus to cash looting |
| Tech Raid | `tech_raid` | 0.7 | 0.8 | 0.6 | 2.5 | 0.2 | 0.8 | — | Bonus to tech looting |
| Show of Force | `show_of_force` | 2.25 | 1.0 | 0.0 | 0.0 | 0.0 | 1.0 | — | Heavy damage boost, no looting |
| Free Looting | `free_looting` | 0.5 | 0.5 | 1.75 | 1.75 | 1.75 | 0.8 | — | Minimal damage, high loot |
| Humiliation | `humiliation` | 0.9 | 1.0 | 0.8 | 0.9 | 0.9 | 1.1 | — | Peace-seeking, lower damage/loot |

### Damage Multiplier
Applied to damage dealt in combat. `destruction` (1.5) and `show_of_force` (2.25) deal the most damage; `free_looting` (0.5) and `tech_raid` (0.7) deal the least.

### Loot Multiplier
Applied to cash/tech/land loot calculations. `cash_raid` (2.0) and `free_looting` (1.75) loot the most; `show_of_force` (0.0) and `destruction` (0.7) loot the least.

---

## Peace Term Types

Peace terms define what the winner can demand from the loser at the end of a war. Each term has a casus-belli-specific maximum value.

### Land Annexation (`land_annexation`)
Transfers land/territory from loser to winner.

| Casus Belli | Max Percentage |
|-------------|----------------|
| `land_grab` | 20% |
| `free_looting` | 15% |
| `humiliation` | 10% |
| Default (any other) | 10% |

**Allowed casus belli:** `land_grab`, `humiliation`, `free_looting`

### Cash Reparations (`cash_reparations`)
Transfers currency from loser to winner.

| Casus Belli | Max Percentage |
|-------------|----------------|
| `cash_raid` | 33% |
| `free_looting` | 25% |
| `humiliation` | 20% |
| Default (any other) | 15% |

**Allowed casus belli:** `cash_raid`, `humiliation`, `free_looting`

### Technology Transfer (`tech_transfer`)
Transfers technology points from loser to winner.

| Casus Belli | Max Percentage |
|-------------|----------------|
| `tech_raid` | 15% |
| `free_looting` | 12% |
| `humiliation` | 10% |
| Default (any other) | 5% |

**Allowed casus belli:** `tech_raid`, `humiliation`, `free_looting`

### Peace Length (`peace_length`)
Mandatory peace period — neither nation can declare war on the other.

| Casus Belli | Max Days |
|-------------|----------|
| `humiliation` | 365 (1 real-life year) |
| `show_of_force` | 180 |
| Default (any other) | 90 |

**Allowed casus belli:** Any casus belli can request peace length (`requiresCasusBelli: null`).

### White Peace (`nothing`)
Ends the war with no terms (status quo ante bellum). Allowed with any casus belli.

---

## Loot Formula (`calculateAttackLoot`)

Loot is gained from **damage dealt in an attack**, not from destroying specific units. The formula combines unit type mix, attacker tech, player skills, casus belli, war type, and a random integer.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `damageDealt` | number | Total damage dealt in the attack |
| `unitMix` | object | Unit types involved `{ soldiers: n, tanks: n, aircraft: n, ships: n, spies: n }` |
| `attackerTech` | number | Attacker nation's tech level |
| `attackerSkills` | object | `{ aim, luck, criticalChance, criticalDamage, attack, defense, block, parry }` |
| `casusBelliId` | string | The casus belli ID |
| `warTypeId` | string | The war type ID |
| `randomInt` | number | Random integer 0-100 for loot variance |

### Calculation

```
baseValue = damageDealt × 0.005                          // 0.5% of damage becomes loot value

unitMultiplier = weighted average of unitLootMultipliers
  soldiers: 1.0
  tanks: 1.1
  aircraft: 1.25
  ships: 1.5
  spies: 2.0
  missiles: 0.0
  nukes: 0.0

techMultiplier = 1 + (attackerTech × 0.00005)
skillMultiplier = 1 + aim + luck + (criticalChance × criticalDamage × 0.1)
randomFactor = 0.5 + (randomInt / 100) × (2.0 - 0.5)     // 0.5x to 2.0x

cash = floor(baseValue × unitMultiplier × techMultiplier × skillMultiplier × cbLootMod × warTypeLootMod × randomFactor)
tech = floor(cash × 0.05)
```

### Unit Loot Multipliers

Higher-tier units yield slightly more loot per damage dealt. Missiles and nukes yield **zero loot** — they are launched/used, not killed in combat for loot.

| Unit Type | Multiplier |
|-----------|------------|
| soldiers | 1.0 |
| tanks | 1.1 |
| aircraft | 1.25 |
| ships | 1.5 |
| spies | 2.0 |
| missiles | 0.0 |
| nukes | 0.0 |

---

## Unit Destruction Formula (`calculateUnitsDestroyed`)

Units are destroyed/lost based on combat damage between attacker and defender. Only **starting nations** count (joiners excluded).

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `attackerDamage` | number | Damage dealt by the side clicking "attack" |
| `defenderDamage` | number | Counter-damage dealt by the other side |
| `attackerSkills` | object | Skills of the side clicking attack (uses `.attack`) |
| `defenderSkills` | object | Skills of the side being attacked (uses `.defense`, `.block`, `.parry`) |
| `attackerTech` | number | Tech of the side clicking attack |
| `defenderTech` | number | Tech of the side being attacked |
| `casusBelliId` | string | The casus belli ID |
| `warTypeId` | string | The war type ID |

### Calculation

```
attackerAttackPower = attackerSkills.attack + (attackerTech × 0.1)
defenderDefensePower = defenderSkills.defense + (defenderTech × 0.1)

mitigation = defenderDefensePower / (attackerAttackPower + defenderDefensePower + 1)   // 0 to 1

defenderUnitsLost = floor((attackerDamage × cbDamageMod × warTypeDamageMod) / 50 × (1 - mitigation))
attackerUnitsLost = floor((defenderDamage × cbDamageMod × warTypeDamageMod) / 50 × mitigation)
```

- **Attacker** uses **Attack** skill (who clicks "attack" on the war screen).
- **Defender** uses **Defense** skill (the side being attacked).
- Both attacking and defending sides can "attack" in war to build up damage — "attacker" means whoever clicked the attack button right now, not who declared war.
- `mitigation` ranges from 0 (no defense) to near 1 (overwhelming defense).
- Returns `{ attackerUnitsLost, defenderUnitsLost, mitigation }`.

---

## Infrastructure Destruction Formula (`calculateInfraDestruction`)

Infrastructure damage comes from **damage dealt only** — no unit destroys infra when killed.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `damageDealt` | number | Total damage dealt |
| `casusBelliId` | string | The casus belli ID |
| `warTypeId` | string | The war type ID |

### Calculation

```
infraFromDamage = damageDealt × 0.002 × cbInfraMod × warTypeDamageMod
```

Returns `{ infraFromDamage, infraFromUnits: 0, totalInfra }`.

Missiles and nukes launched separately handle their own infra damage in WarSystem.

---

## Population Casualties Formula (`calculatePopulationCasualties`)

Population casualties are based on units lost by each side.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `unitsLost` | object | `{ soldiers: n, tanks: n, aircraft: n, ships: n, spies: n }` |
| `casusBelliId` | string | The casus belli ID |

### Calculation

```
totalPopulation = sum(unitsLost[type] × unitDestructionValues[type].population)
result = floor(totalPopulation × cbPopulationPenaltyMod)
```

### Unit Population Values

| Unit Type | Population per Unit |
|-----------|---------------------|
| soldiers | 1 |
| tanks | 2 |
| aircraft | 3 |
| ships | 5 |
| spies | 1 |
| missiles | 0 |
| nukes | 0 |

---

## Casus Belli-Specific Peace Term Validation (`validatePeaceTerm`)

Validates a peace term offer before it is submitted.

### Checks performed

1. **Valid term type** — termTypeId must exist in `peaceTermTypes`
2. **Casus belli compatibility** — the war's casus belli must be in the term's `requiresCasusBelli` list (or `null` for "all allowed")
3. **Term value is a finite number** — rejects `NaN`, `Infinity`, non-numbers
4. **Term value within max** — `0 <= termValue <= max` where max is casus-belli-specific

### Returns

`{ valid: true }` or `{ valid: false, error: '...' }`

---

## Creating Peace Term Offers (`createPeaceTermOffer`)

Validates the offer via `validatePeaceTerm` before creating it. Only valid offers can be submitted.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `offeringNationId` | string | ID of the nation offering terms |
| `targetNationId` | string | ID of the nation receiving terms |
| `termTypeId` | string | Peace term type (`land_annexation`, `cash_reparations`, `tech_transfer`, `peace_length`, `nothing`) |
| `termValue` | number | Value of the term (percentage or days) |
| `casusBelliId` | string | The war's casus belli ID |
| `warTypeId` | string | The war's type ID |

### Returns

`{ valid: true, offeringNationId, targetNationId, termTypeId, termTypeName, termValue, casusBelliId, warTypeId, timestamp, status: 'pending' }`  
or `{ valid: false, error: '...' }`

---

## Applying Accepted Peace Terms (`applyPeaceTerms`)

Applies accepted peace terms to nations. Only **original starting nations** (attacker and defender) can offer/receive terms — joiners cannot participate.

### Restrictions

- `offeringNationId` and `targetNationId` must both be `war.originalAttacker` or `war.originalDefender`
- `offeringNationId !== targetNationId`
- Both nations must be resolvable via `getNationById`

### Term Effects

| Term Type | Effect |
|-----------|--------|
| `cash_reparations` | Transfers `termValue`% of target's cash to offering nation via EconomySystem (or direct fallback) |
| `tech_transfer` | Transfers `termValue`% of target's tech to offering nation |
| `land_annexation` | Transfers `termValue`% of target's land to offering nation |
| `peace_length` | Sets a peace period; expires at `Date.now() + days × 24h` |
| `nothing` | No effect (white peace) |

### Returns

`{ applied: true, effects: [...] }` or `{ applied: false, error: '...' }`

---

## War Type Modifiers

War type defines the *scale/size* of the war (not the reason). Applied alongside casus belli multipliers.

| War Type | Key | Max Participants/Side | Damage Mult | Loot Mult | External Joining | Alliance Members |
|----------|-----|----------------------|-------------|-----------|------------------|------------------|
| Solo Nation War | `solo_nation` | 1 | 1.0 | 1.0 | No | No |
| Nation War | `nation` | 24 | 1.0 | 1.0 | Yes | No |
| Solo Alliance War | `solo_alliance` | 1 | 1.1 | 1.2 | No | Yes |
| Alliance War | `alliance` | 5 | 1.2 | 1.4 | Yes | Yes |

### Combined Modifier (`getCombinedWarModifier`)

```
total = warTypeMod[attribute] × casusBelliMod[attribute]
```

If either is undefined for the attribute, it is treated as 1.0.

---

## Helper Methods

| Method | Description |
|--------|-------------|
| `getCasusBelliTypes()` | Returns all casus belli configs |
| `getCasusBelli(id)` | Returns a specific casus belli config or null |
| `isValidCasusBelli(id)` | Returns boolean |
| `getCasusBelliModifier(id, attribute)` | Returns a casus belli attribute value (defaults to 1.0) |
| `doesCasusBelliAllowTerm(cbId, termId)` | Checks if a casus belli allows a peace term type |
| `getWarTypeModifiers()` | Returns all war type configs |
| `getWarTypeModifier(id)` | Returns a specific war type config or null |
| `getCombinedWarModifier(wtId, cbId, attribute)` | Multiplies war type × casus belli attribute |
| `getPeaceTermTypes()` | Returns all peace term configs |
| `getPeaceTermType(id)` | Returns a specific peace term config or null |
| `getPeaceTermMax(termId, cbId)` | Returns casus-belli-specific max for a peace term |
| `validatePeaceTerm(war, offeringNationId, termTypeId, termValue)` | Validates a peace term offer |
| `createPeaceTermOffer(...)` | Creates a validated peace term offer |
| `applyPeaceTerms(war, terms, economySystem)` | Applies accepted peace terms |
| `calculateAttackLoot(...)` | Calculates loot from damage dealt |
| `calculateUnitsDestroyed(...)` | Calculates unit losses for both sides |
| `calculateInfraDestruction(damageDealt, cbId, wtId)` | Calculates infra damage from damage dealt |
| `calculatePopulationCasualties(unitsLost, cbId)` | Calculates population casualties |
| `calculateCashReparations(damageDealt, cbId, wtId)` | Calculates cash reparations (1% of damage) |
| `calculateTechLoot(enemyTech, cbId, wtId)` | Calculates tech loot (5% of enemy tech) |
| `calculateLandAnnexation(enemyLand, cbId, wtId)` | Calculates land annexation (10% of enemy land) |
| `calculateWarRoundLoot(...)` | Calculates total loot for a war round (both sides) |
| `estimateUnitMixFromDamage(damage)` | Estimates unit mix from damage magnitude |
| `getNationById(id)` | Resolves a nation by ID |
| `registerNation(nation)` / `registerNations(nations)` | Register nations for lookup |

---

## Design Notes

- **Missiles and nukes yield zero loot** — they are launched/used, not killed in combat for loot.
- **No unit destroys infra when killed** — infra damage comes solely from damage dealt (0.2% of damage × multipliers).
- **`alliance_war` is not a casus belli** — it is a war type/scale (`warTypeModifiers.alliance`), not a reason for war. Players pick war type (Nation/Alliance Solo/Not Solo) and casus belli separately.
- **Humiliation** is peace-seeking — it has lower damage/loot multipliers but allows all peace terms and the longest peace length (365 days).
- **Show of Force** deals 2.25× damage but yields zero loot — only peace length can be demanded.
- **Free Looting** deals minimal damage (0.5×) but yields maximum loot multipliers (1.75×) for cash, tech, and land.
- **Only starting nations** (original attacker and defender) can offer/receive peace terms — joiners are excluded.
- **Casus belli-specific maxes** — each peace term has different maximum values depending on the casus belli picked (e.g., only cash_raid gets 33% cash, only land_grab gets 20% land, only tech_raid gets 15% tech, only humiliation gets 365 days peace).
