/**
 * Population Situations System Data
 * Dominion Wars - Nation Building Strategy Game
 * 
 * Crisis situations and social challenges that require player decisions
 * Each situation presents multiple choice options with different outcomes
 */

var PopulationSituations = {
    // ═══════════════════════════════════════════════════════════════
    // CRISIS SITUATIONS (60 situations)
    // ═══════════════════════════════════════════════════════════════
    crisis: [
        {
            id: 'housing_affordability_crisis',
            title: 'Housing Affordability Crisis',
            description: 'Skyrocketing real estate prices have made homeownership impossible for middle-class families. Protests demand government action.',
            urgency: 'high',
            choices: [
                {
                    text: 'Implement strict rent control and affordable housing mandates',
                    effects: { happiness: +8, money: -5000000, stability: +5 },
                    duration: 60
                },
                {
                    text: 'Provide massive subsidies for first-time homebuyers',
                    effects: { happiness: +12, money: -8000000, debt: +3000000 },
                    duration: 45
                },
                {
                    text: 'Zone more land for high-density affordable development',
                    effects: { happiness: +6, infrastructure: -10, population: +2000 },
                    duration: 90
                },
                {
                    text: 'Let market forces resolve the issue naturally',
                    effects: { happiness: -15, stability: -8, reputation: -5 },
                    duration: 30
                }
            ],
            weight: 12
        },
        {
            id: 'opioid_epidemic',
            title: 'Opioid Addiction Epidemic',
            description: 'Prescription drug abuse has spiraled into a national crisis affecting families across all social classes.',
            urgency: 'critical',
            choices: [
                {
                    text: 'Launch comprehensive addiction treatment and rehabilitation programs',
                    effects: { happiness: +10, healthcare: +15, money: -6000000 },
                    duration: 120
                },
                {
                    text: 'Crack down hard on drug dealers and prescription fraud',
                    effects: { crime: -12, happiness: +3, stability: +8, money: -2000000 },
                    duration: 90
                },
                {
                    text: 'Focus on prevention education in schools and communities',
                    effects: { education: +8, happiness: +5, money: -1500000 },
                    duration: 180
                },
                {
                    text: 'Declare a public health emergency with emergency funding',
                    effects: { healthcare: +20, happiness: +8, money: -10000000 },
                    duration: 60
                }
            ],
            weight: 8
        },
        {
            id: 'teacher_shortage_crisis',
            title: 'Critical Teacher Shortage',
            description: 'Low pay and difficult conditions have caused a mass exodus of teachers, with classrooms closing due to lack of staff.',
            urgency: 'high',
            choices: [
                {
                    text: 'Dramatically increase teacher salaries and benefits',
                    effects: { education: +20, happiness: +8, money: -7000000 },
                    duration: 90
                },
                {
                    text: 'Fast-track alternative certification for professionals',
                    effects: { education: +8, literacy: +5, money: -2000000 },
                    duration: 45
                },
                {
                    text: 'Implement emergency remote learning programs',
                    effects: { education: +3, technology: +5, happiness: -3 },
                    duration: 30
                },
                {
                    text: 'Recruit international teachers with visa incentives',
                    effects: { education: +12, money: -3000000, reputation: +4 },
                    duration: 75
                }
            ],
            weight: 10
        }
    ]
};

