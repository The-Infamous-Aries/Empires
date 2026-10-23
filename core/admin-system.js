/**
 * Admin System - Comprehensive administration and monitoring system
 * Handles user management, error tracking, action logging, and game monitoring
 */

class AdminSystem {
    constructor() {
        this.admins = new Set();
        this.actionLog = [];
        this.errorLog = [];
        this.bugReports = [];
        this.playerSessions = new Map(); // playerId -> session info
        this.bannedUsers = new Set();
        this.warnings = new Map(); // playerId -> warning count
        this.moderatedPosts = [];
        this.isInitialized = false;
        this.maxLogEntries = 10000;
        this.maxErrorEntries = 5000;
        this.maxBugReports = 1000;
        
        // Admin permissions levels
        this.PERMISSIONS = {
            SUPER_ADMIN: 'super_admin',
            ADMIN: 'admin',
            MODERATOR: 'moderator'
        };
        
        // Auto-save intervals
        this.autoSaveInterval = null;
        this.logSaveInterval = 60000; // Save logs every minute
    }

    /**
     * Initialize the admin system
     */
    initialize() {
        if (this.isInitialized) return;
        
        console.log('Initializing Admin System...');
        
        // Load saved data
        this.loadAdminData();
        
        // Bind to game events for monitoring
        this.bindEventListeners();
        
        // Setup auto-save
        this.setupAutoSave();
        
        // Initialize error tracking
        this.initializeErrorTracking();
        
        this.isInitialized = true;
        console.log('Admin System initialized');
        
        EventBus.emit('admin_system_initialized');
    }

    /**
     * Add an admin user
     */
    addAdmin(playerId, permission = this.PERMISSIONS.MODERATOR) {
        if (!this.isValidPermission(permission)) {
            throw new Error('Invalid admin permission level');
        }
        
        this.admins.add({
            playerId,
            permission,
            addedDate: Date.now(),
            addedBy: this.getCurrentAdmin()?.playerId || 'system'
        });
        
        this.logAction('ADMIN_ADDED', { 
            targetPlayerId: playerId, 
            permission,
            adminId: this.getCurrentAdmin()?.playerId 
        });
        
        this.saveAdminData();
        EventBus.emit('admin_added', { playerId, permission });
    }

    /**
     * Remove an admin user
     */
    removeAdmin(playerId) {
        const adminToRemove = Array.from(this.admins).find(a => a.playerId === playerId);
        if (!adminToRemove) return false;
        
        this.admins.delete(adminToRemove);
        this.logAction('ADMIN_REMOVED', { 
            targetPlayerId: playerId,
            adminId: this.getCurrentAdmin()?.playerId 
        });
        
        this.saveAdminData();
        EventBus.emit('admin_removed', { playerId });
        return true;
    }

    /**
     * Check if a player is an admin
     */
    isAdmin(playerId = null) {
        const checkId = playerId || (window.Player?.playerId);
        if (!checkId) return false;
        
        return Array.from(this.admins).some(admin => admin.playerId === checkId);
    }

