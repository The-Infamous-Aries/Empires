/**
 * MessagingBubble - Floating chat bubble accessible from any page/tab.
 * Provides a persistent overlay with conversation list, message view,
 * private 1-1 messaging, and named group rooms.
 */

class MessagingBubble {
    constructor() {
        this.isOpen = false;
        this.activeConversationId = null;
        this.currentUserId = null;
        this.messagingSystem = null;
        this.elements = {};
        this.unreadCount = 0;
        this.scrollTimeout = null;
        this.typingTimeout = null;

        this._loadState();
        this._injectStyles();
        this._render();
        this._bindEvents();
    }

    _loadState() {
        try {
            const saved = localStorage.getItem('empire-messaging-bubble');
            if (saved) {
                const state = JSON.parse(saved);
                this.isOpen = state.isOpen === true;
                this.activeConversationId = state.activeConversationId || null;
            }
        } catch {
            // ignore
        }
    }

    _saveState() {
        try {
            localStorage.setItem('empire-messaging-bubble', JSON.stringify({
                isOpen: this.isOpen,
                activeConversationId: this.activeConversationId
            }));
        } catch {
            // ignore
        }
    }

    _injectStyles() {
        if (document.getElementById('messaging-bubble-styles')) return;
        const link = document.createElement('link');
        link.id = 'messaging-bubble-styles';
        link.rel = 'stylesheet';
        link.href = 'ui/styles/messaging.css';
        document.head.appendChild(link);
    }

    _getCurrentUserId() {
        if (typeof window === 'undefined') return null;
        return window.Player?.playerId || window.Nation?.playerId || window.Nation?.id || null;
    }

