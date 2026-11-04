/**
 * GlobalWorld Entity - Singleton State Holder for Global Game Factors
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Holds persistent global state: global averages for all 8 factors,
 * recent nuke/missile strike history, government/religion tallies,
 * majority/opposite suggestions, sports global stats, special offer state,
 * and tuning config.
 *
 * The GlobalSystem owns the calculation logic; this entity owns the state.
 */
class GlobalWorldClass {
    constructor() {
        this.isInitialized = false;
        this.saveVersion = 1;

        // ── Global averages (0-100 scale unless noted) ──
        // Matches Nation.nationStats field names exactly for feed-back
        this.globalAverages = {
            happiness: 50,        // INITIAL_HAPPINESS: 50 (core/config.js)
            pollution: 0,
            disease: 10,
            crime: 15,
            environment: 50,
            populationDensity: 0,        // people per square mile across all nations
            education: 50,         // global education level (0-100), affects immigrant education
            literacyRate: 50       // global literacy rate (0-100), affects immigrant literacy
        };

        // ── Previous tick averages (for delta/trend tracking) ──
        this.previousAverages = { ...this.globalAverages };

        // ── Recent strike history (successful hits only, non-intercepted) ──
        // Each entry: { nationId, attackerId, type:'missile'|'nuke', day, damage, warId }
        // day = TimeSystem.currentTime.totalDays
        this.recentStrikes = []; // capped by config.strikeWindowDays

        // ── Cumulative pollution from strikes (decays over time) ──
        // Nukes add high pollution that decays slowly; missiles add low pollution that decays faster
        this.cumulativeNukePollution = 0;      // pollution points from nukes
        this.cumulativeMissilePollution = 0;   // pollution points from missiles

        // ── Government / religion tallies across all nations ──
        // Keys match nation.government / nation.religion string IDs
        this.governmentTally = {}; // govId -> count
        this.religionTally = {};   // religionId -> count
        this.totalNations = 0;

        // ── Derived majority / opposite suggestions ──
        this.majorityGovernment = null;   // govId with most nations
        this.majorityReligion = null;     // religionId with most nations
        this.suggestedGovernment = null;  // random gov EXCEPT majorityGovernment
        this.suggestedReligion = null;    // random religion EXCEPT majorityReligion

        // ── World War / Peace Stats ──
        // Tracks how many nations are at war vs peace globally
        this.warStats = {
            totalNations: 0,
            nationsAtWar: 0,
            nationsAtPeace: 0,
            warPercentage: 0,      // % of nations at war
            peacePercentage: 0,    // % of nations at peace
            activeWarCount: 0,     // number of active wars
            lastCalculatedDay: 0
        };

        // ── Military Unit Global Averages ──
        // Average unit counts across ALL nations (not just those at war)
        this.militaryUnitStats = {
            soldiers: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
            tanks: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
            aircraft: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
            ships: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
            spies: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
            missiles: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
            nukes: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 }
        };

        // ── Currency Type Global Stats ──
        // Tracks what % of nations use each currency type (their primary currency)
        // and total/average balances per currency across all nations
        this.currencyStats = {
            aurel: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
            velt: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
            krona: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
            drachma: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
            sovereign: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
            talon: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
            totalNations: 0
        };

        // ── Population Demographics ──
        // Tracks what % of world population is in each demographic group.
        // Age groups from PopulationSystem: newborn, infant, toddler, child,
        // teen, youngAdult, adult, middleAged, older, senior, elderly
        this.populationDemographics = {
            newborn: { totalCount: 0, pctOfWorld: 0 },
            infant: { totalCount: 0, pctOfWorld: 0 },
            toddler: { totalCount: 0, pctOfWorld: 0 },
            child: { totalCount: 0, pctOfWorld: 0 },
            teen: { totalCount: 0, pctOfWorld: 0 },
            youngAdult: { totalCount: 0, pctOfWorld: 0 },
            adult: { totalCount: 0, pctOfWorld: 0 },
            middleAged: { totalCount: 0, pctOfWorld: 0 },
            older: { totalCount: 0, pctOfWorld: 0 },
            senior: { totalCount: 0, pctOfWorld: 0 },
            elderly: { totalCount: 0, pctOfWorld: 0 },
            totalPopulation: 0
        };

