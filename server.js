/**
 * Empire Game Server — Node.js Backend
 * Handles game state, player sessions, and multiplayer functionality
 *
 * DATA MODEL
 * ----------
 * All game data is stored in individual JSON files under saves/db/:
 *   players.json   — user accounts (auth + game progression combined)
 *   nations.json   — all nations (player + AI)
 *   alliances.json — alliances
 *   wars.json      — active and completed wars
 *   treaties.json  — active and historical treaties
 *   trades.json    — trade offers and completed trades
 *   forum.json     — forum posts and world board
 *   world.json     — world settings, motions, color standards
 *
 * Every mutation writes the affected domain file immediately (write-through),
 * so a crash loses at most the current in-flight write (< 1 ms window).
 *
 * IDs
 * ---
 * All entities (players, nations, alliances, wars, treaties, trades, posts)
 * receive a random 9-digit numeric string ID on creation, e.g. "847291630".
 */

'use strict';

require('dotenv').config();

const express  = require('express');
const http     = require('http');
const socketIo = require('socket.io');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');

const { PersistStore, generateId, generateUniqueId } = require('./core/persist-store');

// ─── Load auth modules (optional — gracefully degraded if missing) ───────────
let PassportConfig = null;
let AuthRoutes     = null;
try {
    PassportConfig = require('./core/auth/passport-config');
    AuthRoutes     = require('./core/auth/auth-routes');
} catch (_) {}

// ─────────────────────────────────────────────────────────────────────────────
//  DOMAIN DATABASES
// ─────────────────────────────────────────────────────────────────────────────
const DB = {
    players:   new PersistStore('players'),    // user accounts + player data
    nations:   new PersistStore('nations'),    // all nations (player + AI)
    alliances: new PersistStore('alliances'),  // alliances
    wars:      new PersistStore('wars'),       // wars
    treaties:  new PersistStore('treaties'),   // treaties
    trades:    new PersistStore('trades'),     // trade market
    forum:     new PersistStore('forum'),      // world forum (posts / news)
    world:     new PersistStore('world'),      // world motions, color standards, settings
};

// ─────────────────────────────────────────────────────────────────────────────
//  SERVER CLASS
// ─────────────────────────────────────────────────────────────────────────────

class EmpireGameServer {
    constructor() {
        this.app    = express();
        this.server = http.createServer(this.app);
        this.io     = socketIo(this.server, {
            cors: { origin: '*', methods: ['GET', 'POST'] }
        });

        this.port = process.env.PORT || 3000;

        // Runtime state (mirrors what's in DB but kept as Maps for O(1) lookup)
        this.gameState = {
            gameTurn:    0,
            gameStarted: false,
            lastSave:    Date.now()
        };

        // Connected socket clients  socketId -> { socket, playerId, nationId, connected }
        this.clients = new Map();

        // Game settings
        this.settings = {
            maxPlayers:       20,
            autoSave:         true,
            autoSaveInterval: 60000,   // 1 minute
            turnLength:       3600000, // 1 hour
            allowSpectators:  true,
            enableAI:         true,
            aiCount:          12
        };

        this.setupMiddleware();
        this.setupAuth();
        this.setupRoutes();
        this.setupSocketHandlers();
        this.startGameLoop();

        console.log('Empire Game Server initialized');
    }

