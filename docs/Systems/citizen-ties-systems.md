# Citizen Ties System

Handles citizen relationships, family ties, dating, marriage, divorce, widowhood, newborn generation, and family role assignment for the nation's population.

## Overview

| Item | Value |
|------|-------|
| **System class:** | `CitizenTiesSystem` |
| **Global instance:** | `window.CitizenTiesSystem` |
| **Update frequency:** | Every game day (via `day_passed` EventBus event) |
| **Primary config:** | `systems/citizen-ties-system.js` |
| **Depends on:** | `PopulationSystem` (citizens Map, vitalRates, birth/death), `GameEngine.nations` (foreign nations for immigrant ethnicity) |

The Citizen Ties System manages the social fabric of each nation's population. It tracks dating relationships, marriages, divorces, breakups, widowhood, family roles (Mother/Father/Son/Daughter/Brother/Sister/etc.), newborn generation from married couples, and citizenship ethnicity.

> **Browser wiring:** `systems/citizen-ties-system.js` must be loaded after `core/event-system.js` (provides `EventBus`) in `index.html`. The system is instantiated by `GameEngine.initializeSystems()` after `PopulationSystem`, with `populationSystem` injected into `CitizenTiesSystem.populationSystem`.

---

## Relationship Types

| Type | Composition | Description |
|------|-------------|-------------|
| **Straight Monogamy** | Male + Female, 2 people | Opposite-sex couple, exclusive |
| **Gay Monogamy** | Same sex (M/M or F/F), 2 people | Same-sex couple, exclusive |
| **Straight Polygamy** | 3–4 people, must include both male and female | Mixed-gender group |
| **Gay Polygamy** | 3–4 people, all same gender | Same-sex group |

> **Note:** Polygamy types (3–4 people) are defined in `determineRelationshipType()` but `spawnTeenRelationships()` currently only creates 2-person relationships (`count=2`). Polygamy spawning is not yet implemented.

---

## Relationship Stages

| Stage | Age Group | Behavior |
|-------|-----------|----------|
| **Single** | Any | Not in a relationship; eligible to date |
| **Dating** | Teen / Young Adult | 50% chance/turn to start dating; young adults may marry or break up |
| **Married** | Any | Subject to divorce probability; straight married couples can generate newborns |
| **Divorced** | Any | Formerly married; tracked in `divorcedFrom[]` |
| **Widowed** | Any | Spouse died; tracked in `widowedFrom[]` |
| **Deceased** | — | Citizen has died |

---

## Daily Process Flow (`processRelationships`)

Called each game day by `PopulationSystem.handleDayPassed()` **after** births and deaths are processed:

1. **Resolve citizen ethnicity** — Sets `citizen.ethnicity` from nation name (or `getPopulationName()`). Immigrants pull ethnicity from a random foreign nation.
2. **Spawn teen relationships** — Teens (ageGroup `teen`) who are single have a 50% chance/turn to start dating another eligible teen.
3. **Process young adult relationships** — Young adults (ageGroup `youngAdult`) who are dating may marry or break up; married young adults are subject to divorce probability.
4. **Process married couples (divorce)** — Married citizens not in the young adult group are checked for divorce probability each day.
5. **Generate newborns from marriages** — Straight married couples (male + female, reproductive age) have a daily chance to produce a child based on `PopulationSystem.vitalRates.baseBirthRate`.
6. **Assign relationship roles** — Re-derives Mother/Father/Son/Daughter/Brother/Sister/etc. roles from `parentIds`/`childIds`/`spouseIds` and cleans up stale relationship entries.
7. **Sync territorial distribution** — Delegates to `PopulationSystem.syncTerritorialDistributionWithCitizens()`.

---

## Ethnicity Resolution (`resolveCitizenEthnicity`)

- Default ethnicity: `nation.name + 'ian'` (e.g., "Test" → "Testian")
- Override: `nation.getPopulationName()` if defined
- Immigrants (`citizen.isImmigrant === true`): if more than one nation exists in `GameEngine.nations`, ethnicity is randomly assigned from a foreign nation's population name

---

## Teen Relationships (`spawnTeenRelationships`)

