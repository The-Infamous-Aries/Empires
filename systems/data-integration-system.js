/**
 * Data Integration System - Properly connects game systems with data files
 * Ensures research, diseases, and events use the data folder files
 */

class DataIntegrationSystem {
    constructor() {
        this.isInitialized = false;
        this.researchData = null;
        this.diseaseData = null;
        this.eventData = null;
        
        this.loadingPromises = new Map();
        
        console.log('Data Integration System created');
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        console.log('Initializing Data Integration System...');
        
        try {
            // Load all data files
            await Promise.all([
                this.loadResearchData(),
                this.loadDiseaseData(),
                this.loadEventData()
            ]);
            
            // Initialize research database if available
            if (typeof ResearchDatabase !== 'undefined' && !ResearchDatabase.research) {
                ResearchDatabase.initialize();
            }
            
            this.isInitialized = true;
            console.log('Data Integration System initialized successfully');
            
            // Emit event for other systems
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('dataIntegration:loaded', {
                    research: this.researchData,
                    diseases: this.diseaseData,
                    events: this.eventData
                });
            }
            
        } catch (error) {
            console.error('Failed to initialize Data Integration System:', error);
            throw error;
        }
    }
    
    async loadResearchData() {
        try {
            // Research data should be loaded by the script tags in index.html
            // but we can verify and consolidate it here
            
            const researchSources = [
                'EconomyResearch',
                'HealthcareResearch',
                'WarResearch'
            ];
            
            this.researchData = {};
            
            for (const source of researchSources) {
                if (typeof window !== 'undefined' && window[source]) {
                    Object.assign(this.researchData, window[source]);
                }
            }
            
            console.log(`Loaded ${Object.keys(this.researchData).length} research items from data files`);
            
            return this.researchData;
        } catch (error) {
            console.error('Error loading research data:', error);
            return {};
        }
    }
    
    async loadDiseaseData() {
        try {
            // Disease data should be loaded by script tags
            this.diseaseData = {
                national: {},
                global: {}
            };
            
            if (typeof window !== 'undefined') {
                if (window.NATIONAL_DISEASES) {
                    this.diseaseData.national = window.NATIONAL_DISEASES;
                }
                if (window.GLOBAL_DISEASES) {
                    this.diseaseData.global = window.GLOBAL_DISEASES;
                }
            }
            
            const nationalCount = this.diseaseData.national.minor?.length || 0 + 
                                this.diseaseData.national.major?.length || 0 + 
                                this.diseaseData.national.severe?.length || 0;
            
            const globalCount = this.diseaseData.global.minor?.length || 0 + 
                              this.diseaseData.global.major?.length || 0 + 
                              this.diseaseData.global.severe?.length || 0;
            
            console.log(`Loaded ${nationalCount} national diseases and ${globalCount} global diseases from data files`);
            
            return this.diseaseData;
        } catch (error) {
            console.error('Error loading disease data:', error);
            return { national: {}, global: {} };
        }
    }
    
    async loadEventData() {
        try {
            // Event data should be loaded by script tags
            this.eventData = {};
            
            const eventSources = [
                'NationEvents',
                'EconomicEvents',
                'PopulationEvents',
                'PopulationSituations'
            ];
            
            if (typeof window !== 'undefined') {
                for (const source of eventSources) {
                    if (window[source]) {
                        Object.assign(this.eventData, window[source]);
                    }
                }
            }
            
            let eventCount = 0;
            for (const category of Object.values(this.eventData)) {
                if (Array.isArray(category)) {
                    eventCount += category.length;
                } else if (typeof category === 'object') {
                    for (const subcategory of Object.values(category)) {
                        if (Array.isArray(subcategory)) {
                            eventCount += subcategory.length;
                        }
                    }
                }
            }
            
            console.log(`Loaded ${eventCount} events from data files`);
            
            return this.eventData;
        } catch (error) {
            console.error('Error loading event data:', error);
            return {};
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // RESEARCH DATA INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════
    
    getResearchById(researchId) {
        if (!this.researchData) {
            console.warn('Research data not loaded yet');
            return null;
        }
        
        return this.researchData[researchId] || null;
    }
    
    getResearchByCategory(category) {
        if (!this.researchData) return {};
        
        const result = {};
        for (const [id, research] of Object.entries(this.researchData)) {
            if (research.category === category) {
                result[id] = research;
            }
        }
        return result;
    }
    
    getResearchByTier(tier) {
        if (!this.researchData) return {};
        
        const result = {};
        for (const [id, research] of Object.entries(this.researchData)) {
            if (research.tier === tier) {
                result[id] = research;
            }
        }
        return result;
    }
    
    getAllResearch() {
        return this.researchData || {};
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // DISEASE DATA INTEGRATION  
    // ═══════════════════════════════════════════════════════════════════════
    
    getRandomNationalDisease(severity = null) {
        if (!this.diseaseData?.national) {
            console.warn('Disease data not loaded yet');
            return null;
        }
        
        let diseases = [];
        
        if (severity) {
            diseases = this.diseaseData.national[severity] || [];
        } else {
            // Combine all severities
            diseases = [
                ...(this.diseaseData.national.minor || []),
                ...(this.diseaseData.national.major || []),
                ...(this.diseaseData.national.severe || [])
            ];
        }
        
        if (diseases.length === 0) return null;
        
        return diseases[Math.floor(Math.random() * diseases.length)];
    }
    
    getRandomGlobalDisease(severity = null) {
        if (!this.diseaseData?.global) {
            console.warn('Disease data not loaded yet');
            return null;
        }
        
        let diseases = [];
        
        if (severity) {
            diseases = this.diseaseData.global[severity] || [];
        } else {
            // Combine all severities
            diseases = [
                ...(this.diseaseData.global.minor || []),
                ...(this.diseaseData.global.major || []),
                ...(this.diseaseData.global.severe || [])
            ];
        }
        
        if (diseases.length === 0) return null;
        
        return diseases[Math.floor(Math.random() * diseases.length)];
    }
    
    getDiseaseById(diseaseId) {
        if (!this.diseaseData) return null;
        
        // Search in national diseases
        for (const severity of ['minor', 'major', 'severe']) {
            const diseases = this.diseaseData.national[severity] || [];
            const disease = diseases.find(d => d.id === diseaseId);
            if (disease) return disease;
        }
        
        // Search in global diseases  
        for (const severity of ['minor', 'major', 'severe']) {
            const diseases = this.diseaseData.global[severity] || [];
            const disease = diseases.find(d => d.id === diseaseId);
            if (disease) return disease;
        }
        
        return null;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // EVENT DATA INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════
    
    getRandomEvent(category = null, weight = null) {
        if (!this.eventData) {
            console.warn('Event data not loaded yet');
            return null;
        }
        
        let events = [];
        
        if (category) {
            // Get events from specific category
            if (this.eventData[category]) {
                if (Array.isArray(this.eventData[category])) {
                    events = this.eventData[category];
                } else {
                    // Category might have subcategories
                    for (const subcategory of Object.values(this.eventData[category])) {
                        if (Array.isArray(subcategory)) {
                            events.push(...subcategory);
                        }
                    }
                }
            }
        } else {
            // Get all events
            for (const categoryData of Object.values(this.eventData)) {
                if (Array.isArray(categoryData)) {
                    events.push(...categoryData);
                } else if (typeof categoryData === 'object') {
                    for (const subcategory of Object.values(categoryData)) {
                        if (Array.isArray(subcategory)) {
                            events.push(...subcategory);
                        }
                    }
                }
            }
        }
        
        if (events.length === 0) return null;
        
        // If weight specified, filter by weight
        if (weight !== null) {
            events = events.filter(event => (event.weight || 5) >= weight);
        }
        
        if (events.length === 0) return null;
        
        // Weighted random selection
        const totalWeight = events.reduce((sum, event) => sum + (event.weight || 5), 0);
        let random = Math.random() * totalWeight;
        
        for (const event of events) {
            random -= (event.weight || 5);
            if (random <= 0) {
                return event;
            }
        }
        
        // Fallback to first event
        return events[0];
    }
    
    getEventById(eventId) {
        if (!this.eventData) return null;
        
        // Search through all categories and subcategories
        for (const categoryData of Object.values(this.eventData)) {
            if (Array.isArray(categoryData)) {
                const event = categoryData.find(e => e.id === eventId);
                if (event) return event;
            } else if (typeof categoryData === 'object') {
                for (const subcategory of Object.values(categoryData)) {
                    if (Array.isArray(subcategory)) {
                        const event = subcategory.find(e => e.id === eventId);
                        if (event) return event;
                    }
                }
            }
        }
        
        return null;
    }
    
    getEventsByCategory(category) {
        if (!this.eventData || !this.eventData[category]) return [];
        
        let events = [];
        
        if (Array.isArray(this.eventData[category])) {
            events = this.eventData[category];
        } else {
            // Category has subcategories
            for (const subcategory of Object.values(this.eventData[category])) {
                if (Array.isArray(subcategory)) {
                    events.push(...subcategory);
                }
            }
        }
        
        return events;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SYSTEM INTEGRATION HELPERS
    // ═══════════════════════════════════════════════════════════════════════
    
    integrateWithResearchSystem() {
        // Use the live instance created by GameEngine, not the class constructor
        const researchInstance = window.GameEngine?.systems?.research;
        if (researchInstance && typeof researchInstance.setResearchDatabase === 'function' && this.researchData) {
            researchInstance.setResearchDatabase(this.researchData);
            console.log('Integrated research data with Research System');
        }
    }
    
    integrateWithDiseaseSystem() {
        // Use the live instance created by GameEngine, not the class constructor
        const diseaseInstance = window.GameEngine?.systems?.diseases;
        if (diseaseInstance && typeof diseaseInstance.setDiseaseDatabase === 'function' && this.diseaseData) {
            diseaseInstance.setDiseaseDatabase(this.diseaseData);
            console.log('Integrated disease data with Disease System');
        }
    }
    
    integrateWithEventSystem() {
        if (typeof EventSystem !== 'undefined' && this.eventData) {
            // Extend event system with data file events
            EventSystem.setEventDatabase(this.eventData);
            console.log('Integrated event data with Event System');
        }
    }
    
    // Integrate with all systems
    integrateWithAllSystems() {
        this.integrateWithResearchSystem();
        this.integrateWithDiseaseSystem();
        this.integrateWithEventSystem();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    getDataStats() {
        return {
            research: {
                totalCount: Object.keys(this.researchData || {}).length,
                categories: this.getResearchCategories(),
                tiers: this.getResearchTiers()
            },
            diseases: {
                national: {
                    minor: (this.diseaseData?.national?.minor || []).length,
                    major: (this.diseaseData?.national?.major || []).length,
                    severe: (this.diseaseData?.national?.severe || []).length
                },
                global: {
                    minor: (this.diseaseData?.global?.minor || []).length,
                    major: (this.diseaseData?.global?.major || []).length,
                    severe: (this.diseaseData?.global?.severe || []).length
                }
            },
            events: {
                totalCount: this.countAllEvents(),
                categories: Object.keys(this.eventData || {})
            }
        };
    }
    
    getResearchCategories() {
        const categories = new Set();
        for (const research of Object.values(this.researchData || {})) {
            if (research.category) {
                categories.add(research.category);
            }
        }
        return Array.from(categories);
    }
    
    getResearchTiers() {
        const tiers = new Set();
        for (const research of Object.values(this.researchData || {})) {
            if (research.tier) {
                tiers.add(research.tier);
            }
        }
        return Array.from(tiers).sort((a, b) => a - b);
    }
    
    countAllEvents() {
        let count = 0;
        for (const categoryData of Object.values(this.eventData || {})) {
            if (Array.isArray(categoryData)) {
                count += categoryData.length;
            } else if (typeof categoryData === 'object') {
                for (const subcategory of Object.values(categoryData)) {
                    if (Array.isArray(subcategory)) {
                        count += subcategory.length;
                    }
                }
            }
        }
        return count;
    }
    
    validateDataIntegrity() {
        const issues = [];
        
        // Validate research data
        if (this.researchData) {
            for (const [id, research] of Object.entries(this.researchData)) {
                if (!research.name) issues.push(`Research ${id} missing name`);
                if (!research.category) issues.push(`Research ${id} missing category`);
                if (!research.cost) issues.push(`Research ${id} missing cost`);
                
                // Check prerequisites exist
                if (research.requirements?.prerequisites) {
                    for (const prereq of research.requirements.prerequisites) {
                        if (!this.researchData[prereq]) {
                            issues.push(`Research ${id} has invalid prerequisite: ${prereq}`);
                        }
                    }
                }
            }
        }
        
        // Validate disease data
        if (this.diseaseData) {
            ['national', 'global'].forEach(scope => {
                if (this.diseaseData[scope]) {
                    ['minor', 'major', 'severe'].forEach(severity => {
                        const diseases = this.diseaseData[scope][severity] || [];
                        diseases.forEach(disease => {
                            if (!disease.id) issues.push(`${scope} ${severity} disease missing id`);
                            if (!disease.name) issues.push(`Disease ${disease.id} missing name`);
                            if (!disease.effects) issues.push(`Disease ${disease.id} missing effects`);
                        });
                    });
                }
            });
        }
        
        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.DataIntegrationSystem = DataIntegrationSystem;
    
    // Auto-initialize when document is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dataIntegration = new DataIntegrationSystem();
            window.dataIntegration.initialize();
        });
    } else {
        window.dataIntegration = new DataIntegrationSystem();
        window.dataIntegration.initialize();
    }
}