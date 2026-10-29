/**
 * Messaging System - Live Chat, Private Messages, and Group Rooms
 * Empire Builder - Nation Building Strategy Game
 *
 * Handles private messages, alliance chat, world chat, named group rooms,
 * typing indicators, reactions, and real-time chat bubble overlay.
 */

class MessagingSystem {
    constructor() {
        this.isInitialized = false;
        this.eventUnsubscribes = [];
        this.heartbeatInterval = null;
        this.persistenceEnabled = false;
        this.syncInterval = null;
        this.storageListener = null;
        this._persistedMessageIds = new Set();
        this._persistedRoomIds = new Set();

        // Message storage
        this.conversations = new Map(); // conversationId -> conversation data
        this.messages = new Map(); // messageId -> message data
        this.onlineUsers = new Set(); // currently online user IDs

        // Chat channels
        this.channels = {
            world: {
                id: 'world',
                name: 'World Chat',
                type: 'public',
                icon: '🌍',
                description: 'Global chat for all players',
                maxHistory: 1000
            },
            alliance: {
                id: 'alliance',
                name: 'Alliance Chat',
                type: 'alliance',
                icon: '🏴',
                description: 'Private chat for alliance members',
                maxHistory: 500
            }
        };

        // Message types
        this.messageTypes = {
            text: 'text',
            emoji: 'emoji',
            system: 'system',
            tip: 'tip',
            trade: 'trade'
        };

        // Conversation types
        this.conversationTypes = {
            private: 'private',
            public: 'public',
            alliance: 'alliance',
            group: 'group'
        };

        // Max history limits per conversation type
        this.maxHistoryByType = {
            private: 500,
            public: 1000,
            alliance: 500,
            group: 300
        };

        // Emoji sets
        this.emojiSets = {
            faces: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑'],
            reactions: ['👍', '👎', '👌', '✌️', '🤞', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏', '✊', '👊', '🤛', '🤜'],
            objects: ['⚔️', '🛡️', '👑', '💰', '💎', '🏆', '🎯', '⚡', '🔥', '💫', '⭐', '🌟', '💥', '🎉', '🎊', '🎈', '🎁', '🏅', '🥇', '🥈', '🥉', '🏴', '🚩'],
            nations: ['🏛️', '🏰', '🏗️', '🏙️', '🌆', '🌇', '🌃', '🌉', '🎪', '🎭', '🎨', '🎬', '🎼', '🎵', '🎶', '🎤', '🎧', '📻', '🎸', '🥁', '🎺', '🎷', '🎹', '🎪']
        };

        // Typing indicators
        this.typingUsers = new Map(); // conversationId -> Set of typing user IDs
        this.typingTimeouts = new Map(); // userId -> { timeout, startedAt }

        // Blocked users (userId -> Set of blocked userIds)
        this.blockedUsers = new Map();

        this.initialize();
    }

    initialize() {
        // Re-entrancy guard
        if (this.isInitialized) {
            console.log('Messaging System already initialized');
            return;
        }
        console.log('Initializing Messaging System...');
        this.bindEvents();
        this.setupHeartbeat();
        this.setupPersistence();
        this.loadFromServer();
        this.isInitialized = true;
        console.log('Messaging System ready');
    }

    bindEvents() {
        if (typeof EventBus === 'undefined') {
            console.warn('MessagingSystem: EventBus not available, skipping event bindings');
            return;
        }
        this.eventUnsubscribes = [
            EventBus.on('user_online', this.handleUserOnline.bind(this)),
            EventBus.on('user_offline', this.handleUserOffline.bind(this)),
            EventBus.on('message_sent', this.handleMessageSent.bind(this)),
            EventBus.on('typing_start', this.handleTypingStart.bind(this)),
            EventBus.on('typing_stop', this.handleTypingStop.bind(this)),
            EventBus.on('alliance_joined', this.handleAllianceJoined.bind(this)),
            EventBus.on('alliance_left', this.handleAllianceLeft.bind(this)),
        ];
    }

    setupHeartbeat() {
        // Clean up old typing indicators every 30 seconds
        this.heartbeatInterval = setInterval(() => {
            this.cleanupTypingIndicators();
        }, 30000);
    }

    setupPersistence() {
        // Sync local state across browser tabs (multi-tab support)
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            const onStorage = (event) => {
                if (event.key === 'empire-messaging-sync') {
                    try {
                        const payload = JSON.parse(event.newValue || '{}');
                        if (payload.type === 'message_sent' && payload.senderId !== this._getCurrentUserId()) {
                            this._applyRemoteMessage(payload);
                        }
                    } catch {
                        // ignore malformed sync events
                    }
                }
            };
            this.storageListener = onStorage;
            window.addEventListener('storage', onStorage);

            // Periodically persist to server if available
            this.syncInterval = setInterval(() => {
                this._persistToServer();
            }, 60000);
        }
    }

