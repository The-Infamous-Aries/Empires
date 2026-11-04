"use strict";
/**
 * Map Modals - Pop-up modals for map interactions
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * Three modals for map nation/alliance interaction:
 *   • Declare War — custom reason + war type selection
 *   • Propose Treaty — treaty type, compensation, duration
 *   • Launch Attack — missile / nuke / spy operation selection
 *
 * Exports:
 *   window.MapModals — { declareWarModalContent, proposeTreatyModalContent,
 *                        launchAttackModalContent, nationToggleContent,
 *                        allianceToggleContent }
 *
 * Wiring:
 *   game.js renders these via renderModal() when modalMode matches.
 *   Click handlers for data-action="declareWar", "proposeTreaty",
 *   "launchAttack", "openNationToggle", "openAllianceToggle" route here.
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
const money = (value) => "$" + Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const number = (value) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const WAR_TYPES = [
  { key: "conventional", label: "Conventional War" },
  { key: "economic", label: "Economic War" },
  { key: "total", label: "Total War" },
];

const CASUS_BELLI = [
  { key: "territorial", label: "Territorial Dispute" },
  { key: "ideological", label: "Ideological Conflict" },
  { key: "retaliation", label: "Retaliation" },
  { key: "preemptive", label: "Preemptive Strike" },
  { key: "expansion", label: "Territorial Expansion" },
];

const TREATY_TYPES = [
  { key: "protectorate", label: "Protectorate Agreement", desc: "Protector guarantees protection in all wars" },
  { key: "extension", label: "Extension Pact", desc: "Act as one entity in all affairs" },
  { key: "mutualDefense", label: "Mutual Defense Pact", desc: "Both parties engage in ALL defensive wars" },
  { key: "mutualAggression", label: "Mutual Aggression Pact", desc: "Both parties engage in ALL offensive wars" },
  { key: "optionalDefense", label: "Optional Defense Pact", desc: "May choose to engage in defensive wars" },
  { key: "nonAggression", label: "Non-Aggression Pact", desc: "Agree not to attack each other" },
  { key: "trade", label: "Trade Agreement", desc: "Reduced tariffs and increased trade volume" },
  { key: "intelligence", label: "Intelligence Sharing", desc: "Share intelligence reports and data" },
  { key: "research", label: "Research Partnership", desc: "Shared technology and research bonuses" },
  { key: "peace", label: "Peace Treaty", desc: "End an active war with terms" },
];

class MapModalsSystem {
    constructor() {
        this.selectedNation = null;
        this.selectedAlliance = null;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       NATION TOGGLE CONTENT (map nation click)
       ══════════════════════════════════════════════════════════════════════ */

    nationToggleContent(state, targetNation) {
        const n = state.nation;
        const catalog = state.catalog;
        const t = targetNation;

        const isAtWar = (state.wars || []).some(
          (w) => w.status !== "ended" && w.participants.includes(n.id) && w.participants.includes(t.id),
        );
        const canDeclare = !isAtWar && t.id !== n.id && !n.motionModifiers?.peace && !t.motionModifiers?.peace;
        const hasDiplomacy = n.improvements?.internalAffairsOffice || false;

        const relationship = n.relationships?.[t.id] || "neutral";
        const relLabels = { friend: "Friend", bestFriend: "Best Friend", foe: "Foe", nemesis: "Nemesis", neutral: "Neutral" };
        const relIcons = { friend: "🤝", bestFriend: "❤️", foe: "👊", nemesis: "💀", neutral: "○" };

        const units = state.units || {};
        const unitTypes = ["soldiers", "tanks", "aircraft", "ships", "missiles", "nukes"];
        const unitLabels = { soldiers: "Soldiers", tanks: "Tanks", aircraft: "Aircraft", ships: "Ships", missiles: "Missiles", nukes: "Nukes" };

        const unitRows = unitTypes
          .filter((type) => type !== "spies")
          .map((type) => {
            const q = units[type] || {};
            const owned = t.militaryUnits?.[type]?.owned || q?.owned || 0;
            return `<tr><td>${esc(unitLabels[type])}</td><td>${number(owned)}</td></tr>`;
          })
          .join("");

        const flagSrc = t.flag?.type === "designed" ? t.flag.data : `assets/images/Colors/${t.factionKey}.png`;
        const flagFallback = catalog?.colors?.[t.factionKey]?.name?.[0] || "?";

        return `<form method="dialog" id="nation-toggle-modal-form">
          <div class="modal-eyebrow">Nation Profile</div>
          <h2 id="nation-dialog-title">${esc(t.name)}</h2>

          <div class="nation-toggle-header">
            <div class="nation-toggle-flag">
              <img src="${esc(flagSrc)}" class="nation-toggle-flag-img" alt="Flag" onerror="this.style.display='none';this.previousElementSibling.style.display='flex';">
              <div class="nation-toggle-flag-fallback" style="background:${esc(catalog?.colors?.[t.factionKey]?.hex || '#94a3b8')}">${esc(flagFallback)}</div>
            </div>
            <div class="nation-toggle-info">
              <div class="nation-toggle-name">${esc(t.name)}</div>
              <div class="nation-toggle-ruler">Ruler: ${esc(t.leader)}</div>
              <div class="nation-toggle-govrel">
                <span>${esc(catalog?.governments?.[t.government]?.name || t.government)}</span> •
                <span>${esc(catalog?.religions?.[t.religion]?.name || t.religion)}</span>
              </div>
              <div class="nation-toggle-culture">
                🍽️ ${human(t.nationalFood || "none")} • 💧 ${human(t.nationalWater || "none")} • 🐾 ${esc(t.nationalPet || "none")}
              </div>
            </div>
            <div class="nation-toggle-actions">
              ${button("Message", "openMessage", { target: t.id }, true)}
              ${button("Declare War", "declareWar", { target: t.id }, canDeclare, "danger")}
              ${button("Treaty", "proposeTreaty", { target: t.id }, hasDiplomacy && !isAtWar)}
              ${button("Launch Attack", "launchAttack", { target: t.id }, !isAtWar && t.id !== n.id, "danger")}
            </div>
          </div>

          <div class="nation-toggle-details">
            <div class="nation-toggle-section">
              <h3>Population</h3>
              <div class="toggle-stat"><span>Total Population</span><span>${number(t.population || 0)}</span></div>
            </div>
            <div class="nation-toggle-section">
              <h3>Military Units</h3>
              <table class="toggle-unit-table">${unitRows}</table>
            </div>
            <div class="nation-toggle-section">
              <h3>Relationship</h3>
              <div class="toggle-rel">
                <span class="rel-icon">${relIcons[relationship] || relIcons.neutral}</span>
                <span class="rel-label">${esc(relLabels[relationship] || "Neutral")}</span>
                ${button("Friend", "setRelationship", { target: t.id, type: "friend" }, relationship !== "friend")}
                ${button("Foe", "setRelationship", { target: t.id, type: "foe" }, relationship !== "foe")}
              </div>
            </div>
          </div>

          <div class="row dialog-actions">
            <button value="close">Close</button>
          </div>
        </form>`;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       ALLIANCE TOGGLE CONTENT (map alliance click)
       ══════════════════════════════════════════════════════════════════════ */

    allianceToggleContent(state, targetAlliance) {
        const n = state.nation;
        const catalog = state.catalog;
        const a = targetAlliance;
        const isGov = n.allianceId === a.id && (a.founder === n.id || this._isAllianceGov(n, a, state));

        const units = state.units || {};
        const unitTypes = ["soldiers", "tanks", "aircraft", "ships", "missiles", "nukes"];
        const unitLabels = { soldiers: "Soldiers", tanks: "Tanks", aircraft: "Aircraft", ships: "Ships", missiles: "Missiles", nukes: "Nukes" };

        const unitRows = unitTypes.map((type) => {
          let total = 0;
          for (const memberId of Object.keys(a.members || {})) {
            const m = state.nations?.find((x) => x.id === memberId);
            if (m && m.militaryUnits?.[type]?.owned) total += m.militaryUnits[type].owned;
          }
          return `<tr><td>${esc(unitLabels[type])}</td><td>${number(total)}</td></tr>`;
        }).join("");

        const memberRows = Object.entries(a.members || {})
          .map(([memberId, role]) => {
            const member = state.nations?.find((x) => x.id === memberId);
            if (!member) return "";
            const roleName = a.government?.roles?.get?.(role)?.name || role || "Member";
            return `<tr><td>${esc(member.name)}</td><td>${esc(roleName)}</td><td>${number(member.population || 0)}</td></tr>`;
          })
          .join("");

        const treatyRows = (state.treaties || [])
          .filter((t) => (t.from === a.id || t.to === a.id) && t.status === "active")
          .map((t) => {
            const otherId = t.from === a.id ? t.to : t.from;
            const other = state.nations?.find((x) => x.id === otherId);
            return `<tr><td>${esc(catalog?.treatyTypes?.[t.type]?.name || human(t.type))}</td><td>${esc(other ? other.name : "Unknown")}</td></tr>`;
          })
          .join("");

        return `<form method="dialog" id="alliance-toggle-modal-form">
          <div class="modal-eyebrow">Alliance Profile</div>
          <h2 id="nation-dialog-title">${esc(a.name)}</h2>

          <div class="alliance-toggle-info">
            <div class="alliance-toggle-name">${esc(a.name)}</div>
            <div class="alliance-toggle-desc">${esc(a.description || "No description")}</div>
            <div class="alliance-toggle-gov">${esc(catalog?.allianceTemplates?.[a.government]?.name || a.government)}</div>
            <div class="alliance-toggle-members">${Object.keys(a.members || {}).length} / 6 members</div>
            <div class="alliance-toggle-treasury">${money(a.treasury || 0)} treasury</div>
          </div>

          <div class="nation-toggle-details">
            <div class="nation-toggle-section">
              <h3>Members</h3>
              <table class="toggle-unit-table">${memberRows || '<tr><td colspan="3" class="empty">No members</td></tr>'}</table>
            </div>
            <div class="nation-toggle-section">
              <h3>Treaties</h3>
              <table class="toggle-unit-table">${treatyRows || '<tr><td colspan="2" class="empty">No active treaties</td></tr>'}</table>
            </div>
            <div class="nation-toggle-section">
              <h3>Alliance Units</h3>
              <table class="toggle-unit-table">${unitRows}</table>
            </div>
          </div>

          <div class="nation-toggle-actions">
            ${button("Message Alliance", "openAllianceMessage", { target: a.id }, true)}
            ${button("Declare War on Alliance", "declareWarAlliance", { target: a.id }, isGov && n.allianceId !== a.id, "danger")}
            ${button("Propose Treaty", "proposeTreatyAlliance", { target: a.id }, isGov)}
          </div>

          <div class="row dialog-actions">
            <button value="close">Close</button>
          </div>
        </form>`;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       DECLARE WAR MODAL
       ══════════════════════════════════════════════════════════════════════ */

    declareWarModalContent(state, targetNationId) {
        const n = state.nation;
        const catalog = state.catalog;
        const target = state.nations?.find((x) => x.id === targetNationId);

        const casusOptions = CASUS_BELLI.map((c) => `<option value="${esc(c.key)}">${esc(c.label)}</option>`).join("");
        const warTypeOptions = WAR_TYPES.map((w) => `<option value="${esc(w.key)}">${esc(w.label)}</option>`).join("");

        return `<form id="declare-war-modal-form">
          <div class="modal-eyebrow">Declare War</div>
          <h2 id="nation-dialog-title">Declare War on ${esc(target?.name || "Unknown")}</h2>

          <div class="modal-form-group">
            <label>Casus Belli <span class="map-req">*</span></label>
            <select name="casusBelli" required>${casusOptions}</select>
          </div>

          <div class="modal-form-group">
            <label>War Type <span class="map-req">*</span></label>
            <select name="warType" required>${warTypeOptions}</select>
          </div>

          <div class="modal-form-group">
            <label>Reason <span class="map-req">*</span></label>
            <input name="reason" type="text" required maxlength="300"
                   placeholder="Reason for declaring war">
          </div>

          <div class="map-reasons">
            <p class="muted">Declaring war will create a 15-minute preparation window before combat begins.</p>
            ${target ? `<p class="muted">Target: ${esc(target.name)} (Level ${target.level || 1})</p>` : ""}
          </div>

          <div class="row dialog-actions">
            <button value="cancel">Cancel</button>
            <button class="primary danger" data-action="declareWar">Declare War</button>
          </div>
        </form>`;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       PROPOSE TREATY MODAL
       ══════════════════════════════════════════════════════════════════════ */

    proposeTreatyModalContent(state, targetNationId) {
        const n = state.nation;
        const catalog = state.catalog;
        const target = state.nations?.find((x) => x.id === targetNationId);

        const treatyOptions = TREATY_TYPES.map((t) => `<option value="${esc(t.key)}">${esc(t.label)} — ${esc(t.desc)}</option>`).join("");

        return `<form id="propose-treaty-modal-form" data-command="treatyPropose">
          <div class="modal-eyebrow">Propose Treaty</div>
          <h2 id="nation-dialog-title">Propose Treaty to ${esc(target?.name || "Unknown")}</h2>

          <input type="hidden" name="target" value="${esc(targetNationId)}">

          <div class="modal-form-group">
            <label>Treaty Type <span class="map-req">*</span></label>
            <select name="type" required>${treatyOptions}</select>
          </div>

          <div class="modal-form-group">
            <label>Compensation ($)</label>
            <input name="compensation" type="number" value="0" min="0" max="1000000000"
                   placeholder="0">
          </div>

          <div class="modal-form-group treaty-duration-group">
            <label>Duration (real days, 0 = permanent)</label>
            <input name="duration" type="number" value="7" min="0" max="30"
                   placeholder="7">
          </div>

          <div class="map-reasons">
            <p class="muted">Both nations must accept the treaty for it to take effect.</p>
            ${target ? `<p class="muted">Target: ${esc(target.name)}</p>` : ""}
          </div>

          <div class="row dialog-actions">
            <button value="cancel">Cancel</button>
            <button class="primary" data-action="treatyPropose">Propose Treaty</button>
          </div>
        </form>`;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       LAUNCH ATTACK MODAL
       ══════════════════════════════════════════════════════════════════════ */

    launchAttackModalContent(state, targetNationId) {
        const n = state.nation;
        const catalog = state.catalog;
        const target = state.nations?.find((x) => x.id === targetNationId);

        const units = state.units || {};
        const hasMissiles = (units.missiles?.owned || 0) > 0 && n.currentIntuition >= 25;
        const hasNukes = (units.nukes?.owned || 0) > 0 && n.currentIntuition >= 50 && !n.motionModifiers?.nuclearBan;
        const hasSpies = (units.spies?.owned || 0) > 0 && n.currentIntuition >= 10;

        const isAtWar = (state.wars || []).some(
          (w) => w.status !== "ended" && w.participants.includes(n.id) && w.participants.includes(targetNationId),
        );

        const existingWar = isAtWar
          ? (state.wars || []).find((w) => w.status !== "ended" && w.participants.includes(n.id) && w.participants.includes(targetNationId))
          : null;

        const missileOpt = `<option value="missiles" ${!hasMissiles ? "disabled" : ""}>Missile Strike (${number(units.missiles?.owned || 0)} available, Intuition 25+)</option>`;
        const nukeOpt = `<option value="nukes" ${!hasNukes ? "disabled" : ""}>Nuclear Strike (${number(units.nukes?.owned || 0)} available, Intuition 50+)</option>`;
        const spyOpt = `<option value="spies" ${!hasSpies ? "disabled" : ""}>Spy Operation (${number(units.spies?.owned || 0)} available, Intuition 10+)</option>`;

        return `<form id="launch-attack-modal-form">
          <div class="modal-eyebrow">Launch Attack</div>
          <h2 id="nation-dialog-title">Attack ${esc(target?.name || "Unknown")}</h2>

          <div class="modal-form-group">
            <label>Attack Type <span class="map-req">*</span></label>
            <select name="attackType" required>
              ${missileOpt}
              ${nukeOpt}
              ${spyOpt}
            </select>
          </div>

          ${existingWar ? `
          <div class="modal-form-group">
            <label>Active War</label>
            <input type="text" value="${esc(existingWar.reason)}" disabled readonly>
            <p class="muted">Attack will be launched in the existing war.</p>
          </div>
          ` : `
          <div class="modal-form-group">
            <label>War Reason</label>
            <input name="reason" type="text" value="Territorial dispute" maxlength="300">
            <p class="muted">Not currently at war. Declaring war will start a 15-minute preparation window.</p>
          </div>
          `}

          <div class="map-alerts">
            ${!hasMissiles ? '<div class="map-alert blocked">⚠ Missile strike blocked: insufficient missiles or intuition.</div>' : ''}
            ${!hasNukes ? '<div class="map-alert blocked">⚠ Nuclear strike blocked: insufficient nukes, intuition, or nuclear ban active.</div>' : ''}
            ${!hasSpies ? '<div class="map-alert blocked">⚠ Spy operation blocked: insufficient spies or intuition.</div>' : ''}
          </div>

          <div class="row dialog-actions">
            <button value="cancel">Cancel</button>
            <button class="primary danger" data-action="launchAttack" ${(!hasMissiles && !hasNukes && !hasSpies) ? "disabled" : ""}>
              Launch Attack
            </button>
          </div>
        </form>`;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       HELPERS
       ══════════════════════════════════════════════════════════════════════ */

    _isAllianceGov(nation, alliance, state) {
      if (!nation || !alliance) return false;
      if (alliance.founder === nation.id) return true;
      const member = alliance.members?.get?.(nation.id) || alliance.members?.[nation.id];
      if (member) {
        const roleId = member.role || member;
        const roles = alliance.government?.roles;
        if (roles && roles.get) {
          const role = roles.get(roleId);
          if (role && role.permissions && role.permissions.includes("all")) return true;
        }
        if (member.permissions && member.permissions.includes("all")) return true;
      }
      return false;
    }
}

window.MapModals = new MapModalsSystem();
