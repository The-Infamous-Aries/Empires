/**
 * Messaging System - Live Chat and Private Messages
 * Empire Builder - Nation Building Strategy Game
 * 
 * Handles private messages, alliance chat, world chat, and real-time messaging
 */

class MessagingSystem {
    constructor() {
        this.isInitialized = false;
        
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
        
        // Emoji sets
        this.emojiSets = {
            faces: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑'],
            reactions: ['👍', '👎', '👌', '✌️', '🤞', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏', '✊', '👊', '🤛', '🤜'],
            objects: ['⚔️', '🛡️', '👑', '💰', '💎', '🏆', '🎯', '⚡', '🔥', '💫', '⭐', '🌟', '💥', '🎉', '🎊', '🎈', '🎁', '🏅', '🥇', '🥈', '🥉', '🏴', '🚩'],
            nations: ['🏛️', '🏰', '🏗️', '🏙️', '🌆', '🌇', '🌃', '🌉', '🎪', '🎭', '🎨', '🎬', '🎼', '🎵', '🎶', '🎤', '🎧', '📻', '🎸', '🥁', '🎺', '🎷', '🎹', '🎪']
        };
        
        // Typing indicators
        this.typingUsers = new Map(); // conversationId -> Set of typing user IDs
        this.typingTimeouts = new Map(); // userId -> timeout ID
        
        this.initialize();
    }
    
    async initialize() {
        console.log('Initializing Messaging System...');
        this.bindEvents();
        this.setupHeartbeat();
        this.isInitialized = true;
        console.log('Messaging System ready');
    }
    
    bindEvents() {
        EventBus.on('user_online', this.handleUserOnline.bind(this));
        EventBus.on('user_offline', this.handleUserOffline.bind(this));
        EventBus.on('message_sent', this.handleMessageSent.bind(this));
        EventBus.on('typing_start', this.handleTypingStart.bind(this));
        EventBus.on('typing_stop', this.handleTypingStop.bind(this));
        EventBus.on('alliance_joined', this.handleAllianceJoined.bind(this));
        EventBus.on('alliance_left', this.handleAllianceLeft.bind(this));
    }
    
    setupHeartbeat() {
        // Clean up old typing indicators every 30 seconds
        setInterval(() => {
            this.cleanupTypingIndicators();
        }, 30000);
    }
    
    // User presence management
    setUserOnline(userId) {
        this.onlineUsers.add(userId);
        EventBus.emit('user_online', { userId, timestamp: Date.now() });
    }
    
    setUserOffline(userId) {
        this.onlineUsers.delete(userId);
        
        // Clear typing indicators
        this.stopTyping(userId);
        
        EventBus.emit('user_offline', { userId, timestamp: Date.now() });
    }
    
    isUserOnline(userId) {
        return this.onlineUsers.has(userId);
    }
    
    getOnlineUsers() {
        return Array.from(this.onlineUsers);
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
        
        const messageId = this.generateId('msg');
        const now = Date.now();
        
        let targetConversationId = conversationId;
        
        // Handle different message targets
        if (channelId) {
            // Channel message (world chat, alliance chat)
            targetConversationId = channelId;
            
            if (channelId === 'alliance') {
                const senderNation = this.getNation(senderId);
                if (!senderNation || !senderNation.alliance) {
                    throw new Error('You must be in an alliance to use alliance chat');
                }
            }
        } else if (recipientId) {
            // Private message - create or find conversation
            targetConversationId = this.getOrCreatePrivateConversation(senderId, recipientId);
        }
        
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
            readBy: new Set([senderId]) // Sender has read their own message
        };
        
        // Validate and process message based on type
        if (type === 'emoji') {
            message.content = this.validateEmoji(content);
        }
        
        this.messages.set(messageId, message);
        
        // Add message to conversation
        let conversation = this.conversations.get(targetConversationId);
        if (!conversation && channelId) {
            // Create channel conversation if it doesn't exist
            conversation = this.createChannelConversation(channelId);
        }
        
        if (conversation) {
            conversation.messages.push(messageId);
            conversation.lastMessage = messageId;
            conversation.lastActivity = now;
            
            // Limit message history for channels
            if (conversation.type !== 'private' && conversation.messages.length > (this.channels[channelId]?.maxHistory || 1000)) {
                const oldMessageId = conversation.messages.shift();
                this.messages.delete(oldMessageId);
            }
        }
        
        // Clear typing indicator
        this.stopTyping(senderId);
        
        EventBus.emit('message_sent', { message, conversation });
        
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
        
        // Can only edit messages sent within the last 15 minutes
        const fifteenMinutes = 15 * 60 * 1000;
        if (Date.now() - message.timestamp > fifteenMinutes) {
            throw new Error('Messages can only be edited within 15 minutes');
        }
        
        message.content = this.processMessageContent(newContent);
        message.edited = true;
        message.editedAt = Date.now();
        
        EventBus.emit('message_edited', { message });
        
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
        
        // Remove from conversation
        const conversation = this.conversations.get(message.conversationId);
        if (conversation) {
            const index = conversation.messages.indexOf(messageId);
            if (index !== -1) {
                conversation.messages.splice(index, 1);
            }
        }
        
        this.messages.delete(messageId);
        
        EventBus.emit('message_deleted', { messageId, conversationId: message.conversationId });
        
        return true;
    }
    
