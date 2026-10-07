/**
 * Player Entity — Progression, Skills, and Legendary System
 * Dominion Wars - Nation Building Strategy Game
 *
 * ── LEVELING ──────────────────────────────────────────────────────────────────
 *   • 100 levels per "legendary cycle"
 *   • XP to advance from level N to N+1:
 *       floor( 100 × 2 × GROWTH_FACTOR^(N-1) × legendaryLevel )
 *     where GROWTH_FACTOR = 1.12, legendaryLevel starts at 1
 *   • Level 1→2 costs 200 XP (legendaryLevel 1), 400 XP after first legendary, etc.
 *   • At level 100 the player may voluntarily "Go Legendary" (no auto-trigger).
 *     This resets level to 1 and increments legendaryLevel (2, 3, 4 …).
 *
 * ── SKILL POINTS ──────────────────────────────────────────────────────────────
 *   • Start at 0 unallocated skill points
 *   • Gain 5 skill points per level → 500 total at level 100
 *   • Legendary: each legendary level awards 2 PERMANENT legendary bonus points
 *     (separate from normal skill points; kept across resets; +1 point = same
 *      stat boost as one normal skill level for that skill)
 *
 * ── SKILL COST TABLE (per-skill, 20 levels, total = 75 points) ────────────────
 *   Level:  1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18  19  20
 *   Cost:   1   1   2   2   2   3   3   3   4   4   5   5   5   5   5   5   5   5   5   5
 *   Total:                                                                               75
 *
 * ── 12 SKILLS ─────────────────────────────────────────────────────────────────
 *   Attack          +50  per level  (max 1000 at lvl 20, no cap with legendary)
 *   Defense         +50  per level  (max 1000)
 *   Aim             +3%  per level  (max  60%)
 *   Luck            +2.5% per level (max  50%)
 *   Critical Damage +25  per level  (max  500)
 *   Critical Chance +2.5% per level (max  50%)
 *   Block           +25  per level  (max  500)
 *   Parry           +2.5% per level (max  50%)
 *   Energy          +10  per level  (max  200)
 *   Intuition       +5   per level  (max  100)
 *   Taxation        +2.5% per level (max  50%)
 *   Diplomacy       +2.5% per level (max  50%)
 */

// ─── Skill Definitions ────────────────────────────────────────────────────────
const SKILL_DEFS = {
    attack: {
        name: 'Attack',
        description: 'Raw offensive power added to every combat action.',
        icon: '⚔️',
        perLevel: 50,          // flat value added per level
        unit: '',              // '' = flat number, '%' = percentage
        maxLevels: 20,
        maxValue: 1000,
        category: 'combat'
    },
    defense: {
        name: 'Defense',
        description: 'Damage reduction applied before each hit lands.',
        icon: '🛡️',
        perLevel: 50,
        unit: '',
        maxLevels: 20,
        maxValue: 1000,
        category: 'combat'
    },
    aim: {
        name: 'Aim',
        description: 'Increases hit accuracy, reducing miss chance.',
        icon: '🎯',
        perLevel: 3,
        unit: '%',
        maxLevels: 20,
        maxValue: 60,
        category: 'combat'
    },
    luck: {
        name: 'Luck',
        description: 'Improves random outcomes across all game systems.',
        icon: '🍀',
        perLevel: 2.5,
        unit: '%',
        maxLevels: 20,
        maxValue: 50,
        category: 'passive'
    },
    criticalDamage: {
        name: 'Critical Damage',
        description: 'Additional flat damage dealt on a critical hit.',
        icon: '💥',
        perLevel: 25,
        unit: '',
        maxLevels: 20,
        maxValue: 500,
        category: 'combat'
    },
    criticalChance: {
        name: 'Critical Chance',
        description: 'Probability of landing a critical hit each attack.',
        icon: '🎲',
        perLevel: 2.5,
        unit: '%',
        maxLevels: 20,
        maxValue: 50,
        category: 'combat'
    },
    block: {
        name: 'Block',
        description: 'Flat damage negated when a block triggers.',
        icon: '🪖',
        perLevel: 25,
        unit: '',
        maxLevels: 20,
        maxValue: 500,
        category: 'combat'
    },
    parry: {
        name: 'Parry',
        description: 'Chance to fully negate an incoming attack.',
        icon: '🗡️',
        perLevel: 2.5,
        unit: '%',
        maxLevels: 20,
        maxValue: 50,
        category: 'combat'
    },
    energy: {
        name: 'Energy',
        description: 'Maximum action energy available each turn / day.',
        icon: '⚡',
        perLevel: 10,
        unit: '',
        maxLevels: 20,
        maxValue: 200,
        category: 'resource'
    },
    intuition: {
        name: 'Intuition',
        description: 'Passive intelligence bonus improving research and event outcomes.',
        icon: '🧠',
        perLevel: 5,
        unit: '',
        maxLevels: 20,
        maxValue: 100,
        category: 'passive'
    },
    taxation: {
        name: 'Taxation',
        description: 'Increases effective tax revenue collected per cycle.',
        icon: '💰',
        perLevel: 2.5,
        unit: '%',
        maxLevels: 20,
        maxValue: 50,
        category: 'economy'
    },
    diplomacy: {
        name: 'Diplomacy',
        description: 'Improves diplomatic relations, treaty success, and alliance yields.',
        icon: '🤝',
        perLevel: 2.5,
        unit: '%',
        maxLevels: 20,
        maxValue: 50,
        category: 'nation'
    }
};

