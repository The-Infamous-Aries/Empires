/**
 * War System - Combat and Battle Mechanics
 * Dominion Wars - Nation Building Strategy Game
 * MilitaryUnit entity is the truth source for units.
 * PopulationSystem is the truth source for population.
 */

// ── Dependency: WarTermsSystem (casus belli, peace mechanics, loot/destruction formulas) ──
let _warTermsSys = null;
if (typeof require !== 'undefined') {
    try { _warTermsSys = require('./war-terms-system.js'); } catch(e) {}
}
if (!_warTermsSys && typeof window !== 'undefined') {
    _warTermsSys = window.WarTermsSystem;
}

class WarSystem {
    constructor() {
        this.activeWars = new Map(); // warId -> war data
        this.historicalWars = new Map(); // warId -> completed war data (permanent archive)
        this.warCounter = 1;

        // Timer tracking for cleanup
        this.energyIntervalId = null;
        this.roundTimeouts = new Map(); // warId -> setTimeout ID

        // Per-nation cumulative war statistics (across all wars, active + historical)
        this.nationWarStats = new Map(); // nationId -> { warsWon, warsLost, warsDraw, totalDamageDealt, totalDamageReceived, totalUnitsKilled, totalUnitsLost, totalInfraDestroyed, totalInfraReceived, totalLootGained, totalLootLost, totalAttacks, totalBattles }

        // Relationship combat tracking (for stats and leaderboards)
        // nationId -> { sameSideFriends: Map<friendId, count>, vsFoes: Map<foeId, count> }
        this.relationshipCombatStats = new Map();

        // War Terms System - truth source for casus belli, peace mechanics, loot/destruction formulas
        this.warTermsSystem = new _warTermsSys();

        // War configuration
        this.MAX_SIDES = 2; // Attacker vs Defender sides
        this.ROUNDS_PER_WAR = 3; // Best of 3
        this.ROUND_DURATION_HOURS = 4;
        this.PREPARATION_MINUTES = 15;

        // Energy system
        this.ENERGY_PER_ATTACK = 10;
        this.ENERGY_REGEN_PERCENT = 10; // 10% per hour
        this.MAX_ENERGY = 100;

        // Missile and Nuke costs (Intuition)
        this.MISSILE_INTUITION_COST = 25;
        this.NUKE_INTUITION_COST = 50;

        // Spy Operation costs (Intuition)
        this.SPY_OPERATION_COSTS = {
            gatherIntel: 10,
            disruptHappiness: 15,
            targetInfra: 20,
            targetTech: 25,
            targetSoldiers: 15,
            targetTanks: 18,
            targetAircraft: 20,
            targetShips: 22,
            targetMissiles: 30,
            targetNukes: 35,
            assassinateSpies: 40,
            deployVirus: 60
        };

        // Missile/Nuke damage values
        this.MISSILE_BASE_DAMAGE = 500; // Infra damage
        this.NUKE_BASE_DAMAGE = 2000;   // Infra damage
        this.MISSILE_HAPPINESS_PENALTY = 5;
        this.NUKE_HAPPINESS_PENALTY = 15;

        // Deploy Virus configuration
        this.VIRUS_BASE_INFECTION_RATE = 0.10; // 10% base
        this.VIRUS_MAX_INFECTION_RATE = 1.00; // 100% max
        this.VIRUS_SPY_BONUS_PER_SPY = 0.005; // 0.5% per attacking spy
        this.VIRUS_DEFENSE_PENALTY_PER_DEF_SPY = 0.003; // 0.3% per defending spy
        this.VIRUS_MIN_DISEASE_DURATION = 3; // days
        this.VIRUS_MAX_DISEASE_DURATION = 7; // days

        this.initialize();
    }

    /**
     * Initialize the war system
     */
    async initialize() {
        console.log('Initializing War System...');

        // Bind event listeners
        this.bindEvents();

        // Start energy regeneration timer
        this.startEnergyRegeneration();

        console.log('War System initialized');
        return true;
    }

    /**
     * Bind system events
     */
    bindEvents() {
        this._onDeclareWar = (data) => this.handleWarDeclaration(data);
        this._onJoinWar = (data) => this.handleJoinWar(data);
        this._onWarAttack = (data) => this.handleWarAttack(data);
        this._onMissileLaunch = (data) => this.handleMissileLaunch(data);
        this._onNukeLaunch = (data) => this.handleNukeLaunch(data);
        this._onSpyOperation = (data) => this.handleSpyOperation(data);
        this._onSueForPeace = (data) => this.handleSueForPeace(data);
        this._onOfferPeaceTerms = (data) => this.handleOfferPeaceTerms(data);
        this._onAcceptPeaceTerms = (data) => this.handleAcceptPeaceTerms(data);
        this._onRejectPeaceTerms = (data) => this.handleRejectPeaceTerms(data);
        this._onEnergyRegen = () => this.processEnergyRegeneration();
        this._onRoundTimer = (data) => this.processRoundEnd(data);

        EventBus.on('declare_war', this._onDeclareWar);
        EventBus.on('join_war', this._onJoinWar);
        EventBus.on('attack_in_war', this._onWarAttack);
        EventBus.on('launch_missile_in_war', this._onMissileLaunch);
        EventBus.on('launch_nuke_in_war', this._onNukeLaunch);
        EventBus.on('launch_spy_operation', this._onSpyOperation);
        EventBus.on('sue_for_peace', this._onSueForPeace);
        EventBus.on('offer_peace_terms', this._onOfferPeaceTerms);
        EventBus.on('accept_peace_terms', this._onAcceptPeaceTerms);
        EventBus.on('reject_peace_terms', this._onRejectPeaceTerms);
        EventBus.on('hour_passed', this._onEnergyRegen);
        EventBus.on('round_timer', this._onRoundTimer);
    }

    /**
     * Start energy regeneration system
     */
    startEnergyRegeneration() {
        this.energyIntervalId = setInterval(() => {
            this.processEnergyRegeneration();
        }, 3600000); // Every hour (60 * 60 * 1000 ms)
    }

    /**
     * Declare war between two nations or alliances
     * warType: 'solo_nation', 'nation', 'solo_alliance', 'alliance'
     *   - solo_nation: Nation vs Nation, other nations CANNOT join
     *   - nation: Nation vs Nation, other nations CAN join
     *   - solo_alliance: Alliance vs Alliance, other alliances CANNOT join
     *   - alliance: Alliance vs Alliance, other alliances CAN join
     */
    declareWar(data) {
        const {
            attackerNationId,
            defenderNationId,
            warType = 'nation',
            casusBelliId = 'general_dispute',
            reason = 'Territorial Dispute'
        } = data;

        // Validate war type
        const validWarTypes = ['solo_nation', 'nation', 'solo_alliance', 'alliance'];
        if (!validWarTypes.includes(warType)) {
            throw new Error(`Invalid war type: ${warType}. Must be one of: ${validWarTypes.join(', ')}`);
        }

        // Validate casus belli
        if (!this.warTermsSystem.isValidCasusBelli(casusBelliId)) {
            throw new Error(`Invalid casus belli: ${casusBelliId}`);
        }

        // Validate war type restrictions
        if (warType === 'solo_nation' || warType === 'solo_alliance') {
            // Solo wars: only the two participants, no one else can join
            // (enforced in joinWar via war.solo flag)
        }

        // Validation checks
        if (attackerNationId === defenderNationId) {
            throw new Error('Cannot declare war on yourself');
        }

        const attackerNation = this.getNationById(attackerNationId);
        const defenderNation = this.getNationById(defenderNationId);

        if (!attackerNation || !defenderNation) {
            throw new Error('One or both nations not found');
        }

        // Register starting nations with WarTermsSystem so peace-term lookups resolve by id
        this.warTermsSystem.registerNation(attackerNation);
        this.warTermsSystem.registerNation(defenderNation);

        // Check war type compatibility with alliances
        if (warType === 'solo_nation' && attackerNation.allianceId) {
            throw new Error('Solo nation wars cannot involve alliance members');
        }
        if (warType === 'solo_nation' && defenderNation.allianceId) {
            throw new Error('Solo nation wars cannot target alliance members');
        }

        // Check if attacker has available offensive war slots
        if (!this.hasAvailableOffensiveSlots(attackerNation)) {
            throw new Error('No available offensive war slots. Build Command Centers to increase capacity.');
        }

        // Check if defender has available defensive war slots
        if (!this.hasAvailableDefensiveSlots(defenderNation)) {
            throw new Error('Target nation has no available defensive war slots.');
        }

        // Check if nations are already at war
        if (this.areNationsAtWar(attackerNationId, defenderNationId)) {
            throw new Error('Nations are already at war');
        }

        // Diplomacy system peace pact / alliance peace treaty check
        if (window.DiplomacySystem && typeof window.DiplomacySystem.canDeclareWar === 'function') {
            const warCheck = window.DiplomacySystem.canDeclareWar(attackerNationId, defenderNationId);
            if (!warCheck.allowed) {
                throw new Error(`Cannot declare war: ${warCheck.reason}`);
            }
        }

        // Sanction check - neither attacker nor defender can be under attack sanctions
        if (window.motionSystem && typeof window.motionSystem.canPerformAction === 'function') {
            const attackerCheck = window.motionSystem.canPerformAction(attackerNationId, defenderNationId, 'attack');
            if (!attackerCheck.allowed) {
                throw new Error(`Cannot declare war: ${attackerCheck.reason}`);
            }
            const defenderCheck = window.motionSystem.canPerformAction(defenderNationId, attackerNationId, 'attack');
            if (!defenderCheck.allowed) {
                throw new Error(`Cannot declare war: target nation is under sanctions: ${defenderCheck.reason}`);
            }
        }

        // Create new war
        const warId = `war_${this.warCounter++}`;
        const startTime = Date.now() + (this.PREPARATION_MINUTES * 60 * 1000);

        // Get MilitaryUnit entities for each nation (truth source for units)
        const attackerMilitaryUnits = this.getMilitaryUnitEntities(attackerNation);
        const defenderMilitaryUnits = this.getMilitaryUnitEntities(defenderNation);

        // Get war type and casus belli modifiers
        const warTypeMod = this.warTermsSystem.getWarTypeModifier(warType);
        const cbMod = this.warTermsSystem.getCasusBelli(casusBelliId);

        const war = {
            id: warId,
            warType: warType,
            casusBelliId: casusBelliId,
            casusBelli: cbMod ? { ...cbMod } : null,
            warTypeMod: warTypeMod ? { ...warTypeMod } : null,
            solo: warType === 'solo_nation' || warType === 'solo_alliance',
            reason: reason,
            startTime: startTime,
            status: 'preparing', // preparing, active, ended
            currentRound: 0,
            rounds: [],
            originalAttacker: attackerNationId,
            originalDefender: defenderNationId,

            sides: {
                attacker: {
                    nations: [attackerNationId],
                    alliances: new Set(),
                    totalDamage: 0,
                    totalDamageReceived: 0,
                    totalLootGained: 0,
                    totalLootLost: 0,
                    roundsWon: 0,
                    units: this.getNationMilitaryUnitsSummary(attackerNation),
                    militaryUnitEntities: attackerMilitaryUnits, // Map of unitId -> MilitaryUnit
                    damageRankings: new Map(), // nationId -> damage dealt
                    damageReceivedRankings: new Map(), // nationId -> damage received
                    allianceRankings: new Map(), // allianceId -> total alliance damage
                    missilesFired: 0,
                    nukesFired: 0,
                    spyOperations: new Map() // nationId -> operation results
                },
                defender: {
                    nations: [defenderNationId],
                    alliances: new Set(),
                    totalDamage: 0,
                    totalDamageReceived: 0,
                    totalLootGained: 0,
                    totalLootLost: 0,
                    roundsWon: 0,
                    units: this.getNationMilitaryUnitsSummary(defenderNation),
                    militaryUnitEntities: defenderMilitaryUnits, // Map of unitId -> MilitaryUnit
                    damageRankings: new Map(),
                    damageReceivedRankings: new Map(),
                    allianceRankings: new Map(),
                    missilesFired: 0,
                    nukesFired: 0,
                    spyOperations: new Map()
                }
            },

            // Treaty obligations tracking
            treatyObligations: new Map(), // allianceId -> { type, fulfilled, requiredParticipation, currentParticipation }

            // War statistics
            totalAttacks: 0,
            participantStats: new Map()
        };

        // Process treaty obligations
        this.processTreatyObligations(war, attackerNation, defenderNation);

        this.activeWars.set(warId, war);

        // Schedule round start
        const roundStartTimeout = setTimeout(() => {
            this.startWarRound(warId);
            this.roundTimeouts.delete(warId);
        }, this.PREPARATION_MINUTES * 60 * 1000);
        this.roundTimeouts.set(warId, roundStartTimeout);

        // Emit events
        this.safeEmit('war_declared', {
            warId: warId,
            warType: warType,
            war: war,
            attacker: attackerNation,
            defender: defenderNation
        });

        console.log(`War declared: ${attackerNation.name} vs ${defenderNation.name} (${warType})`);
        return warId;
    }

    /**
     * Get MilitaryUnit entities for a nation (truth source for units)
     */
    getMilitaryUnitEntities(nation) {
        const entities = new Map();
        const units = nation.militaryUnits || {};
        const unitTypes = ['soldiers', 'tanks', 'aircraft', 'ships', 'spies', 'missiles', 'nukes'];

        unitTypes.forEach(type => {
            const count = units[type] || 0;
            if (count > 0) {
                // Create MilitaryUnit entity as the truth source for these units
                // skipNationUpdate: true because Nation.militaryUnits already has these counted
                const militaryUnit = new MilitaryUnit(type, count, nation.id, { skipNationUpdate: true });
                entities.set(type, militaryUnit);
            }
        });

        return entities;
    }

    /**
     * Get military unit summary for a nation (numbers only, for backward compat)
     */
    getNationMilitaryUnitsSummary(nation) {
        return {
            soldiers: nation.militaryUnits?.soldiers || 0,
            tanks: nation.militaryUnits?.tanks || 0,
            aircraft: nation.militaryUnits?.aircraft || 0,
            ships: nation.militaryUnits?.ships || 0,
            spies: nation.militaryUnits?.spies || 0,
            missiles: nation.militaryUnits?.missiles || 0,
            nukes: nation.militaryUnits?.nukes || 0
        };
    }

    /**
     * Get total military-eligible population from Population System (truth source for population)
     */
    getMilitaryEligiblePopulation(nationId) {
        const nation = this.getNationById(nationId);
        if (!nation || !window.PopulationSystem) return 0;
        return window.PopulationSystem.getMilitaryEligiblePopulation();
    }

    /**
     * Get total population from Population System (truth source for population)
     */
    getTotalPopulation(nationId) {
        const nation = this.getNationById(nationId);
        if (!nation || !window.PopulationSystem) return 0;
        return window.PopulationSystem.getTotalPopulation();
    }

    /**
     * Join an existing war
     */
    joinWar(data) {
        const { warId, nationId, side } = data; // side: 'attacker' or 'defender'

        const war = this.activeWars.get(warId);
        if (!war) {
            throw new Error('War not found');
        }

        // Solo wars: no one else can join
        if (war.solo) {
            throw new Error('This is a solo war - no other nations can join');
        }

        if (war.status !== 'preparing' && war.status !== 'active') {
            throw new Error('Cannot join ended war');
        }

        const nation = this.getNationById(nationId);
        if (!nation) {
            throw new Error('Nation not found');
        }

        // Check war type compatibility
        if (war.warType === 'solo_nation' && nation.allianceId) {
            throw new Error('Solo nation wars cannot involve alliance members');
        }

        // Enforce max participants per side based on war type modifier
        const warTypeMod = this.warTermsSystem.getWarTypeModifier(war.warType);
        if (warTypeMod && warTypeMod.maxParticipantsPerSide) {
            const maxPerSide = warTypeMod.maxParticipantsPerSide;
            const sideData = war.sides[side];
            if (war.warType === 'solo_alliance' || war.warType === 'alliance') {
                // Limit is on whole alliances; multiple nations from same alliance count as one
                const willAddNewAlliance = nation.allianceId && !sideData.alliances.has(nation.allianceId);
                const prospectiveAlliances = sideData.alliances.size + (willAddNewAlliance ? 1 : 0);
                if (prospectiveAlliances > maxPerSide) {
                    throw new Error(
                        `This side already has the maximum of ${maxPerSide} alliances. Cannot join.`
                    );
                }
            } else {
                // Limit is on nations
                if (sideData.nations.length >= maxPerSide) {
                    throw new Error(
                        `This side already has the maximum of ${maxPerSide} nations. Cannot join.`
                    );
                }
            }
        }

        // Register joining nation with WarTermsSystem so peace-term lookups resolve by id
        this.warTermsSystem.registerNation(nation);

        // Check if nation has appropriate war slots based on side joining
        if (side === 'attacker') {
            if (!this.hasAvailableOffensiveSlots(nation)) {
                throw new Error('No available offensive war slots');
            }
        } else {
            if (!this.hasAvailableDefensiveSlots(nation)) {
                throw new Error('No available defensive war slots');
            }
        }

        // Check if already in this war
        if (war.sides.attacker.nations.includes(nationId) ||
            war.sides.defender.nations.includes(nationId)) {
            throw new Error('Already participating in this war');
        }

        // Add nation to war
        war.sides[side].nations.push(nationId);

        // Track alliance participation
        if (nation.allianceId) {
            war.sides[side].alliances.add(nation.allianceId);
        }

        // Add nation's military unit entities
        const nationUnitEntities = this.getMilitaryUnitEntities(nation);
        this.addUnitEntitiesToSide(war.sides[side], nationUnitEntities);

        // Add nation's military units summary
        const nationUnits = this.getNationMilitaryUnitsSummary(nation);
        this.addUnitsToSide(war.sides[side], nationUnits);

        // Initialize damage rankings
        war.sides[side].damageRankings.set(nationId, 0);
        if (nation.allianceId) {
            if (!war.sides[side].allianceRankings.has(nation.allianceId)) {
                war.sides[side].allianceRankings.set(nation.allianceId, 0);
            }
        }

        // Initialize participant stats
        war.participantStats.set(nationId, {
            attacks: 0,
            damage: 0,
            damageReceived: 0,
            criticalHits: 0,
            blocks: 0,
            parries: 0,
            unitsLost: {},
            unitsKilled: {},
            infraDestroyed: 0,
            infraReceived: 0,
            lootGained: 0,
            lootLost: 0
        });

        this.safeEmit('war_joined', {
            warId: warId,
            nationId: nationId,
            side: side,
            nation: nation
        });

        console.log(`${nation.name} joined war ${warId} on ${side} side`);
        return true;
    }

