/**
 * Buildings System - Empire Builder
 * Unified system for managing Improvements, Projects, and Wonders
 * Implements land-based restrictions and build timers
 */

class BuildingsSystem {
    constructor() {
        this.isInitialized = false;
        
        // Build timers and restrictions
        this.buildTimers = {
            lastProjectBuild: 0,    // Last project build time (game days)
            lastWonderBuild: 0      // Last wonder build time (game days)
        };
        
        // Subsystems
        this.improvementsSystem = null;
        this.projectsSystem = null;
        this.wondersSystem = null;
        
        this.initialize();
    }
    
    /**
     * Initialize the buildings system
     */
    initialize() {
        if (this.isInitialized) return;
        
        // Initialize subsystems
        if (window.ImprovementsSystem) {
            this.improvementsSystem = new ImprovementsSystem();
        }
        if (window.ProjectsSystem) {
            this.projectsSystem = new ProjectsSystem();
        }
        if (window.WondersSystem) {
            this.wondersSystem = new WondersSystem();
        }
        
        this.bindEvents();
        this.isInitialized = true;
        
        console.log('Buildings System initialized');
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        EventBus.on('show_buildings_panel', this.showBuildingsPanel, this);
        EventBus.on('build_improvement', this.buildImprovement, this);
        EventBus.on('build_project', this.buildProject, this);
        EventBus.on('build_wonder', this.buildWonder, this);
        EventBus.on('demolish_improvement', this.demolishImprovement, this);
        EventBus.on('demolish_project', this.demolishProject, this);
        EventBus.on('demolish_wonder', this.demolishWonder, this);
        EventBus.on('get_building_requirements', this.getBuildingRequirements, this);
    }
    
    /**
     * Get nation's territory count
     */
    getNationTerritoryCount(nation) {
        if (window.TerritoryManager) {
            const stats = TerritoryManager.getNationTerritoryStats(nation.id);
            return stats.count;
        }
        // Fallback to nation.land divided by 100 (miles per block)
        return Math.floor(nation.land / 100) || 10; // Default to 10 for testing
    }
    
    /**
     * Get current game day for timers
     */
    getCurrentGameDay() {
        if (window.GameTime) {
            return GameTime.getTime().totalDays;
        }
        return 0; // Fallback for testing
    }
    
    /**
     * Calculate improvement slots available
     * 1 slot per territory square owned
     */
    getImprovementSlots(nation) {
        const territoryCount = this.getNationTerritoryCount(nation);
        const usedSlots = this.getUsedImprovementSlots(nation);
        
        return {
            total: territoryCount,
            used: usedSlots,
            available: territoryCount - usedSlots
        };
    }
    
    /**
     * Get used improvement slots
     */
    getUsedImprovementSlots(nation) {
        if (!nation.improvements) return 0;
        
        return Object.values(nation.improvements).reduce((total, count) => total + count, 0);
    }
    
    /**
     * Check if nation can build projects
     * Requires: 1 project per 10 territories, 14 day cooldown
     */
    canBuildProject(nation) {
        const territoryCount = this.getNationTerritoryCount(nation);
        const currentDay = this.getCurrentGameDay();
        
        // Need at least 10 territories
        const maxProjects = Math.floor(territoryCount / 10);
        const currentProjects = this.getTotalProjectCount(nation);
        
        if (currentProjects >= maxProjects) {
            return {
                canBuild: false,
                reason: `Need ${(currentProjects + 1) * 10} territories to build another project (currently ${territoryCount})`
            };
        }
        
        // Check 14 day cooldown
        const daysSinceLastBuild = currentDay - this.buildTimers.lastProjectBuild;
        if (daysSinceLastBuild < 14) {
            return {
                canBuild: false,
                reason: `Must wait ${14 - daysSinceLastBuild} more days before building another project`
            };
        }
        
        return { canBuild: true };
    }
    
    /**
     * Check if nation can build wonders
     * Requires: 1 wonder per 20 territories, 28 day cooldown
     */
    canBuildWonder(nation) {
        const territoryCount = this.getNationTerritoryCount(nation);
        const currentDay = this.getCurrentGameDay();
        
        // Need at least 20 territories
        const maxWonders = Math.floor(territoryCount / 20);
        const currentWonders = this.getTotalWonderCount(nation);
        
        if (currentWonders >= maxWonders) {
            return {
                canBuild: false,
                reason: `Need ${(currentWonders + 1) * 20} territories to build another wonder (currently ${territoryCount})`
            };
        }
        
        // Check 28 day cooldown
        const daysSinceLastBuild = currentDay - this.buildTimers.lastWonderBuild;
        if (daysSinceLastBuild < 28) {
            return {
                canBuild: false,
                reason: `Must wait ${28 - daysSinceLastBuild} more days before building another wonder`
            };
        }
        
        return { canBuild: true };
    }
    
