/**
 * Validation Utilities for Empire Game
 */

class ValidationUtils {
    /**
     * Validate nation name
     */
    static validateNationName(name) {
        const errors = [];
        
        if (!name || typeof name !== 'string') {
            errors.push('Nation name is required');
        } else {
            const trimmed = name.trim();
            if (trimmed.length < 3) {
                errors.push('Nation name must be at least 3 characters long');
            }
            if (trimmed.length > 50) {
                errors.push('Nation name must be 50 characters or less');
            }
            if (!/^[a-zA-Z0-9\s\-']+$/.test(trimmed)) {
                errors.push('Nation name can only contain letters, numbers, spaces, hyphens, and apostrophes');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            sanitized: name ? name.trim() : ''
        };
    }

    /**
     * Validate leader name
     */
    static validateLeaderName(name) {
        const errors = [];
        
        if (!name || typeof name !== 'string') {
            errors.push('Leader name is required');
        } else {
            const trimmed = name.trim();
            if (trimmed.length < 2) {
                errors.push('Leader name must be at least 2 characters long');
            }
            if (trimmed.length > 30) {
                errors.push('Leader name must be 30 characters or less');
            }
            if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) {
                errors.push('Leader name can only contain letters, spaces, hyphens, and apostrophes');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            sanitized: name ? name.trim() : ''
        };
    }

    /**
     * Validate email address
     */
    static validateEmail(email) {
        const errors = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email || typeof email !== 'string') {
            errors.push('Email address is required');
        } else {
            const trimmed = email.trim().toLowerCase();
            if (!emailRegex.test(trimmed)) {
                errors.push('Please enter a valid email address');
            }
            if (trimmed.length > 100) {
                errors.push('Email address must be 100 characters or less');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            sanitized: email ? email.trim().toLowerCase() : ''
        };
    }

    /**
     * Validate password strength
     */
    static validatePassword(password) {
        const errors = [];
        
        if (!password || typeof password !== 'string') {
            errors.push('Password is required');
        } else {
            if (password.length < 8) {
                errors.push('Password must be at least 8 characters long');
            }
            if (password.length > 128) {
                errors.push('Password must be 128 characters or less');
            }
            if (!/(?=.*[a-z])/.test(password)) {
                errors.push('Password must contain at least one lowercase letter');
            }
            if (!/(?=.*[A-Z])/.test(password)) {
                errors.push('Password must contain at least one uppercase letter');
            }
            if (!/(?=.*\d)/.test(password)) {
                errors.push('Password must contain at least one number');
            }
            if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
                errors.push('Password must contain at least one special character');
            }
        }
        
        const strength = this.calculatePasswordStrength(password);
        
        return {
            isValid: errors.length === 0,
            errors,
            strength
        };
    }

    /**
     * Calculate password strength score
     */
    static calculatePasswordStrength(password) {
        if (!password) return { score: 0, level: 'Very Weak' };
        
        let score = 0;
        
        // Length
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;
        
        // Character types
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
        
        // Complexity
        if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) score += 1;
        if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) score += 1;
        
        let level, color;
        if (score <= 2) {
            level = 'Very Weak';
            color = '#ff0000';
        } else if (score <= 4) {
            level = 'Weak';
            color = '#ff6600';
        } else if (score <= 6) {
            level = 'Medium';
            color = '#ffcc00';
        } else if (score <= 8) {
            level = 'Strong';
            color = '#66ff66';
        } else {
            level = 'Very Strong';
            color = '#00ff00';
        }
        
