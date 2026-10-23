/**
 * Forum System - News Board and Discussion Platform
 * Empire Builder - Nation Building Strategy Game
 * 
 * Handles posts, comments, reactions, media uploads, and user interactions
 */

class ForumSystem {
    constructor() {
        this.isInitialized = false;
        
        // Forum data storage
        this.posts = new Map(); // postId -> post data
        this.comments = new Map(); // commentId -> comment data
        this.reactions = new Map(); // targetId -> reactions array
        this.tips = new Map(); // tipId -> tip data
        
        // Reaction types
        this.reactionTypes = {
            like: { emoji: '👍', name: 'Like', color: '#4a90e2' },
            dislike: { emoji: '👎', name: 'Dislike', color: '#e74c3c' },
            love: { emoji: '❤️', name: 'Love', color: '#e91e63' },
            laugh: { emoji: '😂', name: 'Laugh', color: '#ff9800' },
            wow: { emoji: '😮', name: 'Wow', color: '#9c27b0' },
            angry: { emoji: '😠', name: 'Angry', color: '#f44336' },
            sad: { emoji: '😢', name: 'Sad', color: '#607d8b' }
        };
        
        // Post categories
        this.categories = {
            general: { name: 'General Discussion', icon: '💬', color: '#4a90e2' },
            news: { name: 'Game News', icon: '📰', color: '#27ae60' },
            strategy: { name: 'Strategy & Tips', icon: '🎯', color: '#e67e22' },
            diplomacy: { name: 'Diplomacy & Politics', icon: '🤝', color: '#9b59b6' },
            trade: { name: 'Trade & Economy', icon: '💰', color: '#f39c12' },
            military: { name: 'Military & War', icon: '⚔️', color: '#e74c3c' },
            help: { name: 'Help & Support', icon: '❓', color: '#95a5a6' },
            showcase: { name: 'Nation Showcase', icon: '🏛️', color: '#34495e' }
        };
        
        // Media upload settings
        this.mediaSettings = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            maxImagesPerPost: 5
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('Initializing Forum System...');
        this.bindEvents();
        this.isInitialized = true;
        console.log('Forum System ready');
    }
    
    bindEvents() {
        EventBus.on('forum_post_created', this.handlePostCreated.bind(this));
        EventBus.on('forum_comment_created', this.handleCommentCreated.bind(this));
        EventBus.on('forum_reaction_added', this.handleReactionAdded.bind(this));
        EventBus.on('forum_tip_sent', this.handleTipSent.bind(this));
        EventBus.on('forum_post_edited', this.handlePostEdited.bind(this));
        EventBus.on('forum_post_deleted', this.handlePostDeleted.bind(this));
    }
    
