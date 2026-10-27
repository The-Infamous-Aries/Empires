# Disease System

Handles disease outbreaks, spread, evolution, and cure mechanics for nations. Manages both national diseases (affecting a single nation) and global diseases (affecting multiple nations simultaneously).

## Overview

- **System class:** `DiseaseSystem`
- **Global instance:** `window.DiseaseSystem`
- **Disease sources:** `assets/data/diseases/national-diseases.js` and `assets/data/diseases/global-diseases.js`
- **Check interval:** Every game tick (1 minute real time = 1 hour game time)
- **Minor outbreak check:** Every 2 ticks (5% base chance)
- **Major outbreak check:** Every 12 ticks (2% base chance)
- **Global disease event:** Every tick (1% base chance, modified by global metrics)

---

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `minorCheckInterval` | 2 ticks | Minor outbreaks checked every 2 ticks |
| `majorCheckInterval` | 12 ticks | Major outbreaks checked every 12 ticks |
| `minorDiseaseChance` | 0.05 | 5% base chance per minor tick |
| `majorDiseaseChance` | 0.02 | 2% base chance per major tick |
| `globalEvolutionTime` | 72 hours | National disease evolves to global after 72 hours |
| `pollutionMultiplier` | 2.0 | Pollution increases disease chance |
| `happinessReduction` | 0.5 | High happiness reduces disease chance |
| `diseaseSpreadRate` | 0.02 | 2% chance per tick to spread to neighbors |
| `globalEventChance` | 0.01 | 1% base chance per tick for global event |
| `globalPollutionMultiplier` | 1.5 | Global pollution increases global event chance |
| `globalHealthMultiplier` | 1.5 | Low global health increases global event chance |

---

## Disease Data Structure

Each disease definition contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique disease identifier |
| `name` | string | Display name |
| `severity` | string | `'minor'`, `'major'`, or `'severe'` |
| `scope` | string | `'national'` or `'global'` |
| `description` | string | Flavor text description |
| `effects` | object | Property modifications applied to nation |
| `cureRequirement` | object | Costs to cure: `money`, `time`, `research_points` |

### Effect Property Mapping

Disease effects are mapped to real `Nation`/`nationStats` properties through `effectPropertyMap`:

| Effect Key | Target Property | Type | Direction |
|------------|-----------------|------|-----------|
| `happiness` | `nation.happiness` | nation | Good (negative = falls) |
| `stability` | `nation.stability` | nation | Good (negative = falls) |
| `military_strength` | `nation.militaryStrength` | nation | Good (negative = falls) |
| `physical_strength` | `nation.militaryStrength` | nation | Good (negative = falls) |
| `tax_efficiency` | `nation.nationStats.taxEfficiency` | nationStats | Good (negative = falls) |
| `population_efficiency` | `nation.nationStats.populationEfficiency` | nationStats | Good (negative = falls) |
| `military_morale` | `nation.nationStats.militaryMorale` | nationStats | Good (negative = falls) |
| `literacy` | `nation.nationStats.literacy` | nationStats | Good (negative = falls) |
| `environment` | `nation.nationStats.environment` | nationStats | Good (negative = falls) |
| `crime` | `nation.nationStats.crime` | nationStats | Bad (positive = rises) |
| `disease` | `nation.nationStats.disease` | nationStats | Bad (positive = rises) |
| `pollution` | `nation.nationStats.pollution` | nationStats | Bad (positive = rises) |
| `taxable_income` | `nation.taxableIncome` | nation | Good (negative = falls) |
| `population` | `nation.population` | nation | Good (negative = falls) |
| `hospital_upkeep` | `nation.buildingUpkeep.improvements` | nation | Bad (positive = rises) |

Unmapped effect keys are silently skipped.

### Effect Application Rules

- **Good metrics:** Negative values reduce them (bad outcome); positive values increase them (good outcome)
- **Bad metrics:** Positive values increase them (bad outcome); negative values reduce them (good outcome)
- Bad metrics are clamped at 0 (cannot go below zero)
- Effects are stored per-outbreak and fully reversed when the disease is cured

