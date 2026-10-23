/**
 * Research Index - Central registry for all research branches
 * Loads and manages all research categories
 */

// Import all research branches
// In Node.js we require; in the browser the individual files already set window.* globals,
// so we just read those — but we must NOT redeclare with let/const because the globals
// were already declared as `const` by the loaded scripts (same global scope).
var _EconomyResearch, _HealthcareResearch, _ProductionResearch, _WarResearch;

// Handle different module systems
if (typeof require !== 'undefined' && typeof module !== 'undefined') {
    // Node.js environment
    _EconomyResearch = require('./economy-research');
    _HealthcareResearch = require('./healthcare-research');
    _ProductionResearch = require('./production-research');
    _WarResearch = require('./war-research');
} else if (typeof window !== 'undefined') {
    // Browser environment - the individual research scripts must be loaded first.
    // They each set their own window.* global.
    _EconomyResearch = window.EconomyResearch;
    _HealthcareResearch = window.HealthcareResearch;
    _ProductionResearch = window.ProductionResearch;
    _WarResearch = window.WarResearch;
}

// Alias to shorter names for use below
var EconomyResearchData = _EconomyResearch;
var HealthcareResearchData = _HealthcareResearch;
var ProductionResearchData = _ProductionResearch;
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
        production: {
            name: 'Production',
            description: 'Manufacturing, agriculture, and industrial development',
            icon: '🏭',
            color: '#FF9800'
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
        1: { era: 'Ancient', period: '3000-500 BCE', description: 'Stone Age to Bronze Age foundations' },
        2: { era: 'Classical', period: '500 BCE-500 CE', description: 'Iron Age and classical civilizations' },
        3: { era: 'Medieval', period: '500-1000 CE', description: 'Dark Ages and medieval development' },
        4: { era: 'Renaissance', period: '1000-1500 CE', description: 'Early modern era begins' },
        5: { era: 'Early Modern', period: '1500-1800', description: 'Renaissance to Industrial Revolution' },
        6: { era: 'Industrial', period: '1800-1900', description: 'Full modern era - steam and steel' },
        7: { era: 'Contemporary', period: '1900-1945', description: 'Early 20th century advancement' },
        8: { era: 'Modern', period: '1945-1980', description: 'Mid-20th century technology boom' },
        9: { era: 'Information', period: '1980-2000', description: 'Digital revolution begins' },
        10: { era: 'Digital', period: '2000-2030', description: 'Information age and connectivity' },
        11: { era: 'Advanced', period: '2030-2050', description: 'AI and nanotechnology era' },
        12: { era: 'Future', period: '2050+', description: 'Post-human technology' }
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
            ...ProductionResearchData,
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
            if (!research.time) errors.push(`Research ${id} missing time`);
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
            averageCostByTier: {},
            averageTimeByTier: {}
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
                stats.averageTimeByTier[tier] = Math.round(
                    tierResearch.reduce((sum, r) => sum + r.time, 0) / tierResearch.length
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
if (EconomyResearchData && HealthcareResearchData && ProductionResearchData && WarResearchData) {
    ResearchDatabase.initialize();
}