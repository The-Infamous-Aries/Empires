var _EconomyResearch, _HealthcareResearch, _WarResearch;

if (typeof require !== 'undefined' && typeof module !== 'undefined') {
    _EconomyResearch = require('./economy-research');
    _HealthcareResearch = require('./healthcare-research');
    _WarResearch = require('./war-research');
} else if (typeof window !== 'undefined') {
    _EconomyResearch = window.EconomyResearch;
    _HealthcareResearch = window.HealthcareResearch;
    _WarResearch = window.WarResearch;
}

var EconomyResearchData = _EconomyResearch;
var HealthcareResearchData = _HealthcareResearch;
var WarResearchData = _WarResearch;

const ResearchDatabase = {
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

    research: {},

initialize() {
        console.log('Initializing Research Database...');
        
        this.research = {
            ...EconomyResearchData,
            ...HealthcareResearchData,
            ...WarResearchData
        };

        this.validateResearchData();

        console.log(`Research Database initialized with ${Object.keys(this.research).length} research items across ${Object.keys(this.categories).length} categories`);
        
        return this.research;
    },

validateResearchData() {
        const errors = [];
        const warnings = [];

        Object.entries(this.research).forEach(([id, research]) => {
            if (!research.name) errors.push(`Research ${id} missing name`);
            if (!research.category) errors.push(`Research ${id} missing category`);
            if (!research.tier) errors.push(`Research ${id} missing tier`);
            if (!research.description) warnings.push(`Research ${id} missing description`);
            if (!research.requirements) errors.push(`Research ${id} missing requirements`);
            if (!research.cost) errors.push(`Research ${id} missing cost`);
            if (!research.effects) warnings.push(`Research ${id} missing effects`);

            if (research.category && !this.categories[research.category]) {
                errors.push(`Research ${id} has invalid category: ${research.category}`);
            }

            if (research.tier && (research.tier < 1 || research.tier > 12)) {
                errors.push(`Research ${id} has invalid tier: ${research.tier}`);
            }

            if (research.effects) {
                const effectCount = Object.keys(research.effects).length;
                const maxEffects = research.tier < 6 ? 1 : 2;
                if (effectCount > maxEffects) {
                    errors.push(`Research ${id} (tier ${research.tier}) has ${effectCount} boosts, max ${maxEffects} allowed`);
                }
            }

            if (research.requirements?.prerequisites) {
                research.requirements.prerequisites.forEach(prereq => {
                    if (!this.research[prereq]) {
                        errors.push(`Research ${id} has invalid prerequisite: ${prereq}`);
                    }
                });
            }

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

getResearchByCategory(category) {
        return Object.entries(this.research)
            .filter(([id, research]) => research.category === category)
            .reduce((acc, [id, research]) => {
                acc[id] = research;
                return acc;
            }, {});
    },

getResearchByTier(tier) {
        return Object.entries(this.research)
            .filter(([id, research]) => research.tier === tier)
            .reduce((acc, [id, research]) => {
                acc[id] = research;
                return acc;
            }, {});
    },

getResearchByCategoryAndTier(category, tier) {
        return Object.entries(this.research)
            .filter(([id, research]) => research.category === category && research.tier === tier)
            .reduce((acc, [id, research]) => {
                acc[id] = research;
                return acc;
            }, {});
    },

getPrerequisites(researchId) {
        const research = this.research[researchId];
        if (!research?.requirements?.prerequisites) return [];
        
        return research.requirements.prerequisites.map(prereqId => ({
            id: prereqId,
            ...this.research[prereqId]
        }));
    },

getUnlocks(researchId) {
        const research = this.research[researchId];
        if (!research?.unlocks) return [];
        
        return research.unlocks.map(unlockId => ({
            id: unlockId,
            ...this.research[unlockId]
        }));
    },

getResearchTree(category) {
        const categoryResearch = this.getResearchByCategory(category);
        const tree = {};

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

canUnlock(researchId, completedResearch = new Set()) {
        const research = this.research[researchId];
        if (!research) return false;


        if (research.requirements?.prerequisites) {
            for (const prereq of research.requirements.prerequisites) {
                if (!completedResearch.has(prereq)) {
                    return false;
                }
            }
        }

        return true;
    },

getAvailableResearch(completedResearch = new Set(), techLevel = 1, category = null) {
        const available = [];

        Object.entries(this.research).forEach(([id, research]) => {
            if (category && research.category !== category) return;
            
            if (completedResearch.has(id)) return;
            
            if (research.requirements?.tech_level > techLevel) return;
            
            if (this.canUnlock(id, completedResearch)) {
                available.push({ id, ...research });
            }
        });

        return available.sort((a, b) => {
            if (a.tier !== b.tier) return a.tier - b.tier;
            return a.cost - b.cost;
        });
    },

getStatistics() {
        const stats = {
            total: Object.keys(this.research).length,
            byCategory: {},
            byTier: {},
            averageCostByTier: {}
        };

        Object.keys(this.categories).forEach(category => {
            stats.byCategory[category] = Object.values(this.research)
                .filter(r => r.category === category).length;
        });

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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResearchDatabase;
} else if (typeof window !== 'undefined') {
    window.ResearchDatabase = ResearchDatabase;
}

if (EconomyResearchData && HealthcareResearchData && WarResearchData) {
    ResearchDatabase.initialize();
}