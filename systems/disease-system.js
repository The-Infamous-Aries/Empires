/**
 * Disease System - Manages global and national diseases with evolution mechanics
 */

class DiseaseSystem {
    constructor() {
        this.diseases = new Map();
        this.activeOutbreaks = new Map();
        this.globalOutbreaks = new Set();
        this.diseaseDatabase = this.initializeDiseaseDatabase();
        this.evolutionTimer = null;
        this.outbreakCheckTimer = null;
        
        // Configuration
        this.config = {
            minorDiseaseChance: 0.001, // 0.1% per hour per nation
            majorDiseaseChance: 0.0005, // 0.05% per hour per nation
            globalEvolutionTime: 72, // hours for national to become global
            pollutionMultiplier: 2.0, // pollution increases disease chance
            happinessReduction: 0.5, // happiness reduces disease chance
            diseaseSpreadRate: 0.02 // 2% chance per hour to spread to neighbors
        };
    }

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
            if (window.NATIONAL_DISEASES.minor) {
                window.NATIONAL_DISEASES.minor.forEach(disease => {
                    diseases.set(disease.id, disease);
                });
            }
            if (window.NATIONAL_DISEASES.major) {
                window.NATIONAL_DISEASES.major.forEach(disease => {
                    diseases.set(disease.id, disease);
                });
            }
        } else {
            console.warn('National diseases data not loaded. Make sure data/diseases/national-diseases.js is included.');
        }

        // Load global diseases from external file
        if (window.GLOBAL_DISEASES) {
            if (window.GLOBAL_DISEASES.minor) {
                window.GLOBAL_DISEASES.minor.forEach(disease => {
                    diseases.set(disease.id, disease);
                });
            }
            if (window.GLOBAL_DISEASES.major) {
                window.GLOBAL_DISEASES.major.forEach(disease => {
                    diseases.set(disease.id, disease);
                });
            }
        } else {
            console.warn('Global diseases data not loaded. Make sure data/diseases/global-diseases.js is included.');
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
                if (diseaseData.national[severity]) {
                    diseaseData.national[severity].forEach(disease => {
                        this.diseaseDatabase.set(disease.id, disease);
                    });
                }
            });
        }
        
        // Load global diseases
        if (diseaseData.global) {
            ['minor', 'major', 'severe'].forEach(severity => {
                if (diseaseData.global[severity]) {
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

        // Apply effects
        Object.keys(disease.effects).forEach(stat => {
            const value = disease.effects[stat];
            if (stat === 'healthcare_cost') {
                nation.healthcare_spending = (nation.healthcare_spending || 0) + value;
            } else if (nation.hasOwnProperty(stat)) {
                nation[stat] = (nation[stat] || 0) + value;
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
            // Remove effects
            Object.keys(storedEffects.effects).forEach(stat => {
                const value = storedEffects.effects[stat];
                if (stat === 'healthcare_cost') {
                    nation.healthcare_spending = Math.max(0, (nation.healthcare_spending || 0) - value);
                } else if (nation.hasOwnProperty(stat)) {
                    nation[stat] = (nation[stat] || 0) - value;
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
        
        nations.forEach(nation => {
            // Check for new outbreaks
            this.checkRandomOutbreak(nation.id);
            
            // Check existing outbreaks for spreading
            this.checkOutbreakSpread(nation.id);
        });
    }

    checkRandomOutbreak(nationId) {
        const nation = window.gameEngine?.getPlayer(nationId);
        if (!nation) return;

        // Calculate outbreak chances based on nation conditions
        let minorChance = this.config.minorDiseaseChance;
        let majorChance = this.config.majorDiseaseChance;

        // Pollution increases disease chance
        if (nation.pollution > 50) {
            const multiplier = 1 + ((nation.pollution - 50) / 100) * this.config.pollutionMultiplier;
            minorChance *= multiplier;
            majorChance *= multiplier;
        }

        // High happiness reduces disease chance
        if (nation.happiness > 70) {
            const reduction = ((nation.happiness - 70) / 30) * this.config.happinessReduction;
            minorChance *= (1 - reduction);
            majorChance *= (1 - reduction);
        }

        // Check for minor outbreak
        if (Math.random() < minorChance) {
            const disease = this.getRandomDisease('minor', 'national');
            if (disease) {
                this.startOutbreak(nationId, disease.id, 'minor');
            }
        }

        // Check for major outbreak
        if (Math.random() < majorChance) {
            const disease = this.getRandomDisease('major', 'national');
            if (disease) {
                this.startOutbreak(nationId, disease.id, 'major');
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

    // Global disease events
    triggerGlobalEvent() {
        const globalDisease = this.getRandomDisease(null, 'global');
        if (!globalDisease) return;

        const nations = window.gameEngine?.getAllPlayers() || [];
        const affectedNations = nations.filter(() => Math.random() < 0.7); // 70% of nations affected

        affectedNations.forEach(nation => {
            this.startOutbreak(nation.id, globalDisease.id, globalDisease.severity);
        });

        console.log(`Global disease event: ${globalDisease.name} affecting ${affectedNations.length} nations`);
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