"use strict";
/**
 * AccountCreation.js — Unified Authentication & Nation Creation System
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Renders the full sign-in / sign-up / nation-creation UI directly inside the
 * main tab workspace (replacing the legacy /auth page). Supports:
 *   • Email / password login & registration
 *   • Google OAuth
 *   • Discord OAuth
 *
 * On registration (any method) the user picks every nation attribute before the
 * account is created: Nation Name, Ruler Name (username), Government, Religion,
 * Color (faction), Currency, National Pet, National Food, National Water.
 *
 * Every choice is backed by a real game system:
 *   • Currency → World Bank (aurel / velt / krona / drachma / sovereign / talon)
 *   • Pet → National Pet Lottery / PET_ICONS (103 unique pets)
 *   • Color → faction color system (10 colors)
 *   • Government → GovernmentSystem (12 types, affects bonuses/penalties)
 *   • Religion → ReligionSystem (13 types, affects bonuses/penalties)
 *   • Food / Water → cosmetic culture shown on nation profile
 *
 * Exports:
 *   window.AccountCreation — { render(container), showLogin(), showRegister(),
 *                             showNationSetup(token), logout() }
 *
 * Wiring:
 *   game.js calls render(app) when the user is not authenticated.
 *   After a successful email login/register the response body IS the full game
 *   state (session cookie set), so game.js calls receive(state) and enters.
 *   After OAuth the token lands in the URL; game.js exchanges it via
 *   /api/login-oauth. If the account has no nation yet it calls
 *   showNationSetup(token); the user then submits the nation form to
 *   /api/nation-create and receives the full state.
 */

"use strict";

/* ═════════════════════════════════════════════════════════════════════
   OPTIONS — all sourced from real game systems via /api/catalog
   ═════════════════════════════════════════════════════════════════════ */

const PET_ICONS = [
  'Axolotl','Anteater','Ant','Alligator','Badger','Bat','Beaver','Bee','Beetle','Bison',
  'BlueTang','Camel','Cardinal','Cat','Centipede','Cheetah','Chicken','Clownfish','Cow','Crab',
  'Crow','Deer','Dog','Dolphin','Duck','Eagle','Elephant','Emu','Firefly','Fox',
  'Frog','Giraffe','Goat','Goose','Gorilla','Grizzly','Hamster','Hedgehog','Hippo','Horse',
  'Hummingbird','Iguana','Jellyfish','Jaguar','Kangaroo','Kiwi','Koala','Lemur','Ladybug','Mantis',
  'Monkey','Mouse','Octopus','Orangutan','Orca','Ostrich','Otter','Owl','Panda','Parrot',
  'Peacock','Pelican','Penguin','Pig','Pigeon','Platypus','PolarBear','Pufferfish','Rabbit','Raccoon',
  'Ram','Rat','RedPanda','Reindeer','Rhino','Salmon','Scorpion','Seahorse','Seal','Shark',
  'Sheep','Shrimp','Skunk','Sloth','Snail','Snake','Spider','Squirrel','Starfish','Stingray',
  'SugarGlider','Tiger','Toucan','Turkey','Turtle','Walrus','Whale','Wolf','Yak','Zebra'
];

const FOOD_KEYS = [
  'pizza','steak','cake','cookie','burger','donut','hotdog','ramen','salad','sushi','taco'
];
const WATER_KEYS = [
  'water','beer','coffee','juice','milk','milkshake','smoothie','soda','wine','liquor','energy-drink'
];
const PET_DEFAULT = 'none';

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const human = (value) =>
  String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

/* Returns the image path for an asset group/icon, or "" if missing. */
const assetIcon = (group, key) => {
  const src = (window.EmpiresAssets && window.EmpiresAssets.icon
    ? window.EmpiresAssets.icon(group, key)
    : null) || "";
  return esc(src);
};

/* Currency symbol for a currency key, from catalog.currencies. */
const currencySymbol = (key) => {
  const cfg = (window.AccountCreationCatalog && window.AccountCreationCatalog.currencies
    && window.AccountCreationCatalog.currencies[key]) || {};
  return cfg.symbol || "$";
};

class AccountCreationSystem {
    constructor() {
        this.container     = null;
        this.mode          = "login";      // login | register | nationSetup
        this.token         = null;         // OAuth token pending nation creation
        this.authUser      = null;         // OAuth user profile
        this.catalog       = null;         // governments / religions / colors / currencies / pets
        this.userData      = {};           // nation + account form data
        this.nameStatus    = { nationName: null, rulerName: null };
        this.nameTimers    = { nationName: null, rulerName: null };
        this._boundResize  = null;
    }

    /* ═════════════════════════════════════════════════════════════════
       RENDER ENTRY POINT
       ════════════════════════════════════════════════════════════════ */

    async render(container) {
        this.container = container;
        container.innerHTML = this._shell();
        this._bindShellEvents();
        await this._loadCatalog();
        this._showMode(this.mode);
    }

    showLogin() {
        if (!this.container) return;
        this.mode = "login";
        this.token = null;
        this._showMode("login");
    }
    showRegister() {
        if (!this.container) return;
        this.mode = "register";
        this.token = null;
        this._showMode("register");
    }
    showNationSetup(token, authUser) {
        if (!this.container) return;
        this.mode = "nationSetup";
        this.token = token;
        this.authUser = authUser || null;
        // Pre-fill ruler name from OAuth profile when available.
        if (authUser && authUser.username && !this.userData.rulerName) {
            this.userData.rulerName = authUser.username;
        }
        this.userData.nationName = this.userData.nationName || "";
        this._showMode("nationSetup");
    }

    /* ═════════════════════════════════════════════════════════════════
       SHELL + MODES
       ════════════════════════════════════════════════════════════════ */

