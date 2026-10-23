/**
 * Flag Designer Component - Custom Flag Creation System
 * Dominion Wars - Nation Building Strategy Game
 */

class FlagDesigner {
    constructor() {
        this.currentFlag = {
            background: '#ffffff',
            pattern1: null,
            pattern1Color: '#ff0000',
            pattern2: null, 
            pattern2Color: '#0000ff',
            symbol: null,
            symbolColor: '#000000',
            layers: ['background', 'pattern1', 'pattern2', 'symbol'],
            uploadedImage: null
        };
        
        this.patterns = this.initializePatterns();
        this.symbols = this.initializeSymbols();
        this.previewCanvas = null;
        this.previewCtx = null;
        
        this.createElement();
        this.bindEvents();
        this.updatePreview();
    }
    /**
     * Initialize available patterns (50 total)
     */
    initializePatterns() {
        return [
            // Basic stripes and divisions
            { id: 'horizontal-stripes-2', name: 'Horizontal Stripes (2)', category: 'stripes' },
            { id: 'horizontal-stripes-3', name: 'Horizontal Stripes (3)', category: 'stripes' },
            { id: 'horizontal-stripes-4', name: 'Horizontal Stripes (4)', category: 'stripes' },
            { id: 'vertical-stripes-2', name: 'Vertical Stripes (2)', category: 'stripes' },
            { id: 'vertical-stripes-3', name: 'Vertical Stripes (3)', category: 'stripes' },
            { id: 'vertical-stripes-4', name: 'Vertical Stripes (4)', category: 'stripes' },
            { id: 'diagonal-left', name: 'Diagonal Left', category: 'diagonal' },
            { id: 'diagonal-right', name: 'Diagonal Right', category: 'diagonal' },
            { id: 'diagonal-cross', name: 'Diagonal Cross', category: 'diagonal' },
            { id: 'saltire', name: 'Saltire (X)', category: 'crosses' },
            
            // Crosses and religious
            { id: 'cross', name: 'Cross', category: 'crosses' },
            { id: 'nordic-cross', name: 'Nordic Cross', category: 'crosses' },
            { id: 'greek-cross', name: 'Greek Cross', category: 'crosses' },
            { id: 'orthodox-cross', name: 'Orthodox Cross', category: 'crosses' },
            
            // Geometric patterns
            { id: 'chevron-up', name: 'Chevron Up', category: 'geometric' },
            { id: 'chevron-down', name: 'Chevron Down', category: 'geometric' },
            { id: 'triangle-top', name: 'Triangle Top', category: 'geometric' },
            { id: 'triangle-bottom', name: 'Triangle Bottom', category: 'geometric' },
            { id: 'diamond', name: 'Diamond', category: 'geometric' },
            { id: 'circle', name: 'Circle', category: 'geometric' },
            
            // Complex patterns
            { id: 'checkered', name: 'Checkered', category: 'complex' },
            { id: 'zigzag', name: 'Zigzag', category: 'complex' },
            { id: 'wavy-horizontal', name: 'Wavy Horizontal', category: 'complex' },
            { id: 'wavy-vertical', name: 'Wavy Vertical', category: 'complex' },
            { id: 'serrated-edge', name: 'Serrated Edge', category: 'complex' },
            
            // Borders and frames
            { id: 'border-thick', name: 'Thick Border', category: 'borders' },
            { id: 'border-thin', name: 'Thin Border', category: 'borders' },
            { id: 'border-double', name: 'Double Border', category: 'borders' },
            { id: 'corner-triangles', name: 'Corner Triangles', category: 'borders' },
            { id: 'frame-ornate', name: 'Ornate Frame', category: 'borders' },
            
            // Quarters and divisions
            { id: 'quarters', name: 'Quarters', category: 'divisions' },
            { id: 'thirds-horizontal', name: 'Thirds Horizontal', category: 'divisions' },
            { id: 'thirds-vertical', name: 'Thirds Vertical', category: 'divisions' },
            { id: 'canton-top-left', name: 'Canton Top Left', category: 'divisions' },
            { id: 'canton-top-right', name: 'Canton Top Right', category: 'divisions' },
            
            // Artistic patterns
            { id: 'sunburst', name: 'Sunburst', category: 'artistic' },
            { id: 'gradient-horizontal', name: 'Gradient Horizontal', category: 'artistic' },
            { id: 'gradient-vertical', name: 'Gradient Vertical', category: 'artistic' },
            { id: 'gradient-radial', name: 'Gradient Radial', category: 'artistic' },
            { id: 'stars-field', name: 'Stars Field', category: 'artistic' },
            
            // Historical patterns  
            { id: 'heraldic-bend', name: 'Heraldic Bend', category: 'heraldic' },
            { id: 'heraldic-pale', name: 'Heraldic Pale', category: 'heraldic' },
            { id: 'heraldic-fess', name: 'Heraldic Fess', category: 'heraldic' },
            { id: 'heraldic-chief', name: 'Heraldic Chief', category: 'heraldic' },
            { id: 'heraldic-base', name: 'Heraldic Base', category: 'heraldic' },
            
            // Special effects
            { id: 'flame-edge', name: 'Flame Edge', category: 'effects' },
            { id: 'torn-edge', name: 'Torn Edge', category: 'effects' },
            { id: 'dotted-pattern', name: 'Dotted Pattern', category: 'effects' },
            { id: 'crosshatch', name: 'Crosshatch', category: 'effects' },
            { id: 'tribal-pattern', name: 'Tribal Pattern', category: 'effects' }
        ];
    }
    /**
     * Initialize available symbols (100 total)
     */
    initializeSymbols() {
        return [
            // Stars and celestial
            { id: 'star-5', name: '5-Point Star', category: 'celestial' },
            { id: 'star-6', name: '6-Point Star', category: 'celestial' },
            { id: 'star-8', name: '8-Point Star', category: 'celestial' },
            { id: 'crescent', name: 'Crescent Moon', category: 'celestial' },
            { id: 'sun', name: 'Sun', category: 'celestial' },
            { id: 'moon-full', name: 'Full Moon', category: 'celestial' },
            { id: 'comet', name: 'Comet', category: 'celestial' },
            { id: 'constellation', name: 'Constellation', category: 'celestial' },
            
            // Animals
            { id: 'eagle', name: 'Eagle', category: 'animals' },
            { id: 'lion', name: 'Lion', category: 'animals' },
            { id: 'bear', name: 'Bear', category: 'animals' },
            { id: 'wolf', name: 'Wolf', category: 'animals' },
            { id: 'dragon', name: 'Dragon', category: 'animals' },
            { id: 'phoenix', name: 'Phoenix', category: 'animals' },
            { id: 'horse', name: 'Horse', category: 'animals' },
            { id: 'bull', name: 'Bull', category: 'animals' },
            { id: 'snake', name: 'Snake', category: 'animals' },
            { id: 'falcon', name: 'Falcon', category: 'animals' },
            { id: 'ram', name: 'Ram', category: 'animals' },
            { id: 'stag', name: 'Stag', category: 'animals' },
            
            // Weapons and military
            { id: 'sword', name: 'Sword', category: 'military' },
            { id: 'crossed-swords', name: 'Crossed Swords', category: 'military' },
            { id: 'shield', name: 'Shield', category: 'military' },
            { id: 'spear', name: 'Spear', category: 'military' },
            { id: 'bow-arrow', name: 'Bow & Arrow', category: 'military' },
            { id: 'axe', name: 'Axe', category: 'military' },
            { id: 'cannon', name: 'Cannon', category: 'military' },
            { id: 'helmet', name: 'Helmet', category: 'military' },
            { id: 'armor', name: 'Armor', category: 'military' },
            { id: 'banner', name: 'War Banner', category: 'military' },
            
            // Nature and plants
            { id: 'tree', name: 'Tree', category: 'nature' },
            { id: 'oak-leaf', name: 'Oak Leaf', category: 'nature' },
            { id: 'rose', name: 'Rose', category: 'nature' },
            { id: 'lily', name: 'Lily', category: 'nature' },
            { id: 'wheat', name: 'Wheat', category: 'nature' },
            { id: 'vine', name: 'Vine', category: 'nature' },
            { id: 'mountain', name: 'Mountain', category: 'nature' },
            { id: 'wave', name: 'Wave', category: 'nature' },
            { id: 'flame', name: 'Flame', category: 'nature' },
            { id: 'lightning', name: 'Lightning', category: 'nature' },
            
            // Religious and spiritual
            { id: 'cross-simple', name: 'Simple Cross', category: 'religious' },
            { id: 'ankh', name: 'Ankh', category: 'religious' },
            { id: 'crescent-star', name: 'Crescent & Star', category: 'religious' },
            { id: 'om', name: 'Om Symbol', category: 'religious' },
            { id: 'yin-yang', name: 'Yin Yang', category: 'religious' },
            { id: 'star-david', name: 'Star of David', category: 'religious' },
            { id: 'dharma-wheel', name: 'Dharma Wheel', category: 'religious' },
            { id: 'trinity', name: 'Trinity Knot', category: 'religious' },
            
            // Geometric shapes
            { id: 'circle-simple', name: 'Circle', category: 'geometric' },
            { id: 'square', name: 'Square', category: 'geometric' },
            { id: 'triangle-up', name: 'Triangle Up', category: 'geometric' },
            { id: 'diamond-simple', name: 'Diamond', category: 'geometric' },
            { id: 'hexagon', name: 'Hexagon', category: 'geometric' },
            { id: 'octagon', name: 'Octagon', category: 'geometric' },
            { id: 'pentagon', name: 'Pentagon', category: 'geometric' },
            { id: 'spiral', name: 'Spiral', category: 'geometric' },
            
            // Tools and objects
            { id: 'hammer', name: 'Hammer', category: 'tools' },
            { id: 'anvil', name: 'Anvil', category: 'tools' },
            { id: 'key', name: 'Key', category: 'tools' },
            { id: 'scales', name: 'Scales', category: 'tools' },
            { id: 'anchor', name: 'Anchor', category: 'tools' },
            { id: 'wheel', name: 'Wheel', category: 'tools' },
            { id: 'gear', name: 'Gear', category: 'tools' },
            { id: 'crown', name: 'Crown', category: 'tools' },
            { id: 'scepter', name: 'Scepter', category: 'tools' },
            { id: 'orb', name: 'Orb', category: 'tools' },
            
            // Abstract and modern
            { id: 'infinity', name: 'Infinity', category: 'abstract' },
            { id: 'atom', name: 'Atom', category: 'abstract' },
            { id: 'DNA', name: 'DNA Helix', category: 'abstract' },
            { id: 'circuit', name: 'Circuit Pattern', category: 'abstract' },
            { id: 'binary', name: 'Binary Code', category: 'abstract' },
            { id: 'wave-sound', name: 'Sound Wave', category: 'abstract' },
            { id: 'network', name: 'Network Node', category: 'abstract' },
            { id: 'matrix', name: 'Matrix Pattern', category: 'abstract' },
            
            // Cultural symbols
            { id: 'fleur-de-lis', name: 'Fleur-de-lis', category: 'cultural' },
            { id: 'shamrock', name: 'Shamrock', category: 'cultural' },
            { id: 'maple-leaf', name: 'Maple Leaf', category: 'cultural' },
            { id: 'cherry-blossom', name: 'Cherry Blossom', category: 'cultural' },
            { id: 'pagoda', name: 'Pagoda', category: 'cultural' },
            { id: 'pyramid', name: 'Pyramid', category: 'cultural' },
            { id: 'totem', name: 'Totem Pole', category: 'cultural' },
            { id: 'mandala', name: 'Mandala', category: 'cultural' },
            
            // Letters and numbers
            { id: 'letter-a', name: 'Letter A', category: 'text' },
            { id: 'letter-omega', name: 'Omega (Ω)', category: 'text' },
            { id: 'letter-alpha', name: 'Alpha (α)', category: 'text' },
            { id: 'roman-i', name: 'Roman I', category: 'text' },
            { id: 'roman-v', name: 'Roman V', category: 'text' },
            { id: 'roman-x', name: 'Roman X', category: 'text' },
            
            // Mythical and fantasy
            { id: 'unicorn', name: 'Unicorn', category: 'mythical' },
            { id: 'griffin', name: 'Griffin', category: 'mythical' },
            { id: 'kraken', name: 'Kraken', category: 'mythical' },
            { id: 'pegasus', name: 'Pegasus', category: 'mythical' },
            { id: 'hydra', name: 'Hydra', category: 'mythical' },
            { id: 'chimera', name: 'Chimera', category: 'mythical' },
            
            // Heraldic symbols
            { id: 'fleur-heraldic', name: 'Heraldic Fleur', category: 'heraldic' },
            { id: 'lion-rampant', name: 'Lion Rampant', category: 'heraldic' },
            { id: 'eagle-spread', name: 'Eagle Displayed', category: 'heraldic' },
            { id: 'castle', name: 'Castle', category: 'heraldic' },
            { id: 'tower', name: 'Tower', category: 'heraldic' },
            { id: 'bridge', name: 'Bridge', category: 'heraldic' }
        ];
    }
    /**
     * Create flag designer DOM structure
     */
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'flag-designer';
        
