/**
 * Nation-Level Random Events
 * Dominion Wars - Nation Building Strategy Game
 * 
 * Events that affect the nation as a whole with diverse themes including:
 * - Economic developments, technological breakthroughs, natural disasters
 * - Political events, diplomatic successes/failures, social movements
 * - Cultural events, religious developments, military situations
 * - Environmental changes, resource discoveries, infrastructure incidents
 */

const NationEvents = {
    // ═══════════════════════════════════════════════════════════════
    // ECONOMIC EVENTS (50 events)
    // ═══════════════════════════════════════════════════════════════
    economic: [
        {
            id: 'economic_boom',
            name: 'Economic Boom',
            description: 'Your nation experiences unexpected economic growth as markets surge!',
            effects: { money: 2000000, happiness: 8, reputation: 3 },
            weight: 10
        },
        {
            id: 'stock_market_rally',
            name: 'Stock Market Rally', 
            description: 'International investors show confidence in your economy, driving massive capital inflows.',
            effects: { money: 3500000, stability: 5, reputation: 5 },
            weight: 8
        },
        {
            id: 'export_surge',
            name: 'Export Surge',
            description: 'Global demand for your products has skyrocketed, boosting trade revenues.',
            effects: { money: 1800000, reputation: 4, happiness: 3 },
            weight: 12
        },
        {
            id: 'tourism_boom',
            name: 'Tourism Boom',
            description: 'Your nation becomes a popular travel destination, bringing in foreign currency.',
            effects: { money: 1200000, happiness: 6, reputation: 8 },
            weight: 9
        },
        {
            id: 'currency_appreciation',
            name: 'Currency Appreciation',
            description: 'Your national currency strengthens significantly against international markets.',
            effects: { money: 2200000, stability: 4, reputation: 6 },
            weight: 7
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // TECHNOLOGICAL EVENTS (40 events)
    // ═══════════════════════════════════════════════════════════════
    technological: [
        {
            id: 'breakthrough_discovery',
            name: 'Scientific Breakthrough',
            description: 'Your researchers make a groundbreaking discovery that advances your technology significantly!',
            effects: { tech: 150, researchPoints: 800, reputation: 6 },
            weight: 8
        },
        {
            id: 'innovation_hub',
            name: 'Innovation Hub Established',
            description: 'A major tech company establishes a research center in your nation, boosting innovation.',
            effects: { tech: 100, money: 1500000, happiness: 4 },
            weight: 10
        },
        {
            id: 'patent_windfall',
            name: 'Patent Licensing Windfall',
            description: 'One of your nation\'s patents becomes globally valuable, generating substantial royalties.',
            effects: { tech: 80, money: 2800000, reputation: 4 },
            weight: 6
        },
        {
            id: 'quantum_leap',
            name: 'Quantum Computing Breakthrough',
            description: 'Your scientists achieve a major advancement in quantum computing technology.',
            effects: { tech: 200, researchPoints: 1200, reputation: 8 },
            weight: 4
        },
        {
            id: 'ai_development',
            name: 'AI System Development',
            description: 'Your nation develops an advanced artificial intelligence system for civilian use.',
            effects: { tech: 120, happiness: 5, stability: 3 },
            weight: 7
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // NATURAL DISASTERS & ENVIRONMENTAL (30 events)
    // ═══════════════════════════════════════════════════════════════
    natural: [
        {
            id: 'earthquake',
            name: 'Major Earthquake',
            description: 'A devastating earthquake strikes your nation, causing widespread damage and casualties.',
            effects: { population: 0.92, happiness: -15, money: -3500000, infra: -50 },
            weight: 5
        },
        {
            id: 'tsunami',
            name: 'Tsunami Warning',
            description: 'Coastal areas are evacuated as a tsunami threatens your shoreline.',
            effects: { population: 0.96, happiness: -8, money: -2000000 },
            weight: 3
        },
        {
            id: 'volcanic_eruption',
            name: 'Volcanic Eruption',
            description: 'A major volcanic eruption disrupts air travel and covers regions in ash.',
            effects: { happiness: -12, money: -2800000, stability: -5 },
            weight: 4
        },
        {
            id: 'hurricane_season',
            name: 'Devastating Hurricane',
            description: 'A category 5 hurricane makes landfall, causing extensive flooding and infrastructure damage.',
            effects: { population: 0.94, infra: -75, money: -4200000, happiness: -10 },
            weight: 6
        },
        {
            id: 'drought',
            name: 'Severe Drought',
            description: 'A prolonged drought affects agricultural regions and water supplies.',
            effects: { happiness: -8, money: -1800000, 'resources.food': -500 },
            weight: 8
        },
        {
            id: 'oil_discovery',
            name: 'Major Oil Discovery',
            description: 'Geologists discover vast oil reserves beneath your territory!',
            effects: { money: 5000000, 'resources.oil': 2000, happiness: 12, reputation: 5 },
            weight: 3
        },
        {
            id: 'mineral_find',
            name: 'Rare Mineral Discovery',
            description: 'Mining surveys reveal deposits of valuable rare earth minerals.',
            effects: { money: 3200000, 'resources.uranium': 500, tech: 50 },
            weight: 4
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // POLITICAL & DIPLOMATIC EVENTS (40 events)
    // ═══════════════════════════════════════════════════════════════
    political: [
        {
            id: 'diplomatic_triumph',
            name: 'Diplomatic Triumph',
            description: 'Your diplomats successfully negotiate a historic peace agreement with neighboring nations.',
            effects: { reputation: 15, happiness: 8, stability: 10 },
            weight: 8
        },
        {
            id: 'international_recognition',
            name: 'International Recognition',
            description: 'Your nation receives prestigious international awards for human rights and governance.',
            effects: { reputation: 12, happiness: 6, stability: 5 },
            weight: 10
        },
        {
            id: 'trade_agreement',
            name: 'Lucrative Trade Agreement',
            description: 'A major trade deal is signed, opening new markets for your goods.',
            effects: { money: 2500000, reputation: 6, happiness: 4 },
            weight: 12
        },
        {
            id: 'embassy_opening',
            name: 'New Embassy Opening',
            description: 'Several nations establish embassies in your capital, strengthening diplomatic ties.',
            effects: { reputation: 8, stability: 3, money: 800000 },
            weight: 15
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // SOCIAL & CULTURAL EVENTS (30 events) 
    // ═══════════════════════════════════════════════════════════════
    cultural: [
        {
            id: 'cultural_festival',
            name: 'International Cultural Festival',
            description: 'Your nation hosts a world-renowned cultural festival, attracting global attention.',
            effects: { happiness: 10, reputation: 8, money: 1200000 },
            weight: 12
        },
        {
            id: 'artistic_renaissance',
            name: 'Artistic Renaissance',
            description: 'A wave of creativity sweeps the nation as artists gain international acclaim.',
            effects: { happiness: 8, reputation: 10, stability: 4 },
            weight: 8
        },
        {
            id: 'literary_prize',
            name: 'Literary Prize Winner',
            description: 'A citizen wins the world\'s most prestigious literary award.',
            effects: { happiness: 6, reputation: 12, tech: 20 },
            weight: 6
        }
    ]
};

// Add comprehensive economic events
NationEvents.economic = [
    ...NationEvents.economic,
    {
        id: 'market_crash',
        name: 'Market Crash',
        description: 'Financial markets suffer a severe downturn, affecting the national economy.',
        effects: { money: -2500000, happiness: -12, stability: -8 },
        weight: 6
    },
    {
        id: 'banking_reform',
        name: 'Banking System Reform',
        description: 'Modernization of your banking system attracts international investment.',
        effects: { money: 1800000, stability: 6, reputation: 4 },
        weight: 8
    },
    {
        id: 'cryptocurrency_adoption',
        name: 'Cryptocurrency Innovation',
        description: 'Your nation becomes a leader in blockchain technology and digital currency.',
        effects: { tech: 80, money: 2200000, reputation: 6 },
        weight: 7
    },
    {
        id: 'inflation_spike',
        name: 'Inflation Crisis',
        description: 'Rapid price increases strain household budgets across the nation.',
        effects: { happiness: -10, money: -1500000, stability: -6 },
        weight: 9
    },
    {
        id: 'supply_chain_boom',
        name: 'Supply Chain Hub',
        description: 'Your nation becomes a critical link in global supply chains.',
        effects: { money: 2800000, reputation: 5, happiness: 4 },
        weight: 8
    },
    {
        id: 'tech_startup_success',
        name: 'Tech Startup Unicorn',
        description: 'A domestic startup becomes valued at over $1 billion, boosting the tech sector.',
        effects: { money: 1600000, tech: 60, happiness: 5 },
        weight: 9
    },
    {
        id: 'foreign_investment',
        name: 'Major Foreign Investment',
        description: 'International corporations announce massive infrastructure investments.',
        effects: { money: 3200000, infra: 40, happiness: 6 },
        weight: 10
    },
    {
        id: 'resource_price_surge',
        name: 'Resource Price Surge',
        description: 'Global commodity prices rise, benefiting your natural resource exports.',
        effects: { money: 2400000, happiness: 7, reputation: 3 },
        weight: 11
    },
    {
        id: 'manufacturing_revival',
        name: 'Manufacturing Revival',
        description: 'Advanced manufacturing techniques revitalize industrial production.',
        effects: { money: 2000000, tech: 40, happiness: 8 },
        weight: 10
    },
    {
        id: 'green_energy_investment',
        name: 'Green Energy Boom',
        description: 'Massive investment in renewable energy creates jobs and reduces costs.',
        effects: { money: 1800000, tech: 70, happiness: 9, reputation: 6 },
        weight: 8
    }
];

// Expand technological events significantly
NationEvents.technological = [
    ...NationEvents.technological,
    {
        id: 'satellite_launch',
        name: 'Successful Satellite Launch',
        description: 'Your space program successfully launches a communications satellite.',
        effects: { tech: 120, reputation: 8, happiness: 6 },
        weight: 6
    },
    {
        id: 'medical_breakthrough',
        name: 'Medical Breakthrough',
        description: 'Scientists develop a revolutionary treatment for a major disease.',
        effects: { tech: 90, happiness: 12, reputation: 10 },
        weight: 7
    },
    {
        id: 'fusion_progress',
        name: 'Nuclear Fusion Advance',
        description: 'Researchers make significant progress toward practical fusion energy.',
        effects: { tech: 180, researchPoints: 1000, reputation: 12 },
        weight: 3
    },
    {
        id: 'robotics_innovation',
        name: 'Robotics Innovation',
        description: 'Advanced robotics technology revolutionizes manufacturing and healthcare.',
        effects: { tech: 110, money: 1400000, happiness: 4 },
        weight: 8
    },
    {
        id: 'biotech_discovery',
        name: 'Biotechnology Discovery',
        description: 'Breakthrough in genetic engineering opens new possibilities for medicine and agriculture.',
        effects: { tech: 140, researchPoints: 700, happiness: 6 },
        weight: 6
    },
    {
        id: 'neural_interface',
        name: 'Neural Interface Development',
        description: 'Scientists create the first practical brain-computer interface.',
        effects: { tech: 160, reputation: 9, researchPoints: 900 },
        weight: 4
    },
    {
        id: 'nanotechnology_advance',
        name: 'Nanotechnology Breakthrough',
        description: 'Advances in nanotechnology enable new materials and manufacturing processes.',
        effects: { tech: 130, money: 1600000, reputation: 7 },
        weight: 5
    },
    {
        id: 'cyber_security_innovation',
        name: 'Cybersecurity Innovation',
        description: 'Revolutionary encryption technology makes your digital infrastructure nearly impenetrable.',
        effects: { tech: 100, stability: 8, reputation: 6 },
        weight: 9
    },
    {
        id: 'clean_tech_patent',
        name: 'Clean Technology Patent',
        description: 'A groundbreaking environmental technology is patented by your researchers.',
        effects: { tech: 85, money: 2200000, reputation: 8 },
        weight: 7
    },
    {
        id: 'space_mining_tech',
        name: 'Space Mining Technology',
        description: 'Development of asteroid mining technology promises vast resource wealth.',
        effects: { tech: 200, researchPoints: 1200, 'resources.uranium': 800 },
        weight: 2
    }
];

// Expand natural disasters and environmental events
NationEvents.natural = [
    ...NationEvents.natural,
    {
        id: 'forest_fire',
        name: 'Massive Forest Fires',
        description: 'Wildfires rage across forested regions, destroying habitats and property.',
        effects: { happiness: -10, money: -2200000, 'resources.lumber': -800 },
        weight: 7
    },
    {
        id: 'flood',
        name: 'Historic Flooding',
        description: 'Heavy rains cause widespread flooding in river valleys and urban areas.',
        effects: { population: 0.96, infra: -30, money: -1800000, happiness: -8 },
        weight: 8
    },
    {
        id: 'blizzard',
        name: 'Extreme Blizzard',
        description: 'A record-breaking blizzard paralyzes transportation and energy systems.',
        effects: { happiness: -6, money: -1200000, stability: -4 },
        weight: 6
    },
    {
        id: 'heatwave',
        name: 'Deadly Heatwave',
        description: 'Extreme temperatures strain power grids and threaten public health.',
        effects: { happiness: -7, money: -900000, population: 0.98 },
        weight: 9
    },
    {
        id: 'meteor_impact',
        name: 'Meteor Impact',
        description: 'A small meteor creates a spectacular fireball and minor ground impact.',
        effects: { happiness: 3, reputation: 4, tech: 30 },
        weight: 1
    },
    {
        id: 'aurora_phenomenon',
        name: 'Spectacular Aurora',
        description: 'Unusual solar activity creates breathtaking aurora displays visible across the nation.',
        effects: { happiness: 8, reputation: 5 },
        weight: 3
    },
    {
        id: 'endangered_species_recovery',
        name: 'Species Recovery Success',
        description: 'Conservation efforts successfully bring an endangered species back from the brink.',
        effects: { happiness: 6, reputation: 8, stability: 3 },
        weight: 4
    },
    {
        id: 'coral_reef_restoration',
        name: 'Coral Reef Restoration',
        description: 'Marine conservation projects successfully restore damaged coral reef ecosystems.',
        effects: { happiness: 5, reputation: 7, money: 800000 },
        weight: 5
    },
    {
        id: 'renewable_energy_milestone',
        name: 'Renewable Energy Milestone',
        description: 'Your nation achieves 50% renewable energy generation for the first time.',
        effects: { happiness: 10, reputation: 12, tech: 50 },
        weight: 6
    },
    {
        id: 'carbon_neutral_achievement',
        name: 'Carbon Neutral Achievement',
        description: 'Environmental policies successfully make your nation carbon neutral.',
        effects: { happiness: 12, reputation: 15, stability: 6 },
        weight: 3
    }
];

// Expand political events significantly
NationEvents.political = [
    ...NationEvents.political,
    {
        id: 'peace_treaty',
        name: 'Historic Peace Treaty',
        description: 'Your nation mediates a peace agreement between warring neighbors.',
        effects: { reputation: 20, happiness: 10, stability: 8 },
        weight: 5
    },
    {
        id: 'election_victory',
        name: 'Democratic Election Success',
        description: 'International observers praise your free and fair elections.',
        effects: { reputation: 8, stability: 12, happiness: 6 },
        weight: 12
    },
    {
        id: 'corruption_scandal',
        name: 'Government Corruption Scandal',
        description: 'High-level corruption is exposed, damaging public trust.',
        effects: { reputation: -15, stability: -10, happiness: -12 },
        weight: 8
    },
    {
        id: 'constitutional_reform',
        name: 'Constitutional Reform Success',
        description: 'Peaceful constitutional reforms strengthen democratic institutions.',
        effects: { stability: 15, reputation: 10, happiness: 8 },
        weight: 6
    },
    {
        id: 'international_arbitration_win',
        name: 'International Court Victory',
        description: 'Your nation wins a major case at the International Court of Justice.',
        effects: { reputation: 12, stability: 5, money: 1200000 },
        weight: 4
    },
    {
        id: 'diplomatic_immunity_incident',
        name: 'Diplomatic Immunity Scandal',
        description: 'A diplomat\'s misconduct abroad creates international embarrassment.',
        effects: { reputation: -8, stability: -3, happiness: -4 },
        weight: 7
    },
    {
        id: 'humanitarian_leadership',
        name: 'Humanitarian Leadership',
        description: 'Your nation leads international disaster relief efforts.',
        effects: { reputation: 18, happiness: 10, money: -2000000 },
        weight: 6
    },
    {
        id: 'nuclear_disarmament',
        name: 'Nuclear Disarmament Initiative',
        description: 'Your nation announces voluntary nuclear disarmament.',
        effects: { reputation: 25, stability: 8, happiness: 15 },
        weight: 2
    },
    {
        id: 'spy_scandal',
        name: 'International Espionage Scandal',
        description: 'Foreign spies are discovered operating within your borders.',
        effects: { reputation: -5, stability: -8, happiness: -6 },
        weight: 9
    },
    {
        id: 'regional_leadership',
        name: 'Regional Leadership Role',
        description: 'Your nation is chosen to lead a major regional organization.',
        effects: { reputation: 15, stability: 6, money: 800000 },
        weight: 7
    }
];

// Expand cultural events significantly
NationEvents.cultural = [
    ...NationEvents.cultural,
    {
        id: 'world_heritage_site',
        name: 'World Heritage Site Designation',
        description: 'UNESCO designates a national landmark as a World Heritage Site.',
        effects: { reputation: 15, happiness: 12, money: 2000000 },
        weight: 4
    },
    {
        id: 'olympic_games_hosting',
        name: 'Olympic Games Hosting Rights',
        description: 'Your nation is selected to host the next Olympic Games.',
        effects: { reputation: 20, happiness: 25, money: -5000000, infra: 100 },
        weight: 2
    },
    {
        id: 'cultural_diplomacy_success',
        name: 'Cultural Diplomacy Success',
        description: 'Cultural exchange programs significantly improve international relations.',
        effects: { reputation: 12, happiness: 8, stability: 5 },
        weight: 10
    },
    {
        id: 'language_revival',
        name: 'Indigenous Language Revival',
        description: 'Efforts to preserve and revitalize indigenous languages gain global recognition.',
        effects: { happiness: 10, reputation: 8, stability: 6 },
        weight: 6
    },
    {
        id: 'film_festival_success',
        name: 'International Film Festival',
        description: 'Your nation\'s cinema gains international acclaim at major film festivals.',
        effects: { reputation: 10, happiness: 8, money: 600000 },
        weight: 8
    },
    {
        id: 'archaeological_discovery',
        name: 'Major Archaeological Discovery',
        description: 'Archaeologists uncover significant ancient artifacts within your borders.',
        effects: { reputation: 12, happiness: 10, tech: 30, money: 1000000 },
        weight: 5
    },
    {
        id: 'music_scene_boom',
        name: 'International Music Scene Recognition',
        description: 'Your nation\'s musicians gain worldwide popularity and acclaim.',
        effects: { happiness: 12, reputation: 9, money: 800000 },
        weight: 9
    },
    {
        id: 'cultural_vandalism',
        name: 'Cultural Heritage Vandalism',
        description: 'Important cultural sites suffer damage from vandalism or neglect.',
        effects: { happiness: -8, reputation: -6, money: -1200000 },
        weight: 7
    },
    {
        id: 'traditional_craft_revival',
        name: 'Traditional Crafts Revival',
        description: 'Ancient crafting techniques gain modern popularity and economic value.',
        effects: { happiness: 6, money: 400000, reputation: 5 },
        weight: 11
    },
    {
        id: 'cultural_appropriation_controversy',
        name: 'Cultural Appropriation Controversy',
        description: 'International criticism arises over cultural appropriation issues.',
        effects: { reputation: -10, happiness: -5, stability: -3 },
        weight: 6
    }
];

// Add military and security events
NationEvents.military = [
    {
        id: 'military_parade_success',
        name: 'Impressive Military Parade',
        description: 'A spectacular military parade showcases your nation\'s strength and unity.',
        effects: { happiness: 8, reputation: 6, stability: 10 },
        weight: 10
    },
    {
        id: 'peacekeeping_mission',
        name: 'Successful Peacekeeping Mission',
        description: 'Your military successfully completes a UN peacekeeping mission.',
        effects: { reputation: 15, happiness: 8, money: -1500000 },
        weight: 6
    },
    {
        id: 'cyber_attack_defense',
        name: 'Cyber Attack Successfully Repelled',
        description: 'Your cybersecurity forces prevent a major cyber attack on critical infrastructure.',
        effects: { reputation: 10, stability: 8, tech: 40 },
        weight: 8
    },
    {
        id: 'border_security_success',
        name: 'Border Security Enhancement',
        description: 'Advanced border security systems successfully prevent illegal activities.',
        effects: { stability: 12, happiness: 6, money: -800000 },
        weight: 9
    },
    {
        id: 'military_modernization',
        name: 'Military Modernization Program',
        description: 'Successful modernization of military equipment and training.',
        effects: { stability: 8, reputation: 5, money: -3000000, tech: 60 },
        weight: 7
    },
    {
        id: 'veteran_support_program',
        name: 'Veteran Support Program Success',
        description: 'Comprehensive veteran support programs receive international recognition.',
        effects: { happiness: 12, reputation: 8, stability: 6 },
        weight: 9
    },
    {
        id: 'military_scandal',
        name: 'Military Conduct Scandal',
        description: 'Military personnel misconduct creates national embarrassment.',
        effects: { reputation: -12, happiness: -8, stability: -6 },
        weight: 6
    },
    {
        id: 'defense_innovation',
        name: 'Defense Technology Innovation',
        description: 'Breakthrough in defensive technology strengthens national security.',
        effects: { tech: 80, stability: 10, reputation: 6 },
        weight: 5
    },
    {
        id: 'international_military_exercise',
        name: 'International Military Exercise',
        description: 'Joint military exercises with allies strengthen international cooperation.',
        effects: { reputation: 8, stability: 6, happiness: 4 },
        weight: 10
    },
    {
        id: 'disarmament_agreement',
        name: 'Arms Reduction Agreement',
        description: 'Successful negotiation of arms reduction treaties with neighboring nations.',
        effects: { reputation: 12, stability: 8, money: 2000000 },
        weight: 4
    }
];

// Add sports and entertainment events
NationEvents.sports = [
    {
        id: 'world_cup_victory',
        name: 'World Cup Championship',
        description: 'Your national football team wins the World Cup in a stunning victory!',
        effects: { happiness: 30, reputation: 15, money: 3000000 },
        weight: 1
    },
    {
        id: 'olympic_gold_medal',
        name: 'Olympic Gold Medal Success',
        description: 'Your athletes win multiple gold medals at the Olympics.',
        effects: { happiness: 20, reputation: 12, money: 1500000 },
        weight: 3
    },
    {
        id: 'sports_stadium_opening',
        name: 'World-Class Sports Stadium Opening',
        description: 'A magnificent new stadium becomes a source of national pride.',
        effects: { happiness: 15, reputation: 8, money: -4000000, infra: 50 },
        weight: 5
    },
    {
        id: 'esports_championship',
        name: 'Esports World Championship',
        description: 'Your nation\'s esports team dominates international competitions.',
        effects: { happiness: 12, reputation: 6, tech: 30 },
        weight: 7
    },
    {
        id: 'marathon_event',
        name: 'International Marathon Success',
        description: 'Your city hosts a world-renowned marathon attracting global participants.',
        effects: { happiness: 10, reputation: 6, money: 800000 },
        weight: 9
    },
    {
        id: 'sports_doping_scandal',
        name: 'Sports Doping Scandal',
        description: 'Athletes are caught using performance-enhancing drugs, damaging reputation.',
        effects: { reputation: -15, happiness: -10, stability: -5 },
        weight: 5
    },
    {
        id: 'youth_sports_program',
        name: 'Youth Sports Program Success',
        description: 'National youth sports programs produce exceptional young athletes.',
        effects: { happiness: 8, reputation: 4, money: -1000000 },
        weight: 8
    },
    {
        id: 'sports_infrastructure',
        name: 'Sports Infrastructure Development',
        description: 'Massive investment in sports facilities improves national athletic capabilities.',
        effects: { happiness: 12, infra: 30, money: -2500000 },
        weight: 6
    },
    {
        id: 'winter_olympics_bid',
        name: 'Winter Olympics Bid Success',
        description: 'Your nation is selected to host the Winter Olympics.',
        effects: { reputation: 18, happiness: 22, money: -6000000, infra: 80 },
        weight: 2
    },
    {
        id: 'sports_betting_scandal',
        name: 'Sports Betting Corruption',
        description: 'Match-fixing and illegal betting scandals rock the sports world.',
        effects: { reputation: -10, happiness: -8, stability: -6 },
        weight: 4
    }
];

// Add religious and spiritual events
NationEvents.religious = [
    {
        id: 'papal_visit',
        name: 'Historic Papal Visit',
        description: 'The Pope visits your nation, bringing spiritual inspiration to millions.',
        effects: { happiness: 18, reputation: 12, stability: 8 },
        weight: 3
    },
    {
        id: 'interfaith_harmony',
        name: 'Interfaith Harmony Council',
        description: 'Different religious communities unite in unprecedented cooperation.',
        effects: { happiness: 12, stability: 15, reputation: 8 },
        weight: 7
    },
    {
        id: 'religious_pilgrimage',
        name: 'Major Religious Pilgrimage',
        description: 'Your nation becomes a destination for international religious pilgrimage.',
        effects: { happiness: 10, reputation: 10, money: 2000000 },
        weight: 5
    },
    {
        id: 'religious_freedom_recognition',
        name: 'Religious Freedom Award',
        description: 'International recognition for protecting religious minorities.',
        effects: { reputation: 15, happiness: 8, stability: 10 },
        weight: 6
    },
    {
        id: 'religious_conflict',
        name: 'Religious Tension Escalation',
        description: 'Tensions between religious communities threaten social stability.',
        effects: { happiness: -12, stability: -15, reputation: -8 },
        weight: 4
    },
    {
        id: 'monastery_restoration',
        name: 'Historic Monastery Restoration',
        description: 'Ancient religious sites are beautifully restored to their former glory.',
        effects: { happiness: 8, reputation: 6, money: -800000 },
        weight: 8
    },
    {
        id: 'religious_education_reform',
        name: 'Religious Education Reform',
        description: 'Balanced religious education programs promote understanding and tolerance.',
        effects: { happiness: 6, stability: 8, reputation: 4 },
        weight: 9
    },
    {
        id: 'spiritual_revival',
        name: 'National Spiritual Revival',
        description: 'A peaceful spiritual awakening spreads across the nation.',
        effects: { happiness: 15, stability: 10, reputation: 6 },
        weight: 5
    },
    {
        id: 'religious_art_exhibition',
        name: 'Sacred Art Exhibition',
        description: 'A world-class exhibition of religious art attracts international visitors.',
        effects: { happiness: 8, reputation: 8, money: 600000 },
        weight: 7
    },
    {
        id: 'blasphemy_controversy',
        name: 'Blasphemy Law Controversy',
        description: 'International criticism of blasphemy law enforcement creates diplomatic tension.',
        effects: { reputation: -8, stability: -5, happiness: -3 },
        weight: 6
    }
];

// Export the events data
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NationEvents;
} else if (typeof window !== 'undefined') {
    window.NationEvents = NationEvents;
}