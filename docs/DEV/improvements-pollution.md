# Improvements, Projects & Wonders Pollution Reference

Complete listing of all improvements, projects, and wonders and their pollution effects as calculated in `systems/nation-system.js` `calculatePollution()`.

## Overview

Pollution is calculated per-turn in `NationSystem.calculatePollution()` (`systems/nation-system.js:370`). Base pollution comes from infrastructure (`infra / 50`) and population (`population / 200000`). Improvements, projects, and wonders add additional pollution on top.

Pollution reduction is now **absolute point subtraction** (not percentage). Each reducer subtracts a fixed number of points from the total pollution pool.

---

## All Improvements (Pollution Only)

| Improvement | Key | Max | Cost | Pollution | Pollution Notes |
|-------------|-----|-----|------|-----------|-----------------|
| Barracks | `barracks` | 5 | $1.5M | **+25** | +25 pollution per barracks |
| Factory | `factory` | 5 | $2M | **+50** | +50 pollution per factory |
| Airforce Base | `airforceBase` | 5 | $2.8M | **+75** | +75 pollution per base |
| Harbor | `harbor` | 5 | $2.5M | **+100** | +100 pollution per harbor |
| Embassy | `embassy` | 5 | $1.2M | 0 | No pollution |
| Foreign Affairs Office | `foreignAffairsOffice` | 1 | $3.5M | 0 | No pollution |
| Internal Affairs Office | `internalAffairsOffice` | 1 | $3M | 0 | No pollution |
| Hospital | `hospital` | 5 | $900K | 0 | No pollution |
| Police Station | `policeStation` | 5 | $750K | 0 | No pollution |
| Recycling Center | `recyclingCenter` | 5 | $1.1M | **-300** | **-300 pollution reduction per center** |
| School | `school` | 5 | $1M | 0 | No pollution |
| Park | `park` | 5 | $650K | **-75** | **-75 pollution per park** |
| Tree Plantation | `treePlantation` | 5 | $450K | **-150** | **-150 pollution per plantation** |
| Farm | `farm` | 5 | $500K | 0 | No pollution |
| Well | `well` | 5 | $500K | 0 | No pollution |
| Casino | `casino` | 5 | $1.8M | **+100** | +100 pollution per casino |
| Research Laboratory | `researchLab` | 4 | $2.2M | **+25** | +25 pollution per lab |
| Iron Mine | `steelMill` | 5 | $750K | **+75** | +75 pollution per mine |
| Tin Mine | `bronzeSmelter` | 5 | $750K | **+75** | +75 pollution per mine |
| Lead Mine | `leadRefinery` | 5 | $750K | **+75** | +75 pollution per mine |
| Bauxite Mine | `aluminumSmelter` | 5 | $750K | **+75** | +75 pollution per mine |
| Copper Mine | `copperRefinery` | 5 | $750K | **+75** | +75 pollution per mine |
| Uranium Mine | `uraniumEnrichmentPlant` | 5 | $750K | **+75** | +75 pollution per mine |
| Oil Rig | `gasolineRefinery` | 5 | $750K | **+75** | +75 pollution per rig |
| Steel Mill | `steelFoundry` | 5 | $1M | **+125** | +125 pollution per mill |
| Bronze Foundry | `bronzeCasting` | 5 | $1M | **+125** | +125 pollution per foundry |
| Lead Refinery | `leadCasting` | 5 | $1M | **+125** | +125 pollution per refinery |
| Aluminum Smelter | `aluminumExtrusion` | 5 | $1M | **+125** | +125 pollution per smelter |
| Copper Refinery | `copperDrawing` | 5 | $1M | **+125** | +125 pollution per refinery |
| Uranium Enrichment Plant | `uraniumFuelFabrication` | 5 | $1M | **+125** | +125 pollution per plant |
| Oil Refinery | `gasolineBlending` | 5 | $1M | **+125** | +125 pollution per refinery |

### Set 1: Urban Greenbelt & Civic Nature (New Improvements)

| Improvement | Key | Max | Cost | Pollution | Pollution Notes |
|-------------|-----|-----|------|-----------|-----------------|
| Community Garden | `communityGarden` | 5 | $800K | **-60** | **-60 pollution per garden** |
| Urban Arboretum | `urbanArboretum` | 5 | $1.2M | **-110** | **-110 pollution per arboretum** |
| Wetlands Preserve | `wetlandsPreserve` | 5 | $1.4M | **-140** | **-140 pollution per preserve** |

