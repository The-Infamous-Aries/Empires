# Forum System

Handles posts, comments, reaction rankings, media uploads, tips, moderation, reports, rate limiting, notifications, pagination, and save/load persistence for the in-game news board and discussion platform.

## Overview

| Item | Value |
|------|-------|
| **System class:** | `ForumSystem` |
| **Global instance:** | `window.ForumSystem` |
| **Primary config:** | `systems/forum-system.js` |
| **Bootstrapped by:** | `core/game-engine.js` (`this.systems.forum`) |
| **Save version:** | `2` |

The Forum System is a fully featured discussion platform where players can create posts, comment with nested replies, react to content using a 4-type ranking system, tip other nations money, report harmful content, and receive notifications. Moderators can pin, lock, hide, and unhide posts, and review reports.

---

## Data Model

### Posts

Each post is stored in `this.posts` (a `Map` keyed by post ID):

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique post ID (`post_<timestamp>_<counter>_<random>`) |
| `authorId` | string | User/nation ID of the author |
| `title` | string | Post title (max 200 chars) |
| `content` | string | Post body (max 10,000 chars) |
| `category` | string | Category key (see Categories below) |
| `media` | array | Uploaded media items (max 5 images per post) |
| `tags` | array | Tag strings for search/filter |
| `createdAt` | number | Timestamp of creation |
| `updatedAt` | number | Timestamp of last edit |
| `editedAt` | number \| null | Timestamp of last edit, or null if never edited |
| `views` | number | View count (incremented on `getPost`) |
| `commentCount` | number | Total comments including replies |
| `reactions` | object | User reaction data (see Reaction Ranking) |
| `isPinned` | boolean | Pinned to top by moderator |
| `isLocked` | boolean | Locked — no new comments allowed |
| `isHidden` | boolean | Hidden from regular users |

### Comments

Each comment is stored in `this.comments` (a `Map` keyed by comment ID):

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique comment ID |
| `postId` | string | ID of the parent post |
| `authorId` | string | User/nation ID of the author |
| `content` | string | Comment body (max 5,000 chars) |
| `media` | array | Uploaded media items (max 3 images per comment) |
| `parentCommentId` | string \| null | ID of parent comment for replies, or null for top-level |
| `createdAt` | number | Timestamp of creation |
| `updatedAt` | number | Timestamp of last edit |
| `editedAt` | number \| null | Timestamp of last edit |
| `reactions` | object | User reaction data |
| `replies` | array | Array of child comment IDs |
| `isHidden` | boolean | Hidden from regular users |

### Tips

Each tip is stored in `this.tips` (a `Map` keyed by tip ID):

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique tip ID |
| `fromUserId` | string | Sender user/nation ID |
| `toUserId` | string | Recipient user/nation ID |
| `targetId` | string \| null | Post or comment ID being tipped on |
| `targetType` | string \| null | `'post'` or `'comment'` |
| `amount` | number | Tip amount in money (minimum $1) |
| `message` | string | Optional tip message |
| `createdAt` | number | Timestamp of creation |

### Reports

Each report is stored in `this.reports` (a `Map` keyed by report ID):

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique report ID |
| `reporterId` | string | User who filed the report |
| `targetId` | string | Post or comment ID being reported |
| `targetType` | string | `'post'` or `'comment'` |
| `reason` | string | Report reason key (see Report Reasons) |
| `description` | string | Optional reporter description |
| `status` | string | `'pending'`, `'reviewed'`, `'dismissed'`, `'actioned'` |
| `createdAt` | number | Timestamp of creation |
| `reviewedBy` | string \| null | Moderator who reviewed it |
| `reviewedAt` | number \| null | Timestamp of review |
| `moderatorAction` | string \| null | Action taken by moderator |

### Notifications

Notifications are stored per-user in `this.notifications` (a `Map` of userId → array):

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique notification ID |
| `userId` | string | Recipient user/nation ID |
| `type` | string | Notification type (`'tip'`, `'report'`, `'report_reviewed'`) |
| `targetId` | string | Related post/comment/report ID |
| `targetType` | string | Type of target |
| `actorId` | string | User who triggered the notification |
| `message` | string | Human-readable message |
| `createdAt` | number | Timestamp of creation |
| `isRead` | boolean | Read status |

