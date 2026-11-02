# Admin Systems — `core/admin-system.js` & `core/admin-init.js`

**Purpose:** Comprehensive administration and monitoring: user management, error tracking, action logging, bug reports, and game monitoring.

---

## File Overview

| File | Responsibility |
|------|---------------|
| `admin-system.js` | Admin system class: admins, bans, warnings, error logs, action logs, bug reports, analytics |
| `admin-init.js` | Boot admin system, auto-grant super_admin, keyboard shortcuts, event listeners |

---

## 1. Admin System — `core/admin-system.js`

**Purpose:** Lets admins monitor the game, ban/warn players, review bug reports, view error logs, and track all game actions.

### Permission Levels

| Level | Value | What They Can Do |
|-------|-------|-----------------|
| `MODERATOR` | 1 | Basic moderation: warn, view logs |
| `ADMIN` | 2 | Ban, moderate posts, view all data |
| `SUPER_ADMIN` | 3 | Everything: add/remove admins, full access |

### Admin Features

| Feature | Description |
|---------|-------------|
| **Add/Remove admins** | Grant or revoke admin status with permission level |
| **Ban users** | Temporary or permanent bans with reason and duration |
| **Warn users** | Track warnings; auto-ban after 5 non-low warnings |
| **Moderate posts** | Hide, delete, edit, or flag forum/news posts |
| **Error logging** | Capture JS errors, unhandled rejections, console.error |
| **Bug reports** | Submit, track, update status of bug reports |
| **Action logging** | Log every admin action and game event |
| **Analytics** | Player, alliance, war, economy, and error analytics |
| **Force logout** | Terminate a player's session |

### Ban System

| Type | Duration | Behavior |
|------|----------|----------|
| Temporary | X hours | Expires automatically; player can return after |
| Permanent | null | Never expires; player is permanently banned |

### Error Tracking

| Source | Captured |
|--------|----------|
| `window.onerror` | JavaScript runtime errors |
| `unhandledrejection` | Promise rejections |
| `console.error` override | All console.error calls |
| `logError()` calls | Manual error logging from game code |

Each error entry includes: message, stack trace, error name, severity, context (player, URL, user agent, game state), and timestamp.

### Bug Reports

Each bug report includes: title, description, steps to reproduce, severity, category, attachments, game state snapshot, browser info, status (open/closed), and admin notes.

### Analytics Placeholders

Most analytics methods return empty/zero values (`getTotalPlayerCount()`, `getActivePlayerCount()`, etc.) — these are stubs to be implemented based on actual data sources. Only `getErrorAnalytics()` returns real data (last 100 error log entries).

### Events Emitted

| Event | When Fired |
|-------|-----------|
| `admin_system_initialized` | Admin system ready |
| `admin_added` / `admin_removed` | Admin granted or revoked |
| `admin_action_logged` | Any admin action logged |
| `admin_error_logged` | Error captured |
| `bug_report_submitted` / `bug_report_updated` | Bug report created or modified |
| `user_warned` / `user_banned` | Player warned or banned |
| `post_moderated` | Forum post moderated |
| `admin_attention_required` | Critical error flagged |
| `player_force_logged_out` | Player session terminated |

---

## 2. Admin Init — `core/admin-init.js`

**Purpose:** Boot the admin system, promote the first player to super_admin, set up keyboard shortcuts and event listeners.

### Auto-Initialization

Called automatically when:
1. DOM is loaded (`DOMContentLoaded`)
2. DOM already loaded (setTimeout fallback of 500ms)
3. Game starts (`game_started` event)

**Single initialization guard:** Uses `window.__ADMIN_INIT_DONE__` to prevent double initialization from multiple triggers.

### Super Admin Auto-Grant

When an account is created (`account_created` event), `checkAndGrantAdminByEmail()` checks if the player's email matches a seeded admin email:

1. Reads `window.__ADMIN_EMAILS__` (server-injected) or falls back to hardcoded email
2. If match and player isn't already admin → grants `SUPER_ADMIN`
3. Emits `admin_added` event

### Keyboard Shortcuts

| Shortcut | Action | Who Can Use |
|----------|--------|-------------|
| `Ctrl+Shift+A` | Open Admin Panel | Admins only |
| `Ctrl+Shift+B` | Open Bug Report | All users |
| `Ctrl+Shift+E` | Test Error System | Admins only |

### Admin Panel Shortcut

`openAdminPanel()` opens the admin panel UI if:
- The user is an admin
- `window.AdminPanel` is available
- `window.Panel.getPanel('admin-panel')` or `new AdminPanel()` works

### Test Data (Debug Mode Only)

In debug mode (`window.location.search.includes('debug=true')` or `window.ADMIN_DEBUG_MODE === true`):
- Test error entries logged through AdminSystem (bypassing ErrorSystem handlers)
- Test action logs added (login, building constructed, aid sent, alliance formed, war declared)

**Test actions no longer include `TRADE_COMPLETED`** — replaced with `AID_SENT` since trades were removed.

---

## How Admin Systems Wire Into the Game

```
Game Event Happens
    ↓
Event System broadcasts
    ↓
Admin System listener catches it
    ↓
logAction() records it to actionLog
    ↓
Event emitted: admin_action_logged
    ↓
Admin Panel (if open) displays in real-time
```

```
Error Occurs
    ↓
Error System catches it
    ↓
Admin System logError() records it
    ↓
If critical → flagForAdminAttention() → emit admin_attention_required
    ↓
Admin reviews in error log
```
