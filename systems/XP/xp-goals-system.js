/**
 * XP-Goals System — Centralized XP awarding and goal/mission management
 *
 * Handles ALL player XP gains from interactions (wars, treaties, relationships,
 * research, military training, etc.) and manages Daily/Weekly/Monthly goals.
 *
 * Replaces direct Player._awardExperience() calls scattered across nation-system.js
 * and war-system.js. All XP now flows through this system.
 *
 * Works on both client (window) and server (Node.js) environments.
 */

// Safe global reference for cross-environment compatibility
const _global = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {});

class XPGoalsSystem {
    constructor() {
        this.isInitialized = false;

        // ── XP Source Configuration ──
        // Each source has: baseXP, levelScaling (multiplier per player level), maxPerDay
        this.xpSources = {
            warAttack:        { baseXP: 150,  levelScaling: 0.05, maxPerDay: 50 },
            warDefend:        { baseXP: 200,  levelScaling: 0.05, maxPerDay: 50 },
            warWin:           { baseXP: 1000, levelScaling: 0.10, maxPerDay: 10 },
            warParticipate:   { baseXP: 250,  levelScaling: 0.05, maxPerDay: 10 },
            destroyUnits:     { baseXP: 10,   levelScaling: 0.02, maxPerDay: 100 },
            proposeTreaty:    { baseXP: 100,  levelScaling: 0.03, maxPerDay: 20 },
            acceptTreaty:     { baseXP: 150,  levelScaling: 0.03, maxPerDay: 20 },
            rejectTreaty:     { baseXP: 50,   levelScaling: 0.02, maxPerDay: 20 },
            addFriend:        { baseXP: 75,   levelScaling: 0.02, maxPerDay: 10 },
            addBestFriend:    { baseXP: 200,  levelScaling: 0.05, maxPerDay: 5 },
            addFoe:           { baseXP: 75,   levelScaling: 0.02, maxPerDay: 10 },
            addNemesis:       { baseXP: 200,  levelScaling: 0.05, maxPerDay: 5 },
            research:         { baseXP: 10,   levelScaling: 0.01, maxPerDay: 100 },
            trainSoldiers:  { baseXP: 1,    levelScaling: 0.01, maxPerDay: 1000 },
            trainTanks:     { baseXP: 2,    levelScaling: 0.01, maxPerDay: 500 },
            trainAircraft:  { baseXP: 5,    levelScaling: 0.01, maxPerDay: 200 },
            trainShips:     { baseXP: 10,   levelScaling: 0.01, maxPerDay: 100 },
            buyMissiles:    { baseXP: 20,   levelScaling: 0.01, maxPerDay: 100 },
            buyNukes:       { baseXP: 100,  levelScaling: 0.01, maxPerDay: 20 },
            dailyLogin:       { baseXP: 50,   levelScaling: 0.01, maxPerDay: 1 },
            // Alliance — daily only
            joinAlliance:     { baseXP: 150,  levelScaling: 0.03, maxPerDay: 1 },
            makeAlliance:     { baseXP: 1000, levelScaling: 0.05, maxPerDay: 1 },
            // Territory expansion
            claimTerritory:   { baseXP: 500,  levelScaling: 0.02, maxPerDay: 10 },
            // Sports — small XP for any win, scaled XP for tournament wins
            sportsWin:        { baseXP: 50,   levelScaling: 0.03, maxPerDay: 20 },
            sportsSeasonWin:  { baseXP: 500,  levelScaling: 0.05, maxPerDay: 5 },
            sportsWorldWin:   { baseXP: 2000, levelScaling: 0.10, maxPerDay: 3 },
            sportsTournamentRound: { baseXP: 100, levelScaling: 0.04, maxPerDay: 10 },
            // Building — granting XP even if not part of a goal
            buildImprovement: { baseXP: 75,   levelScaling: 0.02, maxPerDay: 50 },
            destroyImprovement: { baseXP: 50,  levelScaling: 0.02, maxPerDay: 25 },
            buildProject:     { baseXP: 200,  levelScaling: 0.05, maxPerDay: 10 },
            buildWonder:      { baseXP: 500,  levelScaling: 0.10, maxPerDay: 3 },
            // Government/Religion changes — XP even if not a goal
            changeGovernment: { baseXP: 300,  levelScaling: 0.05, maxPerDay: 1 },
            changeReligion:   { baseXP: 300,  levelScaling: 0.05, maxPerDay: 1 },
            changeNationalPet: { baseXP: 100, levelScaling: 0.03, maxPerDay: 1 },
            changeNationalFood: { baseXP: 75, levelScaling: 0.03, maxPerDay: 1 },
            changeNationalWater: { baseXP: 75, levelScaling: 0.03, maxPerDay: 1 },
            sendAid: { baseXP: 100, levelScaling: 0.03, maxPerDay: 5 },
            receiveAid: { baseXP: 50, levelScaling: 0.02, maxPerDay: 5 },
            proposeTrade: { baseXP: 75, levelScaling: 0.03, maxPerDay: 5 },
            acceptTrade: { baseXP: 100, levelScaling: 0.03, maxPerDay: 5 },
            rejectTrade: { baseXP: 25, levelScaling: 0.02, maxPerDay: 5 },
            // War damage — small XP per damage dealt in battle
            warDamage:        { baseXP: 1,    levelScaling: 0.001, maxPerDay: 100000 },
            // Treaty acceptance — proposer gets more than acceptor. Protectorate highest.
            treatyAccepted_protectorate:    { baseXP: 600,  levelScaling: 0.05, maxPerDay: 5 },
            treatyAccepted_extension:       { baseXP: 400,  levelScaling: 0.05, maxPerDay: 5 },
            treatyAccepted_mutualDefense:   { baseXP: 500,  levelScaling: 0.05, maxPerDay: 5 },
            treatyAccepted_mutualAggression:{ baseXP: 500,  levelScaling: 0.05, maxPerDay: 5 },
            treatyAccepted_optionalDefense: { baseXP: 350,  levelScaling: 0.05, maxPerDay: 5 },
            treatyAccepted_optionalAggression:{ baseXP: 350, levelScaling: 0.05, maxPerDay: 5 },
            treatyAccepted_intelligence:    { baseXP: 300,  levelScaling: 0.05, maxPerDay: 5 },
            treatyAccepted_peace:           { baseXP: 400,  levelScaling: 0.05, maxPerDay: 5 },
            // Treaty acceptance (acceptor side — lower XP than proposer)
            treatyJoined_protectorate:      { baseXP: 300,  levelScaling: 0.05, maxPerDay: 5 },
            treatyJoined_extension:         { baseXP: 200,  levelScaling: 0.05, maxPerDay: 5 },
            treatyJoined_mutualDefense:     { baseXP: 250,  levelScaling: 0.05, maxPerDay: 5 },
            treatyJoined_mutualAggression:  { baseXP: 250,  levelScaling: 0.05, maxPerDay: 5 },
            treatyJoined_optionalDefense:   { baseXP: 175,  levelScaling: 0.05, maxPerDay: 5 },
            treatyJoined_optionalAggression:{ baseXP: 175,  levelScaling: 0.05, maxPerDay: 5 },
            treatyJoined_intelligence:      { baseXP: 150,  levelScaling: 0.05, maxPerDay: 5 },
            treatyJoined_peace:             { baseXP: 200,  levelScaling: 0.05, maxPerDay: 5 },
            // Population & Citizens — talking to citizens
            talkCitizen:        { baseXP: 50,   levelScaling: 0.02, maxPerDay: 100 },
            // Forum motion voting — small XP per vote
            voteColorMotion:    { baseXP: 10,   levelScaling: 0.02, maxPerDay: 50 },
            voteWorldMotion:    { baseXP: 15,   levelScaling: 0.02, maxPerDay: 50 },
            // Forum motion proposing — medium XP per motion
            proposeColorMotion: { baseXP: 50,   levelScaling: 0.05, maxPerDay: 10 },
            proposeWorldMotion: { baseXP: 75,   levelScaling: 0.05, maxPerDay: 10 },
            // Congress election — one-time bonus when elected
            electedCongress:    { baseXP: 250,  levelScaling: 0.05, maxPerDay: 1 },
            // Economy — buying land/infra/tech/currency/resources
            buyLand:    { baseXP: 50,   levelScaling: 0.02, maxPerDay: 100 },
            buyInfra:   { baseXP: 10,   levelScaling: 0.02, maxPerDay: 200 },
            buyTech:    { baseXP: 5,    levelScaling: 0.02, maxPerDay: 100 },
            buyCurrency: { baseXP: 25,   levelScaling: 0.02, maxPerDay: 50 },
            buyResource: { baseXP: 20,   levelScaling: 0.02, maxPerDay: 50 },
            buyLotteryTicket: { baseXP: 50,  levelScaling: 0.02, maxPerDay: 25 },
            sellCurrency: { baseXP: 15,  levelScaling: 0.02, maxPerDay: 50 },
            sellResource: { baseXP: 15,  levelScaling: 0.02, maxPerDay: 50 },
            // Sports — small XP for any win, scaled XP for tournament wins
            sportsWin:        { baseXP: 50,   levelScaling: 0.03, maxPerDay: 20 },
            sportsSeasonWin:  { baseXP: 500,  levelScaling: 0.05, maxPerDay: 5 },
            sportsWorldWin:   { baseXP: 2000, levelScaling: 0.10, maxPerDay: 3 },
            sportsTournamentRound: { baseXP: 100, levelScaling: 0.04, maxPerDay: 10 },
            // Sports drafting — per sport, daily/weekly/monthly
            draftHockeyPlayers:   { baseXP: 30,   levelScaling: 0.02, maxPerDay: 2 },
            draftBasketballPlayers: { baseXP: 30,   levelScaling: 0.02, maxPerDay: 2 },
            draftSoccerPlayers:   { baseXP: 40,   levelScaling: 0.02, maxPerDay: 5 },
            draftFootballPlayers: { baseXP: 40,   levelScaling: 0.02, maxPerDay: 5 },
            // Sports betting
            placeSportsBet:   { baseXP: 10,   levelScaling: 0.02, maxPerDay: 30 },
            betAmount:          { baseXP: 100,  levelScaling: 0.02, maxPerDay: 100 },
            // Resource production — raw (per mineral)
            produceRaw_steel:        { baseXP: 2,   levelScaling: 0.02, maxPerDay: 100 },
            produceRaw_bronze:       { baseXP: 2,   levelScaling: 0.02, maxPerDay: 100 },
            produceRaw_lead:         { baseXP: 2,   levelScaling: 0.02, maxPerDay: 100 },
            produceRaw_aluminum:     { baseXP: 2,   levelScaling: 0.02, maxPerDay: 100 },
            produceRaw_copper:       { baseXP: 2,   levelScaling: 0.02, maxPerDay: 100 },
            produceRaw_uranium:      { baseXP: 2,   levelScaling: 0.02, maxPerDay: 100 },
            produceRaw_gasoline:     { baseXP: 2,   levelScaling: 0.02, maxPerDay: 100 },
            // Resource production — manufactured (per mineral)
            produceManufactured_steel:        { baseXP: 20,   levelScaling: 0.02, maxPerDay: 50 },
            produceManufactured_bronze:       { baseXP: 20,   levelScaling: 0.02, maxPerDay: 50 },
            produceManufactured_lead:         { baseXP: 20,   levelScaling: 0.02, maxPerDay: 50 },
            produceManufactured_aluminum:     { baseXP: 20,   levelScaling: 0.02, maxPerDay: 50 },
            produceManufactured_copper:       { baseXP: 20,   levelScaling: 0.02, maxPerDay: 50 },
            produceManufactured_uranium:      { baseXP: 20,   levelScaling: 0.02, maxPerDay: 50 },
            produceManufactured_gasoline:     { baseXP: 20,   levelScaling: 0.02, maxPerDay: 50 },
        };

        // ── Goal Templates ──
        // Templates for randomly generating goals. Each has levelRequirement and category locks.
        this.goalTemplates = {
            daily: [
                { id: 'war_attack_daily',           category: 'war',         type: 'attack',    title: 'Declare War',          description: 'Attack other nations 5-10 times.', targetMin: 5, targetMax: 10, xpReward: 200,  levelReq: 0 },
                { id: 'war_defend_daily',           category: 'war',         type: 'defend',    title: 'Be Attacked',          description: 'Be attacked 5-10 times.', targetMin: 5, targetMax: 10, xpReward: 250,  levelReq: 0 },
                { id: 'war_damage_daily',           category: 'war',         type: 'warDamage', title: 'Deal War Damage',      description: 'Deal 5-10k damage in wars.', targetMin: 5000, targetMax: 10000, xpReward: 150, levelReq: 0 },
                { id: 'treaty_propose_protectorate_daily', category: 'treaty', type: 'proposeProtectorate', title: 'Propose Protectorate', description: 'Propose 1 Protectorate Agreement.', targetMin: 1, targetMax: 1, xpReward: 100, levelReq: 0 },
                { id: 'treaty_propose_extension_daily', category: 'treaty', type: 'proposeExtension', title: 'Propose Extension Pact', description: 'Propose 1 Extension Pact.', targetMin: 1, targetMax: 1, xpReward: 100, levelReq: 0 },
                { id: 'treaty_propose_mutualDefense_daily', category: 'treaty', type: 'proposeMutualDefense', title: 'Propose Mutual Defense', description: 'Propose 1 Mutual Defense Pact.', targetMin: 1, targetMax: 1, xpReward: 150, levelReq: 0 },
                { id: 'treaty_propose_mutualAggression_daily', category: 'treaty', type: 'proposeMutualAggression', title: 'Propose Mutual Aggression', description: 'Propose 1 Mutual Aggression Pact.', targetMin: 1, targetMax: 1, xpReward: 150, levelReq: 0 },
                { id: 'treaty_propose_optionalDefense_daily', category: 'treaty', type: 'proposeOptionalDefense', title: 'Propose Optional Defense', description: 'Propose 1 Optional Defense Pact.', targetMin: 1, targetMax: 1, xpReward: 100, levelReq: 0 },
                { id: 'treaty_propose_optionalAggression_daily', category: 'treaty', type: 'proposeOptionalAggression', title: 'Propose Optional Aggression', description: 'Propose 1 Optional Aggression Pact.', targetMin: 1, targetMax: 1, xpReward: 100, levelReq: 0 },
                { id: 'treaty_propose_intelligence_daily', category: 'treaty', type: 'proposeIntelligence', title: 'Propose Intelligence Pact', description: 'Propose 1 Intelligence Pact.', targetMin: 1, targetMax: 1, xpReward: 200, levelReq: 0 },
                { id: 'treaty_propose_peace_daily', category: 'treaty', type: 'proposePeace', title: 'Propose Peace Pact', description: 'Propose 1 Peace Pact.', targetMin: 1, targetMax: 1, xpReward: 150, levelReq: 0 },
                { id: 'treaty_accept_daily', category: 'treaty', type: 'accept', title: 'Accept Treaties', description: 'Accept 1-3 pending treaties.', targetMin: 1, targetMax: 3, xpReward: 150, levelReq: 0 },
                { id: 'treaty_reject_daily', category: 'treaty', type: 'reject', title: 'Reject Treaties', description: 'Reject 1-3 pending treaties.', targetMin: 1, targetMax: 3, xpReward: 50, levelReq: 0 },
                { id: 'voteColorMotion_daily', category: 'forum', type: 'voteColorMotion', title: 'Vote on Color Motions', description: 'Vote on 1-3 color bloc motions.', targetMin: 1, targetMax: 3, xpReward: 75, levelReq: 0 },
                { id: 'voteWorldMotion_daily', category: 'forum', type: 'voteWorldMotion', title: 'Vote on World Motions', description: 'Vote on 1-3 world forum motions.', targetMin: 1, targetMax: 3, xpReward: 100, levelReq: 0 },
                { id: 'proposeColorMotion_daily', category: 'forum', type: 'proposeColorMotion', title: 'Propose Color Motion', description: 'Propose 1 color bloc motion.', targetMin: 1, targetMax: 1, xpReward: 100, levelReq: 0 },
                { id: 'proposeWorldMotion_daily', category: 'forum', type: 'proposeWorldMotion', title: 'Propose World Motion', description: 'Propose 1 world forum motion.', targetMin: 1, targetMax: 1, xpReward: 150, levelReq: 0 },
                { id: 'rel_friend_daily',           category: 'relationship',type: 'friend',   title: 'Make a Friend',        description: 'Add a friend.', target: 1, xpReward: 75,   levelReq: 0 },
                { id: 'rel_foe_daily',              category: 'relationship',type: 'foe',      title: 'Make a Foe',           description: 'Add a foe.', target: 1, xpReward: 75,   levelReq: 0 },
                { id: 'rel_bestfriend_daily',       category: 'relationship',type: 'bestFriend',title: 'Best Friend',         description: 'Designate a best friend.', target: 1, xpReward: 200,  levelReq: 5 },
                { id: 'rel_nemesis_daily',          category: 'relationship',type: 'nemesis',  title: 'Nemesis',              description: 'Designate a nemesis.', target: 1, xpReward: 200,  levelReq: 5 },
                { id: 'alliance_join_daily',        category: 'alliance',    type: 'joinAlliance', title: 'Join Alliance',       description: 'Join an existing alliance.', target: 1, xpReward: 150,  levelReq: 0 },
                { id: 'alliance_make_daily',        category: 'alliance',    type: 'makeAlliance', title: 'Create Alliance',     description: 'Found a new alliance.', target: 1, xpReward: 250,  levelReq: 0 },
                { id: 'build_improvement_daily',    category: 'building',    type: 'buildImprovement', title: 'Build Improvements',   description: 'Build 1-3 improvements.', target: 3, xpReward: 150,  levelReq: 0 },
                { id: 'destroy_improvement_daily',  category: 'building',    type: 'destroyImprovement', title: 'Destroy Improvements', description: 'Destroy 1-3 improvements.', target: 3, xpReward: 100,  levelReq: 0 },
                { id: 'produceRaw_steel_daily',      category: 'resource', type: 'produceRaw_steel',      title: 'Produce Steel Raw',       description: 'Produce 10-18 steel raw.', targetMin: 10, targetMax: 18, xpReward: 100, levelReq: 0 },
                { id: 'produceRaw_bronze_daily',     category: 'resource', type: 'produceRaw_bronze',     title: 'Produce Bronze Raw',     description: 'Produce 10-18 bronze raw.', targetMin: 10, targetMax: 18, xpReward: 100, levelReq: 0 },
                { id: 'produceRaw_lead_daily',       category: 'resource', type: 'produceRaw_lead',       title: 'Produce Lead Raw',       description: 'Produce 10-18 lead raw.', targetMin: 10, targetMax: 18, xpReward: 100, levelReq: 0 },
                { id: 'produceRaw_aluminum_daily',   category: 'resource', type: 'produceRaw_aluminum',   title: 'Produce Aluminum Raw',   description: 'Produce 10-18 aluminum raw.', targetMin: 10, targetMax: 18, xpReward: 100, levelReq: 0 },
                { id: 'produceRaw_copper_daily',     category: 'resource', type: 'produceRaw_copper',     title: 'Produce Copper Raw',     description: 'Produce 10-18 copper raw.', targetMin: 10, targetMax: 18, xpReward: 100, levelReq: 0 },
                { id: 'produceRaw_uranium_daily',    category: 'resource', type: 'produceRaw_uranium',    title: 'Produce Uranium Raw',    description: 'Produce 10-18 uranium raw.', targetMin: 10, targetMax: 18, xpReward: 100, levelReq: 0 },
                { id: 'produceRaw_gasoline_daily',   category: 'resource', type: 'produceRaw_gasoline',   title: 'Produce Gasoline Raw',   description: 'Produce 10-18 gasoline raw.', targetMin: 10, targetMax: 18, xpReward: 100, levelReq: 0 },
                { id: 'produceManufactured_steel_daily',      category: 'resource', type: 'produceManufactured_steel',      title: 'Produce Steel Manufactured',       description: 'Produce 2-5 steel manufactured.', targetMin: 2, targetMax: 5, xpReward: 100, levelReq: 0 },
                { id: 'produceManufactured_bronze_daily',     category: 'resource', type: 'produceManufactured_bronze',     title: 'Produce Bronze Manufactured',     description: 'Produce 2-5 bronze manufactured.', targetMin: 2, targetMax: 5, xpReward: 100, levelReq: 0 },
                { id: 'produceManufactured_lead_daily',       category: 'resource', type: 'produceManufactured_lead',       title: 'Produce Lead Manufactured',       description: 'Produce 2-5 lead manufactured.', targetMin: 2, targetMax: 5, xpReward: 100, levelReq: 0 },
                { id: 'produceManufactured_aluminum_daily',   category: 'resource', type: 'produceManufactured_aluminum',   title: 'Produce Aluminum Manufactured',   description: 'Produce 2-5 aluminum manufactured.', targetMin: 2, targetMax: 5, xpReward: 100, levelReq: 0 },
                { id: 'produceManufactured_copper_daily',     category: 'resource', type: 'produceManufactured_copper',     title: 'Produce Copper Manufactured',     description: 'Produce 2-5 copper manufactured.', targetMin: 2, targetMax: 5, xpReward: 100, levelReq: 0 },
                { id: 'produceManufactured_uranium_daily',    category: 'resource', type: 'produceManufactured_uranium',    title: 'Produce Uranium Manufactured',    description: 'Produce 2-5 uranium manufactured.', targetMin: 2, targetMax: 5, xpReward: 100, levelReq: 0 },
                { id: 'produceManufactured_gasoline_daily',   category: 'resource', type: 'produceManufactured_gasoline',   title: 'Produce Gasoline Manufactured',   description: 'Produce 2-5 gasoline manufactured.', targetMin: 2, targetMax: 5, xpReward: 100, levelReq: 0 },
                { id: 'trainSoldiers_daily',      category: 'military',    type: 'trainSoldiers', title: 'Enlist Soldiers',      description: 'Enlist 1-10% of soldier cap.', capPercentMin: 1, capPercentMax: 10, xpReward: 100,  levelReq: 0, requiresTech: 0 },
                { id: 'trainTanks_daily',         category: 'military',    type: 'trainTanks',    title: 'Train Tanks',          description: 'Train 1-10% of tank cap.', capPercentMin: 1, capPercentMax: 10, xpReward: 150,  levelReq: 0, requiresTech: 150 },
                { id: 'trainAircraft_daily',      category: 'military',    type: 'trainAircraft', title: 'Train Aircraft',       description: 'Train 1-10% of aircraft cap.', capPercentMin: 1, capPercentMax: 10, xpReward: 200,  levelReq: 0, requiresTech: 300 },
                { id: 'trainShips_daily',         category: 'military',    type: 'trainShips',    title: 'Train Ships',          description: 'Train 1-10% of ship cap.', capPercentMin: 1, capPercentMax: 10, xpReward: 300,  levelReq: 0, requiresTech: 450 },
                { id: 'buyMissiles_daily',        category: 'military',    type: 'buyMissiles',   title: 'Buy Missiles',         description: 'Buy 1-3 missiles.', targetMin: 1, targetMax: 3, xpReward: 100,  levelReq: 0, requiresProject: 'missileSilo' },
                { id: 'buyNukes_daily',           category: 'military',    type: 'buyNukes',      title: 'Buy Nukes',            description: 'Buy 1 nuke.', target: 1, xpReward: 500,  levelReq: 0, requiresWonder: 'nuclearWarheadFacility' },
                { id: 'economy_land_daily',         category: 'economy',     type: 'land',      title: 'Buy Land',             description: 'Purchase a land block.', target: 1, xpReward: 75,   levelReq: 0 },
                { id: 'economy_infra_daily',        category: 'economy',     type: 'infra',     title: 'Buy Infrastructure',   description: 'Purchase infrastructure.', target: 1, xpReward: 75,   levelReq: 0 },
                { id: 'research_daily',             category: 'research',    type: 'research',  title: 'Complete Research',    description: 'Complete a research project.', target: 1, xpReward: 200,  levelReq: 1 },
                { id: 'sports_match_daily',         category: 'sports',      type: 'match',     title: 'Watch Sports',         description: 'Watch a sports match.', target: 1, xpReward: 50,   levelReq: 0 },
                { id: 'sports_win_daily',           category: 'sports',      type: 'win',       title: 'Win a Sports Game',    description: 'Win any sports game (tournament or not).', target: 1, xpReward: 100,  levelReq: 0 },
                { id: 'buyLand_daily',              category: 'economy',     type: 'buyLand',     title: 'Buy Land',             description: 'Buy 1-10 land blocks.', targetMin: 1, targetMax: 10, xpReward: 75,   levelReq: 0 },
                { id: 'buyInfra_daily',             category: 'economy',     type: 'buyInfra',    title: 'Buy Infrastructure',   description: 'Buy 1-10 infrastructure.', targetMin: 1, targetMax: 10, xpReward: 75,   levelReq: 0 },
                { id: 'buyTech_daily',              category: 'economy',     type: 'buyTech',     title: 'Buy Tech',             description: 'Buy 1-10 tech levels.', targetMin: 1, targetMax: 10, xpReward: 100,  levelReq: 0 },
                { id: 'buyCurrency_daily',          category: 'economy',     type: 'buyCurrency',   title: 'Buy Currency',         description: 'Buy 1-5 currency points.', targetMin: 1, targetMax: 5, xpReward: 50,   levelReq: 0 },
                { id: 'buyResource_daily',          category: 'economy',     type: 'buyResource',   title: 'Buy Resources',        description: 'Buy 1-5 units of resources.', targetMin: 1, targetMax: 5, xpReward: 50,   levelReq: 0 },
                { id: 'buyLotteryTicket_daily',     category: 'economy',     type: 'buyLotteryTicket',   title: 'Buy Lottery Ticket',         description: 'Buy 1-5 lottery tickets.', targetMin: 1, targetMax: 5, xpReward: 50,   levelReq: 0 },
                { id: 'talkCitizen_daily',            category: 'population',   type: 'talkCitizen',   title: 'Talk to Citizens',        description: 'Talk to 1-3 citizens.', targetMin: 1, targetMax: 3, xpReward: 50,   levelReq: 0 },
                { id: 'sellCurrency_daily',         category: 'economy',     type: 'sellCurrency',  title: 'Sell Currency',        description: 'Sell 1-5 currency points.', targetMin: 1, targetMax: 5, xpReward: 25,   levelReq: 0 },
                { id: 'sellResource_daily',         category: 'economy',     type: 'sellResource',  title: 'Sell Resources',       description: 'Sell 1-5 units of resources.', targetMin: 1, targetMax: 5, xpReward: 25,   levelReq: 0 },
                { id: 'draftHockeyPlayers_daily',      category: 'sports',      type: 'draftHockeyPlayers',      title: 'Draft Hockey Players',      description: 'Draft 1-2 hockey players.', targetMin: 1, targetMax: 2, xpReward: 30,   levelReq: 0 },
                { id: 'draftBasketballPlayers_daily',      category: 'sports',      type: 'draftBasketballPlayers',      title: 'Draft Basketball Players',      description: 'Draft 1-2 basketball players.', targetMin: 1, targetMax: 2, xpReward: 30,   levelReq: 0 },
                { id: 'draftSoccerPlayers_daily',      category: 'sports',      type: 'draftSoccerPlayers',      title: 'Draft Soccer Players',      description: 'Draft 3-5 soccer players.', targetMin: 3, targetMax: 5, xpReward: 40,   levelReq: 0 },
                { id: 'draftFootballPlayers_daily',      category: 'sports',      type: 'draftFootballPlayers',      title: 'Draft Football Players',      description: 'Draft 3-5 football players.', targetMin: 3, targetMax: 5, xpReward: 40,   levelReq: 0 },
                { id: 'placeSportsBet_daily',        category: 'sports',      type: 'placeSportsBet',   title: 'Place Sports Bet',         description: 'Place 1-3 sports bets.', targetMin: 1, targetMax: 3, xpReward: 10,   levelReq: 0 },
                { id: 'betAmount_daily',        category: 'sports',     type: 'betAmount',   title: 'Bet Amount',         description: 'Bet 2-7.5% of currency.', targetMin: 2, targetMax: 7.5, xpReward: 100,   levelReq: 0, isPercentage: true },
            ],
            weekly: [
                { id: 'war_attack_weekly',          category: 'war',         type: 'attack',    title: 'Warmonger',            description: 'Attack in 45-75 wars.', targetMin: 45, targetMax: 75, xpReward: 1500, levelReq: 5 },
                { id: 'war_defend_weekly',          category: 'war',         type: 'defend',    title: 'Defender',             description: 'Be attacked in 45-75 wars.', targetMin: 45, targetMax: 75, xpReward: 1500, levelReq: 5 },
                { id: 'war_damage_weekly',          category: 'war',         type: 'warDamage', title: 'Deal Heavy War Damage', description: 'Deal 25-45k damage in wars.', targetMin: 25000, targetMax: 45000, xpReward: 1000, levelReq: 5 },
                { id: 'war_win_weekly',             category: 'war',         type: 'win',       title: 'Conqueror',            description: 'Win 2 wars.', target: 2, xpReward: 3000, levelReq: 10 },
                { id: 'treaty_propose_protectorate_weekly', category: 'treaty', type: 'proposeProtectorate', title: 'Propose Protectorates', description: 'Propose 3-5 Protectorate Agreements.', targetMin: 3, targetMax: 5, xpReward: 750, levelReq: 3 },
                { id: 'treaty_propose_extension_weekly', category: 'treaty', type: 'proposeExtension', title: 'Propose Extension Pacts', description: 'Propose 3-5 Extension Pacts.', targetMin: 3, targetMax: 5, xpReward: 750, levelReq: 3 },
                { id: 'treaty_propose_mutualDefense_weekly', category: 'treaty', type: 'proposeMutualDefense', title: 'Propose Mutual Defenses', description: 'Propose 3-5 Mutual Defense Pacts.', targetMin: 3, targetMax: 5, xpReward: 1000, levelReq: 3 },
                { id: 'treaty_propose_mutualAggression_weekly', category: 'treaty', type: 'proposeMutualAggression', title: 'Propose Mutual Aggressions', description: 'Propose 3-5 Mutual Aggression Pacts.', targetMin: 3, targetMax: 5, xpReward: 1000, levelReq: 3 },
                { id: 'treaty_propose_optionalDefense_weekly', category: 'treaty', type: 'proposeOptionalDefense', title: 'Propose Optional Defenses', description: 'Propose 3-5 Optional Defense Pacts.', targetMin: 3, targetMax: 5, xpReward: 750, levelReq: 3 },
                { id: 'treaty_propose_optionalAggression_weekly', category: 'treaty', type: 'proposeOptionalAggression', title: 'Propose Optional Aggressions', description: 'Propose 3-5 Optional Aggression Pacts.', targetMin: 3, targetMax: 5, xpReward: 750, levelReq: 3 },
                { id: 'treaty_propose_intelligence_weekly', category: 'treaty', type: 'proposeIntelligence', title: 'Propose Intelligence Pacts', description: 'Propose 3-5 Intelligence Pacts.', targetMin: 3, targetMax: 5, xpReward: 1000, levelReq: 3 },
                { id: 'treaty_propose_peace_weekly', category: 'treaty', type: 'proposePeace', title: 'Propose Peace Pacts', description: 'Propose 3-5 Peace Pacts.', targetMin: 3, targetMax: 5, xpReward: 1000, levelReq: 3 },
                { id: 'treaty_accept_weekly', category: 'treaty', type: 'accept', title: 'Accept Treaties', description: 'Accept 5-10 pending treaties.', targetMin: 5, targetMax: 10, xpReward: 1000, levelReq: 3 },
                { id: 'treaty_reject_weekly', category: 'treaty', type: 'reject', title: 'Reject Treaties', description: 'Reject 5-10 pending treaties.', targetMin: 5, targetMax: 10, xpReward: 500, levelReq: 3 },
                { id: 'voteColorMotion_weekly', category: 'forum', type: 'voteColorMotion', title: 'Vote on Color Motions', description: 'Vote on 7-15 color bloc motions.', targetMin: 7, targetMax: 15, xpReward: 750, levelReq: 0 },
                { id: 'voteWorldMotion_weekly', category: 'forum', type: 'voteWorldMotion', title: 'Vote on World Motions', description: 'Vote on 7-15 world forum motions.', targetMin: 7, targetMax: 15, xpReward: 1000, levelReq: 0 },
                { id: 'proposeColorMotion_weekly', category: 'forum', type: 'proposeColorMotion', title: 'Propose Color Motions', description: 'Propose 3-5 color bloc motions.', targetMin: 3, targetMax: 5, xpReward: 500, levelReq: 0 },
                { id: 'proposeWorldMotion_weekly', category: 'forum', type: 'proposeWorldMotion', title: 'Propose World Motions', description: 'Propose 3-5 world forum motions.', targetMin: 3, targetMax: 5, xpReward: 750, levelReq: 0 },
                { id: 'build_improvement_weekly',   category: 'building',    type: 'buildImprovement', title: 'Build Improvements',   description: 'Build 5-10 improvements.', target: 10, xpReward: 1000, levelReq: 5 },
                { id: 'destroy_improvement_weekly', category: 'building',    type: 'destroyImprovement', title: 'Destroy Improvements', description: 'Destroy 5-10 improvements.', target: 10, xpReward: 750,  levelReq: 5 },
                { id: 'build_project_weekly',       category: 'building',    type: 'buildProject',   title: 'Build Projects',         description: 'Build 1-2 projects.', target: 2, xpReward: 1500, levelReq: 10 },
                { id: 'produce_resource_weekly',    category: 'resource',    type: 'produce',   title: 'Producer',             description: 'Produce 100 resources.', target: 100, xpReward: 1000, levelReq: 5 },
                { id: 'trainSoldiers_weekly',      category: 'military',    type: 'trainSoldiers', title: 'Enlist Soldiers',      description: 'Train 25-50% of soldier cap.', capPercentMin: 25, capPercentMax: 50, xpReward: 1000, levelReq: 0, requiresTech: 0 },
                { id: 'trainTanks_weekly',         category: 'military',    type: 'trainTanks',    title: 'Train Tanks',          description: 'Train 25-50% of tank cap.', capPercentMin: 25, capPercentMax: 50, xpReward: 1500, levelReq: 0, requiresTech: 150 },
                { id: 'trainAircraft_weekly',      category: 'military',    type: 'trainAircraft', title: 'Train Aircraft',       description: 'Train 25-50% of aircraft cap.', capPercentMin: 25, capPercentMax: 50, xpReward: 2000, levelReq: 0, requiresTech: 300 },
                { id: 'trainShips_weekly',         category: 'military',    type: 'trainShips',    title: 'Train Ships',          description: 'Train 25-50% of ship cap.', capPercentMin: 25, capPercentMax: 50, xpReward: 3000, levelReq: 0, requiresTech: 450 },
                { id: 'buyMissiles_weekly',        category: 'military',    type: 'buyMissiles',   title: 'Buy Missiles',         description: 'Buy 7-15 missiles.', targetMin: 7, targetMax: 15, xpReward: 1000, levelReq: 0, requiresProject: 'missileSilo' },
                { id: 'buyNukes_weekly',           category: 'military',    type: 'buyNukes',      title: 'Buy Nukes',            description: 'Buy 3-5 nukes.', targetMin: 3, targetMax: 5, xpReward: 3000, levelReq: 0, requiresWonder: 'nuclearWarheadFacility' },
                { id: 'economy_land_weekly',        category: 'economy',     type: 'land',      title: 'Expansionist',         description: 'Buy 10 land blocks.', target: 10, xpReward: 750,  levelReq: 5 },
                { id: 'economy_infra_weekly',       category: 'economy',     type: 'infra',     title: 'Builder',              description: 'Buy 50 infrastructure.', target: 50, xpReward: 750,  levelReq: 5 },
                { id: 'research_weekly',            category: 'research',    type: 'research',  title: 'Scientist',            description: 'Complete 3 researches.', target: 3, xpReward: 1500, levelReq: 10 },
                { id: 'sports_win_weekly',          category: 'sports',      type: 'win',       title: 'Win 5 Sports Games',   description: 'Win 5 sports games (tournament or not).', target: 5, xpReward: 1000, levelReq: 5 },
                { id: 'buyLand_weekly',             category: 'economy',     type: 'buyLand',     title: 'Buy Land',             description: 'Buy 50-150 land blocks.', targetMin: 50, targetMax: 150, xpReward: 750, levelReq: 0 },
                { id: 'buyInfra_weekly',            category: 'economy',     type: 'buyInfra',    title: 'Buy Infrastructure',   description: 'Buy 50-150 infrastructure.', targetMin: 50, targetMax: 150, xpReward: 750, levelReq: 0 },
                { id: 'buyTech_weekly',             category: 'economy',     type: 'buyTech',     title: 'Buy Tech',             description: 'Buy 50-150 tech levels.', targetMin: 50, targetMax: 150, xpReward: 1000, levelReq: 0 },
                { id: 'draftHockeyPlayers_weekly',      category: 'sports',      type: 'draftHockeyPlayers',      title: 'Draft Hockey Players',      description: 'Draft 4-6 hockey players.', targetMin: 4, targetMax: 6, xpReward: 100,   levelReq: 0 },
                { id: 'draftBasketballPlayers_weekly',      category: 'sports',      type: 'draftBasketballPlayers',      title: 'Draft Basketball Players',      description: 'Draft 4-6 basketball players.', targetMin: 4, targetMax: 6, xpReward: 100,   levelReq: 0 },
                { id: 'draftSoccerPlayers_weekly',      category: 'sports',      type: 'draftSoccerPlayers',      title: 'Draft Soccer Players',      description: 'Draft 7-12 soccer players.', targetMin: 7, targetMax: 12, xpReward: 150,   levelReq: 0 },
                { id: 'draftFootballPlayers_weekly',      category: 'sports',      type: 'draftFootballPlayers',      title: 'Draft Football Players',      description: 'Draft 7-12 football players.', targetMin: 7, targetMax: 12, xpReward: 150,   levelReq: 0 },
                { id: 'placeSportsBet_weekly',        category: 'sports',      type: 'placeSportsBet',   title: 'Place Sports Bets',         description: 'Place 5-10 sports bets.', targetMin: 5, targetMax: 10, xpReward: 100,   levelReq: 0 },
                { id: 'betAmount_weekly',        category: 'sports',     type: 'betAmount',   title: 'Bet Amount',         description: 'Bet 10-25% of currency.', targetMin: 10, targetMax: 25, xpReward: 250,   levelReq: 0, isPercentage: true },
                { id: 'buyLotteryTicket_weekly',        category: 'economy',     type: 'buyLotteryTicket',   title: 'Buy Lottery Tickets',         description: 'Buy 5-25 lottery tickets.', targetMin: 5, targetMax: 25, xpReward: 500,   levelReq: 0 },
                { id: 'talkCitizen_weekly',            category: 'population',   type: 'talkCitizen',   title: 'Talk to Citizens',        description: 'Talk to 5-10 citizens.', targetMin: 5, targetMax: 10, xpReward: 250,   levelReq: 0 },
                { id: 'changeNationalPet_weekly',      category: 'national', type: 'changeNationalPet', title: 'National Pet',         description: 'Change your national pet.', target: 1, xpReward: 300, levelReq: 0 },
                { id: 'sendAid_weekly',                category: 'aid',      type: 'sendAid',        title: 'Send Aid',             description: 'Send aid to another nation.', target: 1, xpReward: 300, levelReq: 0 },
                { id: 'proposeTrade_weekly',           category: 'trade',    type: 'proposeTrade',   title: 'Propose Trade',          description: 'Propose a trade with another nation.', target: 1, xpReward: 300, levelReq: 0 },
            ],
            monthly: [
                { id: 'war_attack_monthly',         category: 'war',         type: 'attack',    title: 'Warmongering',         description: 'Attack in 300-500 wars.', targetMin: 300, targetMax: 500, xpReward: 10000, levelReq: 15 },
                { id: 'war_defend_monthly',         category: 'war',         type: 'defend',    title: 'Fortress',             description: 'Be attacked in 300-500 wars.', targetMin: 300, targetMax: 500, xpReward: 10000, levelReq: 15 },
                { id: 'war_damage_monthly',         category: 'war',         type: 'warDamage', title: 'Massive War Damage',   description: 'Deal 150-300k damage in wars.', targetMin: 150000, targetMax: 300000, xpReward: 5000, levelReq: 15 },
                { id: 'war_win_monthly',            category: 'war',         type: 'win',       title: 'World Conqueror',      description: 'Win 10 wars.', target: 10, xpReward: 20000, levelReq: 20 },
                { id: 'treaty_propose_protectorate_monthly', category: 'treaty', type: 'proposeProtectorate', title: 'Propose Many Protectorates', description: 'Propose 10-15 Protectorate Agreements.', targetMin: 10, targetMax: 15, xpReward: 5000, levelReq: 15 },
                { id: 'treaty_propose_extension_monthly', category: 'treaty', type: 'proposeExtension', title: 'Propose Many Extension Pacts.', description: 'Propose 10-15 Extension Pacts.', targetMin: 10, targetMax: 15, xpReward: 5000, levelReq: 15 },
                { id: 'treaty_propose_mutualDefense_monthly', category: 'treaty', type: 'proposeMutualDefense', title: 'Propose Many Mutual Defenses', description: 'Propose 10-15 Mutual Defense Pacts.', targetMin: 10, targetMax: 15, xpReward: 7500, levelReq: 15 },
                { id: 'treaty_propose_mutualAggression_monthly', category: 'treaty', type: 'proposeMutualAggression', title: 'Propose Many Mutual Aggressions', description: 'Propose 10-15 Mutual Aggression Pacts.', targetMin: 10, targetMax: 15, xpReward: 7500, levelReq: 15 },
                { id: 'treaty_propose_optionalDefense_monthly', category: 'treaty', type: 'proposeOptionalDefense', title: 'Propose Many Optional Defenses', description: 'Propose 10-15 Optional Defense Pacts.', targetMin: 10, targetMax: 15, xpReward: 5000, levelReq: 15 },
                { id: 'treaty_propose_optionalAggression_monthly', category: 'treaty', type: 'proposeOptionalAggression', title: 'Propose Many Optional Aggressions', description: 'Propose 10-15 Optional Aggression Pacts.', targetMin: 10, targetMax: 15, xpReward: 5000, levelReq: 15 },
                { id: 'treaty_propose_intelligence_monthly', category: 'treaty', type: 'proposeIntelligence', title: 'Propose Many Intelligence Pacts.', description: 'Propose 10-15 Intelligence Pacts.', targetMin: 10, targetMax: 15, xpReward: 7500, levelReq: 15 },
                { id: 'treaty_propose_peace_monthly', category: 'treaty', type: 'proposePeace', title: 'Propose Many Peace Pacts.', description: 'Propose 10-15 Peace Pacts.', targetMin: 10, targetMax: 15, xpReward: 7500, levelReq: 15 },
                { id: 'treaty_accept_monthly', category: 'treaty', type: 'accept', title: 'Accept Many Treaties', description: 'Accept 20-30 pending treaties.', targetMin: 20, targetMax: 30, xpReward: 7500, levelReq: 15 },
                { id: 'treaty_reject_monthly', category: 'treaty', type: 'reject', title: 'Reject Many Treaties', description: 'Reject 20-30 pending treaties.', targetMin: 20, targetMax: 30, xpReward: 2500, levelReq: 15 },
                { id: 'voteColorMotion_monthly', category: 'forum', type: 'voteColorMotion', title: 'Vote Many Color Motions', description: 'Vote on 25-30 color bloc motions.', targetMin: 25, targetMax: 30, xpReward: 5000, levelReq: 0 },
                { id: 'voteWorldMotion_monthly', category: 'forum', type: 'voteWorldMotion', title: 'Vote Many World Motions', description: 'Vote on 25-30 world forum motions.', targetMin: 25, targetMax: 30, xpReward: 7500, levelReq: 0 },
                { id: 'proposeColorMotion_monthly', category: 'forum', type: 'proposeColorMotion', title: 'Propose Many Color Motions', description: 'Propose 10-15 color bloc motions.', targetMin: 10, targetMax: 15, xpReward: 5000, levelReq: 0 },
                { id: 'proposeWorldMotion_monthly', category: 'forum', type: 'proposeWorldMotion', title: 'Propose Many World Motions', description: 'Propose 10-15 world forum motions.', targetMin: 10, targetMax: 15, xpReward: 7500, levelReq: 0 },
                { id: 'build_improvement_monthly',  category: 'building',    type: 'buildImprovement', title: 'Build Many Improvements',   description: 'Build 15-30 improvements.', target: 30, xpReward: 10000, levelReq: 20 },
                { id: 'destroy_improvement_monthly',category: 'building',    type: 'destroyImprovement', title: 'Destroy Many Improvements', description: 'Destroy 15-30 improvements.', target: 30, xpReward: 7500,  levelReq: 20 },
                { id: 'build_project_monthly',      category: 'building',    type: 'buildProject',   title: 'Build Many Projects',     description: 'Build 3-5 projects.', target: 5, xpReward: 15000, levelReq: 25 },
                { id: 'build_wonder_monthly',       category: 'building',    type: 'buildWonder',    title: 'Build a Wonder',          description: 'Build 1 wonder.', target: 1, xpReward: 20000, levelReq: 30 },
                { id: 'produce_resource_monthly',   category: 'resource',    type: 'produce',   title: 'Industry Leader',      description: 'Produce 1000 resources.', target: 1000, xpReward: 10000, levelReq: 20 },
                { id: 'trainSoldiers_monthly',      category: 'military',    type: 'trainSoldiers', title: 'Enlist Soldiers',      description: 'Train 75-100% of soldier cap.', capPercentMin: 75, capPercentMax: 100, xpReward: 10000, levelReq: 0, requiresTech: 0 },
                { id: 'trainTanks_monthly',         category: 'military',    type: 'trainTanks',    title: 'Train Tanks',          description: 'Train 75-100% of tank cap.', capPercentMin: 75, capPercentMax: 100, xpReward: 15000, levelReq: 0, requiresTech: 150 },
                { id: 'trainAircraft_monthly',      category: 'military',    type: 'trainAircraft', title: 'Train Aircraft',       description: 'Train 75-100% of aircraft cap.', capPercentMin: 75, capPercentMax: 100, xpReward: 20000, levelReq: 0, requiresTech: 300 },
                { id: 'trainShips_monthly',         category: 'military',    type: 'trainShips',    title: 'Train Ships',          description: 'Train 75-100% of ship cap.', capPercentMin: 75, capPercentMax: 100, xpReward: 30000, levelReq: 0, requiresTech: 450 },
                { id: 'buyMissiles_monthly',        category: 'military',    type: 'buyMissiles',   title: 'Buy Missiles',         description: 'Buy 24-30 missiles.', targetMin: 24, targetMax: 30, xpReward: 10000, levelReq: 0, requiresProject: 'missileSilo' },
                { id: 'buyNukes_monthly',           category: 'military',    type: 'buyNukes',      title: 'Buy Nukes',            description: 'Buy 12-20 nukes.', targetMin: 12, targetMax: 20, xpReward: 50000, levelReq: 0, requiresWonder: 'nuclearWarheadFacility' },
                { id: 'economy_land_monthly',       category: 'economy',     type: 'land',      title: 'Empire Builder',       description: 'Buy 50 land blocks.', target: 50, xpReward: 5000, levelReq: 20 },
                { id: 'economy_infra_monthly',      category: 'economy',     type: 'infra',     title: 'Infrastructure King',  description: 'Buy 500 infrastructure.', target: 500, xpReward: 5000, levelReq: 20 },
                { id: 'research_monthly',           category: 'research',    type: 'research',  title: 'Grand Scientist',      description: 'Complete 20 researches.', target: 20, xpReward: 15000, levelReq: 30 },
                { id: 'sports_win_monthly',         category: 'sports',      type: 'win',       title: 'Win 25 Sports Games',  description: 'Win 25 sports games (tournament or not).', target: 25, xpReward: 5000, levelReq: 20 },
                { id: 'buyLand_monthly',            category: 'economy',     type: 'buyLand',     title: 'Buy Land',             description: 'Buy 300-500 land blocks.', targetMin: 300, targetMax: 500, xpReward: 5000, levelReq: 0 },
                { id: 'buyInfra_monthly',           category: 'economy',     type: 'buyInfra',    title: 'Buy Infrastructure',   description: 'Buy 300-500 infrastructure.', targetMin: 300, targetMax: 500, xpReward: 5000, levelReq: 0 },
                { id: 'buyTech_monthly',            category: 'economy',     type: 'buyTech',     title: 'Buy Tech',             description: 'Buy 300-500 tech levels.', targetMin: 300, targetMax: 500, xpReward: 5000, levelReq: 0 },
                { id: 'buyLotteryTicket_monthly',        category: 'economy',     type: 'buyLotteryTicket',   title: 'Buy Lottery Tickets',         description: 'Buy 50-100 lottery tickets.', targetMin: 50, targetMax: 100, xpReward: 2500,   levelReq: 0 },
                { id: 'talkCitizen_monthly',            category: 'population',   type: 'talkCitizen',   title: 'Talk to Citizens',        description: 'Talk to 20-30 citizens.', targetMin: 20, targetMax: 30, xpReward: 1000,   levelReq: 0 },
                { id: 'draftHockeyPlayers_monthly',      category: 'sports',      type: 'draftHockeyPlayers',      title: 'Draft Hockey Players',      description: 'Draft 8-12 hockey players.', targetMin: 8, targetMax: 12, xpReward: 500,   levelReq: 0 },
                { id: 'draftBasketballPlayers_monthly',      category: 'sports',      type: 'draftBasketballPlayers',      title: 'Draft Basketball Players',      description: 'Draft 8-12 basketball players.', targetMin: 8, targetMax: 12, xpReward: 500,   levelReq: 0 },
                { id: 'draftSoccerPlayers_monthly',      category: 'sports',      type: 'draftSoccerPlayers',      title: 'Draft Soccer Players',      description: 'Draft 15-30 soccer players.', targetMin: 15, targetMax: 30, xpReward: 600,   levelReq: 0 },
                { id: 'draftFootballPlayers_monthly',      category: 'sports',      type: 'draftFootballPlayers',      title: 'Draft Football Players',      description: 'Draft 15-30 football players.', targetMin: 15, targetMax: 30, xpReward: 600,   levelReq: 0 },
                { id: 'placeSportsBet_monthly',        category: 'sports',      type: 'placeSportsBet',   title: 'Place Sports Bets',         description: 'Place 20-30 sports bets.', targetMin: 20, targetMax: 30, xpReward: 1000,   levelReq: 0 },
                { id: 'betAmount_monthly',        category: 'sports',     type: 'betAmount',   title: 'Bet Amount',         description: 'Bet 45-60% of currency.', targetMin: 45, targetMax: 60, xpReward: 1000,   levelReq: 0, isPercentage: true },
                { id: 'buyLotteryTicket_monthly',        category: 'economy',     type: 'buyLotteryTicket',   title: 'Buy Lottery Tickets',         description: 'Buy 50-100 lottery tickets.', targetMin: 50, targetMax: 100, xpReward: 2500, levelReq: 0 },
                { id: 'buyCurrency_monthly',        category: 'economy',     type: 'buyCurrency',   title: 'Buy Currency',         description: 'Buy 50-100 currency points.', targetMin: 50, targetMax: 100, xpReward: 2500, levelReq: 0 },
                { id: 'buyResource_monthly',        category: 'economy',     type: 'buyResource',   title: 'Buy Resources',        description: 'Buy 50-100 units of resources.', targetMin: 50, targetMax: 100, xpReward: 2500, levelReq: 0 },
                { id: 'sellCurrency_monthly',       category: 'economy',     type: 'sellCurrency',  title: 'Sell Currency',        description: 'Sell 50-100 currency points.', targetMin: 50, targetMax: 100, xpReward: 1250, levelReq: 0 },
                { id: 'sellResource_monthly',       category: 'economy',     type: 'sellResource',  title: 'Sell Resources',       description: 'Sell 50-100 units of resources.', targetMin: 50, targetMax: 100, xpReward: 1250, levelReq: 0 },
                { id: 'produceRaw_steel_monthly',      category: 'resource', type: 'produceRaw_steel',      title: 'Produce Steel Raw',       description: 'Produce 400-500 steel raw.', targetMin: 400, targetMax: 500, xpReward: 5000, levelReq: 0 },
                { id: 'produceRaw_bronze_monthly',     category: 'resource', type: 'produceRaw_bronze',     title: 'Produce Bronze Raw',     description: 'Produce 400-500 bronze raw.', targetMin: 400, targetMax: 500, xpReward: 5000, levelReq: 0 },
                { id: 'produceRaw_lead_monthly',       category: 'resource', type: 'produceRaw_lead',       title: 'Produce Lead Raw',       description: 'Produce 400-500 lead raw.', targetMin: 400, targetMax: 500, xpReward: 5000, levelReq: 0 },
                { id: 'produceRaw_aluminum_monthly',   category: 'resource', type: 'produceRaw_aluminum',   title: 'Produce Aluminum Raw',   description: 'Produce 400-500 aluminum raw.', targetMin: 400, targetMax: 500, xpReward: 5000, levelReq: 0 },
                { id: 'produceRaw_copper_monthly',     category: 'resource', type: 'produceRaw_copper',     title: 'Produce Copper Raw',     description: 'Produce 400-500 copper raw.', targetMin: 400, targetMax: 500, xpReward: 5000, levelReq: 0 },
                { id: 'produceRaw_uranium_monthly',    category: 'resource', type: 'produceRaw_uranium',    title: 'Produce Uranium Raw',    description: 'Produce 400-500 uranium raw.', targetMin: 400, targetMax: 500, xpReward: 5000, levelReq: 0 },
                { id: 'produceRaw_gasoline_monthly',   category: 'resource', type: 'produceRaw_gasoline',   title: 'Produce Gasoline Raw',   description: 'Produce 400-500 gasoline raw.', targetMin: 400, targetMax: 500, xpReward: 5000, levelReq: 0 },
                { id: 'produceManufactured_steel_monthly',      category: 'resource', type: 'produceManufactured_steel',      title: 'Produce Steel Manufactured',       description: 'Produce 50-100 steel manufactured.', targetMin: 50, targetMax: 100, xpReward: 5000, levelReq: 0 },
                { id: 'produceManufactured_bronze_monthly',     category: 'resource', type: 'produceManufactured_bronze',     title: 'Produce Bronze Manufactured',     description: 'Produce 50-100 bronze manufactured.', targetMin: 50, targetMax: 100, xpReward: 5000, levelReq: 0 },
                { id: 'produceManufactured_lead_monthly',       category: 'resource', type: 'produceManufactured_lead',       title: 'Produce Lead Manufactured',       description: 'Produce 50-100 lead manufactured.', targetMin: 50, targetMax: 100, xpReward: 5000, levelReq: 0 },
                { id: 'produceManufactured_aluminum_monthly',   category: 'resource', type: 'produceManufactured_aluminum',   title: 'Produce Aluminum Manufactured',   description: 'Produce 50-100 aluminum manufactured.', targetMin: 50, targetMax: 100, xpReward: 5000, levelReq: 0 },
                { id: 'produceManufactured_copper_monthly',     category: 'resource', type: 'produceManufactured_copper',     title: 'Produce Copper Manufactured',     description: 'Produce 50-100 copper manufactured.', targetMin: 50, targetMax: 100, xpReward: 5000, levelReq: 0 },
                { id: 'produceManufactured_uranium_monthly',    category: 'resource', type: 'produceManufactured_uranium',    title: 'Produce Uranium Manufactured',    description: 'Produce 50-100 uranium manufactured.', targetMin: 50, targetMax: 100, xpReward: 5000, levelReq: 0 },
                { id: 'produceManufactured_gasoline_monthly',   category: 'resource', type: 'produceManufactured_gasoline',   title: 'Produce Gasoline Manufactured',   description: 'Produce 50-100 gasoline manufactured.', targetMin: 50, targetMax: 100, xpReward: 5000, levelReq: 0 },
                { id: 'changeGovernment_monthly',   category: 'government',   type: 'changeGovernment', title: 'Change Government',   description: 'Change your government type.', target: 1, xpReward: 300,  levelReq: 10 },
                { id: 'changeReligion_monthly',     category: 'religion',     type: 'changeReligion', title: 'Change Religion',      description: 'Change your religion type.', target: 1, xpReward: 300,  levelReq: 10 },
                { id: 'changeNationalFood_monthly', category: 'national', type: 'changeNationalFood', title: 'Change National Food', description: 'Change your national food type.', target: 1, xpReward: 300, levelReq: 0 },
                { id: 'changeNationalWater_monthly', category: 'national', type: 'changeNationalWater', title: 'Change National Water', description: 'Change your national water type.', target: 1, xpReward: 300, levelReq: 0 },
                { id: 'changeNationalPet_monthly',   category: 'national', type: 'changeNationalPet', title: 'Change National Pet Multiple Times', description: 'Change your national pet 2-4 times.', targetMin: 2, targetMax: 4, xpReward: 750, levelReq: 0 },
                { id: 'electedCongress_monthly',    category: 'forum',        type: 'electedCongress', title: 'Elected to Congress', description: 'Be elected as a color congress representative.', target: 1, xpReward: 1000, levelReq: 0 },
                { id: 'sendAid_monthly',            category: 'aid',      type: 'sendAid',        title: 'Send Aid',             description: 'Send aid to another nation.', targetMin: 2, targetMax: 4, xpReward: 1000, levelReq: 0 },
                { id: 'receiveAid_monthly',         category: 'aid',      type: 'receiveAid',     title: 'Receive Aid',          description: 'Receive aid from another nation.', targetMin: 2, targetMax: 4, xpReward: 750, levelReq: 0 },
                { id: 'proposeTrade_monthly',       category: 'trade',    type: 'proposeTrade',   title: 'Propose Trades',         description: 'Propose trades with other nations.', targetMin: 2, targetMax: 4, xpReward: 1000, levelReq: 0 },
                { id: 'acceptTrade_monthly',        category: 'trade',    type: 'acceptTrade',    title: 'Accept Trades',          description: 'Accept trades from other nations.', targetMin: 2, targetMax: 4, xpReward: 1000, levelReq: 0 },
            ],
        };

        // ── Player State ──
        this.playerXP = {
            totalXP: 0,
            sourceCounts: {}, // sourceKey -> count this period
            sourceMaxPerDay: {},
        };

        // ── Goals State ──
        this.goals = {
            daily:   [], // array of active goal objects
            weekly:  [],
            monthly: [],
        };

        // ── Goal State Tracking ──
        // Per-period refresh counts for cost calculation
        this.refreshCounts = {
            daily:   0,
            weekly:  0,
            monthly: 0,
        };
        // Completed goals tracking
        this.completedGoals = []; // { goalId, period, completedAt, xpEarned }
        // Completed goal IDs per period (for 7/10 bonus calc)
        this.completedGoalIds = {
            daily:   new Set(),
            weekly:  new Set(),
            monthly: new Set(),
        };
        // Streak tracking for consecutive completions
        this.dailyStreak = 0;   // Consecutive days with 7/10 daily goals completed
        this.weeklyStreak = 0;  // Consecutive weeks with 7/10 weekly goals completed
        
        // ── Daily Login Streak Tracking ──
        this.loginStreak = {
            count: 0,              // Current consecutive day login streak
            lastLoginDate: null,   // YYYY-MM-DD string of last login
            streakStartDate: null, // YYYY-MM-DD when current streak began
            totalLoginsThisMonth: 0, // Login count for current calendar month
            loginMonthYear: null,  // YYYY-MM string of current month
            totalLoginXPEarned: 0, // Total XP earned from logins this session
        };

        // ── Bind events ──
        this.bindEvents();
    }

