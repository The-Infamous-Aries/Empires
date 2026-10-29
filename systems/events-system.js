/**
 * Events System - The unified truth source for ALL game-wide events and situations.
 * Dominion Wars - Nation Building Strategy Game
 *
 * Owns event/situation definitions for all 7 types:
 *   - economic-events.js     (world events, no choices, always active)
 *   - sports-events.js       (world events, no choices, permanent)
 *   - disaster-events.js     (world events, no choices, permanent record)
 *   - miracle-events.js      (world events, no choices, permanent record)
 *   - population-situations.js (player-choice situations, 3 choices each)
 *   - nation-situations.js     (player-choice situations, 3 choices each)
 *   - military-situations.js   (player-choice situations, 3 choices each)
 *
 * Manages the shared 5-event/situation slot system per nation.
 * Pending situations (awaiting player choice) occupy a slot and apply
 * a -10 happiness penalty that is removed when a selection is made.
 *
 * Spawning is turn-based (1 turn = 1 real hour). Economic events always
 * spawn independently. All other types use a complex weighted formula
 * with war/peace/nation-stability/sports modifiers.
 *
 * Slot limits:
 *   - Disasters:    max 2 active at a time
 *   - Miracles:     max 2 active at a time
 *   - Nation:       max 3 active at a time
 *   - Population:   max 3 active at a time
 *   - Military:     max 3 active at a time
 *   - Sports:       max 3 active at a time
 *   - Total slots:  5 per nation (all types combined, pending included)
 */

class EventsSystem {
    constructor() {
        this.isInitialized = false;
        this.debugMode = GameConfig.DEBUG.ENABLED;
        this.logLevel = GameConfig.DEBUG.LOG_LEVEL;

        // ── Definition registries (one per event/situation type) ──
        this.economicDefinitions = {};
        this.economicDefinitionCount = 0;

        this.sportsDefinitions = {};
        this.sportsDefinitionCount = 0;

        this.disasterDefinitions = {};
        this.disasterDefinitionCount = 0;

        this.miracleDefinitions = {};
        this.miracleDefinitionCount = 0;

        this.populationSituations = {};
        this.populationSituationCount = 0;

        this.nationSituations = {};
        this.nationSituationCount = 0;

        this.militarySituations = {};
        this.militarySituationCount = 0;

        // ── Active instances per type ──
        this.activeEconomicEvents = [];
        this.activeSportsEvents = [];
        this.activeDisasterEvents = [];
        this.activeMiracleEvents = [];
        this.activePopulationSituations = [];
        this.activeNationSituations = [];
        this.activeMilitarySituations = [];

        // ── Shared slot tracking ──
        // Total active + pending across all non-economic types (economic events don't consume slots)
        this.slotLimit = 5;

        // ── Turn tracking ──
        // 1 turn = 1 real hour. Track which turn the nation was created on
        // and spawn on creation + every 6 turns after.
        this.nationCreationTurn = null;
        this.lastSpawnCheckTurn = null;

        // ── Spawn tuning (base chances, modified by war/peace/stability/sports) ──
        this.baseChanceEconomic = 0.0; // economic events spawn independently via their own timer
        this.baseChanceNation = 0.29;
        this.baseChanceMilitary = 0.29;
        this.baseChancePopulation = 0.29;
        this.baseChanceMiracle = 0.065;
        this.baseChanceDisaster = 0.065;

        // Post-team-unlock chances
        this.postTeamChanceNation = 0.2275;
        this.postTeamChanceMilitary = 0.2275;
        this.postTeamChancePopulation = 0.2275;
        this.postTeamChanceMiracle = 0.045;
        this.postTeamChanceDisaster = 0.045;

        // Modifier ranges
        this.warModifierMilitary = 1.25;    // slightly higher military chance when at war
        this.warModifierPopulation = 0.85;  // slightly lower population chance when at war
        this.peaceModifierPopulation = 1.25; // slightly higher population chance when at peace
        this.peaceModifierMilitary = 0.85;  // slightly lower military chance when at peace

        // Stability modifiers for disasters/miracles
        this.badStabilityDisasterModifier = 1.20;   // higher disaster chance when nation doing poorly
        this.goodStabilityMiracleModifier = 1.20;   // higher miracle chance when nation doing well

        // Sports modifiers
        this.sportsOffSeasonModifier = 1.50;   // higher sports chance in off-season
        this.tournamentModifier = 3.00;        // really high sports chance during tournament
        this.worldTournamentModifier = 5.00;   // extremely high sports chance during world tournament

        // Seed counter for unique instance IDs
        this._instanceCounter = 0;

        // Economic event tuning - always exactly 1 active economic event
        this.spawnChancePerDay = 0.15;           // 10-20% base chance to replace each turn
        this.maxConcurrentEconomicEvents = 1;    // exactly 1 economic event at a time

        // Sports event tuning - max 3 active at a time
        this.sportsSpawnChancePerDay = 0.15;
        this.sportsMaxConcurrentEvents = 3;

        // Disaster event tuning - max 2 active at a time
        this.disasterSpawnChancePerDay = 0.10;
        this.disasterMaxConcurrentEvents = 2;

        // Miracle event tuning - max 2 active at a time
        this.miracleSpawnChancePerDay = 0.10;
        this.miracleMaxConcurrentEvents = 2;

        this.log('info', 'EventsSystem constructed');
    }
    // ── Initialization ──────────────────────────────────────────────

    initialize() {
        if (this.isInitialized) return;
        this.loadEconomicDefinitions();
        this.loadSportsDefinitions();
        this.loadDisasterDefinitions();
        this.loadMiracleDefinitions();
        this.loadPopulationSituations();
        this.loadNationSituations();
        this.loadMilitarySituations();
        this.bindEvents();

        // Detect nation creation turn for turn-based spawning
        const nation = window.Nation;
        if (nation) {
            this.nationCreationTurn = nation.turnCount || 0;
            this.lastSpawnCheckTurn = this.nationCreationTurn;
        }

        // Guarantee at least one economic event is active from the start
        this.ensureMinimumActiveEvents();
        this.isInitialized = true;
        this.log('info', `EventsSystem initialized: ${this.economicDefinitionCount} economic, ${this.sportsDefinitionCount} sports, ${this.disasterDefinitionCount} disaster, ${this.miracleDefinitionCount} miracle, ${this.populationSituationCount} population, ${this.nationSituationCount} nation, ${this.militarySituationCount} military definitions`);
    }
    loadSportsDefinitions() {
        let data = null;
        if (typeof require !== 'undefined' && typeof module !== 'undefined') {
            try { data = require('../assets/data/events/sports-events.js'); } catch (e) { }
        }
        if (!data && typeof window !== 'undefined' && window.SportsEvents) data = window.SportsEvents;
        this.sportsDefinitions = {}; this.sportsDefinitionCount = 0;
        if (data && typeof data === 'object') {
            Object.entries(data).forEach(([category, events]) => {
                if (!Array.isArray(events)) return;
                this.sportsDefinitions[category] = events;
                events.forEach(ev => { ev.category = ev.category || category; ev.type = 'sports'; this.sportsDefinitionCount++; });
            });
        }
        this.log('debug', `Loaded ${this.sportsDefinitionCount} sports event definitions across ${Object.keys(this.sportsDefinitions).length} categories`);
    }

    loadDisasterDefinitions() {
        let data = null;
        if (typeof require !== 'undefined' && typeof module !== 'undefined') {
            try { data = require('../assets/data/events/disaster-events.js'); } catch (e) { }
        }
        if (!data && typeof window !== 'undefined' && window.DisasterEvents) data = window.DisasterEvents;
        this.disasterDefinitions = {}; this.disasterDefinitionCount = 0;
        if (data && typeof data === 'object') {
            Object.entries(data).forEach(([category, events]) => {
                if (!Array.isArray(events)) return;
                this.disasterDefinitions[category] = events;
                events.forEach(ev => { ev.category = ev.category || category; ev.type = 'disaster'; this.disasterDefinitionCount++; });
            });
        }
        this.log('debug', `Loaded ${this.disasterDefinitionCount} disaster event definitions across ${Object.keys(this.disasterDefinitions).length} categories`);
    }

    loadMiracleDefinitions() {
        let data = null;
        if (typeof require !== 'undefined' && typeof module !== 'undefined') {
            try { data = require('../assets/data/events/miracle-events.js'); } catch (e) { }
        }
        if (!data && typeof window !== 'undefined' && window.MiracleEvents) data = window.MiracleEvents;
        this.miracleDefinitions = {}; this.miracleDefinitionCount = 0;
        if (data && typeof data === 'object') {
            Object.entries(data).forEach(([category, events]) => {
                if (!Array.isArray(events)) return;
                this.miracleDefinitions[category] = events;
                events.forEach(ev => { ev.category = ev.category || category; ev.type = 'miracle'; this.miracleDefinitionCount++; });
            });
        }
        this.log('debug', `Loaded ${this.miracleDefinitionCount} miracle event definitions across ${Object.keys(this.miracleDefinitions).length} categories`);
    }
    loadPopulationSituations() {
        let data = null;
        if (typeof require !== 'undefined' && typeof module !== 'undefined') {
            try { data = require('../assets/data/events/population-situations.js'); } catch (e) { }
        }
        if (!data && typeof window !== 'undefined' && window.PopulationSituations) data = window.PopulationSituations;
        this.populationSituations = {}; this.populationSituationCount = 0;
        if (data && typeof data === 'object') {
            Object.entries(data).forEach(([category, events]) => {
                if (!Array.isArray(events)) return;
                this.populationSituations[category] = events;
                events.forEach(ev => { ev.category = ev.category || category; ev.type = 'population'; ev.situationType = 'population'; this.populationSituationCount++; });
            });
        }
        this.log('debug', `Loaded ${this.populationSituationCount} population situation definitions across ${Object.keys(this.populationSituations).length} categories`);
    }

    loadNationSituations() {
        let data = null;
        if (typeof require !== 'undefined' && typeof module !== 'undefined') {
            try { data = require('../assets/data/events/nation-situations.js'); } catch (e) { }
        }
        if (!data && typeof window !== 'undefined' && window.NationSituations) data = window.NationSituations;
        this.nationSituations = {}; this.nationSituationCount = 0;
        if (data && typeof data === 'object') {
            Object.entries(data).forEach(([category, events]) => {
                if (!Array.isArray(events)) return;
                this.nationSituations[category] = events;
                events.forEach(ev => { ev.category = ev.category || category; ev.type = 'nation'; ev.situationType = 'nation'; this.nationSituationCount++; });
            });
        }
        this.log('debug', `Loaded ${this.nationSituationCount} nation situation definitions across ${Object.keys(this.nationSituations).length} categories`);
    }

