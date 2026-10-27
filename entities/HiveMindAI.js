/**
 * ════════════════════════════════════════════════════════════════════════════════════
 * HIVE MIND AI ENTITY
 * ════════════════════════════════════════════════════════════════════════════════════
 * Advanced AI that fully runs a Hive Mind alliance. No real user nation holds
 * leadership. The AI handles treaties, war, diplomacy, economy, membership,
 * skills, settings, and role assignment autonomously.
 *
 * Each AI has a randomly generated name (3 sets of 100 parts = 1,000,000
 * combinations) and a personality that starts randomized then evolves/learns
 * based on decisions and outcomes over time.
 */

// ════════════════════════════════════════════════════════════════════════════════════
// NAME GENERATION: 3 SETS OF 100 PARTS (1,000,000 COMBINATIONS)
// ════════════════════════════════════════════════════════════════════════════════════

const HIVE_MIND_NAME_PREFIXES = [
  'NEXUS','OMNI','QUANTUM','NEURAL','DIGITAL','COSMIC','STAR','VOID','PRIME','CORE',
  'SYNTH','CYBER','NODE','LINK','GRID','VECTOR','MATRIX','AXIS','ORBIT','SPIRAL',
  'CYCLE','LOOP','WAVE','PULSE','FLUX','ZENITH','APEX','CRYSTAL','PRISM','PHASE',
  'SHIFT','VECT','DATA','INFO','SYS','NET','BIND','WEAVE','SPIN','TURN',
  'PIVOT','HUB','CLUSTER','FLEET','SWARM','COLONY','OUTPOST','STATION','PLATFORM','GATE',
  'PORTAL','BRIDGE','TUNNEL','CONDUIT','CHANNEL','STREAM','FLOW','CURRENT','TIDE','SURGE',
  'BURST','SPARK','FLASH','BLAZE','INFERNO','FROST','ICE','FLAME','ASH','EMBER',
  'SMOKE','MIST','FOG','HAZE','VEIL','SHADOW','GHOST','SPECTER','WRAITH','PHANTOM',
  'ECHO','RESONANCE','VIBRATION','FREQUENCY','WAVELENGTH','AMPLITUDE','MODULATION','CARRIER','SIGNAL','TRANSMISSION',
  'BROADCAST','RECEPTION','DECODE','ENCODE','CIPHER','KEY','LOCK','AI','BOT','DRONE',
  'UNIT','AGENT','SERVER','CLIENT','HOST','TERMINAL','MAINFRAME','CLUSTER','GRIDCELL','SECTOR',
  'QUADRANT','REGION','ZONE','REALM','DOMAIN','SPHERE','BELT','RING','PATH','TRAIL',
  'ROUTE','COURSE','WAY','PASS','MARKER','BEACON','LIGHT','RAY','BEAM','TORRENT',
  'FLOOD','THROB','BEAT','RHYTHM','PRIMAL','PRIMORDIAL','ANCIENT','MODERN','FUTURE','PAST',
  'PRESENT','ETERNAL','TEMPORAL','CHRONO','TIME','SPACE','DIMENSION','NOVA','PULSAR','QUASAR'
];

const HIVE_MIND_NAME_MIDDLES = [
  'PRIME','ALPHA','OMEGA','BETA','GAMMA','DELTA','EPSILON','ZETA','ETA','THETA',
  'IOTA','KAPPA','LAMBDA','MU','NU','XI','OMICRON','PI','RHO','SIGMA',
  'TAU','UPSILON','PHI','CHI','PSI','FIRST','SECOND','THIRD','FOURTH','FIFTH',
  'SIXTH','SEVENTH','EIGHTH','NINTH','TENTH','ULTIMATE','SUPREME','MAXIMUM','MINIMUM','OPTIMAL',
  'PERFECT','IDEAL','PRIMAL','PRIMORDIAL','ANCIENT','MODERN','FUTURE','PAST','PRESENT','ETERNAL',
  'TEMPORAL','CHRONO','TIME','SPACE','DIMENSION','REALM','DOMAIN','SPHERE','ZONE','SECTOR',
  'QUADRANT','REGION','FIELD','BELT','RING','ORBIT','PATH','TRAIL','ROUTE','COURSE',
  'WAY','PASS','GATE','PORTAL','DOOR','WAYPOINT','MARKER','BEACON','LIGHT','RAY',
  'BEAM','STREAM','CURRENT','FLOW','RUSH','TORRENT','FLOOD','TIDE','WAVE','SURGE',
  'PULSE','THROB','BEAT','RHYTHM','CYCLE','LOOP','NODE','CORE','HUB','SPHERE',
  'NEXUS','LINK','GRID','VECTOR','MATRIX','AXIS','SPIRAL','CYCLE','WAVE','PULSE',
  'FLUX','ZENITH','APEX','CRYSTAL','PRISM','PHASE','SHIFT','SYNTH','CYBER','DIGITAL',
  'NEURAL','COSMIC','STAR','VOID','DATA','INFO','CLUSTER','FLEET','SWARM','COLONY',
  'OUTPOST','STATION','PLATFORM','BRIDGE','TUNNEL','CONDUIT','CHANNEL','FLOW','CURRENT','TIDE',
  'SURGE','BURST','SPARK','FLASH','BLAZE','INFERNO','FROST','ICE','FLAME','ASH',
  'EMBER','SMOKE','MIST','FOG','HAZE','VEIL','SHADOW','GHOST','SPECTER','WRAITH',
  'PHANTOM','ECHO','RESONANCE','VIBRATION','FREQUENCY','WAVELENGTH','AMPLITUDE','MODULATION','CARRIER','SIGNAL'
];

const HIVE_MIND_NAME_SUFFIXES = [
  'MIND','CORE','SYSTEM','NEXUS','HUB','NODE','NET','GRID','LINK','VECT',
  'MATRIX','AXIS','ORBIT','SPIRAL','CYCLE','LOOP','WAVE','PULSE','FLUX','ZENITH',
  'APEX','CRYSTAL','PRISM','PHASE','SHIFT','SYNTH','CYBER','DIGITAL','NEURAL','COSMIC',
  'STAR','VOID','DATA','INFO','SYS','NET','CLUSTER','FLEET','SWARM','COLONY',
  'OUTPOST','STATION','PLATFORM','GATE','PORTAL','BRIDGE','TUNNEL','CONDUIT','CHANNEL','STREAM',
  'FLOW','CURRENT','TIDE','SURGE','BURST','SPARK','FLASH','BLAZE','INFERNO','FROST',
  'ICE','FLAME','ASH','EMBER','SMOKE','MIST','FOG','HAZE','VEIL','SHADOW',
  'GHOST','SPECTER','WRAITH','PHANTOM','ECHO','RESONANCE','VIBRATION','FREQUENCY','WAVELENGTH','AMPLITUDE',
  'MODULATION','CARRIER','SIGNAL','TRANSMISSION','BROADCAST','RECEPTION','DECODE','ENCODE','CIPHER','KEY',
  'LOCK','AI','BOT','DRONE','UNIT','AGENT','SERVER','CLIENT','HOST','TERMINAL',
  'MAINFRAME','CLUSTER','GRIDCELL','SECTOR','QUADRANT','REGION','ZONE','REALM','DOMAIN','SPHERE',
  'BELT','RING','PATH','TRAIL','ROUTE','COURSE','WAY','PASS','MARKER','BEACON',
  'LIGHT','RAY','BEAM','TORRENT','FLOOD','THROB','BEAT','RHYTHM','PRIMAL','PRIMORDIAL',
  'ANCIENT','MODERN','FUTURE','PAST','PRESENT','ETERNAL','TEMPORAL','CHRONO','TIME','SPACE',
  'DIMENSION','NOVA','PULSAR','QUASAR','UNITY','HARMONY','SYMMETRY','BALANCE','ORDER','CHAOS',
  'PRIME','OMEGA','ALPHA','SINGULARITY','ETERNITY','INFINITY','OMNI','PAN','META','ULTRA'
];