    // ═══════════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION & EVENTS
    // ═══════════════════════════════════════════════════════════════════════════════════

    bindEvents() {
        const EventBus = _global.EventBus;
        if (!EventBus) return;

        // Day passed → reset daily goals
        EventBus.on(_global.GameEvents.DAY_PASSED, this.handleDayPassed, this);

        // Month passed → reset monthly goals (weekly resets handled by day check)
        EventBus.on(_global.GameEvents.MONTH_PASSED, this.handleMonthPassed, this);

        this.isInitialized = true;
        this.generateAllGoals();
    }

    // ═══════════════════════════════════════════════════════════════════════════════════
    // XP AWARDING (replaces direct Player._awardExperience calls)
    // ═══════════════════════════════════════════════════════════════════════════════════

    /**
     * Award XP to the player for a specific action.
     * All XP gains flow through this method.
     *
     * @param {string} source - XP source key (e.g. 'warAttack', 'addFriend', 'proposeTreaty')
     * @param {number} multiplier - Optional multiplier (e.g. number of units destroyed)
     * @param {object} context - Additional context for logging/events
     * @returns {number} Actual XP awarded
     */
    awardXP(source, multiplier = 1, context = {}) {
        const sourceDef = this.xpSources[source];
        if (!sourceDef) {
            if (typeof console !== 'undefined') console.warn(`XPGoalsSystem: Unknown XP source '${source}'`);
            return 0;
        }

        const nation = _global.Nation || (typeof globalThis !== 'undefined' ? globalThis.Nation : undefined);
        const player = _global.Player || (typeof globalThis !== 'undefined' ? globalThis.Player : undefined);
        if (!player) return 0;

        // Check daily max
        const today = this._getCurrentDayNumber();
        const key = `${source}_${today}`;
        this.playerXP.sourceMaxPerDay[key] = (this.playerXP.sourceMaxPerDay[key] || 0) + 1;
        if (this.playerXP.sourceMaxPerDay[key] > sourceDef.maxPerDay) {
            return 0; // Daily max reached
        }

        // Calculate base XP with level scaling
        const playerLevel = player.level || 1;
        const levelScale = 1 + (playerLevel * sourceDef.levelScaling);
        const baseXP = Math.floor(sourceDef.baseXP * levelScale * multiplier);

        // Apply diplomacy skill bonus (same as original Player logic)
        const diplomacyBonus = 1 + (player.getSkillValue('diplomacy') * 0.05);
        const finalXP = Math.floor(baseXP * diplomacyBonus);

        // Award via Player
        player._awardExperience(finalXP, source);

        // Track source count
        this.playerXP.sourceCounts[source] = (this.playerXP.sourceCounts[source] || 0) + 1;

        // Update goal progress
        this.updateGoalProgress(source, multiplier, context);

        // Emit event
        const EventBus = _global.EventBus;
        if (EventBus) {
            EventBus.emit('xp_gained', {
                source,
                amount: finalXP,
                multiplier,
                playerLevel,
                context,
            });
        }

        return finalXP;
    }