    loadMilitarySituations() {
        let data = null;
        if (typeof require !== 'undefined' && typeof module !== 'undefined') {
            try { data = require('../assets/data/events/military-situations.js'); } catch (e) { }
        }
        if (!data && typeof window !== 'undefined' && window.MilitarySituations) data = window.MilitarySituations;
        this.militarySituations = {}; this.militarySituationCount = 0;
        if (data && typeof data === 'object') {
            Object.entries(data).forEach(([category, events]) => {
                if (!Array.isArray(events)) return;
                this.militarySituations[category] = events;
                events.forEach(ev => { ev.category = ev.category || category; ev.type = 'military'; ev.situationType = 'military'; this.militarySituationCount++; });
            });
        }
        this.log('debug', `Loaded ${this.militarySituationCount} military situation definitions across ${Object.keys(this.militarySituations).length} categories`);
    }
    bindEvents() {
        if (typeof EventBus === 'undefined' || typeof GameEvents === 'undefined') return;

        // Economic events - world events on their own timer
        EventBus.on(GameEvents.DAY_PASSED, this.handleEconomicDayPassed, this);

        // Sports events - also on day_passed
        EventBus.on(GameEvents.DAY_PASSED, this.handleSportsDayPassed, this);

        // Disaster events - also on day_passed
        EventBus.on(GameEvents.DAY_PASSED, this.handleDisasterDayPassed, this);

        // Miracle events - also on day_passed
        EventBus.on(GameEvents.DAY_PASSED, this.handleMiracleDayPassed, this);

        // Situation spawning - turn-based (every hour/turn)
        EventBus.on(GameEvents.DAY_PASSED, this.handleSituationTurnCheck, this);

        this.log('debug', 'EventsSystem bound to day_passed');
    }

    // ── Economic Spawning ───────────────────────────────────────────

    handleEconomicDayPassed(data) {
        // Apply active economic event effects each turn tick
        for (const instance of this.activeEconomicEvents) {
            this.applyEconomicEvent(instance);
        }

        // Always maintain exactly 1 active economic event
        if (this.activeEconomicEvents.length === 0) {
            // Spawn one immediately if none active (e.g. on world start)
            const event = this.pickRandomEconomicEvent();
            if (event) this.spawnEconomicEvent(event);
            return;
        }

        // Random chance to replace the current economic event with a new random one
        if (Math.random() < this.spawnChancePerDay) {
            const current = this.activeEconomicEvents[0];
            if (current) {
                this.removeEconomicEvent(current);
                this.activeEconomicEvents.splice(0, 1);
            }
            const event = this.pickRandomEconomicEvent();
            if (event) this.spawnEconomicEvent(event);
        }
    }

    ensureMinimumActiveEvents() {
        if (this.activeEconomicEvents.length === 0) {
            const event = this.pickRandomEconomicEvent();
            if (event) {
                this.spawnEconomicEvent(event);
                this.log('info', 'EventsSystem: guaranteed minimum economic event spawned');
            }
        }
    }

    pickRandomEconomicEvent() {
        const categories = Object.values(this.economicDefinitions);
        if (categories.length === 0) return null;
        const pool = [];
        categories.forEach(category => {
            category.forEach(ev => pool.push(ev));
        });
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    spawnEconomicEvent(definition) {
        // Resolve random currency effects at spawn time:
        // pick a random currency type and random value for currency-affecting events
        const resolvedEffects = JSON.parse(JSON.stringify(definition.effects || {}));
        const currencies = ['aurel', 'velt', 'krona', 'drachma', 'sovereign', 'talon'];

        if (resolvedEffects.currencies) {
            const randomCurrency = currencies[Math.floor(Math.random() * currencies.length)];
            const original = resolvedEffects.currencies;
            const newCurrencies = {};

            // Pick one random currency from the event's currency effects
            const keys = Object.keys(original);
            if (keys.length > 0) {
                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                const origChanges = original[randomKey];
                const newChanges = {};

                // Randomize each change value within +/-50% of original (min 0.01)
                if (origChanges.rate !== undefined) {
                    const base = Math.abs(origChanges.rate);
                    const variance = base * 0.5;
                    newChanges.rate = origChanges.rate + (Math.random() * variance * 2 - variance);
                }
                if (origChanges.transferRate !== undefined) {
                    const base = Math.abs(origChanges.transferRate);
                    const variance = base * 0.5;
                    newChanges.transferRate = origChanges.transferRate + (Math.random() * variance * 2 - variance);
                }
                if (origChanges.interestRate !== undefined) {
                    const base = Math.abs(origChanges.interestRate);
                    const variance = base * 0.5;
                    newChanges.interestRate = origChanges.interestRate + (Math.random() * variance * 2 - variance);
                }

                newCurrencies[randomCurrency] = newChanges;
            }
            resolvedEffects.currencies = newCurrencies;
        }

        const instance = {
            id: `econ_${definition.id}_${Date.now()}_${this._instanceCounter++}`,
            definition,
            startedAt: Date.now(),
            snapshots: null,
            applied: false,
            type: 'economic',
            resolvedEffects
        };

        this.applyEconomicEvent(instance);
        this.activeEconomicEvents.push(instance);
        this.log('info', `Economic event started: ${definition.name} (${instance.id})`);
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('economic_event_started', { event: instance, definition });
        }
        return instance;
    }
    // ── Slot Management ─────────────────────────────────────────────

    getActiveSlotCount() {
        // Total slots consumed by all non-economic active situations/events
        return (
            this.activeSportsEvents.length +
            this.activeDisasterEvents.length +
            this.activeMiracleEvents.length +
            this.activePopulationSituations.length +
            this.activeNationSituations.length +
            this.activeMilitarySituations.length
        );
    }

    getTypeActiveCount(type) {
        switch (type) {
            case 'disaster': return this.activeDisasterEvents.length;
            case 'miracle': return this.activeMiracleEvents.length;
            case 'nation': return this.activeNationSituations.length;
            case 'population': return this.activePopulationSituations.length;
            case 'military': return this.activeMilitarySituations.length;
            case 'sports': return this.activeSportsEvents.length;
            default: return 0;
        }
    }

    getTypeSlotLimit(type) {
        switch (type) {
            case 'disaster': return 2;
            case 'miracle': return 2;
            case 'nation': return 3;
            case 'population': return 3;
            case 'military': return 3;
            case 'sports': return 3;
            default: return 2;
        }
    }

    hasSlotAvailable(type) {
        // Must have a total slot available AND a type-specific slot available
        if (this.getActiveSlotCount() >= this.slotLimit) return false;
        if (this.getTypeActiveCount(type) >= this.getTypeSlotLimit(type)) return false;
        return true;
    }

    // ── Turn Tracking ───────────────────────────────────────────────

    getCurrentTurn() {
        const nation = window.Nation;
        if (nation && nation.turnCount !== undefined) return nation.turnCount;
        if (window.GameTime) return GameTime.getTime().totalDays;
        return 0;
    }

    isNationCreationTurn(turn) {
        return this.nationCreationTurn !== null && turn === this.nationCreationTurn;
    }

    shouldSpawnOnTurn(turn) {
        // Always spawn on nation creation turn, then every 6 turns after
        if (this.nationCreationTurn === null) return false;
        if (turn === this.nationCreationTurn) return true;
        if (this.lastSpawnCheckTurn === null) return false;
        return (turn - this.lastSpawnCheckTurn) >= 6;
    }
    // ── Complex Weighted Spawn Formula ──────────────────────────────

    handleSituationTurnCheck(data) {
        const nation = window.Nation;
        if (!nation) return;

        const currentTurn = this.getCurrentTurn();

        // Only check on nation creation turn or every 6 turns after
        if (!this.shouldSpawnOnTurn(currentTurn)) return;

        this.lastSpawnCheckTurn = currentTurn;

        // If no slots available at all, nothing can spawn
        if (this.getActiveSlotCount() >= this.slotLimit) {
            this.log('debug', 'EventsSystem: no slots available, skipping situation spawn');
            return;
        }

        // Determine if teams are unlocked
        const teamsUnlocked = this.areTeamsUnlocked(nation);

        // Determine war/peace state
        const atWar = nation.wars && nation.wars.length > 0;

        // Determine nation stability (happiness, disease, crime, pollution, environment)
        const stability = this.calculateNationStability(nation);

        // Determine sports season/tournament state
        const sportsContext = this.getSportsContext(nation);

        // Build weighted pool
        const weights = this.calculateSpawnWeights(atWar, teamsUnlocked, stability, sportsContext);

        // Roll to see if anything spawns at all (base spawn chance 10-20% modified)
        const spawnRoll = Math.random();
        const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
        const spawnChance = this.calculateBaseSpawnChance(teamsUnlocked, stability, sportsContext);

        if (spawnRoll > spawnChance) {
            this.log('debug', `EventsSystem: no situation spawned this turn (roll=${spawnRoll.toFixed(3)} > chance=${spawnChance.toFixed(3)})`);
            return;
        }

        // Pick a type based on weighted distribution
        const roll = Math.random() * totalWeight;
        let cumulative = 0;
        let selectedType = null;

        for (const [type, weight] of Object.entries(weights)) {
            cumulative += weight;
            if (roll <= cumulative) {
                selectedType = type;
                break;
            }
        }

        if (!selectedType) return;

        // Spawn the selected type if slots available
        if (!this.hasSlotAvailable(selectedType)) {
            this.log('debug', `EventsSystem: selected type ${selectedType} but no slot available`);
            return;
        }

        this.spawnByType(selectedType, nation);
    }

    areTeamsUnlocked(nation) {
        // Teams unlocked if SportsSystem exists and nation has teams
        if (!window.SportsSystem || !window.SportsSystem.teams) return false;
        const teams = window.SportsSystem.teams.get(nation.id);
        return teams && teams.size > 0;
    }

