# Wrestler System Documentation

**File:** `systems/Sports/wrestler-system.js`  
**Class:** `WrestlerSystem`  
**Game:** Sovereignty Epochs - Nation Ruler Roleplay Game  
**Parent:** `WrestlingSystem` (in `systems/Sports/wrestling-system.js`)

---

## Overview

The Wrestler System manages all wrestler-related logic for the Wrestling System. It handles wrestler generation, independent skills (strength, agility, endurance, charisma — completely separate from sports player skills), wrestler types, featured matches, personas/gimmicks, alignment, crowd reaction, happiness, contracts, individual fans, moves & finishers, tag team management, draft integration, injuries (weeks-based), retirement, and training.

All data (names, signatures, finishers) is imported from `assets/data/wrestling/` JSON modules, with Sports names from `assets/data/Sports/names.js` as fallback.

---

## Constructor

```js
new WrestlerSystem(wrestlingSystem)
```

**Parameter:** `wrestlingSystem` — Reference to the parent `WrestlingSystem` instance (used for ID generation and day tracking).

### Initialization

On construction, the system:

1. **Imports Sports names** from `assets/data/Sports/names.js` (maleFirstNames, femaleFirstNames, middleNames, lastNames, pickRandom) — same generator used by sports players.
2. **Imports Wrestling names** from `assets/data/wrestling/names.js` (wrestlingFirstParts, wrestlingLastParts) — 250 unique parts each for wrestling-style names like `{The Axe}`, `{Loco Polo}`, `{Ol' Psycho}`.
3. **Imports Signature Moves** from `assets/data/wrestling/signatures.js` — 250 unique signature moves.
4. **Imports Finisher Moves** from `assets/data/wrestling/finishers.js` — 250 unique finishing moves.
5. Falls back gracefully if any data file is missing (empty arrays, hardcoded defaults).

---

## Configuration

### Wrestler Types
| Type | Primary Stat | Primary Range | Other Stats Range |
|------|-------------|---------------|-------------------|
| `brawler` | strength | 75-90 | 40-65 |
| `highflyer` | agility | 75-90 | 40-65 |
| `tank` | endurance | 75-90 | 40-65 |
| `showboat` | charisma | 75-90 | 40-65 |
| `icon` | none (all balanced) | 55-75 | 55-75 |

### Genders
`men`, `women`

### Demographics
| Demographic | Age Range | Potential Range |
|-------------|-----------|-----------------|
| `teen` | 15-19 | 75-95 |
| `youngAdult` | 20-25 | 65-85 |
| `adult` | 26-32 | 55-75 |
| `middleAged` | 33-39 | 45-65 |
| `older` | 40-45 | 35-55 |

### Alignments
`face` (fan favorite), `heel` (villain)

### Gimmicks
`hardcore`, `technical`, `highflyer`, `powerhouse`, `charismatic`, `monster`, `comedic`

### Match Types
`singles`, `tagteam`, `trickytrio`, `fatalfour`

### Stipulations
`1fall`, `2of3falls`, `insanity`, `ladder`, `table`, `cage`, `deathmatch`, `firstblood`, `lastmanstanding`, `ironman`, `submissiononly`, `knockout`, `nocountout`, `nodq`

---

## Type Matchups (Fight Synergy)

**Icon is neutral with ALL non-Icon types except Icon vs Icon (well)** — this makes Icon a balance fixer, not overpowered.

| Type A | Type B | Synergy |
|--------|--------|---------|
| brawler | highflyer | well |
| brawler | tank | poor |
| brawler | showboat | neutral |
| brawler | icon | neutral |
| highflyer | brawler | well |
| highflyer | tank | neutral |
| highflyer | showboat | poor |
| highflyer | icon | neutral |
| tank | showboat | well |
| tank | brawler | poor |
| tank | highflyer | neutral |
| tank | icon | neutral |
| showboat | tank | well |
| showboat | highflyer | poor |
| showboat | brawler | neutral |
| showboat | icon | neutral |
| icon | all non-icon | neutral |
| icon | icon | well |

**Synergy modifiers:** `good` = +0.1, `poor` = -0.1, `neutral` = 0.

---

## Team Synergy (Tag Team / Trio)

