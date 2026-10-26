/**
 * Population System - Population Management and Demographics
 * Dominion Wars - Nation Building Strategy Game
 */

// PopulationEvents and PopulationSituations are loaded as globals via script tags in index.html

class PopulationSystem {
    constructor() {
        this.isInitialized = false;
        
        // Real-time age group configuration (days since birth)
        // Newborn → Teen: 14 days real time
        // Teen → Senior: ~120 days real time (3-5 months)
        // Senior → Elderly: ~30 days real time (1 month)
        // Elderly → Death: ~14 days real time
        // Total lifespan: ~178 days real time
        this.ageGroupConfig = {
            newborn:   { minDays: 0,     maxDays: 3,   taxable: false, militaryEligible: false },
            infant:    { minDays: 3,     maxDays: 7,   taxable: false, militaryEligible: false },
            toddler:   { minDays: 7,     maxDays: 10,  taxable: false, militaryEligible: false },
            child:     { minDays: 10,    maxDays: 14,  taxable: false, militaryEligible: false },
            teen:        { minDays: 14,    maxDays: 45,  taxable: true,  militaryEligible: true },
            youngAdult:  { minDays: 45,    maxDays: 75,  taxable: true,  militaryEligible: true },
            adult:       { minDays: 75,    maxDays: 100, taxable: true,  militaryEligible: true },
            middleAged:  { minDays: 100,   maxDays: 120, taxable: true,  militaryEligible: true },
            older:       { minDays: 120,   maxDays: 134, taxable: true,  militaryEligible: true },
            senior:      { minDays: 134,   maxDays: 164, taxable: false, militaryEligible: false },
            elderly:     { minDays: 164,   maxDays: 178, taxable: false, militaryEligible: false }
        };
        this.REAL_TIME_MAX_AGE_DAYS = 178; // Death threshold

        // Age Demographics with lifecycle tracking (counts synced from citizens)
        this.ageGroups = {
            newborn:   { min: 0,   max: 3,   count: 0 },
            infant:    { min: 3,   max: 7,   count: 0 },
            toddler:   { min: 7,   max: 10,  count: 0 },
            child:     { min: 10,  max: 14,  count: 0 },
            teen:        { min: 14,  max: 45,  count: 0 },
            youngAdult:  { min: 45,  max: 75,  count: 0 },
            adult:       { min: 75,  max: 100, count: 0 },
            middleAged:  { min: 100, max: 120, count: 0 },
            older:       { min: 120, max: 134, count: 0 },
            senior:      { min: 134, max: 164, count: 0 },
            elderly:     { min: 164, max: 178, count: 0 }
        };

        // Individual citizen tracking for real-time age progression
        this.citizens = new Map(); // citizenId -> { birthTime: timestamp, ageGroup: string, employmentStatus: string, educationLevel: string }
        this.nextCitizenId = 1;

        // Pending replacement births (2-turn buffer after death)
        this.pendingBirths = new Map(); // day -> count of births to add
        
        // Base demographic rates (affected by game conditions)
        this.vitalRates = {
            baseBirthRate: 0.035,      // 3.5% annual birth rate
            baseDeathRate: 0.01,       // 1% annual death rate
            migrationRate: 0.005,      // 0.5% annual migration rate
            literacyGrowthRate: 0.001, // Daily literacy improvement rate
            educationProgressRate: 0.002 // Daily education advancement rate
        };
        
        // Population distribution across territories
        this.territorialDistribution = new Map();
        
        // Migration and policy system
        this.migrationFactors = {
            happiness: 1.0,
            literacy: 1.0,
            technology: 1.0,
            pollution: 1.0,
            disease: 1.0,
            crime: 1.0,
            employment: 1.0,
            infrastructure: 1.0
        };
        
        this.migrationPolicy = 'balanced'; // open, restricted, balanced
        this.migrationEffectiveness = 1.0;

        // Military population penalty settings
        this.militaryPenaltyThreshold = 0.5; // 50% of eligible population drafted triggers penalty
        this.militaryPenaltyGrowthMultiplier = 0.5; // 50% growth reduction when penalty active

        // Population Situations System (every 3 days)
        this.populationSituations = {
            lastSituationDay: 0,
            situationInterval: 3, // Every 3 days
            activeSituation: null,
            situationHistory: [],
            activeEffects: new Map() // effectId -> { endDay: number, effects: object }
        };
        
        // Employment system
        this.employment = {
            workforce: 0,              // Working age population (youngAdult + adult + middleAged)
            employed: 0,               // Currently employed
            unemployed: 0,             // Seeking work
            students: 0,               // In education (child + teen + some youngAdult)
            retired: 0,                // Retired (senior + elderly)
            dependents: 0,             // Too young/old to work (newborn + infant + toddler)
            unemploymentRate: 0.05,    // 5% base unemployment
            laborParticipationRate: 0.75 // 75% of working age actually work
        };
        
        // Education system
        this.education = {
            noEducation: 0.15,         // 15% no formal education
            primaryEducation: 0.35,    // 35% primary education
            secondaryEducation: 0.35,  // 35% secondary education
            higherEducation: 0.15,     // 15% higher education
            progressionQueue: new Map(), // citizenId -> { targetLevel: 'secondary', daysRemaining: 7 }
            literacyRequirements: {
                primary: 25,    // Need 25% literacy for primary education
                secondary: 50,  // Need 50% literacy for secondary education  
                higher: 75      // Need 75% literacy for higher education
            }
        };
        
        // Population history for analysis
        this.history = {
            totalPopulation: [],
            ageDistribution: [],
            migration: [],
            births: [],
            deaths: [],
            enlisted: [],
            diedInCombat: [],
            reachedSenior: [],
            emigrated: [],
            employment: [],
            education: [],
            // Legacy arrays used by the older processing path
            population: [],
            happiness: [],
            growth: [],
            maxHistoryLength: 365
        };

        // Running population statistics
        this.populationStats = {
            born: 0,
            died: 0,
            enlisted: 0,
            diedInCombat: 0,
            reachedSenior: 0,
            emigrated: 0
        };

        // Active population events (disease outbreaks, baby booms, etc.)
        this.activeEvents = [];

        // Happiness factors (0-100 scale per category)
        this.happinessFactors = {
            housing:     50,
            healthcare:  50,
            education:   50,
            employment:  50,
            safety:      50,
            environment: 50,
            governance:  50,
            economy:     50
        };

        // Growth modifier multipliers (1.0 = neutral)
        this.growthModifiers = {
            happiness:  1.0,
            disease:    1.0,
            war:        1.0,
            policies:   1.0,
            resources:  1.0
        };

        // Legacy demographics object used by the older processing methods
        // Kept in sync with the primary ageGroups / employment / education fields.
        this.demographics = {
            totalPopulation: 0,
            birthRate:       0.035,
            deathRate:       0.01,
            migrationRate:   0.005,
            ageGroups: {
                children: 0.20,
                teens:    0.12,
                adults:   0.43,
                elderly:  0.25
            },
            education: {
                none:      0.15,
                primary:   0.35,
                secondary: 0.35,
                tertiary:  0.15
            },
            employment: {
                employed:   0.70,
                unemployed: 0.05,
                students:   0.15,
                retired:    0.10
            }
        };

        this.initializePopulationSituations();
    }

