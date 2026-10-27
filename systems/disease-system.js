/**
 * Disease System - Manages global and national diseases with evolution mechanics
 */

class DiseaseSystem {
    constructor() {
        this.diseases = new Map();
        this.activeOutbreaks = new Map();
        this.globalOutbreaks = new Set();
        this.diseaseDatabase = this.initializeDiseaseDatabase();
        this.outbreakCheckTimer = null;

        // Separate tick counters for minor and major outbreak checks
        this.minorTick = 0;
        this.majorTick = 0;

        // Global aggregate metrics (updated each check cycle)
        this.globalMetrics = {
            pollution: 0,
            disease: 0,
            health: 50, // higher = better health
            totalNations: 0
        };

        // Configuration
        this.config = {
            minorCheckInterval: 2,      // minor outbreak check every 2 ticks
            majorCheckInterval: 12,     // major outbreak check every 12 ticks
            minorDiseaseChance: 0.05,   // 5% chance per minor tick
            majorDiseaseChance: 0.02,   // 2% chance per major tick
            globalEvolutionTime: 72,    // hours for national to become global
            pollutionMultiplier: 2.0,   // pollution increases disease chance
            happinessReduction: 0.5,    // happiness reduces disease chance
            diseaseSpreadRate: 0.02,    // 2% chance per tick to spread to neighbors
            globalEventChance: 0.01,    // 1% chance per tick for global disease event
            globalPollutionMultiplier: 1.5, // global pollution increases global event chance
            globalHealthMultiplier: 1.5     // low global health increases global event chance
        };

        // Map disease effect keys to real Nation/nationStats properties.
        // Only properties that actually exist on Nation are mapped; unmapped
        // effect keys are skipped (they would otherwise create dead properties).
        // BAD metrics (higher is worse): pollution, disease, crime, healthcare_spending
        // GOOD metrics (higher is better): happiness, stability, literacy, etc.
        this.effectPropertyMap = {
            // Nation-level properties (good metrics)
            'happiness': { target: 'happiness', type: 'nation', good: true },
            'stability': { target: 'stability', type: 'nation', good: true },
            'military_strength': { target: 'militaryStrength', type: 'nation', good: true },
            'physical_strength': { target: 'militaryStrength', type: 'nation', good: true },

            // nationStats properties (good metrics)
            'tax_efficiency': { target: 'nationStats.taxEfficiency', type: 'nationStats', good: true },
            'population_efficiency': { target: 'nationStats.populationEfficiency', type: 'nationStats', good: true },
            'military_morale': { target: 'nationStats.militaryMorale', type: 'nationStats', good: true },
            'literacy': { target: 'nationStats.literacy', type: 'nationStats', good: true },
            'environment': { target: 'nationStats.environment', type: 'nationStats', good: true },
            'crime': { target: 'nationStats.crime', type: 'nationStats', good: false },
            'disease': { target: 'nationStats.disease', type: 'nationStats', good: false },
            'pollution': { target: 'nationStats.pollution', type: 'nationStats', good: false },
            'taxable_income': { target: 'taxableIncome', type: 'nation', good: true },
            'population': { target: 'population', type: 'nation', good: true },
            'hospital_upkeep': { target: 'buildingUpkeep.improvements', type: 'nation', good: false },
        };
    }

    // Map disease effect keys to real Nation/nationStats properties.

    initialize() {
        this.setupEventHandlers();
        this.startDiseaseChecks();
        console.log('Disease System initialized with', this.diseaseDatabase.size, 'diseases');
    }

    initializeDiseaseDatabase() {
        const diseases = new Map();
        
        // Load diseases from external data files only
        this.loadDiseaseData(diseases);
        
        return diseases;
    }