| Type A | Type B | Synergy |
|--------|--------|---------|
| brawler | tank | good |
| brawler | highflyer | poor |
| brawler | showboat | poor |
| brawler | icon | neutral |
| highflyer | showboat | good |
| highflyer | brawler | poor |
| highflyer | tank | neutral |
| highflyer | icon | neutral |
| tank | brawler | good |
| tank | highflyer | neutral |
| tank | showboat | poor |
| tank | icon | neutral |
| showboat | highflyer | good |
| showboat | brawler | poor |
| showboat | tank | poor |
| showboat | icon | neutral |
| icon | all non-icon | neutral |
| icon | icon | good |

---

## Gimmick Stipulation Bonuses

| Gimmick | Bonus Stipulations |
|---------|-------------------|
| hardcore | insanity, deathmatch, firstblood, lastmanstanding, nodq |
| technical | submissiononly, 1fall, 2of3falls |
| highflyer | ladder, cage, table |
| powerhouse | cage, deathmatch, 1fall |
| charismatic | 2of3falls, ironman, nocountout |
| monster | deathmatch, insanity, cage |
| comedic | nocountout, nodq, 2of3falls |

Bonus: +0.05 match grade when wrestling in a bonus stipulation.

---

## Wrestler Object Structure

```js
{
  id: string,                    // Unique wrestler ID
  name: string,                  // Wrestler name
  gender: 'men' | 'women',       // Gender
  wrestlerType: string,          // brawler, highflyer, tank, showboat, icon
  featuredMatch: {               // Preferred match type + stipulation
    matchType: string,
    stipulation: string,
  },

  // Core skills (1-99, independent of sports player skills)
  strength: number,
  agility: number,
  endurance: number,
  charisma: number,

  // Progression
  level: number,         // 1
  xp: number,            // 0
  potential: number,     // Max stat ceiling (based on demographic)

  // Morale & Happiness
  morale: number,        // 0-100, affects match performance
  happiness: number,     // 0-100, affects performance & contract renewal

  // Career stats
  matchesWrestled: number,
  wins: number,
  losses: number,
  fansGainedTotal: number,
  personalFans: number,  // Individual fan count (separate from promotion.fans)
  titleReigns: [],       // [{ titleKey, startDay, endDay, defenses }]
  injuries: [],          // Injury history
  isInjured: boolean,
  injuryWeeksLeft: number,
  injuryType: string,
  isRetired: boolean,

  // Contract
  contractWeeksRemaining: number,
  salary: number,        // Per-week salary
  signingBonus: number,  // One-time payment on signing
  isDrafted: boolean,
  draftRate: number,
  demographic: string,
  age: number,

  // Tag team
  tagTeamId: string | null,

  // Persona
  alignment: 'face' | 'heel',
  gimmick: string,
  crowdReaction: number, // -100 to +100

  // Moves
  signatureMove: { id, name, type, damage, fanImpact },
  finisherMove: { id, name, type, damage, fanImpact, finisherRating },
  moveSet: [],           // Array of move objects

  rivalries: [],         // [{ rivalWrestlerId, intensity, type, startedDay }]
}
```

---

## Methods

### Wrestler Generation

#### `generateWrestler(data = {})`
Generates a complete wrestler object with random stats, name, moves, and contract.

**Parameters:**
- `gender` — 'men' or 'women' (random if omitted)
- `wrestlerType` — 'brawler' | 'highflyer' | 'tank' | 'showboat' | 'icon' (random if omitted)
- `demographic` — age demographic (random if omitted)
- `name` — Custom name (generated if omitted)
- `isDrafted` — Whether from draft (default false)
- `contractWeeksRemaining` — Contract length in weeks (1-12 random if omitted)
- `salary` — Weekly salary (calculated if omitted)

**Returns:** Full wrestler object.

---

### Name Generation

#### `generateName(gender)`
Generates a wrestler name:
- 70% chance: Wrestling-style name from `wrestlingFirstParts` + `wrestlingLastParts` (e.g., `{The Axe}`, `{Loco Polo}`, `{Ol' Psycho}`)
- 30% chance: Sports-style name from `assets/data/Sports/names.js` (first + optional middle + last)
- Fallback: "Wrestler One" if all lists empty

---

### Stats & Potential

#### `generateStats(wrestlerType, demographic)`
Generates 4 independent skills (strength, agility, endurance, charisma):
- Primary stat (based on wrestler type): rolled in primary range (75-90)
- Other 3 stats: rolled in other range (40-65)
- Icon type: all 4 stats rolled in 55-75 range