---

## Disease Types

### Severity Levels

| Severity | Properties Affected | Value Range | Cure Difficulty |
|----------|-------------------|-------------|-----------------|
| Minor | 2 properties | 1-8 | Low cost, fast cure |
| Major | 5 properties | 10-25 | High cost, slow cure |
| Severe | 5 properties | 10-25 | Very high cost, very slow cure |

### National Diseases

National diseases affect a single nation and can evolve into global diseases after 72 hours.

**Minor National Diseases** (2 properties, values 1-8):
- `crimson_cough` — Respiratory illness with red-tinged coughing
- `azure_fever` — Mild fever with blue-tinted skin
- `silver_shivers` — Temperature regulation disorder
- `golden_gastritis` — Digestive disorder with yellowish symptoms
- `violet_vertigo` — Balance disorder with purple eye discoloration
- `emerald_exhaustion` — Chronic fatigue with greenish complexion
- `copper_cramps` — Muscle disorder with bronze-colored inflammation
- `ruby_rash` — Skin condition creating red crystalline patterns
- `sapphire_syndrome` — Neurological condition with blue-tinted vision
- `obsidian_onset` — Bone density disorder with dark discoloration
- `sweating_sickness` — Historical fever disease from Tudor England
- `english_sweat` — Sudden onset fever with profuse sweating
- `dancing_mania` — Medieval mass psychogenic illness
- `king's_evil` — Scrofula - tuberculous cervical lymphadenitis
- `milk_sickness` — Poisoning from contaminated dairy
- `phossy_jaw` — Occupational disease from phosphorus exposure
- `radium_jaw` — Radiation poisoning affecting jaw bones
- `consumption` — Historical name for pulmonary tuberculosis
- `ergotism` — St. Anthony's Fire from ergot-contaminated grain
- `chlorosis` — Green sickness affecting young women
- `mal_de_ojo` — Evil eye syndrome from cultural beliefs
- `tarantism` — Dancing disease attributed to spider bites
- `lycanthropy` — Historical werewolf delusion disorder
- `windigo_psychosis` — Cannibalistic compulsion from indigenous folklore
- `grisi_siknis` — Cultural syndrome with aggressive behavior
- `latah` — Exaggerated startle response from Malaysia
- `pibloktoq` — Arctic hysteria with dramatic behavioral changes
- `amok` — Sudden violent behavior in Southeast Asia
- `susto` — Soul loss syndrome in Latin American culture
- `zar_possession` — Spirit possession syndrome in Africa/Middle East
- `neurasthenia` — Victorian-era nervous exhaustion syndrome
- `railway_spine` — Trauma disorder from early railway accidents
- `soldiers_heart` — Civil War-era cardiac neurosis
- `shell_shock` — WWI psychological trauma
- `da_costa_syndrome` — Irritable heart syndrome in soldiers
- `amber_ague` — Crystalline fever causing golden skin discoloration
- `mist_madness` — Fog-induced hallucinations
- `iron_lung_syndrome` — Metallic taste respiratory disorder
- `pearl_pox` — Iridescent skin lesions
- `echo_fever` — Auditory repetition disorder
- `glass_bone_disease` — Brittle bone syndrome
- `moonlight_melancholy` — Lunar cycle dependent depression
- `static_skin` — Electrical charge buildup in skin tissue
- `dream_leak` — Dreams bleeding into waking consciousness
- `dust_devil_disease` — Whirling sensation causing dizziness
- `whisper_weakness` — Voice fading to inaudible whispers
- `mirror_memory_loss` — Forgetting own reflection
- `clockwork_cough` — Mechanical rhythm respiratory spasms
- `butterfly_bones` — Bones becoming lightweight and fragile
- `tide_sickness` — Ocean rhythm induced nausea
- `phantom_pain_plague` — Pain in body parts never injured
- `shadow_blindness` — Inability to see shadows
- `crystal_tears` — Tears crystallizing upon contact with air
- `wind_whisper_disease` — Hearing voices in wind patterns
- `marble_muscle_syndrome` — Muscles hardening like stone
- `frost_touch` — Hands remain permanently cold
- `bubble_brain` — Thoughts popping like bubbles
- `velvet_voice` — Voice becoming unnaturally smooth
- `prism_vision` — Seeing rainbow fractures in light
- `echo_bones` — Bones producing hollow sound effects
- `liquid_logic` — Rational thinking becoming fluid
- `paper_skin` — Skin becoming thin and translucent
- `magnetic_madness` — Uncontrollable attraction to metal
- `ghost_grip` — Hands occasionally becoming intangible
- `smoke_sight` — Vision filled with smoke-like haze
- `thunder_tongue` — Voice producing thunder-like rumbles
- `starlight_sensitivity` — Extreme reaction to starlight
- `honeyed_hearing` — All sounds becoming unnaturally sweet
- `clockface_syndrome` — Facial features like clock numbers
- `silk_string_disease` — Hair becoming fine as spider silk
- `rainbow_rash` — Skin displaying shifting spectrum colors
- `gravity_giggles` — Uncontrollable laughter when falling
- `phantom_feathers` — Sensation of growing invisible feathers
- `molten_mood` — Emotions becoming liquid and unpredictable
- `crystal_cravings` — Irresistible urge to consume minerals
- `mist_memories` — Memories becoming foggy and unclear
- `clockwork_circulation` — Blood flow following mechanical timing
- `solar_sneeze_syndrome` — Uncontrollable sneezing in sunlight
- `phantom_orchestra` — Hearing invisible musical performances
- `emerald_emotions` — Feelings taking on green crystalline properties
- `tide_touch` — Hands becoming wet with ocean water
- `compass_confusion` — Internal sense of direction spinning
- `silver_speech` — Words carrying metallic resonance
- `dream_drift` — Consciousness floating between sleep and wake
- `lightning_limbs` — Arms and legs sparking with electricity
- `aurora_appetite` — Craving foods with aurora-like colors
- `phantom_percussion` — Hearing drumbeats from invisible instruments
- `metamorphic_moods` — Emotions literally transforming personality
- `celestial_circulation` — Blood flow following astronomical patterns
- `gossamer_grief` — Sadness becoming light and translucent
- `prismatic_pain` — Pain splitting into rainbow spectrum
- `temporal_taste_buds` — Tasting flavors from past and future
- `phantom_piano_fingers` — Fingers playing invisible piano keys
- `crystalline_cries` — Vocal expressions creating crystal formations
- `lunar_laughter` — Uncontrollable laughter during moon phases
- `mercury_memory` — Memories flowing like liquid metal
- `sapphire_sadness` — Melancholy taking on blue crystalline hardness
- `whispering_wounds` — Injuries that speak about their pain
- `floating_fears` — Anxieties becoming weightless and drifting
- `golden_gravity` — Personal gravitational field with golden tint
- `ethereal_exhaustion` — Fatigue making body semi-transparent
- `harmonic_headaches` — Head pain creating musical chord progressions
- `dimensional_dizziness` — Vertigo from glimpsing parallel dimensions
- `plasma_pulse` — Heartbeat generating plasma-like energy
- `fractal_feelings` — Emotions creating infinite recursive patterns
- `quantum_quiver` — Body vibrating at quantum frequencies
- `stellar_stuttering` — Speech patterns following stellar pulsations
- `nebula_nightmares` — Dreams filled with cosmic gas clouds
- `cosmic_coordination_loss` — Motor skills affected by galactic alignment
- `astral_arthritis` — Joint pain extending into spiritual dimensions

