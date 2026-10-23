/**
 * Production Research Branch - Manufacturing, agriculture, and industrial development
 * Progression: Stone Age → Bronze Age → Iron Age → Medieval → Industrial → Electric → Atomic → Information → Automation → Future
 */

const ProductionResearch = {
    // Tier 1 - Stone Age Production (10000-3000 BCE)
    stone_tools: {
        id: 'stone_tools', name: 'Stone Tool Crafting', category: 'production', tier: 1,
        description: 'Creation of basic tools from stone and bone',
        requirements: { tech_level: 1 },
        time: 24, cost: 15000,
        effects: { basic_production: 8, tool_efficiency: 10, resource_gathering: 12 },
        unlocks: ['bronze_working', 'woodworking']
    },
    
    agriculture_basics: {
        id: 'agriculture_basics', name: 'Basic Agriculture', category: 'production', tier: 1,
        description: 'Cultivation of crops and domestication of animals',
        requirements: { tech_level: 1 },
        time: 36, cost: 20000,
        effects: { food_production: 25, population_support: 15, settlement_stability: 10 },
        unlocks: ['irrigation', 'animal_husbandry']
    },
    
    pottery: {
        id: 'pottery', name: 'Pottery Making', category: 'production', tier: 1,
        description: 'Creation of ceramic vessels for storage and cooking',
        requirements: { tech_level: 1 },
        time: 30, cost: 18000,
        effects: { food_storage: 20, trade_goods: 10, cultural_development: 8 },
        unlocks: ['glassmaking']
    },
    
    // Tier 2 - Bronze Age Production (3000-1200 BCE)
    bronze_working: {
        id: 'bronze_working', name: 'Bronze Working', category: 'production', tier: 2,
        description: 'Alloying copper and tin to create bronze tools and weapons',
        requirements: { tech_level: 2, prerequisites: ['stone_tools'] },
        time: 48, cost: 35000,
        effects: { tool_quality: 25, weapon_effectiveness: 20, trade_value: 15 },
        unlocks: ['iron_working']
    },
    
    irrigation: {
        id: 'irrigation', name: 'Irrigation Systems', category: 'production', tier: 2,
        description: 'Controlled water distribution for agricultural enhancement',
        requirements: { tech_level: 2, prerequisites: ['agriculture_basics'] },
        time: 60, cost: 40000,
        effects: { crop_yield: 35, agricultural_reliability: 25, land_utilization: 20 },
        unlocks: ['advanced_agriculture']
    },
    
    woodworking: {
        id: 'woodworking', name: 'Advanced Woodworking', category: 'production', tier: 2,
        description: 'Sophisticated techniques for shaping and joining wood',
        requirements: { tech_level: 2, prerequisites: ['stone_tools'] },
        time: 42, cost: 32000,
        effects: { construction_quality: 20, boat_building: 15, furniture_production: 18 },
        unlocks: ['shipbuilding']
    },
    
    animal_husbandry: {
        id: 'animal_husbandry', name: 'Animal Husbandry', category: 'production', tier: 2,
        description: 'Selective breeding and management of livestock',
        requirements: { tech_level: 2, prerequisites: ['agriculture_basics'] },
        time: 54, cost: 38000,
        effects: { livestock_productivity: 30, protein_production: 25, draft_animal_power: 20 },
        unlocks: []
    },

    // Tier 3 - Iron Age Production (1200-500 BCE)
    iron_working: {
        id: 'iron_working', name: 'Iron Working', category: 'production', tier: 3,
        description: 'Smelting and forging of iron tools and weapons',
        requirements: { tech_level: 3, prerequisites: ['bronze_working'] },
        time: 72, cost: 60000,
        effects: { tool_durability: 40, agricultural_efficiency: 30, military_equipment: 35 },
        unlocks: ['steel_production']
    },
    
    advanced_agriculture: {
        id: 'advanced_agriculture', name: 'Advanced Agriculture', category: 'production', tier: 3,
        description: 'Crop rotation, fertilization, and improved farming techniques',
        requirements: { tech_level: 3, prerequisites: ['irrigation'] },
        time: 84, cost: 70000,
        effects: { soil_fertility: 45, crop_diversity: 35, food_security: 30 },
        unlocks: []
    },
    
    shipbuilding: {
        id: 'shipbuilding', name: 'Shipbuilding', category: 'production', tier: 3,
        description: 'Construction of seaworthy vessels for trade and exploration',
        requirements: { tech_level: 3, prerequisites: ['woodworking'] },
        time: 96, cost: 80000,
        effects: { maritime_trade: 50, exploration_capacity: 40, fishing_efficiency: 25 },
        unlocks: []
    },

    // Tier 4 - Classical Production (500 BCE - 500 CE) - Early Modern Era
    steel_production: {
        id: 'steel_production', name: 'Steel Production', category: 'production', tier: 4,
        description: 'Advanced metallurgy producing superior steel alloys',
        requirements: { tech_level: 4, prerequisites: ['iron_working'] },
        time: 108, cost: 120000,
        effects: { superior_tools: 60, weapon_quality: 50, construction_strength: 40 },
        unlocks: ['precision_engineering']
    },
    
    water_mills: {
        id: 'water_mills', name: 'Water Mills', category: 'production', tier: 4,
        description: 'Harnessing water power for grinding grain and other tasks',
        requirements: { tech_level: 4, prerequisites: ['advanced_agriculture'] },
        time: 120, cost: 140000,
        effects: { mechanical_power: 45, grain_processing: 50, labor_efficiency: 35 },
        unlocks: ['wind_mills']
    },
    
    glassmaking: {
        id: 'glassmaking', name: 'Glassmaking', category: 'production', tier: 4,
        description: 'Production of glass for windows, vessels, and optics',
        requirements: { tech_level: 4, prerequisites: ['pottery'] },
        time: 132, cost: 130000,
        effects: { optical_instruments: 30, building_quality: 25, luxury_goods: 35 },
        unlocks: []
    },

    // Tier 5 - Medieval Production (500-1000 CE) - Modern Era Begins
    wind_mills: {
        id: 'wind_mills', name: 'Wind Mills', category: 'production', tier: 5,
        description: 'Wind-powered machinery for grinding and manufacturing',
        requirements: { tech_level: 5, prerequisites: ['water_mills'] },
        time: 144, cost: 180000,
        effects: { wind_power: 55, grain_production: 45, manufacturing_capacity: 40 },
        unlocks: ['steam_power']
    },
    
    precision_engineering: {
        id: 'precision_engineering', name: 'Precision Engineering', category: 'production', tier: 5,
        description: 'Accurate measurement and manufacturing techniques',
        requirements: { tech_level: 5, prerequisites: ['steel_production'] },
        time: 156, cost: 200000,
        effects: { manufacturing_precision: 50, quality_control: 40, standardization: 35 },
        unlocks: ['interchangeable_parts']
    },
    
    textile_production: {
        id: 'textile_production', name: 'Advanced Textiles', category: 'production', tier: 5,
        description: 'Spinning wheels, looms, and improved cloth production',
        requirements: { tech_level: 5, prerequisites: ['water_mills'] },
        time: 168, cost: 220000,
        effects: { textile_quality: 60, clothing_production: 45, trade_goods: 40 },
        unlocks: []
    },

    // Tier 6 - Renaissance Production (1000-1500 CE) - Full Modern Era
    steam_power: {
        id: 'steam_power', name: 'Steam Power', category: 'production', tier: 6,
        description: 'Steam engines for mechanical power and transportation',
        requirements: { tech_level: 6, prerequisites: ['wind_mills'] },
        time: 180, cost: 300000,
        effects: { industrial_power: 80, transportation_revolution: 60, manufacturing_scale: 70 },
        unlocks: ['factory_systems']
    },
    
    interchangeable_parts: {
        id: 'interchangeable_parts', name: 'Interchangeable Parts', category: 'production', tier: 6,
        description: 'Standardized components for mass production',
        requirements: { tech_level: 6, prerequisites: ['precision_engineering'] },
        time: 192, cost: 320000,
        effects: { mass_production: 75, manufacturing_efficiency: 65, repair_simplicity: 50 },
        unlocks: ['assembly_lines']
    },
    
    chemical_processes: {
        id: 'chemical_processes', name: 'Chemical Processes', category: 'production', tier: 6,
        description: 'Industrial chemistry for dyes, acids, and other compounds',
        requirements: { tech_level: 6, prerequisites: ['precision_engineering'] },
        time: 204, cost: 340000,
        effects: { chemical_production: 70, material_science: 55, industrial_chemistry: 60 },
        unlocks: ['synthetic_materials', 'petrochemicals']
    },

    // Tier 7 - Industrial Revolution (1500-1800) - Contemporary Era
    factory_systems: {
        id: 'factory_systems', name: 'Factory Systems', category: 'production', tier: 7,
        description: 'Centralized manufacturing with division of labor',
        requirements: { tech_level: 7, prerequisites: ['steam_power'] },
        time: 216, cost: 450000,
        effects: { industrial_output: 100, labor_efficiency: 80, production_scale: 90 },
        unlocks: ['mechanization']
    },
    
    assembly_lines: {
        id: 'assembly_lines', name: 'Assembly Line Production', category: 'production', tier: 7,
        description: 'Sequential manufacturing process for mass production',
        requirements: { tech_level: 7, prerequisites: ['interchangeable_parts'] },
        time: 228, cost: 500000,
        effects: { production_speed: 120, cost_efficiency: 85, product_standardization: 75 },
        unlocks: []
    },
    
    synthetic_materials: {
        id: 'synthetic_materials', name: 'Synthetic Materials', category: 'production', tier: 7,
        description: 'Artificial materials with enhanced properties',
        requirements: { tech_level: 7, prerequisites: ['chemical_processes'] },
        time: 240, cost: 480000,
        effects: { material_innovation: 90, product_durability: 70, new_applications: 80 },
        unlocks: ['plastics']
    },

    // Tier 8 - Electric Age (1800-1900) - Advanced Industrial
    electricity: {
        id: 'electricity', name: 'Electrical Power', category: 'production', tier: 8,
        description: 'Generation and distribution of electrical energy',
        requirements: { tech_level: 8, prerequisites: ['factory_systems'] },
        time: 264, cost: 600000,
        effects: { electrical_power: 150, lighting_systems: 100, communication_advancement: 80 },
        unlocks: ['electric_motors']
    },
    
    mechanization: {
        id: 'mechanization', name: 'Advanced Mechanization', category: 'production', tier: 8,
        description: 'Complex machinery replacing manual labor',
        requirements: { tech_level: 8, prerequisites: ['assembly_lines'] },
        time: 252, cost: 580000,
        effects: { labor_replacement: 110, precision_manufacturing: 95, productivity_boost: 100 },
        unlocks: ['industrial_robots', 'cnc_machines']
    },
    
    plastics: {
        id: 'plastics', name: 'Plastic Production', category: 'production', tier: 8,
        description: 'Versatile synthetic polymers for countless applications',
        requirements: { tech_level: 8, prerequisites: ['synthetic_materials'] },
        time: 276, cost: 620000,
        effects: { material_versatility: 130, product_innovation: 90, cost_reduction: 75 },
        unlocks: []
    },

    // Tier 9 - 20th Century Production (1900-1980) - Modern Manufacturing
    electric_motors: {
        id: 'electric_motors', name: 'Electric Motors', category: 'production', tier: 9,
        description: 'Efficient electrical motors for industrial machinery',
        requirements: { tech_level: 9, prerequisites: ['electricity'] },
        time: 288, cost: 750000,
        effects: { motor_efficiency: 140, industrial_flexibility: 110, automation_foundation: 95 },
        unlocks: ['flexible_manufacturing']
    },
    
    industrial_robots: {
        id: 'industrial_robots', name: 'Industrial Robotics', category: 'production', tier: 9,
        description: 'Programmable machines for automated manufacturing',
        requirements: { tech_level: 9, prerequisites: ['mechanization'] },
        time: 300, cost: 850000,
        effects: { automation_level: 160, precision_assembly: 130, consistent_quality: 110 },
        unlocks: ['flexible_manufacturing']
    },
    
    petrochemicals: {
        id: 'petrochemicals', name: 'Petrochemical Industry', category: 'production', tier: 9,
        description: 'Chemical products derived from petroleum and natural gas',
        requirements: { tech_level: 9, prerequisites: ['plastics'] },
        time: 312, cost: 900000,
        effects: { chemical_diversity: 150, fuel_production: 120, synthetic_capability: 140 },
        unlocks: ['advanced_materials']
    },

    // Tier 10 - Information Age (1980-2020) - Digital Manufacturing
    cnc_machines: {
        id: 'cnc_machines', name: 'CNC Manufacturing', category: 'production', tier: 10,
        description: 'Computer-controlled precision manufacturing equipment',
        requirements: { tech_level: 10, prerequisites: ['industrial_robots'] },
        time: 324, cost: 1200000,
        effects: { precision_manufacturing: 180, customization_capability: 140, waste_reduction: 100 },
        unlocks: ['3d_printing']
    },
    
    flexible_manufacturing: {
        id: 'flexible_manufacturing', name: 'Flexible Manufacturing Systems', category: 'production', tier: 10,
        description: 'Adaptable production systems for varied products',
        requirements: { tech_level: 10, prerequisites: ['electric_motors', 'industrial_robots'] },
        time: 336, cost: 1400000,
        effects: { production_adaptability: 170, quick_changeover: 130, efficiency_optimization: 120 },
        unlocks: ['smart_factories']
    },
    
    advanced_materials: {
        id: 'advanced_materials', name: 'Advanced Materials Science', category: 'production', tier: 10,
        description: 'Engineered materials with specific desired properties',
        requirements: { tech_level: 10, prerequisites: ['petrochemicals'] },
        time: 348, cost: 1300000,
        effects: { material_properties: 190, performance_enhancement: 150, application_expansion: 130 },
        unlocks: ['nanomaterials']
    },

    // Tier 11 - Near Future (2020-2050) - AI and Nano Manufacturing
    '3d_printing': {
        id: '3d_printing', name: 'Additive Manufacturing', category: 'production', tier: 11,
        description: 'Layer-by-layer construction of complex objects',
        requirements: { tech_level: 11, prerequisites: ['cnc_machines'] },
        time: 360, cost: 1800000,
        effects: { rapid_prototyping: 200, complex_geometries: 160, on_demand_production: 140 },
        unlocks: ['molecular_assembly']
    },
    
    smart_factories: {
        id: 'smart_factories', name: 'Smart Factory Systems', category: 'production', tier: 11,
        description: 'AI-controlled manufacturing with real-time optimization',
        requirements: { tech_level: 11, prerequisites: ['flexible_manufacturing'] },
        time: 372, cost: 2000000,
        effects: { autonomous_production: 220, predictive_maintenance: 170, quality_assurance: 150 },
        unlocks: ['quantum_manufacturing']
    },
    
    nanomaterials: {
        id: 'nanomaterials', name: 'Nanomaterials Engineering', category: 'production', tier: 11,
        description: 'Materials engineered at the atomic and molecular level',
        requirements: { tech_level: 11, prerequisites: ['advanced_materials'] },
        time: 384, cost: 1900000,
        effects: { molecular_engineering: 210, exceptional_properties: 180, breakthrough_applications: 160 },
        unlocks: ['programmable_matter']
    },

    // Tier 12 - Far Future (2050+) - Molecular and Quantum Manufacturing
    molecular_assembly: {
        id: 'molecular_assembly', name: 'Molecular Assembly', category: 'production', tier: 12,
        description: 'Precise control of matter at the molecular level',
        requirements: { tech_level: 12, prerequisites: ['3d_printing'] },
        time: 400, cost: 2500000,
        effects: { molecular_precision: 250, perfect_products: 200, waste_elimination: 180 },
        unlocks: []
    },
    
    quantum_manufacturing: {
        id: 'quantum_manufacturing', name: 'Quantum Manufacturing', category: 'production', tier: 12,
        description: 'Manufacturing using quantum mechanical effects',
        requirements: { tech_level: 12, prerequisites: ['smart_factories'] },
        time: 420, cost: 2800000,
        effects: { quantum_precision: 300, impossible_materials: 250, reality_manipulation: 200 },
        unlocks: []
    },
    
    programmable_matter: {
        id: 'programmable_matter', name: 'Programmable Matter', category: 'production', tier: 12,
        description: 'Matter that can change its properties on command',
        requirements: { tech_level: 12, prerequisites: ['nanomaterials'] },
        time: 450, cost: 3000000,
        effects: { shape_shifting_materials: 280, adaptive_properties: 240, universal_manufacturing: 220 },
        unlocks: []
    }
};

// Export the research data
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionResearch;
} else if (typeof window !== 'undefined') {
    window.ProductionResearch = ProductionResearch;
}