// ─── Skill level-cost table (index 0 = level 1 cost, sums to 75 over 20 levels)
const SKILL_COST_TABLE = [1,1,2,2,2,3,3,3,4,4,5,5,5,5,5,5,5,5,5,5];
// cumulative: how many total points to reach level N (1-indexed)
// e.g. to hit level 3 you need 1+1+2 = 4 points spent on that skill

// XP growth constants
const XP_GROWTH_FACTOR = 1.12;

// ─── PlayerClass ──────────────────────────────────────────────────────────────
class PlayerClass {
    constructor() {
        this.isInitialized = false;

        // ── Identity ─────────────────────────────────────────────────────────
        this.playerId       = null;
        this.username       = '';
        this.email          = '';
        this.joinDate       = null;
        this.lastActive     = null;

        // ── Faction ──────────────────────────────────────────────────────────
        this.factionKey     = null;
        this.factionColor   = null;
        this.factionJoinDate = null;
        this.factionRank    = 'Member';

        // ── Leveling ─────────────────────────────────────────────────────────
        this.level                = 1;
        this.experience           = 0;
        this.totalExperience      = 0;
        this.experienceToNext     = 0;   // computed by calcXpToNext()

        // Legendary prestige
        this.legendaryLevel       = 1;   // starts at 1 (non-legendary), increments on prestige
        this.totalLegendaryLevels = 0;   // how many times they've gone legendary (legendaryLevel - 1)
        this.canGoLegendary       = false; // true only when level === 100

        // ── Skill points ─────────────────────────────────────────────────────
        this.unallocatedSkillPoints          = 0;  // normal points earned each level (+5)
        this.unallocatedLegendarySkillPoints = 0;  // legendary points (+2 per legendary)

        // ── Skills ───────────────────────────────────────────────────────────
        // Each skill entry:
        //   level            : 0-20 normal skill level (resets to 0 on legendary)
        //   legendaryBonusPts: permanent legendary bonus points allocated (never reset)
        //   pointsSpent      : normal points spent on this skill so far
        this.skills = {};

        // ── Statistics ───────────────────────────────────────────────────────
        this.statistics = {
            playTime:             0,
            loginsCount:          0,
            nationsCreated:       0,
            battlesWon:           0,
            battlesLost:          0,
            tradesCompleted:      0,
            alliancesFormed:      0,
            territoriesClaimed:   0,
            buildingsConstructed: 0,
            researchCompleted:    0,
            treatiesSigned:       0,
            spyMissions:          0
        };

        // ── Achievements / Titles ────────────────────────────────────────────
        this.achievements = new Set();
        this.titles       = new Set();
        this.currentTitle = null;

        // ── Settings ─────────────────────────────────────────────────────────
        this.settings = {
            notifications: { battles: true, trade: true, diplomacy: true, research: true, general: true },
            ui:            { theme: 'default', mapZoom: 1.0, showTutorial: true },
            privacy:       { showOnline: true, allowMessages: true, showStatistics: true }
        };

        // ── Active temporary effects ─────────────────────────────────────────
        this.activeEffects = new Map();

        // Bootstrap
        this._initSkills();
        this.experienceToNext = this._calcXpToNext(1);
        this._bindEvents();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BOOTSTRAP
    // ═══════════════════════════════════════════════════════════════════════════

    /** Build the skills map from SKILL_DEFS — all zeroed out */
    _initSkills() {
        this.skills = {};
        Object.keys(SKILL_DEFS).forEach(key => {
            this.skills[key] = {
                level:             0,   // current normal level (0-20)
                pointsSpent:       0,   // normal points spent on this skill
                legendaryBonusPts: 0    // permanent legendary bonus points
            };
        });
    }

    /** Initialize / load a player */
    initialize(playerData = {}) {
        this.playerId    = playerData.playerId  || this._generateId();
        this.username    = playerData.username  || 'Player';
        this.email       = playerData.email     || '';
        this.joinDate    = playerData.joinDate  || Date.now();
        this.lastActive  = Date.now();

        if (playerData.level)                this.level                = playerData.level;
        if (playerData.experience)           this.experience           = playerData.experience;
        if (playerData.totalExperience)      this.totalExperience      = playerData.totalExperience;
        if (playerData.legendaryLevel)       this.legendaryLevel       = playerData.legendaryLevel;
        if (playerData.totalLegendaryLevels) this.totalLegendaryLevels = playerData.totalLegendaryLevels;
        if (typeof playerData.unallocatedSkillPoints === 'number')
            this.unallocatedSkillPoints = playerData.unallocatedSkillPoints;
        if (typeof playerData.unallocatedLegendarySkillPoints === 'number')
            this.unallocatedLegendarySkillPoints = playerData.unallocatedLegendarySkillPoints;
        if (playerData.skills)      this._deserializeSkills(playerData.skills);
        if (playerData.statistics)  Object.assign(this.statistics, playerData.statistics);
        if (playerData.achievements) this.achievements = new Set(playerData.achievements);
        if (playerData.titles)       this.titles       = new Set(playerData.titles);

        this.experienceToNext = this._calcXpToNext(this.level);
        this.canGoLegendary   = (this.level >= 100);

        this.statistics.loginsCount++;
        this._awardExperience(50, 'Daily Login'); // small daily reward

        this.isInitialized = true;

        EventBus.emit('player_initialized', { player: this.serialize() });
        console.log(`Player '${this.username}' (Level ${this.level}, Legendary ${this.legendaryLevel}) initialized`);
    }

    static create(playerData) {
        if (window.Player && window.Player.isInitialized) {
            console.warn('Player already exists');
            return false;
        }
        const p = new PlayerClass();
        p.initialize(playerData);
        window.Player = p;
        return true;
    }

    _bindEvents() {
        EventBus.on(GameEvents.DAY_PASSED,            this._onDayPassed,           this);
        EventBus.on('territory_claimed',              this._onTerritoryClaimed,    this);
        EventBus.on(GameEvents.BUILDING_CONSTRUCTED,  this._onBuildingConstructed, this);
        EventBus.on(GameEvents.RESEARCH_COMPLETED,    this._onResearchCompleted,   this);
        EventBus.on('trade_completed',                this._onTradeCompleted,      this);
        EventBus.on('battle_won',                     this._onBattleWon,           this);
        EventBus.on('battle_lost',                    this._onBattleLost,          this);
        EventBus.on('alliance_formed',                this._onAllianceFormed,      this);
        EventBus.on('treaty_signed',                  this._onTreatySigned,        this);
        EventBus.on('spy_mission_success',            this._onSpyMission,          this);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // XP & LEVELING
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * XP required to go from level N to N+1.
     *   floor( 100 × 2 × 1.12^(N-1) × legendaryLevel )
     */
    _calcXpToNext(level) {
        return Math.floor(100 * 2 * Math.pow(XP_GROWTH_FACTOR, level - 1) * this.legendaryLevel);
    }

    /** Award experience, trigger level-ups */
    _awardExperience(amount, source = 'Unknown') {
        if (amount <= 0) return;

        const oldLevel = this.level;

        // Diplomacy skill gives a small XP multiplier (each level = +0.5%)
        const diplomacyBonus = this.getSkillValue('diplomacy') > 0
            ? 1 + (this.skills.diplomacy.level * 0.005)
            : 1;
        const finalAmount = Math.floor(amount * diplomacyBonus);

        this.experience      += finalAmount;
        this.totalExperience += finalAmount;

        // Level-up loop — stops at 100 (legendary gate)
        while (this.level < 100 && this.experience >= this.experienceToNext) {
            this.experience      -= this.experienceToNext;
            this.level           += 1;
            this.unallocatedSkillPoints += 5; // +5 per level
            this.experienceToNext = this._calcXpToNext(this.level);

            EventBus.emit('player_level_up', {
                newLevel:      this.level,
                skillPoints:   this.unallocatedSkillPoints,
                legendaryLevel: this.legendaryLevel,
                player:        this.serialize()
            });

            console.log(`Level up → ${this.level}  (${this.unallocatedSkillPoints} unspent skill pts)`);
        }

        // Flag legendary eligibility
        if (this.level >= 100) {
            this.canGoLegendary = true;
            // Drain any leftover XP so it doesn't roll over automatically
            this.experience = Math.min(this.experience, this.experienceToNext - 1);
        }

        if (this.level > oldLevel) this._checkLevelAchievements();

        EventBus.emit('experience_gained', {
            amount:    finalAmount,
            source,
            newTotal:  this.experience,
            leveledUp: this.level > oldLevel
        });
    }

    /**
     * Public wrapper kept for backward compatibility.
     * External code may call Player.awardExperience() or Player.gainExperience().
     */
    awardExperience(amount, source) { this._awardExperience(amount, source); }
    gainExperience(activity, amount) { this._awardExperience(amount, activity); }

    // ═══════════════════════════════════════════════════════════════════════════
    // LEGENDARY SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Player voluntarily goes Legendary at level 100.
     * - legendaryLevel increments (2, 3, 4…)
     * - level resets to 1, experience resets to 0
     * - unallocatedSkillPoints resets to 0 (fresh run)
     * - +2 unallocatedLegendarySkillPoints awarded (never reset)
     * - Skill LEVELS reset to 0, but legendaryBonusPts are preserved
     * - pointsSpent resets to 0 so they can re-spend 500 normal pts
     */
    goLegendary() {
        if (!this.canGoLegendary) {
            console.warn('Cannot go legendary — must be level 100 first.');
            return false;
        }

        this.legendaryLevel           += 1;
        this.totalLegendaryLevels     += 1;
        this.level                     = 1;
        this.experience                = 0;
        this.canGoLegendary            = false;
        this.unallocatedSkillPoints    = 0;
        this.unallocatedLegendarySkillPoints += 1; // Only 1 point per legendary level

        // Recalculate XP curve with new legendaryLevel multiplier
        this.experienceToNext = this._calcXpToNext(1);

        // Reset normal skill levels (but keep legendary bonus points)
        Object.keys(this.skills).forEach(key => {
            this.skills[key].level       = 0;
            this.skills[key].pointsSpent = 0;
            // legendaryBonusPts stays intact
        });

        EventBus.emit('player_went_legendary', {
            legendaryLevel: this.legendaryLevel,
            legendarySkillPts: this.unallocatedLegendarySkillPoints,
            player: this.serialize()
        });

        console.log(`⭐ LEGENDARY LEVEL ${this.legendaryLevel}! +1 legendary skill point.`);
        return true;
    }

    /**
     * Allocate a LEGENDARY bonus point to a skill (permanent, survives resets).
     * Each point gives the same boost as one normal skill level.
     */
    allocateLegendaryPoint(skillKey) {
        if (!this.skills[skillKey]) {
            console.error(`Unknown skill: ${skillKey}`); return false;
        }
        if (this.unallocatedLegendarySkillPoints <= 0) {
            console.error('No legendary skill points available.'); return false;
        }

        this.skills[skillKey].legendaryBonusPts += 1;
        this.unallocatedLegendarySkillPoints    -= 1;

        EventBus.emit('legendary_skill_allocated', {
            skill:         skillKey,
            bonusPts:      this.skills[skillKey].legendaryBonusPts,
            remaining:     this.unallocatedLegendarySkillPoints
        });

        console.log(`Legendary point → ${skillKey} (${this.skills[skillKey].legendaryBonusPts} total legendary pts)`);
        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SKILL POINT ALLOCATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Spend normal skill points to raise a skill by one level.
     * Cost is taken from SKILL_COST_TABLE[currentLevel].
     * Returns true on success.
     */
    allocateSkillPoint(skillKey) {
        const skill     = this.skills[skillKey];
        const def       = SKILL_DEFS[skillKey];

        if (!skill || !def) {
            console.error(`Unknown skill: ${skillKey}`); return false;
        }
        if (skill.level >= def.maxLevels) {
            console.warn(`${def.name} is already at max level (${def.maxLevels}).`); return false;
        }

        const cost = SKILL_COST_TABLE[skill.level]; // cost to go from current level to next
        if (this.unallocatedSkillPoints < cost) {
            console.warn(`Need ${cost} skill pts to upgrade ${def.name}, have ${this.unallocatedSkillPoints}.`);
            return false;
        }

        this.unallocatedSkillPoints -= cost;
        skill.pointsSpent           += cost;
        skill.level                 += 1;

        EventBus.emit('skill_upgraded', {
            skill:       skillKey,
            newLevel:    skill.level,
            cost,
            remaining:   this.unallocatedSkillPoints,
            value:       this.getSkillValue(skillKey)
        });

        console.log(`${def.name} → level ${skill.level}  (cost ${cost} pts, ${this.unallocatedSkillPoints} remaining)`);
        return true;
    }

    /**
     * Points required to level a skill from its current level to next.
     * Returns null if already maxed.
     */
    skillUpgradeCost(skillKey) {
        const skill = this.skills[skillKey];
        const def   = SKILL_DEFS[skillKey];
        if (!skill || !def) return null;
        if (skill.level >= def.maxLevels) return null;
        return SKILL_COST_TABLE[skill.level];
    }

    /**
     * Points remaining to max out a skill from current level.
     */
    skillPointsToMax(skillKey) {
        const skill = this.skills[skillKey];
        const def   = SKILL_DEFS[skillKey];
        if (!skill || !def) return 0;
        let total = 0;
        for (let lvl = skill.level; lvl < def.maxLevels; lvl++) {
            total += SKILL_COST_TABLE[lvl];
        }
        return total;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SKILL VALUE QUERIES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Returns the TOTAL effective value of a skill (normal levels + legendary bonus pts).
     * For flat skills (attack, defense, etc.) this is a number.
     * For % skills this is a decimal (e.g. 0.15 = 15%).
     */
    getSkillValue(skillKey) {
        const skill = this.skills[skillKey];
        const def   = SKILL_DEFS[skillKey];
        if (!skill || !def) return 0;

        const totalLevels = skill.level + skill.legendaryBonusPts;
        const raw = totalLevels * def.perLevel;

        return def.unit === '%' ? raw / 100 : raw;
    }

    /**
     * Returns the raw display value (e.g. "15%" or "750") for the UI.
     */
    getSkillDisplayValue(skillKey) {
        const skill = this.skills[skillKey];
        const def   = SKILL_DEFS[skillKey];
        if (!skill || !def) return '—';

        const totalLevels = skill.level + skill.legendaryBonusPts;
        const raw         = totalLevels * def.perLevel;

        return def.unit === '%' ? `${raw}%` : `${raw}`;
    }

    /**
     * Backward-compatible accessor used by Nation.js and other systems.
     * Returns a 0..1 multiplier bonus (0 = no bonus, 0.5 = +50%).
     */
    getSkillBonus(skillKey) {
        // Map old skill names to new ones
        const aliasMap = {
            diplomacy:    'diplomacy',
            economics:    'taxation',
            research:     'intuition',
            construction: 'energy',
            warfare:      'attack',
            trade:        'taxation',
            leadership:   'intuition',
            intelligence: 'aim'
        };
        const resolved = aliasMap[skillKey.toLowerCase()] || skillKey.toLowerCase();
        return this.getSkillValue(resolved);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NATION MECHANIC INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Apply all relevant skill bonuses to a nation's computed stats.
     * Called by Nation whenever stats are recalculated.
     */
    applyToNation(nation) {
        if (!nation) return;

        // Attack / Defense boost military
        const attackVal  = this.getSkillValue('attack');
        const defenseVal = this.getSkillValue('defense');
        nation.militaryStrength = (nation.militaryStrength || 0) + attackVal + defenseVal;

        // Taxation increases tax efficiency
        const taxBonus = this.getSkillValue('taxation'); // e.g. 0.15 = +15%
        nation.taxRate = Math.min(100, (nation.taxRate || 20) * (1 + taxBonus));

        // Diplomacy improves relations
        nation.reputationBonus = (nation.reputationBonus || 0) + Math.round(this.getSkillValue('diplomacy') * 100);

        // Intuition boosts research
        nation.researchBonus = (nation.researchBonus || 0) + this.getSkillValue('intuition');

        // Energy increases action capacity
        nation.actionEnergy = (nation.actionEnergy || 100) + this.getSkillValue('energy');

        // Luck slightly boosts happiness via random events
        nation.luckBonus = this.getSkillValue('luck'); // checked in event system
    }

    /**
     * Combat damage calculation helper (used by battle / military systems).
     * Returns { damage, isCrit, isParried }
     */
    calcCombatResult(baseDamage) {
        const attack       = this.getSkillValue('attack');
        const critChance   = this.getSkillValue('criticalChance'); // 0..1
        const critDamage   = this.getSkillValue('criticalDamage');
        const aimBonus     = this.getSkillValue('aim');             // 0..1
        const luck         = this.getSkillValue('luck');            // 0..1

        // Hit check (aim reduces miss rate, luck adds bonus)
        const hitRoll = Math.random();
        const hitThreshold = Math.max(0.05, 0.25 - aimBonus - luck * 0.5);
        if (hitRoll < hitThreshold) {
            return { damage: 0, isCrit: false, isParried: false, isMiss: true };
        }

        let damage = baseDamage + attack;

        // Apply military morale from nation stats
        if (window.Nation?.nationStats?.militaryMorale) {
            damage *= window.Nation.nationStats.militaryMorale;
        }

        // Apply improvement bonuses based on unit type
        if (window.Nation?.improvementEffects) {
            // This would need to be expanded based on unit type in actual combat
            // For now, apply a general military effectiveness bonus
            const effects = window.Nation.improvementEffects;
            let militaryBonus = 1.0;
            
            // Average out military improvements for general combat
            if (effects.soldierEffectiveness) militaryBonus += effects.soldierEffectiveness * 0.25;
            if (effects.tankEffectiveness) militaryBonus += effects.tankEffectiveness * 0.25;
            if (effects.aircraftEffectiveness) militaryBonus += effects.aircraftEffectiveness * 0.25;
            if (effects.shipEffectiveness) militaryBonus += effects.shipEffectiveness * 0.25;
            
            damage *= militaryBonus;
        }

        // Critical hit
        const critRoll = Math.random();
        const isCrit   = critRoll < critChance;
        if (isCrit) damage += critDamage;

        return { damage: Math.floor(damage), isCrit, isParried: false, isMiss: false };
    }

    /**
     * Defense calculation helper (used by battle / military systems).
     * Returns { blocked, parried, reduced }
     */
    calcDefenseResult(incomingDamage) {
        const defense     = this.getSkillValue('defense');
        const blockVal    = this.getSkillValue('block');
        const parryChance = this.getSkillValue('parry'); // 0..1
        const luck        = this.getSkillValue('luck');

        // Parry check
        const parryRoll   = Math.random();
        const isParried   = parryRoll < (parryChance + luck * 0.2);
        if (isParried) return { reduced: 0, blocked: false, parried: true };

        // Block check (30% base chance + luck)
        const blockChance = 0.30 + luck * 0.1;
        const blockRoll   = Math.random();
        const blocked     = blockRoll < blockChance;
        const reduction   = defense + (blocked ? blockVal : 0);

        return {
            reduced:  Math.max(0, incomingDamage - reduction),
            blocked,
            parried:  false
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXPERIENCE EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════

    _onDayPassed()            { this.statistics.playTime++; }
    _onTerritoryClaimed()     { this._awardExperience(500, 'Territory Claimed');    this.statistics.territoriesClaimed++; }
    _onBuildingConstructed()  { this._awardExperience(150, 'Building Constructed'); this.statistics.buildingsConstructed++; }
    _onResearchCompleted()    { this._awardExperience(300, 'Research Completed');   this.statistics.researchCompleted++; }
    _onTradeCompleted()       { this._awardExperience(100, 'Trade Completed');      this.statistics.tradesCompleted++; }
    _onBattleWon()            { this._awardExperience(1000,'Battle Won');           this.statistics.battlesWon++; }
    _onBattleLost()           { this._awardExperience(250, 'Battle Lost');          this.statistics.battlesLost++; }
    _onAllianceFormed()       { this._awardExperience(750, 'Alliance Formed');      this.statistics.alliancesFormed++; }
    _onTreatySigned()         { this._awardExperience(400, 'Treaty Signed');        this.statistics.treatiesSigned++; }
    _onSpyMission()           { this._awardExperience(200, 'Spy Mission Success');  this.statistics.spyMissions++; }

    // ═══════════════════════════════════════════════════════════════════════════
    // ACHIEVEMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    _checkLevelAchievements() {
        const milestones = [
            { level: 10,  id: 'level_10',  name: 'Rising Star',        desc: 'Reach level 10' },
            { level: 25,  id: 'level_25',  name: 'Experienced Leader', desc: 'Reach level 25' },
            { level: 50,  id: 'level_50',  name: 'Veteran Ruler',      desc: 'Reach level 50' },
            { level: 75,  id: 'level_75',  name: 'Master Strategist',  desc: 'Reach level 75' },
            { level: 100, id: 'level_100', name: 'Legendary Emperor',  desc: 'Reach level 100 — You may now go Legendary!' }
        ];
        milestones.forEach(m => {
            if (this.level >= m.level && !this.achievements.has(m.id)) {
                this.achievements.add(m.id);
                EventBus.emit('achievement_unlocked', { achievement: m, player: this.serialize() });
                console.log(`🏆 Achievement: ${m.name}`);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════

    _generateId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getOverview() {
        return {
            basic: {
                playerId:           this.playerId,
                username:           this.username,
                level:              this.level,
                experience:         this.experience,
                experienceToNext:   this.experienceToNext,
                legendaryLevel:     this.legendaryLevel,
                canGoLegendary:     this.canGoLegendary,
                joinDate:           this.joinDate,
                lastActive:         this.lastActive
            },
            skillPoints: {
                normal:    this.unallocatedSkillPoints,
                legendary: this.unallocatedLegendarySkillPoints
            },
            skills: Object.entries(this.skills).map(([key, s]) => ({
                key,
                name:           SKILL_DEFS[key].name,
                icon:           SKILL_DEFS[key].icon,
                level:          s.level,
                maxLevels:      SKILL_DEFS[key].maxLevels,
                legendaryPts:   s.legendaryBonusPts,
                displayValue:   this.getSkillDisplayValue(key),
                upgradeCost:    this.skillUpgradeCost(key),
                ptsToMax:       this.skillPointsToMax(key)
            })),
            statistics:   { ...this.statistics },
            achievements: this.achievements.size,
            activeEffects: this.activeEffects.size
        };
    }

    updateLastActive() { this.lastActive = Date.now(); }

    // ── Active temporary effects ──────────────────────────────────────────────
    addActiveEffect(effectId, effect) {
        this.activeEffects.set(effectId, { ...effect, startTime: Date.now() });
        EventBus.emit('effect_applied', { effectId, effect });
    }

    removeActiveEffect(effectId) {
        const removed = this.activeEffects.delete(effectId);
        if (removed) EventBus.emit('effect_removed', { effectId });
        return removed;
    }

    updateActiveEffects() {
        const now = Date.now();
        for (const [id, effect] of this.activeEffects.entries()) {
            if (effect.duration && now - effect.startTime >= effect.duration) {
                this.removeActiveEffect(id);
            }
        }
    }

    // ── Faction helpers ───────────────────────────────────────────────────────
    joinFaction(factionKey, factionColor) {
        if (this.factionKey) return false;
        this.factionKey      = factionKey;
        this.factionColor    = factionColor;
        this.factionJoinDate = Date.now();
        this.factionRank     = 'Member';
        this._awardExperience(25, 'Faction Joined');
        EventBus.emit('faction_joined', { player: this.username, factionKey, factionColor });
        return true;
    }

    leaveFaction() {
        if (!this.factionKey) return false;
        const old = this.factionKey;
        this.factionKey = this.factionColor = this.factionJoinDate = this.factionRank = null;
        EventBus.emit('faction_left', { player: this.username, oldFactionKey: old });
        return true;
    }

    getFactionInfo() {
        if (!this.factionKey) return null;
        return {
            key:             this.factionKey,
            color:           this.factionColor,
            joinDate:        this.factionJoinDate,
            rank:            this.factionRank,
            daysSinceJoined: Math.floor((Date.now() - this.factionJoinDate) / 86400000)
        };
    }

    canVoteInFaction() {
        return !!this.factionKey &&
               !!this.factionJoinDate &&
               (Date.now() - this.factionJoinDate) >= 86400000; // 24 h
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SERIALIZE / DESERIALIZE
    // ═══════════════════════════════════════════════════════════════════════════

    _serializeSkills() {
        const out = {};
        Object.entries(this.skills).forEach(([key, s]) => {
            out[key] = {
                level:             s.level,
                pointsSpent:       s.pointsSpent,
                legendaryBonusPts: s.legendaryBonusPts
            };
        });
        return out;
    }

    _deserializeSkills(data) {
        Object.entries(data).forEach(([key, saved]) => {
            if (this.skills[key]) Object.assign(this.skills[key], saved);
        });
    }

    // Keep old names as aliases for any external save/load code
    serializeSkills()           { return this._serializeSkills(); }
    deserializeSkills(data)     { this._deserializeSkills(data); }

    serialize() {
        return {
            playerId:                       this.playerId,
            username:                       this.username,
            email:                          this.email,
            joinDate:                       this.joinDate,
            lastActive:                     this.lastActive,
            factionKey:                     this.factionKey,
            factionColor:                   this.factionColor,
            factionJoinDate:                this.factionJoinDate,
            factionRank:                    this.factionRank,
            level:                          this.level,
            experience:                     this.experience,
            totalExperience:                this.totalExperience,
            legendaryLevel:                 this.legendaryLevel,
            totalLegendaryLevels:           this.totalLegendaryLevels,
            canGoLegendary:                 this.canGoLegendary,
            unallocatedSkillPoints:         this.unallocatedSkillPoints,
            unallocatedLegendarySkillPoints: this.unallocatedLegendarySkillPoints,
            skills:                         this._serializeSkills(),
            statistics:                     { ...this.statistics },
            achievements:                   Array.from(this.achievements),
            titles:                         Array.from(this.titles),
            currentTitle:                   this.currentTitle,
            settings:                       { ...this.settings },
            activeEffects:                  Object.fromEntries(this.activeEffects)
        };
    }

    deserialize(data) {
        Object.keys(data).forEach(key => {
            if (key === 'achievements' || key === 'titles') {
                this[key] = new Set(data[key]);
            } else if (key === 'activeEffects') {
                this[key] = new Map(Object.entries(data[key]));
            } else if (key === 'skills') {
                this._deserializeSkills(data[key]);
            } else if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
                this[key] = { ...data[key] };
            } else {
                this[key] = data[key];
            }
        });
        this.experienceToNext = this._calcXpToNext(this.level);
        this.canGoLegendary   = (this.level >= 100);
        this.isInitialized    = true;
        EventBus.emit('player_loaded', { player: this.serialize() });
    }

    destroy() {
        EventBus.off(GameEvents.DAY_PASSED,           this._onDayPassed,           this);
        EventBus.off('territory_claimed',             this._onTerritoryClaimed,    this);
        EventBus.off(GameEvents.BUILDING_CONSTRUCTED, this._onBuildingConstructed, this);
        EventBus.off(GameEvents.RESEARCH_COMPLETED,   this._onResearchCompleted,   this);
        this.isInitialized = false;
    }
}

// ─── Globals ──────────────────────────────────────────────────────────────────

// Expose skill definitions and cost table for UI components
window.SKILL_DEFS       = SKILL_DEFS;
window.SKILL_COST_TABLE = SKILL_COST_TABLE;
window.XP_GROWTH_FACTOR = XP_GROWTH_FACTOR;

// Create the singleton (replaced when a real player is loaded / created)
const Player = new PlayerClass();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlayerClass, Player, SKILL_DEFS, SKILL_COST_TABLE };
}
