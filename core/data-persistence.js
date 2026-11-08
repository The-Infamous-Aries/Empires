/**
 * Data Persistence Layer for Empire Wars
 * Wires all entity systems to the file-based domain databases.
 *
 * Guarantees:
 *   • Every entity mutation is written to disk immediately (write-through).
 *   • On restart, all data loads from saves/db/<domain>.json — nothing is lost.
 *   • Works in both Node.js (server) and browser (localStorage fallback) contexts.
 */

const { DatabaseManager_Instance: db } = require('./database-manager');
const { deserializeMapFields: deserializeForumMapFields } = require('./databases/forum-database');

// ─── Entity Save Wrappers ───────────────────────────────────────────────

/**
 * Save a nation to the nations database
 */
async function saveNation(nation) {
    const serialized = nation.serialize ? nation.serialize() : nation;
    const id = nation.id || serialized.id;
    if (!id) throw new Error('Nation has no id');
    const record = { id, playerId: nation.playerId || serialized.playerId, ...serialized };
    return await db.saveEntity('nations', record, 'id');
}

/**
 * Save a player to the players database
 */
async function savePlayer(player) {
    const serialized = player.serialize ? player.serialize() : player;
    const id = player.playerId || serialized.playerId;
    if (!id) throw new Error('Player has no playerId');
    const record = { id, playerId: id, ...serialized };
    return await db.saveEntity('players', record, 'playerId');
}

/**
 * Save an alliance to the alliances database
 */
async function saveAlliance(alliance) {
    return await db.saveEntity('alliances', alliance, 'id');
}

/**
 * Save a war to the wars database
 */
async function saveWar(war) {
    return await db.saveEntity('wars', war, 'id');
}

/**
 * Save a treaty to the treaties database
 */
async function saveTreaty(treaty) {
    return await db.saveEntity('treaties', treaty, 'id');
}

/**
 * Save global state to the global database
 */
async function saveGlobal(globalState) {
    const id = globalState.id || 'global_state';
    const record = { id, ...globalState };
    return await db.saveEntity('global', record, 'id');
}

/**
 * Save a sports team to the sports database
 */
async function saveTeam(team) {
    return await db.saveEntity('sports', team, 'id');
}

/**
 * Save an account to the accounts database
 */
async function saveAccount(account) {
    return await db.saveEntity('accounts', account, 'id');
}

/**
 * Save a session to the sessions database
 */
async function saveSession(session) {
    return await db.saveEntity('sessions', session, 'id');
}

/**
 * Save a message to the messages database
 */
async function saveMessage(message) {
    return await db.saveEntity('messages', message, 'id');
}

/**
 * Save a forum item to the forum database
 */
async function saveForumItem(item) {
    return await db.saveEntity('forum', item, 'id');
}

/**
 * Save world bank state to the worldbank database
 */
async function saveWorldBank(bank) {
    return await db.saveEntity('worldbank', bank, 'id');
}

/**
 * Save an aid transfer to the aid database
 */
async function saveAid(aid) {
    return await db.saveEntity('aid', aid, 'id');
}

/**
 * Save an analytics event to the analytics database
 */
async function saveAnalyticsEvent(event) {
    return await db.saveEntity('analytics', event, 'id');
}

/**
 * Save an award to the awards database
 */
async function saveAward(award) {
    return await db.saveEntity('awards', award, 'id');
}

// ─── Entity Load Wrappers ───────────────────────────────────────────────

async function loadNation(id, permissions = ['admin']) {
    return await db.loadEntity('nations', id, permissions);
}

async function loadPlayer(id, permissions = ['admin']) {
    return await db.loadEntity('players', id, permissions);
}

async function loadAlliance(id, permissions = ['admin']) {
    const data = await db.loadEntity('alliances', id, permissions);
    if (data) {
        return deserializeMapFields(data);
    }
    return data;
}

async function loadWar(id, permissions = ['admin']) {
    return await db.loadEntity('wars', id, permissions);
}

async function loadTreaty(id, permissions = ['admin']) {
    return await db.loadEntity('treaties', id, permissions);
}