### Set 2: Industrial Filtration & Waste Management (New Improvements)

| Improvement | Key | Max | Cost | Pollution | Pollution Notes |
|-------------|-----|-----|------|-----------|-----------------|
| Waste Treatment Plant | `wasteTreatmentPlant` | 5 | $1.6M | **-180** | **-180 pollution per plant** |
| Emissions Scrubber Tower | `emissionsScrubberTower` | 5 | $1.5M | **-160** | **-160 pollution per tower** |
| Bioremediation Center | `bioremediationCenter` | 5 | $1.3M | **-130** | **-130 pollution per center** |

---

## All Projects (Pollution Only)

| Project | Key | Max | Cost | Tech | Pollution | Pollution Notes |
|---------|-----|-----|------|------|-----------|-----------------|
| Missile Silo | `missileSilo` | 3 | $8M | 500 | **+50** | +50 pollution per silo |
| Iron Curtain Defense System | `ironCurtain` | 3 | $12M | 500 | **+50** | +50 pollution per system |
| Nuclear Shield Defense System | `nuclearShield` | 3 | $20M | 1000 | **+50** | +50 pollution per system |
| Military Command Center | `commandCenter` | 3 | $9M | 750 | 0 | No pollution |
| Advanced Military Academy | `militaryAcademy` | 1 | $28M | 1500 | 0 | No pollution |
| Intelligence Operations Center | `spyOperations` | 5 | $11M | 750 | **+50** | +50 pollution per center |
| Elite Military Training Program | `enhancedBarracks` | 1 | $20M | 750 | **+75** | +75 pollution |
| Advanced Tank Manufacturing | `enhancedFactories` | 1 | $26M | 1000 | **+150** | +150 pollution |
| Advanced Aircraft Systems | `enhancedAirforces` | 1 | $32M | 1250 | **+225** | +225 pollution |
| Advanced Naval Operations | `enhancedNavy` | 1 | $28M | 1100 | **+300** | +300 pollution |
| Military Salvage Operations | `militarySalvage` | 3 | $6M | 700 | **-50** | -50 pollution per project |
| National University | `university` | 3 | $10M | 500 | 0 | No pollution |
| Advanced University | `advancedUniversity` | 1 | $20M | 600 | 0 | No pollution |
| Emergency Medical Hub | `ambulanceHub` | 3 | $6M | 500 | 0 | No pollution |
| Government Monument | `governmentStatue` | 1 | $32M | 1000 | 0 | No pollution |
| Religious Monument | `religiousStatue` | 1 | $32M | 1000 | 0 | No pollution |
| SWAT Operations Center | `swatPolice` | 3 | $8M | 750 | 0 | No pollution |
| Advanced Research Institute | `advancedResearch` | 1 | $15M | 1000 | 0 | No pollution |
| Advanced Police Stations | `enhancedPolice` | 3 | $8M | 800 | 0 | No pollution |
| National Broadcasting Network | `broadcasting` | 1 | $10M | 300 | 0 | No pollution |
| Advanced Recycling Operations | `enhancedRecycling` | 1 | $20M | 800 | **Doubles** | Doubles recycling center (-300 → -600 each) |
| Advanced Agriculture | `advancedAgriculture` | 1 | $10M | 800 | 0 | No pollution |
| Farm Synergy | `farmSynergy` | 1 | $15M | 1000 | 0 | No pollution |
| Advanced Well Drilling | `advancedWellDrilling` | 1 | $10M | 800 | 0 | No pollution |
| Well Synergy | `wellSynergy` | 1 | $15M | 1000 | 0 | No pollution |
| Salvage Yard | `salvageYard` | 1 | $8M | 600 | 0 | No pollution |
| Financial Assistance Office | `financialAssistanceOffice` | 1 | $15M | 800 | 0 | No pollution |
| Office of Relationships | `officeOfRelationships` | 1 | $13M | 500 | 0 | No pollution |
| Sports Betting Complex | `sportsBetting` | 1 | $15M | 600 | **+200** | +200 pollution |
| Food Production Facility | `foodProduction` | 3 | $5M | 100 | **-100** | -100 pollution per facility |
| Water Production Facility | `waterProduction` | 3 | $5M | 100 | **-100** | -100 pollution per facility |

### Set 1: Urban Greenbelt & Civic Nature (New Projects)