**Throws:** `Error` if unknown wrestler type.

#### `generatePotential(demographic)`
Returns potential ceiling based on demographic (teen highest, older lowest).

---

### Featured Match

#### `generateFeaturedMatch()`
Returns a random `{ matchType, stipulation }` pair. Any match type can pair with any stipulation (4 × 13 = 52 possible combinations).

---

### Move Set Generation

#### `generateMoveSet(signatureMove, finisherMove)`
Generates a move set of 5-10 moves:
1. Signature move (from imported data or default)
2. Finisher move (from imported data or default, if different ID from signature)
3. Filler moves (Punch, Kick, Body Slam, Suplex, etc.) to reach moveCount

Each move gets `learnedAtLevel` property.

---

### Salary

#### `generateSalary(demographic, potential, seasons)`
Calculates weekly salary:
- Base by demographic (teen: 30k, youngAdult: 60k, adult: 90k, middleAged: 70k, older: 40k)
- Plus potential bonus: `(potential - 50) * 2000`
- Plus random variance: `0-20000`

---

### Type Matchups

#### `getFightSynergy(typeA, typeB)`
Returns 'well', 'poor', or 'neutral' for opponent style advantage in singles matches.

#### `getTeamSynergy(typeA, typeB)`
Returns 'good', 'poor', or 'neutral' for tag team / trio partner synergy.

#### `getSynergyModifier(synergy)`
Returns numeric modifier: `good` = 0.1, `poor` = -0.1, `neutral` = 0.

---

### Gimmick

#### `getGimmickStipulationBonus(gimmick, stipulation)`
Returns 0.05 if the wrestler's gimmick has a bonus for the given stipulation, otherwise 0.

---

### Tag Team Management

#### `createTagTeam(tagTeamId, name, wrestlerIdA, wrestlerIdB, wrestlers, tagTeams)`
Creates a tag team with chemistry starting at 50.

**Validation:**
- Both wrestlers must exist
- Both must be same gender
- Neither can already be in a tag team

**Throws:** Error on validation failure.

#### `dissolveTagTeam(tagTeamId, wrestlers, tagTeams)`
Removes a tag team and clears `tagTeamId` from both wrestlers.

---

### Happiness & Morale

#### `adjustHappiness(wrestler, change, reason)`
Adjusts wrestler happiness, clamped 0-100.

#### `adjustMorale(wrestler, change, reason)`
Adjusts wrestler morale, clamped 0-100.

#### `shouldRequestRelease(wrestler)`
Returns `true` if happiness < 20 (wrestler may request release).

#### `canWrestle(wrestler)`
Returns `false` if wrestler is null, retired, injured, or happiness < 20.

---

### Individual Fans

#### `adjustPersonalFans(wrestler, change)`
Adjusts wrestler's personal fan count (separate from promotion.fans), clamped >= 0. Also updates `fansGainedTotal`.

---

### Moves & Finishers

#### `setSignatureMove(wrestler, move)`
Sets wrestler's signature move.

#### `setFinisherMove(wrestler, move)`
Sets wrestler's finisher move.

#### `addMoveToSet(wrestler, move)`
Adds a move to wrestler's move set.

#### `setMoveSet(wrestler, moveSet)`
Replaces wrestler's entire move set.

---

### Training

#### `trainWrestler(wrestlerId, attribute, nation, gymLevel = 0)`
Trains a wrestler's attribute (strength, agility, endurance, or charisma).

**Parameters:**
- `wrestlerId` — Wrestler ID
- `attribute` — One of: strength, agility, endurance, charisma
- `nation` — Nation object (for money deduction)
- `gymLevel` — Arena gym level (0-10, reduces cost and increases gain)

**Cost:** `50000 * 1.2^(floor(currentValue / 10)) * (1 - gymLevel * 0.05)`  
**Gain:** `1 + floor(gymLevel * 0.5)`  
**Max:** Capped at wrestler's potential

**Throws:** Error if wrestler not found, retired, invalid attribute, at potential, or insufficient funds.

---

### Featured Match Changes

#### `changeFeaturedMatch(wrestler, matchType, stipulation)`
Updates wrestler's featured match combination. Validates that both matchType and stipulation are valid.

---

### Contracts

