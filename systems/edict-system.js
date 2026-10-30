/**
 * Edict System - Nation-Wide Policy Decrees
 * Dominion Wars - Nation Building Strategy Game
 *
 * Edicts are nation-wide policies that affect population, economy, crime,
 * disease, literacy, military, research, taxation, land/infra costs, and more.
 * Each edict category has 3 stances with specific effects. Edicts can only be
 * changed once every 30 game days to prevent abuse. Changing sexual orientation
 * or marriage limits triggers a 30-day, 50% happiness penalty for affected
 * citizens. Players get 1 free pass when first unlocking edicts.
 */

const EDICT_COOLDOWN_DAYS = 30;

// Dangerous edict categories that trigger happiness penalty when changed
const DANGEROUS_EDICT_CATEGORIES = ['sexualOrientation', 'marriageLimits'];

const EDICT_CATEGORIES = {
    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // 1. POPULATION SEXUAL ORIENTATION
    // ══════════════════════════════════════════════════════════════════════════════════════════════
    sexualOrientation: {
        name: 'Population Sexual Orientation',
        description: 'Determines which sexual orientations are allowed in the nation.',
        stances: {
            straight: {
                name: 'Straight Only',
                description: 'Only heterosexual relationships allowed. Higher population growth.',
                effects: {
                    birthRateModifier: 0.10,
                    happinessModifier: 0,
                    crimeModifier: 0,
                    relationshipRestriction: 'straightOnly'
                }
            },
            gay: {
                name: 'Gay Only',
                description: 'Only homosexual relationships allowed. +15 Happiness, -15 Crime, very low population growth.',
                effects: {
                    birthRateModifier: -0.75,
                    happinessModifier: 15,
                    crimeModifier: -15,
                    relationshipRestriction: 'gayOnly'
                }
            },
            noPreference: {
                name: 'No Preference',
                description: 'Both straight and gay relationships allowed. Balanced population growth.',
                effects: {
                    birthRateModifier: 0,
                    happinessModifier: 0,
                    crimeModifier: 0,
                    relationshipRestriction: 'none'
                }
            }
        }
    },

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // 2. MARRIAGE LIMITS
    // ══════════════════════════════════════════════════════════════════════════════════════════════
    marriageLimits: {
        name: 'Marriage Limits',
        description: 'Determines how many spouses a citizen can have.',
        stances: {
            two: {
                name: 'Monogamy (2)',
                description: 'Only 2 spouses allowed per marriage.',
                effects: {
                    maxSpouses: 2,
                    happinessModifier: 0
                }
            },
            three: {
                name: 'Limited Polygamy (3)',
                description: '2 or 3 spouses allowed per marriage.',
                effects: {
                    maxSpouses: 3,
                    happinessModifier: 0
                }
            },
            four: {
                name: 'Full Polygamy (4)',
                description: '2, 3, or 4 spouses allowed per marriage.',
                effects: {
                    maxSpouses: 4,
                    happinessModifier: 0
                }
            }
        }
    },

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // 3. POLICE STANCE
    // ══════════════════════════════════════════════════════════════════════════════════════════════
    policeStance: {
        name: 'Police Stance',
        description: 'Determines how aggressively police patrol and handle criminals.',
        stances: {
            pacifist: {
                name: 'Pacifist',
                description: 'Police hardly ever on patrol. +10 Happiness, +20 Crime, criminals rarely killed.',
                effects: {
                    happinessModifier: 10,
                    crimeModifier: 20,
                    criminalKillChance: 0,
                    criminalBecomeExChance: 0.1,
                    exCriminalReoffendChance: 0.4
                }
            },
            enforced: {
                name: 'Enforced',
                description: 'Police patrol regularly. No happiness or crime change, low criminal kill chance.',
                effects: {
                    happinessModifier: 0,
                    crimeModifier: 0,
                    criminalKillChance: 0.05,
                    criminalBecomeExChance: 0.15,
                    exCriminalReoffendChance: 0.3
                }
            },
            lethal: {
                name: 'Lethal',
                description: 'Police patrol heavily. -10 Happiness, -30 Crime, high criminal kill chance.',
                effects: {
                    happinessModifier: -10,
                    crimeModifier: -30,
                    criminalKillChance: 0.25,
                    criminalBecomeExChance: 0.2,
                    exCriminalReoffendChance: 0.2
                }
            }
        }
    },

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // 4. CRIMINAL REFORM
    // ══════════════════════════════════════════════════════════════════════════════════════════════
    criminalReform: {
        name: 'Criminal Reform',
        description: 'Determines how criminals are rehabilitated and at what cost.',
        stances: {
            none: {
                name: 'None',
                description: 'No cost. No reform, no reoffend chance changes.',
                effects: {
                    costPerCriminal: 0,
                    criminalBecomeExChance: 0,
                    exCriminalReoffendChance: 0
                }
            },
            relaxed: {
                name: 'Relaxed',
                description: 'Cost: 0.000005% of revenue per criminal. Medium reform, medium reoffend.',
                effects: {
                    costPerCriminal: 0.000005,
                    criminalBecomeExChance: 0.3,
                    exCriminalReoffendChance: 0.4
                }
            },
            strong: {
                name: 'Strong',
                description: 'Cost: 0.0000132% of revenue per criminal. Very high reform, very low reoffend.',
                effects: {
                    costPerCriminal: 0.0000132,
                    criminalBecomeExChance: 0.7,
                    exCriminalReoffendChance: 0.1
                }
            }
        }
    },

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // 5. IMMIGRATION
    // ══════════════════════════════════════════════════════════════════════════════════════════════
    immigration: {
        name: 'Immigration Policy',
        description: 'Determines how open the nation is to immigrants.',
        stances: {
            closed: {
                name: 'Closed Borders',
                description: 'No immigration gained.',
                effects: {
                    immigrationModifier: 0
                }
            },
            selective: {
                name: 'Selective',
                description: 'Small immigration gain boost.',
                effects: {
                    immigrationModifier: 0.05
                }
            },
            open: {
                name: 'Open Borders',
                description: 'High immigration gain boost.',
                effects: {
                    immigrationModifier: 0.15
                }
            }
        }
    },

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // 6. EDUCATION
    // ══════════════════════════════════════════════════════════════════════════════════════════════
    education: {
        name: 'Education Policy',
        description: 'Determines how education is funded and literacy gains for youth.',
        stances: {
            private: {
                name: 'Private',
                description: 'No cost. -10 Happiness, no literacy gain boost.',
                effects: {
                    costPerToddler: 0,
                    costPerChild: 0,
                    happinessModifier: -10,
                    literacyBoostToddler: 0,
                    literacyBoostChild: 0
                }
            },
            selective: {
                name: 'Selective',
                description: 'Cost: 0.000000388% of revenue per Toddler/Child. +20% literacy boost.',
                effects: {
                    costPerToddler: 0.000000388,
                    costPerChild: 0.000000388,
                    happinessModifier: 0,
                    literacyBoostToddler: 0.20,
                    literacyBoostChild: 0.20
                }
            },
            public: {
                name: 'Public',
                description: 'Cost: 0.00000388% of revenue per Toddler/Child. +10 Happiness, +50% literacy boost.',
                effects: {
                    costPerToddler: 0.00000388,
                    costPerChild: 0.00000388,
                    happinessModifier: 10,
                    literacyBoostToddler: 0.50,
                    literacyBoostChild: 0.50
                }
            }
        }
    },

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // 7. HEALTHCARE
    // ══════════════════════════════════════════════════════════════════════════════════════════════
    healthcare: {
        name: 'Healthcare Policy',
        description: 'Determines how healthcare is funded and disease control.',
        stances: {
            private: {
                name: 'Private',
                description: 'No cost. No disease change or nation disease spawn change.',
                effects: {
                    costPerNewborn: 0,
                    diseaseModifier: 0,
                    diseaseSpawnReduction: 0
                }
            },
            selective: {
                name: 'Selective',
                description: 'Cost: 0.00000066% of revenue per population. -10 disease, 10% less disease spawn chance.',
                effects: {
                    costPerPopulation: 0.00000066,
                    diseaseModifier: -10,
                    diseaseSpawnReduction: 0.10
                }
            },
            national: {
                name: 'National Healthcare',
                description: 'Cost: 0.000000659% of revenue per Newborn/demographic. -20 disease, 33% less disease spawn chance.',
                effects: {
                    costPerNewborn: 0.000000659,
                    costPerDemographic: 0.000000659,
                    diseaseModifier: -20,
                    diseaseSpawnReduction: 0.33
                }
            }
        }
    },

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // 8. ENVIRONMENT
    // ══════════════════════════════════════════════════════════════════════════════════════════════
    environment: {
        name: 'Environment Policy',
        description: 'Determines pollution controls and infrastructure upkeep costs.',
        stances: {
            open: {
                name: 'Open Pollution',
                description: 'No cost. +20% Pollution, -10 Environment.',
                effects: {
                    pollutionModifier: 0.20,
                    environmentModifier: -10,
                    upkeepModifier: 0
                }
            },
            reduced: {
                name: 'Reduced Pollution',
                description: '5% increase to Infra and Improvement upkeeps. No pollution or environment penalties.',
                effects: {
                    pollutionModifier: 0,
                    environmentModifier: 0,
                    upkeepModifier: 0.05
                }
            },
            clean: {
                name: 'Actively Clean',
                description: '10% increase to Infra and Improvement upkeeps. -20% Pollution, +10 Environment.',
                effects: {
                    pollutionModifier: -0.20,
                    environmentModifier: 10,
                    upkeepModifier: 0.10
                }
            }
        }
    },

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // 9. MILITARY POSTURE
    // ══════════════════════════════════════════════════════════════════════════════════════════════
    military: {
        name: 'Military Posture',
        description: 'Determines military unit effectiveness and upkeep costs.',
        stances: {
            leave: {
                name: 'On Leave',
                description: '-10% All Military Unit Effectiveness, -10% Unit Upkeep.',
                effects: {
                    unitEffectivenessModifier: -0.10,
                    unitUpkeepModifier: -0.10
                }
            },
            ready: {
                name: 'At Ready',
                description: 'No change to military unit effectiveness or upkeep.',
                effects: {
                    unitEffectivenessModifier: 0,
                    unitUpkeepModifier: 0
                }
            },
            alert: {
                name: 'High Alert',
                description: '+10% All Military Unit Effectiveness, +10% Unit Upkeep.',
                effects: {
                    unitEffectivenessModifier: 0.10,
                    unitUpkeepModifier: 0.10
                }
            }
        }
    },

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // 10. TAXATION
    // ══════════════════════════════════════════════════════════════════════════════════════════════
    taxation: {
        name: 'Taxation Policy',
        description: 'Determines tariffs and effective taxation rate.',
        stances: {
            heavy: {
                name: 'Heavy Tariffs',
                description: '-15 Happiness, +15% taxation rate (25% -> 28.75%).',
                effects: {
                    happinessModifier: -15,
                    taxRateModifier: 0.15
                }
            },
            normal: {
                name: 'Normal Tariffs',
                description: 'No change to Happiness or taxation rate.',
                effects: {
                    happinessModifier: 0,
                    taxRateModifier: 0
                }
            },
            light: {
                name: 'Light Tariffs',
                description: '+15 Happiness, -15% taxation rate (25% -> 21.25%).',
                effects: {
                    happinessModifier: 15,
                    taxRateModifier: -0.15
                }
            }
        }
    },

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // 11. LAND ACQUISITION POLICY
    // ══════════════════════════════════════════════════════════════════════════════════════════════
    landAcquisition: {
        name: 'Land Acquisition Policy',
        description: 'Determines whether land or infrastructure is cheaper to purchase.',
        stances: {
            cheapLand: {
                name: 'Cheap Land / Expensive Infra',
                description: 'Reduces Land Cost by 30%, increases Infrastructure Cost by 30%.',
                effects: {
                    landCostModifier: -0.30,
                    infraCostModifier: 0.30
                }
            },
            balanced: {
                name: 'Balanced',
                description: 'Standard costs for land and infrastructure.',
                effects: {
                    landCostModifier: 0,
                    infraCostModifier: 0
                }
            },
            cheapInfra: {
                name: 'Expensive Land / Cheap Infra',
                description: 'Increases Land Cost by 30%, reduces Infrastructure Cost by 30%.',
                effects: {
                    landCostModifier: 0.30,
                    infraCostModifier: -0.30
                }
            }
        }
    },

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // 12. MILITARY PROCUREMENT POLICY
    // ══════════════════════════════════════════════════════════════════════════════════════════════
    militaryProcurement: {
        name: 'Military Procurement Policy',
        description: 'Determines military unit purchase cost vs upkeep cost trade-off.',
        stances: {
            cheapUnits: {
                name: 'Cheap Units / High Upkeep',
                description: '-30% Unit Purchase Cost, +30% Unit Upkeep Cost.',
                effects: {
                    militaryCostModifier: -0.30,
                    militaryUpkeepModifier: 0.30
                }
            },
            standard: {
                name: 'Standard Procurement',
                description: 'No change to unit purchase or upkeep costs.',
                effects: {
                    militaryCostModifier: 0,
                    militaryUpkeepModifier: 0
                }
            },
            expensiveUnits: {
                name: 'Expensive Units / Low Upkeep',
                description: '-15% Unit Purchase Cost, +15% Unit Upkeep Cost.',
                effects: {
                    militaryCostModifier: -0.15,
                    militaryUpkeepModifier: 0.15
                }
            }
        }
    },

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // 13. GAMBLING POLICY
    // ══════════════════════════════════════════════════════════════════════════════════════════════
    gambling: {
        name: 'Gambling Policy',
        description: 'Determines legality and regulation of casinos and betting.',
        stances: {
            prohibited: {
                name: 'Prohibited',
                description: 'Ban all gambling. No casino revenue, less crime.',
                effects: {
                    happinessModifier: -5,
                    crimeModifier: -10
                }
            },
            regulated: {
                name: 'Regulated',
                description: 'Licensed casinos. Balanced revenue and social impact.',
                effects: {
                    happinessModifier: 0,
                    crimeModifier: 0
                }
            },
            open: {
                name: 'Open Gambling',
                description: 'Gambling encouraged. High revenue, more crime.',
                effects: {
                    happinessModifier: 10,
                    crimeModifier: 15
                }
            }
        }
    },

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // 14. CENSORSHIP POLICY
    // ══════════════════════════════════════════════════════════════════════════════════════════════
    censorship: {
        name: 'Censorship Policy',
        description: 'Controls information flow and public expression.',
        stances: {
            freeSpeech: {
                name: 'Free Speech',
                description: '+5 Happiness, +30 Crime, +10% Immigration (if allowed).',
                effects: {
                    happinessModifier: 5,
                    crimeModifier: 30,
                    immigrationModifier: 0.10
                }
            },
            slightlyCensored: {
                name: 'Slightly Censored',
                description: 'No change to Happiness, Crime, or Immigration.',
                effects: {
                    happinessModifier: 0,
                    crimeModifier: 0,
                    immigrationModifier: 0
                }
            },
            highlyCensored: {
                name: 'Highly Censored',
                description: '-5 Happiness, +30 Crime, -10% Immigration (if allowed).',
                effects: {
                    happinessModifier: -5,
                    crimeModifier: 30,
                    immigrationModifier: -0.10
                }
            }
        }
    },

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // 15. LABOR LAWS
    // ══════════════════════════════════════════════════════════════════════════════════════════════
    laborLaws: {
        name: 'Labor Laws',
        description: 'Determines working hours, pay, and citizen happiness.',
        stances: {
            extendedShifts: {
                name: 'Extended Shifts',
                description: '+15% citizen job income but -15 Happiness.',
                effects: {
                    citizenIncomeModifier: 0.15,
                    happinessModifier: -15
                }
            },
            nineToFive: {
                name: '9-5 Standard',
                description: 'No change to citizen job income or Happiness.',
                effects: {
                    citizenIncomeModifier: 0,
                    happinessModifier: 0
                }
            },
            halfWeeks: {
                name: 'Half Weeks',
                description: '-15% citizen job income but +15 Happiness.',
                effects: {
                    citizenIncomeModifier: -0.15,
                    happinessModifier: 15
                }
            }
        }
    }
};

