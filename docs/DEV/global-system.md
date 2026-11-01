# Global System / Entity Design Plan
# Dominion Wars - Nation Building Strategy Game
# Location: docs/DEV/global-system.md
# Status: PLAN ONLY (no implementation yet)
# Scan basis: ALL 28 system files + 10 entity files + core/game-engine.js + core/config.js fully read

---

## 1. Executive Summary / Decision

**YES — a Global system and entity are required.**

The game tracks per-nation stats (Happiness, Pollution, Disease, Crime, Environment, etc.) in `entities/Nation.js` (`nationStats`), and `DiseaseSystem` maintains a partial `globalMetrics` (pollution, disease, health only). However, there is NO dedicated system that:

1. Computes global averages across ALL nations for all 6 factors
2. Feeds global averages back as small modifiers to individual nation stats
3. Calculates Environment as a dependent stat (all other averages first, then nuke/missile strike penalties)
4. Weighs government/religion usage by majority and suggests the opposite
5. Computes a Global Disease Spawn chance from national averages

This plan specifies both a **GlobalWorld entity** (state holder) and a **GlobalSystem** (logic/calculation engine).

---

## 2. What Exists Today (full scan results)

### Entities

| File | Key fields relevant to Global | What it lacks |
|------|------|---------------|
| `entities/Nation.js` | `nationStats`: {happiness, pollution, disease, crime, literacy, environment, happinessModifier, populationEfficiency, militaryMorale, taxEfficiency}; `this.happiness` (top-level, synced from nationStats.happiness in `updateHappiness()` line 1504); `this.populationGrowthModifier` (1.0); `this.militaryUnits` {soldiers,tanks,aircraft,ships,spies,missiles,nukes}; `this.government`, `this.religion`; `this.statistics` {missileHits,missileMisses,nukeHits,nukeMisses,missileLaunches,nukeLaunches,missilesBlocked,zeroPollutionDays,zeroCrimeDays,zeroDiseaseDays,perfectHappinessDays,governmentChanges,religionChanges,researchCompleted}; `this.demandTimer` {governmentDaysRemaining,religionDaysRemaining,isDemandingGovernment,isDemandingReligion,currentGovernmentHint,currentReligionHint}; `this.temporaryEffects` []; `this.edictEffects` {happinessModifier,diseaseModifier,crimeModifier,pollutionModifier,environmentModifier,taxRateModifier,...}; `this.policyEffects` {happinessModifier,pollutionReduction,diseaseReduction,crimeReduction,literacyBonus,environmentalHealth,healthcareQuality,internalSecurity,educationBonus,taxRateModifier}; `this.improvementEffects`, `this.projectEffects`, `this.wonderEffects`; `calculateNationStats()` order: literacy→pollution→disease→crime→happiness→environment→derivedEffects; `this.foundedDay` | No global awareness, no global average modifiers; **`serialize()` does NOT include `nationStats`** (only top-level `happiness`) — global averages must be computed from live nation objects, not saved data |
| `entities/Player.js` | `playerId`, `username`, `level`, `legendaryLevel`, `totalLegendaryLevels`; `skills` Map: attack, defense, aim, luck, criticalDamage, criticalChance, block, parry, energy, intuition, taxation, diplomacy — each {level, pointsSpent, legendaryBonusPts}; `statistics` {playTime,loginsCount,nationsCreated,battlesWon,battlesLost,tradesCompleted,alliancesFormed,territoriesClaimed,buildingsConstructed,researchCompleted,treatiesSigned,spyMissions}; `factionKey`, `factionColor`; `getSkillValue(skillKey)`; `applyToNation(nation)` applies militaryStrength, reputationBonus, researchBonus, actionEnergy, luckBonus | No global awareness |
| `entities/Alliance.js` | `id`, `name`, `governmentType`, `members` Map (nationId->memberData), `memberLimit`, `level`, `experience`, `skillPoints`, `skills`; `statistics` {warsWon,warsLost,treatiesSigned,territoryGained,totalDamageDealt,membersRecruited,projectsCompleted}; `treaties`, `relations` Map, `diplomaticStance`; `warParticipation` Map | No global awareness |
| `entities/AwardSystem.js` | `awards` Map {id, name, trackKey, threshold, type}; `nationAwards` Map nationId->Set of awardIds; `trackKey` paths like 'statistics.warsWon' | No global awards |
| `entities/Building.js` | `nationId`, `type` (improvement/project/wonder), `name`, `effects`, `nationEffectKeys`; effects: shipEffectiveness, pollutionIncrease, diseaseReduction, crimeReduction, happinessBonus, literacyBonus, basicResourceBonus, manufacturedResourceBonus, soldierEffectiveness, tankEffectiveness, aircraftEffectiveness, missileProduction, missileStorage | No global building stats |
| `entities/MilitaryUnit.js` | `type` {soldiers,tanks,aircraft,ships,spies,missiles,nukes}, `quantity`, `nationId`, `condition`, `experience`, `morale`; `strengthContribution`, `effectiveStrength`; `battlesParticipated`, `victories`, `losses`, `kills`, `warDamageDealt` | No global military tracking |
| `entities/Citizen.js` | `nationId`, `happiness`, `health`, `loyalty`, `occupation`, `education`, `wealth`, `income`, `isEmployed`, `isMilitary`, `isRetired`, `isCriminal`; `religion`, `sexualOrientation`, `politicalLeanings` {economic,social,authoritarian}; `taxesPaid`, `age`, `lifeEvents`, `relationships` Map | Per-citizen only, not aggregated globally |
| `entities/Technology.js` | `id`, `category`, `tier`, `cost`, `prerequisites`, `effects`, `bonuses`, `isResearched`, `researchedBy`; `effects` like {foodProduction,populationGrowth,literacyGrowth,militaryStrength,tradeEfficiency,taxCollection} | No global tech tracking |
| `entities/Team.js` | `nationId`, `fans`, `stats` {wins,losses,championships,tournamentsWon,...} | Sports-only, not global stats |
| `entities/HiveMindAI.js` | AI for alliance leadership; `personality` {weights:{econ,mil,diplo}, risk, traits:{expansionist,militaristic,diplomatic,economic,isolationist}} | AI-only, not global stats |

