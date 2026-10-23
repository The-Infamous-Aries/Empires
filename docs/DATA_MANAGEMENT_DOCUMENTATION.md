# Empire Wars - Data Management System Documentation

## Overview

The Empire Wars Data Management System is a comprehensive, modular solution designed to handle all aspects of game data storage, synchronization, backup, and API access. It provides clean separation of concerns, real-time data handling, and robust backup mechanisms to ensure zero data loss.

## Architecture

### Core Components

1. **DatabaseManager** (`core/database-manager.js`)
   - Central coordinator for all database operations
   - Manages multiple specialized databases
   - Handles data validation and integrity
   - Provides GraphQL-like query interface

2. **ApiSystem** (`core/api-system.js`)
   - RESTful and GraphQL-like API endpoints
   - API key authentication and authorization
   - Rate limiting and query caching
   - Audit logging for all API requests

3. **BackupSystem** (`core/backup-system.js`)
   - Automated full and incremental backups
   - Multiple storage locations (localStorage, IndexedDB)
   - Data integrity verification with checksums
   - Import/export functionality

4. **SyncManager** (`core/sync-manager.js`)
   - Real-time data synchronization
   - Conflict detection and resolution
   - Change tracking and queuing
   - Multi-source data merging

5. **DataIntegration** (`core/data-integration.js`)
   - Connects all systems together
   - Event-driven data updates
   - Game event handlers
   - System status monitoring

### Database Structure

The system uses separate databases for different data types:

- **Players Database**: User accounts, progression, preferences
- **Nations Database**: Nation data, statistics, resources
- **Alliances Database**: Alliance information and memberships
- **Wars Database**: War declarations, battles, outcomes
- **Trade Database**: Trade agreements and transactions
- **Diplomacy Database**: Treaties, relations, negotiations
- **Forum Database**: News posts, comments, reactions
- **Messaging Database**: Private and alliance messages
- **World Database**: Global game state and settings
- **Economy Database**: Economic data and trends
- **Military Database**: Military units and deployments
- **Research Database**: Technology trees and progress
- **Analytics Database**: Usage metrics and statistics

## API System

### Authentication

API access requires authentication via API keys. Each key has specific permissions:

```javascript
// Create API key
const apiKey = DataIntegration.createApiKey('playerName', ['game_data', 'analytics'], 'Bot access');

// API key format: ew_[32-character-string]
```

### Permission Levels

- **public**: Basic read access to public data
- **game_data**: Access to game statistics and public nation data
- **player_data**: Access to player-specific information
- **private_messages**: Access to messaging systems
- **military_data**: Access to military information
- **analytics**: Access to usage and game analytics
- **write**: Ability to modify data (mutations)
- **admin**: Full access to all data and operations

### Query Syntax

The API supports GraphQL-like queries:

```javascript
// Example query
const query = `{
  nations { 
    name, population, gdp, government 
    where: { isActive: true, population: { $gt: 10000 } }
  }
}`;

const result = await DataIntegration.processApiRequest({
  operation: 'query',
  query: query
});
```

### Rate Limiting

API requests are rate-limited based on authentication level:
- **Default (unauthenticated)**: 100 requests per minute
- **Authenticated**: 1,000 requests per minute  
- **Admin**: 10,000 requests per minute

## Backup System

### Backup Types

1. **Full Backups**: Complete snapshots of all data
   - Scheduled every 10 minutes
   - Manual backups on game save
   - Stored with compression and checksums

2. **Incremental Backups**: Only changed data
   - Created on sync operations
   - Faster and more storage-efficient
   - Chain together to recreate full state

3. **Quick Saves**: Lightweight frequent saves
   - Every 1 minute for critical data
   - Rotating set of 5 quick saves
   - Immediate recovery for recent changes

### Storage Locations

- **Primary**: localStorage (up to 100KB per backup)
- **Secondary**: IndexedDB (for larger backups)
- **Export**: Downloadable JSON files
- **Import**: Restore from uploaded files

### Data Integrity

- **Checksums**: SHA-like checksums for corruption detection
- **Verification**: Automatic integrity checks on restore
- **Redundancy**: Multiple storage locations
- **Versioning**: Backup version tracking and compatibility

## Real-time Synchronization

### Change Tracking

The system automatically tracks all data changes:

```javascript
// Automatic change detection
localStorage.setItem = (key, value) => {
  const oldValue = localStorage.getItem(key);
  originalSetItem.call(localStorage, key, value);
  
  if (key.startsWith('empire_db_') && oldValue !== value) {
    SyncManager.trackChange(key, value, oldValue);
  }
};
```

### Conflict Resolution

When conflicts occur, the system uses multiple strategies:

1. **Timestamp Resolution**: Newest change wins
2. **Version Control**: Check version sequences
3. **Field Merging**: Automatic merge when possible
4. **Manual Resolution**: Flag complex conflicts for review

### Sync Queue

Changes are queued and processed with priorities:
- **High**: Critical game state changes
- **Normal**: Regular gameplay updates  
- **Low**: Analytics and non-critical data

## Data Validation

### Schema Validation

Each database has a defined schema with validation rules:

```javascript
const schema = {
  name: { type: 'string', required: true, indexed: true },
  population: { type: 'number', default: 0, validate: (v) => v >= 0 },
  isActive: { type: 'boolean', default: true, indexed: true }
};
```

### Runtime Validation

All data changes are validated before being applied:
- Type checking
- Required field validation  
- Custom validation functions
- Cross-reference validation

## Usage Examples

### Basic Setup

```javascript
// Initialize the data management system (automatic)
// The system initializes automatically when loaded

// Check system status
const status = DataIntegration.getSystemStatus();
console.log('System Status:', status);
```