    calculateNationStability(nation) {
        const stats = nation.nationStats || {};
        const happiness = stats.happiness || 50;
        const disease = stats.disease || 10;
        const crime = stats.crime || 15;
        const pollution = stats.pollution || 0;
        const environment = stats.environment || 50;

        // Stability score: 0 = very poor, 1 = very good
        // Good: high happiness, environment; low disease, crime, pollution
        let score = 0;
        score += happiness / 100;           // 0-1
        score += (100 - disease) / 100;     // 0-1
        score += (100 - crime) / 100;       // 0-1
        score += (100 - pollution) / 100;   // 0-1
        score += environment / 100;         // 0-1
        return score / 5;                   // 0-1 normalized
    }

    getSportsContext(nation) {
        if (!window.SportsSystem) return { inSeason: true, inTournament: false, inWorldTournament: false };

        const sportsState = window.SportsSystem.getSportsState ? window.SportsSystem.getSportsState(nation.id) : null;
        if (!sportsState) return { inSeason: true, inTournament: false, inWorldTournament: false };

        return {
            inSeason: sportsState.inSeason !== false,
            inTournament: sportsState.inTournament || false,
            inWorldTournament: sportsState.inWorldTournament || false
        };
    }

    calculateSpawnWeights(atWar, teamsUnlocked, stability, sportsContext) {
        const w = {};

        if (teamsUnlocked) {
            w.nation = this.postTeamChanceNation;
            w.military = this.postTeamChanceMilitary;
            w.population = this.postTeamChancePopulation;
            w.miracle = this.postTeamChanceMiracle;
            w.disaster = this.postTeamChanceDisaster;
            w.sports = 0.2275; // normal sports chance when teams unlocked
        } else {
            w.nation = this.baseChanceNation;
            w.military = this.baseChanceMilitary;
            w.population = this.baseChancePopulation;
            w.miracle = this.baseChanceMiracle;
            w.disaster = this.baseChanceDisaster;
            w.sports = 0; // no sports before teams unlocked
        }

        // War/peace modifiers
        if (atWar) {
            w.military *= this.warModifierMilitary;
            w.population *= this.warModifierPopulation;
        } else {
            w.population *= this.peaceModifierPopulation;
            w.military *= this.peaceModifierMilitary;
        }

        // Stability modifiers for disasters and miracles
        // Poor stability (high disease/crime/pollution, low happiness/environment) -> higher disaster chance
        // Good stability -> higher miracle chance
        const instability = 1 - stability;
        w.disaster *= (1 + instability * this.badStabilityDisasterModifier);
        w.miracle *= (1 + stability * this.goodStabilityMiracleModifier);

        // Sports modifiers
        if (!sportsContext.inSeason) {
            w.sports *= this.sportsOffSeasonModifier;
        }
        if (sportsContext.inWorldTournament) {
            w.sports *= this.worldTournamentModifier;
        } else if (sportsContext.inTournament) {
            w.sports *= this.tournamentModifier;
        }

        return w;
    }

    calculateBaseSpawnChance(teamsUnlocked, stability, sportsContext) {
        // Base spawn chance 10-20%
        let chance = 0.15;

        // Modify based on stability - unstable nations have more events
        chance += (1 - stability) * 0.05;

        // Sports tournaments increase overall spawn chance
        if (sportsContext.inWorldTournament) chance += 0.10;
        else if (sportsContext.inTournament) chance += 0.05;

        // Clamp to 0.10 - 0.30
        return Math.min(0.30, Math.max(0.10, chance));
    }

    spawnByType(type, nation) {
        switch (type) {
            case 'nation': this.spawnNationSituation(nation); break;
            case 'population': this.spawnPopulationSituation(nation); break;
            case 'military': this.spawnMilitarySituation(nation); break;
            case 'disaster': this.spawnDisasterEventInternal(); break;
            case 'miracle': this.spawnMiracleEventInternal(); break;
            case 'sports': this.spawnSportsEventInternal(); break;
        }
    }
    // ── Situation Spawning (population, nation, military) ───────────

    pickRandomSituation(definitions) {
        const categories = Object.values(definitions);
        if (categories.length === 0) return null;
        const pool = [];
        categories.forEach(category => {
            category.forEach(ev => pool.push(ev));
        });
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    spawnNationSituation(nation) {
        const situation = this.pickRandomSituation(this.nationSituations);
        if (!situation) return null;
        return this.createSituationInstance(situation, 'nation', nation);
    }

    spawnPopulationSituation(nation) {
        const situation = this.pickRandomSituation(this.populationSituations);
        if (!situation) return null;
        return this.createSituationInstance(situation, 'population', nation);
    }

    spawnMilitarySituation(nation) {
        // Filter military situations by war/peace state
        const atWar = nation.wars && nation.wars.length > 0;
        const allSituations = Object.values(this.militarySituations).flat();
        const filtered = allSituations.filter(s => s.war_peace === (atWar ? 'war' : 'peace'));
        if (filtered.length === 0) return null;
        const situation = filtered[Math.floor(Math.random() * filtered.length)];
        return this.createSituationInstance(situation, 'military', nation);
    }

    createSituationInstance(definition, type, nation) {
        const instance = {
            id: `${type}_situation_${definition.id}_${Date.now()}_${this._instanceCounter++}`,
            definition,
            type,
            situationType: type,
            startedAt: Date.now(),
            turnCreated: this.getCurrentTurn(),
            status: 'pending', // pending, resolved, expired
            targetNationId: nation.id,
            applied: false,
            happinessPenaltyApplied: false
        };

        // Apply the -10 happiness penalty for pending situation
        this.applyPendingSituationPenalty(instance, true);

        // Add to appropriate active list
        switch (type) {
            case 'nation': this.activeNationSituations.push(instance); break;
            case 'population': this.activePopulationSituations.push(instance); break;
            case 'military': this.activeMilitarySituations.push(instance); break;
        }

        this.log('info', `${type} situation spawned: ${situation.title || situation.name} (${instance.id}) status=pending slot_used`);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('situation_spawned', { event: instance, definition: situation, type });
        }

        return instance;
    }

    applyPendingSituationPenalty(instance, apply) {
        const nation = window.Nation;
        if (!nation) return;
        const stats = nation.nationStats || {};

        if (apply && !instance.happinessPenaltyApplied) {
            stats.happiness = Math.max(0, (stats.happiness || 50) - 10);
            nation.happiness = stats.happiness;
            instance.happinessPenaltyApplied = true;
            this.log('info', `Situation ${instance.id}: -10 happiness penalty applied (pending)`);
        } else if (!apply && instance.happinessPenaltyApplied) {
            stats.happiness = Math.min(100, (stats.happiness || 50) + 10);
            nation.happiness = stats.happiness;
            instance.happinessPenaltyApplied = false;
            this.log('info', `Situation ${instance.id}: +10 happiness penalty removed (resolved)`);
        }
    }

    // ── Resolve a situation (player makes a choice) ─────────────────

    resolveSituation(instance, choiceIndex) {
        const definition = instance.definition;
        if (!definition.choices || !definition.choices[choiceIndex]) {
            this.log('warn', `Situation ${instance.id}: invalid choice index ${choiceIndex}`);
            return false;
        }

        const choice = definition.choices[choiceIndex];
        const nation = window.Nation;
        if (!nation) return false;

        // Remove pending happiness penalty
        this.applyPendingSituationPenalty(instance, false);

        // Apply choice effects
        this.applySituationChoiceEffects(choice.effects, definition.type, nation);

        // Mark as resolved
        instance.status = 'resolved';
        instance.resolvedAt = Date.now();
        instance.resolvedChoice = choiceIndex;

        this.log('info', `Situation ${instance.id}: resolved with choice ${choiceIndex} (${choice.text})`);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('situation_resolved', { event: instance, definition, choiceIndex, choice });
        }

