/**
 * Base Database Class for Empire Wars
 * Provides common functionality for all database types
 */

class BaseDatabase {
    constructor(name, schema = {}) {
        this.name = name;
        this.schema = schema;
        this.data = new Map();
        this.indexes = new Map();
        this.listeners = new Set();
        this.version = 1;
        this.lastModified = Date.now();
        
        this.setupIndexes();
        this.loadData();
    }

    /**
     * Setup database indexes for fast querying
     */
    setupIndexes() {
        // Create indexes based on schema
        for (const [field, config] of Object.entries(this.schema)) {
            if (config.indexed) {
                this.indexes.set(field, new Map());
            }
        }
    }

    /**
     * Insert new record
     */
    async insert(id, record) {
        this.validateRecord(record);
        
        record.id = id;
        record.created = Date.now();
        record.modified = Date.now();
        
        this.data.set(id, record);
        this.updateIndexes(id, record);
        this.lastModified = Date.now();
        
        this.notifyChange('insert', { id, record });
        await this.saveData();
        
        return record;
    }

    /**
     * Update existing record
     */
    async update(id, updates) {
        const existing = this.data.get(id);
        if (!existing) {
            throw new Error(`Record ${id} not found in ${this.name}`);
        }
        
        const updated = { ...existing, ...updates };
        updated.modified = Date.now();
        
        this.validateRecord(updated);
        
        this.data.set(id, updated);
        this.updateIndexes(id, updated);
        this.lastModified = Date.now();
        
        this.notifyChange('update', { id, record: updated, previous: existing });
        await this.saveData();
        
        return updated;
    }

    /**
     * Delete record
     */
    async delete(id) {
        const record = this.data.get(id);
        if (!record) {
            return false;
        }
        
        this.data.delete(id);
        this.removeFromIndexes(id, record);
        this.lastModified = Date.now();
        
        this.notifyChange('delete', { id, record });
        await this.saveData();
        
        return true;
    }

    /**
     * Query records with filters and permissions
     */
    async query(fields = [], filters = {}, permissions = ['public']) {
        let results = Array.from(this.data.values());
        
        // Apply filters
        if (Object.keys(filters).length > 0) {
            results = this.applyFilters(results, filters);
        }
        
        // Apply permission filtering
        results = this.applyPermissions(results, permissions);
        
        // Select only requested fields
        if (fields.length > 0) {
            results = results.map(record => this.selectFields(record, fields));
        }
        
        return results;
    }

    /**
     * Find single record by ID
     */
    findById(id, permissions = ['public']) {
        const record = this.data.get(id);
        if (!record) {
            return null;
        }
        
        const filtered = this.applyPermissions([record], permissions);
        return filtered.length > 0 ? filtered[0] : null;
    }

    /**
     * Find records using index
     */
    findByIndex(field, value, permissions = ['public']) {
        const index = this.indexes.get(field);
        if (!index) {
            throw new Error(`No index found for field ${field}`);
        }
        
        const ids = index.get(value) || [];
        const records = ids.map(id => this.data.get(id)).filter(Boolean);
        
        return this.applyPermissions(records, permissions);
    }
}
    /**
     * Validate record against schema
     */
    validateRecord(record) {
        for (const [field, config] of Object.entries(this.schema)) {
            const value = record[field];
            
            // Required field check
            if (config.required && (value === undefined || value === null)) {
                throw new Error(`Required field ${field} missing in ${this.name}`);
            }
            
            // Type check
            if (value !== undefined && config.type && typeof value !== config.type) {
                throw new Error(`Field ${field} must be of type ${config.type}`);
            }
            
            // Custom validation
            if (value !== undefined && config.validate && !config.validate(value)) {
                throw new Error(`Field ${field} failed validation in ${this.name}`);
            }
        }
    }

    /**
     * Update indexes when record changes
     */
    updateIndexes(id, record) {
        for (const [field, index] of this.indexes) {
            const value = record[field];
            if (value !== undefined) {
                if (!index.has(value)) {
                    index.set(value, new Set());
                }
                index.get(value).add(id);
            }
        }
    }

    /**
     * Remove record from indexes
     */
    removeFromIndexes(id, record) {
        for (const [field, index] of this.indexes) {
            const value = record[field];
            if (value !== undefined && index.has(value)) {
                index.get(value).delete(id);
                if (index.get(value).size === 0) {
                    index.delete(value);
                }
            }
        }
    }

    /**
     * Apply query filters
     */
    applyFilters(records, filters) {
        return records.filter(record => {
            for (const [field, condition] of Object.entries(filters)) {
                if (!this.matchesCondition(record[field], condition)) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Check if value matches filter condition
     */
    matchesCondition(value, condition) {
        if (typeof condition === 'object' && condition !== null) {
            if (condition.$eq !== undefined) return value === condition.$eq;
            if (condition.$ne !== undefined) return value !== condition.$ne;
            if (condition.$gt !== undefined) return value > condition.$gt;
            if (condition.$gte !== undefined) return value >= condition.$gte;
            if (condition.$lt !== undefined) return value < condition.$lt;
            if (condition.$lte !== undefined) return value <= condition.$lte;
            if (condition.$in !== undefined) return condition.$in.includes(value);
            if (condition.$nin !== undefined) return !condition.$nin.includes(value);
            if (condition.$regex !== undefined) return new RegExp(condition.$regex).test(value);
        }
        
        return value === condition;
    }

    /**
     * Apply permission filtering
     */
    applyPermissions(records, permissions) {
        if (permissions.includes('admin')) {
            return records; // Admin sees everything
        }
        
        return records.filter(record => {
            return this.hasPermissionToView(record, permissions);
        });
    }

    /**
     * Check if permissions allow viewing this record
     */
    hasPermissionToView(record, permissions) {
        // Base implementation - override in subclasses
        return true;
    }

    /**
     * Select only specified fields from record
     */
    selectFields(record, fields) {
        const selected = {};
        for (const field of fields) {
            if (record[field] !== undefined) {
                selected[field] = record[field];
            }
        }
        return selected;
    }

    /**
     * Subscribe to database changes
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify listeners of changes
     */
    notifyChange(operation, data) {
        for (const listener of this.listeners) {
            try {
                listener(operation, data);
            } catch (error) {
                console.error('Error in database listener:', error);
            }
        }
    }

    /**
     * Save data to storage
     */
    async saveData() {
        try {
            const serialized = {
                version: this.version,
                lastModified: this.lastModified,
                data: Object.fromEntries(this.data)
            };
            
            localStorage.setItem(`empire_db_${this.name}`, JSON.stringify(serialized));
        } catch (error) {
            console.error(`Failed to save ${this.name} database:`, error);
        }
    }

    /**
     * Load data from storage
     */
    loadData() {
        try {
            const stored = localStorage.getItem(`empire_db_${this.name}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.version = parsed.version || 1;
                this.lastModified = parsed.lastModified || Date.now();
                
                // Restore data
                for (const [id, record] of Object.entries(parsed.data || {})) {
                    this.data.set(id, record);
                    this.updateIndexes(id, record);
                }
            }
        } catch (error) {
            console.error(`Failed to load ${this.name} database:`, error);
        }
    }

    /**
     * Get database statistics
     */
    getStats() {
        return {
            name: this.name,
            recordCount: this.data.size,
            lastModified: this.lastModified,
            version: this.version,
            indexes: Object.keys(this.indexes)
        };
    }

    /**
     * Clear all data
     */
    clear() {
        this.data.clear();
        for (const index of this.indexes.values()) {
            index.clear();
        }
        this.lastModified = Date.now();
        this.saveData();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BaseDatabase };
}