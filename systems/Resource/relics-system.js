/**
 * Relic System - National Relics for Sovereignty Epochs
 * 
 * 31 unique relics, each with an icon in assets/images/Relics/.
 * Every game week (state.day % 7 === 0), exactly 1 random relic spawns on
 * 1 random eligible nation (< 2 relics held). Duration is random 1–13 weeks.
 * Relics grant boosts to the holding nation.
 * 
 * Relics are:
 *   - Viewable per nation
 *   - Tradeable as treasures
 *   - Stealable via relic_liberation casus belli
 *   - Offerable as relic_transfer peace terms in all wars
 *   - Max 2 per nation
 */

const _global = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {});

const RELIC_DURATION_MIN = 1;
const RELIC_DURATION_MAX = 13;
const MAX_RELICS_PER_NATION = 2;

const RELICS = new Map([
  // Economic / production
  ['advanced-compass', { id: 'advanced-compass', name: 'Advanced Compass', category: 'economic', icon: 'assets/images/Relics/Advanced-Compass.png', boost: 'Tech Cost −5%', description: 'Reduces tech cost by 5%' }],
  ['edible-egg', { id: 'edible-egg', name: 'Edible Egg', category: 'economic', icon: 'assets/images/Relics/Edible-Egg.png', boost: 'Food Production ×2', description: 'Doubles food production (requires food production project)' }],
  ['potable-drink', { id: 'potable-drink', name: 'Potable Drink', category: 'economic', icon: 'assets/images/Relics/Potable-Drink.png', boost: 'Water Production ×2', description: 'Doubles water production (requires water production project)' }],
  ['production-bell', { id: 'production-bell', name: 'Production Bell', category: 'economic', icon: 'assets/images/Relics/Production-Bell.png', boost: 'Raw Production +50%', description: 'Produces 50% more raw resources (raw stage only)' }],
  ['territory-map', { id: 'territory-map', name: 'Territory Map', category: 'economic', icon: 'assets/images/Relics/Territory-Map.png', boost: 'Infra Cost −25%', description: 'Reduces infrastructure cost by 25%' }],
  ['new-lands-map', { id: 'new-lands-map', name: 'New Lands Map', category: 'economic', icon: 'assets/images/Relics/New-Lands-Map.png', boost: 'Land Cost −25%', description: 'Reduces land cost by 25%' }],
  ['the-jar', { id: 'the-jar', name: 'The Jar', category: 'economic', icon: 'assets/images/Relics/The-Jar.png', boost: '5%: +2% Currency', description: '5% chance each turn to gain 2% of current currency' }],
  ['tax-die', { id: 'tax-die', name: 'Tax Die', category: 'economic', icon: 'assets/images/Relics/Tax-Die.png', boost: 'Tax Multiplier 1.1–1.6x', description: 'Random tax-rate multiplier each turn' }],

  // Combat / war
  ['anger-idol', { id: 'anger-idol', name: 'Anger Idol', category: 'combat', icon: 'assets/images/Relics/Anger-Idol.png', boost: 'Attack +25%', description: 'Increases attack stat by 25% in war' }],
  ['bliss-idol', { id: 'bliss-idol', name: 'Bliss Idol', category: 'combat', icon: 'assets/images/Relics/Bliss-Idol.png', boost: 'Defense +25%', description: 'Increases defense stat by 25% in war' }],
  ['leader-band', { id: 'leader-band', name: 'Leader Band', category: 'combat', icon: 'assets/images/Relics/Leader-Band.png', boost: 'War Damage +10%', description: 'Increases damage dealt in war by 10%' }],
  ['lucky-skull', { id: 'lucky-skull', name: 'Lucky Skull', category: 'combat', icon: 'assets/images/Relics/Lucky-Skull.png', boost: 'Luck +15', description: 'Increases luck by 15' }],
  ['sands-of-time', { id: 'sands-of-time', name: 'Sands of Time', category: 'combat', icon: 'assets/images/Relics/Sands-of-Time.png', boost: 'Cooldowns −50%', description: 'Reduces all national cooldowns by 50%' }],
  ['trophy-of-pride', { id: 'trophy-of-pride', name: 'Trophy of Pride', category: 'combat', icon: 'assets/images/Relics/Trophy-of-Pride.png', boost: 'Last Unit Eff ×2', description: 'Doubles effectiveness of last unit type purchased' }],

  // Happiness / stats
  ['mask-of-joy', { id: 'mask-of-joy', name: 'Mask of Joy', category: 'happiness', icon: 'assets/images/Relics/Mask-of-Joy.png', boost: 'Happiness +30', description: 'National Happiness +30' }],
  ['unbreakable-lock', { id: 'unbreakable-lock', name: 'Unbreakable Lock', category: 'happiness', icon: 'assets/images/Relics/Unbreakable-Lock.png', boost: 'Crime −33%', description: 'Reduces national crime by 33%' }],
  ['unburning-torch', { id: 'unburning-torch', name: 'Unburning Torch', category: 'happiness', icon: 'assets/images/Relics/Unburning-Torch.png', boost: 'Pollution ÷2', description: 'Drops national pollution by half' }],

  // Espionage
  ['mask-of-deception', { id: 'mask-of-deception', name: 'Mask of Deception', category: 'espionage', icon: 'assets/images/Relics/Mask-of-Deception.png', boost: 'Spy Odds +33%', description: 'All spy ops have 33% better odds' }],

  // Loot / spawn rates
  ['chest-of-plenty', { id: 'chest-of-plenty', name: 'Chest of Plenty', category: 'loot', icon: 'assets/images/Relics/Chest-of-Plenty.png', boost: 'Chest Spawn +', description: 'Increases all chest types spawn rate for battle actions' }],
  ['key-of-plenty', { id: 'key-of-plenty', name: 'Key of Plenty', category: 'loot', icon: 'assets/images/Relics/Key-of-Plenty.png', boost: 'Key Spawn +', description: 'Increases all key types spawn rate for battle actions' }],
  ['loot-bag', { id: 'loot-bag', name: 'Loot Bag', category: 'loot', icon: 'assets/images/Relics/Loot-Bag.png', boost: '20%: Key/Chest/turn', description: 'Chance to grant loot every turn (20% total)' }],

  // Skills / XP
  ['courage-card', { id: 'courage-card', name: 'Courage Card', category: 'skills', icon: 'assets/images/Relics/Courage-Card.png', boost: '+1 Crit Dmg/Chance', description: 'Gives 1 extra critical damage and critical chance skill levels' }],
  ['mirror-of-selfishness', { id: 'mirror-of-selfishness', name: 'Mirror of Selfishness', category: 'skills', icon: 'assets/images/Relics/Mirror-of-Selfishness.png', boost: 'XP +33%', description: 'Increases XP gain by 33%' }],
  ['wild-card', { id: 'wild-card', name: 'Wild Card', category: 'skills', icon: 'assets/images/Relics/Wild-Card.png', boost: '+2 Random Skill Levels', description: 'Gives 2 random levels to non-maxed skills, changes every turn' }],

  // Food/water production override
  ['mysterious-drink', { id: 'mysterious-drink', name: 'Mysterious Drink', category: 'food_water', icon: 'assets/images/Relics/Mysterious-Drink.png', boost: '0.1 All Water', description: 'Produces 0.1 of all water types instead of 0.25 of nation water type (requires water production project)' }],
  ['mysterious-egg', { id: 'mysterious-egg', name: 'Mysterious Egg', category: 'food_water', icon: 'assets/images/Relics/Mysterious-Egg.png', boost: '0.1 All Food', description: 'Produces 0.1 of all food types instead of 0.25 of nation food type (requires food production project)' }],

  // Government / religion
  ['official-seal', { id: 'official-seal', name: 'Official Seal', category: 'government', icon: 'assets/images/Relics/Official-Seal.png', boost: 'Gov Effects ×2', description: 'Doubles government effects (boosts and penalties)' }],
  ['official-tapestry', { id: 'official-tapestry', name: 'Official Tapestry', category: 'religion', icon: 'assets/images/Relics/Official-Tapestry.png', boost: 'Religion Effects ×2', description: 'Doubles religion effects (boosts and penalties)' }],

  // Special / protection
  ['candle-of-peace', { id: 'candle-of-peace', name: 'Candle of Peace', category: 'special', icon: 'assets/images/Relics/Candle-of-Peace.png', boost: 'No Incoming War', description: 'Nation cannot have war declared on them (can still declare on others)' }],
  ['ashes-of-ancestors', { id: 'ashes-of-ancestors', name: 'Ashes of Ancestors', category: 'special', icon: 'assets/images/Relics/Ashes-of-Ancestors.png', boost: 'No Diseases', description: 'No national diseases spawn for held nation' }],

  // Transition / manufacturing
  ['transition-bell', { id: 'transition-bell', name: 'Transition Bell', category: 'transition', icon: 'assets/images/Relics/Transition-Bell.png', boost: '+2 Manufactured', description: 'Produces 2 Manufactured when transitioning 2 Stage3 → Manufactured (all resource types)' }],
]);

