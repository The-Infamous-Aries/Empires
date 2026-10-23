/**
 * Bug Report Modal - User-friendly bug reporting interface
 * Allows players to report bugs with detailed information
 */

class BugReportModal extends Modal {
    constructor() {
        super('bug-report-modal', 'Report a Bug');
        
        this.categories = [
            'general',
            'ui_interface',
            'gameplay',
            'buildings',
            'military',
            'economy',
            'diplomacy',
            'alliances',
            'save_load',
            'performance'
        ];
        
        this.severities = [
            'low',
            'medium',
            'high',
            'critical'
        ];
        
        this.attachments = [];
        this.maxAttachments = 3;
    }

    /**
     * Create modal content
     */
    createContent() {
        return `
            <div class="bug-report-form">
                <form id="bug-report-form" onsubmit="BugReportModal.submitReport(event)">
                    <div class="form-group">
                        <label for="bug-title">Bug Title *</label>
                        <input type="text" 
                               id="bug-title" 
                               name="title" 
                               required 
                               maxlength="100"
                               placeholder="Brief description of the bug">
                        <div class="form-help">Keep it concise but descriptive</div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="bug-category">Category *</label>
                            <select id="bug-category" name="category" required>
                                <option value="">Select a category</option>
                                ${this.categories.map(cat => `
                                    <option value="${cat}">
                                        ${this.formatCategoryName(cat)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="bug-severity">Severity *</label>
                            <select id="bug-severity" name="severity" required>
                                <option value="">Select severity</option>
                                <option value="low">Low - Minor inconvenience</option>
                                <option value="medium">Medium - Affects gameplay</option>
                                <option value="high">High - Major functionality broken</option>
                                <option value="critical">Critical - Game breaking</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="bug-description">Description *</label>
                        <textarea id="bug-description" 
                                  name="description" 
                                  required 
                                  rows="4" 
                                  maxlength="1000"
                                  placeholder="Describe what happened and what you expected to happen"></textarea>
                        <div class="character-count">
                            <span id="description-count">0</span>/1000 characters
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="bug-steps">Steps to Reproduce</label>
                        <textarea id="bug-steps" 
                                  name="steps" 
                                  rows="3" 
                                  maxlength="500"
                                  placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"></textarea>
                        <div class="character-count">
                            <span id="steps-count">0</span>/500 characters
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Browser Information</label>
                        <div class="browser-info">
                            <div>Browser: ${navigator.userAgent.split(' ')[0] || 'Unknown'}</div>
                            <div>Screen: ${window.screen.width}x${window.screen.height}</div>
                            <div>Viewport: ${window.innerWidth}x${window.innerHeight}</div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Game State (Auto-captured)</label>
                        <div class="game-state-info">
                            ${this.getGameStateInfo()}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="bug-attachments">Screenshots (Optional)</label>
                        <div class="attachment-area">
                            <input type="file" 
                                   id="bug-attachments" 
                                   multiple 
                                   accept="image/*,.png,.jpg,.jpeg,.gif"
                                   onchange="BugReportModal.handleAttachments(this.files)"
                                   style="display: none;">
                            <div class="drop-zone" onclick="document.getElementById('bug-attachments').click()">
                                <div class="drop-zone-content">
                                    <div class="drop-icon">📷</div>
                                    <div>Click to select images or drag and drop</div>
                                    <div class="drop-help">PNG, JPG, GIF up to 5MB each (max 3 files)</div>
                                </div>
                            </div>
                            <div id="attachment-preview"></div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" 
                                class="btn btn-secondary" 
                                onclick="BugReportModal.close()">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            Submit Bug Report
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Initialize the bug report modal
     */
    initialize() {
        super.initialize();
        this.setupEventListeners();
        this.setupFormValidation();
    }

    /**
     * Setup event listeners for form interactions
     */
    setupEventListeners() {
        // Character counters
        const descriptionField = document.getElementById('bug-description');
        if (descriptionField) {
            descriptionField.addEventListener('input', () => {
                this.updateCharacterCount('bug-description', 'description-count', 1000);
            });
        }
        
        const stepsField = document.getElementById('bug-steps');
        if (stepsField) {
            stepsField.addEventListener('input', () => {
                this.updateCharacterCount('bug-steps', 'steps-count', 500);
            });
        }
        
        // Drag and drop for attachments
        const dropZone = document.querySelector('.drop-zone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                this.handleAttachments(e.dataTransfer.files);
            });
        }
    }