    loadDiseaseData(diseases) {
        // Load national diseases from external file
        if (window.NATIONAL_DISEASES) {
            if (window.NATIONAL_DISEASES.minor && Array.isArray(window.NATIONAL_DISEASES.minor)) {
                window.NATIONAL_DISEASES.minor.forEach(disease => {
                    diseases.set(disease.id, disease);
                });
            }
            if (window.NATIONAL_DISEASES.major && Array.isArray(window.NATIONAL_DISEASES.major)) {
                window.NATIONAL_DISEASES.major.forEach(disease => {
                    diseases.set(disease.id, disease);
                });
            }
        } else {
            console.warn('National diseases data not loaded. Make sure assets/data/diseases/national-diseases.js is included.');
        }

        // Load global diseases from external file
        if (window.GLOBAL_DISEASES) {
            if (window.GLOBAL_DISEASES.minor && Array.isArray(window.GLOBAL_DISEASES.minor)) {
                window.GLOBAL_DISEASES.minor.forEach(disease => {
                    diseases.set(disease.id, disease);
                });
            }
            if (window.GLOBAL_DISEASES.major && Array.isArray(window.GLOBAL_DISEASES.major)) {
                window.GLOBAL_DISEASES.major.forEach(disease => {
                    diseases.set(disease.id, disease);
                });
            }
        } else {
            console.warn('Global diseases data not loaded. Make sure assets/data/diseases/global-diseases.js is included.');
        }
        
        console.log(`Loaded ${diseases.size} diseases from external data files`);
    }

    /**
     * Set disease database from DataIntegrationSystem
     */
    setDiseaseDatabase(diseaseData) {
        this.diseaseDatabase.clear();
        
        // Load national diseases
        if (diseaseData.national) {
            ['minor', 'major', 'severe'].forEach(severity => {
                if (diseaseData.national[severity] && Array.isArray(diseaseData.national[severity])) {
                    diseaseData.national[severity].forEach(disease => {
                        this.diseaseDatabase.set(disease.id, disease);
                    });
                }
            });
        }
        
        // Load global diseases
        if (diseaseData.global) {
            ['minor', 'major', 'severe'].forEach(severity => {
                if (diseaseData.global[severity] && Array.isArray(diseaseData.global[severity])) {
                    diseaseData.global[severity].forEach(disease => {
                        this.diseaseDatabase.set(disease.id, disease);
                    });
                }
            });
        }
        
        console.log(`Disease System updated with ${this.diseaseDatabase.size} diseases from data integration`);
    }


    // Disease management methods
    getRandomDisease(severity = null, scope = null) {
        const filteredDiseases = Array.from(this.diseaseDatabase.values()).filter(disease => {
            const severityMatch = !severity || disease.severity === severity;
            const scopeMatch = !scope || disease.scope === scope;
            return severityMatch && scopeMatch;
        });
        
        if (filteredDiseases.length === 0) {
            console.warn('No diseases found matching criteria:', { severity, scope });
            return null;
        }
        
        return filteredDiseases[Math.floor(Math.random() * filteredDiseases.length)];
    }

    getDiseaseById(id) {
        return this.diseaseDatabase.get(id);
    }

    // Outbreak management
    startOutbreak(nationId, diseaseId, severity = 'minor') {
        const disease = this.getDiseaseById(diseaseId);
        if (!disease) {
            console.error('Disease not found:', diseaseId);
            return false;
        }

        const outbreak = {
            id: `outbreak_${Date.now()}_${nationId}`,
            nationId: nationId,
            disease: disease,
            startTime: Date.now(),
            severity: severity,
            affected: 0,
            cured: false,
            evolutionTimer: disease.scope === 'national' ? this.config.globalEvolutionTime : null
        };

        this.activeOutbreaks.set(outbreak.id, outbreak);
        
        if (disease.scope === 'global') {
            this.globalOutbreaks.add(diseaseId);
        }

        this.applyDiseaseEffects(nationId, disease);
        
        // Emit outbreak event
        if (window.eventSystem) {
            window.eventSystem.emit('diseaseOutbreakStart', {
                nationId: nationId,
                disease: disease,
                outbreak: outbreak
            });
        }

        console.log(`Disease outbreak started: ${disease.name} in nation ${nationId}`);
        return outbreak.id;
    }

