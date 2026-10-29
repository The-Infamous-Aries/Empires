/**
 * Error System - Comprehensive error handling and reporting
 * Provides user-friendly error messages, error categorization, and admin flagging
 */

class ErrorSystem {
    constructor() {
        this.errorCodes = new Map();
        this.errorHandlers = new Map();
        this.userFriendlyMessages = new Map();
        this.isInitialized = false;
        this.debugMode = false;
        this.retryAttempts = new Map(); // Track retry attempts for operations
        this.maxRetries = 3;
        
        this.initializeErrorCodes();
        this.initializeErrorHandlers();
    }

    /**
     * Initialize the error system
     */
    initialize(debugMode = false) {
        if (this.isInitialized) return;
        
        this.debugMode = debugMode;
        console.log('Initializing Error System...');
        
        // Override global error handling
        this.setupGlobalErrorHandling();
        
        this.isInitialized = true;
        console.log('Error System initialized');
        
        EventBus.emit('error_system_initialized');
    }

    /**
     * Define error codes and categories
     */
    initializeErrorCodes() {
        // System Errors (1000-1999)
        this.addErrorCode('GAME_INIT_FAILED', 1001, 'critical', 'Game initialization failed');
        this.addErrorCode('SAVE_FAILED', 1002, 'high', 'Failed to save game data');
        this.addErrorCode('LOAD_FAILED', 1003, 'high', 'Failed to load game data');
        this.addErrorCode('INVALID_GAME_STATE', 1004, 'critical', 'Invalid game state detected');
        this.addErrorCode('SYSTEM_OVERLOAD', 1005, 'high', 'System is experiencing high load');
        
        // User Action Errors (2000-2999)
        this.addErrorCode('INVALID_INPUT', 2001, 'low', 'Invalid input provided');
        this.addErrorCode('INSUFFICIENT_RESOURCES', 2002, 'low', 'Not enough resources to complete action');
        this.addErrorCode('INVALID_ACTION', 2003, 'medium', 'Action not allowed in current state');
        this.addErrorCode('COOLDOWN_ACTIVE', 2004, 'low', 'Action is on cooldown');
        this.addErrorCode('PERMISSION_DENIED', 2005, 'medium', 'Insufficient permissions for action');
        this.addErrorCode('INVALID_TARGET', 2006, 'low', 'Invalid target for action');
        this.addErrorCode('ACTION_LIMIT_REACHED', 2007, 'low', 'Maximum actions per day reached');
        
        // Network/Connection Errors (3000-3999)
        this.addErrorCode('CONNECTION_LOST', 3001, 'medium', 'Connection to server lost');
        this.addErrorCode('TIMEOUT', 3002, 'medium', 'Operation timed out');
        this.addErrorCode('SERVER_ERROR', 3003, 'high', 'Server error occurred');
        this.addErrorCode('NETWORK_UNAVAILABLE', 3004, 'medium', 'Network is unavailable');
        
        // Building/Construction Errors (4000-4999)
        this.addErrorCode('INVALID_BUILDING_LOCATION', 4001, 'low', 'Cannot build at this location');
        this.addErrorCode('BUILDING_LIMIT_REACHED', 4002, 'low', 'Building limit reached for this type');
        this.addErrorCode('INSUFFICIENT_SPACE', 4003, 'low', 'Not enough space for building');
        this.addErrorCode('BUILDING_REQUIREMENTS_NOT_MET', 4004, 'low', 'Building requirements not satisfied');
        
        // Military/War Errors (5000-5999)
        this.addErrorCode('INSUFFICIENT_MILITARY', 5001, 'low', 'Not enough military units');
        this.addErrorCode('INVALID_ATTACK_TARGET', 5002, 'low', 'Cannot attack this target');
        this.addErrorCode('WAR_COOLDOWN', 5003, 'low', 'War actions are on cooldown');
        this.addErrorCode('ALLIANCE_CONFLICT', 5004, 'medium', 'Action conflicts with alliance status');
        
        // Economy/Trade Errors (6000-6999)
        this.addErrorCode('TRADE_FAILED', 6001, 'medium', 'Trade transaction failed');
        this.addErrorCode('INVALID_TRADE_OFFER', 6002, 'low', 'Invalid trade offer');
        this.addErrorCode('MARKET_UNAVAILABLE', 6003, 'medium', 'Market is currently unavailable');
        this.addErrorCode('INSUFFICIENT_FUNDS', 6004, 'low', 'Insufficient funds for transaction');
        
        // Alliance Errors (7000-7999)
        this.addErrorCode('ALLIANCE_FULL', 7001, 'low', 'Alliance has reached maximum members');
        this.addErrorCode('INVALID_ALLIANCE_ACTION', 7002, 'low', 'Invalid alliance action');
        this.addErrorCode('ALLIANCE_PERMISSIONS', 7003, 'medium', 'Insufficient alliance permissions');
        this.addErrorCode('ALREADY_IN_ALLIANCE', 7004, 'low', 'Player is already in an alliance');
        
        // Diplomacy Errors (8000-8999)
        this.addErrorCode('INVALID_DIPLOMATIC_ACTION', 8001, 'low', 'Invalid diplomatic action');
        this.addErrorCode('DIPLOMACY_COOLDOWN', 8002, 'low', 'Diplomacy actions are on cooldown');
        this.addErrorCode('EXISTING_TREATY', 8003, 'low', 'Treaty already exists');
        
        // UI/Interface Errors (9000-9999)
        this.addErrorCode('UI_COMPONENT_FAILED', 9001, 'medium', 'UI component failed to load');
        this.addErrorCode('INVALID_UI_STATE', 9002, 'medium', 'Invalid UI state');
        this.addErrorCode('THEME_LOAD_FAILED', 9003, 'low', 'Failed to load theme');
    }