### Systems

| File | What it has | What it lacks |
|------|-------------|---------------|
| `systems/disease-system.js` | `globalMetrics` {pollution, disease, health, totalNations}; `updateGlobalMetrics(nations)`; `checkGlobalEvent()`; config: `globalEventChance:0.01`, `globalPollutionMultiplier:1.5`, `globalHealthMultiplier:1.5`, `pollutionMultiplier:2.0`, `happinessReduction:0.5`; uses `window.gameEngine.getAllPlayers()` | Only 3 metrics (no happiness/crime/environment/pop-growth); no feed-back to nations; no nuke/missile env penalties; no gov/religion weighing; no national-average disease spawn |
| `systems/war-system.js` | `launchMissile()`/`launchNuke()`; `applyMissileHitEffects()`/`applyNukeHitEffects()` apply env/pollution/happiness to TARGET nation only; `statistics.missilesFired`/`nukesFired` per war side; emits `safeEmit('missile_hit',{warId,attacker,targetSide,damage})` line 857, `safeEmit('nuke_hit',{warId,attacker,targetSide,damage})` line 955, `safeEmit('missile_intercepted',...)` line 836, `safeEmit('nuke_intercepted',...)` line 934 | No global tracking of successful strikes; hit events carry `targetSide` ('attacker'|'defender') NOT target nation IDs — must look up `war.sides[targetSide].nations` |
| `systems/government-system.js` | 12 governments; `applyGovernmentBonuses(nation, governmentId)`; `getRandomGovernment(currentGovernmentId)` (excludes current only); `getAllGovernments()`; defs: {bonuses, penalties, policies, taxRate, militaryBudget, hints, hintThemes} | No majority-based weighing; no opposite suggestion |
| `systems/religion-system.js` | 12 religions; `applyReligionBonuses(nation, religionId)`; `getAllReligions()`; defs: {bonuses, penalties, practices, hints, hintThemes} | No majority-based weighing; no opposite suggestion |
| `systems/population-system.js` | `vitalRates` {baseBirthRate:0.035, baseDeathRate:0.01, migrationRate:0.005, literacyGrowthRate:0.001, educationProgressRate:0.002}; `calculateDeathFactors()` uses happiness/disease/pollution/crime; `processBirthsAndDeaths()` uses happinessFactor/diseaseFactor/environmentFactor/pollutionFactor | No global population growth rate |
| `systems/edict-system.js` | `environment` stances {open/reduced/clean} affecting pollutionModifier/environmentModifier; `healthcare` stances affecting diseaseModifier/diseaseSpawnReduction | No global environment/disease computation |
| `systems/wonders-system.js` | cleanMining (removes mine pollution), cleanAssembly (removes assembly pollution), supremeRecycling (triples recycling), environmentalResearchComplex (cuts lab pollution/disease 50%), nuclearWarheadFacility (produces nukes) | No global environment |
| `systems/projects-system.js` | missileSilo (produces missiles); `statistics.missileLaunches/nukeLaunches/missileHits/nukeHits` | No global strike tracking |
| `core/game-engine.js` | `this.systems` object (no global entry); `initializeSystems()`; uses `window.Nation` singleton (client-side) | No global system registered; no `getAllPlayers()` method visible on GameEngineClass |
| `core/config.js` | `GameEvents` = {DAY_PASSED:'day_passed', MONTH_PASSED:'month_passed', YEAR_PASSED:'year_passed', GOVERNMENT_DEMAND:'government_demand', GOVERNMENT_CHANGED:'government_changed', RELIGION_DEMAND:'religion_demand', RELIGION_CHANGED:'religion_changed', WAR_DECLARED:'war_declared', NATION_CREATED:'nation_created', NATION_UPDATED:'nation_updated', HAPPINESS_CHANGED:'happiness_changed', ...}; `INITIAL_HAPPINESS: 50` | No global event constants |
| `systems/data-integration-system.js` | Loads national/global disease data into `window.NATIONAL_DISEASES`/`window.GLOBAL_DISEASES` | No global stats integration |
| `core/world-forum-system.js` | `worldSettings` {worldName, calendar}; `activeEffects` for motion effects | No global stats (happiness/pollution/etc.) |

---

## 3. Architecture Decision: Entity + System (BOTH)

Create **two** files:

| File | Class | Responsibility |
|------|-------|----------------|
| `entities/GlobalWorld.js` | `GlobalWorldClass` | Singleton state holder — stores global averages, recent strike history, government/religion tallies, global config, serialization |
| `systems/global-system.js` | `GlobalSystemClass` | Calculation engine — computes averages, applies modifiers, handles Environment pipeline, disease spawn, gov/religion weighing, listens to WarSystem hit events |

**Why both:** The entity owns persistent state (averages, strike log, tallies). The system owns pure logic (formulas, ordering, side effects). Matches existing pattern: `Nation` (entity) + per-domain `*System` classes.

