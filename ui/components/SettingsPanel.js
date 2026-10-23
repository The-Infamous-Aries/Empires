/**
 * Settings Panel Component - User Preferences and Configuration
 * Dominion Wars - Nation Building Strategy Game
 */

// Import flag designer component
// Note: Ensure FlagDesigner.js is loaded before SettingsPanel.js

class SettingsPanel {
    constructor() {
        this.isVisible = false;
        this.currentTheme = 'dark';
        this.settings = this.loadSettings();
        this.availableThemes = [
            'light', 'dark', 'sea', 'fire', 'forest', 
            'royal', 'neon', 'cyberpunk', 'sunset', 'arctic'
        ];
        this.textSizes = {
            'xs': '0.75rem',
            'sm': '0.875rem', 
            'md': '1rem',
            'lg': '1.125rem',
            'xl': '1.25rem'
        };
        this.nameFonts = [
            'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
            'Poppins', 'Source Sans Pro', 'Nunito Sans', 'Work Sans', 'Playfair Display'
        ];
        this.nameColors = [
            '#ffffff', '#ff6b6b', '#4ecdc4', '#45b7d1', 
            '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'
        ];
        this.nationColors = [
            '#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#ff6348',
            '#7bed9f', '#70a1ff', '#5352ed', '#ff3838', '#2f3542',
            '#ff4081', '#00e676'
        ];
        
        this.createElement();
        this.bindEvents();
        this.setupImages();
        this.applySettings();
        
        // Initialize flag designer
        this.flagDesigner = null;
    }
    /**
     * Create settings panel DOM structure
     */
    createElement() {
        this.element = document.createElement('div');
        this.element.id = 'settings-panel';
        this.element.className = 'settings-panel hidden';
        
        this.element.innerHTML = `
            <div class="settings-overlay"></div>
            <div class="settings-content">
                <div class="settings-header">
                    <h2>⚙️ Game Settings</h2>
                    <button class="settings-close" type="button">✕</button>
                </div>
                
                <div class="settings-body">
                    <div class="settings-tabs">
                        <button class="settings-tab active" data-tab="appearance">🎨 Appearance</button>
                        <button class="settings-tab" data-tab="profile">👤 Profile</button>
                        <button class="settings-tab" data-tab="flag">🏳️ Flag</button>
                        <button class="settings-tab" data-tab="game">🎮 Game</button>
                    </div>
                    
                    <div class="settings-tab-content">
                        ${this.createAppearanceTab()}
                        ${this.createProfileTab()}
                        ${this.createFlagTab()}
                        ${this.createGameTab()}
                    </div>
                </div>
                
                <div class="settings-footer">
                    <button class="btn btn-secondary settings-reset" type="button">Reset to Defaults</button>
                    <div class="settings-actions">
                        <button class="btn btn-outline settings-cancel" type="button">Cancel</button>
                        <button class="btn btn-primary settings-save" type="button">Save Changes</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.element);
    }
    
    /**
     * Setup default images
     */
    setupImages() {
        const avatarImg = this.element.querySelector('#current-avatar-img');
        const bannerImg = this.element.querySelector('#current-banner-img');
        
        // Set avatar
        const defaultAvatar = localStorage.getItem('default-avatar');
        if (avatarImg) {
            avatarImg.src = this.settings.avatar || defaultAvatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiMzYjgyZjYiLz48dGV4dCB4PSI2MCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0OCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPvCfkYQ8L3RleHQ+PC9zdmc+';
        }
        
        // Set banner
        const defaultBanner = localStorage.getItem('default-banner');
        if (bannerImg) {
            bannerImg.src = this.settings.banner || defaultBanner || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDQwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxZjI5MzciLz48dGV4dCB4PSIyMDAiIHk9IjUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5Zb3VyIEVtcGlyZSBCYW5uZXI8L3RleHQ+PC9zdmc+';
        }
    }
    
    /**
     * Create appearance settings tab
     */
    createAppearanceTab() {
        return `
            <div class="settings-tab-pane active" data-tab="appearance">
                <div class="settings-section">
                    <h3>🎨 Theme Selection</h3>
                    <p class="settings-description">Choose a visual theme that suits your playstyle</p>
                    <div class="theme-grid">
                        ${this.availableThemes.map(theme => `
                            <div class="theme-option" data-theme="${theme}">
                                <div class="theme-preview theme-${theme}">
                                    <div class="theme-sample-bg">
                                        <div class="theme-sample-primary"></div>
                                        <div class="theme-sample-secondary"></div>
                                        <div class="theme-sample-accent"></div>
                                    </div>
                                </div>
                                <span class="theme-name">${this.capitalizeFirst(theme)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>📏 Text Size</h3>
                    <p class="settings-description">Adjust text size for better readability</p>
                    <div class="text-size-options">
                        ${Object.entries(this.textSizes).map(([size, value]) => `
                            <div class="text-size-option" data-size="${size}">
                                <input type="radio" name="text-size" value="${size}" id="text-size-${size}" ${this.settings.textSize === size ? 'checked' : ''}>
                                <label for="text-size-${size}" style="font-size: ${value}">
                                    ${size.toUpperCase()} - Sample Text
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    /**
     * Create profile settings tab
     */
    createProfileTab() {
        return `
            <div class="settings-tab-pane" data-tab="profile">
                <div class="settings-section">
                    <h3>🖼️ Avatar & Banner</h3>
                    <p class="settings-description">Customize your visual presence in the game</p>
                    
                    <div class="avatar-section">
                        <div class="avatar-upload">
                            <div class="current-avatar">
                                <img id="current-avatar-img" src="" alt="Current Avatar">
                            </div>
                            <div class="avatar-controls">
                                <label for="avatar-upload" class="btn btn-outline">Choose Avatar</label>
                                <input type="file" id="avatar-upload" accept="image/*" style="display: none;">
                                <button type="button" class="btn btn-secondary" id="clear-avatar">Clear</button>
                            </div>
                        </div>
                        
                        <div class="banner-upload">
                            <div class="current-banner">
                                <img id="current-banner-img" src="" alt="Current Banner">
                                <div class="banner-overlay">
                                    <span>Banner Preview</span>
                                </div>
                            </div>
                            <div class="banner-controls">
                                <label for="banner-upload" class="btn btn-outline">Choose Banner</label>
                                <input type="file" id="banner-upload" accept="image/*" style="display: none;">
                                <button type="button" class="btn btn-secondary" id="clear-banner">Clear</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>✏️ Name Customization</h3>
                    <p class="settings-description">Choose how your name appears to other players</p>
                    
                    <div class="name-customization">
                        <div class="name-font-selection">
                            <label>Font Family</label>
                            <select id="name-font-select">
                                ${this.nameFonts.map(font => `
                                    <option value="${font}" style="font-family: '${font}'" ${this.settings.nameFont === font ? 'selected' : ''}>
                                        ${font}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="name-color-selection">
                            <label>Name Color</label>
                            <div class="color-grid name-colors">
                                ${this.nameColors.map(color => `
                                    <div class="color-option ${this.settings.nameColor === color ? 'selected' : ''}" 
                                         data-color="${color}" style="background-color: ${color}">
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="name-preview">
                            <label>Preview</label>
                            <div class="name-preview-box">
                                <span id="name-preview-text" 
                                      style="font-family: '${this.settings.nameFont}'; color: ${this.settings.nameColor}">
                                    ${this.settings.playerName || 'Player Name'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Create flag customization tab
     */
    createFlagTab() {
        return `
            <div class="settings-tab-pane" data-tab="flag">
                <div class="settings-section">
                    <h3>🏳️ Nation Flag Design</h3>
                    <p class="settings-description">Design a custom flag for your nation or upload your own image</p>
                    
                    <div id="flag-designer-container">
                        <!-- Flag Designer will be inserted here -->
                    </div>
                </div>
            </div>
        `;
    }
    /**
     * Create game settings tab
     */
    createGameTab() {
        return `
            <div class="settings-tab-pane" data-tab="game">
                <div class="settings-section">
                    <h3>🗺️ Nation Colors</h3>
                    <p class="settings-description">Customize how your nation appears on the map</p>
                    
                    <div class="nation-colors">
                        <div class="color-selection-group">
                            <div class="nation-color-primary">
                                <label>Primary Color (Fill)</label>
                                <div class="color-grid">
                                    ${this.nationColors.map(color => `
                                        <div class="color-option ${this.settings.nationColorPrimary === color ? 'selected' : ''}" 
                                             data-color="${color}" data-type="primary" style="background-color: ${color}">
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="nation-color-secondary">
                                <label>Secondary Color (Outline)</label>
                                <div class="color-grid">
                                    ${this.nationColors.map(color => `
                                        <div class="color-option ${this.settings.nationColorSecondary === color ? 'selected' : ''}" 
                                             data-color="${color}" data-type="secondary" style="background-color: ${color}">
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <div class="nation-preview">
                            <label>Nation Preview</label>
                            <div class="nation-preview-map">
                                <div class="territory-sample" 
                                     style="background-color: ${this.settings.nationColorPrimary}; 
                                            border: 3px solid ${this.settings.nationColorSecondary}">
                                    <span>Your Territory</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>⚙️ Game Preferences</h3>
                    <div class="game-preferences">
                        <div class="preference-item">
                            <label>
                                <input type="checkbox" id="auto-save" ${this.settings.autoSave ? 'checked' : ''}>
                                Enable Auto-Save
                            </label>
                            <p class="preference-description">Automatically save your progress every few minutes</p>
                        </div>
                        
                        <div class="preference-item">
                            <label>
                                <input type="checkbox" id="sound-effects" ${this.settings.soundEffects ? 'checked' : ''}>
                                Sound Effects
                            </label>
                            <p class="preference-description">Play sound effects for game actions</p>
                        </div>
                        
                        <div class="preference-item">
                            <label>
                                <input type="checkbox" id="notifications" ${this.settings.notifications ? 'checked' : ''}>
                                Enable Notifications
                            </label>
                            <p class="preference-description">Show notifications for important game events</p>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>♿ Accessibility</h3>
                    <p class="settings-description">Options to improve game accessibility</p>
                    <div class="game-preferences">
                        <div class="preference-item">
                            <label>
                                <input type="checkbox" id="reduce-motion" ${this.settings.reduceMotion ? 'checked' : ''}>
                                Reduce Motion
                            </label>
                            <p class="preference-description">Minimize animations for motion sensitivity</p>
                        </div>
                        
                        <div class="preference-item">
                            <label>
                                <input type="checkbox" id="high-contrast" ${this.settings.highContrast ? 'checked' : ''}>
                                High Contrast Mode
                            </label>
                            <p class="preference-description">Increase contrast for better visibility</p>
                        </div>
                        
                        <div class="preference-item">
                            <label for="font-scale">Font Size Scale</label>
                            <input type="range" id="font-scale" min="0.8" max="1.5" step="0.1" value="${this.settings.fontScale || 1.0}">
                            <p class="preference-description">Adjust overall font size (${Math.round((this.settings.fontScale || 1.0) * 100)}%)</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Close button
        this.element.querySelector('.settings-close').addEventListener('click', () => this.hide());
        this.element.querySelector('.settings-overlay').addEventListener('click', () => this.hide());
        
        // Tab switching
        this.element.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Theme selection
        this.element.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.selectTheme(theme);
            });
        });
        
        // Text size selection
        this.element.querySelectorAll('input[name="text-size"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.settings.textSize = e.target.value;
                this.previewTextSize();
            });
        });
        
        // Name font selection
        const fontSelect = this.element.querySelector('#name-font-select');
        fontSelect.addEventListener('change', (e) => {
            this.settings.nameFont = e.target.value;
            this.updateNamePreview();
        });
        
        // Name color selection
        this.element.querySelectorAll('.name-colors .color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectNameColor(e.target.dataset.color);
            });
        });
        
        // Nation color selection
        this.element.querySelectorAll('.nation-colors .color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                const type = e.target.dataset.type;
                this.selectNationColor(color, type);
            });
        });
        
        // Avatar upload
        this.element.querySelector('#avatar-upload').addEventListener('change', (e) => this.handleAvatarUpload(e));
        this.element.querySelector('#clear-avatar').addEventListener('click', () => this.clearAvatar());
        
        // Banner upload
        this.element.querySelector('#banner-upload').addEventListener('change', (e) => this.handleBannerUpload(e));
        this.element.querySelector('#clear-banner').addEventListener('click', () => this.clearBanner());
        
        // Initialize flag designer when flag tab is clicked
        this.element.addEventListener('click', (e) => {
            if (e.target.classList.contains('settings-tab') && e.target.dataset.tab === 'flag') {
                this.initializeFlagDesigner();
            }
        });
        
        // Action buttons
        this.element.querySelector('.settings-save').addEventListener('click', () => this.saveSettings());
        this.element.querySelector('.settings-cancel').addEventListener('click', () => this.hide());
        this.element.querySelector('.settings-reset').addEventListener('click', () => this.resetToDefaults());
        
        // Accessibility settings
        const reduceMotionCheckbox = this.element.querySelector('#reduce-motion');
        if (reduceMotionCheckbox) {
            reduceMotionCheckbox.addEventListener('change', (e) => {
                this.settings.reduceMotion = e.target.checked;
                this.applyAccessibilitySettings();
            });
        }
        
        const highContrastCheckbox = this.element.querySelector('#high-contrast');
        if (highContrastCheckbox) {
            highContrastCheckbox.addEventListener('change', (e) => {
                this.settings.highContrast = e.target.checked;
                this.applyAccessibilitySettings();
            });
        }
        
        const fontScaleSlider = this.element.querySelector('#font-scale');
        if (fontScaleSlider) {
            fontScaleSlider.addEventListener('input', (e) => {
                this.settings.fontScale = parseFloat(e.target.value);
                this.applyAccessibilitySettings();
                // Update the percentage display
                const description = fontScaleSlider.nextElementSibling;
                if (description) {
                    description.textContent = `Adjust overall font size (${Math.round(this.settings.fontScale * 100)}%)`;
                }
            });
        }
    }
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        const defaultSettings = {
            theme: 'dark',
            textSize: 'md',
            nameFont: 'Inter',
            nameColor: '#ffffff',
            nationColorPrimary: '#ff4757',
            nationColorSecondary: '#2f3542',
            avatar: null,
            banner: null,
            playerName: 'Player',
            autoSave: true,
            soundEffects: true,
            notifications: true,
            // Accessibility settings
            reduceMotion: false,
            highContrast: false,
            fontScale: 1.0,
            flag: {
                type: 'designed',
                data: {
                    background: '#ffffff',
                    pattern1: null,
                    pattern1Color: '#ff0000',
                    pattern2: null,
                    pattern2Color: '#0000ff',
                    symbol: null,
                    symbolColor: '#000000',
                    symbolSize: 0.8,
                    layers: ['background', 'pattern1', 'pattern2', 'symbol']
                }
            }
        };
        
        try {
            const saved = localStorage.getItem('game-settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (error) {
            console.warn('Failed to load settings:', error);
            return defaultSettings;
        }
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            // Save flag data from designer if it exists
            this.saveFlagData();
            
            localStorage.setItem('game-settings', JSON.stringify(this.settings));
            this.applySettings();
            this.showNotification('Settings saved successfully!', 'success');
            this.hide();
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }
    
    /**
     * Apply current settings to the game
     */
    applySettings() {
        this.applyTheme();
        this.applyTextSize();
        this.applyNameStyles();
        this.applyNationColors();
        this.applyGamePreferences();
        this.applyAccessibilitySettings();
        this.applyFlagToNation();
    }
    
    /**
     * Apply selected theme
     */
    applyTheme() {
        // Remove all theme classes
        this.availableThemes.forEach(theme => {
            document.body.classList.remove(`theme-${theme}`);
        });
        
        // Add current theme class
        document.body.classList.add(`theme-${this.settings.theme}`);
        
        // Load theme CSS file
        this.loadThemeCSS(this.settings.theme);
    }
    
    /**
     * Load theme CSS file dynamically
     */
    loadThemeCSS(theme) {
        // Remove existing theme stylesheets
        const existingThemeLinks = document.querySelectorAll('link[data-theme]');
        existingThemeLinks.forEach(link => link.remove());
        
        // Add new theme stylesheet
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `ui/styles/themes/${theme}.css`;
        link.setAttribute('data-theme', theme);
        document.head.appendChild(link);
    }
    /**
     * Apply text size settings
     */
    applyTextSize() {
        const size = this.textSizes[this.settings.textSize] || this.textSizes.md;
        document.documentElement.style.setProperty('--text-size-base', size);
        
        // Apply size multipliers for different text elements
        const multipliers = {
            '--text-size-sm': '0.875',
            '--text-size-lg': '1.125',
            '--text-size-xl': '1.25',
            '--text-size-2xl': '1.5'
        };
        
        Object.entries(multipliers).forEach(([property, multiplier]) => {
            const baseSize = parseFloat(size);
            const newSize = (baseSize * parseFloat(multiplier)) + 'rem';
            document.documentElement.style.setProperty(property, newSize);
        });
    }
    
    /**
     * Apply name styling
     */
    applyNameStyles() {
        document.documentElement.style.setProperty('--name-font', this.settings.nameFont);
        document.documentElement.style.setProperty('--name-color', this.settings.nameColor);
        
        // Apply to all player name elements
        const nameElements = document.querySelectorAll('.player-name, .nation-name, .user-name');
        nameElements.forEach(element => {
            element.style.fontFamily = this.settings.nameFont;
            element.style.color = this.settings.nameColor;
        });
    }
    
    /**
     * Apply nation colors
     */
    applyNationColors() {
        document.documentElement.style.setProperty('--nation-color-primary', this.settings.nationColorPrimary);
        document.documentElement.style.setProperty('--nation-color-secondary', this.settings.nationColorSecondary);
        
        // Update map elements if they exist
        const nationElements = document.querySelectorAll('.nation-territory, .player-territory');
        nationElements.forEach(element => {
            element.style.backgroundColor = this.settings.nationColorPrimary;
            element.style.borderColor = this.settings.nationColorSecondary;
        });
    }
    
    /**
     * Apply game preferences
     */
    applyGamePreferences() {
        // Update game systems based on preferences
        if (window.GameEngine) {
            if (window.GameEngine.systems?.audio) {
                window.GameEngine.systems.audio.setEnabled(this.settings.soundEffects);
            }
        }
        
        // Update auto-save settings
        if (this.settings.autoSave && window.DataManager) {
            window.DataManager.enableAutoSave();
        }
    }
    
    /**
     * Apply accessibility settings
     */
    applyAccessibilitySettings() {
        // Reduced motion
        if (this.settings.reduceMotion) {
            document.body.classList.add('reduce-motion');
            document.documentElement.style.setProperty('--animation-duration', '0ms');
            document.documentElement.style.setProperty('--transition-duration', '0ms');
        } else {
            document.body.classList.remove('reduce-motion');
            document.documentElement.style.removeProperty('--animation-duration');
            document.documentElement.style.removeProperty('--transition-duration');
        }
        
        // High contrast
        if (this.settings.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
        
        // Font scale
        if (this.settings.fontScale && this.settings.fontScale !== 1.0) {
            document.documentElement.style.setProperty('--font-scale-multiplier', this.settings.fontScale);
            
            // Apply to base text size
            const currentSize = this.textSizes[this.settings.textSize] || this.textSizes.md;
            const scaledSize = (parseFloat(currentSize) * this.settings.fontScale) + 'rem';
            document.documentElement.style.setProperty('--text-size-base', scaledSize);
        } else {
            document.documentElement.style.removeProperty('--font-scale-multiplier');
        }
    }
    /**
     * Switch between settings tabs
     */
    switchTab(tabName) {
        // Update tab buttons
        this.element.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update tab content
        this.element.querySelectorAll('.settings-tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.dataset.tab === tabName);
        });
    }
    
    /**
     * Select theme
     */
    selectTheme(theme) {
        // Update UI selection
        this.element.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.theme === theme);
        });
        
        // Update settings and apply preview
        this.settings.theme = theme;
        this.applyTheme();
    }
    
    /**
     * Preview text size changes
     */
    previewTextSize() {
        this.applyTextSize();
    }
    
    /**
     * Select name color
     */
    selectNameColor(color) {
        this.element.querySelectorAll('.name-colors .color-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.color === color);
        });
        
        this.settings.nameColor = color;
        this.updateNamePreview();
    }
    
    /**
     * Update name preview
     */
    updateNamePreview() {
        const preview = this.element.querySelector('#name-preview-text');
        if (preview) {
            preview.style.fontFamily = this.settings.nameFont;
            preview.style.color = this.settings.nameColor;
        }
    }
    
    /**
     * Select nation color
     */
    selectNationColor(color, type) {
        const container = this.element.querySelector(`.nation-color-${type}`);
        container.querySelectorAll('.color-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.color === color);
        });
        
        if (type === 'primary') {
            this.settings.nationColorPrimary = color;
        } else {
            this.settings.nationColorSecondary = color;
        }
        
        this.updateNationPreview();
    }
    
    /**
     * Update nation preview
     */
    updateNationPreview() {
        const preview = this.element.querySelector('.territory-sample');
        if (preview) {
            preview.style.backgroundColor = this.settings.nationColorPrimary;
            preview.style.borderColor = this.settings.nationColorSecondary;
        }
    }
    /**
     * Handle avatar upload
     */
    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select a valid image file', 'error');
            return;
        }
        
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            this.showNotification('Image must be smaller than 2MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataURL = e.target.result;
            this.settings.avatar = dataURL;
            
            const avatarImg = this.element.querySelector('#current-avatar-img');
            if (avatarImg) {
                avatarImg.src = dataURL;
            }
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * Clear avatar
     */
    clearAvatar() {
        this.settings.avatar = null;
        const avatarImg = this.element.querySelector('#current-avatar-img');
        const defaultAvatar = localStorage.getItem('default-avatar');
        if (avatarImg) {
            avatarImg.src = defaultAvatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiMzYjgyZjYiLz48dGV4dCB4PSI2MCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0OCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPvCfkYQ8L3RleHQ+PC9zdmc+';
        }
    }
    
    /**
     * Handle banner upload
     */
    handleBannerUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select a valid image file', 'error');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Image must be smaller than 5MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataURL = e.target.result;
            this.settings.banner = dataURL;
            
            const bannerImg = this.element.querySelector('#current-banner-img');
            if (bannerImg) {
                bannerImg.src = dataURL;
            }
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * Clear banner
     */
    clearBanner() {
        this.settings.banner = null;
        const bannerImg = this.element.querySelector('#current-banner-img');
        const defaultBanner = localStorage.getItem('default-banner');
        if (bannerImg) {
            bannerImg.src = defaultBanner || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDQwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxZjI5MzciLz48dGV4dCB4PSIyMDAiIHk9IjUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5Zb3VyIEVtcGlyZSBCYW5uZXI8L3RleHQ+PC9zdmc+';
        }
    }
    /**
     * Reset all settings to defaults
     */
    resetToDefaults() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            this.settings = this.loadSettings();
            localStorage.removeItem('game-settings');
            this.applySettings();
            this.refreshUI();
            this.showNotification('Settings reset to defaults', 'info');
        }
    }

    /**
     * Refresh UI elements after settings change
     */
    refreshUI() {
        // Re-create the panel content with updated values
        this.element.querySelector('.settings-body').innerHTML = `
            <div class="settings-tabs">
                <button class="settings-tab active" data-tab="appearance">🎨 Appearance</button>
                <button class="settings-tab" data-tab="profile">👤 Profile</button>
                <button class="settings-tab" data-tab="flag">🏳️ Flag</button>
                <button class="settings-tab" data-tab="game">🎮 Game</button>
            </div>
            
            <div class="settings-tab-content">
                ${this.createAppearanceTab()}
                ${this.createProfileTab()}
                ${this.createFlagTab()}
                ${this.createGameTab()}
            </div>
        `;
        
        // Re-bind events for the new content
        this.bindTabEvents();
    }

    /**
     * Bind events for tab content (called after refresh)
     */
    bindTabEvents() {
        // Re-bind all the event listeners for the refreshed content
        this.element.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        // ... (other event bindings would go here)
    }

    /**
     * Show settings panel
     */
    show() {
        this.element.classList.remove('hidden');
        this.isVisible = true;
        document.body.classList.add('settings-open');
    }

    /**
     * Hide settings panel
     */
    hide() {
        this.element.classList.add('hidden');
        this.isVisible = false;
        document.body.classList.remove('settings-open');
    }

    /**
     * Toggle settings panel visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add to notification area or create one
        let notificationArea = document.querySelector('.notification-area');
        if (!notificationArea) {
            notificationArea = document.createElement('div');
            notificationArea.className = 'notification-area';
            document.body.appendChild(notificationArea);
        }

        notificationArea.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * Apply flag settings to the nation
     */
    applyFlagToNation() {
        if (window.Nation && this.settings.flag) {
            window.Nation.flag = this.settings.flag;
            
            // Trigger UI updates for any flag displays
            const event = new CustomEvent('flagUpdated', {
                detail: { flag: this.settings.flag }
            });
            document.dispatchEvent(event);
        }
    }
    
    /**
     * Get flag designer instance (create if needed)
     */
    getFlagDesigner() {
        if (!this.flagDesigner) {
            this.initializeFlagDesigner();
        }
        return this.flagDesigner;
    }
    
    /**
     * Open flag designer directly
     */
    openFlagDesigner() {
        this.show();
        this.switchTab('flag');
        return this.getFlagDesigner();
    }
    
    /**
     * Initialize flag designer in the flag tab
     */
    initializeFlagDesigner() {
        if (this.flagDesigner) return; // Already initialized
        
        const container = this.element.querySelector('#flag-designer-container');
        if (!container) return;
        
        // Create flag designer instance
        this.flagDesigner = new FlagDesigner();
        
        // Load existing flag data if available
        if (this.settings.flag) {
            this.flagDesigner.loadFlagData(this.settings.flag);
        }
        
        // Insert the flag designer into the container
        container.appendChild(this.flagDesigner.element);
    }
    
    /**
     * Save flag data from the designer
     */
    saveFlagData() {
        if (this.flagDesigner) {
            this.settings.flag = this.flagDesigner.getFlagData();
        }
    }
    
    /**
     * Capitalize first letter
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SettingsPanel };
}