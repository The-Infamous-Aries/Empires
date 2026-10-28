# Messaging System (Technical Reference)

**File:** `systems/messaging-system.js`
**Class:** `MessagingSystem`
**Global:** `window.MessagingSystem`
**UI Component:** `ui/components/MessagingBubble.js` → `window.MessagingBubble`
**Styles:** `ui/styles/messaging.css`

---

## Overview

The Messaging System handles real-time chat, private 1-1 messages, alliance chat, world chat, named group rooms, typing indicators, message reactions, chat tips, and a floating chat bubble overlay accessible from any page.

It supports:
- **Private 1-1 conversations** between any two users
- **World chat** (public, all players)
- **Alliance chat** (alliance members only)
- **Named group rooms** with invites, archiving, muting, and creator controls
- **Cross-tab synchronization** via `localStorage` and optional server persistence
- **Typing indicators**, **read receipts**, **message reactions**, **message editing/deletion**, **chat tips**

---

## Architecture

```
UI Components (MessagingBubble overlay)
        ↓
MessagingSystem (systems/messaging-system.js)
        ↓
EventBus (core/event-system.js)  — real-time event distribution
        ↓
Game Engine (core/game-engine.js) — system integration
        ↓
Server API (/api/messaging/*)    — optional persistence
        ↓
localStorage                     — cross-tab sync fallback
```

---

## Conversation Types

| Type | ID | Description | Access |
|------|-----|-------------|--------|
| `private` | `userA_userB` (sorted IDs) | 1-1 direct message | Participants only |
| `public` | `world` | World/global chat | Anyone |
| `alliance` | `alliance` | Alliance chat | Alliance members only |
| `group` | `room_<id>` | Named group room | Participants only |

---

## Constructor

```javascript
new MessagingSystem()
```

Automatically calls `initialize()` which:
- Binds EventBus listeners (if `EventBus` is available)
- Sets up typing-indicator cleanup heartbeat (30s interval)
- Sets up cross-tab `storage` listener and server sync interval (60s)
- Calls `loadFromServer()` to restore persisted data

Sets `this.isInitialized = true` immediately (synchronous).

---

## State

| Property | Type | Description |
|----------|------|-------------|
| `conversations` | `Map` | `conversationId → conversation data` |
| `messages` | `Map` | `messageId → message data` |
| `onlineUsers` | `Set` | Currently online user IDs |
| `typingUsers` | `Map` | `conversationId → Set of typing user IDs` |
| `typingTimeouts` | `Map` | `userId → { timeout, startedAt }` |
| `blockedUsers` | `Map` | `userId → Set of blocked userIds` |
| `channels` | `object` | Built-in `world` and `alliance` channel definitions |
| `maxHistoryByType` | `object` | Max message history: private 500, public 1000, alliance 500, group 300 |
| `eventUnsubscribes` | `array` | EventBus unsubscribe functions (cleared on destroy) |
| `storageListener` | `function` | Cross-tab storage event listener |

---

## Methods

### Initialization & Persistence

#### `initialize()` → `void`
Sets up the system. Re-entrancy guard prevents double-initialization. Calls `loadFromServer()`.

#### `loadFromServer()` → `Promise<void>`
Loads messages and rooms from the server:
- `GET /api/messaging/conversations`
- `GET /api/messaging/rooms`

Restores `readBy` Sets after JSON round-trip. Also loads any pending cross-tab sync from `localStorage`.

#### `enablePersistence()` → `void`
Enables periodic server sync (every 60s) of new messages and rooms via `POST /api/messaging/sync`.

#### `destroy()` → `void`
Clears all intervals, removes EventBus listeners, removes storage listener, clears all Maps and Sets, sets `isInitialized = false`.

---

### Sending & Managing Messages

#### `sendMessage(data)` → `messageId`
Sends a message to a conversation, channel, or recipient.

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `senderId` | `string` | Yes | ID of the sender |
| `conversationId` | `string` | No* | Target conversation ID |
| `channelId` | `string` | No* | `'world'` or `'alliance'` |
| `recipientId` | `string` | No* | Private message target |
| `content` | `string` | Yes | Message text (max 2000 chars) |
| `type` | `string` | No | `'text'` (default), `'emoji'`, `'system'`, `'tip'`, `'trade'` |
| `attachments` | `array` | No | Attachment objects (max 10MB each, must have `url`) |

*At least one of `conversationId`, `channelId`, or `recipientId` is required.

**Validation:**
- Content cannot be empty and max 2000 characters
- Attachments must be an array; each needs a `url` string; max 10MB
- Cannot message yourself
- Blocked users cannot message each other (either direction)
- Alliance chat requires alliance membership
- Sender must be a participant in private/group conversations (system messages bypass)