**Global instance:** `window.GlobalWorld` (entity) and `window.GlobalSystem` (system), registered in `core/game-engine.js` `this.systems.global`.

---

## 4. Data Model — GlobalWorld entity (`entities/GlobalWorld.js`)

```js
class GlobalWorldClass {
    constructor() {
        this.isInitialized = false;

        // ── Global averages (0-100 scale unless noted) ──
        // These match Nation.nationStats field names exactly for feed-back
        this.globalAverages = {
            happiness: 50,        // matches Nation.nationStats.happiness
            pollution: 0,         // matches Nation.nationStats.pollution
            disease: 10,          // matches Nation.nationStats.disease
            crime: 15,            // matches Nation.nationStats.crime
            environment: 50,      // matches Nation.nationStats.environment
            populationDensity: 0,   // people per sq mile (population / land)
            education: 50,        // global education level (0-100), affects immigrant education tier
            literacyRate: 50      // global literacy rate (0-100), affects immigrant literacy score
        };

        // ── Previous tick averages (for delta/trend tracking) ──
        this.previousAverages = { ...this.globalAverages };

        // ── Recent strike history (successful hits only, non-intercepted) ──
        // Each entry: { nationId, attackerId, type:'missile'|'nuke', day, damage, warId }
        // day = TimeSystem.currentTime.totalDays
        this.recentStrikes = []; // capped by config.strikeWindowDays

        // ── Government / religion tallies across all nations ──
        // Keys match nation.government / nation.religion string IDs
        this.governmentTally = {}; // govId -> count (e.g. {'liberalDemocracy': 12})
        this.religionTally = {};   // religionId -> count (e.g. {'monotheism': 8})
        this.totalNations = 0;

        // ── Derived majority / opposite suggestions ──
        this.majorityGovernment = null;   // govId with most nations
        this.majorityReligion = null;     // religionId with most nations
        this.suggestedGovernment = null;  // random gov EXCEPT majorityGovernment
        this.suggestedReligion = null;    // random religion EXCEPT majorityReligion

        // ── Config / tuning constants ──
        this.config = {
            globalInfluenceWeight: 0.05,   // 5%: how strongly global averages nudge each nation (small as requested)
            strikeWindowDays: 30,          // days to keep strike history (1 turn = 1 game day)
            nukeEnvPenalty: 25,            // environment points per successful nuke (high penalty)
            missileEnvPenalty: 5,          // environment points per successful missile (low penalty)
            diseaseGlobalBaseChance: 0.01, // 1% base global disease spawn per check
            govReligionRecalcIntervalDays: 1 // recalc tallies each day
        };

        // ── Serialization helpers ──
        this.saveVersion = 1;
    }

    serialize() {
        return {
            saveVersion: this.saveVersion,
            globalAverages: { ...this.globalAverages },
            previousAverages: { ...this.previousAverages },
            recentStrikes: [...this.recentStrikes],
            governmentTally: { ...this.governmentTally },
            religionTally: { ...this.religionTally },
            totalNations: this.totalNations,
            majorityGovernment: this.majorityGovernment,
            majorityReligion: this.majorityReligion,
            suggestedGovernment: this.suggestedGovernment,
            suggestedReligion: this.suggestedReligion,
            config: { ...this.config }
        };
    }

    deserialize(data) {
        if (!data) return;
        this.globalAverages = { ...this.globalAverages, ...(data.globalAverages || {}) };
        this.previousAverages = { ...this.previousAverages, ...(data.previousAverages || {}) };
        this.recentStrikes = data.recentStrikes ? [...data.recentStrikes] : [];
        this.governmentTally = data.governmentTally ? { ...data.governmentTally } : {};
        this.religionTally = data.religionTally ? { ...data.religionTally } : {};
        this.totalNations = data.totalNations || 0;
        this.majorityGovernment = data.majorityGovernment || null;
        this.majorityReligion = data.majorityReligion || null;
        this.suggestedGovernment = data.suggestedGovernment || null;
        this.suggestedReligion = data.suggestedReligion || null;
        if (data.config) this.config = { ...this.config, ...data.config };
        this.isInitialized = true;
    }
}
```

---

## 5. Calculation Pipeline (order of operations is CRITICAL)

The GlobalSystem runs once per game day on `GameEvents.DAY_PASSED` (`'day_passed'`). The order below MUST be preserved because **Environment depends on all other averages + strikes**:

