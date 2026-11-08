/**
 * Wrestler System - Wrestler Generation, Skills, Types, Draft, Tag Teams
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Handles:
 * - Wrestler generation with independent skills (strength, agility, endurance, charisma)
 * - Wrestler types (brawler, highflyer, tank, showboat, icon) with base stat spreads
 * - Featured match, personas/gimmicks, alignment, crowd reaction
 * - Happiness, contracts, individual fans
 * - Moves & finishers (signature, finisher, move set)
 * - Tag team management
 * - Draft integration with Sports DraftSystem (wrestling sport type)
 * - Skills are COMPLETELY INDEPENDENT of sports player skills
 */

class WrestlerSystem {
    constructor(wrestlingSystem) {
        this.wrestling = wrestlingSystem;

        // ── Import Sports names (same generator as sports players) ──
        let sportsNameData = null;
        if (typeof require !== 'undefined') {
            try { sportsNameData = require('../../../assets/data/Sports/names.js'); } catch(e) {}
        }
        if (!sportsNameData && typeof window !== 'undefined') {
            sportsNameData = window.SportsNames || {
                maleFirstNames: typeof maleFirstNames !== 'undefined' ? maleFirstNames : [],
                femaleFirstNames: typeof femaleFirstNames !== 'undefined' ? femaleFirstNames : [],
                middleNames: typeof middleNames !== 'undefined' ? middleNames : [],
                lastNames: typeof lastNames !== 'undefined' ? lastNames : [],
                pickRandom: typeof pickRandom !== 'undefined' ? pickRandom : (arr) => arr[Math.floor(Math.random() * arr.length)],
                generateName: typeof generateName !== 'undefined' ? generateName : null,
            };
        }
        sportsNameData = sportsNameData || {
            maleFirstNames: [],
            femaleFirstNames: [],
            middleNames: [],
            lastNames: [],
            pickRandom: (arr) => arr[Math.floor(Math.random() * arr.length)],
        };
        this.maleFirstNames = sportsNameData.maleFirstNames || [];
        this.femaleFirstNames = sportsNameData.femaleFirstNames || [];
        this.middleNames = sportsNameData.middleNames || [];
        this.lastNames = sportsNameData.lastNames || [];
        this._pickRandom = sportsNameData.pickRandom || ((arr) => arr[Math.floor(Math.random() * arr.length)]);

        // ── Import Wrestling name generator (wrestling-style names like {The Axe}, {Loco Polo}, {Ol' Psycho}) ──
        let wrestlingNameData = null;
        if (typeof require !== 'undefined') {
            try { wrestlingNameData = require('../../../assets/data/wrestling/names.js'); } catch(e) {}
        }
        if (!wrestlingNameData && typeof window !== 'undefined') {
            wrestlingNameData = window.WrestlingNames || {
                wrestlingFirstParts: typeof wrestlingFirstParts !== 'undefined' ? wrestlingFirstParts : [],
                wrestlingLastParts: typeof wrestlingLastParts !== 'undefined' ? wrestlingLastParts : [],
                pickRandom: typeof pickRandom !== 'undefined' ? pickRandom : (arr) => arr[Math.floor(Math.random() * arr.length)],
                generateWrestlerName: typeof generateWrestlerName !== 'undefined' ? generateWrestlerName : null,
            };
        }
        wrestlingNameData = wrestlingNameData || {
            wrestlingFirstParts: [],
            wrestlingLastParts: [],
            pickRandom: (arr) => arr[Math.floor(Math.random() * arr.length)],
        };
        this.wrestlingFirstParts = wrestlingNameData.wrestlingFirstParts || [];
        this.wrestlingLastParts = wrestlingNameData.wrestlingLastParts || [];
        this._wrestlingPickRandom = wrestlingNameData.pickRandom || ((arr) => arr[Math.floor(Math.random() * arr.length)]);

        // ── Import Signature Moves ──
        let signatureData = null;
        if (typeof require !== 'undefined') {
            try { signatureData = require('../../../assets/data/wrestling/signatures.js'); } catch(e) {}
        }
        if (!signatureData && typeof window !== 'undefined') {
            signatureData = window.WrestlingSignatures || { signatureMoves: typeof signatureMoves !== 'undefined' ? signatureMoves : [] };
        }
        signatureData = signatureData || { signatureMoves: [] };
        this.signatureMovesData = signatureData.signatureMoves || [];

        // ── Import Finisher Moves ──
        let finisherData = null;
        if (typeof require !== 'undefined') {
            try { finisherData = require('../../../assets/data/wrestling/finishers.js'); } catch(e) {}
        }
        if (!finisherData && typeof window !== 'undefined') {
            finisherData = window.WrestlingFinishers || { finisherMoves: typeof finisherMoves !== 'undefined' ? finisherMoves : [] };
        }
        finisherData = finisherData || { finisherMoves: [] };
        this.finisherMovesData = finisherData.finisherMoves || [];

        this.wrestlerTypes = ['brawler', 'highflyer', 'tank', 'showboat', 'icon'];
        this.genders = ['men', 'women'];
        this.demographics = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];
        this.alignments = ['face', 'heel'];
        this.gimmicks = ['hardcore', 'technical', 'highflyer', 'powerhouse', 'charismatic', 'monster', 'comedic'];