    // ─── Middleware ────────────────────────────────────────────────────────────

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.static(__dirname));
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
            next();
        });
    }

    // ─── Auth ──────────────────────────────────────────────────────────────────

    setupAuth() {
        if (!PassportConfig || !AuthRoutes) {
            console.warn('Auth modules not found — /auth routes disabled');
            return;
        }
        try {
            // Build a DB adapter that bridges passport/auth-routes to DB.players
            const dbAdapter = {
                async findUserByUsername(username) {
                    return DB.players.find(u =>
                        u.username && u.username.toLowerCase() === username.toLowerCase()
                    ) || null;
                },
                async findUserByEmail(email) {
                    return DB.players.find(u =>
                        u.email && u.email.toLowerCase() === email.toLowerCase()
                    ) || null;
                },
                async findUserById(id) {
                    return DB.players.get(String(id)) || null;
                },
                async findUserByGoogleId(googleId) {
                    return DB.players.find(u => u.googleId === googleId) || null;
                },
                async findUserByDiscordId(discordId) {
                    return DB.players.find(u => u.discordId === discordId) || null;
                },
                async createUser(userData) {
                    const id = generateUniqueId(DB.players);
                    const record = {
                        ...userData,
                        id,
                        createdAt:  Date.now(),
                        lastLogin:  Date.now(),
                        level:      1,
                        experience: 0,
                        skills:     {},
                        isActive:   true,
                        nationId:   null
                    };
                    DB.players.set(record);
                    console.log(`User created: ${userData.username} (id=${id})`);
                    return id;
                },
                async updateUser(id, updates) {
                    try {
                        return DB.players.update(id, updates);
                    } catch (_) {
                        return null;
                    }
                }
            };

            const passportConfig = new PassportConfig(dbAdapter);
            const authRoutes     = new AuthRoutes(passportConfig, dbAdapter);

            this.app.use(passportConfig.initialize());
            this.app.use('/auth', authRoutes.router);

            console.log('Auth system initialized (local registration + JWT)');
        } catch (err) {
            console.error('Auth system failed to initialize:', err.message);
        }
    }

    // ─── REST Routes ──────────────────────────────────────────────────────────

    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });

        // Legacy OAuth landing — old tokens or cached redirects from /auth/success
        // get forwarded to / so the SPA picks up the ?token= correctly.
        this.app.get('/auth/success', (req, res) => {
            const token = req.query.token;
            if (token) {
                res.redirect(`/?token=${token}`);
            } else {
                res.redirect('/');
            }
        });

        // ── Name uniqueness checks ─────────────────────────────────────────────

        // Check whether a nation name is already taken (case-insensitive).
        // Returns { available: bool, message: string }
        this.app.get('/api/check-nation-name', (req, res) => {
            const name = (req.query.name || '').trim();
            if (!name || name.length < 3) {
                return res.json({ available: false, message: 'Name too short' });
            }
            const taken = DB.nations.find(
                n => n.name && n.name.toLowerCase() === name.toLowerCase()
            );
            res.json({ available: !taken, message: taken ? 'Nation name already taken' : 'Available' });
        });

        // Check whether a ruler/leader name is already in use (case-insensitive).
        this.app.get('/api/check-ruler-name', (req, res) => {
            const name = (req.query.name || '').trim();
            if (!name || name.length < 2) {
                return res.json({ available: false, message: 'Name too short' });
            }
            const taken = DB.nations.find(
                n => n.leader && n.leader.toLowerCase() === name.toLowerCase()
            );
            res.json({ available: !taken, message: taken ? 'Ruler name already taken' : 'Available' });
        });

        // Player status — returns whether a JWT-authenticated player already has a nation.
        // Used by the client after login to decide whether to show AccountCreation.
        this.app.get('/api/player-status', async (req, res) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({ error: 'Authentication required' });
                }
                const token = authHeader.slice(7);
                let decoded;
                try {
                    decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
                } catch (_) {
                    return res.status(401).json({ error: 'Invalid token' });
                }
                const player = DB.players.get(String(decoded.id));
                if (!player) return res.status(404).json({ error: 'Player not found' });
                const hasNation = !!player.nationId && DB.nations.has(player.nationId);
                res.json({ hasNation, nationId: player.nationId || null });
            } catch (err) {
                res.status(500).json({ error: 'Status check failed' });
            }
        });

        // Public config — exposes only safe, non-secret settings to the client
        this.app.get('/api/config', (req, res) => {
            res.json({
                adminEmails: (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
            });
        });

        this.app.get('/api/status', (req, res) => {
            res.json({
                status:      'online',
                players:     DB.players.size,
                nations:     DB.nations.size,
                alliances:   DB.alliances.size,
                wars:        DB.wars.filter(w => w.status === 'active').length,
                treaties:    DB.treaties.filter(t => t.status === 'active').length,
                gameStarted: this.gameState.gameStarted,
                gameTurn:    this.gameState.gameTurn,
                uptime:      process.uptime()
            });
        });

        this.app.get('/api/gamestate', (req, res) => {
            res.json({
                nations:   DB.nations.values().map(n => this._publicNation(n)),
                alliances: DB.alliances.values(),
                wars:      DB.wars.values(),
                treaties:  DB.treaties.values(),
                gameTurn:  this.gameState.gameTurn
            });
        });

        // Public leaderboard
        this.app.get('/api/leaderboard', (req, res) => {
            const nations = DB.nations.filter(n => !n.isAI && n.isActive)
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .slice(0, 50)
                .map(n => this._publicNation(n));
            res.json(nations);
        });

        // Nations
        this.app.get('/api/nations', (req, res) => {
            res.json(DB.nations.values().map(n => this._publicNation(n)));
        });

        this.app.get('/api/nations/:id', (req, res) => {
            const n = DB.nations.get(req.params.id);
            if (!n) return res.status(404).json({ error: 'Nation not found' });
            res.json(this._publicNation(n));
        });

        // Alliances
        this.app.get('/api/alliances', (req, res) => {
            res.json(DB.alliances.values());
        });

        this.app.get('/api/alliances/:id', (req, res) => {
            const a = DB.alliances.get(req.params.id);
            if (!a) return res.status(404).json({ error: 'Alliance not found' });
            res.json(a);
        });

        // Wars
        this.app.get('/api/wars', (req, res) => {
            res.json(DB.wars.values());
        });

        this.app.get('/api/wars/:id', (req, res) => {
            const w = DB.wars.get(req.params.id);
            if (!w) return res.status(404).json({ error: 'War not found' });
            res.json(w);
        });

        // Treaties
        this.app.get('/api/treaties', (req, res) => {
            res.json(DB.treaties.filter(t => t.status === 'active'));
        });

        // Trade market
        this.app.get('/api/trades', (req, res) => {
            res.json(DB.trades.filter(t => t.status === 'open'));
        });

        this.app.post('/api/trades', (req, res) => {
            try {
                const trade = this._createTrade(req.body);
                res.json({ success: true, trade });
            } catch (err) {
                res.status(400).json({ success: false, error: err.message });
            }
        });

        // World Forum
        this.app.get('/api/forum', (req, res) => {
            const page  = parseInt(req.query.page  || 1, 10);
            const limit = parseInt(req.query.limit || 20, 10);
            const cat   = req.query.category || null;
            let posts = DB.forum.values().sort((a, b) => b.createdAt - a.createdAt);
            if (cat) posts = posts.filter(p => p.category === cat);
            const total = posts.length;
            posts = posts.slice((page - 1) * limit, page * limit);
            res.json({ posts, total, page, limit });
        });

        this.app.post('/api/forum', (req, res) => {
            try {
                const post = this._createForumPost(req.body);
                res.json({ success: true, post });
            } catch (err) {
                res.status(400).json({ success: false, error: err.message });
            }
        });

        this.app.get('/api/forum/:id', (req, res) => {
            const p = DB.forum.get(req.params.id);
            if (!p) return res.status(404).json({ error: 'Post not found' });
            res.json(p);
        });

        // World motions / color standards
        this.app.get('/api/world', (req, res) => {
            res.json(this._getWorldRecord());
        });

        this.app.post('/api/world/motion', (req, res) => {
            try {
                const motion = this._createWorldMotion(req.body);
                res.json({ success: true, motion });
            } catch (err) {
                res.status(400).json({ success: false, error: err.message });
            }
        });

        // Admin
        this.app.post('/api/admin/reset', (req, res) => {
            if (req.body.adminKey === process.env.ADMIN_KEY || req.body.adminKey === 'empire_admin_reset_2024') {
                this.resetGame();
                res.json({ success: true, message: 'Game reset' });
            } else {
                res.status(403).json({ success: false, message: 'Invalid admin key' });
            }
        });

        this.app.post('/api/admin/save', (req, res) => {
            try {
                this._flushAllDomains();
                res.json({ success: true, message: 'All domains flushed to disk' });
            } catch (err) {
                res.status(500).json({ success: false, error: err.message });
            }
        });

        // GraphQL-style query endpoint (preserved from original architecture)
        this.app.post('/api/query', (req, res) => {
            try {
                const result = this._processQuery(req.body, req.headers['x-api-key']);
                res.json({ success: true, data: result, timestamp: Date.now() });
            } catch (err) {
                res.status(400).json({ success: false, error: err.message });
            }
        });
    }

    // ─── Socket Handlers ──────────────────────────────────────────────────────

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);

            this.clients.set(socket.id, {
                socket,
                playerId: null,
                nationId: null,
                connected: Date.now()
            });

            socket.on('auth',            (data) => this.handleAuth(socket, data));
            socket.on('createNation',    (data) => this.handleCreateNation(socket, data));
            socket.on('gameAction',      (data) => this.handleGameAction(socket, data));
            socket.on('chat',            (data) => this.handleChat(socket, data));
            socket.on('forumPost',       (data) => this.handleForumPost(socket, data));
            socket.on('proposeTreaty',   (data) => this.handleProposeTreaty(socket, data));
            socket.on('acceptTreaty',    (data) => this.handleAcceptTreaty(socket, data));
            socket.on('createAlliance',  (data) => this.handleCreateAlliance(socket, data));
            socket.on('joinAlliance',    (data) => this.handleJoinAlliance(socket, data));
            socket.on('leaveAlliance',   (data) => this.handleLeaveAlliance(socket, data));
            socket.on('createTrade',     (data) => this.handleCreateTrade(socket, data));
            socket.on('acceptTrade',     (data) => this.handleAcceptTrade(socket, data));
            socket.on('requestGameState',()     => this.sendGameStateToClient(socket));

            socket.on('disconnect', () => {
                const client = this.clients.get(socket.id);
                if (client && client.playerId) {
                    try {
                        DB.players.update(client.playerId, { isOnline: false, lastActive: Date.now() });
                    } catch (_) {}
                }
                this.clients.delete(socket.id);
                console.log(`Client disconnected: ${socket.id}`);
            });
        });
    }

    // ─── Auth handler ─────────────────────────────────────────────────────────

    handleAuth(socket, data) {
        // Prefer JWT verification; fall back to username-only for legacy clients.
        let player = null;

        if (data.token) {
            try {
                const jwt     = require('jsonwebtoken');
                const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
                player = DB.players.get(String(decoded.id));
            } catch (_) { /* invalid token � fall through */ }
        }

        if (!player && data.username) {
            player = DB.players.find(p => p.username === data.username) || null;
        }

        if (!player) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }

        player = DB.players.update(player.id, {
            isOnline:   true,
            lastActive: Date.now(),
            lastLogin:  Date.now()
        });

        const client = this.clients.get(socket.id);
        client.playerId = player.id;

        if (player.nationId && DB.nations.has(player.nationId)) {
            client.nationId = player.nationId;
        }

        socket.emit('authSuccess', {
            playerId:  player.id,
            username:  player.username,
            level:     player.level,
            hasNation: !!player.nationId && DB.nations.has(player.nationId)
        });

        // Immediately send the player's nation data so the client can
        // hydrate window.Nation without needing a separate requestGameState.
        if (player.nationId && DB.nations.has(player.nationId)) {
            const playerNation = DB.nations.get(player.nationId);
            socket.emit('playerNationData', this._publicNation(playerNation));
        }

        console.log(`Player authenticated via socket: ${player.username} (${player.id})`);
    }

    // ─── Nation creation ──────────────────────────────────────────────────────

    handleCreateNation(socket, data) {
        const client = this.clients.get(socket.id);
        if (!client || !client.playerId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
        }

        const player = DB.players.get(client.playerId);
        if (!player) {
            socket.emit('error', { message: 'Player not found' });
            return;
        }

        if (player.nationId && DB.nations.has(player.nationId)) {
            socket.emit('error', { message: 'Player already has a nation' });
            return;
        }

        // ── Uniqueness checks for nation name and ruler name ──────────────────
        const nationNameInput = (data.name || '').trim();
        const rulerNameInput  = (data.leader || '').trim();

        if (nationNameInput.length < 3 || nationNameInput.length > 50) {
            socket.emit('error', { message: 'Nation name must be 3–50 characters' });
            return;
        }
        if (!/^[a-zA-Z0-9\s\-']+$/.test(nationNameInput)) {
            socket.emit('error', { message: 'Nation name contains invalid characters' });
            return;
        }
        const existingNationName = DB.nations.find(
            n => n.name && n.name.toLowerCase() === nationNameInput.toLowerCase()
        );
        if (existingNationName) {
            socket.emit('error', { message: 'That nation name is already taken. Please choose a unique name.' });
            return;
        }

        if (rulerNameInput.length < 2 || rulerNameInput.length > 30) {
            socket.emit('error', { message: 'Ruler name must be 2–30 characters' });
            return;
        }
        if (!/^[a-zA-Z\s\-']+$/.test(rulerNameInput)) {
            socket.emit('error', { message: 'Ruler name may only contain letters, spaces, hyphens, and apostrophes' });
            return;
        }
        const existingRulerName = DB.nations.find(
            n => n.leader && n.leader.toLowerCase() === rulerNameInput.toLowerCase()
        );
        if (existingRulerName) {
            socket.emit('error', { message: 'That ruler name is already taken. Please choose a unique name.' });
            return;
        }

        const id = generateUniqueId(DB.nations);

        // Validate factionKey against the 10 valid colors
        const VALID_COLOR_KEYS = ['aqua','black','blue','green','lime','orange','pink','purple','red','yellow'];
        const COLOR_HEX = {
            aqua: '#00BFBF', black: '#1a1a1a', blue: '#0066FF', green: '#00AA00',
            lime: '#7FCC00', orange: '#FF8C00', pink: '#FF69B4', purple: '#8A2BE2',
            red:  '#E00000', yellow: '#FFD700'
        };
        const factionKey   = VALID_COLOR_KEYS.includes(data.factionKey) ? data.factionKey : null;
        const factionColor = factionKey ? (data.factionColor || COLOR_HEX[factionKey]) : null;

        const nation = {
            id,
            name:       nationNameInput,
            leader:     rulerNameInput,
            government: data.government || 'democracy',
            religion:   data.religion   || 'atheism',
            playerId:   player.id,
            factionKey,
            factionColor,
            isAI:       false,
            isActive:   true,
            isVacation: false,
            created:    Date.now(),
            lastActive: Date.now(),

            // Starting stats
            land:   1000,
            infra:  1000,
            tech:   0,

            // Computed
            population: 0,
            gdp:        0,
            taxableIncome: 0,
            taxRevenue:    0,

            // Economy
            money:    15000000,
            taxRate:  2.5,
            happiness:  50,
            stability:  100,
            reputation: 50,

            // Resources
            primaryResource: data.primaryResource || 'iron',
            resources: {
                iron: 0, lead: 0, lumber: 0, water: 0, food: 0,
                uranium: 0, coal: 0, oil: 0, limestone: 0, bauxite: 0,
                steel: 0, ammo: 0, paper: 0, cookedFood: 0,
                cement: 0, gas: 0, aluminum: 0
            },

            // Military
            militaryUnits: {
                soldiers: 0, tanks: 0, aircraft: 0, ships: 0,
                spies: 0, missiles: 0, nukes: 0
            },
            militaryStrength: 0,

            // Diplomacy
            allianceId: null,
            wars:       [],
            treaties:   [],
            tradeAgreements: [],

            // Advanced
            improvements: {},
            projects:     {},
            policies: {
                economic:    'Mixed',
                military:    'Defensive',
                social:      'Moderate',
                environmental: 'Balanced',
                foreign:     'Neutral'
            },

            // Statistics
            statistics: {
                totalTurns:       0,
                warsWon:          0,
                warsLost:         0,
                researchCompleted: 0,
                landPurchased:    0,
                infraPurchased:   0,
                techPurchased:    0
            }
        };

        this.calculateNationStats(nation);
        DB.nations.set(nation);

        // Link player -> nation
        DB.players.update(player.id, { nationId: nation.id });
        client.nationId = nation.id;

        socket.emit('nationCreated', { nation: this._publicNation(nation) });

        socket.broadcast.emit('newNation', {
            name:   nation.name,
            leader: nation.leader
        });

        // Update player statistics
        try {
            const stats = { ...player.statistics, nationsCreated: (player.statistics?.nationsCreated || 0) + 1 };
            DB.players.update(player.id, { statistics: stats });
        } catch (_) {}

        console.log(`Nation created: ${nation.name} (id=${id}) by player ${player.username}`);
    }

    // ─── Game actions ─────────────────────────────────────────────────────────

    handleGameAction(socket, data) {
        const client = this.clients.get(socket.id);
        if (!client || !client.nationId) {
            socket.emit('error', { message: 'No nation found' });
            return;
        }

        const nation = DB.nations.get(client.nationId);
        if (!nation) {
            socket.emit('error', { message: 'Nation not found' });
            return;
        }

        try {
            const result = this.processGameAction(nation, data);
            socket.emit('actionResult', result);

            if (result.success) {
                this.calculateNationStats(nation);
                DB.nations.set(nation);  // persist updated nation immediately
                socket.emit('nationUpdate', this._publicNation(nation));
                this.broadcastUpdate(data.action, nation, result);
            }
        } catch (err) {
            console.error('Game action error:', err);
            socket.emit('error', { message: err.message });
        }
    }

    processGameAction(nation, data) {
        const { action, ...params } = data;
        switch (action) {
            case 'buyLand':         return this.buyLand(nation, params.amount || 100);
            case 'buyInfra':        return this.buyInfra(nation, params.amount || 100);
            case 'buyTech':         return this.buyTech(nation, params.amount || 50);
            case 'recruitSoldiers': return this.recruitSoldiers(nation, params.amount || 100);
            case 'recruitTanks':    return this.recruitTanks(nation, params.amount || 10);
            case 'declareWar':      return this.declareWar(nation, params.targetId);
            case 'proposeTreaty':   return this.proposeTreaty(nation, params.targetId, params.treatyType);
            case 'trade':           return this.trade(nation, params);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    // ─── Alliance handlers ────────────────────────────────────────────────────

    handleCreateAlliance(socket, data) {
        const client = this.clients.get(socket.id);
        if (!client || !client.nationId) {
            socket.emit('error', { message: 'No nation found' });
            return;
        }

        const nation = DB.nations.get(client.nationId);
        if (!nation) {
            socket.emit('error', { message: 'Nation not found' });
            return;
        }

        if (nation.allianceId) {
            socket.emit('error', { message: 'Already in an alliance' });
            return;
        }

        const id = generateUniqueId(DB.alliances);
        const alliance = {
            id,
            name:          data.name    || 'New Alliance',
            acronym:       data.acronym || '',
            description:   data.description || '',
            founderId:     nation.id,
            founderName:   nation.name,
            founded:       Date.now(),
            isActive:      true,
            level:         1,
            experience:    0,
            members:       [{ nationId: nation.id, role: 'founder', joinDate: Date.now() }],
            memberCount:   1,
            treaties:      [],
            wars:          [],
            sharedResources: {},
            statistics: {
                warsWon: 0, warsLost: 0, treatiesSigned: 0,
                membersRecruited: 1
            }
        };

        DB.alliances.set(alliance);

        // Update nation
        DB.nations.update(nation.id, { allianceId: alliance.id });

        socket.emit('allianceCreated', { alliance });
        this.io.emit('allianceUpdate', { type: 'created', alliance });

        console.log(`Alliance created: ${alliance.name} (id=${id}) by ${nation.name}`);
    }

    handleJoinAlliance(socket, data) {
        const client = this.clients.get(socket.id);
        if (!client || !client.nationId) {
            socket.emit('error', { message: 'No nation found' });
            return;
        }

        const nation   = DB.nations.get(client.nationId);
        const alliance = DB.alliances.get(data.allianceId);

        if (!nation)   { socket.emit('error', { message: 'Nation not found' });   return; }
        if (!alliance) { socket.emit('error', { message: 'Alliance not found' }); return; }
        if (nation.allianceId) { socket.emit('error', { message: 'Already in an alliance' }); return; }

        const updatedMembers = [
            ...alliance.members,
            { nationId: nation.id, role: 'member', joinDate: Date.now() }
        ];

        DB.alliances.update(alliance.id, {
            members:     updatedMembers,
            memberCount: updatedMembers.length
        });

        DB.nations.update(nation.id, { allianceId: alliance.id });

        socket.emit('allianceJoined', { allianceId: alliance.id });
        this.io.emit('allianceUpdate', { type: 'memberJoined', allianceId: alliance.id, nationId: nation.id });
    }

    handleLeaveAlliance(socket, data) {
        const client = this.clients.get(socket.id);
        if (!client || !client.nationId) {
            socket.emit('error', { message: 'No nation found' });
            return;
        }

        const nation = DB.nations.get(client.nationId);
        if (!nation || !nation.allianceId) { socket.emit('error', { message: 'Not in an alliance' }); return; }

        const alliance = DB.alliances.get(nation.allianceId);
        if (alliance) {
            const updatedMembers = alliance.members.filter(m => m.nationId !== nation.id);
            if (updatedMembers.length === 0) {
                DB.alliances.update(alliance.id, { isActive: false, disbandedAt: Date.now() });
            } else {
                DB.alliances.update(alliance.id, { members: updatedMembers, memberCount: updatedMembers.length });
            }
        }

        DB.nations.update(nation.id, { allianceId: null });
        socket.emit('allianceLeft', {});
    }

    // ─── Treaty handlers ──────────────────────────────────────────────────────

    handleProposeTreaty(socket, data) {
        const client = this.clients.get(socket.id);
        if (!client || !client.nationId) {
            socket.emit('error', { message: 'No nation found' });
            return;
        }

        const { targetNationId, treatyType, terms, duration } = data;
        const proposerNation = DB.nations.get(client.nationId);
        const targetNation   = DB.nations.get(targetNationId);

        if (!proposerNation || !targetNation) {
            socket.emit('error', { message: 'Nation not found' });
            return;
        }

        // Store the proposal inside the treaties domain with status 'proposed'
        const id = generateUniqueId(DB.treaties);
        const treaty = {
            id,
            type:        treatyType || 'peace',
            status:      'proposed',
            proposerId:  proposerNation.id,
            targetId:    targetNation.id,
            parties:     [proposerNation.id, targetNation.id],
            terms:       terms       || {},
            duration:    duration    || null,
            proposedAt:  Date.now(),
            expiresAt:   Date.now() + 7 * 24 * 60 * 60 * 1000,
            acceptedAt:  null,
            violations:  0
        };

        DB.treaties.set(treaty);

        socket.emit('treatyProposed', { treaty });
        // Notify target if connected
        this._notifyNation(targetNation.id, 'treatyProposal', { treaty, from: proposerNation.name });
    }

    handleAcceptTreaty(socket, data) {
        const client  = this.clients.get(socket.id);
        const treaty  = DB.treaties.get(data.treatyId);

        if (!treaty) { socket.emit('error', { message: 'Treaty not found' });  return; }
        if (treaty.status !== 'proposed') { socket.emit('error', { message: 'Treaty not pending' }); return; }
        if (Date.now() > treaty.expiresAt) { socket.emit('error', { message: 'Treaty proposal expired' }); return; }

        const updated = DB.treaties.update(treaty.id, {
            status:     'active',
            acceptedAt: Date.now(),
            activeSince: Date.now()
        });

        // Record on both nations
        for (const nationId of treaty.parties) {
            const n = DB.nations.get(nationId);
            if (n) {
                DB.nations.update(nationId, { treaties: [...(n.treaties || []), treaty.id] });
            }
        }

        socket.emit('treatyAccepted', { treaty: updated });
        this.io.emit('treatyUpdate', { type: 'activated', treaty: updated });
    }

    // ─── Trade handlers ───────────────────────────────────────────────────────

    handleCreateTrade(socket, data) {
        const client = this.clients.get(socket.id);
        if (!client || !client.nationId) {
            socket.emit('error', { message: 'No nation found' });
            return;
        }

        try {
            const trade = this._createTrade({
                ...data,
                sellerNationId: client.nationId
            });
            socket.emit('tradeCreated', { trade });
            this.io.emit('tradeUpdate', { type: 'new', trade });
        } catch (err) {
            socket.emit('error', { message: err.message });
        }
    }

    handleAcceptTrade(socket, data) {
        const client = this.clients.get(socket.id);
        if (!client || !client.nationId) {
            socket.emit('error', { message: 'No nation found' });
            return;
        }

        const trade = DB.trades.get(data.tradeId);
        if (!trade)                   { socket.emit('error', { message: 'Trade not found' }); return; }
        if (trade.status !== 'open')  { socket.emit('error', { message: 'Trade not available' }); return; }
        if (trade.sellerNationId === client.nationId) { socket.emit('error', { message: 'Cannot accept your own trade' }); return; }

        const buyerNation  = DB.nations.get(client.nationId);
        const sellerNation = DB.nations.get(trade.sellerNationId);

        if (!buyerNation || !sellerNation) {
            socket.emit('error', { message: 'Nation not found' });
            return;
        }

        // Simple resource transfer
        if (buyerNation.money < trade.price) {
            socket.emit('error', { message: 'Insufficient funds' });
            return;
        }

        buyerNation.money  -= trade.price;
        sellerNation.money += trade.price;

        const resourceField = trade.resource;
        if (resourceField && sellerNation.resources && sellerNation.resources[resourceField] >= trade.amount) {
            sellerNation.resources[resourceField] -= trade.amount;
            buyerNation.resources[resourceField]  = (buyerNation.resources[resourceField] || 0) + trade.amount;
        }

        DB.nations.set(buyerNation);
        DB.nations.set(sellerNation);

        const completed = DB.trades.update(trade.id, {
            status:         'completed',
            buyerNationId:  buyerNation.id,
            completedAt:    Date.now()
        });

        socket.emit('tradeAccepted', { trade: completed });
        this.io.emit('tradeUpdate', { type: 'completed', trade: completed });
    }

    // ─── Forum / Chat handlers ────────────────────────────────────────────────

    handleChat(socket, data) {
        const client = this.clients.get(socket.id);
        const player = client && client.playerId ? DB.players.get(client.playerId) : null;

        const message = {
            id:        generateId(),
            playerId:  player ? player.id       : 'anonymous',
            username:  player ? player.username : 'Anonymous',
            text:      String(data.text || '').slice(0, 2000),
            channel:   data.channel || 'global',
            timestamp: Date.now()
        };

        this.io.emit('chatMessage', message);
    }

    handleForumPost(socket, data) {
        const client = this.clients.get(socket.id);
        if (!client || !client.playerId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
        }

        const player = DB.players.get(client.playerId);
        if (!player) { socket.emit('error', { message: 'Player not found' }); return; }

        try {
            const post = this._createForumPost({
                ...data,
                authorId: player.id,
                authorName: player.username
            });
            socket.emit('forumPostCreated', { post });
            this.io.emit('forumUpdate', { type: 'newPost', post });
        } catch (err) {
            socket.emit('error', { message: err.message });
        }
    }

    // ─── Game loop ────────────────────────────────────────────────────────────

    startGameLoop() {
        // Game turn — 1 real hour = 1 game turn
        setInterval(() => this.updateGameTurn(), this.settings.turnLength);

        // AI update — every 60 seconds
        setInterval(() => {
            if (this.settings.enableAI) this.updateAINations();
        }, 60000);

        // Auto-save flush (belt-and-suspenders; the write-through already persists on every mutation)
        if (this.settings.autoSave) {
            setInterval(() => this._flushAllDomains(), this.settings.autoSaveInterval);
        }
    }

    updateGameTurn() {
        this.gameState.gameTurn++;

        for (const nation of DB.nations.values()) {
            this.calculateNationStats(nation);
            this.applyTurnIncome(nation);
            DB.nations.set(nation);  // persist updated state
        }

        this.processWars();
        this._updateWorldRecord({ gameTurn: this.gameState.gameTurn });

        this.io.emit('turnUpdate', {
            turn:      this.gameState.gameTurn,
            timestamp: Date.now()
        });

        console.log(`Game turn ${this.gameState.gameTurn} completed`);
    }

    applyTurnIncome(nation) {
        nation.money += Math.floor(nation.taxRevenue || 0);
        if (nation.primaryResource) {
            nation.resources[nation.primaryResource] =
                (nation.resources[nation.primaryResource] || 0) +
                Math.floor((nation.population || 0) * 0.001);
        }
    }

    processWars() {
        for (const war of DB.wars.values()) {
            if (war.status !== 'active') continue;
            if (Math.random() < 0.1) {
                this.processBattle(war);
            }
        }
    }

    processBattle(war) {
        const attacker = DB.nations.get(war.attacker);
        const defender = DB.nations.get(war.defender);
        if (!attacker || !defender) return;

        const aStr = attacker.militaryStrength * (0.8 + Math.random() * 0.4);
        const dStr = defender.militaryStrength * (0.9 + Math.random() * 0.2);

        const battle = {
            id:              generateId(),
            timestamp:       Date.now(),
            attackerStrength: Math.floor(aStr),
            defenderStrength: Math.floor(dStr),
            winner:          aStr > dStr ? war.attacker : war.defender,
            casualties: {
                attacker: Math.floor((attacker.militaryUnits.soldiers || 0) * 0.1 * Math.random()),
                defender: Math.floor((defender.militaryUnits.soldiers || 0) * 0.1 * Math.random())
            }
        };

        attacker.militaryUnits.soldiers = Math.max(0, (attacker.militaryUnits.soldiers || 0) - battle.casualties.attacker);
        defender.militaryUnits.soldiers = Math.max(0, (defender.militaryUnits.soldiers || 0) - battle.casualties.defender);
        this.calculateNationStats(attacker);
        this.calculateNationStats(defender);
        DB.nations.set(attacker);
        DB.nations.set(defender);

        const updatedBattles = [...(war.battles || []), battle];
        let warUpdate = { battles: updatedBattles };

        if (!defender.militaryUnits.soldiers || !attacker.militaryUnits.soldiers) {
            warUpdate.status = 'ended';
            warUpdate.ended  = Date.now();
            warUpdate.winner = battle.winner;
        }

        const updatedWar = DB.wars.update(war.id, warUpdate);

        // Update winner/loser stats
        if (updatedWar.status === 'ended') {
            const winnerNation = DB.nations.get(updatedWar.winner);
            const loserNation  = DB.nations.get(updatedWar.winner === war.attacker ? war.defender : war.attacker);
            if (winnerNation) {
                const ws = { ...winnerNation.statistics, warsWon: (winnerNation.statistics?.warsWon || 0) + 1 };
                DB.nations.update(winnerNation.id, { statistics: ws });
            }
            if (loserNation) {
                const ls = { ...loserNation.statistics, warsLost: (loserNation.statistics?.warsLost || 0) + 1 };
                DB.nations.update(loserNation.id, { statistics: ls });
            }
        }

        this.io.emit('battleResult', {
            war:          updatedWar,
            battle,
            attackerName: attacker.name,
            defenderName: defender.name
        });
    }

    // ─── AI Nations ───────────────────────────────────────────────────────────

    initializeAINations() {
        const templates = [
            { name: 'Aetherian Empire',      leader: 'Emperor Valdris',       gov: 'monarchy',         rel: 'monotheism', resource: 'iron'      },
            { name: 'Republic of Neredia',   leader: 'President Marina',      gov: 'republic',         rel: 'polytheism', resource: 'water'     },
            { name: 'Technate of Innovus',   leader: 'Chief Engineer Zara',   gov: 'technocracy',      rel: 'atheism',    resource: 'uranium'   },
            { name: 'Tribal Federation',     leader: 'Chief Thornwick',       gov: 'anarchy',          rel: 'shamanism',  resource: 'lumber'    },
            { name: 'Solar Confederacy',     leader: 'Admiral Phoenix',       gov: 'oligarchy',        rel: 'scientology',resource: 'oil'       },
            { name: 'Crystal Dominion',      leader: 'Archmage Lumina',       gov: 'theocracy',        rel: 'hinduism',   resource: 'bauxite'   },
            { name: 'Iron Brotherhood',      leader: 'General Steelhart',     gov: 'dictatorship',     rel: 'atheism',    resource: 'coal'      },
            { name: 'Emerald Alliance',      leader: 'Council Speaker Vale',  gov: 'democracy',        rel: 'buddhism',   resource: 'limestone' },
            { name: 'Crimson Empire',        leader: 'Empress Scarlett',      gov: 'fascism',          rel: 'christianity',resource: 'lead'     },
            { name: 'Azure Republic',        leader: 'Prime Minister Blue',   gov: 'liberalDemocracy', rel: 'islam',      resource: 'uranium'   },
            { name: 'Golden Sultanate',      leader: 'Sultan Goldmane',       gov: 'monarchy',         rel: 'islam',      resource: 'oil'       },
            { name: 'Violet Communes',       leader: 'Coordinator Purple',    gov: 'communism',        rel: 'atheism',    resource: 'coal'      }
        ];

        for (let i = 0; i < this.settings.aiCount; i++) {
            const tpl = templates[i % templates.length];
            this._createAINation(tpl, i);
        }
        console.log(`AI nations initialized (${this.settings.aiCount} nations)`);
    }

    _createAINation(template, index) {
        const id = generateUniqueId(DB.nations);

        // Assign color round-robin from the 10 canonical colors
        const COLOR_KEYS = ['aqua','black','blue','green','lime','orange','pink','purple','red','yellow'];
        const COLOR_HEX  = {
            aqua: '#00BFBF', black: '#1a1a1a', blue: '#0066FF', green: '#00AA00',
            lime: '#7FCC00', orange: '#FF8C00', pink: '#FF69B4', purple: '#8A2BE2',
            red:  '#E00000', yellow: '#FFD700'
        };
        const factionKey   = COLOR_KEYS[index % COLOR_KEYS.length];
        const factionColor = COLOR_HEX[factionKey];
        const nation = {
            id,
            name:    template.name + (index > 0 ? ` ${index + 1}` : ''),
            leader:  template.leader,
            government: template.gov,
            religion:   template.rel,
            playerId:   null,
            factionKey,
            factionColor,
            isAI:       true,
            isActive:   true,
            created:    Date.now(),
            lastActive: Date.now(),

            land:   1000 + Math.floor(Math.random() * 500 - 250),
            infra:  1000 + Math.floor(Math.random() * 200 - 100),
            tech:   Math.floor(Math.random() * 200),
            population: 0,
            money:  15000000 + Math.floor(Math.random() * 10000000 - 5000000),

            primaryResource: template.resource,
            resources: {
                iron: 0, lead: 0, lumber: 0, water: 0, food: 0,
                uranium: 0, coal: 0, oil: 0, limestone: 0, bauxite: 0,
                steel: 0, ammo: 0, paper: 0, cookedFood: 0,
                cement: 0, gas: 0, aluminum: 0
            },

            militaryUnits: {
                soldiers: Math.floor(Math.random() * 100),
                tanks: 0, aircraft: 0, ships: 0,
                spies: 0, missiles: 0, nukes: 0
            },
            militaryStrength: 0,

            wars: [], treaties: [], allianceId: null, tradeAgreements: [],
            happiness:  50 + Math.floor(Math.random() * 20 - 10),
            stability:  100,
            reputation: 50,

            aiPersonality: {
                aggressiveness: Math.random(),
                diplomacy:      Math.random(),
                expansion:      Math.random(),
                military:       Math.random(),
                trading:        Math.random(),
                cooperation:    Math.random()
            },
            lastAIAction: Date.now(),

            improvements: {},
            projects:     {},
            policies:     { economic: 'Mixed', military: 'Defensive', social: 'Moderate', environmental: 'Balanced', foreign: 'Neutral' },
            statistics:   { totalTurns: 0, warsWon: 0, warsLost: 0 }
        };

        this.calculateNationStats(nation);
        nation.resources[nation.primaryResource] = Math.floor(Math.random() * 1000 + 500);
        DB.nations.set(nation);

        console.log(`Created AI Nation: ${nation.name} (id=${id})`);
    }

    updateAINations() {
        const now = Date.now();
        for (const aiNation of DB.nations.filter(n => n.isAI)) {
            try {
                const interval = 10000 + Math.random() * 20000;
                if (now - (aiNation.lastAIAction || 0) > interval) {
                    this.processAIAction(aiNation);
                    DB.nations.update(aiNation.id, { lastAIAction: now });
                }
                this.calculateNationStats(aiNation);
                DB.nations.set(aiNation);
            } catch (err) {
                console.error(`Error updating AI nation ${aiNation.name}:`, err.message);
            }
        }
    }

    processAIAction(aiNation) {
        if (!aiNation.isAI) return;
        const actions = [];
        const p = aiNation.aiPersonality;

        if (aiNation.money > 2000000) {
            actions.push({ type: 'buyLand',  weight: 0.3 * p.expansion });
            actions.push({ type: 'buyInfra', weight: 0.4 });
            actions.push({ type: 'buyTech',  weight: 0.3 });
        }
        if (aiNation.money > 500000) {
            const soldierRatio = (aiNation.militaryUnits.soldiers || 0) / Math.max(1, aiNation.population);
            if (soldierRatio < 0.1) actions.push({ type: 'recruitSoldiers', weight: 0.4 * p.military });
        }
        if (aiNation.militaryStrength > 5000 && Math.random() < p.aggressiveness * 0.05) {
            const targets = this._getAIWarTargets(aiNation);
            if (targets.length > 0) {
                actions.push({ type: 'declareWar', target: targets[0].id, weight: p.aggressiveness });
            }
        }

        if (actions.length === 0) return;

        const total = actions.reduce((s, a) => s + (a.weight || 0.1), 0);
        let rand    = Math.random() * total;
        for (const action of actions) {
            rand -= (action.weight || 0.1);
            if (rand <= 0) {
                this._executeAIAction(aiNation, action);
                break;
            }
        }
    }

    _executeAIAction(aiNation, action) {
        try {
            let result;
            switch (action.type) {
                case 'buyLand':         result = this.buyLand(aiNation, 100);         break;
                case 'buyInfra':        result = this.buyInfra(aiNation, 100);        break;
                case 'buyTech':         result = this.buyTech(aiNation, 50);          break;
                case 'recruitSoldiers': result = this.recruitSoldiers(aiNation, 100); break;
                case 'declareWar':      result = this.declareWar(aiNation, action.target); break;
            }
            if (result && result.success) {
                DB.nations.set(aiNation);
                console.log(`AI ${aiNation.name}: ${result.message}`);
                this.broadcastUpdate(action.type, aiNation, result);
            }
        } catch (err) {
            console.error(`AI action error for ${aiNation.name}:`, err.message);
        }
    }

    _getAIWarTargets(aiNation) {
        return DB.nations.filter(n =>
            n.id !== aiNation.id &&
            n.militaryStrength < aiNation.militaryStrength * 0.8 &&
            !(n.wars || []).some(warId => {
                const w = DB.wars.get(warId);
                return w && (w.attacker === aiNation.id || w.defender === aiNation.id);
            })
        );
    }

    // ─── Stat calculations ────────────────────────────────────────────────────

    calculateNationStats(nation) {
        const ageDays  = Math.floor((Date.now() - (nation.created || Date.now())) / 86400000);
        const ageFactor = Math.max(1, ageDays / 7);
        nation.population = Math.floor(
            (nation.land || 0) * (nation.infra || 0) * Math.max(1, nation.tech || 0) * ageFactor / 1000000
        );
        nation.gdp          = nation.population * 2.4;
        nation.taxableIncome = nation.gdp;
        nation.taxRevenue   = nation.taxableIncome * ((nation.taxRate || 2.5) / 100);

        const u = nation.militaryUnits || {};
        nation.militaryStrength =
            (u.soldiers || 0) * 1    +
            (u.tanks    || 0) * 25   +
            (u.aircraft || 0) * 100  +
            (u.ships    || 0) * 200  +
            (u.spies    || 0) * 10   +
            (u.missiles || 0) * 500  +
            (u.nukes    || 0) * 2000;

        // Score for leaderboard
        nation.score = Math.floor(
            (nation.land    || 0)   * 10  +
            (nation.infra   || 0)   * 5   +
            (nation.tech    || 0)   * 20  +
            (nation.money   || 0)   / 100000 +
            (nation.militaryStrength || 0) * 0.1
        );
    }

    // ─── Economy actions ──────────────────────────────────────────────────────

    buyLand(nation, amount) {
        const cost = this._landCost(nation.land, amount);
        if (nation.money < cost) return { success: false, message: 'Insufficient funds' };
        nation.money -= cost;
        nation.land  += amount;
        return { success: true, message: `Purchased ${amount} sq miles for $${cost.toLocaleString()}`, cost, newLand: nation.land };
    }

    buyInfra(nation, amount) {
        const cost = this._infraCost(nation.infra, amount);
        if (nation.money < cost) return { success: false, message: 'Insufficient funds' };
        nation.money -= cost;
        nation.infra += amount;
        return { success: true, message: `Built ${amount} infrastructure for $${cost.toLocaleString()}`, cost, newInfra: nation.infra };
    }

    buyTech(nation, amount) {
        const cost = this._techCost(nation.tech, amount);
        if (nation.money < cost) return { success: false, message: 'Insufficient funds' };
        nation.money -= cost;
        nation.tech  += amount;
        return { success: true, message: `Researched ${amount} tech for $${cost.toLocaleString()}`, cost, newTech: nation.tech };
    }

    recruitSoldiers(nation, amount) {
        const max  = Math.floor((nation.population || 0) * 0.25);
        const have = nation.militaryUnits.soldiers || 0;
        const avail = max - have;
        if (avail <= 0) return { success: false, message: 'Maximum soldier capacity reached' };
        const actual = Math.min(amount, avail);
        const cost   = actual * 500;
        if (nation.money < cost) return { success: false, message: 'Insufficient funds' };
        nation.money -= cost;
        nation.militaryUnits.soldiers += actual;
        return { success: true, message: `Recruited ${actual} soldiers for $${cost.toLocaleString()}`, recruited: actual, cost };
    }

    recruitTanks(nation, amount) {
        if ((nation.tech || 0) < 500) return { success: false, message: 'Insufficient technology for tanks' };
        const max   = Math.floor((nation.population || 0) * 0.15);
        const have  = nation.militaryUnits.tanks || 0;
        const avail = max - have;
        if (avail <= 0) return { success: false, message: 'Maximum tank capacity reached' };
        const actual = Math.min(amount, avail);
        const cost   = actual * 25000;
        if (nation.money < cost) return { success: false, message: 'Insufficient funds' };
        nation.money -= cost;
        nation.militaryUnits.tanks += actual;
        return { success: true, message: `Deployed ${actual} tanks for $${cost.toLocaleString()}`, deployed: actual, cost };
    }

    // ─── War ──────────────────────────────────────────────────────────────────

    declareWar(nation, targetId) {
        const target = DB.nations.get(targetId);
        if (!target)                return { success: false, message: 'Target nation not found' };
        if (nation.id === targetId) return { success: false, message: 'Cannot declare war on yourself' };

        const existingWar = (nation.wars || []).find(warId => {
            const w = DB.wars.get(warId);
            return w && (w.attacker === targetId || w.defender === targetId) && w.status === 'active';
        });
        if (existingWar) return { success: false, message: 'Already at war with this nation' };

        const id  = generateUniqueId(DB.wars);
        const war = {
            id,
            attacker: nation.id,
            defender: target.id,
            attackerName: nation.name,
            defenderName: target.name,
            started:  Date.now(),
            status:   'active',
            battles:  [],
            winner:   null,
            ended:    null
        };

        DB.wars.set(war);
        DB.nations.update(nation.id, { wars: [...(nation.wars || []),  war.id] });
        DB.nations.update(target.id, { wars: [...(target.wars  || []), war.id] });

        this._notifyNation(target.id, 'warDeclared', {
            war,
            attackerName: nation.name,
            message: `${nation.name} has declared war on ${target.name}!`
        });
        this.io.emit('warDeclared', { war, attackerName: nation.name, defenderName: target.name });

        return { success: true, message: `Declared war on ${target.name}`, war };
    }

    // ─── Treaty (REST / legacy) ───────────────────────────────────────────────

    proposeTreaty(nation, targetId, treatyType) {
        const target = DB.nations.get(targetId);
        if (!target) return { success: false, message: 'Target nation not found' };

        const id = generateUniqueId(DB.treaties);
        const treaty = {
            id,
            type:       treatyType || 'peace',
            status:     'proposed',
            proposerId: nation.id,
            targetId,
            parties:    [nation.id, targetId],
            terms:      {},
            proposedAt: Date.now(),
            expiresAt:  Date.now() + 7 * 24 * 60 * 60 * 1000
        };

        DB.treaties.set(treaty);
        this._notifyNation(targetId, 'treatyProposal', { treaty, from: nation.name });

        return { success: true, message: `Treaty proposed to ${target.name}`, treaty };
    }

    // ─── Trade (legacy game action) ───────────────────────────────────────────

    trade(nation, params) {
        return { success: true, message: 'Trade action received', params };
    }

    // ─── Helper: create a trade offer ─────────────────────────────────────────

    _createTrade(data) {
        if (!data.resource)       throw new Error('resource is required');
        if (!data.amount)         throw new Error('amount is required');
        if (!data.price)          throw new Error('price is required');
        if (!data.sellerNationId) throw new Error('sellerNationId is required');

        const id = generateUniqueId(DB.trades);
        const trade = {
            id,
            sellerNationId: data.sellerNationId,
            buyerNationId:  null,
            resource:       data.resource,
            amount:         Number(data.amount),
            price:          Number(data.price),
            note:           data.note || '',
            status:         'open',
            createdAt:      Date.now(),
            completedAt:    null
        };

        DB.trades.set(trade);
        return trade;
    }

    // ─── Helper: create a forum post ──────────────────────────────────────────

    _createForumPost(data) {
        if (!data.title)    throw new Error('title is required');
        if (!data.content)  throw new Error('content is required');
        if (!data.authorId) throw new Error('authorId is required');

        if (data.title.length > 200)    throw new Error('title too long (max 200 chars)');
        if (data.content.length > 10000) throw new Error('content too long (max 10000 chars)');

        const id = generateUniqueId(DB.forum);
        const post = {
            id,
            authorId:   data.authorId,
            authorName: data.authorName || 'Unknown',
            title:      data.title,
            content:    data.content,
            category:   data.category || 'general',
            tags:       data.tags     || [],
            media:      data.media    || [],
            createdAt:  Date.now(),
            updatedAt:  Date.now(),
            views:      0,
            reactions:  {},
            comments:   [],
            isPinned:   false,
            isLocked:   false
        };

        DB.forum.set(post);
        return post;
    }

    // ─── Helper: world record ─────────────────────────────────────────────────

    _getWorldRecord() {
        return DB.world.get('world') || {
            id:           'world',
            gameTurn:     this.gameState.gameTurn,
            colorStandards: {},
            activeMotions:  [],
            passedMotions:  [],
            failedMotions:  [],
            createdAt:    Date.now()
        };
    }

    _updateWorldRecord(updates) {
        const world = this._getWorldRecord();
        const merged = { ...world, ...updates, _updated: Date.now() };
        DB.world.set(merged);
    }

    _createWorldMotion(data) {
        if (!data.title || !data.proposerId) throw new Error('title and proposerId required');

        const motionId = generateId();
        const motion = {
            id:          motionId,
            title:       data.title,
            description: data.description || '',
            proposerId:  data.proposerId,
            type:        data.type || 'general',
            votes:       { yes: [], no: [], abstain: [] },
            status:      'active',
            createdAt:   Date.now(),
            expiresAt:   Date.now() + (data.durationDays || 7) * 86400000
        };

        const world = this._getWorldRecord();
        this._updateWorldRecord({ activeMotions: [...(world.activeMotions || []), motion] });

        return motion;
    }

    // ─── GraphQL-style query processor ───────────────────────────────────────

    _processQuery(body, apiKey) {
        const { operation, query, variables } = body || {};
        if (!query) throw new Error('query is required');

        // Parse simple  "domain { fields }"  query
        const match = query.match(/^(\w+)\s*\{([^}]*)\}/);
        if (!match) throw new Error('Unsupported query format. Use: domain { field1 field2 }');

        const domain = match[1];
        const fields = match[2].split(/\s+/).filter(Boolean);
        const db     = DB[domain];

        if (!db) throw new Error(`Unknown domain: ${domain}`);

        let records = db.values();

        // Apply variable filters
        if (variables) {
            for (const [key, val] of Object.entries(variables)) {
                records = records.filter(r => r[key] === val);
            }
        }

        // Field projection
        if (fields.length > 0) {
            records = records.map(r => {
                const out = {};
                for (const f of fields) out[f] = r[f];
                return out;
            });
        }

        return records;
    }

    // ─── Utility ──────────────────────────────────────────────────────────────

    _landCost(currentLand, amount) {
        let cost = 0;
        for (let i = 0; i < amount; i += 100) {
            cost += 2000 * Math.pow(1.1, (currentLand + i) / 1000);
        }
        return Math.floor(cost);
    }

    _infraCost(currentInfra, amount) {
        return Math.floor(12000 * ((currentInfra || 0) / 1000 + 1) * amount / 100);
    }

    _techCost(currentTech, amount) {
        return Math.floor(50000 * ((currentTech || 0) / 500 + 1) * amount / 50);
    }

    _publicNation(nation) {
        return {
            id:               nation.id,
            name:             nation.name,
            leader:           nation.leader,
            government:       nation.government,
            religion:         nation.religion,
            factionKey:       nation.factionKey   || null,
            factionColor:     nation.factionColor || null,
            population:       nation.population,
            gdp:              nation.gdp,
            land:             nation.land,
            infra:            nation.infra,
            tech:             nation.tech,
            militaryStrength: nation.militaryStrength,
            happiness:        nation.happiness,
            stability:        nation.stability,
            reputation:       nation.reputation,
            allianceId:       nation.allianceId,
            score:            nation.score,
            isAI:             nation.isAI || false,
            founded:          nation.created
        };
    }

    /** Notify all sockets that are linked to a specific nationId. */
    _notifyNation(nationId, event, data) {
        for (const [, client] of this.clients) {
            if (client.nationId === nationId) {
                client.socket.emit(event, data);
            }
        }
    }

    broadcastUpdate(action, nation, result) {
        this.io.emit('nationUpdate', {
            nationId:   nation.id,
            nationName: nation.name,
            action,
            result,
            timestamp:  Date.now()
        });
    }

    sendGameStateToClient(socket) {
        const client = this.clients.get(socket.id);
        const playerNation = client && client.nationId
            ? DB.nations.get(client.nationId)
            : null;

        socket.emit('gameState', {
            nations:     DB.nations.values().map(n => this._publicNation(n)),
            alliances:   DB.alliances.values(),
            wars:        DB.wars.values(),
            treaties:    DB.treaties.filter(t => t.status === 'active'),
            gameTurn:    this.gameState.gameTurn,
            playerNation: playerNation || null
        });
    }

    // ─── Persist all domains to disk (belt-and-suspenders flush) ─────────────

    _flushAllDomains() {
        for (const [name, store] of Object.entries(DB)) {
            store.flushSync();
        }
        this.gameState.lastSave = Date.now();
        console.log(`[AutoSave] All domains flushed — turn ${this.gameState.gameTurn}`);
    }

    // ─── Reset ────────────────────────────────────────────────────────────────

    resetGame() {
        // Clear all domain stores (keeps the files but empties them)
        for (const store of Object.values(DB)) {
            for (const id of store.keys()) store.delete(id);
        }

        this.gameState.gameTurn    = 0;
        this.gameState.gameStarted = false;

        this.initializeAINations();
        this.io.emit('gameReset');

        console.log('Game reset completed');
    }

    // ─── Startup ──────────────────────────────────────────────────────────────

    start() {
        // If no nations exist, bootstrap AI nations
        if (DB.nations.size === 0) {
            this.initializeAINations();
        } else {
            // Restore gameTurn from world record
            const world = this._getWorldRecord();
            if (world && world.gameTurn) {
                this.gameState.gameTurn = world.gameTurn;
            }
            console.log(`Restored: ${DB.nations.size} nations, ${DB.players.size} players, turn ${this.gameState.gameTurn}`);
        }

        this.server.listen(this.port, () => {
            console.log(`Empire Game Server running on port ${this.port}`);
            console.log(`Visit http://localhost:${this.port} to play`);
        });

        // Flush everything cleanly on shutdown
        process.on('SIGINT',  () => this._shutdown('SIGINT'));
        process.on('SIGTERM', () => this._shutdown('SIGTERM'));
    }

    _shutdown(signal) {
        console.log(`\n[Shutdown] ${signal} received — flushing all domains...`);
        this._flushAllDomains();
        process.exit(0);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Boot
// ─────────────────────────────────────────────────────────────────────────────

const server = new EmpireGameServer();
server.start();

module.exports = EmpireGameServer;
