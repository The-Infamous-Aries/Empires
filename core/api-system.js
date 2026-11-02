/**
 * API System for Empire Wars
 * Provides read-only query interface with rate limiting.
 * No write/mutation access is allowed for external clients.
 */

class ApiSystem {
    constructor(databaseManager) {
        this.dbManager = databaseManager;
        this.rateLimiter = new RateLimiter();
        this.queryCache = new QueryCache();
        this.auditLogger = new AuditLogger();
        
        this.setupRoutes();
    }

    /**
     * Setup API routes — read-only queries and introspection only
     */
    setupRoutes() {
        this.routes = new Map([
            ['query', this.handleQuery.bind(this)],
            ['introspection', this.handleIntrospection.bind(this)]
        ]);
    }

    /**
     * Main API request handler — read-only
     */
    async processRequest(request) {
        try {
            // Extract API key from headers
            const apiKey = this.extractApiKey(request);
            
            // Rate limiting check
            const identifier = apiKey || (request.ip || 'unknown');
            const rateLimitResult = this.rateLimiter.checkLimit(identifier);
            if (!rateLimitResult.allowed) {
                return this.errorResponse('Rate limit exceeded', 429, rateLimitResult);
            }
            
            // Parse request
            const { operation, query, variables = {} } = this.parseRequest(request);
            
            // Reject any non-read operation
            if (operation !== 'query' && operation !== 'introspection') {
                return this.errorResponse('Operation not allowed', 403, { operation });
            }
            
            // Check cache for queries
            const cacheKey = this.generateCacheKey(query, variables, apiKey);
            if (operation === 'query') {
                const cached = this.queryCache.get(cacheKey);
                if (cached) {
                    return this.successResponse(cached.data, { cached: true });
                }
            }
            
            // Route to appropriate handler
            const handler = this.routes.get(operation);
            if (!handler) {
                return this.errorResponse('Unknown operation type', 400);
            }
            
            // Execute operation
            const result = await handler(query, variables, apiKey, request);
            
            // Cache successful queries
            if (operation === 'query' && result.success) {
                this.queryCache.set(cacheKey, result.data);
            }
            
            // Log request for audit
            this.auditLogger.log({
                operation,
                query,
                apiKey,
                success: result.success,
                timestamp: Date.now(),
                ip: request.ip || 'unknown'
            });
            
            return result;
            
        } catch (error) {
            console.error('API request error:', error);
            return this.errorResponse('Internal server error', 500);
        }
    }

    /**
     * Handle read-only queries via the Query System
     */
    async handleQuery(query, variables, apiKey, request) {
        try {
            // Use the Query System for read-only access
            const { executeQuery } = require('./query-system');
            
            // Build context from API key
            const context = {
                apiKey: apiKey || { permissions: ['public'], prefix: 'unknown' },
                nationId: null,
                nationData: {},
                allianceData: {}
            };
            
            const result = await executeQuery(query, context);
            
            if (result.success) {
                return this.successResponse(result.data, {
                    timestamp: result.metadata.timestamp,
                    query: query
                });
            } else {
                return this.errorResponse(result.error, 400);
            }
        } catch (error) {
            return this.errorResponse(error.message, 500);
        }
    }

    /**
     * Mutations are not supported — external clients cannot write to the game
     */
    async handleMutation(query, variables, apiKey, request) {
        return this.errorResponse('Write operations are not supported via the API', 403);
    }

    /**
     * Subscriptions are not supported
     */
    async handleSubscription(query, variables, apiKey, request) {
        return this.errorResponse('Subscriptions are not supported', 501);
    }

    /**
     * Handle schema introspection (read-only)
     */
    async handleIntrospection(query, variables, apiKey, request) {
        const schema = this.generateSchema();
        return this.successResponse(schema);
    }

    /**
     * Extract API key from request
     */
    extractApiKey(request) {
        // Try multiple sources
        return request.headers?.['x-api-key'] || 
               request.headers?.['authorization']?.replace('Bearer ', '') ||
               request.query?.api_key;
    }