    _render() {
        // Remove existing if any
        const existing = document.getElementById('messaging-bubble');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.id = 'messaging-bubble';
        container.innerHTML = `
            <button class="messaging-toggle" id="messaging-toggle" aria-label="Open messages" title="Messages">
                💬
                <span class="messaging-unread" id="messaging-unread" aria-live="polite">0</span>
            </button>

            <div class="messaging-window hidden" id="messaging-window" role="dialog" aria-label="Messages">
                <div class="messaging-header">
                    <h3 id="messaging-header-title"><span class="room-icon">💬</span> Messages</h3>
                    <div class="messaging-header-actions">
                        <button class="messaging-btn" id="messaging-create-room" title="Create group room">+</button>
                        <button class="messaging-btn" id="messaging-close" title="Close">✕</button>
                    </div>
                </div>

                <div class="messaging-conversations" id="messaging-conversations">
                    <div class="messaging-empty">No conversations yet</div>
                </div>

                <div class="messaging-messages" id="messaging-messages">
                    <div style="color:#9ca3af;font-size:14px;text-align:center;margin-top:40px;">
                        Select a conversation to start chatting
                    </div>
                </div>

                <div class="messaging-input-area" id="messaging-input-area" style="display:none;">
                    <textarea class="messaging-input" id="messaging-input" placeholder="Type a message…" rows="1"></textarea>
                    <button class="messaging-send-btn" id="messaging-send" title="Send">▶</button>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        this.elements.toggle = document.getElementById('messaging-toggle');
        this.elements.unread = document.getElementById('messaging-unread');
        this.elements.window = document.getElementById('messaging-window');
        this.elements.headerTitle = document.getElementById('messaging-header-title');
        this.elements.conversations = document.getElementById('messaging-conversations');
        this.elements.messages = document.getElementById('messaging-messages');
        this.elements.inputArea = document.getElementById('messaging-input-area');
        this.elements.input = document.getElementById('messaging-input');
        this.elements.send = document.getElementById('messaging-send');
        this.elements.createRoom = document.getElementById('messaging-create-room');
        this.elements.close = document.getElementById('messaging-close');

        if (this.isOpen) this.open();
        else this.close();
    }

    _bindEvents() {
        this.elements.toggle.addEventListener('click', () => {
            if (this.isOpen) this.close(); else this.open();
        });

        this.elements.close.addEventListener('click', () => this.close());

        this.elements.createRoom.addEventListener('click', () => this._promptCreateRoom());

        this.elements.send.addEventListener('click', () => this._sendTypedMessage());

        this.elements.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this._sendTypedMessage();
            }
        });

        this.elements.input.addEventListener('input', () => {
            this.elements.input.style.height = 'auto';
            this.elements.input.style.height = this.elements.input.scrollHeight + 'px';
        });

        // ESC closes
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });

        // Listen for new messages from the messaging system
        EventBus.on('message_sent', (data) => {
            this._refreshConversations();
            if (this.activeConversationId === data.conversationId) {
                this._renderMessages();
            }
            if (!this.isOpen) {
                this._incrementUnread();
            }
        });

        EventBus.on('room_created', () => this._refreshConversations());
        EventBus.on('room_invite', () => this._refreshConversations());
        EventBus.on('room_left', () => this._refreshConversations());
        EventBus.on('room_deleted', () => {
            this._refreshConversations();
            if (this.activeConversationId && !this.messagingSystem.conversations.has(this.activeConversationId)) {
                this.activeConversationId = null;
                this._renderMessages();
            }
        });

        EventBus.on('messages_read', () => {
            this._refreshConversations();
            this._updateUnreadBadge();
        });

        // Typing indicator broadcast
        this.elements.input.addEventListener('input', () => {
            if (!this.activeConversationId) return;
            this.messagingSystem.startTyping(this.currentUserId, this.activeConversationId);
            if (this.typingTimeout) clearTimeout(this.typingTimeout);
            this.typingTimeout = setTimeout(() => {
                this.messagingSystem.stopTyping(this.currentUserId);
            }, 2000);
        });

        EventBus.on('typing_start', (data) => {
            if (data.conversationId !== this.activeConversationId) return;
            if (data.userId === this.currentUserId) return;
            this._showTyping(data.userId);
        });

        EventBus.on('typing_stop', (data) => {
            if (data.conversationId !== this.activeConversationId) return;
            this._hideTyping();
        });
    }

    open() {
        this.isOpen = true;
        this.elements.window.classList.remove('hidden');
        this.elements.toggle.setAttribute('aria-expanded', 'true');
        this._saveState();
        this._updateUnreadBadge();
        this._refreshConversations();
        if (this.activeConversationId) {
            this._renderMessages();
        } else {
            this._showEmptyMessages();
        }
        this._focusInput();
    }

    close() {
        this.isOpen = false;
        this.elements.window.classList.add('hidden');
        this.elements.toggle.setAttribute('aria-expanded', 'false');
        this._saveState();
        this._hideTyping();
    }

    _focusInput() {
        if (this.elements.input) this.elements.input.focus();
    }

    _updateUnreadBadge() {
        if (!this.messagingSystem) return;
        const userId = this.currentUserId || this._getCurrentUserId();
        let total = 0;
        for (const conv of this.messagingSystem.getUserConversations(userId)) {
            total += conv.unreadCount || 0;
        }
        this.unreadCount = total;
        this.elements.unread.textContent = total > 9 ? '9+' : String(total);
        this.elements.unread.style.display = total > 0 ? 'flex' : 'none';
    }

    _incrementUnread() {
        this.unreadCount = (this.unreadCount || 0) + 1;
        this.elements.unread.textContent = this.unreadCount > 9 ? '9+' : String(this.unreadCount);
        this.elements.unread.style.display = 'flex';
    }

    async _refreshConversations() {
        if (!this.messagingSystem) return;
        const userId = this.currentUserId || this._getCurrentUserId();
        if (!userId) return;

        const conversations = this.messagingSystem.getUserConversations(userId);
        const rooms = this.messagingSystem.getUserRooms(userId);

        // Combine: private + public + alliance + group
        const all = [];
        for (const c of conversations) all.push(c);
        for (const r of rooms) {
            if (!all.find(a => a.id === r.id)) all.push(r);
        }
        all.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));

        this.elements.conversations.innerHTML = '';

        if (all.length === 0) {
            this.elements.conversations.innerHTML = '<div class="messaging-empty">No conversations yet</div>';
            return;
        }

        for (const conv of all) {
            const el = document.createElement('div');
            el.className = `messaging-conversation-item${this.activeConversationId === conv.id ? ' active' : ''}`;
            el.dataset.conversationId = conv.id;

            const icon = conv.type === 'group' ? (conv.icon || '💬') :
                conv.type === 'alliance' ? '🏴' :
                conv.type === 'public' ? '🌍' : '👤';

            const unreadHtml = conv.unreadCount > 0 ?
                `<span class="messaging-conv-unread">${conv.unreadCount > 9 ? '9+' : conv.unreadCount}</span>` : '';

            const lastPreview = conv.lastMessage ?
                (this.messagingSystem.messages.get(conv.lastMessage)?.content || '') :
                'No messages yet';

            const lastTime = conv.lastActivity ?
                new Date(conv.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            el.innerHTML = `
                <div class="messaging-conv-info">
                    <div class="messaging-conv-header">
                        <span class="messaging-conv-name">${this._escapeHtml(conv.name || conv.id)}</span>
                        <span class="messaging-conv-time">${lastTime}</span>
                    </div>
                    <div class="messaging-conv-preview">${icon} ${this._escapeHtml(lastPreview)}</div>
                </div>
                ${unreadHtml}
            `;

            el.addEventListener('click', () => this._openConversation(conv.id));
            this.elements.conversations.appendChild(el);
        }
    }

    _openConversation(conversationId) {
        this.activeConversationId = conversationId;
        this._saveState();
        this._refreshConversations();
        this._renderMessages();
        this._markRead();
    }

    _markRead() {
        if (!this.messagingSystem || !this.activeConversationId) return;
        const userId = this.currentUserId || this._getCurrentUserId();
        this.messagingSystem.markAsRead(this.activeConversationId, userId);
        this._updateUnreadBadge();
        this._refreshConversations();
    }

    _renderMessages() {
        this.elements.messages.innerHTML = '';
        this.elements.inputArea.style.display = this.activeConversationId ? 'flex' : 'none';

        if (!this.messagingSystem || !this.activeConversationId) {
            this._showEmptyMessages();
            return;
        }

        const conversation = this.messagingSystem.getConversation(this.activeConversationId, { limit: 100 });
        if (!conversation) {
            this._showEmptyMessages();
            return;
        }

        const headerTitle = this.elements.headerTitle;
        const icon = conversation.type === 'group' ? (conversation.icon || '💬') :
            conversation.type === 'alliance' ? '🏴' :
            conversation.type === 'public' ? '🌍' : '👤';
        headerTitle.innerHTML = `<span class="room-icon">${icon}</span> ${this._escapeHtml(conversation.name || conversation.id)}`;

        const userId = this.currentUserId || this._getCurrentUserId();

        if (conversation.messages.length === 0) {
            this.elements.messages.innerHTML = '<div style="color:#9ca3af;font-size:14px;text-align:center;margin-top:40px;">No messages yet</div>';
            return;
        }

        for (const message of conversation.messages) {
            const isOwn = message.senderId === userId;
            const isSystem = message.senderId === 'system';
            const senderName = isSystem ? 'System' :
                (this.messagingSystem.getNationName ? this.messagingSystem.getNationName(message.senderId) : `Nation ${message.senderId}`);
            const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const messageEl = document.createElement('div');
            messageEl.className = `messaging-message${isOwn ? ' own' : ''}${isSystem ? ' system' : ''}`;
            messageEl.innerHTML = `
                <div>${this._escapeHtml(message.content)}</div>
                <span class="messaging-message-meta">${isOwn ? 'You' : senderName} · ${time}</span>
            `;
            this.elements.messages.appendChild(messageEl);
        }

        this._scrollToBottom();
        this._markRead();
    }

    _showEmptyMessages() {
        this.elements.messages.innerHTML = '<div style="color:#9ca3af;font-size:14px;text-align:center;margin-top:40px;">Select a conversation to start chatting</div>';
        this.elements.inputArea.style.display = 'none';
        this.elements.headerTitle.innerHTML = '<span class="room-icon">💬</span> Messages';
    }

    _scrollToBottom() {
        if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }, 50);
    }

    _showTyping(userId) {
        const name = this.messagingSystem.getNationName ?
            this.messagingSystem.getNationName(userId) : `Nation ${userId}`;
        this._hideTyping();
        const typingEl = document.createElement('div');
        typingEl.className = 'messaging-typing';
        typingEl.id = 'messaging-typing';
        typingEl.textContent = `${name} is typing…`;
        this.elements.messages.insertBefore(typingEl, this.elements.inputArea);
        this._scrollToBottom();
    }

    _hideTyping() {
        const el = document.getElementById('messaging-typing');
        if (el) el.remove();
    }

    async _sendTypedMessage() {
        const content = this.elements.input.value.trim();
        if (!content || !this.activeConversationId) return;

        const userId = this.currentUserId || this._getCurrentUserId();
        if (!userId) return;

        try {
            this.messagingSystem.sendMessage({
                senderId: userId,
                conversationId: this.activeConversationId,
                content,
                type: 'text'
            });
            this.elements.input.value = '';
            this.elements.input.style.height = 'auto';
            this.messagingSystem.stopTyping(userId);
            this._renderMessages();
        } catch (err) {
            console.error('Failed to send message:', err.message);
            alert(err.message);
        }
    }

    _promptCreateRoom() {
        const overlay = document.createElement('div');
        overlay.className = 'messaging-dialog-overlay';
        overlay.innerHTML = `
            <div class="messaging-dialog">
                <h4>Create Group Room</h4>
                <input type="text" id="messaging-room-name" placeholder="Room name" maxlength="100" />
                <div class="messaging-dialog-actions">
                    <button class="messaging-dialog-btn cancel" id="messaging-room-cancel">Cancel</button>
                    <button class="messaging-dialog-btn save" id="messaging-room-save">Create</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const input = document.getElementById('messaging-room-name');
        const saveBtn = document.getElementById('messaging-room-save');
        const cancelBtn = document.getElementById('messaging-room-cancel');

        const cleanup = () => overlay.remove();

        const create = () => {
            const name = input.value.trim();
            if (!name) return;
            const userId = this.currentUserId || this._getCurrentUserId();
            try {
                const roomId = this.messagingSystem.createRoom(name, userId, [userId]);
                this.activeConversationId = roomId;
                this._saveState();
                this._refreshConversations();
                this._renderMessages();
                cleanup();
            } catch (err) {
                alert(err.message);
            }
        };

        saveBtn.addEventListener('click', create);
        cancelBtn.addEventListener('click', cleanup);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') create();
        });
        input.focus();

        // Auto-enable save when text entered
        input.addEventListener('input', () => {
            saveBtn.disabled = !input.value.trim();
        });
        saveBtn.disabled = true;
    }

    init(messagingSystem) {
        this.messagingSystem = messagingSystem;
        this.currentUserId = this._getCurrentUserId();
        this._updateUnreadBadge();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MessagingBubble };
}

// Expose globally for script-tag loading
if (typeof window !== 'undefined') {
    window.MessagingBubble = MessagingBubble;
}