        // ── Education Building Global Stats ──
        // Tracks education buildings across ALL nations:
        //   - Schools (improvements.school, max 5 per nation)
        //   - National Universities (projects.university, max 3 per nation)
        //   - Advanced Universities (projects.advancedUniversity, max 1 per nation)
        //   - Great Library (wonders.great_library, max 1 per nation)
        //   - Universal Education System (wonders.universalEducation, max 1 per nation)
        // For each nation we count built vs max possible slots.
        // Global stats include totals, averages, and fill percentages.
        this.educationBuildings = {
            // Per-building-type stats across all nations
            school: {
                maxPerNation: 5,
                totalBuilt: 0,
                totalMaxSlots: 0,      // maxPerNation * nationCount
                avgBuiltPerNation: 0,
                nationsWithAtLeastOne: 0,
                fillPercentage: 0      // totalBuilt / totalMaxSlots * 100
            },
            nationalUniversity: {
                maxPerNation: 3,
                totalBuilt: 0,
                totalMaxSlots: 0,
                avgBuiltPerNation: 0,
                nationsWithAtLeastOne: 0,
                fillPercentage: 0
            },
            advancedUniversity: {
                maxPerNation: 1,
                totalBuilt: 0,
                totalMaxSlots: 0,
                avgBuiltPerNation: 0,
                nationsWithAtLeastOne: 0,
                fillPercentage: 0
            },
            greatLibrary: {
                maxPerNation: 1,
                totalBuilt: 0,
                totalMaxSlots: 0,
                avgBuiltPerNation: 0,
                nationsWithAtLeastOne: 0,
                fillPercentage: 0
            },
            universalEducationSystem: {
                maxPerNation: 1,
                totalBuilt: 0,
                totalMaxSlots: 0,
                avgBuiltPerNation: 0,
                nationsWithAtLeastOne: 0,
                fillPercentage: 0
            },
            // Aggregate across ALL education building types
            totalBuilt: 0,
            totalMaxSlots: 0,
            avgBuiltPerNation: 0,
            fillPercentage: 0,
            nationCount: 0
        };

        // ── Sports Global Stats (per sport) ──
        // Only includes nations that have teams; counts ALL their teams
        this.sportsGlobalStats = {};
        const sportTypes = ['basketball', 'hockey', 'soccer', 'football'];
        for (const sport of sportTypes) {
            this.sportsGlobalStats[sport] = {
                totalTeams: 0,
                teamsWithYouthAcademy: 0,
                teamsWithTechnologyCenter: 0,
                totalPlayers: 0,
                avgPlayerSkill: 50,
                avgTeamSkill: 50,
            };
        }
        this.globalPlayerSkillStandard = 50; // overall across all sports (0-100)

        // ── Special offer tracking ──
        // teamId -> last day a special offer was made to that team (cooldown)
        this.specialOfferCooldown = {};
        // teamId -> { player, sport, teamId, nationId, expires, createdDay } pending offers
        this.specialOffersPending = {};