    /**
     * Execute attack in war with full skill integration
     */
    executeAttack(data) {
        const { warId, attackerNationId, targetSide } = data;

        const war = this.activeWars.get(warId);
        if (!war || war.status !== 'active') {
            throw new Error('War not active or not found');
        }

        let attackerNation = this.getNationById(attackerNationId);
        if (!attackerNation) {
            throw new Error('Attacker nation not found');
        }

        // Check energy requirement - use player's actual current energy
        const attackerPlayer = this.getPlayerByNationId(attackerNationId);
        if (!attackerPlayer) {
            throw new Error('Attacker player not found');
        }

        const currentEnergy = attackerPlayer.getCurrentEnergy();
        if (currentEnergy < this.ENERGY_PER_ATTACK) {
            throw new Error(`Insufficient energy: need ${this.ENERGY_PER_ATTACK}, have ${currentEnergy}`);
        }

        // Consume energy from player
        attackerPlayer.consumeEnergy(this.ENERGY_PER_ATTACK);

        // Sanction check - attacker cannot attack if sanctioned against target side nations
        if (window.motionSystem && typeof window.motionSystem.canPerformAction === 'function') {
            const targetNations = war.sides[targetSide].nations || [];
            for (const targetNationId of targetNations) {
                const attackCheck = window.motionSystem.canPerformAction(attackerNationId, targetNationId, 'attack');
                if (!attackCheck.allowed) {
                    throw new Error(`Cannot attack: ${attackCheck.reason}`);
                }
            }
        }

        // Calculate base attack damage
        const baseDamage = this.calculateBaseDamage(attackerNation, attackerPlayer);
        let finalDamage = baseDamage;

        // Check for critical hit
        const isCritical = this.rollCriticalHit(attackerPlayer);
        if (isCritical) {
            const critDamage = this.calculateCriticalDamage(baseDamage, attackerPlayer);
            finalDamage += critDamage;
        }

        // Apply all bonuses (including treaties)
        const attackerSide = this.getAttackerSide(war, attackerNationId);
        finalDamage = this.applyAttackBonuses(finalDamage, attackerNation, attackerPlayer, war, attackerSide);

        // Process defense for all defending nations
        const defendingSide = war.sides[targetSide];
        let totalDefenseDamage = 0;

        defendingSide.nations.forEach(defenderNationId => {
            const defenseResult = this.processDefense(defenderNationId, finalDamage, war);
            totalDefenseDamage += defenseResult.counterDamage;
        });

        // Apply damage to war round
        const currentRound = war.rounds[war.currentRound - 1];
        if (!currentRound) {
            throw new Error('No active war round found');
        }

        currentRound.damage[attackerSide] += finalDamage;
        currentRound.damage[targetSide] += totalDefenseDamage;

        // Track damage received for defending nations (distribute counter damage among defenders)
        const defenderCount = defendingSide.nations.length;
        const damagePerDefender = defenderCount > 0 ? Math.floor(totalDefenseDamage / defenderCount) : 0;
        let remainingDamage = totalDefenseDamage;

        defendingSide.nations.forEach((defenderNationId, index) => {
            const stats = war.participantStats.get(defenderNationId);
            // Last defender gets any remainder from integer division
            const defenderDamage = index === defenderCount - 1 ? remainingDamage : damagePerDefender;
            remainingDamage -= defenderDamage;
            if (stats) {
                stats.damageReceived += defenderDamage;
            }
            // Update damage received rankings
            war.sides[targetSide].damageReceivedRankings.set(
                defenderNationId,
                (war.sides[targetSide].damageReceivedRankings.get(defenderNationId) || 0) + defenderDamage
            );
        });

        // Update damage rankings in real-time
        this.updateDamageRankings(war, attackerNationId, finalDamage, attackerSide);
        if (totalDefenseDamage > 0) {
            // Distribute defense damage among defenders for ranking
            const defensePerDefender = Math.floor(totalDefenseDamage / defendingSide.nations.length);
            defendingSide.nations.forEach(defenderNationId => {
                this.updateDamageRankings(war, defenderNationId, defensePerDefender, targetSide);
            });
        }

        // Track damage received for attacker (from counter-damage)
        const attackerStats = war.participantStats.get(attackerNationId);
        if (attackerStats) {
            attackerStats.damageReceived += totalDefenseDamage;
        }

        // Calculate loot and destruction from this attack using WarTermsSystem
        const cbId = war.casusBelliId || 'general_dispute';
        const wtId = war.warType || 'nation';

        // Get attacker tech and skills
        attackerNation = this.getNationById(attackerNationId);
        const attackerTech = attackerNation?.tech || 0;
        const attackerSkills = attackerPlayer ? {
            aim: attackerPlayer.getSkillValue('aim') || 0,
            luck: attackerPlayer.getSkillValue('luck') || 0,
            criticalChance: attackerPlayer.getSkillValue('criticalChance') || 0,
            criticalDamage: attackerPlayer.getSkillValue('criticalDamage') || 0,
            attack: attackerPlayer.getSkillValue('attack') || 0,
            defense: attackerPlayer.getSkillValue('defense') || 0,
            block: attackerPlayer.getSkillValue('block') || 0,
            parry: attackerPlayer.getSkillValue('parry') || 0
        } : {};

        // Get defender tech and skills (primary defender on target side)
        const defenderNationId = defendingSide.nations[0];
        const defenderPlayer = defenderNationId ? this.getPlayerByNationId(defenderNationId) : null;
        const defenderNation = defenderNationId ? this.getNationById(defenderNationId) : null;
        const defenderTech = defenderNation?.tech || 0;
        const defenderSkills = defenderPlayer ? {
            aim: defenderPlayer.getSkillValue('aim') || 0,
            luck: defenderPlayer.getSkillValue('luck') || 0,
            criticalChance: defenderPlayer.getSkillValue('criticalChance') || 0,
            criticalDamage: defenderPlayer.getSkillValue('criticalDamage') || 0,
            attack: defenderPlayer.getSkillValue('attack') || 0,
            defense: defenderPlayer.getSkillValue('defense') || 0,
            block: defenderPlayer.getSkillValue('block') || 0,
            parry: defenderPlayer.getSkillValue('parry') || 0
        } : {};

        // Random integer for loot variance (0-100)
        const randomInt = Math.floor(Math.random() * 101);

        // Estimate unit mix from total damage
        const estimatedUnitMix = this.warTermsSystem.estimateUnitMixFromDamage(finalDamage + totalDefenseDamage);

        // Calculate loot for attacker (damage they dealt) using new damage-based formula
        const attackerLoot = this.warTermsSystem.calculateAttackLoot(
            finalDamage,
            estimatedUnitMix,
            attackerTech,
            attackerSkills,
            cbId,
            wtId,
            randomInt
        );

        // Calculate units destroyed/lost for both sides
        const unitLoss = this.warTermsSystem.calculateUnitsDestroyed(
            finalDamage,
            totalDefenseDamage,
            attackerSkills,
            defenderSkills,
            attackerTech,
            defenderTech,
            cbId,
            wtId
        );

        // Calculate infra destruction from damage dealt (no unit-based infra)
        const destruction = this.warTermsSystem.calculateInfraDestruction(
            finalDamage + totalDefenseDamage,
            cbId,
            wtId
        );

        // Calculate population casualties from actual unit losses using estimated unit mix proportions
        const totalUnitLoss = unitLoss.attackerUnitsLost + unitLoss.defenderUnitsLost;
        const unitMix = this.warTermsSystem.estimateUnitMixFromDamage(finalDamage + totalDefenseDamage);
        const mixTotal = Object.values(unitMix).reduce((a, b) => a + b, 0) || 1;
        const unitsLost = {};
        Object.entries(unitMix).forEach(([type, count]) => {
            unitsLost[type] = Math.floor((count / mixTotal) * totalUnitLoss);
        });
        const populationCasualties = this.warTermsSystem.calculatePopulationCasualties(
            unitsLost,
            cbId
        );

        // Track loot gained by attacker and lost by defender
        if (attackerLoot.cash > 0) {
            war.sides[attackerSide].totalLootGained = (war.sides[attackerSide].totalLootGained || 0) + attackerLoot.cash;
            war.sides[targetSide].totalLootLost = (war.sides[targetSide].totalLootLost || 0) + attackerLoot.cash;

            const attackerStats = war.participantStats.get(attackerNationId);
            if (attackerStats) {
                attackerStats.lootGained = (attackerStats.lootGained || 0) + attackerLoot.cash;
            }

            defendingSide.nations.forEach(defenderNationId => {
                const defenderStats = war.participantStats.get(defenderNationId);
                if (defenderStats) {
                    defenderStats.lootLost = (defenderStats.lootLost || 0) + Math.floor(attackerLoot.cash / defendingSide.nations.length);
                }
            });
        }

        // Track infra destruction
        defendingSide.nations.forEach(defenderNationId => {
            const defenderStats = war.participantStats.get(defenderNationId);
            if (defenderStats) {
                defenderStats.infraReceived = (defenderStats.infraReceived || 0) + Math.floor(destruction.totalInfra / defendingSide.nations.length);
            }
        });

        if (attackerStats) {
            attackerStats.infraDestroyed = (attackerStats.infraDestroyed || 0) + Math.floor(destruction.totalInfra / 2);
        }

        // Update statistics
        this.updateWarStatistics(war, attackerNationId, {
            damage: finalDamage,
            damageReceived: totalDefenseDamage,
            infraDestroyed: Math.floor(destruction.totalInfra / 2),
            isCritical: isCritical
        });

        // Emit attack event
        this.safeEmit('war_attack_executed', {
            warId: warId,
            attacker: attackerNation,
            damage: finalDamage,
            isCritical: isCritical,
            defenseDamage: totalDefenseDamage
        });

        // Track relationship combat stats for leaderboards
        const attackerSideForTracking = this.getAttackerSide(war, attackerNationId);
        if (attackerSideForTracking) {
            this.trackRelationshipCombat(attackerNationId, war, attackerSideForTracking);
        }

        return {
            damage: finalDamage,
            isCritical: isCritical,
            defenseDamage: totalDefenseDamage
        };
    }

    /**
     * Launch missile in war
     */
    launchMissile(data) {
        const { warId, attackerNationId, targetSide } = data;

        const war = this.activeWars.get(warId);
        if (!war || war.status !== 'active') {
            throw new Error('War not active or not found');
        }

        const attackerNation = this.getNationById(attackerNationId);
        if (!attackerNation) {
            throw new Error('Attacker nation not found');
        }

        // Sanction check - attacker cannot launch missiles if sanctioned against target side
        if (window.motionSystem && typeof window.motionSystem.canPerformAction === 'function') {
            const targetNations = war.sides[targetSide].nations || [];
            for (const targetNationId of targetNations) {
                const attackCheck = window.motionSystem.canPerformAction(attackerNationId, targetNationId, 'attack');
                if (!attackCheck.allowed) {
                    throw new Error(`Cannot launch missile: ${attackCheck.reason}`);
                }
            }
        }

        // Check if attacker is in this war
        const attackerSide = this.getAttackerSide(war, attackerNationId);
        if (!attackerSide) {
            throw new Error('Nation not participating in this war');
        }

        // Check if nation has missiles
        if (!attackerNation.militaryUnits?.missiles || attackerNation.militaryUnits.missiles === 0) {
            throw new Error('No missiles available');
        }

        // Check Intuition requirement - use player's actual current intuition
        const attackerPlayer = this.getPlayerByNationId(attackerNationId);
        if (!attackerPlayer) {
            throw new Error('Attacker player not found');
        }

        const currentIntuition = attackerPlayer.getCurrentIntuition();
        if (currentIntuition < this.MISSILE_INTUITION_COST) {
            throw new Error(`Insufficient Intuition: need ${this.MISSILE_INTUITION_COST}, have ${currentIntuition}`);
        }

        // Consume resources
        attackerNation.militaryUnits.missiles--;
        // Update MilitaryUnit entity truth source
        const missileUnit = war.sides[attackerSide].militaryUnitEntities?.get('missiles');
        if (missileUnit && missileUnit.quantity > 0) {
            missileUnit.quantity--;
        }
        attackerPlayer.consumeIntuition(this.MISSILE_INTUITION_COST);

        // Calculate if missile is intercepted
        const isIntercepted = this.calculateInterception(war.sides[targetSide], 'missile');

        if (isIntercepted) {
            // Missile blocked - attacker gets happiness penalty, defenders get boost
            this.applyMissileInterceptionEffects(war, attackerNationId, targetSide);

            this.safeEmit('missile_intercepted', {
                warId: warId,
                attacker: attackerNation,
                interceptedBy: targetSide
            });

            return { intercepted: true, damage: 0 };
        } else {
            // Missile hits - calculate damage
            const damage = this.calculateMissileDamage(attackerNation, attackerPlayer);

            // Apply damage to all nations on target side
            this.applyMissileHitEffects(war, targetSide, damage, attackerNationId);

            // Update war statistics
            war.sides[attackerSide].missilesFired++;

            this.safeEmit('missile_hit', {
                warId: warId,
                attacker: attackerNation,
                targetSide: targetSide,
                damage: damage
            });

            return { intercepted: false, damage: damage };
        }
    }

    /**
     * Launch nuke in war
     */
    launchNuke(data) {
        const { warId, attackerNationId, targetSide } = data;

        const war = this.activeWars.get(warId);
        if (!war || war.status !== 'active') {
            throw new Error('War not active or not found');
        }

        const attackerNation = this.getNationById(attackerNationId);
        if (!attackerNation) {
            throw new Error('Attacker nation not found');
        }

        // Sanction check - attacker cannot launch nukes if sanctioned against target side
        if (window.motionSystem && typeof window.motionSystem.canPerformAction === 'function') {
            const targetNations = war.sides[targetSide].nations || [];
            for (const targetNationId of targetNations) {
                const attackCheck = window.motionSystem.canPerformAction(attackerNationId, targetNationId, 'attack');
                if (!attackCheck.allowed) {
                    throw new Error(`Cannot launch nuke: ${attackCheck.reason}`);
                }
            }
        }

        // Check if attacker is in this war
        const attackerSide = this.getAttackerSide(war, attackerNationId);
        if (!attackerSide) {
            throw new Error('Nation not participating in this war');
        }

        // Check if nation has nukes
        if (!attackerNation.militaryUnits?.nukes || attackerNation.militaryUnits.nukes === 0) {
            throw new Error('No nukes available');
        }

        // Check Intuition requirement - use player's actual current intuition
        const attackerPlayer = this.getPlayerByNationId(attackerNationId);
        if (!attackerPlayer) {
            throw new Error('Attacker player not found');
        }

        const currentIntuition = attackerPlayer.getCurrentIntuition();
        if (currentIntuition < this.NUKE_INTUITION_COST) {
            throw new Error(`Insufficient Intuition: need ${this.NUKE_INTUITION_COST}, have ${currentIntuition}`);
        }

        // Consume resources
        attackerNation.militaryUnits.nukes--;
        // Update MilitaryUnit entity truth source
        const nukeUnit = war.sides[attackerSide].militaryUnitEntities?.get('nukes');
        if (nukeUnit && nukeUnit.quantity > 0) {
            nukeUnit.quantity--;
        }
        attackerPlayer.consumeIntuition(this.NUKE_INTUITION_COST);

        // Calculate if nuke is intercepted
        const isIntercepted = this.calculateInterception(war.sides[targetSide], 'nuke');

        if (isIntercepted) {
            // Nuke blocked - attacker gets happiness penalty, defenders get boost
            this.applyNukeInterceptionEffects(war, attackerNationId, targetSide);

            this.safeEmit('nuke_intercepted', {
                warId: warId,
                attacker: attackerNation,
                interceptedBy: targetSide
            });

            return { intercepted: true, damage: 0 };
        } else {
            // Nuke hits - massive damage
            const damage = this.calculateNukeDamage(attackerNation, attackerPlayer);

            // Apply damage to all nations on target side
            this.applyNukeHitEffects(war, targetSide, damage, attackerNationId);

            // Update war statistics
            war.sides[attackerSide].nukesFired++;

            this.safeEmit('nuke_hit', {
                warId: warId,
                attacker: attackerNation,
                targetSide: targetSide,
                damage: damage
            });

            return { intercepted: false, damage: damage };
        }
    }