        return true;
    }

    applySituationChoiceEffects(effects, type, nation) {
        if (!effects) return;

        const stats = nation.nationStats || {};

        // Population effects
        if (effects.population) {
            nation.population = Math.floor((nation.population || 0) + effects.population);
        }
        if (effects.population_youngAdult) {
            // Track demographic-specific population
            nation.population_demographics = nation.population_demographics || {};
            nation.population_demographics.youngAdult = (nation.population_demographics.youngAdult || 0) + effects.population_youngAdult;
        }
        if (effects.population_working) {
            nation.population_demographics = nation.population_demographics || {};
            nation.population_demographics.working = (nation.population_demographics.working || 0) + effects.population_working;
        }
        if (effects.population_senior) {
            nation.population_demographics = nation.population_demographics || {};
            nation.population_demographics.senior = (nation.population_demographics.senior || 0) + effects.population_senior;
        }

        // Nation stat effects
        if (effects.happiness !== undefined) {
            stats.happiness = Math.min(100, Math.max(0, (stats.happiness || 50) + effects.happiness));
            nation.happiness = stats.happiness;
        }
        if (effects.disease !== undefined) {
            stats.disease = Math.min(50, Math.max(0, (stats.disease || 10) + effects.disease));
        }
        if (effects.crime !== undefined) {
            stats.crime = Math.min(80, Math.max(0, (stats.crime || 15) + effects.crime));
        }
        if (effects.pollution !== undefined) {
            stats.pollution = Math.min(100, Math.max(0, (stats.pollution || 0) + effects.pollution));
        }
        if (effects.environment !== undefined) {
            stats.environment = Math.min(100, Math.max(0, (stats.environment || 50) + effects.environment));
        }
        if (effects.literacy !== undefined) {
            stats.literacy = Math.min(100, Math.max(0, (stats.literacy || 50) + effects.literacy));
        }

        // Birth rate effect (decimal change applied each turn while situation active)
        if (effects.birthRate !== undefined) {
            nation.birthRate = Math.max(0, (nation.birthRate || 0.01) + effects.birthRate);
            this.log('info', `Situation: birth rate changed by ${effects.birthRate > 0 ? '+' : ''}${effects.birthRate}`);
        }

        // Money effects (negative = % of holdings, scaled by amount magnitude)
        // Bigger absolute amounts → bigger percentages (5% min, 20% max)
        if (effects.money !== undefined) {
            if (effects.money < 0) {
                const abs = Math.abs(effects.money);
                // Map abs value 1000 → 5%, 15000 → 20% (clamped)
                const pct = Math.min(20, Math.max(5, 5 + (abs - 1000) * 15 / 14000));
                const amount = Math.floor((nation.money || 0) * pct / 100);
                nation.money = Math.max(0, (nation.money || 0) - amount);
                this.log('info', `Situation: money cost -${pct.toFixed(1)}% ($${amount})`);
            } else {
                nation.money = (nation.money || 0) + effects.money;
            }
        }

        // Infrastructure cost multiplier (temporary)
        if (effects.infra_cost !== undefined) {
            nation.tempInfraCostMultiplier = effects.infra_cost;
            nation.tempInfraCostExpires = this.getCurrentTurn() + (definition.duration || 30);
        }

        // Land cost multiplier (temporary)
        if (effects.land_cost !== undefined) {
            nation.tempLandCostMultiplier = effects.land_cost;
            nation.tempLandCostExpires = this.getCurrentTurn() + (definition.duration || 30);
        }

        // Tech cost multiplier (temporary)
        if (effects.tech_cost !== undefined) {
            nation.tempTechCostMultiplier = effects.tech_cost;
            nation.tempTechCostExpires = this.getCurrentTurn() + (definition.duration || 30);
        }

        // Infra upkeep change (temporary)
        if (effects.infra_upkeep !== undefined) {
            nation.tempInfraUpkeepChange = effects.infra_upkeep;
            nation.tempInfraUpkeepExpires = this.getCurrentTurn() + (definition.duration || 30);
        }

        // Military upkeep/cost multipliers (temporary)
        const unitUpkeepKeys = ['soldier_upkeep', 'tank_upkeep', 'aircraft_upkeep', 'ship_upkeep', 'spy_upkeep', 'missile_upkeep', 'nuke_upkeep'];
        const unitCostKeys = ['soldier_cost', 'tank_cost', 'aircraft_cost', 'ship_cost', 'spy_cost', 'missile_cost', 'nuke_cost'];
        unitUpkeepKeys.forEach(key => {
            if (effects[key] !== undefined) {
                nation.tempMilitaryUpkeep = nation.tempMilitaryUpkeep || {};
                nation.tempMilitaryUpkeep[key] = effects[key];
                nation.tempMilitaryUpkeepExpires = this.getCurrentTurn() + (definition.duration || 30);
            }
        });
        unitCostKeys.forEach(key => {
            if (effects[key] !== undefined) {
                nation.tempMilitaryCost = nation.tempMilitaryCost || {};
                nation.tempMilitaryCost[key] = effects[key];
                nation.tempMilitaryCostExpires = this.getCurrentTurn() + (definition.duration || 30);
            }
        });

        // Military morale
        if (effects.military_morale !== undefined) {
            nation.militaryMorale = Math.min(1.5, Math.max(0.5, (nation.militaryMorale || 1.0) + effects.military_morale));
        }

        // Unit combat efficiency multipliers (temporary, war situations)
        const unitEffKeys = ['soldier_eff', 'tank_eff', 'aircraft_eff', 'ship_eff'];
        unitEffKeys.forEach(key => {
            if (effects[key] !== undefined) {
                nation.tempMilitaryEfficiency = nation.tempMilitaryEfficiency || {};
                nation.tempMilitaryEfficiency[key] = effects[key];
                nation.tempMilitaryEfficiencyExpires = this.getCurrentTurn() + (definition.duration || 30);
            }
        });

        // Strategic strike infrastructure damage
        if (effects.missile_infra_damage !== undefined) {
            nation.tempMissileInfraDamage = effects.missile_infra_damage;
            nation.tempMissileInfraDamageExpires = this.getCurrentTurn() + (definition.duration || 30);
        }
        if (effects.nuke_infra_damage !== undefined) {
            nation.tempNukeInfraDamage = effects.nuke_infra_damage;
            nation.tempNukeInfraDamageExpires = this.getCurrentTurn() + (definition.duration || 30);
        }

        // Spy operation success chance modifier
        if (effects.spy_ops_success_chance !== undefined) {
            nation.tempSpyOpsSuccessChance = (nation.tempSpyOpsSuccessChance || 0) + effects.spy_ops_success_chance;
            nation.tempSpyOpsSuccessChanceExpires = this.getCurrentTurn() + (definition.duration || 30);
        }

        // Recalculate derived stats
        if (nation.calculatePopulation) nation.calculatePopulation();
        if (nation.calculateNationStats) nation.calculateNationStats();
    }
    // ── Sports Spawning ─────────────────────────────────────────────

    handleSportsDayPassed(data) {
        // Sports events spawn via the situation turn check system,
        // not independently. This handler is kept for compatibility.
    }

    spawnSportsEventInternal() {
        const nation = window.Nation;
        if (!nation) return null;

        const event = this.pickRandomSportsEvent();
        if (!event) return null;

        // Apply sports event to a random team
        const instance = this.applySportsEventToTeam(event, nation);
        if (!instance) return null;

        this.activeSportsEvents.push(instance);

        this.log('info', `Sports event spawned: ${event.name} (${instance.id})`);
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports_event_started', { event: instance, definition: event });
        }
        return instance;
    }

    pickRandomSportsEvent() {
        const categories = Object.values(this.sportsDefinitions);
        if (categories.length === 0) return null;
        const pool = [];
        categories.forEach(category => { category.forEach(ev => pool.push(ev)); });
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    applySportsEventToTeam(definition, nation) {
        const effType = definition.effectType;
        const eventSport = definition.sport;

        // Get eligible teams of this nation
        const allTeams = this.getEligibleTeamsForNation(nation.id);
        if (allTeams.length === 0) {
            this.log('debug', `Sports event ${definition.name}: no eligible teams for nation ${nation.id}`);
            return null;
        }

        // Filter by sport if specified
        const teams = eventSport ? allTeams.filter(t => t.sport === eventSport) : allTeams;
        if (teams.length === 0) {
            this.log('debug', `Sports event ${definition.name}: no teams of sport ${eventSport}`);
            return null;
        }

        const team = teams[Math.floor(Math.random() * teams.length)];

        const instance = {
            id: `sport_${definition.id}_${Date.now()}_${this._instanceCounter++}`,
            definition,
            type: 'sports',
            situationType: 'sports',
            startedAt: Date.now(),
            turnCreated: this.getCurrentTurn(),
            status: 'applied',
            targetTeamId: team.id,
            targetNationId: nation.id,
            applied: true
        };

        // Apply sports effects
        this.applySportsEffect(instance, team, definition);
        return instance;
    }

    getEligibleTeamsForNation(nationId) {
        if (!window.SportsSystem || !window.SportsSystem.teams) return [];
        const teams = [];
        const sportMap = window.SportsSystem.teams.get(nationId);
        if (sportMap && typeof sportMap === 'object') {
            for (const [sportId, team] of Object.entries(sportMap)) {
                if (team && team.id) teams.push(team);
            }
        }
        return teams;
    }

    applySportsEffect(instance, team, def) {
        const effType = def.effectType;
        switch (effType) {
            case 'fansGainedPercent': this.applySportsFans(team, def); break;
            case 'fansLostPercent': this.applySportsFans(team, def); break;
            case 'stats': this.applySportsStats(team, def); break;
            case 'statsAndXP': this.applySportsStats(team, def); this.applySportsXP(team, def); break;
            case 'statsAndTraits': this.applySportsStats(team, def); this.applySportsTraits(team, def); break;
            case 'statsAndMorale': this.applySportsStats(team, def); this.applySportsMorale(team, def); break;
            case 'traitsAndMorale': this.applySportsTraits(team, def); this.applySportsMorale(team, def); break;
            case 'xp': this.applySportsXP(team, def); break;
            case 'morale': this.applySportsMorale(team, def); break;
            case 'injury': this.applySportsInjury(team, def, instance); break;
            case 'upgradeCost': this.applySportsUpgradeCost(team, def); break;
            case 'negative': this.applySportsNegative(team, def); break;
            case 'fan_volunteer_player': this.applySportsFanVolunteer(team, def); break;
            case 'traits': instance.applied = this.applySportsTraitsMulti(team, def, instance); break;
        }
        if (instance.applied === undefined) instance.applied = true;
    }

    // ── Disaster Spawning ───────────────────────────────────────────

    handleDisasterDayPassed(data) {
        // Disasters spawn via the situation turn check system
    }

    spawnDisasterEventInternal() {
        const nation = window.Nation;
        if (!nation) return null;

        // War-only check
        const event = this.pickRandomDisasterEvent();
        if (!event) return null;
        if (event.warOnly && (!nation.wars || nation.wars.length === 0)) {
            this.log('debug', `Disaster ${event.name}: war-only but nation not at war`);
            return null;
        }

        const instance = {
            id: `disaster_${event.id}_${Date.now()}_${this._instanceCounter++}`,
            definition: event,
            type: 'disaster',
            situationType: 'disaster',
            startedAt: Date.now(),
            turnCreated: this.getCurrentTurn(),
            status: 'applied',
            targetNationId: nation.id,
            applied: false
        };

        const applied = this.applyDisasterEvent(instance);
        if (!applied) return null;

        this.activeDisasterEvents.push(instance);
        this.log('info', `Disaster event spawned: ${event.name} (${instance.id})`);
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('disaster_event_started', { event: instance, definition: event });
        }
        return instance;
    }

    pickRandomDisasterEvent() {
        const categories = Object.values(this.disasterDefinitions);
        if (categories.length === 0) return null;
        const pool = [];
        categories.forEach(category => { category.forEach(ev => pool.push(ev)); });
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }
    // ── Miracle Spawning ────────────────────────────────────────────

    handleMiracleDayPassed(data) {
        // Miracles spawn via the situation turn check system
    }

    spawnMiracleEventInternal() {
        const nation = window.Nation;
        if (!nation) return null;

        const event = this.pickRandomMiracleEvent();
        if (!event) return null;

        const instance = {
            id: `miracle_${event.id}_${Date.now()}_${this._instanceCounter++}`,
            definition: event,
            type: 'miracle',
            situationType: 'miracle',
            startedAt: Date.now(),
            turnCreated: this.getCurrentTurn(),
            status: 'applied',
            targetNationId: nation.id,
            applied: false
        };

        const applied = this.applyMiracleEvent(instance);
        if (!applied) return null;

        this.activeMiracleEvents.push(instance);
        this.log('info', `Miracle event spawned: ${event.name} (${instance.id})`);
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('miracle_event_started', { event: instance, definition: event });
        }
        return instance;
    }

    pickRandomMiracleEvent() {
        const categories = Object.values(this.miracleDefinitions);
        if (categories.length === 0) return null;
        const pool = [];
        categories.forEach(category => { category.forEach(ev => pool.push(ev)); });
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }
    // ── Sports Application Helpers ──────────────────────────────────

    getEligibleTeams() {
        if (!window.SportsSystem || !window.SportsSystem.teams) return [];
        const teams = [];
        for (const [nationId, sportMap] of window.SportsSystem.teams.entries()) {
            if (sportMap && typeof sportMap === 'object') {
                for (const [sportId, team] of Object.entries(sportMap)) {
                    if (team && team.id) teams.push(team);
                }
            }
        }
        return teams;
    }

    getNation(nationId) {
        if (window.Nation && window.Nation.getNation) return window.Nation.getNation(nationId);
        return window.Nation && window.Nation.id === nationId ? window.Nation : null;
    }

    getRandomPlayer(team) {
        if (!team || !team.players || team.players.size === 0) return null;
        const players = Array.from(team.players.values());
        return players[Math.floor(Math.random() * players.length)];
    }

    getInjuredPlayers(team) {
        if (!team || !team.players || team.players.size === 0) return [];
        const injured = [];
        for (const player of team.players.values()) {
            if (player.isInjured && player.injuryDaysLeft > 0) injured.push(player);
        }
        return injured;
    }

    applySportsFans(team, def) {
        const percent = def.effectMin + Math.random() * (def.effectMax - def.effectMin);
        const currentFans = team.fans || 0;
        const gained = Math.floor(currentFans * percent);
        team.fans = currentFans + gained;
        this.log('info', `Sports event: ${team.name} gained ${gained} fans (${(percent * 100).toFixed(1)}%)`);
    }

    applySportsStats(team, def) {
        const player = this.getRandomPlayer(team);
        if (!player) return;
        const sportAttrs = SPORT_ATTRIBUTES[team.sport];
        if (!sportAttrs || sportAttrs.length === 0) return;
        const attr = sportAttrs[Math.floor(Math.random() * sportAttrs.length)];
        const boost = def.statMin + Math.floor(Math.random() * (def.statMax - def.statMin + 1));
        if (player.attributes && player.attributes[attr] !== undefined) {
            const original = player.attributes[attr];
            player.attributes[attr] = Math.min(player.potential || 99, player.attributes[attr] + boost);
            this.log('info', `Sports event: ${player.name} ${attr} boosted by +${boost} (${original} -> ${player.attributes[attr]})`);
        }
    }

    applySportsXP(team, def) {
        const player = this.getRandomPlayer(team);
        if (!player) return;
        const xp = def.xpGain || 0;
        player.xp = (player.xp || 0) + xp;
        const levelsGained = Math.floor(player.xp / 100);
        if (levelsGained > 0) {
            player.level = (player.level || 1) + levelsGained;
            player.xp = player.xp % 100;
        }
        this.log('info', `Sports event: ${player.name} gained ${xp} XP`);
    }

    applySportsTraits(team, def) {
        const player = this.getRandomPlayer(team);
        if (!player) return;
        if (def.traitsGained) {
            const traitKeys = Object.keys(window.SportsTraits?.traits || {});
            if (traitKeys.length === 0) return;
            const traitKey = traitKeys[Math.floor(Math.random() * traitKeys.length)];
            if (!player.traits) player.traits = [];
            if (!player.traits.includes(traitKey)) {
                player.traits.push(traitKey);
                this.log('info', `Sports event: ${player.name} gained trait ${traitKey}`);
            }
        }
    }

    applySportsMorale(team, def) {
        const player = this.getRandomPlayer(team);
        if (!player) return;
        const boost = def.moraleBoost || 0;
        player.morale = Math.max(0, Math.min(100, (player.morale || 70) + boost));
        this.log('info', `Sports event: ${player.name} morale changed by ${boost} (now ${player.morale})`);
    }

    applySportsInjury(team, def, instance) {
        const severity = def.severity || 1;
        if (severity > 0) {
            let injuryName = 'Sports Injury';
            const tps = window.SportsSystem ? window.SportsSystem.teamPlayerSystem : null;
            if (tps && typeof tps.generateInjuryName === 'function') {
                injuryName = tps.generateInjuryName(severity);
            }
            if (instance) instance.resolvedInjury = injuryName;
            const player = this.getRandomPlayer(team);
            if (player) {
                player.isInjured = true;
                player.injuryDaysLeft = severity;
                player.injuryType = injuryName;
                this.log('info', `Sports event: ${player.name} injured (${injuryName}, severity ${severity})`);
            }
        } else {
            const injured = this.getInjuredPlayers(team);
            if (injured.length > 0) {
                const player = injured[Math.floor(Math.random() * injured.length)];
                player.isInjured = false;
                player.injuryDaysLeft = 0;
                player.injuryType = null;
                this.log('info', `Sports event: ${player.name} injury fully cured`);
            }
        }
    }

    applySportsFanVolunteer(team, def) {
        const tps = window.SportsSystem ? window.SportsSystem.teamPlayerSystem : null;
        if (!tps) {
            this.log('debug', `Sports event ${def.name}: TeamPlayerSystem unavailable`);
            return;
        }
        const player = tps.generatePlayer({ sport: team.sport, position: null, demographic: 'youngAdult', isDrafted: false });
        if (!player) return;
        if (!team.players) team.players = new Map();
        team.players.set(player.id, player);
        if (window.SportsSystem && window.SportsSystem.players) {
            window.SportsSystem.players.set(player.id, player);
        }
        this.log('info', `Sports event: ${player.name} (fan volunteer) joined ${team.name}`);
    }

    revertTraitBonus(player, traitKey) {
        const tps = window.SportsSystem ? window.SportsSystem.teamPlayerSystem : null;
        if (!tps) return;
        const trait = tps.traits[traitKey];
        if (!trait) return;
        for (const [attr, val] of Object.entries(trait.attributeBonus || {})) {
            if (attr === 'morale') {
                player.morale = Math.min(100, Math.max(0, (player.morale || 70) - val));
                continue;
            }
            if (attr === 'potential') {
                player.potential = Math.min(99, Math.max(1, (player.potential || 50) - val));
                continue;
            }
            if (player.attributes && player.attributes[attr] !== undefined) {
                player.attributes[attr] = Math.min(99, Math.max(1, player.attributes[attr] - val));
            }
        }
    }

    applySportsTraitsMulti(team, def, instance) {
        const tps = window.SportsSystem ? window.SportsSystem.teamPlayerSystem : null;
        if (!tps) return false;
        const players = Array.from(team.players ? team.players.values() : []);
        if (players.length === 0) return false;
        const count = def.playerMin || 1;
        const max = def.playerMax || 3;
        const numToPick = Math.min(count + Math.floor(Math.random() * (max - count + 1)), players.length);
        const shuffled = [...players].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, numToPick);
        const goodKeys = tps.goodTraitKeys || [];
        const badKeys = tps.badTraitKeys || [];
        const allKeys = [...goodKeys, ...badKeys];
        if (allKeys.length === 0) return false;
        let appliedAny = false;
        const usedTraits = new Set();
        for (const player of picked) {
            if (!player.traits) player.traits = [];
            const MAX_TRAITS = 3;
            const isFull = player.traits.length >= MAX_TRAITS;
            let traitKey = null;
            let removedBad = false;
            if (isFull) {
                const badOnPlayer = player.traits.filter(t => { const tr = tps.traits[t]; return tr && tr.type === 'bad'; });
                if (badOnPlayer.length > 0) {
                    const removeKey = tps._pickRandom(badOnPlayer);
                    player.traits = player.traits.filter(t => t !== removeKey);
                    this.revertTraitBonus(player, removeKey);
                    removedBad = true;
                } else {
                    continue;
                }
            }
            const available = allKeys.filter(k => !player.traits.includes(k) && !usedTraits.has(k));
            if (available.length === 0) continue;
            traitKey = tps._pickRandom(available);
            usedTraits.add(traitKey);
            player.traits.push(traitKey);
            tps.applyTraitToPlayer(player, traitKey);
            appliedAny = true;
            if (removedBad) {
                this.log('info', `Sports event: ${player.name} swapped bad trait for ${tps.traits[traitKey].name}`);
            } else {
                this.log('info', `Sports event: ${player.name} gained trait ${tps.traits[traitKey].name}`);
            }
        }
        return appliedAny;
    }

    applySportsUpgradeCost(team, def) {
        const modifier = def.modifier || 1;
        const current = team.stadiumUpgradeCostMod || 1;
        team.stadiumUpgradeCostMod = current * modifier;
        this.log('info', `Sports event: ${team.name} stadium upgrade cost modifier changed to ${team.stadiumUpgradeCostMod}`);
    }

    applySportsNegative(team, def) {
        const player = this.getRandomPlayer(team);
        if (!player) return;
        const sportAttrs = SPORT_ATTRIBUTES[team.sport];
        if (!sportAttrs || sportAttrs.length === 0) return;
        const attr = sportAttrs[Math.floor(Math.random() * sportAttrs.length)];
        const penalty = def.statMin + Math.floor(Math.random() * (def.statMax - def.statMin + 1));
        if (player.attributes && player.attributes[attr] !== undefined) {
            const original = player.attributes[attr];
            player.attributes[attr] = Math.max(1, player.attributes[attr] - penalty);
            this.log('info', `Sports event: ${player.name} ${attr} penalized by -${penalty} (${original} -> ${player.attributes[attr]})`);
        }
        if (def.moraleBoost) this.applySportsMorale(team, def);
        if (def.fansGainedPercent) {
            const percent = def.fansGainedPercent;
            const currentFans = team.fans || 0;
            const lost = Math.floor(currentFans * Math.abs(percent));
            team.fans = Math.max(0, currentFans - lost);
        }
    }
    // ── Disaster Application ────────────────────────────────────────

    applyDisasterEvent(instance) {
        const def = instance.definition;
        const nation = window.Nation;
        if (!nation) {
            this.log('debug', `Disaster event ${def.name}: no nation available`);
            return false;
        }

        const eff = def.effects || {};
        let deathsOccurred = false;

        // ── 1. Destroy infrastructure ──
        if (eff.chanceDestroyInfra && Math.random() < eff.chanceDestroyInfra) {
            const pct = eff.infraDestroyedPercent || { min: 0, max: 0 };
            const roll = pct.min + Math.random() * (pct.max - pct.min);
            const amount = Math.floor(nation.infra * roll / 100);
            nation.infra = Math.max(0, nation.infra - amount);
            this.log('info', `Disaster ${def.name}: destroyed ${amount} infra (${roll.toFixed(1)}%)`);
        }

        // ── 2. Destroy technology ──
        if (eff.chanceDestroyTech && Math.random() < eff.chanceDestroyTech) {
            const pct = eff.techDestroyedPercent || { min: 0, max: 0 };
            const roll = pct.min + Math.random() * (pct.max - pct.min);
            const amount = Math.floor(nation.tech * roll / 100);
            nation.tech = Math.max(0, nation.tech - amount);
            this.log('info', `Disaster ${def.name}: destroyed ${amount} tech (${roll.toFixed(1)}%)`);
        }

        // ── 3. Kill population: Chance Roll -> Demographic Roll -> Kill Roll ──
        if (eff.chanceKillPopulation && Math.random() < eff.chanceKillPopulation) {
            const demographics = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];
            const demo = demographics[Math.floor(Math.random() * demographics.length)];
            const demoShare = 0.20;
            const pct = eff.populationKilledPercent || { min: 0, max: 0 };
            const killRoll = pct.min + Math.random() * (pct.max - pct.min);
            const killed = Math.floor(nation.population * demoShare * killRoll / 100);
            nation.population = Math.max(0, nation.population - killed);
            instance.resolvedDemographic = demo;
            instance.resolvedKilled = killed;
            if (killed > 0) deathsOccurred = true;
            this.log('info', `Disaster ${def.name}: killed ${killed} from ${demo} (${killRoll.toFixed(1)}% of group)`);
        }

        // ── 4. Military destruction (only if at war) ──
        if (nation.wars && nation.wars.length > 0) {
            const mu = nation.militaryUnits || {};
            if (eff.chanceKillSoldiers && Math.random() < eff.chanceKillSoldiers) {
                const pct = eff.soldiersKilledPercent || { min: 0, max: 0 };
                const roll = pct.min + Math.random() * (pct.max - pct.min);
                const amount = Math.floor(mu.soldiers * roll / 100);
                mu.soldiers = Math.max(0, mu.soldiers - amount);
                if (amount > 0) deathsOccurred = true;
                this.log('info', `Disaster ${def.name}: killed ${amount} soldiers`);
            }
            if (eff.chanceDestroyTanks && Math.random() < eff.chanceDestroyTanks) {
                const pct = eff.tanksDestroyedPercent || { min: 0, max: 0 };
                const roll = pct.min + Math.random() * (pct.max - pct.min);
                const amount = Math.floor(mu.tanks * roll / 100);
                mu.tanks = Math.max(0, mu.tanks - amount);
                this.log('info', `Disaster ${def.name}: destroyed ${amount} tanks`);
            }
            if (eff.chanceDestroyAircraft && Math.random() < eff.chanceDestroyAircraft) {
                const pct = eff.aircraftDestroyedPercent || { min: 0, max: 0 };
                const roll = pct.min + Math.random() * (pct.max - pct.min);
                const amount = Math.floor(mu.aircraft * roll / 100);
                mu.aircraft = Math.max(0, mu.aircraft - amount);
                this.log('info', `Disaster ${def.name}: destroyed ${amount} aircraft`);
            }
            if (eff.chanceDestroyShips && Math.random() < eff.chanceDestroyShips) {
                const pct = eff.shipsDestroyedPercent || { min: 0, max: 0 };
                const roll = pct.min + Math.random() * (pct.max - pct.min);
                const amount = Math.floor(mu.ships * roll / 100);
                mu.ships = Math.max(0, mu.ships - amount);
                this.log('info', `Disaster ${def.name}: destroyed ${amount} ships`);
            }
        }

        // ── 5. Nation stat changes ──
        if (eff.diseaseAdded) {
            nation.nationStats.disease = Math.min(50, (nation.nationStats.disease || 10) + eff.diseaseAdded);
        }
        if (eff.pollutionAdded) {
            nation.nationStats.pollution = (nation.nationStats.pollution || 0) + eff.pollutionAdded;
        }
        if (eff.environmentPenalty) {
            nation.nationStats.environment = Math.max(0, (nation.nationStats.environment || 50) - eff.environmentPenalty);
        }
        if (eff.crimeAdded) {
            nation.nationStats.crime = Math.min(80, (nation.nationStats.crime || 15) + eff.crimeAdded);
        }

        // ── 6. Happiness penalty (only if deaths occurred) ──
        if (deathsOccurred && eff.happinessPenalty) {
            nation.nationStats.happiness = Math.max(0, (nation.nationStats.happiness || 50) - eff.happinessPenalty);
            nation.happiness = nation.nationStats.happiness;
        }

        instance.applied = true;
        instance.targetNationId = nation.id;
        return true;
    }
    // ── Miracle Application ─────────────────────────────────────────

    applyMiracleEvent(instance) {
        const def = instance.definition;
        const nation = window.Nation;
        if (!nation) {
            this.log('debug', `Miracle event ${def.name}: no nation available`);
            return false;
        }

        const miracleType = def.miracleType;
        const eff = def.effects || {};

        if (miracleType === 'worldBankError') return this.applyMiracleWorldBankError(instance, nation, eff);
        if (miracleType === 'immigrationBoom') return this.applyMiracleImmigrationBoom(instance, nation, eff);
        if (miracleType === 'wealthyBenefactor') return this.applyMiracleWealthyBenefactor(instance, nation, def, eff);

        // ── Standard stat-based miracles ──
        if (eff.directMoney) {
            const min = eff.directMoney.min || 0;
            const max = eff.directMoney.max;
            const amount = max !== undefined ? min + Math.random() * (max - min) : min;
            nation.money = (nation.money || 0) + Math.floor(amount);
            this.log('info', `Miracle ${def.name}: gained $${Math.floor(amount)}`);
        }

        if (eff.debtForgiven) {
            nation.debt = 0;
            this.log('info', `Miracle ${def.name}: all debts forgiven`);
        }

        if (eff.happinessBonus) {
            nation.nationStats.happiness = Math.min(100, (nation.nationStats.happiness || 50) + eff.happinessBonus);
            nation.happiness = nation.nationStats.happiness;
        }
        if (eff.crimeReduction) {
            nation.nationStats.crime = Math.max(0, (nation.nationStats.crime || 15) - eff.crimeReduction);
        }
        if (eff.pollutionReduction) {
            nation.nationStats.pollution = Math.max(0, (nation.nationStats.pollution || 0) - eff.pollutionReduction);
        }
        if (eff.environmentBonus) {
            nation.nationStats.environment = Math.min(100, (nation.nationStats.environment || 50) + eff.environmentBonus);
        }
        if (eff.diseaseReduction) {
            nation.nationStats.disease = Math.max(0, (nation.nationStats.disease || 10) - eff.diseaseReduction);
        }
        if (eff.taxableIncomeBonus) {
            nation.nationStats.taxEfficiency = (nation.nationStats.taxEfficiency || 1.0) * (1 + eff.taxableIncomeBonus / 100);
        }
        if (eff.landBonus) {
            nation.land = (nation.land || 0) + eff.landBonus;
            nation.mapBlocks = Math.floor(nation.land / (GameConfig.MILES_PER_BLOCK || 1));
        }
        if (eff.infraBonus) {
            nation.infra = (nation.infra || 0) + eff.infraBonus;
        }
        if (eff.populationBonus) {
            nation.population = Math.floor((nation.population || 0) * (1 + eff.populationBonus / 100));
        }
        if (eff.techBonus) {
            nation.tech = (nation.tech || 0) + eff.techBonus;
        }
        if (eff.militaryMoraleBonus) {
            nation.militaryMorale = (nation.militaryMorale || 1.0) * (1 + eff.militaryMoraleBonus);
        }

        instance.applied = true;
        instance.targetNationId = nation.id;
        return true;
    }

    applyMiracleWorldBankError(instance, nation, eff) {
        const multiplier = eff.moneyMultiplier.min + Math.random() * (eff.moneyMultiplier.max - eff.moneyMultiplier.min);
        const turnRevenue = nation.taxRevenue || 0;
        const amount = Math.floor(turnRevenue * multiplier);
        nation.money = (nation.money || 0) + amount;
        instance.resolvedAmount = amount;
        instance.resolvedMultiplier = multiplier;
        this.log('info', `Miracle World Bank Error: gained $${amount} (${multiplier.toFixed(1)}x turn revenue)`);
        instance.applied = true;
        instance.targetNationId = nation.id;
        return true;
    }

    applyMiracleImmigrationBoom(instance, nation, eff) {
        const demographics = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];
        const shuffled = [...demographics].sort(() => Math.random() - 0.5);
        const selectedDemos = shuffled.slice(0, 3);

        const fraction = 0.10 + Math.random() * (0.75 - 0.10);
        const totalAdded = Math.floor((nation.population || 0) * fraction);
        instance.resolvedDemographics = selectedDemos;
        instance.resolvedFraction = fraction;
        instance.resolvedPopulationAdded = totalAdded;

        const perDemo = Math.floor(totalAdded / 3);
        let remainder = totalAdded;
        for (let i = 0; i < selectedDemos.length; i++) {
            const demoCount = i === selectedDemos.length - 1 ? remainder : perDemo;
            remainder -= demoCount;
            this.log('info', `Miracle Immigration Boom: ${demoCount} ${selectedDemos[i]} arrived`);
        }

        nation.population = Math.floor((nation.population || 0) + totalAdded);

        if (eff.happinessBonus) {
            nation.nationStats.happiness = Math.min(100, (nation.nationStats.happiness || 50) + eff.happinessBonus);
            nation.happiness = nation.nationStats.happiness;
        }

        this.log('info', `Miracle Immigration Boom: ${totalAdded} new citizens from ${selectedDemos.join(', ')}`);
        instance.applied = true;
        instance.targetNationId = nation.id;
        return true;
    }

    // ── Max military unit capacity (mirrors world.js limits + projects getMilitaryUnitLimits) ──
    getMaxMilitaryUnitCapacity(unitType, nation) {
        const pop = nation.population || 0;
        const projectEffects = nation.projectEffects || {};
        const projects = nation.projects || {};
        const wonders = nation.wonders || {};

        let basePercent;
        switch (unitType) {
            case 'soldiers':
                basePercent = projectEffects.maxSoldierPercent ? projectEffects.maxSoldierPercent / 100 : 0.20;
                break;
            case 'tanks':
                basePercent = projectEffects.maxTankPercent ? projectEffects.maxTankPercent / 100 : 0.10;
                break;
            case 'aircraft':
                basePercent = projectEffects.maxAircraftPercent ? projectEffects.maxAircraftPercent / 100 : 0.075;
                break;
            case 'ships':
                basePercent = projectEffects.maxShipPercent ? projectEffects.maxShipPercent / 100 : 0.05;
                break;
            case 'spies':
                return projects.spyOperations > 0 ? Math.floor(pop * 0.01) : 0;
            case 'missiles':
                return projects.missileSilo > 0 ? Math.floor(pop * 0.005) : 0;
            case 'nukes':
                return wonders.nuclearWarheadFacility > 0 ? Math.floor(pop * 0.001) : 0;
            default:
                return 0;
        }
        return Math.floor(pop * basePercent);
    }

    applyMiracleWealthyBenefactor(instance, nation, def, eff) {
        const unitType = def.benefactorUnit || 'tanks';
        const mu = nation.militaryUnits || {};
        let amount = 0;

        if (unitType === 'missiles' || unitType === 'nukes') {
            amount = Math.floor(Math.random() * 20) + 1;
        } else {
            // 1/10 - 3/4 of what they LACK (max capacity - current)
            const maxCapacity = this.getMaxMilitaryUnitCapacity(unitType, nation);
            const current = mu[unitType] || 0;
            const lack = Math.max(0, maxCapacity - current);
            const fraction = 0.10 + Math.random() * (0.75 - 0.10);
            amount = Math.floor(lack * fraction);
            if (amount === 0 && lack > 0) amount = 1; // at least 1 if they lack any
        }

        mu[unitType] = (mu[unitType] || 0) + amount;
        instance.resolvedUnitType = unitType;
        instance.resolvedUnitAmount = amount;

        if (eff.happinessBonus) {
            nation.nationStats.happiness = Math.min(100, (nation.nationStats.happiness || 50) + eff.happinessBonus);
            nation.happiness = nation.nationStats.happiness;
        }

        this.log('info', `Miracle Wealthy Benefactor: gained ${amount} ${unitType}`);
        instance.applied = true;
        instance.targetNationId = nation.id;
        return true;
    }
    // ── Economic Application ────────────────────────────────────────

    applyEconomicEvent(instance) {
        const def = instance.definition;
        const eff = instance.resolvedEffects || def.effects || {};

        // Initialize cumulative tracking for reversal
        if (!instance.cumulative) {
            instance.cumulative = { currencies: {}, worldBank: {}, indicators: {} };
        }
        const cum = instance.cumulative;

        // ── Currency effects (applied each turn tick) ──
        if (eff.currencies && window.EconomySystem) {
            const econ = window.EconomySystem;
            for (const [key, changes] of Object.entries(eff.currencies)) {
                const currency = econ.currencies.get(key);
                if (!currency) continue;

                if (!cum.currencies[key]) cum.currencies[key] = {};

                if (changes.rate !== undefined) {
                    if (!cum.currencies[key].rate) {
                        cum.currencies[key].rate = { obj: currency, prop: 'baseRate', original: currency.baseRate, total: 0 };
                    }
                    currency.baseRate = Math.max(1, currency.baseRate + changes.rate);
                    cum.currencies[key].rate.total += changes.rate;
                }
                if (changes.transferRate !== undefined) {
                    if (!cum.currencies[key].transferRate) {
                        cum.currencies[key].transferRate = { obj: currency, prop: 'transferRate', original: currency.transferRate, total: 0 };
                    }
                    currency.transferRate = Math.max(0.01, Math.min(10, currency.transferRate + changes.transferRate));
                    cum.currencies[key].transferRate.total += changes.transferRate;
                }
                if (changes.interestRate !== undefined) {
                    if (!cum.currencies[key].interestRate) {
                        cum.currencies[key].interestRate = { obj: currency, prop: 'interestRate', original: currency.interestRate, total: 0 };
                    }
                    currency.interestRate = Math.max(0.01, Math.min(10, currency.interestRate + changes.interestRate));
                    cum.currencies[key].interestRate.total += changes.interestRate;
                }
            }
        }

        // ── World Bank effects (applied each turn tick) ──
        if (eff.worldBank && window.WorldBankSystem) {
            const wb = window.WorldBankSystem;
            if (eff.worldBank.loanRate !== undefined) {
                if (!cum.worldBank.loanRate) {
                    cum.worldBank.loanRate = { obj: wb, prop: 'loanRate', original: wb.loanRate, total: 0 };
                }
                wb.loanRate = Math.max(0, Math.min(1, wb.loanRate + eff.worldBank.loanRate));
                cum.worldBank.loanRate.total += eff.worldBank.loanRate;
            }
        }

        // ── Economy indicator effects (applied each turn tick) ──
        if (eff.indicators && window.EconomySystem) {
            const econ = window.EconomySystem;
            for (const [key, change] of Object.entries(eff.indicators)) {
                if (econ.indicators[key] === undefined) continue;
                if (!cum.indicators[key]) cum.indicators[key] = { obj: econ.indicators, prop: key, original: econ.indicators[key], total: 0 };
                econ.indicators[key] += change;
                cum.indicators[key].total += change;
                if (key === 'inflationRate' || key === 'unemploymentRate') {
                    econ.indicators[key] = Math.max(0, econ.indicators[key]);
                }
            }
        }

        instance.applied = true;
    }

    removeEconomicEvent(instance) {
        // Reverse all cumulative economic effects applied each turn
        const cum = instance.cumulative;
        if (cum) {
            // Reverse currency effects
            for (const [key, changes] of Object.entries(cum.currencies)) {
                for (const [prop, entry] of Object.entries(changes)) {
                    if (entry.obj && entry.prop !== undefined) {
                        entry.obj[entry.prop] = entry.original;
                    }
                }
            }
            // Reverse world bank effects
            for (const [prop, entry] of Object.entries(cum.worldBank)) {
                if (entry.obj && entry.prop !== undefined) {
                    entry.obj[entry.prop] = entry.original;
                }
            }
            // Reverse indicator effects
            for (const [prop, entry] of Object.entries(cum.indicators)) {
                if (entry.obj && entry.prop !== undefined) {
                    entry.obj[entry.prop] = entry.original;
                }
            }
        }

        this.log('info', `Economic event ended: ${instance.definition.name} (${instance.id})`);
        instance.cumulative = null;
        instance.applied = false;
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('economic_event_ended', { event: instance, definition: instance.definition });
        }
    }
    // ── State Management ────────────────────────────────────────────

    getState() {
        return {
            economicActiveEvents: this.activeEconomicEvents.map(instance => ({
                id: instance.id,
                definitionId: instance.definition.id,
                startedAt: instance.startedAt,
                applied: instance.applied
            })),
            sportsActiveEvents: this.activeSportsEvents.map(instance => ({
                id: instance.id,
                definitionId: instance.definition.id,
                startedAt: instance.startedAt,
                applied: instance.applied,
                targetTeamId: instance.targetTeamId,
                targetNationId: instance.targetNationId,
                resolvedInjury: instance.resolvedInjury || null
            })),
            disasterActiveEvents: this.activeDisasterEvents.map(instance => ({
                id: instance.id,
                definitionId: instance.definition.id,
                startedAt: instance.startedAt,
                applied: instance.applied,
                targetNationId: instance.targetNationId,
                resolvedDemographic: instance.resolvedDemographic || null,
                resolvedKilled: instance.resolvedKilled || 0
            })),
            miracleActiveEvents: this.activeMiracleEvents.map(instance => ({
                id: instance.id,
                definitionId: instance.definition.id,
                startedAt: instance.startedAt,
                applied: instance.applied,
                targetNationId: instance.targetNationId,
                resolvedAmount: instance.resolvedAmount || 0,
                resolvedMultiplier: instance.resolvedMultiplier || 1,
                resolvedDemographics: instance.resolvedDemographics || [],
                resolvedFraction: instance.resolvedFraction || 0,
                resolvedPopulationAdded: instance.resolvedPopulationAdded || 0,
                resolvedUnitType: instance.resolvedUnitType || null,
                resolvedUnitAmount: instance.resolvedUnitAmount || 0
            })),
            nationSituations: this.activeNationSituations.map(instance => ({
                id: instance.id,
                definitionId: instance.definition.id,
                type: instance.type,
                startedAt: instance.startedAt,
                turnCreated: instance.turnCreated,
                status: instance.status,
                targetNationId: instance.targetNationId,
                happinessPenaltyApplied: instance.happinessPenaltyApplied || false,
                resolvedChoice: instance.resolvedChoice || null
            })),
            populationSituations: this.activePopulationSituations.map(instance => ({
                id: instance.id,
                definitionId: instance.definition.id,
                type: instance.type,
                startedAt: instance.startedAt,
                turnCreated: instance.turnCreated,
                status: instance.status,
                targetNationId: instance.targetNationId,
                happinessPenaltyApplied: instance.happinessPenaltyApplied || false,
                resolvedChoice: instance.resolvedChoice || null
            })),
            militarySituations: this.activeMilitarySituations.map(instance => ({
                id: instance.id,
                definitionId: instance.definition.id,
                type: instance.type,
                startedAt: instance.startedAt,
                turnCreated: instance.turnCreated,
                status: instance.status,
                targetNationId: instance.targetNationId,
                happinessPenaltyApplied: instance.happinessPenaltyApplied || false,
                resolvedChoice: instance.resolvedChoice || null
            })),
            slotLimit: this.slotLimit,
            nationCreationTurn: this.nationCreationTurn,
            lastSpawnCheckTurn: this.lastSpawnCheckTurn,
            sportsSpawnChancePerDay: this.sportsSpawnChancePerDay,
            sportsMaxConcurrentEvents: this.sportsMaxConcurrentEvents,
            disasterSpawnChancePerDay: this.disasterSpawnChancePerDay,
            disasterMaxConcurrentEvents: this.disasterMaxConcurrentEvents,
            miracleSpawnChancePerDay: this.miracleSpawnChancePerDay,
            miracleMaxConcurrentEvents: this.miracleMaxConcurrentEvents
        };
    }

    setState(state) {
        if (!state) return;

        // Restore tuning
        if (state.slotLimit !== undefined) this.slotLimit = state.slotLimit;
        if (state.nationCreationTurn !== undefined) this.nationCreationTurn = state.nationCreationTurn;
        if (state.lastSpawnCheckTurn !== undefined) this.lastSpawnCheckTurn = state.lastSpawnCheckTurn;

        // Restore economic events (re-apply against current economy)
        if (state.economicActiveEvents) {
            this.activeEconomicEvents = [];
            state.economicActiveEvents.forEach(saved => {
                const def = this.getEconomicDefinition(saved.definitionId);
                if (!def) return;
                const instance = {
                    id: saved.id,
                    definition: def,
                    startedAt: saved.startedAt,
                    snapshots: null,
                    applied: false,
                    type: 'economic'
                };
                this.applyEconomicEvent(instance);
                this.activeEconomicEvents.push(instance);
            });
        }

        // Restore sports events (permanent - restore metadata only)
        if (state.sportsActiveEvents) {
            this.activeSportsEvents = [];
            state.sportsActiveEvents.forEach(saved => {
                const def = this.getSportsDefinition(saved.definitionId);
                if (!def) return;
                this.activeSportsEvents.push({
                    id: saved.id, definition: def, startedAt: saved.startedAt,
                    applied: true, targetTeamId: saved.targetTeamId,
                    targetNationId: saved.targetNationId, resolvedInjury: saved.resolvedInjury || null,
                    type: 'sports', situationType: 'sports', status: 'applied'
                });
            });
        }

        // Restore disaster events (permanent - restore metadata only)
        if (state.disasterActiveEvents) {
            this.activeDisasterEvents = [];
            state.disasterActiveEvents.forEach(saved => {
                const def = this.getDisasterDefinition(saved.definitionId);
                if (!def) return;
                this.activeDisasterEvents.push({
                    id: saved.id, definition: def, startedAt: saved.startedAt,
                    applied: true, targetNationId: saved.targetNationId,
                    resolvedDemographic: saved.resolvedDemographic || null,
                    resolvedKilled: saved.resolvedKilled || 0,
                    type: 'disaster', situationType: 'disaster', status: 'applied'
                });
            });
        }

        // Restore miracle events (permanent - restore metadata only)
        if (state.miracleActiveEvents) {
            this.activeMiracleEvents = [];
            state.miracleActiveEvents.forEach(saved => {
                const def = this.getMiracleDefinition(saved.definitionId);
                if (!def) return;
                this.activeMiracleEvents.push({
                    id: saved.id, definition: def, startedAt: saved.startedAt,
                    applied: true, targetNationId: saved.targetNationId,
                    resolvedAmount: saved.resolvedAmount || 0,
                    resolvedMultiplier: saved.resolvedMultiplier || 1,
                    resolvedDemographics: saved.resolvedDemographics || [],
                    resolvedFraction: saved.resolvedFraction || 0,
                    resolvedPopulationAdded: saved.resolvedPopulationAdded || 0,
                    resolvedUnitType: saved.resolvedUnitType || null,
                    resolvedUnitAmount: saved.resolvedUnitAmount || 0,
                    type: 'miracle', situationType: 'miracle', status: 'applied'
                });
            });
        }

        // Restore nation situations (restore metadata, do NOT re-apply choice effects)
        if (state.nationSituations) {
            this.activeNationSituations = [];
            state.nationSituations.forEach(saved => {
                const def = this.getNationSituationDefinition(saved.definitionId);
                if (!def) return;
                this.activeNationSituations.push({
                    id: saved.id, definition: def, type: saved.type,
                    startedAt: saved.startedAt, turnCreated: saved.turnCreated,
                    status: saved.status, targetNationId: saved.targetNationId,
                    happinessPenaltyApplied: saved.happinessPenaltyApplied || false,
                    resolvedChoice: saved.resolvedChoice || null
                });
                // Re-apply happiness penalty if still pending
                if (saved.status === 'pending' && saved.happinessPenaltyApplied) {
                    const nation = window.Nation;
                    if (nation) {
                        const stats = nation.nationStats || {};
                        stats.happiness = Math.max(0, (stats.happiness || 50) - 10);
                        nation.happiness = stats.happiness;
                    }
                }
            });
        }

        // Restore population situations
        if (state.populationSituations) {
            this.activePopulationSituations = [];
            state.populationSituations.forEach(saved => {
                const def = this.getPopulationSituationDefinition(saved.definitionId);
                if (!def) return;
                this.activePopulationSituations.push({
                    id: saved.id, definition: def, type: saved.type,
                    startedAt: saved.startedAt, turnCreated: saved.turnCreated,
                    status: saved.status, targetNationId: saved.targetNationId,
                    happinessPenaltyApplied: saved.happinessPenaltyApplied || false,
                    resolvedChoice: saved.resolvedChoice || null
                });
                if (saved.status === 'pending' && saved.happinessPenaltyApplied) {
                    const nation = window.Nation;
                    if (nation) {
                        const stats = nation.nationStats || {};
                        stats.happiness = Math.max(0, (stats.happiness || 50) - 10);
                        nation.happiness = stats.happiness;
                    }
                }
            });
        }

        // Restore military situations
        if (state.militarySituations) {
            this.activeMilitarySituations = [];
            state.militarySituations.forEach(saved => {
                const def = this.getMilitarySituationDefinition(saved.definitionId);
                if (!def) return;
                this.activeMilitarySituations.push({
                    id: saved.id, definition: def, type: saved.type,
                    startedAt: saved.startedAt, turnCreated: saved.turnCreated,
                    status: saved.status, targetNationId: saved.targetNationId,
                    happinessPenaltyApplied: saved.happinessPenaltyApplied || false,
                    resolvedChoice: saved.resolvedChoice || null
                });
                if (saved.status === 'pending' && saved.happinessPenaltyApplied) {
                    const nation = window.Nation;
                    if (nation) {
                        const stats = nation.nationStats || {};
                        stats.happiness = Math.max(0, (stats.happiness || 50) - 10);
                        nation.happiness = stats.happiness;
                    }
                }
            });
        }
    }

    // ── Definition Lookups ──────────────────────────────────────────

    getEconomicDefinition(id) {
        for (const category of Object.values(this.economicDefinitions)) {
            const found = category.find(ev => ev.id === id);
            if (found) return found;
        }
        return null;
    }

    getSportsDefinition(id) {
        for (const category of Object.values(this.sportsDefinitions)) {
            const found = category.find(ev => ev.id === id);
            if (found) return found;
        }
        return null;
    }

    getDisasterDefinition(id) {
        for (const category of Object.values(this.disasterDefinitions)) {
            const found = category.find(ev => ev.id === id);
            if (found) return found;
        }
        return null;
    }

    getMiracleDefinition(id) {
        for (const category of Object.values(this.miracleDefinitions)) {
            const found = category.find(ev => ev.id === id);
            if (found) return found;
        }
        return null;
    }

    getNationSituationDefinition(id) {
        for (const category of Object.values(this.nationSituations)) {
            const found = category.find(ev => ev.id === id);
            if (found) return found;
        }
        return null;
    }

    getPopulationSituationDefinition(id) {
        for (const category of Object.values(this.populationSituations)) {
            const found = category.find(ev => ev.id === id);
            if (found) return found;
        }
        return null;
    }

    getMilitarySituationDefinition(id) {
        for (const category of Object.values(this.militarySituations)) {
            const found = category.find(ev => ev.id === id);
            if (found) return found;
        }
        return null;
    }

    // ── Destroy ─────────────────────────────────────────────────────

    destroy() {
        // Reverse all economic events
        for (const instance of [...this.activeEconomicEvents]) {
            this.removeEconomicEvent(instance);
        }
        this.activeEconomicEvents = [];

        // Clear all permanent records (no reversal needed)
        this.activeSportsEvents = [];
        this.activeDisasterEvents = [];
        this.activeMiracleEvents = [];
        this.activeNationSituations = [];
        this.activePopulationSituations = [];
        this.activeMilitarySituations = [];

        if (typeof EventBus !== 'undefined' && typeof GameEvents !== 'undefined') {
            EventBus.off(GameEvents.DAY_PASSED, this.handleEconomicDayPassed, this);
            EventBus.off(GameEvents.DAY_PASSED, this.handleSportsDayPassed, this);
            EventBus.off(GameEvents.DAY_PASSED, this.handleDisasterDayPassed, this);
            EventBus.off(GameEvents.DAY_PASSED, this.handleMiracleDayPassed, this);
            EventBus.off(GameEvents.DAY_PASSED, this.handleSituationTurnCheck, this);
        }
        this.isInitialized = false;
        this.log('info', 'EventsSystem destroyed');
    }
    // ── Queries ─────────────────────────────────────────────────────

    getActiveEventsByType(type) {
        switch (type) {
            case 'economic': return this.activeEconomicEvents;
            case 'sports': return this.activeSportsEvents;
            case 'disaster': return this.activeDisasterEvents;
            case 'miracle': return this.activeMiracleEvents;
            case 'nation': return this.activeNationSituations;
            case 'population': return this.activePopulationSituations;
            case 'military': return this.activeMilitarySituations;
            default: return [];
        }
    }

    getPendingSituations() {
        // All situations awaiting player choice
        return [
            ...this.activeNationSituations.filter(s => s.status === 'pending'),
            ...this.activePopulationSituations.filter(s => s.status === 'pending'),
            ...this.activeMilitarySituations.filter(s => s.status === 'pending')
        ];
    }

    getSlotsUsed() {
        return this.getActiveSlotCount();
    }

    getSlotsRemaining() {
        return Math.max(0, this.slotLimit - this.getActiveSlotCount());
    }

    // ── Logging ─────────────────────────────────────────────────────

    log(level, message, data = null) {
        if (!this.debugMode) return;
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = levels[this.logLevel || 'info'] || 1;
        const messageLevel = levels[level] || 1;
        if (messageLevel < currentLevel) return;
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [EventsSystem] [${level.toUpperCase()}] ${message}`;
        if (data !== null) {
            console[level] || console.log(logMessage, data);
        } else {
            console[level] || console.log(logMessage);
        }
    }
}

// Create global instance
const EventsSystemInstance = new EventsSystem();
if (typeof window !== 'undefined') {
    window.EventsSystem = EventsSystem;
    window.EventsSystemInstance = EventsSystemInstance;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventsSystem, EventsSystemInstance };
}
