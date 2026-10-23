/**
 * Image Utilities - Handle default images and processing
 * Dominion Wars - Nation Building Strategy Game
 */

class ImageUtils {
    /**
     * Create a default avatar canvas
     */
    static createDefaultAvatar(size = 120) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = size;
        canvas.height = size;
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#1d4ed8');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // User icon
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = `${size * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👤', size / 2, size / 2);
        
        return canvas.toDataURL('image/png');
    }
    
    /**
     * Create a default banner canvas
     */
    static createDefaultBanner(width = 400, height = 100) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#1f2937');
        gradient.addColorStop(0.5, '#374151');
        gradient.addColorStop(1, '#4b5563');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Banner text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = `${height * 0.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Your Empire Banner', width / 2, height / 2);
        
        return canvas.toDataURL('image/png');
    }
    
    /**
     * Resize image to fit constraints
     */
    static resizeImage(file, maxWidth, maxHeight, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw resized image
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to data URL
                const dataURL = canvas.toDataURL('image/jpeg', quality);
                resolve(dataURL);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }
    
    /**
     * Validate image file
     */
    static validateImage(file, maxSizeMB = 5) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        if (!validTypes.includes(file.type)) {
            throw new Error('Invalid file type. Please select a valid image file (JPEG, PNG, GIF, WebP).');
        }
        
        if (file.size > maxSizeMB * 1024 * 1024) {
            throw new Error(`File size too large. Maximum allowed size is ${maxSizeMB}MB.`);
        }
        
        return true;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ImageUtils };
}