async function loadGlobal(id = 'global_state', permissions = ['admin']) {
    return await db.loadEntity('global', id, permissions);
}

async function loadTeam(id, permissions = ['admin']) {
    return await db.loadEntity('sports', id, permissions);
}

async function loadWorldBank(id = 'world_bank', permissions = ['admin']) {
    return await db.loadEntity('worldbank', id, permissions);
}

async function loadMessage(id, permissions = ['admin']) {
    return await db.loadEntity('messages', id, permissions);
}

async function loadForumItem(id, permissions = ['admin']) {
    const data = await db.loadEntity('forum', id, permissions);
    if (data) {
        return deserializeForumMapFields(data);
    }
    return data;
}

async function loadAccount(id, permissions = ['admin']) {
    return await db.loadEntity('accounts', id, permissions);
}

async function loadSession(id, permissions = ['admin']) {
    return await db.loadEntity('sessions', id, permissions);
}

async function loadAid(id, permissions = ['admin']) {
    return await db.loadEntity('aid', id, permissions);
}

async function loadAward(id, permissions = ['admin']) {
    return await db.loadEntity('awards', id, permissions);
}

// ─── Bulk Operations ────────────────────────────────────────────────────

/**
 * Load all databases from disk (called on server/game startup)
 */
async function loadAll() {
    return await db.loadAll();
}

/**
 * Save all databases to disk (called on shutdown)
 */
async function saveAll() {
    return await db.saveAll();
}

/**
 * Get database status for monitoring
 */
function getStatus() {
    return db.getDatabasesStatus();
}

/**
 * Subscribe to changes on a domain database
 */
function subscribe(domain, callback) {
    return db.subscribe(domain, callback);
}

// ─── Auto-Save Event Wiring ─────────────────────────────────────────────

let autosaveWired = false;

/**
 * Wire entity systems to auto-save on change.
 * Call this once after all systems are initialized.
 */