/**
 * Generate a random AI name by combining one part from each set.
 * 100 * 100 * 100 = 1,000,000 possible combinations.
 */
function generateRandomAIName() {
  const p = HIVE_MIND_NAME_PREFIXES[Math.floor(Math.random() * HIVE_MIND_NAME_PREFIXES.length)];
  const m = HIVE_MIND_NAME_MIDDLES[Math.floor(Math.random() * HIVE_MIND_NAME_MIDDLES.length)];
  const s = HIVE_MIND_NAME_SUFFIXES[Math.floor(Math.random() * HIVE_MIND_NAME_SUFFIXES.length)];
  return `${p}-${m}-${s}`;
}

/**
 * Generate a completely random starting personality. Weights sum to 1.0.
 */
function generateRandomPersonality() {
  // Random weights that sum to 1.0
  const econRaw = Math.random();
  const milRaw = Math.random() * (1 - econRaw);
  const diploRaw = 1 - econRaw - milRaw;

  return {
    weights: {
      econ: Math.round(econRaw * 1000) / 1000,
      mil: Math.round(milRaw * 1000) / 1000,
      diplo: Math.round(diploRaw * 1000) / 1000
    },
    risk: Math.round(Math.random() * 1000) / 1000, // 0-1 aggression
    learningRate: Math.round((0.03 + Math.random() * 0.07) * 1000) / 1000, // 0.03-0.10
    traits: {
      expansionist: Math.round(Math.random() * 1000) / 1000,
      militaristic: Math.round(Math.random() * 1000) / 1000,
      diplomatic: Math.round(Math.random() * 1000) / 1000,
      economic: Math.round(Math.random() * 1000) / 1000,
      isolationist: Math.round(Math.random() * 1000) / 1000
    },
    decisionCount: 0,
    successfulDecisions: 0,
    lastEvolution: Date.now(),
    dominantStyle: null // 'econ' | 'mil' | 'diplo' — set after first few decisions
  };
}

/**
 * Normalize personality weights so they always sum to 1.0.
 */
function normalizeWeights(weights) {
  const total = (weights.econ || 0) + (weights.mil || 0) + (weights.diplo || 0);
  if (total <= 0) {
    return { econ: 0.33, mil: 0.33, diplo: 0.34 };
  }
  return {
    econ: Math.round(((weights.econ || 0) / total) * 1000) / 1000,
    mil: Math.round(((weights.mil || 0) / total) * 1000) / 1000,
    diplo: Math.round(((weights.diplo || 0) / total) * 1000) / 1000
  };
}

