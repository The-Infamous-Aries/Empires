/**
 * Player Entity — Progression, Skills, and Legendary System
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * ── LEVELING ──────────────────────────────────────────────────────────────────
 *   • 70 levels per "legendary cycle"
 *   • XP to advance from level N to N+1:
 *       floor( XP_BASE_PER_LEVEL × XP_GROWTH_FACTOR^(N-1) × legendaryLevel )
 *     where XP_BASE_PER_LEVEL ≈ 234, XP_GROWTH_FACTOR = 1.025, legendaryLevel starts at 1
 *   • Level 1→2 costs ~234 XP (legendaryLevel 1), ~468 XP after first legendary, etc.
 *   • At level 70 the player may voluntarily "Go Legendary" (no auto-trigger).
 *     This resets level to 1 and increments legendaryLevel (2, 3, 4 …).
 *
 * ── SKILL POINTS ──────────────────────────────────────────────────────────────
 *   • Start at 0 unallocated skill points
 *   • Gain 3 skill points per level → 207 total at level 70
 *   • +3 bonus skill points at each icon milestone (levels 10, 20, 30, 40, 50, 60, 70) → +21 total
 *   • Total spendable pool per cycle: ~228 points
 *   • Can max exactly 4 of 16 skills (4 × 55 = 220) with ~8 left for a 5th partial
 *
 * ── SKILL COST TABLE (per-skill, 10 levels, total = 55 points) ────────────────
 *   Level:  1   2   3   4   5   6   7   8   9  10
 *   Cost:   1   2   3   4   5   6   7   8   9  10
 *   Total:                           55
 *
 * ── 16 SKILLS ─────────────────────────────────────────────────────────────────
 *   Attack          +75  flat per level   (max  750)
 *   Defense         +75  flat per level   (max  750)
 *   Block           +50  flat per level   (max  500)
 *   Evade           +5%  per level        (max  50%)  [NEW]
 *   Aim             +5%  per level        (max  50%)
 *   Crit Chance     +5%  per level        (max  50%)
 *   Crit Damage     +40% per level        (max 400%) [roll-based 1x to 5x]
 *   Luck            +3   flat per level   (max   30) [chance-to-trigger]
 *   Energy          +10  flat per level   (max  100) [base 100 → 200 total]
 *   Intuition       +5   flat per level   (max   50) [base 100 → 150 total]
 *   Taxation        +3.5% per level       (max  35%)
 *   Intelligence    +3.5% per level       (max  35%) [NEW - XP/tech]
 *   Diplomacy       +10% per level        (max 100%) [treaty length]
 *   Production      +5%  per level        (max  50%) [NEW - raw resources]
 *   Stewardship     +2.5% per level       (max  25%) [NEW - build/upkeep cost]
 *   Discipline      +2.5% per level       (max  25%) [NEW - unit caps/cost]
 */

