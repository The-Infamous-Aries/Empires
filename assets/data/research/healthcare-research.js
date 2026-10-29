/**
 * Healthcare Research Branch - Medical knowledge, public health, and disease management
 * Effects map to game mechanics: disease spawn rate reduction, disease level, pollution,
 * cure cost reduction, population growth modifiers, and player skills (Energy & Intuition).
 * No resource-related effects. No time field (goal-based). No research speed effects.
 * Tiers 1-5: max 1 boost per research. Tiers 6-12: max 2 boosts per research.
 */

const HealthcareResearch = {
    // ══════════════════════════════════════════════════════════════════════════════════
    // TIER 1 - ANCIENT MEDICINE (Tech Level 1) - $10M to $20M
    // Max 1 boost per research
    // ══════════════════════════════════════════════════════════════════════════════════

    herbal_remedies: {
        id: 'herbal_remedies', name: 'Herbal Remedies', category: 'healthcare', tier: 1,
        description: 'Basic knowledge of medicinal plants and natural treatments',
        requirements: { tech_level: 1 },
        cost: 10000000,
        effects: { disease_spawn_rate_reduction: 2 },
        unlocks: ['traditional_medicine']
    },

    basic_anatomy: {
        id: 'basic_anatomy', name: 'Basic Anatomy', category: 'healthcare', tier: 1,
        description: 'Fundamental understanding of human body structure',
        requirements: { tech_level: 1 },
        cost: 12000000,
        effects: { disease_level_reduction: 2 },
        unlocks: ['wound_treatment', 'nutrition_science']
    },

    sanitation_basics: {
        id: 'sanitation_basics', name: 'Basic Sanitation', category: 'healthcare', tier: 1,
        description: 'Understanding of cleanliness and waste management',
        requirements: { tech_level: 1 },
        cost: 15000000,
        effects: { pollution_reduction: 5 },
        unlocks: ['water_purification']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 2 - CLASSICAL MEDICINE (Tech Level 2) - $20M to $50M
    // Max 1 boost per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    traditional_medicine: {
        id: 'traditional_medicine', name: 'Traditional Medicine', category: 'healthcare', tier: 2,
        description: 'Systematic approach to natural healing and diagnosis',
        requirements: { tech_level: 2, prerequisites: ['herbal_remedies'] },
        cost: 20000000,
        effects: { disease_level_reduction: 5 },
        unlocks: ['medicinal_compounds']
    },

    wound_treatment: {
        id: 'wound_treatment', name: 'Wound Treatment', category: 'healthcare', tier: 2,
        description: 'Advanced techniques for treating injuries and trauma',
        requirements: { tech_level: 2, prerequisites: ['basic_anatomy'] },
        cost: 25000000,
        effects: { disease_level_reduction: 8 },
        unlocks: ['basic_surgery']
    },

    water_purification: {
        id: 'water_purification', name: 'Water Purification', category: 'healthcare', tier: 2,
        description: 'Methods for cleaning and sanitizing water supplies',
        requirements: { tech_level: 2, prerequisites: ['sanitation_basics'] },
        cost: 30000000,
        effects: { disease_spawn_rate_reduction: 10 },
        unlocks: ['aqueduct_systems']
    },

    nutrition_science: {
        id: 'nutrition_science', name: 'Nutrition Science', category: 'healthcare', tier: 2,
        description: 'Understanding of dietary needs and food safety',
        requirements: { tech_level: 2, prerequisites: ['basic_anatomy'] },
        cost: 35000000,
        effects: { disease_level_reduction: 5 },
        unlocks: []
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 3 - MEDIEVAL MEDICINE (Tech Level 3) - $50M to $100M
    // Max 1 boost per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    basic_surgery: {
        id: 'basic_surgery', name: 'Surgical Techniques', category: 'healthcare', tier: 3,
        description: 'Fundamental surgical procedures and wound repair',
        requirements: { tech_level: 3, prerequisites: ['wound_treatment'] },
        cost: 50000000,
        effects: { cure_cost_reduction: 12 },
        unlocks: ['advanced_surgery', 'anatomical_studies']
    },

    medicinal_compounds: {
        id: 'medicinal_compounds', name: 'Medicinal Compounds', category: 'healthcare', tier: 3,
        description: 'Creation of complex medicines from multiple ingredients',
        requirements: { tech_level: 3, prerequisites: ['traditional_medicine'] },
        cost: 60000000,
        effects: { disease_spawn_rate_reduction: 8 },
        unlocks: ['pharmacy_science']
    },

    aqueduct_systems: {
        id: 'aqueduct_systems', name: 'Aqueduct Systems', category: 'healthcare', tier: 3,
        description: 'Large-scale water distribution infrastructure',
        requirements: { tech_level: 3, prerequisites: ['water_purification'] },
        cost: 80000000,
        effects: { disease_spawn_rate_reduction: 15 },
        unlocks: []
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 4 - RENAISSANCE MEDICINE (Tech Level 4) - $100M to $500M
    // Max 1 boost per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    advanced_surgery: {
        id: 'advanced_surgery', name: 'Advanced Surgery', category: 'healthcare', tier: 4,
        description: 'Complex surgical procedures with improved techniques',
        requirements: { tech_level: 4, prerequisites: ['basic_surgery'] },
        cost: 100000000,
        effects: { cure_cost_reduction: 20 },
        unlocks: ['anesthesia']
    },

    pharmacy_science: {
        id: 'pharmacy_science', name: 'Pharmaceutical Science', category: 'healthcare', tier: 4,
        description: 'Scientific approach to drug preparation and dosage',
        requirements: { tech_level: 4, prerequisites: ['medicinal_compounds'] },
        cost: 150000000,
        effects: { disease_spawn_rate_reduction: 10 },
        unlocks: ['chemical_medicine']
    },

    anatomical_studies: {
        id: 'anatomical_studies', name: 'Anatomical Studies', category: 'healthcare', tier: 4,
        description: 'Detailed study of human anatomy through dissection',
        requirements: { tech_level: 4, prerequisites: ['basic_surgery'] },
        cost: 250000000,
        effects: { disease_level_reduction: 20 },
        unlocks: ['germ_theory']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 5 - INDUSTRIAL MEDICINE (Tech Level 5) - $500M to $1B
    // Max 1 boost per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    anesthesia: {
        id: 'anesthesia', name: 'Anesthesia', category: 'healthcare', tier: 5,
        description: 'Pain relief during surgical procedures',
        requirements: { tech_level: 5, prerequisites: ['advanced_surgery'] },
        cost: 500000000,
        effects: { cure_cost_reduction: 25 },
        unlocks: ['modern_surgery']
    },

    chemical_medicine: {
        id: 'chemical_medicine', name: 'Chemical Medicine', category: 'healthcare', tier: 5,
        description: 'Chemically synthesized drugs and treatments',
        requirements: { tech_level: 5, prerequisites: ['pharmacy_science'] },
        cost: 700000000,
        effects: { disease_spawn_rate_reduction: 12 },
        unlocks: ['antibiotics', 'vaccines']
    },

    germ_theory: {
        id: 'germ_theory', name: 'Germ Theory', category: 'healthcare', tier: 5,
        description: 'Understanding that microorganisms cause disease',
        requirements: { tech_level: 5, prerequisites: ['anatomical_studies'] },
        cost: 1000000000,
        effects: { disease_spawn_rate_reduction: 20 },
        unlocks: []
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 6 - SCIENTIFIC MEDICINE (Tech Level 6) - $1B to $2B
    // Max 2 boosts per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    antibiotics: {
        id: 'antibiotics', name: 'Antibiotic Medicine', category: 'healthcare', tier: 6,
        description: 'Drugs that kill or inhibit bacterial growth',
        requirements: { tech_level: 6, prerequisites: ['chemical_medicine'] },
        cost: 1000000000,
        effects: { disease_spawn_rate_reduction: 15, disease_level_reduction: 30 },
        unlocks: []
    },

    vaccines: {
        id: 'vaccines', name: 'Vaccination', category: 'healthcare', tier: 6,
        description: 'Immunization against infectious diseases',
        requirements: { tech_level: 6, prerequisites: ['chemical_medicine'] },
        cost: 1300000000,
        effects: { disease_spawn_rate_reduction: 25, population_growth_bonus: 5 },
        unlocks: ['immunology']
    },

    modern_surgery: {
        id: 'modern_surgery', name: 'Modern Surgery', category: 'healthcare', tier: 6,
        description: 'Sterile, precise surgical techniques with anesthesia',
        requirements: { tech_level: 6, prerequisites: ['anesthesia', 'germ_theory'] },
        cost: 1500000000,
        effects: { cure_cost_reduction: 40, energy_skill_bonus: 6 },
        unlocks: ['organ_transplants']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 7 - 20TH CENTURY MEDICINE (Tech Level 7) - $2B to $5B
    // Max 2 boosts per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    immunology: {
        id: 'immunology', name: 'Immunology', category: 'healthcare', tier: 7,
        description: 'Scientific study of the immune system',
        requirements: { tech_level: 7, prerequisites: ['vaccines'] },
        cost: 2000000000,
        effects: { disease_spawn_rate_reduction: 18, disease_level_reduction: 30 },
        unlocks: []
    },

    radiology: {
        id: 'radiology', name: 'Medical Radiology', category: 'healthcare', tier: 7,
        description: 'X-rays and radiation for diagnosis and treatment',
        requirements: { tech_level: 7, prerequisites: ['modern_surgery'] },
        cost: 2500000000,
        effects: { disease_level_reduction: 20, cure_cost_reduction: 30 },
        unlocks: ['ct_scanning']
    },

    blood_transfusion: {
        id: 'blood_transfusion', name: 'Blood Transfusion', category: 'healthcare', tier: 7,
        description: 'Safe transfer of blood between individuals',
        requirements: { tech_level: 7, prerequisites: ['modern_surgery'] },
        cost: 3500000000,
        effects: { disease_level_reduction: 35, population_growth_bonus: 5 },
        unlocks: []
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 8 - MID 20TH CENTURY (Tech Level 8) - $5B to $10B
    // Max 2 boosts per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    organ_transplants: {
        id: 'organ_transplants', name: 'Organ Transplantation', category: 'healthcare', tier: 8,
        description: 'Surgical replacement of damaged organs',
        requirements: { tech_level: 8, prerequisites: ['immunology', 'modern_surgery'] },
        cost: 5000000000,
        effects: { cure_cost_reduction: 50, population_growth_bonus: 6 },
        unlocks: ['tissue_engineering']
    },

    ct_scanning: {
        id: 'ct_scanning', name: 'CT Scanning', category: 'healthcare', tier: 8,
        description: 'Detailed cross-sectional imaging of the body',
        requirements: { tech_level: 8, prerequisites: ['radiology'] },
        cost: 7000000000,
        effects: { disease_level_reduction: 30, intuition_skill_bonus: 8 },
        unlocks: ['mri_imaging']
    },

    psychopharmacology: {
        id: 'psychopharmacology', name: 'Psychopharmacology', category: 'healthcare', tier: 8,
        description: 'Drugs for treating mental health conditions',
        requirements: { tech_level: 8, prerequisites: ['antibiotics'] },
        cost: 9000000000,
        effects: { disease_spawn_rate_reduction: 10, energy_skill_bonus: 8 },
        unlocks: ['personalized_medicine']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 9 - LATE 20TH CENTURY (Tech Level 9) - $10B to $20B
    // Max 2 boosts per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    mri_imaging: {
        id: 'mri_imaging', name: 'MRI Imaging', category: 'healthcare', tier: 9,
        description: 'Magnetic resonance imaging for detailed soft tissue visualization',
        requirements: { tech_level: 9, prerequisites: ['ct_scanning'] },
        cost: 10000000000,
        effects: { disease_level_reduction: 45, intuition_skill_bonus: 9 },
        unlocks: []
    },

    tissue_engineering: {
        id: 'tissue_engineering', name: 'Tissue Engineering', category: 'healthcare', tier: 9,
        description: 'Growing replacement tissues and organs in laboratory',
        requirements: { tech_level: 9, prerequisites: ['organ_transplants'] },
        cost: 12000000000,
        effects: { cure_cost_reduction: 55, disease_level_reduction: 35 },
        unlocks: ['stem_cell_therapy']
    },

    gene_therapy: {
        id: 'gene_therapy', name: 'Gene Therapy', category: 'healthcare', tier: 9,
        description: 'Treatment of genetic disorders by modifying genes',
        requirements: { tech_level: 9, prerequisites: ['psychopharmacology'] },
        cost: 15000000000,
        effects: { disease_spawn_rate_reduction: 15, disease_level_reduction: 40 },
        unlocks: ['crispr_editing']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 10 - 21ST CENTURY (Tech Level 10) - $20B to $50B
    // Max 2 boosts per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    stem_cell_therapy: {
        id: 'stem_cell_therapy', name: 'Stem Cell Therapy', category: 'healthcare', tier: 10,
        description: 'Using stem cells to repair and replace damaged tissues',
        requirements: { tech_level: 10, prerequisites: ['tissue_engineering'] },
        cost: 20000000000,
        effects: { cure_cost_reduction: 60, disease_level_reduction: 50 },
        unlocks: ['organ_regeneration']
    },

    crispr_editing: {
        id: 'crispr_editing', name: 'CRISPR Gene Editing', category: 'healthcare', tier: 10,
        description: 'Precise editing of DNA sequences to treat disease',
        requirements: { tech_level: 10, prerequisites: ['gene_therapy'] },
        cost: 30000000000,
        effects: { disease_spawn_rate_reduction: 20, disease_level_reduction: 45 },
        unlocks: ['ai_diagnosis']
    },

    personalized_medicine: {
        id: 'personalized_medicine', name: 'Personalized Medicine', category: 'healthcare', tier: 10,
        description: 'Treatments tailored to individual genetic profiles',
        requirements: { tech_level: 10, prerequisites: ['mri_imaging', 'gene_therapy'] },
        cost: 50000000000,
        effects: { cure_cost_reduction: 70, disease_level_reduction: 40 },
        unlocks: ['nanomedicine']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 11 - NEAR FUTURE (Tech Level 11) - $50B to $100B
    // Max 2 boosts per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    organ_regeneration: {
        id: 'organ_regeneration', name: 'Organ Regeneration', category: 'healthcare', tier: 11,
        description: 'Complete regeneration of organs in vivo using stem cells',
        requirements: { tech_level: 11, prerequisites: ['stem_cell_therapy'] },
        cost: 50000000000,
        effects: { cure_cost_reduction: 80, disease_level_reduction: 60 },
        unlocks: ['biological_immortality']
    },

    nanomedicine: {
        id: 'nanomedicine', name: 'Nanomedicine', category: 'healthcare', tier: 11,
        description: 'Microscopic robots for targeted drug delivery and repair',
        requirements: { tech_level: 11, prerequisites: ['personalized_medicine'] },
        cost: 75000000000,
        effects: { disease_spawn_rate_reduction: 25, disease_level_reduction: 55 },
        unlocks: ['medical_nanobots']
    },

    ai_diagnosis: {
        id: 'ai_diagnosis', name: 'AI Diagnosis Systems', category: 'healthcare', tier: 11,
        description: 'Artificial intelligence for medical diagnosis and treatment planning',
        requirements: { tech_level: 11, prerequisites: ['crispr_editing'] },
        cost: 100000000000,
        effects: { cure_cost_reduction: 85, disease_level_reduction: 50 },
        unlocks: ['consciousness_medicine']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 12 - FAR FUTURE (Tech Level 12) - $100B to $10T
    // Max 2 boosts per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    biological_immortality: {
        id: 'biological_immortality', name: 'Biological Immortality', category: 'healthcare', tier: 12,
        description: 'Complete elimination of aging and natural death',
        requirements: { tech_level: 12, prerequisites: ['organ_regeneration'] },
        cost: 100000000000,
        effects: { disease_spawn_rate_reduction: 50, disease_level_reduction: 100 },
        unlocks: []
    },

    medical_nanobots: {
        id: 'medical_nanobots', name: 'Medical Nanobots', category: 'healthcare', tier: 12,
        description: 'Autonomous microscopic robots maintaining perfect health',
        requirements: { tech_level: 12, prerequisites: ['nanomedicine'] },
        cost: 500000000000,
        effects: { cure_cost_reduction: 100, disease_level_reduction: 100 },
        unlocks: []
    },

    consciousness_medicine: {
        id: 'consciousness_medicine', name: 'Consciousness Medicine', category: 'healthcare', tier: 12,
        description: 'Direct medical intervention at the level of consciousness',
        requirements: { tech_level: 12, prerequisites: ['ai_diagnosis'] },
        cost: 10000000000000,
        effects: { disease_spawn_rate_reduction: 40, disease_level_reduction: 90 },
        unlocks: []
    }
};

// Export the research data
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthcareResearch;
} else if (typeof window !== 'undefined') {
    window.HealthcareResearch = HealthcareResearch;
}
