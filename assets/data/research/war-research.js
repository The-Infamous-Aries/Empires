/**
 * War Research Branch - Military technology, tactics, and warfare evolution
 * All effects map to war skill modifiers in ResearchSystem (attack, defense, aim, luck,
 * critChance, critDamage, block, parry, unit cost/upkeep reductions, unit effectiveness,
 * missile/nuke damage boosts). No resource-related effects. No time field (goal-based).
 * Tiers 1-5: max 1 boost per research. Tiers 6-12: max 2 boosts per research.
 */

const WarResearch = {
    // ══════════════════════════════════════════════════════════════════════════════════
    // TIER 1 - BASIC COMBAT (Tech Level 1) - $10M to $20M
    // Max 1 boost per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    primitive_weapons: {
        id: 'primitive_weapons', name: 'Primitive Weapons', category: 'war', tier: 1,
        description: 'Basic clubs, spears, and stone weapons for combat',
        requirements: { tech_level: 1 },
        cost: 10000000,
        effects: { attack_power: 3 },
        unlocks: ['archery', 'bronze_weapons']
    },

    tribal_tactics: {
        id: 'tribal_tactics', name: 'Tribal Tactics', category: 'war', tier: 1,
        description: 'Basic group combat formations and coordinated attacks',
        requirements: { tech_level: 1 },
        cost: 12000000,
        effects: { defense_bonus: 3 },
        unlocks: ['formation_fighting']
    },

    basic_fortification: {
        id: 'basic_fortification', name: 'Basic Fortification', category: 'war', tier: 1,
        description: 'Simple defensive structures like palisades and earthworks',
        requirements: { tech_level: 1 },
        cost: 15000000,
        effects: { city_defense: 5 },
        unlocks: ['wall_construction']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 2 - BRONZE AGE (Tech Level 2) - $20M to $50M
    // Max 1 boost per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    archery: {
        id: 'archery', name: 'Archery Techniques', category: 'war', tier: 2,
        description: 'Improved bow design and marksmanship training',
        requirements: { tech_level: 2, prerequisites: ['primitive_weapons'] },
        cost: 20000000,
        effects: { accuracy: 5 },
        unlocks: ['composite_bow']
    },

    bronze_weapons: {
        id: 'bronze_weapons', name: 'Bronze Weaponry', category: 'war', tier: 2,
        description: 'Superior bronze swords, axes, and spearheads',
        requirements: { tech_level: 2, prerequisites: ['primitive_weapons'] },
        cost: 25000000,
        effects: { cutting_power: 6 },
        unlocks: ['iron_weapons']
    },

    formation_fighting: {
        id: 'formation_fighting', name: 'Formation Fighting', category: 'war', tier: 2,
        description: 'Organized military formations and coordinated attacks',
        requirements: { tech_level: 2, prerequisites: ['tribal_tactics'] },
        cost: 30000000,
        effects: { infantry_effectiveness: 6 },
        unlocks: ['phalanx_formation']
    },

    wall_construction: {
        id: 'wall_construction', name: 'Wall Construction', category: 'war', tier: 2,
        description: 'Stone and brick defensive walls for cities',
        requirements: { tech_level: 2, prerequisites: ['basic_fortification'] },
        cost: 50000000,
        effects: { fortress_strength: 8 },
        unlocks: ['castle_design', 'siege_engineering']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 3 - IRON AGE (Tech Level 3) - $50M to $100M
    // Max 1 boost per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    iron_weapons: {
        id: 'iron_weapons', name: 'Iron Weaponry', category: 'war', tier: 3,
        description: 'Superior iron swords, spears, and armor',
        requirements: { tech_level: 3, prerequisites: ['bronze_weapons'] },
        cost: 50000000,
        effects: { critical_chance: 5 },
        unlocks: ['steel_weapons']
    },

    phalanx_formation: {
        id: 'phalanx_formation', name: 'Phalanx Formation', category: 'war', tier: 3,
        description: 'Dense formation of spear-wielding infantry',
        requirements: { tech_level: 3, prerequisites: ['formation_fighting'] },
        cost: 75000000,
        effects: { frontal_defense: 10 },
        unlocks: ['legion_tactics']
    },

    composite_bow: {
        id: 'composite_bow', name: 'Composite Bow', category: 'war', tier: 3,
        description: 'Advanced bow construction with multiple materials',
        requirements: { tech_level: 3, prerequisites: ['archery'] },
        cost: 65000000,
        effects: { bow_power: 12 },
        unlocks: ['crossbow']
    },

    siege_engineering: {
        id: 'siege_engineering', name: 'Siege Engineering', category: 'war', tier: 3,
        description: 'Catapults, battering rams, and siege towers',
        requirements: { tech_level: 3, prerequisites: ['wall_construction'] },
        cost: 90000000,
        effects: { siege_attack: 15 },
        unlocks: ['trebuchet']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 4 - CLASSICAL (Tech Level 4) - $100M to $500M
    // Max 1 boost per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    steel_weapons: {
        id: 'steel_weapons', name: 'Steel Weaponry', category: 'war', tier: 4,
        description: 'High-quality steel weapons with superior properties',
        requirements: { tech_level: 4, prerequisites: ['iron_weapons'] },
        cost: 100000000,
        effects: { blade_sharpness: 12 },
        unlocks: ['plate_armor']
    },

    legion_tactics: {
        id: 'legion_tactics', name: 'Legion Tactics', category: 'war', tier: 4,
        description: 'Flexible Roman-style military organization and tactics',
        requirements: { tech_level: 4, prerequisites: ['phalanx_formation'] },
        cost: 150000000,
        effects: { tactical_flexibility: 15 },
        unlocks: ['professional_army', 'military_engineering']
    },

    crossbow: {
        id: 'crossbow', name: 'Crossbow Technology', category: 'war', tier: 4,
        description: 'Mechanical bow with superior power and accuracy',
        requirements: { tech_level: 4, prerequisites: ['composite_bow'] },
        cost: 130000000,
        effects: { penetrating_power: 18 },
        unlocks: ['gunpowder_weapons']
    },

    trebuchet: {
        id: 'trebuchet', name: 'Trebuchet', category: 'war', tier: 4,
        description: 'Powerful counterweight siege engine',
        requirements: { tech_level: 4, prerequisites: ['siege_engineering'] },
        cost: 400000000,
        effects: { siege_power: 20 },
        unlocks: ['artillery', 'gunpowder_weapons']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 5 - MEDIEVAL (Tech Level 5) - $500M to $1B
    // Max 1 boost per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    plate_armor: {
        id: 'plate_armor', name: 'Plate Armor', category: 'war', tier: 5,
        description: 'Full-body steel armor for maximum protection',
        requirements: { tech_level: 5, prerequisites: ['steel_weapons'] },
        cost: 500000000,
        effects: { personal_protection: 20 },
        unlocks: ['heavy_cavalry']
    },

    professional_army: {
        id: 'professional_army', name: 'Professional Army', category: 'war', tier: 5,
        description: 'Full-time trained soldiers with standardized equipment',
        requirements: { tech_level: 5, prerequisites: ['legion_tactics'] },
        cost: 700000000,
        effects: { soldier_effectiveness_boost: 20 },
        unlocks: []
    },

    castle_design: {
        id: 'castle_design', name: 'Castle Architecture', category: 'war', tier: 5,
        description: 'Advanced fortified structures with defensive innovations',
        requirements: { tech_level: 5, prerequisites: ['trebuchet'] },
        cost: 1000000000,
        effects: { defensive_capability: 25 },
        unlocks: ['star_fort']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 6 - GUNPOWDER (Tech Level 6) - $1B to $2B
    // Max 2 boosts per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    gunpowder_weapons: {
        id: 'gunpowder_weapons', name: 'Gunpowder Weapons', category: 'war', tier: 6,
        description: 'Early firearms and cannons using gunpowder',
        requirements: { tech_level: 6, prerequisites: ['trebuchet'] },
        cost: 1000000000,
        effects: { firepower_revolution: 25, missile_damage: 10 },
        unlocks: ['artillery', 'small_arms']
    },

    heavy_cavalry: {
        id: 'heavy_cavalry', name: 'Heavy Cavalry', category: 'war', tier: 6,
        description: 'Heavily armored mounted knights with superior equipment',
        requirements: { tech_level: 6, prerequisites: ['plate_armor'] },
        cost: 1200000000,
        effects: { cavalry_charge: 25, shock_tactics: 20 },
        unlocks: []
    },

    military_engineering: {
        id: 'military_engineering', name: 'Military Engineering', category: 'war', tier: 6,
        description: 'Specialized engineering for military construction and siege work',
        requirements: { tech_level: 6, prerequisites: ['professional_army'] },
        cost: 1500000000,
        effects: { siege_efficiency: 25, fortification_breaching: 20 },
        unlocks: ['military_logistics']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 7 - RENAISSANCE (Tech Level 7) - $2B to $5B
    // Max 2 boosts per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    artillery: {
        id: 'artillery', name: 'Artillery Systems', category: 'war', tier: 7,
        description: 'Advanced cannons and gunpowder artillery',
        requirements: { tech_level: 7, prerequisites: ['gunpowder_weapons'] },
        cost: 2000000000,
        effects: { artillery_power: 30, nuke_damage: 8 },
        unlocks: ['field_artillery']
    },

    small_arms: {
        id: 'small_arms', name: 'Small Arms', category: 'war', tier: 7,
        description: 'Improved muskets and personal firearms',
        requirements: { tech_level: 7, prerequisites: ['gunpowder_weapons'] },
        cost: 2500000000,
        effects: { marksmanship: 25, rate_of_fire: 25 },
        unlocks: ['rifle_technology']
    },

    star_fort: {
        id: 'star_fort', name: 'Star Fort Design', category: 'war', tier: 7,
        description: 'Geometric fortifications optimized against artillery',
        requirements: { tech_level: 7, prerequisites: ['castle_design'] },
        cost: 4000000000,
        effects: { artillery_resistance: 30, geometric_defense: 25 },
        unlocks: []
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 8 - INDUSTRIAL (Tech Level 8) - $5B to $10B
    // Max 2 boosts per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    rifle_technology: {
        id: 'rifle_technology', name: 'Rifle Technology', category: 'war', tier: 8,
        description: 'Rifled barrels for improved accuracy and range',
        requirements: { tech_level: 8, prerequisites: ['small_arms'] },
        cost: 5000000000,
        effects: { marksmanship: 35, precision_combat: 30 },
        unlocks: ['breech_loading']
    },

    field_artillery: {
        id: 'field_artillery', name: 'Field Artillery', category: 'war', tier: 8,
        description: 'Mobile cannons for battlefield support',
        requirements: { tech_level: 8, prerequisites: ['artillery'] },
        cost: 7000000000,
        effects: { mobile_firepower: 35, tactical_bombardment: 30 },
        unlocks: ['explosive_shells']
    },

    military_logistics: {
        id: 'military_logistics', name: 'Military Logistics', category: 'war', tier: 8,
        description: 'Organized supply chains and troop movement systems',
        requirements: { tech_level: 8, prerequisites: ['military_engineering'] },
        cost: 9000000000,
        effects: { soldier_cost_reduction: 12, ship_cost_reduction: 10 },
        unlocks: ['railroad_warfare']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 9 - MODERN (Tech Level 9) - $10B to $20B
    // Max 2 boosts per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    breech_loading: {
        id: 'breech_loading', name: 'Breech-Loading Weapons', category: 'war', tier: 9,
        description: 'Faster-loading weapons with improved mechanisms',
        requirements: { tech_level: 9, prerequisites: ['rifle_technology'] },
        cost: 10000000000,
        effects: { rate_of_fire: 40, combat_efficiency: 35 },
        unlocks: ['machine_guns']
    },

    explosive_shells: {
        id: 'explosive_shells', name: 'Explosive Artillery Shells', category: 'war', tier: 9,
        description: 'Artillery ammunition with explosive warheads',
        requirements: { tech_level: 9, prerequisites: ['field_artillery'] },
        cost: 12000000000,
        effects: { explosive_power: 45, area_damage: 40 },
        unlocks: ['chemical_weapons']
    },

    railroad_warfare: {
        id: 'railroad_warfare', name: 'Railroad Warfare', category: 'war', tier: 9,
        description: 'Use of railroads for rapid troop and supply movement',
        requirements: { tech_level: 9, prerequisites: ['military_logistics'] },
        cost: 15000000000,
        effects: { aircraft_cost_reduction: 15, ship_cost_reduction: 12 },
        unlocks: ['mechanized_warfare']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 10 - WORLD WAR ERA (Tech Level 10) - $20B to $50B
    // Max 2 boosts per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    machine_guns: {
        id: 'machine_guns', name: 'Machine Gun Technology', category: 'war', tier: 10,
        description: 'Automatic weapons with devastating firepower',
        requirements: { tech_level: 10, prerequisites: ['breech_loading'] },
        cost: 20000000000,
        effects: { automatic_firepower: 50, suppression_fire: 45 },
        unlocks: []
    },

    chemical_weapons: {
        id: 'chemical_weapons', name: 'Chemical Weapons', category: 'war', tier: 10,
        description: 'Toxic gases and chemical agents for warfare',
        requirements: { tech_level: 10, prerequisites: ['explosive_shells'] },
        cost: 30000000000,
        effects: { chemical_warfare: 55, area_denial: 50 },
        unlocks: ['nuclear_weapons']
    },

    mechanized_warfare: {
        id: 'mechanized_warfare', name: 'Mechanized Warfare', category: 'war', tier: 10,
        description: 'Tanks, armored vehicles, and motorized infantry',
        requirements: { tech_level: 10, prerequisites: ['railroad_warfare'] },
        cost: 50000000000,
        effects: { tank_effectiveness_boost: 30, armor_superiority: 25 },
        unlocks: ['jet_aircraft']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 11 - NUCLEAR AGE (Tech Level 11) - $50B to $100B
    // Max 2 boosts per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    nuclear_weapons: {
        id: 'nuclear_weapons', name: 'Nuclear Weapons', category: 'war', tier: 11,
        description: 'Atomic and thermonuclear weapons of mass destruction',
        requirements: { tech_level: 11, prerequisites: ['chemical_weapons'] },
        cost: 50000000000,
        effects: { nuke_damage_boost: 125, nuclear_deterrent: 100 },
        unlocks: []
    },

    jet_aircraft: {
        id: 'jet_aircraft', name: 'Jet Aircraft', category: 'war', tier: 11,
        description: 'High-speed jet-powered military aircraft',
        requirements: { tech_level: 11, prerequisites: ['mechanized_warfare'] },
        cost: 75000000000,
        effects: { air_superiority: 30, aircraft_effectiveness_boost: 25 },
        unlocks: ['stealth_technology']
    },

    radar_systems: {
        id: 'radar_systems', name: 'Radar Systems', category: 'war', tier: 11,
        description: 'Electronic detection and tracking systems',
        requirements: { tech_level: 11, prerequisites: ['mechanized_warfare'] },
        cost: 100000000000,
        effects: { detection_capability: 65, air_defense: 60 },
        unlocks: ['precision_weapons', 'cyber_warfare']
    },

    // ═══════════════════════════════════════════════════════════════════════════════════
    // TIER 12 - INFORMATION AGE (Tech Level 12) - $100B to $10T
    // Max 2 boosts per research
    // ═══════════════════════════════════════════════════════════════════════════════════

    stealth_technology: {
        id: 'stealth_technology', name: 'Stealth Technology', category: 'war', tier: 12,
        description: 'Radar-evading aircraft and vehicles',
        requirements: { tech_level: 12, prerequisites: ['jet_aircraft'] },
        cost: 100000000000,
        effects: { invisibility_advantage: 85, first_strike_capability: 75 },
        unlocks: []
    },

    precision_weapons: {
        id: 'precision_weapons', name: 'Precision Guided Weapons', category: 'war', tier: 12,
        description: 'Smart weapons with pinpoint accuracy',
        requirements: { tech_level: 12, prerequisites: ['radar_systems'] },
        cost: 500000000000,
        effects: { surgical_strikes: 100, precision_combat: 95 },
        unlocks: []
    },

    cyber_warfare: {
        id: 'cyber_warfare', name: 'Cyber Warfare', category: 'war', tier: 12,
        description: 'Digital attacks on enemy information systems',
        requirements: { tech_level: 12, prerequisites: ['radar_systems'] },
        cost: 10000000000000,
        effects: { information_dominance: 110, infrastructure_disruption: 100 },
        unlocks: []
    }
};

// Export the research data
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WarResearch;
} else if (typeof window !== 'undefined') {
    window.WarResearch = WarResearch;
}