    cureOutbreak(outbreakId, cureMethod = {}) {
        const outbreak = this.activeOutbreaks.get(outbreakId);
        if (!outbreak) {
            console.error('Outbreak not found:', outbreakId);
            return false;
        }

        const disease = outbreak.disease;
        const nation = window.gameEngine?.getPlayer(outbreak.nationId);
        
        if (!nation) {
            console.error('Nation not found for outbreak:', outbreak.nationId);
            return false;
        }

        // Check cure requirements
        if (disease.cureRequirement) {
            const req = disease.cureRequirement;
            
            // Check money requirement
            if (req.money && nation.money < req.money) {
                return { success: false, reason: 'Insufficient funds', required: req.money, available: nation.money };
            }
            
            // Check research points requirement
            if (req.research_points && window.researchSystem) {
                const researchPoints = window.researchSystem.getAvailablePoints(outbreak.nationId);
                if (researchPoints < req.research_points) {
                    return { success: false, reason: 'Insufficient research points', required: req.research_points, available: researchPoints };
                }
            }
            
            // Deduct costs
            if (req.money) {
                nation.money -= req.money;
            }
            if (req.research_points && window.researchSystem) {
                window.researchSystem.spendPoints(outbreak.nationId, req.research_points);
            }
        }

        // Remove disease effects
        this.removeDiseaseEffects(outbreak.nationId, disease);
        
        // Mark as cured and remove outbreak
        outbreak.cured = true;
        this.activeOutbreaks.delete(outbreakId);
        
        if (disease.scope === 'global') {
            // Check if this was the last nation with this global disease
            const hasOtherOutbreaks = Array.from(this.activeOutbreaks.values())
                .some(other => other.disease.id === disease.id);
            if (!hasOtherOutbreaks) {
                this.globalOutbreaks.delete(disease.id);
            }
        }

        // Emit cure event
        if (window.eventSystem) {
            window.eventSystem.emit('diseaseOutbreakCured', {
                nationId: outbreak.nationId,
                disease: disease,
                outbreak: outbreak,
                cureMethod: cureMethod
            });
        }

        console.log(`Disease outbreak cured: ${disease.name} in nation ${outbreak.nationId}`);
        return { success: true, outbreak: outbreak };
    }

    applyDiseaseEffects(nationId, disease) {
        const nation = window.gameEngine?.getPlayer(nationId);
        if (!nation || !disease.effects) return;

        // Store original values for restoration
        if (!nation.diseaseEffects) {
            nation.diseaseEffects = new Map();
        }

        const effectId = `disease_${disease.id}`;
        nation.diseaseEffects.set(effectId, {
            diseaseId: disease.id,
            effects: { ...disease.effects }
        });

        // Apply effects using the property map
        Object.keys(disease.effects).forEach(stat => {
            const mapping = this.effectPropertyMap[stat];
            if (!mapping) {
                // Unmapped effect key — skip (no real Nation property exists)
                return;
            }

            const value = disease.effects[stat];
            const targetPath = mapping.target.split('.');
            let obj = mapping.type === 'nation' ? nation : nation[mapping.type];

            // Navigate to the parent object of the target property
            for (let i = 0; i < targetPath.length - 1; i++) {
                if (obj[targetPath[i]] === undefined || obj[targetPath[i]] === null) {
                    return; // Parent path doesn't exist yet
                }
                obj = obj[targetPath[i]];
            }
            const prop = targetPath[targetPath.length - 1];

            if (obj === undefined || obj === null) return;

            // Apply effect: positive value increases, negative value decreases
            // For bad metrics (pollution, disease, crime, healthcare_spending),
            // a positive value makes things worse; for good metrics, better.
            obj[prop] = (obj[prop] || 0) + value;

            // Clamp bad metrics at 0
            if (!mapping.good) {
                obj[prop] = Math.max(0, obj[prop]);
            }
        });

        console.log(`Applied disease effects for ${disease.name} to nation ${nationId}`);
    }

    removeDiseaseEffects(nationId, disease) {
        const nation = window.gameEngine?.getPlayer(nationId);
        if (!nation || !nation.diseaseEffects) return;

        const effectId = `disease_${disease.id}`;
        const storedEffects = nation.diseaseEffects.get(effectId);
        
        if (storedEffects) {
            // Remove effects (reverse of application)
            Object.keys(storedEffects.effects).forEach(stat => {
                const mapping = this.effectPropertyMap[stat];
                if (!mapping) return;

                const value = storedEffects.effects[stat];
                const targetPath = mapping.target.split('.');
                let obj = mapping.type === 'nation' ? nation : nation[mapping.type];

                // Navigate to the parent object of the target property
                for (let i = 0; i < targetPath.length - 1; i++) {
                    if (obj[targetPath[i]] === undefined || obj[targetPath[i]] === null) {
                        return; // Parent path doesn't exist yet
                    }
                    obj = obj[targetPath[i]];
                }
                const prop = targetPath[targetPath.length - 1];

                if (obj === undefined || obj === null) return;

                obj[prop] = (obj[prop] || 0) - value;

                // Clamp bad metrics at 0
                if (!mapping.good) {
                    obj[prop] = Math.max(0, obj[prop]);
                }
            });

            nation.diseaseEffects.delete(effectId);
            console.log(`Removed disease effects for ${disease.name} from nation ${nationId}`);
        }
    }