    /**
     * Launch spy operation in war
     */
    launchSpyOperation(data) {
        const { warId, attackerNationId, targetNationId, operation } = data;

        const war = this.activeWars.get(warId);
        if (!war || war.status !== 'active') {
            throw new Error('War not active or not found');
        }

        const attackerNation = this.getNationById(attackerNationId);
        const targetNation = this.getNationById(targetNationId);

        if (!attackerNation || !targetNation) {
            throw new Error('One or both nations not found');
        }

        // Check if attacker is in this war
        const attackerSide = this.getAttackerSide(war, attackerNationId);
        if (!attackerSide) {
            throw new Error('Nation not participating in this war');
        }

        // Check if target is on the opposite side
        const targetSide = attackerSide === 'attacker' ? 'defender' : 'attacker';
        if (!war.sides[targetSide].nations.includes(targetNationId)) {
            throw new Error('Target nation is not on the opposing side');
        }

        // Intelligence pact check: partners cannot spy on each other
        if (window.DiplomacySystem && typeof window.DiplomacySystem.canSpyOn === 'function') {
            const spyCheck = window.DiplomacySystem.canSpyOn(attackerNationId, targetNationId);
            if (!spyCheck.allowed) {
                throw new Error(`Cannot spy: ${spyCheck.reason}`);
            }
        }

        // Sanction check - attacker cannot spy if sanctioned against target
        if (window.motionSystem && typeof window.motionSystem.canPerformAction === 'function') {
            const spyCheck = window.motionSystem.canPerformAction(attackerNationId, targetNationId, 'attack');
            if (!spyCheck.allowed) {
                throw new Error(`Cannot spy: ${spyCheck.reason}`);
            }
        }

        // Check if nation has spies
        if (!attackerNation.militaryUnits?.spies || attackerNation.militaryUnits.spies === 0) {
            throw new Error('No spies available');
        }

        // Check operation type
        const operationCost = this.SPY_OPERATION_COSTS[operation];
        if (!operationCost) {
            throw new Error('Invalid spy operation type');
        }

        // Check Intuition requirement - use player's actual current intuition
        const attackerPlayer = this.getPlayerByNationId(attackerNationId);
        if (!attackerPlayer) {
            throw new Error('Attacker player not found');
        }

        const currentIntuition = attackerPlayer.getCurrentIntuition();
        if (currentIntuition < operationCost) {
            throw new Error(`Insufficient Intuition: need ${operationCost}, have ${currentIntuition}`);
        }

        // Consume resources
        attackerPlayer.consumeIntuition(operationCost);
        // Deduct one spy from attacker for the operation
        attackerNation.militaryUnits.spies--;
        // Update MilitaryUnit entity truth source
        const spyUnit = war.sides[attackerSide].militaryUnitEntities?.get('spies');
        if (spyUnit && spyUnit.quantity > 0) {
            spyUnit.quantity--;
        }

        // Execute spy operation
        const result = this.executeSpyOperation(
            attackerNation,
            targetNation,
            attackerPlayer,
            operation,
            war
        );

        // Record operation in war
        if (!war.sides[attackerSide].spyOperations.has(attackerNationId)) {
            war.sides[attackerSide].spyOperations.set(attackerNationId, []);
        }
        war.sides[attackerSide].spyOperations.get(attackerNationId).push({
            operation: operation,
            target: targetNationId,
            result: result,
            timestamp: Date.now()
        });

        this.safeEmit('spy_operation_executed', {
            warId: warId,
            attacker: attackerNation,
            target: targetNation,
            operation: operation,
            result: result
        });

        // Intelligence pact: share gather intel results with all partners
        if (operation === 'gatherIntel' && window.DiplomacySystem) {
            const partners = window.DiplomacySystem.getIntelligencePartners(attackerNationId);
            for (const partnerId of partners) {
                this.safeEmit('intel_shared_with_partner', {
                    warId: warId,
                    sourceNation: attackerNationId,
                    partnerNationId: partnerId,
                    targetNation: targetNationId,
                    operation: operation,
                    result: result
                });
            }
        }

        return result;
    }

    /**
     * Calculate missile damage
     */
    calculateMissileDamage(attackerNation, attackerPlayer) {
        let damage = this.MISSILE_BASE_DAMAGE;

        // Apply player skills
        const aimBonus = (attackerPlayer.getSkillValue('aim') || 0);
        const luckBonus = (attackerPlayer.getSkillValue('luck') || 0);

        damage *= (1 + aimBonus * 0.5 + luckBonus * 0.3);

        // Apply military morale
        if (attackerNation.nationStats?.militaryMorale) {
            damage *= attackerNation.nationStats.militaryMorale;
        }

        return Math.floor(damage);
    }

    /**
     * Calculate nuke damage
     */
    calculateNukeDamage(attackerNation, attackerPlayer) {
        let damage = this.NUKE_BASE_DAMAGE;

        // Apply player skills
        const aimBonus = (attackerPlayer.getSkillValue('aim') || 0);
        const luckBonus = (attackerPlayer.getSkillValue('luck') || 0);

        damage *= (1 + aimBonus * 0.5 + luckBonus * 0.3);

        // Apply military morale
        if (attackerNation.nationStats?.militaryMorale) {
            damage *= attackerNation.nationStats.militaryMorale;
        }

        return Math.floor(damage);
    }

    /**
     * Apply effects when missile is intercepted
     */
    applyMissileInterceptionEffects(war, attackerNationId, targetSide) {
        // Attacker gets happiness penalty
        const attackerNation = this.getNationById(attackerNationId);
        if (attackerNation && attackerNation.temporaryEffects) {
            attackerNation.temporaryEffects.push({
                type: 'happinessReduction',
                amount: this.MISSILE_HAPPINESS_PENALTY,
                turnsRemaining: 24, // 1 day
                description: 'Missile intercepted - military embarrassment'
            });
        }

        // Defenders get happiness boost
        war.sides[targetSide].nations.forEach(nationId => {
            const nation = this.getNationById(nationId);
            if (nation && nation.temporaryEffects) {
                nation.temporaryEffects.push({
                    type: 'happinessBonus',
                    amount: Math.floor(this.MISSILE_HAPPINESS_PENALTY / 2),
                    turnsRemaining: 24, // 1 day
                    description: 'Successful missile defense'
                });
            }
        });
    }

    /**
     * Apply effects when nuke is intercepted
     */
    applyNukeInterceptionEffects(war, attackerNationId, targetSide) {
        // Attacker gets larger happiness penalty
        const attackerNation = this.getNationById(attackerNationId);
        if (attackerNation && attackerNation.temporaryEffects) {
            attackerNation.temporaryEffects.push({
                type: 'happinessReduction',
                amount: this.NUKE_HAPPINESS_PENALTY,
                turnsRemaining: 48, // 2 days
                description: 'Nuclear missile intercepted - major military failure'
            });
        }

        // Defenders get larger happiness boost
        war.sides[targetSide].nations.forEach(nationId => {
            const nation = this.getNationById(nationId);
            if (nation && nation.temporaryEffects) {
                nation.temporaryEffects.push({
                    type: 'happinessBonus',
                    amount: Math.floor(this.NUKE_HAPPINESS_PENALTY / 2),
                    turnsRemaining: 48, // 2 days
                    description: 'Successful nuclear defense - national pride'
                });
            }
        });
    }

    /**
     * Apply effects when missile hits
     * Infra damage (low), unit kills (soldiers, tanks, aircraft, ships)
     */
    applyMissileHitEffects(war, targetSide, damage, attackerNationId) {
        const cbId = war.casusBelliId || 'general_dispute';
        const wtId = war.warType || 'nation';

        const infraResult = this.warTermsSystem.calculateInfraDestruction(damage, cbId, wtId);
        const infraMultiplier = infraResult.totalInfra > 0 ? infraResult.totalInfra / damage : 1.0;

        const attackerNation = this.getNationById(attackerNationId);
        const attackerPlayer = attackerNation ? this.getPlayerByNationId(attackerNationId) : null;
        const aimSkill = attackerPlayer ? attackerPlayer.getSkillValue('aim') || 0 : 0;
        const luckSkill = attackerPlayer ? attackerPlayer.getSkillValue('luck') || 0 : 0;
        const critSkill = attackerPlayer ? attackerPlayer.getSkillValue('criticalChance') || 0 : 0;

        const targetNations = war.sides[targetSide].nations;

        targetNations.forEach(nationId => {
            const nation = this.getNationById(nationId);
            if (!nation) return;

            // Infra damage (low for missiles: 5-15%)
            const damagePercent = 0.05 + (Math.random() * 0.10);
            const currentInfra = nation.infra || 0;
            let infraLoss = Math.floor(currentInfra * damagePercent * infraMultiplier);
            if (currentInfra < 5) {
                infraLoss = currentInfra;
            } else {
                infraLoss = Math.max(5, infraLoss);
            }
            nation.infra = Math.max(0, currentInfra - infraLoss);

            // Unit kills (missiles only: soldiers, tanks, aircraft, ships)
            const unitTypes = ['soldiers', 'tanks', 'aircraft', 'ships'];
            unitTypes.forEach(unitType => {
                const currentUnits = nation.militaryUnits?.[unitType] || 0;
                if (currentUnits === 0) return;

                const baseKillRate = {
                    soldiers: 0.002,
                    tanks: 0.005,
                    aircraft: 0.003,
                    ships: 0.004
                }[unitType] || 0;

                const skillMultiplier = 1 + (aimSkill * 0.005) + (luckSkill * 0.002) + (critSkill * 0.001);
                const randomFactor = 0.5 + Math.random() * 1.0; // 0.5x to 1.5x

                let unitKill = Math.floor(currentUnits * baseKillRate * skillMultiplier * randomFactor * infraMultiplier);
                unitKill = Math.min(unitKill, currentUnits);

                if (unitKill > 0) {
                    nation.militaryUnits[unitType] = Math.max(0, currentUnits - unitKill);

                    // Update MilitaryUnit entity truth source
                    const warObj = this.getWarByNationId(nationId);
                    if (warObj) {
                        const unitEntity = warObj.sides[targetSide]?.militaryUnitEntities?.get(unitType);
                        if (unitEntity) {
                            unitEntity.takeCasualties(unitKill);
                        }
                    }

                    // Record combat deaths in Population System
                    if (window.PopulationSystem && unitKill > 0) {
                        window.PopulationSystem.recordMilitaryCombatDeaths(unitKill, unitType);
                    }

                    // Track units killed by attacker
                    const attackerStats = war.participantStats.get(attackerNationId);
                    if (attackerStats) {
                        if (!attackerStats.unitsKilled[unitType]) attackerStats.unitsKilled[unitType] = 0;
                        attackerStats.unitsKilled[unitType] += unitKill;
                    }

                    // Track units lost by defender
                    const defenderStats = war.participantStats.get(nationId);
                    if (defenderStats) {
                        if (!defenderStats.unitsLost[unitType]) defenderStats.unitsLost[unitType] = 0;
                        defenderStats.unitsLost[unitType] += unitKill;
                    }
                }
            });

            // Track infra destroyed/received
            const attackerStats = war.participantStats.get(attackerNationId);
            if (attackerStats) {
                attackerStats.infraDestroyed = (attackerStats.infraDestroyed || 0) + infraLoss;
            }
            const defenderStats = war.participantStats.get(nationId);
            if (defenderStats) {
                defenderStats.infraReceived = (defenderStats.infraReceived || 0) + infraLoss;
            }

            // Happiness penalty
            if (nation.temporaryEffects) {
                nation.temporaryEffects.push({
                    type: 'happinessReduction',
                    amount: this.MISSILE_HAPPINESS_PENALTY,
                    turnsRemaining: 48,
                    description: 'Missile strike casualties'
                });
            }

            console.log(`Missile hit ${nation.name}: ${infraLoss} infra destroyed, happiness penalty applied`);
        });

        // Missiles yield no loot (per war-terms-system: missiles have 0 loot multiplier)
    }

    /**
     * Apply effects when nuke hits
     * Infra damage (high: 20-65%), tech damage (nukes only)
     */
    applyNukeHitEffects(war, targetSide, damage, attackerNationId) {
        const cbId = war.casusBelliId || 'general_dispute';
        const wtId = war.warType || 'nation';

        const infraResult = this.warTermsSystem.calculateInfraDestruction(damage, cbId, wtId);
        const infraMultiplier = infraResult.totalInfra > 0 ? infraResult.totalInfra / damage : 1.0;

        const attackerNation = this.getNationById(attackerNationId);
        const attackerPlayer = attackerNation ? this.getPlayerByNationId(attackerNationId) : null;
        const aimSkill = attackerPlayer ? attackerPlayer.getSkillValue('aim') || 0 : 0;
        const luckSkill = attackerPlayer ? attackerPlayer.getSkillValue('luck') || 0 : 0;
        const techSkill = attackerPlayer ? attackerPlayer.getSkillValue('technology') || 0 : 0;

        const targetNations = war.sides[targetSide].nations;

        targetNations.forEach(nationId => {
            const nation = this.getNationById(nationId);
            if (!nation) return;

            // Infra damage (high for nukes: 20-65%)
            const damagePercent = 0.20 + (Math.random() * 0.45);
            const currentInfra = nation.infra || 0;
            let infraLoss = Math.floor(currentInfra * damagePercent * infraMultiplier);
            if (currentInfra < 100) {
                infraLoss = currentInfra;
            } else {
                infraLoss = Math.max(100, infraLoss);
            }
            nation.infra = Math.max(0, currentInfra - infraLoss);

            // Tech damage (nukes only: 2-8% of enemy tech)
            const currentTech = nation.tech || 0;
            if (currentTech > 0) {
                const baseTechDamageRate = 0.02 + (Math.random() * 0.06);
                const skillMultiplier = 1 + (aimSkill * 0.003) + (luckSkill * 0.002) + (techSkill * 0.005);
                const randomFactor = 0.5 + Math.random() * 1.0;

                let techDamage = Math.floor(currentTech * baseTechDamageRate * skillMultiplier * randomFactor * infraMultiplier);
                techDamage = Math.min(techDamage, currentTech);

                if (techDamage > 0) {
                    nation.tech = Math.max(0, currentTech - techDamage);

                    const attackerStats = war.participantStats.get(attackerNationId);
                    if (attackerStats) {
                        if (!attackerStats.techDestroyed) attackerStats.techDestroyed = 0;
                        attackerStats.techDestroyed += techDamage;
                    }
                    const defenderStats = war.participantStats.get(nationId);
                    if (defenderStats) {
                        if (!defenderStats.techReceived) defenderStats.techReceived = 0;
                        defenderStats.techReceived += techDamage;
                    }
                }
            }

            // Track infra destroyed/received
            const attackerStats = war.participantStats.get(attackerNationId);
            if (attackerStats) {
                attackerStats.infraDestroyed = (attackerStats.infraDestroyed || 0) + infraLoss;
            }
            const defenderStats = war.participantStats.get(nationId);
            if (defenderStats) {
                defenderStats.infraReceived = (defenderStats.infraReceived || 0) + infraLoss;
            }

            // Record combat deaths from nuclear strike in Population System
            const nukeUnitKill = Math.max(1, Math.floor((nation.militaryUnits?.soldiers || 0) * 0.05 +
                (nation.militaryUnits?.tanks || 0) * 0.1 +
                (nation.militaryUnits?.aircraft || 0) * 0.1 +
                (nation.militaryUnits?.ships || 0) * 0.05));
            if (window.PopulationSystem && nukeUnitKill > 0) {
                window.PopulationSystem.recordMilitaryCombatDeaths(nukeUnitKill);
            }

            // Massive happiness penalty
            if (nation.temporaryEffects) {
                nation.temporaryEffects.push({
                    type: 'happinessReduction',
                    amount: this.NUKE_HAPPINESS_PENALTY,
                    turnsRemaining: 120,
                    description: 'Nuclear devastation - massive casualties'
                });
            }

            // Additional environmental damage
            if (nation.nationStats) {
                nation.nationStats.environment = Math.max(0, nation.nationStats.environment - 10);
                nation.nationStats.pollution = Math.min(100, nation.nationStats.pollution + 15);
            }

            console.log(`Nuclear strike hit ${nation.name}: ${infraLoss} infra destroyed (${Math.round(damagePercent * 100)}% damage), severe penalties applied`);
        });

        // Nukes yield no loot (per war-terms-system: nukes have 0 loot multiplier)
    }

