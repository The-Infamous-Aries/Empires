/**
 * Population Events System Data
 * Dominion Wars - Nation Building Strategy Game
 * 
 * Events affecting demographics, social issues, health, education, and quality of life
 * Includes both temporary events and ongoing situations requiring player decisions
 */

var PopulationEvents = {
    // ═══════════════════════════════════════════════════════════════
    // DEMOGRAPHIC EVENTS (50 events)
    // ═══════════════════════════════════════════════════════════════
    demographic: [
        {
            id: 'baby_boom_generation',
            name: 'Baby Boom Generation',
            description: 'Improved healthcare and economic prosperity trigger a significant increase in birth rates.',
            duration: 180,
            effects: { happiness: 8, healthcare: -5 },
            weight: 7
        },
        {
            id: 'aging_society_milestone',
            name: 'Aging Society Milestone',
            description: 'Your nation officially becomes an aged society with 20% of population over retirement age.',
            duration: 90,
            effects: { healthcare: -15, education: 5, employment: -3 },
            weight: 8
        },
        {
            id: 'youth_bulge',
            name: 'Youth Population Surge',
            description: 'A large cohort reaches working age, creating opportunities and challenges.',
            duration: 120,
            effects: { employment: -8, education: -10, innovation: 6 },
            weight: 9
        },
        {
            id: 'migration_wave_skilled',
            name: 'Skilled Worker Migration',
            description: 'Highly educated professionals immigrate, bringing valuable expertise.',
            duration: 60,
            effects: { happiness: 3, technology: 25, education: 8 },
            weight: 10
        },
        {
            id: 'rural_urban_shift',
            name: 'Rural-Urban Migration Surge',
            description: 'Massive population movement from rural areas to cities strains urban infrastructure.',
            duration: 150,
            effects: { happiness: -5, infrastructure: -20, employment: 4 },
            weight: 12
        },
        {
            id: 'expatriate_return',
            name: 'Expatriate Return Wave',
            description: 'Citizens living abroad return home, bringing international experience and capital.',
            duration: 75,
            effects: { happiness: 6, money: 800000, technology: 15 },
            weight: 8
        },
        {
            id: 'census_surprise',
            name: 'Census Reveals Population Boom',
            description: 'Official census data shows population growth far exceeded projections.',
            duration: 30,
            effects: { happiness: 5, infrastructure: -15, resources: -3 },
            weight: 6
        }
    ],

    // ═══════════════════════════════════════════════════════════════
    // HEALTH & WELLNESS EVENTS (40 events)
    // ═══════════════════════════════════════════════════════════════
    health: [
        {
            id: 'public_health_campaign_success',
            name: 'Public Health Campaign Success',
            description: 'A nationwide health awareness campaign significantly improves citizen wellness.',
            duration: 120,
            effects: { happiness: 12, healthcare: 15, productivity: 8 },
            weight: 10
        },
        {
            id: 'medical_tourism_boom',
            name: 'Medical Tourism Boom',
            description: 'World-class healthcare facilities attract international patients.',
            duration: 200,
            effects: { money: 2200000, happiness: 6, reputation: 8 },
            weight: 7
        },
        {
            id: 'mental_health_awareness',
            name: 'Mental Health Awareness Movement',
            description: 'Society embraces mental health support, reducing stigma and improving treatment.',
            duration: 180,
            effects: { happiness: 15, healthcare: 10, productivity: 6 },
            weight: 9
        },
        {
            id: 'fitness_revolution',
            name: 'National Fitness Revolution',
            description: 'Citizens embrace active lifestyles, dramatically improving public health.',
            duration: 365,
            effects: { happiness: 10, healthcare: 12, productivity: 5 },
            weight: 8
        }
    ]
};