**Major National Diseases** (5 properties, values 10-25):
- `crimson_plague` — Severe blood-borne pathogen causing organ failure
- `void_sickness` — Mysterious disease causing cellular breakdown
- `crystal_curse` — Disease causing crystalline growths in organs
- `shadow_blight` — Neurological disease affecting cognitive functions
- `iron_rot` — Disease affecting metal metabolism in body
- `flame_fever` — High-temperature disease causing internal burning
- `frost_lung` — Respiratory disease causing hypothermic reactions
- `storm_sickness` — Electromagnetic sensitivity causing neural disruption
- `titan_plague` — Gigantism-inducing viral infection
- `mind_melt` — Psychoactive disease causing cognitive breakdown
- `bone_rot` — Skeletal deterioration causing structural collapse
- `blood_crystal_syndrome` — Crystallization of blood causing circulatory failure
- `soul_drain_epidemic` — Spiritual energy depletion causing existential crisis
- `time_sickness` — Chronological desynchronization affecting aging
- `gravity_madness` — Altered gravity perception causing mass hysteria
- `digital_decay` — Technology-induced neural deterioration
- `elemental_imbalance` — Disruption of bodily elemental harmony
- `nightmare_plague` — Shared nightmares causing sleep deprivation epidemic
- `mirror_syndrome` — Reality distortion causing identity fragmentation
- `echo_madness` — Auditory hallucinations creating mass paranoia
- `phantom_limb_epidemic` — Mass sensation of missing body parts
- `color_blindness_plague` — Complete loss of color vision across population
- `memory_erosion` — Progressive loss of collective memory
- `sensory_overload_syndrome` — Overwhelming hypersensitivity to all stimuli
- `black_death_strain` — Virulent plague strain similar to medieval pandemic
- `spanish_flu_variant` — Mutated influenza with high mortality rate
- `justinian_plague` — Ancient plague strain from Byzantine era
- `london_pestilence` — Great Plague variant with urban focus
- `third_pandemic` — Modern plague pandemic variant
- `antonine_plague` — Ancient Roman pandemic strain
- And many more...

