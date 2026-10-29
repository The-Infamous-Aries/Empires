/**
 * Team-Player System - Player Management with Expanded Names, Injuries, Traits
 * Dominion Wars - Nation Building Strategy Game
 */

class TeamPlayerSystem {
    constructor(sportsSystem) {
        this.sports = sportsSystem;

        this.sportTypes = ['basketball', 'hockey', 'soccer', 'football'];
        this.playerPositions = {
            basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
            hockey: ['Goalkeeper', 'Left Defense', 'Right Defense', 'Left Wing', 'Center', 'Right Wing'],
            soccer: ['Goalkeeper', 'Left Back', 'Center Back', 'Center Back', 'Right Back', 'Defensive Mid', 'Central Mid', 'Central Mid', 'Left Wing', 'Right Wing', 'Striker'],
            football: {
                offense: ['Quarterback', 'Running Back', 'Wide Receiver', 'Slot Receiver', 'Tight End', 'Left Tackle', 'Left Guard', 'Center', 'Right Guard', 'Right Tackle', 'Kicker'],
                defense: ['Defensive End', 'Defensive Tackle', 'Nose Tackle', 'Defensive End', 'Middle Linebacker', 'Outside Linebacker', 'Outside Linebacker', 'Cornerback', 'Cornerback', 'Free Safety', 'Strong Safety'],
            },
        };

        this.demographics = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];
        this.seasonsPerDemographic = 4;
        this.maxSeasonsFromTeen = 20;

        // ── Sport Attributes per specification ───────────────────────────
        // Basketball: Speed, Stamina, Passing, Awareness, Endurance, Shooting, Defense, Rebounding, Stealing (9 total)
        // Hockey: Speed, Stamina, Spirit, Awareness, Endurance, Passing, Shooting, Defense, Goaltending (9 total)
        // Soccer: Stamina, Awareness, Endurance, Passing, Shooting, Defense, Goaltending (7 total)
        // Football: Stamina, Awareness, Endurance, Passing, Catching, Defense, Strength, Speed (8 total)
        this.sportAttributes = {
            basketball: ['speed', 'stamina', 'passing', 'awareness', 'endurance', 'shooting', 'defense', 'rebounding', 'stealing'],
            hockey: ['speed', 'stamina', 'spirit', 'awareness', 'endurance', 'passing', 'shooting', 'defense', 'goaltending'],
            soccer: ['stamina', 'awareness', 'endurance', 'passing', 'shooting', 'defense', 'goaltending'],
            football: ['stamina', 'awareness', 'endurance', 'passing', 'catching', 'defense', 'strength', 'speed'],
        };

        // ── Position attribute bonuses (per sport) ───────────────────────
        this.positionAttributes = {
            basketball: {
                'Point Guard': ['passing', 'speed', 'awareness', 'stealing'],
                'Shooting Guard': ['shooting', 'speed', 'awareness'],
                'Small Forward': ['shooting', 'defense', 'stamina'],
                'Power Forward': ['defense', 'rebounding', 'endurance'],
                'Center': ['defense', 'rebounding', 'endurance'],
            },
            hockey: {
                'Goalkeeper': ['goaltending', 'awareness', 'endurance'],
                'Left Defense': ['defense', 'spirit', 'endurance'],
                'Right Defense': ['defense', 'spirit', 'endurance'],
                'Left Wing': ['shooting', 'speed', 'passing'],
                'Center': ['passing', 'speed', 'awareness'],
                'Right Wing': ['shooting', 'speed', 'passing'],
            },
            soccer: {
                'Goalkeeper': ['goaltending', 'awareness', 'endurance'],
                'Left Back': ['defense', 'stamina', 'awareness'],
                'Center Back': ['defense', 'endurance', 'awareness'],
                'Right Back': ['defense', 'stamina', 'awareness'],
                'Defensive Mid': ['defense', 'passing', 'endurance'],
                'Central Mid': ['passing', 'stamina', 'awareness'],
                'Left Wing': ['shooting', 'stamina', 'awareness'],
                'Right Wing': ['shooting', 'stamina', 'awareness'],
                'Striker': ['shooting', 'passing', 'awareness'],
            },
            football: {
                offense: {
                    'Quarterback': ['passing', 'awareness', 'strength'],
                    'Running Back': ['speed', 'strength', 'endurance'],
                    'Wide Receiver': ['speed', 'catching', 'awareness'],
                    'Slot Receiver': ['speed', 'catching', 'awareness'],
                    'Tight End': ['catching', 'strength', 'defense'],
                    'Left Tackle': ['strength', 'defense', 'endurance'],
                    'Left Guard': ['strength', 'defense', 'endurance'],
                    'Center': ['strength', 'defense', 'awareness'],
                    'Right Guard': ['strength', 'defense', 'endurance'],
                    'Right Tackle': ['strength', 'defense', 'endurance'],
                    'Kicker': ['awareness', 'endurance', 'strength'],
                },
                defense: {
                    'Defensive End': ['defense', 'strength', 'speed'],
                    'Defensive Tackle': ['defense', 'strength', 'endurance'],
                    'Nose Tackle': ['defense', 'strength', 'endurance'],
                    'Middle Linebacker': ['defense', 'speed', 'awareness'],
                    'Outside Linebacker': ['defense', 'speed', 'awareness'],
                    'Cornerback': ['speed', 'catching', 'defense'],
                    'Free Safety': ['speed', 'awareness', 'defense'],
                    'Strong Safety': ['speed', 'awareness', 'defense'],
                },
            },
        };

