class DataIntegrationSystem {
    constructor() {
        this.isInitialized = false;
        this.researchData = null;
        this.diseaseData = null;
        this.eventData = null;
    }

    async initialize() {
        if (this.isInitialized) return;

        console.log('Initializing Data Integration System...');

        try {
            await Promise.all([
                this.loadResearchData(),
                this.loadDiseaseData(),
                this.loadEventData()
            ]);

            if (typeof ResearchDatabase !== 'undefined' && !ResearchDatabase.research) {
                ResearchDatabase.initialize();
            }

            this.isInitialized = true;
            console.log('Data Integration System initialized successfully');

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
            this.researchData = {};

            if (typeof window !== 'undefined' && window.ResearchDatabase && window.ResearchDatabase.research) {
                Object.assign(this.researchData, window.ResearchDatabase.research);
            } else {
                const researchSources = [
                    'EconomyResearch',
                    'HealthcareResearch',
                    'WarResearch'
                ];

                for (const source of researchSources) {
                    if (typeof window !== 'undefined' && window[source]) {
                        Object.assign(this.researchData, window[source]);
                    }
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

            const nationalCount =
                ((this.diseaseData.national.minor || []).length) +
                ((this.diseaseData.national.major || []).length);

            const globalCount =
                ((this.diseaseData.global.minor || []).length) +
                ((this.diseaseData.global.major || []).length);

            console.log(`Loaded ${nationalCount} national diseases and ${globalCount} global diseases from data files`);

            return this.diseaseData;
        } catch (error) {
            console.error('Error loading disease data:', error);
            return { national: {}, global: {} };
        }
    }

    async loadEventData() {
        try {
            this.eventData = {};

            const eventSources = [
                'EconomicEvents',
                'PopulationSituations',
                'NationSituations',
                'MilitarySituations',
                'MiracleEvents',
                'DisasterEvents',
                'SportsEvents'
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

    getRandomNationalDisease(severity = null) {
        if (!this.diseaseData?.national) {
            console.warn('Disease data not loaded yet');
            return null;
        }

        let diseases = [];

        if (severity) {
            diseases = this.diseaseData.national[severity] || [];
        } else {
            diseases = [
                ...(this.diseaseData.national.minor || []),
                ...(this.diseaseData.national.major || [])
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
            diseases = [
                ...(this.diseaseData.global.minor || []),
                ...(this.diseaseData.global.major || [])
            ];
        }

        if (diseases.length === 0) return null;

        return diseases[Math.floor(Math.random() * diseases.length)];
    }

    getDiseaseById(diseaseId) {
        if (!this.diseaseData) return null;

        for (const severity of ['minor', 'major']) {
            const diseases = this.diseaseData.national[severity] || [];
            const disease = diseases.find(d => d.id === diseaseId);
            if (disease) return disease;
        }

        for (const severity of ['minor', 'major']) {
            const diseases = this.diseaseData.global[severity] || [];
            const disease = diseases.find(d => d.id === diseaseId);
            if (disease) return disease;
        }

        return null;
    }

    getRandomEvent(category = null, weight = null) {
        if (!this.eventData) {
            console.warn('Event data not loaded yet');
            return null;
        }

        let events = [];

        if (category) {
            if (this.eventData[category]) {
                if (Array.isArray(this.eventData[category])) {
                    events = this.eventData[category];
                } else {
                    for (const subcategory of Object.values(this.eventData[category])) {
                        if (Array.isArray(subcategory)) {
                            events.push(...subcategory);
                        }
                    }
                }
            }
        } else {
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

        if (weight !== null) {
            events = events.filter(event => (event.weight || 5) >= weight);
        }

        if (events.length === 0) return null;

        const totalWeight = events.reduce((sum, event) => sum + (event.weight || 5), 0);
        let random = Math.random() * totalWeight;

        for (const event of events) {
            random -= (event.weight || 5);
            if (random <= 0) {
                return event;
            }
        }

        return events[0];
    }

    getEventById(eventId) {
        if (!this.eventData) return null;

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
            for (const subcategory of Object.values(this.eventData[category])) {
                if (Array.isArray(subcategory)) {
                    events.push(...subcategory);
                }
            }
        }

        return events;
    }

    integrateWithResearchSystem() {
        const researchInstance = window.GameEngine?.systems?.research;
        if (researchInstance && typeof researchInstance.setResearchDatabase === 'function' && this.researchData) {
            researchInstance.setResearchDatabase(this.researchData);
            console.log('Integrated research data with Research System');
        }
    }

    integrateWithDiseaseSystem() {
        const diseaseInstance = window.GameEngine?.systems?.diseases;
        if (diseaseInstance && typeof diseaseInstance.setDiseaseDatabase === 'function' && this.diseaseData) {
            diseaseInstance.setDiseaseDatabase(this.diseaseData);
            console.log('Integrated disease data with Disease System');
        }
    }

    integrateWithEventSystem() {
        if (this.eventData) {
            console.log('Event data available via window globals for direct consumption');
        }
    }

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
                    major: (this.diseaseData?.national?.major || []).length
                },
                global: {
                    minor: (this.diseaseData?.global?.minor || []).length,
                    major: (this.diseaseData?.global?.major || []).length
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

        if (this.researchData) {
            for (const [id, research] of Object.entries(this.researchData)) {
                if (!research.name) issues.push(`Research ${id} missing name`);
                if (!research.category) issues.push(`Research ${id} missing category`);
                if (!research.cost) issues.push(`Research ${id} missing cost`);

                if (research.requirements?.prerequisites) {
                    for (const prereq of research.requirements.prerequisites) {
                        if (!this.researchData[prereq]) {
                            issues.push(`Research ${id} has invalid prerequisite: ${prereq}`);
                        }
                    }
                }
            }
        }

        if (this.diseaseData) {
            ['national', 'global'].forEach(scope => {
                if (this.diseaseData[scope]) {
                    ['minor', 'major'].forEach(severity => {
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

if (typeof window !== 'undefined') {
    window.DataIntegrationSystem = DataIntegrationSystem;
}
