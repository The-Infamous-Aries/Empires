/**
 * Healthcare Research Branch - Medical knowledge, public health, and disease management
 * Progression: Ancient Medicine → Classical → Medieval → Renaissance → Industrial → Modern → Contemporary → Biotechnology → Genetic → Advanced
 */

const HealthcareResearch = {
    // Tier 1 - Ancient Medicine (3000-500 BCE)
    herbal_remedies: {
        id: 'herbal_remedies', name: 'Herbal Remedies', category: 'healthcare', tier: 1,
        description: 'Basic knowledge of medicinal plants and natural treatments',
        requirements: { tech_level: 1 },
        time: 32, cost: 20000,
        effects: { disease_resistance: 5, population_health: 3, natural_healing: 8 },
        unlocks: ['traditional_medicine']
    },
    
    basic_anatomy: {
        id: 'basic_anatomy', name: 'Basic Anatomy', category: 'healthcare', tier: 1,
        description: 'Fundamental understanding of human body structure',
        requirements: { tech_level: 1 },
        time: 40, cost: 25000,
        effects: { medical_knowledge: 8, surgery_preparation: 5, healing_efficiency: 10 },
        unlocks: ['wound_treatment', 'nutrition_science']
    },
    
    sanitation_basics: {
        id: 'sanitation_basics', name: 'Basic Sanitation', category: 'healthcare', tier: 1,
        description: 'Understanding of cleanliness and waste management',
        requirements: { tech_level: 1 },
        time: 36, cost: 22000,
        effects: { disease_prevention: 12, urban_health: 8, population_growth: 3 },
        unlocks: ['water_purification']
    },
    
    // Tier 2 - Classical Medicine (500 BCE - 500 CE)
    traditional_medicine: {
        id: 'traditional_medicine', name: 'Traditional Medicine', category: 'healthcare', tier: 2,
        description: 'Systematic approach to natural healing and diagnosis',
        requirements: { tech_level: 2, prerequisites: ['herbal_remedies'] },
        time: 60, cost: 45000,
        effects: { healing_effectiveness: 15, chronic_disease_management: 10, medical_tradition: 12 },
        unlocks: ['medicinal_compounds']
    },
    
    wound_treatment: {
        id: 'wound_treatment', name: 'Wound Treatment', category: 'healthcare', tier: 2,
        description: 'Advanced techniques for treating injuries and trauma',
        requirements: { tech_level: 2, prerequisites: ['basic_anatomy'] },
        time: 48, cost: 40000,
        effects: { trauma_survival: 20, military_recovery: 15, accident_prevention: 8 },
        unlocks: ['basic_surgery']
    },
    
    water_purification: {
        id: 'water_purification', name: 'Water Purification', category: 'healthcare', tier: 2,
        description: 'Methods for cleaning and sanitizing water supplies',
        requirements: { tech_level: 2, prerequisites: ['sanitation_basics'] },
        time: 54, cost: 42000,
        effects: { waterborne_disease_resistance: 25, urban_capacity: 15, public_health: 12 },
        unlocks: ['aqueduct_systems']
    },
    
    nutrition_science: {
        id: 'nutrition_science', name: 'Nutrition Science', category: 'healthcare', tier: 2,
        description: 'Understanding of dietary needs and food safety',
        requirements: { tech_level: 2, prerequisites: ['basic_anatomy'] },
        time: 66, cost: 48000,
        effects: { malnutrition_prevention: 20, food_safety: 15, growth_rate: 8 },
        unlocks: []
    },

    // Tier 3 - Medieval Medicine (500-1000 CE)
    basic_surgery: {
        id: 'basic_surgery', name: 'Surgical Techniques', category: 'healthcare', tier: 3,
        description: 'Fundamental surgical procedures and wound repair',
        requirements: { tech_level: 3, prerequisites: ['wound_treatment'] },
        time: 84, cost: 75000,
        effects: { surgical_success: 30, trauma_treatment: 25, medical_prestige: 15 },
        unlocks: ['advanced_surgery', 'anatomical_studies']
    },
    
    medicinal_compounds: {
        id: 'medicinal_compounds', name: 'Medicinal Compounds', category: 'healthcare', tier: 3,
        description: 'Creation of complex medicines from multiple ingredients',
        requirements: { tech_level: 3, prerequisites: ['traditional_medicine'] },
        time: 72, cost: 65000,
        effects: { pharmaceutical_effectiveness: 25, disease_treatment: 20, medicine_production: 18 },
        unlocks: ['pharmacy_science']
    },
    
    aqueduct_systems: {
        id: 'aqueduct_systems', name: 'Aqueduct Systems', category: 'healthcare', tier: 3,
        description: 'Large-scale water distribution infrastructure',
        requirements: { tech_level: 3, prerequisites: ['water_purification'] },
        time: 96, cost: 85000,
        effects: { city_health: 35, population_capacity: 25, infrastructure_health: 20 },
        unlocks: []
    },

    // Tier 4 - Renaissance Medicine (1000-1500 CE) - Early Modern Era
    advanced_surgery: {
        id: 'advanced_surgery', name: 'Advanced Surgery', category: 'healthcare', tier: 4,
        description: 'Complex surgical procedures with improved techniques',
        requirements: { tech_level: 4, prerequisites: ['basic_surgery'] },
        time: 120, cost: 120000,
        effects: { surgical_precision: 40, complex_procedures: 30, medical_advancement: 25 },
        unlocks: ['anesthesia']
    },
    
    pharmacy_science: {
        id: 'pharmacy_science', name: 'Pharmaceutical Science', category: 'healthcare', tier: 4,
        description: 'Scientific approach to drug preparation and dosage',
        requirements: { tech_level: 4, prerequisites: ['medicinal_compounds'] },
        time: 108, cost: 110000,
        effects: { drug_effectiveness: 35, dosage_precision: 25, pharmaceutical_industry: 20 },
        unlocks: ['chemical_medicine']
    },
    
    anatomical_studies: {
        id: 'anatomical_studies', name: 'Anatomical Studies', category: 'healthcare', tier: 4,
        description: 'Detailed study of human anatomy through dissection',
        requirements: { tech_level: 4, prerequisites: ['basic_surgery'] },
        time: 132, cost: 130000,
        effects: { medical_understanding: 45, diagnostic_accuracy: 30, teaching_medicine: 25 },
        unlocks: ['germ_theory']
    },

    // Tier 5 - Industrial Medicine (1500-1800) - Modern Era Begins
    anesthesia: {
        id: 'anesthesia', name: 'Anesthesia', category: 'healthcare', tier: 5,
        description: 'Pain relief during surgical procedures',
        requirements: { tech_level: 5, prerequisites: ['advanced_surgery'] },
        time: 144, cost: 180000,
        effects: { surgical_comfort: 50, complex_surgery_success: 40, medical_revolution: 30 },
        unlocks: ['modern_surgery']
    },
    
    chemical_medicine: {
        id: 'chemical_medicine', name: 'Chemical Medicine', category: 'healthcare', tier: 5,
        description: 'Chemically synthesized drugs and treatments',
        requirements: { tech_level: 5, prerequisites: ['pharmacy_science'] },
        time: 156, cost: 200000,
        effects: { synthetic_drugs: 45, treatment_precision: 35, pharmaceutical_production: 30 },
        unlocks: ['antibiotics', 'vaccines']
    },
    
    germ_theory: {
        id: 'germ_theory', name: 'Germ Theory', category: 'healthcare', tier: 5,
        description: 'Understanding that microorganisms cause disease',
        requirements: { tech_level: 5, prerequisites: ['anatomical_studies'] },
        time: 168, cost: 220000,
        effects: { disease_understanding: 60, infection_control: 45, public_health_revolution: 35 },
        unlocks: []
    },

    // Tier 6 - Scientific Medicine (1800-1900) - Full Modern Era
    antibiotics: {
        id: 'antibiotics', name: 'Antibiotic Medicine', category: 'healthcare', tier: 6,
        description: 'Drugs that kill or inhibit bacterial growth',
        requirements: { tech_level: 6, prerequisites: ['chemical_medicine'] },
        time: 180, cost: 280000,
        effects: { bacterial_infection_cure: 70, mortality_reduction: 50, medical_breakthrough: 40 },
        unlocks: []
    },
    
    vaccines: {
        id: 'vaccines', name: 'Vaccination', category: 'healthcare', tier: 6,
        description: 'Immunization against infectious diseases',
        requirements: { tech_level: 6, prerequisites: ['chemical_medicine'] },
        time: 192, cost: 300000,
        effects: { epidemic_prevention: 80, childhood_mortality: -60, herd_immunity: 45 },
        unlocks: ['immunology']
    },
    
    modern_surgery: {
        id: 'modern_surgery', name: 'Modern Surgery', category: 'healthcare', tier: 6,
        description: 'Sterile, precise surgical techniques with anesthesia',
        requirements: { tech_level: 6, prerequisites: ['anesthesia', 'germ_theory'] },
        time: 204, cost: 320000,
        effects: { surgical_success_rate: 80, complex_operations: 60, medical_specialization: 40 },
        unlocks: ['organ_transplants']
    },

    // Tier 7 - 20th Century Medicine (1900-1945) - Contemporary Era
    immunology: {
        id: 'immunology', name: 'Immunology', category: 'healthcare', tier: 7,
        description: 'Scientific study of the immune system',
        requirements: { tech_level: 7, prerequisites: ['vaccines'] },
        time: 216, cost: 400000,
        effects: { immune_system_understanding: 70, autoimmune_treatment: 50, allergy_management: 40 },
        unlocks: []
    },
    
    radiology: {
        id: 'radiology', name: 'Medical Radiology', category: 'healthcare', tier: 7,
        description: 'X-rays and radiation for diagnosis and treatment',
        requirements: { tech_level: 7, prerequisites: ['modern_surgery'] },
        time: 228, cost: 450000,
        effects: { diagnostic_imaging: 75, internal_diagnosis: 60, cancer_treatment: 45 },
        unlocks: ['ct_scanning']
    },
    
    blood_transfusion: {
        id: 'blood_transfusion', name: 'Blood Transfusion', category: 'healthcare', tier: 7,
        description: 'Safe transfer of blood between individuals',
        requirements: { tech_level: 7, prerequisites: ['modern_surgery'] },
        time: 240, cost: 480000,
        effects: { surgical_survival: 85, trauma_care: 70, blood_disorder_treatment: 50 },
        unlocks: []
    },

    // Tier 8 - Mid 20th Century (1945-1980) - Advanced Medicine
    organ_transplants: {
        id: 'organ_transplants', name: 'Organ Transplantation', category: 'healthcare', tier: 8,
        description: 'Surgical replacement of damaged organs',
        requirements: { tech_level: 8, prerequisites: ['immunology', 'modern_surgery'] },
        time: 264, cost: 600000,
        effects: { organ_failure_treatment: 90, life_extension: 75, surgical_mastery: 60 },
        unlocks: ['tissue_engineering']
    },
    
    ct_scanning: {
        id: 'ct_scanning', name: 'CT Scanning', category: 'healthcare', tier: 8,
        description: 'Detailed cross-sectional imaging of the body',
        requirements: { tech_level: 8, prerequisites: ['radiology'] },
        time: 252, cost: 550000,
        effects: { diagnostic_precision: 90, early_detection: 70, treatment_planning: 55 },
        unlocks: ['mri_imaging']
    },
    
    psychopharmacology: {
        id: 'psychopharmacology', name: 'Psychopharmacology', category: 'healthcare', tier: 8,
        description: 'Drugs for treating mental health conditions',
        requirements: { tech_level: 8, prerequisites: ['antibiotics'] },
        time: 276, cost: 580000,
        effects: { mental_health_treatment: 80, psychological_stability: 60, social_functionality: 45 },
        unlocks: ['personalized_medicine']
    },

    // Tier 9 - Late 20th Century (1980-2000) - Biotechnology Era
    mri_imaging: {
        id: 'mri_imaging', name: 'MRI Imaging', category: 'healthcare', tier: 9,
        description: 'Magnetic resonance imaging for detailed soft tissue visualization',
        requirements: { tech_level: 9, prerequisites: ['ct_scanning'] },
        time: 288, cost: 750000,
        effects: { soft_tissue_diagnosis: 95, brain_imaging: 85, non_invasive_diagnosis: 70 },
        unlocks: []
    },
    
    tissue_engineering: {
        id: 'tissue_engineering', name: 'Tissue Engineering', category: 'healthcare', tier: 9,
        description: 'Growing replacement tissues and organs in laboratory',
        requirements: { tech_level: 9, prerequisites: ['organ_transplants'] },
        time: 300, cost: 850000,
        effects: { regenerative_medicine: 85, organ_shortage_solution: 75, rejection_prevention: 60 },
        unlocks: ['stem_cell_therapy']
    },
    
    gene_therapy: {
        id: 'gene_therapy', name: 'Gene Therapy', category: 'healthcare', tier: 9,
        description: 'Treatment of genetic disorders by modifying genes',
        requirements: { tech_level: 9, prerequisites: ['psychopharmacology'] },
        time: 312, cost: 900000,
        effects: { genetic_disorder_treatment: 80, inherited_disease_cure: 70, molecular_medicine: 65 },
        unlocks: ['crispr_editing']
    },

    // Tier 10 - 21st Century (2000-2030) - Precision Medicine
    stem_cell_therapy: {
        id: 'stem_cell_therapy', name: 'Stem Cell Therapy', category: 'healthcare', tier: 10,
        description: 'Using stem cells to repair and replace damaged tissues',
        requirements: { tech_level: 10, prerequisites: ['tissue_engineering'] },
        time: 324, cost: 1200000,
        effects: { cellular_regeneration: 95, degenerative_disease_treatment: 85, healing_acceleration: 75 },
        unlocks: ['organ_regeneration']
    },
    
    crispr_editing: {
        id: 'crispr_editing', name: 'CRISPR Gene Editing', category: 'healthcare', tier: 10,
        description: 'Precise editing of DNA sequences to treat disease',
        requirements: { tech_level: 10, prerequisites: ['gene_therapy'] },
        time: 336, cost: 1400000,
        effects: { genetic_precision: 90, disease_elimination: 80, hereditary_cure: 75 },
        unlocks: ['ai_diagnosis']
    },
    
    personalized_medicine: {
        id: 'personalized_medicine', name: 'Personalized Medicine', category: 'healthcare', tier: 10,
        description: 'Treatments tailored to individual genetic profiles',
        requirements: { tech_level: 10, prerequisites: ['mri_imaging', 'gene_therapy'] },
        time: 348, cost: 1300000,
        effects: { treatment_effectiveness: 95, adverse_reaction_reduction: 80, precision_dosing: 70 },
        unlocks: ['nanomedicine']
    },

    // Tier 11 - Near Future (2030-2050) - Nanotechnology & AI Medicine
    organ_regeneration: {
        id: 'organ_regeneration', name: 'Organ Regeneration', category: 'healthcare', tier: 11,
        description: 'Complete regeneration of organs in vivo using stem cells',
        requirements: { tech_level: 11, prerequisites: ['stem_cell_therapy'] },
        time: 360, cost: 1800000,
        effects: { complete_organ_replacement: 100, aging_reversal: 85, immortality_research: 70 },
        unlocks: ['biological_immortality']
    },
    
    nanomedicine: {
        id: 'nanomedicine', name: 'Nanomedicine', category: 'healthcare', tier: 11,
        description: 'Microscopic robots for targeted drug delivery and repair',
        requirements: { tech_level: 11, prerequisites: ['personalized_medicine'] },
        time: 372, cost: 2000000,
        effects: { cellular_repair: 95, targeted_therapy: 90, minimal_side_effects: 85 },
        unlocks: ['medical_nanobots']
    },
    
    ai_diagnosis: {
        id: 'ai_diagnosis', name: 'AI Diagnosis Systems', category: 'healthcare', tier: 11,
        description: 'Artificial intelligence for medical diagnosis and treatment planning',
        requirements: { tech_level: 11, prerequisites: ['crispr_editing'] },
        time: 384, cost: 1900000,
        effects: { diagnostic_accuracy: 99, early_detection: 95, treatment_optimization: 85 },
        unlocks: ['consciousness_medicine']
    },

    // Tier 12 - Far Future (2050+) - Post-Human Medicine
    biological_immortality: {
        id: 'biological_immortality', name: 'Biological Immortality', category: 'healthcare', tier: 12,
        description: 'Complete elimination of aging and natural death',
        requirements: { tech_level: 12, prerequisites: ['organ_regeneration'] },
        time: 400, cost: 2500000,
        effects: { lifespan_extension: 1000, aging_prevention: 100, population_stability: 95 },
        unlocks: []
    },
    
    medical_nanobots: {
        id: 'medical_nanobots', name: 'Medical Nanobots', category: 'healthcare', tier: 12,
        description: 'Autonomous microscopic robots maintaining perfect health',
        requirements: { tech_level: 12, prerequisites: ['nanomedicine'] },
        time: 420, cost: 2800000,
        effects: { continuous_health_monitoring: 100, instant_disease_cure: 100, cellular_optimization: 95 },
        unlocks: []
    },
    
    consciousness_medicine: {
        id: 'consciousness_medicine', name: 'Consciousness Medicine', category: 'healthcare', tier: 12,
        description: 'Direct medical intervention at the level of consciousness',
        requirements: { tech_level: 12, prerequisites: ['ai_diagnosis'] },
        time: 450, cost: 3000000,
        effects: { mental_perfection: 100, consciousness_enhancement: 95, transcendent_health: 90 },
        unlocks: []
    }
};

// Export the research data
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthcareResearch;
} else if (typeof window !== 'undefined') {
    window.HealthcareResearch = HealthcareResearch;
}