- Eligible: `isAlive`, `ageGroup === 'teen'`, `relationshipStatus === 'single'`
- Each eligible teen has a 50% chance per turn to start dating
- A `matchedThisTurn` Set prevents the same teen from being matched twice in a single batch (no double-dating)
- Partner is chosen randomly from other eligible, unmatched teens
- Relationship type is determined by gender combination via `determineRelationshipType()`

---

## Young Adult Relationships (`processYoungAdultRelationships`)

Eligible: `isAlive`, `ageGroup === 'youngAdult'`, `relationshipStatus` is `dating` or `married`

### Dating young adults
- 50% chance per turn for a relationship change
- If married → divorce path (see below)
- If dating → roll between marry probability and breakup probability:
  - **Marry:** Moves from `partnerIds` to `spouseIds`, `relationshipStatus` → `married`
  - **Break up:** Removes from `partnerIds`, `relationshipStatus` → `single`, tracked in `brokenUpFrom[]`
  - Otherwise: stay dating

### Married young adults
- Subject to divorce probability (dampened breakup rate × 0.2)
- `processedForDivorce` Set prevents double-processing both spouses in the same batch

---

## Married Couples Divorce (`processMarriedCouples`)

Handles married citizens in age groups **other than** `youngAdult` (young adults are handled in `processYoungAdultRelationships`). Each married citizen's spouses are checked for divorce probability each day.

---

## Probability Calculations

### `calculateMarryProbability(citizen, partner, nationStats, isStraightCouple)`

Base: 10%. Modifiers:

| Factor | Effect |
|--------|--------|
| Age | +0.2% per year of average age |
| Health | ±0.1% per health point from 50 (avg of both) |
| Wealth | Up to +15% (capped at `avgWealth / 10000`) |
| Literacy | +0.2% per average literacy point |
| Employment | ×0.7 if not both employed |
| Religion match | ×3.0 if both share a non-'none' religion |
| Straight couple | ×1.2 bonus |
| **Cap:** | 0% – 95% |

### `calculateBreakupProbability(citizen, partner, nationStats, isStraightCouple)`

Base: 5%. Only negative factors apply:

| Factor | Effect |
|--------|--------|
| Health below 50 | +0.2% per point below 50 (avg of both) |
| Either unemployed | +10% |
| **Cap:** | 0% – 90% |

### `calculateDivorceProbability(citizen, partner, nationStats)`

`breakupProbability × 0.2` — divorce is much harder than breakup (dampened by 80%).

---

## Relationship Lifecycle Methods

### `createRelationship(citizenA, citizenB, type, relationshipType, nation)`

Creates a dating or married link between two citizens:
- Sets `relationshipStatus` (`dating` or `married`)
- Adds partner/spouse ID to `partnerIds` / `spouseIds`
- Stores relationship entry in `relationships` Map: `{ type, role, started: timestamp }`
- Adds life events to both citizens (capped at 20 events)

### `marryCouple(citizenA, citizenB, nation)`

Converts a dating relationship to marriage:
- Sets `relationshipStatus` → `married` for both
- Moves partner from `partnerIds` to `spouseIds` for both
- Updates `relationships` Map entry to `{ type: 'married', role: getSpouseRole(...), started: now }`
- Adds marriage life events

### `breakUpCouple(citizenA, citizenB)`

**Breaks up two dating citizens. Preserves all family relationships.**

- Sets `relationshipStatus` → `single` for both
- Removes partner from `partnerIds` for both
- Records the breakup in `brokenUpFrom[]` (tracks who they broke up with)
- Removes the `dating` entry from `relationships` Map
- **Preserves:** `parentIds`, `childIds`, `spouseIds` — Mother/Father/Son/Daughter family roles are NOT cleared
- Adds breakup life events

### `divorceCouple(citizenA, citizenB)`

**Divorces two married citizens. Preserves all family relationships.**

- Sets `relationshipStatus` → `divorced` for both
- Removes spouse from `spouseIds` for both
- Records the divorce in `divorcedFrom[]` (tracks who they are divorced from)
- Removes the `married` entry from `relationships` Map
- **Preserves:** `parentIds`, `childIds`, `partnerIds` — Mother/Father/Son/Daughter family roles are NOT cleared
- Adds divorce life events