    // Create a new forum post
    createPost(data) {
        const { authorId, title, content, category, media, tags } = data;
        
        // Validate post data
        if (!title || !content || !authorId) {
            throw new Error('Title, content, and author are required');
        }
        
        if (title.length > 200) {
            throw new Error('Title must be 200 characters or less');
        }
        
        if (content.length > 10000) {
            throw new Error('Content must be 10,000 characters or less');
        }
        
        const postId = this.generateId('post');
        const now = Date.now();
        
        const post = {
            id: postId,
            authorId,
            title,
            content,
            category: category || 'general',
            media: media || [],
            tags: tags || [],
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
        
        // Validate media uploads
        if (post.media.length > 0) {
            this.validateMedia(post.media);
        }
        
        this.posts.set(postId, post);
        
        EventBus.emit('forum_post_created', { post });
        
        return postId;
    }
    
    // Create a comment on a post
    createComment(data) {
        const { authorId, postId, content, parentCommentId, media } = data;
        
        if (!content || !authorId || !postId) {
            throw new Error('Content, author, and post are required');
        }
        
        if (content.length > 5000) {
            throw new Error('Comment must be 5,000 characters or less');
        }
        
        const post = this.posts.get(postId);
        if (!post) {
            throw new Error('Post not found');
        }
        
        if (post.isLocked) {
            throw new Error('Post is locked for commenting');
        }
        
        const commentId = this.generateId('comment');
        const now = Date.now();
        
        const comment = {
            id: commentId,
            postId,
            authorId,
            content,
            media: media || [],
            parentCommentId: parentCommentId || null,
            createdAt: now,
            updatedAt: now,
            editedAt: null,
            reactions: {},
            replies: [],
            isHidden: false
        };
        
        if (comment.media.length > 0) {
            this.validateMedia(comment.media);
        }
        
        this.comments.set(commentId, comment);
        
        // Update post comment count
        post.commentCount++;
        post.updatedAt = now;
        
        // If this is a reply, add to parent comment
        if (parentCommentId) {
            const parentComment = this.comments.get(parentCommentId);
            if (parentComment) {
                parentComment.replies.push(commentId);
            }
        }
        
        EventBus.emit('forum_comment_created', { comment, post });
        
        return commentId;
    }
    
    // Add or update a reaction to a post or comment
    addReaction(data) {
        const { userId, targetId, targetType, reactionType } = data;
        
        if (!this.reactionTypes[reactionType]) {
            throw new Error('Invalid reaction type');
        }
        
        let target;
        if (targetType === 'post') {
            target = this.posts.get(targetId);
        } else if (targetType === 'comment') {
            target = this.comments.get(targetId);
        }
        
        if (!target) {
            throw new Error('Target not found');
        }
        
        // Initialize reactions object if needed
        if (!target.reactions) {
            target.reactions = {};
        }
        
        // Remove any existing reaction from this user
        for (const [type, userList] of Object.entries(target.reactions)) {
            const index = userList.indexOf(userId);
            if (index !== -1) {
                userList.splice(index, 1);
                if (userList.length === 0) {
                    delete target.reactions[type];
                }
            }
        }
        
        // Add new reaction
        if (!target.reactions[reactionType]) {
            target.reactions[reactionType] = [];
        }
        target.reactions[reactionType].push(userId);
        
        EventBus.emit('forum_reaction_added', { userId, targetId, targetType, reactionType });
        
        return true;
    }
    
    // Remove a reaction
    removeReaction(data) {
        const { userId, targetId, targetType } = data;
        
        let target;
        if (targetType === 'post') {
            target = this.posts.get(targetId);
        } else if (targetType === 'comment') {
            target = this.comments.get(targetId);
        }
        
        if (!target || !target.reactions) {
            return false;
        }
        
        // Remove user's reaction
        for (const [type, userList] of Object.entries(target.reactions)) {
            const index = userList.indexOf(userId);
            if (index !== -1) {
                userList.splice(index, 1);
                if (userList.length === 0) {
                    delete target.reactions[type];
                }
                return true;
            }
        }
        
        return false;
    }
    
    // Send a tip to a post or comment author
    sendTip(data) {
        const { fromUserId, toUserId, targetId, targetType, amount, message } = data;
        
        if (amount < 1) {
            throw new Error('Tip amount must be at least $1');
        }
        
        const fromNation = this.getNation(fromUserId);
        if (!fromNation || fromNation.money < amount) {
            throw new Error('Insufficient funds for tip');
        }
        
        const toNation = this.getNation(toUserId);
        if (!toNation) {
            throw new Error('Recipient not found');
        }
        
        if (fromUserId === toUserId) {
            throw new Error('Cannot tip yourself');
        }
        
        const tipId = this.generateId('tip');
        const now = Date.now();
        
        const tip = {
            id: tipId,
            fromUserId,
            toUserId,
            targetId,
            targetType,
            amount,
            message: message || '',
            createdAt: now
        };
        
        // Transfer money
        fromNation.money -= amount;
        toNation.money += amount;
        
        this.tips.set(tipId, tip);
        
        EventBus.emit('forum_tip_sent', { tip });
        
        return tipId;
    }
    
    // Edit a post (only by author)
    editPost(data) {
        const { postId, userId, title, content, media, tags } = data;
        
        const post = this.posts.get(postId);
        if (!post) {
            throw new Error('Post not found');
        }
        
        if (post.authorId !== userId) {
            throw new Error('Only the author can edit this post');
        }
        
        const now = Date.now();
        
        if (title) post.title = title;
        if (content) post.content = content;
        if (media !== undefined) {
            if (media.length > 0) {
                this.validateMedia(media);
            }
            post.media = media;
        }
        if (tags !== undefined) post.tags = tags;
        
        post.updatedAt = now;
        post.editedAt = now;
        
        EventBus.emit('forum_post_edited', { post });
        
        return true;
    }
    
    // Delete a post (only by author)
    deletePost(data) {
        const { postId, userId } = data;
        
        const post = this.posts.get(postId);
        if (!post) {
            throw new Error('Post not found');
        }
        
        if (post.authorId !== userId) {
            throw new Error('Only the author can delete this post');
        }
        
        // Delete all comments on this post
        const postComments = Array.from(this.comments.values())
            .filter(comment => comment.postId === postId);
        
        for (const comment of postComments) {
            this.comments.delete(comment.id);
        }
        
        // Delete the post
        this.posts.delete(postId);
        
        EventBus.emit('forum_post_deleted', { postId, post });
        
        return true;
    }
    
    // Edit a comment (only by author)
    editComment(data) {
        const { commentId, userId, content, media } = data;
        
        const comment = this.comments.get(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }
        
        if (comment.authorId !== userId) {
            throw new Error('Only the author can edit this comment');
        }
        
        const now = Date.now();
        
        if (content) comment.content = content;
        if (media !== undefined) {
            if (media.length > 0) {
                this.validateMedia(media);
            }
            comment.media = media;
        }
        
        comment.updatedAt = now;
        comment.editedAt = now;
        
        EventBus.emit('forum_comment_edited', { comment });
        
        return true;
    }
    
    // Delete a comment (only by author)
    deleteComment(data) {
        const { commentId, userId } = data;
        
        const comment = this.comments.get(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }
        
        if (comment.authorId !== userId) {
            throw new Error('Only the author can delete this comment');
        }
        
        const post = this.posts.get(comment.postId);
        if (post) {
            post.commentCount--;
        }
        
        // Delete all replies to this comment
        if (comment.replies && comment.replies.length > 0) {
            for (const replyId of comment.replies) {
                this.comments.delete(replyId);
                if (post) post.commentCount--;
            }
        }
        
        this.comments.delete(commentId);
        
        EventBus.emit('forum_comment_deleted', { commentId, comment });
        
        return true;
    }
    
    // Get posts with filtering and pagination
    getPosts(options = {}) {
        const {
            category = null,
            tags = null,
            authorId = null,
            search = null,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 20
        } = options;
        
        let posts = Array.from(this.posts.values());
        
        // Apply filters
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
            const searchLower = search.toLowerCase();
            posts = posts.filter(post =>
                post.title.toLowerCase().includes(searchLower) ||
                post.content.toLowerCase().includes(searchLower)
            );
        }
        
        // Filter out hidden posts
        posts = posts.filter(post => !post.isHidden);
        
        // Sort posts
        posts.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            
            if (sortBy === 'reactions') {
                aVal = this.getTotalReactions(a.reactions);
                bVal = this.getTotalReactions(b.reactions);
            }
            
            if (sortOrder === 'desc') {
                return bVal - aVal;
            } else {
                return aVal - bVal;
            }
        });
        
        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedPosts = posts.slice(startIndex, endIndex);
        
        return {
            posts: paginatedPosts,
            totalPosts: posts.length,
            page,
            limit,
            totalPages: Math.ceil(posts.length / limit)
        };
    }
    
    // Get a single post with its comments
    getPost(postId) {
        const post = this.posts.get(postId);
        if (!post) {
            return null;
        }
        
        // Increment view count
        post.views++;
        
        // Get comments for this post
        const postComments = Array.from(this.comments.values())
            .filter(comment => comment.postId === postId && !comment.parentCommentId)
            .sort((a, b) => a.createdAt - b.createdAt);
        
        // Get replies for each comment
        const commentsWithReplies = postComments.map(comment => ({
            ...comment,
            replies: comment.replies.map(replyId => this.comments.get(replyId))
                .filter(reply => reply && !reply.isHidden)
                .sort((a, b) => a.createdAt - b.createdAt)
        }));
        
        return {
            ...post,
            comments: commentsWithReplies
        };
    }
    
    // Validate media uploads
    validateMedia(media) {
        if (!Array.isArray(media)) {
            throw new Error('Media must be an array');
        }
        
        if (media.length > this.mediaSettings.maxImagesPerPost) {
            throw new Error(`Maximum ${this.mediaSettings.maxImagesPerPost} images allowed per post`);
        }
        
        for (const item of media) {
            if (!item.type || !this.mediaSettings.allowedTypes.includes(item.type)) {
                throw new Error('Invalid media type. Only JPEG, PNG, GIF, and WebP images are allowed');
            }
            
            if (item.size && item.size > this.mediaSettings.maxFileSize) {
                throw new Error('File size too large. Maximum 10MB per file');
            }
        }
    }
    
    // Utility methods
    generateId(prefix = 'item') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getNation(userId) {
        // This would get the actual nation data
        return GameEngine?.currentNation || DataManager?.currentNation;
    }
    
    getNationName(userId) {
        const nation = this.getNation(userId);
        return nation ? nation.name : `Nation ${userId}`;
    }
    
    getTotalReactions(reactions) {
        if (!reactions) return 0;
        return Object.values(reactions).reduce((total, users) => total + users.length, 0);
    }
    
    getUserReaction(reactions, userId) {
        if (!reactions) return null;
        
        for (const [type, users] of Object.entries(reactions)) {
            if (users.includes(userId)) {
                return type;
            }
        }
        return null;
    }
    
    // Event handlers
    handlePostCreated(data) {
        console.log('Forum post created:', data.post.title);
    }
    
    handleCommentCreated(data) {
        console.log('Forum comment created on post:', data.post.title);
    }
    
    handleReactionAdded(data) {
        console.log('Reaction added:', data.reactionType, 'to', data.targetType);
    }
    
    handleTipSent(data) {
        console.log('Tip sent:', `$${data.tip.amount} from ${data.tip.fromUserId} to ${data.tip.toUserId}`);
    }
    
    handlePostEdited(data) {
        console.log('Post edited:', data.post.title);
    }
    
    handlePostDeleted(data) {
        console.log('Post deleted:', data.postId);
    }
    
    // Get forum statistics
    getForumStats() {
        const posts = Array.from(this.posts.values());
        const comments = Array.from(this.comments.values());
        const tips = Array.from(this.tips.values());
        
        return {
            totalPosts: posts.length,
            totalComments: comments.length,
            totalReactions: posts.reduce((total, post) => total + this.getTotalReactions(post.reactions), 0) +
                           comments.reduce((total, comment) => total + this.getTotalReactions(comment.reactions), 0),
            totalTips: tips.length,
            totalTipAmount: tips.reduce((total, tip) => total + tip.amount, 0),
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
            if (counts.hasOwnProperty(post.category)) {
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
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([userId, count]) => ({ userId, count, name: this.getNationName(userId) }));
    }
    
    destroy() {
        this.posts.clear();
        this.comments.clear();
        this.reactions.clear();
        this.tips.clear();
        this.isInitialized = false;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ForumSystem };
}