```
STEP 1: Gather all nations
        Source: window.gameEngine.getAllPlayers() (DiseaseSystem already uses this pattern)
        Fallback: window.Nation singleton (client single-player) + AI nations (core/ai-nations.js has this.aiNations Map)
        NOTE: Nation.serialize() does NOT include nationStats — must compute from live objects

STEP 2: Tally governments and religions
        For each nation: governmentTally[nation.government]++
                         religionTally[nation.religion]++

STEP 3: Compute global averages (mean across all nations)
        a) happiness   = mean(nation.nationStats.happiness)
        b) pollution   = mean(nation.nationStats.pollution)
        c) disease     = mean(nation.nationStats.disease)
        d) crime       = mean(nation.nationStats.crime)
        e) popDensity  = mean(nation.population / nation.land across all nations)
        (environment NOT computed yet — depends on above + strikes)

STEP 4: Record recent successful strikes
        From WarSystem 'missile_hit'/'nuke_hit' events (listened via EventBus)
        Prune strikes older than strikeWindowDays

STEP 5: Compute Environment average (LAST among averages)
        baseEnvironment = f(pollutionAvg, diseaseAvg, crimeAvg, happinessAvg)
        strikePenalty   = (nukeCount * nukeEnvPenalty) + (missileCount * missileEnvPenalty)
        globalAvg.environment = clamp(baseEnvironment - strikePenalty, 0, 100)

STEP 6: Apply global-average modifiers back to each nation
        nation.nationStats.F += (globalAvg.F - nation.nationStats.F) * globalInfluenceWeight
        Applied to: happiness, pollution, disease, crime, environment (NOT literacy)
        Clamp each to 0-100
        Also sync nation.happiness = nation.nationStats.happiness (matches updateHappiness() Nation.js:1504)

STEP 6.5: Apply global effects to new immigrants (in PopulationSystem.createImmigrant())
        GlobalSystem.applyGlobalEffectsToImmigrant(citizen) applies:
          - Happiness: global happiness avg ±10 variation
          - Criminal: global crime (>30) + low happiness (<40) increase criminal chance (base 5%, cap 30%)
          - Health: 100 reduced by pollution (>50) and disease (>20), ±10 variation
          - Education: global education level determines tier (none/primary/secondary/higher)
          - Literacy: global literacy rate ±15, +20 if gifted, capped by nation literacy+20

STEP 7: Compute Global Disease Spawn chance from national averages
        Uses globalAvg.pollution/disease/happiness/environment + strike counts

STEP 8: Emit events
        GLOBAL_AVERAGES_UPDATED, GLOBAL_ENVIRONMENT_CALCULATED,
        GLOBAL_DISEASE_SPAWN_CHECK, GLOBAL_MAJORITY_SHIFTED

STEP 9: Persist state (GlobalWorld.serialize() → persist-store / data-manager)
```

**Key constraint:** Environment is calculated LAST among averages because it depends on pollution, disease, crime, happiness averages AND strike data. Strike data must be captured before Environment calc.

---

## 6. Global Factors Formulas (exact field names)

### 6.1 Global Averages with Real-World Interdependencies

Global stats are NOT simple means — they're cross-modified by each other to model real-world causality, plus a ±5 random factor so outcomes aren't purely player-driven.

**Step A: Raw averages** (simple means across all nations)
```
rawHappiness   = mean(nation.nationStats.happiness)
rawPollution   = mean(nation.nationStats.pollution)
rawDisease     = mean(nation.nationStats.disease)
rawCrime       = mean(nation.nationStats.crime)
rawPopulationDensity = mean(nation.population / nation.land across all nations)  // people per sq mile
rawEducation   = mean(computed per nation from tech + schools + universities + wonders)
rawLiteracy    = mean(nation.nationStats.literacy)
```

**Step B: Cross-modifiers** (±5 random variation added to each)

| Target | Increases When | Decreases When |
|--------|---------------|----------------|
| **Happiness** | High literacy (>60) | High crime (>30), high disease (>20), high pollution (>50), poor environment (<40, from previous tick) |
| **Crime** | Low happiness (<40), high disease (>20), high pollution (>50), poor environment (<40), low education (<40), low literacy (<50), high pop density (>10) | — |
| **Disease** | High pollution (>60), poor environment (<40), low happiness (<40), high crime (>30) | High education (>60) |
| **Pollution** | High pop density (>50) | Clean environment (>70) |
| **Education** | High happiness (>60) | — |
| **Literacy** | High education (>60) | — |

**Step C: Modified averages** (clamped 0-100)
```
globalAvg.F = clamp(rawF + modifierF, 0, 100)
```

**Population Density** — clamped 0-1000 people per sq mile.
```
globalAvg.populationDensity = clamp(mean(nation.population / nation.land across all nations), 0, 1000)
```

### 6.2 Feed-back to Nations (small global influence)

### 6.2 Feed-back to Nations (small global influence)

Each nation's stats are nudged toward the global average by `globalInfluenceWeight` (default 0.05 = 5%):

```
nation.nationStats.F = nation.nationStats.F + (globalAvg.F - nation.nationStats.F) * globalInfluenceWeight
```

Applied to: `happiness`, `pollution`, `disease`, `crime`, `environment`. (Literacy excluded — tech/school driven.)

After modification, sync `nation.happiness = nation.nationStats.happiness` (matches `updateHappiness()` behavior in Nation.js:1504).

Clamp each to 0-100.

### 6.3 Environment Pipeline (most complex — everything affects Environment)

Environment is computed LAST among averages because it depends on all other modified averages + decayed strike pollution.

```
STEP A: pollutionAvg   = globalAverages.pollution (already cross-modified)
STEP B: diseaseAvg     = globalAverages.disease (already cross-modified)
STEP C: crimeAvg       = globalAverages.crime (already cross-modified)
STEP D: happinessAvg   = globalAverages.happiness (already cross-modified)

STEP E: baseEnvironment = 100 - pollutionAvg
                                     - (diseaseAvg * 0.2)
                                     - (crimeAvg * 0.1)
                                     + (happinessAvg - 50) * 0.1

STEP F: strikePollutionPenalty = cumulativeNukePollution + cumulativeMissilePollution
        (already decayed by applyEnvironmentalDecay(); nukes=25 pts each decaying at 0.5%/day,
         missiles=5 pts each decaying at 2%/day)

STEP G: globalAvg.environment = clamp(baseEnvironment - strikePollutionPenalty, 0, 100)
```

**Everything affects Environment:** pollution average, disease average, crime average, happiness average, plus decayed cumulative nuke/missile strike pollution.