#### `extendContract(wrestler, weeks, nation)`
Extends wrestler's contract by 1-52 weeks. Cost = `salary * weeks` paid from nation.money.

**Throws:** Error if retired, invalid weeks, or insufficient funds.

#### `decrementContracts(wrestlers)`
Decrements `contractWeeksRemaining` by 1 for all wrestlers (minimum 0). Returns list of wrestlers whose contracts expired (0 weeks remaining, not retired).

---

### Injuries (Weeks-Based)

#### `calculateInjuryRisk(wrestler, stipulation, consecutiveMatches)`
Returns risk score 0-1 based on:
- Age modifier (older = higher risk)
- Stipulation risk (deathmatch highest at 0.30, 1fall lowest at 0.0)
- Fatigue (consecutiveMatches * 0.02)
- Endurance reduction (endurance * 0.001)
- Previous injuries (+0.05)

#### `determineInjurySeverity(riskScore)`
| Risk Score | Severity | Description | Weeks Out |
|------------|----------|-------------|-----------|
| < 0.20 | 0 | No injury | 0 |
| < 0.40 | 1 | Minor | 0 |
| < 0.55 | 2 | Mild | 1 |
| < 0.75 | 3 | Moderate | 2-3 |
| < 0.90 | 4 | Major | 4-8 |
| >= 0.90 | 5 | Career ending | 999 |

#### `inflictInjury(wrestler, matchId, stipulation, consecutiveMatches)`
Attempts to inflict an injury on a wrestler.

**Behavior by severity:**
- **0 (None):** Returns false, no injury
- **1 (Minor):** Records injury but does NOT flag `isInjured` (no time missed)
- **2-4:** Sets `isInjured = true`, `injuryWeeksLeft` = weeks out
- **5 (Career Ending):** Sets `isRetired = true`, `isInjured = false`

**Returns:** `{ injured, type, severity, weeksOut, riskScore }` or `false`.

#### `healInjuries(wrestlers, medicalCenterLevel = 0)`
Decrements `injuryWeeksLeft` by 1 for all injured wrestlers. Returns list of wrestlers who returned from injury (weeks reached 0). Does not affect career-ending injuries (999 weeks).

---

### Retirement

#### `checkRetirement(wrestler)`
Checks if a wrestler should retire based on demographic and matches wrestled.

| Demographic | Base Chance | Older + 50 matches |
|-------------|-------------|-------------------|
| teen | 0 | — |
| youngAdult | 0 | — |
| adult | 0.001 | — |
| middleAged | 0.005 | — |
| older | 0.02 | +0.01 |

Sets `isRetired = true` if retirement triggers.

---

### Utility

#### `calculateRating(wrestler)`
Returns overall rating 0-100 based on average stats × morale factor × happiness factor.

#### `isWrestlerAvailable(wrestler)`
Alias for `canWrestle(wrestler)`.

---

## Data Files

| File | Contents | Count |
|------|----------|-------|
| `assets/data/wrestling/names.js` | wrestlingFirstParts (250), wrestlingLastParts (250) | 250 + 250 |
| `assets/data/wrestling/signatures.js` | signatureMoves (250 unique) | 250 |
| `assets/data/wrestling/finishers.js` | finisherMoves (250 unique) | 250 |
| `assets/data/Sports/names.js` | maleFirstNames, femaleFirstNames, middleNames, lastNames | Shared with sports |

---

## Integration

The `WrestlerSystem` is instantiated by `WrestlingSystem` in its constructor:

```js
this.wrestlerSystem = new WrestlerSystem(this);
```

It is accessed by `WrestlingSystem` for:
- Wrestler generation during draft/signing
- Training via `wrestling:trainWrestler` action
- Featured match changes
- Move/finisher assignments
- Injury calculation during match simulation
- Contract management (decrement, extend)
- Tag team creation/dissolution
- Retirement checks during day processing

---

## Skills Independence

**Wrestler skills are COMPLETELY INDEPENDENT of sports player skills.** No cross-referencing with `TeamPlayerSystem` attributes. Wrestlers have their own four skills: strength, agility, endurance, charisma.

---

## Save/Load

Wrestler objects are plain JavaScript objects (no Maps) and serialize cleanly via `JSON.stringify`/`JSON.parse`. They are stored in `WrestlingSystem.wrestlers` Map and serialized through `WrestlingSystem.getState()`/`setState()`.