| Project | Key | Max | Cost | Tech | Pollution | Pollution Notes |
|---------|-----|-----|------|------|-----------|-----------------|
| Green Space Initiative | `greenSpaceInitiative` | 1 | $10M | 800 | **Doubles** | Doubles Community Garden reduction (-60 → -120 each) |
| Urban Forestry Program | `urbanForestryProgram` | 1 | $8M | 600 | **-200 flat** | -200 flat pollution reduction |

### Set 2: Industrial Filtration & Waste Management (New Projects)

| Project | Key | Max | Cost | Tech | Pollution | Pollution Notes |
|---------|-----|-----|------|------|-----------|-----------------|
| Carbon Capture Program | `carbonCaptureProgram` | 1 | $12M | 900 | **-100 per transition** | -100 pollution per transition plant (Steel Mill, Bronze Foundry, etc.) |
| Zero Waste Initiative | `zeroWasteInitiative` | 1 | $10M | 800 | **Doubles** | Doubles Waste Treatment Plant reduction (-180 → -360 each) |

### Set 3: Regulatory & Civic Programs (New Projects)

| Project | Key | Max | Cost | Tech | Pollution | Pollution Notes |
|---------|-----|-----|------|------|-----------|-----------------|
| Clean Air Regulations | `cleanAirRegulations` | 1 | $15M | 1000 | **-15%** | -15% pollution from all sources (percentage, applied after flats) |
| Public Transit Expansion | `publicTransitExpansion` | 1 | $8M | 500 | **-50 per** | -50 pollution per Harbor and Airforce Base |
| EPA Agency | `epaAgency` | 1 | $20M | 1200 | **-250 flat** | -250 flat pollution + blocks bad-edict pollution increases |

---

## All Wonders (Pollution Only)

| Wonder | Key | Max | Cost | Tech | Pollution | Pollution Notes |
|--------|-----|-----|------|------|-----------|-----------------|
| Government Monument | `governmentMonument` | 1 | $50M | 500 | 0 | No pollution |
| Religious Monument | `religiousMonument` | 1 | $50M | 500 | 0 | No pollution |
| Great Library | `great_library` | 1 | $75M | 600 | 0 | No pollution |
| Grand Research Academy | `grandResearchAcademy` | 1 | $100M | 1200 | 0 | No pollution |
| Environmental Research Complex | `environmentalResearchComplex` | 1 | $90M | 1400 | **Removes ALL** | Removes ALL pollution from laboratories |
| Universal Education System | `universalEducation` | 1 | $75M | 2000 | 0 | No pollution |
| Universal Healthcare System | `universalHealthcare` | 1 | $80M | 2000 | 0 | No pollution |
| Enhanced Missile Silo Network | `enhancedSilos` | 1 | $60M | 1500 | 0 | No pollution |
| Enhanced Intelligence Network | `enhancedSpyOps` | 1 | $90M | 3000 | 0 | No pollution |
| Military Recovery Wonder | `militaryRecovery` | 1 | $55M | 1200 | 0 | No pollution |
| Advanced Resource Recovery Complex | `enhancedSalvage` | 1 | $70M | 1500 | 0 | No pollution |
| Nuclear Warhead Production Facility | `nuclearWarheadFacility` | 1 | $100M | 750 | **+50** | +50 pollution |
| Enhanced Nuclear Arsenal | `enhancedNuclearWarheads` | 1 | $150M | 2000 | **+100** | +100 pollution |
| Basketball Stadium Complex | `basketballStadium` | 1 | $90M | 1200 | 0 | No pollution |
| Hockey Arena Complex | `hockeyStadium` | 1 | $90M | 1300 | 0 | No pollution |
| Soccer Stadium Complex | `soccerStadium` | 1 | $90M | 1100 | 0 | No pollution |
| Football Stadium Complex | `footballStadium` | 1 | $90M | 1400 | 0 | No pollution |
| Alliance Headquarters Complex | `allianceHeadquarters` | 1 | $75M | 1000 | 0 | No pollution |
| Supreme Mining Complex | `supremeMining` | 1 | $80M | 1500 | **+50 per mine** | Adds +50 pollution to each raw resource production mine |
| Clean Mining Operations Wonder | `cleanMining` | 1 | $75M | 1800 | **-75% reduction** | Removes 75% of pollution from each raw resource production mine |
| Supreme Manufacturing Complex | `supremeAssembly` | 1 | $85M | 1800 | **+75 per plant** | Adds +75 pollution to each resource transition manufacturing plant |
| Clean Assembly Operations Wonder | `cleanAssembly` | 1 | $80M | 2000 | **-50% reduction** | Removes 50% of pollution from each resource transition manufacturing plant |
| Supreme Environmental Protection Complex | `supremeRecycling` | 1 | $90M | 2200 | **Triples** | Triples recycling center reduction (-300 → -900 each); removes happiness penalty |
| Global Climate Accord | `globalClimateAccord` | 1 | $120M | 2200 | **-10%** | -10% pollution from all sources (percentage, applied after flats) |

