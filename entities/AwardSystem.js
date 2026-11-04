/**
 * AwardSystem - Achievement and award tracking for nations and players
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Handles cosmetic awards (no gameplay bonuses) for bragging rights.
 * Awards are organized into categories covering all game mechanics.
 *
 * Each award has: id, name, description, category, icon (emoji + theme hint),
 *   threshold (number required), type (counter or peak), trackKey (data path).
 *
 * Awards are tracked per-nation. When a nation unlocks an award,
 * an EventBus event 'award_unlocked' is emitted.
 *
 * TRACKING KEYS (must match actual data paths on Nation/Player objects):
 *   Nation: nation.statistics.*, nation.money, nation.tech, nation.population,
16:  *           nation.militaryUnits.soldiers/tanks/aircraft/ships/spies/missiles/nukes,
17:  *   Player: player.statistics.*
 */

class AwardSystem {
    constructor() {
        this.isInitialized = false;

        // Award definitions: id -> award config
        this.awards = new Map();

        // Nation awards: nationId -> Set of awardIds earned
        this.nationAwards = new Map();

        // Player awards: playerId -> Set of awardIds earned
        this.playerAwards = new Map();

        // Award categories for organization
        this.categories = new Map();

        // TrackKey -> Array of {id, threshold} sorted by threshold ascending (for tier replacement)
        this._trackKeyTiers = new Map();

        this._defineAwards();
        this._buildTrackKeyTiers();
        this._defineCategories();

        this.isInitialized = true;
        console.log(`AwardSystem initialized with ${this.awards.size} awards across ${this.categories.size} categories`);
    }

    // ═════════════════════════════════════════════════════════════════════════════════
    // AWARD DEFINITIONS
    // ══════════════════════════════════════════════════════════════════════════════════

    _defineAwards() {
        // Load award definitions from external data files (assets/data/awards/*.js)
        // Each file sets window.AwardData_<Category> as an array of award configs
        const dataSources = [
            window.AwardData_militaryWar,
            window.AwardData_populationCitizen,
            window.AwardData_researchTech,
            window.AwardData_nationPlayer,
            window.AwardData_sportsTournament,
            window.AwardData_forumMessage,
            window.AwardData_diplomacyTies,
        ];

        for (const source of dataSources) {
            if (!Array.isArray(source)) continue;
            for (const award of source) {
                this._define(
                    award.id,
                    award.name,
                    award.description,
                    award.category,
                    award.icon,
                    award.trackKey,
                    award.threshold,
                    award.type,
                );
            }
        }
    }

    _define(id, name, description, category, icon, trackKey, threshold, type = 'counter') {
        if (this.awards.has(id)) {
            console.warn(`AwardSystem: Duplicate award id '${id}' overwriting existing award`);
        }
        this.awards.set(id, {
            id,
            name,
            description,
            category,
            icon,
            trackKey,
            threshold,
            type,
            categoryIcon: this._getCategoryIcon(category),
        });
    }

    _defineCategories() {
        this.categories.set('military-war', { name: 'Military & War', icon: '⚔️', count: 0 });
        this.categories.set('population-citizen', { name: 'Population & Citizens', icon: '👥', count: 0 });
        this.categories.set('research-tech', { name: 'Research & Technology', icon: '🔬', count: 0 });
        this.categories.set('nation-player', { name: 'Nation & Player', icon: '🏛️', count: 0 });
        this.categories.set('sports-tournament', { name: 'Sports & Tournament', icon: '🏅', count: 0 });
        this.categories.set('forum-message', { name: 'Forum & Messages', icon: '💬', count: 0 });
        this.categories.set('diplomacy-ties', { name: 'Diplomacy & Ties', icon: '🤝', count: 0 });

        // Count awards per category
        for (const award of this.awards.values()) {
            const cat = this.categories.get(award.category);
            if (cat) cat.count++;
        }
    }

    /**
     * Build a map of trackKey -> [{id, threshold}] sorted by threshold ascending.
     * Used to remove lower tiers when a higher tier is unlocked.
     */
    _buildTrackKeyTiers() {
        for (const [id, award] of this.awards) {
            const key = award.trackKey;
            if (!this._trackKeyTiers.has(key)) {
                this._trackKeyTiers.set(key, []);
            }
            this._trackKeyTiers.get(key).push({ id, threshold: award.threshold });
        }
        // Sort each array by threshold ascending
        for (const tiers of this._trackKeyTiers.values()) {
            tiers.sort((a, b) => a.threshold - b.threshold);
        }
    }

    /**
     * Remove all lower-tier awards from the same trackKey as the given awardId.
     * Ensures only the highest tier per trackKey is held by an entity.
     */
    _removeLowerTiers(entityId, awardId, type) {
        const award = this.awards.get(awardId);
        if (!award) return;

        const tiers = this._trackKeyTiers.get(award.trackKey);
        if (!tiers) return;

        const awardedIndex = tiers.findIndex(t => t.id === awardId);
        if (awardedIndex === -1) return;

        const entityAwards = type === 'nation'
            ? this._getNationAwards(entityId)
            : this._getPlayerAwards(entityId);

        // Remove all tiers below the awarded one
        for (let i = 0; i < awardedIndex; i++) {
            entityAwards.delete(tiers[i].id);
        }
    }

