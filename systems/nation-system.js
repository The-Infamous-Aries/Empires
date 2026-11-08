/**
 * Nation System - Core Nation Logic and Daily Turn Orchestrator
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Orchestrates all nation-level systems: daily turns, population, economy,
 * statistics, government/religion, research, military, trade, and events.
 * Operates on a Nation entity instance (state stays in entities/Nation.js).
 */

class NationSystem {
    constructor(nation = null) {
        this.nation = nation;
        this.isInitialized = false;
    }

    /**
     * Set the nation instance this system operates on.
     */
    setNation(nation) {
        this.nation = nation;
    }

    /**
     * Get the nation instance this system operates on.
     */
    getNation() {
        return this.nation;
    }

    /**
     * Initialize the nation system with an existing nation entity.
     */
    initialize(nation) {
        this.nation = nation;
        this.isInitialized = true;
        // Initialize XP Goals System
        if (window.XPGoalsSystem && !window.XPGoalsSystem.isInitialized) {
            window.XPGoalsSystem.bindEvents();
            window.XPGoalsSystem.isInitialized = true;
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // DAILY / MONTHLY / YEARLY TURN HANDLERS
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Daily turn handler — orchestrates all nation-level daily processing.
     */
    handleDayPassed(data) {
        const nation = this.nation;
        if (!nation) return;

        // 1. Process temporary effects (population/happiness reductions from military)
        this.processTemporaryEffects();

        // 2. Pay military maintenance costs
        this.payMilitaryMaintenance();

        // 3. Recalculate population
        this.calculatePopulation();

        // Apply edict effects before stats so modifiers are current
        if (window.EdictSystem && typeof window.EdictSystem.initializeNationEdicts === 'function' && !nation.edicts) {
            window.EdictSystem.initializeNationEdicts(nation);
        }
        if (window.EdictSystem && typeof window.EdictSystem.applyEdictEffects === 'function') {
            window.EdictSystem.applyEdictEffects(nation);
        }

        // 4. Calculate all nation statistics
        this.calculateNationStats();

        // Global system: apply global-average modifiers to this nation
        if (window.GlobalSystem && typeof window.GlobalSystem.applyGlobalModifiers === 'function') {
            window.GlobalSystem.applyGlobalModifiers(nation);
        }

        // 5. Calculate and stack/collect taxes
        if (typeof this.collectTaxes === 'function') {
            this.collectTaxes();
        }
        this.calculateEconomy(false);
        if ((nation.taxRevenue || 0) > 0) {
            nation.stackedTaxes = (nation.stackedTaxes || 0) + (nation.taxRevenue || 0);
            nation.stackedTaxesTurns = (nation.stackedTaxesTurns || 0) === 0 ? 1 : nation.stackedTaxesTurns + 1;
        }

        // 6. Apply player skill bonuses to the nation
        if (window.Player) Player.applyToNation(nation);

        // 7. Update military strength
        this.updateMilitaryStrength();

        // 8. Process research
        this.processResearch();

        // 9. Check government/religion demands
        this.checkDemands();

        // 10. Update happiness
        this.updateHappiness();

        // 11. Process projects (missile production, military penalties)
        if (window.GameEngine?.systems?.projects) {
            window.GameEngine.systems.projects.processDaily(nation);
        }

        // 12. Process wonders (nuclear production, enhanced systems, cooldowns)
        if (window.GameEngine?.systems?.wonders) {
            window.GameEngine.systems.wonders.processDaily(nation);
        }

        nation.statistics.totalTurns++;

        // Track alliance and war durations for award system
        if (nation.allianceId) {
            nation.statistics.allianceDays = (nation.statistics.allianceDays || 0) + 1;
        } else {
            nation.statistics.allianceDays = 0;
        }
        const hasActiveWar = nation.wars && nation.wars.some(w => w.status === 'active' || w.status === 'declared');
        if (hasActiveWar) {
            nation.statistics.warDays = (nation.statistics.warDays || 0) + 1;
        } else {
            nation.statistics.warDays = 0;
        }
        if (!hasActiveWar) {
            nation.statistics.peacefulDays = (nation.statistics.peacefulDays || 0) + 1;
        } else {
            nation.statistics.peacefulDays = 0;
        }
        const pollution = nation.pollution || 0;
        if (pollution <= 0) {
            nation.statistics.zeroPollutionDays = (nation.statistics.zeroPollutionDays || 0) + 1;
        } else {
            nation.statistics.zeroPollutionDays = 0;
        }
        const crimeRate = nation.crimeRate || 0;
        if (crimeRate <= 0) {
            nation.statistics.zeroCrimeDays = (nation.statistics.zeroCrimeDays || 0) + 1;
        } else {
            nation.statistics.zeroCrimeDays = 0;
        }
        const diseaseRate = nation.diseaseRate || 0;
        if (diseaseRate <= 0) {
            nation.statistics.zeroDiseaseDays = (nation.statistics.zeroDiseaseDays || 0) + 1;
        } else {
            nation.statistics.zeroDiseaseDays = 0;
        }
        const happiness = nation.happiness || 0;
        if (happiness >= 100) {
            nation.statistics.perfectHappinessDays = (nation.statistics.perfectHappinessDays || 0) + 1;
        } else {
            nation.statistics.perfectHappinessDays = 0;
        }
        if (nation.uniformPopulation || nation.religionUniformity === 100) {
            nation.statistics.uniformPopulationDays = (nation.statistics.uniformPopulationDays || 0) + 1;
        } else {
            nation.statistics.uniformPopulationDays = 0;
        }
        const friendCount = nation.diplomaticRelations?.friends?.length || 0;
        nation.statistics.friendsCount = friendCount;
        const hasBestFriend = nation.diplomaticRelations?.bestFriend ? 1 : 0;
        nation.statistics.hasBestFriend = hasBestFriend;
        if (friendCount >= 5) {
            nation.statistics.fiveFriendsDays = (nation.statistics.fiveFriendsDays || 0) + 1;
        } else {
            nation.statistics.fiveFriendsDays = 0;
        }
        if (hasBestFriend) {
            nation.statistics.bestFriendDays = (nation.statistics.bestFriendDays || 0) + 1;
        } else {
            nation.statistics.bestFriendDays = 0;
        }
        if (friendCount >= 5 && hasBestFriend) {
            nation.statistics.fiveFriendsBestFriendDays = (nation.statistics.fiveFriendsBestFriendDays || 0) + 1;
        } else {
            nation.statistics.fiveFriendsBestFriendDays = 0;
        }
        const soldierCount = nation.militaryUnits?.soldiers || 0;
        if (soldierCount === 300) {
            nation.statistics.exactly300SoldiersDays = (nation.statistics.exactly300SoldiersDays || 0) + 1;
        } else {
            nation.statistics.exactly300SoldiersDays = 0;
        }

        // Check nation awards against updated statistics
        if (window.AwardSystem) {
            window.AwardSystem.checkNationAwards(nation);
        }

        EventBus.emit(GameEvents.NATION_UPDATED, { nation: nation.serialize() });
    }

    /**
     * Monthly turn handler.
     */
    handleMonthPassed(data) {
        const nation = this.nation;
        if (!nation) return;

        nation.processMonthlyEconomics();
        nation.updateDiplomaticRelations();
        nation.processMonthlyEvents();

        // Stability drifts toward 100 if economy is healthy
        if (nation.budget.balance >= 0) {
            nation.stability = Math.min(100, nation.stability + 1);
        } else {
            nation.stability = Math.max(0, nation.stability - 2);
        }
    }

    /**
     * Yearly turn handler.
     */
    handleYearPassed(data) {
        const nation = this.nation;
        if (!nation) return;

        nation.processAnnualStatistics();
        nation.checkAchievements();
    }

    // ═════════════════════════════════════════════════════════════════════════
    // CORE ECONOMIC FORMULAS AND STATISTICS
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Population = Land × Infra × Tech × ageFactor
     * ageFactor  = max(1, nationAgeDays / 30)
     * Population is 0 while Tech = 0.
     */
    calculatePopulation() {
        const nation = this.nation;
        if (!nation) return;

        const technology = nation.tech + (nation.sharedTechnology || 0);
        if (technology <= 0) {
            nation.population = 0;
            return;
        }

        const ageDays   = nation._nationAgeDays();
        const ageFactor = Math.max(1, ageDays / GameConfig.FORMULAS.AGE_FACTOR_DIVISOR);

        // Base population calculation
        let population = Math.floor(nation.land * nation.infra * technology * ageFactor);

        // Apply bonus resource multipliers
        let growthMultiplier = 1.0;

        // Automobiles bonus: +10% population growth
        if (nation.bonusEffects?.automobiles) {
            growthMultiplier += 0.10;
        }

        // Basic Needs bonus: +15% population growth
        if (nation.bonusEffects?.basicNeeds) {
            growthMultiplier += 0.15;
        }

        // Apply population efficiency from nation stats
        if (nation.nationStats?.populationEfficiency) {
            growthMultiplier *= nation.nationStats.populationEfficiency;
        }

        // Apply government/religion population growth modifier
        if (nation.populationGrowthModifier) {
            growthMultiplier *= nation.populationGrowthModifier;
        }

        // Calculate base population
        let finalPopulation = Math.floor(population * growthMultiplier);

        // Apply temporary population reductions from military recruitment
        if (nation.temporaryEffects) {
            const populationReductions = nation.temporaryEffects
                .filter(effect => effect.type === 'populationReduction')
                .reduce((total, effect) => total + effect.amount, 0);

            finalPopulation = Math.max(0, finalPopulation - populationReductions);
        }

        nation.population = finalPopulation;
    }

    /**
     * Calculate all complex nation statistics.
     */
    calculateNationStats() {
        const nation = this.nation;
        if (!nation) return;

        if (!nation.nationStats) nation.initializeNationStats();

        nation.calculateLiteracy();
        nation.calculatePollution();
        nation.calculateDisease();
        nation.calculateCrime();
        nation.calculateHappiness();
        nation.calculateEnvironment();
        nation.calculateDerivedEffects();

        // Sync literacy score for award system
        nation.statistics.literacyScore = nation.nationStats?.literacy || 0;
    }

    /**
     * Initialize nation stats if missing.
     */
    initializeNationStats() {
        const nation = this.nation;
        if (!nation) return;

        nation.nationStats = {
            happiness: GameConfig.INITIAL_HAPPINESS,
            pollution: 0,
            disease: 0,
            crime: 0,
            literacy: 0,
            environment: 50,
            happinessModifier: 1.0,
            populationEfficiency: 1.0,
            militaryMorale: 1.0,
            taxEfficiency: 1.0
        };
    }

    /**
     * Calculate literacy rate.
     */
    calculateLiteracy() {
        const nation = this.nation;
        if (!nation) return;

        // Base literacy from tech level (0–95%, max at 5000 tech)
        // Starts at 0.05% for 50 levels, accelerates at each 1000 levels
        const techLit = Math.min(5000, nation.tech + (nation.sharedTechnology || 0));
        let baseLiteracy;
        if (techLit <= 50) {
            baseLiteracy = (techLit / 50) * 0.05;
        } else if (techLit <= 1000) {
            baseLiteracy = 0.05 + ((techLit - 50) / 950) * 4.95;
        } else if (techLit <= 2000) {
            baseLiteracy = 5 + ((techLit - 1000) / 1000) * 10;
        } else if (techLit <= 3000) {
            baseLiteracy = 15 + ((techLit - 2000) / 1000) * 15;
        } else if (techLit <= 4000) {
            baseLiteracy = 30 + ((techLit - 3000) / 1000) * 20;
        } else {
            baseLiteracy = 50 + ((techLit - 4000) / 1000) * 45;
        }

        // School bonus
        let schoolBonus = 0;
        if (nation.improvementEffects?.literacyBonus) {
            schoolBonus = nation.improvementEffects.literacyBonus * 100;
        }

        // University bonus
        let universityBonus = 0;
        if (nation.projectEffects?.universityLiteracyBonus) {
            universityBonus = nation.projectEffects.universityLiteracyBonus * 100;
        }

        // Universal Education wonder bonus
        let wonderEducationBonus = 0;
        if (nation.wonderEffects?.universalEducationLiteracyBonus) {
            wonderEducationBonus = nation.wonderEffects.universalEducationLiteracyBonus * 100;
        }

        nation.nationStats.literacy = Math.min(200, baseLiteracy + schoolBonus + universityBonus + wonderEducationBonus);
    }

    /**
     * Calculate pollution.
     */
    calculatePollution() {
        const nation = this.nation;
        if (!nation) return;

        // Base pollution from infrastructure and manufacturing
        let totalPollution = 0;

        // Add pollution from mineral production improvements (steelMill, bronzeSmelter, etc.)
        // These 7 improvements ARE the "mines" — each produces raw resources
        const mineralProductionImprovements = ['steelMill', 'bronzeSmelter', 'leadRefinery', 'aluminumSmelter', 'copperRefinery', 'uraniumEnrichmentPlant', 'gasolineRefinery'];
        let mineralProductionPollution = 0;
        for (const mpi of mineralProductionImprovements) {
            mineralProductionPollution += (nation.improvements?.[mpi] || 0) * 75; // 75 pollution per mine (planned)
        }

        // Wonder effect: Clean Mine Operations removes 75% of pollution from each raw resource production mine
        if (nation.wonderEffects?.cleanMineOperations) {
            mineralProductionPollution = Math.floor(mineralProductionPollution * 0.25);
        }
        
        // Wonder effect: Supreme Mining Complex adds +50 pollution per mine
        if (nation.wonderEffects?.supremeMineEfficiency) {
            const mineCount = mineralProductionPollution / 75; // reverse-calculate mine count from pollution
            mineralProductionPollution += mineCount * 50; // +50 per mine
        }
        totalPollution += mineralProductionPollution;

        // Add pollution from transition improvements (steelFoundry, bronzeCasting, etc.)
        const transitionImprovements = ['steelFoundry', 'bronzeCasting', 'leadCasting', 'aluminumExtrusion', 'copperDrawing', 'uraniumFuelFabrication', 'gasolineBlending'];
        let transitionPollution = 0;
        for (const transImp of transitionImprovements) {
            transitionPollution += (nation.improvements?.[transImp] || 0) * 125; // 125 pollution per transition plant (planned)
        }

        // Wonder effect: Clean Assembly Operations removes 50% of pollution from each resource transition manufacturing plant
        if (nation.wonderEffects?.cleanAssemblyOperations) {
            transitionPollution = Math.floor(transitionPollution * 0.5);
        }
        
        // Wonder effect: Supreme Manufacturing Complex adds +75 pollution per transition plant
        if (nation.wonderEffects?.supremeAssemblyEfficiency) {
            const transitionCount = transitionPollution / 125; // reverse-calculate plant count from pollution
            transitionPollution += transitionCount * 75; // +75 per transition plant
        }
        totalPollution += transitionPollution;

        // Add pollution from factories
        const factoryCount = nation.improvements?.factory || 0;
        totalPollution += factoryCount * 50; // 50 pollution per factory (planned)

        // Add pollution from research labs
        const researchLabCount = nation.improvements?.researchLab || 0;
        let researchLabPollution = researchLabCount * 25; // 25 pollution per lab

        // Wonder effect: Environmental Research Complex cuts laboratory pollution by half
        if (nation.wonderEffects?.greenTechnologyInstitute) {
            researchLabPollution = Math.floor(researchLabPollution * 0.5);
        }
        totalPollution += researchLabPollution;

        // Add pollution from projects
        const missileSiloCount = nation.projects?.missileSilo || 0;
        totalPollution += missileSiloCount * 50; // 50 pollution per missile silo

        const ironCurtainCount = nation.projects?.ironCurtain || 0;
        totalPollution += ironCurtainCount * 50; // 50 pollution per iron curtain

        const nuclearShieldCount = nation.projects?.nuclearShield || 0;
        totalPollution += nuclearShieldCount * 50; // 50 pollution per nuclear shield

        const spyOperationsCount = nation.projects?.spyOperations || 0;
        totalPollution += spyOperationsCount * 50; // 50 pollution per spy operations center

        const enhancedBarracksCount = nation.projects?.enhancedBarracks || 0;
        totalPollution += enhancedBarracksCount * 75; // 75 pollution per elite military training

        const enhancedFactoriesCount = nation.projects?.enhancedFactories || 0;
        totalPollution += enhancedFactoriesCount * 150; // 150 pollution per advanced tank manufacturing

        const enhancedAirforcesCount = nation.projects?.enhancedAirforces || 0;
        totalPollution += enhancedAirforcesCount * 225; // 225 pollution per advanced aircraft systems

        const enhancedNavyCount = nation.projects?.enhancedNavy || 0;
        totalPollution += enhancedNavyCount * 300; // 300 pollution per advanced naval operations

        const sportsBettingCount = nation.projects?.sportsBetting || 0;
        totalPollution += sportsBettingCount * 200; // 200 pollution per sports betting complex

        // Add pollution from wonders
        const nuclearWarheadCount = nation.wonders?.nuclearWarheadFacility || 0;
        totalPollution += nuclearWarheadCount * 50; // 50 pollution per nuclear facility

        const enhancedNuclearCount = nation.wonders?.enhancedNuclearWarheads || 0;
        totalPollution += enhancedNuclearCount * 100; // 100 pollution per enhanced nuclear arsenal

        // Wonder pollution production from wonderEffects (set by applyWonderEffects)
        const wonderPollutionProduction = nation.wonderEffects?.pollutionProduction || 0;
        totalPollution += wonderPollutionProduction;

        // Wonder effect: Supreme Military Command Complex doubles pollution from military unit efficiency improvements when max stacked
        if (nation.wonderEffects?.supremeMilitaryBonus) {
            const militaryImprovements = ['barracks', 'factory', 'airforceBase', 'harbor'];
            let militaryProductionPollution = 0;
            for (const mi of militaryImprovements) {
                const count = nation.improvements?.[mi] || 0;
                if (count >= 5) { // max stack
                    // Double the pollution from this improvement
                    if (mi === 'barracks') militaryProductionPollution += count * 25;
                    if (mi === 'factory') militaryProductionPollution += count * 50;
                    if (mi === 'airforceBase') militaryProductionPollution += count * 75;
                    if (mi === 'harbor') militaryProductionPollution += count * 100;
                }
            }
            totalPollution += militaryProductionPollution;
        }

        // Add pollution reduction from projects
        const militarySalvageCount = nation.projects?.militarySalvage || 0;
        totalPollution -= militarySalvageCount * 50; // 50 pollution reduction per military salvage

        const foodProductionCount = nation.projects?.foodProduction || 0;
        totalPollution -= foodProductionCount * 100; // 100 pollution reduction per food production facility

        const waterProductionCount = nation.projects?.waterProduction || 0;
        totalPollution -= waterProductionCount * 100; // 100 pollution reduction per water production facility

        // === ABSOLUTE POINT REDUCTIONS ===

        // Recycling Center: -300 per center
        const recyclingCount = nation.improvements?.recyclingCenter || 0;
        totalPollution -= recyclingCount * 300;

        // Enhanced Recycling project: doubles recycling center reduction (-300 -> -600 each)
        if (nation.projectEffects?.enhancedRecycling && !nation.wonderEffects?.supremeRecycling) {
            totalPollution -= recyclingCount * 300; // additional -300 per center
        }

        // Supreme Recycling wonder: triples recycling center reduction (-300 -> -900 each)
        if (nation.wonderEffects?.supremeRecycling) {
            totalPollution -= recyclingCount * 600; // additional -600 per center (total -900)
        }

        // Park: -75 per park
        const parkCount = nation.improvements?.park || 0;
        totalPollution -= parkCount * 75;

        // Park Expansion project: doubles park reduction (-75 -> -150 each)
        if (nation.projectEffects?.parkExpansion) {
            totalPollution -= parkCount * 75; // additional -75 per park
        }

        // National Parks System wonder: doubles park reduction (-75 -> -150 each)
        if (nation.wonderEffects?.nationalParksSystem) {
            totalPollution -= parkCount * 75; // additional -75 per park
        }

        // Tree Plantation: -150 per plantation
        const treeCount = nation.improvements?.treePlantation || 0;
        totalPollution -= treeCount * 150;

        // Arboretum Initiative project: doubles tree plantation reduction (-150 -> -300 each)
        if (nation.projectEffects?.arboretumInitiative) {
            totalPollution -= treeCount * 150; // additional -150 per plantation
        }

        // Ancient Forest Preserve wonder: doubles tree plantation reduction (-150 -> -300 each)
        if (nation.wonderEffects?.ancientForestPreserve) {
            totalPollution -= treeCount * 150; // additional -150 per plantation
        }

        // Community Garden: -60 each
        const gardenCount = nation.improvements?.communityGarden || 0;
        totalPollution -= gardenCount * 60;

        // Green Space Initiative project: doubles Community Garden reduction (-60 -> -120 each)
        if (nation.projectEffects?.greenSpaceInitiative) {
            totalPollution -= gardenCount * 60; // additional -60 per garden
        }

        // Urban Arboretum: -110 each
        const arboretumCount = nation.improvements?.urbanArboretum || 0;
        totalPollution -= arboretumCount * 110;

        // Wetlands Preserve: -140 each
        const wetlandsCount = nation.improvements?.wetlandsPreserve || 0;
        totalPollution -= wetlandsCount * 140;

        // Waste Treatment Plant: -180 each
        const wasteCount = nation.improvements?.wasteTreatmentPlant || 0;
        totalPollution -= wasteCount * 180;

        // Zero Waste Initiative project: doubles Waste Treatment Plant reduction (-180 -> -360 each)
        if (nation.projectEffects?.zeroWasteInitiative) {
            totalPollution -= wasteCount * 180; // additional -180 per plant
        }

        // Emissions Scrubber Tower: -160 each
        const scrubberCount = nation.improvements?.emissionsScrubberTower || 0;
        totalPollution -= scrubberCount * 160;

        // Bioremediation Center: -130 each
        const bioCount = nation.improvements?.bioremediationCenter || 0;
        totalPollution -= bioCount * 130;

        // Carbon Capture Program project: -100 per transition plant
        if (nation.projectEffects?.carbonCaptureProgram) {
            totalPollution -= transitionPollution * 0.10; // approx -100 per transition plant at scale
        }

        // Public Transit Expansion project: -50 per Harbor / Airforce Base
        if (nation.projectEffects?.publicTransitExpansion) {
            const harborCount = nation.improvements?.harbor || 0;
            const airforceCount = nation.improvements?.airforceBase || 0;
            totalPollution -= (harborCount + airforceCount) * 50;
        }

        // Urban Forestry Program project: -200 flat
        if (nation.projectEffects?.urbanForestryProgram) {
            totalPollution -= 200;
        }

        // EPA Agency project: -250 flat + blocks bad-edict pollution increases
        if (nation.projectEffects?.epaAgency) {
            totalPollution -= 250;
        }

        // Carbon Sequestration Facility wonder: -600 flat
        if (nation.wonderEffects?.carbonSequestrationFacility) {
            totalPollution -= 600;
        }

        // Atmospheric Filtration Dome wonder: -700 flat
        if (nation.wonderEffects?.atmosphericFiltrationDome) {
            totalPollution -= 700;
        }

        // National Arboretum wonder: -400 flat + environment bonus
        if (nation.wonderEffects?.nationalArboretum) {
            totalPollution -= 400;
        }

        // Great Wetlands Restoration wonder: -500 flat
        if (nation.wonderEffects?.greatWetlandsRestoration) {
            totalPollution -= 500;
        }

        // Zero Emission Zone wonder: -300 flat + removes Harbor/Airforce Base pollution
        if (nation.wonderEffects?.zeroEmissionZone) {
            totalPollution -= 300;
            const harborCount = nation.improvements?.harbor || 0;
            const airforceCount = nation.improvements?.airforceBase || 0;
            totalPollution -= (harborCount * 50 + airforceCount * 75); // removes their pollution
        }

        // Apply percentage-based percentage modifiers from edicts and wonders
        let pollutionMultiplier = 1.0;

        // Clean Air Regulations project: -15% pollution
        if (nation.projectEffects?.cleanAirRegulations) {
            pollutionMultiplier -= 0.15;
        }

        // Global Climate Accord wonder: -10% pollution from all sources
        if (nation.wonderEffects?.globalClimateAccord) {
            pollutionMultiplier -= 0.10;
        }

        // Edict pollution modifiers (all increase pollution)
        pollutionMultiplier += (nation.edictEffects?.pollutionModifier || 0);

        totalPollution = Math.max(-500, Math.min(500, Math.floor(totalPollution * Math.max(0, pollutionMultiplier))));

        nation.nationStats.pollution = totalPollution;
    }

    /**
     * Calculate disease rate.
     */
    calculateDisease() {
        const nation = this.nation;
        if (!nation) return;

        let baseDisease = 0;
        let edictDiseaseMod = nation.edictEffects?.diseaseModifier || 0;

        // Pollution increases disease
        let pollutionEffect = nation.nationStats.pollution * 0.1;

        // Hospital reduction
        let hospitalReduction = 0;
        if (nation.improvementEffects?.diseaseReduction) {
            hospitalReduction = nation.improvementEffects.diseaseReduction * 100;
        }

        // Ambulance Hub reduction
        let ambulanceReduction = 0;
        if (nation.projectEffects?.ambulanceDiseaseReduction) {
            ambulanceReduction = nation.projectEffects.ambulanceDiseaseReduction * 100;
        }

        // Universal Healthcare wonder reduction
        let wonderHealthcareReduction = 0;
        if (nation.wonderEffects?.universalHealthcareDiseaseReduction) {
            wonderHealthcareReduction = nation.wonderEffects.universalHealthcareDiseaseReduction * 100;
        }

        // Environment quality affects disease
        let environmentEffect = (50 - nation.nationStats.environment) * 0.2;

        nation.nationStats.disease = Math.max(-100, Math.min(100,
            baseDisease + pollutionEffect - hospitalReduction - ambulanceReduction - wonderHealthcareReduction + environmentEffect + edictDiseaseMod
        ));
    }

    /**
     * Calculate crime rate.
     */
    calculateCrime() {
        const nation = this.nation;
        if (!nation) return;

        let baseCrime = 0;
        let edictCrimeMod = nation.edictEffects?.crimeModifier || 0;

        // Police station reduction
        let policeReduction = 0;
        if (nation.improvementEffects?.crimeReduction) {
            policeReduction = nation.improvementEffects.crimeReduction * 100;
        }

        // SWAT police reduction
        let swatReduction = 0;
        if (nation.projectEffects?.swatCrimeReduction) {
            swatReduction = nation.projectEffects.swatCrimeReduction * 100;
        }

        // Casino increase
        let casinoIncrease = 0;
        if (nation.improvementEffects?.crimeIncrease) {
            casinoIncrease = nation.improvementEffects.crimeIncrease * 100;
        }

        // Sports betting increase
        let sportsBettingIncrease = 0;
        if (nation.projectEffects?.sportsBettingCrimeIncrease) {
            sportsBettingIncrease = nation.projectEffects.sportsBettingCrimeIncrease * 100;
        }

        // Literacy reduces crime
        let literacyEffect = -(nation.nationStats.literacy * 0.2);

        // Happiness reduces crime
        let happinessEffect = -(nation.nationStats.happiness - 50) * 0.1;

        nation.nationStats.crime = Math.max(-100, Math.min(100,
            baseCrime - policeReduction - swatReduction + casinoIncrease + sportsBettingIncrease + literacyEffect + happinessEffect + edictCrimeMod
        ));
    }

    /**
     * Calculate happiness (0–100).
     */
    calculateHappiness() {
        const nation = this.nation;
        if (!nation) return;

        let happiness = GameConfig.INITIAL_HAPPINESS;
        happiness += nation.edictEffects?.happinessModifier || 0;

        // Negative factors from other stats
        happiness -= nation.nationStats.pollution * 0.1;
        happiness -= nation.nationStats.disease   * 0.20;
        happiness -= nation.nationStats.crime     * 0.10;
        happiness += nation.nationStats.literacy  * 0.10;

        // Improvement effects
        if (nation.improvementEffects?.happinessBonus) {
            happiness += nation.improvementEffects.happinessBonus * 100;
        }

        // Tree plantation happiness bonus
        if (nation.improvementEffects?.treeHappinessBonus) {
            happiness += nation.improvementEffects.treeHappinessBonus * 2;
        }

        // Project effects
        if (nation.projectEffects?.happinessBonus) {
            happiness += nation.projectEffects.happinessBonus * 100;
        }

        // Wonder effects
        if (nation.wonderEffects?.happinessBonus) {
            happiness += nation.wonderEffects.happinessBonus * 100;
        }

        // Government type happiness bonus
        happiness *= nation.governmentHappinessBonus;

        // Religion happiness bonus
        happiness *= nation.religionHappinessBonus;

        nation.nationStats.happiness = Math.max(0, Math.min(100, Math.round(happiness)));
    }

    /**
     * Calculate environment score (0–100).
     */
    calculateEnvironment() {
        const nation = this.nation;
        if (!nation) return;

        let environment = 50 - nation.nationStats.pollution * 0.1;
        environment += nation.edictEffects?.environmentModifier || 0;

        // Wonder effects
        if (nation.wonderEffects?.environmentBonus) {
            environment += nation.wonderEffects.environmentBonus * 100;
        }

        // Tree plantation environment bonus
        if (nation.improvementEffects?.treeEnvironmentBonus) {
            environment += nation.improvementEffects.treeEnvironmentBonus * 5;
        }

        nation.nationStats.environment = Math.max(0, Math.min(100, Math.round(environment)));
    }

    /**
     * Calculate derived multipliers that depend on the primary stats.
     */
    calculateDerivedEffects() {
        const nation = this.nation;
        if (!nation) return;

        const h = nation.nationStats.happiness;
        const e = nation.nationStats.environment;
        const c = nation.nationStats.crime;

        // Population efficiency
        nation.nationStats.populationEfficiency = Math.max(0.5, Math.min(1.5, 1.0 + (h - 50) * 0.01));

        // Military morale
        nation.nationStats.militaryMorale = Math.max(0.5, Math.min(1.5,
            (nation.militaryMorale || 1.0) * (1.0 + (h - 50) * 0.005)
        ));

        // Tax efficiency
        nation.nationStats.taxEfficiency = Math.max(0.5, Math.min(1.5,
            1.0 + (h - 50) * 0.005 - c * 0.005
        ));

        // Overall happiness modifier
        nation.nationStats.happinessModifier = Math.max(0.5, Math.min(2.0, h / 50));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ECONOMY
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * taxableIncome = (Infra / 50) × population × Tech × literacy modifier
     * taxRevenue    = taxableIncome × (taxRate / 100) × tax efficiency
     */
    calculateEconomy(collectTaxes = false) {
        const nation = this.nation;
        if (!nation) return;

        // Effective tax rate: base from GameConfig + player skill
        let effectiveTaxRate = GameConfig.BASE_TAX_RATE;
        if (window.Player) {
            effectiveTaxRate += Player.getSkillValue('taxation') * 100;
        }
        nation.taxRate = effectiveTaxRate;

        // Edict tax rate modifier
        nation.taxRate = nation.taxRate * (1 + (nation.edictEffects?.taxRateModifier || 0));

        // Taxable income with literacy modifier
        let literacyModifier = 1.0 + (nation.nationStats.literacy / 100) * 0.5;

        nation.taxableIncome = Math.floor((nation.infra / GameConfig.FORMULAS.TAXABLE_INFRA_DIVISOR)
                             * nation.population
                             * (nation.tech + (nation.sharedTechnology || 0))
                             * literacyModifier);

        // Revenue this turn with tax efficiency
        let totalTaxRevenue = 0;

        // Collect taxes from each taxable citizen
        if (window.PopulationSystem && collectTaxes) {
            const taxableGroups = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];
            for (const citizen of window.PopulationSystem.citizens.values()) {
                if (taxableGroups.includes(citizen.ageGroup) && citizen.isAlive && citizen.income > 0) {
                    totalTaxRevenue += citizen.payTaxesToNation(nation.taxRate);
                }
            }
        }

        nation.taxRevenue = Math.floor(nation.taxableIncome * (nation.taxRate / 100) * nation.nationStats.taxEfficiency);

        if (collectTaxes) {
            // Use per-citizen tax total if available, fall back to formula
            nation.taxRevenue = totalTaxRevenue > 0 ? totalTaxRevenue : nation.taxRevenue;
            nation.money += nation.taxRevenue;
            nation.totalTaxEarned = (nation.totalTaxEarned || 0) + nation.taxRevenue;
        }

        // GDP approximation for display
        nation.gdp = nation.taxableIncome;

        // Budget summary
        nation.budget.income  = nation.taxRevenue;
        nation.budget.expenses = nation.militaryBudget;
        nation.budget.balance  = nation.budget.income - nation.budget.expenses;

        EventBus.emit(GameEvents.RESOURCES_CHANGED, {
            money:         nation.money,
            taxRevenue:    nation.taxRevenue,
            taxableIncome: nation.taxableIncome,
            taxRate:       nation.taxRate
        });
    }

    /**
     * Collect stacked taxes with interest via World Bank.
     */
    collectTaxes() {
        const nation = this.nation;
        if (!nation || !window.WorldBankSystem) return;

        if ((nation.stackedTaxes || 0) <= 0 && (nation.stackedTaxesTurns || 0) === 0) {
            nation.stackedTaxes = 0;
            nation.stackedTaxesTurns = 0;
            return;
        }
        const rate = window.WorldBankSystem.calculateTaxInterestRate ? window.WorldBankSystem.calculateTaxInterestRate(nation) : 0;
        nation.lastTaxInterestRate = rate;
        if ((nation.stackedTaxesTurns || 0) < 12) {
            nation.stackedTaxesTurns = (nation.stackedTaxesTurns || 0) + 1;
            return;
        }
        const interest = window.WorldBankSystem.calculateTaxInterest ? window.WorldBankSystem.calculateTaxInterest(nation.stackedTaxes || 0, nation.stackedTaxesTurns || 0, rate) : 0;
        if (interest > 0) {
            nation.stackedTaxes = (nation.stackedTaxes || 0) + interest;
            if (window.WorldLottery && typeof window.WorldLottery.contributeFromBank === 'function') {
                window.WorldLottery.contributeFromBank(interest, 'tax_interest');
            }
        }
        nation.stackedTaxesTurns = (nation.stackedTaxesTurns || 0) + 1;
    }

    /**
     * Pay stacked bills with interest via World Bank.
     */
    payBills() {
        const nation = this.nation;
        if (!nation || !window.WorldBankSystem) return;

        if ((nation.stackedBills || 0) <= 0 && (nation.stackedBillsTurns || 0) === 0) {
            nation.stackedBills = 0;
            nation.stackedBillsTurns = 0;
            return;
        }
        const rate = window.WorldBankSystem.calculateBillInterestRate ? window.WorldBankSystem.calculateBillInterestRate(nation) : 0;
        nation.lastBillInterestRate = rate;
        if ((nation.stackedBillsTurns || 0) < 24) {
            nation.stackedBillsTurns = (nation.stackedBillsTurns || 0) + 1;
            return;
        }
        const interest = window.WorldBankSystem.calculateBillInterest ? window.WorldBankSystem.calculateBillInterest(nation.stackedBills || 0, nation.stackedBillsTurns || 0, rate) : 0;
        if (interest > 0) {
            nation.stackedBills = (nation.stackedBills || 0) + interest;
            if (window.WorldLottery && typeof window.WorldLottery.contributeFromBank === 'function') {
                window.WorldLottery.contributeFromBank(interest, 'bill_interest');
            }
        }
        nation.stackedBillsTurns = (nation.stackedBillsTurns || 0) + 1;
    }

    /**
     * Calculate total bills due this turn.
     */
    calculateTotalBillsThisTurn() {
        const nation = this.nation;
        if (!nation) return 0;

        let total = 0;
        if ((nation.stackedBills || 0) > 0) {
            total += nation.stackedBills;
        }
        if (nation.buildingUpkeep) {
            const upkeepMod = nation.edictEffects?.improvementUpkeepModifier || 0;
            total += Math.floor(((nation.buildingUpkeep.improvements || 0) + (nation.buildingUpkeep.projects || 0) + (nation.buildingUpkeep.wonders || 0)) * (1 + upkeepMod));
        }
        if (nation.militaryBudget) {
            total += nation.militaryBudget;
        }
        return Math.floor(total);
    }

    /**
     * Get stacked finances info.
     */
    getStackedFinancesInfo() {
        const nation = this.nation;
        if (!nation) return {};

        return {
            stackedTaxes: nation.stackedTaxes || 0,
            stackedTaxesTurns: nation.stackedTaxesTurns || 0,
            lastTaxInterestRate: nation.lastTaxInterestRate || 0,
            stackedBills: nation.stackedBills || 0,
            stackedBillsTurns: nation.stackedBillsTurns || 0,
            lastBillInterestRate: nation.lastBillInterestRate || 0
        };
    }

    /**
     * Calculate resource generation rates — updates display object.
     */
    calculateResourceGeneration() {
        const nation = this.nation;
        if (!nation) return;

        nation.resourceGeneration.money = nation.taxRevenue || 0;
        nation.resourceGeneration.food = nation.territories.length * 100;

        const govBonus = nation.governmentType?.economyBonus || 1.0;
        Object.keys(nation.resourceGeneration).forEach(resource => {
            nation.resourceGeneration[resource] = Math.floor(
                nation.resourceGeneration[resource] * govBonus
            );
        });
    }

    /**
     * Update economic indicators — delegates to calculateEconomy().
     */
    updateEconomy() {
        this.calculateEconomy();
    }

    /**
     * Update nation happiness.
     */
    updateHappiness() {
        const nation = this.nation;
        if (!nation) return;

        nation.calculateHappiness();

        EventBus.emit(GameEvents.HAPPINESS_CHANGED, {
            oldHappiness: nation.happiness,
            newHappiness: nation.nationStats.happiness,
            change: nation.nationStats.happiness - nation.happiness
        });

        nation.happiness = nation.nationStats.happiness;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // LAND / INFRA / TECH PURCHASES
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Cost to buy the NEXT mile of land.
     * Pure level-based formula (no population):
     *   base 500 per level, tier multipliers every 100 (slight) / 500 (decent) / 1000 (massive) levels,
     *   scaled by world-average land ratio (above avg = massively more, below avg = decently less),
     *   plus a currency-specific tax routed to the World Lottery pool.
     * @returns {number} total cost (base + tax) for the next mile
     */
    landCost() {
        const nation = this.nation;
        if (!nation) return 0;
        return this._computeLandCost(nation).totalCost;
    }

    /**
     * Get a full cost breakdown for the next land mile.
     * @returns {object} { baseCost, taxAmount, totalCost, breakdown }
     */
    _computeLandCost(nation) {
        if (!nation) return { baseCost: 0, taxAmount: 0, totalCost: 0, breakdown: {} };
        const tierMult = this.tierMultiplier(nation.land);
        const baseCost = Math.ceil(500 * tierMult);
        const avgMult = this.worldAverageMultiplier(nation.land, 'land');
        const scaledBase = Math.ceil(baseCost * avgMult);
        const taxRate = this.getCurrencyTaxRate(nation);
        const taxAmount = Math.floor(scaledBase * taxRate);
        const totalCost = scaledBase + taxAmount;
        return {
            baseCost: scaledBase,
            taxAmount,
            totalCost,
            breakdown: { tierMult, avgMult, taxRate, nextLevel: nation.land + 1, worldAvgLand: this.getWorldAverage('land') }
        };
    }

    /**
     * Cost multiplier by level tiers:
     *   every 100 levels  -> slight   (1.05x per 100)
     *   every 500 levels  -> decent   (1.25x per 500)
     *   every 1000 levels -> massive  (3.00x per 1000)
     * @param {number} level - current level being bought into
     * @returns {number}
     */
    tierMultiplier(level) {
        let mult = 1.0;
        mult *= Math.pow(1.05, Math.floor(level / 100));
        mult *= Math.pow(1.25, Math.floor(level / 500));
        mult *= Math.pow(3.0, Math.floor(level / 1000));
        return mult;
    }

    /**
     * World-average scaling multiplier.
     *   nation at/above world average -> cost scales massively more (2.5x per 1.0 ratio above)
     *   nation below world average    -> cost is decently less (0.5x to 1.0x)
     * @param {number} nationLevel
     * @param {string} type - 'land' | 'infra'
     * @returns {number}
     */
    worldAverageMultiplier(nationLevel, type) {
        const worldAvg = this.getWorldAverage(type);
        if (!worldAvg || worldAvg <= 0) return 1.0;
        const ratio = nationLevel / worldAvg;
        if (ratio >= 1) {
            return Math.pow(2.5, ratio - 1); // above average: massive scaling
        }
        return Math.max(0.5, 0.5 + ratio * 0.5); // below average: decently less
    }

    /**
     * Get world average value for a type via WorldBankSystem.
     * @param {string} type - 'land' | 'infra'
     * @returns {number}
     */
    getWorldAverage(type) {
        const wb = window.WorldBankSystem;
        if (!wb) return 0;
        if (type === 'land' && typeof wb.getWorldAverageLand === 'function') return wb.getWorldAverageLand();
        if (type === 'infra' && typeof wb.getWorldAverageInfra === 'function') return wb.getWorldAverageInfra();
        return 0;
    }

    /**
     * Get the currency-specific purchase tax rate for a nation.
     * @param {object} nation
     * @returns {number} decimal rate
     */
    getCurrencyTaxRate(nation) {
        const wb = window.WorldBankSystem;
        if (wb && typeof wb.getCurrencyTaxRateForNation === 'function') {
            return wb.getCurrencyTaxRateForNation(nation);
        }
        return 0.05;
    }

    /**
     * Deduct a purchase cost from the nation's spendable balance.
     * Prefers the primary currency balance when present, falls back to money.
     * @param {object} nation
     * @param {number} cost
     * @returns {boolean}
     */
    deductPurchaseCost(nation, cost) {
        if (!nation) return false;
        const currency = nation.currency || 'aurel';
        const have = nation.currencyBalances && nation.currencyBalances[currency] !== undefined
            ? nation.currencyBalances[currency]
            : (nation.money || 0);
        if (have < cost) return false;
        if (nation.currencyBalances && nation.currencyBalances[currency] !== undefined) {
            nation.currencyBalances[currency] -= cost;
            // Keep the legacy money field in sync for systems that read it
            nation.money = Math.max(0, (nation.money || 0) - cost);
        } else {
            nation.money -= cost;
        }
        return true;
    }

    /**
     * Buy one block of land (100 miles).
     */
    buyLand() {
        const nation = this.nation;
        if (!nation) return false;

        const freeLimit = GameConfig.FREE_STARTING_BLOCKS * GameConfig.MILES_PER_BLOCK;
        if (nation.land < freeLimit) {
            nation.land += 1;
            nation.mapBlocks = Math.floor(nation.land / GameConfig.MILES_PER_BLOCK);
            if (window.WorldBankSystem && typeof window.WorldBankSystem.recordTerritoryPurchase === 'function') {
                window.WorldBankSystem.recordTerritoryPurchase(nation, window.TimeSystem ? window.TimeSystem.currentDay : (nation.totalTurns || 0), 0);
            }
            nation.calculatePopulation();
            nation.calculateEconomy();
            return true;
        }

        const breakdown = this._computeLandCost(nation);
        const cost = breakdown.totalCost;
        if (!this.deductPurchaseCost(nation, cost)) {
            console.warn(`Cannot buy land — need $${cost}`);
            return false;
        }

        nation.land += 1;
        nation.mapBlocks = Math.floor(nation.land / GameConfig.MILES_PER_BLOCK);
        if (nation.land % GameConfig.MILES_PER_BLOCK === 0) {
            nation.statistics.landPurchased++;
        }

        this.calculatePopulation();
        this.calculateEconomy();

        // Route the currency tax portion to the World Lottery pool
        if (breakdown.taxAmount > 0 && window.WorldLottery && typeof window.WorldLottery.contributeFromBank === 'function') {
            window.WorldLottery.contributeFromBank(breakdown.taxAmount, 'land_tax');
        }

        if (window.WorldBankSystem && typeof window.WorldBankSystem.recordTerritoryPurchase === 'function') {
            const taxInfo = window.WorldBankSystem.calculateTerritoryPurchaseCost(nation);
            const taxAmount = taxInfo ? taxInfo.taxAmount : 0;
            window.WorldBankSystem.recordTerritoryPurchase(nation, window.TimeSystem ? window.TimeSystem.currentDay : (nation.totalTurns || 0), taxAmount);
        }

        // Award XP for buying land
        if (window.XPGoalsSystem) {
            window.XPGoalsSystem.awardBuyLand(1, { land: nation.land });
        }

        EventBus.emit('land_purchased', { mapBlocks: nation.mapBlocks, land: nation.land, cost, tax: breakdown.taxAmount });
        return true;
    }

    /**
     * Cost to buy the NEXT point of infrastructure.
     * Pure level-based formula (no population): base 500 per level with tier
     * multipliers, world-average scaling, and a currency-specific tax routed
     * to the World Lottery pool.
     * @returns {number} total cost (base + tax) for the next infra level
     */
    infraCost() {
        const nation = this.nation;
        if (!nation) return 0;
        return this._computeInfraCost(nation).totalCost;
    }

    /**
     * Get a full cost breakdown for the next infra level.
     * @returns {object} { baseCost, taxAmount, totalCost, breakdown }
     */
    _computeInfraCost(nation) {
        if (!nation) return { baseCost: 0, taxAmount: 0, totalCost: 0, breakdown: {} };
        const tierMult = this.tierMultiplier(nation.infra);
        const baseCost = Math.ceil(500 * tierMult);
        const avgMult = this.worldAverageMultiplier(nation.infra, 'infra');
        const scaledBase = Math.ceil(baseCost * avgMult);
        const taxRate = this.getCurrencyTaxRate(nation);
        const taxAmount = Math.floor(scaledBase * taxRate);
        const totalCost = scaledBase + taxAmount;
        return {
            baseCost: scaledBase,
            taxAmount,
            totalCost,
            breakdown: { tierMult, avgMult, taxRate, nextLevel: nation.infra + 1, worldAvgInfra: this.getWorldAverage('infra') }
        };
    }

    /**
     * Buy one unit of infrastructure.
     */
    buyInfra(amount = 1) {
        const nation = this.nation;
        if (!nation) return false;

        for (let i = 0; i < amount; i++) {
            const breakdown = this._computeInfraCost(nation);
            const cost = breakdown.totalCost;
            if (!this.deductPurchaseCost(nation, cost)) {
                console.warn(`Cannot buy infra at level ${nation.infra + 1} — need $${cost}`);
                return false;
            }
        nation.infra += 1;
        nation.statistics.infraPurchased++;

        // Route the currency tax portion to the World Lottery pool
        if (breakdown.taxAmount > 0 && window.WorldLottery && typeof window.WorldLottery.contributeFromBank === 'function') {
            window.WorldLottery.contributeFromBank(breakdown.taxAmount, 'infra_tax');
        }

        this.calculatePopulation();
        this.calculateEconomy();

        EventBus.emit('infra_purchased', { infra: nation.infra });
        }

        return true;
    }

    /**
     * Cost to buy the NEXT tech level.
     */
    techCost() {
        const nation = this.nation;
        if (!nation) return 0;

        const nextLevel = nation.tech + 1;
        const tierMult = Math.pow(Math.floor(nation.tech / 1000) + 1, 2);
        let baseCost = Math.ceil(nextLevel
            * (nation.land  / GameConfig.FORMULAS.TECH_COST_LAND_DIVISOR)
            * (nation.infra / GameConfig.FORMULAS.TECH_COST_INFRA_DIVISOR)
            * (Math.max(1, nation.population) / GameConfig.FORMULAS.TECH_COST_POP_DIVISOR)
            * tierMult);

        if (nation.projectEffects?.techCostReduction) {
            baseCost = Math.floor(baseCost * (1.0 - nation.projectEffects.techCostReduction));
        }

        if (nation.wonderEffects?.universalEducationTechCostReduction) {
            baseCost = Math.floor(baseCost * (1.0 - nation.wonderEffects.universalEducationTechCostReduction));
        }

        return baseCost;
    }

    /**
     * Buy one tech level.
     */
    buyTech() {
        const nation = this.nation;
        if (!nation) return false;

        const cost = nation.techCost();
        if (nation.money < cost) {
            console.warn(`Cannot buy tech — need $${cost}, have $${nation.money}`);
            return false;
        }

        nation.money -= cost;
        nation.tech  += 1;
        nation.statistics.techPurchased++;

        this.calculatePopulation();
        this.calculateEconomy();

        EventBus.emit('tech_purchased', { tech: nation.tech, cost });

        // Award XP for buying tech
        if (window.XPGoalsSystem) {
            window.XPGoalsSystem.awardBuyTech(1, { tech: nation.tech });
        }
        return true;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // NATION AGE
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Nation age in game days.
     */
    _nationAgeDays() {
        const nation = this.nation;
        if (!nation) return 0;

        if (window.GameTime) {
            return GameTime.nationAgeDays(nation.foundedDay);
        }
        return Math.floor((Date.now() - (nation.founded || Date.now())) / 3_600_000);
    }

    /**
     * Formatted age string.
     */
    getNationAge() {
        const nation = this.nation;
        if (!nation) return '0d';

        const days = nation._nationAgeDays();
        const years  = Math.floor(days / 360);
        const months = Math.floor((days % 360) / 30);
        const rem    = days % 30;
        if (years > 0)  return `${years}y ${months}m ${rem}d`;
        if (months > 0) return `${months}m ${rem}d`;
        return `${rem}d`;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // GOVERNMENT / RELIGION
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Apply government type bonuses and penalties.
     */
    applyGovernmentBonuses() {
        const nation = this.nation;
        if (!nation) return;

        if (window.GovernmentSystem) {
            const gov = window.GovernmentSystem.getGovernment(nation.government);
            if (gov) {
                nation.governmentType = gov;

                if (gov.bonuses.happiness) {
                    nation.governmentHappinessBonus = gov.bonuses.happiness;
                }
                if (gov.bonuses.gdp || gov.bonuses.economyBonus) {
                    if (nation.gdp > 0) {
                        nation.gdp = Math.floor(nation.gdp * (gov.bonuses.gdp || 1.1));
                    }
                }
                if (gov.bonuses.militaryStrength || gov.bonuses.militaryBonus) {
                    nation.militaryStrength = Math.floor(nation.militaryStrength * (gov.bonuses.militaryStrength || 1.1));
                }
                if (gov.bonuses.stability) {
                    nation.stability = Math.floor(nation.stability * gov.bonuses.stability);
                }
                if (gov.bonuses.populationGrowth) {
                    nation.populationGrowthModifier = gov.bonuses.populationGrowth;
                }
                if (gov.bonuses.technology) {
                    nation.technologyBonus = gov.bonuses.technology;
                }

                if (gov.policies) {
                    nation.policies = { ...gov.policies };
                }

                if (gov.taxRate) {
                    nation.taxRate = gov.taxRate;
                }

                if (gov.penalties) {
                    if (gov.penalties.happiness) {
                        nation.happiness = Math.floor(nation.happiness * gov.penalties.happiness);
                    }
                    if (gov.penalties.militaryStrength) {
                        nation.militaryStrength = Math.floor(nation.militaryStrength * gov.penalties.militaryStrength);
                    }
                    if (gov.penalties.stability) {
                        nation.stability = Math.floor(nation.stability * gov.penalties.stability);
                    }
                }

                return;
            }
        }

        // Fallback to GameConfig
        const govType = GameConfig.GOVERNMENT_TYPES[nation.government.toUpperCase()] ||
                       GameConfig.GOVERNMENT_TYPES.DEMOCRACY;

        nation.governmentType = govType;
        nation.gdp = Math.floor(nation.gdp * govType.economyBonus);
        nation.militaryStrength = Math.floor(nation.militaryStrength * govType.militaryBonus);
        nation.happiness = Math.floor(nation.happiness * govType.happinessBonus);
    }

    /**
     * Apply religion bonuses.
     */
    applyReligionBonuses() {
        const nation = this.nation;
        if (!nation || !window.ReligionSystem) return;

        const religion = window.ReligionSystem.getReligion(nation.religion);
        if (!religion) return;

        if (religion.bonuses.happiness) {
            nation.religionHappinessBonus = religion.bonuses.happiness;
        }

        if (religion.bonuses.populationGrowth) {
            nation.populationGrowthModifier = (nation.populationGrowthModifier || 1) * (1 + religion.bonuses.populationGrowth);
        }

        if (religion.bonuses.stability) {
            nation.stability = Math.floor(nation.stability * religion.bonuses.stability);
        }

        if (religion.bonuses.militaryMorale) {
            nation.militaryMorale = (nation.militaryMorale || 1) * religion.bonuses.militaryMorale;
        }

        if (religion.bonuses.technology) {
            nation.technologyBonus = (nation.technologyBonus || 1) * religion.bonuses.technology;
        }

        if (religion.penalties && religion.penalties.happiness) {
            nation.happiness = Math.floor(nation.happiness * religion.penalties.happiness);
        }
    }

    /**
     * Start demand timers for government/religion changes.
     */
    startDemandTimers() {
        const nation = this.nation;
        if (!nation) return;

        const minDays = 7;
        const maxDays = 30;

        nation.demandTimer = {
            governmentDaysRemaining: Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays,
            religionDaysRemaining: Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays,
            isDemandingGovernment: false,
            isDemandingReligion: false,
            currentGovernmentHint: null,
            currentReligionHint: null
        };

        console.log(`Demand timers started - Government: ${nation.demandTimer.governmentDaysRemaining} days, Religion: ${nation.demandTimer.religionDaysRemaining} days`);
    }

    /**
     * Get random hint for current government.
     */
    getGovernmentHint() {
        const nation = this.nation;
        if (!nation || !window.GovernmentSystem) return null;

        const hints = window.GovernmentSystem.getGovernmentHints(nation.government, 5);
        return hints[Math.floor(Math.random() * hints.length)];
    }

    /**
     * Get random hint for current religion.
     */
    getReligionHint() {
        const nation = this.nation;
        if (!nation || !window.ReligionSystem) return null;

        const hints = window.ReligionSystem.getReligionHints(nation.religion, 5);
        return hints[Math.floor(Math.random() * hints.length)];
    }

    /**
     * Change government.
     */
    changeGovernment(newGovernmentId) {
        const nation = this.nation;
        if (!nation) return;

        const oldGovernment = nation.government;
        nation.government = newGovernmentId;
        nation.statistics.governmentChanges = (nation.statistics.governmentChanges || 0) + 1;

        nation.applyGovernmentBonuses();

        nation.demandTimer.governmentDaysRemaining = 30;
        nation.demandTimer.isDemandingGovernment = false;
        nation.demandTimer.currentGovernmentHint = null;

        EventBus.emit(GameEvents.GOVERNMENT_CHANGED, {
            oldGovernment: oldGovernment,
            newGovernment: newGovernmentId,
            nation: nation.serialize()
        });

        console.log(`Government changed from ${oldGovernment} to ${newGovernmentId}`);
    }

    /**
     * Change religion.
     */
    changeReligion(newReligionId) {
        const nation = this.nation;
        if (!nation) return;

        const oldReligion = nation.religion;
        nation.religion = newReligionId;
        nation.statistics.religionChanges = (nation.statistics.religionChanges || 0) + 1;

        nation.applyReligionBonuses();

        nation.demandTimer.religionDaysRemaining = 30;
        nation.demandTimer.isDemandingReligion = false;
        nation.demandTimer.currentReligionHint = null;

        EventBus.emit(GameEvents.RELIGION_CHANGED, {
            oldReligion: oldReligion,
            newReligion: newReligionId,
            nation: nation.serialize()
        });

        console.log(`Religion changed from ${oldReligion} to ${newReligionId}`);
    }

    /**
     * Check and process government/religion demands.
     */
    checkDemands() {
        const nation = this.nation;
        if (!nation) return;

        const govApprovalLocked = nation.projectEffects?.governmentApprovalLocked || false;
        const relApprovalLocked = nation.projectEffects?.religionApprovalLocked || false;

        // Government demand check — suppressed when Government Statue approval is locked
        if (!govApprovalLocked && nation.demandTimer.governmentDaysRemaining > 0) {
            nation.demandTimer.governmentDaysRemaining--;

            if (nation.demandTimer.governmentDaysRemaining <= 0 && !nation.demandTimer.isDemandingGovernment) {
                nation.demandTimer.isDemandingGovernment = true;
                nation.demandTimer.currentGovernmentHint = nation.getGovernmentHint();

                if (window.GlobalWorld && window.GlobalWorld.suggestedGovernment) {
                    nation.demandTimer.currentGovernmentHint = window.GlobalWorld.suggestedGovernment;
                }

                EventBus.emit(GameEvents.GOVERNMENT_DEMAND, {
                    hint: nation.demandTimer.currentGovernmentHint,
                    daysRemaining: 7
                });
            }
        }

        // Religion demand check — suppressed when Religious Statue approval is locked
        if (!relApprovalLocked && nation.demandTimer.religionDaysRemaining > 0) {
            nation.demandTimer.religionDaysRemaining--;

            if (nation.demandTimer.religionDaysRemaining <= 0 && !nation.demandTimer.isDemandingReligion) {
                nation.demandTimer.isDemandingReligion = true;
                nation.demandTimer.currentReligionHint = nation.getReligionHint();

                if (window.GlobalWorld && window.GlobalWorld.suggestedReligion) {
                    nation.demandTimer.currentReligionHint = window.GlobalWorld.suggestedReligion;
                }

                EventBus.emit(GameEvents.RELIGION_DEMAND, {
                    hint: nation.demandTimer.currentReligionHint,
                    daysRemaining: 7
                });
            }
        }

        // Process demand timeouts (7 days to respond)
        if (nation.demandTimer.isDemandingGovernment) {
            // Could implement automatic change if player doesn't respond
        }

        if (nation.demandTimer.isDemandingReligion) {
            // Could implement automatic change if player doesn't respond
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // RESEARCH
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Process research and technology advancement with player skill bonuses.
     */
    processResearch() {
        const nation = this.nation;
        if (!nation || !nation.currentResearch) return;

        // Generate research points
        let researchGeneration = Math.floor(nation.population * 0.001 + nation.tech * 0.1);

        // Apply player intelligence skill bonus to research
        if (window.Player) {
            const intelligenceBonus = Player.getSkillValue('intelligence');
            researchGeneration = Math.floor(researchGeneration * (1 + intelligenceBonus * 0.01));
        }

        nation.researchPoints += researchGeneration;

        // Apply to current research
        if (nation.currentResearch) {
            nation.researchProgress += researchGeneration;

            // Check if research is complete
            const requiredPoints = nation.currentResearch.cost || 1000;
            if (nation.researchProgress >= requiredPoints) {
                nation.completeResearch();

                // Award research experience to player via XP Goals System
                if (window.XPGoalsSystem) {
                    window.XPGoalsSystem.awardResearch(1, { researchCost: requiredPoints });
                } else if (window.Player) {
                    Player._awardExperience(Math.floor(requiredPoints / 100), 'Research');
                }
            }
        }
    }

    /**
     * Complete current research.
     */
    completeResearch() {
        const nation = this.nation;
        if (!nation || !nation.currentResearch) return;

        const research = nation.currentResearch;

        // Add technology
        nation.technologies.add(research.id);

        // Apply research benefits
        if (research.benefits) {
            nation.applyResearchBenefits(research.benefits);
        }

        // Reset research state
        nation.currentResearch = null;
        nation.researchProgress = 0;
        nation.statistics.researchCompleted++;

        EventBus.emit(GameEvents.RESEARCH_COMPLETED, {
            research: research,
            nation: nation.serialize()
        });

        console.log(`Research completed: ${research.name}`);
    }

    /**
     * Apply research benefits.
     */
    applyResearchBenefits(benefits) {
        const nation = this.nation;
        if (!nation) return;

        if (benefits.populationGrowth) {
            // Increase population growth rate
        }
        if (benefits.economicBonus) {
            nation.gdp *= (1 + benefits.economicBonus);
        }
        if (benefits.militaryBonus) {
            nation.militaryStrength *= (1 + benefits.militaryBonus);
        }
    }

    /**
     * Start new research project.
     */
    startResearch(researchId) {
        const nation = this.nation;
        if (!nation) return false;

        const research = {
            id: researchId,
            name: `Research ${researchId}`,
            cost: 1000 + Math.random() * 2000,
            benefits: {
                economicBonus: 0.1
            }
        };

        nation.currentResearch = research;
        nation.researchProgress = 0;

        EventBus.emit(GameEvents.RESEARCH_STARTED, {
            research: research
        });

        return true;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MILITARY
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Calculate weighted military population.
     */
    calculateWeightedMilitaryPopulation() {
        const nation = this.nation;
        if (!nation) return 0;

        const weights = { soldiers: 1, tanks: 2, aircraft: 3, ships: 5, spies: 0, missiles: 0, nukes: 0 };
        let total = 0;
        for (const [type, count] of Object.entries(nation.militaryUnits || {})) {
            total += (count || 0) * (weights[type] || 1);
        }
        return total;
    }

    /**
     * Get military usage ratio.
     */
    getMilitaryUsageRatio() {
        const nation = this.nation;
        if (!nation) return 0;

        const totalPopulation = nation.population || 0;
        if (totalPopulation === 0) return 0;
        return nation.calculateWeightedMilitaryPopulation() / totalPopulation;
    }

    /**
     * Apply happiness penalties based on military usage ratio.
     */
    applyMilitaryHappinessPenalty() {
        const nation = this.nation;
        if (!nation) return;

        const ratio = nation.getMilitaryUsageRatio();
        let penalty = 0;
        let reason = '';

        if (ratio < 0.05) {
            penalty = (0.05 - ratio) * 20;
            reason = 'Military too weak - nation feels vulnerable';
        } else if (ratio > 0.25) {
            penalty = (ratio - 0.25) * 40;
            reason = 'Excessive military force - society feels oppressed';
        }

        if (penalty > 0) {
            penalty = Math.floor(penalty);
            nation.happiness = Math.max(0, Math.min(100, nation.happiness - penalty));
            if (nation.nationStats) nation.nationStats.happiness = nation.happiness;

            EventBus.emit(GameEvents.HAPPINESS_CHANGED, {
                change: -penalty,
                reason: reason,
                nation: nation
            });
        }
    }

    /**
     * Calculate military training cost.
     * Unit cost data lives in MilitaryUnit.js (single source of truth).
     * populationCost: soldiers=1, tanks=1, aircraft=1, ships=1, spies=1, missiles=0, nukes=0
     * Higher money costs, higher upkeep.
     */
    calculateMilitaryCost(type, amount) {
        const nation = this.nation;
        if (!nation) return { money: 100 * amount, populationCost: 0, techRequired: 0 };

        // Pull cost data from MilitaryUnit.js (single source of truth)
        const unitCostData = MilitaryUnit.getUnitCostData(type);
        if (!unitCostData) {
            return { money: 1000 * amount, populationCost: 0, techRequired: 0, resources: {} };
        }

        const result = {
            money: unitCostData.moneyCost * amount,
            populationCost: unitCostData.populationCost * amount,
            techRequired: unitCostData.techRequired,
            resources: unitCostData.resources ? Object.fromEntries(
                Object.entries(unitCostData.resources).map(([k, v]) => [k, v * amount])
            ) : {},
            description: '',
        };

        const milCostMod = nation.edictEffects?.militaryCostModifier || 0;
        if (result.money) result.money = Math.max(1, Math.floor(result.money * (1 + milCostMod)));

        // Apply tempMilitaryCost reductions from food/water consumption (purchase cost)
        const costTypeMap = { soldiers: 'soldier', tanks: 'tank', aircraft: 'aircraft', ships: 'ship' };
        const unitKey = costTypeMap[type];
        if (unitKey && nation.tempMilitaryCost?.[unitKey]) {
            result.money = Math.max(1, Math.floor(result.money * (1 - nation.tempMilitaryCost[unitKey])));
        }
        return { money: result.money, populationCost: result.populationCost, techRequired: result.techRequired, resources: result.resources || {} };
    }

    /**
     * Check if nation has required prerequisite building/project.
     */
    hasPrerequisite(prerequisite) {
        const nation = this.nation;
        if (!nation || !prerequisite) return true;

        if (nation.projects && nation.projects[prerequisite] > 0) {
            return true;
        }

        if (nation.wonderEffects && nation.wonderEffects[prerequisite] > 0) {
            return true;
        }

        return false;
    }

    /**
     * Apply temporary population reduction for military recruitment.
     */
    applyTemporaryPopulationReduction(amount) {
        const nation = this.nation;
        if (!nation) return;

        if (!nation.temporaryEffects) {
            nation.temporaryEffects = [];
        }

        nation.temporaryEffects.push({
            type: 'populationReduction',
            amount: amount,
            turnsRemaining: 1,
            description: `Military recruitment impact: -${amount} population`
        });
    }

    /**
     * Apply temporary happiness reduction for nuclear weapons.
     */
    applyTemporaryHappinessReduction(amount) {
        const nation = this.nation;
        if (!nation) return;

        if (!nation.temporaryEffects) {
            nation.temporaryEffects = [];
        }

        nation.temporaryEffects.push({
            type: 'happinessReduction',
            amount: amount,
            turnsRemaining: 1,
            description: `Nuclear weapons production: -${amount} happiness`
        });
    }

    /**
     * Process temporary effects each turn.
     */
    processTemporaryEffects() {
        const nation = this.nation;
        if (!nation || !nation.temporaryEffects) return;

        nation.temporaryEffects = nation.temporaryEffects.filter(effect => {
            effect.turnsRemaining--;
            return effect.turnsRemaining > 0;
        });
    }

    /**
     * Calculate daily military maintenance costs.
     * Matches MilitaryUnit.js maintenance/upkeep values — much higher, per-unit.
     * soldiers: 100 maintenance + 50 upkeep
     * tanks: 500 + 250
     * aircraft: 2000 + 1000
     * ships: 4000 + 2000
     * spies: 1000 + 500
     * missiles: 200 + 100
     * nukes: 2000 + 1000
     */
    calculateDailyMaintenanceCosts() {
        const nation = this.nation;
        if (!nation) return { money: 0 };

        const maintenanceCosts = {
            money: 0,
        };

        // Maintenance cost per unit per day (from MilitaryUnit.js)
        const maintenancePerUnit = {
            soldiers: 2.5,
            tanks: 50,
            aircraft: 100,
            ships: 250,
            spies: 500,
            missiles: 2500,
            nukes: 7500,
        };

        // Upkeep cost per unit per day (from MilitaryUnit.js) - merged into maintenancePerUnit
        const upkeepPerUnit = {
            soldiers: 0,
            tanks: 0,
            aircraft: 0,
            ships: 0,
            spies: 0,
            missiles: 0,
            nukes: 0,
        };

        const unitTypes = Object.keys(maintenancePerUnit);
        for (const type of unitTypes) {
            const count = nation.militaryUnits[type] || 0;
            if (count > 0) {
                const m = maintenancePerUnit[type] * count;
                const u = upkeepPerUnit[type] * count;
                let unitTotal = m + u;

                // Apply tempMilitaryUpkeep reductions from food/water consumption (upkeep cost)
                const upkeepTypeMap = { soldiers: 'soldier', tanks: 'tank', aircraft: 'aircraft', ships: 'ship', spies: 'spies' };
                const unitKey = upkeepTypeMap[type];
                if (unitKey && nation.tempMilitaryUpkeep?.[unitKey]) {
                    unitTotal = Math.max(0, Math.floor(unitTotal * (1 - nation.tempMilitaryUpkeep[unitKey])));
                }

                maintenanceCosts.money += unitTotal;
            }
        }

        const upkeepMod = nation.edictEffects?.militaryUpkeepModifier || 0;
        maintenanceCosts.money = Math.max(0, Math.floor(maintenanceCosts.money * (1 + upkeepMod)));
        return maintenanceCosts;
    }

    /**
     * Pay daily military maintenance.
     */
    payMilitaryMaintenance() {
        const nation = this.nation;
        if (!nation) return false;

        const costs = nation.calculateDailyMaintenanceCosts();

        if (nation.money < costs.money) {
            nation.militaryMaintenanceDeficit = true;
            console.warn(`Cannot afford military maintenance: need $${costs.money.toLocaleString()}, have $${nation.money.toLocaleString()}`);
            return false;
        }

        nation.money -= costs.money;
        nation.militaryMaintenanceDeficit = false;

        EventBus.emit('military_maintenance_paid', {
            costs: costs,
            nation: nation
        });

        return true;
    }

    /**
     * Update military strength based on units and player skills.
     */
    updateMilitaryStrength() {
        const nation = this.nation;
        if (!nation) return;

        const unitStrength = {
            soldiers: 1,
            tanks: 25,
            aircraft: 100,
            ships: 200,
            spies: 10,
            missiles: 500,
            nukes: 2000
        };

        let totalStrength = 0;
        Object.keys(nation.militaryUnits).forEach(type => {
            totalStrength += nation.militaryUnits[type] * (unitStrength[type] || 1);
        });

        // Apply player attack skill bonus
        if (window.Player) {
            const attackVal  = Player.getSkillValue('attack');
            const defenseVal = Player.getSkillValue('defense');
            totalStrength = Math.floor(totalStrength + attackVal + defenseVal);
        }

        // Apply edict military effectiveness modifier
        const milEffMod = nation.edictEffects?.militaryEffectivenessModifier || 0;
        totalStrength = Math.floor(totalStrength * (1 + milEffMod));
        if (nation.militaryMaintenanceDeficit) {
            totalStrength = Math.floor(totalStrength * 0.5);
        }

        nation.militaryStrength = totalStrength;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MILITARY TRAINING
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Train military units with population-based costs and 50% military cap.
     * Citizens are NOT removed from population — they keep their jobs via PopulationSystem.enlistMilitaryPopulation().
     */
    trainMilitary(type, amount = 1) {
        const nation = this.nation;
        if (!nation) throw new Error('No nation instance');

        if (!Object.hasOwn(nation.militaryUnits, type) || !Number.isSafeInteger(amount) || amount < 1) {
            throw new Error('Select a valid unit and positive whole quantity');
        }

        const costData = this.calculateMilitaryCost(type, amount);

        // Check money requirement
        if (nation.money < costData.money) {
            throw new Error(`Insufficient funding: need $${costData.money.toLocaleString()}, have $${nation.money.toLocaleString()}`);
        }

        // Check technology requirements
        if (costData.techRequired && nation.tech < costData.techRequired) {
            throw new Error(`Insufficient technology: need ${costData.techRequired}, have ${nation.tech}`);
        }

        // Check prerequisite
        if (costData.prerequisite && !nation.hasPrerequisite(costData.prerequisite)) {
            throw new Error(`Missing prerequisite: ${costData.prerequisite}`);
        }

        // Check military population cap (max 50% of population in military units)
        const unitWeights = { soldiers: 1, tanks: 2, aircraft: 3, ships: 5, spies: 0, missiles: 0, nukes: 0 };
        const weight = unitWeights[type] || 1;
        const currentWeighted = nation.calculateWeightedMilitaryPopulation();
        const totalPopulation = nation.population || 0;
        const newWeighted = currentWeighted + (weight * amount);

        if (totalPopulation > 0 && newWeighted / totalPopulation > 0.50) {
            const maxAllowed = Math.floor(totalPopulation * 0.50 - currentWeighted);
            throw new Error(`Military population cap exceeded: max 50% of population can be in military. Can train at most ${Math.max(0, Math.floor(maxAllowed / weight))} more ${type}.`);
        }

        // Check population cost availability (each unit costs populationCost citizens)
        const popCost = costData.populationCost || 0;
        if (popCost > 0 && totalPopulation > 0) {
            const popNeeded = popCost;
            const popAvailable = totalPopulation - currentWeighted;
            if (popNeeded > popAvailable) {
                throw new Error(`Insufficient population: need ${popNeeded} population for ${amount} ${type}, have ${popAvailable} available`);
            }
        }

        // Apply player attack skill bonus (training cost discount, max 20%)
        let actualMoneyCost = costData.money;
        if (window.Player) {
            const attackVal = Player.getSkillValue('attack');
            const discount = Math.min(0.20, attackVal / 5000);
            actualMoneyCost = Math.floor(costData.money * (1 - discount));
        }

        // Deduct costs
        nation.money -= actualMoneyCost;

        // Add units
        nation.militaryUnits[type] = (nation.militaryUnits[type] || 0) + amount;

        // Mark citizens as military and tie them to units
        if (window.PopulationSystem) {
            window.PopulationSystem.enlistMilitaryPopulation(amount, type);
        }

        // Apply happiness penalties based on military usage ratio
        nation.applyMilitaryHappinessPenalty();

        // Apply happiness impact for nuclear weapons
        if (costData.happinessImpact) {
            nation.applyTemporaryHappinessReduction(costData.happinessImpact);
        }

        this.updateMilitaryStrength();

        // Award experience to player for military training via XP Goals System
        if (window.XPGoalsSystem) {
            const xpMap = {
                soldiers: 'awardTrainSoldiers',
                tanks: 'awardTrainTanks',
                aircraft: 'awardTrainAircraft',
                ships: 'awardTrainShips',
                missiles: 'awardBuyMissiles',
                nukes: 'awardBuyNukes',
            };
            const awardMethod = xpMap[type];
            if (awardMethod && window.XPGoalsSystem[awardMethod]) {
                window.XPGoalsSystem[awardMethod](amount, { type });
            } else if (window.Player) {
                Player._awardExperience(amount * 8, 'Military Trained');
            }
        } else if (window.Player) {
            Player._awardExperience(amount * 8, 'Military Trained');
        }

        EventBus.emit(GameEvents.MILITARY_TRAINED, {
            type: type,
            amount: amount,
            cost: {
                money: actualMoneyCost,
            },
            nation: nation
        });

        return amount;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MONTHLY / ANNUAL PROCESSING
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Process monthly economics.
     */
    processMonthlyEconomics() {
        const nation = this.nation;
        if (!nation) return;

        nation.calculateResourceGeneration();

        if (nation.budget.balance > 0) {
            nation.stability = Math.min(100, nation.stability + 1);
        } else {
            nation.stability = Math.max(0, nation.stability - 2);
        }
    }

    /**
     * Update diplomatic relations.
     */
    updateDiplomaticRelations() {
        const nation = this.nation;
        if (!nation) return;

        for (const [nationId, relation] of nation.relations.entries()) {
            if (relation > 50) {
                nation.relations.set(nationId, Math.max(50, relation - 0.5));
            } else if (relation < 50) {
                nation.relations.set(nationId, Math.min(50, relation + 0.5));
            }
        }

        let positiveCount = 0;
        for (const relation of nation.relations.values()) {
            if (relation > 50) positiveCount++;
        }
        nation.statistics.positiveRelationsCount = positiveCount;
    }

    /**
     * Process monthly events.
     */
    processMonthlyEvents() {
        const nation = this.nation;
        if (!nation) return;

        const eventChance = Math.random();

        if (eventChance < 0.1) {
            nation.triggerRandomEvent();
        }
    }

    /**
     * Trigger random event.
     */
    triggerRandomEvent() {
        const nation = this.nation;
        if (!nation) return;

        const allEvents = [];

        Object.values(NationEvents).forEach(category => {
            if (Array.isArray(category)) {
                category.forEach(event => {
                    const weight = event.weight || 1;
                    for (let i = 0; i < weight; i++) {
                        allEvents.push(event);
                    }
                });
            }
        });

        if (allEvents.length === 0) {
            allEvents = [
                {
                    id: 'economic_boom',
                    name: 'Economic Boom',
                    description: 'Your nation experiences unexpected economic growth!',
                    effects: { money: 2000000, happiness: 5 }
                },
                {
                    id: 'natural_disaster',
                    name: 'Natural Disaster',
                    description: 'A natural disaster strikes your nation.',
                    effects: { population: 0.95, happiness: -10, money: -1000000 }
                },
                {
                    id: 'tech_breakthrough',
                    name: 'Technological Breakthrough',
                    description: 'Your scientists make an important discovery!',
                    effects: { tech: 100, researchPoints: 500 }
                },
                {
                    id: 'diplomatic_success',
                    name: 'Diplomatic Success',
                    description: 'Your diplomatic efforts improve international relations.',
                    effects: { reputation: 5, happiness: 3 }
                }
            ];
        }

        const event = allEvents[Math.floor(Math.random() * allEvents.length)];
        nation.applyEventEffects(event);

        nation.eventHistory.push({
            date: Date.now(),
            event: event
        });

        EventBus.emit(GameEvents.RANDOM_EVENT, {
            event: event,
            nation: nation.serialize()
        });
    }

    /**
     * Apply event effects.
     */
    applyEventEffects(event) {
        const nation = this.nation;
        if (!nation) return;

        const effects = event.effects;

        Object.keys(effects).forEach(stat => {
            if (nation[stat] !== undefined) {
                if (effects[stat] > 0 && effects[stat] < 1) {
                    nation[stat] *= effects[stat];
                } else {
                    nation[stat] += effects[stat];
                }
            } else if (nation.resources[stat] !== undefined) {
                nation.resources[stat] += effects[stat];
            }
        });

        nation.happiness = Math.max(0, Math.min(100, nation.happiness));
        nation.stability = Math.max(0, Math.min(100, nation.stability));
        nation.reputation = Math.max(0, Math.min(100, nation.reputation));
    }

    /**
     * Process annual statistics.
     */
    processAnnualStatistics() {
        // Calculate annual growth rates
        // Update nation ranking
        // Process long-term trends
    }

    /**
     * Check and award achievements.
     */
    checkAchievements() {
        const nation = this.nation;
        if (!nation) return;

        const achievements = [
            {
                id: 'first_territory',
                name: 'First Steps',
                description: 'Claim your first territory',
                condition: () => nation.territories.length >= 1
            },
            {
                id: 'economic_powerhouse',
                name: 'Economic Powerhouse',
                description: 'Reach a GDP of 1 million',
                condition: () => nation.gdp >= 1000000
            },
            {
                id: 'happy_nation',
                name: 'Happy Nation',
                description: 'Maintain 80+ happiness for a full year',
                condition: () => nation.happiness >= 80
            }
        ];

        achievements.forEach(achievement => {
            if (!nation.achievements.has(achievement.id) && achievement.condition()) {
                nation.achievements.add(achievement.id);
                EventBus.emit(GameEvents.ACHIEVEMENT_UNLOCKED, {
                    achievement: achievement
                });
            }
        });
    }

    /**
     * Generate annual report.
     */
    generateAnnualReport() {
        const nation = this.nation;
        if (!nation) return null;

        const report = {
            year: new Date().getFullYear(),
            population: nation.population,
            gdp: nation.gdp,
            happiness: nation.happiness,
            territories: nation.territories.length,
            achievements: Array.from(nation.achievements),
            majorEvents: nation.eventHistory.slice(-5)
        };

        EventBus.emit(GameEvents.ANNUAL_REPORT, {
            report: report
        });

        return report;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // NATION OVERVIEW / STATE ACCESSORS
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Get nation overview data.
     */
    getOverview() {
        const nation = this.nation;
        if (!nation) return null;

        return {
            basic: {
                name: nation.name,
                leader: nation.leader,
                government: nation.government,
                founded: nation.founded,
                age: nation._nationAgeDays()
            },
            statistics: {
                population: nation.population,
                gdp: nation.gdp,
                happiness: nation.happiness,
                stability: nation.stability,
                reputation: nation.reputation,
                militaryStrength: nation.militaryStrength
            },
            resources: { ...nation.resources },
            economy: { ...nation.budget },
            territories: nation.territories.length,
            technologies: nation.technologies.size
        };
    }

    /**
     * Get production bonus from player skill (used by resource/mining system).
     * Returns decimal multiplier (e.g. 0.50 = +50% production).
     */
    getProductionBonus() {
        if (!window.Player) return 0;
        return Player.getSkillValue('production') || 0;
    }

    /**
     * Get stewardship cost reduction from player skill (used by building/project/wonder systems).
     * Returns decimal reduction (e.g. 0.25 = -25% cost).
     */
    getStewardshipCostReduction() {
        if (!window.Player) return 0;
        return Player.getSkillValue('stewardship') || 0;
    }
}

// ════════════════════════════════════════════════════════════════════════════
// MODULE EXPORTS
// ════════════════════════════════════════════════════════════════════════════

// Expose class and global singleton
window.NationSystem = NationSystem;

// Create global uninitialized instance
const NationSystemInstance = new NationSystem();
window.NationSystemInstance = NationSystemInstance;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NationSystem, NationSystemInstance };
}