### Set 1: Urban Greenbelt & Civic Nature (New Wonders)

| Wonder | Key | Max | Cost | Tech | Pollution | Pollution Notes |
|--------|-----|-----|------|------|-----------|-----------------|
| National Parks System | `nationalParksSystem` | 1 | $90M | 1500 | **Doubles** | Doubles park pollution reduction (-75 → -150 each); +1 environment per park |
| Ancient Forest Preserve | `ancientForestPreserve` | 1 | $90M | 2000 | **Doubles** | Doubles tree plantation pollution reduction (-150 → -300 each); +1 environment per plantation |

### Set 2: Industrial Filtration & Waste Management (New Wonders)

| Wonder | Key | Max | Cost | Tech | Pollution | Pollution Notes |
|--------|-----|-----|------|------|-----------|-----------------|
| Carbon Sequestration Facility | `carbonSequestrationFacility` | 1 | $100M | 1800 | **-600 flat** | -600 flat pollution reduction |
| Atmospheric Filtration Dome | `atmosphericFiltrationDome` | 1 | $110M | 2000 | **-700 flat** | -700 flat pollution reduction |

### Set 3: Regulatory & Civic Programs (New Wonders)

| Wonder | Key | Max | Cost | Tech | Pollution | Pollution Notes |
|--------|-----|-----|------|------|-----------|-----------------|
| Green Technology Institute | `greenTechnologyInstitute` | 1 | $80M | 1600 | **-50% labs** | Cuts Research Lab pollution by 50% |
| Zero Emission Zone | `zeroEmissionZone` | 1 | $150M | 2400 | **-300 flat** | -300 flat + removes Harbor/Airforce Base pollution |

---

## Pollution-Producing Summary (Planned)

### Improvements producing pollution

| Improvement | Key | Pollution Per Unit | Max Count | Max Pollution |
|-------------|-----|--------------------|-----------|---------------|
| Harbor | `harbor` | +100 | 5 | +500 |
| Casino | `casino` | +100 | 5 | +500 |
| Iron Mine | `steelMill` | +75 | 5 | +375 |
| Tin Mine | `bronzeSmelter` | +75 | 5 | +375 |
| Lead Mine | `leadRefinery` | +75 | 5 | +375 |
| Bauxite Mine | `aluminumSmelter` | +75 | 5 | +375 |
| Copper Mine | `copperRefinery` | +75 | 5 | +375 |
| Uranium Mine | `uraniumEnrichmentPlant` | +75 | 5 | +375 |
| Oil Rig | `gasolineRefinery` | +75 | 5 | +375 |
| Airforce Base | `airforceBase` | +75 | 5 | +375 |
| Steel Mill | `steelFoundry` | +125 | 5 | +625 |
| Bronze Foundry | `bronzeCasting` | +125 | 5 | +625 |
| Lead Refinery | `leadCasting` | +125 | 5 | +625 |
| Aluminum Smelter | `aluminumExtrusion` | +125 | 5 | +625 |
| Copper Refinery | `copperDrawing` | +125 | 5 | +625 |
| Uranium Enrichment Plant | `uraniumFuelFabrication` | +125 | 5 | +625 |
| Oil Refinery | `gasolineBlending` | +125 | 5 | +625 |
| Factory | `factory` | +50 | 5 | +250 |
| Barracks | `barracks` | +25 | 5 | +125 |
| Research Laboratory | `researchLab` | +25 | 4 | +100 |

### Projects producing pollution