        this.element.innerHTML = `
            <div class="flag-designer-content">
                <div class="flag-preview-section">
                    <h3>🏳️ Flag Preview</h3>
                    <div class="flag-preview-container">
                        <canvas id="flag-preview-canvas" width="300" height="200"></canvas>
                        <div class="flag-controls">
                            <button class="btn btn-outline" id="randomize-flag">🎲 Randomize</button>
                            <button class="btn btn-outline" id="clear-flag">🗑️ Clear</button>
                        </div>
                    </div>
                    
                    <div class="flag-upload-section">
                        <h4>📤 Upload Custom Flag</h4>
                        <div class="upload-area" id="flag-upload-area">
                            <input type="file" id="flag-upload" accept="image/*" style="display: none;">
                            <label for="flag-upload" class="upload-label">
                                <div class="upload-icon">📁</div>
                                <div class="upload-text">Click to upload or drag image here</div>
                                <div class="upload-hint">(JPG, PNG, SVG - Max 2MB)</div>
                            </label>
                        </div>
                        <button class="btn btn-secondary" id="clear-uploaded-flag" style="display: none;">Remove Uploaded Flag</button>
                    </div>
                </div>
                
                <div class="flag-editor-section">
                    <div class="editor-tabs">
                        <button class="editor-tab active" data-tab="layers">🎭 Layers</button>
                        <button class="editor-tab" data-tab="patterns">🎨 Patterns</button>
                        <button class="editor-tab" data-tab="symbols">⭐ Symbols</button>
                        <button class="editor-tab" data-tab="colors">🌈 Colors</button>
                    </div>
                    
                    <div class="editor-content">
                        ${this.createLayersTab()}
                        ${this.createPatternsTab()}
                        ${this.createSymbolsTab()}
                        ${this.createColorsTab()}
                    </div>
                </div>
            </div>
        `;
        
