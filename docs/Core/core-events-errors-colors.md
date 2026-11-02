# Event, Error & Color Systems — `core/event-system.js`, `core/error-system.js`, `core/colors.js`

Three foundational systems that every other core module depends on.

---

## 1. Event System — `core/event-system.js`

**Purpose:** The game's "nerve center." A cross-system event bus that lets different parts of the game talk to each other without being tightly coupled.

### What It Does

- **Broadcast events** — any system can emit an event (e.g. `nation_created`, `aid_sent`, `war_declared`)
- **Subscribe to events** — any system can listen for events and react
- **Decoupled communication** — the sender doesn't need to know who's listening

### How It's Used

When a nation sends aid:
1. `aid-system.js` emits `aid_sent` event
2. `data-persistence.js` hears it and calls `saveAid()` to write to disk
3. `backup-system.js` hears `dataUpdated` and creates an incremental backup
4. `admin-system.js` hears `admin_action_logged` for monitoring

### Key Concept

Events are the glue that makes write-through autosave work. Every entity change emits an event → persistence listeners save it immediately → nothing is lost on crash.

---

## 2. Error System — `core/error-system.js`

**Purpose:** Catch crashes, show user-friendly error messages, retry failed saves, and alert admins when things break.

### What It Does

| Feature | Description |
|---------|-------------|
| **Crash catching** | Wraps `console.error` to capture all logged errors |
| **Unhandled rejection handling** | Catches promise rejections that would otherwise crash the game |
| **JavaScript error capture** | Listens to `window.onerror` for runtime errors |
| **User-friendly messages** | Maps technical errors to friendly messages players can understand |
| **Retry logic** | Failed saves can be retried automatically |
| **Admin alerts** | Critical errors are flagged for admin attention |
| **Emergency save** | Attempts to save game state when a critical error occurs |

### Error Severity Levels

| Level | Trigger | Action |
|-------|---------|--------|
| `low` | Minor issues | Log only |
| `medium` | Network/fetch/connection issues | Log + retry |
| `high` | Cannot read property / undefined / null | Log + flag for admin |
| `critical` | Syntax/reference/type errors | Log + emergency save + flag for admin |

### Browser-Safe

All `window` and `localStorage` access is guarded with `typeof window !== 'undefined'` checks, so the file works in Node.js/server contexts too.

---

## 3. Colors System — `core/colors.js`

**Purpose:** Defines the 10 faction colors used on the map and UI.

### The 10 Colors

| Key | Hex | Description |
|-----|-----|-------------|
| `aqua` | `#00FFFF` | Light cyan |
| `black` | `#000000` | Black |
| `blue` | `#0000FF` | Blue |
| `green` | `#008000` | Green |
| `lime` | `#00FF00` | Bright lime green |
| `orange` | `#FFA500` | Orange |
| `pink` | `#FFC0CB` | Pink |
| `purple` | `#800080` | Purple |
| `red` | `#FF0000` | Red |
| `yellow` | `#FFFF00` | Yellow |

### How Colors Are Used

- **Map rendering** — each nation's territory is colored with its faction color
- **UI elements** — nation names, bars, and indicators use faction colors
- **AI nation assignment** — colors are assigned round-robin when AI nations are created (`colorForIndex(index)`)
- **Player faction** — players pick a faction color on nation creation

### Helper Functions

| Function | Description |
|----------|-------------|
| `colorForIndex(index)` | Get color definition by index (0-9), round-robin |
| `colorHex(key)` | Get hex string for a color key |
| `colorImage(key)` | Get image path for a color key |

### Browser-Safe

Uses `try/catch` around `require('fs')` so it doesn't crash in browser contexts where Node's `fs` module doesn't exist.

---

## How These Three Work Together

```
┌─────────────────────────────────────────────────────────┐
│                    Game Event Happens                   │
│              (e.g. nation sends aid to another)         │
└─────────────────────────────────────────────────────────┘
                           ↓
                    Event System
              (broadcasts 'aid_sent' event)
                           ↓
      ┌──────────────────┼──────────────────┐
      ↓                  ↓                  ↓
   Data Persistence   Backup System    Admin System
   (saves aid to DB)  (makes backup)   (logs the action)
                           ↓
                  If something goes wrong...
                           ↓
                    Error System
              (catches crash, shows friendly msg,
               retries save, alerts admins)
                           ↓
                    Colors System
              (renders nations with faction colors on map/UI)
```
