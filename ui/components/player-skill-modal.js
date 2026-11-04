"use strict";
/**
 * PlayerSkillModal — Clean skill allocation modal
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Renders all 12 player skills in a 6×2 grid. Each skill card shows:
 *   • Icon, name, description, category badge
 *   • 20 level slots (filled = normal level, legendary pip = legendary bonus, empty = unallocated)
 *   • Hover a slot → tooltip with cumulative SP cost to that level + total stat gain at that level
 *   • Upgrade button → spend normal skill points (one level at a time)
 *   • Legendary +1 button → spend permanent legendary bonus points
 *   • "Go legendary" banner when level === 100
 *
 * Exports: window.PlayerSkillModal.render(state) → HTML string
 *   state.player        — { level, legendaryLevel, unallocatedSkillPoints,
 *                            unallocatedLegendarySkillPoints, skills: {...} }
 *   state.skills        — { key: { value: string, cost: number|null } }
 *   window.SKILL_DEFS   — skill definitions (from entities/Player.js)
 *   window.SKILL_COST_TABLE — per-level cost table (from entities/Player.js)
 *
 * Wiring:
 *   game.js renders this via renderModal() when modalMode === "playerSkill".
 *   Click handlers for data-action="skill" / "legendarySkill" / "legendary"
 *   already exist in game.js command() and server/world.js handles them.
 */

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const human = (value) =>
  String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
const number = (value) =>
  Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

/* Cumulative SP cost to reach a given level (1-indexed). */
function cumulativeCostToLevel(level) {
  let total = 0;
  const table = window.SKILL_COST_TABLE || [];
  for (let i = 0; i < level && i < table.length; i++) total += table[i];
  return total;
}

/* Cost to upgrade from current level to next. */
function upgradeCost(skill) {
  const table = window.SKILL_COST_TABLE || [];
  const lvl = skill.level;
  return lvl < table.length ? table[lvl] : null;
}

/* Total SP remaining to max out a skill from its current level. */
function pointsToMax(skillKey, skill) {
  const def = window.SKILL_DEFS?.[skillKey];
  if (!def || !skill) return 0;
  const table = window.SKILL_COST_TABLE || [];
  let total = 0;
  for (let lvl = skill.level; lvl < def.maxLevels && lvl < table.length; lvl++) {
    total += table[lvl];
  }
  return total;
}

class PlayerSkillModalSystem {
    constructor() {
        this.state = null;
    }

    /* ═══════════════════════════════════════════════════════════════════
       RENDER
       ══════════════════════════════════════════════════════════════════ */

