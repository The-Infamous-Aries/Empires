/**
 * Technology Entity - Wraps research data and integrates with the unified ResearchSystem
 * Provides a clean interface for technology lookups, effect application, and research state tracking
 */

class Technology {
    constructor(id, name = '', description = '') {
        this.id = id;
        this.name = name || id;
        this.description = description;

        // Technology Properties (from research database via ResearchSystem)
        this.category = '';
        this.tier = 1;
        this.cost = 0;
        this.prerequisites = [];

        // Research Status (integrates with ResearchSystem)
        this.isResearched = false;
        this.isBeingResearched = false;
        this.researchStarted = null;
        this.researchProgress = 0;
        this.researchedBy = [];

        // Technology Effects (applied to Nation via ResearchSystem modifiers)
        this.effects = {};
        this.unlocks = [];
        this.bonuses = {};

        // Advanced Properties
        this.rarity = 'common';
        this.difficulty = 'medium';
        this.applications = [];
        this.obsoletes = [];

        // Research integration
        this.baseResearchRate = 1.0;
        this.researchMultipliers = {};
        this.collaborativeBonus = 0;

        // Historical Data
        this.firstDiscoveredBy = null;
        this.firstDiscoveredAt = null;
        this.totalResearchInvestment = 0;
        this.researchAttempts = 0;

        this.initializeTechnologyData();
    }

    // ════════════════════════════════════════════════════════════════════════
    // TECHNOLOGY DATA INITIALIZATION (From ResearchSystem database)
    // ════════════════════════════════════════════════════════════════════════

    initializeTechnologyData() {
        const techData = this.getTechnologyData();

        if (techData) {
            this.name = techData.name || this.name;
            this.description = techData.description || this.description;
            this.category = techData.category || this.category;
            this.tier = techData.tier || this.tier;
            this.cost = techData.cost || this.cost;
            this.prerequisites = techData.prerequisites || [];
            this.effects = techData.effects || {};
            this.unlocks = techData.unlocks || [];
            this.bonuses = techData.bonuses || {};
            this.rarity = techData.rarity || 'common';
            this.difficulty = techData.difficulty || 'medium';
            this.applications = techData.applications || [];
            this.obsoletes = techData.obsoletes || [];
        }
    }

    getTechnologyData() {
        // Try ResearchSystem database first
        if (typeof window !== 'undefined' && window.ResearchSystem) {
            const research = window.ResearchSystem.researchDatabase?.get(this.id);
            if (research) return research;
        }

        // Try ResearchDatabase global
        if (typeof ResearchDatabase !== 'undefined' && ResearchDatabase.research) {
            return ResearchDatabase.research[this.id];
        }

        // Try individual research data files
        if (typeof window !== 'undefined') {
            const allResearch = {
                ...window.EconomyResearch,
                ...window.HealthcareResearch,
                ...window.WarResearch
            };
            if (allResearch[this.id]) {
                return allResearch[this.id];
            }
        }

        return null;
    }

    // ════════════════════════════════════════════════════════════════════════
    // RESEARCH SYSTEM INTEGRATION
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Check if this technology can be started by a nation
     */
    canStartResearch(nation) {
        if (!nation) nation = window.Nation;
        if (!nation) return { canResearch: false, reason: 'No nation available' };

        // Check prerequisites via ResearchSystem
        if (this.prerequisites && this.prerequisites.length > 0) {
            const completed = nation.completedResearch || new Set();
            for (const prereq of this.prerequisites) {
                if (!completed.has(prereq)) {
                    return {
                        canResearch: false,
                        reason: `Missing prerequisite: ${prereq}`
                    };
                }
            }
        }

        // Check if already researched
        if (this.isResearched || (completed && completed.has(this.id))) {
            return {
                canResearch: false,
                reason: 'Already researched'
            };
        }

        // Check if already being researched
        const active = window.ResearchSystem?.getActiveResearch?.(nation.id);
        if (active && active.researchId === this.id) {
            return {
                canResearch: false,
                reason: 'Already being researched'
            };
        }

        // Check tech level requirement
        if (nation.tech < this.tier) {
            return {
                canResearch: false,
                reason: `Tech level ${this.tier} required`
            };
        }

        return { canResearch: true };
    }