    _getCurrentUserId() {
        if (typeof window === 'undefined') return null;
        return window.Player?.playerId || window.Nation?.playerId || window.Nation?.id || null;
    }

    _persistToServer() {
        if (!this.persistenceEnabled) return;
        // Bound the tracking sets to prevent unbounded growth
        if (this._persistedMessageIds.size > 10000) {
            this._persistedMessageIds.clear();
        }
        if (this._persistedRoomIds.size > 1000) {
            this._persistedRoomIds.clear();
        }
        const newMessages = [];
        const newRooms = [];
        for (const [id, message] of this.messages.entries()) {
            if (!this._persistedMessageIds.has(id)) {
                newMessages.push(this._messageForPersistence(message));
                this._persistedMessageIds.add(id);
            }
        }
        for (const [id, conv] of this.conversations.entries()) {
            if (conv.type === 'group' && !this._persistedRoomIds.has(id)) {
                newRooms.push(this._conversationForPersistence(conv));
                this._persistedRoomIds.add(id);
            }
        }
        if (newMessages.length === 0 && newRooms.length === 0) return;
        fetch('/api/messaging/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: newMessages, rooms: newRooms })
        }).catch(() => {
            // server may not be ready; ignore
        });

    }

    // Convert a message so its Set fields serialize cleanly to JSON
    _messageForPersistence(message) {
        return {
            ...message,
            readBy: message.readBy ? Array.from(message.readBy) : [],
            reactions: message.reactions || {}
        };
    }

    // Convert a conversation so its Set fields serialize cleanly to JSON
    _conversationForPersistence(conversation) {
        return {
            ...conversation,
            lastMessage: conversation.lastMessage ? this._messageForPersistence(conversation.lastMessage) : null,
            participants: Array.from(conversation.participants || [])
        };
    }

    _applyRemoteMessage(payload) {
        const { message, conversationId } = payload;
        if (!message || !conversationId) return;
        // Restore readBy as a Set after JSON round-trip
        this._ensureReadBy(message);
        this.messages.set(message.id, message);
        let conversation = this.conversations.get(conversationId);
        if (!conversation) {
            const participants = new Set();
            if (message.senderId) participants.add(message.senderId);
            const currentUserId = this._getCurrentUserId();
            if (currentUserId) participants.add(currentUserId);
            conversation = {
                id: conversationId,
                type: 'private',
                participants: Array.from(participants),
                messages: [],
                createdAt: Date.now(),
                lastActivity: message.timestamp,
                lastMessage: message.id
            };
            this.conversations.set(conversationId, conversation);
        } else if (message.senderId && !conversation.participants.includes(message.senderId)) {
            conversation.participants.push(message.senderId);
        }
        if (!conversation.messages.includes(message.id)) {
            conversation.messages.push(message.id);
            conversation.lastMessage = message.id;
            conversation.lastActivity = message.timestamp;
        }
        if (typeof EventBus !== 'undefined') {
            this._emit('message_sent', { message, conversation });
        }
    }

    enablePersistence() {
        this.persistenceEnabled = true;
    }

    // Safely emit an event if EventBus is available
    _emit(eventType, data) {
        if (typeof EventBus !== 'undefined') {
            EventBus.emit(eventType, data);
        }
    }

    // Ensure message.readBy is a Set (handles JSON round-trip from server)
    _ensureReadBy(message) {
        if (!message) return;
        if (!message.readBy) {
            message.readBy = new Set();
        } else if (Array.isArray(message.readBy)) {
            message.readBy = new Set(message.readBy);
        } else if (message.readBy && typeof message.readBy === 'object' && !message.readBy.has) {
            // JSON round-trip turns Set into {} — convert to a real Set
            message.readBy = new Set(Object.keys(message.readBy).filter(k => message.readBy[k]));
        }
    }

    /**
     * Load messages and rooms from the server on initialization.
     * Restores readBy as Sets after JSON round-trip.
     */
    async loadFromServer() {
        try {
            const [convResp, roomResp] = await Promise.all([
                fetch('/api/messaging/conversations'),
                fetch('/api/messaging/rooms')
            ]);

            if (convResp.ok) {
                const convData = await convResp.json();
                const conversations = convData.conversations || [];
                for (const conv of conversations) {
                    if (conv.lastMessage) {
                        this._ensureReadBy(conv.lastMessage);
                    }
                    // Restore readBy for any full messages included with the conversation
                    if (Array.isArray(conv.messages)) {
                        for (const msg of conv.messages) {
                            this._ensureReadBy(msg);
                            if (msg.id) this.messages.set(msg.id, msg);
                        }
                    }
                    this.conversations.set(conv.id, conv);
                }
            }

            if (roomResp.ok) {
                const roomData = await roomResp.json();
                const rooms = roomData.rooms || [];
                for (const room of rooms) {
                    if (room.lastMessage) {
                        this._ensureReadBy(room.lastMessage);
                    }
                    if (Array.isArray(room.messages)) {
                        for (const msg of room.messages) {
                            this._ensureReadBy(msg);
                            if (msg.id) this.messages.set(msg.id, msg);
                        }
                    }
                    this.conversations.set(room.id, room);
                }
            }

            // Load persisted messages from localStorage sync key if present
            if (typeof window !== 'undefined') {
                try {
                    const stored = localStorage.getItem('empire-messaging-sync');
                    if (stored) {
                        const payload = JSON.parse(stored);
                        if (payload.type === 'message_sent' && payload.message) {
                            this._applyRemoteMessage(payload);
                        }
                    }
                } catch {
                    // ignore
                }
            }
        } catch (err) {
            console.warn('MessagingSystem: failed to load from server', err.message);
        }
    }

    // User presence management
    setUserOnline(userId) {
        this.onlineUsers.add(userId);
        this._emit('user_online', { userId, timestamp: Date.now() });
    }

    setUserOffline(userId) {
        this.onlineUsers.delete(userId);
        this.stopTyping(userId);
        this._emit('user_offline', { userId, timestamp: Date.now() });
    }

    isUserOnline(userId) {
        return this.onlineUsers.has(userId);
    }

    getOnlineUsers() {
        return Array.from(this.onlineUsers);
    }

    // Block / unblock users
    blockUser(userId, targetId) {
        if (!this.blockedUsers.has(userId)) {
            this.blockedUsers.set(userId, new Set());
        }
        this.blockedUsers.get(userId).add(targetId);
    }

    unblockUser(userId, targetId) {
        if (this.blockedUsers.has(userId)) {
            this.blockedUsers.get(userId).delete(targetId);
        }
    }

    isBlocked(userId, targetId) {
        return this.blockedUsers.has(userId) && this.blockedUsers.get(userId).has(targetId);
    }

    getBlockedUsers(userId) {
        return Array.from(this.blockedUsers.get(userId) || []);
    }

    // Send a message
    sendMessage(data) {
        const {
            senderId,
            conversationId,
            content,
            type = 'text',
            channelId = null,
            recipientId = null,
            attachments = []
        } = data;

        if (!senderId || (!conversationId && !channelId && !recipientId)) {
            throw new Error('Sender and target (conversation/channel/recipient) are required');
        }

        if (!content || content.trim().length === 0) {
            throw new Error('Message content cannot be empty');
        }

        if (content.length > 2000) {
            throw new Error('Message must be 2000 characters or less');
        }

        // Validate attachments
        if (!Array.isArray(attachments)) {
            throw new Error('Attachments must be an array');
        }
        for (const att of attachments) {
            if (!att.url || typeof att.url !== 'string') {
                throw new Error('Each attachment must have a url');
            }
            if (att.size && att.size > 10 * 1024 * 1024) {
                throw new Error('Attachment must be 10MB or less');
            }
        }

        let targetConversationId = conversationId;

        // Handle different message targets
        if (channelId) {
            targetConversationId = channelId;

            if (channelId === 'alliance') {
                const senderNation = this.getNation(senderId);
                if (!senderNation || !senderNation.alliance) {
                    throw new Error('You must be in an alliance to use alliance chat');
                }
            }
        } else if (recipientId) {
            if (senderId === recipientId) {
                throw new Error('Cannot send a message to yourself');
            }
            if (this.isBlocked(senderId, recipientId)) {
                throw new Error('You have blocked this user');
            }
            if (this.isBlocked(recipientId, senderId)) {
                throw new Error('This user has blocked you');
            }
            targetConversationId = this.getOrCreatePrivateConversation(senderId, recipientId);
        }

        // Validate access to the target conversation
        const conversation = this.conversations.get(targetConversationId);
        if (conversation && conversation.type !== 'public' && conversation.type !== 'alliance') {
            // System messages bypass participant checks
            if (senderId !== 'system' && (!conversation.participants || !conversation.participants.includes(senderId))) {
                throw new Error('You are not a participant in this conversation');
            }
        }

        if (conversationId && !channelId && !recipientId && !this.conversations.has(conversationId)) {
            throw new Error('Conversation not found');
        }

        const messageId = this.generateId('msg');
        const now = Date.now();

        const message = {
            id: messageId,
            conversationId: targetConversationId,
            senderId,
            content: this.processMessageContent(content),
            type,
            attachments,
            timestamp: now,
            edited: false,
            editedAt: null,
            reactions: {},
            readBy: new Set([senderId])
        };

        if (type === 'emoji') {
            message.content = this.validateEmoji(content);
        }

        this.messages.set(messageId, message);

        let targetConv = this.conversations.get(targetConversationId);
        if (!targetConv && channelId) {
            targetConv = this.createChannelConversation(channelId);
        }

        if (targetConv) {
            targetConv.messages.push(messageId);
            targetConv.lastMessage = messageId;
            targetConv.lastActivity = now;

            // Trim message history per conversation type
            const maxHistory = this.maxHistoryByType[targetConv.type] || 1000;
            if (targetConv.messages.length > maxHistory) {
                const oldMessageId = targetConv.messages.shift();
                this.messages.delete(oldMessageId);
            }
        }

        this.stopTyping(senderId);

        // Cross-tab sync
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('empire-messaging-sync', JSON.stringify({
                    type: 'message_sent',
                    message,
                    conversationId: targetConversationId,
                    senderId,
                    timestamp: now
                }));
            } catch {
                // localStorage may be unavailable
            }
        }

        this._emit('message_sent', { message, conversation: targetConv });

        return messageId;
    }

    // Edit a message (only by sender)
    editMessage(data) {
        const { messageId, userId, newContent } = data;

        const message = this.messages.get(messageId);
        if (!message) {
            throw new Error('Message not found');
        }

        if (message.senderId !== userId) {
            throw new Error('Only the sender can edit this message');
        }

        if (!newContent || newContent.trim().length === 0) {
            throw new Error('Message content cannot be empty');
        }

        if (newContent.length > 2000) {
            throw new Error('Message must be 2000 characters or less');
        }

        const fifteenMinutes = 15 * 60 * 1000;
        if (Date.now() - message.timestamp > fifteenMinutes) {
            throw new Error('Messages can only be edited within 15 minutes');
        }

        message.content = this.processMessageContent(newContent);
        message.edited = true;
        message.editedAt = Date.now();

        this._emit('message_edited', { message });

        return true;
    }

    // Delete a message (only by sender)
    deleteMessage(data) {
        const { messageId, userId } = data;

        const message = this.messages.get(messageId);
        if (!message) {
            throw new Error('Message not found');
        }

        if (message.senderId !== userId) {
            throw new Error('Only the sender can delete this message');
        }

        const conversation = this.conversations.get(message.conversationId);
        if (conversation) {
            const index = conversation.messages.indexOf(messageId);
            if (index !== -1) {
                conversation.messages.splice(index, 1);
            }
            // Update lastMessage if the deleted message was the last one
            if (conversation.lastMessage === messageId) {
                const remaining = conversation.messages;
                if (remaining.length > 0) {
                    const lastMsgId = remaining[remaining.length - 1];
                    conversation.lastMessage = lastMsgId;
                    const lastMsg = this.messages.get(lastMsgId);
                    conversation.lastActivity = lastMsg ? lastMsg.timestamp : Date.now();
                } else {
                    conversation.lastMessage = null;
                    conversation.lastActivity = Date.now();
                }
            }
        }

        this.messages.delete(messageId);

        this._emit('message_deleted', { messageId, conversationId: message.conversationId });

        return true;
    }

    // Get or create a private conversation between two users
    getOrCreatePrivateConversation(user1Id, user2Id) {
        const conversationId = [user1Id, user2Id].sort().join('_');

        if (!this.conversations.has(conversationId)) {
            const conversation = {
                id: conversationId,
                type: 'private',
                participants: [user1Id, user2Id],
                messages: [],
                createdAt: Date.now(),
                lastActivity: Date.now(),
                lastMessage: null
            };
            this.conversations.set(conversationId, conversation);
        }

        return conversationId;
    }

    // Create a channel conversation (world chat, alliance chat)
    createChannelConversation(channelId) {
        if (!this.channels[channelId]) {
            throw new Error('Invalid channel');
        }

        if (this.conversations.has(channelId)) {
            return this.conversations.get(channelId);
        }

        const channel = this.channels[channelId];
        const conversation = {
            id: channelId,
            type: channel.type,
            name: channel.name,
            participants: [],
            messages: [],
            createdAt: Date.now(),
            lastActivity: Date.now(),
            lastMessage: null
        };

        this.conversations.set(channelId, conversation);
        return conversation;
    }

    // ── Group room system ──

    /**
     * Create a named group room.
     * @param {string} name - Room display name
     * @param {string} creatorId - User who creates the room
     * @param {string[]} participantIds - Initial participants (creator included)
     * @param {object} options - { icon, description, maxParticipants }
     * @returns {string} roomId
     */
    createRoom(name, creatorId, participantIds = [], options = {}) {
        if (!name || name.trim().length === 0) {
            throw new Error('Room name is required');
        }
        if (name.trim().length > 100) {
            throw new Error('Room name must be 100 characters or less');
        }
        if (!creatorId) {
            throw new Error('Creator is required');
        }
        if (!Array.isArray(participantIds)) {
            throw new Error('Participant IDs must be an array');
        }

        const roomId = this.generateId('room');
        const now = Date.now();
        const participants = new Set([creatorId, ...participantIds]);

        const room = {
            id: roomId,
            type: 'group',
            name: name.trim(),
            icon: options.icon || '💬',
            description: options.description || '',
            creatorId,
            participants: Array.from(participants),
            messages: [],
            createdAt: now,
            lastActivity: now,
            lastMessage: null,
            maxParticipants: options.maxParticipants || 100,
            isArchived: false,
            isMuted: false
        };

        this.conversations.set(roomId, room);
        this._emit('room_created', { room });
        return roomId;
    }

    /**
     * Invite a user to a group room.
     * @param {string} roomId
     * @param {string} userId - User to invite
     * @param {string} inviterId - User issuing the invite
     * @returns {boolean}
     */
    inviteToRoom(roomId, userId, inviterId) {
        const room = this.conversations.get(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        if (room.type !== 'group') {
            throw new Error('Not a group room');
        }
        if (room.creatorId !== inviterId && !room.participants.includes(inviterId)) {
            throw new Error('Only room participants can invite');
        }
        if (room.participants.includes(userId)) {
            throw new Error('User is already in the room');
        }
        if (room.participants.length >= room.maxParticipants) {
            throw new Error('Room is full');
        }

        room.participants.push(userId);
        room.lastActivity = Date.now();
        this._emit('room_invite', { roomId, userId, inviterId });
        return true;
    }

    /**
     * Leave a group room.
     * @param {string} roomId
     * @param {string} userId
     * @returns {boolean}
     */
    leaveRoom(roomId, userId) {
        const room = this.conversations.get(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        if (room.type !== 'group') {
            throw new Error('Not a group room');
        }
        if (!room.participants.includes(userId)) {
            throw new Error('You are not in this room');
        }

        room.participants = room.participants.filter(id => id !== userId);
        room.lastActivity = Date.now();

        if (room.participants.length === 0) {
            // Only the creator can fully delete; otherwise leave an empty room
            if (room.creatorId === userId) {
                this.deleteRoom(roomId, userId);
            } else {
                // Remove empty room so it doesn't linger in memory
                this.conversations.delete(roomId);
                this._emit('room_left', { roomId, userId });
            }
        } else {
            this._emit('room_left', { roomId, userId });
        }

        return true;
    }

    /**
     * Remove a user from a group room (creator or admin only).
     * @param {string} roomId
     * @param {string} targetId - User to remove
     * @param {string} actorId - User performing the removal
     * @returns {boolean}
     */
    removeFromRoom(roomId, targetId, actorId) {
        const room = this.conversations.get(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        if (room.type !== 'group') {
            throw new Error('Not a group room');
        }
        if (room.creatorId !== actorId) {
            throw new Error('Only the room creator can remove members');
        }
        if (targetId === room.creatorId) {
            throw new Error('Cannot remove the room creator');
        }
        if (!room.participants.includes(targetId)) {
            throw new Error('User is not in this room');
        }

        room.participants = room.participants.filter(id => id !== targetId);
        room.lastActivity = Date.now();

        this._emit('room_removed', { roomId, targetId, actorId });
        return true;
    }

    /**
     * Delete a group room (creator only).
     * @param {string} roomId
     * @param {string} userId
     * @returns {boolean}
     */
    deleteRoom(roomId, userId) {
        const room = this.conversations.get(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        if (room.type !== 'group') {
            throw new Error('Not a group room');
        }
        if (room.creatorId !== userId) {
            throw new Error('Only the room creator can delete the room');
        }

        // Delete all messages in the room
        for (const msgId of room.messages) {
            this.messages.delete(msgId);
        }
        this.conversations.delete(roomId);
        this._emit('room_deleted', { roomId });
        return true;
    }

    /**
     * Rename a group room (creator only).
     * @param {string} roomId
     * @param {string} newName
     * @param {string} userId
     * @returns {boolean}
     */
    renameRoom(roomId, newName, userId) {
        const room = this.conversations.get(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        if (room.type !== 'group') {
            throw new Error('Not a group room');
        }
        if (room.creatorId !== userId) {
            throw new Error('Only the room creator can rename');
        }
        if (!newName || newName.trim().length === 0) {
            throw new Error('Room name is required');
        }

        room.name = newName.trim();
        room.lastActivity = Date.now();
        this._emit('room_renamed', { roomId, name: room.name });
        return true;
    }

    /**
     * Archive / unarchive a group room (hides from conversation list).
     * @param {string} roomId
     * @param {string} userId
     * @param {boolean} archived
     * @returns {boolean}
     */
    archiveRoom(roomId, userId, archived = true) {
        const room = this.conversations.get(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        if (!room.participants.includes(userId)) {
            throw new Error('You are not in this room');
        }
        room.isArchived = archived;
        room.lastActivity = Date.now();
        this._emit('room_archived', { roomId, archived });
        return true;
    }

    /**
     * Mute / unmute a group room.
     * @param {string} roomId
     * @param {string} userId
     * @param {boolean} muted
     * @returns {boolean}
     */
    muteRoom(roomId, userId, muted = true) {
        const room = this.conversations.get(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        if (!room.participants.includes(userId)) {
            throw new Error('You are not in this room');
        }
        room.isMuted = muted;
        this._emit('room_muted', { roomId, muted });
        return true;
    }

    getRoom(roomId) {
        return this.conversations.get(roomId) || null;
    }

    getUserRooms(userId, options = {}) {
        const { includeArchived = false } = options;
        const rooms = [];
        for (const conversation of this.conversations.values()) {
            if (conversation.type !== 'group') continue;
            if (!conversation.participants.includes(userId)) continue;
            if (conversation.isArchived && !includeArchived) continue;
            const lastMessage = conversation.lastMessage ?
                this.messages.get(conversation.lastMessage) : null;
            const unreadCount = conversation.messages
                .map(msgId => this.messages.get(msgId))
                .filter(msg => {
                    this._ensureReadBy(msg);
                    return msg && !msg.readBy.has(userId);
                })
                .length;
            rooms.push({
                ...conversation,
                lastMessage,
                unreadCount
            });
        }
        return rooms.sort((a, b) => b.lastActivity - a.lastActivity);
    }

    // Get conversation with messages
    getConversation(conversationId, options = {}) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            return null;
        }

        const { limit = 50, offset = 0, markAsRead = false, userId = null } = options;

        const total = conversation.messages.length;
        // Start from the newest messages (end of array), going back `limit + offset`
        const start = Math.max(0, total - limit - offset);
        const end = total - offset;
        const messageIds = end > start ? conversation.messages.slice(start, end) : [];
        const messages = messageIds.map(id => this.messages.get(id)).filter(Boolean);

        if (markAsRead && userId) {
            for (const message of messages) {
                this._ensureReadBy(message);
                message.readBy.add(userId);
            }
        }

        return {
            ...conversation,
            messages,
            totalMessages: conversation.messages.length
        };
    }

    // Get user's conversations (private + public + alliance + non-archived group)
    getUserConversations(userId) {
        const userConversations = [];

        for (const conversation of this.conversations.values()) {
            let hasAccess = false;

            if (conversation.type === 'private') {
                hasAccess = conversation.participants.includes(userId);
            } else if (conversation.type === 'public') {
                hasAccess = true;
            } else if (conversation.type === 'alliance') {
                const nation = this.getNation(userId);
                hasAccess = nation && nation.alliance;
            } else if (conversation.type === 'group') {
                hasAccess = conversation.participants.includes(userId) && !conversation.isArchived;
            }

            if (hasAccess) {
                const lastMessage = conversation.lastMessage ?
                    this.messages.get(conversation.lastMessage) : null;
                const unreadCount = conversation.messages
                    .map(msgId => this.messages.get(msgId))
                    .filter(msg => {
                        this._ensureReadBy(msg);
                        return msg && !msg.readBy.has(userId);
                    })
                    .length;
                userConversations.push({
                    ...conversation,
                    lastMessage,
                    unreadCount
                });
            }
        }

        return userConversations.sort((a, b) => b.lastActivity - a.lastActivity);
    }

    // Get recent messages for a conversation/channel
    getRecentMessages(conversationId, limit = 50) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return [];

        const messageIds = conversation.messages.slice(-limit);
        return messageIds
            .map(id => this.messages.get(id))
            .filter(Boolean)
            .map(message => ({
                ...message,
                senderName: this.getNationName(message.senderId)
            }));
    }

    // Mark messages as read
    markAsRead(conversationId, userId, messageIds = null) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return 0;

        const ids = messageIds || conversation.messages;
        let count = 0;
        for (const id of ids) {
            const message = this.messages.get(id);
            this._ensureReadBy(message);
            if (message && !message.readBy.has(userId)) {
                message.readBy.add(userId);
                count++;
            }
        }
        if (count > 0) {
            this._emit('messages_read', { conversationId, userId, count });
        }
        return count;
    }

    // Get unread count for a conversation
    getUnreadCount(conversationId, userId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return 0;
        return conversation.messages
            .map(msgId => this.messages.get(msgId))
            .filter(msg => {
                this._ensureReadBy(msg);
                return msg && !msg.readBy.has(userId);
            })
            .length;
    }

    // Typing indicators
    startTyping(userId, conversationId) {
        // Clear typing indicators for this user in all other conversations
        for (const [convId, typingUsers] of this.typingUsers.entries()) {
            if (convId !== conversationId && typingUsers.has(userId)) {
                typingUsers.delete(userId);
                this._emit('typing_stop', { userId, conversationId: convId });
                if (typingUsers.size === 0) {
                    this.typingUsers.delete(convId);
                }
            }
        }

        if (!this.typingUsers.has(conversationId)) {
            this.typingUsers.set(conversationId, new Set());
        }

        this.typingUsers.get(conversationId).add(userId);

        if (this.typingTimeouts.has(userId)) {
            clearTimeout(this.typingTimeouts.get(userId).timeout);
        }

        const timeout = setTimeout(() => {
            this.stopTyping(userId);
        }, 10000);

        this.typingTimeouts.set(userId, { timeout, startedAt: Date.now() });

        this._emit('typing_start', { userId, conversationId });
    }

    stopTyping(userId) {
        if (this.typingTimeouts.has(userId)) {
            const entry = this.typingTimeouts.get(userId);
            clearTimeout(entry.timeout);
            this.typingTimeouts.delete(userId);
        }

        for (const [conversationId, typingUsers] of this.typingUsers.entries()) {
            if (typingUsers.has(userId)) {
                typingUsers.delete(userId);
                this._emit('typing_stop', { userId, conversationId });

                if (typingUsers.size === 0) {
                    this.typingUsers.delete(conversationId);
                }
            }
        }
    }

    getTypingUsers(conversationId) {
        return Array.from(this.typingUsers.get(conversationId) || []);
    }

    cleanupTypingIndicators() {
        const now = Date.now();
        const maxAge = 15000;

        for (const [userId, entry] of this.typingTimeouts.entries()) {
            if (now - entry.startedAt > maxAge) {
                this.stopTyping(userId);
            }
        }
    }

    // Add reaction to message
    addMessageReaction(data) {
        const { messageId, userId, emoji } = data;

        const message = this.messages.get(messageId);
        if (!message) {
            throw new Error('Message not found');
        }

        if (!this.isValidEmoji(emoji)) {
            throw new Error('Invalid emoji');
        }

        if (!message.reactions) {
            message.reactions = {};
        }

        for (const [reactionEmoji, userList] of Object.entries(message.reactions)) {
            const index = userList.indexOf(userId);
            if (index !== -1) {
                userList.splice(index, 1);
                if (userList.length === 0) {
                    delete message.reactions[reactionEmoji];
                }
            }
        }

        if (!message.reactions[emoji]) {
            message.reactions[emoji] = [];
        }
        message.reactions[emoji].push(userId);

        this._emit('message_reaction_added', { messageId, userId, emoji });

        return true;
    }

    // Process message content (convert emojis, mentions, etc.)
    processMessageContent(content) {
        content = this.convertEmojiCodes(content);
        content = this.processMentions(content);
        content = this.sanitizeHtml(content);
        return content;
    }

    // Strip HTML tags to prevent XSS when rendering message content
    sanitizeHtml(content) {
        if (typeof content !== 'string') return content;
        if (typeof document === 'undefined') return content;
        const div = document.createElement('div');
        div.textContent = content;
        return div.innerHTML;
    }

    convertEmojiCodes(content) {
        const emojiMap = {
            ':smile:': '😀',
            ':laugh:': '😂',
            ':heart:': '❤️',
            ':thumbsup:': '👍',
            ':thumbsdown:': '👎',
            ':fire:': '🔥',
            ':star:': '⭐',
            ':crown:': '👑',
            ':money:': '💰',
            ':sword:': '⚔️'
        };

        for (const [code, emoji] of Object.entries(emojiMap)) {
            content = content.replaceAll(code, emoji);
        }

        return content;
    }

    processMentions(content) {
        return content;
    }

    validateEmoji(emoji) {
        const allEmojis = Object.values(this.emojiSets).flat();
        if (allEmojis.includes(emoji)) {
            return emoji;
        }
        throw new Error('Invalid emoji');
    }

    isValidEmoji(emoji) {
        const allEmojis = Object.values(this.emojiSets).flat();
        return allEmojis.includes(emoji) || /\p{Emoji}/u.test(emoji);
    }

    // Send a tip through chat
    sendChatTip(data) {
        const { fromUserId, toUserId, amount, message } = data;

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

        fromNation.money -= amount;
        toNation.money += amount;

        const conversationId = this.getOrCreatePrivateConversation(fromUserId, toUserId);
        const tipMessage = `💰 ${this.getNationName(fromUserId)} sent you $${amount}${message ? `: "${message}"` : ''}`;

        this.sendMessage({
            senderId: 'system',
            conversationId,
            content: tipMessage,
            type: 'tip'
        });

        this._emit('chat_tip_sent', { fromUserId, toUserId, amount, message });

        return true;
    }

    // Utility methods
    generateId(prefix = 'item') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getNation(userId) {
        if (typeof window === 'undefined') return null;

        const playerId = window.Player?.playerId || window.Nation?.playerId || window.Nation?.id;
        if (userId && userId === playerId && window.Nation) {
            return window.Nation;
        }

        const economy = window.GameEngine?.systems?.economy;
        if (economy && typeof economy.getNation === 'function') {
            return economy.getNation(userId);
        }

        if (window.DataManager && window.DataManager.currentPlayer) {
            const nations = window.DataManager.currentPlayer.nations || [];
            return nations.find(n => n.id === userId || n.userId === userId) || null;
        }

        return null;
    }

    getNationName(userId) {
        if (userId === 'system') return 'System';
        const nation = this.getNation(userId);
        return nation ? nation.name : `Nation ${userId}`;
    }

    // Event handlers
    handleUserOnline(data) {
        console.log('User came online:', data.userId);
    }

    handleUserOffline(data) {
        console.log('User went offline:', data.userId);
    }

    handleMessageSent(data) {
        console.log('Message sent:', data.message.content);
    }

    handleTypingStart(data) {
        console.log('User started typing:', data.userId, 'in', data.conversationId);
    }

    handleTypingStop(data) {
        console.log('User stopped typing:', data.userId, 'in', data.conversationId);
    }

    handleAllianceJoined(data) {
        console.log('User joined alliance, granted alliance chat access:', data.userId);
    }

    handleAllianceLeft(data) {
        console.log('User left alliance, revoked alliance chat access:', data.userId);
    }

    // Get messaging statistics
    getMessagingStats() {
        const messages = Array.from(this.messages.values());
        const conversations = Array.from(this.conversations.values());

        const worldMessages = messages.filter(m => m.conversationId === 'world').length;
        const allianceMessages = messages.filter(m => m.conversationId === 'alliance').length;
        const privateMessages = messages.filter(m => {
            const conv = this.conversations.get(m.conversationId);
            return conv && conv.type === 'private';
        }).length;
        const groupMessages = messages.filter(m => {
            const conv = this.conversations.get(m.conversationId);
            return conv && conv.type === 'group';
        }).length;

        return {
            totalMessages: messages.length,
            totalConversations: conversations.length,
            onlineUsers: this.onlineUsers.size,
            messagesThisHour: messages.filter(msg =>
                Date.now() - msg.timestamp < 3600000
            ).length,
            privateConversations: conversations.filter(c => c.type === 'private').length,
            groupConversations: conversations.filter(c => c.type === 'group').length,
            channelMessages: messages.filter(msg =>
                msg.conversationId === 'world' || msg.conversationId === 'alliance'
            ).length,
            worldMessages,
            allianceMessages,
            privateMessages,
            groupMessages
        };
    }

    destroy() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }

        for (const unsubscribe of this.eventUnsubscribes) {
            unsubscribe();
        }
        this.eventUnsubscribes = [];

        if (typeof window !== 'undefined') {
            if (this.storageListener) {
                window.removeEventListener('storage', this.storageListener);
                this.storageListener = null;
            }
            try {
                localStorage.removeItem('empire-messaging-sync');
            } catch {
                // ignore
            }
        }

        this.conversations.clear();
        this.messages.clear();
        this.onlineUsers.clear();
        this.typingUsers.clear();
        this.blockedUsers.clear();
        this._persistedMessageIds.clear();
        this._persistedRoomIds.clear();

        for (const timeout of this.typingTimeouts.values()) {
            clearTimeout(timeout.timeout);
        }
        this.typingTimeouts.clear();

        this.isInitialized = false;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MessagingSystem };
}

// Expose globally for script-tag loading
if (typeof window !== 'undefined') {
    window.MessagingSystem = MessagingSystem;
}