        this.setupCanvas();
    }
    /**
     * Create layers tab content
     */
    createLayersTab() {
        return `
            <div class="editor-tab-pane active" data-tab="layers">
                <h4>🎭 Layer Management</h4>
                <p class="tab-description">Reorder layers by dragging. Higher layers appear on top.</p>
                
                <div class="layer-list" id="layer-list">
                    <div class="layer-item" data-layer="symbol" draggable="true">
                        <div class="layer-handle">⋮⋮</div>
                        <div class="layer-info">
                            <span class="layer-name">Symbol</span>
                            <span class="layer-status" id="symbol-status">None</span>
                        </div>
                        <div class="layer-controls">
                            <button class="layer-toggle" data-layer="symbol" title="Toggle visibility">👁️</button>
                        </div>
                    </div>
                    
                    <div class="layer-item" data-layer="pattern2" draggable="true">
                        <div class="layer-handle">⋮⋮</div>
                        <div class="layer-info">
                            <span class="layer-name">Pattern 2</span>
                            <span class="layer-status" id="pattern2-status">None</span>
                        </div>
                        <div class="layer-controls">
                            <button class="layer-toggle" data-layer="pattern2" title="Toggle visibility">👁️</button>
                        </div>
                    </div>
                    
                    <div class="layer-item" data-layer="pattern1" draggable="true">
                        <div class="layer-handle">⋮⋮</div>
                        <div class="layer-info">
                            <span class="layer-name">Pattern 1</span>
                            <span class="layer-status" id="pattern1-status">None</span>
                        </div>
                        <div class="layer-controls">
                            <button class="layer-toggle" data-layer="pattern1" title="Toggle visibility">👁️</button>
                        </div>
                    </div>
                    
                    <div class="layer-item background-layer" data-layer="background">
                        <div class="layer-handle">⋮⋮</div>
                        <div class="layer-info">
                            <span class="layer-name">Background</span>
                            <span class="layer-status" id="background-status">Solid Color</span>
                        </div>
                        <div class="layer-controls">
                            <span class="layer-lock">🔒</span>
                        </div>
                    </div>
                </div>
                
                <div class="layer-help">
                    <h5>💡 Layer Tips</h5>
                    <ul>
                        <li>Drag layers to reorder them</li>
                        <li>Click the eye icon to toggle visibility</li>
                        <li>Background is always at the bottom</li>
                        <li>Use up to 2 patterns and 1 symbol</li>
                    </ul>
                </div>
            </div>
        `;
    }
    /**
     * Create patterns tab content
     */
    createPatternsTab() {
        const categories = [...new Set(this.patterns.map(p => p.category))];
        
        return `
            <div class="editor-tab-pane" data-tab="patterns">
                <h4>🎨 Pattern Selection</h4>
                <p class="tab-description">Choose up to 2 patterns to layer on your flag</p>
                
                <div class="pattern-controls">
                    <div class="pattern-slot-selector">
                        <label>Apply to:</label>
                        <select id="pattern-slot-select">
                            <option value="pattern1">Pattern Layer 1</option>
                            <option value="pattern2">Pattern Layer 2</option>
                        </select>
                    </div>
                    
                    <div class="pattern-category-filter">
                        <label>Category:</label>
                        <select id="pattern-category-filter">
                            <option value="all">All Categories</option>
                            ${categories.map(cat => `
                                <option value="${cat}">${this.capitalizeFirst(cat)}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="pattern-grid" id="pattern-grid">
                    ${this.patterns.map(pattern => `
                        <div class="pattern-item" data-pattern="${pattern.id}" data-category="${pattern.category}">
                            <div class="pattern-preview">
                                <canvas class="pattern-canvas" width="60" height="40" data-pattern="${pattern.id}"></canvas>
                            </div>
                            <div class="pattern-name">${pattern.name}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="current-patterns">
                    <h5>Current Patterns:</h5>
                    <div class="current-pattern-list">
                        <div class="current-pattern" id="current-pattern1">
                            <strong>Pattern 1:</strong> <span id="pattern1-name">None</span>
                            <button class="btn-small btn-danger" onclick="flagDesigner.clearPattern('pattern1')">Remove</button>
                        </div>
                        <div class="current-pattern" id="current-pattern2">
                            <strong>Pattern 2:</strong> <span id="pattern2-name">None</span>
                            <button class="btn-small btn-danger" onclick="flagDesigner.clearPattern('pattern2')">Remove</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    /**
     * Create symbols tab content
     */
    createSymbolsTab() {
        const categories = [...new Set(this.symbols.map(s => s.category))];
        
        return `
            <div class="editor-tab-pane" data-tab="symbols">
                <h4>⭐ Symbol Selection</h4>
                <p class="tab-description">Choose one symbol to represent your nation</p>
                
                <div class="symbol-controls">
                    <div class="symbol-category-filter">
                        <label>Category:</label>
                        <select id="symbol-category-filter">
                            <option value="all">All Categories</option>
                            ${categories.map(cat => `
                                <option value="${cat}">${this.capitalizeFirst(cat)}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="symbol-size-control">
                        <label>Size:</label>
                        <input type="range" id="symbol-size" min="0.3" max="1.5" step="0.1" value="0.8">
                        <span id="symbol-size-display">80%</span>
                    </div>
                </div>
                
                <div class="symbol-grid" id="symbol-grid">
                    ${this.symbols.map(symbol => `
                        <div class="symbol-item" data-symbol="${symbol.id}" data-category="${symbol.category}">
                            <div class="symbol-preview">
                                <canvas class="symbol-canvas" width="50" height="50" data-symbol="${symbol.id}"></canvas>
                            </div>
                            <div class="symbol-name">${symbol.name}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="current-symbol">
                    <h5>Current Symbol:</h5>
                    <div class="current-symbol-display">
                        <strong>Symbol:</strong> <span id="current-symbol-name">None</span>
                        <button class="btn-small btn-danger" onclick="flagDesigner.clearSymbol()">Remove</button>
                    </div>
                </div>
            </div>
        `;
    }
    /**
     * Create colors tab content
     */
    createColorsTab() {
        const commonColors = [
            '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
            '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#c0c0c0', '#808080',
            '#ffa500', '#a52a2a', '#daa520', '#006400', '#4b0082', '#dc143c', '#00ced1', '#ff1493',
            '#228b22', '#ff69b4', '#cd5c5c', '#4169e1', '#32cd32', '#dda0dd', '#87ceeb', '#98fb98'
        ];
        
        return `
            <div class="editor-tab-pane" data-tab="colors">
                <h4>🌈 Color Customization</h4>
                <p class="tab-description">Customize colors for each layer of your flag</p>
                
                <div class="color-sections">
                    <div class="color-section">
                        <h5>🎨 Background Color</h5>
                        <div class="color-controls">
                            <input type="color" id="background-color" value="${this.currentFlag.background}">
                            <div class="color-presets">
                                ${commonColors.map(color => `
                                    <div class="color-preset" style="background-color: ${color}" data-color="${color}" data-target="background"></div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="color-section">
                        <h5>🎨 Pattern 1 Color</h5>
                        <div class="color-controls">
                            <input type="color" id="pattern1-color" value="${this.currentFlag.pattern1Color}">
                            <div class="color-presets">
                                ${commonColors.map(color => `
                                    <div class="color-preset" style="background-color: ${color}" data-color="${color}" data-target="pattern1"></div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="color-section">
                        <h5>🎨 Pattern 2 Color</h5>
                        <div class="color-controls">
                            <input type="color" id="pattern2-color" value="${this.currentFlag.pattern2Color}">
                            <div class="color-presets">
                                ${commonColors.map(color => `
                                    <div class="color-preset" style="background-color: ${color}" data-color="${color}" data-target="pattern2"></div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="color-section">
                        <h5>🎨 Symbol Color</h5>
                        <div class="color-controls">
                            <input type="color" id="symbol-color" value="${this.currentFlag.symbolColor}">
                            <div class="color-presets">
                                ${commonColors.map(color => `
                                    <div class="color-preset" style="background-color: ${color}" data-color="${color}" data-target="symbol"></div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="color-tools">
                    <h5>🛠️ Color Tools</h5>
                    <div class="color-tool-buttons">
                        <button class="btn btn-outline" onclick="flagDesigner.generateRandomColors()">🎲 Random Colors</button>
                        <button class="btn btn-outline" onclick="flagDesigner.generateHarmoniousColors()">🎨 Harmonious Palette</button>
                        <button class="btn btn-outline" onclick="flagDesigner.resetColors()">↩️ Reset Colors</button>
                    </div>
                </div>
            </div>
        `;
    }
    /**
     * Setup canvas for flag preview
     */
    setupCanvas() {
        this.previewCanvas = this.element.querySelector('#flag-preview-canvas');
        this.previewCtx = this.previewCanvas.getContext('2d');
        
        // Setup pattern preview canvases
        this.setupPatternPreviews();
        this.setupSymbolPreviews();
    }
    
    /**
     * Setup pattern preview canvases
     */
    setupPatternPreviews() {
        const patternCanvases = this.element.querySelectorAll('.pattern-canvas');
        patternCanvases.forEach(canvas => {
            const patternId = canvas.dataset.pattern;
            const ctx = canvas.getContext('2d');
            this.drawPatternPreview(ctx, patternId, 60, 40);
        });
    }
    
    /**
     * Setup symbol preview canvases
     */
    setupSymbolPreviews() {
        const symbolCanvases = this.element.querySelectorAll('.symbol-canvas');
        symbolCanvases.forEach(canvas => {
            const symbolId = canvas.dataset.symbol;
            const ctx = canvas.getContext('2d');
            this.drawSymbolPreview(ctx, symbolId, 50, 50);
        });
    }
    
    /**
     * Bind event handlers
     */
    bindEvents() {
        // Tab switching
        this.element.addEventListener('click', (e) => {
            if (e.target.classList.contains('editor-tab')) {
                this.switchTab(e.target.dataset.tab);
            }
        });
        
        // Pattern selection
        this.element.addEventListener('click', (e) => {
            if (e.target.closest('.pattern-item')) {
                const patternId = e.target.closest('.pattern-item').dataset.pattern;
                const slot = this.element.querySelector('#pattern-slot-select').value;
                this.selectPattern(patternId, slot);
            }
        });
        
        // Symbol selection
        this.element.addEventListener('click', (e) => {
            if (e.target.closest('.symbol-item')) {
                const symbolId = e.target.closest('.symbol-item').dataset.symbol;
                this.selectSymbol(symbolId);
            }
        });
        
        // Color changes
        this.element.addEventListener('input', (e) => {
            if (e.target.type === 'color') {
                const colorType = e.target.id.replace('-color', '');
                this.updateColor(colorType, e.target.value);
            }
            
            if (e.target.id === 'symbol-size') {
                this.currentFlag.symbolSize = parseFloat(e.target.value);
                this.element.querySelector('#symbol-size-display').textContent = Math.round(e.target.value * 100) + '%';
                this.updatePreview();
            }
        });
        
        // Color presets
        this.element.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-preset')) {
                const color = e.target.dataset.color;
                const target = e.target.dataset.target;
                this.updateColor(target, color);
                this.element.querySelector(`#${target}-color`).value = color;
            }
        });
        
        // Category filters
        this.element.addEventListener('change', (e) => {
            if (e.target.id === 'pattern-category-filter') {
                this.filterPatterns(e.target.value);
            }
            if (e.target.id === 'symbol-category-filter') {
                this.filterSymbols(e.target.value);
            }
        });
        
        // File upload
        this.element.addEventListener('change', (e) => {
            if (e.target.id === 'flag-upload') {
                this.handleFlagUpload(e.target.files[0]);
            }
        });
        
        // Drag and drop for layers
        this.setupLayerDragDrop();
        
        // Control buttons
        this.element.addEventListener('click', (e) => {
            if (e.target.id === 'randomize-flag') {
                this.randomizeFlag();
            }
            if (e.target.id === 'clear-flag') {
                this.clearFlag();
            }
            if (e.target.id === 'clear-uploaded-flag') {
                this.clearUploadedFlag();
            }
        });
    }
    /**
     * Switch between editor tabs
     */
    switchTab(tabName) {
        // Update tab buttons
        this.element.querySelectorAll('.editor-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        this.element.querySelector(`.editor-tab[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        this.element.querySelectorAll('.editor-tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        this.element.querySelector(`.editor-tab-pane[data-tab="${tabName}"]`).classList.add('active');
    }
    
    /**
     * Select a pattern for a specific slot
     */
    selectPattern(patternId, slot) {
        const pattern = this.patterns.find(p => p.id === patternId);
        if (!pattern) return;
        
        this.currentFlag[slot] = patternId;
        this.element.querySelector(`#${slot}-name`).textContent = pattern.name;
        this.element.querySelector(`#${slot}-status`).textContent = pattern.name;
        this.updatePreview();
    }
    
    /**
     * Select a symbol
     */
    selectSymbol(symbolId) {
        const symbol = this.symbols.find(s => s.id === symbolId);
        if (!symbol) return;
        
        this.currentFlag.symbol = symbolId;
        this.element.querySelector('#current-symbol-name').textContent = symbol.name;
        this.element.querySelector('#symbol-status').textContent = symbol.name;
        this.updatePreview();
    }
    
    /**
     * Update color for a layer
     */
    updateColor(layer, color) {
        if (layer === 'background') {
            this.currentFlag.background = color;
        } else if (layer === 'pattern1') {
            this.currentFlag.pattern1Color = color;
        } else if (layer === 'pattern2') {
            this.currentFlag.pattern2Color = color;
        } else if (layer === 'symbol') {
            this.currentFlag.symbolColor = color;
        }
        this.updatePreview();
    }
    
    /**
     * Clear a pattern
     */
    clearPattern(slot) {
        this.currentFlag[slot] = null;
        this.element.querySelector(`#${slot}-name`).textContent = 'None';
        this.element.querySelector(`#${slot}-status`).textContent = 'None';
        this.updatePreview();
    }
    
    /**
     * Clear symbol
     */
    clearSymbol() {
        this.currentFlag.symbol = null;
        this.element.querySelector('#current-symbol-name').textContent = 'None';
        this.element.querySelector('#symbol-status').textContent = 'None';
        this.updatePreview();
    }
    
    /**
     * Filter patterns by category
     */
    filterPatterns(category) {
        const patterns = this.element.querySelectorAll('.pattern-item');
        patterns.forEach(pattern => {
            if (category === 'all' || pattern.dataset.category === category) {
                pattern.style.display = 'block';
            } else {
                pattern.style.display = 'none';
            }
        });
    }
    
    /**
     * Filter symbols by category  
     */
    filterSymbols(category) {
        const symbols = this.element.querySelectorAll('.symbol-item');
        symbols.forEach(symbol => {
            if (category === 'all' || symbol.dataset.category === category) {
                symbol.style.display = 'block';
            } else {
                symbol.style.display = 'none';
            }
        });
    }
    /**
     * Update the flag preview
     */
    updatePreview() {
        if (!this.previewCtx) return;
        
        const canvas = this.previewCanvas;
        const ctx = this.previewCtx;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // If uploaded image, show that instead
        if (this.currentFlag.uploadedImage) {
            ctx.drawImage(this.currentFlag.uploadedImage, 0, 0, canvas.width, canvas.height);
            return;
        }
        
        // Draw layers in order
        this.currentFlag.layers.forEach(layer => {
            if (layer === 'background') {
                this.drawBackground(ctx, canvas.width, canvas.height);
            } else if (layer === 'pattern1' && this.currentFlag.pattern1) {
                this.drawPattern(ctx, this.currentFlag.pattern1, this.currentFlag.pattern1Color, canvas.width, canvas.height);
            } else if (layer === 'pattern2' && this.currentFlag.pattern2) {
                this.drawPattern(ctx, this.currentFlag.pattern2, this.currentFlag.pattern2Color, canvas.width, canvas.height);
            } else if (layer === 'symbol' && this.currentFlag.symbol) {
                this.drawSymbol(ctx, this.currentFlag.symbol, this.currentFlag.symbolColor, canvas.width, canvas.height);
            }
        });
    }
    
    /**
     * Draw background
     */
    drawBackground(ctx, width, height) {
        ctx.fillStyle = this.currentFlag.background;
        ctx.fillRect(0, 0, width, height);
    }
    
    /**
     * Draw pattern
     */
    drawPattern(ctx, patternId, color, width, height) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        
        switch(patternId) {
            // Basic stripes and divisions
            case 'horizontal-stripes-2':
                ctx.fillRect(0, 0, width, height/2);
                break;
            case 'horizontal-stripes-3':
                ctx.fillRect(0, 0, width, height/3);
                ctx.fillRect(0, height*2/3, width, height/3);
                break;
            case 'horizontal-stripes-4':
                ctx.fillRect(0, 0, width, height/4);
                ctx.fillRect(0, height/2, width, height/4);
                break;
            case 'vertical-stripes-2':
                ctx.fillRect(0, 0, width/2, height);
                break;
            case 'vertical-stripes-3':
                ctx.fillRect(0, 0, width/3, height);
                ctx.fillRect(width*2/3, 0, width/3, height);
                break;
            case 'vertical-stripes-4':
                ctx.fillRect(0, 0, width/4, height);
                ctx.fillRect(width/2, 0, width/4, height);
                break;
                
            // Diagonal patterns
            case 'diagonal-left':
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();
                ctx.fill();
                break;
            case 'diagonal-right':
                ctx.beginPath();
                ctx.moveTo(width, 0);
                ctx.lineTo(0, height);
                ctx.lineTo(width, height);
                ctx.closePath();
                ctx.fill();
                break;
            case 'diagonal-cross':
                ctx.lineWidth = Math.min(width, height) / 10;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(width, height);
                ctx.moveTo(width, 0);
                ctx.lineTo(0, height);
                ctx.stroke();
                break;
                
            // Crosses and religious
            case 'cross':
                const crossWidth = Math.min(width, height) / 8;
                ctx.fillRect(width/2 - crossWidth/2, 0, crossWidth, height);
                ctx.fillRect(0, height/2 - crossWidth/2, width, crossWidth);
                break;
            case 'saltire':
                ctx.lineWidth = Math.min(width, height) / 8;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(width, height);
                ctx.moveTo(width, 0);
                ctx.lineTo(0, height);
                ctx.stroke();
                break;
            case 'nordic-cross':
                const nordicWidth = Math.min(width, height) / 6;
                ctx.fillRect(width/3 - nordicWidth/2, 0, nordicWidth, height);
                ctx.fillRect(0, height/2 - nordicWidth/2, width, nordicWidth);
                break;
            case 'greek-cross':
                const armLength = Math.min(width, height) / 3;
                const armWidth = armLength / 2;
                const centerX = width / 2;
                const centerY = height / 2;
                // Horizontal arm
                ctx.fillRect(centerX - armLength, centerY - armWidth/2, armLength*2, armWidth);
                // Vertical arm
                ctx.fillRect(centerX - armWidth/2, centerY - armLength, armWidth, armLength*2);
                break;
            case 'orthodox-cross':
                const orthoWidth = Math.min(width, height) / 12;
                // Main vertical bar
                ctx.fillRect(width/2 - orthoWidth/2, height/6, orthoWidth, height*2/3);
                // Top horizontal bar
                ctx.fillRect(width/3, height/4, width/3, orthoWidth);
                // Middle horizontal bar
                ctx.fillRect(width/4, height/2, width/2, orthoWidth);
                // Bottom slanted bar
                ctx.save();
                ctx.translate(width/2, height*3/4);
                ctx.rotate(Math.PI / 12);
                ctx.fillRect(-width/6, -orthoWidth/2, width/3, orthoWidth);
                ctx.restore();
                break;
                
            // Geometric patterns
            case 'chevron-up':
                ctx.beginPath();
                ctx.moveTo(width/2, height/4);
                ctx.lineTo(width*3/4, height/2);
                ctx.lineTo(width/2, height/3);
                ctx.lineTo(width/4, height/2);
                ctx.closePath();
                ctx.fill();
                break;
            case 'chevron-down':
                ctx.beginPath();
                ctx.moveTo(width/4, height/2);
                ctx.lineTo(width/2, height*3/4);
                ctx.lineTo(width*3/4, height/2);
                ctx.lineTo(width/2, height*2/3);
                ctx.closePath();
                ctx.fill();
                break;
            case 'triangle-top':
                ctx.beginPath();
                ctx.moveTo(width/2, height/4);
                ctx.lineTo(width/4, height*3/4);
                ctx.lineTo(width*3/4, height*3/4);
                ctx.closePath();
                ctx.fill();
                break;
            case 'triangle-bottom':
                ctx.beginPath();
                ctx.moveTo(width/4, height/4);
                ctx.lineTo(width*3/4, height/4);
                ctx.lineTo(width/2, height*3/4);
                ctx.closePath();
                ctx.fill();
                break;
            case 'diamond':
                ctx.beginPath();
                ctx.moveTo(width/2, height/6);
                ctx.lineTo(width*5/6, height/2);
                ctx.lineTo(width/2, height*5/6);
                ctx.lineTo(width/6, height/2);
                ctx.closePath();
                ctx.fill();
                break;
            case 'circle':
                ctx.beginPath();
                ctx.arc(width/2, height/2, Math.min(width, height)/3, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            // Complex patterns
            case 'checkered':
                const squareSize = Math.min(width, height) / 8;
                for (let x = 0; x < width; x += squareSize) {
                    for (let y = 0; y < height; y += squareSize) {
                        if ((Math.floor(x/squareSize) + Math.floor(y/squareSize)) % 2 === 0) {
                            ctx.fillRect(x, y, squareSize, squareSize);
                        }
                    }
                }
                break;
            case 'zigzag':
                ctx.beginPath();
                const zigzagHeight = height / 4;
                const zigzagWidth = width / 8;
                ctx.moveTo(0, height/2);
                for (let x = 0; x < width; x += zigzagWidth) {
                    ctx.lineTo(x + zigzagWidth/2, height/2 + (x % (zigzagWidth*2) === 0 ? -zigzagHeight : zigzagHeight));
                }
                ctx.lineTo(width, height/2);
                ctx.lineWidth = Math.min(width, height) / 20;
                ctx.stroke();
                break;
            case 'wavy-horizontal':
                ctx.beginPath();
                const waveHeight = height / 6;
                ctx.moveTo(0, height/2);
                for (let x = 0; x <= width; x += 10) {
                    const y = height/2 + Math.sin(x * Math.PI / (width/4)) * waveHeight;
                    ctx.lineTo(x, y);
                }
                ctx.lineWidth = Math.min(width, height) / 15;
                ctx.stroke();
                break;
            case 'wavy-vertical':
                ctx.beginPath();
                const waveWidth = width / 6;
                ctx.moveTo(width/2, 0);
                for (let y = 0; y <= height; y += 10) {
                    const x = width/2 + Math.sin(y * Math.PI / (height/4)) * waveWidth;
                    ctx.lineTo(x, y);
                }
                ctx.lineWidth = Math.min(width, height) / 15;
                ctx.stroke();
                break;
            case 'serrated-edge':
                ctx.beginPath();
                const serrateSize = width / 10;
                ctx.moveTo(0, height/2);
                for (let x = 0; x < width; x += serrateSize) {
                    ctx.lineTo(x + serrateSize/2, height/2 - height/8);
                    ctx.lineTo(x + serrateSize, height/2);
                }
                ctx.lineTo(width, height/2);
                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();
                ctx.fill();
                break;
                
            // Borders and frames
            case 'border-thick':
                const thickBorder = Math.min(width, height) / 8;
                ctx.strokeRect(thickBorder/2, thickBorder/2, width - thickBorder, height - thickBorder);
                ctx.lineWidth = thickBorder;
                ctx.stroke();
                break;
            case 'border-thin':
                const thinBorder = Math.min(width, height) / 20;
                ctx.strokeRect(thinBorder/2, thinBorder/2, width - thinBorder, height - thinBorder);
                ctx.lineWidth = thinBorder;
                ctx.stroke();
                break;
            case 'border-double':
                const outerBorder = Math.min(width, height) / 12;
                const innerBorder = outerBorder / 3;
                ctx.lineWidth = innerBorder;
                ctx.strokeRect(outerBorder, outerBorder, width - outerBorder*2, height - outerBorder*2);
                ctx.strokeRect(innerBorder/2, innerBorder/2, width - innerBorder, height - innerBorder);
                break;
            case 'corner-triangles':
                const cornerSize = Math.min(width, height) / 4;
                // Top-left
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(cornerSize, 0);
                ctx.lineTo(0, cornerSize);
                ctx.closePath();
                ctx.fill();
                // Top-right
                ctx.beginPath();
                ctx.moveTo(width, 0);
                ctx.lineTo(width - cornerSize, 0);
                ctx.lineTo(width, cornerSize);
                ctx.closePath();
                ctx.fill();
                // Bottom-left
                ctx.beginPath();
                ctx.moveTo(0, height);
                ctx.lineTo(0, height - cornerSize);
                ctx.lineTo(cornerSize, height);
                ctx.closePath();
                ctx.fill();
                // Bottom-right
                ctx.beginPath();
                ctx.moveTo(width, height);
                ctx.lineTo(width, height - cornerSize);
                ctx.lineTo(width - cornerSize, height);
                ctx.closePath();
                ctx.fill();
                break;
            case 'frame-ornate':
                const frameWidth = Math.min(width, height) / 6;
                // Outer frame
                ctx.fillRect(0, 0, width, frameWidth);
                ctx.fillRect(0, height - frameWidth, width, frameWidth);
                ctx.fillRect(0, 0, frameWidth, height);
                ctx.fillRect(width - frameWidth, 0, frameWidth, height);
                // Inner decorative elements
                ctx.save();
                ctx.globalAlpha = 0.5;
                const ornateSize = frameWidth / 3;
                for (let i = frameWidth; i < width - frameWidth; i += ornateSize*2) {
                    ctx.fillRect(i, frameWidth/3, ornateSize, ornateSize);
                    ctx.fillRect(i, height - frameWidth*2/3 - ornateSize, ornateSize, ornateSize);
                }
                ctx.restore();
                break;
                
            // Quarters and divisions
            case 'quarters':
                ctx.fillRect(0, 0, width/2, height/2);
                ctx.fillRect(width/2, height/2, width/2, height/2);
                break;
            case 'thirds-horizontal':
                ctx.fillRect(0, 0, width, height/3);
                ctx.fillRect(0, height*2/3, width, height/3);
                break;
            case 'thirds-vertical':
                ctx.fillRect(0, 0, width/3, height);
                ctx.fillRect(width*2/3, 0, width/3, height);
                break;
            case 'canton-top-left':
                ctx.fillRect(0, 0, width/3, height/2);
                break;
            case 'canton-top-right':
                ctx.fillRect(width*2/3, 0, width/3, height/2);
                break;
                
            // Artistic patterns
            case 'sunburst':
                const rays = 12;
                const rayLength = Math.min(width, height) / 3;
                ctx.save();
                ctx.translate(width/2, height/2);
                for (let i = 0; i < rays; i++) {
                    ctx.rotate(Math.PI * 2 / rays);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, -rayLength);
                    ctx.lineWidth = rayLength / 8;
                    ctx.stroke();
                }
                ctx.restore();
                break;
            case 'gradient-horizontal':
                const gradientH = ctx.createLinearGradient(0, 0, width, 0);
                gradientH.addColorStop(0, color);
                gradientH.addColorStop(1, 'transparent');
                ctx.fillStyle = gradientH;
                ctx.fillRect(0, 0, width, height);
                break;
            case 'gradient-vertical':
                const gradientV = ctx.createLinearGradient(0, 0, 0, height);
                gradientV.addColorStop(0, color);
                gradientV.addColorStop(1, 'transparent');
                ctx.fillStyle = gradientV;
                ctx.fillRect(0, 0, width, height);
                break;
            case 'gradient-radial':
                const gradientR = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.min(width, height)/2);
                gradientR.addColorStop(0, color);
                gradientR.addColorStop(1, 'transparent');
                ctx.fillStyle = gradientR;
                ctx.fillRect(0, 0, width, height);
                break;
            case 'stars-field':
                const starCount = 20;
                for (let i = 0; i < starCount; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const size = Math.random() * 3 + 2;
                    this.drawStar(ctx, x, y, 5, size, size/2);
                }
                break;
                
            // Heraldic patterns
            case 'heraldic-bend':
                ctx.beginPath();
                ctx.moveTo(0, height);
                ctx.lineTo(width, 0);
                ctx.lineTo(width, height/4);
                ctx.lineTo(width/4, height);
                ctx.closePath();
                ctx.fill();
                break;
            case 'heraldic-pale':
                ctx.fillRect(width/3, 0, width/3, height);
                break;
            case 'heraldic-fess':
                ctx.fillRect(0, height/3, width, height/3);
                break;
            case 'heraldic-chief':
                ctx.fillRect(0, 0, width, height/3);
                break;
            case 'heraldic-base':
                ctx.fillRect(0, height*2/3, width, height/3);
                break;
                
            // Special effects
            case 'flame-edge':
                ctx.beginPath();
                ctx.moveTo(0, height/2);
                for (let x = 0; x < width; x += 10) {
                    const flameHeight = Math.random() * height/4 + height/8;
                    ctx.lineTo(x, height/2 - flameHeight);
                }
                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();
                ctx.fill();
                break;
            case 'torn-edge':
                ctx.beginPath();
                ctx.moveTo(0, height/3);
                for (let x = 0; x < width; x += 15) {
                    const tearHeight = Math.random() * height/6 + height/6;
                    ctx.lineTo(x + Math.random() * 10 - 5, height/3 + tearHeight);
                }
                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();
                ctx.fill();
                break;
            case 'dotted-pattern':
                const dotSize = Math.min(width, height) / 30;
                const spacing = dotSize * 3;
                for (let x = spacing; x < width; x += spacing) {
                    for (let y = spacing; y < height; y += spacing) {
                        ctx.beginPath();
                        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                break;
            case 'crosshatch':
                ctx.lineWidth = 2;
                const hatchSpacing = Math.min(width, height) / 15;
                // Diagonal lines
                for (let i = 0; i < width + height; i += hatchSpacing) {
                    ctx.beginPath();
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i - height, height);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(width - i, 0);
                    ctx.lineTo(width - i + height, height);
                    ctx.stroke();
                }
                break;
            case 'tribal-pattern':
                // Simple tribal-inspired pattern
                ctx.lineWidth = Math.min(width, height) / 20;
                ctx.beginPath();
                // Zigzag with circles
                for (let x = 0; x < width; x += width/6) {
                    ctx.moveTo(x, height/4);
                    ctx.lineTo(x + width/12, height/2);
                    ctx.lineTo(x + width/6, height/4);
                    ctx.arc(x + width/12, height/2, width/24, 0, Math.PI * 2);
                }
                ctx.stroke();
                break;
                
            default:
                // Simple rectangle as fallback
                ctx.fillRect(width/4, height/4, width/2, height/2);
        }
    }
    
    /**
     * Draw symbol
     */
    drawSymbol(ctx, symbolId, color, width, height) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        
        const centerX = width / 2;
        const centerY = height / 2;
        const size = (this.currentFlag.symbolSize || 0.8) * Math.min(width, height) / 4;
        
        switch(symbolId) {
            // Celestial symbols
            case 'star-5':
                this.drawStar(ctx, centerX, centerY, 5, size, size/2);
                break;
            case 'star-6':
                this.drawStar(ctx, centerX, centerY, 6, size, size/2);
                break;
            case 'star-8':
                this.drawStar(ctx, centerX, centerY, 8, size, size/2);
                break;
            case 'crescent':
                ctx.beginPath();
                ctx.arc(centerX - size/3, centerY, size, 0, Math.PI * 2);
                ctx.arc(centerX + size/6, centerY, size*0.8, 0, Math.PI * 2);
                ctx.fill('evenodd');
                break;
            case 'sun':
                // Central circle
                ctx.beginPath();
                ctx.arc(centerX, centerY, size/2, 0, Math.PI * 2);
                ctx.fill();
                // Rays
                ctx.save();
                ctx.translate(centerX, centerY);
                for (let i = 0; i < 12; i++) {
                    ctx.rotate(Math.PI / 6);
                    ctx.beginPath();
                    ctx.moveTo(0, -size/2);
                    ctx.lineTo(0, -size);
                    ctx.lineWidth = size/8;
                    ctx.stroke();
                }
                ctx.restore();
                break;
            case 'moon-full':
                ctx.beginPath();
                ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'comet':
                // Comet head
                ctx.beginPath();
                ctx.arc(centerX - size/2, centerY - size/2, size/3, 0, Math.PI * 2);
                ctx.fill();
                // Tail
                ctx.beginPath();
                ctx.moveTo(centerX - size/6, centerY - size/6);
                ctx.quadraticCurveTo(centerX + size/2, centerY, centerX + size, centerY + size/2);
                ctx.lineWidth = size/6;
                ctx.stroke();
                break;
            case 'constellation':
                // Draw several small stars
                const stars = [
                    {x: centerX - size/2, y: centerY - size/2},
                    {x: centerX, y: centerY - size},
                    {x: centerX + size/2, y: centerY - size/3},
                    {x: centerX - size/3, y: centerY + size/2},
                    {x: centerX + size/3, y: centerY + size/3}
                ];
                stars.forEach(star => {
                    this.drawStar(ctx, star.x, star.y, 5, size/6, size/12);
                });
                break;
                
            // Animals
            case 'eagle':
                // Simplified eagle silhouette
                ctx.beginPath();
                // Body
                ctx.ellipse(centerX, centerY + size/3, size/3, size/2, 0, 0, Math.PI * 2);
                // Wings
                ctx.ellipse(centerX - size/2, centerY, size/2, size/4, -Math.PI/6, 0, Math.PI * 2);
                ctx.ellipse(centerX + size/2, centerY, size/2, size/4, Math.PI/6, 0, Math.PI * 2);
                // Head
                ctx.ellipse(centerX, centerY - size/2, size/4, size/3, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'lion':
                // Simplified lion head
                ctx.beginPath();
                // Main head circle
                ctx.arc(centerX, centerY, size/2, 0, Math.PI * 2);
                // Mane
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI * 2) / 8;
                    const x = centerX + Math.cos(angle) * size/3;
                    const y = centerY + Math.sin(angle) * size/3;
                    ctx.moveTo(x, y);
                    ctx.arc(x, y, size/6, 0, Math.PI * 2);
                }
                ctx.fill();
                break;
            case 'bear':
                // Simplified bear silhouette
                ctx.beginPath();
                // Body (oval)
                ctx.ellipse(centerX, centerY + size/4, size/2, size/3, 0, 0, Math.PI * 2);
                // Head
                ctx.arc(centerX, centerY - size/3, size/3, 0, Math.PI * 2);
                // Ears
                ctx.arc(centerX - size/4, centerY - size/2, size/8, 0, Math.PI * 2);
                ctx.arc(centerX + size/4, centerY - size/2, size/8, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            default:
                // Simple circle as fallback
                ctx.beginPath();
                ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
                ctx.fill();
        }
    }
    
    /**
     * Draw a star symbol
     */
    drawStar(ctx, cx, cy, points, outerRadius, innerRadius) {
        let angle = -Math.PI / 2;
        const angleStep = Math.PI / points;
        
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            angle += angleStep;
        }
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * Draw pattern preview
     */
    drawPatternPreview(ctx, patternId, width, height) {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Background
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);
        
        // Pattern
        ctx.fillStyle = '#333333';
        this.drawPattern(ctx, patternId, '#333333', width, height);
    }
    
    /**
     * Draw symbol preview
     */
    drawSymbolPreview(ctx, symbolId, width, height) {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Background
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);
        
        // Symbol
        ctx.fillStyle = '#333333';
        this.drawSymbol(ctx, symbolId, '#333333', width, height);
    }
    
    /**
     * Handle flag image upload
     */
    handleFlagUpload(file) {
        if (!file) return;
        
        // Check file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
            alert('File too large. Please choose an image under 2MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.currentFlag.uploadedImage = img;
                this.element.querySelector('#clear-uploaded-flag').style.display = 'block';
                this.updatePreview();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * Clear uploaded flag
     */
    clearUploadedFlag() {
        this.currentFlag.uploadedImage = null;
        this.element.querySelector('#flag-upload').value = '';
        this.element.querySelector('#clear-uploaded-flag').style.display = 'none';
        this.updatePreview();
    }
    
    /**
     * Randomize flag design
     */
    randomizeFlag() {
        // Random patterns
        if (Math.random() > 0.3) {
            const randomPattern1 = this.patterns[Math.floor(Math.random() * this.patterns.length)];
            this.selectPattern(randomPattern1.id, 'pattern1');
        }
        
        if (Math.random() > 0.6) {
            const randomPattern2 = this.patterns[Math.floor(Math.random() * this.patterns.length)];
            this.selectPattern(randomPattern2.id, 'pattern2');
        }
        
        // Random symbol
        if (Math.random() > 0.4) {
            const randomSymbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
            this.selectSymbol(randomSymbol.id);
        }
        
        // Random colors
        this.generateRandomColors();
    }
    
    /**
     * Generate random colors
     */
    generateRandomColors() {
        this.currentFlag.background = this.getRandomColor();
        this.currentFlag.pattern1Color = this.getRandomColor();
        this.currentFlag.pattern2Color = this.getRandomColor();
        this.currentFlag.symbolColor = this.getRandomColor();
        
        // Update color inputs
        this.element.querySelector('#background-color').value = this.currentFlag.background;
        this.element.querySelector('#pattern1-color').value = this.currentFlag.pattern1Color;
        this.element.querySelector('#pattern2-color').value = this.currentFlag.pattern2Color;
        this.element.querySelector('#symbol-color').value = this.currentFlag.symbolColor;
        
        this.updatePreview();
    }
    /**
     * Generate harmonious color palette
     */
    generateHarmoniousColors() {
        const baseHue = Math.random() * 360;
        
        // Generate complementary and analogous colors
        this.currentFlag.background = this.hslToHex(baseHue, 20, 90);
        this.currentFlag.pattern1Color = this.hslToHex((baseHue + 180) % 360, 70, 50);
        this.currentFlag.pattern2Color = this.hslToHex((baseHue + 60) % 360, 60, 60);
        this.currentFlag.symbolColor = this.hslToHex((baseHue + 30) % 360, 80, 30);
        
        // Update color inputs
        this.element.querySelector('#background-color').value = this.currentFlag.background;
        this.element.querySelector('#pattern1-color').value = this.currentFlag.pattern1Color;
        this.element.querySelector('#pattern2-color').value = this.currentFlag.pattern2Color;
        this.element.querySelector('#symbol-color').value = this.currentFlag.symbolColor;
        
        this.updatePreview();
    }
    
    /**
     * Reset colors to defaults
     */
    resetColors() {
        this.currentFlag.background = '#ffffff';
        this.currentFlag.pattern1Color = '#ff0000';
        this.currentFlag.pattern2Color = '#0000ff';
        this.currentFlag.symbolColor = '#000000';
        
        // Update color inputs
        this.element.querySelector('#background-color').value = this.currentFlag.background;
        this.element.querySelector('#pattern1-color').value = this.currentFlag.pattern1Color;
        this.element.querySelector('#pattern2-color').value = this.currentFlag.pattern2Color;
        this.element.querySelector('#symbol-color').value = this.currentFlag.symbolColor;
        
        this.updatePreview();
    }
    
    /**
     * Clear entire flag
     */
    clearFlag() {
        this.currentFlag.pattern1 = null;
        this.currentFlag.pattern2 = null;
        this.currentFlag.symbol = null;
        this.currentFlag.uploadedImage = null;
        
        // Update UI
        this.element.querySelector('#pattern1-name').textContent = 'None';
        this.element.querySelector('#pattern2-name').textContent = 'None';
        this.element.querySelector('#current-symbol-name').textContent = 'None';
        this.element.querySelector('#pattern1-status').textContent = 'None';
        this.element.querySelector('#pattern2-status').textContent = 'None';
        this.element.querySelector('#symbol-status').textContent = 'None';
        this.element.querySelector('#flag-upload').value = '';
        this.element.querySelector('#clear-uploaded-flag').style.display = 'none';
        
        this.resetColors();
    }
    
    /**
     * Setup layer drag and drop
     */
    setupLayerDragDrop() {
        const layerList = this.element.querySelector('#layer-list');
        let draggedElement = null;
        
        layerList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('layer-item') && !e.target.classList.contains('background-layer')) {
                draggedElement = e.target;
                e.target.style.opacity = '0.5';
            }
        });
        
        layerList.addEventListener('dragend', (e) => {
            if (e.target === draggedElement) {
                e.target.style.opacity = '';
                draggedElement = null;
            }
        });
        
        layerList.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        layerList.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedElement && e.target.closest('.layer-item') && 
                !e.target.closest('.layer-item').classList.contains('background-layer')) {
                
                const targetElement = e.target.closest('.layer-item');
                const allItems = Array.from(layerList.children);
                const draggedIndex = allItems.indexOf(draggedElement);
                const targetIndex = allItems.indexOf(targetElement);
                
                if (draggedIndex > targetIndex) {
                    layerList.insertBefore(draggedElement, targetElement);
                } else {
                    layerList.insertBefore(draggedElement, targetElement.nextSibling);
                }
                
                // Update layer order
                this.updateLayerOrder();
            }
        });
    }
    /**
     * Update layer rendering order based on DOM position
     */
    updateLayerOrder() {
        const layerItems = this.element.querySelectorAll('.layer-item');
        const newOrder = [];
        
        // Build order from DOM (reverse since we want top items to render last)
        for (let i = layerItems.length - 1; i >= 0; i--) {
            const layer = layerItems[i].dataset.layer;
            if (layer) {
                newOrder.push(layer);
            }
        }
        
        this.currentFlag.layers = newOrder;
        this.updatePreview();
    }
    
    /**
     * Get random color
     */
    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    
    /**
     * Convert HSL to Hex
     */
    hslToHex(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        
        if (0 <= h && h < 1/6) {
            r = c; g = x; b = 0;
        } else if (1/6 <= h && h < 2/6) {
            r = x; g = c; b = 0;
        } else if (2/6 <= h && h < 3/6) {
            r = 0; g = c; b = x;
        } else if (3/6 <= h && h < 4/6) {
            r = 0; g = x; b = c;
        } else if (4/6 <= h && h < 5/6) {
            r = x; g = 0; b = c;
        } else if (5/6 <= h && h < 1) {
            r = c; g = 0; b = x;
        }
        
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    /**
     * Capitalize first letter
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    /**
     * Get current flag data
     */
    getFlagData() {
        if (this.currentFlag.uploadedImage) {
            // Convert canvas to data URL for uploaded images
            return {
                type: 'uploaded',
                data: this.previewCanvas.toDataURL('image/png')
            };
        } else {
            // Return flag configuration
            return {
                type: 'designed',
                data: {
                    background: this.currentFlag.background,
                    pattern1: this.currentFlag.pattern1,
                    pattern1Color: this.currentFlag.pattern1Color,
                    pattern2: this.currentFlag.pattern2,
                    pattern2Color: this.currentFlag.pattern2Color,
                    symbol: this.currentFlag.symbol,
                    symbolColor: this.currentFlag.symbolColor,
                    symbolSize: this.currentFlag.symbolSize || 0.8,
                    layers: this.currentFlag.layers
                }
            };
        }
    }
    
    /**
     * Load flag from data
     */
    loadFlagData(flagData) {
        if (flagData.type === 'uploaded') {
            const img = new Image();
            img.onload = () => {
                this.currentFlag.uploadedImage = img;
                this.updatePreview();
            };
            img.src = flagData.data;
        } else if (flagData.type === 'designed') {
            const data = flagData.data;
            this.currentFlag.background = data.background || '#ffffff';
            this.currentFlag.pattern1 = data.pattern1 || null;
            this.currentFlag.pattern1Color = data.pattern1Color || '#ff0000';
            this.currentFlag.pattern2 = data.pattern2 || null;
            this.currentFlag.pattern2Color = data.pattern2Color || '#0000ff';
            this.currentFlag.symbol = data.symbol || null;
            this.currentFlag.symbolColor = data.symbolColor || '#000000';
            this.currentFlag.symbolSize = data.symbolSize || 0.8;
            this.currentFlag.layers = data.layers || ['background', 'pattern1', 'pattern2', 'symbol'];
            
            // Update UI
            this.updateUIFromFlag();
            this.updatePreview();
        }
    }
    
    /**
     * Update UI elements from current flag data
     */
    updateUIFromFlag() {
        // Update color inputs
        this.element.querySelector('#background-color').value = this.currentFlag.background;
        this.element.querySelector('#pattern1-color').value = this.currentFlag.pattern1Color;
        this.element.querySelector('#pattern2-color').value = this.currentFlag.pattern2Color;
        this.element.querySelector('#symbol-color').value = this.currentFlag.symbolColor;
        
        // Update pattern displays
        if (this.currentFlag.pattern1) {
            const pattern1 = this.patterns.find(p => p.id === this.currentFlag.pattern1);
            if (pattern1) {
                this.element.querySelector('#pattern1-name').textContent = pattern1.name;
                this.element.querySelector('#pattern1-status').textContent = pattern1.name;
            }
        }
        
        if (this.currentFlag.pattern2) {
            const pattern2 = this.patterns.find(p => p.id === this.currentFlag.pattern2);
            if (pattern2) {
                this.element.querySelector('#pattern2-name').textContent = pattern2.name;
                this.element.querySelector('#pattern2-status').textContent = pattern2.name;
            }
        }
        
        // Update symbol display
        if (this.currentFlag.symbol) {
            const symbol = this.symbols.find(s => s.id === this.currentFlag.symbol);
            if (symbol) {
                this.element.querySelector('#current-symbol-name').textContent = symbol.name;
                this.element.querySelector('#symbol-status').textContent = symbol.name;
            }
        }
        
        // Update symbol size
        const sizeSlider = this.element.querySelector('#symbol-size');
        const sizeDisplay = this.element.querySelector('#symbol-size-display');
        if (sizeSlider && sizeDisplay) {
            sizeSlider.value = this.currentFlag.symbolSize || 0.8;
            sizeDisplay.textContent = Math.round((this.currentFlag.symbolSize || 0.8) * 100) + '%';
        }
    }
}

// Make FlagDesigner globally available
window.FlagDesigner = FlagDesigner;