    _shell() {
        return `
<div class="account-creation">
  <div class="ac-overlay"></div>
  <div class="ac-wrapper">
    <header class="ac-header">
      <button class="ac-back" id="ac-back" title="Back" aria-label="Back">&#8592;</button>
      <div class="ac-brand">
        <div class="ac-logo">DW</div>
        <div>
          <div class="ac-title" id="ac-title">Welcome to Sovereignty Epochs</div>
          <div class="ac-subtitle" id="ac-subtitle">Sign in to build your empire</div>
        </div>
      </div>
      <div class="ac-spacer"></div>
    </header>

    <main class="ac-body" id="ac-body"></main>

    <footer class="ac-footer" id="ac-footer"></footer>
  </div>
</div>`;
    }

    _bindShellEvents() {
        const back = document.getElementById("ac-back");
        if (back) back.addEventListener("click", () => {
            if (this.mode === "nationSetup") {
                this.showLogin();
            } else if (this.mode === "register") {
                this.showLogin();
            }
        });
    }

    _showMode(mode) {
        this.mode = mode;
        const body = document.getElementById("ac-body");
        const footer = document.getElementById("ac-footer");
        const title = document.getElementById("ac-title");
        const subtitle = document.getElementById("ac-subtitle");
        const back = document.getElementById("ac-back");

        if (!body || !footer) return;

        back.style.display = mode === "login" ? "none" : "";

        if (mode === "login") {
            title.textContent = "Welcome back";
            subtitle.textContent = "Sign in to your existing nation";
            body.innerHTML = this._loginHtml();
            footer.innerHTML = this._loginFooterHtml();
            this._wireLogin();
        } else if (mode === "register") {
            title.textContent = "Found a nation";
            subtitle.textContent = "Create your account and design your country";
            body.innerHTML = this._registerHtml();
            footer.innerHTML = this._registerFooterHtml();
            this._wireRegister();
        } else if (mode === "nationSetup") {
            const who = this.authUser ? this.authUser.username : "your nation";
            title.textContent = "Design " + esc(who);
            subtitle.textContent = "Choose your nation's identity before founding";
            body.innerHTML = this._nationSetupHtml();
            footer.innerHTML = this._nationSetupFooterHtml();
            this._wireNationSetup();
        }
    }

    /* ════════════════════════════════════════════════════════════════
       RENDER ENTRY POINT
       ═══════════════════════════════════════════════════════════════ */

    async render(container) {
        this.container = container;
        container.innerHTML = this._shell();
        this._bindShellEvents();
        await this._loadCatalog();
        this._showMode(this.mode);
    }

    showLogin() {
        if (!this.container) return;
        this.mode = "login";
        this.token = null;
        this._showMode("login");
    }
    showRegister() {
        if (!this.container) return;
        this.mode = "register";
        this.token = null;
        this._showMode("register");
    }
    showNationSetup(token, authUser) {
        if (!this.container) return;
        this.mode = "nationSetup";
        this.token = token;
        this.authUser = authUser || null;
        // Pre-fill ruler name from OAuth profile when available.
        if (authUser && authUser.username && !this.userData.rulerName) {
            this.userData.rulerName = authUser.username;
        }
        this.userData.nationName = this.userData.nationName || "";
        this._showMode("nationSetup");
    }

    /* ═════════════════════════════════════════════════════════════════
       SHELL + MODES
       ═══════════════════════════════════════════════════════════════ */

    _shell() {
        return `
<div class="account-creation">
  <div class="ac-overlay"></div>
  <div class="ac-wrapper">
    <header class="ac-header">
      <button class="ac-back" id="ac-back" title="Back" aria-label="Back">&#8592;</button>
      <div class="ac-brand">
        <div class="ac-logo">DW</div>
        <div>
          <div class="ac-title" id="ac-title">Welcome to Sovereignty Epochs</div>
          <div class="ac-subtitle" id="ac-subtitle">Sign in to build your empire</div>
        </div>
      </div>
      <div class="ac-spacer"></div>
    </header>

    <main class="ac-body" id="ac-body"></main>

    <footer class="ac-footer" id="ac-footer"></footer>
  </div>
</div>`;
    }

    _bindShellEvents() {
        const back = document.getElementById("ac-back");
        if (back) back.addEventListener("click", () => {
            if (this.mode === "nationSetup") {
                // Return to login (OAuth user can still choose email login)
                this.showLogin();
            } else if (this.mode === "register") {
                this.showLogin();
            }
        });
    }

    _showMode(mode) {
        this.mode = mode;
        const body = document.getElementById("ac-body");
        const footer = document.getElementById("ac-footer");
        const title = document.getElementById("ac-title");
        const subtitle = document.getElementById("ac-subtitle");
        const back = document.getElementById("ac-back");

        if (!body || !footer) return;

        back.style.display = mode === "login" ? "none" : "";

        if (mode === "login") {
            title.textContent = "Welcome back";
            subtitle.textContent = "Sign in to your existing nation";
            body.innerHTML = this._loginHtml();
            footer.innerHTML = this._loginFooterHtml();
            this._wireLogin();
        } else if (mode === "register") {
            title.textContent = "Found a nation";
            subtitle.textContent = "Create your account and design your country";
            body.innerHTML = this._registerHtml();
            footer.innerHTML = this._registerFooterHtml();
            this._wireRegister();
        } else if (mode === "nationSetup") {
            const who = this.authUser ? this.authUser.username : "your nation";
            title.textContent = "Design " + esc(who);
            subtitle.textContent = "Choose your nation's identity before founding";
            body.innerHTML = this._nationSetupHtml();
            footer.innerHTML = this._nationSetupFooterHtml();
            this._wireNationSetup();
        }
    }

    /* ═════════════════════════════════════════════════════════════════
       LOGIN
       ════════════════════════════════════════════════════════════════ */