This is IN ADDITION TO each nation's own `calculateEnvironment()` (Nation.js:923) which does `100 - pollution + edictEffects.environmentModifier + policyEffects.environmentalHealth*20 + wonderEffects.environmentBonus*100`. The global environment average is computed separately and fed back as a modifier via Step 6.

### 6.4 Environmental Decay System (Real-World Healing)

Pollution from nukes and missiles doesn't vanish instantly — it decays over time, modeling real-world environmental healing:

**Cumulative Strike Pollution** (tracked separately from per-nation pollution):
- `cumulativeNukePollution` — pollution points from nukes (25 pts per nuke)
- `cumulativeMissilePollution` — pollution points from missiles (5 pts per missile)
- Added when `recordStrike()` processes a `missile_hit`/`nuke_hit` event

**Decay Rates** (per game day, applied in `applyEnvironmentalDecay()`):
| Source | Decay Rate | Half-Life (approx) | Behavior |
|--------|-----------|-------------------|----------|
| Nukes | 0.5% (0.005) | ~138 days | Very slow — nuclear fallout lingers |
| Missiles | 2% (0.02) | ~34 days | Moderate — conventional pollution clears faster |
| Base Pollution | 0.5% (0.005) | ~138 days | Background pollution heals slowest |

**Environment Calculation** (in `computeEnvironment()`):
```
baseEnvironment = 100 - pollutionAvg - diseaseAvg*0.2 - crimeAvg*0.1 + (happinessAvg-50)*0.1
strikePollutionPenalty = cumulativeNukePollution + cumulativeMissilePollution  (already decayed)
environment = clamp(baseEnvironment - strikePollutionPenalty, 0, 100)
```

**Pipeline Order:**
1. Prune strikes older than 30 days (used for disease chance)
2. **Apply environmental decay** to cumulative strike pollution + base pollution
3. Count strikes in window (for disease spawn chance only)
4. Compute Environment using decayed cumulative pollution

**Persistence:** `cumulativeNukePollution` and `cumulativeMissilePollution` are saved/loaded via `GlobalWorld.serialize()`/`deserialize()`.

### 6.5 Government / Religion Majority Weighing (opposite suggestion)

### 6.5 Immigrant Global Effects

### 6.6 Sports Global Stats & Draft Rework

### 6.7 Education Building Global Stats

**Education building tracking** (`GlobalWorld.educationBuildings`) counts education buildings across ALL nations:

| Building Type | Source | Max Per Nation | Field |
|--------------|--------|----------------|-------|
| School | `improvements.school` | 5 | `educationBuildings.school` |
| National University | `projects.university` | 3 | `educationBuildings.nationalUniversity` |
| Advanced University | `projects.advancedUniversity` | 1 | `educationBuildings.advancedUniversity` |
| Great Library | `wonders.great_library` | 1 | `educationBuildings.greatLibrary` |
| Universal Education System | `wonders.universalEducation` | 1 | `educationBuildings.universalEducationSystem` |

For each building type, GlobalSystem computes:
- `totalBuilt` — sum across all nations
- `totalMaxSlots` — maxPerNation × nationCount
- `avgBuiltPerNation` — totalBuilt / nationCount
- `nationsWithAtLeastOne` — count of nations with ≥1 built
- `fillPercentage` — totalBuilt / totalMaxSlots × 100

Aggregate across ALL types:
- `totalBuilt`, `totalMaxSlots`, `avgBuiltPerNation`, `fillPercentage`, `nationCount`

Computed daily in `computeEducationBuildingStats()`.
Event: `GLOBAL_EDUCATION_BUILDING_STATS_UPDATED`.

Accessors: `getEducationBuildingStats(type)`, `getAllEducationBuildingStats()`, `getAvgEducationBuildingsPerNation()`, `getEducationBuildingFillPercentage()`.

### 6.8 Education Buildings → Immigration Effects

**Immigrant Education Tier:** Education building fill percentage boosts education tier thresholds:
- `eduFillBoost = (fillPercentage / 100) * 20` (max +20 threshold at 100% fill)
- Thresholds scaled: primary ×0.6, secondary ×0.3, higher ×0.1 of the boost
- More global education buildings → better educated immigrants

**Immigrant Literacy Score:** Education building fill percentage adds bonus:
- `literacyFillBonus = (fillPercentage / 100) * 15` (max +15 at 100% fill)
- Added to base literacy from global literacyRate ±15 variation

### 6.9 Education Buildings → Nation Effects (Slight)

Education building fill percentage slightly boosts nation literacy rate:
- `eduBuildingBoost = (fillPercentage / 100) * 3` (max +3 literacy at 100% fill)
- Applied directly to `nationStats.literacy` on top of the 1% minor influence weight from global literacyRate average

### 6.10 Government / Religion Majority Weighing (opposite suggestion)

```
STEP 1: governmentTally[govId]++   for each nation (nation.government)
STEP 2: religionTally[relId]++     for each nation (nation.religion)
STEP 3: majorityGovernment  = argmax(governmentTally)
STEP 4: majorityReligion    = argmax(religionTally)
STEP 5: suggestedGovernment = random government from GovernmentSystem.getAllGovernments() EXCEPT majorityGovernment
STEP 6: suggestedReligion   = random religion from ReligionSystem.getAllReligions() EXCEPT majorityReligion
```

Store on GlobalWorld:
- `this.majorityGovernment`, `this.majorityReligion`
- `this.suggestedGovernment`, `this.suggestedReligion`