    /**
     * Initialize error handlers for different error types
     */
    initializeErrorHandlers() {
        // System error handlers
        this.addErrorHandler('critical', this.handleCriticalError.bind(this));
        this.addErrorHandler('high', this.handleHighSeverityError.bind(this));
        this.addErrorHandler('medium', this.handleMediumSeverityError.bind(this));
        this.addErrorHandler('low', this.handleLowSeverityError.bind(this));
        
        // Specific error type handlers
        this.addErrorHandler('SAVE_FAILED', this.handleSaveError.bind(this));
        this.addErrorHandler('LOAD_FAILED', this.handleLoadError.bind(this));
        this.addErrorHandler('CONNECTION_LOST', this.handleConnectionError.bind(this));
        this.addErrorHandler('INSUFFICIENT_RESOURCES', this.handleResourceError.bind(this));
    }

    /**
     * Add an error code definition
     */
    addErrorCode(code, number, severity, description) {
        this.errorCodes.set(code, {
            code,
            number,
            severity,
            description,
            count: 0, // Track how often this error occurs
            lastOccurrence: null
        });
        
        // Add user-friendly message
        this.addUserFriendlyMessage(code, this.generateUserFriendlyMessage(code, description));
    }

    /**
     * Add error handler for specific error types
     */
    addErrorHandler(errorType, handler) {
        if (typeof handler !== 'function') {
            throw new Error('Error handler must be a function');
        }
        this.errorHandlers.set(errorType, handler);
    }

    /**
     * Add user-friendly error message
     */
    addUserFriendlyMessage(errorCode, message) {
        this.userFriendlyMessages.set(errorCode, message);
    }

    /**
     * Handle an error with proper categorization and user feedback
     */
    handleError(error, context = {}) {
        try {
            // Extract error information
            const errorInfo = this.extractErrorInfo(error, context);
            
            // Log the error
            this.logError(errorInfo);
            
            // Show user-friendly message
            this.showUserError(errorInfo);
            
            // Execute specific error handler
            this.executeErrorHandler(errorInfo);
            
            // Check if retry is appropriate
            this.handleRetryLogic(errorInfo);
            
            // Flag for admin attention if needed
            this.checkAdminFlag(errorInfo);
            
            return errorInfo;
        } catch (handlingError) {
            console.error('Error in error handling:', handlingError);
            this.handleFallbackError(error, handlingError);
        }
    }