    _loginHtml() {
        return `
      <section class="ac-card">
        <div class="ac-section-title">Sign in</div>
        <form id="ac-login-form" novalidate>
          <div class="ac-field">
            <label>Username or email <span class="ac-req">*</span></label>
            <input name="login" type="text" autocomplete="username" required
                   placeholder="Enter your username or email">
          </div>
          <div class="ac-field">
            <label>Password <span class="ac-req">*</span></label>
            <input name="password" type="password" autocomplete="current-password" required
                   placeholder="Enter your password">
          </div>
          <div id="ac-login-msg" class="ac-msg ac-msg-error"></div>
          <button type="submit" class="ac-btn ac-btn-primary" id="ac-login-submit">Sign in</button>
        </form>
        <div class="ac-divider"><span>or continue with</span></div>
        <div class="ac-oauth">
          <button type="button" class="ac-oauth-btn ac-oauth-google" id="ac-oauth-google">
            <span class="ac-oauth-icon">G</span> Continue with Google
          </button>
          <button type="button" class="ac-oauth-btn ac-oauth-discord" id="ac-oauth-discord">
            <span class="ac-oauth-icon">&#128348;</span> Continue with Discord
          </button>
        </div>
      </section>
      <section class="ac-card ac-card-light">
        <div class="ac-section-title">New to Sovereignty Epochs?</div>
        <p class="ac-muted">Create an account and found your first nation in minutes.</p>
        <button type="button" class="ac-btn ac-btn-outline" id="ac-to-register">Create account</button>
      </section>`;
    }

    _loginFooterHtml() {
        return `<button type="button" class="ac-link-btn" id="ac-forgot-password">Forgot password ?</button>`;
    }