// Expand health events significantly
PopulationEvents.health = [
    ...PopulationEvents.health,
    {
        id: 'universal_healthcare_success',
        name: 'Universal Healthcare Success',
        description: 'Implementation of universal healthcare dramatically improves population health outcomes.',
        duration: 500,
        effects: { happiness: 20, healthcare: 25, productivity: 10 },
        weight: 5
    },
    {
        id: 'obesity_epidemic',
        name: 'National Obesity Epidemic',
        description: 'Rising obesity rates strain healthcare systems and reduce quality of life.',
        duration: 300,
        effects: { happiness: -8, healthcare: -15, productivity: -5 },
        weight: 9
    },
    {
        id: 'medical_breakthrough_local',
        name: 'Local Medical Research Breakthrough',
        description: 'Domestic researchers develop revolutionary treatments for common diseases.',
        duration: 200,
        effects: { happiness: 15, healthcare: 20, reputation: 8 },
        weight: 6
    },
    {
        id: 'preventive_care_program',
        name: 'Preventive Care Program Success',
        description: 'Comprehensive preventive care programs significantly reduce disease rates.',
        duration: 400,
        effects: { happiness: 12, healthcare: 18, money: 1500000 },
        weight: 8
    },
    {
        id: 'healthcare_worker_shortage',
        name: 'Critical Healthcare Worker Shortage',
        description: 'Severe shortage of doctors and nurses compromises healthcare quality.',
        duration: 250,
        effects: { happiness: -10, healthcare: -20, productivity: -3 },
        weight: 10
    },
    {
        id: 'telemedicine_adoption',
        name: 'Telemedicine Revolution',
        description: 'Widespread adoption of telemedicine improves healthcare accessibility.',
        duration: 300,
        effects: { happiness: 8, healthcare: 12, technology: 15 },
        weight: 9
    },
    {
        id: 'pharmaceutical_innovation',
        name: 'Pharmaceutical Industry Innovation',
        description: 'Local pharmaceutical companies develop groundbreaking medications.',
        duration: 350,
        effects: { happiness: 10, healthcare: 15, money: 2500000, technology: 20 },
        weight: 6
    },
    {
        id: 'health_insurance_reform',
        name: 'Health Insurance System Reform',
        description: 'Reformed health insurance provides better coverage at lower costs.',
        duration: 400,
        effects: { happiness: 15, healthcare: 18, money: 2000000 },
        weight: 7
    },
    {
        id: 'medical_malpractice_crisis',
        name: 'Medical Malpractice Crisis',
        description: 'Rising malpractice lawsuits create healthcare system instability.',
        duration: 180,
        effects: { happiness: -6, healthcare: -10, money: -1800000 },
        weight: 7
    },
    {
        id: 'elderly_care_innovation',
        name: 'Elderly Care Innovation',
        description: 'Innovative elderly care programs improve quality of life for seniors.',
        duration: 450,
        effects: { happiness: 12, healthcare: 16, money: -800000 },
        weight: 8
    }
];