    /**
     * Execute spy operation
     */
    executeSpyOperation(attackerNation, targetNation, attackerPlayer, operation, war = null) {
        // Calculate success chance based on spy counts and player skills
        const offensiveSpies = attackerNation.militaryUnits?.spies || 0;
        const defensiveSpies = targetNation.militaryUnits?.spies || 0;

        const aimSkill = attackerPlayer.getSkillValue('aim') || 0;
        const luckSkill = attackerPlayer.getSkillValue('luck') || 0;

        // Special handling for Deploy Virus
        if (operation === 'deployVirus') {
            return this.executeDeployVirus(attackerNation, targetNation, attackerPlayer, war);
        }

        // Base success chance: 50% + spy advantage + skills + random
        let successChance = 0.5;
        successChance += Math.min(0.3, (offensiveSpies - defensiveSpies) * 0.02); // Spy advantage
        successChance += aimSkill * 0.003; // Aim bonus
        successChance += luckSkill * 0.002; // Luck bonus
        successChance += (Math.random() - 0.5) * 0.2; // Random factor

        // Cap between 10% and 90%
        successChance = Math.max(0.1, Math.min(0.9, successChance));

        const isSuccess = Math.random() < successChance;

        if (!isSuccess) {
            // Operation failed - potential spy loss
            if (Math.random() < 0.3 && attackerNation.militaryUnits.spies > 0) {
                attackerNation.militaryUnits.spies--;
                const spyUnit = war?.sides[this.getAttackerSide(war, attackerNation.id)]?.militaryUnitEntities?.get('spies');
                if (spyUnit && spyUnit.quantity > 0) {
                    spyUnit.quantity--;
                }
                return {
                    success: false,
                    message: 'Operation failed - spy captured',
                    spyLost: true
                };
            }
            return {
                success: false,
                message: 'Operation failed - no additional consequences'
            };
        }

        // Operation succeeded - execute effects with randomized scaling
        const result = {
            success: true,
            message: '',
            data: {}
        };

        switch (operation) {
            case 'gatherIntel':
                result.message = 'Intelligence gathered successfully';
                result.data = {
                    population: targetNation.population,
                    militaryUnits: { ...targetNation.militaryUnits },
                    happiness: targetNation.happiness,
                    infra: targetNation.infra,
                    tech: targetNation.tech
                };
                break;

            case 'disruptHappiness':
                // Base 5% to 25% happiness disruption, min 2 points
                const happinessPercent = 0.05 + (Math.random() * 0.20);
                const baseHappiness = targetNation.happiness || 50;
                let happinessDamage = Math.floor(baseHappiness * happinessPercent);
                happinessDamage = Math.max(2, happinessDamage); // Minimum 2 points

                if (targetNation.temporaryEffects) {
                    targetNation.temporaryEffects.push({
                        type: 'happinessReduction',
                        amount: happinessDamage,
                        turnsRemaining: 24,
                        description: 'Sabotage and propaganda operations'
                    });
                }
                result.message = `Disrupted enemy happiness by ${happinessDamage} points (${Math.round(happinessPercent * 100)}% reduction)`;
                result.data.happinessDamage = happinessDamage;
                break;

            case 'targetInfra':
                // Base 5% to 15% infra damage, min 1 point
                const infraPercent = 0.05 + (Math.random() * 0.10);
                const currentInfra = targetNation.infra || 0;
                let infraDamage = Math.floor(currentInfra * infraPercent);
                infraDamage = Math.max(1, infraDamage); // Minimum 1 point

                targetNation.infra = Math.max(0, currentInfra - infraDamage);
                result.message = `Sabotaged enemy infrastructure: ${infraDamage} points destroyed (${Math.round(infraPercent * 100)}% damage)`;
                result.data.infraDamage = infraDamage;
                break;

            case 'targetTech':
                // Base 5% to 20% tech disruption, min 5 points
                const techPercent = 0.05 + (Math.random() * 0.15);
                const currentTech = targetNation.tech || 0;
                let techDamage = Math.floor(currentTech * techPercent);
                techDamage = Math.max(5, techDamage); // Minimum 5 points

                targetNation.tech = Math.max(0, currentTech - techDamage);
                result.message = `Disrupted enemy research: ${techDamage} tech points lost (${Math.round(techPercent * 100)}% reduction)`;
                result.data.techDamage = techDamage;
                break;

            case 'targetSoldiers':
                this.applyUnitCasualty(targetNation, attackerNation, 'soldiers', 0.10, 0.20, 10, result, 'Eliminated', 'soldiers', war);
                break;

            case 'targetTanks':
                this.applyUnitCasualty(targetNation, attackerNation, 'tanks', 0.08, 0.25, 3, result, 'Sabotaged', 'tanks', war);
                break;

            case 'targetAircraft':
                this.applyUnitCasualty(targetNation, attackerNation, 'aircraft', 0.10, 0.35, 2, result, 'Destroyed', 'aircraft', war);
                break;

            case 'targetShips':
                this.applyUnitCasualty(targetNation, attackerNation, 'ships', 0.12, 0.40, 1, result, 'Sunk', 'ships', war);
                break;

            case 'targetMissiles':
                this.applyUnitCasualty(targetNation, attackerNation, 'missiles', 0.15, 0.45, 1, result, 'Destroyed', 'missiles', war);
                break;

            case 'targetNukes':
                this.applyUnitCasualty(targetNation, attackerNation, 'nukes', 0.20, 0.45, 1, result, 'Sabotaged', 'nukes', war);
                break;

            case 'assassinateSpies':
                this.applyUnitCasualty(targetNation, attackerNation, 'spies', 0.25, 0.45, 1, result, 'Eliminated', 'spies', war);
                break;

            default:
                result.success = false;
                result.message = 'Unknown operation type';
                break;
        }

        return result;
    }

    /**
     * Apply unit casualties to target nation via MilitaryUnit entity and Population System
     */
    applyUnitCasualty(targetNation, attackerNation, unitType, minPercent, maxPercent, minUnits, result, verb, statKey, war = null) {
        const percent = minPercent + (Math.random() * (maxPercent - minPercent));
        const currentUnits = targetNation.militaryUnits[unitType] || 0;
        let unitLoss = Math.floor(currentUnits * percent);
        unitLoss = Math.max(minUnits, unitLoss); // Minimum units
        unitLoss = Math.min(unitLoss, currentUnits); // Can't exceed available

        // Update MilitaryUnit entity (truth source for units) if war context is available
        // takeCasualties() also updates Nation.militaryUnits and Nation.militaryStrength
        if (war && window.MilitaryUnit) {
            const attackerSide = this.getAttackerSide(war, targetNation.id);
            if (attackerSide) {
                const unitEntity = war.sides[attackerSide]?.militaryUnitEntities?.get(unitType);
                if (unitEntity) {
                    unitEntity.takeCasualties(unitLoss);
                }
            }
        } else {
            // No war context: update nation's mirror count directly
            targetNation.militaryUnits[unitType] = Math.max(0, currentUnits - unitLoss);
            if (targetNation.updateMilitaryStrength) {
                targetNation.updateMilitaryStrength();
            }
        }

        // Record combat deaths in Population System (truth source for population)
        if (window.PopulationSystem && unitLoss > 0) {
            window.PopulationSystem.recordMilitaryCombatDeaths(unitLoss);
        }

        // Track units killed by attacker (spy operation)
        if (war) {
            const attackerSide = this.getAttackerSide(war, attackerNation.id);
            if (attackerSide) {
                const attackerStats = war.participantStats.get(attackerNation.id);
                if (attackerStats) {
                    if (!attackerStats.unitsKilled[unitType]) {
                        attackerStats.unitsKilled[unitType] = 0;
                    }
                    attackerStats.unitsKilled[unitType] += unitLoss;
                }
            }
        }

        result.message = `${verb} ${unitLoss} enemy ${unitType} (${Math.round(percent * 100)}% of forces)`;
        result.data[statKey + 'Loss'] = unitLoss;
    }

    /**
     * Execute Deploy Virus spy operation
     * Complex formula based on spy operation success rate, attacking spies, and defending spies
     */
    executeDeployVirus(attackerNation, targetNation, attackerPlayer, war = null) {
        const offensiveSpies = attackerNation.militaryUnits?.spies || 0;
        const defensiveSpies = targetNation.militaryUnits?.spies || 0;

        const aimSkill = attackerPlayer.getSkillValue('aim') || 0;
        const luckSkill = attackerPlayer.getSkillValue('luck') || 0;

        // Complex success rate formula:
        // Base: 30%
        // + Spy advantage: (offensiveSpies - defensiveSpies) * 0.5% (capped at 40%)
        // + Aim skill: aim * 0.2% (capped at 20%)
        // + Luck skill: luck * 0.1% (capped at 10%)
        // - Defense penalty: defensiveSpies * 0.4% (capped at 30%)
        // + Random factor: ±10%
        // Max: 100%, Min: 5%

        let successRate = this.VIRUS_BASE_INFECTION_RATE; // 10%

        // Spy advantage bonus
        const spyAdvantage = Math.min(0.40, (offensiveSpies - defensiveSpies) * this.VIRUS_SPY_BONUS_PER_SPY);
        successRate += spyAdvantage;

        // Aim skill bonus
        const aimBonus = Math.min(0.20, aimSkill * 0.002);
        successRate += aimBonus;

        // Luck skill bonus
        const luckBonus = Math.min(0.10, luckSkill * 0.001);
        successRate += luckBonus;

        // Defense penalty from defending spies
        const defensePenalty = Math.min(0.30, defensiveSpies * this.VIRUS_DEFENSE_PENALTY_PER_DEF_SPY);
        successRate -= defensePenalty;

        // Random factor
        successRate += (Math.random() - 0.5) * 0.20; // ±10%

        // Cap at 100% max, 5% min
        successRate = Math.max(0.05, Math.min(this.VIRUS_MAX_INFECTION_RATE, successRate));

        const isSuccess = Math.random() < successRate;

        if (!isSuccess) {
            // Operation failed - potential spy loss
            if (Math.random() < 0.3 && attackerNation.militaryUnits.spies > 0) {
                attackerNation.militaryUnits.spies--;
                const spyUnit = war?.sides[this.getAttackerSide(war, attackerNation.id)]?.militaryUnitEntities?.get('spies');
                if (spyUnit && spyUnit.quantity > 0) {
                    spyUnit.quantity--;
                }
                return {
                    success: false,
                    message: 'Virus deployment failed - spy captured',
                    spyLost: true,
                    successRate: Math.round(successRate * 100)
                };
            }
            return {
                success: false,
                message: 'Virus deployment failed - virus neutralized',
                successRate: Math.round(successRate * 100)
            };
        }

        // Virus successfully deployed - spawn Minor Disease on defending nation next turn
        const diseaseDuration = Math.floor(
            this.VIRUS_MIN_DISEASE_DURATION +
            Math.random() * (this.VIRUS_MAX_DISEASE_DURATION - this.VIRUS_MIN_DISEASE_DURATION + 1)
        );

        if (targetNation.temporaryEffects) {
            targetNation.temporaryEffects.push({
                type: 'minor_disease',
                amount: 0, // disease severity is tracked by disease system
                turnsRemaining: diseaseDuration,
                description: `Minor Disease outbreak (${diseaseDuration} days) - deployed by enemy spy`,
                source: 'deployVirus',
                sourceNation: attackerNation.id
            });
        }

        // Also apply happiness penalty from disease fear
        const happinessPenalty = Math.floor(5 + Math.random() * 10); // 5-15 points
        if (targetNation.temporaryEffects) {
            targetNation.temporaryEffects.push({
                type: 'happinessReduction',
                amount: happinessPenalty,
                turnsRemaining: diseaseDuration,
                description: 'Disease outbreak fear - public panic'
            });
        }

        return {
            success: true,
            message: `Minor Disease deployed to ${targetNation.name} (${diseaseDuration} day outbreak)`,
            diseaseSpawned: true,
            diseaseDuration: diseaseDuration,
            happinessPenalty: happinessPenalty,
            successRate: Math.round(successRate * 100),
            data: {
                diseaseType: 'minor_disease',
                duration: diseaseDuration
            }
        };
    }

    /**
     * Calculate base attack damage
     */
    calculateBaseDamage(attackerNation, attackerPlayer) {
        // Base attack from player skills
        let baseDamage = attackerPlayer.getSkillValue('attack') || 0;

        // Add military unit contributions using MilitaryUnit entities (truth source)
        const units = attackerNation.militaryUnits || {};
        const unitDamage = {
            soldiers: (units.soldiers || 0) * 1,
            tanks: (units.tanks || 0) * 25,
            aircraft: (units.aircraft || 0) * 100,
            ships: (units.ships || 0) * 200,
            missiles: (units.missiles || 0) * 500,
            nukes: (units.nukes || 0) * 2000
        };

        // Apply unit effectiveness bonuses from improvements
        if (attackerNation.improvementEffects) {
            const effects = attackerNation.improvementEffects;
            if (effects.soldierEffectiveness) {
                unitDamage.soldiers *= (1 + effects.soldierEffectiveness);
            }
            if (effects.tankEffectiveness) {
                unitDamage.tanks *= (1 + effects.tankEffectiveness);
            }
            if (effects.aircraftEffectiveness) {
                unitDamage.aircraft *= (1 + effects.aircraftEffectiveness);
            }
            if (effects.shipEffectiveness) {
                unitDamage.ships *= (1 + effects.shipEffectiveness);
            }
        }

        // Sum all unit damage
        const totalUnitDamage = Object.values(unitDamage).reduce((sum, damage) => sum + damage, 0);

        // Apply military morale
        let militaryMorale = 1.0;
        if (attackerNation.nationStats?.militaryMorale) {
            militaryMorale = attackerNation.nationStats.militaryMorale;
        }

        baseDamage = (baseDamage + totalUnitDamage) * militaryMorale;

        return Math.floor(baseDamage);
    }

    /**
     * Roll for critical hit based on player's critical chance
     */
    rollCriticalHit(player) {
        const critChance = player.getSkillValue('criticalChance') || 0;
        const luck = player.getSkillValue('luck') || 0;

        // Convert to percentage (0-1)
        const totalChance = Math.min(0.95, critChance + luck * 0.1);

        return Math.random() < totalChance;
    }

    /**
     * Calculate critical damage
     */
    calculateCriticalDamage(baseDamage, player) {
        const critDamagePercent = player.getSkillValue('criticalDamage') || 0;

        // Critical damage bonus = percentage of base damage
        return Math.floor(baseDamage * critDamagePercent);
    }

    /**
     * Apply all attack bonuses (diplomatic, friend/foe, treaties, etc.)
     */
    applyAttackBonuses(damage, attackerNation, attackerPlayer, war, warSide) {
        let bonusMultiplier = 1.0;

        // Apply diplomatic combat bonuses
        if (window.ImprovementsSystem) {
            const warParticipants = [
                ...war.sides.attacker.nations,
                ...war.sides.defender.nations
            ];
            const diplomaticBonus = window.ImprovementsSystem.calculateDiplomaticCombatBonus(
                attackerNation, null, warParticipants
            );
            bonusMultiplier += diplomaticBonus;
        }

        // Apply treaty damage bonuses
        const treatyBonus = this.calculateTreatyDamageBonus(attackerNation, war, warSide);
        bonusMultiplier *= treatyBonus;

        // Apply aim bonus for hit accuracy (affects damage)
        const aimBonus = (attackerPlayer.getSkillValue('aim') || 0);
        bonusMultiplier += aimBonus * 0.1; // 10% of aim value as damage bonus

        // Apply luck bonus
        const luckBonus = (attackerPlayer.getSkillValue('luck') || 0);
        bonusMultiplier += luckBonus * 0.05; // 5% of luck value as damage bonus

        // Apply Friend/Foe/BestFriend/Nemesis relationship bonuses
        const relationshipBonus = this.calculateRelationshipDamageBonus(attackerNation.id, war, warSide);
        bonusMultiplier += relationshipBonus;

        return Math.floor(damage * bonusMultiplier);
    }

    /**
     * Calculate relationship-based damage bonus for attacker.
     * Friend: +5% when fighting on same side as friend
     * Best Friend: +10% when fighting on same side as best friend
     * Foe: +5% when attacking a foe
     * Nemesis: +10% when attacking a nemesis
     */
    calculateRelationshipDamageBonus(attackerNationId, war, attackerSide) {
        let relationshipBonus = 0;
        const opposingSide = attackerSide === 'attacker' ? 'defender' : 'attacker';

        // Get DiplomacySystem for relationship lookups
        const diplomacySystem = window.DiplomacySystem;
        if (!diplomacySystem) return 0;

        // Check same-side friends/bestFriends (fighting alongside them)
        war.sides[attackerSide].nations.forEach(nationId => {
            if (nationId === attackerNationId) return;
            const rel = diplomacySystem.getRelationship(attackerNationId, nationId);
            if (rel === 'bestFriend') {
                relationshipBonus += 0.10; // +10%
            } else if (rel === 'friend') {
                relationshipBonus += 0.05; // +5%
            }
        });

        // Check opposing-side foes/nemesis (fighting against them)
        war.sides[opposingSide].nations.forEach(nationId => {
            const rel = diplomacySystem.getRelationship(attackerNationId, nationId);
            if (rel === 'nemesis') {
                relationshipBonus += 0.10; // +10%
            } else if (rel === 'foe') {
                relationshipBonus += 0.05; // +5%
            }
        });

        return relationshipBonus;
    }

    /**
     * Track relationship combat stats for leaderboards.
     * Call after each attack execution.
     */
    trackRelationshipCombat(attackerNationId, war, attackerSide) {
        const diplomacySystem = window.DiplomacySystem;
        if (!diplomacySystem) return;

        const opposingSide = attackerSide === 'attacker' ? 'defender' : 'attacker';

        // Initialize tracking for attacker if needed
        if (!this.relationshipCombatStats.has(attackerNationId)) {
            this.relationshipCombatStats.set(attackerNationId, {
                sameSideFriends: new Map(),
                vsFoes: new Map()
            });
        }
        const stats = this.relationshipCombatStats.get(attackerNationId);

        // Track same-side friends/bestFriends
        war.sides[attackerSide].nations.forEach(nationId => {
            if (nationId === attackerNationId) return;
            const rel = diplomacySystem.getRelationship(attackerNationId, nationId);
            if (rel === 'friend' || rel === 'bestFriend') {
                const count = stats.sameSideFriends.get(nationId) || 0;
                stats.sameSideFriends.set(nationId, count + 1);
            }
        });

        // Track vs foes/nemesis on opposing side
        war.sides[opposingSide].nations.forEach(nationId => {
            const rel = diplomacySystem.getRelationship(attackerNationId, nationId);
            if (rel === 'foe' || rel === 'nemesis') {
                const count = stats.vsFoes.get(nationId) || 0;
                stats.vsFoes.set(nationId, count + 1);
            }
        });
    }

    /**
     * Get relationship combat stats for a nation (for leaderboards)
     */
    getRelationshipCombatStats(nationId) {
        return this.relationshipCombatStats.get(nationId) || {
            sameSideFriends: new Map(),
            vsFoes: new Map()
        };
    }

