/**
 * Forum System - News Board and Discussion Platform
 * Empire Builder - Nation Building Strategy Game
 *
 * Handles posts, comments, reactions, media uploads, tips, moderation,
 * reports, rate limiting, notifications, pagination, and save/load persistence.
 */

class ForumSystem {
    constructor(options = {}) {
        this.isInitialized = false;

        // Forum data storage
        this.posts = new Map();
        this.comments = new Map();
        this.tips = new Map();
        this.reports = new Map();
        this.notifications = new Map();

        // Moderation
        this.moderators = new Set();

        // Rate limiting
        this.rateLimitConfig = {
            maxPostsPerHour: 10,
            maxCommentsPerHour: 30,
            maxTipsPerHour: 20,
            maxReportsPerHour: 10,
            windowMs: 60 * 60 * 1000
        };
        this.rateLimits = new Map();

        // Reaction ranking system - 4 types, 1-6 rating scale
        // Style groups (mutually exclusive within each group):
        //   Group 1 (sentiment): like OR dislike
        //   Group 2 (reaction):  lol OR wtf
        // Users can pick one from each group simultaneously (e.g. like+lol)
        this.reactionTypes = {
            like:   { name: 'Like',   icon: 'assets/images/Forum/like-{rating}.png',   group: 'sentiment' },
            dislike:{ name: 'Dislike',icon: 'assets/images/Forum/dislike-{rating}.png',group: 'sentiment' },
            lol:    { name: 'Lol',    icon: 'assets/images/Forum/lol-{rating}.png',    group: 'reaction' },
            wtf:    { name: 'Wtf',    icon: 'assets/images/Forum/wtf-{rating}.png',    group: 'reaction' }
        };

        this.minRating = 1;
        this.maxRating = 6;

        // Post categories
        this.categories = {
            general: { name: 'General Discussion', icon: '💬', color: '#4a90e2' },
            news: { name: 'Game News', icon: '📰', color: '#27ae60' },
            strategy: { name: 'Strategy & Tips', icon: '🎯', color: '#e67e22' },
            diplomacy: { name: 'Diplomacy & Politics', icon: '🤝', color: '#9b59b6' },
            military: { name: 'Military & War', icon: '⚔️', color: '#e74c3c' },
            help: { name: 'Help & Support', icon: '❓', color: '#95a5a6' },
            showcase: { name: 'Nation Showcase', icon: '🏛️', color: '#34495e' },
            roleplay: { name: 'Role Play', icon: '🎭', color: '#e91e63' },
            alliance_announcements: { name: 'Alliance Announcements', icon: '🏰', color: '#795548' },
            nation_announcements: { name: 'Nation Announcements', icon: '📢', color: '#607d8b' },
            flex_brag: { name: 'Flex/Brag', icon: '💪', color: '#ff9800' }
        };

        // Report reasons
        this.reportReasons = {
            spam: { name: 'Spam', description: 'Repeated or irrelevant content' },
            harassment: { name: 'Harassment', description: 'Targeted abuse or hostility' },
            harmful: { name: 'Harmful Content', description: 'Content that may cause harm' },
            misinformation: { name: 'Misinformation', description: 'False or misleading claims' },
            other: { name: 'Other', description: 'Other reason' }
        };

        // Report statuses
        this.reportStatuses = {
            pending: 'pending',
            reviewed: 'reviewed',
            dismissed: 'dismissed',
            actioned: 'actioned'
        };

        // Media upload settings
        this.mediaSettings = {
            maxFileSize: 10 * 1024 * 1024,
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            maxImagesPerPost: 5,
            maxImagesPerComment: 3
        };

        this.validSortFields = [
            'createdAt', 'updatedAt', 'views', 'commentCount', 'reactions', 'title'
        ];

        this._idCounter = 0;

        // Event unsubscribe functions (stored for destroy cleanup)
        this._unsubscribes = [];

        // Bootstrap initial moderators if provided
        if (options.initialModerators) {
            for (const modId of options.initialModerators) {
                this.moderators.add(modId);
            }
        }

        this.initialize();
    }

    async initialize() {
        if (this.isInitialized) return;
        console.log('Initializing Forum System...');
        this.bindEvents();
        if (typeof window !== 'undefined') {
            window.ForumSystem = ForumSystem;
        }
        this.isInitialized = true;
        console.log('Forum System ready');
    }

    /*--------------------------------------------------------------------*
     * Event bus helpers
     *--------------------------------------------------------------------*/

    _eventBus() {
        return typeof window !== 'undefined' ? window.EventBus : null;
    }

    _emit(eventType, data) {
        const eb = this._eventBus();
        if (eb) {
            eb.emit(eventType, data);
        }
    }

    bindEvents() {
        const eb = this._eventBus();
        if (!eb) return;

        const eventHandlers = [
            ['forum_post_created', 'handlePostCreated'],
            ['forum_comment_created', 'handleCommentCreated'],
            ['forum_reaction_added', 'handleReactionAdded'],
            ['forum_tip_sent', 'handleTipSent'],
            ['forum_post_edited', 'handlePostEdited'],
            ['forum_post_deleted', 'handlePostDeleted'],
            ['forum_comment_edited', 'handleCommentEdited'],
            ['forum_comment_deleted', 'handleCommentDeleted'],
            ['forum_report_created', 'handleReportCreated'],
            ['forum_report_reviewed', 'handleReportReviewed']
        ];

        for (const [eventType, handlerName] of eventHandlers) {
            const handler = this[handlerName].bind(this);
            eb.on(eventType, handler);
            this._unsubscribes.push(() => eb.off(eventType, handler));
        }
    }