**Behavior:**
- Auto-creates private conversations via `getOrCreatePrivateConversation()`
- Auto-creates channel conversations via `createChannelConversation()`
- Trims message history per conversation type (`maxHistoryByType`)
- Stops typing indicator for sender
- Syncs to `localStorage` for cross-tab delivery
- Emits `message_sent` event

#### `editMessage(data)` → `boolean`
Edits a message (sender only, within 15 minutes).

**Parameters:** `messageId`, `userId`, `newContent`

**Constraints:**
- Only the sender can edit
- Content cannot be empty, max 2000 characters
- Must be within 15 minutes of original timestamp

Emits `message_edited`.

#### `deleteMessage(data)` → `boolean`
Deletes a message (sender only).

**Parameters:** `messageId`, `userId`

**Behavior:**
- Removes message ID from conversation's message array
- Updates `lastMessage`/`lastActivity` if the deleted message was the last one
- Deletes the message from `this.messages`
- Emits `message_deleted`

---

### Conversation Management

#### `getOrCreatePrivateConversation(user1Id, user2Id)` → `conversationId`
Creates or returns a private conversation ID (sorted user IDs joined by `_`).

#### `createChannelConversation(channelId)` → `conversation`
Creates a channel conversation (`world` or `alliance`) if it doesn't exist.

#### `getConversation(conversationId, options?)` → `object|null`
Returns a conversation with its messages.

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `limit` | `number` | `50` | Max messages to return |
| `offset` | `number` | `0` | Skip this many from the end |
| `markAsRead` | `boolean` | `false` | Mark returned messages as read |
| `userId` | `string` | `null` | User ID for read marking |

Returns newest messages first (from end of array). Includes `totalMessages` count.

#### `getUserConversations(userId)` → `array`
Returns all conversations accessible to a user (private, public, alliance, non-archived group), sorted by last activity descending. Each entry includes `lastMessage` and `unreadCount`.

#### `getRecentMessages(conversationId, limit?)` → `array`
Returns recent messages for a conversation with `senderName` resolved.

#### `markAsRead(conversationId, userId, messageIds?)` → `count`
Marks messages as read. Emits `messages_read` if any were marked.

#### `getUnreadCount(conversationId, userId)` → `number`
Returns count of unread messages in a conversation for a user.

---

### Blocked Users

#### `blockUser(userId, targetId)` → `void`
Adds `targetId` to `userId`'s block list.

#### `unblockUser(userId, targetId)` → `void`
Removes `targetId` from `userId`'s block list.

#### `isBlocked(userId, targetId)` → `boolean`
Returns `true` if `userId` has blocked `targetId`.

#### `getBlockedUsers(userId)` → `array`
Returns array of blocked user IDs.

---

### Typing Indicators

#### `startTyping(userId, conversationId)` → `void`
Marks a user as typing in a conversation. Clears any existing typing indicator for that user in other conversations. Auto-stops after 10 seconds. Emits `typing_start`.

#### `stopTyping(userId)` → `void`
Stops typing for a user across all conversations. Emits `typing_stop` per affected conversation.

#### `getTypingUsers(conversationId)` → `array`
Returns array of user IDs currently typing in a conversation.

#### `cleanupTypingIndicators()` → `void`
Called every 30s via heartbeat. Removes typing indicators older than 15 seconds.

---

### Group Room System

#### `createRoom(name, creatorId, participantIds?, options?)` → `roomId`
Creates a named group room.

**Options:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `icon` | `string` | `'💬'` | Room icon emoji |
| `description` | `string` | `''` | Room description |
| `maxParticipants` | `number` | `100` | Max room members |

**Constraints:** Name required, max 100 chars, creator required, `participantIds` must be an array.

Emits `room_created`.

#### `inviteToRoom(roomId, userId, inviterId)` → `boolean`
Invites a user to a group room. Inviter must be a participant. Room must not be full.

Emits `room_invite`.

#### `leaveRoom(roomId, userId)` → `boolean`
Leaves a group room. If the room becomes empty and the leaver is not the creator, the empty room is removed from memory. If the creator leaves, `deleteRoom()` is called.

Emits `room_left`.

#### `removeFromRoom(roomId, targetId, actorId)` → `boolean`
Removes a user from a group room (creator only). Cannot remove the creator.

Emits `room_removed`.

#### `deleteRoom(roomId, userId)` → `boolean`
Deletes a group room (creator only). Deletes all messages in the room.

Emits `room_deleted`.

#### `renameRoom(roomId, newName, userId)` → `boolean`
Renames a group room (creator only). Max 100 chars implied by name validation.

Emits `room_renamed`.

