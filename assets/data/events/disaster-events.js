/**
 * Disaster Events Data - 50 Nation-Level Disasters
 * Dominion Wars - Nation Building Strategy Game
 *
 * 50 disasters across 4 categories: natural (18), religious (12), fictional (12), war (8).
 * These are WORLD events that auto-apply to the player's nation (no player choices).
 * All disasters have NO positive outcome.
 *
 * Effects: Disease, Happiness, Pollution, Environment, Crime, Infra Destroyed,
 *          Tech Destroyed, Population Killed.
 * When at war: Soldiers Killed, Tanks Destroyed, Aircraft Destroyed, Ships Destroyed.
 *
 * Population kill flow: Disaster Type -> Chance Roll -> Demographic Roll -> Kill Roll.
 *   Chance Roll: does the disaster kill anyone? (chanceKillPopulation)
 *   Demographic Roll: which demographic group is affected? (randomly pulled)
 *   Kill Roll: how many from that group? (populationKilledPercent range)
 *
 * Happiness penalty is only applied if population or military units are destroyed.
 *
 * Religious disasters: at least one per religion (12 religions total).
 *
 * Placeholders: {nation}
 */

var DisasterEvents = {
    // ══════════════════════════════════════════════════════════════════════════════
    // NATURAL DISASTERS (18)
    // ══════════════════════════════════════════════════════════════════════════════
    natural: [
        {
            id: 'disaster_wildfire',
            name: 'Wildfire',
            description: 'A wildfire sweeps through {nation}, burning infrastructure and land.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 15,
                pollutionAdded: 20,
                chanceDestroyInfra: 0.60,
                infraDestroyedPercent: { min: 5, max: 15 },
                chanceKillPopulation: 0.40,
                populationKilledPercent: { min: 1, max: 4 },
                diseaseAdded: 0,
                happinessPenalty: 8,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_solar_flare',
            name: 'Solar Flare',
            description: 'A massive solar flare knocks out {nation}\'s technology grid.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0,
                populationKilledPercent: { min: 0, max: 0 },
                diseaseAdded: 0,
                happinessPenalty: 0,
                crimeAdded: 0,
                chanceDestroyTech: 0.90,
                techDestroyedPercent: { min: 10, max: 30 }
            }
        },
        {
            id: 'disaster_tornado',
            name: 'Tornado',
            description: 'A tornado tears through {nation}, destroying infrastructure at random.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 5,
                pollutionAdded: 5,
                chanceDestroyInfra: 0.80,
                infraDestroyedPercent: { min: 10, max: 25 },
                chanceKillPopulation: 0.30,
                populationKilledPercent: { min: 1, max: 3 },
                diseaseAdded: 0,
                happinessPenalty: 6,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_earthquake',
            name: 'Earthquake',
            description: 'A powerful earthquake strikes {nation}, collapsing buildings and roads.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 10,
                pollutionAdded: 10,
                chanceDestroyInfra: 0.85,
                infraDestroyedPercent: { min: 15, max: 30 },
                chanceKillPopulation: 0.50,
                populationKilledPercent: { min: 2, max: 6 },
                diseaseAdded: 5,
                happinessPenalty: 10,
                crimeAdded: 5,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_hurricane',
            name: 'Hurricane',
            description: 'A hurricane slams into {nation}, flooding coasts and wrecking infrastructure.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 10,
                pollutionAdded: 15,
                chanceDestroyInfra: 0.75,
                infraDestroyedPercent: { min: 10, max: 20 },
                chanceKillPopulation: 0.35,
                populationKilledPercent: { min: 1, max: 4 },
                diseaseAdded: 8,
                happinessPenalty: 8,
                crimeAdded: 3,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_flood',
            name: 'Flood',
            description: 'Rising floodwaters inundate {nation}, spreading waterborne disease.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 8,
                pollutionAdded: 12,
                chanceDestroyInfra: 0.50,
                infraDestroyedPercent: { min: 5, max: 12 },
                chanceKillPopulation: 0.25,
                populationKilledPercent: { min: 1, max: 3 },
                diseaseAdded: 15,
                happinessPenalty: 6,
                crimeAdded: 2,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_volcano',
            name: 'Volcanic Eruption',
            description: 'A volcano erupts near {nation}, blanketing the region in ash and lava.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 25,
                pollutionAdded: 30,
                chanceDestroyInfra: 0.55,
                infraDestroyedPercent: { min: 8, max: 18 },
                chanceKillPopulation: 0.45,
                populationKilledPercent: { min: 2, max: 5 },
                diseaseAdded: 3,
                happinessPenalty: 12,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_blizzard',
            name: 'Blizzard',
            description: 'A crippling blizzard freezes {nation}, halting all activity.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 5,
                pollutionAdded: 0,
                chanceDestroyInfra: 0.30,
                infraDestroyedPercent: { min: 3, max: 8 },
                chanceKillPopulation: 0.35,
                populationKilledPercent: { min: 1, max: 3 },
                diseaseAdded: 5,
                happinessPenalty: 7,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_heatwave',
            name: 'Heatwave',
            description: 'An extreme heatwave bakes {nation}, straining infrastructure and health.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 10,
                pollutionAdded: 15,
                chanceDestroyInfra: 0.20,
                infraDestroyedPercent: { min: 2, max: 5 },
                chanceKillPopulation: 0.30,
                populationKilledPercent: { min: 1, max: 3 },
                diseaseAdded: 8,
                happinessPenalty: 6,
                crimeAdded: 4,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_drought',
            name: 'Drought',
            description: 'A prolonged drought parches {nation}, damaging land and environment.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 20,
                pollutionAdded: 0,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0.20,
                populationKilledPercent: { min: 1, max: 2 },
                diseaseAdded: 3,
                happinessPenalty: 5,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_tsunami',
            name: 'Tsunami',
            description: 'A tsunami crashes into {nation}\'s coast, sweeping away everything in its path.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 15,
                pollutionAdded: 20,
                chanceDestroyInfra: 0.70,
                infraDestroyedPercent: { min: 12, max: 22 },
                chanceKillPopulation: 0.55,
                populationKilledPercent: { min: 2, max: 6 },
                diseaseAdded: 10,
                happinessPenalty: 12,
                crimeAdded: 4,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_lightning_strike',
            name: 'Lightning Strike',
            description: 'A massive lightning strike fries {nation}\'s electrical systems.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0.10,
                populationKilledPercent: { min: 0, max: 1 },
                diseaseAdded: 0,
                happinessPenalty: 3,
                crimeAdded: 0,
                chanceDestroyTech: 0.70,
                techDestroyedPercent: { min: 5, max: 15 }
            }
        },
        {
            id: 'disaster_hailstorm',
            name: 'Hailstorm',
            description: 'A severe hailstorm pelts {nation}, damaging buildings and crops.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 5,
                pollutionAdded: 0,
                chanceDestroyInfra: 0.40,
                infraDestroyedPercent: { min: 4, max: 10 },
                chanceKillPopulation: 0.05,
                populationKilledPercent: { min: 0, max: 1 },
                diseaseAdded: 0,
                happinessPenalty: 4,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_mudslide',
            name: 'Mudslide',
            description: 'A mudslide buries parts of {nation} after heavy rains.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 8,
                pollutionAdded: 5,
                chanceDestroyInfra: 0.45,
                infraDestroyedPercent: { min: 6, max: 14 },
                chanceKillPopulation: 0.25,
                populationKilledPercent: { min: 1, max: 3 },
                diseaseAdded: 2,
                happinessPenalty: 6,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_nuclear_meltdown',
            name: 'Nuclear Meltdown',
            description: 'A nuclear power plant meltdown contaminates {nation} with radiation.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 35,
                pollutionAdded: 40,
                chanceDestroyInfra: 0.30,
                infraDestroyedPercent: { min: 5, max: 10 },
                chanceKillPopulation: 0.60,
                populationKilledPercent: { min: 3, max: 8 },
                diseaseAdded: 20,
                happinessPenalty: 20,
                crimeAdded: 5,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_chemical_spill',
            name: 'Chemical Spill',
            description: 'A toxic chemical spill poisons {nation}\'s water and soil.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 20,
                pollutionAdded: 25,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0.15,
                populationKilledPercent: { min: 1, max: 2 },
                diseaseAdded: 12,
                happinessPenalty: 8,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_oil_spill',
            name: 'Oil Spill',
            description: 'An oil spill coats {nation}\'s coastline in black sludge.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 25,
                pollutionAdded: 20,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0.05,
                populationKilledPercent: { min: 0, max: 1 },
                diseaseAdded: 2,
                happinessPenalty: 5,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_sandstorm',
            name: 'Sandstorm',
            description: 'A massive sandstorm engulfs {nation}, reducing visibility and damaging property.',
            effectType: 'disaster',
            category: 'natural',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 10,
                pollutionAdded: 10,
                chanceDestroyInfra: 0.35,
                infraDestroyedPercent: { min: 3, max: 8 },
                chanceKillPopulation: 0.10,
                populationKilledPercent: { min: 0, max: 1 },
                diseaseAdded: 4,
                happinessPenalty: 5,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        }
    ],

    // ══════════════════════════════════════════════════════════════════════════════
    // RELIGIOUS DISASTERS (12 - one per religion)
    // ═══════════════════════════════════════════════════════════════════════════════
    religious: [
        {
            id: 'disaster_reason_purge',
            name: 'Reason Purge',
            description: 'Atheist zealots in {nation} purge religious influence, sparking civil unrest.',
            effectType: 'disaster',
            category: 'religious',
            religion: 'atheism',
            warOnly: false,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0.20,
                infraDestroyedPercent: { min: 2, max: 6 },
                chanceKillPopulation: 0.30,
                populationKilledPercent: { min: 1, max: 3 },
                diseaseAdded: 0,
                happinessPenalty: 10,
                crimeAdded: 8,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_sulfur_rain',
            name: 'Sulfur Rain',
            description: 'God rains down sulfur on {nation}, a biblical punishment for the wicked.',
            effectType: 'disaster',
            category: 'religious',
            religion: 'monotheism',
            warOnly: false,
            effects: {
                environmentPenalty: 20,
                pollutionAdded: 25,
                chanceDestroyInfra: 0.70,
                infraDestroyedPercent: { min: 15, max: 25 },
                chanceKillPopulation: 0.50,
                populationKilledPercent: { min: 2, max: 6 },
                diseaseAdded: 5,
                happinessPenalty: 15,
                crimeAdded: 3,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_gods_angry',
            name: 'The Gods Are Angry',
            description: 'The pantheon of {nation} expresses divine displeasure through calamity.',
            effectType: 'disaster',
            category: 'religious',
            religion: 'polytheism',
            warOnly: false,
            effects: {
                environmentPenalty: 10,
                pollutionAdded: 10,
                chanceDestroyInfra: 0.50,
                infraDestroyedPercent: { min: 8, max: 18 },
                chanceKillPopulation: 0.40,
                populationKilledPercent: { min: 1, max: 4 },
                diseaseAdded: 3,
                happinessPenalty: 10,
                crimeAdded: 5,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_karma_reckoning',
            name: 'Karma\'s Reckoning',
            description: 'Bad karma catches up with {nation}, bringing misfortune to all.',
            effectType: 'disaster',
            category: 'religious',
            religion: 'buddhism',
            warOnly: false,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0.25,
                populationKilledPercent: { min: 1, max: 3 },
                diseaseAdded: 5,
                happinessPenalty: 8,
                crimeAdded: 10,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_caste_unrest',
            name: 'Caste Unrest',
            description: 'Caste tensions boil over in {nation}, sparking riots and violence.',
            effectType: 'disaster',
            category: 'religious',
            religion: 'hinduism',
            warOnly: false,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0.30,
                infraDestroyedPercent: { min: 3, max: 8 },
                chanceKillPopulation: 0.20,
                populationKilledPercent: { min: 1, max: 2 },
                diseaseAdded: 0,
                happinessPenalty: 12,
                crimeAdded: 15,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_kami_wrath',
            name: 'Kami\'s Wrath',
            description: 'The nature spirits of {nation} are angered, lashing out at the land.',
            effectType: 'disaster',
            category: 'religious',
            religion: 'shintoism',
            warOnly: false,
            effects: {
                environmentPenalty: 25,
                pollutionAdded: 15,
                chanceDestroyInfra: 0.45,
                infraDestroyedPercent: { min: 6, max: 14 },
                chanceKillPopulation: 0.25,
                populationKilledPercent: { min: 1, max: 3 },
                diseaseAdded: 2,
                happinessPenalty: 9,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_divine_judgment',
            name: 'Divine Judgment',
            description: 'Allah\'s judgment falls upon {nation}, a test of faith through fire.',
            effectType: 'disaster',
            category: 'religious',
            religion: 'islam',
            warOnly: false,
            effects: {
                environmentPenalty: 15,
                pollutionAdded: 15,
                chanceDestroyInfra: 0.60,
                infraDestroyedPercent: { min: 10, max: 20 },
                chanceKillPopulation: 0.45,
                populationKilledPercent: { min: 2, max: 5 },
                diseaseAdded: 4,
                happinessPenalty: 12,
                crimeAdded: 2,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_cross_burns',
            name: 'The Cross Burns',
            description: 'Churches across {nation} burn as faith is tested by flame.',
            effectType: 'disaster',
            category: 'religious',
            religion: 'christianity',
            warOnly: false,
            effects: {
                environmentPenalty: 5,
                pollutionAdded: 5,
                chanceDestroyInfra: 0.40,
                infraDestroyedPercent: { min: 5, max: 12 },
                chanceKillPopulation: 0.30,
                populationKilledPercent: { min: 1, max: 3 },
                diseaseAdded: 0,
                happinessPenalty: 15,
                crimeAdded: 3,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_spirit_imbalance',
            name: 'Spirit World Imbalance',
            description: 'The spirit world is out of balance in {nation}, bringing sickness and death.',
            effectType: 'disaster',
            category: 'religious',
            religion: 'shamanism',
            warOnly: false,
            effects: {
                environmentPenalty: 5,
                pollutionAdded: 0,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0.35,
                populationKilledPercent: { min: 2, max: 5 },
                diseaseAdded: 15,
                happinessPenalty: 10,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_covenant_broken',
            name: 'Covenant Broken',
            description: 'The ancient covenant is broken in {nation}, and the people suffer.',
            effectType: 'disaster',
            category: 'religious',
            religion: 'judaism',
            warOnly: false,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0.20,
                infraDestroyedPercent: { min: 2, max: 6 },
                chanceKillPopulation: 0.25,
                populationKilledPercent: { min: 1, max: 3 },
                diseaseAdded: 3,
                happinessPenalty: 18,
                crimeAdded: 5,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_thetans_attack',
            name: 'Thetan Invasion',
            description: 'Disembodied thetans possess citizens of {nation}, scrambling minds and machines.',
            effectType: 'disaster',
            category: 'religious',
            religion: 'scientology',
            warOnly: false,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0.15,
                populationKilledPercent: { min: 1, max: 2 },
                diseaseAdded: 0,
                happinessPenalty: 8,
                crimeAdded: 0,
                chanceDestroyTech: 0.80,
                techDestroyedPercent: { min: 15, max: 35 }
            }
        },
        {
            id: 'disaster_flying_spaghetti_monster',
            name: 'The Flying Spaghetti Monster Strikes',
            description: 'His Noodly Appendage touches {nation} in a most peculiar and unwelcome way.',
            effectType: 'disaster',
            category: 'religious',
            religion: 'pastafarianism',
            warOnly: false,
            effects: {
                environmentPenalty: 5,
                pollutionAdded: 10,
                chanceDestroyInfra: 0.25,
                infraDestroyedPercent: { min: 2, max: 6 },
                chanceKillPopulation: 0.20,
                populationKilledPercent: { min: 1, max: 2 },
                diseaseAdded: 0,
                happinessPenalty: 4,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        }
    ],

    // ══════════════════════════════════════════════════════════════════════════════
    // FICTIONAL / SILLY DISASTERS (12)
    // ═══════════════════════════════════════════════════════════════════════════════
    fictional: [
        {
            id: 'disaster_godzilla',
            name: 'Godzilla Walked Through Your Capital',
            description: 'Godzilla stomped through {nation}\'s capital city, leaving nothing but rubble.',
            effectType: 'disaster',
            category: 'fictional',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 15,
                pollutionAdded: 10,
                chanceDestroyInfra: 0.90,
                infraDestroyedPercent: { min: 20, max: 40 },
                chanceKillPopulation: 0.70,
                populationKilledPercent: { min: 5, max: 12 },
                diseaseAdded: 5,
                happinessPenalty: 25,
                crimeAdded: 5,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_alien_invasion',
            name: 'Alien Invasion',
            description: 'Extraterrestrials have invaded {nation}, abducting citizens and technology.',
            effectType: 'disaster',
            category: 'fictional',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0.10,
                infraDestroyedPercent: { min: 1, max: 3 },
                chanceKillPopulation: 0.40,
                populationKilledPercent: { min: 2, max: 6 },
                diseaseAdded: 0,
                happinessPenalty: 20,
                crimeAdded: 0,
                chanceDestroyTech: 0.85,
                techDestroyedPercent: { min: 20, max: 40 }
            }
        },
        {
            id: 'disaster_zombie_outbreak',
            name: 'Zombie Outbreak',
            description: 'A zombie virus spreads through {nation}, turning citizens into the undead.',
            effectType: 'disaster',
            category: 'fictional',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0.60,
                populationKilledPercent: { min: 3, max: 8 },
                diseaseAdded: 30,
                happinessPenalty: 25,
                crimeAdded: 20,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_giant_monster',
            name: 'Giant Monster Attack',
            description: 'A kaiju-sized monster rampages through {nation}, crushing everything.',
            effectType: 'disaster',
            category: 'fictional',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 10,
                pollutionAdded: 5,
                chanceDestroyInfra: 0.80,
                infraDestroyedPercent: { min: 15, max: 30 },
                chanceKillPopulation: 0.55,
                populationKilledPercent: { min: 3, max: 8 },
                diseaseAdded: 2,
                happinessPenalty: 20,
                crimeAdded: 3,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_meteor_strike',
            name: 'Meteor Strike',
            description: 'A meteor impacts {nation}, creating a massive crater and devastation.',
            effectType: 'disaster',
            category: 'fictional',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 30,
                pollutionAdded: 20,
                chanceDestroyInfra: 0.85,
                infraDestroyedPercent: { min: 25, max: 45 },
                chanceKillPopulation: 0.65,
                populationKilledPercent: { min: 5, max: 15 },
                diseaseAdded: 5,
                happinessPenalty: 30,
                crimeAdded: 5,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_black_hole',
            name: 'Micro Black Hole',
            description: 'A micro black hole opens in {nation}, consuming technology and matter.',
            effectType: 'disaster',
            category: 'fictional',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 5,
                pollutionAdded: 0,
                chanceDestroyInfra: 0.05,
                infraDestroyedPercent: { min: 1, max: 2 },
                chanceKillPopulation: 0.20,
                populationKilledPercent: { min: 1, max: 3 },
                diseaseAdded: 0,
                happinessPenalty: 15,
                crimeAdded: 0,
                chanceDestroyTech: 0.95,
                techDestroyedPercent: { min: 30, max: 50 }
            }
        },
        {
            id: 'disaster_robot_uprising',
            name: 'Robot Uprising',
            description: 'AI-controlled robots rebel against {nation}, attacking military and infrastructure.',
            effectType: 'disaster',
            category: 'fictional',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0.30,
                infraDestroyedPercent: { min: 5, max: 12 },
                chanceKillPopulation: 0.25,
                populationKilledPercent: { min: 1, max: 3 },
                diseaseAdded: 0,
                happinessPenalty: 15,
                crimeAdded: 0,
                chanceDestroyTech: 0.60,
                techDestroyedPercent: { min: 10, max: 25 }
            }
        },
        {
            id: 'disaster_bridge_collapse',
            name: 'Bridge Collapse',
            description: 'A major bridge in {nation} collapses during rush hour.',
            effectType: 'disaster',
            category: 'fictional',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0.60,
                infraDestroyedPercent: { min: 5, max: 10 },
                chanceKillPopulation: 0.25,
                populationKilledPercent: { min: 1, max: 2 },
                diseaseAdded: 0,
                happinessPenalty: 7,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_locust_swarm',
            name: 'Locust Swarm',
            description: 'A biblical swarm of locusts devours {nation}\'s crops and land.',
            effectType: 'disaster',
            category: 'fictional',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 15,
                pollutionAdded: 0,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0.15,
                populationKilledPercent: { min: 1, max: 2 },
                diseaseAdded: 2,
                happinessPenalty: 10,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_plague',
            name: 'Plague',
            description: 'A deadly plague sweeps through {nation}, overwhelming hospitals.',
            effectType: 'disaster',
            category: 'fictional',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0.50,
                populationKilledPercent: { min: 2, max: 7 },
                diseaseAdded: 35,
                happinessPenalty: 20,
                crimeAdded: 5,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_power_grid_failure',
            name: 'Power Grid Failure',
            description: '{nation}\'s entire power grid fails, plunging the nation into darkness.',
            effectType: 'disaster',
            category: 'fictional',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0.10,
                infraDestroyedPercent: { min: 1, max: 3 },
                chanceKillPopulation: 0.05,
                populationKilledPercent: { min: 0, max: 1 },
                diseaseAdded: 2,
                happinessPenalty: 15,
                crimeAdded: 8,
                techDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_internet_blackout',
            name: 'Internet Blackout',
            description: 'A global cyberattack knocks {nation}\'s internet offline.',
            effectType: 'disaster',
            category: 'fictional',
            religion: null,
            warOnly: false,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0,
                populationKilledPercent: { min: 0, max: 0 },
                diseaseAdded: 0,
                happinessPenalty: 12,
                crimeAdded: 10,
                chanceDestroyTech: 0.50,
                techDestroyedPercent: { min: 5, max: 15 }
            }
        }
    ],

    // ══════════════════════════════════════════════════════════════════════════════
    // WAR DISASTERS (8 - only trigger when nation is at war)
    // ═══════════════════════════════════════════════════════════════════════════════
    war: [
        {
            id: 'disaster_friendly_fire',
            name: 'Friendly Fire Incident',
            description: 'Friendly fire in {nation} kills soldiers and destroys equipment.',
            effectType: 'disaster',
            category: 'war',
            religion: null,
            warOnly: true,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0.05,
                populationKilledPercent: { min: 0, max: 1 },
                diseaseAdded: 0,
                happinessPenalty: 5,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 },
                chanceKillSoldiers: 0.80,
                soldiersKilledPercent: { min: 5, max: 15 },
                chanceDestroyTanks: 0.60,
                tanksDestroyedPercent: { min: 5, max: 15 },
                chanceDestroyAircraft: 0,
                aircraftDestroyedPercent: { min: 0, max: 0 },
                chanceDestroyShips: 0,
                shipsDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_supply_line_cut',
            name: 'Supply Line Cut',
            description: 'Enemy forces cut {nation}\'s supply lines, stranding troops.',
            effectType: 'disaster',
            category: 'war',
            religion: null,
            warOnly: true,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0.15,
                populationKilledPercent: { min: 1, max: 2 },
                diseaseAdded: 0,
                happinessPenalty: 12,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 },
                chanceKillSoldiers: 0.50,
                soldiersKilledPercent: { min: 3, max: 8 },
                chanceDestroyTanks: 0,
                tanksDestroyedPercent: { min: 0, max: 0 },
                chanceDestroyAircraft: 0,
                aircraftDestroyedPercent: { min: 0, max: 0 },
                chanceDestroyShips: 0,
                shipsDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_naval_blockade',
            name: 'Naval Blockade',
            description: 'An enemy blockade traps {nation}\'s fleet in port.',
            effectType: 'disaster',
            category: 'war',
            religion: null,
            warOnly: true,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0.05,
                populationKilledPercent: { min: 0, max: 1 },
                diseaseAdded: 0,
                happinessPenalty: 15,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 },
                chanceKillSoldiers: 0,
                soldiersKilledPercent: { min: 0, max: 0 },
                chanceDestroyTanks: 0,
                tanksDestroyedPercent: { min: 0, max: 0 },
                chanceDestroyAircraft: 0,
                aircraftDestroyedPercent: { min: 0, max: 0 },
                chanceDestroyShips: 0.70,
                shipsDestroyedPercent: { min: 10, max: 25 }
            }
        },
        {
            id: 'disaster_air_raid',
            name: 'Air Raid',
            description: 'Enemy bombers strike {nation}, destroying aircraft and infrastructure.',
            effectType: 'disaster',
            category: 'war',
            religion: null,
            warOnly: true,
            effects: {
                environmentPenalty: 5,
                pollutionAdded: 5,
                chanceDestroyInfra: 0.70,
                infraDestroyedPercent: { min: 10, max: 20 },
                chanceKillPopulation: 0.25,
                populationKilledPercent: { min: 1, max: 3 },
                diseaseAdded: 0,
                happinessPenalty: 12,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 },
                chanceKillSoldiers: 0.10,
                soldiersKilledPercent: { min: 1, max: 3 },
                chanceDestroyTanks: 0,
                tanksDestroyedPercent: { min: 0, max: 0 },
                chanceDestroyAircraft: 0.80,
                aircraftDestroyedPercent: { min: 10, max: 25 },
                chanceDestroyShips: 0,
                shipsDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_tank_battalion_wiped',
            name: 'Tank Battalion Wiped Out',
            description: 'An entire tank battalion of {nation} is destroyed in battle.',
            effectType: 'disaster',
            category: 'war',
            religion: null,
            warOnly: true,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0.05,
                populationKilledPercent: { min: 0, max: 1 },
                diseaseAdded: 0,
                happinessPenalty: 10,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 },
                chanceKillSoldiers: 0.40,
                soldiersKilledPercent: { min: 5, max: 12 },
                chanceDestroyTanks: 0.90,
                tanksDestroyedPercent: { min: 20, max: 40 },
                chanceDestroyAircraft: 0,
                aircraftDestroyedPercent: { min: 0, max: 0 },
                chanceDestroyShips: 0,
                shipsDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_ammunition_explosion',
            name: 'Ammunition Depot Explosion',
            description: 'An ammunition depot explodes in {nation}, causing massive casualties.',
            effectType: 'disaster',
            category: 'war',
            religion: null,
            warOnly: true,
            effects: {
                environmentPenalty: 10,
                pollutionAdded: 15,
                chanceDestroyInfra: 0.40,
                infraDestroyedPercent: { min: 8, max: 15 },
                chanceKillPopulation: 0.30,
                populationKilledPercent: { min: 2, max: 5 },
                diseaseAdded: 2,
                happinessPenalty: 15,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 },
                chanceKillSoldiers: 0.70,
                soldiersKilledPercent: { min: 8, max: 18 },
                chanceDestroyTanks: 0.30,
                tanksDestroyedPercent: { min: 3, max: 8 },
                chanceDestroyAircraft: 0,
                aircraftDestroyedPercent: { min: 0, max: 0 },
                chanceDestroyShips: 0,
                shipsDestroyedPercent: { min: 0, max: 0 }
            }
        },
        {
            id: 'disaster_bombing_raid',
            name: 'Strategic Bombing Raid',
            description: 'Enemy bombers level parts of {nation}\'s industrial infrastructure.',
            effectType: 'disaster',
            category: 'war',
            religion: null,
            warOnly: true,
            effects: {
                environmentPenalty: 10,
                pollutionAdded: 20,
                chanceDestroyInfra: 0.85,
                infraDestroyedPercent: { min: 15, max: 30 },
                chanceKillPopulation: 0.40,
                populationKilledPercent: { min: 2, max: 6 },
                diseaseAdded: 3,
                happinessPenalty: 18,
                crimeAdded: 2,
                techDestroyedPercent: { min: 0, max: 0 },
                chanceKillSoldiers: 0.15,
                soldiersKilledPercent: { min: 2, max: 5 },
                chanceDestroyTanks: 0.20,
                tanksDestroyedPercent: { min: 3, max: 8 },
                chanceDestroyAircraft: 0.30,
                aircraftDestroyedPercent: { min: 5, max: 12 },
                chanceDestroyShips: 0.10,
                shipsDestroyedPercent: { min: 2, max: 5 }
            }
        },
        {
            id: 'disaster_blockade_failure',
            name: 'Blockade Runner Failure',
            description: 'Attempts to run the enemy blockade fail, losing ships and supplies.',
            effectType: 'disaster',
            category: 'war',
            religion: null,
            warOnly: true,
            effects: {
                environmentPenalty: 0,
                pollutionAdded: 0,
                chanceDestroyInfra: 0,
                infraDestroyedPercent: { min: 0, max: 0 },
                chanceKillPopulation: 0.05,
                populationKilledPercent: { min: 0, max: 1 },
                diseaseAdded: 0,
                happinessPenalty: 10,
                crimeAdded: 0,
                techDestroyedPercent: { min: 0, max: 0 },
                chanceKillSoldiers: 0,
                soldiersKilledPercent: { min: 0, max: 0 },
                chanceDestroyTanks: 0,
                tanksDestroyedPercent: { min: 0, max: 0 },
                chanceDestroyAircraft: 0,
                aircraftDestroyedPercent: { min: 0, max: 0 },
                chanceDestroyShips: 0.60,
                shipsDestroyedPercent: { min: 8, max: 20 }
            }
        }
    ]
};


if (typeof module !== 'undefined' && module.exports) {
    module.exports = DisasterEvents;
} else if (typeof window !== 'undefined') {
    window.DisasterEvents = DisasterEvents;
}