        // ── Injury data imported from assets/data/Sports/injuries.js ──
        let injuryData = null;
        if (typeof require !== 'undefined') {
            try { injuryData = require('../../assets/data/Sports/injuries.js'); } catch(e) {}
        }
        // Also check globals (set by VM bundle or browser script tag)
        if (!injuryData && typeof window !== 'undefined') {
            injuryData = window.SportsInjuries || {
                injuryParts: typeof injuryParts !== 'undefined' ? injuryParts : [],
                injuryBySeverity: typeof injuryBySeverity !== 'undefined' ? injuryBySeverity : {},
                severityMeta: typeof severityMeta !== 'undefined' ? severityMeta : {},
            };
        }

        this.injuryParts = injuryData ? injuryData.injuryParts : [];
        this.injuryBySeverity = injuryData ? injuryData.injuryBySeverity : {};
        this.severityMeta = injuryData ? injuryData.severityMeta : {};

        // ── Traits imported from assets/data/Sports/traits.js ──
        let traitData = null;
        if (typeof require !== 'undefined') {
            try { traitData = require('../../assets/data/Sports/traits.js'); } catch(e) {}
        }
        if (!traitData && typeof window !== 'undefined') {
            traitData = window.SportsTraits || {
                goodTraits: typeof goodTraits !== 'undefined' ? goodTraits : {},
                badTraits: typeof badTraits !== 'undefined' ? badTraits : {},
                allTraits: typeof allTraits !== 'undefined' ? allTraits : {},
                goodTraitKeys: typeof goodTraitKeys !== 'undefined' ? goodTraitKeys : [],
                badTraitKeys: typeof badTraitKeys !== 'undefined' ? badTraitKeys : [],
            };
        }

        this.traits = traitData.allTraits || {};
        this.traitKeys = [...(traitData.goodTraitKeys || []), ...(traitData.badTraitKeys || [])];
        this.goodTraitKeys = traitData.goodTraitKeys || Object.keys(this.traits).filter(k => this.traits[k]?.type === 'good');
        this.badTraitKeys = traitData.badTraitKeys || Object.keys(this.traits).filter(k => this.traits[k]?.type === 'bad');

        // ── Names imported from assets/data/Sports/names.js ──
        let nameData = null;
        if (typeof require !== 'undefined') {
            try { nameData = require('../../assets/data/Sports/names.js'); } catch(e) {}
        }
        if (!nameData && typeof window !== 'undefined') {
            nameData = window.SportsNames || {
                maleFirstNames: typeof maleFirstNames !== 'undefined' ? maleFirstNames : [],
                femaleFirstNames: typeof femaleFirstNames !== 'undefined' ? femaleFirstNames : [],
                middleNames: typeof middleNames !== 'undefined' ? middleNames : [],
                lastNames: typeof lastNames !== 'undefined' ? lastNames : [],
                pickRandom: typeof pickRandom !== 'undefined' ? pickRandom : (arr) => arr[Math.floor(Math.random() * arr.length)],
                generateName: typeof generateName !== 'undefined' ? generateName : null,
            };
        }