// Loot Bag drop table: independent per-turn rolls
const LOOT_BAG_DROPS = [
  { type: 'key1', chance: 0.055 },
  { type: 'key2', chance: 0.025 },
  { type: 'key3', chance: 0.015 },
  { type: 'chest1', chance: 0.055 },
  { type: 'chest2', chance: 0.025 },
  { type: 'chest3', chance: 0.015 },
  { type: 'chest4', chance: 0.01 },
];

class RelicSystem {
    constructor() {
        this.isInitialized = false;
        this.activeRelics = []; // [{ relicId, holderNationId, acquiredAtDay, weeksTotal, weeksRemaining }]
        this.lastSpawnDay = 0;
    }

    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log('RelicSystem initialized');
        _global.EventBus?.emit('relic_system_initialized');
    }

    restore(savedState) {
        if (savedState) {
            this.activeRelics = savedState.activeRelics || [];
            this.lastSpawnDay = savedState.lastSpawnDay || 0;
        } else {
            this.activeRelics = [];
            this.lastSpawnDay = 0;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // QUERY METHODS
    // ══════════════════════════════════════════════════════════════════════════

    getRelic(relicId) {
        return RELICS.get(relicId) || null;
    }

    getAllRelics() {
        return [...RELICS.entries()].map(([id, def]) => def);
    }

    getRelicIconPath(relicId) {
        const relic = RELICS.get(relicId);
        return relic ? relic.icon : null;
    }

    getBoostSummary(relicId) {
        const relic = RELICS.get(relicId);
        return relic ? relic.boost : null;
    }

    nationCanHoldRelic(nation) {
        return (nation.relics || []).length < MAX_RELICS_PER_NATION;
    }

    getHolderRelics(nation) {
        return (nation.relics || []).map(r => {
            const def = RELICS.get(r.relicId);
            return { ...r, name: def ? def.name : r.relicId, boost: def ? def.boost : null, icon: def ? def.icon : null };
        });
    }

    hasRelic(nation, relicId) {
        return (nation.relics || []).some(r => r.relicId === relicId);
    }

    getRelicEntry(nation, relicId) {
        return (nation.relics || []).find(r => r.relicId === relicId) || null;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SPAWN / DECAY (weekly)
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Spawn one random relic on one random eligible nation.
     * Call from world.js advance() when state.day % 7 === 0.
     */
    spawnWeeklyRelic(world) {
        if (!world) return null;

        const eligibleNations = [];
        for (const r of world.rules.values()) {
            const nation = r.nation;
            if (nation && this.nationCanHoldRelic(nation)) {
                eligibleNations.push(r);
            }
        }

        if (eligibleNations.length === 0) {
            return null; // No eligible nation, skip this week
        }

        // Pick random relic ID from all 31
        const relicIds = [...RELICS.keys()];
        const relicId = relicIds[Math.floor(Math.random() * relicIds.length)];

        // Pick random eligible nation
        const r = eligibleNations[Math.floor(Math.random() * eligibleNations.length)];
        const nation = r.nation;

        const weeksTotal = Math.floor(Math.random() * (RELIC_DURATION_MAX - RELIC_DURATION_MIN + 1)) + RELIC_DURATION_MIN;
        const weeksRemaining = weeksTotal;

        const relicEntry = {
            relicId,
            acquiredAtDay: world.state.day,
            weeksTotal,
            weeksRemaining,
        };

        nation.relics = nation.relics || [];
        nation.relics.push(relicEntry);

        this.activeRelics.push({ ...relicEntry, holderNationId: nation.id });
        this.lastSpawnDay = world.state.day;

        _global.EventBus?.emit('relic_spawned', {
            relicId,
            holderNationId: nation.id,
            weeksRemaining,
            relicName: this.getRelic(relicId)?.name,
        });

        console.log(`Relic spawned: ${relicId} on ${nation.name} for ${weeksRemaining} weeks`);
        return relicEntry;
    }

    /**
     * Decay all active relics by 1 week. Remove expired ones.
     * Call from world.js advance() when state.day % 7 === 0 (after spawn).
     */
    decayWeeklyRelics(world) {
        if (!world) return;

        const expired = [];
        const stillActive = [];

        for (const relic of this.activeRelics) {
            relic.weeksRemaining -= 1;
            if (relic.weeksRemaining <= 0) {
                expired.push(relic);
                // Remove from holder nation
                const holder = world.nation(relic.holderNationId);
                if (holder && holder.nation) {
                    holder.nation.relics = (holder.nation.relics || []).filter(
                        r => !(r.relicId === relic.relicId && r.acquiredAtDay === relic.acquiredAtDay)
                    );
                }
                _global.EventBus?.emit('relic_despawned', {
                    relicId: relic.relicId,
                    holderNationId: relic.holderNationId,
                });
            } else {
                stillActive.push(relic);
            }
        }

        this.activeRelics = stillActive;

        if (expired.length > 0) {
            console.log(`${expired.length} relic(s) de-spawned`);
        }

        return expired;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BOOST APPLICATION (per turn)
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Apply all active relic stat boosts to a nation.
     * Call at START of world.js processTurn(), before resource/food/water calcs.
     */
    applyBoosts(nation, player = null) {
        if (!nation || !nation.relics) return;

        const relics = nation.relics;
        if (relics.length === 0) return;

        // Store cached boost flags on nation for quick reading by other systems
        nation.relicBoosts = nation.relicBoosts || {};
        nation.relicBoosts.techCostMult = this.hasRelic(nation, 'advanced-compass') ? 0.95 : 1;
        nation.relicBoosts.infraCostMult = this.hasRelic(nation, 'territory-map') ? 0.75 : 1;
        nation.relicBoosts.landCostMult = this.hasRelic(nation, 'new-lands-map') ? 0.75 : 1;
        nation.relicBoosts.crimeMult = this.hasRelic(nation, 'unbreakable-lock') ? 0.67 : 1;
        nation.relicBoosts.pollutionMult = this.hasRelic(nation, 'unburning-torch') ? 0.5 : 1;
        nation.relicBoosts.happinessAdd = (this.hasRelic(nation, 'mask-of-joy') ? 30 : 0);
        nation.relicBoosts.govEffectMult = this.hasRelic(nation, 'official-seal') ? 2 : 1;
        nation.relicBoosts.religionEffectMult = this.hasRelic(nation, 'official-tapestry') ? 2 : 1;

        // Edge case: Candle of Peace holder cannot be declared on
        nation.relicBoosts.candleOfPeace = this.hasRelic(nation, 'candle-of-peace');
        nation.relicBoosts.ashesOfAncestors = this.hasRelic(nation, 'ashes-of-ancestors');

        // Sands of Time cooldown reduction
        nation.relicBoosts.cooldownMult = this.hasRelic(nation, 'sands-of-time') ? 0.5 : 1;

        // Leader Band war damage
        nation.relicBoosts.warDamageMult = this.hasRelic(nation, 'leader-band') ? 1.10 : 1;

        // Anger Idol: attack +25% in war
        nation.relicBoosts.angerIdolAttack = this.hasRelic(nation, 'anger-idol') ? 0.25 : 0;

        // Bliss Idol: defense +25% in war
        nation.relicBoosts.blissIdolDefense = this.hasRelic(nation, 'bliss-idol') ? 1.25 : 1;

        // Lucky Skull: luck +15
        nation.relicBoosts.luckySkull = this.hasRelic(nation, 'lucky-skull') ? 15 : 0;

        // Chest of Plenty: chest spawn rate boost
        nation.relicBoosts.chestOfPlenty = this.hasRelic(nation, 'chest-of-plenty') ? 1.5 : 1;

        // Key of Plenty: key spawn rate boost
        nation.relicBoosts.keyOfPlenty = this.hasRelic(nation, 'key-of-plenty') ? 1.5 : 1;

        // Production Bell: raw production ×1.5
        nation.relicBoosts.rawProductionMult = this.hasRelic(nation, 'production-bell') ? 1.5 : 1;

        // Transition Bell: +2 manufactured when transitioning stage3→manufactured
        nation.relicBoosts.transitionBell = this.hasRelic(nation, 'transition-bell') ? true : false;

        // Edible Egg / Potable Drink / Mysterious Egg / Mysterious Drink
        nation.relicBoosts.edibleEgg = this.hasRelic(nation, 'edible-egg') ? true : false;
        nation.relicBoosts.potableDrink = this.hasRelic(nation, 'potable-drink') ? true : false;
        nation.relicBoosts.mysteriousEgg = this.hasRelic(nation, 'mysterious-egg') ? true : false;
        nation.relicBoosts.mysteriousDrink = this.hasRelic(nation, 'mysterious-drink') ? true : false;

        // Trophy of Pride last unit type
        nation.relicBoosts.trophyOfPrideUnit = nation.lastUnitTypePurchased || null;

        // Mirror of Selfishness: XP +33% — stored on player for _awardExperience to read
        if (player) {
            player.relicXpMult = this.hasRelic(nation, 'mirror-of-selfishness') ? 1.33 : 1;
        }

        // ═══════════════════════════════════════════════════════════════════════
        // Player skill modifications (Courage Card — permanent while holding)
        // ════════════════════════════════════════════════════════════════════════
        if (player && player.skills && this.hasRelic(nation, 'courage-card')) {
            const SKILL_DEFS = _global.SKILL_DEFS || {};
            const critDmg = player.skills.criticalDamage;
            const critCh = player.skills.criticalChance;
            const maxLvl = SKILL_DEFS.criticalDamage?.maxLevels || 10;
            if (critDmg && critDmg.level < maxLvl) critDmg.level = Math.min(critDmg.level + 1, maxLvl);
            if (critCh && critCh.level < maxLvl) critCh.level = Math.min(critCh.level + 1, maxLvl);
        }
    }

    /**
     * Per-turn random effects for relics.
     * Call at END of world.js processTurn().
     */
    processTurn(nation) {
        if (!nation || !nation.relics) return;
        const world = _global.world; // may be set externally
        const player = _global.Player;

        const relics = nation.relics;
        if (relics.length === 0) return;

        for (const relic of relics) {
            const relicId = relic.relicId;

            // The Jar: 5% chance to give 2% of current currency
            if (relicId === 'the-jar') {
                if (Math.random() < 0.05) {
                    const gift = Math.floor((nation.money || 0) * 0.02);
                    if (gift > 0) {
                        nation.money += gift;
                        _global.EventBus?.emit('relic_effect', {
                            relicId: 'the-jar',
                            nationId: nation.id,
                            effect: 'currency_gift',
                            amount: gift,
                        });
                    }
                }
            }

            // Loot Bag: independent per-turn rolls for keys/chests
            if (relicId === 'loot-bag') {
                for (const drop of LOOT_BAG_DROPS) {
                    if (Math.random() < drop.chance) {
                        this._grantLootItem(nation, drop.type);
                        _global.EventBus?.emit('relic_effect', {
                            relicId: 'loot-bag',
                            nationId: nation.id,
                            effect: 'loot_drop',
                            itemType: drop.type,
                        });
                    }
                }
            }

            // Wild Card: +2 levels to 2 distinct non-maxed skills, re-rolled every turn
            if (relicId === 'wild-card') {
                this._applyWildCard(nation, player);
            }

            // Tax Die: random multiplier 1.1–1.6, re-rolled each turn
            // Applied in nation-system calculateEconomy via nation.relicBoosts.taxMult
            if (relicId === 'tax-die') {
                nation.relicBoosts = nation.relicBoosts || {};
                nation.relicBoosts.taxMult = 1.1 + Math.random() * 0.5; // 1.1 to 1.6
            }
        }
    }

    _grantLootItem(nation, itemType) {
        // Grant equipment keys/chests to nation
        nation.equipment = nation.equipment || {
            inventory: [],
            keys: { key1: 0, key2: 0, key3: 0 },
            chests: { chest1: 0, chest2: 0, chest3: 0, chest4: 0 },
            equipped: { weapon: null, head: null, body: null, arms: null, legs: null, feet: null, tool: null },
        };

        if (itemType.startsWith('key')) {
            nation.equipment.keys[itemType] = (nation.equipment.keys[itemType] || 0) + 1;
        } else if (itemType.startsWith('chest')) {
            nation.equipment.chests[itemType] = (nation.equipment.chests[itemType] || 0) + 1;
        }
    }

    _applyWildCard(nation, player) {
        if (!player || !player.skills) return;

        // Remove previous Wild Card boosts if tracked
        if (nation.relicWildCardBoostedSkills) {
            for (const skillKey of nation.relicWildCardBoostedSkills) {
                const skill = player.skills[skillKey];
                if (skill && skill.level > 0) {
                    skill.level = Math.max(0, skill.level - 1);
                }
            }
        }

        // Find non-maxed skills
        const nonMaxed = [];
        for (const [skillKey, skill] of Object.entries(player.skills)) {
            const def = _global.SKILL_DEFS || {};
            const maxLevels = def[skillKey]?.maxLevels || 10;
            if (skill.level < maxLevels) {
                nonMaxed.push(skillKey);
            }
        }

        if (nonMaxed.length === 0) {
            nation.relicWildCardBoostedSkills = [];
            return;
        }

        // Pick 2 distinct random skills
        const shuffled = [...nonMaxed].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, Math.min(2, shuffled.length));

        for (const skillKey of picked) {
            const skill = player.skills[skillKey];
            if (skill) {
                skill.level = Math.min(skill.level + 1, (_global.SKILL_DEFS?.[skillKey]?.maxLevels) || 10);
            }
        }

        nation.relicWildCardBoostedSkills = picked;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TRANSFER (trade / war / peace)
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Transfer a relic from one nation to another, preserving weeksRemaining.
     * Returns { success, error }.
     */
    transferRelic(fromNation, toNation, relicId, world) {
        if (!fromNation || !toNation) {
            return { success: false, error: 'Invalid nations' };
        }

        const entry = this.getRelicEntry(fromNation, relicId);
        if (!entry) {
            return { success: false, error: 'From nation does not hold this relic' };
        }

        if (!this.nationCanHoldRelic(toNation)) {
            return { success: false, error: 'To nation already holds 2 relics' };
        }

        // Remove from fromNation
        fromNation.relics = (fromNation.relics || []).filter(
            r => !(r.relicId === relicId && r.acquiredAtDay === entry.acquiredAtDay)
        );
        this.activeRelics = this.activeRelics.filter(
            r => !(r.holderNationId === fromNation.id && r.relicId === relicId && r.acquiredAtDay === entry.acquiredAtDay)
        );

        // Add to toNation with same weeksRemaining
        const newEntry = {
            relicId,
            acquiredAtDay: world ? world.state.day : entry.acquiredAtDay,
            weeksTotal: entry.weeksTotal,
            weeksRemaining: entry.weeksRemaining, // time remaining unchanged
        };
        toNation.relics = toNation.relics || [];
        toNation.relics.push(newEntry);

        this.activeRelics.push({ ...newEntry, holderNationId: toNation.id });

        _global.EventBus?.emit('relic_transferred', {
            relicId,
            fromNationId: fromNation.id,
            toNationId: toNation.id,
            weeksRemaining: entry.weeksRemaining,
        });

        console.log(`Relic ${relicId} transferred from ${fromNation.name} to ${toNation.name} (${entry.weeksRemaining} weeks left)`);
        return { success: true };
    }

    removeRelic(nation, relicId, world) {
        const entry = this.getRelicEntry(nation, relicId);
        if (!entry) return false;

        nation.relics = (nation.relics || []).filter(
            r => !(r.relicId === relicId && r.acquiredAtDay === entry.acquiredAtDay)
        );
        this.activeRelics = this.activeRelics.filter(
            r => !(r.holderNationId === nation.id && r.relicId === relicId && r.acquiredAtDay === entry.acquiredAtDay)
        );
        return true;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RelicSystem, RELICS, MAX_RELICS_PER_NATION, RELIC_DURATION_MIN, RELIC_DURATION_MAX };
}

if (typeof window !== 'undefined') {
    window.RelicSystem = RelicSystem;
    window.relicSystem = new RelicSystem();
}
