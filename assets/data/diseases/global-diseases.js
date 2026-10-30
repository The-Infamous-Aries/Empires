if (typeof window !== 'undefined') {
    window.GLOBAL_DISEASES = {
        minor: [
            { 
                id: 'global_shimmer_syndrome', name: 'Global Shimmer Syndrome', severity: 'minor', scope: 'global',
                description: 'Worldwide visual disturbance affecting depth perception',
                effects: { crime: 3, environment: -2 },
                cureRequirement: { money: 5000000, time: 72, research_points: 25, global_cooperation: true }
            },
            { 
                id: 'aurora_ailment', name: 'Aurora Ailment', severity: 'minor', scope: 'global',
                description: 'Light-sensitive condition affecting circadian rhythms',
                effects: { taxable_income: -8, hospital_upkeep: 3 },
                cureRequirement: { money: 4000000, time: 60, research_points: 20, global_cooperation: true }
            },
            { 
                id: 'resonance_disorder', name: 'Resonance Disorder', severity: 'minor', scope: 'global',
                description: 'Sound sensitivity causing disorientation',
                effects: { disease: 6, environment: -3 },
                cureRequirement: { money: 4500000, time: 65, research_points: 22, global_cooperation: true }
            },
            { 
                id: 'chromatic_confusion', name: 'Chromatic Confusion', severity: 'minor', scope: 'global',
                description: 'Color perception disorder affecting daily tasks',
                effects: { military_morale: -3, military_strength: -1 },
                cureRequirement: { money: 3800000, time: 55, research_points: 18, global_cooperation: true }
            },
            { 
                id: 'temporal_tremors', name: 'Temporal Tremors', severity: 'minor', scope: 'global',
                description: 'Time perception disorder causing scheduling issues',
                effects: { crime: 5, hospital_upkeep: 7 },
                cureRequirement: { money: 5500000, time: 75, research_points: 28, global_cooperation: true }
            },
            { 
                id: 'magnetic_malaise', name: 'Magnetic Malaise', severity: 'minor', scope: 'global',
                description: 'Electromagnetic sensitivity affecting navigation',
                effects: { hospital_upkeep: 3, crime: 6 },
                cureRequirement: { money: 4200000, time: 62, research_points: 21, global_cooperation: true }
            },
            { 
                id: 'gravity_gastritis', name: 'Gravity Gastritis', severity: 'minor', scope: 'global',
                description: 'Digestive issues related to gravitational sensitivity',
                effects: { disease: 2, population: -8 },
                cureRequirement: { money: 4800000, time: 68, research_points: 24, global_cooperation: true }
            },
            { 
                id: 'quantum_queasiness', name: 'Quantum Queasiness', severity: 'minor', scope: 'global',
                description: 'Nausea caused by quantum field fluctuations',
                effects: { taxable_income: -7, population: -7 },
                cureRequirement: { money: 4600000, time: 66, research_points: 23, global_cooperation: true }
            },
            { 
                id: 'neural_static', name: 'Neural Static', severity: 'minor', scope: 'global',
                description: 'Mental interference from electromagnetic fields',
                effects: { taxable_income: -7, crime: 7 },
                cureRequirement: { money: 6000000, time: 80, research_points: 30, global_cooperation: true }
            },
            { 
                id: 'phase_shift_syndrome', name: 'Phase Shift Syndrome', severity: 'minor', scope: 'global',
                description: 'Dimensional instability affecting molecular cohesion',
                effects: { military_morale: -7, population: -7 },
                cureRequirement: { money: 4900000, time: 70, research_points: 26, global_cooperation: true }
            },
            { 
                id: 'echo_memory_disorder', name: 'Echo Memory Disorder', severity: 'minor', scope: 'global',
                description: 'False memories spreading through collective consciousness',
                effects: { taxable_income: -2, environment: -2 },
                cureRequirement: { money: 5200000, time: 73, research_points: 27, global_cooperation: true }
            },
            { 
                id: 'crystalline_growth', name: 'Crystalline Growth Disorder', severity: 'minor', scope: 'global',
                description: 'Mineral deposits forming in biological tissue',
                effects: { population: -4, happiness: -1 },
                cureRequirement: { money: 4600000, time: 67, research_points: 24, global_cooperation: true }
            },
            { 
                id: 'light_sensitivity_plague', name: 'Global Light Sensitivity', severity: 'minor', scope: 'global',
                description: 'Worldwide photophobia affecting daily activities',
                effects: { happiness: -7, environment: -7 },
                cureRequirement: { money: 4000000, time: 58, research_points: 19, global_cooperation: true }
            },
            { 
                id: 'atmospheric_pressure_syndrome', name: 'Atmospheric Pressure Syndrome', severity: 'minor', scope: 'global',
                description: 'Altitude sickness affecting all elevations',
                effects: { disease: 5, population: -8 },
                cureRequirement: { money: 4700000, time: 69, research_points: 25, global_cooperation: true }
            },
            { 
                id: 'bio_rhythm_disruption', name: 'Bio-Rhythm Disruption', severity: 'minor', scope: 'global',
                description: 'Circadian cycle chaos affecting sleep patterns',
                effects: { crime: 6, environment: -4 },
                cureRequirement: { money: 5400000, time: 76, research_points: 28, global_cooperation: true }
            },
            { 
                id: 'molecular_drift', name: 'Molecular Drift Syndrome', severity: 'minor', scope: 'global',
                description: 'Cellular structure instability causing random mutations',
                effects: { disease: 6, crime: 4 },
                cureRequirement: { money: 5800000, time: 82, research_points: 31, global_cooperation: true }
            },
            { 
                id: 'psychic_interference', name: 'Psychic Interference Disorder', severity: 'minor', scope: 'global',
                description: 'Mental static disrupting cognitive functions',
                effects: { environment: -5, taxable_income: -5 },
                cureRequirement: { money: 4400000, time: 64, research_points: 22, global_cooperation: true }
            },
            { 
                id: 'energy_drain_malaise', name: 'Global Energy Drain', severity: 'minor', scope: 'global',
                description: 'Unexplained fatigue affecting worldwide population',
                effects: { population: -4, military_morale: -1 },
                cureRequirement: { money: 5000000, time: 71, research_points: 26, global_cooperation: true }
            },
            { 
                id: 'texture_blindness', name: 'Texture Blindness', severity: 'minor', scope: 'global',
                description: 'Loss of tactile sensation affecting fine motor skills',
                effects: { military_morale: -5, population: -7 },
                cureRequirement: { money: 4200000, time: 61, research_points: 21, global_cooperation: true }
            },
            { 
                id: 'frequency_sickness', name: 'Frequency Sickness', severity: 'minor', scope: 'global',
                description: 'Sensitivity to specific sound frequencies',
                effects: { taxable_income: -4, environment: -8 },
                cureRequirement: { money: 4500000, time: 66, research_points: 23, global_cooperation: true }
            },
            { 
                id: 'phantom_taste_syndrome', name: 'Phantom Taste Syndrome', severity: 'minor', scope: 'global',
                description: 'Persistent false tastes disrupting nutrition',
                effects: { taxable_income: -1, environment: -3 },
                cureRequirement: { money: 3900000, time: 56, research_points: 18, global_cooperation: true }
            },
            { 
                id: 'micro_sleep_disorder', name: 'Micro-Sleep Disorder', severity: 'minor', scope: 'global',
                description: 'Involuntary brief sleep episodes during waking hours',
                effects: { environment: -1, population: -8 },
                cureRequirement: { money: 5600000, time: 78, research_points: 29, global_cooperation: true }
            },
            { 
                id: 'collective_tinnitus', name: 'Collective Tinnitus', severity: 'minor', scope: 'global',
                description: 'Worldwide phantom ringing in ears',
                effects: { taxable_income: -5, happiness: -7 },
                cureRequirement: { money: 4100000, time: 59, research_points: 20, global_cooperation: true }
            },
            { 
                id: 'depth_perception_loss', name: 'Depth Perception Loss', severity: 'minor', scope: 'global',
                description: 'Global inability to judge distances accurately',
                effects: { military_morale: -8, military_strength: -7 },
                cureRequirement: { money: 4800000, time: 68, research_points: 25, global_cooperation: true }
            },
            { 
                id: 'emotional_numbness', name: 'Global Emotional Numbness', severity: 'minor', scope: 'global',
                description: 'Worldwide reduction in emotional responsiveness',
                effects: { population: -4, happiness: -3 },
                cureRequirement: { money: 6200000, time: 85, research_points: 32, global_cooperation: true }
            },
            { 
                id: 'false_hunger', name: 'False Hunger Syndrome', severity: 'minor', scope: 'global',
                description: 'Phantom appetite causing overconsumption',
                effects: { crime: 7, population: -7 },
                cureRequirement: { money: 3700000, time: 54, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'motion_sickness_pandemic', name: 'Universal Motion Sickness', severity: 'minor', scope: 'global',
                description: 'Extreme sensitivity to all forms of movement',
                effects: { happiness: -8, taxable_income: -1 },
                cureRequirement: { money: 4300000, time: 63, research_points: 22, global_cooperation: true }
            },
            { 
                id: 'spatial_confusion', name: 'Spatial Confusion Disorder', severity: 'minor', scope: 'global',
                description: 'Difficulty with left-right and directional orientation',
                effects: { taxable_income: -2, military_strength: -7 },
                cureRequirement: { money: 4200000, time: 60, research_points: 21, global_cooperation: true }
            },
            { 
                id: 'color_shift_syndrome', name: 'Color Shift Syndrome', severity: 'minor', scope: 'global',
                description: 'Colors appear differently to each individual',
                effects: { environment: -8, hospital_upkeep: 8 },
                cureRequirement: { money: 4900000, time: 70, research_points: 26, global_cooperation: true }
            },
            { 
                id: 'texture_hypersensitivity', name: 'Texture Hypersensitivity', severity: 'minor', scope: 'global',
                description: 'Overwhelming tactile responses to normal materials',
                effects: { happiness: -7, taxable_income: -1 },
                cureRequirement: { money: 5300000, time: 74, research_points: 27, global_cooperation: true }
            },
            { 
                id: 'phantom_wind_syndrome', name: 'Phantom Wind Syndrome', severity: 'minor', scope: 'global',
                description: 'Sensation of constant wind when air is still',
                effects: { happiness: -7, disease: 3 },
                cureRequirement: { money: 3600000, time: 52, research_points: 16, global_cooperation: true }
            },
            { 
                id: 'temperature_confusion', name: 'Temperature Confusion', severity: 'minor', scope: 'global',
                description: 'Inability to accurately perceive hot and cold',
                effects: { happiness: -6, environment: -7 },
                cureRequirement: { money: 4500000, time: 65, research_points: 23, global_cooperation: true }
            },
            { 
                id: 'universal_vertigo', name: 'Universal Vertigo', severity: 'minor', scope: 'global',
                description: 'Worldwide dizziness affecting balance',
                effects: { crime: 3, hospital_upkeep: 8 },
                cureRequirement: { money: 5100000, time: 72, research_points: 26, global_cooperation: true }
            },
            { 
                id: 'global_giggle_syndrome', name: 'Global Giggle Syndrome', severity: 'minor', scope: 'global',
                description: 'Uncontrollable laughter spreading worldwide',
                effects: { military_strength: -5, happiness: -3 },
                cureRequirement: { money: 3500000, time: 50, research_points: 15, global_cooperation: true }
            },
            { 
                id: 'planetary_phantom_itch', name: 'Planetary Phantom Itch', severity: 'minor', scope: 'global',
                description: 'Worldwide sensation of itching with no cause',
                effects: { population: -7, disease: 8 },
                cureRequirement: { money: 3800000, time: 55, research_points: 18, global_cooperation: true }
            },
            { 
                id: 'universal_unblinking', name: 'Universal Unblinking Disorder', severity: 'minor', scope: 'global',
                description: 'Global inability to blink normally',
                effects: { hospital_upkeep: 2, military_strength: -8 },
                cureRequirement: { money: 4100000, time: 58, research_points: 20, global_cooperation: true }
            },
            { 
                id: 'cosmic_hiccup_epidemic', name: 'Cosmic Hiccup Epidemic', severity: 'minor', scope: 'global',
                description: 'Synchronized hiccupping across all humans',
                effects: { population: -3, taxable_income: -1 },
                cureRequirement: { money: 3200000, time: 45, research_points: 12, global_cooperation: true }
            },
            { 
                id: 'global_goosebump_syndrome', name: 'Global Goosebump Syndrome', severity: 'minor', scope: 'global',
                description: 'Permanent goosebumps on all human skin',
                effects: { crime: 2, environment: -1 },
                cureRequirement: { money: 3700000, time: 53, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'worldwide_wandering_eyes', name: 'Worldwide Wandering Eyes', severity: 'minor', scope: 'global',
                description: 'Eyes moving independently of conscious control',
                effects: { taxable_income: -4, environment: -8 },
                cureRequirement: { money: 4600000, time: 65, research_points: 23, global_cooperation: true }
            },
            { 
                id: 'planetary_paper_cuts', name: 'Planetary Paper Cuts Syndrome', severity: 'minor', scope: 'global',
                description: 'Microscopic cuts appearing without cause',
                effects: { taxable_income: -2, hospital_upkeep: 5 },
                cureRequirement: { money: 3400000, time: 48, research_points: 14, global_cooperation: true }
            },
            { 
                id: 'universal_shoe_discomfort', name: 'Universal Shoe Discomfort', severity: 'minor', scope: 'global',
                description: 'All footwear becoming uncomfortable globally',
                effects: { happiness: -2, environment: -3 },
                cureRequirement: { money: 4000000, time: 57, research_points: 19, global_cooperation: true }
            },
            { 
                id: 'global_gravity_sensitivity', name: 'Global Gravity Sensitivity', severity: 'minor', scope: 'global',
                description: 'Heightened awareness of gravitational changes',
                effects: { happiness: -1, taxable_income: -2 },
                cureRequirement: { money: 4300000, time: 61, research_points: 21, global_cooperation: true }
            },
            { 
                id: 'worldwide_word_mixing', name: 'Worldwide Word Mixing', severity: 'minor', scope: 'global',
                description: 'Random word order changes in speech',
                effects: { happiness: -8, military_strength: -6 },
                cureRequirement: { money: 3750000, time: 54, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'cosmic_coordination_chaos', name: 'Cosmic Coordination Chaos', severity: 'minor', scope: 'global',
                description: 'Slight loss of fine motor coordination worldwide',
                effects: { disease: 7, hospital_upkeep: 2 },
                cureRequirement: { money: 3900000, time: 56, research_points: 18, global_cooperation: true }
            },
            { 
                id: 'planetary_phantom_smells', name: 'Planetary Phantom Smells', severity: 'minor', scope: 'global',
                description: 'False odors detected by everyone simultaneously',
                effects: { disease: 8, population: -5 },
                cureRequirement: { money: 3450000, time: 49, research_points: 15, global_cooperation: true }
            },
            { 
                id: 'universal_uneven_breathing', name: 'Universal Uneven Breathing', severity: 'minor', scope: 'global',
                description: 'Slightly irregular breathing patterns globally',
                effects: { environment: -3, military_strength: -2 },
                cureRequirement: { money: 3650000, time: 52, research_points: 16, global_cooperation: true }
            },
            { 
                id: 'global_ghost_touches', name: 'Global Ghost Touches', severity: 'minor', scope: 'global',
                description: 'Feeling phantom touches on skin worldwide',
                effects: { taxable_income: -3, population: -1 },
                cureRequirement: { money: 4200000, time: 59, research_points: 20, global_cooperation: true }
            },
            { 
                id: 'worldwide_weight_wobbles', name: 'Worldwide Weight Wobbles', severity: 'minor', scope: 'global',
                description: 'Fluctuating sense of body weight globally',
                effects: { taxable_income: -2, disease: 3 },
                cureRequirement: { money: 3800000, time: 54, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'cosmic_color_confusion', name: 'Cosmic Color Confusion', severity: 'minor', scope: 'global',
                description: 'Slight color perception shifts worldwide',
                effects: { taxable_income: -6, hospital_upkeep: 6 },
                cureRequirement: { money: 3300000, time: 47, research_points: 13, global_cooperation: true }
            },
            { 
                id: 'planetary_pins_and_needles', name: 'Planetary Pins and Needles', severity: 'minor', scope: 'global',
                description: 'Mild tingling sensations affecting everyone',
                effects: { happiness: -2, population: -8 },
                cureRequirement: { money: 3700000, time: 53, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'universal_unsteady_stairs', name: 'Universal Unsteady Stairs Syndrome', severity: 'minor', scope: 'global',
                description: 'Difficulty with stair navigation worldwide',
                effects: { happiness: -5, military_strength: -3 },
                cureRequirement: { money: 4050000, time: 58, research_points: 19, global_cooperation: true }
            },
            { 
                id: 'global_guilty_giggles', name: 'Global Guilty Giggles', severity: 'minor', scope: 'global',
                description: 'Inappropriate laughter in serious situations',
                effects: { happiness: -4, environment: -1 },
                cureRequirement: { money: 3100000, time: 44, research_points: 12, global_cooperation: true }
            },
            { 
                id: 'worldwide_wandering_attention', name: 'Worldwide Wandering Attention', severity: 'minor', scope: 'global',
                description: 'Slightly reduced attention spans globally',
                effects: { happiness: -7, crime: 5 },
                cureRequirement: { money: 4400000, time: 62, research_points: 22, global_cooperation: true }
            },
            { 
                id: 'cosmic_counting_confusion', name: 'Cosmic Counting Confusion', severity: 'minor', scope: 'global',
                description: 'Minor mathematical processing difficulties',
                effects: { happiness: -4, environment: -2 },
                cureRequirement: { money: 3750000, time: 53, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'planetary_phantom_fullness', name: 'Planetary Phantom Fullness', severity: 'minor', scope: 'global',
                description: 'False sensation of being full after small meals',
                effects: { disease: 7, crime: 1 },
                cureRequirement: { money: 3500000, time: 50, research_points: 15, global_cooperation: true }
            },
            { 
                id: 'universal_upside_down_text', name: 'Universal Upside Down Text Syndrome', severity: 'minor', scope: 'global',
                description: 'Text occasionally appearing inverted to everyone',
                effects: { happiness: -3, environment: -6 },
                cureRequirement: { money: 4000000, time: 57, research_points: 19, global_cooperation: true }
            },
            { 
                id: 'global_gravity_giggles', name: 'Global Gravity Giggles', severity: 'minor', scope: 'global',
                description: 'Laughter when experiencing gravity changes',
                effects: { population: -5, disease: 5 },
                cureRequirement: { money: 2950000, time: 42, research_points: 11, global_cooperation: true }
            },
            { 
                id: 'worldwide_whistle_weakness', name: 'Worldwide Whistle Weakness', severity: 'minor', scope: 'global',
                description: 'Inability to whistle properly affecting everyone',
                effects: { taxable_income: -7, environment: -1 },
                cureRequirement: { money: 3200000, time: 46, research_points: 13, global_cooperation: true }
            },
            { 
                id: 'cosmic_clothes_clinginess', name: 'Cosmic Clothes Clinginess', severity: 'minor', scope: 'global',
                description: 'Fabric adhering uncomfortably to skin worldwide',
                effects: { disease: 7, happiness: -2 },
                cureRequirement: { money: 3650000, time: 52, research_points: 16, global_cooperation: true }
            },
            { 
                id: 'planetary_phantom_phone_vibrations', name: 'Planetary Phantom Phone Vibrations', severity: 'minor', scope: 'global',
                description: 'False sensation of device notifications',
                effects: { population: -1, happiness: -6 },
                cureRequirement: { money: 3900000, time: 55, research_points: 18, global_cooperation: true }
            },
            { 
                id: 'universal_uncomfortable_chairs', name: 'Universal Uncomfortable Chairs', severity: 'minor', scope: 'global',
                description: 'All seating becoming uncomfortable globally',
                effects: { disease: 6, crime: 5 },
                cureRequirement: { money: 4350000, time: 61, research_points: 21, global_cooperation: true }
            },
            { 
                id: 'global_gum_stickiness', name: 'Global Gum Stickiness Syndrome', severity: 'minor', scope: 'global',
                description: 'All chewing gum becoming excessively sticky',
                effects: { population: -3, taxable_income: -8 },
                cureRequirement: { money: 2850000, time: 41, research_points: 10, global_cooperation: true }
            },
            { 
                id: 'worldwide_window_fog', name: 'Worldwide Window Fog Syndrome', severity: 'minor', scope: 'global',
                description: 'All glass surfaces fogging unexpectedly',
                effects: { taxable_income: -2, military_morale: -6 },
                cureRequirement: { money: 3300000, time: 47, research_points: 13, global_cooperation: true }
            },
            { 
                id: 'cosmic_corner_confusion', name: 'Cosmic Corner Confusion', severity: 'minor', scope: 'global',
                description: 'Difficulty judging angles and corners globally',
                effects: { happiness: -6, population: -5 },
                cureRequirement: { money: 3700000, time: 53, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'planetary_phantom_stairs', name: 'Planetary Phantom Stairs', severity: 'minor', scope: 'global',
                description: 'Feeling steps that do not exist',
                effects: { military_strength: -5, disease: 6 },
                cureRequirement: { money: 3800000, time: 54, research_points: 18, global_cooperation: true }
            },
            { 
                id: 'universal_unmatched_socks', name: 'Universal Unmatched Socks Syndrome', severity: 'minor', scope: 'global',
                description: 'All sock pairs becoming visually mismatched',
                effects: { military_morale: -2, happiness: -6 },
                cureRequirement: { money: 2950000, time: 42, research_points: 11, global_cooperation: true }
            },
            { 
                id: 'global_ghost_music', name: 'Global Ghost Music Syndrome', severity: 'minor', scope: 'global',
                description: 'Hearing faint phantom melodies worldwide',
                effects: { crime: 2, hospital_upkeep: 8 },
                cureRequirement: { money: 3450000, time: 49, research_points: 15, global_cooperation: true }
            },
            { 
                id: 'worldwide_wobbly_writing', name: 'Worldwide Wobbly Writing', severity: 'minor', scope: 'global',
                description: 'Handwriting becoming slightly unsteady globally',
                effects: { military_morale: -2, crime: 7 },
                cureRequirement: { money: 3650000, time: 52, research_points: 16, global_cooperation: true }
            },
            { 
                id: 'cosmic_color_bleeding', name: 'Cosmic Color Bleeding', severity: 'minor', scope: 'global',
                description: 'Colors slightly bleeding into adjacent areas',
                effects: { environment: -8, disease: 2 },
                cureRequirement: { money: 4050000, time: 58, research_points: 19, global_cooperation: true }
            },
            { 
                id: 'planetary_phantom_pockets', name: 'Planetary Phantom Pockets', severity: 'minor', scope: 'global',
                description: 'Feeling pockets in clothing where none exist',
                effects: { hospital_upkeep: 8, happiness: -8 },
                cureRequirement: { money: 3200000, time: 46, research_points: 13, global_cooperation: true }
            },
            { 
                id: 'universal_uneven_floors', name: 'Universal Uneven Floors Syndrome', severity: 'minor', scope: 'global',
                description: 'Perception of floor surfaces being slightly uneven',
                effects: { disease: 1, taxable_income: -8 },
                cureRequirement: { money: 4200000, time: 59, research_points: 20, global_cooperation: true }
            },
            { 
                id: 'global_gravity_hiccups', name: 'Global Gravity Hiccups', severity: 'minor', scope: 'global',
                description: 'Brief moments of feeling weightless randomly',
                effects: { happiness: -8, population: -7 },
                cureRequirement: { money: 3900000, time: 55, research_points: 18, global_cooperation: true }
            },
            { 
                id: 'worldwide_whisper_echoes', name: 'Worldwide Whisper Echoes', severity: 'minor', scope: 'global',
                description: 'All whispers creating slight echo effects',
                effects: { military_morale: -5, military_strength: -6 },
                cureRequirement: { money: 3100000, time: 44, research_points: 12, global_cooperation: true }
            },
            { 
                id: 'cosmic_compass_confusion', name: 'Cosmic Compass Confusion', severity: 'minor', scope: 'global',
                description: 'Magnetic compasses showing slight deviations',
                effects: { taxable_income: -3, environment: -7 },
                cureRequirement: { money: 3750000, time: 53, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'planetary_phantom_buttons', name: 'Planetary Phantom Buttons', severity: 'minor', scope: 'global',
                description: 'Feeling buttons on clothing where none exist',
                effects: { happiness: -7, disease: 5 },
                cureRequirement: { money: 3300000, time: 47, research_points: 13, global_cooperation: true }
            },
            { 
                id: 'universal_unsteady_tables', name: 'Universal Unsteady Tables', severity: 'minor', scope: 'global',
                description: 'All tables feeling slightly unstable',
                effects: { taxable_income: -3, disease: 2 },
                cureRequirement: { money: 4000000, time: 57, research_points: 19, global_cooperation: true }
            },
            { 
                id: 'global_ghost_winds', name: 'Global Ghost Winds Syndrome', severity: 'minor', scope: 'global',
                description: 'Feeling phantom breezes in still air',
                effects: { military_strength: -3, crime: 3 },
                cureRequirement: { money: 3500000, time: 50, research_points: 15, global_cooperation: true }
            },
            { 
                id: 'worldwide_wobbly_wheels', name: 'Worldwide Wobbly Wheels', severity: 'minor', scope: 'global',
                description: 'Sensation of wheels wobbling on all vehicles',
                effects: { disease: 4, crime: 2 },
                cureRequirement: { money: 4400000, time: 62, research_points: 22, global_cooperation: true }
            },
            { 
                id: 'cosmic_calendar_confusion', name: 'Cosmic Calendar Confusion', severity: 'minor', scope: 'global',
                description: 'Slight uncertainty about current date',
                effects: { crime: 8, environment: -8 },
                cureRequirement: { money: 3700000, time: 53, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'planetary_phantom_drafts', name: 'Planetary Phantom Drafts', severity: 'minor', scope: 'global',
                description: 'Feeling cold drafts in warm, sealed spaces',
                effects: { population: -5, disease: 7 },
                cureRequirement: { money: 3900000, time: 55, research_points: 18, global_cooperation: true }
            },
            { 
                id: 'universal_uneven_lighting', name: 'Universal Uneven Lighting Syndrome', severity: 'minor', scope: 'global',
                description: 'Perception of lighting being slightly off everywhere',
                effects: { happiness: -1, disease: 4 },
                cureRequirement: { money: 3750000, time: 53, research_points: 17, global_cooperation: true }
            },
            { 
                id: 'global_gravity_delays', name: 'Global Gravity Delays', severity: 'minor', scope: 'global',
                description: 'Slight delay in gravitational effects on dropped objects',
                effects: { happiness: -5, crime: 2 },
                cureRequirement: { money: 3450000, time: 49, research_points: 15, global_cooperation: true }
            },
            { 
                id: 'worldwide_water_weirdness', name: 'Worldwide Water Weirdness', severity: 'minor', scope: 'global',
                description: 'All water tasting slightly different than expected',
                effects: { disease: 8, population: -8 },
                cureRequirement: { money: 3300000, time: 47, research_points: 13, global_cooperation: true }
            }
        ],
        major: [
            { 
                id: 'world_ender_virus', name: 'World Ender Virus', severity: 'major', scope: 'global',
                description: 'Catastrophic pathogen threatening civilization',
                effects: { happiness: -10, environment: -16, hospital_upkeep: 17, population: -17, crime: 14 },
                cureRequirement: { money: 50000000, time: 365, research_points: 200, global_cooperation: true }
            },
            { 
                id: 'civilization_collapse_syndrome', name: 'Civilization Collapse Syndrome', severity: 'major', scope: 'global',
                description: 'Systemic failure disease affecting all infrastructure',
                effects: { happiness: -23, disease: 16, hospital_upkeep: 19, environment: -23, military_strength: -18 },
                cureRequirement: { money: 45000000, time: 320, research_points: 180, global_cooperation: true }
            },
            { 
                id: 'planetary_plague', name: 'Planetary Plague', severity: 'major', scope: 'global',
                description: 'Ecosystem-wide pathogen affecting all life forms',
                effects: { happiness: -20, environment: -10, crime: 21, disease: 24, military_morale: -15 },
                cureRequirement: { money: 55000000, time: 400, research_points: 220, global_cooperation: true }
            },
            { 
                id: 'reality_rupture_disease', name: 'Reality Rupture Disease', severity: 'major', scope: 'global',
                description: 'Quantum-level disease affecting spacetime stability',
                effects: { happiness: -21, environment: -11, population: -18, hospital_upkeep: 14, military_morale: -21 },
                cureRequirement: { money: 60000000, time: 450, research_points: 250, global_cooperation: true }
            },
            { 
                id: 'consciousness_virus', name: 'Consciousness Virus', severity: 'major', scope: 'global',
                description: 'Memetic pathogen affecting collective intelligence',
                effects: { disease: 18, military_morale: -24, population: -19, happiness: -17, environment: -14 },
                cureRequirement: { money: 40000000, time: 280, research_points: 160, global_cooperation: true }
            },
            { 
                id: 'dimensional_decay', name: 'Dimensional Decay', severity: 'major', scope: 'global',
                description: 'Multidimensional infection causing reality breakdown',
                effects: { population: -11, disease: 17, taxable_income: -18, happiness: -25, hospital_upkeep: 17 },
                cureRequirement: { money: 70000000, time: 500, research_points: 280, global_cooperation: true }
            },
            { 
                id: 'entropy_epidemic', name: 'Entropy Epidemic', severity: 'major', scope: 'global',
                description: 'Thermodynamic disease accelerating universal decay',
                effects: { disease: 25, military_strength: -25, population: -10, crime: 21, hospital_upkeep: 23 },
                cureRequirement: { money: 80000000, time: 600, research_points: 300, global_cooperation: true }
            },
            { 
                id: 'new_black_death', name: 'New Black Death', severity: 'major', scope: 'global',
                description: 'Modern strain of bubonic plague with global reach',
                effects: { disease: 16, taxable_income: -15, happiness: -23, military_strength: -22, hospital_upkeep: 14 },
                cureRequirement: { money: 42000000, time: 300, research_points: 170, global_cooperation: true }
            },
            { 
                id: 'super_influenza', name: 'Super Influenza', severity: 'major', scope: 'global',
                description: 'Highly contagious flu strain resistant to treatments',
                effects: { military_strength: -11, hospital_upkeep: 20, crime: 18, population: -23, taxable_income: -14 },
                cureRequirement: { money: 38000000, time: 260, research_points: 150, global_cooperation: true }
            },
            { 
                id: 'global_hemorrhagic_fever', name: 'Global Hemorrhagic Fever', severity: 'major', scope: 'global',
                description: 'Worldwide bleeding disorder with high mortality',
                effects: { taxable_income: -12, happiness: -25, hospital_upkeep: 15, population: -25, disease: 20 },
                cureRequirement: { money: 45000000, time: 320, research_points: 180, global_cooperation: true }
            },
            { 
                id: 'neuro_degradation_pandemic', name: 'Neuro-Degradation Pandemic', severity: 'major', scope: 'global',
                description: 'Progressive brain function loss across all ages',
                effects: { happiness: -23, taxable_income: -25, hospital_upkeep: 24, military_strength: -12, population: -10 },
                cureRequirement: { money: 50000000, time: 380, research_points: 200, global_cooperation: true }
            },
            { 
                id: 'immune_system_collapse', name: 'Global Immune Collapse', severity: 'major', scope: 'global',
                description: 'Worldwide failure of natural disease resistance',
                effects: { military_morale: -15, happiness: -14, military_strength: -20, environment: -14, disease: 15 },
                cureRequirement: { money: 48000000, time: 350, research_points: 190, global_cooperation: true }
            },
            { 
                id: 'cellular_breakdown_syndrome', name: 'Cellular Breakdown Syndrome', severity: 'major', scope: 'global',
                description: 'Rapid aging and cellular death acceleration',
                effects: { population: -14, happiness: -22, environment: -15, military_strength: -25, crime: 15 },
                cureRequirement: { money: 52000000, time: 400, research_points: 210, global_cooperation: true }
            },
            { 
                id: 'genetic_scrambler', name: 'Genetic Scrambler Virus', severity: 'major', scope: 'global',
                description: 'DNA corruption causing random mutations',
                effects: { environment: -24, happiness: -16, population: -24, disease: 19, military_morale: -24 },
                cureRequirement: { money: 55000000, time: 420, research_points: 220, global_cooperation: true }
            },
            { 
                id: 'organ_liquefaction', name: 'Organ Liquefaction Disease', severity: 'major', scope: 'global',
                description: 'Internal organs dissolving at cellular level',
                effects: { population: -12, taxable_income: -14, happiness: -21, environment: -18, crime: 12 },
                cureRequirement: { money: 60000000, time: 480, research_points: 240, global_cooperation: true }
            },
            { 
                id: 'memory_plague', name: 'Global Memory Plague', severity: 'major', scope: 'global',
                description: 'Progressive amnesia erasing human knowledge',
                effects: { happiness: -15, environment: -19, crime: 16, disease: 25, hospital_upkeep: 15 },
                cureRequirement: { money: 47000000, time: 340, research_points: 185, global_cooperation: true }
            },
            { 
                id: 'biological_reversal', name: 'Biological Reversal Syndrome', severity: 'major', scope: 'global',
                description: 'Evolution running backwards, losing human traits',
                effects: { crime: 18, taxable_income: -18, disease: 17, military_morale: -13, environment: -12 },
                cureRequirement: { money: 58000000, time: 460, research_points: 230, global_cooperation: true }
            },
            { 
                id: 'synthetic_rejection', name: 'Synthetic Rejection Disorder', severity: 'major', scope: 'global',
                description: 'Bodies rejecting all artificial materials and medicines',
                effects: { taxable_income: -25, crime: 18, hospital_upkeep: 17, environment: -24, population: -14 },
                cureRequirement: { money: 44000000, time: 310, research_points: 175, global_cooperation: true }
            },
            { 
                id: 'sensory_cascade_failure', name: 'Sensory Cascade Failure', severity: 'major', scope: 'global',
                description: 'Progressive loss of all five senses',
                effects: { happiness: -10, environment: -12, military_morale: -11, disease: 17, crime: 23 },
                cureRequirement: { money: 53000000, time: 410, research_points: 215, global_cooperation: true }
            },
            { 
                id: 'empathy_virus', name: 'Empathy Virus', severity: 'major', scope: 'global',
                description: 'Overwhelming emotional connection causing psychic overload',
                effects: { happiness: -21, environment: -10, disease: 23, crime: 18, taxable_income: -19 },
                cureRequirement: { money: 35000000, time: 240, research_points: 140, global_cooperation: true }
            },
            { 
                id: 'time_lock_syndrome', name: 'Time Lock Syndrome', severity: 'major', scope: 'global',
                description: 'Consciousness trapped in temporal loops',
                effects: { happiness: -14, environment: -21, taxable_income: -13, crime: 15, population: -18 },
                cureRequirement: { money: 46000000, time: 330, research_points: 180, global_cooperation: true }
            },
            { 
                id: 'reality_rejection', name: 'Reality Rejection Disorder', severity: 'major', scope: 'global',
                description: 'Inability to distinguish reality from imagination',
                effects: { taxable_income: -21, disease: 19, population: -23, environment: -24, happiness: -13 },
                cureRequirement: { money: 41000000, time: 290, research_points: 165, global_cooperation: true }
            },
            { 
                id: 'collective_nightmare', name: 'Collective Nightmare State', severity: 'major', scope: 'global',
                description: 'Shared horrific dreams invading waking hours',
                effects: { taxable_income: -13, population: -17, happiness: -17, hospital_upkeep: 14, environment: -23 },
                cureRequirement: { money: 49000000, time: 360, research_points: 195, global_cooperation: true }
            },
            { 
                id: 'species_fragmentation', name: 'Species Fragmentation Disease', severity: 'major', scope: 'global',
                description: 'Humans splitting into incompatible subspecies',
                effects: { population: -16, hospital_upkeep: 13, environment: -22, happiness: -16, military_strength: -14 },
                cureRequirement: { money: 54000000, time: 430, research_points: 220, global_cooperation: true }
            },
            { 
                id: 'existence_doubt_pandemic', name: 'Existence Doubt Pandemic', severity: 'major', scope: 'global',
                description: 'Philosophical virus questioning reality of existence',
                effects: { military_morale: -23, environment: -22, population: -11, taxable_income: -15, disease: 16 },
                cureRequirement: { money: 43000000, time: 300, research_points: 170, global_cooperation: true }
            },
            { 
                id: 'soul_fragmentation', name: 'Soul Fragmentation Syndrome', severity: 'major', scope: 'global',
                description: 'Spiritual essence dividing causing identity crisis',
                effects: { military_strength: -16, environment: -18, crime: 17, military_morale: -24, disease: 20 },
                cureRequirement: { money: 51000000, time: 390, research_points: 205, global_cooperation: true }
            },
            { 
                id: 'quantum_consciousness_leak', name: 'Quantum Consciousness Leak', severity: 'major', scope: 'global',
                description: 'Minds bleeding into parallel dimensions',
                effects: { military_morale: -13, disease: 16, population: -10, hospital_upkeep: 15, crime: 20 },
                cureRequirement: { money: 56000000, time: 440, research_points: 225, global_cooperation: true }
            },
            { 
                id: 'universal_allergic_reaction', name: 'Universal Allergic Reaction', severity: 'major', scope: 'global',
                description: 'Allergic to existence itself at molecular level',
                effects: { happiness: -21, environment: -13, hospital_upkeep: 17, military_strength: -23, taxable_income: -18 },
                cureRequirement: { money: 57000000, time: 450, research_points: 230, global_cooperation: true }
            },
            { 
                id: 'cognitive_recursion_trap', name: 'Cognitive Recursion Trap', severity: 'major', scope: 'global',
                description: 'Thoughts stuck in infinite loops preventing action',
                effects: { happiness: -23, environment: -19, crime: 20, disease: 13, military_morale: -21 },
                cureRequirement: { money: 39000000, time: 270, research_points: 155, global_cooperation: true }
            },
            { 
                id: 'existential_void_syndrome', name: 'Existential Void Syndrome', severity: 'major', scope: 'global',
                description: 'Complete loss of meaning and purpose in existence',
                effects: { hospital_upkeep: 10, military_strength: -12, disease: 24, population: -23, crime: 18 },
                cureRequirement: { money: 65000000, time: 520, research_points: 260, global_cooperation: true }
            },
            { 
                id: 'meta_awareness_overload', name: 'Meta-Awareness Overload', severity: 'major', scope: 'global',
                description: 'Consciousness of being fictional causing breakdown',
                effects: { crime: 18, military_strength: -16, military_morale: -20, taxable_income: -18, environment: -23 },
                cureRequirement: { money: 62000000, time: 500, research_points: 250, global_cooperation: true }
            },
            { 
                id: 'simulation_hypothesis_madness', name: 'Simulation Hypothesis Madness', severity: 'major', scope: 'global',
                description: 'Certainty of living in computer simulation causing despair',
                effects: { environment: -10, military_strength: -15, population: -20, crime: 16, disease: 21 },
                cureRequirement: { money: 59000000, time: 470, research_points: 235, global_cooperation: true }
            },
            { 
                id: 'temporal_paradox_sickness', name: 'Temporal Paradox Sickness', severity: 'major', scope: 'global',
                description: 'Causality loops causing physical and mental breakdown',
                effects: { environment: -14, taxable_income: -12, crime: 21, disease: 22, happiness: -24 },
                cureRequirement: { money: 61000000, time: 490, research_points: 245, global_cooperation: true }
            },
            { 
                id: 'universal_soul_extraction', name: 'Universal Soul Extraction Syndrome', severity: 'major', scope: 'global',
                description: 'Spiritual essence being systematically drained from all humans',
                effects: { environment: -12, military_morale: -16, taxable_income: -15, military_strength: -11, hospital_upkeep: 14 },
                cureRequirement: { money: 68000000, time: 550, research_points: 275, global_cooperation: true }
            },
            { 
                id: 'planetary_personality_purge', name: 'Planetary Personality Purge', severity: 'major', scope: 'global',
                description: 'Individual personalities being erased and homogenized',
                effects: { population: -19, hospital_upkeep: 23, military_morale: -21, disease: 17, crime: 14 },
                cureRequirement: { money: 66000000, time: 530, research_points: 265, global_cooperation: true }
            },
            { 
                id: 'cosmic_consciousness_cancer', name: 'Cosmic Consciousness Cancer', severity: 'major', scope: 'global',
                description: 'Malignant growth in collective human awareness',
                effects: { happiness: -20, environment: -15, crime: 25, military_morale: -22, hospital_upkeep: 19 },
                cureRequirement: { money: 70000000, time: 560, research_points: 280, global_cooperation: true }
            },
            { 
                id: 'dimensional_DNA_decay', name: 'Dimensional DNA Decay', severity: 'major', scope: 'global',
                description: 'Genetic code corrupting across multiple dimensions',
                effects: { happiness: -15, environment: -23, crime: 24, disease: 13, hospital_upkeep: 24 },
                cureRequirement: { money: 63000000, time: 510, research_points: 255, global_cooperation: true }
            },
            { 
                id: 'universal_unraveling_syndrome', name: 'Universal Unraveling Syndrome', severity: 'major', scope: 'global',
                description: 'Reality itself beginning to decompose',
                effects: { taxable_income: -10, environment: -20, hospital_upkeep: 21, happiness: -13, military_morale: -21 },
                cureRequirement: { money: 75000000, time: 600, research_points: 300, global_cooperation: true }
            },
            { 
                id: 'planetary_physics_failure', name: 'Planetary Physics Failure', severity: 'major', scope: 'global',
                description: 'Natural laws becoming unreliable worldwide',
                effects: { disease: 23, taxable_income: -18, crime: 25, military_strength: -11, population: -10 },
                cureRequirement: { money: 67000000, time: 540, research_points: 270, global_cooperation: true }
            },
            { 
                id: 'cosmic_causality_collapse', name: 'Cosmic Causality Collapse', severity: 'major', scope: 'global',
                description: 'Cause and effect relationships breaking down',
                effects: { disease: 15, population: -16, military_morale: -13, crime: 16, environment: -23 },
                cureRequirement: { money: 64000000, time: 520, research_points: 260, global_cooperation: true }
            },
            { 
                id: 'universal_uncertainty_plague', name: 'Universal Uncertainty Plague', severity: 'major', scope: 'global',
                description: 'Complete loss of ability to be certain about anything',
                effects: { taxable_income: -19, crime: 10, environment: -23, military_strength: -21, happiness: -12 },
                cureRequirement: { money: 58000000, time: 470, research_points: 235, global_cooperation: true }
            },
            { 
                id: 'planetary_paradox_pandemic', name: 'Planetary Paradox Pandemic', severity: 'major', scope: 'global',
                description: 'Logical contradictions becoming physically manifest',
                effects: { disease: 23, military_strength: -10, environment: -24, happiness: -17, military_morale: -13 },
                cureRequirement: { money: 62000000, time: 500, research_points: 250, global_cooperation: true }
            },
            { 
                id: 'dimensional_death_defiance', name: 'Dimensional Death Defiance Disorder', severity: 'major', scope: 'global',
                description: 'Death becoming impossible but suffering unlimited',
                effects: { taxable_income: -12, crime: 19, environment: -24, disease: 15, military_morale: -14 },
                cureRequirement: { money: 80000000, time: 650, research_points: 325, global_cooperation: true }
            },
            { 
                id: 'cosmic_communication_collapse', name: 'Cosmic Communication Collapse', severity: 'major', scope: 'global',
                description: 'All forms of communication becoming corrupted',
                effects: { military_morale: -15, population: -17, disease: 18, taxable_income: -25, crime: 23 },
                cureRequirement: { money: 55000000, time: 440, research_points: 220, global_cooperation: true }
            },
            { 
                id: 'universal_uniform_ugliness', name: 'Universal Uniform Ugliness', severity: 'major', scope: 'global',
                description: 'All aesthetic appreciation being destroyed',
                effects: { military_morale: -17, disease: 25, population: -18, military_strength: -20, hospital_upkeep: 24 },
                cureRequirement: { money: 45000000, time: 360, research_points: 180, global_cooperation: true }
            },
            { 
                id: 'planetary_purpose_purge', name: 'Planetary Purpose Purge', severity: 'major', scope: 'global',
                description: 'Complete elimination of sense of meaning and purpose',
                effects: { disease: 15, crime: 20, taxable_income: -25, environment: -25, military_morale: -19 },
                cureRequirement: { money: 72000000, time: 580, research_points: 290, global_cooperation: true }
            },
            { 
                id: 'dimensional_diversity_death', name: 'Dimensional Diversity Death', severity: 'major', scope: 'global',
                description: 'All variation and uniqueness being eliminated',
                effects: { happiness: -14, military_strength: -17, environment: -18, population: -25, crime: 16 },
                cureRequirement: { money: 59000000, time: 480, research_points: 240, global_cooperation: true }
            },
            { 
                id: 'cosmic_creativity_cancer', name: 'Cosmic Creativity Cancer', severity: 'major', scope: 'global',
                description: 'Imagination and innovation being systematically destroyed',
                effects: { disease: 19, military_morale: -23, military_strength: -21, crime: 22, environment: -22 },
                cureRequirement: { money: 56000000, time: 450, research_points: 225, global_cooperation: true }
            },
            { 
                id: 'universal_uniqueness_unraveling', name: 'Universal Uniqueness Unraveling', severity: 'major', scope: 'global',
                description: 'Individual characteristics becoming identical worldwide',
                effects: { happiness: -24, environment: -20, crime: 21, population: -24, military_strength: -23 },
                cureRequirement: { money: 61000000, time: 490, research_points: 245, global_cooperation: true }
            },
            { 
                id: 'planetary_progress_paralysis', name: 'Planetary Progress Paralysis', severity: 'major', scope: 'global',
                description: 'Complete inability to advance or improve anything',
                effects: { military_morale: -19, disease: 24, hospital_upkeep: 14, taxable_income: -21, crime: 20 },
                cureRequirement: { money: 54000000, time: 430, research_points: 215, global_cooperation: true }
            },
            { 
                id: 'dimensional_dream_death', name: 'Dimensional Dream Death', severity: 'major', scope: 'global',
                description: 'Complete loss of ability to dream or imagine',
                effects: { military_morale: -14, military_strength: -20, taxable_income: -17, disease: 22, hospital_upkeep: 14 },
                cureRequirement: { money: 57000000, time: 460, research_points: 230, global_cooperation: true }
            },
            { 
                id: 'cosmic_curiosity_collapse', name: 'Cosmic Curiosity Collapse', severity: 'major', scope: 'global',
                description: 'Total elimination of desire to learn or explore',
                effects: { happiness: -18, military_morale: -11, hospital_upkeep: 13, taxable_income: -25, military_strength: -10 },
                cureRequirement: { money: 53000000, time: 420, research_points: 210, global_cooperation: true }
            },
            { 
                id: 'universal_understanding_undoing', name: 'Universal Understanding Undoing', severity: 'major', scope: 'global',
                description: 'All knowledge and comprehension being erased',
                effects: { population: -25, disease: 17, crime: 21, military_morale: -17, environment: -23 },
                cureRequirement: { money: 65000000, time: 530, research_points: 265, global_cooperation: true }
            },
            { 
                id: 'planetary_passion_plague', name: 'Planetary Passion Plague', severity: 'major', scope: 'global',
                description: 'Complete loss of emotional intensity and care',
                effects: { happiness: -20, military_morale: -19, environment: -20, crime: 13, disease: 10 },
                cureRequirement: { money: 60000000, time: 480, research_points: 240, global_cooperation: true }
            },
            { 
                id: 'dimensional_decision_decay', name: 'Dimensional Decision Decay', severity: 'major', scope: 'global',
                description: 'Inability to make any choices or decisions',
                effects: { crime: 12, military_strength: -20, environment: -12, disease: 12, hospital_upkeep: 11 },
                cureRequirement: { money: 58000000, time: 470, research_points: 235, global_cooperation: true }
            },
            { 
                id: 'cosmic_connection_collapse', name: 'Cosmic Connection Collapse', severity: 'major', scope: 'global',
                description: 'Complete breakdown of all relationships and bonds',
                effects: { crime: 24, population: -14, happiness: -24, military_morale: -20, taxable_income: -22 },
                cureRequirement: { money: 69000000, time: 560, research_points: 280, global_cooperation: true }
            },
            { 
                id: 'universal_utility_undoing', name: 'Universal Utility Undoing', severity: 'major', scope: 'global',
                description: 'All tools and technology becoming useless',
                effects: { crime: 23, military_morale: -22, population: -12, military_strength: -14, happiness: -19 },
                cureRequirement: { money: 52000000, time: 410, research_points: 205, global_cooperation: true }
            },
            { 
                id: 'planetary_pleasure_purge', name: 'Planetary Pleasure Purge', severity: 'major', scope: 'global',
                description: 'Complete elimination of ability to experience joy',
                effects: { happiness: -10, environment: -12, crime: 14, disease: 17, military_morale: -10 },
                cureRequirement: { money: 100000000, time: 800, research_points: 400, global_cooperation: true }
            },
            { 
                id: 'dimensional_drive_death', name: 'Dimensional Drive Death', severity: 'major', scope: 'global',
                description: 'Total loss of motivation and will to act',
                effects: { taxable_income: -11, environment: -20, disease: 19, crime: 19, happiness: -22 },
                cureRequirement: { money: 63000000, time: 510, research_points: 255, global_cooperation: true }
            },
            { 
                id: 'cosmic_courage_collapse', name: 'Cosmic Courage Collapse', severity: 'major', scope: 'global',
                description: 'Universal cowardice and fear of everything',
                effects: { crime: 25, military_morale: -19, environment: -21, hospital_upkeep: 23, population: -25 },
                cureRequirement: { money: 51000000, time: 400, research_points: 200, global_cooperation: true }
            },
            { 
                id: 'universal_unity_undoing', name: 'Universal Unity Undoing', severity: 'major', scope: 'global',
                description: 'Complete breakdown of cooperation and teamwork',
                effects: { military_strength: -23, happiness: -23, environment: -18, crime: 21, population: -13 },
                cureRequirement: { money: 56000000, time: 450, research_points: 225, global_cooperation: true }
            },
            { 
                id: 'planetary_peace_plague', name: 'Planetary Peace Plague', severity: 'major', scope: 'global',
                description: 'Violent conflict becoming impossible but tension unlimited',
                effects: { happiness: -21, military_strength: -24, environment: -19, crime: 15, population: -11 },
                cureRequirement: { money: 48000000, time: 380, research_points: 190, global_cooperation: true }
            },
            { 
                id: 'dimensional_dignity_decay', name: 'Dimensional Dignity Decay', severity: 'major', scope: 'global',
                description: 'Complete loss of self-respect and dignity',
                effects: { disease: 18, population: -18, crime: 19, environment: -18, military_morale: -10 },
                cureRequirement: { money: 62000000, time: 500, research_points: 250, global_cooperation: true }
            },
            { 
                id: 'cosmic_compassion_collapse', name: 'Cosmic Compassion Collapse', severity: 'major', scope: 'global',
                description: 'Complete elimination of empathy and caring',
                effects: { happiness: -11, disease: 19, taxable_income: -25, military_morale: -16, hospital_upkeep: 13 },
                cureRequirement: { money: 64000000, time: 520, research_points: 260, global_cooperation: true }
            },
            { 
                id: 'universal_wonder_withering', name: 'Universal Wonder Withering', severity: 'major', scope: 'global',
                description: 'Complete loss of sense of awe and wonder',
                effects: { environment: -24, happiness: -14, taxable_income: -22, population: -15, military_strength: -15 },
                cureRequirement: { money: 49000000, time: 390, research_points: 195, global_cooperation: true }
            },
            { 
                id: 'planetary_patience_plague', name: 'Planetary Patience Plague', severity: 'major', scope: 'global',
                description: 'Complete inability to wait or be patient',
                effects: { environment: -21, crime: 10, disease: 10, military_morale: -18, hospital_upkeep: 13 },
                cureRequirement: { money: 46000000, time: 370, research_points: 185, global_cooperation: true }
            },
            { 
                id: 'dimensional_discipline_decay', name: 'Dimensional Discipline Decay', severity: 'major', scope: 'global',
                description: 'Complete loss of self-control and discipline',
                effects: { disease: 18, hospital_upkeep: 20, military_morale: -19, crime: 13, happiness: -13 },
                cureRequirement: { money: 54000000, time: 430, research_points: 215, global_cooperation: true }
            },
            { 
                id: 'cosmic_confidence_collapse', name: 'Cosmic Confidence Collapse', severity: 'major', scope: 'global',
                description: 'Universal self-doubt and lack of confidence',
                effects: { hospital_upkeep: 22, population: -16, military_strength: -16, taxable_income: -10, happiness: -24 },
                cureRequirement: { money: 58000000, time: 470, research_points: 235, global_cooperation: true }
            },
            { 
                id: 'universal_urgency_undoing', name: 'Universal Urgency Undoing', severity: 'major', scope: 'global',
                description: 'Complete loss of sense of importance or urgency',
                effects: { taxable_income: -17, military_strength: -13, military_morale: -10, disease: 22, crime: 13 },
                cureRequirement: { money: 47000000, time: 380, research_points: 190, global_cooperation: true }
            },
            { 
                id: 'planetary_perseverance_purge', name: 'Planetary Perseverance Purge', severity: 'major', scope: 'global',
                description: 'Complete inability to persist through difficulties',
                effects: { military_strength: -12, population: -12, military_morale: -10, hospital_upkeep: 23, disease: 20 },
                cureRequirement: { money: 55000000, time: 440, research_points: 220, global_cooperation: true }
            },
            { 
                id: 'dimensional_determination_death', name: 'Dimensional Determination Death', severity: 'major', scope: 'global',
                description: 'Total loss of determination and resolve',
                effects: { population: -12, taxable_income: -22, military_strength: -16, disease: 21, happiness: -20 },
                cureRequirement: { money: 59000000, time: 480, research_points: 240, global_cooperation: true }
            },
            { 
                id: 'cosmic_clarity_collapse', name: 'Cosmic Clarity Collapse', severity: 'major', scope: 'global',
                description: 'Complete loss of mental clarity and focus',
                effects: { taxable_income: -19, population: -20, happiness: -17, disease: 25, military_strength: -22 },
                cureRequirement: { money: 53000000, time: 420, research_points: 210, global_cooperation: true }
            },
            { 
                id: 'universal_vision_void', name: 'Universal Vision Void', severity: 'major', scope: 'global',
                description: 'Complete loss of ability to envision the future',
                effects: { taxable_income: -18, military_morale: -23, environment: -25, military_strength: -12, happiness: -15 },
                cureRequirement: { money: 57000000, time: 460, research_points: 230, global_cooperation: true }
            },
            { 
                id: 'planetary_priority_plague', name: 'Planetary Priority Plague', severity: 'major', scope: 'global',
                description: 'Complete inability to prioritize or organize',
                effects: { taxable_income: -23, happiness: -14, environment: -20, population: -18, crime: 21 },
                cureRequirement: { money: 50000000, time: 400, research_points: 200, global_cooperation: true }
            },
            { 
                id: 'dimensional_duty_death', name: 'Dimensional Duty Death', severity: 'major', scope: 'global',
                description: 'Complete loss of sense of responsibility and duty',
                effects: { hospital_upkeep: 19, crime: 10, disease: 11, happiness: -21, military_morale: -13 },
                cureRequirement: { money: 52000000, time: 410, research_points: 205, global_cooperation: true }
            },
            { 
                id: 'cosmic_commitment_collapse', name: 'Cosmic Commitment Collapse', severity: 'major', scope: 'global',
                description: 'Complete inability to make or keep commitments',
                effects: { disease: 13, environment: -13, military_strength: -19, hospital_upkeep: 11, military_morale: -18 },
                cureRequirement: { money: 56000000, time: 450, research_points: 225, global_cooperation: true }
            },
            { 
                id: 'universal_integrity_undoing', name: 'Universal Integrity Undoing', severity: 'major', scope: 'global',
                description: 'Complete loss of moral integrity and honesty',
                effects: { happiness: -21, environment: -17, taxable_income: -23, military_strength: -22, military_morale: -23 },
                cureRequirement: { money: 61000000, time: 490, research_points: 245, global_cooperation: true }
            },
            { 
                id: 'planetary_potential_purge', name: 'Planetary Potential Purge', severity: 'major', scope: 'global',
                description: 'Complete elimination of human potential and growth',
                effects: { happiness: -19, environment: -12, crime: 19, disease: 24, military_morale: -10 },
                cureRequirement: { money: 65000000, time: 530, research_points: 265, global_cooperation: true }
            },
            { 
                id: 'dimensional_devotion_decay', name: 'Dimensional Devotion Decay', severity: 'major', scope: 'global',
                description: 'Complete loss of ability to devote oneself to anything',
                effects: { happiness: -13, population: -24, environment: -10, crime: 17, disease: 14 },
                cureRequirement: { money: 54000000, time: 430, research_points: 215, global_cooperation: true }
            },
            { 
                id: 'cosmic_character_collapse', name: 'Cosmic Character Collapse', severity: 'major', scope: 'global',
                description: 'Complete breakdown of moral character and virtue',
                effects: { disease: 14, military_morale: -21, happiness: -11, environment: -18, hospital_upkeep: 20 },
                cureRequirement: { money: 63000000, time: 510, research_points: 255, global_cooperation: true }
            },
            { 
                id: 'universal_valor_void', name: 'Universal Valor Void', severity: 'major', scope: 'global',
                description: 'Complete elimination of courage and heroism',
                effects: { happiness: -20, hospital_upkeep: 20, environment: -13, crime: 20, disease: 19 },
                cureRequirement: { money: 48000000, time: 380, research_points: 190, global_cooperation: true }
            },
            { 
                id: 'planetary_purpose_paralysis', name: 'Planetary Purpose Paralysis', severity: 'major', scope: 'global',
                description: 'Complete inability to find or create meaning',
                effects: { population: -19, crime: 17, hospital_upkeep: 17, military_strength: -15, taxable_income: -14 },
                cureRequirement: { money: 67000000, time: 540, research_points: 270, global_cooperation: true }
            },
            { 
                id: 'dimensional_dream_destroyer', name: 'Dimensional Dream Destroyer', severity: 'major', scope: 'global',
                description: 'Complete elimination of hopes and dreams',
                effects: { military_morale: -10, crime: 15, population: -16, disease: 21, military_strength: -17 },
                cureRequirement: { money: 71000000, time: 570, research_points: 285, global_cooperation: true }
            },
            { 
                id: 'cosmic_creation_collapse', name: 'Cosmic Creation Collapse', severity: 'major', scope: 'global',
                description: 'Complete inability to create or build anything new',
                effects: { taxable_income: -23, military_strength: -13, happiness: -20, population: -25, environment: -11 },
                cureRequirement: { money: 60000000, time: 480, research_points: 240, global_cooperation: true }
            },
            { 
                id: 'universal_understanding_undoing_final', name: 'Final Universal Understanding Undoing', severity: 'major', scope: 'global',
                description: 'The ultimate erasure of all comprehension and knowledge',
                effects: { crime: 13, environment: -15, happiness: -22, taxable_income: -19, military_morale: -24 },
                cureRequirement: { money: 75000000, time: 600, research_points: 300, global_cooperation: true }
            }
        ]
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.GLOBAL_DISEASES;
}
