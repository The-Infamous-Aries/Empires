/**
 * Admin Initialization - Setup default admin users and test functionality
 */

function initializeAdminSystem() {
    console.log('Initializing admin system...');
    
    // Wait for systems to be available
    if (!window.AdminSystem || !window.ErrorSystem) {
        setTimeout(initializeAdminSystem, 1000);
        return;
    }
    
    // Add current player as super admin if no admins exist
    if (window.Player && window.Player.playerId) {
        const existingAdmins = Array.from(window.AdminSystem.admins);
        
        if (existingAdmins.length === 0) {
            console.log('No admins found, adding current player as super admin');
            window.AdminSystem.addAdmin(
                window.Player.playerId, 
                window.AdminSystem.PERMISSIONS.SUPER_ADMIN
            );
            
            // Log the admin creation
            console.log(`Player ${window.Player.username} (${window.Player.playerId}) granted super admin privileges`);
        }
    }
    
    // Add test data for demo purposes
    addTestData();
    
    // Setup event listeners for admin features
    setupAdminEventListeners();
    
    console.log('Admin system initialization complete');
}

function addTestData() {
    if (!window.AdminSystem) return;
    
    // Only run in explicit debug/dev mode — never inject fake errors into the
    // live ErrorSystem during a normal session, as they trigger real handlers
    // (emergency saves, retries, admin flags, etc.).
    const isDebugMode = (
        window.location.search.includes('debug=true') ||
        window.location.hostname === 'localhost' && window.ADMIN_DEBUG_MODE === true
    );
    
    if (!isDebugMode) {
        console.log('Test admin data skipped (not in debug mode). ' +
                    'Set window.ADMIN_DEBUG_MODE = true and reload to enable.');
        return;
    }
    
    // In debug mode: log test entries through AdminSystem only — do NOT pass
    // through ErrorSystem.handleError, which would trigger real save retries,
    // emergency saves, and high-severity handlers for fake data.
    const testErrors = [
        {
            code: 'SAVE_FAILED',
            message: 'Failed to save game data to localStorage',
            severity: 'high',
            context: { operation: 'auto_save', timestamp: Date.now(), test: true }
        },
        {
            code: 'CONNECTION_LOST',
            message: 'Network connection interrupted',
            severity: 'medium',
            context: { retry_count: 2, test: true }
        },
        {
            code: 'INVALID_INPUT',
            message: 'User entered invalid building coordinates',
            severity: 'low',
            context: { input: 'invalid_coords', user_action: 'build_placement', test: true }
        }
    ];
    
    // Log directly through AdminSystem, bypassing ErrorSystem handlers
    testErrors.forEach(errorData => {
        window.AdminSystem.logError(
            { message: errorData.message, code: errorData.code },
            { ...errorData.context, _isTestData: true }
        );
    });
    
    // Add some test action logs
    const testActions = [
        'PLAYER_LOGIN',
        'BUILDING_CONSTRUCTED', 
        'TRADE_COMPLETED',
        'ALLIANCE_FORMED',
        'WAR_DECLARED'
    ];
    
    testActions.forEach(action => {
        window.AdminSystem.logAction(action, {
            test: true,
            timestamp: Date.now() - Math.random() * 86400000 // Random time in last 24h
        });
    });
    
    console.log('Test admin data added (debug mode)');
}

function setupAdminEventListeners() {
    // Listen for errors from the game
    EventBus.on('error', (data) => {
        if (window.AdminSystem) {
            window.AdminSystem.logError(data.error || data, data.context || {});
        }
    });
    
    // Add error reporting to window for global access
    window.reportError = function(error, context = {}) {
        if (window.ErrorSystem) {
            return window.ErrorSystem.handleError(error, context);
        } else {
            console.error('Error System not available:', error);
        }
    };
    
    // Add bug reporting shortcut
    window.reportBug = function() {
        if (window.BugReportModal) {
            window.BugReportModal.open();
        } else {
            console.error('Bug Report Modal not available');
        }
    };
    
    // Add admin panel shortcut for admins
    window.openAdminPanel = function() {
        if (window.AdminSystem && window.AdminSystem.isAdmin()) {
            if (window.AdminPanel) {
                let adminPanel = Panel.getPanel('admin-panel');
                if (!adminPanel) {
                    adminPanel = new AdminPanel();
                    if (adminPanel.initialize()) {
                        adminPanel.show();
                    }
                } else {
                    adminPanel.show();
                }
            } else {
                console.error('Admin Panel not available');
            }
        } else {
            console.error('Admin access required');
        }
    };
    
    // Add keyboard shortcuts for admin functions
    document.addEventListener('keydown', (event) => {
        // Ctrl+Shift+A = Open Admin Panel (for admins only)
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyA') {
            if (window.AdminSystem && window.AdminSystem.isAdmin()) {
                event.preventDefault();
                window.openAdminPanel();
            }
        }
        
        // Ctrl+Shift+B = Open Bug Report (for all users)
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyB') {
            event.preventDefault();
            window.reportBug();
        }
        
        // Ctrl+Shift+E = Test Error (for admins only)
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyE') {
            if (window.AdminSystem && window.AdminSystem.isAdmin()) {
                event.preventDefault();
                window.reportError('TEST_ERROR', { source: 'keyboard_shortcut', test: true });
            }
        }
    });
    
    console.log('Admin event listeners setup complete');
    console.log('Keyboard shortcuts:');
    console.log('  Ctrl+Shift+A - Open Admin Panel (admins only)');
    console.log('  Ctrl+Shift+B - Report Bug (all users)'); 
    console.log('  Ctrl+Shift+E - Test Error System (admins only)');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminSystem);
} else {
    // DOM already loaded
    setTimeout(initializeAdminSystem, 500);
}

// Also initialize when game systems are ready
EventBus.on('game_started', () => {
    setTimeout(initializeAdminSystem, 1000);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeAdminSystem, addTestData, setupAdminEventListeners };
}