        this.matchTypes = ['singles', 'tagteam', 'trickytrio', 'fatalfour'];
        this.stipulations = [
            '1fall', '2of3falls', 'insanity', 'ladder', 'table', 'cage',
            'deathmatch', 'firstblood', 'lastmanstanding', 'ironman',
            'submissiononly', 'knockout', 'nocountout', 'nodq',
        ];

        // Type matchups - fight synergy (opponent style advantage)
        // Icon is neutral with ALL types except Icon vs Icon (well) - balance fixer
        this.fightSynergy = {
            'brawler': { 'highflyer': 'well', 'tank': 'poor', 'showboat': 'neutral', 'icon': 'neutral', 'brawler': 'neutral' },
            'highflyer': { 'brawler': 'well', 'tank': 'neutral', 'showboat': 'poor', 'icon': 'neutral', 'highflyer': 'neutral' },
            'tank': { 'showboat': 'well', 'brawler': 'poor', 'highflyer': 'neutral', 'icon': 'neutral', 'tank': 'neutral' },
            'showboat': { 'tank': 'well', 'highflyer': 'poor', 'brawler': 'neutral', 'icon': 'neutral', 'showboat': 'neutral' },
            'icon': { 'brawler': 'neutral', 'highflyer': 'neutral', 'tank': 'neutral', 'showboat': 'neutral', 'icon': 'well' },
        };

        // Team synergy (tag team / trio partners)
        // Icon is neutral with ALL types except Icon vs Icon (good) - balance fixer
        this.teamSynergy = {
            'brawler': { 'highflyer': 'poor', 'tank': 'good', 'showboat': 'poor', 'icon': 'neutral', 'brawler': 'neutral' },
            'highflyer': { 'brawler': 'poor', 'tank': 'neutral', 'showboat': 'good', 'icon': 'neutral', 'highflyer': 'neutral' },
            'tank': { 'brawler': 'good', 'highflyer': 'neutral', 'showboat': 'poor', 'icon': 'neutral', 'tank': 'neutral' },
            'showboat': { 'brawler': 'poor', 'highflyer': 'good', 'tank': 'poor', 'icon': 'neutral', 'showboat': 'neutral' },
            'icon': { 'brawler': 'neutral', 'highflyer': 'neutral', 'tank': 'neutral', 'showboat': 'neutral', 'icon': 'good' },
        };

        // Base stat spreads per wrestler type
        this.typeStatSpreads = {
            brawler: { primary: 'strength', primaryRange: [75, 90], otherRange: [40, 65] },
            highflyer: { primary: 'agility', primaryRange: [75, 90], otherRange: [40, 65] },
            tank: { primary: 'endurance', primaryRange: [75, 90], otherRange: [40, 65] },
            showboat: { primary: 'charisma', primaryRange: [75, 90], otherRange: [40, 65] },
            icon: { primary: null, primaryRange: [55, 75], otherRange: [55, 75] },
        };

