# Admin System Documentation

## Overview

The Admin System provides comprehensive monitoring, user management, error tracking, and game analytics for Dominion Wars. It includes both automated error detection and user-friendly bug reporting capabilities.

## Features

### 🔐 Admin Authentication & Permissions
- **Role-based access control** with three permission levels:
  - **Moderator**: Basic content moderation and user warnings
  - **Admin**: Full user management, error resolution, and system monitoring
  - **Super Admin**: Complete system access including admin user management

### 📊 Comprehensive Monitoring
- **Real-time Action Logging**: Every player action is logged with context
- **Error Tracking**: Automatic error detection and categorization
- **Performance Monitoring**: System health and performance metrics
- **User Analytics**: Player behavior and game statistics

### 🐛 Error & Bug Management
- **Automatic Error Detection**: JavaScript errors and system failures
- **User Bug Reports**: Easy-to-use bug reporting interface
- **Error Categorization**: Automatic severity classification (Critical/High/Medium/Low)
- **Admin Resolution Tracking**: Mark errors as resolved with admin notes

### 👥 User Management
- **Player Monitoring**: View all player accounts and activity
- **Warning System**: Issue warnings to users with escalation
- **Ban Management**: Temporary and permanent user bans
- **Account Analytics**: Registration dates, activity levels, warnings

### 🛡️ Content Moderation
- **Forum Post Moderation**: Hide, edit, or remove inappropriate content
- **Alliance Message Monitoring**: Track alliance communications
- **Player Name Validation**: Flag inappropriate usernames

## Installation & Setup

### 1. File Structure
```
core/
├── admin-system.js       # Core admin functionality
├── error-system.js       # Error handling and reporting
└── admin-init.js         # Initialization and setup

ui/components/
├── AdminPanel.js         # Main admin interface
└── BugReportModal.js     # User bug reporting modal

ui/styles/
└── admin.css            # Admin interface styling
```

### 2. Integration
The system is automatically initialized when the game loads. No manual setup required.

### 3. Default Admin Setup
The first player to load the game is automatically granted Super Admin privileges. Additional admins can be added through the admin panel.

## Usage

### For Administrators

#### Accessing Admin Panel
- **Method 1**: Click the Admin tab in the bottom menu (appears for admin users only)
- **Method 2**: Use keyboard shortcut `Ctrl+Shift+A`
- **Method 3**: Call `window.openAdminPanel()` in console

#### Admin Panel Tabs
1. **Dashboard**: System overview and health monitoring
2. **Player Management**: User accounts, warnings, and bans
3. **Error Monitoring**: System errors and resolution tracking
4. **Bug Reports**: User-submitted bug reports
5. **Action Logs**: Comprehensive activity logging
6. **Game Analytics**: Player statistics and game metrics
7. **Content Moderation**: Forum and message moderation
8. **Admin Settings**: System configuration and admin management

#### Managing Users
```javascript
// Add admin user
AdminSystem.addAdmin(playerId, AdminSystem.PERMISSIONS.ADMIN);

// Warn user
AdminSystem.warnUser(playerId, "Inappropriate behavior", "medium");

// Ban user (24 hours)
AdminSystem.banUser(playerId, "Spam in chat", 24);

// Ban user (permanent)
AdminSystem.banUser(playerId, "Serious violation", null);
```

### For Players

#### Reporting Bugs
- **Method 1**: Click the bug report button (🐛) in the top navigation
- **Method 2**: Use keyboard shortcut `Ctrl+Shift+B`
- **Method 3**: Call `window.reportBug()` in console

#### Bug Report Form Includes:
- Bug title and description
- Steps to reproduce
- Severity selection
- Category classification
- Automatic game state capture
- Optional screenshot attachments

## API Reference

### AdminSystem Class

#### Core Methods
```javascript
// Admin Management
AdminSystem.addAdmin(playerId, permission)
AdminSystem.removeAdmin(playerId)
AdminSystem.isAdmin(playerId)
AdminSystem.hasPermission(requiredPermission, playerId)

// User Management
AdminSystem.warnUser(playerId, reason, severity)
AdminSystem.banUser(playerId, reason, durationHours)
AdminSystem.isUserBanned(playerId)

// Content Moderation
AdminSystem.moderatePost(postId, action, reason)

// Logging & Analytics
AdminSystem.logAction(actionType, details)
AdminSystem.getGameAnalytics()
```

### ErrorSystem Class