    /**
     * Get all relationship combat stats for leaderboard display
     */
    getAllRelationshipCombatStats() {
        const allStats = {};
        this.relationshipCombatStats.forEach((stats, nationId) => {
            allStats[nationId] = {
                sameSideFriendCount: Array.from(stats.sameSideFriends.entries()).reduce((sum, [, c]) => sum + c, 0),
                vsFoeCount: Array.from(stats.vsFoes.entries()).reduce((sum, [, c]) => sum + c, 0),
                sameSideFriends: Object.fromEntries(stats.sameSideFriends),
                vsFoes: Object.fromEntries(stats.vsFoes)
            };
        });
        return allStats;
    }

    /**
     * Process defense for a defending nation
     */
    processDefense(defenderNationId, incomingDamage, war) {
        const defenderNation = this.getNationById(defenderNationId);
        const defenderPlayer = this.getPlayerByNationId(defenderNationId);

        if (!defenderNation || !defenderPlayer) {
            return { damage: incomingDamage, counterDamage: 0 };
        }

        let finalDamage = incomingDamage;
        let counterDamage = 0;

        // Check for parry (complete negation)
        const parryChance = (defenderPlayer.getSkillValue('parry') || 0);
        const luck = (defenderPlayer.getSkillValue('luck') || 0);
        const parryRoll = Math.random();

        if (parryRoll < (parryChance + luck * 0.2)) {
            // Successful parry - no damage taken
            finalDamage = 0;

            // Calculate parry counter-damage
            const defenseValue = defenderPlayer.getSkillValue('defense') || 0;
            counterDamage = defenseValue;

            // Check for critical parry
            const critChance = (defenderPlayer.getSkillValue('criticalChance') || 0);
            if (Math.random() < critChance) {
                const critDamagePercent = defenderPlayer.getSkillValue('criticalDamage') || 0;
                counterDamage += Math.floor(critDamagePercent);
            }

            // Update stats
            const stats = war.participantStats.get(defenderNationId);
            if (stats) {
                stats.parries++;
            }

        } else {
            // Check for block (damage reduction)
            const blockChance = 0.30 + luck * 0.1; // Base 30% + luck bonus
            const blockRoll = Math.random();

            if (blockRoll < blockChance) {
                const blockValue = defenderPlayer.getSkillValue('block') || 0;
                const defenseValue = defenderPlayer.getSkillValue('defense') || 0;

                const totalReduction = blockValue + defenseValue;
                finalDamage = Math.max(0, finalDamage - totalReduction);

                // Update stats
                const stats = war.participantStats.get(defenderNationId);
                if (stats) {
                    stats.blocks++;
                }
            } else {
                // No block, just apply defense
                const defenseValue = defenderPlayer.getSkillValue('defense') || 0;
                finalDamage = Math.max(0, finalDamage - defenseValue);
            }
        }

        return {
            damage: Math.floor(finalDamage),
            counterDamage: Math.floor(counterDamage)
        };
    }

    /**
     * Start a new war round
     */
    startWarRound(warId) {
        const war = this.activeWars.get(warId);
        if (!war) return;

        war.currentRound++;
        war.status = 'active';

        // Initialize round data
        const round = {
            number: war.currentRound,
            startTime: Date.now(),
            endTime: Date.now() + (this.ROUND_DURATION_HOURS * 60 * 60 * 1000),
            damage: {
                attacker: 0,
                defender: 0
            },
            winner: null,
            attacks: []
        };

        war.rounds.push(round);

        // Schedule round end
        const roundEndTimeout = setTimeout(() => {
            this.endWarRound(warId);
            this.roundTimeouts.delete(warId);
        }, this.ROUND_DURATION_HOURS * 60 * 60 * 1000);
        this.roundTimeouts.set(warId, roundEndTimeout);

        this.safeEmit('war_round_started', {
            warId: warId,
            round: round,
            war: war
        });

        console.log(`War ${warId} Round ${war.currentRound} started`);
    }

    /**
     * Process round timer event - ends the current war round
     */
    processRoundEnd(data) {
        const warId = data && data.warId ? data.warId : null;
        if (!warId) {
            console.error('processRoundEnd called without warId');
            return;
        }
        this.endWarRound(warId);
    }

    /**
     * End current war round and determine winner
     */
    endWarRound(warId) {
        const war = this.activeWars.get(warId);
        if (!war || war.currentRound === 0) return;

        const currentRound = war.rounds[war.currentRound - 1];

        // Determine round winner
        if (currentRound.damage.attacker > currentRound.damage.defender) {
            currentRound.winner = 'attacker';
            war.sides.attacker.roundsWon++;
        } else if (currentRound.damage.defender > currentRound.damage.attacker) {
            currentRound.winner = 'defender';
            war.sides.defender.roundsWon++;
        } else {
            currentRound.winner = 'draw';
        }

        console.log(`War ${warId} Round ${war.currentRound} ended. Winner: ${currentRound.winner}`);

        // Process unit casualties via MilitaryUnit entities and Population System
        this.processUnitCasualties(war, currentRound);

        // Check if war is over (best of 3)
        if (war.sides.attacker.roundsWon >= 2 || war.sides.defender.roundsWon >= 2 || war.currentRound >= 3) {
            this.endWar(warId);
        } else {
            // Start next round after a brief pause
            const nextRoundTimeout = setTimeout(() => {
                this.startWarRound(warId);
                this.roundTimeouts.delete(warId);
            }, 60000); // 1 minute break between rounds
            this.roundTimeouts.set(warId, nextRoundTimeout);
        }

        this.safeEmit('war_round_ended', {
            warId: warId,
            round: currentRound,
            war: war
        });
    }

    /**
     * Process unit casualties based on war damage
     */
    processUnitCasualties(war, round) {
        // Calculate casualty percentage based on damage ratio
        const totalDamage = round.damage.attacker + round.damage.defender;
        if (totalDamage === 0) return;

        // Process attacker casualties - per-nation based on damage received
        war.sides.attacker.nations.forEach(nationId => {
            const nation = this.getNationById(nationId);
            if (!nation || !nation.militaryUnits) return;
            const stats = war.participantStats.get(nationId);
            const damageReceived = stats ? stats.damageReceived : 0;
            const casualtyPercent = Math.min(0.25, damageReceived / totalDamage * 0.5);
            this.applyCasualtiesToNation(war, nationId, casualtyPercent);
        });

        // Process defender casualties - per-nation based on damage received
        war.sides.defender.nations.forEach(nationId => {
            const nation = this.getNationById(nationId);
            if (!nation || !nation.militaryUnits) return;
            const stats = war.participantStats.get(nationId);
            const damageReceived = stats ? stats.damageReceived : 0;
            const casualtyPercent = Math.min(0.25, damageReceived / totalDamage * 0.5);
            this.applyCasualtiesToNation(war, nationId, casualtyPercent);
        });
    }

    /**
     * Apply casualties to a single nation via MilitaryUnit entity and Population System
     */
    applyCasualtiesToNation(war, nationId, casualtyPercent) {
        const nation = this.getNationById(nationId);
        if (!nation || !nation.militaryUnits) return;

        const unitTypes = ['soldiers', 'tanks', 'aircraft', 'ships', 'missiles', 'nukes'];
        const sideKey = this.getAttackerSide(war, nationId) || 'attacker';
        const side = war.sides[sideKey];

        unitTypes.forEach(unitType => {
            const currentUnits = nation.militaryUnits[unitType] || 0;
            if (currentUnits === 0) return;

            const casualties = Math.floor(currentUnits * casualtyPercent);
            if (casualties > 0) {
                // Apply soldier loss reduction from Military Recovery wonder
                let actualCasualties = casualties;
                if (unitType === 'soldiers' && nation.wonderEffects?.soldierLossReduction) {
                    actualCasualties = Math.floor(casualties * (1 - nation.wonderEffects.soldierLossReduction));
                    console.log(`Soldier casualties reduced from ${casualties} to ${actualCasualties} by Military Recovery wonder`);
                }

                // Update MilitaryUnit entity (truth source for units)
                const unitEntity = side?.militaryUnitEntities?.get(unitType);
                if (unitEntity) {
                    unitEntity.takeCasualties(actualCasualties);
                }

                // Record combat deaths in Population System (truth source for population)
                if (window.PopulationSystem && actualCasualties > 0) {
                    window.PopulationSystem.recordMilitaryCombatDeaths(actualCasualties, unitType);
                }

                // Update war statistics
                const stats = war.participantStats.get(nationId);
                if (stats) {
                    if (!stats.unitsLost[unitType]) {
                        stats.unitsLost[unitType] = 0;
                    }
                    stats.unitsLost[unitType] += actualCasualties;
                }

                // Update side unit summary to reflect casualties
                if (side && side.units) {
                    side.units[unitType] = Math.max(0, (side.units[unitType] || 0) - actualCasualties);
                }

                // Process resource recovery for destroyed tanks, aircraft, and ships
                if (['tanks', 'aircraft', 'ships'].includes(unitType)) {
                    this.processResourceRecovery(nation, unitType, actualCasualties);
                }
            }
        });

        // Update military strength after casualties
        if (nation.updateMilitaryStrength) {
            nation.updateMilitaryStrength();
        }
    }

    /**
     * Apply casualties to a war side via MilitaryUnit entities and Population System
     */
    applyCasualties(war, side, casualtyPercent) {
        const unitTypes = ['soldiers', 'tanks', 'aircraft', 'ships', 'missiles', 'nukes'];

        side.nations.forEach(nationId => {
            const nation = this.getNationById(nationId);
            if (!nation || !nation.militaryUnits) return;

            unitTypes.forEach(unitType => {
                const currentUnits = nation.militaryUnits[unitType] || 0;
                if (currentUnits === 0) return;

                const casualties = Math.floor(currentUnits * casualtyPercent);
                if (casualties > 0) {
                    // Apply soldier loss reduction from Military Recovery wonder
                    let actualCasualties = casualties;
                    if (unitType === 'soldiers' && nation.wonderEffects?.soldierLossReduction) {
                        actualCasualties = Math.floor(casualties * (1 - nation.wonderEffects.soldierLossReduction));
                        console.log(`Soldier casualties reduced from ${casualties} to ${actualCasualties} by Military Recovery wonder`);
                    }

                    // Update MilitaryUnit entity (truth source for units)
                    const sideKey = side === war.sides.attacker ? 'attacker' : 'defender';
                    const unitEntity = war.sides[sideKey]?.militaryUnitEntities?.get(unitType);
                    if (unitEntity) {
                        unitEntity.takeCasualties(actualCasualties);
                    }

                    // Record combat deaths in Population System (truth source for population)
                    if (window.PopulationSystem && actualCasualties > 0) {
                        window.PopulationSystem.recordMilitaryCombatDeaths(actualCasualties);
                    }

                    // Track units killed by the opposing side (whoever is applying these casualties)
                    const opposingSide = side === war.sides.attacker ? 'defender' : 'attacker';
                    opposingSide.nations.forEach(opposingNationId => {
                        const opposingStats = war.participantStats.get(opposingNationId);
                        if (opposingStats) {
                            if (!opposingStats.unitsKilled[unitType]) {
                                opposingStats.unitsKilled[unitType] = 0;
                            }
                            opposingStats.unitsKilled[unitType] += actualCasualties;
                        }
                    });

                    // Process resource recovery for destroyed tanks, aircraft, and ships
                    if (['tanks', 'aircraft', 'ships'].includes(unitType)) {
                        this.processResourceRecovery(nation, unitType, actualCasualties);
                    }

                    // Update war statistics
                    const stats = war.participantStats.get(nationId);
                    if (stats) {
                        if (!stats.unitsLost[unitType]) {
                            stats.unitsLost[unitType] = 0;
                        }
                        stats.unitsLost[unitType] += actualCasualties;
                    }

                    // Update side unit summary to reflect casualties (prevent drift)
                    if (side.units) {
                        side.units[unitType] = Math.max(0, (side.units[unitType] || 0) - actualCasualties);
                    }
                }
            });

            // Update military strength after casualties
            if (nation.updateMilitaryStrength) {
                nation.updateMilitaryStrength();
            }
        });
    }

    /**
     * Process resource recovery from destroyed military units
     */
    processResourceRecovery(nation, unitType, destroyedCount) {
        // Check if nation has Military Salvage projects
        const salvageProjects = nation.projects?.militarySalvage || 0;
        if (salvageProjects === 0) return;

        // Base recovery rate from Military Salvage projects (9% per project)
        let recoveryRate = nation.projectEffects?.militarySalvageRate || 0;

        // Check if Military Recovery wonder doubles the rate
        if (nation.wonderEffects?.militaryRecoveryEnabled && nation.wonderEffects?.enhancedSalvageRate) {
            recoveryRate = nation.wonderEffects.enhancedSalvageRate;
        }

        if (recoveryRate === 0) return;

        // Resources removed - money-only economy, no resource recovery
        return;
    }

    /**
     * End war and determine overall winner
     */
    endWar(warId) {
        const war = this.activeWars.get(warId);
        if (!war) return;

        war.status = 'ended';
        war.endTime = Date.now();

        // Determine war winner
        let warWinner = null;
        if (war.sides.attacker.roundsWon > war.sides.defender.roundsWon) {
            warWinner = 'attacker';
        } else if (war.sides.defender.roundsWon > war.sides.attacker.roundsWon) {
            warWinner = 'defender';
        } else {
            warWinner = 'draw';
        }

        war.winner = warWinner;

        // Enforce treaty obligations - apply penalties for unfulfilled obligations
        this.enforceTreatyObligations(war);

        // Calculate war reparations using WarTermsSystem formulas
        const cbId = war.casusBelliId || 'general_dispute';
        const wtId = war.warType || 'nation';
        const reparations = this.calculateWarReparations(war, warWinner, cbId, wtId);

        // Process war rewards and penalties (reparations already applied via peace terms or here)
        this.processWarOutcome(war, reparations);

        // Archive war to historicalWars (permanent record)
        this.archiveWar(war);

        // Clear round timeout for this war
        if (this.roundTimeouts.has(warId)) {
            clearTimeout(this.roundTimeouts.get(warId));
            this.roundTimeouts.delete(warId);
        }

        // Remove war from active wars after a delay (for viewing results)
        const cleanupTimeout = setTimeout(() => {
            this.activeWars.delete(warId);
            this.roundTimeouts.delete(warId);
        }, 24 * 60 * 60 * 1000); // Keep for 24 hours
        this.roundTimeouts.set(warId + '_cleanup', cleanupTimeout);

        this.safeEmit('war_ended', {
            warId: warId,
            war: war,
            winner: warWinner,
            reparations: reparations
        });

        console.log(`War ${warId} ended. Winner: ${warWinner}`);
    }

    /**
     * Enforce treaty obligations at war end - apply penalties for unfulfilled obligations.
     * Penalties: relationship damage with treaty partner, cash penalty based on treaty type.
     */
    enforceTreatyObligations(war) {
        const diplomacySystem = window.DiplomacySystem;
        if (!diplomacySystem) return;

        war.treatyObligations.forEach((obligation, obligatedAllianceId) => {
            if (obligation.fulfilled) return;

            const obligationAlliance = this.getAllianceById(obligatedAllianceId);
            if (!obligationAlliance) return;

            // Determine which side the obligated alliance was on
            const obligatedSide = obligation.side; // 'attacker' or 'defender'

            // Get all nations from the obligated alliance that were in the war
            const allianceNationsInWar = war.sides[obligatedSide]?.nations.filter(nationId => {
                const nation = this.getNationById(nationId);
                return nation && nation.allianceId === obligatedAllianceId;
            }) || [];

            // Apply penalty to each member nation of the obligated alliance
            allianceNationsInWar.forEach(nationId => {
                const nation = this.getNationById(nationId);
                const player = this.getPlayerByNationId(nationId);
                if (!nation || !player) return;

                // Cash penalty based on treaty type
                let cashPenalty = 0;
                switch (obligation.type) {
                    case 'protectorate':
                    case 'extension':
                        cashPenalty = 500000; // $500K
                        break;
                    case 'mutual_defense':
                    case 'mutual_aggression':
                        cashPenalty = 250000; // $250K
                        break;
                    case 'optional_defense':
                    case 'optional_aggression':
                        cashPenalty = 100000; // $100K
                        break;
                    default:
                        cashPenalty = 50000; // $50K default
                        break;
                }

                if (cashPenalty > 0 && nation.money !== undefined) {
                    nation.money = Math.max(0, (nation.money || 0) - cashPenalty);
                }

                // Happiness penalty for failing treaty obligation
                if (nation.temporaryEffects) {
                    nation.temporaryEffects.push({
                        type: 'happinessReduction',
                        amount: 10,
                        turnsRemaining: 72, // 3 days
                        description: `Failed treaty obligation: ${obligation.type}`
                    });
                }

            // Damage relationship with treaty partner alliance members
            const partnerAllianceId = obligation.partnerAllianceId;
            const partnerAlliance = this.getAllianceById(partnerAllianceId);
            if (partnerAlliance && partnerAlliance.members) {
                partnerAlliance.members.forEach(partnerNationId => {
                    if (partnerNationId === nationId) return;
                    // Damage relationship: friend -> neutral, foe/nemesis stays
                    const diplomacy = diplomacySystem?.nationDiplomacy?.get(nationId);
                    if (diplomacy && diplomacy.relationships) {
                        const rel = diplomacySystem.getRelationship(nationId, partnerNationId);
                        if (rel === 'friend') {
                            const idx = diplomacy.relationships.friends.indexOf(partnerNationId);
                            if (idx >= 0) diplomacy.relationships.friends.splice(idx, 1);
                        } else if (rel === 'bestFriend') {
                            diplomacy.relationships.bestFriend = null;
                        }
                    }
                });
            }

                console.log(`Treaty obligation penalty applied to ${nation.name}: -$${cashPenalty} for unfulfilled ${obligation.type}`);
            });
        });
    }