    // ═══════════════════════════════════════════════════════════════════════════════════
    // XP AWARDING CONVENIENCE METHODS
    // ═══════════════════════════════════════════════════════════════════════════════════

    awardWarAttack(multiplier = 1, context = {})  { return this.awardXP('warAttack', multiplier, context); }
    awardWarDefend(multiplier = 1, context = {})  { return this.awardXP('warDefend', multiplier, context); }
    awardWarWin(multiplier = 1, context = {})     { return this.awardXP('warWin', multiplier, context); }
    awardWarParticipate(multiplier = 1, context = {}) { return this.awardXP('warParticipate', multiplier, context); }
    awardDestroyUnits(multiplier = 1, context = {}) { return this.awardXP('destroyUnits', multiplier, context); }
    awardProposeTreaty(multiplier = 1, context = {}) { return this.awardXP('proposeTreaty', multiplier, context); }
    awardAcceptTreaty(multiplier = 1, context = {})  { return this.awardXP('acceptTreaty', multiplier, context); }
    awardRejectTreaty(multiplier = 1, context = {})  { return this.awardXP('rejectTreaty', multiplier, context); }

    // ── Treaty establishment XP awarding ──
    /** Award XP to the proposer when their treaty is accepted (higher XP than acceptor) */
    awardTreatyAcceptedProposer(treatyType, context = {}) { return this.awardXP(`treatyAccepted_${treatyType}`, 1, context); }

