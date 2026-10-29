/**
 * PersistStore — write-through domain databases backed by individual JSON files.
 *
 * One PersistStore instance manages ONE domain (e.g. "nations").
 * Every mutating operation (set / delete) writes the file immediately after
 * updating the in-memory Map, so a crash at any moment loses at most the
 * single in-flight write (< 1 ms window).
 *
 * File location:  <root>/saves/db/<domain>.json
 * File format:    { "version": 1, "updated": <timestamp>, "records": { <id>: <object>, … } }
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'saves', 'db');

/** Ensure the db directory exists — called before every write so late starts are safe. */
function ensureDbDir() {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
}

// Best-effort create at module load; writes re-create it if needed.
try { ensureDbDir(); } catch (_) {}

class PersistStore {
    /**
     * @param {string} domain  e.g. 'nations', 'players', 'alliances'
     */
    constructor(domain) {
        this.domain  = domain;
        this.file    = path.join(DB_DIR, `${domain}.json`);
        this._data   = new Map();   // id -> record
        this._dirty  = false;
        this._writing = false;
        this._writeQueued = false;

        this._load();
    }

    // ─── Public API ──────────────────────────────────────────────────────────

    /** Return a single record by id, or undefined. */
    get(id) {
        return this._data.get(String(id));
    }

    /** Return true if id exists. */
    has(id) {
        return this._data.has(String(id));
    }

    /** Iterate all records — returns an iterator of [id, record] pairs. */
    entries() {
        return this._data.entries();
    }

    /** Return an array of all records. */
    values() {
        return Array.from(this._data.values());
    }

    /** Return an array of all ids. */
    keys() {
        return Array.from(this._data.keys());
    }

    /** Number of records. */
    get size() {
        return this._data.size;
    }

    /**
     * Create or fully replace a record.
     * The record must already have an `id` field.
     * Returns the stored record.
     */
    set(record) {
        if (!record || record.id === undefined || record.id === null) {
            throw new Error(`[PersistStore:${this.domain}] record.id is required`);
        }
        const id = String(record.id);
        record.id = id;           // normalize to string
        record._updated = Date.now();
        this._data.set(id, record);
        this._scheduleWrite();
        return record;
    }

    /**
     * Merge updates into an existing record.
     * @param {string|number} id
     * @param {object}        updates  — partial fields to merge
     * @returns {object} updated record
     * @throws if record does not exist
     */
    update(id, updates) {
        id = String(id);
        const existing = this._data.get(id);
        if (!existing) {
            throw new Error(`[PersistStore:${this.domain}] record '${id}' not found`);
        }
        const merged = { ...existing, ...updates, id, _updated: Date.now() };
        this._data.set(id, merged);
        this._scheduleWrite();
        return merged;
    }

    /**
     * Delete a record.
     * Returns true if it existed, false otherwise.
     */
    delete(id) {
        id = String(id);
        const existed = this._data.delete(id);
        if (existed) this._scheduleWrite();
        return existed;
    }

    /**
     * Find the first record matching a predicate.
     * @param {Function} predFn  (record) => boolean
     */
    find(predFn) {
        for (const rec of this._data.values()) {
            if (predFn(rec)) return rec;
        }
        return undefined;
    }

    /**
     * Return all records matching a predicate.
     * @param {Function} predFn  (record) => boolean
     */
    filter(predFn) {
        const results = [];
        for (const rec of this._data.values()) {
            if (predFn(rec)) results.push(rec);
        }
        return results;
    }

    /** Force a synchronous flush to disk (used at shutdown). */
    flushSync() {
        this._writeSync();
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    _load() {
        try {
            if (!fs.existsSync(this.file)) {
                console.log(`[PersistStore:${this.domain}] no existing file — starting fresh`);
                return;
            }
            const raw  = fs.readFileSync(this.file, 'utf8');
            const json = JSON.parse(raw);
            const records = json.records || {};
            for (const [id, rec] of Object.entries(records)) {
                this._data.set(id, rec);
            }
            console.log(`[PersistStore:${this.domain}] loaded ${this._data.size} records`);
        } catch (err) {
            console.error(`[PersistStore:${this.domain}] load error — starting fresh:`, err.message);
        }
    }

    /** Schedule an async write, coalescing rapid successive mutations. */
    _scheduleWrite() {
        this._dirty = true;
        if (this._writing) {
            // A write is in flight; queue one more to run after it finishes.
            this._writeQueued = true;
            return;
        }
        this._doWrite();
    }

    _doWrite() {
        this._writing = true;
        this._writeQueued = false;
        const payload = this._serialize();
        const tmpFile = this.file + '.tmp';

        // Ensure directory exists before every write (handles late-start edge cases).
        try { ensureDbDir(); } catch (_) {}

        fs.writeFile(tmpFile, payload, 'utf8', (err) => {
            if (err) {
                console.error(`[PersistStore:${this.domain}] write error:`, err.message);
            } else {
                // Windows-safe atomic replace: copy then unlink the tmp file.
                // fs.renameSync can fail with ENOENT on Windows when crossing
                // drive boundaries or when the target doesn't yet exist.
                // Guard with existsSync: a concurrent flushSync() may have already
                // consumed and deleted the .tmp file, in which case the data is
                // already safely on disk and we can skip this step.
                try {
                    if (fs.existsSync(tmpFile)) {
                        fs.copyFileSync(tmpFile, this.file);
                        try { fs.unlinkSync(tmpFile); } catch (_) {}
                    }
                    this._dirty = false;
                } catch (copyErr) {
                    console.error(`[PersistStore:${this.domain}] replace error:`, copyErr.message);
                    // Last resort: direct overwrite
                    try { fs.writeFileSync(this.file, payload, 'utf8'); this._dirty = false; } catch (_) {}
                }
            }
            this._writing = false;
            if (this._writeQueued) {
                this._doWrite();
            }
        });
    }

    _writeSync() {
        const payload = this._serialize();
        try {
            ensureDbDir();
            // Write directly to the final file — no .tmp dance needed here because
            // this call is synchronous and there is no window where a concurrent
            // async _doWrite could race against it and delete a shared .tmp file.
            fs.writeFileSync(this.file, payload, 'utf8');
            this._dirty = false;
        } catch (err) {
            console.error(`[PersistStore:${this.domain}] sync write error:`, err.message);
        }
    }

    _serialize() {
        const records = {};
        for (const [id, rec] of this._data.entries()) {
            records[id] = rec;
        }
        return JSON.stringify({ version: 1, domain: this.domain, updated: Date.now(), records }, null, 2);
    }
}

// ─── ID generation ───────────────────────────────────────────────────────────

/**
 * Generate a random 9-digit numeric string ID.
 * Statistically unique for game-scale data (<1 million records).
 * Format matches the requirement: e.g. "847291630"
 */
function generateId() {
    // Random integer in [100000000, 999999999]
    return String(Math.floor(100000000 + Math.random() * 900000000));
}

/**
 * Generate a guaranteed-unique ID against an existing PersistStore.
 * Retries on the extremely rare collision.
 */
function generateUniqueId(store) {
    let id;
    let attempts = 0;
    do {
        id = generateId();
        attempts++;
        if (attempts > 100) throw new Error('Failed to generate unique ID after 100 attempts');
    } while (store.has(id));
    return id;
}

// ─── Module export ───────────────────────────────────────────────────────────

module.exports = { PersistStore, generateId, generateUniqueId };
