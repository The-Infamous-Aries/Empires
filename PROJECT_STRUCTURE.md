# Dominion Wars - Project Structure

## Game Overview
A comprehensive nation-building strategy game inspired by Politics & War, War Era, and CyberNations, featuring real-time economic management, military strategy, diplomacy, and territorial expansion on an interactive world map.

## Directory Structure

### `/assets/`
Static game assets and resources
- `/images/` - All visual assets (icons, sprites, backgrounds, UI elements)
- `/sounds/` - Audio files (sound effects, background music)
- `/data/` - JSON data files (initial nation data, building templates, technology trees)

### `/core/`
Core game engine and fundamental systems
- `game-engine.js` - Main game loop, initialization, and state management
- `event-system.js` - Event handling and messaging between systems
- `data-manager.js` - Save/load functionality and data persistence
- `config.js` - Game configuration and constants

### `/systems/`
Independent game systems that handle specific mechanics
- `economy-system.js` - GDP, resources, taxation, trade
- `military-system.js` - Units, combat, defense calculations
- `diplomacy-system.js` - Alliances, treaties, relations
- `research-system.js` - Technology trees and advancement
- `population-system.js` - Citizens, happiness, growth
- `infrastructure-system.js` - Buildings, improvements, cities
- `territory-system.js` - Land expansion and control
- `time-system.js` - Game time progression and scheduling

### `/entities/`
Game object classes and data models
- `Nation.js` - Nation state and properties
- `City.js` - Individual city management
- `Building.js` - Building types and effects
- `MilitaryUnit.js` - Military unit definitions
- `Resource.js` - Resource types and management
- `Technology.js` - Research and tech advancement
- `Citizen.js` - Population management

### `/map/`
Interactive world map system
- `map-renderer.js` - Canvas-based map rendering
- `map-data.js` - World geography and territory definitions
- `map-interaction.js` - Click handling, zoom, pan
- `territory-manager.js` - Territory ownership and visualization

### `/ui/`
User interface components and styling
- `/components/` - Reusable UI components
  - `Modal.js` - Popup windows and dialogs
  - `Panel.js` - Information panels
  - `Chart.js` - Data visualization components
  - `Menu.js` - Navigation and menus
- `/styles/` - CSS styling files
  - `main.css` - Core game styling
  - `components.css` - UI component styles
  - `map.css` - Map-specific styling

### `/utils/`
Utility functions and helpers
- `math-utils.js` - Mathematical calculations
- `formatting.js` - Number and text formatting
- `validation.js` - Input validation
- `constants.js` - Game constants and enums

## Key Features to Implement

### Core Mechanics
1. **Nation Creation & Customization**
   - Name, flag, government type, policies
   - Starting resources and territory
   - Leader customization

2. **Economic Management**
   - GDP calculation and growth
   - Resource production and consumption
   - Taxation and government budget
   - Trade with other nations

3. **Military System**
   - Unit recruitment and maintenance
   - Combat calculations
   - Defense capabilities
   - Military technology

4. **Territory & Expansion**
   - Interactive world map
   - Territory acquisition
   - City founding and management
   - Infrastructure development

5. **Diplomacy & Relations**
   - Alliance system
   - Trade agreements
   - Declaration of war/peace
   - Reputation system

6. **Research & Technology**
   - Technology trees
   - Research point generation
   - Unlockable improvements
   - Military advancement

7. **Population Management**
   - Citizen happiness
   - Population growth
   - Workforce allocation
   - Social policies

### Technical Features
- Real-time game updates
- Interactive world map with zoom/pan
- Responsive UI with modal popups
- Save/load functionality
- Data visualization (charts, graphs)
- Sound effects and background music

## Development Phases

### Phase 1: Foundation
- Core game engine and state management
- Basic UI framework
- Simple map rendering

### Phase 2: Core Systems
- Economic system implementation
- Basic military mechanics
- Nation creation and customization

### Phase 3: Advanced Features
- Diplomacy and alliance system
- Research and technology
- Territory expansion mechanics

### Phase 4: Polish & Enhancement
- Visual improvements
- Sound integration
- Performance optimization
- Advanced AI for NPCs

## Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Graphics**: HTML5 Canvas for map rendering
- **Data**: JSON for game data and save files
- **Architecture**: Modular ES6 classes with event-driven communication