    /** Award XP to the acceptor when they accept a treaty (lower XP than proposer) */
    awardTreatyAcceptedAcceptor(treatyType, context = {}) { return this.awardXP(`treatyJoined_${treatyType}`, 1, context); }

    // ── Treaty cooldown tracking (28 days per pair per treaty type) ──
    /**
     * Check if a nation pair can receive treaty XP (28-day cooldown between any treaty types)
     * @param {string} entityA - nation ID or alliance ID
     * @param {string} entityB - nation ID or alliance ID
     * @param {number} now - current timestamp
     * @returns {boolean} true if XP can be awarded
     */
    canAwardTreatyXP(entityA, entityB, now) {
        if (!this.treatyCooldowns) this.treatyCooldowns = {};
        // Sort entities so the pair key is consistent regardless of order
        const [e1, e2] = [entityA, entityB].sort();
        const key = `${e1}:${e2}`;
        const lastTime = this.treatyCooldowns[key] || 0;
        const daysSince = (now - lastTime) / (24 * 60 * 60 * 1000);
        return daysSince >= 28;
    }

    /**
     * Record that treaty XP was awarded between two entities (starts 28-day cooldown)
     */
    recordTreatyXP(entityA, entityB, now) {
        if (!this.treatyCooldowns) this.treatyCooldowns = {};
        const [e1, e2] = [entityA, entityB].sort();
        const key = `${e1}:${e2}`;
        this.treatyCooldowns[key] = now;
    }

