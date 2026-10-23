# Enhanced Map System Documentation

## Overview

The Enhanced Map System provides a comprehensive, interactive map interface for Empire 2 with advanced features including nation interactions, alliance view modes, zoom/pan functionality, and real-time nation management capabilities.

## Features

### 🗺️ Core Map Features
- **Infinite zoom and pan** - Zoom from 10% to 800% with smooth scrolling
- **High-performance rendering** - 60 FPS with smart caching and viewport culling
- **Responsive design** - Works on desktop, tablet, and mobile devices
- **Touch support** - Full touch and gesture support for mobile devices

### 👥 Nation Interaction System
- **Click to select** - Click on any nation's territory to select them
- **Right-click for details** - Right-click opens a comprehensive nation interaction panel
- **Real-time information** - View population, military, resources, and alliance status
- **Relationship management** - Mark nations as Friend/Foe/Best Friend/Nemesis (requires improvements)

### 🤝 Alliance View Mode
- **Toggle view modes** - Switch between Nation view and Alliance view
- **Alliance coloring** - All alliance members shown in unified colors
- **Alliance legend** - Visual legend showing all active alliances
- **Member information** - See alliance member counts and territories

### ⚔️ Military Actions
- **Declare war** - Direct war declaration from the map
- **Launch missiles** - Target nations with conventional missiles
- **Nuclear weapons** - Launch nuclear strikes (requires nuclear program)
- **Spy operations** - Initiate espionage missions (requires spy network)

### 🤝 Diplomatic Actions
- **Treaty proposals** - Propose various types of treaties
- **Aid packages** - Send economic or military aid
- **Relationship tracking** - Visual relationship status indicators

## Controls

### Keyboard Controls
| Key | Action |
|-----|--------|
| `W/A/S/D` or `Arrow Keys` | Pan camera |
| `+/-` or `Mouse Wheel` | Zoom in/out |
| `C` | Center view on origin |
| `V` | Toggle Nation/Alliance view mode |
| `G` | Toggle grid display |
| `L` | Toggle nation labels |
| `R` | Toggle resource indicators |
| `ESC` | Close all panels |

### Mouse Controls
| Action | Result |
|--------|--------|
| **Click** | Select nation |
| **Right Click** | Open nation interaction panel |
| **Drag** | Pan camera |
| **Scroll** | Zoom in/out |
| **Double Click** | Center on location |

### Touch Controls
- **Single finger drag** - Pan camera
- **Pinch gesture** - Zoom in/out
- **Tap** - Select nation
- **Long press** - Open nation panel

## UI Components

### View Mode Toggle
Located at the top center of the screen, allows switching between:
- **Nation View** - Each nation shown in its unique color
- **Alliance View** - Alliance members shown in unified alliance colors

### Map Controls Panel
Located at the top right, provides:
- Zoom in/out buttons
- Center view button
- Toggle grid display
- Toggle labels
- Toggle resource indicators

### Nation Interaction Panel
Comprehensive panel showing:
- **Basic Information** - Leader, population, land, infrastructure, alliance
- **Military Stats** - Soldiers, tanks, aircraft, ships
- **Relationship Status** - Current diplomatic relationship
- **Action Buttons** - All available diplomatic and military actions

### Alliance Legend
When in Alliance view mode, shows:
- All active alliances with their colors
- Member counts for each alliance
- Quick visual reference

## Integration with Game Systems

### Nation System Integration
- Automatically syncs with Nation entities
- Real-time updates when nation stats change
- Supports all existing nation properties and methods

### Alliance System Integration  
- Full integration with Alliance system
- Shows alliance memberships and colors
- Updates automatically when alliances change

### War System Integration
- Shows active wars with visual indicators
- Enables missile/nuke launches directly from map
- Real-time war status updates

### Diplomacy System Integration
- Displays current relationship statuses
- Enables treaty proposals and aid offers
- Shows diplomatic history and obligations

## Technical Implementation

### Performance Optimizations
- **Viewport culling** - Only renders visible territories
- **Render caching** - Caches rendered elements for performance
- **FPS limiting** - Maintains steady 60 FPS
- **Smart updates** - Only re-renders when necessary