    _getCategoryIcon(category) {
        const map = {
            'military-war': '⚔️',
            'population-citizen': '👥',
            'research-tech': '🔬',
            'nation-player': '🏛️',
            'sports-tournament': '🏅',
            'forum-message': '💬',
            'diplomacy-ties': '🤝',
        };
        return map[category] || '🏅';
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // AWARD CHECKING & AWARDING
    // ════════════════════════════════════════════════════════════════════════════════

    checkNationAwards(nation) {
        if (!this.isInitialized || !nation) return [];

        const newlyAwarded = [];
        const nationAwards = this._getNationAwards(nation.id);

        for (const [id, award] of this.awards) {
            if (nationAwards.has(id)) continue; // Already earned

            const value = this._getAwardValue(nation, award.trackKey);
            if (value >= award.threshold) {
                this._awardNation(nation.id, id);
                newlyAwarded.push(award);
            }
        }

        return newlyAwarded;
    }

    checkPlayerAwards(player) {
        if (!this.isInitialized || !player) return [];

        const newlyAwarded = [];
        const playerAwards = this._getPlayerAwards(player.playerId || player.id);

        for (const [id, award] of this.awards) {
            if (playerAwards.has(id)) continue;

            const value = this._getPlayerAwardValue(player, award.trackKey);
            if (value >= award.threshold) {
                this._awardPlayer(player.playerId || player.id, id);
                newlyAwarded.push(award);
            }
        }

        return newlyAwarded;
    }

    _getAwardValue(nation, trackKey) {
        // Navigate nested object paths like 'statistics.warsWon' or 'military_units_soldiers'
        const parts = trackKey.split('.');
        let value = nation;
        for (const part of parts) {
            value = value?.[part];
            if (value === undefined || value === null) {
                console.warn(`AwardSystem: trackKey '${trackKey}' unresolvable on nation '${nation.id}' (missing '${part}'), treating as 0`);
                return 0;
            }
        }
        return Number(value) || 0;
    }

    _getPlayerAwardValue(player, trackKey) {
        const parts = trackKey.split('.');
        let value = player;
        for (const part of parts) {
            value = value?.[part];
            if (value === undefined || value === null) {
                console.warn(`AwardSystem: trackKey '${trackKey}' unresolvable on player '${player.playerId || player.id}' (missing '${part}'), treating as 0`);
                return 0;
            }
        }
        return Number(value) || 0;
    }

    _getNationAwards(nationId) {
        if (!this.nationAwards.has(nationId)) {
            this.nationAwards.set(nationId, new Set());
        }
        return this.nationAwards.get(nationId);
    }

    _getPlayerAwards(playerId) {
        if (!this.playerAwards.has(playerId)) {
            this.playerAwards.set(playerId, new Set());
        }
        return this.playerAwards.get(playerId);
    }

    _awardNation(nationId, awardId) {
        const nationAwards = this._getNationAwards(nationId);
        nationAwards.add(awardId);

        // Remove lower tiers from the same trackKey so only the highest tier is held
        this._removeLowerTiers(nationId, awardId, 'nation');

        const award = this.awards.get(awardId);
        this.emit('award_unlocked', {
            type: 'nation',
            id: nationId,
            award,
            timestamp: Date.now(),
        });
    }

    _awardPlayer(playerId, awardId) {
        const playerAwards = this._getPlayerAwards(playerId);
        playerAwards.add(awardId);

        // Remove lower tiers from the same trackKey so only the highest tier is held
        this._removeLowerTiers(playerId, awardId, 'player');

        const award = this.awards.get(awardId);
        this.emit('award_unlocked', {
            type: 'player',
            id: playerId,
            award,
            timestamp: Date.now(),
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // QUERY METHODS
    // ════════════════════════════════════════════════════════════════════════════════

    getAward(awardId) {
        return this.awards.get(awardId);
    }

    getAllAwards() {
        return Array.from(this.awards.values());
    }

    getAwardsByCategory(category) {
        return Array.from(this.awards.values()).filter(a => a.category === category);
    }

    getNationAwards(nationId) {
        return Array.from(this._getNationAwards(nationId)).map(id => this.awards.get(id));
    }

    getPlayerAwards(playerId) {
        return Array.from(this._getPlayerAwards(playerId)).map(id => this.awards.get(id));
    }

    hasAward(entityId, awardId, type = 'nation') {
        if (type === 'nation') {
            return this._getNationAwards(entityId).has(awardId);
        }
        return this._getPlayerAwards(entityId).has(awardId);
    }

    getAwardCount(entityId, type = 'nation') {
        if (type === 'nation') {
            return this._getNationAwards(entityId).size;
        }
        return this._getPlayerAwards(entityId).size;
    }

    getCategories() {
        return Array.from(this.categories.values());
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // EVENT EMITTER (minimal)
    // ════════════════════════════════════════════════════════════════════════════════

    emit(eventName, data) {
        const bus = typeof window !== 'undefined' ? window.EventBus : (typeof EventBus !== 'undefined' ? EventBus : null);
        if (bus) {
            bus.emit(eventName, data);
        } else {
            console.warn(`AwardSystem: EventBus not available, dropping event '${eventName}'`);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ════════════════════════════════════════════════════════════════════════════════

    serialize() {
        return {
            nationAwards: Object.fromEntries(
                Array.from(this.nationAwards.entries()).map(([id, set]) => [id, Array.from(set)])
            ),
            playerAwards: Object.fromEntries(
                Array.from(this.playerAwards.entries()).map(([id, set]) => [id, Array.from(set)])
            ),
        };
    }

    deserialize(data) {
        this.nationAwards.clear();
        this.playerAwards.clear();
        if (data.nationAwards) {
            for (const [id, set] of Object.entries(data.nationAwards)) {
                this.nationAwards.set(id, new Set(set));
            }
        }
        if (data.playerAwards) {
            for (const [id, set] of Object.entries(data.playerAwards)) {
                this.playerAwards.set(id, new Set(set));
            }
        }
    }
}

// Create global instance
const AwardSystemInstance = new AwardSystem();

if (typeof window !== 'undefined') {
    window.AwardSystem = AwardSystemInstance;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AwardSystem, AwardSystemInstance };
}