// ─── Skill Definitions ────────────────────────────────────────────────────────
const SKILL_DEFS = {
    attack: {
        name: 'Attack',
        description: 'Raw offensive power added to every combat action.',
        icon: 'assets/images/Skills/attack.png',
        perLevel: 75,          // flat value added per level
        unit: '',              // '' = flat number, '%' = percentage
        maxLevels: 10,
        maxValue: 750,
        category: 'combat'
    },
    defense: {
        name: 'Defense',
        description: 'Damage reduction applied before each hit lands.',
        icon: 'assets/images/Skills/defense.png',
        perLevel: 75,
        unit: '',
        maxLevels: 10,
        maxValue: 750,
        category: 'combat'
    },
    aim: {
        name: 'Aim',
        description: 'Increases hit accuracy, reducing miss chance.',
        icon: 'assets/images/Skills/aim.png',
        perLevel: 5,
        unit: '%',
        maxLevels: 10,
        maxValue: 50,
        category: 'combat'
    },
    luck: {
        name: 'Luck',
        description: 'Chance to trigger a luck boost on combat actions.',
        icon: 'assets/images/Skills/luck.png',
        perLevel: 3,
        unit: '',
        maxLevels: 10,
        maxValue: 30,
        category: 'passive'
    },
    criticalDamage: {
        name: 'Critical Damage',
        description: 'Percent multiplier on critical hit damage roll.',
        icon: 'assets/images/Skills/critical-damage.png',
        perLevel: 40,
        unit: '%',
        maxLevels: 10,
        maxValue: 400,
        category: 'combat'
    },
    criticalChance: {
        name: 'Critical Chance',
        description: 'Probability of landing a critical hit each attack.',
        icon: 'assets/images/Skills/critical-chance.png',
        perLevel: 5,
        unit: '%',
        maxLevels: 10,
        maxValue: 50,
        category: 'combat'
    },
    block: {
        name: 'Block',
        description: 'Flat damage negated when a block triggers.',
        icon: 'assets/images/Skills/block.png',
        perLevel: 50,
        unit: '',
        maxLevels: 10,
        maxValue: 500,
        category: 'combat'
    },
    parry: {
        name: 'Parry',
        description: 'Chance to parry an incoming attack, negating damage.',
        icon: 'assets/images/Skills/parry.png',
        perLevel: 50,
        unit: '',
        maxLevels: 10,
        maxValue: 500,
        category: 'combat'
    },
    evade: {
        name: 'Evade',
        description: 'Chance to skip energy/intuition cost on actions.',
        icon: 'assets/images/Skills/evade.png',
        perLevel: 5,
        unit: '%',
        maxLevels: 10,
        maxValue: 50,
        category: 'combat'
    },
    energy: {
        name: 'Energy',
        description: 'Maximum action energy available each turn / day.',
        icon: 'assets/images/Skills/energy.png',
        perLevel: 10,
        unit: '',
        maxLevels: 10,
        maxValue: 100,
        category: 'resource'
    },
    intuition: {
        name: 'Intuition',
        description: 'Pool for launching missile, nuke, and spy operations.',
        icon: 'assets/images/Skills/intuition.png',
        perLevel: 5,
        unit: '',
        maxLevels: 10,
        maxValue: 50,
        category: 'resource'
    },
    taxation: {
        name: 'Taxation',
        description: 'Increases effective tax revenue collected per cycle.',
        icon: 'assets/images/Skills/taxation.png',
        perLevel: 3.5,
        unit: '%',
        maxLevels: 10,
        maxValue: 35,
        category: 'economy'
    },
    intelligence: {
        name: 'Intelligence',
        description: 'XP gained and technology level efficiency.',
        icon: 'assets/images/Skills/intelligence.png',
        perLevel: 3.5,
        unit: '%',
        maxLevels: 10,
        maxValue: 35,
        category: 'nation'
    },
    diplomacy: {
        name: 'Diplomacy',
        description: 'Increases maximum allowed treaty length.',
        icon: 'assets/images/Skills/diplomacy.png',
        perLevel: 10,
        unit: '%',
        maxLevels: 10,
        maxValue: 100,
        category: 'nation'
    },
    production: {
        name: 'Production',
        description: 'Raw resource production bonus, stacks with mine stacking.',
        icon: 'assets/images/Skills/production.png',
        perLevel: 5,
        unit: '%',
        maxLevels: 10,
        maxValue: 50,
        category: 'economy'
    },
    stewardship: {
        name: 'Stewardship',
        description: 'Reduces improvement, project, and wonder cost and upkeep.',
        icon: 'assets/images/Skills/stewardship.png',
        perLevel: 2.5,
        unit: '%',
        maxLevels: 10,
        maxValue: 25,
        category: 'nation'
    },
    discipline: {
        name: 'Discipline',
        description: 'Increases military unit max caps and reduces purchase cost.',
        icon: 'assets/images/Skills/discipline.png',
        perLevel: 2.5,
        unit: '%',
        maxLevels: 10,
        maxValue: 25,
        category: 'combat'
    }
};

// ─── Skill level-cost table (index 0 = level 1 cost, sums to 55 over 10 levels)
// Levels cost 1,2,3,4,5,6,7,8,9,10 respectively per level-up
// Cumulative: level 10 = 55 points total per skill; 16 skills × 55 = 880 to max all
const SKILL_COST_TABLE = [1,2,3,4,5,6,7,8,9,10];

// XP growth constants
const XP_GROWTH_FACTOR = 1.025;

// ── Leveling constants ──
// Levels per legendary cycle (was 100, now 70)
const XP_LEVELS_PER_CYCLE = 70;