### Responsive Design
- Adapts to different screen sizes
- Mobile-optimized touch controls
- Scalable UI elements

### Browser Compatibility
- Works in all modern browsers
- Hardware-accelerated canvas rendering
- Fallback support for older browsers

## Setup and Installation

### Automatic Integration
The Enhanced Map System automatically integrates with existing Empire 2 installations:

1. **Files are already included** in the main `index.html`
2. **Auto-initialization** occurs when the game loads
3. **No configuration required** - works out of the box

### Manual Initialization
If needed, you can manually initialize:

```javascript
// Manual initialization
await MapIntegration.initialize();

// Get renderer instance
const renderer = MapIntegration.getRenderer();
```

### Testing
Use the test file to verify installation:
- Open `test-enhanced-map.html` in a browser
- Should show a working map with test nations
- All controls and features should work

## Customization

### Colors
Nation and alliance colors are automatically generated but can be customized:

```javascript
// Custom nation color
nation.color = '#ff0000';

// Custom alliance color  
alliance.color = '#00ff00';
```

### UI Positioning
UI elements can be repositioned via CSS:

```css
.map-view-toggle {
    top: 10px;    /* Adjust vertical position */
    left: 10px;   /* Adjust horizontal position */
}
```

### Performance Tuning
Adjust performance settings:

```javascript
const renderer = MapIntegration.getRenderer();
renderer.renderFPS = 30;      // Lower FPS for slower devices
renderer.maxZoom = 10;        // Increase max zoom
renderer.minZoom = 0.05;      // Decrease min zoom
```

## API Reference

### MapIntegration
Main integration class that manages the enhanced map system.

#### Methods
- `initialize()` - Initialize the map system
- `getRenderer()` - Get the renderer instance
- `destroy()` - Clean up and destroy the system

### EnhancedMapRenderer
Main renderer class with all map functionality.

#### Methods
- `setViewMode(mode)` - Set view mode ('nation' or 'alliance')
- `zoomIn()` / `zoomOut()` - Zoom controls
- `centerView()` - Center camera on origin
- `pan(deltaX, deltaY)` - Pan camera
- `selectNation(nationId)` - Select a nation
- `openNationPanel(nationId)` - Open nation interaction panel

#### Properties
- `viewMode` - Current view mode
- `zoom` - Current zoom level
- `cameraX` / `cameraY` - Camera position
- `selectedNation` - Currently selected nation ID

## Events

The system emits various events through the EventBus:

```javascript
// Listen for nation selection
EventBus.on('nation_selected', (data) => {
    console.log('Nation selected:', data.nationId);
});

// Listen for view mode changes
EventBus.on('view_mode_changed', (data) => {
    console.log('View mode changed to:', data.mode);
});
```

## Troubleshooting

### Common Issues

#### Map not loading
- Check browser console for JavaScript errors
- Ensure all script files are loaded correctly
- Verify FontAwesome CSS is accessible

#### Performance issues
- Reduce zoom level range
- Lower FPS limit
- Disable grid or labels if not needed

#### UI elements not appearing
- Check CSS file is loaded correctly
- Verify FontAwesome icons are available
- Check for conflicting CSS styles

#### Nation data not showing
- Verify Nation and Player objects exist
- Check EventBus is working correctly
- Ensure game systems are initialized

### Debug Mode
Enable debug logging:

```javascript
const renderer = MapIntegration.getRenderer();
renderer.debugMode = true;  // Shows debug info overlay
```

## Future Enhancements

Planned features for future versions:
- **Territory battle animations** - Visual effects for active combat
- **Trade route visualization** - Show economic connections
- **Weather and climate overlay** - Environmental effects
- **Historical playback** - View territorial changes over time
- **Mini-map widget** - Always-visible overview map
- **Bookmark system** - Save favorite map locations
- **Screenshot functionality** - Export map images

## Support

For technical support or feature requests:
1. Check this documentation first
2. Review the browser console for errors
3. Test with the `test-enhanced-map.html` file
4. Report issues with detailed reproduction steps