---

## Categories

| Category Key | Name | Icon | Color |
|--------------|------|------|-------|
| `general` | General Discussion | 💬 | `#4a90e2` |
| `news` | Game News | 📰 | `#27ae60` |
| `strategy` | Strategy & Tips | 🎯 | `#e67e22` |
| `diplomacy` | Diplomacy & Politics | 🤝 | `#9b59b6` |
| `military` | Military & War | ⚔️ | `#e74c3c` |
| `help` | Help & Support | ❓ | `#95a5a6` |
| `showcase` | Nation Showcase | 🏛️ | `#34495e` |
| `roleplay` | Role Play | 🎭 | `#e91e63` |
| `alliance_announcements` | Alliance Announcements | 🏰 | `#795548` |
| `nation_announcements` | Nation Announcements | 📢 | `#607d8b` |
| `flex_brag` | Flex/Brag | 💪 | `#ff9800` |

---

## Reaction Ranking System

The forum uses a 4-type reaction ranking system where users rate content on a scale of 1–6 in two independent style groups:

| Group | Type | Icon Asset | Description |
|-------|------|------------|-------------|
| Sentiment | `like` | `assets/images/Forum/like-{rating}.png` | Positive sentiment |
| Sentiment | `dislike` | `assets/images/Forum/dislike-{rating}.png` | Negative sentiment |
| Reaction | `lol` | `assets/images/Forum/lol-{rating}.png` | Funny / amusing |
| Reaction | `wtf` | `assets/images/Forum/wtf-{rating}.png` | Surprising / shocking |

### Rules

- **Rating scale:** 1 to 6 (integers only).
- **Mutual exclusivity within groups:** A user can pick **only one** Sentiment reaction (`like` OR `dislike`) and **only one** Reaction (`lol` OR `wtf`) per target.
- **Cross-group combinations:** Any combination across groups is allowed:
  - `like + lol`
  - `like + wtf`
  - `dislike + lol`
  - `dislike + wtf`
  - Single reactions only
  - No reactions at all
- **Replacing reactions:** Reacting again in the same group replaces the previous reaction (and its rating).

### Internal Data Structure

```js
target.reactions = {
  [userId]: {
    sentiment: { type: 'like' | 'dislike', rating: 1..6 } | null,
    reaction:  { type: 'lol' | 'wtf', rating: 1..6 } | null
  }
}
```

---

## Rate Limiting

Rate limits prevent spam by capping actions per user per hour:

| Action | Max per Hour |
|--------|-------------|
| Posts | 10 |
| Comments | 30 |
| Tips | 20 |
| Reports | 10 |

- Window: 60 minutes (`3600000 ms`)
- `checkRateLimit(userId, actionType)` returns `{ allowed, remaining, limit, resetAt, windowMs }`
- `recordRateLimitAction(userId, actionType)` records an action
- `getRateLimitStatus(userId)` returns status for all four action types

---

## Moderation

Moderators are tracked in `this.moderators` (a `Set` of user IDs). Bootstrap initial moderators via the constructor:

```js
const forum = new ForumSystem({ initialModerators: ['user_123'] });
```

### Moderator Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `addModerator(userId)` | userId | Grant moderator privileges |
| `removeModerator(userId)` | userId | Revoke moderator privileges |
| `isModerator(userId)` | userId | Check moderator status |
| `pinPost(postId, userId)` | postId, userId | Pin a post (moderator only) |
| `unpinPost(postId, userId)` | postId, userId | Unpin a post |
| `lockPost(postId, userId)` | postId, userId | Lock a post (no new comments) |
| `unlockPost(postId, userId)` | postId, userId | Unlock a post |
| `hidePost(postId, userId)` | postId, userId | Hide a post from regular users |
| `unhidePost(postId, userId)` | postId, userId | Restore a hidden post |
| `reviewReport(data)` | reportId, moderatorId, status, moderatorAction | Review a pending report |

### Moderator Overrides

