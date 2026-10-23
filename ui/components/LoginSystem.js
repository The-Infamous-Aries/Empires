/**
 * LoginSystem.js — Authentication modal for Empire.2
 *
 * Flow:
 *  1. Page loads → GameEngine calls LoginSystem.init()
 *  2. If a valid token is in localStorage, auto-verify and log in silently.
 *  3. Otherwise show the modal immediately (user must log in before playing).
 *  4. Supports local username/password, Google OAuth, and Discord OAuth.
 *  5. After successful auth the system checks /api/player-status:
 *       • hasNation === false → open AccountCreation modal so they build their nation.
 *       • hasNation === true  → emit 'auth' over the socket and enter the game directly.
 */
class LoginSystem {
    constructor() {
        this.modal          = null;
        this.isVisible      = false;
        this.currentTab     = 'login';  // 'login' | 'register'
        this._authResolved  = false;    // becomes true once auth is settled
        this._resolveAuth   = null;     // set by start() — resolved in _onAuthSuccess

        this._createModal();
        this._attachListeners();
    }

    // ─── Modal creation ───────────────────────────────────────────────────────

    _createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'login-modal hidden';
        this.modal.innerHTML = this._html();
        document.body.appendChild(this.modal);
    }

    _html() {
        return `
            <div class="login-modal-overlay"></div>
            <div class="login-modal-content">
                <div class="login-header">
                    <h2 class="login-title">🏰 Welcome to Dominion Wars</h2>
                    <p class="login-subtitle">Sign in to build your empire</p>
                </div>

                <div class="login-tabs">
                    <button class="tab-btn active" data-tab="login">Sign In</button>
                    <button class="tab-btn"        data-tab="register">Sign Up</button>
                </div>

                <div class="login-content">
                    <!-- OAuth -->
                    <div class="oauth-section">
                        <button class="oauth-btn google-btn" id="login-google-btn">
                            <svg class="oauth-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Continue with Google
                        </button>
                        <button class="oauth-btn discord-btn" id="login-discord-btn">
                            <svg class="oauth-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.194.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                            </svg>
                            Continue with Discord
                        </button>
                        <div class="divider"><span>or</span></div>
                    </div>

                    <!-- Login form -->
                    <div class="tab-content" data-tab="login">
                        <form class="login-form" id="login-form">
                            <div class="form-group">
                                <label for="login-username">Username</label>
                                <input type="text" id="login-username" name="username" required
                                       placeholder="Enter your username" autocomplete="username">
                            </div>
                            <div class="form-group">
                                <label for="login-password">Password</label>
                                <input type="password" id="login-password" name="password" required
                                       placeholder="Enter your password" autocomplete="current-password">
                            </div>
                            <div class="login-status hidden" id="login-status"></div>
                            <button type="submit" class="login-submit-btn">Sign In</button>
                        </form>
                    </div>

                    <!-- Register form -->
                    <div class="tab-content hidden" data-tab="register">
                        <form class="register-form" id="register-form">
                            <div class="form-group">
                                <label for="register-username">Username</label>
                                <input type="text" id="register-username" name="username" required
                                       placeholder="Choose a username" autocomplete="username">
                                <small class="form-hint">3–20 chars, letters/numbers/- and _ only</small>
                            </div>
                            <div class="form-group">
                                <label for="register-email">Email</label>
                                <input type="email" id="register-email" name="email" required
                                       placeholder="Enter your email" autocomplete="email">
                            </div>
                            <div class="form-group">
                                <label for="register-password">Password</label>
                                <input type="password" id="register-password" name="password" required
                                       placeholder="Create a password" autocomplete="new-password">
                                <small class="form-hint">At least 8 characters</small>
                            </div>
                            <div class="form-group">
                                <label for="register-confirm">Confirm Password</label>
                                <input type="password" id="register-confirm" name="confirmPassword" required
                                       placeholder="Confirm your password" autocomplete="new-password">
                            </div>
                            <div class="login-status hidden" id="register-status"></div>
                            <button type="submit" class="login-submit-btn">Create Account</button>
                        </form>
                    </div>
                </div>
            </div>`;
    }

    // ─── Event wiring ─────────────────────────────────────────────────────────

    _attachListeners() {
        // Tab switching
        this.modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                this._switchTab(e.target.dataset.tab);
            }
        });

        // Login form
        this.modal.querySelector('#login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this._handleLogin(e.target);
        });

        // Register form
        this.modal.querySelector('#register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this._handleRegister(e.target);
        });

        // OAuth buttons
        this.modal.querySelector('#login-google-btn').addEventListener('click', () => {
            this._setStatus('login', 'Redirecting to Google…', 'info');
            window.location.href = '/auth/google';
        });

        this.modal.querySelector('#login-discord-btn').addEventListener('click', () => {
            this._setStatus('login', 'Redirecting to Discord…', 'info');
            window.location.href = '/auth/discord';
        });
    }

    // ─── Tab switching ────────────────────────────────────────────────────────

    _switchTab(tabName) {
        this.currentTab = tabName;
        this.modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        this.modal.querySelectorAll('.tab-content').forEach(c => {
            c.classList.toggle('hidden', c.dataset.tab !== tabName);
        });
    }

    // ─── Show / hide ──────────────────────────────────────────────────────────

    show() {
        this.isVisible = true;
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        // Focus the first visible input after the animation settles
        setTimeout(() => {
            const first = this.modal.querySelector('.tab-content:not(.hidden) input');
            if (first) first.focus();
        }, 150);
    }

    hide() {
        this.isVisible = false;
        this.modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // ─── Status messages ──────────────────────────────────────────────────────

    _setStatus(form, message, type = 'info') {
        const el = this.modal.querySelector(`#${form}-status`);
        if (!el) return;
        el.textContent = message;
        el.className = `login-status ${type}`;
    }

    _clearStatus(form) {
        const el = this.modal.querySelector(`#${form}-status`);
        if (!el) return;
        el.textContent = '';
        el.className = 'login-status hidden';
    }

    // ─── Login ────────────────────────────────────────────────────────────────

    async _handleLogin(form) {
        const data = new FormData(form);
        const username = data.get('username').trim();
        const password = data.get('password');

        this._setStatus('login', 'Signing in…', 'info');
        const btn = form.querySelector('button[type=submit]');
        btn.disabled = true;

        try {
            const res = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const json = await res.json();

            if (json.success) {
                await this._onAuthSuccess(json);
            } else {
                this._setStatus('login', json.error || 'Login failed', 'error');
            }
        } catch {
            this._setStatus('login', 'Login failed — check your connection', 'error');
        } finally {
            btn.disabled = false;
        }
    }

    // ─── Register ─────────────────────────────────────────────────────────────

    async _handleRegister(form) {
        const data       = new FormData(form);
        const username   = data.get('username').trim();
        const email      = data.get('email').trim();
        const password   = data.get('password');
        const confirm    = data.get('confirmPassword');

        if (password !== confirm) {
            this._setStatus('register', 'Passwords do not match', 'error');
            return;
        }
        if (password.length < 8) {
            this._setStatus('register', 'Password must be at least 8 characters', 'error');
            return;
        }
        if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
            this._setStatus('register', 'Username: 3–20 chars, letters/numbers/- and _ only', 'error');
            return;
        }

        this._setStatus('register', 'Creating account…', 'info');
        const btn = form.querySelector('button[type=submit]');
        btn.disabled = true;

        try {
            const res = await fetch('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const json = await res.json();

            if (json.success) {
                await this._onAuthSuccess(json);
            } else {
                this._setStatus('register', json.error || 'Registration failed', 'error');
            }
        } catch {
            this._setStatus('register', 'Registration failed — check your connection', 'error');
        } finally {
            btn.disabled = false;
        }
    }

    // ─── OAuth callback (token in URL) ────────────────────────────────────────

    async _checkOAuthCallback() {
        const params = new URLSearchParams(window.location.search);
        const token  = params.get('token');
        if (!token) return false;

        // Clean the token from the URL immediately
        window.history.replaceState({}, document.title, window.location.pathname);

        try {
            const res  = await fetch('/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            const json = await res.json();

            if (json.success) {
                await this._onAuthSuccess({ ...json, token });
                return true;
            }
        } catch { /* fall through */ }

        // Token was in URL but invalid — show login modal
        this.show();
        return false;
    }

    // ─── Existing session check ───────────────────────────────────────────────

    async _checkExistingAuth() {
        const token = localStorage.getItem('empire_token');
        if (!token) return false;

        try {
            const res  = await fetch('/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            const json = await res.json();

            if (json.success) {
                await this._onAuthSuccess({ ...json, token });
                return true;
            }
        } catch { /* fall through */ }

        // Token is stale — clear it silently (no reload)
        localStorage.removeItem('empire_token');
        localStorage.removeItem('empire_user');
        return false;
    }

    // ─── Core auth success handler ────────────────────────────────────────────

    async _onAuthSuccess(data) {
        const { token, user } = data;

        // Persist token for stay-signed-in on next visit
        localStorage.setItem('empire_token', token);
        localStorage.setItem('empire_user', JSON.stringify(user));

        // Hide login modal
        this.hide();
        this._authResolved = true;

        // Auth the socket connection (window.socket is set up in index.html)
        if (window.socket) {
            window.socket.emit('auth', { token, username: user.username });
        }

        // Tell the rest of the game who is logged in
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('user_authenticated', user);
        }

        // Decide whether to show AccountCreation or go straight to the game.
        // This must run BEFORE we resolve the auth promise so the loading
        // screen stays up during the player-status check.
        await this._checkNationStatus(token, user);

        // Signal GameEngine that auth is done — it will initialise Player
        // with real user data, hide the loading screen, and start the loop.
        if (typeof GameEngine !== 'undefined' && GameEngine.onAuthComplete) {
            GameEngine.onAuthComplete(user);
        }

        // Resolve the Promise returned by start() so GameEngine.initialize()
        // can continue (it awaits start()).
        if (this._resolveAuth) {
            this._resolveAuth(user);
            this._resolveAuth = null;
        }
    }

    // ─── Nation status check ──────────────────────────────────────────────────

    async _checkNationStatus(token, user) {
        try {
            const res  = await fetch('/api/player-status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();

            if (!json.hasNation) {
                // First time playing — open account/nation creation wizard
                if (window.AccountCreation) {
                    window.AccountCreation.setAuthenticatedUser(user, token);
                    window.AccountCreation.showModal();
                }
            } else {
                // Returning player — load their existing nation from server
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('player_has_nation', {
                        nationId: json.nationId,
                        playerId: user.id
                    });
                }
            }
        } catch (err) {
            // Can't reach server — assume first-time player and open nation creation
            console.warn('LoginSystem: could not fetch player-status, opening nation creation', err);
            if (window.AccountCreation) {
                window.AccountCreation.setAuthenticatedUser(user, token);
                window.AccountCreation.showModal();
            }
        }
    }

    // ─── Logout ───────────────────────────────────────────────────────────────

    logout() {
        localStorage.removeItem('empire_token');
        localStorage.removeItem('empire_user');

        if (typeof EventBus !== 'undefined') EventBus.emit('user_logged_out');

        // Disconnect socket
        if (window.socket) window.socket.disconnect();

        // Full page reload resets all in-memory state
        window.location.reload();
    }

    // ─── Entry point called by GameEngine ─────────────────────────────────────

    /**
     * Called once after game systems are initialized.
     *
     * Returns a Promise that resolves ONLY when authentication is fully
     * settled — either the user logged in (auto or manually) or the auth
     * flow completed.  The loading screen stays up the whole time.
     *
     * GameEngine calls onAuthComplete(user) once this resolves.
     */
    start() {
        return new Promise(async (resolve) => {
            // Store resolve so _onAuthSuccess can call it
            this._resolveAuth = resolve;

            // 1. OAuth token in URL (returning from /auth/google or /auth/discord)
            if (await this._checkOAuthCallback()) return; // resolves inside _onAuthSuccess

            // 2. Existing valid token in localStorage (stay-signed-in)
            if (await this._checkExistingAuth()) return;  // resolves inside _onAuthSuccess

            // 3. No valid session — show the login modal and wait
            this.show();
            // Promise stays pending until the user logs in and _onAuthSuccess fires
        });
    }

    // ─── Singleton ────────────────────────────────────────────────────────────

    static init() {
        if (!LoginSystem.instance) {
            LoginSystem.instance = new LoginSystem();
        }
        return LoginSystem.instance;
    }
}

// Create singleton immediately when the script loads so the modal element
// exists in the DOM before DOMContentLoaded fires.
//
// NOTE: We do NOT use DOMContentLoaded here. The <script> tag for this file
// is placed just before </body>, so the DOM is already fully parsed when this
// code runs. Calling init() synchronously here guarantees LoginSystem.instance
// is non-null before index.html's DOMContentLoaded listener fires and calls
// GameEngine.initialize() → LoginSystem.instance.start().
LoginSystem.instance = null;
LoginSystem.init();

// Expose on window so game-engine.js can guard-check `window.LoginSystem`
window.LoginSystem = LoginSystem;