#### Error Handling
```javascript
// Handle errors
ErrorSystem.handleError(error, context)

// Add custom error codes
ErrorSystem.addErrorCode(code, number, severity, description)

// Test error system
ErrorSystem.testError(errorCode)

// Get error statistics
ErrorSystem.getErrorStatistics()
```

### Global Functions
```javascript
// Report errors from anywhere in the code
window.reportError(error, context)

// Open bug report modal
window.reportBug()

// Open admin panel (admin only)
window.openAdminPanel()
```

## Error Codes & Categories

### System Errors (1000-1999)
- `GAME_INIT_FAILED` (1001): Game initialization failure
- `SAVE_FAILED` (1002): Game save operation failure
- `LOAD_FAILED` (1003): Game load operation failure
- `INVALID_GAME_STATE` (1004): Corrupted game state detected

### User Action Errors (2000-2999)
- `INVALID_INPUT` (2001): User provided invalid input
- `INSUFFICIENT_RESOURCES` (2002): Not enough resources for action
- `PERMISSION_DENIED` (2005): User lacks required permissions

### Network Errors (3000-3999)
- `CONNECTION_LOST` (3001): Network connection lost
- `TIMEOUT` (3002): Operation timed out
- `SERVER_ERROR` (3003): Server-side error occurred

### Building/Construction Errors (4000-4999)
- `INVALID_BUILDING_LOCATION` (4001): Invalid building placement
- `BUILDING_LIMIT_REACHED` (4002): Building type limit exceeded

## Event System Integration

The admin system integrates with the game's event system to monitor all activities:

### Monitored Events
- Player actions (login, building construction, trades, wars)
- System errors and failures
- Game state changes
- User interactions
- Performance metrics

### Custom Events
```javascript
// Listen for admin events
EventBus.on('admin_error_logged', (errorData) => {
    // Handle new error
});

EventBus.on('bug_report_submitted', (bugReport) => {
    // Handle new bug report
});

EventBus.on('user_warned', (warning) => {
    // Handle user warning
});
```

## Data Persistence

### Storage
- Admin data is stored in localStorage under `dominion_wars_admin_data`
- Automatic saving every minute
- Manual save/export capabilities

### Data Retention
- Action logs: Last 1000 entries
- Error logs: Last 500 entries  
- Bug reports: Last 100 reports
- All data can be exported to JSON

## Security Considerations

### Access Control
- Admin privileges are checked on every operation
- No sensitive data is exposed to non-admin users
- All admin actions are logged for audit trails

### Data Protection
- No passwords or sensitive user data is stored
- Player data is anonymized in error reports
- IP addresses are not tracked (client-side only)

## Keyboard Shortcuts

| Shortcut | Action | Access Level |
|----------|--------|--------------|
| `Ctrl+Shift+A` | Open Admin Panel | Admins Only |
| `Ctrl+Shift+B` | Report Bug | All Users |
| `Ctrl+Shift+E` | Test Error System | Admins Only |

## Troubleshooting

### Common Issues

1. **Admin tab not appearing**
   - Check if user has admin privileges: `AdminSystem.isAdmin()`
   - Verify AdminSystem is initialized: `AdminSystem.isInitialized`

2. **Bug report modal not opening**
   - Check if BugReportModal is loaded: `typeof BugReportModal`
   - Verify Modal system is available: `typeof Modal`

3. **Errors not being logged**
   - Check ErrorSystem initialization: `ErrorSystem.isInitialized`
   - Verify error format and context

### Console Debugging
```javascript
// Check admin status
console.log('Is Admin:', AdminSystem.isAdmin());
console.log('Admin Permission:', AdminSystem.getAdminPermission());

// View logs
console.log('Action Logs:', AdminSystem.actionLog);
console.log('Error Logs:', AdminSystem.errorLog);
console.log('Bug Reports:', AdminSystem.bugReports);

// Test systems
AdminSystem.logAction('TEST_ACTION', { test: true });
window.reportError('TEST_ERROR', { test: true });
```

## Future Enhancements

### Planned Features
- Real-time notifications for admins
- Advanced analytics and reporting
- Automated moderation filters
- Integration with external logging services
- Mobile-responsive admin interface
- Bulk user management operations

### Extensibility
The system is designed to be modular and extensible. New features can be added by:
- Extending the AdminSystem class
- Adding new error codes and handlers
- Creating additional UI components
- Implementing custom event listeners

## Support

For technical support or feature requests related to the admin system, please:
1. Submit a bug report using the in-game system
2. Check the browser console for error messages
3. Export admin logs for diagnostic purposes
4. Contact the development team with detailed information

---

*This documentation is for Dominion Wars Admin System v1.0*