    render(state) {
        this.state = state;
        const p = state.player || window.Player || {};
        const skills = state.skills || {};
        const normalPts = p.unallocatedSkillPoints || 0;
        const legendaryPts = p.unallocatedLegendarySkillPoints || 0;
        const canGoLegendary = p.canGoLegendary || p.level >= 100;

        // Build skill cards
        const defs = window.SKILL_DEFS || {};
        const skillKeys = Object.keys(defs);

        const cardsHtml = skillKeys
          .map((key) => {
            const def = defs[key];
            const skill = p.skills?.[key] || { level: 0, pointsSpent: 0, legendaryBonusPts: 0 };
            const totalLevels = skill.level + skill.legendaryBonusPts;
            const maxed = skill.level >= def.maxLevels;
            const cost = skills[key]?.cost !== undefined ? skills[key].cost : upgradeCost(skill);
            const affordable = !maxed && normalPts >= (cost || 0);
            const hasLegendaryPts = legendaryPts > 0 && !maxed;
            const skillInfo = skills[key] || {};
            const currentValue = skillInfo.value !== undefined
              ? skillInfo.value
              : (p.getSkillDisplayValue ? p.getSkillDisplayValue(key) : this._displayValue(def, totalLevels));

            // Build 20 level slots
            const slotsHtml = Array.from({ length: def.maxLevels }, (_, i) => {
              const lvl = i + 1;
              const filled = i < skill.level;
              const legendary = i >= skill.level && i < totalLevels;
              const cumCost = cumulativeCostToLevel(lvl);
              const boost = this._boostAtLevel(def, lvl);
              const isCurrent = i === skill.level; // next level to buy
              let cls = "skill-slot";
              if (filled) cls += " filled";
              if (legendary) cls += " legendary";
              if (isCurrent && !maxed && affordable) cls += " affordable";
              if (maxed) cls += " maxed";
              const title = `Level ${lvl} · ${cumCost} SP total · ${boost} at this level`;
              return `<span class="${cls}" title="${esc(title)}" aria-label="${esc(title)}"></span>`;
            }).join("");

            const ptsToMaxVal = pointsToMax(key, skill);

            return `
              <article class="skill-card" data-skill="${esc(key)}">
                <div class="skill-header">
                  <div class="skill-icon-wrap">
                    <img class="skill-icon-img" src="${esc(def.icon || "")}" alt="${esc(def.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
                    <span class="skill-icon-fallback" style="display:${def.icon ? 'none' : 'block'}">${this._skillFallbackIcon(key)}</span>
                  </div>
                  <div class="skill-info">
                    <h4>${esc(def.name)}</h4>
                    <p class="skill-desc">${esc(def.description || "")}</p>
                    <span class="skill-category">${human(def.category || "combat")}</span>
                  </div>
                  <div class="skill-level-badge">
                    Lv <strong>${totalLevels}</strong><span class="slash">/${def.maxLevels}</span>
                    ${skill.legendaryBonusPts > 0
                      ? `<span class="legendary-pip">★${skill.legendaryBonusPts}</span>`
                      : ""}
                  </div>
                </div>
                <div class="skill-slots">${slotsHtml}</div>
                <div class="skill-footer">
                  <div class="skill-stat-line">
                    <span class="stat-label">Current boost:</span>
                    <span class="stat-value">${esc(currentValue)}</span>
                  </div>
                  <div class="skill-actions">
                    ${!maxed && affordable
                      ? `<button type="button" class="btn-upgrade" data-action="skill" data-payload="${esc(JSON.stringify({ key }))}" title="Upgrade ${def.name} (+${def.perLevel}${def.unit}) · ${cost} SP">Upgrade · ${number(cost)} SP</button>`
                      : maxed
                        ? `<span class="badge maxed-badge">Max level</span>`
                        : `<button type="button" class="btn-upgrade disabled" disabled title="Not enough skill points">Upgrade · ${number(cost || 0)} SP</button>`}
                    ${!maxed && hasLegendaryPts
                      ? `<button type="button" class="btn-legendary" data-action="legendarySkill" data-payload="${esc(JSON.stringify({ key }))}" title="Allocate permanent legendary bonus point to ${def.name}">Legendary +1</button>`
                      : ""}
                  </div>
                  <div class="skill-meta">
                    ${ptsToMaxVal > 0
                      ? `<span class="meta-to-max">${number(ptsToMaxVal)} SP to max</span>`
                      : ""}
                  </div>
                </div>
              </article>
            `;
          })
          .join("");

        const goLegendaryHtml = canGoLegendary
          ? `<div class="go-legendary-banner">
                <button type="button" class="btn-go-legendary" data-action="legendary" data-payload="${esc(JSON.stringify({}))}">
                 ⭐ Go Legendary — reset normal skills, gain permanent progression (Cycle ${(p.legendaryLevel || 1) + 1})
               </button>
             </div>`
          : "";

        return `
          <form method="dialog" id="player-skill-modal-form">
            <div class="modal-eyebrow">Leader progression</div>
            <h2 id="nation-dialog-title">Player skills</h2>

            <div class="skill-modal-stats">
              <div class="skill-stat">
                <small>Skill points</small>
                <strong class="stat-value normal-pts">${number(normalPts)}</strong><span class="stat-unit">SP</span>
              </div>
              <div class="skill-stat">
                <small>Legendary points</small>
                <strong class="stat-value leg-pts">${number(legendaryPts)}</strong><span class="stat-unit">LP</span>
              </div>
              <div class="skill-stat">
                <small>Level</small>
                <strong>${number(p.level || 1)}</strong>
              </div>
              <div class="skill-stat">
                <small>Legendary cycle</small>
                <strong>${number(p.legendaryLevel || 1)}</strong>
              </div>
            </div>

            <div class="skill-grid">
              ${cardsHtml}
            </div>

            ${goLegendaryHtml}

            <div class="skill-help">
              <p>Spend <strong>skill points</strong> (earned per level) to upgrade skills. Spend <strong>legendary points</strong> (permanent, earned per legendary cycle) for bonus levels that survive resets. Hover a level slot to see cumulative cost and total stat gain at that level.</p>
            </div>

            <div class="row dialog-actions">
              <button type="button" value="close" autofocus class="btn-close">Close</button>
            </div>
          </form>
        `;
    }

    /* ════════════════════════════════════════════════════════════════════
       HELPERS
       ══════════════════════════════════════════════════════════════════ */

    _boostAtLevel(def, level) {
      const raw = level * def.perLevel;
      return def.unit === "%" ? `+${raw}%` : `+${raw}`;
    }

    _displayValue(def, totalLevels) {
      const raw = totalLevels * def.perLevel;
      return def.unit === "%" ? `${raw}%` : `${raw}`;
    }

    _skillFallbackIcon(key) {
      const fallbacks = {
        attack: "⚔️", defense: "🛡️", aim: "🎯", luck: "🍀",
        criticalDamage: "💥", criticalChance: "🎲", block: "🪖", parry: "🗡️",
        energy: "⚡", intuition: "🧠", taxation: "💰", diplomacy: "🤝",
      };
      return fallbacks[key] || "•";
    }
}

window.PlayerSkillModal = new PlayerSkillModalSystem();