    /*--------------------------------------------------------------------*
     * Moderation
     *--------------------------------------------------------------------*/

    isModerator(userId) {
        return this.moderators.has(userId);
    }

    addModerator(userId) {
        this.moderators.add(userId);
    }

    removeModerator(userId) {
        this.moderators.delete(userId);
    }

    _requireModerator(userId) {
        if (!this.isModerator(userId)) {
            throw new Error('Moderator privileges required');
        }
    }

    /*--------------------------------------------------------------------*
     * Nation / money resolution
     *--------------------------------------------------------------------*/

    getNation(userId) {
        if (typeof window === 'undefined') return null;

        const playerId =
            window.Player?.playerId ||
            window.Nation?.playerId ||
            window.Nation?.id;

        if (userId && userId === playerId && window.Nation) {
            return window.Nation;
        }

        const economy = window.GameEngine?.systems?.economy;
        if (economy && typeof economy.getNation === 'function') {
            return economy.getNation(userId);
        }

        return null;
    }

    getNationName(userId) {
        const nation = this.getNation(userId);
        if (nation) {
            return nation.name || nation.nationName || `Nation ${userId}`;
        }
        return `Nation ${userId}`;
    }

    /*--------------------------------------------------------------------*
     * Rate limiting
     *--------------------------------------------------------------------*/

    _getRateLimit(userId) {
        if (!this.rateLimits.has(userId)) {
            this.rateLimits.set(userId, {
                posts: [],
                comments: [],
                tips: [],
                reports: []
            });
        }
        return this.rateLimits.get(userId);
    }

    _cleanWindow(timestamps, windowMs) {
        const now = Date.now();
        const cutoff = now - windowMs;
        return timestamps.filter(ts => ts > cutoff);
    }

    checkRateLimit(userId, actionType) {
        const validActions = ['posts', 'comments', 'tips', 'reports'];
        if (!validActions.includes(actionType)) {
            throw new Error('Invalid rate limit action type');
        }

        const configKey = `max${actionType.charAt(0).toUpperCase() + actionType.slice(1)}PerHour`;
        const max = this.rateLimitConfig[configKey];
        const windowMs = this.rateLimitConfig.windowMs;

        const rl = this._getRateLimit(userId);
        const cleaned = this._cleanWindow(rl[actionType], windowMs);
        rl[actionType] = cleaned;

        const remaining = Math.max(0, max - cleaned.length);
        const resetAt = cleaned.length > 0
            ? Math.max(...cleaned) + windowMs
            : Date.now() + windowMs;

        return {
            allowed: cleaned.length < max,
            remaining,
            limit: max,
            resetAt,
            windowMs
        };
    }

    recordRateLimitAction(userId, actionType) {
        const validActions = ['posts', 'comments', 'tips', 'reports'];
        if (!validActions.includes(actionType)) {
            throw new Error('Invalid rate limit action type');
        }

        const rl = this._getRateLimit(userId);
        rl[actionType].push(Date.now());
    }

    getRateLimitStatus(userId) {
        const windowMs = this.rateLimitConfig.windowMs;
        const statuses = {};

        for (const actionType of ['posts', 'comments', 'tips', 'reports']) {
            const check = this.checkRateLimit(userId, actionType);
            statuses[actionType] = {
                allowed: check.allowed,
                remaining: check.remaining,
                limit: check.limit,
                resetAt: check.resetAt
            };
        }

        return statuses;
    }

    /*--------------------------------------------------------------------*
     * Post creation
     *--------------------------------------------------------------------*/

