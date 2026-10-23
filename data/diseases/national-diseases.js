/**
 * National Diseases Database
 * Extracted from disease-system.js
 */

// Make sure the global object exists
if (typeof window !== 'undefined') {
    window.NATIONAL_DISEASES = {
        minor: [
            { 
                id: 'crimson_cough', name: 'Crimson Cough', severity: 'minor', scope: 'national',
                description: 'A respiratory illness causing red-tinged coughing',
                effects: { happiness: -5, productivity: -10, healthcare_cost: 50000 },
                cureRequirement: { money: 100000, time: 24, research_points: 5 }
            },
            { 
                id: 'azure_fever', name: 'Azure Fever', severity: 'minor', scope: 'national',
                description: 'Mild fever causing blue-tinted skin discoloration',
                effects: { happiness: -3, productivity: -8, healthcare_cost: 40000 },
                cureRequirement: { money: 80000, time: 18, research_points: 4 }
            },
            { 
                id: 'silver_shivers', name: 'Silver Shivers', severity: 'minor', scope: 'national',
                description: 'Temperature regulation disorder with metallic skin tone',
                effects: { happiness: -4, productivity: -12, healthcare_cost: 60000 },
                cureRequirement: { money: 120000, time: 20, research_points: 6 }
            },
            { 
                id: 'golden_gastritis', name: 'Golden Gastritis', severity: 'minor', scope: 'national',
                description: 'Digestive disorder with yellowish symptoms',
                effects: { happiness: -6, food_consumption: 15, healthcare_cost: 45000 },
                cureRequirement: { money: 90000, time: 16, research_points: 5 }
            },
            { 
                id: 'violet_vertigo', name: 'Violet Vertigo', severity: 'minor', scope: 'national',
                description: 'Balance disorder causing purple eye discoloration',
                effects: { happiness: -4, productivity: -15, healthcare_cost: 55000 },
                cureRequirement: { money: 110000, time: 22, research_points: 7 }
            },
            { 
                id: 'emerald_exhaustion', name: 'Emerald Exhaustion', severity: 'minor', scope: 'national',
                description: 'Chronic fatigue with greenish complexion',
                effects: { happiness: -7, productivity: -20, healthcare_cost: 65000 },
                cureRequirement: { money: 130000, time: 28, research_points: 8 }
            },
            { 
                id: 'copper_cramps', name: 'Copper Cramps', severity: 'minor', scope: 'national',
                description: 'Muscle disorder with bronze-colored inflammation',
                effects: { happiness: -5, productivity: -18, healthcare_cost: 50000 },
                cureRequirement: { money: 100000, time: 24, research_points: 6 }
            },
            { 
                id: 'ruby_rash', name: 'Ruby Rash', severity: 'minor', scope: 'national',
                description: 'Skin condition creating red crystalline patterns',
                effects: { happiness: -8, social_stability: -5, healthcare_cost: 70000 },
                cureRequirement: { money: 140000, time: 30, research_points: 9 }
            },
            { 
                id: 'sapphire_syndrome', name: 'Sapphire Syndrome', severity: 'minor', scope: 'national',
                description: 'Neurological condition with blue-tinted vision',
                effects: { happiness: -6, productivity: -14, healthcare_cost: 55000 },
                cureRequirement: { money: 110000, time: 26, research_points: 7 }
            },
            { 
                id: 'obsidian_onset', name: 'Obsidian Onset', severity: 'minor', scope: 'national',
                description: 'Bone density disorder with dark discoloration',
                effects: { happiness: -7, productivity: -16, healthcare_cost: 60000 },
                cureRequirement: { money: 120000, time: 32, research_points: 8 }
            },
            { 
                id: 'sweating_sickness', name: 'Sweating Sickness', severity: 'minor', scope: 'national',
                description: 'Historical fever disease from Tudor England',
                effects: { happiness: -6, productivity: -12, healthcare_cost: 55000 },
                cureRequirement: { money: 110000, time: 20, research_points: 6 }
            },
            { 
                id: 'english_sweat', name: 'English Sweat', severity: 'minor', scope: 'national',
                description: 'Sudden onset fever with profuse sweating',
                effects: { happiness: -5, productivity: -10, healthcare_cost: 50000 },
                cureRequirement: { money: 100000, time: 18, research_points: 5 }
            },
            { 
                id: 'dancing_mania', name: 'Dancing Mania', severity: 'minor', scope: 'national',
                description: 'Medieval mass psychogenic illness',
                effects: { happiness: -8, social_stability: -10, healthcare_cost: 40000 },
                cureRequirement: { money: 80000, time: 24, research_points: 4 }
            },
            { 
                id: 'kings_evil', name: "King's Evil", severity: 'minor', scope: 'national',
                description: 'Scrofula - tuberculous cervical lymphadenitis',
                effects: { happiness: -4, productivity: -8, healthcare_cost: 45000 },
                cureRequirement: { money: 90000, time: 16, research_points: 4 }
            },
            { 
                id: 'milk_sickness', name: 'Milk Sickness', severity: 'minor', scope: 'national',
                description: 'Poisoning from consuming contaminated dairy',
                effects: { happiness: -6, food_safety: -15, healthcare_cost: 60000 },
                cureRequirement: { money: 120000, time: 22, research_points: 7 }
            },
            { 
                id: 'phossy_jaw', name: 'Phossy Jaw', severity: 'minor', scope: 'national',
                description: 'Occupational disease from phosphorus exposure',
                effects: { happiness: -7, industrial_output: -10, healthcare_cost: 65000 },
                cureRequirement: { money: 130000, time: 28, research_points: 8 }
            },
            { 
                id: 'radium_jaw', name: 'Radium Jaw', severity: 'minor', scope: 'national',
                description: 'Radiation poisoning affecting jaw bones',
                effects: { happiness: -8, industrial_safety: -20, healthcare_cost: 70000 },
                cureRequirement: { money: 140000, time: 30, research_points: 9 }
            },
            { 
                id: 'consumption', name: 'Consumption', severity: 'minor', scope: 'national',
                description: 'Historical name for pulmonary tuberculosis',
                effects: { happiness: -5, productivity: -15, healthcare_cost: 55000 },
                cureRequirement: { money: 110000, time: 26, research_points: 7 }
            },
            { 
                id: 'ergotism', name: 'Ergotism', severity: 'minor', scope: 'national',
                description: "St. Anthony's Fire caused by ergot-contaminated grain",
                effects: { happiness: -9, food_safety: -20, healthcare_cost: 75000 },
                cureRequirement: { money: 150000, time: 34, research_points: 10 }
            },
            { 
                id: 'chlorosis', name: 'Chlorosis', severity: 'minor', scope: 'national',
                description: 'Green sickness affecting young women',
                effects: { happiness: -4, population_growth: -8, healthcare_cost: 45000 },
                cureRequirement: { money: 90000, time: 20, research_points: 5 }
            },
            { 
                id: 'mal_de_ojo', name: 'Mal de Ojo', severity: 'minor', scope: 'national',
                description: 'Evil eye syndrome from cultural beliefs',
                effects: { happiness: -6, social_cohesion: -10, healthcare_cost: 40000 },
                cureRequirement: { money: 80000, time: 24, research_points: 4 }
            },
            { 
                id: 'tarantism', name: 'Tarantism', severity: 'minor', scope: 'national',
                description: 'Dancing disease attributed to spider bites',
                effects: { happiness: -7, productivity: -12, healthcare_cost: 50000 },
                cureRequirement: { money: 100000, time: 28, research_points: 6 }
            },
            { 
                id: 'lycanthropy', name: 'Lycanthropy Delusion', severity: 'minor', scope: 'national',
                description: 'Historical werewolf delusion disorder',
                effects: { happiness: -8, social_stability: -15, healthcare_cost: 60000 },
                cureRequirement: { money: 120000, time: 32, research_points: 8 }
            },
            { 
                id: 'windigo_psychosis', name: 'Windigo Psychosis', severity: 'minor', scope: 'national',
                description: 'Cannibalistic compulsion from indigenous folklore',
                effects: { happiness: -10, crime: 5, healthcare_cost: 65000 },
                cureRequirement: { money: 130000, time: 30, research_points: 9 }
            },
            { 
                id: 'grisi_siknis', name: 'Grisi Siknis', severity: 'minor', scope: 'national',
                description: 'Cultural syndrome with aggressive behavior',
                effects: { happiness: -6, social_stability: -8, healthcare_cost: 45000 },
                cureRequirement: { money: 90000, time: 22, research_points: 6 }
            },
            { 
                id: 'latah', name: 'Latah Syndrome', severity: 'minor', scope: 'national',
                description: 'Exaggerated startle response from Malaysia',
                effects: { happiness: -4, productivity: -6, healthcare_cost: 35000 },
                cureRequirement: { money: 70000, time: 18, research_points: 4 }
            },
            { 
                id: 'pibloktoq', name: 'Pibloktoq', severity: 'minor', scope: 'national',
                description: 'Arctic hysteria with dramatic behavioral changes',
                effects: { happiness: -8, social_cohesion: -12, healthcare_cost: 55000 },
                cureRequirement: { money: 110000, time: 26, research_points: 7 }
            },
            { 
                id: 'amok', name: 'Running Amok', severity: 'minor', scope: 'national',
                description: 'Sudden violent behavior in Southeast Asia',
                effects: { happiness: -9, crime: 8, healthcare_cost: 60000 },
                cureRequirement: { money: 120000, time: 28, research_points: 8 }
            },
            { 
                id: 'susto', name: 'Susto', severity: 'minor', scope: 'national',
                description: 'Soul loss syndrome in Latin American culture',
                effects: { happiness: -5, productivity: -8, healthcare_cost: 40000 },
                cureRequirement: { money: 80000, time: 20, research_points: 5 }
            },
            { 
                id: 'zar_possession', name: 'Zar Possession', severity: 'minor', scope: 'national',
                description: 'Spirit possession syndrome in Africa/Middle East',
                effects: { happiness: -7, social_stability: -10, healthcare_cost: 50000 },
                cureRequirement: { money: 100000, time: 24, research_points: 6 }
            },
            { 
                id: 'neurasthenia', name: 'Neurasthenia', severity: 'minor', scope: 'national',
                description: 'Victorian-era nervous exhaustion syndrome',
                effects: { happiness: -6, productivity: -14, healthcare_cost: 55000 },
                cureRequirement: { money: 110000, time: 26, research_points: 7 }
            },
            { 
                id: 'railway_spine', name: 'Railway Spine', severity: 'minor', scope: 'national',
                description: 'Trauma disorder from early railway accidents',
                effects: { happiness: -5, transportation: -8, healthcare_cost: 45000 },
                cureRequirement: { money: 90000, time: 22, research_points: 6 }
            },
            { 
                id: 'soldiers_heart', name: "Soldier's Heart", severity: 'minor', scope: 'national',
                description: 'Civil War-era cardiac neurosis in veterans',
                effects: { happiness: -7, military_morale: -10, healthcare_cost: 50000 },
                cureRequirement: { money: 100000, time: 24, research_points: 6 }
            },
            { 
                id: 'shell_shock', name: 'Shell Shock', severity: 'minor', scope: 'national',
                description: 'WWI psychological trauma from artillery bombardment',
                effects: { happiness: -8, military_effectiveness: -15, healthcare_cost: 60000 },
                cureRequirement: { money: 120000, time: 28, research_points: 8 }
            },
            { 
                id: 'da_costa_syndrome', name: "Da Costa's Syndrome", severity: 'minor', scope: 'national',
                description: 'Irritable heart syndrome in soldiers',
                effects: { happiness: -6, military_morale: -8, healthcare_cost: 45000 },
                cureRequirement: { money: 90000, time: 22, research_points: 6 }
            },
            { 
                id: 'amber_ague', name: 'Amber Ague', severity: 'minor', scope: 'national',
                description: 'Crystalline fever causing golden skin discoloration',
                effects: { happiness: -4, productivity: -9, healthcare_cost: 42000 },
                cureRequirement: { money: 85000, time: 19, research_points: 5 }
            },
            { 
                id: 'mist_madness', name: 'Mist Madness', severity: 'minor', scope: 'national',
                description: 'Fog-induced hallucinations affecting coastal regions',
                effects: { happiness: -6, maritime_activities: -15, healthcare_cost: 48000 },
                cureRequirement: { money: 95000, time: 21, research_points: 6 }
            },
            { 
                id: 'iron_lung_syndrome', name: 'Iron Lung Syndrome', severity: 'minor', scope: 'national',
                description: 'Metallic taste respiratory disorder',
                effects: { happiness: -5, breathing_efficiency: -12, healthcare_cost: 46000 },
                cureRequirement: { money: 92000, time: 20, research_points: 5 }
            },
            { 
                id: 'pearl_pox', name: 'Pearl Pox', severity: 'minor', scope: 'national',
                description: 'Iridescent skin lesions with pearl-like appearance',
                effects: { happiness: -7, social_acceptance: -10, healthcare_cost: 52000 },
                cureRequirement: { money: 105000, time: 24, research_points: 7 }
            },
            { 
                id: 'echo_fever', name: 'Echo Fever', severity: 'minor', scope: 'national',
                description: 'Auditory repetition disorder causing speech loops',
                effects: { happiness: -5, communication: -8, healthcare_cost: 44000 },
                cureRequirement: { money: 88000, time: 18, research_points: 5 }
            },
            { 
                id: 'glass_bone_disease', name: 'Glass Bone Disease', severity: 'minor', scope: 'national',
                description: 'Brittle bone syndrome with transparent appearance',
                effects: { happiness: -8, physical_activities: -20, healthcare_cost: 62000 },
                cureRequirement: { money: 125000, time: 28, research_points: 9 }
            },
            { 
                id: 'moonlight_melancholy', name: 'Moonlight Melancholy', severity: 'minor', scope: 'national',
                description: 'Lunar cycle dependent depression',
                effects: { happiness: -9, night_productivity: -15, healthcare_cost: 58000 },
                cureRequirement: { money: 115000, time: 26, research_points: 8 }
            },
            { 
                id: 'static_skin', name: 'Static Skin Syndrome', severity: 'minor', scope: 'national',
                description: 'Electrical charge buildup in skin tissue',
                effects: { happiness: -6, technology_interaction: -12, healthcare_cost: 50000 },
                cureRequirement: { money: 100000, time: 22, research_points: 6 }
            },
            { 
                id: 'dream_leak', name: 'Dream Leak Disorder', severity: 'minor', scope: 'national',
                description: 'Dreams bleeding into waking consciousness',
                effects: { happiness: -7, reality_perception: -10, healthcare_cost: 54000 },
                cureRequirement: { money: 108000, time: 25, research_points: 7 }
            },
            { 
                id: 'dust_devil_disease', name: 'Dust Devil Disease', severity: 'minor', scope: 'national',
                description: 'Whirling sensation causing constant dizziness',
                effects: { happiness: -5, balance: -15, healthcare_cost: 47000 },
                cureRequirement: { money: 94000, time: 21, research_points: 6 }
            },
            { 
                id: 'whisper_weakness', name: 'Whisper Weakness', severity: 'minor', scope: 'national',
                description: 'Voice gradually fading to inaudible whispers',
                effects: { happiness: -6, communication: -20, healthcare_cost: 49000 },
                cureRequirement: { money: 98000, time: 23, research_points: 6 }
            },
            { 
                id: 'mirror_memory_loss', name: 'Mirror Memory Loss', severity: 'minor', scope: 'national',
                description: 'Forgetting own reflection and appearance',
                effects: { happiness: -8, identity_stability: -15, healthcare_cost: 56000 },
                cureRequirement: { money: 112000, time: 27, research_points: 8 }
            },
            { 
                id: 'clockwork_cough', name: 'Clockwork Cough', severity: 'minor', scope: 'national',
                description: 'Mechanical rhythm respiratory spasms',
                effects: { happiness: -4, precision_work: -10, healthcare_cost: 41000 },
                cureRequirement: { money: 82000, time: 17, research_points: 4 }
            },
            { 
                id: 'butterfly_bones', name: 'Butterfly Bones', severity: 'minor', scope: 'national',
                description: 'Bones becoming lightweight and fragile',
                effects: { happiness: -7, physical_durability: -18, healthcare_cost: 53000 },
                cureRequirement: { money: 106000, time: 24, research_points: 7 }
            },
            { 
                id: 'tide_sickness', name: 'Tide Sickness', severity: 'minor', scope: 'national',
                description: 'Ocean rhythm induced nausea',
                effects: { happiness: -5, maritime_tolerance: -25, healthcare_cost: 45000 },
                cureRequirement: { money: 90000, time: 20, research_points: 5 }
            },
            { 
                id: 'phantom_pain_plague', name: 'Phantom Pain Plague', severity: 'minor', scope: 'national',
                description: 'Pain in body parts that were never injured',
                effects: { happiness: -9, productivity: -16, healthcare_cost: 59000 },
                cureRequirement: { money: 118000, time: 28, research_points: 9 }
            },
            { 
                id: 'shadow_blindness', name: 'Shadow Blindness', severity: 'minor', scope: 'national',
                description: 'Inability to see shadows and silhouettes',
                effects: { happiness: -6, depth_perception: -20, healthcare_cost: 48000 },
                cureRequirement: { money: 96000, time: 22, research_points: 6 }
            },
            { 
                id: 'crystal_tears', name: 'Crystal Tears Syndrome', severity: 'minor', scope: 'national',
                description: 'Tears crystallizing upon contact with air',
                effects: { happiness: -8, emotional_expression: -12, healthcare_cost: 55000 },
                cureRequirement: { money: 110000, time: 26, research_points: 8 }
            },
            { 
                id: 'wind_whisper_disease', name: 'Wind Whisper Disease', severity: 'minor', scope: 'national',
                description: 'Hearing voices in wind patterns',
                effects: { happiness: -7, concentration: -14, healthcare_cost: 51000 },
                cureRequirement: { money: 102000, time: 24, research_points: 7 }
            },
            { 
                id: 'marble_muscle_syndrome', name: 'Marble Muscle Syndrome', severity: 'minor', scope: 'national',
                description: 'Muscles hardening like stone',
                effects: { happiness: -10, flexibility: -30, healthcare_cost: 65000 },
                cureRequirement: { money: 130000, time: 30, research_points: 10 }
            },
            { 
                id: 'frost_touch', name: 'Frost Touch', severity: 'minor', scope: 'national',
                description: 'Hands remain permanently cold',
                effects: { happiness: -5, manual_dexterity: -12, healthcare_cost: 43000 },
                cureRequirement: { money: 86000, time: 19, research_points: 5 }
            },
            { 
                id: 'bubble_brain', name: 'Bubble Brain Syndrome', severity: 'minor', scope: 'national',
                description: 'Thoughts popping like bubbles before completion',
                effects: { happiness: -8, focus: -18, healthcare_cost: 57000 },
                cureRequirement: { money: 114000, time: 27, research_points: 8 }
            },
            { 
                id: 'velvet_voice', name: 'Velvet Voice Disease', severity: 'minor', scope: 'national',
                description: 'Voice becoming unnaturally smooth and hypnotic',
                effects: { happiness: -3, social_dynamics: -8, healthcare_cost: 38000 },
                cureRequirement: { money: 76000, time: 16, research_points: 4 }
            },
            { 
                id: 'prism_vision', name: 'Prism Vision Disorder', severity: 'minor', scope: 'national',
                description: 'Seeing rainbow fractures in all light',
                effects: { happiness: -6, visual_clarity: -15, healthcare_cost: 49000 },
                cureRequirement: { money: 98000, time: 23, research_points: 6 }
            },
            { 
                id: 'echo_bones', name: 'Echo Bones Syndrome', severity: 'minor', scope: 'national',
                description: 'Bones producing hollow sound effects',
                effects: { happiness: -4, stealth: -25, healthcare_cost: 40000 },
                cureRequirement: { money: 80000, time: 18, research_points: 4 }
            },
            { 
                id: 'liquid_logic', name: 'Liquid Logic Disease', severity: 'minor', scope: 'national',
                description: 'Rational thinking becoming fluid and unstable',
                effects: { happiness: -9, decision_making: -20, healthcare_cost: 60000 },
                cureRequirement: { money: 120000, time: 28, research_points: 9 }
            },
            { 
                id: 'paper_skin', name: 'Paper Skin Syndrome', severity: 'minor', scope: 'national',
                description: 'Skin becoming thin and translucent',
                effects: { happiness: -7, physical_protection: -22, healthcare_cost: 52000 },
                cureRequirement: { money: 104000, time: 25, research_points: 7 }
            },
            { 
                id: 'magnetic_madness', name: 'Magnetic Madness', severity: 'minor', scope: 'national',
                description: 'Uncontrollable attraction to metal objects',
                effects: { happiness: -6, technology_use: -18, healthcare_cost: 47000 },
                cureRequirement: { money: 94000, time: 21, research_points: 6 }
            },
            { 
                id: 'ghost_grip', name: 'Ghost Grip Disorder', severity: 'minor', scope: 'national',
                description: 'Hands occasionally becoming intangible',
                effects: { happiness: -8, object_manipulation: -25, healthcare_cost: 58000 },
                cureRequirement: { money: 116000, time: 27, research_points: 8 }
            },
            { 
                id: 'smoke_sight', name: 'Smoke Sight Disease', severity: 'minor', scope: 'national',
                description: 'Vision filled with constant smoke-like haze',
                effects: { happiness: -5, visual_range: -20, healthcare_cost: 44000 },
                cureRequirement: { money: 88000, time: 20, research_points: 5 }
            },
            { 
                id: 'thunder_tongue', name: 'Thunder Tongue Syndrome', severity: 'minor', scope: 'national',
                description: 'Voice producing thunder-like rumbles',
                effects: { happiness: -4, quiet_activities: -30, healthcare_cost: 41000 },
                cureRequirement: { money: 82000, time: 18, research_points: 4 }
            },
            { 
                id: 'starlight_sensitivity', name: 'Starlight Sensitivity', severity: 'minor', scope: 'national',
                description: 'Extreme reaction to nighttime starlight',
                effects: { happiness: -6, night_activities: -25, healthcare_cost: 50000 },
                cureRequirement: { money: 100000, time: 23, research_points: 6 }
            },
            { 
                id: 'honeyed_hearing', name: 'Honeyed Hearing Disease', severity: 'minor', scope: 'national',
                description: 'All sounds becoming unnaturally sweet',
                effects: { happiness: -3, audio_discrimination: -12, healthcare_cost: 37000 },
                cureRequirement: { money: 74000, time: 16, research_points: 3 }
            },
            { 
                id: 'clockface_syndrome', name: 'Clockface Syndrome', severity: 'minor', scope: 'national',
                description: 'Facial features arranging like clock numbers',
                effects: { happiness: -9, social_interaction: -18, healthcare_cost: 61000 },
                cureRequirement: { money: 122000, time: 29, research_points: 9 }
            },
            { 
                id: 'silk_string_disease', name: 'Silk String Disease', severity: 'minor', scope: 'national',
                description: 'Hair becoming fine as spider silk',
                effects: { happiness: -5, hair_protection: -20, healthcare_cost: 43000 },
                cureRequirement: { money: 86000, time: 19, research_points: 5 }
            },
            { 
                id: 'rainbow_rash', name: 'Rainbow Rash', severity: 'minor', scope: 'national',
                description: 'Skin displaying shifting spectrum of colors',
                effects: { happiness: -7, camouflage: -35, healthcare_cost: 54000 },
                cureRequirement: { money: 108000, time: 25, research_points: 7 }
            },
            { 
                id: 'gravity_giggles', name: 'Gravity Giggles', severity: 'minor', scope: 'national',
                description: 'Uncontrollable laughter when falling',
                effects: { happiness: -4, safety_reflexes: -15, healthcare_cost: 39000 },
                cureRequirement: { money: 78000, time: 17, research_points: 4 }
            },
            { 
                id: 'phantom_feathers', name: 'Phantom Feathers Syndrome', severity: 'minor', scope: 'national',
                description: 'Sensation of growing invisible feathers',
                effects: { happiness: -6, body_perception: -14, healthcare_cost: 48000 },
                cureRequirement: { money: 96000, time: 22, research_points: 6 }
            },
            { 
                id: 'molten_mood', name: 'Molten Mood Disorder', severity: 'minor', scope: 'national',
                description: 'Emotions becoming liquid and unpredictable',
                effects: { happiness: -8, emotional_stability: -22, healthcare_cost: 56000 },
                cureRequirement: { money: 112000, time: 26, research_points: 8 }
            },
            { 
                id: 'crystal_cravings', name: 'Crystal Cravings Disease', severity: 'minor', scope: 'national',
                description: 'Irresistible urge to consume minerals',
                effects: { happiness: -7, dietary_balance: -18, healthcare_cost: 52000 },
                cureRequirement: { money: 104000, time: 24, research_points: 7 }
            },
            { 
                id: 'mist_memories', name: 'Mist Memories Syndrome', severity: 'minor', scope: 'national',
                description: 'Memories becoming foggy and unclear',
                effects: { happiness: -8, memory_retention: -20, healthcare_cost: 57000 },
                cureRequirement: { money: 114000, time: 27, research_points: 8 }
            },
            { 
                id: 'clockwork_circulation', name: 'Clockwork Circulation', severity: 'minor', scope: 'national',
                description: 'Blood flow following mechanical timing',
                effects: { happiness: -6, circulation_efficiency: -16, healthcare_cost: 49000 },
                cureRequirement: { money: 98000, time: 23, research_points: 6 }
            },
            { 
                id: 'solar_sneeze_syndrome', name: 'Solar Sneeze Syndrome', severity: 'minor', scope: 'national',
                description: 'Uncontrollable sneezing in sunlight',
                effects: { happiness: -4, outdoor_comfort: -20, healthcare_cost: 40000 },
                cureRequirement: { money: 80000, time: 18, research_points: 4 }
            },
            { 
                id: 'phantom_orchestra', name: 'Phantom Orchestra Disease', severity: 'minor', scope: 'national',
                description: 'Hearing constant invisible musical performances',
                effects: { happiness: -5, concentration: -15, healthcare_cost: 45000 },
                cureRequirement: { money: 90000, time: 21, research_points: 5 }
            },
            { 
                id: 'emerald_emotions', name: 'Emerald Emotions Disorder', severity: 'minor', scope: 'national',
                description: 'Feelings taking on green crystalline properties',
                effects: { happiness: -7, emotional_flexibility: -18, healthcare_cost: 53000 },
                cureRequirement: { money: 106000, time: 25, research_points: 7 }
            },
            { 
                id: 'tide_touch', name: 'Tide Touch Syndrome', severity: 'minor', scope: 'national',
                description: 'Hands becoming wet with ocean water',
                effects: { happiness: -5, grip_stability: -14, healthcare_cost: 44000 },
                cureRequirement: { money: 88000, time: 20, research_points: 5 }
            },
            { 
                id: 'compass_confusion', name: 'Compass Confusion Disease', severity: 'minor', scope: 'national',
                description: 'Internal sense of direction constantly spinning',
                effects: { happiness: -6, navigation: -25, healthcare_cost: 47000 },
                cureRequirement: { money: 94000, time: 22, research_points: 6 }
            },
            { 
                id: 'silver_speech', name: 'Silver Speech Syndrome', severity: 'minor', scope: 'national',
                description: 'Words carrying metallic resonance',
                effects: { happiness: -3, vocal_clarity: -10, healthcare_cost: 36000 },
                cureRequirement: { money: 72000, time: 15, research_points: 3 }
            },
            { 
                id: 'dream_drift', name: 'Dream Drift Disease', severity: 'minor', scope: 'national',
                description: 'Consciousness floating between sleep and wake',
                effects: { happiness: -9, alertness: -20, healthcare_cost: 59000 },
                cureRequirement: { money: 118000, time: 28, research_points: 9 }
            },
            { 
                id: 'lightning_limbs', name: 'Lightning Limbs Disorder', severity: 'minor', scope: 'national',
                description: 'Arms and legs occasionally sparking with electricity',
                effects: { happiness: -7, technology_safety: -18, healthcare_cost: 54000 },
                cureRequirement: { money: 108000, time: 25, research_points: 7 }
            },
            { 
                id: 'aurora_appetite', name: 'Aurora Appetite Syndrome', severity: 'minor', scope: 'national',
                description: 'Craving foods with aurora-like colors',
                effects: { happiness: -4, nutritional_balance: -12, healthcare_cost: 38000 },
                cureRequirement: { money: 76000, time: 17, research_points: 4 }
            },
            { 
                id: 'phantom_percussion', name: 'Phantom Percussion Disease', severity: 'minor', scope: 'national',
                description: 'Hearing drumbeats from invisible instruments',
                effects: { happiness: -6, sleep_quality: -16, healthcare_cost: 48000 },
                cureRequirement: { money: 96000, time: 22, research_points: 6 }
            },
            { 
                id: 'metamorphic_moods', name: 'Metamorphic Moods', severity: 'minor', scope: 'national',
                description: 'Emotions literally transforming personality',
                effects: { happiness: -8, identity_consistency: -20, healthcare_cost: 55000 },
                cureRequirement: { money: 110000, time: 26, research_points: 8 }
            },
            { 
                id: 'celestial_circulation', name: 'Celestial Circulation Syndrome', severity: 'minor', scope: 'national',
                description: 'Blood flow following astronomical patterns',
                effects: { happiness: -5, physiological_rhythm: -15, healthcare_cost: 43000 },
                cureRequirement: { money: 86000, time: 20, research_points: 5 }
            },
            { 
                id: 'gossamer_grief', name: 'Gossamer Grief Disease', severity: 'minor', scope: 'national',
                description: 'Sadness becoming light and translucent',
                effects: { happiness: -7, emotional_depth: -14, healthcare_cost: 51000 },
                cureRequirement: { money: 102000, time: 24, research_points: 7 }
            },
            { 
                id: 'prismatic_pain', name: 'Prismatic Pain Disorder', severity: 'minor', scope: 'national',
                description: 'Pain splitting into rainbow spectrum sensations',
                effects: { happiness: -6, pain_management: -18, healthcare_cost: 49000 },
                cureRequirement: { money: 98000, time: 23, research_points: 6 }
            },
            { 
                id: 'temporal_taste_buds', name: 'Temporal Taste Buds', severity: 'minor', scope: 'national',
                description: 'Tasting flavors from past and future',
                effects: { happiness: -4, present_focus: -12, healthcare_cost: 40000 },
                cureRequirement: { money: 80000, time: 18, research_points: 4 }
            },
            { 
                id: 'phantom_piano_fingers', name: 'Phantom Piano Fingers', severity: 'minor', scope: 'national',
                description: 'Fingers constantly playing invisible piano keys',
                effects: { happiness: -5, manual_tasks: -16, healthcare_cost: 44000 },
                cureRequirement: { money: 88000, time: 21, research_points: 5 }
            },
            { 
                id: 'crystalline_cries', name: 'Crystalline Cries Syndrome', severity: 'minor', scope: 'national',
                description: 'Vocal expressions creating crystal formations',
                effects: { happiness: -7, vocal_freedom: -20, healthcare_cost: 52000 },
                cureRequirement: { money: 104000, time: 24, research_points: 7 }
            },
            { 
                id: 'lunar_laughter', name: 'Lunar Laughter Disease', severity: 'minor', scope: 'national',
                description: 'Uncontrollable laughter during moon phases',
                effects: { happiness: -3, social_appropriateness: -15, healthcare_cost: 35000 },
                cureRequirement: { money: 70000, time: 16, research_points: 3 }
            },
            { 
                id: 'mercury_memory', name: 'Mercury Memory Disorder', severity: 'minor', scope: 'national',
                description: 'Memories flowing like liquid metal',
                effects: { happiness: -8, memory_stability: -22, healthcare_cost: 56000 },
                cureRequirement: { money: 112000, time: 26, research_points: 8 }
            },
            { 
                id: 'sapphire_sadness', name: 'Sapphire Sadness Syndrome', severity: 'minor', scope: 'national',
                description: 'Melancholy taking on blue crystalline hardness',
                effects: { happiness: -9, emotional_recovery: -18, healthcare_cost: 58000 },
                cureRequirement: { money: 116000, time: 27, research_points: 8 }
            },
            { 
                id: 'whispering_wounds', name: 'Whispering Wounds Disease', severity: 'minor', scope: 'national',
                description: 'Injuries that speak about their pain',
                effects: { happiness: -6, healing_peace: -16, healthcare_cost: 47000 },
                cureRequirement: { money: 94000, time: 22, research_points: 6 }
            },
            { 
                id: 'floating_fears', name: 'Floating Fears Disorder', severity: 'minor', scope: 'national',
                description: 'Anxieties becoming weightless and drifting',
                effects: { happiness: -7, fear_grounding: -20, healthcare_cost: 53000 },
                cureRequirement: { money: 106000, time: 25, research_points: 7 }
            },
            { 
                id: 'golden_gravity', name: 'Golden Gravity Syndrome', severity: 'minor', scope: 'national',
                description: 'Personal gravitational field with golden tint',
                effects: { happiness: -5, object_interaction: -14, healthcare_cost: 45000 },
                cureRequirement: { money: 90000, time: 21, research_points: 5 }
            },
            { 
                id: 'ethereal_exhaustion', name: 'Ethereal Exhaustion Disease', severity: 'minor', scope: 'national',
                description: 'Fatigue that makes body semi-transparent',
                effects: { happiness: -8, physical_presence: -18, healthcare_cost: 57000 },
                cureRequirement: { money: 114000, time: 27, research_points: 8 }
            },
            { 
                id: 'harmonic_headaches', name: 'Harmonic Headaches', severity: 'minor', scope: 'national',
                description: 'Head pain creating musical chord progressions',
                effects: { happiness: -6, concentration: -17, healthcare_cost: 50000 },
                cureRequirement: { money: 100000, time: 23, research_points: 6 }
            },
            { 
                id: 'dimensional_dizziness', name: 'Dimensional Dizziness Disorder', severity: 'minor', scope: 'national',
                description: 'Vertigo from glimpsing parallel dimensions',
                effects: { happiness: -7, reality_stability: -19, healthcare_cost: 54000 },
                cureRequirement: { money: 108000, time: 25, research_points: 7 }
            },
            { 
                id: 'plasma_pulse', name: 'Plasma Pulse Syndrome', severity: 'minor', scope: 'national',
                description: 'Heartbeat generating plasma-like energy',
                effects: { happiness: -4, electrical_sensitivity: -15, healthcare_cost: 41000 },
                cureRequirement: { money: 82000, time: 19, research_points: 4 }
            },
            { 
                id: 'fractal_feelings', name: 'Fractal Feelings Disease', severity: 'minor', scope: 'national',
                description: 'Emotions creating infinite recursive patterns',
                effects: { happiness: -9, emotional_simplicity: -25, healthcare_cost: 60000 },
                cureRequirement: { money: 120000, time: 28, research_points: 9 }
            },
            { 
                id: 'quantum_quiver', name: 'Quantum Quiver Disorder', severity: 'minor', scope: 'national',
                description: 'Body vibrating at quantum frequencies',
                effects: { happiness: -5, physical_stability: -16, healthcare_cost: 46000 },
                cureRequirement: { money: 92000, time: 21, research_points: 5 }
            },
            { 
                id: 'stellar_stuttering', name: 'Stellar Stuttering Syndrome', severity: 'minor', scope: 'national',
                description: 'Speech patterns following stellar pulsations',
                effects: { happiness: -6, communication_flow: -18, healthcare_cost: 48000 },
                cureRequirement: { money: 96000, time: 22, research_points: 6 }
            },
            { 
                id: 'nebula_nightmares', name: 'Nebula Nightmares Disease', severity: 'minor', scope: 'national',
                description: 'Dreams filled with cosmic gas clouds',
                effects: { happiness: -7, sleep_restfulness: -20, healthcare_cost: 51000 },
                cureRequirement: { money: 102000, time: 24, research_points: 7 }
            },
            { 
                id: 'cosmic_coordination_loss', name: 'Cosmic Coordination Loss', severity: 'minor', scope: 'national',
                description: 'Motor skills affected by galactic alignment',
                effects: { happiness: -6, coordination: -22, healthcare_cost: 49000 },
                cureRequirement: { money: 98000, time: 23, research_points: 6 }
            },
            { 
                id: 'astral_arthritis', name: 'Astral Arthritis Syndrome', severity: 'minor', scope: 'national',
                description: 'Joint pain extending into spiritual dimensions',
                effects: { happiness: -8, mobility: -19, healthcare_cost: 55000 },
                cureRequirement: { money: 110000, time: 26, research_points: 8 }
            }
        ],
        major: [
            { 
                id: 'crimson_plague', name: 'Crimson Plague', severity: 'major', scope: 'national',
                description: 'Severe blood-borne pathogen causing organ failure',
                effects: { happiness: -25, productivity: -40, population_growth: -30, healthcare_cost: 500000 },
                cureRequirement: { money: 2000000, time: 120, research_points: 50 }
            },
            { 
                id: 'void_sickness', name: 'Void Sickness', severity: 'major', scope: 'national',
                description: 'Mysterious disease causing cellular breakdown',
                effects: { happiness: -30, productivity: -50, population_growth: -40, healthcare_cost: 600000 },
                cureRequirement: { money: 2500000, time: 150, research_points: 60 }
            },
            { 
                id: 'crystal_curse', name: 'Crystal Curse', severity: 'major', scope: 'national',
                description: 'Disease causing crystalline growths in organs',
                effects: { happiness: -20, productivity: -35, mineral_output: -25, healthcare_cost: 450000 },
                cureRequirement: { money: 1800000, time: 100, research_points: 45 }
            },
            { 
                id: 'shadow_blight', name: 'Shadow Blight', severity: 'major', scope: 'national',
                description: 'Neurological disease affecting cognitive functions',
                effects: { happiness: -35, research_speed: -40, education: -20, healthcare_cost: 700000 },
                cureRequirement: { money: 3000000, time: 180, research_points: 70 }
            },
            { 
                id: 'iron_rot', name: 'Iron Rot', severity: 'major', scope: 'national',
                description: 'Disease affecting metal metabolism in body',
                effects: { happiness: -22, productivity: -38, iron_production: -30, healthcare_cost: 520000 },
                cureRequirement: { money: 2200000, time: 130, research_points: 55 }
            },
            { 
                id: 'flame_fever', name: 'Flame Fever', severity: 'major', scope: 'national',
                description: 'High-temperature disease causing internal burning',
                effects: { happiness: -28, productivity: -45, energy_consumption: 20, healthcare_cost: 580000 },
                cureRequirement: { money: 2400000, time: 140, research_points: 58 }
            },
            { 
                id: 'frost_lung', name: 'Frost Lung', severity: 'major', scope: 'national',
                description: 'Respiratory disease causing hypothermic reactions',
                effects: { happiness: -24, productivity: -42, food_consumption: 25, healthcare_cost: 550000 },
                cureRequirement: { money: 2300000, time: 135, research_points: 57 }
            },
            { 
                id: 'storm_sickness', name: 'Storm Sickness', severity: 'major', scope: 'national',
                description: 'Electromagnetic sensitivity causing neural disruption',
                effects: { happiness: -26, productivity: -40, technology_efficiency: -15, healthcare_cost: 560000 },
                cureRequirement: { money: 2350000, time: 125, research_points: 52 }
            },
            { 
                id: 'titan_plague', name: 'Titan Plague', severity: 'major', scope: 'national',
                description: 'Gigantism-inducing viral infection',
                effects: { happiness: -23, food_consumption: 35, infrastructure_damage: -20, healthcare_cost: 530000 },
                cureRequirement: { money: 2250000, time: 115, research_points: 50 }
            },
            { 
                id: 'mind_melt', name: 'Mind Melt Syndrome', severity: 'major', scope: 'national',
                description: 'Psychoactive disease causing cognitive breakdown',
                effects: { happiness: -32, education: -25, research_speed: -35, healthcare_cost: 620000 },
                cureRequirement: { money: 2650000, time: 155, research_points: 62 }
            },
            { 
                id: 'bone_rot', name: 'Bone Rot Disease', severity: 'major', scope: 'national',
                description: 'Skeletal deterioration causing structural collapse',
                effects: { happiness: -29, productivity: -45, construction_efficiency: -30, healthcare_cost: 590000 },
                cureRequirement: { money: 2450000, time: 145, research_points: 58 }
            },
            { 
                id: 'blood_crystal_syndrome', name: 'Blood Crystal Syndrome', severity: 'major', scope: 'national',
                description: 'Crystallization of blood causing circulatory failure',
                effects: { happiness: -35, population_growth: -45, productivity: -50, healthcare_cost: 720000 },
                cureRequirement: { money: 2950000, time: 175, research_points: 75 }
            },
            { 
                id: 'soul_drain_epidemic', name: 'Soul Drain Epidemic', severity: 'major', scope: 'national',
                description: 'Spiritual energy depletion causing existential crisis',
                effects: { happiness: -40, creativity: -35, cultural_production: -25, healthcare_cost: 750000 },
                cureRequirement: { money: 3100000, time: 185, research_points: 78 }
            },
            { 
                id: 'time_sickness', name: 'Temporal Displacement Sickness', severity: 'major', scope: 'national',
                description: 'Chronological desynchronization affecting aging',
                effects: { happiness: -27, population_stability: -30, research_coherence: -20, healthcare_cost: 570000 },
                cureRequirement: { money: 2400000, time: 135, research_points: 55 }
            },
            { 
                id: 'gravity_madness', name: 'Gravitational Madness', severity: 'major', scope: 'national',
                description: 'Altered gravity perception causing mass hysteria',
                effects: { happiness: -31, transportation: -25, construction: -20, healthcare_cost: 610000 },
                cureRequirement: { money: 2550000, time: 150, research_points: 60 }
            },
            { 
                id: 'digital_decay', name: 'Digital Decay Syndrome', severity: 'major', scope: 'national',
                description: 'Technology-induced neural deterioration',
                effects: { happiness: -28, technology_efficiency: -40, communication: -30, healthcare_cost: 580000 },
                cureRequirement: { money: 2450000, time: 140, research_points: 57 }
            },
            { 
                id: 'elemental_imbalance', name: 'Elemental Imbalance Disease', severity: 'major', scope: 'national',
                description: 'Disruption of bodily elemental harmony',
                effects: { happiness: -26, environmental_stability: -35, agriculture: -25, healthcare_cost: 560000 },
                cureRequirement: { money: 2350000, time: 130, research_points: 53 }
            },
            { 
                id: 'nightmare_plague', name: 'Nightmare Plague', severity: 'major', scope: 'national',
                description: 'Shared nightmares causing sleep deprivation epidemic',
                effects: { happiness: -33, productivity: -55, mental_health: -40, healthcare_cost: 660000 },
                cureRequirement: { money: 2750000, time: 165, research_points: 68 }
            },
            { 
                id: 'mirror_syndrome', name: 'Mirror Syndrome', severity: 'major', scope: 'national',
                description: 'Reality distortion causing identity fragmentation',
                effects: { happiness: -34, social_cohesion: -45, law_enforcement: -30, healthcare_cost: 680000 },
                cureRequirement: { money: 2850000, time: 170, research_points: 70 }
            },
            { 
                id: 'echo_madness', name: 'Echo Madness', severity: 'major', scope: 'national',
                description: 'Auditory hallucinations creating mass paranoia',
                effects: { happiness: -30, communication: -35, social_trust: -25, healthcare_cost: 600000 },
                cureRequirement: { money: 2500000, time: 145, research_points: 58 }
            },
            { 
                id: 'phantom_limb_epidemic', name: 'Phantom Limb Epidemic', severity: 'major', scope: 'national',
                description: 'Mass sensation of missing body parts',
                effects: { happiness: -25, productivity: -38, medical_resources: -20, healthcare_cost: 520000 },
                cureRequirement: { money: 2200000, time: 120, research_points: 48 }
            },
            { 
                id: 'color_blindness_plague', name: 'Total Color Blindness Plague', severity: 'major', scope: 'national',
                description: 'Complete loss of color vision across population',
                effects: { happiness: -22, art_culture: -50, transportation_safety: -15, healthcare_cost: 480000 },
                cureRequirement: { money: 2000000, time: 110, research_points: 45 }
            },
            { 
                id: 'memory_erosion', name: 'Memory Erosion Disease', severity: 'major', scope: 'national',
                description: 'Progressive loss of collective memory',
                effects: { happiness: -36, education: -40, cultural_continuity: -60, healthcare_cost: 720000 },
                cureRequirement: { money: 3000000, time: 180, research_points: 75 }
            },
            { 
                id: 'sensory_overload_syndrome', name: 'Sensory Overload Syndrome', severity: 'major', scope: 'national',
                description: 'Overwhelming hypersensitivity to all stimuli',
                effects: { happiness: -37, productivity: -60, social_interaction: -50, healthcare_cost: 740000 },
                cureRequirement: { money: 3050000, time: 185, research_points: 78 }
            },
            { 
                id: 'black_death_strain', name: 'Black Death Strain', severity: 'major', scope: 'national',
                description: 'Virulent plague strain similar to medieval pandemic',
                effects: { happiness: -40, productivity: -60, population_growth: -50, healthcare_cost: 800000 },
                cureRequirement: { money: 3500000, time: 200, research_points: 80 }
            },
            { 
                id: 'spanish_flu_variant', name: 'Spanish Flu Variant', severity: 'major', scope: 'national',
                description: 'Mutated influenza with high mortality rate',
                effects: { happiness: -32, productivity: -55, population_growth: -45, healthcare_cost: 650000 },
                cureRequirement: { money: 2800000, time: 160, research_points: 65 }
            },
            { 
                id: 'justinian_plague', name: 'Justinian Plague', severity: 'major', scope: 'national',
                description: 'Ancient plague strain from Byzantine era',
                effects: { happiness: -35, productivity: -50, trade_efficiency: -25, healthcare_cost: 700000 },
                cureRequirement: { money: 3000000, time: 170, research_points: 70 }
            },
            { 
                id: 'london_pestilence', name: 'London Pestilence', severity: 'major', scope: 'national',
                description: 'Great Plague variant with urban focus',
                effects: { happiness: -30, productivity: -48, urban_development: -20, healthcare_cost: 620000 },
                cureRequirement: { money: 2600000, time: 155, research_points: 62 }
            },
            { 
                id: 'third_pandemic', name: 'Third Pandemic Strain', severity: 'major', scope: 'national',
                description: 'Modern plague pandemic variant',
                effects: { happiness: -28, productivity: -45, shipping: -30, healthcare_cost: 580000 },
                cureRequirement: { money: 2400000, time: 145, research_points: 58 }
            },
            { 
                id: 'antonine_plague', name: 'Antonine Plague', severity: 'major', scope: 'national',
                description: 'Ancient Roman pandemic strain',
                effects: { happiness: -33, productivity: -52, military_efficiency: -20, healthcare_cost: 680000 },
                cureRequirement: { money: 2900000, time: 165, research_points: 68 }
            },
            { 
                id: 'cyprian_plague', name: 'Cyprian Plague', severity: 'major', scope: 'national',
                description: 'Crisis of Third Century pandemic',
                effects: { happiness: -31, productivity: -49, government_stability: -15, healthcare_cost: 640000 },
                cureRequirement: { money: 2700000, time: 158, research_points: 64 }
            },
            { 
                id: 'plague_of_athens', name: 'Plague of Athens', severity: 'major', scope: 'national',
                description: 'Ancient Athenian epidemic during Peloponnesian War',
                effects: { happiness: -29, military_morale: -25, intellectual_output: -20, healthcare_cost: 600000 },
                cureRequirement: { money: 2500000, time: 150, research_points: 60 }
            },
            { 
                id: 'sweating_death', name: 'English Sweating Death', severity: 'major', scope: 'national',
                description: 'Severe variant of Tudor sweating sickness',
                effects: { happiness: -27, nobility_survival: -30, court_efficiency: -25, healthcare_cost: 570000 },
                cureRequirement: { money: 2400000, time: 145, research_points: 58 }
            },
            { 
                id: 'dancing_death', name: 'Dancing Death of 1518', severity: 'major', scope: 'national',
                description: 'Fatal dancing mania in Strasbourg',
                effects: { happiness: -25, social_order: -40, economic_disruption: -35, healthcare_cost: 530000 },
                cureRequirement: { money: 2200000, time: 135, research_points: 55 }
            },
            { 
                id: 'great_mortality', name: 'Great Mortality', severity: 'major', scope: 'national',
                description: 'Medieval name for catastrophic plague outbreaks',
                effects: { happiness: -38, population_growth: -55, agricultural_output: -40, healthcare_cost: 760000 },
                cureRequirement: { money: 3200000, time: 190, research_points: 80 }
            },
            { 
                id: 'pest_of_justinian', name: 'Pest of Justinian', severity: 'major', scope: 'national',
                description: 'First recorded bubonic plague pandemic',
                effects: { happiness: -36, trade_networks: -45, urban_population: -50, healthcare_cost: 720000 },
                cureRequirement: { money: 3000000, time: 175, research_points: 75 }
            },
            { 
                id: 'great_pox', name: 'Great Pox Epidemic', severity: 'major', scope: 'national',
                description: 'Severe syphilis outbreak in Renaissance Europe',
                effects: { happiness: -24, birth_rates: -35, social_morality: -20, healthcare_cost: 500000 },
                cureRequirement: { money: 2100000, time: 125, research_points: 50 }
            },
            { 
                id: 'yellow_death', name: 'Yellow Death', severity: 'major', scope: 'national',
                description: 'Severe yellow fever epidemic in tropical regions',
                effects: { happiness: -28, colonial_expansion: -40, military_expeditions: -35, healthcare_cost: 580000 },
                cureRequirement: { money: 2450000, time: 140, research_points: 58 }
            },
            { 
                id: 'camp_fever', name: 'Camp Fever Epidemic', severity: 'major', scope: 'national',
                description: 'Typhus outbreak in military conditions',
                effects: { happiness: -26, military_effectiveness: -45, war_capacity: -30, healthcare_cost: 550000 },
                cureRequirement: { money: 2350000, time: 135, research_points: 55 }
            },
            { 
                id: 'ship_fever', name: 'Ship Fever Pandemic', severity: 'major', scope: 'national',
                description: 'Maritime typhus affecting global trade',
                effects: { happiness: -23, maritime_trade: -50, naval_power: -35, healthcare_cost: 480000 },
                cureRequirement: { money: 2000000, time: 120, research_points: 48 }
            },
            { 
                id: 'jail_fever', name: 'Jail Fever Outbreak', severity: 'major', scope: 'national',
                description: 'Prison typhus spreading to general population',
                effects: { happiness: -30, law_enforcement: -25, judicial_system: -20, healthcare_cost: 600000 },
                cureRequirement: { money: 2500000, time: 150, research_points: 60 }
            },
            { 
                id: 'wasting_disease', name: 'Great Wasting Disease', severity: 'major', scope: 'national',
                description: 'Chronic malnutrition epidemic causing mass weakness',
                effects: { happiness: -32, agricultural_productivity: -45, physical_labor: -40, healthcare_cost: 640000 },
                cureRequirement: { money: 2700000, time: 160, research_points: 65 }
            },
            { 
                id: 'bone_ache', name: 'Bone Ache Epidemic', severity: 'major', scope: 'national',
                description: 'Dengue fever causing severe joint pain',
                effects: { happiness: -21, manual_labor: -35, mobility: -30, healthcare_cost: 440000 },
                cureRequirement: { money: 1850000, time: 115, research_points: 45 }
            },
            { 
                id: 'strangers_disease', name: "Stranger's Disease", severity: 'major', scope: 'national',
                description: 'Smallpox epidemic among indigenous populations',
                effects: { happiness: -39, cultural_survival: -60, population_growth: -70, healthcare_cost: 780000 },
                cureRequirement: { money: 3300000, time: 200, research_points: 85 }
            },
            { 
                id: 'consumption_of_the_lungs', name: 'Consumption of the Lungs', severity: 'major', scope: 'national',
                description: 'Severe tuberculosis epidemic in industrial cities',
                effects: { happiness: -34, industrial_output: -40, urban_health: -50, healthcare_cost: 680000 },
                cureRequirement: { money: 2850000, time: 170, research_points: 70 }
            },
            { 
                id: 'void_consumption', name: 'Void Consumption', severity: 'major', scope: 'national',
                description: 'Dark energy eating away at life force',
                effects: { happiness: -45, vitality: -60, existential_dread: 40, healthcare_cost: 850000 },
                cureRequirement: { money: 3600000, time: 210, research_points: 90 }
            },
            { 
                id: 'temporal_tuberculosis', name: 'Temporal Tuberculosis', severity: 'major', scope: 'national',
                description: 'Lung disease that ages victims rapidly',
                effects: { happiness: -38, aging_acceleration: 300, productivity: -55, healthcare_cost: 750000 },
                cureRequirement: { money: 3200000, time: 180, research_points: 80 }
            },
            { 
                id: 'crystalline_cancer', name: 'Crystalline Cancer', severity: 'major', scope: 'national',
                description: 'Malignant growths forming crystal structures',
                effects: { happiness: -42, mineral_metabolism: -45, body_integrity: -50, healthcare_cost: 820000 },
                cureRequirement: { money: 3500000, time: 200, research_points: 85 }
            },
            { 
                id: 'astral_anemia', name: 'Astral Anemia', severity: 'major', scope: 'national',
                description: 'Spiritual energy deficiency causing physical weakness',
                effects: { happiness: -35, spiritual_health: -55, physical_strength: -40, healthcare_cost: 700000 },
                cureRequirement: { money: 3000000, time: 170, research_points: 75 }
            },
            { 
                id: 'quantum_quarantine_syndrome', name: 'Quantum Quarantine Syndrome', severity: 'major', scope: 'national',
                description: 'Particles in body existing in multiple states simultaneously',
                effects: { happiness: -40, physical_coherence: -50, quantum_stability: -60, healthcare_cost: 780000 },
                cureRequirement: { money: 3300000, time: 185, research_points: 82 }
            },
            { 
                id: 'metamorphic_meltdown', name: 'Metamorphic Meltdown', severity: 'major', scope: 'national',
                description: 'Uncontrolled physical transformation disease',
                effects: { happiness: -48, identity_stability: -65, social_integration: -55, healthcare_cost: 900000 },
                cureRequirement: { money: 3800000, time: 220, research_points: 95 }
            },
            { 
                id: 'plasma_poisoning', name: 'Plasma Poisoning Pandemic', severity: 'major', scope: 'national',
                description: 'Blood turning into superheated plasma state',
                effects: { happiness: -50, circulation: -70, temperature_regulation: -60, healthcare_cost: 950000 },
                cureRequirement: { money: 4000000, time: 230, research_points: 100 }
            },
            { 
                id: 'holographic_hepatitis', name: 'Holographic Hepatitis', severity: 'major', scope: 'national',
                description: 'Liver disease creating false organ projections',
                effects: { happiness: -36, organ_reliability: -45, medical_diagnosis: -35, healthcare_cost: 720000 },
                cureRequirement: { money: 3100000, time: 175, research_points: 78 }
            },
            { 
                id: 'fractal_fever', name: 'Fractal Fever Syndrome', severity: 'major', scope: 'national',
                description: 'Temperature creating infinite recursive patterns in body',
                effects: { happiness: -44, thermal_regulation: -55, pattern_recognition: -40, healthcare_cost: 860000 },
                cureRequirement: { money: 3700000, time: 215, research_points: 92 }
            },
            { 
                id: 'dimensional_diabetes', name: 'Dimensional Diabetes', severity: 'major', scope: 'national',
                description: 'Blood sugar existing across multiple dimensions',
                effects: { happiness: -33, metabolic_stability: -50, dimensional_anchoring: -30, healthcare_cost: 650000 },
                cureRequirement: { money: 2800000, time: 160, research_points: 70 }
            },
            { 
                id: 'ethereal_epilepsy', name: 'Ethereal Epilepsy', severity: 'major', scope: 'national',
                description: 'Seizures causing temporary dimensional phasing',
                effects: { happiness: -41, neurological_stability: -55, reality_coherence: -35, healthcare_cost: 800000 },
                cureRequirement: { money: 3400000, time: 190, research_points: 85 }
            },
            { 
                id: 'magnetic_malaria', name: 'Magnetic Malaria', severity: 'major', scope: 'national',
                description: 'Parasitic infection affecting magnetic field sensitivity',
                effects: { happiness: -37, navigation_ability: -45, technology_interaction: -40, healthcare_cost: 730000 },
                cureRequirement: { money: 3150000, time: 178, research_points: 79 }
            },
            { 
                id: 'sonic_sepsis', name: 'Sonic Sepsis Syndrome', severity: 'major', scope: 'national',
                description: 'Blood infection transmitting through sound waves',
                effects: { happiness: -39, auditory_health: -50, sound_sensitivity: 60, healthcare_cost: 760000 },
                cureRequirement: { money: 3250000, time: 182, research_points: 81 }
            },
            { 
                id: 'gravitational_gangrene', name: 'Gravitational Gangrene', severity: 'major', scope: 'national',
                description: 'Tissue death from altered gravity fields',
                effects: { happiness: -46, circulation: -60, mobility: -50, healthcare_cost: 880000 },
                cureRequirement: { money: 3750000, time: 218, research_points: 94 }
            },
            { 
                id: 'photonic_pneumonia', name: 'Photonic Pneumonia', severity: 'major', scope: 'national',
                description: 'Lung infection replacing air with light particles',
                effects: { happiness: -43, respiratory_function: -65, light_tolerance: -45, healthcare_cost: 840000 },
                cureRequirement: { money: 3600000, time: 205, research_points: 88 }
            },
            { 
                id: 'neural_necropolis', name: 'Neural Necropolis Disease', severity: 'major', scope: 'national',
                description: 'Brain cells forming undead neural networks',
                effects: { happiness: -52, cognitive_function: -70, death_resistance: -80, healthcare_cost: 1000000 },
                cureRequirement: { money: 4200000, time: 245, research_points: 105 }
            },
            { 
                id: 'spectral_scurvy', name: 'Spectral Scurvy', severity: 'major', scope: 'national',
                description: 'Vitamin deficiency affecting ghostly manifestations',
                effects: { happiness: -29, nutritional_processing: -40, spiritual_visibility: -50, healthcare_cost: 580000 },
                cureRequirement: { money: 2500000, time: 145, research_points: 62 }
            },
            { 
                id: 'atomic_arthritis', name: 'Atomic Arthritis Syndrome', severity: 'major', scope: 'national',
                description: 'Joint inflammation at subatomic level',
                effects: { happiness: -35, molecular_integrity: -45, joint_function: -55, healthcare_cost: 700000 },
                cureRequirement: { money: 3000000, time: 172, research_points: 76 }
            },
            { 
                id: 'cosmic_consumption', name: 'Cosmic Consumption', severity: 'major', scope: 'national',
                description: 'Stellar radiation causing internal burning',
                effects: { happiness: -47, radiation_resistance: -60, cellular_stability: -55, healthcare_cost: 920000 },
                cureRequirement: { money: 3900000, time: 225, research_points: 98 }
            },
            { 
                id: 'temporal_typhus', name: 'Temporal Typhus', severity: 'major', scope: 'national',
                description: 'Time-displaced fever causing chronological confusion',
                effects: { happiness: -38, time_perception: -50, historical_continuity: -40, healthcare_cost: 750000 },
                cureRequirement: { money: 3200000, time: 180, research_points: 80 }
            },
            { 
                id: 'quantum_cholera', name: 'Quantum Cholera', severity: 'major', scope: 'national',
                description: 'Digestive system existing in probability states',
                effects: { happiness: -42, digestive_certainty: -65, nutritional_absorption: -50, healthcare_cost: 820000 },
                cureRequirement: { money: 3500000, time: 200, research_points: 85 }
            },
            { 
                id: 'holographic_hemorrhage', name: 'Holographic Hemorrhage', severity: 'major', scope: 'national',
                description: 'Bleeding that creates false blood projections',
                effects: { happiness: -40, blood_integrity: -55, medical_treatment: -45, healthcare_cost: 780000 },
                cureRequirement: { money: 3300000, time: 188, research_points: 83 }
            },
            { 
                id: 'dimensional_dysentery', name: 'Dimensional Dysentery', severity: 'major', scope: 'national',
                description: 'Intestinal distress across multiple dimensions',
                effects: { happiness: -36, digestive_stability: -50, dimensional_coherence: -35, healthcare_cost: 710000 },
                cureRequirement: { money: 3050000, time: 174, research_points: 77 }
            },
            { 
                id: 'stellar_stroke', name: 'Stellar Stroke Syndrome', severity: 'major', scope: 'national',
                description: 'Brain damage from stellar radiation exposure',
                effects: { happiness: -45, neurological_function: -60, cosmic_awareness: -70, healthcare_cost: 870000 },
                cureRequirement: { money: 3700000, time: 212, research_points: 91 }
            },
            { 
                id: 'plasma_plague', name: 'Plasma Plague Pandemic', severity: 'major', scope: 'national',
                description: 'Infectious disease converting tissue to plasma',
                effects: { happiness: -49, tissue_integrity: -65, temperature_control: -60, healthcare_cost: 940000 },
                cureRequirement: { money: 4000000, time: 235, research_points: 100 }
            },
            { 
                id: 'gravitational_glaucoma', name: 'Gravitational Glaucoma', severity: 'major', scope: 'national',
                description: 'Eye pressure affected by gravity fluctuations',
                effects: { happiness: -32, vision_stability: -45, gravity_sensitivity: -50, healthcare_cost: 620000 },
                cureRequirement: { money: 2650000, time: 152, research_points: 67 }
            },
            { 
                id: 'electromagnetic_encephalitis', name: 'Electromagnetic Encephalitis', severity: 'major', scope: 'national',
                description: 'Brain inflammation from EM field exposure',
                effects: { happiness: -44, cognitive_processing: -55, electromagnetic_tolerance: -65, healthcare_cost: 850000 },
                cureRequirement: { money: 3600000, time: 208, research_points: 89 }
            },
            { 
                id: 'fractal_flu', name: 'Fractal Flu Syndrome', severity: 'major', scope: 'national',
                description: 'Influenza creating recursive symptom patterns',
                effects: { happiness: -37, immune_coherence: -50, pattern_resistance: -40, healthcare_cost: 740000 },
                cureRequirement: { money: 3150000, time: 176, research_points: 78 }
            },
            { 
                id: 'molecular_malignancy', name: 'Molecular Malignancy', severity: 'major', scope: 'national',
                description: 'Cancer affecting molecular structure itself',
                effects: { happiness: -51, molecular_stability: -70, cellular_integrity: -65, healthcare_cost: 980000 },
                cureRequirement: { money: 4100000, time: 240, research_points: 103 }
            },
            { 
                id: 'spectral_smallpox', name: 'Spectral Smallpox', severity: 'major', scope: 'national',
                description: 'Pox affecting both physical and spiritual bodies',
                effects: { happiness: -41, skin_integrity: -55, spiritual_health: -50, healthcare_cost: 800000 },
                cureRequirement: { money: 3400000, time: 195, research_points: 86 }
            },
            { 
                id: 'chrono_cardiac_arrest', name: 'Chrono Cardiac Arrest', severity: 'major', scope: 'national',
                description: 'Heart stopping and starting across different timelines',
                effects: { happiness: -43, cardiovascular_stability: -60, temporal_coherence: -45, healthcare_cost: 830000 },
                cureRequirement: { money: 3550000, time: 202, research_points: 87 }
            },
            { 
                id: 'void_vertigo', name: 'Void Vertigo Syndrome', severity: 'major', scope: 'national',
                description: 'Balance disorder from perceiving cosmic emptiness',
                effects: { happiness: -39, balance: -55, existential_stability: -50, healthcare_cost: 770000 },
                cureRequirement: { money: 3280000, time: 186, research_points: 82 }
            },
            { 
                id: 'antimatter_aneurysm', name: 'Antimatter Aneurysm', severity: 'major', scope: 'national',
                description: 'Blood vessels containing antimatter particles',
                effects: { happiness: -48, vascular_integrity: -65, matter_stability: -60, healthcare_cost: 920000 },
                cureRequirement: { money: 3900000, time: 228, research_points: 97 }
            },
            { 
                id: 'holographic_hepatosis', name: 'Holographic Hepatosis', severity: 'major', scope: 'national',
                description: 'Liver function replaced by light projections',
                effects: { happiness: -35, metabolic_processing: -50, organ_reliability: -55, healthcare_cost: 690000 },
                cureRequirement: { money: 2950000, time: 168, research_points: 74 }
            },
            { 
                id: 'quantum_kidney_failure', name: 'Quantum Kidney Failure', severity: 'major', scope: 'national',
                description: 'Kidneys existing in superposition states',
                effects: { happiness: -42, filtration_certainty: -60, quantum_biology: -55, healthcare_cost: 810000 },
                cureRequirement: { money: 3450000, time: 198, research_points: 85 }
            },
            { 
                id: 'stellar_septicemia', name: 'Stellar Septicemia', severity: 'major', scope: 'national',
                description: 'Blood poisoning from cosmic radiation',
                effects: { happiness: -46, blood_purity: -65, radiation_tolerance: -50, healthcare_cost: 890000 },
                cureRequirement: { money: 3780000, time: 220, research_points: 95 }
            },
            { 
                id: 'dimensional_dementia', name: 'Dimensional Dementia', severity: 'major', scope: 'national',
                description: 'Memory loss across parallel dimensions',
                effects: { happiness: -44, memory_coherence: -70, dimensional_awareness: -60, healthcare_cost: 860000 },
                cureRequirement: { money: 3650000, time: 210, research_points: 90 }
            },
            { 
                id: 'fractal_fibromyalgia', name: 'Fractal Fibromyalgia', severity: 'major', scope: 'national',
                description: 'Pain creating infinite recursive patterns',
                effects: { happiness: -38, pain_management: -60, pattern_tolerance: -45, healthcare_cost: 750000 },
                cureRequirement: { money: 3200000, time: 182, research_points: 80 }
            },
            { 
                id: 'plasma_paralysis', name: 'Plasma Paralysis Pandemic', severity: 'major', scope: 'national',
                description: 'Nervous system converting to plasma state',
                effects: { happiness: -50, neural_function: -75, mobility: -70, healthcare_cost: 970000 },
                cureRequirement: { money: 4150000, time: 242, research_points: 102 }
            },
            { 
                id: 'temporal_tetanus', name: 'Temporal Tetanus', severity: 'major', scope: 'national',
                description: 'Muscle spasms across multiple time periods',
                effects: { happiness: -41, muscular_control: -65, temporal_stability: -40, healthcare_cost: 800000 },
                cureRequirement: { money: 3400000, time: 194, research_points: 86 }
            },
            { 
                id: 'cosmic_carcinoma', name: 'Cosmic Carcinoma Complex', severity: 'major', scope: 'national',
                description: 'Cancer cells influenced by galactic forces',
                effects: { happiness: -47, cellular_control: -70, cosmic_resistance: -55, healthcare_cost: 900000 },
                cureRequirement: { money: 3850000, time: 224, research_points: 96 }
            },
            { 
                id: 'ethereal_endocarditis', name: 'Ethereal Endocarditis', severity: 'major', scope: 'national',
                description: 'Heart infection affecting spiritual dimensions',
                effects: { happiness: -40, cardiac_function: -60, spiritual_health: -50, healthcare_cost: 780000 },
                cureRequirement: { money: 3320000, time: 190, research_points: 83 }
            },
            { 
                id: 'gravitational_gastritis', name: 'Gravitational Gastritis', severity: 'major', scope: 'national',
                description: 'Stomach inflammation from gravity fluctuations',
                effects: { happiness: -34, digestive_stability: -55, gravity_tolerance: -45, healthcare_cost: 670000 },
                cureRequirement: { money: 2870000, time: 164, research_points: 72 }
            },
            { 
                id: 'magnetic_meningitis', name: 'Magnetic Meningitis', severity: 'major', scope: 'national',
                description: 'Brain membrane inflammation affecting magnetic sense',
                effects: { happiness: -45, neurological_protection: -65, magnetic_sensitivity: -60, healthcare_cost: 870000 },
                cureRequirement: { money: 3700000, time: 214, research_points: 92 }
            },
            { 
                id: 'photonic_phlebitis', name: 'Photonic Phlebitis', severity: 'major', scope: 'national',
                description: 'Vein inflammation from light particle exposure',
                effects: { happiness: -36, vascular_health: -55, light_processing: -50, healthcare_cost: 720000 },
                cureRequirement: { money: 3080000, time: 176, research_points: 77 }
            },
            { 
                id: 'quantum_quinsy', name: 'Quantum Quinsy', severity: 'major', scope: 'national',
                description: 'Throat infection existing in probability states',
                effects: { happiness: -33, respiratory_function: -50, quantum_coherence: -45, healthcare_cost: 650000 },
                cureRequirement: { money: 2780000, time: 158, research_points: 69 }
            },
            { 
                id: 'spectral_syphilis', name: 'Spectral Syphilis Syndrome', severity: 'major', scope: 'national',
                description: 'STD affecting both physical and ghostly forms',
                effects: { happiness: -39, reproductive_health: -60, spiritual_integrity: -55, healthcare_cost: 760000 },
                cureRequirement: { money: 3250000, time: 184, research_points: 81 }
            },
            { 
                id: 'dimensional_diphtheria', name: 'Dimensional Diphtheria', severity: 'major', scope: 'national',
                description: 'Throat disease spreading across dimensions',
                effects: { happiness: -37, breathing: -55, dimensional_barrier: -50, healthcare_cost: 730000 },
                cureRequirement: { money: 3150000, time: 180, research_points: 79 }
            },
            { 
                id: 'fractal_fascitis', name: 'Fractal Fascitis', severity: 'major', scope: 'national',
                description: 'Connective tissue inflammation in recursive patterns',
                effects: { happiness: -42, tissue_integrity: -65, pattern_stability: -40, healthcare_cost: 820000 },
                cureRequirement: { money: 3500000, time: 200, research_points: 85 }
            },
            { 
                id: 'holographic_hysteria', name: 'Holographic Hysteria', severity: 'major', scope: 'national',
                description: 'Mass psychological disorder creating false realities',
                effects: { happiness: -44, mental_stability: -70, reality_perception: -65, healthcare_cost: 850000 },
                cureRequirement: { money: 3600000, time: 206, research_points: 88 }
            },
            { 
                id: 'antimatter_autism', name: 'Antimatter Autism Spectrum', severity: 'major', scope: 'national',
                description: 'Neurological differences from antimatter exposure',
                effects: { happiness: -31, social_processing: -45, matter_interaction: -40, healthcare_cost: 610000 },
                cureRequirement: { money: 2600000, time: 148, research_points: 65 }
            },
            { 
                id: 'cosmic_cirrhosis', name: 'Cosmic Cirrhosis Complex', severity: 'major', scope: 'national',
                description: 'Liver scarring from stellar radiation',
                effects: { happiness: -38, liver_function: -60, radiation_processing: -55, healthcare_cost: 750000 },
                cureRequirement: { money: 3200000, time: 182, research_points: 80 }
            },
            { 
                id: 'temporal_thrombosis', name: 'Temporal Thrombosis', severity: 'major', scope: 'national',
                description: 'Blood clots forming across time periods',
                effects: { happiness: -43, circulation: -65, temporal_flow: -50, healthcare_cost: 840000 },
                cureRequirement: { money: 3580000, time: 204, research_points: 87 }
            },
            { 
                id: 'ethereal_eczema', name: 'Ethereal Eczema Epidemic', severity: 'major', scope: 'national',
                description: 'Skin condition affecting spiritual boundaries',
                effects: { happiness: -32, skin_barrier: -50, spiritual_protection: -45, healthcare_cost: 630000 },
                cureRequirement: { money: 2700000, time: 154, research_points: 68 }
            },
            { 
                id: 'plasma_psoriasis', name: 'Plasma Psoriasis Pandemic', severity: 'major', scope: 'national',
                description: 'Skin cells converting to plasma state',
                effects: { happiness: -40, skin_integrity: -65, temperature_regulation: -55, healthcare_cost: 790000 },
                cureRequirement: { money: 3350000, time: 192, research_points: 84 }
            }
        ]
    };
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.NATIONAL_DISEASES;
}