### Creating an API Key

```javascript
// Create API key for a bot
const apiKey = DataIntegration.createApiKey(
  'MyBot', 
  ['game_data', 'analytics'], 
  'Discord bot for alliance stats'
);

console.log('API Key:', apiKey);
// Output: ew_abc123def456ghi789jkl012mno345pq
```

### Querying Data

```javascript
// Query nation data
const query = `{
  nations { 
    name, population, gdp, alliance 
    where: { 
      isActive: true, 
      population: { $gte: 50000 }
    }
  }
}`;

const result = await DataIntegration.processApiRequest({
  operation: 'query',
  query: query,
  headers: { 'x-api-key': apiKey }
});

if (result.success) {
  console.log('Top Nations:', result.data.nations);
}
```

### Manual Backup

```javascript
// Create manual backup
const backupId = await DataIntegration.backupSystem.createFullBackup('manual');
console.log('Backup created:', backupId);

// Export backup to file
await DataIntegration.backupSystem.exportBackup(backupId);
```

### Event Handling

```javascript
// Listen for data changes
EventBus.on('dataSystemInitialized', (data) => {
  console.log('Data system ready:', data);
});

// Handle nation updates
EventBus.on(GameEvents.NATION_CREATED, (eventData) => {
  // Data is automatically synchronized to databases
  console.log('New nation created:', eventData.nation.name);
});
```

## Integration with Existing Code

### Updating the Original Data Manager

The new system integrates with the existing `DataManager` class by:

1. Extending functionality rather than replacing
2. Maintaining backward compatibility
3. Adding real-time sync capabilities
4. Providing enhanced backup features

### Game Engine Integration

```javascript
// In game-engine.js
class GameEngine {
  constructor() {
    // ... existing code ...
    
    // Initialize enhanced data management
    this.dataIntegration = window.DataIntegration;
    
    // Set up game event handlers
    this.setupDataIntegration();
  }
  
  setupDataIntegration() {
    // Emit events for data changes
    this.on('nationUpdated', (nation) => {
      EventBus.emit(GameEvents.NATION_UPDATED, { nation });
    });
    
    this.on('resourcesChanged', (nationId, resources, previous) => {
      EventBus.emit(GameEvents.RESOURCES_CHANGED, { 
        nationId, resources, previousResources: previous 
      });
    });
  }
}
```

## Performance Optimization

### Indexing Strategy

- **Primary Keys**: All records have unique IDs
- **Foreign Keys**: Indexed for fast joins
- **Query Fields**: Common filter fields are indexed
- **Composite Indexes**: Multiple field combinations

### Caching

- **Query Cache**: 5-minute TTL for repeated queries
- **Result Cache**: LRU cache for expensive operations
- **Memory Management**: Automatic cleanup of old data

### Batch Operations

- **Bulk Inserts**: Process multiple records together
- **Transaction Batching**: Group related changes
- **Lazy Loading**: Load data as needed
- **Pagination**: Limit result set sizes

## Monitoring and Analytics

### Performance Metrics

The system tracks comprehensive performance metrics:

```javascript
const metrics = DataIntegration.getSystemStatus().performance;
// {
//   queries: { count: 1234, totalTime: 5678, errors: 2 },
//   syncs: { count: 567, totalTime: 890, errors: 0 },
//   backups: { count: 89, totalTime: 1234, errors: 0 }
// }
```

### Audit Logging

All API requests and data changes are logged:
- Request timestamp and source
- Query/mutation details  
- Success/failure status
- Performance timing
- Error details

### Health Monitoring

Regular health checks ensure system reliability:
- Database connectivity
- Storage capacity
- Backup integrity
- Sync queue status
- Performance degradation

## Security Considerations

### Data Protection

- **API Keys**: Secure token-based authentication
- **Permissions**: Granular access control
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes all incoming data

### Storage Security

- **Checksums**: Detect data corruption
- **Versioning**: Track all changes
- **Backup Encryption**: Optional encryption for sensitive data
- **Access Logs**: Full audit trail

## Troubleshooting

### Common Issues

1. **Sync Conflicts**: Check conflict resolution logs
2. **Backup Failures**: Verify storage capacity and permissions
3. **API Errors**: Check authentication and rate limits
4. **Performance Issues**: Review query complexity and indexing

### Debug Tools

```javascript
// Enable debug logging
GameConfig.DEBUG.ENABLED = true;
GameConfig.DEBUG.LOG_LEVEL = 'debug';

// Check system health
const status = DataIntegration.getSystemStatus();
console.log('System Health:', status);

// View recent API calls
const apiLogs = DataIntegration.apiSystem.auditLogger.getRecentLogs();
console.log('Recent API Calls:', apiLogs);

// Check sync queue
const syncStatus = DataIntegration.syncManager.getSyncStatus();
console.log('Sync Queue:', syncStatus);
```

## Future Enhancements

### Planned Features

1. **WebSocket Support**: Real-time push notifications
2. **Advanced Analytics**: Machine learning insights
3. **Multi-Server Sync**: Cross-server data sharing
4. **Advanced Queries**: Full GraphQL implementation
5. **Data Warehousing**: Historical data analysis
6. **Automated Testing**: Comprehensive test suite

### Extensibility

The system is designed to be easily extensible:
- **Plugin Architecture**: Add new databases and features
- **Event System**: Hook into any data operation
- **Custom Validators**: Add domain-specific validation
- **API Extensions**: Create custom endpoints

This documentation provides a comprehensive overview of the Empire Wars Data Management System. For specific implementation details, refer to the individual source files and code comments.