// Continue expanding crisis situations
PopulationSituations.crisis = [
    ...PopulationSituations.crisis,
    {
        id: 'climate_refugee_crisis',
        title: 'Climate Refugee Crisis',
        description: 'Thousands of climate refugees seek shelter in your nation as neighboring regions become uninhabitable due to extreme weather.',
        urgency: 'critical',
        choices: [
            {
                text: 'Open borders and provide comprehensive refugee support',
                effects: { happiness: +5, reputation: +15, money: -12000000, population: +5000 },
                duration: 90
            },
            {
                text: 'Establish temporary refugee camps with basic necessities',
                effects: { happiness: +2, reputation: +8, money: -6000000, stability: -3 },
                duration: 60
            },
            {
                text: 'Provide humanitarian aid but limit refugee acceptance',
                effects: { reputation: +5, money: -3000000, happiness: -2 },
                duration: 45
            },
            {
                text: 'Close borders and focus on domestic climate adaptation',
                effects: { reputation: -20, happiness: -8, stability: +5, money: -2000000 },
                duration: 30
            }
        ],
        weight: 6
    },
    {
        id: 'social_media_mental_health',
        title: 'Social Media Mental Health Crisis',
        description: 'Rising rates of depression and anxiety among youth are linked to excessive social media use, prompting calls for regulation.',
        urgency: 'high',
        choices: [
            {
                text: 'Implement strict social media regulations for minors',
                effects: { happiness: +8, health: +12, technology: -5, reputation: -3 },
                duration: 120
            },
            {
                text: 'Launch digital wellness education programs in schools',
                effects: { happiness: +6, health: +8, education: +5, money: -1500000 },
                duration: 180
            },
            {
                text: 'Partner with tech companies for voluntary safety measures',
                effects: { happiness: +3, health: +4, technology: +2, reputation: +2 },
                duration: 90
            },
            {
                text: 'Let parents and schools handle the issue independently',
                effects: { happiness: -5, health: -8, stability: -4 },
                duration: 30
            }
        ],
        weight: 11
    },
    {
        id: 'gig_economy_labor_dispute',
        title: 'Gig Economy Worker Rights Crisis',
        description: 'Massive protests by gig workers demand employment benefits and job security, disrupting transportation and delivery services.',
        urgency: 'high',
        choices: [
            {
                text: 'Mandate full employee benefits for all gig workers',
                effects: { happiness: +12, employment: +8, money: -4000000, technology: -3 },
                duration: 90
            },
            {
                text: 'Create a new hybrid employment category with limited benefits',
                effects: { happiness: +6, employment: +4, stability: +3, money: -2000000 },
                duration: 120
            },
            {
                text: 'Establish portable benefits that workers can carry between jobs',
                effects: { happiness: +8, employment: +6, technology: +2, money: -3000000 },
                duration: 150
            },
            {
                text: 'Maintain current independent contractor status',
                effects: { happiness: -10, employment: -5, stability: -8, technology: +5 },
                duration: 60
            }
        ],
        weight: 10
    },
    {
        id: 'artificial_intelligence_job_displacement',
        title: 'AI-Driven Job Displacement Crisis',
        description: 'Rapid AI adoption has eliminated hundreds of thousands of jobs faster than new ones are created, causing social unrest.',
        urgency: 'critical',
        choices: [
            {
                text: 'Implement universal basic income funded by AI productivity taxes',
                effects: { happiness: +15, stability: +10, money: -15000000, technology: +5 },
                duration: 365
            },
            {
                text: 'Massive government job creation and retraining programs',
                effects: { happiness: +8, employment: +15, education: +10, money: -12000000 },
                duration: 180
            },
            {
                text: 'Regulate AI adoption speed to allow gradual workforce transition',
                effects: { happiness: +6, employment: +8, technology: -8, stability: +5 },
                duration: 240
            },
            {
                text: 'Let market forces determine the pace of change',
                effects: { happiness: -18, employment: -20, stability: -15, technology: +10 },
                duration: 90
            }
        ],
        weight: 8
    },
    {
        id: 'demographic_winter',
        title: 'Demographic Winter Crisis',
        description: 'Birth rates have plummeted to unsustainable levels while the population rapidly ages, threatening economic collapse.',
        urgency: 'critical',
        choices: [
            {
                text: 'Massive family support programs and childcare subsidies',
                effects: { happiness: +10, population: +2000, money: -20000000, stability: +5 },
                duration: 300
            },
            {
                text: 'Open immigration policies to attract young families',
                effects: { population: +8000, happiness: -3, stability: -5, reputation: +8 },
                duration: 180
            },
            {
                text: 'Automation investment to compensate for labor shortage',
                effects: { technology: +20, productivity: +15, employment: -10, money: -8000000 },
                duration: 200
            },
            {
                text: 'Raise retirement age and extend working years',
                effects: { happiness: -12, employment: +5, stability: -8, productivity: -5 },
                duration: 120
            }
        ],
        weight: 5
    }
];

// Add social issues situations
PopulationSituations.social = [
    {
        id: 'income_inequality_protests',
        title: 'Income Inequality Protests',
        description: 'Massive demonstrations against wealth inequality have shut down major cities as protesters demand economic justice.',
        urgency: 'high',
        choices: [
            {
                text: 'Implement progressive wealth taxation and redistribution',
                effects: { happiness: +8, stability: +12, money: +5000000, reputation: -5 },
                duration: 180
            },
            {
                text: 'Increase minimum wage and expand social programs',
                effects: { happiness: +12, stability: +6, money: -8000000, employment: -3 },
                duration: 120
            },
            {
                text: 'Create job training programs for high-paying careers',
                effects: { happiness: +6, employment: +10, education: +8, money: -4000000 },
                duration: 200
            },
            {
                text: 'Use police force to maintain order and clear protests',
                effects: { stability: +3, happiness: -15, reputation: -12, money: -1000000 },
                duration: 30
            }
        ],
        weight: 9
    },
    {
        id: 'racial_justice_movement',
        title: 'Racial Justice Movement',
        description: 'A powerful civil rights movement demands systemic reforms to address historical and ongoing racial discrimination.',
        urgency: 'high',
        choices: [
            {
                text: 'Comprehensive criminal justice and police reform',
                effects: { happiness: +12, stability: +8, reputation: +10, money: -6000000 },
                duration: 240
            },
            {
                text: 'Reparations program for historically disadvantaged communities',
                effects: { happiness: +15, stability: +10, money: -25000000, reputation: +8 },
                duration: 300
            },
            {
                text: 'Education and employment opportunity programs',
                effects: { happiness: +8, education: +12, employment: +8, money: -8000000 },
                duration: 180
            },
            {
                text: 'Gradual reforms while maintaining current systems',
                effects: { happiness: -5, stability: -8, reputation: -6, money: -2000000 },
                duration: 90
            }
        ],
        weight: 8
    },
    {
        id: 'gender_pay_gap_crisis',
        title: 'Gender Pay Gap Crisis',
        description: 'International scrutiny over persistent gender wage gaps has led to calls for mandatory pay equity legislation.',
        urgency: 'medium',
        choices: [
            {
                text: 'Mandate pay transparency and equal pay enforcement',
                effects: { happiness: +10, stability: +5, reputation: +12, money: -2000000 },
                duration: 200
            },
            {
                text: 'Provide tax incentives for companies achieving pay equity',
                effects: { happiness: +6, reputation: +8, money: -4000000, employment: +3 },
                duration: 180
            },
            {
                text: 'Support voluntary corporate diversity initiatives',
                effects: { happiness: +3, reputation: +4, money: -1000000 },
                duration: 120
            },
            {
                text: 'Maintain current approach and let market forces work',
                effects: { happiness: -8, reputation: -10, stability: -3 },
                duration: 60
            }
        ],
        weight: 10
    }
];

