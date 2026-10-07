/**
 * Motion System Framework - Extensible Motion Processing
 * Dominion Wars - Nation Building Strategy Game
 */

class MotionSystem {
    constructor() {
        this.isInitialized = false;
        this.motionProcessors = new Map();
        this.activeEffects = new Map();
        
        this.initialize();
    }
    
    /**
     * Initialize motion system
     */
    initialize() {
        console.log('Initializing Motion System...');
        
        this.registerDefaultProcessors();
        this.bindEvents();
        
        this.isInitialized = true;
        console.log('Motion System initialized');
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Listen for implemented motions
        EventBus.on('motion_implemented', this.handleMotionImplemented, this);
        
        // Listen for daily updates to process motion effects
        EventBus.on(GameEvents.DAY_PASSED, this.handleDailyEffects, this);
    }
    
    /**
     * Register default motion processors
     */
    registerDefaultProcessors() {
        this.registerMotionProcessor('TRADE_EMBARGO', new TradeEmbargoProcessor());
        this.registerMotionProcessor('RESOURCE_SUBSIDY', new ResourceSubsidyProcessor());
        this.registerMotionProcessor('MILITARY_ALLIANCE', new MilitaryAllianceProcessor());
        this.registerMotionProcessor('TERRITORY_DISPUTE', new TerritoryDisputeProcessor());
        this.registerMotionProcessor('FACTION_SANCTION', new FactionSanctionProcessor());
        this.registerMotionProcessor('RESEARCH_SHARING', new ResearchSharingProcessor());
        this.registerMotionProcessor('WORLD_TAX', new WorldTaxProcessor());
    }
    
    /**
     * Register a motion processor
     */
    registerMotionProcessor(motionType, processor) {
        if (typeof processor.process !== 'function') {
            throw new Error('Motion processor must have a process method');
        }
        
        this.motionProcessors.set(motionType, processor);
        console.log(`Motion processor registered: ${motionType}`);
    }
    
    /**
     * Handle implemented motion
     */
    handleMotionImplemented(data) {
        const motion = data.motion;
        const processor = this.motionProcessors.get(motion.type);
        
        if (processor) {
            try {
                const effect = processor.process(motion);
                if (effect) {
                    this.addActiveEffect(motion.id, effect, motion);
                }
            } catch (error) {
                console.error(`Error processing motion ${motion.id}:`, error);
            }
        } else {
            console.warn(`No processor found for motion type: ${motion.type}`);
        }
    }
    
    /**
     * Add active effect from motion
     */
    addActiveEffect(motionId, effect, motion) {
        this.activeEffects.set(motionId, {
            ...effect,
            motionId: motionId,
            motionType: motion.type,
            startDate: Date.now(),
            sourceMotion: motion
        });
        
        EventBus.emit('motion_effect_applied', {
            motionId: motionId,
            effect: effect
        });
    }
    
    /**
     * Remove active effect
     */
    removeActiveEffect(motionId) {
        const effect = this.activeEffects.get(motionId);
        if (effect && effect.onRemove) {
            effect.onRemove();
        }
        
        const removed = this.activeEffects.delete(motionId);
        
        if (removed) {
            EventBus.emit('motion_effect_removed', {
                motionId: motionId
            });
        }
        
        return removed;
    }
    
    /**
     * Handle daily processing of motion effects
     */
    handleDailyEffects(data) {
        const currentTime = Date.now();
        const expiredEffects = [];
        
        for (const [motionId, effect] of this.activeEffects.entries()) {
            // Process ongoing effects
            if (effect.onDaily) {
                try {
                    effect.onDaily();
                } catch (error) {
                    console.error(`Error in daily effect processing for motion ${motionId}:`, error);
                }
            }
            
            // Check for expiration
            if (effect.duration && currentTime - effect.startDate >= effect.duration) {
                expiredEffects.push(motionId);
            }
        }
        
        // Remove expired effects
        expiredEffects.forEach(motionId => this.removeActiveEffect(motionId));
    }
    
    /**
     * Get active effects
     */
    getActiveEffects() {
        return Array.from(this.activeEffects.values());
    }
    
    /**
     * Get specific motion effect
     */
    getMotionEffect(motionId) {
        return this.activeEffects.get(motionId);
    }
}

/**
 * Base Motion Processor Class
 */
class BaseMotionProcessor {
    process(motion) {
        throw new Error('Motion processor must implement process method');
    }
}

/**
 * Trade Embargo Processor
 */
class TradeEmbargoProcessor extends BaseMotionProcessor {
    process(motion) {
        const targetFactions = motion.targets || [];
        
        return {
            type: 'trade_embargo',
            targetFactions: targetFactions,
            duration: 30 * 24 * 60 * 60 * 1000, // 30 days
            onDaily: () => {
                // Apply trade penalties to target factions
                this.applyTradeRestrictions(targetFactions);
            },
            onRemove: () => {
                // Remove trade restrictions
                this.removeTradeRestrictions(targetFactions);
            }
        };
    }
    
