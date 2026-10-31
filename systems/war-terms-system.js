/**
 * War Terms System - Casus Belli, War Type Boosts, Peace Mechanics, and Loot/Destruction Formulas
 * Dominion Wars - Nation Building Strategy Game
 *
 * This system is the TRUTH SOURCE for all war terms mechanics that WarSystem uses.
 * It handles:
 *   - Casus belli types (general dispute, land grab, destruction, cash raid, tech raid, etc.)
 *   - War type modifiers/boosts
 *   - Peace mechanics (offer terms: Land/Cash/Tech/Peace Length/nothing)
 *   - Loot/destruction formulas based on damage dealt, unit type, tech, player skills, casus belli, war type
 *   - Currency conversion via EconomySystem
 */

class WarTermsSystem {
    constructor() {
        this.isInitialized = false;

        // Nation lookup map: nationId -> nation object. Populated externally (e.g. by WarSystem).
        this.nationLookup = new Map();

        // ══════════════════════════════════════════════════════════════════════════
        // CASUS BELLI TYPES
        // ══════════════════════════════════════════════════════════════════════════

        this.casusBelli = {
            general_dispute: {
                id: 'general_dispute',
                name: 'General Dispute',
                description: 'A standard war with no special modifiers.',
                damageMultiplier: 1.0,
                infraDamageMultiplier: 1.0,
                lootMultiplier: 1.0,
                techLootMultiplier: 1.0,
                landLootMultiplier: 1.0,
                populationPenaltyMultiplier: 1.0
            },
            land_grab: {
                id: 'land_grab',
                name: 'Land Grab',
                description: 'War fought to seize territory. All nations steal/lose more land.',
                damageMultiplier: 0.9,
                infraDamageMultiplier: 1.1,
                lootMultiplier: 0.8,
                techLootMultiplier: 0.6,
                landLootMultiplier: 2.5,
                populationPenaltyMultiplier: 1.2
            },
            destruction: {
                id: 'destruction',
                name: 'Destruction',
                description: 'War focused on maximum damage. All nations do/take more damage.',
                damageMultiplier: 1.5,
                infraDamageMultiplier: 1.6,
                lootMultiplier: 0.7,
                techLootMultiplier: 0.5,
                landLootMultiplier: 0.3,
                populationPenaltyMultiplier: 1.5
            },
            cash_raid: {
                id: 'cash_raid',
                name: 'Cash Raid',
                description: 'War focused on looting currency. All nations steal/lose more currency.',
                damageMultiplier: 0.8,
                infraDamageMultiplier: 0.9,
                lootMultiplier: 2.0,
                techLootMultiplier: 0.4,
                landLootMultiplier: 0.2,
                populationPenaltyMultiplier: 0.9
            },
            tech_raid: {
                id: 'tech_raid',
                name: 'Tech Raid',
                description: 'War focused on stealing technology. All nations steal/lose more tech.',
                damageMultiplier: 0.7,
                infraDamageMultiplier: 0.8,
                lootMultiplier: 0.6,
                techLootMultiplier: 2.5,
                landLootMultiplier: 0.2,
                populationPenaltyMultiplier: 0.8
            },
            show_of_force: {
                id: 'show_of_force',
                name: 'Show of Force',
                description: 'A display of military might. Only peace length can be demanded. Heavy damage boost, no looting.',
                damageMultiplier: 2.25,
                infraDamageMultiplier: 1.0,
                lootMultiplier: 0.0,
                techLootMultiplier: 0.0,
                landLootMultiplier: 0.0,
                populationPenaltyMultiplier: 1.0
            },
            free_looting: {
                id: 'free_looting',
                name: 'Free Looting',
                description: 'War purely for looting. High cash/tech/land loot, minimal damage.',
                damageMultiplier: 0.5,
                infraDamageMultiplier: 0.5,
                lootMultiplier: 1.75,
                techLootMultiplier: 1.75,
                landLootMultiplier: 1.75,
                populationPenaltyMultiplier: 0.8
            },
            humiliation: {
                id: 'humiliation',
                name: 'Humiliation',
                description: 'War to force enemy into harsh peace terms. Longer peace length allowed. Lower damage/loot since it is a peace-seeking casus belli.',
                damageMultiplier: 0.9,
                infraDamageMultiplier: 1.0,
                lootMultiplier: 0.8,
                techLootMultiplier: 0.9,
                landLootMultiplier: 0.9,
                populationPenaltyMultiplier: 1.1
            }
        };

        // ══════════════════════════════════════════════════════════════════════════
        // WAR TYPE MODIFIERS (solo_nation, nation, solo_alliance, alliance)
        // ══════════════════════════════════════════════════════════════════════════

        this.warTypeModifiers = {
            solo_nation: {
                name: 'Solo Nation War',
                description: '1v1 nation war, no other nations can join.',
                maxParticipantsPerSide: 1,
                damageMultiplier: 1.0,
                lootMultiplier: 1.0,
                allowsExternalJoining: false,
                allowsAllianceMembers: false
            },
            nation: {
                name: 'Nation War',
                description: 'Nation vs Nation (NvN). Up to 24 nations per side (starting nation plus 23 joiners).',
                maxParticipantsPerSide: 24,
                damageMultiplier: 1.0,
                lootMultiplier: 1.0,
                allowsExternalJoining: true,
                allowsAllianceMembers: false
            },
            solo_alliance: {
                name: 'Solo Alliance War',
                description: 'Alliance vs Alliance (1v1 alliance). Only the two starting alliances participate; all members of each alliance are allowed regardless of size.',
                maxParticipantsPerSide: 1,
                damageMultiplier: 1.1,
                lootMultiplier: 1.2,
                allowsExternalJoining: false,
                allowsAllianceMembers: true
            },
            alliance: {
                name: 'Alliance War',
                description: 'Alliance vs Alliance (AvA). Up to 5 whole alliances per side (starting alliance plus 4 joiners). All alliance members participate regardless of size.',
                maxParticipantsPerSide: 5,
                damageMultiplier: 1.2,
                lootMultiplier: 1.4,
                allowsExternalJoining: true,
                allowsAllianceMembers: true
            }
        };

        // ══════════════════════════════════════════════════════════════════════════
        // PEACE TERM TYPES
        // ══════════════════════════════════════════════════════════════════════════

        this.peaceTermTypes = {
            land_annexation: {
                id: 'land_annexation',
                name: 'Land Annexation',
                description: 'Transfer land/territory from loser to winner.',
                defaultMaxPercentage: 10,
                maxPercentages: {
                    land_grab: 20,
                    humiliation: 10,
                    free_looting: 15
                },
                requiresCasusBelli: ['land_grab', 'humiliation', 'free_looting']
            },
            cash_reparations: {
                id: 'cash_reparations',
                name: 'Cash Reparations',
                description: 'Transfer currency from loser to winner.',
                defaultMaxPercentage: 15,
                maxPercentages: {
                    cash_raid: 33,
                    humiliation: 20,
                    free_looting: 25
                },
                requiresCasusBelli: ['cash_raid', 'humiliation', 'free_looting']
            },
            tech_transfer: {
                id: 'tech_transfer',
                name: 'Technology Transfer',
                description: 'Transfer technology points from loser to winner.',
                defaultMaxPercentage: 5,
                maxPercentages: {
                    tech_raid: 15,
                    humiliation: 10,
                    free_looting: 12
                },
                requiresCasusBelli: ['tech_raid', 'humiliation', 'free_looting']
            },
            peace_length: {
                id: 'peace_length',
                name: 'Peace Length',
                description: 'Mandatory peace period (cannot declare war on each other).',
                defaultMaxDays: 90,
                maxDaysByCasusBelli: {
                    humiliation: 365,
                    show_of_force: 180
                },
                requiresCasusBelli: null
            },
            nothing: {
                id: 'nothing',
                name: 'White Peace',
                description: 'End war with no terms (status quo ante bellum).',
                maxDays: 0,
                requiresCasusBelli: null
            }
        };

        // ══════════════════════════════════════════════════════════════════════════
        // LOOT / DESTRUCTION FORMULA CONFIGURATION
        // ══════════════════════════════════════════════════════════════════════════

        // Unit type loot multipliers — higher-tier units yield slightly more loot per damage dealt
        // Missiles and nukes yield 0 loot (they are launched/used, not killed in combat for loot)
        this.unitLootMultipliers = {
            soldiers: 1.0,
            tanks: 1.1,
            aircraft: 1.25,
            ships: 1.5,
            spies: 2.0,
            missiles: 0.0,
            nukes: 0.0
        };

        // Base share of damage converted to loot value
        this.lootDamageShare = 0.005; // 0.5% of damage dealt becomes loot value

        // Tech efficiency: each point of attacker tech adds this to loot multiplier
        this.techLootEfficiency = 0.00005;

        // Critical loot scaling: critChance * critDamage contributes this fraction to skill bonus
        this.critLootScale = 0.1;

        // Random loot variance: randomInt (0-100) maps to 0.5x - 2.0x multiplier
        this.lootRandomMin = 0.5;
        this.lootRandomMax = 2.0;

        // Per-unit destruction values (population only — no unit destroys infra when killed)
        this.unitDestructionValues = {
            soldiers: { infra: 0, population: 1 },
            tanks: { infra: 0, population: 2 },
            aircraft: { infra: 0, population: 3 },
            ships: { infra: 0, population: 5 },
            spies: { infra: 0, population: 1 },
            missiles: { infra: 0, population: 0 },
            nukes: { infra: 0, population: 0 }
        };

        // Infrastructure damage per round based on damage dealt
        this.infraDamagePerDamageDealt = 0.002; // 0.2% of damage dealt becomes infra damage
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═════════════════════════════════════════════════════════════════════════════

    async initialize() {
        this.isInitialized = true;
        console.log('War Terms System initialized');
        return true;
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // CASUS BELLI METHODS
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * Get all available casus belli types
     */
    getCasusBelliTypes() {
        return { ...this.casusBelli };
    }

    /**
     * Get a specific casus belli configuration
     */
    getCasusBelli(casusBelliId) {
        return this.casusBelli[casusBelliId] || null;
    }

    /**
     * Validate that a casus belli ID is valid
     */
    isValidCasusBelli(casusBelliId) {
        return !!this.casusBelli[casusBelliId];
    }

    /**
     * Get casus belli modifier for a specific attribute
     */
    getCasusBelliModifier(casusBelliId, attribute) {
        const cb = this.casusBelli[casusBelliId];
        if (!cb) return 1.0;
        const val = cb[attribute];
        return val !== undefined ? val : 1.0;
    }

    /**
     * Check if a casus belli allows a specific peace term type
     */
    doesCasusBelliAllowTerm(casusBelliId, termTypeId) {
        const cb = this.casusBelli[casusBelliId];
        if (!cb) return false;

        const termConfig = this.peaceTermTypes[termTypeId];
        if (!termConfig) return false;

        if (!termConfig.requiresCasusBelli) return true; // null means all allowed
        return termConfig.requiresCasusBelli.includes(casusBelliId);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // WAR TYPE METHODS
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * Get all war type modifiers
     */
    getWarTypeModifiers() {
        return { ...this.warTypeModifiers };
    }

    /**
     * Get a specific war type modifier
     */
    getWarTypeModifier(warTypeId) {
        return this.warTypeModifiers[warTypeId] || null;
    }

    /**
     * Get combined modifier for war type + casus belli
     */
    getCombinedWarModifier(warTypeId, casusBelliId, attribute) {
        const warTypeMod = this.warTypeModifiers[warTypeId];
        const cbMod = this.casusBelli[casusBelliId];

        let total = 1.0;
        if (warTypeMod && warTypeMod[attribute] !== undefined) {
            total *= warTypeMod[attribute];
        }
        if (cbMod && cbMod[attribute] !== undefined) {
            total *= cbMod[attribute];
        }
        return total;
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // LOOT / DESTRUCTION FORMULAS
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * Calculate loot gained from an attack based on damage dealt.
     * Complex formula: unit type mix, attacker tech, player skills (aim, luck, critChance, critDamage),
     * casus belli, war type, and a random integer.
     *
     * @param {number} damageDealt - Total damage dealt in the attack
     * @param {Object} unitMix - Unit types involved { soldiers: n, tanks: n, ... }
     * @param {number} attackerTech - Attacker nation's tech level
     * @param {Object} attackerSkills - { aim, luck, criticalChance, criticalDamage, attack, defense }
     * @param {string} casusBelliId
     * @param {string} warTypeId
     * @param {number} randomInt - Random integer 0-100 for loot variance
     * @returns {Object} { cash, tech }
     */
    calculateAttackLoot(damageDealt, unitMix = {}, attackerTech = 0, attackerSkills = {}, casusBelliId, warTypeId, randomInt) {
        const cbMod = this.getCasusBelliModifier(casusBelliId, 'lootMultiplier');
        const warTypeMod = this.warTypeModifiers[warTypeId]?.lootMultiplier || 1.0;

        // Base loot value from damage dealt
        let baseValue = damageDealt * this.lootDamageShare;

        // Unit type multiplier — weighted average of unit types involved
        let totalUnits = 0;
        let weightedMult = 0;
        Object.entries(unitMix).forEach(([type, count]) => {
            const mult = this.unitLootMultipliers[type] || 1.0;
            weightedMult += count * mult;
            totalUnits += count;
        });
        const unitMultiplier = totalUnits > 0 ? weightedMult / totalUnits : 1.0;

        // Tech multiplier — attacker tech improves looting efficiency
        const techMultiplier = 1 + (attackerTech * this.techLootEfficiency);

        // Skill multipliers — aim, luck, critChance, critDamage
        const aim = attackerSkills.aim || 0;
        const luck = attackerSkills.luck || 0;
        const critChance = attackerSkills.criticalChance || 0;
        const critDamage = attackerSkills.criticalDamage || 0;
        const skillMultiplier = 1 + aim + luck + (critChance * critDamage * this.critLootScale);

        // Default randomInt to a random value 0-100 if not provided
        if (randomInt === undefined) {
            randomInt = Math.floor(Math.random() * 101);
        }

        // Random integer factor — 0.5x to 2.0x based on randomInt (0-100)
        const randomFactor = this.lootRandomMin + (randomInt / 100) * (this.lootRandomMax - this.lootRandomMin);

        let totalCash = baseValue * unitMultiplier * techMultiplier * skillMultiplier * cbMod * warTypeMod * randomFactor;
        let totalTech = totalCash * 0.05; // tech is 5% of cash loot value

        return {
            cash: Math.floor(Math.max(0, totalCash)),
            tech: Math.floor(Math.max(0, totalTech))
        };
    }

    /**
     * Calculate units destroyed/lost in combat between attacker and defender.
     * Only starting nations count (joiners excluded). Uses Attack skill for the side
     * clicking "attack" and Defense skill for the side being attacked. Defender's
     * skills and tech are included in mitigation.
     *
     * @param {number} attackerDamage - Damage dealt by the side clicking attack
     * @param {number} defenderDamage - Counter-damage dealt by the other side
     * @param {Object} attackerSkills - Skills of the side clicking attack (uses .attack)
     * @param {Object} defenderSkills - Skills of the side being attacked (uses .defense, .block, .parry)
     * @param {number} attackerTech - Tech of the side clicking attack
     * @param {number} defenderTech - Tech of the side being attacked
     * @param {string} casusBelliId
     * @param {string} warTypeId
     * @returns {Object} { attackerUnitsLost, defenderUnitsLost, mitigation }
     */
    calculateUnitsDestroyed(attackerDamage, defenderDamage, attackerSkills = {}, defenderSkills = {}, attackerTech = 0, defenderTech = 0, casusBelliId, warTypeId) {
        const cbMod = this.getCasusBelliModifier(casusBelliId, 'damageMultiplier');
        const warTypeMod = this.warTypeModifiers[warTypeId]?.damageMultiplier || 1.0;

        // Attacker's effective attack power (uses Attack skill)
        const attackerAttackPower = (attackerSkills.attack || 0) + (attackerTech * 0.1);

        // Defender's effective defense power (uses Defense skill + tech)
        const defenderDefensePower = (defenderSkills.defense || 0) + (defenderTech * 0.1);

        // Damage mitigation from defender (0 to 1, higher = more mitigation)
        const mitigation = defenderDefensePower / (attackerAttackPower + defenderDefensePower + 1);

        // Defender loses units from attacker's damage, reduced by mitigation
        const defenderUnitsLost = Math.floor((attackerDamage * cbMod * warTypeMod) / 50 * (1 - mitigation));

        // Attacker loses units from defender's counter-damage, reduced by mitigation
        const attackerUnitsLost = Math.floor((defenderDamage * cbMod * warTypeMod) / 50 * mitigation);

        return {
            attackerUnitsLost: Math.max(0, attackerUnitsLost),
            defenderUnitsLost: Math.max(0, defenderUnitsLost),
            mitigation
        };
    }

    /**
     * Calculate infrastructure destruction from combat damage dealt.
     * No unit destroys infra when killed — infra comes from damage dealt only.
     */
    calculateInfraDestruction(damageDealt, casusBelliId, warTypeId) {
        const cbMod = this.getCasusBelliModifier(casusBelliId, 'infraDamageMultiplier');
        const warTypeMod = this.warTypeModifiers[warTypeId]?.damageMultiplier || 1.0;

        // Base infra damage from damage dealt
        const infraFromDamage = damageDealt * this.infraDamagePerDamageDealt * cbMod * warTypeMod;

        return {
            infraFromDamage: Math.floor(Math.max(0, infraFromDamage)),
            infraFromUnits: 0,
            totalInfra: Math.floor(Math.max(0, infraFromDamage))
        };
    }

    /**
     * Calculate population casualties from units lost.
     * Based on units lost by each side and casus belli population penalty.
     */
    calculatePopulationCasualties(unitsLost, casusBelliId) {
        const cbMod = this.getCasusBelliModifier(casusBelliId, 'populationPenaltyMultiplier');

        let totalPopulation = 0;
        Object.entries(unitsLost).forEach(([unitType, count]) => {
            const unitValue = this.unitDestructionValues[unitType];
            if (unitValue && unitValue.population) {
                totalPopulation += count * unitValue.population;
            }
        });

        return Math.floor(totalPopulation * cbMod);
    }

    /**
     * Calculate cash reparations based on damage dealt and casus belli.
     */
    calculateCashReparations(damageDealt, casusBelliId, warTypeId) {
        const cbMod = this.getCasusBelliModifier(casusBelliId, 'lootMultiplier');
        const warTypeMod = this.warTypeModifiers[warTypeId]?.lootMultiplier || 1.0;

        // Base: 1% of damage dealt as cash
        let cashReparation = damageDealt * 0.01 * cbMod * warTypeMod;

        return Math.floor(cashReparation);
    }

    /**
     * Calculate tech loot from enemy technology.
     * Based on enemy tech, casus belli, and war type.
     */
    calculateTechLoot(enemyTech, casusBelliId, warTypeId) {
        const cbMod = this.getCasusBelliModifier(casusBelliId, 'techLootMultiplier');
        const warTypeMod = this.warTypeModifiers[warTypeId]?.lootMultiplier || 1.0;

        // Base: 5% of enemy tech can be looted
        let techLoot = enemyTech * 0.05 * cbMod * warTypeMod;

        return Math.floor(techLoot);
    }

    /**
     * Calculate land annexation based on casus belli and war type.
     * Based on enemy land, casus belli, and war type.
     */
    calculateLandAnnexation(enemyLand, casusBelliId, warTypeId) {
        const cbMod = this.getCasusBelliModifier(casusBelliId, 'landLootMultiplier');
        const warTypeMod = this.warTypeModifiers[warTypeId]?.lootMultiplier || 1.0;

        // Base: 10% of enemy land can be annexed
        let landAnnexed = enemyLand * 0.10 * cbMod * warTypeMod;

        return Math.floor(landAnnexed);
    }

    /**
     * Calculate total war loot from all combat in a war round.
     * Uses the new damage-based loot formula (calculateAttackLoot).
     */
    calculateWarRoundLoot(warRound, casusBelliId, warTypeId, attackerTech = 0, defenderTech = 0, attackerSkills = {}, defenderSkills = {}, randomInt = 50) {
        const totalLoot = {
            cash: 0,
            tech: 0,
            infra: 0,
            population: 0
        };

        // Process both sides' damage
        ['attacker', 'defender'].forEach(side => {
            const roundDamage = warRound.damage?.[side] || 0;
            const unitMix = warRound.unitMix?.[side] || {};

            const loot = this.calculateAttackLoot(
                roundDamage,
                unitMix,
                side === 'attacker' ? attackerTech : defenderTech,
                side === 'attacker' ? attackerSkills : defenderSkills,
                casusBelliId,
                warTypeId,
                randomInt
            );

            const destruction = this.calculateInfraDestruction(
                roundDamage,
                casusBelliId,
                warTypeId
            );

            totalLoot.cash += loot.cash;
            totalLoot.tech += loot.tech;
            totalLoot.infra += destruction.totalInfra;
        });

        return totalLoot;
    }

    /**
     * Estimate unit mix from damage dealt (approximation when exact unit counts aren't available).
     * Returns a weighted mix biased toward higher-tier units as damage increases.
     */
    estimateUnitMixFromDamage(damage) {
        return {
            soldiers: Math.floor(damage / 10),
            tanks: Math.floor(damage / 500),
            aircraft: Math.floor(damage / 2000),
            ships: Math.floor(damage / 4000),
            spies: Math.floor(damage / 10000)
        };
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // PEACE TERMS METHODS
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * Get all peace term types
     */
    getPeaceTermTypes() {
        return { ...this.peaceTermTypes };
    }

    /**
     * Get a specific peace term type configuration
     */
    getPeaceTermType(termTypeId) {
        return this.peaceTermTypes[termTypeId] || null;
    }

    /**
     * Get the casus-belli-specific max value for a peace term.
     * Returns the maxPercentage (for % terms) or maxDays (for peace_length).
     */
    getPeaceTermMax(termTypeId, casusBelliId) {
        const termConfig = this.peaceTermTypes[termTypeId];
        if (!termConfig) return null;

        if (termTypeId === 'peace_length') {
            return termConfig.maxDaysByCasusBelli?.[casusBelliId] ?? termConfig.defaultMaxDays;
        }

        // percentage-based terms (land_annexation, cash_reparations, tech_transfer)
        return termConfig.maxPercentages?.[casusBelliId] ?? termConfig.defaultMaxPercentage;
    }

    /**
     * Validate a peace term offer
     */
    validatePeaceTerm(war, offeringNationId, termTypeId, termValue) {
        const termConfig = this.peaceTermTypes[termTypeId];
        if (!termConfig) {
            return { valid: false, error: 'Invalid peace term type' };
        }

        // Check casus belli compatibility
        const cbId = war.casusBelliId || 'general_dispute';
        if (!this.doesCasusBelliAllowTerm(cbId, termTypeId)) {
            return {
                valid: false,
                error: `Casus belli "${cbId}" does not allow "${termTypeId}" terms`
            };
        }

        // Resolve casus-belli-specific max
        const max = this.getPeaceTermMax(termTypeId, cbId);

        // Validate term value is a finite number
        if (typeof termValue !== 'number' || !Number.isFinite(termValue)) {
            return {
                valid: false,
                error: 'Term value must be a valid number'
            };
        }

        // Validate term value against max limits
        switch (termTypeId) {
            case 'land_annexation':
            case 'cash_reparations':
            case 'tech_transfer':
                if (termValue < 0 || (max != null && termValue > max)) {
                    return {
                        valid: false,
                        error: `${termConfig.name} must be between 0% and ${max}%`
                    };
                }
                break;
            case 'peace_length':
                if (termValue < 0 || (max != null && termValue > max)) {
                    return {
                        valid: false,
                        error: `Peace length must be between 0 and ${max} days`
                    };
                }
                break;
            case 'nothing':
                // White peace - always valid
                break;
            default:
                return { valid: false, error: 'Unknown peace term type' };
        }

        return { valid: true };
    }

    /**
     * Create a peace term offer
     */
    createPeaceTermOffer(offeringNationId, targetNationId, termTypeId, termValue, casusBelliId, warTypeId) {
        const termConfig = this.peaceTermTypes[termTypeId];
        if (!termConfig) {
            return { valid: false, error: `Invalid peace term type: ${termTypeId}` };
        }

        // Validate the offer before creating it
        const validation = this.validatePeaceTerm(
            { casusBelliId: casusBelliId || 'general_dispute' },
            offeringNationId,
            termTypeId,
            termValue
        );
        if (!validation.valid) {
            return { valid: false, error: validation.error };
        }

        return {
            valid: true,
            offeringNationId,
            targetNationId,
            termTypeId,
            termTypeName: termConfig.name,
            termValue,
            casusBelliId,
            warTypeId,
            timestamp: Date.now(),
            status: 'pending'
        };
    }

    /**
     * Apply accepted peace terms to nations
     */
    applyPeaceTerms(war, terms, economySystem = null) {
        if (!terms || terms.termTypeId === 'nothing') {
            return { applied: true, effects: [] };
        }

        const effects = [];
        const { termTypeId, termValue, offeringNationId, targetNationId } = terms;

        // Peace terms can only be exchanged between the starting nations
        // (original attacker and original defender). Joiners cannot offer or receive terms.
        const originalAttacker = war.originalAttacker;
        const originalDefender = war.originalDefender;
        const isStartingNation = (id) => id === originalAttacker || id === originalDefender;

        if (!isStartingNation(offeringNationId) || !isStartingNation(targetNationId)) {
            return {
                applied: false,
                error: 'Peace terms can only be offered between the original warring nations (original attacker and original defender). Joiners cannot participate in peace terms.'
            };
        }

        if (offeringNationId === targetNationId) {
            return {
                applied: false,
                error: 'A nation cannot offer peace terms to itself.'
            };
        }

        // Determine which side is offering and which is receiving
        const offeringNation = this.getNationById(offeringNationId);
        const targetNation = this.getNationById(targetNationId);

        if (!offeringNation || !targetNation) {
            return { applied: false, error: 'Nation not found' };
        }

        // Determine the currency used by the target nation (fall back to aurel)
        const targetCurrency = targetNation.currencyBalances
            ? Object.keys(targetNation.currencyBalances)[0] || 'aurel'
            : (targetNation.currency || 'aurel');
        const offeringCurrency = offeringNation.currencyBalances
            ? Object.keys(offeringNation.currencyBalances)[0] || 'aurel'
            : (offeringNation.currency || 'aurel');

        switch (termTypeId) {
            case 'cash_reparations': {
                // Calculate cash amount based on percentage of target's money
                const targetMoney = targetNation.currencyBalances?.[targetCurrency] ?? targetNation.money ?? 0;
                const cashAmount = Math.floor(targetMoney * (termValue / 100));

                if (cashAmount > 0 && economySystem) {
                    const transferResult = economySystem.transferCurrency(
                        targetNation,
                        offeringNation,
                        cashAmount,
                        targetCurrency,
                        offeringCurrency
                    );

                    if (transferResult.ok) {
                        effects.push({
                            type: 'cash_reparations',
                            from: targetNationId,
                            to: offeringNationId,
                            amount: transferResult.amountReceived,
                            currency: offeringCurrency
                        });
                    } else {
                        return {
                            applied: false,
                            error: 'EconomySystem transfer failed'
                        };
                    }
                } else if (cashAmount > 0) {
                    // Fallback direct transfer (no EconomySystem)
                    // Note: cashAmount is in targetCurrency units; no conversion applied in fallback
                    if (targetNation.currencyBalances) {
                        targetNation.currencyBalances[targetCurrency] = Math.max(
                            0,
                            (targetNation.currencyBalances[targetCurrency] || 0) - cashAmount
                        );
                        offeringNation.currencyBalances[offeringCurrency] =
                            (offeringNation.currencyBalances[offeringCurrency] || 0) + cashAmount;
                    } else {
                        targetNation.money = Math.max(0, (targetNation.money || 0) - cashAmount);
                        offeringNation.money = (offeringNation.money || 0) + cashAmount;
                    }
                    effects.push({
                        type: 'cash_reparations',
                        from: targetNationId,
                        to: offeringNationId,
                        amount: cashAmount,
                        currency: targetCurrency
                    });
                }
                break;
            }

            case 'tech_transfer': {
                const targetTech = targetNation.tech || 0;
                const techAmount = Math.floor(targetTech * (termValue / 100));

                if (techAmount > 0) {
                    targetNation.tech = Math.max(0, targetTech - techAmount);
                    offeringNation.tech = (offeringNation.tech || 0) + techAmount;
                    effects.push({
                        type: 'tech_transfer',
                        from: targetNationId,
                        to: offeringNationId,
                        amount: techAmount
                    });
                }
                break;
            }

            case 'land_annexation': {
                const targetLand = targetNation.land || targetNation.infra || 0;
                const landAmount = Math.floor(targetLand * (termValue / 100));

                if (landAmount > 0) {
                    targetNation.land = Math.max(0, (targetNation.land || 0) - landAmount);
                    offeringNation.land = (offeringNation.land || 0) + landAmount;
                    effects.push({
                        type: 'land_annexation',
                        from: targetNationId,
                        to: offeringNationId,
                        amount: landAmount
                    });
                }
                break;
            }

            case 'peace_length': {
                effects.push({
                    type: 'peace_length',
                    from: targetNationId,
                    to: offeringNationId,
                    days: termValue,
                    expiresAt: Date.now() + (termValue * 24 * 60 * 60 * 1000)
                });
                break;
            }
        }

        return { applied: true, effects };
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // NATION ACCESS HELPERS (delegates to global window objects)
    // ═════════════════════════════════════════════════════════════════════════════

    getNationById(nationId) {
        if (this.nationLookup.has(nationId)) {
            return this.nationLookup.get(nationId);
        }
        if (window.Nation && window.Nation.id === nationId) {
            return window.Nation;
        }
        // Fall back to GameEngine.nations for multiplayer/joined nations
        if (window.GameEngine && window.GameEngine.nations) {
            const found = Object.values(window.GameEngine.nations).find(n => n.id === nationId);
            if (found) return found;
        }
        // In multiplayer, this would query a nations database
        return null;
    }

    /**
     * Register a nation in the lookup map so peace terms and other nation-scoped
     * operations can resolve it by id.
     */
    registerNation(nation) {
        if (nation && nation.id) {
            if (this.nationLookup.has(nation.id)) {
                console.warn(`WarTermsSystem: nation ${nation.id} already registered, overwriting`);
            }
            this.nationLookup.set(nation.id, nation);
        }
    }

    /**
     * Register multiple nations at once.
     */
    registerNations(nations) {
        nations.forEach(nation => this.registerNation(nation));
    }
}

// Export the system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WarTermsSystem;
}
if (typeof window !== 'undefined') {
    window.WarTermsSystem = WarTermsSystem;
}
