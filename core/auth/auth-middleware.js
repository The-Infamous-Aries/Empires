/**
 * Authentication middleware for Empire.2
 * Handles JWT token validation and Socket.IO authentication
 */
class AuthMiddleware {
    constructor(passportConfig, databaseManager) {
        this.passport = passportConfig;
        this.db = databaseManager;
    }

    /**
     * Express middleware to verify JWT token
     */
    verifyToken(req, res, next) {
        try {
            const token = this.extractToken(req);
            
            if (!token) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const decoded = this.passport.verifyJWT(token);
            if (!decoded) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            req.user = decoded;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({ error: 'Authentication failed' });
        }
    }

    /**
     * Optional authentication middleware (doesn't fail if no token)
     */
    optionalAuth(req, res, next) {
        try {
            const token = this.extractToken(req);
            
            if (token) {
                const decoded = this.passport.verifyJWT(token);
                if (decoded) {
                    req.user = decoded;
                }
            }
            
            next();
        } catch (error) {
            // Ignore auth errors in optional auth
            next();
        }
    }

    /**
     * Socket.IO authentication middleware
     */
    authenticateSocket(socket, next) {
        try {
            const token = socket.handshake.auth.token || 
                         socket.handshake.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = this.passport.verifyJWT(token);
            if (!decoded) {
                return next(new Error('Invalid token'));
            }

            socket.userId = decoded.id;
            socket.user = decoded;
            next();
        } catch (error) {
            console.error('Socket auth error:', error);
            next(new Error('Authentication failed'));
        }
    }

    /**
     * Extract token from request
     */
    extractToken(req) {
        // Try multiple sources for token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        
        // Check query params
        if (req.query.token) {
            return req.query.token;
        }
        
        // Check cookies
        if (req.cookies && req.cookies.empire_token) {
            return req.cookies.empire_token;
        }
        
        return null;
    }

    /**
     * Rate limiting middleware
     */
    createRateLimiter(options = {}) {
        const defaultOptions = {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // 100 requests per window
            message: { error: 'Too many requests' },
            standardHeaders: true,
            legacyHeaders: false
        };
        
        return require('express-rate-limit')({ ...defaultOptions, ...options });
    }

    /**
     * CORS middleware configuration
     */
    configureCORS() {
        return {
            origin: process.env.CLIENT_URL || 'http://localhost:8080',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
        };
    }

    /**
     * Session configuration
     */
    getSessionConfig() {
        return {
            secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
        };
    }

    /**
     * Enhanced user data for socket clients
     */
    async getUserForSocket(userId) {
        try {
            const user = await this.db.findUserById(userId);
            if (!user) return null;
            
            return {
                id: user.id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                authProvider: user.authProvider,
                level: user.level || 1,
                isAuthenticated: true
            };
        } catch (error) {
            console.error('Error fetching user for socket:', error);
            return null;
        }
    }

    /**
     * Permission check middleware
     */
    requirePermission(permission) {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({ error: 'Authentication required' });
                }

                const user = await this.db.findUserById(req.user.id);
                if (!user) {
                    return res.status(401).json({ error: 'User not found' });
                }

                // Check user permissions (implement based on your permission system)
                if (this.hasPermission(user, permission)) {
                    next();
                } else {
                    res.status(403).json({ error: 'Insufficient permissions' });
                }
            } catch (error) {
                console.error('Permission check error:', error);
                res.status(500).json({ error: 'Permission check failed' });
            }
        };
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(user, permission) {
        // Implement your permission logic here
        // For now, basic admin check
        if (permission === 'admin') {
            return user.isAdmin || false;
        }
        
        return true; // Default allow for basic permissions
    }

    /**
     * Audit logging middleware
     */
    auditLog(action) {
        return (req, res, next) => {
            const logData = {
                action,
                userId: req.user?.id,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                timestamp: Date.now(),
                path: req.path,
                method: req.method
            };
            
            // Log to your audit system
            console.log('Audit:', JSON.stringify(logData));
            
            next();
        };
    }
}

module.exports = AuthMiddleware;