---

## Death & Widow Handling (`handleCitizenDeath`)

Called by `PopulationSystem` whenever a citizen dies (both daily aging deaths and random natural deaths). **Citizen.js `isAlive` is NOT set to false here** — PopulationSystem handles that separately. `CitizenTiesSystem` handles relationship aftermath:

### Spouses (widow/widower)
- Survivor's `relationshipStatus` → `widowed`
- Deceased removed from survivor's `spouseIds`
- Survivor's `widowedFrom[]` records the deceased spouse's ID
- Married entry removed from survivor's `relationships` Map
- **Preserved:** Survivor's `parentIds`, `childIds`, `partnerIds` — family roles survive

### Dating partners (not married)
- Survivor's `partnerIds` removes the deceased
- If no partners remain, `relationshipStatus` → `single`
- Dating entry removed from survivor's `relationships` Map
- Adds "Partner passed away" life event

### Deceased citizen
- `spouseIds` and `partnerIds` cleared
- `relationshipStatus` → `deceased`

---

## Newborn Generation (`generateNewbornsFromMarriages` + `createChildFromCouple`)

Only **straight married couples** (male + female, both `relationshipStatus === 'married'`) can generate newborns:

| Requirement | Value |
|-------------|-------|
| Female reproductive age | 15–45 |
| Male reproductive age | 15–60 |
| Daily birth rate | `baseBirthRate / 365 × happinessFactor × diseaseFactor × environmentFactor × pollutionRate` |
| Happiness factor | `0.5 + (happiness / 100)` |
| Disease factor | `max(0.1, 1 - disease/100)` |
| Environment factor | `0.5 + (environment/100)` |
| Pollution factor | `max(0.1, 1 - pollution/100)` |

Each qualifying couple rolls once per day against `dailyBirthRate`. On success, `createChildFromCouple()` creates a newborn citizen with:
- `parentIds`: [father.id, mother.id]
- `childIds`: updated on both parents
- `relationships`: Father/Mother links on child, Son/Daughter links on parents, sibling links to existing children
- `ethnicity`: from nation's population name
- `religion`: mother's or father's religion, default `'none'`
- `relationshipStatus`: `'single'`

Child is added to `PopulationSystem.citizens`, `ageGroups.newborn.count` incremented, and `recordBirth()` called.

---

## Relationship Role Assignment (`assignRelationshipRoles`)

Re-derives all family roles daily from current state:

1. **Stale entry cleanup** — Removes `relationships` Map entries where `type === 'married'` but the ID is not in `spouseIds`, or `type === 'dating'` but not in `partnerIds` (happens after breakup/divorce/death)
2. **Spouse roles** — Husband/Wife/Partner based on gender combination (`getSpouseRole()`)
3. **Parent roles** — Father (male) / Mother (female) for each `childIds` entry
4. **Child roles** — Son (male) / Daughter (female) for each `parentIds` entry
5. **Sibling roles** — Brother/Sister for citizens sharing a parent
6. **Grandparent roles** — Grandfather/Grandmother for parents' parents
7. **Grandchild roles** — Grandfather/Grandmother for children's children
8. **Cousin roles** — Cousin for children of parent's siblings

> Family roles are **re-derived every day from `parentIds`/`childIds`**, so they survive breakup, divorce, and widowhood automatically since those operations never modify `parentIds` or `childIds`.

---

## Citizen Entity Fields (relationship-related)

Defined in `entities/Citizen.js` and serialized via `toJSON()` / `deserialize()`:

