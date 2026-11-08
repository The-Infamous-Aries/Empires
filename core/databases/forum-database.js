/**
 * Forum Database - Handles articles, comments, motions, votes, tips, reports, and notifications
 * Source of truth: systems/Chat/forum-system.js (posts, comments, reactions, tips, reports)
 * Source of truth: systems/World/world-forum-system.js (motions, elections, color votes)
 * Persisted to: saves/db/forum.json
 *
 * NOTE: World Forum motions serialize Map fields (votes.faction, votes.world, factionResults)
 * as Object.fromEntries(...). This database stores them as plain objects for queryability,
 * converting on write/read.
 */

const { BaseDatabase } = require('./base-database');

// ─── Map conversion helpers (for World Forum motions) ──────────────────────

function mapToObj(map) {
    if (!map || !(map instanceof Map)) return map;
    const obj = {};
    for (const [k, v] of map) obj[k] = v;
    return obj;
}

function objToMap(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    return new Map(Object.entries(obj));
}

function serializeSerializedMapFields(data) {
    // World Forum motions serialize Map fields as plain objects via Object.fromEntries.
    // Convert back to Maps for storage consistency if needed, or keep as objects.
    if (!data) return data;

    // Motion votes.faction (Map -> object already, keep as object for storage)
    // Motion votes.world (Map -> object already, keep as object for storage)
    // Motion factionResults (Map -> object already, keep as object for storage)

    return data;
}

function deserializeMapFields(data) {
    // Convert plain objects back to Maps for in-memory World Forum use.
    if (!data) return data;

    if (data.votes) {
        if (data.votes.faction && !Map.prototype.isPrototypeOf(data.votes.faction)) {
            data.votes.faction = objToMap(data.votes.faction);
        }
        if (data.votes.world && !Map.prototype.isPrototypeOf(data.votes.world)) {
            data.votes.world = objToMap(data.votes.world);
        }
    }

    if (data.factionResults && !Map.prototype.isPrototypeOf(data.factionResults)) {
        data.factionResults = objToMap(data.factionResults);
    }

    if (data.individualVotes && !Map.prototype.isPrototypeOf(data.individualVotes)) {
        data.individualVotes = objToMap(data.individualVotes);
    }

    return data;
}

class ForumDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            id: { type: 'string', required: true, indexed: true },
            type: { type: 'string', required: true, indexed: true }, // 'article', 'comment', 'motion', 'vote', 'tip', 'report', 'notification'
            authorId: { type: 'string', required: true, indexed: true },
            title: { type: 'string' },
            content: { type: 'string' },
            body: { type: 'string' }, // alias for content compatibility
            category: { type: 'string', indexed: true },
            createdAt: { type: 'number', indexed: true },
            updatedAt: { type: 'number' },
            editedAt: { type: 'number' },
            parentId: { type: 'string', indexed: true }, // postId for comments, parent comment id for replies
            parentCommentId: { type: 'string', indexed: true },
            media: { type: 'array', default: [] },
            tags: { type: 'array', default: [] },
            views: { type: 'number', default: 0 },
            commentCount: { type: 'number', default: 0 },
            reactions: { type: 'object', default: {} },
            isPinned: { type: 'boolean', default: false, indexed: true },
            isLocked: { type: 'boolean', default: false, indexed: true },
            isHidden: { type: 'boolean', default: false, indexed: true },
            replies: { type: 'array', default: [] },
            motionType: { type: 'string', indexed: true },
            status: { type: 'string', indexed: true },
            opensAt: { type: 'number' },
            endsAt: { type: 'number' },
            votes: { type: 'object', default: {} },
            targetId: { type: 'string', indexed: true }, // for tips, reports
            targetType: { type: 'string', indexed: true }, // 'post' or 'comment'
            amount: { type: 'number' }, // for tips
            message: { type: 'string' }, // for tips, reports
            reason: { type: 'string', indexed: true }, // for reports
            status: { type: 'string', indexed: true }, // for reports
            reviewedBy: { type: 'string' }, // for reports
            reviewedAt: { type: 'number' }, // for reports
            moderatorAction: { type: 'string' }, // for reports
            actorId: { type: 'string', indexed: true }, // for notifications
            target: { type: 'string' }, // for notifications
            targetType: { type: 'string' }, // for notifications (alias)
            isRead: { type: 'boolean', default: false }, // for notifications
            scope: { type: 'string' }, // for motions
            minSupport: { type: 'number' }, // for motions
            targets: { type: 'array', default: [] }, // for motions
            parameters: { type: 'object', default: {} }, // for motions
            factionResults: { type: 'object', default: {} }, // for motions
            finalResult: { type: 'string' }, // for motions
            proposerFaction: { type: 'string', indexed: true }, // for motions
            factionVotingEnd: { type: 'number' }, // for motions
            worldVotingEnd: { type: 'number' }, // for motions
            implementedDate: { type: 'number' }, // for motions
            version: { type: 'number', default: 1 }
        };

        super('forum', schema);
    }

    // ─── Insert/Update overrides (ensure Map fields are stored correctly) ─

    async insert(id, record) {
        const converted = serializeSerializedMapFields({ ...record });
        return super.insert(id, converted);
    }

    async update(id, updates) {
        const converted = serializeSerializedMapFields({ ...updates });
        return super.update(id, converted);
    }

    // ─── Create Post (matches ForumSystem.createPost format) ──────────────

    async createPost(postData) {
        const id = postData.id || this.generateForumId();
        const now = Date.now();

        const post = {
            id,
            type: 'article',
            authorId: postData.authorId,
            title: postData.title || '',
            content: postData.content || postData.body || '',
            body: postData.body || postData.content || '',
            category: postData.category || 'general',
            media: postData.media || [],
            tags: postData.tags || [],
            createdAt: now,
            updatedAt: now,
            editedAt: null,
            views: 0,
            commentCount: 0,
            reactions: {},
            isPinned: postData.isPinned || false,
            isLocked: postData.isLocked || false,
            isHidden: postData.isHidden || false,
            version: 1
        };

        return await this.insert(id, post);
    }

    // ─── Create Comment (matches ForumSystem.createComment format) ───────

    async createComment(commentData) {
        const id = commentData.id || this.generateForumId();
        const now = Date.now();

        const comment = {
            id,
            type: 'comment',
            authorId: commentData.authorId,
            parentId: commentData.postId, // link to parent post
            parentCommentId: commentData.parentCommentId || null,
            content: commentData.content || '',
            body: commentData.content || '',
            media: commentData.media || [],
            createdAt: now,
            updatedAt: now,
            editedAt: null,
            reactions: {},
            replies: [],
            isHidden: commentData.isHidden || false,
            version: 1
        };

        return await this.insert(id, comment);
    }

    // ─── Create Motion (matches WorldForumSystem.proposeMotion format) ───

    async createMotion(motionData) {
        const id = motionData.id || this.generateForumId();
        const now = Date.now();

        const motion = {
            id,
            type: 'motion',
            authorId: motionData.proposer || motionData.authorId,
            title: motionData.title || '',
            content: motionData.description || motionData.body || '',
            body: motionData.description || motionData.title || '',
            category: motionData.scope || 'world',
            createdAt: motionData.createdDate || now,
            updatedAt: null,
            editedAt: null,
            reactions: {},
            motionType: motionData.type,
            status: motionData.status || 'faction_voting',
            opensAt: motionData.createdDate || now,
            endsAt: motionData.factionVotingEnd || null,
            votes: motionData.votes ? serializeSerializedMapFields({ ...motionData.votes }) : {},
            scope: motionData.scope || 'world',
            minSupport: motionData.minSupport || 0,
            targets: motionData.targets || [],
            parameters: motionData.parameters || {},
            factionResults: motionData.factionResults ? serializeSerializedMapFields({ ...motionData.factionResults }) : {},
            finalResult: motionData.finalResult || null,
            proposerFaction: motionData.proposerFaction || null,
            factionVotingEnd: motionData.factionVotingEnd || null,
            worldVotingEnd: motionData.worldVotingEnd || null,
            implementedDate: motionData.implementedDate || null,
            version: 1
        };

        return await this.insert(id, motion);
    }

    // ─── Create Tip (matches ForumSystem.sendTip format) ─────────────────

    async createTip(tipData) {
        const id = tipData.id || this.generateForumId();
        const now = Date.now();

        const tip = {
            id,
            type: 'tip',
            authorId: tipData.fromUserId,
            title: `Tip: $${tipData.amount}`,
            content: tipData.message || '',
            body: tipData.message || '',
            category: 'general',
            createdAt: now,
            targetId: tipData.targetId || null,
            targetType: tipData.targetType || null,
            amount: tipData.amount || 0,
            message: tipData.message || '',
            reactions: {},
            version: 1
        };

        return await this.insert(id, tip);
    }

    // ─── Create Report (matches ForumSystem.reportContent format) ────────

    async createReport(reportData) {
        const id = reportData.id || this.generateForumId();
        const now = Date.now();

        const report = {
            id,
            type: 'report',
            authorId: reportData.reporterId,
            title: `Report: ${reportData.reason}`,
            content: reportData.description || '',
            body: reportData.description || '',
            category: 'moderation',
            createdAt: now,
            targetId: reportData.targetId,
            targetType: reportData.targetType,
            reason: reportData.reason,
            message: reportData.description || '',
            status: 'pending',
            reviewedBy: null,
            reviewedAt: null,
            moderatorAction: null,
            reactions: {},
            version: 1
        };

        return await this.insert(id, report);
    }

    // ─── Create Notification (matches ForumSystem._notify format) ───────

    async createNotification(notifData) {
        const id = notifData.id || this.generateForumId();
        const now = Date.now();

        const notification = {
            id,
            type: 'notification',
            authorId: notifData.actorId || notifData.userId,
            title: `Notification: ${notifData.type}`,
            content: notifData.message || '',
            body: notifData.message || '',
            category: 'notification',
            createdAt: now,
            actorId: notifData.actorId,
            target: notifData.targetId || null,
            targetType: notifData.targetType || null,
            isRead: false,
            reactions: {},
            version: 1
        };

        return await this.insert(id, notification);
    }

    // ─── Comment management ─────────────────────────────────────────────

    async addCommentToPost(postId, commentData) {
        const comment = await this.createComment({
            ...commentData,
            postId
        });

        // Increment comment count on parent post
        const post = this.findById(postId, ['admin']);
        if (post) {
            await this.update(postId, {
                commentCount: (post.commentCount || 0) + 1,
                updatedAt: Date.now()
            });
        }

        return comment;
    }

    async addReplyToComment(commentId, replyData) {
        const comment = this.findById(commentId, ['admin']);
        if (!comment) throw new Error('Comment not found');

        const reply = await this.createComment({
            ...replyData,
            parentCommentId: commentId
        });

        const replies = [...(comment.replies || []), reply.id];
        return await this.update(commentId, { replies });
    }

    // ─── Reaction management ────────────────────────────────────────────

    async addReaction(targetId, userId, reactionType, rating) {
        const target = this.findById(targetId, ['admin']);
        if (!target) throw new Error('Target not found');

        const reactions = { ...target.reactions };

        if (!reactions[userId]) {
            reactions[userId] = { sentiment: null, reaction: null };
        }

        // Determine group based on reaction type
        const sentimentTypes = ['like', 'dislike'];
        const reactionTypes = ['lol', 'wtf'];
        const group = sentimentTypes.includes(reactionType) ? 'sentiment' : 'reaction';

        reactions[userId][group] = { type: reactionType, rating };

        return await this.update(targetId, { reactions });
    }

    async removeReaction(targetId, userId) {
        const target = this.findById(targetId, ['admin']);
        if (!target || !target.reactions || !target.reactions[userId]) return false;

        const reactions = { ...target.reactions };
        reactions[userId].sentiment = null;
        reactions[userId].reaction = null;

        if (reactions[userId].sentiment === null && reactions[userId].reaction === null) {
            delete reactions[userId];
        }

        return await this.update(targetId, { reactions });
    }

    // ─── Vote management (for motions) ──────────────────────────────────

    async castVote(motionId, voterId, vote, justification = '') {
        const motion = this.findById(motionId, ['admin']);
        if (!motion) throw new Error('Motion not found');

        const votes = { ...motion.votes };

        // Store individual vote
        if (!votes.individualVotes) votes.individualVotes = {};
        votes.individualVotes[voterId] = { vote, justification, timestamp: Date.now() };

        // Tally faction vote
        const factionKey = motion.proposerFaction || 'world';
        if (!votes[factionKey]) votes[factionKey] = { for: 0, against: 0, abstain: 0 };
        votes[factionKey][vote] = (votes[factionKey][vote] || 0) + 1;

        return await this.update(motionId, { votes });
    }

    async updateMotionStatus(motionId, status) {
        return await this.update(motionId, { status });
    }

    async completeMotion(motionId, finalResult) {
        const motion = this.findById(motionId, ['admin']);
        if (!motion) throw new Error('Motion not found');

        return await this.update(motionId, {
            status: 'completed',
            finalResult: finalResult || motion.status,
            implementedDate: Date.now()
        });
    }

    // ─── Report management ──────────────────────────────────────────────

    async reviewReport(reportId, moderatorId, status, moderatorAction = null) {
        return await this.update(reportId, {
            status,
            reviewedBy: moderatorId,
            reviewedAt: Date.now(),
            moderatorAction
        });
    }

    // ─── Notification management ────────────────────────────────────────

    async markNotificationRead(notificationId) {
        return await this.update(notificationId, { isRead: true });
    }

    async markAllNotificationsRead(userId) {
        const notifications = await this.query([], { authorId: userId, type: 'notification' }, ['admin']);
        for (const notif of notifications) {
            if (!notif.isRead) {
                await this.update(notif.id, { isRead: true });
            }
        }
        return notifications.length;
    }

    // ─── Moderation (hide/lock/pin posts) ───────────────────────────────

    async hidePost(postId, hidden = true) {
        return await this.update(postId, { isHidden: hidden, updatedAt: Date.now() });
    }

    async lockPost(postId, locked = true) {
        return await this.update(postId, { isLocked: locked, updatedAt: Date.now() });
    }

    async pinPost(postId, pinned = true) {
        return await this.update(postId, { isPinned: pinned, updatedAt: Date.now() });
    }

    // ─── Query helpers ──────────────────────────────────────────────────

    async findByAuthor(authorId, permissions = ['public']) {
        return this.findByIndex('authorId', authorId, permissions);
    }

    async findByCategory(category, permissions = ['public']) {
        return this.findByIndex('category', category, permissions);
    }

    async findByType(type, permissions = ['public']) {
        return this.findByIndex('type', type, permissions);
    }

    async findByStatus(status, permissions = ['public']) {
        return this.findByIndex('status', status, permissions);
    }

    async findByMotionType(motionType, permissions = ['public']) {
        return this.findByIndex('motionType', motionType, permissions);
    }

    async findCommentsByPost(postId, permissions = ['public']) {
        return this.query([], { type: 'comment', parentId: postId, isHidden: false }, permissions);
    }

    async getActiveMotions(permissions = ['public']) {
        const motions = await this.query([], { type: 'motion', status: 'faction_voting' }, permissions);
        const now = Date.now();
        return motions.filter(m => (!m.endsAt || m.endsAt > now));
    }

    async getArticlesByCategory(category, permissions = ['public'], limit = 50) {
        const articles = await this.findByCategory(category, permissions);
        return articles
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, limit);
    }

    async getPendingReports(permissions = ['admin']) {
        return this.query([], { type: 'report', status: 'pending' }, permissions);
    }

    async getUnreadNotifications(userId, permissions = ['public']) {
        return this.query([], { authorId: userId, type: 'notification', isRead: false }, permissions);
    }

    // ─── Permission filtering (hidden posts only visible to moderators/admin) ─

    hasPermissionToView(record, permissions) {
        if (permissions.includes('admin')) return true;
        if (permissions.includes('game_data')) return true;
        if (permissions.includes('public')) {
            // Hidden content is not publicly viewable
            if (record.isHidden === true) return false;
            // Reports are moderator-only
            if (record.type === 'report') return false;
            // Notifications are user-specific
            if (record.type === 'notification') return false;
            // Tips are between sender/recipient only
            if (record.type === 'tip') return false;
            return true;
        }
        return false;
    }

    // ─── ID Generation ───────────────────────────────────────────────────

    generateForumId() {
        return 'forum_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ForumDatabase, mapToObj, objToMap, serializeSerializedMapFields, deserializeMapFields };
}

