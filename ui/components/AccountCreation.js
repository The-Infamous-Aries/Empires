/**
 * AccountCreation.js — Single-Page Nation Creation Wizard
 * Dominion Wars - Nation Building Strategy Game
 *
 * Displays everything on one scrollable form beside a live nation preview card.
 * Performs real server-side uniqueness checks for both Nation Name and Ruler Name.
 * Requires GovernmentSystem and ReligionSystem to be loaded.
 */

class AccountCreationSystem {
    constructor() {
        this.isInitialized   = false;
        this.isAccountCreated = false;

        // All user selections, mirrored from form inputs in real time
        this.userData = {
            rulerName:          '',
            nationName:         '',
            motto:              '',
            factionColor:       null,
            selectedColorKey:   null,
            selectedGovernment: 'liberalDemocracy',
            selectedReligion:   'monotheism'
        };

        // Uniqueness check state (used to gate submission)
        this._nameStatus = {
            nationName: null,   // null | 'checking' | 'ok' | 'taken' | 'error'
            rulerName:  null
        };

        // Debounce timers for uniqueness checks
        this._nameTimers = { nationName: null, rulerName: null };

        // Set by LoginSystem after successful auth
        this._authUser  = null;
        this._authToken = null;

        this.initialize();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BOOTSTRAP
    // ─────────────────────────────────────────────────────────────────────────

    setAuthenticatedUser(user, token) {
        this._authUser  = user;
        this._authToken = token;
        // Pre-fill nothing on the creation form from the auth user —
        // the auth username is stored on the player record already; the
        // creation form only captures nation/ruler info.
    }

    initialize() {
        this._createModal();
        this._bindEvents();
        this._waitForSystems();
        this.isInitialized = true;
    }

    _waitForSystems() {
        const tryPopulate = () => {
            if (window.GovernmentSystem) this._populateGovernments();
            if (window.ReligionSystem)   this._populateReligions();
        };
        tryPopulate();
        if (!window.GovernmentSystem || !window.ReligionSystem) {
            const interval = setInterval(() => {
                tryPopulate();
                if (window.GovernmentSystem && window.ReligionSystem) clearInterval(interval);
            }, 150);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MODAL HTML
    // ─────────────────────────────────────────────────────────────────────────

    _createModal() {
        if (document.getElementById('account-creation-modal')) return;

        const colorOptions = this._buildColorOptions();

        const html = `
<div id="account-creation-modal" class="ac-modal hidden" role="dialog" aria-modal="true" aria-label="Create Your Nation">
  <div class="ac-overlay"></div>
  <div class="ac-container">

    <!-- ── LEFT COLUMN: Form ─────────────────────────────────── -->
    <div class="ac-form-col">
      <div class="ac-form-header">
        <h2>🏰 Found Your Nation</h2>
        <p>Set up your ruler and nation to begin your empire</p>
      </div>

      <div class="ac-form-body">

        <!-- Ruler Info -->
        <section class="ac-section">
          <h3 class="ac-section-title">⚜️ Ruler</h3>

          <div class="ac-field">
            <label for="ac-ruler-name">Ruler Name <span class="ac-required">*</span></label>
            <div class="ac-input-wrap">
              <input type="text" id="ac-ruler-name" placeholder="e.g. Emperor Nero" maxlength="30" autocomplete="nickname">
              <span class="ac-status-icon" id="ruler-status-icon"></span>
            </div>
            <div class="ac-field-hint" id="ruler-name-hint">2–30 letters, spaces, hyphens, apostrophes. Must be unique in-game.</div>
          </div>
        </section>

        <!-- Nation Info -->
        <section class="ac-section">
          <h3 class="ac-section-title">🗺️ Nation</h3>

          <div class="ac-field">
            <label for="ac-nation-name">Nation Name <span class="ac-required">*</span></label>
            <div class="ac-input-wrap">
              <input type="text" id="ac-nation-name" placeholder="e.g. The Roman Empire" maxlength="50" autocomplete="organization">
              <span class="ac-status-icon" id="nation-status-icon"></span>
            </div>
            <div class="ac-field-hint" id="nation-name-hint">3–50 characters. Must be unique in-game.</div>
          </div>

          <div class="ac-field">
            <label for="ac-motto">National Motto <span class="ac-optional">(optional)</span></label>
            <input type="text" id="ac-motto" placeholder="e.g. Strength through Unity" maxlength="60" autocomplete="off">
            <div class="ac-field-hint">Up to 60 characters — shown on your nation profile.</div>
          </div>
        </section>

        <!-- Government -->
        <section class="ac-section">
          <h3 class="ac-section-title">🏛️ Government
            <button type="button" class="ac-ref-btn" id="ac-gov-ref-btn" title="View encyclopedia">📖</button>
          </h3>
          <p class="ac-section-desc">Select your nation's system of governance — each shapes your bonuses and policies.</p>
          <div class="ac-picker-grid" id="ac-gov-grid" role="radiogroup" aria-label="Government type"></div>
          <div id="ac-gov-preview" class="ac-preview-box"></div>
        </section>

        <!-- Religion -->
        <section class="ac-section">
          <h3 class="ac-section-title">🕊️ Religion &amp; Philosophy
            <button type="button" class="ac-ref-btn" id="ac-rel-ref-btn" title="View encyclopedia">📖</button>
          </h3>
          <p class="ac-section-desc">Choose the faith or philosophy that guides your nation's people.</p>
          <div class="ac-picker-grid" id="ac-rel-grid" role="radiogroup" aria-label="Religion"></div>
          <div id="ac-rel-preview" class="ac-preview-box"></div>
        </section>

        <!-- Faction Color -->
        <section class="ac-section">
          <h3 class="ac-section-title">🎨 World Congress Faction <span class="ac-required">*</span></h3>
          <p class="ac-section-desc">Choose your faction color for World Congress representation. Each faction earns seats based on member count.</p>
          <div class="ac-color-grid" id="ac-color-grid">
            ${colorOptions}
          </div>
          <div class="ac-color-selection-hint" id="ac-color-hint">Select a faction above</div>
        </section>

      </div><!-- /ac-form-body -->

      <!-- Footer actions -->
      <div class="ac-form-footer">
        <div class="ac-form-errors" id="ac-form-errors"></div>
        <button type="button" id="ac-submit-btn" class="ac-submit-btn" disabled>
          ⚔️ Found My Nation
        </button>
      </div>
    </div><!-- /ac-form-col -->

    <!-- ── RIGHT COLUMN: Nation Preview ─────────────────────── -->
    <div class="ac-preview-col">
      <div class="ac-nation-card" id="ac-nation-card">
        <div class="ac-nation-card-header" id="ac-card-header">
          <div class="ac-card-faction-badge" id="ac-card-faction-badge"></div>
          <div class="ac-card-name-block">
            <div class="ac-card-nation-name" id="ac-card-nation-name">Your Nation</div>
            <div class="ac-card-ruler-name" id="ac-card-ruler-name">Ruler: —</div>
          </div>
        </div>
        <div class="ac-card-motto" id="ac-card-motto"><em>No motto set</em></div>

        <div class="ac-card-gov-rel">
          <div class="ac-card-tag" id="ac-card-gov-tag">🏛️ Liberal Democracy</div>
          <div class="ac-card-tag" id="ac-card-rel-tag">🕊️ Monotheism</div>
        </div>

        <div class="ac-card-stats">
          <div class="ac-stat"><span class="ac-stat-label">Starting Land</span><span class="ac-stat-val">1,000 mi²</span></div>
          <div class="ac-stat"><span class="ac-stat-label">Infrastructure</span><span class="ac-stat-val">1,000</span></div>
          <div class="ac-stat"><span class="ac-stat-label">Starting Money</span><span class="ac-stat-val">$15,000,000</span></div>
          <div class="ac-stat"><span class="ac-stat-label">Tax Rate</span><span class="ac-stat-val" id="ac-stat-tax">2.5%</span></div>
          <div class="ac-stat"><span class="ac-stat-label">Happiness</span><span class="ac-stat-val">50</span></div>
          <div class="ac-stat"><span class="ac-stat-label">Stability</span><span class="ac-stat-val">100</span></div>
        </div>

        <div class="ac-card-bonuses" id="ac-card-bonuses">
          <div class="ac-bonus-title">Government Bonuses</div>
          <div class="ac-bonus-list" id="ac-bonus-list"></div>
        </div>

        <div class="ac-card-faction-info" id="ac-card-faction-info" style="display:none">
          <div class="ac-faction-img-wrap">
            <img id="ac-faction-img" src="" alt="" onerror="this.style.display='none'">
          </div>
          <div>
            <div class="ac-faction-name" id="ac-faction-name"></div>
            <div class="ac-faction-meta" id="ac-faction-meta"></div>
          </div>
        </div>

        <div class="ac-card-placeholder" id="ac-card-placeholder">
          <span>Fill in the form to see<br>your nation preview</span>
        </div>
      </div>
    </div><!-- /ac-preview-col -->

  </div><!-- /ac-container -->
</div>
`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COLOR GRID (built during createModal, before systems are ready)
    // ─────────────────────────────────────────────────────────────────────────

    _buildColorOptions() {
        // Fall back to window.GAME_COLORS if available; otherwise use static list
        const colors = window.GAME_COLORS ? Object.values(window.GAME_COLORS) : [
            { key:'aqua',   name:'Aqua Federation',    hex:'#00BFBF', image:'/assets/images/Colors/aqua.png'   },
            { key:'black',  name:'Black Empire',       hex:'#1a1a1a', image:'/assets/images/Colors/black.png'  },
            { key:'blue',   name:'Blue Republic',      hex:'#0066FF', image:'/assets/images/Colors/blue.png'   },
            { key:'green',  name:'Green Alliance',     hex:'#00AA00', image:'/assets/images/Colors/green.png'  },
            { key:'lime',   name:'Lime Dominion',      hex:'#7FCC00', image:'/assets/images/Colors/lime.png'   },
            { key:'orange', name:'Orange Coalition',   hex:'#FF8C00', image:'/assets/images/Colors/orange.png' },
            { key:'pink',   name:'Pink Realm',         hex:'#FF69B4', image:'/assets/images/Colors/pink.png'   },
            { key:'purple', name:'Purple Sovereignty', hex:'#8A2BE2', image:'/assets/images/Colors/purple.png' },
            { key:'red',    name:'Red Confederation',  hex:'#E00000', image:'/assets/images/Colors/red.png'    },
            { key:'yellow', name:'Yellow Union',       hex:'#FFD700', image:'/assets/images/Colors/yellow.png' }
        ];

        return colors.map(c => `
            <button type="button"
                    class="ac-color-btn"
                    data-key="${c.key}"
                    data-name="${c.name}"
                    data-hex="${c.hex}"
                    data-img="${c.image}"
                    title="${c.name}"
                    style="border-color: ${c.hex}">
              <img src="${c.image}" alt="${c.name}"
                   onerror="this.style.display='none';this.parentElement.style.backgroundColor='${c.hex}'">
            </button>`).join('');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POPULATE DROPDOWNS
    // ─────────────────────────────────────────────────────────────────────────

    _populateGovernments() {
        const grid = document.getElementById('ac-gov-grid');
        if (!grid || !window.GovernmentSystem) return;
        if (grid.children.length > 0) return; // already built

        const govs = window.GovernmentSystem.getAllGovernments();
        grid.innerHTML = govs.map(g => {
            const iconHtml = g.image
                ? `<img src="${g.image}" alt="${g.name}" class="ac-picker-img">`
                : `<span class="ac-picker-emoji">${g.icon || '🏛️'}</span>`;
            return `<button type="button"
                        class="ac-picker-btn"
                        role="radio"
                        aria-checked="false"
                        data-id="${g.id}"
                        data-type="government"
                        title="${g.name}"
                        tabindex="0">
                ${iconHtml}
                <span class="ac-picker-label">${g.name}</span>
            </button>`;
        }).join('');

        // Set default selection
        this._selectPickerItem('government', this.userData.selectedGovernment);
        this._updateGovPreview(this.userData.selectedGovernment);
        this._updateNationCard();
    }

    _populateReligions() {
        const grid = document.getElementById('ac-rel-grid');
        if (!grid || !window.ReligionSystem) return;
        if (grid.children.length > 0) return; // already built

        const rels = window.ReligionSystem.getAllReligions();
        grid.innerHTML = rels.map(r => {
            const iconHtml = r.image
                ? `<img src="${r.image}" alt="${r.name}" class="ac-picker-img">`
                : `<span class="ac-picker-emoji">${r.icon || '🕊️'}</span>`;
            return `<button type="button"
                        class="ac-picker-btn"
                        role="radio"
                        aria-checked="false"
                        data-id="${r.id}"
                        data-type="religion"
                        title="${r.name}"
                        tabindex="0">
                ${iconHtml}
                <span class="ac-picker-label">${r.name}</span>
            </button>`;
        }).join('');

        // Set default selection
        this._selectPickerItem('religion', this.userData.selectedReligion);
        this._updateRelPreview(this.userData.selectedReligion);
        this._updateNationCard();
    }

    _selectPickerItem(type, id) {
        const gridId = type === 'government' ? 'ac-gov-grid' : 'ac-rel-grid';
        const grid = document.getElementById(gridId);
        if (!grid) return;
        grid.querySelectorAll('.ac-picker-btn').forEach(btn => {
            const selected = btn.dataset.id === id;
            btn.classList.toggle('selected', selected);
            btn.setAttribute('aria-checked', selected ? 'true' : 'false');
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PREVIEW BOXES (within form)
    // ─────────────────────────────────────────────────────────────────────────

    _updateGovPreview(govId) {
        const box = document.getElementById('ac-gov-preview');
        if (!box || !window.GovernmentSystem) return;
        const gov = window.GovernmentSystem.getGovernment(govId);
        if (!gov) { box.innerHTML = ''; return; }

        const bonusItems = this._formatStatBonuses(gov.bonuses, gov.penalties);
        box.innerHTML = `
            <div class="ac-pv-header">
              <span class="ac-pv-icon">${gov.image ? `<img src="${gov.image}" alt="${gov.name}" style="width:32px;height:32px;object-fit:contain;">` : (gov.icon || '🏛️')}</span>
              <div>
                <strong>${gov.name}</strong>
                <div class="ac-pv-fullname">${gov.fullName}</div>
              </div>
            </div>
            <p class="ac-pv-desc">${gov.description}</p>
            <div class="ac-pv-stats">${bonusItems}</div>`;
    }

    _updateRelPreview(relId) {
        const box = document.getElementById('ac-rel-preview');
        if (!box || !window.ReligionSystem) return;
        const rel = window.ReligionSystem.getReligion(relId);
        if (!rel) { box.innerHTML = ''; return; }

        const bonusItems = this._formatStatBonuses(rel.bonuses, rel.penalties);
        box.innerHTML = `
            <div class="ac-pv-header">
              <span class="ac-pv-icon">${rel.image ? `<img src="${rel.image}" alt="${rel.name}" style="width:32px;height:32px;object-fit:contain;">` : (rel.icon || '🕊️')}</span>
              <div>
                <strong>${rel.name}</strong>
                <div class="ac-pv-fullname">${rel.fullName || ''}</div>
              </div>
            </div>
            <p class="ac-pv-desc">${rel.description}</p>
            <div class="ac-pv-stats">${bonusItems}</div>`;
    }

    _formatStatBonuses(bonuses, penalties) {
        // Helper: convert a camelCase key to a readable label, e.g. "militaryMorale" → "Military Morale"
        const toLabel = key => {
            const spaced = key.replace(/([A-Z])/g, ' $1').trim();
            return spaced.charAt(0).toUpperCase() + spaced.slice(1);
        };

        const items = [];
        // Bonuses are stored as plain deltas: 0.15 means +15%
        Object.entries(bonuses || {}).forEach(([key, val]) => {
            const pct = Math.round(val * 100);
            if (pct === 0) return;
            items.push(`<span class="ac-bonus-pos">+${pct}% ${toLabel(key)}</span>`);
        });
        // Penalties are stored as multipliers below 1: 0.90 means -10%
        Object.entries(penalties || {}).forEach(([key, val]) => {
            const pct = Math.round((val - 1) * 100); // will be negative
            if (pct === 0) return;
            items.push(`<span class="ac-bonus-neg">${pct}% ${toLabel(key)}</span>`);
        });
        return items.join('');
    }

    /**
     * Merge bonuses and penalties from government and religion into a single
     * flat map of statKey → net percentage (positive = bonus, negative = penalty).
     * Bonuses are delta-encoded (0.15 = +15%); penalties are multiplier-encoded (0.90 = -10%).
     */
    _mergeBonuses(gov, rel) {
        const totals = {}; // statKey → total percentage points

        const addBonus = (bonuses) => {
            Object.entries(bonuses || {}).forEach(([key, val]) => {
                const pct = Math.round(val * 100);
                totals[key] = (totals[key] || 0) + pct;
            });
        };
        const addPenalty = (penalties) => {
            Object.entries(penalties || {}).forEach(([key, val]) => {
                const pct = Math.round((val - 1) * 100); // negative
                totals[key] = (totals[key] || 0) + pct;
            });
        };

        if (gov) { addBonus(gov.bonuses); addPenalty(gov.penalties); }
        if (rel) { addBonus(rel.bonuses); addPenalty(rel.penalties); }

        return totals;
    }

    /** Render a merged totals map into bonus/penalty chip HTML. */
    _formatMergedBonuses(totals) {
        const toLabel = key => {
            const spaced = key.replace(/([A-Z])/g, ' $1').trim();
            return spaced.charAt(0).toUpperCase() + spaced.slice(1);
        };

        return Object.entries(totals)
            .filter(([, pct]) => pct !== 0)
            .sort((a, b) => b[1] - a[1]) // largest bonuses first, then penalties
            .map(([key, pct]) => {
                if (pct > 0) return `<span class="ac-bonus-pos">+${pct}% ${toLabel(key)}</span>`;
                return `<span class="ac-bonus-neg">${pct}% ${toLabel(key)}</span>`;
            })
            .join('');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NATION PREVIEW CARD (right column)
    // ─────────────────────────────────────────────────────────────────────────

    _updateNationCard() {
        const d = this.userData;

        const hasContent = d.nationName || d.rulerName || d.selectedColorKey;
        document.getElementById('ac-card-placeholder').style.display = hasContent ? 'none' : '';

        // Name + ruler
        document.getElementById('ac-card-nation-name').textContent =
            d.nationName || 'Your Nation';
        document.getElementById('ac-card-ruler-name').textContent =
            d.rulerName ? `Ruler: ${d.rulerName}` : 'Ruler: —';

        // Motto
        const mottoEl = document.getElementById('ac-card-motto');
        mottoEl.innerHTML = d.motto
            ? `"${this._escHtml(d.motto)}"`
            : '<em>No motto set</em>';

        // Government tag + tax rate
        const gov = (window.GovernmentSystem && d.selectedGovernment)
            ? window.GovernmentSystem.getGovernment(d.selectedGovernment) : null;
        const rel = (window.ReligionSystem && d.selectedReligion)
            ? window.ReligionSystem.getReligion(d.selectedReligion) : null;

        if (gov) {
            const govTagEl = document.getElementById('ac-card-gov-tag');
            if (govTagEl) {
                const govIconHtml = gov.image
                    ? `<img src="${gov.image}" alt="${gov.name}" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;margin-right:4px;">`
                    : `${gov.icon || '🏛️'} `;
                govTagEl.innerHTML = `${govIconHtml}${gov.name}`;
            }
            const taxEl = document.getElementById('ac-stat-tax');
            if (taxEl && gov.taxRate) taxEl.textContent = `${gov.taxRate}%`;
        }

        if (rel) {
            const relTagEl = document.getElementById('ac-card-rel-tag');
            if (relTagEl) {
                const relIconHtml = rel.image
                    ? `<img src="${rel.image}" alt="${rel.name}" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;margin-right:4px;">`
                    : `${rel.icon || '🕊️'} `;
                relTagEl.innerHTML = `${relIconHtml}${rel.name}`;
            }
        }

        // Combined bonus list from gov + religion
        const bonusList  = document.getElementById('ac-bonus-list');
        const bonusTitle = document.querySelector('.ac-bonus-title');
        if (bonusList) {
            const combined = this._mergeBonuses(gov, rel);
            bonusList.innerHTML = this._formatMergedBonuses(combined);
            if (bonusTitle) {
                bonusTitle.textContent = (gov && rel)
                    ? 'Combined Modifiers'
                    : gov ? `${gov.name} Modifiers` : rel ? `${rel.name} Modifiers` : 'Modifiers';
            }
        }

        // Faction color badge + faction info
        const badge = document.getElementById('ac-card-faction-badge');
        const header = document.getElementById('ac-card-header');
        const factionInfo = document.getElementById('ac-card-faction-info');
        if (d.selectedColorKey && d.factionColor) {
            badge.style.backgroundColor = d.factionColor;
            badge.style.display = '';
            header.style.borderColor = d.factionColor;
            header.style.boxShadow   = `0 0 20px ${d.factionColor}44`;

            // Faction info block
            const img = document.getElementById('ac-faction-img');
            const btn = document.querySelector(`.ac-color-btn[data-key="${d.selectedColorKey}"]`);
            if (btn) {
                const imgSrc  = btn.dataset.img;
                const name    = btn.dataset.name;
                if (img)  { img.src = imgSrc; img.alt = name; img.style.display = ''; }
                document.getElementById('ac-faction-name').textContent = name;
                document.getElementById('ac-faction-meta').textContent = 'World Congress Faction';
                factionInfo.style.display = '';
            }
        } else {
            badge.style.display = 'none';
            header.style.borderColor = '';
            header.style.boxShadow   = '';
            factionInfo.style.display = 'none';
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EVENT BINDING
    // ─────────────────────────────────────────────────────────────────────────

    _bindEvents() {
        document.addEventListener('DOMContentLoaded', () => this._bindAfterDom());
        if (document.readyState !== 'loading') this._bindAfterDom();
    }

    _bindAfterDom() {
        // Ruler name
        const rulerInput = document.getElementById('ac-ruler-name');
        rulerInput?.addEventListener('input', e => {
            this.userData.rulerName = e.target.value.trim();
            this._updateNationCard();
            this._scheduleNameCheck('rulerName', this.userData.rulerName);
            this._validateSubmitBtn();
        });

        // Nation name
        const nationInput = document.getElementById('ac-nation-name');
        nationInput?.addEventListener('input', e => {
            this.userData.nationName = e.target.value.trim();
            this._updateNationCard();
            this._scheduleNameCheck('nationName', this.userData.nationName);
            this._validateSubmitBtn();
        });

        // Motto
        document.getElementById('ac-motto')?.addEventListener('input', e => {
            this.userData.motto = e.target.value;
            this._updateNationCard();
        });

        // Government picker grid (event delegation)
        document.getElementById('ac-gov-grid')?.addEventListener('click', e => {
            const btn = e.target.closest('.ac-picker-btn');
            if (!btn) return;
            this.userData.selectedGovernment = btn.dataset.id;
            this._selectPickerItem('government', btn.dataset.id);
            this._updateGovPreview(btn.dataset.id);
            this._updateNationCard();
            this._validateSubmitBtn();
        });
        document.getElementById('ac-gov-grid')?.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                const btn = e.target.closest('.ac-picker-btn');
                if (btn) { e.preventDefault(); btn.click(); }
            }
        });

        // Religion picker grid (event delegation)
        document.getElementById('ac-rel-grid')?.addEventListener('click', e => {
            const btn = e.target.closest('.ac-picker-btn');
            if (!btn) return;
            this.userData.selectedReligion = btn.dataset.id;
            this._selectPickerItem('religion', btn.dataset.id);
            this._updateRelPreview(btn.dataset.id);
            this._updateNationCard();
            this._validateSubmitBtn();
        });
        document.getElementById('ac-rel-grid')?.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                const btn = e.target.closest('.ac-picker-btn');
                if (btn) { e.preventDefault(); btn.click(); }
            }
        });

        // Color buttons (event delegation on grid)
        document.getElementById('ac-color-grid')?.addEventListener('click', e => {
            const btn = e.target.closest('.ac-color-btn');
            if (!btn) return;
            this._selectColor(btn.dataset.key, btn.dataset.hex, btn.dataset.name, btn.dataset.img);
        });

        // Keyboard support for color grid
        document.getElementById('ac-color-grid')?.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                const btn = e.target.closest('.ac-color-btn');
                if (btn) {
                    e.preventDefault();
                    this._selectColor(btn.dataset.key, btn.dataset.hex, btn.dataset.name, btn.dataset.img);
                }
            }
        });

        // Submit
        document.getElementById('ac-submit-btn')?.addEventListener('click', () => {
            this._submit();
        });

        // Encyclopedia reference buttons
        document.getElementById('ac-gov-ref-btn')?.addEventListener('click', () => {
            if (window.ReferencePage) { ReferencePage.showModal(); ReferencePage.switchTab('governments'); }
        });
        document.getElementById('ac-rel-ref-btn')?.addEventListener('click', () => {
            if (window.ReferencePage) { ReferencePage.showModal(); ReferencePage.switchTab('religions'); }
        });

        // Overlay click — only allow closing once account is created
        document.querySelector('.ac-overlay')?.addEventListener('click', () => {
            if (this.isAccountCreated) this.hideModal();
        });
    }

    _selectColor(key, hex, name, img) {
        // Deselect previous
        document.querySelectorAll('.ac-color-btn').forEach(b => b.classList.remove('selected'));
        const btn = document.querySelector(`.ac-color-btn[data-key="${key}"]`);
        if (btn) btn.classList.add('selected');

        this.userData.selectedColorKey = key;
        this.userData.factionColor     = hex;

        // Update hint text
        const hint = document.getElementById('ac-color-hint');
        if (hint) hint.textContent = `✅ Selected: ${name}`;

        this._updateNationCard();
        this._validateSubmitBtn();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UNIQUENESS CHECKS (debounced, real-time server calls)
    // ─────────────────────────────────────────────────────────────────────────

    _scheduleNameCheck(field, value) {
        clearTimeout(this._nameTimers[field]);
        this._nameStatus[field] = null;
        this._setNameStatus(field, null, '');

        if (!value || (field === 'nationName' && value.length < 3) || (field === 'rulerName' && value.length < 2)) {
            this._validateSubmitBtn();
            return;
        }

        this._nameStatus[field] = 'checking';
        this._setNameStatus(field, 'checking', 'Checking availability…');

        this._nameTimers[field] = setTimeout(async () => {
            try {
                const endpoint = field === 'nationName'
                    ? `/api/check-nation-name?name=${encodeURIComponent(value)}`
                    : `/api/check-ruler-name?name=${encodeURIComponent(value)}`;

                const res  = await fetch(endpoint);
                const json = await res.json();

                // Only update if the input value hasn't changed since we fired the request
                const currentVal = field === 'nationName'
                    ? this.userData.nationName
                    : this.userData.rulerName;
                if (currentVal !== value) return; // stale response

                if (json.available) {
                    this._nameStatus[field] = 'ok';
                    this._setNameStatus(field, 'ok', '✅ Available');
                } else {
                    this._nameStatus[field] = 'taken';
                    this._setNameStatus(field, 'taken', `❌ ${json.message || 'Already taken'}`);
                }
            } catch {
                this._nameStatus[field] = 'error';
                this._setNameStatus(field, 'error', '⚠️ Could not verify');
            }
            this._validateSubmitBtn();
        }, 550); // 550ms debounce
    }

    _setNameStatus(field, status, msg) {
        const iconId = field === 'nationName' ? 'nation-status-icon' : 'ruler-status-icon';
        const hintId = field === 'nationName' ? 'nation-name-hint'   : 'ruler-name-hint';

        const icon = document.getElementById(iconId);
        const hint = document.getElementById(hintId);

        if (icon) {
            icon.textContent  = status === 'checking' ? '⏳' : status === 'ok' ? '✅' : status === 'taken' ? '❌' : status === 'error' ? '⚠️' : '';
        }
        if (hint) {
            if (msg) {
                hint.textContent = msg;
                hint.className   = `ac-field-hint ${status === 'ok' ? 'hint-ok' : status === 'taken' ? 'hint-err' : status === 'error' ? 'hint-warn' : ''}`;
            } else {
                // Restore default hint
                hint.className = 'ac-field-hint';
                hint.textContent = field === 'nationName'
                    ? '3–50 characters. Must be unique in-game.'
                    : '2–30 letters, spaces, hyphens, apostrophes. Must be unique in-game.';
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────────────────────

    _validateSubmitBtn() {
        const btn = document.getElementById('ac-submit-btn');
        if (!btn) return;
        btn.disabled = !this._isFormValid();
    }

    _isFormValid() {
        const d = this.userData;
        if (!d.rulerName  || d.rulerName.length  < 2)  return false;
        if (!d.nationName || d.nationName.length  < 3)  return false;
        if (!d.selectedGovernment)                       return false;
        if (!d.selectedReligion)                         return false;
        if (!d.selectedColorKey)                         return false;

        // Name checks must have resolved as 'ok' (or 'error' — we allow error
        // to fall through so offline players aren't permanently blocked; the
        // server still validates and will bounce duplicates)
        if (this._nameStatus.nationName === 'checking') return false;
        if (this._nameStatus.rulerName  === 'checking') return false;
        if (this._nameStatus.nationName === 'taken')    return false;
        if (this._nameStatus.rulerName  === 'taken')    return false;

        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUBMISSION
    // ─────────────────────────────────────────────────────────────────────────

    async _submit() {
        if (!this._isFormValid()) return;

        const btn = document.getElementById('ac-submit-btn');
        const errEl = document.getElementById('ac-form-errors');

        btn.disabled = true;
        btn.textContent = '⏳ Founding Nation…';
        if (errEl) errEl.textContent = '';

        const nationData = {
            name:       this.userData.nationName,
            leader:     this.userData.rulerName,
            government: this.userData.selectedGovernment,
            religion:   this.userData.selectedReligion,
            motto:      this.userData.motto || '',
            factionColor: this.userData.factionColor,
            factionKey:   this.userData.selectedColorKey
        };

        try {
            const serverNation = await this._createNationOnServer(nationData);

            // Build the full nation data — merge server response with local form data
            const fullNationData = {
                ...(serverNation || {}),
                ...nationData,
                // Ensure playerId is set so MapIntegration can identify the player's nation
                playerId: (this._authUser && this._authUser.id) || (window.Player && window.Player.playerId) || null
            };

            // Sync client-side Player faction data
            if (window.Player) {
                Player.factionColor    = this.userData.factionColor;
                Player.factionKey      = this.userData.selectedColorKey;
                Player.factionJoinDate = Date.now();
            }

            // Initialize (or re-initialize) the client-side Nation singleton
            // NationClass is the class; Nation is the global instance.
            // NationClass.create() replaces window.Nation with a fresh initialized instance.
            const NationCtor = window.NationClass || (typeof NationClass !== 'undefined' ? NationClass : null);
            if (NationCtor) {
                NationCtor.create(fullNationData);
            } else if (window.Nation) {
                // Fallback: initialize the existing singleton directly
                window.Nation.initialize(fullNationData);
            }

            // Claim the starting map tile for this nation so they appear on the map
            if (window.GridMap && window.Nation) {
                try {
                    GridMap.claimTerritory(0, 0, window.Nation.playerId || 'player', window.Nation.factionColor);
                } catch (_) { /* tile may already be taken — that's fine */ }
                GridMap.updateFactionData();
            }

            this.isAccountCreated = true;

            btn.textContent = '✅ Nation Founded!';
            btn.classList.add('ac-submit-success');

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('account_created', {
                    userData:   this.userData,
                    nationData: window.Nation ? window.Nation.serialize() : fullNationData
                });
            }

            setTimeout(() => this.hideModal(), 1800);

        } catch (err) {
            console.error('Nation creation failed:', err);
            if (errEl) errEl.textContent = `❌ ${err.message || 'Creation failed — please try again.'}`;
            btn.disabled   = false;
            btn.textContent = '⚔️ Found My Nation';
        }
    }

    _createNationOnServer(nationData) {
        return new Promise((resolve, reject) => {
            if (!window.socket || !window.socket.connected) {
                console.warn('Socket not connected — nation stored client-side only');
                resolve(null);
                return;
            }

            const timeout = setTimeout(() => {
                window.socket.off('nationCreated', onCreated);
                window.socket.off('error',         onError);
                console.warn('createNation timed out');
                resolve(null);
            }, 10000);

            const onCreated = (data) => {
                clearTimeout(timeout);
                window.socket.off('nationCreated', onCreated);
                window.socket.off('error',         onError);
                resolve(data.nation);
            };

            const onError = (data) => {
                clearTimeout(timeout);
                window.socket.off('nationCreated', onCreated);
                window.socket.off('error',         onError);
                reject(new Error(data.message || 'Server error creating nation'));
            };

            window.socket.once('nationCreated', onCreated);
            window.socket.once('error',         onError);
            window.socket.emit('createNation', nationData);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SHOW / HIDE
    // ─────────────────────────────────────────────────────────────────────────

    showModal() {
        const modal = document.getElementById('account-creation-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        this._updateNationCard();
        setTimeout(() => document.getElementById('ac-ruler-name')?.focus(), 100);
    }

    hideModal() {
        const modal = document.getElementById('account-creation-modal');
        if (modal) modal.classList.add('hidden');
    }

    needsAccountCreation() {
        return !window.Nation || !window.Nation.isInitialized ||
               !window.Player || !window.Player.username;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    _escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

// ── Global Singleton ──────────────────────────────────────────────────────────
window.AccountCreation = null;

document.addEventListener('DOMContentLoaded', () => {
    window.AccountCreation = new AccountCreationSystem();
});