    /**
     * Get alliance members for XP distribution
     */
    getAllianceMembers(allianceId) {
        if (!_global.AllianceSystem) return [];
        const alliance = _global.AllianceSystem.getAlliance(allianceId);
        if (!alliance || !alliance.members) return [];
        return Object.keys(alliance.members);
    }

    // ── Alliance XP awarding (daily only) ──
    awardJoinAlliance(multiplier = 1, context = {}) { return this.awardXP('joinAlliance', multiplier, context); }
    awardMakeAlliance(multiplier = 1, context = {}) { return this.awardXP('makeAlliance', multiplier, context); }
    awardClaimTerritory(multiplier = 1, context = {}) { return this.awardXP('claimTerritory', multiplier, context); }


    // ── Building XP awarding ──
    awardBuildImprovement(multiplier = 1, context = {}) { return this.awardXP('buildImprovement', multiplier, context); }
    awardBuildProject(multiplier = 1, context = {}) { return this.awardXP('buildProject', multiplier, context); }
    awardBuildWonder(multiplier = 1, context = {}) { return this.awardXP('buildWonder', multiplier, context); }

    // ── Government/Religion XP awarding ──
    awardChangeGovernment(multiplier = 1, context = {}) { return this.awardXP('changeGovernment', multiplier, context); }
    awardChangeReligion(multiplier = 1, context = {}) { return this.awardXP('changeReligion', multiplier, context); }
    awardChangeNationalPet(multiplier = 1, context = {}) { return this.awardXP('changeNationalPet', multiplier, context); }
    awardChangeNationalFood(multiplier = 1, context = {}) { return this.awardXP('changeNationalFood', multiplier, context); }
    awardChangeNationalWater(multiplier = 1, context = {}) { return this.awardXP('changeNationalWater', multiplier, context); }
    awardSendAid(multiplier = 1, context = {}) { return this.awardXP('sendAid', multiplier, context); }
    awardReceiveAid(multiplier = 1, context = {}) { return this.awardXP('receiveAid', multiplier, context); }
    awardProposeTrade(multiplier = 1, context = {}) { return this.awardXP('proposeTrade', multiplier, context); }
    awardAcceptTrade(multiplier = 1, context = {}) { return this.awardXP('acceptTrade', multiplier, context); }
    awardRejectTrade(multiplier = 1, context = {}) { return this.awardXP('rejectTrade', multiplier, context); }

    // ── War damage XP awarding ──
    awardWarDamage(damage = 1, context = {}) { return this.awardXP('warDamage', damage, context); }