        this.maleFirstNames = nameData.maleFirstNames || [];
        this.femaleFirstNames = nameData.femaleFirstNames || [];
        this.middleNames = nameData.middleNames || [];
        this.lastNames = nameData.lastNames || [];
        this._pickRandom = nameData.pickRandom || ((arr) => arr[Math.floor(Math.random() * arr.length)]);
    }

    // ═════════════════════════════════════════════════════════════════════
    // NAME GENERATOR
    // ════════════════════════════════════════════════════════════════════

    generateName() {
        const gender = Math.random() < 0.5 ? 'male' : 'female';
        const firstLists = { male: this.maleFirstNames, female: this.femaleFirstNames };
        const first = this._pickRandom(firstLists[gender]);
        const middle = Math.random() < 0.3 ? this._pickRandom(this.middleNames) + ' ' : '';
        const last = this._pickRandom(this.lastNames);
        return `${first} ${middle}${last}`.trim();
    }

    // ═════════════════════════════════════════════════════════════════════
    // INJURY GENERATOR - {injury} + {part} per severity
    // ═════════════════════════════════════════════════════════════════════

    generateInjuryName(severity) {
        const options = this.injuryBySeverity[severity];
        if (!options || options.length === 0) return 'Unknown Injury';
        const option = this._pickRandom(options);
        return `${option.injury} ${option.part}`;
    }

    // ═════════════════════════════════════════════════════════════════════
    // PLAYER GENERATION
    // ═════════════════════════════════════════════════════════════════════

    generatePlayer(data) {
        const {
            sport,
            position,
            demographic = 'youngAdult',
            name = null,
            isDrafted = false,
        } = data || {};

        const age = this.getAgeForDemographic(demographic);
        const attributes = this.generateAttributes(sport, position, demographic);
        const potential = this.generatePotential(demographic, isDrafted);
        const traits = this.generateTraits(demographic);

        // Resolve trait objects and apply attribute/morale/potential bonuses
        const resolvedTraits = traits.map(t => this.traits[t]).filter(Boolean);
        const attrBonuses = {};
        let moraleBonus = 0;
        let potentialBonus = 0;
        for (const trait of resolvedTraits) {
            for (const [attr, val] of Object.entries(trait.attributeBonus || {})) {
                if (attr === 'morale') { moraleBonus += val; continue; }
                if (attr === 'potential') { potentialBonus += val; continue; }
                attrBonuses[attr] = (attrBonuses[attr] || 0) + val;
            }
        }
        for (const [attr, val] of Object.entries(attrBonuses)) {
            if (attributes[attr] !== undefined) {
                attributes[attr] = Math.min(99, Math.max(1, attributes[attr] + val));
            }
        }
        potential = Math.min(99, Math.max(1, potential + potentialBonus));
        const contractSeasons = isDrafted
            ? 2 + Math.floor(Math.random() * 4)
            : 1;
        const salary = this.generateSalary(demographic, potential, contractSeasons);

        const displayPosition = sport === 'football' && position && typeof position === 'object'
            ? `${position.offense} / ${position.defense}`
            : position;

        const player = {
            id: this.sports.generateId(),
            name: name || this.generateName(),
            age,
            position: displayPosition,
            sport,
            demographic,
            seasonsOnTeam: 0,
            seasonsUntilProgression: this.seasonsPerDemographic,

            attributes,
            potential,

            xp: 0,
            level: 1,

            gamesPlayed: 0,
            gamesStarted: 0,
            careerStats: this.initializeCareerStats(sport),

            salary,
            contractSeasons,
            contractSeasonsRemaining: contractSeasons,

            morale: Math.min(100, Math.max(0, 70 + Math.floor(Math.random() * 30) + moraleBonus)),

            traits,

            isInjured: false,
            injuryDaysLeft: 0,
            injuryType: null,
            isRetired: false,
            isDrafted,

            consecutiveGamesPlayed: 0,
            hasPreviousInjury: false,
            injuryHistory: [],

            joinedDate: Date.now(),

            footballPosition: sport === 'football' && position && typeof position === 'object'
                ? { offense: position.offense, defense: position.defense }
                : null,

            draftRateMultiplier: isDrafted ? 1.0 : 0.5,
        };

        return player;
    }

    getAgeForDemographic(demographic) {
        const ranges = {
            teen: [15, 19],
            youngAdult: [20, 25],
            adult: [26, 32],
            middleAged: [33, 39],
            older: [40, 45],
        };
        const [min, max] = ranges[demographic] || [20, 25];
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    generateAttributes(sport, position, demographic) {
        const attrs = {};
        const sportAttrs = this.sportAttributes[sport];

        const baseRanges = {
            teen: [30, 55],
            youngAdult: [45, 70],
            adult: [55, 80],
            middleAged: [50, 75],
            older: [40, 65],
        };
        const [min, max] = baseRanges[demographic] || [40, 70];

        const positionObj = sport === 'football' && position && typeof position === 'object'
            ? position
            : { primary: position };

        sportAttrs.forEach(attr => {
            let value = min + Math.floor(Math.random() * (max - min + 1));
            let isPosAttr = false;
            if (positionObj.offense && this.isPositionAttribute(sport, positionObj.offense, attr)) isPosAttr = true;
            if (positionObj.defense && this.isPositionAttribute(sport, positionObj.defense, attr)) isPosAttr = true;
            if (positionObj.primary && this.isPositionAttribute(sport, positionObj.primary, attr)) isPosAttr = true;
            if (isPosAttr) {
                value += Math.floor(Math.random() * 15);
            }
            attrs[attr] = Math.min(99, Math.max(1, value));
        });

        return attrs;
    }

    generatePotential(demographic, isDrafted) {
        const ranges = {
            teen: [75, 95],
            youngAdult: [65, 85],
            adult: [55, 75],
            middleAged: [45, 65],
            older: [35, 55],
        };
        const [min, max] = ranges[demographic] || [55, 75];
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    generateTraits(demographic) {
        // 0-3 traits random
        const traitCount = Math.floor(Math.random() * 4);
        const playerTraits = [];
        const shuffled = [...this.traitKeys].sort(() => Math.random() - 0.5);
        for (let i = 0; i < traitCount && i < shuffled.length; i++) {
            playerTraits.push(shuffled[i]);
        }
        return playerTraits;
    }

    generateSalary(demographic, potential, seasons) {
        const baseByDemo = {
            teen: 300000,
            youngAdult: 600000,
            adult: 900000,
            middleAged: 700000,
            older: 400000,
        };
        const base = baseByDemo[demographic] || 500000;
        const potentialBonus = Math.floor((potential - 50) * 20000);
        return Math.floor(base + potentialBonus + Math.random() * 200000);
    }

    isPositionAttribute(sport, position, attribute) {
        const relevant = this.positionAttributes[sport]?.[position] || [];
        return relevant.includes(attribute);
    }

    initializeCareerStats(sport) {
        return {
            basketball: { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0 },
            hockey: { goals: 0, assists: 0, hits: 0, saves: 0, goalsAgainst: 0 },
            soccer: { goals: 0, assists: 0, tackles: 0, saves: 0, goalsAgainst: 0 },
            football: { passingYards: 0, rushingYards: 0, receivingYards: 0, touchdowns: 0, tackles: 0, sacks: 0, interceptions: 0 },
        }[sport] || {};
    }

    // ═════════════════════════════════════════════════════════════════════
    // PLAYER DEMOGRAPHICS & PROGRESSION
    // ═════════════════════════════════════════════════════════════════════

    advanceDemographics(player) {
        player.seasonsUntilProgression--;
        if (player.seasonsUntilProgression <= 0) {
            const currentIdx = this.demographics.indexOf(player.demographic);
            if (currentIdx < this.demographics.length - 1) {
                player.demographic = this.demographics[currentIdx + 1];
                player.age = this.getAgeForDemographic(player.demographic);
                this.applyAgeAttributeShift(player);
                player.seasonsUntilProgression = this.seasonsPerDemographic;
            } else if (currentIdx === this.demographics.length - 1) {
                player.isRetired = true;
            }
        }
    }

    applyAgeAttributeShift(player) {
        const shift = {
            youngAdult: { speed: -1, stamina: -1 },
            adult: { speed: -1, stamina: -1, shooting: 1, passing: 1 },
            middleAged: { speed: -2, stamina: -2, shooting: 1, passing: 1, defense: 1 },
            older: { speed: -3, stamina: -3, shooting: 1, passing: 1, defense: 2 },
        }[player.demographic];
        if (!shift) return;
        for (const [attr, change] of Object.entries(shift)) {
            if (player.attributes[attr] !== undefined) {
                player.attributes[attr] = Math.min(99, Math.max(1, player.attributes[attr] + change));
            }
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // NATURAL LEVELING FROM GAMES
    // ═════════════════════════════════════════════════════════════════════

    awardGameXP(player, minutesPlayed, teamWon, sport) {
        if (player.isInjured || player.isRetired) return 0;

        let xpGain = Math.floor(minutesPlayed / 10);
        if (teamWon) xpGain = Math.floor(xpGain * 1.5);

        const team = this.getPlayerTeam(player.id);
        const gymLevel = team ? (team.stadium.gym || 0) : 0;
        xpGain = Math.floor(xpGain * (1 + gymLevel * 0.1));

        const techLevel = team ? (team.stadium.technologyCenter || 0) : 0;
        xpGain = Math.floor(xpGain * (1 + techLevel * 0.05));

        player.xp += xpGain;

        const levelsGained = Math.floor(player.xp / 100);
        player.level = 1 + levelsGained;
        player.xp = player.xp % 100;

        if (levelsGained > 0) {
            this.improveAttributesOnLevel(player, levelsGained);
        }

        return xpGain;
    }

    improveAttributesOnLevel(player, levels) {
        const attrs = Object.keys(player.attributes);
        for (let i = 0; i < levels; i++) {
            const attr = attrs[Math.floor(Math.random() * attrs.length)];
            if (player.attributes[attr] < player.potential) {
                player.attributes[attr] = Math.min(player.potential, player.attributes[attr] + 1);
            }
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // TRAINING (nation currency)
    // ═════════════════════════════════════════════════════════════════════

    trainPlayer(team, playerId, attribute, nation) {
        const player = team.players.get(playerId);
        if (!player) throw new Error('Player not on this team');
        if (player.isRetired) throw new Error('Player is retired');
        if (!this.sportAttributes[team.sport].includes(attribute)) {
            throw new Error('Invalid attribute for this sport');
        }
        if (player.attributes[attribute] >= player.potential) {
            throw new Error('Player has reached potential in this attribute');
        }

        const cost = this.getTrainingCost(player, attribute, team);
        if (nation.money < cost) throw new Error('Insufficient nation funds');

        const gymLevel = team.stadium.gym || 0;
        const actualCost = Math.floor(cost * (1 - gymLevel * 0.05));

        if (nation.money < actualCost) throw new Error('Insufficient nation funds');

        nation.money -= actualCost;

        const gain = 1 + Math.floor(gymLevel * 0.5);
        player.attributes[attribute] = Math.min(player.potential, player.attributes[attribute] + gain);

        return { cost: actualCost, gain, newValue: player.attributes[attribute] };
    }

    getTrainingCost(player, attribute, team) {
        const currentValue = player.attributes[attribute];
        const baseCost = 50000;
        const scaling = Math.pow(1.2, Math.floor(currentValue / 10));
        return Math.floor(baseCost * scaling);
    }

    // ═════════════════════════════════════════════════════════════════════
    // TRAIT MANAGEMENT - Remove/Reroll
    // ═════════════════════════════════════════════════════════════════════

    removeTrait(player, traitKey, nation) {
        if (!player.traits.includes(traitKey)) throw new Error('Player does not have this trait');

        const trait = this.traits[traitKey];
        const cost = Math.floor(500000 * (1 + Object.keys(trait.attributeBonus).length * 0.5));

        if (nation.money < cost) throw new Error('Insufficient nation funds to remove trait');

        nation.money -= cost;
        player.traits = player.traits.filter(t => t !== traitKey);

        // Reverse trait attribute/morale/potential bonuses
        for (const [attr, val] of Object.entries(trait.attributeBonus || {})) {
            if (attr === 'morale') {
                player.morale = Math.min(100, Math.max(0, (player.morale || 70) - val));
                continue;
            }
            if (attr === 'potential') {
                player.potential = Math.min(99, Math.max(1, (player.potential || 50) - val));
                continue;
            }
            if (player.attributes[attr] !== undefined) {
                player.attributes[attr] = Math.min(99, Math.max(1, player.attributes[attr] - val));
            }
        }

        return { cost, removedTrait: trait.name };
    }

    rerollTrait(player, nation) {
        if (player.traits.length >= 3) throw new Error('Player already has maximum traits (3)');

        const cost = Math.floor(250000 * (1 + player.traits.length * 0.5));
        if (nation.money < cost) throw new Error('Insufficient nation funds to reroll trait');

        nation.money -= cost;

        const availableTraits = this.traitKeys.filter(k => !player.traits.includes(k));
        if (availableTraits.length === 0) throw new Error('No traits available to add');

        const newTrait = this._pickRandom(availableTraits);
        player.traits.push(newTrait);
        this.applyTraitToPlayer(player, newTrait);

        return { cost, addedTrait: this.traits[newTrait].name, traitKey: newTrait };
    }

    applyTraitToPlayer(player, traitKey) {
        const trait = this.traits[traitKey];
        if (!trait) return;
        for (const [attr, val] of Object.entries(trait.attributeBonus || {})) {
            if (attr === 'morale') {
                player.morale = Math.min(100, Math.max(0, (player.morale || 70) + val));
                continue;
            }
            if (attr === 'potential') {
                player.potential = Math.min(99, Math.max(1, (player.potential || 50) + val));
                continue;
            }
            if (player.attributes[attr] !== undefined) {
                player.attributes[attr] = Math.min(99, Math.max(1, player.attributes[attr] + val));
            }
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // CONTRACTS
    // ═════════════════════════════════════════════════════════════════════

    getContractExtensionCost(player, team, nation) {
        const avgAttr = Object.values(player.attributes).reduce((a, b) => a + b, 0) / Object.values(player.attributes).length;
        const skillBase = Math.floor(avgAttr * 100000);
        const potentialBonus = Math.floor((player.potential - 50) * 50000);

        let happinessModifier = 1.0;
        if (player.morale >= 80) happinessModifier = 0.8;
        else if (player.morale >= 60) happinessModifier = 0.9;
        else if (player.morale <= 40) happinessModifier = 1.5;
        else if (player.morale <= 60) happinessModifier = 1.2;

        const cost = Math.floor((skillBase + potentialBonus) * happinessModifier);
        return Math.max(cost, 100000);
    }

    extendContract(player, seasons, nation) {
        if (player.isRetired) throw new Error('Player is retired');
        if (seasons < 1 || seasons > 5) throw new Error('Contract must be 1-5 seasons');

        const team = this.getPlayerTeam(player.id);
        if (!team) throw new Error('Player is not on a team');

        const costPerSeason = this.getContractExtensionCost(player, team, nation);
        const totalCost = costPerSeason * seasons;

        if (nation.money < totalCost) throw new Error('Insufficient nation funds');

        nation.money -= totalCost;
        player.contractSeasons += seasons;
        player.contractSeasonsRemaining += seasons;

        return { cost: totalCost, newSeasonsRemaining: player.contractSeasonsRemaining };
    }

    // ═════════════════════════════════════════════════════════════════════
    // ROSTER MANAGEMENT
    // ═════════════════════════════════════════════════════════════════════

    signPlayer(team, playerId, nation) {
        const player = this.sports.players.get(playerId);
        if (!player) throw new Error('Player not found');
        if (player.isRetired) throw new Error('Player is retired');
        if (player.sport !== team.sport) throw new Error('Player plays a different sport');
        if (team.players.has(playerId)) throw new Error('Player is already on this team');

        const existingTeam = this.getPlayerTeam(playerId);
        if (existingTeam) throw new Error('Player is already on another team');

        if (nation.money < player.salary) throw new Error('Insufficient nation funds for player salary');

        nation.money -= player.salary;
        team.players.set(playerId, player);
        player.joinedDate = Date.now();
        player.seasonsOnTeam = 0;
        player.draftRateMultiplier = 1.0;

        if (player.previousTeams) player.previousTeams.push({ teamId: team.id, joined: Date.now() });

        return player;
    }

    releasePlayer(team, playerId) {
        if (!team.players.has(playerId)) throw new Error('Player is not on this team');

        for (const [pos, pid] of team.roster) {
            if (pid === playerId) team.roster.delete(pos);
        }
        for (const [pos, ids] of team.subs) {
            const idx = ids.indexOf(playerId);
            if (idx !== -1) ids.splice(idx, 1);
        }

        if (team.injuries.has(playerId)) {
            team.injuries.delete(playerId);
            const p = team.players.get(playerId);
            if (p) { p.isInjured = false; p.injuryDaysLeft = 0; }
        }

        team.players.delete(playerId);
        return true;
    }

    setStarter(team, position, playerId) {
        const posConfig = this.playerPositions[team.sport];

        if (team.sport === 'football' && posConfig && posConfig.offense && posConfig.defense) {
            const allPositions = [...posConfig.offense, ...posConfig.defense];
            if (!allPositions.includes(position)) throw new Error('Invalid position for this sport');

            for (const [pos, pid] of team.roster) {
                if (pid === playerId) team.roster.delete(pos);
            }
            for (const [pos, ids] of team.subs) {
                const idx = ids.indexOf(playerId);
                if (idx !== -1) ids.splice(idx, 1);
            }

            if (playerId === null) return;

            const player = team.players.get(playerId);
            if (!player) throw new Error('Player not on team');
            if (!player.footballPosition) throw new Error('Player does not have football position data');
            if (player.footballPosition.offense !== position && player.footballPosition.defense !== position) {
                throw new Error('Player does not play this position');
            }
            if (player.isInjured || player.isRetired) throw new Error('Player is unavailable');

            team.roster.set(position, playerId);
            return;
        }

        const positions = posConfig;
        if (!positions.includes(position)) throw new Error('Invalid position for this sport');

        for (const [pos, pid] of team.roster) {
            if (pid === playerId) team.roster.delete(pos);
        }
        for (const [pos, ids] of team.subs) {
            const idx = ids.indexOf(playerId);
            if (idx !== -1) ids.splice(idx, 1);
        }

        if (playerId === null) return;

        const player = team.players.get(playerId);
        if (!player) throw new Error('Player not on team');
        if (player.position !== position) throw new Error('Player does not play this position');
        if (player.isInjured || player.isRetired) throw new Error('Player is unavailable');

        team.roster.set(position, playerId);
    }

    setSub(team, position, playerId, add = true) {
        const posConfig = this.playerPositions[team.sport];

        if (team.sport === 'football' && posConfig && posConfig.offense && posConfig.defense) {
            const allPositions = [...posConfig.offense, ...posConfig.defense];
            if (!allPositions.includes(position)) throw new Error('Invalid position for this sport');

            if (!team.subs.has(position)) team.subs.set(position, []);

            if (add) {
                const ids = team.subs.get(position);
                if (!ids.includes(playerId)) ids.push(playerId);
            } else {
                const ids = team.subs.get(position);
                const idx = ids.indexOf(playerId);
                if (idx !== -1) ids.splice(idx, 1);
            }
            return;
        }

        const positions = posConfig;
        if (!positions.includes(position)) throw new Error('Invalid position for this sport');

        if (!team.subs.has(position)) team.subs.set(position, []);

        if (add) {
            const ids = team.subs.get(position);
            if (!ids.includes(playerId)) ids.push(playerId);
        } else {
            const ids = team.subs.get(position);
            const idx = ids.indexOf(playerId);
            if (idx !== -1) ids.splice(idx, 1);
        }
    }

    getPlayerTeam(playerId) {
        return this.sports.getPlayerTeam(playerId);
    }

    // ═════════════════════════════════════════════════════════════════════
    // INJURY CALCULATION SYSTEM
    // ═════════════════════════════════════════════════════════════════════

    calculateInjuryRisk(player, minutesPlayed, playOutcome, opposingTeam) {
        const consecutiveGames = player.consecutiveGamesPlayed || 0;
        const endurance = player.attributes.endurance || 50;
        const stamina = player.attributes.stamina || 50;

        const ageModifiers = {
            teen: 0,
            youngAdult: 0.05,
            adult: 0.10,
            middleAged: 0.15,
            older: 0.20,
        };
        const ageModifier = ageModifiers[player.demographic] || 0.10;

        const outcomeModifiers = {
            win: 0,
            loss: 0.10,
            draw: 0.05,
        };
        const outcomeModifier = outcomeModifiers[playOutcome] || 0;

        const previousInjuryModifier = player.hasPreviousInjury ? 0.15 : 0;

        // Opponent injury bonuses from opposing team's traits (e.g. Wrecking Ball, Enforcer)
        let opponentInjuryModifier = 0;
        if (opposingTeam && opposingTeam.players) {
            for (const [, oppPlayer] of opposingTeam.players) {
                const oppTraits = oppPlayer.traits || [];
                for (const tKey of oppTraits) {
                    const t = this.traits[tKey];
                    if (t && t.opponentInjuryBonus) {
                        opponentInjuryModifier += t.opponentInjuryBonus;
                    }
                }
            }
        }

        let risk = 0;
        risk += consecutiveGames * 0.02;
        risk += minutesPlayed * 0.01;
        risk -= endurance * 0.01;
        risk -= stamina * 0.01;
        risk += ageModifier;
        risk += outcomeModifier;
        risk += previousInjuryModifier;
        risk += opponentInjuryModifier;

        return Math.max(0, Math.min(1, risk));
    }

    determineInjuryType(riskScore) {
        if (riskScore < 0.20) return null;
        if (riskScore < 0.40) return this.injuryBySeverity[1];
        if (riskScore < 0.55) return this.injuryBySeverity[2];
        if (riskScore < 0.75) return this.injuryBySeverity[3];
        if (riskScore < 0.90) return this.injuryBySeverity[4];
        return this.injuryBySeverity[5];
    }

    inflictInjury(team, playerId, minutesPlayed, playOutcome, opposingTeam) {
        const player = team.players.get(playerId);
        if (!player || player.isInjured || player.isRetired) return false;

        const riskScore = this.calculateInjuryRisk(player, minutesPlayed, playOutcome, opposingTeam);
        const severityOptions = this.determineInjuryType(riskScore);

        if (!severityOptions) return false;

        // Determine severity level from risk score
        let severity;
        if (riskScore < 0.40) severity = 1;
        else if (riskScore < 0.55) severity = 2;
        else if (riskScore < 0.75) severity = 3;
        else if (riskScore < 0.90) severity = 4;
        else severity = 5;

        const injuryName = this.generateInjuryName(severity);
        const medicalLevel = team.stadium.medicalCenter || 0;
        const techLevel = team.stadium.technologyCenter || 0;

        const gamesOutMap = { 1: 0, 2: 1, 3: 5, 4: null, 5: null };
        let actualDays = gamesOutMap[severity];
        let description = severity === 4 ? 'Injured for Season' : (severity === 5 ? 'Career Ending Injury' : injuryName);

        if (actualDays && actualDays > 0) {
            actualDays = Math.max(1, Math.floor(actualDays * (1 - medicalLevel * 0.1)));
            actualDays = Math.max(1, Math.floor(actualDays * (1 - techLevel * 0.05)));
        }

        if (severity === 5) {
            player.isRetired = true;
            actualDays = 999;
        }

        player.isInjured = true;
        player.injuryDaysLeft = actualDays;

        player.injuryHistory.push({
            type: injuryName,
            severity,
            gamesOut: actualDays,
            date: Date.now(),
        });

        team.injuries.set(playerId, {
            type: injuryName,
            daysLeft: actualDays,
            severity,
        });

        return {
            injured: true,
            type: injuryName,
            severity,
            daysOut: actualDays,
            description,
            riskScore,
        };
    }

    healInjuries(team) {
        for (const [playerId, injury] of team.injuries) {
            if (injury.daysLeft > 0 && injury.daysLeft !== 999) {
                injury.daysLeft--;
                const player = team.players.get(playerId);
                if (player) player.injuryDaysLeft = Math.max(0, injury.daysLeft);
            }
            const player = team.players.get(playerId);
            if (injury.daysLeft <= 0 && injury.daysLeft !== 999) {
                if (player) { player.isInjured = false; player.injuryDaysLeft = 0; }
                team.injuries.delete(playerId);
            }
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // CONTRACT EXPIRY WARNINGS
    // ═════════════════════════════════════════════════════════════════════

    checkContractExpiries(team) {
        team.contractExpiryWarnings = [];
        for (const [playerId, player] of team.players) {
            if (player.contractSeasonsRemaining <= 1) {
                team.contractExpiryWarnings.push({
                    playerId,
                    playerName: player.name,
                    contractSeasonsRemaining: player.contractSeasonsRemaining,
                    morale: player.morale,
                });
            }
        }
        return team.contractExpiryWarnings;
    }

    processSeasonEndContracts(team) {
        const expired = [];
        for (const [playerId, player] of team.players) {
            player.contractSeasonsRemaining--;
            if (player.contractSeasonsRemaining <= 0 && !player.isRetired) {
                expired.push(playerId);
            }
        }
        return expired;
    }

    processPlayerDevelopment(player) {
        if (player.isRetired || player.isInjured) return;

        let devChance = 0.02;
        if (player.demographic === 'teen') devChance = 0.05;
        else if (player.demographic === 'youngAdult') devChance = 0.03;
        else if (player.demographic === 'adult') devChance = 0.02;
        else if (player.demographic === 'middleAged') devChance = 0.01;

        if (Math.random() < devChance) {
            const attrs = Object.keys(player.attributes);
            const attr = attrs[Math.floor(Math.random() * attrs.length)];
            if (player.attributes[attr] < player.potential) {
                player.attributes[attr] = Math.min(player.potential, player.attributes[attr] + 1);
            }
        }
    }

    checkRetirement(player) {
        if (player.isRetired) return;

        const retirementChance = {
            teen: 0,
            youngAdult: 0,
            adult: 0.001,
            middleAged: 0.005,
            older: 0.02,
        }[player.demographic] || 0;

        if (player.demographic === 'older' && player.seasonsOnTeam > 10) {
            retirementChance += 0.01;
        }

        if (Math.random() < retirementChance) {
            player.isRetired = true;
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // UTILITY
    // ════════════════════════════════════════════════════════════════════

    calculatePlayerRating(player) {
        const values = Object.values(player.attributes);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        let ageFactor = 1.0;
        if (player.age < 22) ageFactor = 0.8 + (player.age - 18) * 0.05;
        else if (player.age > 30) ageFactor = 1.0 - (player.age - 30) * 0.03;

        const moraleFactor = player.morale / 100;
        return avg * ageFactor * moraleFactor;
    }

    getDraftRateMultiplier(player) {
        return player.draftRateMultiplier || 1.0;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeamPlayerSystem;
} else if (typeof window !== 'undefined') {
    window.TeamPlayerSystem = TeamPlayerSystem;
}