// Add comprehensive education events  
PopulationEvents.education = [
    {
        id: 'education_technology_revolution',
        name: 'Education Technology Revolution',
        description: 'Advanced educational technology transforms learning outcomes nationwide.',
        duration: 400,
        effects: { education: 20, literacy: 15, technology: 10, happiness: 8 },
        weight: 8
    },
    {
        id: 'university_ranking_success',
        name: 'University Ranking Success',
        description: 'National universities achieve top global rankings, attracting international students.',
        duration: 300,
        effects: { education: 15, reputation: 12, money: 3000000, happiness: 6 },
        weight: 6
    },
    {
        id: 'vocational_training_expansion',
        name: 'Vocational Training Expansion',
        description: 'Comprehensive vocational programs address skills gaps in the workforce.',
        duration: 350,
        effects: { education: 12, employment: 10, productivity: 8, happiness: 5 },
        weight: 9
    },
    {
        id: 'adult_literacy_campaign',
        name: 'Adult Literacy Campaign Success',
        description: 'Nationwide adult education programs dramatically improve literacy rates.',
        duration: 500,
        effects: { literacy: 25, education: 10, employment: 5, happiness: 8 },
        weight: 7
    },
    {
        id: 'stem_education_initiative',
        name: 'STEM Education Initiative',
        description: 'Focus on science, technology, engineering, and math education pays dividends.',
        duration: 600,
        effects: { education: 18, technology: 15, innovation: 10, employment: 6 },
        weight: 8
    },
    {
        id: 'education_budget_crisis',
        name: 'Education Budget Crisis',
        description: 'Severe cuts to education funding compromise school quality nationwide.',
        duration: 200,
        effects: { education: -15, literacy: -8, happiness: -12, employment: -5 },
        weight: 6
    },
    {
        id: 'international_student_boom',
        name: 'International Student Boom',
        description: 'Your universities become preferred destinations for international students.',
        duration: 250,
        effects: { education: 8, money: 2200000, reputation: 10, technology: 5 },
        weight: 9
    },
    {
        id: 'digital_library_network',
        name: 'National Digital Library Network',
        description: 'Comprehensive digital library system provides universal access to knowledge.',
        duration: 400,
        effects: { education: 12, literacy: 10, technology: 8, happiness: 6 },
        weight: 10
    },
    {
        id: 'teacher_excellence_program',
        name: 'Teacher Excellence Program',
        description: 'Intensive teacher training and development programs improve education quality.',
        duration: 350,
        effects: { education: 20, happiness: 10, money: -2000000 },
        weight: 8
    },
    {
        id: 'educational_inequality_crisis',
        name: 'Educational Inequality Crisis',
        description: 'Growing gaps between rich and poor schools threaten social cohesion.',
        duration: 300,
        effects: { education: -10, happiness: -8, stability: -6, employment: -4 },
        weight: 7
    }
];

// Add social welfare and housing events
PopulationEvents.welfare = [
    {
        id: 'universal_basic_income_pilot',
        name: 'Universal Basic Income Pilot Success',
        description: 'Pilot UBI program shows promising results in reducing poverty and stress.',
        duration: 400,
        effects: { happiness: 18, stability: 12, money: -5000000, employment: -3 },
        weight: 5
    },
    {
        id: 'affordable_housing_program',
        name: 'Affordable Housing Program Success',
        description: 'Large-scale affordable housing construction addresses housing crisis.',
        duration: 600,
        effects: { happiness: 15, stability: 10, infrastructure: 40, money: -8000000 },
        weight: 7
    },
    {
        id: 'social_security_reform',
        name: 'Social Security System Reform',
        description: 'Reformed social security provides better benefits with improved sustainability.',
        duration: 500,
        effects: { happiness: 12, stability: 15, money: -3000000 },
        weight: 6
    },
    {
        id: 'homelessness_elimination',
        name: 'Homelessness Elimination Success',
        description: 'Comprehensive programs successfully end homelessness in major cities.',
        duration: 450,
        effects: { happiness: 20, stability: 15, reputation: 12, money: -4000000 },
        weight: 5
    },
    {
        id: 'childcare_support_program',
        name: 'Universal Childcare Program',
        description: 'Affordable, quality childcare enables more parents to work and improves child outcomes.',
        duration: 400,
        effects: { happiness: 16, employment: 8, productivity: 6, money: -3500000 },
        weight: 8
    },
    {
        id: 'welfare_fraud_scandal',
        name: 'Welfare System Fraud Scandal',
        description: 'Widespread fraud in welfare systems creates public outrage and budget problems.',
        duration: 180,
        effects: { happiness: -8, stability: -6, money: -2000000, reputation: -5 },
        weight: 6
    },
    {
        id: 'disability_rights_advancement',
        name: 'Disability Rights Advancement',
        description: 'Comprehensive disability support programs gain international recognition.',
        duration: 350,
        effects: { happiness: 12, stability: 8, reputation: 10, money: -1800000 },
        weight: 7
    },
    {
        id: 'senior_citizen_support',
        name: 'Senior Citizen Support Enhancement',
        description: 'Expanded support for elderly citizens improves quality of life in aging society.',
        duration: 400,
        effects: { happiness: 14, healthcare: 10, money: -2500000 },
        weight: 9
    },
    {
        id: 'food_security_program',
        name: 'Food Security Program Success',
        description: 'Comprehensive nutrition programs eliminate hunger and malnutrition.',
        duration: 300,
        effects: { happiness: 15, health: 12, productivity: 6, money: -1500000 },
        weight: 8
    },
    {
        id: 'welfare_system_overhaul',
        name: 'Welfare System Modernization',
        description: 'Digital transformation of welfare systems improves efficiency and reduces fraud.',
        duration: 250,
        effects: { happiness: 8, stability: 6, money: 1000000, technology: 5 },
        weight: 9
    }
];