    _wireLogin() {
        const form = document.getElementById("ac-login-form");
        const msg = document.getElementById("ac-login-msg");
        const submit = document.getElementById("ac-login-submit");

        form?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const login = fd.get("login").trim();
            const password = fd.get("password");
            if (!login || !password) return;

            submit.disabled = true;
            msg.textContent = "";
            try {
                const res = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify({ username: login, password }),
                });
                const json = await res.json();
                if (json.success && json.nation) {
                    // Session cookie already set by server. Enter the game.
                    window.receiveGameState ? window.receiveGameState(json) : null;
                    if (window.GameEngine && window.GameEngine.onAuthComplete) {
                        window.GameEngine.onAuthComplete({ id: json.player?.id, username: json.player?.username });
                    }
                } else {
                    msg.textContent = json.error || "Sign in failed.";
                }
            } catch (err) {
                msg.textContent = "Sign in failed — check your connection.";
            } finally {
                submit.disabled = false;
            }
        });

        document.getElementById("ac-to-register")?.addEventListener("click", () => this.showRegister());
        document.getElementById("ac-oauth-google")?.addEventListener("click", () => {
            window.location.href = "/auth/google";
        });
        document.getElementById("ac-oauth-discord")?.addEventListener("click", () => {
            window.location.href = "/auth/discord";
        });
    }

    /* ═════════════════════════════════════════════════════════════════
       REGISTER (email / password + full nation setup)
       ════════════════════════════════════════════════════════════════ */

    _registerHtml() {
        return `
      <section class="ac-card">
        <div class="ac-section-title">Create your account</div>
        <form id="ac-register-form" novalidate>
          <div class="ac-field">
            <label>Email address <span class="ac-req">*</span></label>
            <input name="email" type="email" autocomplete="email" required placeholder="you@example.com">
          </div>
          <div class="ac-field">
            <label>Username (Ruler Name) <span class="ac-req">*</span></label>
            <div class="ac-input-wrap">
              <input name="username" type="text" autocomplete="username" required
                     maxlength="30" placeholder="e.g. Emperor Nero">
              <span class="ac-status-icon" id="ac-ruler-status"></span>
            </div>
            <div class="ac-field-hint" id="ac-ruler-hint">2–30 characters. Must be unique.</div>
          </div>
          <div class="ac-field">
            <label>Password <span class="ac-req">*</span></label>
            <input name="password" type="password" autocomplete="new-password" required
                   minlength="8" placeholder="Create a password">
            <div class="ac-field-hint">At least 8 characters.</div>
          </div>
          <div class="ac-field">
            <label>Confirm password <span class="ac-req">*</span></label>
            <input name="confirmPassword" type="password" autocomplete="new-password" required
                   placeholder="Confirm your password">
          </div>
          <div id="ac-register-msg" class="ac-msg ac-msg-error"></div>
          <button type="submit" class="ac-btn ac-btn-primary" id="ac-register-submit" disabled>
            Create account &amp; found nation
          </button>
        </form>
      </section>

      <section class="ac-card ac-nation-setup">
        <div class="ac-section-title">Your new nation</div>
        <p class="ac-muted">These define your nation's identity, faction, and starting currency.</p>

        <div class="ac-field">
          <label>Nation Name <span class="ac-req">*</span></label>
          <div class="ac-input-wrap">
            <input name="nationName" type="text" required maxlength="60"
                   placeholder="e.g. The Roman Empire">
            <span class="ac-status-icon" id="ac-nation-status"></span>
          </div>
          <div class="ac-field-hint" id="ac-nation-hint">3–60 characters. Must be unique.</div>
        </div>

        <div class="ac-row">
          <div class="ac-col">
            <div class="ac-field">
              <label>Government <span class="ac-req">*</span></label>
              <select name="government" required>${this._selectOptions("government")}</select>
              <div class="ac-field-hint">Affects taxes, stability, environment, and military.</div>
            </div>
          </div>
          <div class="ac-col">
            <div class="ac-field">
              <label>Religion <span class="ac-req">*</span></label>
              <select name="religion" required>${this._selectOptions("religion")}</select>
              <div class="ac-field-hint">Affects happiness, tech growth, and military morale.</div>
            </div>
          </div>
        </div>

        <div class="ac-row">
          <div class="ac-col">
            <div class="ac-field">
              <label>Color (Faction) <span class="ac-req">*</span></label>
              ${this._colorGridHtml()}
            </div>
          </div>
          <div class="ac-col">
            <div class="ac-field">
              <label>Currency <span class="ac-req">*</span></label>
              ${this._currencyOptionsHtml()}
            </div>
          </div>
        </div>

        <div class="ac-section-title" style="margin-top:16px;">National Culture (cosmetic)</div>
        <div class="ac-culture">
          <div class="ac-culture-group">
            <div class="ac-culture-label">National Pet</div>
            <div class="ac-picker-grid">${this._petGridHtml()}</div>
          </div>
          <div class="ac-culture-group">
            <div class="ac-culture-label">National Food</div>
            <div class="ac-picker-grid">${this._choiceGridHtml("nationalFood", FOOD_KEYS)}</div>
          </div>
          <div class="ac-culture-group">
            <div class="ac-culture-label">National Water</div>
            <div class="ac-picker-grid">${this._choiceGridHtml("nationalWater", WATER_KEYS)}</div>
          </div>
        </div>
      </section>`;
    }

    _registerFooterHtml() {
        return `<button type="button" class="ac-link-btn" id="ac-to-login">Already have an account ? Sign in</button>`;
    }

    _wireRegister() {
        const form = document.getElementById("ac-register-form");
        const msg = document.getElementById("ac-register-msg");
        const submit = document.getElementById("ac-register-submit");
        const rulerInput = form?.querySelector('input[name="username"]');
        const nationInput = form?.querySelector('input[name="nationName"]');

        const validate = () => {
            const fd = new FormData(form);
            const email = fd.get("email") || "";
            const username = (fd.get("username") || "").trim();
            const password = fd.get("password") || "";
            const confirm = fd.get("confirmPassword") || "";
            const nationName = (fd.get("nationName") || "").trim();
            const government = fd.get("government") || "";
            const religion = fd.get("religion") || "";
            const currency = fd.get("currency") || "";
            const pet = this.userData.pet || PET_DEFAULT;
            const food = this.userData.nationalFood || null;
            const water = this.userData.nationalWater || null;

            let ok = email && username.length >= 2 && password.length >= 8 &&
                password === confirm && nationName.length >= 3 &&
                government && religion && currency && pet && food && water;

            if (this.nameStatus.rulerName === "taken" || this.nameStatus.nationName === "taken") ok = false;
            if (this.nameStatus.rulerName === "checking" || this.nameStatus.nationName === "checking") ok = false;

            submit.disabled = !ok;
        };

        const scheduleCheck = (field, value) => {
            clearTimeout(this.nameTimers[field]);
            this.nameStatus[field] = null;
            this._setNameStatus(field, null, "");
            if (!value || (field === "nationName" && value.length < 3) || (field === "rulerName" && value.length < 2)) {
                validate();
                return;
            }
            this.nameStatus[field] = "checking";
            this._setNameStatus(field, "checking", "Checking availability…");
            this.nameTimers[field] = setTimeout(async () => {
                try {
                    const endpoint = field === "nationName"
                        ? `/api/check-nation-name?name=${encodeURIComponent(value)}`
                        : `/api/check-ruler-name?name=${encodeURIComponent(value)}`;
                    const res = await fetch(endpoint, { credentials: "same-origin" });
                    const json = await res.json();
                    const current = field === "nationName" ? (nationInput?.value || "").trim() : (rulerInput?.value || "").trim();
                    if (current !== value) return;
                    if (json.available) {
                        this.nameStatus[field] = "ok";
                        this._setNameStatus(field, "ok", "✅ Available");
                    } else {
                        this.nameStatus[field] = "taken";
                        this._setNameStatus(field, "taken", `❌ ${json.message || "Already taken"}`);
                    }
                } catch {
                    this.nameStatus[field] = "error";
                    this._setNameStatus(field, "error", "⚠️ Could not verify");
                }
                validate();
            }, 450);
        };

        rulerInput?.addEventListener("input", (e) => {
            this.userData.rulerName = e.target.value.trim();
            scheduleCheck("rulerName", this.userData.rulerName);
        });
        nationInput?.addEventListener("input", (e) => {
            this.userData.nationName = e.target.value.trim();
            scheduleCheck("nationName", this.userData.nationName);
        });

        form?.querySelectorAll("select").forEach(sel => {
            sel.addEventListener("change", validate);
        });
        this._bindCulturePickers(validate);

        form?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const payload = {
                username: (fd.get("username") || "").trim(),
                email: fd.get("email") || "",
                password: fd.get("password"),
                nation: {
                    name: (fd.get("nationName") || "").trim(),
                    ruler: (fd.get("username") || "").trim(),
                    government: fd.get("government"),
                    religion: fd.get("religion"),
                    factionKey: this.userData.factionKey,
                    factionColor: this.userData.factionColor,
                    currency: fd.get("currency"),
                    nationalPet: this.userData.pet || PET_DEFAULT,
                    nationalFood: this.userData.nationalFood || null,
                    nationalWater: this.userData.nationalWater || null,
                },
            };

            submit.disabled = true;
            msg.textContent = "";
            try {
                const res = await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify(payload),
                });
                const json = await res.json();
                if (json.success && json.nation) {
                    if (window.receiveGameState) window.receiveGameState(json);
                    if (window.GameEngine && window.GameEngine.onAuthComplete) {
                        window.GameEngine.onAuthComplete({ id: json.player?.id, username: payload.username });
                    }
                } else {
                    msg.textContent = json.error || "Registration failed.";
                    submit.disabled = false;
                }
            } catch (err) {
                msg.textContent = "Registration failed — check your connection.";
                submit.disabled = false;
            }
        });

        document.getElementById("ac-to-login")?.addEventListener("click", () => this.showLogin());
        validate();
    }

    /* ═════════════════════════════════════════════════════════════════
       NATION SETUP (after OAuth — account exists, nation does not)
       ════════════════════════════════════════════════════════════════ */

    _nationSetupHtml() {
        const prefill = this.authUser ? ` (signed in as ${esc(this.authUser.username)})` : "";
        return `
      <section class="ac-card">
        <div class="ac-section-title">Found your nation${prefill}</div>
        <p class="ac-muted">Your account is ready. Choose your nation's identity, faction, and starting currency.</p>

        <div class="ac-field">
          <label>Ruler Name (shown to others) <span class="ac-req">*</span></label>
          <div class="ac-input-wrap">
            <input name="rulerName" type="text" required maxlength="30"
                   value="${esc(this.userData.rulerName || "")}"
                   placeholder="e.g. Emperor Nero">
            <span class="ac-status-icon" id="ac-ns-ruler-status"></span>
          </div>
          <div class="ac-field-hint" id="ac-ns-ruler-hint">2–30 characters. Must be unique.</div>
        </div>

        <div class="ac-field">
          <label>Nation Name <span class="ac-req">*</span></label>
          <div class="ac-input-wrap">
            <input name="nationName" type="text" required maxlength="60"
                   value="${esc(this.userData.nationName || "")}"
                   placeholder="e.g. The Roman Empire">
            <span class="ac-status-icon" id="ac-ns-nation-status"></span>
          </div>
          <div class="ac-field-hint" id="ac-ns-nation-hint">3–60 characters. Must be unique.</div>
        </div>

        <div class="ac-row">
          <div class="ac-col">
            <div class="ac-field">
              <label>Government <span class="ac-req">*</span></label>
              <select name="government" required>${this._selectOptions("government")}</select>
            </div>
          </div>
          <div class="ac-col">
            <div class="ac-field">
              <label>Religion <span class="ac-req">*</span></label>
              <select name="religion" required>${this._selectOptions("religion")}</select>
            </div>
          </div>
        </div>

        <div class="ac-row">
          <div class="ac-col">
            <div class="ac-field">
              <label>Color (Faction) <span class="ac-req">*</span></label>
              ${this._colorGridHtml()}
            </div>
          </div>
          <div class="ac-col">
            <div class="ac-field">
              <label>Currency <span class="ac-req">*</span></label>
              ${this._currencyOptionsHtml()}
            </div>
          </div>
        </div>

        <div class="ac-section-title" style="margin-top:16px;">National Culture (cosmetic)</div>
        <div class="ac-culture">
          <div class="ac-culture-group">
            <div class="ac-culture-label">National Pet</div>
            <div class="ac-picker-grid">${this._petGridHtml()}</div>
          </div>
          <div class="ac-culture-group">
            <div class="ac-culture-label">National Food</div>
            <div class="ac-picker-grid">${this._choiceGridHtml("nationalFood", FOOD_KEYS)}</div>
          </div>
          <div class="ac-culture-group">
            <div class="ac-culture-label">National Water</div>
            <div class="ac-picker-grid">${this._choiceGridHtml("nationalWater", WATER_KEYS)}</div>
          </div>
        </div>

        <div id="ac-ns-msg" class="ac-msg ac-msg-error"></div>
      </section>`;
    }

    _nationSetupFooterHtml() {
        return `<button type="button" class="ac-link-btn" id="ac-ns-back-to-login">Back to sign in</button>`;
    }

    _wireNationSetup() {
        const msg = document.getElementById("ac-ns-msg");
        const rulerInput = document.querySelector('input[name="rulerName"]');
        const nationInput = document.querySelector('input[name="nationName"]');

        const validate = () => {
            const ruler = (rulerInput?.value || "").trim();
            const nation = (nationInput?.value || "").trim();
            const government = document.querySelector('select[name="government"]')?.value || "";
            const religion = document.querySelector('select[name="religion"]')?.value || "";
            const currency = document.querySelector('select[name="currency"]')?.value || "";
            const pet = this.userData.pet || PET_DEFAULT;
            const food = this.userData.nationalFood || null;
            const water = this.userData.nationalWater || null;

            let ok = ruler.length >= 2 && nation.length >= 3 && government && religion && currency &&
                pet && food && water;
            if (this.nameStatus.rulerName === "taken" || this.nameStatus.nationName === "taken") ok = false;
            if (this.nameStatus.rulerName === "checking" || this.nameStatus.nationName === "checking") ok = false;
            const submit = document.getElementById("ac-ns-submit");
            if (submit) submit.disabled = !ok;
        };

        const scheduleCheck = (field, value) => {
            clearTimeout(this.nameTimers[field]);
            this.nameStatus[field] = null;
            this._setNameStatus(field, null, "");
            if (!value || (field === "nationName" && value.length < 3) || (field === "rulerName" && value.length < 2)) {
                validate();
                return;
            }
            this.nameStatus[field] = "checking";
            this._setNameStatus(field, "checking", "Checking availability…");
            this.nameTimers[field] = setTimeout(async () => {
                try {
                    const endpoint = field === "nationName"
                        ? `/api/check-nation-name?name=${encodeURIComponent(value)}`
                        : `/api/check-ruler-name?name=${encodeURIComponent(value)}`;
                    const res = await fetch(endpoint, { credentials: "same-origin" });
                    const json = await res.json();
                    const current = field === "nationName" ? (nationInput?.value || "").trim() : (rulerInput?.value || "").trim();
                    if (current !== value) return;
                    if (json.available) {
                        this.nameStatus[field] = "ok";
                        this._setNameStatus(field, "ok", "✅ Available");
                    } else {
                        this.nameStatus[field] = "taken";
                        this._setNameStatus(field, "taken", `❌ ${json.message || "Already taken"}`);
                    }
                } catch {
                    this.nameStatus[field] = "error";
                    this._setNameStatus(field, "error", "⚠️ Could not verify");
                }
                validate();
            }, 450);
        };

        rulerInput?.addEventListener("input", (e) => {
            this.userData.rulerName = e.target.value.trim();
            scheduleCheck("rulerName", this.userData.rulerName);
        });
        nationInput?.addEventListener("input", (e) => {
            this.userData.nationName = e.target.value.trim();
            scheduleCheck("nationName", this.userData.nationName);
        });
        document.querySelectorAll('select[name="government"],select[name="religion"],select[name="currency"]').forEach(sel => {
            sel.addEventListener("change", validate);
        });
        this._bindCulturePickers(validate);

        document.getElementById("ac-ns-submit")?.addEventListener("click", async () => {
            if (!this.token) {
                msg.textContent = "Session expired — please sign in again.";
                this.showLogin();
                return;
            }
            const ruler = (rulerInput?.value || "").trim();
            const nation = (nationInput?.value || "").trim();
            const government = document.querySelector('select[name="government"]').value;
            const religion = document.querySelector('select[name="religion"]').value;
            const currency = document.querySelector('select[name="currency"]').value;

            const submit = document.getElementById("ac-ns-submit");
            submit.disabled = true;
            msg.textContent = "";
            try {
                const res = await fetch("/api/nation-create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify({
                        token: this.token,
                        name: nation,
                        ruler,
                        government,
                        religion,
                        factionKey: this.userData.factionKey,
                        factionColor: this.userData.factionColor,
                        currency,
                        nationalPet: this.userData.pet || PET_DEFAULT,
                        nationalFood: this.userData.nationalFood || null,
                        nationalWater: this.userData.nationalWater || null,
                    }),
                });
                const json = await res.json();
                if (json.success && json.nation) {
                    if (window.receiveGameState) window.receiveGameState(json);
                    if (window.GameEngine && window.GameEngine.onAuthComplete) {
                        window.GameEngine.onAuthComplete({ id: json.player?.id, username: ruler });
                    }
                } else {
                    msg.textContent = json.error || "Failed to found nation.";
                    submit.disabled = false;
                }
            } catch (err) {
                msg.textContent = "Failed to found nation — check your connection.";
                submit.disabled = false;
            }
        });

        document.getElementById("ac-ns-back-to-login")?.addEventListener("click", () => this.showLogin());
        validate();
    }

    /* ═════════════════════════════════════════════════════════════════
       PICKER BUILDERS
       ════════════════════════════════════════════════════════════════ */

    async _loadCatalog() {
        try {
            const res = await fetch("/api/catalog", { credentials: "same-origin" });
            if (res.ok) this.catalog = await res.json();
        } catch { /* catalog optional; fall back to defaults */ }
        // Expose catalog globally so other modules (e.g. currency symbol) can read it.
        window.AccountCreationCatalog = this.catalog || {};
    }

    _selectOptions(type) {
        let items = {};
        if (this.catalog) {
            if (type === "government") items = this.catalog.governments || {};
            else if (type === "religion") items = this.catalog.religions || {};
        }
        if (!items || Object.keys(items).length === 0) {
            items = type === "government"
                ? { liberalDemocracy: "Liberal Democracy", monotheism: "Monotheism" }
                : { monotheism: "Monotheism", atheism: "Atheism" };
        }
        let html = "";
        let first = null;
        for (const [key, val] of Object.entries(items)) {
            const name = typeof val === "string" ? val : (val.name || key);
            const iconSrc = assetIcon(type === "government" ? "Government" : "Religion", key);
            const selected = first === null ? " selected" : "";
            if (first === null) first = key;
            html += `<option value="${esc(key)}"${selected}>
              ${iconSrc ? `<img src="${iconSrc}" class="ac-select-icon" alt="" style="width:18px;height:18px;vertical-align:-3px;margin-right:6px;border-radius:3px;">` : ""}
              ${esc(name)}
            </option>`;
        }
        // Remember defaults.
        if (!this.userData.factionKey && type === "government") this.userData.selectedGovernment = first;
        if (!this.userData.selectedReligion && type === "religion") this.userData.selectedReligion = first;
        return html;
    }

    _currencyOptionsHtml() {
        let currencies = {};
        if (this.catalog && this.catalog.currencies) currencies = this.catalog.currencies;
        if (!currencies || Object.keys(currencies).length === 0) {
            // Fallback: real World Bank currencies.
            currencies = {
                aurel:   { key: 'aurel',   name: 'Aurel',   abbrev: 'AUR', symbol: '₳', baseRate: 100 },
                velt:    { key: 'velt',    name: 'Velt',    abbrev: 'VLT', symbol: '✦', baseRate: 100 },
                krona:   { key: 'krona',   name: 'Krona',   abbrev: 'KRN', symbol: '₭', baseRate: 100 },
                drachma: { key: 'drachma', name: 'Drachma', abbrev: 'DRM', symbol: 'ð', baseRate: 100 },
                sovereign: { key: 'sovereign', name: 'Sovereign', abbrev: 'SOV', symbol: 'ꜱ', baseRate: 100 },
                talon:   { key: 'talon',   name: 'Talon',   abbrev: 'TLN', symbol: '₮', baseRate: 100 },
            };
        }
        let html = "";
        let firstKey = null;
        for (const [key, cfg] of Object.entries(currencies)) {
            const name = cfg.name || key;
            const abbrev = cfg.abbrev || "";
            const symbol = cfg.symbol || "$";
            const selected = firstKey === null ? " selected" : "";
            if (firstKey === null) firstKey = key;
            if (!this.userData.currency) this.userData.currency = key;
            html += `<option value="${esc(key)}"${selected}>
              ${esc(name)} <span class="ac-currency-symbol">${esc(symbol)}</span> (${esc(abbrev)})
            </option>`;
        }
        return html;
    }

    _colorGridHtml() {
        let colors = {};
        if (this.catalog && this.catalog.colors) colors = this.catalog.colors;
        if (!colors || Object.keys(colors).length === 0) {
            colors = {
                aqua: { key: "aqua", name: "Aqua Federation", hex: "#00BFBF" },
                black: { key: "black", name: "Black Empire", hex: "#1a1a1a" },
                blue: { key: "blue", name: "Blue Republic", hex: "#0066FF" },
                green: { key: "green", name: "Green Alliance", hex: "#00AA00" },
                lime: { key: "lime", name: "Lime Dominion", hex: "#7FCC00" },
                orange: { key: "orange", name: "Orange Coalition", hex: "#FF8C00" },
                pink: { key: "pink", name: "Pink Realm", hex: "#FF69B4" },
                purple: { key: "purple", name: "Purple Sovereignty", hex: "#8A2BE2" },
                red: { key: "red", name: "Red Confederation", hex: "#E00000" },
                yellow: { key: "yellow", name: "Yellow Union", hex: "#FFD700" },
            };
        }
        // Default color.
        if (!this.userData.factionKey) {
            const firstKey = Object.keys(colors)[0];
            const first = colors[firstKey];
            this.userData.factionKey = firstKey;
            this.userData.factionColor = first ? first.hex : "#0066FF";
        }

        let html = `<div class="ac-color-grid">`;
        for (const [key, c] of Object.entries(colors)) {
            const hex = c.hex || "#0066FF";
            const name = c.name || key;
            const iconSrc = assetIcon("Colors", key);
            const selected = key === this.userData.factionKey ? " selected" : "";
            html += `
              <label class="ac-color-btn${selected}" data-key="${esc(key)}">
                <input type="radio" name="factionKey" value="${esc(key)}" ${selected ? "checked" : ""} style="display:none">
                <div class="ac-color-preview">
                  ${iconSrc ? `<img src="${iconSrc}" class="ac-color-icon" alt="${esc(name)}" style="width:34px;height:34px;border-radius:6px;object-fit:cover;border:1px solid rgba(0,0,0,0.15);background:#fff;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">` : ""}
                  <span class="ac-color-swatch" style="background:${esc(hex)};display:${iconSrc ? "none" : "block"};"></span>
                  <span class="ac-color-hex" style="font-size:10px;color:rgba(255,255,255,0.7);">${esc(hex)}</span>
                </div>
                <span class="ac-color-name">${esc(name)}</span>
              </label>`;
        }
        html += `</div>`;
        return html;
    }

    _choiceGridHtml(name, keys) {
        let html = "";
        const current = this.userData[name];
        const group = name === "nationalFood" ? "Food" : name === "nationalWater" ? "Water" : name;
        for (const key of keys) {
            const label = human(key);
            const checked = key === current ? " checked" : "";
            if (checked && !this.userData[name]) this.userData[name] = key;
            const iconSrc = assetIcon(group, key);
            html += `
              <label class="ac-choice-item${checked ? " selected" : ""}">
                <input type="radio" name="${esc(name)}" value="${esc(key)}"${checked} style="display:none">
                <span class="ac-choice-preview">
                  ${iconSrc ? `<img src="${iconSrc}" class="ac-choice-icon-img" alt="${esc(label)}" style="width:38px;height:38px;border-radius:8px;object-fit:cover;border:1px solid rgba(0,0,0,0.15);background:#fff;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">` : ""}
                  <span class="ac-choice-icon-fallback" style="display:${iconSrc ? "none" : "block"};font-size:1.5rem;line-height:1;">${this._choiceIcon(name, key)}</span>
                </span>
                <span class="ac-choice-label">${esc(label)}</span>
              </label>`;
        }
        return `<div class="ac-choice-grid">${html}</div>`;
    }

    _petGridHtml() {
        let html = "";
        const current = this.userData.pet;
        for (const key of PET_ICONS) {
            const checked = key === current ? " checked" : "";
            if (checked && !this.userData.pet) this.userData.pet = key;
            // Pet icon images live under assets/images/Pets/<key>.png (e.g. Cat.png).
            const iconSrc = assetIcon("Pets", key);
            const fallback = this._petEmoji(key);
            html += `
              <label class="ac-choice-item${checked ? " selected" : ""}">
                <input type="radio" name="pet" value="${esc(key)}"${checked} style="display:none">
                <span class="ac-choice-preview">
                  ${iconSrc ? `<img src="${iconSrc}" class="ac-pet-icon-img" alt="${esc(key)}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid rgba(0,0,0,0.12);background:#fff;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">` : ""}
                  <span class="ac-pet-icon-emoji" style="display:${iconSrc ? "none" : "block"};font-size:1.6rem;line-height:1;display:block;">${fallback}</span>
                </span>
                <span class="ac-choice-label">${esc(key)}</span>
              </label>`;
        }
        // "No pet" option.
        const noneChecked = (current === PET_DEFAULT || !this.userData.pet) ? " checked" : "";
        if (noneChecked && !this.userData.pet) this.userData.pet = PET_DEFAULT;
        html += `
          <label class="ac-choice-item${noneChecked ? " selected" : ""}">
            <input type="radio" name="pet" value="${PET_DEFAULT}"${noneChecked} style="display:none">
            <span class="ac-choice-preview">
              <span class="ac-pet-icon-emoji">🚫</span>
            </span>
            <span class="ac-choice-label">No Pet</span>
          </label>`;
        return `<div class="ac-choice-grid ac-pet-grid">${html}</div>`;
    }

    _choiceIcon(group, key) {
        const emojis = {
            nationalFood: { pizza: "🍕", steak: "🥩", cake: "🍰", cookie: "🍪", burger: "🍔", donut: "🍩", hotdog: "🌭", ramen: "🍜", salad: "🥗", sushi: "🍣", taco: "🌮" },
            nationalWater: { water: "💧", beer: "🍺", coffee: "☕", juice: "🧃", milk: "🥛", milkshake: "🥤", smoothie: "🥤", soda: "🥤", wine: "🍷", liquor: "🥃", "energy-drink": "⚡" },
        };
        return (emojis[group] && emojis[group][key]) || "•";
    }

    _petEmoji(key) {
        const map = {
            Axolotl:"🦎",Anteater:"🐜",Ant:"🐜",Alligator:"🐊",Badger:"🦡",Bat:"🦇",Beaver:"🦫",Bee:"🐝",Beetle:"🐞",Bison:"🦬",
            BlueTang:"🐙",Camel:"🐫",Cardinal:"🐦",Cat:"🐱",Centipede:"🐛",Cheetah:"🐆",Chicken:"🐔",Clownfish:"🐠",Cow:"🐮",Crab:"🦀",
            Crow:"🐦",Deer:"🦌",Dog:"🐶",Dolphin:"🐬",Duck:"🦆",Eagle:"🦅",Elephant:"🐘",Emu:"🐦",Firefly:"🐛",Fox:"🦊",
            Frog:"🐸",Giraffe:"🦒",Goat:"🐐",Goose:"🪿",Gorilla:"🦍",Grizzly:"🐻",Hamster:"🐹",Hedgehog:"🦔",Hippo:"🦛",Horse:"🐴",
            Hummingbird:"🐦",Iguana:"🦎",Jellyfish:"🪼",Jaguar:"🐆",Kangaroo:"🦘",Kiwi:"🐦",Koala:"🐨",Lemur:"🐒",Ladybug:"🐞",Mantis:"🦗",
            Monkey:"🐵",Mouse:"🐭",Octopus:"🐙",Orangutan:"🐒",Orca:"🐳",Ostrich:"🐦",Otter:"🦦",Owl:"🦉",Panda:"🐼",Parrot:"🦜",
            Peacock:"🦚",Pelican:"🐦",Penguin:"🐧",Pig:"🐷",Pigeon:"🐦",Platypus:"🦆",PolarBear:"🐻‍❄️",Pufferfish:"🐡",Rabbit:"🐰",Raccoon:"🦝",
            Ram:"🐏",Rat:"🐀",RedPanda:"🐼",Reindeer:"🦌",Rhino:"🦏",Salmon:"🐟",Scorpion:"🦂",Seahorse:"🦭",Seal:"🦭",Shark:"🦈",
            Sheep:"🐑",Shrimp:"🦐",Skunk:"🦨",Sloth:"🦥",Snail:"🐌",Snake:"🐍",Spider:"🕷️",Squirrel:"🐿️",Starfish:"🦑",Stingray:"🫎",
            SugarGlider:"🐿️",Tiger:"🐯",Toucan:"🦜",Turkey:"🦃",Turtle:"🐢",Walrus:"🦭",Whale:"🐋",Wolf:"🐺",Yak:"🐂",Zebra:"🦓"
        };
        return map[key] || "•";
    }

    _bindCulturePickers(onValidate) {
        const grids = document.querySelectorAll(".ac-picker-grid, .ac-choice-grid");
        grids.forEach(grid => {
            grid.addEventListener("change", (e) => {
                const radio = e.target.closest('input[type="radio"]');
                if (!radio) return;
                const name = radio.name;
                const value = radio.value;
                this.userData[name] = value;

                grid.querySelectorAll(".ac-choice-item, .ac-color-btn").forEach(item => {
                    const input = item.querySelector('input[type="radio"]');
                    item.classList.toggle("selected", input && input.checked);
                });
                if (name === "factionKey") {
                    const btn = grid.querySelector(`.ac-color-btn[data-key="${esc(value)}"]`);
                    if (btn) {
                        const swatch = btn.querySelector(".ac-color-swatch");
                        this.userData.factionColor = swatch ? swatch.style.backgroundColor : this.userData.factionColor;
                    }
                }
                onValidate();
            });
            grid.querySelectorAll(".ac-choice-item, .ac-color-btn").forEach(item => {
                const input = item.querySelector('input[type="radio"]');
                if (input && input.checked) item.classList.add("selected");
            });
        });
    }

    _setNameStatus(field, status, msg) {
        const iconId = field === "nationName" ? (document.getElementById("ac-ns-nation-status") ? "ac-ns-nation-status" : "ac-nation-status")
                      : (document.getElementById("ac-ns-ruler-status") ? "ac-ns-ruler-status" : "ac-ruler-status");
        const hintId = field === "nationName" ? (document.getElementById("ac-ns-nation-hint") ? "ac-ns-nation-hint" : "ac-nation-hint")
                      : (document.getElementById("ac-ns-ruler-hint") ? "ac-ns-ruler-hint" : "ac-ruler-hint");
        const icon = document.getElementById(iconId);
        const hint = document.getElementById(hintId);
        if (icon) icon.textContent = status === "checking" ? "⏳" : status === "ok" ? "✅" : status === "taken" ? "❌" : status === "error" ? "⚠️" : "";
        if (hint) {
            if (msg) { hint.textContent = msg; hint.className = `ac-field-hint ${status === "ok" ? "hint-ok" : status === "taken" ? "hint-err" : "hint-warn"}`; }
            else { hint.className = "ac-field-hint"; hint.textContent = field === "nationName" ? "3–60 characters. Must be unique." : "2–30 characters. Must be unique."; }
        }
    }

    /* ══════════════════════════════════════════════════════════════════
       LOGOUT
       ════════════════════════════════════════════════════════════════ */

    async logout() {
        try { await fetch("/api/logout", { method: "POST", credentials: "same-origin" }); } catch {}
        localStorage.removeItem("empire_token");
        localStorage.removeItem("empire_user");
        window.location.reload();
    }
}

window.AccountCreation = new AccountCreationSystem();
