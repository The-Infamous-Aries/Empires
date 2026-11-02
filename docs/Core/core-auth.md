# Authentication System — `core/auth/`

**Purpose:** Handles user authentication: local login/register, Google OAuth, Discord OAuth, JWT token management, Socket.IO authentication, and route protection.

**Location:** `core/auth/` (3 files)

---

## Files

| File | Responsibility |
|------|---------------|
| `passport-config.js` | Passport.js strategies: Local, Google OAuth, Discord OAuth; JWT generation/verification; password hashing |
| `auth-routes.js` | Express routes: login, register, OAuth callbacks, token verification, logout, profile, account linking |
| `auth-middleware.js` | JWT verification, Socket.IO auth, rate limiting, CORS, session config, permission checks, audit logging |

---

## 1. Passport Config — `core/auth/passport-config.js`

**Purpose:** Configures Passport.js authentication strategies and JWT utilities.

### Supported Strategies

| Strategy | Package | Env Vars | Status |
|----------|---------|----------|--------|
| **Local** (username/password) | `passport-local` + `bcrypt` | None | Always available |
| **Google OAuth** | `passport-google-oauth20` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Only if credentials configured |
| **Discord OAuth** | `passport-discord` | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | Only if credentials configured |

OAuth strategies are **conditionally registered** — if env vars aren't set, they're skipped with a console message (no crash).

### Local Strategy

```
Client submits: username + password
    ↓
findUserByUsername(username)
    ↓
If user exists and has passwordHash → bcrypt.compare(password, storedHash)
    ↓
If match → update lastLogin → return user
    ↓
Generate JWT → return to client
```

If user doesn't exist → "Username not found"
If password wrong → "Invalid password"
If user uses OAuth only (no passwordHash) → "Account uses OAuth login"

### Google OAuth Strategy

1. Client → `GET /auth/google` → redirects to Google
2. Google authenticates → redirects to `/auth/google/callback`
3. Callback checks:
   - User exists with `googleId`? → update login, return user
   - Email already exists? → link Google ID to existing account
   - Neither? → create new user with Google profile data
4. Generate JWT → redirect to `CLIENT_URL/?token=<jwt>`

### Discord OAuth Strategy

Same flow as Google, using Discord profile data (id, username, email, avatar).

### User Creation from OAuth

```javascript
{
    username: generated from display name,
    email: provider email,
    googleId: profile.id (Google only),
    discordId: profile.id (Discord only),
    authProvider: 'google' | 'discord',
    profilePicture: provider avatar URL,
    emailVerified: true,
    joinDate: Date.now(),
    lastLogin: Date.now()
}
```

### JWT Token

**Payload:**
```json
{
    "id": "user_123",
    "username": "playername",
    "email": "user@example.com",
    "authProvider": "local"
}
```

**Signing:** `jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })`

**Verification:** `jwt.verify(token, process.env.JWT_SECRET)` → returns payload or `null`

### Password Hashing

- Algorithm: bcrypt
- Salt rounds: 12
- Method: `hashPassword(password)` → returns hash string

### Serialization

- `serializeUser(user)` → stores `user.id` in session
- `deserializeUser(id)` → looks up user by ID via `findUserById()`

---

## 2. Auth Routes — `core/auth/auth-routes.js`

**Purpose:** Express HTTP routes for authentication.

### Routes

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| `POST` | `/auth/login` | authLimiter (5 req/15min) | Local login: username + password → JWT |
| `POST` | `/auth/register` | registerLimiter (3 req/hour) | Local registration: validate, hash password, create user → JWT |
| `GET` | `/auth/google` | passport.authenticate('google') | Start Google OAuth flow |
| `GET` | `/auth/google/callback` | passport.authenticate('google') | Google OAuth callback → JWT redirect |
| `GET` | `/auth/discord` | passport.authenticate('discord') | Start Discord OAuth flow |
| `GET` | `/auth/discord/callback` | passport.authenticate('discord') | Discord OAuth callback → JWT redirect |
| `POST` | `/auth/verify` | None | Verify JWT token → return fresh user data |
| `POST` | `/auth/logout` | None | Client-side logout (token removal) |
| `POST` | `/auth/link/google` | requireAuth | Link Google account to existing user |
| `POST` | `/auth/link/discord` | requireAuth | Link Discord account to existing user |
| `GET` | `/auth/profile` | requireAuth | Get user profile with linked accounts |

### OAuth Callback Redirect