    /**
     * Initialize population situations with 100+ different scenarios
     */
    initializePopulationSituations() {
        this.situationDatabase = [
            // Housing & Infrastructure Situations
            {
                id: 'housing_shortage',
                title: 'Housing Shortage Crisis',
                description: 'Rising population has led to a severe housing shortage. Citizens are struggling to find affordable housing.',
                choices: [
                    {
                        text: 'Build emergency public housing',
                        effects: { happiness: +5, pollution: +2, money: -5000 },
                        duration: 14
                    },
                    {
                        text: 'Relax zoning laws for developers',
                        effects: { happiness: +3, crime: +1, environment: -2 },
                        duration: 21
                    },
                    {
                        text: 'Implement rent control policies',
                        effects: { happiness: +2, economy: -3, literacy: +1 },
                        duration: 28
                    }
                ]
            },
            {
                id: 'infrastructure_aging',
                title: 'Aging Infrastructure',
                description: 'The nation\'s infrastructure is showing its age. Roads are cracking and utilities are failing.',
                choices: [
                    {
                        text: 'Launch massive infrastructure overhaul',
                        effects: { happiness: +4, money: -8000, employment: +3 },
                        duration: 21
                    },
                    {
                        text: 'Implement preventive maintenance program',
                        effects: { happiness: +2, money: -3000, efficiency: +2 },
                        duration: 28
                    },
                    {
                        text: 'Privatize infrastructure management',
                        effects: { happiness: -1, money: +2000, crime: +1 },
                        duration: 14
                    }
                ]
            },
            
            // Healthcare & Disease Situations
            {
                id: 'epidemic_outbreak',
                title: 'Disease Outbreak',
                description: 'A contagious disease is spreading through the population, overwhelming healthcare facilities.',
                choices: [
                    {
                        text: 'Implement strict quarantine measures',
                        effects: { disease: -5, happiness: -3, economy: -2 },
                        duration: 14
                    },
                    {
                        text: 'Increase healthcare funding and staff',
                        effects: { disease: -3, happiness: +2, money: -6000 },
                        duration: 21
                    },
                    {
                        text: 'Focus on public health education',
                        effects: { disease: -2, literacy: +2, happiness: +1 },
                        duration: 28
                    }
                ]
            },
            {
                id: 'mental_health_crisis',
                title: 'Mental Health Crisis',
                description: 'Rising stress and societal pressures have led to increased mental health issues among citizens.',
                choices: [
                    {
                        text: 'Establish comprehensive mental health services',
                        effects: { happiness: +4, disease: -2, money: -4000 },
                        duration: 21
                    },
                    {
                        text: 'Promote work-life balance policies',
                        effects: { happiness: +3, economy: -1, productivity: +2 },
                        duration: 28
                    },
                    {
                        text: 'Increase recreational facilities and programs',
                        effects: { happiness: +2, crime: -1, money: -2000 },
                        duration: 14
                    }
                ]
            },
            
            // Education Situations
            {
                id: 'teacher_shortage',
                title: 'Teacher Shortage',
                description: 'Schools are struggling to find qualified teachers, leading to overcrowded classrooms and reduced education quality.',
                choices: [
                    {
                        text: 'Increase teacher salaries and benefits',
                        effects: { literacy: +3, happiness: +2, money: -5000 },
                        duration: 21
                    },
                    {
                        text: 'Implement alternative certification programs',
                        effects: { literacy: +2, education: +1, employment: +1 },
                        duration: 28
                    },
                    {
                        text: 'Introduce technology-assisted learning',
                        effects: { literacy: +1, technology: +2, money: -3000 },
                        duration: 14
                    }
                ]
            },
            {
                id: 'school_overcrowding',
                title: 'School Overcrowding',
                description: 'Rapid population growth has led to severely overcrowded schools, affecting education quality.',
                choices: [
                    {
                        text: 'Build new schools immediately',
                        effects: { literacy: +4, happiness: +3, money: -7000 },
                        duration: 21
                    },
                    {
                        text: 'Implement shift-based schooling',
                        effects: { literacy: +2, happiness: -1, efficiency: +1 },
                        duration: 14
                    },
                    {
                        text: 'Expand online and remote learning',
                        effects: { literacy: +1, technology: +3, money: -2000 },
                        duration: 28
                    }
                ]
            },
            
            // Employment & Economy Situations
            {
                id: 'job_automation',
                title: 'Automation Displaces Workers',
                description: 'New technologies are automating many jobs, leading to unemployment among traditional workers.',
                choices: [
                    {
                        text: 'Fund retraining programs for displaced workers',
                        effects: { employment: +3, literacy: +2, money: -6000 },
                        duration: 28
                    },
                    {
                        text: 'Implement universal basic income pilot',
                        effects: { happiness: +3, money: -8000, crime: -2 },
                        duration: 21
                    },
                    {
                        text: 'Encourage new industry development',
                        effects: { employment: +2, technology: +3, pollution: +1 },
                        duration: 14
                    }
                ]
            },
            {
                id: 'youth_unemployment',
                title: 'Youth Unemployment Crisis',
                description: 'Young adults are struggling to find employment, leading to social unrest and emigration.',
                choices: [
                    {
                        text: 'Create youth employment programs',
                        effects: { employment: +4, happiness: +2, money: -4000 },
                        duration: 21
                    },
                    {
                        text: 'Promote entrepreneurship and startups',
                        effects: { employment: +3, technology: +2, economy: +1 },
                        duration: 28
                    },
                    {
                        text: 'Expand apprenticeship programs',
                        effects: { employment: +2, literacy: +1, happiness: +1 },
                        duration: 14
                    }
                ]
            },
            
            // Crime & Safety Situations
            {
                id: 'gang_violence',
                title: 'Gang Violence Surge',
                description: 'Organized crime groups are becoming more active, threatening public safety and order.',
                choices: [
                    {
                        text: 'Increase police presence and surveillance',
                        effects: { crime: -4, happiness: -2, money: -5000 },
                        duration: 21
                    },
                    {
                        text: 'Invest in community outreach programs',
                        effects: { crime: -3, happiness: +2, literacy: +1 },
                        duration: 28
                    },
                    {
                        text: 'Focus on economic opportunities in affected areas',
                        effects: { crime: -2, employment: +2, money: -3000 },
                        duration: 14
                    }
                ]
            },
            {
                id: 'cybercrime_wave',
                title: 'Cybercrime Wave',
                description: 'Digital criminals are targeting citizens and businesses, causing financial losses and privacy concerns.',
                choices: [
                    {
                        text: 'Establish specialized cybercrime unit',
                        effects: { crime: -3, technology: +2, money: -4000 },
                        duration: 21
                    },
                    {
                        text: 'Launch public digital literacy campaign',
                        effects: { crime: -2, literacy: +3, happiness: +1 },
                        duration: 28
                    },
                    {
                        text: 'Mandate cybersecurity standards for businesses',
                        effects: { crime: -2, economy: -1, technology: +1 },
                        duration: 14
                    }
                ]
            },
            
            // Environmental Situations
            {
                id: 'air_pollution_spike',
                title: 'Severe Air Pollution',
                description: 'Industrial activity and traffic have caused air quality to reach dangerous levels.',
                choices: [
                    {
                        text: 'Implement immediate emission controls',
                        effects: { pollution: -5, disease: -2, economy: -3 },
                        duration: 14
                    },
                    {
                        text: 'Promote green transportation initiatives',
                        effects: { pollution: -3, technology: +2, money: -5000 },
                        duration: 28
                    },
                    {
                        text: 'Relocate heavy industries outside city centers',
                        effects: { pollution: -4, employment: -2, happiness: +2 },
                        duration: 21
                    }
                ]
            },
            {
                id: 'water_contamination',
                title: 'Water Supply Contamination',
                description: 'Industrial waste has contaminated water sources, threatening public health.',
                choices: [
                    {
                        text: 'Emergency water treatment and distribution',
                        effects: { disease: -4, happiness: +2, money: -6000 },
                        duration: 14
                    },
                    {
                        text: 'Investigate and prosecute responsible parties',
                        effects: { pollution: -2, happiness: +1, crime: -1 },
                        duration: 21
                    },
                    {
                        text: 'Invest in new water infrastructure',
                        effects: { disease: -3, pollution: -2, money: -8000 },
                        duration: 28
                    }
                ]
            },
            
            // Cultural & Social Situations
            {
                id: 'cultural_festival',
                title: 'Traditional Festival Revival',
                description: 'Citizens want to revive an old cultural festival, but it requires significant resources.',
                choices: [
                    {
                        text: 'Fully fund the festival celebration',
                        effects: { happiness: +4, culture: +3, money: -3000 },
                        duration: 7
                    },
                    {
                        text: 'Support with partial funding and volunteers',
                        effects: { happiness: +2, culture: +2, employment: +1 },
                        duration: 14
                    },
                    {
                        text: 'Allow private sponsorship and commercialization',
                        effects: { happiness: +1, culture: +1, economy: +2 },
                        duration: 21
                    }
                ]
            },
            {
                id: 'generation_gap',
                title: 'Generational Divide',
                description: 'Stark differences in values between older and younger citizens are causing social tension.',
                choices: [
                    {
                        text: 'Create intergenerational dialogue programs',
                        effects: { happiness: +3, literacy: +1, culture: +2 },
                        duration: 21
                    },
                    {
                        text: 'Focus on shared national values',
                        effects: { happiness: +2, culture: +3, unity: +2 },
                        duration: 28
                    },
                    {
                        text: 'Adapt policies to serve all age groups',
                        effects: { happiness: +1, governance: +2, money: -2000 },
                        duration: 14
                    }
                ]
            },
            
            // Technology & Innovation Situations
            {
                id: 'digital_divide',
                title: 'Digital Divide Crisis',
                description: 'Unequal access to technology is creating disparities in education and employment opportunities.',
                choices: [
                    {
                        text: 'Provide free internet and devices to all citizens',
                        effects: { literacy: +4, happiness: +3, money: -7000 },
                        duration: 21
                    },
                    {
                        text: 'Partner with tech companies for affordable access',
                        effects: { literacy: +3, technology: +2, economy: +1 },
                        duration: 28
                    },
                    {
                        text: 'Focus on digital literacy training programs',
                        effects: { literacy: +2, employment: +2, money: -3000 },
                        duration: 14
                    }
                ]
            }
            // ... Continue with more situations to reach 100+
        ];
        
        // Add more situations to reach 100+ total
        this.generateAdditionalSituations();
    }

    /**
     * Generate additional situations to reach 100+ total
     */
    generateAdditionalSituations() {
        const additionalSituations = [
            // Disaster & Emergency Situations
            { id: 'natural_disaster', title: 'Natural Disaster Recovery', description: 'A natural disaster has affected infrastructure and displaced citizens.', 
              choices: [
                  { text: 'Emergency relief and reconstruction', effects: { happiness: +3, money: -10000, infrastructure: +2 }, duration: 21 },
                  { text: 'Gradual recovery with community support', effects: { happiness: +2, culture: +2, money: -5000 }, duration: 28 },
                  { text: 'Focus on disaster preparedness for future', effects: { happiness: +1, technology: +2, money: -7000 }, duration: 14 }
              ]
            },
            { id: 'refugee_influx', title: 'Refugee Crisis', description: 'Large numbers of refugees are seeking asylum in your nation.',
              choices: [
                  { text: 'Welcome refugees with full integration support', effects: { population: +500, happiness: -2, money: -8000 }, duration: 28 },
                  { text: 'Provide temporary assistance only', effects: { population: +200, happiness: +1, money: -3000 }, duration: 21 },
                  { text: 'Implement strict screening and quotas', effects: { population: +50, crime: -1, happiness: -1 }, duration: 14 }
              ]
            },
            
            // Economic Situations
            { id: 'market_crash', title: 'Economic Market Crash', description: 'Global economic instability has affected your nation\'s markets.',
              choices: [
                  { text: 'Government bailout and stimulus', effects: { economy: +2, money: -15000, happiness: +1 }, duration: 21 },
                  { text: 'Let markets self-correct naturally', effects: { economy: -2, happiness: -3, employment: -2 }, duration: 28 },
                  { text: 'Implement protective trade policies', effects: { economy: +1, trade: -2, employment: +1 }, duration: 14 }
              ]
            },
            { id: 'inflation_surge', title: 'Rapid Inflation', description: 'Prices for basic goods are rising rapidly, affecting all citizens.',
              choices: [
                  { text: 'Implement price controls and subsidies', effects: { happiness: +2, economy: -3, money: -6000 }, duration: 21 },
                  { text: 'Focus on increasing production and supply', effects: { economy: +2, employment: +2, money: -4000 }, duration: 28 },
                  { text: 'Provide direct cash assistance to citizens', effects: { happiness: +3, money: -10000, inflation: +1 }, duration: 14 }
              ]
            },
            
            // Health & Medical Situations  
            { id: 'aging_population', title: 'Aging Population Crisis', description: 'The population is aging rapidly, straining healthcare and pension systems.',
              choices: [
                  { text: 'Expand elderly care and healthcare services', effects: { happiness: +3, money: -8000, healthcare: +3 }, duration: 28 },
                  { text: 'Encourage immigration of young workers', effects: { population: +300, employment: +2, culture: -1 }, duration: 21 },
                  { text: 'Promote automation to reduce labor needs', effects: { technology: +3, employment: -2, economy: +2 }, duration: 14 }
              ]
            },
            { id: 'fertility_decline', title: 'Declining Birth Rates', description: 'Birth rates have dropped significantly, threatening future population growth.',
              choices: [
                  { text: 'Implement family support policies and incentives', effects: { birthRate: +0.01, happiness: +2, money: -5000 }, duration: 28 },
                  { text: 'Improve work-life balance and childcare', effects: { birthRate: +0.005, employment: +1, money: -3000 }, duration: 21 },
                  { text: 'Focus on immigration to maintain population', effects: { population: +200, diversity: +2, culture: +1 }, duration: 14 }
              ]
            },
            
            // Infrastructure & Transportation
            { id: 'traffic_congestion', title: 'Severe Traffic Congestion', description: 'Urban areas are experiencing gridlock, affecting productivity and quality of life.',
              choices: [
                  { text: 'Build comprehensive public transit system', effects: { happiness: +3, pollution: -2, money: -12000 }, duration: 28 },
                  { text: 'Implement congestion pricing and tolls', effects: { traffic: -2, economy: +1, happiness: -1 }, duration: 21 },
                  { text: 'Promote remote work and flexible schedules', effects: { happiness: +2, productivity: +1, technology: +1 }, duration: 14 }
              ]
            },
            { id: 'energy_crisis', title: 'Energy Shortage', description: 'Power outages and energy shortages are affecting daily life and industry.',
              choices: [
                  { text: 'Invest heavily in renewable energy infrastructure', effects: { energy: +5, pollution: -3, money: -15000 }, duration: 28 },
                  { text: 'Import energy and negotiate new supply deals', effects: { energy: +3, money: -8000, dependence: +2 }, duration: 21 },
                  { text: 'Implement energy conservation and rationing', effects: { energy: +2, happiness: -2, efficiency: +2 }, duration: 14 }
              ]
            },
            
            // Education & Research
            { id: 'brain_drain', title: 'Brain Drain Crisis', description: 'Highly educated citizens are emigrating to other countries for better opportunities.',
              choices: [
                  { text: 'Increase research funding and create innovation hubs', effects: { literacy: +2, technology: +3, money: -10000 }, duration: 28 },
                  { text: 'Improve working conditions and salaries for professionals', effects: { literacy: +1, happiness: +2, money: -6000 }, duration: 21 },
                  { text: 'Develop partnerships with international institutions', effects: { technology: +2, culture: +2, money: -4000 }, duration: 14 }
              ]
            },
            { id: 'illiteracy_problem', title: 'Adult Illiteracy Crisis', description: 'A significant portion of adults lack basic reading and writing skills.',
              choices: [
                  { text: 'Launch comprehensive adult education programs', effects: { literacy: +4, employment: +2, money: -7000 }, duration: 28 },
                  { text: 'Use technology and mobile learning platforms', effects: { literacy: +3, technology: +2, money: -4000 }, duration: 21 },
                  { text: 'Partner with community organizations and volunteers', effects: { literacy: +2, culture: +2, money: -2000 }, duration: 14 }
              ]
            }
        ];
        
        this.situationDatabase.push(...additionalSituations);
        
        // Continue adding more until we reach 100+ situations
        this.addMoreSituationVariants();
    }