    /**
     * Get admin permission level
     */
    getAdminPermission(playerId = null) {
        const checkId = playerId || (window.Player?.playerId);
        if (!checkId) return null;
        
        const admin = Array.from(this.admins).find(a => a.playerId === checkId);
        return admin?.permission || null;
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(requiredPermission, playerId = null) {
        const permission = this.getAdminPermission(playerId);
        if (!permission) return false;
        
        const levels = {
            [this.PERMISSIONS.MODERATOR]: 1,
            [this.PERMISSIONS.ADMIN]: 2,
            [this.PERMISSIONS.SUPER_ADMIN]: 3
        };
        
        return levels[permission] >= levels[requiredPermission];
    }

    /**
     * Log an action for admin monitoring
     */
    logAction(actionType, details = {}) {
        const logEntry = {
            id: this.generateId(),
            timestamp: Date.now(),
            actionType,
            playerId: details.playerId || (window.Player?.playerId),
            playerName: details.playerName || (window.Player?.username),
            details: { ...details },
            sessionId: this.getSessionId(),
            ipAddress: this.getClientIP() // Would need server implementation
        };
        
        this.actionLog.push(logEntry);
        
        // Trim log if too large
        if (this.actionLog.length > this.maxLogEntries) {
            this.actionLog.splice(0, this.actionLog.length - this.maxLogEntries);
        }
        
        // Emit for real-time monitoring
        EventBus.emit('admin_action_logged', logEntry);
        
        console.log(`[ADMIN LOG] ${actionType}:`, details);
    }

    /**
     * Log an error for admin monitoring
     */
    logError(error, context = {}) {
        const errorEntry = {
            id: this.generateId(),
            timestamp: Date.now(),
            error: {
                message: error.message || error,
                stack: error.stack || null,
                name: error.name || 'UnknownError'
            },
            context: {
                playerId: window.Player?.playerId,
                playerName: window.Player?.username,
                url: window.location.href,
                userAgent: navigator.userAgent,
                gameState: this.getGameStateSnapshot(),
                ...context
            },
            severity: this.categorizeError(error),
            resolved: false,
            adminNotes: ''
        };
        
        this.errorLog.push(errorEntry);
        
        // Trim error log if too large
        if (this.errorLog.length > this.maxErrorEntries) {
            this.errorLog.splice(0, this.errorLog.length - this.maxErrorEntries);
        }
        
        // Emit for real-time monitoring
        EventBus.emit('admin_error_logged', errorEntry);
        
        // Use the original (pre-override) console.error to avoid re-entering logError
        const logFn = this._originalConsoleError || console.error;
        logFn.call(console, `[ADMIN ERROR] ${error.message || error}:`, context);
        
        // Auto-flag critical errors
        if (errorEntry.severity === 'critical') {
            this.flagForAdminAttention(errorEntry);
        }
    }

    /**
     * Submit a bug report
     */
    submitBugReport(report) {
        const bugReport = {
            id: this.generateId(),
            timestamp: Date.now(),
            playerId: window.Player?.playerId,
            playerName: window.Player?.username,
            title: report.title,
            description: report.description,
            steps: report.steps || [],
            severity: report.severity || 'medium',
            category: report.category || 'general',
            attachments: report.attachments || [],
            gameState: this.getGameStateSnapshot(),
            browserInfo: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            },
            status: 'open',
            assignedTo: null,
            adminNotes: '',
            reproduced: false
        };
        
        this.bugReports.push(bugReport);
        
        // Trim bug reports if too many
        if (this.bugReports.length > this.maxBugReports) {
            this.bugReports.splice(0, this.bugReports.length - this.maxBugReports);
        }
        
        this.logAction('BUG_REPORT_SUBMITTED', {
            reportId: bugReport.id,
            title: report.title,
            severity: report.severity
        });
        
        EventBus.emit('bug_report_submitted', bugReport);
        
        console.log('Bug report submitted:', bugReport.id);
        return bugReport.id;
    }

    /**
     * Update bug report status
     */
    updateBugReport(reportId, updates) {
        const report = this.bugReports.find(r => r.id === reportId);
        if (!report) return false;
        
        const oldStatus = report.status;
        Object.assign(report, updates);
        
        this.logAction('BUG_REPORT_UPDATED', {
            reportId,
            oldStatus,
            newStatus: report.status,
            adminId: this.getCurrentAdmin()?.playerId
        });
        
        EventBus.emit('bug_report_updated', { reportId, updates });
        return true;
    }