Both Google and Discord callbacks redirect to:
```
${CLIENT_URL}/?token=<jwt>
```

The client reads `?token=` from the URL and stores the JWT for subsequent API requests.

### Rate Limits

| Endpoint | Window | Max | Message |
|----------|--------|-----|---------|
| Login | 15 min | 5 | Too many authentication attempts |
| Register | 1 hour | 3 | Too many registration attempts |

### Account Linking

Authenticated users can link additional OAuth providers:
- `POST /auth/link/google` → returns redirect URL for Google OAuth with `state` containing user ID
- `POST /auth/link/discord` → returns redirect URL for Discord OAuth with `state` containing user ID

### User Profile

Returns: id, username, email, profilePicture, authProvider, linkedAccounts (google/discord booleans), joinDate, lastLogin

---

## 3. Auth Middleware — `core/auth/auth-middleware.js`

**Purpose:** Middleware for request authentication, Socket.IO auth, rate limiting, CORS, sessions, permissions, and audit logging.

### JWT Verification — `verifyToken(req, res, next)`

Extracts token from (in order):
1. `Authorization: Bearer <token>` header
2. `?token=` query parameter
3. `empire_token` cookie

If valid → sets `req.user` and calls `next()`
If invalid/missing → returns `401 Authentication required`

### Optional Auth — `optionalAuth(req, res, next)`

Same extraction but doesn't fail if no token. Sets `req.user` if token is valid, otherwise continues without user.

### Socket.IO Auth — `authenticateSocket(socket, next)`

Extracts token from `socket.handshake.auth.token` or `Authorization` header.
If valid → sets `socket.userId` and `socket.user`, calls `next()`
If invalid → calls `next(new Error('Authentication failed'))`

### Rate Limiting — `createRateLimiter(options)`

Returns an `express-rate-limit` middleware. Defaults:
- Window: 15 minutes
- Max: 100 requests
- Headers: standard + legacy

### CORS — `configureCORS()`

Returns CORS config:
- Origin: `process.env.CLIENT_URL` or `http://localhost:8080`
- Credentials: true
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization, X-API-Key

### Session Config — `getSessionConfig()`

Returns express-session config:
- Secret: `process.env.SESSION_SECRET` or fallback
- resave: false
- saveUninitialized: false
- Cookie: httpOnly, secure (production), 24-hour maxAge

### Permission Check — `requirePermission(permission)`

Route middleware factory:
```javascript
app.get('/admin', authMiddleware.requirePermission('admin'), handler)
```

Checks: user authenticated → user exists → `hasPermission(user, permission)` → next or 403

Default `hasPermission()`: admin permission checks `user.isAdmin`; all other permissions default to allowed.

### Audit Logging — `auditLog(action)`

Route middleware that logs:
- action name
- userId (from req.user)
- IP address
- User agent
- Timestamp
- Path and method

Logged via `console.log('Audit:', JSON.stringify(logData))`.

### User for Socket — `getUserForSocket(userId)`

Async method that fetches user from database and returns sanitized user object (id, username, email, profilePicture, authProvider, level, isAuthenticated) for Socket.IO clients.

---

## Authentication Flow Summary

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Client    │────▶│  Auth Routes │────▶│  Passport Config│
│  (browser)  │     │  (Express)   │     │   (Strategies)  │
└─────────────┘     └──────────────┘     └─────────────────┘
       │                      │                    │
       │                      │                    │
       ▼                      ▼                    ▼
  JWT token           verifyJWT()        bcrypt.compare()
  (stored client-side)   ←─────────────┘          │
       │                                          │
       ▼                                          ▼
  Subsequent                              User object
  API requests                          returned to routes
  (Authorization: Bearer <jwt>)                    │
       │                                          ▼
       └──────────────────────────────────────────┘
                            │
                            ▼
                     verifyToken middleware
                            │
                            ▼
                     req.user set
                            │
                            ▼
                     Protected route handler
```

---

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `JWT_SECRET` | Secret for signing JWT tokens | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No (OAuth skipped if missing) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `DISCORD_CLIENT_ID` | Discord OAuth client ID | No |
| `DISCORD_CLIENT_SECRET` | Discord OAuth client secret | No |
| `SESSION_SECRET` | Express session secret | No (fallback used) |
| `CLIENT_URL` | Frontend URL for OAuth redirects | No (defaults to localhost:8080) |
| `SERVER_URL` | Backend URL for OAuth callback URLs | No |