    /**
     * Get total project count for nation (excluding Broadcasting which doesn't occupy slots)
     */
    getTotalProjectCount(nation) {
        if (!nation.projects) return 0;
        
        let totalCount = 0;
        Object.entries(nation.projects).forEach(([projectType, count]) => {
            // Broadcasting doesn't occupy project slots
            if (projectType !== 'broadcasting') {
                totalCount += count;
            }
        });
        
        return totalCount;
    }
    
    /**
     * Get total wonder count for nation
     */
    getTotalWonderCount(nation) {
        if (!nation.wonders) return 0;
        return Object.values(nation.wonders).reduce((total, count) => total + count, 0);
    }
    
    /**
     * Build an improvement (no restrictions other than slots and resources)
     */
    buildImprovement(data) {
        const { improvementType, nation } = data;
        
        // Check improvement slots
        const slots = this.getImprovementSlots(nation);
        if (slots.available <= 0) {
            console.warn(`No improvement slots available (${slots.used}/${slots.total} used)`);
            EventBus.emit('building_error', {
                type: 'improvement',
                reason: `No improvement slots available. You need more territory to build additional improvements.`
            });
            return false;
        }
        
        // Delegate to improvements system
        if (this.improvementsSystem) {
            return this.improvementsSystem.buildImprovement(data);
        }
        
        return false;
    }
    
    /**
     * Build a project (with territory and timer restrictions)
     */
    buildProject(data) {
        const { projectType, nation } = data;
        
        // Check if it's a Broadcasting project (special case - doesn't occupy slot but activates cooldown)
        const isBroadcasting = projectType === 'broadcasting';
        
        // Check if nation can build projects (skip slot check for Broadcasting)
        if (!isBroadcasting) {
            const canBuild = this.canBuildProject(nation);
            if (!canBuild.canBuild) {
                console.warn(`Cannot build project: ${canBuild.reason}`);
                EventBus.emit('building_error', {
                    type: 'project',
                    reason: canBuild.reason
                });
                return false;
            }
        } else {
            // For Broadcasting, only check cooldown (not slot count)
            const currentDay = this.getCurrentGameDay();
            const daysSinceLastBuild = currentDay - this.buildTimers.lastProjectBuild;
            if (daysSinceLastBuild < 14) {
                const canBuild = {
                    canBuild: false,
                    reason: `Must wait ${14 - daysSinceLastBuild} more days before building another project`
                };
                console.warn(`Cannot build Broadcasting: ${canBuild.reason}`);
                EventBus.emit('building_error', {
                    type: 'project',
                    reason: canBuild.reason
                });
                return false;
            }
        }
        
        // Delegate to projects system
        if (this.projectsSystem) {
            const result = this.projectsSystem.buildProject(data);
            if (result) {
                // Update timer on successful build (both regular and Broadcasting)
                this.buildTimers.lastProjectBuild = this.getCurrentGameDay();
            }
            return result;
        }
        
        return false;
    }
    
    /**
     * Build a wonder (with territory and timer restrictions)
     */
    buildWonder(data) {
        const { wonderType, nation } = data;
        
        // Check if nation can build wonders
        const canBuild = this.canBuildWonder(nation);
        if (!canBuild.canBuild) {
            console.warn(`Cannot build wonder: ${canBuild.reason}`);
            EventBus.emit('building_error', {
                type: 'wonder',
                reason: canBuild.reason
            });
            return false;
        }
        
        // Delegate to wonders system
        if (this.wondersSystem) {
            const result = this.wondersSystem.buildWonder(data);
            if (result) {
                // Update timer on successful build
                this.buildTimers.lastWonderBuild = this.getCurrentGameDay();
            }
            return result;
        }
        
        return false;
    }
    
    /**
     * Demolish an improvement (no timer reset)
     */
    demolishImprovement(data) {
        if (this.improvementsSystem) {
            return this.improvementsSystem.demolishImprovement(data);
        }
        return false;
    }
    
    /**
     * Demolish a project (resets timer)
     */
    demolishProject(data) {
        if (this.projectsSystem) {
            const result = this.projectsSystem.demolishProject(data);
            if (result) {
                // Reset project timer when demolished
                this.buildTimers.lastProjectBuild = this.getCurrentGameDay();
            }
            return result;
        }
        return false;
    }
    
    /**
     * Demolish a wonder (does NOT reset timer)
     */
    demolishWonder(data) {
        if (this.wondersSystem) {
            return this.wondersSystem.demolishWonder(data);
        }
        return false;
    }
    