Government IDs (from government-system.js): `liberalDemocracy`, `constitutionalMonarchy`, `communistState`, `theocraticRepublic`, `militaryJunta`, `corporatistState`, `directDemocracy`, `technocracy`, `federalRepublic`, `singlePartyState`, `anarchoCommunism`, `absoluteMonarchy`.

Religion IDs (from religion-system.js): `atheism`, `monotheism`, `polytheism`, `buddhism`, `hinduism`, `shintoism`, `islam`, `christianity`, `shamanism`, `judaism`, `scientology`, `pastafarianism`.

Citizen religion IDs (from Citizen.js): `monotheism`, `polytheism`, `atheism`, `buddhism`, `hinduism`, `islam`, `christianity`, `judaism`, `shintoism`, `shamanism`, `none`.

Integration: When `Nation.checkDemands()` (Nation.js:1417) sets `demandTimer.currentGovernmentHint`/`currentReligionHint` via `getGovernmentHint()`/`getReligionHint()` (which use `GovernmentSystem.getGovernmentHints()`/`ReligionSystem.getReligionHints()`), the GlobalSystem should override the hint with `suggestedGovernment`/`suggestedReligion` so nations are prompted to adopt the *opposite of the majority*.

### 6.11 World War / Peace Stats

**World war tracking** (`GlobalWorld.warStats`) counts how many nations are at war vs peace globally:

| Field | Description |
|-------|-------------|
| `totalNations` | Total number of nations |
| `nationsAtWar` | Nations currently in an active war |
| `nationsAtPeace` | Nations not in any active war |
| `warPercentage` | % of nations at war (0-100) |
| `peacePercentage` | % of nations at peace (0-100) |
| `activeWarCount` | Number of active wars |
| `lastCalculatedDay` | Game day when last computed |

**Computation:** Uses `WarSystem.getWarByNationId(nationId)` — returns war object if nation is in an active war, null otherwise. A nation is "at war" if it appears on either side of any active war.

**Pipeline:** Computed daily in `computeWorldWarStats()` (after education building stats, before military unit stats).
**Event:** `GLOBAL_WAR_STATS_UPDATED`.
**Accessor:** `getWorldWarStats()`.

### 6.12 Military Unit Global Stats

**Military unit tracking** (`GlobalWorld.militaryUnitStats`) tracks average unit counts across ALL nations:

| Unit Type | Field | Description |
|-----------|-------|-------------|
| Soldiers | `soldiers` | Avg soldiers per nation, total world count, nations with soldiers |
| Tanks | `tanks` | Avg tanks per nation, total world count, nations with tanks |
| Aircraft | `aircraft` | Avg aircraft per nation, total world count, nations with aircraft |
| Ships | `ships` | Avg ships per nation, total world count, nations with ships |
| Spies | `spies` | Avg spies per nation, total world count, nations with spies |
| Missiles | `missiles` | Avg missiles per nation, total world count, nations with missiles |
| Nukes | `nukes` | Avg nukes per nation, total world count, nations with nukes |

Per unit type, tracks:
- `avgPerNation` — world average count per nation
- `totalWorld` — sum across all nations
- `nationsWithUnits` — count of nations with >0 units of this type

**Computation:** Computed daily in `computeMilitaryUnitStats()` (after war stats). Reads `nation.militaryUnits` from each nation.
**Event:** `GLOBAL_MILITARY_UNIT_STATS_UPDATED`.
**Accessors:** `getMilitaryUnitStats(type)`, `getAllMilitaryUnitStats()`.

### 6.13 Currency Type Global Stats

**Currency type tracking** (`GlobalWorld.currencyStats`) tracks what % of nations use each currency type as their primary currency, plus total/average balances:

There are 6 currency types: aurel, velt, krona, drachma, sovereign, talon.

Per currency type, tracks:
| Field | Description |
|-------|-------------|
| `nationCount` | Number of nations using this as their primary currency |
| `totalBalance` | Sum of all balances in this currency across all nations |
| `avgBalance` | Average balance per nation in this currency |
| `pctOfNations` | % of all nations using this currency type (0-100) |
| `totalNations` | Total number of nations (shared across all types) |

**Computation:** Computed daily in `computeCurrencyStats()` (after military unit stats, before special offers). Reads `nation.currency` (primary type) and `nation.currencyBalances` (object of amounts per currency) from each nation.

**Pipeline step:** STEP 12 — after military unit stats, before special offers.

**Event:** `GLOBAL_CURRENCY_STATS_UPDATED`.
**Accessors:** `getCurrencyStats(type)`, `getAllCurrencyStats()`.

**Integration note:** Nations get their primary currency set by `EconomySystem.initializeCurrencies()` (default: 'aurel'). Currency balances are stored in `nation.currencyBalances` object with keys matching the 6 currency types.

### 6.14 Disease Stats (Minor vs Major Active Diseases)

**Disease stats tracking** (`GlobalWorld.diseaseStats`) counts how many nations have active Minor vs Major diseases using `DiseaseSystem.activeOutbreaks`:

| Field | Description |
|-------|-------------|
| `totalNations` | Total number of nations |
| `nationsWithMinorDisease` | Nations with at least one active Minor disease |
| `nationsWithMajorDisease` | Nations with at least one active Major disease |
| `pctWithMinorDisease` | % of nations with Minor disease (0-100) |
| `pctWithMajorDisease` | % of nations with Major disease (0-100) |
| `totalMinorOutbreaks` | Total active Minor outbreak count |
| `totalMajorOutbreaks` | Total active Major outbreak count |
| `lastCalculatedDay` | Game day when last computed |

