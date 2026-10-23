# Sports Management System Documentation

## Overview
The Sports Management System is a comprehensive addition to the Empire Builder game that allows players to own and manage professional sports teams. Players can build stadium wonders to unlock team management for Basketball, Hockey, and Soccer.

## System Architecture

### Core Components
1. **SportsSystem** (`systems/sports-system.js`) - Main system handling all sports logic
2. **TeamPanel** (`ui/components/TeamPanel.js`) - UI component for team management  
3. **Stadium Wonders** - Three wonders that unlock sports functionality
4. **Integration** - Seamless integration with existing game systems

## Features

### Stadium Wonders
- **Basketball Stadium**: $85M, Tech 1200 - Unlocks basketball team management
- **Hockey Arena**: $90M, Tech 1300 - Unlocks hockey team management  
- **Soccer Stadium**: $80M, Tech 1100 - Unlocks soccer team management

### Team Management
- **Team Creation**: $10M cost, includes stadium, roster, and coaching staff
- **25+ Players**: Full rosters with sport-specific positions and attributes
- **Coaching Staff**: Coaches with 4 attributes affecting team performance
- **Stadium Upgrades**: 5 categories with 10 levels each

### Player System
- **Dynamic Generation**: Realistic players with age, attributes, and potential
- **Development**: Age-based skill progression and decline
- **Injuries**: Realistic injury system with recovery time
- **Youth Academy**: Produces 16-18 year old prospects

### Match Simulation
- **Sport-Specific**: Different simulation engines for each sport
- **Realistic Scoring**: Appropriate scoring patterns for each game type
- **Event Tracking**: Minute-by-minute match events and statistics

### Tournament System
- **League Play**: Round-robin tournaments with standings
- **Cup Competitions**: Knockout tournaments
- **Championships**: Special high-stakes tournaments

### Gambling System
- **Multiple Bet Types**: Winner, over/under, exact score predictions
- **Dynamic Odds**: Calculated based on team strength
- **Bet Processing**: Automatic resolution when matches complete

## Technical Implementation

### File Structure
```
systems/
  └── sports-system.js          # Main sports system logic
ui/
  ├── components/
  │   └── TeamPanel.js          # Team management UI
  └── styles/
      └── team.css              # Sports UI styling
```

### Integration Points
1. **Wonder System**: Stadium wonders unlock sports functionality
2. **Nation Entity**: Teams are linked to nations via nation ID
3. **Bottom Menu**: Team tab appears when sports are available
4. **Save/Load**: Full state persistence for all sports data

### Event System Integration
- `sports:teamCreated` - When a team is created
- `sports:stadiumUpgraded` - When stadium facilities are upgraded
- `sports:matchCompleted` - When a match finishes
- `wonder_built` - When stadium wonders are constructed

## Usage Guide

### For Players
1. **Build Stadium Wonder**: Construct one of the three stadium wonders
2. **Create Team**: Use the Team tab to create your sports team
3. **Manage Team**: Upgrade facilities, manage players, hire coaches
4. **Compete**: Participate in tournaments and matches
5. **Bet**: Place bets on matches for additional income

### For Developers
1. **Initialize System**: Sports system automatically initializes with game engine
2. **Access API**: Use `window.gameEngine.systems.sports` to access sports methods
3. **Listen Events**: Hook into sports events for custom functionality
4. **Extend Features**: Add new sports, bet types, or tournament formats

## API Reference

### Main Methods
- `createTeam(data)` - Create a new sports team
- `upgradeStadium(data)` - Upgrade stadium facilities
- `simulateMatch(team1, team2)` - Simulate a match between teams
- `createTournament(sport, type)` - Create a new tournament
- `placeBet(data)` - Place a bet on a match

### Data Structures
- **Team**: Contains players, coach, stadium, stats, finances
- **Player**: Attributes, stats, contract, age, position
- **Match**: Teams, score, events, statistics
- **Tournament**: Participants, matches, standings, prizes

## Configuration

### Stadium Upgrade Categories
1. **Training Facilities**: Improves player development (+5% per level)
2. **Medical Center**: Reduces injury duration (-10% per level)
3. **Youth Academy**: Produces young talent (level = players per season)
4. **Fan Experience**: Increases capacity and revenue (+5k capacity, +10% revenue per level)
5. **Technology Center**: Advanced analytics (+5% performance per level)

### Sport-Specific Settings
- **Basketball**: 5 positions, 4 quarters, 12 minutes each
- **Hockey**: 6 positions, 3 periods, 20 minutes each  
- **Soccer**: 11 positions, 90 minutes + injury time

## Testing
Run `test-sports-system.html` to validate system functionality:
- System initialization
- Wonder requirements
- Team creation
- Match simulation
- Tournament system
- Gambling mechanics
- Save/load functionality

## Performance Considerations
- Daily processing runs every game hour (real-time hour)
- Match simulation is optimized for quick execution
- Player development calculated incrementally
- Tournament progression handled asynchronously

## Future Extensions
- Additional sports (American Football, Baseball, etc.)
- International competitions
- Player trading between nations
- Sponsorship and marketing systems
- Advanced statistics and analytics
- Multi-season career tracking