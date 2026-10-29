/**
 * Population Situations System Data
 * Dominion Wars - Nation Building Strategy Game
 *
 * Population-level situations that require player decisions.
 * Each situation presents exactly 3 choice options with different outcomes.
 *
 * Allowed effect keys: disease, happiness, crime, population, birthRate,
 * population_youngAdult, population_working, population_senior, money.
 *
 * Money costs are calculated as flat dollar amounts at runtime.
 */

var PopulationSituations = {
    // ═════════════════════════════════════════════════════════════════════════════
    // HEALTH & DISEASE (11 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    health: [
        {
            id: 'flu_outbreak',
            title: 'Seasonal Flu Outbreak',
            description: 'A severe flu season is spreading through schools and workplaces, increasing clinic visits.',
            choices: [
                {
                    text: 'Launch free vaccination campaign',
                    effects: { disease: -8, happiness: 3, money: -4000 }
                },
                {
                    text: 'Issue public health advisories only',
                    effects: { disease: -3, happiness: 0 }
                },
                {
                    text: 'Close schools and public gatherings temporarily',
                    effects: { disease: -12, happiness: -8, money: -1500 }
                }
            ]
        },
        {
            id: 'waterborne_illness',
            title: 'Waterborne Illness Cluster',
            description: 'Contaminated well water in a residential district has caused gastrointestinal illness.',
            choices: [
                {
                    text: 'Issue boil-water advisory and test supply',
                    effects: { disease: -6, happiness: -3, money: -2500 }
                },
                {
                    text: 'Flush and treat entire water system',
                    effects: { disease: -10, money: -8000 }
                },
                {
                    text: 'Downplay the issue to avoid panic',
                    effects: { disease: 5, happiness: -5 }
                }
            ]
        },
        {
            id: 'clinic_staffing_shortage',
            title: 'Clinic Staffing Shortage',
            description: 'Local health clinics are operating with skeleton crews, delaying non-emergency care.',
            choices: [
                {
                    text: 'Hire temporary contract nurses',
                    effects: { disease: -4, happiness: 3, money: -6000 }
                },
                {
                    text: 'Offer overtime incentives to existing staff',
                    effects: { disease: -2, happiness: 1, money: -3000 }
                },
                {
                    text: 'Reduce clinic hours temporarily',
                    effects: { disease: 4, happiness: -6 }
                }
            ]
        },
        {
            id: 'vaccine_hesitancy',
            title: 'Vaccine Hesitancy Campaign',
            description: 'Misinformation is reducing vaccination rates, threatening herd immunity.',
            choices: [
                {
                    text: 'Fund community education outreach',
                    effects: { disease: -5, happiness: 2, money: -3500 }
                },
                {
                    text: 'Require vaccinations for school enrollment',
                    effects: { disease: -8, happiness: -4 }
                },
                {
                    text: 'Take no action',
                    effects: { disease: 6, happiness: -2 }
                }
            ]
        },
        {
            id: 'elderly_care_outbreak',
            title: 'Elderly Care Facility Outbreak',
            description: 'Respiratory illness has spread through a senior care facility, endangering vulnerable residents.',
            choices: [
                {
                    text: 'Isolate facility and deploy medical team',
                    effects: { disease: -9, happiness: -1, money: -7000 }
                },
                {
                    text: 'Restrict all visitors indefinitely',
                    effects: { disease: -5, happiness: -10 }
                },
                {
                    text: 'Transfer sick residents to hospitals',
                    effects: { disease: -3, happiness: -5, money: -5000 }
                }
            ]
        },
        {
            id: 'mental_health_crisis',
            title: 'Youth Mental Health Crisis',
            description: 'Rising anxiety and depression among teenagers is straining school counseling resources.',
            choices: [
                {
                    text: 'Hire additional school counselors',
                    effects: { disease: -5, happiness: 6, money: -7000 }
                },
                {
                    text: 'Implement wellness curriculum in schools',
                    effects: { disease: -3, happiness: 4, money: -2000 }
                },
                {
                    text: 'Refer cases to private practitioners',
                    effects: { disease: -1, happiness: 1 }
                }
            ]
        },
        {
            id: 'food_poisoning_outbreak',
            title: 'Food Poisoning Outbreak',
            description: 'Multiple restaurants linked to salmonella cases, overwhelming urgent care clinics.',
            choices: [
                {
                    text: 'Close affected restaurants for inspection',
                    effects: { disease: -6, happiness: -2, money: -3000 }
                },
                {
                    text: 'Mandatory food handler retraining',
                    effects: { disease: -4, happiness: 1, money: -4000 }
                },
                {
                    text: 'Issue public warning only',
                    effects: { disease: 3, happiness: -4 }
                }
            ]
        },
        {
            id: 'antibiotic_resistance',
            title: 'Antibiotic Resistance Spike',
            description: 'Drug-resistant bacterial infections are spreading through hospitals.',
            choices: [
                {
                    text: 'Strict antibiotic prescribing guidelines',
                    effects: { disease: -7, happiness: 1, money: -5000 }
                },
                {
                    text: 'Fund research into alternative treatments',
                    effects: { disease: -3, happiness: 2, money: -8000 }
                },
                {
                    text: 'Continue current practices',
                    effects: { disease: 5, happiness: -3 }
                }
            ]
        },
        {
            id: 'heat_wave_elderly_impact',
            title: 'Heat Wave Health Impact',
            description: 'Extreme temperatures are endangering elderly residents without air conditioning.',
            choices: [
                {
                    text: 'Open cooling centers across the city',
                    effects: { disease: -4, happiness: 4, money: -6000 }
                },
                {
                    text: 'Distribute fans to vulnerable households',
                    effects: { disease: -2, happiness: 3, money: -3000 }
                },
                {
                    text: 'Issue heat advisory only',
                    effects: { disease: 4, happiness: -5 }
                }
            ]
        },
        {
            id: 'dental_care_access',
            title: 'Dental Care Access Crisis',
            description: 'Low-income residents cannot afford dental care, leading to emergency room visits.',
            choices: [
                {
                    text: 'Subsidize community dental clinics',
                    effects: { disease: -5, happiness: 4, money: -9000 }
                },
                {
                    text: 'School-based dental screening program',
                    effects: { disease: -3, happiness: 2, money: -4000 }
                },
                {
                    text: 'Refer to private dentists only',
                    effects: { disease: 2, happiness: -3 }
                }
            ]
        },
        {
            id: 'opioid_resurgence',
            title: 'Opioid Crisis Resurgence',
            description: 'Opioid overdoses are increasing after a period of decline.',
            choices: [
                {
                    text: 'Expand medication-assisted treatment',
                    effects: { disease: -6, happiness: 3, money: -10000 }
                },
                {
                    text: 'Naloxone distribution to first responders',
                    effects: { disease: -4, happiness: 2, money: -3000 }
                },
                {
                    text: 'Law enforcement crackdown on dealers',
                    effects: { disease: -2, happiness: -5, money: -5000 }
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // CRIME & SAFETY (11 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    crime: [
        {
            id: 'theft_wave',
            title: 'Neighborhood Theft Wave',
            description: 'A string of home burglaries and car break-ins has left residents feeling unsafe.',
            choices: [
                {
                    text: 'Increase neighborhood patrol frequency',
                    effects: { crime: -7, happiness: 2, money: -5000 }
                },
                {
                    text: 'Subsidize home security systems',
                    effects: { crime: -4, happiness: 3, money: -6000 }
                },
                {
                    text: 'Community watch volunteer program',
                    effects: { crime: -3, happiness: 1 }
                }
            ]
        },
        {
            id: 'gang_activity',
            title: 'Gang Activity Surge',
            description: 'Graffiti, intimidation, and drug dealing are increasing in one district.',
            choices: [
                {
                    text: 'Task force crackdown on gang leadership',
                    effects: { crime: -10, happiness: -2, money: -9000 }
                },
                {
                    text: 'Fund youth diversion and job programs',
                    effects: { crime: -5, happiness: 4, money: -7000 }
                },
                {
                    text: 'Increased stop-and-search policing',
                    effects: { crime: -6, happiness: -8 }
                }
            ]
        },
        {
            id: 'vandalism_spike',
            title: 'Public Vandalism Spike',
            description: 'Parks, bus stops, and public buildings are being tagged and damaged nightly.',
            choices: [
                {
                    text: 'Install surveillance cameras in hotspots',
                    effects: { crime: -5, happiness: 1, money: -4000 }
                },
                {
                    text: 'Community cleanup and mural projects',
                    effects: { crime: -3, happiness: 5, money: -3000 }
                },
                {
                    text: 'Harsher fines for offenders',
                    effects: { crime: -2, happiness: -3 }
                }
            ]
        },
        {
            id: 'traffic_recklessness',
            title: 'Reckless Driving Epidemic',
            description: 'Speeding and dangerous driving are causing accidents near schools and residential areas.',
            choices: [
                {
                    text: 'Install speed cameras and traffic calming',
                    effects: { crime: -4, happiness: 3, money: -6000 }
                },
                {
                    text: 'Increase traffic police patrols',
                    effects: { crime: -3, happiness: 1, money: -3500 }
                },
                {
                    text: 'Public awareness campaign only',
                    effects: { crime: -1, happiness: 0 }
                }
            ]
        },
        {
            id: 'downtown_loitering',
            title: 'Downtown Loitering and Disturbance',
            description: 'Groups gathering in the commercial district are intimidating shoppers and merchants.',
            choices: [
                {
                    text: 'Hire private security for the district',
                    effects: { crime: -4, happiness: 1, money: -5000 }
                },
                {
                    text: 'Designate a youth gathering space nearby',
                    effects: { crime: -2, happiness: 3, money: -2500 }
                },
                {
                    text: 'Issue dispersal orders to police',
                    effects: { crime: -3, happiness: -4 }
                }
            ]
        },
        {
            id: 'cyber_fraud_targeting_seniors',
            title: 'Cyber Fraud Targeting Seniors',
            description: 'Phone and email scams are defrauding elderly residents of their savings.',
            choices: [
                {
                    text: 'Senior digital literacy workshops',
                    effects: { crime: -3, happiness: 4, money: -2000 }
                },
                {
                    text: 'Public warning campaign about scams',
                    effects: { crime: -2, happiness: 1 }
                },
                {
                    text: 'Establish a fraud hotline and response team',
                    effects: { crime: -5, happiness: 2, money: -4000 }
                }
            ]
        },
        {
            id: 'shoplifting_epidemic',
            title: 'Retail Shoplifting Epidemic',
            description: 'Organized shoplifting rings are targeting shopping districts.',
            choices: [
                {
                    text: 'Increase retail security personnel',
                    effects: { crime: -7, happiness: 2, money: -6000 }
                },
                {
                    text: 'Community business watch program',
                    effects: { crime: -4, happiness: 3, money: -3000 }
                },
                {
                    text: 'Harsher penalties for repeat offenders',
                    effects: { crime: -5, happiness: -3 }
                }
            ]
        },
        {
            id: 'graffiti_town',
            title: 'Graffiti Epidemic',
            description: 'Taggers are covering public buildings, bridges, and transit stops with graffiti.',
            choices: [
                {
                    text: 'Rapid graffiti removal crews',
                    effects: { crime: -5, happiness: 3, money: -5000 }
                },
                {
                    text: 'Designated legal graffiti walls',
                    effects: { crime: -3, happiness: 4, money: -2000 }
                },
                {
                    text: 'Increased fines for taggers',
                    effects: { crime: -2, happiness: -4 }
                }
            ]
        },
        {
            id: 'nighttime_assaults',
            title: 'Nighttime Assault Spike',
            description: 'Violent assaults are increasing in poorly lit areas after dark.',
            choices: [
                {
                    text: 'Install additional street lighting',
                    effects: { crime: -8, happiness: 4, money: -9000 }
                },
                {
                    text: 'Increased night police patrols',
                    effects: { crime: -5, happiness: 2, money: -7000 }
                },
                {
                    text: 'Safety escort volunteer program',
                    effects: { crime: -3, happiness: 1 }
                }
            ]
        },
        {
            id: 'bicycle_theft_ring',
            title: 'Bicycle Theft Ring',
            description: 'An organized group is stealing bicycles from residential areas and bike racks.',
            choices: [
                {
                    text: 'Free bike lock distribution program',
                    effects: { crime: -4, happiness: 3, money: -4000 }
                },
                {
                    text: 'Bicycle registration and tracking system',
                    effects: { crime: -6, happiness: 2, money: -6000 }
                },
                {
                    text: 'Increased patrols near bike racks',
                    effects: { crime: -3, happiness: 1 }
                }
            ]
        },
        {
            id: 'street_racing',
            title: 'Dangerous Street Racing',
            description: 'Illegal street racing is endangering pedestrians and other drivers.',
            choices: [
                {
                    text: 'Speed bumps and traffic calming measures',
                    effects: { crime: -6, happiness: 2, money: -7000 }
                },
                {
                    text: 'Designated legal racing venue',
                    effects: { crime: -3, happiness: 4, money: -8000 }
                },
                {
                    text: 'Increased traffic enforcement',
                    effects: { crime: -4, happiness: -1 }
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // DEMOGRAPHICS & POPULATION (11 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    demographics: [
        {
            id: 'skilled_worker_influx',
            title: 'Skilled Worker Influx',
            description: 'Tech and engineering professionals are relocating to your city for new opportunities.',
            choices: [
                {
                    text: 'Offer relocation grants to attract more',
                    effects: { population_youngAdult: 800, happiness: 3, money: -10000 }
                },
                {
                    text: 'Streamline housing permits for newcomers',
                    effects: { population_youngAdult: 500, happiness: 2 }
                },
                {
                    text: 'Impose temporary settlement caps',
                    effects: { population_youngAdult: -300, happiness: -2 }
                }
            ]
        },
        {
            id: 'retiree_migration',
            title: 'Retiree Migration Wave',
            description: 'Seniors are moving to your region for the climate and lower cost of living.',
            choices: [
                {
                    text: 'Expand senior housing and services',
                    effects: { population_senior: 600, happiness: 4, money: -8000 }
                },
                {
                    text: 'Offer property tax breaks for seniors',
                    effects: { population_senior: 400, happiness: 3, money: -3000 }
                },
                {
                    text: 'Limit new senior housing developments',
                    effects: { population_senior: -200, happiness: -3 }
                }
            ]
        },
        {
            id: 'university_graduate_retention',
            title: 'University Graduate Retention',
            description: 'Local graduates are leaving for bigger cities after completing their degrees.',
            choices: [
                {
                    text: 'Create internship-to-hire programs with local firms',
                    effects: { population_youngAdult: 400, happiness: 4, money: -5000 }
                },
                {
                    text: 'Offer student loan repayment assistance',
                    effects: { population_youngAdult: 300, happiness: 5, money: -12000 }
                },
                {
                    text: 'No intervention',
                    effects: { population_youngAdult: -200, happiness: -2 }
                }
            ]
        },
        {
            id: 'family_baby_boom',
            title: 'Unexpected Baby Boom',
            description: 'Birth rates are spiking unexpectedly, straining pediatric and maternity services.',
            choices: [
                {
                    text: 'Expand maternity ward capacity',
                    effects: { birthRate: 0.008, happiness: 5, money: -15000 }
                },
                {
                    text: 'Subsidize childcare for new parents',
                    effects: { birthRate: 0.004, happiness: 6, money: -8000 }
                },
                {
                    text: 'Public family planning campaign',
                    effects: { birthRate: -0.003, happiness: -1 }
                }
            ]
        },
        {
            id: 'refugee_arrival',
            title: 'Refugee Arrival',
            description: 'A group of displaced families is seeking asylum and resettlement in your region.',
            choices: [
                {
                    text: 'Provide full resettlement support',
                    effects: { population_working: 300, happiness: 3, money: -12000 }
                },
                {
                    text: 'Offer temporary shelter only',
                    effects: { population_working: 100, happiness: 0, money: -5000 }
                },
                {
                    text: 'Deny entry and redirect elsewhere',
                    effects: { population_working: 0, happiness: -4 }
                }
            ]
        },
        {
            id: 'youth_exodus',
            title: 'Young Adult Exodus',
            description: 'Young adults are leaving in search of better jobs and education elsewhere.',
            choices: [
                {
                    text: 'Launch local apprenticeship initiatives',
                    effects: { population_youngAdult: -100, happiness: 3, money: -6000 }
                },
                {
                    text: 'Offer first-home buyer grants for under-30s',
                    effects: { population_youngAdult: 200, happiness: 5, money: -15000 }
                },
                {
                    text: 'Accept the demographic shift',
                    effects: { population_youngAdult: -400, happiness: -5 }
                }
            ]
        },
        {
            id: 'international_student_arrival',
            title: 'International Student Arrival',
            description: 'Foreign university students are enrolling in local institutions.',
            choices: [
                {
                    text: 'Student housing development incentives',
                    effects: { population_youngAdult: 600, happiness: 3, money: -8000 }
                },
                {
                    text: 'Streamlined student visa processing',
                    effects: { population_youngAdult: 400, happiness: 4, money: -3000 }
                },
                {
                    text: 'Limit international enrollment',
                    effects: { population_youngAdult: -200, happiness: -2 }
                }
            ]
        },
        {
            id: 'aging_population_pressure',
            title: 'Aging Population Pressure',
            description: 'Seniors now outnumber working-age adults in several neighborhoods.',
            choices: [
                {
                    text: 'Expand senior healthcare services',
                    effects: { population_senior: 400, happiness: 3, money: -12000 }
                },
                {
                    text: 'Senior employment incentive programs',
                    effects: { population_working: 200, happiness: 2, money: -6000 }
                },
                {
                    text: 'No policy changes',
                    effects: { population_senior: 300, happiness: -3 }
                }
            ]
        },
        {
            id: 'single_parent_support',
            title: 'Single Parent Support Crisis',
            description: 'Single-parent households are struggling with childcare and employment.',
            choices: [
                {
                    text: 'Subsidized childcare program',
                    effects: { happiness: 5, crime: -2, money: -10000 }
                },
                {
                    text: 'Flexible work hour incentives for employers',
                    effects: { happiness: 3, money: -4000 }
                },
                {
                    text: 'No intervention',
                    effects: { happiness: -4, crime: 2 }
                }
            ]
        },
        {
            id: 'multigenerational_housing',
            title: 'Multigenerational Housing Trend',
            description: 'More families are living together across multiple generations under one roof.',
            choices: [
                {
                    text: 'Home renovation grants for accessory units',
                    effects: { population_working: 300, happiness: 4, money: -8000 }
                },
                {
                    text: 'Zoning changes for larger homes',
                    effects: { population_youngAdult: 200, happiness: 3, money: -3000 }
                },
                {
                    text: 'Maintain current zoning restrictions',
                    effects: { happiness: -2 }
                }
            ]
        },
        {
            id: 'digital_nomad_influx',
            title: 'Digital Nomad Influx',
            description: 'Remote workers are relocating to your area for quality of life.',
            choices: [
                {
                    text: 'Coworking space development incentives',
                    effects: { population_youngAdult: 500, happiness: 4, money: -7000 }
                },
                {
                    text: 'High-speed internet infrastructure grants',
                    effects: { population_youngAdult: 300, happiness: 3, money: -10000 }
                },
                {
                    text: 'No special accommodations',
                    effects: { population_youngAdult: 100, happiness: 0 }
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // ECONOMIC & COST OF LIVING (9 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    economic: [
        {
            id: 'rent_crisis',
            title: 'Rental Affordability Crisis',
            description: 'Rising rents are forcing low-income families into overcrowded or unsafe housing.',
            choices: [
                {
                    text: 'Rent control and tenant protections',
                    effects: { happiness: 6, crime: -2, money: -3000 }
                },
                {
                    text: 'Subsidize new affordable housing construction',
                    effects: { population_working: 200, happiness: 4, money: -15000 }
                },
                {
                    text: 'Market-based approach, no intervention',
                    effects: { happiness: -6, crime: 2 }
                }
            ]
        },
        {
            id: 'unemployment_spike',
            title: 'Local Unemployment Spike',
            description: 'A major employer announced layoffs, leaving hundreds of workers jobless.',
            choices: [
                {
                    text: 'Rapid job retraining and placement program',
                    effects: { population_working: 100, happiness: 2, money: -10000 }
                },
                {
                    text: 'Extended unemployment benefits',
                    effects: { happiness: 4, money: -8000 }
                },
                {
                    text: 'No government intervention',
                    effects: { happiness: -8, crime: 3 }
                }
            ]
        },
        {
            id: 'inflation_essentials',
            title: 'Essential Goods Inflation',
            description: 'Rising food and utility prices are straining household budgets.',
            choices: [
                {
                    text: 'Price controls on essential goods',
                    effects: { happiness: 4, crime: -1, money: -4000 }
                },
                {
                    text: 'Direct cash assistance to low-income families',
                    effects: { happiness: 6, money: -10000 }
                },
                {
                    text: 'Let markets adjust naturally',
                    effects: { happiness: -5 }
                }
            ]
        },
        {
            id: 'small_business_closures',
            title: 'Small Business Closure Wave',
            description: 'Independent shops and restaurants are shutting down due to rising costs.',
            choices: [
                {
                    text: 'Small business grants and low-interest loans',
                    effects: { population_working: 150, happiness: 4, money: -12000 }
                },
                {
                    text: 'Reduce local business taxes temporarily',
                    effects: { population_working: 80, happiness: 3, money: -5000 }
                },
                {
                    text: 'No intervention',
                    effects: { population_working: -100, happiness: -4 }
                }
            ]
        },
        {
            id: 'grocery_price_spike',
            title: 'Grocery Price Spike',
            description: 'Food prices have risen sharply, straining household food budgets.',
            choices: [
                {
                    text: 'Price controls on staple foods',
                    effects: { happiness: 4, crime: -1, money: -6000 }
                },
                {
                    text: 'Food voucher program for low-income families',
                    effects: { happiness: 6, money: -12000 }
                },
                {
                    text: 'Let markets adjust naturally',
                    effects: { happiness: -5 }
                }
            ]
        },
        {
            id: 'utility_shutoffs',
            title: 'Utility Shutoff Wave',
            description: 'Rising energy costs are causing power and water shutoffs for vulnerable households.',
            choices: [
                {
                    text: 'Utility bill assistance program',
                    effects: { happiness: 5, crime: -2, money: -10000 }
                },
                {
                    text: 'Moratorium on shutoffs during extreme weather',
                    effects: { happiness: 3, money: -4000 }
                },
                {
                    text: 'No intervention',
                    effects: { happiness: -6, crime: 3 }
                }
            ]
        },
        {
            id: 'payday_lending_clusters',
            title: 'Payday Lending Clusters',
            description: 'High-interest payday lenders are opening in low-income neighborhoods.',
            choices: [
                {
                    text: 'Interest rate caps on small loans',
                    effects: { crime: -3, happiness: 4, money: -3000 }
                },
                {
                    text: 'Financial literacy education program',
                    effects: { happiness: 2, money: -3000 }
                },
                {
                    text: 'No regulation',
                    effects: { crime: 2, happiness: -4 }
                }
            ]
        },
        {
            id: 'gig_economy_exploitation',
            title: 'Gig Economy Exploitation',
            description: 'App-based workers report wage theft and dangerous working conditions.',
            choices: [
                {
                    text: 'Gig worker protection ordinance',
                    effects: { happiness: 4, crime: -1, money: -5000 }
                },
                {
                    text: 'Portable benefits fund for gig workers',
                    effects: { happiness: 5, money: -8000 }
                },
                {
                    text: 'No intervention',
                    effects: { happiness: -3, crime: 2 }
                }
            ]
        },
        {
            id: 'craft_business_boom',
            title: 'Craft Business Boom',
            description: 'Artisanal and craft businesses are thriving, creating niche employment.',
            choices: [
                {
                    text: 'Craft market and festival support',
                    effects: { population_working: 200, happiness: 5, money: -6000 }
                },
                {
                    text: 'Small business incubator program',
                    effects: { population_working: 150, happiness: 4, money: -10000 }
                },
                {
                    text: 'No intervention',
                    effects: { population_working: 50, happiness: 1 }
                }
            ]
        }
    ],

    // ═════════════════════════════════════════════════════════════════════════════
    // INFRASTRUCTURE & SERVICES (8 situations)
    // ═════════════════════════════════════════════════════════════════════════════
    infrastructure: [
        {
            id: 'public_transit_cuts',
            title: 'Public Transit Service Cuts',
            description: 'Budget shortfalls are forcing reductions in bus routes and frequency.',
            choices: [
                {
                    text: 'Increase transit subsidy to maintain service',
                    effects: { happiness: 4, crime: -1, money: -7000 }
                },
                {
                    text: 'Introduce rideshare vouchers for affected routes',
                    effects: { happiness: 2, money: -4000 }
                },
                {
                    text: 'Proceed with service reductions',
                    effects: { happiness: -6, crime: 2 }
                }
            ]
        },
        {
            id: 'library_hours_reduction',
            title: 'Library Hours Reduction',
            description: 'Funding cuts are forcing public libraries to reduce operating hours.',
            choices: [
                {
                    text: 'Restore funding and extend hours',
                    effects: { happiness: 3, money: -3000 }
                },
                {
                    text: 'Partner with schools for shared access',
                    effects: { happiness: 1, money: -1000 }
                },
                {
                    text: 'Accept reduced hours',
                    effects: { happiness: -3 }
                }
            ]
        },
        {
            id: 'park_maintenance_backlog',
            title: 'Park Maintenance Backlog',
            description: 'Public parks are overgrown and playground equipment needs repair.',
            choices: [
                {
                    text: 'Emergency park maintenance blitz',
                    effects: { happiness: 5, crime: -2, money: -6000 }
                },
                {
                    text: 'Adopt-a-park volunteer program',
                    effects: { happiness: 3, money: -1000 }
                },
                {
                    text: 'Defer maintenance to next budget year',
                    effects: { happiness: -4, crime: 1 }
                }
            ]
        },
        {
            id: 'pothole_crisis',
            title: 'Pothole Crisis',
            description: 'Winter freeze-thaw cycles have left roads full of dangerous potholes.',
            choices: [
                {
                    text: 'Emergency road repair crews',
                    effects: { happiness: 5, crime: -1, money: -10000 }
                },
                {
                    text: 'Prioritize major arterial roads',
                    effects: { happiness: 3, money: -6000 }
                },
                {
                    text: 'Defer repairs to next budget',
                    effects: { happiness: -6, crime: 2 }
                }
            ]
        },
        {
            id: 'street_light_outages',
            title: 'Street Light Outages',
            description: 'Many street lights are burned out, leaving neighborhoods dark at night.',
            choices: [
                {
                    text: 'Replace all burned-out bulbs',
                    effects: { crime: -6, happiness: 4, money: -8000 }
                },
                {
                    text: 'Convert to energy-efficient LED lighting',
                    effects: { crime: -4, happiness: 3, money: -15000 }
                },
                {
                    text: 'Replace only high-crime areas',
                    effects: { crime: -3, happiness: 1 }
                }
            ]
        },
        {
            id: 'garbage_collection_delays',
            title: 'Garbage Collection Delays',
            description: 'Trash pickup is running days behind schedule, creating sanitation issues.',
            choices: [
                {
                    text: 'Hire additional sanitation workers',
                    effects: { disease: -4, happiness: 4, money: -10000 }
                },
                {
                    text: 'Contract with private waste company',
                    effects: { disease: -2, happiness: 2, money: -7000 }
                },
                {
                    text: 'Reduce pickup frequency',
                    effects: { disease: 4, happiness: -6 }
                }
            ]
        },
        {
            id: 'public_restroom_shortage',
            title: 'Public Restroom Shortage',
            description: 'Lack of public restrooms is creating sanitation and quality-of-life issues downtown.',
            choices: [
                {
                    text: 'Install new public restroom facilities',
                    effects: { disease: -3, happiness: 4, money: -9000 }
                },
                {
                    text: 'Partner with businesses for restroom access',
                    effects: { disease: -2, happiness: 2, money: -3000 }
                },
                {
                    text: 'No new facilities',
                    effects: { disease: 2, happiness: -4 }
                }
            ]
        },
        {
            id: 'bike_lane_conflicts',
            title: 'Bike Lane Conflicts',
            description: 'New bike lanes are creating tensions between cyclists and drivers.',
            choices: [
                {
                    text: 'Protected bike lane infrastructure',
                    effects: { crime: -1, happiness: 3, money: -12000 }
                },
                {
                    text: 'Shared lane signage and education',
                    effects: { happiness: 1, money: -3000 }
                },
                {
                    text: 'Remove bike lanes',
                    effects: { happiness: -4, crime: 1 }
                }
            ]
        }
    ]
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PopulationSituations;
} else if (typeof window !== 'undefined') {
    window.PopulationSituations = PopulationSituations;
}