| Project | Key | Pollution Per Unit | Max Count | Max Pollution |
|---------|-----|--------------------|-----------|---------------|
| Advanced Naval Operations | `enhancedNavy` | +300 | 1 | +300 |
| Advanced Aircraft Systems | `enhancedAirforces` | +225 | 1 | +225 |
| Sports Betting Complex | `sportsBetting` | +200 | 1 | +200 |
| Advanced Tank Manufacturing | `enhancedFactories` | +150 | 1 | +150 |
| Elite Military Training Program | `enhancedBarracks` | +75 | 1 | +75 |
| Missile Silo | `missileSilo` | +50 | 3 | +150 |
| Iron Curtain Defense System | `ironCurtain` | +50 | 3 | +150 |
| Nuclear Shield Defense System | `nuclearShield` | +50 | 3 | +150 |
| Intelligence Operations Center | `spyOperations` | +50 | 5 | +250 |

### Wonders producing pollution

| Wonder | Key | Pollution |
|--------|-----|-----------|
| Enhanced Nuclear Arsenal | `enhancedNuclearWarheads` | +100 |
| Nuclear Warhead Production Facility | `nuclearWarheadFacility` | +50 |
| Supreme Mining Complex | `supremeMining` | +50 per mine |
| Supreme Manufacturing Complex | `supremeAssembly` | +75 per transition plant |

---

## Pollution-Reducing Summary (Planned)

### Improvements reducing pollution

| Improvement | Key | Pollution Reduction Per Unit | Max Count | Max Reduction |
|-------------|-----|-----------------------------|-----------|---------------|
| Recycling Center | `recyclingCenter` | -300 | 5 | -1500 |
| Tree Plantation | `treePlantation` | -150 | 5 | -750 |
| Park | `park` | -75 | 5 | -375 |
| Community Garden | `communityGarden` | -60 | 5 | -300 |
| Urban Arboretum | `urbanArboretum` | -110 | 5 | -550 |
| Wetlands Preserve | `wetlandsPreserve` | -140 | 5 | -700 |
| Waste Treatment Plant | `wasteTreatmentPlant` | -180 | 5 | -900 |
| Emissions Scrubber Tower | `emissionsScrubberTower` | -160 | 5 | -800 |
| Bioremediation Center | `bioremediationCenter` | -130 | 5 | -650 |

### Projects reducing pollution

| Project | Key | Pollution Reduction | Max Count | Max Reduction |
|---------|-----|--------------------|-----------|---------------|
| Military Salvage Operations | `militarySalvage` | -50 | 3 | -150 |
| Advanced Recycling Operations | `enhancedRecycling` | Doubles recycling center (-300 → -600 per center) | 1 | Context-dependent |
| Park Expansion Program | `parkExpansion` | Doubles park reduction (-75 → -150 per park) | 1 | Context-dependent |
| Arboretum Initiative | `arboretumInitiative` | Doubles tree plantation reduction (-150 → -300 per plantation) | 1 | Context-dependent |
| Zero Waste Initiative | `zeroWasteInitiative` | Doubles Waste Treatment Plant (-180 → -360 each) | 1 | Context-dependent |
| Clean Air Regulations | `cleanAirRegulations` | -15% pollution (percentage) | 1 | Context-dependent |
| Public Transit Expansion | `publicTransitExpansion` | -50 per Harbor/Airforce Base | 1 | Context-dependent |
| EPA Agency | `epaAgency` | -250 flat + blocks bad-edict pollution | 1 | -250 flat |
| Carbon Capture Program | `carbonCaptureProgram` | -100 per transition plant | 1 | Context-dependent |
| Food Production Facility | `foodProduction` | -100 | 3 | -300 |
| Water Production Facility | `waterProduction` | -100 | 3 | -300 |
| Urban Forestry Program | `urbanForestryProgram` | -200 flat | 1 | -200 flat |

### Wonders reducing pollution

| Wonder | Key | Pollution Reduction |
|--------|-----|--------------------|
| Environmental Research Complex | `environmentalResearchComplex` | Removes ALL pollution from laboratories |
| Clean Mining Operations Wonder | `cleanMining` | Removes 75% of pollution from each raw resource production mine |
| Clean Assembly Operations Wonder | `cleanAssembly` | Removes 50% of pollution from each resource transition manufacturing plant |
| Supreme Environmental Protection Complex | `supremeRecycling` | Triples recycling center reduction (-300 → -900 per center) |
| National Parks System | `nationalParksSystem` | Doubles park reduction (-75 → -150 per park); +1 environment per park |
| Ancient Forest Preserve | `ancientForestPreserve` | Doubles tree plantation reduction (-150 → -300 per plantation); +1 environment per plantation |
| Carbon Sequestration Facility | `carbonSequestrationFacility` | -600 flat pollution |
| Atmospheric Filtration Dome | `atmosphericFiltrationDome` | -700 flat pollution |
| Green Technology Institute | `greenTechnologyInstitute` | -50% pollution from Research Labs |
| Global Climate Accord | `globalClimateAccord` | -10% pollution from all sources |
| Zero Emission Zone | `zeroEmissionZone` | -300 flat + removes Harbor/Airforce Base pollution |

