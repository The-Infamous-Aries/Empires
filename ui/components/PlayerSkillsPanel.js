/**
 * Player Skills Panel — displays level, XP, skill allocation, and legendary system
 * Dominion Wars - Nation Building Strategy Game
 */

class PlayerSkillsPanel {
    constructor() {
        this.isVisible = false;
        this._bound = false;
    }

    /**
     * Initialize and bind the event listener
     */
    initialize() {
        if (this._bound) return;
        EventBus.on('show_player_menu', () => this.show());
        this._bound = true;
        console.log('PlayerSkillsPanel initialized');
    }

    /**
     * Show the panel as a modal overlay
     */
    show() {
        // Remove any stale instance
        const old = document.getElementById('player-skills-modal');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'player-skills-modal';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = this._renderHTML();
        document.body.appendChild(overlay);

        this.isVisible = true;
        this._bindModalEvents(overlay);
    }

    /**
     * Close the panel
     */
    close() {
        const el = document.getElementById('player-skills-modal');
        if (el) el.remove();
        this.isVisible = false;
    }

    // ─── Rendering ────────────────────────────────────────────────────────────

    _renderHTML() {
        if (!window.Player) {
            return `
                <div class="modal-content player-skills-modal">
                    <div class="modal-header">
                        <h3>⚔️ Player Progression</h3>
                        <button class="close-modal" id="ps-close-btn">✕</button>
                    </div>
                    <div class="modal-body">
                        <p>Player data not loaded yet. Please log in first.</p>
                    </div>
                </div>`;
        }

        const p = window.Player;
        const xpPct = p.experienceToNext > 0 ? Math.min(100, (p.experience / p.experienceToNext) * 100) : 0;
        const legendaryBadge = p.legendaryLevel > 1
            ? `<span class="legendary-badge" title="Legendary Level ${p.legendaryLevel}">⭐ L${p.legendaryLevel}</span>`
            : '';

        return `
            <div class="modal-content player-skills-modal">
                <div class="modal-header">
                    <h3>⚔️ Player Progression</h3>
                    <button class="close-modal" id="ps-close-btn">✕</button>
                </div>
                <div class="modal-body">

                    <!-- Level / XP Section -->
                    <div class="ps-level-section">
                        <div class="ps-level-row">
                            <span class="ps-level-badge">Level ${p.level}</span>
                            ${legendaryBadge}
                            ${p.canGoLegendary
                                ? `<button class="ps-legendary-btn" id="ps-go-legendary">⭐ Go Legendary!</button>`
                                : ''}
                        </div>
                        <div class="ps-xp-bar-container">
                            <div class="ps-xp-bar-fill" style="width:${xpPct.toFixed(1)}%"></div>
                        </div>
                        <div class="ps-xp-label">${this._fmt(p.experience)} / ${this._fmt(p.experienceToNext)} XP</div>
                        <div class="ps-points-row">
                            <span class="ps-points-badge">${p.unallocatedSkillPoints} skill points available</span>
                            ${p.unallocatedLegendarySkillPoints > 0
                                ? `<span class="ps-legendary-points-badge">⭐ ${p.unallocatedLegendarySkillPoints} legendary points</span>`
                                : ''}
                        </div>
                    </div>

                    <!-- Skills Grid -->
                    <div class="ps-skills-section">
                        <h4>Skills</h4>
                        <div class="ps-skills-grid">
                            ${this._renderAllSkills(p)}
                        </div>
                    </div>

                    <!-- Statistics Section -->
                    <div class="ps-stats-section">
                        <h4>Statistics</h4>
                        <div class="ps-stats-grid">
                            ${Object.entries(p.statistics || {}).map(([k, v]) => `
                                <div class="ps-stat-item">
                                    <span class="ps-stat-key">${k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    <span class="ps-stat-val">${typeof v === 'number' ? this._fmt(v) : v}</span>
                                </div>`).join('')}
                        </div>
                    </div>

                </div>
            </div>`;
    }

    _renderAllSkills(p) {
        const defs = window.SKILL_DEFS || {};
        return Object.entries(defs).map(([key, def]) => {
            const skill = p.skills[key] || { level: 0, pointsSpent: 0, legendaryBonusPts: 0 };
            const cost  = p.skillUpgradeCost(key);
            const canUpgrade = cost !== null && p.unallocatedSkillPoints >= cost;
            const canLegendary = p.unallocatedLegendarySkillPoints > 0 && skill.legendaryBonusPts < 20;

            const displayVal = p.getSkillDisplayValue(key);
            const maxVal = def.unit === '%' ? `${def.maxLevels * def.perLevel}%` : `${def.maxLevels * def.perLevel}`;
            const fillPct = def.maxLevels > 0 ? Math.min(100, (skill.level / def.maxLevels) * 100) : 0;

            return `
                <div class="ps-skill-card" data-skill="${key}">
                    <div class="ps-skill-header">
                        <span class="ps-skill-icon">${def.icon}</span>
                        <span class="ps-skill-name">${def.name}</span>
                        <span class="ps-skill-level">Lv ${skill.level}/${def.maxLevels}</span>
                        ${skill.legendaryBonusPts > 0 ? `<span class="ps-legend-pts" title="Legendary bonus points">+${skill.legendaryBonusPts}⭐</span>` : ''}
                    </div>
                    <div class="ps-skill-bar-track">
                        <div class="ps-skill-bar-fill" style="width:${fillPct}%"></div>
                    </div>
                    <div class="ps-skill-value">${displayVal} / ${maxVal}</div>
                    <div class="ps-skill-desc">${def.description}</div>
                    <div class="ps-skill-actions">
                        <button class="ps-upgrade-btn ${canUpgrade ? '' : 'disabled'}"
                                data-action="upgrade" data-skill="${key}"
                                ${canUpgrade ? '' : 'disabled'}
                                title="${cost ? `Cost: ${cost} SP` : 'Already maxed'}">
                            ${cost !== null ? `Upgrade (${cost} SP)` : 'Maxed'}
                        </button>
                        ${canLegendary ? `
                        <button class="ps-legendary-skill-btn"
                                data-action="legendary" data-skill="${key}"
                                title="Spend 1 legendary point">
                            ⭐ +1 Legendary
                        </button>` : ''}
                    </div>
                </div>`;
        }).join('');
    }

    // ─── Event Binding ────────────────────────────────────────────────────────

    _bindModalEvents(overlay) {
        // Close button
        const closeBtn = overlay.querySelector('#ps-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());

        // Close on backdrop click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });

        // Upgrade / Legendary skill buttons
        overlay.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn || btn.disabled) return;

            const action = btn.dataset.action;
            const skill  = btn.dataset.skill;

            if (action === 'upgrade') {
                const success = window.Player.allocateSkillPoint(skill);
                if (success) {
                    this._refresh(overlay);
                    EventBus.emit('show_notification', {
                        message: `${window.SKILL_DEFS[skill]?.name || skill} upgraded!`,
                        type: 'success',
                        duration: 2000
                    });
                }
            } else if (action === 'legendary') {
                const success = window.Player.allocateLegendaryPoint(skill);
                if (success) {
                    this._refresh(overlay);
                    EventBus.emit('show_notification', {
                        message: `⭐ Legendary point added to ${window.SKILL_DEFS[skill]?.name || skill}!`,
                        type: 'success',
                        duration: 3000
                    });
                }
            }
        });

