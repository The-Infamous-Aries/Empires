/**
 * Message Database - Handles all world/alliance/private messages
 * Source of truth: server/world.js (messages array) + systems/Chat/messaging-system.js
 * Persisted to: saves/db/messages.json
 *
 * NOTE: server/world.js uses 'author' field, while messaging-system.js uses 'senderId'.
 * This database normalizes both to 'authorId' for consistency.
 */

const BaseDatabase = require('./base-database');

class MessageDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            id: { type: 'string', required: true, indexed: true },
            authorId: { type: 'string', required: true, indexed: true }, // normalized from 'author' (server) or 'senderId' (client)
            channel: { type: 'string', required: true, indexed: true }, // 'world', 'alliance', 'private'
            target: { type: 'string', indexed: true }, // allianceId or recipient nationId
            body: { type: 'string', required: true }, // message content
            content: { type: 'string' }, // alias for body (client format)
            createdAt: { type: 'number', indexed: true },
            timestamp: { type: 'number', indexed: true }, // client format alias for createdAt
            isActive: { type: 'boolean', default: true, indexed: true },
            readBy: { type: 'array', default: [] }, // array of userIds who have read the message
            attachments: { type: 'array', default: [] }, // array of {url, size, type}
            version: { type: 'number', default: 1 }
        };

        super('messages', schema);
    }

    // ─── Insert/Update overrides (normalize author/senderId → authorId) ─

    async insert(id, record) {
        const normalized = this._normalizeRecord({ ...record });
        return super.insert(id, normalized);
    }

    async update(id, updates) {
        const normalized = this._normalizeRecord({ ...updates });
        return super.update(id, normalized);
    }

    _normalizeRecord(record) {
        // Normalize 'author' (server format) → 'authorId'
        if (record.author !== undefined && record.authorId === undefined) {
            record.authorId = record.author;
            delete record.author;
        }
        // Normalize 'senderId' (client format) → 'authorId'
        if (record.senderId !== undefined && record.authorId === undefined) {
            record.authorId = record.senderId;
            delete record.senderId;
        }
        // Normalize 'content' (client format) → 'body'
        if (record.content !== undefined && record.body === undefined) {
            record.body = record.content;
            delete record.content;
        }
        // Normalize 'timestamp' (client format) → 'createdAt'
        if (record.timestamp !== undefined && record.createdAt === undefined) {
            record.createdAt = record.timestamp;
            delete record.timestamp;
        }
        // Ensure isActive defaults to true
        if (record.isActive === undefined) {
            record.isActive = true;
        }
        return record;
    }

    // ─── Create Message (matches server/world.js format) ──────────────────

    async createMessage(messageData) {
        const id = messageData.id || this.generateMessageId();
        const now = Date.now();

        const message = {
            id,
            authorId: messageData.authorId || messageData.author || messageData.senderId || null,
            channel: messageData.channel, // 'world', 'alliance', 'private'
            target: messageData.target || null, // allianceId or recipient nationId
            body: messageData.body || messageData.content || '',
            createdAt: messageData.createdAt || messageData.timestamp || now,
            timestamp: messageData.createdAt || messageData.timestamp || now,
            isActive: true,
            readBy: messageData.readBy || [],
            attachments: messageData.attachments || [],
            version: 1
        };

        return await this.insert(id, message);
    }

    // ─── Query helpers ──────────────────────────────────────────────────

    async findByChannel(channel, permissions = ['public'], limit = 100) {
        const messages = await this.findByIndex('channel', channel, permissions);
        return messages
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, limit);
    }

    async findByAuthor(authorId, permissions = ['public']) {
        return this.findByIndex('authorId', authorId, permissions);
    }

    async findByTarget(target, permissions = ['public']) {
        return this.findByIndex('target', target, permissions);
    }

    async getWorldMessages(permissions = ['public'], limit = 200) {
        return this.findByChannel('world', permissions, limit);
    }

    async getAllianceMessages(allianceId, permissions = ['public'], limit = 200) {
        return this.findByTarget(allianceId, permissions, limit);
    }

    async getPrivateMessages(userId, permissions = ['public'], limit = 200) {
        // Private messages: channel === 'private' AND (authorId === userId OR target === userId)
        // No isActive filter needed — isActive defaults to true and is only false for deleted messages
        const messages = await this.query(
            [],
            { channel: 'private', isActive: true },
            permissions
        );
        return messages
            .filter(m => m.authorId === userId || m.target === userId)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, limit);
    }

    async pruneOldMessages(keepCount = 2000) {
        const allMessages = Array.from(this.data.values())
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        const toDelete = allMessages.slice(keepCount);
        for (const msg of toDelete) {
            await this.delete(msg.id);
        }
    }

    // ─── Read status ────────────────────────────────────────────────────

    async markAsRead(messageId, userId) {
        const message = this.findById(messageId, ['admin']);
        if (!message) throw new Error('Message not found');

        const readBy = [...(message.readBy || [])];
        if (!readBy.includes(userId)) {
            readBy.push(userId);
        }

        return await this.update(messageId, { readBy });
    }

    async markAsUnread(messageId, userId) {
        const message = this.findById(messageId, ['admin']);
        if (!message) throw new Error('Message not found');

        const readBy = (message.readBy || []).filter(uid => uid !== userId);

        return await this.update(messageId, { readBy });
    }

    async getUnreadCount(userId, permissions = ['public']) {
        const messages = await this.query(
            [],
            { channel: 'private', isActive: true },
            permissions
        );
        return messages.filter(
            m => m.target === userId && !(m.readBy || []).includes(userId)
        ).length;
    }

    // ─── Permission filtering ───────────────────────────────────────────

    hasPermissionToView(record, permissions) {
        if (permissions.includes('admin')) return true;
        if (permissions.includes('private_messages')) return true;
        if (permissions.includes('public')) {
            // Public can see world and alliance messages, not private
            return record.channel !== 'private';
        }
        return false;
    }

    // ─── ID Generation ───────────────────────────────────────────────────

    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MessageDatabase };
}