---

## Pollution Calculation Details

### Base Pollution (`nation-system.js:370`)

```
basePollution = floor(infra / 50) + floor(population / 200000)
```

### Improvement Pollution Addition

| Source | Count Source | Pollution Per Unit |
|--------|-------------|-------------------|
| Mineral Production (7 mine types) | `nation.improvements?.[type]` | +75 |
| Transition (7 plant types) | `nation.improvements?.[type]` | +125 |
| Factory | `nation.improvements?.factory` | +50 |
| Research Lab | `nation.improvements?.researchLab` | +25 |

### Pollution Reductions (Absolute Point Subtraction)

| Reduction Source | Reduction Per Unit | Max |
|-----------------|-------------------|-----|
| Recycling Center | -300 per center | -1500 (5 centers) |
| Enhanced Recycling project | Additional -300 per center | -1500 more |
| Supreme Recycling wonder | Additional -600 per center | -3000 more |
| Park | -75 per park | -375 (5 parks) |
| Park Expansion Project | Additional -75 per park | -375 more |
| National Parks System Wonder | Additional -75 per park | -375 more |
| Tree Plantation | -150 per plantation | -750 (5 plantations) |
| Arboretum Initiative Project | Additional -150 per plantation | -750 more |
| Ancient Forest Preserve Wonder | Additional -150 per plantation | -750 more |
| Community Garden | -60 per garden | -300 (5 gardens) |
| Green Space Initiative Project | Additional -60 per garden | -300 more |
| Urban Arboretum | -110 per arboretum | -550 (5 arboretums) |
| Wetlands Preserve | -140 per preserve | -700 (5 preserves) |
| Waste Treatment Plant | -180 per plant | -900 (5 plants) |
| Zero Waste Initiative Project | Additional -180 per plant | -900 more |
| Emissions Scrubber Tower | -160 per tower | -800 (5 towers) |
| Bioremediation Center | -130 per center | -650 (5 centers) |
| Urban Forestry Program Project | -200 flat | -200 |
| EPA Agency Project | -250 flat | -250 |
| Carbon Sequestration Facility Wonder | -600 flat | -600 |
| Atmospheric Filtration Dome Wonder | -700 flat | -700 |
| National Arboretum Wonder | -400 flat | -400 |
| Great Wetlands Restoration Wonder | -500 flat | -500 |
| Zero Emission Zone Wonder | -300 flat + removes Harbor/Airforce pollution | -300 flat |
| Military Salvage Operations Project | -50 per project | -150 (3 projects) |
| Carbon Capture Program Project | -100 per transition plant | Context-dependent |
| Public Transit Expansion Project | -50 per Harbor/Airforce Base | Context-dependent |
| Food Production Facility Project | -100 per facility | -300 (3 facilities) |
| Water Production Facility Project | -100 per facility | -300 (3 facilities) |

### Percentage Modifiers (Applied After Flat Reductions)

| Source | Effect |
|--------|--------|
| Clean Air Regulations Project | -15% total pollution |
| Global Climate Accord Wonder | -10% total pollution |
| Clean Mine Operations Wonder | -75% mineral production pollution |
| Clean Assembly Operations Wonder | -50% transition improvement pollution |
| Green Technology Institute Wonder | -50% Research Lab pollution |
| Environmental Research Complex Wonder | Removes ALL laboratory pollution |
| Zero Emission Zone Wonder | Removes Harbor/Airforce Base pollution |
| Edict pollutionModifier | All edicts with pollutionModifier increase it (+8% to +18%) |

### Final Pollution Formula

```
totalPollution = basePollution + minePollution + transitionPollution + factoryPollution + labPollution
totalPollution -= allAbsoluteReductions
totalPollution = Math.max(0, Math.floor(totalPollution * percentageMultiplier))
nation.nationStats.pollution = totalPollution
```

Where `percentageMultiplier` starts at 1.0 and is modified by Clean Air Regulations (-0.15), Global Climate Accord (-0.10), and edict pollutionModifier values.