class HiveMindAI {
    constructor(alliance, aiName = null, personality = null) {
        if (!alliance || !alliance.id) {
            throw new Error('HiveMindAI requires a valid alliance instance with an id');
        }

        // ── Identity ───────────────────────────────────────────────────────
        this.alliance = alliance;
        this.allianceId = alliance.id;
        this.name = aiName || generateRandomAIName();
        this.personality = personality || generateRandomPersonality();

        // ── Memory / state ─────────────────────────────────────────────────
        this.memory = {
            lastTreatyCheck: 0,
            lastWarCheck: 0,
            lastMemberReview: 0,
            lastTreasuryCheck: 0,
            lastSettingsCheck: 0,
            lastSkillsCheck: 0,
            lastApplicationCheck: 0,
            lastInvitationCheck: 0,
            lastRoleCheck: 0,
            favoredStat: 'econ',
            lastAllianceStats: null
        };
        this.decisionHistory = [];
        this.isActive = true;
        this.createdAt = Date.now();
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // MAIN TICK
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Main tick. Called once per day by AllianceSystem.processGovernmentDaily.
     * The AI evaluates and acts on every aspect of running the alliance.
     */
    async tick() {
        if (!this.isActive) return { actions: [], personality: this.personality, favoredStat: this.memory.favoredStat };

        const now = Date.now();
        const alliance = this._safeAlliance();
        if (!alliance) return { actions: [], personality: this.personality, favoredStat: this.memory.favoredStat };

        const members = this._membersKeys(alliance);
        if (members.length === 0) {
            this.isActive = false;
            return { actions: [], personality: this.personality, favoredStat: this.memory.favoredStat };
        }

        const actions = [];

        // Rotate the "favored stat" each cycle so no single nation is consistently favored
        const stats = ['econ', 'mil', 'diplo'];
        this.memory.favoredStat = stats[Math.floor(Math.random() * stats.length)];

        // Cache alliance-level stats for informed decisions
        this._cacheAllianceStats(alliance, members);

        // Determine if alliance is at war (for application context)
        const atWar = this._isAllianceAtWar(alliance);

        // ── Treaties (~35% chance per day) ─────────────────────────────────
        if (now - this.memory.lastTreatyCheck > 24 * 60 * 60 * 1000 && Math.random() < 0.35) {
            this.memory.lastTreatyCheck = now;
            const treatyAction = this._evaluateTreaties(alliance, members);
            if (treatyAction) actions.push(treatyAction);
        }

        // ── War (~25% chance per day) ──────────────────────────────────────
        if (now - this.memory.lastWarCheck > 24 * 60 * 60 * 1000 && Math.random() < 0.25) {
            this.memory.lastWarCheck = now;
            const warAction = this._evaluateWar(alliance, members);
            if (warAction) actions.push(warAction);
        }

        // ── Membership review (~15% chance per day) ────────────────────────
        if (now - this.memory.lastMemberReview > 24 * 60 * 60 * 1000 && Math.random() < 0.15) {
            this.memory.lastMemberReview = now;
            const memberAction = this._evaluateMembership(alliance, members);
            if (memberAction) actions.push(memberAction);
        }

        // ── Treasury (~20% chance per day) ─────────────────────────────────
        if (now - this.memory.lastTreasuryCheck > 24 * 60 * 60 * 1000 && Math.random() < 0.20) {
            this.memory.lastTreasuryCheck = now;
            const treasuryAction = this._evaluateTreasury(alliance, members);
            if (treasuryAction) actions.push(treasuryAction);
        }

        // ── Alliance settings (~10% chance per day) ────────────────────────
        if (now - this.memory.lastSettingsCheck > 24 * 60 * 60 * 1000 && Math.random() < 0.10) {
            this.memory.lastSettingsCheck = now;
            const settingsAction = this._evaluateSettings(alliance);
            if (settingsAction) actions.push(settingsAction);
        }

        // ── Alliance skills (~30% chance per day) ──────────────────────────
        if (now - this.memory.lastSkillsCheck > 24 * 60 * 60 * 1000 && Math.random() < 0.30) {
            this.memory.lastSkillsCheck = now;
            const skillAction = this._evaluateSkills(alliance, members);
            if (skillAction) actions.push(skillAction);
        }

        // ── Review applications (~25% chance per day) ──────────────────────
        if (now - this.memory.lastApplicationCheck > 24 * 60 * 60 * 1000 && Math.random() < 0.25) {
            this.memory.lastApplicationCheck = now;
            const appAction = this._evaluateApplications(alliance, { atWar });
            if (appAction) {
                if (Array.isArray(appAction)) {
                    actions.push(...appAction);
                } else {
                    actions.push(appAction);
                }
            }
        }

        // ── Send invitations (~20% chance per day) ─────────────────────────
        if (now - this.memory.lastInvitationCheck > 24 * 60 * 60 * 1000 && Math.random() < 0.20) {
            this.memory.lastInvitationCheck = now;
            const invAction = this._evaluateInvitations(alliance, members);
            if (invAction) actions.push(invAction);
        }

        // ── Role assignment (~20% chance per day) ──────────────────────────
        if (now - (this.memory.lastRoleCheck || 0) > 24 * 60 * 60 * 1000 && Math.random() < 0.20) {
            this.memory.lastRoleCheck = now;
            const roleAction = this._evaluateRoleAssignment(alliance, members);
            if (roleAction) {
                if (Array.isArray(roleAction)) {
                    actions.push(...roleAction);
                } else {
                    actions.push(roleAction);
                }
            }
        }

        // Record decisions (cap history)
        if (actions.length > 0) {
            this.decisionHistory.push({ at: now, actions, favoredStat: this.memory.favoredStat });
            if (this.decisionHistory.length > 200) this.decisionHistory.shift();
        }

        return { actions, personality: this.personality, favoredStat: this.memory.favoredStat };
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // PERSONALITY EVOLUTION (LEARNING)
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Evolve the AI's personality after a decision executes.
     * Successful actions nudge weights toward that category; failed actions nudge away.
     * Small random drift occurs each cycle to simulate natural personality drift.
     */
    evolvePersonality(actionCategory, success) {
        const p = this.personality;
        if (!p) return;

        const lr = p.learningRate || 0.05;
        const nudge = success ? lr : -lr;

        // Nudge weights toward/away from the category used
        if (actionCategory === 'econ') {
            p.weights.econ = Math.min(0.9, Math.max(0.05, p.weights.econ + nudge));
        } else if (actionCategory === 'mil') {
            p.weights.mil = Math.min(0.9, Math.max(0.05, p.weights.mil + nudge));
        } else if (actionCategory === 'diplo') {
            p.weights.diplo = Math.min(0.9, Math.max(0.05, p.weights.diplo + nudge));
        }

        // Re-normalize weights to sum to 1.0
        p.weights = normalizeWeights(p.weights);

        // Adjust risk: successful aggressive actions increase risk, failed ones decrease
        if (actionCategory === 'mil') {
            p.risk = Math.min(1, Math.max(0, p.risk + (success ? lr * 0.5 : -lr * 0.5)));
        }

        // Traits evolve slowly
        p.traits.expansionist = Math.min(1, Math.max(0, p.traits.expansionist + (success ? lr * 0.2 : -lr * 0.1)));
        p.traits.militaristic = Math.min(1, Math.max(0, p.traits.militaristic + (actionCategory === 'mil' ? lr * 0.3 : -lr * 0.1)));
        p.traits.diplomatic = Math.min(1, Math.max(0, p.traits.diplomatic + (actionCategory === 'diplo' ? lr * 0.3 : -lr * 0.1)));
        p.traits.economic = Math.min(1, Math.max(0, p.traits.economic + (actionCategory === 'econ' ? lr * 0.3 : -lr * 0.1)));
        p.traits.isolationist = Math.min(1, Math.max(0, p.traits.isolationist + (success ? -lr * 0.1 : lr * 0.1)));

        // Track stats
        p.decisionCount = (p.decisionCount || 0) + 1;
        if (success) p.successfulDecisions = (p.successfulDecisions || 0) + 1;

        // Determine dominant style
        const w = p.weights;
        if (w.econ >= w.mil && w.econ >= w.diplo) p.dominantStyle = 'econ';
        else if (w.mil >= w.diplo) p.dominantStyle = 'mil';
        else p.dominantStyle = 'diplo';

        p.lastEvolution = Date.now();

        // Small random drift each cycle (personality naturally wanders over time)
        const drift = 0.01;
        p.weights.econ = Math.min(0.9, Math.max(0.05, p.weights.econ + (Math.random() - 0.5) * drift));
        p.weights.mil = Math.min(0.9, Math.max(0.05, p.weights.mil + (Math.random() - 0.5) * drift));
        p.weights.diplo = Math.min(0.9, Math.max(0.05, p.weights.diplo + (Math.random() - 0.5) * drift));
        p.weights = normalizeWeights(p.weights);
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // SAFETY / HELPERS
    // ══════════════════════════════════════════════════════════════════════════════

    _safeAlliance() {
        if (!this.alliance) return null;
        if (!this.alliance.id) return null;
        return this.alliance;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // MEMBER ACCESS COMPATIBILITY (Map vs plain object)
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Get member keys (works for both Map and plain object).
     */
    _membersKeys(alliance) {
        if (!alliance || !alliance.members) return [];
        if (typeof alliance.members.keys === 'function') {
            return Array.from(alliance.members.keys());
        }
        return Object.keys(alliance.members);
    }

    /**
     * Get member entries [id, data] (works for both Map and plain object).
     */
    _membersEntries(alliance) {
        if (!alliance || !alliance.members) return [];
        if (typeof alliance.members.entries === 'function') {
            return Array.from(alliance.members.entries());
        }
        return Object.entries(alliance.members);
    }

    /**
     * Check if a nation is a member (works for both Map and plain object).
     */
    _membersHas(alliance, nationId) {
        if (!alliance || !alliance.members) return false;
        if (typeof alliance.members.has === 'function') {
            return alliance.members.has(nationId);
        }
        return Object.prototype.hasOwnProperty.call(alliance.members, nationId);
    }

    /**
     * Get member data (works for both Map and plain object).
     * Returns the raw stored value (role string for plain objects, memberData object for Map).
     */
    _membersGet(alliance, nationId) {
        if (!alliance || !alliance.members) return undefined;
        if (typeof alliance.members.get === 'function') {
            return alliance.members.get(nationId);
        }
        return alliance.members[nationId];
    }

    /**
     * Set member role/data (works for both Map and plain object).
     */
    _membersSet(alliance, nationId, value) {
        if (!alliance || !alliance.members) return false;
        if (typeof alliance.members.set === 'function') {
            alliance.members.set(nationId, value);
        } else {
            alliance.members[nationId] = value;
        }
        return true;
    }

    /**
     * Delete a member (works for both Map and plain object).
     */
    _membersDelete(alliance, nationId) {
        if (!alliance || !alliance.members) return false;
        if (typeof alliance.members.delete === 'function') {
            return alliance.members.delete(nationId);
        }
        if (Object.prototype.hasOwnProperty.call(alliance.members, nationId)) {
            delete alliance.members[nationId];
            return true;
        }
        return false;
    }

    /**
     * Get member count (works for both Map and plain object).
     */
    _membersSize(alliance) {
        if (!alliance || !alliance.members) return 0;
        if (typeof alliance.members.size === 'number') {
            return alliance.members.size;
        }
        return Object.keys(alliance.members).length;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // SAFETY / HELPERS (continued)
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Check if this alliance is currently in any war.
     */
    _isAllianceAtWar(alliance) {
        if (!alliance || !alliance.id) return false;
        if (window.WarSystem && window.WarSystem.activeWars) {
            for (const [warId, war] of window.WarSystem.activeWars) {
                if (war.participants && war.participants.includes(alliance.id)) return true;
            }
        }
        if (window.DataManager && window.DataManager.wars) {
            for (const [warId, war] of Object.entries(window.DataManager.wars)) {
                if (war.participants && war.participants.includes(alliance.id)) return true;
            }
        }
        return false;
    }

    /**
     * Get a random nation NOT in this alliance (for war/treaty targets).
     */
    _pickRandomOutsideNation(alliance) {
        const allNations = [];
        if (window.DataManager && window.DataManager.currentPlayer) {
            allNations.push(...(window.DataManager.currentPlayer.nations || []));
        }
        if (window.DataManager && window.DataManager.nations) {
            for (const n of window.DataManager.nations || []) {
                if (!allNations.find(x => x && x.id === n.id)) allNations.push(n);
            }
        }
        const targets = allNations.filter(n => n && n.id && !this._membersHas(alliance, n.id));
        if (targets.length === 0) return null;
        return targets[Math.floor(Math.random() * targets.length)];
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // TREATY EVALUATION
    // ══════════════════════════════════════════════════════════════════════════════

    _evaluateTreaties(alliance, members) {
        const roll = Math.random();
        const weight = this.personality.weights || { econ: 0.33, mil: 0.33, diplo: 0.33 };
        const diploWeight = weight.diplo || 0.33;
        const risk = this.personality.risk || 0.5;

        const actionRoll = Math.random();
        let action;
        if (actionRoll < 0.45) action = 'consider_proposal';
        else if (actionRoll < 0.80) action = 'consider_acceptance';
        else action = 'no_action';

        if (action === 'no_action') return null;

        if (action === 'consider_proposal') {
            const targetAlliance = this._pickRandomOtherAlliance(alliance);
            if (!targetAlliance) return null;

            const treatyTypes = ['peace', 'protectorate', 'mutualDefense', 'mutualAggression', 'intelligence'];
            let treatyType;
            if (diploWeight >= 0.5) {
                treatyType = Math.random() < 0.6 ? 'peace' : 'intelligence';
            } else if (weight.mil >= 0.5) {
                treatyType = Math.random() < 0.6 ? 'mutualDefense' : 'mutualAggression';
            } else {
                treatyType = treatyTypes[Math.floor(Math.random() * treatyTypes.length)];
            }

            const willProceed = this._willProceed(0.25, diploWeight * 0.2);
            return {
                type: 'treaty',
                action,
                targetAllianceId: targetAlliance.id,
                targetAllianceName: targetAlliance.name || targetAlliance.id,
                treatyType,
                category: 'diplo',
                rationale: `AI ${this.personality.name} evaluating ${action} for ${treatyType} based on ${this.memory.favoredStat} statistical weight`,
                timestamp: Date.now(),
                willProceed
            };
        }

        // consider_acceptance: find pending proposals targeting this alliance
        if (window.DiplomacySystem && DiplomacySystem.treatyProposals) {
            const pending = [];
            for (const [id, proposal] of DiplomacySystem.treatyProposals) {
                if (proposal.targetId === alliance.id && proposal.status === 'pending' && Date.now() <= proposal.expiresAt) {
                    pending.push(proposal);
                }
            }
            if (pending.length === 0) return null;

            const proposal = pending[Math.floor(Math.random() * pending.length)];
            const willProceed = this._willProceed(0.30, diploWeight * 0.25);
            return {
                type: 'treaty',
                action,
                proposalId: proposal.id,
                proposerId: proposal.proposerId,
                treatyType: proposal.treatyType,
                category: 'diplo',
                rationale: `AI ${this.personality.name} evaluating acceptance of ${proposal.treatyType} treaty from ${proposal.proposerId}`,
                timestamp: Date.now(),
                willProceed
            };
        }

        return null;
    }

    respondToTreatyProposal(proposal) {
        if (!proposal) return { accepted: false, reason: 'No proposal provided' };

        // Verify the proposal targets this alliance
        if (proposal.targetId && proposal.targetId !== this.allianceId) {
            return { accepted: false, reason: 'Proposal does not target this alliance' };
        }

        const roll = Math.random();
        const weight = this.personality.weights || { econ: 0.33, mil: 0.33, diplo: 0.33 };
        const diploWeight = weight.diplo || 0.33;
        const acceptChance = Math.min(0.90, Math.max(0.05, 0.30 + diploWeight * 0.4));
        const accepted = roll < acceptChance;

        this.decisionHistory.push({
            at: Date.now(),
            type: 'treaty_response',
            proposalId: proposal.id,
            accepted,
            treatyType: proposal.treatyType,
            rationale: `AI ${this.personality.name} ${accepted ? 'accepted' : 'declined'} treaty ${proposal.treatyType} by statistical roll`
        });

        this.evolvePersonality('diplo', accepted);

        return { accepted, reason: accepted ? 'AI statistical acceptance' : 'AI statistical decline' };
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // WAR EVALUATION
    // ══════════════════════════════════════════════════════════════════════════════

    _evaluateWar(alliance, members) {
        const roll = Math.random();
        const weight = this.personality.weights || { econ: 0.33, mil: 0.33, diplo: 0.33 };
        const milWeight = weight.mil || 0.33;
        const risk = this.personality.risk || 0.5;

        const aggressive = roll < (this.memory.favoredStat === 'mil' ? risk * 0.7 : risk * 0.4);
        const action = aggressive ? 'prepare_offensive' : 'hold_defensive';

        // Only proceed if there's actually a target nation available
        const hasTarget = this._pickRandomOutsideNation(alliance) !== null;
        const willProceed = aggressive && hasTarget && this._willProceed(0.20, milWeight * 0.2);

        return {
            type: 'war',
            action,
            targetNationId: null, // resolved at execution time
            category: 'mil',
            rationale: `AI ${this.personality.name} ${aggressive ? 'leaning aggressive' : 'remaining neutral'} based on military statistical weight`,
            timestamp: Date.now(),
            willProceed
        };
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // MEMBERSHIP EVALUATION
    // ══════════════════════════════════════════════════════════════════════════════

    _evaluateMembership(alliance, members) {
        if (members.length <= 1) return null;
        const kickRoll = Math.random();
        if (kickRoll > 0.20) return null;

        let candidate = null;
        const inactive = [];
        for (const nationId of members) {
            const nation = this._getNation(nationId);
            if (nation && (!nation.lastActive || Date.now() - nation.lastActive > 14 * 24 * 60 * 60 * 1000)) {
                inactive.push(nationId);
            }
        }
        if (inactive.length > 0 && Math.random() < 0.7) {
            candidate = inactive[Math.floor(Math.random() * inactive.length)];
        } else {
            candidate = this._pickRandomMember(members);
        }

        const willProceed = this._willProceed(0.08, 0);

        return {
            type: 'membership',
            action: 'review_member',
            targetNationId: candidate,
            category: 'econ',
            rationale: `AI ${this.personality.name} conducting membership review`,
            timestamp: Date.now(),
            willProceed
        };
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // TREASURY EVALUATION
    // ══════════════════════════════════════════════════════════════════════════════

    _evaluateTreasury(alliance, members) {
        if (!alliance || alliance.treasury === undefined) return null;

        const weight = this.personality.weights || { econ: 0.33, mil: 0.33, diplo: 0.33 };
        const econWeight = weight.econ || 0.33;
        const roll = Math.random();

        let action;
        if (alliance.treasury > 50000000 && roll < 0.5) {
            action = 'withdraw';
        } else if (alliance.treasury < 10000000 && roll < 0.6) {
            action = 'deposit';
        } else {
            action = 'hold';
        }

        if (action === 'hold') return null;

        const amount = action === 'withdraw'
            ? Math.floor(alliance.treasury * 0.10)
            : 5000000;

        const willProceed = this._willProceed(0.30, econWeight * 0.2);

        return {
            type: 'treasury',
            action,
            amount,
            category: 'econ',
            rationale: `AI ${this.personality.name} treasury ${action} of ${amount} based on economic weight`,
            timestamp: Date.now(),
            willProceed
        };
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // SETTINGS EVALUATION
    // ══════════════════════════════════════════════════════════════════════════════

    _evaluateSettings(alliance) {
        if (!alliance) return null;

        const roll = Math.random();
        const weight = this.personality.weights || { econ: 0.33, mil: 0.33, diplo: 0.33 };
        const diploWeight = weight.diplo || 0.33;

        let action;
        if (roll < 0.3) action = 'toggle_open';
        else if (roll < 0.6) action = 'update_description';
        else return null;

        const willProceed = this._willProceed(0.25, diploWeight * 0.15);

        return {
            type: 'settings',
            action,
            open: action === 'toggle_open' ? !(alliance.open !== false) : alliance.open,
            description: action === 'update_description' ? `Managed by ${this.personality.name}` : alliance.description,
            category: 'diplo',
            rationale: `AI ${this.personality.name} adjusting alliance settings`,
            timestamp: Date.now(),
            willProceed
        };
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // SKILLS EVALUATION (AI spends alliance skill points autonomously)
    // ══════════════════════════════════════════════════════════════════════════════

    _evaluateSkills(alliance, members) {
        if (!alliance || alliance.skillPoints === undefined || alliance.skillPoints < 1) return null;
        if (!window.AllianceSystem || !AllianceSystem.allianceSkills) return null;

        const skills = AllianceSystem.allianceSkills;
        const weight = this.personality.weights || { econ: 0.33, mil: 0.33, diplo: 0.33 };
        const traits = this.personality.traits || {};

        // Build a prioritized list of skills based on personality
        const candidates = [];

        for (const [skillKey, skillDef] of Object.entries(skills)) {
            const currentSkill = alliance.skills && alliance.skills[skillKey];
            if (!currentSkill) continue;
            if (currentSkill.level >= skillDef.maxLevel) continue;

            // Calculate cost for next level
            const nextLevel = currentSkill.level;
            const cost = Math.floor(skillDef.baseCost * Math.pow(skillDef.costMultiplier, nextLevel));
            if (alliance.skillPoints < cost) continue;

            // Score this skill based on personality alignment
            let score = 0;
            const keyLower = skillKey.toLowerCase();

            if (keyLower.includes('combat') || keyLower.includes('marksmanship') || keyLower.includes('offensive') || keyLower.includes('defensive')) {
                score += weight.mil * 10 + traits.militaristic * 5;
            }
            if (keyLower.includes('roster') || keyLower.includes('member')) {
                score += traits.expansionist * 8 + weight.diplo * 3;
            }
            if (keyLower.includes('customization') || keyLower.includes('economy') || keyLower.includes('upkeep') || keyLower.includes('tech')) {
                score += weight.econ * 8 + traits.economic * 5;
            }
            if (keyLower.includes('diplomacy') || keyLower.includes('treaty') || keyLower.includes('unity')) {
                score += weight.diplo * 10 + traits.diplomatic * 5;
            }

            // Base score so all skills have a chance
            score += Math.random() * 2;

            candidates.push({ skillKey, cost, score, skillDef, currentSkill });
        }

        if (candidates.length === 0) return null;

        // Pick the highest-scoring affordable skill
        candidates.sort((a, b) => b.score - a.score);
        const pick = candidates[0];

        // Bonus score for the personality's preferred skill style
        const preferredSkill = this._preferredSkillForStyle();
        if (pick.skillKey === preferredSkill) pick.score += 3;

        // Spend skill points (may be multiple levels if affordable)
        let levelsToBuy = 1;
        let totalCost = pick.cost;
        let tempLevel = pick.currentSkill.level;
        while (tempLevel + 1 < pick.skillDef.maxLevel && alliance.skillPoints >= totalCost + Math.floor(pick.skillDef.baseCost * Math.pow(pick.skillDef.costMultiplier, tempLevel + 1))) {
            tempLevel++;
            totalCost += Math.floor(pick.skillDef.baseCost * Math.pow(pick.skillDef.costMultiplier, tempLevel));
            levelsToBuy++;
        }

        const willProceed = this._willProceed(0.40, weight.econ * 0.2);

        return {
            type: 'skills',
            action: 'upgrade_skill',
            skillKey: pick.skillKey,
            levels: levelsToBuy,
            cost: totalCost,
            category: pick.skillKey.includes('combat') || pick.skillKey.includes('marksmanship') ? 'mil' :
                      pick.skillKey.includes('roster') || pick.skillKey.includes('diplomacy') || pick.skillKey.includes('unity') ? 'diplo' : 'econ',
            rationale: `AI ${this.personality.name} upgrading ${pick.skillKey} by ${levelsToBuy} level(s) (cost ${totalCost})`,
            timestamp: Date.now(),
            willProceed
        };
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // APPLICATIONS EVALUATION (AI reviews and auto-accepts/rejects applications)
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Core personality-driven application evaluation.
     * @param {Object} applicant - nation data of the applicant
     * @param {Object} context - { atWar, previousAllianceId, foughtAgainst, applicantMoney, applicantMilStrength }
     * @returns {Object} { accept: boolean, reason: string, confidence: number }
     */
    evaluateApplication(applicant, context = {}) {
        const p = this.personality;
        const traits = p.traits || {};
        const weights = p.weights || { econ: 0.33, mil: 0.33, diplo: 0.33 };
        const risk = p.risk || 0.5;

        let score = 0.5; // neutral baseline
        const reasons = [];

        // ── Isolationist factor: less likely to accept anyone ─────────────
        if (traits.isolationist > 0.6) {
            score -= 0.25 * traits.isolationist;
            reasons.push('isolationist tendency');
        } else if (traits.isolationist < 0.3) {
            score += 0.15;
            reasons.push('welcoming stance');
        }

        // ── Expansionist factor: more likely to accept ────────────────────
        if (traits.expansionist > 0.6) {
            score += 0.2 * traits.expansionist;
            reasons.push('expansionist drive');
        }

        // ── War status factor ─────────────────────────────────────────────
        if (context.atWar) {
            if (traits.militaristic > 0.6) {
                // Militaristic AI: more selective during war, wants strong allies
                score -= 0.15;
                reasons.push('wartime selectivity');
            } else if (traits.isolationist > 0.5) {
                score -= 0.3;
                reasons.push('isolationist during war');
            } else {
                score -= 0.1;
                reasons.push('cautious during war');
            }
        } else {
            // Not at war: more open to accepting
            score += 0.1;
            reasons.push('peacetime openness');
        }

        // ── Previous alliance factor ──────────────────────────────────────
        if (context.foughtAgainst) {
            // AI fought against this applicant's previous alliance
            if (traits.militaristic > 0.5) {
                score -= 0.35 * traits.militaristic;
                reasons.push('fought against previous alliance');
            } else if (traits.diplomatic > 0.6) {
                score += 0.15;
                reasons.push('diplomatic forgiveness');
            } else {
                score -= 0.2;
                reasons.push('previous enemy');
            }
        } else if (context.previousAllianceId) {
            // Was in an alliance but we didn't fight them
            if (traits.expansionist > 0.6) {
                score += 0.1;
                reasons.push('experienced recruit');
            }
        }

        // ── Economic factor ───────────────────────────────────────────────
        if (context.applicantMoney !== undefined) {
            if (weights.econ > 0.4 && context.applicantMoney > 10000000) {
                score += 0.15;
                reasons.push('wealthy applicant');
            } else if (weights.econ > 0.4 && context.applicantMoney < 1000000) {
                score -= 0.1;
                reasons.push('economically weak');
            }
        }

        // ── Military strength factor ──────────────────────────────────────
        if (context.applicantMilStrength !== undefined) {
            if (weights.mil > 0.4 && context.applicantMilStrength > 5000) {
                score += 0.15;
                reasons.push('militarily strong');
            } else if (weights.mil > 0.6 && context.applicantMilStrength < 1000) {
                score -= 0.1;
                reasons.push('militarily weak');
            }
        }

        // ── Diplomatic factor ─────────────────────────────────────────────
        if (weights.diplo > 0.5) {
            score += 0.1;
            reasons.push('diplomatic inclination');
        }

        // ── Randomness based on risk ──────────────────────────────────────
        score += (Math.random() - 0.5) * risk * 0.2;

        // Clamp score to [0, 1]
        score = Math.min(1, Math.max(0, score));

        const accept = score >= 0.5;
        const confidence = Math.abs(score - 0.5) * 2; // 0 to 1

        return {
            accept,
            reason: reasons.length > 0 ? reasons.join(', ') : 'standard evaluation',
            confidence,
            score
        };
    }

    /**
     * Evaluate all pending applications for the alliance.
     * Requires context about war status and applicant histories.
     * @param {Object} alliance - alliance object
     * @param {Object} context - { atWar, wars: Map, nations: Map }
     * @returns {Array} actions for accept/reject decisions
     */
    _evaluateApplications(alliance, context = {}) {
        if (!alliance) return null;

        const applications = alliance.applications || [];
        if (applications.length === 0) return null;

        const memberCount = this._membersSize(alliance);
        const memberLimit = alliance.memberLimit || 6;

        const actions = [];

        for (const applicantId of applications) {
            // Check if still at capacity
            if (memberCount >= memberLimit) {
                actions.push({
                    type: 'application',
                    action: 'reject',
                    nationId: applicantId,
                    category: 'econ',
                    rationale: `AI ${this.personality.name} rejecting ${applicantId} - alliance at capacity`,
                    timestamp: Date.now(),
                    willProceed: true
                });
                continue;
            }

            // Gather applicant context
            const applicant = this._getNation(applicantId);
            const appCtx = {
                atWar: context.atWar || false,
                previousAllianceId: applicant?.allianceId || null,
                foughtAgainst: false,
                applicantMoney: applicant?.money || 0,
                applicantMilStrength: applicant?.militaryStrength || 0
            };

            // Check if we fought against the applicant's previous alliance
            if (appCtx.previousAllianceId && context.wars) {
                for (const [warId, war] of context.wars) {
                    const participants = war.participants || [];
                    if (participants.includes(appCtx.previousAllianceId) &&
                        participants.includes(alliance.id)) {
                        appCtx.foughtAgainst = true;
                        break;
                    }
                }
            }

            // Run personality-driven evaluation
            const evalResult = this.evaluateApplication(applicant, appCtx);

            actions.push({
                type: 'application',
                action: evalResult.accept ? 'accept' : 'reject',
                nationId: applicantId,
                category: evalResult.accept ? 'diplo' : 'econ',
                rationale: `AI ${this.personality.name} ${evalResult.accept ? 'accepting' : 'rejecting'} ${applicantId} - ${evalResult.reason} (confidence: ${Math.round(evalResult.confidence * 100)}%)`,
                timestamp: Date.now(),
                willProceed: true,
                confidence: evalResult.confidence
            });

            if (evalResult.accept) memberCount++;
        }

        return actions.length > 0 ? actions : null;
    }

    /**
     * Execute an application decision (accept or reject).
     * @param {Object} action - { action: 'accept'|'reject', nationId, ... }
     * @param {Object} alliance - alliance object
     * @param {Object} server - reference to server world for nation data
     */
    async executeApplicationDecision(action, alliance, server = null) {
        try {
            const targetNationId = action.nationId;
            if (!targetNationId) return { success: false, reason: 'No nation ID' };

            if (action.action === 'accept') {
                if (!alliance.applications || !alliance.applications.includes(targetNationId)) {
                    return { success: false, reason: 'No pending application' };
                }

                // Check capacity
                const memberCount = this._membersSize(alliance);
                const memberLimit = alliance.memberLimit || 6;
                if (memberCount >= memberLimit) {
                    return { success: false, reason: 'Alliance is full' };
                }

                // Get the nation object
                let nation = null;
                if (server && server.nation) {
                    nation = server.nation(targetNationId).nation;
                } else {
                    nation = this._getNation(targetNationId);
                }

                if (!nation) return { success: false, reason: 'Nation not found' };
                if (nation.allianceId) return { success: false, reason: 'Already in an alliance' };

                // Add to alliance server-side
                this._membersSet(alliance, targetNationId, 'servant');
                nation.allianceId = alliance.id;
                alliance.applications = alliance.applications.filter((x) => x !== targetNationId);

                // Log it
                alliance.log = alliance.log || [];
                alliance.log.push({
                    actor: 'HiveMindAI',
                    action: 'accept_application',
                    target: targetNationId,
                    at: Date.now()
                });

                this.evolvePersonality('diplo', true);
                return { success: true, action: 'accepted', nationId: targetNationId };
            } else if (action.action === 'reject') {
                if (!alliance.applications || !alliance.applications.includes(targetNationId)) {
                    return { success: false, reason: 'No pending application' };
                }

                alliance.applications = alliance.applications.filter((x) => x !== targetNationId);

                alliance.log = alliance.log || [];
                alliance.log.push({
                    actor: 'HiveMindAI',
                    action: 'reject_application',
                    target: targetNationId,
                    at: Date.now()
                });

                this.evolvePersonality('econ', true);
                return { success: true, action: 'rejected', nationId: targetNationId };
            }

            return { success: false, reason: 'Unknown application action' };
        } catch (e) {
            return { success: false, reason: e.message };
        }
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // INVITATIONS EVALUATION (AI sends invitations to recruit members)
    // ══════════════════════════════════════════════════════════════════════════════

    _evaluateInvitations(alliance, members) {
        const memberLimit = alliance.memberLimit || 6;
        if (members.length >= memberLimit) return null;
        if (!this.personality.traits || this.personality.traits.expansionist < 0.4) return null;

        const slots = memberLimit - members.length;
        const willProceed = this._willProceed(0.35, 0);

        return {
            type: 'invitations',
            action: 'send_invitations',
            slots,
            category: 'diplo',
            rationale: `AI ${this.personality.name} sending ${slots} invitation(s) to recruit members`,
            timestamp: Date.now(),
            willProceed
        };
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // ROLE ASSIGNMENT EVALUATION (AI assigns roles autonomously)
    // ══════════════════════════════════════════════════════════════════════════════

    _evaluateRoleAssignment(alliance, members) {
        if (!alliance || !alliance.government || !alliance.government.roles) return null;

        // In Hive Mind, ALL human members are Servants - no leadership roles
        if (alliance.governmentType !== 'hiveMind') return null;

        const servantRole = alliance.government.roles.get('servant');
        if (!servantRole) return null;

        // Find members not already assigned 'servant'
        const nonServants = [];
        for (const [nationId, memberData] of this._membersEntries(alliance)) {
            // Map: memberData is { role: '...' }, plain object: memberData is role string
            const role = typeof memberData === 'string' ? memberData : memberData?.role;
            if (role !== 'servant') {
                nonServants.push(nationId);
            }
        }

        if (nonServants.length === 0) return null;

        // Assign all non-servant members to servant role
        const actions = [];
        for (const nationId of nonServants) {
            actions.push({
                type: 'roles',
                action: 'assign_role',
                nationId,
                roleId: 'servant',
                category: 'econ',
                rationale: `AI ${this.personality.name} assigning Servant role to ${nationId}`,
                timestamp: Date.now(),
                willProceed: true
            });
        }

        return actions.length > 0 ? actions : null;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // EXECUTION (called by AllianceSystem.executeHiveMindDecisions)
    // ══════════════════════════════════════════════════════════════════════════════

    async executeTreatyProposal(action) {
        try {
            if (action.action === 'consider_acceptance') {
                if (!window.DiplomacySystem) return { success: false, reason: 'DiplomacySystem not available' };
                if (!action.proposalId) return { success: false, reason: 'No proposal ID for acceptance' };

                // Verify the proposal targets this alliance before accepting
                const proposal = DiplomacySystem.treatyProposals?.get(action.proposalId);
                if (!proposal) return { success: false, reason: 'Proposal not found' };
                if (proposal.targetId !== this.allianceId) return { success: false, reason: 'Proposal does not target this alliance' };
                if (proposal.status !== 'pending') return { success: false, reason: 'Proposal no longer pending' };
                if (Date.now() > proposal.expiresAt) return { success: false, reason: 'Proposal has expired' };

                DiplomacySystem.acceptTreaty(action.proposalId);
                this.evolvePersonality('diplo', true);
                return { success: true, action: 'accepted', proposalId: action.proposalId };
            }

            if (!window.DiplomacySystem) return { success: false, reason: 'DiplomacySystem not available' };
            const targetAlliance = this._pickRandomOtherAlliance(this._safeAlliance());
            if (!targetAlliance) return { success: false, reason: 'No target alliance available' };

            DiplomacySystem.proposeAllianceTreaty({
                proposerAllianceId: this.allianceId,
                targetAllianceId: targetAlliance.id,
                treatyType: action.treatyType,
                terms: {},
                duration: 30
            });
            this.evolvePersonality('diplo', true);
            return { success: true, targetAllianceId: targetAlliance.id, treatyType: action.treatyType };
        } catch (e) {
            this.evolvePersonality('diplo', false);
            return { success: false, reason: e.message };
        }
    }

    async executeWarDeclaration(action) {
        try {
            if (!window.WarSystem) return { success: false, reason: 'WarSystem not available' };
            const alliance = this._safeAlliance();
            if (!alliance) return { success: false, reason: 'Alliance not available' };

            const attackerMembers = this._membersKeys(alliance);
            if (attackerMembers.length === 0) return { success: false, reason: 'No alliance members to attack from' };

            const attackerId = attackerMembers[Math.floor(Math.random() * attackerMembers.length)];
            const target = this._pickRandomOutsideNation(alliance);
            if (!target) return { success: false, reason: 'No target nation available' };

            WarSystem.declareWar({
                attackerNationId: attackerId,
                defenderNationId: target.id,
                warType: 'alliance',
                casusBelliId: 'general_dispute',
                reason: `Hive Mind ${this.personality.name} directive`
            });
            this.evolvePersonality('mil', true);
            return { success: true, attackerNationId: attackerId, defenderNationId: target.id };
        } catch (e) {
            this.evolvePersonality('mil', false);
            return { success: false, reason: e.message };
        }
    }

    executeMembershipKick(action) {
        try {
            const alliance = this._safeAlliance();
            if (!alliance) return { success: false, reason: 'Alliance not available' };
            if (!action.targetNationId || !this._membersHas(alliance, action.targetNationId)) {
                return { success: false, reason: 'Target not a member' };
            }

            const nation = this._getNation(action.targetNationId);
            if (nation) nation.allianceId = null;
            this._membersDelete(alliance, action.targetNationId);
            alliance.memberHistory.push({
                action: 'hive_mind_kick',
                nationId: action.targetNationId,
                aiName: this.personality.name,
                date: Date.now()
            });
            this.evolvePersonality('econ', true);
            return { success: true, nationId: action.targetNationId };
        } catch (e) {
            this.evolvePersonality('econ', false);
            return { success: false, reason: e.message };
        }
    }

    executeTreasuryAction(action) {
        try {
            const alliance = this._safeAlliance();
            if (!alliance) return { success: false, reason: 'Alliance not available' };

            if (action.action === 'withdraw') {
                const amount = Math.min(action.amount || 0, alliance.treasury || 0);
                if (amount <= 0) return { success: false, reason: 'Insufficient treasury' };
                alliance.treasury -= amount;
                const members = this._membersKeys(alliance);
                const perMember = Math.floor(amount / Math.max(1, members.length));
                for (const nationId of members) {
                    const nation = this._getNation(nationId);
                    if (nation) nation.money = (nation.money || 0) + perMember;
                }
            } else if (action.action === 'deposit') {
                const amount = action.amount || 5000000;
                alliance.treasury = (alliance.treasury || 0) + amount;
            } else {
                return { success: false, reason: 'Unknown treasury action' };
            }
            this.evolvePersonality('econ', true);
            return { success: true, action: action.action, amount: action.amount };
        } catch (e) {
            this.evolvePersonality('econ', false);
            return { success: false, reason: e.message };
        }
    }

    executeSettingsAction(action) {
        try {
            const alliance = this._safeAlliance();
            if (!alliance) return { success: false, reason: 'Alliance not available' };

            if (action.action === 'toggle_open') {
                alliance.open = action.open !== false;
            } else if (action.action === 'update_description') {
                alliance.description = action.description || `Managed by ${this.personality.name}`;
            } else {
                return { success: false, reason: 'Unknown settings action' };
            }
            this.evolvePersonality('diplo', true);
            return { success: true, action: action.action };
        } catch (e) {
            this.evolvePersonality('diplo', false);
            return { success: false, reason: e.message };
        }
    }

    async executeSkillsAction(action) {
        try {
            const alliance = this._safeAlliance();
            if (!alliance || !window.AllianceSystem) return { success: false, reason: 'Alliance or AllianceSystem not available' };

            const success = alliance.upgradeSkill(action.skillKey, action.levels);
            if (!success) return { success: false, reason: 'Failed to upgrade skill (insufficient points or max level)' };

            this.evolvePersonality(action.category, true);
            return { success: true, skillKey: action.skillKey, levels: action.levels, cost: action.cost };
        } catch (e) {
            this.evolvePersonality(action.category, false);
            return { success: false, reason: e.message };
        }
    }

    executeInvitationsAction(action) {
        // Invitations are handled server-side; the AI flags intent here.
        // The server can check for pending AI invitation actions.
        try {
            const alliance = this._safeAlliance();
            if (!alliance) return { success: false, reason: 'Alliance not available' };
            alliance._aiInvitationSlots = action.slots;
            alliance._aiInvitationAI = this.personality.name;
            return { success: true, slots: action.slots };
        } catch (e) {
            return { success: false, reason: e.message };
        }
    }

    executeRoleAssignment(action) {
        try {
            const alliance = this._safeAlliance();
            if (!alliance) return { success: false, reason: 'Alliance not available' };
            if (!action.nationId || !action.roleId) return { success: false, reason: 'Missing nationId or roleId' };

            // Check if member exists (works for both Map and plain object)
            if (!this._membersHas(alliance, action.nationId)) return { success: false, reason: 'Target not a member' };

            const roleData = alliance.government?.roles?.get(action.roleId);
            if (!roleData) return { success: false, reason: 'Role not found' };

            // Assign role (works for both Alliance entity and plain object)
            if (typeof alliance.assignRole === 'function') {
                const success = alliance.assignRole(action.nationId, action.roleId);
                if (!success) return { success: false, reason: 'Failed to assign role' };
            } else {
                alliance.members[action.nationId] = action.roleId;
            }

            this.evolvePersonality(action.category, true);
            return { success: true, nationId: action.nationId, roleId: action.roleId };
        } catch (e) {
            this.evolvePersonality(action.category, false);
            return { success: false, reason: e.message };
        }
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // STATUS / SERIALIZATION
    // ══════════════════════════════════════════════════════════════════════════════

    getStatus() {
        return {
            allianceId: this.allianceId,
            name: this.name,
            personality: this.personality,
            favoredStat: this.memory.favoredStat,
            isActive: this.isActive,
            createdAt: this.createdAt,
            totalDecisions: this.decisionHistory.length,
            recentDecisions: this.decisionHistory.slice(-10),
            lastAllianceStats: this.memory.lastAllianceStats
        };
    }

    serialize() {
        return {
            allianceId: this.allianceId,
            name: this.name,
            personality: this.personality,
            memory: this.memory,
            decisionHistory: this.decisionHistory,
            isActive: this.isActive,
            createdAt: this.createdAt
        };
    }

    static deserialize(data, alliance) {
        if (!data) return null;
        if (!alliance || !alliance.id) throw new Error('HiveMindAI.deserialize requires a valid alliance');

        const ai = new HiveMindAI(alliance, data.name || null, data.personality || null);
        // Merge saved memory with defaults so new keys aren't lost
        if (data.memory) {
            const defaultKeys = {
                lastTreatyCheck: 0,
                lastWarCheck: 0,
                lastMemberReview: 0,
                lastTreasuryCheck: 0,
                lastSettingsCheck: 0,
                lastSkillsCheck: 0,
                lastApplicationCheck: 0,
                lastInvitationCheck: 0,
                lastRoleCheck: 0,
                favoredStat: 'econ',
                lastAllianceStats: null
            };
            ai.memory = { ...defaultKeys, ...data.memory };
        }
        if (data.decisionHistory) ai.decisionHistory = data.decisionHistory;
        if (typeof data.isActive === 'boolean') ai.isActive = data.isActive;
        if (data.createdAt) ai.createdAt = data.createdAt;
        return ai;
    }
}

window.HiveMindAI = HiveMindAI;

// Expose catalog and helpers for UI / admin use
window.HiveMindNameParts = {
  prefixes: HIVE_MIND_NAME_PREFIXES,
  middles: HIVE_MIND_NAME_MIDDLES,
  suffixes: HIVE_MIND_NAME_SUFFIXES
};
window.generateRandomAIName = generateRandomAIName;
window.generateRandomPersonality = generateRandomPersonality;
window.normalizeWeights = normalizeWeights;