### Global Diseases

Global diseases affect multiple nations simultaneously and are more severe.

**Minor Global Diseases** (2 properties, values 1-8):
- `global_shimmer_syndrome` — Worldwide visual disturbance affecting depth perception
- `aurora_ailment` — Light-sensitive condition affecting circadian rhythms
- `resonance_disorder` — Sound sensitivity causing disorientation
- `chromatic_confusion` — Color perception disorder affecting daily tasks
- `temporal_tremors` — Time perception disorder causing scheduling issues
- `magnetic_malaise` — Electromagnetic sensitivity affecting navigation
- `gravity_gastritis` — Digestive issues related to gravitational sensitivity
- `quantum_queasiness` — Nausea caused by quantum field fluctuations
- `neural_static` — Mental interference from electromagnetic fields
- `phase_shift_syndrome` — Dimensional instability affecting molecular cohesion
- `echo_memory_disorder` — False memories spreading through collective consciousness
- `crystalline_growth` — Mineral deposits forming in biological tissue
- `light_sensitivity_plague` — Worldwide photophobia affecting daily activities
- `atmospheric_pressure_syndrome` — Altitude sickness affecting all elevations
- `bio_rhythm_disruption` — Circadian cycle chaos affecting sleep patterns
- `molecular_drift` — Cellular structure instability causing random mutations
- `psychic_interference` — Mental static disrupting cognitive functions
- `energy_drain_malaise` — Unexplained fatigue affecting worldwide population
- `texture_blindness` — Loss of tactile sensation affecting fine motor skills
- `frequency_sickness` — Sensitivity to specific sound frequencies
- `phantom_taste_syndrome` — Persistent false tastes disrupting nutrition
- `micro_sleep_disorder` — Involuntary brief sleep episodes during waking hours
- `collective_tinnitus` — Worldwide phantom ringing in ears
- `depth_perception_loss` — Global inability to judge distances accurately
- `emotional_numbness` — Worldwide reduction in emotional responsiveness
- `false_hunger` — Phantom appetite causing overconsumption
- `motion_sickness_pandemic` — Extreme sensitivity to all forms of movement
- `spatial_confusion` — Difficulty with left-right and directional orientation
- `color_shift_syndrome` — Colors appear differently to each individual
- `texture_hypersensitivity` — Overwhelming tactile responses to normal materials
- `phantom_wind_syndrome` — Sensation of constant wind when air is still
- `temperature_confusion` — Inability to accurately perceive hot and cold
- `universal_vertigo` — Worldwide dizziness affecting balance
- `global_giggle_syndrome` — Uncontrollable laughter spreading worldwide
- `planetary_phantom_itch` — Worldwide sensation of itching with no cause
- `universal_unblinking` — Global inability to blink normally
- `cosmic_hiccup_epidemic` — Synchronized hiccupping across all humans
- `global_goosebump_syndrome` — Permanent goosebumps on all human skin
- `worldwide_wandering_eyes` — Eyes moving independently of conscious control
- `planetary_paper_cuts` — Microscopic cuts appearing without cause
- `universal_shoe_discomfort` — All footwear becoming uncomfortable globally
- `global_gravity_sensitivity` — Heightened awareness of gravitational changes
- `worldwide_word_mixing` — Random word order changes in speech
- `cosmic_coordination_chaos` — Slight loss of fine motor coordination worldwide
- `planetary_phantom_smells` — False odors detected by everyone simultaneously
- `universal_uneven_breathing` — Slightly irregular breathing patterns globally
- `global_ghost_touches` — Feeling phantom touches on skin worldwide
- `worldwide_weight_wobbles` — Fluctuating sense of body weight globally
- `cosmic_color_confusion` — Slight color perception shifts worldwide
- `planetary_pins_and_needles` — Mild tingling sensations affecting everyone
- `universal_unsteady_stairs` — Difficulty with stair navigation worldwide
- `global_guilty_giggles` — Inappropriate laughter in serious situations
- `worldwide_wandering_attention` — Slightly reduced attention spans globally
- `cosmic_counting_confusion` — Minor mathematical processing difficulties
- `planetary_phantom_fullness` — False sensation of being full after small meals
- `universal_upside_down_text` — Text occasionally appearing inverted to everyone
- `global_gravity_giggles` — Laughter when experiencing gravity changes
- `worldwide_whistle_weakness` — Inability to whistle properly affecting everyone
- `cosmic_clothes_clinginess` — Fabric adhering uncomfortably to skin worldwide
- `planetary_phantom_phone_vibrations` — False sensation of device notifications
- `universal_uncomfortable_chairs` — All seating becoming uncomfortable globally
- `global_gum_stickiness` — All chewing gum becoming excessively sticky
- `worldwide_window_fog` — All glass surfaces fogging unexpectedly
- `cosmic_corner_confusion` — Difficulty judging angles and corners globally
- `planetary_phantom_stairs` — Feeling steps that do not exist
- `universal_unmatched_socks` — All sock pairs becoming visually mismatched
- `global_ghost_music` — Hearing faint phantom melodies worldwide
- `worldwide_wobbly_writing` — Handwriting becoming slightly unsteady globally
- `cosmic_color_bleeding` — Colors slightly bleeding into adjacent areas
- `planetary_phantom_pockets` — Feeling pockets in clothing where none exist
- `universal_uneven_floors` — Perception of floor surfaces being slightly uneven
- `global_gravity_hiccups` — Brief moments of feeling weightless randomly
- `worldwide_whisper_echoes` — All whispers creating slight echo effects
- `cosmic_compass_confusion` — Magnetic compasses showing slight deviations
- `planetary_phantom_buttons` — Feeling buttons on clothing where none exist
- `universal_unsteady_tables` — All tables feeling slightly unstable
- `global_ghost_winds` — Feeling phantom breezes in still air
- `worldwide_wobbly_wheels` — Sensation of wheels wobbling on all vehicles
- `cosmic_calendar_confusion` — Slight uncertainty about current date
- `planetary_phantom_drafts` — Feeling cold drafts in warm, sealed spaces
- `universal_uneven_lighting` — Perception of lighting being slightly off everywhere
- `global_gravity_delays` — Slight delay in gravitational effects on dropped objects
- `worldwide_water_weirdness` — All water tasting slightly different than expected