        // Go Legendary button
        const goLegendaryBtn = overlay.querySelector('#ps-go-legendary');
        if (goLegendaryBtn) {
            goLegendaryBtn.addEventListener('click', () => {
                if (confirm('Go Legendary? Your level and normal skill levels will reset, but you keep legendary points. You\'ll earn 1 permanent legendary skill point.')) {
                    const success = window.Player.goLegendary();
                    if (success) {
                        this._refresh(overlay);
                        EventBus.emit('show_notification', {
                            message: '⭐ You went Legendary! +1 permanent skill point awarded.',
                            type: 'success',
                            duration: 5000
                        });
                    }
                }
            });
        }
    }

    /**
     * Re-render the modal content in-place without closing/reopening
     */
    _refresh(overlay) {
        const content = overlay.querySelector('.modal-content');
        if (content) {
            const tmp = document.createElement('div');
            tmp.innerHTML = this._renderHTML();
            const newContent = tmp.querySelector('.modal-content');
            if (newContent) {
                overlay.replaceChild(newContent, content);
            }
        }
        this._bindModalEvents(overlay);
    }

    // ─── Utilities ────────────────────────────────────────────────────────────

    _fmt(n) {
        if (typeof n !== 'number') return '0';
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
        if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
        return Math.floor(n).toString();
    }
}

// ── Singleton & global export ────────────────────────────────────────────────
window.PlayerSkillsPanel = new PlayerSkillsPanel();

// Auto-initialize once the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.PlayerSkillsPanel.initialize());
} else {
    window.PlayerSkillsPanel.initialize();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlayerSkillsPanel };
}