    createPost(data) {
        const { authorId, title, content, category, media, tags } = data;

        if (!authorId) throw new Error('Author is required');
        if (!title || !content) {
            throw new Error('Title and content are required');
        }
        if (typeof title !== 'string' || title.length > 200) {
            throw new Error('Title must be 200 characters or less');
        }
        if (typeof content !== 'string' || content.length > 10000) {
            throw new Error('Content must be 10,000 characters or less');
        }

        if (category !== undefined && !this.categories[category]) {
            throw new Error(`Invalid category '${category}'`);
        }

        const rateLimit = this.checkRateLimit(authorId, 'posts');
        if (!rateLimit.allowed) {
            throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)} seconds`);
        }

        if (media && media.length > 0) {
            this.validateMedia(media, this.mediaSettings.maxImagesPerPost);
        }

        const postId = this.generateId('post');
        const now = Date.now();

        const post = {
            id: postId,
            authorId,
            title: String(title),
            content: String(content),
            category: category || 'general',
            media: media || [],
            tags: Array.isArray(tags) ? tags : [],
            createdAt: now,
            updatedAt: now,
            editedAt: null,
            views: 0,
            commentCount: 0,
            reactions: {},
            isPinned: false,
            isLocked: false,
            isHidden: false
        };

        this.posts.set(postId, post);
        this.recordRateLimitAction(authorId, 'posts');

        this._emit('forum_post_created', { post });

        return postId;
    }

    /*--------------------------------------------------------------------*
     * Comments (with nested replies)
     *--------------------------------------------------------------------*/

    createComment(data) {
        const { authorId, postId, content, parentCommentId, media } = data;

        if (!authorId || !content || !postId) {
            throw new Error('Content, author, and post are required');
        }
        if (typeof content !== 'string' || content.length > 5000) {
            throw new Error('Comment must be 5,000 characters or less');
        }

        const post = this.posts.get(postId);
        if (!post) throw new Error('Post not found');
        if (post.isLocked) throw new Error('Post is locked for commenting');

        const rateLimit = this.checkRateLimit(authorId, 'comments');
        if (!rateLimit.allowed) {
            throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)} seconds`);
        }

        if (media && media.length > 0) {
            this.validateMedia(media, this.mediaSettings.maxImagesPerComment);
        }

        const commentId = this.generateId('comment');
        const now = Date.now();

        const comment = {
            id: commentId,
            postId,
            authorId,
            content: String(content),
            media: media || [],
            parentCommentId: parentCommentId || null,
            createdAt: now,
            updatedAt: now,
            editedAt: null,
            reactions: {},
            replies: [],
            isHidden: false
        };

        this.comments.set(commentId, comment);

        post.commentCount++;
        post.updatedAt = now;

        if (parentCommentId) {
            const parentComment = this.comments.get(parentCommentId);
            if (parentComment && parentComment.postId === postId) {
                parentComment.replies.push(commentId);
            }
        }

        this.recordRateLimitAction(authorId, 'comments');

        this._emit('forum_comment_created', { comment, post });

        return commentId;
    }

    /*--------------------------------------------------------------------*
     * Reactions (one reaction type per user per target)
     *--------------------------------------------------------------------*/

    addReaction(data) {
        const { userId, targetId, targetType, reactionType, rating } = data;

        if (!userId || !targetId || !targetType || !reactionType) {
            throw new Error('userId, targetId, targetType, and reactionType are required');
        }
        if (!this.reactionTypes[reactionType]) {
            throw new Error('Invalid reaction type');
        }
        if (typeof rating !== 'number' || !Number.isFinite(rating) || !Number.isInteger(rating) || rating < this.minRating || rating > this.maxRating) {
            throw new Error(`Rating must be between ${this.minRating} and ${this.maxRating}`);
        }
        if (targetType !== 'post' && targetType !== 'comment') {
            throw new Error('Invalid target type');
        }

        const target = targetType === 'post'
            ? this.posts.get(targetId)
            : this.comments.get(targetId);

        if (!target) throw new Error('Target not found');
        if (target.isHidden) throw new Error('Cannot react to hidden content');

        if (!target.reactions) target.reactions = {};
        if (!target.reactions[userId]) {
            target.reactions[userId] = { sentiment: null, reaction: null };
        }

        const reactionInfo = this.reactionTypes[reactionType];
        const group = reactionInfo.group;

        // Mutual exclusivity within group: replace existing reaction in same group
        target.reactions[userId][group] = { type: reactionType, rating };

        this._emit('forum_reaction_added', { userId, targetId, targetType, reactionType, rating });

        return true;
    }

    removeReaction(data) {
        const { userId, targetId, targetType } = data;

        let target;
        if (targetType === 'post') {
            target = this.posts.get(targetId);
        } else if (targetType === 'comment') {
            target = this.comments.get(targetId);
        }

        if (!target || !target.reactions || !target.reactions[userId]) return false;

        const userReaction = target.reactions[userId];
        const hadSentiment = userReaction.sentiment !== null;
        const hadReaction = userReaction.reaction !== null;

        userReaction.sentiment = null;
        userReaction.reaction = null;

        // Clean up empty user entry
        if (userReaction.sentiment === null && userReaction.reaction === null) {
            delete target.reactions[userId];
        }

        return hadSentiment || hadReaction;
    }

    getUserReaction(reactions, userId) {
        if (!reactions || !userId || !reactions[userId]) return null;
        const userReaction = reactions[userId];
        const result = {};
        if (userReaction.sentiment) result.sentiment = userReaction.sentiment;
        if (userReaction.reaction) result.reaction = userReaction.reaction;
        return Object.keys(result).length > 0 ? result : null;
    }

    getReactionStats(reactions) {
        if (!reactions) return null;

        const stats = {
            like:   { count: 0, totalRating: 0, users: [], averageRating: 0 },
            dislike:{ count: 0, totalRating: 0, users: [], averageRating: 0 },
            lol:    { count: 0, totalRating: 0, users: [], averageRating: 0 },
            wtf:    { count: 0, totalRating: 0, users: [], averageRating: 0 }
        };

        for (const [userId, userReaction] of Object.entries(reactions)) {
            if (userReaction.sentiment) {
                const { type, rating } = userReaction.sentiment;
                if (stats[type]) {
                    stats[type].count++;
                    stats[type].totalRating += rating;
                    stats[type].users.push(userId);
                }
            }
            if (userReaction.reaction) {
                const { type, rating } = userReaction.reaction;
                if (stats[type]) {
                    stats[type].count++;
                    stats[type].totalRating += rating;
                    stats[type].users.push(userId);
                }
            }
        }

        for (const type of Object.keys(stats)) {
            stats[type].averageRating = stats[type].count > 0
                ? stats[type].totalRating / stats[type].count
                : 0;
        }

        return stats;
    }

    /*--------------------------------------------------------------------*
     * Tips (money transfer between users via economy system)
     *--------------------------------------------------------------------*/

    sendTip(data) {
        const { fromUserId, toUserId, targetId, targetType, amount, message } = data;

        if (!fromUserId || !toUserId) {
            throw new Error('Sender and recipient are required');
        }
        if (fromUserId === toUserId) {
            throw new Error('Cannot tip yourself');
        }
        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 1) {
            throw new Error('Tip amount must be at least $1');
        }
        if (targetType && targetType !== 'post' && targetType !== 'comment') {
            throw new Error('Invalid target type');
        }

        const rateLimit = this.checkRateLimit(fromUserId, 'tips');
        if (!rateLimit.allowed) {
            throw new Error(`Tip rate limit exceeded. Try again in ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)} seconds`);
        }

        if (targetId && !targetType) {
            throw new Error('targetType is required when targetId is provided');
        }
        if (targetId) {
            const target = targetType === 'post'
                ? this.posts.get(targetId)
                : this.comments.get(targetId);
            if (!target) throw new Error('Target not found');
        }

        const fromNation = this.getNation(fromUserId);
        if (!fromNation) {
            throw new Error('Sender nation not found');
        }
        const fromBalance = typeof fromNation.money === 'number' ? fromNation.money : 0;
        if (fromBalance < amount) {
            throw new Error('Insufficient funds for tip');
        }

        const toNation = this.getNation(toUserId);
        if (!toNation) {
            throw new Error('Recipient not found');
        }

        const tipId = this.generateId('tip');
        const now = Date.now();

        const tip = {
            id: tipId,
            fromUserId,
            toUserId,
            targetId: targetId || null,
            targetType: targetType || null,
            amount,
            message: message || '',
            createdAt: now
        };

        const economy = typeof window !== 'undefined' && window.GameEngine
            ? window.GameEngine.systems?.economy
            : null;

        if (economy && typeof economy.transferCurrency === 'function') {
            const result = economy.transferCurrency(
                fromNation, toNation, amount, 'aurel', 'aurel'
            );
            if (!result.ok) {
                throw new Error(result.reason || 'Tip transfer failed');
            }
        } else {
            fromNation.money -= amount;
            toNation.money += amount;
        }

        this.tips.set(tipId, tip);
        this.recordRateLimitAction(fromUserId, 'tips');

        this._emit('forum_tip_sent', { tip });
        this._notify(toUserId, 'tip', tipId, 'tip', fromUserId, `Received a $${amount} tip${tip.message ? `: "${tip.message}"` : ''}`);

        return tipId;
    }

    /*--------------------------------------------------------------------*
     * Post editing / deletion
     *--------------------------------------------------------------------*/

    editPost(data) {
        const { postId, userId, title, content, media, tags, category } = data;

        const post = this.posts.get(postId);
        if (!post) throw new Error('Post not found');
        if (post.authorId !== userId && !this.isModerator(userId)) {
            throw new Error('Only the author or a moderator can edit this post');
        }

        if (title !== undefined) {
            if (typeof title !== 'string' || title.length > 200) {
                throw new Error('Title must be 200 characters or less');
            }
            post.title = title;
        }
        if (content !== undefined) {
            if (typeof content !== 'string' || content.length > 10000) {
                throw new Error('Content must be 10,000 characters or less');
            }
            post.content = content;
        }
        if (category !== undefined) {
            if (!this.categories[category]) {
                throw new Error(`Invalid category '${category}'`);
            }
            post.category = category;
        }
        if (media !== undefined) {
            if (media.length > 0) {
                this.validateMedia(media, this.mediaSettings.maxImagesPerPost);
            }
            post.media = media;
        }
        if (tags !== undefined) {
            if (!Array.isArray(tags)) throw new Error('Tags must be an array');
            post.tags = tags;
        }

        const now = Date.now();
        post.updatedAt = now;
        post.editedAt = now;

        this._emit('forum_post_edited', { post });

        return true;
    }

    deletePost(data) {
        const { postId, userId } = data;

        const post = this.posts.get(postId);
        if (!post) throw new Error('Post not found');
        if (post.authorId !== userId && !this.isModerator(userId)) {
            throw new Error('Only the author or a moderator can delete this post');
        }

        const postComments = Array.from(this.comments.values())
            .filter(comment => comment.postId === postId);

        for (const comment of postComments) {
            // Remove this comment from its parent's replies array
            if (comment.parentCommentId) {
                const parent = this.comments.get(comment.parentCommentId);
                if (parent) {
                    parent.replies = parent.replies.filter(id => id !== comment.id);
                }
            }

            // Delete all replies to this comment
            if (comment.replies && comment.replies.length > 0) {
                for (const replyId of comment.replies) {
                    const reply = this.comments.get(replyId);
                    if (reply && reply.parentCommentId) {
                        const replyParent = this.comments.get(reply.parentCommentId);
                        if (replyParent) {
                            replyParent.replies = replyParent.replies.filter(id => id !== replyId);
                        }
                    }
                    this.comments.delete(replyId);
                    if (post) post.commentCount--;
                }
            }

            this.comments.delete(comment.id);
            if (post) post.commentCount--;
        }

        this.posts.delete(postId);

        this._emit('forum_post_deleted', { postId, post });

        return true;
    }

    /*--------------------------------------------------------------------*
     * Comment editing / deletion
     *--------------------------------------------------------------------*/

    editComment(data) {
        const { commentId, userId, content, media } = data;

        const comment = this.comments.get(commentId);
        if (!comment) throw new Error('Comment not found');
        if (comment.authorId !== userId && !this.isModerator(userId)) {
            throw new Error('Only the author or a moderator can edit this comment');
        }

        if (content !== undefined) {
            if (typeof content !== 'string' || content.length > 5000) {
                throw new Error('Comment must be 5,000 characters or less');
            }
            comment.content = content;
        }
        if (media !== undefined) {
            if (media.length > 0) {
                this.validateMedia(media, this.mediaSettings.maxImagesPerComment);
            }
            comment.media = media;
        }

        const now = Date.now();
        comment.updatedAt = now;
        comment.editedAt = now;

        this._emit('forum_comment_edited', { comment });

        return true;
    }

    deleteComment(data) {
        const { commentId, userId } = data;

        const comment = this.comments.get(commentId);
        if (!comment) throw new Error('Comment not found');
        if (comment.authorId !== userId && !this.isModerator(userId)) {
            throw new Error('Only the author or a moderator can delete this comment');
        }

        const post = this.posts.get(comment.postId);

        if (comment.parentCommentId) {
            const parent = this.comments.get(comment.parentCommentId);
            if (parent) {
                parent.replies = parent.replies.filter(id => id !== commentId);
            }
        }

        if (comment.replies && comment.replies.length > 0) {
            for (const replyId of comment.replies) {
                this.comments.delete(replyId);
                if (post) post.commentCount--;
            }
        }

        if (post) post.commentCount--;

        this.comments.delete(commentId);

        this._emit('forum_comment_deleted', { commentId, comment });

        return true;
    }

    /*--------------------------------------------------------------------*
     * Moderation actions
     *--------------------------------------------------------------------*/

    pinPost(postId, userId) {
        this._requireModerator(userId);
        const post = this.posts.get(postId);
        if (!post) throw new Error('Post not found');
        post.isPinned = true;
        post.updatedAt = Date.now();
        this._emit('forum_post_edited', { post });
        return true;
    }

    unpinPost(postId, userId) {
        this._requireModerator(userId);
        const post = this.posts.get(postId);
        if (!post) throw new Error('Post not found');
        post.isPinned = false;
        post.updatedAt = Date.now();
        this._emit('forum_post_edited', { post });
        return true;
    }

    lockPost(postId, userId) {
        this._requireModerator(userId);
        const post = this.posts.get(postId);
        if (!post) throw new Error('Post not found');
        post.isLocked = true;
        post.updatedAt = Date.now();
        this._emit('forum_post_edited', { post });
        return true;
    }

    unlockPost(postId, userId) {
        this._requireModerator(userId);
        const post = this.posts.get(postId);
        if (!post) throw new Error('Post not found');
        post.isLocked = false;
        post.updatedAt = Date.now();
        this._emit('forum_post_edited', { post });
        return true;
    }

    hidePost(postId, userId) {
        this._requireModerator(userId);
        const post = this.posts.get(postId);
        if (!post) throw new Error('Post not found');
        post.isHidden = true;
        post.updatedAt = Date.now();
        this._emit('forum_post_edited', { post });
        return true;
    }

    unhidePost(postId, userId) {
        this._requireModerator(userId);
        const post = this.posts.get(postId);
        if (!post) throw new Error('Post not found');
        post.isHidden = false;
        post.updatedAt = Date.now();
        this._emit('forum_post_edited', { post });
        return true;
    }

    /*--------------------------------------------------------------------*
     * Report system
     *--------------------------------------------------------------------*/

    reportContent(data) {
        const { reporterId, targetId, targetType, reason, description } = data;

        if (!reporterId || !targetId || !targetType || !reason) {
            throw new Error('reporterId, targetId, targetType, and reason are required');
        }
        if (targetType !== 'post' && targetType !== 'comment') {
            throw new Error('Invalid target type');
        }
        if (!this.reportReasons[reason]) {
            throw new Error('Invalid report reason');
        }

        const target = targetType === 'post'
            ? this.posts.get(targetId)
            : this.comments.get(targetId);
        if (!target) throw new Error('Target not found');

        const rateLimit = this.checkRateLimit(reporterId, 'reports');
        if (!rateLimit.allowed) {
            throw new Error(`Report rate limit exceeded. Try again in ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)} seconds`);
        }

        const reportId = this.generateId('report');
        const now = Date.now();

        const report = {
            id: reportId,
            reporterId,
            targetId,
            targetType,
            reason,
            description: description || '',
            status: this.reportStatuses.pending,
            createdAt: now,
            reviewedBy: null,
            reviewedAt: null,
            moderatorAction: null
        };

        this.reports.set(reportId, report);
        this.recordRateLimitAction(reporterId, 'reports');

        this._emit('forum_report_created', { report });

        const moderators = Array.from(this.moderators);
        for (const modId of moderators) {
            this._notify(modId, 'report', reportId, 'report', reporterId, `New ${reason} report on ${targetType}`);
        }

        return reportId;
    }

    reviewReport(data) {
        const { reportId, moderatorId, status, moderatorAction } = data;

        if (!this.isModerator(moderatorId)) {
            throw new Error('Moderator privileges required');
        }

        const report = this.reports.get(reportId);
        if (!report) throw new Error('Report not found');
        if (report.status !== this.reportStatuses.pending) {
            throw new Error('Report has already been reviewed');
        }
        if (status !== this.reportStatuses.reviewed &&
            status !== this.reportStatuses.dismissed &&
            status !== this.reportStatuses.actioned) {
            throw new Error('Invalid report status');
        }

        const now = Date.now();
        report.status = status;
        report.reviewedBy = moderatorId;
        report.reviewedAt = now;
        report.moderatorAction = moderatorAction || null;

        this._emit('forum_report_reviewed', { report });

        this._notify(report.reporterId, 'report_reviewed', reportId, 'report', moderatorId, `Your ${report.reason} report has been ${status}`);

        return true;
    }

    getReports(options = {}) {
        const {
            status = null,
            reporterId = null,
            targetType = null,
            reason = null,
            reviewedBy = null,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 20
        } = options;

        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const currentLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

        let reports = Array.from(this.reports.values());

        if (status) {
            reports = reports.filter(r => r.status === status);
        }
        if (reporterId) {
            reports = reports.filter(r => r.reporterId === reporterId);
        }
        if (targetType) {
            reports = reports.filter(r => r.targetType === targetType);
        }
        if (reason) {
            reports = reports.filter(r => r.reason === reason);
        }
        if (reviewedBy) {
            reports = reports.filter(r => r.reviewedBy === reviewedBy);
        }

        reports.sort((a, b) => {
            let aVal = a[sortBy] || 0;
            let bVal = b[sortBy] || 0;
            if (sortOrder === 'desc') {
                return bVal - aVal;
            }
            return aVal - bVal;
        });

        const startIndex = (currentPage - 1) * currentLimit;
        const paginated = reports.slice(startIndex, startIndex + currentLimit);

        return {
            reports: paginated,
            totalReports: reports.length,
            page: currentPage,
            limit: currentLimit,
            totalPages: Math.ceil(reports.length / currentLimit)
        };
    }

    getReportStats() {
        const reports = Array.from(this.reports.values());
        const stats = {
            total: reports.length,
            byStatus: {},
            byReason: {},
            byTargetType: {}
        };

        for (const status of Object.values(this.reportStatuses)) {
            stats.byStatus[status] = 0;
        }
        for (const reason of Object.keys(this.reportReasons)) {
            stats.byReason[reason] = 0;
        }
        stats.byTargetType.post = 0;
        stats.byTargetType.comment = 0;

        for (const report of reports) {
            stats.byStatus[report.status] = (stats.byStatus[report.status] || 0) + 1;
            stats.byReason[report.reason] = (stats.byReason[report.reason] || 0) + 1;
            stats.byTargetType[report.targetType] = (stats.byTargetType[report.targetType] || 0) + 1;
        }

        return stats;
    }

    /*--------------------------------------------------------------------*
     * Notifications
     *--------------------------------------------------------------------*/

    _notify(userId, type, targetId, targetType, actorId, message) {
        if (!userId) return;

        if (!this.notifications.has(userId)) {
            this.notifications.set(userId, []);
        }

        const notification = {
            id: this.generateId('notif'),
            userId,
            type,
            targetId,
            targetType,
            actorId,
            message,
            createdAt: Date.now(),
            isRead: false
        };

        this.notifications.get(userId).push(notification);

        this._emit('forum_notification_created', { notification });
    }

    getNotifications(userId, options = {}) {
        const { page = 1, limit = 50, unreadOnly = false } = options;
        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const currentLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));

        let notifications = this.notifications.get(userId) || [];

        if (unreadOnly) {
            notifications = notifications.filter(n => !n.isRead);
        }

        notifications.sort((a, b) => b.createdAt - a.createdAt);

        const startIndex = (currentPage - 1) * currentLimit;
        const paginated = notifications.slice(startIndex, startIndex + currentLimit);
        const unreadCount = this.notifications.get(userId)?.filter(n => !n.isRead).length || 0;

        return {
            notifications: paginated,
            total: notifications.length,
            unreadCount,
            page: currentPage,
            limit: currentLimit,
            totalPages: Math.ceil(notifications.length / currentLimit)
        };
    }

    markNotificationRead(userId, notificationId) {
        const notifications = this.notifications.get(userId);
        if (!notifications) return false;

        const notification = notifications.find(n => n.id === notificationId);
        if (!notification) return false;

        notification.isRead = true;
        return true;
    }

    markAllNotificationsRead(userId) {
        const notifications = this.notifications.get(userId);
        if (!notifications) return 0;

        let count = 0;
        for (const n of notifications) {
            if (!n.isRead) {
                n.isRead = true;
                count++;
            }
        }
        return count;
    }

    /*--------------------------------------------------------------------*
     * Retrieval
     *--------------------------------------------------------------------*/

    getPosts(options = {}) {
        const {
            category = null,
            tags = null,
            authorId = null,
            search = null,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 20,
            includeHidden = false
        } = options;

        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const currentLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
        const sortField = this.validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const order = sortOrder === 'asc' ? 1 : -1;

        let posts = Array.from(this.posts.values());

        if (category) {
            posts = posts.filter(post => post.category === category);
        }
        if (tags && tags.length > 0) {
            posts = posts.filter(post =>
                tags.some(tag => post.tags.includes(tag))
            );
        }
        if (authorId) {
            posts = posts.filter(post => post.authorId === authorId);
        }
        if (search) {
            const searchLower = String(search).toLowerCase();
            posts = posts.filter(post =>
                post.title.toLowerCase().includes(searchLower) ||
                post.content.toLowerCase().includes(searchLower)
            );
        }
        if (!includeHidden) {
            posts = posts.filter(post => !post.isHidden);
        }

        posts.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];

            if (sortField === 'reactions') {
                aVal = this.getTotalReactions(a.reactions);
                bVal = this.getTotalReactions(b.reactions);
            }

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = String(bVal || '').toLowerCase();
            }

            return order === 1
                ? (aVal < bVal ? -1 : aVal > bVal ? 1 : 0)
                : (aVal > bVal ? -1 : aVal < bVal ? 1 : 0);
        });

        const startIndex = (currentPage - 1) * currentLimit;
        const paginatedPosts = posts.slice(startIndex, startIndex + currentLimit);

        return {
            posts: paginatedPosts,
            totalPosts: posts.length,
            page: currentPage,
            limit: currentLimit,
            totalPages: Math.ceil(posts.length / currentLimit)
        };
    }

    getRecentPosts(limit = 5) {
        const result = this.getPosts({
            sortBy: 'createdAt',
            sortOrder: 'desc',
            page: 1,
            limit: Math.max(1, Math.min(50, parseInt(limit, 10) || 5))
        });
        return result.posts.map(post => ({
            id: post.id,
            title: post.title,
            authorName: this.getNationName(post.authorId),
            timestamp: post.createdAt,
            commentsCount: post.commentCount,
            reactionsCount: this.getTotalReactions(post.reactions)
        }));
    }

    getPost(postId, options = {}) {
        const { includeHidden = false, userId = null } = options;

        const post = this.posts.get(postId);
        if (!post) return null;
        if (post.isHidden && !includeHidden && !(userId && this.isModerator(userId))) return null;

        post.views++;

        const postComments = Array.from(this.comments.values())
            .filter(comment => comment.postId === postId && !comment.parentCommentId && (!includeHidden && !(userId && this.isModerator(userId))) ? !comment.isHidden : true)
            .sort((a, b) => a.createdAt - b.createdAt);

        const commentsWithReplies = postComments.map(comment => ({
            ...comment,
            replies: (comment.replies || [])
                .map(replyId => this.comments.get(replyId))
                .filter(reply => reply && (!includeHidden && !(userId && this.isModerator(userId))) ? !reply.isHidden : true)
                .sort((a, b) => a.createdAt - b.createdAt)
        }));

        return {
            ...post,
            comments: commentsWithReplies
        };
    }

    getComments(postId, options = {}) {
        const { page = 1, limit = 50, sortOrder = 'asc', includeHidden = false } = options;
        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const currentLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
        const order = sortOrder === 'desc' ? -1 : 1;

        let comments = Array.from(this.comments.values())
            .filter(comment => comment.postId === postId);

        if (!includeHidden) {
            comments = comments.filter(comment => !comment.isHidden);
        }

        comments.sort((a, b) => order === 1
            ? a.createdAt - b.createdAt
            : b.createdAt - a.createdAt);

        const startIndex = (currentPage - 1) * currentLimit;
        const paginated = comments.slice(startIndex, startIndex + currentLimit);

        return {
            comments: paginated,
            totalComments: comments.length,
            page: currentPage,
            limit: currentLimit,
            totalPages: Math.ceil(comments.length / currentLimit)
        };
    }

    /*--------------------------------------------------------------------*
     * Media validation
     *--------------------------------------------------------------------*/

    validateMedia(media, maxImages) {
        if (!Array.isArray(media)) {
            throw new Error('Media must be an array');
        }
        const max = maxImages || this.mediaSettings.maxImagesPerPost;
        if (media.length > max) {
            throw new Error(`Maximum ${max} images allowed`);
        }
        for (const item of media) {
            if (!item || !item.type || !this.mediaSettings.allowedTypes.includes(item.type)) {
                throw new Error('Invalid media type. Only JPEG, PNG, GIF, and WebP images are allowed');
            }
            if (item.size && item.size > this.mediaSettings.maxFileSize) {
                throw new Error('File size too large. Maximum 10MB per file');
            }
        }
    }

    /*--------------------------------------------------------------------*
     * Utilities
     *--------------------------------------------------------------------*/

    generateId(prefix = 'item') {
        this._idCounter++;
        return `${prefix}_${Date.now()}_${this._idCounter}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getTotalReactions(reactions) {
        if (!reactions) return 0;
        let count = 0;
        for (const userReaction of Object.values(reactions)) {
            if (userReaction.sentiment) count++;
            if (userReaction.reaction) count++;
        }
        return count;
    }

    /*--------------------------------------------------------------------*
     * Statistics
     *--------------------------------------------------------------------*/

    getForumStats() {
        const posts = Array.from(this.posts.values());
        const comments = Array.from(this.comments.values());
        const tips = Array.from(this.tips.values());
        const reports = Array.from(this.reports.values());
        const notifications = Array.from(this.notifications.values()).flat();

        return {
            totalPosts: posts.length,
            totalComments: comments.length,
            totalReactions:
                posts.reduce((total, post) => total + this.getTotalReactions(post.reactions), 0) +
                comments.reduce((total, comment) => total + this.getTotalReactions(comment.reactions), 0),
            totalTips: tips.length,
            totalTipAmount: tips.reduce((total, tip) => total + tip.amount, 0),
            totalReports: reports.length,
            pendingReports: reports.filter(r => r.status === this.reportStatuses.pending).length,
            totalNotifications: notifications.length,
            categoryCounts: this.getCategoryCounts(),
            topPosters: this.getTopPosters()
        };
    }

    getCategoryCounts() {
        const counts = {};
        for (const categoryKey of Object.keys(this.categories)) {
            counts[categoryKey] = 0;
        }
        for (const post of this.posts.values()) {
            if (Object.prototype.hasOwnProperty.call(counts, post.category)) {
                counts[post.category]++;
            }
        }
        return counts;
    }

    getTopPosters(limit = 10) {
        const posterCounts = {};

        for (const post of this.posts.values()) {
            posterCounts[post.authorId] = (posterCounts[post.authorId] || 0) + 1;
        }
        for (const comment of this.comments.values()) {
            posterCounts[comment.authorId] = (posterCounts[comment.authorId] || 0) + 1;
        }

        return Object.entries(posterCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([userId, count]) => ({ userId, count, name: this.getNationName(userId) }));
    }

    /*--------------------------------------------------------------------*
     * Persistence
     *--------------------------------------------------------------------*/

    getSaveData() {
        return {
            posts: Array.from(this.posts.entries()),
            comments: Array.from(this.comments.entries()),
            tips: Array.from(this.tips.entries()),
            reports: Array.from(this.reports.entries()),
            notifications: Array.from(this.notifications.entries()),
            moderators: Array.from(this.moderators),
            rateLimits: Array.from(this.rateLimits.entries()),
            idCounter: this._idCounter,
            version: 2
        };
    }

    loadSaveData(data) {
        if (!data || data.version !== 2) return false;

        this.posts = new Map(data.posts || []);
        this.comments = new Map(data.comments || []);
        this.tips = new Map(data.tips || []);
        this.reports = new Map(data.reports || []);
        this.notifications = new Map(data.notifications || []);
        this.moderators = new Set(data.moderators || []);
        this.rateLimits = new Map(data.rateLimits || []);
        this._idCounter = typeof data.idCounter === 'number' ? data.idCounter : 0;
        this.isInitialized = true;
        return true;
    }

    /*--------------------------------------------------------------------*
     * Event handlers
     *--------------------------------------------------------------------*/

    handlePostCreated(data) {
        console.log('Forum post created:', data.post?.title);
    }

    handleCommentCreated(data) {
        console.log('Forum comment created on post:', data.post?.title);
    }

    handleReactionAdded(data) {
        console.log('Reaction added:', data.reactionType, 'rating:', data.rating, 'to', data.targetType);
    }

    handleTipSent(data) {
        console.log('Tip sent:', `$${data.tip?.amount} from ${data.tip?.fromUserId} to ${data.tip?.toUserId}`);
    }

    handlePostEdited(data) {
        console.log('Post edited:', data.post?.title);
    }

    handlePostDeleted(data) {
        console.log('Post deleted:', data.postId);
    }

    handleCommentEdited(data) {
        console.log('Comment edited:', data.comment?.id);
    }

    handleCommentDeleted(data) {
        console.log('Comment deleted:', data.commentId);
    }

    handleReportCreated(data) {
        console.log('Report created:', data.report?.reason, 'on', data.report?.targetType);
    }

    handleReportReviewed(data) {
        console.log('Report reviewed:', data.report?.id, 'status:', data.report?.status);
    }

    /*--------------------------------------------------------------------*
     * Lifecycle
     *--------------------------------------------------------------------*/

    destroy() {
        // Remove all event listeners
        for (const unsubscribe of this._unsubscribes) {
            unsubscribe();
        }
        this._unsubscribes = [];

        this.posts.clear();
        this.comments.clear();
        this.tips.clear();
        this.reports.clear();
        this.notifications.clear();
        this.moderators.clear();
        this.rateLimits.clear();
        this.isInitialized = false;
    }
}

if (typeof window !== 'undefined') {
    window.ForumSystem = ForumSystem;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ForumSystem };
}
