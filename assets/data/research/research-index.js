/**
 * Research Index - Central registry for all research branches
 * Loads and manages all research categories
 */

// Import all research branches
// In Node.js we require; in the browser the individual files already set window.* globals,
// so we just read those — but we must NOT redeclare with let/const because the globals
// were already declared as `const` by the loaded scripts (same global scope).
var _EconomyResearch, _HealthcareResearch, _WarResearch;

// Handle different module systems
if (typeof require !== 'undefined' && typeof module !== 'undefined') {
    // Node.js environment
    _EconomyResearch = require('./economy-research');
    _HealthcareResearch = require('./healthcare-research');
    _WarResearch = require('./war-research');
} else if (typeof window !== 'undefined') {
    // Browser environment - the individual research scripts must be loaded first.
    // They each set their own window.* global.
    _EconomyResearch = window.EconomyResearch;
    _HealthcareResearch = window.HealthcareResearch;
    _WarResearch = window.WarResearch;
}

// Alias to shorter names for use below
var EconomyResearchData = _EconomyResearch;
var HealthcareResearchData = _HealthcareResearch;
var WarResearchData = _WarResearch;

/**
 * Complete research database combining all branches
 */
const ResearchDatabase = {
    // Categories metadata
    categories: {
        economy: {
            name: 'Economy',
            description: 'Financial systems, trade, and economic development',
            icon: '💰',
            color: '#4CAF50'
        },
        healthcare: {
            name: 'Healthcare',
            description: 'Medical knowledge, public health, and disease management',
            icon: '🏥',
            color: '#2196F3'
        },
        war: {
            name: 'Military',
            description: 'Military technology, tactics, and warfare evolution',
            icon: '⚔️',
            color: '#F44336'
        }
    },

    // Tech level progression guide
    techLevels: {
        1: { description: 'Basic tools, primitive weapons, early medicine, simple trade systems' },
        2: { description: 'Metal tools, basic fortifications, organized taxation, classical medicine' },
        3: { description: 'Iron weaponry, defensive walls, banking systems, surgical techniques' },
        4: { description: 'Steel weapons, siege engines, commercial law, Renaissance medicine' },
        5: { description: 'Professional armies, castles, stock exchanges, industrial medicine' },
        6: { description: 'Gunpowder weapons, central banking, vaccines, modern surgery' },
        7: { description: 'Artillery, monetary policy, medical radiology, small arms' },
        8: { description: 'Rifles, econometrics, organ transplants, industrial logistics' },
        9: { description: 'Breech-loading, behavioral economics, MRI imaging, explosive shells' },
        10: { description: 'Machine guns, quantitative trading, stem cell therapy, chemical warfare' },
        11: { description: 'Nuclear weapons, cryptocurrency, organ regeneration, jet aircraft' },
        12: { description: 'Quantum finance, post-scarcity economics, consciousness medicine, cyber warfare' }
    },

    // Combined research data
    research: {},

    /**
     * Initialize the research database
     */
    initialize() {
        console.log('Initializing Research Database...');
        
        // Combine all research branches
        this.research = {
            ...EconomyResearchData,
            ...HealthcareResearchData,
            ...WarResearchData
        };

        // Validate research data
        this.validateResearchData();

        console.log(`Research Database initialized with ${Object.keys(this.research).length} research items across ${Object.keys(this.categories).length} categories`);
        
        return this.research;
    },

    /**
     * Validate research data integrity
     */
    validateResearchData() {
        const errors = [];
        const warnings = [];

        Object.entries(this.research).forEach(([id, research]) => {
            // Check required fields
            if (!research.name) errors.push(`Research ${id} missing name`);
            if (!research.category) errors.push(`Research ${id} missing category`);
            if (!research.tier) errors.push(`Research ${id} missing tier`);
            if (!research.description) warnings.push(`Research ${id} missing description`);
            if (!research.requirements) errors.push(`Research ${id} missing requirements`);
            if (!research.cost) errors.push(`Research ${id} missing cost`);
            if (!research.effects) warnings.push(`Research ${id} missing effects`);

            // Check category validity
            if (research.category && !this.categories[research.category]) {
                errors.push(`Research ${id} has invalid category: ${research.category}`);
            }

            // Check tier range
            if (research.tier && (research.tier < 1 || research.tier > 12)) {
                errors.push(`Research ${id} has invalid tier: ${research.tier}`);
            }

            // Check boost limit per tier (max 1 for tiers 1-5, max 2 for tiers 6-12)
            if (research.effects) {
                const effectCount = Object.keys(research.effects).length;
                const maxEffects = research.tier < 6 ? 1 : 2;
                if (effectCount > maxEffects) {
                    errors.push(`Research ${id} (tier ${research.tier}) has ${effectCount} boosts, max ${maxEffects} allowed`);
                }
            }

            // Check prerequisites exist
            if (research.requirements?.prerequisites) {
                research.requirements.prerequisites.forEach(prereq => {
                    if (!this.research[prereq]) {
                        errors.push(`Research ${id} has invalid prerequisite: ${prereq}`);
                    }
                });
            }

            // Check unlocks exist
            if (research.unlocks) {
                research.unlocks.forEach(unlock => {
                    if (!this.research[unlock]) {
                        warnings.push(`Research ${id} unlocks non-existent research: ${unlock}`);
                    }
                });
            }
        });

        if (errors.length > 0) {
            console.error('Research Database Validation Errors:', errors);
        }
        if (warnings.length > 0) {
            console.warn('Research Database Validation Warnings:', warnings);
        }

        return { errors, warnings };
    },

    /**
     * Get research by category
     */
    getResearchByCategory(category) {
        return Object.entries(this.research)
            .filter(([id, research]) => research.category === category)
            .reduce((acc, [id, research]) => {
                acc[id] = research;
                return acc;
            }, {});
    },

    /**
     * Get research by tier
     */
    getResearchByTier(tier) {
        return Object.entries(this.research)
            .filter(([id, research]) => research.tier === tier)
            .reduce((acc, [id, research]) => {
                acc[id] = research;
                return acc;
            }, {});
    },

    /**
     * Get research by category and tier
     */
    getResearchByCategoryAndTier(category, tier) {
        return Object.entries(this.research)
            .filter(([id, research]) => research.category === category && research.tier === tier)
            .reduce((acc, [id, research]) => {
                acc[id] = research;
                return acc;
            }, {});
    },

    /**
     * Get prerequisites for a research
     */
    getPrerequisites(researchId) {
        const research = this.research[researchId];
        if (!research?.requirements?.prerequisites) return [];
        
        return research.requirements.prerequisites.map(prereqId => ({
            id: prereqId,
            ...this.research[prereqId]
        }));
    },

    /**
     * Get what research unlocks
     */
    getUnlocks(researchId) {
        const research = this.research[researchId];
        if (!research?.unlocks) return [];
        
        return research.unlocks.map(unlockId => ({
            id: unlockId,
            ...this.research[unlockId]
        }));
    },

    /**
     * Get research tree for a category
     */
    getResearchTree(category) {
        const categoryResearch = this.getResearchByCategory(category);
        const tree = {};

        // Organize by tier
        for (let tier = 1; tier <= 12; tier++) {
            tree[tier] = Object.entries(categoryResearch)
                .filter(([id, research]) => research.tier === tier)
                .map(([id, research]) => ({
                    id,
                    ...research,
                    prerequisites: this.getPrerequisites(id),
                    unlocks: this.getUnlocks(id)
                }));
        }

        return tree;
    },

    /**
     * Check if research can be unlocked given completed research
     */
    canUnlock(researchId, completedResearch = new Set()) {
        const research = this.research[researchId];
        if (!research) return false;

        // Check tech level (this would be checked by the nation's tech level)
        // For now, assume tech level is sufficient

        // Check prerequisites
        if (research.requirements?.prerequisites) {
            for (const prereq of research.requirements.prerequisites) {
                if (!completedResearch.has(prereq)) {
                    return false;
                }
            }
        }

        return true;
    },

    /**
     * Get available research for a nation
     */
    getAvailableResearch(completedResearch = new Set(), techLevel = 1, category = null) {
        const available = [];

        Object.entries(this.research).forEach(([id, research]) => {
            // Skip if wrong category
            if (category && research.category !== category) return;
            
            // Skip if already completed
            if (completedResearch.has(id)) return;
            
            // Skip if tech level too low
            if (research.requirements?.tech_level > techLevel) return;
            
            // Check if can unlock
            if (this.canUnlock(id, completedResearch)) {
                available.push({ id, ...research });
            }
        });

        return available.sort((a, b) => {
            // Sort by tier first, then by cost
            if (a.tier !== b.tier) return a.tier - b.tier;
            return a.cost - b.cost;
        });
    },

    /**
     * Get research statistics
     */
    getStatistics() {
        const stats = {
            total: Object.keys(this.research).length,
            byCategory: {},
            byTier: {},
            averageCostByTier: {}
        };

        // Count by category
        Object.keys(this.categories).forEach(category => {
            stats.byCategory[category] = Object.values(this.research)
                .filter(r => r.category === category).length;
        });

        // Count by tier and calculate averages
        for (let tier = 1; tier <= 12; tier++) {
            const tierResearch = Object.values(this.research).filter(r => r.tier === tier);
            stats.byTier[tier] = tierResearch.length;
            
            if (tierResearch.length > 0) {
                stats.averageCostByTier[tier] = Math.round(
                    tierResearch.reduce((sum, r) => sum + r.cost, 0) / tierResearch.length
                );
            }
        }

        return stats;
    }
};

// Export the research database
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResearchDatabase;
} else if (typeof window !== 'undefined') {
    window.ResearchDatabase = ResearchDatabase;
}

// Auto-initialize if all dependencies are available
if (EconomyResearchData && HealthcareResearchData && WarResearchData) {
    ResearchDatabase.initialize();
}