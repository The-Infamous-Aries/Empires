/**
 * Global System - Global Factors Calculation Engine
 * Dominion Wars - Nation Building Strategy Game
 *
 * Computes global averages across ALL nations for Happiness, Pollution,
 * Disease, Crime, Environment, and Population Growth Rate. Feeds global
 * averages back as small modifiers to individual nation stats. Calculates
 * Environment as a dependent stat (all other averages first, then
 * nuke/missile strike penalties). Weighs government/religion usage by
 * majority and suggests the opposite. Computes Global Disease Spawn
 * chance from national averages.
 *
 * Pipeline order (critical - Environment depends on all other averages):
 *   1. Gather all nations
 *   2. Tally governments and religions
 *   3. Compute global averages (happiness, pollution, disease, crime, popGrowth)
 *   4. Record recent successful nuke/missile strikes
 *   5. Compute Environment average (LAST - depends on above + strikes)
 *   6. Apply global-average modifiers back to each nation
 *   7. Compute Global Disease Spawn chance from national averages
 *   8. Emit events
 *   9. Persist state
 *
 * Listens to: GameEvents.DAY_PASSED, 'missile_hit', 'nuke_hit'
 */
class GlobalSystemClass {
    constructor() {
        this.isInitialized = false;
        this.globalWorld = window.GlobalWorld || null;
        this._dayListener = null;
        this._missileHitListener = null;
        this._nukeHitListener = null;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ════════════════════════════════════════════════════════════════════════════

    initialize() {
        if (this.isInitialized) return;

        // Ensure GlobalWorld exists
        if (!this.globalWorld) {
            if (typeof GlobalWorldClass !== 'undefined') {
                this.globalWorld = new GlobalWorldClass();
            } else if (window.GlobalWorldClass) {
                this.globalWorld = new window.GlobalWorldClass();
            } else {
                console.error('GlobalSystem: GlobalWorldClass not available');
                return false;
            }
            window.GlobalWorld = this.globalWorld;
        }

        // Bind to day-passed event for the daily pipeline
        if (typeof EventBus !== 'undefined' && typeof GameEvents !== 'undefined') {
            this._dayListener = (data) => this.onDayPassed(data);
            EventBus.on(GameEvents.DAY_PASSED, this._dayListener, this);
        }

        // Listen to WarSystem hit events for strike tracking (safeEmit routes to EventBus.emit)
        if (typeof EventBus !== 'undefined') {
            this._missileHitListener = (data) => this.onMissileHit(data);
            this._nukeHitListener = (data) => this.onNukeHit(data);
            EventBus.on('missile_hit', this._missileHitListener, this);
            EventBus.on('nuke_hit', this._nukeHitListener, this);
        }

        this.isInitialized = true;
        console.log('Global System initialized');
        return true;
    }

    destroy() {
        if (typeof EventBus !== 'undefined') {
            if (this._dayListener && typeof GameEvents !== 'undefined') {
                EventBus.off(GameEvents.DAY_PASSED, this._dayListener, this);
            }
            if (this._missileHitListener) {
                EventBus.off('missile_hit', this._missileHitListener, this);
            }
            if (this._nukeHitListener) {
                EventBus.off('nuke_hit', this._nukeHitListener, this);
            }
        }
        this.isInitialized = false;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // NATION GATHERING
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Gather all nations from every available source.
     * window.gameEngine.getAllPlayers() does not exist, so we aggregate from:
     *   1. window.Nation singleton (current player's nation)
     *   2. window.aiNations.aiNations Map (AI nations)
     *   3. window.DataManager.currentPlayer.nations array (player's nations)
     *   4. window.GameEngine.nations object (if present)
     *
     * Returns array of nation objects, deduplicated by id.
     */
    getAllNations() {
        const nations = [];
        const seen = new Set();

        const add = (nation) => {
            if (!nation || !nation.id) return;
            if (seen.has(nation.id)) return;
            seen.add(nation.id);
            nations.push(nation);
        };

        // 1. Current player's nation (window.Nation singleton)
        if (window.Nation) add(window.Nation);

        // 2. AI nations from AINationsSystem
        if (window.aiNations && window.aiNations.aiNations) {
            for (const nation of window.aiNations.aiNations.values()) {
                add(nation);
            }
        }

        // 3. Player's nations from DataManager
        if (window.DataManager && window.DataManager.currentPlayer && window.DataManager.currentPlayer.nations) {
            for (const nation of window.DataManager.currentPlayer.nations) {
                add(nation);
            }
        }

        // 4. GameEngine nations object (if present)
        if (window.GameEngine && window.GameEngine.nations) {
            for (const nation of Object.values(window.GameEngine.nations)) {
                add(nation);
            }
        }

        return nations;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // DAILY PIPELINE (called on GameEvents.DAY_PASSED)
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Main daily calculation pipeline. Runs once per game day.
     * Order is critical: Environment is computed LAST because it depends
     * on all other averages + strike data.
     */
    onDayPassed(data) {
        if (!this.isInitialized || !this.globalWorld) return;

        const currentDay = (window.TimeSystem && window.TimeSystem.currentTime)
            ? window.TimeSystem.currentTime.totalDays
            : (data && data.time ? data.time.totalDays : 0);

        // STEP 1: Gather all nations
        const nations = this.getAllNations();
        if (nations.length === 0) return;

        // Save previous averages for trend tracking
        this.globalWorld.previousAverages = { ...this.globalWorld.globalAverages };

        // STEP 2: Tally governments and religions
        this.computeGovReligionMajority(nations);

        // STEP 3: Compute global averages (all except environment)
        this.computeGlobalAverages(nations);

        // STEP 4: Prune old strikes (strike data already recorded via event listeners)
        this.pruneStrikes(currentDay);

        // STEP 4.5: Apply environmental decay to cumulative strike pollution and base pollution
        this.applyEnvironmentalDecay(currentDay);

        // Count successful strikes in window (still used for disease spawn chance)
        const { nukeCount, missileCount } = this.countStrikesInWindow(currentDay);

        // STEP 5: Compute Environment average (LAST - depends on all above + decayed strike pollution)
        this.computeEnvironment(nations, nukeCount, missileCount);

        // STEP 6: Apply global-average modifiers back to each nation
        // NOTE: Modifiers are applied per-nation in Nation.handleDayPassed()
        // AFTER calculateNationStats(), to avoid being overwritten by stat recalc.
        // GlobalSystem stores the averages; each nation applies them individually.

        // STEP 7: Compute Global Disease Spawn chance from national averages
        this.calculateGlobalDiseaseSpawnChance(nations, nukeCount, missileCount);

        // STEP 8: Compute sports global stats (teams, youth academy, tech center, skill standard)
        this.computeSportsGlobalStats(currentDay);

        // STEP 9: Compute education building global stats (schools, universities, Great Library, etc.)
        this.computeEducationBuildingStats(nations);

        // STEP 10: Compute world war / peace stats
        this.computeWorldWarStats(nations, currentDay);

        // STEP 11: Compute military unit global averages
        this.computeMilitaryUnitStats(nations);

        // STEP 12: Compute currency type global stats
        this.computeCurrencyStats(nations);

        // STEP 13: Compute disease stats (minor/major active diseases per nation)
        this.computeDiseaseStats(nations);

        // STEP 14: Compute population demographics (age group distribution across world)
        this.computePopulationDemographics(nations);

        // STEP 15: Process special offers for teams (during active season phase)
        this.processSpecialOffers(currentDay);

        // STEP 10: Emit events
        this.emitEvents();

        // STEP 9: Persist state
        this.persist();
    }

    // ════════════════════════════════════════════════════════════════════════════
    // STEP 3: COMPUTE GLOBAL AVERAGES (non-environment)
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Compute global averages for happiness, pollution, disease, crime,
     * and population growth rate. Environment is computed separately.
     *
     * All global stats are interdependent like a real world:
     *   - Happiness ← Crime (inverse), Disease (inverse), Pollution (inverse),
     *     Environment (inverse if poor), Literacy (positive), + random
     *   - Crime ← Happiness (inverse), Disease (positive), Pollution (positive),
     *     Environment (inverse if poor), Education (inverse), Literacy (inverse),
     *     PopGrowth (positive), + random
     *   - Disease ← Pollution (positive), Environment (inverse if poor),
     *     Happiness (inverse), Crime (positive), Education (inverse), + random
     *   - Pollution ← PopGrowth (positive), Environment (inverse if clean), + random
     *   - Education ← Happiness (positive), + random
     *   - Literacy ← Education (positive), + random
     *
     * Education is computed from tech + education buildings separately,
     * giving a separate score from literacyRate which uses nationStats.literacy.
     *
     * @param {Array} nations - all nations
     */
    computeGlobalAverages(nations) {
        const gw = this.globalWorld;
        const count = nations.length;

        let sumHappiness = 0;
        let sumPollution = 0;
        let sumDisease = 0;
        let sumCrime = 0;
        let sumPopGrowth = 0;
        let sumEducation = 0;
        let sumLiteracy = 0;

        for (const nation of nations) {
            const ns = nation.nationStats || {};
            sumHappiness += ns.happiness !== undefined ? ns.happiness : (nation.happiness || 50);
            sumPollution += ns.pollution !== undefined ? ns.pollution : 0;
            sumDisease += ns.disease !== undefined ? ns.disease : 0;
            sumCrime += ns.crime !== undefined ? ns.crime : 0;

            // ── Population Density: people per square mile ──
            const nationPopulation = nation.population || 0;
            const nationLand = nation.land || 1; // guard against division by zero
            const nationDensity = nationLand > 0 ? nationPopulation / nationLand : 0;
            sumPopGrowth += nationDensity;

            // ── LiteracyRate: use nation's final literacy stat ──
            const nationLiteracy = ns.literacy !== undefined ? ns.literacy : 0;
            sumLiteracy += nationLiteracy;

            // ── Education: compute from tech + education buildings separately ──
            const techLevel = nation.tech || 0;
            const techEducation = Math.min(40, (techLevel / 2000) * 40);

            const schoolCount = nation.improvements && nation.improvements.school ? nation.improvements.school : 0;
            const schoolEducation = Math.min(30, (schoolCount / 5) * 30);

            const hasUniversity = nation.projectEffects && nation.projectEffects.universityLiteracyBonus ? 1 : 0;
            const universityEducation = hasUniversity * 15;

            const hasEducationWonder = nation.wonderEffects && nation.wonderEffects.universalEducationLiteracyBonus ? 1 : 0;
            const wonderEducation = hasEducationWonder * 15;

            const nationEducation = Math.min(100, techEducation + schoolEducation + universityEducation + wonderEducation);
            sumEducation += nationEducation;
        }

        // ── STEP A: Raw averages (simple means across nations) ──
        const rawHappiness = count > 0 ? sumHappiness / count : 50;
        const rawPollution = count > 0 ? sumPollution / count : 0;
        const rawDisease = count > 0 ? sumDisease / count : 10;
        const rawCrime = count > 0 ? sumCrime / count : 15;
        const rawPopulationDensity = count > 0 ? sumPopGrowth / count : 0;
        const rawEducation = count > 0 ? sumEducation / count : 50;
        const rawLiteracy = count > 0 ? sumLiteracy / count : 50;

        // ── STEP B: Cross-modifiers with randomness (real-world interdependencies) ──
        // Use previous environment average as proxy since Environment is computed after this
        const prevEnv = gw.previousAverages ? gw.previousAverages.environment || 50 : 50;
        const random = () => (Math.random() * 10) - 5; // ±5 random variation
        let happinessMod = 0;
        if (rawCrime > 30) happinessMod -= (rawCrime - 30) * 0.3;
        if (rawDisease > 20) happinessMod -= (rawDisease - 20) * 0.4;
        if (rawPollution > 50) happinessMod -= (rawPollution - 50) * 0.2;
        if (prevEnv < 40) happinessMod -= (40 - prevEnv) * 0.2;
        if (rawLiteracy > 60) happinessMod += (rawLiteracy - 60) * 0.1;
        happinessMod += random();

        let crimeMod = 0;
        if (rawHappiness < 40) crimeMod += (40 - rawHappiness) * 0.4;
        if (rawDisease > 20) crimeMod += (rawDisease - 20) * 0.2;
        if (rawPollution > 50) crimeMod += (rawPollution - 50) * 0.1;
        if (prevEnv < 40) crimeMod += (40 - prevEnv) * 0.2;
        if (rawEducation < 40) crimeMod += (40 - rawEducation) * 0.3;
        if (rawLiteracy < 50) crimeMod += (50 - rawLiteracy) * 0.2;
        if (rawPopulationDensity > 10) crimeMod += (rawPopulationDensity - 10) * 0.2; // high density increases crime
        crimeMod += random();

        let diseaseMod = 0;
        if (rawPollution > 60) diseaseMod += (rawPollution - 60) * 0.3;
        if (prevEnv < 40) diseaseMod += (40 - prevEnv) * 0.2;
        if (rawHappiness < 40) diseaseMod += (40 - rawHappiness) * 0.15;
        if (rawCrime > 30) diseaseMod += (rawCrime - 30) * 0.1;
        if (rawEducation > 60) diseaseMod -= (rawEducation - 60) * 0.1;
        diseaseMod += random();

        let pollutionMod = 0;
        if (rawPopulationDensity > 50) pollutionMod += (rawPopulationDensity - 50) * 0.1; // density increases pollution
        if (prevEnv > 70) pollutionMod -= (prevEnv - 70) * 0.1;
        pollutionMod += random();

        let educationMod = 0;
        if (rawHappiness > 60) educationMod += (rawHappiness - 60) * 0.1;
        educationMod += random();

        let literacyMod = 0;
        if (rawEducation > 60) literacyMod += (rawEducation - 60) * 0.1;
        literacyMod += random();

        // ── STEP D: Modified averages ──
        gw.globalAverages.happiness = Math.max(0, Math.min(100, rawHappiness + happinessMod));
        gw.globalAverages.pollution = Math.max(0, Math.min(100, rawPollution + pollutionMod));
        gw.globalAverages.disease = Math.max(0, Math.min(100, rawDisease + diseaseMod));
        gw.globalAverages.crime = Math.max(0, Math.min(100, rawCrime + crimeMod));
        gw.globalAverages.populationDensity = Math.max(0, Math.min(1000, rawPopulationDensity));
        gw.globalAverages.education = Math.max(0, Math.min(100, rawEducation + educationMod));
        gw.globalAverages.literacyRate = Math.max(0, Math.min(100, rawLiteracy + literacyMod));
        gw.totalNations = count;
    }

    /**
     * Compute Environment average (LAST among averages).
     * Everything affects Environment: pollution, disease, crime, happiness
     * averages, plus decayed cumulative strike pollution (nukes high/slow decay,
     * missiles low/fast decay).
     *
     * @param {Array} nations - all nations
     * @param {number} nukeCount - successful nukes in strike window (for disease only)
     * @param {number} missileCount - successful missiles in strike window (for disease only)
     */
    computeEnvironment(nations, nukeCount, missileCount) {
        const gw = this.globalWorld;

        const pollutionAvg = gw.globalAverages.pollution;
        const diseaseAvg = gw.globalAverages.disease;
        const crimeAvg = gw.globalAverages.crime;
        const happinessAvg = gw.globalAverages.happiness;

        // Total decayed strike pollution (nukes + missiles, already decayed by applyEnvironmentalDecay)
        const cumulativeStrikePollution = gw.cumulativeNukePollution + gw.cumulativeMissilePollution;

        // Base environment from all other averages
        let baseEnvironment = 100
            - pollutionAvg
            - (diseaseAvg * 0.2)
            - (crimeAvg * 0.1)
            + (happinessAvg - 50) * 0.1;

        // Strike pollution penalty: cumulative decayed pollution from nukes and missiles
        // Nukes contribute more and decay slower; missiles less and decay faster
        const strikePollutionPenalty = cumulativeStrikePollution;

        gw.globalAverages.environment = Math.max(0, Math.min(100, baseEnvironment - strikePollutionPenalty));

        // Store last-calculated pipeline details for event emission
        this._lastEnvironmentCalc = {
            environment: gw.globalAverages.environment,
            baseEnvironment,
            strikePollutionPenalty,
            cumulativeNukePollution: gw.cumulativeNukePollution,
            cumulativeMissilePollution: gw.cumulativeMissilePollution,
            nukeCount,
            missileCount
        };
    }

    // ════════════════════════════════════════════════════════════════════════════
    // STEP 6: APPLY GLOBAL MODIFIERS TO NATIONS
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Apply global-average modifiers back to a single nation.
     * Each stat is nudged toward the global average by the appropriate weight.
     * Strong factors (disease/pollution/environment) use globalInfluenceWeight (5%).
     * Slight factors (education/literacy/happiness/crime) use globalMinorInfluenceWeight (1%).
     * This reflects real life: disease/pollution/environment affect nations more directly.
     *
     * @param {Object} nation - Nation object to modify
     */
    applyGlobalModifiers(nation) {
        if (!nation || !this.isInitialized || !this.globalWorld) return;

        const gw = this.globalWorld;
        const strongWeight = gw.config.globalInfluenceWeight;      // 5% for strong factors
        const minorWeight = gw.config.globalMinorInfluenceWeight;  // 1% for slight factors
        const ns = nation.nationStats;

        if (!ns) return;

        // Strong factors: disease, pollution, environment (real-world impact)
        const strongFactors = ['pollution', 'disease', 'environment'];
        // Slight factors: happiness, crime, literacyRate (subtle global influence)
        // Note: education global average is used for immigrant effects only,
        // not applied to nationStats (no nationStats.education field exists)
        // Map global average key -> nationStats field key
        const minorFactorMap = [
            { globalKey: 'happiness', nationKey: 'happiness' },
            { globalKey: 'crime', nationKey: 'crime' },
            { globalKey: 'literacyRate', nationKey: 'literacy' } // globalAverages.literacyRate -> nationStats.literacy
        ];

        const applyFactor = (globalKey, nationKey, weight) => {
            const globalVal = gw.globalAverages[globalKey];
            if (globalVal === undefined) return;

            const currentVal = ns[nationKey] !== undefined ? ns[nationKey] : (nationKey === 'happiness' ? (nation.happiness || 50) : 0);
            const nudged = currentVal + (globalVal - currentVal) * weight;
            ns[nationKey] = Math.max(0, Math.min(100, nudged));
        };

        for (const factor of strongFactors) applyFactor(factor, factor, strongWeight);
        for (const { globalKey, nationKey } of minorFactorMap) applyFactor(globalKey, nationKey, minorWeight);

        // Education building fill percentage slightly boosts nation literacy rate
        // (more schools/universities globally = slightly more literate populace)
        if (gw.educationBuildings && gw.educationBuildings.fillPercentage) {
            const eduFillPct = gw.educationBuildings.fillPercentage; // 0-100
            const eduBuildingBoost = (eduFillPct / 100) * 3; // up to +3 literacy at 100% fill
            const currentLiteracy = ns.literacy !== undefined ? ns.literacy : 0;
            ns.literacy = Math.max(0, Math.min(100, currentLiteracy + eduBuildingBoost));
        }

        // Sync top-level happiness to match nationStats (matches Nation.updateHappiness() at Nation.js:1504)
        if (ns.happiness !== undefined) {
            nation.happiness = ns.happiness;
        }
    }

    /**
     * Apply global modifiers to all nations.
     */
    applyGlobalModifiersToAll(nations) {
        for (const nation of nations) {
            this.applyGlobalModifiers(nation);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // IMMIGRANT GLOBAL EFFECTS
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Apply global-level factors to a newly created immigrant Citizen.
     * Called from PopulationSystem.createImmigrant() after citizen creation.
     *
     * Effects:
     *   - Happiness: immigrant's base happiness = global happiness avg + variation
     *   - Criminal: global happiness & crime determine if immigrant arrives as criminal
     *   - Health: global pollution & disease determine immigrant health
     *   - Education: global education level determines immigrant education tier
     *   - Literacy: global literacy rate determines immigrant literacy score
     *
     * @param {Object} citizen - Citizen object (from Citizen class)
     */
    applyGlobalEffectsToImmigrant(citizen) {
        if (!citizen || !this.isInitialized || !this.globalWorld) return;

        const gw = this.globalWorld;
        const avg = gw.globalAverages;

        // ── 1. Happiness ──
        // Immigrant's base happiness = global happiness average ±10 variation
        const happinessVariation = (Math.random() * 20) - 10;
        citizen.happiness = Math.max(0, Math.min(100, avg.happiness + happinessVariation));

        // ── 2. Criminal (Happiness & Crime) ──
        // Base 5% chance, increased by high global crime and low global happiness
        let criminalChance = 0.05;
        if (avg.crime > 30) criminalChance += ((avg.crime - 30) / 100) * 0.25; // up to +17.5% at crime 100
        if (avg.happiness < 40) criminalChance += ((40 - avg.happiness) / 100) * 0.20; // up to +8% at happiness 0
        criminalChance = Math.max(0, Math.min(0.30, criminalChance)); // cap at 30%

        if (Math.random() < criminalChance) {
            citizen.isCriminal = true;
            citizen.occupation = 'criminal';
            citizen.isEmployed = false;
            citizen.addLifeEvent('Arrived as a criminal immigrant', 'crime');
        }

        // ── 3. Health (Pollution & Disease) ──
        // Base health 100, reduced by high global pollution and disease
        let health = 100;
        if (avg.pollution > 50) health -= (avg.pollution - 50) * 0.6; // up to -30 at pollution 100
        if (avg.disease > 20) health -= (avg.disease - 20) * 0.6;     // up to -48 at disease 100
        const healthVariation = (Math.random() * 20) - 10; // ±10
        citizen.health = Math.max(0, Math.min(100, health + healthVariation));

        // ── 4. Education (Global Education + Education Buildings) ──
        // Global education level (0-100) determines immigrant education tier
        // Education building fill percentage boosts thresholds (more schools/universities = better educated immigrants)
        const eduRand = Math.random() * 100;
        const eduFillPct = gw.educationBuildings ? gw.educationBuildings.fillPercentage || 0 : 0;
        // Fill percentage bonus: up to +20 threshold boost at 100% fill
        const eduFillBoost = (eduFillPct / 100) * 20;

        const eduThresholdPrimary = Math.min(60, (avg.education * 0.6) + eduFillBoost * 0.6);
        const eduThresholdSecondary = Math.min(30, (avg.education * 0.3) + eduFillBoost * 0.3);
        const eduThresholdHigher = Math.min(10, (avg.education * 0.1) + eduFillBoost * 0.1);

        if (eduRand < eduThresholdHigher) {
            citizen.education = 'higher';
        } else if (eduRand < eduThresholdHigher + eduThresholdSecondary) {
            citizen.education = 'secondary';
        } else if (eduRand < eduThresholdHigher + eduThresholdSecondary + eduThresholdPrimary) {
            citizen.education = 'primary';
        } else {
            citizen.education = 'none';
        }

        // ── 5. Literacy Score (Global Literacy Rate + Education Buildings) ──
        // Base literacy from global literacy rate ±15 variation
        // Education building fill percentage adds bonus to literacy score
        const literacyFillBonus = (eduFillPct / 100) * 15; // up to +15 at 100% fill
        let literacy = avg.literacyRate + literacyFillBonus + ((Math.random() * 30) - 15);
        if (citizen.isGifted) literacy += 20;
        citizen.literacyScore = Math.max(0, Math.min(100, literacy));

        // Sync education level to literacy score baseline if not already set higher
        const eduBaseLiteracy = {
            'none': 10,
            'primary': 30,
            'secondary': 60,
            'higher': 80
        };
        const eduBase = eduBaseLiteracy[citizen.education] || 10;
        if (citizen.literacyScore < eduBase) {
            citizen.literacyScore = eduBase + (Math.random() * 10);
            citizen.literacyScore = Math.min(100, citizen.literacyScore);
        }

        citizen.addLifeEvent('Immigrated to the nation', 'migration');
    }

    // ════════════════════════════════════════════════════════════════════════════
    // STEP 2: GOVERNMENT / RELIGION MAJORITY WEIGHING
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Compute government and religion tallies across all nations.
     * Determines the majority and suggests the opposite (random from non-majority).
     * As users change governments/religions, the tallies shift dynamically.
     *
     * @param {Array} nations - all nations
     */
    computeGovReligionMajority(nations) {
        const gw = this.globalWorld;

        // Reset tallies
        gw.governmentTally = {};
        gw.religionTally = {};

        for (const nation of nations) {
            if (nation.government) {
                gw.governmentTally[nation.government] = (gw.governmentTally[nation.government] || 0) + 1;
            }
            if (nation.religion) {
                gw.religionTally[nation.religion] = (gw.religionTally[nation.religion] || 0) + 1;
            }
        }

        // Find majority government
        let maxGovCount = 0;
        gw.majorityGovernment = null;
        for (const [govId, count] of Object.entries(gw.governmentTally)) {
            if (count > maxGovCount) {
                maxGovCount = count;
                gw.majorityGovernment = govId;
            }
        }

        // Find majority religion
        let maxRelCount = 0;
        gw.majorityReligion = null;
        for (const [relId, count] of Object.entries(gw.religionTally)) {
            if (count > maxRelCount) {
                maxRelCount = count;
                gw.majorityReligion = relId;
            }
        }

        // Suggest opposite: random from all available EXCEPT the majority
        gw.suggestedGovernment = this.getRandomExcept(gw.majorityGovernment, this.getAllGovernments());
        gw.suggestedReligion = this.getRandomExcept(gw.majorityReligion, this.getAllReligions());
    }

    /**
     * Get all government IDs from GovernmentSystem.
     */
    getAllGovernments() {
        if (window.GovernmentSystem && typeof window.GovernmentSystem.getAllGovernments === 'function') {
            return window.GovernmentSystem.getAllGovernments();
        }
        // Fallback canonical list (from government-system.js)
        return [
            'liberalDemocracy', 'constitutionalMonarchy', 'communistState',
            'theocraticRepublic', 'militaryJunta', 'corporatistState',
            'directDemocracy', 'technocracy', 'federalRepublic',
            'singlePartyState', 'anarchoCommunism', 'absoluteMonarchy'
        ];
    }

    /**
     * Get all religion IDs from ReligionSystem.
     */
    getAllReligions() {
        if (window.ReligionSystem && typeof window.ReligionSystem.getAllReligions === 'function') {
            return window.ReligionSystem.getAllReligions();
        }
        // Fallback canonical list (from religion-system.js)
        return [
            'atheism', 'monotheism', 'polytheism', 'buddhism', 'hinduism',
            'shintoism', 'islam', 'christianity', 'shamanism', 'judaism',
            'scientology', 'pastafarianism'
        ];
    }

    /**
     * Pick a random element from the array, excluding the excluded value.
     * Returns null if array is empty or all elements are excluded.
     */
    getRandomExcept(excluded, array) {
        if (!array || array.length === 0) return null;
        const candidates = array.filter(item => item !== excluded);
        if (candidates.length === 0) return null;
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // ════════════════════════════════════════════════════════════════════════════
    // STEP 4/5: STRIKE TRACKING (WarSystem event listeners)
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Handle WarSystem 'missile_hit' event.
     * WarSystem.safeEmit routes to EventBus.emit, so this listener fires.
     * Payload: { warId, attacker, targetSide, damage }
     * Target nation IDs come from war.sides[targetSide].nations
     */
    onMissileHit(data) {
        if (!this.isInitialized || !this.globalWorld) return;
        this.recordStrike(data, 'missile');
    }

    /**
     * Handle WarSystem 'nuke_hit' event.
     * Payload: { warId, attacker, targetSide, damage }
     */
    onNukeHit(data) {
        if (!this.isInitialized || !this.globalWorld) return;
        this.recordStrike(data, 'nuke');
    }

    /**
     * Record a successful strike in the global strike history.
     * Looks up target nations from war.sides[targetSide].nations via WarSystem.
     */
    recordStrike(eventData, type) {
        const gw = this.globalWorld;
        const warId = eventData.warId;
        const attacker = eventData.attacker;
        const targetSide = eventData.targetSide;
        const damage = eventData.damage || 0;

        const currentDay = (window.TimeSystem && window.TimeSystem.currentTime)
            ? window.TimeSystem.currentTime.totalDays
            : 0;

        const attackerId = (attacker && attacker.id) || (attacker && attacker.nationId) || null;

        // Determine target nation IDs from the war
        let targetNationIds = [];
        const warSystem = window.GameEngine?.systems?.war || window.WarSystem;
        if (warSystem && warSystem.activeWars && warSystem.activeWars.has(warId)) {
            const war = warSystem.activeWars.get(warId);
            const side = war.sides && war.sides[targetSide];
            if (side && side.nations) {
                targetNationIds = Array.isArray(side.nations)
                    ? side.nations
                    : Object.values(side.nations).map(n => n.id || n);
            }
        }

        // If we couldn't resolve target nations from the war, fall back to attacker (shouldn't happen normally)
        if (targetNationIds.length === 0) {
            // No targets found - still record with attacker as best effort
            targetNationIds = attackerId ? [attackerId] : [];
        }

        for (const nationId of targetNationIds) {
            gw.recentStrikes.push({
                nationId,
                attackerId,
                type,
                day: currentDay,
                damage,
                warId
            });

            // ── Add pollution from strike (decays over time) ──
            // Nukes add high pollution (25 pts), missiles add low (5 pts)
            const pollutionAdded = type === 'nuke' ? gw.config.nukeEnvPenalty : gw.config.missileEnvPenalty;
            if (type === 'nuke') {
                gw.cumulativeNukePollution += pollutionAdded;
            } else {
                gw.cumulativeMissilePollution += pollutionAdded;
            }
        }
    }

    /**
     * Prune strikes older than strikeWindowDays.
     */
    pruneStrikes(currentDay) {
        const gw = this.globalWorld;
        const windowDays = gw.config.strikeWindowDays;
        const cutoff = currentDay - windowDays;

        gw.recentStrikes = gw.recentStrikes.filter(s => s.day >= cutoff);
    }

    /**
     * Apply environmental decay to cumulative strike pollution and base pollution.
     * Nukes decay slower than missiles; base pollution decays slowest.
     * This models real-world environmental healing over time.
     *
     * @param {number} currentDay - current game day
     */
    applyEnvironmentalDecay(currentDay) {
        const gw = this.globalWorld;
        const config = gw.config;

        // Decay cumulative nuke pollution (slow: 0.5% per day)
        gw.cumulativeNukePollution *= (1 - config.nukePollutionDecayRate);

        // Decay cumulative missile pollution (faster: 2% per day)
        gw.cumulativeMissilePollution *= (1 - config.missilePollutionDecayRate);

        // Clamp to prevent floating point drift
        if (gw.cumulativeNukePollution < 0.01) gw.cumulativeNukePollution = 0;
        if (gw.cumulativeMissilePollution < 0.01) gw.cumulativeMissilePollution = 0;

        // Decay base pollution (background pollution healing, slowest)
        // Apply to the running global average so it persists across ticks
        const baseDecay = config.basePollutionDecayRate;
        gw.globalAverages.pollution *= (1 - baseDecay);
        gw.globalAverages.pollution = Math.max(0, Math.min(100, gw.globalAverages.pollution));
    }

    /**
     * Count successful strikes within the strike window.
     * Still used for disease spawn chance (strikes increase disease risk).
     */
    countStrikesInWindow(currentDay) {
        const gw = this.globalWorld;
        const windowDays = gw.config.strikeWindowDays;
        const cutoff = currentDay - windowDays;

        let nukeCount = 0;
        let missileCount = 0;

        for (const s of gw.recentStrikes) {
            if (s.day >= cutoff) {
                if (s.type === 'nuke') nukeCount++;
                if (s.type === 'missile') missileCount++;
            }
        }

        return { nukeCount, missileCount };
    }

    // ════════════════════════════════════════════════════════════════════════════
    // STEP 7: GLOBAL DISEASE SPAWN CHANCE
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Calculate global disease spawn chance from national averages.
     * Same structure as national disease spawn (DiseaseSystem.checkRandomOutbreak)
     * but at global scale using national averages.
     *
     * @param {Array} nations - all nations
     * @param {number} nukeCount - successful nukes in strike window
     * @param {number} missileCount - successful missiles in strike window
     * @returns {Object} { chance, triggered, diseaseId }
     */
    calculateGlobalDiseaseSpawnChance(nations, nukeCount, missileCount) {
        const gw = this.globalWorld;
        const config = gw.config;

        let chance = config.diseaseGlobalBaseChance; // 1% base

        const pollutionAvg = gw.globalAverages.pollution;
        const diseaseAvg = gw.globalAverages.disease;
        const happinessAvg = gw.globalAverages.happiness;
        const environmentAvg = gw.globalAverages.environment;

        // Pollution modifier (global) — mirrors DiseaseSystem: pollution > 60 increases chance
        if (pollutionAvg > 60) {
            chance *= 1 + ((pollutionAvg - 60) / 100) * 1.5; // globalPollutionMultiplier
        }

        // Disease modifier (global) — disease > 30 increases chance
        if (diseaseAvg > 30) {
            chance *= 1 + (diseaseAvg - 30) / 100;
        }

        // Happiness/health modifier (global, inverse) — happiness < 40 increases chance
        if (happinessAvg < 40) {
            chance *= 1 + ((40 - happinessAvg) / 40) * 1.5; // globalHealthMultiplier
        }

        // Environment modifier (global, inverse) — environment < 40 increases chance
        if (environmentAvg < 40) {
            chance *= 1 + ((40 - environmentAvg) / 40) * 0.5;
        }

        // Strike modifier: recent nukes increase global disease chance (fallout)
        chance *= 1 + (nukeCount * 0.10);   // +10% per recent nuke
        chance *= 1 + (missileCount * 0.02); // +2% per recent missile

        const triggered = Math.random() < chance;
        let diseaseId = null;

        if (triggered) {
            diseaseId = this.pickGlobalDisease();
        }

        this._lastDiseaseCalc = { chance, triggered, diseaseId };

        // Emit event even when called standalone (e.g. from DiseaseSystem)
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('GLOBAL_DISEASE_SPAWN_CHECK', { chance, triggered, diseaseId });
        }

        return { chance, triggered, diseaseId };
    }

    /**
     * Pick a random global disease from GLOBAL_DISEASES data.
     * Weighs severity selection by global levels: higher pollution/disease
     * and lower happiness/environment increase the chance of picking major/severe.
     * Falls back to DiseaseSystem.getRandomDisease if available.
     */
    pickGlobalDisease() {
        // Build a weighted pool from object-shaped GLOBAL_DISEASES ({minor, major, severe})
        let diseasePool = [];

        if (window.GLOBAL_DISEASES) {
            const gd = window.GLOBAL_DISEASES;
            const severities = ['minor', 'major', 'severe'];

            // Compute severity weights from global averages
            const pollutionAvg = this.globalWorld.globalAverages.pollution;
            const diseaseAvg = this.globalWorld.globalAverages.disease;
            const happinessAvg = this.globalWorld.globalAverages.happiness;
            const environmentAvg = this.globalWorld.globalAverages.environment;

            // Base weights: minor is most common, severe is rarest
            let wMinor = 1.0;
            let wMajor = 0.3;
            let wSevere = 0.1;

            // Pollution increases severity
            if (pollutionAvg > 60) {
                wMajor *= 1 + ((pollutionAvg - 60) / 100) * 1.5;
                wSevere *= 1 + ((pollutionAvg - 60) / 100) * 2.0;
            }

            // Disease increases severity
            if (diseaseAvg > 30) {
                wMajor *= 1 + (diseaseAvg - 30) / 100;
                wSevere *= 1 + (diseaseAvg - 30) / 150;
            }

            // Low happiness increases severity
            if (happinessAvg < 40) {
                wMajor *= 1 + ((40 - happinessAvg) / 40) * 1.0;
                wSevere *= 1 + ((40 - happinessAvg) / 40) * 1.5;
            }

            // Low environment increases severity
            if (environmentAvg < 40) {
                wMajor *= 1 + ((40 - environmentAvg) / 40) * 0.5;
                wSevere *= 1 + ((40 - environmentAvg) / 40) * 1.0;
            }

            const weights = { minor: wMinor, major: wMajor, severe: wSevere };

            for (const severity of severities) {
                if (gd[severity] && Array.isArray(gd[severity])) {
                    for (const disease of gd[severity]) {
                        const weight = weights[severity] || 1.0;
                        const count = Math.max(1, Math.floor(weight * 10));
                        for (let i = 0; i < count; i++) {
                            diseasePool.push(disease);
                        }
                    }
                }
            }
        }

        if (diseasePool.length > 0) {
            const disease = diseasePool[Math.floor(Math.random() * diseasePool.length)];
            return disease.id || disease.name || null;
        }

        // Fallback: use DiseaseSystem.getRandomDisease with 'global' scope
        if (window.DiseaseSystem && typeof window.DiseaseSystem.getRandomDisease === 'function') {
            try {
                const disease = window.DiseaseSystem.getRandomDisease('major', 'global');
                return disease ? (disease.id || disease.name) : null;
            } catch (e) {
                // Fall through
            }
        }

        return null;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // SPORTS GLOBAL STATS (youth academy, tech center, skill standard)
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Compute global sports stats across all teams.
     * Only includes nations that have teams; counts ALL their teams.
     * Computes per-sport: total teams, teams with youth academy, teams with
     * technology center, total players, avg player skill, avg team skill.
     * Also computes overall globalPlayerSkillStandard across all sports.
     *
     * Uses position-weighted player ratings (position-relevant attributes weighted 2x).
     *
     * @param {number} currentDay - current game day (for tracking)
     */
    computeSportsGlobalStats(currentDay) {
        const gw = this.globalWorld;
        const sportTypes = ['basketball', 'hockey', 'soccer', 'football'];

        // Reset stats
        for (const sport of sportTypes) {
            gw.sportsGlobalStats[sport] = {
                totalTeams: 0,
                teamsWithYouthAcademy: 0,
                teamsWithTechnologyCenter: 0,
                totalPlayers: 0,
                avgPlayerSkill: 50,
                avgTeamSkill: 50,
            };
        }

        // Gather all teams from SportsSystem
        const sportsSystem = window.SportsSystem;
        if (!sportsSystem || !sportsSystem.teams) {
            gw.globalPlayerSkillStandard = 50;
            return;
        }

        // Single pass: collect per-sport accumulators
        const accumulators = {};
        for (const sport of sportTypes) {
            accumulators[sport] = {
                teamCount: 0,
                youthAcademyCount: 0,
                techCenterCount: 0,
                playerCount: 0,
                playerSkillSum: 0,   // per-sport player skill sum
                teamSkillSums: [], // per-team avg skill for averaging across teams
            };
        }

        let totalSkillSum = 0;
        let totalSkillCount = 0;

        for (const [nationId, sports] of sportsSystem.teams) {
            for (const [sport, team] of Object.entries(sports)) {
                if (!sportTypes.includes(sport)) continue;

                const acc = accumulators[sport];
                acc.teamCount++;

                // Check youth academy and technology center upgrades
                if (team.stadium && team.stadium.youthAcademy > 0) {
                    acc.youthAcademyCount++;
                }
                if (team.stadium && team.stadium.technologyCenter > 0) {
                    acc.techCenterCount++;
                }

                // Count players and compute team skill
                let teamSkillSum = 0;
                let teamPlayerCount = 0;

                for (const [playerId, player] of team.players) {
                    acc.playerCount++;
                    teamPlayerCount++;

                    const rating = this.calculatePositionWeightedRating(player, sport, sportsSystem);
                    teamSkillSum += rating;
                    acc.playerSkillSum += rating;  // per-sport skill sum
                    totalSkillSum += rating;
                    totalSkillCount++;
                }

                const teamAvgSkill = teamPlayerCount > 0 ? teamSkillSum / teamPlayerCount : 50;
                acc.teamSkillSums.push(teamAvgSkill);
            }
        }

        // Compute averages per sport from accumulators (single pass, no second loop)
        for (const sport of sportTypes) {
            const acc = accumulators[sport];
            const stats = gw.sportsGlobalStats[sport];

            stats.totalTeams = acc.teamCount;
            stats.teamsWithYouthAcademy = acc.youthAcademyCount;
            stats.teamsWithTechnologyCenter = acc.techCenterCount;
            stats.totalPlayers = acc.playerCount;

            // avgTeamSkill: mean of per-team averages
            if (acc.teamSkillSums.length > 0) {
                stats.avgTeamSkill = acc.teamSkillSums.reduce((a, b) => a + b, 0) / acc.teamSkillSums.length;
            } else {
                stats.avgTeamSkill = 50;
            }

            // avgPlayerSkill: mean of all players in this sport (from accumulator)
            stats.avgPlayerSkill = acc.playerCount > 0 ? acc.playerSkillSum / acc.playerCount : 50;
        }

        // Overall global player skill standard across all sports
        gw.globalPlayerSkillStandard = totalSkillCount > 0 ? totalSkillSum / totalSkillCount : 50;
        gw.globalPlayerSkillStandard = Math.max(0, Math.min(100, gw.globalPlayerSkillStandard));
    }

    // ════════════════════════════════════════════════════════════════════════════
    // EDUCATION BUILDING GLOBAL STATS
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Compute global education building stats across ALL nations.
     * Counts how many of each education building type each nation has built,
     * the max slots allowed per nation, and global averages/fill percentages.
     *
     * Education building types tracked:
     *   - School (improvements.school, max 5 per nation)
     *   - National University (projects.university, max 3 per nation)
     *   - Advanced University (projects.advancedUniversity, max 1 per nation)
     *   - Great Library (wonders.great_library, max 1 per nation)
     *   - Universal Education System (wonders.universalEducation, max 1 per nation)
     *
     * @param {Array} nations - all nations
     */
    computeEducationBuildingStats(nations) {
        const gw = this.globalWorld;

        // Ensure educationBuildings exists (in case of deserialization from old saves)
        if (!gw.educationBuildings) {
            gw.educationBuildings = {
                school: { maxPerNation: 5, totalBuilt: 0, totalMaxSlots: 0, avgBuiltPerNation: 0, nationsWithAtLeastOne: 0, fillPercentage: 0 },
                nationalUniversity: { maxPerNation: 3, totalBuilt: 0, totalMaxSlots: 0, avgBuiltPerNation: 0, nationsWithAtLeastOne: 0, fillPercentage: 0 },
                advancedUniversity: { maxPerNation: 1, totalBuilt: 0, totalMaxSlots: 0, avgBuiltPerNation: 0, nationsWithAtLeastOne: 0, fillPercentage: 0 },
                greatLibrary: { maxPerNation: 1, totalBuilt: 0, totalMaxSlots: 0, avgBuiltPerNation: 0, nationsWithAtLeastOne: 0, fillPercentage: 0 },
                universalEducationSystem: { maxPerNation: 1, totalBuilt: 0, totalMaxSlots: 0, avgBuiltPerNation: 0, nationsWithAtLeastOne: 0, fillPercentage: 0 },
                totalBuilt: 0, totalMaxSlots: 0, avgBuiltPerNation: 0, fillPercentage: 0, nationCount: 0
            };
        }
        const eb = gw.educationBuildings;

        // Reset all counters
        const buildingTypes = ['school', 'nationalUniversity', 'advancedUniversity', 'greatLibrary', 'universalEducationSystem'];
        for (const type of buildingTypes) {
            eb[type].totalBuilt = 0;
            eb[type].totalMaxSlots = 0;
            eb[type].nationsWithAtLeastOne = 0;
        }
        eb.totalBuilt = 0;
        eb.totalMaxSlots = 0;
        eb.nationCount = nations.length;

        for (const nation of nations) {
            // ── School (improvement, max 5 per nation) ──
            const schoolCount = nation.improvements && nation.improvements.school ? nation.improvements.school : 0;
            eb.school.totalBuilt += schoolCount;
            eb.school.totalMaxSlots += eb.school.maxPerNation;
            if (schoolCount > 0) eb.school.nationsWithAtLeastOne++;

            // ── National University (project, max 3 per nation) ──
            const uniCount = nation.projects && nation.projects.university ? nation.projects.university : 0;
            eb.nationalUniversity.totalBuilt += uniCount;
            eb.nationalUniversity.totalMaxSlots += eb.nationalUniversity.maxPerNation;
            if (uniCount > 0) eb.nationalUniversity.nationsWithAtLeastOne++;

            // ── Advanced University (project, max 1 per nation) ──
            const advUniCount = nation.projects && nation.projects.advancedUniversity ? nation.projects.advancedUniversity : 0;
            eb.advancedUniversity.totalBuilt += advUniCount;
            eb.advancedUniversity.totalMaxSlots += eb.advancedUniversity.maxPerNation;
            if (advUniCount > 0) eb.advancedUniversity.nationsWithAtLeastOne++;

            // ── Great Library (wonder, max 1 per nation) ──
            const glCount = nation.wonders && nation.wonders.great_library ? nation.wonders.great_library : 0;
            eb.greatLibrary.totalBuilt += glCount;
            eb.greatLibrary.totalMaxSlots += eb.greatLibrary.maxPerNation;
            if (glCount > 0) eb.greatLibrary.nationsWithAtLeastOne++;

            // ── Universal Education System (wonder, max 1 per nation) ──
            const uesCount = nation.wonders && nation.wonders.universalEducation ? nation.wonders.universalEducation : 0;
            eb.universalEducationSystem.totalBuilt += uesCount;
            eb.universalEducationSystem.totalMaxSlots += eb.universalEducationSystem.maxPerNation;
            if (uesCount > 0) eb.universalEducationSystem.nationsWithAtLeastOne++;
        }

        // Compute per-building-type averages and fill percentages
        for (const type of buildingTypes) {
            const b = eb[type];
            b.avgBuiltPerNation = eb.nationCount > 0 ? b.totalBuilt / eb.nationCount : 0;
            b.fillPercentage = b.totalMaxSlots > 0 ? (b.totalBuilt / b.totalMaxSlots) * 100 : 0;
        }

        // Aggregate across ALL education building types
        eb.totalBuilt = eb.school.totalBuilt + eb.nationalUniversity.totalBuilt +
                        eb.advancedUniversity.totalBuilt + eb.greatLibrary.totalBuilt +
                        eb.universalEducationSystem.totalBuilt;

        eb.totalMaxSlots = eb.school.totalMaxSlots + eb.nationalUniversity.totalMaxSlots +
                           eb.advancedUniversity.totalMaxSlots + eb.greatLibrary.totalMaxSlots +
                           eb.universalEducationSystem.totalMaxSlots;

        eb.avgBuiltPerNation = eb.nationCount > 0 ? eb.totalBuilt / eb.nationCount : 0;
        eb.fillPercentage = eb.totalMaxSlots > 0 ? (eb.totalBuilt / eb.totalMaxSlots) * 100 : 0;
    }

    /**
     * Get education building stats for a specific building type.
     * @param {string} type - 'school', 'nationalUniversity', 'advancedUniversity', 'greatLibrary', 'universalEducationSystem'
     * @returns {Object|null} Education building stats or null
     */
    getEducationBuildingStats(type) {
        if (!this.globalWorld || !this.globalWorld.educationBuildings) return null;
        return this.globalWorld.educationBuildings[type] || null;
    }

    /**
     * Get all education building stats.
     * @returns {Object|null} Full educationBuildings object or null
     */
    getAllEducationBuildingStats() {
        return this.globalWorld ? this.globalWorld.educationBuildings : null;
    }

    /**
     * Get the global average number of education buildings built per nation.
     * @returns {number} Average count
     */
    getAvgEducationBuildingsPerNation() {
        if (!this.globalWorld || !this.globalWorld.educationBuildings) return 0;
        return this.globalWorld.educationBuildings.avgBuiltPerNation;
    }

    /**
     * Get the global fill percentage of education building slots.
     * @returns {number} Percentage (0-100)
     */
    getEducationBuildingFillPercentage() {
        if (!this.globalWorld || !this.globalWorld.educationBuildings) return 0;
        return this.globalWorld.educationBuildings.fillPercentage;
    }

    // WORLD WAR / PEACE STATS
    // =========================

    /**
     * Compute world war/peace stats across all nations.
     * Uses WarSystem.getWarByNationId(nationId) to check if a nation is at war.
     *
     * @param {Array} nations - all nations
     * @param {number} currentDay - current game day
     */
    computeWorldWarStats(nations, currentDay) {
        const gw = this.globalWorld;
        const warSystem = window.GameEngine?.systems?.war || window.WarSystem;

        // Ensure warStats exists (null-safe for old saves)
        if (!gw.warStats) {
            gw.warStats = {
                totalNations: 0, nationsAtWar: 0, nationsAtPeace: 0,
                warPercentage: 0, peacePercentage: 0, activeWarCount: 0, lastCalculatedDay: 0
            };
        }

        gw.warStats.totalNations = nations.length;
        gw.warStats.nationsAtWar = 0;
        gw.warStats.nationsAtPeace = 0;
        gw.warStats.activeWarCount = warSystem && warSystem.activeWars ? warSystem.activeWars.size : 0;
        gw.warStats.lastCalculatedDay = currentDay;

        for (const nation of nations) {
            const nationId = nation.id || nation.nationId;
            if (!nationId) continue;

            const atWar = warSystem && typeof warSystem.getWarByNationId === 'function'
                ? warSystem.getWarByNationId(nationId) !== null
                : false;

            if (atWar) {
                gw.warStats.nationsAtWar++;
            } else {
                gw.warStats.nationsAtPeace++;
            }
        }

        gw.warStats.warPercentage = gw.warStats.totalNations > 0
            ? (gw.warStats.nationsAtWar / gw.warStats.totalNations) * 100
            : 0;
        gw.warStats.peacePercentage = gw.warStats.totalNations > 0
            ? (gw.warStats.nationsAtPeace / gw.warStats.totalNations) * 100
            : 0;
    }

    getWorldWarStats() {
        return this.globalWorld ? this.globalWorld.warStats : null;
    }

    // MILITARY UNIT GLOBAL STATS
    // ==========================

    /**
     * Compute global averages for military units across ALL nations.
     * Tracks soldiers, tanks, aircraft, ships, spies, missiles, nukes.
     *
     * @param {Array} nations - all nations
     */
    computeMilitaryUnitStats(nations) {
        const gw = this.globalWorld;

        // Ensure militaryUnitStats exists (null-safe for old saves)
        if (!gw.militaryUnitStats) {
            gw.militaryUnitStats = {
                soldiers: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
                tanks: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
                aircraft: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
                ships: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
                spies: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
                missiles: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
                nukes: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 }
            };
        }

        const unitTypes = ['soldiers', 'tanks', 'aircraft', 'ships', 'spies', 'missiles', 'nukes'];
        for (const type of unitTypes) {
            gw.militaryUnitStats[type].totalWorld = 0;
            gw.militaryUnitStats[type].nationsWithUnits = 0;
        }

        for (const nation of nations) {
            const units = nation.militaryUnits || {};
            for (const type of unitTypes) {
                const count = units[type] || 0;
                gw.militaryUnitStats[type].totalWorld += count;
                if (count > 0) gw.militaryUnitStats[type].nationsWithUnits++;
            }
        }

        for (const type of unitTypes) {
            const s = gw.militaryUnitStats[type];
            s.avgPerNation = gw.warStats.totalNations > 0 ? s.totalWorld / gw.warStats.totalNations : 0;
        }
    }

    getMilitaryUnitStats(type) {
        if (!this.globalWorld || !this.globalWorld.militaryUnitStats) return null;
        return this.globalWorld.militaryUnitStats[type] || null;
    }

    getAllMilitaryUnitStats() {
        return this.globalWorld ? this.globalWorld.militaryUnitStats : null;
    }

    // CURRENCY TYPE GLOBAL STATS
    // ===========================

    /**
     * Compute global currency type stats across ALL nations.
     * Tracks what % of nations use each currency type (their primary currency)
     * and total/average balances per currency across all nations.
     *
     * @param {Array} nations - all nations
     */
    computeCurrencyStats(nations) {
        const gw = this.globalWorld;

        // Ensure currencyStats exists (null-safe for old saves)
        if (!gw.currencyStats) {
            gw.currencyStats = {
                aurel: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
                velt: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
                krona: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
                drachma: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
                sovereign: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
                talon: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
                totalNations: 0
            };
        }

        // Reset counters
        const currencyKeys = Object.keys(gw.currencyStats).filter(k => k !== 'totalNations');
        for (const key of currencyKeys) {
            gw.currencyStats[key].nationCount = 0;
            gw.currencyStats[key].totalBalance = 0;
            gw.currencyStats[key].avgBalance = 0;
            gw.currencyStats[key].pctOfNations = 0;
        }
        gw.currencyStats.totalNations = nations.length;

        for (const nation of nations) {
            const primaryCurrency = nation.currency || 'aurel';
            const balances = nation.currencyBalances || {};

            // Count which currency this nation primarily uses
            if (gw.currencyStats[primaryCurrency]) {
                gw.currencyStats[primaryCurrency].nationCount++;
            }

            // Sum up total balances per currency across all nations
            for (const key of currencyKeys) {
                const balance = balances[key] || 0;
                gw.currencyStats[key].totalBalance += balance;
            }
        }

        // Compute averages and percentages
        for (const key of currencyKeys) {
            const s = gw.currencyStats[key];
            s.avgBalance = gw.currencyStats.totalNations > 0 ? s.totalBalance / gw.currencyStats.totalNations : 0;
            s.pctOfNations = gw.currencyStats.totalNations > 0 ? (s.nationCount / gw.currencyStats.totalNations) * 100 : 0;
        }
    }

    getCurrencyStats(type) {
        if (!this.globalWorld || !this.globalWorld.currencyStats) return null;
        return this.globalWorld.currencyStats[type] || null;
    }

    getAllCurrencyStats() {
        return this.globalWorld ? this.globalWorld.currencyStats : null;
    }

    // DISEASE STATS
    // =============

    /**
     * Compute global disease stats across all nations.
     * Counts how many nations have active Minor vs Major diseases
     * using DiseaseSystem.activeOutbreaks.
     *
     * @param {Array} nations - all nations
     */
    computeDiseaseStats(nations) {
        const gw = this.globalWorld;
        const diseaseSystem = window.DiseaseSystem;

        // Ensure diseaseStats exists (null-safe for old saves)
        if (!gw.diseaseStats) {
            gw.diseaseStats = {
                totalNations: 0, nationsWithMinorDisease: 0, nationsWithMajorDisease: 0,
                pctWithMinorDisease: 0, pctWithMajorDisease: 0,
                totalMinorOutbreaks: 0, totalMajorOutbreaks: 0, lastCalculatedDay: 0
            };
        }

        // Reset counters
        gw.diseaseStats.totalNations = nations.length;
        gw.diseaseStats.nationsWithMinorDisease = 0;
        gw.diseaseStats.nationsWithMajorDisease = 0;
        gw.diseaseStats.totalMinorOutbreaks = 0;
        gw.diseaseStats.totalMajorOutbreaks = 0;
        gw.diseaseStats.lastCalculatedDay = (window.TimeSystem && window.TimeSystem.currentTime)
            ? window.TimeSystem.currentTime.totalDays
            : 0;

        if (!diseaseSystem || !diseaseSystem.activeOutbreaks) return;

        const nationsWithMinor = new Set();
        const nationsWithMajor = new Set();

        for (const outbreak of diseaseSystem.activeOutbreaks.values()) {
            // Only count national scope diseases (not global ones)
            if (outbreak.disease && outbreak.disease.scope === 'global') continue;

            if (outbreak.cured) continue;

            if (outbreak.severity === 'minor') {
                gw.diseaseStats.totalMinorOutbreaks++;
                if (outbreak.nationId) nationsWithMinor.add(outbreak.nationId);
            } else if (outbreak.severity === 'major') {
                gw.diseaseStats.totalMajorOutbreaks++;
                if (outbreak.nationId) nationsWithMajor.add(outbreak.nationId);
            }
        }

        gw.diseaseStats.nationsWithMinorDisease = nationsWithMinor.size;
        gw.diseaseStats.nationsWithMajorDisease = nationsWithMajor.size;
        gw.diseaseStats.pctWithMinorDisease = gw.diseaseStats.totalNations > 0
            ? (gw.diseaseStats.nationsWithMinorDisease / gw.diseaseStats.totalNations) * 100
            : 0;
        gw.diseaseStats.pctWithMajorDisease = gw.diseaseStats.totalNations > 0
            ? (gw.diseaseStats.nationsWithMajorDisease / gw.diseaseStats.totalNations) * 100
            : 0;
    }

    getDiseaseStats() {
        if (!this.globalWorld || !this.globalWorld.diseaseStats) return null;
        return this.globalWorld.diseaseStats;
    }

    // POPULATION DEMOGRAPHICS
    // =====================

    /**
     * Compute global population demographics across ALL nations.
     * Reads each nation's PopulationSystem.ageGroups counts and aggregates
     * them to determine what % of world population is in each age group.
     *
     * Age groups from PopulationSystem:
     * newborn, infant, toddler, child, teen, youngAdult, adult,
     * middleAged, older, senior, elderly
     *
     * @param {Array} nations - all nations
     */
    computePopulationDemographics(nations) {
        const gw = this.globalWorld;

        // Ensure populationDemographics exists (null-safe for old saves)
        if (!gw.populationDemographics) {
            gw.populationDemographics = {
                newborn: { totalCount: 0, pctOfWorld: 0 },
                infant: { totalCount: 0, pctOfWorld: 0 },
                toddler: { totalCount: 0, pctOfWorld: 0 },
                child: { totalCount: 0, pctOfWorld: 0 },
                teen: { totalCount: 0, pctOfWorld: 0 },
                youngAdult: { totalCount: 0, pctOfWorld: 0 },
                adult: { totalCount: 0, pctOfWorld: 0 },
                middleAged: { totalCount: 0, pctOfWorld: 0 },
                older: { totalCount: 0, pctOfWorld: 0 },
                senior: { totalCount: 0, pctOfWorld: 0 },
                elderly: { totalCount: 0, pctOfWorld: 0 },
                totalPopulation: 0
            };
        }

        const demo = gw.populationDemographics;

        // Reset counters
        const ageGroups = [
            'newborn', 'infant', 'toddler', 'child', 'teen', 'youngAdult',
            'adult', 'middleAged', 'older', 'senior', 'elderly'
        ];
        for (const group of ageGroups) {
            demo[group].totalCount = 0;
        }
        demo.totalPopulation = 0;

        for (const nation of nations) {
            const popSystem = nation.populationSystem || window.PopulationSystem;
            if (!popSystem || !popSystem.ageGroups) continue;

            for (const group of ageGroups) {
                const groupData = popSystem.ageGroups[group];
                if (groupData && groupData.count) {
                    demo[group].totalCount += groupData.count;
                    demo.totalPopulation += groupData.count;
                }
            }
        }

        // Compute percentages
        for (const group of ageGroups) {
            demo[group].pctOfWorld = demo.totalPopulation > 0
                ? (demo[group].totalCount / demo.totalPopulation) * 100
                : 0;
        }
    }

    getPopulationDemographics() {
        if (!this.globalWorld || !this.globalWorld.populationDemographics) return null;
        return this.globalWorld.populationDemographics;
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // EVENTS + PERSISTENCE
    // ══════════════════════════════════════════════════════════════════════════════

    emitEvents() {
        if (typeof EventBus === 'undefined') return;

        const gw = this.globalWorld;

        EventBus.emit('GLOBAL_AVERAGES_UPDATED', {
            globalAverages: { ...gw.globalAverages },
            previousAverages: { ...gw.previousAverages }
        });

        if (this._lastEnvironmentCalc) {
            EventBus.emit('GLOBAL_ENVIRONMENT_CALCULATED', { ...this._lastEnvironmentCalc });
        }

        EventBus.emit('GLOBAL_MAJORITY_SHIFTED', {
            majorityGovernment: gw.majorityGovernment,
            majorityReligion: gw.majorityReligion,
            suggestedGovernment: gw.suggestedGovernment,
            suggestedReligion: gw.suggestedReligion
        });

        // Emit sports stats updated event
        EventBus.emit('GLOBAL_SPORTS_STATS_UPDATED', {
            sportsGlobalStats: JSON.parse(JSON.stringify(gw.sportsGlobalStats)),
            globalPlayerSkillStandard: gw.globalPlayerSkillStandard
        });

        // Emit education building stats updated event
        EventBus.emit('GLOBAL_EDUCATION_BUILDING_STATS_UPDATED', {
            educationBuildings: JSON.parse(JSON.stringify(gw.educationBuildings))
        });

        // Emit world war stats updated event
        EventBus.emit('GLOBAL_WAR_STATS_UPDATED', {
            warStats: JSON.parse(JSON.stringify(gw.warStats))
        });

        // Emit military unit stats updated event
        EventBus.emit('GLOBAL_MILITARY_UNIT_STATS_UPDATED', {
            militaryUnitStats: JSON.parse(JSON.stringify(gw.militaryUnitStats))
        });

        // Emit currency type stats updated event
        EventBus.emit('GLOBAL_CURRENCY_STATS_UPDATED', {
            currencyStats: JSON.parse(JSON.stringify(gw.currencyStats))
        });

        // Emit disease stats updated event
        EventBus.emit('GLOBAL_DISEASE_STATS_UPDATED', {
            diseaseStats: JSON.parse(JSON.stringify(gw.diseaseStats))
        });

        // Emit population demographics updated event
        EventBus.emit('GLOBAL_POPULATION_DEMOGRAPHICS_UPDATED', {
            populationDemographics: JSON.parse(JSON.stringify(gw.populationDemographics))
        });
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // EVENTS + PERSISTENCE
    // ═════════════════════════════════════════════════════════════════════════════

    emitEvents() {
        if (typeof EventBus === 'undefined') return;

        const gw = this.globalWorld;

        EventBus.emit('GLOBAL_AVERAGES_UPDATED', {
            globalAverages: { ...gw.globalAverages },
            previousAverages: { ...gw.previousAverages }
        });

        if (this._lastEnvironmentCalc) {
            EventBus.emit('GLOBAL_ENVIRONMENT_CALCULATED', { ...this._lastEnvironmentCalc });
        }

        EventBus.emit('GLOBAL_MAJORITY_SHIFTED', {
            majorityGovernment: gw.majorityGovernment,
            majorityReligion: gw.majorityReligion,
            suggestedGovernment: gw.suggestedGovernment,
            suggestedReligion: gw.suggestedReligion
        });

        // Emit sports stats updated event
        EventBus.emit('GLOBAL_SPORTS_STATS_UPDATED', {
            sportsGlobalStats: JSON.parse(JSON.stringify(gw.sportsGlobalStats)),
            globalPlayerSkillStandard: gw.globalPlayerSkillStandard
        });

        // Emit education building stats updated event
        EventBus.emit('GLOBAL_EDUCATION_BUILDING_STATS_UPDATED', {
            educationBuildings: JSON.parse(JSON.stringify(gw.educationBuildings))
        });

        // Emit world war stats updated event
        EventBus.emit('GLOBAL_WAR_STATS_UPDATED', {
            warStats: JSON.parse(JSON.stringify(gw.warStats))
        });

        // Emit military unit stats updated event
        EventBus.emit('GLOBAL_MILITARY_UNIT_STATS_UPDATED', {
            militaryUnitStats: JSON.parse(JSON.stringify(gw.militaryUnitStats))
        });

        // Emit currency type stats updated event
        EventBus.emit('GLOBAL_CURRENCY_STATS_UPDATED', {
            currencyStats: JSON.parse(JSON.stringify(gw.currencyStats))
        });

        // Emit disease stats updated event
        EventBus.emit('GLOBAL_DISEASE_STATS_UPDATED', {
            diseaseStats: JSON.parse(JSON.stringify(gw.diseaseStats))
        });
    }

    persist() {
        // Save GlobalWorld state to DataManager if available
        if (window.DataManager && typeof window.DataManager.setGlobalState === 'function') {
            window.DataManager.setGlobalState(this.globalWorld.serialize());
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // STATE ACCESSORS
    // ════════════════════════════════════════════════════════════════════════════

    getState() {
        return this.globalWorld ? this.globalWorld.serialize() : null;
    }

    setState(data) {
        if (this.globalWorld && data) {
            this.globalWorld.deserialize(data);
        }
    }

    getGlobalAverages() {
        return this.globalWorld ? { ...this.globalWorld.globalAverages } : null;
    }

    getSuggestedGovernment() {
        return this.globalWorld ? this.globalWorld.suggestedGovernment : null;
    }

    getSuggestedReligion() {
        return this.globalWorld ? this.globalWorld.suggestedReligion : null;
    }

    getMajorityGovernment() {
        return this.globalWorld ? this.globalWorld.majorityGovernment : null;
    }

    getMajorityReligion() {
        return this.globalWorld ? this.globalWorld.majorityReligion : null;
    }
}

// Create global singleton instance
const GlobalSystem = new GlobalSystemClass();

if (typeof window !== 'undefined') {
    window.GlobalSystem = GlobalSystem;
    window.GlobalSystemClass = GlobalSystemClass;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GlobalSystemClass, GlobalSystem };
}