    /**
     * Parse incoming request
     */
    parseRequest(request) {
        if (typeof request === 'string') {
            return { operation: 'query', query: request, variables: {} };
        }
        
        return {
            operation: request.operation || 'query',
            query: request.query || '',
            variables: request.variables || {}
        };
    }

    /**
     * Generate cache key
     */
    generateCacheKey(query, variables, apiKey) {
        const combined = JSON.stringify({ query, variables, apiKey });
        // Use a simple hash instead of btoa (browser-only)
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36).substring(0, 8);
    }

    /**
     * Generate API schema for introspection (read-only domains only)
     */
    generateSchema() {
        const schema = {
            databases: {},
            mutations: [],
            subscriptions: []
        };
        
        // Add database schemas
        for (const [name, db] of this.dbManager.databases) {
            schema.databases[name] = {
                fields: Object.keys(db.schema),
                indexes: Array.from(db.indexes.keys())
            };
        }
        
        return schema;
    }

    /**
     * Create success response
     */
    successResponse(data, meta = {}) {
        return {
            success: true,
            data: data,
            meta: {
                timestamp: Date.now(),
                ...meta
            }
        };
    }

    /**
     * Create error response
     */
    errorResponse(message, status = 400, details = {}) {
        return {
            success: false,
            error: {
                message: message,
                status: status,
                timestamp: Date.now(),
                ...details
            }
        };
    }
}

/**
 * Rate Limiter for API requests
 */
class RateLimiter {
    constructor() {
        this.requests = new Map();
        this.limits = {
            default: { requests: 100, window: 60000 }, // 100 requests per minute
            authenticated: { requests: 1000, window: 60000 }, // 1000 requests per minute
            admin: { requests: 10000, window: 60000 } // 10000 requests per minute
        };
    }

    checkLimit(identifier, tier = 'default') {
        const now = Date.now();
        const limit = this.limits[tier];
        
        if (!this.requests.has(identifier)) {
            this.requests.set(identifier, []);
        }
        
        const userRequests = this.requests.get(identifier);
        
        // Remove old requests outside the window
        const cutoff = now - limit.window;
        const recentRequests = userRequests.filter(time => time > cutoff);
        
        // Check if limit exceeded
        if (recentRequests.length >= limit.requests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: Math.min(...recentRequests) + limit.window
            };
        }
        
        // Add current request
        recentRequests.push(now);
        this.requests.set(identifier, recentRequests);
        
        return {
            allowed: true,
            remaining: limit.requests - recentRequests.length,
            resetTime: now + limit.window
        };
    }
}

/**
 * Query Cache for performance optimization
 */
class QueryCache {
    constructor(maxSize = 1000, ttl = 300000) { // 5 minutes TTL
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return entry;
    }

    set(key, data) {
        // Remove oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    clear() {
        this.cache.clear();
    }
}

/**
 * Audit Logger for API requests
 */
class AuditLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 10000;
    }

    /**
     * Check if browser storage APIs are available
     */
    _hasStorage() {
        return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    }

    /**
     * Safe localStorage setItem — no-op if storage unavailable
     */
    _setItem(key, value) {
        if (!this._hasStorage()) return;
        try { localStorage.setItem(key, value); } catch (_) {}
    }

    log(entry) {
        this.logs.push(entry);
        
        // Keep only recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        
        // Save to storage periodically
        if (this.logs.length % 100 === 0) {
            this.saveToStorage();
        }
    }

    saveToStorage() {
        try {
            this._setItem('empire_api_audit', JSON.stringify(this.logs));
        } catch (error) {
            console.error('Failed to save audit logs:', error);
        }
    }

    getRecentLogs(limit = 100) {
        return this.logs.slice(-limit);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiSystem, RateLimiter, QueryCache, AuditLogger };
}