**Computation:** Computed daily in `computeDiseaseStats()` (after currency stats, before special offers). Reads `DiseaseSystem.activeOutbreaks` Map — each outbreak has `nationId`, `severity` ('minor'|'major'|'global'), `cured` flag, and `disease.scope` ('national'|'global'). Only counts national-scope outbreaks that aren't cured; global-scope diseases are excluded.

**Pipeline step:** STEP 13 — after currency stats, before special offers.

**Event:** `GLOBAL_DISEASE_STATS_UPDATED`.
**Accessor:** `getDiseaseStats()`.

### 6.15 Population Demographics (Age Group Distribution)

**Population demographic tracking** (`GlobalWorld.populationDemographics`) counts how many people are in each age group across ALL nations:

| Demographic Group | Description |
|-------------------|-------------|
| `newborn` | 0-5 days old |
| `infant` | 5-12 days old |
| `toddler` | 12-20 days old |
| `child` | 20-35 days old |
| `teen` | 35-105 days old |
| `youngAdult` | 105-175 days old |
| `adult` | 175-245 days old |
| `middleAged` | 245-315 days old |
| `older` | 315-335 days old |
| `senior` | 335-355 days old |
| `elderly` | 355+ days old |

Per demographic group, tracks:
| Field | Description |
|-------|-------------|
| `totalCount` | Sum of people in this group across all nations |
| `pctOfWorld` | % of total world population in this group (0-100) |
| `totalPopulation` | Total world population across all groups |

**Computation:** Computed daily in `computePopulationDemographics()` (after disease stats, before special offers). Reads each nation's `PopulationSystem.ageGroups` Map — each group has a `count` field that is maintained daily as citizens age and transition between groups.

**Pipeline step:** STEP 14 — after disease stats, before special offers.

**Event:** `GLOBAL_POPULATION_DEMOGRAPHICS_UPDATED`.
**Accessor:** `getPopulationDemographics()`.

---



## 7. Strike Tracking Integration (exact event payloads)

WarSystem (`systems/war-system.js`) emits via `safeEmit` (NOT `EventBus.emit` directly):

| Event | Line | Payload | Notes |
|-------|------|---------|-------|
| `'missile_hit'` | 857 | `{ warId, attacker, targetSide, damage }` | targetSide = 'attacker' or 'defender' |
| `'nuke_hit'` | 955 | `{ warId, attacker, targetSide, damage }` | targetSide = 'attacker' or 'defender' |
| `'missile_intercepted'` | 836 | `{ warId, attacker, interceptedBy }` | NOT a successful strike — ignore |
| `'nuke_intercepted'` | 934 | `{ warId, attacker, interceptedBy }` | NOT a successful strike — ignore |

To get target nation IDs for a hit: look up `war.sides[targetSide].nations` from the active war (`war-system.js` `this.activeWars` Map). Each target nation gets a strike entry.

Integration approach:
1. GlobalSystem subscribes to WarSystem events. Since WarSystem uses `safeEmit` (not `EventBus.emit`), verify `safeEmit` routes to EventBus or add EventBus emissions in the hit handlers.
2. On each `missile_hit`/`nuke_hit`, push to `GlobalWorld.recentStrikes`: `{ nationId (each target), attackerId (attacker.id), type, day (TimeSystem.currentTime.totalDays), damage, warId }`
3. Prune strikes older than `strikeWindowDays` each day in the pipeline.

Alternative if `safeEmit` doesn't reach EventBus: GlobalSystem reads `WarSystem.activeWars` each day and aggregates `missilesFired`/`nukesFired` per side — but event-driven is cleaner.

---

## 8. Integration Points (exact files, methods, fields)

| Consumer | File | Integration Detail |
|----------|------|-------------------|
| GameEngine | `core/game-engine.js` | Register `this.systems.global = new GlobalSystem()` in `initializeSystems()` (after disease system, before/after war system). Call `globalSystem.update(deltaTime)` in `update()` loop or bind to `GameEvents.DAY_PASSED`. Expose `window.GlobalSystem`, `window.GlobalWorld`. |
| Nation | `entities/Nation.js` | In `handleDayPassed()` (line 429) AFTER `calculateNationStats()` (line 448), call `GlobalSystem.applyGlobalModifiers(this)`. Also in `checkDemands()` (line 1417), override `demandTimer.currentGovernmentHint` with `GlobalWorld.suggestedGovernment` and `currentReligionHint` with `GlobalWorld.suggestedReligion`. |
| DiseaseSystem | `systems/disease-system.js` | `checkGlobalEvent()` (line 539) should call `GlobalSystem.calculateGlobalDiseaseSpawnChance()` instead of/in addition to its own logic. Pass `globalMetrics` computed by GlobalSystem. |
| GovernmentSystem | `systems/government-system.js` | `getRandomGovernment()` (line 719) / demand hint logic should consult `GlobalWorld.suggestedGovernment`. |
| ReligionSystem | `systems/religion-system.js` | Demand hint logic should consult `GlobalWorld.suggestedReligion`. |
| WarSystem | `systems/war-system.js` | Ensure `missile_hit`/`nuke_hit` events (lines 857, 955) carry data GlobalSystem can use. Currently has `targetSide` — GlobalSystem looks up `war.sides[targetSide].nations` for target nation IDs. |
| Persistence | `core/persist-store.js` / `core/data-manager.js` | Save/load `GlobalWorld.serialize()` / `deserialize()`. **NOTE:** Nation.serialize() does NOT include `nationStats`, so global averages cannot be reconstructed from saved nations alone — must save `GlobalWorld` state separately as a global key. |

---

## 9. Events to Emit

