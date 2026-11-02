/**
 * Base Database Class for Empire Wars
 * Provides common functionality for all database types
 *
 * Persistence: File-based via saves/db/<domain>.json (PersistStore pattern)
 * Every mutating operation (insert/update/delete) writes to disk immediately.
 */

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', '..', 'saves', 'db');

function ensureDbDir() {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
}

try { ensureDbDir(); } catch (_) {}

class BaseDatabase {
    constructor(name, schema = {}) {
        this.name = name;
        this.schema = schema;
        this.data = new Map();       // id -> record
        this.indexes = new Map();    // field -> Map(value -> Set of ids)
        this.listeners = new Set();  // change listeners
        this.version = 1;
        this.lastModified = Date.now();
        this.file = path.join(DB_DIR, `${name}.json`);

        this.setupIndexes();
        this.loadData();
    }

    // ─── Indexes ──────────────────────────────────────────────────────────

    setupIndexes() {
        for (const [field, config] of Object.entries(this.schema)) {
            if (config.indexed) {
                this.indexes.set(field, new Map());
            }
        }
    }

    updateIndexes(id, record) {
        for (const [field, index] of this.indexes) {
            const value = record[field];
            if (value !== undefined && value !== null) {
                if (!index.has(value)) index.set(value, new Set());
                index.get(value).add(id);
            }
        }
    }

    removeFromIndexes(id, record) {
        for (const [field, index] of this.indexes) {
            const value = record[field];
            if (value !== undefined && value !== null && index.has(value)) {
                index.get(value).delete(id);
                if (index.get(value).size === 0) index.delete(value);
            }
        }
    }

    // ─── CRUD Operations ──────────────────────────────────────────────────

    async insert(id, record) {
        this.validateRecord(record);

        record.id = id;
        record.created = Date.now();
        record.modified = Date.now();

        const previous = this.data.get(id);
        if (previous) this.removeFromIndexes(id, previous);
        this.data.set(id, record);
        this.updateIndexes(id, record);
        this.lastModified = Date.now();

        this.notifyChange('insert', { id, record });
        await this.saveData();

        return record;
    }

    async update(id, updates) {
        const existing = this.data.get(id);
        if (!existing) {
            throw new Error(`Record ${id} not found in ${this.name}`);
        }

        const updated = { ...existing, ...updates };
        updated.modified = Date.now();

        this.validateRecord(updated);

        this.removeFromIndexes(id, existing);
        this.data.set(id, updated);
        this.updateIndexes(id, updated);
        this.lastModified = Date.now();

        this.notifyChange('update', { id, record: updated, previous: existing });
        await this.saveData();

        return updated;
    }

    async delete(id) {
        const record = this.data.get(id);
        if (!record) return false;

        this.data.delete(id);
        this.removeFromIndexes(id, record);
        this.lastModified = Date.now();

        this.notifyChange('delete', { id, record });
        await this.saveData();

        return true;
    }

    // ─── Query ────────────────────────────────────────────────────────────

    async query(fields = [], filters = {}, permissions = ['public']) {
        let results = Array.from(this.data.values());

        if (Object.keys(filters).length > 0) {
            results = this.applyFilters(results, filters);
        }

        results = this.applyPermissions(results, permissions);

        if (fields.length > 0) {
            results = results.map(record => this.selectFields(record, fields));
        }

        return results;
    }

    findById(id, permissions = ['public']) {
        const record = this.data.get(id);
        if (!record) return null;
        const filtered = this.applyPermissions([record], permissions);
        return filtered.length > 0 ? filtered[0] : null;
    }

    findByIndex(field, value, permissions = ['public']) {
        const index = this.indexes.get(field);
        if (!index) {
            throw new Error(`No index found for field ${field}`);
        }
        const ids = index.get(value) || [];
        const records = Array.from(ids, id => this.data.get(id)).filter(Boolean);
        return this.applyPermissions(records, permissions);
    }

    // ─── Validation & Filtering ──────────────────────────────────────────

    validateRecord(record) {
        for (const [field, config] of Object.entries(this.schema)) {
            const value = record[field];
            if (config.required && (value === undefined || value === null)) {
                throw new Error(`Required field ${field} missing in ${this.name}`);
            }
            if (value !== undefined && config.type && typeof value !== config.type) {
                throw new Error(`Field ${field} must be of type ${config.type}`);
            }
            if (value !== undefined && config.validate && !config.validate(value)) {
                throw new Error(`Field ${field} failed validation in ${this.name}`);
            }
        }
    }

    applyFilters(records, filters) {
        return records.filter(record => {
            for (const [field, condition] of Object.entries(filters)) {
                if (!this.matchesCondition(record[field], condition)) return false;
            }
            return true;
        });
    }

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

    applyPermissions(records, permissions) {
        if (permissions.includes('admin')) return records;
        return records.filter(record => this.hasPermissionToView(record, permissions));
    }

    hasPermissionToView(record, permissions) {
        return true; // override in subclasses
    }

    selectFields(record, fields) {
        const selected = {};
        for (const field of fields) {
            if (record[field] !== undefined) selected[field] = record[field];
        }
        return selected;
    }

    // ─── Subscriptions ────────────────────────────────────────────────────

    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyChange(operation, data) {
        for (const listener of this.listeners) {
            try { listener(operation, data); } catch (error) {
                console.error('Error in database listener:', error);
            }
        }
    }

    // ─── File Persistence ────────────────────────────────────────────────

    async saveData() {
        try {
            ensureDbDir();
            const serialized = {
                version: this.version,
                lastModified: this.lastModified,
                record_count: this.data.size,
                data: Object.fromEntries(this.data)
            };
            const tmpFile = this.file + '.tmp';
            fs.writeFileSync(tmpFile, JSON.stringify(serialized, null, 2), 'utf8');
            // Atomic replace: copy then unlink (Windows-safe)
            if (fs.existsSync(tmpFile)) {
                fs.copyFileSync(tmpFile, this.file);
                try { fs.unlinkSync(tmpFile); } catch (_) {}
            }
        } catch (error) {
            console.error(`Failed to save ${this.name} database:`, error);
        }
    }

    loadData() {
        try {
            if (!fs.existsSync(this.file)) {
                console.log(`[${this.name}] no existing file — starting fresh`);
                return;
            }
            const raw = fs.readFileSync(this.file, 'utf8');
            const parsed = JSON.parse(raw);
            this.version = parsed.version || 1;
            this.lastModified = parsed.lastModified || Date.now();

            for (const [id, record] of Object.entries(parsed.data || {})) {
                this.data.set(id, record);
                this.updateIndexes(id, record);
            }
            console.log(`[${this.name}] loaded ${this.data.size} records`);
        } catch (error) {
            console.error(`Failed to load ${this.name} database:`, error);
        }
    }

    // ─── Stats & Utility ─────────────────────────────────────────────────

    getStats() {
        return {
            name: this.name,
            recordCount: this.data.size,
            lastModified: this.lastModified,
            version: this.version,
            indexes: Array.from(this.indexes.keys())
        };
    }

    getSize() {
        return this.data.size;
    }

    clear() {
        this.data.clear();
        for (const index of this.indexes.values()) index.clear();
        this.lastModified = Date.now();
        this.saveData();
    }

    flushSync() {
        // Force synchronous write (used at shutdown)
        this.saveData();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BaseDatabase };
}
