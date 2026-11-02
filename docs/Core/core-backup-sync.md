# Backup & Sync Systems — `core/backup-system.js` & `core/sync-manager.js`

**Purpose:** Automatic backups for disaster recovery, and data synchronization with conflict resolution.

---

## File Overview

| File | Responsibility |
|------|---------------|
| `backup-system.js` | Automatic full + incremental backups of all game data |
| `sync-manager.js` | Data sync queue, conflict resolution, change tracking |

---

## 1. Backup System — `core/backup-system.js`

**Purpose:** Makes automatic full and incremental backups of all game data so you can recover if something goes wrong. Protects aid data too.

### Backup Types

| Type | Description | Frequency |
|------|-------------|-----------|
| **Full backup** | Complete snapshot of all domain data | Initial backup, manual save, on demand |
| **Incremental backup** | Only changed data since last backup | On sync `dataUpdated` events |
| **Quick save** | Rotating quick saves (5 slots) | Every minute (timer) |

### Storage

- **Primary:** `localStorage` (browser only) — keys prefixed with `empire_backup_*`
- **Secondary:** `IndexedDB` for backups > 100KB
- **Registry:** `empire_backup_registry` tracks all backup metadata

### Backup Schedule

| Backup | Timer |
|--------|-------|
| Auto backup | Every 10 minutes (600,000ms) |
| Quick save | Every 1 minute (60,000ms) |
| Initial backup | On system initialization |

### Browser-Safe

All `localStorage` and `indexedDB` access is guarded with `typeof window !== 'undefined'` checks. If storage is unavailable (Node.js/server context), operations are no-ops.

### Key Methods

| Method | Description |
|--------|-------------|
| `createFullBackup(label)` | Create a full backup of all data |
| `createIncrementalBackup(data, source)` | Create an incremental backup from sync data |
| `getBackupList()` | Get list of all available backups |
| `restoreBackup(backupId)` | Restore a specific backup |
| `restoreFullBackup(data)` | Restore full backup data to localStorage |
| `deleteBackup(backupId)` | Delete a backup |
| `getQuickSaveData(dbName)` | Get quick save data for a domain |
| `getAidStats()` | Global aid statistics (from backup data) |
| `destroy()` | Stop timers, clear backups |

---

## 2. Sync Manager — `core/sync-manager.js`

**Purpose:** Keeps data consistent by queuing changes and resolving conflicts. Used for multi-client scenarios.

### What It Does

| Feature | Description |
|---------|-------------|
| **Sync queue** | Queue data changes with priority (high/normal/low) |
| **Conflict detection** | Detect timestamp and version conflicts |
| **Conflict resolution** | Timestamp-based, version-based, merge, or manual |
| **Change tracking** | Track localStorage changes for sync |
| **Retry logic** | Failed sync items retry up to 3 times |
| **Status reporting** | Queue length, processing status, by priority/status |

### Sync Flow

```
Change detected (database update or localStorage change)
    ↓
queueSync(data, source, priority)
    ↓
Sync loop processes queue every 5 seconds
    ↓
1. Validate data structure
    ↓
2. Detect conflicts with current state
    ↓
3. Resolve conflicts (timestamp/version/merge/manual)
    ↓
4. Apply to database via saveEntity()
    ↓
5. Notify listeners (dataUpdated → triggers backup)
    ↓
6. If failed: retry up to 3 times, then notify failure
```

### Conflict Resolution Strategies

| Strategy | When Used | How It Works |
|----------|-----------|--------------|
| `timestamp` | `stale_update` conflicts | Newest timestamp wins |
| `version` | `version_conflict` conflicts | Valid version sequence (current + 1) wins |
| `merge` | `concurrent_modify` conflicts | Field-level merge, take newer values |
| `manual` | Unknown/unresolvable | Flag for manual admin intervention |

### Valid Database Names for Sync

`players`, `nations`, `alliances`, `wars`, `diplomacy`, `forum`, `messaging`, `world`, `economy`, `military`, `research`, `analytics`, `aid`

**Removed:** `trade` (no longer exists)

### Key Methods

| Method | Description |
|--------|-------------|
| `queueSync(data, source, priority)` | Queue data for synchronization |
| `processSyncQueue()` | Process all queued sync items |
| `forceSync()` | Force process queue immediately |
| `subscribe(event, callback)` | Subscribe to sync events |
| `getSyncStatus()` | Get queue status (length, priority, status breakdown) |
| `clearQueue()` | Clear all pending sync items |
| `destroy()` | Stop sync loop, clear queue and listeners |

### Browser-Safe

`localStorage` access guarded with `_hasStorage()` / `_getItem()` / `_setItem()` wrappers.

### Events Emitted

| Event | When Fired |
|-------|-----------|
| `syncCompleted` | Sync item completed successfully |
| `syncFailed` | Sync item failed after max retries |
| `dataUpdated` | Data successfully applied (triggers backup) |
| `changeTracked` | LocalStorage change detected |

---

## How Backup & Sync Work Together

```
Database change (saveEntity)
    ↓
Sync Manager queueSync()
    ↓
Process sync → apply to database
    ↓
Notify listeners: dataUpdated
    ↓
Backup System createIncrementalBackup()
    ↓
Backup saved to localStorage/IndexedDB
```

```
Game save (manual)
    ↓
Backup System createFullBackup()
    ↓
Full snapshot saved
```

```
Crash or shutdown
    ↓
Data Integration destroy() → saveAll()
    ↓
Backup System stop()
    ↓
Sync Manager destroy()
    ↓
All data persisted to disk
```
