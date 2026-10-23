/**
 * Formatting Utilities for Empire Game
 */

class FormattingUtils {
    /**
     * Format money with proper currency symbol and commas
     */
    static formatMoney(amount, showCents = false) {
        if (typeof amount !== 'number') return '$0';
        
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: showCents ? 2 : 0,
            maximumFractionDigits: showCents ? 2 : 0
        });
        
        return formatter.format(amount);
    }

    /**
     * Format large numbers with appropriate suffixes (K, M, B, T)
     */
    static formatNumber(num, decimals = 1) {
        if (typeof num !== 'number') return '0';
        
        const abs = Math.abs(num);
        const sign = num < 0 ? '-' : '';
        
        if (abs >= 1e12) {
            return sign + (abs / 1e12).toFixed(decimals) + 'T';
        } else if (abs >= 1e9) {
            return sign + (abs / 1e9).toFixed(decimals) + 'B';
        } else if (abs >= 1e6) {
            return sign + (abs / 1e6).toFixed(decimals) + 'M';
        } else if (abs >= 1e3) {
            return sign + (abs / 1e3).toFixed(decimals) + 'K';
        }
        
        return num.toLocaleString();
    }

    /**
     * Format percentage with % symbol
     */
    static formatPercentage(value, decimals = 1) {
        if (typeof value !== 'number') return '0%';
        return value.toFixed(decimals) + '%';
    }

    /**
     * Format time duration in human readable format
     */
    static formatDuration(seconds) {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
        
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        return `${days}d ${hours}h`;
    }

    /**
     * Format date in readable format
     */
    static formatDate(date, includeTime = false) {
        if (!date) return 'Never';
        
        const d = new Date(date);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        return d.toLocaleDateString('en-US', options);
    }

    /**
     * Format relative time (e.g., "2 hours ago")
     */
    static formatRelativeTime(date) {
        if (!date) return 'Never';
        
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
        if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
        
        return `${Math.floor(seconds / 31536000)} years ago`;
    }

    /**
     * Format resource amount with proper suffix
     */
    static formatResource(amount, resourceType = '') {
        if (typeof amount !== 'number') return '0';
        
        // Special formatting for specific resources
        switch (resourceType.toLowerCase()) {
            case 'money':
                return this.formatMoney(amount);
            case 'population':
                return this.formatNumber(amount, 0);
            case 'land':
                return this.formatNumber(amount, 0) + ' mi²';
            case 'tech':
                return Math.floor(amount).toLocaleString();
            default:
                return this.formatNumber(amount, 0);
        }
    }

    /**
     * Format military strength with color coding
     */
    static formatMilitaryStrength(strength) {
        const formatted = this.formatNumber(strength, 0);
        let color = 'white';
        
        if (strength >= 1000000) color = '#ff0000'; // Red - Very Strong
        else if (strength >= 100000) color = '#ff6600'; // Orange - Strong
        else if (strength >= 10000) color = '#ffcc00'; // Yellow - Moderate
        else if (strength >= 1000) color = '#66ff66'; // Green - Weak
        else color = '#cccccc'; // Gray - Very Weak
        
        return { formatted, color };
    }

    /**
     * Format nation statistics with appropriate icons and colors
     */
    static formatNationStat(statName, value) {
        const icons = {
            happiness: '😊',
            population: '👥',
            gdp: '💰',
            military: '⚔️',
            land: '🗺️',
            tech: '🔬',
            literacy: '📚',
            pollution: '🏭',
            disease: '🦠',
            crime: '🚔',
            environment: '🌍'
        };
        
        const icon = icons[statName.toLowerCase()] || '📊';
        let formattedValue = value;
        let color = 'white';
        
        // Format based on stat type
        switch (statName.toLowerCase()) {
            case 'happiness':
            case 'literacy':
            case 'pollution':
            case 'disease':
            case 'crime':
            case 'environment':
                formattedValue = this.formatPercentage(value);
                // Color coding for percentage stats
                if (value >= 80) color = '#00ff00';
                else if (value >= 60) color = '#66ff66';
                else if (value >= 40) color = '#ffff00';
                else if (value >= 20) color = '#ff6600';
                else color = '#ff0000';
                break;
            case 'population':
                formattedValue = this.formatNumber(value);
                break;
            case 'gdp':
            case 'money':
                formattedValue = this.formatMoney(value);
                break;
            case 'military':
                const militaryFormat = this.formatMilitaryStrength(value);
                formattedValue = militaryFormat.formatted;
                color = militaryFormat.color;
                break;
            default:
                formattedValue = this.formatNumber(value);
        }
        
        return { icon, formatted: formattedValue, color };
    }

    /**
     * Truncate text to specified length with ellipsis
     */
    static truncate(text, maxLength, suffix = '...') {
        if (!text || text.length <= maxLength) return text;
        return text.slice(0, maxLength - suffix.length) + suffix;
    }

    /**
     * Capitalize first letter of each word
     */
    static titleCase(str) {
        if (!str) return '';
        return str.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    /**
     * Convert camelCase to readable format
     */
    static camelToReadable(str) {
        if (!str) return '';
        return str
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());
    }

    /**
     * Format skill level with rank name
     */
    static formatSkillLevel(level) {
        const ranks = [
            { min: 0, name: 'Novice', color: '#cccccc' },
            { min: 10, name: 'Apprentice', color: '#66ff66' },
            { min: 25, name: 'Skilled', color: '#33ccff' },
            { min: 50, name: 'Expert', color: '#ffcc00' },
            { min: 75, name: 'Master', color: '#ff6600' },
            { min: 90, name: 'Grandmaster', color: '#ff0000' },
            { min: 100, name: 'Legendary', color: '#ff00ff' }
        ];
        
        const rank = ranks.reverse().find(r => level >= r.min) || ranks[0];
        return { 
            level: Math.floor(level), 
            rank: rank.name, 
            color: rank.color,
            formatted: `${rank.name} (${Math.floor(level)})`
        };
    }

    /**
     * Format health/status indicators
     */
    static formatHealthIndicator(value, type = 'percentage') {
        let color, status;
        
        if (type === 'percentage') {
            if (value >= 80) {
                color = '#00ff00';
                status = 'Excellent';
            } else if (value >= 60) {
                color = '#66ff66';
                status = 'Good';
            } else if (value >= 40) {
                color = '#ffff00';
                status = 'Fair';
            } else if (value >= 20) {
                color = '#ff6600';
                status = 'Poor';
            } else {
                color = '#ff0000';
                status = 'Critical';
            }
        }
        
        return {
            value: this.formatPercentage(value),
            color,
            status,
            formatted: `${status} (${this.formatPercentage(value)})`
        };
    }

    /**
     * Format list with proper separators
     */
    static formatList(items, separator = ', ', lastSeparator = ' and ') {
        if (!items || items.length === 0) return '';
        if (items.length === 1) return items[0];
        if (items.length === 2) return items.join(lastSeparator);
        
        return items.slice(0, -1).join(separator) + lastSeparator + items[items.length - 1];
    }

    /**
     * Format bytes to human readable format
     */
    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Format comparison with up/down arrows and colors
     */
    static formatComparison(current, previous, isHigherBetter = true) {
        if (previous === 0 || previous === undefined) {
            return { formatted: this.formatNumber(current), arrow: '', color: 'white' };
        }
        
        const change = current - previous;
        const percentChange = (change / previous) * 100;
        
        let arrow, color;
        if (change > 0) {
            arrow = '↑';
            color = isHigherBetter ? '#00ff00' : '#ff0000';
        } else if (change < 0) {
            arrow = '↓';
            color = isHigherBetter ? '#ff0000' : '#00ff00';
        } else {
            arrow = '→';
            color = '#cccccc';
        }
        
        return {
            formatted: this.formatNumber(current),
            change: this.formatNumber(change),
            percentChange: this.formatPercentage(Math.abs(percentChange)),
            arrow,
            color
        };
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.FormattingUtils = FormattingUtils;
}