    applyTradeRestrictions(targetFactions) {
        // Placeholder: reduce trade efficiency for target factions
        EventBus.emit('trade_restrictions_applied', { targetFactions });
    }
    
    removeTradeRestrictions(targetFactions) {
        // Placeholder: restore normal trade
        EventBus.emit('trade_restrictions_removed', { targetFactions });
    }
}

/**
 * Resource Subsidy Processor
 */
class ResourceSubsidyProcessor extends BaseMotionProcessor {
    process(motion) {
        const targetFaction = motion.proposerFaction;
        const subsidyAmount = motion.parameters.amount || 1000;
        const resourceType = motion.parameters.resourceType || 'money';
        
        return {
            type: 'resource_subsidy',
            targetFaction: targetFaction,
            resourceType: resourceType,
            amount: subsidyAmount,
            duration: 7 * 24 * 60 * 60 * 1000, // 7 days
            onDaily: () => {
                this.distributeSubsidy(targetFaction, resourceType, subsidyAmount);
            }
        };
    }
    
    distributeSubsidy(targetFaction, resourceType, amount) {
        // Placeholder: distribute resources to faction members
        EventBus.emit('subsidy_distributed', { 
            faction: targetFaction, 
            resource: resourceType, 
            amount: amount 
        });
    }
}

/**
 * Military Alliance Processor
 */
class MilitaryAllianceProcessor extends BaseMotionProcessor {
    process(motion) {
        const allianceFactions = motion.targets || [];
        
        return {
            type: 'military_alliance',
            factions: allianceFactions,
            duration: null, // Permanent until revoked
            onDaily: () => {
                // Process alliance benefits
                this.applyAllianceBenefits(allianceFactions);
            }
        };
    }
    
    applyAllianceBenefits(factions) {
        // Placeholder: provide military cooperation bonuses
        EventBus.emit('alliance_benefits_applied', { factions });
    }
}

/**
 * Territory Dispute Processor
 */
class TerritoryDisputeProcessor extends BaseMotionProcessor {
    process(motion) {
        const disputedTerritory = motion.parameters.territory;
        const resolution = motion.parameters.resolution;
        
        // Immediately resolve the dispute
        this.resolveTerritoryDispute(disputedTerritory, resolution);
        
        return null; // No ongoing effect
    }
    
    resolveTerritoryDispute(territory, resolution) {
        // Placeholder: implement territory resolution
        EventBus.emit('territory_dispute_resolved', { territory, resolution });
    }
}

/**
 * Faction Sanction Processor
 */
class FactionSanctionProcessor extends BaseMotionProcessor {
    process(motion) {
        const targetFaction = motion.targets[0];
        const sanctionType = motion.parameters.type || 'economic';
        const severity = motion.parameters.severity || 'moderate';
        
        return {
            type: 'faction_sanction',
            targetFaction: targetFaction,
            sanctionType: sanctionType,
            severity: severity,
            duration: 14 * 24 * 60 * 60 * 1000, // 14 days
            onDaily: () => {
                this.applySanctions(targetFaction, sanctionType, severity);
            },
            onRemove: () => {
                this.removeSanctions(targetFaction);
            }
        };
    }
    
    applySanctions(targetFaction, type, severity) {
        // Placeholder: apply faction penalties
        EventBus.emit('sanctions_applied', { faction: targetFaction, type, severity });
    }
    
    removeSanctions(targetFaction) {
        // Placeholder: remove faction penalties
        EventBus.emit('sanctions_removed', { faction: targetFaction });
    }
}

/**
 * Research Sharing Processor
 */
class ResearchSharingProcessor extends BaseMotionProcessor {
    process(motion) {
        const participatingFactions = motion.targets || [motion.proposerFaction];
        const researchBonus = motion.parameters.bonus || 0.2; // 20% research bonus
        
        return {
            type: 'research_sharing',
            factions: participatingFactions,
            bonus: researchBonus,
            duration: 60 * 24 * 60 * 60 * 1000, // 60 days
            onDaily: () => {
                this.applyResearchBonus(participatingFactions, researchBonus);
            }
        };
    }
    
    applyResearchBonus(factions, bonus) {
        // Placeholder: apply research speed bonus to participating factions
        EventBus.emit('research_bonus_applied', { factions, bonus });
    }
}

/**
 * World Tax Processor
 */
class WorldTaxProcessor extends BaseMotionProcessor {
    process(motion) {
        const taxRate = motion.parameters.rate || 0.05; // 5% tax
        const purpose = motion.parameters.purpose || 'infrastructure';
        
        return {
            type: 'world_tax',
            rate: taxRate,
            purpose: purpose,
            duration: 90 * 24 * 60 * 60 * 1000, // 90 days
            onDaily: () => {
                this.collectWorldTax(taxRate, purpose);
            }
        };
    }
    
    collectWorldTax(rate, purpose) {
        // Placeholder: collect tax from all nations and fund global projects
        EventBus.emit('world_tax_collected', { rate, purpose });
    }
}

// Create global Motion System instance
const MotionSystem = new MotionSystem();