    /**
     * Extract and standardize error information
     */
    extractErrorInfo(error, context = {}) {
        let errorCode = 'UNKNOWN_ERROR';
        let errorData = this.errorCodes.get('UNKNOWN_ERROR');
        
        // Try to identify the error
        if (typeof error === 'string') {
            errorCode = error;
            errorData = this.errorCodes.get(errorCode);
        } else if (error && error.code) {
            errorCode = error.code;
            errorData = this.errorCodes.get(errorCode);
        } else if (error && error.message) {
            errorCode = this.identifyErrorFromMessage(error.message);
            errorData = this.errorCodes.get(errorCode) || {
                code: errorCode,
                severity: 'medium',
                description: error.message
            };
        }
        
        // If no specific error data found, create default
        if (!errorData) {
            errorData = {
                code: errorCode,
                severity: 'medium',
                description: error.message || error.toString() || 'Unknown error occurred'
            };
        }
        
        // Update error statistics
        if (this.errorCodes.has(errorCode)) {
            const codeData = this.errorCodes.get(errorCode);
            codeData.count++;
            codeData.lastOccurrence = Date.now();
        }
        
        return {
            ...errorData,
            originalError: error,
            context: {
                timestamp: Date.now(),
                playerId: window.Player?.playerId,
                playerName: window.Player?.username,
                gameState: this.getGameStateForError(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                ...context
            },
            handled: false,
            retryCount: this.retryAttempts.get(errorCode) || 0
        };
    }

    /**
     * Try to identify error type from error message
     */
    identifyErrorFromMessage(message) {
        const messageLower = message.toLowerCase();
        
        if (messageLower.includes('save') || messageLower.includes('storage')) {
            return 'SAVE_FAILED';
        }
        if (messageLower.includes('load') || messageLower.includes('fetch')) {
            return 'LOAD_FAILED';
        }
        if (messageLower.includes('network') || messageLower.includes('connection')) {
            return 'CONNECTION_LOST';
        }
        if (messageLower.includes('permission') || messageLower.includes('unauthorized')) {
            return 'PERMISSION_DENIED';
        }
        if (messageLower.includes('resource') || messageLower.includes('insufficient')) {
            return 'INSUFFICIENT_RESOURCES';
        }
        if (messageLower.includes('timeout')) {
            return 'TIMEOUT';
        }
        
        return 'UNKNOWN_ERROR';
    }

    /**
     * Log error to console and admin system
     */
    logError(errorInfo) {
        const logLevel = this.getSeverityLogLevel(errorInfo.severity);
        
        console[logLevel](`[ERROR ${errorInfo.code}] ${errorInfo.description}`, {
            error: errorInfo.originalError,
            context: errorInfo.context
        });
        
        // Send to admin system if available
        if (window.AdminSystem && window.AdminSystem.isInitialized) {
            window.AdminSystem.logError(errorInfo.originalError, errorInfo.context);
        }
        
        // Emit error event
        EventBus.emit('error_occurred', errorInfo);
    }

    /**
     * Show user-friendly error message
     */
    showUserError(errorInfo) {
        const userMessage = this.userFriendlyMessages.get(errorInfo.code) || errorInfo.description;
        const severity = errorInfo.severity;
        
        // Show notification based on severity
        if (window.GameEngine && window.GameEngine.showNotification) {
            const notificationType = severity === 'critical' ? 'error' : 
                                  severity === 'high' ? 'error' : 'warning';
            
            window.GameEngine.showNotification(userMessage, notificationType);
        }
        
        // For critical errors, also show modal
        if (severity === 'critical') {
            this.showCriticalErrorModal(errorInfo, userMessage);
        }
    }

    /**
     * Execute specific error handler
     */
    executeErrorHandler(errorInfo) {
        // Try specific error code handler first
        if (this.errorHandlers.has(errorInfo.code)) {
            this.errorHandlers.get(errorInfo.code)(errorInfo);
            errorInfo.handled = true;
            return;
        }
        
        // Fall back to severity-based handler
        if (this.errorHandlers.has(errorInfo.severity)) {
            this.errorHandlers.get(errorInfo.severity)(errorInfo);
            errorInfo.handled = true;
        }
    }

    /**
     * Handle retry logic for recoverable errors
     */
    handleRetryLogic(errorInfo) {
        const retryableErrors = ['SAVE_FAILED', 'LOAD_FAILED', 'CONNECTION_LOST', 'TIMEOUT', 'SERVER_ERROR'];
        
        if (!retryableErrors.includes(errorInfo.code)) {
            return;
        }
        
        const currentRetries = this.retryAttempts.get(errorInfo.code) || 0;
        
        if (currentRetries < this.maxRetries) {
            this.retryAttempts.set(errorInfo.code, currentRetries + 1);
            
            // Show retry notification
            if (window.GameEngine && window.GameEngine.showNotification) {
                window.GameEngine.showNotification(
                    `Retrying operation... (${currentRetries + 1}/${this.maxRetries})`,
                    'info'
                );
            }
            
            // Emit retry event
            EventBus.emit('error_retry', {
                errorCode: errorInfo.code,
                retryCount: currentRetries + 1,
                maxRetries: this.maxRetries
            });
        } else {
            // Max retries reached
            this.retryAttempts.delete(errorInfo.code);
            
            if (window.GameEngine && window.GameEngine.showNotification) {
                window.GameEngine.showNotification(
                    'Operation failed after multiple attempts. Please try again later.',
                    'error'
                );
            }
        }
    }

    /**
     * Check if error should be flagged for admin attention
     */
    checkAdminFlag(errorInfo) {
        const flagConditions = [
            errorInfo.severity === 'critical',
            errorInfo.retryCount >= this.maxRetries,
            errorInfo.code === 'INVALID_GAME_STATE',
            (this.errorCodes.get(errorInfo.code)?.count || 0) > 10 // Frequent error
        ];
        
        if (flagConditions.some(condition => condition)) {
            EventBus.emit('admin_attention_required', {
                errorInfo,
                reason: 'High severity or frequent error',
                timestamp: Date.now()
            });
        }
    }

    /**
     * Specific error handlers
     */
    handleCriticalError(errorInfo) {
        console.error('CRITICAL ERROR:', errorInfo);
        
        // Try to save game state before potential crash
        this.emergencySave();
        
        // Show critical error UI
        this.showCriticalErrorModal(errorInfo);
    }

    handleHighSeverityError(errorInfo) {
        console.error('HIGH SEVERITY ERROR:', errorInfo);
        
        // Auto-save as precaution
        this.emergencySave();
    }

    handleMediumSeverityError(errorInfo) {
        console.warn('MEDIUM SEVERITY ERROR:', errorInfo);
    }

    handleLowSeverityError(errorInfo) {
        console.info('LOW SEVERITY ERROR:', errorInfo);
    }

    handleSaveError(errorInfo) {
        console.error('Save operation failed:', errorInfo);
        
        // Try alternative save method
        if (errorInfo.retryCount < 2) {
            setTimeout(() => {
                if (window.DataManager_Instance) {
                    window.DataManager_Instance.saveGame('emergency_save');
                }
            }, 1000);
        }
    }

    handleLoadError(errorInfo) {
        console.error('Load operation failed:', errorInfo);
        
        // Offer to create new game
        if (errorInfo.retryCount >= this.maxRetries) {
            this.showNewGameOption();
        }
    }

    handleConnectionError(errorInfo) {
        console.warn('Connection error:', errorInfo);
        
        // Switch to offline mode if possible
        EventBus.emit('connection_lost', errorInfo);
    }

    handleResourceError(errorInfo) {
        console.info('Resource constraint error:', errorInfo);
        
        // Show resource status to user
        EventBus.emit('show_resource_status', errorInfo);
    }

    /**
     * Emergency save in case of critical error
     */
    emergencySave() {
        try {
            if (window.DataManager_Instance && window.DataManager_Instance.isInitialized) {
                window.DataManager_Instance.saveGame('emergency_save', null, true);
                console.log('Emergency save completed');
            }
        } catch (saveError) {
            console.error('Emergency save failed:', saveError);
        }
    }

    /**
     * Show critical error modal
     */
    showCriticalErrorModal(errorInfo, userMessage) {
        // This would create a modal dialog for critical errors
        console.error('Critical error modal should be shown:', userMessage);
        // Implementation would depend on existing modal system
    }

    /**
     * Show option to create new game after load failure
     */
    showNewGameOption() {
        console.log('Showing new game option after load failure');
        // Implementation would show UI option to start fresh
    }

    /**
     * Generate user-friendly message for error code
     */
    generateUserFriendlyMessage(code, description) {
        const friendlyMessages = {
            'SAVE_FAILED': 'Unable to save your progress. Please try again.',
            'LOAD_FAILED': 'Failed to load game data. Your save file may be corrupted.',
            'INSUFFICIENT_RESOURCES': 'You don\'t have enough resources for this action.',
            'PERMISSION_DENIED': 'You don\'t have permission to perform this action.',
            'CONNECTION_LOST': 'Connection lost. Please check your internet connection.',
            'INVALID_INPUT': 'Please check your input and try again.',
            'COOLDOWN_ACTIVE': 'This action is temporarily unavailable. Please wait.',
            'BUILDING_LIMIT_REACHED': 'You\'ve reached the maximum number of this building type.',
            'INSUFFICIENT_MILITARY': 'You need more military units for this action.',
            'TRADE_FAILED': 'Trade could not be completed. Please try again.',
            'ALLIANCE_FULL': 'This alliance is at maximum capacity.',
            'TIMEOUT': 'The operation timed out. Please try again.'
        };
        
        return friendlyMessages[code] || description || 'An error occurred. Please try again.';
    }

    /**
     * Setup global error handling
     */
    setupGlobalErrorHandling() {
        // Capture unhandled JavaScript errors
        const originalHandler = window.onerror;
        window.onerror = (message, source, lineno, colno, error) => {
            this.handleError(error || new Error(message), {
                source,
                lineno,
                colno,
                type: 'global_error'
            });
            
            if (originalHandler) {
                originalHandler.call(window, message, source, lineno, colno, error);
            }
        };
        
        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                type: 'unhandled_rejection'
            });
        });
    }

    /**
     * Helper methods
     */
    getSeverityLogLevel(severity) {
        const levels = {
            'critical': 'error',
            'high': 'error',
            'medium': 'warn',
            'low': 'info'
        };
        return levels[severity] || 'log';
    }

    getGameStateForError() {
        try {
            return {
                initialized: window.GameEngine?.isInitialized || false,
                paused: window.GameEngine?.isPaused || false,
                player: window.Player ? {
                    id: window.Player.playerId,
                    level: window.Player.level
                } : null,
                nation: window.Nation ? {
                    name: window.Nation.name,
                    population: window.Nation.population
                } : null
            };
        } catch (error) {
            return { error: 'Failed to capture game state' };
        }
    }

    /**
     * Get error statistics
     */
    getErrorStatistics() {
        const stats = {
            totalErrors: 0,
            errorsBySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
            errorsByCode: {},
            mostCommonErrors: [],
            recentErrors: []
        };
        
        for (const [code, data] of this.errorCodes) {
            stats.totalErrors += data.count;
            stats.errorsBySeverity[data.severity] += data.count;
            stats.errorsByCode[code] = data.count;
        }
        
        // Get most common errors
        stats.mostCommonErrors = Array.from(this.errorCodes.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10)
            .map(([code, data]) => ({ code, count: data.count, severity: data.severity }));
        
        return stats;
    }

    /**
     * Clear error statistics (admin function)
     */
    clearErrorStatistics() {
        for (const [code, data] of this.errorCodes) {
            data.count = 0;
            data.lastOccurrence = null;
        }
        this.retryAttempts.clear();
    }

    /**
     * Test error system (for debugging)
     */
    testError(errorCode) {
        if (this.debugMode) {
            this.handleError(errorCode, { test: true });
        }
    }

    /**
     * Destroy error system
     */
    destroy() {
        this.errorCodes.clear();
        this.errorHandlers.clear();
        this.userFriendlyMessages.clear();
        this.retryAttempts.clear();
        this.isInitialized = false;
        console.log('Error System destroyed');
    }
}

// Create global error system instance
const errorSystem = new ErrorSystem();
window.ErrorSystem = errorSystem;

// Expose methods for global error handling
window.reportError = function(error, context = {}) {
    if (errorSystem.isInitialized) {
        return errorSystem.handleError(error, context);
    } else {
        console.error('Error System not initialized:', error);
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorSystem: errorSystem };
}