// Add employment and workplace events
PopulationEvents.employment = [
    {
        id: 'full_employment_achievement',
        name: 'Full Employment Achievement',
        description: 'Unemployment drops to historic lows as job opportunities abound.',
        duration: 200,
        effects: { happiness: 25, stability: 15, productivity: 12, employment: 20 },
        weight: 4
    },
    {
        id: 'four_day_work_week',
        name: 'Four-Day Work Week Adoption',
        description: 'Nationwide adoption of four-day work weeks improves work-life balance.',
        duration: 500,
        effects: { happiness: 20, productivity: 8, health: 10, employment: -2 },
        weight: 6
    },
    {
        id: 'gig_economy_boom',
        name: 'Gig Economy Expansion',
        description: 'Flexible work arrangements become mainstream, changing employment patterns.',
        duration: 350,
        effects: { employment: 10, happiness: 5, technology: 8, stability: -3 },
        weight: 10
    },
    {
        id: 'workplace_safety_revolution',
        name: 'Workplace Safety Revolution',
        description: 'Advanced safety technologies dramatically reduce workplace injuries.',
        duration: 400,
        effects: { happiness: 12, productivity: 8, health: 15, money: -1200000 },
        weight: 9
    },
    {
        id: 'remote_work_adoption',
        name: 'Remote Work Revolution',
        description: 'Widespread remote work adoption changes employment landscapes permanently.',
        duration: 600,
        effects: { happiness: 15, technology: 10, productivity: 6, infrastructure: -5 },
        weight: 11
    },
    {
        id: 'mass_layoffs_crisis',
        name: 'Mass Corporate Layoffs',
        description: 'Economic restructuring leads to widespread job losses across industries.',
        duration: 180,
        effects: { happiness: -20, stability: -12, employment: -15, productivity: -8 },
        weight: 7
    },
    {
        id: 'skills_retraining_program',
        name: 'National Skills Retraining Program',
        description: 'Comprehensive retraining programs help workers adapt to changing economy.',
        duration: 450,
        effects: { employment: 12, education: 8, productivity: 10, money: -2800000 },
        weight: 8
    },
    {
        id: 'minimum_wage_increase',
        name: 'Significant Minimum Wage Increase',
        description: 'Substantial minimum wage increases improve living standards for low-income workers.',
        duration: 300,
        effects: { happiness: 12, stability: 6, employment: -4, productivity: 2 },
        weight: 9
    },
    {
        id: 'worker_rights_expansion',
        name: 'Worker Rights Expansion',
        description: 'Enhanced worker protections and rights gain international recognition.',
        duration: 400,
        effects: { happiness: 15, stability: 10, reputation: 8, productivity: 3 },
        weight: 7
    },
    {
        id: 'automation_job_transition',
        name: 'Successful Automation Transition',
        description: 'Smooth transition programs help workers adapt to automated industries.',
        duration: 500,
        effects: { employment: 8, technology: 12, productivity: 15, money: -3000000 },
        weight: 6
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PopulationEvents;
} else if (typeof window !== 'undefined') {
    window.PopulationEvents = PopulationEvents;
}