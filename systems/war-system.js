/**
 * War System - Combat and Battle Mechanics
 * Dominion Wars - Nation Building Strategy Game
 */

class WarSystem {
    constructor() {
        this.activeWars = new Map(); // warId -> war data
        this.warCounter = 1;
        
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
            assassinateSpies: 40
        };
        
        // Missile/Nuke damage values
        this.MISSILE_BASE_DAMAGE = 500; // Infra damage
        this.NUKE_BASE_DAMAGE = 2000;   // Infra damage
        this.MISSILE_HAPPINESS_PENALTY = 5;
        this.NUKE_HAPPINESS_PENALTY = 15;
        
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
        EventBus.on('declare_war', (data) => this.handleWarDeclaration(data));
        EventBus.on('join_war', (data) => this.handleJoinWar(data));
        EventBus.on('attack_in_war', (data) => this.handleWarAttack(data));
        EventBus.on('launch_missile_in_war', (data) => this.handleMissileLaunch(data));
        EventBus.on('launch_nuke_in_war', (data) => this.handleNukeLaunch(data));
        EventBus.on('launch_spy_operation', (data) => this.handleSpyOperation(data));
        EventBus.on('hour_passed', () => this.processEnergyRegeneration());
        EventBus.on('round_timer', (data) => this.processRoundEnd(data));
    }
    
    /**
     * Start energy regeneration system
     */
    startEnergyRegeneration() {
        setInterval(() => {
            this.processEnergyRegeneration();
        }, 3600000); // Every hour (60 * 60 * 1000 ms)
    }
    /**
     * Declare war between two nations
     */
    declareWar(data) {
        const { attackerNationId, defenderNationId, reason = 'Territorial Dispute' } = data;
        
        // Validation checks
        if (attackerNationId === defenderNationId) {
            throw new Error('Cannot declare war on yourself');
        }
        
        const attackerNation = this.getNationById(attackerNationId);
        const defenderNation = this.getNationById(defenderNationId);
        
        if (!attackerNation || !defenderNation) {
            throw new Error('One or both nations not found');
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
        
        // Create new war
        const warId = `war_${this.warCounter++}`;
        const startTime = Date.now() + (this.PREPARATION_MINUTES * 60 * 1000);
        
        const war = {
            id: warId,
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
                    roundsWon: 0,
                    units: this.getNationMilitaryUnits(attackerNation),
                    damageRankings: new Map(), // nationId -> damage dealt
                    allianceRankings: new Map(), // allianceId -> total alliance damage
                    missilesFired: 0,
                    nukesFired: 0,
                    spyOperations: new Map() // nationId -> operation results
                },
                defender: {
                    nations: [defenderNationId],
                    alliances: new Set(),
                    totalDamage: 0,
                    roundsWon: 0,
                    units: this.getNationMilitaryUnits(defenderNation),
                    damageRankings: new Map(),
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
        setTimeout(() => {
            this.startWarRound(warId);
        }, this.PREPARATION_MINUTES * 60 * 1000);
        
        // Emit events
        EventBus.emit('war_declared', {
            warId: warId,
            war: war,
            attacker: attackerNation,
            defender: defenderNation
        });
        
        console.log(`War declared: ${attackerNation.name} vs ${defenderNation.name}`);
        return warId;
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
        
        if (war.status !== 'preparing' && war.status !== 'active') {
            throw new Error('Cannot join ended war');
        }
        
        const nation = this.getNationById(nationId);
        if (!nation) {
            throw new Error('Nation not found');
        }
        
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
        
        // Add nation's military units
        const nationUnits = this.getNationMilitaryUnits(nation);
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
            criticalHits: 0,
            blocks: 0,
            parries: 0,
            unitsLost: {}
        });
        
        EventBus.emit('war_joined', {
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
        
        const attackerNation = this.getNationById(attackerNationId);
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
        
        currentRound.damage[attackerSide] += finalDamage;
        currentRound.damage[targetSide] += totalDefenseDamage;
        
        // Update damage rankings in real-time
        this.updateDamageRankings(war, attackerNationId, finalDamage, attackerSide);
        if (totalDefenseDamage > 0) {
            // Distribute defense damage among defenders for ranking
            const defensePerDefender = Math.floor(totalDefenseDamage / defendingSide.nations.length);
            defendingSide.nations.forEach(defenderNationId => {
                this.updateDamageRankings(war, defenderNationId, defensePerDefender, targetSide);
            });
        }
        
        // Update statistics
        this.updateWarStatistics(war, attackerNationId, {
            damage: finalDamage,
            isCritical: isCritical
        });
        
        // Emit attack event
        EventBus.emit('war_attack_executed', {
            warId: warId,
            attacker: attackerNation,
            damage: finalDamage,
            isCritical: isCritical,
            defenseDamage: totalDefenseDamage
        });
        
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
        attackerPlayer.consumeIntuition(this.MISSILE_INTUITION_COST);
        
        // Calculate if missile is intercepted
        const isIntercepted = this.calculateInterception(war.sides[targetSide], 'missile');
        
        if (isIntercepted) {
            // Missile blocked - attacker gets happiness penalty, defenders get boost
            this.applyMissileInterceptionEffects(war, attackerNationId, targetSide);
            
            EventBus.emit('missile_intercepted', {
                warId: warId,
                attacker: attackerNation,
                interceptedBy: targetSide
            });
            
            return { intercepted: true, damage: 0 };
        } else {
            // Missile hits - calculate damage
            const damage = this.calculateMissileDamage(attackerNation, attackerPlayer);
            
            // Apply damage to all nations on target side
            this.applyMissileHitEffects(war, targetSide, damage);
            
            // Update war statistics
            war.sides[attackerSide].missilesFired++;
            
            EventBus.emit('missile_hit', {
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
        attackerPlayer.consumeIntuition(this.NUKE_INTUITION_COST);
        
        // Calculate if nuke is intercepted
        const isIntercepted = this.calculateInterception(war.sides[targetSide], 'nuke');
        
        if (isIntercepted) {
            // Nuke blocked - attacker gets happiness penalty, defenders get boost
            this.applyNukeInterceptionEffects(war, attackerNationId, targetSide);
            
            EventBus.emit('nuke_intercepted', {
                warId: warId,
                attacker: attackerNation,
                interceptedBy: targetSide
            });
            
            return { intercepted: true, damage: 0 };
        } else {
            // Nuke hits - massive damage
            const damage = this.calculateNukeDamage(attackerNation, attackerPlayer);
            
            // Apply damage to all nations on target side
            this.applyNukeHitEffects(war, targetSide, damage);
            
            // Update war statistics
            war.sides[attackerSide].nukesFired++;
            
            EventBus.emit('nuke_hit', {
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
        
        // Execute spy operation
        const result = this.executeSpyOperation(
            attackerNation, 
            targetNation, 
            attackerPlayer, 
            operation
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
        
        EventBus.emit('spy_operation_executed', {
            warId: warId,
            attacker: attackerNation,
            target: targetNation,
            operation: operation,
            result: result
        });
        
        return result;
    }
    
    /**
     * Calculate if missile/nuke is intercepted
     */
    calculateInterception(targetSide, weaponType) {
        let totalInterceptionChance = 0;
        
        // Check each nation on target side for interception capabilities
        targetSide.nations.forEach(nationId => {
            const nation = this.getNationById(nationId);
            if (!nation) return;
            
            // Iron Curtain wonder provides missile defense
            if (nation.wonderEffects?.ironCurtainInterception) {
                totalInterceptionChance += nation.wonderEffects.ironCurtainInterception;
            }
            
            // Additional missile defense systems could be added here
            // Based on improvements or projects
        });
        
        // Cap interception chance at 95%
        totalInterceptionChance = Math.min(0.95, totalInterceptionChance);
        
        // Nukes are harder to intercept than regular missiles
        if (weaponType === 'nuke') {
            totalInterceptionChance *= 0.7; // 30% penalty for nukes
        }
        
        return Math.random() < totalInterceptionChance;
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
     */
    applyMissileHitEffects(war, targetSide, damage) {
        // Distribute damage among target nations
        const targetNations = war.sides[targetSide].nations;
        
        targetNations.forEach(nationId => {
            const nation = this.getNationById(nationId);
            if (!nation) return;
            
            // Calculate percentage-based infrastructure damage (5-15%)
            const damagePercent = 0.05 + (Math.random() * 0.10); // 5% to 15%
            const currentInfra = nation.infra || 0;
            
            // Calculate infra loss with minimum of 5, or all remaining if less than 5
            let infraLoss = Math.floor(currentInfra * damagePercent);
            if (currentInfra < 5) {
                infraLoss = currentInfra; // Take all remaining if less than 5
            } else {
                infraLoss = Math.max(5, infraLoss); // Minimum of 5 if they have at least 5
            }
            
            nation.infra = Math.max(0, currentInfra - infraLoss);
            
            // Apply happiness penalty
            if (nation.temporaryEffects) {
                nation.temporaryEffects.push({
                    type: 'happinessReduction',
                    amount: this.MISSILE_HAPPINESS_PENALTY,
                    turnsRemaining: 48, // 2 days
                    description: 'Missile strike casualties'
                });
            }
            
            console.log(`Missile hit ${nation.name}: ${infraLoss} infra destroyed (${Math.round(damagePercent * 100)}% damage), happiness penalty applied`);
        });
    }
    
    /**
     * Apply effects when nuke hits
     */
    applyNukeHitEffects(war, targetSide, damage) {
        // Distribute damage among target nations
        const targetNations = war.sides[targetSide].nations;
        
        targetNations.forEach(nationId => {
            const nation = this.getNationById(nationId);
            if (!nation) return;
            
            // Calculate percentage-based infrastructure damage (20-65%)
            const damagePercent = 0.20 + (Math.random() * 0.45); // 20% to 65%
            const currentInfra = nation.infra || 0;
            
            // Calculate infra loss with minimum of 100, or all remaining if less than 100
            let infraLoss = Math.floor(currentInfra * damagePercent);
            if (currentInfra < 100) {
                infraLoss = currentInfra; // Take all remaining if less than 100
            } else {
                infraLoss = Math.max(100, infraLoss); // Minimum of 100 if they have at least 100
            }
            
            nation.infra = Math.max(0, currentInfra - infraLoss);
            
            // Massive happiness penalty
            if (nation.temporaryEffects) {
                nation.temporaryEffects.push({
                    type: 'happinessReduction',
                    amount: this.NUKE_HAPPINESS_PENALTY,
                    turnsRemaining: 120, // 5 days
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
    }
    
    /**
     * Execute spy operation
     */
    executeSpyOperation(attackerNation, targetNation, attackerPlayer, operation) {
        // Calculate success chance based on spy counts and player skills
        const offensiveSpies = attackerNation.militaryUnits?.spies || 0;
        const defensiveSpies = targetNation.militaryUnits?.spies || 0;
        
        const aimSkill = attackerPlayer.getSkillValue('aim') || 0;
        const luckSkill = attackerPlayer.getSkillValue('luck') || 0;
        
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
                // Base 10% to 30% soldier elimination, min 10 units
                const soldierPercent = 0.10 + (Math.random() * 0.20);
                const currentSoldiers = targetNation.militaryUnits.soldiers || 0;
                let soldierLoss = Math.floor(currentSoldiers * soldierPercent);
                soldierLoss = Math.max(10, soldierLoss); // Minimum 10 soldiers
                soldierLoss = Math.min(soldierLoss, currentSoldiers); // Can't exceed available
                
                targetNation.militaryUnits.soldiers = Math.max(0, currentSoldiers - soldierLoss);
                result.message = `Eliminated ${soldierLoss} enemy soldiers (${Math.round(soldierPercent * 100)}% of forces)`;
                result.data.soldierLoss = soldierLoss;
                break;
                
            case 'targetTanks':
                // Base 8% to 25% tank sabotage, min 3 units
                const tankPercent = 0.08 + (Math.random() * 0.17);
                const currentTanks = targetNation.militaryUnits.tanks || 0;
                let tankLoss = Math.floor(currentTanks * tankPercent);
                tankLoss = Math.max(3, tankLoss); // Minimum 3 tanks
                tankLoss = Math.min(tankLoss, currentTanks); // Can't exceed available
                
                targetNation.militaryUnits.tanks = Math.max(0, currentTanks - tankLoss);
                result.message = `Sabotaged ${tankLoss} enemy tanks (${Math.round(tankPercent * 100)}% of armored units)`;
                result.data.tankLoss = tankLoss;
                break;
                
            case 'targetAircraft':
                // Base 10% to 35% aircraft destruction, min 2 units
                const aircraftPercent = 0.10 + (Math.random() * 0.25);
                const currentAircraft = targetNation.militaryUnits.aircraft || 0;
                let aircraftLoss = Math.floor(currentAircraft * aircraftPercent);
                aircraftLoss = Math.max(2, aircraftLoss); // Minimum 2 aircraft
                aircraftLoss = Math.min(aircraftLoss, currentAircraft); // Can't exceed available
                
                targetNation.militaryUnits.aircraft = Math.max(0, currentAircraft - aircraftLoss);
                result.message = `Destroyed ${aircraftLoss} enemy aircraft (${Math.round(aircraftPercent * 100)}% of air force)`;
                result.data.aircraftLoss = aircraftLoss;
                break;
                
            case 'targetShips':
                // Base 12% to 40% ship sinking, min 1 unit
                const shipPercent = 0.12 + (Math.random() * 0.28);
                const currentShips = targetNation.militaryUnits.ships || 0;
                let shipLoss = Math.floor(currentShips * shipPercent);
                shipLoss = Math.max(1, shipLoss); // Minimum 1 ship
                shipLoss = Math.min(shipLoss, currentShips); // Can't exceed available
                
                targetNation.militaryUnits.ships = Math.max(0, currentShips - shipLoss);
                result.message = `Sunk ${shipLoss} enemy ships (${Math.round(shipPercent * 100)}% of naval fleet)`;
                result.data.shipLoss = shipLoss;
                break;
                
            case 'targetMissiles':
                // Base 15% to 45% missile sabotage, min 1 unit
                const missilePercent = 0.15 + (Math.random() * 0.30);
                const currentMissiles = targetNation.militaryUnits.missiles || 0;
                let missileLoss = Math.floor(currentMissiles * missilePercent);
                missileLoss = Math.max(1, missileLoss); // Minimum 1 missile
                missileLoss = Math.min(missileLoss, currentMissiles); // Can't exceed available
                
                targetNation.militaryUnits.missiles = Math.max(0, currentMissiles - missileLoss);
                result.message = `Destroyed ${missileLoss} enemy missiles (${Math.round(missilePercent * 100)}% of stockpile)`;
                result.data.missileLoss = missileLoss;
                break;
                
            case 'targetNukes':
                // Base 20% to 45% nuke sabotage, min 1 unit
                const nukePercent = 0.20 + (Math.random() * 0.25);
                const currentNukes = targetNation.militaryUnits.nukes || 0;
                let nukeLoss = Math.floor(currentNukes * nukePercent);
                nukeLoss = Math.max(1, nukeLoss); // Minimum 1 nuke
                nukeLoss = Math.min(nukeLoss, currentNukes); // Can't exceed available
                
                targetNation.militaryUnits.nukes = Math.max(0, currentNukes - nukeLoss);
                result.message = `Sabotaged ${nukeLoss} enemy nuclear weapons (${Math.round(nukePercent * 100)}% of arsenal)`;
                result.data.nukeLoss = nukeLoss;
                break;
                
            case 'assassinateSpies':
                // Base 25% to 45% spy elimination, min 1 unit
                const spyPercent = 0.25 + (Math.random() * 0.20);
                const currentSpies = targetNation.militaryUnits.spies || 0;
                let spyLoss = Math.floor(currentSpies * spyPercent);
                spyLoss = Math.max(1, spyLoss); // Minimum 1 spy
                spyLoss = Math.min(spyLoss, currentSpies); // Can't exceed available
                
                targetNation.militaryUnits.spies = Math.max(0, currentSpies - spyLoss);
                result.message = `Eliminated ${spyLoss} enemy spies (${Math.round(spyPercent * 100)}% of intelligence network)`;
                result.data.spyLoss = spyLoss;
                break;
                
            default:
                result.success = false;
                result.message = 'Unknown operation type';
                break;
        }
        
        return result;
    }
    calculateBaseDamage(attackerNation, attackerPlayer) {
        // Base attack from player skills
        let baseDamage = attackerPlayer.getSkillValue('attack') || 0;
        
        // Add military unit contributions
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
        const attackValue = player.getSkillValue('attack') || 0;
        
        // Critical damage = critDamagePercent * attackValue
        return Math.floor(critDamagePercent); // Player contract: Critical Damage is a flat bonus
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
        
        return Math.floor(damage * bonusMultiplier);
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
        setTimeout(() => {
            this.endWarRound(warId);
        }, this.ROUND_DURATION_HOURS * 60 * 60 * 1000);
        
        EventBus.emit('war_round_started', {
            warId: warId,
            round: round,
            war: war
        });
        
        console.log(`War ${warId} Round ${war.currentRound} started`);
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
        
        // Process unit casualties
        this.processUnitCasualties(war, currentRound);
        
        // Check if war is over (best of 3)
        if (war.sides.attacker.roundsWon >= 2 || war.sides.defender.roundsWon >= 2 || war.currentRound >= 3) {
            this.endWar(warId);
        } else {
            // Start next round after a brief pause
            setTimeout(() => {
                this.startWarRound(warId);
            }, 60000); // 1 minute break between rounds
        }
        
        EventBus.emit('war_round_ended', {
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
        
        // Process attacker casualties
        const attackerCasualtyPercent = Math.min(0.25, round.damage.defender / totalDamage * 0.5);
        this.applyCasualties(war.sides.attacker, attackerCasualtyPercent);
        
        // Process defender casualties  
        const defenderCasualtyPercent = Math.min(0.25, round.damage.attacker / totalDamage * 0.5);
        this.applyCasualties(war.sides.defender, defenderCasualtyPercent);
    }
    
    /**
     * Apply casualties to a war side
     */
    applyCasualties(side, casualtyPercent) {
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
                    
                    nation.militaryUnits[unitType] = Math.max(0, currentUnits - actualCasualties);
                    
                    // Process resource recovery for destroyed tanks, aircraft, and ships
                    if (['tanks', 'aircraft', 'ships'].includes(unitType)) {
                        this.processResourceRecovery(nation, unitType, actualCasualties);
                    }
                    
                    // Update war statistics
                    const war = this.getWarByNationId(nationId);
                    if (war) {
                        const stats = war.participantStats.get(nationId);
                        if (stats) {
                            if (!stats.unitsLost[unitType]) {
                                stats.unitsLost[unitType] = 0;
                            }
                            stats.unitsLost[unitType] += actualCasualties;
                        }
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
        
        // Define resource costs for each unit type (simplified estimates)
        const unitCosts = {
            tanks: { steel: 50, aluminum: 30, gas: 25, ammo: 20 },
            aircraft: { aluminum: 80, steel: 40, gas: 60, ammo: 30 },
            ships: { steel: 100, aluminum: 50, gas: 40, cement: 30, ammo: 25 }
        };
        
        if (true) return; // resource recovery removed in money-only economy
        
        // Calculate recovered resources
        const unitCost = unitCosts[unitType];
        const recoveredResources = {};
        
        Object.entries(unitCost).forEach(([resource, cost]) => {
            recoveredResources[resource] = Math.floor(destroyedCount * cost * recoveryRate);
        });
        
        // Add recovered resources to nation
        Object.entries(recoveredResources).forEach(([resource, amount]) => {
            if (amount > 0) {
                nation.resources[resource] = (nation.resources[resource] || 0) + amount;
            }
        });
        
        console.log(`Recovered resources from ${destroyedCount} destroyed ${unitType}:`, recoveredResources);
        
        // Emit event for UI updates
        EventBus.emit('resources_recovered', {
            nation: nation,
            unitType: unitType,
            destroyedCount: destroyedCount,
            recoveredResources: recoveredResources,
            recoveryRate: recoveryRate
        });
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
        
        // Process war rewards and penalties
        this.processWarOutcome(war);
        
        // Remove war from active wars after a delay (for viewing results)
        setTimeout(() => {
            this.activeWars.delete(warId);
        }, 24 * 60 * 60 * 1000); // Keep for 24 hours
        
        EventBus.emit('war_ended', {
            warId: warId,
            war: war,
            winner: warWinner
        });
        
        console.log(`War ${warId} ended. Winner: ${warWinner}`);
    }
    /**
     * Process energy regeneration for all players
     */
    processEnergyRegeneration() {
        // This would typically iterate through all players
        // For now, emit event for other systems to handle
        EventBus.emit('energy_regeneration_tick');
        
        if (window.Player) {
            const currentEnergy = window.Player.energy || 0;
            const maxEnergy = window.Player.maxEnergy || this.MAX_ENERGY;
            const regenAmount = Math.floor(maxEnergy * (this.ENERGY_REGEN_PERCENT / 100));
            
            window.Player.energy = Math.min(maxEnergy, currentEnergy + regenAmount);
            
            console.log(`Energy regenerated: ${window.Player.energy}/${maxEnergy} (+${regenAmount})`);
        }
    }
    
    /**
     * Process war outcome rewards and penalties
     */
    processWarOutcome(war) {
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
     * Utility functions
     */
    getNationById(nationId) {
        // This would integrate with your nation management system
        if (window.Nation && window.Nation.id === nationId) {
            return window.Nation;
        }
        // In a full implementation, this would query a nations database
        return null;
    }
    
    getPlayerByNationId(nationId) {
        // For single player game, return the global Player if it matches the nation
        if (window.Player && window.Nation && window.Nation.id === nationId) {
            return window.Player;
        }
        // In multiplayer implementation, this would query a players database
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
    
    hasAvailableOffensiveSlots(nation) {
        let maxOffensiveWars = 2; // Base capacity
        
        // Command Centers increase war capacity
        if (nation.projectEffects?.offensiveWarSlots) {
            maxOffensiveWars = nation.projectEffects.offensiveWarSlots;
        }
        
        // Count current offensive wars (wars where this nation is attacking)
        let currentOffensiveWars = 0;
        this.activeWars.forEach(war => {
            if (war.sides.attacker.nations.includes(nation.id)) {
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
            if (war.sides.defender.nations.includes(nation.id)) {
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
            if (attackData.isCritical) {
                stats.criticalHits++;
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
     * Get war statistics for a nation
     */
    getWarStats(nationId) {
        const stats = {
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
                stats.totalWars++;
                if (war.status === 'active') {
                    stats.activeWars++;
                }
                stats.totalAttacks += participantStats.attacks;
                stats.totalDamage += participantStats.damage;
                stats.criticalHits += participantStats.criticalHits;
                stats.blocks += participantStats.blocks;
                stats.parries += participantStats.parries;
                
                Object.keys(participantStats.unitsLost).forEach(unitType => {
                    if (!stats.unitsLost[unitType]) {
                        stats.unitsLost[unitType] = 0;
                    }
                    stats.unitsLost[unitType] += participantStats.unitsLost[unitType];
                });
            }
        });
        
        return stats;
    }
    
    /**
     * Handle event callbacks
     */
    handleWarDeclaration(data) {
        try {
            return this.declareWar(data);
        } catch (error) {
            console.error('War declaration failed:', error.message);
            EventBus.emit('war_declaration_failed', { error: error.message, data });
        }
    }
    
    handleJoinWar(data) {
        try {
            return this.joinWar(data);
        } catch (error) {
            console.error('Join war failed:', error.message);
            EventBus.emit('join_war_failed', { error: error.message, data });
        }
    }
    
    handleWarAttack(data) {
        try {
            return this.executeAttack(data);
        } catch (error) {
            console.error('War attack failed:', error.message);
            EventBus.emit('war_attack_failed', { error: error.message, data });
        }
    }
    
    handleMissileLaunch(data) {
        try {
            return this.launchMissile(data);
        } catch (error) {
            console.error('Missile launch failed:', error.message);
            EventBus.emit('missile_launch_failed', { error: error.message, data });
        }
    }
    
    handleNukeLaunch(data) {
        try {
            return this.launchNuke(data);
        } catch (error) {
            console.error('Nuke launch failed:', error.message);
            EventBus.emit('nuke_launch_failed', { error: error.message, data });
        }
    }
    
    handleSpyOperation(data) {
        try {
            return this.launchSpyOperation(data);
        } catch (error) {
            console.error('Spy operation failed:', error.message);
            EventBus.emit('spy_operation_failed', { error: error.message, data });
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
                    EventBus.emit('treaty_obligation_created', {
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
                        
                        EventBus.emit('treaty_obligation_fulfilled', {
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
}

// Export the system
window.WarSystem = WarSystem;