    /**
     * Get building requirements for UI display
     */
    getBuildingRequirements(data) {
        const { nation } = data;
        const territoryCount = this.getNationTerritoryCount(nation);
        const currentDay = this.getCurrentGameDay();
        
        const requirements = {
            improvements: this.getImprovementSlots(nation),
            projects: {
                maxAllowed: Math.floor(territoryCount / 10),
                current: this.getTotalProjectCount(nation),
                nextCooldownEnd: this.buildTimers.lastProjectBuild + 14,
                daysUntilNextBuild: Math.max(0, (this.buildTimers.lastProjectBuild + 14) - currentDay),
                canBuild: this.canBuildProject(nation)
            },
            wonders: {
                maxAllowed: Math.floor(territoryCount / 20),
                current: this.getTotalWonderCount(nation),
                nextCooldownEnd: this.buildTimers.lastWonderBuild + 28,
                daysUntilNextBuild: Math.max(0, (this.buildTimers.lastWonderBuild + 28) - currentDay),
                canBuild: this.canBuildWonder(nation)
            },
            territoryCount: territoryCount
        };
        
        EventBus.emit('building_requirements_updated', requirements);
        return requirements;
    }
    
    /**
     * Show the unified buildings panel
     */
    showBuildingsPanel() {
        const nation = window.Nation;
        if (!nation) {
            console.warn('No nation found for buildings panel');
            return;
        }
        
        // Get all building data
        const improvements = this.improvementsSystem ? this.improvementsSystem.getNationImprovements(nation) : {};
        const projects = this.projectsSystem ? this.projectsSystem.getNationProjects(nation) : {};
        const wonders = this.wondersSystem ? this.wondersSystem.getNationWonders(nation) : {};
        
        const requirements = this.getBuildingRequirements({ nation });
        
        EventBus.emit('show_buildings_interface', {
            improvements,
            projects,
            wonders,
            requirements,
            nation
        });
    }
    
    /**
     * Process daily building operations
     */
    processDaily(nation) {
        // Delegate daily processing to subsystems
        if (this.improvementsSystem && this.improvementsSystem.processDaily) {
            this.improvementsSystem.processDaily(nation);
        }
        if (this.projectsSystem && this.projectsSystem.processDaily) {
            this.projectsSystem.processDaily(nation);
        }
        if (this.wondersSystem && this.wondersSystem.processDaily) {
            this.wondersSystem.processDaily(nation);
        }
    }

    /**
     * Recalculate improvement effects for a nation
     */
    calculateImprovementEffects(nation) {
        const targetNation = nation || window.Nation;
        if (this.improvementsSystem && this.improvementsSystem.applyImprovementEffects) {
            // Reapply all improvement effects based on current improvement counts
            Object.keys(this.improvementsSystem.improvementTypes).forEach(type => {
                const count = targetNation.improvements?.[type] || 0;
                if (count > 0) {
                    this.improvementsSystem.applyImprovementEffects(targetNation, type);
                }
            });
        }
    }

    /**
     * Recalculate project effects for a nation
     */
    calculateProjectEffects(nation) {
        const targetNation = nation || window.Nation;
        if (this.projectsSystem && this.projectsSystem.applyProjectEffects) {
            // Reapply all project effects based on current project counts
            Object.keys(this.projectsSystem.projectTypes).forEach(type => {
                const count = targetNation.projects?.[type] || 0;
                if (count > 0) {
                    this.projectsSystem.applyProjectEffects(targetNation, type);
                }
            });
        }
    }
    
    /**
     * Get system state for saving
     */
    getState() {
        return {
            buildTimers: { ...this.buildTimers },
            isInitialized: this.isInitialized
        };
    }
    
    /**
     * Set system state from save data
     */
    setState(state) {
        if (state) {
            this.buildTimers = state.buildTimers ? { ...state.buildTimers } : { lastProjectBuild: 0, lastWonderBuild: 0 };
            this.isInitialized = state.isInitialized || false;
        }
    }
    
    /**
     * Destroy the buildings system
     */
    destroy() {
        if (!this.isInitialized) return;
        
        EventBus.off('show_buildings_panel', this.showBuildingsPanel, this);
        EventBus.off('build_improvement', this.buildImprovement, this);
        EventBus.off('build_project', this.buildProject, this);
        EventBus.off('build_wonder', this.buildWonder, this);
        EventBus.off('demolish_improvement', this.demolishImprovement, this);
        EventBus.off('demolish_project', this.demolishProject, this);
        EventBus.off('demolish_wonder', this.demolishWonder, this);
        EventBus.off('get_building_requirements', this.getBuildingRequirements, this);
        
        // Destroy subsystems
        if (this.improvementsSystem && this.improvementsSystem.destroy) {
            this.improvementsSystem.destroy();
        }
        if (this.projectsSystem && this.projectsSystem.destroy) {
            this.projectsSystem.destroy();
        }
        if (this.wondersSystem && this.wondersSystem.destroy) {
            this.wondersSystem.destroy();
        }
        
        this.isInitialized = false;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuildingsSystem;
} else {
    window.BuildingsSystem = BuildingsSystem;
}