Moderators can edit or delete any post or comment, regardless of authorship.

---

## Report System

Users can report posts or comments they find harmful or inappropriate. There is **no profanity filter** — users have full free speech, but other users can report content they find bad or harmful.

### Report Reasons

| Reason Key | Name | Description |
|------------|------|-------------|
| `spam` | Spam | Repeated or irrelevant content |
| `harassment` | Harassment | Targeted abuse or hostility |
| `harmful` | Harmful Content | Content that may cause harm |
| `misinformation` | Misinformation | False or misleading claims |
| `other` | Other | Other reason |

### Report Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting moderator review |
| `reviewed` | Moderator has reviewed but taken no action |
| `dismissed` | Report reviewed and found invalid |
| `actioned` | Report reviewed and action taken (e.g., post hidden) |

Moderators receive notifications when new reports are created. Reporters receive notifications when their report is reviewed.

---

## Tips

Players can send money tips to other nations through the forum. Tips are transferred through the Economy System's `transferCurrency` method (with direct money transfer as a fallback).

- Minimum tip: $1
- Cannot tip yourself
- Sender must have sufficient funds
- Recipient must exist
- Tips are rate-limited (20 per hour per user)
- Recipients receive a notification

---

## Media Uploads

| Setting | Value |
|---------|-------|
| Max file size | 10 MB |
| Max images per post | 5 |
| Max images per comment | 3 |
| Allowed types | `image/jpeg`, `image/png`, `image/gif`, `image/webp` |

Media items are objects with `type` (MIME type) and optional `size` (bytes) properties.

---

## API Reference

### Post Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `createPost(data)` | `{authorId, title, content, category, media, tags}` | `postId` (string) | Create a new post |
| `editPost(data)` | `{postId, userId, title?, content?, media?, tags?, category?}` | `true` | Edit a post (author or moderator only) |
| `deletePost(data)` | `{postId, userId}` | `true` | Delete a post and all its comments |
| `getPost(postId, options?)` | postId, `{includeHidden?, userId?}` | post object or null | Get a post with its comments and replies |
| `getPosts(options?)` | `{category?, tags?, authorId?, search?, sortBy?, sortOrder?, page?, limit?, includeHidden?}` | `{posts, totalPosts, page, limit, totalPages}` | Get filtered, sorted, paginated posts |
| `getRecentPosts(limit?)` | limit (default 5) | array of post summaries | Get most recent posts |

### Comment Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `createComment(data)` | `{authorId, postId, content, parentCommentId?, media?}` | `commentId` (string) | Create a comment or reply |
| `editComment(data)` | `{commentId, userId, content?, media?}` | `true` | Edit a comment |
| `deleteComment(data)` | `{commentId, userId}` | `true` | Delete a comment and its replies |
| `getComments(postId, options?)` | postId, `{page?, limit?, sortOrder?, includeHidden?}` | `{comments, totalComments, page, limit, totalPages}` | Get comments for a post |

### Reaction Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addReaction(data)` | `{userId, targetId, targetType, reactionType, rating}` | `true` | Add or update a reaction (rating 1–6) |
| `removeReaction(data)` | `{userId, targetId, targetType}` | `boolean` | Remove a user's reaction from a target |
| `getUserReaction(reactions, userId)` | reactions object, userId | `{sentiment, reaction}` or null | Get a user's reaction on a target |
| `getReactionStats(reactions)` | reactions object | stats per type | Get aggregated reaction stats |
| `getTotalReactions(reactions)` | reactions object | number | Count total reactions |

### Tip Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `sendTip(data)` | `{fromUserId, toUserId, targetId?, targetType?, amount, message?}` | `tipId` (string) | Send a money tip |

### Report Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `reportContent(data)` | `{reporterId, targetId, targetType, reason, description?}` | `reportId` (string) | File a report |
| `reviewReport(data)` | `{reportId, moderatorId, status, moderatorAction?}` | `true` | Review a report (moderator only) |
| `getReports(options?)` | `{status?, reporterId?, targetType?, reason?, reviewedBy?, sortBy?, sortOrder?, page?, limit?}` | `{reports, totalReports, page, limit, totalPages}` | Get filtered reports |
| `getReportStats()` | none | stats object | Get report statistics |

