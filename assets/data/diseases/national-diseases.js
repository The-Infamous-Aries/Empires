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
                effects: { population: -3, disease: 7 },
                cureRequirement: { money: 100000, time: 24, research_points: 5 }
            },
            { 
                id: 'azure_fever', name: 'Azure Fever', severity: 'minor', scope: 'national',
                description: 'Mild fever causing blue-tinted skin discoloration',
                effects: { environment: -1, military_morale: -3 },
                cureRequirement: { money: 80000, time: 18, research_points: 4 }
            },
            { 
                id: 'silver_shivers', name: 'Silver Shivers', severity: 'minor', scope: 'national',
                description: 'Temperature regulation disorder with metallic skin tone',
                effects: { happiness: -5, military_morale: -4 },
                cureRequirement: { money: 120000, time: 20, research_points: 6 }
            },
            { 
                id: 'golden_gastritis', name: 'Golden Gastritis', severity: 'minor', scope: 'national',
                description: 'Digestive disorder with yellowish symptoms',
                effects: { population: -5, military_morale: -1 },
                cureRequirement: { money: 90000, time: 16, research_points: 5 }
            },
            { 
                id: 'violet_vertigo', name: 'Violet Vertigo', severity: 'minor', scope: 'national',
                description: 'Balance disorder causing purple eye discoloration',
                effects: { happiness: -6, disease: 8 },
                cureRequirement: { money: 110000, time: 22, research_points: 7 }
            },
            { 
                id: 'emerald_exhaustion', name: 'Emerald Exhaustion', severity: 'minor', scope: 'national',
                description: 'Chronic fatigue with greenish complexion',
                effects: { disease: 7, population: -8 },
                cureRequirement: { money: 130000, time: 28, research_points: 8 }
            },
            { 
                id: 'copper_cramps', name: 'Copper Cramps', severity: 'minor', scope: 'national',
                description: 'Muscle disorder with bronze-colored inflammation',
                effects: { hospital_upkeep: 4, disease: 3 },
                cureRequirement: { money: 100000, time: 24, research_points: 6 }
            },
            { 
                id: 'ruby_rash', name: 'Ruby Rash', severity: 'minor', scope: 'national',
                description: 'Skin condition creating red crystalline patterns',
                effects: { happiness: -3, population: -3 },
                cureRequirement: { money: 140000, time: 30, research_points: 9 }
            },
            { 
                id: 'sapphire_syndrome', name: 'Sapphire Syndrome', severity: 'minor', scope: 'national',
                description: 'Neurological condition with blue-tinted vision',
                effects: { military_strength: -8, hospital_upkeep: 3 },
                cureRequirement: { money: 110000, time: 26, research_points: 7 }
            },
            { 
                id: 'obsidian_onset', name: 'Obsidian Onset', severity: 'minor', scope: 'national',
                description: 'Bone density disorder with dark discoloration',
                effects: { environment: -6, happiness: -3 },
                cureRequirement: { money: 120000, time: 32, research_points: 8 }
            },
            { 
                id: 'sweating_sickness', name: 'Sweating Sickness', severity: 'minor', scope: 'national',
                description: 'Historical fever disease from Tudor England',
                effects: { happiness: -7, environment: -7 },
                cureRequirement: { money: 110000, time: 20, research_points: 6 }
            },
            { 
                id: 'english_sweat', name: 'English Sweat', severity: 'minor', scope: 'national',
                description: 'Sudden onset fever with profuse sweating',
                effects: { happiness: -5, crime: 1 },
                cureRequirement: { money: 100000, time: 18, research_points: 5 }
            },
            { 
                id: 'dancing_mania', name: 'Dancing Mania', severity: 'minor', scope: 'national',
                description: 'Medieval mass psychogenic illness',
                effects: { happiness: -2, disease: 4 },
                cureRequirement: { money: 80000, time: 24, research_points: 4 }
            },
            { 
                id: 'kings_evil', name: "King's Evil", severity: 'minor', scope: 'national',
                description: 'Scrofula - tuberculous cervical lymphadenitis',
                effects: { military_morale: -8, disease: 3 },
                cureRequirement: { money: 90000, time: 16, research_points: 4 }
            },
            { 
                id: 'milk_sickness', name: 'Milk Sickness', severity: 'minor', scope: 'national',
                description: 'Poisoning from consuming contaminated dairy',
                effects: { disease: 5, crime: 2 },
                cureRequirement: { money: 120000, time: 22, research_points: 7 }
            },
            { 
                id: 'phossy_jaw', name: 'Phossy Jaw', severity: 'minor', scope: 'national',
                description: 'Occupational disease from phosphorus exposure',
                effects: { military_strength: -2, disease: 6 },
                cureRequirement: { money: 130000, time: 28, research_points: 8 }
            },
            { 
                id: 'radium_jaw', name: 'Radium Jaw', severity: 'minor', scope: 'national',
                description: 'Radiation poisoning affecting jaw bones',
                effects: { military_strength: -4, taxable_income: -7 },
                cureRequirement: { money: 140000, time: 30, research_points: 9 }
            },
            { 
                id: 'consumption', name: 'Consumption', severity: 'minor', scope: 'national',
                description: 'Historical name for pulmonary tuberculosis',
                effects: { crime: 4, military_strength: -3 },
                cureRequirement: { money: 110000, time: 26, research_points: 7 }
            },
            { 
                id: 'ergotism', name: 'Ergotism', severity: 'minor', scope: 'national',
                description: "St. Anthony's Fire caused by ergot-contaminated grain",
                effects: { disease: 6, crime: 8 },
                cureRequirement: { money: 150000, time: 34, research_points: 10 }
            },
            { 
                id: 'chlorosis', name: 'Chlorosis', severity: 'minor', scope: 'national',
                description: 'Green sickness affecting young women',
                effects: { military_strength: -7, hospital_upkeep: 7 },
                cureRequirement: { money: 90000, time: 20, research_points: 5 }
            },
            { 
                id: 'mal_de_ojo', name: 'Mal de Ojo', severity: 'minor', scope: 'national',
                description: 'Evil eye syndrome from cultural beliefs',
                effects: { environment: -8, population: -4 },
                cureRequirement: { money: 80000, time: 24, research_points: 4 }
            },
            { 
                id: 'tarantism', name: 'Tarantism', severity: 'minor', scope: 'national',
                description: 'Dancing disease attributed to spider bites',
                effects: { environment: -7, disease: 2 },
                cureRequirement: { money: 100000, time: 28, research_points: 6 }
            },
            { 
                id: 'lycanthropy', name: 'Lycanthropy Delusion', severity: 'minor', scope: 'national',
                description: 'Historical werewolf delusion disorder',
                effects: { hospital_upkeep: 6, taxable_income: -1 },
                cureRequirement: { money: 120000, time: 32, research_points: 8 }
            },
            { 
                id: 'windigo_psychosis', name: 'Windigo Psychosis', severity: 'minor', scope: 'national',
                description: 'Cannibalistic compulsion from indigenous folklore',
                effects: { happiness: -8, environment: -4 },
                cureRequirement: { money: 130000, time: 30, research_points: 9 }
            },
            { 
                id: 'grisi_siknis', name: 'Grisi Siknis', severity: 'minor', scope: 'national',
                description: 'Cultural syndrome with aggressive behavior',
                effects: { disease: 1, crime: 5 },
                cureRequirement: { money: 90000, time: 22, research_points: 6 }
            },
            { 
                id: 'latah', name: 'Latah Syndrome', severity: 'minor', scope: 'national',
                description: 'Exaggerated startle response from Malaysia',
                effects: { population: -3, hospital_upkeep: 4 },
                cureRequirement: { money: 70000, time: 18, research_points: 4 }
            },
            { 
                id: 'pibloktoq', name: 'Pibloktoq', severity: 'minor', scope: 'national',
                description: 'Arctic hysteria with dramatic behavioral changes',
                effects: { hospital_upkeep: 8, happiness: -4 },
                cureRequirement: { money: 110000, time: 26, research_points: 7 }
            },
            { 
                id: 'amok', name: 'Running Amok', severity: 'minor', scope: 'national',
                description: 'Sudden violent behavior in Southeast Asia',
                effects: { happiness: -7, military_strength: -4 },
                cureRequirement: { money: 120000, time: 28, research_points: 8 }
            },
            { 
                id: 'susto', name: 'Susto', severity: 'minor', scope: 'national',
                description: 'Soul loss syndrome in Latin American culture',
                effects: { happiness: -7, environment: -3 },
                cureRequirement: { money: 80000, time: 20, research_points: 5 }
            },
            { 
                id: 'zar_possession', name: 'Zar Possession', severity: 'minor', scope: 'national',
                description: 'Spirit possession syndrome in Africa/Middle East',
                effects: { crime: 1, happiness: -1 },
                cureRequirement: { money: 100000, time: 24, research_points: 6 }
            },
            { 
                id: 'neurasthenia', name: 'Neurasthenia', severity: 'minor', scope: 'national',
                description: 'Victorian-era nervous exhaustion syndrome',
                effects: { military_strength: -7, population: -1 },
                cureRequirement: { money: 110000, time: 26, research_points: 7 }
            },
            { 
                id: 'railway_spine', name: 'Railway Spine', severity: 'minor', scope: 'national',
                description: 'Trauma disorder from early railway accidents',
                effects: { military_strength: -5, taxable_income: -4 },
                cureRequirement: { money: 90000, time: 22, research_points: 6 }
            },
            { 
                id: 'soldiers_heart', name: "Soldier's Heart", severity: 'minor', scope: 'national',
                description: 'Civil War-era cardiac neurosis in veterans',
                effects: { happiness: -1, environment: -1 },
                cureRequirement: { money: 100000, time: 24, research_points: 6 }
            },
            { 
                id: 'shell_shock', name: 'Shell Shock', severity: 'minor', scope: 'national',
                description: 'WWI psychological trauma from artillery bombardment',
                effects: { military_morale: -3, taxable_income: -5 },
                cureRequirement: { money: 120000, time: 28, research_points: 8 }
            },
            { 
                id: 'da_costa_syndrome', name: "Da Costa's Syndrome", severity: 'minor', scope: 'national',
                description: 'Irritable heart syndrome in soldiers',
                effects: { environment: -5, hospital_upkeep: 2 },
                cureRequirement: { money: 90000, time: 22, research_points: 6 }
            },
            { 
                id: 'amber_ague', name: 'Amber Ague', severity: 'minor', scope: 'national',
                description: 'Crystalline fever causing golden skin discoloration',
                effects: { environment: -8, happiness: -8 },
                cureRequirement: { money: 85000, time: 19, research_points: 5 }
            },
            { 
                id: 'mist_madness', name: 'Mist Madness', severity: 'minor', scope: 'national',
                description: 'Fog-induced hallucinations affecting coastal regions',
                effects: { population: -1, happiness: -2 },
                cureRequirement: { money: 95000, time: 21, research_points: 6 }
            },
            { 
                id: 'iron_lung_syndrome', name: 'Iron Lung Syndrome', severity: 'minor', scope: 'national',
                description: 'Metallic taste respiratory disorder',
                effects: { environment: -4, hospital_upkeep: 5 },
                cureRequirement: { money: 92000, time: 20, research_points: 5 }
            },
            { 
                id: 'pearl_pox', name: 'Pearl Pox', severity: 'minor', scope: 'national',
                description: 'Iridescent skin lesions with pearl-like appearance',
                effects: { military_strength: -6, taxable_income: -3 },
                cureRequirement: { money: 105000, time: 24, research_points: 7 }
            },
            { 
                id: 'echo_fever', name: 'Echo Fever', severity: 'minor', scope: 'national',
                description: 'Auditory repetition disorder causing speech loops',
                effects: { hospital_upkeep: 1, crime: 2 },
                cureRequirement: { money: 88000, time: 18, research_points: 5 }
            },
            { 
                id: 'glass_bone_disease', name: 'Glass Bone Disease', severity: 'minor', scope: 'national',
                description: 'Brittle bone syndrome with transparent appearance',
                effects: { disease: 2, happiness: -4 },
                cureRequirement: { money: 125000, time: 28, research_points: 9 }
            },
            { 
                id: 'moonlight_melancholy', name: 'Moonlight Melancholy', severity: 'minor', scope: 'national',
                description: 'Lunar cycle dependent depression',
                effects: { crime: 3, military_morale: -8 },
                cureRequirement: { money: 115000, time: 26, research_points: 8 }
            },
            { 
                id: 'static_skin', name: 'Static Skin Syndrome', severity: 'minor', scope: 'national',
                description: 'Electrical charge buildup in skin tissue',
                effects: { disease: 6, environment: -4 },
                cureRequirement: { money: 100000, time: 22, research_points: 6 }
            },
            { 
                id: 'dream_leak', name: 'Dream Leak Disorder', severity: 'minor', scope: 'national',
                description: 'Dreams bleeding into waking consciousness',
                effects: { hospital_upkeep: 8, crime: 5 },
                cureRequirement: { money: 108000, time: 25, research_points: 7 }
            },
            { 
                id: 'dust_devil_disease', name: 'Dust Devil Disease', severity: 'minor', scope: 'national',
                description: 'Whirling sensation causing constant dizziness',
                effects: { happiness: -6, military_morale: -4 },
                cureRequirement: { money: 94000, time: 21, research_points: 6 }
            },
            { 
                id: 'whisper_weakness', name: 'Whisper Weakness', severity: 'minor', scope: 'national',
                description: 'Voice gradually fading to inaudible whispers',
                effects: { taxable_income: -5, happiness: -3 },
                cureRequirement: { money: 98000, time: 23, research_points: 6 }
            },
            { 
                id: 'mirror_memory_loss', name: 'Mirror Memory Loss', severity: 'minor', scope: 'national',
                description: 'Forgetting own reflection and appearance',
                effects: { population: -2, crime: 2 },
                cureRequirement: { money: 112000, time: 27, research_points: 8 }
            },
            { 
                id: 'clockwork_cough', name: 'Clockwork Cough', severity: 'minor', scope: 'national',
                description: 'Mechanical rhythm respiratory spasms',
                effects: { crime: 5, military_morale: -8 },
                cureRequirement: { money: 82000, time: 17, research_points: 4 }
            },
            { 
                id: 'butterfly_bones', name: 'Butterfly Bones', severity: 'minor', scope: 'national',
                description: 'Bones becoming lightweight and fragile',
                effects: { disease: 6, crime: 2 },
                cureRequirement: { money: 106000, time: 24, research_points: 7 }
            },
            { 
                id: 'tide_sickness', name: 'Tide Sickness', severity: 'minor', scope: 'national',
                description: 'Ocean rhythm induced nausea',
                effects: { population: -2, crime: 1 },
                cureRequirement: { money: 90000, time: 20, research_points: 5 }
            },
            { 
                id: 'phantom_pain_plague', name: 'Phantom Pain Plague', severity: 'minor', scope: 'national',
                description: 'Pain in body parts that were never injured',
                effects: { crime: 7, taxable_income: -8 },
                cureRequirement: { money: 118000, time: 28, research_points: 9 }
            },
            { 
                id: 'shadow_blindness', name: 'Shadow Blindness', severity: 'minor', scope: 'national',
                description: 'Inability to see shadows and silhouettes',
                effects: { disease: 6, hospital_upkeep: 2 },
                cureRequirement: { money: 96000, time: 22, research_points: 6 }
            },
            { 
                id: 'crystal_tears', name: 'Crystal Tears Syndrome', severity: 'minor', scope: 'national',
                description: 'Tears crystallizing upon contact with air',
                effects: { environment: -4, population: -3 },
                cureRequirement: { money: 110000, time: 26, research_points: 8 }
            },
            { 
                id: 'wind_whisper_disease', name: 'Wind Whisper Disease', severity: 'minor', scope: 'national',
                description: 'Hearing voices in wind patterns',
                effects: { military_morale: -4, population: -6 },
                cureRequirement: { money: 102000, time: 24, research_points: 7 }
            },
            { 
                id: 'marble_muscle_syndrome', name: 'Marble Muscle Syndrome', severity: 'minor', scope: 'national',
                description: 'Muscles hardening like stone',
                effects: { happiness: -5, hospital_upkeep: 5 },
                cureRequirement: { money: 130000, time: 30, research_points: 10 }
            },
            { 
                id: 'frost_touch', name: 'Frost Touch', severity: 'minor', scope: 'national',
                description: 'Hands remain permanently cold',
                effects: { population: -1, military_morale: -3 },
                cureRequirement: { money: 86000, time: 19, research_points: 5 }
            },
            { 
                id: 'bubble_brain', name: 'Bubble Brain Syndrome', severity: 'minor', scope: 'national',
                description: 'Thoughts popping like bubbles before completion',
                effects: { hospital_upkeep: 8, environment: -4 },
                cureRequirement: { money: 114000, time: 27, research_points: 8 }
            },
            { 
                id: 'velvet_voice', name: 'Velvet Voice Disease', severity: 'minor', scope: 'national',
                description: 'Voice becoming unnaturally smooth and hypnotic',
                effects: { military_morale: -6, population: -1 },
                cureRequirement: { money: 76000, time: 16, research_points: 4 }
            },
            { 
                id: 'prism_vision', name: 'Prism Vision Disorder', severity: 'minor', scope: 'national',
                description: 'Seeing rainbow fractures in all light',
                effects: { hospital_upkeep: 6, military_morale: -1 },
                cureRequirement: { money: 98000, time: 23, research_points: 6 }
            },
            { 
                id: 'echo_bones', name: 'Echo Bones Syndrome', severity: 'minor', scope: 'national',
                description: 'Bones producing hollow sound effects',
                effects: { crime: 2, environment: -3 },
                cureRequirement: { money: 80000, time: 18, research_points: 4 }
            },
            { 
                id: 'liquid_logic', name: 'Liquid Logic Disease', severity: 'minor', scope: 'national',
                description: 'Rational thinking becoming fluid and unstable',
                effects: { population: -4, disease: 2 },
                cureRequirement: { money: 120000, time: 28, research_points: 9 }
            },
            { 
                id: 'paper_skin', name: 'Paper Skin Syndrome', severity: 'minor', scope: 'national',
                description: 'Skin becoming thin and translucent',
                effects: { disease: 4, military_morale: -5 },
                cureRequirement: { money: 104000, time: 25, research_points: 7 }
            },
            { 
                id: 'magnetic_madness', name: 'Magnetic Madness', severity: 'minor', scope: 'national',
                description: 'Uncontrollable attraction to metal objects',
                effects: { population: -1, disease: 6 },
                cureRequirement: { money: 94000, time: 21, research_points: 6 }
            },
            { 
                id: 'ghost_grip', name: 'Ghost Grip Disorder', severity: 'minor', scope: 'national',
                description: 'Hands occasionally becoming intangible',
                effects: { hospital_upkeep: 2, taxable_income: -2 },
                cureRequirement: { money: 116000, time: 27, research_points: 8 }
            },
            { 
                id: 'smoke_sight', name: 'Smoke Sight Disease', severity: 'minor', scope: 'national',
                description: 'Vision filled with constant smoke-like haze',
                effects: { happiness: -1, military_strength: -7 },
                cureRequirement: { money: 88000, time: 20, research_points: 5 }
            },
            { 
                id: 'thunder_tongue', name: 'Thunder Tongue Syndrome', severity: 'minor', scope: 'national',
                description: 'Voice producing thunder-like rumbles',
                effects: { population: -8, happiness: -7 },
                cureRequirement: { money: 82000, time: 18, research_points: 4 }
            },
            { 
                id: 'starlight_sensitivity', name: 'Starlight Sensitivity', severity: 'minor', scope: 'national',
                description: 'Extreme reaction to nighttime starlight',
                effects: { happiness: -4, taxable_income: -1 },
                cureRequirement: { money: 100000, time: 23, research_points: 6 }
            },
            { 
                id: 'honeyed_hearing', name: 'Honeyed Hearing Disease', severity: 'minor', scope: 'national',
                description: 'All sounds becoming unnaturally sweet',
                effects: { military_morale: -1, disease: 5 },
                cureRequirement: { money: 74000, time: 16, research_points: 3 }
            },
            { 
                id: 'clockface_syndrome', name: 'Clockface Syndrome', severity: 'minor', scope: 'national',
                description: 'Facial features arranging like clock numbers',
                effects: { military_strength: -1, happiness: -5 },
                cureRequirement: { money: 122000, time: 29, research_points: 9 }
            },
            { 
                id: 'silk_string_disease', name: 'Silk String Disease', severity: 'minor', scope: 'national',
                description: 'Hair becoming fine as spider silk',
                effects: { hospital_upkeep: 4, environment: -6 },
                cureRequirement: { money: 86000, time: 19, research_points: 5 }
            },
            { 
                id: 'rainbow_rash', name: 'Rainbow Rash', severity: 'minor', scope: 'national',
                description: 'Skin displaying shifting spectrum of colors',
                effects: { taxable_income: -7, happiness: -7 },
                cureRequirement: { money: 108000, time: 25, research_points: 7 }
            },
            { 
                id: 'gravity_giggles', name: 'Gravity Giggles', severity: 'minor', scope: 'national',
                description: 'Uncontrollable laughter when falling',
                effects: { hospital_upkeep: 8, taxable_income: -8 },
                cureRequirement: { money: 78000, time: 17, research_points: 4 }
            },
            { 
                id: 'phantom_feathers', name: 'Phantom Feathers Syndrome', severity: 'minor', scope: 'national',
                description: 'Sensation of growing invisible feathers',
                effects: { environment: -5, crime: 4 },
                cureRequirement: { money: 96000, time: 22, research_points: 6 }
            },
            { 
                id: 'molten_mood', name: 'Molten Mood Disorder', severity: 'minor', scope: 'national',
                description: 'Emotions becoming liquid and unpredictable',
                effects: { happiness: -5, hospital_upkeep: 4 },
                cureRequirement: { money: 112000, time: 26, research_points: 8 }
            },
            { 
                id: 'crystal_cravings', name: 'Crystal Cravings Disease', severity: 'minor', scope: 'national',
                description: 'Irresistible urge to consume minerals',
                effects: { military_strength: -3, crime: 1 },
                cureRequirement: { money: 104000, time: 24, research_points: 7 }
            },
            { 
                id: 'mist_memories', name: 'Mist Memories Syndrome', severity: 'minor', scope: 'national',
                description: 'Memories becoming foggy and unclear',
                effects: { taxable_income: -3, happiness: -2 },
                cureRequirement: { money: 114000, time: 27, research_points: 8 }
            },
            { 
                id: 'clockwork_circulation', name: 'Clockwork Circulation', severity: 'minor', scope: 'national',
                description: 'Blood flow following mechanical timing',
                effects: { population: -3, hospital_upkeep: 2 },
                cureRequirement: { money: 98000, time: 23, research_points: 6 }
            },
            { 
                id: 'solar_sneeze_syndrome', name: 'Solar Sneeze Syndrome', severity: 'minor', scope: 'national',
                description: 'Uncontrollable sneezing in sunlight',
                effects: { crime: 7, military_strength: -8 },
                cureRequirement: { money: 80000, time: 18, research_points: 4 }
            },
            { 
                id: 'phantom_orchestra', name: 'Phantom Orchestra Disease', severity: 'minor', scope: 'national',
                description: 'Hearing constant invisible musical performances',
                effects: { happiness: -5, hospital_upkeep: 4 },
                cureRequirement: { money: 90000, time: 21, research_points: 5 }
            },
            { 
                id: 'emerald_emotions', name: 'Emerald Emotions Disorder', severity: 'minor', scope: 'national',
                description: 'Feelings taking on green crystalline properties',
                effects: { taxable_income: -4, crime: 4 },
                cureRequirement: { money: 106000, time: 25, research_points: 7 }
            },
            { 
                id: 'tide_touch', name: 'Tide Touch Syndrome', severity: 'minor', scope: 'national',
                description: 'Hands becoming wet with ocean water',
                effects: { disease: 2, happiness: -4 },
                cureRequirement: { money: 88000, time: 20, research_points: 5 }
            },
            { 
                id: 'compass_confusion', name: 'Compass Confusion Disease', severity: 'minor', scope: 'national',
                description: 'Internal sense of direction constantly spinning',
                effects: { military_morale: -2, environment: -2 },
                cureRequirement: { money: 94000, time: 22, research_points: 6 }
            },
            { 
                id: 'silver_speech', name: 'Silver Speech Syndrome', severity: 'minor', scope: 'national',
                description: 'Words carrying metallic resonance',
                effects: { disease: 2, crime: 6 },
                cureRequirement: { money: 72000, time: 15, research_points: 3 }
            },
            { 
                id: 'dream_drift', name: 'Dream Drift Disease', severity: 'minor', scope: 'national',
                description: 'Consciousness floating between sleep and wake',
                effects: { military_morale: -1, disease: 5 },
                cureRequirement: { money: 118000, time: 28, research_points: 9 }
            },
            { 
                id: 'lightning_limbs', name: 'Lightning Limbs Disorder', severity: 'minor', scope: 'national',
                description: 'Arms and legs occasionally sparking with electricity',
                effects: { disease: 5, happiness: -4 },
                cureRequirement: { money: 108000, time: 25, research_points: 7 }
            },
            { 
                id: 'aurora_appetite', name: 'Aurora Appetite Syndrome', severity: 'minor', scope: 'national',
                description: 'Craving foods with aurora-like colors',
                effects: { taxable_income: -4, happiness: -4 },
                cureRequirement: { money: 76000, time: 17, research_points: 4 }
            },
            { 
                id: 'phantom_percussion', name: 'Phantom Percussion Disease', severity: 'minor', scope: 'national',
                description: 'Hearing drumbeats from invisible instruments',
                effects: { military_strength: -8, environment: -5 },
                cureRequirement: { money: 96000, time: 22, research_points: 6 }
            },
            { 
                id: 'metamorphic_moods', name: 'Metamorphic Moods', severity: 'minor', scope: 'national',
                description: 'Emotions literally transforming personality',
                effects: { disease: 6, happiness: -3 },
                cureRequirement: { money: 110000, time: 26, research_points: 8 }
            },
            { 
                id: 'celestial_circulation', name: 'Celestial Circulation Syndrome', severity: 'minor', scope: 'national',
                description: 'Blood flow following astronomical patterns',
                effects: { disease: 3, hospital_upkeep: 3 },
                cureRequirement: { money: 86000, time: 20, research_points: 5 }
            },
            { 
                id: 'gossamer_grief', name: 'Gossamer Grief Disease', severity: 'minor', scope: 'national',
                description: 'Sadness becoming light and translucent',
                effects: { taxable_income: -8, happiness: -1 },
                cureRequirement: { money: 102000, time: 24, research_points: 7 }
            },
            { 
                id: 'prismatic_pain', name: 'Prismatic Pain Disorder', severity: 'minor', scope: 'national',
                description: 'Pain splitting into rainbow spectrum sensations',
                effects: { population: -4, taxable_income: -2 },
                cureRequirement: { money: 98000, time: 23, research_points: 6 }
            },
            { 
                id: 'temporal_taste_buds', name: 'Temporal Taste Buds', severity: 'minor', scope: 'national',
                description: 'Tasting flavors from past and future',
                effects: { military_strength: -5, taxable_income: -3 },
                cureRequirement: { money: 80000, time: 18, research_points: 4 }
            },
            { 
                id: 'phantom_piano_fingers', name: 'Phantom Piano Fingers', severity: 'minor', scope: 'national',
                description: 'Fingers constantly playing invisible piano keys',
                effects: { military_strength: -1, environment: -3 },
                cureRequirement: { money: 88000, time: 21, research_points: 5 }
            },
            { 
                id: 'crystalline_cries', name: 'Crystalline Cries Syndrome', severity: 'minor', scope: 'national',
                description: 'Vocal expressions creating crystal formations',
                effects: { crime: 6, happiness: -4 },
                cureRequirement: { money: 104000, time: 24, research_points: 7 }
            },
            { 
                id: 'lunar_laughter', name: 'Lunar Laughter Disease', severity: 'minor', scope: 'national',
                description: 'Uncontrollable laughter during moon phases',
                effects: { military_strength: -8, military_morale: -3 },
                cureRequirement: { money: 70000, time: 16, research_points: 3 }
            },
            { 
                id: 'mercury_memory', name: 'Mercury Memory Disorder', severity: 'minor', scope: 'national',
                description: 'Memories flowing like liquid metal',
                effects: { population: -2, taxable_income: -5 },
                cureRequirement: { money: 112000, time: 26, research_points: 8 }
            },
            { 
                id: 'sapphire_sadness', name: 'Sapphire Sadness Syndrome', severity: 'minor', scope: 'national',
                description: 'Melancholy taking on blue crystalline hardness',
                effects: { population: -5, military_strength: -6 },
                cureRequirement: { money: 116000, time: 27, research_points: 8 }
            },
            { 
                id: 'whispering_wounds', name: 'Whispering Wounds Disease', severity: 'minor', scope: 'national',
                description: 'Injuries that speak about their pain',
                effects: { happiness: -4, taxable_income: -8 },
                cureRequirement: { money: 94000, time: 22, research_points: 6 }
            },
            { 
                id: 'floating_fears', name: 'Floating Fears Disorder', severity: 'minor', scope: 'national',
                description: 'Anxieties becoming weightless and drifting',
                effects: { military_strength: -4, crime: 2 },
                cureRequirement: { money: 106000, time: 25, research_points: 7 }
            },
            { 
                id: 'golden_gravity', name: 'Golden Gravity Syndrome', severity: 'minor', scope: 'national',
                description: 'Personal gravitational field with golden tint',
                effects: { military_morale: -7, disease: 3 },
                cureRequirement: { money: 90000, time: 21, research_points: 5 }
            },
            { 
                id: 'ethereal_exhaustion', name: 'Ethereal Exhaustion Disease', severity: 'minor', scope: 'national',
                description: 'Fatigue that makes body semi-transparent',
                effects: { happiness: -2, environment: -1 },
                cureRequirement: { money: 114000, time: 27, research_points: 8 }
            },
            { 
                id: 'harmonic_headaches', name: 'Harmonic Headaches', severity: 'minor', scope: 'national',
                description: 'Head pain creating musical chord progressions',
                effects: { taxable_income: -6, crime: 3 },
                cureRequirement: { money: 100000, time: 23, research_points: 6 }
            },
            { 
                id: 'dimensional_dizziness', name: 'Dimensional Dizziness Disorder', severity: 'minor', scope: 'national',
                description: 'Vertigo from glimpsing parallel dimensions',
                effects: { population: -7, military_morale: -1 },
                cureRequirement: { money: 108000, time: 25, research_points: 7 }
            },
            { 
                id: 'plasma_pulse', name: 'Plasma Pulse Syndrome', severity: 'minor', scope: 'national',
                description: 'Heartbeat generating plasma-like energy',
                effects: { disease: 6, military_morale: -2 },
                cureRequirement: { money: 82000, time: 19, research_points: 4 }
            },
            { 
                id: 'fractal_feelings', name: 'Fractal Feelings Disease', severity: 'minor', scope: 'national',
                description: 'Emotions creating infinite recursive patterns',
                effects: { crime: 5, military_strength: -8 },
                cureRequirement: { money: 120000, time: 28, research_points: 9 }
            },
            { 
                id: 'quantum_quiver', name: 'Quantum Quiver Disorder', severity: 'minor', scope: 'national',
                description: 'Body vibrating at quantum frequencies',
                effects: { military_morale: -8, environment: -3 },
                cureRequirement: { money: 92000, time: 21, research_points: 5 }
            },
            { 
                id: 'stellar_stuttering', name: 'Stellar Stuttering Syndrome', severity: 'minor', scope: 'national',
                description: 'Speech patterns following stellar pulsations',
                effects: { hospital_upkeep: 1, disease: 7 },
                cureRequirement: { money: 96000, time: 22, research_points: 6 }
            },
            { 
                id: 'nebula_nightmares', name: 'Nebula Nightmares Disease', severity: 'minor', scope: 'national',
                description: 'Dreams filled with cosmic gas clouds',
                effects: { happiness: -6, environment: -1 },
                cureRequirement: { money: 102000, time: 24, research_points: 7 }
            },
            { 
                id: 'cosmic_coordination_loss', name: 'Cosmic Coordination Loss', severity: 'minor', scope: 'national',
                description: 'Motor skills affected by galactic alignment',
                effects: { happiness: -6, taxable_income: -2 },
                cureRequirement: { money: 98000, time: 23, research_points: 6 }
            },
            { 
                id: 'astral_arthritis', name: 'Astral Arthritis Syndrome', severity: 'minor', scope: 'national',
                description: 'Joint pain extending into spiritual dimensions',
                effects: { happiness: -1, environment: -1 },
                cureRequirement: { money: 110000, time: 26, research_points: 8 }
            }
        ],
        major: [
            { 
                id: 'crimson_plague', name: 'Crimson Plague', severity: 'major', scope: 'national',
                description: 'Severe blood-borne pathogen causing organ failure',
                effects: { crime: 19, taxable_income: -19, hospital_upkeep: 23, environment: -24, happiness: -14 },
                cureRequirement: { money: 2000000, time: 120, research_points: 50 }
            },
            { 
                id: 'void_sickness', name: 'Void Sickness', severity: 'major', scope: 'national',
                description: 'Mysterious disease causing cellular breakdown',
                effects: { disease: 11, military_strength: -18, military_morale: -12, population: -15, happiness: -15 },
                cureRequirement: { money: 2500000, time: 150, research_points: 60 }
            },
            { 
                id: 'crystal_curse', name: 'Crystal Curse', severity: 'major', scope: 'national',
                description: 'Disease causing crystalline growths in organs',
                effects: { military_morale: -24, happiness: -10, population: -24, military_strength: -24, taxable_income: -18 },
                cureRequirement: { money: 1800000, time: 100, research_points: 45 }
            },
            { 
                id: 'shadow_blight', name: 'Shadow Blight', severity: 'major', scope: 'national',
                description: 'Neurological disease affecting cognitive functions',
                effects: { taxable_income: -25, disease: 11, hospital_upkeep: 25, military_strength: -24, happiness: -24 },
                cureRequirement: { money: 3000000, time: 180, research_points: 70 }
            },
            { 
                id: 'iron_rot', name: 'Iron Rot', severity: 'major', scope: 'national',
                description: 'Disease affecting metal metabolism in body',
                effects: { population: -22, hospital_upkeep: 19, crime: 16, environment: -12, military_strength: -15 },
                cureRequirement: { money: 2200000, time: 130, research_points: 55 }
            },
            { 
                id: 'flame_fever', name: 'Flame Fever', severity: 'major', scope: 'national',
                description: 'High-temperature disease causing internal burning',
                effects: { military_strength: -13, disease: 20, population: -15, crime: 23, environment: -19 },
                cureRequirement: { money: 2400000, time: 140, research_points: 58 }
            },
            { 
                id: 'frost_lung', name: 'Frost Lung', severity: 'major', scope: 'national',
                description: 'Respiratory disease causing hypothermic reactions',
                effects: { disease: 19, happiness: -24, environment: -13, population: -22, hospital_upkeep: 23 },
                cureRequirement: { money: 2300000, time: 135, research_points: 57 }
            },
            { 
                id: 'storm_sickness', name: 'Storm Sickness', severity: 'major', scope: 'national',
                description: 'Electromagnetic sensitivity causing neural disruption',
                effects: { military_strength: -22, disease: 20, hospital_upkeep: 25, crime: 24, environment: -24 },
                cureRequirement: { money: 2350000, time: 125, research_points: 52 }
            },
            { 
                id: 'titan_plague', name: 'Titan Plague', severity: 'major', scope: 'national',
                description: 'Gigantism-inducing viral infection',
                effects: { military_morale: -17, military_strength: -13, crime: 20, environment: -11, happiness: -21 },
                cureRequirement: { money: 2250000, time: 115, research_points: 50 }
            },
            { 
                id: 'mind_melt', name: 'Mind Melt Syndrome', severity: 'major', scope: 'national',
                description: 'Psychoactive disease causing cognitive breakdown',
                effects: { population: -19, military_strength: -11, crime: 14, hospital_upkeep: 10, environment: -12 },
                cureRequirement: { money: 2650000, time: 155, research_points: 62 }
            },
            { 
                id: 'bone_rot', name: 'Bone Rot Disease', severity: 'major', scope: 'national',
                description: 'Skeletal deterioration causing structural collapse',
                effects: { happiness: -12, population: -23, environment: -21, military_morale: -17, disease: 14 },
                cureRequirement: { money: 2450000, time: 145, research_points: 58 }
            },
            { 
                id: 'blood_crystal_syndrome', name: 'Blood Crystal Syndrome', severity: 'major', scope: 'national',
                description: 'Crystallization of blood causing circulatory failure',
                effects: { environment: -24, crime: 25, taxable_income: -19, disease: 20, happiness: -15 },
                cureRequirement: { money: 2950000, time: 175, research_points: 75 }
            },
            { 
                id: 'soul_drain_epidemic', name: 'Soul Drain Epidemic', severity: 'major', scope: 'national',
                description: 'Spiritual energy depletion causing existential crisis',
                effects: { disease: 14, population: -22, crime: 13, military_morale: -17, environment: -13 },
                cureRequirement: { money: 3100000, time: 185, research_points: 78 }
            },
            { 
                id: 'time_sickness', name: 'Temporal Displacement Sickness', severity: 'major', scope: 'national',
                description: 'Chronological desynchronization affecting aging',
                effects: { happiness: -23, hospital_upkeep: 22, environment: -19, crime: 16, disease: 13 },
                cureRequirement: { money: 2400000, time: 135, research_points: 55 }
            },
            { 
                id: 'gravity_madness', name: 'Gravitational Madness', severity: 'major', scope: 'national',
                description: 'Altered gravity perception causing mass hysteria',
                effects: { environment: -24, happiness: -23, taxable_income: -23, military_morale: -19, military_strength: -16 },
                cureRequirement: { money: 2550000, time: 150, research_points: 60 }
            },
            { 
                id: 'digital_decay', name: 'Digital Decay Syndrome', severity: 'major', scope: 'national',
                description: 'Technology-induced neural deterioration',
                effects: { happiness: -19, hospital_upkeep: 25, population: -23, environment: -24, military_strength: -14 },
                cureRequirement: { money: 2450000, time: 140, research_points: 57 }
            },
            { 
                id: 'elemental_imbalance', name: 'Elemental Imbalance Disease', severity: 'major', scope: 'national',
                description: 'Disruption of bodily elemental harmony',
                effects: { happiness: -13, population: -11, hospital_upkeep: 11, environment: -10, military_morale: -18 },
                cureRequirement: { money: 2350000, time: 130, research_points: 53 }
            },
            { 
                id: 'nightmare_plague', name: 'Nightmare Plague', severity: 'major', scope: 'national',
                description: 'Shared nightmares causing sleep deprivation epidemic',
                effects: { disease: 18, taxable_income: -20, crime: 21, military_strength: -24, military_morale: -19 },
                cureRequirement: { money: 2750000, time: 165, research_points: 68 }
            },
            { 
                id: 'mirror_syndrome', name: 'Mirror Syndrome', severity: 'major', scope: 'national',
                description: 'Reality distortion causing identity fragmentation',
                effects: { disease: 21, environment: -15, hospital_upkeep: 23, taxable_income: -13, military_strength: -13 },
                cureRequirement: { money: 2850000, time: 170, research_points: 70 }
            },
            { 
                id: 'echo_madness', name: 'Echo Madness', severity: 'major', scope: 'national',
                description: 'Auditory hallucinations creating mass paranoia',
                effects: { crime: 22, hospital_upkeep: 18, military_strength: -13, military_morale: -15, environment: -24 },
                cureRequirement: { money: 2500000, time: 145, research_points: 58 }
            },
            { 
                id: 'phantom_limb_epidemic', name: 'Phantom Limb Epidemic', severity: 'major', scope: 'national',
                description: 'Mass sensation of missing body parts',
                effects: { disease: 25, population: -14, crime: 23, taxable_income: -15, military_strength: -15 },
                cureRequirement: { money: 2200000, time: 120, research_points: 48 }
            },
            { 
                id: 'color_blindness_plague', name: 'Total Color Blindness Plague', severity: 'major', scope: 'national',
                description: 'Complete loss of color vision across population',
                effects: { military_morale: -13, taxable_income: -16, military_strength: -12, happiness: -22, hospital_upkeep: 19 },
                cureRequirement: { money: 2000000, time: 110, research_points: 45 }
            },
            { 
                id: 'memory_erosion', name: 'Memory Erosion Disease', severity: 'major', scope: 'national',
                description: 'Progressive loss of collective memory',
                effects: { hospital_upkeep: 20, disease: 11, population: -14, environment: -12, happiness: -18 },
                cureRequirement: { money: 3000000, time: 180, research_points: 75 }
            },
            { 
                id: 'sensory_overload_syndrome', name: 'Sensory Overload Syndrome', severity: 'major', scope: 'national',
                description: 'Overwhelming hypersensitivity to all stimuli',
                effects: { happiness: -17, environment: -19, population: -23, military_morale: -13, military_strength: -20 },
                cureRequirement: { money: 3050000, time: 185, research_points: 78 }
            },
            { 
                id: 'black_death_strain', name: 'Black Death Strain', severity: 'major', scope: 'national',
                description: 'Virulent plague strain similar to medieval pandemic',
                effects: { military_morale: -20, hospital_upkeep: 10, population: -14, disease: 22, taxable_income: -13 },
                cureRequirement: { money: 3500000, time: 200, research_points: 80 }
            },
            { 
                id: 'spanish_flu_variant', name: 'Spanish Flu Variant', severity: 'major', scope: 'national',
                description: 'Mutated influenza with high mortality rate',
                effects: { happiness: -24, environment: -14, disease: 17, crime: 15, taxable_income: -22 },
                cureRequirement: { money: 2800000, time: 160, research_points: 65 }
            },
            { 
                id: 'justinian_plague', name: 'Justinian Plague', severity: 'major', scope: 'national',
                description: 'Ancient plague strain from Byzantine era',
                effects: { taxable_income: -22, disease: 18, military_morale: -11, hospital_upkeep: 20, crime: 13 },
                cureRequirement: { money: 3000000, time: 170, research_points: 70 }
            },
            { 
                id: 'london_pestilence', name: 'London Pestilence', severity: 'major', scope: 'national',
                description: 'Great Plague variant with urban focus',
                effects: { population: -13, hospital_upkeep: 15, crime: 11, military_morale: -22, environment: -19 },
                cureRequirement: { money: 2600000, time: 155, research_points: 62 }
            },
            { 
                id: 'third_pandemic', name: 'Third Pandemic Strain', severity: 'major', scope: 'national',
                description: 'Modern plague pandemic variant',
                effects: { crime: 16, military_morale: -14, environment: -11, disease: 12, hospital_upkeep: 22 },
                cureRequirement: { money: 2400000, time: 145, research_points: 58 }
            },
            { 
                id: 'antonine_plague', name: 'Antonine Plague', severity: 'major', scope: 'national',
                description: 'Ancient Roman pandemic strain',
                effects: { population: -19, happiness: -19, disease: 17, crime: 11, military_morale: -16 },
                cureRequirement: { money: 2900000, time: 165, research_points: 68 }
            },
            { 
                id: 'cyprian_plague', name: 'Cyprian Plague', severity: 'major', scope: 'national',
                description: 'Crisis of Third Century pandemic',
                effects: { happiness: -12, disease: 25, environment: -25, taxable_income: -17, crime: 25 },
                cureRequirement: { money: 2700000, time: 158, research_points: 64 }
            },
            { 
                id: 'plague_of_athens', name: 'Plague of Athens', severity: 'major', scope: 'national',
                description: 'Ancient Athenian epidemic during Peloponnesian War',
                effects: { hospital_upkeep: 14, environment: -22, military_strength: -24, disease: 18, taxable_income: -25 },
                cureRequirement: { money: 2500000, time: 150, research_points: 60 }
            },
            { 
                id: 'sweating_death', name: 'English Sweating Death', severity: 'major', scope: 'national',
                description: 'Severe variant of Tudor sweating sickness',
                effects: { taxable_income: -22, military_strength: -20, happiness: -13, environment: -19, population: -13 },
                cureRequirement: { money: 2400000, time: 145, research_points: 58 }
            },
            { 
                id: 'dancing_death', name: 'Dancing Death of 1518', severity: 'major', scope: 'national',
                description: 'Fatal dancing mania in Strasbourg',
                effects: { happiness: -17, military_morale: -17, environment: -23, military_strength: -21, hospital_upkeep: 13 },
                cureRequirement: { money: 2200000, time: 135, research_points: 55 }
            },
            { 
                id: 'great_mortality', name: 'Great Mortality', severity: 'major', scope: 'national',
                description: 'Medieval name for catastrophic plague outbreaks',
                effects: { crime: 13, happiness: -20, military_morale: -24, population: -22, hospital_upkeep: 11 },
                cureRequirement: { money: 3200000, time: 190, research_points: 80 }
            },
            { 
                id: 'pest_of_justinian', name: 'Pest of Justinian', severity: 'major', scope: 'national',
                description: 'First recorded bubonic plague pandemic',
                effects: { environment: -16, happiness: -14, taxable_income: -13, military_strength: -12, hospital_upkeep: 13 },
                cureRequirement: { money: 3000000, time: 175, research_points: 75 }
            },
            { 
                id: 'great_pox', name: 'Great Pox Epidemic', severity: 'major', scope: 'national',
                description: 'Severe syphilis outbreak in Renaissance Europe',
                effects: { happiness: -25, environment: -20, military_strength: -14, crime: 22, disease: 25 },
                cureRequirement: { money: 2100000, time: 125, research_points: 50 }
            },
            { 
                id: 'yellow_death', name: 'Yellow Death', severity: 'major', scope: 'national',
                description: 'Severe yellow fever epidemic in tropical regions',
                effects: { crime: 22, disease: 10, happiness: -20, population: -15, environment: -12 },
                cureRequirement: { money: 2450000, time: 140, research_points: 58 }
            },
            { 
                id: 'camp_fever', name: 'Camp Fever Epidemic', severity: 'major', scope: 'national',
                description: 'Typhus outbreak in military conditions',
                effects: { military_morale: -21, taxable_income: -14, population: -21, military_strength: -22, happiness: -12 },
                cureRequirement: { money: 2350000, time: 135, research_points: 55 }
            },
            { 
                id: 'ship_fever', name: 'Ship Fever Pandemic', severity: 'major', scope: 'national',
                description: 'Maritime typhus affecting global trade',
                effects: { military_morale: -17, taxable_income: -18, population: -11, crime: 12, military_strength: -22 },
                cureRequirement: { money: 2000000, time: 120, research_points: 48 }
            },
            { 
                id: 'jail_fever', name: 'Jail Fever Outbreak', severity: 'major', scope: 'national',
                description: 'Prison typhus spreading to general population',
                effects: { happiness: -16, military_morale: -19, population: -22, taxable_income: -12, environment: -19 },
                cureRequirement: { money: 2500000, time: 150, research_points: 60 }
            },
            { 
                id: 'wasting_disease', name: 'Great Wasting Disease', severity: 'major', scope: 'national',
                description: 'Chronic malnutrition epidemic causing mass weakness',
                effects: { environment: -21, disease: 21, happiness: -25, military_strength: -16, crime: 11 },
                cureRequirement: { money: 2700000, time: 160, research_points: 65 }
            },
            { 
                id: 'bone_ache', name: 'Bone Ache Epidemic', severity: 'major', scope: 'national',
                description: 'Dengue fever causing severe joint pain',
                effects: { disease: 12, population: -25, happiness: -10, environment: -18, taxable_income: -11 },
                cureRequirement: { money: 1850000, time: 115, research_points: 45 }
            },
            { 
                id: 'strangers_disease', name: "Stranger's Disease", severity: 'major', scope: 'national',
                description: 'Smallpox epidemic among indigenous populations',
                effects: { military_morale: -17, military_strength: -10, taxable_income: -17, population: -24, happiness: -15 },
                cureRequirement: { money: 3300000, time: 200, research_points: 85 }
            },
            { 
                id: 'consumption_of_the_lungs', name: 'Consumption of the Lungs', severity: 'major', scope: 'national',
                description: 'Severe tuberculosis epidemic in industrial cities',
                effects: { happiness: -16, disease: 12, military_morale: -15, hospital_upkeep: 22, population: -16 },
                cureRequirement: { money: 2850000, time: 170, research_points: 70 }
            },
            { 
                id: 'void_consumption', name: 'Void Consumption', severity: 'major', scope: 'national',
                description: 'Dark energy eating away at life force',
                effects: { taxable_income: -21, happiness: -25, environment: -15, population: -23, military_strength: -16 },
                cureRequirement: { money: 3600000, time: 210, research_points: 90 }
            },
            { 
                id: 'temporal_tuberculosis', name: 'Temporal Tuberculosis', severity: 'major', scope: 'national',
                description: 'Lung disease that ages victims rapidly',
                effects: { population: -25, happiness: -25, taxable_income: -13, hospital_upkeep: 20, environment: -19 },
                cureRequirement: { money: 3200000, time: 180, research_points: 80 }
            },
            { 
                id: 'crystalline_cancer', name: 'Crystalline Cancer', severity: 'major', scope: 'national',
                description: 'Malignant growths forming crystal structures',
                effects: { disease: 13, military_morale: -12, population: -11, happiness: -14, military_strength: -13 },
                cureRequirement: { money: 3500000, time: 200, research_points: 85 }
            },
            { 
                id: 'astral_anemia', name: 'Astral Anemia', severity: 'major', scope: 'national',
                description: 'Spiritual energy deficiency causing physical weakness',
                effects: { happiness: -14, military_strength: -16, environment: -19, military_morale: -14, taxable_income: -14 },
                cureRequirement: { money: 3000000, time: 170, research_points: 75 }
            },
            { 
                id: 'quantum_quarantine_syndrome', name: 'Quantum Quarantine Syndrome', severity: 'major', scope: 'national',
                description: 'Particles in body existing in multiple states simultaneously',
                effects: { military_morale: -13, population: -25, disease: 24, crime: 12, environment: -23 },
                cureRequirement: { money: 3300000, time: 185, research_points: 82 }
            },
            { 
                id: 'metamorphic_meltdown', name: 'Metamorphic Meltdown', severity: 'major', scope: 'national',
                description: 'Uncontrolled physical transformation disease',
                effects: { population: -20, crime: 17, environment: -11, happiness: -11, disease: 25 },
                cureRequirement: { money: 3800000, time: 220, research_points: 95 }
            },
            { 
                id: 'plasma_poisoning', name: 'Plasma Poisoning Pandemic', severity: 'major', scope: 'national',
                description: 'Blood turning into superheated plasma state',
                effects: { disease: 16, crime: 21, population: -21, hospital_upkeep: 24, military_strength: -13 },
                cureRequirement: { money: 4000000, time: 230, research_points: 100 }
            },
            { 
                id: 'holographic_hepatitis', name: 'Holographic Hepatitis', severity: 'major', scope: 'national',
                description: 'Liver disease creating false organ projections',
                effects: { taxable_income: -15, military_strength: -25, hospital_upkeep: 18, military_morale: -12, disease: 21 },
                cureRequirement: { money: 3100000, time: 175, research_points: 78 }
            },
            { 
                id: 'fractal_fever', name: 'Fractal Fever Syndrome', severity: 'major', scope: 'national',
                description: 'Temperature creating infinite recursive patterns in body',
                effects: { taxable_income: -10, military_strength: -24, hospital_upkeep: 25, population: -11, disease: 13 },
                cureRequirement: { money: 3700000, time: 215, research_points: 92 }
            },
            { 
                id: 'dimensional_diabetes', name: 'Dimensional Diabetes', severity: 'major', scope: 'national',
                description: 'Blood sugar existing across multiple dimensions',
                effects: { happiness: -22, taxable_income: -23, population: -18, environment: -19, crime: 13 },
                cureRequirement: { money: 2800000, time: 160, research_points: 70 }
            },
            { 
                id: 'ethereal_epilepsy', name: 'Ethereal Epilepsy', severity: 'major', scope: 'national',
                description: 'Seizures causing temporary dimensional phasing',
                effects: { military_strength: -14, taxable_income: -11, military_morale: -15, hospital_upkeep: 25, disease: 17 },
                cureRequirement: { money: 3400000, time: 190, research_points: 85 }
            },
            { 
                id: 'magnetic_malaria', name: 'Magnetic Malaria', severity: 'major', scope: 'national',
                description: 'Parasitic infection affecting magnetic field sensitivity',
                effects: { disease: 10, crime: 20, taxable_income: -16, environment: -13, military_morale: -10 },
                cureRequirement: { money: 3150000, time: 178, research_points: 79 }
            },
            { 
                id: 'sonic_sepsis', name: 'Sonic Sepsis Syndrome', severity: 'major', scope: 'national',
                description: 'Blood infection transmitting through sound waves',
                effects: { military_strength: -11, disease: 25, crime: 13, environment: -17, taxable_income: -25 },
                cureRequirement: { money: 3250000, time: 182, research_points: 81 }
            },
            { 
                id: 'gravitational_gangrene', name: 'Gravitational Gangrene', severity: 'major', scope: 'national',
                description: 'Tissue death from altered gravity fields',
                effects: { disease: 22, taxable_income: -13, happiness: -24, military_strength: -24, crime: 18 },
                cureRequirement: { money: 3750000, time: 218, research_points: 94 }
            },
            { 
                id: 'photonic_pneumonia', name: 'Photonic Pneumonia', severity: 'major', scope: 'national',
                description: 'Lung infection replacing air with light particles',
                effects: { military_morale: -18, population: -20, happiness: -15, taxable_income: -17, environment: -21 },
                cureRequirement: { money: 3600000, time: 205, research_points: 88 }
            },
            { 
                id: 'neural_necropolis', name: 'Neural Necropolis Disease', severity: 'major', scope: 'national',
                description: 'Brain cells forming undead neural networks',
                effects: { disease: 10, population: -17, environment: -13, military_strength: -22, taxable_income: -10 },
                cureRequirement: { money: 4200000, time: 245, research_points: 105 }
            },
            { 
                id: 'spectral_scurvy', name: 'Spectral Scurvy', severity: 'major', scope: 'national',
                description: 'Vitamin deficiency affecting ghostly manifestations',
                effects: { environment: -24, crime: 23, hospital_upkeep: 23, happiness: -24, military_morale: -11 },
                cureRequirement: { money: 2500000, time: 145, research_points: 62 }
            },
            { 
                id: 'atomic_arthritis', name: 'Atomic Arthritis Syndrome', severity: 'major', scope: 'national',
                description: 'Joint inflammation at subatomic level',
                effects: { population: -25, disease: 16, hospital_upkeep: 14, happiness: -14, environment: -18 },
                cureRequirement: { money: 3000000, time: 172, research_points: 76 }
            },
            { 
                id: 'cosmic_consumption', name: 'Cosmic Consumption', severity: 'major', scope: 'national',
                description: 'Stellar radiation causing internal burning',
                effects: { taxable_income: -11, happiness: -10, environment: -17, military_strength: -17, disease: 17 },
                cureRequirement: { money: 3900000, time: 225, research_points: 98 }
            },
            { 
                id: 'temporal_typhus', name: 'Temporal Typhus', severity: 'major', scope: 'national',
                description: 'Time-displaced fever causing chronological confusion',
                effects: { happiness: -18, taxable_income: -19, hospital_upkeep: 20, environment: -23, crime: 11 },
                cureRequirement: { money: 3200000, time: 180, research_points: 80 }
            },
            { 
                id: 'quantum_cholera', name: 'Quantum Cholera', severity: 'major', scope: 'national',
                description: 'Digestive system existing in probability states',
                effects: { population: -14, taxable_income: -25, environment: -23, disease: 10, military_strength: -11 },
                cureRequirement: { money: 3500000, time: 200, research_points: 85 }
            },
            { 
                id: 'holographic_hemorrhage', name: 'Holographic Hemorrhage', severity: 'major', scope: 'national',
                description: 'Bleeding that creates false blood projections',
                effects: { disease: 24, military_strength: -12, happiness: -15, environment: -23, military_morale: -20 },
                cureRequirement: { money: 3300000, time: 188, research_points: 83 }
            },
            { 
                id: 'dimensional_dysentery', name: 'Dimensional Dysentery', severity: 'major', scope: 'national',
                description: 'Intestinal distress across multiple dimensions',
                effects: { disease: 11, environment: -21, crime: 25, hospital_upkeep: 21, military_morale: -23 },
                cureRequirement: { money: 3050000, time: 174, research_points: 77 }
            },
            { 
                id: 'stellar_stroke', name: 'Stellar Stroke Syndrome', severity: 'major', scope: 'national',
                description: 'Brain damage from stellar radiation exposure',
                effects: { disease: 20, crime: 14, population: -14, hospital_upkeep: 22, military_morale: -14 },
                cureRequirement: { money: 3700000, time: 212, research_points: 91 }
            },
            { 
                id: 'plasma_plague', name: 'Plasma Plague Pandemic', severity: 'major', scope: 'national',
                description: 'Infectious disease converting tissue to plasma',
                effects: { taxable_income: -18, happiness: -10, military_morale: -19, environment: -13, disease: 13 },
                cureRequirement: { money: 4000000, time: 235, research_points: 100 }
            },
            { 
                id: 'gravitational_glaucoma', name: 'Gravitational Glaucoma', severity: 'major', scope: 'national',
                description: 'Eye pressure affected by gravity fluctuations',
                effects: { disease: 25, taxable_income: -23, environment: -24, population: -17, happiness: -20 },
                cureRequirement: { money: 2650000, time: 152, research_points: 67 }
            },
            { 
                id: 'electromagnetic_encephalitis', name: 'Electromagnetic Encephalitis', severity: 'major', scope: 'national',
                description: 'Brain inflammation from EM field exposure',
                effects: { happiness: -25, environment: -14, military_strength: -15, population: -11, disease: 25 },
                cureRequirement: { money: 3600000, time: 208, research_points: 89 }
            },
            { 
                id: 'fractal_flu', name: 'Fractal Flu Syndrome', severity: 'major', scope: 'national',
                description: 'Influenza creating recursive symptom patterns',
                effects: { taxable_income: -18, environment: -17, hospital_upkeep: 17, population: -21, military_morale: -20 },
                cureRequirement: { money: 3150000, time: 176, research_points: 78 }
            },
            { 
                id: 'molecular_malignancy', name: 'Molecular Malignancy', severity: 'major', scope: 'national',
                description: 'Cancer affecting molecular structure itself',
                effects: { happiness: -11, environment: -15, crime: 18, disease: 18, military_morale: -25 },
                cureRequirement: { money: 4100000, time: 240, research_points: 103 }
            },
            { 
                id: 'spectral_smallpox', name: 'Spectral Smallpox', severity: 'major', scope: 'national',
                description: 'Pox affecting both physical and spiritual bodies',
                effects: { military_strength: -19, crime: 16, military_morale: -24, hospital_upkeep: 16, disease: 22 },
                cureRequirement: { money: 3400000, time: 195, research_points: 86 }
            },
            { 
                id: 'chrono_cardiac_arrest', name: 'Chrono Cardiac Arrest', severity: 'major', scope: 'national',
                description: 'Heart stopping and starting across different timelines',
                effects: { environment: -21, happiness: -22, military_morale: -14, military_strength: -17, crime: 12 },
                cureRequirement: { money: 3550000, time: 202, research_points: 87 }
            },
            { 
                id: 'void_vertigo', name: 'Void Vertigo Syndrome', severity: 'major', scope: 'national',
                description: 'Balance disorder from perceiving cosmic emptiness',
                effects: { environment: -18, happiness: -14, population: -12, hospital_upkeep: 25, taxable_income: -14 },
                cureRequirement: { money: 3280000, time: 186, research_points: 82 }
            },
            { 
                id: 'antimatter_aneurysm', name: 'Antimatter Aneurysm', severity: 'major', scope: 'national',
                description: 'Blood vessels containing antimatter particles',
                effects: { population: -21, environment: -14, happiness: -19, taxable_income: -17, hospital_upkeep: 14 },
                cureRequirement: { money: 3900000, time: 228, research_points: 97 }
            },
            { 
                id: 'holographic_hepatosis', name: 'Holographic Hepatosis', severity: 'major', scope: 'national',
                description: 'Liver function replaced by light projections',
                effects: { happiness: -11, environment: -16, military_morale: -18, military_strength: -11, disease: 12 },
                cureRequirement: { money: 2950000, time: 168, research_points: 74 }
            },
            { 
                id: 'quantum_kidney_failure', name: 'Quantum Kidney Failure', severity: 'major', scope: 'national',
                description: 'Kidneys existing in superposition states',
                effects: { happiness: -13, environment: -12, taxable_income: -13, military_strength: -15, disease: 22 },
                cureRequirement: { money: 3450000, time: 198, research_points: 85 }
            },
            { 
                id: 'stellar_septicemia', name: 'Stellar Septicemia', severity: 'major', scope: 'national',
                description: 'Blood poisoning from cosmic radiation',
                effects: { happiness: -13, military_strength: -11, hospital_upkeep: 25, disease: 12, military_morale: -21 },
                cureRequirement: { money: 3780000, time: 220, research_points: 95 }
            },
            { 
                id: 'dimensional_dementia', name: 'Dimensional Dementia', severity: 'major', scope: 'national',
                description: 'Memory loss across parallel dimensions',
                effects: { taxable_income: -24, happiness: -14, population: -19, environment: -21, crime: 12 },
                cureRequirement: { money: 3650000, time: 210, research_points: 90 }
            },
            { 
                id: 'fractal_fibromyalgia', name: 'Fractal Fibromyalgia', severity: 'major', scope: 'national',
                description: 'Pain creating infinite recursive patterns',
                effects: { military_morale: -14, disease: 14, hospital_upkeep: 21, crime: 23, population: -14 },
                cureRequirement: { money: 3200000, time: 182, research_points: 80 }
            },
            { 
                id: 'plasma_paralysis', name: 'Plasma Paralysis Pandemic', severity: 'major', scope: 'national',
                description: 'Nervous system converting to plasma state',
                effects: { disease: 16, hospital_upkeep: 14, taxable_income: -24, environment: -13, happiness: -15 },
                cureRequirement: { money: 4150000, time: 242, research_points: 102 }
            },
            { 
                id: 'temporal_tetanus', name: 'Temporal Tetanus', severity: 'major', scope: 'national',
                description: 'Muscle spasms across multiple time periods',
                effects: { military_strength: -21, happiness: -25, environment: -15, disease: 10, military_morale: -23 },
                cureRequirement: { money: 3400000, time: 194, research_points: 86 }
            },
            { 
                id: 'cosmic_carcinoma', name: 'Cosmic Carcinoma Complex', severity: 'major', scope: 'national',
                description: 'Cancer cells influenced by galactic forces',
                effects: { population: -11, military_strength: -18, military_morale: -15, happiness: -23, environment: -19 },
                cureRequirement: { money: 3850000, time: 224, research_points: 96 }
            },
            { 
                id: 'ethereal_endocarditis', name: 'Ethereal Endocarditis', severity: 'major', scope: 'national',
                description: 'Heart infection affecting spiritual dimensions',
                effects: { military_strength: -24, happiness: -17, environment: -12, population: -15, crime: 14 },
                cureRequirement: { money: 3320000, time: 190, research_points: 83 }
            },
            { 
                id: 'gravitational_gastritis', name: 'Gravitational Gastritis', severity: 'major', scope: 'national',
                description: 'Stomach inflammation from gravity fluctuations',
                effects: { crime: 12, environment: -20, taxable_income: -19, happiness: -19, military_morale: -20 },
                cureRequirement: { money: 2870000, time: 164, research_points: 72 }
            },
            { 
                id: 'magnetic_meningitis', name: 'Magnetic Meningitis', severity: 'major', scope: 'national',
                description: 'Brain membrane inflammation affecting magnetic sense',
                effects: { military_strength: -22, happiness: -21, environment: -23, crime: 22, taxable_income: -10 },
                cureRequirement: { money: 3700000, time: 214, research_points: 92 }
            },
            { 
                id: 'photonic_phlebitis', name: 'Photonic Phlebitis', severity: 'major', scope: 'national',
                description: 'Vein inflammation from light particle exposure',
                effects: { hospital_upkeep: 19, happiness: -16, disease: 18, taxable_income: -17, environment: -20 },
                cureRequirement: { money: 3080000, time: 176, research_points: 77 }
            },
            { 
                id: 'quantum_quinsy', name: 'Quantum Quinsy', severity: 'major', scope: 'national',
                description: 'Throat infection existing in probability states',
                effects: { crime: 11, disease: 22, military_morale: -24, taxable_income: -12, environment: -20 },
                cureRequirement: { money: 2780000, time: 158, research_points: 69 }
            },
            { 
                id: 'spectral_syphilis', name: 'Spectral Syphilis Syndrome', severity: 'major', scope: 'national',
                description: 'STD affecting both physical and ghostly forms',
                effects: { environment: -20, crime: 10, hospital_upkeep: 17, taxable_income: -21, military_strength: -16 },
                cureRequirement: { money: 3250000, time: 184, research_points: 81 }
            },
            { 
                id: 'dimensional_diphtheria', name: 'Dimensional Diphtheria', severity: 'major', scope: 'national',
                description: 'Throat disease spreading across dimensions',
                effects: { military_morale: -19, crime: 20, hospital_upkeep: 23, environment: -21, happiness: -17 },
                cureRequirement: { money: 3150000, time: 180, research_points: 79 }
            },
            { 
                id: 'fractal_fascitis', name: 'Fractal Fascitis', severity: 'major', scope: 'national',
                description: 'Connective tissue inflammation in recursive patterns',
                effects: { crime: 21, military_morale: -17, hospital_upkeep: 24, disease: 12, environment: -25 },
                cureRequirement: { money: 3500000, time: 200, research_points: 85 }
            },
            { 
                id: 'holographic_hysteria', name: 'Holographic Hysteria', severity: 'major', scope: 'national',
                description: 'Mass psychological disorder creating false realities',
                effects: { happiness: -22, disease: 19, environment: -25, crime: 22, hospital_upkeep: 11 },
                cureRequirement: { money: 3600000, time: 206, research_points: 88 }
            },
            { 
                id: 'antimatter_autism', name: 'Antimatter Autism Spectrum', severity: 'major', scope: 'national',
                description: 'Neurological differences from antimatter exposure',
                effects: { population: -15, disease: 11, crime: 18, military_strength: -15, environment: -17 },
                cureRequirement: { money: 2600000, time: 148, research_points: 65 }
            },
            { 
                id: 'cosmic_cirrhosis', name: 'Cosmic Cirrhosis Complex', severity: 'major', scope: 'national',
                description: 'Liver scarring from stellar radiation',
                effects: { disease: 14, military_morale: -13, happiness: -25, military_strength: -19, environment: -21 },
                cureRequirement: { money: 3200000, time: 182, research_points: 80 }
            },
            { 
                id: 'temporal_thrombosis', name: 'Temporal Thrombosis', severity: 'major', scope: 'national',
                description: 'Blood clots forming across time periods',
                effects: { military_morale: -23, taxable_income: -16, disease: 16, population: -18, hospital_upkeep: 15 },
                cureRequirement: { money: 3580000, time: 204, research_points: 87 }
            },
            { 
                id: 'ethereal_eczema', name: 'Ethereal Eczema Epidemic', severity: 'major', scope: 'national',
                description: 'Skin condition affecting spiritual boundaries',
                effects: { military_strength: -12, population: -25, hospital_upkeep: 19, military_morale: -25, disease: 10 },
                cureRequirement: { money: 2700000, time: 154, research_points: 68 }
            },
            { 
                id: 'plasma_psoriasis', name: 'Plasma Psoriasis Pandemic', severity: 'major', scope: 'national',
                description: 'Skin cells converting to plasma state',
                effects: { disease: 25, taxable_income: -11, military_morale: -12, crime: 20, hospital_upkeep: 22 },
                cureRequirement: { money: 3350000, time: 192, research_points: 84 }
            }
        ]
    };
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.NATIONAL_DISEASES;
}