// Base XP per level (tuned so total XP to reach level 70 ≈ total XP to old level 100)
const XP_BASE_PER_LEVEL = 234;

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
        this.canGoLegendary       = false; // true only when level >= XP_LEVELS_PER_CYCLE (70)

        // ── Skill points ─────────────────────────────────────────────────────
        this.unallocatedSkillPoints          = 0;  // normal points earned each level (3/level + milestone bonuses → ~228 at level 70)
        this.unallocatedLegendarySkillPoints = 0;  // legendary points (+1 per legendary cycle, never reset)

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
            alliancesFormed:      0,
            territoriesClaimed:   0,
            buildingsConstructed: 0,
            researchCompleted:    0,
            treatiesSigned:       0,
            spyMissions:          0
        };

        // ── Energy & Intuition Systems ───────────────────────────────────────
        this.currentEnergy = 100;      // Current energy available
        this.currentIntuition = 100;   // Current intuition available

        // ── Achievements / Titles ────────────────────────────────────────────
        this.achievements = new Set();
        this.titles       = new Set();
        this.currentTitle = null;

        // ── Settings ─────────────────────────────────────────────────────────
        this.settings = {
            notifications: { battles: true, trade: true, diplomacy: true, research: true, general: true },
            ui:            { theme: 'default', mapZoom: 1.0, showTutorial: true,
                             textSize: 'normal', nameFont: 'system',
                             nameColor: '#e9ecec', nameColorAccent: '#a8a8a8',
                             musicEnabled: true, musicVolume: 0.35,
                             cardSet: 'white-red',
                             diceSet: 'red',
                             diceColor: 'red',
                             diceStyle: 'numbers' },
            privacy:       { showOnline: true, allowMessages: true, showStatistics: true },
            customImages:  { flagImage: null,
                             militaryUnits: { soldier: null, tank: null, aircraft: null, ships: null, spies: null, missiles: null, nukes: null },
                             nationalFood: { type: 'pizza', text: '' },
                             nationalWater: { type: 'water', text: '' },
                             nationalPet: { type: 'none', text: '' } }
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
        this.canGoLegendary   = (this.level >= XP_LEVELS_PER_CYCLE);

        this.statistics.loginsCount++;
        this._awardExperience(50, 'Daily Login'); // small daily reward

        this.isInitialized = true;

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('player_initialized', { player: this.serialize() });
        }
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
     *   floor( XP_BASE_PER_LEVEL × XP_GROWTH_FACTOR^(N-1) × legendaryLevel )
     */
    _calcXpToNext(level) {
        return Math.floor(XP_BASE_PER_LEVEL * Math.pow(XP_GROWTH_FACTOR, level - 1) * this.legendaryLevel);
    }

    /** Award experience, trigger level-ups */
    _awardExperience(amount, source = 'Unknown') {
        if (amount <= 0) return;

        const oldLevel = this.level;

        // Diplomacy skill gives a small XP multiplier (each level = +0.5%)
        const diplomacyBonus = 1 + (this.getSkillValue('diplomacy') * 0.05);

        // Relic: Mirror of Selfishness — XP +33%
        const relicXpMult = this.relicXpMult || 1;

        const finalAmount = Math.floor(amount * diplomacyBonus * relicXpMult);

        this.experience      += finalAmount;
        this.totalExperience += finalAmount;

        // Level-up loop — stops at XP_LEVELS_PER_CYCLE (legendary gate)
        // Regular levels award 3 skill points; +3 bonus at each icon milestone (10,20,30,40,50,60,70)
        // Level 1 → 70 = 69 level-ups × 3 pts = 207 + 21 milestone = ~228 total normal points
        while (this.level < XP_LEVELS_PER_CYCLE && this.experience >= this.experienceToNext) {
            this.experience      -= this.experienceToNext;
            this.level           += 1;

            // Every level awards 3 skill points
            this.unallocatedSkillPoints += 3;

            // Bonus skill points at each icon milestone (every 10 levels)
            if (this.level % 10 === 0) {
                this.unallocatedSkillPoints += 3;
            }

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
        if (this.level >= XP_LEVELS_PER_CYCLE) {
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
    // Natural order: gainExperience(amount, source)
    gainExperience(amount, source) { this._awardExperience(amount, source); }
    // Deprecated alias: gainExperience(activity, amount) — old callers may use (activity, amount)
    gainExpDeprecated(activity, amount) { this._awardExperience(amount, activity); }

    // Backward-compatible alias: gainExperience(amount, source) — some callers
    // pass (amount, source) instead of (activity, amount).
    gainExp(amount, source) { this._awardExperience(amount, source); }

    // ═══════════════════════════════════════════════════════════════════════════
    // LEGENDARY SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Player voluntarily goes Legendary at level XP_LEVELS_PER_CYCLE (70).
     * - legendaryLevel increments (2, 3, 4…)
     * - level resets to 1, experience resets to 0
     * - unallocatedSkillPoints resets to 0 (fresh run)
     * - +1 unallocatedLegendarySkillPoints awarded (never reset)
     * - Skill LEVELS reset to 0, but legendaryBonusPts are preserved
     * - pointsSpent resets to 0 so they can re-spend normal pts
     */
    goLegendary() {
        if (!this.canGoLegendary) {
            console.warn(`Cannot go legendary — must be level ${XP_LEVELS_PER_CYCLE} first.`);
            return false;
        }

        this.legendaryLevel           += 1;
        this.totalLegendaryLevels     += 1;
        this.level                     = 1;
        this.experience                = 0;
        this.canGoLegendary            = false;
        this.unallocatedSkillPoints    = 0;
        this.unallocatedLegendarySkillPoints += 1; // +1 permanent legendary point per cycle

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

        // Check legendary awards
        if (window.AwardSystem) window.AwardSystem.checkPlayerAwards(this);

        console.log(`⭐ LEGENDARY LEVEL ${this.legendaryLevel}! +1 legendary skill point.`);
        return true;
    }

    /**
     * Get the level badge icon path for a given level (1-70).
     * Tier order: Iron(1-10), Bronze(11-20), Silver(21-30), Gold(31-40),
     * Frost(41-50), Crystal(51-60), Amethyst(61-70).
     */
    getLevelIconPath(level = this.level) {
        const tiers = ["iron", "bronze", "silver", "gold", "frost", "crystal", "amethyst"];
        const tierIndex = Math.min(6, Math.floor((level - 1) / 10));
        const tier = tiers[tierIndex];
        const levelInTier = ((level - 1) % 10) + 1;
        return `assets/images/Levels/${tier}/badge_${tier}_${String(levelInTier).padStart(2, '0')}.png`;
    }

    /**
     * Get the rank icon path for a given legendary count.
     * 0 → no rank icon; 1st legendary → Rank/1.png, etc.
     * Clamped to available Rank images (1-48).
     */
    getRankIconPath(totalLegendaryLevels = this.totalLegendaryLevels) {
        const rank = Math.min(48, Math.max(1, totalLegendaryLevels));
        return `assets/images/Rank/${rank}.png`;
    }

    /**
     * Get the tier name for a given level.
     */
    getTierForLevel(level = this.level) {
        const tiers = ["iron", "bronze", "silver", "gold", "frost", "crystal", "amethyst"];
        return tiers[Math.min(6, Math.floor((level - 1) / 10))];
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

        // Check skill max awards
        if (window.AwardSystem) window.AwardSystem.checkPlayerAwards(this);

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
            leadership:   'intuition'
            // intelligence → aim alias removed; intelligence is now its own skill
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
     *
     * NOTE: Taxation is intentionally NOT applied here — Nation.calculateEconomy()
     * already adds the skill bonus to taxRate before this runs. Applying it again
     * here would cause a double-application on every day turn.
     */
    applyToNation(nation) {
        if (!nation) return;

        // Attack / Defense boost military strength
        const attackVal  = this.getSkillValue('attack');
        const defenseVal = this.getSkillValue('defense');
        nation.militaryStrength = (nation.militaryStrength || 0) + attackVal + defenseVal;

        // Diplomacy improves relations (reputation bonus kept as secondary effect)
        nation.reputationBonus = (nation.reputationBonus || 0) + Math.round(this.getSkillValue('diplomacy') * 100);

        // Intuition boosts research (kept as secondary effect; primary use is launch cost)
        nation.researchBonus = (nation.researchBonus || 0) + this.getSkillValue('intuition');

        // Energy increases action capacity
        nation.actionEnergy = (nation.actionEnergy || 100) + this.getSkillValue('energy');

        // Luck stored for event system (probabilistic boost checked per-action)
        nation.luckBonus = this.getSkillValue('luck');

        // Discipline increases military unit max caps
        const disciplineVal = this.getSkillValue('discipline');
        if (disciplineVal > 0) {
            nation.disciplineUnitCapBonus = (nation.disciplineUnitCapBonus || 0) + disciplineVal;
        }

        // Production bonus stored for resource system
        const productionVal = this.getSkillValue('production');
        if (productionVal > 0) {
            nation.productionBonus = (nation.productionBonus || 0) + productionVal;
        }

        // ── Equipment production bonus (per-resource, applied in resource-system) ──
        const equipBonus = window.EquipmentSystem?.getNationBonuses?.(nation) || {};
        if (equipBonus.production) {
            nation.equipmentProductionBonus = (nation.equipmentProductionBonus || 0) + equipBonus.production;
        }
        // Equipment taxation bonus (applied in NationSystem.calculateEconomy)
        if (equipBonus.taxation) {
            nation.equipmentTaxationBonus = (nation.equipmentTaxationBonus || 0) + equipBonus.taxation;
        }

        // ── Equipment resource bonus from protective sets ──
        const equipResourceBonus = window.EquipmentSystem?.getResourceBonus?.(nation) || {};
        for (const [resourceKey, percentBonus] of Object.entries(equipResourceBonus)) {
            nation.equipmentResourceBonus = nation.equipmentResourceBonus || {};
            nation.equipmentResourceBonus[resourceKey] = (nation.equipmentResourceBonus[resourceKey] || 0) + percentBonus / 100;
        }

        // ── Equipment clothing set stat bonus ──
        const equipStatBonus = window.EquipmentSystem?.getClothingStatBonus?.(nation) || {};
        for (const [statKey, percentBonus] of Object.entries(equipStatBonus)) {
            // Apply clothing set stat bonus to nation
            nation.equipmentStatBonus = nation.equipmentStatBonus || {};
            nation.equipmentStatBonus[statKey] = (nation.equipmentStatBonus[statKey] || 0) + percentBonus / 100;
            // Special handling for Energy and Intuition (not standard nation stats)
            if (statKey === 'energy') {
                nation.actionEnergy = (nation.actionEnergy || 100) + (nation.actionEnergy || 100) * (percentBonus / 100);
            }
            if (statKey === 'intuition') {
                nation.researchBonus = (nation.researchBonus || 0) + percentBonus / 100;
            }
        }

        // Stewardship bonus stored for building/project/wonder cost reduction
        const stewardshipVal = this.getSkillValue('stewardship');
        if (stewardshipVal > 0) {
            nation.stewardshipCostReduction = (nation.stewardshipCostReduction || 0) + stewardshipVal;
        }
    }

    /**
     * Get current energy
     */
    getCurrentEnergy() {
        return this.currentEnergy;
    }

    /**
     * Get maximum energy based on skill
     */
    getMaxEnergy() {
        const baseEnergy = 100;
        const energySkill = this.getSkillValue('energy');
        return baseEnergy + energySkill;
    }

    /**
     * Consume energy for actions
     */
    consumeEnergy(amount) {
        if (this.currentEnergy < amount) {
            throw new Error(`Insufficient energy: need ${amount}, have ${this.currentEnergy}`);
        }
        this.currentEnergy -= amount;
        return true;
    }

    /**
     * Regenerate energy (called hourly)
     */
    regenerateEnergy() {
        const maxEnergy = this.getMaxEnergy();
        const regenAmount = Math.floor(maxEnergy * 0.10); // 10% per hour
        this.currentEnergy = Math.min(maxEnergy, this.currentEnergy + regenAmount);
        return regenAmount;
    }

    /**
     * Get current intuition
     */
    getCurrentIntuition() {
        return this.currentIntuition;
    }

    /**
     * Get maximum intuition based on skill
     */
    getMaxIntuition() {
        const baseIntuition = 100;
        const intuitionSkill = this.getSkillValue('intuition');
        return baseIntuition + intuitionSkill;
    }

    /**
     * Consume intuition for actions
     */
    consumeIntuition(amount) {
        if (this.currentIntuition < amount) {
            throw new Error(`Insufficient intuition: need ${amount}, have ${this.currentIntuition}`);
        }
        this.currentIntuition -= amount;
        return true;
    }

    /**
     * Regenerate intuition (called hourly, slower than energy)
     */
    regenerateIntuition() {
        const maxIntuition = this.getMaxIntuition();
        const regenAmount = Math.floor(maxIntuition * 0.10); // 10% per hour
        this.currentIntuition = Math.min(maxIntuition, this.currentIntuition + regenAmount);
        return regenAmount;
    }

    /**
     * Combat damage calculation helper (used by battle / military systems).
     * Returns { damage, isCrit, isParried, isMiss, evaded }
     *
     * Combat flow:
     * 1. Aim determines hit/miss (misses cannot crit)
     * 2. Crit chance determines if hit is critical
     * 3. Crit damage rolls between 1x and (1 + critDamage/100) on crit
     * 4. Luck: chance (luck/100) to apply a (luck/100)% boost to damage
     * 5. Evade handled at action level (world.js), not here
     */
    calcCombatResult(baseDamage) {
        const attack       = this.getSkillValue('attack');
        const critChance   = this.getSkillValue('criticalChance'); // 0..1
        const critDamageMax = this.getSkillValue('criticalDamage'); // 0..1 (max bonus)
        const aimBonus     = this.getSkillValue('aim');             // 0..1
        const luck         = this.getSkillValue('luck');            // 0..1 flat (0-30)

        // ── Equipment bonuses ──────────────────────────────────────────
        const equipBonus = window.EquipmentSystem?.getNationBonuses?.(window.Nation) || {};
        const equipAttack = equipBonus.attack || 0;
        const equipCritChance = equipBonus.criticalChance || 0;
        const equipCritDamage = equipBonus.criticalDamage || 0;
        const equipAim = equipBonus.aim || 0;

        // Hit check (aim reduces miss rate) — include equipment aim
        const hitRoll = Math.random();
        const hitThreshold = Math.max(0.05, 0.25 - aimBonus - equipAim);
        if (hitRoll < hitThreshold) {
            return { damage: 0, isCrit: false, isParried: false, isMiss: true, evaded: false };
        }

        let damage = baseDamage + attack + equipAttack;

        // Apply military morale from nation stats
        if (window.Nation?.nationStats?.militaryMorale) {
            damage *= window.Nation.nationStats.militaryMorale;
        }

        // Apply improvement bonuses based on unit type
        if (window.Nation?.improvementEffects) {
            const effects = window.Nation.improvementEffects;
            let militaryBonus = 1.0;
            if (effects.soldierEffectiveness) militaryBonus += effects.soldierEffectiveness * 0.25;
            if (effects.tankEffectiveness) militaryBonus += effects.tankEffectiveness * 0.25;
            if (effects.aircraftEffectiveness) militaryBonus += effects.aircraftEffectiveness * 0.25;
            if (effects.shipEffectiveness) militaryBonus += effects.shipEffectiveness * 0.25;
            damage *= militaryBonus;
        }

        // Critical hit roll — include equipment crit chance
        const totalCritChance = critChance + equipCritChance;
        const critRoll = Math.random();
        const isCrit   = critRoll < totalCritChance;

        if (isCrit) {
            // Roll-based crit damage: between 1x and (1 + critDamageMax) total multiplier
            const totalCritDamageMax = critDamageMax + equipCritDamage;
            const critMultiplier = 1 + (Math.random() * totalCritDamageMax);
            damage *= critMultiplier;
        }

        // Luck: chance-to-trigger boost — include equipment luck
        const totalLuck = luck + (equipBonus.luck || 0);
        if (totalLuck > 0 && Math.random() < totalLuck / 100) {
            damage *= (1 + totalLuck / 100);
        }

        return { damage: Math.floor(damage), isCrit, isParried: false, isMiss: false, evaded: false };
    }

    /**
     * Defense calculation helper (used by battle / military systems).
     * Returns { reduced, blocked, parried, evaded }
     *
     * Defense flow:
     * 1. Evade: chance to skip action entirely (handled at action level, not here)
     * 2. Block: chance based on Block skill + luck modifier, reduces damage
     * 3. Defense value always subtracts from incoming damage
     * Parry removed — folded into Block rework.
     */
    calcDefenseResult(incomingDamage) {
        const defense = this.getSkillValue('defense');
        const blockVal = this.getSkillValue('block');
        const luck = this.getSkillValue('luck');

        // ── Equipment bonuses ──────────────────────────────────────────
        const equipBonus = window.EquipmentSystem?.getNationBonuses?.(window.Nation) || {};
        const equipDefense = equipBonus.defense || 0;
        const equipBlock = equipBonus.block || 0;
        const equipLuck = equipBonus.luck || 0;
        const equipEvade = equipBonus.evade || 0;

        // Block check — include equipment block and luck
        const blockSkill = this.skills.block;
        const blockLevel = blockSkill ? blockSkill.level + blockSkill.legendaryBonusPts : 0;
        const blockChance = Math.min(0.80, 0.20 + (blockLevel * 0.03) + ((luck + equipLuck) * 0.005));
        const blockRoll = Math.random();
        const blocked = blockRoll < blockChance;
        const reduction = defense + equipDefense + (blocked ? blockVal + equipBlock : 0);

        return {
            reduced: Math.max(0, incomingDamage - reduction),
            blocked,
            parried: false,
            evaded: false
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXPERIENCE EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════

    _onDayPassed()            { this.statistics.playTime++; if (window.AwardSystem) window.AwardSystem.checkPlayerAwards(this); }
    _onTerritoryClaimed()     { this._awardExperience(500, 'Territory Claimed');    this.statistics.territoriesClaimed++; if (window.AwardSystem) window.AwardSystem.checkPlayerAwards(this); }
    _onBuildingConstructed()  { this._awardExperience(150, 'Building Constructed'); this.statistics.buildingsConstructed++; if (window.AwardSystem) window.AwardSystem.checkPlayerAwards(this); }
    _onResearchCompleted()    { this._awardExperience(300, 'Research Completed');   this.statistics.researchCompleted++; if (window.AwardSystem) window.AwardSystem.checkPlayerAwards(this); }
    _onBattleWon()            { this._awardExperience(1000,'Battle Won');           this.statistics.battlesWon++; if (window.AwardSystem) window.AwardSystem.checkPlayerAwards(this); }
    _onBattleLost()           { this._awardExperience(250, 'Battle Lost');          this.statistics.battlesLost++; if (window.AwardSystem) window.AwardSystem.checkPlayerAwards(this); }
    _onAllianceFormed()       { this._awardExperience(750, 'Alliance Formed');      this.statistics.alliancesFormed++; if (window.AwardSystem) window.AwardSystem.checkPlayerAwards(this); }
    _onTreatySigned()         { this._awardExperience(400, 'Treaty Signed');        this.statistics.treatiesSigned++; if (window.AwardSystem) window.AwardSystem.checkPlayerAwards(this); }
    _onSpyMission()           { this._awardExperience(200, 'Spy Mission Success');  this.statistics.spyMissions++; if (window.AwardSystem) window.AwardSystem.checkPlayerAwards(this); }

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
        this.canGoLegendary   = (this.level >= XP_LEVELS_PER_CYCLE);
        this.isInitialized    = true;
        EventBus.emit('player_loaded', { player: this.serialize() });
    }

    destroy() {
        EventBus.off(GameEvents.DAY_PASSED,           this._onDayPassed,           this);
        EventBus.off('territory_claimed',             this._onTerritoryClaimed,    this);
        EventBus.off(GameEvents.BUILDING_CONSTRUCTED, this._onBuildingConstructed, this);
        EventBus.off(GameEvents.RESEARCH_COMPLETED,   this._onResearchCompleted,   this);
        EventBus.off('battle_won',                    this._onBattleWon,           this);
        EventBus.off('battle_lost',                   this._onBattleLost,          this);
        EventBus.off('alliance_formed',               this._onAllianceFormed,      this);
        EventBus.off('treaty_signed',                 this._onTreatySigned,        this);
        EventBus.off('spy_mission_success',           this._onSpyMission,          this);
        this.isInitialized = false;
    }
}

// ─── Globals ──────────────────────────────────────────────────────────────────

// Expose skill definitions and cost table for UI components
window.SKILL_DEFS       = SKILL_DEFS;
window.SKILL_COST_TABLE = SKILL_COST_TABLE;
window.XP_GROWTH_FACTOR = XP_GROWTH_FACTOR;
window.XP_BASE_PER_LEVEL = XP_BASE_PER_LEVEL;
window.XP_LEVELS_PER_CYCLE = XP_LEVELS_PER_CYCLE;

// Expose class so other systems (e.g. AI nations) can instantiate new instances
window.PlayerClass = PlayerClass;

// Create the singleton (replaced when a real player is loaded / created)
const Player = new PlayerClass();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlayerClass, Player, SKILL_DEFS, SKILL_COST_TABLE, XP_GROWTH_FACTOR, XP_BASE_PER_LEVEL, XP_LEVELS_PER_CYCLE };
}
