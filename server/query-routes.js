/**
 * Query Routes - Express-style route handlers for the Query System API.
 *
 * Endpoints:
 *   POST   /api/query        - Execute a GraphQL-like query
 *   GET    /api/query/schema - Get the full schema with permissions
 *   GET    /api/query/audit  - Get the query audit log (admin only)
 *
 * These are designed to be mounted in server.js's /api/ request handler.
 */

const { executeQuery, getSchema, getAuditLog } = require('../core/query-system');

/**
 * Handle all /api/query* requests.
 * Expects req and res like Node.js http server handlers.
 * Returns true if the route was handled, false otherwise.
 */
async function handleQueryRoutes(req, res, world, DatabaseManager_Instance) {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;

    // ── POST /api/query ──────────────────────────────────────────────
    if (pathname === '/api/query' && req.method === 'POST') {
        return await handleExecuteQuery(req, res, world, DatabaseManager_Instance);
    }

    // ── GET /api/query/schema ────────────────────────────────────────
    if (pathname === '/api/query/schema' && req.method === 'GET') {
        const schema = getSchema();
        res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
        });
        res.end(JSON.stringify(schema));
        return true;
    }

    // ── GET /api/query/audit ─────────────────────────────────────────
    if (pathname === '/api/query/audit' && req.method === 'GET') {
        return await handleAuditLog(req, res, world);
    }

    return false;
}

/**
 * POST /api/query - Execute a query with authentication and permission checking.
 */
async function handleExecuteQuery(req, res, world, DatabaseManager_Instance) {
    let body;
    try {
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
    } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request body' }));
        return true;
    }

    const { query, apiKey } = body;

    if (!query || typeof query !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Query is required' }));
        return true;
    }

    if (!apiKey || typeof apiKey !== 'string') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'API key is required' }));
        return true;
    }

    // Authenticate via session cookie to get the user's nation
    const session = getSession(req, world);
    if (!session) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Authentication required' }));
        return true;
    }

    const accountId = session.id;
    const nationId = getNationIdFromAccount(world, accountId);
    if (!nationId) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'No nation associated with this account' }));
        return true;
    }

    // Build context for the query system
    const context = buildQueryContext(world, accountId, nationId, apiKey);

    try {
        const result = await executeQuery(query, context);

        if (!result.success) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
            return true;
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
        return true;
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
        return true;
    }
}

/**
 * GET /api/query/audit - Get the query audit log (admin only).
 */
async function handleAuditLog(req, res, world) {
    const session = getSession(req, world);
    if (!session) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Authentication required' }));
        return true;
    }

    const accountId = session.id;
    const nationId = getNationIdFromAccount(world, accountId);
    if (!nationId) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'No nation associated with this account' }));
        return true;
    }

    // Check admin permission
    const nation = world.state.nations?.[nationId];
    if (!nation || !isNationAdmin(nation)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Admin permission required' }));
        return true;
    }

    const url = new URL(req.url, 'http://localhost');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const records = await getAuditLog(limit, offset);

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
        success: true,
        data: records,
        metadata: {
            returned: records.length,
            limit,
            offset,
            timestamp: Date.now(),
        },
    }));
    return true;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function getSession(req, world) {
    const token = (req.headers.cookie || '')
        .split(';')
        .map((x) => x.trim())
        .find((x) => x.startsWith('session='))
        ?.slice(8);
    if (!token) return null;
    const saved = world.state.sessions?.[require('node:crypto').createHash('sha256').update(token).digest('hex')];
    return saved && saved.expires > world.clock() ? saved : null;
}

function getNationIdFromAccount(world, accountId) {
    const nation = world.state.nations?.[accountId];
    if (nation) return accountId;
    // Try finding nation by playerId
    for (const [id, n] of Object.entries(world.state.nations || {})) {
        if (n.playerId === accountId || n.playerId === session?.id) return id;
    }
    return null;
}

function isNationAdmin(nation) {
    // A nation is admin if it has admin role or is a special admin nation
    return nation.isAdmin === true || nation.role === 'admin';
}

function buildQueryContext(world, accountId, nationId, apiKey) {
    const nation = world.state.nations?.[nationId];
    if (!nation) {
        return {
            apiKey: { permissions: ['public'], prefix: apiKey.substring(0, 8) },
            nationId,
            nationData: {},
            allianceData: { allianceId: null, role: null, protects: [], isExtensionOf: [] },
        };
    }

    const allianceId = nation.allianceId || null;
    let allianceData = {
        allianceId,
        role: nation.allianceRole || null,
        protects: [],
        isExtensionOf: [],
        color: null,
        acronym: null,
        skills: {},
        statistics: {},
    };

    // Check protection relationships
    if (allianceId) {
        const alliance = world.state.alliances?.[allianceId];
        if (alliance) {
            if (alliance.protects) allianceData.protects = alliance.protects;
            if (alliance.isExtensionOf) allianceData.isExtensionOf = alliance.isExtensionOf;
            allianceData.color = alliance.color || null;
            allianceData.acronym = alliance.acronym || null;
            allianceData.skills = alliance.skills || {};
            allianceData.statistics = alliance.statistics || {};
        }
    }

    // Resolve API key permissions - look up the API key in the accounts/system
    const apiKeyObj = resolveApiKey(world, apiKey, nationId);
    const permissions = apiKeyObj ? apiKeyObj.permissions : ['public'];
    const prefix = apiKey.substring(0, 8);

    return {
        apiKey: { permissions, prefix },
        nationId,
        nationData: nation,
        allianceData,
    };
}

function resolveApiKey(world, apiKey, nationId) {
    // Look up the API key in the database
    const { DatabaseManager_Instance } = require('../core/database-manager');
    const db = DatabaseManager_Instance.get('accounts');
    if (!db) return null;

    const accounts = db.query([], {}, ['admin']);
    for (const acc of accounts) {
        if (acc.apiKey === apiKey && acc.nationId === nationId) {
            return {
                permissions: acc.permissions || ['public'],
                prefix: apiKey.substring(0, 8),
            };
        }
    }
    // Fallback: default to public
    return {
        permissions: ['public'],
        prefix: apiKey.substring(0, 8),
    };
}

module.exports = {
    handleQueryRoutes,
};