    /**
     * Setup form validation
     */
    setupFormValidation() {
        const form = document.getElementById('bug-report-form');
        if (!form) return;
        
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateField(input);
                }
            });
        });
    }

    /**
     * Update character count display
     */
    updateCharacterCount(fieldId, counterId, maxLength) {
        const field = document.getElementById(fieldId);
        const counter = document.getElementById(counterId);
        
        if (field && counter) {
            const currentLength = field.value.length;
            counter.textContent = currentLength;
            counter.parentElement.classList.toggle('over-limit', currentLength > maxLength);
        }
    }

    /**
     * Validate individual form field
     */
    validateField(field) {
        let isValid = true;
        let errorMessage = '';
        
        // Required field validation
        if (field.hasAttribute('required') && !field.value.trim()) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        
        // Length validation
        if (field.maxLength && field.value.length > field.maxLength) {
            isValid = false;
            errorMessage = `Maximum ${field.maxLength} characters allowed`;
        }
        
        // Update field appearance
        field.classList.toggle('error', !isValid);
        
        // Show/hide error message
        let errorElement = field.parentElement.querySelector('.field-error');
        if (!isValid && !errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            field.parentElement.appendChild(errorElement);
        }
        
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = isValid ? 'none' : 'block';
        }
        
        return isValid;
    }

    /**
     * Handle file attachments
     */
    handleAttachments(files) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
        
        for (let file of files) {
            // Check if we can add more files
            if (this.attachments.length >= this.maxAttachments) {
                this.showError(`Maximum ${this.maxAttachments} attachments allowed`);
                break;
            }
            
            // Validate file type
            if (!allowedTypes.includes(file.type)) {
                this.showError(`File type ${file.type} not supported. Use PNG, JPG, or GIF.`);
                continue;
            }
            
            // Validate file size
            if (file.size > maxSize) {
                this.showError(`File ${file.name} is too large. Maximum size is 5MB.`);
                continue;
            }
            
            // Add to attachments
            this.attachments.push(file);
            this.updateAttachmentPreview();
        }
    }

    /**
     * Update attachment preview
     */
    updateAttachmentPreview() {
        const preview = document.getElementById('attachment-preview');
        if (!preview) return;
        
        preview.innerHTML = this.attachments.map((file, index) => `
            <div class="attachment-item">
                <div class="attachment-info">
                    <div class="attachment-name">${file.name}</div>
                    <div class="attachment-size">${this.formatFileSize(file.size)}</div>
                </div>
                <button type="button" 
                        class="btn btn-small btn-danger" 
                        onclick="BugReportModal.removeAttachment(${index})">
                    Remove
                </button>
            </div>
        `).join('');
    }

    /**
     * Remove attachment by index
     */
    static removeAttachment(index) {
        const modal = Modal.getModal('bug-report-modal');
        if (modal && modal.attachments) {
            modal.attachments.splice(index, 1);
            modal.updateAttachmentPreview();
        }
    }

    /**
     * Handle form submission
     */
    static async submitReport(event) {
        event.preventDefault();
        
        const modal = Modal.getModal('bug-report-modal');
        if (!modal) return;
        
        const form = event.target;
        const formData = new FormData(form);
        
        // Validate form
        let isValid = true;
        const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        requiredFields.forEach(field => {
            if (!modal.validateField(field)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            modal.showError('Please fix the errors above before submitting.');
            return;
        }
        
        // Create bug report object
        const bugReport = {
            title: formData.get('title'),
            category: formData.get('category'),
            severity: formData.get('severity'),
            description: formData.get('description'),
            steps: formData.get('steps') ? formData.get('steps').split('\n').filter(step => step.trim()) : [],
            attachments: modal.attachments.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type
                // File data would be processed for actual upload
            }))
        };
        
        try {
            // Submit to admin system
            if (window.AdminSystem && window.AdminSystem.isInitialized) {
                const reportId = window.AdminSystem.submitBugReport(bugReport);
                
                modal.showSuccess(`Bug report submitted successfully! Report ID: ${reportId}`);
                
                setTimeout(() => {
                    modal.close();
                }, 2000);
            } else {
                throw new Error('Admin system not available');
            }
            
        } catch (error) {
            modal.showError('Failed to submit bug report. Please try again.');
            console.error('Bug report submission error:', error);
        }
    }

    /**
     * Get current game state information
     */
    getGameStateInfo() {
        try {
            const gameInfo = [];
            
            if (window.Player) {
                gameInfo.push(`Player Level: ${window.Player.level || 1}`);
                gameInfo.push(`Player ID: ${window.Player.playerId || 'Unknown'}`);
            }
            
            if (window.Nation) {
                gameInfo.push(`Nation: ${window.Nation.name || 'Unnamed'}`);
                gameInfo.push(`Population: ${window.Nation.population || 0}`);
            }
            
            if (window.GameTime) {
                gameInfo.push(`Game Year: ${window.GameTime.year || 1}`);
                gameInfo.push(`Game Day: ${window.GameTime.day || 1}`);
            }
            
            if (window.GameEngine) {
                gameInfo.push(`Game Status: ${window.GameEngine.isPaused ? 'Paused' : 'Running'}`);
            }
            
            return gameInfo.length > 0 ? 
                gameInfo.map(info => `<div>${info}</div>`).join('') : 
                '<div>No game state available</div>';
        } catch (error) {
            return '<div>Error capturing game state</div>';
        }
    }

    /**
     * Format category name for display
     */
    formatCategoryName(category) {
        return category.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Show error message
     */
    showError(message) {
        // Remove existing error messages
        const existingErrors = this.element.querySelectorAll('.form-error');
        existingErrors.forEach(error => error.remove());
        
        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.textContent = message;
        
        // Add to form
        const form = this.element.querySelector('.bug-report-form');
        form.insertBefore(errorDiv, form.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        // Remove existing messages
        const existingMessages = this.element.querySelectorAll('.form-error, .form-success');
        existingMessages.forEach(msg => msg.remove());
        
        // Create success element
        const successDiv = document.createElement('div');
        successDiv.className = 'form-success';
        successDiv.textContent = message;
        
        // Add to form
        const form = this.element.querySelector('.bug-report-form');
        form.insertBefore(successDiv, form.firstChild);
    }

    /**
     * Close modal and reset form
     */
    close() {
        this.attachments = [];
        super.close();
    }

    /**
     * Static method to open bug report modal
     */
    static open() {
        let modal = Modal.getModal('bug-report-modal');
        if (!modal) {
            modal = new BugReportModal();
            modal.initialize();
        }
        modal.show();
    }
}

// Add global function for easy access
window.reportBug = function() {
    BugReportModal.open();
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BugReportModal };
}