**Major Global Diseases** (5 properties, values 10-25):
- `world_ender_virus` — Catastrophic pathogen threatening civilization
- `civilization_collapse_syndrome` — Systemic failure disease affecting all infrastructure
- `planetary_plague` — Ecosystem-wide pathogen affecting all life forms
- `reality_rupture_disease` — Quantum-level disease affecting spacetime stability
- `consciousness_virus` — Memetic pathogen affecting collective intelligence
- `dimensional_decay` — Multidimensional infection causing reality breakdown
- `entropy_epidemic` — Thermodynamic disease accelerating universal decay
- `new_black_death` — Modern strain of bubonic plague with global reach
- `super_influenza` — Highly contagious flu strain resistant to treatments
- `global_hemorrhagic_fever` — Worldwide bleeding disorder with high mortality
- `neuro_degradation_pandemic` — Progressive brain function loss across all ages
- `immune_system_collapse` — Worldwide failure of natural disease resistance
- `cellular_breakdown_syndrome` — Rapid aging and cellular death acceleration
- `genetic_scrambler` — DNA corruption causing random mutations
- `organ_liquefaction` — Internal organs dissolving at cellular level
- `memory_plague` — Progressive amnesia erasing human knowledge
- `biological_reversal` — Evolution running backwards, losing human traits
- `synthetic_rejection` — Bodies rejecting all artificial materials and medicines
- `sensory_cascade_failure` — Progressive loss of all five senses
- `empathy_virus` — Overwhelming emotional connection causing psychic overload
- `time_lock_syndrome` — Consciousness trapped in temporal loops
- `reality_rejection` — Inability to distinguish reality from imagination
- `collective_nightmare` — Shared horrific dreams invading waking hours
- `species_fragmentation` — Humans splitting into incompatible subspecies
- `existence_doubt_pandemic` — Philosophical virus questioning reality of existence
- `soul_fragmentation` — Spiritual essence dividing causing identity crisis
- `quantum_consciousness_leak` — Minds bleeding into parallel dimensions
- `universal_allergic_reaction` — Allergic to existence itself at molecular level
- `cognitive_recursion_trap` — Thoughts stuck in infinite loops preventing action
- `existential_void_syndrome` — Complete loss of meaning and purpose in existence
- `meta_awareness_overload` — Consciousness of being fictional causing breakdown
- `simulation_hypothesis_madness` — Certainty of living in computer simulation causing despair
- `temporal_paradox_sickness` — Causality loops causing physical and mental breakdown
- `universal_soul_extraction` — Spiritual essence being systematically drained from all humans
- `planetary_personality_purge` — Individual personalities being erased and homogenized
- `cosmic_consciousness_cancer` — Malignant growth in collective human awareness
- `dimensional_dna_decay` — Genetic code corrupting across multiple dimensions
- `universal_unraveling_syndrome` — Reality itself beginning to decompose
- `planetary_physics_failure` — Natural laws becoming unreliable worldwide
- `cosmic_causality_collapse` — Cause and effect relationships breaking down