    // ── Sports XP awarding ──
    awardSportsWin(multiplier = 1, context = {}) { return this.awardXP('sportsWin', multiplier, context); }
    awardSportsSeasonWin(multiplier = 1, context = {}) { return this.awardXP('sportsSeasonWin', multiplier, context); }
    awardSportsWorldWin(multiplier = 1, context = {}) { return this.awardXP('sportsWorldWin', multiplier, context); }

    /**
     * Award XP for winning a tournament round.
     * Scales upward through the bracket — later rounds (finals) give more than early rounds.
     * @param {number} round - Current round number (1 = first bracket)
     * @param {number} totalRounds - Total rounds in the tournament
     * @param {object} context - Additional context
     * @returns {number} Actual XP awarded
     */
    awardSportsTournamentRound(round = 1, totalRounds = 1, context = {}) {
        // Round scaling: round 1 = 1.0x, final round = totalRounds multiplier
        // Each round gives progressively more XP, finals give the most
        const roundScale = Math.round(totalRounds * 0.5 + round * 0.5); // e.g. 4 rounds: r1=2.5, r2=3, r3=3.5, r4=4
        const contextMultiplier = Math.max(1, roundScale);
        return this.awardXP('sportsTournamentRound', contextMultiplier, { ...context, round, totalRounds });
    }

    // ── Forum motion voting XP awarding ──
    awardVoteColorMotion(multiplier = 1, context = {}) { return this.awardXP('voteColorMotion', multiplier, context); }
    awardVoteWorldMotion(multiplier = 1, context = {}) { return this.awardXP('voteWorldMotion', multiplier, context); }

    // ── Forum motion proposing XP awarding ──
    awardProposeColorMotion(multiplier = 1, context = {}) { return this.awardXP('proposeColorMotion', multiplier, context); }
    awardProposeWorldMotion(multiplier = 1, context = {}) { return this.awardXP('proposeWorldMotion', multiplier, context); }

    // ── Congress election XP awarding ──
    awardElectedCongress(multiplier = 1, context = {}) { return this.awardXP('electedCongress', multiplier, context); }

    // ── Economy XP awarding ──
    awardBuyLand(multiplier = 1, context = {}) { return this.awardXP('buyLand', multiplier, context); }
    awardBuyInfra(multiplier = 1, context = {}) { return this.awardXP('buyInfra', multiplier, context); }
    awardBuyTech(multiplier = 1, context = {}) { return this.awardXP('buyTech', multiplier, context); }
    awardBuyMissiles(multiplier = 1, context = {}) { return this.awardXP('buyMissiles', multiplier, context); }
    awardBuyNukes(multiplier = 1, context = {}) { return this.awardXP('buyNukes', multiplier, context); }
    awardBuyCurrency(multiplier = 1, context = {}) { return this.awardXP('buyCurrency', multiplier, context); }
    awardBuyResource(multiplier = 1, context = {}) { return this.awardXP('buyResource', multiplier, context); }
    awardBuyLotteryTicket(multiplier = 1, context = {}) { return this.awardXP('buyLotteryTicket', multiplier, context); }
    awardSellCurrency(multiplier = 1, context = {}) { return this.awardXP('sellCurrency', multiplier, context); }
    awardSellResource(multiplier = 1, context = {}) { return this.awardXP('sellResource', multiplier, context); }

    // ── Research XP awarding ──
    awardResearch(multiplier = 1, context = {}) { return this.awardXP('research', multiplier, context); }

    // ── Military training XP awarding ──
    awardTrainSoldiers(multiplier = 1, context = {}) { return this.awardXP('trainSoldiers', multiplier, context); }
    awardTrainTanks(multiplier = 1, context = {}) { return this.awardXP('trainTanks', multiplier, context); }
    awardTrainAircraft(multiplier = 1, context = {}) { return this.awardXP('trainAircraft', multiplier, context); }
    awardTrainShips(multiplier = 1, context = {}) { return this.awardXP('trainShips', multiplier, context); }

    // ── Sports betting & drafting XP awarding ──
    awardDraftHockeyPlayers(multiplier = 1, context = {}) { return this.awardXP('draftHockeyPlayers', multiplier, context); }
    awardDraftBasketballPlayers(multiplier = 1, context = {}) { return this.awardXP('draftBasketballPlayers', multiplier, context); }
    awardDraftSoccerPlayers(multiplier = 1, context = {}) { return this.awardXP('draftSoccerPlayers', multiplier, context); }
    awardDraftFootballPlayers(multiplier = 1, context = {}) { return this.awardXP('draftFootballPlayers', multiplier, context); }
    awardPlaceSportsBet(multiplier = 1, context = {}) { return this.awardXP('placeSportsBet', multiplier, context); }
    awardBetAmount(amount = 1, context = {}) { return this.awardXP('betAmount', amount, context); }
    awardTalkCitizen(multiplier = 1, context = {}) { return this.awardXP('talkCitizen', multiplier, context); }

    // ── Daily Login Streak XP awarding ──
    /**
     * Award daily login XP with streak bonuses.
     * Base: 50 XP per day.
     * Each consecutive day adds 50% more XP (compounding).
     * Streak resets at start of each calendar month.
     *
     * Formula: XP = 50 * (1 + (streakDay - 1) * 0.5)
     *   Day 1: 50 XP
     *   Day 2: 75 XP
     *   Day 3: 112.5 XP
     *   Day 7: 200 XP
     *   Day 30: 725 XP
     *
     * Also awards weekly streak bonus every 7 days and month-end bonus.
     * @param {object} context - Additional context (e.g., { timestamp })
     * @returns {object} { xpAwarded, streak, streakDay, dailyXP, streakBonus, weeklyBonus, monthEndBonus }
     */
    awardDailyLogin(multiplier = 1, context = {}) {
        const now = Date.now();
        const today = new Date(now);
        const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
        const todayYearMonth = todayStr.slice(0, 7); // YYYY-MM

        const player = _global.Player || (typeof globalThis !== 'undefined' ? globalThis.Player : undefined);
        if (!player) return { xpAwarded: 0, streak: 0, streakDay: 0, dailyXP: 0, streakBonus: 0, weeklyBonus: 0, monthEndBonus: 0 };

        // Detect month change - reset streak at start of each calendar month
        if (this.loginStreak.loginMonthYear !== todayYearMonth) {
            this.loginStreak.loginMonthYear = todayYearMonth;
            this.loginStreak.count = 0;
            this.loginStreak.totalLoginsThisMonth = 0;
            this.loginStreak.streakStartDate = todayStr;
        }

        // Check if already logged in today
        if (this.loginStreak.lastLoginDate === todayStr) {
            // Already logged in today, return existing streak info without awarding again
            return {
                xpAwarded: 0,
                streak: this.loginStreak.count,
                streakDay: this.loginStreak.count,
                dailyXP: 0,
                streakBonus: 0,
                weeklyBonus: 0,
                monthEndBonus: 0,
                alreadyLoggedIn: true,
            };
        }

        // Determine if consecutive day
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        if (this.loginStreak.lastLoginDate === yesterdayStr) {
            // Consecutive day - increment streak
            this.loginStreak.count += 1;
        } else if (this.loginStreak.lastLoginDate === todayStr) {
            // Already counted today
            return {
                xpAwarded: 0,
                streak: this.loginStreak.count,
                streakDay: this.loginStreak.count,
                dailyXP: 0,
                streakBonus: 0,
                weeklyBonus: 0,
                monthEndBonus: 0,
                alreadyLoggedIn: true,
            };
        } else {
            // Gap in login - reset streak to 1
            this.loginStreak.count = 1;
            this.loginStreak.streakStartDate = todayStr;
        }

        // Calculate daily XP: base 50 * (1 + (streakDay - 1) * 0.5)
        const streakDay = this.loginStreak.count;
        const baseXP = 50;
        const streakMultiplier = 1 + (streakDay - 1) * 0.5;
        const dailyXP = Math.floor(baseXP * streakMultiplier * multiplier);

        // Apply level scaling and diplomacy bonus (same as awardXP)
        const playerLevel = player.level || 1;
        const levelScale = 1 + (playerLevel * 0.01);
        const diplomacyBonus = 1 + (player.getSkillValue('diplomacy') * 0.05);
        const finalDailyXP = Math.floor(dailyXP * levelScale * diplomacyBonus);

        // Award the daily login XP
        player._awardExperience(finalDailyXP, 'dailyLogin');

        // Track streak stats
        this.loginStreak.lastLoginDate = todayStr;
        this.loginStreak.totalLoginsThisMonth += 1;
        this.loginStreak.totalLoginXPEarned += finalDailyXP;

        // Weekly streak bonus every 7 days
        let weeklyBonus = 0;
        if (streakDay % 7 === 0) {
            weeklyBonus = 2500 * Math.floor(streakDay / 7);
            if (player) {
                player._awardExperience(weeklyBonus, `Weekly login streak bonus (${streakDay} days)`);
            }
            EventBus.emit('login_streak_bonus', {
                type: 'weekly',
                streak: streakDay,
                xpEarned: weeklyBonus,
            });
        }

        // Month-end bonus - check if today is the last day of the month
        let monthEndBonus = 0;
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (tomorrow.getMonth() !== today.getMonth()) {
            // Today is the last day of the month
            monthEndBonus = 5000 * Math.floor(streakDay / 7);
            if (player) {
                player._awardExperience(monthEndBonus, `Month-end login streak bonus (${streakDay} days)`);
            }
            EventBus.emit('login_streak_bonus', {
                type: 'month_end',
                streak: streakDay,
                xpEarned: monthEndBonus,
            });
        }

        EventBus.emit('daily_login', {
            streak: streakDay,
            streakDay: streakDay,
            xpEarned: finalDailyXP,
            streakBonus: streakDay > 1 ? Math.floor(dailyXP * 0.5 * (streakDay - 1)) : 0,
            weeklyBonus,
            monthEndBonus,
        });

        return {
            xpAwarded: finalDailyXP,
            streak: this.loginStreak.count,
            streakDay: streakDay,
            dailyXP: finalDailyXP,
            streakBonus: streakDay > 1 ? Math.floor(dailyXP * 0.5 * (streakDay - 1)) : 0,
            weeklyBonus,
            monthEndBonus,
        };
    }

    /**
     * Get current login streak status without awarding XP
     */
    getLoginStreakStatus() {
        const now = Date.now();
        const today = new Date(now);
        const todayStr = today.toISOString().slice(0, 10);
        const todayYearMonth = todayStr.slice(0, 7);

        // Check if streak needs reset due to month change
        if (this.loginStreak.loginMonthYear !== todayYearMonth) {
            return {
                streak: 0,
                streakDay: 0,
                lastLoginDate: this.loginStreak.lastLoginDate,
                streakStartDate: null,
                totalLoginsThisMonth: 0,
                loginMonthYear: todayYearMonth,
                isLoggedInToday: false,
                nextDayXP: 50,
            };
        }

        const isLoggedInToday = this.loginStreak.lastLoginDate === todayStr;
        const nextDayXP = Math.floor(50 * (1 + (this.loginStreak.count) * 0.5));

        return {
            streak: this.loginStreak.count,
            streakDay: this.loginStreak.count,
            lastLoginDate: this.loginStreak.lastLoginDate,
            streakStartDate: this.loginStreak.streakStartDate,
            totalLoginsThisMonth: this.loginStreak.totalLoginsThisMonth,
            loginMonthYear: todayYearMonth,
            isLoggedInToday,
            nextDayXP,
            totalLoginXPEarned: this.loginStreak.totalLoginXPEarned,
        };
    }

    /**
     * Check if a new calendar month has started and reset streak if needed
     * Call this on each day pass / game refresh
     */
    checkMonthRollOver() {
        const now = Date.now();
        const today = new Date(now);
        const todayStr = today.toISOString().slice(0, 10);
        const todayYearMonth = todayStr.slice(0, 7);

        if (this.loginStreak.loginMonthYear !== todayYearMonth) {
            // New month - reset streak
            const previousStreak = this.loginStreak.count;
            this.loginStreak.count = 0;
            this.loginStreak.loginMonthYear = todayYearMonth;
            this.loginStreak.totalLoginsThisMonth = 0;
            this.loginStreak.streakStartDate = todayStr;
            this.loginStreak.lastLoginDate = null;

            EventBus.emit('login_streak_month_reset', {
                previousStreak,
                newMonth: todayYearMonth,
            });
        }
    }

    // ── Resource production XP awarding ──
    awardProduceRaw(multiplier = 1, context = {}) { return this.awardXP(`produceRaw_${context.resourceKey}`, multiplier, context); }
    awardProduceManufactured(multiplier = 1, context = {}) { return this.awardXP(`produceManufactured_${context.resourceKey}`, multiplier, context); }

    // Resource improvement key mappings (mirrors resource-system.js)
    _getProductionImprovementKey(resourceKey) {
        const map = {
            steel: 'steelMill', bronze: 'bronzeSmelter', lead: 'leadRefinery',
            aluminum: 'aluminumSmelter', copper: 'copperRefinery',
            uranium: 'uraniumEnrichmentPlant', gasoline: 'gasolineRefinery',
        };
        return map[resourceKey];
    }
    _getTransitionImprovementKey(resourceKey) {
        const map = {
            steel: 'steelFoundry', bronze: 'bronzeCasting', lead: 'leadCasting',
            aluminum: 'aluminumExtrusion', copper: 'copperDrawing',
            uranium: 'uraniumFuelFabrication', gasoline: 'gasolineBlending',
        };
        return map[resourceKey];
    }

    // ════════════════════════════════════════════════════════════════════════════════════
    // GOAL MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════════

    /**
     * Generate all goals for all periods
     */
    generateAllGoals() {
        this.generateGoalsForPeriod('daily');
        this.generateGoalsForPeriod('weekly');
        this.generateGoalsForPeriod('monthly');
    }

