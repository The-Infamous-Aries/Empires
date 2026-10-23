/**
 * Mathematical Utilities for Empire Game
 */

class MathUtils {
    /**
     * Clamp a value between min and max
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Linear interpolation between two values
     */
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    /**
     * Generate random integer between min and max (inclusive)
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generate random float between min and max
     */
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Calculate percentage change between old and new values
     */
    static percentageChange(oldValue, newValue) {
        if (oldValue === 0) return newValue > 0 ? 100 : 0;
        return ((newValue - oldValue) / oldValue) * 100;
    }

    /**
     * Round to specified decimal places
     */
    static roundTo(value, decimals) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    /**
     * Calculate exponential growth with diminishing returns
     */
    static exponentialGrowth(base, exponent, diminishingFactor = 1) {
        return base * Math.pow(1 + exponent, diminishingFactor);
    }

    /**
     * Calculate distance between two points
     */
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Normalize angle to 0-360 degrees
     */
    static normalizeAngle(angle) {
        while (angle < 0) angle += 360;
        while (angle >= 360) angle -= 360;
        return angle;
    }

    /**
     * Calculate weighted average
     */
    static weightedAverage(values, weights) {
        if (values.length !== weights.length) {
            throw new Error('Values and weights arrays must have same length');
        }
        
        let total = 0;
        let weightSum = 0;
        
        for (let i = 0; i < values.length; i++) {
            total += values[i] * weights[i];
            weightSum += weights[i];
        }
        
        return weightSum > 0 ? total / weightSum : 0;
    }

    /**
     * Calculate compound interest
     */
    static compoundInterest(principal, rate, periods) {
        return principal * Math.pow(1 + rate, periods);
    }

    /**
     * Calculate standard deviation
     */
    static standardDeviation(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
        return Math.sqrt(avgSquaredDiff);
    }

    /**
     * Generate random normal distribution (Box-Muller transform)
     */
    static randomNormal(mean = 0, stdDev = 1) {
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        
        const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return z * stdDev + mean;
    }

    /**
     * Format large numbers with appropriate suffixes
     */
    static formatLargeNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    }

    /**
     * Calculate factorial
     */
    static factorial(n) {
        if (n < 0) return undefined;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    /**
     * Calculate combination (nCr)
     */
    static combination(n, r) {
        if (r > n || r < 0) return 0;
        if (r === 0 || r === n) return 1;
        
        r = Math.min(r, n - r); // Take advantage of symmetry
        let result = 1;
        
        for (let i = 0; i < r; i++) {
            result = result * (n - i) / (i + 1);
        }
        
        return Math.round(result);
    }

    /**
     * Check if value is within tolerance of target
     */
    static isWithinTolerance(value, target, tolerance) {
        return Math.abs(value - target) <= tolerance;
    }

    /**
     * Generate Fibonacci sequence up to n terms
     */
    static fibonacci(n) {
        if (n <= 0) return [];
        if (n === 1) return [0];
        if (n === 2) return [0, 1];
        
        const sequence = [0, 1];
        for (let i = 2; i < n; i++) {
            sequence[i] = sequence[i-1] + sequence[i-2];
        }
        return sequence;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.MathUtils = MathUtils;
}