---

## Mechanics

### Outbreak Triggering

Outbreaks are checked every game tick through `checkDiseaseSpread()`:

1. **Minor outbreaks** are checked every 2 ticks with 5% base chance
2. **Major outbreaks** are checked every 12 ticks with 2% base chance
3. Chance modifiers based on nation conditions:
   - **Pollution > 50:** Increases chance (up to 2.0x multiplier)
   - **Disease > 30:** Increases chance linearly
   - **Happiness < 40:** Increases chance (lower health = higher chance)
   - **Happiness > 70:** Decreases chance (up to 0.5x multiplier)

### Outbreak Spread

Active outbreaks can spread to neighboring nations:
- **Spread rate:** 2% per tick per neighbor
- Only spreads to neighbors that don't already have the same disease
- Requires `getNeighboringNations()` on game engine

### Disease Evolution

National diseases can evolve into global diseases:
- **Evolution time:** 72 hours after outbreak start
- When evolved, the disease applies to ALL nations that don't already have it
- The disease scope changes from `national` to `global`

### Global Disease Events

Triggered every tick based on global aggregate metrics:
- **Base chance:** 1% per tick
- **Global pollution > 60:** Increases chance (up to 1.5x multiplier)
- **Global health < 40:** Increases chance (up to 1.5x multiplier)
- When triggered, affects ~70% of nations with a random global disease