function wireAutoSave() {
    if (autosaveWired) return;
    autosaveWired = true;

    const EventBus = require('./event-system').EventBus;

    // Nation changes → save to nations DB
    EventBus.on('nation_updated', (data) => {
        if (data.nation) saveNation(data.nation).catch(err =>
            console.error('Auto-save nation failed:', err.message)
        );
    });

    // Nation created → save to nations DB (Nation.js emits NATION_CREATED)
    EventBus.on('nation_created', (data) => {
        if (data.nation) saveNation(data.nation).catch(err =>
            console.error('Auto-save new nation failed:', err.message)
        );
    });

    // Nation loaded → save to nations DB (Nation.js emits NATION_LOADED)
    EventBus.on('nation_loaded', (data) => {
        if (data.nation) saveNation(data.nation).catch(err =>
            console.error('Auto-save loaded nation failed:', err.message)
        );
    });

    // Player changes → save to players DB
    EventBus.on('player_updated', (data) => {
        if (data.player) savePlayer(data.player).catch(err =>
            console.error('Auto-save player failed:', err.message)
        );
    });

    // Player initialized → save to players DB (Player.js emits player_initialized)
    EventBus.on('player_initialized', (data) => {
        if (data.player) savePlayer(data.player).catch(err =>
            console.error('Auto-save new player failed:', err.message)
        );
    });

    // Player loaded → save to players DB (Player.js emits player_loaded)
    EventBus.on('player_loaded', (data) => {
        if (data.player) savePlayer(data.player).catch(err =>
            console.error('Auto-save loaded player failed:', err.message)
        );
    });

    // Alliance changes → save to alliances DB
    EventBus.on('alliance_updated', (data) => {
        if (data.alliance) saveAlliance(data.alliance).catch(err =>
            console.error('Auto-save alliance failed:', err.message)
        );
    });

    // Alliance created → save to alliances DB (War AllianceSystem emits this)
    EventBus.on('alliance_created', (data) => {
        if (data.alliance) saveAlliance(data.alliance).catch(err =>
            console.error('Auto-save new alliance failed:', err.message)
        );
    });

    // War changes → save to wars DB
    EventBus.on('war_updated', (data) => {
        if (data.war) saveWar(data.war).catch(err =>
            console.error('Auto-save war failed:', err.message)
        );
    });

    // War created → save to wars DB
    EventBus.on('war_created', (data) => {
        if (data.war) saveWar(data.war).catch(err =>
            console.error('Auto-save new war failed:', err.message)
        );
    });

    // War loaded → save to wars DB
    EventBus.on('war_loaded', (data) => {
        if (data.war) saveWar(data.war).catch(err =>
            console.error('Auto-save loaded war failed:', err.message)
        );
    });

    // Treaty changes → save to treaties DB
    EventBus.on('treaty_updated', (data) => {
        if (data.treaty) saveTreaty(data.treaty).catch(err =>
            console.error('Auto-save treaty failed:', err.message)
        );
    });

    // Treaty created → save to treaties DB
    EventBus.on('treaty_created', (data) => {
        if (data.treaty) saveTreaty(data.treaty).catch(err =>
            console.error('Auto-save new treaty failed:', err.message)
        );
    });

    // Global state changes → save to global DB
    EventBus.on('global_updated', (data) => {
        if (data.global) saveGlobal(data.global).catch(err =>
            console.error('Auto-save global failed:', err.message)
        );
    });

    // Team changes → save to sports DB
    EventBus.on('team_updated', (data) => {
        if (data.team) saveTeam(data.team).catch(err =>
            console.error('Auto-save team failed:', err.message)
        );
    });

    // Team created → save to sports DB
    EventBus.on('team_created', (data) => {
        if (data.team) saveTeam(data.team).catch(err =>
            console.error('Auto-save new team failed:', err.message)
        );
    });

    // Team loaded → save to sports DB
    EventBus.on('team_loaded', (data) => {
        if (data.team) saveTeam(data.team).catch(err =>
            console.error('Auto-save loaded team failed:', err.message)
        );
    });

    // Message sent → save to messages DB
    EventBus.on('message_sent', (data) => {
        if (data.message) saveMessage(data.message).catch(err =>
            console.error('Auto-save message failed:', err.message)
        );
    });

    // Forum post created → save to forum DB
    EventBus.on('forum_post_created', (data) => {
        if (data.post) saveForumItem(data.post).catch(err =>
            console.error('Auto-save forum post failed:', err.message)
        );
    });

    // Forum comment created → save to forum DB
    EventBus.on('forum_comment_created', (data) => {
        if (data.comment) saveForumItem(data.comment).catch(err =>
            console.error('Auto-save forum comment failed:', err.message)
        );
    });

    // Forum reaction added → update reactions on target
    EventBus.on('forum_reaction_added', (data) => {
        if (data.targetId && data.userId && data.reactionType && data.rating !== undefined) {
            const { deserializeMapFields } = require('./databases/forum-database');
            const forumDb = db.get('forum');
            if (forumDb) {
                forumDb.addReaction(data.targetId, data.userId, data.reactionType, data.rating).catch(err =>
                    console.error('Auto-save forum reaction failed:', err.message)
                );
            }
        }
    });

    // Forum tip sent → save tip to forum DB
    EventBus.on('forum_tip_sent', (data) => {
        if (data.tip) saveForumItem(data.tip).catch(err =>
            console.error('Auto-save forum tip failed:', err.message)
        );
    });

    // Forum post edited → update post in forum DB
    EventBus.on('forum_post_edited', (data) => {
        if (data.post) saveForumItem(data.post).catch(err =>
            console.error('Auto-save forum post edit failed:', err.message)
        );
    });

    // Forum post deleted → remove from forum DB
    EventBus.on('forum_post_deleted', (data) => {
        if (data.postId) {
            const forumDb = db.get('forum');
            if (forumDb) {
                forumDb.delete(data.postId).catch(err =>
                    console.error('Auto-delete forum post failed:', err.message)
                );
            }
        }
    });

    // Forum comment edited → update comment in forum DB
    EventBus.on('forum_comment_edited', (data) => {
        if (data.comment) saveForumItem(data.comment).catch(err =>
            console.error('Auto-save forum comment edit failed:', err.message)
        );
    });

    // Forum comment deleted → remove from forum DB
    EventBus.on('forum_comment_deleted', (data) => {
        if (data.commentId) {
            const forumDb = db.get('forum');
            if (forumDb) {
                forumDb.delete(data.commentId).catch(err =>
                    console.error('Auto-delete forum comment failed:', err.message)
                );
            }
        }
    });

    // Forum report created → save report to forum DB
    EventBus.on('forum_report_created', (data) => {
        if (data.report) saveForumItem(data.report).catch(err =>
            console.error('Auto-save forum report failed:', err.message)
        );
    });

    // Forum report reviewed → update report in forum DB
    EventBus.on('forum_report_reviewed', (data) => {
        if (data.report) saveForumItem(data.report).catch(err =>
            console.error('Auto-save forum report review failed:', err.message)
        );
    });

    // Award unlocked → save to awards DB (AwardSystem emits this)
    EventBus.on('award_unlocked', (data) => {
        if (!data) return;
        const awardRecord = {
            id: `award_${data.type}_${data.id}_${data.award.id}`,
            entityType: data.type,
            entityId: data.id,
            awardId: data.award.id,
            category: data.award.category || '',
            unlockedAt: data.timestamp || Date.now(),
            version: 1
        };
        db.saveEntity('awards', awardRecord, 'id').catch(err =>
            console.error('Auto-save award failed:', err.message)
        );
    });

    // World bank updated → save to worldbank DB
    EventBus.on('worldBank_updated', (data) => {
        if (data.worldBank) saveWorldBank(data.worldBank).catch(err =>
            console.error('Auto-save world bank failed:', err.message)
        );
    });

    // Aid sent → save to aid DB
    EventBus.on('aid_sent', (data) => {
        if (data.aid) saveAid(data.aid).catch(err =>
            console.error('Auto-save aid failed:', err.message)
        );
    });

    // Aid received → save to aid DB
    EventBus.on('aid_received', (data) => {
        if (data.aid) saveAid(data.aid).catch(err =>
            console.error('Auto-save aid received failed:', err.message)
        );
    });

    // Account created → save to accounts DB
    EventBus.on('account_created', (data) => {
        if (data.account) saveAccount(data.account).catch(err =>
            console.error('Auto-save account created failed:', err.message)
        );
    });

    // Account updated → save to accounts DB
    EventBus.on('account_updated', (data) => {
        if (data.account) saveAccount(data.account).catch(err =>
            console.error('Auto-save account updated failed:', err.message)
        );
    });

    // Session created → save to sessions DB
    EventBus.on('session_created', (data) => {
        if (data.session) saveSession(data.session).catch(err =>
            console.error('Auto-save session created failed:', err.message)
        );
    });

    // Session updated → save to sessions DB
    EventBus.on('session_updated', (data) => {
        if (data.session) saveSession(data.session).catch(err =>
            console.error('Auto-save session updated failed:', err.message)
        );
    });

    // Analytics event → save to analytics DB
    EventBus.on('analytics_event', (data) => {
        if (data.event) saveAnalyticsEvent(data.event).catch(err =>
            console.error('Auto-save analytics event failed:', err.message)
        );
    });

    console.log('Data Persistence: Auto-save event wiring complete');
}

// ─── Export ─────────────────────────────────────────────────────────────

module.exports = {
    db,
    saveNation, savePlayer, saveAlliance, saveWar, saveTreaty,
    saveGlobal, saveTeam, saveAccount, saveSession,
    saveMessage, saveForumItem, saveWorldBank, saveAid, saveAnalyticsEvent, saveAward,
    loadNation, loadPlayer, loadAlliance, loadWar, loadTreaty,
    loadGlobal, loadTeam, loadWorldBank, loadMessage, loadForumItem, loadAccount, loadSession,
    loadAid, loadAward,
    loadAll, saveAll, getStatus, subscribe, wireAutoSave
};

if (typeof window !== 'undefined') {
    window.DataPersistence = module.exports;
}
