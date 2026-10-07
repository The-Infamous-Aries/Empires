/**
 * Modal Component - Reusable Modal Windows
 * Dominion Wars - Nation Building Strategy Game
 */

class Modal {
    constructor(options = {}) {
        this.id = options.id || `modal-${Date.now()}`;
        this.title = options.title || 'Modal';
        this.content = options.content || '';
        this.width = options.width || '500px';
        this.height = options.height || 'auto';
        this.closable = options.closable !== false;
        this.backdrop = options.backdrop !== false;
        this.keyboard = options.keyboard !== false;
        this.className = options.className || '';
        
        this.element = null;
        this.isVisible = false;
        this.onShow = options.onShow || null;
        this.onHide = options.onHide || null;
        this.onClose = options.onClose || null;
        
        this.create();
    }

    /**
     * Create modal DOM structure
     */
    create() {
        this.element = document.createElement('div');
        this.element.id = this.id;
        this.element.className = `modal ${this.className}`;
        this.element.style.display = 'none';
        
        this.element.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-dialog" style="max-width: ${this.width}; ${this.height !== 'auto' ? `height: ${this.height};` : ''}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">${this.title}</h4>
                        ${this.closable ? '<button type="button" class="modal-close" aria-label="Close">&times;</button>' : ''}
                    </div>
                    <div class="modal-body">
                        ${this.content}
                    </div>
                    <div class="modal-footer" style="display: none;">
                        <!-- Footer content will be added dynamically -->
                    </div>
                </div>
            </div>
        `;
        
        this.bindEvents();
        
        // Add to modal container or body
        const container = document.getElementById('modal-container') || document.body;
        container.appendChild(this.element);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        if (!this.element) return;
        
        // Close button
        const closeBtn = this.element.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        
        // Backdrop click
        if (this.backdrop) {
            const backdrop = this.element.querySelector('.modal-backdrop');
            backdrop.addEventListener('click', () => this.hide());
        }
        
        // Keyboard events
        if (this.keyboard) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isVisible) {
                    this.hide();
                }
            });
        }
        
        // Prevent dialog clicks from closing modal
        const dialog = this.element.querySelector('.modal-dialog');
        dialog.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    /**
     * Show the modal
     */
    show() {
        if (this.isVisible) return;
        
        this.element.style.display = 'flex';
        
        // Trigger reflow for animation
        this.element.offsetHeight;
        
        this.element.classList.add('modal-show');
        this.isVisible = true;
        
        // Focus management
        this.trapFocus();
        
        // Prevent body scroll
        document.body.classList.add('modal-open');
        
        // Emit event
        EventBus.emit(GameEvents.MODAL_OPENED, { modal: this });
        
        // Call onShow callback
        if (this.onShow) {
            this.onShow(this);
        }
    }

    /**
     * Hide the modal
     */
    hide() {
        if (!this.isVisible) return;
        
        this.element.classList.remove('modal-show');
        this.isVisible = false;
        
        // Wait for animation to complete
        setTimeout(() => {
            this.element.style.display = 'none';
        }, 300);
        
        // Restore body scroll if no other modals
        if (document.querySelectorAll('.modal-show').length === 0) {
            document.body.classList.remove('modal-open');
        }
        
        // Emit event
        EventBus.emit(GameEvents.MODAL_CLOSED, { modal: this });
        
        // Call onHide callback
        if (this.onHide) {
            this.onHide(this);
        }
    }

    /**
     * Close and destroy the modal
     */
    close() {
        this.hide();
        
        // Wait for animation to complete before destroying
        setTimeout(() => {
            this.destroy();
        }, 300);
        
        // Call onClose callback
        if (this.onClose) {
            this.onClose(this);
        }
    }

    /**
     * Set modal title
     */
    setTitle(title) {
        this.title = title;
        const titleElement = this.element.querySelector('.modal-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    /**
     * Set modal content
     */
    setContent(content) {
        this.content = content;
        const bodyElement = this.element.querySelector('.modal-body');
        if (bodyElement) {
            bodyElement.innerHTML = content;
        }
    }

    /**
     * Add footer content
     */
    setFooter(content) {
        const footerElement = this.element.querySelector('.modal-footer');
        if (footerElement) {
            footerElement.innerHTML = content;
            footerElement.style.display = content ? 'flex' : 'none';
        }
    }

    /**
     * Add footer buttons
     */
    addFooterButtons(buttons) {
        const buttonHtml = buttons.map(button => {
            const btnClass = button.type || 'secondary';
            return `<button type="button" class="btn btn-${btnClass}" data-action="${button.action || ''}">${button.text}</button>`;
        }).join('');
        
        this.setFooter(buttonHtml);
        
        // Bind button events
        const footerElement = this.element.querySelector('.modal-footer');
        footerElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn')) {
                const action = e.target.getAttribute('data-action');
                const button = buttons.find(b => b.action === action);
                if (button && button.handler) {
                    button.handler(this);
                }
            }
        });
    }

    /**
     * Trap focus within modal
     */
    trapFocus() {
        const focusableElements = this.element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            firstElement.focus();
            
            this.element.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            });
        }
    }

    /**
     * Get modal body element
     */
    getBody() {
        return this.element.querySelector('.modal-body');
    }

    /**
     * Get modal footer element
     */
    getFooter() {
        return this.element.querySelector('.modal-footer');
    }

    /**
     * Check if modal is visible
     */
    isShown() {
        return this.isVisible;
    }

    /**
     * Toggle modal visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Destroy the modal
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.isVisible = false;
    }

    /**
     * Static method to close all modals
     */
    static closeAll() {
        const modals = document.querySelectorAll('.modal-show');
        modals.forEach(modal => {
            const instance = modal._modalInstance;
            if (instance) {
                instance.hide();
            }
        });
    }

    /**
     * Static method to create a simple alert modal
     */
    static alert(title, message, callback = null) {
        const modal = new Modal({
            title: title,
            content: `<p>${message}</p>`,
            width: '400px',
            onClose: callback
        });
        
        modal.addFooterButtons([
            {
                text: 'OK',
                type: 'primary',
                action: 'ok',
                handler: (modal) => modal.close()
            }
        ]);
        
        modal.show();
        return modal;
    }

    /**
     * Static method to create a confirmation modal
     */
    static confirm(title, message, onConfirm = null, onCancel = null) {
        const modal = new Modal({
            title: title,
            content: `<p>${message}</p>`,
            width: '400px'
        });
        
        modal.addFooterButtons([
            {
                text: 'Cancel',
                type: 'secondary',
                action: 'cancel',
                handler: (modal) => {
                    if (onCancel) onCancel();
                    modal.close();
                }
            },
            {
                text: 'Confirm',
                type: 'primary',
                action: 'confirm',
                handler: (modal) => {
                    if (onConfirm) onConfirm();
                    modal.close();
                }
            }
        ]);
        
        modal.show();
        return modal;
    }

    /**
     * Static method to create a prompt modal
     */
    static prompt(title, message, defaultValue = '', onSubmit = null, onCancel = null) {
        const inputId = `prompt-input-${Date.now()}`;
        const content = `
            <p>${message}</p>
            <div class="form-group">
                <input type="text" id="${inputId}" class="form-control" value="${defaultValue}" placeholder="Enter value...">
            </div>
        `;
        
        const modal = new Modal({
            title: title,
            content: content,
            width: '400px'
        });
        
        modal.addFooterButtons([
            {
                text: 'Cancel',
                type: 'secondary',
                action: 'cancel',
                handler: (modal) => {
                    if (onCancel) onCancel();
                    modal.close();
                }
            },
            {
                text: 'Submit',
                type: 'primary',
                action: 'submit',
                handler: (modal) => {
                    const input = modal.element.querySelector(`#${inputId}`);
                    const value = input ? input.value : '';
                    if (onSubmit) onSubmit(value);
                    modal.close();
                }
            }
        ]);
        
        modal.show();
        
        // Focus the input
        setTimeout(() => {
            const input = modal.element.querySelector(`#${inputId}`);
            if (input) {
                input.focus();
                input.select();
            }
        }, 100);
        
        return modal;
    }
}

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Modal };
}