    /**
     * Warn a user
     */
    warnUser(playerId, reason, severity = 'low') {
        const currentWarnings = this.warnings.get(playerId) || 0;
        const newWarningCount = currentWarnings + 1;
        
        this.warnings.set(playerId, newWarningCount);
        
        const warning = {
            id: this.generateId(),
            timestamp: Date.now(),
            playerId,
            reason,
            severity,
            warningNumber: newWarningCount,
            adminId: this.getCurrentAdmin()?.playerId,
            acknowledged: false
        };
        
        this.logAction('USER_WARNED', warning);
        
        // Auto-escalate if too many warnings
        if (newWarningCount >= 5 && severity !== 'low') {
            this.banUser(playerId, `Automatic ban after ${newWarningCount} warnings`, 24); // 24 hour ban
        }
        
        EventBus.emit('user_warned', warning);
        return warning;
    }

    /**
     * Ban a user
     */
    banUser(playerId, reason, durationHours = null) {
        const ban = {
            playerId,
            reason,
            timestamp: Date.now(),
            duration: durationHours ? durationHours * 60 * 60 * 1000 : null, // Convert to milliseconds
            permanent: durationHours === null,
            adminId: this.getCurrentAdmin()?.playerId
        };
        
        this.bannedUsers.add(ban);
        
        this.logAction('USER_BANNED', ban);
        
        EventBus.emit('user_banned', ban);
        
        // Force logout if they're currently playing
        if (window.Player?.playerId === playerId) {
            this.forceLogout(playerId, 'You have been banned from the game');
        }
        
        return ban;
    }

    /**
     * Check if user is banned
     */
    isUserBanned(playerId) {
        const ban = Array.from(this.bannedUsers).find(b => b.playerId === playerId);
        if (!ban) return false;
        
        // Check if temporary ban has expired
        if (!ban.permanent && ban.timestamp + ban.duration < Date.now()) {
            this.bannedUsers.delete(ban);
            this.logAction('BAN_EXPIRED', { playerId });
            return false;
        }
        
        return ban;
    }

    /**
     * Moderate a forum/news post
     */
    moderatePost(postId, action, reason) {
        const moderation = {
            id: this.generateId(),
            timestamp: Date.now(),
            postId,
            action, // 'hide', 'delete', 'edit', 'flag'
            reason,
            adminId: this.getCurrentAdmin()?.playerId,
            originalPost: null // Would store original content
        };
        
        this.moderatedPosts.push(moderation);
        
        this.logAction('POST_MODERATED', moderation);
        
        EventBus.emit('post_moderated', moderation);
        
        return moderation;
    }

    /**
     * Get comprehensive game analytics
     */
    getGameAnalytics() {
        return {
            players: this.getPlayerAnalytics(),
            alliances: this.getAllianceAnalytics(),
            wars: this.getWarAnalytics(),
            economy: this.getEconomyAnalytics(),
            resources: this.getResourceAnalytics(),
            actions: this.getActionAnalytics(),
            errors: this.getErrorAnalytics(),
            performance: this.getPerformanceMetrics()
        };
    }

    /**
     * Get player analytics
     */
    getPlayerAnalytics() {
        // Would aggregate data from all player saves
        return {
            totalPlayers: this.getTotalPlayerCount(),
            activePlayers: this.getActivePlayerCount(),
            levelDistribution: this.getPlayerLevelDistribution(),
            experienceDistribution: this.getPlayerExperienceDistribution(),
            factionDistribution: this.getPlayerFactionDistribution(),
            averagePlayTime: this.getAveragePlayTime(),
            newPlayersToday: this.getNewPlayersCount(1),
            newPlayersWeek: this.getNewPlayersCount(7),
            retentionRate: this.calculateRetentionRate()
        };
    }