### Notification Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getNotifications(userId, options?)` | userId, `{page?, limit?, unreadOnly?}` | `{notifications, total, unreadCount, page, limit, totalPages}` | Get user notifications |
| `markNotificationRead(userId, notificationId)` | userId, notificationId | `boolean` | Mark a notification as read |
| `markAllNotificationsRead(userId)` | userId | number | Mark all notifications as read, returns count |

### Moderation Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addModerator(userId)` | userId | none | Grant moderator privileges |
| `removeModerator(userId)` | userId | none | Revoke moderator privileges |
| `isModerator(userId)` | userId | boolean | Check moderator status |
| `pinPost(postId, userId)` | postId, userId | true | Pin a post |
| `unpinPost(postId, userId)` | postId, userId | true | Unpin a post |
| `lockPost(postId, userId)` | postId, userId | true | Lock a post |
| `unlockPost(postId, userId)` | postId, userId | true | Unlock a post |
| `hidePost(postId, userId)` | postId, userId | true | Hide a post |
| `unhidePost(postId, userId)` | postId, userId | true | Unhide a post |

### Rate Limit Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `checkRateLimit(userId, actionType)` | userId, actionType | `{allowed, remaining, limit, resetAt, windowMs}` | Check if an action is allowed |
| `recordRateLimitAction(userId, actionType)` | userId, actionType | none | Record an action |
| `getRateLimitStatus(userId)` | userId | `{posts, comments, tips, reports}` | Get all rate limit statuses |

### Statistics Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getForumStats()` | none | stats object | Get overall forum statistics |
| `getCategoryCounts()` | none | `{categoryKey: count}` | Get post count per category |
| `getTopPosters(limit?)` | limit (default 10) | array of `{userId, count, name}` | Get top posters |

### Media Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `validateMedia(media, maxImages?)` | media array, maxImages | none | Validate media array (throws on error) |

### Persistence Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getSaveData()` | none | save object | Export all forum data for saving |
| `loadSaveData(data)` | save object | boolean | Import forum data from a save (version 2) |

### Lifecycle Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `initialize()` | none | promise | Initialize the system (idempotent) |
| `destroy()` | none | none | Clean up all data and event listeners |

---

## EventBus Events

| Event | Data | Description |
|-------|------|-------------|
| `forum_post_created` | `{post}` | A post was created |
| `forum_comment_created` | `{comment, post}` | A comment was created |
| `forum_reaction_added` | `{userId, targetId, targetType, reactionType, rating}` | A reaction was added/updated |
| `forum_tip_sent` | `{tip}` | A tip was sent |
| `forum_post_edited` | `{post}` | A post was edited |
| `forum_post_deleted` | `{postId, post}` | A post was deleted |
| `forum_comment_edited` | `{comment}` | A comment was edited |
| `forum_comment_deleted` | `{commentId, comment}` | A comment was deleted |
| `forum_report_created` | `{report}` | A report was filed |
| `forum_report_reviewed` | `{report}` | A report was reviewed |
| `forum_notification_created` | `{notification}` | A notification was created |

---

## Save Data Format

`getSaveData()` returns an object with version `2`:

```js
{
  version: 2,
  posts: [ [id, postData], ... ],        // Map entries
  comments: [ [id, commentData], ... ],  // Map entries
  tips: [ [id, tipData], ... ],          // Map entries
  reports: [ [id, reportData], ... ],    // Map entries
  notifications: [ [userId, [notif, ...]], ... ], // Map entries
  moderators: ['user_1', 'user_2', ...], // Set as array
  rateLimits: [ [userId, {posts, comments, tips, reports}], ... ], // Map entries
  idCounter: 123                         // Internal ID counter
}
```

`loadSaveData(data)` restores all data from a save object. Returns `false` if the version doesn't match `2`.

---

## Error Handling

All methods throw `Error` with descriptive messages for invalid input, missing data, permission denials, rate limit exceeded, and not-found targets. Callers should wrap calls in `try/catch`.
