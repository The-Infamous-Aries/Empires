/**
 * Nation System - Core Nation Logic and Daily Turn Orchestrator
 * Dominion Wars - Nation Building Strategy Game
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
        nation.processTemporaryEffects();

        // 2. Pay military maintenance costs
        nation.payMilitaryMaintenance();

        // 3. Recalculate population
        nation.calculatePopulation();

        // Apply edict effects before stats so modifiers are current
        if (window.EdictSystem && typeof window.EdictSystem.initializeNationEdicts === 'function' && !nation.edicts) {
            window.EdictSystem.initializeNationEdicts(nation);
        }
        if (window.EdictSystem && typeof window.EdictSystem.applyEdictEffects === 'function') {
            window.EdictSystem.applyEdictEffects(nation);
        }

        // 4. Calculate all nation statistics
        nation.calculateNationStats();

        // Global system: apply global-average modifiers to this nation
        if (window.GlobalSystem && typeof window.GlobalSystem.applyGlobalModifiers === 'function') {
            window.GlobalSystem.applyGlobalModifiers(nation);
        }

        // 5. Calculate and stack/collect taxes
        if (typeof nation.collectTaxes === 'function') {
            nation.collectTaxes();
        }
        nation.calculateEconomy(false);
        if ((nation.taxRevenue || 0) > 0) {
            nation.stackedTaxes = (nation.stackedTaxes || 0) + (nation.taxRevenue || 0);
            nation.stackedTaxesTurns = (nation.stackedTaxesTurns || 0) === 0 ? 1 : nation.stackedTaxesTurns + 1;
        }

        // 6. Apply player skill bonuses to the nation
        if (window.Player) Player.applyToNation(nation);

        // 7. Update military strength
        nation.updateMilitaryStrength();

        // 8. Process research
        nation.processResearch();

        // 9. Check government/religion demands
        nation.checkDemands();

        // 10. Update happiness
        nation.updateHappiness();

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
            disease: 10,
            crime: 15,
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

        // Government policy effects
        let policyBonus = 0;
        if (nation.policyEffects?.educationBonus) {
            policyBonus = nation.policyEffects.educationBonus * 100;
        }

        nation.nationStats.literacy = Math.min(200, baseLiteracy + schoolBonus + universityBonus + wonderEducationBonus + policyBonus);
    }

    /**
     * Calculate pollution.
     */
    calculatePollution() {
        const nation = this.nation;
        if (!nation) return;

        // Base pollution from infrastructure and manufacturing
        let basePollution = Math.floor((nation.infra / 50) + (nation.population / 200000));

        // Add pollution from mines
        const mineCount = nation.improvements?.mine || 0;
        let minePollution = mineCount * 2;

        // Wonder effect: Clean Mine Operations removes mine pollution
        if (nation.wonderEffects?.cleanMineOperations) {
            minePollution = 0;
        }
        basePollution += minePollution;

        // Add pollution from assembly plants
        const assemblyPlantCount = nation.improvements?.assemblyPlant || 0;
        let assemblyPollution = assemblyPlantCount * 3;

        // Wonder effect: Clean Assembly Operations removes assembly plant pollution
        if (nation.wonderEffects?.cleanAssemblyOperations) {
            assemblyPollution = 0;
        }
        basePollution += assemblyPollution;

        // Add pollution from factories
        const factoryCount = nation.improvements?.factory || 0;
        basePollution += factoryCount * 3;

        // Recycling center reduction
        let recyclingReduction = 1.0;
        if (nation.improvementEffects?.pollutionReduction) {
            recyclingReduction -= nation.improvementEffects.pollutionReduction;
        }

        // Enhanced recycling project
        if (nation.projectEffects?.enhancedRecycling && !nation.wonderEffects?.supremeRecycling) {
            recyclingReduction -= nation.improvementEffects?.pollutionReduction || 0;
        }

        // Supreme recycling wonder
        if (nation.wonderEffects?.supremeRecycling) {
            recyclingReduction -= (nation.improvementEffects?.pollutionReduction || 0) * 2;
        }

        // Parks reduction
        if (nation.improvementEffects?.pollutionFromParks) {
            recyclingReduction -= Math.abs(nation.improvementEffects.pollutionFromParks);
        }

        // Tree plantation pollution reduction
        if (nation.improvementEffects?.treePollutionReduction) {
            recyclingReduction -= nation.improvementEffects.treePollutionReduction * 0.05;
        }

        // Policy effects
        if (nation.policyEffects?.environmentalHealth) {
            recyclingReduction *= Math.max(0, 1.0 - nation.policyEffects.environmentalHealth);
        }

        nation.nationStats.pollution = Math.max(0, Math.floor(basePollution * Math.max(0, recyclingReduction) * (1 + (nation.edictEffects?.pollutionModifier || 0))));
    }

    /**
     * Calculate disease rate.
     */
    calculateDisease() {
        const nation = this.nation;
        if (!nation) return;

        let baseDisease = 10;
        let edictDiseaseMod = nation.edictEffects?.diseaseModifier || 0;

        // Pollution increases disease
        let pollutionEffect = nation.nationStats.pollution * 0.5;

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

        // Healthcare policy effects
        let healthcareEffect = 0;
        if (nation.policyEffects?.healthcareQuality) {
            healthcareEffect = nation.policyEffects.healthcareQuality * -10;
        }

        nation.nationStats.disease = Math.max(0, Math.min(50,
            baseDisease + pollutionEffect - hospitalReduction - ambulanceReduction - wonderHealthcareReduction + environmentEffect + healthcareEffect + edictDiseaseMod
        ));
    }

    /**
     * Calculate crime rate.
     */
    calculateCrime() {
        const nation = this.nation;
        if (!nation) return;

        let baseCrime = 15;
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

        // Surveillance policy effects
        let surveillanceEffect = 0;
        if (nation.policyEffects?.internalSecurity) {
            surveillanceEffect = nation.policyEffects.internalSecurity * -20;
        }

        nation.nationStats.crime = Math.max(0, Math.min(80,
            baseCrime - policeReduction - swatReduction + casinoIncrease + sportsBettingIncrease + literacyEffect + happinessEffect + surveillanceEffect + edictCrimeMod
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
        happiness -= nation.nationStats.pollution * 0.15;
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

        // Policy effects
        if (nation.policyEffects?.happinessModifier) {
            happiness *= nation.policyEffects.happinessModifier;
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

        let environment = 100 - nation.nationStats.pollution;
        environment += nation.edictEffects?.environmentModifier || 0;

        // Environmental policy bonus
        if (nation.policyEffects?.environmentalHealth) {
            environment += nation.policyEffects.environmentalHealth * 20;
        }

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
     */
    landCost() {
        const nation = this.nation;
        if (!nation) return 0;

        const nextMile = nation.land + 1;
        const pop = Math.max(1, nation.population);
        const tierMult = Math.pow(Math.floor(nation.land / 1000) + 1, 2);
        let cost = Math.ceil(nextMile * (pop / 1000) * 10 * tierMult);

        if (nation.edictEffects && nation.edictEffects.landCostModifier) {
            cost = Math.floor(cost * (1 + nation.edictEffects.landCostModifier));
        }
        return cost;
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
            return true;
        }

        let cost = nation.landCost();
        if (nation.money < cost) {
            console.warn(`Cannot buy land — need $${cost}, have $${nation.money}`);
            return false;
        }

        nation.money -= cost;
        nation.land += 1;
        nation.mapBlocks = Math.floor(nation.land / GameConfig.MILES_PER_BLOCK);
        if (nation.land % GameConfig.MILES_PER_BLOCK === 0) {
            nation.statistics.landPurchased++;
        }

        nation.calculatePopulation();
        nation.calculateEconomy();
        if (window.WorldBankSystem && typeof window.WorldBankSystem.recordTerritoryPurchase === 'function') {
            const costInfo = window.WorldBankSystem.calculateTerritoryPurchaseCost(nation);
            const taxAmount = costInfo ? costInfo.taxAmount : 0;
            window.WorldBankSystem.recordTerritoryPurchase(nation, window.TimeSystem ? window.TimeSystem.currentDay : (nation.totalTurns || 0), taxAmount);
        }

        EventBus.emit('land_purchased', { mapBlocks: nation.mapBlocks, land: nation.land, cost });
        return true;
    }

    /**
     * Cost to buy the NEXT point of infrastructure.
     */
    infraCost() {
        const nation = this.nation;
        if (!nation) return 0;

        const pop = Math.max(1, nation.population);
        const tierMult = Math.pow(Math.floor(nation.infra / 1000) + 1, 2);
        let baseCost = Math.ceil((nation.infra + 1) * (pop / 1000) * 1 * tierMult);

        if (nation.bonusEffects?.construction) {
            baseCost = Math.floor(baseCost * 0.85);
        }
        if (nation.edictEffects && nation.edictEffects.infraCostModifier) {
            baseCost = Math.floor(baseCost * (1 + nation.edictEffects.infraCostModifier));
        }

        return baseCost;
    }

    /**
     * Buy one unit of infrastructure.
     */
    buyInfra(amount = 1) {
        const nation = this.nation;
        if (!nation) return false;

        for (let i = 0; i < amount; i++) {
            const cost = nation.infraCost();
            if (nation.money < cost) {
                console.warn(`Cannot buy infra at level ${nation.infra + 1} — need $${cost}`);
                return false;
            }
            nation.money -= cost;
            nation.infra += 1;
            nation.statistics.infraPurchased++;
        }

        nation.calculatePopulation();
        nation.calculateEconomy();

        EventBus.emit('infra_purchased', { infra: nation.infra });
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

        nation.calculatePopulation();
        nation.calculateEconomy();

        EventBus.emit('tech_purchased', { tech: nation.tech, cost });
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
                    nation.gdp = Math.floor(nation.gdp * (gov.bonuses.gdp || 1.1));
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

        // Government demand check
        if (nation.demandTimer.governmentDaysRemaining > 0) {
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

        // Religion demand check
        if (nation.demandTimer.religionDaysRemaining > 0) {
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

        // Apply player intuition skill bonus to research
        if (window.Player) {
            const intuitionBonus = Player.getSkillValue('intuition');
            researchGeneration = Math.floor(researchGeneration * (1 + intuitionBonus * 0.01));
        }

        nation.researchPoints += researchGeneration;

        // Apply to current research
        if (nation.currentResearch) {
            nation.researchProgress += researchGeneration;

            // Check if research is complete
            const requiredPoints = nation.currentResearch.cost || 1000;
            if (nation.researchProgress >= requiredPoints) {
                nation.completeResearch();

                // Award research experience to player
                if (window.Player) {
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
     * Based on MilitaryUnit.js unit data — population-based costs, no non-existent resources.
     * populationCost: soldiers=1, tanks=5, aircraft=10, ships=20, spies=2, missiles=0, nukes=0
     * Higher money costs, higher upkeep.
     */
    calculateMilitaryCost(type, amount) {
        const nation = this.nation;
        if (!nation) return { money: 100 * amount, populationCost: 0, techRequired: 0 };

        // Population-based unit data matching MilitaryUnit.js
        const unitData = {
            soldiers: {
                money: 500 * amount,
                populationCost: 1 * amount,
                techRequired: 0,
                description: 'Basic infantry units',
            },
            tanks: {
                money: 25000 * amount,
                populationCost: 5 * amount,
                techRequired: 150,
                description: 'Armored combat vehicles',
            },
            aircraft: {
                money: 100000 * amount,
                populationCost: 10 * amount,
                techRequired: 300,
                description: 'Military aircraft',
            },
            ships: {
                money: 250000 * amount,
                populationCost: 20 * amount,
                techRequired: 450,
                description: 'Naval vessels',
            },
            spies: {
                money: 50000 * amount,
                populationCost: 2 * amount,
                techRequired: 0,
                prerequisite: 'spyOperations',
                description: 'Intelligence operatives',
            },
            missiles: {
                money: 2500000 * amount,
                populationCost: 0,
                techRequired: 0,
                prerequisite: 'missileSilo',
                description: 'Ballistic missiles',
            },
            nukes: {
                money: 10000000 * amount,
                populationCost: 0,
                techRequired: 0,
                prerequisite: 'nuclearWarheadFacility',
                happinessImpact: amount,
                description: 'Nuclear warheads',
            }
        };

        const result = unitData[type] || { money: 1000 * amount, populationCost: 0, techRequired: 0 };
        const milCostMod = nation.edictEffects?.militaryCostModifier || 0;
        if (result.money) result.money = Math.max(1, Math.floor(result.money * (1 + milCostMod)));
        return result;
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
            soldiers: 100,
            tanks: 500,
            aircraft: 2000,
            ships: 4000,
            spies: 1000,
            missiles: 200,
            nukes: 2000,
        };

        // Upkeep cost per unit per day (from MilitaryUnit.js)
        const upkeepPerUnit = {
            soldiers: 50,
            tanks: 250,
            aircraft: 1000,
            ships: 2000,
            spies: 500,
            missiles: 100,
            nukes: 1000,
        };

        const unitTypes = Object.keys(maintenancePerUnit);
        for (const type of unitTypes) {
            const count = nation.militaryUnits[type] || 0;
            if (count > 0) {
                const m = maintenancePerUnit[type] * count;
                const u = upkeepPerUnit[type] * count;
                maintenanceCosts.money += m + u;
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

        // Update military strength
        nation.updateMilitaryStrength();

        // Award experience to player for military training
        if (window.Player) {
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
                if (effects[stat] > 0 && effects[stat] < 2) {
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

    // ═════════════════════════════════════════════════════════════════════════
    // MODULE EXPORTS
    // ═════════════════════════════════════════════════════════════════════════
}

// Expose class and global singleton
window.NationSystem = NationSystem;

// Create global uninitialized instance
const NationSystemInstance = new NationSystem();
window.NationSystemInstance = NationSystemInstance;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NationSystem, NationSystemInstance };
}
