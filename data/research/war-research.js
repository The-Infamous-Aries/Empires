/**
 * War Research Branch - Military technology, tactics, and warfare evolution
 * Progression: Tribal → Classical → Medieval → Gunpowder → Industrial → Modern → Nuclear → Information → Cyber → Future
 */

const WarResearch = {
    // Tier 1 - Tribal Warfare (10000-3000 BCE)
    primitive_weapons: {
        id: 'primitive_weapons', name: 'Primitive Weapons', category: 'war', tier: 1,
        description: 'Basic clubs, spears, and stone weapons for combat',
        requirements: { tech_level: 1 },
        time: 20, cost: 12000,
        effects: { attack_power: 5, weapon_durability: 8, hunting_efficiency: 10 },
        unlocks: ['archery', 'bronze_weapons']
    },
    
    tribal_tactics: {
        id: 'tribal_tactics', name: 'Tribal Tactics', category: 'war', tier: 1,
        description: 'Basic group combat formations and hunting strategies',
        requirements: { tech_level: 1 },
        time: 28, cost: 15000,
        effects: { group_coordination: 10, ambush_effectiveness: 12, defense_bonus: 8 },
        unlocks: ['formation_fighting']
    },
    
    basic_fortification: {
        id: 'basic_fortification', name: 'Basic Fortification', category: 'war', tier: 1,
        description: 'Simple defensive structures like palisades and earthworks',
        requirements: { tech_level: 1 },
        time: 32, cost: 18000,
        effects: { defensive_strength: 15, settlement_protection: 20, siege_resistance: 10 },
        unlocks: ['wall_construction']
    },
    
    // Tier 2 - Bronze Age Warfare (3000-1200 BCE)
    archery: {
        id: 'archery', name: 'Archery Techniques', category: 'war', tier: 2,
        description: 'Improved bow design and marksmanship training',
        requirements: { tech_level: 2, prerequisites: ['primitive_weapons'] },
        time: 40, cost: 25000,
        effects: { ranged_attack: 20, accuracy: 15, hunting_prowess: 18 },
        unlocks: ['composite_bow']
    },
    
    bronze_weapons: {
        id: 'bronze_weapons', name: 'Bronze Weaponry', category: 'war', tier: 2,
        description: 'Superior bronze swords, axes, and spearheads',
        requirements: { tech_level: 2, prerequisites: ['primitive_weapons'] },
        time: 48, cost: 30000,
        effects: { weapon_quality: 25, critical_damage: 18, durability: 22 },
        unlocks: ['iron_weapons']
    },
    
    formation_fighting: {
        id: 'formation_fighting', name: 'Formation Fighting', category: 'war', tier: 2,
        description: 'Organized military formations and coordinated attacks',
        requirements: { tech_level: 2, prerequisites: ['tribal_tactics'] },
        time: 44, cost: 28000,
        effects: { unit_coordination: 20, battlefield_control: 15, morale_bonus: 12 },
        unlocks: ['phalanx_formation']
    },
    
    wall_construction: {
        id: 'wall_construction', name: 'Wall Construction', category: 'war', tier: 2,
        description: 'Stone and brick defensive walls for cities',
        requirements: { tech_level: 2, prerequisites: ['basic_fortification'] },
        time: 52, cost: 35000,
        effects: { city_defense: 30, siege_endurance: 25, population_protection: 20 },
        unlocks: ['castle_design', 'siege_engineering']
    },

    // Tier 3 - Iron Age Warfare (1200-500 BCE)
    iron_weapons: {
        id: 'iron_weapons', name: 'Iron Weaponry', category: 'war', tier: 3,
        description: 'Superior iron swords, spears, and armor',
        requirements: { tech_level: 3, prerequisites: ['bronze_weapons'] },
        time: 60, cost: 50000,
        effects: { cutting_power: 35, armor_penetration: 30, weapon_reliability: 28 },
        unlocks: ['steel_weapons']
    },
    
    phalanx_formation: {
        id: 'phalanx_formation', name: 'Phalanx Formation', category: 'war', tier: 3,
        description: 'Dense formation of spear-wielding infantry',
        requirements: { tech_level: 3, prerequisites: ['formation_fighting'] },
        time: 72, cost: 60000,
        effects: { infantry_effectiveness: 40, frontal_defense: 45, disciplined_combat: 35 },
        unlocks: ['legion_tactics']
    },
    
    composite_bow: {
        id: 'composite_bow', name: 'Composite Bow', category: 'war', tier: 3,
        description: 'Advanced bow construction with multiple materials',
        requirements: { tech_level: 3, prerequisites: ['archery'] },
        time: 56, cost: 45000,
        effects: { bow_power: 45, range_extension: 35, mounted_archery: 30 },
        unlocks: ['crossbow']
    },
    
    siege_engineering: {
        id: 'siege_engineering', name: 'Siege Engineering', category: 'war', tier: 3,
        description: 'Catapults, battering rams, and siege towers',
        requirements: { tech_level: 3, prerequisites: ['wall_construction'] },
        time: 84, cost: 70000,
        effects: { siege_attack: 50, fortification_breaching: 40, city_conquest: 35 },
        unlocks: ['trebuchet']
    },

    // Tier 4 - Classical Warfare (500 BCE - 500 CE) - Early Modern Era
    steel_weapons: {
        id: 'steel_weapons', name: 'Steel Weaponry', category: 'war', tier: 4,
        description: 'High-quality steel weapons with superior properties',
        requirements: { tech_level: 4, prerequisites: ['iron_weapons'] },
        time: 96, cost: 90000,
        effects: { blade_sharpness: 50, weapon_balance: 40, elite_equipment: 45 },
        unlocks: ['plate_armor']
    },
    
    legion_tactics: {
        id: 'legion_tactics', name: 'Legion Tactics', category: 'war', tier: 4,
        description: 'Flexible Roman-style military organization and tactics',
        requirements: { tech_level: 4, prerequisites: ['phalanx_formation'] },
        time: 108, cost: 100000,
        effects: { tactical_flexibility: 55, unit_versatility: 45, battlefield_adaptation: 40 },
        unlocks: ['professional_army', 'military_engineering']
    },
    
    crossbow: {
        id: 'crossbow', name: 'Crossbow Technology', category: 'war', tier: 4,
        description: 'Mechanical bow with superior power and accuracy',
        requirements: { tech_level: 4, prerequisites: ['composite_bow'] },
        time: 84, cost: 80000,
        effects: { penetrating_power: 60, ease_of_use: 35, siege_support: 40 },
        unlocks: ['gunpowder_weapons']
    },
    
    trebuchet: {
        id: 'trebuchet', name: 'Trebuchet', category: 'war', tier: 4,
        description: 'Powerful counterweight siege engine',
        requirements: { tech_level: 4, prerequisites: ['siege_engineering'] },
        time: 120, cost: 120000,
        effects: { siege_power: 70, wall_destruction: 60, psychological_warfare: 45 },
        unlocks: ['artillery', 'gunpowder_weapons']
    },

    // Tier 5 - Medieval Warfare (500-1000 CE) - Modern Era Begins
    plate_armor: {
        id: 'plate_armor', name: 'Plate Armor', category: 'war', tier: 5,
        description: 'Full-body steel armor for maximum protection',
        requirements: { tech_level: 5, prerequisites: ['steel_weapons'] },
        time: 132, cost: 150000,
        effects: { personal_protection: 70, knight_effectiveness: 55, armor_craftsmanship: 50 },
        unlocks: ['heavy_cavalry']
    },
    
    professional_army: {
        id: 'professional_army', name: 'Professional Army', category: 'war', tier: 5,
        description: 'Full-time trained soldiers with standardized equipment',
        requirements: { tech_level: 5, prerequisites: ['legion_tactics'] },
        time: 144, cost: 180000,
        effects: { military_discipline: 65, combat_readiness: 55, strategic_capability: 60 },
        unlocks: []
    },
    
    castle_design: {
        id: 'castle_design', name: 'Castle Architecture', category: 'war', tier: 5,
        description: 'Advanced fortified structures with defensive innovations',
        requirements: { tech_level: 5, prerequisites: ['trebuchet'] },
        time: 156, cost: 200000,
        effects: { fortress_strength: 80, territorial_control: 60, defensive_advantage: 70 },
        unlocks: ['star_fort']
    },

    // Tier 6 - Gunpowder Era (1000-1500 CE) - Full Modern Era
    gunpowder_weapons: {
        id: 'gunpowder_weapons', name: 'Gunpowder Weapons', category: 'war', tier: 6,
        description: 'Early firearms and cannons using gunpowder',
        requirements: { tech_level: 6, prerequisites: ['trebuchet'] },
        time: 168, cost: 250000,
        effects: { firepower_revolution: 90, armor_obsolescence: 70, siege_breakthrough: 80 },
        unlocks: ['artillery', 'small_arms']
    },
    
    heavy_cavalry: {
        id: 'heavy_cavalry', name: 'Heavy Cavalry', category: 'war', tier: 6,
        description: 'Heavily armored mounted knights with superior equipment',
        requirements: { tech_level: 6, prerequisites: ['plate_armor'] },
        time: 180, cost: 280000,
        effects: { cavalry_charge: 85, battlefield_mobility: 65, shock_tactics: 75 },
        unlocks: []
    },
    
    military_engineering: {
        id: 'military_engineering', name: 'Military Engineering', category: 'war', tier: 6,
        description: 'Specialized engineering for military construction and siege work',
        requirements: { tech_level: 6, prerequisites: ['professional_army'] },
        time: 192, cost: 300000,
        effects: { siege_efficiency: 80, battlefield_preparation: 65, logistics_improvement: 70 },
        unlocks: ['military_logistics']
    },

    // Tier 7 - Renaissance Warfare (1500-1700) - Contemporary Era
    artillery: {
        id: 'artillery', name: 'Artillery Systems', category: 'war', tier: 7,
        description: 'Advanced cannons and gunpowder artillery',
        requirements: { tech_level: 7, prerequisites: ['gunpowder_weapons'] },
        time: 204, cost: 400000,
        effects: { artillery_power: 110, siege_dominance: 95, battlefield_control: 85 },
        unlocks: ['field_artillery']
    },
    
    small_arms: {
        id: 'small_arms', name: 'Small Arms', category: 'war', tier: 7,
        description: 'Improved muskets and personal firearms',
        requirements: { tech_level: 7, prerequisites: ['gunpowder_weapons'] },
        time: 216, cost: 380000,
        effects: { infantry_firepower: 100, volley_fire: 80, individual_lethality: 90 },
        unlocks: ['rifle_technology']
    },
    
    star_fort: {
        id: 'star_fort', name: 'Star Fort Design', category: 'war', tier: 7,
        description: 'Geometric fortifications optimized against artillery',
        requirements: { tech_level: 7, prerequisites: ['castle_design'] },
        time: 228, cost: 420000,
        effects: { artillery_resistance: 120, geometric_defense: 95, city_protection: 100 },
        unlocks: []
    },

    // Tier 8 - Industrial Warfare (1700-1850) - Advanced Industrial
    rifle_technology: {
        id: 'rifle_technology', name: 'Rifle Technology', category: 'war', tier: 8,
        description: 'Rifled barrels for improved accuracy and range',
        requirements: { tech_level: 8, prerequisites: ['small_arms'] },
        time: 240, cost: 500000,
        effects: { marksmanship: 130, effective_range: 110, precision_combat: 120 },
        unlocks: ['breech_loading']
    },
    
    field_artillery: {
        id: 'field_artillery', name: 'Field Artillery', category: 'war', tier: 8,
        description: 'Mobile cannons for battlefield support',
        requirements: { tech_level: 8, prerequisites: ['artillery'] },
        time: 252, cost: 550000,
        effects: { mobile_firepower: 140, battlefield_support: 120, tactical_bombardment: 130 },
        unlocks: ['explosive_shells']
    },
    
    military_logistics: {
        id: 'military_logistics', name: 'Military Logistics', category: 'war', tier: 8,
        description: 'Organized supply chains and troop movement systems',
        requirements: { tech_level: 8, prerequisites: ['military_engineering'] },
        time: 264, cost: 480000,
        effects: { supply_efficiency: 150, campaign_endurance: 120, force_projection: 110 },
        unlocks: ['railroad_warfare']
    },

    // Tier 9 - Modern Warfare (1850-1945) - Industrial Warfare Peak
    breech_loading: {
        id: 'breech_loading', name: 'Breech-Loading Weapons', category: 'war', tier: 9,
        description: 'Faster-loading weapons with improved mechanisms',
        requirements: { tech_level: 9, prerequisites: ['rifle_technology'] },
        time: 276, cost: 650000,
        effects: { rate_of_fire: 160, reload_speed: 140, combat_efficiency: 150 },
        unlocks: ['machine_guns']
    },
    
    explosive_shells: {
        id: 'explosive_shells', name: 'Explosive Artillery Shells', category: 'war', tier: 9,
        description: 'Artillery ammunition with explosive warheads',
        requirements: { tech_level: 9, prerequisites: ['field_artillery'] },
        time: 288, cost: 700000,
        effects: { explosive_power: 180, area_damage: 150, fortification_destruction: 170 },
        unlocks: ['chemical_weapons']
    },
    
    railroad_warfare: {
        id: 'railroad_warfare', name: 'Railroad Warfare', category: 'war', tier: 9,
        description: 'Use of railroads for rapid troop and supply movement',
        requirements: { tech_level: 9, prerequisites: ['military_logistics'] },
        time: 300, cost: 750000,
        effects: { strategic_mobility: 170, mass_deployment: 140, supply_capacity: 160 },
        unlocks: ['mechanized_warfare']
    },

    // Tier 10 - World War Era (1900-1950) - Peak Conventional Warfare
    machine_guns: {
        id: 'machine_guns', name: 'Machine Gun Technology', category: 'war', tier: 10,
        description: 'Automatic weapons with devastating firepower',
        requirements: { tech_level: 10, prerequisites: ['breech_loading'] },
        time: 312, cost: 900000,
        effects: { automatic_firepower: 200, defensive_capability: 180, suppression_fire: 190 },
        unlocks: []
    },
    
    chemical_weapons: {
        id: 'chemical_weapons', name: 'Chemical Weapons', category: 'war', tier: 10,
        description: 'Toxic gases and chemical agents for warfare',
        requirements: { tech_level: 10, prerequisites: ['explosive_shells'] },
        time: 324, cost: 950000,
        effects: { chemical_warfare: 220, area_denial: 170, psychological_impact: 160 },
        unlocks: ['nuclear_weapons']
    },
    
    mechanized_warfare: {
        id: 'mechanized_warfare', name: 'Mechanized Warfare', category: 'war', tier: 10,
        description: 'Tanks, armored vehicles, and motorized infantry',
        requirements: { tech_level: 10, prerequisites: ['railroad_warfare'] },
        time: 336, cost: 1000000,
        effects: { armor_superiority: 240, mobility_warfare: 200, combined_operations: 180 },
        unlocks: ['jet_aircraft']
    },

    // Tier 11 - Nuclear Age (1945-1990) - WMD Era
    nuclear_weapons: {
        id: 'nuclear_weapons', name: 'Nuclear Weapons', category: 'war', tier: 11,
        description: 'Atomic and thermonuclear weapons of mass destruction',
        requirements: { tech_level: 11, prerequisites: ['chemical_weapons'] },
        time: 360, cost: 1500000,
        effects: { nuclear_deterrent: 500, strategic_dominance: 300, mutual_destruction: 400 },
        unlocks: []
    },
    
    jet_aircraft: {
        id: 'jet_aircraft', name: 'Jet Aircraft', category: 'war', tier: 11,
        description: 'High-speed jet-powered military aircraft',
        requirements: { tech_level: 11, prerequisites: ['mechanized_warfare'] },
        time: 348, cost: 1300000,
        effects: { air_superiority: 280, strategic_bombing: 240, air_mobility: 220 },
        unlocks: ['stealth_technology']
    },
    
    radar_systems: {
        id: 'radar_systems', name: 'Radar Systems', category: 'war', tier: 11,
        description: 'Electronic detection and tracking systems',
        requirements: { tech_level: 11, prerequisites: ['mechanized_warfare'] },
        time: 372, cost: 1400000,
        effects: { detection_capability: 260, air_defense: 230, electronic_warfare: 200 },
        unlocks: ['precision_weapons', 'cyber_warfare']
    },

    // Tier 12 - Information Age (1990+) - Modern High-Tech Warfare
    stealth_technology: {
        id: 'stealth_technology', name: 'Stealth Technology', category: 'war', tier: 12,
        description: 'Radar-evading aircraft and vehicles',
        requirements: { tech_level: 12, prerequisites: ['jet_aircraft'] },
        time: 400, cost: 2000000,
        effects: { invisibility_advantage: 350, first_strike_capability: 300, detection_avoidance: 280 },
        unlocks: []
    },
    
    precision_weapons: {
        id: 'precision_weapons', name: 'Precision Guided Weapons', category: 'war', tier: 12,
        description: 'Smart weapons with pinpoint accuracy',
        requirements: { tech_level: 12, prerequisites: ['radar_systems'] },
        time: 420, cost: 2200000,
        effects: { surgical_strikes: 400, collateral_minimization: 320, target_elimination: 380 },
        unlocks: []
    },
    
    cyber_warfare: {
        id: 'cyber_warfare', name: 'Cyber Warfare', category: 'war', tier: 12,
        description: 'Digital attacks on enemy information systems',
        requirements: { tech_level: 12, prerequisites: ['radar_systems'] },
        time: 450, cost: 2500000,
        effects: { information_dominance: 450, infrastructure_disruption: 350, digital_supremacy: 400 },
        unlocks: []
    }
};

// Export the research data
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WarResearch;
} else if (typeof window !== 'undefined') {
    window.WarResearch = WarResearch;
}