    /**
     * Get expiry time for a period
     */
    _getExpiryTime(period, now) {
        if (period === 'daily') {
            // End of current UTC day
            const d = new Date(now);
            d.setUTCHours(23, 59, 59, 999);
            return d.getTime();
        }
        if (period === 'weekly') {
            // End of current week (Sunday)
            const d = new Date(now);
            const day = d.getUTCDay(); // 0 = Sunday
            d.setUTCHours(23, 59, 59, 999);
            d.setUTCDate(d.getUTCDate() + (7 - day));
            return d.getTime();
        }
        if (period === 'monthly') {
            // End of current month
            const d = new Date(now);
            d.setUTCMonth(d.getUTCMonth() + 1, 0);
            d.setUTCHours(23, 59, 59, 999);
            return d.getTime();
        }
        return now + 86400000;
    }

    /**
     * Get current day number for daily max tracking
     */
    _getCurrentDayNumber() {
        return Math.floor(Date.now() / 86400000);
    }

    /**
     * Update goal progress based on an action
     */
    updateGoalProgress(source, multiplier = 1, context = {}) {
        const player = _global.Player || (typeof globalThis !== 'undefined' ? globalThis.Player : undefined);
        const playerLevel = player ? player.level : 1;

        // Map XP sources to goal types
        const sourceToGoalType = {
            warAttack: 'attack',
            warDefend: 'defend',
            warWin: 'win',
            warParticipate: 'attack', // participation counts as attack for goals
            proposeTreaty: 'propose', // Special: matches any propose* goal type
            acceptTreaty: 'accept', // Direct accept API (legacy)
            rejectTreaty: 'reject',
            // Treaty acceptance — all treaty types map to accept goal
            treatyAccepted_protectorate: 'accept',
            treatyAccepted_extension: 'accept',
            treatyAccepted_mutualDefense: 'accept',
            treatyAccepted_mutualAggression: 'accept',
            treatyAccepted_optionalDefense: 'accept',
            treatyAccepted_optionalAggression: 'accept',
            treatyAccepted_intelligence: 'accept',
            treatyAccepted_peace: 'accept',
            treatyJoined_protectorate: 'accept',
            treatyJoined_extension: 'accept',
            treatyJoined_mutualDefense: 'accept',
            treatyJoined_mutualAggression: 'accept',
            treatyJoined_optionalDefense: 'accept',
            treatyJoined_optionalAggression: 'accept',
            treatyJoined_intelligence: 'accept',
            treatyJoined_peace: 'accept',
            addFriend: 'friend',
            addBestFriend: 'bestFriend',
            addFoe: 'foe',
            addNemesis: 'nemesis',
            research: 'research',
            trainSoldiers: 'trainSoldiers',
            trainTanks: 'trainTanks',
            trainAircraft: 'trainAircraft',
            trainShips: 'trainShips',
            buyMissiles: 'buyMissiles',
            buyNukes: 'buyNukes',
            // Sports — all sports wins count toward 'win' goals
            sportsWin: 'win',
            sportsSeasonWin: 'win',
            sportsWorldWin: 'win',
            sportsTournamentRound: 'win',
            // Alliance — daily only
            joinAlliance: 'joinAlliance',
            makeAlliance: 'makeAlliance',
            // Building
            buildImprovement: 'buildImprovement',
            destroyImprovement: 'destroyImprovement',
            buildProject: 'buildProject',
            buildWonder: 'buildWonder',
            // Government/Religion
            changeGovernment: 'changeGovernment',
            changeReligion: 'changeReligion',
            changeNationalPet: 'changeNationalPet',
            changeNationalFood: 'changeNationalFood',
            changeNationalWater: 'changeNationalWater',
            sendAid: 'sendAid',
            receiveAid: 'receiveAid',
            proposeTrade: 'proposeTrade',
            acceptTrade: 'acceptTrade',
            rejectTrade: 'rejectTrade',
            // War damage
            warDamage: 'warDamage',
            // Forum motions — voting and proposing
            voteColorMotion: 'voteColorMotion',
            voteWorldMotion: 'voteWorldMotion',
            proposeColorMotion: 'proposeColorMotion',
            proposeWorldMotion: 'proposeWorldMotion',
            // Congress election
            electedCongress: 'electedCongress',
            // Economy — buying land/infra/tech/currency/resources
            buyLand: 'buyLand',
            buyInfra: 'buyInfra',
            buyTech: 'buyTech',
            buyCurrency: 'buyCurrency',
            buyResource: 'buyResource',
            buyLotteryTicket: 'buyLotteryTicket',
            sellCurrency: 'sellCurrency',
            sellResource: 'sellResource',
            // Sports betting & drafting
            draftHockeyPlayers: 'draftHockeyPlayers',
            draftBasketballPlayers: 'draftBasketballPlayers',
            draftSoccerPlayers: 'draftSoccerPlayers',
            draftFootballPlayers: 'draftFootballPlayers',
            placeSportsBet: 'placeSportsBet',
            betAmount: 'betAmount',
            // Resource production — raw (per mineral)
            produceRaw_steel:        'produceRaw_steel',
            produceRaw_bronze:       'produceRaw_bronze',
            produceRaw_lead:         'produceRaw_lead',
            produceRaw_aluminum:     'produceRaw_aluminum',
            produceRaw_copper:       'produceRaw_copper',
            produceRaw_uranium:      'produceRaw_uranium',
            produceRaw_gasoline:     'produceRaw_gasoline',
            // Resource production — manufactured (per mineral)
            produceManufactured_steel:        'produceManufactured_steel',
            produceManufactured_bronze:       'produceManufactured_bronze',
            produceManufactured_lead:         'produceManufactured_lead',
            produceManufactured_aluminum:     'produceManufactured_aluminum',
            produceManufactured_copper:       'produceManufactured_copper',
            produceManufactured_uranium:      'produceManufactured_uranium',
            produceManufactured_gasoline:     'produceManufactured_gasoline',
        };

        const goalType = sourceToGoalType[source];
        if (!goalType) return;

        // Update all active goals across all periods
        for (const period of ['daily', 'weekly', 'monthly']) {
            const goals = this.goals[period];
            if (!goals) continue;

            for (const goal of goals) {
                if (goal.completed || goal.locked) continue;
                // Special case: proposeTreaty matches propose* goal types,
                // optionally filtered by specific treaty type from context
                if (goalType === 'propose') {
                    if (!goal.type.startsWith('propose')) continue;
                    if (context.treatyType && goal.type !== `propose${context.treatyType.charAt(0).toUpperCase() + context.treatyType.slice(1)}`) continue;
                } else if (goal.type !== goalType) continue;

                // Check level requirement (might have been unlocked since creation)
                if (goal.levelRequirement > playerLevel) continue;

                goal.current = Math.min(goal.target, goal.current + multiplier);

                if (goal.current >= goal.target && !goal.completed) {
                    this.completeGoal(goal, period);
                }
            }
        }
    }

    /**
     * Complete a goal and award XP
     */
    completeGoal(goal, period) {
        goal.completed = true;

        const player = _global.Player || (typeof globalThis !== 'undefined' ? globalThis.Player : undefined);
        if (player) {
            player._awardExperience(goal.xpReward, `Goal: ${goal.title}`);
        }

        this.completedGoals.push({
            goalId: goal.id,
            templateId: goal.templateId,
            period,
            title: goal.title,
            xpEarned: goal.xpReward,
            completedAt: Date.now(),
        });

        // Track completed goal ID per period for bonus calculation
        if (this.completedGoalIds[period]) {
            this.completedGoalIds[period].add(goal.id);
        }

        EventBus.emit('goal_completed', {
            goal,
            period,
            xpEarned: goal.xpReward,
        });

        // Check if completion bonus applies (7 of 10 goals completed)
        this.checkCompletionBonus(period);
    }

    /**
     * Check if completion bonus applies (7/10 goals completed)
     * Awards bonus XP: Daily=500, Weekly=2500, Monthly=10000
     * Also awards streak bonuses for consecutive completion streaks
     */
    checkCompletionBonus(period) {
        const goals = this.goals[period] || [];
        const completedCount = this.completedGoalIds[period] ? this.completedGoalIds[period].size : 0;

        // Only award bonus when hitting exactly 7 (to avoid double-awarding)
        if (completedCount !== 7) return 0;

        const bonusAmounts = { daily: 500, weekly: 2500, monthly: 10000 };
        const bonusXP = bonusAmounts[period] || 0;

        if (bonusXP > 0) {
            const player = _global.Player || (typeof globalThis !== 'undefined' ? globalThis.Player : undefined);
            if (player) {
                player._awardExperience(bonusXP, `Goal completion bonus: ${period}`);
            }

            EventBus.emit('goal_completion_bonus', {
                period,
                completedCount,
                xpEarned: bonusXP,
            });
        }

        // ── Streak bonuses ──
        // Daily streak: incremented when 7/10 daily goals completed in a day
        // Weekly streak: incremented when 7/10 weekly goals completed in a week
        if (period === 'daily') {
            this.dailyStreak += 1;
            const dailyStreakBonus = 500 * this.dailyStreak; // 500, 1000, 1500, ...
            const player = _global.Player || (typeof globalThis !== 'undefined' ? globalThis.Player : undefined);
            if (player && dailyStreakBonus > 0) {
                player._awardExperience(dailyStreakBonus, `Daily streak bonus (streak #${this.dailyStreak})`);
                EventBus.emit('goal_completion_bonus', {
                    period: 'daily',
                    streak: this.dailyStreak,
                    xpEarned: dailyStreakBonus,
                    type: 'streak',
                });
            }
        } else if (period === 'weekly') {
            this.weeklyStreak += 1;
            const weeklyStreakBonus = 2500 * this.weeklyStreak; // 2500, 5000, 7500, ...
            const player = _global.Player || (typeof globalThis !== 'undefined' ? globalThis.Player : undefined);
            if (player && weeklyStreakBonus > 0) {
                player._awardExperience(weeklyStreakBonus, `Weekly streak bonus (streak #${this.weeklyStreak})`);
                EventBus.emit('goal_completion_bonus', {
                    period: 'weekly',
                    streak: this.weeklyStreak,
                    xpEarned: weeklyStreakBonus,
                    type: 'streak',
                });
            }
        }

        return bonusXP;
    }

    /**
     * Check if daily/weekly/monthly goals need to be regenerated
     */
    handleDayPassed() {
        const today = this._getCurrentDayNumber();

        // Reset daily goals every day
        if (!this.lastDailyReset || today !== this.lastDailyReset) {
            this.lastDailyReset = today;
            this.generateGoalsForPeriod('daily');
            // Reset daily source max counters
            this.playerXP.sourceMaxPerDay = {};
            // Reset completed goal tracking for new day
            if (this.completedGoalIds.daily) this.completedGoalIds.daily.clear();
        }

        // Reset weekly goals every 7 days
        const now = Date.now();
        if (!this.lastWeeklyReset || now - this.lastWeeklyReset >= 7 * 86400000) {
            this.lastWeeklyReset = now;
            this.generateGoalsForPeriod('weekly');
            // Reset daily streak when weekly goals reset
            this.dailyStreak = 0;
            // Reset completed goal tracking for new week
            if (this.completedGoalIds.weekly) this.completedGoalIds.weekly.clear();
            EventBus.emit('daily_streak_reset', {
                streak: 0,
                reason: 'weekly_reset',
            });
        }
    }

