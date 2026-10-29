const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Passport.js configuration for Empire.2 authentication
 * Supports local, Google OAuth, and Discord OAuth strategies
 */
class PassportConfig {
    constructor(databaseManager) {
        this.db = databaseManager;
        this.setupStrategies();
        this.setupSerialization();
    }

    setupStrategies() {
        // Local Strategy (username/password)
        passport.use(new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password'
        }, async (username, password, done) => {
            try {
                const user = await this.db.findUserByUsername(username);
                
                if (!user) {
                    return done(null, false, { message: 'Username not found' });
                }

                if (!user.passwordHash) {
                    return done(null, false, { message: 'Account uses OAuth login' });
                }

                const validPassword = await bcrypt.compare(password, user.passwordHash);
                if (!validPassword) {
                    return done(null, false, { message: 'Invalid password' });
                }

                // Update last login
                await this.db.updateUser(user.id, { lastLogin: Date.now() });
                
                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }));

        // Google OAuth Strategy (only register if credentials are configured)
        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
            passport.use(new GoogleStrategy({
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: `${process.env.SERVER_URL}/auth/google/callback`
            }, async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user exists with Google ID
                    let user = await this.db.findUserByGoogleId(profile.id);
                    
                    if (user) {
                        // Update existing user
                        await this.db.updateUser(user.id, {
                            lastLogin: Date.now(),
                            profilePicture: profile.photos[0]?.value || user.profilePicture
                        });
                        return done(null, user);
                    }

                    // Check if email already exists
                    user = await this.db.findUserByEmail(profile.emails[0].value);
                    
                    if (user) {
                        // Link Google account to existing user
                        await this.db.updateUser(user.id, {
                            googleId: profile.id,
                            profilePicture: profile.photos[0]?.value || user.profilePicture,
                            emailVerified: true,
                            lastLogin: Date.now()
                        });
                        return done(null, user);
                    }

                    // Create new user
                    const newUser = {
                        username: this.generateUsername(profile.displayName),
                        email: profile.emails[0].value,
                        googleId: profile.id,
                        authProvider: 'google',
                        profilePicture: profile.photos[0]?.value,
                        emailVerified: true,
                        joinDate: Date.now(),
                        lastLogin: Date.now()
                    };

                    const userId = await this.db.createUser(newUser);
                    newUser.id = userId;
                    
                    return done(null, newUser);
                } catch (error) {
                    return done(error);
                }
            }));
            console.log('Google OAuth strategy registered');
        } else {
            console.log('Google OAuth skipped — GOOGLE_CLIENT_ID/SECRET not set');
        }

        // Discord OAuth Strategy (only register if credentials are configured)
        if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
            passport.use(new DiscordStrategy({
                clientID: process.env.DISCORD_CLIENT_ID,
                clientSecret: process.env.DISCORD_CLIENT_SECRET,
                callbackURL: `${process.env.SERVER_URL}/auth/discord/callback`,
                scope: ['identify', 'email']
            }, async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user exists with Discord ID
                    let user = await this.db.findUserByDiscordId(profile.id);
                    
                    if (user) {
                        // Update existing user
                        await this.db.updateUser(user.id, {
                            lastLogin: Date.now(),
                            profilePicture: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` || user.profilePicture
                        });
                        return done(null, user);
                    }

                    // Check if email already exists
                    if (profile.email) {
                        user = await this.db.findUserByEmail(profile.email);
                        
                        if (user) {
                            // Link Discord account to existing user
                            await this.db.updateUser(user.id, {
                                discordId: profile.id,
                                profilePicture: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` || user.profilePicture,
                                emailVerified: profile.verified || user.emailVerified,
                                lastLogin: Date.now()
                            });
                            return done(null, user);
                        }
                    }

                    // Create new user
                    const newUser = {
                        username: this.generateUsername(profile.username),
                        email: profile.email || '',
                        discordId: profile.id,
                        authProvider: 'discord',
                        profilePicture: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
                        emailVerified: profile.verified || false,
                        joinDate: Date.now(),
                        lastLogin: Date.now()
                    };

                    const userId = await this.db.createUser(newUser);
                    newUser.id = userId;
                    
                    return done(null, newUser);
                } catch (error) {
                    return done(error);
                }
            }));
            console.log('Discord OAuth strategy registered');
        } else {
            console.log('Discord OAuth skipped — DISCORD_CLIENT_ID/SECRET not set');
        }
    }

    setupSerialization() {
        passport.serializeUser((user, done) => {
            done(null, user.id);
        });

        passport.deserializeUser(async (id, done) => {
            try {
                const user = await this.db.findUserById(id);
                done(null, user);
            } catch (error) {
                done(error);
            }
        });
    }

    /**
     * Generate unique username from display name
     */
    generateUsername(displayName) {
        // Clean display name and add random suffix if needed
        let username = displayName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 15);
        
        if (username.length < 3) {
            username = 'player' + Math.random().toString(36).substring(7);
        }

        // Add random suffix if username might not be unique
        return username + Math.floor(Math.random() * 1000);
    }

    /**
     * Generate JWT token for user
     */
    generateJWT(user) {
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            authProvider: user.authProvider
        };

        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '7d' // Token expires in 7 days
        });
    }

    /**
     * Verify JWT token
     */
    verifyJWT(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    /**
     * Hash password for local accounts
     */
    async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    /**
     * Initialize passport middleware
     */
    initialize() {
        return passport.initialize();
    }

    /**
     * Session middleware
     */
    session() {
        return passport.session();
    }
}

module.exports = PassportConfig;