    /**
     * Bind event listeners for monitoring
     */
    bindEventListeners() {
        // Monitor all game events
        const eventsToMonitor = [
            'player_initialized', 'player_level_up', 'nation_created',
            'building_constructed', 'research_completed', 'trade_completed',
            'battle_started', 'battle_ended', 'alliance_formed', 'alliance_left',
            'territory_claimed', 'territory_lost', 'war_declared', 'war_ended',
            'treaty_signed', 'diplomacy_changed', 'resource_generated',
            'improvement_built', 'project_started', 'project_completed',
            'message_sent', 'forum_post_created', 'user_logged_in', 'user_logged_out'
        ];
        
        eventsToMonitor.forEach(eventType => {
            EventBus.on(eventType, (data) => {
                this.logAction(eventType.toUpperCase(), data);
            });
        });
        
        // Monitor errors specifically
        EventBus.on('error', (error) => {
            this.logError(error.error || error, error.context || {});
        });
        
        // Monitor game state changes
        EventBus.on('game_state_changed', (data) => {
            this.logAction('GAME_STATE_CHANGED', data);
        });

        // Auto-grant super_admin to seeded admin emails on account creation
        EventBus.on('account_created', (data) => {
            this.checkAndGrantAdminByEmail();
        });
    }

    /**
     * Check if the current player's email matches a seeded admin email,
     * and if so grant them super_admin automatically.
     * Admin emails are read from the ADMIN_EMAILS env var (server-side) or
     * the window.__ADMIN_EMAILS__ constant injected by the server.
     * Falls back to a hardcoded list for local / offline play.
     */
    checkAndGrantAdminByEmail() {
        const email = window.Player?.email || '';
        if (!email) return;

        // Sources: server-injected constant → hardcoded fallback
        const raw = (typeof window.__ADMIN_EMAILS__ !== 'undefined')
            ? window.__ADMIN_EMAILS__
            : 'cody.ray.inc@gmail.com';

        const adminEmails = raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

        if (!adminEmails.includes(email.toLowerCase())) return;

        const playerId = window.Player?.playerId;
        if (!playerId) return;

        // Already an admin? Skip.
        if (this.isAdmin(playerId)) return;

        console.log(`[ADMIN] Auto-granting super_admin to ${email}`);
        this.admins.add({
            playerId,
            permission: this.PERMISSIONS.SUPER_ADMIN,
            addedDate: Date.now(),
            addedBy: 'system'
        });

        this.logAction('ADMIN_AUTO_GRANTED', {
            targetPlayerId: playerId,
            permission: this.PERMISSIONS.SUPER_ADMIN,
            reason: 'email match'
        });

        this.saveAdminData();
        EventBus.emit('admin_added', { playerId, permission: this.PERMISSIONS.SUPER_ADMIN });
    }