        // ── Config / tuning constants ──
        this.config = {
            globalInfluenceWeight: 0.05,   // 5%: base weight for strong factors (disease/pollution/environment)
            globalMinorInfluenceWeight: 0.01, // 1%: slight weight for minor factors (education/literacy/happiness/crime)
            strikeWindowDays: 30,          // days to keep strike history
            nukeEnvPenalty: 25,            // environment points per successful nuke (high penalty)
            missileEnvPenalty: 5,          // environment points per successful missile (low penalty)
            diseaseGlobalBaseChance: 0.01, // 1% base global disease spawn per check
            govReligionRecalcIntervalDays: 1,

            // Environmental decay rates (per day, 0-1)
            // Nukes decay much slower than missiles; base pollution decays slowest
            nukePollutionDecayRate: 0.005,     // 0.5% per day (~200 days to clear ~63%)
            missilePollutionDecayRate: 0.02,   // 2% per day (~50 days to clear ~63%)
            basePollutionDecayRate: 0.005,     // 0.5% per day for background pollution healing

            // Sports config
            sportsUpdateIntervalDays: 1,       // recompute sports stats each day
            specialOfferBaseChance: 0.02,      // 2% base chance per team per day during active phase
            specialOfferYouthAcademyBonus: 0.03, // +3% per youth academy level
            specialOfferTechCenterBonus: 0.04,   // +4% per technology center level
            specialOfferHighSkillBonus: 0.05,    // +5% if team avg skill above global standard
            specialOfferMaxChance: 0.40,       // cap at 40%
            specialOfferSkillBoost: 15,        // special offer players get +15 to base attributes
            specialOfferPotentialBoost: 20,    // special offer players get +20 potential
        };
    }

    /**
     * Serialize state for saving
     */
    serialize() {
        return {
            saveVersion: this.saveVersion,
            globalAverages: { ...this.globalAverages },
            previousAverages: { ...this.previousAverages },
            recentStrikes: [...this.recentStrikes],
            governmentTally: { ...this.governmentTally },
            religionTally: { ...this.religionTally },
            totalNations: this.totalNations,
            majorityGovernment: this.majorityGovernment,
            majorityReligion: this.majorityReligion,
            suggestedGovernment: this.suggestedGovernment,
            suggestedReligion: this.suggestedReligion,
            sportsGlobalStats: JSON.parse(JSON.stringify(this.sportsGlobalStats)),
            globalPlayerSkillStandard: this.globalPlayerSkillStandard,
            educationBuildings: JSON.parse(JSON.stringify(this.educationBuildings)),
            warStats: JSON.parse(JSON.stringify(this.warStats)),
            militaryUnitStats: JSON.parse(JSON.stringify(this.militaryUnitStats)),
            currencyStats: JSON.parse(JSON.stringify(this.currencyStats)),
            diseaseStats: JSON.parse(JSON.stringify(this.diseaseStats)),
            populationDemographics: JSON.parse(JSON.stringify(this.populationDemographics)),
            specialOfferCooldown: { ...this.specialOfferCooldown },
            specialOffersPending: JSON.parse(JSON.stringify(this.specialOffersPending)),
            cumulativeNukePollution: this.cumulativeNukePollution,
            cumulativeMissilePollution: this.cumulativeMissilePollution,
            config: { ...this.config }
        };
    }

    deserialize(data) {
        if (!data) return;
        this.globalAverages = { ...this.globalAverages, ...(data.globalAverages || {}) };
        this.previousAverages = { ...this.previousAverages, ...(data.previousAverages || {}) };
        this.recentStrikes = data.recentStrikes ? [...data.recentStrikes] : [];
        this.governmentTally = data.governmentTally ? { ...data.governmentTally } : {};
        this.religionTally = data.religionTally ? { ...data.religionTally } : {};
        this.totalNations = data.totalNations || 0;
        this.majorityGovernment = data.majorityGovernment || null;
        this.majorityReligion = data.majorityReligion || null;
        this.suggestedGovernment = data.suggestedGovernment || null;
        this.suggestedReligion = data.suggestedReligion || null;
        if (data.sportsGlobalStats) {
            this.sportsGlobalStats = JSON.parse(JSON.stringify(data.sportsGlobalStats));
        }
        this.globalPlayerSkillStandard = data.globalPlayerSkillStandard !== undefined ? data.globalPlayerSkillStandard : 50;
        this.educationBuildings = data.educationBuildings ? JSON.parse(JSON.stringify(data.educationBuildings)) : null;
        this.warStats = data.warStats ? JSON.parse(JSON.stringify(data.warStats)) : null;
        this.militaryUnitStats = data.militaryUnitStats ? JSON.parse(JSON.stringify(data.militaryUnitStats)) : null;
        this.currencyStats = data.currencyStats ? JSON.parse(JSON.stringify(data.currencyStats)) : null;
        this.diseaseStats = data.diseaseStats ? JSON.parse(JSON.stringify(data.diseaseStats)) : null;
        this.populationDemographics = data.populationDemographics ? JSON.parse(JSON.stringify(data.populationDemographics)) : null;
        this.specialOfferCooldown = data.specialOfferCooldown ? { ...data.specialOfferCooldown } : {};
        this.specialOffersPending = data.specialOffersPending ? JSON.parse(JSON.stringify(data.specialOffersPending)) : {};
        this.cumulativeNukePollution = data.cumulativeNukePollution !== undefined ? data.cumulativeNukePollution : 0;
        this.cumulativeMissilePollution = data.cumulativeMissilePollution !== undefined ? data.cumulativeMissilePollution : 0;
        this.saveVersion = data.saveVersion !== undefined ? data.saveVersion : this.saveVersion;
        if (data.config) this.config = { ...this.config, ...data.config };
        this.isInitialized = true;
    }

    reset() {
        this.globalAverages = {
            happiness: 50,
            pollution: 0,
            disease: 10,
            crime: 15,
            environment: 50,
            populationDensity: 0,
            education: 50,
            literacyRate: 50
        };
        this.previousAverages = { ...this.globalAverages };
        this.recentStrikes = [];
        this.governmentTally = {};
        this.religionTally = {};
        this.totalNations = 0;
        this.majorityGovernment = null;
        this.majorityReligion = null;
        this.suggestedGovernment = null;
        this.suggestedReligion = null;
        const sportTypes = ['basketball', 'hockey', 'soccer', 'football'];
        for (const sport of sportTypes) {
            this.sportsGlobalStats[sport] = {
                totalTeams: 0,
                teamsWithYouthAcademy: 0,
                teamsWithTechnologyCenter: 0,
                totalPlayers: 0,
                avgPlayerSkill: 50,
                avgTeamSkill: 50,
            };
        }
        this.globalPlayerSkillStandard = 50;
        this.educationBuildings = {
            school: {
                maxPerNation: 5,
                totalBuilt: 0,
                totalMaxSlots: 0,
                avgBuiltPerNation: 0,
                nationsWithAtLeastOne: 0,
                fillPercentage: 0
            },
            nationalUniversity: {
                maxPerNation: 3,
                totalBuilt: 0,
                totalMaxSlots: 0,
                avgBuiltPerNation: 0,
                nationsWithAtLeastOne: 0,
                fillPercentage: 0
            },
            advancedUniversity: {
                maxPerNation: 1,
                totalBuilt: 0,
                totalMaxSlots: 0,
                avgBuiltPerNation: 0,
                nationsWithAtLeastOne: 0,
                fillPercentage: 0
            },
            greatLibrary: {
                maxPerNation: 1,
                totalBuilt: 0,
                totalMaxSlots: 0,
                avgBuiltPerNation: 0,
                nationsWithAtLeastOne: 0,
                fillPercentage: 0
            },
            universalEducationSystem: {
                maxPerNation: 1,
                totalBuilt: 0,
                totalMaxSlots: 0,
                avgBuiltPerNation: 0,
                nationsWithAtLeastOne: 0,
                fillPercentage: 0
            },
            totalBuilt: 0,
            totalMaxSlots: 0,
            avgBuiltPerNation: 0,
            fillPercentage: 0,
            nationCount: 0
        };
        this.cumulativeNukePollution = 0;
        this.cumulativeMissilePollution = 0;
        this.warStats = {
            totalNations: 0,
            nationsAtWar: 0,
            nationsAtPeace: 0,
            warPercentage: 0,
            peacePercentage: 0,
            activeWarCount: 0,
            lastCalculatedDay: 0
        };
        this.militaryUnitStats = {
            soldiers: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
            tanks: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
            aircraft: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
            ships: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
            spies: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
            missiles: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
            nukes: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 }
        };
        this.currencyStats = {
            aurel: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
            velt: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
            krona: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
            drachma: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
            sovereign: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
            talon: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
            totalNations: 0
        };

        // ── Disease Stats ──
        // Tracks how many nations have active Minor vs Major diseases
        this.diseaseStats = {
            totalNations: 0,
            nationsWithMinorDisease: 0,
            nationsWithMajorDisease: 0,
            pctWithMinorDisease: 0,
            pctWithMajorDisease: 0,
            totalMinorOutbreaks: 0,
            totalMajorOutbreaks: 0,
            lastCalculatedDay: 0
        };

        // ── Population Demographics ──
        this.populationDemographics = {
            newborn: { totalCount: 0, pctOfWorld: 0 },
            infant: { totalCount: 0, pctOfWorld: 0 },
            toddler: { totalCount: 0, pctOfWorld: 0 },
            child: { totalCount: 0, pctOfWorld: 0 },
            teen: { totalCount: 0, pctOfWorld: 0 },
            youngAdult: { totalCount: 0, pctOfWorld: 0 },
            adult: { totalCount: 0, pctOfWorld: 0 },
            middleAged: { totalCount: 0, pctOfWorld: 0 },
            older: { totalCount: 0, pctOfWorld: 0 },
            senior: { totalCount: 0, pctOfWorld: 0 },
            elderly: { totalCount: 0, pctOfWorld: 0 },
            totalPopulation: 0
        };

        this.specialOfferCooldown = {};
        this.specialOffersPending = {};
        this.isInitialized = true;
    }
}

// Create global singleton instance
const GlobalWorld = new GlobalWorldClass();

if (typeof window !== 'undefined') {
    window.GlobalWorld = GlobalWorld;
    window.GlobalWorldClass = GlobalWorldClass;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GlobalWorldClass, GlobalWorld };
}