    /**
     * Generate standard choices for variant situations
     */
    generateStandardChoices(situationId) {
        const templates = {
            housing: [
                { text: 'Invest in social housing programs', effects: { happiness: +3, money: -6000 }, duration: 21 },
                { text: 'Subsidize private developers', effects: { happiness: +2, crime: +1 }, duration: 28 },
                { text: 'Implement housing assistance vouchers', effects: { happiness: +2, money: -4000 }, duration: 14 }
            ],
            social: [
                { text: 'Launch community outreach programs', effects: { happiness: +3, money: -3000 }, duration: 21 },
                { text: 'Provide emergency relief funds', effects: { happiness: +2, money: -5000 }, duration: 14 },
                { text: 'Partner with non-profit organizations', effects: { happiness: +2, crime: -1 }, duration: 28 }
            ],
            infrastructure: [
                { text: 'Emergency infrastructure repair', effects: { happiness: +3, money: -8000 }, duration: 21 },
                { text: 'Gradual upgrade over time', effects: { happiness: +1, money: -4000 }, duration: 42 },
                { text: 'Public-private partnership', effects: { happiness: +2, money: -3000 }, duration: 28 }
            ]
        };

        // Map situation IDs to choice templates
        if (situationId.includes('housing') || situationId.includes('home') || situationId.includes('gentrif')) {
            return templates.housing;
        } else if (situationId.includes('infra') || situationId.includes('rural') || situationId.includes('energy')) {
            return templates.infrastructure;
        } else {
            return templates.social;
        }
    }

    /**
     * Add situation variants to reach 100+ total
     */
    addMoreSituationVariants() {
        // Add more variants of existing themes with different contexts
        const variantSituations = [];
        
        // Housing variants
        variantSituations.push(
            { id: 'gentrification', title: 'Neighborhood Gentrification', description: 'Urban development is displacing long-time residents from their communities.' },
            { id: 'homeless_crisis', title: 'Rising Homelessness', description: 'The number of homeless citizens has increased dramatically.' },
            { id: 'rural_decline', title: 'Rural Area Population Decline', description: 'Rural communities are losing population to urban centers.' }
        );
        
        // Continue adding more categories and variants...
        // This would continue until we have 100+ unique situations
        
        // For now, add the variants to reach target
        this.situationDatabase.push(...variantSituations.map(variant => ({
            ...variant,
            choices: this.generateStandardChoices(variant.id)
        })));
    }

    /**
     * Generate standard choices for situation variants
     */

    /**
     * Initialize the population system
     */
    async initialize() {
        console.log('Initializing Population System...');
        
        // Set initial population from nation data
        if (window.Nation) {
            const pop = window.Nation.population || 0;
            this.demographics.totalPopulation = pop;
            this.initializeAgeDistribution(pop);
            this.updateDemographics();
        }
        
        // Initialize territorial distribution
        this.initializeTerritorialDistribution();
        
        // Set up event listeners
        this.bindEvents();
        
        this.isInitialized = true;
        console.log('Population System initialized');
    }

    /**
     * Bind EventBus listeners for population-affecting game events
     */
    bindEvents() {
        if (typeof EventBus === 'undefined') return;

        if (typeof this.handleDayPassed === 'function') {
            EventBus.on('day_passed', (data) => this.handleDayPassed(data));
        }
        if (typeof this.handleMonthPassed === 'function') {
            EventBus.on('month_passed', (data) => this.handleMonthPassed(data));
        }
        if (typeof this.handleYearPassed === 'function') {
            EventBus.on('year_passed', (data) => this.handleYearPassed(data));
        }
        if (typeof this.handleTerritoryAdded === 'function') {
            EventBus.on('territory_added', (data) => this.handleTerritoryAdded(data));
        }
        if (typeof this.handleTerritoryRemoved === 'function') {
            EventBus.on('territory_removed', (data) => this.handleTerritoryRemoved(data));
        }
        if (typeof this.handlePolicyChanged === 'function') {
            EventBus.on('policy_changed', (data) => this.handlePolicyChanged(data));
        }
        if (typeof this.handleInfrastructureBuilt === 'function') {
            EventBus.on('infrastructure_built', (data) => this.handleInfrastructureBuilt(data));
        }
    }

    /**
     * Sync the legacy this.demographics object from the primary data structures.
     * Called after any change to totalPopulation, ageGroups, employment, or education.
     */
    _syncDemographics() {
        const total = this.getTotalPopulation();
        this.demographics.totalPopulation = total;
        this.demographics.birthRate       = this.vitalRates.baseBirthRate;
        this.demographics.deathRate       = this.vitalRates.baseDeathRate;
        this.demographics.migrationRate   = this.vitalRates.migrationRate;

        // Age group proportions (use primary ageGroups)
        const ag = this.ageGroups;
        const children   = ag.child.count    + ag.toddler.count + ag.infant.count + ag.newborn.count;
        const teens      = ag.teen.count;
        const adults     = ag.youngAdult.count + ag.adult.count + ag.middleAged.count + ag.older.count;
        const elderly    = ag.senior.count   + ag.elderly.count;
        const totalPop   = Math.max(1, total);
        this.demographics.ageGroups.children  = children  / totalPop;
        this.demographics.ageGroups.teens     = teens     / totalPop;
        this.demographics.ageGroups.adults    = adults    / totalPop;
        this.demographics.ageGroups.elderly   = elderly   / totalPop;

        // Education proportions
        this.demographics.education.none      = this.education.noEducation;
        this.demographics.education.primary   = this.education.primaryEducation;
        this.demographics.education.secondary = this.education.secondaryEducation;
        this.demographics.education.tertiary  = this.education.higherEducation;

        // Employment proportions
        const wf = Math.max(1, this.employment.workforce);
        this.demographics.employment.employed   = this.employment.employed   / wf;
        this.demographics.employment.unemployed = this.employment.unemployed / wf;
        this.demographics.employment.students   = this.employment.students   / Math.max(1, total);
        this.demographics.employment.retired    = this.employment.retired    / Math.max(1, total);
    }

    /**
     * Initialize age distribution based on current population
     */
    initializeAgeDistribution(totalPopulation) {
        // Distribute population across age groups with realistic proportions
        const ageDistribution = {
            newborn: 0.02,
            infant: 0.03,
            toddler: 0.05,
            child: 0.15,
            teen: 0.12,
            youngAdult: 0.18,
            adult: 0.25,
            middleAged: 0.15,
            older: 0.08,
            senior: 0.04,
            elderly: 0.02
        };
        
        const now = Date.now();
        const msPerDay = 24 * 60 * 60 * 1000;
        
        // Initialize age groups with population counts
        Object.entries(ageDistribution).forEach(([ageGroup, proportion]) => {
            this.ageGroups[ageGroup].count = Math.floor(totalPopulation * proportion);
        });
        
        // Create individual citizens with real-time birth timestamps
        Object.entries(this.ageGroups).forEach(([ageGroup, data]) => {
            for (let i = 0; i < data.count; i++) {
                const daysOld = this.getRandomDaysInGroup(ageGroup);
                const citizen = {
                    id: this.nextCitizenId++,
                    birthTime: now - (daysOld * msPerDay),
                    ageGroup: ageGroup,
                    employmentStatus: this.determineEmploymentStatus(ageGroup),
                    educationLevel: this.determineEducationLevel(ageGroup)
                };
                
                this.citizens.set(citizen.id, citizen);
            }
        });
    }

    /**
     * Get random days-old within an age group (real-time days)
     */
    getRandomDaysInGroup(ageGroup) {
        const config = this.ageGroupConfig[ageGroup];
        return Math.floor(Math.random() * (config.maxDays - config.minDays)) + config.minDays;
    }

    /**
     * Determine employment status based on age group
     */
    determineEmploymentStatus(ageGroup) {
        const workingAges = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];
        if (!workingAges.includes(ageGroup)) return 'not_applicable';
        