### Curing Diseases

Curing requires meeting cure requirements:
- **Money cost:** Varies by disease (minor: ~$70K-$150K, major: $2M-$80M, global: $32M-$80M)
- **Time:** Varies by disease (minor: 15-34 hours, major: 110-200 hours, global: 410-600 hours)
- **Research points:** Varies by disease (minor: 3-10, major: 45-80, global: 140-300)
- **Global cooperation:** Required for global diseases

When cured:
- All disease effects are removed (reversed)
- Outbreak is marked as cured and removed from active outbreaks
- If global disease and no other nations have it, it's removed from global outbreaks

---

## Methods

| Method | Description |
|--------|-------------|
| `initialize()` | Initializes the system, binds events, starts checks |
| `getRandomDisease(severity, scope)` | Returns a random disease matching criteria |
| `getDiseaseById(id)` | Returns disease definition by ID |
| `startOutbreak(nationId, diseaseId, severity)` | Starts a disease outbreak in a nation |
| `cureOutbreak(outbreakId, cureMethod)` | Cures an outbreak, reverses effects |
| `applyDiseaseEffects(nationId, disease)` | Applies disease effects to nation properties |
| `removeDiseaseEffects(nationId, disease)` | Removes/reverses disease effects |
| `checkDiseaseSpread()` | Main tick handler: checks outbreaks, spread, evolution, global events |
| `updateGlobalMetrics(nations)` | Calculates aggregate global pollution, disease, health |
| `checkRandomOutbreak(nationId, severity)` | Checks if a specific nation gets an outbreak |
| `checkOutbreakSpread(nationId)` | Checks if existing outbreaks spread to neighbors |
| `checkGlobalEvent()` | Checks if a global disease event should trigger |
| `triggerGlobalEvent()` | Triggers a global disease event |
| `startDiseaseChecks()` | Starts the tick interval (every 60 seconds) |
| `stopDiseaseChecks()` | Stops the tick interval |
| `setupEventHandlers()` | Sets up event listeners for nation events |
| `getNationOutbreaks(nationId)` | Returns all active outbreaks for a nation |
| `getGlobalOutbreaks()` | Returns all active global disease IDs |
| `getAllOutbreaks()` | Returns all active outbreaks |
| `getDiseaseStats()` | Returns statistics about diseases |

---

## Data Files

| File | Contents |
|------|----------|
| `assets/data/diseases/national-diseases.js` | 60+ national disease definitions (minor and major) |
| `assets/data/diseases/global-diseases.js` | 40+ global disease definitions (minor and major) |

Both files export `window.NATIONAL_DISEASES` and `window.GLOBAL_DISEASES` objects with `minor` and `major` arrays.

---

## Integration Points

| Consumer | Usage |
|----------|-------|
| `core/game-engine.js` | Provides `getPlayer()`, `getAllPlayers()`, `getNeighboringNations()` |
| `entities/Nation.js` | Stores `diseaseEffects` map, `healthcare_spending`, `buildingUpkeep.improvements` |
| `window.eventSystem` | Emits `diseaseOutbreakStart` and `diseaseOutbreakCured` events |

---

## Export

```js
window.DiseaseSystem = DiseaseSystem;
```