        // Gimmick stipulation bonuses
        this.gimmickStipulationBonus = {
            hardcore: ['insanity', 'deathmatch', 'firstblood', 'lastmanstanding', 'nodq'],
            technical: ['submissiononly', '1fall', '2of3falls'],
            highflyer: ['ladder', 'cage', 'table'],
            powerhouse: ['cage', 'deathmatch', '1fall'],
            charismatic: ['2of3falls', 'ironman', 'nocountout'],
            monster: ['deathmatch', 'insanity', 'cage'],
            comedic: ['nocountout', 'nodq', '2of3falls'],
        };
    }

    // ════════════════════════════════════════════════════════════════════════════
    // WRESTLER GENERATION
    // ════════════════════════════════════════════════════════════════════════════

    generateWrestler(data = {}) {
        const {
            gender = this.genders[Math.floor(Math.random() * this.genders.length)],
            wrestlerType = this.wrestlerTypes[Math.floor(Math.random() * this.wrestlerTypes.length)],
            demographic = this.demographics[Math.floor(Math.random() * this.demographics.length)],
            name = null,
            isDrafted = false,
            contractWeeksRemaining = null,
            salary = null,
        } = data;

        const age = this.getAgeForDemographic(demographic);
        const stats = this.generateStats(wrestlerType, demographic);
        const potential = this.generatePotential(demographic);
        const alignment = this.alignments[Math.floor(Math.random() * this.alignments.length)];
        const gimmick = this.gimmicks[Math.floor(Math.random() * this.gimmicks.length)];
        const featuredMatch = this.generateFeaturedMatch();

        const signatureMove = this.signatureMovesData.length > 0
            ? this.signatureMovesData[Math.floor(Math.random() * this.signatureMovesData.length)]
            : { id: 'sig_001', name: 'Suplex', type: 'grappling', damage: 25, fanImpact: 5 };
        const finisherMove = this.finisherMovesData.length > 0
            ? this.finisherMovesData[Math.floor(Math.random() * this.finisherMovesData.length)]
            : { id: 'fin_001', name: 'Finishing Blow', type: 'strike', damage: 50, fanImpact: 15, finisherRating: 70 };
        const moveSet = this.generateMoveSet(signatureMove, finisherMove);

        const crowdReaction = Math.floor(Math.random() * 41) - 20; // -20 to +20
        const morale = Math.min(100, Math.max(0, 70 + Math.floor(Math.random() * 30)));
        const happiness = Math.min(100, Math.max(0, 70 + Math.floor(Math.random() * 30)));

        const contractSeasons = contractWeeksRemaining || (1 + Math.floor(Math.random() * 12));
        const generatedSalary = salary || this.generateSalary(demographic, potential, contractSeasons);

        const wrestler = {
            id: this.wrestling.generateId(),
            name: name || this.generateName(gender),
            gender,
            wrestlerType,
            featuredMatch,

            strength: stats.strength,
            agility: stats.agility,
            endurance: stats.endurance,
            charisma: stats.charisma,

            level: 1,
            xp: 0,
            potential,

            morale,
            happiness,

            matchesWrestled: 0,
            wins: 0,
            losses: 0,
            fansGainedTotal: 0,
            personalFans: 0,
            titleReigns: [],
            injuries: [],
            isInjured: false,
            injuryWeeksLeft: 0,
            injuryType: null,
            isRetired: false,

            contractWeeksRemaining: contractSeasons,
            salary: generatedSalary,
            signingBonus: Math.floor(generatedSalary * 0.5),

            isDrafted,
            draftRate: 0,
            demographic,
            age,

            tagTeamId: null,

            alignment,
            gimmick,
            crowdReaction,

            signatureMove: { ...signatureMove },
            finisherMove: { ...finisherMove },
            moveSet,

            rivalries: [],
        };

        return wrestler;
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

    generateStats(wrestlerType, demographic) {
        const spread = this.typeStatSpreads[wrestlerType];
        if (!spread) throw new Error(`Unknown wrestler type: ${wrestlerType}`);
        const [otherMin, otherMax] = spread.otherRange;
        const stats = {
            strength: otherMin + Math.floor(Math.random() * (otherMax - otherMin + 1)),
            agility: otherMin + Math.floor(Math.random() * (otherMax - otherMin + 1)),
            endurance: otherMin + Math.floor(Math.random() * (otherMax - otherMin + 1)),
            charisma: otherMin + Math.floor(Math.random() * (otherMax - otherMin + 1)),
        };

        if (spread.primary) {
            const [pMin, pMax] = spread.primaryRange;
            stats[spread.primary] = pMin + Math.floor(Math.random() * (pMax - pMin + 1));
        } else {
            // Icon - all stats in mid-high range
            const [pMin, pMax] = spread.primaryRange;
            Object.keys(stats).forEach(key => {
                stats[key] = pMin + Math.floor(Math.random() * (pMax - pMin + 1));
            });
        }

        return stats;
    }

    generatePotential(demographic) {
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

    generateFeaturedMatch() {
        const matchType = this.matchTypes[Math.floor(Math.random() * this.matchTypes.length)];
        const stipulation = this.stipulations[Math.floor(Math.random() * this.stipulations.length)];
        return { matchType, stipulation };
    }

    generateMoveSet(signatureMove, finisherMove) {
        const moveCount = 5 + Math.floor(Math.random() * 6); // 5-10 moves
        const moveSet = [];

        // Use imported signature move or pick random from data
        const sig = signatureMove || (this.signatureMovesData.length > 0
            ? this._pickRandom(this.signatureMovesData)
            : { id: 'sig_001', name: 'Suplex', type: 'grappling', damage: 25, fanImpact: 5 });
        moveSet.push({ ...sig, learnedAtLevel: 1 });

        // Use imported finisher move or pick random from data
        const fin = finisherMove || (this.finisherMovesData.length > 0
            ? this._pickRandom(this.finisherMovesData)
            : { id: 'fin_001', name: 'Finishing Blow', type: 'strike', damage: 50, fanImpact: 15, finisherRating: 70 });
        if (fin.id !== sig.id) {
            moveSet.push({ ...fin, learnedAtLevel: 1 });
        }

        // Add filler moves
        const fillerNames = ['Punch', 'Kick', 'Body Slam', 'Suplex', 'Elbow Drop', 'Leg Drop', 'Backbreaker',
                             'DDT', 'Neckbreaker', 'Headbutt', 'Forearm', 'Chop', 'Knee Strike', 'Running Forearm'];
        for (let i = moveSet.length; i < moveCount; i++) {
            moveSet.push({
                id: `move_${i}`,
                name: fillerNames[Math.floor(Math.random() * fillerNames.length)],
                type: 'standard',
                damage: 10 + Math.floor(Math.random() * 15),
                fanImpact: 2,
                learnedAtLevel: 1 + Math.floor(Math.random() * 5),
            });
        }

        return moveSet;
    }

    generateSalary(demographic, potential, seasons) {
        const baseByDemo = {
            teen: 30000,
            youngAdult: 60000,
            adult: 90000,
            middleAged: 70000,
            older: 40000,
        };
        const base = baseByDemo[demographic] || 50000;
        const potentialBonus = Math.floor((potential - 50) * 2000);
        return Math.floor(base + potentialBonus + Math.random() * 20000);
    }

    generateName(gender) {
        // Wrestling-style names (70% chance) like {The Axe}, {Loco Polo}, {Ol' Psycho}
        if (Math.random() < 0.7 && this.wrestlingFirstParts.length > 0 && this.wrestlingLastParts.length > 0) {
            const first = this._wrestlingPickRandom(this.wrestlingFirstParts);
            const last = this._wrestlingPickRandom(this.wrestlingLastParts);
            return `${first} ${last}`;
        }
        // Fall back to Sports name generator (same as sports players)
        const listKey = gender === 'men' ? 'male' : gender === 'women' ? 'female' : 'male';
        const firstLists = { male: this.maleFirstNames, female: this.femaleFirstNames };
        let first = null;
        if (firstLists[listKey] && firstLists[listKey].length > 0) {
            first = this._pickRandom(firstLists[listKey]);
        } else if (this.wrestlingFirstParts.length > 0) {
            first = this._wrestlingPickRandom(this.wrestlingFirstParts);
        } else {
            first = 'Wrestler';
        }
        let last = null;
        if (this.lastNames && this.lastNames.length > 0) {
            last = this._pickRandom(this.lastNames);
        } else if (this.wrestlingLastParts.length > 0) {
            last = this._wrestlingPickRandom(this.wrestlingLastParts);
        } else {
            last = 'One';
        }
        return `${first} ${last}`;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // TYPE MATCHUPS
    // ════════════════════════════════════════════════════════════════════════════

    getFightSynergy(typeA, typeB) {
        return this.fightSynergy[typeA]?.[typeB] || 'neutral';
    }

    getTeamSynergy(typeA, typeB) {
        return this.teamSynergy[typeA]?.[typeB] || 'neutral';
    }

    getSynergyModifier(synergy) {
        switch (synergy) {
            case 'good': return 0.1;
            case 'poor': return -0.1;
            default: return 0;
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // GIMMICK & PERSONA
    // ════════════════════════════════════════════════════════════════════════════

    getGimmickStipulationBonus(gimmick, stipulation) {
        const bonuses = this.gimmickStipulationBonus[gimmick] || [];
        return bonuses.includes(stipulation) ? 0.05 : 0;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // TAG TEAM MANAGEMENT
    // ════════════════════════════════════════════════════════════════════════════

    createTagTeam(tagTeamId, name, wrestlerIdA, wrestlerIdB, wrestlers, tagTeams) {
        const wrestlerA = wrestlers.get(wrestlerIdA);
        const wrestlerB = wrestlers.get(wrestlerIdB);

        if (!wrestlerA || !wrestlerB) throw new Error('One or both wrestlers not found');
        if (wrestlerA.gender !== wrestlerB.gender) throw new Error('Tag team wrestlers must be same gender');
        if (wrestlerA.tagTeamId || wrestlerB.tagTeamId) throw new Error('One or both wrestlers already in a tag team');

        const tagTeam = {
            id: tagTeamId,
            name,
            wrestlerIdA,
            wrestlerIdB,
            chemistry: 50,
            createdDay: this.wrestling.getCurrentDay ? this.wrestling.getCurrentDay() : 0,
        };

        wrestlerA.tagTeamId = tagTeamId;
        wrestlerB.tagTeamId = tagTeamId;
        tagTeams.push(tagTeam);

        return tagTeam;
    }

    dissolveTagTeam(tagTeamId, wrestlers, tagTeams) {
        const tagTeam = tagTeams.find(t => t.id === tagTeamId);
        if (!tagTeam) throw new Error('Tag team not found');

        const wrestlerA = wrestlers.get(tagTeam.wrestlerIdA);
        const wrestlerB = wrestlers.get(tagTeam.wrestlerIdB);

        if (wrestlerA) wrestlerA.tagTeamId = null;
        if (wrestlerB) wrestlerB.tagTeamId = null;

        const idx = tagTeams.indexOf(tagTeam);
        if (idx !== -1) tagTeams.splice(idx, 1);

        return true;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // HAPPINESS & MORALE
    // ════════════════════════════════════════════════════════════════════════════

    adjustHappiness(wrestler, change, reason) {
        if (!wrestler) return;
        wrestler.happiness = Math.min(100, Math.max(0, wrestler.happiness + change));
    }

    adjustMorale(wrestler, change, reason) {
        if (!wrestler) return;
        wrestler.morale = Math.min(100, Math.max(0, wrestler.morale + change));
    }

    shouldRequestRelease(wrestler) {
        return wrestler.happiness < 20;
    }

    canWrestle(wrestler) {
        if (!wrestler) return false;
        if (wrestler.isRetired) return false;
        if (wrestler.isInjured) return false;
        if (wrestler.happiness < 20) return false;
        return true;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // INDIVIDUAL FANS
    // ════════════════════════════════════════════════════════════════════════════

    adjustPersonalFans(wrestler, change) {
        if (!wrestler) return 0;
        wrestler.personalFans = Math.max(0, wrestler.personalFans + change);
        wrestler.fansGainedTotal = Math.max(0, (wrestler.fansGainedTotal || 0) + Math.max(0, change));
        return wrestler.personalFans;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // MOVES & FINISHERS
    // ════════════════════════════════════════════════════════════════════════════

    setSignatureMove(wrestler, move) {
        wrestler.signatureMove = { ...move };
    }

    setFinisherMove(wrestler, move) {
        wrestler.finisherMove = { ...move };
    }

    addMoveToSet(wrestler, move) {
        if (!wrestler.moveSet) wrestler.moveSet = [];
        wrestler.moveSet.push({ ...move });
    }

    setMoveSet(wrestler, moveSet) {
        wrestler.moveSet = moveSet.map(m => ({ ...m }));
    }

    // ════════════════════════════════════════════════════════════════════════════
    // TRAINING
    // ════════════════════════════════════════════════════════════════════════════

    trainWrestler(wrestlerId, attribute, nation, gymLevel = 0) {
        const wrestler = this.wrestling.wrestlers.get(wrestlerId);
        if (!wrestler) throw new Error('Wrestler not found');
        if (wrestler.isRetired) throw new Error('Wrestler is retired');
        const validAttrs = ['strength', 'agility', 'endurance', 'charisma'];
        if (!validAttrs.includes(attribute)) throw new Error('Invalid attribute for wrestling');

        const currentValue = wrestler[attribute] || 0;
        const potential = wrestler.potential || 50;
        if (currentValue >= potential) throw new Error('Wrestler has reached potential in this attribute');

        const cost = 50000 * Math.pow(1.2, Math.floor(currentValue / 10));
        const actualCost = Math.floor(cost * (1 - gymLevel * 0.05));

        if (nation.money < actualCost) throw new Error('Insufficient nation funds');

        nation.money -= actualCost;

        const gain = 1 + Math.floor(gymLevel * 0.5);
        wrestler[attribute] = Math.min(potential, currentValue + gain);

        return { cost: actualCost, gain, newValue: wrestler[attribute], gymLevel };
    }

    changeFeaturedMatch(wrestler, matchType, stipulation) {
        if (!this.matchTypes.includes(matchType)) throw new Error('Invalid match type');
        if (!this.stipulations.includes(stipulation)) throw new Error('Invalid stipulation');
        wrestler.featuredMatch = { matchType, stipulation };
    }

    // ════════════════════════════════════════════════════════════════════════════
    // CONTRACTS
    // ════════════════════════════════════════════════════════════════════════════

    extendContract(wrestler, weeks, nation) {
        if (wrestler.isRetired) throw new Error('Wrestler is retired');
        if (!Number.isInteger(weeks) || weeks < 1 || weeks > 52) throw new Error('Contract must be 1-52 weeks');

        const costPerWeek = wrestler.salary;
        const totalCost = costPerWeek * weeks;
        if (nation.money < totalCost) throw new Error('Insufficient nation funds');

        nation.money -= totalCost;
        wrestler.contractWeeksRemaining += weeks;

        return { cost: totalCost, newWeeksRemaining: wrestler.contractWeeksRemaining };
    }

    decrementContracts(wrestlers) {
        const expired = [];
        for (const [id, wrestler] of wrestlers) {
            if (wrestler.isRetired) continue;
            wrestler.contractWeeksRemaining = Math.max(0, wrestler.contractWeeksRemaining - 1);
            if (wrestler.contractWeeksRemaining <= 0 && !wrestler.isRetired) {
                expired.push(wrestler);
            }
        }
        return expired;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // INJURIES (wrestling-adapted, weeks-based)
    // ════════════════════════════════════════════════════════════════════════════

    calculateInjuryRisk(wrestler, stipulation, consecutiveMatches) {
        const endurance = wrestler.endurance || 50;
        const age = wrestler.age || 25;

        const ageModifier = age > 35 ? 0.15 : age > 30 ? 0.10 : age > 25 ? 0.05 : 0;

        const stipulationRisk = {
            '1fall': 0.0,
            '2of3falls': 0.05,
            'insanity': 0.15,
            'ladder': 0.10,
            'table': 0.10,
            'cage': 0.15,
            'deathmatch': 0.30,
            'firstblood': 0.15,
            'lastmanstanding': 0.15,
            'ironman': 0.10,
            'submissiononly': 0.08,
            'knockout': 0.15,
            'nocountout': 0.05,
            'nodq': 0.10,
        }[stipulation] || 0.05;

        const fatigueModifier = consecutiveMatches * 0.02;
        const enduranceReduction = endurance * 0.001;

        let risk = ageModifier + stipulationRisk + fatigueModifier - enduranceReduction;
        if (wrestler.injuries && wrestler.injuries.length > 0) risk += 0.05;

        return Math.max(0, Math.min(1, risk));
    }

    determineInjurySeverity(riskScore) {
        if (riskScore < 0.20) return 0; // No injury
        if (riskScore < 0.40) return 1; // Minor - 0 weeks
        if (riskScore < 0.55) return 2; // Mild - 1 week
        if (riskScore < 0.75) return 3; // Moderate - 2-3 weeks
        if (riskScore < 0.90) return 4; // Major - 4-8 weeks
        return 5; // Career ending
    }

    inflictInjury(wrestler, matchId, stipulation, consecutiveMatches) {
        if (wrestler.isInjured || wrestler.isRetired) return false;

        const riskScore = this.calculateInjuryRisk(wrestler, stipulation, consecutiveMatches);
        const severity = this.determineInjurySeverity(riskScore);

        if (severity === 0) return false;

        const injuryTypes = {
            1: 'Minor Strain',
            2: 'Sprained Ankle',
            3: 'Concussion',
            4: 'Torn ACL',
            5: 'Career Ending Injury',
        };

        const weeksOutMap = { 1: 0, 2: 1, 3: Math.floor(2 + Math.random() * 2), 4: Math.floor(4 + Math.random() * 5), 5: 999 };
        const weeksOut = weeksOutMap[severity];

        const injuryType = injuryTypes[severity] || 'Unknown Injury';
        const medicalCenterLevel = 0; // Would come from arena, passed separately if needed

        let actualWeeks = weeksOut;
        if (actualWeeks > 0 && medicalCenterLevel > 0) {
            actualWeeks = Math.max(1, Math.floor(actualWeeks * (1 - medicalCenterLevel * 0.1)));
        }

        if (severity === 5) {
            wrestler.isRetired = true;
            wrestler.isInjured = false;
            actualWeeks = 999;
        } else if (severity === 1) {
            // Minor injury - no time missed, not flagged as injured for gameplay
            wrestler.isInjured = false;
            wrestler.injuryWeeksLeft = 0;
            wrestler.injuryType = injuryType;
        } else {
            wrestler.isInjured = true;
            wrestler.injuryWeeksLeft = actualWeeks;
            wrestler.injuryType = injuryType;
        }

        wrestler.injuries.push({
            type: injuryType,
            severity,
            weeksOut: actualWeeks,
            date: this.wrestling.getCurrentDay ? this.wrestling.getCurrentDay() : 0,
            matchId,
        });

        return {
            injured: true,
            type: injuryType,
            severity,
            weeksOut: actualWeeks,
            riskScore,
        };
    }

    healInjuries(wrestlers, medicalCenterLevel = 0) {
        const returned = [];
        for (const [id, wrestler] of wrestlers) {
            if (!wrestler.isInjured) continue;
            if (wrestler.injuryWeeksLeft > 0 && wrestler.injuryWeeksLeft !== 999) {
                wrestler.injuryWeeksLeft--;
                if (wrestler.injuryWeeksLeft <= 0) {
                    wrestler.isInjured = false;
                    wrestler.injuryWeeksLeft = 0;
                    wrestler.injuryType = null;
                    returned.push(wrestler);
                }
            }
        }
        return returned;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // RETIREMENT
    // ════════════════════════════════════════════════════════════════════════════

    checkRetirement(wrestler) {
        if (wrestler.isRetired) return false;

        const retirementChance = {
            teen: 0,
            youngAdult: 0,
            adult: 0.001,
            middleAged: 0.005,
            older: 0.02,
        }[wrestler.demographic] || 0;

        if (wrestler.demographic === 'older' && (wrestler.matchesWrestled || 0) > 50) {
            retirementChance += 0.01;
        }

        if (Math.random() < retirementChance) {
            wrestler.isRetired = true;
            return true;
        }
        return false;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // UTILITY
    // ════════════════════════════════════════════════════════════════════════════

    calculateRating(wrestler) {
        const avgStat = (wrestler.strength + wrestler.agility + wrestler.endurance + wrestler.charisma) / 4;
        const moraleFactor = wrestler.morale / 100;
        const happinessFactor = wrestler.happiness / 100;
        return avgStat * moraleFactor * happinessFactor;
    }

    isWrestlerAvailable(wrestler) {
        return this.canWrestle(wrestler);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WrestlerSystem;
} else if (typeof window !== 'undefined') {
    window.WrestlerSystem = WrestlerSystem;
}
