/**
 * Global Diseases Database  
 * Extracted from disease-system.js
 */

// Make sure the global object exists
if (typeof window !== 'undefined') {
    window.GLOBAL_DISEASES = {
        minor: [
            { 
                id: 'global_shimmer_syndrome', name: 'Global Shimmer Syndrome', severity: 'minor', scope: 'global',
                description: 'Worldwide visual disturbance affecting depth perception',
                effects: { happiness: -8, productivity: -15, transportation: -10, healthcare_cost: 150000 },
                cureRequirement: { money: 5000000, time: 72, research_points: 25, global_cooperation: true }
            },
            { 
                id: 'aurora_ailment', name: 'Aurora Ailment', severity: 'minor', scope: 'global',
                description: 'Light-sensitive condition affecting circadian rhythms',
                effects: { happiness: -6, productivity: -12, energy_efficiency: -8, healthcare_cost: 120000 },
                cureRequirement: { money: 4000000, time: 60, research_points: 20, global_cooperation: true }
            },
            { 
                id: 'resonance_disorder', name: 'Resonance Disorder', severity: 'minor', scope: 'global',
                description: 'Sound sensitivity causing disorientation',
                effects: { happiness: -7, productivity: -14, communication: -5, healthcare_cost: 130000 },
                cureRequirement: { money: 4500000, time: 65, research_points: 22, global_cooperation: true }
            },
            { 
                id: 'chromatic_confusion', name: 'Chromatic Confusion', severity: 'minor', scope: 'global',
                description: 'Color perception disorder affecting daily tasks',
                effects: { happiness: -5, productivity: -10, art_culture: -15, healthcare_cost: 110000 },
                cureRequirement: { money: 3800000, time: 55, research_points: 18, global_cooperation: true }
            },
            { 
                id: 'temporal_tremors', name: 'Temporal Tremors', severity: 'minor', scope: 'global',
                description: 'Time perception disorder causing scheduling issues',
                effects: { happiness: -9, productivity: -18, coordination: -12, healthcare_cost: 160000 },
                cureRequirement: { money: 5500000, time: 75, research_points: 28, global_cooperation: true }
            },
            { 
                id: 'magnetic_malaise', name: 'Magnetic Malaise', severity: 'minor', scope: 'global',
                description: 'Electromagnetic sensitivity affecting navigation',
                effects: { happiness: -6, productivity: -13, technology: -10, healthcare_cost: 125000 },
                cureRequirement: { money: 4200000, time: 62, research_points: 21, global_cooperation: true }
            },
            { 
                id: 'gravity_gastritis', name: 'Gravity Gastritis', severity: 'minor', scope: 'global',
                description: 'Digestive issues related to gravitational sensitivity',
                effects: { happiness: -8, food_efficiency: -12, space_program: -20, healthcare_cost: 140000 },
                cureRequirement: { money: 4800000, time: 68, research_points: 24, global_cooperation: true }
            },
            { 
                id: 'quantum_queasiness', name: 'Quantum Queasiness', severity: 'minor', scope: 'global',
                description: 'Nausea caused by quantum field fluctuations',
                effects: { happiness: -7, research_speed: -15, high_tech: -18, healthcare_cost: 135000 },
                cureRequirement: { money: 4600000, time: 66, research_points: 23, global_cooperation: true }
            },
            { 
                id: 'neural_static', name: 'Neural Static', severity: 'minor', scope: 'global',
                description: 'Mental interference from electromagnetic fields',
                effects: { happiness: -10, productivity: -20, communication: -15, healthcare_cost: 170000 },
                cureRequirement: { money: 6000000, time: 80, research_points: 30, global_cooperation: true }
            },
            { 
                id: 'phase_shift_syndrome', name: 'Phase Shift Syndrome', severity: 'minor', scope: 'global',
                description: 'Dimensional instability affecting molecular cohesion',
                effects: { happiness: -8, physical_stability: -12, material_science: -10, healthcare_cost: 145000 },
                cureRequirement: { money: 4900000, time: 70, research_points: 26, global_cooperation: true }
            },
            { 
                id: 'echo_memory_disorder', name: 'Echo Memory Disorder', severity: 'minor', scope: 'global',
                description: 'False memories spreading through collective consciousness',
                effects: { happiness: -9, historical_accuracy: -20, education: -8, healthcare_cost: 155000 },
                cureRequirement: { money: 5200000, time: 73, research_points: 27, global_cooperation: true }
            },
            { 
                id: 'crystalline_growth', name: 'Crystalline Growth Disorder', severity: 'minor', scope: 'global',
                description: 'Mineral deposits forming in biological tissue',
                effects: { happiness: -7, mobility: -15, mining_safety: -25, healthcare_cost: 135000 },
                cureRequirement: { money: 4600000, time: 67, research_points: 24, global_cooperation: true }
            },
            { 
                id: 'light_sensitivity_plague', name: 'Global Light Sensitivity', severity: 'minor', scope: 'global',
                description: 'Worldwide photophobia affecting daily activities',
                effects: { happiness: -6, outdoor_activities: -30, solar_energy: -15, healthcare_cost: 120000 },
                cureRequirement: { money: 4000000, time: 58, research_points: 19, global_cooperation: true }
            },
            { 
                id: 'atmospheric_pressure_syndrome', name: 'Atmospheric Pressure Syndrome', severity: 'minor', scope: 'global',
                description: 'Altitude sickness affecting all elevations',
                effects: { happiness: -8, mountain_activities: -40, aviation: -20, healthcare_cost: 140000 },
                cureRequirement: { money: 4700000, time: 69, research_points: 25, global_cooperation: true }
            },
            { 
                id: 'bio_rhythm_disruption', name: 'Bio-Rhythm Disruption', severity: 'minor', scope: 'global',
                description: 'Circadian cycle chaos affecting sleep patterns',
                effects: { happiness: -9, productivity: -18, health_stability: -12, healthcare_cost: 160000 },
                cureRequirement: { money: 5400000, time: 76, research_points: 28, global_cooperation: true }
            },
            { 
                id: 'molecular_drift', name: 'Molecular Drift Syndrome', severity: 'minor', scope: 'global',
                description: 'Cellular structure instability causing random mutations',
                effects: { happiness: -10, genetic_stability: -25, reproduction: -8, healthcare_cost: 175000 },
                cureRequirement: { money: 5800000, time: 82, research_points: 31, global_cooperation: true }
            },
            { 
                id: 'psychic_interference', name: 'Psychic Interference Disorder', severity: 'minor', scope: 'global',
                description: 'Mental static disrupting cognitive functions',
                effects: { happiness: -7, concentration: -20, decision_making: -12, healthcare_cost: 130000 },
                cureRequirement: { money: 4400000, time: 64, research_points: 22, global_cooperation: true }
            },
            { 
                id: 'energy_drain_malaise', name: 'Global Energy Drain', severity: 'minor', scope: 'global',
                description: 'Unexplained fatigue affecting worldwide population',
                effects: { happiness: -8, energy_levels: -25, motivation: -15, healthcare_cost: 150000 },
                cureRequirement: { money: 5000000, time: 71, research_points: 26, global_cooperation: true }
            },
            { 
                id: 'texture_blindness', name: 'Texture Blindness', severity: 'minor', scope: 'global',
                description: 'Loss of tactile sensation affecting fine motor skills',
                effects: { happiness: -6, craftsmanship: -30, precision_work: -25, healthcare_cost: 125000 },
                cureRequirement: { money: 4200000, time: 61, research_points: 21, global_cooperation: true }
            },
            { 
                id: 'frequency_sickness', name: 'Frequency Sickness', severity: 'minor', scope: 'global',
                description: 'Sensitivity to specific sound frequencies',
                effects: { happiness: -7, music_culture: -20, communication: -10, healthcare_cost: 135000 },
                cureRequirement: { money: 4500000, time: 66, research_points: 23, global_cooperation: true }
            },
            { 
                id: 'phantom_taste_syndrome', name: 'Phantom Taste Syndrome', severity: 'minor', scope: 'global',
                description: 'Persistent false tastes disrupting nutrition',
                effects: { happiness: -5, food_enjoyment: -25, nutrition: -8, healthcare_cost: 115000 },
                cureRequirement: { money: 3900000, time: 56, research_points: 18, global_cooperation: true }
            },
            { 
                id: 'micro_sleep_disorder', name: 'Micro-Sleep Disorder', severity: 'minor', scope: 'global',
                description: 'Involuntary brief sleep episodes during waking hours',
                effects: { happiness: -9, safety: -30, productivity: -15, healthcare_cost: 165000 },
                cureRequirement: { money: 5600000, time: 78, research_points: 29, global_cooperation: true }
            },
            { 
                id: 'collective_tinnitus', name: 'Collective Tinnitus', severity: 'minor', scope: 'global',
                description: 'Worldwide phantom ringing in ears',
                effects: { happiness: -6, concentration: -15, audio_clarity: -20, healthcare_cost: 120000 },
                cureRequirement: { money: 4100000, time: 59, research_points: 20, global_cooperation: true }
            },
            { 
                id: 'depth_perception_loss', name: 'Depth Perception Loss', severity: 'minor', scope: 'global',
                description: 'Global inability to judge distances accurately',
                effects: { happiness: -8, transportation: -25, construction: -20, healthcare_cost: 140000 },
                cureRequirement: { money: 4800000, time: 68, research_points: 25, global_cooperation: true }
            },
            { 
                id: 'emotional_numbness', name: 'Global Emotional Numbness', severity: 'minor', scope: 'global',
                description: 'Worldwide reduction in emotional responsiveness',
                effects: { happiness: -12, creativity: -20, social_bonds: -15, healthcare_cost: 180000 },
                cureRequirement: { money: 6200000, time: 85, research_points: 32, global_cooperation: true }
            },
            { 
                id: 'false_hunger', name: 'False Hunger Syndrome', severity: 'minor', scope: 'global',
                description: 'Phantom appetite causing overconsumption',
                effects: { happiness: -5, food_waste: 20, health_complications: -10, healthcare_cost: 110000 },
                cureRequirement: { money: 3700000, time: 54, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'motion_sickness_pandemic', name: 'Universal Motion Sickness', severity: 'minor', scope: 'global',
                description: 'Extreme sensitivity to all forms of movement',
                effects: { happiness: -7, transportation: -35, travel: -40, healthcare_cost: 130000 },
                cureRequirement: { money: 4300000, time: 63, research_points: 22, global_cooperation: true }
            },
            { 
                id: 'spatial_confusion', name: 'Spatial Confusion Disorder', severity: 'minor', scope: 'global',
                description: 'Difficulty with left-right and directional orientation',
                effects: { happiness: -6, navigation: -30, coordination: -20, healthcare_cost: 125000 },
                cureRequirement: { money: 4200000, time: 60, research_points: 21, global_cooperation: true }
            },
            { 
                id: 'color_shift_syndrome', name: 'Color Shift Syndrome', severity: 'minor', scope: 'global',
                description: 'Colors appear differently to each individual',
                effects: { happiness: -8, art_consistency: -40, communication: -5, healthcare_cost: 145000 },
                cureRequirement: { money: 4900000, time: 70, research_points: 26, global_cooperation: true }
            },
            { 
                id: 'texture_hypersensitivity', name: 'Texture Hypersensitivity', severity: 'minor', scope: 'global',
                description: 'Overwhelming tactile responses to normal materials',
                effects: { happiness: -9, comfort: -25, clothing_industry: -15, healthcare_cost: 155000 },
                cureRequirement: { money: 5300000, time: 74, research_points: 27, global_cooperation: true }
            },
            { 
                id: 'phantom_wind_syndrome', name: 'Phantom Wind Syndrome', severity: 'minor', scope: 'global',
                description: 'Sensation of constant wind when air is still',
                effects: { happiness: -4, outdoor_comfort: -15, weather_perception: -10, healthcare_cost: 105000 },
                cureRequirement: { money: 3600000, time: 52, research_points: 16, global_cooperation: true }
            },
            { 
                id: 'temperature_confusion', name: 'Temperature Confusion', severity: 'minor', scope: 'global',
                description: 'Inability to accurately perceive hot and cold',
                effects: { happiness: -7, safety: -20, comfort: -15, healthcare_cost: 135000 },
                cureRequirement: { money: 4500000, time: 65, research_points: 23, global_cooperation: true }
            },
            { 
                id: 'universal_vertigo', name: 'Universal Vertigo', severity: 'minor', scope: 'global',
                description: 'Worldwide dizziness affecting balance',
                effects: { happiness: -8, mobility: -25, productivity: -12, healthcare_cost: 150000 },
                cureRequirement: { money: 5100000, time: 72, research_points: 26, global_cooperation: true }
            },
            { 
                id: 'global_giggle_syndrome', name: 'Global Giggle Syndrome', severity: 'minor', scope: 'global',
                description: 'Uncontrollable laughter spreading worldwide',
                effects: { happiness: -4, seriousness: -30, professional_conduct: -20, healthcare_cost: 105000 },
                cureRequirement: { money: 3500000, time: 50, research_points: 15, global_cooperation: true }
            },
            { 
                id: 'planetary_phantom_itch', name: 'Planetary Phantom Itch', severity: 'minor', scope: 'global',
                description: 'Worldwide sensation of itching with no cause',
                effects: { happiness: -6, concentration: -18, sleep_quality: -15, healthcare_cost: 115000 },
                cureRequirement: { money: 3800000, time: 55, research_points: 18, global_cooperation: true }
            },
            { 
                id: 'universal_unblinking', name: 'Universal Unblinking Disorder', severity: 'minor', scope: 'global',
                description: 'Global inability to blink normally',
                effects: { happiness: -7, eye_comfort: -25, moisture_retention: -20, healthcare_cost: 125000 },
                cureRequirement: { money: 4100000, time: 58, research_points: 20, global_cooperation: true }
            },
            { 
                id: 'cosmic_hiccup_epidemic', name: 'Cosmic Hiccup Epidemic', severity: 'minor', scope: 'global',
                description: 'Synchronized hiccupping across all humans',
                effects: { happiness: -3, breathing_rhythm: -12, synchronization: -8, healthcare_cost: 95000 },
                cureRequirement: { money: 3200000, time: 45, research_points: 12, global_cooperation: true }
            },
            { 
                id: 'global_goosebump_syndrome', name: 'Global Goosebump Syndrome', severity: 'minor', scope: 'global',
                description: 'Permanent goosebumps on all human skin',
                effects: { happiness: -5, skin_comfort: -20, temperature_sensitivity: -15, healthcare_cost: 110000 },
                cureRequirement: { money: 3700000, time: 53, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'worldwide_wandering_eyes', name: 'Worldwide Wandering Eyes', severity: 'minor', scope: 'global',
                description: 'Eyes moving independently of conscious control',
                effects: { happiness: -8, visual_focus: -30, social_comfort: -25, healthcare_cost: 140000 },
                cureRequirement: { money: 4600000, time: 65, research_points: 23, global_cooperation: true }
            },
            { 
                id: 'planetary_paper_cuts', name: 'Planetary Paper Cuts Syndrome', severity: 'minor', scope: 'global',
                description: 'Microscopic cuts appearing without cause',
                effects: { happiness: -4, skin_integrity: -15, pain_tolerance: -10, healthcare_cost: 100000 },
                cureRequirement: { money: 3400000, time: 48, research_points: 14, global_cooperation: true }
            },
            { 
                id: 'universal_shoe_discomfort', name: 'Universal Shoe Discomfort', severity: 'minor', scope: 'global',
                description: 'All footwear becoming uncomfortable globally',
                effects: { happiness: -6, mobility_comfort: -25, walking_endurance: -20, healthcare_cost: 120000 },
                cureRequirement: { money: 4000000, time: 57, research_points: 19, global_cooperation: true }
            },
            { 
                id: 'global_gravity_sensitivity', name: 'Global Gravity Sensitivity', severity: 'minor', scope: 'global',
                description: 'Heightened awareness of gravitational changes',
                effects: { happiness: -7, balance_comfort: -22, spatial_orientation: -18, healthcare_cost: 130000 },
                cureRequirement: { money: 4300000, time: 61, research_points: 21, global_cooperation: true }
            },
            { 
                id: 'worldwide_word_mixing', name: 'Worldwide Word Mixing', severity: 'minor', scope: 'global',
                description: 'Random word order changes in speech',
                effects: { happiness: -5, communication_clarity: -28, language_stability: -20, healthcare_cost: 112000 },
                cureRequirement: { money: 3750000, time: 54, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'cosmic_coordination_chaos', name: 'Cosmic Coordination Chaos', severity: 'minor', scope: 'global',
                description: 'Slight loss of fine motor coordination worldwide',
                effects: { happiness: -6, precision_tasks: -22, artistic_ability: -18, healthcare_cost: 118000 },
                cureRequirement: { money: 3900000, time: 56, research_points: 18, global_cooperation: true }
            },
            { 
                id: 'planetary_phantom_smells', name: 'Planetary Phantom Smells', severity: 'minor', scope: 'global',
                description: 'False odors detected by everyone simultaneously',
                effects: { happiness: -4, olfactory_reliability: -25, food_enjoyment: -15, healthcare_cost: 102000 },
                cureRequirement: { money: 3450000, time: 49, research_points: 15, global_cooperation: true }
            },
            { 
                id: 'universal_uneven_breathing', name: 'Universal Uneven Breathing', severity: 'minor', scope: 'global',
                description: 'Slightly irregular breathing patterns globally',
                effects: { happiness: -5, respiratory_rhythm: -18, meditation_ability: -20, healthcare_cost: 108000 },
                cureRequirement: { money: 3650000, time: 52, research_points: 16, global_cooperation: true }
            },
            { 
                id: 'global_ghost_touches', name: 'Global Ghost Touches', severity: 'minor', scope: 'global',
                description: 'Feeling phantom touches on skin worldwide',
                effects: { happiness: -7, tactile_reliability: -24, paranormal_anxiety: -16, healthcare_cost: 128000 },
                cureRequirement: { money: 4200000, time: 59, research_points: 20, global_cooperation: true }
            },
            { 
                id: 'worldwide_weight_wobbles', name: 'Worldwide Weight Wobbles', severity: 'minor', scope: 'global',
                description: 'Fluctuating sense of body weight globally',
                effects: { happiness: -6, physical_confidence: -20, balance_trust: -18, healthcare_cost: 115000 },
                cureRequirement: { money: 3800000, time: 54, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'cosmic_color_confusion', name: 'Cosmic Color Confusion', severity: 'minor', scope: 'global',
                description: 'Slight color perception shifts worldwide',
                effects: { happiness: -4, artistic_accuracy: -30, traffic_safety: -12, healthcare_cost: 98000 },
                cureRequirement: { money: 3300000, time: 47, research_points: 13, global_cooperation: true }
            },
            { 
                id: 'planetary_pins_and_needles', name: 'Planetary Pins and Needles', severity: 'minor', scope: 'global',
                description: 'Mild tingling sensations affecting everyone',
                effects: { happiness: -5, comfort_levels: -18, sleep_quality: -15, healthcare_cost: 110000 },
                cureRequirement: { money: 3700000, time: 53, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'universal_unsteady_stairs', name: 'Universal Unsteady Stairs Syndrome', severity: 'minor', scope: 'global',
                description: 'Difficulty with stair navigation worldwide',
                effects: { happiness: -6, stair_confidence: -35, fall_risk: -15, healthcare_cost: 122000 },
                cureRequirement: { money: 4050000, time: 58, research_points: 19, global_cooperation: true }
            },
            { 
                id: 'global_guilty_giggles', name: 'Global Guilty Giggles', severity: 'minor', scope: 'global',
                description: 'Inappropriate laughter in serious situations',
                effects: { happiness: -3, social_appropriateness: -28, diplomatic_relations: -20, healthcare_cost: 92000 },
                cureRequirement: { money: 3100000, time: 44, research_points: 12, global_cooperation: true }
            },
            { 
                id: 'worldwide_wandering_attention', name: 'Worldwide Wandering Attention', severity: 'minor', scope: 'global',
                description: 'Slightly reduced attention spans globally',
                effects: { happiness: -7, focus_duration: -25, productivity: -15, healthcare_cost: 135000 },
                cureRequirement: { money: 4400000, time: 62, research_points: 22, global_cooperation: true }
            },
            { 
                id: 'cosmic_counting_confusion', name: 'Cosmic Counting Confusion', severity: 'minor', scope: 'global',
                description: 'Minor mathematical processing difficulties',
                effects: { happiness: -5, numerical_accuracy: -20, financial_calculations: -18, healthcare_cost: 112000 },
                cureRequirement: { money: 3750000, time: 53, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'planetary_phantom_fullness', name: 'Planetary Phantom Fullness', severity: 'minor', scope: 'global',
                description: 'False sensation of being full after small meals',
                effects: { happiness: -4, eating_enjoyment: -22, nutrition_intake: -15, healthcare_cost: 105000 },
                cureRequirement: { money: 3500000, time: 50, research_points: 15, global_cooperation: true }
            },
            { 
                id: 'universal_upside_down_text', name: 'Universal Upside Down Text Syndrome', severity: 'minor', scope: 'global',
                description: 'Text occasionally appearing inverted to everyone',
                effects: { happiness: -6, reading_efficiency: -25, literacy_comfort: -20, healthcare_cost: 120000 },
                cureRequirement: { money: 4000000, time: 57, research_points: 19, global_cooperation: true }
            },
            { 
                id: 'global_gravity_giggles', name: 'Global Gravity Giggles', severity: 'minor', scope: 'global',
                description: 'Laughter when experiencing gravity changes',
                effects: { happiness: -3, elevator_comfort: -30, aerial_activities: -25, healthcare_cost: 88000 },
                cureRequirement: { money: 2950000, time: 42, research_points: 11, global_cooperation: true }
            },
            { 
                id: 'worldwide_whistle_weakness', name: 'Worldwide Whistle Weakness', severity: 'minor', scope: 'global',
                description: 'Inability to whistle properly affecting everyone',
                effects: { happiness: -4, musical_expression: -20, communication_methods: -12, healthcare_cost: 95000 },
                cureRequirement: { money: 3200000, time: 46, research_points: 13, global_cooperation: true }
            },
            { 
                id: 'cosmic_clothes_clinginess', name: 'Cosmic Clothes Clinginess', severity: 'minor', scope: 'global',
                description: 'Fabric adhering uncomfortably to skin worldwide',
                effects: { happiness: -5, clothing_comfort: -25, fashion_freedom: -18, healthcare_cost: 108000 },
                cureRequirement: { money: 3650000, time: 52, research_points: 16, global_cooperation: true }
            },
            { 
                id: 'planetary_phantom_phone_vibrations', name: 'Planetary Phantom Phone Vibrations', severity: 'minor', scope: 'global',
                description: 'False sensation of device notifications',
                effects: { happiness: -6, technology_anxiety: -22, attention_quality: -15, healthcare_cost: 118000 },
                cureRequirement: { money: 3900000, time: 55, research_points: 18, global_cooperation: true }
            },
            { 
                id: 'universal_uncomfortable_chairs', name: 'Universal Uncomfortable Chairs', severity: 'minor', scope: 'global',
                description: 'All seating becoming uncomfortable globally',
                effects: { happiness: -7, sitting_endurance: -30, work_comfort: -25, healthcare_cost: 132000 },
                cureRequirement: { money: 4350000, time: 61, research_points: 21, global_cooperation: true }
            },
            { 
                id: 'global_gum_stickiness', name: 'Global Gum Stickiness Syndrome', severity: 'minor', scope: 'global',
                description: 'All chewing gum becoming excessively sticky',
                effects: { happiness: -3, oral_comfort: -18, dental_hygiene: -10, healthcare_cost: 85000 },
                cureRequirement: { money: 2850000, time: 41, research_points: 10, global_cooperation: true }
            },
            { 
                id: 'worldwide_window_fog', name: 'Worldwide Window Fog Syndrome', severity: 'minor', scope: 'global',
                description: 'All glass surfaces fogging unexpectedly',
                effects: { happiness: -4, visibility: -20, transportation_safety: -15, healthcare_cost: 98000 },
                cureRequirement: { money: 3300000, time: 47, research_points: 13, global_cooperation: true }
            },
            { 
                id: 'cosmic_corner_confusion', name: 'Cosmic Corner Confusion', severity: 'minor', scope: 'global',
                description: 'Difficulty judging angles and corners globally',
                effects: { happiness: -5, spatial_accuracy: -22, navigation_precision: -18, healthcare_cost: 110000 },
                cureRequirement: { money: 3700000, time: 53, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'planetary_phantom_stairs', name: 'Planetary Phantom Stairs', severity: 'minor', scope: 'global',
                description: 'Feeling steps that do not exist',
                effects: { happiness: -6, walking_confidence: -25, balance_trust: -20, healthcare_cost: 115000 },
                cureRequirement: { money: 3800000, time: 54, research_points: 18, global_cooperation: true }
            },
            { 
                id: 'universal_unmatched_socks', name: 'Universal Unmatched Socks Syndrome', severity: 'minor', scope: 'global',
                description: 'All sock pairs becoming visually mismatched',
                effects: { happiness: -3, fashion_confidence: -15, symmetry_comfort: -12, healthcare_cost: 88000 },
                cureRequirement: { money: 2950000, time: 42, research_points: 11, global_cooperation: true }
            },
            { 
                id: 'global_ghost_music', name: 'Global Ghost Music Syndrome', severity: 'minor', scope: 'global',
                description: 'Hearing faint phantom melodies worldwide',
                effects: { happiness: -4, auditory_reliability: -20, silence_appreciation: -18, healthcare_cost: 102000 },
                cureRequirement: { money: 3450000, time: 49, research_points: 15, global_cooperation: true }
            },
            { 
                id: 'worldwide_wobbly_writing', name: 'Worldwide Wobbly Writing', severity: 'minor', scope: 'global',
                description: 'Handwriting becoming slightly unsteady globally',
                effects: { happiness: -5, writing_confidence: -22, document_clarity: -18, healthcare_cost: 108000 },
                cureRequirement: { money: 3650000, time: 52, research_points: 16, global_cooperation: true }
            },
            { 
                id: 'cosmic_color_bleeding', name: 'Cosmic Color Bleeding', severity: 'minor', scope: 'global',
                description: 'Colors slightly bleeding into adjacent areas',
                effects: { happiness: -6, visual_clarity: -25, artistic_precision: -20, healthcare_cost: 122000 },
                cureRequirement: { money: 4050000, time: 58, research_points: 19, global_cooperation: true }
            },
            { 
                id: 'planetary_phantom_pockets', name: 'Planetary Phantom Pockets', severity: 'minor', scope: 'global',
                description: 'Feeling pockets in clothing where none exist',
                effects: { happiness: -4, clothing_familiarity: -18, storage_confidence: -15, healthcare_cost: 95000 },
                cureRequirement: { money: 3200000, time: 46, research_points: 13, global_cooperation: true }
            },
            { 
                id: 'universal_uneven_floors', name: 'Universal Uneven Floors Syndrome', severity: 'minor', scope: 'global',
                description: 'Perception of floor surfaces being slightly uneven',
                effects: { happiness: -7, walking_comfort: -28, balance_confidence: -22, healthcare_cost: 128000 },
                cureRequirement: { money: 4200000, time: 59, research_points: 20, global_cooperation: true }
            },
            { 
                id: 'global_gravity_hiccups', name: 'Global Gravity Hiccups', severity: 'minor', scope: 'global',
                description: 'Brief moments of feeling weightless randomly',
                effects: { happiness: -6, physical_security: -25, ground_confidence: -20, healthcare_cost: 118000 },
                cureRequirement: { money: 3900000, time: 55, research_points: 18, global_cooperation: true }
            },
            { 
                id: 'worldwide_whisper_echoes', name: 'Worldwide Whisper Echoes', severity: 'minor', scope: 'global',
                description: 'All whispers creating slight echo effects',
                effects: { happiness: -3, quiet_communication: -20, privacy_comfort: -15, healthcare_cost: 92000 },
                cureRequirement: { money: 3100000, time: 44, research_points: 12, global_cooperation: true }
            },
            { 
                id: 'cosmic_compass_confusion', name: 'Cosmic Compass Confusion', severity: 'minor', scope: 'global',
                description: 'Magnetic compasses showing slight deviations',
                effects: { happiness: -5, navigation_trust: -30, directional_confidence: -25, healthcare_cost: 112000 },
                cureRequirement: { money: 3750000, time: 53, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'planetary_phantom_buttons', name: 'Planetary Phantom Buttons', severity: 'minor', scope: 'global',
                description: 'Feeling buttons on clothing where none exist',
                effects: { happiness: -4, tactile_reliability: -18, clothing_comfort: -15, healthcare_cost: 98000 },
                cureRequirement: { money: 3300000, time: 47, research_points: 13, global_cooperation: true }
            },
            { 
                id: 'universal_unsteady_tables', name: 'Universal Unsteady Tables', severity: 'minor', scope: 'global',
                description: 'All tables feeling slightly unstable',
                effects: { happiness: -6, dining_comfort: -25, work_stability: -20, healthcare_cost: 120000 },
                cureRequirement: { money: 4000000, time: 57, research_points: 19, global_cooperation: true }
            },
            { 
                id: 'global_ghost_winds', name: 'Global Ghost Winds Syndrome', severity: 'minor', scope: 'global',
                description: 'Feeling phantom breezes in still air',
                effects: { happiness: -4, atmospheric_reliability: -20, weather_trust: -15, healthcare_cost: 105000 },
                cureRequirement: { money: 3500000, time: 50, research_points: 15, global_cooperation: true }
            },
            { 
                id: 'worldwide_wobbly_wheels', name: 'Worldwide Wobbly Wheels', severity: 'minor', scope: 'global',
                description: 'Sensation of wheels wobbling on all vehicles',
                effects: { happiness: -7, transportation_comfort: -30, travel_confidence: -25, healthcare_cost: 135000 },
                cureRequirement: { money: 4400000, time: 62, research_points: 22, global_cooperation: true }
            },
            { 
                id: 'cosmic_calendar_confusion', name: 'Cosmic Calendar Confusion', severity: 'minor', scope: 'global',
                description: 'Slight uncertainty about current date',
                effects: { happiness: -5, temporal_awareness: -22, scheduling_confidence: -18, healthcare_cost: 110000 },
                cureRequirement: { money: 3700000, time: 53, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'planetary_phantom_drafts', name: 'Planetary Phantom Drafts', severity: 'minor', scope: 'global',
                description: 'Feeling cold drafts in warm, sealed spaces',
                effects: { happiness: -6, thermal_comfort: -25, energy_efficiency: -18, healthcare_cost: 118000 },
                cureRequirement: { money: 3900000, time: 55, research_points: 18, global_cooperation: true }
            },
            { 
                id: 'universal_uneven_lighting', name: 'Universal Uneven Lighting Syndrome', severity: 'minor', scope: 'global',
                description: 'Perception of lighting being slightly off everywhere',
                effects: { happiness: -5, visual_comfort: -22, mood_lighting: -20, healthcare_cost: 112000 },
                cureRequirement: { money: 3750000, time: 53, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'global_gravity_delays', name: 'Global Gravity Delays', severity: 'minor', scope: 'global',
                description: 'Slight delay in gravitational effects on dropped objects',
                effects: { happiness: -4, physics_confidence: -25, reaction_timing: -18, healthcare_cost: 102000 },
                cureRequirement: { money: 3450000, time: 49, research_points: 15, global_cooperation: true }
            },
            { 
                id: 'worldwide_water_weirdness', name: 'Worldwide Water Weirdness', severity: 'minor', scope: 'global',
                description: 'All water tasting slightly different than expected',
                effects: { happiness: -4, hydration_satisfaction: -20, beverage_enjoyment: -18, healthcare_cost: 98000 },
                cureRequirement: { money: 3300000, time: 47, research_points: 13, global_cooperation: true }
            }
        ],
        major: [
            { 
                id: 'world_ender_virus', name: 'World Ender Virus', severity: 'major', scope: 'global',
                description: 'Catastrophic pathogen threatening civilization',
                effects: { happiness: -50, productivity: -70, population_growth: -60, healthcare_cost: 2000000 },
                cureRequirement: { money: 50000000, time: 365, research_points: 200, global_cooperation: true }
            },
            { 
                id: 'civilization_collapse_syndrome', name: 'Civilization Collapse Syndrome', severity: 'major', scope: 'global',
                description: 'Systemic failure disease affecting all infrastructure',
                effects: { happiness: -45, productivity: -65, technology: -40, healthcare_cost: 1800000 },
                cureRequirement: { money: 45000000, time: 320, research_points: 180, global_cooperation: true }
            },
            { 
                id: 'planetary_plague', name: 'Planetary Plague', severity: 'major', scope: 'global',
                description: 'Ecosystem-wide pathogen affecting all life forms',
                effects: { happiness: -55, environment: -50, food_production: -45, healthcare_cost: 2200000 },
                cureRequirement: { money: 55000000, time: 400, research_points: 220, global_cooperation: true }
            },
            { 
                id: 'reality_rupture_disease', name: 'Reality Rupture Disease', severity: 'major', scope: 'global',
                description: 'Quantum-level disease affecting spacetime stability',
                effects: { happiness: -60, research_speed: -50, high_tech: -60, healthcare_cost: 2500000 },
                cureRequirement: { money: 60000000, time: 450, research_points: 250, global_cooperation: true }
            },
            { 
                id: 'consciousness_virus', name: 'Consciousness Virus', severity: 'major', scope: 'global',
                description: 'Memetic pathogen affecting collective intelligence',
                effects: { happiness: -40, education: -35, research_speed: -30, healthcare_cost: 1600000 },
                cureRequirement: { money: 40000000, time: 280, research_points: 160, global_cooperation: true }
            },
            { 
                id: 'dimensional_decay', name: 'Dimensional Decay', severity: 'major', scope: 'global',
                description: 'Multidimensional infection causing reality breakdown',
                effects: { happiness: -65, productivity: -80, technology: -50, healthcare_cost: 2800000 },
                cureRequirement: { money: 70000000, time: 500, research_points: 280, global_cooperation: true }
            },
            { 
                id: 'entropy_epidemic', name: 'Entropy Epidemic', severity: 'major', scope: 'global',
                description: 'Thermodynamic disease accelerating universal decay',
                effects: { happiness: -70, energy_efficiency: -60, all_production: -40, healthcare_cost: 3000000 },
                cureRequirement: { money: 80000000, time: 600, research_points: 300, global_cooperation: true }
            },
            { 
                id: 'new_black_death', name: 'New Black Death', severity: 'major', scope: 'global',
                description: 'Modern strain of bubonic plague with global reach',
                effects: { happiness: -42, productivity: -58, population_growth: -55, healthcare_cost: 1700000 },
                cureRequirement: { money: 42000000, time: 300, research_points: 170, global_cooperation: true }
            },
            { 
                id: 'super_influenza', name: 'Super Influenza', severity: 'major', scope: 'global',
                description: 'Highly contagious flu strain resistant to treatments',
                effects: { happiness: -38, productivity: -52, transportation: -30, healthcare_cost: 1500000 },
                cureRequirement: { money: 38000000, time: 260, research_points: 150, global_cooperation: true }
            },
            { 
                id: 'global_hemorrhagic_fever', name: 'Global Hemorrhagic Fever', severity: 'major', scope: 'global',
                description: 'Worldwide bleeding disorder with high mortality',
                effects: { happiness: -45, population_growth: -50, medical_capacity: -40, healthcare_cost: 1800000 },
                cureRequirement: { money: 45000000, time: 320, research_points: 180, global_cooperation: true }
            },
            { 
                id: 'neuro_degradation_pandemic', name: 'Neuro-Degradation Pandemic', severity: 'major', scope: 'global',
                description: 'Progressive brain function loss across all ages',
                effects: { happiness: -50, intelligence: -35, civilization_capacity: -45, healthcare_cost: 2000000 },
                cureRequirement: { money: 50000000, time: 380, research_points: 200, global_cooperation: true }
            },
            { 
                id: 'immune_system_collapse', name: 'Global Immune Collapse', severity: 'major', scope: 'global',
                description: 'Worldwide failure of natural disease resistance',
                effects: { happiness: -48, disease_vulnerability: 100, medical_demand: 200, healthcare_cost: 1900000 },
                cureRequirement: { money: 48000000, time: 350, research_points: 190, global_cooperation: true }
            },
            { 
                id: 'cellular_breakdown_syndrome', name: 'Cellular Breakdown Syndrome', severity: 'major', scope: 'global',
                description: 'Rapid aging and cellular death acceleration',
                effects: { happiness: -52, life_expectancy: -40, workforce_stability: -50, healthcare_cost: 2100000 },
                cureRequirement: { money: 52000000, time: 400, research_points: 210, global_cooperation: true }
            },
            { 
                id: 'genetic_scrambler', name: 'Genetic Scrambler Virus', severity: 'major', scope: 'global',
                description: 'DNA corruption causing random mutations',
                effects: { happiness: -55, genetic_integrity: -60, birth_defects: 80, healthcare_cost: 2200000 },
                cureRequirement: { money: 55000000, time: 420, research_points: 220, global_cooperation: true }
            },
            { 
                id: 'organ_liquefaction', name: 'Organ Liquefaction Disease', severity: 'major', scope: 'global',
                description: 'Internal organs dissolving at cellular level',
                effects: { happiness: -60, survival_rate: -70, medical_horror: 50, healthcare_cost: 2400000 },
                cureRequirement: { money: 60000000, time: 480, research_points: 240, global_cooperation: true }
            },
            { 
                id: 'memory_plague', name: 'Global Memory Plague', severity: 'major', scope: 'global',
                description: 'Progressive amnesia erasing human knowledge',
                effects: { happiness: -47, knowledge_retention: -80, cultural_continuity: -90, healthcare_cost: 1850000 },
                cureRequirement: { money: 47000000, time: 340, research_points: 185, global_cooperation: true }
            },
            { 
                id: 'biological_reversal', name: 'Biological Reversal Syndrome', severity: 'major', scope: 'global',
                description: 'Evolution running backwards, losing human traits',
                effects: { happiness: -58, cognitive_function: -50, social_structure: -60, healthcare_cost: 2300000 },
                cureRequirement: { money: 58000000, time: 460, research_points: 230, global_cooperation: true }
            },
            { 
                id: 'synthetic_rejection', name: 'Synthetic Rejection Disorder', severity: 'major', scope: 'global',
                description: 'Bodies rejecting all artificial materials and medicines',
                effects: { happiness: -44, technology_dependence: -70, medical_treatment: -80, healthcare_cost: 1750000 },
                cureRequirement: { money: 44000000, time: 310, research_points: 175, global_cooperation: true }
            },
            { 
                id: 'sensory_cascade_failure', name: 'Sensory Cascade Failure', severity: 'major', scope: 'global',
                description: 'Progressive loss of all five senses',
                effects: { happiness: -53, communication: -90, mobility: -70, healthcare_cost: 2150000 },
                cureRequirement: { money: 53000000, time: 410, research_points: 215, global_cooperation: true }
            },
            { 
                id: 'empathy_virus', name: 'Empathy Virus', severity: 'major', scope: 'global',
                description: 'Overwhelming emotional connection causing psychic overload',
                effects: { happiness: -35, individual_identity: -40, mental_stability: -45, healthcare_cost: 1400000 },
                cureRequirement: { money: 35000000, time: 240, research_points: 140, global_cooperation: true }
            },
            { 
                id: 'time_lock_syndrome', name: 'Time Lock Syndrome', severity: 'major', scope: 'global',
                description: 'Consciousness trapped in temporal loops',
                effects: { happiness: -46, progress: -60, innovation: -50, healthcare_cost: 1800000 },
                cureRequirement: { money: 46000000, time: 330, research_points: 180, global_cooperation: true }
            },
            { 
                id: 'reality_rejection', name: 'Reality Rejection Disorder', severity: 'major', scope: 'global',
                description: 'Inability to distinguish reality from imagination',
                effects: { happiness: -41, social_function: -55, decision_making: -65, healthcare_cost: 1650000 },
                cureRequirement: { money: 41000000, time: 290, research_points: 165, global_cooperation: true }
            },
            { 
                id: 'collective_nightmare', name: 'Collective Nightmare State', severity: 'major', scope: 'global',
                description: 'Shared horrific dreams invading waking hours',
                effects: { happiness: -49, sleep_quality: -80, mental_health: -70, healthcare_cost: 1950000 },
                cureRequirement: { money: 49000000, time: 360, research_points: 195, global_cooperation: true }
            },
            { 
                id: 'species_fragmentation', name: 'Species Fragmentation Disease', severity: 'major', scope: 'global',
                description: 'Humans splitting into incompatible subspecies',
                effects: { happiness: -54, unity: -90, cooperation: -80, healthcare_cost: 2200000 },
                cureRequirement: { money: 54000000, time: 430, research_points: 220, global_cooperation: true }
            },
            { 
                id: 'existence_doubt_pandemic', name: 'Existence Doubt Pandemic', severity: 'major', scope: 'global',
                description: 'Philosophical virus questioning reality of existence',
                effects: { happiness: -43, motivation: -70, productivity: -60, healthcare_cost: 1700000 },
                cureRequirement: { money: 43000000, time: 300, research_points: 170, global_cooperation: true }
            },
            { 
                id: 'soul_fragmentation', name: 'Soul Fragmentation Syndrome', severity: 'major', scope: 'global',
                description: 'Spiritual essence dividing causing identity crisis',
                effects: { happiness: -51, personality_stability: -60, relationships: -55, healthcare_cost: 2050000 },
                cureRequirement: { money: 51000000, time: 390, research_points: 205, global_cooperation: true }
            },
            { 
                id: 'quantum_consciousness_leak', name: 'Quantum Consciousness Leak', severity: 'major', scope: 'global',
                description: 'Minds bleeding into parallel dimensions',
                effects: { happiness: -56, reality_anchoring: -70, dimensional_stability: -80, healthcare_cost: 2250000 },
                cureRequirement: { money: 56000000, time: 440, research_points: 225, global_cooperation: true }
            },
            { 
                id: 'universal_allergic_reaction', name: 'Universal Allergic Reaction', severity: 'major', scope: 'global',
                description: 'Allergic to existence itself at molecular level',
                effects: { happiness: -57, environmental_tolerance: -90, survival: -60, healthcare_cost: 2300000 },
                cureRequirement: { money: 57000000, time: 450, research_points: 230, global_cooperation: true }
            },
            { 
                id: 'cognitive_recursion_trap', name: 'Cognitive Recursion Trap', severity: 'major', scope: 'global',
                description: 'Thoughts stuck in infinite loops preventing action',
                effects: { happiness: -39, decision_paralysis: 100, productivity: -85, healthcare_cost: 1550000 },
                cureRequirement: { money: 39000000, time: 270, research_points: 155, global_cooperation: true }
            },
            { 
                id: 'existential_void_syndrome', name: 'Existential Void Syndrome', severity: 'major', scope: 'global',
                description: 'Complete loss of meaning and purpose in existence',
                effects: { happiness: -65, motivation: -95, will_to_live: -80, healthcare_cost: 2600000 },
                cureRequirement: { money: 65000000, time: 520, research_points: 260, global_cooperation: true }
            },
            { 
                id: 'meta_awareness_overload', name: 'Meta-Awareness Overload', severity: 'major', scope: 'global',
                description: 'Consciousness of being fictional causing breakdown',
                effects: { happiness: -62, narrative_coherence: -100, fourth_wall: -90, healthcare_cost: 2500000 },
                cureRequirement: { money: 62000000, time: 500, research_points: 250, global_cooperation: true }
            },
            { 
                id: 'simulation_hypothesis_madness', name: 'Simulation Hypothesis Madness', severity: 'major', scope: 'global',
                description: 'Certainty of living in computer simulation causing despair',
                effects: { happiness: -59, reality_acceptance: -85, technology_fear: 60, healthcare_cost: 2400000 },
                cureRequirement: { money: 59000000, time: 470, research_points: 235, global_cooperation: true }
            },
            { 
                id: 'temporal_paradox_sickness', name: 'Temporal Paradox Sickness', severity: 'major', scope: 'global',
                description: 'Causality loops causing physical and mental breakdown',
                effects: { happiness: -61, temporal_stability: -95, logical_consistency: -80, healthcare_cost: 2450000 },
                cureRequirement: { money: 61000000, time: 490, research_points: 245, global_cooperation: true }
            },
            { 
                id: 'universal_soul_extraction', name: 'Universal Soul Extraction Syndrome', severity: 'major', scope: 'global',
                description: 'Spiritual essence being systematically drained from all humans',
                effects: { happiness: -68, spiritual_vitality: -90, life_force: -85, healthcare_cost: 2800000 },
                cureRequirement: { money: 68000000, time: 550, research_points: 275, global_cooperation: true }
            },
            { 
                id: 'planetary_personality_purge', name: 'Planetary Personality Purge', severity: 'major', scope: 'global',
                description: 'Individual personalities being erased and homogenized',
                effects: { happiness: -66, individuality: -95, creativity: -90, healthcare_cost: 2700000 },
                cureRequirement: { money: 66000000, time: 530, research_points: 265, global_cooperation: true }
            },
            { 
                id: 'cosmic_consciousness_cancer', name: 'Cosmic Consciousness Cancer', severity: 'major', scope: 'global',
                description: 'Malignant growth in collective human awareness',
                effects: { happiness: -70, collective_intelligence: -85, hive_mind_resistance: -75, healthcare_cost: 2900000 },
                cureRequirement: { money: 70000000, time: 560, research_points: 280, global_cooperation: true }
            },
            { 
                id: 'dimensional_DNA_decay', name: 'Dimensional DNA Decay', severity: 'major', scope: 'global',
                description: 'Genetic code corrupting across multiple dimensions',
                effects: { happiness: -63, genetic_stability: -90, dimensional_integrity: -80, healthcare_cost: 2600000 },
                cureRequirement: { money: 63000000, time: 510, research_points: 255, global_cooperation: true }
            },
            { 
                id: 'universal_unraveling_syndrome', name: 'Universal Unraveling Syndrome', severity: 'major', scope: 'global',
                description: 'Reality itself beginning to decompose',
                effects: { happiness: -75, reality_cohesion: -100, existence_certainty: -95, healthcare_cost: 3200000 },
                cureRequirement: { money: 75000000, time: 600, research_points: 300, global_cooperation: true }
            },
            { 
                id: 'planetary_physics_failure', name: 'Planetary Physics Failure', severity: 'major', scope: 'global',
                description: 'Natural laws becoming unreliable worldwide',
                effects: { happiness: -67, scientific_reliability: -95, technological_function: -85, healthcare_cost: 2750000 },
                cureRequirement: { money: 67000000, time: 540, research_points: 270, global_cooperation: true }
            },
            { 
                id: 'cosmic_causality_collapse', name: 'Cosmic Causality Collapse', severity: 'major', scope: 'global',
                description: 'Cause and effect relationships breaking down',
                effects: { happiness: -64, logical_progression: -90, predictability: -95, healthcare_cost: 2650000 },
                cureRequirement: { money: 64000000, time: 520, research_points: 260, global_cooperation: true }
            },
            { 
                id: 'universal_uncertainty_plague', name: 'Universal Uncertainty Plague', severity: 'major', scope: 'global',
                description: 'Complete loss of ability to be certain about anything',
                effects: { happiness: -58, decision_confidence: -100, knowledge_trust: -90, healthcare_cost: 2400000 },
                cureRequirement: { money: 58000000, time: 470, research_points: 235, global_cooperation: true }
            },
            { 
                id: 'planetary_paradox_pandemic', name: 'Planetary Paradox Pandemic', severity: 'major', scope: 'global',
                description: 'Logical contradictions becoming physically manifest',
                effects: { happiness: -62, reasoning_ability: -85, paradox_tolerance: -95, healthcare_cost: 2550000 },
                cureRequirement: { money: 62000000, time: 500, research_points: 250, global_cooperation: true }
            },
            { 
                id: 'dimensional_death_defiance', name: 'Dimensional Death Defiance Disorder', severity: 'major', scope: 'global',
                description: 'Death becoming impossible but suffering unlimited',
                effects: { happiness: -80, mortality: -100, pain_resolution: -100, healthcare_cost: 3500000 },
                cureRequirement: { money: 80000000, time: 650, research_points: 325, global_cooperation: true }
            },
            { 
                id: 'cosmic_communication_collapse', name: 'Cosmic Communication Collapse', severity: 'major', scope: 'global',
                description: 'All forms of communication becoming corrupted',
                effects: { happiness: -55, language_integrity: -90, social_cohesion: -85, healthcare_cost: 2250000 },
                cureRequirement: { money: 55000000, time: 440, research_points: 220, global_cooperation: true }
            },
            { 
                id: 'universal_uniform_ugliness', name: 'Universal Uniform Ugliness', severity: 'major', scope: 'global',
                description: 'All aesthetic appreciation being destroyed',
                effects: { happiness: -45, beauty_perception: -100, artistic_drive: -95, healthcare_cost: 1850000 },
                cureRequirement: { money: 45000000, time: 360, research_points: 180, global_cooperation: true }
            },
            { 
                id: 'planetary_purpose_purge', name: 'Planetary Purpose Purge', severity: 'major', scope: 'global',
                description: 'Complete elimination of sense of meaning and purpose',
                effects: { happiness: -72, motivation: -100, goal_formation: -95, healthcare_cost: 3000000 },
                cureRequirement: { money: 72000000, time: 580, research_points: 290, global_cooperation: true }
            },
            { 
                id: 'dimensional_diversity_death', name: 'Dimensional Diversity Death', severity: 'major', scope: 'global',
                description: 'All variation and uniqueness being eliminated',
                effects: { happiness: -59, cultural_diversity: -100, genetic_variation: -90, healthcare_cost: 2450000 },
                cureRequirement: { money: 59000000, time: 480, research_points: 240, global_cooperation: true }
            },
            { 
                id: 'cosmic_creativity_cancer', name: 'Cosmic Creativity Cancer', severity: 'major', scope: 'global',
                description: 'Imagination and innovation being systematically destroyed',
                effects: { happiness: -56, creativity: -100, innovation: -95, healthcare_cost: 2300000 },
                cureRequirement: { money: 56000000, time: 450, research_points: 225, global_cooperation: true }
            },
            { 
                id: 'universal_uniqueness_unraveling', name: 'Universal Uniqueness Unraveling', severity: 'major', scope: 'global',
                description: 'Individual characteristics becoming identical worldwide',
                effects: { happiness: -61, individuality: -100, personal_identity: -95, healthcare_cost: 2500000 },
                cureRequirement: { money: 61000000, time: 490, research_points: 245, global_cooperation: true }
            },
            { 
                id: 'planetary_progress_paralysis', name: 'Planetary Progress Paralysis', severity: 'major', scope: 'global',
                description: 'Complete inability to advance or improve anything',
                effects: { happiness: -54, technological_progress: -100, social_advancement: -95, healthcare_cost: 2200000 },
                cureRequirement: { money: 54000000, time: 430, research_points: 215, global_cooperation: true }
            },
            { 
                id: 'dimensional_dream_death', name: 'Dimensional Dream Death', severity: 'major', scope: 'global',
                description: 'Complete loss of ability to dream or imagine',
                effects: { happiness: -57, dream_capacity: -100, subconscious_processing: -90, healthcare_cost: 2350000 },
                cureRequirement: { money: 57000000, time: 460, research_points: 230, global_cooperation: true }
            },
            { 
                id: 'cosmic_curiosity_collapse', name: 'Cosmic Curiosity Collapse', severity: 'major', scope: 'global',
                description: 'Total elimination of desire to learn or explore',
                effects: { happiness: -53, learning_drive: -100, exploration_instinct: -95, healthcare_cost: 2150000 },
                cureRequirement: { money: 53000000, time: 420, research_points: 210, global_cooperation: true }
            },
            { 
                id: 'universal_understanding_undoing', name: 'Universal Understanding Undoing', severity: 'major', scope: 'global',
                description: 'All knowledge and comprehension being erased',
                effects: { happiness: -65, knowledge_retention: -100, comprehension_ability: -95, healthcare_cost: 2700000 },
                cureRequirement: { money: 65000000, time: 530, research_points: 265, global_cooperation: true }
            },
            { 
                id: 'planetary_passion_plague', name: 'Planetary Passion Plague', severity: 'major', scope: 'global',
                description: 'Complete loss of emotional intensity and care',
                effects: { happiness: -60, emotional_intensity: -100, passion: -95, healthcare_cost: 2500000 },
                cureRequirement: { money: 60000000, time: 480, research_points: 240, global_cooperation: true }
            },
            { 
                id: 'dimensional_decision_decay', name: 'Dimensional Decision Decay', severity: 'major', scope: 'global',
                description: 'Inability to make any choices or decisions',
                effects: { happiness: -58, decision_making: -100, autonomy: -95, healthcare_cost: 2400000 },
                cureRequirement: { money: 58000000, time: 470, research_points: 235, global_cooperation: true }
            },
            { 
                id: 'cosmic_connection_collapse', name: 'Cosmic Connection Collapse', severity: 'major', scope: 'global',
                description: 'Complete breakdown of all relationships and bonds',
                effects: { happiness: -69, social_bonds: -100, empathy: -95, healthcare_cost: 2850000 },
                cureRequirement: { money: 69000000, time: 560, research_points: 280, global_cooperation: true }
            },
            { 
                id: 'universal_utility_undoing', name: 'Universal Utility Undoing', severity: 'major', scope: 'global',
                description: 'All tools and technology becoming useless',
                effects: { happiness: -52, technology_function: -100, tool_effectiveness: -95, healthcare_cost: 2100000 },
                cureRequirement: { money: 52000000, time: 410, research_points: 205, global_cooperation: true }
            },
            { 
                id: 'planetary_pleasure_purge', name: 'Planetary Pleasure Purge', severity: 'major', scope: 'global',
                description: 'Complete elimination of ability to experience joy',
                effects: { happiness: -100, joy_capacity: -100, pleasure_recognition: -100, healthcare_cost: 4000000 },
                cureRequirement: { money: 100000000, time: 800, research_points: 400, global_cooperation: true }
            },
            { 
                id: 'dimensional_drive_death', name: 'Dimensional Drive Death', severity: 'major', scope: 'global',
                description: 'Total loss of motivation and will to act',
                effects: { happiness: -63, motivation: -100, willpower: -95, healthcare_cost: 2600000 },
                cureRequirement: { money: 63000000, time: 510, research_points: 255, global_cooperation: true }
            },
            { 
                id: 'cosmic_courage_collapse', name: 'Cosmic Courage Collapse', severity: 'major', scope: 'global',
                description: 'Universal cowardice and fear of everything',
                effects: { happiness: -51, bravery: -100, risk_tolerance: -95, healthcare_cost: 2050000 },
                cureRequirement: { money: 51000000, time: 400, research_points: 200, global_cooperation: true }
            },
            { 
                id: 'universal_unity_undoing', name: 'Universal Unity Undoing', severity: 'major', scope: 'global',
                description: 'Complete breakdown of cooperation and teamwork',
                effects: { happiness: -56, cooperation: -100, team_formation: -95, healthcare_cost: 2300000 },
                cureRequirement: { money: 56000000, time: 450, research_points: 225, global_cooperation: true }
            },
            { 
                id: 'planetary_peace_plague', name: 'Planetary Peace Plague', severity: 'major', scope: 'global',
                description: 'Violent conflict becoming impossible but tension unlimited',
                effects: { happiness: -48, conflict_resolution: -100, aggression_outlet: -95, healthcare_cost: 1950000 },
                cureRequirement: { money: 48000000, time: 380, research_points: 190, global_cooperation: true }
            },
            { 
                id: 'dimensional_dignity_decay', name: 'Dimensional Dignity Decay', severity: 'major', scope: 'global',
                description: 'Complete loss of self-respect and dignity',
                effects: { happiness: -62, self_worth: -100, dignity: -95, healthcare_cost: 2550000 },
                cureRequirement: { money: 62000000, time: 500, research_points: 250, global_cooperation: true }
            },
            { 
                id: 'cosmic_compassion_collapse', name: 'Cosmic Compassion Collapse', severity: 'major', scope: 'global',
                description: 'Complete elimination of empathy and caring',
                effects: { happiness: -64, empathy: -100, compassion: -95, healthcare_cost: 2650000 },
                cureRequirement: { money: 64000000, time: 520, research_points: 260, global_cooperation: true }
            },
            { 
                id: 'universal_wonder_withering', name: 'Universal Wonder Withering', severity: 'major', scope: 'global',
                description: 'Complete loss of sense of awe and wonder',
                effects: { happiness: -49, wonder_capacity: -100, spiritual_appreciation: -90, healthcare_cost: 2000000 },
                cureRequirement: { money: 49000000, time: 390, research_points: 195, global_cooperation: true }
            },
            { 
                id: 'planetary_patience_plague', name: 'Planetary Patience Plague', severity: 'major', scope: 'global',
                description: 'Complete inability to wait or be patient',
                effects: { happiness: -46, patience: -100, delayed_gratification: -95, healthcare_cost: 1900000 },
                cureRequirement: { money: 46000000, time: 370, research_points: 185, global_cooperation: true }
            },
            { 
                id: 'dimensional_discipline_decay', name: 'Dimensional Discipline Decay', severity: 'major', scope: 'global',
                description: 'Complete loss of self-control and discipline',
                effects: { happiness: -54, self_control: -100, discipline: -95, healthcare_cost: 2200000 },
                cureRequirement: { money: 54000000, time: 430, research_points: 215, global_cooperation: true }
            },
            { 
                id: 'cosmic_confidence_collapse', name: 'Cosmic Confidence Collapse', severity: 'major', scope: 'global',
                description: 'Universal self-doubt and lack of confidence',
                effects: { happiness: -58, confidence: -100, self_belief: -95, healthcare_cost: 2400000 },
                cureRequirement: { money: 58000000, time: 470, research_points: 235, global_cooperation: true }
            },
            { 
                id: 'universal_urgency_undoing', name: 'Universal Urgency Undoing', severity: 'major', scope: 'global',
                description: 'Complete loss of sense of importance or urgency',
                effects: { happiness: -47, urgency_sense: -100, priority_setting: -95, healthcare_cost: 1950000 },
                cureRequirement: { money: 47000000, time: 380, research_points: 190, global_cooperation: true }
            },
            { 
                id: 'planetary_perseverance_purge', name: 'Planetary Perseverance Purge', severity: 'major', scope: 'global',
                description: 'Complete inability to persist through difficulties',
                effects: { happiness: -55, perseverance: -100, resilience: -95, healthcare_cost: 2250000 },
                cureRequirement: { money: 55000000, time: 440, research_points: 220, global_cooperation: true }
            },
            { 
                id: 'dimensional_determination_death', name: 'Dimensional Determination Death', severity: 'major', scope: 'global',
                description: 'Total loss of determination and resolve',
                effects: { happiness: -59, determination: -100, resolve: -95, healthcare_cost: 2450000 },
                cureRequirement: { money: 59000000, time: 480, research_points: 240, global_cooperation: true }
            },
            { 
                id: 'cosmic_clarity_collapse', name: 'Cosmic Clarity Collapse', severity: 'major', scope: 'global',
                description: 'Complete loss of mental clarity and focus',
                effects: { happiness: -53, mental_clarity: -100, focus_ability: -95, healthcare_cost: 2150000 },
                cureRequirement: { money: 53000000, time: 420, research_points: 210, global_cooperation: true }
            },
            { 
                id: 'universal_vision_void', name: 'Universal Vision Void', severity: 'major', scope: 'global',
                description: 'Complete loss of ability to envision the future',
                effects: { happiness: -57, future_planning: -100, vision_capacity: -95, healthcare_cost: 2350000 },
                cureRequirement: { money: 57000000, time: 460, research_points: 230, global_cooperation: true }
            },
            { 
                id: 'planetary_priority_plague', name: 'Planetary Priority Plague', severity: 'major', scope: 'global',
                description: 'Complete inability to prioritize or organize',
                effects: { happiness: -50, organization: -100, priority_management: -95, healthcare_cost: 2050000 },
                cureRequirement: { money: 50000000, time: 400, research_points: 200, global_cooperation: true }
            },
            { 
                id: 'dimensional_duty_death', name: 'Dimensional Duty Death', severity: 'major', scope: 'global',
                description: 'Complete loss of sense of responsibility and duty',
                effects: { happiness: -52, responsibility: -100, duty_sense: -95, healthcare_cost: 2100000 },
                cureRequirement: { money: 52000000, time: 410, research_points: 205, global_cooperation: true }
            },
            { 
                id: 'cosmic_commitment_collapse', name: 'Cosmic Commitment Collapse', severity: 'major', scope: 'global',
                description: 'Complete inability to make or keep commitments',
                effects: { happiness: -56, commitment_ability: -100, promise_keeping: -95, healthcare_cost: 2300000 },
                cureRequirement: { money: 56000000, time: 450, research_points: 225, global_cooperation: true }
            },
            { 
                id: 'universal_integrity_undoing', name: 'Universal Integrity Undoing', severity: 'major', scope: 'global',
                description: 'Complete loss of moral integrity and honesty',
                effects: { happiness: -61, integrity: -100, honesty: -95, healthcare_cost: 2500000 },
                cureRequirement: { money: 61000000, time: 490, research_points: 245, global_cooperation: true }
            },
            { 
                id: 'planetary_potential_purge', name: 'Planetary Potential Purge', severity: 'major', scope: 'global',
                description: 'Complete elimination of human potential and growth',
                effects: { happiness: -65, potential_realization: -100, growth_capacity: -95, healthcare_cost: 2700000 },
                cureRequirement: { money: 65000000, time: 530, research_points: 265, global_cooperation: true }
            },
            { 
                id: 'dimensional_devotion_decay', name: 'Dimensional Devotion Decay', severity: 'major', scope: 'global',
                description: 'Complete loss of ability to devote oneself to anything',
                effects: { happiness: -54, devotion_capacity: -100, loyalty: -95, healthcare_cost: 2200000 },
                cureRequirement: { money: 54000000, time: 430, research_points: 215, global_cooperation: true }
            },
            { 
                id: 'cosmic_character_collapse', name: 'Cosmic Character Collapse', severity: 'major', scope: 'global',
                description: 'Complete breakdown of moral character and virtue',
                effects: { happiness: -63, moral_character: -100, virtue: -95, healthcare_cost: 2600000 },
                cureRequirement: { money: 63000000, time: 510, research_points: 255, global_cooperation: true }
            },
            { 
                id: 'universal_valor_void', name: 'Universal Valor Void', severity: 'major', scope: 'global',
                description: 'Complete elimination of courage and heroism',
                effects: { happiness: -48, valor: -100, heroism: -95, healthcare_cost: 1950000 },
                cureRequirement: { money: 48000000, time: 380, research_points: 190, global_cooperation: true }
            },
            { 
                id: 'planetary_purpose_paralysis', name: 'Planetary Purpose Paralysis', severity: 'major', scope: 'global',
                description: 'Complete inability to find or create meaning',
                effects: { happiness: -67, purpose_creation: -100, meaning_finding: -95, healthcare_cost: 2750000 },
                cureRequirement: { money: 67000000, time: 540, research_points: 270, global_cooperation: true }
            },
            { 
                id: 'dimensional_dream_destroyer', name: 'Dimensional Dream Destroyer', severity: 'major', scope: 'global',
                description: 'Complete elimination of hopes and dreams',
                effects: { happiness: -71, hope: -100, dream_formation: -95, healthcare_cost: 2950000 },
                cureRequirement: { money: 71000000, time: 570, research_points: 285, global_cooperation: true }
            },
            { 
                id: 'cosmic_creation_collapse', name: 'Cosmic Creation Collapse', severity: 'major', scope: 'global',
                description: 'Complete inability to create or build anything new',
                effects: { happiness: -60, creativity: -100, construction_ability: -95, healthcare_cost: 2500000 },
                cureRequirement: { money: 60000000, time: 480, research_points: 240, global_cooperation: true }
            },
            { 
                id: 'universal_understanding_undoing_final', name: 'Final Universal Understanding Undoing', severity: 'major', scope: 'global',
                description: 'The ultimate erasure of all comprehension and knowledge',
                effects: { happiness: -75, all_understanding: -100, consciousness: -90, healthcare_cost: 3200000 },
                cureRequirement: { money: 75000000, time: 600, research_points: 300, global_cooperation: true }
            }
        ]
    };
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.GLOBAL_DISEASES;
}