| Field | Type | Description |
|-------|------|-------------|
| `relationshipStatus` | string | `single` \| `dating` \| `married` \| `divorced` \| `widowed` \| `deceased` |
| `partnerIds` | string[] | IDs of current dating partners |
| `spouseIds` | string[] | IDs of current spouses |
| `parentIds` | string[] | IDs of biological parents |
| `childIds` | string[] | IDs of biological children |
| `relationships` | Map | `citizenId → { type, role, started }` |
| `divorcedFrom` | string[] | IDs of former spouses (divorce history) |
| `widowedFrom` | string[] | IDs of deceased spouses (widow history) |
| `brokenUpFrom` | string[] | IDs of former dating partners (breakup history) |
| `lifeEvents` | array | Last 20 relationship/life events |
| `isAlive` | boolean | Citizen alive status |
| `ageGroup` | string | Population age group (teen, youngAdult, adult, etc.) |
| `gender` | string | `'male'` \| `'female'` |
| `isEmployed` | boolean | Employment status (affects marry probability) |
| `wealth` | number | Personal wealth (affects marry probability) |
| `literacyScore` | number | Literacy score (affects marry probability) |
| `health` | number | Health 0–100 (affects marry/breakup probability) |
| `religion` | string | Religion (affects marry probability if matched) |

---

## Integration with PopulationSystem

| Responsibility | PopulationSystem | CitizenTiesSystem |
|----------------|------------------|-------------------|
| Citizen storage | ✅ `citizens` Map | ❌ Reads only |
| Citizen ID generation | ✅ `nextCitizenId` | ❌ Calls `pop.nextCitizenId++` |
| Age group counts | ✅ `ageGroups` | ❌ Reads only |
| Birth/death recording | ✅ `recordBirth()` / `recordDeath()` | ❌ Calls them |
| Daily `handleDayPassed` | ✅ Orchestrates | ✅ `processRelationships()` called |
| Death relationship aftermath | ❌ | ✅ `handleCitizenDeath()` wired into both death paths |
| Newborn creation | ❌ | ✅ `generateNewbornsFromMarriages()` / `createChildFromCouple()` |
| Family role assignment | ❌ | ✅ `assignRelationshipRoles()` daily |

**Wiring in `game-engine.js`** (`core/game-engine.js:245-249`):
```js
if (window.CitizenTiesSystem) {
    this.systems.citizenTies = new CitizenTiesSystem();
    this.systems.citizenTies.populationSystem = this.systems.population;
    await this.systems.citizenTies.initialize();
    window.CitizenTiesSystem = this.systems.citizenTies;
}
```

**Wiring in `population-system.js`** (`systems/population-system.js:796-798`):
```js
if (window.CitizenTiesSystem) {
    window.CitizenTiesSystem.populationSystem = this;
    window.CitizenTiesSystem.processRelationships(currentDay);
}
```

---

## Key Methods Summary

| Method | Description |
|--------|-------------|
| `processRelationships(currentDay)` | Full daily relationship pipeline (7 steps) |
| `resolveCitizenEthnicity(citizens, nation)` | Set ethnicity from nation or foreign nation for immigrants |
| `spawnTeenRelationships(citizens, nation)` | Teens start dating (50%/turn, no double-dating) |
| `processYoungAdultRelationships(citizens, nation, nationStats)` | Young adults marry/breakup/divorce |
| `processMarriedCouples(citizens, nation, nationStats, currentDay)` | Divorce checks for non-young-adult married couples |
| `calculateMarryProbability(...)` | Probability two dating citizens marry (0–1) |
| `calculateBreakupProbability(...)` | Probability two dating citizens break up (0–1) |
| `calculateDivorceProbability(...)` | Probability married citizens divorce (0–1, dampened) |
| `createRelationship(A, B, type, type, nation)` | Create dating/married link |
| `marryCouple(A, B, nation)` | Convert dating to marriage |
| `breakUpCouple(A, B)` | Break up dating couple; preserves family roles |
| `divorceCouple(A, B)` | Divorce married couple; preserves family roles |
| `handleCitizenDeath(deceased)` | Widow/widower + dating partner handling on death |
| `generateNewbornsFromMarriages(citizens, nation, stats)` | Straight married couples have children |
| `createChildFromCouple(father, mother, nation)` | Create newborn citizen with full family links |
| `assignRelationshipRoles(citizens)` | Re-derive Mother/Father/Son/Daughter/etc. roles daily |
| `getSpouseRole(genderA, genderB)` | Husband/Wife/Partner based on gender |
| `determineRelationshipType(genderA, genderB, count)` | Monogamy/Polygamy, Straight/Gay |
| `partnerName(citizen)` | Helper for life event descriptions |
| `destroy()` | Mark system uninitialized |