#### `archiveRoom(roomId, userId, archived?)` → `boolean`
Archives/unarchives a group room (participant only). Archived rooms are hidden from `getUserConversations` but available via `getUserRooms` with `includeArchived: true`.

Emits `room_archived`.

#### `muteRoom(roomId, userId, muted?)` → `boolean`
Mutes/unmutes a group room (participant only).

Emits `room_muted`.

#### `getRoom(roomId)` → `object|null`
Returns a conversation/room by ID.

#### `getUserRooms(userId, options?)` → `array`
Returns all group rooms a user participates in.

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeArchived` | `boolean` | `false` | Include archived rooms |

Sorted by last activity descending. Each entry includes `lastMessage` and `unreadCount`.

---

### Reactions

#### `addMessageReaction(data)` → `boolean`
Adds or toggles a reaction on a message.

**Parameters:** `messageId`, `userId`, `emoji`

**Behavior:**
- Removes user's existing reaction on the message (toggle behavior)
- Adds the new reaction
- Validates emoji against known emoji sets or Unicode emoji regex

Emits `message_reaction_added`.

---

### Chat Tips

#### `sendChatTip(data)` → `boolean`
Sends money through chat as a tip.

**Parameters:** `fromUserId`, `toUserId`, `amount`, `message?`

**Constraints:**
- Amount must be ≥ $1
- Sender must have sufficient funds
- Recipient must exist
- Cannot tip yourself

**Behavior:**
- Transfers money between nations
- Creates a private conversation if needed
- Sends a system tip message
- Emits `chat_tip_sent`

---

### Nation Resolution

#### `getNation(userId)` → `object|null`
Resolves a user's nation data. Checks (in order):
1. `window.Nation` if `userId` matches current player
2. `window.GameEngine.systems.economy.getNation(userId)`
3. `window.DataManager.currentPlayer.nations` find by ID

#### `getNationName(userId)` → `string`
Returns the nation name, or `'System'` for system messages, or `Nation <userId>` as fallback.

---

### Statistics

#### `getMessagingStats()` → `object`
Returns:

| Field | Description |
|-------|-------------|
| `totalMessages` | Total message count |
| `totalConversations` | Total conversation count |
| `onlineUsers` | Currently online user count |
| `messagesThisHour` | Messages in the last hour |
| `privateConversations` | Count of private conversations |
| `groupConversations` | Count of group conversations |
| `channelMessages` | World + alliance messages |
| `worldMessages` | World chat messages |
| `allianceMessages` | Alliance chat messages |
| `privateMessages` | Private message count |
| `groupMessages` | Group room message count |

---

### EventBus Events

| Event | Data | Source |
|-------|------|--------|
| `message_sent` | `{ message, conversation }` | `sendMessage`, `_applyRemoteMessage` |
| `message_edited` | `{ message }` | `editMessage` |
| `message_deleted` | `{ messageId, conversationId }` | `deleteMessage` |
| `message_reaction_added` | `{ messageId, userId, emoji }` | `addMessageReaction` |
| `typing_start` | `{ userId, conversationId }` | `startTyping` |
| `typing_stop` | `{ userId, conversationId }` | `stopTyping` |
| `messages_read` | `{ conversationId, userId, count }` | `markAsRead` |
| `room_created` | `{ room }` | `createRoom` |
| `room_invite` | `{ roomId, userId, inviterId }` | `inviteToRoom` |
| `room_left` | `{ roomId, userId }` | `leaveRoom` |
| `room_removed` | `{ roomId, targetId, actorId }` | `removeFromRoom` |
| `room_deleted` | `{ roomId }` | `deleteRoom` |
| `room_renamed` | `{ roomId, name }` | `renameRoom` |
| `room_archived` | `{ roomId, archived }` | `archiveRoom` |
| `room_muted` | `{ roomId, muted }` | `muteRoom` |
| `chat_tip_sent` | `{ fromUserId, toUserId, amount, message }` | `sendChatTip` |
| `user_online` | `{ userId, timestamp }` | `setUserOnline` |
| `user_offline` | `{ userId, timestamp }` | `setUserOffline` |

---

### Internal Helpers

| Method | Description |
|--------|-------------|
| `_emit(eventType, data)` | Safely emits via EventBus if available |
| `_ensureReadBy(message)` | Restores `readBy` as a `Set` after JSON round-trip |
| `_messageForPersistence(message)` | Converts message `Set` fields to arrays for JSON |
| `_conversationForPersistence(conversation)` | Converts conversation `Set` fields to arrays for JSON |
| `_applyRemoteMessage(payload)` | Applies a message received from another tab/server |
| `_persistToServer()` | Sends new messages/rooms to server every 60s |
| `_getCurrentUserId()` | Returns current player/nation ID |
| `processMessageContent(content)` | Converts emoji codes, processes mentions, sanitizes HTML |
| `sanitizeHtml(content)` | Strips HTML tags via `textContent`/`innerHTML` (XSS prevention) |
| `convertEmojiCodes(content)` | Converts `:smile:`, `:heart:`, etc. to emoji |
| `generateId(prefix)` | Generates unique IDs |
| `getNation(userId)` / `getNationName(userId)` | Nation resolution |

---

## MessagingBubble UI Component

**File:** `ui/components/MessagingBubble.js`
**Global:** `window.MessagingBubble`
**Styles:** `ui/styles/messaging.css`

A floating chat bubble overlay accessible from any page.

### Features

- **Toggle button** (`💬`) fixed at bottom-right corner
- **Unread badge** showing total unread count across all conversations
- **Window** with conversation list sidebar + active conversation view
- **Conversation list** showing private chats, world/alliance chat, and group rooms with unread badges
- **Message view** with own/other/system message styling, timestamps, and sender names
- **Input area** with auto-resizing textarea and send button (Enter to send)
- **Create room dialog** for creating named group rooms
- **ESC to close**, click toggle to open/close
- **State persistence** — open/closed state and last active conversation saved to `localStorage`
- **Cross-tab awareness** — new messages update conversation list and message view in real-time

### Initialization

```javascript
// In game-engine.js after MessagingSystem is created
const bubble = new MessagingBubble();
bubble.init(messagingSystem);
window.MessagingBubble = bubble;
```

The bubble listens to `message_sent`, `room_created`, `room_invite`, `room_left`, `room_deleted`, `messages_read`, `typing_start`, and `typing_stop` events to stay in sync.

---

## Integration Points

| System | Integration |
|--------|-------------|
| `core/game-engine.js` | Creates `MessagingSystem`, initializes `MessagingBubble`, exposes both on `window` |
| `ui/components/BottomMenu.js` | Calls `getMessagingStats()` and `getRecentMessages()` |
| `server.js` | `GET/POST /api/messaging/conversations`, `POST /api/messaging/rooms`, `POST /api/messaging/sync` |
| `index.html` | Loads `messaging.css`, `messaging-system.js`, `MessagingBubble.js` |
| `core/event-system.js` | EventBus for real-time event distribution |
| `core/game-engine.js` | `window.GameEngine.systems.messaging` |

---

## Server Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/messaging/conversations` | `GET` | List all persisted conversations |
| `/api/messaging/rooms` | `POST` | Create a persisted group room |
| `/api/messaging/sync` | `POST` | Sync new messages and rooms from client |