// Default edicts for a new nation (balanced starting state)
const DEFAULT_EDICTS = {
    sexualOrientation: 'noPreference',
    marriageLimits: 'two',
    policeStance: 'pacifist',
    criminalReform: 'none',
    immigration: 'closed',
    education: 'private',
    healthcare: 'private',
    environment: 'open',
    military: 'ready',
    taxation: 'normal',
    landAcquisition: 'balanced',
    militaryProcurement: 'standard',
    gambling: 'regulated',
    censorship: 'slightlyCensored',
    laborLaws: 'nineToFive'
};

class EdictSystem {
    constructor() {
        this.isInitialized = false;
        this.categories = EDICT_CATEGORIES;
    }

    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log('Edict System initialized');
    }

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // EDICT STATE MANAGEMENT
    // ═════════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Initialize edicts for a new nation
     */
    initializeNationEdicts(nation) {
        if (!nation.edicts) {
            nation.edicts = { ...DEFAULT_EDICTS };
        }
        if (!nation.edictChangeDates) {
            nation.edictChangeDates = {};
            Object.keys(EDICT_CATEGORIES).forEach(cat => {
                nation.edictChangeDates[cat] = 0; // 0 = can change immediately
            });
        }
        if (nation.edictFreePassUsed === undefined) {
            nation.edictFreePassUsed = false;
        }
        // ── EDICT UNLOCK SYSTEM ──
        // All edicts start locked. Effects only apply once unlocked.
        if (!nation.edictUnlocked) {
            nation.edictUnlocked = {};
            Object.keys(EDICT_CATEGORIES).forEach(cat => {
                nation.edictUnlocked[cat] = false;
            });
        }
    }

    /**
     * Get the current stance for an edict category
     */
    getEdict(nation, category) {
        if (!nation.edicts) return null;
        return nation.edicts[category] || null;
    }

    /**
     * Get the full edict definition (category + stance + effects)
     */
    getEdictDefinition(category, stance) {
        const cat = EDICT_CATEGORIES[category];
        if (!cat) return null;
        return cat.stances[stance] || null;
    }

    /**
     * Get all current edicts with their full definitions
     */
    getAllEdicts(nation) {
        const result = {};
        if (!nation.edicts) return result;
        Object.keys(nation.edicts).forEach(cat => {
            const stance = nation.edicts[cat];
            const def = this.getEdictDefinition(cat, stance);
            result[cat] = { stance, definition: def };
        });
        return result;
    }

    /**
     * Check if an edict can be changed (30-day cooldown)
     * Free pass only applies to dangerous changes (sexual orientation, marriage limits)
     */
    canChangeEdict(nation, category, currentDay) {
        if (!nation.edictChangeDates) return true;
        const lastChange = nation.edictChangeDates[category] || 0;
        if (lastChange === 0) return true; // Never changed, can change
        // Free pass only bypasses cooldown for dangerous changes
        if (!nation.edictFreePassUsed && DANGEROUS_EDICT_CATEGORIES.includes(category)) return true;
        return currentDay - lastChange >= EDICT_COOLDOWN_DAYS;
    }

    /**
     * Get days remaining until edict can be changed
     */
    getDaysUntilEdictChange(nation, category, currentDay) {
        if (!nation.edictChangeDates) return 0;
        const lastChange = nation.edictChangeDates[category] || 0;
        if (lastChange === 0) return 0;
        if (!nation.edictFreePassUsed && DANGEROUS_EDICT_CATEGORIES.includes(category)) return 0;
        const daysPassed = currentDay - lastChange;
        return Math.max(0, EDICT_COOLDOWN_DAYS - daysPassed);
    }

    /**
     * Change an edict stance
     * Returns { success, message, happinessPenaltyDays, freePassUsed }
     */
    changeEdict(nation, category, newStance, currentDay) {
        if (!nation.edicts) nation.edicts = {};
        if (!nation.edictChangeDates) nation.edictChangeDates = {};
        if (nation.edictFreePassUsed === undefined) nation.edictFreePassUsed = false;

        // Validate category exists
        const catDef = EDICT_CATEGORIES[category];
        if (!catDef) {
            return {
                success: false,
                message: `Unknown edict category '${category}'`
            };
        }

        // Validate stance exists for this category
        const stanceDef = catDef.stances[newStance];
        if (!stanceDef) {
            return {
                success: false,
                message: `Unknown stance '${newStance}' for edict '${category}'`
            };
        }

        // Prevent changing locked edicts - must unlock first
        if (nation.edictUnlocked && nation.edictUnlocked[category] === false) {
            return {
                success: false,
                message: `Edict '${category}' is locked. Unlock it before changing stance.`
            };
        }

        const currentStance = nation.edicts[category];
        if (currentStance === newStance) {
            return { success: false, message: 'Edict is already set to this stance' };
        }

        // Check cooldown
        if (!this.canChangeEdict(nation, category, currentDay)) {
            const daysLeft = this.getDaysUntilEdictChange(nation, category, currentDay);
            return {
                success: false,
                message: `Edict cooldown active. ${daysLeft} days remaining until change allowed.`
            };
        }

        // Check if this is a "dangerous" change (sexual orientation or marriage limits)
        const isDangerousChange = DANGEROUS_EDICT_CATEGORIES.includes(category);

        let happinessPenaltyDays = 0;
        let freePassUsed = nation.edictFreePassUsed;

        if (isDangerousChange && !freePassUsed) {
            // Use free pass - no penalty
            freePassUsed = true;
            nation.edictFreePassUsed = true;
        } else if (isDangerousChange) {
            // Apply 30-day, 50% happiness penalty
            happinessPenaltyDays = 30;
        }

        // Apply the change
        nation.edicts[category] = newStance;
        nation.edictChangeDates[category] = currentDay;
        nation.edictFreePassUsed = freePassUsed;

        // Apply immediate effects
        this.applyEdictEffects(nation);

        return {
            success: true,
            message: `Edict '${category}' changed to '${newStance}'`,
            happinessPenaltyDays,
            freePassUsed: freePassUsed && isDangerousChange
        };
    }

    /**
     * Unlock an edict category so its effects can apply.
     * Returns { success, message, alreadyUnlocked }
     */
    unlockEdict(nation, category) {
        if (!nation.edicts) nation.edicts = {};
        if (!nation.edictUnlocked) nation.edictUnlocked = {};

        // Initialize if needed
        if (nation.edictUnlocked[category] === undefined) {
            nation.edictUnlocked[category] = false;
        }

        if (nation.edictUnlocked[category]) {
            return {
                success: false,
                message: `Edict '${category}' is already unlocked`,
                alreadyUnlocked: true
            };
        }

        nation.edictUnlocked[category] = true;

        // Apply effects immediately since the edict now has a stance set
        this.applyEdictEffects(nation);

        return {
            success: true,
            message: `Edict '${category}' unlocked. Effects are now active.`,
            alreadyUnlocked: false
        };
    }

    /**
     * Check if an edict category is unlocked
     */
    isEdictUnlocked(nation, category) {
        if (!nation.edictUnlocked) return false;
        return nation.edictUnlocked[category] === true;
    }

    /**
     * Get all unlocked edict categories
     */
    getUnlockedEdicts(nation) {
        if (!nation.edictUnlocked) return [];
        return Object.keys(nation.edictUnlocked).filter(cat => nation.edictUnlocked[cat]);
    }

    /**
     * Get all locked edict categories
     */
    getLockedEdicts(nation) {
        if (!nation.edictUnlocked) return Object.keys(EDICT_CATEGORIES);
        return Object.keys(EDICT_CATEGORIES).filter(cat => !nation.edictUnlocked[cat]);
    }

    // ═════════════════════════════════════════════════════════════════════════════════════════════
    // EDICT EFFECT APPLICATION
    // ══════════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Apply all edict effects to the nation
     * Only applies effects from unlocked edicts
     */
    applyEdictEffects(nation) {
        if (!nation.edicts) return;

        // Reset edict-derived effects
        nation.edictEffects = {
            birthRateModifier: 0,
            happinessModifier: 0,
            crimeModifier: 0,
            pollutionModifier: 0,
            environmentModifier: 0,
            diseaseModifier: 0,
            diseaseSpawnReduction: 0,
            literacyBoostToddler: 0,
            literacyBoostChild: 0,
            taxRateModifier: 0,
            militaryEffectivenessModifier: 0,
            militaryUpkeepModifier: 0,
            militaryCostModifier: 0,
            infrastructureUpkeepModifier: 0,
            improvementUpkeepModifier: 0,
            immigrationModifier: 0,
            maxSpouses: 2,
            criminalKillChance: 0.05,
            criminalBecomeExChance: 0.15,
            exCriminalReoffendChance: 0.3,
            relationshipRestriction: 'none',
            landCostModifier: 0,
            infraCostModifier: 0,
            citizenIncomeModifier: 0,
            censorshipHappinessModifier: 0,
            censorshipCrimeModifier: 0,
            censorshipImmigrationModifier: 0
        };

        Object.keys(nation.edicts).forEach(category => {
            // Skip locked edicts - their effects do not apply until unlocked
            if (!nation.edictUnlocked || !nation.edictUnlocked[category]) return;

            const stance = nation.edicts[category];
            const def = this.getEdictDefinition(category, stance);
            if (!def || !def.effects) return;

            const e = def.effects;
            const ed = nation.edictEffects;

            // Accumulate modifiers
            if (e.birthRateModifier !== undefined) ed.birthRateModifier += e.birthRateModifier;
            if (e.happinessModifier !== undefined) ed.happinessModifier += e.happinessModifier;
            if (e.crimeModifier !== undefined) ed.crimeModifier += e.crimeModifier;
            if (e.pollutionModifier !== undefined) ed.pollutionModifier += e.pollutionModifier;
            if (e.environmentModifier !== undefined) ed.environmentModifier += e.environmentModifier;
            if (e.diseaseModifier !== undefined) ed.diseaseModifier += e.diseaseModifier;
            if (e.diseaseSpawnReduction !== undefined) ed.diseaseSpawnReduction = Math.max(ed.diseaseSpawnReduction, e.diseaseSpawnReduction);
            if (e.literacyBoostToddler !== undefined) ed.literacyBoostToddler = Math.max(ed.literacyBoostToddler, e.literacyBoostToddler);
            if (e.literacyBoostChild !== undefined) ed.literacyBoostChild = Math.max(ed.literacyBoostChild, e.literacyBoostChild);
            if (e.taxRateModifier !== undefined) ed.taxRateModifier += e.taxRateModifier;
            if (e.unitEffectivenessModifier !== undefined) ed.militaryEffectivenessModifier += e.unitEffectivenessModifier;
            if (e.unitUpkeepModifier !== undefined) ed.militaryUpkeepModifier += e.unitUpkeepModifier;
            if (e.militaryCostModifier !== undefined) ed.militaryCostModifier += e.militaryCostModifier;
            if (e.upkeepModifier !== undefined) {
                ed.infrastructureUpkeepModifier += e.upkeepModifier;
                ed.improvementUpkeepModifier += e.upkeepModifier;
            }
            if (e.immigrationModifier !== undefined) ed.immigrationModifier += e.immigrationModifier;
            if (e.maxSpouses !== undefined) ed.maxSpouses = Math.max(ed.maxSpouses, e.maxSpouses);
            if (e.criminalKillChance !== undefined) ed.criminalKillChance = Math.max(ed.criminalKillChance, e.criminalKillChance);
            if (e.criminalBecomeExChance !== undefined) ed.criminalBecomeExChance = Math.max(ed.criminalBecomeExChance, e.criminalBecomeExChance);
            if (e.exCriminalReoffendChance !== undefined) ed.exCriminalReoffendChance = Math.max(ed.exCriminalReoffendChance, e.exCriminalReoffendChance);
            if (e.relationshipRestriction !== undefined) ed.relationshipRestriction = e.relationshipRestriction;
            if (e.landCostModifier !== undefined) ed.landCostModifier += e.landCostModifier;
            if (e.infraCostModifier !== undefined) ed.infraCostModifier += e.infraCostModifier;
            if (e.citizenIncomeModifier !== undefined) ed.citizenIncomeModifier += e.citizenIncomeModifier;
            if (e.censorshipHappinessModifier !== undefined) ed.censorshipHappinessModifier += e.censorshipHappinessModifier;
            if (e.censorshipCrimeModifier !== undefined) ed.censorshipCrimeModifier += e.censorshipCrimeModifier;
            if (e.censorshipImmigrationModifier !== undefined) ed.censorshipImmigrationModifier += e.censorshipImmigrationModifier;
        });
    }

    // ══════════════════════════════════════════════════════════════════════════════════════════════
    // COST CALCULATIONS
    // ═════════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Calculate total edict cost for the current turn
     * Returns { totalCost, breakdown: { category: cost } }
     *
     * Cost caps (99.99% = 0.9999 of revenue):
     * - Criminal Reform: individually capped at 99.99% of revenue
     * - Education: individually capped at 99.99% of revenue
     * - Healthcare: individually capped at 99.99% of revenue
     * - Combined: all three together capped at 99.99% of revenue
     * This ensures the nation always retains at least 0.01% of revenue after edict costs.
     */
    calculateEdictCosts(nation, nationStats, populationBreakdown) {
        if (!nation.edicts) return { totalCost: 0, breakdown: {} };

        const revenue = nation.taxRevenue || nation.money || 0;
        const MAX_CAP = 0.9999; // 99.99% cap — nation keeps at least 0.01%
        const breakdown = {};
        let totalCost = 0;

        // ── Criminal Reform cost (capped individually at 99.99% of revenue) ──
        const crimStance = nation.edicts.criminalReform;
        const crimDef = this.getEdictDefinition('criminalReform', crimStance);
        let crimCost = 0;
        // Skip cost if edict is locked - no effect is active
        if (!this.isEdictUnlocked(nation, 'criminalReform')) {
            crimCost = 0;
        } else if (crimDef && crimDef.effects.costPerCriminal > 0) {
            const criminalCount = nationStats?.criminalCount || 0;
            crimCost = revenue * (crimDef.effects.costPerCriminal / 100) * criminalCount;
            crimCost = Math.min(crimCost, revenue * MAX_CAP);
        }
        breakdown.criminalReform = Math.floor(crimCost);
        totalCost += crimCost;

        // ── Education cost (capped individually at 99.99% of revenue) ──
        const eduStance = nation.edicts.education;
        const eduDef = this.getEdictDefinition('education', eduStance);
        let eduCost = 0;
        // Skip cost if edict is locked - no effect is active
        if (!this.isEdictUnlocked(nation, 'education')) {
            eduCost = 0;
        } else if (eduDef && eduDef.effects) {
            const toddlerCount = populationBreakdown?.toddlerCount || 0;
            const childCount = populationBreakdown?.childCount || 0;
            eduCost = revenue * (
                (eduDef.effects.costPerToddler || 0) / 100 * toddlerCount +
                (eduDef.effects.costPerChild || 0) / 100 * childCount
            );
            eduCost = Math.min(eduCost, revenue * MAX_CAP);
        }
        breakdown.education = Math.floor(eduCost);
        totalCost += eduCost;

        // ── Healthcare cost (capped individually at 99.99% of revenue) ──
        const healthStance = nation.edicts.healthcare;
        const healthDef = this.getEdictDefinition('healthcare', healthStance);
        let healthCost = 0;
        // Skip cost if edict is locked - no effect is active
        if (!this.isEdictUnlocked(nation, 'healthcare')) {
            healthCost = 0;
        } else if (healthDef && healthDef.effects) {
            if (healthDef.effects.costPerPopulation > 0) {
                const popCount = nationStats?.population || 0;
                healthCost += revenue * (healthDef.effects.costPerPopulation / 100) * popCount;
            }
            if (healthDef.effects.costPerNewborn > 0) {
                const newbornCount = populationBreakdown?.newbornCount || 0;
                healthCost += revenue * (healthDef.effects.costPerNewborn / 100) * newbornCount;
            }
            if (healthDef.effects.costPerDemographic > 0) {
                const demographicCount = populationBreakdown?.totalDemographics || 0;
                healthCost += revenue * (healthDef.effects.costPerDemographic / 100) * demographicCount;
            }
            healthCost = Math.min(healthCost, revenue * MAX_CAP);
        }
        breakdown.healthcare = Math.floor(healthCost);
        totalCost += healthCost;

        // ── COMBINED CAP: all three edict costs together capped at 99.99% of revenue ──
        const combinedCap = revenue * MAX_CAP;
        if (totalCost > combinedCap) {
            const ratio = combinedCap / totalCost;
            breakdown.criminalReform = Math.floor((breakdown.criminalReform || 0) * ratio);
            breakdown.education = Math.floor((breakdown.education || 0) * ratio);
            breakdown.healthcare = Math.floor((breakdown.healthcare || 0) * ratio);
            totalCost = combinedCap;
        } else {
            breakdown.criminalReform = Math.floor(breakdown.criminalReform || 0);
            breakdown.education = Math.floor(breakdown.education || 0);
            breakdown.healthcare = Math.floor(breakdown.healthcare || 0);
            totalCost = Math.floor(totalCost);
        }

        return { totalCost, breakdown };
    }

    // ═════════════════════════════════════════════════════════════════════════════════════════════
    // HAPPINESS PENALTY TRACKING
    // ══════════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Apply happiness penalty to citizens affected by edict change
     * Called when sexual orientation or marriage limits change
     */
    applyEdictHappinessPenalty(citizens, penaltyDays = 30) {
        const now = Date.now();
        const penaltyEnd = now + (penaltyDays * 24 * 60 * 60 * 1000);

        for (const citizen of citizens) {
            if (!citizen.isAlive) continue;
            // 50% happiness penalty
            citizen.happiness = Math.max(0, citizen.happiness * 0.5);
            citizen.happinessPenaltyEnd = penaltyEnd;
            citizen.lifeEvents.push({
                id: now,
                timestamp: now,
                age: citizen.age,
                description: 'Edict change happiness penalty (-50% happiness)',
                type: 'edictPenalty'
            });
            if (citizen.lifeEvents.length > 20) citizen.lifeEvents = citizen.lifeEvents.slice(-20);
        }
    }

    /**
     * Check if a citizen's happiness penalty has expired
     */
    isEdictHappinessPenaltyExpired(citizen, currentDay) {
        if (!citizen.happinessPenaltyEnd) return true;
        return Date.now() > citizen.happinessPenaltyEnd;
    }

    destroy() {
        this.isInitialized = false;
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.EdictSystem = new EdictSystem();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EdictSystem, EDICT_CATEGORIES, DEFAULT_EDICTS, DANGEROUS_EDICT_CATEGORIES };
}