| Event | Payload | Purpose |
|-------|---------|---------|
| `GLOBAL_AVERAGES_UPDATED` | `{ globalAverages, previousAverages }` | Notify UI/systems that global averages changed |
| `GLOBAL_ENVIRONMENT_CALCULATED` | `{ environment, baseEnvironment, strikePenalty, nukeCount, missileCount }` | Environment pipeline result |
| `GLOBAL_DISEASE_SPAWN_CHECK` | `{ chance, triggered, diseaseId }` | Global disease spawn result |
| `GLOBAL_MAJORITY_SHIFTED` | `{ majorityGovernment, majorityReligion, suggestedGovernment, suggestedReligion }` | Gov/religion majority changed |
| `GLOBAL_SPORTS_STATS_UPDATED` | `{ sportsGlobalStats, globalPlayerSkillStandard }` | Sports stats changed |
| `GLOBAL_EDUCATION_BUILDING_STATS_UPDATED` | `{ educationBuildings }` | Education building stats changed |
| `GLOBAL_WAR_STATS_UPDATED` | `{ warStats }` | War/peace stats changed |
| `GLOBAL_MILITARY_UNIT_STATS_UPDATED` | `{ militaryUnitStats }` | Military unit averages changed |
| `GLOBAL_CURRENCY_STATS_UPDATED` | `{ currencyStats }` | Currency type usage stats changed |
| `GLOBAL_DISEASE_STATS_UPDATED` | `{ diseaseStats }` | Minor/Major disease outbreak stats |
| `GLOBAL_POPULATION_DEMOGRAPHICS_UPDATED` | `{ populationDemographics }` | Age group distribution across world |

Note: Use `EventBus.emit()` with `GameEvents`-style string constants. No existing GameEvents constants for global — add new string constants or use bare strings.

---

## 10. Implementation Phases

**Phase 1 — Create GlobalWorld entity** (`entities/GlobalWorld.js`): state schema, defaults, serialize/deserialize.

**Phase 2 — Create GlobalSystem** (`systems/global-system.js`): average computation, environment pipeline, strike tracking (listen to WarSystem hit events), gov/religion weighing, disease spawn chance, modifier application.

**Phase 3 — Wire into GameEngine**: register in `initializeSystems()`, bind to `DAY_PASSED`, expose `window.GlobalSystem`/`window.GlobalWorld`.

**Phase 4 — Wire into Nation**: `handleDayPassed()` call `applyGlobalModifiers(this)` after `calculateNationStats()`; `checkDemands()` use suggested gov/religion for hints.

**Phase 5 — Wire into DiseaseSystem**: route global disease spawn through `GlobalSystem.calculateGlobalDiseaseSpawnChance()`.

**Phase 6 — Wire into Government/Religion systems**: use `suggestedGovernment`/`suggestedReligion` for demand hints.

**Phase 7 — Wire into WarSystem**: ensure hit events provide target nation data for strike log.

**Phase 8 — Persistence**: save/load `GlobalWorld` state via persist-store / data-manager as separate global key.

---

## 11. File Locations

**To create:**
- `entities/GlobalWorld.js` — new entity
- `systems/global-system.js` — new system

**To modify (implementation phase):**
- `core/game-engine.js` — register + update + expose globals
- `entities/Nation.js` — apply modifiers + gov/religion hints
- `systems/disease-system.js` — global spawn route
- `systems/government-system.js` — suggested gov
- `systems/religion-system.js` — suggested religion
- `systems/war-system.js` — hit event target data (may already be sufficient via `war.sides[targetSide].nations`)
- `core/persist-store.js` or `core/data-manager.js` — save/load (separate global key, NOT inside Nation.serialize())
- `core/config.js` — optional: add global event constants to GameEvents

---

## 12. Open Questions (for implementation phase)

1. **Nation source:** `DiseaseSystem` uses `window.gameEngine.getAllPlayers()` but `GameEngineClass` has no visible `getAllPlayers()` method. Confirm whether this exists elsewhere or if GlobalSystem should use `window.Nation` singleton + AI nations (`core/ai-nations.js` has `this.aiNations` Map).
2. **`safeEmit` vs `EventBus.emit`:** WarSystem uses `safeEmit('missile_hit', ...)`. Confirm `safeEmit` routes to EventBus so GlobalSystem can listen. If not, add `EventBus.emit` calls in WarSystem hit handlers.

## 13. Success Criteria (verification when implemented)

- After a day tick, every nation's `nationStats` shows a small shift toward global averages (5% strong / 1% minor weight).
- `GlobalWorld.globalAverages.environment` drops after successful nuke strikes (high: -25 each) and missile strikes (low: -5 each), then recovers over time via decay.
- `GlobalWorld.suggestedGovernment` / `suggestedReligion` are never the current majority.
- `GlobalWorld.warStats.warPercentage` reflects the % of nations currently at war.
- `GlobalWorld.militaryUnitStats.nukes.avgPerNation` reflects world average nukes per nation.
- `Nation.demandTimer.currentGovernmentHint` / `currentReligionHint` reflect the suggested opposite, not random.
- Global disease spawn chance rises when global pollution/disease are high or happiness/environment low, and rises further after recent nukes.
- `GlobalWorld.diseaseStats.pctWithMinorDisease` / `pctWithMajorDisease` reflect the % of nations with active Minor/Major diseases.
- `GlobalWorld.populationDemographics.totalPopulation` equals the sum of all demographic group counts, and each group's `pctOfWorld` sums to ~100%.
- All 8 global averages persist across save/load (saved as separate global key, not inside Nation).