    // Disease spread mechanics
    checkDiseaseSpread() {
        if (!window.gameEngine) return;

        const nations = window.gameEngine.getAllPlayers();
        if (nations.length === 0) return;

        // Update global aggregate metrics
        this.updateGlobalMetrics(nations);

        // Increment tick counters
        this.minorTick++;
        this.majorTick++;

        // Check minor outbreaks every 2 ticks
        if (this.minorTick >= this.config.minorCheckInterval) {
            this.minorTick = 0;
            nations.forEach(nation => {
                this.checkRandomOutbreak(nation.id, 'minor');
            });
        }

        // Check major outbreaks every 12 ticks
        if (this.majorTick >= this.config.majorCheckInterval) {
            this.majorTick = 0;
            nations.forEach(nation => {
                this.checkRandomOutbreak(nation.id, 'major');
            });
        }

        // Check existing outbreaks for spreading
        nations.forEach(nation => {
            this.checkOutbreakSpread(nation.id);
        });

        // Process disease evolution (national → global)
        this.processEvolution();

        // Check for global disease events based on global metrics
        this.checkGlobalEvent();
    }

    /**
     * Calculate aggregate global metrics from all nations
     */
    updateGlobalMetrics(nations) {
        let totalPollution = 0;
        let totalDisease = 0;
        let totalHealth = 0;
        let count = 0;

        nations.forEach(nation => {
            const pollution = nation.nationStats?.pollution || 0;
            const disease = nation.nationStats?.disease || 0;
            const happiness = nation.happiness || 50;

            totalPollution += pollution;
            totalDisease += disease;
            totalHealth += happiness;
            count++;
        });

        this.globalMetrics.pollution = count > 0 ? totalPollution / count : 0;
        this.globalMetrics.disease = count > 0 ? totalDisease / count : 0;
        this.globalMetrics.health = count > 0 ? totalHealth / count : 50;
        this.globalMetrics.totalNations = count;
    }

    /**
     * Check for random disease outbreak for a specific nation and severity tier.
     * Uses separate tick-based scheduling: minor every 2 ticks, major every 12 ticks.
     * Chance is affected by nation pollution, disease level, and health.
     */
    checkRandomOutbreak(nationId, severity) {
        const nation = window.gameEngine?.getPlayer(nationId);
        if (!nation) return;

        // Base chance depends on severity tier
        let baseChance = severity === 'minor'
            ? this.config.minorDiseaseChance
            : this.config.majorDiseaseChance;

        // Pollution increases chance (higher pollution = higher chance)
        const pollution = nation.nationStats?.pollution || 0;
        if (pollution > 50) {
            const multiplier = 1 + ((pollution - 50) / 100) * this.config.pollutionMultiplier;
            baseChance *= multiplier;
        }

        // Disease level increases chance (higher disease = higher chance)
        const disease = nation.nationStats?.disease || 0;
        if (disease > 30) {
            baseChance *= (1 + (disease - 30) / 100);
        }

        // Low health increases chance (lower happiness/health = higher chance)
        const happiness = nation.happiness || 50;
        if (happiness < 40) {
            const reduction = ((40 - happiness) / 40) * this.config.happinessReduction;
            baseChance *= (1 + reduction);
        } else if (happiness > 70) {
            const reduction = ((happiness - 70) / 30) * this.config.happinessReduction;
            baseChance *= (1 - reduction);
        }

        // Check if outbreak triggers
        if (Math.random() < baseChance) {
            const disease = this.getRandomDisease(severity, 'national');
            if (disease) {
                // Don't spawn duplicate of same disease on same nation
                const hasSame = Array.from(this.activeOutbreaks.values())
                    .some(o => o.nationId === nationId && o.disease.id === disease.id);
                if (!hasSame) {
                    this.startOutbreak(nationId, disease.id, severity);
                }
            }
        }
    }