    /**
     * Calculate war reparations using WarTermsSystem formulas
     * Based on damage dealt, casus belli, and war type modifiers
     */
    calculateWarReparations(war, warWinner, casusBelliId, warTypeId) {
        if (!warWinner || warWinner === 'draw') return null;

        const winners = war.sides[warWinner].nations;
        const losers = war.sides[warWinner === 'attacker' ? 'defender' : 'attacker'].nations;

        // Calculate total damage dealt by winners and damage received by losers
        let totalWinnerDamage = 0;
        let totalLoserInfraLost = 0;
        let totalLoserUnitsLost = 0;

        losers.forEach(loserId => {
            const loserStats = war.participantStats.get(loserId);
            if (loserStats) {
                totalLoserInfraLost += loserStats.infraReceived || 0;
                Object.values(loserStats.unitsLost || {}).forEach(count => {
                    totalLoserUnitsLost += count;
                });
            }
        });

        winners.forEach(winnerId => {
            const winnerStats = war.participantStats.get(winnerId);
            if (winnerStats) {
                totalWinnerDamage += winnerStats.damage || 0;
            }
        });

        // Use WarTermsSystem for cash reparation calculation
        const cashReparation = this.warTermsSystem.calculateCashReparations(
            totalWinnerDamage,
            casusBelliId,
            warTypeId
        );

        // Build reparations object
        const reparations = {
            warWinner: warWinner,
            winnerNations: winners,
            loserNations: losers,
            totalReparationAmount: cashReparation,
            perWinner: {},
            perLoser: {},
            casusBelliId: casusBelliId,
            warTypeId: warTypeId
        };

        // Split among winners proportionally to damage dealt
        winners.forEach(winnerId => {
            const winnerStats = war.participantStats.get(winnerId);
            const winnerDamage = winnerStats ? winnerStats.damage : 0;
            const winnerShare = totalWinnerDamage > 0
                ? Math.floor(cashReparation * (winnerDamage / totalWinnerDamage))
                : 0;

            reparations.perWinner[winnerId] = {
                damageDealt: winnerDamage,
                reparationAmount: winnerShare
            };
        });

        // Split among losers proportionally to damage received
        losers.forEach(loserId => {
            const loserStats = war.participantStats.get(loserId);
            const loserDamage = loserStats ? loserStats.damageReceived : 0;
            const loserShare = totalLoserUnitsLost > 0
                ? Math.floor(cashReparation * (loserDamage / totalLoserUnitsLost))
                : 0;

            reparations.perLoser[loserId] = {
                damageReceived: loserDamage,
                reparationAmount: loserShare
            };
        });

        return reparations;
    }

    /**
     * Archive a completed war to historicalWars for permanent record
     */
    archiveWar(war) {
        const archiveEntry = {
            id: war.id,
            warType: war.warType,
            solo: war.solo,
            reason: war.reason,
            startTime: war.startTime,
            endTime: war.endTime,
            status: war.status,
            winner: war.winner,
            originalAttacker: war.originalAttacker,
            originalDefender: war.originalDefender,
            rounds: war.rounds,
            totalAttacks: war.totalAttacks,
            sides: {
                attacker: {
                    nations: [...war.sides.attacker.nations],
                    alliances: Array.from(war.sides.attacker.alliances),
                    totalDamage: war.sides.attacker.totalDamage,
                    totalDamageReceived: war.sides.attacker.totalDamageReceived || 0,
                    totalLootGained: war.sides.attacker.totalLootGained || 0,
                    totalLootLost: war.sides.attacker.totalLootLost || 0,
                    roundsWon: war.sides.attacker.roundsWon,
                    damageRankings: Array.from(war.sides.attacker.damageRankings.entries()),
                    damageReceivedRankings: Array.from(war.sides.attacker.damageReceivedRankings.entries()),
                    allianceRankings: Array.from(war.sides.attacker.allianceRankings.entries()),
                    missilesFired: war.sides.attacker.missilesFired,
                    nukesFired: war.sides.attacker.nukesFired,
                    spyOperations: Array.from(war.sides.attacker.spyOperations.entries())
                },
                defender: {
                    nations: [...war.sides.defender.nations],
                    alliances: Array.from(war.sides.defender.alliances),
                    totalDamage: war.sides.defender.totalDamage,
                    totalDamageReceived: war.sides.defender.totalDamageReceived || 0,
                    totalLootGained: war.sides.defender.totalLootGained || 0,
                    totalLootLost: war.sides.defender.totalLootLost || 0,
                    roundsWon: war.sides.defender.roundsWon,
                    damageRankings: Array.from(war.sides.defender.damageRankings.entries()),
                    damageReceivedRankings: Array.from(war.sides.defender.damageReceivedRankings.entries()),
                    allianceRankings: Array.from(war.sides.defender.allianceRankings.entries()),
                    missilesFired: war.sides.defender.missilesFired,
                    nukesFired: war.sides.defender.nukesFired,
                    spyOperations: Array.from(war.sides.defender.spyOperations.entries())
                }
            },
            participantStats: {},
            treatyObligations: Array.from(war.treatyObligations.entries())
        };

        // Copy participant stats (convert Maps to plain objects)
        war.participantStats.forEach((stats, nationId) => {
            archiveEntry.participantStats[nationId] = {
                attacks: stats.attacks,
                damage: stats.damage,
                damageReceived: stats.damageReceived,
                criticalHits: stats.criticalHits,
                blocks: stats.blocks,
                parries: stats.parries,
                unitsLost: { ...stats.unitsLost },
                unitsKilled: { ...stats.unitsKilled },
                infraDestroyed: stats.infraDestroyed,
                infraReceived: stats.infraReceived,
                lootGained: stats.lootGained,
                lootLost: stats.lootLost
            };
        });

        this.historicalWars.set(war.id, archiveEntry);

        // Update cumulative nation war stats
        this.updateCumulativeNationWarStats(archiveEntry);
    }

    /**
     * Update cumulative per-nation war statistics from an archived war
     */
    updateCumulativeNationWarStats(archivedWar) {
        const allNationIds = [
            ...archivedWar.sides.attacker.nations,
            ...archivedWar.sides.defender.nations
        ];

        allNationIds.forEach(nationId => {
            if (!this.nationWarStats.has(nationId)) {
                this.nationWarStats.set(nationId, {
                    warsWon: 0,
                    warsLost: 0,
                    warsDraw: 0,
                    totalDamageDealt: 0,
                    totalDamageReceived: 0,
                    totalUnitsKilled: 0,
                    totalUnitsLost: 0,
                    totalInfraDestroyed: 0,
                    totalInfraReceived: 0,
                    totalLootGained: 0,
                    totalLootLost: 0,
                    totalAttacks: 0,
                    totalBattles: 0
                });
            }

            const nationStats = this.nationWarStats.get(nationId);
            const stats = archivedWar.participantStats[nationId];
            const isAttacker = archivedWar.sides.attacker.nations.includes(nationId);

            nationStats.totalBattles++;

            if (archivedWar.winner === 'draw') {
                nationStats.warsDraw++;
            } else if (
                (archivedWar.winner === 'attacker' && isAttacker) ||
                (archivedWar.winner === 'defender' && !isAttacker)
            ) {
                nationStats.warsWon++;
            } else {
                nationStats.warsLost++;
            }

            if (stats) {
                nationStats.totalDamageDealt += stats.damage || 0;
                nationStats.totalDamageReceived += stats.damageReceived || 0;
                nationStats.totalUnitsKilled += Object.values(stats.unitsKilled || {}).reduce((a, b) => a + b, 0);
                nationStats.totalUnitsLost += Object.values(stats.unitsLost || {}).reduce((a, b) => a + b, 0);
                nationStats.totalInfraDestroyed += stats.infraDestroyed || 0;
                nationStats.totalInfraReceived += stats.infraReceived || 0;
                nationStats.totalLootGained += stats.lootGained || 0;
                nationStats.totalLootLost += stats.lootLost || 0;
                nationStats.totalAttacks += stats.attacks || 0;
            }
        });
    }

    /**
     * Process war outcome rewards and penalties (with reparations)
     */
    processWarOutcome(war, reparations) {
        const winnerSide = war.winner;
        if (!winnerSide || winnerSide === 'draw') return;

        const winners = war.sides[winnerSide].nations;
        const losers = war.sides[winnerSide === 'attacker' ? 'defender' : 'attacker'].nations;

        // Process winners
        winners.forEach(nationId => {
            const nation = this.getNationById(nationId);
            const player = this.getPlayerByNationId(nationId);

            if (nation && player) {
                // Award experience for winning
                player._awardExperience(1000, 'War Victory');

                // Update statistics
                if (nation.statistics) {
                    nation.statistics.warsWon = (nation.statistics.warsWon || 0) + 1;
                }

                // Apply reparations loot
                if (reparations && reparations.perWinner[nationId]) {
                    const loot = reparations.perWinner[nationId].reparationAmount;
                    if (loot > 0) {
                        if (nation.currencyBalances) {
                            nation.currencyBalances.aurel = (nation.currencyBalances.aurel || 0) + loot;
                        } else {
                            nation.money = (nation.money || 0) + loot;
                        }
                        const stats = war.participantStats.get(nationId);
                        if (stats) {
                            stats.lootGained += loot;
                        }
                        war.sides[winnerSide].totalLootGained =
                            (war.sides[winnerSide].totalLootGained || 0) + loot;
                    }
                }

                // Happiness bonus for victory
                if (nation.temporaryEffects) {
                    nation.temporaryEffects.push({
                        type: 'happinessBonus',
                        amount: 5,
                        turnsRemaining: 72, // 3 days
                        description: 'Victory celebration'
                    });
                }
            }
        });

        // Process losers
        losers.forEach(nationId => {
            const nation = this.getNationById(nationId);
            const player = this.getPlayerByNationId(nationId);

            if (nation && player) {
                // Award lesser experience for participation
                player._awardExperience(250, 'War Participation');

                // Update statistics
                if (nation.statistics) {
                    nation.statistics.warsLost = (nation.statistics.warsLost || 0) + 1;
                }

                // Pay reparations
                if (reparations && reparations.perLoser[nationId]) {
                    const loot = reparations.perLoser[nationId].reparationAmount;
                    if (loot > 0) {
                        if (nation.currencyBalances) {
                            nation.currencyBalances.aurel = Math.max(0, (nation.currencyBalances.aurel || 0) - loot);
                        } else {
                            nation.money = Math.max(0, (nation.money || 0) - loot);
                        }
                        const stats = war.participantStats.get(nationId);
                        if (stats) {
                            stats.lootLost += loot;
                        }
                        const loserSide = winnerSide === 'attacker' ? 'defender' : 'attacker';
                        war.sides[loserSide].totalLootLost =
                            (war.sides[loserSide].totalLootLost || 0) + loot;
                    }
                }

                // Temporary happiness penalty
                if (nation.temporaryEffects) {
                    nation.temporaryEffects.push({
                        type: 'happinessReduction',
                        amount: 3,
                        turnsRemaining: 48, // 2 days
                        description: 'War defeat morale impact'
                    });
                }
            }
        });
    }

    /**
     * Sue for peace - initiate peace negotiations
     * Uses WarTermsSystem for casus belli compatibility validation
     */
    sueForPeace(warId, suingNationId, terms) {
        const war = this.activeWars.get(warId);
        if (!war) {
            throw new Error('War not found');
        }
        if (war.status !== 'active') {
            throw new Error('Cannot sue for peace in a non-active war');
        }

        const suingNation = this.getNationById(suingNationId);
        if (!suingNation) {
            throw new Error('Suing nation not found');
        }

        const suingSide = this.getAttackerSide(war, suingNationId);
        if (!suingSide) {
            throw new Error('Nation is not participating in this war');
        }

        // Validate peace terms via WarTermsSystem
        if (terms && terms.termTypeId) {
            const validation = this.warTermsSystem.validatePeaceTerm(
                war,
                suingNationId,
                terms.termTypeId,
                terms.termValue
            );
            if (!validation.valid) {
                throw new Error(validation.error);
            }
        }

        // Initialize peace negotiation if not exists
        if (!war.peaceNegotiation) {
            war.peaceNegotiation = {
                initiatedBy: suingNationId,
                initiatedAt: Date.now(),
                terms: terms || {},
                offeredBy: null,
                acceptedBy: null,
                rejectedBy: null,
                status: 'pending' // pending, offered, accepted, rejected, expired
            };
        } else {
            // Update existing negotiation
            war.peaceNegotiation.initiatedBy = suingNationId;
            war.peaceNegotiation.initiatedAt = Date.now();
            war.peaceNegotiation.terms = terms || {};
            war.peaceNegotiation.status = 'pending';
        }

        this.safeEmit('peace_sued', {
            warId: warId,
            suingNationId: suingNationId,
            suingNation: suingNation,
            terms: terms || {}
        });

        return {
            warId: warId,
            peaceNegotiation: war.peaceNegotiation
        };
    }

    /**
     * Offer peace terms - formal offer from one side to the other
     * Uses WarTermsSystem for validation
     */
    offerPeaceTerms(warId, offeringNationId, terms) {
        const war = this.activeWars.get(warId);
        if (!war) {
            throw new Error('War not found');
        }
        if (war.status !== 'active') {
            throw new Error('Cannot offer terms in a non-active war');
        }

        const offeringNation = this.getNationById(offeringNationId);
        if (!offeringNation) {
            throw new Error('Offering nation not found');
        }

        const offeringSide = this.getAttackerSide(war, offeringNationId);
        if (!offeringSide) {
            throw new Error('Nation is not participating in this war');
        }

        // Validate peace terms via WarTermsSystem
        if (terms && terms.termTypeId) {
            const validation = this.warTermsSystem.validatePeaceTerm(
                war,
                offeringNationId,
                terms.termTypeId,
                terms.termValue
            );
            if (!validation.valid) {
                throw new Error(validation.error);
            }
        }

        war.peaceNegotiation = war.peaceNegotiation || {};
        war.peaceNegotiation.offeredBy = offeringNationId;
        war.peaceNegotiation.offeredAt = Date.now();
        war.peaceNegotiation.terms = terms || {};
        war.peaceNegotiation.status = 'offered';

        this.safeEmit('peace_terms_offered', {
            warId: warId,
            offeringNationId: offeringNationId,
            offeringNation: offeringNation,
            terms: terms || {}
        });

        return {
            warId: warId,
            peaceNegotiation: war.peaceNegotiation
        };
    }

    /**
     * Accept peace terms - end war with agreed terms
     * Uses WarTermsSystem to apply terms (cash, tech, land, peace length)
     */
    acceptPeaceTerms(warId, acceptingNationId) {
        const war = this.activeWars.get(warId);
        if (!war) {
            throw new Error('War not found');
        }

        const acceptingNation = this.getNationById(acceptingNationId);
        if (!acceptingNation) {
            throw new Error('Accepting nation not found');
        }

        const acceptingSide = this.getAttackerSide(war, acceptingNationId);
        if (!acceptingSide) {
            throw new Error('Nation is not participating in this war');
        }

        if (!war.peaceNegotiation || war.peaceNegotiation.status !== 'offered') {
            throw new Error('No peace terms have been offered to accept');
        }

        // Apply terms via WarTermsSystem (truth source for peace mechanics)
        const economySystem = window.EconomySystem;
        const applyResult = this.warTermsSystem.applyPeaceTerms(
            war,
            war.peaceNegotiation.terms,
            economySystem
        );

        if (!applyResult.applied) {
            throw new Error(applyResult.error || 'Failed to apply peace terms');
        }

        war.peaceNegotiation.acceptedBy = acceptingNationId;
        war.peaceNegotiation.acceptedAt = Date.now();
        war.peaceNegotiation.status = 'accepted';
        war.peaceNegotiation.appliedEffects = applyResult.effects;

        // End the war
        war.winner = acceptingSide === 'attacker' ? 'defender' : 'attacker';
        this.endWar(warId);

        this.safeEmit('peace_terms_accepted', {
            warId: warId,
            acceptingNationId: acceptingNationId,
            acceptingNation: acceptingNation,
            terms: war.peaceNegotiation.terms,
            effects: applyResult.effects
        });

        return {
            warId: warId,
            peaceNegotiation: war.peaceNegotiation
        };
    }

    /**
     * Reject peace terms
     */
    rejectPeaceTerms(warId, rejectingNationId) {
        const war = this.activeWars.get(warId);
        if (!war) {
            throw new Error('War not found');
        }

        const rejectingNation = this.getNationById(rejectingNationId);
        if (!rejectingNation) {
            throw new Error('Rejecting nation not found');
        }

        const rejectingSide = this.getAttackerSide(war, rejectingNationId);
        if (!rejectingSide) {
            throw new Error('Nation is not participating in this war');
        }

        if (!war.peaceNegotiation || war.peaceNegotiation.status !== 'offered') {
            throw new Error('No peace terms have been offered to reject');
        }

        war.peaceNegotiation.rejectedBy = rejectingNationId;
        war.peaceNegotiation.rejectedAt = Date.now();
        war.peaceNegotiation.status = 'rejected';

        this.safeEmit('peace_terms_rejected', {
            warId: warId,
            rejectingNationId: rejectingNationId,
            rejectingNation: rejectingNation
        });

        return {
            warId: warId,
            peaceNegotiation: war.peaceNegotiation
        };
    }

    /**
     * Apply accepted peace terms to nations (delegated to WarTermsSystem)
     * Kept for backward compatibility - delegates to WarTermsSystem.applyPeaceTerms
     */
    applyPeaceTerms(war, terms, economySystem = null) {
        return this.warTermsSystem.applyPeaceTerms(war, terms, economySystem || window.EconomySystem);
    }

