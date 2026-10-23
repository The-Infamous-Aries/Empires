const express = require('express');
const passport = require('passport');
const rateLimit = require('express-rate-limit');

/**
 * Authentication routes for Empire.2
 * Handles local login, OAuth callbacks, and token management
 */
class AuthRoutes {
    constructor(passportConfig, databaseManager) {
        this.router = express.Router();
        this.passport = passportConfig;
        this.db = databaseManager;
        this.setupRateLimit();
        this.setupRoutes();
    }

    setupRateLimit() {
        // Rate limiting for authentication endpoints
        this.authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // 5 attempts per window
            message: { error: 'Too many authentication attempts, try again later' },
            standardHeaders: true,
            legacyHeaders: false
        });

        // Rate limiting for registration
        this.registerLimiter = rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 3, // 3 registration attempts per hour
            message: { error: 'Too many registration attempts, try again later' }
        });
    }

    setupRoutes() {
        // Local login
        this.router.post('/login', this.authLimiter, async (req, res, next) => {
            passport.authenticate('local', (err, user, info) => {
                if (err) {
                    return res.status(500).json({ error: 'Authentication error' });
                }
                
                if (!user) {
                    return res.status(401).json({ 
                        error: info.message || 'Authentication failed' 
                    });
                }

                // Generate JWT token
                const token = this.passport.generateJWT(user);
                
                res.json({
                    success: true,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        profilePicture: user.profilePicture,
                        authProvider: user.authProvider
                    },
                    token: token
                });
            })(req, res, next);
        });

        // Local registration
        this.router.post('/register', this.registerLimiter, async (req, res) => {
            try {
                const { username, email, password } = req.body;

                // Validation
                if (!username || !email || !password) {
                    return res.status(400).json({ 
                        error: 'Username, email, and password are required' 
                    });
                }

                if (password.length < 8) {
                    return res.status(400).json({ 
                        error: 'Password must be at least 8 characters' 
                    });
                }

                // Check if user already exists
                const existingUser = await this.db.findUserByUsername(username) || 
                                   await this.db.findUserByEmail(email);
                
                if (existingUser) {
                    return res.status(409).json({ 
                        error: 'Username or email already exists' 
                    });
                }

                // Create new user
                const passwordHash = await this.passport.hashPassword(password);
                const newUser = {
                    username: username,
                    email: email,
                    passwordHash: passwordHash,
                    authProvider: 'local',
                    emailVerified: false,
                    joinDate: Date.now(),
                    lastLogin: Date.now()
                };

                const userId = await this.db.createUser(newUser);
                newUser.id = userId;

                // Generate JWT token
                const token = this.passport.generateJWT(newUser);

                res.json({
                    success: true,
                    user: {
                        id: newUser.id,
                        username: newUser.username,
                        email: newUser.email,
                        authProvider: newUser.authProvider
                    },
                    token: token
                });

            } catch (error) {
                console.error('Registration error:', error);
                res.status(500).json({ error: 'Registration failed' });
            }
        });

        // Google OAuth routes
        this.router.get('/google', 
            passport.authenticate('google', { scope: ['profile', 'email'] })
        );

        this.router.get('/google/callback',
            passport.authenticate('google', { session: false }),
            (req, res) => {
                // Generate JWT token
                const token = this.passport.generateJWT(req.user);
                
                // Redirect to the root with the token in the query string.
                // LoginSystem._checkOAuthCallback() reads ?token= from any URL.
                // We land at / so all relative script paths resolve correctly.
                res.redirect(`${process.env.CLIENT_URL}/?token=${token}`);
            }
        );

        // Discord OAuth routes
        this.router.get('/discord',
            passport.authenticate('discord', { scope: ['identify', 'email'] })
        );

        this.router.get('/discord/callback',
            passport.authenticate('discord', { session: false }),
            (req, res) => {
                // Generate JWT token
                const token = this.passport.generateJWT(req.user);
                
                // Redirect to the root with the token in the query string.
                // LoginSystem._checkOAuthCallback() reads ?token= from any URL.
                // We land at / so all relative script paths resolve correctly.
                res.redirect(`${process.env.CLIENT_URL}/?token=${token}`);
            }
        );

        // Token verification
        this.router.post('/verify', async (req, res) => {
            try {
                const { token } = req.body;
                
                if (!token) {
                    return res.status(400).json({ error: 'Token required' });
                }

                const decoded = this.passport.verifyJWT(token);
                if (!decoded) {
                    return res.status(401).json({ error: 'Invalid token' });
                }

                // Get fresh user data
                const user = await this.db.findUserById(decoded.id);
                if (!user) {
                    return res.status(401).json({ error: 'User not found' });
                }

                res.json({
                    success: true,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        profilePicture: user.profilePicture,
                        authProvider: user.authProvider
                    }
                });

            } catch (error) {
                console.error('Token verification error:', error);
                res.status(500).json({ error: 'Token verification failed' });
            }
        });

        // Logout
        this.router.post('/logout', (req, res) => {
            // For JWT, logout is handled client-side by removing the token
            // Could implement token blacklisting here if needed
            res.json({ success: true, message: 'Logged out successfully' });
        });

        // Account linking endpoints
        this.router.post('/link/google', this.requireAuth.bind(this), (req, res) => {
            // Redirect to Google OAuth with state parameter containing user ID
            const state = Buffer.from(JSON.stringify({ 
                userId: req.user.id, 
                action: 'link' 
            })).toString('base64');
            
            const redirectUrl = `/auth/google?state=${state}`;
            res.json({ redirectUrl });
        });

        this.router.post('/link/discord', this.requireAuth.bind(this), (req, res) => {
            // Redirect to Discord OAuth with state parameter containing user ID
            const state = Buffer.from(JSON.stringify({ 
                userId: req.user.id, 
                action: 'link' 
            })).toString('base64');
            
            const redirectUrl = `/auth/discord?state=${state}`;
            res.json({ redirectUrl });
        });

        // Get user profile
        this.router.get('/profile', this.requireAuth.bind(this), async (req, res) => {
            try {
                const user = await this.db.findUserById(req.user.id);
                
                res.json({
                    success: true,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        profilePicture: user.profilePicture,
                        authProvider: user.authProvider,
                        linkedAccounts: {
                            google: !!user.googleId,
                            discord: !!user.discordId
                        },
                        joinDate: user.joinDate,
                        lastLogin: user.lastLogin
                    }
                });
            } catch (error) {
                console.error('Profile fetch error:', error);
                res.status(500).json({ error: 'Failed to fetch profile' });
            }
        });
    }

    /**
     * Middleware to require authentication
     */
    requireAuth(req, res, next) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = this.passport.verifyJWT(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = decoded;
        next();
    }

    /**
     * Get router instance
     */
    getRouter() {
        return this.router;
    }
}

module.exports = AuthRoutes;