    /**
     * Start researching this technology via ResearchSystem
     */
    startResearch(nationId = null) {
        const nation = nationId ? this.getNation(nationId) : window.Nation;
        if (!nation) {
            return { success: false, message: 'Nation not found' };
        }

        const canStart = this.canStartResearch(nation);
        if (!canStart.canResearch) {
            return { success: false, message: canStart.reason };
        }

        // Use ResearchSystem to start the research
        if (window.ResearchSystem) {
            const result = window.ResearchSystem.startResearch(nation.id, this.id);
            if (!result.success) {
                return { success: false, message: result.reason || 'Failed to start research' };
            }
        }

        this.isBeingResearched = true;
        this.researchStarted = Date.now();
        this.researchProgress = 0;
        this.researchAttempts++;

        return {
            success: true,
            message: `Started researching ${this.name}`
        };
    }

    /**
     * Cancel active research
     */
    cancelResearch(nationId = null) {
        const nation = nationId ? this.getNation(nationId) : window.Nation;
        if (!nation) return { success: false, message: 'Nation not found' };

        if (window.ResearchSystem) {
            window.ResearchSystem.cancelResearch(nation.id, this.id);
        }

        this.isBeingResearched = false;
        this.researchProgress = 0;

        return { success: true, message: `Cancelled research on ${this.name}` };
    }

    /**
     * Apply this technology's effects to a nation via ResearchSystem
     */
    applyEffectsToNation(nation) {
        if (!nation) nation = window.Nation;
        if (!nation) return;

        if (!nation.researchEffects) nation.researchEffects = {};

        Object.entries(this.effects || {}).forEach(([effect, value]) => {
            nation.researchEffects[effect] = (nation.researchEffects[effect] || 0) + value;
        });

        // Rebuild modifiers cache via ResearchSystem
        if (window.ResearchSystem) {
            window.ResearchSystem.rebuildModifiers(nation.id);
        }

        // Track first discovery
        if (!this.firstDiscoveredBy) {
            this.firstDiscoveredBy = nation.id || 'player';
            this.firstDiscoveredAt = Date.now();
        }

        const researcherId = nation.id || 'player';
        if (!this.researchedBy.includes(researcherId)) {
            this.researchedBy.push(researcherId);
        }

        // Update Nation statistics
        if (nation.statistics) {
            nation.statistics.researchCompleted = (nation.statistics.researchCompleted || 0) + 1;
        }

        return true;
    }

    /**
     * Complete this research (called by ResearchSystem when goal is met)
     */
    completeResearch(nation) {
        if (!nation) nation = window.Nation;
        if (!nation) return;

        this.isResearched = true;
        this.discovered = Date.now();
        this.researchProgress = this.cost;

        // Add to Nation's technologies
        if (!nation.technologies) nation.technologies = new Set();
        nation.technologies.add(this.id);

        // Apply effects
        this.applyEffectsToNation(nation);

        // Update Nation statistics
        if (nation.statistics) {
            nation.statistics.researchCompleted = (nation.statistics.researchCompleted || 0) + 1;
        }

        return {
            completed: true,
            technology: this.name,
            effects: this.effects,
            unlocks: this.unlocks,
            bonuses: this.bonuses
        };
    }

    /**
     * Get Nation object
     */
    getNation(nationId) {
        if (nationId && window.DataManager?.currentPlayer?.nations) {
            return window.DataManager.currentPlayer.nations.find(n => n.id === nationId);
        }
        return window.Nation;
    }

    /**
     * Get research progress for this technology
     */
    getResearchProgress(nationId = null) {
        const nation = nationId ? this.getNation(nationId) : window.Nation;
        if (!nation) return 0;

        // Check ResearchSystem for active research progress
        if (window.ResearchSystem) {
            const progress = window.ResearchSystem.getResearchProgress?.(nation.id, this.id);
            if (progress !== undefined) return progress;
        }

        // Fallback: return local progress if researched, otherwise 0
        return this.isResearched ? this.cost : this.researchProgress;
    }

    // ════════════════════════════════════════════════════════════════════════
    // COLLABORATIVE RESEARCH
    // ════════════════════════════════════════════════════════════════════════

    addCollaborator(nationId) {
        if (!this.collaborators) this.collaborators = [];

        if (!this.collaborators.includes(nationId)) {
            this.collaborators.push(nationId);
            this.updateCollaborativeBonus();
        }
    }

    removeCollaborator(nationId) {
        if (!this.collaborators) return;

        const index = this.collaborators.indexOf(nationId);
        if (index !== -1) {
            this.collaborators.splice(index, 1);
            this.updateCollaborativeBonus();
        }
    }