    /**
     * Initialize global error tracking
     */
    initializeErrorTracking() {
        // Capture JavaScript errors
        window.addEventListener('error', (event) => {
            this.logError(event.error || new Error(event.message), {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                type: 'javascript_error'
            });
        });
        
        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError(event.reason, {
                type: 'unhandled_promise_rejection'
            });
        });
        
        // Override console.error to capture logged errors
        // Store original on the instance so logError can call it directly (avoids recursion)
        this._originalConsoleError = console.error;
        let _inLogError = false;
        console.error = (...args) => {
            this._originalConsoleError.apply(console, args);
            
            // Guard against re-entrant calls (logError → console.error → logError → ...)
            if (_inLogError || !args.length) return;
            _inLogError = true;
            try {
                const message = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ');
                
                this.logError(new Error(message), {
                    type: 'console_error',
                    arguments: args
                });
            } finally {
                _inLogError = false;
            }
        };
    }

    /**
     * Get game state snapshot for error context
     */
    getGameStateSnapshot() {
        try {
            return {
                player: window.Player ? {
                    id: window.Player.playerId,
                    username: window.Player.username,
                    level: window.Player.level,
                    experience: window.Player.experience
                } : null,
                nation: window.Nation ? {
                    name: window.Nation.name,
                    population: window.Nation.population,
                    territory: window.Nation.territory?.length || 0
                } : null,
                gameTime: window.GameTime ? {
                    year: window.GameTime.year,
                    day: window.GameTime.day
                } : null,
                gameState: window.GameEngine ? window.GameEngine.gameState : null
            };
        } catch (error) {
            return { error: 'Failed to capture game state' };
        }
    }

    /**
     * Categorize error severity
     */
    categorizeError(error) {
        const message = error.message || error.toString().toLowerCase();
        
        if (message.includes('cannot read property') || 
            message.includes('undefined') ||
            message.includes('null')) {
            return 'high';
        }
        
        if (message.includes('network') || 
            message.includes('fetch') ||
            message.includes('connection')) {
            return 'medium';
        }
        
        if (message.includes('syntax') || 
            message.includes('reference') ||
            message.includes('type')) {
            return 'critical';
        }
        
        return 'low';
    }

    /**
     * Helper methods
     */
    generateId() {
        return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getSessionId() {
        if (!window.adminSessionId) {
            window.adminSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return window.adminSessionId;
    }
    
    getCurrentAdmin() {
        if (!this.isAdmin()) return null;
        return Array.from(this.admins).find(a => a.playerId === window.Player?.playerId);
    }
    
    isValidPermission(permission) {
        return Object.values(this.PERMISSIONS).includes(permission);
    }
    
    getClientIP() {
        // This would require server implementation
        return 'localhost';
    }

    /**
     * Save admin data to localStorage
     */
    saveAdminData() {
        try {
            const adminData = {
                admins: Array.from(this.admins),
                bannedUsers: Array.from(this.bannedUsers),
                warnings: Object.fromEntries(this.warnings),
                moderatedPosts: this.moderatedPosts,
                actionLog: this.actionLog.slice(-1000), // Save last 1000 actions
                errorLog: this.errorLog.slice(-500), // Save last 500 errors
                bugReports: this.bugReports.slice(-100) // Save last 100 bug reports
            };
            
            localStorage.setItem('dominion_wars_admin_data', JSON.stringify(adminData));
            console.log('Admin data saved');
        } catch (error) {
            console.error('Failed to save admin data:', error);
        }
    }

    /**
     * Load admin data from localStorage
     */
    loadAdminData() {
        try {
            const savedData = localStorage.getItem('dominion_wars_admin_data');
            if (!savedData) return;
            
            const adminData = JSON.parse(savedData);
            
            this.admins = new Set(adminData.admins || []);
            this.bannedUsers = new Set(adminData.bannedUsers || []);
            this.warnings = new Map(Object.entries(adminData.warnings || {}));
            this.moderatedPosts = adminData.moderatedPosts || [];
            this.actionLog = adminData.actionLog || [];
            this.errorLog = adminData.errorLog || [];
            this.bugReports = adminData.bugReports || [];
            
            console.log('Admin data loaded');
        } catch (error) {
            console.error('Failed to load admin data:', error);
        }
    }

    /**
     * Setup auto-save for admin data
     */
    setupAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(() => {
            this.saveAdminData();
        }, this.logSaveInterval);
    }

    /**
     * Cleanup and destroy admin system
     */
    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.saveAdminData();
        this.isInitialized = false;
        console.log('Admin System destroyed');
    }

    // Placeholder methods for analytics (would be implemented based on actual data)
    getTotalPlayerCount() { return 0; }
    getActivePlayerCount() { return 0; }
    getPlayerLevelDistribution() { return {}; }
    getPlayerExperienceDistribution() { return {}; }
    getPlayerFactionDistribution() { return {}; }
    getAveragePlayTime() { return 0; }
    getNewPlayersCount(days) { return 0; }
    calculateRetentionRate() { return 0; }
    getAllianceAnalytics() { return {}; }
    getWarAnalytics() { return {}; }
    getEconomyAnalytics() { return {}; }
    getResourceAnalytics() { return {}; }
    getActionAnalytics() { return {}; }
    getErrorAnalytics() { return this.errorLog.slice(-100); }
    getPerformanceMetrics() { return {}; }
    flagForAdminAttention(errorEntry) { /* Implementation */ }
    forceLogout(playerId, message) { /* Implementation */ }
}

// Create global admin system instance
const adminSystem = new AdminSystem();
window.AdminSystem = adminSystem;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminSystem: adminSystem };
}