// Add technological disruption situations
PopulationSituations.technology = [
    {
        id: 'deepfake_misinformation_crisis',
        title: 'Deepfake Misinformation Crisis',
        description: 'Sophisticated AI-generated fake videos are undermining trust in media and democratic institutions.',
        urgency: 'critical',
        choices: [
            {
                text: 'Ban deepfake technology and criminalize malicious use',
                effects: { stability: +10, technology: -8, reputation: -5, money: -3000000 },
                duration: 150
            },
            {
                text: 'Mandatory digital authenticity verification systems',
                effects: { stability: +8, technology: +5, money: -5000000, happiness: -2 },
                duration: 200
            },
            {
                text: 'Public education campaigns on digital media literacy',
                effects: { stability: +5, education: +8, money: -2000000, happiness: +3 },
                duration: 180
            },
            {
                text: 'Self-regulation by tech platforms and media companies',
                effects: { stability: -3, technology: +3, reputation: -8, happiness: -5 },
                duration: 90
            }
        ],
        weight: 8
    },
    {
        id: 'quantum_computing_security_threat',
        title: 'Quantum Computing Security Threat',
        description: 'Advances in quantum computing threaten to break current encryption, compromising all digital security.',
        urgency: 'critical',
        choices: [
            {
                text: 'Emergency quantum-resistant cryptography deployment',
                effects: { technology: +15, stability: +12, money: -15000000, reputation: +5 },
                duration: 300
            },
            {
                text: 'International cooperation on quantum security standards',
                effects: { technology: +10, reputation: +12, money: -8000000, stability: +8 },
                duration: 250
            },
            {
                text: 'Accelerated development of national quantum capabilities',
                effects: { technology: +20, money: -20000000, stability: +5, reputation: +3 },
                duration: 400
            },
            {
                text: 'Temporary restriction on quantum research and development',
                effects: { technology: -10, stability: +3, reputation: -8, money: +2000000 },
                duration: 120
            }
        ],
        weight: 4
    }
];

// Add environmental crisis situations
PopulationSituations.environmental = [
    {
        id: 'plastic_pollution_crisis',
        title: 'Plastic Pollution Emergency',
        description: 'Microplastics have been found in drinking water and food supplies, causing public health concerns.',
        urgency: 'high',
        choices: [
            {
                text: 'Ban single-use plastics and implement circular economy',
                effects: { health: +15, reputation: +12, money: -6000000, happiness: +8 },
                duration: 300
            },
            {
                text: 'Massive plastic cleanup and recycling infrastructure',
                effects: { health: +10, employment: +8, money: -10000000, technology: +5 },
                duration: 250
            },
            {
                text: 'Plastic taxes and producer responsibility programs',
                effects: { health: +8, money: +3000000, happiness: -2, reputation: +6 },
                duration: 200
            },
            {
                text: 'Research and development of plastic alternatives',
                effects: { health: +5, technology: +12, money: -4000000, reputation: +4 },
                duration: 400
            }
        ],
        weight: 9
    },
    {
        id: 'water_scarcity_crisis',
        title: 'Severe Water Scarcity Crisis',
        description: 'Prolonged drought and overuse have created critical water shortages affecting millions of citizens.',
        urgency: 'critical',
        choices: [
            {
                text: 'Emergency desalination plant construction',
                effects: { health: +12, happiness: +10, money: -15000000, technology: +8 },
                duration: 200
            },
            {
                text: 'Strict water rationing and conservation measures',
                effects: { health: +8, happiness: -8, stability: -5, money: +2000000 },
                duration: 120
            },
            {
                text: 'Massive water recycling and treatment infrastructure',
                effects: { health: +10, technology: +10, money: -12000000, happiness: +5 },
                duration: 300
            },
            {
                text: 'Water importation and interstate water agreements',
                effects: { health: +6, money: -8000000, reputation: -3, happiness: +3 },
                duration: 150
            }
        ],
        weight: 7
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PopulationSituations;
} else if (typeof window !== 'undefined') {
    window.PopulationSituations = PopulationSituations;
}