    /**
     * Get historical wars archive
     */
    getHistoricalWars() {
        return Array.from(this.historicalWars.values());
    }

    /**
     * Get a specific historical war by ID
     */
    getHistoricalWar(warId) {
        return this.historicalWars.get(warId);
    }

    /**
     * Get war history for a specific nation (both active and historical)
     */
    getNationWarHistory(nationId) {
        const activeWars = this.getWarsForNation(nationId);
        const historicalWars = Array.from(this.historicalWars.values()).filter(war =>
            war.sides.attacker.nations.includes(nationId) ||
            war.sides.defender.nations.includes(nationId)
        );

        return {
            active: activeWars,
            historical: historicalWars,
            cumulativeStats: this.getCumulativeNationWarStats(nationId)
        };
    }

    /**
     * Get cumulative war statistics for a nation across all wars
     */
    getCumulativeNationWarStats(nationId) {
        return this.nationWarStats.get(nationId) || {
            warsWon: 0,
            warsLost: 0,
            warsDraw: 0,
            totalDamageDealt: 0,
            totalDamageReceived: 0,
            totalUnitsKilled: 0,
            totalUnitsLost: 0,
            totalInfraDestroyed: 0,
            totalInfraReceived: 0,
            totalLootGained: 0,
            totalLootLost: 0,
            totalAttacks: 0,
            totalBattles: 0
        };
    }

    /**
     * Get comprehensive war summary for a war
     */
    getWarSummary(warId) {
        const war = this.activeWars.get(warId) || this.historicalWars.get(warId);
        if (!war) return null;

        const summary = {
            id: war.id,
            warType: war.warType,
            solo: war.solo,
            reason: war.reason,
            status: war.status,
            winner: war.winner,
            startTime: war.startTime,
            endTime: war.endTime,
            totalAttacks: war.totalAttacks,
            originalAttacker: war.originalAttacker,
            originalDefender: war.originalDefender,
            sides: {
                attacker: {
                    nations: war.sides.attacker.nations,
                    totalDamage: war.sides.attacker.totalDamage,
                    totalDamageReceived: war.sides.attacker.totalDamageReceived || 0,
                    totalLootGained: war.sides.attacker.totalLootGained || 0,
                    totalLootLost: war.sides.attacker.totalLootLost || 0,
                    roundsWon: war.sides.attacker.roundsWon,
                    damageRankings: war.sides.attacker.nationRankingsSorted || [],
                    allianceRankings: war.sides.attacker.allianceRankingsSorted || []
                },
                defender: {
                    nations: war.sides.defender.nations,
                    totalDamage: war.sides.defender.totalDamage,
                    totalDamageReceived: war.sides.defender.totalDamageReceived || 0,
                    totalLootGained: war.sides.defender.totalLootGained || 0,
                    totalLootLost: war.sides.defender.totalLootLost || 0,
                    roundsWon: war.sides.defender.roundsWon,
                    damageRankings: war.sides.defender.nationRankingsSorted || [],
                    allianceRankings: war.sides.defender.allianceRankingsSorted || []
                }
            },
            participantStats: {},
            peaceNegotiation: war.peaceNegotiation || null
        };

        // Copy participant stats
        if (war.participantStats) {
            war.participantStats.forEach((stats, nationId) => {
                summary.participantStats[nationId] = {
                    attacks: stats.attacks,
                    damage: stats.damage,
                    damageReceived: stats.damageReceived,
                    criticalHits: stats.criticalHits,
                    blocks: stats.blocks,
                    parries: stats.parries,
                    unitsLost: { ...stats.unitsLost },
                    unitsKilled: { ...stats.unitsKilled },
                    infraDestroyed: stats.infraDestroyed,
                    infraReceived: stats.infraReceived,
                    lootGained: stats.lootGained,
                    lootLost: stats.lootLost
                };
            });
        }

        return summary;
    }

    /**
     * Process energy regeneration for all players
     */
    processEnergyRegeneration() {
        // Emit event for other systems to handle
        this.safeEmit('energy_regeneration_tick');

        // Regenerate energy for global Player (single player)
        if (window.Player) {
            const currentEnergy = window.Player.energy || 0;
            const maxEnergy = window.Player.maxEnergy || this.MAX_ENERGY;
            const regenAmount = Math.floor(maxEnergy * (this.ENERGY_REGEN_PERCENT / 100));
            window.Player.energy = Math.min(maxEnergy, currentEnergy + regenAmount);
        }

        // Regenerate energy for all players via DataManager (multiplayer)
        if (window.DataManager && window.DataManager.players) {
            window.DataManager.players.forEach(player => {
                const currentEnergy = player.energy || 0;
                const maxEnergy = player.maxEnergy || this.MAX_ENERGY;
                const regenAmount = Math.floor(maxEnergy * (this.ENERGY_REGEN_PERCENT / 100));
                player.energy = Math.min(maxEnergy, currentEnergy + regenAmount);
            });
        }
    }

    /**
     * Utility functions
     */
    getNationById(nationId) {
        // Try window.Nation first (single player active nation)
        if (window.Nation && window.Nation.id === nationId) {
            return window.Nation;
        }

        // Try DataManager currentPlayer nations (multi-nation support)
        if (window.DataManager && window.DataManager.currentPlayer) {
            const nations = window.DataManager.currentPlayer.nations || [];
            const found = nations.find(n => n.id === nationId);
            if (found) return found;
        }

        // Try DataManager directly
        if (window.DataManager && window.DataManager.nations) {
            const found = window.DataManager.nations.find(n => n.id === nationId);
            if (found) return found;
        }

        // Try GameEngine currentNation
        if (window.GameEngine && window.GameEngine.currentNation && window.GameEngine.currentNation.id === nationId) {
            return window.GameEngine.currentNation;
        }

        // Try GameEngine nations map
        if (window.GameEngine && window.GameEngine.nations) {
            const found = window.GameEngine.nations[nationId];
            if (found) return found;
        }

        return null;
    }

    getPlayerByNationId(nationId) {
        // Single player: return global Player if nation matches
        if (window.Player && window.Nation && window.Nation.id === nationId) {
            return window.Player;
        }

        // Multiplayer: look up player by nation ID via DataManager
        if (window.DataManager && window.DataManager.currentPlayer) {
            const player = window.DataManager.currentPlayer;
            if (player.id === nationId || (player.nationId === nationId)) {
                return player;
            }
        }

        // Try GameEngine players map
        if (window.GameEngine && window.GameEngine.players) {
            const player = window.GameEngine.players[nationId] || window.GameEngine.players.find(p => p.nationId === nationId);
            if (player) return player;
        }

        return null;
    }

    getNationMilitaryUnits(nation) {
        return {
            soldiers: nation.militaryUnits?.soldiers || 0,
            tanks: nation.militaryUnits?.tanks || 0,
            aircraft: nation.militaryUnits?.aircraft || 0,
            ships: nation.militaryUnits?.ships || 0,
            spies: nation.militaryUnits?.spies || 0,
            missiles: nation.militaryUnits?.missiles || 0,
            nukes: nation.militaryUnits?.nukes || 0
        };
    }

    addUnitsToSide(side, units) {
        if (!side.units) {
            side.units = {
                soldiers: 0, tanks: 0, aircraft: 0, ships: 0,
                spies: 0, missiles: 0, nukes: 0
            };
        }

        Object.keys(units).forEach(unitType => {
            side.units[unitType] += units[unitType];
        });
    }

    addUnitEntitiesToSide(side, unitEntities) {
        if (!side.militaryUnitEntities) {
            side.militaryUnitEntities = new Map();
        }

        unitEntities.forEach((entity, type) => {
            const existing = side.militaryUnitEntities.get(type);
            if (existing) {
                existing.quantity += entity.quantity;
            } else {
                side.militaryUnitEntities.set(type, entity);
            }
        });
    }

    hasAvailableOffensiveSlots(nation) {
        let maxOffensiveWars = 2; // Base capacity

        // Command Centers increase war capacity
        if (nation.projectEffects?.offensiveWarSlots) {
            maxOffensiveWars = nation.projectEffects.offensiveWarSlots;
        }

        // Count current offensive wars (wars where this nation is attacking)
        let currentOffensiveWars = 0;
        this.activeWars.forEach(war => {
            if (war.status === 'active' && war.sides.attacker.nations.includes(nation.id)) {
                currentOffensiveWars++;
            }
        });

        return currentOffensiveWars < maxOffensiveWars;
    }

    hasAvailableDefensiveSlots(nation) {
        let maxDefensiveWars = 2; // Base capacity

        // Command Centers increase war capacity
        if (nation.projectEffects?.defensiveWarSlots) {
            maxDefensiveWars = nation.projectEffects.defensiveWarSlots;
        }

        // Count current defensive wars (wars where this nation is defending)
        let currentDefensiveWars = 0;
        this.activeWars.forEach(war => {
            if (war.status === 'active' && war.sides.defender.nations.includes(nation.id)) {
                currentDefensiveWars++;
            }
        });

        return currentDefensiveWars < maxDefensiveWars;
    }

    // Legacy function for compatibility - checks both offensive and defensive slots
    hasAvailableWarSlots(nation) {
        return this.hasAvailableOffensiveSlots(nation) || this.hasAvailableDefensiveSlots(nation);
    }

    areNationsAtWar(nationId1, nationId2) {
        for (let war of this.activeWars.values()) {
            const attackerHasNation1 = war.sides.attacker.nations.includes(nationId1);
            const attackerHasNation2 = war.sides.attacker.nations.includes(nationId2);
            const defenderHasNation1 = war.sides.defender.nations.includes(nationId1);
            const defenderHasNation2 = war.sides.defender.nations.includes(nationId2);

            // Check if they're on opposite sides
            if ((attackerHasNation1 && defenderHasNation2) ||
                (attackerHasNation2 && defenderHasNation1)) {
                return true;
            }
        }
        return false;
    }

    getAttackerSide(war, nationId) {
        if (war.sides.attacker.nations.includes(nationId)) {
            return 'attacker';
        } else if (war.sides.defender.nations.includes(nationId)) {
            return 'defender';
        }
        return null;
    }

    getWarByNationId(nationId) {
        for (let war of this.activeWars.values()) {
            if (war.sides.attacker.nations.includes(nationId) ||
                war.sides.defender.nations.includes(nationId)) {
                return war;
            }
        }
        return null;
    }

    updateWarStatistics(war, nationId, attackData) {
        const stats = war.participantStats.get(nationId);
        if (stats) {
            stats.attacks++;
            stats.damage += attackData.damage;
            if (attackData.damageReceived) {
                stats.damageReceived += attackData.damageReceived;
            }
            if (attackData.isCritical) {
                stats.criticalHits++;
            }
            if (attackData.infraDestroyed) {
                stats.infraDestroyed += attackData.infraDestroyed;
            }
            if (attackData.unitsKilled) {
                Object.keys(attackData.unitsKilled).forEach(unitType => {
                    if (!stats.unitsKilled[unitType]) {
                        stats.unitsKilled[unitType] = 0;
                    }
                    stats.unitsKilled[unitType] += attackData.unitsKilled[unitType];
                });
            }
        }

        war.totalAttacks++;
    }

    /**
     * Get all active wars
     */
    getActiveWars() {
        return Array.from(this.activeWars.values());
    }

    /**
     * Get war by ID
     */
    getWar(warId) {
        return this.activeWars.get(warId);
    }

    /**
     * Get wars involving a specific nation
     */
    getWarsForNation(nationId) {
        return this.getActiveWars().filter(war =>
            war.sides.attacker.nations.includes(nationId) ||
            war.sides.defender.nations.includes(nationId)
        );
    }

    /**
     * Get war statistics for a nation (active wars + cumulative historical)
     */
    getWarStats(nationId) {
        const activeStats = {
            totalWars: 0,
            activeWars: 0,
            totalAttacks: 0,
            totalDamage: 0,
            criticalHits: 0,
            blocks: 0,
            parries: 0,
            unitsLost: {}
        };

        this.activeWars.forEach(war => {
            const participantStats = war.participantStats.get(nationId);
            if (participantStats) {
                activeStats.totalWars++;
                if (war.status === 'active') {
                    activeStats.activeWars++;
                }
                activeStats.totalAttacks += participantStats.attacks;
                activeStats.totalDamage += participantStats.damage;
                activeStats.criticalHits += participantStats.criticalHits;
                activeStats.blocks += participantStats.blocks;
                activeStats.parries += participantStats.parries;

                Object.keys(participantStats.unitsLost).forEach(unitType => {
                    if (!activeStats.unitsLost[unitType]) {
                        activeStats.unitsLost[unitType] = 0;
                    }
                    activeStats.unitsLost[unitType] += participantStats.unitsLost[unitType];
                });
            }
        });

        // Merge with cumulative historical stats
        const cumulative = this.getCumulativeNationWarStats(nationId);

        return {
            activeWars: activeStats.activeWars,
            totalActiveWars: activeStats.totalWars,
            totalActiveAttacks: activeStats.totalAttacks,
            totalActiveDamage: activeStats.totalDamage,
            totalActiveCriticalHits: activeStats.criticalHits,
            totalActiveBlocks: activeStats.blocks,
            totalActiveParries: activeStats.parries,
            totalActiveUnitsLost: activeStats.unitsLost,
            // Cumulative across all wars (active + historical)
            cumulativeWarsWon: cumulative.warsWon,
            cumulativeWarsLost: cumulative.warsLost,
            cumulativeWarsDraw: cumulative.warsDraw,
            cumulativeTotalDamageDealt: cumulative.totalDamageDealt,
            cumulativeTotalDamageReceived: cumulative.totalDamageReceived,
            cumulativeTotalUnitsKilled: cumulative.totalUnitsKilled,
            cumulativeTotalUnitsLost: cumulative.totalUnitsLost,
            cumulativeTotalInfraDestroyed: cumulative.totalInfraDestroyed,
            cumulativeTotalInfraReceived: cumulative.totalInfraReceived,
            cumulativeTotalLootGained: cumulative.totalLootGained,
            cumulativeTotalLootLost: cumulative.totalLootLost,
            cumulativeTotalAttacks: cumulative.totalAttacks,
            cumulativeTotalBattles: cumulative.totalBattles
        };
    }

    // ════════════════════════════════════════════════════════════════════════════
    // WAR TERMS SYSTEM QUERY METHODS (delegated to WarTermsSystem - truth source)
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * Get all available casus belli types
     */
    getCasusBelliTypes() {
        return this.warTermsSystem.getCasusBelliTypes();
    }

    /**
     * Get a specific casus belli configuration
     */
    getCasusBelli(casusBelliId) {
        return this.warTermsSystem.getCasusBelli(casusBelliId);
    }

    /**
     * Validate that a casus belli ID is valid
     */
    isValidCasusBelli(casusBelliId) {
        return this.warTermsSystem.isValidCasusBelli(casusBelliId);
    }

    /**
     * Get casus belli modifier for a specific attribute
     */
    getCasusBelliModifier(casusBelliId, attribute) {
        return this.warTermsSystem.getCasusBelliModifier(casusBelliId, attribute);
    }

    /**
     * Check if a casus belli allows a specific peace term type
     */
    doesCasusBelliAllowTerm(casusBelliId, termTypeId) {
        return this.warTermsSystem.doesCasusBelliAllowTerm(casusBelliId, termTypeId);
    }

    /**
     * Get all war type modifiers
     */
    getWarTypeModifiers() {
        return this.warTermsSystem.getWarTypeModifiers();
    }

    /**
     * Get a specific war type modifier
     */
    getWarTypeModifier(warTypeId) {
        return this.warTermsSystem.getWarTypeModifier(warTypeId);
    }

    /**
     * Get combined modifier for war type + casus belli
     */
    getCombinedWarModifier(warTypeId, casusBelliId, attribute) {
        return this.warTermsSystem.getCombinedWarModifier(warTypeId, casusBelliId, attribute);
    }

    /**
     * Get all peace term types
     */
    getPeaceTermTypes() {
        return this.warTermsSystem.getPeaceTermTypes();
    }

    /**
     * Get a specific peace term type configuration
     */
    getPeaceTermType(termTypeId) {
        return this.warTermsSystem.getPeaceTermType(termTypeId);
    }

    /**
     * Validate a peace term offer
     */
    validatePeaceTerm(war, offeringNationId, termTypeId, termValue) {
        return this.warTermsSystem.validatePeaceTerm(war, offeringNationId, termTypeId, termValue);
    }

    /**
     * Calculate attack loot based on damage dealt (new formula)
     */
    calculateAttackLoot(damageDealt, unitMix, attackerTech, attackerSkills, casusBelliId, warTypeId, randomInt = 50) {
        return this.warTermsSystem.calculateAttackLoot(damageDealt, unitMix, attackerTech, attackerSkills, casusBelliId, warTypeId, randomInt);
    }

    /**
     * Calculate if missile/nuke is intercepted
     * Checks wonders AND projects that provide missile/nuke defense
     */
    calculateInterception(targetSide, weaponType) {
        let totalInterceptionChance = 0;

        targetSide.nations.forEach(nationId => {
            const nation = this.getNationById(nationId);
            if (!nation) return;

            // Check wonders that block missiles/nukes
            if (nation.wonderEffects?.ironCurtainInterception) {
                totalInterceptionChance += nation.wonderEffects.ironCurtainInterception;
            }

            // Check projects that block missiles/nukes
            if (nation.projects) {
                if (weaponType === 'missile' && nation.projects.missileDefense) {
                    totalInterceptionChance += nation.projectEffects?.missileDefenseRate || 0.10;
                }
                if (weaponType === 'nuke' && nation.projects.nukeDefense) {
                    totalInterceptionChance += nation.projectEffects?.nukeDefenseRate || 0.05;
                }
            }

            // Check improvements that provide missile/nuke defense
            if (nation.improvements?.antiMissileBattery) {
                totalInterceptionChance += nation.improvementEffects?.antiMissileBatteryRate || 0.05;
            }
            if (nation.improvements?.sdioSystem && weaponType === 'nuke') {
                totalInterceptionChance += nation.improvementEffects?.sdioRate || 0.03;
            }
        });

        totalInterceptionChance = Math.min(0.95, totalInterceptionChance);

        if (weaponType === 'nuke') {
            totalInterceptionChance *= 0.7;
        }

        return Math.random() < totalInterceptionChance;
    }