    // Get or create a private conversation between two users
    getOrCreatePrivateConversation(user1Id, user2Id) {
        // Create a consistent conversation ID regardless of parameter order
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
            participants: [], // All users for public channels
            messages: [],
            createdAt: Date.now(),
            lastActivity: Date.now(),
            lastMessage: null
        };
        
        this.conversations.set(channelId, conversation);
        return conversation;
    }
    
    // Get conversation with messages
    getConversation(conversationId, options = {}) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            return null;
        }
        
        const { limit = 50, offset = 0, markAsRead = false, userId = null } = options;
        
        // Get messages with pagination
        const messageIds = conversation.messages.slice(-limit - offset, -offset || undefined);
        const messages = messageIds.map(id => this.messages.get(id)).filter(Boolean);
        
        // Mark messages as read if requested
        if (markAsRead && userId) {
            for (const message of messages) {
                message.readBy.add(userId);
            }
        }
        
        return {
            ...conversation,
            messages,
            totalMessages: conversation.messages.length
        };
    }
    
    // Get user's conversations
    getUserConversations(userId) {
        const userConversations = [];
        
        for (const conversation of this.conversations.values()) {
            let hasAccess = false;
            
            if (conversation.type === 'private') {
                hasAccess = conversation.participants.includes(userId);
            } else if (conversation.type === 'public') {
                hasAccess = true; // All users can access public channels
            } else if (conversation.type === 'alliance') {
                const nation = this.getNation(userId);
                hasAccess = nation && nation.alliance;
            }
            
            if (hasAccess) {
                const lastMessage = conversation.lastMessage ? 
                    this.messages.get(conversation.lastMessage) : null;
                
                // Count unread messages
                const unreadCount = conversation.messages
                    .map(msgId => this.messages.get(msgId))
                    .filter(msg => msg && !msg.readBy.has(userId))
                    .length;
                
                userConversations.push({
                    ...conversation,
                    lastMessage,
                    unreadCount
                });
            }
        }
        
        // Sort by last activity
        return userConversations.sort((a, b) => b.lastActivity - a.lastActivity);
    }
    
    // Typing indicators
    startTyping(userId, conversationId) {
        if (!this.typingUsers.has(conversationId)) {
            this.typingUsers.set(conversationId, new Set());
        }
        
        this.typingUsers.get(conversationId).add(userId);
        
        // Clear existing timeout
        if (this.typingTimeouts.has(userId)) {
            clearTimeout(this.typingTimeouts.get(userId));
        }
        
        // Auto-stop typing after 10 seconds
        const timeout = setTimeout(() => {
            this.stopTyping(userId);
        }, 10000);
        
        this.typingTimeouts.set(userId, timeout);
        
        EventBus.emit('typing_start', { userId, conversationId });
    }
    
    stopTyping(userId) {
        // Clear timeout
        if (this.typingTimeouts.has(userId)) {
            clearTimeout(this.typingTimeouts.get(userId));
            this.typingTimeouts.delete(userId);
        }
        
        // Remove from all conversations
        for (const [conversationId, typingUsers] of this.typingUsers.entries()) {
            if (typingUsers.has(userId)) {
                typingUsers.delete(userId);
                EventBus.emit('typing_stop', { userId, conversationId });
                
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
        const maxAge = 15000; // 15 seconds
        
        for (const [userId, timeout] of this.typingTimeouts.entries()) {
            // If timeout is older than maxAge, clean it up
            if (now - timeout > maxAge) {
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
        
        // Remove any existing reaction from this user
        for (const [reactionEmoji, userList] of Object.entries(message.reactions)) {
            const index = userList.indexOf(userId);
            if (index !== -1) {
                userList.splice(index, 1);
                if (userList.length === 0) {
                    delete message.reactions[reactionEmoji];
                }
            }
        }
        
        // Add new reaction
        if (!message.reactions[emoji]) {
            message.reactions[emoji] = [];
        }
        message.reactions[emoji].push(userId);
        
        EventBus.emit('message_reaction_added', { messageId, userId, emoji });
        
        return true;
    }
    
    // Process message content (convert emojis, mentions, etc.)
    processMessageContent(content) {
        // Convert emoji codes to unicode
        content = this.convertEmojiCodes(content);
        
        // Process mentions (future feature)
        content = this.processMentions(content);
        
        return content;
    }
    
    convertEmojiCodes(content) {
        // Simple emoji code conversion
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
        // Process @username mentions (future feature)
        return content;
    }
    
    validateEmoji(emoji) {
        // Check if emoji is in our allowed sets
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
        
        // Transfer money
        fromNation.money -= amount;
        toNation.money += amount;
        
        // Send system message about the tip
        const conversationId = this.getOrCreatePrivateConversation(fromUserId, toUserId);
        const tipMessage = `💰 ${this.getNationName(fromUserId)} sent you $${amount}${message ? `: "${message}"` : ''}`;
        
        this.sendMessage({
            senderId: 'system',
            conversationId,
            content: tipMessage,
            type: 'tip'
        });
        
        EventBus.emit('chat_tip_sent', { fromUserId, toUserId, amount, message });
        
        return true;
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
        // Grant access to alliance chat
        console.log('User joined alliance, granted alliance chat access:', data.userId);
    }
    
    handleAllianceLeft(data) {
        // Revoke access to alliance chat
        console.log('User left alliance, revoked alliance chat access:', data.userId);
    }
    
    // Get messaging statistics
    getMessagingStats() {
        const messages = Array.from(this.messages.values());
        const conversations = Array.from(this.conversations.values());
        
        return {
            totalMessages: messages.length,
            totalConversations: conversations.length,
            onlineUsers: this.onlineUsers.size,
            messagesThisHour: messages.filter(msg => 
                Date.now() - msg.timestamp < 3600000
            ).length,
            privateConversations: conversations.filter(c => c.type === 'private').length,
            channelMessages: messages.filter(msg => 
                msg.conversationId === 'world' || msg.conversationId === 'alliance'
            ).length
        };
    }
    
    destroy() {
        this.conversations.clear();
        this.messages.clear();
        this.onlineUsers.clear();
        this.typingUsers.clear();
        
        // Clear all timeouts
        for (const timeout of this.typingTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.typingTimeouts.clear();
        
        this.isInitialized = false;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MessagingSystem };
}