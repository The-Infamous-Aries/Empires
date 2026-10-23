/**
 * Nation Database - Handles nation data and statistics
 */

class NationDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            name: { type: 'string', required: true, indexed: true },
            playerId: { type: 'string', required: true, indexed: true },
            leaderName: { type: 'string', required: true },
            government: { type: 'string', indexed: true },
            religion: { type: 'string', indexed: true },
            allianceId: { type: 'string', indexed: true },
            
            // Core stats
            population: { type: 'number', default: 0, indexed: true },
            gdp: { type: 'number', default: 0, indexed: true },
            land: { type: 'number', default: 1000 },
            infrastructure: { type: 'number', default: 1000 },
            technology: { type: 'number', default: 0 },
            
            // Resources
            money: { type: 'number', default: 15000000 },
            materials: { type: 'number', default: 0 },
            food: { type: 'number', default: 0 },
            energy: { type: 'number', default: 0 },
            
            // Military
            soldiers: { type: 'number', default: 0 },
            tanks: { type: 'number', default: 0 },
            aircraft: { type: 'number', default: 0 },
            ships: { type: 'number', default: 0 },
            
            // Status
            isActive: { type: 'boolean', default: true, indexed: true },
            isVacation: { type: 'boolean', default: false, indexed: true },
            lastActive: { type: 'number', indexed: true },
            founded: { type: 'number', default: Date.now, indexed: true },
            
            // Position
            x: { type: 'number', default: 0 },
            y: { type: 'number', default: 0 },
            
            // Advanced stats
            warScore: { type: 'number', default: 0, indexed: true },
            projects: { type: 'object', default: {} },
            improvements: { type: 'object', default: {} },
            policies: { type: 'object', default: {} }
        };
        
        super('nations', schema);
    }

    /**
     * Create new nation
     */
    async createNation(nationData) {
        const id = this.generateNationId();
        
        const nation = {
            ...nationData,
            id: id,
            founded: Date.now(),
            lastActive: Date.now(),
            isActive: true,
            isVacation: false,
            
            // Starting resources from config
            money: GameConfig.INITIAL_RESOURCES.money,
            materials: GameConfig.INITIAL_RESOURCES.materials,
            food: GameConfig.INITIAL_RESOURCES.food,
            energy: GameConfig.INITIAL_RESOURCES.energy,
            technology: GameConfig.INITIAL_RESOURCES.technology,
            
            // Starting values
            population: GameConfig.INITIAL_POPULATION,
            gdp: GameConfig.INITIAL_GDP,
            land: GameConfig.INITIAL_LAND,
            infrastructure: GameConfig.INITIAL_INFRA,
            
            // Random starting position
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            
            // Empty collections
            projects: {},
            improvements: {},
            policies: {}
        };
        
        return await this.insert(id, nation);
    }

    /**
     * Update nation statistics
     */
    async updateNationStats(nationId, updates) {
        const nation = this.findById(nationId, ['admin']);
        if (!nation) {
            throw new Error('Nation not found');
        }
        
        // Calculate derived stats
        const calculatedUpdates = this.calculateDerivedStats({ ...nation, ...updates });
        
        return await this.update(nationId, { ...updates, ...calculatedUpdates });
    }

    /**
     * Calculate derived statistics
     */
    calculateDerivedStats(nation) {
        const updates = {};
        
        // Calculate population
        const ageFactor = Math.max(1, this.getNationAgeDays(nation) / 30);
        updates.population = nation.land * nation.infrastructure * nation.technology * ageFactor;
        
        // Calculate GDP
        const taxableIncome = (nation.infrastructure / 50) * updates.population * nation.technology;
        updates.gdp = taxableIncome;
        
        // Update last active
        updates.lastActive = Date.now();
        
        return updates;
    }

    /**
     * Get nation age in days
     */
    getNationAgeDays(nation) {
        return Math.floor((Date.now() - nation.founded) / (24 * 60 * 60 * 1000));
    }

    /**
     * Find nations by alliance
     */
    async findByAlliance(allianceId, permissions = ['public']) {
        return this.findByIndex('allianceId', allianceId, permissions);
    }

    /**
     * Get top nations by various metrics
     */
    async getTopNations(metric = 'gdp', limit = 50, permissions = ['public']) {
        const nations = await this.query([], { isActive: true }, permissions);
        
        return nations
            .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
            .slice(0, limit);
    }

    /**
     * Search nations by name
     */
    async searchNations(namePattern, permissions = ['public']) {
        const nations = await this.query([], { isActive: true }, permissions);
        
        const regex = new RegExp(namePattern, 'i');
        return nations.filter(nation => regex.test(nation.name));
    }

    /**
     * Apply permission filtering for nation data
     */
    hasPermissionToView(record, permissions) {
        // Admin can see everything
        if (permissions.includes('admin') || permissions.includes('game_data')) {
            return true;
        }
        
        // Public can see active nations
        if (permissions.includes('public')) {
            return record.isActive && !record.isVacation;
        }
        
        return false;
    }

    /**
     * Select fields based on permissions
     */
    selectFields(record, fields, permissions = ['public']) {
        const publicFields = [
            'id', 'name', 'leaderName', 'government', 'religion', 'allianceId',
            'population', 'gdp', 'land', 'infrastructure', 'technology',
            'warScore', 'founded', 'lastActive', 'x', 'y'
        ];
        const privateFields = [
            'playerId', 'money', 'materials', 'food', 'energy',
            'soldiers', 'tanks', 'aircraft', 'ships', 'projects', 'improvements', 'policies'
        ];
        
        if (permissions.includes('admin') || permissions.includes('game_data')) {
            return super.selectFields(record, fields);
        }
        
        // Filter out private fields for non-admin users
        const allowedFields = fields.length === 0 ? publicFields : 
            fields.filter(field => publicFields.includes(field) && !privateFields.includes(field));
        
        return super.selectFields(record, allowedFields);
    }

    /**
     * Generate unique nation ID
     */
    generateNationId() {
        return 'nation_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NationDatabase };
}