    checkOutbreakSpread(nationId) {
        const nation = window.gameEngine?.getPlayer(nationId);
        if (!nation) return;

        // Get neighboring nations
        const neighbors = window.gameEngine.getNeighboringNations?.(nationId) || [];

        // Check each active outbreak for spreading
        Array.from(this.activeOutbreaks.values())
            .filter(outbreak => outbreak.nationId === nationId)
            .forEach(outbreak => {
                neighbors.forEach(neighborId => {
                    if (Math.random() < this.config.diseaseSpreadRate) {
                        // Check if neighbor already has this disease
                        const hasDisease = Array.from(this.activeOutbreaks.values())
                            .some(other => other.nationId === neighborId && other.disease.id === outbreak.disease.id);

                        if (!hasDisease) {
                            this.startOutbreak(neighborId, outbreak.disease.id, outbreak.severity);
                        }
                    }
                });
            });
    }

    /**
     * Check for global disease events based on global pollution and health metrics.
     * Higher global pollution and lower global health increases chance.
     */
    checkGlobalEvent() {
        const { pollution, disease, health, totalNations } = this.globalMetrics;

        if (totalNations === 0) return;

        let chance = this.config.globalEventChance;

        // Global pollution increases chance
        if (pollution > 60) {
            chance *= 1 + ((pollution - 60) / 100) * this.config.globalPollutionMultiplier;
        }

        // Low global health increases chance
        if (health < 40) {
            chance *= 1 + ((40 - health) / 40) * this.config.globalHealthMultiplier;
        }

        if (Math.random() < chance) {
            this.triggerGlobalEvent();
        }
    }

    // Timer management
    startDiseaseChecks() {
        if (this.outbreakCheckTimer) {
            clearInterval(this.outbreakCheckTimer);
        }

        // Check for outbreaks every hour (game time)
        this.outbreakCheckTimer = setInterval(() => {
            this.checkDiseaseSpread();
        }, 60000); // 1 minute = 1 hour game time
    }

    stopDiseaseChecks() {
        if (this.outbreakCheckTimer) {
            clearInterval(this.outbreakCheckTimer);
            this.outbreakCheckTimer = null;
        }
    }

    // Event handlers
    setupEventHandlers() {
        if (window.eventSystem) {
            // Listen for nation events that might affect disease spread
            window.eventSystem.on('nationCreated', (data) => {
                // New nations start with no diseases
                console.log(`Disease system tracking new nation: ${data.nationId}`);
            });

            window.eventSystem.on('nationDestroyed', (data) => {
                // Clean up outbreaks for destroyed nation
                Array.from(this.activeOutbreaks.values())
                    .filter(outbreak => outbreak.nationId === data.nationId)
                    .forEach(outbreak => {
                        this.activeOutbreaks.delete(outbreak.id);
                    });
                console.log(`Cleaned up diseases for destroyed nation: ${data.nationId}`);
            });
        }
    }

    // Utility methods
    getNationOutbreaks(nationId) {
        return Array.from(this.activeOutbreaks.values())
            .filter(outbreak => outbreak.nationId === nationId);
    }

    getGlobalOutbreaks() {
        return Array.from(this.globalOutbreaks);
    }

    getAllOutbreaks() {
        return Array.from(this.activeOutbreaks.values());
    }

    getDiseaseStats() {
        const stats = {
            totalDiseases: this.diseaseDatabase.size,
            activeOutbreaks: this.activeOutbreaks.size,
            globalOutbreaks: this.globalOutbreaks.size,
            byCategory: {
                nationalMinor: 0,
                nationalMajor: 0,
                globalMinor: 0,
                globalMajor: 0
            }
        };

        Array.from(this.diseaseDatabase.values()).forEach(disease => {
            const key = `${disease.scope}${disease.severity.charAt(0).toUpperCase() + disease.severity.slice(1)}`;
            if (stats.byCategory.hasOwnProperty(key)) {
                stats.byCategory[key]++;
            }
        });

        return stats;
    }
}

// Export for use
window.DiseaseSystem = DiseaseSystem;