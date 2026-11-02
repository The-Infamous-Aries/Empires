/**
 * Persistence Initialization for Empire Wars
 * Guarantees: on startup, ALL data loads from saves/db/*.json.
 *             On shutdown, ALL data is flushed to disk.
 *             Nothing is ever lost between sessions.
 */

const { DatabaseManager_Instance: dbManager } = require('./database-manager');
const DataPersistence = require('./data-persistence');

let isInitialized = false;
let initializing = false;

/**
 * Initialize persistence: load all databases from disk.
 * Call this once when the game/server starts.
 */
async function initializePersistence() {
    if (isInitialized) return;

    // Prevent double-initialization race condition
    if (initializing) {
        // Wait for the in-flight initialization to complete
        while (initializing && !isInitialized) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        return;
    }

    initializing = true;

    console.log('[Persistence] Loading all data from saves/db/...');

    try {
        const results = await DataPersistence.loadAll();
        let totalRecords = 0;
        for (const [domain, count] of Object.entries(results)) {
            totalRecords += count;
            console.log(`[Persistence] ${domain}: ${count} records loaded`);
        }
        console.log(`[Persistence] Total: ${totalRecords} records loaded from disk`);

        // Wire auto-save events
        DataPersistence.wireAutoSave();

        isInitialized = true;
        console.log('[Persistence] Initialization complete');
    } catch (error) {
        console.error('[Persistence] Initialization failed:', error);
        throw error;
    } finally {
        initializing = false;
    }
}

/**
 * Shutdown persistence: flush all databases to disk.
 * Call this before the process exits.
 */
async function shutdownPersistence() {
    if (!isInitialized) return;

    console.log('[Persistence] Flushing all data to saves/db/...');

    try {
        const results = await DataPersistence.saveAll();
        for (const [domain, status] of Object.entries(results)) {
            console.log(`[Persistence] ${domain}: ${status}`);
        }
        console.log('[Persistence] All data flushed to disk');
    } catch (error) {
        console.error('[Persistence] Shutdown flush failed:', error);
    } finally {
        isInitialized = false;
    }
}

/**
 * Get persistence status for monitoring
 */
function getPersistenceStatus() {
    return {
        initialized: isInitialized,
        databases: dbManager.getDatabasesStatus()
    };
}

// ─── Auto-shutdown on process exit (Node.js only) ──────────────────────

if (typeof process !== 'undefined' && process.on) {
    // Handle graceful shutdown on SIGINT/SIGTERM
    for (const signal of ['SIGINT', 'SIGTERM']) {
        process.on(signal, async () => {
            console.log(`\n[Persistence] Received ${signal}, shutting down...`);
            await shutdownPersistence();
            process.exit(0);
        });
    }

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
        console.error('[Persistence] Uncaught exception:', error);
        await shutdownPersistence();
        process.exit(1);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', async (reason) => {
        console.error('[Persistence] Unhandled rejection:', reason);
        await shutdownPersistence();
        process.exit(1);
    });
}

// ─── Export ─────────────────────────────────────────────────────────────

module.exports = {
    initializePersistence,
    shutdownPersistence,
    getPersistenceStatus
};

// Make available globally in browser context
if (typeof window !== 'undefined') {
    window.PersistenceInit = module.exports;
}