    handleMonthPassed() {
        const now = Date.now();
        if (!this.lastMonthlyReset || now - this.lastMonthlyReset >= 30 * 86400000) {
            this.lastMonthlyReset = now;
            this.generateGoalsForPeriod('monthly');
            // Reset weekly streak when monthly goals reset
            this.weeklyStreak = 0;
            // Reset completed goal tracking for new month
            if (this.completedGoalIds.monthly) this.completedGoalIds.monthly.clear();
            EventBus.emit('weekly_streak_reset', {
                streak: 0,
                reason: 'monthly_reset',
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════════
    // GOAL REFRESH (with cost)
    // ═══════════════════════════════════════════════════════════════════════════════════

    /**
     * Refresh goals for a period (re-rolls all goals).
     * First refresh is free, subsequent ones cost money with compounding multiplier.
     *
     * @param {string} period - 'daily', 'weekly', or 'monthly'
     * @returns {object} { success: boolean, cost: number, reason?: string }
     */
    refreshGoals(period) {
        const periodData = this.refreshCounts[period];
        if (periodData === undefined) return { success: false, reason: 'Invalid period' };

        const nation = _global.Nation || (typeof globalThis !== 'undefined' ? globalThis.Nation : undefined);
        if (!nation) return { success: false, reason: 'No nation found' };

        // Base costs per period
        const baseCosts = { daily: 50000, weekly: 250000, monthly: 1000000 };
        const baseCost = baseCosts[period] || 0;

        // Calculate cost: baseCost * 2^(refreshCount)
        const cost = Math.floor(baseCost * Math.pow(2, periodData.count));

        // Check affordability
        const nationMoney = nation.money || 0;
        if (nationMoney < cost) {
            return { success: false, reason: `Insufficient funds. Cost: $${cost.toLocaleString()}, Have: $${nationMoney.toLocaleString()}` };
        }

        // Deduct cost
        nation.money -= cost;

        // Regenerate goals
        this.generateGoalsForPeriod(period);

        // Increment refresh count
        this.refreshCounts[period] = periodData.count + 1;

        EventBus.emit('goals_refreshed', {
            period,
            cost,
            newCount: this.refreshCounts[period],
        });

        return { success: true, cost };
    }

    /**
     * Get refresh cost for a period without actually refreshing
     */
    getRefreshCost(period) {
        const periodData = this.refreshCounts[period];
        if (periodData === undefined) return 0;
        const baseCosts = { daily: 50000, weekly: 250000, monthly: 1000000 };
        return Math.floor(baseCosts[period] * Math.pow(2, periodData.count));
    }

    // ═══════════════════════════════════════════════════════════════════════════════════
    // QUERY METHODS
    // ═══════════════════════════════════════════════════════════════════════════════════

    /**
     * Generate goals for a specific period
     *
     * Always includes auto-assigned goals:
     * - Daily: 2 relationship goals (friend/foe/bestFriend/nemesis) if slots available
     * - Monthly: Build a Wonder, Change Government, Change Religion
     *
     * Remaining slots filled with random selection from eligible templates.
     */
    generateGoalsForPeriod(period) {
        const templates = this.goalTemplates[period];
        if (!templates) return;

        const player = _global.Player || (typeof globalThis !== 'undefined' ? globalThis.Player : undefined);
        const playerLevel = player ? player.level : 1;
        const nation = _global.Nation || (typeof globalThis !== 'undefined' ? globalThis.Nation : undefined);

        // Filter templates by level requirement
        let eligible = templates.filter(t => t.levelReq <= playerLevel);

        // Filter based on nation availability
        if (nation) {
            const rel = nation.diplomaticRelations || {};
            const maxFriends = rel.maxFriends || 0;
            const maxFoes = rel.maxFoes || 0;
            const currentFriends = rel.friends ? rel.friends.length : 0;
            const currentFoes = rel.foes ? rel.foes.length : 0;
            const hasBestFriend = !!rel.bestFriend;
            const hasNemesis = !!rel.nemesis;
            const inAlliance = !!nation.allianceId;

            // Check alliance ability (through project or wonder or easter egg)
            const canMakeAlliance = nation.projects?.officeOfRelationships ||
                nation.wonders?.allianceHeadquarters ||
                nation.motionModifiers?.allianceEasterEgg ||
                false;

            const filtered = eligible.filter(t => {
                // Relationship goals: only if empty slot available
                if (t.category === 'relationship') {
                    if (t.type === 'friend' && currentFriends >= maxFriends) return false;
                    if (t.type === 'foe' && currentFoes >= maxFoes) return false;
                    if (t.type === 'bestFriend' && hasBestFriend) return false;
                    if (t.type === 'nemesis' && hasNemesis) return false;
                }
                // Alliance goals: only if not in alliance, and for makeAlliance must have ability
                if (t.category === 'alliance') {
                    if (inAlliance) return false;
                    if (t.type === 'makeAlliance' && !canMakeAlliance) return false;
                }
                // Treaty propose goals: only if nation has Foreign Affairs Office
                if (t.category === 'treaty' && t.type.startsWith('propose')) {
                    if (!nation.improvements?.foreignAffairsOffice) return false;
                }
                // Resource production goals: only if nation has the required improvement
                if (t.category === 'resource') {
                    const resourceKey = t.resourceKey;
                    if (!resourceKey) return false;
                    const nationImprovements = nation.improvements || {};
                    const productionMap = {
                        steel: 'steelMill', bronze: 'bronzeSmelter', lead: 'leadRefinery',
                        aluminum: 'aluminumSmelter', copper: 'copperRefinery',
                        uranium: 'uraniumEnrichmentPlant', gasoline: 'gasolineRefinery',
                    };
                    const transitionMap = {
                        steel: 'steelFoundry', bronze: 'bronzeCasting', lead: 'leadCasting',
                        aluminum: 'aluminumExtrusion', copper: 'copperDrawing',
                        uranium: 'uraniumFuelFabrication', gasoline: 'gasolineBlending',
                    };
                    if (t.type.startsWith('produceRaw_')) {
                        const prodKey = productionMap[resourceKey];
                        if (!nationImprovements[prodKey]) return false;
                    }
                    if (t.type.startsWith('produceManufactured_')) {
                        const transKey = transitionMap[resourceKey];
                        if (!nationImprovements[transKey]) return false;
                    }
                }
                // Sports goals: require at least 1 team; draft goals only for sports owned
                if (t.category === 'sports') {
                    const nationTeams = nation.sportsTeams || {};
                    const teamCount = Object.keys(nationTeams).length;
                    if (teamCount === 0) return false; // No teams at all
                    if (t.type.startsWith('draft')) {
                        const sport = t.type.replace('draft', '').toLowerCase();
                        if (!nationTeams[sport]) return false; // Don't have this team type
                    }
                }
                return true;
            });

            eligible.length = 0;
            filtered.forEach(t => eligible.push(t));
        }

        if (period === 'daily' && nation) {
            // ── Daily: Auto-select 2 relationship goals if slots available ──
            const rel = nation.diplomaticRelations || {};
            const maxFriends = rel.maxFriends || 0;
            const maxFoes = rel.maxFoes || 0;
            const currentFriends = rel.friends ? rel.friends.length : 0;
            const currentFoes = rel.foes ? rel.foes.length : 0;
            const hasBestFriend = !!rel.bestFriend;
            const hasNemesis = !!rel.nemesis;

            const relationshipTypes = ['friend', 'foe', 'bestFriend', 'nemesis'];
            const availableTypes = [];

            if (currentFriends < maxFriends) availableTypes.push('friend');
            if (currentFoes < maxFoes) availableTypes.push('foe');
            if (!hasBestFriend) availableTypes.push('bestFriend');
            if (!hasNemesis) availableTypes.push('nemesis');

            // Select exactly 2 relationship types (or fewer if fewer available)
            const selectedTypes = availableTypes.slice(0, 2);

            // Filter eligible to only include selected relationship types for daily
            const relationshipEligible = eligible.filter(t =>
                t.category === 'relationship' && selectedTypes.includes(t.type)
            );
            const nonRelationshipEligible = eligible.filter(t => t.category !== 'relationship');

            // Take up to 2 relationship goals
            const relationshipGoals = relationshipEligible.slice(0, 2);
            const remainingSlots = 10 - relationshipGoals.length;

            // Fill remaining slots with non-relationship types
            const shuffledNonRel = [...nonRelationshipEligible].sort(() => Math.random() - 0.5);
            const selectedNonRel = shuffledNonRel.slice(0, remainingSlots);

            const selected = [...relationshipGoals, ...selectedNonRel];
            const goals = [];
            const now = Date.now();
            const expiry = this._getExpiryTime(period, now);

            for (let i = 0; i < selected.length; i++) {
                const t = selected[i];
                let targetValue;
                if (t.targetMin !== undefined && t.targetMax !== undefined) {
                    if (t.isPercentage) {
                        const percent = Math.random() * (t.targetMax - t.targetMin) + t.targetMin;
                        targetValue = Math.floor(nation.money * (percent / 100));
                    } else {
                        targetValue = Math.floor(Math.random() * (t.targetMax - t.targetMin + 1)) + t.targetMin;
                    }
                } else {
                    targetValue = t.target;
                }
                goals.push({
                    id: `${t.id}_${now}_${i}`,
                    templateId: t.id,
                    category: t.category,
                    type: t.type,
                    title: t.title,
                    description: t.description,
                    target: targetValue,
                    current: 0,
                    xpReward: Math.floor(t.xpReward * (1 + (playerLevel * 0.05))),
                    completed: false,
                    locked: t.levelReq > playerLevel,
                    levelRequirement: t.levelReq,
                    period,
                    createdAt: now,
                    expiresAt: expiry,
                });
            }

            this.goals[period] = goals;
            return;
        }

        if (period === 'monthly' && nation) {
            // ── Monthly: Always include build_wonder, changeGovernment, changeReligion ──
            const autoSelectTypes = ['buildWonder', 'changeGovernment', 'changeReligion'];
            const autoSelectEligible = eligible.filter(t =>
                t.category === 'building' && t.type === 'buildWonder' ||
                t.category === 'government' && t.type === 'changeGovernment' ||
                t.category === 'religion' && t.type === 'changeReligion'
            );

            const nonAutoEligible = eligible.filter(t =>
                !(t.category === 'building' && t.type === 'buildWonder') &&
                !(t.category === 'government' && t.type === 'changeGovernment') &&
                !(t.category === 'religion' && t.type === 'changeReligion')
            );

            const autoSelected = autoSelectEligible.slice(0, 3);
            const remainingSlots = 10 - autoSelected.length;

            // Fill remaining slots with random selection from remaining eligible
            const shuffledNonAuto = [...nonAutoEligible].sort(() => Math.random() - 0.5);
            const selectedNonAuto = shuffledNonAuto.slice(0, remainingSlots);

            const selected = [...autoSelected, ...selectedNonAuto];
            const goals = [];
            const now = Date.now();
            const expiry = this._getExpiryTime(period, now);

            for (let i = 0; i < selected.length; i++) {
                const t = selected[i];
                let targetValue;
                if (t.targetMin !== undefined && t.targetMax !== undefined) {
                    if (t.isPercentage) {
                        const percent = Math.random() * (t.targetMax - t.targetMin) + t.targetMin;
                        targetValue = Math.floor(nation.money * (percent / 100));
                    } else {
                        targetValue = Math.floor(Math.random() * (t.targetMax - t.targetMin + 1)) + t.targetMin;
                    }
                } else {
                    targetValue = t.target;
                }
                goals.push({
                    id: `${t.id}_${now}_${i}`,
                    templateId: t.id,
                    category: t.category,
                    type: t.type,
                    title: t.title,
                    description: t.description,
                    target: targetValue,
                    current: 0,
                    xpReward: Math.floor(t.xpReward * (1 + (playerLevel * 0.05))),
                    completed: false,
                    locked: t.levelReq > playerLevel,
                    levelRequirement: t.levelReq,
                    period,
                    createdAt: now,
                    expiresAt: expiry,
                });
            }

            this.goals[period] = goals;
            return;
        }

        // ── Other periods: Random selection from eligible templates ──
        const shuffled = [...eligible].sort(() => Math.random() - 0.5);
        const count = Math.min(10, shuffled.length);

        const goals = [];
        const now = Date.now();
        const expiry = this._getExpiryTime(period, now);

        for (let i = 0; i < count; i++) {
            const t = shuffled[i];
            let targetValue;
            if (t.targetMin !== undefined && t.targetMax !== undefined) {
                if (t.isPercentage) {
                    const percent = Math.random() * (t.targetMax - t.targetMin) + t.targetMin;
                    targetValue = Math.floor(nation.money * (percent / 100));
                } else {
                    targetValue = Math.floor(Math.random() * (t.targetMax - t.targetMin + 1)) + t.targetMin;
                }
            } else {
                targetValue = t.target;
            }
            goals.push({
                id: `${t.id}_${now}_${i}`,
                templateId: t.id,
                category: t.category,
                type: t.type,
                title: t.title,
                description: t.description,
                target: targetValue,
                current: 0,
                xpReward: Math.floor(t.xpReward * (1 + (playerLevel * 0.05))),
                completed: false,
                locked: t.levelReq > playerLevel,
                levelRequirement: t.levelReq,
                period,
                createdAt: now,
                expiresAt: expiry,
            });
        }

        this.goals[period] = goals;
    }

    /**
     * Get completed goals
     */
    getCompletedGoals() {
        return this.completedGoals;
    }

    /**
     * Get goal progress percentage (0-1)
     */
    getGoalProgress(goal) {
        if (goal.completed) return 1;
        return Math.min(1, goal.current / goal.target);
    }

    /**
     * Get total XP earned from completed goals
     */
    getTotalGoalXP() {
        return this.completedGoals.reduce((sum, g) => sum + g.xpEarned, 0);
    }

    /**
     * Check if a goal type is locked for the player
     */
    isGoalLocked(templateId) {
        const template = [...this.goalTemplates.daily, ...this.goalTemplates.weekly, ...this.goalTemplates.monthly]
            .find(t => t.id === templateId);
        if (!template) return false;

        const player = _global.Player || (typeof globalThis !== 'undefined' ? globalThis.Player : undefined);
        const playerLevel = player ? player.level : 1;
        return template.levelReq > playerLevel;
    }

    // ═══════════════════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════════════

    serialize() {
        return {
            playerXP: this.playerXP,
            goals: this.goals,
            completedGoals: this.completedGoals,
            completedGoalIds: {
                daily: Array.from(this.completedGoalIds.daily || []),
                weekly: Array.from(this.completedGoalIds.weekly || []),
                monthly: Array.from(this.completedGoalIds.monthly || []),
            },
            refreshCounts: this.refreshCounts,
            dailyStreak: this.dailyStreak,
            weeklyStreak: this.weeklyStreak,
            loginStreak: this.loginStreak,
            lastDailyReset: this.lastDailyReset,
            lastWeeklyReset: this.lastWeeklyReset,
            lastMonthlyReset: this.lastMonthlyReset,
        };
    }

    static deserialize(data) {
        const system = new XPGoalsSystem();
        if (data.playerXP) system.playerXP = data.playerXP;
        if (data.goals) system.goals = data.goals;
        if (data.completedGoals) system.completedGoals = data.completedGoals;
        if (data.completedGoalIds) {
            system.completedGoalIds = {
                daily: new Set(data.completedGoalIds.daily || []),
                weekly: new Set(data.completedGoalIds.weekly || []),
                monthly: new Set(data.completedGoalIds.monthly || []),
            };
        }
        if (data.refreshCounts) system.refreshCounts = data.refreshCounts;
        if (data.dailyStreak !== undefined) system.dailyStreak = data.dailyStreak;
        if (data.weeklyStreak !== undefined) system.weeklyStreak = data.weeklyStreak;
        if (data.loginStreak) system.loginStreak = data.loginStreak;
        if (data.lastDailyReset) system.lastDailyReset = data.lastDailyReset;
        if (data.lastWeeklyReset) system.lastWeeklyReset = data.lastWeeklyReset;
        if (data.lastMonthlyReset) system.lastMonthlyReset = data.lastMonthlyReset;
        return system;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    _global.XPGoalsSystem = new XPGoalsSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XPGoalsSystem;
}