    updateCollaborativeBonus() {
        if (!this.collaborators || this.collaborators.length <= 1) {
            this.collaborativeBonus = 0;
            return;
        }

        // Each additional collaborator adds 15% bonus (max 75% with 5 collaborators)
        this.collaborativeBonus = Math.min(0.75, (this.collaborators.length - 1) * 0.15);
    }

    // ════════════════════════════════════════════════════════════════════════
    // TECHNOLOGY INFORMATION
    // ════════════════════════════════════════════════════════════════════════

    getResearchInfo() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            category: this.category,
            tier: this.tier,
            cost: this.cost,
            rarity: this.rarity,
            difficulty: this.difficulty,

            // Research status
            isResearched: this.isResearched,
            researchProgress: this.researchProgress,

            // Requirements
            prerequisites: this.prerequisites,

            // Benefits
            effects: this.effects,
            unlocks: this.unlocks,
            bonuses: this.bonuses,
            applications: this.applications,

            // Historical data
            firstDiscoveredBy: this.firstDiscoveredBy,
            firstDiscoveredAt: this.firstDiscoveredAt,
            researchedByCount: this.researchedBy.length,
            totalInvestment: this.totalResearchInvestment,

            // Collaboration
            collaborativeBonus: this.collaborativeBonus,
            collaboratorCount: this.collaborators ? this.collaborators.length : 0
        };
    }

    getProgressSummary() {
        if (this.isResearched) {
            return {
                status: 'completed',
                message: 'Technology researched',
                percentage: 100
            };
        }

        const nation = this.getNation();
        const progress = window.ResearchSystem
            ? window.ResearchSystem.getResearchProgress?.(nation.id, this.id)
            : this.researchProgress;

        const percentage = this.cost > 0 ? (progress / this.cost * 100) : 0;
        const remaining = this.cost - progress;

        return {
            status: progress > 0 ? 'in_progress' : 'not_started',
            message: percentage.toFixed(1) + '% complete',
            percentage: percentage,
            remaining: remaining
        };
    }

    // ════════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ════════════════════════════════════════════════════════════════════════

    serialize() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,

            // Properties
            category: this.category,
            tier: this.tier,
            cost: this.cost,
            prerequisites: [...this.prerequisites],

            // Status
            isResearched: this.isResearched,
            researchProgress: this.researchProgress,
            researchedBy: [...this.researchedBy],

            // Effects
            effects: { ...this.effects },
            unlocks: [...this.unlocks],
            bonuses: { ...this.bonuses },

            // Advanced properties
            rarity: this.rarity,
            difficulty: this.difficulty,
            applications: [...this.applications],
            obsoletes: [...this.obsoletes],

            // Research data
            baseResearchRate: this.baseResearchRate,
            researchMultipliers: { ...this.researchMultipliers },
            collaborativeBonus: this.collaborativeBonus,
            collaborators: this.collaborators ? [...this.collaborators] : [],

            // Historical
            firstDiscoveredBy: this.firstDiscoveredBy,
            firstDiscoveredAt: this.firstDiscoveredAt,
            totalResearchInvestment: this.totalResearchInvestment,
            researchAttempts: this.researchAttempts
        };
    }

    static deserialize(data) {
        const tech = new Technology(data.id, data.name, data.description);

        // Restore properties
        tech.discovered = data.discovered;
        tech.researchStarted = data.researchStarted;

        tech.category = data.category || tech.category;
        tech.tier = data.tier || tech.tier;
        tech.cost = data.cost || tech.cost;
        tech.prerequisites = data.prerequisites || [];

        tech.isResearched = data.isResearched || false;
        tech.researchProgress = data.researchProgress || 0;
        tech.researchedBy = data.researchedBy || [];

        tech.effects = data.effects || {};
        tech.unlocks = data.unlocks || [];
        tech.bonuses = data.bonuses || {};

        tech.rarity = data.rarity || tech.rarity;
        tech.difficulty = data.difficulty || tech.difficulty;
        tech.applications = data.applications || [];
        tech.obsoletes = data.obsoletes || [];

        tech.baseResearchRate = data.baseResearchRate || 1.0;
        tech.researchMultipliers = data.researchMultipliers || {};
        tech.collaborativeBonus = data.collaborativeBonus || 0;
        tech.collaborators = data.collaborators || [];

        tech.firstDiscoveredBy = data.firstDiscoveredBy;
        tech.firstDiscoveredAt = data.firstDiscoveredAt;
        tech.totalResearchInvestment = data.totalResearchInvestment || 0;
        tech.researchAttempts = data.researchAttempts || 0;

        return tech;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.Technology = Technology;
}
