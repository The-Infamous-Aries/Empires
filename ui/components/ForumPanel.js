/**
 * Forum Panel - News Board and Discussion Interface
 * Empire Builder - Nation Building Strategy Game
 */

class ForumPanel {
    constructor() {
        this.isVisible = false;
        this.currentTab = 'posts';
        this.currentCategory = 'all';
        this.currentPost = null;
        this.currentPage = 1;
        this.bindEvents();
    }

    bindEvents() {
        EventBus.on('show_forum_panel', this.show.bind(this));
        EventBus.on('hide_forum_panel', this.hide.bind(this));
        EventBus.on('forum_post_created', this.refreshPosts.bind(this));
        EventBus.on('forum_comment_created', this.refreshCurrentPost.bind(this));
        EventBus.on('forum_reaction_added', this.refreshReactions.bind(this));
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    show(data = {}) {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.currentCategory = data.category || 'all';
        this.createInterface();
        this.loadPosts();
        
        EventBus.emit('modal_opened', { type: 'forum_panel' });
    }

    hide() {
        if (!this.isVisible) return;
        
        const panel = document.getElementById('forum-panel');
        if (panel) {
            panel.remove();
        }
        
        this.isVisible = false;
        this.currentPost = null;
        EventBus.emit('modal_closed', { type: 'forum_panel' });
    }

    createInterface() {
        if (document.getElementById('forum-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'forum-panel';
        panel.className = 'forum-panel modal-overlay';
        
        panel.innerHTML = this.getInterfaceHTML();
        document.body.appendChild(panel);
        
        this.bindInterfaceEvents();
    }

    getInterfaceHTML() {
        return `
            <div class="modal-content forum-content">
                <div class="modal-header">
                    <h2>📰 Community Forum</h2>
                    <button class="close-btn" id="close-forum">✕</button>
                </div>
                
                <div class="forum-navigation">
                    <div class="forum-tabs">
                        <button class="tab-btn ${this.currentTab === 'posts' ? 'active' : ''}" 
                                data-tab="posts">📝 Posts</button>
                        <button class="tab-btn ${this.currentTab === 'create' ? 'active' : ''}" 
                                data-tab="create">➕ Create Post</button>
                        <button class="tab-btn ${this.currentTab === 'categories' ? 'active' : ''}" 
                                data-tab="categories">📂 Categories</button>
                        <button class="tab-btn ${this.currentTab === 'stats' ? 'active' : ''}" 
                                data-tab="stats">📊 Stats</button>
                    </div>
                    
                    <div class="forum-controls">
                        <div class="category-filter">
                            <select id="category-select">
                                <option value="all">All Categories</option>
                                ${this.getCategoryOptions()}
                            </select>
                        </div>
                        
                        <div class="search-box">
                            <input type="text" id="forum-search" placeholder="Search posts..." maxlength="100">
                            <button id="search-btn">🔍</button>
                        </div>
                    </div>
                </div>
                
                <div class="forum-content-area">
                    <div id="forum-tab-content">
                        ${this.getTabContent()}
                    </div>
                </div>
            </div>
        `;
    }

    getCategoryOptions() {
        const categories = GameEngine?.systems?.forum?.categories || {};
        return Object.entries(categories).map(([key, cat]) => 
            `<option value="${key}">${cat.icon} ${cat.name}</option>`
        ).join('');
    }

    getTabContent() {
        switch (this.currentTab) {
            case 'posts':
                return this.getPostsContent();
            case 'create':
                return this.getCreatePostContent();
            case 'categories':
                return this.getCategoriesContent();
            case 'stats':
                return this.getStatsContent();
            default:
                return '<p>Loading...</p>';
        }
    }

    getPostsContent() {
        return `
            <div class="posts-container">
                <div class="posts-list" id="posts-list">
                    <div class="loading-posts">
                        <div class="loading-spinner"></div>
                        <p>Loading posts...</p>
                    </div>
                </div>
                
                <div class="posts-pagination" id="posts-pagination">
                    <!-- Pagination will be inserted here -->
                </div>
            </div>
        `;
    }

    getCreatePostContent() {
        return `
            <div class="create-post-form">
                <div class="form-group">
                    <label for="post-title">Title *</label>
                    <input type="text" id="post-title" maxlength="200" placeholder="Enter post title...">
                    <small class="char-count" id="title-count">0/200</small>
                </div>
                
                <div class="form-group">
                    <label for="post-category">Category *</label>
                    <select id="post-category">
                        ${this.getCategoryOptions().replace('All Categories', 'Select Category')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="post-tags">Tags (optional)</label>
                    <input type="text" id="post-tags" placeholder="Enter tags separated by commas...">
                    <small>Example: strategy, tips, newbie</small>
                </div>
                
                <div class="form-group">
                    <label for="post-content">Content *</label>
                    <div class="content-editor">
                        <div class="editor-toolbar">
                            <button type="button" class="editor-btn" data-action="bold">B</button>
                            <button type="button" class="editor-btn" data-action="italic">I</button>
                            <button type="button" class="editor-btn" data-action="emoji">😀</button>
                            <button type="button" class="editor-btn" data-action="image">🖼️</button>
                        </div>
                        <textarea id="post-content" maxlength="10000" placeholder="Write your post content here...&#10;&#10;You can use emojis, upload images, and format your text!"></textarea>
                        <small class="char-count" id="content-count">0/10000</small>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="post-media">Images (optional)</label>
                    <div class="media-upload">
                        <input type="file" id="post-media" multiple accept="image/*" style="display: none;">
                        <button type="button" id="upload-media-btn" class="upload-btn">
                            📸 Add Images (Max 5)
                        </button>
                        <div id="media-preview" class="media-preview"></div>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" id="preview-post-btn" class="action-btn secondary">👁️ Preview</button>
                    <button type="button" id="create-post-btn" class="action-btn primary">✨ Create Post</button>
                </div>
            </div>
        `;
    }

    getCategoriesContent() {
        const categories = GameEngine?.systems?.forum?.categories || {};
        return `
            <div class="categories-grid">
                ${Object.entries(categories).map(([key, category]) => `
                    <div class="category-card" data-category="${key}">
                        <div class="category-header">
                            <span class="category-icon" style="color: ${category.color}">${category.icon}</span>
                            <h3>${category.name}</h3>
                        </div>
                        <p class="category-description">${category.description || 'No description available'}</p>
                        <div class="category-stats">
                            <span class="post-count" id="category-${key}-count">0 posts</span>
                            <button class="view-category-btn" data-category="${key}">View Posts</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getStatsContent() {
        return `
            <div class="forum-stats">
                <h3>📊 Forum Statistics</h3>
                <div class="stats-grid" id="forum-stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">📝</div>
                        <div class="stat-info">
                            <div class="stat-value" id="total-posts">0</div>
                            <div class="stat-label">Total Posts</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">💬</div>
                        <div class="stat-info">
                            <div class="stat-value" id="total-comments">0</div>
                            <div class="stat-label">Total Comments</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">👍</div>
                        <div class="stat-info">
                            <div class="stat-value" id="total-reactions">0</div>
                            <div class="stat-label">Total Reactions</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">💰</div>
                        <div class="stat-info">
                            <div class="stat-value" id="total-tips">$0</div>
                            <div class="stat-label">Total Tips</div>
                        </div>
                    </div>
                </div>
                
                <div class="top-posters" id="top-posters">
                    <h4>🏆 Top Contributors</h4>
                    <div class="posters-list" id="posters-list">
                        Loading...
                    </div>
                </div>
            </div>
        `;
    }

    bindInterfaceEvents() {
        const panel = document.getElementById('forum-panel');
        if (!panel) return;

        // Close button
        panel.querySelector('#close-forum')?.addEventListener('click', () => this.hide());
        
        // Tab switching
        panel.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Category filter
        const categorySelect = panel.querySelector('#category-select');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.loadPosts();
            });
        }
        
        // Search
        const searchInput = panel.querySelector('#forum-search');
        const searchBtn = panel.querySelector('#search-btn');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }
        
        // Create post form events
        this.bindCreatePostEvents();
        
        // Category cards
        panel.querySelectorAll('.view-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.currentCategory = category;
                this.switchTab('posts');
                this.loadPosts();
            });
        });
        
        // Click outside to close
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                this.hide();
            }
        });
    }

    bindCreatePostEvents() {
        const panel = document.getElementById('forum-panel');
        if (!panel) return;
        
        // Character counters
        const titleInput = panel.querySelector('#post-title');
        const contentTextarea = panel.querySelector('#post-content');
        
        if (titleInput) {
            titleInput.addEventListener('input', (e) => {
                const count = panel.querySelector('#title-count');
                if (count) {
                    count.textContent = `${e.target.value.length}/200`;
                }
            });
        }
        
        if (contentTextarea) {
            contentTextarea.addEventListener('input', (e) => {
                const count = panel.querySelector('#content-count');
                if (count) {
                    count.textContent = `${e.target.value.length}/10000`;
                }
            });
        }
        
        // Media upload
        const mediaInput = panel.querySelector('#post-media');
        const uploadBtn = panel.querySelector('#upload-media-btn');
        
        if (uploadBtn && mediaInput) {
            uploadBtn.addEventListener('click', () => {
                mediaInput.click();
            });
            
            mediaInput.addEventListener('change', (e) => {
                this.handleMediaUpload(e.target.files);
            });
        }
        
        // Editor toolbar
        panel.querySelectorAll('.editor-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleEditorAction(e.target.dataset.action);
            });
        });
        
        // Form submission
        const createBtn = panel.querySelector('#create-post-btn');
        const previewBtn = panel.querySelector('#preview-post-btn');
        
        if (createBtn) {
            createBtn.addEventListener('click', () => this.createPost());
        }
        
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewPost());
        }
    }
    switchTab(tab) {
        this.currentTab = tab;
        this.updateTabs();
        this.updateContent();
        
        if (tab === 'stats') {
            this.loadStats();
        } else if (tab === 'categories') {
            this.loadCategoryStats();
        }
    }

    updateTabs() {
        const panel = document.getElementById('forum-panel');
        if (!panel) return;

        panel.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === this.currentTab) {
                btn.classList.add('active');
            }
        });
    }

    updateContent() {
        const contentArea = document.getElementById('forum-tab-content');
        if (!contentArea) return;

        contentArea.innerHTML = this.getTabContent();
        this.bindInterfaceEvents(); // Re-bind events for new content
    }

    loadPosts() {
        const forumSystem = GameEngine?.systems?.forum;
        if (!forumSystem) {
            this.showError('Forum system not available');
            return;
        }

        const options = {
            category: this.currentCategory !== 'all' ? this.currentCategory : null,
            page: this.currentPage,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        };

        const searchInput = document.getElementById('forum-search');
        if (searchInput && searchInput.value.trim()) {
            options.search = searchInput.value.trim();
        }

        try {
            const result = forumSystem.getPosts(options);
            this.displayPosts(result);
        } catch (error) {
            this.showError('Failed to load posts: ' + error.message);
        }
    }

    displayPosts(result) {
        const container = document.getElementById('posts-list');
        if (!container) return;

        if (result.posts.length === 0) {
            container.innerHTML = `
                <div class="no-posts">
                    <h3>📭 No Posts Found</h3>
                    <p>Be the first to create a post in this category!</p>
                    <button class="action-btn" onclick="this.switchTab('create')">Create First Post</button>
                </div>
            `;
            return;
        }

        container.innerHTML = result.posts.map(post => this.renderPostCard(post)).join('');
        this.bindPostEvents();
        this.updatePagination(result);
    }

    renderPostCard(post) {
        const categories = GameEngine?.systems?.forum?.categories || {};
        const category = categories[post.category] || { name: post.category, icon: '📝', color: '#666' };
        const authorName = this.getNationName(post.authorId);
        const timeAgo = this.getTimeAgo(post.createdAt);
        
        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-category" style="color: ${category.color}">
                        ${category.icon} ${category.name}
                    </div>
                    <div class="post-meta">
                        <span class="post-author">👑 ${authorName}</span>
                        <span class="post-time">${timeAgo}</span>
                        ${post.editedAt ? '<span class="edited-indicator">(edited)</span>' : ''}
                    </div>
                </div>
                
                <div class="post-content">
                    <h3 class="post-title">${this.escapeHtml(post.title)}</h3>
                    <div class="post-preview">
                        ${this.formatContent(post.content, 200)}
                    </div>
                    
                    ${post.media && post.media.length > 0 ? `
                    <div class="post-media-preview">
                        ${post.media.slice(0, 2).map(media => 
                            `<img src="${media.url}" alt="Post media" class="media-thumbnail">`
                        ).join('')}
                        ${post.media.length > 2 ? `<span class="more-media">+${post.media.length - 2} more</span>` : ''}
                    </div>
                    ` : ''}
                    
                    ${post.tags && post.tags.length > 0 ? `
                    <div class="post-tags">
                        ${post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                    </div>
                    ` : ''}
                </div>
                
                <div class="post-footer">
                    <div class="post-stats">
                        <span class="stat">👁️ ${post.views}</span>
                        <span class="stat">💬 ${post.commentCount}</span>
                        <span class="stat">👍 ${this.getTotalReactions(post.reactions)}</span>
                    </div>
                    
                    <div class="post-actions">
                        <button class="action-btn small" data-action="view" data-post-id="${post.id}">
                            📖 Read More
                        </button>
                        <button class="action-btn small" data-action="react" data-post-id="${post.id}">
                            ${this.getUserReaction(post.reactions) || '👍'} React
                        </button>
                        <button class="action-btn small" data-action="tip" data-post-id="${post.id}">
                            💰 Tip
                        </button>
                        ${this.canEditPost(post) ? `
                        <button class="action-btn small warning" data-action="edit" data-post-id="${post.id}">
                            ✏️ Edit
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    bindPostEvents() {
        const container = document.getElementById('posts-list');
        if (!container) return;

        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const postId = e.target.dataset.postId;
                this.handlePostAction(action, postId);
            });
        });
    }

    handlePostAction(action, postId) {
        switch (action) {
            case 'view':
                this.viewPost(postId);
                break;
            case 'react':
                this.showReactionPicker(postId, 'post');
                break;
            case 'tip':
                this.showTipModal(postId, 'post');
                break;
            case 'edit':
                this.editPost(postId);
                break;
        }
    }

    viewPost(postId) {
        const forumSystem = GameEngine?.systems?.forum;
        if (!forumSystem) return;

        try {
            const post = forumSystem.getPost(postId);
            if (!post) {
                this.showError('Post not found');
                return;
            }

            this.currentPost = post;
            this.showPostDetails(post);
        } catch (error) {
            this.showError('Failed to load post: ' + error.message);
        }
    }

    showPostDetails(post) {
        const contentArea = document.getElementById('forum-tab-content');
        if (!contentArea) return;

        contentArea.innerHTML = this.renderFullPost(post);
        this.bindPostDetailEvents();
    }

    renderFullPost(post) {
        const categories = GameEngine?.systems?.forum?.categories || {};
        const category = categories[post.category] || { name: post.category, icon: '📝', color: '#666' };
        const authorName = this.getNationName(post.authorId);
        const timeAgo = this.getTimeAgo(post.createdAt);
        
        return `
            <div class="post-detail">
                <div class="post-detail-header">
                    <button class="back-btn" id="back-to-posts">← Back to Posts</button>
                    <div class="post-category" style="color: ${category.color}">
                        ${category.icon} ${category.name}
                    </div>
                </div>
                
                <div class="post-main">
                    <h1 class="post-title">${this.escapeHtml(post.title)}</h1>
                    
                    <div class="post-meta">
                        <span class="post-author">👑 ${authorName}</span>
                        <span class="post-time">${timeAgo}</span>
                        <span class="post-views">👁️ ${post.views} views</span>
                        ${post.editedAt ? `<span class="edited-info">Edited ${this.getTimeAgo(post.editedAt)}</span>` : ''}
                    </div>
                    
                    <div class="post-content-full">
                        ${this.formatContent(post.content)}
                    </div>
                    
                    ${post.media && post.media.length > 0 ? `
                    <div class="post-media">
                        ${post.media.map(media => 
                            `<img src="${media.url}" alt="Post media" class="post-image" onclick="this.showImageModal('${media.url}')">`
                        ).join('')}
                    </div>
                    ` : ''}
                    
                    ${post.tags && post.tags.length > 0 ? `
                    <div class="post-tags">
                        ${post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                    </div>
                    ` : ''}
                    
                    <div class="post-reactions">
                        <h4>Reactions</h4>
                        <div class="reactions-display">
                            ${this.renderReactions(post.reactions, post.id, 'post')}
                        </div>
                    </div>
                    
                    <div class="post-actions-full">
                        <button class="action-btn" data-action="react" data-post-id="${post.id}">
                            👍 Add Reaction
                        </button>
                        <button class="action-btn" data-action="tip" data-post-id="${post.id}">
                            💰 Tip Author
                        </button>
                        ${this.canEditPost(post) ? `
                        <button class="action-btn warning" data-action="edit" data-post-id="${post.id}">
                            ✏️ Edit Post
                        </button>
                        <button class="action-btn danger" data-action="delete" data-post-id="${post.id}">
                            🗑️ Delete Post
                        </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="comments-section">
                    <h3>💬 Comments (${post.commentCount})</h3>
                    
                    <div class="comment-form">
                        <textarea id="new-comment-content" placeholder="Write a comment..." maxlength="5000"></textarea>
                        <div class="comment-form-actions">
                            <button id="add-comment-btn" class="action-btn">💬 Add Comment</button>
                        </div>
                    </div>
                    
                    <div class="comments-list">
                        ${post.comments && post.comments.length > 0 ? 
                            post.comments.map(comment => this.renderComment(comment)).join('') : 
                            '<p class="no-comments">No comments yet. Be the first to comment!</p>'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    renderComment(comment) {
        const authorName = this.getNationName(comment.authorId);
        const timeAgo = this.getTimeAgo(comment.createdAt);
        
        return `
            <div class="comment" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <span class="comment-author">👑 ${authorName}</span>
                    <span class="comment-time">${timeAgo}</span>
                    ${comment.editedAt ? '<span class="edited-indicator">(edited)</span>' : ''}
                </div>
                
                <div class="comment-content">
                    ${this.formatContent(comment.content)}
                    
                    ${comment.media && comment.media.length > 0 ? `
                    <div class="comment-media">
                        ${comment.media.map(media => 
                            `<img src="${media.url}" alt="Comment media" class="comment-image">`
                        ).join('')}
                    </div>
                    ` : ''}
                </div>
                
                <div class="comment-reactions">
                    ${this.renderReactions(comment.reactions, comment.id, 'comment')}
                </div>
                
                <div class="comment-actions">
                    <button class="comment-btn" data-action="react" data-comment-id="${comment.id}">
                        👍 React
                    </button>
                    <button class="comment-btn" data-action="reply" data-comment-id="${comment.id}">
                        💬 Reply
                    </button>
                    <button class="comment-btn" data-action="tip" data-comment-id="${comment.id}">
                        💰 Tip
                    </button>
                    ${this.canEditComment(comment) ? `
                    <button class="comment-btn warning" data-action="edit" data-comment-id="${comment.id}">
                        ✏️ Edit
                    </button>
                    <button class="comment-btn danger" data-action="delete" data-comment-id="${comment.id}">
                        🗑️ Delete
                    </button>
                    ` : ''}
                </div>
                
                ${comment.replies && comment.replies.length > 0 ? `
                <div class="comment-replies">
                    ${comment.replies.map(reply => this.renderComment(reply)).join('')}
                </div>
                ` : ''}
            </div>
        `;
    }

    renderReactions(reactions, targetId, targetType) {
        if (!reactions || Object.keys(reactions).length === 0) {
            return '<div class="no-reactions">No reactions yet</div>';
        }

        const reactionTypes = GameEngine?.systems?.forum?.reactionTypes || {};
        
        return Object.entries(reactions).map(([type, users]) => {
            const reactionDef = reactionTypes[type];
            if (!reactionDef || users.length === 0) return '';
            
            const isUserReaction = this.isCurrentUserReaction(users);
            
            return `
                <button class="reaction-btn ${isUserReaction ? 'active' : ''}" 
                        data-reaction="${type}" 
                        data-target-id="${targetId}" 
                        data-target-type="${targetType}">
                    <span class="reaction-emoji">${reactionDef.emoji}</span>
                    <span class="reaction-count">${users.length}</span>
                </button>
            `;
        }).join('');
    }
    bindPostDetailEvents() {
        const contentArea = document.getElementById('forum-tab-content');
        if (!contentArea) return;

        // Back button
        const backBtn = contentArea.querySelector('#back-to-posts');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.currentPost = null;
                this.switchTab('posts');
                this.loadPosts();
            });
        }

        // Add comment
        const addCommentBtn = contentArea.querySelector('#add-comment-btn');
        if (addCommentBtn) {
            addCommentBtn.addEventListener('click', () => this.addComment());
        }

        // Post actions
        contentArea.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const postId = e.target.dataset.postId;
                const commentId = e.target.dataset.commentId;
                
                if (postId) {
                    this.handlePostAction(action, postId);
                } else if (commentId) {
                    this.handleCommentAction(action, commentId);
                }
            });
        });

        // Reaction buttons
        contentArea.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reaction = e.target.closest('.reaction-btn').dataset.reaction;
                const targetId = e.target.closest('.reaction-btn').dataset.targetId;
                const targetType = e.target.closest('.reaction-btn').dataset.targetType;
                this.toggleReaction(targetId, targetType, reaction);
            });
        });
    }

    handleCommentAction(action, commentId) {
        switch (action) {
            case 'react':
                this.showReactionPicker(commentId, 'comment');
                break;
            case 'reply':
                this.showReplyForm(commentId);
                break;
            case 'tip':
                this.showTipModal(commentId, 'comment');
                break;
            case 'edit':
                this.editComment(commentId);
                break;
            case 'delete':
                this.deleteComment(commentId);
                break;
        }
    }

    addComment() {
        const contentTextarea = document.getElementById('new-comment-content');
        if (!contentTextarea || !this.currentPost) return;

        const content = contentTextarea.value.trim();
        if (!content) {
            this.showError('Comment content cannot be empty');
            return;
        }

        const forumSystem = GameEngine?.systems?.forum;
        if (!forumSystem) return;

        try {
            const currentUser = this.getCurrentUser();
            forumSystem.createComment({
                authorId: currentUser.id,
                postId: this.currentPost.id,
                content: content,
                media: []
            });

            contentTextarea.value = '';
            this.viewPost(this.currentPost.id); // Refresh post view
        } catch (error) {
            this.showError('Failed to add comment: ' + error.message);
        }
    }

    createPost() {
        const form = document.getElementById('forum-panel');
        if (!form) return;

        const title = form.querySelector('#post-title')?.value?.trim();
        const category = form.querySelector('#post-category')?.value;
        const content = form.querySelector('#post-content')?.value?.trim();
        const tagsInput = form.querySelector('#post-tags')?.value?.trim();

        if (!title || !content || !category) {
            this.showError('Title, category, and content are required');
            return;
        }

        if (category === 'Select Category') {
            this.showError('Please select a valid category');
            return;
        }

        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag) : [];
        const media = this.getUploadedMedia();

        const forumSystem = GameEngine?.systems?.forum;
        if (!forumSystem) return;

        try {
            const currentUser = this.getCurrentUser();
            const postId = forumSystem.createPost({
                authorId: currentUser.id,
                title: title,
                content: content,
                category: category,
                tags: tags,
                media: media
            });

            this.showSuccess('Post created successfully!');
            this.clearCreateForm();
            this.switchTab('posts');
            this.loadPosts();
        } catch (error) {
            this.showError('Failed to create post: ' + error.message);
        }
    }

    showReactionPicker(targetId, targetType) {
        const reactionTypes = GameEngine?.systems?.forum?.reactionTypes || {};
        
        const picker = document.createElement('div');
        picker.className = 'reaction-picker';
        picker.innerHTML = `
            <div class="reaction-picker-content">
                <h4>Choose Reaction</h4>
                <div class="reactions-grid">
                    ${Object.entries(reactionTypes).map(([key, reaction]) => `
                        <button class="reaction-option" 
                                data-reaction="${key}" 
                                data-target-id="${targetId}" 
                                data-target-type="${targetType}">
                            <span class="reaction-emoji">${reaction.emoji}</span>
                            <span class="reaction-name">${reaction.name}</span>
                        </button>
                    `).join('')}
                </div>
                <button class="close-picker">Cancel</button>
            </div>
        `;

        document.body.appendChild(picker);

        // Bind events
        picker.querySelectorAll('.reaction-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reaction = e.target.closest('.reaction-option').dataset.reaction;
                const tId = e.target.closest('.reaction-option').dataset.targetId;
                const tType = e.target.closest('.reaction-option').dataset.targetType;
                this.addReaction(tId, tType, reaction);
                picker.remove();
            });
        });

        picker.querySelector('.close-picker')?.addEventListener('click', () => {
            picker.remove();
        });

        // Close on outside click
        picker.addEventListener('click', (e) => {
            if (e.target === picker) {
                picker.remove();
            }
        });
    }

    showTipModal(targetId, targetType) {
        const modal = document.createElement('div');
        modal.className = 'tip-modal modal-overlay';
        modal.innerHTML = `
            <div class="modal-content tip-content">
                <div class="modal-header">
                    <h3>💰 Send Tip</h3>
                    <button class="close-btn">✕</button>
                </div>
                
                <div class="tip-form">
                    <div class="form-group">
                        <label for="tip-amount">Amount ($)</label>
                        <input type="number" id="tip-amount" min="1" max="${this.getCurrentUserMoney()}" placeholder="Enter amount">
                        <small>Your balance: $${this.formatNumber(this.getCurrentUserMoney())}</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="tip-message">Message (optional)</label>
                        <textarea id="tip-message" placeholder="Add a message with your tip..." maxlength="200"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button id="send-tip-btn" class="action-btn primary" 
                                data-target-id="${targetId}" 
                                data-target-type="${targetType}">
                            💰 Send Tip
                        </button>
                        <button id="cancel-tip-btn" class="action-btn secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind events
        const sendBtn = modal.querySelector('#send-tip-btn');
        const cancelBtn = modal.querySelector('#cancel-tip-btn');
        const closeBtn = modal.querySelector('.close-btn');

        sendBtn?.addEventListener('click', () => {
            this.sendTip(targetId, targetType, modal);
        });

        cancelBtn?.addEventListener('click', () => modal.remove());
        closeBtn?.addEventListener('click', () => modal.remove());
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    sendTip(targetId, targetType, modal) {
        const amountInput = modal.querySelector('#tip-amount');
        const messageInput = modal.querySelector('#tip-message');

        const amount = parseInt(amountInput?.value || 0);
        const message = messageInput?.value?.trim() || '';

        if (amount < 1) {
            this.showError('Tip amount must be at least $1');
            return;
        }

        if (amount > this.getCurrentUserMoney()) {
            this.showError('Insufficient funds');
            return;
        }

        const forumSystem = GameEngine?.systems?.forum;
        if (!forumSystem) return;

        try {
            let toUserId;
            if (targetType === 'post') {
                const post = Array.from(forumSystem.posts.values()).find(p => p.id === targetId);
                toUserId = post?.authorId;
            } else if (targetType === 'comment') {
                const comment = Array.from(forumSystem.comments.values()).find(c => c.id === targetId);
                toUserId = comment?.authorId;
            }

            if (!toUserId) {
                this.showError('Recipient not found');
                return;
            }

            const currentUser = this.getCurrentUser();
            forumSystem.sendTip({
                fromUserId: currentUser.id,
                toUserId: toUserId,
                targetId: targetId,
                targetType: targetType,
                amount: amount,
                message: message
            });

            this.showSuccess(`Tip of $${amount} sent successfully!`);
            modal.remove();

            // Refresh the current view
            if (this.currentPost) {
                this.viewPost(this.currentPost.id);
            } else {
                this.loadPosts();
            }
        } catch (error) {
            this.showError('Failed to send tip: ' + error.message);
        }
    }

    addReaction(targetId, targetType, reactionType) {
        const forumSystem = GameEngine?.systems?.forum;
        if (!forumSystem) return;

        try {
            const currentUser = this.getCurrentUser();
            forumSystem.addReaction({
                userId: currentUser.id,
                targetId: targetId,
                targetType: targetType,
                reactionType: reactionType
            });

            // Refresh current view
            if (this.currentPost) {
                this.viewPost(this.currentPost.id);
            } else {
                this.loadPosts();
            }
        } catch (error) {
            this.showError('Failed to add reaction: ' + error.message);
        }
    }

    toggleReaction(targetId, targetType, reactionType) {
        const forumSystem = GameEngine?.systems?.forum;
        if (!forumSystem) return;

        try {
            const currentUser = this.getCurrentUser();
            
            // Check if user already has this reaction
            let target;
            if (targetType === 'post') {
                target = Array.from(forumSystem.posts.values()).find(p => p.id === targetId);
            } else if (targetType === 'comment') {
                target = Array.from(forumSystem.comments.values()).find(c => c.id === targetId);
            }

            if (target && target.reactions && target.reactions[reactionType] && 
                target.reactions[reactionType].includes(currentUser.id)) {
                // Remove reaction
                forumSystem.removeReaction({
                    userId: currentUser.id,
                    targetId: targetId,
                    targetType: targetType
                });
            } else {
                // Add reaction
                forumSystem.addReaction({
                    userId: currentUser.id,
                    targetId: targetId,
                    targetType: targetType,
                    reactionType: reactionType
                });
            }

            // Refresh current view
            if (this.currentPost) {
                this.viewPost(this.currentPost.id);
            } else {
                this.loadPosts();
            }
        } catch (error) {
            this.showError('Failed to toggle reaction: ' + error.message);
        }
    }

    // Utility methods
    getCurrentUser() {
        const nation = GameEngine?.currentNation || DataManager?.currentNation;
        return { id: nation?.id || 'player1', name: nation?.name || 'Player' };
    }

    getCurrentUserMoney() {
        const nation = GameEngine?.currentNation || DataManager?.currentNation;
        return nation?.money || 0;
    }

    getNationName(userId) {
        if (userId === 'system') return 'System';
        const nation = GameEngine?.currentNation || DataManager?.currentNation;
        return nation && nation.id === userId ? nation.name : `Nation ${userId}`;
    }

    canEditPost(post) {
        const currentUser = this.getCurrentUser();
        return post.authorId === currentUser.id;
    }

    canEditComment(comment) {
        const currentUser = this.getCurrentUser();
        return comment.authorId === currentUser.id;
    }

    getTotalReactions(reactions) {
        if (!reactions) return 0;
        return Object.values(reactions).reduce((total, users) => total + users.length, 0);
    }

    getUserReaction(reactions) {
        if (!reactions) return null;
        const currentUser = this.getCurrentUser();
        
        for (const [type, users] of Object.entries(reactions)) {
            if (users.includes(currentUser.id)) {
                const reactionTypes = GameEngine?.systems?.forum?.reactionTypes || {};
                return reactionTypes[type]?.emoji || '👍';
            }
        }
        return null;
    }

    isCurrentUserReaction(users) {
        const currentUser = this.getCurrentUser();
        return users.includes(currentUser.id);
    }

    formatContent(content, maxLength = null) {
        let formatted = this.escapeHtml(content);
        
        // Convert line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Convert URLs to links
        formatted = formatted.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener">$1</a>'
        );
        
        // Truncate if needed
        if (maxLength && formatted.length > maxLength) {
            formatted = formatted.substring(0, maxLength) + '...';
        }
        
        return formatted;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    showSuccess(message) {
        EventBus.emit('show_notification', { message, type: 'success' });
    }

    showError(message) {
        EventBus.emit('show_notification', { message, type: 'error' });
    }

    refreshPosts() {
        if (this.currentTab === 'posts') {
            this.loadPosts();
        }
    }

    refreshCurrentPost() {
        if (this.currentPost) {
            this.viewPost(this.currentPost.id);
        }
    }

    refreshReactions() {
        // Refresh reactions in current view
        this.refreshCurrentPost();
    }

    destroy() {
        this.hide();
        this.currentPost = null;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ForumPanel };
}