        return { score, level, color, percentage: (score / 9) * 100 };
    }

    /**
     * Validate monetary amount
     */
    static validateMoney(amount, min = 0, max = Number.MAX_SAFE_INTEGER) {
        const errors = [];
        
        if (amount === null || amount === undefined || amount === '') {
            errors.push('Amount is required');
        } else {
            const num = parseFloat(amount);
            if (isNaN(num)) {
                errors.push('Amount must be a valid number');
            } else {
                if (num < min) {
                    errors.push(`Amount must be at least $${min.toLocaleString()}`);
                }
                if (num > max) {
                    errors.push(`Amount cannot exceed $${max.toLocaleString()}`);
                }
                if (num % 0.01 !== 0) {
                    errors.push('Amount cannot have more than 2 decimal places');
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            sanitized: isNaN(parseFloat(amount)) ? 0 : parseFloat(amount)
        };
    }

    /**
     * Validate integer within range
     */
    static validateInteger(value, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
        const errors = [];
        
        if (value === null || value === undefined || value === '') {
            errors.push('Value is required');
        } else {
            const num = parseInt(value);
            if (isNaN(num)) {
                errors.push('Value must be a valid integer');
            } else {
                if (num < min) {
                    errors.push(`Value must be at least ${min.toLocaleString()}`);
                }
                if (num > max) {
                    errors.push(`Value cannot exceed ${max.toLocaleString()}`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            sanitized: isNaN(parseInt(value)) ? 0 : parseInt(value)
        };
    }

    /**
     * Validate percentage (0-100)
     */
    static validatePercentage(value) {
        return this.validateInteger(value, 0, 100);
    }

    /**
     * Validate file upload
     */
    static validateFile(file, allowedTypes = [], maxSize = 5 * 1024 * 1024) {
        const errors = [];
        
        if (!file) {
            errors.push('File is required');
        } else {
            // Check file type
            if (allowedTypes.length > 0) {
                const fileType = file.type.toLowerCase();
                const fileName = file.name.toLowerCase();
                
                const isValidType = allowedTypes.some(type => {
                    return fileType.includes(type) || fileName.endsWith(type);
                });
                
                if (!isValidType) {
                    errors.push(`File must be of type: ${allowedTypes.join(', ')}`);
                }
            }
            
            // Check file size
            if (file.size > maxSize) {
                const maxSizeMB = maxSize / (1024 * 1024);
                errors.push(`File size must be less than ${maxSizeMB}MB`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate URL
     */
    static validateURL(url) {
        const errors = [];
        
        if (!url || typeof url !== 'string') {
            errors.push('URL is required');
        } else {
            try {
                new URL(url);
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    errors.push('URL must start with http:// or https://');
                }
            } catch {
                errors.push('Please enter a valid URL');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            sanitized: url ? url.trim() : ''
        };
    }

    /**
     * Validate hex color code
     */
    static validateColor(color) {
        const errors = [];
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        
        if (!color || typeof color !== 'string') {
            errors.push('Color is required');
        } else {
            const trimmed = color.trim();
            if (!hexRegex.test(trimmed)) {
                errors.push('Color must be a valid hex code (e.g., #FF0000)');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            sanitized: color ? color.trim().toUpperCase() : ''
        };
    }

    /**
     * Validate date
     */
    static validateDate(date, minDate = null, maxDate = null) {
        const errors = [];
        
        if (!date) {
            errors.push('Date is required');
        } else {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) {
                errors.push('Please enter a valid date');
            } else {
                if (minDate && dateObj < new Date(minDate)) {
                    errors.push(`Date must be after ${new Date(minDate).toLocaleDateString()}`);
                }
                if (maxDate && dateObj > new Date(maxDate)) {
                    errors.push(`Date must be before ${new Date(maxDate).toLocaleDateString()}`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            sanitized: date ? new Date(date) : null
        };
    }

    /**
     * Sanitize HTML content
     */
    static sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    /**
     * Validate alliance name
     */
    static validateAllianceName(name) {
        const errors = [];
        
        if (!name || typeof name !== 'string') {
            errors.push('Alliance name is required');
        } else {
            const trimmed = name.trim();
            if (trimmed.length < 3) {
                errors.push('Alliance name must be at least 3 characters long');
            }
            if (trimmed.length > 40) {
                errors.push('Alliance name must be 40 characters or less');
            }
            if (!/^[a-zA-Z0-9\s\-'&]+$/.test(trimmed)) {
                errors.push('Alliance name can only contain letters, numbers, spaces, hyphens, apostrophes, and ampersands');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            sanitized: name ? name.trim() : ''
        };
    }

    /**
     * Validate message content
     */
    static validateMessage(message, minLength = 1, maxLength = 1000) {
        const errors = [];
        
        if (!message || typeof message !== 'string') {
            errors.push('Message is required');
        } else {
            const trimmed = message.trim();
            if (trimmed.length < minLength) {
                errors.push(`Message must be at least ${minLength} character${minLength > 1 ? 's' : ''} long`);
            }
            if (trimmed.length > maxLength) {
                errors.push(`Message must be ${maxLength} characters or less`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            sanitized: message ? message.trim() : ''
        };
    }

    /**
     * Validate skill points allocation
     */
    static validateSkillPoints(allocations, maxPoints = 100) {
        const errors = [];
        const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + (val || 0), 0);
        
        if (totalAllocated > maxPoints) {
            errors.push(`Total skill points cannot exceed ${maxPoints}`);
        }
        
        for (const [skill, points] of Object.entries(allocations)) {
            if (points < 0) {
                errors.push(`${skill} cannot have negative points`);
            }
            if (points > maxPoints) {
                errors.push(`${skill} cannot have more than ${maxPoints} points`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            totalAllocated,
            remainingPoints: maxPoints - totalAllocated
        };
    }

    /**
     * Batch validation
     */
    static validateBatch(validations) {
        const results = {};
        let allValid = true;
        
        for (const [field, validation] of Object.entries(validations)) {
            results[field] = validation;
            if (!validation.isValid) {
                allValid = false;
            }
        }
        
        return {
            isValid: allValid,
            results
        };
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ValidationUtils = ValidationUtils;
}