Server state is stored in `world.state.messaging` with `messages` and `rooms` maps.

---

## Message Data Structure

```javascript
{
    id: "msg_<timestamp>_<random>",
    conversationId: "string",
    senderId: "string",
    content: "string (sanitized HTML)",
    type: "text\|emoji\|system\|tip\|trade",
    attachments: [{ url: "string", size?: number }],
    timestamp: <epoch ms>,
    edited: false,
    editedAt: null,
    reactions: { "👍": ["userId1", "userId2"], ... },
    readBy: Set([userId, ...])
}
```

## Conversation Data Structure

```javascript
{
    id: "string",
    type: "private\|public\|alliance\|group",
    name: "string (for groups/channels)",
    icon: "string (emoji)",
    description: "string (for groups)",
    creatorId: "string (for groups)",
    participants: ["userId1", "userId2", ...],
    messages: ["msgId1", "msgId2", ...],
    createdAt: <epoch ms>,
    lastActivity: <epoch ms>,
    lastMessage: "msgId\|null",
    maxParticipants: <number (groups)>,
    isArchived: <boolean (groups)>,
    isMuted: <boolean (groups)>
}
```

---

## Message Type Emoji Sets

| Set | Examples |
|-----|----------|
| `faces` | 😀 😃 😄 😂 😍 😘 🤩 🤪 |
| `reactions` | 👍 👎 ❤️ 🔥 🎉 💯 👏 |
| `objects` | ⚔️ 🛡️ 👑 💰 💎 🏆 ⚡ 🔥 |
| `nations` | 🏛️ 🏰 🏗️ 🏙️ 🌍 🏴 🚩 |

---

## Emoji Shortcodes

| Code | Emoji |
|------|-------|
| `:smile:` | 😀 |
| `:laugh:` | 😂 |
| `:heart:` | ❤️ |
| `:thumbsup:` | 👍 |
| `:thumbsdown:` | 👎 |
| `:fire:` | 🔥 |
| `:star:` | ⭐ |
| `:crown:` | 👑 |
| `:money:` | 💰 |
| `:sword:` | ⚔️ |