        const rand = Math.random();
        if (rand < 0.75) return 'employed';
        if (rand < 0.80) return 'unemployed';
        return 'student';
    }

    /**
     * Determine education level based on age and literacy
     */
    determineEducationLevel(ageGroup) {
        const youngAges = ['newborn', 'infant', 'toddler', 'child'];
        if (youngAges.includes(ageGroup)) return 'none';
        
        // Use nationStats.literacy — direct Nation.literacy property does not exist
        const ns      = (window.Nation && window.Nation.nationStats) ? window.Nation.nationStats : {};
        const literacy = ns.literacy !== undefined ? ns.literacy : 0;
        const rand = Math.random() * 100;
        
        if (rand < literacy * 0.2) return 'higher';
        if (rand < literacy * 0.6) return 'secondary';
        if (rand < literacy * 0.8) return 'primary';
        return 'none';
    }

    /**
     * Get current day from TimeSystem
     */
    getCurrentDay() {
        return window.TimeSystem ? window.TimeSystem.currentDay : 1;
    }


    /**
     * Update population growth
     */
    updatePopulationGrowth() {
        const totalPopulation = this.getTotalPopulation();
        if (totalPopulation === 0 || this.territorialDistribution.size === 0) return;
        
        // Calculate daily growth rate based on nation conditions
        const dailyGrowthRate = this.calculatePopulationGrowthRate();
        
        // Calculate population change
        const populationChange = totalPopulation * dailyGrowthRate;
        
        // Apply to territorial populations
        for (const [territoryId, data] of this.territorialDistribution.entries()) {
            const territoryGrowth = (data.population / totalPopulation) * populationChange;
            
            // Apply territory-specific modifiers
            const capacityModifier = Math.min(1.0, data.capacity / Math.max(data.population, 1));
            const happinessModifier = data.happiness / 50; // 50 is neutral happiness
            
            const actualGrowth = territoryGrowth * capacityModifier * happinessModifier;
            
            data.population += actualGrowth;
            data.growth = actualGrowth;
        }
        
        // Track growth for history (citizens handle actual births/deaths)
    }

    /**
     * Process migration (immigration/emigration)
     */

    /**
     * Process territorial migration (movement between territories)
     */
    processTerritorialMigration() {
        // People move from less happy territories to happier ones
        const territories = Array.from(this.territorialDistribution.entries());
        
        territories.forEach(([fromId, fromData]) => {
            territories.forEach(([toId, toData]) => {
                if (fromId !== toId && fromData.happiness < toData.happiness) {
                    const happinessDifference = toData.happiness - fromData.happiness;
                    const migrationRate = Math.min(0.001, happinessDifference / 10000); // Max 0.1% per day
                    
                    const migrationAmount = fromData.population * migrationRate;
                    
                    // Check capacity constraints
                    if (toData.population + migrationAmount <= toData.capacity * 1.2) { // Allow 20% overcrowding
                        fromData.population -= migrationAmount;
                        toData.population += migrationAmount;
                    }
                }
            });
        });
    }

    /**
     * Update happiness factors
     */
    updateHappinessFactors() {
        // Update happiness based on various factors
        let overallHappiness = 0;
        
        // Calculate weighted happiness across all factors
        const weights = {
            housing: 0.15,
            healthcare: 0.12,
            education: 0.10,
            employment: 0.18,
            safety: 0.15,
            environment: 0.08,
            governance: 0.10,
            economy: 0.12
        };
        
        Object.entries(weights).forEach(([factor, weight]) => {
            overallHappiness += this.happinessFactors[factor] * weight;
        });
        
        // Update territorial happiness
        for (const [territoryId, data] of this.territorialDistribution.entries()) {
            // Base happiness from overall factors
            let territoryHappiness = overallHappiness;
            
            // Modify based on territory-specific conditions
            territoryHappiness *= this.getTerritoryHappinessModifier(territoryId);
            
            // Population density affects happiness
            const densityPenalty = Math.max(0, (data.density - 1.0) * 10); // Penalty for overcrowding
            territoryHappiness -= densityPenalty;
            
            // Smooth happiness changes
            data.happiness = data.happiness * 0.95 + territoryHappiness * 0.05;
            data.happiness = Math.max(0, Math.min(100, data.happiness));
        }
        
        // Update growth modifiers based on happiness
        const avgHappiness = this.territorialDistribution.size > 0
            ? Array.from(this.territorialDistribution.values())
                .reduce((sum, data) => sum + data.happiness, 0) / this.territorialDistribution.size
            : 50;
        
        this.growthModifiers.happiness = 0.5 + (avgHappiness / 100);
    }

    /**
     * Get territory-specific happiness modifier
     */
    getTerritoryHappinessModifier(territoryId) {
        // This would check territory-specific conditions
        // For now, return a base modifier with some variation
        return 0.9 + Math.random() * 0.2;
    }

    /**
     * Update demographics breakdown
     */

    /**
     * Update education levels
     */

    /**
     * Update territorial population densities
     */

    /**
     * Calculate territory capacity
     */

    /**
     * Process population events
     */
    processPopulationEvents() {
        for (let i = this.activeEvents.length - 1; i >= 0; i--) {
            const event = this.activeEvents[i];
            event.duration--;
            
            if (event.duration <= 0) {
                this.removeEventEffects(event);
                this.activeEvents.splice(i, 1);
            } else {
                this.applyEventEffects(event);
            }
        }
    }

    /**
     * Apply population event effects
     */
    applyEventEffects(event) {
        if (event.effects) {
            Object.entries(event.effects).forEach(([factor, change]) => {
                if (this.growthModifiers[factor] !== undefined) {
                    this.growthModifiers[factor] *= (1 + change);
                } else if (this.happinessFactors[factor] !== undefined) {
                    this.happinessFactors[factor] += change;
                }
            });
        }
        // Track applied effects so they can be reversed on removal
        if (!event._appliedEffects) {
            event._appliedEffects = { ...event.effects };
        }
    }

    /**
     * Remove population event effects
     */
    removeEventEffects(event) {
        // Reverse previously applied effects
        if (event._appliedEffects) {
            Object.entries(event._appliedEffects).forEach(([factor, change]) => {
                if (this.growthModifiers[factor] !== undefined) {
                    const divisor = (1 + change);
                    this.growthModifiers[factor] = divisor !== 0 ? this.growthModifiers[factor] / divisor : this.growthModifiers[factor];
                } else if (this.happinessFactors[factor] !== undefined) {
                    this.happinessFactors[factor] -= change;
                }
            });
            delete event._appliedEffects;
        }
        
        console.log(`Population event ended: ${event.name}`);
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('population_event_ended', { event });
        }
    }

    /**
     * Record population history
     */
    recordPopulationHistory() {
        // Record total population
        this.history.population.push(this.demographics.totalPopulation);
        if (this.history.population.length > this.history.maxHistoryLength) {
            this.history.population.shift();
        }
        
        // Record average happiness
        const avgHappiness = Array.from(this.territorialDistribution.values())
            .reduce((sum, data) => sum + data.happiness, 0) / 
            Math.max(1, this.territorialDistribution.size);
        
        this.history.happiness.push(avgHappiness);
        if (this.history.happiness.length > this.history.maxHistoryLength) {
            this.history.happiness.shift();
        }
        
        // Record growth
        const totalGrowth = Array.from(this.territorialDistribution.values())
            .reduce((sum, data) => sum + data.growth, 0);
        
        this.history.growth.push(totalGrowth);
        if (this.history.growth.length > this.history.maxHistoryLength) {
            this.history.growth.shift();
        }
    }

    /**
     * Handle monthly population updates
     */
    handleMonthPassed(data) {
        // Monthly demographic analysis
        this.performMonthlyAnalysis();
        
        // Generate population events
        this.generatePopulationEvents();
        
        // Update long-term trends
        this.updateLongTermTrends();
    }

    /**
     * Handle yearly population updates
     */
    handleYearPassed(data) {
        // Annual population census
        this.performAnnualCensus();
        
        // Update birth and death rates based on conditions
        this.updateVitalRates();
        
        // Generate annual population report
        this.generateAnnualReport();
    }

    /**
     * Perform monthly demographic analysis
     */
    performMonthlyAnalysis() {
        const monthlyGrowth = this.history.growth.slice(-30).reduce((sum, val) => sum + val, 0);
        const avgHappiness = this.history.happiness.slice(-30).reduce((sum, val) => sum + val, 0) / 30;
        
        EventBus.emit('monthly_population_report', {
            growth: monthlyGrowth,
            avgHappiness: avgHappiness,
            demographics: { ...this.demographics }
        });
    }

    /**
     * Generate population events
     */
    generatePopulationEvents() {
        if (Math.random() < 0.1) { // 10% chance per month
            // Collect all population events into a weighted pool
            let allPopulationEvents = [];
            
            if (typeof PopulationEvents !== 'undefined') {
                Object.values(PopulationEvents).forEach(category => {
                    if (Array.isArray(category)) {
                        category.forEach(event => {
                            // Add multiple copies based on weight for proper probability
                            const weight = event.weight || 1;
                            for (let i = 0; i < weight; i++) {
                                allPopulationEvents.push(event);
                            }
                        });
                    }
                });
            }
            
            // Fallback events if data file fails to load
            if (allPopulationEvents.length === 0) {
                allPopulationEvents = [
                    {
                        name: 'Baby Boom',
                        description: 'A surge in birth rates across the nation',
                        duration: 90,
                        effects: { happiness: 0.05 }
                    },
                    {
                        name: 'Health Crisis',
                        description: 'Public health concerns affect the population',
                        duration: 60,
                        effects: { healthcare: -10 }
                    },
                    {
                        name: 'Education Reform',
                        description: 'Educational improvements boost population skills',
                        duration: 180,
                        effects: { education: 5 }
                    },
                    {
                        name: 'Migration Wave',
                        description: 'Increased immigration boosts population',
                        duration: 30,
                        effects: { resources: 1.02 }
                    }
                ];
            }
            
            const event = allPopulationEvents[Math.floor(Math.random() * allPopulationEvents.length)];
            this.activeEvents.push({ ...event });
            
            EventBus.emit('population_event_started', { event });
        }
    }

    /**
     * Update long-term demographic trends
     */
    updateLongTermTrends() {
        // Analyze trends and adjust base rates
        if (this.history.population.length >= 30) {
            const recentGrowth = this.history.population.slice(-30);
            const trend = (recentGrowth[29] - recentGrowth[0]) / recentGrowth[0] / 30;
            
            // Adjust birth/death rates based on trends
            if (trend > 0.001) { // Strong growth
                this.demographics.birthRate *= 1.001;
            } else if (trend < -0.001) { // Decline
                this.demographics.deathRate *= 0.999;
            }
        }
    }

    /**
     * Perform annual population census
     */
    performAnnualCensus() {
        const census = {
            totalPopulation: Math.floor(this.demographics.totalPopulation),
            demographics: { ...this.demographics },
            territorialDistribution: Object.fromEntries(
                Array.from(this.territorialDistribution.entries()).map(([id, data]) => [
                    id, 
                    { 
                        population: Math.floor(data.population), 
                        happiness: Math.round(data.happiness),
                        density: Math.round(data.density * 100) / 100
                    }
                ])
            ),
            yearlyGrowth: this.history.growth.reduce((sum, val) => sum + val, 0),
            averageHappiness: this.history.happiness.reduce((sum, val) => sum + val, 0) / this.history.happiness.length
        };
        
        EventBus.emit('annual_population_census', { census });
        return census;
    }

    /**
     * Update vital rates (birth/death) based on conditions
     */

    /**
     * Generate annual population report
     */

    /**
     * Handle territory added
     */
    handleTerritoryAdded(data) {
        const territory = data.territory;
        this.territorialDistribution.set(territory.id, {
            population: territory.population || 0,
            capacity: this.calculateTerritoryCapacity(territory.id),
            growth: 0,
            happiness: 50,
            density: 0
        });
        
        this.demographics.totalPopulation += territory.population || 0;
    }

    /**
     * Handle territory removed
     */
    handleTerritoryRemoved(data) {
        const territoryData = this.territorialDistribution.get(data.territoryId);
        if (territoryData) {
            this.demographics.totalPopulation -= territoryData.population;
            this.territorialDistribution.delete(data.territoryId);
        }
    }

    /**
     * Handle policy changes that affect population
     */
    handlePolicyChanged(data) {
        switch (data.policy) {
            case 'healthcare':
                this.happinessFactors.healthcare += data.newValue - data.oldValue;
                break;
            case 'education':
                this.happinessFactors.education += data.newValue - data.oldValue;
                break;
            case 'social_spending':
                this.growthModifiers.policies = 1 + (data.newValue / 100);
                break;
        }
    }

    /**
     * Handle infrastructure improvements
     */
    handleInfrastructureBuilt(data) {
        // Infrastructure improvements affect happiness
        const territory = data.territory;
        const territoryData = this.territorialDistribution.get(territory.id);
        
        if (territoryData) {
            territoryData.happiness += 2; // Small happiness boost
            territoryData.capacity += 5000; // Increase capacity
        }
    }

    /**
     * Handle daily population updates
     */
    handleDayPassed(data) {
        const currentDay = data.currentDay || this.getCurrentDay();
        
        // Update population growth
        this.updatePopulationGrowth();
        
        // Update happiness factors
        this.updateHappinessFactors();
        
        // Process migration between territories
        this.processTerritorialMigration();
        
        // Age all citizens by one day
        this.processDailyAging();
        
        // Process births and deaths
        this.processBirthsAndDeaths();
        
        // Process migration
        this.processMigration();
        
        // Update employment and education
        this.updateEmploymentAndEducation();
        
        // Check for population situations (every 3 days)
        this.checkPopulationSituations(currentDay);
        
        // Process active situation effects
        this.processActiveSituationEffects(currentDay);
        
        // Process population events
        this.processPopulationEvents();
        
        // Update demographics and statistics
        this.updateDemographics();
        
        // Record daily history
        this.recordDailyHistory();
        this.recordPopulationHistory();
        
        // Update nation population
        this.updateNationPopulation();
    }

    /**
     * Process daily aging of all citizens
     */
    processDailyAging() {
        const now = Date.now();
        const msPerDay = 24 * 60 * 60 * 1000;
        const currentDay = this.getCurrentDay();
        const citizensToReassign = [];
        const citizensToRemove = [];
        
        for (const [citizenId, citizen] of this.citizens.entries()) {
            const ageDays = (now - citizen.birthTime) / msPerDay;
            
            // Check if citizen has reached max age (death)
            if (ageDays >= this.REAL_TIME_MAX_AGE_DAYS) {
                citizensToRemove.push(citizen);
                continue;
            }
            
            // Determine correct age group based on real-time age
            const correctGroup = this.getAgeGroupForRealTimeAge(ageDays);
            if (correctGroup && correctGroup !== citizen.ageGroup) {
                citizensToReassign.push({ citizen, newAgeGroup: correctGroup });
            }
        }
        
        // Process deaths - schedule replacement birth after 2-turn buffer
        citizensToRemove.forEach(citizen => {
            this.ageGroups[citizen.ageGroup].count--;
            this.citizens.delete(citizen.id);
            this.recordDeath('old_age');
            
            // Schedule replacement birth after 2-turn buffer
            const replacementDay = currentDay + 2;
            const currentPending = this.pendingBirths.get(replacementDay) || 0;
            this.pendingBirths.set(replacementDay, currentPending + 1);
        });
        
        // Reassign citizens to correct age groups
        citizensToReassign.forEach(({ citizen, newAgeGroup }) => {
            // Remove from old group
            this.ageGroups[citizen.ageGroup].count--;
            
            // Add to new group
            citizen.ageGroup = newAgeGroup;
            this.ageGroups[newAgeGroup].count++;
            
            // Update employment status if entering/leaving working age
            this.updateCitizenEmploymentStatus(citizen);
            
            // Track when a citizen reaches senior age
            if (newAgeGroup === 'senior') {
                this.recordReachedSenior();
            }
        });
        
        // Process pending replacement births (2-turn buffer)
        if (this.pendingBirths.has(currentDay)) {
            const birthsToAdd = this.pendingBirths.get(currentDay);
            this.pendingBirths.delete(currentDay);
            for (let i = 0; i < birthsToAdd; i++) {
                this.createNewCitizen();
            }
        }
    }

    /**
     * Get appropriate age group for a given real-time age in days
     */
    getAgeGroupForRealTimeAge(ageDays) {
        for (const [groupName, groupData] of Object.entries(this.ageGroupConfig)) {
            if (ageDays >= groupData.minDays && ageDays < groupData.maxDays) {
                return groupName;
            }
        }
        return null; // Age exceeds maximum (death)
    }

    /**
     * Update citizen employment status when changing age groups
     */
    updateCitizenEmploymentStatus(citizen) {
        const workingAges = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];
        const studentAges = ['child'];
        const retiredAges = ['senior', 'elderly'];
        
        if (workingAges.includes(citizen.ageGroup) && citizen.employmentStatus === 'not_applicable') {
            // Entering workforce
            citizen.employmentStatus = Math.random() < 0.75 ? 'employed' : 'unemployed';
        } else if (retiredAges.includes(citizen.ageGroup)) {
            // Retiring
            citizen.employmentStatus = 'retired';
        } else if (studentAges.includes(citizen.ageGroup)) {
            // School age
            citizen.employmentStatus = 'student';
        }
    }

    /**
     * Process daily births and deaths based on nation conditions
     * Natural growth can be positive (births) or negative (deaths)
     */
    processBirthsAndDeaths() {
        if (!window.Nation) return;
        
        const totalPopulation = this.getTotalPopulation();
        if (totalPopulation === 0) return;
        
        const ns = window.Nation.nationStats || {};
        const happiness = window.Nation.happiness || 50;
        const disease = ns.disease || 10;
        const pollution = ns.pollution || 0;
        const environment = ns.environment !== undefined ? ns.environment : 50;
        
        // Base daily rates
        const baseDailyBirthRate = this.vitalRates.baseBirthRate / 365;
        const baseDailyDeathRate = this.vitalRates.baseDeathRate / 365;
        
        // Shared condition factors
        const happinessFactor = 0.5 + (happiness / 100);
        const diseaseFactor = Math.max(0.1, 1 - (disease / 100));
        const environmentFactor = 0.5 + (environment / 100);
        const pollutionFactor = Math.max(0.1, 1 - (pollution / 100));
        
        // Calculate daily births (only if conditions support growth)
        const dailyBirthRate = baseDailyBirthRate * happinessFactor * diseaseFactor * environmentFactor * pollutionFactor;
        const expectedBirths = totalPopulation * dailyBirthRate;
        const actualBirths = Math.floor(expectedBirths + Math.random());
        
        for (let i = 0; i < actualBirths; i++) {
            this.createNewCitizen();
        }
        
        // Calculate daily deaths (always applies, higher when conditions are poor)
        const deathHappinessFactor = 1.5 - (happiness / 100); // 0.5 to 1.5 (lower happiness = more deaths)
        const deathDiseaseFactor = 1 + (disease / 100); // Higher disease = more deaths
        const deathPollutionFactor = 1 + (pollution / 100); // Higher pollution = more deaths
        const dailyDeathRate = baseDailyDeathRate * deathHappinessFactor * deathDiseaseFactor * deathPollutionFactor;
        const expectedDeaths = totalPopulation * dailyDeathRate;
        const actualDeaths = Math.floor(expectedDeaths + Math.random());
        
        // Process natural deaths (not old-age — those are handled by processDailyAging)
        for (let i = 0; i < actualDeaths; i++) {
            this.processNaturalDeath();
        }
    }

    /**
     * Process a natural death from a random eligible age group
     */
    processNaturalDeath() {
        const totalPopulation = this.getTotalPopulation();
        if (totalPopulation === 0) return;
        
        // Death probabilities skewed toward older groups
        const deathProbabilities = {
            newborn: 0.01,
            infant: 0.005,
            toddler: 0.003,
            child: 0.001,
            teen: 0.002,
            youngAdult: 0.004,
            adult: 0.008,
            middleAged: 0.015,
            older: 0.04,
            senior: 0.12,
            elderly: 0.30
        };
        
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [ageGroup, probability] of Object.entries(deathProbabilities)) {
            cumulative += probability;
            if (rand < cumulative && this.ageGroups[ageGroup]?.count > 0) {
                const groupCitizens = Array.from(this.citizens.values())
                    .filter(citizen => citizen.ageGroup === ageGroup);
                
                if (groupCitizens.length > 0) {
                    const citizen = groupCitizens[Math.floor(Math.random() * groupCitizens.length)];
                    this.citizens.delete(citizen.id);
                    this.ageGroups[ageGroup].count--;
                    this.recordDeath('natural');
                }
                break;
            }
        }
    }

    /**
     * Create a new citizen (birth) with real-time timestamp
     */
    createNewCitizen() {
        const citizen = {
            id: this.nextCitizenId++,
            birthTime: Date.now(),
            ageGroup: 'newborn',
            employmentStatus: 'not_applicable',
            educationLevel: 'none'
        };
        
        this.citizens.set(citizen.id, citizen);
        this.ageGroups.newborn.count++;
        this.recordBirth();
    }

    /**
     * Record death in statistics
     */
    recordDeath(cause) {
        // Record death statistics for analysis
        if (!this.deathStats) this.deathStats = {};
        this.deathStats[cause] = (this.deathStats[cause] || 0) + 1;
        this.populationStats.died++;
    }

    /**
     * Record a birth in statistics
     */
    recordBirth(count = 1) {
        this.populationStats.born += count;
    }

    /**
     * Record a combat death in statistics
     */
    recordCombatDeath(count = 1) {
        this.populationStats.diedInCombat += count;
        this.populationStats.died += count;
    }

    /**
     * Record a citizen reaching senior age group
     */
    recordReachedSenior(count = 1) {
        this.populationStats.reachedSenior += count;
    }

    /**
     * Enlist military population from demographic groups.
     * Depletion order: Young Adult → Adult → Middle Aged → Older → Teen
     * Returns breakdown with total, per-group counts, and citizen objects for later discharge.
     */
    enlistMilitaryPopulation(amount) {
        if (!amount || amount <= 0) return { total: 0, breakdown: {}, citizens: [] };
        
        const depletionOrder = ['youngAdult', 'adult', 'middleAged', 'older', 'teen'];
        let remaining = amount;
        let enlisted = 0;
        const breakdown = {};
        const enlistedCitizens = [];
        
        for (const group of depletionOrder) {
            if (remaining <= 0) break;
            
            const groupCitizens = Array.from(this.citizens.values())
                .filter(citizen => citizen.ageGroup === group);
            
            const take = Math.min(remaining, groupCitizens.length);
            
            for (let i = 0; i < take; i++) {
                const citizen = groupCitizens[i];
                this.citizens.delete(citizen.id);
                enlistedCitizens.push({ ...citizen }); // store copy with original ageGroup
            }
            
            this.ageGroups[group].count -= take;
            breakdown[group] = take;
            remaining -= take;
            enlisted += take;
        }
        
        this.populationStats.enlisted += enlisted;
        return { total: enlisted, breakdown, citizens: enlistedCitizens };
    }

    /**
     * Return enlisted military population to their original demographic groups.
     * Used when units are decommissioned (not combat-killed).
     * Citizens are restored with their original ageGroup (age frozen at enlistment).
     */
    dischargeMilitaryPopulation(source) {
        if (!source || !source.citizens || source.citizens.length === 0) return 0;
        
        let restored = 0;
        for (const citizen of source.citizens) {
            this.citizens.set(citizen.id, citizen);
            this.ageGroups[citizen.ageGroup].count++;
            restored++;
        }
        return restored;
    }

    /**
     * Record combat deaths and schedule replacement births after 2-turn buffer.
     * Returns the number of deaths recorded.
     */
    recordMilitaryCombatDeaths(count, breakdown) {
        if (!count || count <= 0) return 0;
        
        this.recordCombatDeath(count);
        
        // Schedule replacement births after 2-turn buffer (handled by pendingBirths)
        const currentDay = this.getCurrentDay();
        const replacementDay = currentDay + 2;
        const currentPending = this.pendingBirths.get(replacementDay) || 0;
        this.pendingBirths.set(replacementDay, currentPending + count);
        
        return count;
    }

    /**
     * Process migration (slow, long-term effect)
     */
    processMigration() {
        if (!window.Nation) return;
        
        const totalPopulation = this.getTotalPopulation();
        const happiness = window.Nation.happiness || 50;
        // Read stats from nationStats where they actually live
        const ns       = window.Nation.nationStats || {};
        const literacy  = ns.literacy  || 0;
        const tech      = window.Nation.tech || 0;
        const pollution = ns.pollution  || 0;
        const disease   = ns.disease   || 10;
        const crime     = ns.crime     || 15;
        
        // Calculate migration attractiveness factors
        this.migrationFactors.happiness   = happiness / 50; // 0.5 to 2.0
        this.migrationFactors.literacy    = Math.max(0.1, literacy / 50);   // 0.1 to 2.0
        this.migrationFactors.technology  = Math.min(2.0, tech / 1000); // 0 to 2.0
        this.migrationFactors.pollution   = 2.0 - (pollution / 50);  // Higher pollution = less attractive
        this.migrationFactors.disease     = 2.0 - (disease / 25);     // Higher disease = less attractive
        this.migrationFactors.crime       = 2.0 - (crime / 40);         // Higher crime = less attractive
        
        // Calculate overall migration attractiveness
        const attractiveness = Object.values(this.migrationFactors)
            .reduce((sum, factor) => sum + factor, 0) / Object.keys(this.migrationFactors).length;
        
        // Calculate daily migration rate (very small for gradual effect)
        const baseDailyMigration = (this.vitalRates.migrationRate / 365) * totalPopulation;
        const migrationRate = baseDailyMigration * (attractiveness - 1.0) * this.migrationEffectiveness;
        
        // Apply migration policy modifiers
        const policyMultiplier = this.getMigrationPolicyMultiplier();
        const actualMigration = Math.floor(migrationRate * policyMultiplier + Math.random());
        
        if (actualMigration > 0) {
            // Immigration
            for (let i = 0; i < actualMigration; i++) {
                this.createImmigrant();
            }
        } else if (actualMigration < 0) {
            // Emigration
            for (let i = 0; i < Math.abs(actualMigration); i++) {
                this.processEmigration();
            }
        }
    }

    /**
     * Get migration policy multiplier
     */
    getMigrationPolicyMultiplier() {
        switch (this.migrationPolicy) {
            case 'open': return 2.0;      // Double migration effects
            case 'restricted': return 0.5; // Half migration effects
            case 'balanced': return 1.0;   // Normal migration effects
            default: return 1.0;
        }
    }

    /**
     * Create immigrant citizen
     */
    createImmigrant() {
        // Immigrants are typically working age with some education
        const workingAges = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];
        const ageGroup = workingAges[Math.floor(Math.random() * workingAges.length)];
        
        const now = Date.now();
        const daysOld = this.getRandomDaysInGroup(ageGroup);
        const citizen = {
            id: this.nextCitizenId++,
            birthTime: now - (daysOld * 24 * 60 * 60 * 1000),
            ageGroup: ageGroup,
            employmentStatus: Math.random() < 0.6 ? 'unemployed' : 'employed', // Often need to find work
            educationLevel: Math.random() < 0.4 ? 'secondary' : 'primary', // Moderate education
            isImmigrant: true
        };
        
        this.citizens.set(citizen.id, citizen);
        this.ageGroups[ageGroup].count++;
        this.recordBirth();
    }

    /**
     * Process emigration
     */
    processEmigration() {
        const totalCitizens = this.citizens.size;
        if (totalCitizens === 0) return;
        
        // Emigrants are often working age or young adults
        const emigrantCandidates = Array.from(this.citizens.values())
            .filter(citizen => ['youngAdult', 'adult'].includes(citizen.ageGroup));
        
        if (emigrantCandidates.length > 0) {
            const emigrant = emigrantCandidates[Math.floor(Math.random() * emigrantCandidates.length)];
            this.citizens.delete(emigrant.id);
            this.ageGroups[emigrant.ageGroup].count--;
            this.populationStats.emigrated++;
            this.recordDeath('emigration');
        }
    }

    /**
     * Get total population count
     */
    getTotalPopulation() {
        return Array.from(Object.values(this.ageGroups))
            .reduce((total, group) => total + group.count, 0);
    }

    /**
     * Get taxable population - only Teen through Older pay taxes
     * Newborns, Infants, Toddlers, Children, Seniors, Elderly do NOT pay taxes
     */
    getTaxablePopulation() {
        const taxableGroups = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];
        return taxableGroups.reduce((sum, group) => sum + (this.ageGroups[group]?.count || 0), 0);
    }

    /**
     * Get military-eligible population - only Teen through Older can be drafted
     * Anything before Teen and anything after Older does NOT count for military
     */
    getMilitaryEligiblePopulation() {
        const militaryGroups = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];
        return militaryGroups.reduce((sum, group) => sum + (this.ageGroups[group]?.count || 0), 0);
    }

    /**
     * Get current military population count (drafted citizens)
     */
    getDraftedMilitaryPopulation() {
        if (!window.Nation) return 0;
        const military = window.Nation.militaryUnits || window.Nation.military || {};
        return (military.soldiers || 0) +
               (military.tanks || 0) +
               (military.aircraft || 0) +
               (military.ships || 0) +
               (military.spies || 0);
    }

    /**
     * Check if military population penalty is active
     * When drafted military exceeds threshold of eligible population, growth is penalized
     */
    checkMilitaryPenalty() {
        const eligible = this.getMilitaryEligiblePopulation();
        if (eligible === 0) return 1.0;
        
        const drafted = this.getDraftedMilitaryPopulation();
        const usageRatio = drafted / eligible;
        
        if (usageRatio > this.militaryPenaltyThreshold) {
            return this.militaryPenaltyGrowthMultiplier;
        }
        return 1.0;
    }

    /**
     * Calculate daily population growth rate based on nation conditions
     * Factors: disease, happiness, environment, pollution, taxable income, military penalty
     */
    calculatePopulationGrowthRate() {
        if (!window.Nation) {
            return (this.vitalRates.baseBirthRate - this.vitalRates.baseDeathRate) / 365;
        }
        
        const ns = window.Nation.nationStats || {};
        const happiness = window.Nation.happiness || 50;
        const disease = ns.disease || 10;
        const pollution = ns.pollution || 0;
        const environment = ns.environment !== undefined ? ns.environment : 50;
        
        // Base daily growth rate (birth - death)
        const baseDailyRate = (this.vitalRates.baseBirthRate - this.vitalRates.baseDeathRate) / 365;
        
        // Happiness factor: 0.5 (at 0 happiness) to 1.5 (at 100 happiness)
        const happinessFactor = 0.5 + (happiness / 100);
        
        // Disease factor: reduces growth as disease increases
        const diseaseFactor = Math.max(0.1, 1 - (disease / 100));
        
        // Environment factor: 0.5 (at 0) to 1.5 (at 100)
        const environmentFactor = 0.5 + (environment / 100);
        
        // Pollution factor: reduces growth as pollution increases
        const pollutionFactor = Math.max(0.1, 1 - (pollution / 100));
        
        // Taxable income factor: thriving economy = more growth
        const taxablePop = this.getTaxablePopulation();
        const totalPop = Math.max(1, this.getTotalPopulation());
        const taxableRatio = taxablePop / totalPop;
        const incomeFactor = 0.5 + taxableRatio; // 0.5 to 1.5 based on taxable share
        
        // Military penalty factor
        const militaryPenaltyFactor = this.checkMilitaryPenalty();
        
        // Combine all factors
        const dailyRate = baseDailyRate *
            happinessFactor *
            diseaseFactor *
            environmentFactor *
            pollutionFactor *
            incomeFactor *
            militaryPenaltyFactor;
        
        return dailyRate;
    }

    /**
     * Check for population situations (every 3 days)
     */
    checkPopulationSituations(currentDay) {
        const daysSinceLastSituation = currentDay - this.populationSituations.lastSituationDay;
        
        if (daysSinceLastSituation >= this.populationSituations.situationInterval) {
            this.triggerPopulationSituation(currentDay);
            this.populationSituations.lastSituationDay = currentDay;
        }
    }

    /**
     * Trigger a new population situation
     */
    triggerPopulationSituation(currentDay) {
        // Don't trigger if there's already an active situation
        if (this.populationSituations.activeSituation) return;
        
        // Select random situation
        const availableSituations = this.situationDatabase.filter(situation => 
            !this.populationSituations.situationHistory.includes(situation.id) ||
            this.populationSituations.situationHistory.length >= this.situationDatabase.length * 0.8
        );
        
        if (availableSituations.length === 0) {
            // Reset history if we've used most situations
            this.populationSituations.situationHistory = [];
            return this.triggerPopulationSituation(currentDay);
        }
        
        const selectedSituation = availableSituations[Math.floor(Math.random() * availableSituations.length)];
        this.populationSituations.activeSituation = {
            ...selectedSituation,
            triggerDay: currentDay,
            expiryDay: currentDay + 7 // Situations expire after 7 days if not chosen
        };
        
        // Notify UI
        EventBus.emit('population_situation_triggered', {
            situation: this.populationSituations.activeSituation
        });
    }

    /**
     * Make choice for active population situation
     */
    makePopulationChoice(choiceIndex) {
        if (!this.populationSituations.activeSituation) return false;
        
        const situation = this.populationSituations.activeSituation;
        const choice = situation.choices[choiceIndex];
        
        if (!choice) return false;
        
        // Apply choice effects
        const effectId = `situation_${situation.id}_${Date.now()}`;
        const currentDay = this.getCurrentDay();
        
        this.populationSituations.activeEffects.set(effectId, {
            endDay: currentDay + choice.duration,
            effects: choice.effects,
            situationTitle: situation.title,
            choiceText: choice.text
        });
        
        // Apply immediate effects to nation
        this.applySituationEffects(choice.effects);
        
        // Record in history
        this.populationSituations.situationHistory.push(situation.id);
        if (this.populationSituations.situationHistory.length > 50) {
            this.populationSituations.situationHistory.shift(); // Keep only recent 50
        }
        
        // Clear active situation
        this.populationSituations.activeSituation = null;
        
        EventBus.emit('population_choice_made', {
            situation: situation,
            choice: choice,
            effectId: effectId
        });
        
        return true;
    }

    /**
     * Apply situation effects to nation
     */
    applySituationEffects(effects) {
        if (!window.Nation) return;
        
        Object.entries(effects).forEach(([effect, value]) => {
            switch (effect) {
                case 'happiness':
                    window.Nation.happiness = Math.max(0, Math.min(100, (window.Nation.happiness || 50) + value));
                    if (window.Nation.nationStats) window.Nation.nationStats.happiness = window.Nation.happiness;
                    break;
                case 'money':
                    window.Nation.money = (window.Nation.money || 0) + value;
                    break;
                case 'literacy':
                    if (window.Nation.nationStats) {
                        window.Nation.nationStats.literacy = Math.max(0, Math.min(100, (window.Nation.nationStats.literacy || 0) + value));
                    }
                    break;
                case 'crime':
                    if (window.Nation.nationStats) {
                        window.Nation.nationStats.crime = Math.max(0, Math.min(80, (window.Nation.nationStats.crime || 15) + value));
                    }
                    break;
                case 'disease':
                    if (window.Nation.nationStats) {
                        window.Nation.nationStats.disease = Math.max(0, Math.min(50, (window.Nation.nationStats.disease || 10) + value));
                    }
                    break;
                case 'pollution':
                    if (window.Nation.nationStats) {
                        window.Nation.nationStats.pollution = Math.max(0, (window.Nation.nationStats.pollution || 0) + value);
                    }
                    break;
                case 'population':
                    if (value > 0) {
                        // Add population through immigration
                        for (let i = 0; i < value; i++) {
                            this.createImmigrant();
                        }
                    }
                    break;
                case 'birthRate':
                    this.vitalRates.baseBirthRate = Math.max(0.01, this.vitalRates.baseBirthRate + value);
                    break;
                // Add more effect types as needed
            }
        });
        
        // Update nation calculations
        if (window.Nation.calculateNationStats) {
            window.Nation.calculateNationStats();
        }
    }

    /**
     * Process active situation effects (check for expiry)
     */
    processActiveSituationEffects(currentDay) {
        const expiredEffects = [];
        
        for (const [effectId, effectData] of this.populationSituations.activeEffects.entries()) {
            if (currentDay >= effectData.endDay) {
                expiredEffects.push(effectId);
            }
        }
        
        // Remove expired effects (note: we don't reverse the effects, they're permanent changes)
        expiredEffects.forEach(effectId => {
            const effectData = this.populationSituations.activeEffects.get(effectId);
            this.populationSituations.activeEffects.delete(effectId);
            
            EventBus.emit('population_effect_expired', {
                effectId: effectId,
                effectData: effectData
            });
        });
    }

    /**
     * Update employment and education statistics
     */
    updateEmploymentAndEducation() {
        this.updateEmploymentStatistics();
        this.updateEducationStatistics();
        this.processEducationProgression();
    }

    /**
     * Update employment statistics
     */
    updateEmploymentStatistics() {
        // Count citizens by employment status
        const employmentCounts = {
            employed: 0,
            unemployed: 0,
            student: 0,
            retired: 0,
            not_applicable: 0
        };
        
        for (const citizen of this.citizens.values()) {
            employmentCounts[citizen.employmentStatus]++;
        }
        
        // Calculate workforce and employment rates
        this.employment.workforce = employmentCounts.employed + employmentCounts.unemployed;
        this.employment.employed = employmentCounts.employed;
        this.employment.unemployed = employmentCounts.unemployed;
        this.employment.students = employmentCounts.student;
        this.employment.retired = employmentCounts.retired;
        this.employment.dependents = employmentCounts.not_applicable;
        
        // Calculate rates
        if (this.employment.workforce > 0) {
            this.employment.unemploymentRate = this.employment.unemployed / this.employment.workforce;
            this.employment.laborParticipationRate = this.employment.workforce / 
                (this.ageGroups.teen.count + this.ageGroups.youngAdult.count + this.ageGroups.adult.count + this.ageGroups.middleAged.count + this.ageGroups.older.count);
        }
        
        // Factor in happiness, improvements, and military for employment opportunities
        const militaryPopulation = this.getDraftedMilitaryPopulation();
        this.adjustEmploymentForGameFactors(militaryPopulation);
    }

    /**
     * Adjust employment based on game factors
     */
    adjustEmploymentForGameFactors(militaryPopulation = 0) {
        if (!window.Nation) return;
        
        const happiness = window.Nation.happiness || 50;
        const improvements = this.getImprovementEmploymentSlots();
        
        // Calculate employment capacity based on improvements
        const employmentCapacity = improvements.totalSlots;
        const currentEmployed = this.employment.employed + militaryPopulation;
        
        // Adjust employment based on capacity and happiness
        const happinessFactor = happiness / 50; // 0.5 to 2.0
        const effectiveCapacity = employmentCapacity * happinessFactor;
        
        if (currentEmployed > effectiveCapacity) {
            // Too many people for available jobs - increase unemployment
            const excess = currentEmployed - effectiveCapacity;
            this.employment.unemploymentRate = Math.min(0.5, this.employment.unemploymentRate + (excess / this.employment.workforce));
        } else if (currentEmployed < effectiveCapacity) {
            // Jobs available - reduce unemployment
            const shortage = effectiveCapacity - currentEmployed;
            this.employment.unemploymentRate = Math.max(0.02, this.employment.unemploymentRate - (shortage / this.employment.workforce));
        }
    }

    /**
     * Get employment slots from improvements
     */
    getImprovementEmploymentSlots() {
        const employmentSlots = {
            totalSlots: 1000, // Base employment capacity
            byType: {
                industrial: 0,
                service: 0,
                government: 0,
                military: 0
            }
        };
        
        if (window.Nation && window.Nation.improvements) {
            // Each improvement type provides different employment
            const improvements = window.Nation.improvements;
            
            employmentSlots.byType.industrial = (improvements.factory || 0) * 200 + 
                                              (improvements.mine || 0) * 150 + 
                                              (improvements.assemblyPlant || 0) * 250;
            
            employmentSlots.byType.service = (improvements.hospital || 0) * 100 + 
                                           (improvements.school || 0) * 80 + 
                                           (improvements.park || 0) * 50;
            
            employmentSlots.byType.government = (improvements.embassy || 0) * 30 + 
                                              (improvements.foreignAffairsOffice || 0) * 25 + 
                                              (improvements.internalAffairsOffice || 0) * 35;
            
            employmentSlots.byType.military = (improvements.barracks || 0) * 100 + 
                                            (improvements.airforceBase || 0) * 150 + 
                                            (improvements.harbor || 0) * 120;
            
            employmentSlots.totalSlots = Object.values(employmentSlots.byType)
                .reduce((total, slots) => total + slots, 1000);
        }
        
        return employmentSlots;
    }

    /**
     * Update education statistics  
     */
    updateEducationStatistics() {
        // Count citizens by education level
        const educationCounts = {
            none: 0,
            primary: 0,
            secondary: 0,
            higher: 0
        };
        
        for (const citizen of this.citizens.values()) {
            educationCounts[citizen.educationLevel]++;
        }
        
        const totalCitizens = this.citizens.size;
        if (totalCitizens > 0) {
            this.education.noEducation = educationCounts.none / totalCitizens;
            this.education.primaryEducation = educationCounts.primary / totalCitizens;
            this.education.secondaryEducation = educationCounts.secondary / totalCitizens;
            this.education.higherEducation = educationCounts.higher / totalCitizens;
        }
    }

    /**
     * Process education progression (7-day advancement)
     */
    processEducationProgression() {
        if (!window.Nation) return;
        
        const ns        = window.Nation.nationStats || {};
        const literacy  = ns.literacy  || 0;
        const happiness = window.Nation.happiness || 50;
        const tech      = window.Nation.tech || 0;
        
        // Check conditions for education advancement
        const progressionFactors = {
            literacy: literacy / 100,
            happiness: happiness / 50,
            technology: tech / 1000
        };
        
        // Process citizens in progression queue
        for (const [citizenId, progression] of this.education.progressionQueue.entries()) {
            progression.daysRemaining--;
            
            if (progression.daysRemaining <= 0) {
                // Advance citizen education
                const citizen = this.citizens.get(citizenId);
                if (citizen) {
                    citizen.educationLevel = progression.targetLevel;
                }
                this.education.progressionQueue.delete(citizenId);
            }
        }
        
        // Add new citizens to progression queue if conditions are met
        this.queueEducationProgressions(progressionFactors);
    }

    /**
     * Queue citizens for education progression
     */
    queueEducationProgressions(factors) {
        const eligibleCitizens = Array.from(this.citizens.values())
            .filter(citizen => !this.education.progressionQueue.has(citizen.id))
            .filter(citizen => ['child', 'teen', 'youngAdult', 'adult'].includes(citizen.ageGroup));
        
        for (const citizen of eligibleCitizens) {
            const currentLevel = citizen.educationLevel;
            let targetLevel = null;
            let required = null;
            
            if (currentLevel === 'none' && factors.literacy >= 0.25) {
                targetLevel = 'primary';
                required = this.education.literacyRequirements.primary;
            } else if (currentLevel === 'primary' && factors.literacy >= 0.50) {
                targetLevel = 'secondary';
                required = this.education.literacyRequirements.secondary;
            } else if (currentLevel === 'secondary' && factors.literacy >= 0.75) {
                targetLevel = 'higher';
                required = this.education.literacyRequirements.higher;
            }
            
            if (targetLevel && Math.random() < 0.1) { // 10% chance per day to start progression
                this.education.progressionQueue.set(citizen.id, {
                    targetLevel: targetLevel,
                    daysRemaining: 7 // 7 days to complete education level
                });
            }
        }
    }
    /**
     * Initialize territorial distribution
     */
    initializeTerritorialDistribution() {
        if (!window.Nation) return;
        
        const territories = window.Nation.territories || ['capital'];
        const totalPopulation = this.getTotalPopulation();
        
        if (territories.length === 0) return;
        
        // Distribute population across territories
        const populationPerTerritory = Math.floor(totalPopulation / territories.length);
        
        territories.forEach(territoryId => {
            this.territorialDistribution.set(territoryId, {
                population: populationPerTerritory,
                capacity: this.calculateTerritoryCapacity(territoryId),
                growthRate: 0.02,
                happiness: 50,
                density: 0
            });
        });
        
        this.updateTerritorialDensities();
    }

    /**
     * Calculate territory capacity based on infrastructure
     */
    calculateTerritoryCapacity(territoryId) {
        // Base capacity calculation
        const baseCapacity = 10000;
        
        if (window.Nation) {
            const infra = window.Nation.infra || 1000;
            const land = window.Nation.land || 1000;
            return Math.floor(baseCapacity * Math.sqrt(infra * land / 1000000));
        }
        
        return baseCapacity;
    }

    /**
     * Update territorial densities
     */
    updateTerritorialDensities() {
        for (const [territoryId, data] of this.territorialDistribution.entries()) {
            data.density = data.capacity > 0 ? data.population / data.capacity : 0;
        }
    }

    /**
     * Update demographics summary
     */
    updateDemographics() {
        const totalPopulation = this.getTotalPopulation();
        
        // Update age group percentages
        Object.keys(this.ageGroups).forEach(ageGroup => {
            this.ageGroups[ageGroup].percentage = totalPopulation > 0 ? 
                this.ageGroups[ageGroup].count / totalPopulation : 0;
        });
        
        // Update territorial distribution
        this.updateTerritorialDensities();

        // Keep legacy demographics object in sync
        this._syncDemographics();
    }

    /**
     * Record daily history
     */
    recordDailyHistory() {
        const currentDay = this.getCurrentDay();
        const totalPopulation = this.getTotalPopulation();
        
        // Record population history
        this.history.totalPopulation.push({
            day: currentDay,
            population: totalPopulation
        });
        
        // Record age distribution
        const ageDistribution = {};
        Object.entries(this.ageGroups).forEach(([ageGroup, data]) => {
            ageDistribution[ageGroup] = data.count;
        });
        
        this.history.ageDistribution.push({
            day: currentDay,
            distribution: ageDistribution
        });
        
        // Record employment and education
        this.history.employment.push({
            day: currentDay,
            employed: this.employment.employed,
            unemployed: this.employment.unemployed,
            unemploymentRate: this.employment.unemploymentRate
        });
        
        this.history.education.push({
            day: currentDay,
            noEducation: this.education.noEducation,
            primaryEducation: this.education.primaryEducation,
            secondaryEducation: this.education.secondaryEducation,
            higherEducation: this.education.higherEducation
        });
        
        // Record population lifecycle stats
        this.history.births.push({ day: currentDay, born: this.populationStats.born });
        this.history.deaths.push({ day: currentDay, died: this.populationStats.died });
        this.history.enlisted.push({ day: currentDay, enlisted: this.populationStats.enlisted });
        this.history.diedInCombat.push({ day: currentDay, diedInCombat: this.populationStats.diedInCombat });
        this.history.reachedSenior.push({ day: currentDay, reachedSenior: this.populationStats.reachedSenior });
        this.history.emigrated.push({ day: currentDay, emigrated: this.populationStats.emigrated });
        // Trim history to max length
        Object.keys(this.history).forEach(key => {
            if (Array.isArray(this.history[key]) && this.history[key].length > this.history.maxHistoryLength) {
                this.history[key].shift();
            }
        });
    }

    /**
     * Update nation population
     */
    updateNationPopulation() {
        if (window.Nation) {
            window.Nation.population = this.getTotalPopulation();
        }
        this._syncDemographics();
    }

    /**
     * Handle monthly updates (delegates to primary handleMonthPassed above)
     */
    // Note: handleMonthPassed and handleYearPassed are defined earlier in this file.
    // The primary definitions above (which also call generatePopulationEvents / updateVitalRates)
    // are the ones that take effect — do not duplicate them here.

    /**
     * Update vital rates based on game conditions
     */
    updateVitalRates() {
        if (!window.Nation) return;
        
        const happiness = window.Nation.happiness || 50;
        const ns        = window.Nation.nationStats || {};
        const literacy  = ns.literacy  || 0;
        const disease   = ns.disease   || 10;
        
        // Adjust birth rate based on happiness and literacy
        const happinessFactor = 1 + (happiness - 50) / 200; // +/-25%
        const literacyFactor = 1 + (literacy - 50) / 400;   // +/-12.5%
        this.vitalRates.baseBirthRate = Math.max(0.01, Math.min(0.06, 
            0.035 * happinessFactor * literacyFactor));
        
        // Adjust death rate based on disease and healthcare
        const diseaseFactor = 1 + disease / 200; // 0% to 25% increase
        this.vitalRates.baseDeathRate = Math.max(0.005, Math.min(0.03,
            0.01 * diseaseFactor));
    }

    /**
     * Analyze demographic trends
     */
    analyzeDemographicTrends() {
        // Calculate demographic momentum and dependency ratios
        const totalPop = this.getTotalPopulation();
        
        if (totalPop > 0) {
            const workingAge = this.ageGroups.youngAdult.count + 
                             this.ageGroups.adult.count + 
                             this.ageGroups.middleAged.count;
            
            const dependents = totalPop - workingAge;
            
            this.dependencyRatio = dependents / Math.max(workingAge, 1);
            this.agingIndex = (this.ageGroups.senior.count + this.ageGroups.elderly.count) / 
                            Math.max(this.ageGroups.child.count + this.ageGroups.teen.count, 1);
        }
    }

    /**
     * Generate annual report
     */
    generateAnnualReport() {
        const monthlyGrowthRate = this.history.totalPopulation.length >= 2
            ? (this.history.totalPopulation[this.history.totalPopulation.length - 1].population - this.history.totalPopulation[0].population) / this.history.totalPopulation[0].population / this.history.totalPopulation.length
            : 0;
        
        const report = {
            populationGrowth: monthlyGrowthRate * 12, // Annualized
            majorDemographicShifts: this.identifyDemographicShifts(),
            employmentTrends: this.analyzeEmploymentTrends(),
            educationProgress: this.analyzeEducationProgress(),
            migrationImpact: this.analyzeMigrationImpact(),
            populationChallenges: this.identifyPopulationChallenges(),
            recommendations: this.generateRecommendations()
        };
        
        EventBus.emit('annual_population_report', report);
        return report;
    }

    /**
     * Get population overview for UI
     */
    getPopulationOverview() {
        const totalPop = this.getTotalPopulation();
        const taxablePop = this.getTaxablePopulation();
        const militaryEligible = this.getMilitaryEligiblePopulation();
        const drafted = this.getDraftedMilitaryPopulation();
        
        return {
            totalPopulation: totalPop,
            taxablePopulation: taxablePop,
            nonTaxablePopulation: totalPop - taxablePop,
            militaryEligiblePopulation: militaryEligible,
            draftedMilitaryPopulation: drafted,
            militaryUsageRatio: militaryEligible > 0 ? (drafted / militaryEligible) : 0,
            militaryPenaltyActive: this.checkMilitaryPenalty() < 1.0,
            ageDistribution: Object.entries(this.ageGroups).map(([group, data]) => ({
                ageGroup: group,
                count: data.count,
                percentage: totalPop > 0 ? (data.count / totalPop * 100).toFixed(1) : 0,
                ageRange: `${data.min}-${data.max} days (real-time)`,
                taxable: this.ageGroupConfig[group]?.taxable || false,
                militaryEligible: this.ageGroupConfig[group]?.militaryEligible || false
            })),
            employment: {
                workforce: this.employment.workforce,
                employed: this.employment.employed,
                unemployed: this.employment.unemployed,
                unemploymentRate: (this.employment.unemploymentRate * 100).toFixed(1),
                laborParticipation: (this.employment.laborParticipationRate * 100).toFixed(1)
            },
            education: {
                noEducation: (this.education.noEducation * 100).toFixed(1),
                primary: (this.education.primaryEducation * 100).toFixed(1),
                secondary: (this.education.secondaryEducation * 100).toFixed(1),
                higher: (this.education.higherEducation * 100).toFixed(1),
                progressingCount: this.education.progressionQueue.size
            },
            vitalStatistics: {
                birthRate: (this.vitalRates.baseBirthRate * 100).toFixed(2),
                deathRate: (this.vitalRates.baseDeathRate * 100).toFixed(2),
                migrationPolicy: this.migrationPolicy,
                dailyGrowthRate: (this.calculatePopulationGrowthRate() * 100).toFixed(4),
                naturalGrowthRate: ((this.vitalRates.baseBirthRate - this.vitalRates.baseDeathRate) * 100).toFixed(2)
            },
            activeSituation: this.populationSituations.activeSituation,
            activeEffects: Array.from(this.populationSituations.activeEffects.values()),
            territorialBreakdown: this.getTerritorialBreakdown(),
            populationStats: { ...this.populationStats },
            populationHistory: {
                births: [...this.history.births],
                deaths: [...this.history.deaths],
                enlisted: [...this.history.enlisted],
                diedInCombat: [...this.history.diedInCombat],
                reachedSenior: [...this.history.reachedSenior],
                emigrated: [...this.history.emigrated]
            }
        };
    }

    /**
     * Get territorial breakdown
     */
    getTerritorialBreakdown() {
        return Object.fromEntries(
            Array.from(this.territorialDistribution.entries()).map(([id, data]) => [
                id,
                {
                    population: Math.floor(data.population),
                    capacity: Math.floor(data.capacity),
                    density: Math.round(data.density * 100) / 100,
                    happiness: Math.round(data.happiness),
                    growthRate: Math.round((data.growthRate || data.growth || 0) * 1000) / 10 // Per 1000 population
                }
            ])
        );
    }

    /**
     * Set migration policy
     */
    setMigrationPolicy(policy) {
        const validPolicies = ['open', 'restricted', 'balanced'];
        if (validPolicies.includes(policy)) {
            this.migrationPolicy = policy;
            EventBus.emit('migration_policy_changed', { policy });
        }
    }

    // Helper methods for analysis
    identifyDemographicShifts() { return []; }
    analyzeEmploymentTrends() { return {}; }
    analyzeEducationProgress() { return {}; }
    analyzeMigrationImpact() { return {}; }
    identifyPopulationChallenges() { return []; }
    generateRecommendations() { return []; }

    // Event handlers

    /**
     * Get state for saving
     */
    getState() {
        return {
            ageGroups: { ...this.ageGroups },
            citizens: Object.fromEntries(this.citizens),
            nextCitizenId: this.nextCitizenId,
            vitalRates: { ...this.vitalRates },
            territorialDistribution: Object.fromEntries(this.territorialDistribution),
            migrationFactors: { ...this.migrationFactors },
            migrationPolicy: this.migrationPolicy,
            populationSituations: {
                lastSituationDay: this.populationSituations.lastSituationDay,
                activeSituation: this.populationSituations.activeSituation,
                situationHistory: [...this.populationSituations.situationHistory],
                activeEffects: Object.fromEntries(this.populationSituations.activeEffects)
            },
            employment: { ...this.employment },
            education: {
                ...this.education,
                progressionQueue: Object.fromEntries(this.education.progressionQueue)
            },
            pendingBirths: Object.fromEntries(this.pendingBirths),
            populationStats: { ...this.populationStats },
            history: {
                totalPopulation: [...this.history.totalPopulation],
                ageDistribution: [...this.history.ageDistribution],
                migration: [...this.history.migration],
                employment: [...this.history.employment],
                education: [...this.history.education]
            }
        };
    }

    /**
     * Set state from save data
     */
    setState(state) {
        if (state.ageGroups) Object.assign(this.ageGroups, state.ageGroups);
        if (state.citizens) this.citizens = new Map(Object.entries(state.citizens));
        if (state.nextCitizenId) this.nextCitizenId = state.nextCitizenId;
        if (state.vitalRates) Object.assign(this.vitalRates, state.vitalRates);
        if (state.territorialDistribution) {
            this.territorialDistribution = new Map(Object.entries(state.territorialDistribution));
        }
        if (state.migrationFactors) Object.assign(this.migrationFactors, state.migrationFactors);
        if (state.migrationPolicy) this.migrationPolicy = state.migrationPolicy;
        if (state.populationSituations) {
            Object.assign(this.populationSituations, state.populationSituations);
            if (state.populationSituations.activeEffects) {
                this.populationSituations.activeEffects = new Map(Object.entries(state.populationSituations.activeEffects));
            }
        }
        if (state.employment) Object.assign(this.employment, state.employment);
        if (state.education) {
            Object.assign(this.education, state.education);
            if (state.education.progressionQueue) {
                this.education.progressionQueue = new Map(Object.entries(state.education.progressionQueue));
            }
        }
        if (state.pendingBirths) {
            this.pendingBirths = new Map(Object.entries(state.pendingBirths));
        }
        if (state.populationStats) {
            this.populationStats = { ...state.populationStats };
        }
        if (state.history) {
            Object.assign(this.history, state.history);
        }
    }

    /**
     * Destroy the population system
     */
    destroy() {
        if (typeof EventBus !== 'undefined') {
            EventBus.off('day_passed', this.handleDayPassed, this);
            EventBus.off('month_passed', this.handleMonthPassed, this);
            EventBus.off('year_passed', this.handleYearPassed, this);
            EventBus.off('territory_added', this.handleTerritoryAdded, this);
            EventBus.off('territory_removed', this.handleTerritoryRemoved, this);
            EventBus.off('policy_changed', this.handlePolicyChanged, this);
            EventBus.off('infrastructure_built', this.handleInfrastructureBuilt, this);
        }
        
        this.isInitialized = false;
        console.log('Population System destroyed');
    }
}

// Create global population system instance
window.PopulationSystem = PopulationSystem;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PopulationSystem };
}