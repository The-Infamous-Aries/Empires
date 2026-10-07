/**
 * Event System for Game Communication
 * Dominion Wars - Nation Building Strategy Game
 */

class EventSystem {
    constructor() {
        this.listeners = new Map();
        this.eventQueue = [];
        this.isProcessing = false;
        this.maxQueueSize = 1000;
        
        // Debug logging
        this.debugMode = GameConfig.DEBUG.ENABLED;
        this.logLevel = GameConfig.DEBUG.LOG_LEVEL;
    }

    /**
     * Subscribe to an event
     * @param {string} eventType - Type of event to listen for
     * @param {Function} callback - Function to call when event occurs
     * @param {Object} context - Context to bind the callback to
     * @returns {Function} Unsubscribe function
     */
    on(eventType, callback, context = null) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }

        const listener = {
            callback: context ? callback.bind(context) : callback,
            context: context,
            once: false
        };

        this.listeners.get(eventType).push(listener);

        this.log('debug', `Event listener added for '${eventType}'`);

        // Return unsubscribe function
        return () => this.off(eventType, callback, context);
    }

    /**
     * Subscribe to an event only once
     * @param {string} eventType - Type of event to listen for
     * @param {Function} callback - Function to call when event occurs
     * @param {Object} context - Context to bind the callback to
     * @returns {Function} Unsubscribe function
     */
    once(eventType, callback, context = null) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }

        const listener = {
            callback: context ? callback.bind(context) : callback,
            context: context,
            once: true
        };

        this.listeners.get(eventType).push(listener);

        this.log('debug', `One-time event listener added for '${eventType}'`);

        // Return unsubscribe function
        return () => this.off(eventType, callback, context);
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventType - Type of event to stop listening for
     * @param {Function} callback - Callback function to remove
     * @param {Object} context - Context that was bound to the callback
     */
    off(eventType, callback, context = null) {
        if (!this.listeners.has(eventType)) {
            return;
        }

        const listeners = this.listeners.get(eventType);
        const index = listeners.findIndex(listener => 
            listener.callback === (context ? callback.bind(context) : callback) &&
            listener.context === context
        );

        if (index !== -1) {
            listeners.splice(index, 1);
            this.log('debug', `Event listener removed for '${eventType}'`);

            // Clean up empty listener arrays
            if (listeners.length === 0) {
                this.listeners.delete(eventType);
            }
        }
    }

    /**
     * Remove all listeners for an event type
     * @param {string} eventType - Type of event to clear
     */
    removeAllListeners(eventType) {
        if (this.listeners.has(eventType)) {
            this.listeners.delete(eventType);
            this.log('debug', `All listeners removed for '${eventType}'`);
        }
    }

    /**
     * Emit an event immediately
     * @param {string} eventType - Type of event to emit
     * @param {*} data - Data to pass to event listeners
     */
    emit(eventType, data = null) {
        this.log('debug', `Emitting event '${eventType}'`, data);

        if (!this.listeners.has(eventType)) {
            return;
        }

        const listeners = this.listeners.get(eventType).slice(); // Create copy to avoid issues with modifications during iteration
        const toRemove = [];

        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            try {
                listener.callback(data, eventType);
                
                // Mark one-time listeners for removal
                if (listener.once) {
                    toRemove.push(i);
                }
            } catch (error) {
                this.log('error', `Error in event listener for '${eventType}':`, error);
            }
        }

        // Remove one-time listeners
        if (toRemove.length > 0) {
            const currentListeners = this.listeners.get(eventType);
            for (let i = toRemove.length - 1; i >= 0; i--) {
                const listenerIndex = toRemove[i];
                if (listenerIndex < currentListeners.length) {
                    currentListeners.splice(listenerIndex, 1);
                }
            }

            if (currentListeners.length === 0) {
                this.listeners.delete(eventType);
            }
        }
    }

    /**
     * Queue an event for later processing
     * @param {string} eventType - Type of event to queue
     * @param {*} data - Data to pass to event listeners
     */
    queue(eventType, data = null) {
        if (this.eventQueue.length >= this.maxQueueSize) {
            this.log('warn', 'Event queue is full, dropping oldest event');
            this.eventQueue.shift();
        }

        this.eventQueue.push({ type: eventType, data: data, timestamp: Date.now() });
        this.log('debug', `Event '${eventType}' queued`);
    }

    /**
     * Process all queued events
     */
    async processQueue() {
        if (this.isProcessing || this.eventQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        this.log('debug', `Processing ${this.eventQueue.length} queued events`);

        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.emit(event.type, event.data);
            
            // Allow other processes to run
            await this.sleep(0);
        }

        this.isProcessing = false;
        this.log('debug', 'Event queue processing complete');
    }

    /**
     * Clear the event queue
     */
    clearQueue() {
        const count = this.eventQueue.length;
        this.eventQueue = [];
        this.log('debug', `Cleared ${count} events from queue`);
    }

    /**
     * Get the number of listeners for an event type
     * @param {string} eventType - Type of event
     * @returns {number} Number of listeners
     */
    getListenerCount(eventType) {
        return this.listeners.has(eventType) ? this.listeners.get(eventType).length : 0;
    }

    /**
     * Get all event types that have listeners
     * @returns {Array<string>} Array of event types
     */
    getEventTypes() {
        return Array.from(this.listeners.keys());
    }

    /**
     * Check if there are any listeners for an event type
     * @param {string} eventType - Type of event
     * @returns {boolean} True if there are listeners
     */
    hasListeners(eventType) {
        return this.listeners.has(eventType) && this.listeners.get(eventType).length > 0;
    }

    /**
     * Get statistics about the event system
     * @returns {Object} Statistics object
     */
    getStats() {
        let totalListeners = 0;
        for (const listeners of this.listeners.values()) {
            totalListeners += listeners.length;
        }

        return {
            eventTypes: this.listeners.size,
            totalListeners: totalListeners,
            queuedEvents: this.eventQueue.length,
            isProcessing: this.isProcessing
        };
    }

    /**
     * Helper function for async delay
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Log messages with different levels
     * @param {string} level - Log level (debug, info, warn, error)
     * @param {string} message - Message to log
     * @param {*} data - Optional data to log
     */
    log(level, message, data = null) {
        if (!this.debugMode) return;

        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = levels[this.logLevel] || 1;
        const messageLevel = levels[level] || 1;

        if (messageLevel >= currentLevel) {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [EventSystem] [${level.toUpperCase()}] ${message}`;
            
            if (data !== null) {
                console[level] || console.log(logMessage, data);
            } else {
                console[level] || console.log(logMessage);
            }
        }
    }

    /**
     * Destroy the event system and clean up resources
     */
    destroy() {
        this.listeners.clear();
        this.clearQueue();
        this.isProcessing = false;
        this.log('info', 'Event system destroyed');
    }
}

// Create global event system instance
const EventBus = new EventSystem();

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventSystem, EventBus };
}