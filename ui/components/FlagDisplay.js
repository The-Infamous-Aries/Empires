/**
 * Flag Display Component - Shows nation flags in the UI
 * Dominion Wars - Nation Building Strategy Game
 */

class FlagDisplay {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            width: options.width || 60,
            height: options.height || 40,
            showBorder: options.showBorder !== false,
            borderColor: options.borderColor || '#444',
            clickable: options.clickable || false,
            ...options
        };
        
        this.flagData = null;
        this.canvas = null;
        this.ctx = null;
        
        this.createElement();
        this.bindEvents();
    }
    
    /**
     * Create the flag display element
     */
    createElement() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.canvas.className = 'flag-display';
        
        // Apply styling
        this.canvas.style.cssText = `
            display: block;
            border: ${this.options.showBorder ? `1px solid ${this.options.borderColor}` : 'none'};
            border-radius: 4px;
            ${this.options.clickable ? 'cursor: pointer;' : ''}
            transition: all 0.3s ease;
        `;
        
        // Add hover effect if clickable
        if (this.options.clickable) {
            this.canvas.style.cssText += `
                &:hover {
                    transform: scale(1.05);
                    border-color: var(--accent-color, #4a9eff);
                }
            `;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
        
        // Draw default flag
        this.drawDefaultFlag();
    }
    
    /**
     * Bind events
     */
    bindEvents() {
        // Listen for flag updates
        document.addEventListener('flagUpdated', (event) => {
            this.updateFlag(event.detail.flag);
        });
        
        // Click handler if clickable
        if (this.options.clickable) {
            this.canvas.addEventListener('click', () => {
                this.handleClick();
            });
        }
    }
    
    /**
     * Update flag display with new flag data
     */
    updateFlag(flagData) {
        this.flagData = flagData;
        this.drawFlag();
    }
    
    /**
     * Draw the flag on canvas
     */
    drawFlag() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.flagData) {
            this.drawDefaultFlag();
            return;
        }
        
        if (this.flagData.type === 'uploaded') {
            this.drawUploadedFlag();
        } else if (this.flagData.type === 'designed') {
            this.drawDesignedFlag();
        }
    }
    
    /**
     * Draw default flag
     */
    drawDefaultFlag() {
        const { width, height } = this.canvas;
        
        // Default flag is simple tricolor
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, width, height);
        
        this.ctx.fillStyle = '#ff4757';
        this.ctx.fillRect(0, 0, width, height / 3);
        
        this.ctx.fillStyle = '#0000ff';
        this.ctx.fillRect(0, height * 2/3, width, height / 3);
        
        // Add simple star in center
        this.drawStar(this.ctx, width/2, height/2, 5, Math.min(width, height)/8, Math.min(width, height)/16, '#ffffff');
    }
    
    /**
     * Draw uploaded flag image
     */
    drawUploadedFlag() {
        const img = new Image();
        img.onload = () => {
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        };
        img.src = this.flagData.data;
    }
    
    /**
     * Draw designed flag
     */
    drawDesignedFlag() {
        const data = this.flagData.data;
        const { width, height } = this.canvas;
        
        // Draw layers in order
        data.layers.forEach(layer => {
            if (layer === 'background') {
                this.drawBackground(data.background, width, height);
            } else if (layer === 'pattern1' && data.pattern1) {
                this.drawPattern(data.pattern1, data.pattern1Color, width, height);
            } else if (layer === 'pattern2' && data.pattern2) {
                this.drawPattern(data.pattern2, data.pattern2Color, width, height);
            } else if (layer === 'symbol' && data.symbol) {
                this.drawSymbol(data.symbol, data.symbolColor, width, height, data.symbolSize || 0.8);
            }
        });
    }
    
    /**
     * Draw background
     */
    drawBackground(color, width, height) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, width, height);
    }
    
    /**
     * Draw pattern (simplified versions for small display)
     */
    drawPattern(patternId, color, width, height) {
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        
        switch(patternId) {
            case 'horizontal-stripes-2':
                this.ctx.fillRect(0, 0, width, height/2);
                break;
            case 'horizontal-stripes-3':
                this.ctx.fillRect(0, 0, width, height/3);
                this.ctx.fillRect(0, height*2/3, width, height/3);
                break;
            case 'vertical-stripes-2':
                this.ctx.fillRect(0, 0, width/2, height);
                break;
            case 'vertical-stripes-3':
                this.ctx.fillRect(0, 0, width/3, height);
                this.ctx.fillRect(width*2/3, 0, width/3, height);
                break;
            case 'cross':
                this.ctx.fillRect(width/2 - 2, 0, 4, height);
                this.ctx.fillRect(0, height/2 - 2, width, 4);
                break;
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(width/2, height/2, Math.min(width, height)/4, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            // Add more simplified patterns as needed
        }
    }
    
    /**
     * Draw symbol (simplified versions for small display)
     */
    drawSymbol(symbolId, color, width, height, size = 0.8) {
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        
        const centerX = width / 2;
        const centerY = height / 2;
        const symbolSize = size * Math.min(width, height) / 6;
        
        switch(symbolId) {
            case 'star-5':
                this.drawStar(this.ctx, centerX, centerY, 5, symbolSize, symbolSize/2, color);
                break;
            case 'star-6':
                this.drawStar(this.ctx, centerX, centerY, 6, symbolSize, symbolSize/2, color);
                break;
            case 'circle-simple':
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, symbolSize, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 'square':
                this.ctx.fillRect(centerX - symbolSize, centerY - symbolSize, symbolSize * 2, symbolSize * 2);
                break;
            // Add more simplified symbols as needed
        }
    }
    
    /**
     * Draw a star symbol
     */
    drawStar(ctx, cx, cy, points, outerRadius, innerRadius, color) {
        let angle = -Math.PI / 2;
        const angleStep = Math.PI / points;
        
        ctx.fillStyle = color;
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
     * Handle click events
     */
    handleClick() {
        const event = new CustomEvent('flagClicked', {
            detail: { 
                flagData: this.flagData,
                displayElement: this.canvas
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Get flag data as image
     */
    getFlagAsImage() {
        return this.canvas.toDataURL('image/png');
    }
    
    /**
     * Resize the flag display
     */
    resize(width, height) {
        this.options.width = width;
        this.options.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.drawFlag();
    }
    
    /**
     * Destroy the flag display
     */
    destroy() {
        document.removeEventListener('flagUpdated', this.updateFlag);
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Make FlagDisplay globally available
window.FlagDisplay = FlagDisplay;