/**
 * Messaging Panel - Live Chat and Private Messages Interface
 * Empire Builder - Nation Building Strategy Game
 */

class MessagingPanel {
    constructor() {
        this.isVisible = false;
        this.currentChannel = 'world';
        this.currentConversation = null;
        this.isTyping = false;
        this.typingTimeout = null;
        this.messagePollingInterval = null;
        this.bindEvents();
    }

    bindEvents() {
        EventBus.on('show_messaging_panel', this.show.bind(this));
        EventBus.on('hide_messaging_panel', this.hide.bind(this));
        EventBus.on('message_sent', this.handleNewMessage.bind(this));
        EventBus.on('typing_start', this.handleTypingStart.bind(this));
        EventBus.on('typing_stop', this.handleTypingStop.bind(this));
        EventBus.on('user_online', this.handleUserOnline.bind(this));
        EventBus.on('user_offline', this.handleUserOffline.bind(this));
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    show(data = {}) {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.currentChannel = data.channel || 'world';
        this.currentConversation = data.conversationId || null;
        
        this.createInterface();
        this.loadConversations();
        this.loadCurrentChat();
        this.startPolling();
        
        // Mark user as online
        const messagingSystem = GameEngine?.systems?.messaging;
        if (messagingSystem) {
            const currentUser = this.getCurrentUser();
            messagingSystem.setUserOnline(currentUser.id);
        }
        
        EventBus.emit('modal_opened', { type: 'messaging_panel' });
    }

    hide() {
        if (!this.isVisible) return;
        
        const panel = document.getElementById('messaging-panel');
        if (panel) {
            panel.remove();
        }
        
        this.stopPolling();
        this.stopTyping();
        
        // Mark user as offline
        const messagingSystem = GameEngine?.systems?.messaging;
        if (messagingSystem) {
            const currentUser = this.getCurrentUser();
            messagingSystem.setUserOffline(currentUser.id);
        }
        
        this.isVisible = false;
        this.currentConversation = null;
        EventBus.emit('modal_closed', { type: 'messaging_panel' });
    }

    createInterface() {
        if (document.getElementById('messaging-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'messaging-panel';
        panel.className = 'messaging-panel modal-overlay';
        
        panel.innerHTML = this.getInterfaceHTML();
        document.body.appendChild(panel);
        
        this.bindInterfaceEvents();
    }

    getInterfaceHTML() {
        return `
            <div class="modal-content messaging-content">
                <div class="modal-header">
                    <h2>💬 Messages & Chat</h2>
                    <div class="messaging-header-controls">
                        <div class="online-indicator">
                            <span class="online-dot"></span>
                            <span id="online-count">0 online</span>
                        </div>
                        <button class="close-btn" id="close-messaging">✕</button>
                    </div>
                </div>
                
                <div class="messaging-layout">
                    <!-- Sidebar with conversations -->
                    <div class="messaging-sidebar">
                        <div class="sidebar-header">
                            <h3>Conversations</h3>
                            <button id="new-conversation-btn" class="mini-btn">+ New</button>
                        </div>
                        
                        <div class="channel-tabs">
                            <button class="channel-tab ${this.currentChannel === 'world' ? 'active' : ''}" 
                                    data-channel="world">
                                🌍 World Chat
                            </button>
                            <button class="channel-tab ${this.currentChannel === 'alliance' ? 'active' : ''}" 
                                    data-channel="alliance">
                                🏴 Alliance Chat
                            </button>
                            <button class="channel-tab ${this.currentChannel === 'private' ? 'active' : ''}" 
                                    data-channel="private">
                                👤 Private Messages
                            </button>
                        </div>
                        
                        <div class="conversations-list" id="conversations-list">
                            <div class="loading-conversations">Loading conversations...</div>
                        </div>
                    </div>
                    
                    <!-- Main chat area -->
                    <div class="messaging-main">
                        <div class="chat-header" id="chat-header">
                            <div class="chat-info">
                                <h3 id="chat-title">Select a conversation</h3>
                                <span id="chat-subtitle"></span>
                            </div>
                            <div class="chat-controls">
                                <button id="chat-settings-btn" class="chat-btn">⚙️</button>
                                <button id="chat-info-btn" class="chat-btn">ℹ️</button>
                            </div>
                        </div>
                        
                        <div class="messages-area" id="messages-area">
                            <div class="no-chat-selected">
                                <h3>💬 Welcome to Messaging</h3>
                                <p>Select a conversation or channel to start chatting</p>
                                <div class="quick-actions">
                                    <button class="quick-action-btn" data-channel="world">
                                        🌍 Join World Chat
                                    </button>
                                    <button class="quick-action-btn" data-channel="alliance">
                                        🏴 Open Alliance Chat
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="typing-indicators" id="typing-indicators">
                            <!-- Typing indicators will appear here -->
                        </div>
                        
                        <div class="message-input-area" id="message-input-area">
                            <div class="message-compose">
                                <div class="compose-toolbar">
                                    <button class="compose-btn" id="emoji-btn" title="Add Emoji">😀</button>
                                    <button class="compose-btn" id="tip-btn" title="Send Tip">💰</button>
                                    <button class="compose-btn" id="image-btn" title="Add Image">🖼️</button>
                                </div>
                                
                                <div class="message-input-container">
                                    <textarea id="message-input" 
                                              placeholder="Type your message..." 
                                              maxlength="2000" 
                                              rows="2"></textarea>
                                    <button id="send-message-btn" class="send-btn" disabled>
                                        <span class="send-icon">📤</span>
                                    </button>
                                </div>
                                
                                <div class="message-info">
                                    <span id="character-count">0/2000</span>
                                    <span class="message-tips">Press Ctrl+Enter to send</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Emoji picker -->
                <div class="emoji-picker" id="emoji-picker" style="display: none;">
                    <div class="emoji-categories">
                        <button class="emoji-category-btn active" data-category="faces">😀</button>
                        <button class="emoji-category-btn" data-category="reactions">👍</button>
                        <button class="emoji-category-btn" data-category="objects">⚔️</button>
                        <button class="emoji-category-btn" data-category="nations">🏛️</button>
                    </div>
                    <div class="emoji-grid" id="emoji-grid">
                        ${this.getEmojiGrid('faces')}
                    </div>
                </div>
            </div>
        `;
    }

    getEmojiGrid(category) {
        const messagingSystem = GameEngine?.systems?.messaging;
        if (!messagingSystem) return '';
        
        const emojis = messagingSystem.emojiSets[category] || [];
        return emojis.map(emoji => 
            `<button class="emoji-option" data-emoji="${emoji}">${emoji}</button>`
        ).join('');
    }

    bindInterfaceEvents() {
        const panel = document.getElementById('messaging-panel');
        if (!panel) return;

        // Close button
        panel.querySelector('#close-messaging')?.addEventListener('click', () => this.hide());
        
        // Channel tabs
        panel.querySelectorAll('.channel-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const channel = e.target.dataset.channel;
                this.switchChannel(channel);
            });
        });
        
        // Quick action buttons
        panel.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const channel = e.target.dataset.channel;
                this.switchChannel(channel);
            });
        });
        
        // Message input
        const messageInput = panel.querySelector('#message-input');
        const sendBtn = panel.querySelector('#send-message-btn');
        const charCount = panel.querySelector('#character-count');
        
        if (messageInput) {
            messageInput.addEventListener('input', (e) => {
                const length = e.target.value.length;
                if (charCount) {
                    charCount.textContent = `${length}/2000`;
                }
                
                if (sendBtn) {
                    sendBtn.disabled = length === 0;
                }
                
                this.handleTypingInput();
            });
            
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
        
        // Send button
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        // Emoji picker
        const emojiBtn = panel.querySelector('#emoji-btn');
        const emojiPicker = panel.querySelector('#emoji-picker');
        
        if (emojiBtn && emojiPicker) {
            emojiBtn.addEventListener('click', () => {
                emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
            });
        }
        
        // Emoji category buttons
        panel.querySelectorAll('.emoji-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.switchEmojiCategory(category);
            });
        });
        
        // Emoji selection
        this.bindEmojiEvents();
        
        // Tip button
        const tipBtn = panel.querySelector('#tip-btn');
        if (tipBtn) {
            tipBtn.addEventListener('click', () => this.showTipModal());
        }
        
        // New conversation button
        const newConvBtn = panel.querySelector('#new-conversation-btn');
        if (newConvBtn) {
            newConvBtn.addEventListener('click', () => this.showNewConversationModal());
        }
        
        // Click outside to close
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                this.hide();
            }
        });
    }

    bindEmojiEvents() {
        const panel = document.getElementById('messaging-panel');
        if (!panel) return;
        
        panel.querySelectorAll('.emoji-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emoji = e.target.dataset.emoji;
                this.insertEmoji(emoji);
            });
        });
    }

    switchChannel(channel) {
        this.currentChannel = channel;
        this.currentConversation = null;
        
        // Update active tab
        const panel = document.getElementById('messaging-panel');
        if (panel) {
            panel.querySelectorAll('.channel-tab').forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.channel === channel) {
                    tab.classList.add('active');
                }
            });
        }
        
        this.loadConversations();
        
        if (channel === 'world' || channel === 'alliance') {
            this.loadChannelChat(channel);
        } else {
            this.showNoSelection();
        }
    }

    loadConversations() {
        const messagingSystem = GameEngine?.systems?.messaging;
        if (!messagingSystem) return;
        
        const listContainer = document.getElementById('conversations-list');
        if (!listContainer) return;
        
        try {
            const currentUser = this.getCurrentUser();
            const conversations = messagingSystem.getUserConversations(currentUser.id);
            
            let filteredConversations = conversations;
            
            if (this.currentChannel === 'private') {
                filteredConversations = conversations.filter(c => c.type === 'private');
            } else if (this.currentChannel === 'alliance') {
                filteredConversations = conversations.filter(c => c.type === 'alliance');
            } else if (this.currentChannel === 'world') {
                filteredConversations = conversations.filter(c => c.type === 'public' || c.id === 'world');
            }
            
            if (filteredConversations.length === 0) {
                listContainer.innerHTML = `
                    <div class="no-conversations">
                        <p>No conversations yet</p>
                        ${this.currentChannel === 'private' ? 
                            '<button class="start-conversation-btn">Start Private Chat</button>' : 
                            ''
                        }
                    </div>
                `;
                return;
            }
            
            listContainer.innerHTML = filteredConversations.map(conv => this.renderConversationItem(conv)).join('');
            this.bindConversationEvents();
        } catch (error) {
            listContainer.innerHTML = '<div class="error">Failed to load conversations</div>';
        }
    }

    renderConversationItem(conversation) {
        const isActive = this.currentConversation === conversation.id;
        const unreadBadge = conversation.unreadCount > 0 ? 
            `<span class="unread-badge">${conversation.unreadCount}</span>` : '';
        
        let displayName = conversation.name;
        let subtitle = '';
        
        if (conversation.type === 'private') {
            const otherUserId = conversation.participants.find(id => id !== this.getCurrentUser().id);
            displayName = this.getNationName(otherUserId);
            subtitle = 'Private Chat';
        } else if (conversation.type === 'alliance') {
            subtitle = 'Alliance Members Only';
        } else if (conversation.id === 'world') {
            subtitle = 'All Players';
        }
        
        const lastMessageTime = conversation.lastMessage ? 
            this.getTimeAgo(conversation.lastMessage.timestamp) : '';
        
        return `
            <div class="conversation-item ${isActive ? 'active' : ''}" 
                 data-conversation-id="${conversation.id}">
                <div class="conversation-avatar">
                    ${this.getConversationIcon(conversation)}
                </div>
                <div class="conversation-info">
                    <div class="conversation-name">${displayName}</div>
                    <div class="conversation-subtitle">${subtitle}</div>
                    ${conversation.lastMessage ? `
                    <div class="last-message">
                        ${this.formatMessagePreview(conversation.lastMessage.content)}
                    </div>
                    ` : ''}
                </div>
                <div class="conversation-meta">
                    ${lastMessageTime ? `<div class="last-message-time">${lastMessageTime}</div>` : ''}
                    ${unreadBadge}
                </div>
            </div>
        `;
    }

    getConversationIcon(conversation) {
        if (conversation.type === 'private') return '👤';
        if (conversation.type === 'alliance') return '🏴';
        if (conversation.id === 'world') return '🌍';
        return '💬';
    }

    bindConversationEvents() {
        const listContainer = document.getElementById('conversations-list');
        if (!listContainer) return;
        
        listContainer.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const conversationId = item.dataset.conversationId;
                this.loadConversation(conversationId);
            });
        });
    }
    loadConversation(conversationId) {
        this.currentConversation = conversationId;
        
        // Update active conversation
        const listContainer = document.getElementById('conversations-list');
        if (listContainer) {
            listContainer.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.conversationId === conversationId) {
                    item.classList.add('active');
                }
            });
        }
        
        const messagingSystem = GameEngine?.systems?.messaging;
        if (!messagingSystem) return;
        
        try {
            const currentUser = this.getCurrentUser();
            const conversation = messagingSystem.getConversation(conversationId, {
                limit: 50,
                markAsRead: true,
                userId: currentUser.id
            });
            
            if (!conversation) {
                this.showError('Conversation not found');
                return;
            }
            
            this.displayConversation(conversation);
        } catch (error) {
            this.showError('Failed to load conversation: ' + error.message);
        }
    }

    loadChannelChat(channelId) {
        this.currentConversation = channelId;
        
        const messagingSystem = GameEngine?.systems?.messaging;
        if (!messagingSystem) return;
        
        try {
            let conversation = messagingSystem.getConversation(channelId);
            
            if (!conversation) {
                // Create channel conversation
                conversation = messagingSystem.createChannelConversation(channelId);
            }
            
            const currentUser = this.getCurrentUser();
            const fullConversation = messagingSystem.getConversation(channelId, {
                limit: 50,
                markAsRead: true,
                userId: currentUser.id
            });
            
            this.displayConversation(fullConversation);
        } catch (error) {
            this.showError('Failed to load channel: ' + error.message);
        }
    }

    displayConversation(conversation) {
        const messagesArea = document.getElementById('messages-area');
        const chatHeader = document.getElementById('chat-header');
        const inputArea = document.getElementById('message-input-area');
        
        if (!messagesArea || !chatHeader) return;
        
        // Update chat header
        this.updateChatHeader(conversation);
        
        // Display messages
        messagesArea.innerHTML = `
            <div class="messages-container" id="messages-container">
                <div class="messages-list">
                    ${conversation.messages && conversation.messages.length > 0 ? 
                        conversation.messages.map(message => this.renderMessage(message)).join('') : 
                        '<div class="no-messages">No messages yet. Start the conversation!</div>'
                    }
                </div>
            </div>
        `;
        
        // Show input area
        if (inputArea) {
            inputArea.style.display = 'block';
        }
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Bind message events
        this.bindMessageEvents();
    }

    updateChatHeader(conversation) {
        const chatTitle = document.getElementById('chat-title');
        const chatSubtitle = document.getElementById('chat-subtitle');
        
        if (!chatTitle || !chatSubtitle) return;
        
        let title = conversation.name || 'Unknown';
        let subtitle = '';
        
        if (conversation.type === 'private') {
            const currentUser = this.getCurrentUser();
            const otherUserId = conversation.participants?.find(id => id !== currentUser.id);
            title = this.getNationName(otherUserId);
            subtitle = 'Private Chat';
        } else if (conversation.id === 'world') {
            title = '🌍 World Chat';
            subtitle = 'Global chat for all players';
        } else if (conversation.id === 'alliance') {
            title = '🏴 Alliance Chat';
            subtitle = 'Private chat for alliance members';
        }
        
        chatTitle.textContent = title;
        chatSubtitle.textContent = subtitle;
    }

    renderMessage(message) {
        const isCurrentUser = message.senderId === this.getCurrentUser().id;
        const isSystem = message.senderId === 'system';
        const messageClass = isCurrentUser ? 'message-own' : (isSystem ? 'message-system' : 'message-other');
        
        const senderName = isSystem ? 'System' : this.getNationName(message.senderId);
        const timeFormatted = new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        let messageContent = this.formatMessageContent(message.content);
        
        // Handle different message types
        if (message.type === 'tip') {
            messageContent = `💰 ${messageContent}`;
        } else if (message.type === 'system') {
            messageContent = `ℹ️ ${messageContent}`;
        }
        
        return `
            <div class="message ${messageClass}" data-message-id="${message.id}">
                <div class="message-header">
                    <span class="message-sender">${senderName}</span>
                    <span class="message-time">${timeFormatted}</span>
                    ${message.edited ? '<span class="message-edited">(edited)</span>' : ''}
                </div>
                
                <div class="message-content">
                    ${messageContent}
                    
                    ${message.attachments && message.attachments.length > 0 ? `
                    <div class="message-attachments">
                        ${message.attachments.map(att => 
                            `<img src="${att.url}" alt="Attachment" class="message-image">`
                        ).join('')}
                    </div>
                    ` : ''}
                </div>
                
                ${!isSystem ? `
                <div class="message-reactions">
                    ${this.renderMessageReactions(message.reactions, message.id)}
                </div>
                
                <div class="message-actions">
                    <button class="message-action-btn" data-action="react" data-message-id="${message.id}">
                        👍
                    </button>
                    ${!isCurrentUser ? `
                    <button class="message-action-btn" data-action="tip" data-message-id="${message.id}">
                        💰
                    </button>
                    ` : ''}
                    ${isCurrentUser && Date.now() - message.timestamp < 900000 ? `
                    <button class="message-action-btn" data-action="edit" data-message-id="${message.id}">
                        ✏️
                    </button>
                    <button class="message-action-btn" data-action="delete" data-message-id="${message.id}">
                        🗑️
                    </button>
                    ` : ''}
                </div>
                ` : ''}
            </div>
        `;
    }

    renderMessageReactions(reactions, messageId) {
        if (!reactions || Object.keys(reactions).length === 0) {
            return '';
        }

        const messagingSystem = GameEngine?.systems?.messaging;
        if (!messagingSystem) return '';
        
        return Object.entries(reactions).map(([emoji, users]) => {
            if (users.length === 0) return '';
            
            const isUserReaction = users.includes(this.getCurrentUser().id);
            
            return `
                <button class="message-reaction ${isUserReaction ? 'active' : ''}" 
                        data-emoji="${emoji}" 
                        data-message-id="${messageId}">
                    <span class="reaction-emoji">${emoji}</span>
                    <span class="reaction-count">${users.length}</span>
                </button>
            `;
        }).join('');
    }

    bindMessageEvents() {
        const messagesArea = document.getElementById('messages-area');
        if (!messagesArea) return;

        // Message actions
        messagesArea.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const messageId = e.target.dataset.messageId;
                this.handleMessageAction(action, messageId);
            });
        });

        // Message reactions
        messagesArea.querySelectorAll('.message-reaction').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emoji = e.target.closest('.message-reaction').dataset.emoji;
                const messageId = e.target.closest('.message-reaction').dataset.messageId;
                this.toggleMessageReaction(messageId, emoji);
            });
        });
    }

    handleMessageAction(action, messageId) {
        switch (action) {
            case 'react':
                this.showMessageReactionPicker(messageId);
                break;
            case 'tip':
                this.showMessageTipModal(messageId);
                break;
            case 'edit':
                this.editMessage(messageId);
                break;
            case 'delete':
                this.deleteMessage(messageId);
                break;
        }
    }

    sendMessage() {
        const messageInput = document.getElementById('message-input');
        if (!messageInput) return;

        const content = messageInput.value.trim();
        if (!content) return;

        const messagingSystem = GameEngine?.systems?.messaging;
        if (!messagingSystem) return;

        try {
            const currentUser = this.getCurrentUser();
            let targetData = {};

            if (this.currentConversation === 'world' || this.currentConversation === 'alliance') {
                targetData.channelId = this.currentConversation;
            } else if (this.currentConversation) {
                targetData.conversationId = this.currentConversation;
            } else {
                this.showError('No conversation selected');
                return;
            }

            messagingSystem.sendMessage({
                senderId: currentUser.id,
                content: content,
                type: 'text',
                attachments: [],
                ...targetData
            });

            messageInput.value = '';
            document.getElementById('character-count').textContent = '0/2000';
            document.getElementById('send-message-btn').disabled = true;
            
            this.stopTyping();

            // Refresh conversation
            if (this.currentConversation) {
                setTimeout(() => {
                    if (this.currentConversation === 'world' || this.currentConversation === 'alliance') {
                        this.loadChannelChat(this.currentConversation);
                    } else {
                        this.loadConversation(this.currentConversation);
                    }
                }, 100);
            }
        } catch (error) {
            this.showError('Failed to send message: ' + error.message);
        }
    }

    insertEmoji(emoji) {
        const messageInput = document.getElementById('message-input');
        if (!messageInput) return;

        const cursorPos = messageInput.selectionStart;
        const textBefore = messageInput.value.substring(0, cursorPos);
        const textAfter = messageInput.value.substring(messageInput.selectionEnd);

        messageInput.value = textBefore + emoji + textAfter;
        messageInput.focus();
        messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);

        // Update character count
        const charCount = document.getElementById('character-count');
        if (charCount) {
            charCount.textContent = `${messageInput.value.length}/2000`;
        }

        // Enable/disable send button
        const sendBtn = document.getElementById('send-message-btn');
        if (sendBtn) {
            sendBtn.disabled = messageInput.value.trim().length === 0;
        }

        // Hide emoji picker
        const emojiPicker = document.getElementById('emoji-picker');
        if (emojiPicker) {
            emojiPicker.style.display = 'none';
        }

        this.handleTypingInput();
    }

    switchEmojiCategory(category) {
        const emojiGrid = document.getElementById('emoji-grid');
        const panel = document.getElementById('messaging-panel');
        
        if (!emojiGrid || !panel) return;

        // Update active category button
        panel.querySelectorAll('.emoji-category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });

        // Update emoji grid
        emojiGrid.innerHTML = this.getEmojiGrid(category);
        this.bindEmojiEvents();
    }

    handleTypingInput() {
        if (!this.currentConversation) return;

        const messagingSystem = GameEngine?.systems?.messaging;
        if (!messagingSystem) return;

        const currentUser = this.getCurrentUser();

        // Start typing indicator
        if (!this.isTyping) {
            this.isTyping = true;
            messagingSystem.startTyping(currentUser.id, this.currentConversation);
        }

        // Reset typing timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        this.typingTimeout = setTimeout(() => {
            this.stopTyping();
        }, 3000);
    }

    stopTyping() {
        if (!this.isTyping) return;

        this.isTyping = false;
        
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }

        const messagingSystem = GameEngine?.systems?.messaging;
        if (messagingSystem) {
            const currentUser = this.getCurrentUser();
            messagingSystem.stopTyping(currentUser.id);
        }
    }

    showNoSelection() {
        const messagesArea = document.getElementById('messages-area');
        const inputArea = document.getElementById('message-input-area');
        
        if (messagesArea) {
            messagesArea.innerHTML = `
                <div class="no-chat-selected">
                    <h3>💬 Select a Conversation</h3>
                    <p>Choose a conversation from the sidebar to start chatting</p>
                </div>
            `;
        }
        
        if (inputArea) {
            inputArea.style.display = 'none';
        }
    }

    startPolling() {
        // Poll for new messages every 2 seconds
        this.messagePollingInterval = setInterval(() => {
            this.refreshCurrentConversation();
            this.updateOnlineCount();
        }, 2000);
    }

    stopPolling() {
        if (this.messagePollingInterval) {
            clearInterval(this.messagePollingInterval);
            this.messagePollingInterval = null;
        }
    }

    refreshCurrentConversation() {
        if (!this.currentConversation) return;

        try {
            if (this.currentConversation === 'world' || this.currentConversation === 'alliance') {
                // Don't auto-refresh channels to avoid scroll jumping
            } else {
                // Refresh private conversations
                this.loadConversation(this.currentConversation);
            }
        } catch (error) {
            // Silently handle polling errors
        }
    }

    updateOnlineCount() {
        const messagingSystem = GameEngine?.systems?.messaging;
        if (!messagingSystem) return;

        const onlineUsers = messagingSystem.getOnlineUsers();
        const countElement = document.getElementById('online-count');
        
        if (countElement) {
            countElement.textContent = `${onlineUsers.length} online`;
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            const messagesContainer = document.getElementById('messages-container');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 100);
    }

    // Utility methods
    getCurrentUser() {
        const nation = GameEngine?.currentNation || DataManager?.currentNation;
        return { id: nation?.id || 'player1', name: nation?.name || 'Player' };
    }

    getNationName(userId) {
        if (userId === 'system') return 'System';
        const nation = GameEngine?.currentNation || DataManager?.currentNation;
        return nation && nation.id === userId ? nation.name : `Nation ${userId}`;
    }

    formatMessageContent(content) {
        // Convert line breaks
        let formatted = content.replace(/\n/g, '<br>');
        
        // Convert URLs to links
        formatted = formatted.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener">$1</a>'
        );
        
        // Escape HTML
        const div = document.createElement('div');
        div.innerHTML = formatted;
        
        return div.innerHTML;
    }

    formatMessagePreview(content) {
        if (!content) return '';
        
        // Remove HTML tags and limit length
        const plainText = content.replace(/<[^>]*>/g, '');
        return plainText.length > 50 ? plainText.substring(0, 50) + '...' : plainText;
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}m`;
        return 'now';
    }

    showSuccess(message) {
        EventBus.emit('show_notification', { message, type: 'success' });
    }

    showError(message) {
        EventBus.emit('show_notification', { message, type: 'error' });
    }

    // Event handlers
    handleNewMessage(data) {
        // Refresh if it's for current conversation
        if (data.conversation && data.conversation.id === this.currentConversation) {
            this.refreshCurrentConversation();
        }
        
        // Update conversations list
        this.loadConversations();
    }

    handleTypingStart(data) {
        if (data.conversationId === this.currentConversation) {
            this.updateTypingIndicators(data.conversationId);
        }
    }

    handleTypingStop(data) {
        if (data.conversationId === this.currentConversation) {
            this.updateTypingIndicators(data.conversationId);
        }
    }

    handleUserOnline(data) {
        this.updateOnlineCount();
    }

    handleUserOffline(data) {
        this.updateOnlineCount();
    }

    updateTypingIndicators(conversationId) {
        const messagingSystem = GameEngine?.systems?.messaging;
        if (!messagingSystem) return;

        const typingUsers = messagingSystem.getTypingUsers(conversationId);
        const indicatorsElement = document.getElementById('typing-indicators');
        
        if (!indicatorsElement) return;

        if (typingUsers.length === 0) {
            indicatorsElement.innerHTML = '';
            return;
        }

        const names = typingUsers.map(userId => this.getNationName(userId));
        let text = '';
        
        if (names.length === 1) {
            text = `${names[0]} is typing...`;
        } else if (names.length === 2) {
            text = `${names[0]} and ${names[1]} are typing...`;
        } else {
            text = `${names.length} people are typing...`;
        }

        indicatorsElement.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
                <span class="typing-text">${text}</span>
            </div>
        `;
    }

    destroy() {
        this.hide();
        this.stopPolling();
        this.stopTyping();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MessagingPanel };
}