    /**
     * Calculate population casualties from unit destruction
     */
    calculatePopulationCasualties(unitsDestroyed, casusBelliId) {
        return this.warTermsSystem.calculatePopulationCasualties(unitsDestroyed, casusBelliId);
    }

    /**
     * Calculate cash reparations based on damage dealt
     */
    calculateCashReparations(damageDealt, casusBelliId, warTypeId) {
        return this.warTermsSystem.calculateCashReparations(damageDealt, casusBelliId, warTypeId);
    }

    /**
     * Calculate tech loot from enemy technology
     */
    calculateTechLoot(enemyTech, casusBelliId, warTypeId) {
        return this.warTermsSystem.calculateTechLoot(enemyTech, casusBelliId, warTypeId);
    }

    /**
     * Calculate land annexation based on casus belli and war type
     */
    calculateLandAnnexation(enemyLand, casusBelliId, warTypeId) {
        return this.warTermsSystem.calculateLandAnnexation(enemyLand, casusBelliId, warTypeId);
    }

    /**
     * Create a peace term offer
     */
    createPeaceTermOffer(offeringNationId, targetNationId, termTypeId, termValue, casusBelliId, warTypeId) {
        return this.warTermsSystem.createPeaceTermOffer(
            offeringNationId, targetNationId, termTypeId, termValue, casusBelliId, warTypeId
        );
    }

    /**
     * Apply accepted peace terms to nations
     */
    applyPeaceTermsViaTermsSystem(war, terms, economySystem = null) {
        return this.warTermsSystem.applyPeaceTerms(war, terms, economySystem || window.EconomySystem);
    }

    /**
     * Calculate total war round loot
     */
    calculateWarRoundLoot(warRound, casusBelliId, warTypeId, attackerTech = 0, defenderTech = 0, attackerSkills = {}, defenderSkills = {}, randomInt = 50) {
        return this.warTermsSystem.calculateWarRoundLoot(warRound, casusBelliId, warTypeId, attackerTech, defenderTech, attackerSkills, defenderSkills, randomInt);
    }

    /**
     * Handle event callbacks
     */
    handleWarDeclaration(data) {
        try {
            return this.declareWar(data);
        } catch (error) {
            console.error('War declaration failed:', error.message);
            this.safeEmit('war_declaration_failed', { error: error.message, data });
        }
    }

    handleJoinWar(data) {
        try {
            return this.joinWar(data);
        } catch (error) {
            console.error('Join war failed:', error.message);
            this.safeEmit('join_war_failed', { error: error.message, data });
        }
    }

    handleWarAttack(data) {
        try {
            return this.executeAttack(data);
        } catch (error) {
            console.error('War attack failed:', error.message);
            this.safeEmit('war_attack_failed', { error: error.message, data });
        }
    }

    handleMissileLaunch(data) {
        try {
            return this.launchMissile(data);
        } catch (error) {
            console.error('Missile launch failed:', error.message);
            this.safeEmit('missile_launch_failed', { error: error.message, data });
        }
    }

    handleNukeLaunch(data) {
        try {
            return this.launchNuke(data);
        } catch (error) {
            console.error('Nuke launch failed:', error.message);
            this.safeEmit('nuke_launch_failed', { error: error.message, data });
        }
    }

    handleSpyOperation(data) {
        try {
            return this.launchSpyOperation(data);
        } catch (error) {
            console.error('Spy operation failed:', error.message);
            this.safeEmit('spy_operation_failed', { error: error.message, data });
        }
    }

    handleSueForPeace(data) {
        try {
            return this.sueForPeace(data.warId, data.nationId, data.terms);
        } catch (error) {
            console.error('Sue for peace failed:', error.message);
            this.safeEmit('sue_for_peace_failed', { error: error.message, data });
        }
    }

    handleOfferPeaceTerms(data) {
        try {
            return this.offerPeaceTerms(data.warId, data.nationId, data.terms);
        } catch (error) {
            console.error('Offer peace terms failed:', error.message);
            this.safeEmit('offer_peace_terms_failed', { error: error.message, data });
        }
    }

    handleAcceptPeaceTerms(data) {
        try {
            return this.acceptPeaceTerms(data.warId, data.nationId);
        } catch (error) {
            console.error('Accept peace terms failed:', error.message);
            this.safeEmit('accept_peace_terms_failed', { error: error.message, data });
        }
    }

    handleRejectPeaceTerms(data) {
        try {
            return this.rejectPeaceTerms(data.warId, data.nationId);
        } catch (error) {
            console.error('Reject peace terms failed:', error.message);
            this.safeEmit('reject_peace_terms_failed', { error: error.message, data });
        }
    }

    /**
     * Process treaty obligations when war is declared
     */
    processTreatyObligations(war, attackerNation, defenderNation) {
        // Check attacker's alliance treaties (offensive war for attacker)
        if (attackerNation.allianceId) {
            this.checkAllianceTreaties(war, attackerNation.allianceId, 'attacker', 'offensive');
        }

        // Check defender's alliance treaties (defensive war for defender)
        if (defenderNation.allianceId) {
            this.checkAllianceTreaties(war, defenderNation.allianceId, 'defender', 'defensive');
        }
    }

    /**
     * Check alliance treaties and set up obligations
     */
    checkAllianceTreaties(war, allianceId, warSide, warType) {
        const alliance = this.getAllianceById(allianceId);
        if (!alliance || !alliance.treaties) return;

        alliance.treaties.forEach(treaty => {
            const treatyType = treaty.type;
            const partnerAllianceId = treaty.partnerId;

            // Determine if this treaty creates war obligations
            let isObligated = false;
            let requiredParticipationPercent = 0;

            switch (treatyType) {
                case 'protectorate':
                    isObligated = true;
                    requiredParticipationPercent = 20; // 20% of alliance must participate
                    break;

                case 'extension':
                    isObligated = true;
                    requiredParticipationPercent = 20;
                    break;

                case 'mutual_defense':
                    if (warType === 'defensive') {
                        isObligated = true;
                        requiredParticipationPercent = 20;
                    }
                    break;

                case 'mutual_aggression':
                    if (warType === 'offensive') {
                        isObligated = true;
                        requiredParticipationPercent = 20;
                    }
                    break;

                case 'optional_defense':
                    if (warType === 'defensive') {
                        isObligated = true;
                        requiredParticipationPercent = 10; // Only 10% required for optional
                    }
                    break;

                case 'optional_aggression':
                    if (warType === 'offensive') {
                        isObligated = true;
                        requiredParticipationPercent = 10;
                    }
                    break;

                // intelligence_sharing and peace_treaty provide no war bonuses
                case 'intelligence_sharing':
                case 'peace_treaty':
                default:
                    isObligated = false;
                    break;
            }

            if (isObligated) {
                const partnerAlliance = this.getAllianceById(partnerAllianceId);
                if (partnerAlliance) {
                    war.treatyObligations.set(partnerAllianceId, {
                        type: treatyType,
                        warType: warType,
                        side: warSide,
                        requiredParticipationPercent: requiredParticipationPercent,
                        currentParticipationPercent: 0,
                        fulfilled: false,
                        allianceMemberCount: partnerAlliance.members.length,
                        participatingMembers: 0
                    });

                    // Notify the obligated alliance
                    this.safeEmit('treaty_obligation_created', {
                        warId: war.id,
                        obligatedAllianceId: partnerAllianceId,
                        treatyType: treatyType,
                        warType: warType,
                        requiredParticipation: requiredParticipationPercent
                    });
                }
            }
        });
    }

    /**
     * Calculate treaty damage bonuses
     */
    calculateTreatyDamageBonus(attackerNation, war, warSide) {
        let bonusMultiplier = 1.0;

        if (!attackerNation.allianceId) return bonusMultiplier;

        const alliance = this.getAllianceById(attackerNation.allianceId);
        if (!alliance || !alliance.treaties) return bonusMultiplier;

        // Determine war type for the attacker
        const isAttackerSide = warSide === 'attacker';
        const isOriginalAttacker = war.originalAttacker === attackerNation.id;

        // War type from attacker's perspective
        let attackerWarType;
        if (isAttackerSide) {
            attackerWarType = isOriginalAttacker ? 'offensive' : 'offensive'; // Joining attacker side = offensive
        } else {
            attackerWarType = 'defensive'; // Defending = defensive
        }

        alliance.treaties.forEach(treaty => {
            const treatyType = treaty.type;
            let treatyBonus = 0;

            switch (treatyType) {
                case 'protectorate':
                    treatyBonus = 0.15; // 15% damage bonus
                    break;

                case 'extension':
                    treatyBonus = 0.12; // 12% damage bonus
                    break;

                case 'mutual_defense':
                case 'mutual_aggression':
                    treatyBonus = 0.10; // 10% damage bonus
                    break;

                case 'optional_defense':
                    if (attackerWarType === 'defensive') {
                        treatyBonus = 0.08; // 8% bonus for defensive wars only
                    }
                    break;

                case 'optional_aggression':
                    if (attackerWarType === 'offensive') {
                        treatyBonus = 0.08; // 8% bonus for offensive wars only
                    }
                    break;

                // No bonuses for intelligence or peace treaties
                case 'intelligence_sharing':
                case 'peace_treaty':
                default:
                    treatyBonus = 0;
                    break;
            }

            // Check if treaty partner alliance is also participating in the war
            const partnerAllianceId = treaty.partnerId;
            const partnerAlliance = this.getAllianceById(partnerAllianceId);

            if (partnerAlliance && treatyBonus > 0) {
                // Check if any partner alliance members are fighting on the same side
                const partnerMembersInWar = war.sides[warSide].nations.filter(nationId => {
                    const nation = this.getNationById(nationId);
                    return nation && nation.allianceId === partnerAllianceId;
                });

                if (partnerMembersInWar.length > 0) {
                    bonusMultiplier += treatyBonus;
                    console.log(`Treaty bonus applied: ${treatyType} +${Math.round(treatyBonus * 100)}%`);
                }
            }
        });

        return Math.min(bonusMultiplier, 2.5); // Cap at 150% bonus
    }

    /**
     * Update damage rankings in real-time
     */
    updateDamageRankings(war, attackerNationId, damage, side) {
        const warSide = war.sides[side];
        const attackerNation = this.getNationById(attackerNationId);

        // Update individual nation damage ranking
        const currentDamage = warSide.damageRankings.get(attackerNationId) || 0;
        warSide.damageRankings.set(attackerNationId, currentDamage + damage);

        // Update alliance damage ranking
        if (attackerNation && attackerNation.allianceId) {
            const allianceId = attackerNation.allianceId;
            const currentAllianceDamage = warSide.allianceRankings.get(allianceId) || 0;
            warSide.allianceRankings.set(allianceId, currentAllianceDamage + damage);

            // Track alliance participation for treaty obligations
            this.updateAllianceParticipation(war, allianceId, attackerNationId);
        }

        // Sort rankings for display
        this.sortDamageRankings(war);
    }

    /**
     * Update alliance participation tracking for treaty obligations
     */
    updateAllianceParticipation(war, allianceId, nationId) {
        war.treatyObligations.forEach((obligation, obligatedAllianceId) => {
            if (obligatedAllianceId === allianceId) {
                // Count unique participating members
                if (!obligation.participatingNations) {
                    obligation.participatingNations = new Set();
                }

                if (!obligation.participatingNations.has(nationId)) {
                    obligation.participatingNations.add(nationId);
                    obligation.participatingMembers = obligation.participatingNations.size;
                    obligation.currentParticipationPercent =
                        (obligation.participatingMembers / obligation.allianceMemberCount) * 100;

                    // Check if obligation is now fulfilled
                    if (obligation.currentParticipationPercent >= obligation.requiredParticipationPercent) {
                        obligation.fulfilled = true;

                        this.safeEmit('treaty_obligation_fulfilled', {
                            warId: war.id,
                            allianceId: allianceId,
                            treatyType: obligation.type,
                            participationPercent: obligation.currentParticipationPercent
                        });
                    }
                }
            }
        });
    }

    /**
     * Sort damage rankings for display
     */
    sortDamageRankings(war) {
        ['attacker', 'defender'].forEach(side => {
            const warSide = war.sides[side];

            // Convert Maps to sorted arrays for UI display
            warSide.nationRankingsSorted = Array.from(warSide.damageRankings.entries())
                .sort((a, b) => b[1] - a[1]); // Sort by damage descending

            warSide.allianceRankingsSorted = Array.from(warSide.allianceRankings.entries())
                .sort((a, b) => b[1] - a[1]); // Sort by damage descending
        });
    }

    /**
     * Get alliance by ID
     */
    getAllianceById(allianceId) {
        // This would integrate with your alliance management system
        // For now, return null - implement based on your alliance storage
        if (window.AllianceSystem) {
            return window.AllianceSystem.getAlliance(allianceId);
        }
        return null;
    }

    /**
     * Check if nation can declare war (not violating peace treaties)
     */
    canDeclareWar(attackerNationId, defenderNationId) {
        const attackerNation = this.getNationById(attackerNationId);
        const defenderNation = this.getNationById(defenderNationId);

        if (!attackerNation || !defenderNation) return false;

        // Check for peace treaties between alliances
        if (attackerNation.allianceId && defenderNation.allianceId) {
            const attackerAlliance = this.getAllianceById(attackerNation.allianceId);
            if (attackerAlliance && attackerAlliance.treaties) {
                const peaceTreaty = attackerAlliance.treaties.find(treaty =>
                    treaty.partnerId === defenderNation.allianceId &&
                    treaty.type === 'peace_treaty'
                );

                if (peaceTreaty) {
                    throw new Error('Cannot declare war: Peace treaty exists between alliances');
                }
            }
        }

        return true;
    }

    /**
     * Get war type for a nation (offensive or defensive)
     */
    getWarTypeForNation(war, nationId) {
        if (war.originalAttacker === nationId) {
            return 'offensive'; // Original attacker
        } else if (war.originalDefender === nationId) {
            return 'defensive'; // Original defender
        } else if (war.sides.attacker.nations.includes(nationId)) {
            return 'offensive'; // Joined attacker side
        } else if (war.sides.defender.nations.includes(nationId)) {
            return 'defensive'; // Joined defender side
        }
        return null;
    }

    /**
     * Get treaty obligations status for a war
     */
    getTreatyObligationsStatus(warId) {
        const war = this.activeWars.get(warId);
        if (!war) return [];

        const obligations = [];
        war.treatyObligations.forEach((obligation, allianceId) => {
            const alliance = this.getAllianceById(allianceId);
            obligations.push({
                allianceId: allianceId,
                allianceName: alliance?.name || allianceId,
                treatyType: obligation.type,
                warType: obligation.warType,
                side: obligation.side,
                requiredParticipation: obligation.requiredParticipationPercent,
                currentParticipation: obligation.currentParticipationPercent,
                fulfilled: obligation.fulfilled,
                participatingMembers: obligation.participatingMembers,
                totalMembers: obligation.allianceMemberCount
            });
        });

        return obligations;
    }

    /**
     * Safely emit an event, guarded against undefined EventBus
     */
    safeEmit(eventName, data) {
        if (typeof EventBus !== 'undefined') {
            EventBus.emit(eventName, data);
        }
    }

    /**
     * Get damage rankings for a war
     */
    getDamageRankings(warId) {
        const war = this.activeWars.get(warId);
        if (!war) return null;

        return {
            attacker: {
                nations: war.sides.attacker.nationRankingsSorted || [],
                alliances: war.sides.attacker.allianceRankingsSorted || []
            },
            defender: {
                nations: war.sides.defender.nationRankingsSorted || [],
                alliances: war.sides.defender.allianceRankingsSorted || []
            }
        };
    }

    /**
     * Destroy the war system - clean up timers and event listeners
     */
    destroy() {
        // Clear energy regeneration interval
        if (this.energyIntervalId) {
            clearInterval(this.energyIntervalId);
            this.energyIntervalId = null;
        }

        // Clear all round timeouts
        for (const [warId, timeoutId] of this.roundTimeouts.entries()) {
            clearTimeout(timeoutId);
        }
        this.roundTimeouts.clear();

        // Clear all active wars
        this.activeWars.clear();

        // Unbind event listeners
        if (typeof EventBus !== 'undefined') {
            EventBus.off('declare_war', this._onDeclareWar);
            EventBus.off('join_war', this._onJoinWar);
            EventBus.off('attack_in_war', this._onWarAttack);
            EventBus.off('launch_missile_in_war', this._onMissileLaunch);
            EventBus.off('launch_nuke_in_war', this._onNukeLaunch);
            EventBus.off('launch_spy_operation', this._onSpyOperation);
            EventBus.off('sue_for_peace', this._onSueForPeace);
            EventBus.off('offer_peace_terms', this._onOfferPeaceTerms);
            EventBus.off('accept_peace_terms', this._onAcceptPeaceTerms);
            EventBus.off('reject_peace_terms', this._onRejectPeaceTerms);
            EventBus.off('hour_passed', this._onEnergyRegen);
            EventBus.off('round_timer', this._onRoundTimer);
        }

        console.log('War System destroyed');
    }
}

// Export the system
window.WarSystem = WarSystem;
